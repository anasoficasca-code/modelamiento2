/* ==========================================================
   RED POT ↔ ODS — diagrama con física de nodos
   - Los nodos parten de una posición fija, pero ahora se pueden
     ARRASTRAR: al mover una bola, las que están conectadas a ella
     la "siguen" (fuerza de resorte a lo largo de cada línea), y
     todo el conjunto tiende a volver a su posición original con
     un resorte suave de anclaje (para que no quede desordenado).
   - Conexiones tomadas 1 a 1 de la tabla de sustento documental.
   - Clic en una línea -> panel con Conexión / Tipo / Sustento / Página.
   - Doble clic en una bola -> la apaga (opacidad) y oculta sus líneas.
   - Triple clic en una bola -> aísla su flujo (solo se ven los nodos
     y líneas con los que se conecta directamente).
   - El punteado de una línea indica si la relación es "no directa"
     (inferida); las relaciones directas se dibujan con línea sólida.
   ========================================================== */

const SVG_NS = "http://www.w3.org/2000/svg";
const XHTML_NS = "http://www.w3.org/1999/xhtml";

/* -------- Nodos: posición fija, nombres oficiales exactos -------- */
const ODS_NODES = [
  { id: "ods5",  num: 5,  name: "IGUALDAD DE GÉNERO",                      icon: "fa-venus-mars",     color: "#FF3A21", x: 183,  y: 64,  r: 40 },
  { id: "ods1",  num: 1,  name: "FIN DE LA POBREZA",                       icon: "fa-people-group",   color: "#E5243B", x: 610,  y: 78,  r: 60 },
  { id: "ods12", num: 12, name: "PRODUCCIÓN Y CONSUMO RESPONSABLES",       icon: "fa-recycle",        color: "#BF8B2E", x: 886,  y: 76,  r: 40 },
  { id: "ods2",  num: 2,  name: "HAMBRE CERO",                             icon: "fa-bowl-food",      color: "#DDA63A", x: 313,  y: 215, r: 60 },
  { id: "ods8",  num: 8,  name: "TRABAJO DECENTE Y CRECIMIENTO ECONÓMICO", icon: "fa-chart-line",     color: "#A21942", x: 562,  y: 242, r: 40 },
  { id: "ods3",  num: 3,  name: "SALUD Y BIENESTAR",                       icon: "fa-heart-pulse",    color: "#4C9F38", x: 836,  y: 270, r: 40 },
  { id: "ods10", num: 10, name: "REDUCCIÓN DE LAS DESIGUALDADES",          icon: "fa-scale-balanced", color: "#DD1367", x: 1049, y: 185, r: 40 },
  { id: "ods6",  num: 6,  name: "AGUA LIMPIA Y SANEAMIENTO",               icon: "fa-droplet",        color: "#58D68D", x: 72,   y: 342, r: 40 },
  { id: "ods15", num: 15, name: "VIDA DE ECOSISTEMAS TERRESTRES",          icon: "fa-tree",           color: "#56C02B", x: 284,  y: 424, r: 40 },
  { id: "ods13", num: 13, name: "ACCIÓN POR EL CLIMA",                     icon: "fa-globe",          color: "#3F7E44", x: 706,  y: 406, r: 60 },
  { id: "ods7",  num: 7,  name: "ENERGÍA ASEQUIBLE Y NO CONTAMINANTE",     icon: "fa-bolt",           color: "#FCC30B", x: 930,  y: 434, r: 40 },
  { id: "ods16", num: 16, name: "PAZ, JUSTICIA E INSTITUCIONES SÓLIDAS",   icon: "fa-gavel",          color: "#E89A6C", x: 994,  y: 354, r: 40 },
  { id: "ods4",  num: 4,  name: "EDUCACIÓN DE CALIDAD",                    icon: "fa-book",           color: "#C5192D", x: 183,  y: 654, r: 40 },
  { id: "ods9",  num: 9,  name: "INDUSTRIA, INNOVACIÓN E INFRAESTRUCTURA", icon: "fa-industry",       color: "#FD6925", x: 447,  y: 657, r: 40 },
  { id: "ods11", num: 11, name: "CIUDADES Y COMUNIDADES SOSTENIBLES",      icon: "fa-city",           color: "#FD9D24", x: 639,  y: 692, r: 40 },
  { id: "ods14", num: 14, name: "VIDA SUBMARINA",                         icon: "fa-fish",           color: "#58D68D", x: 789,  y: 689, r: 40 },
  { id: "ods17", num: 17, name: "ALIANZAS PARA LOGRAR LOS OBJETIVOS",      icon: "fa-handshake",      color: "#9AA2AD", x: 1350, y: 470, r: 40 },
];

/* ODS 1, 2 y 13 son intencionalmente un poco más grandes (r 60) que el resto (r 40, todos iguales) */

/* -------- física: cada nodo guarda su posición "casa" (ancla) y velocidad -------- */
ODS_NODES.forEach(n => {
  n.homeX = n.x; n.homeY = n.y;
  n.vx = 0; n.vy = 0;
  n.fixed = false; // true mientras el usuario lo está arrastrando
  /* posición de "casa" original, para poder restaurarla luego de una animación temporal
     (ver animateBridgeNode) sin perder de vista el ancla real del nodo */
  n.baseHomeX = n.homeX; n.baseHomeY = n.homeY;
});

/* -------- HALLAZGOS del análisis de la red --------
   Nodos que funcionan como articuladores/conectores de la red: al hacer TRIPLE CLIC
   sobre ellos (además de aislar su flujo, comportamiento ya existente) se muestra un
   popup con el hallazgo. ODS 9 además "demuestra" el hallazgo moviéndose ODS 3
   temporalmente entre ODS 4 y ODS 9, y luego regresa a su lugar. */
const FINDINGS = {
  ods1: {
    title: "ODS 1 · Nodo articulador de la red",
    text: "Al aislar su flujo, el ODS 1 funciona como uno de los principales nodos articuladores de la red. Insight: si se interviene sobre la pobreza, potencialmente se afectan diferentes dimensiones de la red al mismo tiempo.",
    /* pila de 3 tarjetas (como en la imagen de referencia): la primera es el
       "Hallazgo" con su fuente, y le siguen 2 tarjetas de apoyo con ícono */
    cards: [
      {
        icon: "fa-magnifying-glass",
        title: "Hallazgo",
        text: "Porque la pobreza es un problema que bloquea cualquier posibilidad de desarrollo, dignidad humana, equidad y solución a crisis globales como el hambre y la desigualdad",
        source: "https://www.undp.org/es/sustainable-development-goals/fin-pobreza",
      },
      {
        icon: "fa-heart-pulse",
        text: "La pobreza extrema genera vulnerabilidad ante enfermedades, crisis económicas y desastres naturales",
      },
      {
        icon: "fa-xmark",
        text: "La falta de recursos básicos impide una vida digna, negando el acceso elemental a la alimentación, la vivienda segura, la salud y la educación",
      },
    ],
  },
  ods13: {
    title: "ODS 13 · El cambio climático funciona como un articulador",
    text: "El cambio climático conecta dimensiones que inicialmente parecían separadas. Funciona como una condición transversal: un problema climático puede tener consecuencias sociales, económicas, urbanas y ambientales.",
  },
  ods9: {
    title: "ODS 9 · Conecta grupos diferentes de la red",
    text: "El ODS 9 no solamente está conectado con varios objetivos, sino que conecta grupos diferentes de la red. Para evidenciarlo, ODS 3 se desplaza un momento hacia la izquierda, entre ODS 4 y ODS 9, y luego vuelve a su lugar.",
    bridge: { node: "ods3", between: ["ods4", "ods9"] },
  },
};

/* Relación con hallazgo propio: al hacer CLIC en esa línea (comportamiento normal de
   sustento documental) también se muestra el popup del hallazgo, y además se aísla
   la vista para mostrar SOLO esos dos nodos y la línea entre ellos. */
const EDGE_FINDINGS = {
  "ods1->ods13": {
    title: "ODS 1 ↔ ODS 13 · Relación inesperada",
    text: "El ODS 1 no entiende la pobreza únicamente como un problema económico: también exige reducir la vulnerabilidad de las personas pobres frente a fenómenos relacionados con el clima.",
    nodes: ["ods1", "ods13"],
  },
};

/* Nodos que presentan una CONTRADICCIÓN dentro del análisis: al hacer clic en su
   entrada del panel rojo "Contradicción" se aísla solo ese nodo (sin sus vecinos)
   y se muestra la cita/observación correspondiente. */
const CONTRADICTIONS = {
  ods16: {
    title: "ODS 16 · Contradicción",
    text: "“Sin paz, estabilidad, derechos humanos y gobernabilidad efectiva basada en el Estado de derecho, no es posible alcanzar el desarrollo sostenible.”",
  },
  ods14: {
    title: "ODS 14 · Contradicción",
    text: "“Los océanos del mundo —su temperatura, química, corrientes y vida— mueven sistemas mundiales que hacen que la Tierra sea habitable para la humanidad.”",
  },
  ods11: {
    title: "ODS 11 · Contradicción",
    text: "Si las ciudades concentran actividad económica, desarrollo social, ciencia, cultura y productividad, ¿por qué el ODS 11 no aparece como uno de los principales articuladores de nuestra red?",
  },
};

function edgeKey(edge) { return edge.s + "->" + edge.t; }

/* El punteado depende de si la relación es "no directa" (inferida): las relaciones
   directas se dibujan con línea sólida y las inferidas con línea punteada.
   El color SIEMPRE es el de su tipo (comp verde, causal rosa, cond naranja),
   verificado contra la leyenda de la imagen de referencia.
   (La convención "Funcional" se eliminó: todas esas relaciones pasaron a ser Causales.) */
const TYPE_STYLE = {
  comp:   { color: "#4ade80", width: 2,   label: "Complementaria" },
  causal: { color: "#f76fb0", width: 1.1, label: "Causal" },
  cond:   { color: "#ef9552", width: 1.6, label: "Condicionamiento" },
};

