/* ==========================================================================
   SIMULACIÓN DE MOVILIDAD (SUMO) — módulo 8
   ==========================================================================
   Renderiza en 2D, sobre <canvas>, la red vial exportada de SUMO
   (osm.net.xml) y las trayectorias vehiculares de una simulación
   (trazado.xml), con controles de reproducción/pausa, línea de tiempo y
   velocidad.

   ARCHIVOS QUE ESTE SCRIPT ESPERA ENCONTRAR (rutas relativas a esta página):

   1) ./assets/kennedy_net.json
      Ya generado a partir de tu osm.net.xml: es una versión recortada
      (solo la zona de Kennedy, sin veredas/ciclovías) y convertida a JSON
      para que cargue rápido en el navegador. Si vuelves a exportar la red
      desde SUMO y quieres actualizarla, dímelo y la vuelvo a generar.

      Formato:
      { "offset": [offX, offY], "bbox": [0,0,w,h],
        "edges": [ ["major"|"mid"|"local", [[x,y], [x,y], ...]], ... ] }

   2) ./assets/kennedy_vehiculos.json  (preferido)
      Ya generado a partir de tu vehiculos.json: filtrado a la zona de
      Kennedy y con las mismas coordenadas locales que la red (mismo
      "offset" ya restado). Formato compacto:
      [ [tiempo, [[id, x, y], [id, x, y], ...]], ... ]
      No trae ángulo — se calcula solo, mirando hacia dónde se mueve cada
      auto entre un instante y el siguiente.

   3) ./assets/trazado.xml  (alternativa, si no existe el JSON de arriba)
      Tu archivo de trayectorias, tal como lo exporta SUMO en modo
      "FCD output" (--fcd-output). Súbelo tú mismo a la carpeta /assets
      de tu repositorio en GitHub (por eso no lo pude cargar yo).
      Formato esperado (el que genera SUMO por defecto):

        <fcd-export>
          <timestep time="0.00">
            <vehicle id="veh0" x="12345.6" y="7890.1" angle="90.0" .../>
            ...
          </timestep>
          ...
        </fcd-export>

      Los x,y de este archivo deben estar en las MISMAS coordenadas locales
      que tu osm.net.xml original (las que trae "netconvert" antes de
      cualquier recorte) — este script les resta automáticamente el mismo
      "offset" que se usó al recortar la red, para que ambos coincidan.
   ========================================================================== */
