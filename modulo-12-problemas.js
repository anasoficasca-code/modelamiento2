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
  const MANZANAS_URL = "./assets/kennedy_manzanas.json";
  const PARQUES_URL = "./assets/kennedy_parques.json";
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
  scene.background = new THREE.Color(0xf3f4f5);
  scene.fog = new THREE.Fog(0xf3f4f5, 900, 3200);
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
  renderer.shadowMap.type = THREE.BasicShadowMap;

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
  controls.maxZoom = 30;
  controls.enablePan = true;

  // ---- Luces (con sombras, tipo render arquitectonico) ----
  const ambient = new THREE.AmbientLight(0xffffff, 0.95);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 0.65);
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
  let roadMat = null, waterMat = null, parqueMat = null; // referencias para los selectores de color en vivo
  let waterTexRef = null, waterBumpRef = null; // texturas de agua, animadas en el loop de render
  let buildingEdgeMat = null; // referencia para ajustar su opacidad segun el zoom
  let groundMesh = null;

  function buildGround(bbox) {
    const w = (bbox[2] - bbox[0]) * SCALE * 1.4;
    const h = (bbox[3] - bbox[1]) * SCALE * 1.4;
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshStandardMaterial({ color: 0xeceeef, roughness: 1, metalness: 0 });
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

    // Segunda capa mas gruesa "de asfalto" usando una tira continua con
    // UNION DE ESQUINA (miter) en cada vertice interior — se promedia la
    // normal de los dos segmentos que se juntan ahi (en vez de tratar cada
    // segmento como un rectangulo independiente), para que las curvas
    // queden con un borde continuo y suave, sin muescas/quiebres.
    const ribbonGeo = new THREE.BufferGeometry();
    const ribbonPos = [];
    const ribbonUv = [];
    const RIBBON_UV_SCALE = 0.06;
    const HALF_W = 0.9;
    edges.forEach(([kind, pts], edgeIdx) => {
      // Desfase de altura MUY pequeno por via (no por segmento, para que
      // cada via quede perfectamente plana a lo largo de si misma), asi
      // las vias que se cruzan en una interseccion no quedan EXACTAMENTE
      // coplanares (evita z-fighting). El rango es minusculo para que no
      // se note como un "escalon" entre una via y la siguiente.
      const yJitter = 0.03 + ((edgeIdx * 2654435761) % 1000) / 1000 * 0.0006;
      const n = pts.length;
      if (n < 2) return;
      const scenePts = pts.map(p => toScene(p[0], p[1]));
      const segNormal = (p, q) => {
        const dx = q.x - p.x, dz = q.z - p.z;
        const len = Math.hypot(dx, dz) || 0.001;
        return { x: -dz / len, z: dx / len };
      };
      const vertNormals = new Array(n);
      for (let i = 0; i < n; i++) {
        if (i === 0) { vertNormals[i] = segNormal(scenePts[0], scenePts[1]); continue; }
        if (i === n - 1) { vertNormals[i] = segNormal(scenePts[n - 2], scenePts[n - 1]); continue; }
        const n1 = segNormal(scenePts[i - 1], scenePts[i]);
        const n2 = segNormal(scenePts[i], scenePts[i + 1]);
        let ax = n1.x + n2.x, az = n1.z + n2.z;
        const alen = Math.hypot(ax, az);
        if (alen < 0.05) { vertNormals[i] = n1; continue; } // giro casi en U, evitar division por ~0
        ax /= alen; az /= alen;
        const cosHalf = Math.max(ax * n1.x + az * n1.z, 0.25); // limitar el miter en angulos muy agudos
        vertNormals[i] = { x: ax / cosHalf, z: az / cosHalf };
      }
      for (let i = 0; i < n - 1; i++) {
        const a = scenePts[i], b = scenePts[i + 1];
        const na = vertNormals[i], nb = vertNormals[i + 1];
        const ax = na.x * HALF_W, az = na.z * HALF_W;
        const bx = nb.x * HALF_W, bz = nb.z * HALF_W;
        ribbonPos.push(
          a.x - ax, yJitter, a.z - az, a.x + ax, yJitter, a.z + az, b.x + bx, yJitter, b.z + bz,
          a.x - ax, yJitter, a.z - az, b.x + bx, yJitter, b.z + bz, b.x - bx, yJitter, b.z - bz
        );
        [
          [a.x - ax, a.z - az], [a.x + ax, a.z + az], [b.x + bx, b.z + bz],
          [a.x - ax, a.z - az], [b.x + bx, b.z + bz], [b.x - bx, b.z - bz],
        ].forEach(([px, pz]) => ribbonUv.push(px * RIBBON_UV_SCALE, pz * RIBBON_UV_SCALE));
      }
    });
    ribbonGeo.setAttribute("position", new THREE.Float32BufferAttribute(ribbonPos, 3));
    ribbonGeo.setAttribute("uv", new THREE.Float32BufferAttribute(ribbonUv, 2));
    ribbonGeo.computeVertexNormals();
    const viaTex = new THREE.TextureLoader().load("./assets/textura_via.jpg");
    viaTex.wrapS = THREE.RepeatWrapping;
    viaTex.wrapT = THREE.RepeatWrapping;
    const ribbonMat = new THREE.MeshStandardMaterial({
      map: viaTex, color: 0xb7babd, roughness: 0.85, side: THREE.DoubleSide,
      transparent: true, opacity: 0.7,
    });
    roadMat = ribbonMat;
    const roadMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    roadMesh.receiveShadow = true;
    sceneRoot.add(roadMesh);
  }

  // ---- Edificios: extrusion de cada huella (paredes + techo), TODO
  // fusionado en una sola geometria por rendimiento (143 mil edificios). ----
  // Desplaza cada vertice de un anillo cerrado (poligono con el primer
  // punto repetido al final) hacia ADENTRO una distancia fija, usando el
  // promedio de las normales de los 2 segmentos que se juntan en cada
  // vertice (mismo criterio de "miter" que ya se uso en las vias), para
  // que las esquinas no se deformen. Devuelve un anillo del mismo tamano
  // (tambien cerrado).
  // Area con signo de un anillo cerrado (formula shoelace) - se usa para
  // detectar si el anillo interior (offset) se invirtio por ser el
  // edificio demasiado chico para el offset pedido.
  function signedArea(pts) {
    let a = 0;
    for (let i = 0; i < pts.length - 1; i++) a += pts[i].x * pts[i + 1].z - pts[i + 1].x * pts[i].z;
    return a / 2;
  }

  function insetRing(pts, dist) {
    const m = pts.length - 1;
    if (m < 3) return pts.slice();
    const segNormalIn = (p, q) => {
      const dx = q.x - p.x, dz = q.z - p.z, len = Math.hypot(dx, dz) || 0.001;
      return { x: -dz / len, z: dx / len }; // hacia adentro (opuesta a la de pared)
    };
    const out = new Array(m);
    for (let i = 0; i < m; i++) {
      const prev = (i - 1 + m) % m, next = (i + 1) % m;
      const n1 = segNormalIn(pts[prev], pts[i]);
      const n2 = segNormalIn(pts[i], pts[next]);
      let ax = n1.x + n2.x, az = n1.z + n2.z;
      const alen = Math.hypot(ax, az);
      let nx, nz;
      if (alen < 0.05) { nx = n1.x; nz = n1.z; }
      else {
        ax /= alen; az /= alen;
        const cosHalf = Math.max(ax * n1.x + az * n1.z, 0.25);
        nx = ax / cosHalf; nz = az / cosHalf;
      }
      out[i] = { x: pts[i].x + nx * dist, z: pts[i].z + nz * dist };
    }
    out.push(out[0]);
    return out;
  }

  function buildBuildings(buildings) {
    const positions = [];
    const normals = [];
    const edgePositions = []; // lineas de borde: perimetro del techo + perimetro de la base + esquinas verticales (para que se lea el volumen completo), nada de lineas interiores
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
        edgePositions.push(a.x, h, a.z, c.x, h, c.z); // perimetro del techo
        edgePositions.push(a.x, 0, a.z, c.x, 0, c.z); // perimetro de la base (donde toca el piso)
        edgePositions.push(a.x, 0, a.z, a.x, h, a.z); // esquina vertical (para que se lea el volumen)
      }

      // Techo plano simple (sin parapeto sintetico): las mallas REALES de
      // techo del modelo Rhino (techos a dos aguas y techos planos con
      // parapeto ya modelado) se cargan por separado y quedan encima de
      // esta tapa, dandole el detalle real. Tener ademas un parapeto
      // aproximado aqui hacia que ambas geometrias compitieran/se vieran
      // mal superpuestas.
      const pts2d = pts.map(p => new THREE.Vector2(p.x, p.z));
      let tris;
      try { tris = THREE.ShapeUtils.triangulateShape(pts2d, []); }
      catch (e) { tris = []; }
      tris.forEach(([ia, ib, ic]) => {
        positions.push(
          pts[ia].x, h, pts[ia].z, pts[ib].x, h, pts[ib].z, pts[ic].x, h, pts[ic].z
        );
        for (let k = 0; k < 3; k++) normals.push(0, 1, 0);
      });
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.6, metalness: 0.03, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, // evita z-fighting con las lineas de borde (que quedan exactamente sobre la superficie)
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    sceneRoot.add(mesh);

    // Borde oscuro de cada edificio: perimetro del techo + esquinas
    // verticales (sin lineas internas), para que se lea como un volumen
    // real y no una silueta plana.
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x2b2e33, transparent: true, opacity: 0.2 });
    buildingEdgeMat = edgeMat;
    sceneRoot.add(new THREE.LineSegments(edgeGeo, edgeMat));
  }

  function loadBuildings() {
    return fetch(BUILDINGS_URL)
      .then(r => { if (!r.ok) throw new Error("no se pudo cargar " + BUILDINGS_URL); return r.json(); })
      .then(data => { buildBuildings(data); })
      .catch(err => console.warn("No se pudieron cargar los edificios:", err));
  }

  // ---- Arboles: se dibujan como "billboards cruzados" (2 tarjetas
  // perpendiculares) con una foto real de un arbol (fondo quitado),
  // en vez de una textura dibujada o geometria 3D solida. ----

  // Geometria de una sola tarjeta (plano vertical). Como la camara esta
  // fija a 45° de elevacion (solo gira horizontalmente alrededor), esta
  // tarjeta se reorienta para mirar siempre hacia la camara (billboard
  // real, no un cruce estatico de 2-3 planos que deja ver una "X" desde
  // ciertos angulos).
  function makePlaneGeometry() {
    const geo = new THREE.BufferGeometry();
    const positions = [-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0];
    const uvs = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1];
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }

  let treeMeshes = [];
  let treeInstanceData = null; // {x,z,w,h} por instancia, para recalcular el billboard al girar la camara
  let treeMesh = null;
  function buildTrees(trees) {
    const treeTex = new THREE.TextureLoader().load("./assets/arbol_real3.png");
    // Tarjeta plana (billboard) con la foto real completa (ya incluye
    // tronco y copa) — se pidio que se vea igual que la foto, no un
    // volumen 3D armado con esfera+cilindro por separado.
    const planeGeo = makePlaneGeometry();
    const mat = new THREE.MeshStandardMaterial({
      map: treeTex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.95,
    });
    const mesh = new THREE.InstancedMesh(planeGeo, mat, trees.length);
    mesh.castShadow = false;
    treeMesh = mesh;

    treeInstanceData = new Array(trees.length);
    trees.forEach((t, i) => {
      const [x, y, hMeters, , code] = t;
      const p = toScene(x, y);
      const h = Math.max(0.3, hMeters * SCALE);
      const w = h * (1.1 + (hash2(code) % 20) / 100 - 0.1);
      treeInstanceData[i] = { x: p.x, z: p.z, w, h };
    });
    sceneRoot.add(mesh);
    treeMeshes = [{ mesh, data: trees }];
    updateTreeBillboards();
  }
  // Recalcula la rotacion de TODAS las tarjetas para que miren hacia la
  // camara actual. Con camara ortografica la direccion hacia la camara es
  // la misma sin importar la posicion en el suelo, asi que un solo angulo
  // (el acimut actual de la camara) sirve para todas las instancias.
  const dummyT = new THREE.Object3D();
  function updateTreeBillboards() {
    if (!treeMesh || !treeInstanceData) return;
    const dx = camera.position.x - controls.target.x, dz = camera.position.z - controls.target.z;
    const faceAngle = Math.atan2(dx, dz);
    for (let i = 0; i < treeInstanceData.length; i++) {
      const d = treeInstanceData[i];
      dummyT.position.set(d.x, 0, d.z);
      dummyT.scale.set(d.w, d.h, d.w);
      dummyT.rotation.set(0, faceAngle, 0);
      dummyT.updateMatrix();
      treeMesh.setMatrixAt(i, dummyT.matrix);
    }
    treeMesh.instanceMatrix.needsUpdate = true;
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
    const uvs = [];
    const UV_SCALE = 0.08; // repite la textura cada ~12.5 unidades de escena
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
        [a, b, c].forEach(idx => {
          positions.push(pts[idx].x, 0.022, pts[idx].z);
          uvs.push(pts[idx].x * UV_SCALE, pts[idx].z * UV_SCALE);
        });
      });
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    const waterTex = new THREE.TextureLoader().load("./assets/textura_agua2.jpg");
    waterTex.wrapS = THREE.RepeatWrapping;
    waterTex.wrapT = THREE.RepeatWrapping;
    waterTexRef = waterTex;
    // Segunda copia de la misma textura, usada como relieve (bump map) en
    // vez de color: le da micro-relieve a la superficie para que capte
    // la luz de forma irregular (brillos/reflejos que cambian segun el
    // angulo), como agua real — una superficie perfectamente lisa se ve
    // "plana"/pintada, no renderizada. Se anima a otra velocidad/escala
    // que la capa de color, simulando dos capas de oleaje superpuestas.
    const bumpTex = new THREE.TextureLoader().load("./assets/textura_agua2.jpg");
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(2.3, 2.3);
    waterBumpRef = bumpTex;
    const mat = new THREE.MeshStandardMaterial({
      map: waterTex, bumpMap: bumpTex, bumpScale: 0.12,
      color: 0x97a5af, roughness: 0.18, metalness: 0.15,
      transparent: true, opacity: 0.82, side: THREE.DoubleSide,
    });
    waterMat = mat;
    const waterMesh = new THREE.Mesh(geo, mat);
    waterMesh.receiveShadow = false; // sin sombras encima (se veian como parches/bloques feos sobre el agua)
    sceneRoot.add(waterMesh);
  }

  function loadWaterBodies() {
    return fetch(WATER_URL)
      .then(r => { if (!r.ok) throw new Error("no se pudo cargar " + WATER_URL); return r.json(); })
      .then(data => { buildWaterBodies(data); })
      .catch(err => console.warn("No se pudieron cargar los cuerpos de agua:", err));
  }

  // ---- Manzanas: solo el CONTORNO (LineSegments), no un poligono relleno.
  // Se dibuja como lineas delgadas, igual que la capa base de la red vial,
  // para evitar por completo el riesgo de parpadeo (z-fighting) que si
  // tendria una superficie rellena compitiendo con vias/agua a alturas
  // parecidas. Altura propia (0.006) distinta de todo lo demas. ----
  function buildManzanas(manzanas) {
    const positions = [];
    manzanas.forEach(m => {
      const pts = m.pts.map(p => toScene(p[0], p[1]));
      for (let i = 0; i < pts.length - 1; i++) {
        positions.push(pts[i].x, 0.006, pts[i].z, pts[i + 1].x, 0.006, pts[i + 1].z);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0x8a8f96, transparent: true, opacity: 0.5 });
    sceneRoot.add(new THREE.LineSegments(geo, mat));
  }

  function loadManzanas() {
    return fetch(MANZANAS_URL)
      .then(r => { if (!r.ok) throw new Error("no se pudo cargar " + MANZANAS_URL); return r.json(); })
      .then(data => { buildManzanas(data); })
      .catch(err => console.warn("No se pudieron cargar las manzanas:", err));
  }

  // ---- Parques/zonas verdes: poligonos rellenos, triangulacion real
  // (ear-clipping) igual que agua y edificios, en una altura propia
  // (0.02) que no compite con via/agua/manzanas. ----
  function buildParques(parques) {
    const positions = [];
    const uvs = [];
    const UV_SCALE = 0.006; // la mitad de antes, porque el tile espejado ahora es 2x mas grande (para mantener el mismo tamano de grano)
    parques.forEach(p => {
      const pts = p.pts.map(pt => toScene(pt[0], pt[1]));
      if (pts.length < 3) return;
      const pts2d = pts.map(pt => new THREE.Vector2(pt.x, pt.z));
      let tris;
      try { tris = THREE.ShapeUtils.triangulateShape(pts2d, []); }
      catch (e) { tris = []; }
      tris.forEach(([a, b, c]) => {
        [a, b, c].forEach(idx => {
          positions.push(pts[idx].x, 0.02, pts[idx].z);
          uvs.push(pts[idx].x * UV_SCALE, pts[idx].z * UV_SCALE);
        });
      });
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    const pastoTex = new THREE.TextureLoader().load("./assets/textura_pasto.jpg");
    pastoTex.wrapS = THREE.RepeatWrapping;
    pastoTex.wrapT = THREE.RepeatWrapping;
    const mat = new THREE.MeshStandardMaterial({ map: pastoTex, color: 0xadaa90, roughness: 0.95, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    parqueMat = mat;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    sceneRoot.add(mesh);
  }

  function loadParques() {
    return fetch(PARQUES_URL)
      .then(r => { if (!r.ok) throw new Error("no se pudo cargar " + PARQUES_URL); return r.json(); })
      .then(data => { buildParques(data); })
      .catch(err => console.warn("No se pudieron cargar los parques:", err));
  }

  // ---- Semaforos 3D + cruces peatonales, en un conjunto reducido y bien
  // espaciado de intersecciones reales (287, fusionando nodos cercanos de
  // la red vial) — NO en cada nodo donde se juntan tramos, ya que eso
  // fue un desastre visual antes (SUMO separa carriles en tramos propios,
  // dando miles de "cruces" falsos). ----
  let intersectionsData = null;
  let intersectionMeshes = []; // para poder quitarlas y reconstruir al mover los deslizadores
  let interParams = { setback: 1.3, crossW: 1.0, poleOffset: 1.1 };
  function buildIntersections(intersections) {
    intersectionsData = intersections;
    intersectionMeshes.forEach(m => { sceneRoot.remove(m); m.geometry.dispose(); });
    intersectionMeshes = [];

    const poleGeo = new THREE.CylinderGeometry(0.05, 0.06, 1, 6);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x33383d, roughness: 0.6 });
    const headGeo = new THREE.BoxGeometry(0.16, 0.42, 0.16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x1c1f22, roughness: 0.5 });
    const lightGeo = new THREE.CircleGeometry(0.06, 10);
    const lightColors = [0xe14b3f, 0xe8b93f, 0x4bb35a];

    let poleCount = 0;
    intersections.forEach(inter => (poleCount += Math.min(inter.dirs.length, 4)));
    const poleMesh = new THREE.InstancedMesh(poleGeo, poleMat, poleCount);
    const headMesh = new THREE.InstancedMesh(headGeo, headMat, poleCount);
    poleMesh.castShadow = true; headMesh.castShadow = true;
    const lightMeshes = lightColors.map(color =>
      new THREE.InstancedMesh(lightGeo, new THREE.MeshBasicMaterial({ color }), poleCount)
    );

    const dummy = new THREE.Object3D();
    const crossPos = []; // posiciones de las rayas de cruce peatonal
    const POLE_H = 4.2 * SCALE;
    const SETBACK = interParams.setback, CROSS_W = interParams.crossW, POLE_OFFSET = interParams.poleOffset;
    let idx = 0;
    intersections.forEach(inter => {
      const center = toScene(inter.x, inter.y);
      inter.dirs.slice(0, 4).forEach(([dx, dy]) => {
        // direccion real -> direccion en la escena (toScene invierte Y)
        const ux = dx, uz = -dy;
        const px = -uz, pz = ux; // perpendicular (ancho de la via)
        // Poste del semaforo, a un lado del acceso, cerca de la esquina.
        const poleX = center.x + ux * (SETBACK - 0.7) + px * POLE_OFFSET;
        const poleZ = center.z + uz * (SETBACK - 0.7) + pz * POLE_OFFSET;
        dummy.position.set(poleX, POLE_H / 2, poleZ);
        dummy.scale.set(1, POLE_H, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        poleMesh.setMatrixAt(idx, dummy.matrix);
        const faceAngle = Math.atan2(-ux, -uz); // el semaforo mira hacia el que se acerca
        dummy.position.set(poleX, POLE_H + 0.14, poleZ);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, faceAngle, 0);
        dummy.updateMatrix();
        headMesh.setMatrixAt(idx, dummy.matrix);
        const lightYs = [POLE_H + 0.34, POLE_H + 0.21, POLE_H + 0.08];
        lightMeshes.forEach((lm, li) => {
          dummy.position.set(poleX + Math.sin(faceAngle) * 0.05, lightYs[li], poleZ + Math.cos(faceAngle) * 0.05);
          dummy.rotation.set(0, faceAngle, 0);
          dummy.updateMatrix();
          lm.setMatrixAt(idx, dummy.matrix);
        });
        idx++;

        // Cruce peatonal (rayas) atravesando este acceso, antes de llegar
        // al centro de la interseccion. Cada raya es angosta en el
        // sentido transversal a la via (px,pz) y larga en el sentido de
        // avance (ux,uz) — como una cebra real — con huecos claros entre
        // rayas consecutivas.
        const baseX = center.x + ux * SETBACK, baseZ = center.z + uz * SETBACK;
        const CROSSING_LEN = 3.2, STRIPE_W = 0.32, STRIPE_GAP2 = 0.28;
        for (let s = -CROSS_W; s <= CROSS_W; s += STRIPE_W + STRIPE_GAP2) {
          const c0x = baseX + px * s, c0z = baseZ + pz * s;
          const c1x = c0x + ux * CROSSING_LEN, c1z = c0z + uz * CROSSING_LEN;
          const hx = px * (STRIPE_W / 2), hz = pz * (STRIPE_W / 2);
          crossPos.push(
            c0x - hx, 0.034, c0z - hz, c0x + hx, 0.034, c0z + hz, c1x + hx, 0.034, c1z + hz,
            c0x - hx, 0.034, c0z - hz, c1x + hx, 0.034, c1z + hz, c1x - hx, 0.034, c1z - hz
          );
        }
      });
    });
    poleMesh.instanceMatrix.needsUpdate = true;
    headMesh.instanceMatrix.needsUpdate = true;
    lightMeshes.forEach(lm => (lm.instanceMatrix.needsUpdate = true));
    sceneRoot.add(poleMesh, headMesh, ...lightMeshes);
    intersectionMeshes.push(poleMesh, headMesh, ...lightMeshes);

    const crossGeo = new THREE.BufferGeometry();
    crossGeo.setAttribute("position", new THREE.Float32BufferAttribute(crossPos, 3));
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const crossMesh = new THREE.Mesh(crossGeo, crossMat);
    sceneRoot.add(crossMesh);
    intersectionMeshes.push(crossMesh);
  }
  function rebuildIntersections() {
    if (intersectionsData) buildIntersections(intersectionsData);
  }

  function loadIntersections() {
    return fetch("./assets/kennedy_intersecciones.json")
      .then(r => { if (!r.ok) throw new Error("no se pudo cargar intersecciones"); return r.json(); })
      .then(data => { buildIntersections(data); })
      .catch(err => console.warn("No se pudieron cargar las intersecciones:", err));
  }

  // ---- Mallas reales exportadas del modelo Rhino (techos a dos aguas,
  // techos planos con parapeto ya modelado, fachadas verificadas, agua) —
  // formato generico {verts:[[x,y,z_metros],...], tris:[[a,b,c],...]}. ----
  function buildTriMesh(data, color, opts) {
    const positions = [];
    const scenePts = data.verts.map(v => {
      const p = toScene(v[0], v[1]);
      return { x: p.x, y: v[2] * SCALE, z: p.z };
    });
    data.tris.forEach(([a, b, c]) => {
      const pa = scenePts[a], pb = scenePts[b], pc = scenePts[c];
      if (!pa || !pb || !pc) return;
      positions.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z, pc.x, pc.y, pc.z);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.02, side: THREE.DoubleSide, ...opts });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    sceneRoot.add(mesh);
    return mesh;
  }
  function loadTriMesh(url, color, opts) {
    return fetch(url)
      .then(r => { if (!r.ok) throw new Error("no se pudo cargar " + url); return r.json(); })
      .then(data => buildTriMesh(data, color, opts))
      .catch(err => { console.warn("No se pudo cargar la malla " + url + ":", err); return null; });
  }

  // ---- Terreno real (relieve, 0-22m de altura) extraido del modelo Rhino,
  // en vez de un plano completamente liso. Se mantiene tambien el plano
  // liso original, un poco mas abajo, como base/respaldo por si el
  // terreno real no cubre alguna zona del borde. ----
  let terrainMesh = null;
  function loadTerrain() {
    return loadTriMesh("./assets/kennedy_terreno.json", 0xe4e6e2, { roughness: 0.95, metalness: 0 })
      .then(mesh => {
        if (!mesh) return;
        mesh.castShadow = false; // el suelo no necesita proyectar sombra sobre si mismo
        mesh.position.y += 0.001; // apenas encima del plano liso de respaldo
        terrainMesh = mesh;
      });
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

  let lastAngle = {}; // rumbo persistente por vehiculo, para no perderlo cuando esta detenido
  function vehiclesAtTime(t) {
    if (!timesteps.length) return [];
    if (t <= timesteps[0].time) return timesteps[0].vehicles.map(v => ({ id: v.id, x: v.x, y: v.y }));
    const last = timesteps[timesteps.length - 1];
    if (t >= last.time) return last.vehicles.map(v => ({ id: v.id, x: v.x, y: v.y }));
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
      if (!bv) return { id: v.id, x: v.x, y: v.y };
      // El rumbo se calcula con el DESPLAZAMIENTO REAL entre 2 pasos de
      // la simulacion (no entre cuadros de animacion): si el vehiculo esta
      // detenido o casi detenido en una fila (semaforo, trancon), ese
      // vector es casi cero y dar un angulo con eso sale ruidoso/al azar
      // (los carros en diagonal de la captura). Solo se actualiza el
      // angulo cuando el vehiculo se movio una distancia real
      // significativa; si no, se mantiene el ultimo rumbo conocido.
      const pa = toScene(v.x, v.y), pb = toScene(bv.x, bv.y);
      const dx = pb.x - pa.x, dz = pb.z - pa.z;
      if (Math.hypot(dx, dz) > 0.05) lastAngle[v.id] = Math.atan2(dx, dz);
      return { id: v.id, x: v.x + (bv.x - v.x) * frac, y: v.y + (bv.y - v.y) * frac };
    });
  }

  function renderVehiclesAt(t) {
    const vehicles = vehiclesAtTime(t);
    const n = Math.min(vehicles.length, VEH_POOL_SIZE);
    for (let i = 0; i < n; i++) {
      const v = vehicles[i];
      const p = toScene(v.x, v.y);
      const angle = lastAngle[v.id] || 0;
      dummy.position.set(p.x, 0.1, p.z);
      dummy.rotation.set(0, angle, 0);
      dummy.updateMatrix();
      vehInstanced.setMatrixAt(i, dummy.matrix);
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
      loadManzanas();
      loadParques();
      // loadIntersections(); // quitado: semaforos/cruces peatonales, a pedido del usuario
      loadTriMesh("./assets/kennedy_roofs_flat.json", 0xffffff);    // techos planos con parapeto ya modelado
      loadTriMesh("./assets/kennedy_facades.json", 0xa05a41);       // fachadas verificadas con StreetView
      // loadTerrain(); // quitado a pedido del usuario, vuelve al plano liso
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
    // Vista inicial fija que el usuario dejo lista (posicion, objetivo y
    // zoom exactos), en vez de calcularla a partir del tamano de la red.
    // Se verifico que la elevacion sigue siendo exactamente 45° (proyeccion
    // paralela/axonometrica intacta).
    camera.position.set(56.88, 700.96, 649.09);
    controls.target.set(178.42, -54.42, -96.45);
    camera.zoom = 1.0;
    camera.updateProjectionMatrix();
  }

  // ---- Botones de vista ----
  document.getElementById("viewReset").addEventListener("click", () => setAxonometricView(400));

  // ---- Rotacion manual del mapa completo (X/Y/Z), para que el usuario
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

  // ---- Selectores de color en vivo (agua, vias, verde) ----
  const colorAgua = document.getElementById("colorAgua");
  const colorVia = document.getElementById("colorVia");
  const colorVerde = document.getElementById("colorVerde");
  const colorOutput = document.getElementById("colorOutput");
  function updateColorOutput() {
    colorOutput.value =
      `Agua:  ${colorAgua.value}\nVías:  ${colorVia.value}\nVerde: ${colorVerde.value}`;
  }
  colorAgua.addEventListener("input", () => {
    if (waterMat) waterMat.color.set(colorAgua.value);
    updateColorOutput();
  });
  colorVia.addEventListener("input", () => {
    if (roadMat) roadMat.color.set(colorVia.value);
    updateColorOutput();
  });
  colorVerde.addEventListener("input", () => {
    if (parqueMat) parqueMat.color.set(colorVerde.value);
    updateColorOutput();
  });
  updateColorOutput();

  // ---- Herramienta de dibujo: clic para ir marcando puntos sobre el
  // mapa (como la pluma de Photoshop), y mostrar las coordenadas REALES
  // (mismo sistema que usan los demas archivos de datos) para copiar y
  // pegar, por ejemplo para trazar una nueva zona verde a mano. ----
  const raycaster = new THREE.Raycaster();
  // ---- Clic en un arbol: muestra su informacion (especie, altura) ----
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
    // Lineas de borde de edificios: opacidad FIJA y baja, no cambia con
    // el zoom (asi no se ven gruesas/densas cuando no se esta haciendo
    // zoom, y no cambian de aspecto al acercar/alejar la camara).
    // Agua con movimiento: se desplaza lentamente la textura de color Y
    // la capa de relieve (bump) a velocidades/escalas DISTINTAS entre si,
    // simulando dos capas de oleaje superpuestas.
    if (waterTexRef) {
      waterTexRef.offset.x = (now * 0.000018) % 1;
      waterTexRef.offset.y = (now * 0.000012) % 1;
    }
    if (waterBumpRef) {
      waterBumpRef.offset.x = (now * -0.000027) % 1;
      waterBumpRef.offset.y = (now * 0.000021) % 1;
    }
    controls.update();
    renderer.render(scene, camera);
  }
  resize();
  requestAnimationFrame(animate);

  // ============================================================
  // Conectografia: las 8 problematicas de Kennedy UBICADAS en sus
  // coordenadas reales (Corabastos, Humedal La Vaca, etc.) sobre este
  // mismo mapa 3D, no una red suelta aparte. Los marcadores se proyectan
  // del mundo 3D a la pantalla en cada cuadro relevante (se mueven con la
  // camara), y al hacer clic en uno se revela su red de causas internas,
  // TAMBIEN ubicada (con un pequeno desplazamiento real alrededor del
  // punto de la problematica), conectada con lineas.
  // ============================================================
  const MACRO = [
    { id:"m1", corto:"Desarticulación de gobernanza y regulación temporal", full:"Desarticulación de gobernanza y regulación temporal entre el Distrito y la administración de Corabastos", color:"#e2635a", x:6396.0, y:2168.0 },
    { id:"m2", corto:"Saturación de residuos", full:"Saturación de la infraestructura física interna y plataformas de descarga de Corabastos", color:"#e8a33d", x:6440.0, y:2190.0 },
    { id:"m3", corto:"Colapso de la red vial local en Kennedy", full:"Colapso de la red vial local en Kennedy", color:"#5b8ad6", x:6280.0, y:2050.0 },
    { id:"m4", corto:"Acumulación y desborde de residuos orgánicos", full:"Acumulación y desborde de residuos orgánicos en el espacio público perimetral", color:"#4caf7d", x:6480.0, y:2220.0 },
    { id:"m5", corto:"Incompatibilidad de usos del suelo", full:"Incompatibilidad de usos del suelo y proliferación no regulada de bodegas informales en barrios vecinos", color:"#9b7ede", x:6150.0, y:2280.0 },
    { id:"m6", corto:"Informalidad laboral y segregación socio-espacial", full:"Informalidad laboral y segregación socio-espacial de recuperadores de oficio y coteros", color:"#45b8c4", x:6420.0, y:2120.0 },
    { id:"m7", corto:"Eutrofización y contaminación de fuentes hídricas", full:"Eutrofización y contaminación de fuentes hídricas por vertimiento no tratado de lixiviados y aguas servidas", color:"#d669a8", x:6180.0, y:2050.0 },
    { id:"m8", corto:"Deterioro de la Estructura Ecológica Principal", full:"Deterioro y fragmentación de la Estructura Ecológica Principal en el Humedal La Vaca", color:"#8fae4a", x:6018.0, y:1980.0 },
  ];
  const macroById = {}; MACRO.forEach(m => macroById[m.id] = m);
  const SUBNETS = {
    m1: { nodes:[
        { id:"s1_1", t:"Estructura accionaria mixta de Corabastos dividida entre sector público y comerciantes privados" },
        { id:"s1_2", t:"Inexistencia de concertación horaria entre Secretaría de Movilidad y administración de la central" },
        { id:"s1_3", t:"Incompatibilidad entre sanciones de espacio público del Distrito y reglamento interno de la central" },
        { id:"s1_4", t:"Descalce entre las ventanas de comercialización de bodegas y los itinerarios nocturnos del transporte regional" },
        { id:"s1_5", t:"Ausencia de control de flujo en los portones perimetrales de acceso" },
        { id:"s1_6", t:"Desincronización de planes operativos entre la UAESP, operadores de aseo y Corabastos" },
      ], rel:[ {from:"s1_1",to:"s1_2"},{from:"s1_2",to:"s1_4"},{from:"s1_1",to:"s1_3"},{from:"s1_3",to:"s1_5"},{from:"s1_2",to:"s1_6"},{from:"s1_6",to:"s1_2",loop:true} ],
      loopNote:"La descoordinación en calle refuerza la falta de acuerdos formales" },
    m2: { nodes:[
        { id:"s2_1", t:"Recepción diaria concentrada de 11.500 toneladas de alimentos en 1.500 camiones pesados" },
        { id:"s2_2", t:"Diseño geométrico de portones de acceso a 90 grados sin carriles de desaceleración" },
        { id:"s2_3", t:"Capacidad limitada de estacionamiento en el sector El Martillo y bodegas internas" },
        { id:"s2_4", t:"Invasión y bloqueo de las áreas de acopio interno por parqueo vehicular no regulado" },
        { id:"s2_5", t:"Mezcla no zonificada de cargue y descargue en los mismos callejones de circulación interna" },
        { id:"s2_6", t:"Inmovilización vehicular en las vías internas de la central" },
      ], rel:[ {from:"s2_1",to:"s2_3"},{from:"s2_2",to:"s2_6"},{from:"s2_5",to:"s2_4"},{from:"s2_4",to:"s2_3"},{from:"s2_3",to:"s2_6"},{from:"s2_6",to:"s2_4",loop:true} ],
      loopNote:"El trancón interno atrapa camiones sobre las áreas de parqueo y acopio, anulando el espacio disponible" },
    m3: { nodes:[
        { id:"s3_1", t:"Convergencia obligada de flujos intermunicipales de carga por Calle 13, Autopista Sur y Vía al Llano" },
        { id:"s3_2", t:"Ausencia de plataformas logísticas de filtrado y puertos secos en los bordes de Bogotá" },
        { id:"s3_3", t:"Atracción de camiones de carga pesada sobre los portones de la Cervecería Bavaria (Av. Boyacá / Av. Américas)" },
        { id:"s3_4", t:"Predominio de vías perimetrales de una sola calzada en los barrios María Paz y Patio Bonito" },
        { id:"s3_5", t:"Estacionamiento de camiones pesados sobre calzadas y andenes en espera de turno" },
        { id:"s3_6", t:"Operaciones informales de cargue y descargue en vía pública" },
        { id:"s3_7", t:"Invasión de calzadas por vehículos de tracción humana (VTH) y cargadores de oficio" },
        { id:"s3_8", t:"Bloqueo físico de la circulación en la Av. Ciudad de Cali, Av. de las Américas y Av. Agoberto Mejía" },
      ], rel:[ {from:"s3_2",to:"s3_1"},{from:"s3_1",to:"s3_5"},{from:"s3_3",to:"s3_8"},{from:"s3_4",to:"s3_8"},{from:"s3_5",to:"s3_6"},{from:"s3_6",to:"s3_7"},{from:"s3_7",to:"s3_8"},{from:"s3_8",to:"s3_5",loop:true} ],
      loopNote:"El colapso de las avenidas principales impide el paso hacia los portones, represando más camiones en las calles residenciales" },
    m4: { nodes:[
        { id:"s4_1", t:"Concentración y descarte masivo de biomasa vegetal sin clasificación en origen" },
        { id:"s4_2", t:"Saturación de la capacidad de contención en contenedores internos de Corabastos" },
        { id:"s4_3", t:"Descarte masivo de chatarra, estibas y residuos de la industria metalmecánica y cervecera" },
        { id:"s4_4", t:"Ausencia de plantas de compostaje o transformación de biomasa dentro del predio" },
        { id:"s4_5", t:"Desborde y traslado de residuos orgánicos e inerte hacia los portones P7, P8 y P9" },
        { id:"s4_6", t:"Desplazamiento de la selección manual («puchero») y descarte a la calzada vehicular de la Diagonal 38 Sur" },
        { id:"s4_7", t:"Descalce entre los horarios de venta comercial y la frecuencia de recolección de la UAESP" },
        { id:"s4_8", t:"Acumulación de residuos sólidos y biomasa en descomposición sobre la vía pública" },
      ], rel:[ {from:"s4_1",to:"s4_2"},{from:"s4_2",to:"s4_5"},{from:"s4_3",to:"s4_8"},{from:"s4_4",to:"s4_6"},{from:"s4_5",to:"s4_6"},{from:"s4_7",to:"s4_8"},{from:"s4_6",to:"s4_8"},{from:"s4_8",to:"s4_2",loop:true} ],
      loopNote:"La basura acumulada en las aceras desborda los contenedores de los bordes, colapsando el sistema de retiro interno" },
    m5: { nodes:[
        { id:"s5_1", t:"Presión comercial e industrial de Corabastos, Cervecería Bavaria y talleres sobre el entorno urbano" },
        { id:"s5_2", t:"Inexistencia de franjas urbanas de amortiguación o mitigación de impactos entre la central y el barrio" },
        { id:"s5_3", t:"Transformación de viviendas residenciales en bodegas informales de recolección, alimentos y chatarra" },
        { id:"s5_4", t:"Proliferación de pequeños talleres metalmecánicos y de soldadura no regulados" },
        { id:"s5_5", t:"Ocupación indebida de andenes por exhibición de mercancía, guacales y carretas" },
        { id:"s5_6", t:"Deterioro del pavimento y sobrecarga de la infraestructura de servicios en María Paz" },
      ], rel:[ {from:"s5_2",to:"s5_1"},{from:"s5_1",to:"s5_3"},{from:"s5_1",to:"s5_4"},{from:"s5_3",to:"s5_5"},{from:"s5_5",to:"s5_6"},{from:"s5_6",to:"s5_3",loop:true} ],
      loopNote:"El deterioro físico del barrio expulsa el uso residencial y abarata el suelo para el alquiler de más bodegas informales" },
    m6: { nodes:[
        { id:"s6_1", t:"Contratación informal y trabajo a destajo operado por intermediarios" },
        { id:"s6_2", t:"Ausencia de Estaciones de Clasificación y Aprovechamiento (ECA) e infraestructura pública limpia" },
        { id:"s6_3", t:"Acarreo informal de reciclaje y carga en vehículos de tracción humana (VTH / carretas de madera)" },
        { id:"s6_4", t:"Exposición a vectores y riesgos biológicos por manipulación no protegida de biomasa podrida" },
        { id:"s6_5", t:"Estigmatización social y persecución administrativa a trabajadores informales" },
      ], rel:[ {from:"s6_1",to:"s6_3"},{from:"s6_2",to:"s6_3"},{from:"s6_3",to:"s6_4"},{from:"s6_3",to:"s6_5"},{from:"s6_5",to:"s6_1",loop:true} ],
      loopNote:"La marginalización bloquea el acceso a esquemas de empleo formal, reduciendo las alternativas al pago por bulto a destajo" },
    m7: { nodes:[
        { id:"s7_1", t:"Generación masiva de lixiviados ácidos por descomposición de biomasa vegetal acumulada" },
        { id:"s7_2", t:"Vertimiento de aguas de lavado de bodegas, carnes y verduras con alta carga orgánica y grasa" },
        { id:"s7_3", t:"Vertimiento de aceites de corte, refrigerantes y químicos de la industria metalmecánica y cervecera" },
        { id:"s7_4", t:"Inexistencia de plantas de tratamiento de agua residual (PTAR) o trampas de grasa en Corabastos e industrias" },
        { id:"s7_5", t:"Conexión errada de tuberías servidas al alcantarillado pluvial urbano" },
        { id:"s7_6", t:"Escorrentía de lixiviados desde las calzadas de la Diagonal 38 Sur hacia los colectores del humedal" },
        { id:"s7_7", t:"Anoxia, eutrofización y carga bacteriana en los canales y vaso de agua" },
      ], rel:[ {from:"s7_1",to:"s7_6"},{from:"s7_2",to:"s7_5"},{from:"s7_3",to:"s7_5"},{from:"s7_4",to:"s7_5"},{from:"s7_5",to:"s7_7"},{from:"s7_6",to:"s7_7"},{from:"s7_7",to:"s7_6",loop:true} ],
      loopNote:"El colapso biológico del agua anula la capacidad natural de autodepuración del canal, estancando los nuevos lixiviados en los bordes superficiales" },
    m8: { nodes:[
        { id:"s8_1", t:"Relleno e invasión histórica de la ronda hidráulica por desarrollo urbano informal" },
        { id:"s8_2", t:"Cerramiento perimetral rígido de Corabastos funcionando como barrera biofísica" },
        { id:"s8_3", t:"Disposición no controlada de escombros, llantas y residuos sólidos en la franja ambiental" },
        { id:"s8_4", t:"Reducción del espejo de agua y pérdida de capacidad de amortiguación de inundaciones" },
        { id:"s8_5", t:"Interrupción de la conectividad biológica entre el Humedal La Vaca y el Parque Cayetano Cañizares" },
      ], rel:[ {from:"s8_1",to:"s8_4"},{from:"s8_2",to:"s8_5"},{from:"s8_3",to:"s8_4"},{from:"s8_4",to:"s8_5"},{from:"s8_5",to:"s8_3",loop:true} ],
      loopNote:"La desconexión ecosistémica desvaloriza la percepción social del humedal, convirtiendo sus bordes en puntos clandestinos de arrojo de escombros" },
  };
  // Posicion real (aproximada) de cada causa: un pequeno desplazamiento
  // alrededor de su problematica macro (misma logica que un mapa de
  // "puntos calientes" localizados, no una nube abstracta) — como no hay
  // coordenadas exactas para cada causa individual, se reparten en un
  // circulo pequeno (unos 60-110m) alrededor del punto real de su
  // problematica, que si es una ubicacion real (Corabastos, Humedal).
  Object.keys(SUBNETS).forEach(mid => {
    const m = macroById[mid];
    const nodes = SUBNETS[mid].nodes;
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const r = 55 + (i % 3) * 18;
      n.x = m.x + Math.cos(angle) * r;
      n.y = m.y + Math.sin(angle) * r;
    });
  });

  const netGooLayer = document.getElementById("netGooLayer");
  const netSvg = document.getElementById("netSvg");
  const netLabelLayer = document.getElementById("netLabelLayer");
  const netPanel = document.getElementById("netPanel");
  const netPanelBody = document.getElementById("netPanelBody");
  const netCloseSubBtn = document.getElementById("netCloseSubBtn");
  const SVGNS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function makeLabel(text) {
    const d = document.createElement("div");
    d.className = "net-label";
    d.textContent = text;
    netLabelLayer.appendChild(d);
    return d;
  }
  function makeBlob(diameter, color) {
    const d = document.createElement("div");
    d.className = "net-blob";
    d.style.width = d.style.height = diameter + "px";
    d.style.background = color;
    netGooLayer.appendChild(d);
    return d;
  }
  const projVec = new THREE.Vector3();
  function projectPoint(realX, realY, worldY) {
    const p = toScene(realX, realY);
    projVec.set(p.x, worldY, p.z);
    projVec.project(camera);
    const rect = renderer.domElement.getBoundingClientRect();
    return {
      x: (projVec.x * 0.5 + 0.5) * rect.width,
      y: (-projVec.y * 0.5 + 0.5) * rect.height,
      visible: projVec.z < 1,
    };
  }

  let openMacroId = null;
  const macroEls = {}; // id -> {blob, num, label}
  let subEls = null; // {blobs:{}, lines:[], labels:{}}

  const MACRO_D = 46; // diametro de las burbujas macro (px)
  MACRO.forEach((m, i) => {
    const blob = makeBlob(MACRO_D, m.color);
    blob.addEventListener("click", (e) => { e.stopPropagation(); toggleMacro(m.id); });
    const num = svgEl("text", { class: "macro-num" });
    num.textContent = i + 1;
    netSvg.appendChild(num);
    const label = makeLabel(m.corto);
    macroEls[m.id] = { blob, num, label };
  });

  function clearSubNetwork() {
    if (!subEls) return;
    Object.values(subEls.blobs).forEach(c => c.remove());
    subEls.lines.forEach(l => l.el.remove());
    Object.values(subEls.labels).forEach(l => l.remove());
    subEls = null;
  }

  function toggleMacro(id) {
    if (openMacroId === id) { closeSub(); return; }
    clearSubNetwork();
    openMacroId = id;
    netCloseSubBtn.classList.add("show");
    const sub = SUBNETS[id];
    const m = macroById[id];
    subEls = { blobs: {}, lines: [], labels: {} };
    const SUB_D = 30; // diametro de las burbujas de causas (px)
    // Lineas: del macro a cada causa, y entre causas segun su relacion
    sub.nodes.forEach(n => {
      const line = svgEl("line", { class: "net-line", stroke: m.color, "stroke-width": 1.6, "stroke-opacity": 0.55 });
      netSvg.insertBefore(line, netSvg.firstChild);
      subEls.lines.push({ el: line, from: { x: m.x, y: m.y }, to: n });
    });
    sub.rel.forEach(r => {
      const a = sub.nodes.find(n => n.id === r.from), b = sub.nodes.find(n => n.id === r.to);
      const line = svgEl("line", { class: "net-line", stroke: m.color, "stroke-width": 2.2, "stroke-opacity": 0.85, "marker-end": "url(#netArrow)" });
      netSvg.insertBefore(line, netSvg.firstChild);
      subEls.lines.push({ el: line, from: a, to: b });
    });
    sub.nodes.forEach(n => {
      const blob = makeBlob(SUB_D, m.color);
      blob.addEventListener("click", (e) => { e.stopPropagation(); openCausePanel(id, n.id); });
      subEls.blobs[n.id] = blob;
      subEls.labels[n.id] = makeLabel(n.t.length > 46 ? n.t.slice(0, 44) + "…" : n.t);
    });
    updateNetPositions();
    openMacroPanel(id);
  }
  function closeSub() {
    clearSubNetwork();
    openMacroId = null;
    netCloseSubBtn.classList.remove("show");
    netPanel.classList.remove("open");
  }
  netCloseSubBtn.addEventListener("click", closeSub);
  document.getElementById("netPanelClose").addEventListener("click", () => netPanel.classList.remove("open"));

  // Flecha para las lineas causa->causa (direccion del diagrama causal)
  const arrowDefs = svgEl("defs", {});
  netSvg.appendChild(arrowDefs);
  const arrowMarker = svgEl("marker", { id: "netArrow", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" });
  const arrowPath = svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#e2635a" });
  arrowMarker.appendChild(arrowPath);
  arrowDefs.appendChild(arrowMarker);

  function openMacroPanel(id) {
    const m = macroById[id];
    netPanelBody.innerHTML = `
      <p class="panel-kind">Problemática</p>
      <h2>${m.full}</h2>
      <div class="block"><b>Ubicación real</b><div class="rel-chip">Localizada en sus coordenadas geográficas reales sobre el mapa de Kennedy</div></div>
      <div class="block"><b>Causas internas</b><p style="font-size:12px;color:var(--ink-dim);margin:0;">Toca cualquier burbuja conectada para ver el detalle de esa causa.</p></div>
    `;
    netPanel.classList.add("open");
  }
  function openCausePanel(macroId, causeId) {
    const sub = SUBNETS[macroId];
    const byId = {}; sub.nodes.forEach(n => byId[n.id] = n);
    const n = byId[causeId];
    const vieneDe = sub.rel.filter(r => r.to === causeId).map(r => byId[r.from]);
    const alimentaA = sub.rel.filter(r => r.from === causeId).map(r => byId[r.to]);
    const esLoop = sub.rel.some(r => r.loop && (r.from === causeId || r.to === causeId));
    netPanelBody.innerHTML = `
      <p class="panel-kind">Causa (${macroById[macroId].corto})</p>
      <h2>${n.t}</h2>
      ${vieneDe.length ? `<div class="block"><b>Viene de</b>${vieneDe.map(x => `<div class="rel-chip">${x.t}</div>`).join("")}</div>` : ""}
      ${alimentaA.length ? `<div class="block"><b>Alimenta a</b>${alimentaA.map(x => `<div class="rel-chip">${x.t}</div>`).join("")}</div>` : ""}
      ${esLoop ? `<div class="block"><b>Bucle de retroalimentación</b><p style="font-size:12px;color:var(--ink);margin:0;font-style:italic;">${sub.loopNote}</p></div>` : ""}
    `;
    netPanel.classList.add("open");
  }

  function placeBlob(blob, x, y, visible) {
    blob.style.left = x + "px"; blob.style.top = y + "px";
    blob.style.opacity = visible ? "1" : "0";
  }
  function updateNetPositions() {
    MACRO.forEach((m, i) => {
      const p = projectPoint(m.x, m.y, 0.3);
      const els = macroEls[m.id];
      placeBlob(els.blob, p.x, p.y, p.visible);
      els.num.setAttribute("x", p.x); els.num.setAttribute("y", p.y);
      els.label.style.left = p.x + "px"; els.label.style.top = (p.y - MACRO_D / 2 - 6) + "px";
      const visible = p.visible ? "1" : "0";
      els.num.setAttribute("opacity", visible);
      els.label.style.opacity = visible;
    });
    if (subEls) {
      const sub = SUBNETS[openMacroId];
      sub.nodes.forEach(n => {
        const p = projectPoint(n.x, n.y, 0.25);
        placeBlob(subEls.blobs[n.id], p.x, p.y, p.visible);
        subEls.labels[n.id].style.left = p.x + "px"; subEls.labels[n.id].style.top = (p.y - 22) + "px";
        subEls.labels[n.id].style.opacity = p.visible ? "1" : "0";
      });
      subEls.lines.forEach(l => {
        const pa = projectPoint(l.from.x, l.from.y, 0.25);
        const pb = projectPoint(l.to.x, l.to.y, 0.25);
        l.el.setAttribute("x1", pa.x); l.el.setAttribute("y1", pa.y);
        l.el.setAttribute("x2", pb.x); l.el.setAttribute("y2", pb.y);
      });
    }
  }
  let lastNetUpdate = 0;
  controls.addEventListener("change", () => {
    const now = performance.now();
    if (now - lastNetUpdate < 60) return;
    lastNetUpdate = now;
    updateNetPositions();
    updateTreeBillboards();
  });
  window.addEventListener("resize", updateNetPositions);
  updateNetPositions();
})();
