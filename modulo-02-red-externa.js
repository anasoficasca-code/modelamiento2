/* ==========================================================
   Módulo 02 · Red externa (base de datos cargada desde Excel → Supabase)

   Este archivo es independiente de modulo-02.js: agrega, sobre la misma
   red SVG (#networkViz), una capa con TODOS los elementos cargados desde
   la base de datos (m2_elementos) y sus conexiones (m2_conexiones).

   Para que sea una RED de verdad (nodos + flujos) y no un bloque compacto:
     - Cada nodo tiene un radio propio según su GRADO (cuántas conexiones
       tiene): los hubs son visiblemente más grandes que los periféricos.
     - La separación mínima entre dos nodos es la suma de sus radios más un
       margen de aire fijo — nunca quedan pegados.
     - Las conexiones son "directa" (línea sólida, cercanía muy próxima) o
       "indirecta" (línea punteada, cercanía más laxa), igual que la
       leyenda "Tipos de relación" de la red original.
     - Se calculan los nodos PUENTE (puntos de articulación del grafo: si se
       quitan, la red se parte en componentes separadas) con el algoritmo
       clásico de Tarjan, y se pueden resaltar con un botón dedicado.
   ========================================================== */
(function () {
  /* ¿Se dibuja esta red (la de Supabase) o la original de modulo-02.js?
     A pedido de la usuaria, Módulo 02 vuelve a mostrar la red de siempre:
     con la constante en false esta capa no se construye, no se consulta la
     base de datos y su barra de herramientas queda oculta. Poner true
     devuelve la red externa tal como estaba, sin tocar nada más. */
  const RED_EXTERNA_ACTIVA = false;

  const SUPABASE_URL = "https://mcitahjecaqsshzeamnj.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jaXRhaGplY2Fxc3NoemVhbW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NDYwNjQsImV4cCI6MjEwNDAyMjA2NH0.xx63t4EZcdqZqf4onHsU1EcIFdCQS04VigGgyDbLxHQ";
  const SVG_NS = "http://www.w3.org/2000/svg";
  const XHTML_NS = "http://www.w3.org/1999/xhtml";

  // Lienzo virtual grande: como el zoom/pan es propio (no el de la red
  // vieja), el layout no está atado al viewBox de 2500×1820 — usamos un
  // espacio bien más grande para que los nodos grandes (hubs) y el aire
  // entre todos entren sin apretarse, y el zoom inicial encuadra todo.
  const RECT = { x0: 0, y0: 0, x1: 6400, y1: 5200 };
  const R_MIN = 15, R_MAX = 62;
  const GAP = 26; // "aire" mínimo entre el borde de dos nodos cualesquiera

  // Con pocos nodos en pantalla (por ejemplo al dejar solo lo que el POT
  // nombra) las bolas se veían diminutas sobre el mismo lienzo enorme. El
  // tamaño se escala según cuántos nodos hay: menos nodos, bolas más
  // grandes, para que siga leyéndose como una red y no como puntos.
  let escalaNodo = 1;
  function ajustarEscalaNodo(n) {
    escalaNodo = Math.max(1, Math.min(2.6, Math.sqrt(760 / Math.max(30, n || 760))));
  }
  function radiusForDegree(d) {
    const r = Math.max(R_MIN, Math.min(R_MAX, R_MIN + Math.sqrt(d) * 8.2));
    return r * escalaNodo;
  }

  // Solo se usan los 4 colores/íconos oficiales de las estructuras del POT
  // (ver leyenda "Categorías del POT" / STRUCT en modulo-02.js y modulo-02.html),
  // no un color distinto por cada una de las 11 categorías del Excel.
  const CATEGORIA_A_ESTRUCTURA = {
    sistema_hidrico: "e1",
    humedales: "e1",
    vias_arteriales: "e2",
    ciclorutas: "e2",
    parques: "e2",
    cuidado: "e2",
    salud: "e2",
    deporte: "e2",
    educacion: "e3",
    comercio: "e3",
    cultura: "e4",
  };
  const ESTRUCTURA_STYLE = {
    e1: { color: "#5cd6d1", icon: "fa-droplet" },
    e2: { color: "#ef9f54", icon: "fa-people-roof" },
    e3: { color: "#fac47b", icon: "fa-building-columns" },
    e4: { color: "#fb8d84", icon: "fa-landmark" },
  };

  /* -------- Vías: solo las que el POT nombra --------
     La malla vial completa ahogaba la lectura de la red. Se dejan
     únicamente los corredores que el POT (documento "Bogotá Reverdece")
     nombra de forma explícita, sea como obra estructurante del plan, como
     corredor del sistema de transporte o como vía de la malla arterial en
     conflicto con la Estructura Ecológica Principal. */
  const VIAS_POT = [
    { nombre: "Autopista Norte",            re: /autopista\s*norte/i },
    { nombre: "Carrera Séptima",            re: /(carrera|cra\.?|kr\.?)\s*7\b|s[ée]ptima/i },
    { nombre: "Carrera 10",                 re: /(carrera|cra\.?|kr\.?)\s*10\b|d[ée]cima/i },
    { nombre: "Carrera 80",                 re: /(carrera|cra\.?|kr\.?)\s*80\b/i },
    { nombre: "Calle 13",                   re: /calle\s*13\b/i },
    { nombre: "Calle 26",                   re: /calle\s*26\b/i },
    { nombre: "Calle 63",                   re: /calle\s*63\b/i },
    { nombre: "Calle 72",                   re: /calle\s*72\b/i },
    { nombre: "Calle 80",                   re: /calle\s*80\b/i },
    { nombre: "Calle 43 Sur",               re: /calle\s*43\s*sur/i },
    { nombre: "Avenida Boyacá",             re: /boyac[áa]/i },
    { nombre: "Avenida Ciudad de Cali",     re: /ciudad\s*de\s*cali/i },
    { nombre: "Avenida Caracas",            re: /caracas/i },
    { nombre: "Avenida Suba–Cota",          re: /suba\s*[-–]\s*cota|suba\s*cota/i },
    { nombre: "Avenida Longitudinal de Occidente (ALO)", re: /\balo\b|longitudinal\s*de\s*occidente/i },
  ];
  const ES_VIA = (e) => e.categoria_id === "vias_arteriales";

  /* -------- Lo que el POT nombra --------
     Términos tomados del documento del POT "Bogotá Reverdece". Se separan
     los LUGARES que nombra uno por uno de los SISTEMAS/PROGRAMAS que nombra
     como tales (y que por tanto cobijan a todos sus elementos). */
  const POT_LUGARES = [
    // humedales y cuerpos de agua que el documento nombra (en la base están
    // escritos sin la palabra "humedal": TECHO, LA CONEJERA, CÓRDOBA-NIZA…)
    { q: "Humedal Capellanía",            re: /capellan[íi]a/i },
    { q: "Humedal Córdoba",               re: /c[óo]rdoba/i },
    { q: "Humedal El Burro",              re: /\bel\s+burro\b/i },
    { q: "Humedal Techo",                 re: /\btecho\b/i },
    { q: "Humedal Torca",                 re: /\btorca\b/i },
    { q: "Humedal La Conejera",           re: /conejera/i },
    { q: "Río Bogotá",                    re: /r[íi]o\s+bogot[áa]/i },
    { q: "Río Fucha",                     re: /\bfucha\b/i },
    { q: "Río Tunjuelo",                  re: /tunjuel/i },
    { q: "Río y canal Salitre",           re: /salitre/i },
    { q: "Canal Arzobispo",               re: /arzobispo/i },
    { q: "Canal El Virrey",               re: /virrey/i },
    { q: "Canal Independencia",           re: /independencia/i },
    { q: "Cerros Orientales",             re: /cerros?\s+orientales/i },
    { q: "Reserva Thomas van der Hammen", re: /thomas|van\s+der\s+hammen/i },
    { q: "Parque Entrenubes",             re: /entrenubes/i },
    { q: "Parque Nacional",               re: /parque\s+nacional/i },
    { q: "Parque Simón Bolívar",          re: /sim[óo]n\s+bol[íi]var/i },
    { q: "Parque Ecológico Cerro Seco",   re: /cerro\s+seco/i },
    { q: "Parques rurales (La Requilina, Los Soches, Quiba)", re: /requilina|soches|quiba/i },
    { q: "Áreas protegidas y reservas forestales", re: /[áa]reas?\s+protegidas?|reservas?\s+forestal/i },
    { q: "Complejos de páramos",          re: /p[áa]ramo/i },
  ];
  const POT_SISTEMAS = [
    { q: "Reservas Distritales de Humedal", re: /humedal/i, categoria: "humedales" },
    { q: "Manzanas del Cuidado",          re: /manzana\s*s?\s*del\s*cuidado/i },
    { q: "Corredores verdes",             re: /corredor(es)?\s+verde/i },
    { q: "Ciclorrutas y cicloalamedas",   re: /ciclorr?uta|cicloalameda/i },
    { q: "Red Metro",                     re: /\bmetro\b|primera\s+l[íi]nea|segunda\s+l[íi]nea|tercera\s+l[íi]nea/i },
    { q: "RegioTram",                     re: /regiotram/i },
    { q: "Cables aéreos",                 re: /\bcable/i },
    { q: "Bosques urbanos",               re: /bosque\s+urbano/i },
    { q: "Coberturas vegetales",          re: /cobertura[s]?\s+vegetal/i },
  ];
  function razonPot(e) {
    const n = String(e.nombre || "");
    if (ES_VIA(e)) { const v = viaDelPot(n); return v ? "Corredor vial que el POT nombra: " + v : null; }
    const lugar = POT_LUGARES.find((x) => x.re.test(n));
    if (lugar) return "Lugar que el POT nombra: " + lugar.q;
    const sis = POT_SISTEMAS.find((x) => (x.categoria ? e.categoria_id === x.categoria : x.re.test(n)));
    if (sis) return "Parte de un sistema que el POT nombra: " + sis.q;
    return null;
  }
  let soloPot = true;   // se puede alternar con el botón de la barra
  function viaDelPot(nombre) {
    const v = VIAS_POT.find((x) => x.re.test(String(nombre || "")));
    return v ? v.nombre : null;
  }

  const state = {
    categorias: [],
    elementos: [],
    conexiones: [],
    byId: new Map(),
    grado: new Map(),
    puentes: new Set(),
    edgeTypeOn: { directa: true, indirecta: true },
    highlight: null, // null | 'hubs' | 'perifericos' | 'puentes'
    apagados: new Set(),   // nodos desactivados en la simulación
  };
  const estaActivo = (id) => !state.apagados.has(id);
  const conexionActiva = (c) => estaActivo(c.origen) && estaActivo(c.destino);

  /* -------- Campos de la base que puede o no traer cada fila --------
     No se inventa nada: si el campo no está en la base, la ficha lo dice. */
  const CAMPOS_DESC = ["descripcion", "descripción", "detalle", "resumen", "definicion", "definición", "que_es", "observaciones"];
  const CAMPOS_ART = ["articulo", "artículo", "articulos", "artículos", "articulo_pot", "art_pot", "norma", "referencia_pot", "art"];
  const CAMPOS_MOTIVO = ["motivo", "razon", "razón", "descripcion", "descripción", "justificacion", "justificación", "por_que", "porque", "detalle", "evidencia"];
  function primerCampo(obj, claves) {
    if (!obj) return null;
    for (const k of claves) {
      const v = obj[k];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
    return null;
  }

  async function fetchTable(name) {
    const res = await fetch(SUPABASE_URL + "/rest/v1/" + name + "?select=*", {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY },
    });
    if (!res.ok) throw new Error("Error cargando " + name + ": " + res.status);
    return res.json();
  }

  // Caja fija sobre el área urbana de Bogotá (no min/max dinámico): así la
  // localidad rural de Sumapaz, muy alejada al sur, no aplasta el resto del
  // trazado — sus elementos quedan recortados (clamp) en el borde inferior.
  const BOUNDS = { lonMin: -74.20, lonMax: -74.00, latMin: 4.47, latMax: 4.82 };

  function project(lon, lat) {
    const clamp = (v) => Math.max(0, Math.min(1, v));
    const tx = clamp((lon - BOUNDS.lonMin) / (BOUNDS.lonMax - BOUNDS.lonMin));
    const ty = clamp((lat - BOUNDS.latMin) / (BOUNDS.latMax - BOUNDS.latMin));
    return { x: RECT.x0 + tx * (RECT.x1 - RECT.x0), y: RECT.y1 - ty * (RECT.y1 - RECT.y0) };
  }

  /* -------- grado y puntos de articulación (nodos "puente") -------- */
  function computeGradoYPuentes(elementos, conexiones) {
    const adj = new Map();
    elementos.forEach((e) => adj.set(e.id, []));
    conexiones.forEach((c) => {
      if (!adj.has(c.origen) || !adj.has(c.destino)) return;
      adj.get(c.origen).push(c.destino);
      adj.get(c.destino).push(c.origen);
    });
    const grado = new Map();
    adj.forEach((v, k) => grado.set(k, v.length));

    // Puntos de articulación (algoritmo de Tarjan, DFS iterativo para evitar
    // desbordar el stack con ~800 nodos encadenados).
    const disc = new Map(), low = new Map(), parent = new Map(), visited = new Set();
    const articulation = new Set();
    let timer = 0;

    adj.forEach((_, start) => {
      if (visited.has(start)) return;
      const stack = [{ id: start, iter: 0, children: 0 }];
      visited.add(start); disc.set(start, timer); low.set(start, timer); timer++;
      parent.set(start, null);
      while (stack.length) {
        const frame = stack[stack.length - 1];
        const neighbors = adj.get(frame.id);
        if (frame.iter < neighbors.length) {
          const v = neighbors[frame.iter++];
          if (!visited.has(v)) {
            frame.children++;
            visited.add(v); disc.set(v, timer); low.set(v, timer); timer++;
            parent.set(v, frame.id);
            stack.push({ id: v, iter: 0, children: 0 });
          } else if (v !== parent.get(frame.id)) {
            low.set(frame.id, Math.min(low.get(frame.id), disc.get(v)));
          }
        } else {
          stack.pop();
          const p = parent.get(frame.id);
          if (p != null) {
            low.set(p, Math.min(low.get(p), low.get(frame.id)));
            const pFrame = stack[stack.length - 1];
            const pIsRoot = parent.get(p) == null;
            if (pIsRoot && pFrame.children > 1) articulation.add(p);
            if (!pIsRoot && low.get(frame.id) >= disc.get(p)) articulation.add(p);
          }
        }
      }
    });
    return { grado, puentes: articulation };
  }

  /* -------- relajación por corrección posicional directa --------
     Cada nodo tiene su propio radio (según grado). La separación mínima
     entre dos nodos i,j es r_i + r_j + GAP (nunca menos): así queda "aire"
     de verdad entre todos, no solo entre los que tienen el mismo tamaño.
     Cada iteración corrige directamente la posición (sin velocidad, para
     que converja de forma monótona): separa los pares que invaden ese
     mínimo, acerca un poco los nodos conectados, y tira suave hacia el
     ancla geográfica. */
  function relaxLayout(elementos, conexiones) {
    const n = elementos.length;
    elementos.forEach((e) => {
      const p = project(e.lon_jitter, e.lat_jitter);
      e._x = p.x + (Math.random() - 0.5) * 6;
      e._y = p.y + (Math.random() - 0.5) * 6;
      e._ax = p.x; e._ay = p.y;
    });

    const cellSize = R_MAX * escalaNodo * 2 + GAP + 5; // mayor que cualquier separación mínima posible
    const gridKey = (cx, cy) => (cx + 16384) * 65536 + (cy + 16384);
    const EDGE_LEN = R_MAX * escalaNodo * 1.8;
    const ITER = 110;

    function buildGrid() {
      const grid = new Map();
      for (let i = 0; i < n; i++) {
        const e = elementos[i];
        const key = gridKey(Math.floor(e._x / cellSize), Math.floor(e._y / cellSize));
        let arr = grid.get(key);
        if (!arr) { arr = []; grid.set(key, arr); }
        arr.push(e);
      }
      return grid;
    }

    function separationPass(strict) {
      const grid = buildGrid();
      let any = false;
      for (let i = 0; i < n; i++) {
        const e = elementos[i];
        const cx = Math.floor(e._x / cellSize), cy = Math.floor(e._y / cellSize);
        for (let gx = cx - 1; gx <= cx + 1; gx++) {
          for (let gy = cy - 1; gy <= cy + 1; gy++) {
            const arr = grid.get(gridKey(gx, gy));
            if (!arr) continue;
            for (const o of arr) {
              if (o === e) continue;
              let dx = e._x - o._x, dy = e._y - o._y;
              let dist = Math.hypot(dx, dy);
              if (dist < 0.001) { dx = (Math.random() - 0.5) || 0.1; dy = (Math.random() - 0.5) || 0.1; dist = Math.hypot(dx, dy); }
              const minSep = e._r + o._r + GAP;
              if (dist < minSep - (strict ? 0.01 : 0)) {
                any = true;
                const overlap = (minSep - dist) / dist * 0.5;
                const mx = dx * overlap, my = dy * overlap;
                e._x += mx; e._y += my;
                o._x -= mx; o._y -= my;
              }
            }
          }
        }
      }
      return any;
    }

    for (let iter = 0; iter < ITER; iter++) {
      separationPass(false);

      // acercar un poco los nodos conectados (para que las líneas se lean con sentido)
      for (const c of conexiones) {
        const a = state.byId.get(c.origen), b = state.byId.get(c.destino);
        if (!a || !b) continue;
        const dx = b._x - a._x, dy = b._y - a._y;
        const dist = Math.hypot(dx, dy) || 0.01;
        const target = a._r + b._r + EDGE_LEN;
        if (dist > target) {
          const f = (dist - target) / dist * 0.05;
          a._x += dx * f; a._y += dy * f;
          b._x -= dx * f; b._y -= dy * f;
        }
      }

      // tirar suave hacia el ancla geográfica
      for (let i = 0; i < n; i++) {
        const e = elementos[i];
        e._x += (e._ax - e._x) * 0.012;
        e._y += (e._ay - e._y) * 0.012;
        e._x = Math.max(RECT.x0 + e._r, Math.min(RECT.x1 - e._r, e._x));
        e._y = Math.max(RECT.y0 + e._r, Math.min(RECT.y1 - e._r, e._y));
      }
    }

    // pasadas finales de solo-separación, sin resortes, para garantizar 0 solapes
    for (let pass = 0; pass < 700; pass++) {
      const any = separationPass(true);
      for (let i = 0; i < n; i++) {
        const e = elementos[i];
        e._x = Math.max(RECT.x0 + e._r, Math.min(RECT.x1 - e._r, e._x));
        e._y = Math.max(RECT.y0 + e._r, Math.min(RECT.y1 - e._r, e._y));
      }
      if (!any) break;
    }
  }

  function buildDefs(svg, colors) {
    const defs = document.createElementNS(SVG_NS, "defs");
    defs.setAttribute("id", "m2re-defs");
    colors.forEach((color) => {
      const filter = document.createElementNS(SVG_NS, "filter");
      filter.setAttribute("id", "m2re-glow-" + color.replace("#", ""));
      filter.setAttribute("x", "-60%"); filter.setAttribute("y", "-60%");
      filter.setAttribute("width", "220%"); filter.setAttribute("height", "220%");
      const blur = document.createElementNS(SVG_NS, "feGaussianBlur");
      blur.setAttribute("stdDeviation", "2"); blur.setAttribute("result", "blur");
      const merge = document.createElementNS(SVG_NS, "feMerge");
      ["blur", "SourceGraphic"].forEach((ref) => {
        const m = document.createElementNS(SVG_NS, "feMergeNode"); m.setAttribute("in", ref); merge.appendChild(m);
      });
      filter.appendChild(blur); filter.appendChild(merge);
      defs.appendChild(filter);
    });
    svg.appendChild(defs);
  }

  /* -------- zoom/pan propio de esta capa (independiente del de la red vieja) -------- */
  const view = { x: 0, y: 0, scale: 1 };
  let viewportG = null;

  function applyView() {
    if (viewportG) viewportG.setAttribute("transform", "translate(" + view.x + "," + view.y + ") scale(" + view.scale + ")");
    const label = document.getElementById("m2reZoomLevel");
    if (label) label.textContent = Math.round(view.scale * 100) + "%";
  }

  function clientToViewboxPoint(svg, clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return pt.matrixTransform(ctm.inverse());
  }

  function zoomBy(svg, factor, clientX, clientY) {
    const p = (clientX != null) ? clientToViewboxPoint(svg, clientX, clientY) : { x: 1250, y: 910 };
    const newScale = Math.max(0.15, Math.min(8, view.scale * factor));
    const ratio = newScale / view.scale;
    view.x = p.x - ratio * (p.x - view.x);
    view.y = p.y - ratio * (p.y - view.y);
    view.scale = newScale;
    applyView();
  }

  function setupOwnZoomPan(svg) {
    svg.addEventListener("wheel", (ev) => {
      if (!viewportG) return;
      ev.preventDefault();
      const factor = ev.deltaY > 0 ? 0.88 : 1.14;
      zoomBy(svg, factor, ev.clientX, ev.clientY);
    }, { passive: false });

    let dragging = false, startPt = null, start = { x: 0, y: 0 };
    svg.addEventListener("pointerdown", (ev) => {
      if (!viewportG) return;
      if (ev.target.closest && ev.target.closest(".m2re-node-group")) return;
      dragging = true;
      startPt = clientToViewboxPoint(svg, ev.clientX, ev.clientY);
      start.x = view.x; start.y = view.y;
      svg.setPointerCapture(ev.pointerId);
      svg.classList.add("m2re-panning");
    });
    svg.addEventListener("pointermove", (ev) => {
      if (!dragging) return;
      const p = clientToViewboxPoint(svg, ev.clientX, ev.clientY);
      view.x = start.x + (p.x - startPt.x);
      view.y = start.y + (p.y - startPt.y);
      applyView();
    });
    const endDrag = (ev) => {
      if (!dragging) return;
      dragging = false;
      svg.classList.remove("m2re-panning");
      try { svg.releasePointerCapture(ev.pointerId); } catch (err) {}
    };
    svg.addEventListener("pointerup", endDrag);
    svg.addEventListener("pointercancel", endDrag);

    document.getElementById("m2reZoomIn")?.addEventListener("click", () => zoomBy(svg, 1.35));
    document.getElementById("m2reZoomOut")?.addEventListener("click", () => zoomBy(svg, 1 / 1.35));
    document.getElementById("m2reZoomReset")?.addEventListener("click", () => {
      view.x = state._initView.x; view.y = state._initView.y; view.scale = state._initView.scale;
      applyView();
    });
  }

  /* -------- resaltados: hubs / periféricos / puentes -------- */
  function clearHighlight() {
    document.querySelectorAll(".m2re-node-ring.m2re-hl").forEach((c) => c.classList.remove("m2re-hl"));
  }
  function applyHighlight(mode) {
    clearHighlight();
    state.highlight = mode;
    const info = document.getElementById("m2reHighlightInfo");
    if (mode === null) { if (info) info.textContent = ""; updateHighlightButtons(); return; }

    let ids = [];
    if (mode === "hubs") {
      const gradoVals = [...state.grado.values()].sort((a, b) => b - a);
      const p90 = gradoVals[Math.floor(gradoVals.length * 0.1)] ?? 0;
      const umbral = Math.max(p90, 12);
      ids = state.elementos.filter((e) => (state.grado.get(e.id) || 0) >= umbral).map((e) => e.id);
    } else if (mode === "perifericos") {
      ids = state.elementos.filter((e) => (state.grado.get(e.id) || 0) <= 1).map((e) => e.id);
    } else if (mode === "puentes") {
      ids = [...state.puentes];
    }
    ids.forEach((id) => { const e = state.byId.get(id); if (e && e._node) e._node.classList.add("m2re-hl"); });

    if (info) {
      const labels = { hubs: "nodos hub (más conectados)", perifericos: "nodos periféricos (0-1 conexiones)", puentes: "nodos puente (si se quitan, la red se parte en piezas separadas)" };
      info.textContent = ids.length + " " + labels[mode];
    }
    updateHighlightButtons();
  }
  function updateHighlightButtons() {
    ["m2reBtnHubs", "m2reBtnPerifericos", "m2reBtnPuentes"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.toggle("active", (id === "m2reBtnHubs" && state.highlight === "hubs") ||
        (id === "m2reBtnPerifericos" && state.highlight === "perifericos") ||
        (id === "m2reBtnPuentes" && state.highlight === "puentes"));
    });
  }
  function setupHighlightButtons() {
    document.getElementById("m2reBtnHubs")?.addEventListener("click", () => applyHighlight(state.highlight === "hubs" ? null : "hubs"));
    document.getElementById("m2reBtnPerifericos")?.addEventListener("click", () => applyHighlight(state.highlight === "perifericos" ? null : "perifericos"));
    document.getElementById("m2reBtnPuentes")?.addEventListener("click", () => applyHighlight(state.highlight === "puentes" ? null : "puentes"));
    // Reusa los botones "Todas/Directas/Indirectas" de la leyenda original
    // (que ya solo controlan la red vieja, ahora oculta) para que también
    // filtren esta red por tipo de conexión.
    document.querySelectorAll(".legend-footer-row .control-btn").forEach((btn) => {
      const txt = btn.textContent.trim();
      if (txt === "Todas") btn.addEventListener("click", () => setEdgeTypeFilter(true, true));
      if (txt === "Directas") btn.addEventListener("click", () => setEdgeTypeFilter(true, false));
      if (txt === "Indirectas") btn.addEventListener("click", () => setEdgeTypeFilter(false, true));
    });
  }
  function setEdgeTypeFilter(directa, indirecta) {
    state.edgeTypeOn.directa = directa;
    state.edgeTypeOn.indirecta = indirecta;
    document.querySelectorAll(".m2re-edge").forEach((line) => {
      const on = (line.classList.contains("m2re-edge-directa") && directa) ||
        (line.classList.contains("m2re-edge-indirecta") && indirecta);
      if (on) delete line.dataset.filteredOut; else line.dataset.filteredOut = "1";
    });
  }

  // Vuelve a calcular grado/puentes con los nodos encendidos, reacomoda la
  // red y repinta. Es lo que hace que al apagar un hub la red se reestructure.
  let recalcularRed = () => {};

  function buildLayer() {
    const svg = document.getElementById("networkViz");
    if (!svg) return;
    const old = svg.querySelector("#m2-red-externa");
    if (old) old.remove();
    const oldDefs = svg.querySelector("#m2re-defs");
    if (oldDefs) oldDefs.remove();

    buildDefs(svg, Object.values(ESTRUCTURA_STYLE).map((s) => s.color));

    const { grado, puentes } = computeGradoYPuentes(state.elementos, state.conexiones);
    state.grado = grado; state.puentes = puentes;
    state.elementos.forEach((e) => { e._r = radiusForDegree(grado.get(e.id) || 0); });

    relaxLayout(state.elementos, state.conexiones);

    // capa propia, colgada directo del <svg> (NO de #zoom-pan-group): así el
    // zoom/pan de esta red no depende ni interfiere con el de la red vieja.
    const layer = document.createElementNS(SVG_NS, "g");
    layer.setAttribute("id", "m2-red-externa");
    svg.appendChild(layer);
    viewportG = document.createElementNS(SVG_NS, "g");
    viewportG.setAttribute("id", "m2re-viewport");
    layer.appendChild(viewportG);

    // zoom inicial: encuadra TODA la red (con margen), para dar una vista de
    // conjunto legible de entrada; desde ahí se puede acercar a cada zona.
    const xs = state.elementos.map((e) => e._x).sort((a, b) => a - b);
    const ys = state.elementos.map((e) => e._y).sort((a, b) => a - b);
    const pct = (arr, q) => arr[Math.min(arr.length - 1, Math.max(0, Math.round((arr.length - 1) * q)))] || 0;
    const margen = R_MAX * escalaNodo * 2;
    let minX = pct(xs, 0.02) - margen, maxX = pct(xs, 0.98) + margen;
    let minY = pct(ys, 0.02) - margen, maxY = pct(ys, 0.98) + margen;
    const w = maxX - minX, h = maxY - minY;
    const fitScale = Math.max(0.15, Math.min(2500 / w, 1820 / h) * 0.94);
    view.scale = fitScale;
    view.x = 1250 - (minX + maxX) / 2 * fitScale;
    view.y = 910 - (minY + maxY) / 2 * fitScale;
    state._initView = { x: view.x, y: view.y, scale: view.scale };
    applyView();
    setupOwnZoomPan(svg);
    setupHighlightButtons();

    const edgesG = document.createElementNS(SVG_NS, "g");
    edgesG.setAttribute("class", "m2re-edges");
    viewportG.appendChild(edgesG);
    const edgesByNode = new Map();
    const vecinosPorNodo = new Map();
    state.conexiones.forEach((c) => {
      const a = state.byId.get(c.origen), b = state.byId.get(c.destino);
      if (!a || !b) return;
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", a._x); line.setAttribute("y1", a._y);
      line.setAttribute("x2", b._x); line.setAttribute("y2", b._y);
      line.setAttribute("class", "m2re-edge " + (c.tipo === "directa" ? "m2re-edge-directa" : "m2re-edge-indirecta"));
      line.dataset.origen = c.origen; line.dataset.destino = c.destino;
      line._conexion = c;
      edgesG.appendChild(line);
      [a.id, b.id].forEach((id) => {
        if (!edgesByNode.has(id)) edgesByNode.set(id, []);
        edgesByNode.get(id).push(line);
      });
      if (!vecinosPorNodo.has(a.id)) vecinosPorNodo.set(a.id, []);
      if (!vecinosPorNodo.has(b.id)) vecinosPorNodo.set(b.id, []);
      vecinosPorNodo.get(a.id).push(b.id);
      vecinosPorNodo.get(b.id).push(a.id);
    });

    const nodesG = document.createElementNS(SVG_NS, "g");
    nodesG.setAttribute("class", "m2re-nodes");
    viewportG.appendChild(nodesG);

    const edgesTopG = document.createElementNS(SVG_NS, "g");
    edgesTopG.setAttribute("class", "m2re-edges-top");
    viewportG.appendChild(edgesTopG);
    const nodesTopG = document.createElementNS(SVG_NS, "g");
    nodesTopG.setAttribute("class", "m2re-nodes-top");
    viewportG.appendChild(nodesTopG);

    function enfocar(encendidas, gruposArriba) {
      edgesG.style.opacity = "0.09";
      nodesG.style.opacity = "0.22";
      encendidas.forEach((line) => { if (!line.dataset.filteredOut) edgesTopG.appendChild(line); });
      gruposArriba.forEach((g) => { if (g) nodesTopG.appendChild(g); });
    }
    function desenfocar() {
      edgesG.style.opacity = "";
      nodesG.style.opacity = "";
      while (edgesTopG.firstChild) edgesG.appendChild(edgesTopG.firstChild);
      while (nodesTopG.firstChild) nodesG.appendChild(nodesTopG.firstChild);
    }

    // Foco: enciende las conexiones de un nodo y apaga el resto de la red.
    // Con el cursor es momentáneo; con doble clic queda FIJO hasta que se
    // vuelve a hacer doble clic o se toca el fondo.
    let focoFijo = null;
    function aplicarFoco(e) {
      const vecinos = (vecinosPorNodo.get(e.id) || []).map((v) => state.byId.get(v)?._group).filter(Boolean);
      (e._aristas || []).forEach((line) => {
        if (line.dataset.filteredOut) return;
        line.classList.add("m2re-edge-activa");
        line.setAttribute("stroke", e._colorBase);
        line.style.strokeWidth = "2.2";
      });
      enfocar(e._aristas || [], [e._group].concat(vecinos));
    }
    function limpiarFoco(e) {
      (e._aristas || []).forEach((line) => {
        line.classList.remove("m2re-edge-activa");
        line.style.strokeWidth = "";
        line.removeAttribute("stroke");
      });
      desenfocar();
    }
    function alternarFocoFijo(e) {
      if (focoFijo === e.id) { limpiarFoco(e); focoFijo = null; return; }
      if (focoFijo != null) { const previo = state.byId.get(focoFijo); if (previo) limpiarFoco(previo); }
      focoFijo = e.id;
      aplicarFoco(e);
    }
    function soltarFocoFijo() {
      if (focoFijo == null) return;
      const previo = state.byId.get(focoFijo);
      if (previo) limpiarFoco(previo);
      focoFijo = null;
    }
    layer._soltarFoco = soltarFocoFijo;

    // dibuja primero los de menor grado y al final los hubs, para que los
    // más grandes/importantes queden siempre por encima visualmente.
    const ordenDibujo = [...state.elementos].sort((a, b) => (state.grado.get(a.id) || 0) - (state.grado.get(b.id) || 0));

    ordenDibujo.forEach((e) => {
      const estructura = CATEGORIA_A_ESTRUCTURA[e.categoria_id] || "e2";
      const style = ESTRUCTURA_STYLE[estructura];
      const color = style.color;
      const icon = style.icon;
      const r = e._r;

      const group = document.createElementNS(SVG_NS, "g");
      group.setAttribute("class", "m2re-node-group");
      group.dataset.id = e.id;

      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("class", "m2re-node-ring");
      circle.setAttribute("cx", e._x); circle.setAttribute("cy", e._y); circle.setAttribute("r", r);
      circle.setAttribute("fill", "#0a0a0a");
      circle.setAttribute("stroke", color);
      circle.setAttribute("stroke-width", Math.max(1.6, Math.min(3.2, 1.4 + r / 30)));
      circle.setAttribute("filter", "url(#m2re-glow-" + color.replace("#", "") + ")");

      const size = r * 1.8;
      const fo = document.createElementNS(SVG_NS, "foreignObject");
      fo.setAttribute("x", e._x - size / 2); fo.setAttribute("y", e._y - size / 2);
      fo.setAttribute("width", size); fo.setAttribute("height", size);

      const wrapper = document.createElementNS(XHTML_NS, "div");
      wrapper.setAttribute("style", "width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;pointer-events:none;padding:2px;overflow:hidden;box-sizing:border-box;");

      const iconEl = document.createElementNS(XHTML_NS, "i");
      iconEl.setAttribute("class", "fa-solid " + icon);
      iconEl.setAttribute("style", "color:" + color + "; font-size:" + Math.max(9, r * 0.34) + "px; line-height:1;");

      const nameEl = document.createElementNS(XHTML_NS, "div");
      nameEl.setAttribute("style", "font-size:" + Math.max(5.5, r * 0.19) + "px; padding:0 1px; font-weight:700; color:#f2f3f6; line-height:1.08; text-align:center; font-family:'Inter',sans-serif; word-break:break-word; max-height:" + (r * 1.1) + "px; overflow:hidden;");
      nameEl.textContent = e.nombre;

      wrapper.appendChild(iconEl); wrapper.appendChild(nameEl);
      fo.appendChild(wrapper);
      group.appendChild(circle); group.appendChild(fo);

      const misAristas = edgesByNode.get(e.id) || [];
      e._aristas = misAristas;
      e._colorBase = color;
      // con el cursor: foco momentáneo (si no hay uno fijado con doble clic)
      group.addEventListener("pointerenter", () => { if (focoFijo == null) aplicarFoco(e); });
      group.addEventListener("pointerleave", () => { if (focoFijo == null) limpiarFoco(e); });
      group.addEventListener("click", (ev) => {
        ev.stopPropagation();
        abrirFicha(e);
      });

      nodesG.appendChild(group);
      e._node = circle;
      e._fo = fo;
      e._group = group;
      e._colorBase = color;
    });

    // ---------- simulación: encender / apagar nodos ----------
    const lineaPorPar = new Map();
    state.conexiones.forEach((c, i) => lineaPorPar.set(c.origen + "|" + c.destino, edgesG.children[i]));

    function pintarEstado() {
      state.elementos.forEach((e) => {
        const activo = estaActivo(e.id);
        if (!e._group) return;
        e._group.style.opacity = activo ? "" : "0.16";
        e._node.setAttribute("stroke", activo ? e._colorBase : "#5a6470");
        e._node.setAttribute("stroke-dasharray", activo ? "" : "3 3");
      });
      [...edgesG.children, ...edgesTopG.children].forEach((line) => {
        const a = line.dataset.origen, b = line.dataset.destino;
        const viva = estaActivo(Number(a)) && estaActivo(Number(b));
        line.style.opacity = viva ? "" : "0.04";
      });
    }

    function moverNodos() {
      state.elementos.forEach((e) => {
        if (!e._group) return;
        // posición Y TAMAÑO: el radio depende del grado, que cambia cuando
        // se apagan nodos, así que hay que volver a escribirlo (antes solo
        // se movían y el tamaño se quedaba con el valor viejo)
        e._node.setAttribute("cx", e._x); e._node.setAttribute("cy", e._y);
        e._node.setAttribute("r", e._r);
        e._node.setAttribute("stroke-width", Math.max(1.6, Math.min(3.2, 1.4 + e._r / 30)));
        const size = e._r * 1.8;
        e._fo.setAttribute("x", e._x - size / 2); e._fo.setAttribute("y", e._y - size / 2);
        e._fo.setAttribute("width", size); e._fo.setAttribute("height", size);
        const icono = e._fo.querySelector("i");
        const texto = e._fo.querySelector("div > div");
        if (icono) icono.style.fontSize = Math.max(9, e._r * 0.34) + "px";
        if (texto) { texto.style.fontSize = Math.max(5.5, e._r * 0.19) + "px"; texto.style.maxHeight = (e._r * 1.1) + "px"; }
      });
      [...edgesG.children, ...edgesTopG.children].forEach((line) => {
        const a = state.byId.get(Number(line.dataset.origen)), b = state.byId.get(Number(line.dataset.destino));
        if (!a || !b) return;
        line.setAttribute("x1", a._x); line.setAttribute("y1", a._y);
        line.setAttribute("x2", b._x); line.setAttribute("y2", b._y);
      });
    }

    recalcularRed = function () {
      soltarFocoFijo();
      // grado y puentes SOLO con lo que sigue encendido
      const vivos = state.elementos.filter((e) => estaActivo(e.id));
      const vivas = state.conexiones.filter(conexionActiva);
      const { grado, puentes } = computeGradoYPuentes(vivos, vivas);
      state.grado = grado; state.puentes = puentes;
      state.elementos.forEach((e) => { e._r = radiusForDegree(grado.get(e.id) || 0); });
      relaxLayout(state.elementos, vivas);
      moverNodos();
      pintarEstado();
      const aislados = vivos.filter((e) => (grado.get(e.id) || 0) === 0).length;
      const info = document.getElementById("m2reSimInfo");
      if (info) info.textContent = vivos.length + " de " + state.elementos.length + " nodos activos · " +
        vivas.length + " conexiones activas · " + puentes.size + " nodos puente · " + aislados + " aislados";
      if (!document.getElementById("m2reConclusiones")?.hidden) abrirConclusiones();
    };

    // doble clic sobre un nodo = dejar iluminadas SUS conexiones
    state.elementos.forEach((e) => {
      e._group?.addEventListener("dblclick", (ev) => {
        ev.stopPropagation(); ev.preventDefault();
        alternarFocoFijo(e);
        abrirFicha(e);
      });
    });
    document.getElementById("m2reBtnApagarTodos")?.addEventListener("click", () => {
      state.elementos.forEach((e) => state.apagados.add(e.id));
      recalcularRed(); cerrarFicha();
    });
    document.getElementById("m2reBtnEncenderTodos")?.addEventListener("click", () => {
      state.apagados.clear(); recalcularRed(); cerrarFicha();
    });
    document.getElementById("m2reBtnApagarHubs")?.addEventListener("click", () => {
      const ordenados = [...state.elementos].sort((a, b) => (state.grado.get(b.id) || 0) - (state.grado.get(a.id) || 0));
      const cuantos = Math.max(1, Math.round(ordenados.length * 0.05));
      ordenados.slice(0, cuantos).forEach((e) => state.apagados.add(e.id));
      recalcularRed(); cerrarFicha();
    });
    pintarEstado();
  }

  function alternarNodo(id) {
    if (state.apagados.has(id)) state.apagados.delete(id); else state.apagados.add(id);
    recalcularRed();
    const e = state.byId.get(id);
    if (e) abrirFicha(e);
  }

  /* ---------- Ficha del nodo: qué es, artículos del POT y por qué se
     conecta con cada vecino. Lo que la base no traiga se dice, no se
     inventa. ---------- */
  function cerrarFicha() {
    const f = document.getElementById("m2reFicha");
    if (f) { f.hidden = true; f.innerHTML = ""; }
  }
  function abrirFicha(e) {
    const f = document.getElementById("m2reFicha");
    if (!f) return;
    const estructura = CATEGORIA_A_ESTRUCTURA[e.categoria_id] || "e2";
    const style = ESTRUCTURA_STYLE[estructura];
    const grado = state.grado.get(e.id) || 0;
    const apagado = !estaActivo(e.id);
    const desc = primerCampo(e, CAMPOS_DESC);
    const art = primerCampo(e, CAMPOS_ART) || (e._viaPot ? "Corredor nombrado por el POT (Bogotá Reverdece): " + e._viaPot : null);

    const vecinos = state.conexiones
      .filter((c) => c.origen === e.id || c.destino === e.id)
      .map((c) => {
        const otro = state.byId.get(c.origen === e.id ? c.destino : c.origen);
        return otro ? { otro, c } : null;
      })
      .filter(Boolean);

    const vecinosHtml = vecinos.length
      ? vecinos.map(({ otro, c }) => {
          const motivo = primerCampo(c, CAMPOS_MOTIVO);
          const tipo = c.tipo === "directa" ? "Relación directa" : "Relación indirecta";
          const razon = motivo
            ? escapeHtml(motivo)
            : tipo + " — el motivo no está registrado en la base de datos" +
              (estaActivo(otro.id) ? "" : " · nodo desactivado");
          return '<button type="button" class="m2re-vecino-btn" data-ir="' + otro.id + '">' +
                 escapeHtml(otro.nombre) + '<small>' + razon + '</small></button>';
        }).join("")
      : '<p class="m2re-ficha-vacio">Sin conexiones registradas.</p>';

    f.innerHTML =
      '<button type="button" class="m2re-ficha-cerrar" aria-label="Cerrar">&times;</button>' +
      '<span class="m2re-ficha-cat" style="background:' + style.color + '22;color:' + style.color + ';border:1px solid ' + style.color + '55;">' +
        '<i class="fa-solid ' + style.icon + '"></i>' + escapeHtml(style.label || e.categoria_id) + '</span>' +
      '<h4>' + escapeHtml(e.nombre) + '</h4>' +
      '<div class="m2re-ficha-datos">' +
        '<span class="m2re-chip">' + escapeHtml(e.localidad || "Sin localidad") + '</span>' +
        '<span class="m2re-chip">' + grado + ' conexiones</span>' +
        (state.puentes.has(e.id) ? '<span class="m2re-chip">nodo puente</span>' : '') +
        (apagado ? '<span class="m2re-chip">desactivado</span>' : '') +
      '</div>' +
      '<p class="m2re-ficha-etiqueta">Qué es</p>' +
      (desc ? '<p>' + escapeHtml(desc) + '</p>' : '<p class="m2re-ficha-vacio">La base de datos no trae una descripción para este elemento.</p>') +
      '<p class="m2re-ficha-etiqueta">Artículo del POT</p>' +
      (art ? '<p>' + escapeHtml(art) + '</p>' : '<p class="m2re-ficha-vacio">No hay artículo del POT registrado para este elemento en la base de datos.</p>') +
      '<p class="m2re-ficha-etiqueta">Por qué se conecta</p>' + vecinosHtml +
      '<button type="button" class="m2re-ficha-toggle' + (apagado ? ' apagado' : '') + '">' +
        (apagado ? 'Activar este nodo' : 'Desactivar este nodo') + '</button>';

    f.hidden = false;
    f.querySelector(".m2re-ficha-cerrar")?.addEventListener("click", cerrarFicha);
    f.querySelector(".m2re-ficha-toggle")?.addEventListener("click", () => alternarNodo(e.id));
    f.querySelectorAll(".m2re-vecino-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const otro = state.byId.get(Number(btn.dataset.ir));
        if (otro) abrirFicha(otro);
      });
    });
  }

  let tooltipEl = null;
  function showTooltip(clientX, clientY, e) {
    hideTooltip();
    const vecinos = state.conexiones
      .filter((c) => c.origen === e.id || c.destino === e.id)
      .map((c) => {
        const otherId = c.origen === e.id ? c.destino : c.origen;
        const other = state.byId.get(otherId);
        return other ? other.nombre : null;
      })
      .filter(Boolean);
    const grado = state.grado.get(e.id) || 0;
    tooltipEl = document.createElement("div");
    tooltipEl.className = "m2re-tooltip";
    let html = "<strong>" + escapeHtml(e.nombre) + "</strong>" + escapeHtml(e.localidad) +
      "<small>Grado: " + grado + (state.puentes.has(e.id) ? " · nodo puente" : "") + "</small>";
    if (vecinos.length) {
      html += "<small>Conectado con: " + vecinos.slice(0, 6).map(escapeHtml).join(", ") +
        (vecinos.length > 6 ? " y " + (vecinos.length - 6) + " más" : "") + "</small>";
    } else {
      html += "<small>Sin conexiones cercanas registradas</small>";
    }
    tooltipEl.innerHTML = html;
    document.body.appendChild(tooltipEl);
    const rect = tooltipEl.getBoundingClientRect();
    let left = clientX + 12, top = clientY + 12;
    if (left + rect.width > window.innerWidth) left = clientX - rect.width - 12;
    if (top + rect.height > window.innerHeight) top = clientY - rect.height - 12;
    tooltipEl.style.left = left + "px";
    tooltipEl.style.top = top + "px";
  }
  function hideTooltip() {
    if (tooltipEl) { tooltipEl.remove(); tooltipEl = null; }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Deja en la red solo lo que el POT nombra (o toda la base, si se apaga
  // el filtro con el botón de la barra).
  function aplicarFiltroPot() {
    const todos = state.todosElementos || [];
    state.elementos = soloPot ? todos.filter((e) => e._razonPot) : todos.slice();
    state.byId = new Map(state.elementos.map((e) => [e.id, e]));
    const todasCon = state.todasConexiones || [];
    state.conexiones = todasCon.filter((c) => state.byId.has(c.origen) && state.byId.has(c.destino));
    if (soloPot) {
      // Al quedarse solo con lo que el POT nombra, la mayoría de vecinos
      // directos desaparece. Se reconstruye el vínculo con las relaciones de
      // la PROPIA base: si dos elementos del POT estaban unidos por un
      // camino que solo atraviesa elementos retirados, esa relación se
      // conserva como indirecta.
      // OJO: hay que limitarlas. Sin límite cada superviviente heredaba las
      // conexiones de todos sus vecinos retirados y la red terminaba con 12
      // conexiones por nodo — una maraña. Cada nodo conserva solo sus
      // MAX_DERIVADAS relaciones más cercanas.
      const MAX_SALTOS = 2;        // solo a través de UN elemento retirado
      const MAX_DERIVADAS = 3;     // por nodo
      const ady = new Map();
      todasCon.forEach((c) => {
        if (!ady.has(c.origen)) ady.set(c.origen, []);
        if (!ady.has(c.destino)) ady.set(c.destino, []);
        ady.get(c.origen).push(c.destino);
        ady.get(c.destino).push(c.origen);
      });
      const dist = (a, b) => Math.hypot((a.lon_jitter || 0) - (b.lon_jitter || 0), (a.lat_jitter || 0) - (b.lat_jitter || 0));
      const candidatas = [];
      const yaHay = new Set(state.conexiones.map((c) => [c.origen, c.destino].sort().join("|")));
      state.elementos.forEach((origen) => {
        const visto = new Map([[origen.id, 0]]);
        const cola = [origen.id];
        while (cola.length) {
          const actual = cola.shift();
          const saltos = visto.get(actual);
          if (saltos >= MAX_SALTOS) continue;
          (ady.get(actual) || []).forEach((vec) => {
            if (visto.has(vec)) return;
            visto.set(vec, saltos + 1);
            if (state.byId.has(vec)) {
              if (vec === origen.id) return;
              const clave = [origen.id, vec].sort().join("|");
              if (yaHay.has(clave)) return;
              candidatas.push({ a: origen.id, b: vec, clave, saltos, d: dist(origen, state.byId.get(vec)) });
            } else {
              cola.push(vec);   // solo se atraviesan elementos retirados
            }
          });
        }
      });
      // Además se descartan las relaciones derivadas que cruzarían media
      // ciudad: son ruido visual. El tope se saca de los propios datos (el
      // doble de la distancia mediana de las conexiones directas que
      // quedaron), no de un número inventado.
      const porTodos = new Map(todos.map((e) => [e.id, e]));
      const largos = todasCon
        .map((c) => { const a = porTodos.get(c.origen), b = porTodos.get(c.destino); return a && b ? dist(a, b) : null; })
        .filter((x) => x != null).sort((x, y) => x - y);
      const mediana = largos.length ? largos[Math.floor(largos.length / 2)] : 0;
      const TOPE_DIST = mediana > 0 ? mediana * 4 : Infinity;
      // las más cercanas primero, y con tope por nodo
      candidatas.sort((x, y) => (x.saltos - y.saltos) || (x.d - y.d));
      const cuenta = new Map();
      const usadas = new Set();
      candidatas.forEach((k) => {
        if (usadas.has(k.clave)) return;
        if (k.d > TOPE_DIST) return;
        const ca = cuenta.get(k.a) || 0, cb = cuenta.get(k.b) || 0;
        if (ca >= MAX_DERIVADAS || cb >= MAX_DERIVADAS) return;
        usadas.add(k.clave);
        cuenta.set(k.a, ca + 1); cuenta.set(k.b, cb + 1);
        state.conexiones.push({
          origen: k.a, destino: k.b, tipo: "indirecta",
          motivo: "Relación a través de " + k.saltos + " elemento" + (k.saltos === 1 ? "" : "s") +
                  " que el POT no nombra (según las conexiones de la base de datos).",
          _derivada: true,
        });
      });
    }
    state.apagados = new Set();
    state.filtroInfo = { total: todos.length, conservados: state.elementos.length };
    ajustarEscalaNodo(state.elementos.length);
  }

  async function init() {
    const status = document.getElementById("m2CategoriasStatus");
    if (status) status.textContent = "Cargando base de datos…";
    try {
      const [categorias, elementos, conexiones] = await Promise.all([
        fetchTable("m2_categorias"), fetchTable("m2_elementos"), fetchTable("m2_conexiones"),
      ]);
      state.categorias = categorias;
      state.todosElementos = elementos;
      state.todasConexiones = conexiones;
      elementos.forEach((e) => { e._razonPot = razonPot(e); if (ES_VIA(e) && e._razonPot) e._viaPot = viaDelPot(e.nombre); });
      aplicarFiltroPot();
      if (status) status.textContent = "Calculando red (grados, puentes, disposición sin superposiciones)…";
      // deja pintar el mensaje antes del cálculo (puede tardar ~1s)
      await new Promise((r) => setTimeout(r, 30));
      buildLayer();
      pintarEstadoFiltro(status);
    } catch (err) {
      if (status) status.textContent = "No se pudo cargar la base de datos.";
      console.error("[m2-red-externa]", err);
    }
  }

  function pintarEstadoFiltro(status) {
    const st = status || document.getElementById("m2CategoriasStatus");
    if (!st) return;
    st.textContent = state.elementos.length + " nodos · " + state.conexiones.length + " conexiones · " +
      state.puentes.size + " nodos puente · " +
      (soloPot ? "solo los " + state.filtroInfo.conservados + " elementos que el POT nombra (de " + state.filtroInfo.total + ")"
               : "toda la base de datos (" + state.filtroInfo.total + " elementos)");
    const btn = document.getElementById("m2reBtnSoloPot");
    if (btn) {
      btn.classList.toggle("active", soloPot);
      btn.innerHTML = soloPot ? '<i class="fa-solid fa-filter"></i> Solo lo que el POT nombra'
                              : '<i class="fa-solid fa-filter-circle-xmark"></i> Viendo toda la base';
    }
  }

  /* ---------- Conclusiones de la red ----------
     Todo lo que afirma el panel se mide sobre la red que está en pantalla
     en ese momento (nodos y conexiones activas). Ningún número va escrito
     a mano: si se apagan nodos o se quita el filtro del POT, las
     conclusiones se recalculan. */
  const ESTRUCTURA_NOMBRE = {
    e1: "Estructura Ecológica Principal",
    e2: "Estructura Funcional y del Cuidado",
    e3: "Estructura Socioeconómica, Creativa y de Innovación",
    e4: "Estructura Integradora de Patrimonios",
  };
  const estructuraDe = (e) => CATEGORIA_A_ESTRUCTURA[e.categoria_id] || "e2";
  const pct = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0);

  // tamaños de las componentes conexas, de mayor a menor
  function componentesDe(ids, conexiones) {
    const ady = new Map(ids.map((id) => [id, []]));
    conexiones.forEach((c) => {
      if (!ady.has(c.origen) || !ady.has(c.destino)) return;
      ady.get(c.origen).push(c.destino);
      ady.get(c.destino).push(c.origen);
    });
    const visto = new Set(), tamanos = [];
    ady.forEach((_, start) => {
      if (visto.has(start)) return;
      let n = 0; const pila = [start]; visto.add(start);
      while (pila.length) {
        const cur = pila.pop(); n++;
        (ady.get(cur) || []).forEach((v) => { if (!visto.has(v)) { visto.add(v); pila.push(v); } });
      }
      tamanos.push(n);
    });
    return tamanos.sort((a, b) => b - a);
  }

  function calcularConclusiones() {
    const vivos = state.elementos.filter((e) => estaActivo(e.id));
    const vivas = state.conexiones.filter(conexionActiva);
    const grado = state.grado;

    // reparto por estructura del POT
    const porEstructura = {};
    Object.keys(ESTRUCTURA_NOMBRE).forEach((k) => { porEstructura[k] = { nodos: 0, extremos: 0 }; });
    vivos.forEach((e) => { porEstructura[estructuraDe(e)].nodos++; });
    let cruzadas = 0;
    vivas.forEach((c) => {
      const a = state.byId.get(c.origen), b = state.byId.get(c.destino);
      if (!a || !b) return;
      const ea = estructuraDe(a), eb = estructuraDe(b);
      porEstructura[ea].extremos++; porEstructura[eb].extremos++;
      if (ea !== eb) cruzadas++;
    });

    // concentración: el 5% de nodos con más conexiones
    const ordenados = [...vivos].sort((a, b) => (grado.get(b.id) || 0) - (grado.get(a.id) || 0));
    const cuantosHubs = Math.max(1, Math.round(vivos.length * 0.05));
    const hubs = ordenados.slice(0, cuantosHubs);
    const idsHub = new Set(hubs.map((e) => e.id));
    const conHub = vivas.filter((c) => idsHub.has(c.origen) || idsHub.has(c.destino)).length;

    // qué queda si esos hubs se apagan
    const idsSinHub = vivos.filter((e) => !idsHub.has(e.id)).map((e) => e.id);
    const setSinHub = new Set(idsSinHub);
    const vivasSinHub = vivas.filter((c) => setSinHub.has(c.origen) && setSinHub.has(c.destino));
    const comps = componentesDe(idsSinHub, vivasSinHub);
    const sueltosSinHub = comps.filter((t) => t === 1).length;

    const conexionesSinHub = vivasSinHub.length;
    const conservadosPot = (state.todosElementos || []).filter((e) => e._razonPot).length;

    const aislados = vivos.filter((e) => (grado.get(e.id) || 0) === 0).length;
    const derivadas = vivas.filter((c) => c._derivada).length;
    const indirectas = vivas.filter((c) => c.tipo === "indirecta").length;

    return {
      nodos: vivos.length,
      conexiones: vivas.length,
      totalBase: (state.filtroInfo && state.filtroInfo.total) || vivos.length,
      soloPot,
      porEstructura,
      cruzadas,
      hubs, cuantosHubs, conHub,
      compsSinHub: comps.length,
      mayorSinHub: comps[0] || 0,
      sueltosSinHub, conexionesSinHub, conservadosPot,
      aislados,
      puentes: state.puentes.size,
      derivadas, indirectas,
      apagados: state.apagados.size,
    };
  }

  function htmlConclusiones() {
    const d = calcularConclusiones();
    const gradoMedio = d.nodos ? (d.conexiones * 2 / d.nodos).toFixed(1) : "0";
    const filaEstructura = Object.keys(ESTRUCTURA_NOMBRE).map((k) => {
      const s = ESTRUCTURA_STYLE[k], p = d.porEstructura[k];
      return '<div class="m2re-concl-barra">' +
        '<span class="m2re-concl-punto" style="background:' + s.color + '"></span>' +
        '<span class="m2re-concl-barra-nom">' + ESTRUCTURA_NOMBRE[k] + '</span>' +
        '<span class="m2re-concl-barra-track"><span class="m2re-concl-barra-fill" style="width:' +
          pct(p.nodos, d.nodos) + '%;background:' + s.color + '"></span></span>' +
        '<span class="m2re-concl-barra-val">' + p.nodos + ' · ' + pct(p.nodos, d.nodos) + '%</span>' +
        '</div>';
    }).join("");

    const dato = (v, t) => '<div class="m2re-concl-dato"><b>' + v + '</b><span>' + t + '</span></div>';
    const plural = (n, sing, plu) => n + " " + (n === 1 ? sing : plu);

    // La redacción sigue a los números medidos: si la red no se parte, no se
    // dice que se parte; si no hay nodos puente, se dice que no los hay.
    const concentra = pct(d.conHub, d.conexiones);
    const tituloHubs = concentra >= 30
      ? "2. La red se sostiene sobre muy pocos nodos"
      : "2. El peso de la red está repartido de forma desigual";
    const fragmento = d.compsSinHub > 1
      ? 'Si se apagan solo esos, la red se parte en <b>' + plural(d.compsSinHub, "pedazo", "pedazos") +
        '</b> —el mayor conserva ' + d.mayorSinHub + ' nodos— y <b>' + plural(d.sueltosSinHub, "elemento queda suelto", "elementos quedan sueltos") + '</b>.'
      : 'Si se apagan solo esos, la red sigue en una sola pieza, pero pierde <b>' +
        (d.conexiones - d.conexionesSinHub) + '</b> conexiones (' + pct(d.conexiones - d.conexionesSinHub, d.conexiones) + '%).';
    const puentesTxt = d.puentes > 0
      ? 'Además hay <b>' + plural(d.puentes, "nodo puente", "nodos puente") + '</b>: basta con quitar uno para que una parte del territorio se desconecte del resto.'
      : 'No hay ningún nodo puente: ningún elemento sostiene por sí solo la unión entre dos partes de la red.';

    const cruce = pct(d.cruzadas, d.conexiones);
    const orden = Object.keys(ESTRUCTURA_NOMBRE).sort((a, b) => d.porEstructura[b].nodos - d.porEstructura[a].nodos);
    const dominante = orden[0], ultima = orden[orden.length - 1];
    const tituloEstr = cruce < 25
      ? "3. Las cuatro estructuras del POT casi no se hablan entre sí"
      : "3. Las cuatro estructuras se cruzan, pero pesan muy distinto";
    const textoEstr = cruce < 25
      ? 'Solo <b>' + cruce + '%</b> de las conexiones (' + d.cruzadas + ' de ' + d.conexiones + ') une elementos de ' +
        'estructuras distintas: lo ecológico con lo funcional, lo funcional con lo patrimonial. El resto ocurre dentro ' +
        'de la misma estructura. El plan reconoce cuatro sistemas, pero los modela casi por separado.'
      : '<b>' + cruce + '%</b> de las conexiones (' + d.cruzadas + ' de ' + d.conexiones + ') une elementos de estructuras ' +
        'distintas, así que los cuatro sistemas sí se tocan. Lo que no está repartido es el peso: la <b>' +
        ESTRUCTURA_NOMBRE[dominante] + '</b> aporta ' + pct(d.porEstructura[dominante].nodos, d.nodos) + '% de los nodos, ' +
        'mientras la <b>' + ESTRUCTURA_NOMBRE[ultima] + '</b> aporta ' + pct(d.porEstructura[ultima].nodos, d.nodos) + '%. ' +
        'La red se lee como un sistema con un centro y tres bordes.';

    const cierrePuentes = d.puentes > 0
      ? 'con ' + plural(d.puentes, "punto de quiebre", "puntos de quiebre") + ' '
      : 'sin ningún punto de quiebre único ';

    return '' +
      '<button class="m2re-concl-cerrar" type="button" aria-label="Cerrar">&times;</button>' +
      '<div class="m2re-concl-kicker">Conclusiones de la red</div>' +
      '<h3>Lo que el POT alcanza a modelar de la ciudad</h3>' +
      '<p class="m2re-concl-nota">Todas las cifras se calculan sobre la red que está viendo ahora mismo' +
        (d.soloPot ? ' (filtro <em>solo lo que el POT nombra</em> activo' : ' (viendo toda la base de datos') +
        (d.apagados ? ', ' + plural(d.apagados, "nodo desactivado", "nodos desactivados") : '') +
        '). Si cambia el filtro o apaga nodos, cambian.</p>' +

      '<div class="m2re-concl-datos">' +
        dato(d.nodos, 'nodos') + dato(d.conexiones, 'conexiones') +
        dato(gradoMedio, 'conexiones por nodo') + dato(d.puentes, 'nodos puente') +
      '</div>' +

      '<div class="m2re-concl-bloque">' +
        '<h4>1. El POT nombra una parte pequeña del territorio que regula</h4>' +
        '<p>De los <b>' + d.totalBase + '</b> elementos cargados en la base, el documento del POT nombra de forma ' +
        'explícita <b>' + d.conservadosPot + '</b> (' + pct(d.conservadosPot, d.totalBase) + '%): humedales, ríos y ' +
        'canales con nombre propio, unos pocos corredores viales y sistemas completos (Manzanas del Cuidado, ' +
        'corredores verdes, red de metro y cables). El resto existe en la ciudad, pero no aparece en el texto que ' +
        'la ordena.' + (d.soloPot ? '' : ' Ahora mismo está viendo la base completa: el botón <em>Solo lo que el POT nombra</em> deja únicamente esos ' + d.conservadosPot + '.') + '</p>' +
      '</div>' +

      '<div class="m2re-concl-bloque">' +
        '<h4>' + tituloHubs + '</h4>' +
        '<p>El <b>5%</b> de los nodos con más conexiones (' + d.cuantosHubs + ' de ' + d.nodos + ') concentra ' +
        '<b>' + concentra + '%</b> de todas las conexiones. ' + fragmento + ' ' + puentesTxt +
        ' Puede comprobarlo con el botón <em>Desactivar hubs</em> de la barra.</p>' +
      '</div>' +

      '<div class="m2re-concl-bloque">' +
        '<h4>' + tituloEstr + '</h4>' +
        '<p>' + textoEstr + '</p>' +
        '<div class="m2re-concl-barras">' + filaEstructura + '</div>' +
      '</div>' +

      '<div class="m2re-concl-bloque">' +
        '<h4>4. Las relaciones no están escritas: hay que deducirlas</h4>' +
        '<p>Ninguna de estas <b>' + d.conexiones + '</b> conexiones está enunciada como tal en el POT. Se construyen ' +
        'desde la base a partir de la cercanía entre elementos, y <b>' + d.indirectas + '</b> son indirectas' +
        (d.derivadas ? ' — <b>' + d.derivadas + '</b> de ellas pasan por elementos que el POT no nombra' : '') +
        '. El plan localiza objetos (polígonos, trazados, equipamientos) y les asigna normas, pero no describe ' +
        'qué depende de qué, ni qué pasa cuando una de esas piezas falla.</p>' +
      '</div>' +

      '<div class="m2re-concl-final">' +
        '<b>En síntesis:</b> el POT se comporta como un inventario localizado, no como un modelo de relaciones. ' +
        'Nombra lugares y les fija reglas, pero la estructura que sostiene la ciudad —quién depende de quién, ' +
        'qué se cae si se cae un nodo— solo aparece cuando se la reconstruye como red. Y reconstruida se ve ' +
        'desbalanceada: ' + concentra + '% de las conexiones pasa por el 5% de los nodos, ' + cierrePuentes +
        'y con las cuatro estructuras pesando de forma muy distinta.' +
      '</div>';
  }

  function abrirConclusiones() {
    const cap = document.getElementById("m2reConclusiones");
    if (!cap) return;
    cap.innerHTML = htmlConclusiones();
    cap.hidden = false;
    cap.querySelector(".m2re-concl-cerrar")?.addEventListener("click", cerrarConclusiones);
    document.getElementById("m2reBtnConclusiones")?.classList.add("active");
  }
  function cerrarConclusiones() {
    const cap = document.getElementById("m2reConclusiones");
    if (cap) { cap.hidden = true; cap.innerHTML = ""; }
    document.getElementById("m2reBtnConclusiones")?.classList.remove("active");
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!RED_EXTERNA_ACTIVA) return;   // se queda la red original de modulo-02.js
    document.body.classList.add("m2re-activa");
    init();
    document.getElementById("m2reBtnSoloPot")?.addEventListener("click", () => {
      soloPot = !soloPot;
      aplicarFiltroPot();
      buildLayer();
      pintarEstadoFiltro();
      cerrarFicha();
      // el panel de conclusiones mide la red en pantalla: si cambia, se rehace
      if (!document.getElementById("m2reConclusiones")?.hidden) abrirConclusiones();
    });
    document.getElementById("m2reBtnConclusiones")?.addEventListener("click", () => {
      if (document.getElementById("m2reConclusiones")?.hidden) abrirConclusiones();
      else cerrarConclusiones();
    });
    document.getElementById("networkViz")?.addEventListener("click", () => {
      hideTooltip(); cerrarFicha();
      document.getElementById("m2-red-externa")?._soltarFoco?.();
    });
  });
})();