/* -------- Aristas: tabla de sustento documental (Excel) tal cual, + ajustes puntuales indicados -------- */
const RAW_EDGES = [
  { s: "ods6",  t: "ods5",  type: "comp",   directa: true, pagina: 35, sustento: "De aquí a 2030, lograr el acceso a servicios de saneamiento e higiene adecuados y equitativos para todos y poner fin a la defecación al aire libre, prestando especial atención a las necesidades de las mujeres y las niñas y las personas en situaciones de vulnerabilidad." },
  { s: "ods5",  t: "ods1",  type: "comp",   directa: true, pagina: 18, sustento: "Crear marcos normativos sólidos en los planos nacional, regional e internacional, sobre la base de estrategias de desarrollo en favor de los pobres que tengan en cuenta las cuestiones de género, a fin de apoyar la inversión acelerada en medidas para erradicar la pobreza." },
  { s: "ods5",  t: "ods4",  type: "comp",   directa: true, pagina: 32, sustento: "Si se facilita a las mujeres y niñas igualdad en el acceso a la educación, atención médica, un trabajo decente y representación en los procesos de adopción de decisiones políticas y económicas, se impulsarán las economías sostenibles y se beneficiará a las sociedades y a la humanidad en su conjunto." },
  { s: "ods5",  t: "ods8",  type: "causal", directa: true, pagina: 32, sustento: "Si se facilita a las mujeres y niñas igualdad en el acceso a la educación, atención médica, un trabajo decente y representación en los procesos de adopción de decisiones políticas y económicas, se impulsarán las economías sostenibles y se beneficiará a las sociedades y a la humanidad en su conjunto." },
  { s: "ods1",  t: "ods2",  type: "cond",   directa: true, pagina: 16, sustento: "Entre sus manifestaciones se incluyen el hambre y la malnutrición, el acceso limitado a la educación y a otros servicios básicos, la discriminación y la exclusión sociales y la falta de participación en la adopción de decisiones." },
  { s: "ods1",  t: "ods3",  type: "causal",   directa: true, pagina: 18, sustento: "Proporción del gasto público total que se dedica a servicios esenciales (educación, salud y protección social)." },
  { s: "ods1",  t: "ods4",  type: "cond",   directa: true, pagina: 16, sustento: "Entre sus manifestaciones se incluyen el hambre y la malnutrición, el acceso limitado a la educación y a otros servicios básicos..." },
  { s: "ods1",  t: "ods8",  type: "causal", directa: true, pagina: 16, sustento: "El crecimiento económico debe ser inclusivo con el fin de crear empleos sostenibles y promover la igualdad." },
  { s: "ods1",  t: "ods13", type: "cond",   directa: true, pagina: 18, sustento: "De aquí a 2030, fomentar la resiliencia de los pobres y las personas que se encuentran en situaciones de vulnerabilidad y reducir su exposición y vulnerabilidad a los fenómenos extremos relacionados con el clima..." },
  { s: "ods2",  t: "ods1",  type: "cond",   directa: true, pagina: 20, sustento: "El sector alimentario y el sector agrícola ofrecen soluciones claves para el desarrollo y son vitales para la eliminación del hambre y la pobreza." },
  { s: "ods2",  t: "ods8",  type: "causal", directa: true, pagina: 20, sustento: "Si se hace bien, la agricultura, la silvicultura y las piscifactorías pueden suministrarnos comida nutritiva para todos y generar ingresos decentes..." },
  { s: "ods2",  t: "ods13", type: "cond",   directa: true, pagina: 20, sustento: "El cambio climático está poniendo mayor presión sobre los recursos de los que dependemos y aumentan los riesgos asociados a desastres tales como sequías e inundaciones." },
  { s: "ods2",  t: "ods15", type: "cond",   directa: true, pagina: 20, sustento: "Pero ahora mismo, nuestros suelos, agua, océanos, bosques y nuestra biodiversidad están siendo rápidamente degradados." },
  { s: "ods6",  t: "ods2",  type: "causal", directa: true, pagina: 35, sustento: "La escasez de recursos hídricos, la mala calidad del agua y el saneamiento inadecuado influyen negativamente en la seguridad alimentaria..." },
  { s: "ods6",  t: "ods4",  type: "causal", directa: true, pagina: 35, sustento: "La escasez de recursos hídricos, la mala calidad del agua y el saneamiento inadecuado influyen negativamente en [...] las oportunidades de educación para las familias pobres..." },
  { s: "ods8",  t: "ods1",  type: "causal", directa: true, pagina: 16, sustento: "El crecimiento económico debe ser inclusivo con el fin de crear empleos sostenibles y promover la igualdad." },
  { s: "ods8",  t: "ods12", type: "causal", directa: true, pagina: 41, sustento: "Mejorar progresivamente, de aquí a 2030, la producción y el consumo eficientes de los recursos mundiales y procurar desvincular el crecimiento económico de la degradación del medio ambiente..." },
  { s: "ods9",  t: "ods3",  type: "causal", directa: true, pagina: 44, sustento: "Desde hace tiempo se reconoce que, para conseguir un incremento de la productividad y de los ingresos y mejoras en los resultados sanitarios y educativos, se necesitan inversiones en infraestructura." },
  { s: "ods9",  t: "ods4",  type: "causal", directa: true, pagina: 44, sustento: "Desde hace tiempo se reconoce que, para conseguir un incremento de la productividad y de los ingresos y mejoras en los resultados sanitarios y educativos, se necesitan inversiones en infraestructura." },
  { s: "ods9",  t: "ods11", type: "causal",   directa: true, pagina: 44, sustento: "El ritmo de crecimiento y urbanización también está generando la necesidad de contar con nuevas inversiones en infraestructuras sostenibles que permitirán a las ciudades ser más resistentes al cambio climático..." },
  { s: "ods9",  t: "ods13", type: "causal",   directa: true, pagina: 44, sustento: "...nuevas inversiones en infraestructuras sostenibles que permitirán a las ciudades ser más resistentes al cambio climático...", curve: -12 },
  { s: "ods11", t: "ods7",  type: "causal",   directa: true, pagina: 52, sustento: "El futuro que queremos incluye a ciudades de oportunidades, con acceso a servicios básicos, energía, vivienda, transporte y más facilidades para todos." },
  { s: "ods11", t: "ods13", type: "comp",   directa: true, pagina: 53, sustento: "De aquí a 2020, aumentar considerablemente el número de ciudades y asentamientos humanos que adoptan e implementan políticas y planes integrados para promover la inclusión, el uso eficiente de los recursos, la mitigación del cambio climático y la adaptación a él y la resiliencia ante los desastres..." },
  { s: "ods12", t: "ods3",  type: "causal", directa: true, pagina: 56, sustento: "...reducir significativamente su liberación a la atmósfera, el agua y el suelo a fin de minimizar sus efectos adversos en la salud humana y el medio ambiente." },
  { s: "ods13", t: "ods1",  type: "cond",   directa: true, pagina: 18, sustento: "De aquí a 2030, fomentar la resiliencia de los pobres y las personas que se encuentran en situaciones de vulnerabilidad y reducir su exposición y vulnerabilidad a los fenómenos extremos relacionados con el clima..." },
  { s: "ods13", t: "ods2",  type: "cond",   directa: true, pagina: 20, sustento: "El cambio climático está poniendo mayor presión sobre los recursos de los que dependemos y aumentan los riesgos asociados a desastres tales como sequías e inundaciones." },
  { s: "ods13", t: "ods14", type: "comp",   directa: true, pagina: 63, sustento: "Nuestras precipitaciones, el agua potable, el clima, el tiempo, las costas, gran parte de nuestros alimentos e incluso el oxígeno del aire que respiramos provienen, en última instancia del mar y son regulados por este." },
  /* 14 → 2: corregida según lo indicado — es causal (morada) y punteada, no complementaria/verde */
  { s: "ods14", t: "ods2",  type: "causal", directa: false, pagina: 63, sustento: "Nuestras precipitaciones, el agua potable, el clima, el tiempo, las costas, gran parte de nuestros alimentos e incluso el oxígeno del aire que respiramos provienen, en última instancia del mar y son regulados por este." },
  { s: "ods15", t: "ods1",  type: "comp",   directa: true, pagina: 70, sustento: "De aquí a 2020, integrar los valores de los ecosistemas y la biodiversidad en la planificación, los procesos de desarrollo, las estrategias de reducción de la pobreza..." },
  { s: "ods15", t: "ods11", type: "comp",   directa: false, pagina: 52, sustento: "Redoblar los esfuerzos para proteger y salvaguardar el patrimonio cultural y natural del mundo." },
  { s: "ods16", t: "ods10", type: "comp",   directa: false, pagina: 71, sustento: "Promover sociedades pacíficas e inclusivas para el desarrollo sostenible, facilitar el acceso a la justicia para todos y construir a todos los niveles instituciones eficaces e inclusivas que rindan cuentas." },
  { s: "ods17", t: "ods9",  type: "causal",   directa: true, pagina: 76, sustento: "Entre estos sectores figuran la energía sostenible, la infraestructura y el transporte, así como las tecnologías de la información y las comunicaciones." },
  /* 7 → 9: agregada según lo indicado (funcional / azul) */
  { s: "ods7",  t: "ods9",  type: "causal",   directa: true, pagina: null, sustento: "Conexión ODS 7 – ODS 9 (funcional), añadida según lo indicado. Pendiente de completar con la cita y página exactas del documento de sustento." },
  /* 1 → 10: agregada según lo indicado */
  { s: "ods1",  t: "ods10", type: "comp",   directa: true, pagina: null, sustento: "Conexión ODS 1 – ODS 10 (complementaria), añadida según lo indicado. Pendiente de completar con la cita y página exactas del documento de sustento." },
];

/* "17 → todos": el ODS 17 se conecta con el resto (excepto ODS 9, ya listado arriba) */
const TODOS_SUSTENTO = "...a fin de apoyar el logro de los Objetivos de Desarrollo Sostenible en todos los países, particularmente los países en desarrollo.";
const TODOS_PAGINA = 79;
ODS_NODES.forEach(n => {
  if (n.id === "ods17" || n.id === "ods9") return;
  RAW_EDGES.push({ s: "ods17", t: n.id, type: "causal", directa: true, pagina: TODOS_PAGINA, sustento: TODOS_SUSTENTO, esTodos: true });
});

function nodeById(id) { return ODS_NODES.find(n => n.id === id); }

/* -------- física: longitud de reposo de cada resorte (arista) -------- */
RAW_EDGES.forEach(edge => {
  const s = nodeById(edge.s), t = nodeById(edge.t);
  if (!s || !t) return;
  edge.restLength = Math.hypot(t.x - s.x, t.y - s.y);
});

/* -------- defs: glow por color de nodo + flechas por tipo -------- */
function buildDefs(svg) {
  const defs = document.createElementNS(SVG_NS, "defs");

  const uniqueColors = [...new Set(ODS_NODES.map(n => n.color))];
  uniqueColors.forEach(color => {
    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", "glow-" + color.replace("#", ""));
    filter.setAttribute("x", "-60%"); filter.setAttribute("y", "-60%");
    filter.setAttribute("width", "220%"); filter.setAttribute("height", "220%");
    const blur = document.createElementNS(SVG_NS, "feGaussianBlur");
    blur.setAttribute("stdDeviation", "3.2"); blur.setAttribute("result", "blur");
    const merge = document.createElementNS(SVG_NS, "feMerge");
    ["blur", "blur", "SourceGraphic"].forEach(ref => {
      const m = document.createElementNS(SVG_NS, "feMergeNode");
      m.setAttribute("in", ref);
      merge.appendChild(m);
    });
    filter.appendChild(blur); filter.appendChild(merge);
    defs.appendChild(filter);
  });

  Object.entries(TYPE_STYLE).forEach(([type, style]) => {
    const marker = document.createElementNS(SVG_NS, "marker");
    marker.setAttribute("id", "arrow-" + type);
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "8"); marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "7"); marker.setAttribute("markerHeight", "7");
    marker.setAttribute("orient", "auto-start-reverse");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", "M0,0 L10,5 L0,10 z");
    path.setAttribute("fill", style.color);
    marker.appendChild(path);
    defs.appendChild(marker);
  });

  svg.appendChild(defs);
}

/* -------- aristas: grupo con línea visual + línea invisible más ancha para clic -------- */
function edgePathData(edge, s, t) {
  const dx = t.x - s.x, dy = t.y - s.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / dist, uy = dy / dist;
  const startPad = s.r + 2;
  const endPad = t.r + 8;
  const x1 = s.x + ux * startPad, y1 = s.y + uy * startPad;
  const x2 = t.x - ux * endPad,   y2 = t.y - uy * endPad;

  if (edge.curve) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const px = -uy, py = ux; // perpendicular unitario
    const cx = mx + px * edge.curve, cy = my + py * edge.curve;
    return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
  }
  return `M${x1},${y1} L${x2},${y2}`;
}

