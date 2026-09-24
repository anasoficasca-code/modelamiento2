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
  scene.fog = new THREE.Fog(0xffffff, 900, 3200);
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
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }); // preserveDrawingBuffer: permite capturar el canvas como foto para la animacion de explosion
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
  canvas.addEventListener("contextmenu", (e) => e.preventDefault()); // sin esto, el navegador abre su menu contextual con el clic derecho en vez de dejarlo mover (panear) la vista
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
  let currentBoxRealBounds = null; // rango real (X/Y) de la caja de seccion actual, para que ruido/mirlas trabajen solo ahi
  function sceneToReal(x, z) { return [x / SCALE + netCenter.x, -z / SCALE + netCenter.y]; }
  let sceneExtentW = 100, sceneExtentH = 100; // ancho/alto de la escena en unidades (para la caja de seccion)
  let roadMat = null, waterMat = null, parqueMat = null; // referencias para los selectores de color en vivo
  let buildingEdgeMat = null; // referencia para ajustar su opacidad segun el zoom
  let groundMesh = null;

  function buildGround(bbox) {
    const w = (bbox[2] - bbox[0]) * SCALE * 1.4;
    const h = (bbox[3] - bbox[1]) * SCALE * 1.4;
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshStandardMaterial({ clippingPlanes: sectionClipPlanesArr, color: 0xeceeef, roughness: 1, metalness: 0 });
    groundMesh = new THREE.Mesh(geo, mat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, -0.4, 0);
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
    const DEPTH = Math.max(w, h) * 0.08; // bastante mas profundo que antes (0.018 era casi invisible desde el angulo axonometrico de 35°, que acorta mucho lo vertical)
    const Y_TOP = 0; // nivel del suelo real
    const Y_BOTTOM = -DEPTH;
    const corners = [
      [xMin, zMin], [xMax, zMin], [xMax, zMax], [xMin, zMax],
    ];
    const positions = [];
    for (let i = 0; i < 4; i++) {
      const a = corners[i], b = corners[(i + 1) % 4];
      // Pared vertical entre cada par de esquinas: 2 triangulos, desde el
      // nivel del suelo hasta DEPTH unidades hacia abajo.
      positions.push(
        a[0], Y_TOP, a[1], b[0], Y_TOP, b[1], b[0], Y_BOTTOM, b[1],
        a[0], Y_TOP, a[1], b[0], Y_BOTTOM, b[1], a[0], Y_BOTTOM, a[1]
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
  function fromScene(sx, sz) {
    return { x: sx / SCALE + netCenter.x, y: netCenter.y - sz / SCALE };
  }
  // Conversion local -> lat/lng (misma calibracion con Humedal La Vaca y
  // Humedal El Burro ya usada en el proyecto), para poder copiar el
  // poligono dibujado como coordenadas reales.
  const CAL_A = 158502.5342667897, CAL_B = 11760483.425451731;
  const CAL_C = 75875.89881636726, CAL_D = -349119.0227795534;
  function localToLng(x) { return (x - CAL_B) / CAL_A; }
  function localToLat(y) { return (y - CAL_D) / CAL_C; }

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
      const yJitter = 0.03 + ((edgeIdx * 2654435761) % 1000) / 1000 * 0.05;
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
      map: viaTex, color: 0x9099a3, roughness: 0.85, side: THREE.DoubleSide,
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
  let currentBuildingMesh = null, currentBuildingEdgeMesh = null, currentBuildingCornerMesh = null;
  function buildBuildings(buildings, boxFilter) {
    if (currentBuildingMesh) { sceneRoot.remove(currentBuildingMesh); currentBuildingMesh.geometry.dispose(); }
    if (currentBuildingEdgeMesh) { sceneRoot.remove(currentBuildingEdgeMesh); currentBuildingEdgeMesh.geometry.dispose(); }
    if (currentBuildingCornerMesh) { sceneRoot.remove(currentBuildingCornerMesh); currentBuildingCornerMesh.geometry.dispose(); }
    const positions = [];
    const normals = [];
    const edgePositions = []; // solo el perimetro del techo (una linea nativa, se ve bien desde arriba)
    const cornerPositions = []; // esquinas verticales: geometria 3D real (mini-pared delgada), NO una linea nativa - las lineas nativas de WebGL tienen 1px fijo sin importar linewidth, y ademas se pueden "desaparecer" en angulos rasantes por z-fighting; una pared delgada de verdad se ve igual de gruesa siempre, sin importar el angulo
    const CORNER_THICK = 0.035; // grosor fijo de la mini-pared de esquina (muy delgado, pero real en 3D)
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
        edgePositions.push(a.x, h, a.z, c.x, h, c.z); // perimetro del techo
        // Esquina vertical como una mini-pared delgada real (2 caras
        // perpendiculares en cruz, para que se vea igual de gruesa
        // mirando desde CUALQUIER angulo, no solo una linea plana que
        // puede volverse invisible de canto):
        const t = CORNER_THICK;
        cornerPositions.push(
          a.x - nx * t, 0, a.z - nz * t, a.x + nx * t, 0, a.z + nz * t, a.x + nx * t, h, a.z + nz * t,
          a.x - nx * t, 0, a.z - nz * t, a.x + nx * t, h, a.z + nz * t, a.x - nx * t, h, a.z - nz * t
        );
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
      // Respaldo: si la triangulacion real falla (poligono invalido o
      // auto-intersectado - 131 de los 243538 edificios tienen esto),
      // usar un abanico simple desde el primer vertice, para que el
      // edificio SIEMPRE tenga techo (sin esto quedaba con la parte de
      // arriba abierta, viendose "transparente"/hueco desde la axonometria).
      if (tris.length === 0 && pts2d.length >= 3) {
        for (let i = 1; i < pts2d.length - 1; i++) tris.push([0, i, i + 1]);
      }
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

    // Borde oscuro del perimetro del techo (linea nativa, funciona bien
    // vista desde arriba, sin el problema de "desaparecer" en angulos
    // rasantes que si afecta a las verticales).
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x2b2e33, transparent: true, opacity: 0.35 });
    buildingEdgeMat = edgeMat;
    const edgeMesh = new THREE.LineSegments(edgeGeo, edgeMat);
    sceneRoot.add(edgeMesh);
    currentBuildingEdgeMesh = edgeMesh;

    // Esquinas verticales: geometria 3D real (no lineas), para que el
    // grosor se vea SIEMPRE igual sin importar el angulo de camara, y
    // nunca desaparezcan.
    const cornerGeo = new THREE.BufferGeometry();
    cornerGeo.setAttribute("position", new THREE.Float32BufferAttribute(cornerPositions, 3));
    cornerGeo.computeVertexNormals();
    const cornerMat = new THREE.MeshBasicMaterial({ color: 0x2b2e33, transparent: true, opacity: 0.55, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    const cornerMesh = new THREE.Mesh(cornerGeo, cornerMat);
    sceneRoot.add(cornerMesh);
    currentBuildingCornerMesh = cornerMesh;
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
    const treeTex = new THREE.TextureLoader().load("./assets/arbol_real4.png");
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
    rebuildBirds(); // ahora que ya hay datos reales de arboles, se reconstruyen las mirlas con sus atractores correctos
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

  // ============================================================
  // MAPA DE RUIDO EN VIVO (igual logica que modulo-08-3d.js, pero
  // acotado SOLO al area de la caja de seccion actual, no toda la
  // ciudad) + MIRLAS (Turdus fuscater), aves que se desplazan de oriente
  // ============================================================
  // MAPA DE RUIDO EN VIVO — IGUAL ESTÉTICA Y LÓGICA QUE modulo-08-3d.js
  // Manchas de intensidad alrededor de cada vehículo acumuladas con
  // "lighter" en un canvas texture y coloreadas suavemente de amarillo
  // a naranja y rojo, con alpha fijo (0.42) sobre la malla del suelo 3D,
  // recortada con la caja de sección (sectionClipPlanesArr).
  // ============================================================
  const NOISE_ALPHA = 0.42;
  const NOISE_BUF_W = 260, NOISE_BUF_H = 180; // misma resolucion que modulo-08-3d: mancha suave y continua
  const NOISE_COLOR_STOPS = [
    { t: 0.00, rgb: [255, 247, 179] }, { t: 0.20, rgb: [255, 224, 76] },
    { t: 0.40, rgb: [255, 179, 77] }, { t: 0.60, rgb: [245, 124, 0] },
    { t: 0.80, rgb: [230, 74, 25] }, { t: 1.00, rgb: [211, 47, 47] },
  ];
  function noiseColorAt(t) {
    t = Math.max(0, Math.min(1, t));
    for (let i = 0; i < NOISE_COLOR_STOPS.length - 1; i++) {
      const a = NOISE_COLOR_STOPS[i], b = NOISE_COLOR_STOPS[i + 1];
      if (t >= a.t && t <= b.t) {
        const f = (t - a.t) / (b.t - a.t || 1);
        return [Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * f), Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * f), Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * f)];
      }
    }
    return NOISE_COLOR_STOPS[NOISE_COLOR_STOPS.length - 1].rgb;
  }
  let noiseMesh = null, noiseTexture = null, noiseGroundW = 0, noiseGroundH = 0, noiseOriginX = 0, noiseOriginY = 0;
  const noiseBufCanvas = document.createElement("canvas");
  noiseBufCanvas.width = NOISE_BUF_W; noiseBufCanvas.height = NOISE_BUF_H;
  const noiseBufCtx = noiseBufCanvas.getContext("2d", { willReadFrequently: true });
  let noiseFieldImg = null;

  function buildNoiseGround(bbox) {
    noiseOriginX = bbox[0]; noiseOriginY = bbox[1];
    noiseGroundW = bbox[2] - bbox[0]; noiseGroundH = bbox[3] - bbox[1];
    const c0 = toScene(bbox[0], bbox[1]), c1 = toScene(bbox[2], bbox[3]);
    const w = Math.abs(c1.x - c0.x), h = Math.abs(c1.z - c0.z);
    const geo = new THREE.PlaneGeometry(w, h);
    noiseTexture = new THREE.CanvasTexture(noiseBufCanvas);
    const mat = new THREE.MeshBasicMaterial({
      map: noiseTexture,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      clippingPlanes: sectionClipPlanesArr,
      clipShadows: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set((c0.x + c1.x) / 2, 0.06, (c0.z + c1.z) / 2);
    mesh.visible = false;
    sceneRoot.add(mesh);
    noiseMesh = mesh;
  }

  function rebuildNoiseGround() {
    // Si la caja de seccion cambia o se resetea, los clippingPlanes del renderer
    // ya cortan el plano de ruido de Three.js de forma exacta y automatica
  }

  const NOISE_VEH_RADIUS_M = 55;
  let lastNoiseCompute = 0;
  let noiseOn = false;

  function computeLiveNoiseField(vehicles, now) {
    if (!noiseGroundW || (now - lastNoiseCompute < 140)) return;
    lastNoiseCompute = now;
    noiseBufCtx.clearRect(0, 0, NOISE_BUF_W, NOISE_BUF_H);
    noiseBufCtx.globalCompositeOperation = "lighter";
    const sx = NOISE_BUF_W / noiseGroundW, sy = NOISE_BUF_H / noiseGroundH;
    const blobR = NOISE_VEH_RADIUS_M * sx;
    vehicles.forEach(v => {
      const bx = (v.x - noiseOriginX) * sx, by = NOISE_BUF_H - (v.y - noiseOriginY) * sy;
      const grad = noiseBufCtx.createRadialGradient(bx, by, 0, bx, by, blobR);
      grad.addColorStop(0, "rgba(255,255,255,0.9)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      noiseBufCtx.fillStyle = grad;
      noiseBufCtx.beginPath(); noiseBufCtx.arc(bx, by, blobR, 0, Math.PI * 2); noiseBufCtx.fill();
    });
    noiseBufCtx.globalCompositeOperation = "source-over";
    const img = noiseBufCtx.getImageData(0, 0, NOISE_BUF_W, NOISE_BUF_H);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      const intensity = data[i + 3] / 255;
      if (intensity < 0.02) { data[i + 3] = 0; continue; }
      const t = Math.min(1, Math.pow(intensity, 2.4));
      const [r, g, b] = noiseColorAt(t);
      data[i] = r; data[i + 1] = g; data[i + 2] = b;
      data[i + 3] = Math.round(NOISE_ALPHA * 255); // alpha SIEMPRE el mismo, solo cambia el color
    }
    noiseFieldImg = img;
    if (noiseMesh && noiseMesh.visible) {
      noiseBufCtx.putImageData(img, 0, 0);
      noiseTexture.needsUpdate = true;
    }
  }

  const NOISE_DB_BASE = 40, NOISE_DB_SPAN = 52;
  function noiseDbAt(x, y) {
    if (!noiseFieldImg || !noiseGroundW) return NOISE_DB_BASE;
    const bx = Math.floor(((x - noiseOriginX) / noiseGroundW) * NOISE_BUF_W);
    const by = Math.floor(NOISE_BUF_H - ((y - noiseOriginY) / noiseGroundH) * NOISE_BUF_H);
    if (bx < 0 || by < 0 || bx >= NOISE_BUF_W || by >= NOISE_BUF_H) return NOISE_DB_BASE;
    const idx = (by * NOISE_BUF_W + bx) * 4;
    const raw = noiseFieldImg.data[idx + 3] / 255;
    const bright = (noiseFieldImg.data[idx] + noiseFieldImg.data[idx + 1] + noiseFieldImg.data[idx + 2]) / (3 * 255);
    if (raw < 0.01) return NOISE_DB_BASE;
    const t = 1 - bright;
    return NOISE_DB_BASE + NOISE_DB_SPAN * Math.max(0, Math.min(1, t * 1.6));
  }
  function noiseEscapeDir(x, y) {
    const paso = (noiseGroundW / NOISE_BUF_W) * 3;
    const gx = noiseDbAt(x + paso, y) - noiseDbAt(x - paso, y);
    const gy = noiseDbAt(x, y + paso) - noiseDbAt(x, y - paso);
    const m = Math.hypot(gx, gy);
    if (m < 1e-4) return null;
    return [-gx / m, -gy / m];
  }

  // ---- MIRLAS: adaptadas para volar SOLO dentro del area de la caja de
  // seccion actual (entran por el borde este del area visible, salen por
  // el oeste, refugio en la esquina noroeste del area visible) ----
  const BIRD_TREE_SPECIES = {
    "Sauco": { key: "sauco", color: 0xb06bff, weight: 1.0, base: 260 },
    "Cerezo, capuli": { key: "capuli", color: 0xff5fa8, weight: 0.76, base: 200 },
    "Urapán, Fresno": { key: "urapan", color: 0x25d0a0, weight: 0.52, base: 220 },
  };
  const BIRD_VISION = 14, BIRD_ARRIVE = 1.4, BIRD_WIND = 0.8, BIRD_MAX_SPEED = 2.4; // aun mas lento (antes 1.5/4.2)
  const BIRD_REST_SPEED = 1.0, BIRD_NOISE_DB = 60, BIRD_K_REP = 4.2, BIRD_COUNT = 50;
  let birds = [], birdTreesGrid = null, birdsGroup = null, birdOn = false;
  function sampleAttractorTrees(trees) {
    const porEspecie = {};
    trees.forEach(t => {
      const meta = BIRD_TREE_SPECIES[t[3]]; // el codigo de especie va en el indice 3 (verificado con datos reales: 9250 coincidencias de 119886 arboles); mi "correccion" anterior a indice 4 (el codigo numerico de identificacion, no la especie) estaba mal
      if (meta) (porEspecie[meta.key] || (porEspecie[meta.key] = [])).push({ x: t[0], y: t[1], meta });
    });
    const out = [];
    Object.keys(porEspecie).forEach(k => {
      const lista = porEspecie[k];
      const meta = lista[0].meta;
      const paso = Math.max(1, Math.floor(lista.length / meta.base));
      for (let i = 0; i < lista.length; i += paso) out.push(lista[i]);
    });
    return out;
  }
  const BIRD_CELL = 25;
  function buildBirdTreeGrid(attractors) {
    const grid = new Map();
    attractors.forEach(t => {
      const key = Math.floor(t.x / BIRD_CELL) + "," + Math.floor(t.y / BIRD_CELL);
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(t);
    });
    return grid;
  }
  function bestTreeNear(grid, x, y) {
    const r = BIRD_VISION * 10;
    const cx0 = Math.floor((x - r) / BIRD_CELL), cx1 = Math.floor((x + r) / BIRD_CELL);
    const cy0 = Math.floor((y - r) / BIRD_CELL), cy1 = Math.floor((y + r) / BIRD_CELL);
    let best = null, bestScore = 0, bestDist = 0;
    for (let cx = cx0; cx <= cx1; cx++) for (let cy = cy0; cy <= cy1; cy++) {
      const celda = grid.get(cx + "," + cy);
      if (!celda) continue;
      celda.forEach(t => {
        const dx = t.x - x, dy = t.y - y, d2 = dx * dx + dy * dy;
        if (d2 > r * r) return;
        const d = Math.sqrt(d2) || 0.001;
        const score = t.meta.weight / d;
        if (score > bestScore) { bestScore = score; best = t; bestDist = d; }
      });
    }
    return best ? { arbol: best, dist: bestDist } : null;
  }
  function makeBirdSprite(wingUp) {
    const c = document.createElement("canvas"); c.width = 48; c.height = 48;
    const ctx = c.getContext("2d");
    ctx.translate(24, 24);
    // Icono simple de pajarito volando (silueta de un solo color solido,
    // sin trazos claros ni fondo): cuerpo pequeño en el centro y 2 alas
    // que suben o bajan segun "wingUp", para dar sensacion de aleteo.
    ctx.fillStyle = "#1a1c22";
    const wingY = wingUp ? -9 : 6; // punta del ala arriba o abajo
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-8, wingY * 0.4, -16, wingY);
    ctx.quadraticCurveTo(-8, 1, 0, 2);
    ctx.quadraticCurveTo(8, 1, 16, wingY);
    ctx.quadraticCurveTo(8, wingY * 0.4, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 1, 3.4, 2, 0, 0, Math.PI * 2); ctx.fill();
    return new THREE.CanvasTexture(c);
  }
  let humedalTreesList = [];
  function makeBirdAgent(origen) {
    const b0 = currentBoxRealBounds;
    let x, y;
    const refugeX = b0.xMin + (b0.xMax - b0.xMin) * 0.12, refugeY = b0.yMin + (b0.yMax - b0.yMin) * 0.88, refugeR = Math.min(b0.xMax - b0.xMin, b0.yMax - b0.yMin) * 0.12;
    let landedTree = null;
    if (origen === "refugio") {
      const a = Math.random() * Math.PI * 2, r = Math.random() * refugeR;
      x = refugeX + Math.cos(a) * r; y = refugeY + Math.sin(a) * r;
    } else if (origen === "humedal" && humedalTreesList.length > 0) {
      // Salen directamente de los árboles del humedal / cuerpo de agua
      const t = humedalTreesList[Math.floor(Math.random() * humedalTreesList.length)];
      x = t.x + (Math.random() - 0.5) * 6;
      y = t.y + (Math.random() - 0.5) * 6;
      landedTree = { x: t.x, y: t.y };
    } else {
      x = b0.xMax - Math.random() * 20; y = b0.yMin + Math.random() * (b0.yMax - b0.yMin);
    }
    const residente = origen === "refugio";
    const esHumedal = origen === "humedal";
    const birdObj = {
      x, y,
      vx: residente ? (Math.random() - 0.5) * 2.2 : (esHumedal ? (Math.random() - 0.7) * 2.0 : -(2.6 + Math.random() * 2.6)),
      vy: (Math.random() - 0.5) * (residente ? 2.2 : 1.4),
      rest: esHumedal ? (3 + Math.random() * 4) : 0,
      cooldown: 0,
      residente,
      esHumedal,
      origen,
      estresada: false,
      phase: Math.random() * 6.28,
      sprite: null,
      refugeX, refugeY, refugeR,
      landedAt: landedTree
    };
    return birdObj;
  }
  function updateBirdAgent(b, dt) {
    b.phase += dt * 9;
    if (b.rest > 0) {
      b.rest -= dt;
      b.vx += (Math.random() - 0.5) * 12 * dt; b.vy += (Math.random() - 0.5) * 12 * dt;
      const freno = Math.pow(0.02, dt);
      b.vx *= freno; b.vy *= freno;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > BIRD_REST_SPEED) { b.vx = (b.vx / sp) * BIRD_REST_SPEED; b.vy = (b.vy / sp) * BIRD_REST_SPEED; }
      // Se ancla al arbol donde aterrizo: sin esto, aunque vuele mas
      // lento durante el descanso, se sigue desplazando poco a poco y
      // termina alejandose del arbol en vez de quedarse posada ahi.
      if (b.landedAt) {
        const d = Math.hypot(b.x - b.landedAt.x, b.y - b.landedAt.y);
        if (d > 3) {
          const ux = (b.landedAt.x - b.x) / d, uy = (b.landedAt.y - b.y) / d;
          b.vx += ux * 6 * dt; b.vy += uy * 6 * dt;
        }
      }
    } else if (b.residente) {
      if (b.cooldown > 0) b.cooldown -= dt;
      b.vx += (Math.random() - 0.5) * 8 * dt; b.vy += (Math.random() - 0.5) * 8 * dt;
      const d = Math.hypot(b.x - b.refugeX, b.y - b.refugeY);
      if (d > b.refugeR) {
        const ux = (b.refugeX - b.x) / d, uy = (b.refugeY - b.y) / d;
        b.vx += ux * 11 * dt; b.vy += uy * 11 * dt;
      }
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > 4) { b.vx = (b.vx / sp) * 4; b.vy = (b.vy / sp) * 4; }
    } else {
      if (b.cooldown > 0) b.cooldown -= dt;
      b.vx -= BIRD_WIND * dt;
      b.vy += Math.sin(b.phase * 0.28) * 0.7 * dt;
      const hallazgo = birdTreesGrid ? bestTreeNear(birdTreesGrid, b.x, b.y) : null;
      if (hallazgo && b.cooldown <= 0) {
        const { arbol, dist } = hallazgo;
        const ux = (arbol.x - b.x) / dist, uy = (arbol.y - b.y) / dist;
        const esSauco = arbol.meta.key === "sauco";
        const fuerza = arbol.meta.weight * (esSauco ? 20 : 11);
        b.vx += ux * fuerza * dt; b.vy += uy * fuerza * dt;
        if (dist < BIRD_ARRIVE * 10) {
          // Se quedan mas tiempo posadas en Sauco (la especie que predomina
          // junto al humedal) que en las otras, para que se note mas
          // presencia ahi en particular.
          const esSauco2 = arbol.meta.key === "sauco";
          b.rest = esSauco2 ? (5 + Math.random() * 3) : (2.5 + Math.random());
          b.cooldown = esSauco2 ? 3 : 7;
          b.landedAt = { x: arbol.x, y: arbol.y };
        }
      }
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > BIRD_MAX_SPEED) { b.vx = (b.vx / sp) * BIRD_MAX_SPEED; b.vy = (b.vy / sp) * BIRD_MAX_SPEED; }
    }
    // Umbral critico de 60 dB(A): igual que en la simulacion 2D de
    // referencia, se evalua el ruido en la posicion actual Y un poco por
    // delante del rumbo de vuelo (el sonido se "oye" antes de llegar), no
    // solo en el punto exacto donde esta el ave - asi la reaccion de
    // huida empieza a la distancia correcta, no solo cuando ya esta
    // encima del ruido.
    let exceso = Math.max(0, noiseDbAt(b.x, b.y) - BIRD_NOISE_DB);
    let rx = b.x, ry = b.y;
    const rapidez = Math.hypot(b.vx, b.vy) || 1;
    for (let k = 1; k <= 3; k++) {
      const ax = b.x + (b.vx / rapidez) * k * 30, ay = b.y + (b.vy / rapidez) * k * 30;
      const e = Math.max(0, noiseDbAt(ax, ay) - BIRD_NOISE_DB) * (1 - k * 0.15);
      if (e > exceso) { exceso = e; rx = ax; ry = ay; }
    }
    b.estresada = exceso > 0;
    if (exceso > 0) {
      const u = noiseEscapeDir(rx, ry);
      if (u) { b.vx += BIRD_K_REP * exceso * u[0] * dt; b.vy += BIRD_K_REP * exceso * u[1] * dt; }
      if (b.rest > 0) { b.rest = 0; b.cooldown = Math.max(b.cooldown, 3); }
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > BIRD_MAX_SPEED * 1.35) { b.vx = (b.vx / sp) * BIRD_MAX_SPEED * 1.35; b.vy = (b.vy / sp) * BIRD_MAX_SPEED * 1.35; }
    }
    b.x += b.vx * dt * 10;
    b.y += b.vy * dt * 10;
    const b0 = currentBoxRealBounds;
    if (b.x < b0.xMin) Object.assign(b, makeBirdAgent(b.origen || (b.residente ? "refugio" : "oriente")), { sprite: b.sprite });
  }
  let birdTexUp = null, birdTexDown = null; // 2 cuadros de aleteo (alas arriba/abajo), compartidos por todas las mirlas
  function rebuildBirds() {
    if (!currentBoxRealBounds) return;
    if (birdsGroup) { sceneRoot.remove(birdsGroup); birds = []; }
    const attractors = treeMeshes && treeMeshes[0] ? sampleAttractorTrees(treeMeshes[0].data) : [];
    birdTreesGrid = buildBirdTreeGrid(attractors);

    // Identificar árboles dentro o adyacentes al Humedal El Burro y su cuerpo de agua
    if (treeMeshes && treeMeshes[0]) {
      humedalTreesList = treeMeshes[0].data
        .filter(t => t[0] >= 6900 && t[0] <= 7800 && t[1] >= 2900 && t[1] <= 4050)
        .map(t => ({ x: t[0], y: t[1] }));
      if (humedalTreesList.length === 0) {
        humedalTreesList = attractors.filter(t => t.x >= 6900 && t.x <= 7800 && t.y >= 2900 && t.y <= 4050);
      }
    }

    birdsGroup = new THREE.Group();
    birdsGroup.visible = birdOn;
    birdTexUp = makeBirdSprite(true);
    birdTexDown = makeBirdSprite(false);
    const spriteMat = new THREE.SpriteMaterial({ map: birdTexUp, transparent: true, alphaTest: 0.15, depthWrite: false, depthTest: false }); // depthTest:false para que SIEMPRE se vean por encima de edificios/arboles, sin importar que tan "detras" quede en la profundidad real
    
    // Distribución: mirlas que nacen en árboles del humedal + mirlas del refugio + mirlas que entran desde oriente
    const humedalCount = Math.round(BIRD_COUNT * 0.40); // 40% en árboles del humedal
    const refugeCount = Math.round(BIRD_COUNT * 0.18);  // 18% refugio
    for (let i = 0; i < BIRD_COUNT; i++) {
      let origen = "oriente";
      if (i < humedalCount) origen = "humedal";
      else if (i < humedalCount + refugeCount) origen = "refugio";

      const b = makeBirdAgent(origen);
      const sprite = new THREE.Sprite(spriteMat.clone());
      sprite.scale.set(3.2, 3.2, 1);
      sprite.renderOrder = 999; // se dibuja al final, despues de todo lo demas, para que nunca quede tapado
      birdsGroup.add(sprite);
      b.sprite = sprite;
      birds.push(b);
    }
    sceneRoot.add(birdsGroup);
  }
  let lastBirdUpdate = 0;
  function updateBirds(now) {
    if (!birdsGroup || !birdsGroup.visible) return;
    const dt = lastBirdUpdate ? Math.min(0.05, (now - lastBirdUpdate) / 1000) : 0;
    lastBirdUpdate = now;
    if (dt > 0) birds.forEach(b => updateBirdAgent(b, dt));
    birds.forEach(b => {
      const p = toScene(b.x, b.y);
      const bat = Math.sin(b.phase) * (b.rest > 0 ? 0.15 : 0.3);
      b.sprite.position.set(p.x, 3.2 + bat, p.z);
      b.sprite.material.color.set(b.estresada ? 0xff6b4d : 0xffffff);
      // Aleteo: se alterna entre las 2 texturas (alas arriba/abajo) segun
      // la fase de vuelo de cada ave, para que se vea que mueve las alas.
      const nuevaTex = Math.sin(b.phase) > 0 ? birdTexUp : birdTexDown;
      if (b.sprite.material.map !== nuevaTex) { b.sprite.material.map = nuevaTex; b.sprite.material.needsUpdate = true; }
    });
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

  let rawWaterData = null;
  function loadWaterBodies() {
    return fetch(WATER_URL)
      .then(r => { if (!r.ok) throw new Error("no se pudo cargar " + WATER_URL); return r.json(); })
      .then(data => { rawWaterData = data; buildWaterBodies(data); })
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
  let rawParquesData = null;
  function buildParques(parques) {
    rawParquesData = parques;
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
      .then(data => { rawParquesData = data; buildParques(data); })
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
      buildNoiseGround(data.bbox);
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
  document.getElementById("noiseToggleBtn").addEventListener("click", (e) => {
    noiseOn = !noiseOn;
    if (noiseMesh) noiseMesh.visible = noiseOn;
    e.target.classList.toggle("active", noiseOn);
    e.target.textContent = noiseOn ? "🔊 Ocultar ruido" : "🔊 Mostrar ruido";
  });
  document.getElementById("birdToggleBtn").addEventListener("click", (e) => {
    birdOn = !birdOn;
    if (birdsGroup) birdsGroup.visible = birdOn;
    e.target.textContent = birdOn ? "🐦 Ocultar mirlas" : "🐦 Mostrar mirlas";
  });

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
    if ((noiseOn || birdOn) && timesteps.length) computeLiveNoiseField(vehiclesAtTime(currentTime), now); // fuera del "if playing": el ruido se sigue viendo aunque este en pausa
    if (birdOn) updateBirds(now);
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
    currentBoxRealBounds = { // rango REAL (mismo sistema que los datos) de la caja actual, para que el ruido y las mirlas trabajen solo dentro de esta area, no en toda la ciudad
      xMin: Math.min(r0[0], r1[0]), xMax: Math.max(r0[0], r1[0]),
      yMin: Math.min(r0[1], r1[1]), yMax: Math.max(r0[1], r1[1]),
    };
    sectionBoxOutput.value =
      `X: ${secXMin.value}% a ${secXMax.value}%  (real ${Math.round(Math.min(r0[0],r1[0]))} a ${Math.round(Math.max(r0[0],r1[0]))})\n` +
      `Y (altura, m): ${(yMin / SCALE).toFixed(1)} a ${(yMax / SCALE).toFixed(1)}\n` +
      `Z: ${secZMin.value}% a ${secZMax.value}%  (real ${Math.round(Math.min(r0[1],r1[1]))} a ${Math.round(Math.max(r0[1],r1[1]))})`;
    rebuildNoiseGround();
    rebuildBirds();
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

  // ---- Explosion en 3 fotos identicas de la base: se captura el canvas
  // tal como se ve en ese momento (misma vista, mismos colores, sin
  // ningun cambio) y se muestra 3 veces apiladas en un overlay aparte,
  // sin tocar el layout de la base (para no repetir los problemas de
  // alineacion/zoom de intentos anteriores). ----
  const explodeOverlay = document.getElementById("explodeOverlay");
  const explodeImgs = [document.getElementById("explodeImg1"), document.getElementById("explodeImg2"), document.getElementById("explodeImg3")];
  const explodeLayers = document.querySelectorAll("#explodeStack .explode-layer");
  const explodeHint = document.getElementById("explodeHint");

  // ---- Herramienta de pluma: dibujar un poligono haciendo clic para ir
  // agregando vertices en la PANTALLA (dibujo 2D con SVG, no sobre el
  // terreno 3D), para poder dibujar libremente afuera del rombo tambien
  // - se sigue calculando lat/lng de cada punto (proyectando contra el
  // suelo) solo para el dato, no para la posicion visual del dibujo.
  let penActive = false;
  const penPoints = []; // {sx,sy} pixeles de pantalla + {x,y} coordenadas RAW calculadas
  const penSvg = document.getElementById("penSvgOverlay");
  const SVGNS = "http://www.w3.org/2000/svg";
  const penRaycaster = new THREE.Raycaster();
  const penNdc = new THREE.Vector2();
  const penCoordsOutput = document.getElementById("penCoordsOutput");

  // ---- Poligono fijo dado por el usuario (coordenadas reales exactas),
  // se dibuja en negro sobre el mapa y se recalcula su posicion en
  // pantalla cada vez que la camara se mueve, para que quede pegado al
  // lugar real que representa. ----
  const FIXED_POLYGON = [
    { x: 6543.2, y: 4141.8 },
    { x: 6533.1, y: 2808.1 },
    { x: 7888.4, y: 2808.6 },
    { x: 7858.7, y: 2775.8 },
    { x: 6497.1, y: 2773.1 },
    { x: 6508.8, y: 4106.2 },
  ];
  const fixedPolySvg = document.createElementNS(SVGNS, "polygon");
  fixedPolySvg.setAttribute("fill", "rgba(10,10,10,0.35)");
  fixedPolySvg.setAttribute("stroke", "#0a0a0a");
  fixedPolySvg.setAttribute("stroke-width", "2.5");
  document.getElementById("fixedPolySvgOverlay").appendChild(fixedPolySvg);
  const fixedProjVec = new THREE.Vector3();
  function updateFixedPolygon() {
    const svgRect = document.getElementById("fixedPolySvgOverlay").getBoundingClientRect();
    const pts = FIXED_POLYGON.map(p => {
      const s = toScene(p.x, p.y);
      fixedProjVec.set(s.x, 0, s.z);
      fixedProjVec.project(camera);
      return `${(fixedProjVec.x * 0.5 + 0.5) * svgRect.width},${(-fixedProjVec.y * 0.5 + 0.5) * svgRect.height}`;
    }).join(" ");
    fixedPolySvg.setAttribute("points", pts);
  }
  controls.addEventListener("change", updateFixedPolygon);
  window.addEventListener("resize", updateFixedPolygon);

  // ---- Dibuja el mismo polígono de la axo principal proyectado sobre las 3 capas explotadas y ajusta el recorte ----
  function updateExplodePolygons() {
    const polySvgs = document.querySelectorAll(".explode-poly-svg");
    const origW = wrap.clientWidth;
    const origH = wrap.clientHeight;
    const pts = FIXED_POLYGON.map(p => {
      const s = toScene(p.x, p.y);
      fixedProjVec.set(s.x, 0, s.z);
      fixedProjVec.project(camera);
      return {
        x: (fixedProjVec.x * 0.5 + 0.5) * origW,
        y: (-fixedProjVec.y * 0.5 + 0.5) * origH
      };
    });

    const ptsAttr = pts.map(pt => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(" ");

    polySvgs.forEach(svg => {
      // Usar exactamente la resolución capturada para que coincida con object-fit
      svg.setAttribute("viewBox", `0 0 ${origW} ${origH}`);
      // Y preserveAspectRatio debe ser xMidYMid meet (igual que object-fit: contain)
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.innerHTML = "";
      const poly = document.createElementNS(SVGNS, "polygon");
      poly.setAttribute("points", ptsAttr);
      poly.setAttribute("fill", "none");
      poly.setAttribute("stroke", "#0a0a0a");
      poly.setAttribute("stroke-width", "3");
      svg.appendChild(poly);
    });
  }

  function screenToGround(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    penNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    penNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    penRaycaster.setFromCamera(penNdc, camera);
    const dir = penRaycaster.ray.direction, origin = penRaycaster.ray.origin;
    const t = (0 - origin.y) / dir.y; // interseccion con el plano Y=0 (nivel del suelo), solo para el dato de coordenadas
    const hit = origin.clone().add(dir.clone().multiplyScalar(t));
    return fromScene(hit.x, hit.z);
  }
  function redrawPenSvg() {
    penSvg.innerHTML = "";
    if (penPoints.length === 0) return;
    if (penPoints.length >= 2) {
      const pts = penPoints.map(p => `${p.sx},${p.sy}`).join(" ");
      const poly = document.createElementNS(SVGNS, "polygon"); // "polygon" (no "polyline") cierra la forma sola y permite rellenarla, como una herramienta de pluma normal
      poly.setAttribute("points", pts);
      poly.setAttribute("fill", "rgba(10,10,10,0.35)"); // forma rellena mientras se dibuja, como en Illustrator
      poly.setAttribute("stroke", "#0a0a0a");
      poly.setAttribute("stroke-width", "2.5");
      penSvg.appendChild(poly);
    }
    // Puntos visibles (circulos), para que se vea cada vertice aunque el
    // trazo entre 2 puntos sea corto - van DESPUES del poligono en el
    // DOM para quedar por encima y poder arrastrarlos. Cada uno se puede
    // arrastrar para reubicarlo despues de dibujado, por si quedo
    // desfigurado.
    penPoints.forEach((p, idx) => {
      const c = document.createElementNS(SVGNS, "circle");
      c.setAttribute("cx", p.sx); c.setAttribute("cy", p.sy); c.setAttribute("r", "6");
      c.setAttribute("fill", "#0a0a0a");
      c.style.pointerEvents = "auto";
      c.style.cursor = "move";
      c.addEventListener("pointerdown", (ev) => {
        ev.stopPropagation();
        draggingPenIdx = idx;
      });
      penSvg.appendChild(c);
    });
  }
  let draggingPenIdx = null;
  window.addEventListener("pointermove", (e) => {
    if (draggingPenIdx === null) return;
    const svgRect = penSvg.getBoundingClientRect();
    const sx = e.clientX - svgRect.left, sy = e.clientY - svgRect.top;
    const pt3d = screenToGround(e.clientX, e.clientY);
    penPoints[draggingPenIdx] = { sx, sy, x: pt3d.x, y: pt3d.y };
    redrawPenSvg();
    updatePenOutput();
  });
  function updatePenOutput() {
    if (penPoints.length === 0) { penCoordsOutput.style.display = "none"; return; }
    penCoordsOutput.style.display = "block";
    penCoordsOutput.value = penPoints.map((p, i) =>
      `Punto ${i + 1}: lat ${localToLat(p.y).toFixed(6)}, lng ${localToLng(p.x).toFixed(6)}  (local x:${p.x.toFixed(1)} y:${p.y.toFixed(1)})`
    ).join("\n");
  }
  document.getElementById("penToolBtn").addEventListener("click", () => {
    penActive = !penActive;
    const btn = document.getElementById("penToolBtn");
    btn.textContent = penActive ? "✏️ Dibujando… (clic para terminar)" : "✏️ Dibujar polígono";
    btn.style.background = penActive ? "rgba(255,45,85,.85)" : "rgba(10,12,14,.85)";
    penSvg.style.display = penActive ? "block" : "none";
    controls.enabled = !penActive; // mientras se dibuja, se desactiva rotar/zoom/mover la camara, para que el clic solo ponga puntos
    if (!penActive) { penPoints.length = 0; redrawPenSvg(); penCoordsOutput.style.display = "none"; }
  });
  let justDraggedPen = false;
  window.addEventListener("pointerup", () => {
    if (draggingPenIdx !== null) justDraggedPen = true;
    draggingPenIdx = null;
  });
  window.addEventListener("click", (e) => {
    if (!penActive) return;
    if (justDraggedPen) { justDraggedPen = false; return; } // si el clic fue el final de arrastrar un punto existente, no agregar uno nuevo
    const pt3d = screenToGround(e.clientX, e.clientY);
    const svgRect = penSvg.getBoundingClientRect(); // el SVG esta dentro de .main (corrido por el menu lateral), asi que hay que restar su propio origen, no usar las coordenadas de toda la ventana directamente
    penPoints.push({ sx: e.clientX - svgRect.left, sy: e.clientY - svgRect.top, x: pt3d.x, y: pt3d.y });
    redrawPenSvg();
    updatePenOutput();
  });
  canvas.addEventListener("click", (e) => {
    if (penActive) return; // mientras se dibuja el poligono, no se dispara la explosion

    // Guardar estado y fondo original
    const origRoadColor = roadMat ? roadMat.color.getHex() : null;
    const origNoiseVis = noiseMesh ? noiseMesh.visible : false;
    const origBirdsVis = birdsGroup ? birdsGroup.visible : false;
    const origVehVis = vehInstanced ? vehInstanced.visible : false;
    const origBg = scene.background;

    // Usar fondo blanco sólido para que NO aparezcan zonas oscuras o negras
    scene.background = new THREE.Color(0xffffff);

    // 1. Escala Natural: base arquitectónica 100% limpia, CERO carros, CERO ruido, CERO mirlas
    if (noiseMesh) noiseMesh.visible = false;
    if (birdsGroup) birdsGroup.visible = false;
    if (vehInstanced) { vehInstanced.visible = false; vehInstanced.count = 0; }
    if (roadMat) roadMat.color.set(0x9099a3);
    renderer.render(scene, camera);
    const fotoNatural = renderer.domElement.toDataURL("image/png");

    // 2. Escala Cultural: con vehículos y dinámicas urbanas
    if (vehInstanced) {
      vehInstanced.visible = true;
      vehInstanced.count = vehiclesAtTime(currentTime).length || 120;
      renderVehiclesAt(currentTime);
    }
    if (roadMat) roadMat.color.set(0x7a838d);
    renderer.render(scene, camera);
    const fotoCultural = renderer.domElement.toDataURL("image/png");

    // 3. Escala Tecnológica: vista analítica de la red
    if (vehInstanced) vehInstanced.visible = true;
    if (roadMat) roadMat.color.set(0x9099a3);
    renderer.render(scene, camera);
    const fotoTecno = renderer.domElement.toDataURL("image/png");

    // Restaurar fondo original y estado de la escena base
    scene.background = origBg;
    if (roadMat && origRoadColor !== null) roadMat.color.set(origRoadColor);
    if (noiseMesh) noiseMesh.visible = origNoiseVis;
    if (birdsGroup) birdsGroup.visible = origBirdsVis;
    if (vehInstanced) {
      vehInstanced.visible = origVehVis;
      vehInstanced.count = origVehVis ? (vehiclesAtTime(currentTime).length || 0) : 0;
    }

    // Asignar fotos a cada imagen según su escala
    const imgNatural = document.getElementById("explodeImg1");
    const imgCultural = document.getElementById("explodeImg2");
    const imgTecno = document.getElementById("explodeImg3");
    if (imgNatural) imgNatural.src = fotoNatural;
    if (imgCultural) imgCultural.src = fotoCultural;
    if (imgTecno) imgTecno.src = fotoTecno;

    document.getElementById("sceneWrap").style.display = "none";
    explodeOverlay.style.display = "flex";
    void explodeOverlay.offsetWidth;
    explodeLayers.forEach(el => { el.style.opacity = "1"; el.style.transform = "scale(1)"; });

    setTimeout(() => {
      updateExplodePolygons();
      document.querySelectorAll(".explode-text").forEach(t => initTextDistort(t, t.dataset.layer));
    }, 60);
  });
  document.getElementById("explodeClose").addEventListener("click", () => {
    explodeOverlay.style.display = "none";
    document.getElementById("sceneWrap").style.display = "block";
    explodeLayers.forEach(el => { el.style.opacity = "0"; el.style.transform = "scale(.05)"; });
    hideAllHandles();
  });
  setTimeout(updateFixedPolygon, 500);

  // ============================================================
  // Distorsion de 4 esquinas para los textos de cada capa (tipo
  // Photoshop "deformar/perspectiva"): cada texto tiene 4 manijas en las
  // esquinas que se pueden arrastrar libremente; se calcula la homografia
  // exacta que lleva el rectangulo original a esas 4 esquinas y se aplica
  // como matrix3d con transform-origin: 0 0.
  // ============================================================
  function solveHomography(w, h, dst) {
    const src = [[0, 0], [w, 0], [w, h], [0, h]];
    const A = [];
    const bvec = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i], X = dst[i].x, Y = dst[i].y;
      A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]); bvec.push(X);
      A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]); bvec.push(Y);
    }
    for (let col = 0; col < 8; col++) {
      let piv = col;
      for (let r = col + 1; r < 8; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
      [A[col], A[piv]] = [A[piv], A[col]]; [bvec[col], bvec[piv]] = [bvec[piv], bvec[col]];
      for (let r = 0; r < 8; r++) {
        if (r === col) continue;
        const f = A[r][col] / A[col][col];
        for (let c = col; c < 8; c++) A[r][c] -= f * A[col][c];
        bvec[r] -= f * bvec[col];
      }
    }
    const h_ = bvec.map((v, i) => v / A[i][i]);
    return [h_[0], h_[1], h_[2], h_[3], h_[4], h_[5], h_[6], h_[7], 1];
  }
  function homographyToMatrix3d(H) {
    const m = H;
    return `matrix3d(${m[0]},${m[3]},0,${m[6]}, ${m[1]},${m[4]},0,${m[7]}, 0,0,1,0, ${m[2]},${m[5]},0,${m[8]})`;
  }
  const textStates = {}; // layerNum -> {corners:[{x,y}x4], w, h, originLeft, originTop}
  function initTextDistort(textEl, layerNum) {
    textEl.style.transform = "none";
    textEl.style.transformOrigin = "0 0";
    textEl.style.background = "transparent";
    textEl.style.border = "none";
    textEl.style.padding = "0";
    textEl.style.fontSize = "12px";
    const w = textEl.offsetWidth || 130;
    const h = textEl.offsetHeight || 20;
    const originLeft = textEl.offsetLeft;
    const originTop = textEl.offsetTop;
    // Coordenadas exactas entregadas por la usuaria
    textStates[layerNum] = {
      w, h, originLeft, originTop,
      corners: [{ x: 28, y: 94 }, { x: 192, y: 5 }, { x: 190, y: 29 }, { x: 28, y: 117 }]
    };
    buildHandles(textEl, layerNum);
    applyDistort(textEl, layerNum);
  }
  function applyDistort(textEl, layerNum) {
    const st = textStates[layerNum];
    if (!st) return;
    const H = solveHomography(st.w, st.h, st.corners);
    textEl.style.transformOrigin = "0 0";
    textEl.style.transform = homographyToMatrix3d(H);
    updateTextCoordsOutput();
  }
  let handlesLayer = null;
  function buildHandles(textEl, layerNum) {
    if (!handlesLayer) {
      handlesLayer = document.createElement("div");
      handlesLayer.id = "textHandlesLayer";
      handlesLayer.style.cssText = "position:fixed; inset:0; z-index:400; pointer-events:none;";
      document.body.appendChild(handlesLayer);
    }
    const st = textStates[layerNum];
    if (st.handleEls) st.handleEls.forEach(h => h.remove());
    st.handleEls = st.corners.map((c, idx) => {
      const h = document.createElement("div");
      h.style.cssText = "position:absolute; width:14px; height:14px; border-radius:50%; background:#fff; border:2px solid #0a0a0a; cursor:grab; pointer-events:auto; display:none; box-shadow:0 2px 6px rgba(0,0,0,0.5);";
      h.dataset.layer = layerNum; h.dataset.corner = idx;
      handlesLayer.appendChild(h);
      return h;
    });
  }
  function positionHandles(textEl, layerNum) {
    const st = textStates[layerNum];
    if (!st || !st.handleEls) return;
    const parentRect = textEl.parentElement.getBoundingClientRect();
    const baseScreenX = parentRect.left + st.originLeft;
    const baseScreenY = parentRect.top + st.originTop;
    st.corners.forEach((c, idx) => {
      const cx = baseScreenX + c.x;
      const cy = baseScreenY + c.y;
      st.handleEls[idx].style.left = (cx - 7) + "px";
      st.handleEls[idx].style.top = (cy - 7) + "px";
    });
  }
  function showHandlesFor(layerNum) {
    Object.keys(textStates).forEach(k => {
      if (textStates[k].handleEls) {
        textStates[k].handleEls.forEach(h => { h.style.display = (k == layerNum) ? "block" : "none"; });
      }
    });
    positionHandles(document.querySelector(`.explode-text[data-layer="${layerNum}"]`), layerNum);
  }
  function hideAllHandles() {
    Object.keys(textStates).forEach(k => {
      if (textStates[k].handleEls) {
        textStates[k].handleEls.forEach(h => h.style.display = "none");
      }
    });
  }
  let draggingHandle = null;
  document.addEventListener("pointerdown", (e) => {
    if (e.target.closest && e.target.closest("#textHandlesLayer") && e.target.dataset.corner !== undefined) {
      draggingHandle = { layer: e.target.dataset.layer, corner: parseInt(e.target.dataset.corner) };
      e.preventDefault();
    }
  });
  document.addEventListener("pointermove", (e) => {
    if (!draggingHandle) return;
    const layerNum = draggingHandle.layer;
    const textEl = document.querySelector(`.explode-text[data-layer="${layerNum}"]`);
    const st = textStates[layerNum];
    if (!st || !textEl) return;
    const parentRect = textEl.parentElement.getBoundingClientRect();
    const baseScreenX = parentRect.left + st.originLeft;
    const baseScreenY = parentRect.top + st.originTop;
    st.corners[draggingHandle.corner] = { x: e.clientX - baseScreenX, y: e.clientY - baseScreenY };
    applyDistort(textEl, layerNum);
    positionHandles(textEl, layerNum);
  });
  document.addEventListener("pointerup", () => { draggingHandle = null; });

  // ---- Toolbar flotante (tamaño, color) para el texto activo ----
  const textToolbar = document.createElement("div");
  textToolbar.style.cssText = "display:none; position:absolute; z-index:401; background:rgba(10,12,14,.92); border:1px solid rgba(255,255,255,.2); border-radius:8px; padding:6px 10px; gap:8px; align-items:center; top:20px; left:50%; transform:translateX(-50%);";
  textToolbar.innerHTML = `
    <label style="color:#fff; font-size:11px;">Tamaño <input type="range" id="txtSizeSlider" min="10" max="60" value="22" style="vertical-align:middle;"></label>
    <label style="color:#fff; font-size:11px;">Color <input type="color" id="txtColorPicker" value="#ffffff"></label>
  `;
  document.body.appendChild(textToolbar);
  let activeTextEl = null;
  document.querySelectorAll(".explode-text").forEach(t => {
    const layerNum = t.dataset.layer;
    t.addEventListener("focus", () => {
      activeTextEl = t;
      textToolbar.style.display = "flex";
      document.getElementById("txtSizeSlider").value = parseInt(t.style.fontSize) || 22;
      document.getElementById("txtColorPicker").value = rgbToHex(t.style.color) || "#ffffff";
      showHandlesFor(layerNum);
    });
  });
  function rgbToHex(rgb) {
    if (!rgb) return null;
    if (rgb.startsWith("#")) return rgb;
    const m = rgb.match(/\d+/g);
    if (!m) return null;
    return "#" + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, "0")).join("");
  }
  document.getElementById("txtSizeSlider").addEventListener("input", (e) => {
    if (activeTextEl) { activeTextEl.style.fontSize = e.target.value + "px"; updateTextCoordsOutput(); }
  });
  document.getElementById("txtColorPicker").addEventListener("input", (e) => {
    if (activeTextEl) { activeTextEl.style.color = e.target.value; updateTextCoordsOutput(); }
  });

  // ---- Zoom individual al hacer clic en cada capa: la que se toca se enfoca
  // suavemente sin agrandar desproporcionadamente el rombo, las otras se desvanecen.
  // Y al hacer clic por SEGUNDA VEZ sobre la capa que ya tiene zoom, se abre la sub-explosión temática. ----
  let zoomedLayer = null;
  function unzoomAll() {
    document.querySelectorAll(".explode-layer").forEach(l => {
      l.style.transition = "transform 2.2s cubic-bezier(.2,.85,.25,1), width 2.2s cubic-bezier(.2,.85,.25,1), opacity 1.6s ease";
      l.style.transform = "scale(1)"; l.style.opacity = "1"; l.style.visibility = "visible"; l.style.zIndex = "1"; l.style.position = "relative"; l.style.top = ""; l.style.left = ""; l.style.width = "";
    });
    zoomedLayer = null;
  }
  document.querySelectorAll(".explode-layer").forEach((layerEl) => {
    const clip = layerEl.querySelector(".explode-clip");
    if (!clip) return;
    clip.addEventListener("click", (e) => {
      e.stopPropagation();
      const layerNum = parseInt(layerEl.dataset.layer, 10);
      
      // Si la capa YA está en zoom y el usuario le vuelve a hacer clic:
      if (zoomedLayer === layerNum) {
        if (layerNum === 1) {
          openNaturalExplode();
        } else if (layerNum === 2) {
          openCulturalExplode();
        } else if (layerNum === 3) {
          openTechExplode();
        } else {
          unzoomAll();
        }
        return;
      }

      // PRIMER CLIC: enfoque y suave centrado sin distorsionar el tamaño del rombo
      zoomedLayer = layerNum;
      const allLayers = document.querySelectorAll(".explode-layer");
      allLayers.forEach((l) => {
        const lNum = parseInt(l.dataset.layer, 10);
        if (lNum === layerNum) {
          // Agrandar la axonometría al tocarla para que se vea mucho más grande
          l.style.transition = "transform 2.4s cubic-bezier(.2,.85,.25,1), opacity 1.8s ease, width 2.4s cubic-bezier(.2,.85,.25,1)";
          l.style.position = "fixed";
          l.style.top = "50%"; l.style.left = "50%";
          l.style.width = "min(78vw, 840px)";
          l.style.maxWidth = "840px";
          l.style.transform = "translate(-50%,-50%) scale(1.35)";
          l.style.zIndex = "60";
          l.style.opacity = "1"; l.style.visibility = "visible";
        } else {
          // Las otras se desvanecen lentamente
          l.style.transition = "opacity 1.2s ease, transform 1.2s ease";
          l.style.opacity = "0";
          l.style.visibility = "hidden";
        }
      });
    });
  });
  // Clic afuera de las axonometrias (en el fondo del overlay) vuelve a
  // mostrar las 3 apiladas normalmente.
  explodeOverlay.addEventListener("click", (e) => {
    if (zoomedLayer !== null && e.target === explodeOverlay) unzoomAll();
  });

  // ---- Clic en Escala Natural (Capa 1): abre la sub-explosión de 4 capas arquitectónicas ----
  const natOverlay = document.getElementById("naturalExplodeOverlay");
  const natBackBtn = document.getElementById("natExplodeBack");
  const natAssembleBtn = document.getElementById("natAssembleBtn");
  const natAssembleBtnText = document.getElementById("natAssembleBtnText");
  const natBaseImg = document.getElementById("natBaseImg");
  const natContextImg = document.getElementById("natContextImg");
  const natLayerContext = document.getElementById("natLayerContext");
  const natWaterCanvas = document.getElementById("natWaterCanvas");
  const natWaterSvg = document.getElementById("natWaterSvg");
  const natVegCanvas = document.getElementById("natVegCanvas");
  const natVegSvg = document.getElementById("natVegSvg");
  const natBirdCanvas = document.getElementById("natBirdCanvas");
  const natBirdSvg = document.getElementById("natBirdSvg");
  const natMacroCanvas = document.getElementById("natMacroCanvas");
  const natMacroSvg = document.getElementById("natMacroSvg");
  const natGuideSvg = document.getElementById("natGuideSvg");
  const natMesSlider = document.getElementById("natMesSlider");
  const natMesLabel = document.getElementById("natMesLabel");
  const natFloodStats = document.getElementById("natFloodStats");
  const natPlayYearBtn = document.getElementById("natPlayYearBtn");

  const MESES_NAT = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const HUMEDAL_CICLO = [
    { mes: 1, expansion_pct: 41.7, profundidad_m: 1.32, temporada: "Temporada seca / intermedia" },
    { mes: 2, expansion_pct: 42.6, profundidad_m: 1.39, temporada: "Temporada seca / intermedia" },
    { mes: 3, expansion_pct: 46.7, profundidad_m: 1.73, temporada: "Inicio de temporada de lluvias" },
    { mes: 4, expansion_pct: 50.0, profundidad_m: 2.00, temporada: "Pico de lluvias (máxima cota)" },
    { mes: 5, expansion_pct: 47.4, profundidad_m: 1.78, temporada: "Temporada de lluvias" },
    { mes: 6, expansion_pct: 41.5, profundidad_m: 1.30, temporada: "Temporada de estiaje" },
    { mes: 7, expansion_pct: 37.7, profundidad_m: 0.99, temporada: "Temporada seca (estiaje)" },
    { mes: 8, expansion_pct: 34.1, profundidad_m: 0.69, temporada: "Estiaje pronunciado" },
    { mes: 9, expansion_pct: 33.0, profundidad_m: 0.60, temporada: "Mínimo anual de cota (estiaje)" },
    { mes: 10, expansion_pct: 38.6, profundidad_m: 1.06, temporada: "Segunda temporada de lluvias" },
    { mes: 11, expansion_pct: 43.8, profundidad_m: 1.49, temporada: "Pico de segunda temporada de lluvias" },
    { mes: 12, expansion_pct: 43.3, profundidad_m: 1.45, temporada: "Descenso hacia temporada seca" },
  ];

  let natYearPlaying = false, natYearTimer = null;
  let natWaterAnimFrame = null;
  let natWaterTime = 0;
  let natIsAssembled = false; // Estado: true si las capas bajaron y se colocaron sobre la base axo

  let canonicalCamera = null;
  function updateCanonicalCamera() {
    if (!camera) return;
    canonicalCamera = camera.clone();
    canonicalCamera.matrixWorldInverse.copy(camera.matrixWorldInverse);
    // BUG REAL encontrado: la camara principal tiene la proporcion de
    // ANCHO/ALTO de la ventana completa (.main, que no es 16:9), pero
    // las subcapas se dibujan en un lienzo que SI es 16:9 - al copiar
    // tal cual la matriz de proyeccion de la camara principal y usarla
    // para proyectar puntos sobre un lienzo con OTRA proporcion, todo se
    // estira/deforma (por eso el humedal no coincidia con su forma real).
    // Se recalculan aqui los limites (left/right) de esta camara
    // ortografica clonada para que su proporcion sea EXACTAMENTE 16:9,
    // manteniendo el mismo alto (top/bottom = mismo zoom vertical) que
    // la camara principal, para que el contenido se vea del mismo
    // tamaño real, sin deformarse.
    const alto = camera.top - camera.bottom;
    const anchoDeseado = alto * (16 / 9);
    const centroX = (camera.left + camera.right) / 2;
    canonicalCamera.left = centroX - anchoDeseado / 2;
    canonicalCamera.right = centroX + anchoDeseado / 2;
    canonicalCamera.top = camera.top;
    canonicalCamera.bottom = camera.bottom;
    canonicalCamera.updateProjectionMatrix();
  }

  // Matriz de proyección canónica para el viewport 16:9 de las subcapas
  function projectPointToLayer(rx, ry, elevation, w, h) {
    const sp = toScene(rx, ry);
    const el = (typeof elevation === "number") ? elevation : 0.0;
    const p = new THREE.Vector3(sp.x, el, sp.z);
    const cam = canonicalCamera || camera;
    p.project(cam);
    return {
      x: (p.x * 0.5 + 0.5) * w,
      y: (-p.y * 0.5 + 0.5) * h,
      inFront: p.z <= 1
    };
  }

  // Dibuja el marco rojo técnico del sector de estudio (Humedal El Burro) en la subcapa
  function drawFocusSiteBoundingBox(ctx, projectPoint) {
    const minX = 7050, maxX = 7950, minY = 2800, maxY = 3500;
    const p1 = projectPoint(minX, minY, 0.0);
    const p2 = projectPoint(maxX, minY, 0.0);
    const p3 = projectPoint(maxX, maxY, 0.0);
    const p4 = projectPoint(minX, maxY, 0.0);

    if (!p1.inFront || !p2.inFront || !p3.inFront || !p4.inFront) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.closePath();

    ctx.strokeStyle = "rgba(225, 29, 72, 0.95)";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();

    const corners = [p1, p2, p3, p4];
    corners.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#e11d48";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    ctx.restore();
  }

  function openNaturalExplode() {
    if (!natOverlay) return;

    // Sincronizar dimensiones exactas del lienzo de capa
    const targetW = 960;
    const targetH = 540; // Relación fija 16:9 exacta

    // Guardar estado original de la cámara y renderer
    const origW = wrap.clientWidth;
    const origH = wrap.clientHeight;

    // Configurar cámara y renderer temporalmente a 16:9 exacto para la captura de la base
    const layerAspect = targetW / targetH; // 16/9 = 1.7777777777777777
    camera.left = -viewSize * layerAspect;
    camera.right = viewSize * layerAspect;
    camera.top = viewSize;
    camera.bottom = -viewSize;
    camera.updateProjectionMatrix();
    renderer.setSize(targetW, targetH, false);
    updateCanonicalCamera();

    // Captura fotográfica de la base limpia con fondo transparente (cero carros, cero ruido, cero mirlas)
    const origRoadColor = roadMat ? roadMat.color.getHex() : null;
    const origNoiseVis = noiseMesh ? noiseMesh.visible : false;
    const origBirdsVis = birdsGroup ? birdsGroup.visible : false;
    const origVehVis = vehInstanced ? vehInstanced.visible : false;
    const origVehCount = vehInstanced ? vehInstanced.count : 0;
    const origBg = scene.background;

    if (noiseMesh) noiseMesh.visible = false;
    if (birdsGroup) birdsGroup.visible = false;
    if (vehInstanced) { vehInstanced.visible = false; vehInstanced.count = 0; }
    if (roadMat) roadMat.color.set(0x9099a3);

    // Renderizar con fondo blanco puro
    scene.background = new THREE.Color(0xffffff);
    renderer.render(scene, camera);
    const fotoBase = renderer.domElement.toDataURL("image/png");

    // Captura ADICIONAL de contexto: la misma vista pero con la camara
    // alejada (viewSize mas grande), mostrando mucho mas alrededor del
    // sector cortado - esta se muestra de fondo, mas grande y con
    // opacidad baja, para dar sensacion de "aqui esta ubicado dentro de
    // todo Kennedy" (igual al referente de Pinterest). Se restaura el
    // viewSize original justo despues, para no afectar nada mas.
    if (natContextImg) {
      const contextZoomOut = 3.2; // cuanto se aleja la camara para el contexto
      camera.left = -viewSize * contextZoomOut * layerAspect;
      camera.right = viewSize * contextZoomOut * layerAspect;
      camera.top = viewSize * contextZoomOut;
      camera.bottom = -viewSize * contextZoomOut;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      natContextImg.src = renderer.domElement.toDataURL("image/png");
      if (natLayerContext) natLayerContext.style.opacity = "1";
      // se restaura el encuadre normal (el mismo que usa fotoBase) para
      // que el resto del flujo (subcapas, etc.) siga igual que antes
      camera.left = -viewSize * layerAspect;
      camera.right = viewSize * layerAspect;
      camera.top = viewSize;
      camera.bottom = -viewSize;
      camera.updateProjectionMatrix();
    }
    scene.background = origBg;

    // Captura FOTOGRAFICA (no vectorial) de SOLO el agua, con la MISMA
    // camara exacta usada para fotoBase - al ser literalmente la misma
    // foto/camara, el humedal aqui SIEMPRE encaja pixel por pixel con la
    // base, sin depender de que una proyeccion vectorial por separado
    // calce bien (que es donde venian los problemas de desajuste).
    if (natWaterImg) {
      const toHide = [currentBuildingMesh, currentBuildingEdgeMesh, currentBuildingCornerMesh, ...currentRoadMeshes, treeMeshes && treeMeshes[0] ? treeMeshes[0].mesh : null].filter(o => o && o.visible !== undefined);
      const prevVis = toHide.map(o => o.visible);
      toHide.forEach(o => { o.visible = false; });
      scene.background = new THREE.Color(0xffffff);
      renderer.render(scene, camera);
      natWaterImg.src = renderer.domElement.toDataURL("image/png");
      natWaterImg.style.display = "block";
      natWaterImg.style.objectFit = "fill";
      toHide.forEach((o, i) => { o.visible = prevVis[i]; });
      scene.background = origBg;
    }
    if (roadMat && origRoadColor !== null) roadMat.color.set(origRoadColor);
    if (noiseMesh) noiseMesh.visible = origNoiseVis;
    if (birdsGroup) birdsGroup.visible = origBirdsVis;
    if (vehInstanced) {
      vehInstanced.visible = origVehVis;
      vehInstanced.count = origVehCount;
    }

    if (natBaseImg) {
      natBaseImg.src = fotoBase;
      natBaseImg.style.objectFit = "fill";
    }
    // Subcapas flotantes limpias (planos diagramáticos sobre fondo blanco/transparente)
    const setNatSubImg = (id) => {
      const el = document.getElementById(id);
      if (el) { el.src = ""; el.style.display = "none"; }
    };
    setNatSubImg("natWaterImg");
    setNatSubImg("natVegImg");
    setNatSubImg("natBirdImg");
    setNatSubImg("natMacroImg");

    natOverlay.style.display = "flex";
    void natOverlay.offsetWidth;

    // Iniciar con solo la base axonométrica limpia (Paso 0)
    natExplodeStep = 0;
    updateNaturalLayersStep(false);
    renderAllNaturalSublayers();

    // Iniciar loop continuo de agua viva fluida y oleaje
    startNatWaterAnimation();
  }

  function renderAllNaturalSublayers() {
    const mes = parseInt(natMesSlider.value, 10);
    renderNaturalWaterLayer(mes);
    renderNaturalVegLayer(mes);
    renderNaturalBirdLayer(mes);
    renderNaturalMacroLayer(mes);
    drawNaturalGuideLines();
  }

  let natExplodeStep = 0;
  // Secuencia de pasos interactivos:
  // 0: Base limpia
  // 1: Capa 1 (Agua) extraída arriba
  // 2: Capa 1 asentada en la base (simulación en territorio)
  // 3: Capa 2 (Vegetación) extraída arriba
  // 4: Capa 2 asentada en la base
  // 5: Capa 3 (Aves) extraída arriba
  // 6: Capa 3 asentada en la base
  // 7: Capa 4 (Conectividad) extraída arriba
  // 8: Capa 4 asentada en la base
  // 9: Vista explotada completa (todas las capas flotando apiladas)
  // 10: Integración total (todas las capas asentadas en la base simulando en conjunto)

  function updateNaturalLayersStep(animated = true) {
    const sublayers = [
      document.getElementById("natLayerWater"),
      document.getElementById("natLayer2"),
      document.getElementById("natLayer3"),
      document.getElementById("natLayer4")
    ];
    const baseEl = document.getElementById("natLayerBase");
    const tags = natOverlay.querySelectorAll(".nat-layer-tag");

    // Limpiar o aplicar planos diagramáticos sobre los rombos
    const allDiamonds = natOverlay.querySelectorAll(".sublayer-diamond");
    allDiamonds.forEach(d => {
      const isBase = d.parentElement && d.parentElement.id === "natLayerBase";
      if (isBase) {
        d.style.background = "transparent";
        d.style.boxShadow = "none";
        d.style.borderColor = "transparent";
      } else {
        d.style.background = "rgba(255, 255, 255, 0.92)";
        d.style.border = "1.5px solid rgba(15, 23, 42, 0.35)";
        d.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.08)";
      }
    });

    if (natExplodeStep === 0) {
      // Paso 0: Únicamente la base limpia visible en el centro de la pantalla
      if (baseEl) { baseEl.style.top = "50%"; baseEl.style.opacity = "1"; baseEl.style.transform = "translate(-50%, -40%)"; }
      sublayers.forEach(l => { if (l) { l.style.opacity = "0"; l.style.top = "50%"; l.style.transform = "translate(-50%, -40%)"; } });
      tags.forEach(t => { t.style.opacity = "0"; });
      if (natGuideSvg) natGuideSvg.style.opacity = "0";
      if (natAssembleBtnText) natAssembleBtnText.textContent = "Extraer Capa 1: Sistema Hídrico";
      return;
    }

    // Pasos impares (1, 3, 5, 7): Capa i extraída flotando arriba; base centrada abajo en la mitad de la pantalla
    if (natExplodeStep % 2 === 1 && natExplodeStep <= 7) {
      const activeIdx = Math.floor(natExplodeStep / 2);

      if (baseEl) { baseEl.style.top = "54%"; baseEl.style.opacity = "1"; baseEl.style.transform = "translate(-50%, -40%)"; }
      sublayers.forEach((l, index) => {
        if (!l) return;
        if (index === activeIdx) {
          // Capa activa flotando arriba
          const expTop = l.dataset.explodedTop || "12%";
          l.style.top = expTop;
          l.style.transform = "translate(-50%, 0)";
          l.style.opacity = "1";
          const tag = l.querySelector(".nat-layer-tag");
          if (tag) tag.style.opacity = "1";
        } else {
          // Ocultas sobre la base
          l.style.top = "54%";
          l.style.transform = "translate(-50%, -40%)";
          l.style.opacity = "0";
          const tag = l.querySelector(".nat-layer-tag");
          if (tag) tag.style.opacity = "0";
        }
      });

      if (natGuideSvg) natGuideSvg.style.opacity = "1";
      drawNaturalGuideLines();
      if (natAssembleBtnText) natAssembleBtnText.textContent = `Asentar Capa ${activeIdx + 1} en el Territorio`;
      return;
    }

    // Pasos pares (2, 4, 6, 8): Capa i asentada en el territorio simulando en el centro de la pantalla
    if (natExplodeStep % 2 === 0 && natExplodeStep <= 8) {
      const settledIdx = (natExplodeStep / 2) - 1;
      const nextNames = ["Capa 2: Vegetación", "Capa 3: Aves/Fauna", "Capa 4: Conectividad", "Ver Apilamiento Explotado Completo"];

      if (baseEl) { baseEl.style.top = "50%"; baseEl.style.opacity = "1"; baseEl.style.transform = "translate(-50%, -40%)"; }
      sublayers.forEach((l, index) => {
        if (!l) return;
        if (index === settledIdx) {
          l.style.top = "50%";
          l.style.transform = "translate(-50%, -40%)";
          l.style.opacity = "1";
          const tag = l.querySelector(".nat-layer-tag");
          if (tag) tag.style.opacity = "1";
        } else {
          l.style.top = "50%";
          l.style.transform = "translate(-50%, -40%)";
          l.style.opacity = "0";
          const tag = l.querySelector(".nat-layer-tag");
          if (tag) tag.style.opacity = "0";
        }
      });

      if (natGuideSvg) natGuideSvg.style.opacity = "0";
      if (natAssembleBtnText) natAssembleBtnText.textContent = `Extraer ${nextNames[settledIdx]}`;
      return;
    }

    if (natExplodeStep === 9) {
      // Paso 9: Apilamiento explotado completo (las 4 capas flotando apiladas)
      if (baseEl) { baseEl.style.top = "70%"; baseEl.style.opacity = "1"; baseEl.style.transform = "translate(-50%, 0)"; }
      sublayers.forEach((l) => {
        if (!l) return;
        const expTop = l.dataset.explodedTop || "54%";
        l.style.top = expTop;
        l.style.transform = "translate(-50%, 0)";
        l.style.opacity = "1";
        const tag = l.querySelector(".nat-layer-tag");
        if (tag) tag.style.opacity = "1";
      });
      tags.forEach(t => { t.style.opacity = "1"; });
      if (natGuideSvg) natGuideSvg.style.opacity = "1";
      drawNaturalGuideLines();
      if (natAssembleBtnText) natAssembleBtnText.textContent = "Integrar TODAS las capas en el Territorio";
      return;
    }

    if (natExplodeStep === 10) {
      // Paso 10: Integración Total (todas las 4 capas asentadas abajo simulando simultáneamente)
      if (baseEl) { baseEl.style.top = "50%"; baseEl.style.opacity = "1"; baseEl.style.transform = "translate(-50%, -40%)"; }
      sublayers.forEach((l) => {
        if (!l) return;
        l.style.top = "50%";
        l.style.transform = "translate(-50%, -40%)";
        l.style.opacity = "1";
        const tag = l.querySelector(".nat-layer-tag");
        if (tag) tag.style.opacity = "0";
      });
      if (natGuideSvg) natGuideSvg.style.opacity = "0";
      if (natAssembleBtnText) natAssembleBtnText.textContent = "Reiniciar Recorrido en Base";
      return;
    }
  }

  function advanceNaturalAssemble() {
    natExplodeStep++;
    if (natExplodeStep > 10) natExplodeStep = 0;
    updateNaturalLayersStep(true);
  }

  if (natAssembleBtn) natAssembleBtn.addEventListener("click", advanceNaturalAssemble);

  // Al hacer clic en el contenedor de las subcapas, avanza al siguiente paso de extracción
  const natStageEl = document.getElementById("natExplodeStage");
  if (natStageEl) {
    natStageEl.addEventListener("click", (e) => {
      advanceNaturalAssemble();
    });
  }

  function startNatWaterAnimation() {
    if (natWaterAnimFrame) cancelAnimationFrame(natWaterAnimFrame);
    function loopWater() {
      if (natOverlay.style.display !== "none") {
        natWaterTime += 0.035;
        const m = parseInt(natMesSlider.value, 10);
        renderNaturalWaterLayer(m);
        renderNaturalBirdLayer(m);
        renderNaturalMacroLayer(m);
        natWaterAnimFrame = requestAnimationFrame(loopWater);
      }
    }
    natWaterAnimFrame = requestAnimationFrame(loopWater);
  }

  function closeNaturalExplode() {
    if (!natOverlay) return;
    if (natWaterAnimFrame) { cancelAnimationFrame(natWaterAnimFrame); natWaterAnimFrame = null; }
    const sublayers = natOverlay.querySelectorAll(".nat-sublayer");
    sublayers.forEach(l => {
      l.style.opacity = "0";
      l.style.transform = "translate(-50%, -20px)";
    });
    if (natLayerContext) natLayerContext.style.opacity = "0";
    if (natYearPlaying) stopNatPlayYear();

    // Restaurar inmediatamente el viewport del 3D general
    const origW = wrap.clientWidth, origH = wrap.clientHeight;
    renderer.setSize(origW, origH, false);
    const restoreAspect = origW / origH;
    camera.left = -viewSize * restoreAspect;
    camera.right = viewSize * restoreAspect;
    camera.top = viewSize;
    camera.bottom = -viewSize;
    camera.updateProjectionMatrix();

    setTimeout(() => {
      natOverlay.style.display = "none";
      unzoomAll();
    }, 400);
  }

  if (natBackBtn) natBackBtn.addEventListener("click", closeNaturalExplode);

  // ============================================================
  // LÓGICA PARA ESCALA TECNOLÓGICA (Vías + Carros | Mapa de Ruido)
  // ============================================================
  const techOverlay = document.getElementById("techExplodeOverlay");
  const techBackBtn = document.getElementById("techExplodeBack");
  const techAssembleBtn = document.getElementById("techAssembleBtn");
  const techAssembleBtnText = document.getElementById("techAssembleBtnText");
  const techGuideSvg = document.getElementById("techGuideSvg");
  const techStageEl = document.getElementById("techExplodeStage");
  const techLayer1 = document.getElementById("techLayer1");
  const techLayer2 = document.getElementById("techLayer2");
  const techLayerBase = document.getElementById("techLayerBase");

  let techExplodeStep = 0;
  let techAnimFrame = null;
  let techTime = 0;
  
  function openTechExplode() {
    if (!techOverlay) return;

    const targetW = 960, targetH = 540;
    const layerAspect = targetW / targetH;
    
    camera.left = -viewSize * layerAspect;
    camera.right = viewSize * layerAspect;
    camera.top = viewSize;
    camera.bottom = -viewSize;
    camera.updateProjectionMatrix();
    renderer.setSize(targetW, targetH, false);
    updateCanonicalCamera();

    // Guardar estado original
    const origRoadColor = roadMat ? roadMat.color.getHex() : null;
    const origNoiseVis = noiseMesh ? noiseMesh.visible : false;
    const origBirdsVis = birdsGroup ? birdsGroup.visible : false;
    const origVehVis = vehInstanced ? vehInstanced.visible : false;
    const origVehCount = vehInstanced ? vehInstanced.count : 0;

    const origBg = scene.background;
    scene.background = new THREE.Color(0xffffff);

    // 1. CAPA BASE (Sin ruido, sin carros)
    if (noiseMesh) noiseMesh.visible = false;
    if (birdsGroup) birdsGroup.visible = false;
    if (vehInstanced) { vehInstanced.visible = false; vehInstanced.count = 0; }
    if (roadMat) roadMat.color.set(0x9099a3);

    renderer.render(scene, camera);
    const fotoBase = renderer.domElement.toDataURL("image/png");

    // Captura de CONTEXTO (camara alejada), igual que en Escala natural,
    // para que se vea el contexto de Kennedy difuminado detras del corte.
    const techContextImg = document.getElementById("techContextImg");
    const techLayerContext = document.getElementById("techLayerContext");
    if (techContextImg) {
      const contextZoomOut = 3.2;
      camera.left = -viewSize * contextZoomOut * layerAspect;
      camera.right = viewSize * contextZoomOut * layerAspect;
      camera.top = viewSize * contextZoomOut;
      camera.bottom = -viewSize * contextZoomOut;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      techContextImg.src = renderer.domElement.toDataURL("image/png");
      if (techLayerContext) techLayerContext.style.opacity = "1";
      camera.left = -viewSize * layerAspect;
      camera.right = viewSize * layerAspect;
      camera.top = viewSize;
      camera.bottom = -viewSize;
      camera.updateProjectionMatrix();
    }

    // 2. CAPA 1: VÍAS Y CARROS (Con carros, sin ruido)
    if (noiseMesh) noiseMesh.visible = false;
    if (vehInstanced) {
      vehInstanced.visible = true;
      vehInstanced.count = vehiclesAtTime(currentTime).length || 120;
    }
    if (roadMat) roadMat.color.set(0xe11d48);

    renderer.render(scene, camera);
    const fotoRoadsVeh = renderer.domElement.toDataURL("image/png");

    // 3. CAPA 2: SIMULACIÓN DE RUIDO (Con ruido, con carros)
    if (noiseMesh) noiseMesh.visible = true;
    if (roadMat) roadMat.color.set(0x7a838d);
    if (typeof computeLiveNoiseField === "function") computeLiveNoiseField(vehiclesAtTime(currentTime), performance.now() + 150);

    renderer.render(scene, camera);
    const fotoNoise = renderer.domElement.toDataURL("image/png");

    // Restaurar estado original de la escena
    scene.background = origBg;
    if (roadMat && origRoadColor !== null) roadMat.color.set(origRoadColor);
    if (noiseMesh) noiseMesh.visible = origNoiseVis;
    if (birdsGroup) birdsGroup.visible = origBirdsVis;
    if (vehInstanced) {
      vehInstanced.visible = origVehVis;
      vehInstanced.count = origVehCount;
    }

    const tBase = document.getElementById("techBaseImg"); if (tBase) tBase.src = fotoBase;
    const tRoads = document.getElementById("techRoadsVehImg"); if (tRoads) { tRoads.src = ""; tRoads.style.display = "none"; }
    const tNoise = document.getElementById("techNoiseImg"); if (tNoise) { tNoise.src = ""; tNoise.style.display = "none"; }

    techOverlay.style.display = "flex";
    void techOverlay.offsetWidth;

    techExplodeStep = 0;
    updateTechLayersStep(false);
    startTechAnimation();
  }

  function updateTechLayersStep(animated = true) {
    const sublayers = [techLayer1, techLayer2];
    const tags = techOverlay.querySelectorAll(".tech-layer-tag");

    const allDiamonds = techOverlay.querySelectorAll(".sublayer-diamond");
    allDiamonds.forEach(d => {
      const isBase = d.parentElement && d.parentElement.id === "techLayerBase";
      if (isBase) {
        d.style.background = "transparent";
        d.style.boxShadow = "none";
        d.style.borderColor = "transparent";
      } else {
        d.style.background = "rgba(255, 255, 255, 0.92)";
        d.style.border = "1.5px solid rgba(15, 23, 42, 0.35)";
        d.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.08)";
      }
    });

    if (techExplodeStep === 0) {
      if (techLayerBase) { techLayerBase.style.top = "50%"; techLayerBase.style.opacity = "1"; techLayerBase.style.transform = "translate(-50%, -40%)"; }
      sublayers.forEach(l => { if (l) { l.style.opacity = "0"; l.style.top = "50%"; l.style.transform = "translate(-50%, -40%)"; } });
      tags.forEach(t => { t.style.opacity = "0"; });
      if (techGuideSvg) techGuideSvg.style.opacity = "0";
      if (techAssembleBtnText) techAssembleBtnText.textContent = "Extraer Capa 1: Red Vial y Tráfico";
      return;
    }

    if (techExplodeStep % 2 === 1 && techExplodeStep <= 3) {
      const activeIdx = Math.floor(techExplodeStep / 2);
      if (techLayerBase) { techLayerBase.style.top = "54%"; techLayerBase.style.opacity = "1"; techLayerBase.style.transform = "translate(-50%, -40%)"; }
      sublayers.forEach((l, index) => {
        if (!l) return;
        if (index === activeIdx) {
          const expTop = l.dataset.explodedTop || "32%";
          l.style.top = expTop;
          l.style.transform = "translate(-50%, 0)";
          l.style.opacity = "1";
          const tag = l.querySelector(".tech-layer-tag");
          if (tag) tag.style.opacity = "1";
        } else {
          l.style.top = "54%";
          l.style.transform = "translate(-50%, -40%)";
          l.style.opacity = "0";
          const tag = l.querySelector(".tech-layer-tag");
          if (tag) tag.style.opacity = "0";
        }
      });
      if (techGuideSvg) techGuideSvg.style.opacity = "1";
      drawTechGuideLines();
      if (techAssembleBtnText) techAssembleBtnText.textContent = `Asentar Capa ${activeIdx + 1} en el Territorio`;
      return;
    }

    if (techExplodeStep % 2 === 0 && techExplodeStep <= 4) {
      const settledIdx = (techExplodeStep / 2) - 1;
      const nextNames = ["Capa 2: Simulación de Ruido", "Ver Apilamiento Explotado Completo"];

      if (techLayerBase) { techLayerBase.style.top = "50%"; techLayerBase.style.opacity = "1"; techLayerBase.style.transform = "translate(-50%, -40%)"; }
      sublayers.forEach((l, index) => {
        if (!l) return;
        if (index === settledIdx) {
          l.style.top = "50%";
          l.style.transform = "translate(-50%, -40%)";
          l.style.opacity = "1";
          const tag = l.querySelector(".tech-layer-tag");
          if (tag) tag.style.opacity = "1";
        } else {
          l.style.top = "50%";
          l.style.transform = "translate(-50%, -40%)";
          l.style.opacity = "0";
          const tag = l.querySelector(".tech-layer-tag");
          if (tag) tag.style.opacity = "0";
        }
      });
      if (techGuideSvg) techGuideSvg.style.opacity = "0";
      if (techAssembleBtnText) techAssembleBtnText.textContent = `Extraer ${nextNames[settledIdx]}`;
      return;
    }

    if (techExplodeStep === 5) {
      if (techLayerBase) { techLayerBase.style.top = "72%"; techLayerBase.style.opacity = "1"; techLayerBase.style.transform = "translate(-50%, 0)"; }
      sublayers.forEach((l) => {
        if (!l) return;
        const expTop = l.dataset.explodedTop || "52%";
        l.style.top = expTop;
        l.style.transform = "translate(-50%, 0)";
        l.style.opacity = "1";
        const tag = l.querySelector(".tech-layer-tag");
        if (tag) tag.style.opacity = "1";
      });
      tags.forEach(t => { t.style.opacity = "1"; });
      if (techGuideSvg) techGuideSvg.style.opacity = "1";
      drawTechGuideLines();
      if (techAssembleBtnText) techAssembleBtnText.textContent = "Integrar TODAS las capas en el Territorio";
      return;
    }

    if (techExplodeStep === 6) {
      if (techLayerBase) { techLayerBase.style.top = "50%"; techLayerBase.style.opacity = "1"; techLayerBase.style.transform = "translate(-50%, -40%)"; }
      sublayers.forEach((l) => {
        if (!l) return;
        l.style.top = "50%";
        l.style.transform = "translate(-50%, -40%)";
        l.style.opacity = "1";
        const tag = l.querySelector(".tech-layer-tag");
        if (tag) tag.style.opacity = "0";
      });
      if (techGuideSvg) techGuideSvg.style.opacity = "0";
      if (techAssembleBtnText) techAssembleBtnText.textContent = "Reiniciar Recorrido en Base";
      return;
    }
  }

  function advanceTechAssemble() {
    techExplodeStep++;
    if (techExplodeStep > 6) techExplodeStep = 0;
    updateTechLayersStep(true);
  }

  if (techAssembleBtn) techAssembleBtn.addEventListener("click", advanceTechAssemble);
  if (techStageEl) techStageEl.addEventListener("click", () => { advanceTechAssemble(); });

  function drawTechGuideLines() {
    if (!techGuideSvg || !techOverlay) return;
    techGuideSvg.innerHTML = "";
    const SVGNS = "http://www.w3.org/2000/svg";
    const layerBase = techLayerBase;
    if (!layerBase) return;

    const sublayers = [techLayer1, techLayer2];
    let layerTop = sublayers.find(l => l && parseFloat(l.style.opacity || "0") > 0.1 && (l.getBoundingClientRect().top < layerBase.getBoundingClientRect().top - 15));
    if (!layerTop) layerTop = techLayer1;

    const rTop = layerTop.getBoundingClientRect();
    const rBase = layerBase.getBoundingClientRect();
    const rStage = techGuideSvg.getBoundingClientRect();
    if (Math.abs(rTop.top - rBase.top) < 15) return;

    const cornersRel = [
      { rx: 0.5, ry: 0.0 },
      { rx: 1.0, ry: 0.5 },
      { rx: 0.5, ry: 1.0 },
      { rx: 0.0, ry: 0.5 },
    ];

    cornersRel.forEach(c => {
      const x1 = rTop.left + rTop.width * c.rx - rStage.left;
      const y1 = rTop.top + rTop.height * c.ry - rStage.top;
      const x2 = rBase.left + rBase.width * c.rx - rStage.left;
      const y2 = rBase.top + rBase.height * c.ry - rStage.top;

      const line = document.createElementNS(SVGNS, "line");
      line.setAttribute("x1", String(x1)); line.setAttribute("y1", String(y1));
      line.setAttribute("x2", String(x2)); line.setAttribute("y2", String(y2));
      line.setAttribute("stroke", "rgba(225, 29, 72, 0.35)");
      line.setAttribute("stroke-width", "1.3");
      line.setAttribute("stroke-dasharray", "4 4");
      techGuideSvg.appendChild(line);

      const dot1 = document.createElementNS(SVGNS, "circle");
      dot1.setAttribute("cx", String(x1)); dot1.setAttribute("cy", String(y1)); dot1.setAttribute("r", "2.5");
      dot1.setAttribute("fill", "rgba(225, 29, 72, 0.5)");
      techGuideSvg.appendChild(dot1);

      const dot2 = document.createElementNS(SVGNS, "circle");
      dot2.setAttribute("cx", String(x2)); dot2.setAttribute("cy", String(y2)); dot2.setAttribute("r", "2.5");
      dot2.setAttribute("fill", "rgba(225, 29, 72, 0.5)");
      techGuideSvg.appendChild(dot2);
    });
  }

  function startTechAnimation() {
    if (techAnimFrame) cancelAnimationFrame(techAnimFrame);
  }

  function closeTechExplode() {
    if (!techOverlay) return;
    if (techAnimFrame) { cancelAnimationFrame(techAnimFrame); techAnimFrame = null; }
    
    const sublayers = techOverlay.querySelectorAll(".tech-sublayer");
    sublayers.forEach(l => {
      l.style.opacity = "0";
      l.style.transform = "translate(-50%, -20px)";
    });
    const techLayerContext2 = document.getElementById("techLayerContext");
    if (techLayerContext2) techLayerContext2.style.opacity = "0";

    const origW = wrap.clientWidth, origH = wrap.clientHeight;
    renderer.setSize(origW, origH, false);
    const restoreAspect = origW / origH;
    camera.left = -viewSize * restoreAspect;
    camera.right = viewSize * restoreAspect;
    camera.top = viewSize;
    camera.bottom = -viewSize;
    camera.updateProjectionMatrix();

    setTimeout(() => {
      techOverlay.style.display = "none";
      unzoomAll();
    }, 400);
  }

  if (techBackBtn) techBackBtn.addEventListener("click", closeTechExplode);

  // ============================================================
  // CAPA 1: Sistema Inerte y Límite Físico-Hidrológico
  // Fluctuación 0,2 ha a 6,69 ha, espejo hídrico realista pizarra/turquesa profundo, nodo más hondo, Ronda Hidráulica 30m, ZMPA y escorrentías
  // ============================================================
  function renderNaturalWaterLayer(mesNum) {
    if (!natWaterCanvas || !rawWaterData) return;
    const info = HUMEDAL_CICLO[mesNum - 1] || HUMEDAL_CICLO[3];
    natMesLabel.textContent = MESES_NAT[mesNum - 1];
    natFloodStats.innerHTML = `Espejo hídrico: <strong style="color:#0369a1">+${info.expansion_pct.toFixed(1)}%</strong> · Nivel freático: <strong style="color:#0369a1">${info.profundidad_m.toFixed(2)} m</strong> · <span style="color:#475569;">${info.temporada}</span>`;

    const rect = natWaterCanvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = rect.width, h = rect.height;
    if (natWaterCanvas.width !== Math.round(w * dpr) || natWaterCanvas.height !== Math.round(h * dpr)) {
      natWaterCanvas.width = Math.round(w * dpr);
      natWaterCanvas.height = Math.round(h * dpr);
    }
    const ctx = natWaterCanvas.getContext("2d");
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const projectPoint = (rx, ry, el = 0.05) => projectPointToLayer(rx, ry, el, w, h);

    const burro = rawWaterData.find(b => (b.nombre || "").includes("Burro"));
    const expansionFactor = 1 + (info.expansion_pct / 100) * 0.55;

    // 1. ZMPA y Ronda Hidráulica (RH 30m) - Dibujo técnico arquitectónico
    if (burro && burro.pts && burro.pts.length > 3) {
      const cx = burro.pts.reduce((s, p) => s + p[0], 0) / burro.pts.length;
      const cy = burro.pts.reduce((s, p) => s + p[1], 0) / burro.pts.length;

      // ZMPA (Zona de Manejo y Preservación Ambiental) - Trama sutil gris azulado
      const zmpaPts = burro.pts.map(p => [cx + (p[0] - cx) * 1.52, cy + (p[1] - cy) * 1.52]);
      const scrZmpa = zmpaPts.map(p => projectPoint(p[0], p[1]));
      ctx.beginPath();
      ctx.moveTo(scrZmpa[0].x, scrZmpa[0].y);
      for (let i = 1; i < scrZmpa.length; i++) ctx.lineTo(scrZmpa[i].x, scrZmpa[i].y);
      ctx.closePath();
      ctx.fillStyle = "rgba(224, 231, 239, 0.40)";
      ctx.fill();
      ctx.lineWidth = 1.0;
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = "rgba(71, 85, 105, 0.45)";
      ctx.stroke();
      ctx.setLineDash([]);

      // Ronda Hidráulica RH 30m - Trazo continuo sobrio
      const rhPts = burro.pts.map(p => [cx + (p[0] - cx) * 1.25, cy + (p[1] - cy) * 1.25]);
      const scrRh = rhPts.map(p => projectPoint(p[0], p[1]));
      ctx.beginPath();
      ctx.moveTo(scrRh[0].x, scrRh[0].y);
      for (let i = 1; i < scrRh.length; i++) ctx.lineTo(scrRh[i].x, scrRh[i].y);
      ctx.closePath();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "rgba(51, 65, 85, 0.65)";
      ctx.stroke();
    }

    // 2. Cuerpos de agua (Humedal y afluentes) - Azul pizarra / mineral realista con reflejos tenues
    rawWaterData.forEach(body => {
      const isBurro = body === burro;
      let pts = body.pts;
      if (isBurro) {
        const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
        const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
        pts = pts.map(p => [cx + (p[0] - cx) * expansionFactor, cy + (p[1] - cy) * expansionFactor]);
      }

      const scrPts = pts.map(p => projectPoint(p[0], p[1]));
      if (scrPts.length < 3) return;

      ctx.beginPath();
      ctx.moveTo(scrPts[0].x, scrPts[0].y);
      for (let i = 1; i < scrPts.length; i++) ctx.lineTo(scrPts[i].x, scrPts[i].y);
      ctx.closePath();

      if (isBurro) {
        // Degradado de espejo de agua profundo realista (azul pizarra grisáceo a azul cerúleo profundo)
        const waveX = Math.sin(natWaterTime * 0.5) * 20;
        const waveY = Math.cos(natWaterTime * 0.4) * 15;
        const grad = ctx.createLinearGradient(waveX, waveY, w * 0.8 + waveX, h * 0.8 + waveY);
        grad.addColorStop(0, "rgba(56, 96, 126, 0.88)");
        grad.addColorStop(0.5, "rgba(40, 78, 107, 0.92)");
        grad.addColorStop(1, "rgba(28, 59, 83, 0.95)");
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = "rgba(15, 23, 42, 0.85)";
        ctx.stroke();

        // Ondas de superficie sutiles con tono agua sedosa
        for (let ring = 1; ring <= 3; ring++) {
          const rOffset = ((natWaterTime * 10 + ring * 22) % 80);
          const rAlpha = Math.max(0, 1 - rOffset / 80) * 0.25;
          const centerSO = projectPoint(7518.49, 3137.57);
          if (centerSO.inFront) {
            ctx.beginPath();
            ctx.ellipse(centerSO.x, centerSO.y, rOffset * 1.5, rOffset * 0.8, -0.32, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(186, 230, 253, ${rAlpha})`;
            ctx.lineWidth = 1.8;
            ctx.stroke();
          }
        }
      } else {
        ctx.fillStyle = "rgba(71, 85, 105, 0.7)";
        ctx.fill();
        ctx.lineWidth = 1.0;
      }
    });

    // Punto más hondo: [7518.49, 3137.57]
    const hondoPt = projectPoint(7518.49, 3137.57);

    // SVG: Anotaciones de Capa 1 y Escorrentías subterráneas hacia Humedal La Vaca
    if (natWaterSvg) {
      natWaterSvg.innerHTML = "";
      const SVGNS = "http://www.w3.org/2000/svg";

      // Nodo cota más profunda
      if (hondoPt.inFront) {
        const g = document.createElementNS(SVGNS, "g");
        g.setAttribute("transform", `translate(${hondoPt.x}, ${hondoPt.y})`);

        const ring = document.createElementNS(SVGNS, "circle");
        ring.setAttribute("r", (10 + Math.sin(natWaterTime * 2.5) * 2.5).toFixed(1));
        ring.setAttribute("fill", "none");
        ring.setAttribute("stroke", "#334155");
        ring.setAttribute("stroke-width", "1.2");
        ring.setAttribute("stroke-dasharray", "2 2");
        g.appendChild(ring);

        const dot = document.createElementNS(SVGNS, "circle");
        dot.setAttribute("r", "4");
        dot.setAttribute("fill", "#0f172a");
        dot.setAttribute("stroke", "#ffffff");
        dot.setAttribute("stroke-width", "1.5");
        g.appendChild(dot);

        // Directriz técnica fina
        const line = document.createElementNS(SVGNS, "polyline");
        line.setAttribute("points", "0,0 18,-18 105,-18");
        line.setAttribute("fill", "none");
        line.setAttribute("stroke", "#475569");
        line.setAttribute("stroke-width", "1.1");
        g.appendChild(line);

        // Tarjeta técnica arquitectónica sobria
        const bg = document.createElementNS(SVGNS, "rect");
        bg.setAttribute("x", "18"); bg.setAttribute("y", "-32");
        bg.setAttribute("width", "160"); bg.setAttribute("height", "26");
        bg.setAttribute("rx", "3"); bg.setAttribute("fill", "rgba(255,255,255,0.96)");
        bg.setAttribute("stroke", "#cbd5e1"); bg.setAttribute("stroke-width", "1");
        g.appendChild(bg);

        const txt = document.createElementNS(SVGNS, "text");
        txt.setAttribute("x", "24"); txt.setAttribute("y", "-20");
        txt.setAttribute("font-family", "'Segoe UI', sans-serif");
        txt.setAttribute("font-size", "9.5px"); txt.setAttribute("font-weight", "700");
        txt.setAttribute("fill", "#0f172a");
        txt.textContent = "Nodo Central de Depresión Hídrica";
        g.appendChild(txt);

        const sub = document.createElementNS(SVGNS, "text");
        sub.setAttribute("x", "24"); sub.setAttribute("y", "-10");
        sub.setAttribute("font-family", "'Segoe UI', sans-serif");
        sub.setAttribute("font-size", "8px"); sub.setAttribute("font-weight", "600");
        sub.setAttribute("fill", "#475569");
        sub.textContent = `Sector Suroriental · Prof. ${info.profundidad_m.toFixed(2)} m`;
        g.appendChild(sub);

        natWaterSvg.appendChild(g);
      }

      // 3. Escorrentía subterránea hacia Humedal La Vaca (infiltración y flujo freático)
      const subFlujoPts = [
        [7480, 3180],
        [7250, 3350],
        [6980, 3550],
        [6700, 3750] // Hacia Humedal La Vaca
      ];
      const scrSub = subFlujoPts.map(p => projectPoint(p[0], p[1]));
      if (scrSub.length >= 3 && scrSub[0].inFront) {
        let d = `M ${scrSub[0].x} ${scrSub[0].y}`;
        for (let i = 1; i < scrSub.length; i++) d += ` L ${scrSub[i].x} ${scrSub[i].y}`;

        const subPath = document.createElementNS(SVGNS, "path");
        subPath.setAttribute("d", d);
        subPath.setAttribute("fill", "none");
        subPath.setAttribute("stroke", "#475569");
        subPath.setAttribute("stroke-width", "1.6");
        subPath.setAttribute("stroke-dasharray", "3 4");
        subPath.setAttribute("stroke-dashoffset", String((-natWaterTime * 12) % 18));
        natWaterSvg.appendChild(subPath);

        const subLbl = document.createElementNS(SVGNS, "text");
        subLbl.setAttribute("x", String((scrSub[1].x + scrSub[2].x) / 2));
        subLbl.setAttribute("y", String((scrSub[1].y + scrSub[2].y) / 2 - 6));
        subLbl.setAttribute("font-family", "'Segoe UI', sans-serif");
        subLbl.setAttribute("font-size", "8.5px");
        subLbl.setAttribute("font-weight", "700");
        subLbl.setAttribute("fill", "#334155");
        subLbl.textContent = "Gradiente freático → H. La Vaca";
        natWaterSvg.appendChild(subLbl);
      }

      // 4. SUBCUENCA EL TINTAL: Afluentes y canales
      const flowCorridors = [
        {
          name: "Río Fucha → C. Los Ángeles de Castilla",
          pts: [
            [8308.3, 2562.3],
            [8180.0, 2589.2],
            [7978.3, 2669.2],
            [7833.3, 2778.2],
            [7738.4, 2839.9],
            [7598.2, 2966.1],
            [7588.3, 2974.2]
          ],
          color: "#334155"
        },
        {
          name: "Cuenca Río Fucha → Canal Castilla",
          pts: [
            [6367.3, 4677.7],
            [6390.1, 4631.6],
            [6505.9, 4446.9],
            [6604.7, 4286.1],
            [6733.5, 4076.6],
            [6820.7, 3942.2],
            [6983.1, 3865.5],
            [7080.0, 3750.0]
          ],
          color: "#475569"
        },
        {
          name: "Río Tunjuelo & Río Bogotá → Canal Américas",
          pts: [
            [5497.5, 4670.4],
            [5556.4, 4581.7],
            [5737.0, 4386.5],
            [6104.6, 3975.6],
            [6419.8, 3631.9],
            [6572.5, 3453.6],
            [6658.1, 3306.9],
            [7020.0, 3360.0]
          ],
          color: "#334155"
        }
      ];

      flowCorridors.forEach(corr => {
        const screenPts = corr.pts.map(p => projectPoint(p[0], p[1]));
        if (screenPts.length >= 3 && screenPts[0].inFront && screenPts[screenPts.length - 1].inFront) {
          const flowG = document.createElementNS(SVGNS, "g");
          let pathD = `M ${screenPts[0].x} ${screenPts[0].y}`;
          for (let pi = 1; pi < screenPts.length; pi++) pathD += ` L ${screenPts[pi].x} ${screenPts[pi].y}`;

          const flowBg = document.createElementNS(SVGNS, "path");
          flowBg.setAttribute("d", pathD);
          flowBg.setAttribute("fill", "none");
          flowBg.setAttribute("stroke", "rgba(255,255,255,0.85)");
          flowBg.setAttribute("stroke-width", "3.6");
          flowG.appendChild(flowBg);

          const flowPath = document.createElementNS(SVGNS, "path");
          flowPath.setAttribute("d", pathD);
          flowPath.setAttribute("fill", "none");
          flowPath.setAttribute("stroke", corr.color);
          flowPath.setAttribute("stroke-width", "2.0");
          flowPath.setAttribute("stroke-dasharray", "6 4");
          const dashOffset = (natWaterTime * 18) % 20;
          flowPath.setAttribute("stroke-dashoffset", (-dashOffset).toFixed(1));
          flowG.appendChild(flowPath);

          const pStart = screenPts[0];
          const startDot = document.createElementNS(SVGNS, "circle");
          startDot.setAttribute("cx", String(pStart.x));
          startDot.setAttribute("cy", String(pStart.y));
          startDot.setAttribute("r", "3.5");
          startDot.setAttribute("fill", corr.color);
          startDot.setAttribute("stroke", "#ffffff");
          startDot.setAttribute("stroke-width", "1.5");
          flowG.appendChild(startDot);

          const pEnd = screenPts[screenPts.length - 1], pPrev = screenPts[screenPts.length - 2];
          const angle = Math.atan2(pEnd.y - pPrev.y, pEnd.x - pPrev.x);
          const arrowLen = 9;
          const x1 = pEnd.x - arrowLen * Math.cos(angle - Math.PI / 6);
          const y1 = pEnd.y - arrowLen * Math.sin(angle - Math.PI / 6);
          const x2 = pEnd.x - arrowLen * Math.cos(angle + Math.PI / 6);
          const y2 = pEnd.y - arrowLen * Math.sin(angle + Math.PI / 6);
          const arrow = document.createElementNS(SVGNS, "polygon");
          arrow.setAttribute("points", `${pEnd.x},${pEnd.y} ${x1},${y1} ${x2},${y2}`);
          arrow.setAttribute("fill", corr.color);
          flowG.appendChild(arrow);

          const midIdx = Math.floor(screenPts.length / 2);
          const pLabel = screenPts[midIdx] || screenPts[0];
          const labelG = document.createElementNS(SVGNS, "g");
          const offsetX = pLabel.x > w * 0.5 ? -145 : 10;
          const offsetY = pLabel.y < 50 ? 20 : -10;
          labelG.setAttribute("transform", `translate(${pLabel.x + offsetX}, ${pLabel.y + offsetY})`);

          const textWidth = corr.name.length * 5.8 + 14;
          const rectBg = document.createElementNS(SVGNS, "rect");
          rectBg.setAttribute("x", "-3");
          rectBg.setAttribute("y", "-12");
          rectBg.setAttribute("width", String(textWidth));
          rectBg.setAttribute("height", "16");
          rectBg.setAttribute("rx", "3");
          rectBg.setAttribute("fill", "rgba(255,255,255,0.95)");
          rectBg.setAttribute("stroke", "#cbd5e1");
          rectBg.setAttribute("stroke-width", "1");
          labelG.appendChild(rectBg);

          const label = document.createElementNS(SVGNS, "text");
          label.setAttribute("x", "4");
          label.setAttribute("y", "0");
          label.setAttribute("font-family", "'Segoe UI', sans-serif");
          label.setAttribute("font-size", "9px");
          label.setAttribute("font-weight", "700");
          label.setAttribute("fill", "#1e293b");
          label.textContent = corr.name;
          labelG.appendChild(label);

          flowG.appendChild(labelG);
          natWaterSvg.appendChild(flowG);
        }
      });
    }
  }

  // ============================================================
  // CAPA 2: Estratificación Vegetal y Cobertura Florística
  // Tonos realistas: Verde salvia, verde oliva desaturado, ocre terroso para Typha y copas de árboles con volumen sombreado
  // ============================================================
  function renderNaturalVegLayer(mesNum) {
    if (!natVegCanvas) return;
    const rect = natVegCanvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = rect.width || 720, h = rect.height || 405;
    if (natVegCanvas.width !== Math.round(w * dpr) || natVegCanvas.height !== Math.round(h * dpr)) {
      natVegCanvas.width = Math.round(w * dpr);
      natVegCanvas.height = Math.round(h * dpr);
    }
    const ctx = natVegCanvas.getContext("2d");
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const projectPoint = (rx, ry, el = 0.05) => projectPointToLayer(rx, ry, el, w, h);
    const info = HUMEDAL_CICLO[(mesNum || 4) - 1] || HUMEDAL_CICLO[3];
    const isDrySeason = info.profundidad_m < 1.1;
    const typhaAdvance = isDrySeason ? 0.88 : 1.08;

    // 1. Zonas verdes y parques generales - Verde oliva salvia suave
    if (rawParquesData && rawParquesData.length) {
      rawParquesData.forEach(p => {
        if (!p.pts || p.pts.length < 3) return;
        const scrPts = p.pts.map(pt => projectPoint(pt[0], pt[1]));
        if (scrPts.every(pt => !pt.inFront)) return;

        ctx.beginPath();
        ctx.moveTo(scrPts[0].x, scrPts[0].y);
        for (let i = 1; i < scrPts.length; i++) ctx.lineTo(scrPts[i].x, scrPts[i].y);
        ctx.closePath();
        ctx.fillStyle = "rgba(164, 180, 148, 0.40)"; // Verde salvia suave desaturado
        ctx.fill();
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = "rgba(110, 130, 95, 0.50)";
        ctx.stroke();
      });
    }

    // 2. Zonificación florística alrededor del Humedal El Burro
    if (rawWaterData) {
      const burro = rawWaterData.find(b => (b.nombre || "").includes("Burro"));
      if (burro && burro.pts && burro.pts.length > 3) {
        const cx = burro.pts.reduce((s, p) => s + p[0], 0) / burro.pts.length;
        const cy = burro.pts.reduce((s, p) => s + p[1], 0) / burro.pts.length;

        // Franja terrestre ZMPA 12,14 ha: chilco, tinto, alisos - Verde bosque agrisado
        const zmpaVegPts = burro.pts.map(p => [cx + (p[0] - cx) * 1.45, cy + (p[1] - cy) * 1.45]);
        const scrZmpa = zmpaVegPts.map(p => projectPoint(p[0], p[1]));
        ctx.beginPath();
        ctx.moveTo(scrZmpa[0].x, scrZmpa[0].y);
        for (let i = 1; i < scrZmpa.length; i++) ctx.lineTo(scrZmpa[i].x, scrZmpa[i].y);
        ctx.closePath();
        ctx.fillStyle = "rgba(128, 148, 114, 0.35)";
        ctx.fill();
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = "rgba(82, 102, 70, 0.55)";
        ctx.stroke();

        // Franja invasiva de Typha angustifolia (Eneas) y gramíneas - Ocre pajizo / verde junco
        const typhaPts = burro.pts.map(p => [cx + (p[0] - cx) * typhaAdvance, cy + (p[1] - cy) * typhaAdvance]);
        const scrTypha = typhaPts.map(p => projectPoint(p[0], p[1]));
        ctx.beginPath();
        ctx.moveTo(scrTypha[0].x, scrTypha[0].y);
        for (let i = 1; i < scrTypha.length; i++) ctx.lineTo(scrTypha[i].x, scrTypha[i].y);
        ctx.closePath();
        // Color realista: en estiaje ocre terroso apagado, en lluvia verde caña junco
        ctx.fillStyle = isDrySeason ? "rgba(175, 143, 90, 0.40)" : "rgba(138, 154, 106, 0.35)";
        ctx.fill();
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = isDrySeason ? "rgba(140, 110, 65, 0.65)" : "rgba(95, 115, 75, 0.65)";
        ctx.stroke();
      }
    }

    // 3. Árboles georreferenciados - Copas con sombreado de copa realista (no bolas fluorescentes)
    if (treeMeshes && treeMeshes[0] && treeMeshes[0].data) {
      const trees = treeMeshes[0].data;
      const localTrees = trees.filter(t => t[0] >= 6700 && t[0] <= 8100 && t[1] >= 2600 && t[1] <= 4250);
      localTrees.forEach(t => {
        const [x, y, hMeters, especie] = t;
        const pt = projectPoint(x, y);
        if (!pt.inFront || pt.x < -20 || pt.x > w + 20 || pt.y < -20 || pt.y > h + 20) return;
        const r = Math.max(2.5, Math.min(5.5, (hMeters || 6) * 0.45));
        const esp = especie || "";

        // Sombra arrojada tenue
        ctx.beginPath();
        ctx.ellipse(pt.x + 1.2, pt.y + 1.2, r * 1.1, r * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.fill();

        // Copa del árbol en tonos naturales sobrios
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        if (esp.includes("Sauco") || esp.includes("Aliso")) {
          ctx.fillStyle = "#557a55"; // Verde aliso cenizo
        } else if (esp.includes("Chilco") || esp.includes("Tinto")) {
          ctx.fillStyle = "#4a684b"; // Matorral nativo sobrio
        } else {
          ctx.fillStyle = "#5d7356"; // Arbóreo estándar
        }
        ctx.fill();
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.stroke();
      });
    }

    // Anotación en SVG técnica
    if (natVegSvg) {
      natVegSvg.innerHTML = "";
      const SVGNS = "http://www.w3.org/2000/svg";
      const tagPt = projectPoint(7420, 3350);
      if (tagPt.inFront) {
        const g = document.createElementNS(SVGNS, "g");
        g.setAttribute("transform", `translate(${tagPt.x}, ${tagPt.y})`);

        const line = document.createElementNS(SVGNS, "polyline");
        line.setAttribute("points", "0,0 18,-18 115,-18");
        line.setAttribute("fill", "none");
        line.setAttribute("stroke", "#475569");
        line.setAttribute("stroke-width", "1.1");
        g.appendChild(line);

        const bg = document.createElementNS(SVGNS, "rect");
        bg.setAttribute("x", "18"); bg.setAttribute("y", "-32");
        bg.setAttribute("width", "175"); bg.setAttribute("height", "26");
        bg.setAttribute("rx", "3"); bg.setAttribute("fill", "rgba(255,255,255,0.96)");
        bg.setAttribute("stroke", "#cbd5e1"); bg.setAttribute("stroke-width", "1");
        g.appendChild(bg);

        const txt = document.createElementNS(SVGNS, "text");
        txt.setAttribute("x", "24"); txt.setAttribute("y", "-20");
        txt.setAttribute("font-family", "'Segoe UI', sans-serif");
        txt.setAttribute("font-size", "9.5px"); txt.setAttribute("font-weight", "700");
        txt.setAttribute("fill", "#1e293b");
        txt.textContent = isDrySeason ? "Avance de Especies Invasoras" : "Inundación Frena Invasión";
        g.appendChild(txt);

        const sub = document.createElementNS(SVGNS, "text");
        sub.setAttribute("x", "24"); sub.setAttribute("y", "-10");
        sub.setAttribute("font-family", "'Segoe UI', sans-serif");
        sub.setAttribute("font-size", "8px"); sub.setAttribute("font-weight", "600");
        sub.setAttribute("fill", "#64748b");
        sub.textContent = isDrySeason ? "Najas y pasto Kikuyo ocupan el lecho seco" : "El nivel hídrico cubre temporalmente el avance";
        g.appendChild(sub);

        natVegSvg.appendChild(g);
      }
    }
  }

  // ============================================================
  // CAPA 3: Nichos Ecológicos & Dinámicas Estacionales de Aves (Comunidades Bióticas)
  // Explica con claridad cartográfica cómo el nivel del agua define los hábitats
  // ============================================================
  
  // Variables para sprites de aves
  const birdSprites = {
    duck: new Image(),
    heron: new Image(),
    duckReady: false,
    heronReady: false
  };

  function processBirdImage(img, key) {
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    const idata = x.getImageData(0, 0, c.width, c.height);
    const d = idata.data;
    for (let i = 0; i < d.length; i += 4) {
      // Remove white/light background
      if (d[i] > 230 && d[i+1] > 230 && d[i+2] > 230) {
        d[i+3] = 0; // Transparent
      }
    }
    x.putImageData(idata, 0, 0);
    birdSprites[key] = c;
    birdSprites[key + 'Ready'] = true;
  }

  birdSprites.duck.onload = () => processBirdImage(birdSprites.duck, 'duckProcessed');
  birdSprites.duck.src = "assets/pato.png";
  
  birdSprites.heron.onload = () => processBirdImage(birdSprites.heron, 'heronProcessed');
  birdSprites.heron.src = "assets/garza.png";

  function renderNaturalBirdLayer(mesNum) {
    if (!natBirdCanvas || !rawWaterData) return;
    const rect = natBirdCanvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = rect.width || 720, h = rect.height || 405;
    if (natBirdCanvas.width !== Math.round(w * dpr) || natBirdCanvas.height !== Math.round(h * dpr)) {
      natBirdCanvas.width = Math.round(w * dpr);
      natBirdCanvas.height = Math.round(h * dpr);
    }
    const ctx = natBirdCanvas.getContext("2d");
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const projectPoint = (rx, ry, el = 0.05) => projectPointToLayer(rx, ry, el, w, h);
    const realMesNum = mesNum || 4;
    const info = HUMEDAL_CICLO[realMesNum - 1] || HUMEDAL_CICLO[3];
    
    // Meses de lluvia: 3, 4, 5, 10, 11
    const isRainy = [3, 4, 5, 10, 11].includes(realMesNum);
    // Meses boreales: 9, 10
    const isBoreal = [9, 10].includes(realMesNum);
    // Meses secos: 1, 2, 3, 6, 7, 8
    const isDry = !isRainy;

    const burro = rawWaterData.find(b => (b.nombre || "").includes("Burro"));
    if (!burro || !burro.pts || burro.pts.length < 4) return;

    const cx = burro.pts.reduce((s, p) => s + p[0], 0) / burro.pts.length;
    const cy = burro.pts.reduce((s, p) => s + p[1], 0) / burro.pts.length;

    // 1. DIBUJAR LAS ZONAS DE HÁBITAT (Zonificación de fondo clara)
    // A) Franja litoral / Juncal de anidación perimetral
    const juncosPts = burro.pts.map(p => [cx + (p[0] - cx) * 1.32, cy + (p[1] - cy) * 1.32]);
    const scrJuncos = juncosPts.map(p => projectPoint(p[0], p[1]));
    ctx.beginPath();
    ctx.moveTo(scrJuncos[0].x, scrJuncos[0].y);
    for (let i = 1; i < scrJuncos.length; i++) ctx.lineTo(scrJuncos[i].x, scrJuncos[i].y);
    ctx.closePath();
    ctx.fillStyle = "rgba(180, 195, 165, 0.35)"; // Franja vegetal litoral
    ctx.fill();
    ctx.lineWidth = 1.0;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#64748b";
    ctx.stroke();
    ctx.setLineDash([]);

    // B) Espejo de agua central / Playón estacional según temporada
    const expFactor = isRainy ? 1.15 : 0.82;
    const waterPts = burro.pts.map(p => [cx + (p[0] - cx) * expFactor, cy + (p[1] - cy) * expFactor]);
    const scrWater = waterPts.map(p => projectPoint(p[0], p[1]));
    ctx.beginPath();
    ctx.moveTo(scrWater[0].x, scrWater[0].y);
    for (let i = 1; i < scrWater.length; i++) ctx.lineTo(scrWater[i].x, scrWater[i].y);
    ctx.closePath();
    if (isRainy) {
      ctx.fillStyle = "rgba(64, 100, 126, 0.45)"; // Lámina profunda de agua
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "#334155";
      ctx.stroke();
    } else {
      // En verano: playón limoso expuesto alrededor del agua remanente
      ctx.fillStyle = "rgba(188, 160, 120, 0.45)"; // Playón de barro/limo
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "#92683b";
      ctx.stroke();

      // Espejo interior reducido
      const innerPts = burro.pts.map(p => [cx + (p[0] - cx) * 0.45, cy + (p[1] - cy) * 0.45]);
      const scrInner = innerPts.map(p => projectPoint(p[0], p[1]));
      ctx.beginPath();
      ctx.moveTo(scrInner[0].x, scrInner[0].y);
      for (let i = 1; i < scrInner.length; i++) ctx.lineTo(scrInner[i].x, scrInner[i].y);
      ctx.closePath();
      ctx.fillStyle = "rgba(64, 100, 126, 0.55)";
      ctx.fill();
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = "#334155";
      ctx.stroke();
    }

    // 2. AGENTES Y SILUETAS BIOLÓGICAS CLARAMENTE DISTINGUIBLES
    const centerSO = projectPoint(7518.49, 3137.57);
    // Función auxiliar para dibujar un sprite de pájaro
    function drawBirdSprite(spriteKey, x, y, width, height, isFlipped = false) {
      if (birdSprites[spriteKey + 'Ready']) {
        ctx.save();
        ctx.translate(x, y);
        if (isFlipped) ctx.scale(-1, 1);
        ctx.drawImage(birdSprites[spriteKey], -width/2, -height/2, width, height);
        ctx.restore();
      }
    }

    if (isRainy) {
      // --- LLUVIAS (Garzas) ---
      // Entran volando desde el Oriente (derecha) hacia el centro
      for (let g = 0; g < 6; g++) {
        const flightProg = ((natWaterTime * 0.2 + g * 0.3) % 1.0);
        const startX = w + 50 + g * 20;
        const startY = centerSO.y - 100 + g * 15;
        const ang = (g / 6) * Math.PI * 2;
        const rad = 25;
        const destX = centerSO.x + Math.cos(ang) * rad;
        const destY = centerSO.y + Math.sin(ang) * rad * 0.5;

        let bx, by;
        if (flightProg < 0.4) {
          const t = flightProg / 0.4;
          bx = startX + (destX - startX) * t;
          by = startY + (destY - startY) * t;
          by += Math.sin(natWaterTime * 15 + g) * 5;
        } else {
          bx = destX + Math.cos(natWaterTime * 0.5 + g) * 5;
          by = destY + Math.sin(natWaterTime * 0.5 + g) * 3;
          ctx.beginPath();
          ctx.ellipse(bx, by + 12, 6, 2, 0, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0,0,0,0.2)";
          ctx.fill();
        }
        drawBirdSprite('heronProcessed', bx, by, 35, 35, bx > centerSO.x);
      }
      
      // Tinguas residentes desplazadas a la orilla (refugiadas)
      for (let t = 0; t < 5; t++) {
        const ang = (t / 5) * Math.PI * 2;
        const tx = centerSO.x + Math.cos(ang) * 65;
        const ty = centerSO.y + Math.sin(ang) * 45;
        ctx.beginPath();
        ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#1e3a8a";
        ctx.fill();
      }
    } else {
      // --- SECO (Patos) ---
      for (let p = 0; p < 8; p++) {
        const ang = (p / 8) * Math.PI * 2 + natWaterTime * 0.05;
        const rad = 45 + Math.sin(natWaterTime * 0.8 + p) * 15;
        const px = centerSO.x + Math.cos(ang) * rad;
        const py = centerSO.y + Math.sin(ang) * rad * 0.6;
        ctx.beginPath();
        ctx.ellipse(px, py + 8, 5, 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fill();
        drawBirdSprite('duckProcessed', px, py, 22, 22, (Math.cos(ang) > 0));
      }
      for (let t = 0; t < 5; t++) {
        const ang = (t / 5) * Math.PI * 2 + natWaterTime * -0.1;
        const tx = centerSO.x + Math.cos(ang) * 20;
        const ty = centerSO.y + Math.sin(ang) * 15;
        ctx.beginPath();
        ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#1e3a8a";
        ctx.fill();
      }
    }

    if (isBoreal) {
      for (let b = 0; b < 10; b++) {
        const prog = ((natWaterTime * 0.4 + b * 0.1) % 1.0);
        const startX = centerSO.x - 100 + b * 30;
        const startY = -50;
        const ang = (b / 10) * Math.PI * 2;
        const destX = centerSO.x + Math.cos(ang) * 35;
        const destY = centerSO.y + Math.sin(ang) * 25;
        let bx, by;
        if (prog < 0.3) {
          const t = prog / 0.3;
          bx = startX + (destX - startX) * t;
          by = startY + (destY - startY) * t;
          by += Math.sin(natWaterTime * 20 + b) * 8;
        } else {
          bx = destX + Math.cos(natWaterTime * 0.8 + b) * 10;
          by = destY + Math.sin(natWaterTime * 0.8 + b) * 5;
        }
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#78716c";
        ctx.fill();
      }
    }

    // 3. CARTOGRAFÍA Y LEYENDA TÉCNICA VISIBLE DIRECTAMENTE EN LA CAPA
    if (natBirdSvg) {
      natBirdSvg.innerHTML = "";
      const SVGNS = "http://www.w3.org/2000/svg";

      const legG = document.createElementNS(SVGNS, "g");
      legG.setAttribute("transform", "translate(16, 16)");

      const legBg = document.createElementNS(SVGNS, "rect");
      legBg.setAttribute("x", "0"); legBg.setAttribute("y", "0");
      legBg.setAttribute("width", "300"); legBg.setAttribute("height", "58");
      legBg.setAttribute("rx", "4"); legBg.setAttribute("fill", "rgba(255,255,255,0.96)");
      legBg.setAttribute("stroke", "#cbd5e1"); legBg.setAttribute("stroke-width", "1");
      legG.appendChild(legBg);

      const t1 = document.createElementNS(SVGNS, "text");
      t1.setAttribute("x", "10"); t1.setAttribute("y", "15");
      t1.setAttribute("font-family", "'Segoe UI', sans-serif");
      t1.setAttribute("font-size", "10px"); t1.setAttribute("font-weight", "800");
      t1.setAttribute("fill", "#0f172a");
      let title = "DINÁMICA ESTIAJE (VERANO)";
      if (isRainy) title = "DINÁMICA AGUAS ALTAS (LLUVIAS)";
      if (isBoreal) title = "MIGRACIÓN BOREAL (SEP - OCT)";
      t1.textContent = title;
      legG.appendChild(t1);

      // Fila 1 leyenda
      const ic1 = document.createElementNS(SVGNS, "circle");
      ic1.setAttribute("cx", "16"); ic1.setAttribute("cy", "29"); ic1.setAttribute("r", "4");
      ic1.setAttribute("fill", isRainy ? "#ffffff" : (isBoreal ? "#78716c" : "#855835"));
      ic1.setAttribute("stroke", isRainy ? "#0f172a" : "#fef3c7");
      ic1.setAttribute("stroke-width", "1");
      legG.appendChild(ic1);

      const tx1 = document.createElementNS(SVGNS, "text");
      tx1.setAttribute("x", "26"); tx1.setAttribute("y", "32");
      tx1.setAttribute("font-family", "'Segoe UI', sans-serif");
      tx1.setAttribute("font-size", "8.5px"); tx1.setAttribute("font-weight", "600");
      tx1.setAttribute("fill", "#334155");
      let desc1 = "Patos y Zambullidores en lodo expuesto";
      if (isRainy) desc1 = "Garzas Reales llegan desde Llanos Orientales";
      if (isBoreal) desc1 = "Chorlos y Reinitas migran desde el Norte";
      tx1.textContent = desc1;
      legG.appendChild(tx1);

      // Fila 2 leyenda
      const ic2 = document.createElementNS(SVGNS, "circle");
      ic2.setAttribute("cx", "16"); ic2.setAttribute("cy", "46"); ic2.setAttribute("r", "4");
      ic2.setAttribute("fill", "#1e3a8a");
      ic2.setAttribute("stroke", "#ffffff");
      ic2.setAttribute("stroke-width", "1.5");
      legG.appendChild(ic2);

      const tx2 = document.createElementNS(SVGNS, "text");
      tx2.setAttribute("x", "26"); tx2.setAttribute("y", "49");
      tx2.setAttribute("font-family", "'Segoe UI', sans-serif");
      tx2.setAttribute("font-size", "8.5px"); tx2.setAttribute("font-weight", "600");
      tx2.setAttribute("fill", "#334155");
      tx2.textContent = isRainy ? "Tinguas desplazadas a la orilla" : "Tinguas residentes en zona hídrica";
      legG.appendChild(tx2);

      natBirdSvg.appendChild(legG);
    }
  }

  // ============================================================
  // CAPA 4: Corredores de Conectividad Regional e Intercambio Genético
  // Explica con exactitud geográfica el papel del Humedal El Burro como nodo de la EEP:
  // - Corredor 1: Vuelo biológico desde los Cerros Orientales / Páramo de Cruz Verde siguiendo la cuenca del Río Fucha hacia El Burro.
  // - Corredor 2: Conexión con la ronda del Río Bogotá hacia el Humedal La Conejera y Sabana Norte.
  // - Corredor 3: Vínculo freático y biológico de proximidad hacia el Humedal La Vaca y Humedal El Tintal.
  // ============================================================
  function renderNaturalMacroLayer(mesNum) {
    if (!natMacroCanvas) return;
    const rect = natMacroCanvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = rect.width || 720, h = rect.height || 405;
    if (natMacroCanvas.width !== Math.round(w * dpr) || natMacroCanvas.height !== Math.round(h * dpr)) {
      natMacroCanvas.width = Math.round(w * dpr);
      natMacroCanvas.height = Math.round(h * dpr);
    }
    const ctx = natMacroCanvas.getContext("2d");
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const projectPoint = (rx, ry, el = 0.05) => projectPointToLayer(rx, ry, el, w, h);
    const burroCenter = projectPoint(7518.49, 3137.57);

    // 1. TRAMA CARTOGRÁFICA DEL NODO CENTRAL (El Burro como HUB de intercambio genético)
    if (burroCenter.inFront) {
      // Área de amortiguación biológica regional
      ctx.beginPath();
      ctx.ellipse(burroCenter.x, burroCenter.y, 75, 42, -0.3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(226, 232, 240, 0.40)";
      ctx.fill();
      ctx.lineWidth = 1.0;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#64748b";
      ctx.stroke();
      ctx.setLineDash([]);

      // Ondas concéntricas de dispersión de semillas y fauna
      for (let r = 1; r <= 3; r++) {
        const rad = (natWaterTime * 12 + r * 28) % 95;
        const alpha = Math.max(0, 1 - rad / 95) * 0.35;
        ctx.beginPath();
        ctx.ellipse(burroCenter.x, burroCenter.y, rad * 1.5, rad * 0.8, -0.3, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(51, 65, 85, ${alpha})`;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
    }

    // 2. CORREDORES ECOLÓGICOS REGIONALES CON POLILÍNEAS DETALLADAS E HITOS
    if (natMacroSvg) {
      natMacroSvg.innerHTML = "";
      const SVGNS = "http://www.w3.org/2000/svg";

      const macroRoutes = [
        {
          name: "Cerros Orientales (Cruz Verde) → Cuenca Río Fucha → El Burro",
          desc: "Corredor aviar este-oeste (2.600 msnm a 2.540 msnm)",
          hitorigen: "Cerros Orientales",
          pts: [
            [8600, 2200],
            [8200, 2600],
            [7850, 2900],
            [7518, 3137]
          ],
          color: "#334155"
        },
        {
          name: "Río Bogotá & Sabana Norte → Conexión Humedales",
          desc: "Ruta migratoria longitudinal del altiplano cundiboyacense",
          hitorigen: "Río Bogotá / Sabana Norte",
          pts: [
            [6100, 4600],
            [6600, 4100],
            [7050, 3600],
            [7518, 3137]
          ],
          color: "#475569"
        },
        {
          name: "Intercambio Local Tintal: El Burro ↔ Humedal La Vaca",
          desc: "Paso de baja altura para dispersión de flora y aves residentes",
          hitorigen: "H. La Vaca",
          pts: [
            [6750, 3750],
            [7100, 3450],
            [7518, 3137]
          ],
          color: "#0f766e"
        }
      ];

      macroRoutes.forEach(r => {
        const scr = r.pts.map(p => projectPoint(p[0], p[1]));
        if (scr.length < 2 || !scr[scr.length - 1].inFront) return;

        const pathG = document.createElementNS(SVGNS, "g");

        // Trayectoria de fondo para destacar
        let d = `M ${scr[0].x} ${scr[0].y}`;
        for (let i = 1; i < scr.length; i++) d += ` L ${scr[i].x} ${scr[i].y}`;

        const bgLine = document.createElementNS(SVGNS, "path");
        bgLine.setAttribute("d", d);
        bgLine.setAttribute("fill", "none");
        bgLine.setAttribute("stroke", "rgba(255,255,255,0.85)");
        bgLine.setAttribute("stroke-width", "4");
        pathG.appendChild(bgLine);

        // Línea animada punteada
        const flowLine = document.createElementNS(SVGNS, "path");
        flowLine.setAttribute("d", d);
        flowLine.setAttribute("fill", "none");
        flowLine.setAttribute("stroke", r.color);
        flowLine.setAttribute("stroke-width", "2.2");
        flowLine.setAttribute("stroke-dasharray", "6 4");
        const dashOffset = (natWaterTime * 18) % 20;
        flowLine.setAttribute("stroke-dashoffset", (-dashOffset).toFixed(1));
        pathG.appendChild(flowLine);

        // Marcador del hito de origen
        const pStart = scr[0];
        const dotStart = document.createElementNS(SVGNS, "circle");
        dotStart.setAttribute("cx", String(pStart.x)); dotStart.setAttribute("cy", String(pStart.y));
        dotStart.setAttribute("r", "4.5");
        dotStart.setAttribute("fill", r.color);
        dotStart.setAttribute("stroke", "#ffffff");
        dotStart.setAttribute("stroke-width", "1.5");
        pathG.appendChild(dotStart);

        // Hito origen texto
        const hitTxt = document.createElementNS(SVGNS, "text");
        hitTxt.setAttribute("x", String(pStart.x + 8)); hitTxt.setAttribute("y", String(pStart.y - 4));
        hitTxt.setAttribute("font-family", "'Segoe UI', sans-serif");
        hitTxt.setAttribute("font-size", "8.5px"); hitTxt.setAttribute("font-weight", "700");
        hitTxt.setAttribute("fill", "#0f172a");
        hitTxt.textContent = r.hitorigen;
        pathG.appendChild(hitTxt);

        // Flecha hacia El Burro
        const pEnd = scr[scr.length - 1], pPrev = scr[scr.length - 2];
        const angle = Math.atan2(pEnd.y - pPrev.y, pEnd.x - pPrev.x);
        const arrowLen = 11;
        const x1 = pEnd.x - arrowLen * Math.cos(angle - Math.PI / 6);
        const y1 = pEnd.y - arrowLen * Math.sin(angle - Math.PI / 6);
        const x2 = pEnd.x - arrowLen * Math.cos(angle + Math.PI / 6);
        const y2 = pEnd.y - arrowLen * Math.sin(angle + Math.PI / 6);
        const arrow = document.createElementNS(SVGNS, "polygon");
        arrow.setAttribute("points", `${pEnd.x},${pEnd.y} ${x1},${y1} ${x2},${y2}`);
        arrow.setAttribute("fill", r.color);
        pathG.appendChild(arrow);

        natMacroSvg.appendChild(pathG);
      });

      // Panel explicativo superior izquierdo con estructura territorial
      const boxG = document.createElementNS(SVGNS, "g");
      boxG.setAttribute("transform", "translate(24, 0)");

      const boxBg = document.createElementNS(SVGNS, "rect");
      boxBg.setAttribute("x", "0"); boxBg.setAttribute("y", "0");
      boxBg.setAttribute("width", "270"); boxBg.setAttribute("height", "54");
      boxBg.setAttribute("rx", "4"); boxBg.setAttribute("fill", "rgba(255,255,255,0.96)");
      boxBg.setAttribute("stroke", "#cbd5e1"); boxBg.setAttribute("stroke-width", "1");
      boxG.appendChild(boxBg);

      const title = document.createElementNS(SVGNS, "text");
      title.setAttribute("x", "10"); title.setAttribute("y", "15");
      title.setAttribute("font-family", "'Segoe UI', sans-serif");
      title.setAttribute("font-size", "10px"); title.setAttribute("font-weight", "800");
      title.setAttribute("fill", "#0f172a");
      title.textContent = "ESTRUCTURA ECOLÓGICA PRINCIPAL (EEP)";
      boxG.appendChild(title);

      const d1 = document.createElementNS(SVGNS, "text");
      d1.setAttribute("x", "10"); d1.setAttribute("y", "29");
      d1.setAttribute("font-family", "'Segoe UI', sans-serif");
      d1.setAttribute("font-size", "8.5px"); d1.setAttribute("font-weight", "600");
      d1.setAttribute("fill", "#334155");
      d1.textContent = "• Conector Biológico: Cerros Orientales ↔ Río Bogotá";
      boxG.appendChild(d1);

      const d2 = document.createElementNS(SVGNS, "text");
      d2.setAttribute("x", "10"); d2.setAttribute("y", "43");
      d2.setAttribute("font-family", "'Segoe UI', sans-serif");
      d2.setAttribute("font-size", "8.5px"); d2.setAttribute("font-weight", "600");
      d2.setAttribute("fill", "#0f766e");
      d2.textContent = "• Nodo Genético Tintal: El Burro ↔ La Vaca ↔ Techo";
      boxG.appendChild(d2);

      natMacroSvg.appendChild(boxG);

      // Nodo central Humedal El Burro destacado
      if (burroCenter.inFront) {
        const hubG = document.createElementNS(SVGNS, "g");
        hubG.setAttribute("transform", `translate(${burroCenter.x}, ${burroCenter.y})`);

        const hubPin = document.createElementNS(SVGNS, "circle");
        hubPin.setAttribute("r", "5"); hubPin.setAttribute("fill", "#0f172a");
        hubPin.setAttribute("stroke", "#ffffff"); hubPin.setAttribute("stroke-width", "2");
        hubG.appendChild(hubPin);

        const hubTxt = document.createElementNS(SVGNS, "text");
        hubTxt.setAttribute("x", "9"); hubTxt.setAttribute("y", "4");
        hubTxt.setAttribute("font-family", "'Segoe UI', sans-serif");
        hubTxt.setAttribute("font-size", "9px"); hubTxt.setAttribute("font-weight", "800");
        hubTxt.setAttribute("fill", "#0f172a");
        hubTxt.textContent = "NODO EL BURRO (EEP)";
        hubG.appendChild(hubTxt);

        natMacroSvg.appendChild(hubG);
      }
    }
  }

  // Líneas guía arquitectónicas punteadas verticales que conectan los vértices de las capas
  function drawNaturalGuideLines() {
    if (!natGuideSvg || !natOverlay) return;
    natGuideSvg.innerHTML = "";
    const SVGNS = "http://www.w3.org/2000/svg";
    const layerBase = document.getElementById("natLayerBase");
    if (!layerBase) return;

    const sublayers = [
      document.getElementById("natLayerWater"),
      document.getElementById("natLayer2"),
      document.getElementById("natLayer3"),
      document.getElementById("natLayer4")
    ];
    let layerTop = sublayers.find(l => l && parseFloat(l.style.opacity || "0") > 0.1 && (l.getBoundingClientRect().top < layerBase.getBoundingClientRect().top - 15));
    if (!layerTop) layerTop = document.getElementById("natLayerWater");

    const rTop = layerTop.getBoundingClientRect();
    const rBase = layerBase.getBoundingClientRect();
    const rStage = natGuideSvg.getBoundingClientRect();
    if (Math.abs(rTop.top - rBase.top) < 15) return;

    // 4 esquinas del rombo (50% 0%, 100% 50%, 50% 100%, 0% 50%)
    const cornersRel = [
      { rx: 0.5, ry: 0.0 }, // norte
      { rx: 1.0, ry: 0.5 }, // este
      { rx: 0.5, ry: 1.0 }, // sur
      { rx: 0.0, ry: 0.5 }, // oeste
    ];

    cornersRel.forEach(c => {
      const x1 = rTop.left + rTop.width * c.rx - rStage.left;
      const y1 = rTop.top + rTop.height * c.ry - rStage.top;
      const x2 = rBase.left + rBase.width * c.rx - rStage.left;
      const y2 = rBase.top + rBase.height * c.ry - rStage.top;

      const line = document.createElementNS(SVGNS, "line");
      line.setAttribute("x1", String(x1));
      line.setAttribute("y1", String(y1));
      line.setAttribute("x2", String(x2));
      line.setAttribute("y2", String(y2));
      line.setAttribute("stroke", "rgba(15, 23, 42, 0.28)");
      line.setAttribute("stroke-width", "1.3");
      line.setAttribute("stroke-dasharray", "4 4");
      natGuideSvg.appendChild(line);

      const dot1 = document.createElementNS(SVGNS, "circle");
      dot1.setAttribute("cx", String(x1)); dot1.setAttribute("cy", String(y1)); dot1.setAttribute("r", "2.5");
      dot1.setAttribute("fill", "rgba(15, 23, 42, 0.4)");
      natGuideSvg.appendChild(dot1);

      const dot2 = document.createElementNS(SVGNS, "circle");
      dot2.setAttribute("cx", String(x2)); dot2.setAttribute("cy", String(y2)); dot2.setAttribute("r", "2.5");
      dot2.setAttribute("fill", "rgba(15, 23, 42, 0.4)");
      natGuideSvg.appendChild(dot2);
    });
  }

  window.addEventListener("resize", () => {
    if (natOverlay && natOverlay.style.display !== "none") {
      renderAllNaturalSublayers();
    }
  });

  if (natMesSlider) {
    natMesSlider.addEventListener("input", () => {
      renderAllNaturalSublayers();
    });
  }

  function stopNatPlayYear() {
    natYearPlaying = false;
    if (natYearTimer) { clearInterval(natYearTimer); natYearTimer = null; }
    if (natPlayYearBtn) natPlayYearBtn.textContent = "▶ Reproducir año completo";
  }

  if (natPlayYearBtn) {
    natPlayYearBtn.addEventListener("click", () => {
      natYearPlaying = !natYearPlaying;
      if (natYearPlaying) {
        natPlayYearBtn.textContent = "⏸ Pausar año";
        natYearTimer = setInterval(() => {
          let m = parseInt(natMesSlider.value, 10) + 1;
          if (m > 12) m = 1;
          natMesSlider.value = String(m);
          renderAllNaturalSublayers();
        }, 2200);
      } else {
        stopNatPlayYear();
      }
    });
  }

  // ---- Caja de coordenadas de los textos (arriba a la izquierda) ----
  const textCoordsBox = document.createElement("textarea");
  textCoordsBox.id = "textCoordsOutput";
  textCoordsBox.style.cssText = "display:none; position:absolute; top:18px; left:18px; z-index:16; width:340px; height:160px; font-size:10px; background:rgba(10,12,14,.92); color:#fff; border:1px solid rgba(255,255,255,.2); border-radius:6px; padding:8px;";
  document.getElementById("explodeOverlay").appendChild(textCoordsBox);
  function updateTextCoordsOutput() {
    let out = "";
    document.querySelectorAll(".explode-text").forEach(t => {
      const layerNum = t.dataset.layer;
      const st = textStates[layerNum];
      out += `Capa ${layerNum} ("${t.textContent}"): tamaño ${t.style.fontSize || "22px"}, color ${t.style.color || "#ffffff"}\n`;
      if (st) out += `  esquinas: ${st.corners.map(c => `(${c.x.toFixed(0)},${c.y.toFixed(0)})`).join(" ")}\n`;
    });
    textCoordsBox.value = out.trim();
    textCoordsBox.style.display = "block";
  }
  document.querySelectorAll(".explode-text").forEach(t => {
    initTextDistort(t, t.dataset.layer);
    t.addEventListener("input", updateTextCoordsOutput);
  });

  // ============================================================
  // ESCALA CULTURAL Y SOCIO-URBANA (4 CAPAS DE SIMULACIÓN)
  // ============================================================
  const cultOverlay = document.getElementById("culturalExplodeOverlay");
  const cultBackBtn = document.getElementById("cultExplodeBack");
  const cultAssembleBtn = document.getElementById("cultAssembleBtn");
  const cultAssembleBtnText = document.getElementById("cultAssembleBtnText");
  const cultBaseImg = document.getElementById("cultBaseImg");
  const cultGuideSvg = document.getElementById("cultGuideSvg");
  const cultStageEl = document.getElementById("culturalExplodeStage");

  // Capas
  const cultLayer1 = document.getElementById("cultLayer1");
  const cultLayer1Canvas = document.getElementById("cultLayer1Canvas");
  const cultLayer1Svg = document.getElementById("cultLayer1Svg");

  const cultLayer2 = document.getElementById("cultLayer2");
  const cultLayer2Canvas = document.getElementById("cultLayer2Canvas");
  const cultLayer2Svg = document.getElementById("cultLayer2Svg");

  const cultLayer3 = document.getElementById("cultLayer3");
  const cultLayer3Canvas = document.getElementById("cultLayer3Canvas");
  const cultLayer3Svg = document.getElementById("cultLayer3Svg");

  const cultLayer4 = document.getElementById("cultLayer4");
  const cultLayer4Canvas = document.getElementById("cultLayer4Canvas");
  const cultLayer4Svg = document.getElementById("cultLayer4Svg");

  const cultLayerBase = document.getElementById("cultLayerBase");

  // Paneles flotantes de control
  const cultCapa1Panel = document.getElementById("cultCapa1Panel");
  const cultYearSlider = document.getElementById("cultYearSlider");
  const cultYearLabel = document.getElementById("cultYearLabel");
  const cultHistoryStats = document.getElementById("cultHistoryStats");
  const cultPlayHistoryBtn = document.getElementById("cultPlayHistoryBtn");

  const cultCapa2Panel = document.getElementById("cultCapa2Panel");
  const cultCapa3Panel = document.getElementById("cultCapa3Panel");

  const cultCapa4Panel = document.getElementById("cultCapa4Panel");
  const cultTadBadge = document.getElementById("cultTadBadge");
  const cultSotToggleBtn = document.getElementById("cultSotToggleBtn");

  let cultExplodeStep = 0;
  let cultAnimFrame = null;
  let cultTime = 0;
  let cultHistPlaying = false;
  let cultHistTimer = null;
  let isSotElevated = false;

  function openCulturalExplode() {
    if (!cultOverlay) return;

    const targetW = 960, targetH = 540;
    const layerAspect = targetW / targetH;

    camera.left = -viewSize * layerAspect;
    camera.right = viewSize * layerAspect;
    camera.top = viewSize;
    camera.bottom = -viewSize;
    camera.updateProjectionMatrix();
    renderer.setSize(targetW, targetH, false);
    updateCanonicalCamera();

    const origRoadColor = roadMat ? roadMat.color.getHex() : null;
    const origNoiseVis = noiseMesh ? noiseMesh.visible : false;
    const origBirdsVis = birdsGroup ? birdsGroup.visible : false;
    const origVehVis = vehInstanced ? vehInstanced.visible : false;
    const origVehCount = vehInstanced ? vehInstanced.count : 0;
    const origBg = scene.background;

    if (noiseMesh) noiseMesh.visible = false;
    if (birdsGroup) birdsGroup.visible = false;
    if (vehInstanced) { vehInstanced.visible = false; vehInstanced.count = 0; }
    if (roadMat) roadMat.color.set(0x9099a3);

    scene.background = new THREE.Color(0xffffff);
    renderer.render(scene, camera);
    const fotoBase = renderer.domElement.toDataURL("image/png");

    // Captura de CONTEXTO (camara alejada), igual que en Escala natural.
    const culContextImg = document.getElementById("culContextImg");
    const culLayerContext = document.getElementById("culLayerContext");
    if (culContextImg) {
      const contextZoomOut = 3.2;
      camera.left = -viewSize * contextZoomOut * layerAspect;
      camera.right = viewSize * contextZoomOut * layerAspect;
      camera.top = viewSize * contextZoomOut;
      camera.bottom = -viewSize * contextZoomOut;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      culContextImg.src = renderer.domElement.toDataURL("image/png");
      if (culLayerContext) culLayerContext.style.opacity = "1";
      camera.left = -viewSize * layerAspect;
      camera.right = viewSize * layerAspect;
      camera.top = viewSize;
      camera.bottom = -viewSize;
      camera.updateProjectionMatrix();
    }
    scene.background = origBg;

    if (roadMat && origRoadColor !== null) roadMat.color.set(origRoadColor);
    if (noiseMesh) noiseMesh.visible = origNoiseVis;
    if (birdsGroup) birdsGroup.visible = origBirdsVis;
    if (vehInstanced) {
      vehInstanced.visible = origVehVis;
      vehInstanced.count = origVehCount;
    }

    if (cultBaseImg) {
      cultBaseImg.src = fotoBase;
      cultBaseImg.style.objectFit = "fill";
    }
    const setCultSubImg = (id) => {
      const el = document.getElementById(id);
      if (el) { el.src = ""; el.style.display = "none"; }
    };
    setCultSubImg("cultLayer1Img");
    setCultSubImg("cultLayer2Img");
    setCultSubImg("cultLayer3Img");
    setCultSubImg("cultLayer4Img");

    cultOverlay.style.display = "flex";
    void cultOverlay.offsetWidth;

    cultExplodeStep = 0;
    updateCulturalLayersStep(false);
    renderAllCulturalSublayers();
    startCultAnimation();
  }

  function closeCulturalExplode() {
    if (!cultOverlay) return;
    if (cultAnimFrame) { cancelAnimationFrame(cultAnimFrame); cultAnimFrame = null; }
    if (cultHistPlaying) stopCultHistory();

    const sublayers = cultOverlay.querySelectorAll(".cult-sublayer");
    sublayers.forEach(l => {
      l.style.opacity = "0";
      l.style.transform = "translate(-50%, -20px)";
    });
    const culLayerContext2 = document.getElementById("culLayerContext");
    if (culLayerContext2) culLayerContext2.style.opacity = "0";

    const origW = wrap.clientWidth, origH = wrap.clientHeight;
    renderer.setSize(origW, origH, false);
    const restoreAspect = origW / origH;
    camera.left = -viewSize * restoreAspect;
    camera.right = viewSize * restoreAspect;
    camera.top = viewSize;
    camera.bottom = -viewSize;
    camera.updateProjectionMatrix();

    setTimeout(() => {
      cultOverlay.style.display = "none";
      unzoomAll();
    }, 400);
  }

  if (cultBackBtn) cultBackBtn.addEventListener("click", closeCulturalExplode);

  function updateCulturalLayersStep(animated = true) {
    const sublayers = [cultLayer1, cultLayer2, cultLayer3, cultLayer4];
    const panels = [cultCapa1Panel, cultCapa2Panel, cultCapa3Panel, cultCapa4Panel];
    const tags = cultOverlay.querySelectorAll(".cult-layer-tag");

    const allDiamonds = cultOverlay.querySelectorAll(".sublayer-diamond");
    allDiamonds.forEach(d => {
      const isBase = d.parentElement && d.parentElement.id === "cultLayerBase";
      if (isBase) {
        d.style.background = "transparent";
        d.style.boxShadow = "none";
        d.style.borderColor = "transparent";
      } else {
        d.style.background = "rgba(255, 255, 255, 0.92)";
        d.style.border = "1.5px solid rgba(15, 23, 42, 0.35)";
        d.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.08)";
      }
    });

    panels.forEach(p => { if (p) p.style.display = "none"; });

    if (cultExplodeStep === 0) {
      if (cultLayerBase) { cultLayerBase.style.top = "50%"; cultLayerBase.style.opacity = "1"; cultLayerBase.style.transform = "translate(-50%, -40%)"; }
      sublayers.forEach(l => { if (l) { l.style.opacity = "0"; l.style.top = "50%"; l.style.transform = "translate(-50%, -40%)"; } });
      tags.forEach(t => { t.style.opacity = "0"; });
      if (cultGuideSvg) cultGuideSvg.style.opacity = "0";
      if (cultAssembleBtnText) cultAssembleBtnText.textContent = "Extraer Capa 1: Memoria Histórica";
      return;
    }

    if (cultExplodeStep % 2 === 1 && cultExplodeStep <= 7) {
      const activeIdx = Math.floor(cultExplodeStep / 2);
      if (cultLayerBase) { cultLayerBase.style.top = "54%"; cultLayerBase.style.opacity = "1"; cultLayerBase.style.transform = "translate(-50%, -40%)"; }
      sublayers.forEach((l, index) => {
        if (!l) return;
        if (index === activeIdx) {
          const expTop = l.dataset.explodedTop || "12%";
          l.style.top = expTop;
          l.style.transform = "translate(-50%, 0)";
          l.style.opacity = "1";
          const tag = l.querySelector(".cult-layer-tag");
          if (tag) tag.style.opacity = "1";
        } else {
          l.style.top = "54%";
          l.style.transform = "translate(-50%, -40%)";
          l.style.opacity = "0";
          const tag = l.querySelector(".cult-layer-tag");
          if (tag) tag.style.opacity = "0";
        }
      });
      if (panels[activeIdx]) panels[activeIdx].style.display = "block";
      if (cultGuideSvg) cultGuideSvg.style.opacity = "1";
      drawCulturalGuideLines();
      if (cultAssembleBtnText) cultAssembleBtnText.textContent = `Asentar Capa ${activeIdx + 1} en el Territorio`;
      return;
    }

    if (cultExplodeStep % 2 === 0 && cultExplodeStep <= 8) {
      const settledIdx = (cultExplodeStep / 2) - 1;
      const nextNames = ["Capa 2: Cerramiento Borde", "Capa 3: Recorrido Pedagógico", "Capa 4: Fricción Vial SOT", "Ver Apilamiento Explotado Completo"];

      if (cultLayerBase) { cultLayerBase.style.top = "50%"; cultLayerBase.style.opacity = "1"; cultLayerBase.style.transform = "translate(-50%, -40%)"; }
      sublayers.forEach((l, index) => {
        if (!l) return;
        if (index === settledIdx) {
          l.style.top = "50%";
          l.style.transform = "translate(-50%, -40%)";
          l.style.opacity = "1";
          const tag = l.querySelector(".cult-layer-tag");
          if (tag) tag.style.opacity = "1";
        } else {
          l.style.top = "50%";
          l.style.transform = "translate(-50%, -40%)";
          l.style.opacity = "0";
          const tag = l.querySelector(".cult-layer-tag");
          if (tag) tag.style.opacity = "0";
        }
      });
      if (panels[settledIdx]) panels[settledIdx].style.display = "block";
      if (cultGuideSvg) cultGuideSvg.style.opacity = "0";
      if (cultAssembleBtnText) cultAssembleBtnText.textContent = `Extraer ${nextNames[settledIdx]}`;
      return;
    }

    if (cultExplodeStep === 9) {
      if (cultLayerBase) { cultLayerBase.style.top = "70%"; cultLayerBase.style.opacity = "1"; cultLayerBase.style.transform = "translate(-50%, 0)"; }
      sublayers.forEach((l) => {
        if (!l) return;
        const expTop = l.dataset.explodedTop || "54%";
        l.style.top = expTop;
        l.style.transform = "translate(-50%, 0)";
        l.style.opacity = "1";
        const tag = l.querySelector(".cult-layer-tag");
        if (tag) tag.style.opacity = "1";
      });
      tags.forEach(t => { t.style.opacity = "1"; });
      if (cultGuideSvg) cultGuideSvg.style.opacity = "1";
      drawCulturalGuideLines();
      if (cultAssembleBtnText) cultAssembleBtnText.textContent = "Integrar TODAS las capas en el Territorio";
      return;
    }

    if (cultExplodeStep === 10) {
      if (cultLayerBase) { cultLayerBase.style.top = "50%"; cultLayerBase.style.opacity = "1"; cultLayerBase.style.transform = "translate(-50%, -40%)"; }
      sublayers.forEach((l) => {
        if (!l) return;
        l.style.top = "50%";
        l.style.transform = "translate(-50%, -40%)";
        l.style.opacity = "1";
        const tag = l.querySelector(".cult-layer-tag");
        if (tag) tag.style.opacity = "0";
      });
      if (cultGuideSvg) cultGuideSvg.style.opacity = "0";
      if (cultAssembleBtnText) cultAssembleBtnText.textContent = "Reiniciar Recorrido en Base";
      return;
    }
  }

  function advanceCulturalAssemble() {
    cultExplodeStep++;
    if (cultExplodeStep > 10) cultExplodeStep = 0;
    updateCulturalLayersStep(true);
  }

  if (cultAssembleBtn) cultAssembleBtn.addEventListener("click", advanceCulturalAssemble);
  if (cultStageEl) {
    cultStageEl.addEventListener("click", () => { advanceCulturalAssemble(); });
  }

  function drawCulturalGuideLines() {
    if (!cultGuideSvg || !cultOverlay) return;
    cultGuideSvg.innerHTML = "";
    const SVGNS = "http://www.w3.org/2000/svg";
    const layerBase = cultLayerBase;
    if (!layerBase) return;

    const sublayers = [cultLayer1, cultLayer2, cultLayer3, cultLayer4];
    let layerTop = sublayers.find(l => l && parseFloat(l.style.opacity || "0") > 0.1 && (l.getBoundingClientRect().top < layerBase.getBoundingClientRect().top - 15));
    if (!layerTop) layerTop = cultLayer1;

    const rTop = layerTop.getBoundingClientRect();
    const rBase = layerBase.getBoundingClientRect();
    const rStage = cultGuideSvg.getBoundingClientRect();
    if (Math.abs(rTop.top - rBase.top) < 15) return;

    const cornersRel = [
      { rx: 0.5, ry: 0.0 },
      { rx: 1.0, ry: 0.5 },
      { rx: 0.5, ry: 1.0 },
      { rx: 0.0, ry: 0.5 },
    ];

    cornersRel.forEach(c => {
      const x1 = rTop.left + rTop.width * c.rx - rStage.left;
      const y1 = rTop.top + rTop.height * c.ry - rStage.top;
      const x2 = rBase.left + rBase.width * c.rx - rStage.left;
      const y2 = rBase.top + rBase.height * c.ry - rStage.top;

      const line = document.createElementNS(SVGNS, "line");
      line.setAttribute("x1", String(x1)); line.setAttribute("y1", String(y1));
      line.setAttribute("x2", String(x2)); line.setAttribute("y2", String(y2));
      line.setAttribute("stroke", "rgba(162, 28, 175, 0.35)");
      line.setAttribute("stroke-width", "1.3");
      line.setAttribute("stroke-dasharray", "4 4");
      cultGuideSvg.appendChild(line);

      const dot1 = document.createElementNS(SVGNS, "circle");
      dot1.setAttribute("cx", String(x1)); dot1.setAttribute("cy", String(y1)); dot1.setAttribute("r", "2.5");
      dot1.setAttribute("fill", "rgba(162, 28, 175, 0.5)");
      cultGuideSvg.appendChild(dot1);

      const dot2 = document.createElementNS(SVGNS, "circle");
      dot2.setAttribute("cx", String(x2)); dot2.setAttribute("cy", String(y2)); dot2.setAttribute("r", "2.5");
      dot2.setAttribute("fill", "rgba(162, 28, 175, 0.5)");
      cultGuideSvg.appendChild(dot2);
    });
  }

  function startCultAnimation() {
    if (cultAnimFrame) cancelAnimationFrame(cultAnimFrame);
    function loopCult() {
      if (cultOverlay.style.display !== "none") {
        cultTime += 0.035;
        const year = cultYearSlider ? parseInt(cultYearSlider.value, 10) : 1956;
        renderCulturalCapa1(year);
        renderCulturalCapa2();
        renderCulturalCapa3();
        renderCulturalCapa4(isSotElevated);
        cultAnimFrame = requestAnimationFrame(loopCult);
      }
    }
    cultAnimFrame = requestAnimationFrame(loopCult);
  }

  function renderAllCulturalSublayers() {
    const year = cultYearSlider ? parseInt(cultYearSlider.value, 10) : 1956;
    renderCulturalCapa1(year);
    renderCulturalCapa2();
    renderCulturalCapa3();
    renderCulturalCapa4(isSotElevated);
    drawCulturalGuideLines();
  }

  if (cultYearSlider) {
    cultYearSlider.addEventListener("input", () => {
      const year = parseInt(cultYearSlider.value, 10);
      if (cultYearLabel) cultYearLabel.textContent = String(year);
      renderCulturalCapa1(year);
    });
  }

  function stopCultHistory() {
    cultHistPlaying = false;
    if (cultHistTimer) { clearInterval(cultHistTimer); cultHistTimer = null; }
    if (cultPlayHistoryBtn) cultPlayHistoryBtn.textContent = "▶ Simular evolución histórica (1950 ➔ 2024)";
  }

  if (cultPlayHistoryBtn) {
    cultPlayHistoryBtn.addEventListener("click", () => {
      cultHistPlaying = !cultHistPlaying;
      if (cultHistPlaying) {
        cultPlayHistoryBtn.textContent = "⏸ Pausar evolución histórica";
        cultHistTimer = setInterval(() => {
          let y = parseInt(cultYearSlider.value, 10) + 1;
          if (y > 2024) y = 1950;
          cultYearSlider.value = String(y);
          if (cultYearLabel) cultYearLabel.textContent = String(y);
          renderCulturalCapa1(y);
        }, 150);
      } else {
        stopCultHistory();
      }
    });
  }

  if (cultSotToggleBtn) {
    cultSotToggleBtn.addEventListener("click", () => {
      isSotElevated = !isSotElevated;
      if (isSotElevated) {
        cultSotToggleBtn.textContent = "DESACTIVAR WHAT-IF";
        cultSotToggleBtn.style.background = "#dc2626";
        cultSotToggleBtn.style.borderColor = "#dc2626";
        if (cultTadBadge) {
          cultTadBadge.textContent = "TAD: Normal (Vía Elevada SOT)";
          cultTadBadge.style.background = "#16a34a";
        }
      } else {
        cultSotToggleBtn.textContent = "ACTIVAR WHAT-IF";
        cultSotToggleBtn.style.background = "#16a34a";
        cultSotToggleBtn.style.borderColor = "#16a34a";
        if (cultTadBadge) {
          cultTadBadge.textContent = "TAD: +2 horas";
          cultTadBadge.style.background = "#dc2626";
        }
      }
      renderCulturalCapa4(isSotElevated);
    });
  }

  // ------------------------------------------------------------
  // RENDERIZADORES DE LAS 4 CAPAS CULTURALES
  // ------------------------------------------------------------

  // Capa 1: Memoria Histórica (1950–2024)
  function renderCulturalCapa1(year) {
    if (!cultLayer1Canvas) return;
    const rect = cultLayer1Canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = rect.width || 720, h = rect.height || 405;
    if (cultLayer1Canvas.width !== Math.round(w * dpr) || cultLayer1Canvas.height !== Math.round(h * dpr)) {
      cultLayer1Canvas.width = Math.round(w * dpr);
      cultLayer1Canvas.height = Math.round(h * dpr);
    }
    const ctx = cultLayer1Canvas.getContext("2d");
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const projectPoint = (rx, ry, el = 0.05) => projectPointToLayer(rx, ry, el, w, h);

    // Reducción del área: 1956 (171.54 ha) -> 2024 (18.84 ha)
    const tNorm = Math.max(0, Math.min(1, (year - 1956) / (2024 - 1956)));
    const areaHa = 171.54 - (171.54 - 18.84) * tNorm;
    const scaleFactor = 1.0 + (1 - tNorm) * 2.1;

    if (cultHistoryStats) {
      const redPct = ((171.54 - areaHa) / 171.54 * 100).toFixed(1);
      const perceptionStr = year < 1990 ? '"Potrero / Pantano a secar"' : (year < 2010 ? '"Ecosistema en recuperación"' : '"Reserva de biodiversidad protegida"');
      const percColor = year < 1990 ? '#e11d48' : (year < 2010 ? '#d97706' : '#16a34a');
      cultHistoryStats.innerHTML = `Año <strong>${year}</strong> · Área: <strong style="color:#9333ea;">${areaHa.toFixed(2)} ha</strong> (-${redPct}%) · Percepción: <strong style="color:${percColor};">${perceptionStr}</strong>`;
    }

    if (rawWaterData) {
      const burro = rawWaterData.find(b => (b.nombre || "").includes("Burro"));
      if (burro && burro.pts && burro.pts.length > 3) {
        const cx = burro.pts.reduce((s, p) => s + p[0], 0) / burro.pts.length;
        const cy = burro.pts.reduce((s, p) => s + p[1], 0) / burro.pts.length;

        const histPts = burro.pts.map(p => [cx + (p[0] - cx) * scaleFactor, cy + (p[1] - cy) * scaleFactor]);
        const scrHist = histPts.map(p => projectPoint(p[0], p[1]));

        ctx.beginPath();
        ctx.moveTo(scrHist[0].x, scrHist[0].y);
        for (let i = 1; i < scrHist.length; i++) ctx.lineTo(scrHist[i].x, scrHist[i].y);
        ctx.closePath();

        if (year < 1990) {
          ctx.fillStyle = "rgba(217, 119, 6, 0.35)";
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "#b45309";
          ctx.stroke();
        } else {
          ctx.fillStyle = "rgba(147, 51, 234, 0.30)";
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "#7e22ce";
          ctx.stroke();
        }

        const isCareNode = year >= 2000;
        const numAgents = 14;
        for (let a = 0; a < numAgents; a++) {
          const ang = (a / numAgents) * Math.PI * 2 + cultTime * (isCareNode ? 0.2 : 0.8);
          const radDist = isCareNode ? 45 : (30 + Math.sin(cultTime * 3 + a) * 15);
          const agPt = projectPoint(cx + Math.cos(ang) * radDist * 10, cy + Math.sin(ang) * radDist * 10);

          if (agPt.inFront) {
            ctx.beginPath();
            ctx.arc(agPt.x, agPt.y, isCareNode ? 5 : 4, 0, Math.PI * 2);
            ctx.fillStyle = isCareNode ? "#16a34a" : "#dc2626";
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#ffffff";
            ctx.stroke();

            if (!isCareNode) {
              ctx.beginPath();
              ctx.moveTo(agPt.x, agPt.y);
              ctx.lineTo(agPt.x - Math.cos(ang) * 12, agPt.y - Math.sin(ang) * 12);
              ctx.strokeStyle = "#dc2626";
              ctx.lineWidth = 1.5;
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.arc(agPt.x, agPt.y, 8 + Math.sin(cultTime * 4 + a) * 3, 0, Math.PI * 2);
              ctx.strokeStyle = "rgba(22, 163, 74, 0.4)";
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
      }
    }

    if (cultLayer1Svg) {
      cultLayer1Svg.innerHTML = "";
      const SVGNS = "http://www.w3.org/2000/svg";
      const centerPt = projectPoint(7518.49, 3137.57);
      if (centerPt.inFront) {
        const g = document.createElementNS(SVGNS, "g");
        g.setAttribute("transform", `translate(${centerPt.x}, ${centerPt.y})`);

        const bg = document.createElementNS(SVGNS, "rect");
        bg.setAttribute("x", "-90"); bg.setAttribute("y", "-34");
        bg.setAttribute("width", "180"); bg.setAttribute("height", "28");
        bg.setAttribute("rx", "6"); bg.setAttribute("fill", "rgba(255,255,255,0.96)");
        bg.setAttribute("stroke", year >= 2000 ? "#16a34a" : "#dc2626");
        bg.setAttribute("stroke-width", "1.5");
        g.appendChild(bg);

        const txt = document.createElementNS(SVGNS, "text");
        txt.setAttribute("x", "0"); txt.setAttribute("y", "-20");
        txt.setAttribute("text-anchor", "middle");
        txt.setAttribute("font-family", "'Segoe UI', sans-serif");
        txt.setAttribute("font-size", "9.5px"); txt.setAttribute("font-weight", "800");
        txt.setAttribute("fill", "#0f172a");
        txt.textContent = year < 2000 ? "⚠️ Vectores de Potrero & Escombros" : "🛡️ Nodos de Cuidado Comunitario";
        g.appendChild(txt);

        const sub = document.createElementNS(SVGNS, "text");
        sub.setAttribute("x", "0"); sub.setAttribute("y", "-10");
        sub.setAttribute("text-anchor", "middle");
        sub.setAttribute("font-family", "'Segoe UI', sans-serif");
        sub.setAttribute("font-size", "8px"); sub.setAttribute("font-weight", "600");
        sub.setAttribute("fill", "#475569");
        sub.textContent = `Área: ${areaHa.toFixed(1)} ha (${year})`;
        g.appendChild(sub);

        cultLayer1Svg.appendChild(g);
      }
    }
  }

  // Capa 2: Cerramiento EAAB & Filtro de Borde Urbano
  function renderCulturalCapa2() {
    if (!cultLayer2Canvas) return;
    const rect = cultLayer2Canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = rect.width || 720, h = rect.height || 405;
    if (cultLayer2Canvas.width !== Math.round(w * dpr) || cultLayer2Canvas.height !== Math.round(h * dpr)) {
      cultLayer2Canvas.width = Math.round(w * dpr);
      cultLayer2Canvas.height = Math.round(h * dpr);
    }
    const ctx = cultLayer2Canvas.getContext("2d");
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const projectPoint = (rx, ry, el = 0.05) => projectPointToLayer(rx, ry, el, w, h);

    const porvenirPts = [
      [6800, 2400], [7100, 2700], [7400, 3000], [7700, 3300], [8000, 3600]
    ];
    const scrPorvenir = porvenirPts.map(p => projectPoint(p[0], p[1]));
    ctx.beginPath();
    ctx.moveTo(scrPorvenir[0].x, scrPorvenir[0].y);
    for (let i = 1; i < scrPorvenir.length; i++) ctx.lineTo(scrPorvenir[i].x, scrPorvenir[i].y);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "#e11d48";
    ctx.stroke();

    const gatePt = projectPoint(7400, 3000);

    for (let p = 0; p < 8; p++) {
      const prog = (cultTime * 0.4 + p * 0.125) % 1.0;
      const idx = Math.floor(prog * (scrPorvenir.length - 1));
      const subProg = (prog * (scrPorvenir.length - 1)) - idx;
      const p1 = scrPorvenir[idx], p2 = scrPorvenir[idx + 1] || p1;
      const px = p1.x + (p2.x - p1.x) * subProg;
      const py = p1.y + (p2.y - p1.y) * subProg;

      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#e11d48";
      ctx.fill();
    }

    const zmpaInsidePts = [
      [7420, 3050], [7460, 3100], [7500, 3150], [7530, 3180]
    ];
    const scrZmpaIn = zmpaInsidePts.map(p => projectPoint(p[0], p[1]));

    for (let p = 0; p < 5; p++) {
      const prog = (cultTime * 0.08 + p * 0.2) % 1.0;
      const idx = Math.floor(prog * (scrZmpaIn.length - 1));
      const subProg = (prog * (scrZmpaIn.length - 1)) - idx;
      const p1 = scrZmpaIn[idx], p2 = scrZmpaIn[idx + 1] || p1;
      const px = p1.x + (p2.x - p1.x) * subProg;
      const py = p1.y + (p2.y - p1.y) * subProg;

      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#16a34a";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
    }

    if (cultLayer2Svg) {
      cultLayer2Svg.innerHTML = "";
      const SVGNS = "http://www.w3.org/2000/svg";

      if (gatePt.inFront) {
        const g = document.createElementNS(SVGNS, "g");
        g.setAttribute("transform", `translate(${gatePt.x}, ${gatePt.y})`);

        const gateCircle = document.createElementNS(SVGNS, "circle");
        gateCircle.setAttribute("r", "7");
        gateCircle.setAttribute("fill", "#0284c7");
        gateCircle.setAttribute("stroke", "#ffffff");
        gateCircle.setAttribute("stroke-width", "2");
        g.appendChild(gateCircle);

        const bg = document.createElementNS(SVGNS, "rect");
        bg.setAttribute("x", "12"); bg.setAttribute("y", "-18");
        bg.setAttribute("width", "185"); bg.setAttribute("height", "32");
        bg.setAttribute("rx", "6"); bg.setAttribute("fill", "rgba(255,255,255,0.96)");
        bg.setAttribute("stroke", "#0284c7"); bg.setAttribute("stroke-width", "1.5");
        g.appendChild(bg);

        const txt = document.createElementNS(SVGNS, "text");
        txt.setAttribute("x", "18"); txt.setAttribute("y", "-5");
        txt.setAttribute("font-family", "'Segoe UI', sans-serif");
        txt.setAttribute("font-size", "9.5px"); txt.setAttribute("font-weight", "800");
        txt.setAttribute("fill", "#0f172a");
        txt.textContent = "🚪 Portón EAAB & Filtro de Borde";
        g.appendChild(txt);

        const sub = document.createElementNS(SVGNS, "text");
        sub.setAttribute("x", "18"); sub.setAttribute("y", "6");
        sub.setAttribute("font-family", "'Segoe UI', sans-serif");
        sub.setAttribute("font-size", "8px"); sub.setAttribute("font-weight", "600");
        sub.setAttribute("fill", "#0284c7");
        sub.textContent = "Filtro: Velocidad 25 km/h ➔ 3 km/h (ZMPA 12.14 ha)";
        g.appendChild(sub);

        cultLayer2Svg.appendChild(g);
      }
    }
  }

  // Capa 3: Recorrido Pedagógico y Experiencia Sensorial
  function renderCulturalCapa3() {
    if (!cultLayer3Canvas) return;
    const rect = cultLayer3Canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = rect.width || 720, h = rect.height || 405;
    if (cultLayer3Canvas.width !== Math.round(w * dpr) || cultLayer3Canvas.height !== Math.round(h * dpr)) {
      cultLayer3Canvas.width = Math.round(w * dpr);
      cultLayer3Canvas.height = Math.round(h * dpr);
    }
    const ctx = cultLayer3Canvas.getContext("2d");
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const projectPoint = (rx, ry, el = 0.05) => projectPointToLayer(rx, ry, el, w, h);

    const tourPts = [
      [7900, 2700],
      [7700, 2900],
      [7550, 3050],
      [7480, 3140]
    ];
    const scrTour = tourPts.map(p => projectPoint(p[0], p[1]));

    ctx.beginPath();
    ctx.moveTo(scrTour[0].x, scrTour[0].y);
    for (let i = 1; i < scrTour.length; i++) ctx.lineTo(scrTour[i].x, scrTour[i].y);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#15803d";
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    const prog = (cultTime * 0.15) % 1.0;
    const idx = Math.floor(prog * (scrTour.length - 1));
    const subProg = (prog * (scrTour.length - 1)) - idx;
    const p1 = scrTour[idx], p2 = scrTour[idx + 1] || p1;
    const stX = p1.x + (p2.x - p1.x) * subProg;
    const stY = p1.y + (p2.y - p1.y) * subProg;

    for (let s = 0; s < 4; s++) {
      ctx.beginPath();
      ctx.arc(stX + (s - 1.5) * 5, stY + (s % 2) * 4, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#16a34a";
      ctx.fill();
    }

    const platformPt = scrTour[3];
    if (platformPt.inFront) {
      const pulseR = 35 + Math.sin(cultTime * 3) * 6;
      ctx.beginPath();
      ctx.ellipse(platformPt.x, platformPt.y, pulseR * 1.5, pulseR * 0.8, -0.3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(22, 163, 74, 0.15)";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(22, 163, 74, 0.6)";
      ctx.stroke();

      if (idx === 2 || idx === 3) {
        for (let b = 0; b < 6; b++) {
          const bAng = (b / 6) * Math.PI * 2 + cultTime * 0.5;
          const bx = platformPt.x + Math.cos(bAng) * (pulseR + 15);
          const by = platformPt.y + Math.sin(bAng) * (pulseR * 0.5 + 8);
          ctx.beginPath();
          ctx.arc(bx, by, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#0284c7";
          ctx.fill();
        }
      }
    }

    if (cultLayer3Svg) {
      cultLayer3Svg.innerHTML = "";
      const SVGNS = "http://www.w3.org/2000/svg";

      const bibPt = scrTour[0];
      if (bibPt.inFront) {
        const g1 = document.createElementNS(SVGNS, "g");
        g1.setAttribute("transform", `translate(${bibPt.x}, ${bibPt.y})`);
        const dot1 = document.createElementNS(SVGNS, "circle");
        dot1.setAttribute("r", "5"); dot1.setAttribute("fill", "#15803d");
        g1.appendChild(dot1);
        const t1 = document.createElementNS(SVGNS, "text");
        t1.setAttribute("x", "8"); t1.setAttribute("y", "4");
        t1.setAttribute("font-family", "'Segoe UI', sans-serif");
        t1.setAttribute("font-size", "9px"); t1.setAttribute("font-weight", "800");
        t1.setAttribute("fill", "#0f172a");
        t1.textContent = "📚 Biblioteca El Tintal (Inicio)";
        g1.appendChild(t1);
        cultLayer3Svg.appendChild(g1);
      }

      if (platformPt.inFront) {
        const g2 = document.createElementNS(SVGNS, "g");
        g2.setAttribute("transform", `translate(${platformPt.x}, ${platformPt.y})`);

        const bg = document.createElementNS(SVGNS, "rect");
        bg.setAttribute("x", "-85"); bg.setAttribute("y", "-38");
        bg.setAttribute("width", "170"); bg.setAttribute("height", "28");
        bg.setAttribute("rx", "6"); bg.setAttribute("fill", "rgba(255,255,255,0.96)");
        bg.setAttribute("stroke", "#15803d"); bg.setAttribute("stroke-width", "1.5");
        g2.appendChild(bg);

        const txt = document.createElementNS(SVGNS, "text");
        txt.setAttribute("x", "0"); txt.setAttribute("y", "-24");
        txt.setAttribute("text-anchor", "middle");
        txt.setAttribute("font-family", "'Segoe UI', sans-serif");
        txt.setAttribute("font-size", "9.5px"); txt.setAttribute("font-weight", "800");
        txt.setAttribute("fill", "#0f172a");
        txt.textContent = "🤫 Franja de Silencio & Avistamiento";
        g2.appendChild(txt);

        const sub = document.createElementNS(SVGNS, "text");
        sub.setAttribute("x", "0"); sub.setAttribute("y", "-14");
        sub.setAttribute("text-anchor", "middle");
        sub.setAttribute("font-family", "'Segoe UI', sans-serif");
        sub.setAttribute("font-size", "8px"); sub.setAttribute("font-weight", "600");
        sub.setAttribute("fill", "#15803d");
        sub.textContent = "Aves se acercan al espejo de agua";
        g2.appendChild(sub);

        cultLayer3Svg.appendChild(g2);
      }
    }
  }

  // Capa 4: Fricción Vial y Solución Adaptativa SOT
  function renderCulturalCapa4(elevated) {
    if (!cultLayer4Canvas) return;
    const rect = cultLayer4Canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = rect.width || 720, h = rect.height || 405;
    if (cultLayer4Canvas.width !== Math.round(w * dpr) || cultLayer4Canvas.height !== Math.round(h * dpr)) {
      cultLayer4Canvas.width = Math.round(w * dpr);
      cultLayer4Canvas.height = Math.round(h * dpr);
    }
    const ctx = cultLayer4Canvas.getContext("2d");
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const projectPoint = (rx, ry, el = 0.05) => projectPointToLayer(rx, ry, el, w, h);

    const caliPts = [
      [7100, 3700], [7300, 3400], [7500, 3100], [7700, 2800]
    ];
    const scrCali = caliPts.map(p => projectPoint(p[0], p[1], elevated ? 0.35 : 0.05));

    if (elevated) {
      ctx.beginPath();
      ctx.moveTo(scrCali[0].x, scrCali[0].y);
      for (let i = 1; i < scrCali.length; i++) ctx.lineTo(scrCali[i].x, scrCali[i].y);
      ctx.lineWidth = 7.0;
      ctx.strokeStyle = "#16a34a";
      ctx.stroke();

      ctx.lineWidth = 4.0;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      for (let v = 0; v < 6; v++) {
        const prog = (cultTime * 0.5 + v * 0.16) % 1.0;
        const idx = Math.floor(prog * (scrCali.length - 1));
        const subProg = (prog * (scrCali.length - 1)) - idx;
        const p1 = scrCali[idx], p2 = scrCali[idx + 1] || p1;
        const vx = p1.x + (p2.x - p1.x) * subProg;
        const vy = p1.y + (p2.y - p1.y) * subProg;

        ctx.beginPath();
        ctx.arc(vx, vy, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#16a34a";
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(scrCali[0].x, scrCali[0].y);
      for (let i = 1; i < scrCali.length; i++) ctx.lineTo(scrCali[i].x, scrCali[i].y);
      ctx.lineWidth = 5.0;
      ctx.strokeStyle = "#dc2626";
      ctx.stroke();

      ctx.lineWidth = 12.0;
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.stroke();

      for (let v = 0; v < 8; v++) {
        const p1 = scrCali[1], p2 = scrCali[2];
        const f = v / 7;
        const vx = p1.x + (p2.x - p1.x) * f + (Math.sin(v) * 4);
        const vy = p1.y + (p2.y - p1.y) * f + (Math.cos(v) * 3);

        ctx.beginPath();
        ctx.rect(vx - 5, vy - 3, 10, 6);
        ctx.fillStyle = "#dc2626";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
      }
    }

    if (cultLayer4Svg) {
      cultLayer4Svg.innerHTML = "";
      const SVGNS = "http://www.w3.org/2000/svg";
      const midPt = scrCali[Math.floor(scrCali.length / 2)];

      if (midPt.inFront) {
        const g = document.createElementNS(SVGNS, "g");
        g.setAttribute("transform", `translate(${midPt.x}, ${midPt.y})`);

        const bg = document.createElementNS(SVGNS, "rect");
        bg.setAttribute("x", "-100"); bg.setAttribute("y", "-42");
        bg.setAttribute("width", "200"); bg.setAttribute("height", "32");
        bg.setAttribute("rx", "6"); bg.setAttribute("fill", "rgba(255,255,255,0.96)");
        bg.setAttribute("stroke", elevated ? "#16a34a" : "#dc2626");
        bg.setAttribute("stroke-width", "1.5");
        g.appendChild(bg);

        const txt = document.createElementNS(SVGNS, "text");
        txt.setAttribute("x", "0"); txt.setAttribute("y", "-28");
        txt.setAttribute("text-anchor", "middle");
        txt.setAttribute("font-family", "'Segoe UI', sans-serif");
        txt.setAttribute("font-size", "9.5px"); txt.setAttribute("font-weight", "800");
        txt.setAttribute("fill", "#0f172a");
        txt.textContent = elevated ? "🌉 Vía Elevada Flotante SOT" : "🚌 Fricción Vial Av. Ciudad de Cali";
        g.appendChild(txt);

        const sub = document.createElementNS(SVGNS, "text");
        sub.setAttribute("x", "0"); sub.setAttribute("y", "-17");
        sub.setAttribute("text-anchor", "middle");
        sub.setAttribute("font-family", "'Segoe UI', sans-serif");
        sub.setAttribute("font-size", "8px"); sub.setAttribute("font-weight", "600");
        sub.setAttribute("fill", elevated ? "#16a34a" : "#dc2626");
        sub.textContent = elevated ? "Conexión hídrica libre bajo puente (4.9 ha ↔ 13.9 ha)" : "Inundación por lluvias · TAD: +2 horas";
        g.appendChild(sub);

        cultLayer4Svg.appendChild(g);
      }
    }
  }

})();

