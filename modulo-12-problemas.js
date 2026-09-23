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
  controls.maxZoom = 350;
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
    if (slider) {
      slider.max = String(Math.round(totalTime));
      slider.disabled = false;
    }
    if (playBtn) {
      playBtn.disabled = false;
      playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    }
    setStatus("", false);
    if (timeLabel) timeLabel.textContent = `00:00 / ${fmtTime(totalTime)}`;
    playing = true;
    lastFrameAt = null;
    currentTime = 0;
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
      viewSize = 190; // Acomodado más cerca a pedido del usuario (antes 326)
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
  function setAxonometricView() {
    camera.position.set(197.22, 780.06, 747.66);
    controls.target.set(144.45, 24.68, -5.88);
    camera.zoom = 1.23;
    viewSize = 190.0;
    resize();
    camera.updateProjectionMatrix();
    controls.update();
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
      const maxT = parseFloat(slider ? slider.max : 0) || (timesteps.length ? timesteps[timesteps.length - 1].time : 0);
      if (maxT > 0 && currentTime >= maxT) {
        currentTime = currentTime % maxT;
      }
      if (slider) slider.value = String(Math.round(currentTime));
      if (timeLabel) timeLabel.textContent = `${fmtTime(currentTime)} / ${fmtTime(maxT)}`;
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
        { id:"s1_1", t:"Infiltración de camiones pesados de escala regional en calles barriales de una sola calzada", x:6315.4, y:2529.8 },
        { id:"s1_2", t:"Filas de camiones y congestión represada sobre las avenidas principales", x:8097.5, y:2265.9 },
        { id:"s1_3", t:"Deterioro continuo de la capa de rodadura ante el tránsito de carga pesada", x:7197.9, y:3738.8 },
        { id:"s1_4", t:"Conflicto y entrecruzamiento de flujos entre camiones, vehículos particulares, bicipatios y peatones", x:6876.1, y:3052.3 },
        { id:"s1_5", t:"Ingreso vehicular en ángulo recto que obliga a frenar sobre la calzada arterial", x:6303.1, y:3748.1 },
      ],
      rel:[
        { from:"s1_5", to:"s1_2", pol:"+" },
        { from:"s1_2", to:"s1_1", pol:"+" },
        { from:"s1_1", to:"s1_4", pol:"+" },
        { from:"s1_4", to:"s1_3", pol:"+" },
      ],
    },
    n2: {
      nodes:[
        { id:"s2_1", t:"Vertimiento de lixiviados orgánicos al alcantarillado sin tratamiento", x:7563.4, y:3372.6 },
        { id:"s2_2", t:"Escorrentía de residuos de alimentos", x:6220.1, y:1816.0 },
        { id:"s2_3", t:"Eutrofización y tinción de aguas en la cuenca hídrica", x:5823.4, y:4944.2 },
        { id:"s2_4", t:"Vertimiento de grasas y agua de lavado de bodegas hacia canales superficiales", x:6048.5, y:4123.4 },
        { id:"s2_5", t:"Escorrentía de alimentos", x:4746.1, y:4233.7 },
        { id:"s2_6", t:"Vertimiento de lixiviados por residuos inorgánicos", x:8889.5, y:3352.4, deleted:true },
        { id:"s2_7", t:"Vertimiento de agua sucia y lixiviados al alcantarillado pluvial sin tratamiento", x:8216.2, y:4012.9 },
        { id:"s2_8", t:"Arrastre de basuras desde la calle hacia los canales de agua en eventos de lluvia", x:6505.6, y:4421.9 },
        { id:"s2_9", t:"Infiltración de agua contaminada en la franja del humedal", x:6012.9, y:1933.1 },
        { id:"s2_10", t:"Barrera física del cerramiento privado sobre la franja de protección ambiental", x:5710.4, y:1911.4, deleted:true },
        { id:"s2_11", t:"Insuficiencia de redes sanitarias destinadas a la limpieza de bodegas", x:6779.3, y:2429.1 },
      ],
      rel:[
        { from:"s2_11", to:"s2_1", pol:"+" },
        { from:"s2_4", to:"s2_1", pol:"+" },
        { from:"s2_1", to:"s2_7", pol:"+" },
        { from:"s2_7", to:"s2_8", pol:"+" },
        { from:"s2_10", to:"s2_9", pol:"+" },
        { from:"s2_2", to:"s2_9", pol:"+" },
        { from:"s2_9", to:"s2_3", pol:"+" },
        { from:"s2_8", to:"s2_3", pol:"+" },
        { from:"s2_6", to:"s2_3", pol:"+" },
      ],
    },
    n3: {
      nodes:[
        { id:"s3_1", t:"Entrada masiva de carga alimentaria regional en un solo predio", x:7351.1, y:2267.9 },
        { id:"s3_2", t:"Represión de camiones en espera ante la diferencia entre horarios de llegada y venta", x:5695.7, y:2640.7, deleted:true },
        { id:"s3_3", t:"Saturación comercial intensiva en un grupo reducido de bodegas", x:6488.3, y:2252.8 },
        { id:"s3_4", t:"Llegada masiva y continua de carga alimentaria regional a un único punto urbano", x:6252.8, y:1993.0 },
        { id:"s3_5", t:"Represión de camiones en vía pública durante la espera de apertura de bodegas", x:6707.5, y:1990.2 },
        { id:"s3_6", t:"Mezcla física de comercialización mayorista con almacenamiento, empaque y preparación de alimentos", x:5701.5, y:2460.8 },
        { id:"s3_7", t:"Saturación comercial intensiva en una franja reducida de bodegas", x:5901.1, y:2200.8 },
        { id:"s3_8", t:"Aglomeración de compradores, carretas y vehículos en los accesos a los sectores de venta", x:6426.7, y:3000.7 },
      ],
      rel:[
        { from:"s3_1", to:"s3_5", pol:"+" },
        { from:"s3_4", to:"s3_2", pol:"+" },
        { from:"s3_5", to:"s3_8", pol:"+" },
        { from:"s3_2", to:"s3_8", pol:"+" },
        { from:"s3_8", to:"s3_3", pol:"+" },
        { from:"s3_8", to:"s3_7", pol:"+" },
        { from:"s3_3", to:"s3_6", pol:"+" },
      ],
    },
    n4: {
      nodes:[
        { id:"s4_1", t:"Crecimiento de torres de apartamentos sobre infraestructuras con capacidad límite", x:7888.5, y:4383.3 },
        { id:"s4_2", t:"Construcción de edificios que superan la altura permitida sobre vías estrechas", x:7293.7, y:1833.1, deleted:true },
        { id:"s4_3", t:"Fricción en la convivencia directa entre conjuntos residenciales y zonas de bodegaje", x:5413.3, y:2762.6 },
        { id:"s4_4", t:"Coincidencia temporal entre los viajes de residentes y el transporte de carga", x:7239.1, y:2609.5 },
        { id:"s4_5", t:"Ocupación de vías barriales con carros particulares ante estacionamientos agotados", x:6678.7, y:2917.5 },
        { id:"s4_6", t:"Construcción masiva de torres residenciales superando la capacidad de las vías barriales", x:7933.8, y:2667.8 },
        { id:"s4_7", t:"Generación concentrada de viajes cotidianos desde conjuntos verticales hacia pocos corredores", x:7932.3, y:3554.7 },
        { id:"s4_8", t:"Saturación del sistema masivo (TransMilenio y SITP) por exceso de pasajeros en horas pico", x:7626.1, y:2222.8 },
        { id:"s4_9", t:"Retraso en las frecuencias de buses debido al parqueo informal en los carriles mixtos", x:6809.2, y:3351.5 },
      ],
      rel:[
        { from:"s4_1", to:"s4_7", pol:"+" },
        { from:"s4_6", to:"s4_7", pol:"+" },
        { from:"s4_7", to:"s4_8", pol:"+" },
        { from:"s4_8", to:"s4_9", pol:"+" },
        { from:"s4_2", to:"s4_5", pol:"+" },
        { from:"s4_4", to:"s4_3", pol:"+" },
      ],
    },
    n5: {
      nodes:[
        { id:"s5_1", t:"Ocupación comercial de andenes estrechos con cajas, huacales y mercancía", x:6476.6, y:1793.7 },
        { id:"s5_2", t:"Instalación de puestos informales de venta de alimentos sobre la calzada vehicular", x:6928.1, y:2589.0 },
        { id:"s5_3", t:"Expulsión de peatones hacia la calle junto al tránsito de camiones pesados", x:6360.9, y:1445.0 },
        { id:"s5_4", t:"Aglomeración peatonal sobre aceras fragmentadas e invadidas", x:7114.5, y:2739.4, deleted:true },
        { id:"s5_5", t:"Apropiación comercial de vías residenciales fuera del muro de cerramiento", x:6093.0, y:2745.6 },
      ],
      rel:[
        { from:"s5_1", to:"s5_3", pol:"+" },
        { from:"s5_3", to:"s5_4", pol:"+" },
        { from:"s5_2", to:"s5_5", pol:"+" },
      ],
    },
    n6: {
      nodes:[
        { id:"s6_1", t:"Acumulación de basura orgánica superando la capacidad de los contenedores", x:6163.3, y:2183.0 },
        { id:"s6_2", t:"Estacionamiento prolongado de camiones de gran tonelaje en calles residenciales", x:5999.0, y:3425.2 },
        { id:"s6_3", t:"Derrame de lixiviados sobre el pavimento a la intemperie", x:5996.5, y:2353.4 },
        { id:"s6_4", t:"Bloqueo de puntos de recolección de basura con vehículos parqueados", x:6875.5, y:2245.9 },
        { id:"s6_5", t:"Generación de malos olores y focos sanitarios junto a las zonas de vivienda", x:6678.0, y:2583.5 },
      ],
      rel:[
        { from:"s6_1", to:"s6_4", pol:"+" },
        { from:"s6_4", to:"s6_5", pol:"+" },
        { from:"s6_2", to:"s6_3", pol:"+" },
        { from:"s6_3", to:"s6_5", pol:"+" },
      ],
    },
    n7: {
      nodes:[
        { id:"s7_1", t:"Rigidez de los instrumentos normativos distritales frente a la autoorganización local", x:6534.1, y:2038.6, deleted:true },
        { id:"s7_2", t:"Brecha entre las determinantes del POT y las dinámicas reales de uso del suelo", x:6340.3, y:2150.3, deleted:true },
        { id:"s7_3", t:"Coexistencia de regímenes normativos entre regulación pública y administración privada", x:6668.3, y:2250.1, deleted:true },
        { id:"s7_4", t:"Consolidación de dinámicas informales al margen de controles institucionales", x:7566.6, y:1609.0, deleted:true },
        { id:"s7_5", t:"Pérdida de eficacia en los mecanismos institucionales de regulación territorial", x:6596.9, y:2422.9, deleted:true },
      ],
      rel:[
        { from:"s7_1", to:"s7_2", pol:"+" },
        { from:"s7_2", to:"s7_3", pol:"+" },
        { from:"s7_3", to:"s7_4", pol:"+" },
        { from:"s7_4", to:"s7_5", pol:"+" },
        { from:"s7_5", to:"s7_1", pol:"+" },
      ],
    },
  };

  // Anti-overlap pass: repulsión garantizada entre todas las bolas para que NINGUNA bola se toque ni solape entre sí
  const allSubNodesList = [];
  Object.keys(SUBNETS).forEach(mid => {
    const m = macroById[mid];
    const nodes = SUBNETS[mid].nodes;
    nodes.forEach((n, i) => {
      if (n.x === undefined || n.y === undefined) {
        const angle = (i / nodes.length) * Math.PI * 2;
        const r = 60 + (i % 3) * 20;
        n.x = m.x + Math.cos(angle) * r;
        n.y = m.y + Math.sin(angle) * r;
      }
      n.macroId = mid;
      allSubNodesList.push(n);
    });
  });

  const MIN_NODE_DIST = 180.0; // Distancia amplia mínima garantizada para que NINGUNA bola se toque ni solape entre sí
  for (let iter = 0; iter < 400; iter++) {
    for (let i = 0; i < allSubNodesList.length; i++) {
      for (let j = i + 1; j < allSubNodesList.length; j++) {
        const a = allSubNodesList[i], b = allSubNodesList[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        if (dist < MIN_NODE_DIST) {
          if (dist < 0.1) {
            const angle = (i * 1.37 + j * 2.1) + Math.random() * Math.PI;
            dx = Math.cos(angle) * (MIN_NODE_DIST + 20);
            dy = Math.sin(angle) * (MIN_NODE_DIST + 20);
            dist = Math.hypot(dx, dy);
          }
          const overlap = (MIN_NODE_DIST - dist) / 2;
          const ux = dx / dist, uy = dy / dist;
          a.x -= ux * overlap; a.y -= uy * overlap;
          b.x += ux * overlap; b.y += uy * overlap;
        }
      }
    }
  }

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
  const MACRO_CATEGORY_ICONS = {
    n1: '<i class="fa-solid fa-car" style="font-size:15px; color:#fff;"></i>',
    n2: '<i class="fa-solid fa-fish" style="font-size:15px; color:#fff;"></i>',
    n3: '<i class="fa-solid fa-store" style="font-size:15px; color:#fff;"></i>',
    n4: '<i class="fa-solid fa-building" style="font-size:15px; color:#fff;"></i>',
    n5: '<i class="fa-solid fa-person-walking" style="font-size:15px; color:#fff;"></i>',
    n6: '<i class="fa-solid fa-trash-can" style="font-size:15px; color:#fff;"></i>',
    n7: '<i class="fa-solid fa-file-contract" style="font-size:15px; color:#fff;"></i>',
  };

  function makeLabel(text, diameter, nodeId, macroId) {
    const d = document.createElement("div");
    d.className = "net-label";
    const fontPx = 9.5, lineH = fontPx * 1.2;
    const rr = diameter / 2;
    let maxLines = Math.min(3, Math.max(2, Math.floor((diameter * 0.86) / lineH)));
    let halfH = (maxLines * lineH) / 2;
    while (halfH >= rr * 0.9 && maxLines > 1) { maxLines--; halfH = (maxLines * lineH) / 2; }
    const safeWidth = 2 * Math.sqrt(Math.max(0, rr * rr - halfH * halfH)) * 0.9;
    const maxCharsPerLine = Math.max(5, Math.floor(safeWidth / (fontPx * 0.54)));
    d.dataset.fullHtml = wrapToFit(text, maxCharsPerLine, maxLines);
    d.dataset.shortHtml = MACRO_CATEGORY_ICONS[macroId] || `<span style="font-weight:800; font-size:11px; letter-spacing:0.5px; opacity:0.9;">${nodeId ? nodeId.toUpperCase() : ''}</span>`;
    d.style.width = safeWidth + "px";
    d.style.fontSize = fontPx + "px";
    d.style.lineHeight = lineH + "px";
    d.innerHTML = d.dataset.shortHtml;
    netLabelLayer.appendChild(d);
    return d;
  }
  function makeBlob(diameter, colorHex) {
    const d = document.createElement("div");
    d.className = "net-blob";
    d.style.width = d.style.height = diameter + "px";
    d.style.background = hexToRgba(colorHex, 0.78);
    d.style.border = `2px solid ${colorHex}`;
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

  // Conexiones inter-redes (13 relaciones que unen sub-problemas entre diferentes categorías)
  const INTER_NETWORK_REL = [
    { from:"s2_3", to:"s3_2", pol:"+", verbo:"La saturación hídrica y falta de infiltración impulsa la ocupación informal de suelo para acopio agrocomercial local", inter:true },
    { from:"s1_1", to:"s3_5", pol:"+", verbo:"La llegada constante de camiones regionales satura de manera crítica la trama barrial circundante", inter:true },
    { from:"s4_1", to:"s3_1", pol:"+", verbo:"La alta densidad poblacional nueva exige un mayor volumen de abastecimiento de alimentos", inter:true },
    { from:"s3_3", to:"s4_1", pol:"-", verbo:"La hipercomercialización descontrolada desincentiva la inversión en vivienda formal de calidad", inter:true },
    { from:"s7_3", to:"s1_2", pol:"-", verbo:"La falta de regulación pública unificada impide ampliar o gestionar eficazmente la infraestructura vial perimetral", inter:true },
    { from:"s6_5", to:"s7_2", pol:"+", verbo:"El deterioro ambiental evidencia la brecha insalvable entre el POT oficial y el uso real del suelo", inter:true },
    { from:"s6_2", to:"s2_1", pol:"+", verbo:"La acumulación de basuras y escombros obstruye los canales provocando vertimientos sin tratamiento", inter:true },
    { from:"s2_5", to:"s6_1", pol:"+", verbo:"La degradación de la red hídrica reduce el control sanitario aumentando la generación desordenada de residuos", inter:true },
    { from:"s2_1", to:"s1_5", pol:"+", verbo:"El deterioro ambiental de las calzadas favorece la presencia de cargadores informales y tracción humana", inter:true },
    { from:"s2_2", to:"s5_3", pol:"+", verbo:"El desborde de lixiviados en áreas públicas atrae ventas informales de desperdicios y acopio en vía", inter:true },
    { from:"s5_1", to:"s4_2", pol:"+", verbo:"La falta de estacionamiento interno genera sobrecarga en las redes públicas de servicios del entorno", inter:true },
    { from:"s5_2", to:"s1_2", pol:"+", verbo:"Las maniobras de carga y descarga en vía pública reducen drásticamente la capacidad de la red vial", inter:true },
    { from:"s1_4", to:"s6_2", pol:"+", verbo:"El parqueo prolongado de camiones convierte las rondas y andenes en puntos clandestinos de arrojamiento de basuras", inter:true }
  ];

  // Diccionario unificado con todos los nodos por ID
  const allNodesById = {};
  Object.keys(SUBNETS).forEach(mId => {
    SUBNETS[mId].nodes.forEach(n => {
      n.macroId = mId;
      allNodesById[n.id] = n;
    });
  });

  // Calcular el grado (número total de conexiones) de cada causa para que las más conectadas sean más grandes
  const nodeDegrees = {};
  Object.keys(SUBNETS).forEach(mid => {
    SUBNETS[mid].nodes.forEach(n => nodeDegrees[n.id] = 0);
  });
  Object.keys(SUBNETS).forEach(mid => {
    SUBNETS[mid].rel.forEach(r => {
      if (nodeDegrees[r.from] !== undefined) nodeDegrees[r.from]++;
      if (nodeDegrees[r.to] !== undefined) nodeDegrees[r.to]++;
    });
  });
  INTER_NETWORK_REL.forEach(r => {
    if (nodeDegrees[r.from] !== undefined) nodeDegrees[r.from]++;
    if (nodeDegrees[r.to] !== undefined) nodeDegrees[r.to]++;
  });

  const deletedNodeIds = new Set(["s2_6", "s3_2", "s4_2", "s5_4", "s7_4", "s7_2", "s7_1", "s7_3", "s7_5", "s2_10"]);

  function getSubNodeDiameter(nodeId) {
    const deg = nodeDegrees[nodeId] || 0;
    if (deg <= 1) return 34;
    if (deg === 2) return 44;
    if (deg === 3) return 54;
    return 66; // Bolas con más conexiones quedan significativamente más grandes
  }

  function deleteNode(causeId) {
    deletedNodeIds.add(causeId);
    Object.keys(allSubEls).forEach(mid => {
      const subEls = allSubEls[mid];
      if (subEls.blobs[causeId]) {
        subEls.blobs[causeId].style.display = "none";
        subEls.blobs[causeId].remove();
        delete subEls.blobs[causeId];
      }
      if (subEls.labels[causeId]) {
        subEls.labels[causeId].style.display = "none";
        subEls.labels[causeId].remove();
        delete subEls.labels[causeId];
      }
      subEls.lines = subEls.lines.filter(l => {
        if (l.fromId === causeId || l.toId === causeId || (l.from && l.from.id === causeId) || (l.to && l.to.id === causeId)) {
          if (l.el) l.el.remove();
          return false;
        }
        return true;
      });
    });
    netPanel.classList.remove("open");
    updateNetPositions();
  }

  const copyAllBtn = document.getElementById("copyAllCoordsBtn");
  if (copyAllBtn) {
    copyAllBtn.addEventListener("click", async () => {
      let activeCount = 0;
      let out = `// === COORDENADAS DE SUB-PROBLEMAS REACOMODADOS (MÓDULO 12 AXO 3D) ===\nconst SUBNETS_ACOMODADAS = {\n`;
      Object.keys(SUBNETS).forEach(mid => {
        const m = macroById[mid];
        out += `  // --- ${m.corto} ---\n`;
        SUBNETS[mid].nodes.forEach(n => {
          const isDeleted = deletedNodeIds.has(n.id);
          if (!isDeleted) activeCount++;
          const delLabel = isDeleted ? ` [ELIMINADO]` : ``;
          out += `  { id: "${n.id}", t: "${n.t.replace(/"/g, '\\"')}", x: ${n.x.toFixed(1)}, y: ${n.y.toFixed(1)}${isDeleted ? `, deleted: true` : ``} }, //${delLabel} lat: ${localToLat(n.y).toFixed(6)}, lng: ${localToLng(n.x).toFixed(6)}\n`;
        });
      });
      out += `};\n`;
      if (deletedNodeIds.size > 0) {
        out += `\n// LISTA DE ID ELIMINADOS POR EL USUARIO (${deletedNodeIds.size}):\n`;
        out += `const DELETED_IDS = [${Array.from(deletedNodeIds).map(id => `"${id}"`).join(", ")}];\n`;
      }
      out = out.trim();
      const box = document.getElementById("allCoordsOutput");
      if (box) {
        box.value = out;
        box.style.display = "block";
        box.select();
      }
      try { await navigator.clipboard.writeText(out); } catch (err) {}
      copyAllBtn.innerHTML = `<i class="fa-solid fa-check"></i> ¡Copiado (${activeCount} activas${deletedNodeIds.size > 0 ? `, ${deletedNodeIds.size} elim.` : ''})!`;
      setTimeout(() => { copyAllBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copiar Coordenadas`; }, 2500);
    });
  }

  let draggingNode = null; // { data, worldY }
  function startDrag(nodeData, worldY, e) {
    e.stopPropagation();
    draggingNode = { data: nodeData, worldY };
    controls.enabled = false;
  }
  window.addEventListener("pointermove", (e) => {
    if (!draggingNode) return;
    const real = screenToReal(e.clientX, e.clientY, draggingNode.worldY);
    if (!real) return;
    draggingNode.data.x = real.x;
    draggingNode.data.y = real.y;
    if (dragCoordBox) {
      dragCoordBox.innerHTML = `
        <strong style="color:#fff;">${draggingNode.data.t || draggingNode.data.corto}</strong><br>
        <span style="font-family:monospace; color:#24c8bd;">lat: ${localToLat(real.y).toFixed(6)}, lng: ${localToLng(real.x).toFixed(6)}</span><br>
        <span style="font-family:monospace; color:#a0aec0;">(local x: ${real.x.toFixed(1)}, y: ${real.y.toFixed(1)})</span>
      `;
    }
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

  const arrowDefs = svgEl("defs", {});
  netSvg.appendChild(arrowDefs);
  const arrowMarker = svgEl("marker", { id: "netArrow", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" });
  const arrowPath = svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#e2635a" });
  arrowMarker.appendChild(arrowPath);
  arrowDefs.appendChild(arrowMarker);

  const MACRO_D = 74;
  const SUB_D = 58;

  Object.keys(SUBNETS).forEach(mId => {
    const m = macroById[mId];
    const sub = SUBNETS[mId];
    const subEls = { blobs: {}, lines: [], labels: {} };
    sub.nodes.forEach(n => {
      const diameter = getSubNodeDiameter(n.id);
      const blob = makeBlob(diameter, m.color);
      blob.addEventListener("click", (e) => { e.stopPropagation(); openCausePanel(mId, n.id); });
      blob.addEventListener("pointerdown", (e) => startDrag(n, 0.25, e));
      subEls.blobs[n.id] = blob;
      const label = makeLabel(n.t, diameter, n.id, mId);
      label.addEventListener("click", (e) => { e.stopPropagation(); openCausePanel(mId, n.id); });
      label.addEventListener("pointerdown", (e) => startDrag(n, 0.25, e));
      subEls.labels[n.id] = label;
    });
    allSubEls[mId] = subEls;
  });

  // Renderizar TODAS las líneas de conexión (internas + inter-redes)
  const allRelList = [];
  Object.keys(SUBNETS).forEach(mId => {
    SUBNETS[mId].rel.forEach(r => allRelList.push({ ...r, color: macroById[mId].color }));
  });
  INTER_NETWORK_REL.forEach(r => {
    const fromNode = allNodesById[r.from];
    const color = fromNode ? macroById[fromNode.macroId].color : "#24c8bd";
    allRelList.push({ ...r, color });
  });

  const interLinesGroup = { lines: [] };
  allRelList.forEach(r => {
    const a = allNodesById[r.from], b = allNodesById[r.to];
    if (!a || !b) return;
    const line = svgEl("line", { class: "net-line", stroke: r.color, "stroke-width": 2.2, "stroke-opacity": 0.85, "marker-end": "url(#netArrow)" });
    netSvg.insertBefore(line, netSvg.firstChild);
    interLinesGroup.lines.push({ el: line, from: a, to: b, fromId: r.from, toId: r.to });
    const polText = svgEl("text", { class: "net-pol", "text-anchor": "middle", "dominant-baseline": "central", "font-size": 14, "font-weight": 800, fill: "#fff", stroke: "#0b0c0f", "stroke-width": 3, "paint-order": "stroke" });
    polText.textContent = r.pol || "+";
    netSvg.appendChild(polText);
    interLinesGroup.lines.push({ el: polText, from: a, to: b, isPol: true });
    if (r.loop) {
      const badge = svgEl("text", { class: "net-loopbadge", "text-anchor": "middle", "font-size": 12, "font-weight": 800, fill: r.color, stroke: "#0b0c0f", "stroke-width": 3.2, "paint-order": "stroke" });
      badge.textContent = "↻ " + (r.loopLabel || "R");
      netSvg.appendChild(badge);
      interLinesGroup.lines.push({ el: badge, from: a, to: b, isLoopBadge: true });
    }
  });
  allSubEls["_allLines"] = interLinesGroup;

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
      <div class="block" style="margin-top:18px;">
        <button type="button" id="deleteNodeBtn" style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid rgba(226,99,90,.5); background:rgba(226,99,90,.15); color:#e2635a; font-size:12px; font-weight:700; cursor:pointer; transition:all .15s ease;">
          <i class="fa-solid fa-trash"></i> Eliminar esta bola
        </button>
      </div>
    `;
    const delBtn = document.getElementById("deleteNodeBtn");
    if (delBtn) {
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteNode(causeId);
      });
    }
    netPanel.classList.add("open");
  }

  function placeBlob(blob, x, y, visible) {
    blob.style.left = x + "px"; blob.style.top = y + "px";
    blob.style.display = visible ? "block" : "none";
  }

  // Actualización en vivo del cuadro HUD flotante de zoom y coordenadas
  function updateCamZoomHud() {
    const hudCamZoom = document.getElementById("hudCamZoomVal");
    const hudViewSize = document.getElementById("hudViewSizeVal");
    const hudCenter = document.getElementById("hudCenterVal");
    const hudLatLng = document.getElementById("hudLatLngVal");
    if (!hudCamZoom || !hudViewSize || !hudCenter || !hudLatLng) return;

    const realCenter = fromScene(controls.target.x, controls.target.z);
    const lat = localToLat(realCenter.y);
    const lng = localToLng(realCenter.x);

    hudCamZoom.textContent = camera.zoom.toFixed(2);
    hudViewSize.textContent = viewSize.toFixed(1);
    hudCenter.textContent = `x:${realCenter.x.toFixed(1)}, y:${realCenter.y.toFixed(1)}`;
    hudLatLng.textContent = `lat:${lat.toFixed(6)}, lng:${lng.toFixed(6)}`;
  }

  controls.addEventListener("change", updateCamZoomHud);
  setTimeout(updateCamZoomHud, 500);

  const copyCamBtn = document.getElementById("copyCamCoordsBtn");
  if (copyCamBtn) {
    copyCamBtn.addEventListener("click", async () => {
      const realCenter = fromScene(controls.target.x, controls.target.z);
      const lat = localToLat(realCenter.y);
      const lng = localToLng(realCenter.x);
      const textToCopy = `camera.zoom: ${camera.zoom.toFixed(2)}, viewSize: ${viewSize.toFixed(1)}, centerLocal: { x: ${realCenter.x.toFixed(1)}, y: ${realCenter.y.toFixed(1)} }, lat: ${lat.toFixed(6)}, lng: ${lng.toFixed(6)}, target3D: { x: ${controls.target.x.toFixed(2)}, y: ${controls.target.y.toFixed(2)}, z: ${controls.target.z.toFixed(2)} }, pos3D: { x: ${camera.position.x.toFixed(2)}, y: ${camera.position.y.toFixed(2)}, z: ${camera.position.z.toFixed(2)} }`;

      const outputBox = document.getElementById("hudCoordsOutput");
      if (outputBox) {
        outputBox.value = textToCopy;
        outputBox.style.display = "block";
        outputBox.select();
      }
      try {
        await navigator.clipboard.writeText(textToCopy);
        copyCamBtn.innerHTML = `<i class="fa-solid fa-check"></i> ¡Copiado!`;
        setTimeout(() => { copyCamBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copiar`; }, 2000);
      } catch (e) {}
    });
  }
  function updateNetPositions() {
    const isZoomedOut = camera.zoom < 1.6;
    Object.keys(allSubEls).forEach(mid => {
      if (mid === "_allLines") return;
      const subEls = allSubEls[mid];
      const sub = SUBNETS[mid];
      if (!sub || !sub.nodes) return;
      sub.nodes.forEach(n => {
        const isDeleted = deletedNodeIds.has(n.id);
        const p = projectPoint(n.x, n.y, 0.25);
        if (subEls.blobs && subEls.blobs[n.id]) placeBlob(subEls.blobs[n.id], p.x, p.y, p.visible && !isDeleted);
        if (subEls.labels && subEls.labels[n.id]) {
          const lbl = subEls.labels[n.id];
          lbl.style.left = p.x + "px"; lbl.style.top = p.y + "px";
          lbl.style.display = (p.visible && !isDeleted) ? "block" : "none";
          const targetHtml = isZoomedOut ? (lbl.dataset.shortHtml || lbl.dataset.fullHtml) : lbl.dataset.fullHtml;
          if (lbl.innerHTML !== targetHtml) {
            lbl.innerHTML = targetHtml;
          }
        }
      });
      if (subEls.lines) {
        subEls.lines.forEach(l => {
          const isDeleted = deletedNodeIds.has(l.fromId || l.from.id) || deletedNodeIds.has(l.toId || l.to.id);
          if (isDeleted) {
            l.el.style.display = "none";
            return;
          }
          const pa = projectPoint(l.from.x, l.from.y, 0.25);
          const pb = projectPoint(l.to.x, l.to.y, 0.25);
          if (!pa.visible || !pb.visible) {
            l.el.style.display = "none";
            return;
          }
          l.el.style.display = "block";
          if (l.isPol) {
            l.el.setAttribute("x", pa.x + (pb.x - pa.x) * 0.72);
            l.el.setAttribute("y", pa.y + (pb.y - pa.y) * 0.72);
          } else if (l.isLoopBadge) {
            l.el.setAttribute("x", pa.x + (pb.x - pa.x) * 0.42);
            l.el.setAttribute("y", pa.y + (pb.y - pa.y) * 0.42 - 12);
          } else {
            const dx = pb.x - pa.x, dy = pb.y - pa.y;
            const dist = Math.hypot(dx, dy) || 1;
            const rFrom = (getSubNodeDiameter(l.fromId || l.from.id) / 2);
            const rTo = (getSubNodeDiameter(l.toId || l.to.id) / 2);
            const ux = dx / dist, uy = dy / dist;
            l.el.setAttribute("x1", pa.x + ux * rFrom);
            l.el.setAttribute("y1", pa.y + uy * rFrom);
            l.el.setAttribute("x2", pb.x - ux * (rTo + 3));
            l.el.setAttribute("y2", pb.y - uy * (rTo + 3));
          }
        });
      }
    });

    if (allSubEls["_allLines"] && allSubEls["_allLines"].lines) {
      allSubEls["_allLines"].lines.forEach(l => {
        const isDeleted = deletedNodeIds.has(l.fromId || l.from.id) || deletedNodeIds.has(l.toId || l.to.id);
        if (isDeleted) {
          l.el.style.display = "none";
          return;
        }
        const pa = projectPoint(l.from.x, l.from.y, 0.25);
        const pb = projectPoint(l.to.x, l.to.y, 0.25);
        if (!pa.visible || !pb.visible) {
          l.el.style.display = "none";
          return;
        }
        l.el.style.display = "block";
        if (l.isPol) {
          l.el.setAttribute("x", pa.x + (pb.x - pa.x) * 0.72);
          l.el.setAttribute("y", pa.y + (pb.y - pa.y) * 0.72);
        } else if (l.isLoopBadge) {
          l.el.setAttribute("x", pa.x + (pb.x - pa.x) * 0.42);
          l.el.setAttribute("y", pa.y + (pb.y - pa.y) * 0.42 - 12);
        } else {
          const dx = pb.x - pa.x, dy = pb.y - pa.y;
          const dist = Math.hypot(dx, dy) || 1;
          const rFrom = (getSubNodeDiameter(l.fromId || l.from.id) / 2);
          const rTo = (getSubNodeDiameter(l.toId || l.to.id) / 2);
          const ux = dx / dist, uy = dy / dist;
          l.el.setAttribute("x1", pa.x + ux * rFrom);
          l.el.setAttribute("y1", pa.y + uy * rFrom);
          l.el.setAttribute("x2", pb.x - ux * (rTo + 3));
          l.el.setAttribute("y2", pb.y - uy * (rTo + 3));
        }
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
  
  // Garantizar que la red de sub-problemas aparezca de inmediato apenas se abra el módulo
  let initTicks = 0;
  const initTimer = setInterval(() => {
    updateNetPositions();
    initTicks++;
    if (initTicks > 40) clearInterval(initTimer);
  }, 80);
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
    eep: { label: "Estructura ecológica principal", color: "#5c8f52" },
    habit: { label: "Habitabilidad e informalidad", color: "#7a6a4a" },
    suelo: { label: "Clasificación del suelo", color: "#8d7d8a" },
    cuidado: { label: "Sistema de cuidado", color: "#c9a9b5" },
    seg: { label: "Seguridad", color: "#4a3530" },
    espacio: { label: "Espacio público", color: "#5c8f6a" },
    gob: { label: "Instrumentos de gobernanza", color: "#3d5c3d" },
    equip: { label: "Equipamientos", color: "#c9b291" },
    servicios: { label: "Servicios públicos", color: "#8fa39c" },
    movilidad: { label: "Movilidad y transporte", color: "#9bad6b" },
    riesgo: { label: "Gestión de riesgo", color: "#d19a5a" },
  };
  const RAW_POT_NODES = [
    { id: "alameda_porvenir", t: "Alameda El Porvenir", cat: "movilidad", x: 700, y: 35 },
    { id: "veeduria", t: "Comisión de Veeduría Ciudadana POT", cat: "gob", x: 560, y: 85 },
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
  // Excluir cualquier nodo con cat === "upl"
  const POT_NODES = RAW_POT_NODES.filter(n => n.cat !== "upl");

  const RAW_POT_EDGES = [
    ["veeduria", "reparto_cargas"],
    ["reparto_cargas", "colegio_bosa"], ["manzana_bosa", "colegio_bosa"],
    ["colegio_bosa", "subsidio_vivienda"], ["mis", "subsidio_vivienda"],
    ["eru", "tejido_informal"], ["tejido_informal", "trat_estructural"], ["humedal_techo", "trat_estructural"],
    ["rio_bogota", "cai_corabastos"], ["rio_bogota", "avenida_boyaca"],
    ["nodo_logistico13", "zona_franca"], ["zona_franca", "data_center"], ["zona_franca", "areas_industriales"],
    ["centro_corabastos", "cai_corabastos"], ["centro_corabastos", "rio_bogota"],
    ["biblioteca_tintal", "rio_bogota"], ["plaza_fontibon", "centro_corabastos"],
    ["metro_plmb", "centro_corabastos"], ["metro_plmb", "portal_americas"],
    ["portal_americas", "ciclorrutas"], ["ciclorrutas", "corredor_cali"], ["corredor_cali", "patio_metro_bosa"],
    ["hospital_kennedy", "manzana_kennedy"], ["manzana_kennedy", "humedal_burro"],
    ["humedal_burro", "ptar_canoas"], ["ptar_canoas", "hospital_bosa"],
  ];
  const potNodeIds = new Set(POT_NODES.map(n => n.id));
  const POT_EDGES = RAW_POT_EDGES.filter(([a, b]) => potNodeIds.has(a) && potNodeIds.has(b));

  const potById = {}; POT_NODES.forEach(n => potById[n.id] = n);
  const potDegree = {}; POT_NODES.forEach(n => potDegree[n.id] = 0);
  POT_EDGES.forEach(([a, b]) => { potDegree[a] = (potDegree[a] || 0) + 1; potDegree[b] = (potDegree[b] || 0) + 1; });

  let potBuilt = false;
  const posPx = {};
  const radiusPx = {};
  const nodeElements = {};
  const edgeLineEls = [];

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

  function updatePotEdgeLines() {
    edgeLineEls.forEach(({ line, a, b }) => {
      const pa = posPx[a], pb = posPx[b];
      const ra = radiusPx[a], rb = radiusPx[b];
      if (!pa || !pb) return;
      const dx = pb.x - pa.x, dy = pb.y - pa.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist, uy = dy / dist;
      line.setAttribute("x1", pa.x + ux * (ra + 2));
      line.setAttribute("y1", pa.y + uy * (ra + 2));
      line.setAttribute("x2", pb.x - ux * (rb + 2));
      line.setAttribute("y2", pb.y - uy * (rb + 2));
    });
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

    POT_NODES.forEach(n => {
      const p = { x: sc(n.x, W, rect.width), y: sc(n.y, H, rect.height) };
      posPx[n.id] = p;
      radiusPx[n.id] = 32 + (potDegree[n.id] || 0) * 5.5;
    });

    const ids = POT_NODES.map(n => n.id);
    for (let pass = 0; pass < 400; pass++) {
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        const a = posPx[ids[i]], b = posPx[ids[j]];
        const minDist = (radiusPx[ids[i]] + radiusPx[ids[j]]) * 1.55;
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
      const line = document.createElementNS(SVGNS, "line");
      line.setAttribute("stroke", "#c8ccd2");
      line.setAttribute("stroke-width", "1.3");
      line.setAttribute("stroke-opacity", "0.55");
      svg.appendChild(line);
      edgeLineEls.push({ line, a, b });
    });
    updatePotEdgeLines();

    POT_NODES.forEach(n => {
      const p = posPx[n.id];
      const r = radiusPx[n.id];
      const catObj = POT_CATS[n.cat] || { color: "#777" };
      const blob = document.createElement("div");
      blob.style.cssText = `position:absolute; left:${p.x}px; top:${p.y}px; width:${r * 2}px; height:${r * 2}px; margin:-${r}px 0 0 -${r}px; border-radius:50%; background:${catObj.color}; cursor:grab; pointer-events:auto; transition:transform .15s ease; user-select:none;`;
      gooLayer.appendChild(blob);

      const label = document.createElement("div");
      const fontPx = 9.5, lineH = fontPx * 1.22;
      let maxLines = Math.max(2, Math.floor((r * 2 * 0.82) / lineH));
      let halfH = (maxLines * lineH) / 2;
      while (halfH >= r * 0.86 && maxLines > 1) { maxLines--; halfH = (maxLines * lineH) / 2; }
      const safeWidth = 2 * Math.sqrt(Math.max(0, r * r - halfH * halfH)) * 0.86;
      const maxCharsPerLine = Math.max(5, Math.floor(safeWidth / (fontPx * 0.56)));
      label.innerHTML = wrapToFit(n.t, maxCharsPerLine, maxLines);
      label.style.cssText = `position:absolute; left:${p.x}px; top:${p.y}px; transform:translate(-50%,-50%); width:${safeWidth}px; text-align:center; font-size:${fontPx}px; font-weight:600; color:#ffffff; text-shadow:0 1px 2px rgba(0,0,0,.55); line-height:${lineH}px; pointer-events:none; user-select:none;`;
      labelLayer.appendChild(label);

      nodeElements[n.id] = { blob, label };

      // Soporte para arrastrar bola (Drag & Drop)
      let isDragging = false;
      let startMouseX = 0, startMouseY = 0;
      let startPosX = 0, startPosY = 0;

      const onPointerDown = (e) => {
        isDragging = true;
        blob.style.cursor = "grabbing";
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startMouseX = clientX;
        startMouseY = clientY;
        startPosX = posPx[n.id].x;
        startPosY = posPx[n.id].y;
        e.stopPropagation();
      };

      const onPointerMove = (e) => {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const dx = clientX - startMouseX;
        const dy = clientY - startMouseY;
        const newX = Math.max(r + 4, Math.min(rect.width - r - 4, startPosX + dx));
        const newY = Math.max(r + 4, Math.min(rect.height - r - 4, startPosY + dy));
        posPx[n.id].x = newX;
        posPx[n.id].y = newY;
        blob.style.left = `${newX}px`;
        blob.style.top = `${newY}px`;
        label.style.left = `${newX}px`;
        label.style.top = `${newY}px`;
        updatePotEdgeLines();
      };

      const onPointerUp = () => {
        if (isDragging) {
          isDragging = false;
          blob.style.cursor = "grab";
        }
      };

      blob.addEventListener("mousedown", onPointerDown);
      blob.addEventListener("touchstart", onPointerDown, { passive: true });
      window.addEventListener("mousemove", onPointerMove);
      window.addEventListener("touchmove", onPointerMove, { passive: true });
      window.addEventListener("mouseup", onPointerUp);
      window.addEventListener("touchend", onPointerUp);

      blob.addEventListener("mouseenter", () => { if (!isDragging) blob.style.transform = "scale(1.1)"; });
      blob.addEventListener("mouseleave", () => { if (!isDragging) blob.style.transform = "scale(1)"; });
      blob.addEventListener("click", (e) => {
        if (Math.hypot(posPx[n.id].x - startPosX, posPx[n.id].y - startPosY) < 4) {
          openPotInfo(n);
        }
      });
    });

    const legend = document.getElementById("potLegend");
    if (legend) {
      legend.innerHTML = "";
      Object.values(POT_CATS).forEach(c => {
        const el = document.createElement("span");
        el.style.cssText = "display:flex; align-items:center; gap:5px; font-size:10.5px; color:#c3cad2;";
        el.innerHTML = `<i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c.color};"></i>${c.label}`;
        legend.appendChild(el);
      });
    }

    // Botón para copiar coordenadas POT
    const copyBtn = document.getElementById("copyPotCoordsBtn");
    const outputTxt = document.getElementById("potCoordsOutput");
    if (copyBtn && outputTxt) {
      copyBtn.addEventListener("click", () => {
        const exported = POT_NODES.map(n => {
          const p = posPx[n.id] || { x: n.x, y: n.y };
          const relX = Math.round((p.x / rect.width) * W * 10) / 10;
          const relY = Math.round((p.y / rect.height) * H * 10) / 10;
          return `  { id: "${n.id}", t: "${n.t}", cat: "${n.cat}", x: ${relX}, y: ${relY} },`;
        });
        const codeStr = `const POT_NODES = [\n${exported.join("\n")}\n];`;
        outputTxt.value = codeStr;
        outputTxt.style.display = "block";
        navigator.clipboard.writeText(codeStr).then(() => {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> ¡Copiado!`;
          setTimeout(() => { copyBtn.innerHTML = originalText; }, 2000);
        }).catch(() => {
          outputTxt.select();
        });
      });
    }
  }

  const potInfoPanel = document.getElementById("potInfoPanel");
  const potInfoBody = document.getElementById("potInfoBody");
  function openPotInfo(n) {
    const desde = POT_EDGES.filter(([a, b]) => b === n.id).map(([a]) => potById[a]).filter(Boolean);
    const hacia = POT_EDGES.filter(([a, b]) => a === n.id).map(([, b]) => potById[b]).filter(Boolean);
    const catObj = POT_CATS[n.cat] || { label: n.cat, color: "#777" };
    potInfoBody.innerHTML = `
      <p style="font-size:10.5px; text-transform:uppercase; letter-spacing:.05em; color:${catObj.color}; margin:0 0 4px; font-weight:700;">${catObj.label}</p>
      <h2 style="font-size:16px; color:#fff; margin:0 0 14px; line-height:1.3;">${n.t}</h2>
      ${desde.length ? `<div style="margin-bottom:12px;"><b style="font-size:11px; color:#9aa3ad;">Se relaciona desde</b>${desde.map(x => `<div style="font-size:12px; color:#e8ecf1; background:rgba(255,255,255,.06); border-radius:8px; padding:6px 9px; margin-top:5px;">${x.t}</div>`).join("")}</div>` : ""}
      ${hacia.length ? `<div><b style="font-size:11px; color:#9aa3ad;">Se conecta hacia</b>${hacia.map(x => `<div style="font-size:12px; color:#e8ecf1; background:rgba(255,255,255,.06); border-radius:8px; padding:6px 9px; margin-top:5px;">${x.t}</div>`).join("")}</div>` : ""}
    `;
    potInfoPanel.style.transform = "translateX(0)";
  }
  const potInfoClose = document.getElementById("potInfoClose");
  if (potInfoClose) potInfoClose.addEventListener("click", () => { potInfoPanel.style.transform = "translateX(100%)"; });
  const potModal = document.getElementById("potModal");
  const potBtn = document.getElementById("potBtn");
  if (potBtn && potModal) {
    potBtn.addEventListener("click", () => {
      potModal.style.display = "flex";
      buildPotNetwork();
    });
  }
  const potModalClose = document.getElementById("potModalClose");
  if (potModalClose && potModal) {
    potModalClose.addEventListener("click", () => { potModal.style.display = "none"; });
  }

  // === RED DE MACROMODELOS CIUDAD PROPIA ===
  const MACRO_CATS = {
    sintaxis: { label: "Sintaxis Espacial & Movilidad", color: "#38bdf8" },
    intermodalidad: { label: "Intermodalidad & Flujos", color: "#60a5fa" },
    metabolismo: { label: "Metabolismo Urbano", color: "#34d399" },
    cronosistemas: { label: "Cronosistemas & Tiempo", color: "#fbbf24" },
    sets: { label: "SETS & Socioecología", color: "#a78bfa" },
    coevolucion: { label: "Co-Evolución Territorio", color: "#f472b6" },
    adaptabilidad: { label: "Reconfiguración de Redes", color: "#818cf8" },
    simbiosis: { label: "Simbiosis Ecoindustrial", color: "#10b981" },
    prospectiva: { label: "Modelación & Gemelo Digital", color: "#22d3ee" },
    resiliencia: { label: "Resiliencia & Contingencia", color: "#f87171" }
  };

  const MACRO_NODES = [
    { id: "m1", t: "Macromodelo de Sintaxis Espacial y Economía de Movimiento", cat: "sintaxis", desc: "Examinar cómo la configuración geométrica, la profundidad topológica y la elección de rutas condicionan el movimiento y la autoorganización morfológica de la ciudad.", x: 185, y: 112.7 },
    { id: "m2", t: "Macromodelo de Intermodalidad y Metabolismo de Movilidad", cat: "intermodalidad", desc: "Estudiar la articulación eficiente de los flujos viales, el transporte masivo y la conectividad entre los distintos modos de desplazamiento en el territorio.", x: 450, y: 120 },
    { id: "m3", t: "Macromodelo de Metabolismo Urbano", cat: "metabolismo", desc: "Analizar y cuantificar las entradas, salidas, la acumulación de recursos, la gestión de residuos y las emisiones del sistema urbano.", x: 700, y: 149.3 },
    { id: "m4", t: "Macromodelo de Cronosistemas y Temporalidad Social", cat: "cronosistemas", desc: "Comprender cómo varían los ciclos de actividad, la ocupación temporal del espacio y los pulsos de demanda u horas pico de los habitantes.", x: 121.7, y: 363.3 },
    { id: "m5", t: "Macromodelo de Sistemas Socioecológicos y Tecnológicos (SETS)", cat: "sets", desc: "Evaluar la interacción profunda entre la infraestructura construida, la sociedad y el entorno natural, incluyendo las respuestas microclimáticas y ecológicas.", x: 272.4, y: 225.7 },
    { id: "m6", t: "Macromodelo de Co-Evolución Adaptativa Territorio-Sociedad", cat: "coevolucion", desc: "Investigar los procesos de transformación conjunta y adaptación mutua a largo plazo entre los asentamientos humanos y la estructura territorial.", x: 556.8, y: 298.2 },
    { id: "m7", t: "Macromodelo de Adaptabilidad y Reconfiguración de Redes", cat: "adaptabilidad", desc: "Modelar los cambios estructurales en las redes físicas y funcionales de la ciudad frente a transformaciones o nuevas demandas sistémicas.", x: 193.4, y: 482.2 },
    { id: "m8", t: "Macromodelo de Simbiosis Urbana y Ecoindustrial", cat: "simbiosis", desc: "Identificar oportunidades de aprovechamiento cruzado de subproductos, energía y recursos entre los diferentes sectores e industrias de la ciudad.", x: 696.1, y: 506.2 },
    { id: "m9", t: "Macromodelo de Modelación Computacional y Prospectiva Urbana", cat: "prospectiva", desc: "Utilizar herramientas tecnológicas como gemelos digitales, escenarios hipotéticos y simulación basada en agentes para probar, anticipar y experimentar con el comportamiento futuro de la ciudad.", x: 460.5, y: 397.5 },
    { id: "m10", t: "Macromodelo de Resiliencia Operativa y Contingencia", cat: "resiliencia", desc: "Analizar la vulnerabilidad sistémica de la ciudad y simular rutas de contingencia y respuesta frente a eventos de perturbación crítica.", x: 544.4, y: 525.2 }
  ];

  const MACRO_EDGES = [
    ["m1", "m2"], ["m2", "m3"], ["m1", "m4"], ["m4", "m5"], ["m5", "m6"],
    ["m3", "m8"], ["m2", "m7"], ["m5", "m9"], ["m7", "m9"], ["m8", "m9"],
    ["m9", "m10"], ["m7", "m10"], ["m6", "m8"], ["m4", "m6"]
  ];

  const macroById = {}; MACRO_NODES.forEach(n => macroById[n.id] = n);
  const macroDegree = {}; MACRO_NODES.forEach(n => macroDegree[n.id] = 0);
  MACRO_EDGES.forEach(([a, b]) => { macroDegree[a] = (macroDegree[a] || 0) + 1; macroDegree[b] = (macroDegree[b] || 0) + 1; });

  let macroBuilt = false;
  const macroPosPx = {};
  const macroRadiusPx = {};
  const macroEdgeLineEls = [];

  function updateMacroEdgeLines() {
    macroEdgeLineEls.forEach(({ line, a, b }) => {
      const pa = macroPosPx[a], pb = macroPosPx[b];
      const ra = macroRadiusPx[a], rb = macroRadiusPx[b];
      if (!pa || !pb) return;
      const dx = pb.x - pa.x, dy = pb.y - pa.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist, uy = dy / dist;
      line.setAttribute("x1", pa.x + ux * (ra + 2));
      line.setAttribute("y1", pa.y + uy * (ra + 2));
      line.setAttribute("x2", pb.x - ux * (rb + 2));
      line.setAttribute("y2", pb.y - uy * (rb + 2));
    });
  }

  function buildMacroNetwork() {
    if (macroBuilt) return;
    macroBuilt = true;
    const stage = document.getElementById("macroStage");
    const gooLayer = document.getElementById("macroGooLayer");
    const svg = document.getElementById("macroSvg");
    const labelLayer = document.getElementById("macroLabelLayer");
    if (!stage || !gooLayer || !svg || !labelLayer) return;
    const rect = stage.getBoundingClientRect();
    const SVGNS = "http://www.w3.org/2000/svg";
    function sc(v, total, size) { return (v / total) * size; }
    const W = 900, H = 590;

    MACRO_NODES.forEach(n => {
      const p = { x: sc(n.x, W, rect.width), y: sc(n.y, H, rect.height) };
      macroPosPx[n.id] = p;
      macroRadiusPx[n.id] = 36 + (macroDegree[n.id] || 0) * 11.5;
    });

    const ids = MACRO_NODES.map(n => n.id);
    for (let pass = 0; pass < 350; pass++) {
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        const a = macroPosPx[ids[i]], b = macroPosPx[ids[j]];
        const minDist = (macroRadiusPx[ids[i]] + macroRadiusPx[ids[j]]) * 1.45;
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
      const r = macroRadiusPx[id];
      macroPosPx[id].x = Math.max(r + 4, Math.min(rect.width - r - 4, macroPosPx[id].x));
      macroPosPx[id].y = Math.max(r + 4, Math.min(rect.height - r - 4, macroPosPx[id].y));
    });

    MACRO_EDGES.forEach(([a, b]) => {
      const line = document.createElementNS(SVGNS, "line");
      line.setAttribute("stroke", "#ffffff");
      line.setAttribute("stroke-width", "1.5");
      line.setAttribute("stroke-opacity", "0.65");
      svg.appendChild(line);
      macroEdgeLineEls.push({ line, a, b });
    });
    updateMacroEdgeLines();

    MACRO_NODES.forEach(n => {
      const p = macroPosPx[n.id];
      const r = macroRadiusPx[n.id];
      const catObj = MACRO_CATS[n.cat] || { color: "#777" };
      const blob = document.createElement("div");
      blob.style.cssText = `position:absolute; left:${p.x}px; top:${p.y}px; width:${r * 2}px; height:${r * 2}px; margin:-${r}px 0 0 -${r}px; border-radius:50%; background:${catObj.color}; box-shadow:0 0 16px ${catObj.color}66; cursor:grab; pointer-events:auto; transition:transform .15s ease; user-select:none;`;
      gooLayer.appendChild(blob);

      const label = document.createElement("div");
      const fontPx = 10, lineH = fontPx * 1.2;
      let maxLines = Math.max(2, Math.floor((r * 2 * 0.85) / lineH));
      let halfH = (maxLines * lineH) / 2;
      while (halfH >= r * 0.86 && maxLines > 1) { maxLines--; halfH = (maxLines * lineH) / 2; }
      const safeWidth = 2 * Math.sqrt(Math.max(0, r * r - halfH * halfH)) * 0.88;
      const maxCharsPerLine = Math.max(6, Math.floor(safeWidth / (fontPx * 0.54)));
      label.innerHTML = wrapToFit(n.t, maxCharsPerLine, maxLines);
      label.style.cssText = `position:absolute; left:${p.x}px; top:${p.y}px; transform:translate(-50%,-50%); width:${safeWidth}px; text-align:center; font-size:${fontPx}px; font-weight:700; color:#ffffff; text-shadow:0 1px 3px rgba(0,0,0,.7); line-height:${lineH}px; pointer-events:none; user-select:none;`;
      labelLayer.appendChild(label);

      // Soporte para arrastrar bola (Drag & Drop)
      let isDragging = false;
      let startMouseX = 0, startMouseY = 0;
      let startPosX = 0, startPosY = 0;

      const onPointerDown = (e) => {
        isDragging = true;
        blob.style.cursor = "grabbing";
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startMouseX = clientX;
        startMouseY = clientY;
        startPosX = macroPosPx[n.id].x;
        startPosY = macroPosPx[n.id].y;
        e.stopPropagation();
      };

      const onPointerMove = (e) => {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const dx = clientX - startMouseX;
        const dy = clientY - startMouseY;
        const newX = Math.max(r + 4, Math.min(rect.width - r - 4, startPosX + dx));
        const newY = Math.max(r + 4, Math.min(rect.height - r - 4, startPosY + dy));
        macroPosPx[n.id].x = newX;
        macroPosPx[n.id].y = newY;
        blob.style.left = `${newX}px`;
        blob.style.top = `${newY}px`;
        label.style.left = `${newX}px`;
        label.style.top = `${newY}px`;
        updateMacroEdgeLines();
      };

      const onPointerUp = () => {
        if (isDragging) {
          isDragging = false;
          blob.style.cursor = "grab";
        }
      };

      blob.addEventListener("mousedown", onPointerDown);
      blob.addEventListener("touchstart", onPointerDown, { passive: true });
      window.addEventListener("mousemove", onPointerMove);
      window.addEventListener("touchmove", onPointerMove, { passive: true });
      window.addEventListener("mouseup", onPointerUp);
      window.addEventListener("touchend", onPointerUp);

      blob.addEventListener("mouseenter", () => { if (!isDragging) blob.style.transform = "scale(1.1)"; });
      blob.addEventListener("mouseleave", () => { if (!isDragging) blob.style.transform = "scale(1)"; });
      blob.addEventListener("click", (e) => {
        if (Math.hypot(macroPosPx[n.id].x - startPosX, macroPosPx[n.id].y - startPosY) < 4) {
          openMacroInfo(n);
        }
      });
    });

  let currentMacroMode = "macromodelos";

  function renderCurrentMacroMode() {
    const titleEl = document.querySelector("#macroModal h2");
    const subEl = document.querySelector("#macroModal p");
    const toggleBtn = document.getElementById("toggleMacroModeBtn");
    const gooLayer = document.getElementById("macroGooLayer");
    const svg = document.getElementById("macroSvg");
    const labelLayer = document.getElementById("macroLabelLayer");
    if (!gooLayer || !svg || !labelLayer) return;

    gooLayer.innerHTML = "";
    svg.innerHTML = "";
    labelLayer.innerHTML = "";
    macroEdgeLineEls.length = 0;
    Object.keys(macroPosPx).forEach(k => delete macroPosPx[k]);
    Object.keys(macroRadiusPx).forEach(k => delete macroRadiusPx[k]);

    const activeNodes = currentMacroMode === "papers" ? PAPERS_NODES : MACRO_NODES;
    const activeEdges = currentMacroMode === "papers" ? PAPERS_EDGES : MACRO_EDGES;
    const activeCats = currentMacroMode === "papers" ? PAPERS_CATS : MACRO_CATS;
    const activeById = {}; activeNodes.forEach(n => activeById[n.id] = n);
    const activeDegree = {}; activeNodes.forEach(n => activeDegree[n.id] = 0);
    activeEdges.forEach(([a, b]) => { activeDegree[a] = (activeDegree[a] || 0) + 1; activeDegree[b] = (activeDegree[b] || 0) + 1; });

    if (titleEl && subEl) {
      if (currentMacroMode === "papers") {
        titleEl.textContent = "MODELO DE COMPLEJIDAD URBANA · PAPERS DE MACROMODELOS";
        titleEl.style.color = "#60a5fa";
        subEl.textContent = "Red de sub-modelos e investigación causal de la complejidad territorial";
      } else {
        titleEl.textContent = "MACROMODELOS CIUDAD PROPIA";
        titleEl.style.color = "#24c8bd";
        subEl.textContent = "Red interconectada de macromodelos para el análisis, simulación y gobernanza territorial";
      }
    }
    if (toggleBtn) {
      toggleBtn.innerHTML = currentMacroMode === "papers"
        ? `<i class="fa-solid fa-network-wired"></i> Ver 10 Macromodelos Principales`
        : `<i class="fa-solid fa-scroll"></i> Ver Papers de Macromodelos`;
    }

    const stage = document.getElementById("macroStage");
    const rect = stage.getBoundingClientRect();
    const SVGNS = "http://www.w3.org/2000/svg";
    function sc(v, total, size) { return (v / total) * size; }
    const W = 900, H = 590;

    // Dibujar anillos concéntricos / regiones de fondo en modo Papers (igual a la imagen subida)
    if (currentMacroMode === "papers") {
      const domains = [
        { name: "MODELO DE COMPLEJIDAD URBANA", cx: rect.width / 2, cy: rect.height / 2, rx: rect.width * 0.46, ry: rect.height * 0.46, angle: 0 },
        { name: "MODELO DE GEMELOS DIGITALES Y SIMULACIÓN COMPUTACIONAL", cx: sc(320, W, rect.width), cy: sc(190, H, rect.height), rx: sc(170, W, rect.width), ry: sc(120, H, rect.height), angle: -15 },
        { name: "MACROMODELO DE CRONOSISTEMAS Y TEMPORALIDAD SOCIAL", cx: sc(480, W, rect.width), cy: sc(150, H, rect.height), rx: sc(150, W, rect.width), ry: sc(90, H, rect.height), angle: 0 },
        { name: "SINTAXIS ESPACIAL Y ECONOMÍA DE MOVIMIENTO", cx: sc(660, W, rect.width), cy: sc(270, H, rect.height), rx: sc(160, W, rect.width), ry: sc(150, H, rect.height), angle: 20 },
        { name: "MACROMODELO DE METABOLISMO URBANO", cx: sc(580, W, rect.width), cy: sc(440, H, rect.height), rx: sc(170, W, rect.width), ry: sc(130, H, rect.height), angle: -10 },
        { name: "SISTEMAS SOCIOECOLÓGICOS Y TECNOLÓGICOS (SETS)", cx: sc(260, W, rect.width), cy: sc(390, H, rect.height), rx: sc(170, W, rect.width), ry: sc(150, H, rect.height), angle: -25 }
      ];

      domains.forEach((d, idx) => {
        const ellipse = document.createElementNS(SVGNS, "ellipse");
        ellipse.setAttribute("cx", d.cx);
        ellipse.setAttribute("cy", d.cy);
        ellipse.setAttribute("rx", d.rx);
        ellipse.setAttribute("ry", d.ry);
        ellipse.setAttribute("fill", "rgba(96,165,250,0.02)");
        ellipse.setAttribute("stroke", idx === 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.22)");
        ellipse.setAttribute("stroke-dasharray", idx === 0 ? "6 4" : "4 3");
        ellipse.setAttribute("stroke-width", idx === 0 ? "1.8" : "1.2");
        if (d.angle) ellipse.setAttribute("transform", `rotate(${d.angle}, ${d.cx}, ${d.cy})`);
        svg.appendChild(ellipse);

        // Texto curvado/etiqueta de dominio
        const label = document.createElement("div");
        label.textContent = d.name;
        label.style.cssText = `position:absolute; left:${d.cx}px; top:${d.cy - d.ry + 8}px; transform:translate(-50%,-50%); font-size:${idx === 0 ? '11px' : '9px'}; font-weight:800; color:rgba(255,255,255,0.65); letter-spacing:.08em; text-transform:uppercase; pointer-events:none; white-space:nowrap; user-select:none; text-shadow:0 1px 3px rgba(0,0,0,.8);`;
        labelLayer.appendChild(label);
      });
    }

    activeNodes.forEach(n => {
      const p = { x: sc(n.x, W, rect.width), y: sc(n.y, H, rect.height) };
      macroPosPx[n.id] = p;
      if (currentMacroMode === "papers") {
        macroRadiusPx[n.id] = (n.r ? sc(n.r, 900, rect.width) * 0.72 : 36) + (activeDegree[n.id] || 0) * 2.5;
      } else {
        macroRadiusPx[n.id] = 36 + (activeDegree[n.id] || 0) * 11.5;
      }
    });

    activeEdges.forEach(([a, b]) => {
      const line = document.createElementNS(SVGNS, "line");
      line.setAttribute("stroke", currentMacroMode === "papers" ? "#60a5fa" : "#ffffff");
      line.setAttribute("stroke-width", currentMacroMode === "papers" ? "1.4" : "1.5");
      line.setAttribute("stroke-opacity", currentMacroMode === "papers" ? "0.6" : "0.65");
      if (currentMacroMode === "papers") line.setAttribute("stroke-dasharray", "4 3");
      svg.appendChild(line);
      macroEdgeLineEls.push({ line, a, b });
    });
    updateMacroEdgeLines();

    activeNodes.forEach(n => {
      const p = macroPosPx[n.id];
      const r = macroRadiusPx[n.id];
      const catObj = activeCats[n.cat] || { color: "#777" };
      const blob = document.createElement("div");
      blob.style.cssText = `position:absolute; left:${p.x}px; top:${p.y}px; width:${r * 2}px; height:${r * 2}px; margin:-${r}px 0 0 -${r}px; border-radius:50%; background:${catObj.color}; box-shadow:0 0 16px ${catObj.color}66; cursor:grab; pointer-events:auto; transition:transform .15s ease; user-select:none;`;
      gooLayer.appendChild(blob);

      const label = document.createElement("div");
      const fontPx = currentMacroMode === "papers" ? 8.5 : 10, lineH = fontPx * 1.2;
      let maxLines = Math.max(2, Math.floor((r * 2 * 0.85) / lineH));
      let halfH = (maxLines * lineH) / 2;
      while (halfH >= r * 0.86 && maxLines > 1) { maxLines--; halfH = (maxLines * lineH) / 2; }
      const safeWidth = 2 * Math.sqrt(Math.max(0, r * r - halfH * halfH)) * 0.88;
      const maxCharsPerLine = Math.max(5, Math.floor(safeWidth / (fontPx * 0.54)));
      label.innerHTML = wrapToFit(n.t, maxCharsPerLine, maxLines);
      label.style.cssText = `position:absolute; left:${p.x}px; top:${p.y}px; transform:translate(-50%,-50%); width:${safeWidth}px; text-align:center; font-size:${fontPx}px; font-weight:700; color:#ffffff; text-shadow:0 1px 3px rgba(0,0,0,.7); line-height:${lineH}px; pointer-events:none; user-select:none;`;
      labelLayer.appendChild(label);

      // Soporte para arrastrar bola (Drag & Drop)
      let isDragging = false;
      let startMouseX = 0, startMouseY = 0;
      let startPosX = 0, startPosY = 0;

      const onPointerDown = (e) => {
        isDragging = true;
        blob.style.cursor = "grabbing";
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startMouseX = clientX;
        startMouseY = clientY;
        startPosX = macroPosPx[n.id].x;
        startPosY = macroPosPx[n.id].y;
        e.stopPropagation();
      };

      const onPointerMove = (e) => {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const dx = clientX - startMouseX;
        const dy = clientY - startMouseY;
        const newX = Math.max(r + 4, Math.min(rect.width - r - 4, startPosX + dx));
        const newY = Math.max(r + 4, Math.min(rect.height - r - 4, startPosY + dy));
        macroPosPx[n.id].x = newX;
        macroPosPx[n.id].y = newY;
        blob.style.left = `${newX}px`;
        blob.style.top = `${newY}px`;
        label.style.left = `${newX}px`;
        label.style.top = `${newY}px`;
        updateMacroEdgeLines();
      };

      const onPointerUp = () => {
        if (isDragging) {
          isDragging = false;
          blob.style.cursor = "grab";
        }
      };

      blob.addEventListener("mousedown", onPointerDown);
      blob.addEventListener("touchstart", onPointerDown, { passive: true });
      window.addEventListener("mousemove", onPointerMove);
      window.addEventListener("touchmove", onPointerMove, { passive: true });
      window.addEventListener("mouseup", onPointerUp);
      window.addEventListener("touchend", onPointerUp);

      blob.addEventListener("mouseenter", () => { if (!isDragging) blob.style.transform = "scale(1.1)"; });
      blob.addEventListener("mouseleave", () => { if (!isDragging) blob.style.transform = "scale(1)"; });
      blob.addEventListener("click", (e) => {
        if (Math.hypot(macroPosPx[n.id].x - startPosX, macroPosPx[n.id].y - startPosY) < 4) {
          openMacroInfo(n);
        }
      });
    });

    const legend = document.getElementById("macroLegend");
    if (legend) {
      legend.innerHTML = "";
      Object.values(activeCats).forEach(c => {
        const el = document.createElement("span");
        el.style.cssText = "display:flex; align-items:center; gap:5px; font-size:10.5px; color:#c3cad2;";
        el.innerHTML = `<i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c.color};box-shadow:0 0 6px ${c.color};"></i>${c.label}`;
        legend.appendChild(el);
      });
    }

    // Botón para copiar coordenadas
    const copyBtn = document.getElementById("copyMacroCoordsBtn");
    const outputTxt = document.getElementById("macroCoordsOutput");
    if (copyBtn && outputTxt) {
      copyBtn.onclick = () => {
        const exported = activeNodes.map(n => {
          const p = macroPosPx[n.id] || { x: n.x, y: n.y };
          const relX = Math.round((p.x / rect.width) * W * 10) / 10;
          const relY = Math.round((p.y / rect.height) * H * 10) / 10;
          return `  { id: "${n.id}", t: "${n.t}", cat: "${n.cat}", x: ${relX}, y: ${relY} },`;
        });
        const varName = currentMacroMode === "papers" ? "PAPERS_NODES" : "MACRO_NODES";
        const codeStr = `const ${varName} = [\n${exported.join("\n")}\n];`;
        outputTxt.value = codeStr;
        outputTxt.style.display = "block";
        navigator.clipboard.writeText(codeStr).then(() => {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> ¡Copiado!`;
          setTimeout(() => { copyBtn.innerHTML = originalText; }, 2000);
        }).catch(() => {
          outputTxt.select();
        });
      };
    }
  }

  function buildMacroNetwork() {
    renderCurrentMacroMode();
  }

  const toggleMacroModeBtn = document.getElementById("toggleMacroModeBtn");
  if (toggleMacroModeBtn) {
    toggleMacroModeBtn.addEventListener("click", () => {
      currentMacroMode = currentMacroMode === "papers" ? "macromodelos" : "papers";
      renderCurrentMacroMode();
    });
  }

  const macroInfoPanel = document.getElementById("macroInfoPanel");
  const macroInfoBody = document.getElementById("macroInfoBody");
  function openMacroInfo(n) {
    const activeNodes = currentMacroMode === "papers" ? PAPERS_NODES : MACRO_NODES;
    const activeEdges = currentMacroMode === "papers" ? PAPERS_EDGES : MACRO_EDGES;
    const activeCats = currentMacroMode === "papers" ? PAPERS_CATS : MACRO_CATS;
    const activeById = {}; activeNodes.forEach(x => activeById[x.id] = x);

    const desde = activeEdges.filter(([a, b]) => b === n.id).map(([a]) => activeById[a]).filter(Boolean);
    const hacia = activeEdges.filter(([a, b]) => a === n.id).map(([, b]) => activeById[b]).filter(Boolean);
    const catObj = activeCats[n.cat] || { label: n.cat, color: "#777" };
    macroInfoBody.innerHTML = `
      <p style="font-size:10.5px; text-transform:uppercase; letter-spacing:.05em; color:${catObj.color}; margin:0 0 4px; font-weight:700;">${catObj.label}</p>
      <h2 style="font-size:16px; color:#fff; margin:0 0 10px; line-height:1.3;">${n.t}</h2>
      <div style="background:rgba(36,200,189,.1); border:1px solid rgba(36,200,189,.25); border-radius:8px; padding:10px 12px; margin-bottom:14px;">
        <p style="font-size:11px; font-weight:700; color:${currentMacroMode === 'papers' ? '#60a5fa' : '#24c8bd'}; margin:0 0 4px;">${currentMacroMode === 'papers' ? '¿Qué investiga este paper / modelo?' : '¿Qué busca este macromodelo?'}</p>
        <p style="font-size:12px; color:#e8ecf1; margin:0; line-height:1.45;">${n.desc}</p>
      </div>
      ${desde.length ? `<div style="margin-bottom:12px;"><b style="font-size:11px; color:#9aa3ad;">Se relaciona desde</b>${desde.map(x => `<div style="font-size:11.5px; color:#e8ecf1; background:rgba(255,255,255,.06); border-radius:8px; padding:6px 9px; margin-top:5px;">${x.t}</div>`).join("")}</div>` : ""}
      ${hacia.length ? `<div><b style="font-size:11px; color:#9aa3ad;">Se conecta hacia</b>${hacia.map(x => `<div style="font-size:11.5px; color:#e8ecf1; background:rgba(255,255,255,.06); border-radius:8px; padding:6px 9px; margin-top:5px;">${x.t}</div>`).join("")}</div>` : ""}
    `;
    macroInfoPanel.style.transform = "translateX(0)";
  }

  const macroInfoClose = document.getElementById("macroInfoClose");
  if (macroInfoClose) macroInfoClose.addEventListener("click", () => { macroInfoPanel.style.transform = "translateX(100%)"; });
  const macroModal = document.getElementById("macroModal");
  const macroBtn = document.getElementById("macroBtn");
  if (macroBtn && macroModal) {
    macroBtn.addEventListener("click", () => {
      currentMacroMode = "macromodelos";
      macroModal.style.display = "flex";
      renderCurrentMacroMode();
    });
  }
  const papersBtn = document.getElementById("papersBtn");
  if (papersBtn && macroModal) {
    papersBtn.addEventListener("click", () => {
      currentMacroMode = "papers";
      macroModal.style.display = "flex";
      renderCurrentMacroMode();
    });
  }
  const macroModalClose = document.getElementById("macroModalClose");
  if (macroModalClose && macroModal) {
    macroModalClose.addEventListener("click", () => { macroModal.style.display = "none"; });
  }
})();

