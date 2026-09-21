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

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 5, 2000);
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
  canvas.addEventListener("contextmenu", (e) => e.preventDefault()); // sin esto, el navegador abre su menu contextual con el clic derecho en vez de dejarlo mover (panear) la vista
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
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 }); // blanco puro (antes gris claro), a pedido del usuario
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
  function fromScene(sx, sz) {
    // Inversa exacta de toScene(): de coordenadas de escena de vuelta a
    // las coordenadas RAW (el mismo sistema de todos los archivos de
    // datos), para poder arrastrar una burbuja y saber a que
    // coordenadas reales corresponde su nueva posicion.
    return { x: sx / SCALE + netCenter.x, y: netCenter.y - sz / SCALE };
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
      polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2, // evita z-fighting con las lineas de borde (que quedan exactamente sobre la superficie)
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
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x2b2e33, transparent: true, opacity: 0.08 });
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
    const treeTex = new THREE.TextureLoader().load("./assets/arbol_real4.png");
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
  let playing = true; // se reproduce automaticamente al cargar, ya no se necesita darle play
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
      viewSize = Math.max(w, h) * 0.14; // revertido al zoom original que el usuario ya habia cuadrado
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
    document.getElementById("simExpand").style.display = "flex"; // se despliega el resto de la barra (deslizador, tiempo, velocidad) solo cuando se le da play, antes solo se ve el boton
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
    { id:"n1", corto:"Colapso de la red vial local y arterial", full:"Colapso de la red vial local y de los corredores arteriales", color:"#5b8ad6", x:6280.0, y:2050.0 },
    { id:"n2", corto:"Contaminación de la red hídrica", full:"Contaminación y alteración biofísica de la red hídrica y cuerpos de agua", color:"#d669a8", x:6096.0, y:2297.4 },
    { id:"n3", corto:"Concentración del mercado mayorista", full:"Concentración metropolitana del mercado mayorista de alimentos en la trama barrial", color:"#e2635a", x:6396.0, y:2168.0 },
    { id:"n4", corto:"Sobrecarga por densificación en altura", full:"Sobrecarga infraestructural de la densificación residencial en altura", color:"#9b7ede", x:6150.0, y:2280.0 },
    { id:"n5", corto:"Interferencia en el espacio público", full:"Interferencia de actividades logísticas en la red de espacio público barrial", color:"#4caf7d", x:6440.0, y:2190.0 },
    { id:"n6", corto:"Acumulación de residuos y transporte pesado", full:"Acumulación de residuos y transporte pesado sobre la red ecológica", color:"#e8a33d", x:6480.0, y:2220.0 },
    { id:"n7", corto:"Inoperancia del ordenamiento oficial", full:"Inoperancia del ordenamiento oficial ante los patrones reales del territorio", color:"#45b8c4", x:6420.0, y:2120.0 },
  ];
  const macroById = {}; MACRO.forEach(m => macroById[m.id] = m);
  // Cada subred usa, cuando estan disponibles, las coordenadas REALES
  // exactas de cada causa (convertidas de lat/lng a este sistema local
  // mediante 2 puntos de calibracion ya georreferenciados en el
  // proyecto: Humedal La Vaca y Humedal El Burro) - no un desplazamiento
  // aproximado alrededor del macro-nodo. Se llenan una problematica a la
  // vez segun las coordenadas que se vayan indicando; las que aun no
  // tienen coordenadas reales quedan con un solo nodo generico temporal.
  const SUBNETS = {
    n1: {
      nodes:[
        { id:"s1_1", t:"Infiltración de camiones pesados de escala regional en calles barriales de una sola calzada", x:6290.5, y:2559.6 },
        { id:"s1_2", t:"Filas de camiones y congestión represada sobre las avenidas principales", x:5585.4, y:2475.9 },
        { id:"s1_3", t:"Deterioro continuo de la capa de rodadura ante el tránsito de carga pesada", x:5544.1, y:2806.7 },
        { id:"s1_4", t:"Conflicto y entrecruzamiento de flujos entre camiones, vehículos particulares, bicipatios y peatones", x:6014.7, y:2474.7 },
        { id:"s1_5", t:"Ingreso vehicular en ángulo recto que obliga a frenar sobre la calzada arterial", x:6125.7, y:2429.2 },
      ],
      rel:[],
    },
    n2: {
      nodes:[
        { id:"s2_1", t:"Vertimiento de lixiviados orgánicos al alcantarillado sin tratamiento", x:6669.5, y:2454.1 },
        { id:"s2_2", t:"Escorrentía de residuos de alimentos", x:5977.0, y:2010.0 },
        { id:"s2_3", t:"Eutrofización y tinción de aguas en la cuenca hídrica", x:5406.9, y:2161.5 },
        { id:"s2_4", t:"Vertimiento de grasas y agua de lavado de bodegas hacia canales superficiales", x:6490.3, y:2554.7 },
        { id:"s2_5", t:"Escorrentía de alimentos", x:7437.0, y:3271.2 },
        { id:"s2_6", t:"Vertimiento de lixiviados por residuos inorgánicos", x:8889.5, y:3352.4 },
        { id:"s2_7", t:"Vertimiento de agua sucia y lixiviados al alcantarillado pluvial sin tratamiento", x:6173.2, y:2186.4 },
        { id:"s2_8", t:"Arrastre de basuras desde la calle hacia los canales de agua en eventos de lluvia", x:5612.3, y:1774.2 },
        { id:"s2_9", t:"Infiltración de agua contaminada en la franja del humedal", x:6017.9, y:1980.2 },
        { id:"s2_10", t:"Barrera física del cerramiento privado sobre la franja de protección ambiental", x:6062.3, y:2148.5 },
        { id:"s2_11", t:"Insuficiencia de redes sanitarias destinadas a la limpieza de bodegas", x:5777.0, y:2353.3 },
      ],
      rel:[],
    },
    n3: {
      nodes:[
        { id:"s3_1", t:"Entrada masiva de carga alimentaria regional en un solo predio", x:7174.8, y:2314.7 },
        { id:"s3_2", t:"Represión de camiones en espera ante la diferencia entre horarios de llegada y venta", x:5728.0, y:2453.3 },
        { id:"s3_3", t:"Saturación comercial intensiva en un grupo reducido de bodegas", x:6624.3, y:2158.8 },
        { id:"s3_4", t:"Llegada masiva y continua de carga alimentaria regional a un único punto urbano", x:5746.7, y:2361.8 },
        { id:"s3_5", t:"Represión de camiones en vía pública durante la espera de apertura de bodegas", x:6389.0, y:2093.7 },
        { id:"s3_6", t:"Mezcla física de comercialización mayorista con almacenamiento, empaque y preparación de alimentos", x:5808.7, y:2360.9 },
        { id:"s3_7", t:"Saturación comercial intensiva en una franja reducida de bodegas", x:5856.2, y:2323.0 },
        { id:"s3_8", t:"Aglomeración de compradores, carretas y vehículos en los accesos a los sectores de venta", x:5935.5, y:2398.8 },
      ],
      rel:[],
    },
    n4: {
      nodes:[
        { id:"s4_1", t:"Crecimiento de torres de apartamentos sobre infraestructuras con capacidad límite", x:6639.6, y:1846.2 },
        { id:"s4_2", t:"Construcción de edificios que superan la altura permitida sobre vías estrechas", x:5010.9, y:2242.5 },
        { id:"s4_3", t:"Fricción en la convivencia directa entre conjuntos residenciales y zonas de bodegaje", x:5697.7, y:2224.3 },
        { id:"s4_4", t:"Coincidencia temporal entre los viajes de residentes y el transporte de carga", x:5708.8, y:1572.6 },
        { id:"s4_5", t:"Ocupación de vías barriales con carros particulares ante estacionamientos agotados", x:5010.9, y:2242.5 },
        { id:"s4_6", t:"Construcción masiva de torres residenciales superando la capacidad de las vías barriales", x:6639.6, y:1846.2 },
        { id:"s4_7", t:"Generación concentrada de viajes cotidianos desde conjuntos verticales hacia pocos corredores", x:5708.8, y:1572.6 },
        { id:"s4_8", t:"Saturación del sistema masivo (TransMilenio y SITP) por exceso de pasajeros en horas pico", x:5301.5, y:2034.6 },
        { id:"s4_9", t:"Retraso en las frecuencias de buses debido al parqueo informal en los carriles mixtos", x:6290.5, y:2559.6 },
      ],
      rel:[],
    },
    n5: {
      nodes:[
        { id:"s5_1", t:"Ocupación comercial de andenes estrechos con cajas, huacales y mercancía", x:6075.4, y:2459.3 },
        { id:"s5_2", t:"Instalación de puestos informales de venta de alimentos sobre la calzada vehicular", x:6014.7, y:2452.0 },
        { id:"s5_3", t:"Expulsión de peatones hacia la calle junto al tránsito de camiones pesados", x:6581.4, y:2438.1 },
        { id:"s5_4", t:"Aglomeración peatonal sobre aceras fragmentadas e invadidas", x:6639.6, y:1846.2 },
        { id:"s5_5", t:"Apropiación comercial de vías residenciales fuera del muro de cerramiento", x:4545.6, y:1963.7 },
      ],
      rel:[],
    },
    n6: {
      nodes:[
        { id:"s6_1", t:"Acumulación de basura orgánica superando la capacidad de los contenedores", x:6581.4, y:2438.1 },
        { id:"s6_2", t:"Estacionamiento prolongado de camiones de gran tonelaje en calles residenciales", x:5544.1, y:2806.7 },
        { id:"s6_3", t:"Derrame de lixiviados sobre el pavimento a la intemperie", x:5935.5, y:2376.1 },
        { id:"s6_4", t:"Bloqueo de puntos de recolección de basura con vehículos parqueados", x:5777.0, y:2338.1 },
        { id:"s6_5", t:"Generación de malos olores y focos sanitarios junto a las zonas de vivienda", x:6094.0, y:2186.4 },
      ],
      rel:[],
    },
    n7: { nodes:[ { id:"s7_1", t:"Pendiente de coordenadas reales" } ], rel:[] },
  };
  // Posicion real de cada causa: si ya trae x,y propios (coordenadas
  // reales exactas, como en n2), se respetan tal cual. Solo las que
  // todavia NO tienen coordenadas propias (los nodos temporales
  // "Pendiente...") se colocan con un pequeno desplazamiento alrededor
  // del macro-nodo, como marcador provisional.
  Object.keys(SUBNETS).forEach(mid => {
    const m = macroById[mid];
    const nodes = SUBNETS[mid].nodes;
    nodes.forEach((n, i) => {
      if (n.x !== undefined && n.y !== undefined) return; // ya tiene coordenada real, no tocar
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
  function hexToRgba(hex, alpha) {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  function wrapToFit(text, maxCharsPerLine, maxLines) {
    const words = text.split(" ");
    const lines = []; let current = "";
    words.forEach(w => {
      const candidate = current ? current + " " + w : w;
      if (candidate.length > maxCharsPerLine && current) { lines.push(current); current = w; }
      else current = candidate;
    });
    if (current) lines.push(current);
    if (lines.length > maxLines) {
      const shown = lines.slice(0, maxLines);
      let last = shown[maxLines - 1];
      while (last.length > 3 && (last + "…").length > maxCharsPerLine) last = last.slice(0, -1).trim();
      shown[maxLines - 1] = last.replace(/[.,;:]+$/, "") + "…";
      return shown.join("<br>");
    }
    return lines.join("<br>");
  }
  function makeLabel(text, diameter) {
    const d = document.createElement("div");
    d.className = "net-label";
    const fontPx = 9.5, lineH = fontPx * 1.2; // texto un poco mas chico, para que quepa completo sin cortarse
    const rr = diameter / 2;
    let maxLines = Math.max(2, Math.floor((diameter * 0.86) / lineH));
    let halfH = (maxLines * lineH) / 2;
    while (halfH >= rr * 0.9 && maxLines > 1) { maxLines--; halfH = (maxLines * lineH) / 2; }
    const safeWidth = 2 * Math.sqrt(Math.max(0, rr * rr - halfH * halfH)) * 0.9;
    const maxCharsPerLine = Math.max(5, Math.floor(safeWidth / (fontPx * 0.54)));
    d.style.width = safeWidth + "px";
    d.style.fontSize = fontPx + "px";
    d.style.lineHeight = lineH + "px";
    d.innerHTML = wrapToFit(text, maxCharsPerLine, maxLines);
    netLabelLayer.appendChild(d);
    return d;
  }
  function makeBlob(diameter, color) {
    const d = document.createElement("div");
    d.className = "net-blob";
    d.style.width = d.style.height = diameter + "px";
    d.style.background = color; // color solido, a pedido del usuario (antes transparente)
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

  // ---- Arrastrar las burbujas: se puede agarrar cualquier bola y
  // moverla a donde se quiera, con las coordenadas reales resultantes
  // mostradas en vivo arriba a la izquierda. Funciona proyectando el
  // mouse contra un plano horizontal a la misma altura de la burbuja
  // (raycasting), y convirtiendo el punto de interseccion de vuelta a
  // coordenadas reales con fromScene(). ----
  const dragRaycaster = new THREE.Raycaster();
  const dragMouseNdc = new THREE.Vector2();
  function screenToReal(clientX, clientY, worldY) {
    const rect = renderer.domElement.getBoundingClientRect();
    dragMouseNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    dragMouseNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    dragRaycaster.setFromCamera(dragMouseNdc, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -worldY);
    const hit = new THREE.Vector3();
    const ok = dragRaycaster.ray.intersectPlane(plane, hit);
    if (!ok) return null;
    return fromScene(hit.x, hit.z);
  }
  const dragCoordBox = document.getElementById("dragCoordBox");
  // Conversion inversa local -> lat/lng (misma calibracion con Humedal La
  // Vaca y Humedal El Burro usada para ubicar los nodos reales), para que
  // la caja de coordenadas muestre tambien lat/lng listas para copiar.
  const CAL_A = 158502.5342667897, CAL_B = 11760483.425451731;
  const CAL_C = 75875.89881636726, CAL_D = -349119.0227795534;
  function localToLng(x) { return (x - CAL_B) / CAL_A; }
  function localToLat(y) { return (y - CAL_D) / CAL_C; }
  let draggingNode = null; // { data, worldY }
  function startDrag(nodeData, worldY, e) {
    e.stopPropagation();
    draggingNode = { data: nodeData, worldY };
    controls.enabled = false; // evita que la camara gire mientras se arrastra
  }
  window.addEventListener("pointermove", (e) => {
    if (!draggingNode) return;
    const real = screenToReal(e.clientX, e.clientY, draggingNode.worldY);
    if (!real) return;
    draggingNode.data.x = real.x;
    draggingNode.data.y = real.y;
    dragCoordBox.style.display = "block";
    dragCoordBox.textContent = `local x:${real.x.toFixed(1)} y:${real.y.toFixed(1)} · lat:${localToLat(real.y).toFixed(6)}, lng:${localToLng(real.x).toFixed(6)}`;
    updateNetPositions();
  });
  window.addEventListener("pointerup", () => {
    if (!draggingNode) return;
    draggingNode = null;
    controls.enabled = true;
  });

  let openMacroId = null;
  const macroEls = {}; // id -> {blob, num, label}
  const allSubEls = {}; // id -> {blobs:{}, lines:[], labels:{}} - TODAS las subredes, siempre visibles

  // Flecha para las lineas causa->causa (direccion del diagrama causal) -
  // se define ANTES de crear las lineas que la usan.
  const arrowDefs = svgEl("defs", {});
  netSvg.appendChild(arrowDefs);
  const arrowMarker = svgEl("marker", { id: "netArrow", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" });
  const arrowPath = svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#e2635a" });
  arrowMarker.appendChild(arrowPath);
  arrowDefs.appendChild(arrowMarker);

  const MACRO_D = 104; // un poco mas grande aun, para que quepa todo el texto completo
  const SUB_D = 88; // un poco mas grande aun, para que quepa todo el texto completo
  // Por ahora SOLO se muestra la problematica rosada (N2, contaminacion
  // hidrica) - el usuario pidio explicitamente que no se muestren las
  // otras 6 todavia (siguen sin coordenadas reales definidas).
  const VISIBLE_MACRO_IDS = ["n1", "n2", "n3", "n4", "n5", "n6"];
  const VISIBLE_MACRO = MACRO.filter(m => VISIBLE_MACRO_IDS.includes(m.id));
  VISIBLE_MACRO.forEach((m, i) => {
    const blob = makeBlob(MACRO_D, m.color);
    blob.addEventListener("click", (e) => { e.stopPropagation(); openMacroPanel(m.id); });
    blob.addEventListener("pointerdown", (e) => startDrag(m, 0.3, e));
    const label = makeLabel(m.corto, MACRO_D);
    macroEls[m.id] = { blob, label };

    // Se crean TODAS las burbujas de causas de una vez (no solo al hacer
    // clic) - todos los nodos quedan siempre visibles sobre el mapa, sin
    // necesidad de desplegar nada. Sin lineas del macro hacia cada causa
    // (se veian como una "explosion" radiando desde el centro) - solo se
    // dibujan las flechas causales reales entre las propias causas.
    const sub = SUBNETS[m.id];
    const subEls = { blobs: {}, lines: [], labels: {} };
    sub.rel.forEach(r => {
      const a = sub.nodes.find(n => n.id === r.from), b = sub.nodes.find(n => n.id === r.to);
      const line = svgEl("line", { class: "net-line", stroke: m.color, "stroke-width": 2.2, "stroke-opacity": 0.85, "marker-end": "url(#netArrow)" });
      netSvg.insertBefore(line, netSvg.firstChild);
      subEls.lines.push({ el: line, from: a, to: b });
      const polText = svgEl("text", { class: "net-pol", "text-anchor": "middle", "dominant-baseline": "central", "font-size": 14, "font-weight": 800, fill: "#fff", stroke: "#0b0c0f", "stroke-width": 3, "paint-order": "stroke" });
      polText.textContent = r.pol || "+";
      netSvg.appendChild(polText);
      subEls.lines.push({ el: polText, from: a, to: b, isPol: true });
      if (r.loop) {
        const badge = svgEl("text", { class: "net-loopbadge", "text-anchor": "middle", "font-size": 12, "font-weight": 800, fill: m.color, stroke: "#0b0c0f", "stroke-width": 3.2, "paint-order": "stroke" });
        badge.textContent = "↻ " + (sub.loopType || "R");
        netSvg.appendChild(badge);
        subEls.lines.push({ el: badge, from: a, to: b, isLoopBadge: true });
      }
    });
    sub.nodes.forEach(n => {
      const blob = makeBlob(SUB_D, m.color);
      blob.addEventListener("click", (e) => { e.stopPropagation(); openCausePanel(m.id, n.id); });
      blob.addEventListener("pointerdown", (e) => startDrag(n, 0.25, e));
      subEls.blobs[n.id] = blob;
      subEls.labels[n.id] = makeLabel(n.t, SUB_D);
    });
    allSubEls[m.id] = subEls;
  });

  function openMacroPanel(id) {
    openMacroId = id;
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
    VISIBLE_MACRO.forEach((m, i) => {
      const p = projectPoint(m.x, m.y, 0.3);
      const els = macroEls[m.id];
      placeBlob(els.blob, p.x, p.y, p.visible);
      els.label.style.left = p.x + "px"; els.label.style.top = p.y + "px";
      const visible = p.visible ? "1" : "0";
      els.label.style.opacity = visible;
    });
    // Se actualizan TODAS las subredes (de todos los macro-nodos), no
    // solo una "abierta" - ahora todo queda siempre visible sobre el mapa.
    Object.keys(allSubEls).forEach(mid => {
      const subEls = allSubEls[mid];
      const sub = SUBNETS[mid];
      sub.nodes.forEach(n => {
        const p = projectPoint(n.x, n.y, 0.25);
        placeBlob(subEls.blobs[n.id], p.x, p.y, p.visible);
        subEls.labels[n.id].style.left = p.x + "px"; subEls.labels[n.id].style.top = p.y + "px";
        subEls.labels[n.id].style.opacity = p.visible ? "1" : "0";
      });
      subEls.lines.forEach(l => {
        const pa = projectPoint(l.from.x, l.from.y, 0.25);
        const pb = projectPoint(l.to.x, l.to.y, 0.25);
        if (l.isPol) {
          l.el.setAttribute("x", pa.x + (pb.x - pa.x) * 0.72);
          l.el.setAttribute("y", pa.y + (pb.y - pa.y) * 0.72);
        } else if (l.isLoopBadge) {
          l.el.setAttribute("x", pa.x + (pb.x - pa.x) * 0.42);
          l.el.setAttribute("y", pa.y + (pb.y - pa.y) * 0.42 - 12);
        } else {
          l.el.setAttribute("x1", pa.x); l.el.setAttribute("y1", pa.y);
          l.el.setAttribute("x2", pb.x); l.el.setAttribute("y2", pb.y);
        }
      });
    });
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

// ============================================================
// "KENNEDY SEGUN EL POT": red completa de instrumentos, tratamientos y
// elementos del Plan de Ordenamiento Territorial en Kennedy, con la
// MISMA info/palabras que la referencia del usuario, en la estetica de
// burbujas organicas (goo) de la red original.
// ============================================================
(function () {
  const POT_CATS = {
    econ: { label: "Actividades económicas", color: "#c9a877" },
    eep: { label: "Estructura ecológica principal", color: "#6b4a42" },
    habit: { label: "Habitabilidad e informalidad", color: "#7a6a4a" },
    suelo: { label: "Clasificación del suelo", color: "#8d7d8a" },
    cuidado: { label: "Sistema de cuidado", color: "#c9a9b5" },
    seg: { label: "Seguridad", color: "#4a3530" },
    espacio: { label: "Espacio público", color: "#5c8f6a" },
    gob: { label: "Instrumentos de gobernanza", color: "#3d5c3d" },
    equip: { label: "Equipamientos", color: "#c9b291" },
    servicios: { label: "Servicios públicos", color: "#8fa39c" },
    movilidad: { label: "Movilidad y transporte", color: "#9bad6b" },
    upl: { label: "UPL", color: "#7d8f52" },
    riesgo: { label: "Gestión de riesgo", color: "#d19a5a" },
  };
  const POT_NODES = [
    { id: "alameda_porvenir", t: "Alameda El Porvenir", cat: "movilidad", x: 700, y: 35 },
    { id: "veeduria", t: "Comisión de Veeduría Ciudadana POT", cat: "gob", x: 560, y: 85 },
    { id: "upl15", t: "UPL 15 Porvenir (compartida Bosa-Kennedy)", cat: "upl", x: 690, y: 130 },
    { id: "reparto_cargas", t: "Reparto Proporcional de Cargas y Beneficios", cat: "gob", x: 555, y: 165 },
    { id: "manzana_bosa", t: "Manzana del Cuidado Bosa", cat: "cuidado", x: 690, y: 170 },
    { id: "colegio_bosa", t: "Colegio Sede Bosa Porvenir", cat: "equip", x: 610, y: 200 },
    { id: "mis", t: "Macroproyectos de Interés Social MIS", cat: "habit", x: 440, y: 210 },
    { id: "subsidio_vivienda", t: "Subsidio Distrital de Vivienda", cat: "habit", x: 590, y: 225 },
    { id: "eru", t: "Empresa de Renovación y Desarrollo Urbano ERU", cat: "gob", x: 410, y: 245 },
    { id: "tejido_informal", t: "Tejido Urbano Consolidado de Origen Informal (Patio Bonito El Amparo)", cat: "habit", x: 480, y: 255 },
    { id: "trat_estructural", t: "Tratamiento de Mejoramiento Integral Estructural", cat: "habit", x: 560, y: 260 },
    { id: "humedal_techo", t: "Humedal Techo", cat: "eep", x: 495, y: 270 },
    { id: "trat_occidente", t: "Tratamiento de Desarrollo Zona Occidente", cat: "habit", x: 385, y: 280 },
    { id: "trat_habitabilidad", t: "Tratamiento de Mejoramiento Integral Habitabilidad", cat: "habit", x: 525, y: 285 },
    { id: "zonas_reasentamiento", t: "Zonas de Reasentamiento Prioritario", cat: "riesgo", x: 585, y: 290 },
    { id: "upl13", t: "UPL 13 Tintal", cat: "upl", x: 455, y: 320 },
    { id: "upl14", t: "UPL 14 Patio Bonito", cat: "upl", x: 545, y: 320 },
    { id: "corredor_eco_rio", t: "Corredor Ecológico de Ronda Río Bogotá", cat: "eep", x: 365, y: 335 },
    { id: "suelos_riesgo", t: "Suelos de Protección por Riesgo no Mitigable", cat: "riesgo", x: 615, y: 325 },
    { id: "amer_rio", t: "Área de Manejo Especial del Río Bogotá", cat: "eep", x: 365, y: 355 },
    { id: "idiger", t: "Puntos Críticos de Inundación (IDIGER)", cat: "riesgo", x: 600, y: 345 },
    { id: "cai_corabastos", t: "CAI y Estación de Policía Corabastos", cat: "seg", x: 385, y: 375 },
    { id: "canal_americas", t: "Canal Américas", cat: "servicios", x: 515, y: 355 },
    { id: "quebrada_limas", t: "Quebrada Limas", cat: "eep", x: 640, y: 355 },
    { id: "alo_sur", t: "Avenida Longitudinal de Occidente ALO Sur", cat: "movilidad", x: 400, y: 390 },
    { id: "rio_bogota", t: "Río Bogotá", cat: "eep", x: 475, y: 375 },
    { id: "humedal_vaca", t: "Humedal La Vaca", cat: "eep", x: 645, y: 380 },
    { id: "avenida_boyaca", t: "Avenida Boyacá", cat: "movilidad", x: 540, y: 390 },
    { id: "canal_cundinamarca", t: "Canal Cundinamarca", cat: "servicios", x: 595, y: 400 },
    { id: "nodo_logistico13", t: "Nodo Logístico Calle 13", cat: "econ", x: 305, y: 405 },
    { id: "centro_corabastos", t: "Centro de Abasto Corabastos", cat: "econ", x: 440, y: 415 },
    { id: "biblioteca_tintal", t: "Biblioteca Pública El Tintal Manuel Zapata Olivella", cat: "equip", x: 495, y: 415 },
    { id: "rio_fucha", t: "Río Fucha", cat: "eep", x: 615, y: 415 },
    { id: "upl18", t: "UPL 18 Kennedy", cat: "upl", x: 665, y: 420 },
    { id: "zona_franca", t: "Zona Franca Fontibón", cat: "econ", x: 210, y: 425 },
    { id: "plaza_fontibon", t: "Plaza de Mercado Fontibón", cat: "econ", x: 335, y: 435 },
    { id: "metro_plmb", t: "Primera Línea del Metro de Bogotá PLMB", cat: "movilidad", x: 470, y: 440 },
    { id: "parque_timiza", t: "Parque Metropolitano Timiza", cat: "espacio", x: 725, y: 435 },
    { id: "data_center", t: "Data Center Fontibón", cat: "servicios", x: 130, y: 435 },
    { id: "areas_industriales", t: "Áreas de Actividad Industrial y Logística", cat: "econ", x: 175, y: 460 },
    { id: "portal_americas", t: "Portal Américas TransMilenio", cat: "movilidad", x: 480, y: 465 },
    { id: "hospital_kennedy", t: "Hospital de Kennedy", cat: "cuidado", x: 685, y: 460 },
    { id: "manzana_kennedy", t: "Manzana del Cuidado Kennedy", cat: "cuidado", x: 645, y: 480 },
    { id: "ciclorrutas", t: "Red Ciclorrutas Prioritarias", cat: "movilidad", x: 450, y: 490 },
    { id: "humedal_burro", t: "Humedal El Burro", cat: "eep", x: 715, y: 490 },
    { id: "corredor_cali", t: "Corredor Verde Av Ciudad de Cali", cat: "espacio", x: 470, y: 520 },
    { id: "ptar_canoas", t: "Planta de Tratamiento de Aguas Residuales (PTAR Canoas)", cat: "servicios", x: 745, y: 520 },
    { id: "patio_metro_bosa", t: "Patio Taller Metro Bosa", cat: "movilidad", x: 450, y: 555 },
    { id: "hospital_bosa", t: "Hospital de Bosa", cat: "cuidado", x: 795, y: 555 },
  ];
  const POT_EDGES = [
    ["alameda_porvenir", "upl15"], ["veeduria", "reparto_cargas"],
    ["upl15", "manzana_bosa"], ["reparto_cargas", "colegio_bosa"], ["manzana_bosa", "colegio_bosa"],
    ["colegio_bosa", "subsidio_vivienda"], ["mis", "subsidio_vivienda"], ["subsidio_vivienda", "upl14"],
    ["eru", "tejido_informal"], ["tejido_informal", "trat_estructural"], ["humedal_techo", "trat_estructural"],
    ["trat_occidente", "upl13"], ["trat_estructural", "upl14"], ["trat_habitabilidad", "upl14"],
    ["zonas_reasentamiento", "upl14"], ["trat_habitabilidad", "upl13"],
    ["corredor_eco_rio", "upl13"], ["amer_rio", "upl13"], ["cai_corabastos", "upl13"], ["alo_sur", "upl13"],
    ["suelos_riesgo", "upl14"], ["idiger", "upl14"], ["canal_americas", "upl14"],
    ["quebrada_limas", "upl18"], ["humedal_vaca", "upl18"],
    ["rio_bogota", "upl13"], ["rio_bogota", "upl14"], ["rio_bogota", "cai_corabastos"], ["rio_bogota", "avenida_boyaca"],
    ["avenida_boyaca", "upl18"], ["canal_cundinamarca", "upl18"], ["rio_fucha", "upl18"],
    ["nodo_logistico13", "zona_franca"], ["zona_franca", "data_center"], ["zona_franca", "areas_industriales"],
    ["centro_corabastos", "cai_corabastos"], ["centro_corabastos", "rio_bogota"],
    ["biblioteca_tintal", "rio_bogota"], ["plaza_fontibon", "centro_corabastos"],
    ["metro_plmb", "centro_corabastos"], ["metro_plmb", "portal_americas"],
    ["upl18", "hospital_kennedy"], ["upl18", "manzana_kennedy"], ["upl18", "parque_timiza"],
    ["portal_americas", "ciclorrutas"], ["ciclorrutas", "corredor_cali"], ["corredor_cali", "patio_metro_bosa"],
    ["hospital_kennedy", "manzana_kennedy"], ["manzana_kennedy", "humedal_burro"],
    ["humedal_burro", "ptar_canoas"], ["ptar_canoas", "hospital_bosa"],
  ];
  const potById = {}; POT_NODES.forEach(n => potById[n.id] = n);
  const potDegree = {}; POT_NODES.forEach(n => potDegree[n.id] = 0);
  POT_EDGES.forEach(([a, b]) => { potDegree[a] = (potDegree[a] || 0) + 1; potDegree[b] = (potDegree[b] || 0) + 1; });

  let potBuilt = false;
  function wrapToFit(text, maxCharsPerLine, maxLines) {
    const words = text.split(" ");
    const lines = []; let current = "";
    words.forEach(w => {
      const candidate = current ? current + " " + w : w;
      if (candidate.length > maxCharsPerLine && current) { lines.push(current); current = w; }
      else current = candidate;
    });
    if (current) lines.push(current);
    if (lines.length > maxLines) {
      const shown = lines.slice(0, maxLines);
      let last = shown[maxLines - 1];
      while (last.length > 3 && (last + "…").length > maxCharsPerLine) last = last.slice(0, -1).trim();
      shown[maxLines - 1] = last.replace(/[.,;:]+$/, "") + "…";
      return shown.join("<br>");
    }
    return lines.join("<br>");
  }
  function buildPotNetwork() {
    if (potBuilt) return;
    potBuilt = true;
    const stage = document.getElementById("potStage");
    const gooLayer = document.getElementById("potGooLayer");
    const svg = document.getElementById("potSvg");
    const labelLayer = document.getElementById("potLabelLayer");
    const rect = stage.getBoundingClientRect();
    const SVGNS = "http://www.w3.org/2000/svg";
    function sc(v, total, size) { return (v / total) * size; }
    const W = 900, H = 590;
    // Radios bastante mas grandes que antes (0-based en grado de
    // conexion), para que el texto quepa adentro de cada burbuja.
    const posPx = {};
    const radiusPx = {};
    POT_NODES.forEach(n => {
      const p = { x: sc(n.x, W, rect.width), y: sc(n.y, H, rect.height) };
      posPx[n.id] = p;
      radiusPx[n.id] = 32 + (potDegree[n.id] || 0) * 5.5; // burbujas bastante mas grandes
    });
    // Pasada de separacion: como los radios ahora son mucho mas grandes
    // que cuando se ubicaron las posiciones a mano (copiadas del
    // referente), muchas burbujas quedarian encimadas - se corren varias
    // iteraciones de repulsion simple partiendo de esas mismas
    // posiciones (para conservar la forma general del referente), para
    // separarlas lo justo y aprovechar mejor el espacio disponible.
    const ids = POT_NODES.map(n => n.id);
    for (let pass = 0; pass < 400; pass++) {
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        const a = posPx[ids[i]], b = posPx[ids[j]];
        const minDist = (radiusPx[ids[i]] + radiusPx[ids[j]]) * 1.55; // aun mas separacion, para asegurar que ninguna burbuja se toque
        let dx = a.x - b.x, dy = a.y - b.y;
        let dist = Math.hypot(dx, dy) || 0.001;
        if (dist < minDist) {
          if (dist < 0.01) { dx = (Math.random() - 0.5) * 2; dy = (Math.random() - 0.5) * 2; dist = Math.hypot(dx, dy); }
          const overlap = (minDist - dist) / 2, ux = dx / dist, uy = dy / dist;
          a.x += ux * overlap; a.y += uy * overlap; b.x -= ux * overlap; b.y -= uy * overlap;
        }
      }
    }
    ids.forEach(id => {
      const r = radiusPx[id];
      posPx[id].x = Math.max(r + 4, Math.min(rect.width - r - 4, posPx[id].x));
      posPx[id].y = Math.max(r + 4, Math.min(rect.height - r - 4, posPx[id].y));
    });

    POT_EDGES.forEach(([a, b]) => {
      const pa = posPx[a], pb = posPx[b];
      const ra = radiusPx[a], rb = radiusPx[b];
      const dx = pb.x - pa.x, dy = pb.y - pa.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist, uy = dy / dist;
      // La linea arranca y termina justo en el borde de cada burbuja (no
      // en su centro), para que no se vea entrando/atravesando el
      // circulo - solo se ve la linea en el espacio VACIO entre ambas.
      const startX = pa.x + ux * (ra + 2), startY = pa.y + uy * (ra + 2);
      const endX = pb.x - ux * (rb + 2), endY = pb.y - uy * (rb + 2);
      const line = document.createElementNS(SVGNS, "line");
      line.setAttribute("x1", startX); line.setAttribute("y1", startY);
      line.setAttribute("x2", endX); line.setAttribute("y2", endY);
      line.setAttribute("stroke", "#c8ccd2"); line.setAttribute("stroke-width", "1.3"); line.setAttribute("stroke-opacity", "0.55");
      svg.appendChild(line);
    });
    POT_NODES.forEach(n => {
      const p = posPx[n.id];
      const r = radiusPx[n.id];
      const blob = document.createElement("div");
      blob.style.cssText = `position:absolute; left:${p.x}px; top:${p.y}px; width:${r * 2}px; height:${r * 2}px; margin:-${r}px 0 0 -${r}px; border-radius:50%; background:${POT_CATS[n.cat].color}; cursor:pointer; pointer-events:auto; transition:transform .15s ease;`;
      blob.addEventListener("mouseenter", () => { blob.style.transform = "scale(1.1)"; });
      blob.addEventListener("mouseleave", () => { blob.style.transform = "scale(1)"; });
      blob.addEventListener("click", () => openPotInfo(n));
      gooLayer.appendChild(blob);
      // El nombre (lo que quepa) ahora se muestra SIEMPRE dentro de la
      // burbuja; el texto completo + categoria + conexiones se ve al
      // hacer clic, en el panel lateral.
      const label = document.createElement("div");
      const fontPx = 9.5, lineH = fontPx * 1.22;
      let maxLines = Math.max(2, Math.floor((r * 2 * 0.82) / lineH));
      let halfH = (maxLines * lineH) / 2;
      while (halfH >= r * 0.86 && maxLines > 1) { maxLines--; halfH = (maxLines * lineH) / 2; }
      const safeWidth = 2 * Math.sqrt(Math.max(0, r * r - halfH * halfH)) * 0.86;
      const maxCharsPerLine = Math.max(5, Math.floor(safeWidth / (fontPx * 0.56)));
      label.innerHTML = wrapToFit(n.t, maxCharsPerLine, maxLines);
      label.style.cssText = `position:absolute; left:${p.x}px; top:${p.y}px; transform:translate(-50%,-50%); width:${safeWidth}px; text-align:center; font-size:${fontPx}px; font-weight:600; color:#ffffff; text-shadow:0 1px 2px rgba(0,0,0,.55); line-height:${lineH}px; pointer-events:none;`;
      labelLayer.appendChild(label);
    });
    const legend = document.getElementById("potLegend");
    Object.values(POT_CATS).forEach(c => {
      const el = document.createElement("span");
      el.style.cssText = "display:flex; align-items:center; gap:5px; font-size:10.5px; color:#c3cad2;";
      el.innerHTML = `<i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c.color};"></i>${c.label}`;
      legend.appendChild(el);
    });
  }
  const potInfoPanel = document.getElementById("potInfoPanel");
  const potInfoBody = document.getElementById("potInfoBody");
  function openPotInfo(n) {
    const desde = POT_EDGES.filter(([a, b]) => b === n.id).map(([a]) => potById[a]);
    const hacia = POT_EDGES.filter(([a, b]) => a === n.id).map(([, b]) => potById[b]);
    potInfoBody.innerHTML = `
      <p style="font-size:10.5px; text-transform:uppercase; letter-spacing:.05em; color:${POT_CATS[n.cat].color}; margin:0 0 4px; font-weight:700;">${POT_CATS[n.cat].label}</p>
      <h2 style="font-size:16px; color:#fff; margin:0 0 14px; line-height:1.3;">${n.t}</h2>
      ${desde.length ? `<div style="margin-bottom:12px;"><b style="font-size:11px; color:#9aa3ad;">Se relaciona desde</b>${desde.map(x => `<div style="font-size:12px; color:#e8ecf1; background:rgba(255,255,255,.06); border-radius:8px; padding:6px 9px; margin-top:5px;">${x.t}</div>`).join("")}</div>` : ""}
      ${hacia.length ? `<div><b style="font-size:11px; color:#9aa3ad;">Se conecta hacia</b>${hacia.map(x => `<div style="font-size:12px; color:#e8ecf1; background:rgba(255,255,255,.06); border-radius:8px; padding:6px 9px; margin-top:5px;">${x.t}</div>`).join("")}</div>` : ""}
    `;
    potInfoPanel.style.transform = "translateX(0)";
  }
  document.getElementById("potInfoClose").addEventListener("click", () => { potInfoPanel.style.transform = "translateX(100%)"; });
  const potModal = document.getElementById("potModal");
  document.getElementById("potBtn").addEventListener("click", () => {
    potModal.style.display = "flex";
    buildPotNetwork();
  });
  document.getElementById("potModalClose").addEventListener("click", () => { potModal.style.display = "none"; });
})();