function drawEdges(svg) {
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("class", "edges-layer");

  RAW_EDGES.forEach((edge, i) => {
    const s = nodeById(edge.s);
    const t = nodeById(edge.t);
    if (!s || !t) return;
    const style = TYPE_STYLE[edge.type];
    const d = edgePathData(edge, s, t);

    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("class", "edge-group" + (EDGE_FINDINGS[edgeKey(edge)] ? " has-finding" : ""));
    group.setAttribute("data-index", i);
    group.setAttribute("data-type", edge.type);
    group.setAttribute("data-source", edge.s);
    group.setAttribute("data-target", edge.t);
    group.style.setProperty("--edge-color", style.color);

    const hit = document.createElementNS(SVG_NS, "path");
    hit.setAttribute("d", d);
    hit.setAttribute("class", "ods-edge edge-hit");

    const visual = document.createElementNS(SVG_NS, "path");
    visual.setAttribute("d", d);
    visual.setAttribute("class", "ods-edge edge-visual");
    visual.setAttribute("stroke", style.color);
    visual.setAttribute("stroke-width", edge.esTodos ? style.width * 0.7 : style.width);
    if (!edge.directa) visual.setAttribute("stroke-dasharray", "6,5");
    visual.setAttribute("marker-end", `url(#arrow-${edge.type})`);
    visual.setAttribute("opacity", edge.esTodos ? "0.35" : "0.85");

    group.appendChild(visual);
    group.appendChild(hit);
    group.addEventListener("click", () => {
      showEdgeInfo(i);
      const finding = EDGE_FINDINGS[edgeKey(edge)];
      if (finding) activateEdgeFinding(edgeKey(edge));
    });
    g.appendChild(group);

    /* referencias para poder recalcular el trazo en cada frame de física */
    edge._el = { visual, hit };
  });

  svg.appendChild(g);
}

/* -------- nodos -------- */
function drawNodes(svg) {
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("class", "nodes-layer");

  ODS_NODES.forEach((node, index) => {
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("class", "ods-node floating-node" + (FINDINGS[node.id] ? " has-finding" : ""));
    group.style.setProperty("--float-delay", `${((index * 0.17) % 2.4).toFixed(2)}s`);
    group.setAttribute("data-id", node.id);

    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("class", "node-ring");
    circle.setAttribute("cx", node.x); circle.setAttribute("cy", node.y); circle.setAttribute("r", node.r);
    circle.setAttribute("stroke", node.color);
    circle.setAttribute("stroke-width", 2.5);
    circle.setAttribute("filter", "url(#glow-" + node.color.replace("#", "") + ")");

    const fo = document.createElementNS(SVG_NS, "foreignObject");
    const size = node.r * 1.9;
    fo.setAttribute("x", node.x - size / 2); fo.setAttribute("y", node.y - size / 2);
    fo.setAttribute("width", size); fo.setAttribute("height", size);

    const wrapper = document.createElementNS(XHTML_NS, "div");
    wrapper.setAttribute("class", "node-inner");
    wrapper.setAttribute("style",
      "width:100%;height:100%;display:flex;flex-direction:column;" +
      "align-items:center;justify-content:center;gap:1px;pointer-events:none;"
    );

    const numEl = document.createElementNS(XHTML_NS, "div");
    numEl.setAttribute("class", "node-num");
    numEl.setAttribute("style", `color:${node.color}; font-size:${Math.max(node.r * 0.24, 9)}px;`);
    numEl.textContent = node.num;

    const iconEl = document.createElementNS(XHTML_NS, "i");
    iconEl.setAttribute("class", "fa-solid " + node.icon + " node-icon");
    iconEl.setAttribute("style", `color:${node.color}; font-size:${node.r * 0.44}px; margin:1px 0;`);

    const nameEl = document.createElementNS(XHTML_NS, "div");
    nameEl.setAttribute("class", "node-name");
    nameEl.setAttribute("style", `font-size:${Math.max(node.r * 0.145, 6)}px; padding:0 3px;`);
    nameEl.textContent = node.name;

    wrapper.appendChild(numEl); wrapper.appendChild(iconEl); wrapper.appendChild(nameEl);
    fo.appendChild(wrapper);

    group.appendChild(circle);
    group.appendChild(fo);
    attachNodeClickHandler(group, node.id);
    attachNodeDragHandler(group, node);
    g.appendChild(group);

    /* referencias para poder mover el nodo en cada frame de física */
    node._el = { group, circle, fo };
  });

  svg.appendChild(g);
}

/* -------- física: mover nodos y recalcular líneas cada frame -------- */
const PHYSICS = {
  spring: 0.045,   // qué tanto "sigue" un nodo a los que están conectados a él
  anchor: 0.02,    // qué tanto tira cada nodo de vuelta a su posición original
  damping: 0.82,   // fricción (evita que oscile para siempre)
  minVel: 0.02,
};

function updatePositions() {
  ODS_NODES.forEach(n => {
    if (!n._el) return;
    n._el.circle.setAttribute("cx", n.x);
    n._el.circle.setAttribute("cy", n.y);
    const size = n.r * 1.9;
    n._el.fo.setAttribute("x", n.x - size / 2);
    n._el.fo.setAttribute("y", n.y - size / 2);
  });
  RAW_EDGES.forEach(edge => {
    if (!edge._el) return;
    const s = nodeById(edge.s), t = nodeById(edge.t);
    if (!s || !t) return;
    const d = edgePathData(edge, s, t);
    edge._el.visual.setAttribute("d", d);
    edge._el.hit.setAttribute("d", d);
  });
}

let physicsRunning = false;
function physicsStep() {
  let moving = false;

  RAW_EDGES.forEach(edge => {
    const s = nodeById(edge.s), t = nodeById(edge.t);
    if (!s || !t) return;
    const dx = t.x - s.x, dy = t.y - s.y;
    const dist = Math.hypot(dx, dy) || 1;
    const diff = (dist - edge.restLength) * PHYSICS.spring;
    const fx = (dx / dist) * diff, fy = (dy / dist) * diff;
    if (!s.fixed) { s.vx += fx; s.vy += fy; }
    if (!t.fixed) { t.vx -= fx; t.vy -= fy; }
  });

  ODS_NODES.forEach(n => {
    if (n.fixed) { n.vx = 0; n.vy = 0; return; }
    n.vx += (n.homeX - n.x) * PHYSICS.anchor;
    n.vy += (n.homeY - n.y) * PHYSICS.anchor;
    n.vx *= PHYSICS.damping;
    n.vy *= PHYSICS.damping;
    n.x += n.vx;
    n.y += n.vy;
    if (Math.abs(n.vx) > PHYSICS.minVel || Math.abs(n.vy) > PHYSICS.minVel) moving = true;
  });

  updatePositions();

  if (moving || ODS_NODES.some(n => n.fixed)) {
    requestAnimationFrame(physicsStep);
  } else {
    physicsRunning = false;
  }
}

function wakePhysics() {
  if (!physicsRunning) {
    physicsRunning = true;
    requestAnimationFrame(physicsStep);
  }
}

/* -------- arrastrar una bola: los nodos conectados la "siguen" -------- */
function attachNodeDragHandler(group, node) {
  const svg = document.getElementById("networkViz");
  let dragging = false;
  let moved = false;
  let startClientX = 0, startClientY = 0;

  function toSvgPoint(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const m = svg.getScreenCTM().inverse();
    return pt.matrixTransform(m);
  }

  group.addEventListener("pointerdown", (e) => {
    dragging = true;
    moved = false;
    startClientX = e.clientX; startClientY = e.clientY;
    node.fixed = true;
    group.classList.add("dragging");
    group.setPointerCapture(e.pointerId);
    wakePhysics();
  });

  group.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    if (Math.hypot(e.clientX - startClientX, e.clientY - startClientY) > 4) moved = true;
    const p = toSvgPoint(e.clientX, e.clientY);
    node.x = p.x; node.y = p.y;
    node.vx = 0; node.vy = 0;
    updatePositions();
    wakePhysics();
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    node.fixed = false;
    group.classList.remove("dragging");
    try { group.releasePointerCapture(e.pointerId); } catch (err) {}
    wakePhysics();
    if (moved) {
      /* evita que el "click" que sigue al arrastre dispare doble/triple clic */
      group.dataset.suppressClick = "1";
      setTimeout(() => { delete group.dataset.suppressClick; }, 0);
    }
  }

  group.addEventListener("pointerup", endDrag);
  group.addEventListener("pointercancel", endDrag);
}

function renderNetwork() {
  const svg = document.getElementById("networkViz");
  if (!svg) return;
  svg.innerHTML = "";
  buildDefs(svg);
  drawEdges(svg);
  drawNodes(svg);
}

/* -------- zoom interno de la primera red superior -------- */
let networkZoomScale = 1;
const NETWORK_ZOOM_MIN = 0.75;
const NETWORK_ZOOM_MAX = 2.25;
/* El encuadre se ajusta a lo que de verdad ocupa la red: el lienzo fijo de
   1470x780 dejaba franjas vacías arriba, abajo y a la derecha, y con eso la
   red se veía más pequeña de lo que el espacio permitía. */
let NETWORK_VIEWBOX_WIDTH = 1470;
let NETWORK_VIEWBOX_HEIGHT = 780;
let NETWORK_VIEWBOX_CENTER_X = NETWORK_VIEWBOX_WIDTH / 2;
let NETWORK_VIEWBOX_CENTER_Y = NETWORK_VIEWBOX_HEIGHT / 2;

function ajustarEncuadreRed() {
  const svg = document.getElementById("networkViz");
  const capa = svg?.querySelector(".nodes-layer");
  if (!svg || !capa) return;
  let caja;
  try { caja = capa.getBBox(); } catch (e) { return; }
  if (!caja || !caja.width || !caja.height) return;
  const MARGEN = 46;
  const w = caja.width + MARGEN * 2, h = caja.height + MARGEN * 2;
  // El alto del lienzo se ajusta a la forma real de la red: así la red usa
  // todo el ancho disponible (que es lo que manda su tamaño en pantalla) y
  // no queda una franja negra arriba y abajo.
  const ancho = svg.clientWidth;
  if (ancho) svg.style.height = Math.round(Math.max(430, Math.min(760, ancho * h / w))) + "px";
  NETWORK_VIEWBOX_WIDTH = w;
  NETWORK_VIEWBOX_HEIGHT = h;
  NETWORK_VIEWBOX_CENTER_X = caja.x + caja.width / 2;
  NETWORK_VIEWBOX_CENTER_Y = caja.y + caja.height / 2;
  updateNetworkZoom();
}

function updateNetworkZoom() {
  const svg = document.getElementById("networkViz");
  if (!svg) return;
  const width = NETWORK_VIEWBOX_WIDTH / networkZoomScale;
  const height = NETWORK_VIEWBOX_HEIGHT / networkZoomScale;
  svg.setAttribute("viewBox", `${NETWORK_VIEWBOX_CENTER_X - width / 2} ${NETWORK_VIEWBOX_CENTER_Y - height / 2} ${width} ${height}`);
  const level = document.getElementById("networkZoomLevel");
  if (level) level.textContent = `${Math.round(networkZoomScale * 100)}%`;
}

function changeNetworkZoom(delta) {
  networkZoomScale = Math.min(NETWORK_ZOOM_MAX, Math.max(NETWORK_ZOOM_MIN, +(networkZoomScale + delta).toFixed(2)));
  updateNetworkZoom();
}

function setupNetworkZoom() {
  document.getElementById("networkZoomIn")?.addEventListener("click", () => changeNetworkZoom(0.25));
  document.getElementById("networkZoomOut")?.addEventListener("click", () => changeNetworkZoom(-0.25));

  const svg = document.getElementById("networkViz");
  svg?.addEventListener("wheel", (event) => {
    /* La rueda se captura únicamente dentro de la red superior. */
    event.preventDefault();
    changeNetworkZoom(event.deltaY < 0 ? 0.10 : -0.10);
  }, { passive: false });
}