(() => {
  "use strict";

  const NET_URL = "./assets/kennedy_net.json";
  // Encuadre del mapa: se puede ajustar en vivo con el panel de calibración
  // (ver más abajo) — estos son solo los valores iniciales.
  let EXTRA_ZOOM = 1.62;
  let CENTER_X = 6730, CENTER_Y = 3350;
  let ROTATE_DEG = 0.0;
  const VEHICULOS_JSON_URL = "./assets/kennedy_vehiculos.json";
  const TRAZADO_URL = "./assets/trazado.xml";

  const EDGE_STYLE = {
    major: { color: "rgba(255,255,255,0.55)", width: 2.4 },
    mid:   { color: "rgba(255,255,255,0.38)", width: 1.6 },
    local: { color: "rgba(255,255,255,0.22)", width: 1 },
  };

  const start = (fn) =>
    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", fn, { once: true })
      : fn();

  start(() => {
    const netCanvas = document.getElementById("sumoNetCanvas");
    const noiseCanvas = document.getElementById("sumoNoiseCanvas");
    const vehCanvas = document.getElementById("sumoVehCanvas");
    const statusEl = document.getElementById("sumoStatus");
    const playBtn = document.getElementById("sumoPlayPause");
    const ambienceAudio = document.getElementById("sumoAmbienceAudio");
    const muteBtn = document.getElementById("sumoMuteToggle");
    const slider = document.getElementById("sumoTimeSlider");
    const timeLabel = document.getElementById("sumoTimeLabel");
    const speedSelect = document.getElementById("sumoSpeedSelect");
    if (!netCanvas || !vehCanvas) return; // esta página no tiene el panel

    const netCtx = netCanvas.getContext("2d");
    const noiseCtx = noiseCanvas ? noiseCanvas.getContext("2d") : null;
    const vehCtx = vehCanvas.getContext("2d");

    let netData = null;      // { offset, bbox, edges }
    let treeData = null;     // { species: [nombre,...], trees: [[x,y,speciesIdx,alturaM],...] } — Arbolado Urbano real de Kennedy
    // Distorsión libre de la malla de árboles (mover/escalar/girar), como
    // en Photoshop — el usuario la acomoda a ojo y copia los valores.
    // Distorsión de 4 esquinas de la malla de árboles (como "Distort" de
    // Photoshop): cada esquina se puede arrastrar por separado, y el resto
    // de los árboles se acomoda con interpolación entre las 4 esquinas.
    // Los offsets están en píxeles de pantalla, relativos a la esquina base
    // (calculada de la caja real que ocupan los árboles).
    let treeCornerOffsets = { tl: { x: 72, y: -615 }, tr: { x: 477, y: -627 }, bl: { x: 80, y: 306 }, br: { x: 470, y: 326 } };
    let treeLayerScale = 0.95;
    // Los 4 puntos naranjas de agarre se muestran más cerca del centro que
    // su posición real, SOLO para que sean fáciles de ver y agarrar — esto
    // no afecta el tamaño ni la posición real de los árboles, solo dónde
    // se dibuja el punto con el que se agarra cada esquina.
    const HANDLE_DISPLAY_SCALE = 0.12;
    let treeWorldBBox = null; // { minX, minY, maxX, maxY } — se calcula una vez que carga el dato
    let timesteps = [];      // [{ time, vehicles:[{id,x,y,angle}] }]
    let view = { scale: 1, offX: 0, offY: 0 }; // mundo -> pantalla
    let playing = false;
    let noiseLayerOn = true; // se puede prender/apagar con el interruptor

    // =====================================================================
    // MODELO ILUSTRATIVO DE DEMANDA Y CIERRE DE VÍA
    // IMPORTANTE: esto NO es una re-simulación real de SUMO. No hay ningún
    // servidor ni motor SUMO corriendo detrás de esta página (es un sitio
    // estático), y no existe el archivo de demanda/rutas original para
    // regenerar una simulación real. Esto es una manipulación visual y
    // estadística sobre los MISMOS vehículos ya grabados, para explorar de
    // forma conceptual "qué pasaría si hubiera más/menos tráfico" o "qué
    // pasaría si se cerrara esta vía" — no reemplaza un estudio de tránsito.
    // =====================================================================
    let demandPercent = 0; // -100 a 100, 0 = modelo base exacto, sin cambios
    let closedEdgeIdx = null; // índice de la vía "cerrada" en netData.edges, o null
    let detourMap = new Map(); // vehicleId -> {fromTime, toTime, path:[{x,y}], totalDist} — reruteo REAL por Dijkstra

    // Vías candidatas a cerrar: las 6 vías "major" con más tránsito real
    // registrado en la simulación base (se contó, fuera de línea, cuántas
    // posiciones de vehículos caen a menos de 40m de cada vía major).
    const CLOSURE_CANDIDATES = [
      { edgeIdx: 9847, label: "Vía crítica 1 (mayor tránsito registrado)" },
      { edgeIdx: 11268, label: "Vía crítica 2" },
      { edgeIdx: 8260, label: "Vía crítica 3" },
      { edgeIdx: 9919, label: "Vía crítica 4" },
      { edgeIdx: 10240, label: "Vía crítica 5" },
      { edgeIdx: 9449, label: "Vía crítica 6" },
    ];

    function hashId(str) {
      let h = 0;
      for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
      return h;
    }

    // Clon "fantasma" de un vehículo real, con un pequeño desplazamiento
    // fijo (determinista según su id) para representar tráfico adicional
    // sin inventar una ruta nueva de verdad.
    function makeGhostVehicle(v, k) {
      const h = hashId(v.id + "_g" + k);
      const jx = (h % 21) - 10, jy = ((h >>> 5) % 21) - 10; // -10 a 10 m
      return { id: `${v.id}_ghost${k}`, x: v.x + jx, y: v.y + jy, angle: v.angle, speedKmh: v.speedKmh, ghost: true };
    }

    // =====================================================================
    // RERUTEO REAL: cuando se cierra una vía, se construye el grafo real
    // de calles alrededor (con los mismos segmentos de kennedy_net.json,
    // sin la vía cerrada) y se calcula, con el algoritmo de Dijkstra, el
    // camino más corto de verdad por calles existentes para cada vehículo
    // que iba a pasar cerca — así se ve cómo el tráfico se desvía a las
    // calles vecinas, no solo un empujón visual hacia el lado.
    // =====================================================================
    const DETOUR_THRESHOLD_M = 45; // qué tan cerca de la vía cerrada cuenta como "afectado"
    const DETOUR_MAX_VEHICLES = 180; // límite para que el cálculo no tarde demasiado

    function buildLocalGraphAround(closedIdx, radiusM) {
      const closedPts = netData.edges[closedIdx][1];
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      closedPts.forEach(([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); });
      minX -= radiusM; maxX += radiusM; minY -= radiusM; maxY += radiusM;
      const nodes = new Map(); // key -> {x,y}
      const adj = new Map(); // key -> [{to,dist}]
      // Tolerancia de unión de nodos: 22m. Se probó con datos reales que a
      // menos de esto (0.5m-8m) la red queda fragmentada en cientos de
      // "islas" desconectadas — no por imprecisión de coordenadas, sino
      // porque ~10.900 de las 19.037 vías de este mapa fueron reconstruidas
      // solo a partir de la posición de sus cruces (sin la forma real), y
      // esas posiciones reconstruidas no coinciden exactamente con las vías
      // de forma real vecinas. A 22m (bastante menor que una cuadra típica
      // de ~80-100m, así que no une cruces reales distintos) se conecta el
      // ~95% de la red local, verificado con vehículos reales de la
      // simulación.
      const SNAP_M = 22;
      const nodeKey = (x, y) => Math.round(x / SNAP_M) + "," + Math.round(y / SNAP_M);
      const addNode = (x, y) => { const k = nodeKey(x, y); if (!nodes.has(k)) nodes.set(k, { x, y }); return k; };
      const addEdgeBidir = (k1, k2, dist) => {
        if (k1 === k2) return; // evitar auto-bucles cuando dos puntos caen en la misma celda
        if (!adj.has(k1)) adj.set(k1, []);
        if (!adj.has(k2)) adj.set(k2, []);
        adj.get(k1).push({ to: k2, dist });
        adj.get(k2).push({ to: k1, dist });
      };
      netData.edges.forEach(([, pts], edgeIdx) => {
        if (edgeIdx === closedIdx) return; // la vía cerrada NO se incluye: no se puede pasar por ahí
        for (let i = 0; i < pts.length - 1; i++) {
          const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
          const inside = (ax >= minX && ax <= maxX && ay >= minY && ay <= maxY) || (bx >= minX && bx <= maxX && by >= minY && by <= maxY);
          if (!inside) continue;
          const dist = Math.hypot(bx - ax, by - ay);
          if (dist > 0) addEdgeBidir(addNode(ax, ay), addNode(bx, by), dist);
        }
      });
      return { nodes, adj, nodeKey };
    }

    function findNearestGraphNode(graph, x, y) {
      let best = null, bestD = Infinity;
      graph.nodes.forEach((p, key) => {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < bestD) { bestD = d; best = key; }
      });
      return best;
    }

    // Dijkstra con una cola de prioridad (heap binario) sencilla — el
    // grafo local es chico (solo lo que está cerca de la vía cerrada), así
    // que esto corre rápido aunque no sea la implementación más optimizada.
    function dijkstraPath(graph, startKey, endKey) {
      const dist = new Map([[startKey, 0]]);
      const prev = new Map();
      const visited = new Set();
      const heap = [[0, startKey]];
      const heapPush = (item) => {
        heap.push(item);
        let i = heap.length - 1;
        while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
      };
      const heapPop = () => {
        const top = heap[0]; const last = heap.pop();
        if (heap.length) {
          heap[0] = last; let i = 0;
          while (true) {
            let l = 2 * i + 1, r = 2 * i + 2, s = i;
            if (l < heap.length && heap[l][0] < heap[s][0]) s = l;
            if (r < heap.length && heap[r][0] < heap[s][0]) s = r;
            if (s === i) break;
            [heap[s], heap[i]] = [heap[i], heap[s]]; i = s;
          }
        }
        return top;
      };
      while (heap.length) {
        const [d, u] = heapPop();
        if (visited.has(u)) continue;
        visited.add(u);
        if (u === endKey) break;
        (graph.adj.get(u) || []).forEach(({ to, dist: w }) => {
          const nd = d + w;
          if (nd < (dist.get(to) ?? Infinity)) { dist.set(to, nd); prev.set(to, u); heapPush([nd, to]); }
        });
      }
      if (!dist.has(endKey)) return null;
      const path = []; let cur = endKey;
      while (cur !== undefined) { path.push(graph.nodes.get(cur)); if (cur === startKey) break; cur = prev.get(cur); }
      return path.reverse();
    }

    // Calcula, para cada vehículo que pasaría cerca de la vía cerrada, un
    // desvío REAL (por calles existentes) usando Dijkstra, y lo guarda en
    // detourMap. Se corre UNA vez al activar el cierre, no en cada cuadro.
    function computeRealDetours(closedIdx) {
      detourMap = new Map();
      if (!netData || !timesteps.length) return;
      const graph = buildLocalGraphAround(closedIdx, 900);
      const closedPts = netData.edges[closedIdx][1];

      // Encontrar, para cada vehículo, las muestras (tiempo,x,y) donde
      // pasa cerca de la vía cerrada, a lo largo de TODA la simulación.
      const near = new Map(); // id -> [{time,x,y}]
      timesteps.forEach((step) => {
        step.vehicles.forEach((v) => {
          let minD = Infinity;
          for (let i = 0; i < closedPts.length - 1; i++) {
            const d = distToSegment(v.x, v.y, closedPts[i][0], closedPts[i][1], closedPts[i + 1][0], closedPts[i + 1][1]);
            if (d < minD) minD = d;
          }
          if (minD < DETOUR_THRESHOLD_M) {
            if (!near.has(v.id)) near.set(v.id, []);
            near.get(v.id).push({ time: step.time, x: v.x, y: v.y });
          }
        });
      });

      let count = 0;
      for (const [id, samples] of near) {
        if (count >= DETOUR_MAX_VEHICLES) break;
        samples.sort((a, b) => a.time - b.time);
        const first = samples[0], last = samples[samples.length - 1];
        const entryStart = findNearestGraphNode(graph, first.x, first.y);
        const exitEnd = findNearestGraphNode(graph, last.x, last.y);
        if (!entryStart || !exitEnd || entryStart === exitEnd) continue;
        const path = dijkstraPath(graph, entryStart, exitEnd);
        if (!path || path.length < 2) continue; // sin camino alterno encontrado cerca: se deja como iba
        let totalDist = 0;
        for (let i = 0; i < path.length - 1; i++) totalDist += Math.hypot(path[i + 1].x - path[i].x, path[i + 1].y - path[i].y);
        detourMap.set(id, { fromTime: first.time, toTime: last.time, path, totalDist });
        count++;
      }
    }

    // Posición de un vehículo desviado en el instante t, caminando a lo
    // largo del camino alterno real calculado por Dijkstra.
    function detourPositionAt(detour, t) {
      const span = detour.toTime - detour.fromTime || 1;
      const frac = Math.max(0, Math.min(1, (t - detour.fromTime) / span));
      const targetDist = frac * detour.totalDist;
      let acc = 0;
      for (let i = 0; i < detour.path.length - 1; i++) {
        const a = detour.path[i], b = detour.path[i + 1];
        const segLen = Math.hypot(b.x - a.x, b.y - a.y);
        if (acc + segLen >= targetDist) {
          const segFrac = segLen > 0 ? (targetDist - acc) / segLen : 0;
          return { x: a.x + (b.x - a.x) * segFrac, y: a.y + (b.y - a.y) * segFrac };
        }
        acc += segLen;
      }
      const lastP = detour.path[detour.path.length - 1];
      return { x: lastP.x, y: lastP.y };
    }

    // Aplica el efecto ilustrativo de demanda (+/-) y de cierre de vía
    // sobre la lista de vehículos base de este instante. Con demanda=0 y
    // sin vía cerrada, devuelve exactamente los vehículos base sin tocar
    // nada (estado inicial = modelo base actual, sin diferencia alguna).
    function applyDemandAndClosure(baseVehicles, t) {
      if (demandPercent === 0 && closedEdgeIdx == null) return baseVehicles;
      let vehicles = baseVehicles;

      if (demandPercent > 0) {
        const extraWhole = Math.floor(demandPercent / 100);
        const extraFrac = demandPercent / 100 - extraWhole;
        const extra = [];
        baseVehicles.forEach((v) => {
          for (let k = 0; k < extraWhole; k++) extra.push(makeGhostVehicle(v, k + 1));
          if ((hashId(v.id + "_f") % 1000) / 1000 < extraFrac) extra.push(makeGhostVehicle(v, extraWhole + 1));
        });
        vehicles = vehicles.concat(extra);
      } else if (demandPercent < 0) {
        const keepFrac = 1 + demandPercent / 100; // demandPercent es negativo aquí
        vehicles = vehicles.filter((v) => (hashId(v.id) % 1000) / 1000 < keepFrac);
      }

      if (closedEdgeIdx != null && detourMap.size) {
        // Reruteo REAL: los vehículos con un desvío calculado por Dijkstra
        // caminan por ese camino alterno (calles existentes de verdad)
        // mientras dure su paso por la zona afectada.
        vehicles = vehicles.map((v) => {
          const baseId = v.id.split("_ghost")[0]; // los "fantasmas" de demanda comparten el desvío de su original
          const detour = detourMap.get(baseId);
          if (detour && t >= detour.fromTime && t <= detour.toTime) {
            const p = detourPositionAt(detour, t);
            return { ...v, x: p.x, y: p.y, detoured: true };
          }
          return v;
        });
      }
      return vehicles;
    }

    let speedMultiplier = 2;
    let playhead = 0;        // segundos de simulación transcurridos
    let lastFrameTs = 0;
    let rafId = 0;

    function setStatus(text, show = true) {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.classList.toggle("hidden", !show);
    }

    function fmtTime(t) {
      const m = Math.floor(t / 60), s = Math.floor(t % 60);
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    // ---------- tamaño de los canvas (con devicePixelRatio) ----------
    function resizeCanvases() {
      const wrap = netCanvas.parentElement;
      const w = wrap.clientWidth, h = wrap.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      [netCanvas, vehCanvas].forEach((c) => {
        c.width = Math.max(1, Math.round(w * dpr));
        c.height = Math.max(1, Math.round(h * dpr));
      });
      netCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      vehCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      resizeNoiseCanvas(w, h);
      if (netData) {
        computeView(w, h);
        drawNetwork(w, h);
      }
    }

    // ---------- Índice espacial de la red vial ----------
    // Cada vía en kennedy_net.json ya trae su jerarquía como primer valor:
    // "local" (15.609 segmentos), "mid" (2.778) o "major" (650). Los
    // vehículos NO saben en qué vía están, así que para cada uno hay que
    // buscar cuál es el segmento de vía más cercano y leer su tipo ahí.
    // Se usa una cuadrícula (grid) para no tener que revisar las ~19.000
    // vías completas en cada cuadro.
    const ROAD_TYPE_RADIUS_M = { local: 25, mid: 75, major: 150 }; // metros reales, elegido por el usuario
    const EDGE_GRID_CELL = 150; // metros por celda de búsqueda
    let edgeGrid = null; // "gx,gy" -> [índice de vía, ...]

    function buildEdgeGrid() {
      edgeGrid = new Map();
      netData.edges.forEach(([, pts], idx) => {
        const cells = new Set();
        pts.forEach(([px, py]) => {
          cells.add(Math.floor(px / EDGE_GRID_CELL) + "," + Math.floor(py / EDGE_GRID_CELL));
        });
        cells.forEach((key) => {
          if (!edgeGrid.has(key)) edgeGrid.set(key, []);
          edgeGrid.get(key).push(idx);
        });
      });
    }

    function distToSegment(px, py, ax, ay, bx, by) {
      const dx = bx - ax, dy = by - ay;
      const lenSq = dx * dx + dy * dy;
      let t = lenSq > 0 ? ((px - ax) * dx + (py - ay) * dy) / lenSq : 0;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    }

    // Tipo de vía (local/mid/major) más cercano a un punto del mundo (en
    // metros) — agranda el anillo de búsqueda hasta encontrar algo cerca.
    function nearestRoadType(x, y) {
      if (!edgeGrid || !netData) return "local";
      const gx0 = Math.floor(x / EDGE_GRID_CELL), gy0 = Math.floor(y / EDGE_GRID_CELL);
      let best = null, bestDist = Infinity;
      for (let ring = 0; ring <= 3; ring++) {
        for (let dx = -ring; dx <= ring; dx++) {
          for (let dy = -ring; dy <= ring; dy++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue; // solo el borde del anillo actual
            const idxs = edgeGrid.get((gx0 + dx) + "," + (gy0 + dy));
            if (!idxs) continue;
            idxs.forEach((idx) => {
              const [type, pts] = netData.edges[idx];
              for (let i = 0; i < pts.length - 1; i++) {
                const d = distToSegment(x, y, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
                if (d < bestDist) { bestDist = d; best = type; }
              }
            });
          }
        }
        if (best !== null && ring >= 1) break; // ya encontramos algo; un anillo extra por seguridad
      }
      return best || "local";
    }

    // ---------- Capa de ruido: superficie continua, alpha SIEMPRE igual,
    // solo cambia el color según qué tan cargada de tráfico está la zona.
    // Se calcula en un buffer de baja resolución (para que el difuminado
    // salga suave y sea barato de recalcular en cada cuadro), y se dibuja
    // agrandado con blur encima del mapa.
    const NOISE_ALPHA = 0.42; // fijo para TODA la capa, sin importar el nivel
    const NOISE_BUF_W = 220; // resolución baja a propósito, para que sea una mancha continua, no puntos
    const noiseBufCanvas = document.createElement("canvas");
    const noiseBufCtx = noiseBufCanvas.getContext("2d", { willReadFrequently: true });
    let noiseBufW = NOISE_BUF_W, noiseBufH = 140;

    function resizeNoiseCanvas(w, h) {
      if (!noiseCanvas) return;
      const dpr = window.devicePixelRatio || 1;
      noiseCanvas.width = Math.max(1, Math.round(w * dpr));
      noiseCanvas.height = Math.max(1, Math.round(h * dpr));
      noiseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      noiseBufH = Math.max(1, Math.round((NOISE_BUF_W * h) / Math.max(1, w)));
      noiseBufCanvas.width = NOISE_BUF_W;
      noiseBufCanvas.height = noiseBufH;
    }

    // Escala de color amarillo→rojo (solo el color cambia, nunca el alpha).
    // Los "stops" son puntos de referencia entre los que se interpola
    // suavemente, para que la transición sea continua y no por bandas.
    const NOISE_COLOR_STOPS = [
      { t: 0.00, rgb: [255, 247, 179] }, // < 50 dB(A): amarillo claro
      { t: 0.20, rgb: [255, 224, 76] },  // 50–60: amarillo
      { t: 0.40, rgb: [255, 179, 77] },  // 60–70: naranja claro
      { t: 0.60, rgb: [245, 124, 0] },   // 70–80: naranja
      { t: 0.80, rgb: [230, 74, 25] },   // 80–90: rojo anaranjado
      { t: 1.00, rgb: [211, 47, 47] },   // > 90: rojo
    ];
    function noiseColorAt(t) {
      t = Math.max(0, Math.min(1, t));
      for (let i = 0; i < NOISE_COLOR_STOPS.length - 1; i++) {
        const a = NOISE_COLOR_STOPS[i], b = NOISE_COLOR_STOPS[i + 1];
        if (t >= a.t && t <= b.t) {
          const f = (t - a.t) / (b.t - a.t || 1);
          return [
            Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * f),
            Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * f),
            Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * f),
          ];
        }
      }
      return NOISE_COLOR_STOPS[NOISE_COLOR_STOPS.length - 1].rgb;
    }

    // =====================================================================
    // MOTOR ACÚSTICO REAL (CNOSSOS-EU) — implementado y listo para usarse,
    // pero todavía SIN los coeficientes numéricos oficiales (ver TODO abajo).
    // Mientras esos valores no estén, todas las funciones de aquí devuelven
    // `null` a propósito — el mapa sigue viéndose exactamente igual que
    // antes (mismos colores, misma transparencia, mismo método visual),
    // usando el método anterior como respaldo automático (ver más abajo,
    // en drawNoiseLayer). NO se inventó ningún número.
    // Fuente: Directiva (UE) 2015/996 (CNOSSOS-EU), Anexo II, Cap. 2.2 y 2.5.
    // =====================================================================

    // TODO — PENDIENTE: pegar aquí los coeficientes oficiales de la Tabla
    // F-1 (Apéndice F de la Directiva), para Categoría 1 (vehículos
    // livianos — la única categoría que podemos usar, ya que SUMO no nos
    // da el tipo de vehículo). Son 4 arreglos de 6 números cada uno (uno
    // por banda de octava: 125, 250, 500, 1000, 2000, 4000 Hz).
    const CNOSSOS_OCTAVE_BANDS_HZ = [125, 250, 500, 1000, 2000, 4000];
    const CNOSSOS_COEFFICIENTS = {
      category1: {
        AR: [null, null, null, null, null, null], // término A del ruido de rodadura
        BR: [null, null, null, null, null, null], // término B del ruido de rodadura
        AP: [null, null, null, null, null, null], // término A del ruido de propulsión
        BP: [null, null, null, null, null, null], // término B del ruido de propulsión
      },
    };
    const CNOSSOS_VREF_KMH = 70; // velocidad de referencia de la directiva

    // Ruido de rodadura de un vehículo, en una banda de octava (dB).
    // L_WR = A_R + B_R · log10(v)
    function rollingNoise(speedKmh, bandIdx) {
      const AR = CNOSSOS_COEFFICIENTS.category1.AR[bandIdx];
      const BR = CNOSSOS_COEFFICIENTS.category1.BR[bandIdx];
      if (AR == null || BR == null || speedKmh <= 0) return null;
      return AR + BR * Math.log10(speedKmh);
    }

    // Ruido de propulsión de un vehículo, en una banda de octava (dB).
    // L_WP = A_P + B_P · (v - v_ref)/v_ref
    function propulsionNoise(speedKmh, bandIdx) {
      const AP = CNOSSOS_COEFFICIENTS.category1.AP[bandIdx];
      const BP = CNOSSOS_COEFFICIENTS.category1.BP[bandIdx];
      if (AP == null || BP == null) return null;
      return AP + BP * ((speedKmh - CNOSSOS_VREF_KMH) / CNOSSOS_VREF_KMH);
    }

    // Potencia sonora total de UN vehículo en una banda: suma ENERGÉTICA
    // (no aritmética) de rodadura + propulsión.
    // L_W = 10·log10(10^(L_WR/10) + 10^(L_WP/10))
    function vehicleSoundPower(speedKmh, bandIdx) {
      const lwr = rollingNoise(speedKmh, bandIdx);
      const lwp = propulsionNoise(speedKmh, bandIdx);
      if (lwr == null || lwp == null) return null;
      return 10 * Math.log10(Math.pow(10, lwr / 10) + Math.pow(10, lwp / 10));
    }

    // Atenuación por divergencia geométrica de una fuente puntual (~6 dB
    // por cada vez que se duplica la distancia). d en METROS REALES.
    // A_div = 20·log10(d) + 11
    function geometricDivergence(dMeters) {
      return 20 * Math.log10(Math.max(dMeters, 0.05)) + 11;
    }

    // Nivel que UN vehículo produce en un punto receptor (x,y del mundo,
    // en metros reales), en una banda de octava.
    function levelAtReceiverFromVehicle(vehicle, receiverX, receiverY, bandIdx) {
      const lw = vehicleSoundPower(vehicle.speedKmh || 0, bandIdx);
      if (lw == null) return null;
      const d = Math.hypot(vehicle.x - receiverX, vehicle.y - receiverY);
      return lw - geometricDivergence(d);
    }

    // Nivel TOTAL en un punto receptor por TODOS los vehículos, sumados
    // energéticamente (nunca se suman los dB directamente).
    // L_total = 10·log10( Σ 10^(L_i/10) )
    function totalLevelAtReceiver(vehicles, receiverX, receiverY, bandIdx) {
      let energySum = 0, any = false;
      vehicles.forEach((v) => {
        const l = levelAtReceiverFromVehicle(v, receiverX, receiverY, bandIdx);
        if (l != null) { energySum += Math.pow(10, l / 10); any = true; }
      });
      return any ? 10 * Math.log10(energySum) : null;
    }

    // Nivel total en dB(A), sumando las 6 bandas de octava con su
    // ponderación A. Devuelve null mientras falten los coeficientes.
    const A_WEIGHTING_DB = { 125: -16.1, 250: -8.6, 500: -3.2, 1000: 0, 2000: 1.2, 4000: 1.0 }; // IEC 61672-1
    function totalLevelAtReceiverDbA(vehicles, receiverX, receiverY) {
      let energySum = 0, any = false;
      CNOSSOS_OCTAVE_BANDS_HZ.forEach((hz, bandIdx) => {
        const l = totalLevelAtReceiver(vehicles, receiverX, receiverY, bandIdx);
        if (l != null) { energySum += Math.pow(10, (l + A_WEIGHTING_DB[hz]) / 10); any = true; }
      });
      return any ? 10 * Math.log10(energySum) : null;
    }

    // Campo de "carga de tráfico" del buffer chico (0..1 por celda). Es el
    // MISMO que pinta la capa de ruido; se guarda aparte para poder leer el
    // nivel en un punto (lo necesitan las mirlas) aunque la capa esté
    // apagada.
    let noiseField = null, noiseFieldW = 0, noiseFieldH = 0, noiseFieldImg = null;

    function computeNoiseField(vehicles, w, h) {
      if (!noiseBufCtx) return;
      noiseBufCtx.clearRect(0, 0, noiseBufW, noiseBufH);
      noiseBufCtx.globalCompositeOperation = "lighter";
      const bufScaleX = noiseBufW / w, bufScaleY = noiseBufH / h;
      const metersToBufPx = view.scale * bufScaleX;
      vehicles.forEach((v) => {
        const [sx, sy] = toScreen(v.x, v.y);
        const bx = sx * bufScaleX, by = sy * bufScaleY;
        const roadType = nearestRoadType(v.x, v.y);
        const radiusMeters = ROAD_TYPE_RADIUS_M[roadType] || ROAD_TYPE_RADIUS_M.local;
        const blobR = Math.max(2, radiusMeters * metersToBufPx);
        const grad = noiseBufCtx.createRadialGradient(bx, by, 0, bx, by, blobR);
        grad.addColorStop(0, "rgba(255,255,255,0.9)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        noiseBufCtx.fillStyle = grad;
        noiseBufCtx.beginPath();
        noiseBufCtx.arc(bx, by, blobR, 0, Math.PI * 2);
        noiseBufCtx.fill();
      });
      noiseBufCtx.globalCompositeOperation = "source-over";
      const img = noiseBufCtx.getImageData(0, 0, noiseBufW, noiseBufH);
      const celdas = noiseBufW * noiseBufH;
      if (!noiseField || noiseField.length !== celdas) noiseField = new Float32Array(celdas);
      for (let i = 0, j = 0; j < celdas; i += 4, j++) noiseField[j] = img.data[i + 3] / 255;
      noiseFieldW = noiseBufW; noiseFieldH = noiseBufH; noiseFieldImg = img;
    }

    // Nivel en dB(A) en un punto de la pantalla, leído del mismo campo y con
    // la MISMA escala que su leyenda: t=0.2 → 60 dB, 0.4 → 70, 0.6 → 80…
    const NOISE_DB_BASE = 50, NOISE_DB_SPAN = 50;
    function noiseDbAtScreen(x, y, w, h) {
      if (!noiseField || !noiseFieldW) return NOISE_DB_BASE;
      const bx = Math.floor((x / w) * noiseFieldW), by = Math.floor((y / h) * noiseFieldH);
      if (bx < 0 || by < 0 || bx >= noiseFieldW || by >= noiseFieldH) return NOISE_DB_BASE;
      const t = Math.min(1, Math.pow(noiseField[by * noiseFieldW + bx], 2.4));
      return NOISE_DB_BASE + NOISE_DB_SPAN * t;
    }
    // û del enunciado: unitario que apunta desde la avenida (más ruido)
    // hacia el ave (menos ruido). Se obtiene del gradiente del propio campo,
    // así funciona con cualquier trazado de vía, no solo con una avenida.
    function noiseEscapeDir(x, y, w, h) {
      const paso = Math.max(4, w / Math.max(1, noiseFieldW));
      const gx = noiseDbAtScreen(x + paso, y, w, h) - noiseDbAtScreen(x - paso, y, w, h);
      const gy = noiseDbAtScreen(x, y + paso, w, h) - noiseDbAtScreen(x, y - paso, w, h);
      const m = Math.hypot(gx, gy);
      if (m < 1e-4) return null;
      return [-gx / m, -gy / m];
    }

    function drawNoiseLayer(vehicles, w, h) {
      if (!noiseCanvas || !noiseCtx) return;
      // NOTA: existe más arriba un motor acústico real (CNOSSOS-EU,
      // totalLevelAtReceiverDbA) ya implementado y correcto, pero todavía
      // devuelve null porque faltan los coeficientes oficiales (ver TODO).
      // Por eso este dibujo sigue usando el método visual anterior (manchas
      // + curva de intensidad), sin ningún cambio de color, transparencia
      // ni apariencia — en cuanto se completen los coeficientes, este
      // bloque se reemplaza por una llamada real a totalLevelAtReceiverDbA
      // por cada punto del buffer.
      // 2) Convertir la acumulación de intensidad (ya calculada en
      // computeNoiseField) en color — el alpha de salida es SIEMPRE el
      // mismo (NOISE_ALPHA); solo cambia el color según qué tan alta es la
      // intensidad acumulada en ese punto.
      const img = noiseFieldImg;
      if (!img) return;
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const intensity = data[i + 3] / 255; // canal alpha acumulado = "carga de tráfico"
        if (intensity < 0.02) {
          data[i + 3] = 0; // sin tráfico cerca: transparente, se ve el mapa
          continue;
        }
        // Antes la curva (exponente 0.55) empujaba los valores hacia arriba
        // muy rápido, así que con varios vehículos ya todo llegaba a rojo.
        // Con exponente >1 se estira la escala: hace falta una acumulación
        // mucho más alta para llegar a rojo, dejando ver amarillos y
        // naranjas en niveles medios de tráfico.
        const t = Math.min(1, Math.pow(intensity, 2.4));
        const [r, g, b] = noiseColorAt(t);
        data[i] = r; data[i + 1] = g; data[i + 2] = b;
        data[i + 3] = Math.round(NOISE_ALPHA * 255); // <- SIEMPRE el mismo alpha, nunca varía
      }
      noiseBufCtx.putImageData(img, 0, 0);

      // 3) Dibujar el buffer agrandado con blur para que se vea como una
      // superficie continua, no una cuadrícula de píxeles.
      noiseCtx.clearRect(0, 0, w, h);
      noiseCtx.save();
      noiseCtx.filter = `blur(${Math.max(3, w * 0.012)}px)`;
      noiseCtx.imageSmoothingEnabled = true;
      noiseCtx.drawImage(noiseBufCanvas, 0, 0, noiseBufW, noiseBufH, 0, 0, w, h);
      noiseCtx.restore();
    }

    // Calcula escala/offset para que la red quepa completa en el canvas,
    // conservando proporción (como "background-size: contain").
    function computeView(w, h) {
      const [, , bw, bh] = netData.bbox;
      const pad = 6;
      const fitScale = Math.min((w - pad * 2) / bw, (h - pad * 2) / bh);
      const scale = fitScale * EXTRA_ZOOM;
      const offX = w / 2 - CENTER_X * scale;
      // El eje Y de SUMO crece hacia el NORTE (como en UTM real), pero en
      // pantalla "y" crece hacia ABAJO — sin voltearlo, el norte queda
      // abajo y todo el mapa se ve "al revés". Por eso el signo cambia
      // aquí (+ en vez de -) para compensar el volteo que se hace en
      // toScreen.
      const offY = h / 2 + CENTER_Y * scale;
      view = { scale, offX, offY };
    }

    // Coordenadas del mundo SUMO a coordenadas de pantalla: se rota un
    // poco alrededor del centro (para enderezar la cuadrícula), y el eje Y
    // se VOLTEA (el norte de SUMO debe quedar arriba en pantalla, no abajo).
    function toScreen(x, y) {
      const rotateRad = (ROTATE_DEG * Math.PI) / 180;
      const rotCos = Math.cos(rotateRad), rotSin = Math.sin(rotateRad);
      const dx = x - CENTER_X, dy = y - CENTER_Y;
      const rx = dx * rotCos - dy * rotSin + CENTER_X;
      const ry = dx * rotSin + dy * rotCos + CENTER_Y;
      return [rx * view.scale + view.offX, -ry * view.scale + view.offY];
    }

    // ---------- Conversión de coordenadas reales (lon/lat) al sistema local
    // de SUMO — calibrada antes con un punto de referencia conocido (una
    // rotonda real de Av. Ciudad de Cali), con un error medido de ~84m.
    // Sirve para ubicar los humedales y zonas verdes (que sí conocemos en
    // coordenadas reales) sobre el mapa de SUMO (que usa su propio sistema
    // local en metros).
    const GEO_ORIG = { minLon: -74.219402, minLat: 4.597853, maxLon: -74.096915, maxLat: 4.737337 };
    const GEO_CONV_W = 10682.66, GEO_CONV_H = 6323.80;
    const GEO_CORRECTION = { dLon: 0.0005382763434624849, dLat: 0.0005305220023128498 };
    function lonLatToLocal(lon, lat) {
      const adjLon = lon - GEO_CORRECTION.dLon, adjLat = lat - GEO_CORRECTION.dLat;
      const x = ((adjLon - GEO_ORIG.minLon) / (GEO_ORIG.maxLon - GEO_ORIG.minLon)) * GEO_CONV_W;
      const y = ((adjLat - GEO_ORIG.minLat) / (GEO_ORIG.maxLat - GEO_ORIG.minLat)) * GEO_CONV_H;
      return [x, y];
    }

    // Humedales calcados a mano por el usuario sobre la imagen de referencia real
    // (coordenadas ya convertidas de píxeles de pantalla a metros reales del mapa SUMO,
    // usando la calibración EXTRA_ZOOM/CENTER_X/CENTER_Y vigente al momento de calcar).
    const TRACED_WETLANDS = [
      [[7031.6,3799.2],[7043.6,3795.2],[7051.6,3787.2],[7059.5,3779.2],[7067.5,3771.3],[7075.5,3763.3],[7083.5,3755.3],[7087.5,3743.3],[7095.4,3731.4],[7095.4,3719.4],[7103.4,3711.4],[7107.4,3699.5],[7115.4,3691.5],[7119.4,3679.5],[7127.3,3671.6],[7127.3,3659.6],[7127.3,3647.6],[7127.3,3635.7],[7127.3,3623.7],[7127.3,3611.7],[7127.3,3599.8],[7127.3,3587.8],[7119.4,3579.8],[7119.4,3567.9],[7119.4,3555.9],[7119.4,3543.9],[7119.4,3532.0],[7127.3,3524.0],[7139.3,3520.0],[7151.3,3516.0],[7163.2,3516.0],[7175.2,3516.0],[7187.2,3516.0],[7199.1,3516.0],[7211.1,3516.0],[7223.1,3520.0],[7235.0,3520.0],[7247.0,3520.0],[7259.0,3520.0],[7270.9,3520.0],[7278.9,3512.0],[7282.9,3500.1],[7294.8,3496.1],[7302.8,3488.1],[7310.8,3480.1],[7322.8,3476.1],[7334.7,3472.1],[7346.7,3472.1],[7350.7,3460.2],[7342.7,3448.2],[7330.7,3444.2],[7318.8,3440.2],[7318.8,3428.3],[7322.8,3416.3],[7322.8,3404.3],[7326.8,3392.4],[7330.7,3380.4],[7330.7,3368.4],[7330.7,3356.5],[7330.7,3344.5],[7334.7,3332.6],[7342.7,3324.6],[7342.7,3312.6],[7350.7,3304.6],[7358.7,3296.7],[7370.6,3292.7],[7378.6,3284.7],[7390.6,3284.7],[7402.5,3280.7],[7414.5,3276.7],[7422.5,3268.7],[7434.4,3264.7],[7442.4,3256.8],[7450.4,3248.8],[7450.4,3236.8],[7450.4,3224.9],[7450.4,3212.9],[7450.4,3200.9],[7450.4,3189.0],[7450.4,3177.0],[7450.4,3165.0],[7450.4,3153.1],[7450.4,3141.1],[7462.4,3137.1],[7474.3,3137.1],[7478.3,3125.2],[7478.3,3113.2],[7474.3,3101.2],[7474.3,3089.3],[7474.3,3077.3],[7474.3,3065.3],[7474.3,3053.4],[7474.3,3041.4],[7478.3,3029.4],[7486.3,3021.5],[7490.3,3009.5],[7494.3,2997.5],[7502.2,2989.6],[7510.2,2981.6],[7514.2,2993.5],[7518.2,3005.5],[7530.2,3009.5],[7538.1,3001.5],[7538.1,2989.6],[7546.1,2981.6],[7554.1,2973.6],[7566.1,2969.6],[7578.0,2969.6],[7578.0,2981.6],[7570.0,2993.5],[7570.0,3005.5],[7562.1,3013.5],[7562.1,3025.4],[7558.1,3037.4],[7554.1,3049.4],[7550.1,3061.3],[7550.1,3073.3],[7542.1,3085.3],[7538.1,3097.2],[7534.1,3109.2],[7534.1,3121.2],[7530.2,3133.1],[7530.2,3145.1],[7526.2,3157.1],[7526.2,3169.0],[7530.2,3181.0],[7538.1,3189.0],[7546.1,3196.9],[7554.1,3204.9],[7562.1,3212.9],[7570.0,3220.9],[7578.0,3228.9],[7582.0,3240.8],[7586.0,3252.8],[7594.0,3260.8],[7605.9,3264.7],[7613.9,3272.7],[7621.9,3280.7],[7625.9,3292.7],[7629.9,3304.6],[7625.9,3316.6],[7617.9,3324.6],[7609.9,3332.6],[7601.9,3340.5],[7590.0,3344.5],[7578.0,3348.5],[7566.1,3348.5],[7554.1,3348.5],[7546.1,3360.5],[7538.1,3368.4],[7530.2,3376.4],[7522.2,3384.4],[7518.2,3396.4],[7506.2,3404.3],[7498.3,3412.3],[7490.3,3424.3],[7482.3,3432.3],[7474.3,3444.2],[7474.3,3456.2],[7462.4,3460.2],[7454.4,3468.2],[7442.4,3472.1],[7434.4,3480.1],[7422.5,3480.1],[7410.5,3480.1],[7398.5,3480.1],[7386.6,3484.1],[7378.6,3492.1],[7374.6,3508.0],[7366.6,3516.0],[7366.6,3528.0],[7362.6,3539.9],[7362.6,3551.9],[7366.6,3563.9],[7366.6,3575.8],[7362.6,3587.8],[7362.6,3599.8],[7362.6,3611.7],[7362.6,3623.7],[7362.6,3635.7],[7362.6,3647.6],[7358.7,3659.6],[7350.7,3667.6],[7342.7,3675.5],[7334.7,3683.5],[7330.7,3695.5],[7326.8,3707.5],[7318.8,3715.4],[7310.8,3723.4],[7298.8,3731.4],[7290.9,3739.4],[7278.9,3743.3],[7270.9,3751.3],[7259.0,3759.3],[7251.0,3767.3],[7243.0,3775.3],[7235.0,3783.2],[7223.1,3791.2],[7219.1,3803.2],[7215.1,3815.1],[7203.1,3823.1],[7191.2,3827.1],[7183.2,3835.1],[7175.2,3843.1],[7163.2,3847.0],[7155.3,3855.0],[7143.3,3859.0],[7135.3,3867.0],[7123.3,3867.0],[7115.4,3875.0],[7103.4,3875.0],[7095.4,3882.9],[7083.5,3886.9],[7071.5,3890.9],[7059.5,3894.9],[7047.6,3894.9],[7035.6,3894.9],[7023.6,3890.9],[7015.7,3882.9],[7003.7,3875.0],[6991.7,3871.0],[6979.8,3871.0],[6967.8,3867.0],[6959.8,3859.0],[6959.8,3847.0],[6967.8,3839.1],[6975.8,3831.1],[6983.8,3823.1],[6995.7,3815.1],[7007.7,3811.2],[7015.7,3803.2],[7023.6,3795.2]],
      [[5894.9,2124.1],[5902.9,2112.1],[5910.9,2104.1],[5918.9,2096.2],[5926.8,2088.2],[5926.8,2076.2],[5926.8,2064.3],[5922.9,2052.3],[5910.9,2048.3],[5910.9,2036.3],[5910.9,2024.4],[5918.9,2016.4],[5926.8,2008.4],[5938.8,2004.4],[5942.8,1992.5],[5946.8,1980.5],[5954.8,1972.5],[5962.7,1964.6],[5966.7,1952.6],[5974.7,1944.6],[5982.7,1932.6],[5990.7,1924.7],[6002.6,1924.7],[6014.6,1932.6],[6026.6,1936.6],[6038.5,1944.6],[6050.5,1940.6],[6054.5,1928.7],[6058.5,1916.7],[6066.4,1908.7],[6074.4,1900.7],[6082.4,1892.8],[6090.4,1884.8],[6098.3,1876.8],[6106.3,1868.8],[6114.3,1860.9],[6122.3,1852.9],[6134.2,1844.9],[6146.2,1836.9],[6154.2,1828.9],[6162.2,1821.0],[6174.1,1817.0],[6182.1,1809.0],[6194.1,1809.0],[6206.0,1813.0],[6218.0,1817.0],[6230.0,1817.0],[6241.9,1817.0],[6253.9,1817.0],[6265.9,1817.0],[6277.8,1813.0],[6289.8,1809.0],[6301.8,1805.0],[6313.7,1801.0],[6325.7,1801.0],[6333.7,1809.0],[6325.7,1821.0],[6313.7,1825.0],[6301.8,1828.9],[6289.8,1832.9],[6277.8,1836.9],[6265.9,1836.9],[6253.9,1836.9],[6237.9,1836.9],[6226.0,1836.9],[6218.0,1844.9],[6206.0,1844.9],[6198.1,1852.9],[6186.1,1856.9],[6178.1,1864.8],[6166.1,1868.8],[6154.2,1876.8],[6146.2,1884.8],[6134.2,1892.8],[6126.3,1900.7],[6118.3,1908.7],[6114.3,1920.7],[6106.3,1928.7],[6098.3,1940.6],[6098.3,1952.6],[6094.4,1964.6],[6086.4,1976.5],[6078.4,1984.5],[6074.4,1996.5],[6066.4,2004.4],[6062.5,2016.4],[6054.5,2028.4],[6046.5,2036.3],[6038.5,2044.3],[6030.5,2052.3],[6018.6,2056.3],[6010.6,2064.3],[6006.6,2076.2],[5998.6,2084.2],[5994.7,2096.2],[5986.7,2104.1],[5982.7,2116.1],[5974.7,2124.1],[5966.7,2132.1],[5954.8,2140.0],[5946.8,2148.0],[5938.8,2156.0],[5930.8,2164.0],[5922.9,2175.9],[5910.9,2175.9],[5898.9,2171.9],[5891.0,2164.0],[5883.0,2156.0],[5879.0,2144.0],[5883.0,2132.1],[5891.0,2124.1],[5902.9,2120.1],[5910.9,2112.1]],
      [[5727.4,1374.3],[5719.5,1386.2],[5711.5,1394.2],[5699.5,1402.2],[5691.5,1410.2],[5687.5,1422.1],[5679.6,1430.1],[5671.6,1438.1],[5667.6,1450.1],[5659.6,1458.0],[5651.7,1466.0],[5651.7,1478.0],[5639.7,1486.0],[5631.7,1493.9],[5623.7,1501.9],[5615.8,1509.9],[5607.8,1517.9],[5599.8,1529.8],[5591.8,1537.8],[5583.9,1545.8],[5571.9,1549.8],[5567.9,1537.8],[5575.9,1529.8],[5579.9,1517.9],[5587.8,1509.9],[5591.8,1497.9],[5599.8,1489.9],[5603.8,1478.0],[5603.8,1466.0],[5607.8,1454.0],[5607.8,1442.1],[5611.8,1430.1],[5619.7,1422.1],[5627.7,1414.2],[5627.7,1402.2],[5635.7,1394.2],[5639.7,1382.3],[5647.7,1374.3],[5651.7,1362.3]],
      [[8204.2,4182.1],[8196.2,4174.1],[8184.2,4170.1],[8176.3,4162.1],[8164.3,4162.1],[8156.3,4154.1],[8144.4,4154.1],[8136.4,4146.2],[8128.4,4138.2],[8116.4,4134.2],[8116.4,4122.2],[8112.5,4110.3],[8108.5,4098.3],[8104.5,4086.3],[8096.5,4078.4],[8084.5,4074.4],[8076.6,4066.4],[8064.6,4062.4],[8056.6,4054.4],[8056.6,4042.5],[8064.6,4034.5],[8072.6,4026.5],[8080.5,4018.5],[8088.5,4010.6],[8096.5,4002.6],[8104.5,3994.6],[8116.4,3990.6],[8128.4,3986.6],[8136.4,3978.7],[8144.4,3970.7],[8152.3,3962.7],[8156.3,3950.7],[8164.3,3938.8],[8164.3,3926.8],[8172.3,3918.8],[8176.3,3906.9],[8180.3,3894.9],[8184.2,3882.9],[8184.2,3871.0],[8184.2,3859.0],[8192.2,3851.0],[8200.2,3843.1],[8212.2,3839.1],[8224.1,3839.1],[8236.1,3843.1],[8244.1,3831.1],[8252.0,3823.1],[8252.0,3807.2],[8252.0,3795.2],[8252.0,3783.2],[8252.0,3771.3],[8248.1,3759.3],[8256.0,3751.3],[8260.0,3739.4],[8268.0,3731.4],[8276.0,3723.4],[8284.0,3715.4],[8291.9,3707.5],[8299.9,3699.5],[8307.9,3691.5],[8319.8,3691.5],[8327.8,3683.5],[8335.8,3675.5],[8339.8,3663.6],[8347.8,3655.6],[8355.7,3647.6],[8367.7,3643.6],[8367.7,3655.6],[8379.7,3659.6],[8387.7,3667.6],[8395.6,3675.5],[8403.6,3683.5],[8411.6,3691.5],[8415.6,3703.5],[8411.6,3715.4],[8411.6,3727.4],[8403.6,3735.4],[8391.6,3739.4],[8383.7,3751.3],[8375.7,3759.3],[8363.7,3763.3],[8359.7,3775.3],[8351.8,3783.2],[8351.8,3795.2],[8343.8,3803.2],[8343.8,3815.1],[8343.8,3827.1],[8343.8,3839.1],[8343.8,3851.0],[8339.8,3863.0],[8339.8,3875.0],[8339.8,3886.9],[8347.8,3894.9],[8355.7,3906.9],[8363.7,3914.8],[8367.7,3926.8],[8375.7,3934.8],[8379.7,3946.8],[8387.7,3954.7],[8395.6,3962.7],[8395.6,3974.7],[8395.6,3986.6],[8383.7,3994.6],[8375.7,4002.6],[8367.7,4010.6],[8363.7,4022.5],[8351.8,4026.5],[8343.8,4034.5],[8335.8,4042.5],[8331.8,4054.4],[8323.8,4062.4],[8319.8,4074.4],[8311.9,4082.4],[8299.9,4086.3],[8287.9,4086.3],[8280.0,4094.3],[8280.0,4106.3],[8280.0,4118.3],[8280.0,4130.2],[8280.0,4142.2],[8280.0,4154.1],[8276.0,4166.1],[8264.0,4166.1],[8256.0,4174.1],[8248.1,4182.1],[8236.1,4186.1],[8224.1,4186.1]],
    ];

    // Ríos calcados a mano por el usuario con la herramienta de línea
    // (coordenadas convertidas de píxeles de pantalla a metros reales, igual
    // que los humedales; se filtraron 2 trazos diminutos y accidentales).
    const TRACED_RIVERS = [
      { width: 6, points: [[3414.2,4449.3],[3426.2,4449.3],[3438.1,4449.3],[3454.1,4449.3],[3466.0,4453.3],[3478.0,4461.2],[3490.0,4461.2],[3498.0,4469.2],[3505.9,4477.2],[3517.9,4481.2],[3525.9,4489.2],[3533.9,4497.1],[3537.8,4509.1],[3549.8,4517.1],[3557.8,4525.1],[3565.8,4533.0],[3573.7,4541.0],[3581.7,4549.0],[3589.7,4557.0],[3597.7,4564.9],[3609.6,4568.9],[3617.6,4576.9],[3625.6,4584.9],[3637.5,4592.9],[3649.5,4596.9],[3657.5,4604.8],[3669.5,4604.8],[3681.4,4612.8],[3693.4,4616.8],[3705.3,4616.8],[3717.3,4616.8],[3729.3,4616.8],[3741.2,4616.8],[3753.2,4616.8],[3761.2,4608.8],[3765.2,4596.9],[3765.2,4584.9],[3765.2,4572.9],[3765.2,4557.0],[3765.2,4545.0],[3757.2,4537.0],[3753.2,4521.1],[3753.2,4509.1],[3745.2,4501.1],[3737.3,4489.2],[3733.3,4477.2],[3725.3,4469.2],[3717.3,4457.3],[3713.3,4445.3],[3705.3,4433.3],[3701.4,4421.4],[3693.4,4409.4],[3693.4,4397.4],[3689.4,4385.5],[3681.4,4377.5],[3681.4,4365.5],[3677.4,4353.6],[3673.4,4341.6],[3669.5,4329.6],[3661.5,4317.7],[3657.5,4305.7],[3653.5,4293.7],[3645.5,4281.8],[3641.5,4269.8],[3633.6,4261.8],[3629.6,4249.9],[3621.6,4237.9],[3613.6,4229.9],[3605.6,4218.0],[3597.7,4210.0],[3593.7,4198.0],[3585.7,4190.0],[3581.7,4178.1],[3573.7,4170.1],[3569.7,4158.1],[3561.8,4150.2],[3557.8,4134.2],[3549.8,4122.2],[3545.8,4110.3],[3541.8,4098.3],[3537.8,4086.3],[3529.9,4074.4],[3525.9,4062.4],[3517.9,4054.4],[3513.9,4042.5],[3513.9,4030.5],[3509.9,4018.5],[3509.9,4006.6],[3509.9,3994.6],[3517.9,3986.6],[3525.9,3978.7],[3537.8,3978.7],[3549.8,3978.7],[3561.8,3978.7],[3573.7,3978.7],[3585.7,3982.6],[3597.7,3986.6],[3609.6,3990.6],[3621.6,3998.6],[3637.5,4006.6],[3645.5,4014.6],[3653.5,4022.5],[3665.5,4026.5],[3673.4,4034.5],[3681.4,4042.5],[3693.4,4050.5],[3705.3,4054.4],[3717.3,4066.4],[3729.3,4070.4],[3741.2,4074.4],[3749.2,4082.4],[3761.2,4090.3],[3773.2,4094.3],[3781.1,4102.3],[3793.1,4106.3],[3801.1,4114.3],[3809.0,4122.2],[3821.0,4126.2],[3829.0,4134.2],[3837.0,4146.2],[3844.9,4154.1],[3852.9,4162.1],[3860.9,4170.1],[3868.9,4182.1],[3876.8,4190.0],[3876.8,4202.0],[3884.8,4210.0],[3892.8,4221.9],[3896.8,4233.9],[3908.8,4241.9],[3920.7,4253.9],[3924.7,4265.8],[3936.7,4277.8],[3944.6,4293.7],[3952.6,4305.7],[3960.6,4317.7],[3968.6,4329.6],[3980.5,4349.6],[3988.5,4357.6],[3996.5,4377.5],[4004.5,4385.5],[4016.4,4401.4],[4024.4,4409.4],[4032.4,4417.4],[4040.4,4425.4],[4040.4,4437.3],[4048.3,4449.3],[4056.3,4461.2],[4060.3,4473.2],[4068.3,4485.2],[4072.3,4497.1],[4080.3,4509.1],[4080.3,4521.1],[4088.2,4533.0],[4092.2,4545.0],[4104.2,4557.0],[4112.2,4564.9],[4116.1,4576.9],[4128.1,4584.9],[4140.1,4592.9],[4152.0,4596.9],[4160.0,4604.8],[4172.0,4608.8],[4180.0,4616.8],[4187.9,4624.8],[4199.9,4624.8],[4211.9,4632.7],[4223.8,4636.7],[4235.8,4648.7],[4247.8,4648.7],[4255.7,4656.7],[4271.7,4664.7],[4283.7,4672.6],[4291.6,4680.6],[4303.6,4684.6],[4315.6,4688.6],[4327.5,4696.6],[4339.5,4700.5],[4347.5,4708.5],[4355.4,4716.5],[4367.4,4724.5],[4375.4,4732.5],[4383.4,4740.4],[4391.3,4748.4],[4399.3,4756.4],[4411.3,4764.4],[4419.3,4772.3],[4431.2,4780.3],[4443.2,4784.3],[4455.2,4792.3],[4463.1,4800.3],[4475.1,4804.2],[4487.1,4808.2],[4499.0,4808.2],[4511.0,4808.2],[4523.0,4812.2],[4534.9,4812.2],[4546.9,4812.2],[4558.9,4808.2],[4574.8,4804.2],[4586.8,4800.3],[4598.7,4796.3],[4610.7,4796.3],[4626.7,4796.3],[4638.6,4796.3],[4650.6,4796.3],[4662.5,4796.3],[4674.5,4796.3],[4686.5,4800.3],[4698.4,4800.3],[4706.4,4808.2],[4718.4,4812.2],[4726.4,4824.2],[4738.3,4832.2],[4742.3,4844.1],[4750.3,4852.1],[4758.3,4860.1],[4766.2,4868.1],[4778.2,4876.0],[4786.2,4884.0],[4790.2,4896.0],[4798.2,4904.0],[4806.1,4911.9],[4814.1,4923.9],[4822.1,4931.9],[4830.1,4939.8],[4838.0,4947.8],[4850.0,4963.8],[4862.0,4971.8],[4869.9,4979.7],[4877.9,4987.7],[4885.9,4995.7],[4893.9,5003.7],[4905.8,5011.6],[4913.8,5019.6],[4925.8,5027.6],[4933.8,5035.6],[4945.7,5043.5],[4953.7,5051.5],[4965.7,5055.5],[4977.6,5059.5],[4989.6,5067.5],[5001.6,5071.5],[5013.5,5075.5],[5029.5,5079.4],[5041.4,5083.4],[5053.4,5087.4],[5065.4,5087.4],[5077.3,5087.4],[5089.3,5087.4],[5101.3,5087.4],[5113.2,5087.4],[5125.2,5083.4],[5133.2,5075.5],[5145.1,5071.5],[5161.1,5071.5],[5173.1,5067.5],[5185.0,5063.5],[5197.0,5063.5],[5208.9,5055.5],[5220.9,5051.5],[5232.9,5047.5],[5240.9,5039.6],[5248.8,5031.6],[5260.8,5023.6],[5272.8,5023.6],[5280.7,5015.6],[5292.7,5011.6],[5304.7,5003.7],[5316.6,4999.7],[5328.6,4995.7],[5340.6,4991.7],[5352.5,4991.7],[5364.5,4987.7],[5376.5,4983.7],[5388.4,4983.7],[5400.4,4983.7],[5412.4,4983.7],[5424.3,4983.7],[5436.3,4983.7],[5448.2,4987.7],[5460.2,4991.7],[5472.2,4991.7],[5484.1,4995.7],[5496.1,4999.7],[5508.1,5003.7],[5520.0,5007.7],[5528.0,5015.6],[5540.0,5019.6],[5548.0,5031.6],[5555.9,5039.6],[5559.9,5051.5],[5567.9,5059.5],[5571.9,5071.5],[5575.9,5083.4],[5575.9,5095.4],[5575.9,5107.4],[5575.9,5119.3],[5579.9,5131.3],[5579.9,5143.3],[5579.9,5155.2],[5583.9,5167.2],[5587.8,5179.1],[5587.8,5191.1],[5587.8,5203.1],[5587.8,5215.0],[5587.8,5227.0],[5591.8,5239.0],[5595.8,5250.9],[5599.8,5262.9],[5599.8,5274.9],[5599.8,5286.8],[5603.8,5298.8],[5607.8,5310.8],[5611.8,5322.7],[5615.8,5334.7],[5619.7,5346.7],[5623.7,5358.6],[5627.7,5370.6],[5635.7,5378.6],[5643.7,5386.5],[5655.6,5390.5],[5667.6,5390.5],[5679.6,5390.5],[5691.5,5390.5],[5703.5,5390.5],[5715.5,5386.5],[5727.4,5382.6],[5739.4,5378.6],[5751.4,5374.6],[5759.3,5366.6],[5767.3,5358.6],[5775.3,5350.6],[5783.3,5342.7],[5783.3,5330.7],[5791.2,5322.7],[5799.2,5310.8],[5807.2,5302.8],[5815.2,5294.8],[5823.2,5286.8],[5835.1,5278.9],[5847.1,5274.9],[5859.0,5270.9],[5871.0,5266.9],[5883.0,5262.9],[5894.9,5258.9],[5906.9,5258.9],[5918.9,5258.9],[5930.8,5258.9],[5942.8,5262.9],[5954.8,5266.9],[5966.7,5270.9],[5974.7,5278.9],[5982.7,5286.8],[5990.7,5294.8],[5998.6,5302.8],[6002.6,5314.8],[6010.6,5330.7],[6018.6,5338.7],[6018.6,5350.6],[6026.6,5358.6],[6030.5,5370.6]] },
      { width: 6, points: [[7195.1,5322.7],[7203.1,5330.7],[7223.1,5322.7],[7235.0,5322.7],[7251.0,5318.7],[7262.9,5318.7],[7274.9,5318.7],[7286.9,5318.7],[7298.8,5314.8],[7310.8,5314.8],[7322.8,5314.8],[7334.7,5314.8],[7346.7,5314.8],[7358.7,5314.8],[7370.6,5314.8],[7382.6,5314.8],[7394.6,5314.8],[7406.5,5314.8],[7418.5,5314.8],[7430.5,5314.8],[7446.4,5314.8],[7458.4,5314.8],[7470.3,5314.8],[7486.3,5314.8],[7502.2,5314.8],[7514.2,5314.8],[7526.2,5314.8],[7538.1,5314.8],[7550.1,5314.8],[7562.1,5314.8],[7574.0,5314.8],[7586.0,5314.8],[7601.9,5314.8],[7613.9,5314.8],[7629.9,5314.8],[7649.8,5314.8],[7665.8,5314.8],[7681.7,5314.8],[7693.7,5318.7],[7705.6,5318.7],[7717.6,5322.7],[7729.6,5326.7],[7741.5,5330.7],[7753.5,5330.7]] },
      { width: 7.5, points: [[3394.3,3815.1],[3406.2,3811.2],[3418.2,3811.2],[3430.2,3811.2],[3442.1,3811.2],[3454.1,3807.2],[3466.0,3803.2],[3478.0,3799.2],[3490.0,3795.2],[3501.9,3795.2],[3513.9,3795.2],[3529.9,3795.2],[3541.8,3795.2],[3553.8,3795.2],[3561.8,3803.2],[3573.7,3803.2],[3585.7,3803.2],[3593.7,3811.2],[3605.6,3815.1],[3617.6,3815.1],[3629.6,3819.1],[3641.5,3823.1],[3653.5,3823.1],[3665.5,3827.1],[3677.4,3827.1],[3689.4,3831.1],[3701.4,3831.1],[3709.3,3839.1],[3721.3,3843.1],[3733.3,3847.0],[3741.2,3855.0],[3757.2,3859.0],[3769.2,3867.0],[3781.1,3867.0],[3793.1,3871.0],[3805.1,3879.0],[3817.0,3882.9],[3829.0,3886.9],[3837.0,3894.9],[3848.9,3898.9],[3856.9,3906.9],[3868.9,3914.8],[3880.8,3918.8],[3888.8,3926.8],[3900.8,3934.8],[3908.8,3942.8],[3920.7,3946.8],[3928.7,3954.7],[3936.7,3962.7],[3948.6,3970.7],[3952.6,3982.6],[3960.6,3990.6],[3968.6,3998.6],[3968.6,4010.6],[3976.6,4018.5],[3980.5,4030.5],[3988.5,4038.5],[3992.5,4050.5],[4004.5,4066.4],[4008.5,4078.4],[4016.4,4094.3],[4020.4,4106.3],[4028.4,4118.3],[4032.4,4134.2],[4040.4,4146.2],[4044.4,4158.1],[4048.3,4170.1],[4056.3,4178.1],[4060.3,4190.0],[4068.3,4198.0],[4076.3,4206.0],[4084.2,4214.0],[4092.2,4221.9],[4100.2,4229.9],[4108.2,4237.9],[4116.1,4249.9],[4124.1,4257.8],[4132.1,4269.8],[4140.1,4277.8],[4144.1,4289.8],[4152.0,4297.7],[4160.0,4305.7],[4168.0,4317.7],[4176.0,4325.6],[4183.9,4333.6],[4191.9,4341.6],[4207.9,4349.6],[4219.8,4365.5],[4231.8,4373.5],[4239.8,4381.5],[4255.7,4397.4],[4263.7,4405.4],[4267.7,4417.4],[4279.7,4421.4],[4291.6,4429.3],[4299.6,4437.3],[4307.6,4445.3],[4319.6,4449.3],[4327.5,4457.3],[4339.5,4465.2],[4351.5,4469.2],[4359.4,4477.2],[4371.4,4481.2],[4379.4,4489.2],[4387.4,4497.1],[4399.3,4505.1],[4411.3,4509.1],[4423.2,4521.1],[4439.2,4525.1],[4447.2,4533.0],[4459.1,4537.0],[4467.1,4545.0],[4483.1,4549.0],[4495.0,4557.0],[4503.0,4564.9],[4515.0,4564.9],[4523.0,4572.9],[4534.9,4576.9],[4546.9,4584.9],[4558.9,4584.9],[4570.8,4588.9],[4582.8,4592.9],[4594.7,4596.9],[4606.7,4600.8],[4618.7,4604.8],[4630.6,4604.8],[4642.6,4608.8],[4654.6,4616.8],[4666.5,4616.8],[4678.5,4620.8],[4690.5,4624.8],[4706.4,4628.8],[4718.4,4632.7],[4730.3,4636.7],[4742.3,4640.7],[4754.3,4644.7],[4770.2,4648.7],[4778.2,4656.7],[4790.2,4660.7],[4802.1,4664.7],[4814.1,4668.6],[4826.1,4672.6],[4838.0,4676.6],[4850.0,4680.6],[4862.0,4684.6],[4873.9,4688.6],[4885.9,4692.6],[4897.9,4696.6],[4909.8,4700.5],[4921.8,4704.5],[4937.7,4708.5],[4953.7,4712.5],[4965.7,4712.5],[4977.6,4712.5],[4993.6,4716.5],[5005.5,4720.5],[5017.5,4724.5],[5029.5,4724.5],[5041.4,4728.5],[5057.4,4728.5],[5069.4,4732.5],[5081.3,4732.5],[5093.3,4736.4],[5105.3,4736.4],[5117.2,4736.4],[5129.2,4740.4],[5141.1,4740.4],[5157.1,4744.4],[5169.1,4748.4],[5185.0,4748.4],[5197.0,4752.4],[5208.9,4752.4],[5220.9,4756.4],[5232.9,4756.4],[5244.8,4756.4],[5256.8,4756.4],[5268.8,4756.4],[5280.7,4756.4],[5292.7,4756.4],[5304.7,4756.4],[5316.6,4760.4],[5328.6,4764.4],[5340.6,4768.4],[5356.5,4768.4],[5368.5,4772.3],[5380.4,4780.3],[5392.4,4784.3],[5400.4,4796.3],[5412.4,4796.3],[5420.3,4804.2],[5432.3,4808.2],[5440.3,4816.2],[5452.2,4820.2],[5464.2,4828.2],[5476.2,4828.2],[5488.1,4828.2],[5500.1,4832.2],[5512.1,4832.2],[5524.0,4832.2],[5536.0,4832.2],[5548.0,4832.2],[5559.9,4832.2],[5571.9,4832.2],[5583.9,4832.2],[5595.8,4832.2],[5607.8,4832.2],[5619.7,4832.2],[5631.7,4828.2],[5643.7,4824.2],[5655.6,4820.2],[5667.6,4816.2],[5679.6,4816.2],[5691.5,4816.2],[5703.5,4816.2],[5715.5,4816.2],[5727.4,4816.2],[5735.4,4824.2],[5747.4,4824.2],[5759.3,4828.2],[5767.3,4836.2],[5779.3,4836.2],[5787.3,4844.1],[5799.2,4848.1],[5807.2,4856.1],[5819.2,4864.1],[5831.1,4868.1],[5843.1,4876.0],[5855.1,4880.0],[5867.0,4888.0],[5879.0,4892.0],[5887.0,4900.0],[5898.9,4907.9],[5910.9,4911.9],[5922.9,4919.9],[5934.8,4923.9],[5942.8,4931.9],[5954.8,4935.9],[5962.7,4943.8],[5974.7,4951.8],[5986.7,4959.8],[5994.7,4967.8],[6006.6,4971.8],[6014.6,4979.7],[6026.6,4979.7],[6034.5,4987.7],[6042.5,4995.7],[6054.5,4999.7],[6066.4,5011.6],[6078.4,5019.6],[6086.4,5027.6],[6098.3,5031.6],[6110.3,5039.6],[6122.3,5043.5],[6130.3,5051.5],[6142.2,5059.5],[6154.2,5063.5],[6162.2,5075.5],[6174.1,5075.5],[6182.1,5083.4],[6190.1,5091.4],[6202.0,5095.4],[6210.0,5103.4],[6222.0,5107.4],[6230.0,5115.3],[6241.9,5123.3],[6253.9,5127.3],[6261.9,5135.3],[6273.8,5143.3],[6285.8,5147.2],[6293.8,5155.2],[6305.7,5159.2],[6313.7,5167.2],[6325.7,5167.2],[6333.7,5175.2],[6345.6,5179.1],[6353.6,5187.1],[6365.6,5191.1],[6373.5,5199.1],[6381.5,5207.1],[6393.5,5211.1],[6401.5,5219.0],[6409.4,5227.0],[6417.4,5235.0],[6429.4,5243.0],[6437.4,5250.9],[6449.3,5254.9],[6457.3,5262.9],[6465.3,5270.9],[6477.2,5274.9],[6485.2,5282.8],[6497.2,5290.8],[6509.1,5298.8],[6521.1,5306.8],[6529.1,5314.8],[6541.1,5318.7],[6549.0,5326.7],[6561.0,5334.7],[6573.0,5338.7],[6580.9,5346.7],[6592.9,5354.6],[6600.9,5362.6],[6612.8,5366.6],[6620.8,5374.6],[6628.8,5382.6],[6640.8,5386.5],[6648.7,5394.5]] },
      { width: 5, points: [[8834.3,5243.0],[8834.3,5231.0],[8834.3,5219.0],[8834.3,5207.1],[8834.3,5195.1],[8834.3,5183.1],[8842.3,5175.2],[8850.3,5163.2],[8858.3,5155.2],[8866.3,5147.2],[8874.2,5139.3],[8882.2,5131.3],[8890.2,5123.3],[8898.2,5115.3],[8906.1,5107.4],[8914.1,5099.4],[8922.1,5087.4],[8930.1,5075.5],[8938.0,5067.5],[8946.0,5055.5],[8954.0,5043.5],[8962.0,5035.6],[8969.9,5027.6],[8973.9,5015.6],[8981.9,5007.7],[8989.9,4995.7],[8993.9,4983.7],[9001.9,4975.7],[9001.9,4963.8],[9009.8,4955.8],[9009.8,4943.8],[9017.8,4935.9],[9021.8,4923.9],[9025.8,4911.9],[9029.8,4900.0],[9033.8,4888.0],[9041.7,4880.0],[9045.7,4868.1],[9049.7,4856.1],[9057.7,4848.1],[9061.7,4836.2],[9069.7,4828.2],[9073.6,4816.2],[9081.6,4804.2],[9085.6,4788.3],[9093.6,4776.3],[9097.6,4764.4],[9101.6,4752.4],[9109.5,4744.4],[9117.5,4732.5],[9125.5,4724.5],[9133.5,4716.5],[9137.5,4704.5],[9145.4,4692.6],[9153.4,4684.6],[9161.4,4676.6],[9165.4,4664.7],[9173.4,4656.7],[9173.4,4644.7],[9185.3,4636.7],[9193.3,4624.8],[9197.3,4612.8],[9205.3,4604.8],[9205.3,4592.9],[9209.2,4580.9],[9213.2,4568.9],[9221.2,4557.0],[9225.2,4545.0],[9233.2,4537.0],[9237.2,4525.1],[9245.1,4513.1],[9249.1,4501.1],[9257.1,4493.2],[9257.1,4481.2],[9265.1,4473.2],[9269.1,4461.2],[9281.0,4449.3],[9285.0,4437.3],[9293.0,4425.4],[9301.0,4417.4],[9305.0,4405.4],[9309.0,4393.4],[9312.9,4381.5],[9312.9,4369.5],[9320.9,4357.6],[9324.9,4345.6],[9332.9,4337.6],[9340.9,4329.6],[9348.8,4321.7],[9356.8,4309.7],[9368.8,4305.7],[9376.8,4297.7],[9388.7,4289.8],[9396.7,4281.8],[9404.7,4273.8],[9412.7,4261.8],[9420.6,4253.9],[9432.6,4249.9],[9440.6,4241.9],[9452.5,4237.9],[9460.5,4229.9],[9468.5,4221.9],[9480.5,4218.0],[9488.4,4210.0],[9496.4,4202.0],[9504.4,4194.0],[9516.3,4186.1],[9528.3,4178.1],[9540.3,4174.1],[9548.3,4166.1],[9560.2,4162.1],[9572.2,4158.1],[9584.2,4154.1],[9588.1,4142.2],[9600.1,4138.2],[9612.1,4130.2],[9620.0,4122.2],[9628.0,4114.3],[9644.0,4110.3],[9652.0,4102.3],[9659.9,4094.3],[9671.9,4090.3],[9679.9,4082.4],[9687.8,4074.4],[9695.8,4066.4],[9703.8,4058.4],[9711.8,4050.5],[9719.8,4042.5],[9731.7,4038.5],[9743.7,4030.5],[9751.7,4022.5],[9763.6,4022.5],[9771.6,4014.6],[9783.6,4010.6],[9791.5,4002.6],[9803.5,3998.6],[9815.5,3994.6],[9827.4,3990.6],[9839.4,3986.6],[9851.4,3978.7],[9863.3,3974.7],[9879.3,3974.7],[9891.3,3966.7],[9903.2,3966.7],[9915.2,3958.7],[9927.1,3954.7],[9939.1,3946.8],[9951.1,3942.8],[9959.1,3934.8],[9967.0,3926.8],[9975.0,3914.8],[9983.0,3906.9],[9991.0,3894.9],[9998.9,3886.9],[10010.9,3879.0],[10022.9,3871.0],[10034.8,3863.0],[10042.8,3855.0],[10050.8,3847.0],[10058.8,3839.1],[10066.7,3831.1],[10074.7,3823.1],[10082.7,3815.1],[10094.7,3807.2],[10106.6,3803.2],[10114.6,3795.2],[10126.6,3791.2]] },
      { width: 5, points: [[9053.7,4864.1],[9065.7,4860.1],[9077.6,4856.1],[9089.6,4848.1],[9105.6,4844.1],[9117.5,4840.1],[9129.5,4840.1],[9141.4,4840.1],[9153.4,4840.1],[9165.4,4840.1],[9177.3,4840.1],[9189.3,4844.1],[9197.3,4852.1],[9209.2,4856.1],[9221.2,4856.1],[9233.2,4856.1],[9245.1,4860.1],[9257.1,4864.1],[9265.1,4872.0],[9277.0,4876.0],[9289.0,4880.0],[9301.0,4888.0],[9309.0,4900.0],[9316.9,4907.9],[9324.9,4915.9],[9332.9,4927.9],[9340.9,4935.9],[9348.8,4947.8],[9360.8,4955.8],[9372.8,4963.8],[9380.7,4971.8],[9388.7,4979.7],[9396.7,4987.7],[9404.7,4999.7],[9412.7,5007.7],[9420.6,5015.6],[9428.6,5023.6],[9436.6,5031.6],[9444.6,5043.5],[9452.5,5059.5],[9460.5,5071.5],[9468.5,5079.4],[9472.5,5091.4],[9480.5,5099.4],[9488.4,5107.4],[9496.4,5115.3],[9504.4,5127.3],[9512.4,5139.3],[9524.3,5147.2],[9532.3,5159.2],[9540.3,5167.2],[9548.3,5175.2],[9556.2,5183.1],[9564.2,5191.1],[9572.2,5199.1],[9580.2,5207.1],[9588.1,5215.0],[9600.1,5223.0],[9612.1,5227.0],[9620.0,5235.0],[9628.0,5243.0],[9636.0,5250.9],[9644.0,5258.9],[9652.0,5266.9],[9659.9,5274.9],[9671.9,5282.8],[9679.9,5290.8],[9691.8,5298.8],[9703.8,5306.8],[9711.8,5314.8],[9719.8,5322.7],[9727.7,5330.7],[9739.7,5338.7],[9751.7,5342.7],[9759.6,5350.6],[9771.6,5354.6],[9779.6,5362.6],[9787.6,5370.6],[9799.5,5374.6],[9807.5,5382.6]] },
      { width: 2, points: [[7366.6,5290.8],[7366.6,5274.9],[7358.7,5262.9],[7358.7,5250.9],[7358.7,5239.0],[7358.7,5227.0],[7358.7,5215.0],[7358.7,5203.1],[7358.7,5191.1],[7358.7,5179.1],[7358.7,5167.2],[7362.6,5155.2],[7366.6,5143.3],[7374.6,5135.3],[7382.6,5127.3],[7394.6,5123.3],[7402.5,5115.3],[7414.5,5107.4],[7426.5,5103.4],[7438.4,5099.4],[7450.4,5095.4],[7462.4,5087.4],[7474.3,5083.4],[7482.3,5075.5],[7494.3,5075.5],[7506.2,5071.5],[7514.2,5063.5],[7526.2,5059.5],[7538.1,5055.5],[7546.1,5047.5],[7558.1,5043.5],[7566.1,5035.6],[7578.0,5027.6],[7590.0,5019.6],[7598.0,5011.6],[7605.9,5003.7],[7613.9,4995.7],[7621.9,4987.7],[7633.9,4979.7],[7649.8,4971.8],[7661.8,4967.8],[7673.7,4963.8],[7685.7,4955.8],[7697.7,4951.8],[7709.6,4947.8],[7721.6,4939.8],[7733.6,4939.8],[7741.5,4931.9],[7753.5,4931.9],[7761.5,4923.9],[7773.4,4915.9],[7785.4,4911.9],[7793.4,4904.0],[7805.4,4904.0],[7813.3,4896.0],[7825.3,4892.0],[7833.3,4884.0],[7845.2,4876.0],[7853.2,4868.1],[7869.2,4860.1],[7881.1,4856.1],[7889.1,4848.1],[7901.1,4844.1],[7913.0,4836.2],[7925.0,4832.2],[7933.0,4824.2],[7941.0,4816.2],[7948.9,4808.2],[7960.9,4800.3],[7972.9,4796.3],[7984.8,4792.3],[7992.8,4784.3],[8004.8,4780.3],[8016.7,4776.3],[8024.7,4768.4],[8036.7,4764.4],[8048.6,4756.4],[8060.6,4752.4],[8072.6,4748.4],[8084.5,4744.4],[8096.5,4736.4],[8108.5,4732.5],[8124.4,4724.5],[8136.4,4720.5],[8144.4,4712.5],[8152.3,4704.5],[8164.3,4700.5],[8172.3,4692.6],[8180.3,4684.6],[8188.2,4676.6],[8196.2,4668.6]] },
      { width: 2, points: [[6166.1,5051.5],[6166.1,5039.6],[6174.1,5027.6],[6178.1,5015.6],[6190.1,5011.6],[6198.1,4999.7],[6206.0,4991.7],[6214.0,4983.7],[6222.0,4975.7],[6234.0,4967.8],[6241.9,4955.8],[6249.9,4947.8],[6257.9,4935.9],[6261.9,4919.9],[6269.8,4907.9],[6277.8,4896.0],[6277.8,4884.0],[6285.8,4868.1],[6289.8,4856.1],[6289.8,4844.1],[6293.8,4832.2],[6301.8,4820.2],[6301.8,4808.2],[6305.7,4796.3],[6309.7,4784.3],[6317.7,4772.3],[6325.7,4760.4],[6329.7,4748.4],[6337.6,4740.4],[6341.6,4728.5],[6349.6,4720.5],[6353.6,4708.5],[6361.6,4700.5],[6369.6,4688.6],[6377.5,4676.6],[6385.5,4664.7],[6393.5,4656.7],[6401.5,4648.7],[6409.4,4640.7],[6417.4,4628.8],[6421.4,4616.8],[6429.4,4608.8],[6429.4,4596.9],[6437.4,4584.9],[6441.3,4572.9],[6449.3,4564.9],[6449.3,4549.0],[6457.3,4541.0],[6465.3,4525.1],[6473.3,4513.1],[6481.2,4497.1],[6485.2,4485.2],[6497.2,4473.2],[6505.2,4465.2],[6509.1,4453.3],[6517.1,4445.3],[6525.1,4433.3],[6533.1,4425.4],[6541.1,4413.4],[6549.0,4405.4],[6557.0,4393.4],[6565.0,4385.5],[6573.0,4377.5],[6580.9,4365.5],[6588.9,4353.6],[6596.9,4345.6],[6600.9,4333.6],[6608.9,4317.7],[6612.8,4305.7],[6616.8,4293.7],[6624.8,4277.8],[6628.8,4265.8],[6632.8,4253.9],[6640.8,4241.9],[6648.7,4225.9],[6648.7,4214.0],[6656.7,4202.0],[6660.7,4186.1],[6668.7,4174.1],[6672.7,4162.1],[6684.6,4158.1],[6688.6,4146.2],[6700.6,4130.2],[6708.6,4122.2],[6712.6,4106.3],[6720.5,4090.3],[6732.5,4082.4],[6740.5,4070.4],[6748.4,4058.4],[6756.4,4050.5],[6764.4,4038.5],[6772.4,4030.5],[6780.4,4022.5],[6788.3,4014.6],[6796.3,4006.6],[6804.3,3998.6],[6812.3,3990.6],[6820.2,3982.6],[6828.2,3974.7],[6836.2,3966.7],[6844.2,3958.7],[6852.1,3950.7],[6860.1,3942.8],[6868.1,3934.8],[6876.1,3926.8],[6884.0,3918.8],[6892.0,3910.9],[6904.0,3906.9],[6912.0,3898.9],[6923.9,3894.9],[6935.9,3890.9],[6947.9,3886.9],[6955.8,3879.0],[6971.8,3875.0],[6987.7,3867.0],[6995.7,3859.0],[7003.7,3851.0],[7011.7,3843.1],[7019.7,3835.1]] },
      { width: 2, points: [[7486.3,3145.1],[7490.3,3129.1],[7498.3,3113.2],[7506.2,3105.2],[7514.2,3093.3],[7518.2,3081.3],[7526.2,3073.3],[7534.1,3065.3],[7546.1,3061.3],[7554.1,3053.4],[7562.1,3045.4],[7570.0,3037.4],[7578.0,3029.4],[7586.0,3021.5],[7590.0,3009.5],[7594.0,2997.5],[7594.0,2985.6],[7601.9,2977.6],[7609.9,2965.6],[7617.9,2957.6],[7629.9,2949.7],[7637.8,2941.7],[7649.8,2933.7],[7661.8,2929.7],[7673.7,2925.7],[7685.7,2917.8],[7697.7,2909.8],[7705.6,2901.8],[7717.6,2893.8],[7725.6,2885.9],[7733.6,2877.9],[7741.5,2865.9],[7749.5,2857.9],[7757.5,2850.0],[7765.5,2838.0],[7773.4,2826.0],[7785.4,2818.1],[7797.4,2810.1],[7805.4,2802.1],[7817.3,2798.1],[7825.3,2790.1],[7837.3,2782.2],[7849.2,2778.2],[7857.2,2770.2],[7865.2,2762.2],[7877.1,2758.2],[7889.1,2754.2],[7901.1,2746.3],[7917.0,2742.3],[7929.0,2738.3],[7937.0,2730.3],[7952.9,2722.3],[7964.9,2718.3],[7976.9,2710.4],[7984.8,2702.4],[7996.8,2694.4],[8008.8,2686.4],[8016.7,2678.5],[8024.7,2670.5],[8032.7,2662.5],[8036.7,2650.5],[8044.7,2642.6],[8052.6,2634.6],[8064.6,2630.6],[8076.6,2630.6],[8088.5,2626.6],[8100.5,2622.6],[8108.5,2614.7],[8120.4,2610.7],[8132.4,2606.7],[8144.4,2602.7],[8156.3,2598.7],[8168.3,2594.7],[8180.3,2590.7],[8192.2,2590.7],[8204.2,2590.7],[8216.2,2590.7],[8232.1,2586.7],[8248.1,2582.7],[8260.0,2578.8],[8272.0,2570.8],[8284.0,2566.8],[8295.9,2558.8],[8307.9,2558.8],[8319.8,2558.8],[8331.8,2554.8],[8343.8,2550.8]] },
      { width: 2, points: [[3984.5,4014.6],[3992.5,4006.6],[4004.5,3998.6],[4012.5,3990.6],[4016.4,3978.7],[4024.4,3970.7],[4024.4,3958.7],[4028.4,3946.8],[4036.4,3934.8],[4044.4,3922.8],[4044.4,3910.9],[4048.3,3898.9],[4052.3,3886.9],[4056.3,3875.0],[4064.3,3863.0],[4064.3,3851.0],[4072.3,3843.1],[4080.3,3831.1],[4084.2,3819.1],[4092.2,3807.2],[4100.2,3795.2],[4108.2,3787.2],[4116.1,3779.2],[4124.1,3767.3],[4128.1,3755.3],[4132.1,3743.3],[4140.1,3727.4],[4144.1,3715.4],[4152.0,3707.5],[4156.0,3695.5],[4164.0,3687.5],[4168.0,3675.5],[4172.0,3663.6],[4183.9,3655.6],[4191.9,3647.6],[4199.9,3635.7],[4207.9,3627.7],[4211.9,3615.7],[4215.9,3603.8],[4223.8,3591.8],[4223.8,3579.8],[4231.8,3571.9],[4235.8,3559.9],[4243.8,3547.9],[4255.7,3536.0],[4263.7,3524.0],[4263.7,3512.0],[4267.7,3500.1],[4275.7,3488.1],[4283.7,3476.1],[4287.6,3464.2],[4299.6,3460.2],[4307.6,3452.2],[4315.6,3444.2],[4323.5,3436.2],[4331.5,3428.3],[4339.5,3416.3],[4343.5,3404.3],[4351.5,3396.4],[4359.4,3380.4],[4363.4,3368.4],[4363.4,3356.5],[4367.4,3344.5],[4375.4,3336.5],[4375.4,3324.6],[4383.4,3312.6],[4387.4,3300.6],[4395.3,3292.7],[4399.3,3280.7],[4407.3,3272.7],[4415.3,3264.7],[4415.3,3252.8],[4423.2,3244.8],[4435.2,3232.8],[4439.2,3220.9],[4447.2,3212.9],[4455.2,3200.9],[4463.1,3189.0],[4471.1,3177.0],[4475.1,3165.0],[4483.1,3157.1],[4487.1,3145.1],[4495.0,3137.1],[4503.0,3125.2],[4507.0,3113.2],[4511.0,3101.2],[4519.0,3093.3],[4519.0,3081.3],[4526.9,3073.3],[4526.9,3061.3],[4534.9,3053.4],[4538.9,3041.4],[4542.9,3029.4],[4546.9,3017.5],[4550.9,3005.5],[4558.9,2993.5],[4566.8,2981.6],[4574.8,2965.6],[4578.8,2953.7],[4586.8,2945.7],[4594.7,2933.7],[4602.7,2921.8],[4610.7,2909.8],[4618.7,2897.8],[4622.7,2885.9],[4626.7,2873.9],[4634.6,2865.9],[4638.6,2854.0],[4646.6,2842.0],[4654.6,2830.0],[4658.6,2818.1],[4666.5,2806.1],[4670.5,2794.1],[4678.5,2782.2],[4686.5,2774.2],[4686.5,2762.2],[4694.5,2750.3],[4698.4,2738.3],[4706.4,2726.3],[4710.4,2714.4],[4714.4,2702.4],[4722.4,2694.4],[4726.4,2682.5],[4726.4,2670.5],[4730.3,2658.5],[4734.3,2646.6],[4738.3,2634.6],[4742.3,2622.6],[4750.3,2614.7],[4754.3,2602.7],[4758.3,2590.7],[4766.2,2578.8],[4770.2,2566.8],[4774.2,2554.8],[4782.2,2542.9],[4786.2,2530.9],[4794.2,2522.9],[4802.1,2514.9],[4806.1,2503.0],[4810.1,2491.0],[4814.1,2479.0],[4818.1,2463.1],[4822.1,2447.1],[4830.1,2439.2],[4830.1,2427.2],[4842.0,2415.2],[4850.0,2407.3],[4858.0,2399.3],[4866.0,2387.3],[4873.9,2379.3],[4877.9,2367.4],[4881.9,2355.4],[4889.9,2339.5],[4893.9,2327.5],[4897.9,2315.5],[4901.8,2303.6],[4909.8,2291.6],[4917.8,2283.6],[4925.8,2271.7],[4929.8,2259.7],[4933.8,2247.7],[4941.7,2231.8],[4949.7,2223.8],[4949.7,2211.8],[4957.7,2203.9],[4965.7,2191.9],[4969.6,2179.9],[4981.6,2164.0],[4989.6,2156.0],[4997.6,2148.0],[5001.6,2136.1],[5005.5,2124.1],[5013.5,2112.1],[5017.5,2100.2],[5025.5,2088.2],[5025.5,2076.2],[5033.5,2068.2],[5037.5,2056.3],[5045.4,2048.3],[5053.4,2040.3],[5057.4,2028.4],[5065.4,2020.4],[5069.4,2008.4],[5077.3,2000.4],[5085.3,1988.5]] },
      { width: 2, points: [[5412.4,4760.4],[5420.3,4748.4],[5428.3,4740.4],[5436.3,4732.5],[5444.3,4724.5],[5452.2,4716.5],[5464.2,4708.5],[5472.2,4700.5],[5480.2,4692.6],[5488.1,4680.6],[5500.1,4672.6],[5512.1,4664.7],[5520.0,4656.7],[5532.0,4648.7],[5544.0,4640.7],[5551.9,4632.7],[5563.9,4628.8],[5571.9,4620.8],[5579.9,4612.8],[5587.8,4600.8],[5591.8,4588.9],[5595.8,4576.9],[5603.8,4568.9],[5603.8,4557.0],[5607.8,4545.0],[5611.8,4533.0],[5615.8,4521.1],[5623.7,4509.1],[5631.7,4497.1],[5639.7,4485.2],[5647.7,4473.2],[5655.6,4465.2],[5663.6,4457.3],[5671.6,4449.3],[5683.6,4449.3],[5691.5,4437.3],[5699.5,4429.3],[5707.5,4417.4],[5715.5,4409.4],[5723.4,4401.4],[5731.4,4393.4],[5739.4,4381.5],[5751.4,4369.5],[5759.3,4361.5],[5763.3,4349.6],[5775.3,4333.6],[5783.3,4325.6],[5791.2,4317.7],[5795.2,4305.7],[5807.2,4297.7],[5815.2,4289.8],[5823.2,4281.8],[5835.1,4273.8],[5843.1,4265.8],[5847.1,4253.9],[5855.1,4245.9],[5863.0,4237.9],[5871.0,4225.9],[5879.0,4214.0],[5887.0,4206.0],[5894.9,4198.0],[5902.9,4186.1],[5914.9,4178.1],[5922.9,4170.1],[5926.8,4158.1],[5938.8,4150.2],[5942.8,4138.2],[5950.8,4130.2],[5958.8,4118.3],[5970.7,4110.3],[5978.7,4098.3],[5986.7,4086.3],[5994.7,4074.4],[6002.6,4066.4],[6010.6,4054.4],[6018.6,4046.5],[6030.5,4030.5],[6038.5,4022.5],[6046.5,4010.6],[6054.5,4002.6],[6062.5,3994.6],[6074.4,3982.6],[6082.4,3974.7],[6090.4,3966.7],[6102.3,3962.7],[6110.3,3954.7],[6118.3,3946.8],[6130.3,3938.8],[6138.2,3930.8],[6150.2,3922.8],[6158.2,3910.9],[6166.1,3902.9],[6174.1,3894.9],[6182.1,3882.9],[6194.1,3871.0],[6202.0,3859.0],[6210.0,3851.0],[6218.0,3843.1],[6226.0,3835.1],[6234.0,3827.1],[6241.9,3819.1],[6249.9,3807.2],[6253.9,3795.2],[6261.9,3787.2],[6269.8,3779.2],[6273.8,3767.3],[6281.8,3759.3],[6289.8,3747.3],[6297.8,3739.4],[6305.7,3731.4],[6313.7,3723.4],[6321.7,3715.4],[6329.7,3707.5],[6341.6,3703.5],[6349.6,3695.5],[6357.6,3687.5],[6369.6,3679.5],[6381.5,3675.5],[6389.5,3667.6],[6397.5,3659.6],[6405.4,3651.6],[6413.4,3643.6],[6425.4,3635.7],[6437.4,3627.7],[6445.3,3615.7],[6453.3,3599.8],[6461.3,3591.8],[6469.3,3579.8],[6473.3,3567.9],[6481.2,3559.9],[6489.2,3551.9],[6493.2,3539.9],[6505.2,3528.0],[6517.1,3528.0],[6525.1,3516.0],[6537.1,3508.0],[6549.0,3500.1],[6557.0,3492.1],[6565.0,3484.1],[6576.9,3476.1],[6580.9,3464.2],[6584.9,3452.2],[6592.9,3444.2],[6600.9,3432.3],[6604.9,3420.3],[6612.8,3412.3],[6616.8,3400.4],[6624.8,3392.4],[6632.8,3384.4],[6644.7,3376.4],[6648.7,3364.5],[6656.7,3356.5],[6664.7,3348.5],[6672.7,3340.5],[6684.6,3328.6],[6696.6,3316.6],[6704.6,3308.6],[6716.5,3296.7],[6728.5,3280.7],[6736.5,3268.7]] },
      { width: 2, points: [[4511.0,4561.0],[4519.0,4553.0],[4526.9,4545.0],[4534.9,4537.0],[4538.9,4525.1],[4546.9,4517.1],[4554.9,4501.1],[4562.8,4493.2],[4574.8,4485.2],[4582.8,4477.2],[4590.8,4469.2],[4598.7,4461.2],[4606.7,4453.3],[4614.7,4441.3],[4622.7,4433.3],[4626.7,4421.4],[4630.6,4409.4],[4638.6,4401.4],[4642.6,4389.5],[4650.6,4381.5],[4654.6,4369.5],[4658.6,4357.6],[4666.5,4349.6],[4670.5,4337.6],[4678.5,4329.6],[4682.5,4317.7],[4690.5,4309.7],[4694.5,4297.7],[4706.4,4289.8],[4714.4,4277.8],[4722.4,4261.8],[4730.3,4253.9],[4738.3,4245.9],[4746.3,4233.9],[4750.3,4221.9],[4762.3,4218.0],[4766.2,4206.0],[4774.2,4198.0],[4786.2,4182.1],[4790.2,4170.1],[4798.2,4162.1],[4806.1,4150.2],[4814.1,4134.2],[4826.1,4122.2],[4834.0,4114.3],[4842.0,4106.3],[4850.0,4098.3],[4858.0,4086.3],[4866.0,4078.4],[4873.9,4070.4],[4881.9,4062.4],[4885.9,4050.5],[4893.9,4042.5],[4901.8,4026.5],[4909.8,4018.5],[4917.8,4006.6],[4925.8,3998.6],[4933.8,3986.6],[4945.7,3970.7],[4957.7,3958.7],[4965.7,3942.8],[4977.6,3934.8],[4981.6,3922.8],[4989.6,3910.9],[4997.6,3898.9],[5005.5,3886.9],[5013.5,3875.0],[5021.5,3859.0],[5029.5,3851.0],[5037.5,3843.1],[5045.4,3835.1],[5053.4,3823.1],[5061.4,3815.1],[5069.4,3803.2],[5077.3,3795.2],[5085.3,3783.2],[5093.3,3775.3],[5097.3,3763.3],[5105.3,3747.3],[5113.2,3731.4],[5117.2,3719.4],[5125.2,3707.5],[5133.2,3695.5],[5141.1,3687.5],[5149.1,3671.6],[5157.1,3663.6],[5165.1,3655.6],[5173.1,3643.6],[5181.0,3635.7],[5193.0,3623.7],[5205.0,3611.7],[5212.9,3599.8],[5220.9,3591.8],[5232.9,3583.8],[5240.9,3575.8],[5252.8,3567.9],[5260.8,3559.9],[5272.8,3543.9],[5280.7,3532.0],[5288.7,3524.0],[5296.7,3512.0],[5304.7,3500.1],[5312.6,3488.1],[5320.6,3480.1],[5324.6,3468.2],[5332.6,3456.2],[5344.6,3448.2],[5348.5,3436.2],[5356.5,3428.3],[5360.5,3416.3],[5368.5,3404.3],[5376.5,3396.4],[5384.4,3388.4],[5392.4,3380.4],[5396.4,3368.4],[5404.4,3360.5],[5408.4,3348.5],[5420.3,3336.5],[5428.3,3328.6],[5440.3,3316.6],[5448.2,3304.6],[5456.2,3296.7],[5468.2,3280.7],[5476.2,3268.7],[5484.1,3260.8],[5496.1,3256.8],[5508.1,3248.8],[5520.0,3240.8],[5528.0,3232.8],[5540.0,3228.9],[5544.0,3216.9],[5551.9,3208.9],[5563.9,3204.9]] },
      { width: 8, points: [[10066.7,1641.5],[10066.7,1621.6],[10066.7,1609.6],[10066.7,1597.6],[10066.7,1585.7],[10066.7,1573.7],[10066.7,1557.7],[10066.7,1545.8],[10066.7,1533.8],[10066.7,1521.8],[10066.7,1509.9],[10066.7,1497.9],[10066.7,1482.0],[10066.7,1466.0],[10066.7,1454.0],[10066.7,1438.1],[10066.7,1422.1],[10066.7,1406.2],[10066.7,1394.2],[10070.7,1382.3]] },
    ];

    // Suaviza un trazo dibujado a mano: quita puntos demasiado cercanos
    // entre sí (ruido del mouse) y dibuja con curvas suaves entre los
    // puntos que quedan (técnica de "punto medio"), en vez de líneas
    // rectas entre cada punto — así se ve una línea limpia, no quebrada.
    function reduceJitterPoints(pts, minDist) {
      if (pts.length < 3) return pts;
      const out = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const [px, py] = pts[i];
        const [lx, ly] = out[out.length - 1];
        if (Math.hypot(px - lx, py - ly) >= minDist) out.push(pts[i]);
      }
      return out;
    }
    function strokeStraightPath(ctx, pts) {
      if (pts.length < 2) return;
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    }
    // Curva suave (técnica de "punto medio") — solo para ríos, para que no
    // se vean con el trazo tan anguloso de cuando se dibujaron a mano.
    function strokeSmoothPath(ctx, pts) {
      if (pts.length < 2) return;
      ctx.moveTo(pts[0][0], pts[0][1]);
      if (pts.length === 2) { ctx.lineTo(pts[1][0], pts[1][1]); return; }
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      const last = pts[pts.length - 1];
      ctx.lineTo(last[0], last[1]);
    }

    // Posiciones actuales de las 4 esquinas de la malla de árboles en
    // pantalla (base + el desplazamiento que el usuario arrastró).
    function getTreeCorners(w, h) {
      const bb = treeWorldBBox;
      const [tlx0, tly0] = toScreen(bb.minX, bb.maxY);
      const [trx0, try0] = toScreen(bb.maxX, bb.maxY);
      const [blx0, bly0] = toScreen(bb.minX, bb.minY);
      const [brx0, bry0] = toScreen(bb.maxX, bb.minY);
      return {
        TL: { x: tlx0 + treeCornerOffsets.tl.x, y: tly0 + treeCornerOffsets.tl.y },
        TR: { x: trx0 + treeCornerOffsets.tr.x, y: try0 + treeCornerOffsets.tr.y },
        BL: { x: blx0 + treeCornerOffsets.bl.x, y: bly0 + treeCornerOffsets.bl.y },
        BR: { x: brx0 + treeCornerOffsets.br.x, y: bry0 + treeCornerOffsets.br.y },
      };
    }
    // Posición final en pantalla de un árbol, con la distorsión de 4
    // esquinas ya aplicada (interpolación bilineal) — se usa tanto para
    // dibujar como para detectar clics.
    function treeDistortedScreen(tx, ty, bb, TL, TR, BL, BR, wSpan, hSpan) {
      const u = (tx - bb.minX) / wSpan;
      const v = 1 - (ty - bb.minY) / hSpan;
      const top = { x: TL.x + (TR.x - TL.x) * u, y: TL.y + (TR.y - TL.y) * u };
      const bot = { x: BL.x + (BR.x - BL.x) * u, y: BL.y + (BR.y - BL.y) * u };
      return [top.x + (bot.x - top.x) * v, top.y + (bot.y - top.y) * v];
    }

    function drawNetwork(w, h) {
      netCtx.clearRect(0, 0, w, h);
      netCtx.lineJoin = "round";
      netCtx.lineCap = "round";
      // Humedales calcados a mano (azul), debajo de las vías para que las
      // calles se sigan viendo con claridad encima. Se suaviza el trazo
      // para que no se vea quebrado/anguloso.
      netCtx.fillStyle = "rgba(185,206,225,0.22)";
      netCtx.strokeStyle = "rgba(151,172,201,0.4)";
      netCtx.lineWidth = 1.6;
      TRACED_WETLANDS.forEach((pts) => {
        if (pts.length < 2) return;
        const screenPts = reduceJitterPoints(pts.map(([x, y]) => toScreen(x, y)), 4);
        netCtx.beginPath();
        strokeStraightPath(netCtx, screenPts);
        if (screenPts.length > 2) { netCtx.closePath(); netCtx.fill(); }
        netCtx.stroke();
      });
      // Ríos calcados a mano con la herramienta de línea. Color más
      // saturado y opaco que los humedales (por separado), para que no se
      // laven visualmente debajo de la capa de ruido que va encima. Se
      // suaviza el trazo (a diferencia de los humedales) para que no se
      // vea tan "dibujado a mano".
      netCtx.strokeStyle = "rgba(151,172,201,0.5)";
      TRACED_RIVERS.forEach(({ width, points }) => {
        if (points.length < 2) return;
        const screenPts = reduceJitterPoints(points.map(([x, y]) => toScreen(x, y)), 6);
        netCtx.lineWidth = Math.max(3, width);
        netCtx.beginPath();
        strokeSmoothPath(netCtx, screenPts);
        netCtx.stroke();
      });
      // Refugio verde del rincón superior izquierdo: la tierra que queda
      // entre la esquina del mapa y el río, pintada con el trazado real del
      // río como borde para que el verde no se meta al agua.
      const refugio = refugePolygon(w, h);
      if (refugio && refugio.length > 3) {
        netCtx.save();
        netCtx.beginPath();
        netCtx.moveTo(refugio[0][0], refugio[0][1]);
        for (let i = 1; i < refugio.length; i++) netCtx.lineTo(refugio[i][0], refugio[i][1]);
        netCtx.closePath();
        netCtx.fillStyle = "rgba(94,186,124,0.26)";
        netCtx.fill();
        netCtx.strokeStyle = "rgba(126,214,152,0.42)";
        netCtx.lineWidth = 1.2;
        netCtx.stroke();
        netCtx.restore();
      }
      // Arbolado Urbano real de Kennedy: se calcula la posición base de
      // cada árbol con toScreen (igual que las vías), y luego se distorsiona
      // con las 4 esquinas arrastrables (interpolación bilineal), como el
      // "Distort" de Photoshop — la esquina más cercana "jala" más fuerte.
      if (treeData) {
        if (!treeWorldBBox) {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          treeData.trees.forEach(([tx, ty]) => {
            if (tx < minX) minX = tx; if (tx > maxX) maxX = tx;
            if (ty < minY) minY = ty; if (ty > maxY) maxY = ty;
          });
          treeWorldBBox = { minX, minY, maxX, maxY };
        }
        const corners = getTreeCorners(w, h);
        const { TL, TR, BL, BR } = corners;
        const bb = treeWorldBBox;
        const wSpan = bb.maxX - bb.minX || 1, hSpan = bb.maxY - bb.minY || 1;
        // Centro del recuadro de las 4 esquinas — la escala de toda la capa
        // se aplica alrededor de este punto, para que se sienta como un
        // zoom de la malla completa, no un tamaño de cada punto.
        const cx = (TL.x + TR.x + BL.x + BR.x) / 4, cy = (TL.y + TR.y + BL.y + BR.y) / 4;
        netCtx.fillStyle = "rgba(139,168,136,0.25)";
        treeData.trees.forEach(([tx, ty, , altura]) => {
          const [sx0, sy0] = treeDistortedScreen(tx, ty, bb, TL, TR, BL, BR, wSpan, hSpan);
          const sx = (sx0 - cx) * treeLayerScale + cx;
          const sy = (sy0 - cy) * treeLayerScale + cy;
          if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) return;
          const r = Math.min(2.6, Math.max(0.8, (altura || 3) * 0.12));
          netCtx.beginPath();
          netCtx.arc(sx, sy, r, 0, Math.PI * 2);
          netCtx.fill();
        });
      }
      // se dibuja primero lo local (más numeroso y fino) y encima lo
      // principal (más grueso), para que las vías grandes no queden tapadas
      ["local", "mid", "major"].forEach((cls) => {
        const style = EDGE_STYLE[cls];
        netCtx.strokeStyle = style.color;
        netCtx.lineWidth = style.width;
        netCtx.beginPath();
        netData.edges.forEach(([c, pts]) => {
          if (c !== cls || pts.length < 2) return;
          const [sx, sy] = toScreen(pts[0][0], pts[0][1]);
          netCtx.moveTo(sx, sy);
          for (let i = 1; i < pts.length; i++) {
            const [px, py] = toScreen(pts[i][0], pts[i][1]);
            netCtx.lineTo(px, py);
          }
        });
        netCtx.stroke();
      });
      // Vía "cerrada" en el escenario de perturbación: se resalta en rojo
      // punteado con un ícono de barrera en el medio.
      if (closedEdgeIdx != null && netData.edges[closedEdgeIdx]) {
        const pts = netData.edges[closedEdgeIdx][1];
        netCtx.save();
        netCtx.strokeStyle = "#ff4d4d";
        netCtx.lineWidth = 4;
        netCtx.setLineDash([6, 5]);
        netCtx.beginPath();
        const [sx0, sy0] = toScreen(pts[0][0], pts[0][1]);
        netCtx.moveTo(sx0, sy0);
        for (let i = 1; i < pts.length; i++) {
          const [px, py] = toScreen(pts[i][0], pts[i][1]);
          netCtx.lineTo(px, py);
        }
        netCtx.stroke();
        netCtx.setLineDash([]);
        const mid = pts[Math.floor(pts.length / 2)];
        const [mx, my] = toScreen(mid[0], mid[1]);
        netCtx.fillStyle = "#ff4d4d";
        netCtx.beginPath();
        netCtx.arc(mx, my, 9, 0, Math.PI * 2);
        netCtx.fill();
        netCtx.fillStyle = "#1a0505";
        netCtx.font = "bold 11px sans-serif";
        netCtx.textAlign = "center";
        netCtx.textBaseline = "middle";
        netCtx.fillText("✕", mx, my + 1);
        netCtx.restore();
      }
    }
    fetch("./assets/kennedy_trees.json?v=rotatewhole-v1")
      .then((r) => { if (!r.ok) throw new Error("no se pudo cargar kennedy_trees.json"); return r.json(); })
      .then((data) => { treeData = data; buildBirdTrees(); refrescarCobertura(); if (netData) drawNetwork(netCanvas.parentElement.clientWidth, netCanvas.parentElement.clientHeight); })
      .catch((err) => console.warn("No se pudo cargar el arbolado de Kennedy:", err));

    // ---------- cargar la red (JSON ya recortado) ----------
    fetch(NET_URL)
      .then((r) => { if (!r.ok) throw new Error("no se pudo cargar " + NET_URL); return r.json(); })
      .then((data) => {
        netData = data;
        buildEdgeGrid();
        resizeCanvases();
        setStatus("Red cargada. Cargando trazado.xml…");
        return loadTrazado();
      })
      .catch((err) => {
        console.error(err);
        setStatus("No se pudo cargar la red vial (assets/kennedy_net.json). Revisa que el archivo esté subido en tu repositorio.");
      });

    // ---------- cargar el trazado: primero intenta el JSON compacto, si no
    // existe cae al FCD-export XML de SUMO ----------
    function loadTrazado() {
      return fetch(VEHICULOS_JSON_URL)
        .then((r) => { if (!r.ok) throw new Error("no encontrado"); return r.json(); })
        .then((data) => {
          // Formato: [ [tiempo, [[id,x,y], ...]], ... ] — ya viene con el
          // mismo offset restado que la red, y sin ángulo (se calcula solo).
          timesteps = data.map(([time, vehicles]) => ({
            time,
            vehicles: vehicles.map(([id, x, y]) => ({ id, x, y })),
          }));
          finishLoadingTimesteps();
        })
        .catch(() => loadTrazadoXml());
    }
    function loadTrazadoXml() {
      return fetch(TRAZADO_URL)
        .then((r) => { if (!r.ok) throw new Error("no encontrado"); return r.text(); })
        .then((xmlText) => {
          const xml = new DOMParser().parseFromString(xmlText, "application/xml");
          if (xml.querySelector("parsererror")) throw new Error("trazado.xml no es un XML válido");
          const stepNodes = xml.getElementsByTagName("timestep");
          if (!stepNodes.length) throw new Error("trazado.xml no tiene <timestep> (¿es un FCD-export de SUMO?)");
          const [offX, offY] = netData.offset;
          timesteps = Array.from(stepNodes).map((step) => {
            const time = parseFloat(step.getAttribute("time")) || 0;
            const vehicles = Array.from(step.getElementsByTagName("vehicle")).map((v) => ({
              id: v.getAttribute("id"),
              x: parseFloat(v.getAttribute("x")) - offX,
              y: parseFloat(v.getAttribute("y")) - offY,
              angle: parseFloat(v.getAttribute("angle")) || 0,
            }));
            return { time, vehicles };
          });
          finishLoadingTimesteps();
        })
        .catch((err) => {
          console.warn(err);
          setStatus("La red vial ya está lista. Falta subir el archivo de trayectorias (assets/kennedy_vehiculos.json o assets/trazado.xml) para ver los vehículos en movimiento.");
        });
    }
    function finishLoadingTimesteps() {
      const totalTime = timesteps.length ? timesteps[timesteps.length - 1].time : 0;
      slider.max = String(Math.round(totalTime));
      slider.disabled = false;
      playBtn.disabled = false;
      setStatus("", false);
      timeLabel.textContent = `00:00 / ${fmtTime(totalTime)}`;
      drawVehiclesAt(0);
    }

    // Busca los dos timesteps que rodean "t" e interpola posiciones entre
    // ellos, para que el movimiento se vea fluido aunque el archivo tenga
    // pocos pasos por segundo.
    function vehiclesAtTime(t) {
      if (!timesteps.length) return [];
      if (t <= timesteps[0].time) return timesteps[0].vehicles;
      if (t >= timesteps[timesteps.length - 1].time) return timesteps[timesteps.length - 1].vehicles;
      let lo = 0, hi = timesteps.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (timesteps[mid].time <= t) lo = mid; else hi = mid;
      }
      const a = timesteps[lo], b = timesteps[hi];
      const span = b.time - a.time || 1;
      const frac = (t - a.time) / span;
      const bMap = new Map(b.vehicles.map((v) => [v.id, v]));
      return a.vehicles.map((va) => {
        const vb = bMap.get(va.id);
        if (!vb) return va;
        const x = va.x + (vb.x - va.x) * frac;
        const y = va.y + (vb.y - va.y) * frac;
        // Si el dato trae ángulo (viene del FCD-export de SUMO), se
        // interpola normal. Si no (viene del JSON de posiciones), se
        // calcula solo mirando hacia dónde se mueve el auto.
        const angle = (va.angle != null && vb.angle != null)
          ? va.angle + (vb.angle - va.angle) * frac
          : (Math.atan2(vb.x - va.x, vb.y - va.y) * 180) / Math.PI; // sin el signo negativo: coherente con el volteo del eje Y en toScreen
        // Velocidad real derivada de la propia posición de SUMO entre dos
        // instantes consecutivos (no es un dato inventado): v = distancia/tiempo.
        const speedMs = span > 0 ? Math.hypot(vb.x - va.x, vb.y - va.y) / span : 0;
        const speedKmh = speedMs * 3.6;
        return { id: va.id, x, y, angle, speedKmh };
      });
    }


    // ================= MIRLAS (Turdus fuscater) =================
    // Desplazamiento local diario desde los Cerros Orientales (oriente)
    // hacia los humedales (occidente), buscando parches de vegetación para
    // alimentarse y descansar. Cada mirla es un agente autónomo con
    // posición (x,y) y velocidad (vx,vy); los árboles del Arbolado Urbano
    // real de Kennedy son los atractores.
    const BIRD_TREE_SPECIES = {
      // índices de especie del propio archivo kennedy_trees.json
      15: { key: "sauco",  name: "Saúco",  color: "#b06bff", weight: 1.00, food: true },
      12: { key: "capuli", name: "Capulí", color: "#ff5fa8", weight: 0.76, food: true },
      71: { key: "capuli", name: "Capulí", color: "#ff5fa8", weight: 0.76, food: true },
      16: { key: "urapan", name: "Urapán", color: "#25d0a0", weight: 0.52, food: false },
    };
    const BIRD_VISION = 150;      // px — campo visual limitado
    const BIRD_ARRIVE = 15;       // px — "muy cerca" del árbol
    const BIRD_WIND = 30;         // px/s² — impulso global oriente → occidente
    const BIRD_MAX_SPEED = 82;    // px/s — vuelo de crucero
    const BIRD_REST_SPEED = 11;   // px/s — revoloteo mientras se alimenta o descansa
    let BIRD_COUNT = 60;
    // Umbral crítico de 60 dB(A) (Caltrans): por encima de ese nivel el
    // ruido de tráfico enmascara por completo las señales de comunicación
    // de las aves y su comportamiento cambia. Fuerza de repulsión:
    //   F_ruido = -K_rep · max(0, Lp(R) - 60) · û
    // con û el unitario que apunta desde la avenida hacia el ave; aquí se
    // aplica en el sentido que aleja al ave de la calle ruidosa, que es lo
    // que describe la regla.
    const BIRD_NOISE_DB = 60;
    const BIRD_K_REP = 45;
    // Cobertura vegetal: porcentaje de aumento sobre la muestra base de
    // árboles atractores. NO se inventa ningún árbol: se activan más de los
    // que ya trae el Arbolado Urbano real (hay 12.935 de estas 3 especies).
    const BIRD_TREE_BASE = { sauco: 260, capuli: 200, urapan: 220 };
    let vegBoost = 0;
    let refrescarCobertura = () => {};   // lo define la barra, más abajo
    let birdTreesWorld = null;    // muestra de árboles atractores (coordenadas del mapa)
    let birdTreesScreen = [];     // los mismos, ya proyectados a pantalla
    let birds = [];
    let birdsOn = false;   // al iniciar solo se ve la simulación de los carros
    let birdLastTs = 0;

    // Se toma una muestra repartida de cada especie: el arbolado real trae
    // más de 12.000 árboles de estas tres, y buscar en todos cada cuadro
    // sería innecesariamente caro.
    function buildBirdTrees() {
      if (!treeData || !treeData.trees) return;
      const porEspecie = { sauco: [], capuli: [], urapan: [] };
      treeData.trees.forEach((t) => {
        const meta = BIRD_TREE_SPECIES[t[2]];
        if (meta) porEspecie[meta.key].push([t[0], t[1], meta]);
      });
      const factor = 1 + vegBoost / 100;
      const TOPE = { sauco: Math.round(BIRD_TREE_BASE.sauco * factor),
                     capuli: Math.round(BIRD_TREE_BASE.capuli * factor),
                     urapan: Math.round(BIRD_TREE_BASE.urapan * factor) };
      birdTreesWorld = [];
      Object.keys(porEspecie).forEach((k) => {
        const lista = porEspecie[k];
        const paso = Math.max(1, Math.floor(lista.length / TOPE[k]));
        for (let i = 0; i < lista.length; i += paso) birdTreesWorld.push(lista[i]);
      });
    }

    // Misma proyección que usa el dibujo del arbolado (distorsión de las 4
    // esquinas + escala de la capa), para que las mirlas vean los árboles
    // exactamente donde se ven en pantalla.
    const TREE_CELL = 50;         // lado de la celda de la rejilla, en píxeles
    let treeGrid = null, treeGridW = 0, treeGridH = 0;
    function updateBirdTreesScreen(w, h) {
      if (!birdTreesWorld || !treeWorldBBox) { birdTreesScreen = []; return; }
      const { TL, TR, BL, BR } = getTreeCorners(w, h);
      const bb = treeWorldBBox;
      const wSpan = bb.maxX - bb.minX || 1, hSpan = bb.maxY - bb.minY || 1;
      const cx = (TL.x + TR.x + BL.x + BR.x) / 4, cy = (TL.y + TR.y + BL.y + BR.y) / 4;
      birdTreesScreen = [];
      birdTreesWorld.forEach((t) => {
        const [sx0, sy0] = treeDistortedScreen(t[0], t[1], bb, TL, TR, BL, BR, wSpan, hSpan);
        const x = (sx0 - cx) * treeLayerScale + cx;
        const y = (sy0 - cy) * treeLayerScale + cy;
        if (x < -60 || x > w + 60 || y < -60 || y > h + 60) return;
        birdTreesScreen.push({ x, y, meta: t[2] });
      });
      // rejilla: cada mirla solo revisa las celdas que toca su campo visual
      treeGridW = Math.max(1, Math.ceil(w / TREE_CELL) + 3);
      treeGridH = Math.max(1, Math.ceil(h / TREE_CELL) + 3);
      treeGrid = new Array(treeGridW * treeGridH);
      birdTreesScreen.forEach((t) => {
        const cx = clampNum(Math.floor(t.x / TREE_CELL) + 1, 0, treeGridW - 1);
        const cy = clampNum(Math.floor(t.y / TREE_CELL) + 1, 0, treeGridH - 1);
        const i = cy * treeGridW + cx;
        (treeGrid[i] || (treeGrid[i] = [])).push(t);
      });
    }
    // Mejor árbol dentro del campo visual (más peso ecológico y más cerca)
    function bestTreeNear(bx, by) {
      if (!treeGrid) return null;
      const r = BIRD_VISION;
      const x0 = clampNum(Math.floor((bx - r) / TREE_CELL) + 1, 0, treeGridW - 1);
      const x1 = clampNum(Math.floor((bx + r) / TREE_CELL) + 1, 0, treeGridW - 1);
      const y0 = clampNum(Math.floor((by - r) / TREE_CELL) + 1, 0, treeGridH - 1);
      const y1 = clampNum(Math.floor((by + r) / TREE_CELL) + 1, 0, treeGridH - 1);
      let mejor = null, mejorPuntaje = 0, mejorDist = 0;
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const celda = treeGrid[cy * treeGridW + cx];
          if (!celda) continue;
          for (let i = 0; i < celda.length; i++) {
            const t = celda[i];
            const dx = t.x - bx, dy = t.y - by;
            const d2 = dx * dx + dy * dy;
            if (d2 > r * r) continue;
            const d = Math.sqrt(d2) || 0.001;
            const puntaje = t.meta.weight / d;
            if (puntaje > mejorPuntaje) { mejorPuntaje = puntaje; mejor = t; mejorDist = d; }
          }
        }
      }
      return mejor ? { arbol: mejor, dist: mejorDist } : null;
    }

    const clampNum = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    // ---- Refugio verde del rincón superior izquierdo ----
    // Es la franja de tierra que queda entre la esquina del mapa y el río
    // que pasa por ahí: se pinta de verde translúcido SIN cruzar el río
    // (el polígono usa el trazado real del río como borde) y aloja un grupo
    // de mirlas residentes.
    // Un SOLO trazado: el que bordea la esquina. Mezclando los dos, donde
    // termina uno el borde saltaba al otro y aparecía un corte recto.
    const REFUGE_RIVER_IDX = [0];
    let refugePoly = null, refugeKey = "";
    // El borde del refugio es la ORILLA SUPERIOR del río: para cada franja
    // vertical se toma el punto más alto del trazado. Seguir el polilínea
    // completa no sirve: en los meandros se dobla sobre sí misma y el
    // relleno terminaba metiéndose al agua.
    function refugePolygon(w, h) {
      const clave = `${Math.round(w)}x${Math.round(h)}|${view.scale.toFixed(4)}|${view.offX.toFixed(1)}|${view.offY.toFixed(1)}|${ROTATE_DEG}`;
      if (refugePoly && refugeKey === clave) return refugePoly;
      const PASO = 8;
      const orilla = new Map();
      REFUGE_RIVER_IDX.forEach((idx) => {
        const rio = TRACED_RIVERS[idx];
        if (!rio) return;
        rio.points.forEach(([wx, wy]) => {
          const [x, y] = toScreen(wx, wy);
          if (x < -80 || x > w + 80) return;
          const celda = Math.round(x / PASO);
          const previo = orilla.get(celda);
          if (previo == null || y < previo) orilla.set(celda, y);
        });
      });
      if (orilla.size < 3) return null;
      const borde = [...orilla.entries()].sort((a, b) => a[0] - b[0]).map(([c, y]) => [c * PASO, y]);
      const primero = borde[0], ultimo = borde[borde.length - 1];
      refugePoly = [[primero[0], -60]].concat(borde, [[ultimo[0], -60]]);
      refugeKey = clave;
      return refugePoly;
    }
    function pointInPoly(x, y, poly) {
      let dentro = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi) dentro = !dentro;
      }
      return dentro;
    }
    let refugeAnchorCache = null, refugeAnchorKey = "";
    function refugeAnchor(w, h) {
      const clave = `${Math.round(w)}x${Math.round(h)}|${view.scale.toFixed(4)}`;
      if (refugeAnchorCache && refugeAnchorKey === clave) return refugeAnchorCache;
      const poly = refugePolygon(w, h);
      let sx = 0, sy = 0, n = 0;
      (poly || []).forEach(([x, y]) => { if (x > 0 && y > 0 && x < w && y < h) { sx += x; sy += y; n++; } });
      refugeAnchorCache = n ? { x: sx / n, y: Math.max(12, sy / n - 30) } : { x: w * 0.1, y: h * 0.1 };
      refugeAnchorKey = clave;
      return refugeAnchorCache;
    }
    function refugePointInside(w, h) {
      const poly = refugePolygon(w, h);
      if (!poly) return { x: w * 0.08, y: h * 0.08 };
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * w * 0.45, y = Math.random() * h * 0.4;
        if (x > 6 && y > 6 && pointInPoly(x, y, poly)) return { x, y };
      }
      return { x: w * 0.06, y: h * 0.06 };
    }

    // Punto al azar sobre uno de los humedales calcados.
    function wetlandPoint(w, h) {
      const poly = TRACED_WETLANDS[Math.floor(Math.random() * TRACED_WETLANDS.length)] || [];
      const p = poly[Math.floor(Math.random() * poly.length)] || [CENTER_X, CENTER_Y];
      const [sx, sy] = toScreen(p[0], p[1]);
      return { x: clampNum(sx + (Math.random() - 0.5) * 30, 12, w - 12),
               y: clampNum(sy + (Math.random() - 0.5) * 30, 12, h - 12) };
    }

    // origen: "noroeste" = arriba a la izquierda · "humedal" = ya posada en
    // un humedal · "oriente" = entra por el borde oriental (así el flujo
    // diario se mantiene cuando una mirla sale por el occidente).
    function makeBird(w, h, origen) {
      let x, y;
      if (origen === "refugio") { const p = refugePointInside(w, h); x = p.x; y = p.y; }
      else if (origen === "humedal") { const p = wetlandPoint(w, h); x = p.x; y = p.y; }
      else if (origen === "noroeste") { x = w * (0.03 + Math.random() * 0.14); y = h * (0.03 + Math.random() * 0.20); }
      else { x = w + 12 + Math.random() * 50; y = h * (0.08 + Math.random() * 0.82); }
      const residente = origen === "refugio";
      return { x, y,
               vx: residente ? (Math.random() - 0.5) * 26 : -(30 + Math.random() * 30),
               vy: (Math.random() - 0.5) * (residente ? 26 : 14),
               rest: 0, cooldown: 0, restMeta: null, phase: Math.random() * 6.28, origen, residente };
    }
    const refugeTarget = () => Math.max(6, Math.round(BIRD_COUNT * 0.15));
    function initBirds(w, h) {
      birds = [];
      const enRefugio = refugeTarget();
      for (let i = 0; i < enRefugio; i++) birds.push(makeBird(w, h, "refugio"));
      // como se pidió: unas salen desde arriba a la izquierda y otras ya
      // están en los humedales
      for (let i = enRefugio; i < BIRD_COUNT; i++) birds.push(makeBird(w, h, i % 2 ? "humedal" : "noroeste"));
    }

    function updateBirds(dtRaw, w, h) {
      const dt = Math.min(0.05, Math.max(0, dtRaw));
      if (!dt) return;
      birds.forEach((b) => {
        b.phase += dt * 9;
        if (b.rest > 0) {
          // Muy cerca de un árbol: desacelera notablemente y revolotea al
          // azar 2 o 3 segundos (se alimenta o descansa).
          b.rest -= dt;
          b.vx += (Math.random() - 0.5) * 150 * dt;
          b.vy += (Math.random() - 0.5) * 150 * dt;
          const freno = Math.pow(0.02, dt);
          b.vx *= freno; b.vy *= freno;
          const sp = Math.hypot(b.vx, b.vy);
          if (sp > BIRD_REST_SPEED) { b.vx = (b.vx / sp) * BIRD_REST_SPEED; b.vy = (b.vy / sp) * BIRD_REST_SPEED; }
        } else if (b.residente) {
          // Residentes del refugio: no las arrastra el flujo hacia el
          // occidente; revolotean dentro de la mancha verde y, si se salen,
          // vuelven a entrar.
          if (b.cooldown > 0) b.cooldown -= dt;
          b.vx += (Math.random() - 0.5) * 90 * dt;
          b.vy += (Math.random() - 0.5) * 90 * dt;
          const poly = refugePolygon(w, h);
          if (poly && !pointInPoly(b.x, b.y, poly)) {
            const destino = refugeAnchor(w, h);
            const dx = destino.x - b.x, dy = destino.y - b.y;
            const d = Math.hypot(dx, dy) || 1;
            b.vx += (dx / d) * 130 * dt;
            b.vy += (dy / d) * 130 * dt;
          }
          const spR = Math.hypot(b.vx, b.vy);
          if (spR > 46) { b.vx = (b.vx / spR) * 46; b.vy = (b.vy / spR) * 46; }
        } else {
          if (b.cooldown > 0) b.cooldown -= dt;
          // impulso global (viento/flujo) de oriente a occidente
          b.vx -= BIRD_WIND * dt;
          b.vy += Math.sin(b.phase * 0.28) * 8 * dt;
          // campo visual limitado: se queda con el árbol más atractivo
          const hallazgo = bestTreeNear(b.x, b.y);
          const mejor = hallazgo ? hallazgo.arbol : null;
          const mejorDist = hallazgo ? hallazgo.dist : 0;
          if (mejor && b.cooldown <= 0) {
            const ux = (mejor.x - b.x) / mejorDist, uy = (mejor.y - b.y) / mejorDist;
            const esSauco = mejor.meta.key === "sauco";
            const fuerza = mejor.meta.weight * (esSauco ? 230 : 130);
            b.vx += ux * fuerza * dt;
            b.vy += uy * fuerza * dt;
            if (esSauco) {
              // su alimento favorito: cambia bruscamente el rumbo
              const sp = Math.hypot(b.vx, b.vy) || 1;
              b.vx = b.vx * 0.7 + ux * sp * 0.3;
              b.vy = b.vy * 0.7 + uy * sp * 0.3;
            }
            if (mejorDist < BIRD_ARRIVE) {
              b.rest = 2 + Math.random();     // 2 a 3 segundos
              b.restMeta = mejor.meta;
              b.cooldown = 7;                 // no se vuelve a pegar al mismo árbol enseguida
            }
          }
          const sp = Math.hypot(b.vx, b.vy);
          if (sp > BIRD_MAX_SPEED) { b.vx = (b.vx / sp) * BIRD_MAX_SPEED; b.vy = (b.vy / sp) * BIRD_MAX_SPEED; }
        }
        // ---- Umbral crítico de 60 dB(A) ----
        const db = noiseDbAtScreen(b.x, b.y, w, h);
        b.db = db;
        // La regla se evalúa donde está el ave Y un poco por delante de su
        // rumbo: el sonido viaja, así que la mirla oye la avenida antes de
        // llegar y la esquiva, en vez de reaccionar cuando ya está encima
        // (con la fuerza solo en su posición apenas alcanza a desviarse).
        let exceso = Math.max(0, db - BIRD_NOISE_DB);     // max(0, Lp(R) - 60)
        let rx = b.x, ry = b.y;
        const rapidez = Math.hypot(b.vx, b.vy) || 1;
        for (let k = 1; k <= 3; k++) {
          const ax = b.x + (b.vx / rapidez) * k * 30, ay = b.y + (b.vy / rapidez) * k * 30;
          const e = Math.max(0, noiseDbAtScreen(ax, ay, w, h) - BIRD_NOISE_DB) * (1 - k * 0.15);
          if (e > exceso) { exceso = e; rx = ax; ry = ay; }
        }
        b.estresada = exceso > 0;
        if (exceso > 0) {
          const u = noiseEscapeDir(rx, ry, w, h);
          if (u) {
            b.vx += BIRD_K_REP * exceso * u[0] * dt;
            b.vy += BIRD_K_REP * exceso * u[1] * dt;
          }
          // por encima del umbral el comportamiento cambia: si estaba
          // comiendo o descansando, deja el árbol y sale de la zona
          if (b.rest > 0) { b.rest = 0; b.cooldown = Math.max(b.cooldown, 3); }
          const sp = Math.hypot(b.vx, b.vy);
          if (sp > BIRD_MAX_SPEED * 1.35) { b.vx = (b.vx / sp) * BIRD_MAX_SPEED * 1.35; b.vy = (b.vy / sp) * BIRD_MAX_SPEED * 1.35; }
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y < 8) { b.y = 8; b.vy = Math.abs(b.vy); }
        if (b.y > h - 8) { b.y = h - 8; b.vy = -Math.abs(b.vy); }
        if (b.x > w + 70) { b.x = w + 70; b.vx = -Math.abs(b.vx); }
        // salió por el occidente: vuelve a entrar por el oriente (Cerros).
        // Las residentes del refugio no se van: se las devuelve al refugio.
        if (b.x < -40) Object.assign(b, makeBird(w, h, b.residente ? "refugio" : "oriente"));
      });
    }

    function drawBirds(w, h) {
      // árboles atractores, con el color de su especie
      birdTreesScreen.forEach((t) => {
        vehCtx.beginPath();
        vehCtx.fillStyle = t.meta.color;
        vehCtx.globalAlpha = t.meta.key === "urapan" ? 0.45 : 0.78;
        vehCtx.arc(t.x, t.y, t.meta.key === "sauco" ? 2.6 : 2.1, 0, Math.PI * 2);
        vehCtx.fill();
      });
      vehCtx.globalAlpha = 1;
      birds.forEach((b) => {
        const ang = Math.atan2(b.vy, b.vx);
        vehCtx.save();
        vehCtx.translate(b.x, b.y);
        if (b.estresada) {
          // por encima de 60 dB(A): anillo de alerta, huyendo del ruido
          vehCtx.beginPath();
          vehCtx.strokeStyle = "#ff6b4d";
          vehCtx.globalAlpha = 0.85;
          vehCtx.lineWidth = 1.3;
          vehCtx.arc(0, 0, 5.8, 0, Math.PI * 2);
          vehCtx.stroke();
          vehCtx.globalAlpha = 1;
        }
        if (b.rest > 0 && b.restMeta) {
          // halo del color del árbol donde está posada / alimentándose
          vehCtx.beginPath();
          vehCtx.strokeStyle = b.restMeta.color;
          vehCtx.globalAlpha = 0.75;
          vehCtx.lineWidth = 1.2;
          vehCtx.arc(0, 0, 5.2, 0, Math.PI * 2);
          vehCtx.stroke();
          vehCtx.globalAlpha = 1;
        }
        vehCtx.rotate(ang);
        // La mirla es un ave oscura y el mapa es negro: se le pone un halo
        // suave y un contorno claro para que se distinga del fondo.
        const halo = vehCtx.createRadialGradient(0, 0, 0, 0, 0, 6);
        halo.addColorStop(0, "rgba(226,232,240,0.30)");
        halo.addColorStop(1, "rgba(226,232,240,0)");
        vehCtx.fillStyle = halo;
        vehCtx.beginPath();
        vehCtx.arc(0, 0, 6, 0, Math.PI * 2);
        vehCtx.fill();
        // aleteo: más rápido en vuelo, casi quieto mientras descansa
        const bat = Math.sin(b.phase) * (b.rest > 0 ? 0.7 : 2.2);
        vehCtx.strokeStyle = "#eef2f7";
        vehCtx.lineWidth = 1.15;
        vehCtx.lineCap = "round";
        vehCtx.beginPath();
        vehCtx.moveTo(-3, -bat);
        vehCtx.lineTo(0.3, 0);
        vehCtx.lineTo(-3, bat);
        vehCtx.stroke();
        vehCtx.fillStyle = "#20222c";
        vehCtx.strokeStyle = "rgba(238,242,247,0.9)";
        vehCtx.lineWidth = 0.7;
        vehCtx.beginPath();
        vehCtx.ellipse(0, 0, 2.3, 1.3, 0, 0, Math.PI * 2);
        vehCtx.fill();
        vehCtx.stroke();
        // pico naranja, como la mirla real
        vehCtx.fillStyle = "#f2a93b";
        vehCtx.beginPath();
        vehCtx.arc(2.4, 0, 0.7, 0, Math.PI * 2);
        vehCtx.fill();
        vehCtx.restore();
      });
    }

    // Ventana de solo lectura al estado de las mirlas (no cambia nada del
    // comportamiento): sirve para verificar las reglas desde afuera.
    window.SUMO_BIRDS_STATE = () => birds.map((b) => ({
      x: b.x, y: b.y, vx: b.vx, vy: b.vy, rest: b.rest,
      origen: b.origen, arbol: b.restMeta ? b.restMeta.key : null,
      db: b.db || null, estresada: !!b.estresada,
    }));
    window.SUMO_BIRDS_TREES = () => ({ total: birdTreesScreen.length,
      porEspecie: birdTreesScreen.reduce((acc, t) => { acc[t.meta.key] = (acc[t.meta.key] || 0) + 1; return acc; }, {}) });

    function birdsFrame(w, h) {
      if (!birdsOn) { birdLastTs = 0; return; }
      const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
      const dt = birdLastTs ? (now - birdLastTs) / 1000 : 0;
      birdLastTs = now;
      updateBirdTreesScreen(w, h);
      if (!birds.length) initBirds(w, h);
      if (playing) updateBirds(dt, w, h);
      drawBirds(w, h);
    }

    function drawVehiclesAt(t) {
      const w = vehCanvas.parentElement.clientWidth, h = vehCanvas.parentElement.clientHeight;
      vehCtx.clearRect(0, 0, w, h);
      const baseVehicles = vehiclesAtTime(t);
      const vehicles = applyDemandAndClosure(baseVehicles, t);
      if (noiseLayerOn || birdsOn) computeNoiseField(vehicles, w, h);
      if (noiseLayerOn) drawNoiseLayer(vehicles, w, h);
      else if (noiseCtx) noiseCtx.clearRect(0, 0, w, h);
      vehicles.forEach((v) => {
        const [sx, sy] = toScreen(v.x, v.y);
        const rad = ((v.angle - 90) * Math.PI) / 180 + (ROTATE_DEG * Math.PI) / 180; // SUMO: 0° = norte, + la rotacion actual del encuadre
        vehCtx.save();
        vehCtx.translate(sx, sy);
        vehCtx.rotate(rad);
        // Carrito (rectángulo redondeado, como en SUMO), no un triángulo:
        // el "morro" queda del lado +x, hacia donde apunta el vehículo.
        const carLength = 6, carWidth = 3, r = 1;
        vehCtx.globalAlpha = v.ghost ? 0.55 : 1; // los "fantasmas" de demanda extra se ven algo más tenues
        vehCtx.fillStyle = v.detoured ? "#ff6b6b" : "#ffb020";
        vehCtx.beginPath();
        if (vehCtx.roundRect) {
          vehCtx.roundRect(-carLength / 2, -carWidth / 2, carLength, carWidth, r);
        } else {
          vehCtx.rect(-carLength / 2, -carWidth / 2, carLength, carWidth); // respaldo para navegadores viejos
        }
        vehCtx.fill();
        // Parabrisas: un rectángulo más oscuro hacia el frente, para que
        // se note de un vistazo hacia dónde mira el carro.
        vehCtx.fillStyle = "#7a4a06";
        vehCtx.fillRect(carLength * 0.05, -carWidth / 2 + 0.5, carLength * 0.32, carWidth - 1);
        vehCtx.globalAlpha = 1;
        vehCtx.restore();
      });
      birdsFrame(w, h);
      timeLabel.textContent = `${fmtTime(t)} / ${slider.max ? fmtTime(Number(slider.max)) : "00:00"}`;
      if (!isScrubbing) slider.value = String(Math.round(t));
    }

    // ---------- reproducción ----------
    let isScrubbing = false;
    function step(ts) {
      if (!playing) return;
      if (!lastFrameTs) lastFrameTs = ts;
      const dt = (ts - lastFrameTs) / 1000;
      lastFrameTs = ts;
      const totalTime = timesteps.length ? timesteps[timesteps.length - 1].time : 0;
      playhead = Math.min(totalTime, playhead + dt * speedMultiplier);
      drawVehiclesAt(playhead);
      if (playhead >= totalTime) {
        playing = false; playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        ambienceAudio?.pause();
        return;
      }
      rafId = requestAnimationFrame(step);
    }

    playBtn?.addEventListener("click", () => {
      if (!timesteps.length) return;
      playing = !playing;
      playBtn.innerHTML = playing ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
      if (playing) {
        lastFrameTs = 0; rafId = requestAnimationFrame(step);
        ambienceAudio?.play().catch(() => {}); // el navegador puede bloquear autoplay sin gesto; esto ya viene de un clic
      } else {
        cancelAnimationFrame(rafId);
        ambienceAudio?.pause();
      }
    });
    muteBtn?.addEventListener("click", () => {
      if (!ambienceAudio) return;
      ambienceAudio.muted = !ambienceAudio.muted;
      muteBtn.innerHTML = ambienceAudio.muted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
    });
    function setBirdCount(n, w, h) {
      BIRD_COUNT = Math.max(1, Math.round(n));
      if (!birds.length) return;
      while (birds.length > BIRD_COUNT) birds.pop();
      while (birds.length < BIRD_COUNT) {
        const residentes = birds.filter((x) => x.residente).length;
        birds.push(makeBird(w, h, residentes < refugeTarget() ? "refugio" : (birds.length % 2 ? "humedal" : "oriente")));
      }
    }
    const vegSlider = document.getElementById("sumoVegSlider");
    const vegVal = document.getElementById("sumoVegVal");
    const vegCount = document.getElementById("sumoVegCount");
    refrescarCobertura = () => {
      if (vegVal) vegVal.textContent = `+${vegBoost}%`;
      if (vegCount) vegCount.textContent = birdTreesWorld ? birdTreesWorld.length.toLocaleString("es-CO") : "—";
    };
    vegSlider?.addEventListener("input", () => {
      vegBoost = Number(vegSlider.value);
      buildBirdTrees();
      refrescarCobertura();
      drawVehiclesAt(playhead);
    });
    const birdSlider = document.getElementById("sumoBirdSlider");
    const birdCountVal = document.getElementById("sumoBirdCountVal");
    birdSlider?.addEventListener("input", () => {
      const n = Number(birdSlider.value);
      if (birdCountVal) birdCountVal.textContent = String(n);
      const w = vehCanvas.parentElement.clientWidth, h = vehCanvas.parentElement.clientHeight;
      setBirdCount(n, w, h);
      drawVehiclesAt(playhead);
    });
    const birdToggle = document.getElementById("sumoBirdToggle");
    birdToggle?.addEventListener("change", () => {
      birdsOn = birdToggle.checked;
      birdLastTs = 0;
      drawVehiclesAt(playhead);
    });
    const noiseToggle = document.getElementById("sumoNoiseToggle");
    noiseToggle?.addEventListener("change", () => {
      noiseLayerOn = noiseToggle.checked;
      if (!noiseLayerOn && noiseCtx) {
        const w = vehCanvas.parentElement.clientWidth, h = vehCanvas.parentElement.clientHeight;
        noiseCtx.clearRect(0, 0, w, h);
      } else {
        drawVehiclesAt(playhead);
      }
    });
    slider?.addEventListener("input", () => {
      isScrubbing = true;
      playhead = Number(slider.value);
      drawVehiclesAt(playhead);
    });
    slider?.addEventListener("change", () => { isScrubbing = false; });
    speedSelect?.addEventListener("change", () => { speedMultiplier = Number(speedSelect.value) || 1; });

    // ---------- Panel "¿qué pasaría si...?" (demanda + cierre de vía) ----------
    const demandSlider = document.getElementById("sumoDemandSlider");
    const demandVal = document.getElementById("sumoDemandVal");
    const closureSelect = document.getElementById("sumoClosureSelect");
    const closureToggle = document.getElementById("sumoClosureToggle");
    const whatifStatus = document.getElementById("sumoWhatifStatus");

    CLOSURE_CANDIDATES.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = String(c.edgeIdx);
      opt.textContent = c.label;
      closureSelect?.appendChild(opt);
    });

    function updateWhatifStatus() {
      const parts = [];
      if (demandPercent !== 0) parts.push(`demanda ${demandPercent > 0 ? "+" : ""}${demandPercent}%`);
      if (closedEdgeIdx != null) {
        const c = CLOSURE_CANDIDATES.find((x) => x.edgeIdx === closedEdgeIdx);
        parts.push(`${c ? c.label : "vía"} cerrada — ${detourMap.size} vehículo(s) con desvío real calculado por Dijkstra`);
      }
      if (whatifStatus) whatifStatus.textContent = parts.length ? `Escenario activo: ${parts.join(" · ")} (ilustrativo).` : "Sin cambios — mostrando el modelo base.";
    }

    demandSlider?.addEventListener("input", () => {
      demandPercent = Number(demandSlider.value);
      if (demandVal) demandVal.textContent = `${demandPercent > 0 ? "+" : ""}${demandPercent}%`;
      updateWhatifStatus();
      drawVehiclesAt(playhead);
    });

    closureSelect?.addEventListener("change", () => {
      closureToggle.disabled = !closureSelect.value;
      closureToggle.classList.remove("active");
      closedEdgeIdx = null;
      closureToggle.innerHTML = '<i class="fa-solid fa-road-barrier"></i> Cerrar';
      updateWhatifStatus();
      drawNetwork(netCanvas.parentElement.clientWidth, netCanvas.parentElement.clientHeight);
      drawVehiclesAt(playhead);
    });
    closureToggle?.addEventListener("click", () => {
      const isActive = closureToggle.classList.toggle("active");
      closedEdgeIdx = isActive ? Number(closureSelect.value) : null;
      closureToggle.innerHTML = isActive
        ? '<i class="fa-solid fa-road-barrier"></i> Reabrir'
        : '<i class="fa-solid fa-road-barrier"></i> Cerrar';
      if (isActive) {
        if (whatifStatus) whatifStatus.textContent = "Calculando desvíos reales por Dijkstra sobre el grafo de calles…";
        closureToggle.disabled = true;
        // pequeño respiro para que el navegador pinte el mensaje antes del cálculo (puede tardar un momento)
        setTimeout(() => {
          computeRealDetours(closedEdgeIdx);
          closureToggle.disabled = false;
          updateWhatifStatus();
          drawNetwork(netCanvas.parentElement.clientWidth, netCanvas.parentElement.clientHeight);
          drawVehiclesAt(playhead);
        }, 30);
      } else {
        detourMap = new Map();
        updateWhatifStatus();
        drawNetwork(netCanvas.parentElement.clientWidth, netCanvas.parentElement.clientHeight);
        drawVehiclesAt(playhead);
      }
    });

    // El mapa queda fijo: sin arrastrar ni hacer zoom, con el encuadre
    // definido por EXTRA_ZOOM/CENTER_X/CENTER_Y/ROTATE_DEG de arriba (fijo,
    // ya no editable desde un panel).

    // ---------- Clic sobre un árbol: muestra su especie y altura ----------
    const treeInfoBox = document.createElement("div");
    treeInfoBox.className = "sumo-tree-info";
    treeInfoBox.hidden = true;
    document.getElementById("sumoCanvasWrap")?.appendChild(treeInfoBox);
    document.getElementById("sumoCanvasWrap")?.addEventListener("click", (event) => {
      if (!treeData || !treeWorldBBox) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left, clickY = event.clientY - rect.top;
      const w = netCanvas.parentElement.clientWidth, h = netCanvas.parentElement.clientHeight;
      const { TL, TR, BL, BR } = getTreeCorners(w, h);
      const bb = treeWorldBBox;
      const wSpan = bb.maxX - bb.minX || 1, hSpan = bb.maxY - bb.minY || 1;
      const cx = (TL.x + TR.x + BL.x + BR.x) / 4, cy = (TL.y + TR.y + BL.y + BR.y) / 4;
      let best = null, bestDist = 12; // hasta 12px de tolerancia
      treeData.trees.forEach(([tx, ty, spIdx, altura]) => {
        const [sx0, sy0] = treeDistortedScreen(tx, ty, bb, TL, TR, BL, BR, wSpan, hSpan);
        const sx = (sx0 - cx) * treeLayerScale + cx;
        const sy = (sy0 - cy) * treeLayerScale + cy;
        const d = Math.hypot(sx - clickX, sy - clickY);
        if (d < bestDist) { bestDist = d; best = { species: treeData.species[spIdx], altura }; }
      });
      if (best) {
        treeInfoBox.innerHTML = `<i class="fa-solid fa-tree"></i> <strong>${best.species}</strong> · ${best.altura ? best.altura.toFixed(1) + " m de altura" : "altura no registrada"}`;
        treeInfoBox.style.left = `${clickX + 10}px`;
        treeInfoBox.style.top = `${clickY + 10}px`;
        treeInfoBox.hidden = false;
      } else {
        treeInfoBox.hidden = true;
      }
    });

    window.addEventListener("resize", () => {
      resizeCanvases();
      drawVehiclesAt(playhead);
    });
  });
})();
