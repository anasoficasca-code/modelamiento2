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
  scene.background = new THREE.Color(0xffffff);
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

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 5, 2000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  renderer.localClippingEnabled = true; // para la caja de seccion (corte del modelo)

  // Los planos de recorte de la caja de seccion se crean y se ACTIVAN
  // (aunque sea con un valor lejano que no corta nada todavia) desde ya,
  // ANTES de construir cualquier edificio/via/etc. En esta version de
  // Three.js, si los materiales compilan su shader con 0 planos de
  // recorte y luego se les agregan planos, el recorte no se aplica hasta
  // recompilar el material — por eso el corte no se veia antes.
  const secPlanes = {
    xMin: new THREE.Plane(new THREE.Vector3(1, 0, 0), 1e6),
    xMax: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e6),
    yMin: new THREE.Plane(new THREE.Vector3(0, 1, 0), 1e6),
    yMax: new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6),
    zMin: new THREE.Plane(new THREE.Vector3(0, 0, 1), 1e6),
    zMax: new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e6),
  };
  const sectionClipPlanesArr = [secPlanes.xMin, secPlanes.xMax, secPlanes.yMin, secPlanes.yMax, secPlanes.zMin, secPlanes.zMax];
  renderer.clippingPlanes = sectionClipPlanesArr;

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
  // en 35 grados fijo (55 grados de polarAngle, medido desde arriba), y
  // solo se permite girar alrededor (orbitar en el plano horizontal) y
  // hacer zoom — no inclinar mas ni menos.
  controls.minPolarAngle = Math.PI * 55 / 180;
  controls.maxPolarAngle = Math.PI * 55 / 180;
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
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 2600;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.6; // reduce el parpadeo/artefactos de sombra (shadow acne) - subido para mas margen
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
  function sceneToReal(x, z) { return [x / SCALE + netCenter.x, -z / SCALE + netCenter.y]; }
  let sceneExtentW = 100, sceneExtentH = 100; // ancho/alto de la escena en unidades (para la caja de seccion)
  let roadMat = null, waterMat = null, parqueMat = null; // referencias para los selectores de color en vivo
  let buildingEdgeMat = null; // referencia para ajustar su opacidad segun el zoom
  let groundMesh = null;

  function buildGround(bbox) {
    const w = (bbox[2] - bbox[0]) * SCALE * 1.4;
    const h = (bbox[3] - bbox[1]) * SCALE * 1.4;
    // Losa solida con grosor real (no un plano de papel): se ve como una
    // maqueta fisica, con caras laterales visibles, no una lamina.
    const THICKNESS = 6;
    const geo = new THREE.BoxGeometry(w, THICKNESS, h);
    const mat = new THREE.MeshStandardMaterial({ clippingPlanes: sectionClipPlanesArr, color: 0xeceeef, roughness: 1, metalness: 0 });
    groundMesh = new THREE.Mesh(geo, mat);
    groundMesh.position.set(0, -0.4 - THICKNESS / 2, 0);
    groundMesh.receiveShadow = true;
    sceneRoot.add(groundMesh);
    buildAxoBorder(-w / 2, w / 2, -h / 2, h / 2);
  }

  // ---- Marco/borde negro grueso alrededor del area VISIBLE actual (como
  // en los diagramas explotados de referencia: cada plano/capa lleva un
  // contorno negro solido bien marcado) — sigue los limites de la caja de
  // seccion cuando esta activa (que es lo que en verdad se ve), no todo
  // el terreno completo (que quedaria muy lejos del recorte y no se
  // notaria). Se hace con geometria 3D real (no una linea, que WebGL
  // ignora el grosor) para que el grosor se vea bien sin importar el
  // angulo o el zoom. ----
  let axoBorderMesh = null;
  function buildAxoBorder(xMin, xMax, zMin, zMax) {
    if (axoBorderMesh) { sceneRoot.remove(axoBorderMesh); axoBorderMesh.geometry.dispose(); }
    const w = xMax - xMin, h = zMax - zMin;
    const THICK = Math.max(w, h) * 0.012; // aun mas grueso, para que se vea claramente bold como en el referente
    const Y = -0.399; // justo encima del suelo, evita z-fighting
    const corners = [
      [xMin, zMin], [xMax, zMin], [xMax, zMax], [xMin, zMax],
    ];
    const positions = [];
    for (let i = 0; i < 4; i++) {
      const a = corners[i], b = corners[(i + 1) % 4];
      const dx = b[0] - a[0], dz = b[1] - a[1];
      const len = Math.hypot(dx, dz) || 0.001;
      const nx = -dz / len * THICK, nz = dx / len * THICK;
      // Rectangulo un poco mas largo que el lado (se extiende THICK de
      // mas en cada punta) para que las 4 esquinas queden bien cerradas,
      // sin huecos en las uniones.
      const ex = dx / len * THICK, ez = dz / len * THICK;
      const a2 = [a[0] - ex, a[1] - ez], b2 = [b[0] + ex, b[1] + ez];
      positions.push(
        a2[0] - nx, Y, a2[1] - nz, a2[0] + nx, Y, a2[1] + nz, b2[0] + nx, Y, b2[1] + nz,
        a2[0] - nx, Y, a2[1] - nz, b2[0] + nx, Y, b2[1] + nz, b2[0] - nx, Y, b2[1] - nz
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    sceneRoot.add(mesh);
    axoBorderMesh = mesh;
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
  let rawEdgesData = null;
  let currentRoadMeshes = []; // [lines, roadMesh] para poder quitarlos y reconstruir
  function buildRoads(edges, boxFilter) {
    currentRoadMeshes.forEach(m => { sceneRoot.remove(m); m.geometry.dispose(); });
    currentRoadMeshes = [];
    if (boxFilter) {
      edges = edges.filter(([kind, pts]) => {
        const mid = pts[Math.floor(pts.length / 2)];
        const p = toScene(mid[0], mid[1]);
        return p.x >= boxFilter.xMin && p.x <= boxFilter.xMax && p.z >= boxFilter.zMin && p.z <= boxFilter.zMax;
      });
    }
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
    currentRoadMeshes.push(lines);

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
      const yJitter = 0.03 + ((edgeIdx * 2654435761) % 1000) / 1000 * 0.006;
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
    const ribbonMat = new THREE.MeshStandardMaterial({ clippingPlanes: sectionClipPlanesArr,
      map: viaTex, color: 0xc0453f, roughness: 0.85, side: THREE.DoubleSide,
      transparent: true, opacity: 0.7,
    });
    roadMat = ribbonMat;
    const roadMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    roadMesh.receiveShadow = true;
    sceneRoot.add(roadMesh);
    currentRoadMeshes.push(roadMesh);
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

  let rawBuildingsData = null;
  let currentBuildingMesh = null, currentBuildingEdgeMesh = null;
  function buildBuildings(buildings, boxFilter) {
    if (currentBuildingMesh) { sceneRoot.remove(currentBuildingMesh); currentBuildingMesh.geometry.dispose(); }
    if (currentBuildingEdgeMesh) { sceneRoot.remove(currentBuildingEdgeMesh); currentBuildingEdgeMesh.geometry.dispose(); }
    const positions = [];
    const normals = [];
    const edgePositions = []; // lineas de borde: perimetro del techo + perimetro de la base + esquinas verticales (para que se lea el volumen completo), nada de lineas interiores
    buildings.forEach(b => {
      const pts = b.pts.map(p => toScene(p[0], p[1]));
      let h = b.h * SCALE;
      if (pts.length < 4) return; // huella degenerada
      if (boxFilter) {
        const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const cz = pts.reduce((s, p) => s + p.z, 0) / pts.length;
        if (cx < boxFilter.xMin || cx > boxFilter.xMax || cz < boxFilter.zMin || cz > boxFilter.zMax) return;
        if (h < boxFilter.yMin) return; // el edificio no alcanza ni la altura minima de la caja
        h = Math.min(h, boxFilter.yMax); // recorta la altura visible al maximo de la caja
      }
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
        edgePositions.push(a.x, h, a.z, c.x, h, c.z); // solo el perimetro del techo (forma simplificada)
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
    const mat = new THREE.MeshStandardMaterial({ clippingPlanes: sectionClipPlanesArr, color: 0xffffff, roughness: 0.6, metalness: 0.03, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    sceneRoot.add(mesh);
    currentBuildingMesh = mesh;

    // Borde oscuro de cada edificio: perimetro del techo + esquinas
    // verticales (sin lineas internas), para que se lea como un volumen
    // real y no una silueta plana.
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x2b2e33, transparent: true, opacity: 0.14 });
    buildingEdgeMat = edgeMat;
    const edgeMesh = new THREE.LineSegments(edgeGeo, edgeMat);
    sceneRoot.add(edgeMesh);
    currentBuildingEdgeMesh = edgeMesh;
  }

  function loadBuildings() {
    return fetch(BUILDINGS_URL)
      .then(r => { if (!r.ok) throw new Error("no se pudo cargar " + BUILDINGS_URL); return r.json(); })
      .then(data => { rawBuildingsData = data; rebuildFilteredGeometry(); })
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
      clippingPlanes: sectionClipPlanesArr, map: treeTex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.95,
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
  let waterTexRef = null; // referencia para animar el desplazamiento de la textura (efecto de agua en movimiento)
  let waterBumpRef = null; // capa de relieve (bump), animada a otra velocidad para el efecto de oleaje
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
    // "plana"/pintada, no renderizada. Se anima a una velocidad y escala
    // DISTINTA a la capa de color, para que el patron no se repita igual
    // y parezca mas organico (dos capas de oleaje superpuestas).
    const bumpTex = new THREE.TextureLoader().load("./assets/textura_agua2.jpg");
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(2.3, 2.3);
    waterBumpRef = bumpTex;
    // Agua con la textura real que subio el usuario, SIN tinte de color
    // dominando encima (blanco = la textura se ve tal cual es), solo con
    // brillo bajo para que capte reflejos de luz como agua real.
    const mat = new THREE.MeshStandardMaterial({ clippingPlanes: sectionClipPlanesArr,
      map: waterTex, bumpMap: bumpTex, bumpScale: 0.12,
      color: 0x8f9498, roughness: 0.18, metalness: 0.15,
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
    const mat = new THREE.MeshStandardMaterial({ clippingPlanes: sectionClipPlanesArr, map: pastoTex, color: 0xadaa90, roughness: 0.95, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
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
    const poleMat = new THREE.MeshStandardMaterial({ clippingPlanes: sectionClipPlanesArr, color: 0x33383d, roughness: 0.6 });
    const headGeo = new THREE.BoxGeometry(0.16, 0.42, 0.16);
    const headMat = new THREE.MeshStandardMaterial({ clippingPlanes: sectionClipPlanesArr, color: 0x1c1f22, roughness: 0.5 });
    const lightGeo = new THREE.CircleGeometry(0.06, 10);
    const lightColors = [0xe14b3f, 0xe8b93f, 0x4bb35a];

    let poleCount = 0;
    intersections.forEach(inter => (poleCount += Math.min(inter.dirs.length, 4)));
    const poleMesh = new THREE.InstancedMesh(poleGeo, poleMat, poleCount);
    const headMesh = new THREE.InstancedMesh(headGeo, headMat, poleCount);
    poleMesh.castShadow = true; headMesh.castShadow = true;
    const lightMeshes = lightColors.map(color =>
      new THREE.InstancedMesh(lightGeo, new THREE.MeshBasicMaterial({ clippingPlanes: sectionClipPlanesArr, color }), poleCount)
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
    const crossMat = new THREE.MeshBasicMaterial({ clippingPlanes: sectionClipPlanesArr, color: 0xffffff, side: THREE.DoubleSide });
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
    const mat = new THREE.MeshStandardMaterial({ clippingPlanes: sectionClipPlanesArr, color, roughness: 0.75, metalness: 0.02, side: THREE.DoubleSide, ...opts });
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
  const vehMat = new THREE.MeshStandardMaterial({ clippingPlanes: sectionClipPlanesArr, color: 0xe2635a, roughness: 0.5, metalness: 0.15 });
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
      rawEdgesData = data.edges;
      const w = (data.bbox[2] - data.bbox[0]) * SCALE;
      const h = (data.bbox[3] - data.bbox[1]) * SCALE;
      sceneExtentW = w; sceneExtentH = h;
      if (typeof updateSectionBox === "function") updateSectionBox();
      rebuildFilteredGeometry();
      viewSize = Math.max(w, h) * 0.14;
      resize();
      setAxonometricView(w);
      setStatus("Red cargada. Cargando edificios y trayectorias de vehículos…");
      loadBuildings();
      loadTrees();
      loadWaterBodies();
      loadManzanas();
      loadParques();
      loadIntersections();
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
    // Vista inicial fija que el usuario dejo lista (mismo objetivo, azimut
    // y distancia que su vista anterior a 45°, pero recalculada a 35° de
    // elevacion, que es el angulo que pidio para este modulo).
    camera.position.set(-389.40, 559.68, 542.58);
    controls.target.set(218.76, -53.06, -86.62);
    camera.zoom = 2.272;
    camera.updateProjectionMatrix();
  }

  // ---- Botones de vista ----
  document.getElementById("viewReset").addEventListener("click", () => setAxonometricView(400));

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
    // Lineas de borde de edificios: opacidad FIJA, no cambia con el zoom
    // (se pidio que no aparezcan/desaparezcan ni cambien de grosor al
    // acercar o alejar la camara).
    // Agua con movimiento: se desplaza lentamente la textura de color Y
    // la capa de relieve (bump) a velocidades/escalas DISTINTAS entre si,
    // simulando dos capas de oleaje superpuestas (asi el brillo/reflejo
    // cambia con el tiempo de forma organica, no un desfile en linea recta).
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
  // ---- Caja de seccion: 6 planos de recorte (X min/max, Y min/max, Z
  // min/max) para cortar el modelo y ver el interior, como una caja de
  // seccion de Rhino/Revit. Los planos se aplican de forma GLOBAL
  // (renderer.clippingPlanes), asi que afectan a todos los materiales sin
  // tener que tocar cada uno por separado. Los planos (secPlanes) ya se
  // crearon y activaron arriba, junto al renderer. ----
  const SECTION_Y_MAX = 10; // altura maxima considerada (unidades de escena)
  let sectionBoxActive = true; // activo desde el inicio: con los limites en 0-100% no corta nada visible, pero asi no hace falta darle clic a un boton aparte antes de mover los deslizadores
  const secXMin = document.getElementById("secXMin"), secXMax = document.getElementById("secXMax");
  const secYMin = document.getElementById("secYMin"), secYMax = document.getElementById("secYMax");
  const secZMin = document.getElementById("secZMin"), secZMax = document.getElementById("secZMax");
  const secXMinVal = document.getElementById("secXMinVal"), secXMaxVal = document.getElementById("secXMaxVal");
  const secYMinVal = document.getElementById("secYMinVal"), secYMaxVal = document.getElementById("secYMaxVal");
  const secZMinVal = document.getElementById("secZMinVal"), secZMaxVal = document.getElementById("secZMaxVal");
  const sectionBoxOutput = document.getElementById("sectionBoxOutput");
  function updateSectionBox() {
    const halfW = sceneExtentW / 2 * 1.4, halfH = sceneExtentH / 2 * 1.4; // mismo margen que el suelo (*1.4)
    const xMin = -halfW + (parseFloat(secXMin.value) / 100) * (2 * halfW);
    const xMax = -halfW + (parseFloat(secXMax.value) / 100) * (2 * halfW);
    const zMin = -halfH + (parseFloat(secZMin.value) / 100) * (2 * halfH);
    const zMax = -halfH + (parseFloat(secZMax.value) / 100) * (2 * halfH);
    const yMin = (parseFloat(secYMin.value) / 100) * SECTION_Y_MAX;
    const yMax = (parseFloat(secYMax.value) / 100) * SECTION_Y_MAX;
    if (sectionBoxActive) {
      secPlanes.xMin.constant = -xMin;
      secPlanes.xMax.constant = xMax;
      secPlanes.yMin.constant = -yMin;
      secPlanes.yMax.constant = yMax;
      secPlanes.zMin.constant = -zMin;
      secPlanes.zMax.constant = zMax;
    } else {
      // "Desactivar" no quita los planos del renderer (cambiar la
      // CANTIDAD de planos obliga a recompilar los materiales y el corte
      // deja de aplicarse hasta recargar) — en vez de eso, se alejan
      // muchisimo para que no corten nada visible, mantiendo siempre los
      // mismos 6 planos activos en el renderer.
      Object.values(secPlanes).forEach(p => (p.constant = 1e6));
    }
    secXMinVal.textContent = secXMin.value + "%"; secXMaxVal.textContent = secXMax.value + "%";
    secYMinVal.textContent = secYMin.value + "%"; secYMaxVal.textContent = secYMax.value + "%";
    secZMinVal.textContent = secZMin.value + "%"; secZMaxVal.textContent = secZMax.value + "%";
    // Coordenadas reales (mismo sistema que los archivos de datos), para
    // poder copiar y pegar la caja de seccion exacta.
    const r0 = sceneToReal(xMin, zMin), r1 = sceneToReal(xMax, zMax);
    sectionBoxOutput.value =
      `X: ${secXMin.value}% a ${secXMax.value}%  (real ${Math.round(Math.min(r0[0],r1[0]))} a ${Math.round(Math.max(r0[0],r1[0]))})\n` +
      `Y (altura, m): ${(yMin / SCALE).toFixed(1)} a ${(yMax / SCALE).toFixed(1)}\n` +
      `Z: ${secZMin.value}% a ${secZMax.value}%  (real ${Math.round(Math.min(r0[1],r1[1]))} a ${Math.round(Math.max(r0[1],r1[1]))})`;
  }
  let lastRebuildAt = 0;
  [secXMin, secXMax, secYMin, secYMax, secZMin, secZMax].forEach(el => {
    el.addEventListener("input", () => {
      updateSectionBox();
      const now = performance.now();
      if (now - lastRebuildAt > 150) { lastRebuildAt = now; rebuildFilteredGeometry(); }
    });
    el.addEventListener("change", () => { rebuildFilteredGeometry(); });
  });
  // Reconstruye de verdad la geometria de edificios y vias, dejando solo
  // lo que cae dentro de la caja de seccion (filtro geometrico real sobre
  // los datos originales) — esto se hace al SOLTAR el deslizador (evento
  // change), no en cada arrastre, porque reconstruir 143 mil edificios es
  // pesado. El recorte por planos de shader (arriba) tambien se deja
  // puesto por si acaso, pero este filtro geometrico es el que de verdad
  // garantiza el corte.
  function rebuildFilteredGeometry() {
    const halfW = sceneExtentW / 2 * 1.4, halfH = sceneExtentH / 2 * 1.4;
    const xMin = -halfW + (parseFloat(secXMin.value) / 100) * (2 * halfW);
    const xMax = -halfW + (parseFloat(secXMax.value) / 100) * (2 * halfW);
    const zMin = -halfH + (parseFloat(secZMin.value) / 100) * (2 * halfH);
    const zMax = -halfH + (parseFloat(secZMax.value) / 100) * (2 * halfH);
    const yMin = (parseFloat(secYMin.value) / 100) * SECTION_Y_MAX;
    const yMax = (parseFloat(secYMax.value) / 100) * SECTION_Y_MAX;
    const isFullRange = secXMin.value == 0 && secXMax.value == 100 && secYMin.value == 0 && secYMax.value == 100 && secZMin.value == 0 && secZMax.value == 100;
    const boxFilter = (sectionBoxActive && !isFullRange) ? { xMin, xMax, zMin, zMax, yMin, yMax } : null;
    if (rawBuildingsData) buildBuildings(rawBuildingsData, boxFilter);
    if (rawEdgesData) buildRoads(rawEdgesData, boxFilter);
    // El borde negro sigue el area de la caja de seccion (lo que en
    // verdad se ve), no el terreno completo (que quedaria muy lejos del
    // recorte y no se notaria).
    if (boxFilter) buildAxoBorder(xMin, xMax, zMin, zMax);
    else buildAxoBorder(-halfW, halfW, -halfH, halfH);
  }
  document.getElementById("sectionBoxToggle").addEventListener("click", (e) => {
    sectionBoxActive = !sectionBoxActive;
    e.target.classList.toggle("active", sectionBoxActive);
    e.target.textContent = sectionBoxActive ? "✂️ Desactivar caja de sección" : "✂️ Activar caja de sección";
    updateSectionBox();
    rebuildFilteredGeometry();
  });
  document.getElementById("sectionBoxReset").addEventListener("click", () => {
    secXMin.value = 58; secXMax.value = 67; secYMin.value = 0; secYMax.value = 100; secZMin.value = 39; secZMax.value = 54;
    updateSectionBox();
    rebuildFilteredGeometry();
  });
  document.getElementById("sectionBoxCopy").addEventListener("click", async () => {
    updateSectionBox();
    try { await navigator.clipboard.writeText(sectionBoxOutput.value); } catch (err) {}
    sectionBoxOutput.select();
  });
  updateSectionBox();

  // Reorientar las tarjetas de los arboles hacia la camara cuando gira,
  // limitado en frecuencia para no recalcular 120 mil matrices por cuadro.
  let lastTreeBillboardUpdate = 0;
  controls.addEventListener("change", () => {
    const now = performance.now();
    if (now - lastTreeBillboardUpdate < 120) return;
    lastTreeBillboardUpdate = now;
    updateTreeBillboards();
  });

  resize();
  requestAnimationFrame(animate);
})();


// ============================================================
// Detalle de la ESCALA NATURAL (se abre al hacer clic en el titulo):
// 2 capas explotadas adicionales, investigadas con datos reales:
//   1) Crecimiento y flujo del agua: el mismo ciclo anual del Humedal
//      El Burro, con el porcentaje de crecimiento en vivo junto a una
//      flecha, y el flujo animado desde su afluente real documentado
//      (Canal Castilla, cuenca del rio Fucha - Secretaria Distrital de
//      Ambiente) hasta el humedal.
//   2) Aves segun la temporada: Porphyrio martinica (Tingua azul /
//      Calamon morado), documentada en Bogota de octubre a abril
//      -coincide con los meses de mas agua del ciclo calculado- y
//      Rallus semiplumbeus (Tingua bogotana, endemica, patas cortas,
//      camina sobre vegetacion flotante) en temporada seca.
// ============================================================
(function () {
  const SCALE = 1 / 10;
  const ELEV = 35 * Math.PI / 180;
  const HUMEDAL_CICLO = [
    { mes: 1, nombre: "Ene", expansion_pct: 41.7, profundidad_m: 1.32 },
    { mes: 2, nombre: "Feb", expansion_pct: 42.6, profundidad_m: 1.39 },
    { mes: 3, nombre: "Mar", expansion_pct: 46.7, profundidad_m: 1.73 },
    { mes: 4, nombre: "Abr", expansion_pct: 50.0, profundidad_m: 2.00 },
    { mes: 5, nombre: "May", expansion_pct: 47.4, profundidad_m: 1.78 },
    { mes: 6, nombre: "Jun", expansion_pct: 41.5, profundidad_m: 1.30 },
    { mes: 7, nombre: "Jul", expansion_pct: 37.7, profundidad_m: 0.99 },
    { mes: 8, nombre: "Ago", expansion_pct: 34.1, profundidad_m: 0.69 },
    { mes: 9, nombre: "Sep", expansion_pct: 33.0, profundidad_m: 0.60 },
    { mes: 10, nombre: "Oct", expansion_pct: 38.6, profundidad_m: 1.06 },
    { mes: 11, nombre: "Nov", expansion_pct: 43.8, profundidad_m: 1.49 },
    { mes: 12, nombre: "Dic", expansion_pct: 43.3, profundidad_m: 1.45 },
  ];
  // Oct-Abr (meses de mas agua, documentado real): Tingua azul / Calamon
  // morado. May-Sep (temporada seca): Tingua bogotana, endemica.
  function especieDelMes(mes) {
    const humeda = mes >= 10 || mes <= 4;
    return humeda
      ? { nombre: "Tingua azul (Calamón morado)", cientifico: "Porphyrio martinica", color: "#3d5fd6", colorSec: "#7a4fc9", pico: "#e2635a", patas: "#e8b23b", patasLen: 1.5 }
      : { nombre: "Tingua bogotana", cientifico: "Rallus semiplumbeus", color: "#7a6a4a", colorSec: "#5c5038", pico: "#c0392b", patas: "#c0392b", patasLen: 0.9 };
  }

  function setupMini(canvasId) {
    const canvas = document.getElementById(canvasId);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 5, 2000);
    const scene = new THREE.Scene();
    const sceneRoot = new THREE.Group();
    scene.add(sceneRoot);
    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    function resizeMini(viewSize) {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
      renderer.setSize(w, h, false);
      const aspect = w / h;
      camera.left = -viewSize * aspect; camera.right = viewSize * aspect;
      camera.top = viewSize; camera.bottom = -viewSize;
      camera.updateProjectionMatrix();
    }
    return { canvas, renderer, camera, scene, sceneRoot, resizeMini };
  }
  function pointMiniCamera(mini, target, distance, azimuthDeg) {
    const az = azimuthDeg * Math.PI / 180;
    mini.camera.position.set(
      target.x + Math.cos(az) * Math.cos(ELEV) * distance,
      target.y + Math.sin(ELEV) * distance,
      target.z + Math.sin(az) * Math.cos(ELEV) * distance
    );
    mini.camera.lookAt(target.x, target.y, target.z);
    mini.camera.updateProjectionMatrix();
  }
  function makeBirdSprite() {
    const c = document.createElement("canvas"); c.width = 32; c.height = 32;
    const ctx = c.getContext("2d");
    ctx.translate(16, 16);
    ctx.fillStyle = "#20222c";
    ctx.beginPath(); ctx.ellipse(0, 0, 6, 3.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#eef2f7"; ctx.lineWidth = 1.4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-7, -6); ctx.lineTo(1, 0); ctx.lineTo(-7, 6); ctx.stroke();
    return new THREE.CanvasTexture(c);
  }

  let initialized = false;
  let miniAgua, miniAves, elBurroPts, elBurroCentro, canalPts, waterMatNd, elBurroMeshNd;
  let ndMonthIdx = 0, ndLastStep = 0;
  const netCenterRef = { x: 0, y: 0 };
  const HUMEDAL_X = 6017.9, HUMEDAL_Y = 1980.2;

  function toSceneNd(x, y) { return { x: (x - netCenterRef.x) * SCALE, z: -(y - netCenterRef.y) * SCALE }; }

  function rebuildElBurroNd(expansionPct) {
    if (!elBurroPts) return;
    if (elBurroMeshNd) { miniAgua.sceneRoot.remove(elBurroMeshNd); elBurroMeshNd.geometry.dispose(); }
    const scale = 1 + expansionPct / 100 * 0.6;
    const pts = elBurroPts.map(p => {
      const ex = elBurroCentro.x + (p[0] - elBurroCentro.x) * scale, ey = elBurroCentro.y + (p[1] - elBurroCentro.y) * scale;
      return toSceneNd(ex, ey);
    });
    const positions = [];
    const pts2d = pts.map(p => new THREE.Vector2(p.x, p.z));
    let tris; try { tris = THREE.ShapeUtils.triangulateShape(pts2d, []); } catch (e) { tris = []; }
    tris.forEach(([a, b, c]) => [a, b, c].forEach(idx => positions.push(pts[idx].x, 0.01, pts[idx].z)));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    elBurroMeshNd = new THREE.Mesh(geo, waterMatNd);
    miniAgua.sceneRoot.add(elBurroMeshNd);
  }

  let pctBadgeEl, depthBadgeEl, especieBadgeEl;
  const flowMarkers = [];
  function initScenes() {
    if (initialized) return;
    initialized = true;

    // badges de texto (HTML superpuesto, mas legible que texto en canvas 3D)
    const layerAgua = document.getElementById("ndLayerAgua");
    pctBadgeEl = document.createElement("div"); pctBadgeEl.className = "nd-arrow-pct"; pctBadgeEl.style.color = "#2ecf7a";
    pctBadgeEl.style.left = "58%"; pctBadgeEl.style.top = "30%";
    layerAgua.appendChild(pctBadgeEl);
    depthBadgeEl = document.createElement("div"); depthBadgeEl.className = "nd-badge";
    depthBadgeEl.style.left = "6%"; depthBadgeEl.style.top = "8%";
    layerAgua.appendChild(depthBadgeEl);

    const layerAves = document.getElementById("ndLayerAves");
    especieBadgeEl = document.createElement("div"); especieBadgeEl.className = "nd-badge";
    especieBadgeEl.style.left = "6%"; especieBadgeEl.style.top = "8%"; especieBadgeEl.style.maxWidth = "220px";
    layerAves.appendChild(especieBadgeEl);

    fetch("./assets/kennedy_net.json").then(r => r.json()).then(net => {
      netCenterRef.x = (net.bbox[0] + net.bbox[2]) / 2;
      netCenterRef.y = (net.bbox[1] + net.bbox[3]) / 2;
      const w = (net.bbox[2] - net.bbox[0]) * SCALE, h = (net.bbox[3] - net.bbox[1]) * SCALE;
      const target = toSceneNd(HUMEDAL_X, HUMEDAL_Y);
      const viewSize = Math.max(w, h) * 0.09;
      const camDist = Math.max(w, h) * 0.5;

      miniAgua = setupMini("canvasNdAgua");
      miniAgua.resizeMini(viewSize);
      pointMiniCamera(miniAgua, { x: target.x, y: 0, z: target.z }, camDist, 40);
      window.addEventListener("resize", () => miniAgua.resizeMini(viewSize));

      miniAves = setupMini("canvasNdAves");
      miniAves.resizeMini(viewSize);
      pointMiniCamera(miniAves, { x: target.x, y: 0, z: target.z }, camDist, 40);
      window.addEventListener("resize", () => miniAves.resizeMini(viewSize));

      fetch("./assets/kennedy_water_bodies.json").then(r => r.json()).then(bodies => {
        const burro = bodies.find(b => b.nombre === "Humedal El Burro");
        const canal = bodies.find(b => b.nombre === "Canal Castilla");
        elBurroPts = burro.pts;
        elBurroCentro = { x: burro.pts.reduce((s, p) => s + p[0], 0) / burro.pts.length, y: burro.pts.reduce((s, p) => s + p[1], 0) / burro.pts.length };
        canalPts = canal.pts;

        waterMatNd = new THREE.MeshBasicMaterial({ color: 0x6f95a8, side: THREE.DoubleSide, transparent: true, opacity: 0.88 });
        rebuildElBurroNd(HUMEDAL_CICLO[0].expansion_pct);

        // Canal Castilla, como linea real (afluente principal documentado)
        const canalScenePts = canalPts.map(p => toSceneNd(p[0], p[1]));
        const canalGeoPos = [];
        for (let i = 0; i < canalScenePts.length - 1; i++) canalGeoPos.push(canalScenePts[i].x, 0.02, canalScenePts[i].z, canalScenePts[i + 1].x, 0.02, canalScenePts[i + 1].z);
        const canalGeo = new THREE.BufferGeometry();
        canalGeo.setAttribute("position", new THREE.Float32BufferAttribute(canalGeoPos, 3));
        miniAgua.sceneRoot.add(new THREE.LineSegments(canalGeo, new THREE.LineBasicMaterial({ color: 0x3d6fa0, transparent: true, opacity: 0.85 })));

        // Marcadores de flujo animados, moviendose del canal hacia el humedal
        const flowGeo = new THREE.ConeGeometry(1.1, 2.6, 5);
        const flowMat = new THREE.MeshBasicMaterial({ color: 0x66c6ff });
        for (let i = 0; i < 4; i++) {
          const mesh = new THREE.Mesh(flowGeo, flowMat);
          miniAgua.sceneRoot.add(mesh);
          flowMarkers.push({ mesh, t: i / 4 });
        }
      });

      // ---- Cobertura vegetal REAL (2014, shapefile Cober_vege_humedales
      // del Jardin Botanico de Bogota, filtrado a Humedal El Burro: 305
      // poligonos, 6 tipos de cobertura) ----
      const COBERTURA_COLOR = {
        "Arbustales": 0x4c7a3d, "Vegetación Herbácea": 0x8fae4a, "Areas Endurecidas": 0x9a9a9a,
        "Espejo de Agua": 0x5f8fae, "Pastos": 0xb8c47a, "Vegetación Acuática": 0x2f9e6f,
      };
      const miniVeg = setupMini("canvasNdVeg");
      const miniVegCiclo = setupMini("canvasNdVegCiclo");
      const vegViewSize = viewSize * 1.15;
      miniVeg.resizeMini(vegViewSize); miniVegCiclo.resizeMini(vegViewSize);
      pointMiniCamera(miniVeg, { x: target.x, y: 0, z: target.z }, camDist, 40);
      pointMiniCamera(miniVegCiclo, { x: target.x, y: 0, z: target.z }, camDist, 40);
      window.addEventListener("resize", () => { miniVeg.resizeMini(vegViewSize); miniVegCiclo.resizeMini(vegViewSize); });

      let vegAcuaticaMeshes = []; // {mesh, rawPts, centro} - las unicas que se animan en el ciclo estacional
      fetch("./assets/burro_vegetacion.json").then(r => r.json()).then(poligonos => {
        function buildPoly(p, sceneRootTarget, opacity) {
          const pts = p.pts.map(pt => toSceneNd(pt[0], pt[1]));
          if (pts.length < 3) return null;
          const pts2d = pts.map(pt => new THREE.Vector2(pt.x, pt.z));
          let tris; try { tris = THREE.ShapeUtils.triangulateShape(pts2d, []); } catch (e) { tris = []; }
          const positions = [];
          tris.forEach(([a, b, c]) => [a, b, c].forEach(idx => positions.push(pts[idx].x, 0.01, pts[idx].z)));
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
          const mat = new THREE.MeshBasicMaterial({ color: COBERTURA_COLOR[p.cobertura] || 0x999999, transparent: true, opacity: opacity, side: THREE.DoubleSide });
          const mesh = new THREE.Mesh(geo, mat);
          sceneRootTarget.add(mesh);
          return mesh;
        }
        // Capa 1: cobertura vegetal estatica (mapa real completo)
        poligonos.forEach(p => buildPoly(p, miniVeg.sceneRoot, 0.92));

        // Capa 2: ciclo estacional — las coberturas de suelo (arbustales,
        // pastos, herbacea, areas endurecidas) quedan fijas de fondo; las
        // acuaticas (espejo de agua + vegetacion acuatica) se vuelven a
        // reconstruir cada mes, creciendo/encogiendo con el MISMO ciclo
        // hidrico real que ya se calculo para el humedal.
        poligonos.forEach(p => {
          if (p.cobertura === "Espejo de Agua" || p.cobertura === "Vegetación Acuática") {
            const cx = p.pts.reduce((s, pt) => s + pt[0], 0) / p.pts.length;
            const cy = p.pts.reduce((s, pt) => s + pt[1], 0) / p.pts.length;
            vegAcuaticaMeshes.push({ raw: p, centro: { x: cx, y: cy }, mesh: null });
          } else {
            buildPoly(p, miniVegCiclo.sceneRoot, 0.55); // fondo tenue, no cambia
          }
        });
        rebuildVegCiclo(HUMEDAL_CICLO[0].expansion_pct);
      });
      function rebuildVegCiclo(expansionPct) {
        const scale = 1 + expansionPct / 100 * 0.6;
        vegAcuaticaMeshes.forEach(v => {
          if (v.mesh) { miniVegCiclo.sceneRoot.remove(v.mesh); v.mesh.geometry.dispose(); }
          const pts = v.raw.pts.map(pt => {
            const ex = v.centro.x + (pt[0] - v.centro.x) * scale, ey = v.centro.y + (pt[1] - v.centro.y) * scale;
            return toSceneNd(ex, ey);
          });
          const pts2d = pts.map(pt => new THREE.Vector2(pt.x, pt.z));
          let tris; try { tris = THREE.ShapeUtils.triangulateShape(pts2d, []); } catch (e) { tris = []; }
          const positions = [];
          tris.forEach(([a, b, c]) => [a, b, c].forEach(idx => positions.push(pts[idx].x, 0.015, pts[idx].z)));
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
          const mat = new THREE.MeshBasicMaterial({ color: COBERTURA_COLOR[v.raw.cobertura], transparent: true, opacity: 0.92, side: THREE.DoubleSide });
          v.mesh = new THREE.Mesh(geo, mat);
          miniVegCiclo.sceneRoot.add(v.mesh);
        });
      }
      function animateVeg() {
        requestAnimationFrame(animateVeg);
        miniVeg.renderer.render(miniVeg.scene, miniVeg.camera);
        miniVegCiclo.renderer.render(miniVegCiclo.scene, miniVegCiclo.camera);
      }
      requestAnimationFrame(animateVeg);

      // Aves: 3 sprites volando hacia el humedal
      const birdTex = makeBirdSprite();
      const birdMat = new THREE.SpriteMaterial({ map: birdTex, transparent: true });
      const birds = [];
      for (let i = 0; i < 3; i++) {
        const sprite = new THREE.Sprite(birdMat.clone());
        sprite.scale.set(4, 4, 1);
        miniAves.sceneRoot.add(sprite);
        birds.push({ sprite, phase: i * 2.1, speed: 0.5 + i * 0.08 });
      }

      function animateAgua(now) {
        requestAnimationFrame(animateAgua);
        if (now - ndLastStep > 1600) {
          ndLastStep = now;
          const prevIdx = ndMonthIdx;
          ndMonthIdx = (ndMonthIdx + 1) % 12;
          const d = HUMEDAL_CICLO[ndMonthIdx];
          const prev = HUMEDAL_CICLO[prevIdx];
          rebuildElBurroNd(d.expansion_pct);
          rebuildVegCiclo(d.expansion_pct);
          const delta = d.expansion_pct - prev.expansion_pct;
          pctBadgeEl.textContent = (delta >= 0 ? "▲ +" : "▼ ") + delta.toFixed(1) + "%";
          pctBadgeEl.style.color = delta >= 0 ? "#2ecf7a" : "#e2635a";
          depthBadgeEl.innerHTML = `<b>${d.nombre}</b><br>Espejo de agua: ${d.expansion_pct.toFixed(1)}%<br>Profundidad: ${d.profundidad_m.toFixed(2)} m`;
          const esp = especieDelMes(d.mes);
          especieBadgeEl.innerHTML = `<b>${esp.nombre}</b><br><i>${esp.cientifico}</i><br>${d.mes >= 10 || d.mes <= 4 ? "Temporada húmeda — aguas más profundas" : "Temporada seca — vegetación flotante"}`;
        }
        flowMarkers.forEach((f, i) => {
          f.t += 0.0028;
          if (f.t > 1) f.t -= 1;
          const a = canalPts[canalPts.length - 1], b = [HUMEDAL_X, HUMEDAL_Y];
          const rx = a[0] + (b[0] - a[0]) * f.t, ry = a[1] + (b[1] - a[1]) * f.t;
          const p = toSceneNd(rx, ry);
          f.mesh.position.set(p.x, 0.4, p.z);
          const dx = b[0] - a[0], dz = -(b[1] - a[1]);
          f.mesh.rotation.set(0, Math.atan2(dx, dz) * -1, 0);
          f.mesh.rotation.x = Math.PI / 2;
        });
        miniAgua.renderer.render(miniAgua.scene, miniAgua.camera);
      }
      requestAnimationFrame(animateAgua);

      function animateAves(now) {
        requestAnimationFrame(animateAves);
        const t = now * 0.00035;
        const esp = especieDelMes(HUMEDAL_CICLO[ndMonthIdx].mes);
        birds.forEach(b => {
          const ang = t * b.speed + b.phase;
          const r = viewSize * 0.55;
          const x = target.x + Math.cos(ang) * r;
          const z = target.z + Math.sin(ang * 1.2) * r * 0.6;
          b.sprite.position.set(x, viewSize * 0.18 + Math.sin(ang * 3) * viewSize * 0.03, z);
          b.sprite.material.color.set(esp.color);
        });
        miniAves.renderer.render(miniAves.scene, miniAves.camera);
      }
      requestAnimationFrame(animateAves);
    });
  }

  const modal = document.getElementById("naturalDetailModal");
  document.getElementById("naturalDetailBtn").addEventListener("click", () => {
    modal.classList.add("open");
    initScenes();
  });
  document.getElementById("naturalDetailClose").addEventListener("click", () => modal.classList.remove("open"));
})();

// ============================================================
// 3 replicas de la MISMA axonometria completa (edificios, vias, agua,
// arboles), apiladas arriba de la base — igual concepto que el
// referente (el mismo modelo repetido), con las vias en color gris
// normal (no rojo) y SIN el borde negro (que solo lleva la base).
// ============================================================
(function () {
  const SCALE = 1 / 10;
  const ELEV = 35 * Math.PI / 180;
  function setupReplica(canvasId) {
    const canvas = document.getElementById(canvasId);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = false;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 5, 2000);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const sceneRoot = new THREE.Group();
    scene.add(sceneRoot);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(80, 140, 60);
    scene.add(sun);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.1;
    controls.minPolarAngle = controls.maxPolarAngle = 55 * Math.PI / 180;
    controls.enablePan = false;
    controls.minZoom = 0.4; controls.maxZoom = 14;
    function resizeR(viewSize) {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
      renderer.setSize(w, h, false);
      const aspect = w / h;
      camera.left = -viewSize * aspect; camera.right = viewSize * aspect;
      camera.top = viewSize; camera.bottom = -viewSize;
      camera.updateProjectionMatrix();
    }
    return { canvas, renderer, camera, scene, sceneRoot, controls, resizeR };
  }
  function pointReplicaCamera(r, target, distance, azimuthDeg) {
    const az = azimuthDeg * Math.PI / 180;
    r.camera.position.set(
      target.x + Math.cos(az) * Math.cos(ELEV) * distance,
      target.y + Math.sin(ELEV) * distance,
      target.z + Math.sin(az) * Math.cos(ELEV) * distance
    );
    r.camera.lookAt(target.x, target.y, target.z);
    r.camera.updateProjectionMatrix();
  }

  const replicas = [setupReplica("canvasReplica1"), setupReplica("canvasReplica2"), setupReplica("canvasReplica3")];

  // Animacion de "explosion": al iniciar solo se ve la axonometria base;
  // al hacer CLIC SOBRE ELLA MISMA (no un boton aparte), las 3 replicas
  // aparecen creciendo/apareciendo con un pequeno retraso entre cada una
  // (efecto de capas explotando hacia arriba). Un solo clic sin arrastre
  // dispara esto (el navegador no genera "click" despues de un arrastre
  // real, asi que no choca con el orbitar/zoom de la base).
  const layerBaseEl = document.getElementById("layerBase");
  const explodedGroupEl = document.getElementById("explodedGroup");
  const replicaLayerEls = [
    document.getElementById("layerReplicaNatural"),
    document.getElementById("layerReplicaCultural"),
    document.getElementById("layerReplicaTecnologica"),
  ];
  let yaExploto = false;
  layerBaseEl.addEventListener("click", () => {
    if (yaExploto) return;
    yaExploto = true;
    layerBaseEl.style.opacity = "0";
    layerBaseEl.style.pointerEvents = "none";
    explodedGroupEl.classList.add("show");
    replicaLayerEls.forEach((el, i) => {
      el.style.transitionDelay = (i * 160) + "ms";
    });
  });

  Promise.all([
    fetch("./assets/kennedy_net.json").then(r => r.json()),
    fetch("./assets/kennedy_buildings.json").then(r => r.json()),
    fetch("./assets/kennedy_water_bodies.json").then(r => r.json()),
    fetch("./assets/kennedy_trees_real.json").then(r => r.json()),
  ]).then(([net, buildings, waterBodies, trees]) => {
    const netCenter = { x: (net.bbox[0] + net.bbox[2]) / 2, y: (net.bbox[1] + net.bbox[3]) / 2 };
    function toScene(x, y) { return { x: (x - netCenter.x) * SCALE, z: -(y - netCenter.y) * SCALE }; }
    const w = (net.bbox[2] - net.bbox[0]) * SCALE, h = (net.bbox[3] - net.bbox[1]) * SCALE;
    const viewSize = Math.max(w, h) * 0.36;
    const camDist = Math.max(w, h) * 1.7;

    // ---- Geometria compartida: se construye UNA sola vez y se agrega
    // como nuevo Mesh (misma BufferGeometry, distinto material si hace
    // falta) a cada una de las 3 replicas — evita reconstruir 243 mil
    // edificios x3, solo se paga el costo de subir el buffer a la GPU
    // 3 veces en vez de tambien recalcular toda la geometria 3 veces.
    // Se usan TODOS los edificios y arboles reales (sin muestreo), para
    // que las 3 replicas se vean identicas a la base, como se pidio. ----
    const HALF_W = 0.9;
    const roadPos = [], roadUv = [];
    net.edges.forEach(([kind, pts]) => {
      const sp = pts.map(p => toScene(p[0], p[1]));
      for (let i = 0; i < sp.length - 1; i++) {
        const a = sp[i], b = sp[i + 1];
        const dx = b.x - a.x, dz = b.z - a.z;
        const len = Math.hypot(dx, dz) || 0.001;
        const nx = -dz / len * HALF_W, nz = dx / len * HALF_W;
        roadPos.push(a.x - nx, 0.03, a.z - nz, a.x + nx, 0.03, a.z + nz, b.x + nx, 0.03, b.z + nz,
          a.x - nx, 0.03, a.z - nz, b.x + nx, 0.03, b.z + nz, b.x - nx, 0.03, b.z - nz);
        const uvLen = len * 0.06;
        roadUv.push(0, 0, 1, 0, 1, uvLen, 0, 0, 1, uvLen, 0, uvLen);
      }
    });
    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute("position", new THREE.Float32BufferAttribute(roadPos, 3));
    roadGeo.setAttribute("uv", new THREE.Float32BufferAttribute(roadUv, 2));

    const buildPositions = [], buildNormals = [];
    buildings.forEach(b => {
      const pts = b.pts.map(p => toScene(p[0], p[1]));
      const h = b.h * SCALE;
      if (pts.length < 4) return;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], c = pts[i + 1];
        const dx = c.x - a.x, dz = c.z - a.z;
        const len = Math.hypot(dx, dz) || 0.001;
        const nx = dz / len, nz = -dx / len;
        buildPositions.push(a.x, 0, a.z, c.x, 0, c.z, c.x, h, c.z, a.x, 0, a.z, c.x, h, c.z, a.x, h, a.z);
        for (let k = 0; k < 6; k++) buildNormals.push(nx, 0, nz);
      }
      const pts2d = pts.map(p => new THREE.Vector2(p.x, p.z));
      let tris; try { tris = THREE.ShapeUtils.triangulateShape(pts2d, []); } catch (e) { tris = []; }
      tris.forEach(([ia, ib, ic]) => {
        buildPositions.push(pts[ia].x, h, pts[ia].z, pts[ib].x, h, pts[ib].z, pts[ic].x, h, pts[ic].z);
        for (let k = 0; k < 3; k++) buildNormals.push(0, 1, 0);
      });
    });
    const buildGeo = new THREE.BufferGeometry();
    buildGeo.setAttribute("position", new THREE.Float32BufferAttribute(buildPositions, 3));
    buildGeo.setAttribute("normal", new THREE.Float32BufferAttribute(buildNormals, 3));

    const waterPositions = [];
    waterBodies.forEach(wbody => {
      const pts = wbody.pts.map(p => toScene(p[0], p[1]));
      if (pts.length < 3) return;
      const pts2d = pts.map(p => new THREE.Vector2(p.x, p.z));
      let tris; try { tris = THREE.ShapeUtils.triangulateShape(pts2d, []); } catch (e) { tris = []; }
      tris.forEach(([a, b, c]) => [a, b, c].forEach(idx => waterPositions.push(pts[idx].x, 0.02, pts[idx].z)));
    });
    const waterGeo = new THREE.BufferGeometry();
    waterGeo.setAttribute("position", new THREE.Float32BufferAttribute(waterPositions, 3));

    // Arboles: misma tarjeta plana con la foto real, un solo InstancedMesh
    function hash2R(str) { let hh = 0; for (const c of (str || "")) hh = (hh * 31 + c.charCodeAt(0)) >>> 0; return hh; }
    const treeTexR = new THREE.TextureLoader().load("./assets/arbol_real3.png");
    const treePlaneGeo = new THREE.BufferGeometry();
    treePlaneGeo.setAttribute("position", new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
    treePlaneGeo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2));
    const treeMatR = new THREE.MeshBasicMaterial({ map: treeTexR, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
    const treeMeshR = new THREE.InstancedMesh(treePlaneGeo, treeMatR, trees.length);
    const dummyTR = new THREE.Object3D();
    trees.forEach((t, i) => {
      const [tx, ty, hMeters, , code] = t;
      const p = toScene(tx, ty);
      const th = Math.max(0.3, hMeters * SCALE);
      const tw = th * (1.1 + (hash2R(code) % 20) / 100 - 0.1);
      dummyTR.position.set(p.x, 0, p.z);
      dummyTR.scale.set(tw, th, tw);
      dummyTR.rotation.set(0, 40 * Math.PI / 180, 0); // orientadas al acimut fijo de la camara (40°)
      dummyTR.updateMatrix();
      treeMeshR.setMatrixAt(i, dummyTR.matrix);
    });
    treeMeshR.instanceMatrix.needsUpdate = true;

    const viaTexR = new THREE.TextureLoader().load("./assets/textura_via.jpg");
    viaTexR.wrapS = viaTexR.wrapT = THREE.RepeatWrapping;
    const roadMat = new THREE.MeshStandardMaterial({ map: viaTexR, color: 0x9099a3, roughness: 0.85, side: THREE.DoubleSide }); // gris normal, NO rojo
    const buildMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65, metalness: 0.02, side: THREE.DoubleSide });
    const waterMat = new THREE.MeshBasicMaterial({ color: 0x8f9498, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });

    // Losa de terreno con grosor real (compartida entre las 3, igual que
    // en la base), para que se vea como maqueta solida, no una lamina, y
    // para que no quede fondo blanco vacio dentro del rombo.
    const GROUND_THICK = 6;
    const groundGeoR = new THREE.BoxGeometry(w * 1.4, GROUND_THICK, h * 1.4);
    const groundMatR = new THREE.MeshStandardMaterial({ color: 0xeceeef, roughness: 1, metalness: 0 });

    replicas.forEach((r) => {
      const gMesh = new THREE.Mesh(groundGeoR, groundMatR);
      gMesh.position.set(0, -0.4 - GROUND_THICK / 2, 0);
      r.sceneRoot.add(gMesh);
      r.sceneRoot.add(new THREE.Mesh(buildGeo, buildMat));
      r.sceneRoot.add(treeMeshR.clone());
      r.resizeR(viewSize);
      pointReplicaCamera(r, { x: 0, y: 0, z: 0 }, camDist, 40);
      window.addEventListener("resize", () => r.resizeR(viewSize));
    });

    const [rNatural, rCultural, rTecnologica] = replicas;

    // ---- ESCALA NATURAL: agua normal + el Humedal El Burro creciendo y
    // encogiendo con el mismo ciclo climatico anual real ya calculado ----
    rNatural.sceneRoot.add(new THREE.Mesh(roadGeo, roadMat));
    rNatural.sceneRoot.add(new THREE.Mesh(waterGeo, waterMat));
    const HUMEDAL_CICLO_R = [41.7, 42.6, 46.7, 50.0, 47.4, 41.5, 37.7, 34.1, 33.0, 38.6, 43.8, 43.3];
    const elBurroR = waterBodies.find(b => b.nombre === "Humedal El Burro");
    let elBurroCentroR = null, elBurroMeshR = null;
    if (elBurroR) {
      elBurroCentroR = { x: elBurroR.pts.reduce((s, p) => s + p[0], 0) / elBurroR.pts.length, y: elBurroR.pts.reduce((s, p) => s + p[1], 0) / elBurroR.pts.length };
    }
    function rebuildElBurroR(pct) {
      if (!elBurroR) return;
      if (elBurroMeshR) { rNatural.sceneRoot.remove(elBurroMeshR); elBurroMeshR.geometry.dispose(); }
      const scale = 1 + pct / 100 * 0.6;
      const pts = elBurroR.pts.map(p => {
        const ex = elBurroCentroR.x + (p[0] - elBurroCentroR.x) * scale, ey = elBurroCentroR.y + (p[1] - elBurroCentroR.y) * scale;
        return toScene(ex, ey);
      });
      const pts2d = pts.map(p => new THREE.Vector2(p.x, p.z));
      let tris; try { tris = THREE.ShapeUtils.triangulateShape(pts2d, []); } catch (e) { tris = []; }
      const pos = [];
      tris.forEach(([a, b, c]) => [a, b, c].forEach(idx => pos.push(pts[idx].x, 0.025, pts[idx].z)));
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      elBurroMeshR = new THREE.Mesh(geo, waterMat);
      rNatural.sceneRoot.add(elBurroMeshR);
    }
    let mesIdxR = 0;
    rebuildElBurroR(HUMEDAL_CICLO_R[0]);
    setInterval(() => { mesIdxR = (mesIdxR + 1) % 12; rebuildElBurroR(HUMEDAL_CICLO_R[mesIdxR]); }, 1600);

    // ---- ESCALA CULTURAL: mismas vias sin colorear (a pedido del
    // usuario, sin color especial) ----
    rCultural.sceneRoot.add(new THREE.Mesh(roadGeo, roadMat));
    rCultural.sceneRoot.add(new THREE.Mesh(waterGeo, waterMat));

    // ---- ESCALA TECNOLOGICA: vias grises normales + vehiculos reales de
    // SUMO moviendose en vivo ----
    rTecnologica.sceneRoot.add(new THREE.Mesh(roadGeo, roadMat));
    rTecnologica.sceneRoot.add(new THREE.Mesh(waterGeo, waterMat));
    const vehGeoR = new THREE.BoxGeometry(0.9, 0.5, 1.8);
    const vehMatR = new THREE.MeshBasicMaterial({ color: 0xe2635a });
    const vehMeshR = new THREE.InstancedMesh(vehGeoR, vehMatR, 1200);
    rTecnologica.sceneRoot.add(vehMeshR);
    const dummyVehR = new THREE.Object3D();
    let timestepsR = [];
    fetch("./assets/kennedy_vehiculos.json").then(r2 => r2.json()).then(data => {
      timestepsR = data.map(([time, vs]) => ({ time, vehicles: vs.map(([id, x, y]) => ({ x, y })) }));
    });
    let tR = 0, lastFrameR = 0;
    function animateVehR(now) {
      if (!timestepsR.length) return;
      const dt = lastFrameR ? Math.min(0.05, (now - lastFrameR) / 1000) : 0;
      lastFrameR = now;
      tR += dt * 12;
      const maxT = timestepsR[timestepsR.length - 1].time;
      if (tR > maxT) tR = 0;
      let idx = Math.max(0, Math.min(timestepsR.length - 1, Math.floor((tR / maxT) * (timestepsR.length - 1))));
      const vehicles = timestepsR[idx].vehicles;
      const n = Math.min(vehicles.length, 1200);
      for (let i = 0; i < n; i++) {
        const p = toScene(vehicles[i].x, vehicles[i].y);
        dummyVehR.position.set(p.x, 0.05, p.z);
        dummyVehR.updateMatrix();
        vehMeshR.setMatrixAt(i, dummyVehR.matrix);
      }
      vehMeshR.count = n;
      vehMeshR.instanceMatrix.needsUpdate = true;
    }

    function animateReplicas(now) {
      requestAnimationFrame(animateReplicas);
      animateVehR(now);
      replicas.forEach(r => { r.controls.update(); r.renderer.render(r.scene, r.camera); });
    }
    requestAnimationFrame(animateReplicas);
  }).catch(err => console.warn("No se pudieron cargar las replicas:", err));
})();