/* -------- panel de sustento documental (clic en línea) -------- */
function showEdgeInfo(index) {
  const edge = RAW_EDGES[index];
  const s = nodeById(edge.s), t = nodeById(edge.t);
  const style = TYPE_STYLE[edge.type];

  document.querySelectorAll(".edge-group").forEach(el => el.classList.remove("edge-selected"));
  document.querySelector(`.edge-group[data-index="${index}"]`)?.classList.add("edge-selected");

  document.getElementById("edgeInfoTitle").textContent =
    `ODS ${s.num} → ODS ${t.num}  ·  ${s.name} → ${t.name}`;

  const typeEl = document.getElementById("edgeInfoType");
  typeEl.textContent = style.label + (edge.directa ? " · Directa" : " · Inferida");
  typeEl.style.color = style.color;
  typeEl.style.background = style.color + "26";

  document.getElementById("edgeInfoQuote").textContent = `"${edge.sustento}"`;
  document.getElementById("edgeInfoPage").textContent =
    edge.pagina != null ? `Página: ${edge.pagina}` : "Página: por confirmar";

  document.getElementById("edgeInfoPanel").classList.add("visible");
}

function hideEdgeInfo() {
  document.getElementById("edgeInfoPanel").classList.remove("visible");
  document.querySelectorAll(".edge-group").forEach(el => el.classList.remove("edge-selected"));
}

/* -------- estado de visibilidad: por tipo (leyenda) + por nodo (doble clic) -------- */
const typeOff = new Set();
const nodeOff = new Set();

function refreshEdgeVisibility() {
  document.querySelectorAll(".edge-group").forEach(group => {
    const type = group.dataset.type;
    const s = group.dataset.source;
    const t = group.dataset.target;
    const hidden = typeOff.has(type) || nodeOff.has(s) || nodeOff.has(t);
    group.classList.toggle("hidden-edge", hidden);
  });
}

function toggleNode(id) {
  const group = document.querySelector(`.ods-node[data-id="${id}"]`);
  if (!group) return;
  if (nodeOff.has(id)) {
    nodeOff.delete(id);
    group.classList.remove("node-off");
  } else {
    nodeOff.add(id);
    group.classList.add("node-off");
  }
  refreshEdgeVisibility();
}

/* -------- clic simple / doble / triple sobre una bola --------
   1 clic  -> no hace nada especial
   2 clics -> apaga/enciende el nodo (comportamiento existente)
   3 clics -> aísla el flujo: solo se ven los nodos y líneas que
              se tocan directamente con el nodo elegido
   Se cuentan los clics manualmente (en vez de usar "dblclick")
   para poder distinguir el triple clic de forma confiable. */
function attachNodeClickHandler(group, id) {
  let count = 0;
  let timer = null;
  group.addEventListener("click", () => {
    if (group.dataset.suppressClick) return;
    count++;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (count === 2) {
        toggleNode(id);
      } else if (count >= 3) {
        toggleNodeFlow(id);
      }
      count = 0;
    }, 320);
  });
}

/* -------- spotlight: aísla nodos/líneas (triple clic en una bola O clic en una tarjeta de arriba) --------
   spotlight = null                                   -> todo visible, normal
   spotlight = { mode:"nodes", nodes:Set, expand }     -> solo esos nodos (y si expand=true, también
                                                          sus vecinos directos) quedan visibles
   spotlight = { mode:"types", types:[...] }           -> solo se ven las líneas de esos tipos */
let spotlight = null;

function clearSpotlight() {
  spotlight = null;
  document.querySelectorAll(".insight-card").forEach(c => c.classList.remove("active"));
  applySpotlightState();
  hideFindingPopup();
  clearActivePanelButtons();
  activeContradiction = null;
  activeEdgeFinding = null;
}

function setSpotlightNodes(nodeIds, expand) {
  spotlight = { mode: "nodes", nodes: new Set(nodeIds), expand: !!expand };
  document.querySelectorAll(".insight-card").forEach(c => c.classList.remove("active"));
  applySpotlightState();
}

function setSpotlightTypes(types) {
  spotlight = { mode: "types", types };
  document.querySelectorAll(".insight-card").forEach(c => c.classList.remove("active"));
  applySpotlightState();
}

function applySpotlightState() {
  let visibleNodes = null; // null = todos visibles
  let visibleEdges = null;

  if (spotlight && spotlight.mode === "nodes") {
    visibleNodes = new Set(spotlight.nodes);
    visibleEdges = new Set();
    RAW_EDGES.forEach((edge, i) => {
      const sIn = spotlight.nodes.has(edge.s);
      const tIn = spotlight.nodes.has(edge.t);
      if (spotlight.expand) {
        /* triple clic: además de la bola elegida, se muestran sus vecinos directos */
        if (sIn || tIn) {
          visibleEdges.add(i);
          visibleNodes.add(edge.s);
          visibleNodes.add(edge.t);
        }
      } else {
        /* tarjeta de insight: solo se muestran los ODS exactos de la lista */
        if (sIn && tIn) visibleEdges.add(i);
      }
    });
  } else if (spotlight && spotlight.mode === "types") {
    visibleEdges = new Set();
    RAW_EDGES.forEach((edge, i) => {
      if (spotlight.types.includes(edge.type)) visibleEdges.add(i);
    });
  }

  document.querySelectorAll(".ods-node").forEach(el => {
    const id = el.dataset.id;
    const dim = visibleNodes ? !visibleNodes.has(id) : false;
    el.classList.toggle("node-focus-dim", dim);
    el.classList.toggle("node-focus-active", !!(spotlight && spotlight.mode === "nodes" && spotlight.nodes.has(id)));
  });

  document.querySelectorAll(".edge-group").forEach(el => {
    const idx = Number(el.dataset.index);
    const dim = visibleEdges ? !visibleEdges.has(idx) : false;
    el.classList.toggle("edge-focus-dim", dim);
  });
}

function toggleNodeFlow(id) {
  const already = spotlight && spotlight.mode === "nodes" && spotlight.expand &&
                   spotlight.nodes.size === 1 && spotlight.nodes.has(id);
  if (already) {
    clearSpotlight();
  } else {
    setSpotlightNodes([id], true);
    const finding = FINDINGS[id];
    if (finding) {
      showFindingPopup(finding);
      setActivePanelButton("finding", id);
      if (finding.bridge) {
        animateBridgeNode(finding.bridge.node, finding.bridge.between);
      }
    }
  }
}

/* -------- contradicciones: aísla SOLO ese nodo (sin vecinos) y muestra su cita -------- */
let activeContradiction = null;
function toggleContradiction(id) {
  const already = activeContradiction === id;
  if (already) {
    clearSpotlight();
    return;
  }
  setSpotlightNodes([id], false);
  activeContradiction = id;
  setActivePanelButton("contradiction", id);
  const data = CONTRADICTIONS[id];
  if (data) showFindingPopup(data, "contradiction");
}

/* -------- relación con hallazgo propio (ODS 1 ↔ ODS 13): aísla SOLO esos dos nodos
   y la línea entre ellos -------- */
let activeEdgeFinding = null;
function activateEdgeFinding(key) {
  const finding = EDGE_FINDINGS[key];
  if (!finding) return;
  const already = activeEdgeFinding === key;
  if (already) {
    clearSpotlight();
    return;
  }
  const [s, t] = key.split("->");
  const idx = RAW_EDGES.findIndex(e => e.s === s && e.t === t);
  if (idx >= 0) showEdgeInfo(idx);
  setSpotlightNodes(finding.nodes, false);
  activeEdgeFinding = key;
  setActivePanelButton("finding", "edge:" + key);
  showFindingPopup(finding);
}

/* -------- estado activo de los chips de la barra "Hallazgos" / "Contradicción" -------- */
function clearActivePanelButtons() {
  document.querySelectorAll(".fc-chip").forEach(b => b.classList.remove("active"));
}

function setActivePanelButton(kind, key) {
  clearActivePanelButtons();
  const selector = kind === "finding"
    ? `.fc-chip[data-finding="${key}"]`
    : `.fc-chip[data-contradiction="${key}"]`;
  document.querySelector(selector)?.classList.add("active");
}

/* -------- conecta los chips de la barra "Hallazgos" y "Contradicción" -------- */
function setupSidePanels() {
  document.querySelectorAll(".fc-chip[data-finding]").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.finding;
      if (key.startsWith("edge:")) {
        activateEdgeFinding(key.slice(5));
      } else {
        toggleNodeFlow(key);
      }
    });
  });

  document.querySelectorAll(".fc-chip[data-contradiction]").forEach(btn => {
    btn.addEventListener("click", () => toggleContradiction(btn.dataset.contradiction));
  });
}

/* -------- popup de hallazgo / contradicción (sobre el lienzo de la red) --------
   Permanece visible hasta que el usuario lo cierra manualmente o se limpia
   el spotlight (clic en otra tarjeta/chip, o de nuevo en el mismo).
   Si el hallazgo trae "cards" (p. ej. ODS 1), se muestra la pila de tarjetas
   en vez del popup sencillo. */
function showFindingPopup(finding, variant) {
  if (finding.cards) {
    showFindingStack(finding.cards);
    return;
  }
  hideFindingStack();

  const popup = document.getElementById("findingPopup");
  if (!popup) return;
  const isContradiction = variant === "contradiction";
  popup.classList.toggle("contradiction", isContradiction);
  document.getElementById("findingPopupBadge").innerHTML = isContradiction
    ? '<i class="fa-solid fa-triangle-exclamation"></i> Contradicción'
    : '<i class="fa-solid fa-magnifying-glass-chart"></i> Hallazgo';
  document.getElementById("findingPopupTitle").textContent = finding.title;
  document.getElementById("findingPopupText").textContent = finding.text;
  popup.classList.add("visible");
}

function showFindingStack(cards) {
  document.getElementById("findingPopup")?.classList.remove("visible");
  const stack = document.getElementById("findingStack");
  if (!stack) return;
  stack.innerHTML = "";
  cards.forEach(card => {
    const el = document.createElement("div");
    el.className = "finding-card";
    el.innerHTML = `
      <button class="finding-card-close" type="button" aria-label="Cerrar">&times;</button>
      <div class="finding-card-icon"><i class="fa-solid ${card.icon}"></i></div>
      ${card.title ? `<div class="finding-card-title">${card.title}</div>` : ""}
      <div class="finding-card-text">${card.text}</div>
      ${card.source ? `<span class="finding-card-source">${card.source}</span>` : ""}
    `;
    el.querySelector(".finding-card-close").addEventListener("click", () => clearSpotlight());
    stack.appendChild(el);
  });
  stack.classList.add("visible");
}

function hideFindingStack() {
  const stack = document.getElementById("findingStack");
  if (stack) { stack.classList.remove("visible"); stack.innerHTML = ""; }
}

function hideFindingPopup() {
  document.getElementById("findingPopup")?.classList.remove("visible");
  hideFindingStack();
}

/* -------- animación "puente": mueve temporalmente un nodo hacia una posición
   intermedia entre otros dos (para evidenciar visualmente que conecta dos grupos)
   y luego lo regresa a su lugar original. Reutiliza la física de anclaje ya
   existente: basta con mover el ancla (home) y dejar que el resorte lo lleve. -------- */
let bridgeTimer = null;
function animateBridgeNode(nodeId, betweenIds, holdMs = 1600) {
  const node = nodeById(nodeId);
  const a = nodeById(betweenIds[0]);
  const b = nodeById(betweenIds[1]);
  if (!node || !a || !b) return;
  if (bridgeTimer) { clearTimeout(bridgeTimer); bridgeTimer = null; }

  const midX = (a.baseHomeX + b.baseHomeX) / 2;
  const midY = (a.baseHomeY + b.baseHomeY) / 2 - 90; /* desplazado para no solaparse */

  node.homeX = midX;
  node.homeY = midY;
  wakePhysics();

  bridgeTimer = setTimeout(() => {
    node.homeX = node.baseHomeX;
    node.homeY = node.baseHomeY;
    wakePhysics();
    bridgeTimer = null;
  }, holdMs);
}

/* -------- tarjetas de insights (arriba de la red) -------- */
const NODE_INSIGHTS = {
  conectados:   [1, 2, 4, 5, 8, 9, 13],
  hubs:         [1, 2, 13],
  puentes:      [9, 8],
  perifericos:  [16, 7, 10],
};

