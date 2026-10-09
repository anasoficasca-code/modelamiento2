// ============================================================
// RED DE CONECTOGRAFÍAS — MODELO DE COMPLEJIDAD URBANA
// Articulación sistémica de modelos de simulación, metabolismo urbano,
// sintaxis espacial, cronosistemas y SETS en el territorio de Kennedy.
// Visualización interactiva D3.js de alta fidelidad.
// ============================================================

(function () {
  "use strict";

  // --- 1. DEFINICIÓN DE MACROMODELOS ---
  const MACROMODELS = {
    gemelos: {
      id: "gemelos",
      name: "Gemelos Digitales y Simulación Computacional",
      short: "Gemelos Digitales",
      color: "#ff4438",
      bg: "#e0f2fe",
      stroke: "#ff4438"
    },
    cronosistemas: {
      id: "cronosistemas",
      name: "Cronosistemas y Temporalidad Social",
      short: "Cronosistemas",
      color: "#c6e32e",
      bg: "#e0f2fe",
      stroke: "#c6e32e"
    },
    sets: {
      id: "sets",
      name: "Sistemas Socioecológicos y Tecnológicos (SETS)",
      short: "SETS",
      color: "#3fd06a",
      bg: "#e0f2fe",
      stroke: "#3fd06a"
    },
    sintaxis: {
      id: "sintaxis",
      name: "Sintaxis Espacial y Economía de Movimiento",
      short: "Sintaxis Espacial",
      color: "#37c8d8",
      bg: "#bae6fd",
      stroke: "#37c8d8"
    },
    metabolismo: {
      id: "metabolismo",
      name: "Metabolismo Urbano",
      short: "Metabolismo Urbano",
      color: "#3f7de0",
      bg: "#e0f2fe",
      stroke: "#3f7de0"
    }
  };

  // --- 2. NODOS DEL SISTEMA (18 MODELOS) CON RÓTULOS Y LÍNEAS EXACTAS ---
  const NODES_DATA = [
    {
      id: "escenarios_hipoteticos",
      name: "Modelo de Escenarios Hipotéticos",
      lines: ["Modelo de", "Escenarios", "Hipotéticos"],
      macro: "gemelos",
      x: 360, y: 280, r: 64,
      large: true,
      desc: "Simulación prospectiva de escenarios urbanos bajo diferentes supuestos de intervención en Kennedy, cambio climático e infraestructura vial y logística.",
      inputs: ["Datos climáticos proyectados (precipitación, temperatura)", "Planes de ordenamiento territorial (POT)", "Patrones de crecimiento demográfico y comercial"],
      outputs: ["Mapas de escenarios de riesgo futuro", "Evaluación de resiliencia territorial", "Trayectorias de adaptación comunitaria e institucional"]
    },
    {
      id: "flujos_materiales_energia",
      name: "Contabilidad de Flujos de Materiales y Energía",
      lines: ["Contabilidad", "de Flujos de", "Materiales y", "Energía"],
      macro: "metabolismo",
      x: 535, y: 620, r: 68,
      large: true,
      desc: "Cuantificación masiva y energética de entradas, transformaciones internas y acumulaciones que sostienen el funcionamiento de Kennedy y su epicentro agroalimentario.",
      inputs: ["Registros de consumo eléctrico y gas natural", "Distribución de agua potable y descarga de aguas servidas", "Tonelaje de alimentos ingresados a Corabastos"],
      outputs: ["Huella metabólica territorial", "Balance integral de masa y energía", "Puntos críticos de ineficiencia y fuga de recursos"]
    },
    {
      id: "perturbaciones_contingencia",
      name: "Modelo de Simulación de Perturbaciones y Rutas de Contingencia",
      lines: ["Modelo de", "Simulación de", "Perturbaciones y", "Rutas de", "Contingencia"],
      macro: "gemelos",
      x: 228, y: 290, r: 44,
      desc: "Modelación de eventos disruptivos (inundaciones en humedales, bloqueos en Av. de las Américas/Av. Cali, fallas en suministro) y cálculo de rutas de contingencia.",
      inputs: ["Eventos pluviométricos extremos y crecidas del Río Bogotá", "Vulnerabilidad estructural de la red vial", "Ubicación de centros de emergencia y salud"],
      outputs: ["Tiempos de respuesta y evacuación óptimos", "Cuellos de botella viales críticos", "Protocolos de contingencia operativa territorial"]
    },
    {
      id: "ciclos_actividad_ocupacion",
      name: "Modelo de Ciclos de Actividad y Ocupación Temporal",
      lines: ["Modelo de", "Ciclos de", "Actividad y", "Ocupación", "Temporal"],
      macro: "cronosistemas",
      x: 505, y: 255, r: 43,
      desc: "Cronotopos urbanos: alternancia diurna, nocturna e hiper-temprana de usos del suelo y espacio público en el entorno de abastos y centralidades barriales.",
      inputs: ["Registros comerciales de horarios de apertura y cierre", "Patrones de iluminación nocturna y conteos peatonales", "Usos informales y transitorios del espacio público"],
      outputs: ["Mapas de cronotopos y activación espacial 24h", "Identificación de vacíos de uso urbano temporal"]
    },
    {
      id: "pulsos_demanda_horas_pico",
      name: "Modelo de Simulación de Pulsos de Demanda y Horas Pico",
      lines: ["Modelo de", "Simulación de", "Pulsos de", "Demanda y", "Horas Pico"],
      macro: "cronosistemas",
      x: 435, y: 375, r: 44,
      desc: "Variación temporal rítmica de los flujos de carga pesada, abastecimiento mayorista y transporte público en función de los ciclos de operación territorial.",
      inputs: ["Horarios de cargue y descargue en Corabastos (00:00 a 08:00)", "Aforos de tráfico vehicular en accesos a Kennedy", "Demanda horaria de troncales de TransMilenio y SITP"],
      outputs: ["Curvas de sincronización y fricción horaria", "Ventanas de saturación logística y conflicto peatón-camión"]
    },
    {
      id: "simulacion_agentes",
      name: "Modelo de Simulación Basada en Agentes",
      lines: ["Modelo de", "Simulación", "Basada en", "Agentes"],
      macro: "sets",
      x: 295, y: 515, r: 48,
      desc: "Comportamiento autónomo y toma de decisiones de actores urbanos (comerciantes de Corabastos, transportadores, recicladores, habitantes) interactuando en el espacio.",
      inputs: ["Reglas de decisión y micro-comportamiento individual", "Patrones de movilidad peatonal y vehicular local", "Densidad y localización de actividades comerciales informales"],
      outputs: ["Patrones emergentes de ocupación del espacio público", "Dinámicas de aglomeración y dispersión espontánea", "Zonas de congestión no planificadas"]
    },
    {
      id: "estres_microclimatico",
      name: "Simulación de Estrés Microclimático y Respuesta Vegetal.",
      lines: ["Simulación de", "Estrés", "Microclimátic", "o y Respuesta", "Vegetal."],
      macro: "sets",
      x: 205, y: 650, r: 46,
      desc: "Evaluación del confort térmico, efecto isla de calor y capacidad amortiguadora de la cobertura arbórea y humedales (El Burro y La Vaca) ante radiación solar.",
      inputs: ["Imágenes satelitales de temperatura superficial (LST)", "Catastro arbóreo y fitosanitario del JBB", "Humedad relativa y velocidad del viento"],
      outputs: ["Índice de estrés térmico peatonal", "Capacidad amortiguadora vegetal", "Zonas prioritarias para arborización y renaturalización"]
    },
    {
      id: "reconfiguracion_redes",
      name: "Reconfiguración Adaptativa de Redes",
      lines: ["Reconfiguraci", "ón Adaptativa", "de Redes"],
      macro: "sets",
      x: 365, y: 615, r: 43,
      desc: "Flexibilidad y redundancia topológica de las redes ecológicas, logísticas e hídricas para auto-organizarse y redirigir flujos tras una alteración.",
      inputs: ["Matriz de conectividad de parches verdes y cuerpos de agua", "Estructura de la malla vial secundaria y terciaria", "Nodos logísticos de almacenamiento y transbordo"],
      outputs: ["Grado de redundancia nodal", "Capacidad de reconfiguración estructural ante cortes viales o ecológicos"]
    },
    {
      id: "coevolucion_territorio_sociedad",
      name: "Co-evolución Adaptativa Territorio-Sociedad",
      lines: ["Co-evolución", "Adaptativa", "Territorio-", "Sociedad"],
      macro: "sets",
      x: 215, y: 785, r: 43,
      desc: "Procesos mutuos de transformación histórica y adaptativa entre la matriz biofísica de Kennedy y las prácticas socioculturales comunitarias.",
      inputs: ["Evolución histórica de coberturas ecológicas e hídricas", "Iniciativas comunitarias de recuperación de humedales", "Normativa urbana y dinámicas de autoconstrucción"],
      outputs: ["Indicadores de memoria biofísica y arraigo social", "Patrones de transformación espacial comunitaria"]
    },
    {
      id: "vulnerabilidad_resiliencia",
      name: "Modelo de Vulnerabilidad y Resiliencia Sistémica",
      lines: ["Modelo de", "Vulnerabilidad", "y Resiliencia", "Sistémica"],
      macro: "sets",
      x: 305, y: 795, r: 45,
      desc: "Capacidad de absorción, resistencia y regeneración de los sistemas socioecológicos de Kennedy frente a shocks ambientales y presiones socioeconómicas.",
      inputs: ["Exposición a amenazas de inundación y contaminación", "Capacidad adaptativa institucional y comunitaria", "Conectividad de la Estructura Ecológica Principal"],
      outputs: ["Índice de resiliencia territorial multivariable", "Identificación de áreas críticas de fragilidad ecológica"]
    },
    {
      id: "simbiosis_ecoindustrial",
      name: "Modelo de Simbiosis Urbana y Ecoindustrial",
      lines: ["Modelo de", "Simbiosis", "Urbana y", "Ecoindustrial"],
      macro: "metabolismo",
      x: 410, y: 720, r: 41,
      desc: "Aprovechamiento y valorización de subproductos orgánicos y flujos energéticos residuales de Corabastos como insumos para compostaje, agricultura urbana y biometano.",
      inputs: ["Inventario diario de biomasa residual en Corabastos", "Demanda energética y de abonos en la subcuenca del Tintal", "Capacidad instalada de plantas de bio-transformación"],
      outputs: ["Potencial de circularidad de nutrientes", "Balance de reducción de residuos dispuestos en relleno sanitario"]
    },
    {
      id: "modelo_eleccion",
      name: "Modelo de Elección",
      lines: ["Modelo de", "Elección"],
      macro: "sintaxis",
      x: 590, y: 490, r: 39,
      desc: "Sintaxis Espacial: medición matemática de la probabilidad de que un segmento de calle sea elegido como la ruta más directa y accesible (Choice / Intermediación).",
      inputs: ["Grafo axial de la malla vial de Kennedy", "Radios topológicos y métricos (r=3, r=n)", "Pesos de conectividad de intersecciones"],
      outputs: ["Líneas de mayor potencial de flujo pasante", "Ejes estructurantes de dinamismo comercial"]
    },
    {
      id: "profundidad_convexidad",
      name: "Modelo de Profundidad y Convexidad Topológica",
      lines: ["Modelo de", "Profundidad y", "Convexidad", "Topológica"],
      macro: "sintaxis",
      x: 720, y: 415, r: 43,
      desc: "Cálculo del número de cambios de dirección requeridos para acceder a un espacio desde la red general (Integración, Profundidad Media e Isóvistas).",
      inputs: ["Polígonos de espacios convexos y espacio público", "Topología del tejido vial y callejones de barrio", "Puntos de control visual e intervisibilidad"],
      outputs: ["Mapa de integración global y local", "Detección de bolsas de aislamiento y segregación espacial"]
    },
    {
      id: "autoorganizacion_morfologica",
      name: "Modelo de Autoorganización Morfológica",
      lines: ["Modelo de", "Autoorganización", "Morfológica"],
      macro: "sintaxis",
      x: 730, y: 535, r: 39,
      desc: "Patrones de emergencia morfológica y adaptación informal del parcelario y edificaciones alrededor de grandes focos de atracción económica.",
      inputs: ["Fotografías aéreas históricas y evolución predial", "Loteo catastral y subdivisiones informales", "Tipologías de ocupación comercial progresiva"],
      outputs: ["Índices de permeabilidad y granularidad morfológica", "Vectores de propagación del crecimiento comercial informal"]
    },
    {
      id: "friccion_flujos_transporte",
      name: "Modelo de fricción y distribución de flujos de transporte",
      lines: ["Modelo de fricción", "y distribución de", "flujos de", "transporte"],
      macro: "sintaxis",
      x: 635, y: 625, r: 43,
      desc: "Impedancia espacial, demoras por congestión y distribución probabilística de viajes entre orígenes y destinos en la red multimodal.",
      inputs: ["Tiempos de viaje y velocidades operativas por tramo vial", "Matriz Origen-Destino de carga y pasajeros", "Capacidad vial de ejes arteriales"],
      outputs: ["Líneas de deseo y distribución modal", "Costos generalizados de fricción espacial"]
    },
    {
      id: "metabolismo_movilidad_viales",
      name: "Metabolismo de Movilidad y Flujos Viales",
      lines: ["Metabolismo", "de Movilidad y", "Flujos Viales"],
      macro: "metabolismo",
      x: 585, y: 760, r: 45,
      desc: "Consumo de combustibles fósiles, desgaste de la infraestructura pavimentada y emisiones generadas por el transporte de carga y transporte masivo.",
      inputs: ["Volumen y tipología de vehículos diésel y gasolina", "Factores de emisión por flota vehicular", "Índice de estado del pavimento (PCI)"],
      outputs: ["Inventario de emisiones móviles (CO₂, PM2.5)", "Demanda energética del subsistema de transporte"]
    },
    {
      id: "entradas_salidas_recursos",
      name: "modelo de entradas, salidas y acumulación de recursos.",
      lines: ["modelo de", "entradas,", "salidas y", "acumulación", "de recursos."],
      macro: "metabolismo",
      x: 470, y: 825, r: 52,
      desc: "Balance de masa agregado: cálculo dinámico de toneladas de alimentos que ingresan, productos redistribuidos hacia Bogotá y residuos orgánicos generados.",
      inputs: ["Registros de báscula de entrada y salida de Corabastos", "Estimación de consumo alimentario en UPZ de Kennedy", "Tasa de merma y descomposición de perecederos"],
      outputs: ["Tasa de rotación metabólica de recursos", "Coeficiente de acumulación y pérdida de masa agroalimentaria"]
    },
    {
      id: "gestion_residuos_emisiones",
      name: "Gestión de Residuos y Emisiones",
      lines: ["Gestión de", "Residuos y", "Emisiones"],
      macro: "metabolismo",
      x: 630, y: 875, r: 41,
      desc: "Logística inversa, rutas de recolección de residuos sólidos, control de lixiviados y emisiones fugitivas de metano en el entorno de almacenamiento y abastos.",
      inputs: ["Toneladas diarias de residuos recolectados por operadores", "Capacidad de acopios y bodegas de reciclaje", "Monitoreo de olores y gases en puntos de acopio"],
      outputs: ["Rutas optimizadas de recolección selectiva", "Balance de emisiones evitadas por valorización local"]
    }
  ];

  // --- 3. ENLACES DEL SISTEMA (RELACIONES SISTÉMICAS) ---
  const LINKS_DATA = [
    { source: "escenarios_hipoteticos", target: "perturbaciones_contingencia" },
    { source: "escenarios_hipoteticos", target: "simulacion_agentes" },
    { source: "escenarios_hipoteticos", target: "pulsos_demanda_horas_pico" },
    { source: "escenarios_hipoteticos", target: "ciclos_actividad_ocupacion" },
    { source: "escenarios_hipoteticos", target: "flujos_materiales_energia" },
    { source: "escenarios_hipoteticos", target: "reconfiguracion_redes" },

    { source: "perturbaciones_contingencia", target: "simulacion_agentes" },
    { source: "perturbaciones_contingencia", target: "estres_microclimatico" },

    { source: "simulacion_agentes", target: "estres_microclimatico" },
    { source: "simulacion_agentes", target: "coevolucion_territorio_sociedad" },
    { source: "simulacion_agentes", target: "reconfiguracion_redes" },
    { source: "simulacion_agentes", target: "flujos_materiales_energia" },

    { source: "estres_microclimatico", target: "coevolucion_territorio_sociedad" },
    { source: "estres_microclimatico", target: "vulnerabilidad_resiliencia" },

    { source: "coevolucion_territorio_sociedad", target: "vulnerabilidad_resiliencia" },

    { source: "vulnerabilidad_resiliencia", target: "reconfiguracion_redes" },
    { source: "vulnerabilidad_resiliencia", target: "simbiosis_ecoindustrial" },
    { source: "vulnerabilidad_resiliencia", target: "entradas_salidas_recursos" },

    { source: "reconfiguracion_redes", target: "simbiosis_ecoindustrial" },
    { source: "reconfiguracion_redes", target: "flujos_materiales_energia" },

    { source: "simbiosis_ecoindustrial", target: "flujos_materiales_energia" },
    { source: "simbiosis_ecoindustrial", target: "entradas_salidas_recursos" },

    { source: "pulsos_demanda_horas_pico", target: "ciclos_actividad_ocupacion" },
    { source: "pulsos_demanda_horas_pico", target: "modelo_eleccion" },
    { source: "pulsos_demanda_horas_pico", target: "flujos_materiales_energia" },

    { source: "ciclos_actividad_ocupacion", target: "profundidad_convexidad" },

    { source: "modelo_eleccion", target: "profundidad_convexidad" },
    { source: "modelo_eleccion", target: "autoorganizacion_morfologica" },
    { source: "modelo_eleccion", target: "friccion_flujos_transporte" },
    { source: "modelo_eleccion", target: "flujos_materiales_energia" },

    { source: "profundidad_convexidad", target: "autoorganizacion_morfologica" },

    { source: "autoorganizacion_morfologica", target: "friccion_flujos_transporte" },

    { source: "friccion_flujos_transporte", target: "flujos_materiales_energia" },
    { source: "friccion_flujos_transporte", target: "metabolismo_movilidad_viales" },

    { source: "flujos_materiales_energia", target: "metabolismo_movilidad_viales" },
    { source: "flujos_materiales_energia", target: "entradas_salidas_recursos" },
    { source: "flujos_materiales_energia", target: "gestion_residuos_emisiones" },

    { source: "entradas_salidas_recursos", target: "metabolismo_movilidad_viales" },
    { source: "entradas_salidas_recursos", target: "gestion_residuos_emisiones" },

    { source: "metabolismo_movilidad_viales", target: "gestion_residuos_emisiones" }
  ];

  // --- 4. CLUSTERS Y FORMAS ENVOLVENTES ---
  const CLUSTERS_DATA = [
    {
      id: "gemelos",
      label: "MODELO DE GEMELOS DIGITALES Y SIMULACIÓN COMPUTACIONAL",
      d: "M 155,240 C 155,185 410,180 445,240 C 475,300 415,385 340,380 C 240,375 155,340 155,240 Z",
      textPathD: "M 120,320 C 120,175 340,140 450,210",
      startOffset: "50%"
    },
    {
      id: "cronosistemas",
      label: "MACROMODELO DE CRONOSISTEMAS Y TEMPORALIDAD SOCIAL",
      d: "M 370,320 C 370,205 570,180 575,270 C 580,345 500,445 425,445 C 370,445 370,390 370,320 Z",
      textPathD: "M 380,185 C 470,140 570,180 610,260",
      startOffset: "50%"
    },
    {
      id: "sets",
      label: "SISTEMAS SOCIOECOLÓGICOS Y TECNOLÓGICOS (SETS)",
      d: "M 130,680 C 110,480 340,430 425,560 C 445,630 425,750 365,850 C 270,915 150,865 135,760 Z",
      textPathD: "M 140,780 C 100,640 180,480 360,440",
      startOffset: "50%"
    },
    {
      id: "sintaxis",
      label: "SINTAXIS ESPACIAL Y ECONOMÍA DE MOVIMIENTO",
      d: "M 535,510 C 535,360 780,340 790,460 C 800,560 770,670 650,700 C 565,715 535,620 535,510 Z",
      textPathD: "M 570,360 C 690,300 790,380 810,510",
      startOffset: "50%"
    },
    {
      id: "metabolismo",
      label: "MACROMODELO DE METABOLISMO URBANO",
      d: "M 345,745 C 375,550 635,540 710,720 C 740,845 680,950 515,950 C 390,950 330,875 345,745 Z",
      textPathD: "M 680,570 C 740,700 720,860 620,950",
      startOffset: "50%"
    }
  ];

  // --- 5. INICIALIZACIÓN DE ELEMENTOS DOM / D3 ---
  const svg = d3.select("#redSvg");
  const mainContainer = document.querySelector(".main");

  let width = mainContainer.clientWidth || window.innerWidth;
  let height = mainContainer.clientHeight || window.innerHeight;

  const VB_SIZE = 1000;

  // Defs (gradientes y filtros)
  const defs = svg.append("defs");

  // Gradiente radial para los nodos
  const nodeGrad = defs.append("radialGradient")
    .attr("id", "nodeGradient")
    .attr("cx", "45%")
    .attr("cy", "40%")
    .attr("r", "55%");
  nodeGrad.append("stop").attr("offset", "0%").attr("stop-color", "#241d15");
  nodeGrad.append("stop").attr("offset", "60%").attr("stop-color", "#14110d");
  nodeGrad.append("stop").attr("offset", "100%").attr("stop-color", "#0a0908");

  // Sombra suave para nodos
  const filter = defs.append("filter")
    .attr("id", "nodeShadow")
    .attr("x", "-25%").attr("y", "-25%")
    .attr("width", "150%").attr("height", "150%");
  filter.append("feDropShadow")
    .attr("dx", "0").attr("dy", "2")
    .attr("stdDeviation", "4")
    .attr("flood-color", "#000000")
    .attr("flood-opacity", "0.6");

  // Grupo raíz de Zoom & Pan
  const root = svg.append("g").attr("class", "zoom-root");

  // Capas en orden visual
  const outerLayer = root.append("g").attr("class", "layer-outer");
  const clusterLayer = root.append("g").attr("class", "layer-clusters");
  const linkLayer = root.append("g").attr("class", "layer-links");
  const particleLayer = root.append("g").attr("class", "layer-particles");
  const nodeLayer = root.append("g").attr("class", "layer-nodes");

  // Paths para textPath de clusters
  CLUSTERS_DATA.forEach(c => {
    defs.append("path")
      .attr("id", "tp-" + c.id)
      .attr("d", c.textPathD);
  });

  // Path para texto envolvente exterior: "MODELO DE COMPLEJIDAD URBANA"
  defs.append("path")
    .attr("id", "tp-outer-title")
    .attr("d", "M 740,240 C 920,380 920,620 740,780");

  // --- 6. DIBUJO DE ESTRUCTURAS DE FONDO Y CLUSTERS ---
  function drawBackgroundStructures() {
    // Círculo envolvente exterior
    outerLayer.append("ellipse")
      .attr("cx", 480)
      .attr("cy", 520)
      .attr("rx", 440)
      .attr("ry", 440)
      .attr("class", "macro-boundary-path")
      .attr("stroke", "#c8d9e6")
      .attr("stroke-dasharray", "7 6")
      .attr("stroke-width", 2.2);

    // Texto perimetral derecho: "MODELO DE COMPLEJIDAD URBANA"
    outerLayer.append("text")
      .attr("class", "macro-outer-label")
      .style("opacity", 0)
      .append("textPath")
      .attr("href", "#tp-outer-title")
      .attr("startOffset", "50%")
      .attr("text-anchor", "middle")
      .text("MODELO DE COMPLEJIDAD URBANA");
    outerLayer.select(".macro-outer-label")
      .transition().delay(2700).duration(700).style("opacity", 1);

    // Botón circular superior de cierre / reset (✕)
    const closeGroup = outerLayer.append("g")
      .attr("class", "diagram-close-btn")
      .attr("transform", "translate(480, 80)")
      .on("click", () => resetZoom());

    closeGroup.append("circle")
      .attr("r", 15)
      .attr("fill", "#475569")
      .attr("filter", "url(#nodeShadow)");

    closeGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 4.5)
      .attr("font-size", 13)
      .attr("font-weight", "bold")
      .attr("fill", "#ffffff")
      .text("✕");

    // Clusters macromodelo
    CLUSTERS_DATA.forEach(cluster => {
      const cg = clusterLayer.append("g")
        .attr("class", "cluster-group")
        .attr("data-cluster", cluster.id);

      cg.append("path")
        .attr("d", cluster.d)
        .attr("class", "macro-cluster-path");

      cg.append("text")
        .attr("class", "macro-label-text")
        .style("opacity", 0)
        .append("textPath")
        .attr("href", "#tp-" + cluster.id)
        .attr("startOffset", cluster.startOffset || "50%")
        .attr("text-anchor", "middle")
        .text(cluster.label);
      cg.select(".macro-label-text")
        .transition().delay(2400).duration(600).style("opacity", 1);
    });
  }

  // --- 7. DIBUJO DE ENLACES ---
  const nodeMap = new Map();
  NODES_DATA.forEach(n => {
    n.origX = n.x;
    n.origY = n.y;
    nodeMap.set(n.id, n);
  });

  const resolvedLinks = LINKS_DATA.map(l => {
    return {
      source: typeof l.source === "string" ? nodeMap.get(l.source) : l.source,
      target: typeof l.target === "string" ? nodeMap.get(l.target) : l.target
    };
  });

  function linkPath(d) {
    const sx = d.source._px ?? d.source.x, sy = d.source._py ?? d.source.y;
    const tx = d.target._px ?? d.target.x, ty = d.target._py ?? d.target.y;
    const dx = tx - sx, dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return `M ${sx} ${sy}`;

    const curvature = Math.min(22, dist * 0.08);
    const mx = (sx + tx) / 2 - (dy / dist) * curvature;
    const my = (sy + ty) / 2 + (dx / dist) * curvature;

    return `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`;
  }

  let linkElements;

  function drawLinks() {
    linkElements = linkLayer.selectAll(".net-link")
      .data(resolvedLinks)
      .join("path")
      .attr("class", l => "net-link m-" + l.source.macro)
      .attr("d", linkPath);
    // Los enlaces aparecen cuando las bolas ya se acomodaron
    linkLayer.classed("entering", true);
    setTimeout(() => linkLayer.classed("entering", false), 2900);
  }

  // --- 8. DIBUJO DE NODOS Y AJUSTE PERFECTO DE TEXTO (SIN DESBORDAMIENTO) ---
  let nodeElements;

  // Entrada animada: todo nace del centro del diagrama
  const ENTER_X = 480, ENTER_Y = 520;
  const enterDelay = (d, i) => 300 + i * 110;

  // Icono vectorial (Font Awesome) por modelo: primera fila del rotulo
  const FA_ICONS = {
    escenarios_hipoteticos: "\uf06e",
    flujos_materiales_energia: "\uf0eb",
    perturbaciones_contingencia: "\uf071",
    ciclos_actividad_ocupacion: "\uf017",
    pulsos_demanda_horas_pico: "\uf201",
    simulacion_agentes: "\uf0c0",
    estres_microclimatico: "\uf2c9",
    reconfiguracion_redes: "\uf6ff",
    coevolucion_territorio_sociedad: "\uf4d8",
    vulnerabilidad_resiliencia: "\uf3ed",
    simbiosis_ecoindustrial: "\uf275",
    modelo_eleccion: "\uf14e",
    profundidad_convexidad: "\uf546",
    autoorganizacion_morfologica: "\uf471",
    friccion_flujos_transporte: "\uf0d1",
    metabolismo_movilidad_viales: "\uf018",
    entradas_salidas_recursos: "\uf021",
    gestion_residuos_emisiones: "\uf1b8"
  };

  function drawNodes() {
    nodeElements = nodeLayer.selectAll(".net-node")
      .data(NODES_DATA)
      .join("g")
      .attr("class", "net-node")
      .attr("id", d => "node-" + d.id)
      .attr("transform", d => `translate(${d.x}, ${d.y})`)
      .call(
        d3.drag()
          .on("start", dragStarted)
          .on("drag", dragged)
          .on("end", dragEnded)
      )
      .on("click", (ev, d) => {
        ev.stopPropagation();
        if (owlDemoPending && typeof showOwlDrawer === "function") {
          owlDemoPending = false;
          focusNode(d);
          showOwlDrawer(d);
          setTimeout(() => highlightNeighborhood(d), 2600);
          return;
        }
        selectNode(d);
      })
      .on("mouseenter", (ev, d) => highlightNeighborhood(d))
      .on("mouseleave", resetHighlight);

    // Halo que "respira" detras del circulo principal (no toca posiciones)
    nodeElements.append("circle")
      .attr("class", "node-halo")
      .attr("r", d => d.r)
      .style("animation-delay", (d, i) => `${((i % 6) * 0.55).toFixed(2)}s`);

    // Círculo principal del nodo (borde según su macromodelo vía clase CSS)
    nodeElements.append("circle")
      .attr("class", d => "node-circle mac-" + d.macro)
      .attr("r", d => d.r)
      .attr("filter", "url(#nodeShadow)");

    // Rótulo de texto con cálculo de tamaño dinámico para evitar desbordamientos
    nodeElements.each(function (d, i) {
      const g = d3.select(this);
      const textEl = g.append("text")
        .attr("class", "node-text" + (d.large ? " large" : ""))
        .attr("text-anchor", "middle");

      const baseLines = d.lines || d.name.split("\n");
      const faIcon = FA_ICONS[d.id];
      const rows = faIcon
        ? [{ icon: true, text: faIcon }, ...baseLines.map(t => ({ icon: false, text: t }))]
        : baseLines.map(t => ({ icon: false, text: t }));
      const numLines = rows.length;

      // Tamaño de fuente base según tamaño del nodo y cantidad de líneas
      let fontSize = d.large ? 12 : (d.r <= 41 ? 7.6 : (d.r <= 46 ? 8.2 : 9.0));
      if (numLines >= 5 && !d.large) fontSize = Math.min(fontSize, 7.3);

      textEl.style("font-size", fontSize + "px");

      let lineHeight = fontSize * 1.22;
      let totalOffset = ((numLines - 1) * lineHeight) / 2;

      rows.forEach((row, i) => {
        const ts = textEl.append("tspan")
          .attr("x", 0)
          .attr("y", -totalOffset + i * lineHeight)
          .text(row.text);
        if (row.icon) {
          ts.style("font-family", "'Font Awesome 6 Free'")
            .style("font-weight", "900")
            .style("font-size", (fontSize * 1.45).toFixed(1) + "px")
            .style("fill", "#cfc7b4");
        }
      });

      // Revelado letra por letra: cada caracter aparece en secuencia
      (function revealLetters() {
        const baseDelay = 300 + i * 110 + 800;
        const rowSels = textEl.selectAll("tspan").nodes();
        rowSels.forEach((rowNode, ri) => {
          const rowSel = d3.select(rowNode);
          const str = rows[ri] ? rows[ri].text : "";
          const y = rowSel.attr("y");
          const rfs = rowSel.style("font-size") || (fontSize + "px");
          const isIcon = rows[ri] && rows[ri].icon;
          rowSel.text(null);
          if (!str) return;
          const chars = [...str];
          const probes = chars.map(ch => {
            const p = textEl.append("tspan").attr("x", -5000).attr("y", y)
              .attr("text-anchor", "start").style("font-size", rfs)
              .text(ch === " " ? " " : ch);
            if (isIcon) p.style("font-family", "'Font Awesome 6 Free'").style("font-weight", "900");
            return p;
          });
          const ws = probes.map(p => {
            let w = 0;
            try { w = p.node().getComputedTextLength(); } catch (e) { w = fontSize * 0.6; }
            return w;
          });
          probes.forEach(p => p.remove());
          let x = -ws.reduce((a, b) => a + b, 0) / 2;
          chars.forEach((ch, ci) => {
            const c = textEl.append("tspan")
              .attr("x", x.toFixed(1)).attr("y", y).attr("text-anchor", "start")
              .style("font-size", rfs).style("opacity", 0)
              .text(ch === " " ? " " : ch);
            if (isIcon) c.style("font-family", "'Font Awesome 6 Free'").style("font-weight", "900");
            c.transition().delay(baseDelay + ri * 130 + ci * 26).duration(280).style("opacity", 1);
            x += ws[ci];
          });
        });
      })();

      // Medición exacta y auto-ajuste de escala si excede el área segura del círculo
      try {
        const bbox = textEl.node().getBBox();        const maxAllowedWidth = d.r * 1.76;
        const maxAllowedHeight = d.r * 1.72;

        if (bbox.width > maxAllowedWidth || bbox.height > maxAllowedHeight) {
          const scale = Math.min(maxAllowedWidth / bbox.width, maxAllowedHeight / bbox.height, 1);
          if (scale < 0.98) {
            fontSize = Math.floor(fontSize * scale * 10) / 10;
            textEl.style("font-size", fontSize + "px");
            lineHeight = fontSize * 1.20;
            totalOffset = ((numLines - 1) * lineHeight) / 2;
            textEl.selectAll("tspan").each(function (t, i) {
              const sel = d3.select(this);
              sel.attr("y", -totalOffset + i * lineHeight);
              if (rows[i] && rows[i].icon) sel.style("font-size", (fontSize * 1.45).toFixed(1) + "px");
            });
          }
        }
      } catch (err) {
        // En caso de SSR o render sin DOM activo
      }
    });

    // Entrada: las bolas salen del centro una por una y luego se forman los circulos
    nodeElements
      .attr("transform", `translate(${ENTER_X}, ${ENTER_Y})`)
      .style("opacity", 0)
      .transition()
      .delay(enterDelay)
      .duration(900)
      .ease(d3.easeCubicOut)
      .attr("transform", d => `translate(${d.x}, ${d.y})`)
      .style("opacity", 1);
    nodeElements.select(".node-circle")
      .attr("r", 0)
      .transition()
      .delay((d, i) => 300 + i * 110 + 450)
      .duration(650)
      .ease(d3.easeCubicOut)
      .attr("r", d => d.r);
    // Limpia el estilo en linea para no romper el resaltado/dim posterior
    setTimeout(() => nodeElements.style("opacity", null), 3600);
  }

  // --- 9. INTERACTIVIDAD: DRAGGING ---
  function dragStarted(ev, d) {
    d3.select(this).raise();
  }

  function dragged(ev, d) {
    d.x = ev.x;
    d.y = ev.y;
    d3.select(this).attr("transform", `translate(${d.x}, ${d.y})`);
    linkElements.attr("d", linkPath);
  }

  function dragEnded(ev, d) {
    // Mantener la posición
  }

  // --- 10. HIGHLIGHT Y VECINDARIO ---
  let selectedNodeId = null;

  function highlightNeighborhood(targetNode) {
    const neighborIds = new Set([targetNode.id]);

    resolvedLinks.forEach(l => {
      if (l.source.id === targetNode.id) neighborIds.add(l.target.id);
      if (l.target.id === targetNode.id) neighborIds.add(l.source.id);
    });

    nodeElements.classed("dimmed", d => !neighborIds.has(d.id));
    nodeElements.classed("active", d => d.id === targetNode.id);

    linkElements.classed("highlight", l => l.source.id === targetNode.id || l.target.id === targetNode.id);
    linkElements.classed("dimmed", l => l.source.id !== targetNode.id && l.target.id !== targetNode.id);
  }

  function resetHighlight() {
    if (selectedNodeId) {
      const selNode = nodeMap.get(selectedNodeId);
      if (selNode) {
        highlightNeighborhood(selNode);
        return;
      }
    }
    nodeElements.classed("dimmed", false);
    nodeElements.classed("active", false);
    linkElements.classed("highlight", false);
    linkElements.classed("dimmed", false);
  }

  // --- 11. PANEL LATERAL DE DETALLES (DRAWER) ---
  const infoDrawer = document.getElementById("infoDrawer");
  const drawerBody = document.getElementById("drawerBody");
  const drawerClose = document.getElementById("drawerClose");

  // Regla del buho (como en humedalburro): el primer clic en cualquier
  // bola muestra el buho sabanero con zoom, y a los 2,6 s abre su sub-red.
  let owlDemoPending = true;
  const OWL_INFO = {
    code: "AVE-031",
    name: "Búho sabanero",
    sciname: "Asio flammeus bogotensis",
    macro: "sets",
    desc: "Consumidor secundario del humedal: controla roedores e insectos en los juncales de El Burro y La Vaca.",
    loc: "Humedal El Burro y La Vaca (Kennedy).",
    alert: "Sensible a pérdida de juncales y contaminación hídrica."
  };

  function showOwlDrawer(d) {
    selectedNodeId = d.id;
    highlightNeighborhood(d);

    const connectedNodes = [];
    resolvedLinks.forEach(l => {
      if (l.source.id === d.id) connectedNodes.push(l.target);
      if (l.target.id === d.id) connectedNodes.push(l.source);
    });

    const connectedHtml = connectedNodes.map(cn => {
      const cMacro = MACROMODELS[cn.macro] || { short: cn.macro };
      return `
        <div class="connected-pill" data-target="${cn.id}">
          <div>
            <b>${cn.name.replace(/\n/g, " ")}</b>
            <div style="font-size: 10px; color: #64748b;">${cMacro.short}</div>
          </div>
          <i class="fa-solid fa-arrow-right" style="font-size: 11px;"></i>
        </div>
      `;
    }).join("");

    drawerBody.innerHTML = `
      <div class="drawer-macro" style="color: #3fd06a;">
        <i class="fa-solid fa-feather"></i> ${OWL_INFO.code} · Avifauna de humedal
      </div>
      <h3 class="drawer-title">${OWL_INFO.name}</h3>
      <div style="font-size: 11.5px; font-style: italic; color: #8b98a8; margin: -10px 0 14px;">${OWL_INFO.sciname}</div>

      <div class="drawer-desc">
        ${OWL_INFO.desc}
      </div>

      <div class="drawer-section">
        <h4><i class="fa-solid fa-location-dot" style="color: #4e8d8a;"></i> Ubicación en Kennedy</h4>
        <ul><li>${OWL_INFO.loc}</li></ul>
      </div>

      <div class="drawer-section">
        <h4><i class="fa-solid fa-triangle-exclamation" style="color: #b0503a;"></i> Vulnerabilidad del hábitat</h4>
        <ul><li>${OWL_INFO.alert}</li></ul>
      </div>

      <div class="drawer-section">
        <h4><i class="fa-solid fa-diagram-project" style="color: #8a8f96;"></i> Sub-red: modelos vinculados (${connectedNodes.length})</h4>
        <div class="connected-pill-list">
          ${connectedHtml}
        </div>
      </div>
    `;

    drawerBody.querySelectorAll(".connected-pill").forEach(el => {
      el.addEventListener("click", () => {
        const targetId = el.getAttribute("data-target");
        const targetNode = nodeMap.get(targetId);
        if (targetNode) {
          selectNode(targetNode);
          focusNode(targetNode);
        }
      });
    });

    infoDrawer.classList.add("open");
  }

  function selectNode(d) {
    selectedNodeId = d.id;
    highlightNeighborhood(d);

    const connectedNodes = [];
    resolvedLinks.forEach(l => {
      if (l.source.id === d.id) connectedNodes.push(l.target);
      if (l.target.id === d.id) connectedNodes.push(l.source);
    });

    const macroMeta = MACROMODELS[d.macro] || { name: d.macro, color: "#8a8578" };

    const inputsHtml = (d.inputs || []).map(i => `<li>${i}</li>`).join("");
    const outputsHtml = (d.outputs || []).map(o => `<li>${o}</li>`).join("");

    const connectedHtml = connectedNodes.map(cn => {
      const cMacro = MACROMODELS[cn.macro] || { short: cn.macro };
      return `
        <div class="connected-pill" data-target="${cn.id}">
          <div>
            <b>${cn.name.replace(/\n/g, " ")}</b>
            <div style="font-size: 10px; color: #64748b;">${cMacro.short}</div>
          </div>
          <i class="fa-solid fa-arrow-right" style="font-size: 11px;"></i>
        </div>
      `;
    }).join("");

    drawerBody.innerHTML = `
      <div class="drawer-macro" style="color: ${macroMeta.color};">
        <i class="fa-solid fa-cube"></i> ${macroMeta.name}
      </div>
      <h3 class="drawer-title">${d.name.replace(/\n/g, " ")}</h3>
      
      <div class="drawer-desc">
        ${d.desc}
      </div>

      <div class="drawer-section">
        <h4><i class="fa-solid fa-arrow-right-to-bracket" style="color: #4e8d8a;"></i> Variables de Entrada (Inputs)</h4>
        <ul>${inputsHtml}</ul>
      </div>

      <div class="drawer-section">
        <h4><i class="fa-solid fa-arrow-up-right-from-square" style="color: #7a8b6f;"></i> Resultados y Salidas (Outputs)</h4>
        <ul>${outputsHtml}</ul>
      </div>

      <div class="drawer-section">
        <h4><i class="fa-solid fa-diagram-project" style="color: #8a8f96;"></i> Modelos Vinculados Directamente (${connectedNodes.length})</h4>
        <div class="connected-pill-list">
          ${connectedHtml}
        </div>
      </div>
    `;

    drawerBody.querySelectorAll(".connected-pill").forEach(el => {
      el.addEventListener("click", () => {
        const targetId = el.getAttribute("data-target");
        const targetNode = nodeMap.get(targetId);
        if (targetNode) {
          selectNode(targetNode);
          focusNode(targetNode);
        }
      });
    });

    infoDrawer.classList.add("open");
  }

  function closeDrawer() {
    selectedNodeId = null;
    infoDrawer.classList.remove("open");
    resetHighlight();
  }

  drawerClose.addEventListener("click", closeDrawer);
  svg.on("click", () => {
    closeDrawer();
  });

  // --- 12. ZOOM & PAN BEHAVIOR ---
  const zoomBehavior = d3.zoom()
    .scaleExtent([0.35, 3.5])
    .on("zoom", (ev) => {
      root.attr("transform", ev.transform);
    });

  svg.call(zoomBehavior);

  function resetZoom() {
    const scale = Math.min(width / VB_SIZE, height / VB_SIZE) * 1.12;
    const tx = (width - VB_SIZE * scale) / 2;
    const ty = (height - VB_SIZE * scale) / 2;

    svg.transition().duration(500).call(
      zoomBehavior.transform,
      d3.zoomIdentity.translate(tx, ty).scale(scale)
    );
  }

  function focusNode(node) {
    const scale = 1.35;
    const tx = width / 2 - node.x * scale;
    const ty = height / 2 - node.y * scale;

    svg.transition().duration(550).call(
      zoomBehavior.transform,
      d3.zoomIdentity.translate(tx, ty).scale(scale)
    );
  }

  document.getElementById("zoomIn").addEventListener("click", () => {
    svg.transition().duration(250).call(zoomBehavior.scaleBy, 1.3);
  });
  document.getElementById("zoomOut").addEventListener("click", () => {
    svg.transition().duration(250).call(zoomBehavior.scaleBy, 1 / 1.3);
  });
  document.getElementById("zoomReset").addEventListener("click", resetZoom);

  // --- 13. RESTABLECER POSICIONES ORIGINALES ---
  document.getElementById("resetLayoutBtn").addEventListener("click", () => {
    NODES_DATA.forEach(n => {
      n.x = n.origX;
      n.y = n.origY;
    });

    nodeElements.transition().duration(600).ease(d3.easeCubicOut)
      .attr("transform", d => `translate(${d.x}, ${d.y})`);

    linkElements.transition().duration(600).ease(d3.easeCubicOut)
      .attr("d", linkPath);

    resetZoom();
  });

  // --- 14. FILTRADO POR CHIPS DE MACROMODELOS ---
  const chips = document.querySelectorAll(".macro-chip");
  let activeMacroFilter = "all";

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeMacroFilter = chip.getAttribute("data-macro");
      applyMacroFilter();
    });
  });

  function applyMacroFilter() {
    if (activeMacroFilter === "all") {
      nodeElements.classed("dimmed", false);
      linkElements.classed("dimmed", false);
      clusterLayer.selectAll(".macro-cluster-path").style("opacity", 1);
      return;
    }

    nodeElements.classed("dimmed", d => d.macro !== activeMacroFilter);
    linkElements.classed("dimmed", l => l.source.macro !== activeMacroFilter || l.target.macro !== activeMacroFilter);

    clusterLayer.selectAll(".macro-cluster-path").style("opacity", function () {
      const parent = this.parentNode;
      const cId = parent.getAttribute("data-cluster");
      return cId === activeMacroFilter ? 1 : 0.25;
    });
  }

  // --- 15. BÚSQUEDA EN TIEMPO REAL ---
  const searchInput = document.getElementById("modelSearch");
  searchInput.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
      applyMacroFilter();
      return;
    }

    nodeElements.classed("dimmed", d => {
      const matchName = d.name.toLowerCase().includes(q);
      const matchDesc = (d.desc || "").toLowerCase().includes(q);
      const matchIn = (d.inputs || []).some(x => x.toLowerCase().includes(q));
      const matchOut = (d.outputs || []).some(x => x.toLowerCase().includes(q));
      return !(matchName || matchDesc || matchIn || matchOut);
    });

    linkElements.classed("dimmed", l => {
      const sMatch = l.source.name.toLowerCase().includes(q);
      const tMatch = l.target.name.toLowerCase().includes(q);
      return !(sMatch || tMatch);
    });
  });

  // --- 16. SIMULACIÓN DE FLUJOS (PARTICLE ANIMATION) ---
  const simFlowBtn = document.getElementById("simFlowBtn");
  let isSimulating = true;
  let animFrameId = null;
  const particles = [];

  resolvedLinks.forEach((link, idx) => {
    for (let k = 0; k < 2; k++) {
      particles.push({
        link: link,
        t: ((idx * 2 + k) * 0.23) % 1,
        speed: 0.006 + ((idx + k) % 4) * 0.002,
        r: 3 + ((idx + k) % 3) * 0.7
      });
    }
  });

  const particleCircles = particleLayer.selectAll(".link-particle")
    .data(particles)
    .join("circle")
    .attr("class", "link-particle active")
    .attr("r", d => d.r);

  function animateParticles(now) {
    const tSec = (now || performance.now()) / 1000;
    // Deriva suave: cada nodo flota alrededor de su posicion (la red "respira")
    NODES_DATA.forEach((n, i) => {
      const a = 2.2 + (i % 4) * 0.9;
      n._px = n.x + Math.sin(tSec * (0.35 + (i % 5) * 0.07) + i * 1.7) * a;
      n._py = n.y + Math.cos(tSec * (0.30 + (i % 3) * 0.09) + i * 2.3) * a;
    });
    nodeElements.attr("transform", d => `translate(${d._px}, ${d._py})`);
    linkElements.attr("d", linkPath);
    particles.forEach(p => {
      p.t += p.speed;
      if (p.t > 1) p.t = 0;

      const sx = p.link.source._px ?? p.link.source.x, sy = p.link.source._py ?? p.link.source.y;
      const tx = p.link.target._px ?? p.link.target.x, ty = p.link.target._py ?? p.link.target.y;
      const dx = tx - sx, dy = ty - sy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const curvature = Math.min(22, dist * 0.08);
      const mx = (sx + tx) / 2 - (dy / dist) * curvature;
      const my = (sy + ty) / 2 + (dx / dist) * curvature;

      const t = p.t;
      const invT = 1 - t;
      p.x = invT * invT * sx + 2 * invT * t * mx + t * t * tx;
      p.y = invT * invT * sy + 2 * invT * t * my + t * t * ty;
    });

    particleCircles
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    if (isSimulating) {
      animFrameId = requestAnimationFrame(animateParticles);
    }
  }

  simFlowBtn.addEventListener("click", () => {
    isSimulating = !isSimulating;
    if (isSimulating) {
      simFlowBtn.classList.add("active");
      simFlowBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Detener Flujos';
      particleCircles.classed("active", true);
      animateParticles();
    } else {
      simFlowBtn.classList.remove("active");
      simFlowBtn.innerHTML = '<i class="fa-solid fa-play"></i> Simular Flujos';
      particleCircles.classed("active", false);
      if (animFrameId) cancelAnimationFrame(animFrameId);
    }
  });

  // --- 17. RESPONSIVE RESIZE ---
  window.addEventListener("resize", () => {
    width = mainContainer.clientWidth || window.innerWidth;
    height = mainContainer.clientHeight || window.innerHeight;
    svg.attr("width", width).attr("height", height);
  });

  // --- 18. ARRANQUE INICIAL ---
  drawBackgroundStructures();
  drawLinks();
  drawNodes();
  resetZoom();

  // Flujo activo desde el arranque: la red se ve viva sin pulsar nada.
  // Arranca cuando termina la entrada para no pelear con la animacion inicial.
  simFlowBtn.classList.add("active");
  simFlowBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Detener Flujos';
  setTimeout(animateParticles, 3500);

})();
