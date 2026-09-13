// =====================================================================
// Simulacion 3D de transito — Kennedy (fase 1: red vial + vehiculos)
// Reutiliza los mismos datos reales de SUMO que la version 2D
// (assets/kennedy_net.json y assets/kennedy_vehiculos.json).
// =====================================================================
(() => {
  const NET_URL = "./assets/kennedy_net.json";
  const VEHICULOS_JSON_URL = "./assets/kennedy_vehiculos.json";
  const BUILDINGS_URL = "./assets/kennedy_buildings.json";
  const TREES_URL = "./assets/kennedy_trees_real.json";
  const WATER_URL = "./assets/kennedy_water_bodies.json";
  const SCALE = 1 / 10; // las coordenadas del JSON llegan a ~10700 unidades; se escalan para Three.js

  const statusOverlay = document.getElementById("statusOverlay");
  function setStatus(text, show = true) {
    statusOverlay.textContent = text;
    statusOverlay.classList.toggle("hide", !show);
  }

  // ---- Escena, camara, render ----
  const canvas = document.getElementById("sceneCanvas");
  const wrap = document.getElementById("sceneWrap");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0c0f);
  scene.fog = new THREE.Fog(0x0b0c0f, 500, 2400);
  // Todo el contenido del mapa (vias, edificios, arboles, agua, vehiculos)
  // se agrega a este grupo, no directamente a la escena, para poder
  // rotarlo entero en X/Y/Z con los controles manuales de orientacion.
  // El usuario encontro que la orientacion correcta del plano necesita un
  // giro de 180° — se aplica aqui en el eje Y (vertical), no en Z, porque
  // un giro en Z tambien voltea la altura de los edificios boca abajo (Z
  // no es el eje "arriba" de esta escena); un giro en Y reordena el plano
  // igual mientras deja la altura intacta.
  const sceneRoot = new THREE.Group();
  // No se rota el grupo entero — el reacomodo del plano se hace de forma
  // pura dentro de toScene() (ver abajo), sin tocar la altura de nada.
  scene.add(sceneRoot);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 6000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Tamano visible (mitad de la altura del encuadre, en unidades de la
  // escena) para la proyeccion ortogonal — se ajusta al cargar la red.
  let viewSize = 260;
  function resize() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.left = -viewSize * aspect;
    camera.right = viewSize * aspect;
    camera.top = viewSize;
    camera.bottom = -viewSize;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  // Proyeccion paralela (axonometrica): se bloquea el angulo de la camara
  // en 45 grados fijo, y solo se permite girar alrededor (orbitar en el
  // plano horizontal) y hacer zoom — no inclinar mas ni menos.
  controls.minPolarAngle = Math.PI / 4;
  controls.maxPolarAngle = Math.PI / 4;
  controls.minZoom = 0.15;
  controls.maxZoom = 8;
  controls.enablePan = true;

  // ---- Luces (con sombras, tipo render arquitectonico) ----
  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xfff3e0, 1.15);
  scene.add(sun);
  scene.add(sun.target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 2600;
  sun.shadow.bias = -0.00015;
  sun.shadow.normalBias = 0.35; // reduce el parpadeo/artefactos de sombra (shadow acne)
  const SHADOW_FRUSTUM = 750;
  sun.shadow.camera.left = -SHADOW_FRUSTUM;
  sun.shadow.camera.right = SHADOW_FRUSTUM;
  sun.shadow.camera.top = SHADOW_FRUSTUM;
  sun.shadow.camera.bottom = -SHADOW_FRUSTUM;
  const rim = new THREE.DirectionalLight(0xdce8ff, 0.25);
  rim.position.set(-400, 200, -300);
  scene.add(rim);

  // Posicion del sol controlada por azimut/altura (grados), para poder
  // "mover las sombras" con los deslizadores de la interfaz.
  let sunAzimuth = 130, sunElevation = 45, sunDistance = 900;
  function updateSunPosition() {
    const az = sunAzimuth * Math.PI / 180, el = sunElevation * Math.PI / 180;
    sun.position.set(
      sunDistance * Math.cos(el) * Math.sin(az),
      sunDistance * Math.sin(el),
      sunDistance * Math.cos(el) * Math.cos(az)
    );
    sun.target.position.set(0, 0, 0);
  }
  updateSunPosition();

  // ---- Suelo ----
  let netCenter = { x: 0, y: 0 };
  let groundMesh = null;

  function buildGround(bbox) {
    const w = (bbox[2] - bbox[0]) * SCALE * 1.4;
    const h = (bbox[3] - bbox[1]) * SCALE * 1.4;
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshStandardMaterial({ color: 0x14171c, roughness: 1, metalness: 0 });
    groundMesh = new THREE.Mesh(geo, mat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, -0.4, 0);
    groundMesh.receiveShadow = true;
    sceneRoot.add(groundMesh);
  }

  // Convierte una coordenada del JSON (x,y en el plano, x=este, y=norte
  // real en UTM) a posicion 3D (x,z en Three.js, y=altura). El eje Z se
  // invierte (espejo, no rotacion) para que el plano quede orientado
  // correctamente — esto NO toca la altura (Y) de nada, a diferencia de
  // rotar el grupo entero.
  function toScene(x, y) {
    return { x: (x - netCenter.x) * SCALE, z: -(y - netCenter.y) * SCALE };
  }

  // ---- Red vial: una sola geometria de lineas fusionada (19 mil tramos,
  // asi que se combina TODO en un unico BufferGeometry por rendimiento) ----
  function buildRoads(edges) {
    const positions = [];
    edges.forEach(([kind, pts]) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const a = toScene(pts[i][0], pts[i][1]);
        const b = toScene(pts[i + 1][0], pts[i + 1][1]);
        positions.push(a.x, 0, a.z, b.x, 0, b.z);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0x4a545e, transparent: true, opacity: 0.85 });
    const lines = new THREE.LineSegments(geo, mat);
    sceneRoot.add(lines);

    // Una segunda capa mas gruesa "de asfalto" usando tiras (planos delgados)
    // para que las vias principales se vean como calles, no solo lineas.
    const ribbonGeo = new THREE.BufferGeometry();
    const ribbonPos = [];
    const HALF_W = 0.9;
    edges.forEach(([kind, pts]) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const a = toScene(pts[i][0], pts[i][1]);
        const b = toScene(pts[i + 1][0], pts[i + 1][1]);
        const dx = b.x - a.x, dz = b.z - a.z;
        const len = Math.hypot(dx, dz) || 0.001;
        const nx = -dz / len * HALF_W, nz = dx / len * HALF_W;
        // dos triangulos formando el rectangulo de la calle
        ribbonPos.push(
          a.x - nx, 0.03, a.z - nz, a.x + nx, 0.03, a.z + nz, b.x + nx, 0.03, b.z + nz,
          a.x - nx, 0.03, a.z - nz, b.x + nx, 0.03, b.z + nz, b.x - nx, 0.03, b.z - nz
        );
      }
    });
    ribbonGeo.setAttribute("position", new THREE.Float32BufferAttribute(ribbonPos, 3));
    ribbonGeo.computeVertexNormals();
    const ribbonMat = new THREE.MeshStandardMaterial({ color: 0x4a4f56, roughness: 0.92, side: THREE.DoubleSide });
    const roadMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    roadMesh.receiveShadow = true;
    sceneRoot.add(roadMesh);
  }

  // ---- Edificios: extrusion de cada huella (paredes + techo), TODO
  // fusionado en una sola geometria por rendimiento (143 mil edificios). ----
  function buildBuildings(buildings) {
    const positions = [];
    const normals = [];
    buildings.forEach(b => {
      const pts = b.pts.map(p => toScene(p[0], p[1]));
      const h = b.h * SCALE;
      if (pts.length < 4) return; // huella degenerada
      // Paredes: un rectangulo (2 triangulos) por cada segmento del perimetro
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], c = pts[i + 1];
        const dx = c.x - a.x, dz = c.z - a.z;
        const len = Math.hypot(dx, dz) || 0.001;
        const nx = dz / len, nz = -dx / len; // normal horizontal de la pared (hacia afuera)
        positions.push(
          a.x, 0, a.z, c.x, 0, c.z, c.x, h, c.z,
          a.x, 0, a.z, c.x, h, c.z, a.x, h, a.z
        );
        for (let k = 0; k < 6; k++) normals.push(nx, 0, nz);
      }
      // Techo: abanico de triangulos desde el primer punto (aproximacion
      // razonable para huellas mayormente convexas/rectangulares).
      for (let i = 1; i < pts.length - 2; i++) {
        positions.push(
          pts[0].x, h, pts[0].z, pts[i].x, h, pts[i].z, pts[i + 1].x, h, pts[i + 1].z
        );
        for (let k = 0; k < 3; k++) normals.push(0, 1, 0);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    const mat = new THREE.MeshStandardMaterial({ color: 0x6b727d, roughness: 0.7, metalness: 0.05, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    sceneRoot.add(mesh);
  }

  function loadBuildings() {
    return fetch(BUILDINGS_URL)
      .then(r => { if (!r.ok) throw new Error("no se pudo cargar " + BUILDINGS_URL); return r.json(); })
      .then(data => { buildBuildings(data); })
      .catch(err => console.warn("No se pudieron cargar los edificios:", err));
  }

  // ---- Arboles: se dibujan como "billboards cruzados" (2 tarjetas
  // perpendiculares) con una textura de arbol realista generada en un
  // canvas (tronco con ramas + follaje frondoso hecho de muchos circulos
  // superpuestos), en vez de geometria 3D solida — esta es la tecnica
  // estandar para tener miles de arboles con aspecto realista sin que la
  // pagina se ponga lenta. Se generan 3 variantes de textura (una vez,
  // al inicio) y se reparten entre los ~120 mil arboles reales. ----
  function makeTreeTexture(seed) {
    const W = 512, H = 640;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    let s = seed;
    function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }

    const trunkTopY = H * 0.42;
    const trunkBaseW = 20 + rnd() * 10;
    ctx.strokeStyle = "#5a4632"; ctx.lineCap = "round";
    ctx.lineWidth = trunkBaseW;
    ctx.beginPath(); ctx.moveTo(W / 2, H); ctx.lineTo(W / 2, trunkTopY); ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const branchY = H - (H - trunkTopY) * (0.3 + i * 0.25);
      const dir = i % 2 === 0 ? 1 : -1;
      ctx.lineWidth = trunkBaseW * (0.5 - i * 0.1);
      ctx.beginPath();
      ctx.moveTo(W / 2, branchY);
      ctx.lineTo(W / 2 + dir * (60 + rnd() * 60), branchY - 80 - rnd() * 60);
      ctx.stroke();
    }

    // Follaje: primero una masa base solida (silueta llena, sin huecos),
    // y encima muchos parches con degradado radial (borde suave, no un
    // circulo con canto duro) en tonos de verde variados, para que se
    // vea frondoso y con textura pero sin bordes pixelados/duros.
    const greens = ["#3c6b3a", "#4d7f45", "#5f9152", "#6fa561", "#437a4a", "#2f5c30"];
    const cx = W / 2, cy = H * 0.34, spread = W * 0.37;

    function softBlob(px, py, r, color, alpha) {
      const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
      grad.addColorStop(0, color);
      grad.addColorStop(0.7, color);
      grad.addColorStop(1, color.replace(")", ",0)").replace("rgb", "rgba"));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    }
    function hexToRgb(hex) {
      const n = parseInt(hex.slice(1), 16);
      return `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`;
    }

    // Masa base: pocos parches grandes, bien solidos, cubriendo toda la
    // silueta para que no queden huecos transparentes en el centro.
    for (let i = 0; i < 14; i++) {
      const ang = rnd() * Math.PI * 2, rad = rnd() * spread * 0.55;
      const px = cx + Math.cos(ang) * rad, py = cy + Math.sin(ang) * rad * 0.7;
      softBlob(px, py, spread * 0.55, hexToRgb(greens[Math.floor(rnd() * greens.length)]), 0.9);
    }
    // Detalle: parches mas chicos encima, para dar textura de hojas.
    for (let i = 0; i < 70; i++) {
      const ang = rnd() * Math.PI * 2, rad = Math.pow(rnd(), 0.5) * spread;
      const px = cx + Math.cos(ang) * rad, py = cy + Math.sin(ang) * rad * 0.72;
      const r = 22 + rnd() * 30;
      softBlob(px, py, r, hexToRgb(greens[Math.floor(rnd() * greens.length)]), 0.35 + rnd() * 0.25);
    }
    ctx.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  // Geometria de "tarjetas cruzadas": dos planos perpendiculares, para que
  // el arbol se vea bien desde cualquier angulo horizontal sin tener que
  // reorientar cada billboard hacia la camara en cada cuadro.
  function makeCrossGeometry() {
    const geo = new THREE.BufferGeometry();
    const positions = [
      -0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0,
      0, 0, -0.5, 0, 0, 0.5, 0, 1, 0.5, 0, 0, -0.5, 0, 1, 0.5, 0, 1, -0.5,
    ];
    const uvs = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1];
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }

  let treeMeshes = [];
  function buildTrees(trees) {
    const crossGeo = makeCrossGeometry();
    const variants = [makeTreeTexture(11), makeTreeTexture(97), makeTreeTexture(233)];
    const buckets = variants.map(tex => ({ tex, items: [] }));
    trees.forEach(t => { buckets[hash2(t[4]) % buckets.length].items.push(t); });

    treeMeshes = [];
    buckets.forEach(b => {
      if (!b.items.length) return;
      const mat = new THREE.MeshStandardMaterial({
        map: b.tex, transparent: true, alphaTest: 0.12, side: THREE.DoubleSide,
        roughness: 1, metalness: 0,
      });
      const mesh = new THREE.InstancedMesh(crossGeo, mat, b.items.length);
      mesh.castShadow = true;
      const dummyT = new THREE.Object3D();
      b.items.forEach((t, i) => {
        const [x, y, hMeters, , code] = t;
        const p = toScene(x, y);
        const h = Math.max(0.3, hMeters * SCALE);
        const w = h * (0.55 + (hash2(code) % 20) / 100);
        dummyT.position.set(p.x, 0, p.z);
        dummyT.scale.set(w, h, w);
        dummyT.rotation.set(0, (hash2(code) % 360) * Math.PI / 180, 0);
        dummyT.updateMatrix();
        mesh.setMatrixAt(i, dummyT.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      sceneRoot.add(mesh);
      treeMeshes.push({ mesh, data: b.items });
    });
  }
  function hash2(str) { let h = 0; for (const c of (str || "")) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

  function loadTrees() {
    return fetch(TREES_URL)
      .then(r => { if (!r.ok) throw new Error("no se pudo cargar " + TREES_URL); return r.json(); })
      .then(data => { buildTrees(data); })
      .catch(err => console.warn("No se pudieron cargar los árboles:", err));
  }

  // ---- Cuerpos de agua: poligonos planos (fan de triangulos) apenas
  // levantados del suelo, con un material azul semi-transparente. ----
  function buildWaterBodies(bodies) {
    const positions = [];
    bodies.forEach(w => {
      const pts = w.pts.map(p => toScene(p[0], p[1]));
      if (pts.length < 3) return;
      // Triangulacion real de poligono (ear-clipping), no un abanico
      // ingenuo desde un solo punto — los canales y rios son formas
      // largas y NO convexas, y un abanico simple genera triangulos que
      // se salen de la forma real (cruzando por fuera del poligono).
      const pts2d = pts.map(p => new THREE.Vector2(p.x, p.z));
      let tris;
      try { tris = THREE.ShapeUtils.triangulateShape(pts2d, []); }
      catch (e) { tris = []; }
      tris.forEach(([a, b, c]) => {
        positions.push(
          pts[a].x, 0.015, pts[a].z,
          pts[b].x, 0.015, pts[b].z,
          pts[c].x, 0.015, pts[c].z
        );
      });
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: 0x2f6fa8, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    const waterMesh = new THREE.Mesh(geo, mat);
    waterMesh.receiveShadow = true;
    sceneRoot.add(waterMesh);
  }

  function loadWaterBodies() {
    return fetch(WATER_URL)
      .then(r => { if (!r.ok) throw new Error("no se pudo cargar " + WATER_URL); return r.json(); })
      .then(data => { buildWaterBodies(data); })
      .catch(err => console.warn("No se pudieron cargar los cuerpos de agua:", err));
  }

  // ---- Vehiculos: un pool de cajas 3D reutilizables ----
  const VEH_POOL_SIZE = 2800;
  const vehMeshes = [];
  const vehMat = new THREE.MeshStandardMaterial({ color: 0xe2635a, roughness: 0.5, metalness: 0.15 });
  const vehGeo = new THREE.BoxGeometry(0.18, 0.15, 0.45);
  const vehInstanced = new THREE.InstancedMesh(vehGeo, vehMat, VEH_POOL_SIZE);
  vehInstanced.count = 0;
  vehInstanced.castShadow = true;
  sceneRoot.add(vehInstanced);
  const dummy = new THREE.Object3D();

  let timesteps = [];
  let playing = false;
  let currentTime = 0;
  let speed = 2;
  let lastFrameAt = null;

  const playBtn = document.getElementById("playPause");
  const slider = document.getElementById("timeSlider");
  const timeLabel = document.getElementById("timeLabel");
  const speedSelect = document.getElementById("speedSelect");

  function fmtTime(t) {
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function vehiclesAtTime(t) {
    if (!timesteps.length) return [];
    if (t <= timesteps[0].time) return timesteps[0].vehicles;
    const last = timesteps[timesteps.length - 1];
    if (t >= last.time) return last.vehicles;
    let lo = 0, hi = timesteps.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (timesteps[mid].time <= t) lo = mid; else hi = mid;
    }
    const a = timesteps[lo], b = timesteps[hi];
    const frac = (t - a.time) / (b.time - a.time || 1);
    const bMap = {}; b.vehicles.forEach(v => bMap[v.id] = v);
    return a.vehicles.map(v => {
      const bv = bMap[v.id];
      if (!bv) return v;
      return { id: v.id, x: v.x + (bv.x - v.x) * frac, y: v.y + (bv.y - v.y) * frac };
    });
  }

  let prevPositions = {};
  function renderVehiclesAt(t) {
    const vehicles = vehiclesAtTime(t);
    const n = Math.min(vehicles.length, VEH_POOL_SIZE);
    for (let i = 0; i < n; i++) {
      const v = vehicles[i];
      const p = toScene(v.x, v.y);
      const prev = prevPositions[v.id];
      let angle = 0;
      if (prev) { angle = Math.atan2(p.x - prev.x, p.z - prev.z); }
      dummy.position.set(p.x, 0.1, p.z);
      dummy.rotation.set(0, angle, 0);
      dummy.updateMatrix();
      vehInstanced.setMatrixAt(i, dummy.matrix);
      prevPositions[v.id] = p;
    }
    vehInstanced.count = n;
    vehInstanced.instanceMatrix.needsUpdate = true;
  }

  function finishLoadingTimesteps() {
    const totalTime = timesteps.length ? timesteps[timesteps.length - 1].time : 0;
    slider.max = String(Math.round(totalTime));
    slider.disabled = false;
    playBtn.disabled = false;
    setStatus("", false);
    timeLabel.textContent = `00:00 / ${fmtTime(totalTime)}`;
    renderVehiclesAt(0);
  }

  function loadVehicles() {
    return fetch(VEHICULOS_JSON_URL)
      .then(r => { if (!r.ok) throw new Error("no se pudo cargar " + VEHICULOS_JSON_URL); return r.json(); })
      .then(data => {
        timesteps = data.map(([time, vehicles]) => ({ time, vehicles: vehicles.map(([id, x, y]) => ({ id, x, y })) }));
        finishLoadingTimesteps();
      })
      .catch(err => {
        console.warn(err);
        setStatus("Red vial cargada. No se encontraron las trayectorias de vehículos (assets/kennedy_vehiculos.json).", true);
      });
  }

  fetch(NET_URL)
    .then(r => { if (!r.ok) throw new Error("no se pudo cargar " + NET_URL); return r.json(); })
    .then(data => {
      netCenter = { x: (data.bbox[0] + data.bbox[2]) / 2, y: (data.bbox[1] + data.bbox[3]) / 2 };
      buildGround(data.bbox);
      buildRoads(data.edges);
      const w = (data.bbox[2] - data.bbox[0]) * SCALE;
      const h = (data.bbox[3] - data.bbox[1]) * SCALE;
      viewSize = Math.max(w, h) * 0.14;
      resize();
      setAxonometricView(w);
      setStatus("Red cargada. Cargando edificios y trayectorias de vehículos…");
      loadBuildings();
      loadTrees();
      loadWaterBodies();
      return loadVehicles();
    })
    .catch(err => {
      console.error(err);
      setStatus("No se pudo cargar la red vial (assets/kennedy_net.json). Revisa que el archivo esté disponible.");
    });

  // ---- Controles de reproduccion ----
  playBtn.addEventListener("click", () => {
    playing = !playing;
    playBtn.innerHTML = playing ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    lastFrameAt = null;
  });
  slider.addEventListener("input", () => {
    currentTime = parseFloat(slider.value);
    renderVehiclesAt(currentTime);
    timeLabel.textContent = `${fmtTime(currentTime)} / ${fmtTime(parseFloat(slider.max))}`;
  });
  speedSelect.addEventListener("change", () => { speed = parseFloat(speedSelect.value); });

  // ---- Vista axonometrica fija: 45 grados de elevacion (bloqueado en
  // los controles) y 45 grados de acimut, proyeccion en paralelo (sin
  // fuga de perspectiva). ----
  function setAxonometricView(distance) {
    const d = distance || 400;
    const elev = Math.PI / 4, azim = Math.PI / 4;
    camera.position.set(
      d * Math.sin(elev) * Math.sin(azim),
      d * Math.cos(elev),
      d * Math.sin(elev) * Math.cos(azim)
    );
    controls.target.set(0, 0, 0);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
  }

  // ---- Botones de vista ----
  document.getElementById("viewReset").addEventListener("click", () => setAxonometricView(400));

  // ---- Rotacion manual del mapa completo (X/Y/Z), para que el usuario
  // pueda acomodar la orientacion a mano y luego copiar los grados
  // exactos que quedaron, para dejarlos fijos en el codigo. ----
  const rotX = document.getElementById("rotX"), rotY = document.getElementById("rotY"), rotZ = document.getElementById("rotZ");
  const rotXVal = document.getElementById("rotXVal"), rotYVal = document.getElementById("rotYVal"), rotZVal = document.getElementById("rotZVal");
  const rotateOutput = document.getElementById("rotateOutput");
  function updateRotation() {
    const dx = parseFloat(rotX.value), dy = parseFloat(rotY.value), dz = parseFloat(rotZ.value);
    sceneRoot.rotation.set(dx * Math.PI / 180, dy * Math.PI / 180, dz * Math.PI / 180);
    rotXVal.textContent = dx + "°"; rotYVal.textContent = dy + "°"; rotZVal.textContent = dz + "°";
    rotateOutput.value = `sceneRoot.rotation.set(\n  ${(dx * Math.PI / 180).toFixed(4)}, // X: ${dx}°\n  ${(dy * Math.PI / 180).toFixed(4)}, // Y: ${dy}°\n  ${(dz * Math.PI / 180).toFixed(4)}  // Z: ${dz}°\n);`;
  }
  [rotX, rotY, rotZ].forEach(el => el.addEventListener("input", updateRotation));
  document.getElementById("rotateReset").addEventListener("click", () => {
    rotX.value = 0; rotY.value = 0; rotZ.value = 0;
    updateRotation();
  });
  document.getElementById("rotateCopy").addEventListener("click", async () => {
    updateRotation();
    try { await navigator.clipboard.writeText(rotateOutput.value); } catch (err) {}
    rotateOutput.select();
  });
  updateRotation();

  // ---- Control del sol (mover las sombras) ----
  const sunAzInput = document.getElementById("sunAz"), sunElInput = document.getElementById("sunEl");
  const sunAzVal = document.getElementById("sunAzVal"), sunElVal = document.getElementById("sunElVal");
  function onSunChange() {
    sunAzimuth = parseFloat(sunAzInput.value);
    sunElevation = parseFloat(sunElInput.value);
    sunAzVal.textContent = sunAzimuth + "°";
    sunElVal.textContent = sunElevation + "°";
    updateSunPosition();
  }
  sunAzInput.addEventListener("input", onSunChange);
  sunElInput.addEventListener("input", onSunChange);

  // ---- Clic en un arbol: muestra su informacion (especie, altura) ----
  const raycaster = new THREE.Raycaster();
  const mouseNdc = new THREE.Vector2();
  const treeInfo = document.getElementById("treeInfo");
  const treeInfoName = document.getElementById("treeInfoName");
  const treeInfoDetails = document.getElementById("treeInfoDetails");
  document.getElementById("treeInfoClose").addEventListener("click", () => treeInfo.classList.remove("show"));

  let downAt = null;
  renderer.domElement.addEventListener("pointerdown", (e) => { downAt = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved > 6) return; // fue un arrastre de camara, no un clic
    if (!treeMeshes.length) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouseNdc, camera);
    let best = null;
    treeMeshes.forEach(tm => {
      const hits = raycaster.intersectObject(tm.mesh);
      if (hits.length && (!best || hits[0].distance < best.distance)) {
        best = { distance: hits[0].distance, data: tm.data[hits[0].instanceId] };
      }
    });
    if (best) {
      const [, , hMeters, nombre] = best.data;
      treeInfoName.textContent = nombre;
      treeInfoDetails.textContent = `Altura aproximada: ${hMeters.toFixed(1)} m`;
      treeInfo.classList.add("show");
    } else {
      treeInfo.classList.remove("show");
    }
  });

  // ---- Loop de animacion ----
  function animate(now) {
    requestAnimationFrame(animate);
    if (playing && timesteps.length) {
      if (lastFrameAt == null) lastFrameAt = now;
      const dt = (now - lastFrameAt) / 1000;
      lastFrameAt = now;
      currentTime += dt * speed;
      const maxT = parseFloat(slider.max) || 0;
      if (currentTime > maxT) currentTime = 0;
      slider.value = String(Math.round(currentTime));
      timeLabel.textContent = `${fmtTime(currentTime)} / ${fmtTime(maxT)}`;
      renderVehiclesAt(currentTime);
    }
    controls.update();
    renderer.render(scene, camera);
  }
  resize();
  requestAnimationFrame(animate);
})();