function toggleInsight(key) {
  const card = document.querySelector(`.insight-card[data-insight="${key}"]`);
  if (!card) return;

  if (card.classList.contains("active")) {
    clearSpotlight();
    return;
  }

  if (key === "predominantes") {
    setSpotlightTypes(["causal"]);
  } else {
    const ids = (NODE_INSIGHTS[key] || []).map(n => "ods" + n);
    setSpotlightNodes(ids, false);
  }

  card.classList.add("active");
}

/* -------- panel de convenciones -------- */
function setupLegendToggle() {
  document.querySelectorAll(".legend-item input").forEach(input => {
    input.addEventListener("change", (e) => {
      const item = e.target.closest(".legend-item");
      const type = item.dataset.type;
      if (e.target.checked) typeOff.delete(type); else typeOff.add(type);
      item.classList.toggle("off", !e.target.checked);
      refreshEdgeVisibility();
    });
  });

  document.getElementById("edgeInfoClose")?.addEventListener("click", hideEdgeInfo);
  document.getElementById("findingPopupClose")?.addEventListener("click", hideFindingPopup);
}

/* -------- controles Todos / Alineados / Conflictos -------- */
function filterNetwork(mode) {
  document.querySelectorAll(".network-controls .control-btn").forEach(btn => btn.classList.remove("active"));
  event.currentTarget.classList.add("active");

  const groups = {
    all: ["comp", "causal", "cond"],
    aligned: ["comp"],
    conflicts: ["causal", "cond"],
  };
  const activeTypes = groups[mode] || groups.all;

  document.querySelectorAll(".legend-item[data-type]").forEach(item => {
    const type = item.dataset.type;
    const input = item.querySelector("input");
    const show = activeTypes.includes(type);
    input.checked = show;
    item.classList.toggle("off", !show);
    if (show) typeOff.delete(type); else typeOff.add(type);
  });
  refreshEdgeVisibility();
}

/* ==========================================================
   RED DE ESTRUCTURAS DEL POT (estática) — segunda red
   - Tomada 1 a 1 de la tabla 'Red_relaciones_POT_CORREGIDA_FRASES_EXACTAS.xlsx'.
   - Nodos fijos: SIN arrastre, SIN zoom/paneo (se ve completa siempre).
   - Clic en cualquier línea -> panel 'Sustento' (frase + página + artículo).
   - Panel derecho '1. Relaciones que favorecen los ODS': al hacer clic en
     cada relación se resaltan sus líneas en la red y aparecen las insignias
     ODS correspondientes conectadas con una línea punteada.
   ========================================================== */

const PN_NODES = [
  { id: "p_corredores_montanosos", name: "Corredores montañosos", cluster: "EEP", color: "#3ddc84", icon: "fa-mountain", x: 276.9, y: 48.0, r: 14.0 },
  { id: "p_rios", name: "Ríos", cluster: "EEP", color: "#3ddc84", icon: "fa-water", x: 136.2, y: 99.1, r: 21.0 },
  { id: "p_quebradas", name: "Quebradas", cluster: "EEP", color: "#3ddc84", icon: "fa-cloud-rain", x: 220.2, y: 93.5, r: 14.0 },
  { id: "p_humedales", name: "Humedales", cluster: "EEP", color: "#3ddc84", icon: "fa-droplet", x: 267.8, y: 153.0, r: 26.6 },
  { id: "p_cerros_orientales", name: "Cerros Orientales", cluster: "EEP", color: "#3ddc84", icon: "fa-mountain-sun", x: 351.8, y: 41.0, r: 14.0 },
  { id: "p_complejos_de_paramos", name: "Complejos de páramos", cluster: "EEP", color: "#3ddc84", icon: "fa-mountain", x: 111.0, y: 239.1, r: 14.0 },
  { id: "p_bosques_urbanos", name: "Bosques urbanos", cluster: "EEP", color: "#3ddc84", icon: "fa-seedling", x: 138.3, y: 157.9, r: 14.0 },
  { id: "p_coberturas_vegetales", name: "Coberturas vegetales", cluster: "EEP", color: "#3ddc84", icon: "fa-leaf", x: 169.1, y: 230.0, r: 23.8 },
  { id: "p_areas_de_resiliencia_climatica", name: "Áreas de resiliencia climática", cluster: "EEP", color: "#3ddc84", icon: "fa-temperature-arrow-up", x: 188.7, y: 157.9, r: 21.0 },
  { id: "p_areas_protegidas", name: "Áreas protegidas", cluster: "EEP", color: "#3ddc84", icon: "fa-shield-halved", x: 336.4, y: 94.2, r: 14.0 },
  { id: "p_parques_ecologicos_de_montana", name: "Parques ecológicos de montaña", cluster: "EEP", color: "#3ddc84", icon: "fa-tree", x: 379.1, y: 140.4, r: 14.0 },
  { id: "p_reservas_forestales", name: "Reservas forestales", cluster: "EEP", color: "#3ddc84", icon: "fa-tree", x: 344.1, y: 258.0, r: 14.0 },
  { id: "p_parques_de_borde", name: "Parques de borde", cluster: "EEP", color: "#3ddc84", icon: "fa-house-chimney", x: 233.5, y: 254.5, r: 14.0 },
  { id: "p_paisajes_sostenibles", name: "Paisajes sostenibles", cluster: "EEP", color: "#3ddc84", icon: "fa-mountain-sun", x: 172.6, y: 291.6, r: 14.0 },
  { id: "p_equipamientos", name: "Equipamientos", cluster: "EFC", color: "#46d6d0", icon: "fa-building-columns", x: 367.9, y: 377.0, r: 23.8 },
  { id: "p_servicios_de_cuidado", name: "Servicios de cuidado", cluster: "EFC", color: "#46d6d0", icon: "fa-hand-holding-heart", x: 246.8, y: 372.1, r: 14.0 },
  { id: "p_servicios_sociales", name: "Servicios sociales", cluster: "EFC", color: "#46d6d0", icon: "fa-people-roof", x: 313.3, y: 429.5, r: 14.0 },
  { id: "p_servicios_publicos", name: "Servicios públicos", cluster: "EFC", color: "#46d6d0", icon: "fa-plug", x: 179.6, y: 405.0, r: 14.0 },
  { id: "p_ciclorutas", name: "Ciclorutas", cluster: "EFC", color: "#46d6d0", icon: "fa-bicycle", x: 93.5, y: 419.0, r: 14.0 },
  { id: "p_transporte_publico", name: "Transporte público", cluster: "EFC", color: "#46d6d0", icon: "fa-bus", x: 136.9, y: 487.6, r: 14.0 },
  { id: "p_red_vial", name: "Red vial", cluster: "EFC", color: "#46d6d0", icon: "fa-road-circle-check", x: 365.8, y: 514.9, r: 14.0 },
  { id: "p_corredores_verdes", name: "Corredores verdes", cluster: "EFC", color: "#46d6d0", icon: "fa-road", x: 125.0, y: 575.1, r: 14.0 },
  { id: "p_manzanas_del_cuidado", name: "Manzanas del Cuidado", cluster: "EFC", color: "#46d6d0", icon: "fa-heart", x: 230.0, y: 561.8, r: 14.0 },
  { id: "p_parques", name: "Parques", cluster: "EFC", color: "#46d6d0", icon: "fa-tree-city", x: 178.9, y: 532.4, r: 14.0 },
  { id: "p_distrito_centro_tecnologico_e_innovacion", name: "Distrito Centro Tecnológico e Innovación", cluster: "ESECI", color: "#f0a340", icon: "fa-microchip", x: 577.9, y: 233.5, r: 15.4 },
  { id: "p_servicios_empresariales", name: "Servicios empresariales", cluster: "ESECI", color: "#f0a340", icon: "fa-briefcase", x: 461.0, y: 277.6, r: 26.6 },
  { id: "p_sistema_de_educacion", name: "Sistema de educación", cluster: "ESECI", color: "#f0a340", icon: "fa-graduation-cap", x: 588.4, y: 360.9, r: 18.2 },
  { id: "p_centros_de_abastecimiento", name: "Centros de abastecimiento", cluster: "ESECI", color: "#f0a340", icon: "fa-truck-ramp-box", x: 676.6, y: 233.5, r: 14.0 },
  { id: "p_plazas_de_mercado", name: "Plazas de mercado", cluster: "ESECI", color: "#f0a340", icon: "fa-store", x: 543.6, y: 311.9, r: 14.0 },
  { id: "p_zonas_industriales", name: "Zonas industriales", cluster: "ESECI", color: "#f0a340", icon: "fa-industry", x: 724.2, y: 303.5, r: 23.8 },
  { id: "p_produccion_artesanal", name: "Producción artesanal", cluster: "ESECI", color: "#f0a340", icon: "fa-palette", x: 638.8, y: 407.1, r: 14.0 },
  { id: "p_zonas_de_interes_turistico", name: "Zonas de interés turístico", cluster: "ESECI", color: "#f0a340", icon: "fa-map-location-dot", x: 720.0, y: 373.5, r: 14.0 },
  { id: "p_centros_financieros", name: "Centros financieros", cluster: "ESECI", color: "#f0a340", icon: "fa-building-columns", x: 465.9, y: 400.1, r: 14.0 },
  { id: "p_sistema_de_sitios_sagrados", name: "Sistema de sitios sagrados", cluster: "EIP", color: "#a276f2", icon: "fa-place-of-worship", x: 451.2, y: 457.5, r: 14.0 },
  { id: "p_patrimonio_inmaterial", name: "Patrimonio inmaterial", cluster: "EIP", color: "#a276f2", icon: "fa-masks-theater", x: 667.5, y: 452.6, r: 14.0 },
  { id: "p_patrimonio_arqueologico", name: "Patrimonio arqueológico", cluster: "EIP", color: "#a276f2", icon: "fa-landmark-dome", x: 573.7, y: 428.1, r: 14.0 },
  { id: "p_patrimonio_natural", name: "Patrimonio natural", cluster: "EIP", color: "#a276f2", icon: "fa-mountain-sun", x: 465.9, y: 557.6, r: 23.8 },
  { id: "p_patrimonio_material", name: "Patrimonio material", cluster: "EIP", color: "#a276f2", icon: "fa-landmark", x: 608.0, y: 531.0, r: 14.0 },
];

const PN_EDGES = [
  { s: "p_corredores_montanosos", t: "p_rios", tipo: "soporte", directa: true, sinFlecha: false, pagina: "70", articulo: "Art. 7", frase: "corredores montañosos … ríos y humedales" },
  { s: "p_quebradas", t: "p_humedales", tipo: "soporte", directa: true, sinFlecha: false, pagina: "72", articulo: "Art. 42 / 62", frase: "ríos y quebradas … humedales" },
  { s: "p_cerros_orientales", t: "p_humedales", tipo: "soporte", directa: true, sinFlecha: false, pagina: "70", articulo: "Art. 7", frase: "cerros orientales … ríos y humedales" },
  { s: "p_humedales", t: "p_rios", tipo: "soporte", directa: true, sinFlecha: false, pagina: "72", articulo: "Art. 42 / 62", frase: "ríos y quebradas … humedales" },
  { s: "p_rios", t: "p_complejos_de_paramos", tipo: "soporte", directa: true, sinFlecha: false, pagina: "70", articulo: "Art. 7", frase: "complejos de páramos … ríos y humedales" },
  { s: "p_bosques_urbanos", t: "p_coberturas_vegetales", tipo: "soporte", directa: true, sinFlecha: false, pagina: "73", articulo: "Art. 74", frase: "cobertura vegetal … flora propia" },
  { s: "p_areas_de_resiliencia_climatica", t: "p_coberturas_vegetales", tipo: "resiliencia", directa: true, sinFlecha: false, pagina: "72", articulo: "Art. 42", frase: "territorio resiliente … cambio climático" },
  { s: "p_humedales", t: "p_areas_de_resiliencia_climatica", tipo: "soporte", directa: true, sinFlecha: false, pagina: "72", articulo: "Art. 42", frase: "amortiguación de los impactos ambientales" },
  { s: "p_areas_protegidas", t: "p_humedales", tipo: "soporte", directa: false, sinFlecha: false, pagina: "71", articulo: "Art. 41 / 51", frase: "Reservas Distritales de Humedal" },
  { s: "p_areas_protegidas", t: "p_parques_ecologicos_de_montana", tipo: "soporte", directa: false, sinFlecha: false, pagina: "71", articulo: "Art. 51 / 54", frase: "Parques Distritales Ecológicos de Montaña" },
  { s: "p_areas_protegidas", t: "p_reservas_forestales", tipo: "soporte", directa: false, sinFlecha: false, pagina: "71", articulo: "Art. 41 / 45 / 48", frase: "Reserva Forestal Protectora … Regional" },
  { s: "p_reservas_forestales", t: "p_humedales", tipo: "resiliencia", directa: true, sinFlecha: false, pagina: "72", articulo: "Art. 42", frase: "conectividad y complementariedad" },
  { s: "p_parques_ecologicos_de_montana", t: "p_coberturas_vegetales", tipo: "soporte", directa: false, sinFlecha: false, pagina: "72", articulo: "Art. 54", frase: "restaurar y preservar … especies nativas" },
  { s: "p_coberturas_vegetales", t: "p_parques_de_borde", tipo: "soporte", directa: false, sinFlecha: false, pagina: "136", articulo: "Art. 121", frase: "coberturas vegetales … parques de borde" },
  { s: "p_coberturas_vegetales", t: "p_paisajes_sostenibles", tipo: "soporte", directa: false, sinFlecha: false, pagina: "72", articulo: "Art. 52 / 74", frase: "funcionalidad ecosistémica … conectividad" },
  { s: "p_complejos_de_paramos", t: "p_paisajes_sostenibles", tipo: "soporte", directa: false, sinFlecha: false, pagina: "70", articulo: "Art. 7 / 52", frase: "complejos de páramos … paisajes" },
  { s: "p_equipamientos", t: "p_servicios_de_cuidado", tipo: "soporte", directa: false, sinFlecha: false, pagina: "117–118", articulo: "Art. 94–95", frase: "equipamientos y servicios de cuidado" },
  { s: "p_equipamientos", t: "p_servicios_sociales", tipo: "soporte", directa: false, sinFlecha: false, pagina: "117–118", articulo: "Art. 94–95", frase: "equipamientos y servicios sociales" },
  { s: "p_ciclorutas", t: "p_transporte_publico", tipo: "resiliencia", directa: false, sinFlecha: true, pagina: "117 / 158–159", articulo: "Art. 88 / 158–159", frase: "cicloinfraestructura … corredores verdes" },
  { s: "p_ciclorutas", t: "p_areas_de_resiliencia_climatica", tipo: "soporte", directa: true, sinFlecha: false, pagina: null, articulo: "", frase: "Conexión Ciclorutas – Áreas de resiliencia climática (soporte), añadida según lo indicado. Pendiente de completar con la cita y página exactas del documento de sustento." },
  { s: "p_transporte_publico", t: "p_servicios_empresariales", tipo: "soporte", directa: true, sinFlecha: false, pagina: "122", articulo: "Art. 101", frase: "Eje de servicios empresariales … accesibilidad y conectividad del sistema de transporte" },
  { s: "p_servicios_publicos", t: "p_centros_financieros", tipo: "soporte", directa: true, sinFlecha: false, pagina: "179", articulo: "Art. 179", frase: "servicio público … actividades en la ciudad" },
  { s: "p_red_vial", t: "p_transporte_publico", tipo: "soporte", directa: true, sinFlecha: false, pagina: "158–159", articulo: "Art. 158–159", frase: "malla arterial … transporte público" },
  { s: "p_red_vial", t: "p_equipamientos", tipo: "soporte", directa: true, sinFlecha: false, pagina: "117", articulo: "Art. 88 / 95", frase: "accesibilidad … equipamientos" },
  { s: "p_corredores_verdes", t: "p_ciclorutas", tipo: "soporte", directa: true, sinFlecha: false, pagina: "117", articulo: "Política de movilidad", frase: "corredores verdes … cicloinfraestructura" },
  { s: "p_corredores_verdes", t: "p_transporte_publico", tipo: "soporte", directa: true, sinFlecha: false, pagina: "158–159", articulo: "Art. 158–159", frase: "corredores verdes de transporte público" },
  { s: "p_manzanas_del_cuidado", t: "p_servicios_sociales", tipo: "soporte", directa: true, sinFlecha: false, pagina: "117–118", articulo: "Art. 94–95", frase: "manzanas del cuidado … servicios sociales" },
  { s: "p_manzanas_del_cuidado", t: "p_equipamientos", tipo: "soporte", directa: true, sinFlecha: false, pagina: "117–118", articulo: "Art. 94–95", frase: "manzanas del cuidado … equipamientos" },
  { s: "p_manzanas_del_cuidado", t: "p_parques", tipo: "soporte", directa: true, sinFlecha: false, pagina: "117", articulo: "Art. 94", frase: "jardines infantiles, colegios, parques" },
  { s: "p_distrito_centro_tecnologico_e_innovacion", t: "p_servicios_empresariales", tipo: "soporte", directa: true, sinFlecha: false, pagina: "122", articulo: "Art. 101", frase: "Eje de servicios empresariales" },
  { s: "p_distrito_centro_tecnologico_e_innovacion", t: "p_sistema_de_educacion", tipo: "soporte", directa: true, sinFlecha: false, pagina: "122", articulo: "Art. 100–101", frase: "formación del talento humano" },
  { s: "p_centros_de_abastecimiento", t: "p_plazas_de_mercado", tipo: "soporte", directa: false, sinFlecha: false, pagina: "122", articulo: "Art. 100–101", frase: "Centros de Abasto Mayorista … Plazas de Mercado" },
  { s: "p_plazas_de_mercado", t: "p_servicios_empresariales", tipo: "soporte", directa: true, sinFlecha: false, pagina: "122", articulo: "Art. 101", frase: "Plazas de Mercado … infraestructuras" },
  { s: "p_zonas_industriales", t: "p_servicios_empresariales", tipo: "soporte", directa: true, sinFlecha: false, pagina: "122", articulo: "Art. 101", frase: "Eje de servicios empresariales … zonas industriales" },
  { s: "p_zonas_industriales", t: "p_sistema_de_educacion", tipo: "soporte", directa: false, sinFlecha: false, pagina: "122", articulo: "Art. 100–101", frase: "formación del talento humano … empresas" },
  { s: "p_zonas_industriales", t: "p_produccion_artesanal", tipo: "soporte", directa: true, sinFlecha: false, pagina: "122", articulo: "Art. 100–101", frase: "producción tradicional … industrias creativas" },
  { s: "p_zonas_de_interes_turistico", t: "p_plazas_de_mercado", tipo: "soporte", directa: true, sinFlecha: false, pagina: "122", articulo: "Art. 101", frase: "Zonas de Interés Turístico … Plazas de Mercado" },
  { s: "p_centros_financieros", t: "p_servicios_empresariales", tipo: "soporte", directa: true, sinFlecha: false, pagina: "122", articulo: "Art. 100", frase: "centros financieros y de servicios empresariales" },
  { s: "p_sistema_de_sitios_sagrados", t: "p_patrimonio_inmaterial", tipo: "resiliencia", directa: true, sinFlecha: false, pagina: "103–104", articulo: "Art. 80", frase: "patrimonio cultural inmaterial … comunidades" },
  { s: "p_patrimonio_arqueologico", t: "p_patrimonio_natural", tipo: "soporte", directa: true, sinFlecha: false, pagina: "103–104", articulo: "Art. 80", frase: "Patrimonio Natural … Patrimonio Arqueológico" },
  { s: "p_patrimonio_arqueologico", t: "p_patrimonio_material", tipo: "resiliencia", directa: true, sinFlecha: false, pagina: "103–104", articulo: "Art. 80", frase: "Patrimonio Cultural material … Patrimonio Arqueológico" },
  { s: "p_patrimonio_natural", t: "p_patrimonio_inmaterial", tipo: "soporte", directa: true, sinFlecha: false, pagina: "103–104", articulo: "Art. 80", frase: "patrimonio cultural material, inmaterial y natural" },
  { s: "p_patrimonio_material", t: "p_patrimonio_natural", tipo: "soporte", directa: true, sinFlecha: false, pagina: "103–104", articulo: "Art. 80", frase: "integra … material, inmaterial y natural" },
  { s: "p_patrimonio_material", t: "p_patrimonio_inmaterial", tipo: "soporte", directa: true, sinFlecha: false, pagina: "103–104", articulo: "Art. 80", frase: "patrimonio cultural material, inmaterial y natural" },

  /* -------- relaciones ENTRE estructuras (documento aparte) -------- */
  { s: "p_humedales", t: "p_patrimonio_natural", tipo: "soporte", directa: false, sinFlecha: false, pagina: "195–196", articulo: "", frase: "En ese sentido, la EIP inscribe y precisa un sistema de relaciones del patrimonio cultural material, inmaterial y natural en el territorio." },
  { s: "p_patrimonio_arqueologico", t: "p_equipamientos", tipo: "soporte", directa: true, sinFlecha: false, pagina: "200", articulo: "", frase: "Para la Secretaría Distrital de Planeación (SDP), en el proceso de implementación del POT, fue la oportunidad de incorporarlos como nodo de equipamientos próximos y de proyectos a escala local." },
  { s: "p_patrimonio_inmaterial", t: "p_produccion_artesanal", tipo: "soporte", directa: true, sinFlecha: false, pagina: "190", articulo: "", frase: "Esta producción artesanal «corresponde entonces a las actividades creativas de producción de objetos, realizadas con predominio manual y auxiliadas en algunos casos con maquinarias simples, obteniendo un resultado final individualizado, determinado por los patrones culturales, el medio ambiente y su desarrollo histórico»." },
  { s: "p_manzanas_del_cuidado", t: "p_sistema_de_educacion", tipo: "soporte", directa: true, sinFlecha: false, pagina: "126", articulo: "", frase: "Con los nuevos colegios y jardines infantiles anclados en las Manzanas del Cuidado, lograremos que las mujeres, las niñas y los niños puedan garantizar su derecho a la educación en lugares cercanos a sus hogares." },
  { s: "p_equipamientos", t: "p_sistema_de_educacion", tipo: "soporte", directa: true, sinFlecha: false, pagina: "126", articulo: "", frase: "Bajo la nueva visión del POT, la infraestructura social es compatible con otros usos y equipamientos, como centros deportivos, culturales y de recreación, entre otros." },
  { s: "p_equipamientos", t: "p_servicios_empresariales", tipo: "soporte", directa: false, sinFlecha: false, pagina: "165", articulo: "", frase: "Equipamiento como detonante de dinámicas económicas." },
  { s: "p_transporte_publico", t: "p_zonas_industriales", tipo: "soporte", directa: false, sinFlecha: false, pagina: "31", articulo: "", frase: "Y que, en todo caso, las diversas zonas de la ciudad estén conectadas por un sistema multimodal de transporte público, colectivo, de energías limpias y renovables basadas en la red Metro y alimentadas por los demás modos y medios de transporte público como los corredores verdes, los cables y las ciclorrutas." },
  { s: "p_parques_ecologicos_de_montana", t: "p_zonas_de_interes_turistico", tipo: "soporte", directa: false, sinFlecha: false, pagina: "54", articulo: "", frase: "Sostenible: Ecoturismo, viverismo, agricultura urbana y periurbana y puntos de la tierra." },
  { s: "p_parques_ecologicos_de_montana", t: "p_patrimonio_natural", tipo: "soporte", directa: true, sinFlecha: false, pagina: "54", articulo: "", frase: "Son áreas de alta pendiente en suelo urbano y rural, caracterizadas por contar con remanentes de bosques altoandinos dispersos y ecosistemas subxerofíticos de gran importancia ecosistémica entre otros que, por su estructura y función ecosistémica, aportan a la conservación de la biodiversidad y los servicios ecosistémicos, la conectividad ecológica y a la resiliencia climática de los entornos urbanos, rurales y de transición a escala local y regional." },
  { s: "p_areas_de_resiliencia_climatica", t: "p_patrimonio_natural", tipo: "resiliencia", directa: false, sinFlecha: false, pagina: "72", articulo: "", frase: "Así mismo, creamos las Áreas de Resiliencia Climática y Protección por Riesgo…" },
];

/* Nodos paraguas retirados de la visualización porque duplican entidades específicas.
   Se conservan en PN_NODES como fuente histórica, pero no se renderizan ni generan líneas.
   “Sistema de educación” y “Servicios empresariales” se conservan porque el dataset actual
   no contiene nodos separados de colegios/universidades ni una categoría económica equivalente
   que los sustituya sin perder trazabilidad. */
const PN_CONNECTOR_NODE_IDS = new Set([
  "p_equipamientos",
  "p_servicios_sociales",
]);
const PN_VISIBLE_NODES = PN_NODES.filter(n => !PN_CONNECTOR_NODE_IDS.has(n.id));
const PN_VISIBLE_EDGES = PN_EDGES.filter(e => !PN_CONNECTOR_NODE_IDS.has(e.s) && !PN_CONNECTOR_NODE_IDS.has(e.t));

function pnNodeById(id) { return PN_VISIBLE_NODES.find(n => n.id === id); }

/* -------- 3 relaciones destacadas: "favorecen los ODS" -------- */
const PN_ODS_COLOR = { 8: "#A21942", 9: "#FD6925", 11: "#FD9D24", 13: "#3F7E44" };

const PN_FAVORABLE_GROUPS = {
  movilidad: {
    title: "Movilidad y ecosistemas conectados",
    edges: [
      ["p_red_vial", "p_transporte_publico"],
      ["p_corredores_verdes", "p_ciclorutas"],
      ["p_corredores_verdes", "p_transporte_publico"],
      ["p_ciclorutas", "p_areas_de_resiliencia_climatica"],
    ],
    ods: [9, 11, 13],
    badge: { x: 60, y: 300, anchor: "p_red_vial" },
    quotes: [
      { text: "El diseño y construcción de los corredores de movilidad parte de reconocer e incorporar la circulación de correntías y quebradas y todos los factores ecosistémicos.", pagina: "117", articulo: "Art. 88" },
      { text: "Las diversas zonas de la ciudad estén conectadas por un sistema multimodal de transporte público, colectivo, de energías limpias y renovables.", pagina: "158–159", articulo: "Art. 158–159" },
    ],
  },
  distrito: {
    title: "Distrito Tecnológico → Servicios empresariales",
    edges: [["p_distrito_centro_tecnologico_e_innovacion", "p_servicios_empresariales"]],
    ods: [9, 8],
    badge: { x: 700, y: 150, anchor: "p_distrito_centro_tecnologico_e_innovacion" },
    quotes: [
      { text: "Consolidación de un área de actividad especializada en servicios empresariales, tecnológicos y de innovación, que permita fortalecer la competitividad y productividad de la ciudad.", pagina: "122", articulo: "Art. 101" },
    ],
  },
  humedales: {
    title: "Humedales → Resiliencia climática",
    edges: [["p_humedales", "p_areas_de_resiliencia_climatica"]],
    ods: [13],
    badge: { x: 310, y: 60, anchor: "p_humedales" },
    quotes: [
      { text: "Para aumentar su capacidad de resiliencia climática, el POT Bogotá Reverdece 2022–2035 complementa la EEP con más de cien hectáreas de bosques urbanos a consolidar, entre otras muchas estrategias para garantizar el reverdecimiento, la renaturalización y la biodiversidad de Bogotá.", pagina: "72", articulo: "Art. 42" },
    ],
  },
};

/* cada arista que participa en un grupo "favorable" queda marcada, para que al
   hacer clic en ella se muestren las citas completas del hallazgo en vez de
   solo su fragmento suelto de la tabla */
function pnEdgeKey(s, t) { return s + "->" + t; }
const PN_EDGE_TO_GROUP = {};
Object.entries(PN_FAVORABLE_GROUPS).forEach(([key, group]) => {
  group.edges.forEach(([s, t]) => { PN_EDGE_TO_GROUP[pnEdgeKey(s, t)] = key; });
});

/* nodos de la red de estructuras que participan en cada grupo "favorable"
   (para poder apagar/atenuar todo lo demás cuando se activa el grupo) */
Object.values(PN_FAVORABLE_GROUPS).forEach(group => {
  const set = new Set();
  group.edges.forEach(([s, t]) => { set.add(s); set.add(t); });
  group.involvedNodes = set;
});

/* -------- réplica en miniatura del diagrama principal ODS ↔ ODS --------
   Para cada grupo se calcula un mini-layout que conserva las posiciones
   relativas reales de los nodos ODS en la red de arriba (networkViz),
   solo que escaladas hacia abajo y centradas en el punto de la insignia.
   Así el "cluster" de ODS de cada hallazgo se ve igual que en la red
   principal, pero mucho más chico. */
function computeMiniOdsLayout(odsList, cx, cy, scale) {
  const nodes = odsList.map(num => nodeById("ods" + num)).filter(Boolean);
  if (nodes.length === 0) return {};

  const minX = Math.min(...nodes.map(n => n.homeX));
  const maxX = Math.max(...nodes.map(n => n.homeX));
  const minY = Math.min(...nodes.map(n => n.homeY));
  const maxY = Math.max(...nodes.map(n => n.homeY));
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  const positions = {};
  nodes.forEach(n => {
    positions[n.num] = {
      x: cx + (n.homeX - midX) * scale,
      y: cy + (n.homeY - midY) * scale,
      r: Math.max(n.r * scale, 7.5),
      color: n.color,
      num: n.num,
    };
  });
  return positions;
}

/* mismas relaciones reales entre esos ODS (tipo, color, directa/inferida)
   tal como existen en la red principal (RAW_EDGES) */
function pnOdsLinksFor(odsList) {
  const links = [];
  for (let i = 0; i < odsList.length; i++) {
    for (let j = i + 1; j < odsList.length; j++) {
      const a = "ods" + odsList[i], b = "ods" + odsList[j];
      const edge = RAW_EDGES.find(e => (e.s === a && e.t === b) || (e.s === b && e.t === a));
      if (edge) links.push({ from: odsList[i], to: odsList[j], type: edge.type, directa: edge.directa });
    }
  }
  return links;
}

/* -------- construir el SVG de la red de estructuras (estática) -------- */
function buildPnDefs(svg) {
  const defs = document.createElementNS(SVG_NS, "defs");
  const pnColors = { soporte: "#ef9552", resiliencia: "#46d6d0" };
  Object.entries(pnColors).forEach(([tipo, color]) => {
    const marker = document.createElementNS(SVG_NS, "marker");
    marker.setAttribute("id", "pn-arrow-" + tipo);
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "8"); marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "6"); marker.setAttribute("markerHeight", "6");
    marker.setAttribute("orient", "auto-start-reverse");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", "M0,0 L10,5 L0,10 z");
    path.setAttribute("fill", color);
    marker.appendChild(path);
    defs.appendChild(marker);
  });
  svg.appendChild(defs);
}

function pnEdgePath(s, t) {
  const dx = t.x - s.x, dy = t.y - s.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist, uy = dy / dist;
  const x1 = s.x + ux * (s.r + 1.5), y1 = s.y + uy * (s.r + 1.5);
  const x2 = t.x - ux * (t.r + 5),   y2 = t.y - uy * (t.r + 5);
  return `M${x1},${y1} L${x2},${y2}`;
}

function drawPnEdges(svg) {
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("class", "pn-edges-layer");
  const pnColors = { soporte: "#ef9552", resiliencia: "#46d6d0" };

  PN_VISIBLE_EDGES.forEach((edge, i) => {
    const s = pnNodeById(edge.s), t = pnNodeById(edge.t);
    if (!s || !t) return;
    const color = pnColors[edge.tipo];
    const d = pnEdgePath(s, t);
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("class", "pn-edge-group");
    group.setAttribute("data-index", i);
    group.style.setProperty("--pn-edge-color", color);

    const hit = document.createElementNS(SVG_NS, "path");
    hit.setAttribute("d", d);
    hit.setAttribute("class", "pn-edge pn-edge-hit");

    const visual = document.createElementNS(SVG_NS, "path");
    visual.setAttribute("d", d);
    visual.setAttribute("class", "pn-edge pn-edge-visual");
    visual.setAttribute("stroke", color);
    visual.setAttribute("stroke-width", 1.3);
    if (!edge.directa) visual.setAttribute("stroke-dasharray", "5,4");
    if (!edge.sinFlecha) visual.setAttribute("marker-end", `url(#pn-arrow-${edge.tipo})`);
    visual.setAttribute("opacity", "0.8");

    group.appendChild(visual);
    group.appendChild(hit);
    group.addEventListener("click", () => showPnEdgeInfo(i));
    g.appendChild(group);
    edge._el = { group, visual, hit };
  });

  svg.appendChild(g);
}

function drawPnNodes(svg) {
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("class", "pn-nodes-layer");

  PN_VISIBLE_NODES.forEach((node, index) => {
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("class", "pn-node floating-node");
    group.style.setProperty("--float-delay", `${((index * 0.13) % 2.2).toFixed(2)}s`);
    group.setAttribute("data-id", node.id);

    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("class", "pn-node-ring");
    circle.setAttribute("cx", node.x); circle.setAttribute("cy", node.y); circle.setAttribute("r", node.r);
    circle.setAttribute("stroke", node.color);
    circle.setAttribute("stroke-width", 1.6);

    const fo = document.createElementNS(SVG_NS, "foreignObject");
    const size = node.r * 2.1;
    fo.setAttribute("x", node.x - size / 2); fo.setAttribute("y", node.y - size / 2);
    fo.setAttribute("width", size); fo.setAttribute("height", size);

    const wrapper = document.createElementNS(XHTML_NS, "div");
    wrapper.setAttribute("style",
      "width:100%;height:100%;display:flex;flex-direction:column;" +
      "align-items:center;justify-content:center;gap:1px;pointer-events:none;overflow:hidden;"
    );

    const iconEl = document.createElementNS(XHTML_NS, "i");
    iconEl.setAttribute("class", "fa-solid " + node.icon);
    iconEl.setAttribute("style", `color:${node.color}; font-size:${Math.max(node.r * 0.42, 7)}px;`);

    const nameEl = document.createElementNS(XHTML_NS, "div");
    nameEl.setAttribute("style", `color:#c7cde0; font-weight:600; font-size:${Math.max(node.r * 0.185, 4.6)}px; line-height:1.05; padding:0 2px; text-align:center;`);
    nameEl.textContent = node.name;

    wrapper.appendChild(iconEl); wrapper.appendChild(nameEl);
    fo.appendChild(wrapper);
    group.appendChild(circle);
    group.appendChild(fo);
    g.appendChild(group);
    node._el = { circle, fo };
  });

  svg.appendChild(g);
}

function renderPotStructure() {
  const svg = document.getElementById("pnViz");
  if (!svg) return;
  svg.innerHTML = "";
  buildPnDefs(svg);
  drawPnEdges(svg);
  drawPnNodes(svg);
  drawPnOdsBadges(svg);

  /* Agrupa únicamente el contenido visual; las definiciones SVG quedan fuera. */
  const zoomLayer = document.createElementNS(SVG_NS, "g");
  zoomLayer.setAttribute("id", "pnZoomLayer");
  [...svg.children].forEach(child => {
    if (child.tagName.toLowerCase() !== "defs") zoomLayer.appendChild(child);
  });
  svg.appendChild(zoomLayer);
  updatePnZoom();
}

/* -------- clúster ODS en miniatura (una por grupo, oculto hasta activarse) --------
   Réplica a escala reducida del diagrama principal: mismas posiciones
   relativas, mismos colores por ODS y mismas líneas (color/tipo/sólida
   o punteada) que las relaciones reales entre esos ODS arriba. */
function drawPnOdsBadges(svg) {
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("class", "pn-badges-layer");

  const MINI_SCALE = 0.16;

  Object.entries(PN_FAVORABLE_GROUPS).forEach(([key, group]) => {
    const anchor = pnNodeById(group.badge.anchor);
    const bx = group.badge.x, by = group.badge.y;

    const wrap = document.createElementNS(SVG_NS, "g");
    wrap.setAttribute("class", "pn-ods-badge-group");
    wrap.setAttribute("data-group", key);

    const positions = computeMiniOdsLayout(group.ods, bx, by, MINI_SCALE);
    const positionList = Object.values(positions);

    if (anchor && positionList.length) {
      const nearest = positionList[0];
      const connector = document.createElementNS(SVG_NS, "path");
      connector.setAttribute("class", "pn-ods-connector");
      connector.setAttribute("d", `M${nearest.x},${nearest.y} L${anchor.x},${anchor.y}`);
      wrap.appendChild(connector);
    }

    /* líneas primero, para que los nodos queden encima */
    pnOdsLinksFor(group.ods).forEach(link => {
      const a = positions[link.from], b = positions[link.to];
      if (!a || !b) return;
      const style = TYPE_STYLE[link.type];
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("class", "pn-ods-link");
      path.setAttribute("d", `M${a.x},${a.y} L${b.x},${b.y}`);
      path.setAttribute("stroke", style.color);
      path.setAttribute("stroke-width", Math.max(style.width * 0.7, 1));
      if (!link.directa) path.setAttribute("stroke-dasharray", "3,3");
      path.setAttribute("marker-end", `url(#arrow-${link.type})`);
      wrap.appendChild(path);
    });

    /* nodos ODS en miniatura */
    positionList.forEach(p => {
      const badge = document.createElementNS(SVG_NS, "circle");
      badge.setAttribute("class", "pn-ods-badge");
      badge.setAttribute("cx", p.x); badge.setAttribute("cy", p.y); badge.setAttribute("r", p.r);
      badge.setAttribute("fill", p.color);
      wrap.appendChild(badge);

      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("class", "pn-ods-badge-label");
      label.setAttribute("x", p.x); label.setAttribute("y", p.y + p.r * 0.35);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("style", `font-size:${Math.max(p.r * 0.95, 7)}px;`);
      label.textContent = p.num;
      wrap.appendChild(label);
    });

    g.appendChild(wrap);
  });

  svg.appendChild(g);
}

/* -------- resaltar un grupo "favorable": apaga el resto de conceptos (nodos y
   líneas), deja solo los que se mencionan en la relación, y muestra sus
   insignias ODS -------- */
let pnActiveGroup = null;
function togglePnFavorableGroup(key) {
  const already = pnActiveGroup === key;
  clearPnHighlight();
  if (already) return;

  const group = PN_FAVORABLE_GROUPS[key];
  if (!group) return;
  pnActiveGroup = key;

  const activeKeys = new Set(group.edges.map(([s, t]) => pnEdgeKey(s, t)));
  PN_VISIBLE_EDGES.forEach((edge, i) => {
    if (!edge._el) return;
    const on = activeKeys.has(pnEdgeKey(edge.s, edge.t));
    edge._el.group.classList.toggle("pn-edge-highlight", on);
    edge._el.group.classList.toggle("pn-edge-dim", !on);
  });

  document.querySelectorAll(".pn-node").forEach(el => {
    const involved = group.involvedNodes.has(el.dataset.id);
    el.classList.toggle("pn-node-dim", !involved);
    el.classList.toggle("pn-node-active", involved);
  });

  document.querySelector(`.pn-ods-badge-group[data-group="${key}"]`)?.classList.add("visible");
  document.querySelector(`.pn-finding-item[data-pn-finding="${key}"]`)?.classList.add("active");
}

function clearPnHighlight() {
  pnActiveGroup = null;
  document.querySelectorAll(".pn-edge-group").forEach(el => {
    el.classList.remove("pn-edge-highlight", "pn-edge-dim");
  });
  document.querySelectorAll(".pn-node").forEach(el => {
    el.classList.remove("pn-node-dim", "pn-node-active");
  });
  document.querySelectorAll(".pn-ods-badge-group").forEach(el => el.classList.remove("visible"));
  document.querySelectorAll(".pn-finding-item").forEach(el => el.classList.remove("active"));
}

/* -------- panel "Sustento" (clic en cualquier línea de la red de estructuras) -------- */
function showPnEdgeInfo(index) {
  const edge = PN_VISIBLE_EDGES[index];
  const s = pnNodeById(edge.s), t = pnNodeById(edge.t);
  if (!s || !t) return;

  document.querySelectorAll(".pn-edge-group").forEach(el => el.classList.remove("pn-edge-selected"));
  document.querySelector(`.pn-edge-group[data-index="${index}"]`)?.classList.add("pn-edge-selected");

  const panel = document.getElementById("pnSustentoPanel");
  if (!panel) return;

  document.getElementById("pnSustentoTitle").textContent = `${s.name} → ${t.name}`;

  const tipoEl = document.getElementById("pnSustentoTipo");
  const color = edge.tipo === "resiliencia" ? "#46d6d0" : "#ef9552";
  tipoEl.textContent = (edge.tipo === "resiliencia" ? "Resiliencia" : "Soporte") + (edge.directa ? " · Directa" : " · Indirecta");
  tipoEl.style.color = color;
  tipoEl.style.background = color + "26";

  const groupKey = PN_EDGE_TO_GROUP[pnEdgeKey(edge.s, edge.t)];
  const odsRow = document.getElementById("pnSustentoOds");
  const quotesWrap = document.getElementById("pnSustentoQuotes");
  quotesWrap.innerHTML = "";

  if (groupKey) {
    const group = PN_FAVORABLE_GROUPS[groupKey];
    odsRow.innerHTML = "ODS relacionados: " + group.ods.map(n =>
      `<span class="pn-ods-chip" style="background:${(PN_ODS_COLOR[n] || "#8891a5")}26;color:${PN_ODS_COLOR[n] || "#8891a5"}">ODS ${n}</span>`
    ).join(" ");
    odsRow.style.display = "flex";
    group.quotes.forEach(q => {
      const block = document.createElement("div");
      block.className = "pn-sustento-quote-block";
      block.innerHTML = `<div class="pn-sustento-quote">"${q.text}"</div><div class="pn-sustento-page">Página: ${q.pagina} · ${q.articulo}</div>`;
      quotesWrap.appendChild(block);
    });
  } else {
    odsRow.style.display = "none";
    const block = document.createElement("div");
    block.className = "pn-sustento-quote-block";
    block.innerHTML = `<div class="pn-sustento-quote">"${edge.frase}"</div><div class="pn-sustento-page">Página: ${edge.pagina || "por confirmar"} · ${edge.articulo || ""}</div>`;
    quotesWrap.appendChild(block);
  }

  panel.classList.add("visible");
}

function hidePnEdgeInfo() {
  document.getElementById("pnSustentoPanel")?.classList.remove("visible");
  document.querySelectorAll(".pn-edge-group").forEach(el => el.classList.remove("pn-edge-selected"));
}

/* -------- zoom interno de la segunda red -------- */
let pnZoomScale = 1;
const PN_ZOOM_MIN = 0.75;
const PN_ZOOM_MAX = 2.25;
const PN_VIEWBOX_CENTER_X = 400;
const PN_VIEWBOX_CENTER_Y = 310;

function updatePnZoom() {
  const layer = document.getElementById("pnZoomLayer");
  if (!layer) return;
  layer.setAttribute("transform", `translate(${PN_VIEWBOX_CENTER_X} ${PN_VIEWBOX_CENTER_Y}) scale(${pnZoomScale}) translate(${-PN_VIEWBOX_CENTER_X} ${-PN_VIEWBOX_CENTER_Y})`);
  const level = document.getElementById("pnZoomLevel");
  if (level) level.textContent = `${Math.round(pnZoomScale * 100)}%`;
}

function changePnZoom(delta) {
  pnZoomScale = Math.min(PN_ZOOM_MAX, Math.max(PN_ZOOM_MIN, +(pnZoomScale + delta).toFixed(2)));
  updatePnZoom();
}

function setupPnZoom() {
  document.getElementById("pnZoomIn")?.addEventListener("click", () => changePnZoom(0.25));
  document.getElementById("pnZoomOut")?.addEventListener("click", () => changePnZoom(-0.25));

  const svg = document.getElementById("pnViz");
  svg?.addEventListener("wheel", (event) => {
    /* La rueda solo controla la red; no desplaza la página mientras el cursor está sobre ella. */
    event.preventDefault();
    changePnZoom(event.deltaY < 0 ? 0.10 : -0.10);
  }, { passive: false });
}

/* -------- conecta el panel derecho "1. Relaciones que favorecen los ODS" -------- */
function setupPnPanel() {
  document.querySelectorAll(".pn-finding-item[data-pn-finding]").forEach(btn => {
    btn.addEventListener("click", () => togglePnFavorableGroup(btn.dataset.pnFinding));
  });
  document.getElementById("pnSustentoClose")?.addEventListener("click", hidePnEdgeInfo);
}

/* -------- botones de acción (placeholders existentes) -------- */
function generateODSReport() { console.log("Generando reporte POT-ODS..."); }
function downloadAlignment() { console.log("Descargando matriz de alineación..."); }
function shareAnalysis() { console.log("Compartiendo análisis..."); }

/* -------- barra lateral solo-íconos: tooltip flotante con el texto -------- */
function setupSidebarTooltip() {
  const items = document.querySelectorAll(".sidebar .nav-item");
  if (!items.length) return;

  const tip = document.createElement("div");
  tip.className = "sidebar-tooltip";
  document.body.appendChild(tip);

  let hideTimer = null;

  function showTip(el) {
    const label = el.querySelector(".nav-text")?.textContent?.trim();
    if (!label) return;
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    const rect = el.getBoundingClientRect();
    tip.textContent = label;
    tip.style.left = (rect.right + 10) + "px";
    tip.style.top = (rect.top + rect.height / 2) + "px";
    tip.classList.add("visible");
  }

  function hideTip(delay) {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => tip.classList.remove("visible"), delay || 0);
  }

  items.forEach(el => {
    el.addEventListener("mouseenter", () => showTip(el));
    el.addEventListener("mouseleave", () => hideTip(0));
    /* al hacer clic también se muestra el texto (útil en pantallas táctiles,
       donde no existe "hover"); la navegación del enlace sigue su curso normal */
    el.addEventListener("click", () => showTip(el));
    el.addEventListener("focus", () => showTip(el));
    el.addEventListener("blur", () => hideTip(0));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderNetwork();
  setupNetworkZoom();
  ajustarEncuadreRed();
  window.addEventListener("resize", ajustarEncuadreRed);
  setupLegendToggle();
  setupSidePanels();
  renderPotStructure();
  setupPnPanel();
  setupPnZoom();
  setupSidebarTooltip();
});
