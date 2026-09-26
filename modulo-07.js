(() => {
  "use strict";
  const start = (fn) =>
    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", fn, { once: true })
      : fn();
  start(() => {
    const $ = (s, r = document) => r.querySelector(s),
      $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const toast = (text) => {
      let e = $("#dashboardToast");
      if (!e) {
        e = document.createElement("div");
        e.id = "dashboardToast";
        e.className = "dashboard-toast";
        document.body.appendChild(e);
      }
      e.textContent = text;
      e.classList.add("show");
      clearTimeout(toast.t);
      toast.t = setTimeout(() => e.classList.remove("show"), 2400);
    };
    const show = (e) => e && e.classList.remove("hidden"),
      hide = (e) => e && e.classList.add("hidden"),
      esc = (v) =>
        String(v)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;"),
      clean = (v) => String(v).replaceAll("\\n", " ");
    const networks = {
      "30min": {
        title: "Ciudad de los 30 minutos",
        subtitle:
          "Modo analítico // Nodos de proximidad, cuidado e infraestructura",
        count: "14 nodos · 22 conexiones",
        text: "La red explica cómo las 33 Unidades de Planeamiento Local articulan la proximidad: servicios de cuidado, salud, educación, vivienda, empleo, espacio público y transporte deben quedar accesibles en un máximo de 30 minutos caminando, en bicicleta o en transporte público. Los 160 Proyectos Integrales de Proximidad convierten esta meta en intervenciones construidas con la ciudadanía. Fuente base: Secretaría Distrital de Planeación, noticia ¡La ciudad de los 30 minutos se consolida en Bogotá!, 29 de noviembre de 2023.",
        nodes: [
          ["33 Unidades de Planeamiento Local", 390, 230, 58, "central", "⌖"],
          ["Manzanas\\ndel Cuidado", 145, 105, 42, "", "♥"],
          ["Centros\\nde salud", 160, 350, 37, "", "✚"],
          ["Jardines\\ninfantiles", 355, 82, 38, "", "✚"],
          ["Colegios y\\nuniversidades", 605, 94, 40, "", "▦"],
          ["Transporte\\npúblico", 635, 290, 45, "", "▣"],
          ["Empleo\\nformal", 425, 390, 40, "", "▤"],
          ["Meta: acceso\\nen 30 minutos", 720, 215, 42, "result", "↗"],
          ["Vivienda\\ndigna VIS/VIP", 185, 225, 35, "", "⌂"],
          ["Cuidado\\ncomunitario", 315, 340, 36, "", "♥"],
          ["Equipamientos\\nsociales", 520, 335, 38, "", "▥"],
          ["Actividades\\nde ocio y cultura", 590, 410, 32, "", "▤"],
          ["Tiempo máximo\\nde acceso: 30 min", 90, 245, 34, "", "◷"],
          ["Redes peatonales\\ny bicicleta", 465, 115, 33, "", "⌁"],
        ],
        edges: [
          [0, 1, "direct"],
          [0, 2, "support"],
          [0, 3, "direct"],
          [0, 4, "direct"],
          [0, 5, "support"],
          [0, 6, "direct"],
          [0, 7, "result"],
          [0, 8, "direct"],
          [0, 9, "support"],
          [0, 10, "direct"],
          [0, 11, "indirect"],
          [0, 12, "indirect"],
          [0, 13, "support"],
          [1, 9, "direct"],
          [2, 10, "direct"],
          [3, 4, "indirect"],
          [5, 6, "direct"],
          [5, 13, "support"],
          [8, 12, "indirect"],
          [9, 10, "direct"],
          [10, 11, "direct"],
          [6, 7, "result"],
        ],
      },
      empleo: {
        title: "Productividad y empleo",
        subtitle: "Modo analítico // Actores, UPL y economía territorial",
        count: "14 nodos · 22 conexiones",
        text: "La red representa la apuesta del POT por una ciudad menos segregada y con productividad descentralizada. Conecta sectores productivos, servicios metropolitanos, incentivos urbanísticos y económicos, equipamientos públicos, transporte, vivienda y mejoramiento de barrios para acercar el empleo a las zonas deficitarias. El archivo oficial destaca la localización de actividades productivas en Rafael Uribe Uribe, Tunjuelito, Ciudad Bolívar y Bosa, así como el uso flexible del suelo y la adaptación del POT a los barrios populares.",
        nodes: [
          ["Empleo formal y\\nproductividad", 390, 230, 58, "central", "▥"],
          ["Sectores\\nproductivos", 135, 100, 42, "result", "↗"],
          ["Zonas deficitarias\\nde empleo", 125, 350, 38, "", "⌖"],
          ["Zonas superavitarias\\nde empleo", 390, 80, 38, "", "▥"],
          ["Descentralización\\nde oportunidades", 650, 100, 42, "support", "⌖"],
          ["Servicios\\nmetropolitanos", 660, 330, 42, "", "◈"],
          ["Vivienda y\\nsoportes urbanos", 390, 410, 36, "", "⌂"],
          ["Transporte\\ny bicicleta", 175, 225, 36, "", "▣"],
          ["Industrias creativas\\ny del conocimiento", 700, 220, 36, "", "⇄"],
          ["Industrias\\nverdes", 205, 470, 32, "", "♙"],
          ["Equipamientos\\npúblicos", 535, 455, 35, "", "▦"],
          ["Manzanas del Cuidado\\ncerca del transporte", 70, 220, 33, "", "▤"],
          ["Empresas e\\nindustria", 550, 195, 39, "", "◉"],
          ["Reubicación de\\nactividades productivas", 700, 450, 35, "", "◆"],
        ],
        edges: [
          [0, 1, "result"],
          [0, 2, "direct"],
          [0, 3, "direct"],
          [0, 4, "support"],
          [0, 5, "direct"],
          [0, 6, "direct"],
          [0, 7, "indirect"],
          [0, 8, "support"],
          [0, 9, "direct"],
          [0, 10, "direct"],
          [0, 11, "indirect"],
          [0, 12, "direct"],
          [0, 13, "support"],
          [2, 4, "indirect"],
          [5, 6, "direct"],
          [5, 12, "direct"],
          [7, 8, "indirect"],
          [9, 10, "direct"],
          [3, 12, "direct"],
          [1, 13, "result"],
          [6, 10, "support"],
        ],
      },
      carbono: {
        title: "Descarbonización de la movilidad",
        subtitle:
          "Modo analítico // Infraestructura limpia, emisiones y transición",
        count: "14 nodos · 23 conexiones",
        text: "La red representa la hoja de ruta del POT para descarbonizar la movilidad: una red férrea urbana y regional con Metro y Regiotram, seis cables aéreos, corredores verdes, red peatonal, bicicleta y transporte público eléctrico. También incorpora carga a gas, salida progresiva del diésel, construcción sostenible, separación de residuos y localización de actividades cerca del transporte para reducir desplazamientos. El archivo oficial fija metas de 11 corredores de alta capacidad, 218 km de red peatonal mejorada, 564 km de infraestructura ciclista y una reducción del 50% de las emisiones de gases de efecto invernadero.",
        nodes: [
          ["Viajes\\nlimpios", 390, 230, 58, "central", "⌁"],
          ["Red férrea\\nurbana y regional", 110, 90, 38, "support", "▣"],
          ["Cuatro líneas\\nde Metro", 350, 70, 35, "", "▣"],
          ["Regiotram\\nOccidente y Norte", 590, 85, 35, "", "▥"],
          ["Corredores\\nverdes", 670, 315, 42, "support", "♧"],
          ["Red peatonal y\\nmicromovilidad", 390, 430, 45, "support", "♢"],
          ["Transporte público\\neléctrico", 115, 330, 40, "result", "⚡"],
          ["Reducción de\\nemisiones GEI", 390, 125, 38, "layer-red", "◌"],
          ["Calidad del aire\\ny material particulado", 620, 205, 37, "layer-red", "◌"],
          ["Transporte de\\ncarga a gas", 145, 220, 34, "", "⚡"],
          ["Construcción\\nsostenible", 680, 450, 36, "support", "▣"],
          ["Manejo de residuos\\ny separación en fuente", 545, 420, 35, "", "⌂"],
          ["Calles\\ncompletas", 180, 455, 33, "", "▤"],
          ["Peatón como\\nprioridad", 70, 190, 34, "layer-red", "♧"],
        ],
        edges: [
          [0, 1, "support"],
          [0, 2, "direct"],
          [0, 3, "direct"],
          [0, 4, "support"],
          [0, 5, "support"],
          [0, 6, "result"],
          [0, 7, "indirect"],
          [0, 8, "indirect"],
          [0, 9, "direct"],
          [0, 10, "direct"],
          [0, 11, "direct"],
          [0, 12, "support"],
          [0, 13, "indirect"],
          [4, 5, "direct"],
          [1, 2, "indirect"],
          [5, 11, "direct"],
          [6, 9, "direct"],
          [10, 11, "support"],
          [12, 10, "direct"],
          [7, 8, "direct"],
          [8, 13, "result"],
          [2, 3, "indirect"],
        ],
      },
    };
    const expandNetwork = (key, extraNodes, extraEdges) => {
      const item = networks[key];
      const offset = item.nodes.length;
      item._key = key;
      item.edges = item.edges || [];
      item.nodes.push(...extraNodes);
      item.edges.push(
        ...extraEdges.map(([a, b, t]) => [a + offset, b + offset, t]),
      );
      item._categories = item.nodes.map((node) => thematicCategory(key, node[0]));
    };
    expandNetwork(
      "30min",
      [
        ["Tiempo medio de viaje", 70, 70, 30, "", "◷"],
        ["Acceso a servicios", 250, 45, 31, "result", "◉"],
        ["Oferta de cuidado", 505, 45, 30, "", "♥"],
        ["Distancia a salud", 735, 95, 29, "", "↔"],
        ["Cobertura educativa", 735, 185, 30, "", "▦"],
        ["Conectividad peatonal", 70, 390, 30, "", "⌁"],
        ["Calidad del espacio público", 275, 470, 32, "", "⌂"],
        ["Centralidad urbana", 520, 470, 30, "", "◎"],
        ["Población vulnerable", 735, 375, 31, "", "♙"],
        ["Tiempo de cuidado", 70, 485, 28, "", "◷"],
      ],
      [
        [0, 1, "direct"],
        [1, 2, "support"],
        [2, 3, "direct"],
        [3, 4, "indirect"],
        [4, 7, "support"],
        [5, 6, "direct"],
        [6, 7, "indirect"],
        [7, 8, "support"],
        [8, 9, "indirect"],
        [9, 0, "result"],
      ],
    );
    expandNetwork(
      "empleo",
      [
        ["Incentivos urbanísticos\\ny económicos", 70, 70, 31, "result", "↗"],
        ["Transferencia de oportunidades\\ny derechos urbanísticos", 250, 42, 30, "", "▤"],
        ["Uso flexible\\ndel suelo", 505, 42, 30, "", "✓"],
        ["Acceso territorial\\nal empleo", 735, 85, 31, "", "◎"],
        ["Economía del\\ncuidado", 735, 175, 30, "", "♥"],
        ["Educación\\nsuperior", 70, 395, 31, "", "▦"],
        ["Industrias del\\nconocimiento", 260, 470, 30, "", "✦"],
        ["Mejoramiento de\\nbarrios populares", 500, 470, 31, "support", "▥"],
        ["Acupuntura urbana\\ny urbanismo táctico", 735, 370, 33, "", "⇄"],
        ["Participación\\nterritorial", 70, 475, 29, "", "♙"],
      ],
      [
        [0, 1, "direct"],
        [1, 2, "direct"],
        [2, 3, "result"],
        [3, 4, "support"],
        [4, 9, "indirect"],
        [5, 6, "direct"],
        [6, 7, "support"],
        [7, 8, "direct"],
        [8, 9, "indirect"],
        [9, 0, "result"],
      ],
    );
    expandNetwork(
      "carbono",
      [
        ["Sistemas de alta\\ncapacidad", 70, 70, 31, "", "⇄"],
        ["Intermodalidad", 250, 42, 31, "", "◌"],
        ["Flota sin\\ndiésel", 505, 42, 32, "layer-red", "◌"],
        ["Corredores verdes\\narborizados", 735, 90, 30, "layer-red", "◌"],
        ["Andenes, plazas\\ny parques conectados", 735, 180, 32, "layer-red", "♧"],
        ["Infraestructura\\nde carga", 70, 395, 31, "result", "⚡"],
        ["Disminución del\\nvehículo particular", 260, 470, 31, "", "▣"],
        ["Actividades y servicios\\ncerca del transporte", 500, 470, 31, "support", "↗"],
        ["Conexión regional\\nSabana y Soacha", 735, 365, 30, "", "◷"],
        ["Salud ambiental", 70, 475, 31, "layer-red", "♥"],
      ],
      [
        [0, 1, "direct"],
        [1, 2, "direct"],
        [2, 3, "result"],
        [3, 4, "support"],
        [4, 9, "result"],
        [5, 6, "support"],
        [6, 7, "direct"],
        [7, 8, "direct"],
        [8, 0, "indirect"],
        [9, 5, "result"],
      ],
    );
    const fillTo30 = (key, labels) => {
      const item = networks[key],
        canonical = (value) =>
          clean(value).toLowerCase().replace(/\s+/g, " ").trim(),
        seen = new Map(),
        remap = [];
      item.nodes.forEach((node, index) => {
        const id = canonical(node[0]);
        if (seen.has(id)) remap[index] = seen.get(id);
        else {
          seen.set(id, item.nodes.length ? [...seen.values()].length : 0);
          remap[index] = seen.get(id);
        }
      });
      if (seen.size !== item.nodes.length) {
        const uniqueNodes = [];
        const firstIndex = new Map();
        item.nodes.forEach((node, index) => {
          const id = canonical(node[0]);
          if (!firstIndex.has(id)) {
            firstIndex.set(id, uniqueNodes.length);
            uniqueNodes.push(node);
          }
          remap[index] = firstIndex.get(id);
        });
        const uniqueEdges = [],
          edgeKeys = new Set();
        item.edges.forEach(([a, b, type]) => {
          const edge = [remap[a], remap[b], type],
            key = `${edge[0]}-${edge[1]}-${edge[2]}`;
          if (edge[0] !== edge[1] && !edgeKeys.has(key)) {
            edgeKeys.add(key);
            uniqueEdges.push(edge);
          }
        });
        item.nodes = uniqueNodes;
        item.edges = uniqueEdges;
      }
      const need = Math.max(0, 30 - item.nodes.length),
        offset = item.nodes.length,
        used = new Set(item.nodes.map((node) => canonical(node[0])));
      for (let i = 0; i < need; i++) {
        const base = labels[i % labels.length];
        let label = base,
          suffix = 2;
        while (used.has(canonical(label)))
          label = `${base} · componente ${suffix++}`;
        used.add(canonical(label));
        const col = i % 6,
          row = Math.floor(i / 6);
        item.nodes.push([label, 70 + col * 210, 70 + row * 86, 25, "", ""]);
        const target = i % 4 === 0 ? 0 : offset + i - 1;
        item.edges.push([
          target,
          offset + i,
          i % 5 === 0 ? "support" : i % 3 === 0 ? "indirect" : "direct",
        ]);
      }
      item._categories = item.nodes.map((node) => thematicCategory(key, node[0]));
    };
    const removeNodeByLabel = (key, matcher) => {
      const item = networks[key];
      const removed = item.nodes.findIndex((node) => matcher.test(clean(node[0])));
      if (removed < 0) return;
      const remap = new Map();
      item.nodes = item.nodes.filter((_, index) => {
        if (index === removed) return false;
        remap.set(index, remap.size);
        return true;
      });
      item.edges = item.edges
        .filter(([a, b]) => a !== removed && b !== removed)
        .map(([a, b, type]) => [remap.get(a), remap.get(b), type]);
      item._categories = item.nodes.map((node) => thematicCategory(key, node[0]));
    };
    removeNodeByLabel("30min", /^(33 Unidades de Planeamiento Local|Empleo formal)$/);
    removeNodeByLabel("empleo", /^(Empleo formal y productividad|Productividad por trabajador)/);
    removeNodeByLabel("carbono", /^Viajes limpios$/);

    const removeAllNodesByLabel = (key, matcher) => {
      let found = true;
      while (found) {
        const before = networks[key].nodes.length;
        removeNodeByLabel(key, matcher);
        found = networks[key].nodes.length < before;
      }
    };

    fillTo30("30min", [
      "160 Proyectos Integrales de Proximidad",
      "Redes peatonales y ciclistas",
      "UPL Occidente: Fontibón y Engativá",
      "UPL Centro Ampliado: Chapinero y Teusaquillo",
      "UPL Suroccidente: Bosa y Kennedy",
      "UPL Rural: Cerros, Tunjuelo y Sumapaz",
    ]);
    /* Depuración semántica: “Equipamientos sociales” es un nodo paraguas
       redundante cuando la red ya contiene colegios, universidades, jardines,
       centros de salud y demás equipamientos específicos. Se elimina después
       de completar el dataset para no generar nodos artificiales duplicados. */
    [
      /^Equipamientos\s+sociales$/,
      /^Meta:\s+acceso\s+en\s+30\s+minutos$/,
      /^Tiempo\s+máximo\s+de\s+acceso:\s+30\s+min$/,
      /^Tiempo\s+medio\s+de\s+viaje$/,
      /^Acceso\s+a\s+servicios$/,
      /^Oferta\s+de\s+cuidado$/,
      /^Distancia\s+a\s+salud$/,
      /^Cobertura\s+educativa$/,
      /^Conectividad\s+peatonal$/,
      /^Calidad\s+del\s+espacio\s+público$/,
      /^Centralidad\s+urbana$/,
      /^Población\s+vulnerable$/,
      /^Tiempo\s+de\s+cuidado$/,
      /^160\s+Proyectos\s+Integrales\s+de\s+Proximidad/,
      /^Redes\s+peatonales\s+y\s+bicicleta$/,
      /^Red\s+peatonal\s+y\s+bicicleta$/,
    ].forEach((matcher) => removeAllNodesByLabel("30min", matcher));
    fillTo30("empleo", [
      "Meta regional: 40% del PIB",
      "Sectores productivos en zonas deficitarias",
      "Actividad productiva en Bosa y Ciudad Bolívar",
      "Actividad productiva en Rafael Uribe y Tunjuelito",
      "Equipamientos sin restricción de uso del suelo",
      "Tiempo de desplazamiento al trabajo",
      "Productividad por trabajador · COP",
      "Empresas activas · #",
      "Nuevas empresas · #",
      "Cierre de empresas · #",
      "Vacantes · #",
      "Formación técnica · #",
      "Graduados · #",
      "Inserción laboral · %",
      "Innovación · índice",
      "Patentes · #",
      "Inversión privada · COP",
      "Inversión pública · COP",
      "UPL con déficit · 23",
      "UPL con superávit · 10",
      "Centralidad económica · índice",
      "Acceso a transporte · %",
      "Costo de transporte · COP",
      "Tiempo al empleo · min",
      "Vivienda cerca del empleo · %",
      "Suelo productivo · ha",
      "Suelo mixto · ha",
      "Comercio local · #",
      "Servicios empresariales · #",
      "Cadenas productivas · #",
      "Economía del cuidado · #",
      "Población activa · #",
      "Población ocupada · #",
      "Población desempleada · #",
      "Migración laboral · %",
      "Productividad territorial · índice",
    ]);
    fillTo30("carbono", [
      "11 corredores de alta capacidad",
      "218 km de red peatonal mejorada",
      "564 km de infraestructura para bicicleta",
      "Seis cables aéreos nuevos",
      "Dos Regiotram regionales",
      "Meta: reducir 50% las emisiones GEI",
    ]);
    // Limpieza final después de completar cada dataset: evita reinsertar agregadores.
    removeNodeByLabel("30min", /^(33 Unidades de Planeamiento Local|Empleo formal)$/);
    removeNodeByLabel("empleo", /^(Empleo formal y productividad|Productividad por trabajador)/);
    removeNodeByLabel("carbono", /^Viajes limpios$/);

    /* Depuración categorial de las dos redes restantes:
       se conservan entidades, infraestructuras y actividades concretas;
       se retiran hubs abstractos, metas, indicadores, cifras y capas de resultado. */
    const abstractEmployment = [
      /Empleo formal y\s+productividad/,
      /Descentralización de oportunidades/,
      /Servicios metropolitanos/,
      /Vivienda y\s+soportes urbanos/,
      /Equipamientos públicos/,
      /Empresas e\s+industria/,
      /Reubicación de\s+actividades productivas/,
      /Incentivos urbanísticos\s+y\s+económicos/,
      /Transferencia de oportunidades\s+y\s+derechos urbanísticos/,
      /^Uso flexible del suelo$/,
      /Acceso territorial\s+al empleo/,
      /Acupuntura urbana\s+y\s+urbanismo táctico/,
      /^Participación territorial$/,
      /Equipamientos sin restricción de uso del suelo/,
      /^(Meta regional|Tiempo de desplazamiento|Productividad por trabajador|Empresas activas|Nuevas empresas|Cierre de empresas|Vacantes|Formación técnica|Graduados|Inserción laboral|Innovación|Patentes|Inversión privada|Inversión pública|UPL con déficit|UPL con superávit|Centralidad económica|Acceso a transporte|Costo de transporte|Tiempo al empleo|Vivienda cerca del empleo|Suelo productivo|Suelo mixto|Comercio local|Servicios empresariales|Cadenas productivas|Economía del cuidado|Población activa|Población ocupada|Población desempleada|Migración laboral|Productividad territorial)/,
    ];
    const abstractCarbon = [
      /Viajes limpios/,
      /Reducción de\s+emisiones GEI/,
      /Calidad del aire\s+y\s+material particulado/,
      /Peatón como\s+prioridad/,
      /Disminución del\s+vehículo particular/,
      /^Salud ambiental$/,
      /^Sistemas de alta\s+capacidad$/,
      /^Intermodalidad$/,
      /^Flota sin\s+diésel$/,
      /^Actividades y servicios\s+cerca del transporte$/,
      /^Seis cables aéreos nuevos$/,
      /^Dos Regiotram regionales$/,
      /^Meta:/,
      /\b\d+\s*(?:km|corredores|cables|Regiotram)/,
    ];
    abstractEmployment.forEach((matcher) => removeAllNodesByLabel("empleo", matcher));
    abstractCarbon.forEach((matcher) => removeAllNodesByLabel("carbono", matcher));

    const mergeNodesByLabel = (key, primaryMatcher, duplicateMatchers) => {
      const item = networks[key];
      const primary = item.nodes.findIndex((node) => primaryMatcher.test(clean(node[0])));
      if (primary < 0) return;
      const duplicates = item.nodes
        .map((node, index) => ({ index, label: clean(node[0]) }))
        .filter(({ index, label }) => index !== primary && duplicateMatchers.some((matcher) => matcher.test(label)))
        .map(({ index }) => index);
      if (!duplicates.length) return;
      const duplicateSet = new Set(duplicates);
      const oldToNew = new Map();
      const kept = [];
      item.nodes.forEach((node, index) => {
        if (duplicateSet.has(index)) return;
        oldToNew.set(index, kept.length);
        kept.push(node);
      });
      const primaryNew = oldToNew.get(primary);
      duplicates.forEach((index) => oldToNew.set(index, primaryNew));
      const edgeKeys = new Set();
      item.edges = item.edges
        .map(([a, b, type]) => [oldToNew.get(a), oldToNew.get(b), type])
        .filter(([a, b, type]) => a !== b && Number.isInteger(a) && Number.isInteger(b) && !edgeKeys.has(`${a}-${b}-${type}`))
        .filter(([a, b, type]) => {
          const keyName = `${a}-${b}-${type}`;
          if (edgeKeys.has(keyName)) return false;
          edgeKeys.add(keyName);
          return true;
        });
      item.nodes = kept;
      item._categories = item.nodes.map((node) => thematicCategory(key, node[0]));
    };

    mergeNodesByLabel("carbono", /^Red férrea\s+urbana y regional$/, [
      /^Cuatro líneas\s+de Metro$/,
      /^Regiotram\s+Occidente y Norte$/,
    ]);
    mergeNodesByLabel("carbono", /^Corredores verdes$/, [
      /^Corredores verdes arborizados$/,
      /^Andenes, plazas y parques conectados$/,
    ]);

    const layer = (label) => {
      const s = label.toLowerCase();
      if (
        /río|humedal|ecosistema|emisiones|pm fino|aire|corredor verde|área protegida|parques ecológicos/.test(
          s,
        )
      )
        return "layer-red";
      if (
        /metro|regiotram|férrea|alta capacidad|cable|transporte|peatonal|micromovilidad|intermodalidad|hospital|centro|colegio|ciclorruta|carga|taxis|flota pública|vehículos|eléctrico/.test(
          s,
        )
      )
        return "layer-warm";
      return "layer-green";
    };
    const layerColor = (layerName) => ({
      "layer-red": "#ef6f6f",
      "layer-warm": "#e89a6c",
      "layer-green": "#46d6d0",
    }[layerName] || "#46d6d0");
    const edgeColor = {
      direct: "#d7dae2",
      indirect: "#8b93a8",
      support: "#f5a623",
      result: "#d9824e",
    };
    const thematicCatalog = {
      "30min": [
        { id: "care-health", label: "Cuidado y salud", color: "#2fd4c8" },
        { id: "education", label: "Educación y equipamientos", color: "#e89a6c" },
        { id: "mobility", label: "Movilidad y proximidad", color: "#ef9552" },
        { id: "housing-employment", label: "Vivienda y empleo", color: "#a276f2" },
        { id: "access-goals", label: "Acceso y metas", color: "#f5c945" },
      ],
      empleo: [
        { id: "economic-activity", label: "Actividad económica", color: "#ef9552" },
        { id: "human-capital", label: "Capital humano", color: "#e89a6c" },
        { id: "labor-mobility", label: "Movilidad laboral", color: "#2fd4c8" },
        { id: "territorial-equity", label: "Equidad territorial", color: "#a276f2" },
        { id: "employment-results", label: "Resultados de empleo", color: "#f5c945" },
      ],
      carbono: [
        { id: "clean-transit", label: "Transporte limpio", color: "#2fd4c8" },
        { id: "clean-infrastructure", label: "Infraestructura limpia", color: "#e89a6c" },
        { id: "emissions-air", label: "Emisiones y aire", color: "#ef9552" },
        { id: "modal-change", label: "Cambio modal", color: "#a276f2" },
        { id: "environmental-health", label: "Salud ambiental", color: "#f5c945" },
      ],
    };
    function thematicCategory(key, label) {
      const s = clean(label).toLowerCase();
      if (key === "30min") {
        if (/cuidado|salud|hospital/.test(s)) return "care-health";
        if (/colegio|educación|equipamiento/.test(s)) return "education";
        if (/transporte|peatonal|viaje|distancia|tiempo|conectividad/.test(s)) return "mobility";
        if (/vivienda|empleo|comercio/.test(s)) return "housing-employment";
        return "access-goals";
      }
      if (key === "empleo") {
        if (/empresa|actividad|productividad|innovación|inversión|comercio|sectores productivos|servicios metropolitanos|industrias|reubicación/.test(s)) return "economic-activity";
        if (/educación|formación|graduados|salario|capital|patentes|conocimiento/.test(s)) return "human-capital";
        if (/transporte|movilidad|tiempo|acceso|vivienda|equipamientos|manzanas del cuidado|uso flexible/.test(s)) return "labor-mobility";
        if (/upl|segregación|género|participación|territorial|incentivos|transferencia|deficitarias|superavitarias|barrios populares|bosa|ciudad bolívar|rafael uribe|tunjuelito/.test(s)) return "territorial-equity";
        return "employment-results";
      }
      if (/emisiones|gei|pm|aire|salud respiratoria/.test(s)) return /salud/.test(s) ? "environmental-health" : "emissions-air";
      if (/metro|regiotram|cable|ciclorruta|transporte|flota|taxis|viajes/.test(s)) return "clean-transit";
      if (/carga|electrificación|infraestructura|corredor/.test(s)) return "clean-infrastructure";
      if (/cambio modal|demanda|combustible|velocidad/.test(s)) return "modal-change";
      return "environmental-health";
    }
    const quantify = (label) => {
      const q = {
        "UPL · 33": "UPL\n33 unidades",
        "33 Unidades de Planeamiento Local": "UPL\n33 unidades",
        "160 Proyectos Integrales de Proximidad": "160 PIP",
        "Redes peatonales y ciclistas": "Red peatonal\ny bicicleta",
        "Espacio público local reverdecido": "Espacio público\nreverdecido",
        "Vivienda VIS y VIP": "Vivienda\nVIS/VIP",
        "Empleo formal cercano": "Empleo formal\ncercano",
        "UPL Occidente: Fontibón y Engativá": "Occidente\nFontibón · Engativá",
        "UPL Centro Ampliado: Chapinero y Teusaquillo": "Centro ampliado\nChapinero · Teusaquillo",
        "UPL Suroccidente: Bosa y Kennedy": "Suroccidente\nBosa · Kennedy",
        "UPL Rural: Cerros, Tunjuelo y Sumapaz": "Rural\nCerros · Tunjuelo · Sumapaz",
        "Manzanas\\ndel Cuidado": "Manzanas\ndel Cuidado",
        "Centros\\nde salud": "Centros\nde salud",
        "Jardines\\ninfantiles": "Jardines\ninfantiles",
        "Colegios y\\nuniversidades": "Colegios y\nuniversidades",
        "Tiempo máximo\\nde acceso: 30 min": "Acceso máximo\n30 minutos",
        "Meta: acceso\\nen 30 minutos": "Meta: acceso\n30 minutos",
        "910.509\\nnuevos empleos": "Empleo\n910.509",
        "10 / 33 UPL\\nsuperávit": "Superávit\n10/33 UPL",
        "13 UPL\\nperiféricas": "Periferia\n13 UPL",
        "47% GEI\\ntransporte": "GEI\n47% transporte",
        "18% PM\\nfino": "PM fino\n18% transporte",
        "Viajes\\nlimpios 77%": "Viajes limpios\n77% · 2035",
        "Flota pública\\n2040": "Flota eléctrica\n100% · 2040",
        "5 líneas\\nde Metro": "Metro\n5 líneas",
        "1.000 km\\nciclorrutas": "Ciclorrutas\n1.000 km",
      };
      return q[label] || label;
    };
    const layoutNetwork = (item) => {
      const degree = item.nodes.map((_, i) => item.edges.reduce((n, [a, b]) => n + (a === i || b === i ? 1 : 0), 0));
      const centerByCategory = {
        "care-health": [165,235],
        "education": [470,175],
        "mobility": [790,235],
        "housing-employment": [220,610],
        "access-goals": [665,620],
        "economic-activity": [165,220],
        "human-capital": [470,175],
        "labor-mobility": [790,220],
        "territorial-equity": [220,650],
        "employment-results": [665,650],
        "emissions-air": [165,220],
        "clean-transit": [470,175],
        "clean-infrastructure": [790,220],
        "modal-change": [220,650],
        "environmental-health": [665,650],
      };
      const fallbackCenters = [[165,235],[470,175],[790,235],[220,610],[665,620],[470,420]];
      const categoryIds = [...new Set(item._categories || [])];
      const groups = categoryIds.map((category, categoryIndex) => ({
        category,
        nodes: item.nodes.map((_, index) => index).filter((index) => item._categories[index] === category).sort((a, b) => degree[b] - degree[a]),
        center: centerByCategory[category] || fallbackCenters[categoryIndex % fallbackCenters.length],
      })).filter((group) => group.nodes.length);
      const radiusFor = (d) => d <= 2 ? 52 : d <= 4 ? 64 : d <= 6 ? 76 : d <= 9 ? 90 : 104;
      item._centralIndices = groups.map((group) => group.nodes[0]);
      groups.forEach((group) => {
        const [cx, cy] = group.center;
        const hubIndex = group.nodes[0];
        const hub = item.nodes[hubIndex];
        hub[1] = cx; hub[2] = cy; hub[3] = radiusFor(degree[hubIndex]); hub._layoutHub = true;
        const rest = group.nodes.slice(1);
        const outward = Math.atan2(cy - 450, cx - 700) || 0;
        const span = Math.min(1.45, .72 + rest.length * .13);
        const rings = [
          rest.filter((index) => degree[index] >= 4),
          rest.filter((index) => degree[index] >= 2 && degree[index] < 4),
          rest.filter((index) => degree[index] < 2),
        ].filter((ring) => ring.length);
        rings.forEach((ring, ringIndex) => {
          const radius = 155 + ringIndex * 125;
          ring.forEach((nodeIndex, position) => {
            // Variación determinista: rompe la simetría sin producir saltos entre recargas.
            const seed = (nodeIndex * 47 + ringIndex * 71 + position * 29 + categoryIds.indexOf(group.category) * 113) % 997;
            const jitter = seed / 997 - .5;
            const angle = outward - span / 2 + ((position + .5) / ring.length) * span + jitter * .22;
            const radiusJitter = jitter * 42 + ((position % 3) - 1) * 12;
            const tangent = jitter * 34;
            const node = item.nodes[nodeIndex];
            node[1] = cx + Math.cos(angle) * (radius + radiusJitter) - Math.sin(angle) * tangent;
            node[2] = cy + Math.sin(angle) * (radius + radiusJitter) * .82 + Math.cos(angle) * tangent * .72;
            node[3] = radiusFor(degree[nodeIndex]);
            node._layoutHub = false;
          });
        });
      });
      for (let pass = 0; pass < 150; pass++) {
        let moved = false;
        for (let i = 0; i < item.nodes.length; i++) for (let j = i + 1; j < item.nodes.length; j++) {
          const A = item.nodes[i], B = item.nodes[j];
          const dx = B[1] - A[1], dy = B[2] - A[2], dist = Math.hypot(dx, dy) || 1;
          const min = A[3] + B[3] + 42;
          if (dist >= min) continue;
          const ux = dx / dist, uy = dy / dist, push = (min - dist) / 2;
          if (!A._layoutHub) { A[1] -= ux * push; A[2] -= uy * push; }
          if (!B._layoutHub) { B[1] += ux * push; B[2] += uy * push; }
          moved = true;
        }
        item.nodes.forEach((node) => {
          node[1] = Math.max(50, Math.min(980, node[1]));
          node[2] = Math.max(50, Math.min(830, node[2]));
        });
        if (!moved) break;
      }
      item.nodes.forEach((node) => { delete node._layoutHub; });
    };
    const lines = (item) => item.edges.map(([a, b, t], i) => {
      const A = item.nodes[a], B = item.nodes[b];
      const dx = B[1] - A[1], dy = B[2] - A[2], distance = Math.hypot(dx, dy) || 1;
      const ux = dx / distance, uy = dy / distance;
      const startPad = A[3] + 2, endPad = B[3] + 7;
      const x1 = A[1] + ux * startPad, y1 = A[2] + uy * startPad;
      const x2 = B[1] - ux * endPad, y2 = B[2] - uy * endPad;
      const d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
      return `<path class="network-edge ${t}" data-edge-index="${i}" marker-end="url(#arrow-${t})" d="${d}"/><path class="network-edge-hit ${t}" data-edge-index="${i}" data-edge-type="${t}" tabindex="0" d="${d}"/>`;
    }).join("");
    const iconSvg = (label) => {
      const s = label.toLowerCase();
      const icon = /río|quebrada|agua|humedal/.test(s)
        ? "fa-water"
        : /cerro|páramo|montaña|corredor verde|parques ecológicos/.test(s)
          ? "fa-mountain"
          : /área protegida|reserva/.test(s)
            ? "fa-shield-halved"
            : /bosque|vegetal|ecosistema|parque/.test(s)
              ? "fa-tree"
              : /resiliencia|temperatura|emisiones|gei|pm|aire/.test(s)
                ? "fa-temperature-half"
                : /cuidado|manzana|salud|hospital/.test(s)
                  ? "fa-heart"
                  : /colegio|educación|formación|graduados/.test(s)
                    ? "fa-graduation-cap"
                    : /metro|regiotram|cable|transporte|bus|viajes|flota/.test(
                          s,
                        )
                      ? "fa-bus"
                      : /ciclorruta|bicicleta|peatonal/.test(s)
                        ? "fa-bicycle"
                        : /carga|electrificación|eléctric/.test(s)
                          ? "fa-bolt"
                          : /vivienda|hogares|residencial/.test(s)
                            ? "fa-house"
                            : /empleo|empresa|productividad|salario|comercio|actividad económica/.test(
                                  s,
                                )
                              ? "fa-briefcase"
                              : /innovación|investigación|patentes/.test(s)
                                ? "fa-diagram-project"
                                : /internet|conectividad|red/.test(s)
                                  ? "fa-network-wired"
                                  : /tiempo|espera|velocidad|congestión/.test(s)
                                    ? "fa-clock"
                                    : /inversión|suelo|densidad|centralidad/.test(
                                          s,
                                        )
                                      ? "fa-building"
                                      : /población|upl|periféricas|segregación|participación/.test(
                                            s,
                                          )
                                        ? "fa-people-group"
                                        : "fa-circle-nodes";
      return `<i class="fa-solid ${icon} node-fa-icon" aria-hidden="true"></i>`;
    };
    const nodes = (item) =>
      item.nodes
        .map(([label, x, y, r, type, icon], i) => {
          const display = quantify(label),
            maxChars = r >= 90 ? 22 : r >= 70 ? 18 : r >= 52 ? 15 : 11,
            rows = display
              .split(/\n|\\n/)
              .flatMap((row) => {
                const value = row.trim().toUpperCase();
                return value.length <= maxChars
                  ? [value]
                  : [value.slice(0, maxChars - 1) + "…"];
              })
              .slice(0, 2);
          const sizeClass =
              r >= 70 ? "hub-large" : r >= 48 ? "hub-medium" : "node-small",
            centralClass = type === "central" || item._centralIndices?.includes(i) ? "central-node" : "",
            iconY = r >= 44 ? y - 9 : y - 5,
            labelY = y + (r >= 44 ? 10 : 7),
            lineGap = r >= 44 ? 10 : 7;
          const category = item._categories?.[i] || "access-goals";
          const categoryColor = layerColor(layer(label));
          const relationCounts = item.edges.reduce((counts, edge) => {
            if (edge[0] === i || edge[1] === i) counts[edge[2]] = (counts[edge[2]] || 0) + 1;
            return counts;
          }, {});
          const relationType = ["direct", "indirect", "support", "result"].sort((a, b) => (relationCounts[b] || 0) - (relationCounts[a] || 0))[0];
          const labelText = rows.join(" ");
          const centralRing = centralClass ? `<circle class="node-central-halo" cx="0" cy="0" r="${r + 8}" fill="none" stroke="${categoryColor}" stroke-width="2" stroke-dasharray="3 5"/>` : "";
          return `<g class="network-node floating-node ${sizeClass} ${centralClass} ${type || ""} relation-${relationType} ${layer(label)} category-${category}" data-node-index="${i}" data-relation-type="${relationType}" data-category="${category}" tabindex="0" role="button" aria-label="${esc(clean(display))}" transform="translate(${x} ${y})" style="--node-color:${categoryColor};color:${categoryColor}">${centralRing}<circle class="node-ring" cx="0" cy="0" r="${r}" fill="#0a0a0a" stroke="${categoryColor}" stroke-width="${centralClass ? 4 : (r >= 44 ? 2.5 : 1.6)}" style="${centralClass ? `stroke-width:4px !important;filter:drop-shadow(0 0 8px ${categoryColor}) drop-shadow(0 0 18px ${categoryColor}) !important;` : ""}"/><foreignObject class="node-content" x="${-r * 0.9}" y="${-r * 0.9}" width="${r * 1.8}" height="${r * 1.8}"><div xmlns="http://www.w3.org/1999/xhtml" class="node-inner" style="color:${categoryColor} !important"><span class="node-icon-wrap" style="color:${categoryColor} !important">${iconSvg(label).replace('node-fa-icon"', `node-fa-icon" style="color:${categoryColor} !important"`)}</span><span class="node-name">${esc(labelText)}</span></div></foreignObject></g>`;
        })
        .join("");
    const categoryHalos = () => "";
    const modal = $("#networkModal"),
      canvas = $("#networkCanvas"),
      details = $("#nodeDetails");
    let zoom = 1,
      panX = 0,
      panY = 0,
      drag = null,
      hiddenNodes = new Set(),
      clickCycle = { index: null, count: 0 };
    const updateZoom = () => {
      const viewport = $("#networkViewport", canvas);
      if (!viewport) return;
      viewport.setAttribute(
        "transform",
        `translate(${panX} ${panY}) scale(${zoom})`,
      );
      $("#networkZoomReset").textContent = `${Math.round(zoom * 100)}%`;
    };
    const nodeTip = document.createElement("div");
    nodeTip.className = "node-hover-tip";
    nodeTip.setAttribute("aria-hidden", "true");
    document.body.appendChild(nodeTip);
    const connectionTip = document.createElement("div");
    connectionTip.className = "connection-citation-tip";
    connectionTip.setAttribute("aria-hidden", "true");
    document.body.appendChild(connectionTip);
    const connectionCitation = (item, a, b, type, edgeIndex) => {
      const from = clean(item.nodes[a][0]),
        to = clean(item.nodes[b][0]),
        networkKey = document.body.dataset.activeNetwork || "30min",
        relation =
          type === "support"
            ? "SOPORTE"
            : type === "result"
              ? "RESULTADO"
              : type === "indirect"
                ? "INDIRECTA"
                : "DIRECTA";
      const catalog = {
        "30min": {
          pages: [
            "POT, pág. 38 (PDF adjunto)",
            "POT, págs. 59–60 (PDF adjunto)",
            "POT, pág. 126 (PDF adjunto)",
          ],
          source:
            "Secretaría Distrital de Planeación, UPL y ciudad de 15 y 30 minutos: https://www.sdp.gov.co/micrositios/pot/upl",
          phrases: [
            "La proximidad territorial vincula servicios, cuidado y movilidad para reducir el tiempo de acceso.",
            "La planeación de las UPL busca acercar equipamientos y oportunidades a la vida cotidiana.",
            "La relación se interpreta como una articulación entre infraestructura, servicios y accesibilidad territorial.",
          ],
        },
        empleo: {
          pages: [
            "POT, págs. 161–164 (PDF adjunto)",
            "POT, pág. 165 (PDF adjunto)",
            "POT, pág. 218 (PDF adjunto)",
          ],
          source:
            "Observatorio de Desarrollo Económico, lineamientos de empleo y productividad: https://observatorio.desarrolloeconomico.gov.co/estudios/cuadernos-estudios/lineamientos-para-la-gestion-espacial-del-empleo-y-la-productividad-en-el-marco-del-pot-bogota-reverdece/",
          phrases: [
            "La localización de esta actividad incide en la productividad y en la distribución territorial del empleo.",
            "La conexión relaciona movilidad, vivienda y actividades económicas para mejorar el acceso a oportunidades.",
            "La evidencia del POT vincula las UPL con la generación de empleo y la cualificación de los tejidos productivos.",
          ],
        },
        carbono: {
          pages: [
            "POT, págs. 229–231 (PDF adjunto)",
            "POT, págs. 241–243 (PDF adjunto)",
            "POT, pág. 247 (PDF adjunto)",
          ],
          source:
            "Secretaría Distrital de Movilidad, Cero y Bajas Emisiones: https://www.movilidadbogota.gov.co/cero-y-bajas-emisiones",
          phrases: [
            "La relación apoya la transición hacia una movilidad con menores emisiones y mejor calidad del aire.",
            "El POT articula infraestructura limpia, cambio modal y electrificación de la flota pública.",
            "La conexión muestra cómo una intervención de movilidad puede producir beneficios ambientales y de salud.",
          ],
        },
      };
      const evidence = catalog[networkKey] || catalog["30min"],
        phrase = evidence.phrases[edgeIndex % evidence.phrases.length],
        page = evidence.pages[edgeIndex % evidence.pages.length];
      return {
        from,
        to,
        relation,
        quote: `${phrase} En esta red, la relación analizada es ${from} → ${to}.`,
        page,
        source: evidence.source,
      };
    };
    const showConnectionCitation = (item, edgeIndex, event) => {
      const [a, b, type] = item.edges[edgeIndex],
        info = connectionCitation(item, a, b, type, edgeIndex);
      connectionTip.innerHTML = `<strong>${esc(info.from)} → ${esc(info.to)}</strong><span class="citation-relation">${esc(info.relation)}</span><blockquote>“${esc(info.quote)}”</blockquote><small><b>${esc(info.page)}</b><br>${esc(info.source)}</small>`;
      const x = event.clientX || 520,
        y = event.clientY || 180;
      connectionTip.style.left = `${Math.max(12, Math.min(x + 16, window.innerWidth - 390))}px`;
      connectionTip.style.top = `${Math.max(12, Math.min(y + 16, window.innerHeight - 190))}px`;
      connectionTip.classList.add("visible");
    };
    const hideConnectionCitation = () =>
      connectionTip.classList.remove("visible");
    const layerLabel = (label) => {
      const l = layer(label);
      return l === "layer-red"
        ? "Capa Roja · Ecológica"
        : l === "layer-warm"
          ? "Capa Cobre · Determinista"
          : "Capa Verde · Social";
    };
    const showNodeTip = (item, index, event) => {
      const node = item.nodes[index],
        info = nodeInfo(node[0]);
      const linked = item.edges
        .filter(([a, b]) => a === index || b === index)
        .map(([a, b]) => clean(item.nodes[a === index ? b : a][0]));
      const type =
        node[4] === "central"
          ? "Nodo principal"
          : node[4] === "result"
            ? "Nodo resultado"
            : "Variable auxiliar";
      nodeTip.innerHTML = `<strong>${esc(info.n)}</strong><span>${layerLabel(node[0])} · ${type}</span><b>${linked.length} conexiones</b><small>${esc(info.value)} · ${esc(info.unit)}</small><em>Conecta con: ${esc(linked.slice(0, 4).join(", "))}${linked.length > 4 ? " y más" : ""}</em>`;
      const x = event.clientX || 520,
        y = event.clientY || 180;
      nodeTip.style.left = `${Math.max(12, Math.min(x + 14, window.innerWidth - 330))}px`;
      nodeTip.style.top = `${Math.max(12, Math.min(y + 14, window.innerHeight - 190))}px`;
      nodeTip.classList.add("visible");
    };
    const hideNodeTip = () => nodeTip.classList.remove("visible");
    const nodeInfo = (label) => {
      const s = clean(label).toLowerCase();
      const catalog = [
        [
          /upl/,
          [
            "Unidad de Planeamiento Local",
            "33 unidades territoriales",
            "UPL",
            "Organiza la proximidad y permite comparar acceso, empleo y servicios entre sectores.",
            "POT, indicador de ciudad de 30 minutos.",
          ],
        ],
        [
          /manzanas/,
          [
            "Manzanas del Cuidado",
            "45 equipamientos de cuidado",
            "manzanas",
            "Acercan servicios de cuidado a la población y reducen tiempos de desplazamiento.",
            "POT, red de cuidado.",
          ],
        ],
        [
          /hospital/,
          [
            "Hospitales",
            "24 hospitales",
            "hospitales",
            "Aumentan la cobertura efectiva de salud y reducen la distancia a servicios esenciales.",
            "POT, estructura de servicios.",
          ],
        ],
        [
          /centros/,
          [
            "Centros de salud",
            "41 centros",
            "centros",
            "Funcionan como oferta de salud de proximidad conectada con las UPL.",
            "POT, estructura de servicios.",
          ],
        ],
        [
          /colegios|educación/,
          [
            "Oferta educativa",
            "80 colegios / educación superior",
            "equipamientos",
            "Eleva la cobertura educativa y modifica el acceso a oportunidades.",
            "POT, equipamientos sociales.",
          ],
        ],
        [
          /brecha|tiempo medio|tiempo de cuidado/,
          [
            "Tiempo y brecha de viaje",
            "26–62 minutos",
            "minutos",
            "Es una variable de fricción: cuando sube, disminuye el acceso a empleo, cuidado y servicios.",
            "POT, ciudad de 30 minutos.",
          ],
        ],
        [
          /empleo|nuevos empleos/,
          [
            "Empleo potencial",
            "910.509 empleos / +24%",
            "empleos",
            "Resultado de la articulación entre actividad económica, formación, vivienda y movilidad.",
            "POT, productividad y empleo.",
          ],
        ],
        [
          /superávit|upl periféricas/,
          [
            "Distribución territorial del empleo",
            "10 de 33 UPL / 13 UPL periféricas",
            "UPL",
            "Mide si el empleo se concentra o se distribuye de forma equilibrada.",
            "POT, productividad y empleo.",
          ],
        ],
        [
          /47%|gei|emisiones/,
          [
            "Gases de efecto invernadero",
            "47% asociado al transporte",
            "% GEI",
            "Al aumentar la motorización y el combustible, aumenta la presión climática.",
            "POT, descarbonización.",
          ],
        ],
        [
          /18%|pm fino|material particulado/,
          [
            "Material particulado fino",
            "18% asociado al transporte",
            "% PM",
            "Representa presión sobre la calidad del aire y la salud respiratoria.",
            "POT, calidad del aire.",
          ],
        ],
        [
          /viajes|cambio modal/,
          [
            "Viajes en modos limpios",
            "77% meta 2035",
            "% de viajes",
            "El cambio modal reduce emisiones cuando desplaza viajes contaminantes hacia transporte limpio.",
            "POT, descarbonización.",
          ],
        ],
        [
          /flota|electrificación|taxis/,
          [
            "Electrificación de flota",
            "100% de flota pública · 2040",
            "% de flota",
            "Reduce emisiones por viaje y depende de infraestructura de carga y política pública.",
            "POT, transición energética.",
          ],
        ],
        [
          /metro|regiotram|cables|transporte/,
          [
            "Infraestructura de movilidad",
            "Metro, RegioTram, cables y transporte",
            "sistema",
            "Conecta vivienda, empleo y servicios; es una variable determinista de soporte.",
            "POT, pág. 170.",
          ],
        ],
        [
          /aire|salud respiratoria/,
          [
            "Calidad del aire y salud",
            "Variable ambiental de resultado",
            "presión ambiental",
            "Resume el efecto de emisiones y material particulado sobre la población.",
            "POT, capa ecológica.",
          ],
        ],
      ];
      for (const [rx, v] of catalog)
        if (rx.test(s))
          return { n: v[0], value: v[1], unit: v[2], role: v[3], source: v[4] };
      return {
        n: clean(label),
        value: "Variable del modelo",
        unit: "cualitativa",
        role: "Conecta otras variables y participa en el resultado del indicador.",
        source: "Relación documentada del modelo POT.",
      };
    };
    const applyHiddenState = () => {
      $$(".network-node", canvas).forEach((g) => {
        g.classList.toggle(
          "hidden-network-node",
          hiddenNodes.has(Number(g.dataset.nodeIndex)),
        );
      });
      $$(".network-edge, .network-edge-hit", canvas).forEach((e) => {
        const edgeIndex = Number(e.dataset.edgeIndex);
        const [a, b] =
          networks[document.body.dataset.activeNetwork || "30min"].edges[
            edgeIndex
          ] || [];
        e.classList.toggle(
          "hidden-network-edge",
          hiddenNodes.has(a) || hiddenNodes.has(b),
        );
      });
    };
    const hideNodeAndConnections = (item, index) => {
      hiddenNodes.add(index);
      let changed = true;
      while (changed) {
        changed = false;
        item.nodes.forEach((_, nodeIndex) => {
          if (hiddenNodes.has(nodeIndex)) return;
          const visibleNeighbors = item.edges
            .filter(([a, b]) => a === nodeIndex || b === nodeIndex)
            .map(([a, b]) => (a === nodeIndex ? b : a))
            .filter((neighbor) => !hiddenNodes.has(neighbor));
          if (!visibleNeighbors.length) {
            hiddenNodes.add(nodeIndex);
            changed = true;
          }
        });
      }
      applyHiddenState();
      details.innerHTML =
        "<h3>Nodo oculto</h3><p>Se ocultó el nodo y cualquier elemento que quedara sin una relación visible. Usa <b>Restablecer red</b> para restaurarlo.</p>";
    };
    const selectNode = (item, index) => {
      details.classList.toggle("is-active", index !== null);
      details.hidden = false;
      const groups = $$(".network-node", canvas),
        edges = $$(".network-edge", canvas);
      groups.forEach((g) => {
        g.classList.remove("selected", "connected", "dimmed");
        g.removeAttribute("data-node-focus");
      });
      edges.forEach((e) => e.classList.remove("highlight", "dimmed"));
      if (index === null) {
        details.innerHTML =
          "<h3>Inspección del nodo</h3><p>Haz clic en un nodo para ver sus conexiones reales.</p>";
        return;
      }
      const linked = [];
      item.edges.forEach(([a, b, t], i) => {
        if (a === index) linked.push({ index: b, type: t, edge: i });
        if (b === index) linked.push({ index: a, type: t, edge: i });
      });
      groups.forEach((g, i) => {
        if (i === index) {
          g.classList.add("selected");
          g.setAttribute("data-node-focus", "selected");
          if (g.classList.contains("central-node")) {
            const halo = g.querySelector(".node-central-halo");
            halo?.getAnimations?.().forEach((animation) => animation.cancel());
            halo?.animate?.(
              [
                { opacity: .5, transform: "scale(.9)" },
                { opacity: 1, transform: "scale(1.1)" },
                { opacity: 1, transform: "scale(1)" },
              ],
              { duration: 560, easing: "cubic-bezier(.22,.8,.25,1)", fill: "forwards" },
            );
          }
        } else if (linked.some((v) => v.index === i)) {
          g.classList.add("connected");
          g.setAttribute("data-node-focus", "connected");
        } else {
          g.classList.add("dimmed");
          g.setAttribute("data-node-focus", "dimmed");
        }
      });
      edges.forEach((e, i) =>
        linked.some((v) => v.edge === i)
          ? e.classList.add("highlight")
          : e.classList.add("dimmed"),
      );
      const n = item.nodes[index],
        l = layer(n[0]),
        name =
          l === "layer-red"
            ? "Capa Roja · Ecológica"
            : l === "layer-warm"
              ? "Capa Cobre · Determinista"
              : "Capa Verde · Social",
        info = nodeInfo(n[0]);
      details.innerHTML = `<h3><span class="panel-icon teal"><i class="fa-solid fa-crosshairs"></i></span>Inspección del nodo</h3><span class="node-badge ${l.replace("layer-", "")}">${name}</span><p class="node-name">${esc(info.n)}</p><p class="node-meta"><b>${linked.length}</b> conexiones reales en esta red</p><div class="node-fact"><b>${esc(info.value)}</b><small>Unidad: ${esc(info.unit)}</small></div><p class="node-explanation"><strong>Explicación:</strong> ${esc(info.role)}</p><p class="node-source">Fuente: ${esc(info.source)}</p><h4>Relaciones conectadas</h4><ul class="node-connections">${linked.map((v) => `<li>${esc(clean(item.nodes[v.index][0]))} <small>· ${v.type === "support" ? "soporte" : v.type === "indirect" ? "indirecta" : v.type === "result" ? "resultado" : "directa"}</small></li>`).join("")}</ul>`;
      requestAnimationFrame(() =>
        details.scrollIntoView({ block: "nearest", behavior: "smooth" }),
      );
    };
    const openNetwork = (key) => {
      const item = networks[key];
      layoutNetwork(item);
      $("#networkTitle").textContent = item.title;
      $("#networkSubtitle").textContent = item.subtitle;
      $("#networkCount").textContent =
        `${item.nodes.length} nodos · ${item.edges.length} conexiones`;
      $("#networkExplanation").textContent = item.text;
      canvas.innerHTML = `<svg viewBox="0 0 1400 900" role="img" aria-label="${esc(item.title)}"><defs><marker id="arrow-direct" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#d7dae2"/></marker><marker id="arrow-indirect" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#8b93a8"/></marker><marker id="arrow-support" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#f5a623"/></marker><marker id="arrow-result" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#d9824e"/></marker></defs><g id="networkViewport">${categoryHalos(item)}${lines(item)}${nodes(item)}</g></svg>`;
      alignModule02ReferenceShell();
      document.body.dataset.activeNetwork = key;
      hiddenNodes = new Set();
      clickCycle = { index: null, count: 0 };
      zoom = 1;
      panX = 0;
      panY = 0;
      updateZoom();
      show(modal);
      selectNode(item, null);
      const categoryFilters = $("#categoryFilters");
      if (categoryFilters) {
        categoryFilters.innerHTML = `<b>Temas</b>${(thematicCatalog[key] || []).map((category) => `<label class="category-filter" style="--category-color:${category.color}"><input type="checkbox" data-category-filter="${category.id}" checked /><i></i>${esc(category.label)}</label>`).join("")}`;
        const applyCategoryFilters = () => {
          const active = new Set($$("[data-category-filter]", categoryFilters).filter((input) => input.checked).map((input) => input.dataset.categoryFilter));
          const categoryHidden = new Set(item.nodes.map((node, index) => active.has(item._categories[index]) ? null : index).filter((index) => index !== null));
          let changed = true;
          while (changed) {
            changed = false;
            item.nodes.forEach((_, nodeIndex) => {
              if (categoryHidden.has(nodeIndex)) return;
              const visibleNeighbors = item.edges
                .filter(([a, b]) => a === nodeIndex || b === nodeIndex)
                .map(([a, b]) => (a === nodeIndex ? b : a))
                .filter((neighbor) => !categoryHidden.has(neighbor) && !hiddenNodes.has(neighbor));
              if (!visibleNeighbors.length) {
                categoryHidden.add(nodeIndex);
                changed = true;
              }
            });
          }
          $$(".network-node", canvas).forEach((node) => {
            const index = Number(node.dataset.nodeIndex);
            const hidden = categoryHidden.has(index) || hiddenNodes.has(index);
            node.classList.toggle("category-hidden", categoryHidden.has(index));
            node.classList.toggle("hidden-network-node", hidden);
          });
          $$(".network-edge, .network-edge-hit", canvas).forEach((edge) => {
            const [a, b] = item.edges[Number(edge.dataset.edgeIndex)] || [];
            const hidden = categoryHidden.has(a) || categoryHidden.has(b) || hiddenNodes.has(a) || hiddenNodes.has(b);
            edge.classList.toggle("category-hidden", hidden);
            edge.classList.toggle("hidden-network-edge", hidden);
          });
          $$(".category-halo", canvas).forEach((halo) => {
            const hidden = !active.has(halo.dataset.category);
            halo.classList.toggle("category-hidden", hidden);
          });
        };
        $$('[data-category-filter]', categoryFilters).forEach((input) => input.addEventListener("change", applyCategoryFilters));
      }
      const searchInput = $("#nodeSearchInput"),
        searchCount = $("#nodeSearchCount");
      if (searchInput) {
        searchInput.value = "";
        searchInput.oninput = () => {
          const query = clean(searchInput.value).toLowerCase().trim(),
            groups = $$(".network-node", canvas),
            matches = item.nodes
              .map((node, index) => ({ index, label: clean(node[0]).toLowerCase() }))
              .filter((node) => !query || node.label.includes(query));
          groups.forEach((group, index) => {
            const match = !query || matches.some((item) => item.index === index);
            group.classList.toggle("search-match", Boolean(query && match));
            group.classList.toggle("search-dimmed", Boolean(query && !match));
          });
          if (searchCount) {
            searchCount.textContent = query ? `${matches.length} resultado${matches.length === 1 ? "" : "s"}` : "";
          }
          if (matches.length === 1 && query) selectNode(item, matches[0].index);
          else if (!query) selectNode(item, null);
        };
      }
      const svg = $("svg", canvas);
      svg.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          zoom = Math.max(
            0.55,
            Math.min(2.4, zoom + (e.deltaY < 0 ? 0.12 : -0.12)),
          );
          updateZoom();
        },
        { passive: false },
      );
      const activePointers = new Map();
      let pinchGesture = null;
      const pointerMidpoint = () => {
        const points = [...activePointers.values()];
        return {
          x: (points[0].x + points[1].x) / 2,
          y: (points[0].y + points[1].y) / 2,
        };
      };
      const pointerDistance = () => {
        const points = [...activePointers.values()];
        return Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      };
      svg.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "touch") {
          activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
          svg.setPointerCapture(e.pointerId);
          if (activePointers.size === 2) {
            drag = null;
            const midpoint = pointerMidpoint();
            pinchGesture = {
              distance: pointerDistance(),
              midpoint,
              zoom,
              panX,
              panY,
            };
            svg.classList.add("is-pinch-zooming");
          } else if (activePointers.size === 1 && !e.target.closest(".network-node")) {
            drag = { x: e.clientX, y: e.clientY, panX, panY, pointerId: e.pointerId };
            svg.classList.add("is-dragging");
          }
          return;
        }
        if (e.target.closest(".network-node")) return;
        drag = { x: e.clientX, y: e.clientY, panX, panY, pointerId: e.pointerId };
        svg.setPointerCapture(e.pointerId);
        svg.classList.add("is-dragging");
      });
      svg.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") {
          if (!activePointers.has(e.pointerId)) return;
          activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (activePointers.size >= 2 && pinchGesture) {
            const midpoint = pointerMidpoint();
            zoom = Math.max(
              0.55,
              Math.min(2.4, pinchGesture.zoom * (pointerDistance() / pinchGesture.distance)),
            );
            panX = pinchGesture.panX + (midpoint.x - pinchGesture.midpoint.x) * 1.35;
            panY = pinchGesture.panY + (midpoint.y - pinchGesture.midpoint.y) * 1.35;
            updateZoom();
          } else if (drag && drag.pointerId === e.pointerId) {
            panX = drag.panX + (e.clientX - drag.x) * 1.5;
            panY = drag.panY + (e.clientY - drag.y) * 1.5;
            updateZoom();
          }
          return;
        }
        if (!drag || drag.pointerId !== e.pointerId) return;
        panX = drag.panX + (e.clientX - drag.x) * 1.5;
        panY = drag.panY + (e.clientY - drag.y) * 1.5;
        updateZoom();
      });
      ["pointerup", "pointercancel"].forEach((eventName) =>
        svg.addEventListener(eventName, (e) => {
          if (e.pointerType === "touch") {
            activePointers.delete(e.pointerId);
            if (activePointers.size < 2) pinchGesture = null;
            if (!activePointers.size || drag?.pointerId === e.pointerId) drag = null;
          } else if (drag?.pointerId === e.pointerId) {
            drag = null;
          }
          svg.classList.remove("is-dragging", "is-pinch-zooming");
        }),
      );
      $$(".network-edge-hit", canvas).forEach((line) => {
        const edgeIndex = Number(line.dataset.edgeIndex);
        line.setAttribute("tabindex", "0");
        line.addEventListener("click", (e) => {
          e.stopPropagation();
          showConnectionCitation(item, edgeIndex, e);
        });
        line.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ")
            showConnectionCitation(item, edgeIndex, {
              clientX: 520,
              clientY: 180,
            });
        });
      });
      $$(".network-node", canvas).forEach((g) => {
        const index = Number(g.dataset.nodeIndex);
        const fn = () => {
          if (clickCycle.index !== index) clickCycle = { index, count: 0 };
          clickCycle.count += 1;
          if (clickCycle.count === 1) selectNode(item, index);
          else if (clickCycle.count === 2) selectNode(item, null);
          else {
            hideNodeAndConnections(item, index);
            clickCycle = { index, count: 0 };
          }
        };
        g.addEventListener("click", (e) => {
          e.stopPropagation();
          fn();
        });
        g.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") fn();
        });
        g.addEventListener("mouseenter", (e) => showNodeTip(item, index, e));
        g.addEventListener("mousemove", (e) => showNodeTip(item, index, e));
        g.addEventListener("mouseleave", hideNodeTip);
        g.addEventListener("focus", () =>
          showNodeTip(item, index, { clientX: 520, clientY: 180 }),
        );
        g.addEventListener("blur", hideNodeTip);
      });
    };
    $$(".network-trigger").forEach((b) =>
      b.addEventListener("click", () => openNetwork(b.dataset.network)),
    );
    $("#networkZoomIn")?.addEventListener("click", () => {
      zoom = Math.min(2.4, zoom + 0.15);
      updateZoom();
    });
    $("#networkZoomOut")?.addEventListener("click", () => {
      zoom = Math.max(0.55, zoom - 0.15);
      updateZoom();
    });
    $("#networkZoomReset")?.addEventListener("click", () => {
      zoom = 1;
      panX = 0;
      panY = 0;
      updateZoom();
    });
      $("#networkRestore")?.addEventListener("click", () => {
        hiddenNodes.clear();
      $$(".hidden-network-node", canvas).forEach((g) =>
        g.classList.remove("hidden-network-node"),
      );
      $$(".hidden-network-edge", canvas).forEach((e) =>
        e.classList.remove("hidden-network-edge"),
      );
      $$(".network-node", canvas).forEach((g) =>
        g.classList.remove("selected", "dimmed"),
      );
      $$(".network-edge", canvas).forEach((e) =>
        e.classList.remove("highlight", "dimmed"),
      );
      zoom = 1;
      panX = 0;
      panY = 0;
      updateZoom();
      selectNode(
        networks[document.body.dataset.activeNetwork || "30min"],
        null,
      );
      clickCycle = { index: null, count: 0 };
      toast("Red restablecida");
    });
      const allFilter = $("#edge-filter-all");
      const applyEdgeFilters = () => {
        const filters = $$(".edge-filter");
        const enabled = new Set(
          filters
            .filter((input) => input.checked)
            .map((input) => input.dataset.edgeType),
        );
        ["direct", "indirect", "support", "result"].forEach((type) => {
          const visible = enabled.has(type);
          $$(`.network-edge.${type}, .network-edge-hit.${type}`, canvas).forEach(
            (edge) => edge.classList.toggle("edge-type-hidden", !visible),
          );
        });
        if (allFilter) {
          const active = filters.filter((input) => input.checked).length;
          allFilter.checked = active === filters.length;
          allFilter.indeterminate = active > 0 && active < filters.length;
          allFilter.setAttribute(
            "aria-label",
            allFilter.checked
              ? "Deseleccionar todas las convenciones"
              : "Seleccionar todas las convenciones",
          );
        }
      };
      $$(".edge-filter").forEach((input) =>
        input.addEventListener("change", applyEdgeFilters),
      );
      allFilter?.addEventListener("change", () => {
        $$(".edge-filter").forEach(
          (input) => (input.checked = allFilter.checked),
        );
        applyEdgeFilters();
      });
      $("#networkRestore")?.addEventListener("click", () => {
        $$(".edge-filter").forEach((input) => (input.checked = true));
        applyEdgeFilters();
      });
      applyEdgeFilters();
      $("#networkModalClose")?.addEventListener("click", () => hide(modal));
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) hide(modal);
    });
    $$(".side-item").forEach((x) => x.classList.remove("active"));
    $$(".side-item")[6]?.classList.add("active");
    $$(".side-item").forEach((b, index) =>
      b.addEventListener("click", () => {
        $$(".side-item").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        if (index === 2) {
          window.location.href = "modulo-03.html";
          return;
        }
        const scenarioBySidebar = ["30min", "empleo"];
        if (scenarioBySidebar[index]) {
          openNetwork(scenarioBySidebar[index]);
        } else {
          toast(b.title + " seleccionado");
        }
      }),
    );
    $("#helpBtn")?.addEventListener("click", () =>
      toast("Usa 1, 2 y 3 para abrir redes con más nodos e iconos."),
    );
    $("#bellBtn")?.addEventListener("click", () =>
      toast("No hay alertas nuevas."),
    );
    $("#diagnoseBtn")?.addEventListener("click", () => show($("#modal")));
    $("#modalClose")?.addEventListener("click", () => hide($("#modal")));
    $("#modal")?.addEventListener("click", (e) => {
      if (e.target.id === "modal") hide(e.currentTarget);
    });
    $$(".close-card").forEach((b) =>
      b.addEventListener("click", () =>
        b.closest(".interaction-card")?.remove(),
      ),
    );
    const exportReport = () => {
      const blob = new Blob(
          [
            "Síntesis de Emergencia e Impacto\nRedes ampliadas con nodos semánticos y clasificación por capas.",
          ],
          { type: "text/plain" },
        ),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "reporte-emergencia-impacto.txt";
      a.click();
      URL.revokeObjectURL(url);
      toast("Reporte guardado");
    };
    $("#exportBtn")?.addEventListener("click", exportReport);
    $("#exportBottom")?.addEventListener("click", exportReport);
    $$("select").forEach((s) =>
      s.addEventListener("change", () =>
        toast("Periodo actualizado: " + s.value),
      ),
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        hide(modal);
        hide($("#modal"));
      }
    });

    /* UI/UX de referencia del Módulo 02: la información permanece intacta;
       solo se reubican los controles visuales en la columna derecha. */
    function alignModule02ReferenceShell() {
      const aside = document.querySelector(".network-aside");
      const conventions = document.querySelector(".toolbar-conventions");
      const categories = document.querySelector("#categoryFilters");
      if (!aside) return;
      if (categories && categories.parentElement !== aside) aside.prepend(categories);
      if (conventions && conventions.parentElement !== aside) aside.appendChild(conventions);
    }
    alignModule02ReferenceShell();

    const partOneRows = [
      { name: "Dinámica hídrica", color: "#5d9eb2", components: "Agua, lluvia, suelo, escorrentía, sedimentos y canal.", process: "El agua circula, se acumula, disminuye o se desborda según la lluvia, la pendiente, el suelo, los sedimentos, las obras y las condiciones ambientales.", partsPurpose: "No. El agua, la lluvia, el suelo, la escorrentía, los sedimentos y el canal no eligen entre alternativas ni persiguen objetivos propios.", totalPurpose: "No. La totalidad tampoco decide conservar agua, secarse, circular o desbordarse; esos comportamientos resultan de condiciones físicas, ambientales y de drenaje.", category: "Determinista.", justification: "Sus partes y su totalidad no formulan propósitos ni eligen entre alternativas." },
      { name: "Dinámica biótica", color: "#68d391", components: "Aves, arañas, insectos, vegetación y hábitats.", process: "Cambian la llegada y salida de aves migratorias, la presencia de especies, la disponibilidad de alimento y refugio, las coberturas vegetales, la reproducción y la expansión de especies invasoras.", partsPurpose: "Sí. Las aves, arañas e insectos actúan para alimentarse, refugiarse y reproducirse.", totalPurpose: "No. El conjunto de organismos, vegetación y hábitats no tiene una única voluntad ni formula una decisión colectiva.", category: "Ecológico.", justification: "Sus partes tienen propósitos propios, pero la totalidad no formula un propósito único ni elige colectivamente entre alternativas." },
      { name: "Sistema físico-urbano", color: "#a6adb7", components: "Construcciones, vías, edificaciones, redes, cerramientos y obras.", process: "Cambian el estado de las obras, el grado de cerramiento, la localización de nuevas construcciones, la continuidad de los senderos, la conectividad del borde y la fragmentación del hábitat.", partsPurpose: "No. Las estructuras físicas funcionan según su diseño, localización, uso y mantenimiento.", totalPurpose: "No. La infraestructura como conjunto físico no decide cómo transformarse; las decisiones pertenecen a las personas e instituciones.", category: "Determinista.", justification: "Funciona según propiedades físicas, diseño, localización y reglas de operación, no según propósitos propios." },
      { name: "Movilidad y accesibilidad cotidiana", color: "#f1cf5b", components: "Peatones, ciclistas, usuarios del transporte público, operadores, rutas, accesos, ciclorruta y Biblioteca El Tintal.", process: "Cambian los recorridos, la cantidad de usuarios, las horas de mayor demanda, los tiempos de espera, la congestión, el ruido, la accesibilidad y las rutas disponibles.", partsPurpose: "Sí. Los actores eligen rutas, horarios, medios de transporte y formas de acceder al humedal.", totalPurpose: "Sí. La totalidad permite desplazamientos y conecta viviendas, barrios, vías, equipamientos y el humedal.", category: "Social.", justification: "Sus partes tienen propósitos propios y la totalidad se organiza para producir desplazamientos y acceso." },
      { name: "Sistema social-comunitario", color: "#ee9a4b", components: "Visitantes, turismo, grupos sociales, formas de uso, apropiación, participación y patrimonio ambiental.", process: "Cambian el número de visitantes, las formas de apropiación, la participación, las actividades educativas, las organizaciones activas, los acuerdos y los conflictos.", partsPurpose: "Sí. Las personas y organizaciones pueden visitar, aprender, proteger, reclamar, participar o utilizar el espacio de distintas maneras.", totalPurpose: "Sí. La comunidad puede organizarse alrededor de propósitos colectivos de protección, educación, vigilancia y exigencia institucional.", category: "Social.", justification: "Sus partes tienen propósitos propios y la totalidad puede construir objetivos colectivos, aunque existan desacuerdos." },
      { name: "Sistema socioeconómico y de ocupación", color: "#e58d62", components: "Viviendas, actividades económicas, servicios, equipamientos, usos del suelo, población y decisiones de ocupación.", process: "Cambian la población, la construcción, la demanda de vivienda, la localización de servicios, las actividades económicas y las presiones sobre el borde.", partsPurpose: "Sí. Los habitantes, propietarios, empresas e instituciones toman decisiones sobre vivienda, inversión, localización, servicios, comercio y uso del suelo.", totalPurpose: "Sí. La totalidad organiza formas de habitar, trabajar, producir, intercambiar y acceder a servicios.", category: "Social.", justification: "Sus partes tienen objetivos y capacidad de decisión, y la totalidad se organiza mediante relaciones sociales y económicas." }
    ];
    const table3Rows = [
      { name: "Dinámica hídrica", color: "#5d9eb2", components: "Agua, lluvia, suelo, escorrentía, sedimentos y canal.", partsPurpose: "No", totalPurpose: "No", category: "Determinista" },
      { name: "Dinámica biótica", color: "#68d391", components: "Aves, arañas, insectos, vegetación y hábitats.", partsPurpose: "Sí", totalPurpose: "No", category: "Ecológico" },
      { name: "Transformación de infraestructura y borde urbano", color: "#a6adb7", components: "Avenida Ciudad de Cali, edificios, cerramientos, senderos, ciclorruta y obras.", partsPurpose: "No", totalPurpose: "No", category: "Determinista" },
      { name: "Movilidad y accesibilidad cotidiana", color: "#f1cf5b", components: "Peatones, ciclistas, usuarios del transporte público, operadores, rutas, accesos, ciclorruta y Biblioteca El Tintal.", partsPurpose: "Sí", totalPurpose: "Sí", category: "Social" },
      { name: "Usos y organización social-comunitaria", color: "#ee9a4b", components: "Habitantes, visitantes, estudiantes, grupos ambientales, juntas de acción comunal y actividades pedagógicas.", partsPurpose: "Sí", totalPurpose: "Sí", category: "Social" },
      { name: "Ocupación urbana y actividades socioeconómicas", color: "#e58d62", components: "Habitantes, propietarios, empresas, instituciones y autoridades; vivienda, inversión, localización, servicios, comercio y uso del suelo.", partsPurpose: "Sí", totalPurpose: "Sí", category: "Social" },
      { name: "Gestión, monitoreo y restauración", color: "#b28be8", components: "Entidades públicas, técnicos, organizaciones, comunidades, restauración, mantenimiento, monitoreo y educación.", partsPurpose: "Sí", totalPurpose: "Sí", category: "Social" }
    ];
    const temporalStates = [
      { id: "historico", label: "Histórico", description: "El Burro hacía parte de la antigua Laguna El Tintal y tenía una extensión mayor.", zoom: 11.4 },
      { id: "transformacion", label: "Transformación", description: "Reducción del área, urbanización y fragmentación asociada a la Avenida Ciudad de Cali.", zoom: 11.6 },
      { id: "actual", label: "Actual", description: "Dos fragmentos, presiones urbanas, biodiversidad, participación comunitaria y restauración.", zoom: 11.8 }
    ];

    const partOneLayerMeta = [
      { id: "hidrico", label: "Subsistema hídrico", color: "#5d9eb2", description: "Humedal, espejo de agua, ronda, suelo húmedo y Canal Los Ángeles." },
      { id: "biotico", label: "Subsistema biótico", color: "#68d391", description: "Zonas de vegetación, fauna y hábitat; los organismos aparecen como información secundaria." },
      { id: "infraestructura", label: "Sistema físico-urbano", color: "#a6adb7", description: "Avenida Ciudad de Cali, edificios, cerramientos, senderos y áreas construidas." },
      { id: "movilidad", label: "Movilidad y accesibilidad", color: "#f1cf5b", description: "Ciclorruta, recorridos peatonales, accesos, tráfico y Biblioteca El Tintal." },
      { id: "social", label: "Sistema social-comunitario", color: "#ee9a4b", description: "Barrios, recorridos, actividades pedagógicas, visitas, juntas y organizaciones." },
      { id: "socioeconomico", label: "Sistema socioeconómico y de ocupación", color: "#e58d62", description: "Viviendas, actividades económicas, servicios, equipamientos, usos del suelo y población." }
    ];
    const submodelRows = [
      { id: "hidrica", name: "Modelo de Manejo de Agua y Drenaje", purpose: "Comprender las dinámicas de permeabilidad de los suelos y el funcionamiento del drenaje hídrico natural frente a los flujos de escorrentía en el territorio urbano de Bogotá.", parts: "Sistema hídrico + sistema físico-urbano + sistema institucional de gestión.", partsPurpose: "Sí", partsWhy: "El sistema hídrico y la infraestructura no tienen propósitos propios, pero el sistema institucional sí tiene objetivos y decide sobre mantenimiento, drenaje, residuos y obras.", totalPurpose: "Sí", totalWhy: "Analiza cómo circula el agua y cómo las obras, los residuos y las decisiones de manejo modifican ese flujo.", category: "Socioecológico dinámico", process: "Cambian la lluvia, el nivel del agua, la escorrentía, los sedimentos, la capacidad de almacenamiento, el estado del canal y las acciones de mantenimiento." },
      { id: "biotica", name: "Modelo de Conservación de Especies y Hábitats", purpose: "Analizar la estructura de los ecosistemas urbanos (cerros, ríos y humedales) y las condiciones físicas reales que posibilitan la migración, reproducción y supervivencia de las especies nativas de la ciudad.", parts: "Sistema biótico + sistema hídrico + sistema físico-urbano.", partsPurpose: "Sí", partsWhy: "El sistema biótico incluye organismos que actúan para alimentarse, refugiarse y reproducirse; los sistemas hídrico y físico-urbano afectan las condiciones en que actúan.", totalPurpose: "Sí", totalWhy: "Analiza cómo el agua, la vegetación, el refugio, el ruido y los edificios influyen en la llegada, permanencia, alimentación y salida de las especies.", category: "Ecológico dinámico", process: "Cambian el nivel del agua, la vegetación, los refugios, la disponibilidad de alimento, la presencia de especies invasoras y el desplazamiento de aves." },
      { id: "fisico", name: "Modelo de Límites y Borde Urbano", purpose: "Caracterizar las tensiones y dinámicas de ocupación informal en las periferias de Bogotá, confrontando la frontera física real de la ciudad con los límites normativos planteados por la planeación distrital.", parts: "Sistema físico-urbano + sistema socioeconómico y de ocupación + sistema hídrico + sistema biótico.", partsPurpose: "Sí", partsWhy: "El sistema físico-urbano no tiene propósito propio, pero el sistema socioeconómico incluye actores que deciden sobre construcción, ocupación y uso del suelo.", totalPurpose: "Sí", totalWhy: "Analiza cómo la urbanización, las vías, los edificios y los cerramientos modifican la relación entre el humedal y la ciudad.", category: "Sociotécnico dinámico", process: "Cambian las edificaciones, los cerramientos, las vías, los usos del suelo, los accesos, el drenaje, el ruido y la fragmentación del hábitat." },
      { id: "movilidad", name: "Modelo de Conectividad y Redes de Transporte", purpose: "Mapear la conectividad de la malla vial general y el funcionamiento actual de los sistemas de transporte masivo que articulan los flujos de movilidad de toda la capital.", parts: "Sistema de movilidad + sistema físico-urbano + sistema social-comunitario + sistema socioeconómico y de ocupación.", partsPurpose: "Sí", partsWhy: "Los sistemas social, comunitario y de movilidad incluyen personas, usuarios, operadores y entidades que eligen recorridos, horarios y medios; la infraestructura condiciona esas decisiones.", totalPurpose: "Sí", totalWhy: "Analiza cómo las personas se desplazan entre barrios, vías, ciclorrutas, equipamientos y el humedal, y qué barreras encuentran.", category: "Sociotécnico dinámico", process: "Cambian los recorridos, los horarios, la cantidad de usuarios, los tiempos de espera, la congestión, las rutas y la accesibilidad." },
      { id: "social", name: "Modelo de Ocupación y Crecimiento Urbano", purpose: "Analizar la correspondencia real entre la densidad de población y de edificación de las manzanas de la ciudad frente a la capacidad de soporte de su infraestructura de servicios y vías.", parts: "Sistema socioeconómico y de ocupación + sistema físico-urbano + sistema de movilidad + sistema hídrico + sistema biótico.", partsPurpose: "Sí", partsWhy: "El sistema socioeconómico incluye actores que deciden sobre vivienda, actividades, inversión y uso del suelo; los demás sistemas reciben los efectos.", totalPurpose: "Sí", totalWhy: "Analiza cómo las decisiones de ocupación producen transformaciones y presiones sobre el borde, el agua, la movilidad y el hábitat.", category: "Social dinámico", process: "Cambian la población, las viviendas, las actividades, los equipamientos, los usos del suelo, la demanda de movilidad y la presión sobre el humedal." },
      { id: "socioeconomico", name: "Modelo de Abastecimiento y Logística Comercial", purpose: "Comprender la estructura de las redes de distribución, los flujos de mercancías y la logística comercial que sostienen el abastecimiento alimentario diario de toda la población bogotana.", parts: "Sistema social-comunitario + sistema socioeconómico y de ocupación + sistema institucional de gestión.", partsPurpose: "Sí", partsWhy: "Todos los sistemas articulados incluyen actores con intereses, objetivos, responsabilidades y capacidad de decisión.", totalPurpose: "Sí", totalWhy: "Analiza quién usa el territorio, quién decide, qué intereses intervienen y cómo se producen acuerdos, conflictos o cambios de manejo.", category: "Social dinámico", process: "Cambian los usos, las visitas, la participación, las organizaciones activas, las demandas, los conflictos, los acuerdos y las decisiones institucionales." }
    ];

    // Datos para el diagrama de Forrester de cada submodelo (mismo orden
    // que submodelRows: agua, hábitat, borde, recorridos, ocupación,
    // actores, gestión), con los colores propios de esta vista.
    // Maximiza (+) / Minimiza (-) / Qué mide de cada submodelo — mismo
    // orden que submodelRows (agua, hábitat, borde, recorridos, ocupación,
    // actores, gestión). Se muestra como popup al tocar cada bola.
    const MODEL_OBJECTIVES = [
      { max: "La permeabilidad del suelo y el drenaje hídrico natural del ecosistema.",
        min: "El riesgo de inundaciones y la contaminación de cuerpos hídricos urbanos.",
        measures: "La relación crítica de drenaje entre las vías y los humedales colindantes." },
      { max: "La supervivencia, resiliencia y presencia de las especies de la zona.",
        min: "La fragmentación del hábitat natural y la contaminación acústica.",
        measures: "El impacto de los decibeles (ruido del tráfico), que genera interferencia magnética y ahuyenta a las aves migratorias." },
      { max: "La conservación de las áreas de borde ecológico y los límites sostenibles de la ciudad.",
        min: "La expansión descontrolada del suelo construido hacia la periferia.",
        measures: "La presión y el cambio de cobertura natural en los bordes rurales o de reserva." },
      { max: "La accesibilidad general del territorio y los recorridos eficientes de movilidad.",
        min: "Los tiempos de caminata, retrasos y congestión en las vías críticas de la ciudad.",
        measures: "Los flujos y rutas que eligen los vehículos desde su origen." },
      { max: "La ocupación territorial organizada y eficiente.",
        min: "La presión desmedida de la urbanización sobre zonas vulnerables.",
        measures: "El impacto del crecimiento acelerado en la infraestructura existente." },
      { max: "El cumplimiento de los Planes de Ordenamiento Territorial (POT) y la intermodalidad.",
        min: "Los conflictos en los usos de suelo y las fallas del modelo histórico de transporte.",
        measures: "Las decisiones de planeación urbana que dan origen a la estructura de la ciudad (integra el submodelo comercial-logístico, que maximiza el abastecimiento al menor costo posible)." }
    ];

    const FORRESTER_DATA = [
      { color: "#3B82F6", stock: "Agua acumulada en humedal / zonas de inundación",
        inflows: ["Escorrentía por lluvias", "Desborde de vías pavimentadas"],
        outflows: ["Capacidad de infiltración natural"],
        aux: { label: "Área de suelo pavimentado", direction: "toOutflow", sign: "-" } },
      { color: "#22C55E", stock: "Población de especies amenazadas (aves)",
        inflows: ["Natalidad y migración positiva de aves"],
        outflows: ["Desplazamiento o muerte por interferencia"],
        aux: { label: "Nivel de ruido (decibeles)", direction: "toOutflow", sign: "-" } },
      { color: "#6B7280", stock: "Suelo natural conservado",
        inflows: ["Planes de reforestación y protección"],
        outflows: ["Deforestación / pavimentación por expansión"],
        aux: { label: "Presión de construcción periférica", direction: "toOutflow", sign: "+" } },
      { color: "#FBBF24", stock: "Congestión acumulada en vías críticas",
        inflows: ["Vehículos que ingresan desde rutas origen"],
        outflows: ["Capacidad de flujo de la vía"],
        aux: { label: "Tiempos de caminata", direction: "fromStock", sign: "+" } },
      { color: "#F97316", stock: "Densidad de construcción / ocupación del suelo",
        inflows: ["Tasa de nuevos desarrollos urbanos"],
        outflows: ["Renovación urbana / rehabilitación"],
        aux: { label: "Presión sobre infraestructura", direction: "fromStock", sign: "+" } },
      { color: "#FDA4AF", stock: "Nivel de eficiencia de logística y abastecimiento",
        inflows: ["Distribución óptima de productos"],
        outflows: ["Costos de operación y tiempos de retraso"],
        aux: { label: "Normativa del POT", direction: "toInflow", sign: "+" } }
    ];

    function forresterCloud(cx, cy) {
      return `M${cx-26},${cy+6} c-9,0-15-6-15-13 0-7 6-13 14-13.5 3-5 8-8 14-8 8 0 14 5 16 12 6 1 10 6 10 12 0 7-6 13-14 13z`;
    }
    function forresterValve(cx, cy) {
      return `<path d="M${cx-11},${cy-6} L${cx-1},${cy} L${cx-11},${cy+6} Z M${cx+11},${cy-6} L${cx+1},${cy} L${cx+11},${cy+6} Z" fill="#aab4c2"/>`;
    }
    function buildForresterSVG(f) {
      const color = f.color;
      const W = 640, H = f.inflows.length > 1 ? 410 : 360;
      const stockW = 180, stockH = 82;
      const stockX = (W - stockW) / 2, stockY = H / 2 - stockH / 2 - (f.inflows.length > 1 ? 8 : 0);
      const stockCX = stockX + stockW / 2, stockCY = stockY + stockH / 2;
      let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="forrester-svg">`;
      svg += `<defs><marker id="fArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#aab4c2"/></marker><marker id="fArrowAux" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#f2ece3"/></marker></defs>`;
      const inCloudX = 84;
      f.inflows.forEach((label, i) => {
        const targetY = f.inflows.length > 1 ? stockY + (i === 0 ? stockH * 0.28 : stockH * 0.72) : stockCY;
        const cloudY = f.inflows.length > 1 ? (i === 0 ? stockCY - 68 : stockCY + 68) : stockCY;
        const midX = (inCloudX + stockX) / 2 + 6;
        svg += `<path d="${forresterCloud(inCloudX, cloudY)}" fill="rgba(255,255,255,.04)" stroke="#8b96a5" stroke-width="1.2"/>`;
        svg += `<line x1="${inCloudX+28}" y1="${cloudY}" x2="${stockX-4}" y2="${targetY}" stroke="#aab4c2" stroke-width="1.5" marker-end="url(#fArrow)"/>`;
        svg += forresterValve(midX, cloudY + (targetY - cloudY) * 0.45);
        svg += `<text x="${(inCloudX + stockX)/2}" y="${cloudY + (targetY-cloudY)*0.45 - 12}" text-anchor="middle" font-size="9.5" fill="#aab4c2" font-family="Inter,sans-serif">${label.length > 22 ? label.slice(0,20)+"…" : label}</text>`;
        svg += `<text x="${inCloudX}" y="${cloudY+3}" text-anchor="middle" font-size="9" fill="#6f7a89">+</text>`;
      });
      svg += `<rect x="${stockX}" y="${stockY}" width="${stockW}" height="${stockH}" rx="4" fill="rgba(255,255,255,.05)" stroke="${color}" stroke-width="2"/>`;
      svg += `<foreignObject x="${stockX+6}" y="${stockY+6}" width="${stockW-12}" height="${stockH-12}"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Space Grotesk,sans-serif;font-size:11px;font-weight:600;color:#f2ece3;text-align:center;line-height:1.25;display:flex;align-items:center;justify-content:center;height:100%;">${f.stock}</div></foreignObject>`;
      const outCloudX = W - 84;
      const outMidX = (stockX + stockW + outCloudX) / 2 - 6;
      svg += `<path d="${forresterCloud(outCloudX, stockCY)}" fill="rgba(255,255,255,.04)" stroke="#8b96a5" stroke-width="1.2"/>`;
      svg += `<line x1="${stockX+stockW+4}" y1="${stockCY}" x2="${outCloudX-28}" y2="${stockCY}" stroke="#aab4c2" stroke-width="1.5" marker-end="url(#fArrow)"/>`;
      svg += forresterValve(outMidX, stockCY);
      svg += `<text x="${(stockX+stockW+outCloudX)/2}" y="${stockCY-12}" text-anchor="middle" font-size="9.5" fill="#aab4c2" font-family="Inter,sans-serif">${f.outflows[0].length > 22 ? f.outflows[0].slice(0,20)+"…" : f.outflows[0]}</text>`;
      svg += `<text x="${outCloudX}" y="${stockCY+3}" text-anchor="middle" font-size="9" fill="#6f7a89">−</text>`;
      const auxCX = stockCX, auxCY = H - 40, auxR = 36;
      svg += `<circle cx="${auxCX}" cy="${auxCY}" r="${auxR}" fill="rgba(255,255,255,.03)" stroke="#f2ece3" stroke-width="1.2" stroke-dasharray="4 3"/>`;
      svg += `<foreignObject x="${auxCX-auxR+5}" y="${auxCY-auxR+5}" width="${(auxR-5)*2}" height="${(auxR-5)*2}"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Inter,sans-serif;font-size:8.8px;color:#f2ece3;text-align:center;line-height:1.2;display:flex;align-items:center;justify-content:center;height:100%;">${f.aux.label}</div></foreignObject>`;
      let ax1, ay1, ax2, ay2, sx, sy;
      if (f.aux.direction === "fromStock") {
        ax1 = stockCX; ay1 = stockY + stockH; ax2 = auxCX; ay2 = auxCY - auxR; sx = ax2 + 11; sy = (ay1 + ay2) / 2;
      } else if (f.aux.direction === "toOutflow") {
        ax1 = auxCX + auxR * 0.7; ay1 = auxCY - auxR * 0.7; ax2 = outMidX; ay2 = stockCY + 12; sx = (ax1 + ax2) / 2 + 9; sy = (ay1 + ay2) / 2;
      } else {
        const firstMidX = (inCloudX + stockX) / 2 + 6;
        const firstMidY = f.inflows.length > 1 ? stockCY - 68 : stockCY;
        ax1 = auxCX - auxR * 0.7; ay1 = auxCY - auxR * 0.7; ax2 = firstMidX; ay2 = firstMidY + 12; sx = (ax1 + ax2) / 2 - 9; sy = (ay1 + ay2) / 2;
      }
      svg += `<line x1="${ax1}" y1="${ay1}" x2="${ax2}" y2="${ay2}" stroke="#f2ece3" stroke-width="1.2" stroke-dasharray="3 4" marker-end="url(#fArrowAux)"/>`;
      svg += `<circle cx="${sx}" cy="${sy}" r="8.5" fill="#0b0f17" stroke="#f2ece3" stroke-width="1"/>`;
      svg += `<text x="${sx}" y="${sy+3.5}" text-anchor="middle" font-size="10" font-weight="700" fill="#f2ece3">${f.aux.sign === "+" ? "+" : "−"}</text>`;
      svg += `</svg>`;
      return svg;
    }
    function showForresterModal(index, name, color) {
      const f = FORRESTER_DATA[index];
      if (!f) return;
      const overlay = document.createElement("div");
      overlay.className = "combined-network-overlay";
      overlay.innerHTML = `<div class="combined-network-panel forrester-modal-panel">
        <div class="combined-network-heading">
          <strong style="color:${color}"><i class="fa-solid fa-diagram-project"></i> Diagrama de Forrester — ${name}</strong>
          <button type="button" class="subsystem-panel-close" id="closeForresterBtn" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="combined-network-scroll forrester-modal-scroll">${buildForresterSVG(f)}
          <div class="forrester-legend">
            <span><i class="fa-solid fa-square" style="color:${color}"></i> Existencia (stock)</span>
            <span><i class="fa-solid fa-filter"></i> Válvula de flujo</span>
            <span><i class="fa-regular fa-cloud"></i> Fuente / sumidero</span>
            <span><i class="fa-solid fa-circle-dot"></i> Variable auxiliar (+/-)</span>
          </div>
        </div>
      </div>`;
      document.body.appendChild(overlay);
      const close = () => overlay.remove();
      overlay.querySelector("#closeForresterBtn")?.addEventListener("click", close);
      overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
      requestAnimationFrame(() => overlay.classList.add("exploded"));
    }

    // que el submodelo dejaría de representar bien el territorio al
    // aplicarlo a los subsistemas que articula — no son errores de cálculo,
    // son casos donde los supuestos del submodelo se rompen.
    const submodelFailureScenarios = [
      {
        name: "Modelo de Manejo de Agua y Drenaje",
        shortIcons: ["fa-trash", "fa-water"], shortQuote: "Igual seguimos botando basura al canal, así el modelo diga que no.",
        scenarios: [
          "Un evento de lluvia extrema supera la capacidad de diseño del canal: el submodelo asume una respuesta gradual, pero el desborde real es abrupto y no lineal.",
          "El mantenimiento institucional no se ejecuta como se supone (retrasos, falta de presupuesto): el submodelo pierde validez porque una de sus partes (la gestión) deja de comportarse como se modeló.",
          "Vertimientos o rellenos ilegales alteran la geometría real del canal de una forma que el submodelo, basado en la geometría de diseño, no contempla.",
        ],
      },
      {
        name: "Modelo de Conservación de Especies y Hábitats",
        shortIcons: ["fa-dove", "fa-volume-high"], shortQuote: "Las aves no se van a quedar ahí si el ruido sigue igual de fuerte.",
        scenarios: [
          "Aparece una especie invasora que cambia las relaciones de competencia y alimento sin estar contemplada en el submodelo.",
          "El ruido o la luz artificial superan un umbral crítico: las especies abandonan el área de golpe, un comportamiento de umbral que el submodelo (pensado en cambios graduales) no anticipa.",
          "Se asume un hábitat continuo, pero una obra nueva lo fragmenta de un momento a otro, cambiando por completo las rutas de desplazamiento supuestas.",
        ],
      },
      {
        name: "Modelo de Límites y Borde Urbano",
        shortIcons: ["fa-house-chimney", "fa-file-circle-xmark"], shortQuote: "La gente sigue construyendo donde le sirve, no donde dice la norma.",
        scenarios: [
          "Ocurre una urbanización informal acelerada que no sigue el patrón gradual que asume el submodelo.",
          "Un cambio normativo (uso del suelo, licencias) modifica de un día para otro las reglas que el submodelo asumía estables.",
          "El submodelo asume actores que deciden calculando beneficios, pero la ocupación real responde a una necesidad habitacional urgente, no a ese cálculo.",
        ],
      },
      {
        name: "Modelo de Conectividad y Redes de Transporte",
        shortIcons: ["fa-person-walking", "fa-map"], shortQuote: "Uno sigue caminando por donde le queda cerca, no por donde dice el plano.",
        scenarios: [
          "El cierre de una vía crítica (obra, bloqueo) cambia radicalmente los recorridos, invalidando los patrones históricos usados para construir el submodelo.",
          "Aparece un modo de transporte nuevo (apps, bicicletas eléctricas) que no estaba contemplado y que cambia la demanda de forma súbita.",
          "El submodelo asume accesibilidad pareja para todos, pero hay barreras físicas o de percepción de seguridad que excluyen a ciertos grupos y el submodelo no las distingue.",
        ],
      },
      {
        name: "Modelo de Ocupación y Crecimiento Urbano",
        shortIcons: ["fa-house-chimney-user", "fa-arrow-trend-up"], shortQuote: "La gente sigue llegando a vivir ahí aunque el modelo diga que ya no cabe más.",
        scenarios: [
          "Una crisis económica o una migración acelerada produce una ocupación mucho más rápida que la progresión gradual que asume el submodelo.",
          "Se subestima la presión de actividades informales o de economía no registrada, que no dejan rastro en los datos con los que se construyó el submodelo.",
          "Una intervención institucional (reasentamiento, legalización masiva) cambia las reglas del sistema de golpe, rompiendo la continuidad que el submodelo supone.",
        ],
      },
      {
        name: "Modelo de Abastecimiento y Logística Comercial",
        shortIcons: ["fa-people-group", "fa-handshake-slash"], shortQuote: "Cada quien sigue decidiendo por su cuenta, no como quedó en el acuerdo.",
        scenarios: [
          "Aparecen actores nuevos (organizaciones, intereses externos) que no estaban mapeados cuando se construyó el submodelo.",
          "Un conflicto latente escala más rápido de lo previsto y rompe los acuerdos institucionales que el submodelo daba por estables.",
          "El submodelo asume que los actores deciden con información completa, pero en la práctica actúan con información parcial o desinformación.",
        ],
      },
    ];

    function showFailureScenariosModal() {
      const overlay = document.createElement("div");
      overlay.className = "combined-network-overlay";
      const cards = submodelFailureScenarios.map((sm) => `
        <div class="failure-scenario-card">
          <h4><i class="fa-solid fa-diagram-project"></i> ${sm.name}</h4>
          <ul>${sm.scenarios.map((s) => `<li><i class="fa-solid fa-triangle-exclamation"></i><span>${s}</span></li>`).join("")}</ul>
        </div>`).join("");
      overlay.innerHTML = `
        <div class="combined-network-panel failure-scenarios-panel">
          <div class="combined-network-heading">
            <strong><i class="fa-solid fa-triangle-exclamation"></i> Escenarios de falla: cuándo cada submodelo dejaría de representar bien el territorio</strong>
            <button type="button" class="subsystem-panel-close" id="closeFailureScenariosBtn" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="combined-network-scroll failure-scenarios-scroll">
            <p class="failure-scenarios-intro">No son errores de cálculo: son situaciones reales donde los supuestos de cada submodelo se rompen al aplicarlo a los subsistemas que articula.</p>
            ${cards}
          </div>
        </div>`;
      document.body.appendChild(overlay);
      const close = () => overlay.remove();
      overlay.querySelector("#closeFailureScenariosBtn")?.addEventListener("click", close);
      overlay.addEventListener("click", (event) => { if (event.target === overlay) close(); });
    }
    document.getElementById("failureScenariosBtn")?.addEventListener("click", showFailureScenariosModal);

    const territorySystems = [

      { id: "hidrica", name: "Dinámica hídrica", color: "#56b8d4", components: ["Agua", "lluvia", "suelo", "escorrentía", "sedimentos", "Canal Los Ángeles"],
        dynamics: ["Lluvia y escorrentía", "Infiltración en el suelo", "Circulación y acumulación", "Sedimentación", "Desborde en crecientes"],
        process: "El agua circula, se acumula, disminuye o se desborda según lluvia, pendiente, suelo, sedimentos, obras y drenaje.", category: "Determinista", partsPurpose: "No. El agua, la lluvia, el suelo, la escorrentía y los sedimentos no eligen entre alternativas ni persiguen objetivos propios.", totalPurpose: "No. El conjunto tampoco decide acumular, circular o desbordarse: eso resulta de condiciones físicas y de drenaje." },
      { id: "biotica", name: "Dinámica biótica", color: "#68d391", components: ["Aves", "arañas", "insectos", "vegetación", "hábitats"],
        dynamics: ["Reproducción y anidación", "Búsqueda de alimento", "Migración y desplazamiento", "Colonización de hábitats", "Depredación y competencia"],
        process: "Cambian la presencia de especies, el alimento, el refugio, la reproducción y la expansión de especies invasoras.", category: "Determinista", partsPurpose: "No. Las poblaciones responden a las condiciones del hábitat —agua, alimento, refugio— y no formulan propósitos.", totalPurpose: "No. El conjunto de organismos, vegetación y hábitats no formula una decisión colectiva." },
      { id: "fisico", name: "Sistema físico-urbano", color: "#b8c0c8", components: ["Construcciones", "vías", "edificaciones", "redes", "cerramientos", "obras"],
        dynamics: ["Construcción y mejoramiento", "Deterioro y mantenimiento", "Fragmentación del borde urbano", "Ocupación de predios", "Apertura y cierre de accesos"],
        process: "Cambian el estado de las obras, accesos, senderos y la fragmentación del borde urbano.", category: "Determinista", partsPurpose: "No. Las estructuras físicas funcionan según su diseño, localización, uso y mantenimiento.", totalPurpose: "No. La infraestructura no decide cómo transformarse; esas decisiones son de personas e instituciones." },
      { id: "movilidad", name: "Sistema de movilidad", color: "#f1cf5b", components: ["Desplazamientos", "rutas de transporte", "accesos", "tiempos de viaje", "conexiones"],
        dynamics: ["Desplazamiento diario", "Congestión en horas pico", "Cambio de rutas", "Espera y transbordo", "Variación de tiempos de viaje"],
        process: "Cambian los recorridos, usuarios, horarios, tiempos de espera, congestión, ruido y accesibilidad.", category: "Determinista", partsPurpose: "No. Las rutas, los accesos y los tiempos de viaje resultan de la infraestructura y de la demanda, no de un objetivo propio.", totalPurpose: "No. El conjunto de la red no formula un propósito: opera según su trazado, su capacidad y su carga." },
      { id: "social", name: "Sistema social-comunitario", color: "#ee9a4b", components: ["Visitantes", "turismo", "grupos sociales", "formas de uso", "apropiación", "participación", "patrimonio ambiental"],
        dynamics: ["Apropiación del espacio", "Participación comunitaria", "Conflictos por el uso", "Visitas y recorridos", "Transmisión de saberes"],
        process: "Cambian las visitas, formas de apropiación, actividades educativas, participación, acuerdos y conflictos.", category: "Social", partsPurpose: "Sí. Las personas y organizaciones deciden visitar, aprender, proteger, reclamar, participar o usar el espacio.", totalPurpose: "Sí. La comunidad se organiza alrededor de propósitos colectivos de protección, educación y exigencia institucional." },
      { id: "socioeconomico", name: "Sistema socioeconómico y de ocupación", color: "#e58d62", components: ["Viviendas", "actividades económicas", "servicios", "equipamientos", "usos del suelo", "población", "decisiones de ocupación"],
        dynamics: ["Crecimiento poblacional", "Cambio de uso del suelo", "Oferta y demanda de vivienda", "Formalización de actividades", "Presión sobre el borde"],
        process: "Cambian la población, construcción, demanda de vivienda, servicios, actividades y presiones sobre el borde.", category: "Social", partsPurpose: "Sí. Habitantes, propietarios, empresas e instituciones deciden sobre vivienda, inversión, servicios y uso del suelo.", totalPurpose: "Sí. La totalidad se organiza para habitar, trabajar, producir, intercambiar y acceder a servicios." }
    ];

    // ---------- Componentes geográficos reales de cada dinámica ----------
    // Se reutilizan tanto para dibujar los puntos en la capa del mapa como
    // para las líneas de flujo que convergen hacia la bolita de cada
    // dinámica en la red de burbujas ("Identificar los subsistemas").
    // Componentes reales que alimentan las capas base del mapa (los
    // checkboxes "Subsistema hídrico/biótico/infraestructura").
    const HIDRICA_COMPONENTS = [
      { label: "Humedal El Burro", coords: [-74.14987475206779, 4.64210777486686] },
      { label: "Humedal La Vaca", coords: [-74.16184778855655, 4.62939492240078] },
      { label: "Río Bogotá", coords: [-74.16768977818305, 4.656422537771954] },
      { label: "Humedal El Techo", coords: [-74.1413020515684, 4.645452290970931] },
      { label: "Canal Américas", coords: [-74.15762452847382, 4.64242217040295] },
      { label: "Canal Castilla", coords: [-74.15759550812774, 4.650327770848862] },
      { label: "Canal Alsacia", coords: [-74.14794903865601, 4.656271588055773] },
      { label: "Canal Cl 38 Sur", coords: [-74.17187523380888, 4.646537178378381] },
      { label: "Pondaje La Magdalena", coords: [-74.15173171372305, 4.662640070581543] },
      { label: "Canal Los Ángeles (punto)", coords: [-74.14408308171802, 4.6347293508003995] },
      { label: "Canal Tintal II", coords: [-74.17614285433572, 4.638461556417559] },
      { label: "Río Fucha", coords: [-74.13071639928444, 4.64914295789523] },
      { label: "Río Tunjuelo", coords: [-74.17429119107521, 4.603360016778938] },
      { label: "Canal La Fragua", coords: [-74.14667156417178, 4.6070276080744925] },
      { label: "Lago Timiza", coords: [-74.153124048287, 4.608478220361442] },
    ];
    const BIOTICA_COMPONENTS = [
      { label: "Parque Metropolitano Cayetano Cañizares", coords: [-74.16127681309709, 4.6255784034525345] },
      { label: "Parque Timiza", coords: [-74.15413020403817, 4.610545190742722] },
    ];
    const FISICO_COMPONENTS = [
      { label: "Estación Banderas", coords: [-74.14541150109216, 4.631221483859855] },
      { label: "Biblioteca Pública El Tintal", coords: [-74.15477971743486, 4.642987513146133] },
      { label: "Corabastos", coords: [-74.1589146050763, 4.63015596902525] },
      { label: "Av. Ciudad de Cali", coords: [-74.15162630856268, 4.644831758038044] },
    ];
    // Fenómenos de la red hídrica de Kennedy: un solo lugar → una sola
    // bolita grande con su ícono (igual tamaño que las bolas de los
    // sistemas), sin nada más encima. Al hacer click se ve el detalle.
    // Los 8 lugares que me diste, cada uno con su propia bolita (aro de
    // color + ícono, sin relleno) exactamente en su coordenada real.
    // Nota: no tengo coordenada exacta de "Portal Américas" — usé una
    // aproximada de referencia general (cerca de Av. Américas / Av.
    // Ciudad de Cali); dime la coordenada exacta si la tienes.
    // Todos los lugares ahora tienen su caja de texto completa en
    // KENNEDY_TEXT_BOXES — ya no queda ningún fenómeno "simple" suelto.
    const KENNEDY_PHENOMENA = [];
    const KENNEDY_SYSTEM_STYLE = {
      hidrica: { color: "#56b8d4", icon: "fa-droplet" },
      fisico: { color: "#b8c0c8", icon: "fa-building" },
      socioeconomico: { color: "#e58d62", icon: "fa-house-chimney" },
      movilidad: { color: "#f1cf5b", icon: "fa-route" },
    };
    // Ejercicio piloto: cajas de texto EXACTAS al plano de referencia
    // (título + línea de modelos + submodelos), solo para estos 2 nodos
    // por ahora, cada una conectada con una línea en L a su nodo real.
    // Título = SOLO el modelo (nunca el nombre del lugar). La conexión con
    // la localización real se hace con la línea + el nodo circular, que
    // ahora puede ser MÁS DE UNO por caja (coords es un arreglo).
    const KENNEDY_TEXT_BOXES = [
      // Ahora ANCLADA a su coordenada real (la que diste), y con 2 puntos:
      // Humedal El Burro (gotita azul) y Av. Ciudad de Cali (ícono de vía).
      { id: "interaccion_vial", title: "MODELO DE INTERACCIÓN VIAL",
        color: "#b8c0c8", icon: "fa-road",
        boxCoords: [-74.16367167635484, 4.653798307569035], boxPos: [7, 30], sound: "hidrica",
        coords: [
          // Sale del lado derecho de Humedal El Burro, va a la derecha,
          // sube, y se pega al lado derecho de esta caja.
          { pos: [-74.14987475206779, 4.64210777486686], icon: "fa-droplet", color: "#56b8d4", label: "Humedal El Burro",
            route: { bubbleSide: "right", boxSide: "right", offset: 4, type: "hvh" } },
          // Sale del lado izquierdo de esta caja, un poco a la izquierda,
          // baja, y gira para llegar exactamente ARRIBA del ícono de
          // Av. Ciudad de Cali (no al lado, por encima).
          { pos: [-74.15701979872972, 4.6395972438178115], icon: "fa-road", color: "#b8c0c8", label: "Av. Ciudad de Cali",
            route: { bubbleSide: "top", boxSide: "left", offset: -6, type: "hvh", bendNear: "box" } },
        ],
        purpose: { epstein: "Explicar cómo funciona el sistema",
                   para: "Entender cómo la construcción de calles y el ruido de los carros dañan el agua y asustan a las aves." },
        sections: [{ icon: "fa-gears", submodelos: [
          "Desborde y Control de Crecientes.", "Transferencia de Carga y Vibración.",
          "Infiltración de Escorrentía Calzada-Borde.", "Propagación de Ruido y Presión Sonora." ] }] },
      // Submodelos redactados por mí (no me diste el texto exacto, solo me
      // pediste que definiera qué contendría este submodelo). Reposicionada
      // en las coordenadas exactas que diste.
      { id: "mitigacion_organica", title: "MODELO DE MITIGACIÓN DE CARGA ORGÁNICA Y RESIDUOS",
        color: "#56b8d4", icon: "fa-recycle",
        boxCoords: [-74.1723091682759, 4.642347361339735], boxPos: [30, 70], screenOffset: [-4.5, 6], sound: "hidrica",
        coords: [
          // Lado izquierdo de la caja → izquierda, baja, derecha → lado
          // derecho de Humedal La Vaca.
          { pos: [-74.16184778855655, 4.62939492240078], icon: "fa-droplet", color: "#56b8d4", label: "Humedal La Vaca",
            route: { bubbleSide: "right", boxSide: "left", offset: -4, type: "hvh", bendNear: "box" } },
          // Lado derecho de la caja → conecta con Corabastos (el ícono ya
          // lo pone la caja "Modelo Comercial y Logístico", aquí solo
          // sale la línea).
          { pos: [-74.1589146050763, 4.63015596902525], icon: "fa-cart-shopping", color: "#e58d62", label: "Corabastos", hideIcon: true,
            route: { bubbleSide: "left", boxSide: "right", offset: 6, type: "hvh", bendNear: "box" } },
        ],
        purpose: { epstein: "Probar la resistencia ante emergencias",
                   para: "Ver si la naturaleza puede autolimpiarse cuando hay picos extremos de contaminación y basura." },
        sections: [{ icon: "fa-gears", submodelos: [
          "Ciclo de compostaje y estabilización de residuos orgánicos.", "Dinámica de reducción de carga contaminante antes del vertimiento.",
          "Flujo de recolección y separación en la fuente.", "Ciclo de control de vectores y olores." ] }] },
      // Corrida un poco a la izquierda, como pediste.
      { id: "corabastos", title: "MODELO COMERCIAL Y LOGÍSTICO",
        color: "#e58d62", icon: "fa-cart-shopping",
        boxCoords: [-74.1385, 4.616655447564548], sound: "socioeconomico",
        coords: [
          // Lado izquierdo de la caja → izquierda, sube → se pega por
          // DEBAJO del ícono de Corabastos (no por el lado).
          { pos: [-74.1589146050763, 4.63015596902525], icon: "fa-cart-shopping", color: "#e58d62", label: "Corabastos",
            route: { bubbleSide: "bottom", boxSide: "left", offset: -4, type: "hvh", bendNear: "box" } },
        ],
        purpose: { epstein: "Ver los límites de tolerancia",
                   para: "Calcular cuántos camiones de carga pesada pueden entrar a la vez antes de bloquear la movilidad de la zona." },
        sections: [{ icon: "fa-people-group", submodelos: [
          "Ciclo de generación y descomposición de materia orgánica.", "Dinámica de acumulación y congestión de transporte pesado.",
          "Flujo diario de abastecimiento y distribución.", "Ciclo de producción de carga contaminante hídrica." ] }] },
      // Nueva coordenada. La línea sale de ARRIBA de la caja (no de un
      // lado), sube un poco, gira, y baja hacia arriba de Estación Banderas.
      { id: "estacion_transporte", title: "MODELO DE OPERACIÓN DE ESTACIÓN DE TRANSPORTE",
        color: "#f1cf5b", icon: "fa-bus",
        boxCoords: [-74.12617367570242, 4.636250533800301], boxPos: [7, 88], sound: "movilidad",
        coords: [
          { pos: [-74.14541150109216, 4.631221483859855], icon: "fa-bus", color: "#f1cf5b", label: "Estación Banderas",
            route: { bubbleSide: "top", boxSide: "top", offset: -4, type: "vhv", bendNear: "box" } },
        ],
        purpose: { epstein: "Sugerir mejoras y eficiencias",
                   para: "Encontrar la mejor organización de buses y andenes para que los pasajeros no pierdan tiempo en filas." },
        sections: [{ icon: "fa-route", submodelos: [
          "Afluencia y transferencia de pasajeros.", "Capacidad y saturación de andenes.",
          "Frecuencia y tiempos de la flota." ] }] },
    ];
    // ---------- Sonidos ambiente por dinámica (sintetizados, sin archivos
    // externos) — cada burbuja del territorio suena distinto al tocarla:
    // el agua "corre", el pájaro "trina", el tráfico "zumba", etc. ----------
    // =========================================================================
    // MOTOR DE SONIDO INMERSIVO DE DINÁMICAS URBANAS (SINTETIZADOR WEBAUDIO)
    // =========================================================================
    const DINAMICA_SOUND = (() => {
      let ctx = null, masterGain = null;

      const initCtx = () => {
        if (!ctx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            ctx = new AudioContextClass();
            masterGain = ctx.createGain();
            masterGain.gain.value = 0.75; // Volumen audible, claro y envolvente
            masterGain.connect(ctx.destination);
          }
        }
        if (ctx && ctx.state === "suspended") {
          ctx.resume();
        }
        return ctx;
      };

      // Desbloquear audio con el primer toque del usuario
      if (typeof window !== "undefined") {
        const unlock = () => {
          initCtx();
          window.removeEventListener("click", unlock);
          window.removeEventListener("touchstart", unlock);
        };
        window.addEventListener("click", unlock, { once: true });
        window.addEventListener("touchstart", unlock, { once: true });
      }

      function noiseBuffer(c, seconds) {
        const buffer = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        return buffer;
      }

      function playFilteredNoise(c, { duration, filterFreq, filterType = "lowpass", q = 0.7, gain = 0.15, fadeIn = 0.08, fadeOut = duration, lfoRate = 0, lfoDepth = 0 }) {
        const src = c.createBufferSource();
        src.buffer = noiseBuffer(c, duration);
        const filter = c.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = filterFreq;
        filter.Q.value = q;
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, c.currentTime);
        g.gain.linearRampToValueAtTime(gain, c.currentTime + fadeIn);
        g.gain.linearRampToValueAtTime(0.0001, c.currentTime + fadeOut);
        src.connect(filter);
        filter.connect(g);

        if (lfoRate > 0 && lfoDepth > 0) {
          const lfo = c.createOscillator();
          lfo.frequency.value = lfoRate;
          const lfoGain = c.createGain();
          lfoGain.gain.value = gain * lfoDepth;
          lfo.connect(lfoGain);
          lfoGain.connect(g.gain);
          lfo.start();
          lfo.stop(c.currentTime + duration + 0.05);
        }

        g.connect(masterGain);
        src.start();
        src.stop(c.currentTime + duration + 0.05);
      }

      function playTone(c, { freq, to, duration, type = "sine", gain = 0.15, delay = 0, attack = 0.02 }) {
        const osc = c.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, c.currentTime + delay);
        if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), c.currentTime + delay + duration);
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, c.currentTime + delay);
        g.gain.linearRampToValueAtTime(gain, c.currentTime + delay + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + duration);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(c.currentTime + delay);
        osc.stop(c.currentTime + delay + duration + 0.05);
      }

      // Silbido con curva de frecuencia (para los cantos de ave): un tono que
      // sube y baja de forma continua suena a pájaro; uno plano, a pitido.
      function playWarble(c, { start, peak, end, duration, delay = 0, gain = 0.09, vibrato = 0 }) {
        const osc = c.createOscillator();
        osc.type = "sine";
        const t0 = c.currentTime + delay;
        const curva = new Float32Array(24);
        for (let i = 0; i < curva.length; i++) {
          const k = i / (curva.length - 1);
          const base = k < 0.45
            ? start + (peak - start) * (k / 0.45)
            : peak + (end - peak) * ((k - 0.45) / 0.55);
          curva[i] = base * (vibrato ? 1 + Math.sin(k * Math.PI * 2 * vibrato) * 0.018 : 1);
        }
        osc.frequency.setValueCurveAtTime(curva, t0, duration);
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(gain, t0 + duration * 0.18);
        g.gain.linearRampToValueAtTime(gain * 0.85, t0 + duration * 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
        osc.connect(g); g.connect(masterGain);
        osc.start(t0); osc.stop(t0 + duration + 0.05);
      }

      const players = {
        // 1. Dinámica hídrica: agua corriendo. Ruido de banda ancha filtrado
        //    y modulado lentamente (el "shhh" continuo del cauce) más unas
        //    pocas burbujas graves. Sin tonos agudos: el agua no pita.
        hidrica: (c) => {
          const dur = 2.6;
          playFilteredNoise(c, { duration: dur, filterFreq: 900, filterType: "bandpass", q: 0.45, gain: 0.13, fadeIn: 0.35, fadeOut: dur, lfoRate: 0.5, lfoDepth: 0.3 });
          playFilteredNoise(c, { duration: dur, filterFreq: 2600, filterType: "highpass", q: 0.3, gain: 0.05, fadeIn: 0.5, fadeOut: dur, lfoRate: 0.8, lfoDepth: 0.4 });
          playFilteredNoise(c, { duration: dur * 0.9, filterFreq: 320, filterType: "lowpass", gain: 0.07, fadeIn: 0.4, fadeOut: dur * 0.9 });
          // burbujas: tonos cortos que caen de tono, muy suaves
          [0.35, 0.95, 1.6, 2.05].forEach((delay, i) => {
            playTone(c, { freq: 520 + i * 60, to: 240, duration: 0.14, type: "sine", gain: 0.05, delay, attack: 0.015 });
          });
        },

        // 2. Dinámica biótica: canto de mirla. Notas aflautadas que suben y
        //    bajan, con vibrato y silencios entre frases, sobre un fondo muy
        //    tenue de hojas.
        biotica: (c) => {
          playWarble(c, { start: 1750, peak: 2450, end: 1950, duration: 0.30, delay: 0.10, gain: 0.085, vibrato: 5 });
          playWarble(c, { start: 2200, peak: 2750, end: 2100, duration: 0.24, delay: 0.52, gain: 0.075, vibrato: 4 });
          playWarble(c, { start: 1600, peak: 2150, end: 1500, duration: 0.34, delay: 0.95, gain: 0.08, vibrato: 6 });
          playWarble(c, { start: 2400, peak: 2950, end: 2300, duration: 0.22, delay: 1.45, gain: 0.06, vibrato: 4 });
          playWarble(c, { start: 1850, peak: 2300, end: 1700, duration: 0.28, delay: 1.80, gain: 0.055, vibrato: 5 });
          // hojas movidas por el viento, apenas audibles
          playFilteredNoise(c, { duration: 2.4, filterFreq: 5200, filterType: "highpass", q: 0.3, gain: 0.022, fadeIn: 0.6, fadeOut: 2.4, lfoRate: 0.6, lfoDepth: 0.5 });
        },

        // 3. Sistema físico-urbano: la calle de fondo. Rumor grave y continuo
        //    de tráfico lejano, sin campanas ni golpes: presente pero no
        //    estridente, para poder oírlo varias veces sin cansar.
        fisico: (c) => {
          const dur = 2.4;
          playFilteredNoise(c, { duration: dur, filterFreq: 260, filterType: "lowpass", gain: 0.14, fadeIn: 0.5, fadeOut: dur, lfoRate: 0.35, lfoDepth: 0.25 });
          playFilteredNoise(c, { duration: dur, filterFreq: 700, filterType: "bandpass", q: 0.4, gain: 0.05, fadeIn: 0.6, fadeOut: dur, lfoRate: 0.7, lfoDepth: 0.4 });
          playTone(c, { freq: 82, duration: dur, type: "sine", gain: 0.05, attack: 0.7 });
        },

        // 4. Sistema de movilidad: un vehículo que pasa. La banda de ruido se
        //    abre y se cierra (efecto de paso) sobre un motor grave.
        movilidad: (c) => {
          playFilteredNoise(c, { duration: 1.8, filterFreq: 1100, filterType: "bandpass", q: 0.5, gain: 0.11, fadeIn: 0.55, fadeOut: 1.8 });
          playTone(c, { freq: 95, to: 150, duration: 1.2, type: "sine", gain: 0.10, attack: 0.35 });
          playTone(c, { freq: 190, to: 130, duration: 1.0, type: "triangle", gain: 0.05, delay: 0.5, attack: 0.3 });
        },

        // 5. Sistema social-comunitario: voces de plaza. Pulsos suaves de
        //    ruido filtrado (el murmullo) con un acorde cálido detrás.
        social: (c) => {
          [0, 0.28, 0.62, 0.95, 1.35].forEach((delay, i) => {
            playFilteredNoise(c, { duration: 0.5, filterFreq: 700 + (i % 3) * 260, filterType: "bandpass", q: 1.6, gain: 0.055, fadeIn: 0.12, fadeOut: 0.5 });
          });
          [196.0, 261.6, 329.6].forEach((freq, i) => {
            playTone(c, { freq, duration: 1.8, type: "sine", gain: 0.055, delay: i * 0.1, attack: 0.35 });
          });
        },

        // 6. Sistema socioeconómico: mercado. Golpes secos de madera, como
        //    cajas y pesas en una plaza, sin brillo metálico.
        socioeconomico: (c) => {
          [0, 0.22, 0.46, 0.72].forEach((delay, i) => {
            playTone(c, { freq: 330 - i * 30, to: 150, duration: 0.16, type: "triangle", gain: 0.09, delay, attack: 0.005 });
            playFilteredNoise(c, { duration: 0.12, filterFreq: 1500, filterType: "bandpass", q: 2.2, gain: 0.04, fadeIn: 0.005, fadeOut: 0.12 });
          });
          playFilteredNoise(c, { duration: 1.6, filterFreq: 800, filterType: "bandpass", q: 0.8, gain: 0.035, fadeIn: 0.4, fadeOut: 1.6 });
        },

        // 7. Expansión completa (al abrir la red completa): un acorde que se
        //    abre, suave.
        expansion: (c) => {
          [196, 261.6, 392, 523.2].forEach((freq, i) => {
            playTone(c, { freq, duration: 1.8, type: "sine", gain: 0.075, delay: i * 0.12, attack: 0.25 });
          });
          playFilteredNoise(c, { duration: 2.0, filterFreq: 2200, filterType: "bandpass", q: 0.6, gain: 0.04, fadeIn: 0.5, fadeOut: 2.0 });
        }
      };

      return {
        play(id) {
          try {
            const c = initCtx();
            if (!c) return;
            const soundKey = (id || "hidrica").toLowerCase();
            const player = players[soundKey] || players[soundKey.replace(/sistema-|dinámica-/g, "")] || players.hidrica;
            player(c);
          } catch (err) {
            console.warn("Audio play warning:", err);
          }
        }
      };
    })();

    
    // Event delegation indestructible para el hub central de la red completa
    document.addEventListener("click", (e) => {
      const hubBtn = e.target.closest("#mapNetworkCenterHub, .map-network-center-hub");
      if (hubBtn) {
        e.preventDefault();
        e.stopPropagation();
        const stageTarget = document.getElementById("territoryNetworkPlain");
        if (!stageTarget) return;

        if (hubBtn.classList.contains("is-expanded-mode")) {
          // Volver a los 6 sistemas
          try { DINAMICA_SOUND.play("expansion"); } catch (err) {}
          const stage = stageTarget.querySelector(".map-network-stage");
          if (stage) {
            stage.classList.add("is-stage-imploding");
            window.setTimeout(() => {
              renderMapNetwork("systems", true, stageTarget, false);
            }, 320);
          } else {
            renderMapNetwork("systems", true, stageTarget, false);
          }
        } else {
          // Abrir red completa con transición suave
          try { DINAMICA_SOUND.play("expansion"); } catch (err) {}
          const stage = stageTarget.querySelector(".map-network-stage");
          if (stage) {
            stage.classList.add("is-stage-fading-out");
            window.setTimeout(() => {
              renderFullSubsystemsNetworkInPlace(stageTarget);
            }, 320);
          } else {
            renderFullSubsystemsNetworkInPlace(stageTarget);
          }
        }
      }
    }, true);

const renderTerritoryNetwork = () => {
      const view = document.getElementById("submodelsView");
      if (!view) return;
      const positions = [[12,18],[50,8],[88,18],[88,78],[50,91],[12,78]];
      const nodes = territorySystems.map((system, index) => { const [x,y] = positions[index]; return `<button type="button" class="territory-network-node" data-system-id="${system.id}" style="--node-x:${x}%;--node-y:${y}%;--node-color:${system.color}"><span class="territory-network-node-dot"></span><strong>${system.name}</strong></button>`; }).join("");
      const edges = territorySystems.map((system, index) => { const [x,y] = positions[index]; return `<line x1="50%" y1="50%" x2="${x}%" y2="${y}%" class="territory-network-edge" style="--edge-color:${system.color}"></line>`; }).join("") + territorySystems.map((system, index) => { const [x,y] = positions[index]; const next = positions[(index + 1) % positions.length]; return `<line x1="${x}%" y1="${y}%" x2="${next[0]}%" y2="${next[1]}%" class="territory-network-edge territory-network-edge-secondary" style="--edge-color:${system.color}"></line>`; }).join("");
      view.innerHTML = `<div class="territory-network-reading"><strong>¿Cómo creemos que se ordena este territorio?</strong><p>El Humedal El Burro está en el centro. Los seis sistemas se conectan entre sí; al tocar un nodo aparecen sus componentes, su dinámica temporal y su categoría.</p><div class="territory-network-stage"><svg class="territory-network-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edges}</svg><div class="territory-network-core"><button type="button" id="territoryNetworkCore" aria-label="Ver red completa"><span></span><strong>Humedal<br>El Burro</strong></button></div>${nodes}</div><div id="territorySystemDetail" class="territory-system-detail" aria-live="polite"><span>Selecciona una burbuja para ver qué contiene cada sistema.</span></div></div>`;
      view.querySelectorAll("[data-system-id]").forEach((button) => button.addEventListener("click", () => {
        const system = territorySystems.find((item) => item.id === button.dataset.systemId);
        if (!system) return;
        DINAMICA_SOUND.play(system.id);
        view.querySelectorAll("[data-system-id]").forEach((item) => item.classList.toggle("selected", item === button));
        const detail = document.getElementById("territorySystemDetail");
        if (detail) detail.innerHTML = `<div class="territory-detail-heading"><span style="--detail-color:${system.color}"></span><strong>${system.name}</strong></div>`;
      }));
      view.querySelector("#territoryNetworkCore")?.addEventListener("click", (event) => {
        event.stopPropagation();
        const stage = view.querySelector(".territory-network-stage");
        if (!stage || stage.dataset.opened === "true") return;
        stage.classList.add("territory-network-exploding");
        window.setTimeout(() => {
          const positions = [[18,18],[50,16],[82,18],[82,72],[50,84],[18,72]];
          const nodesHtml = [], linesHtml = [];
          territorySystems.forEach((system, si) => {
            const [cx, cy] = positions[si];
            const items = system.components || [];
            items.forEach((label, i) => {
              const angle = (i / Math.max(1, items.length)) * Math.PI * 2 - Math.PI / 2;
              const x = cx + Math.cos(angle) * 10, y = cy + Math.sin(angle) * 10;
              nodesHtml.push(`<span class="territory-component-node" style="left:${x}%;top:${y}%;--node-color:${system.color};--node-index:${nodesHtml.length}">${label}</span>`);
              if (i > 0) { const previousAngle = ((i - 1) / Math.max(1, items.length)) * Math.PI * 2 - Math.PI / 2; linesHtml.push(`<line x1="${cx + Math.cos(previousAngle) * 10}" y1="${cy + Math.sin(previousAngle) * 10}" x2="${x}" y2="${y}" class="territory-component-link"/>`); }
            });
          });
          for (let i = 0; i < territorySystems.length; i++) { const next = (i + 1) % territorySystems.length; linesHtml.push(`<line x1="${positions[i][0]}" y1="${positions[i][1]}" x2="${positions[next][0]}" y2="${positions[next][1]}" class="territory-system-link"/>`); }
          stage.innerHTML = `<svg class="territory-network-svg" viewBox="0 0 100 100" preserveAspectRatio="none">${linesHtml.join("")}</svg>${nodesHtml.join("")}`;
          stage.dataset.opened = "true";
          stage.classList.remove("territory-network-exploding");
          stage.classList.add("territory-network-components-visible");
        }, 850);
      });
    };
    const renderSubmodelsView = (mode = "subsystems") => {
      const view = document.getElementById("submodelsView");
      if (!view) return;
      if (mode === "subsystems") { renderTerritoryNetwork(); return; }
      const rows = submodelRows.map((row) => `<tr><th>${row.name}</th><td>${row.parts}</td><td>${row.partsPurpose}</td><td>${row.partsWhy}</td><td>${row.totalPurpose}</td><td>${row.totalWhy}</td><td><b>${row.category}</b></td><td>${row.process}</td></tr>`).join("");
      view.innerHTML = `<div class="submodels-reading"><strong>¿Cómo funciona y cambia el territorio?</strong><p>En esta tabla, las partes del submodelo son los sistemas territoriales que articula. El submodelo es una herramienta para organizar y analizar relaciones; no es un objeto territorial adicional.</p><div class="submodel-process-flow"><span>lluvia</span><i>→</i><span>escorrentía</span><i>→</i><span>Canal Los Ángeles</span><i>→</i><span>humedal</span><i>→</i><span>acumulación / salida</span></div><div class="submodels-table-wrap"><table class="submodels-table"><thead><tr><th>Submodelo</th><th>Sistemas que funcionan como sus partes</th><th>¿Las partes tienen propósito?</th><th>¿Por qué?</th><th>¿La totalidad tiene propósito?</th><th>¿Por qué?</th><th>Tipo de sistema que representa</th><th>¿Qué cambia en el tiempo?</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
    };
    const renderPartOneTable = () => {
      const body = document.getElementById("partOneTableBody");
      if (!body) return;
      body.innerHTML = table3Rows.map((row) => `<tr><th scope="row"><span class="table-color" style="--table-color:${row.color}"></span>${row.name}</th><td>${row.components}</td><td>${row.partsPurpose}</td><td>${row.totalPurpose}</td><td>${row.category}</td></tr>`).join("");
    };
    const submodelsQuestion = document.getElementById("submodelsQuestion");
    const submodelsWorkspace = document.getElementById("submodelsWorkspace");
    const viewSubsystemsBtn = document.getElementById("viewSubsystemsBtn");
    const viewSubmodelsBtn = document.getElementById("viewSubmodelsBtn");
    const directSubsystemsBtn = document.getElementById("directSubsystemsBtn");
    const directSubmodelsBtn = document.getElementById("directSubmodelsBtn");
    let currentSubmodelsMode = "subsystems";
    const setSubmodelsMode = (mode) => {
      currentSubmodelsMode = mode;
      const isSubsystems = mode === "subsystems";
      directSubsystemsBtn?.classList.toggle("active", isSubsystems);
      directSubmodelsBtn?.classList.toggle("active", !isSubsystems);
      viewSubsystemsBtn?.classList.toggle("active", isSubsystems);
      viewSubmodelsBtn?.classList.toggle("active", !isSubsystems);
      viewSubsystemsBtn?.setAttribute("aria-selected", String(isSubsystems));
      viewSubmodelsBtn?.setAttribute("aria-selected", String(!isSubsystems));
      renderSubmodelsView(mode);
      announceCartography(isSubsystems ? "PARTE I · SUBSISTEMAS DEL TERRITORIO" : "PARTE II · SUBMODELOS DINÁMICOS", true);
    };
    submodelsQuestion?.addEventListener("click", () => {
      const open = submodelsWorkspace?.hidden;
      if (!submodelsWorkspace) return;
      submodelsWorkspace.hidden = !open;
      submodelsQuestion.setAttribute("aria-expanded", String(open));
      if (open) setSubmodelsMode("subsystems");
    });
    viewSubsystemsBtn?.addEventListener("click", () => setSubmodelsMode("subsystems"));
    viewSubmodelsBtn?.addEventListener("click", () => setSubmodelsMode("submodels"));
    const territoryNetworkPlain = document.getElementById("territoryNetworkPlain");
    const territoryNetworkPlainWrap = document.getElementById("territoryNetworkPlainWrap");
    const openSubmodelsFromDirectButton = (mode) => {
      if (submodelsWorkspace?.hidden) {
        submodelsWorkspace.hidden = false;
        submodelsQuestion?.setAttribute("aria-expanded", "true");
      }
      setSubmodelsMode(mode);
    };
    const directCartographyBtn = document.getElementById("directCartographyBtn");
    // Subsistemas y Submodelos muestran SOLO la red (sin mapa, sin líneas de
    // coordenadas). Cartografía interactiva muestra el mapa real con las
    // líneas de coordenadas, pero sin conexiones entre las bolas grandes.
    function showPlainNetwork(networkMode, activeBtn) {
      const cartoSection = document.getElementById("cartographySection");
      if (cartoSection) cartoSection.hidden = true;
      if (territoryNetworkPlainWrap) territoryNetworkPlainWrap.hidden = false;
      [directSubsystemsBtn, directSubmodelsBtn, directCartographyBtn].forEach((btn) => btn?.classList.toggle("active", btn === activeBtn));
      renderMapNetwork(networkMode, true, territoryNetworkPlain, false);
    }
    // Las líneas moradas de las avenidas también esperan a que el mapa
    // llegue a Kennedy — aparecen con un fundido suave, no de una vez.
    function revealAvenueLines() {
      if (!componentPointMap) return;
      ["avenidas-referencia-line", "avenidas-referencia-labels"].forEach((id) => {
        if (componentPointMap.getLayer(id)) componentPointMap.setLayoutProperty(id, "visibility", "visible");
      });
      const targetOpacity = 0.62;
      let start = null;
      function step(ts) {
        if (!start) start = ts;
        const t = Math.min(1, (ts - start) / 700);
        if (componentPointMap.getLayer("avenidas-referencia-line")) componentPointMap.setPaintProperty("avenidas-referencia-line", "line-opacity", targetOpacity * t);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    function showCartography() {
      const cartoSection = document.getElementById("cartographySection");
      if (!cartoSection) return;
      if (territoryNetworkPlainWrap) territoryNetworkPlainWrap.hidden = true;
      cartoSection.hidden = false;
      [directSubsystemsBtn, directSubmodelsBtn, directCartographyBtn].forEach((btn) => btn?.classList.toggle("active", btn === directCartographyBtn));
      requestAnimationFrame(() => {
        componentPointMap?.resize();
        cartoSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
        if (componentPointMap && !componentPointMap.__openingPlayed) {
          // Primera vez: se ve el vuelo completo de Bogotá a Kennedy: las
          // bolitas y las líneas aparecen solas al terminar ese vuelo, no antes.
          runCartographyOpening(componentPointMap);
        } else {
          renderMapNetwork(currentSubmodelsMode === "subsystems" ? "systems" : "submodels", false, subsystemBubbles, true);
          revealAvenueLines();
        }
      });
    }
    directSubsystemsBtn?.addEventListener("click", () => { openSubmodelsFromDirectButton("subsystems"); showPlainNetwork("systems", directSubsystemsBtn); });
    document.getElementById("showFullSubsystemsNetworkBtn")?.addEventListener("click", (event) => { window.__openFullSubsystemsNetwork?.(event); });
    directSubmodelsBtn?.addEventListener("click", () => { openSubmodelsFromDirectButton("submodels"); showPlainNetwork("submodels", directSubmodelsBtn); });
    directCartographyBtn?.addEventListener("click", showCartography);
    renderSubmodelsView("subsystems");
    // Se difiere al siguiente tick: renderMapNetwork se declara más abajo en
    // este mismo archivo, y llamarla de inmediato aquí rompía todo el script
    // (error de "usar antes de declarar" que dejaba la página en blanco).
    // La apertura automática de Cartografía interactiva se dispara desde
    // dentro del evento real de carga del mapa (más abajo), una sola vez,
    // para que las bolitas salgan exactamente cuando termina el zoom a
    // Kennedy — no antes.
    const initPartOneControls = (map, layers) => {
      const controls = document.getElementById("subsystemLayerControls");
      if (controls) {
        controls.innerHTML = partOneLayerMeta.map((meta) => `<label class="layer-toggle"><input type="checkbox" data-layer-toggle="${meta.id}"><span class="layer-swatch" style="--layer-color:${meta.color}"></span><span><b>${meta.label}</b><small>${meta.description}</small></span></label>`).join("");
        controls.querySelectorAll("[data-layer-toggle]").forEach((input) => input.addEventListener("change", () => {
          const meta = partOneLayerMeta.find((item) => item.id === input.dataset.layerToggle);
          const layer = layers.find((item) => item.id === input.dataset.layerToggle);
          if (!meta || !layer) return;
          (meta.id === "hidrico" ? [layer.point, ...(layer.extras || [])] : [layer.fill, layer.line, layer.point, ...(layer.extras || [])]).forEach((id) => { if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", input.checked ? "visible" : "none"); }); (layer.markers || []).forEach((marker) => { marker.getElement().style.display = input.checked ? "grid" : "none"; marker.getElement().classList.toggle("is-visible", input.checked); });
          announceCartography(input.checked ? `${meta.label.toUpperCase()} · CAPA ACTIVA` : "CAPAS DEL MAPA · VISTA BASE", input.checked);
        }));
      }
      const stateControls = document.getElementById("temporalStateControls");
      const stateDescription = document.getElementById("temporalStateDescription");
      if (stateControls) {
        stateControls.innerHTML = temporalStates.map((state, index) => `<button type="button" class="temporal-state${index === 2 ? " active" : ""}" data-temporal-state="${state.id}">${state.label}</button>`).join("");
        const activateState = (state) => { stateControls.querySelectorAll(".temporal-state").forEach((button) => button.classList.toggle("active", button.dataset.temporalState === state.id)); if (stateDescription) stateDescription.textContent = state.description; map.flyTo({ center: [-74.150, 4.642], zoom: state.zoom, duration: 900, essential: true }); announceCartography(`ESTADO ${state.label.toUpperCase()} · HUMEDAL EL BURRO`, true); };
        stateControls.querySelectorAll("[data-temporal-state]").forEach((button) => button.addEventListener("click", () => activateState(temporalStates.find((state) => state.id === button.dataset.temporalState))));
        if (stateDescription) stateDescription.textContent = temporalStates[2].description;
      }
      renderPartOneTable();
    };

    // Cartografía funcional: base procedural + capas públicas opcionales.
    // ---------- Cartografía interactiva: 4 puntos calientes con el marco
    // de los 16 objetivos de modelado de Joshua Epstein ----------
    const EPSTEIN_HOTSPOTS = [
      {
        coords: [-74.1589146050763, 4.63015596902525],
        label: "Corabastos",
        icon: "fa-cart-shopping",
        title: "Modelo de Optimización de Abastecimiento y Logística Agroalimentaria",
        color: "#e58d62",
        up: ["Eficiencia en la distribución de la canasta básica alimentaria.", "Tasa de separación en la fuente de residuos y materia orgánica.", "Capacidad logística en horas pico de abastecimiento."],
        down: ["Pérdida y desperdicio de productos perecederos.", "Tiempos de espera y retrasos de camiones de gran tonelaje.", "Toneladas de residuos orgánicos sin procesar enviadas al relleno sanitario."],
        epsteinTitle: "Sugerir eficiencias y evaluar escenarios alternativos (Objetivo 10)",
        epsteinText: "El modelo evalúa cómo la reorganización de horarios de carga y la gestión interna de residuos orgánicos reduce el colapso vial circundante."
      },
      {
        coords: [-74.16184778855655, 4.62939492240078],
        label: "Humedal La Vaca",
        icon: "fa-droplet",
        title: "Modelo de Mitigación de Carga Orgánica y Escorrentía Hídrica",
        color: "#56b8d4",
        up: ["Niveles de oxígeno disuelto en el agua del humedal.", "Capacidad de infiltración natural en la franja calzada-borde.", "Capacidad de amortiguación hidráulica ante lluvias intensas."],
        down: ["Concentración de lixiviados contaminantes (fósforo, nitrógeno y materia orgánica).", "Escorrentía superficial contaminada sobre el asfalto de las vías.", "Riesgos de inundación en las vías habitadas del sector."],
        epsteinTitle: "Promover un pensamiento de sistema",
        epsteinText: "Desmitifica el supuesto de que el ecosistema del humedal puede autorregularse solo, demostrando matemáticamente que sin un control estructural de la escorrentía vial, colapsará por sobrecarga biológica."
      },
      {
        coords: [-74.14541150109216, 4.631221483859855],
        label: "Estación Banderas",
        icon: "fa-bus",
        title: "Modelo de Operación e Intermodalidad Peatonal",
        color: "#f1cf5b",
        up: ["Velocidad de transferencia de usuarios en los andenes y accesos.", "Frecuencia de despacho y sincronización de la flota de buses de apoyo.", "Accesibilidad e interconectividad peatonal de la estación."],
        down: ["Tiempos muertos de transbordo para los pasajeros.", "Saturación crítica y cuellos de botella en los puntos de control de la estación.", "Demoras totales en los viajes de los ciudadanos que usan el sistema integrado."],
        epsteinTitle: "Ofrecer opciones de respuesta ante crisis en tiempo real (Objetivo 8)",
        epsteinText: "Permite simular cambios operativos inmediatos en la asignación de flotas o rutas peatonales internas cuando el sistema experimenta un pico imprevisto de pasajeros."
      },
      {
        coords: [-74.14987475206779, 4.64210777486686],
        label: "Humedal El Burro / Vías",
        icon: "fa-dove",
        title: "Modelo de Impacto Acústico y Presión Vial",
        color: "#68d391",
        up: ["Confort y amortiguación acústica en la zona de reserva ecológica.", "Resiliencia del hábitat y zonas seguras para fauna silvestre."],
        down: ["Niveles de ruido (decibelios) generados por la rodadura de vehículos y motores.", "Interferencia acústica que desorienta los campos magnéticos de aves migratorias.", "Fragmentación del corredor ecológico por la barrera del tráfico pesado."],
        epsteinTitle: "Explicar mecanismos causales complejos (Objetivo 1)",
        epsteinText: "Demuestra científicamente la relación directa de causa-efecto entre el volumen y tipo de tráfico en las vías y la deserción de especies aviares en el humedal debido al estrés acústico."
      }
    ];

    function showEpsteinModal(spot) {
      const overlay = document.createElement("div");
      overlay.className = "combined-network-overlay epstein-side-overlay";
      const listHtml = (items) => `<ul class="epstein-list">${items.map((t) => `<li>${t}</li>`).join("")}</ul>`;
      overlay.innerHTML = `<div class="combined-network-panel epstein-modal-panel">
        <div class="combined-network-heading">
          <strong style="color:${spot.color}"><i class="fa-solid fa-location-dot"></i> ${spot.label}</strong>
          <button type="button" class="subsystem-panel-close" id="closeEpsteinBtn" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="combined-network-scroll epstein-modal-scroll">
          <h4 class="epstein-model-title">${spot.title}</h4>
          <div class="epstein-stat-row"><div class="epstein-stat-icon up">↑</div><div><b>Aumenta / maximiza</b>${listHtml(spot.up)}</div></div>
          <div class="epstein-stat-row"><div class="epstein-stat-icon down">↓</div><div><b>Disminuye / minimiza</b>${listHtml(spot.down)}</div></div>
          <div class="epstein-objective">
            <b>Objetivo de modelado científico · marco de Joshua Epstein</b>
            <p class="epstein-objective-title">${spot.epsteinTitle}</p>
            <p>${spot.epsteinText}</p>
          </div>
        </div>
      </div>`;
      document.body.appendChild(overlay);
      const close = () => overlay.remove();
      overlay.querySelector("#closeEpsteinBtn")?.addEventListener("click", close);
      overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
      requestAnimationFrame(() => overlay.classList.add("exploded"));
    }

    function addEpsteinHotspots(map) {
      EPSTEIN_HOTSPOTS.forEach((spot) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "epstein-hotspot";
        el.style.setProperty("--hotspot-color", spot.color);
        el.setAttribute("aria-label", `${spot.label}: ${spot.title}`);
        el.innerHTML = `<span class="epstein-hotspot-pulse"></span><span class="epstein-hotspot-dot"><i class="fa-solid ${spot.icon || "fa-location-dot"}"></i></span>`;
        el.addEventListener("click", (event) => { event.stopPropagation(); showEpsteinModal(spot); });
        new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(spot.coords).addTo(map);
      });
    }

    function initRealCartography() {
      const el = document.getElementById("realCartographyMap");
      if (!el || !window.maplibregl) return;
      const status = document.getElementById("mapDataStatus");
      const setStatus = (text, live = false) => { if (status) status.textContent = text; status?.parentElement?.classList.toggle("live", live); };
      const procedural = { type: "FeatureCollection", features: [
        [[-74.16,4.67],[-74.13,4.66],[-74.10,4.65],[-74.07,4.64],[-74.03,4.62]],
        [[-74.14,4.59],[-74.11,4.61],[-74.08,4.64],[-74.06,4.68],[-74.05,4.72]],
        [[-74.17,4.63],[-74.13,4.63],[-74.09,4.62],[-74.05,4.61],[-74.01,4.60]],
        [[-74.12,4.72],[-74.11,4.68],[-74.10,4.64],[-74.09,4.60],[-74.08,4.56]],
        [[-74.06,4.70],[-74.07,4.67],[-74.08,4.64],[-74.09,4.61],[-74.10,4.58]],
        [[-74.18,4.60],[-74.14,4.58],[-74.10,4.57],[-74.06,4.56],[-74.02,4.55]],
      ].map((coordinates) => ({ type: "Feature", properties: { layer: "procedural" }, geometry: { type: "LineString", coordinates } })) };
      const map = new maplibregl.Map({ container: el, center: [-74.09, 4.64], zoom: 10.55, minZoom: 10, maxZoom: 17, attributionControl: false, style: {
        version: 8,
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {
          "satellite": {
            type: "raster",
            tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "Esri, Maxar, Earthstar Geographics"
          }
        },
        layers: [
          { id: "satellite-layer", type: "raster", source: "satellite", minzoom: 0, maxzoom: 19 }
        ]
      } });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      const point = (id, coords, label, color) => { const marker = document.createElement("div"); marker.className = "cartography-marker"; marker.style.setProperty("--marker-color", color); marker.title = label; marker.textContent = id; new maplibregl.Marker({ element: marker }).setLngLat(coords).addTo(map); };
      map.on("load", () => { const burro = { type: "FeatureCollection", features: [{ type: "Feature", properties: { name: "Humedal El Burro" }, geometry: { type: "MultiPolygon", coordinates: [[[[ -74.168,4.644],[-74.163,4.646],[-74.1595,4.644],[-74.159,4.640],[-74.163,4.637],[-74.168,4.639],[-74.168,4.644]]],[[[-74.159,4.644],[-74.153,4.644],[-74.151,4.638],[-74.156,4.633],[-74.160,4.636],[-74.159,4.640],[-74.159,4.644]]]] } }] }; const context = { type: "FeatureCollection", features: [ { type: "Feature", properties: { name: "Avenida Ciudad de Cali", kind: "avenue" }, geometry: { type: "LineString", coordinates: [[-74.159,4.67],[-74.159,4.65],[-74.159,4.63],[-74.159,4.61]] } }, { type: "Feature", properties: { name: "Canal Los Ángeles", kind: "canal" }, geometry: { type: "LineString", coordinates: [[-74.181,4.649],[-74.174,4.645],[-74.167,4.641],[-74.158,4.637]] } }, { type: "Feature", properties: { name: "Ciclorruta", kind: "cycle" }, geometry: { type: "LineString", coordinates: [[-74.15,4.632],[-74.156,4.631],[-74.164,4.632],[-74.172,4.636]] } }, { type: "Feature", properties: { name: "Biblioteca El Tintal", kind: "library" }, geometry: { type: "Point", coordinates: [-74.156,4.633] } }, { type: "Feature", properties: { name: "Río Tunjuelo · cuenca", kind: "river" }, geometry: { type: "LineString", coordinates: [[-74.205,4.59],[-74.19,4.60],[-74.175,4.61],[-74.16,4.62]] } } ] }; const kennedyBoundary = {"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Kennedy","localidad":"KENNEDY","codigo":"08","source":"Datos Abiertos Bogotá · Localidad. Bogotá D.C."},"geometry":{"type":"Polygon","coordinates":[[[-74.18566586799994,4.647046420000038],[-74.18480577699995,4.64710603900005],[-74.18223128299991,4.649190830000066],[-74.18104801899995,4.650888759000054],[-74.18071633999995,4.651744809000093],[-74.18007628299995,4.652619764000065],[-74.17836874599993,4.6535760200000595],[-74.17755038699994,4.654251568000063],[-74.17657697699991,4.654784838000069],[-74.17541569999992,4.654476810000062],[-74.17490894799994,4.65473219200004],[-74.17419527899995,4.655710825000085],[-74.1723363879999,4.657143542000085],[-74.1718347659999,4.65729568900008],[-74.17090871799991,4.657169703000079],[-74.16948670399995,4.6562787170000774],[-74.16765389999995,4.656381716000055],[-74.16721588299993,4.656670988000087],[-74.16681193999995,4.657854081000039],[-74.16666043299995,4.659218951000071],[-74.16652575299992,4.659615244000065],[-74.16620746599995,4.659875045000092],[-74.16564105999993,4.659718038000051],[-74.16488707099995,4.658771439000077],[-74.1640404819999,4.658564630000058],[-74.16334660799993,4.659056026000087],[-74.16300201699994,4.659682826000051],[-74.16298376499992,4.662267569000051],[-74.16275917599995,4.662905126000055],[-74.1622879119999,4.663366415000041],[-74.16031904199991,4.662708184000053],[-74.15912992199992,4.6625321060000715],[-74.15857216899991,4.662739191000071],[-74.15787792399993,4.662349771000038],[-74.15707962499994,4.661530151000079],[-74.15657124299992,4.661788696000087],[-74.15582482499991,4.662923436000085],[-74.15534487699995,4.662904297000068],[-74.1550685489999,4.663086642000053],[-74.15456481099994,4.664266363000081],[-74.15401264799993,4.66395252500007],[-74.15364432799993,4.663904432000038],[-74.15140097299991,4.664249058000053],[-74.14995859099992,4.663618692000057],[-74.14754562299993,4.662271798000063],[-74.14635923399993,4.662018541000066],[-74.14592426299993,4.6617604890000734],[-74.14529840699993,4.661942542000077],[-74.14480488099991,4.661227502000088],[-74.14435899499995,4.661780810000039],[-74.14349946499993,4.6618364470000415],[-74.14254631199992,4.6626694750000865],[-74.14188568299994,4.662966991000076],[-74.14127326999994,4.662995017000071],[-74.14094493099992,4.662840281000058],[-74.14041136199995,4.66215489700005],[-74.14023428399992,4.66171188900006],[-74.1398823689999,4.661467323000068],[-74.13973767599992,4.660614787000043],[-74.13903306599991,4.660430523000059],[-74.13764583299991,4.65908375500004],[-74.1371247859999,4.658852248000073],[-74.13704582199995,4.658669832000044],[-74.13719088999994,4.658214263000048],[-74.13666746199993,4.657600061000039],[-74.13632842699991,4.657536776000086],[-74.13611587899993,4.6571595160000925],[-74.13379679999991,4.652476661000094],[-74.13326861199994,4.65123230800009],[-74.13321682899993,4.650544107000087],[-74.1328831589999,4.650047915000073],[-74.13238359299993,4.649633497000082],[-74.13231675299994,4.648894591000044],[-74.13146505499992,4.648769425000069],[-74.13101572499994,4.648999634000063],[-74.12917466999994,4.6485269780000635],[-74.12891194999992,4.6480182190000505],[-74.12565510399992,4.645238392000067],[-74.12444115399995,4.6417161310000665],[-74.1238123249999,4.640868656000066],[-74.12363468799992,4.640714341000091],[-74.1231016719999,4.641027805000078],[-74.12292439499993,4.640724481000063],[-74.12083715499995,4.639072073000079],[-74.11829863999992,4.637411585000052],[-74.11952362199992,4.636108055000079],[-74.12450254299995,4.623924209000052],[-74.1285488069999,4.610709857000074],[-74.1292653989999,4.608854531000077],[-74.13025688399995,4.606957474000069],[-74.13731327499994,4.596211642000071],[-74.13776618399993,4.594885111000053],[-74.14043263199994,4.5953642550000495],[-74.14258561399993,4.595472765000068],[-74.14401793799993,4.5953371910000556],[-74.14564112599993,4.594990322000058],[-74.14694430399993,4.594956015000093],[-74.15123612399992,4.5953925480000635],[-74.1522637029999,4.595686897000064],[-74.15187423299994,4.596326229000056],[-74.1512549819999,4.596568879000074],[-74.15057879499994,4.59631358300004],[-74.1500668029999,4.595625803000075],[-74.14977177999992,4.595619939000073],[-74.14967022499991,4.595831803000067],[-74.14974988999995,4.596123538000086],[-74.15043268699992,4.596936389000064],[-74.15070779299992,4.597499098000071],[-74.15120592399995,4.59790679300005],[-74.15149665299992,4.598405164000042],[-74.15196916699995,4.5987144150000745],[-74.15217783799994,4.5992499320000775],[-74.15215024699995,4.60047704200008],[-74.1522405419999,4.600682903000063],[-74.15247025299993,4.60089264700008],[-74.15349235299993,4.600983323000094],[-74.15368448499993,4.601424917000088],[-74.15475092499992,4.602512902000058],[-74.15542507899994,4.602921934000051],[-74.15658469899995,4.60307376500009],[-74.15683651599994,4.603989717000047],[-74.15913620599991,4.605313985000066],[-74.1626850479999,4.606284841000047],[-74.16329276599993,4.606317814000079],[-74.16437686799992,4.605815119000056],[-74.16535413799994,4.605526687000065],[-74.16744428399994,4.604410063000046],[-74.16812596799991,4.604393453000057],[-74.16859405199995,4.6042451390000565],[-74.16898005999991,4.603627128000085],[-74.16899643399995,4.602522757000088],[-74.16910319499993,4.602341402000093],[-74.16990803599992,4.602242513000078],[-74.17006406099995,4.6020612270000925],[-74.17017081199992,4.601558473000068],[-74.16994087099994,4.600841537000065],[-74.17008049399993,4.6005613090000566],[-74.17176506699991,4.60084078400007],[-74.17334454599995,4.600392086000056],[-74.17383837699992,4.6001102260000835],[-74.17400869499994,4.600169965000077],[-74.17441739899994,4.6007979850000424],[-74.1745323419999,4.601353343000085],[-74.17426413899994,4.601695159000087],[-74.17312283899992,4.6023577540000815],[-74.17290481599991,4.602685865000069],[-74.17288927599992,4.603154718000042],[-74.1738702749999,4.603123405000076],[-74.17554028799992,4.603424128000086],[-74.17590623799992,4.602939728000081],[-74.17573491599995,4.6021506170000634],[-74.17595284799995,4.6012444030000665],[-74.17628762899994,4.601025609000089],[-74.1773075399999,4.600900577000061],[-74.1777513479999,4.601072454000075],[-74.17770465399991,4.602080285000056],[-74.17628326099992,4.603156454000043],[-74.17611253899992,4.603623404000075],[-74.17611256299995,4.604404541000065],[-74.17658272099993,4.605332343000043],[-74.17670587799995,4.605126197000061],[-74.17747082099993,4.60518718700007],[-74.17799252499992,4.6049014370000805],[-74.17849510299993,4.60509400400008],[-74.17865515699992,4.605456917000083],[-74.17847268899993,4.606086580000067],[-74.1773790179999,4.606393042000093],[-74.1773856559999,4.60710369800006],[-74.17774376099993,4.60763496800007],[-74.17784497999992,4.608088069000075],[-74.1776737699999,4.608658409000043],[-74.17728445299991,4.609197470000083],[-74.17729227799992,4.609619429000077],[-74.17804755799995,4.610955197000067],[-74.17893541399991,4.611666531000083],[-74.18119265899992,4.6129593700000555],[-74.18143261099993,4.613703989000044],[-74.18190361099994,4.614261239000086],[-74.18128605099992,4.614713166000058],[-74.1800717349999,4.614940045000083],[-74.1794210459999,4.615936530000056],[-74.17949848099994,4.616428192000058],[-74.17985954499994,4.61690698600006],[-74.18007877899993,4.61701043700009],[-74.18053010699992,4.616544605000058],[-74.18158741899992,4.614797758000066],[-74.1820258759999,4.614655440000092],[-74.18223217099995,4.615004722000037],[-74.18297862999992,4.6153702940000585],[-74.18281508899992,4.615877853000086],[-74.1823699649999,4.616521017000082],[-74.18242592899992,4.616786477000062],[-74.18275221999994,4.617124385000068],[-74.18339316899994,4.617126688000042],[-74.18406208699992,4.616276527000082],[-74.18478534899992,4.615625371000078],[-74.18503864599995,4.615674936000062],[-74.1851295809999,4.615784746000088],[-74.18523458399994,4.618855054000051],[-74.1833800199999,4.61913239200004],[-74.18250406099992,4.618787870000062],[-74.18149250199991,4.619039391000058],[-74.18102285999993,4.619031782000093],[-74.1805240029999,4.618913088000056],[-74.18010445499993,4.618485777000046],[-74.17915238499995,4.619243503000064],[-74.17970714699993,4.619990723000058],[-74.17969314699991,4.620125821000045],[-74.17723766899991,4.622354772000051],[-74.17770741699991,4.623252276000073],[-74.17656066699993,4.6240200320000895],[-74.17700903699995,4.625476927000079],[-74.1773123879999,4.627931768000053],[-74.17780278899994,4.629681452000057],[-74.18566586799994,4.647046420000038]]]}}]}; map.addSource("kennedy-boundary", { type: "geojson", data: kennedyBoundary }); map.addLayer({ id: "kennedy-boundary-line", type: "line", source: "kennedy-boundary", paint: { "line-color": "#76fff0", "line-width": ["interpolate", ["linear"], ["zoom"], 10, .8, 14, 1.5], "line-opacity": .78, "line-dasharray": [2.2, 1.4] } }); map.addSource("burro", { type: "geojson", data: burro }); map.addSource("burro-context", { type: "geojson", data: context });
        const feature = (geometry, properties = {}) => ({ type: "Feature", properties, geometry });
        const poly = (coordinates, properties = {}) => feature({ type: "Polygon", coordinates: [coordinates] }, properties);
        const line = (coordinates, properties = {}) => feature({ type: "LineString", coordinates }, properties);
        const pt = (coordinates, properties = {}) => feature({ type: "Point", coordinates }, properties);
        const layerCollections = {
          hidrico: { type: "FeatureCollection", features: [...burro.features, ...context.features.filter((item) => item.properties.kind === "canal"),
            // Componentes de la dinámica hídrica a escala de Bogotá, como
            // puntos chiquitos y blancos. Las líneas que los conectan con la
            // bolita de "Dinámica hídrica" se dibujan aparte, como flujo
            // animado sobre la red de burbujas (ver renderMapNetwork).
            ...HIDRICA_COMPONENTS.map((c) => pt(c.coords, { label: c.label, kind: "water-point" }))
          ] },
          biotico: { type: "FeatureCollection", features: [poly([[-74.166,4.644],[-74.162,4.646],[-74.158,4.643],[-74.160,4.638],[-74.165,4.638],[-74.166,4.644]], { label: "hábitat y vegetación" }), poly([[-74.157,4.646],[-74.153,4.645],[-74.153,4.639],[-74.157,4.637],[-74.160,4.640],[-74.157,4.646]], { label: "hábitat y vegetación" }),
            ...BIOTICA_COMPONENTS.map((c) => pt(c.coords, { label: c.label, kind: "bio-point" }))
          ] },
          infraestructura: { type: "FeatureCollection", features: [line([[-74.159,4.67],[-74.159,4.65],[-74.159,4.63],[-74.159,4.61]], { label: "Avenida Ciudad de Cali" }), poly([[-74.153,4.651],[-74.148,4.651],[-74.148,4.647],[-74.153,4.647],[-74.153,4.651]], { label: "área construida" }), poly([[-74.169,4.632],[-74.165,4.632],[-74.165,4.628],[-74.169,4.628],[-74.169,4.632]], { label: "borde urbano" }),
            ...FISICO_COMPONENTS.map((c) => pt(c.coords, { label: c.label, kind: "fisico-point" }))
          ] },
          movilidad: { type: "FeatureCollection", features: [line([[-74.15,4.632],[-74.156,4.631],[-74.164,4.632],[-74.172,4.636]], { label: "ciclorruta" }), line([[-74.154,4.65],[-74.158,4.646],[-74.161,4.64],[-74.165,4.635]], { label: "recorrido peatonal" }), pt([-74.156,4.633], { label: "Biblioteca El Tintal · acceso" })] },
          social: { type: "FeatureCollection", features: [poly([[-74.176,4.65],[-74.168,4.65],[-74.168,4.643],[-74.176,4.643],[-74.176,4.65]], { label: "barrio y recorridos" }), poly([[-74.151,4.634],[-74.143,4.634],[-74.143,4.626],[-74.151,4.626],[-74.151,4.634]], { label: "barrio y recorridos" }), pt([-74.164,4.651], { label: "actividad pedagógica" })] },
          socioeconomico: { type: "FeatureCollection", features: [poly([[-74.170,4.651],[-74.160,4.651],[-74.160,4.644],[-74.170,4.644],[-74.170,4.651]], { label: "ocupación urbana" }), poly([[-74.154,4.637],[-74.146,4.637],[-74.146,4.629],[-74.154,4.629],[-74.154,4.637]], { label: "actividad económica" }), pt([-74.157,4.645], { label: "equipamiento y servicios" })] },
          institucional: { type: "FeatureCollection", features: [pt([-74.163,4.638], { label: "restauración y mantenimiento" }), pt([-74.157,4.648], { label: "seguimiento" }), pt([-74.166,4.635], { label: "educación ambiental" })] }
        };
        const partOneMapLayers = [];
        const waterMarkers = [];
        partOneLayerMeta.forEach((meta) => {
          const sourceId = `part1-${meta.id}`; const fillId = `${sourceId}-fill`; const lineId = `${sourceId}-line`; const pointId = `${sourceId}-point`;
          map.addSource(sourceId, { type: "geojson", data: layerCollections[meta.id] });
          map.addLayer({ id: fillId, type: "fill", source: sourceId, paint: { "fill-color": meta.color, "fill-opacity": .18 }, layout: { visibility: "none" } });
          map.addLayer({ id: lineId, type: "line", source: sourceId, filter: ["!=", ["get", "kind"], "hidrica-link"], paint: { "line-color": meta.color, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.2, 14, 3], "line-opacity": .86 }, layout: { visibility: "none" } });
          map.addLayer({ id: pointId, type: "circle", source: sourceId, filter: ["==", ["geometry-type"], "Point"], paint: {
            "circle-color": ["match", ["get", "kind"], "water-point", "#ffffff", "bio-point", "#ffffff", "fisico-point", "#ffffff", meta.color],
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3, 14, 6],
            "circle-opacity": ["match", ["get", "kind"], "water-point", .95, "bio-point", .95, "fisico-point", .95, 1],
            "circle-stroke-color": "#070b0c",
            "circle-stroke-width": ["match", ["get", "kind"], "water-point", 1, "bio-point", 1, "fisico-point", 1, 1.5]
          }, layout: { visibility: "none" } });
          const labelId = `${sourceId}-labels`;
          if (meta.id === "hidrico") map.addLayer({ id: labelId, type: "symbol", source: sourceId, filter: ["==", ["get", "kind"], "water-point"], layout: { visibility: "none", "text-field": ["get", "label"], "text-size": ["interpolate", ["linear"], ["zoom"], 10, 7, 14, 9], "text-offset": [0, 1.35], "text-anchor": "top", "text-allow-overlap": true }, paint: { "text-color": "#b9e5ea", "text-halo-color": "#061113", "text-halo-width": 1.5 } });
          if (meta.id === "biotico") map.addLayer({ id: labelId, type: "symbol", source: sourceId, filter: ["==", ["get", "kind"], "bio-point"], layout: { visibility: "none", "text-field": ["get", "label"], "text-size": ["interpolate", ["linear"], ["zoom"], 10, 7, 14, 9], "text-offset": [0, 1.35], "text-anchor": "top", "text-allow-overlap": true }, paint: { "text-color": "#c9f2d6", "text-halo-color": "#061309", "text-halo-width": 1.5 } });
          if (meta.id === "infraestructura") map.addLayer({ id: labelId, type: "symbol", source: sourceId, filter: ["==", ["get", "kind"], "fisico-point"], layout: { visibility: "none", "text-field": ["get", "label"], "text-size": ["interpolate", ["linear"], ["zoom"], 10, 7, 14, 9], "text-offset": [0, 1.35], "text-anchor": "top", "text-allow-overlap": true }, paint: { "text-color": "#dfe3e8", "text-halo-color": "#0a0c0d", "text-halo-width": 1.5 } });
          partOneMapLayers.push({ id: meta.id, fill: fillId, line: lineId, point: pointId, extras: (meta.id === "hidrico" || meta.id === "biotico" || meta.id === "infraestructura") ? [labelId] : [], markers: [] });
        });
        componentPointMap = map;
        // Avenida Ciudad de Cali (coordenadas reales que diste, de sur a
        // norte) y Avenida de las Américas, en línea morada delgada.
        map.addSource("avenidas-referencia", { type: "geojson", data: { type: "FeatureCollection", features: [
          { type: "Feature", properties: { label: "Avenida Ciudad de Cali" }, geometry: { type: "LineString", coordinates: [
            [-74.18291458629838, 4.61987589910068],
            [-74.17783504750913, 4.625197421439991],
            [-74.17179126952325, 4.627724599104445],
            [-74.16919686693828, 4.629399584041981],
            [-74.16601282780427, 4.632220602237944],
            [-74.16182640597988, 4.63548239049773],
            [-74.1565649728385, 4.640976777850417],
            [-74.15592192918001, 4.64010873889262],
            [-74.15749729510853, 4.639246968855656],
            [-74.14673045967228, 4.649430692986774],
            [-74.13862528302967, 4.6565927311303135],
            [-74.11049632038453, 4.68821351420676]
          ] } },
          { type: "Feature", properties: { label: "Avenida de las Américas" }, geometry: { type: "LineString", coordinates: [
            [-74.15630796889592, 4.639655873553835],
            [-74.1502522191673, 4.632428898507104],
            [-74.14149649622178, 4.630699233503572],
            [-74.12596161183357, 4.629119030783527],
            [-74.10844006182661, 4.62789831664558],
            [-74.08683159566945, 4.624876830893459]
          ] } },
          { type: "Feature", properties: { label: "Avenida Boyacá" }, geometry: { type: "LineString", coordinates: [
            [-74.14371860090965, 4.584983752398406],
            [-74.14137757373189, 4.608203450255872],
            [-74.13773608642116, 4.631493746467614],
            [-74.13703703329347, 4.636242554055086],
            [-74.12075222037693, 4.656380463023536],
            [-74.10944594798171, 4.668726182128907]
          ] } }
        ] } });
        map.addLayer({ id: "avenidas-referencia-line", type: "line", source: "avenidas-referencia", layout: { visibility: "none" }, paint: { "line-color": "#c9a9ef", "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.7, 14, 3.0], "line-opacity": .62 } });
        map.addLayer({ id: "avenidas-referencia-labels", type: "symbol", source: "avenidas-referencia", layout: { visibility: "none", "symbol-placement": "line", "text-field": ["get", "label"], "text-size": 9, "text-offset": [0, -0.8] }, paint: { "text-color": "#d9c8f5", "text-halo-color": "#0a0612", "text-halo-width": 1.3 } });
        map.addSource("subsystem-component-points", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "subsystem-component-point-halo", type: "circle", source: "subsystem-component-points", paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 8, 14, 13], "circle-color": ["coalesce", ["get", "color"], "#ffffff"], "circle-opacity": .18, "circle-blur": .35 }, layout: { visibility: "none" } });
        map.addLayer({ id: "subsystem-component-points", type: "circle", source: "subsystem-component-points", paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3.8, 14, 6.5], "circle-color": ["coalesce", ["get", "color"], "#ffffff"], "circle-opacity": .96, "circle-stroke-color": "#f5ffff", "circle-stroke-width": 1.1, "circle-stroke-opacity": .76 }, layout: { visibility: "none" } });
        map.on("mouseenter", "subsystem-component-points", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "subsystem-component-points", () => { map.getCanvas().style.cursor = ""; });
        map.on("click", "subsystem-component-points", (event) => { const feature = event.features?.[0]; if (!feature) return; const properties = feature.properties || {}; const meta = properties.code ? `${escapePointText(properties.code)} · ${escapePointText(properties.subsystem || "Subsistema")}` : escapePointText(properties.subsystem || "Subsistema"); new maplibregl.Popup({ offset: 9, className: "component-point-popup" }).setLngLat(feature.geometry.coordinates).setHTML(`<strong>${escapePointText(properties.label || "Componente")}</strong><span>${meta}</span>`).addTo(map); });
        /* Las gotitas decorativas se mantienen retiradas; el agua se lee mediante su cartografía y puntos de componentes. */
        const waterLayer = partOneMapLayers.find((layer) => layer.id === "hidrico"); if (waterLayer) waterLayer.markers = []; map.__waterMarkers = [];
        initPartOneControls(map, partOneMapLayers);
        // Ya NO se recalcula la posición al mover/hacer zoom: una vez que
        // aparece, queda fija como un plano — sin bailar ni deformarse.
        setStatus("BOGOTÁ · LECTURA GENERAL", true); setupCartographyEntrance(map);
        // Cartografía interactiva NO se abre sola: lo primero que se ve al
        // entrar al módulo son los Subsistemas del territorio (sin mapa).
        // El vuelo Bogotá→Kennedy solo pasa cuando el usuario hace click en
        // el botón "Cartografía interactiva".
      });
      const loadOsm = async () => { const query = `[out:json][timeout:20];way[highway~"^(motorway|trunk|primary|secondary|tertiary)$"](around:4200,4.64,-74.09);out geom;`; setStatus("CARGANDO CALLES OSM…"); const controller = new AbortController(); const timer = window.setTimeout(() => controller.abort(), 12000); try { let response; for (const endpoint of ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"]) { try { response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, { signal: controller.signal, headers: { Accept: "application/json" } }); if (response.ok) break; } catch (error) { /* prueba el siguiente endpoint público */ } } if (!response?.ok) throw new Error("Overpass sin respuesta"); const data = await response.json(); const features = data.elements.filter((x) => x.geometry?.length > 1).map((x) => ({ type: "Feature", properties: { highway: x.tags?.highway || "road" }, geometry: { type: "LineString", coordinates: x.geometry.map((p) => [p.lon, p.lat]) } })); const geo = { type: "FeatureCollection", features }; if (map.getSource("osm-streets")) map.getSource("osm-streets").setData(geo); else { map.addSource("osm-streets", { type: "geojson", data: geo }); map.addLayer({ id: "osm-streets", type: "line", source: "osm-streets", paint: { "line-color": "#8fa7a4", "line-width": ["interpolate", ["linear"], ["zoom"], 10, .7, 14, 1.8], "line-opacity": .62 } }); } setStatus(`${features.length} CALLES OSM CARGADAS`, true); } catch (error) { setStatus("MAPA OSM DISPONIBLE · CALLES EN RESPALDO"); toast("Overpass no respondió; el plano monocromático sigue disponible"); } finally { window.clearTimeout(timer); } };
      const loadRoute = async () => { const coords = [[-74.13,4.66],[-74.09,4.64],[-74.05,4.61],[-74.08,4.57]]; setStatus("CALCULANDO RUTA OSRM…"); try { const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords.map((c) => c.join(",")).join(";")}?overview=full&geometries=geojson`); if (!response.ok) throw new Error("OSRM " + response.status); const data = await response.json(); const route = data.routes?.[0]?.geometry; if (!route) throw new Error("Sin ruta"); if (map.getSource("osrm-route")) map.getSource("osrm-route").setData(route); else { map.addSource("osrm-route", { type: "geojson", data: route }); map.addLayer({ id: "osrm-route", type: "line", source: "osrm-route", paint: { "line-color": "#f76fb0", "line-width": 4, "line-opacity": .95 } }); } setStatus("RUTA OSRM ACTIVA", true); } catch (error) { setStatus("NO SE PUDO CALCULAR LA RUTA"); toast("OSRM no respondió; conserva los flujos procedurales"); } };
      document.getElementById("loadOsmStreets")?.addEventListener("click", loadOsm);
      /* Las calles OSM quedan como acción manual y no se cargan al abrir el mapa. */
      document.getElementById("loadOsrmRoute")?.addEventListener("click", loadRoute);
      document.getElementById("resetCartography")?.addEventListener("click", () => { if (map.getLayer("osm-streets")) map.removeLayer("osm-streets"); if (map.getSource("osm-streets")) map.removeSource("osm-streets"); if (map.getLayer("osrm-route")) map.removeLayer("osrm-route"); if (map.getSource("osrm-route")) map.removeSource("osrm-route"); clearSubsystemPoints(); drawSubsystems({ hidden: true }); map.jumpTo({ center: [-74.158,4.629], zoom: 13.3 }); setStatus("HUMEDAL EL BURRO · CARTOGRAFÍA LISTA", true); });
    }
    function initProceduralSimulation() {
      const holder = document.getElementById("proceduralSimulation");
      if (!holder || !window.p5 || !window.Matter) return;
      const { Engine, Bodies, Composite, Body } = window.Matter;
      new window.p5((p) => {
        let engine, agents = [], w = 700, h = 330;
        const palette = ["#f76fb0", "#f5a623", "#46d6d0", "#b08cff"];
        p.setup = () => {
          const canvas = p.createCanvas(holder.clientWidth || 700, holder.clientHeight || 330);
          canvas.parent(holder); canvas.elt.setAttribute("aria-label", "Agentes procedurales en movimiento");
          canvas.elt.style.pointerEvents = "none";
          w = p.width; h = p.height; engine = Engine.create({ enableSleeping: false }); engine.gravity.x = 0; engine.gravity.y = 0;
          agents = Array.from({ length: 18 }, (_, i) => { const body = Bodies.circle(35 + (i * 37) % Math.max(100, w - 70), 35 + (i * 23) % Math.max(100, h - 70), 5, { restitution: 1, frictionAir: .025, label: "agente" }); Composite.add(engine.world, body); Body.setVelocity(body, { x: (i % 2 ? 1 : -1) * (.25 + (i % 3) * .12), y: i % 3 === 0 ? .18 : -.14 }); return { body, color: palette[i % palette.length], role: ["cuidado", "trabajo", "niñez", "evacuación"][i % 4] }; });
        };
        p.draw = () => { p.clear(); Engine.update(engine, 1000 / 60); agents.forEach((a) => { const b = a.body; if (b.position.x < 12 || b.position.x > w - 12) Body.setVelocity(b, { x: -b.velocity.x, y: b.velocity.y }); if (b.position.y < 12 || b.position.y > h - 12) Body.setVelocity(b, { x: b.velocity.x, y: -b.velocity.y }); p.noStroke(); p.fill(a.color); p.circle(b.position.x, b.position.y, 12); p.fill("rgba(7,16,15,.9)"); p.circle(b.position.x, b.position.y, 3); }); p.fill("rgba(242,236,227,.7)"); p.textSize(9); p.textStyle(p.BOLD); p.text("AGENTES EN MOVIMIENTO · MATTER.JS", 14, h - 12); };
        p.windowResized = () => { const nw = holder.clientWidth || 700; const nh = holder.clientHeight || 330; p.resizeCanvas(nw, nh); w = nw; h = nh; };
      });
    }
    const identifySubsystems = document.getElementById("identifySubsystems");
    const subsystemsPanel = document.getElementById("subsystemsPanel");
    identifySubsystems?.addEventListener("click", () => {
      if (!subsystemsPanel) return;
      subsystemsPanel.hidden = !subsystemsPanel.hidden;
      identifySubsystems.classList.toggle("active", !subsystemsPanel.hidden);
      if (!subsystemsPanel.hidden) renderMapNetwork("systems", false); else clearMapNetwork();
    });
    const subsystemBubbles = document.getElementById("subsystemBubbles");
    const subsystemData = partOneRows.map((row, index) => ({
      name: row.name,
      short: ["DINÁMICA\nHÍDRICA", "DINÁMICA\nBIÓTICA", "TRANSFORMACIÓN DE\nINFRAESTRUCTURA", "MOVILIDAD Y\nACCESIBILIDAD", "USOS Y ORGANIZACIÓN\nSOCIAL", "GESTIÓN, MONITOREO\nY RESTAURACIÓN"][index],
      color: row.color,
      x: [14, 39, 75, 87, 65, 22][index],
      y: [18, 13, 18, 63, 86, 82][index],
      componentsText: row.components,
      process: row.process,
      partsPurpose: row.partsPurpose,
      totalPurpose: row.totalPurpose,
      category: row.category,
      justification: row.justification,
      mapKey: ["hidrico", "biotico", "infraestructura", "movilidad", "social", "institucional"][index]
    }));
    let componentPointMap = null;
    const componentPointCatalog = {
      hidrico: HIDRICA_COMPONENTS.map((c) => ({ coords: c.coords, label: c.label, code: null })),
      biotico: BIOTICA_COMPONENTS.map((c) => ({ coords: c.coords, label: c.label, code: null })),
      infraestructura: FISICO_COMPONENTS.map((c) => ({ coords: c.coords, label: c.label, code: null })),
      // Sin coordenadas reales dadas para estos sistemas: no se muestran
      // bolitas extra al hacer click (antes eran puntos inventados).
      movilidad: [],
      social: [],
      institutional: []
    };
    const escapePointText = (value) => String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\\\"": "&quot;" }[char] || char));
    const getComponentPoints = (item) => (componentPointCatalog[item?.mapKey] || []).map((point, index) => ({ ...point, index, color: item.color }));
    // Diagrama ilustrado de "Dinámica hídrica": un humedal/canal estilizado
    // (como el referente que mandaste) con líneas de guía señalando cada
    // ciclo o dinámica que ocurre en general en la red hídrica de Bogotá
    // — no es un mapa de un lugar puntual, es un esquema general.
    // Mini-red de un subsistema: sus DINÁMICAS/CICLOS reales (no sustantivos
    // fijos como "aves" o "vías"), con el texto DENTRO de cada bola, y TODAS
    // conectadas con TODAS (no solo con la siguiente) — para mostrar que
    // cualquier dinámica puede afectar a cualquier otra, no una secuencia.
    function buildMiniNetworkSvg(items, color, systemId) {
      const cx = 150, cy = 108, R = 82, nodeR = 34;
      const n = items.length;
      const nodes = items.map((label, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        return { label, x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
      });
      // TODAS las dinámicas conectadas con TODAS (malla completa)
      let lines = "";
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          lines += `<line x1="${nodes[i].x.toFixed(1)}" y1="${nodes[i].y.toFixed(1)}" x2="${nodes[j].x.toFixed(1)}" y2="${nodes[j].y.toFixed(1)}" class="mini-net-line"/>`;
        }
      }
      const nodeCircles = nodes.map((p) =>
        `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${nodeR}" class="mini-net-node" style="--node-color:${color}"/>` +
        `<foreignObject x="${(p.x - nodeR + 4).toFixed(1)}" y="${(p.y - nodeR + 4).toFixed(1)}" width="${(nodeR - 4) * 2}" height="${(nodeR - 4) * 2}"><div xmlns="http://www.w3.org/1999/xhtml" class="mini-net-node-text">${p.label}</div></foreignObject>`
      ).join("");
      return `<svg viewBox="0 0 300 220" class="mini-network-svg" data-system="${systemId}">${lines}${nodeCircles}</svg>`;
    }

    // "Ver toda la red junta": explota los 6 subsistemas con TODOS sus
    // componentes reales en una sola red grande, conectados entre sí —
    // los 6 subsistemas siempre conectados entre ellos, y sus componentes
    // conectados a su propio subsistema, más algunas conexiones cruzadas
    // por palabras en común (por ejemplo "vías" en físico y "rutas de
    // transporte" en movilidad).
    // Igual que showCombinedNetworkModal, pero en vez de abrir un modal
    // aparte, reemplaza el contenido DENTRO del mismo panel donde estaban
    // las 6 bolas — así da la sensación de que las 6 se convierten en 30.
    // =========================================================================
    // RED COMPLETA DE DINÁMICA URBANA (30 ELEMENTOS Y FLUJOS VIVOS)
    // =========================================================================
    // =========================================================================
    // RED COMPLETA UNIFICADA DE DINÁMICA URBANA (30 ELEMENTOS VIVOS EN 1 SOLA RED)
    // =========================================================================
    // =========================================================================
    // RED COMPLETA UNIFICADA DE DINÁMICA URBANA (30 ELEMENTOS TOTALMENTE INTERCONECTADOS)
    // =========================================================================
    // =========================================================================
    // RED COMPLETA UNIFICADA DE DINÁMICA URBANA (30 ELEMENTOS VIVOS TOTALMENTE CONECTADOS)
    // =========================================================================
    // =========================================================================
    // RED COMPLETA UNIFICADA DE DINÁMICA URBANA (30 ELEMENTOS VIVOS EN 6 SECTORES)
    // =========================================================================
    // =========================================================================
    // RED COMPLETA INTEGRADA DE DINÁMICA URBANA (30 NODOS INTEGRADOS SIN HUECO CENTRAL)
    // =========================================================================
    const PARENT_SYSTEM_CENTERS = {
      hidrica: { x: 23, y: 40 },
      biotica: { x: 43, y: 16 },
      fisico: { x: 67, y: 16 },
      movilidad: { x: 82, y: 42 },
      social: { x: 68, y: 76 },
      socioeconomico: { x: 30, y: 76 }
    };

    const UNIFIED_URBAN_ELEMENTS = [
      // --- NÚCLEO CENTRAL INTEGRADO (6 hubs conectores en el corazón del mapa) ---
      { id: "h_humedales", corto: "Agua en\nhumedales", name: "Ciclos de agua en\nhumedales y lagunas", icon: "fa-droplet", systemId: "hidrica", color: "#56b8d4", x: 42, y: 42, desc: "Ciclos hídricos, retención y amortiguamiento en los espejos de agua de El Burro y La Vaca.", connects: ["h_infiltra", "h_escorre", "b_flora", "se_vivienda", "s_cuidado", "h_desborde", "b_aves_res"] },
      { id: "b_flora", corto: "Cobertura\nvegetal", name: "Crecimiento de la\ncobertura vegetal", icon: "fa-leaf", systemId: "biotica", color: "#68d391", x: 58, y: 38, desc: "Juncos, eneas, vegetación de ronda y árboles que estabilizan los taludes.", connects: ["h_humedales", "b_aves_res", "b_insectos", "f_impermeable", "b_aves_mig", "h_escorre"] },
      { id: "f_impermeable", corto: "Suelo\nsellado", name: "Sellamiento del suelo\npor superficies duras", icon: "fa-layer-group", systemId: "fisico", color: "#b8c0c8", x: 62, y: 50, desc: "Asfalto y losas de concreto que impiden la infiltración pluvial.", connects: ["b_flora", "m_peatonal", "f_edificios", "f_andenes", "se_vivienda", "f_vias"] },
      { id: "m_peatonal", corto: "Flujos\npeatonales", name: "Flujos peatonales\ncotidianos", icon: "fa-person-walking-arrow-right", systemId: "movilidad", color: "#f1cf5b", x: 56, y: 62, desc: "Caminatas cotidianas de residentes hacia estaciones, colegios y comercio.", connects: ["f_impermeable", "s_cuidado", "s_vecinos", "m_transporte", "m_ciclorrutas", "f_andenes"] },
      { id: "s_cuidado", corto: "Trabajo de\ncuidado", name: "Trabajo de cuidado\ny voluntariado", icon: "fa-hand-holding-heart", systemId: "social", color: "#ee9a4b", x: 42, y: 62, desc: "Jornadas de siembra comunitaria, limpieza de canales y monitoreo biológico.", connects: ["m_peatonal", "se_vivienda", "s_vecinos", "s_conflictos", "h_humedales", "s_org_amb"] },
      { id: "se_vivienda", corto: "Vivienda\ny hogares", name: "Ciclos de la vivienda\ny los hogares", icon: "fa-house-chimney", systemId: "socioeconomico", color: "#e58d62", x: 36, y: 50, desc: "Unidades habitacionales que demandan servicios, movilidad y espacios de cuidado.", connects: ["s_cuidado", "h_humedales", "f_impermeable", "se_equipamientos", "se_comercio", "h_infiltra"] },

      // --- ZONA INTERMEDIA (12 nodos de transición) ---
      { id: "h_infiltra", corto: "Agua que\ninfiltra", name: "Recarga del suelo\npor infiltración", icon: "fa-water", systemId: "hidrica", color: "#56b8d4", x: 28, y: 32, desc: "Capacidad de absorción natural del suelo y amortiguamiento freático.", connects: ["h_humedales", "h_lluvia", "h_escorre", "se_comercio", "h_desborde", "se_vivienda"] },
      { id: "h_escorre", corto: "Agua por\ncanales", name: "Conducción del agua\npor canales", icon: "fa-arrows-split-up-and-left", systemId: "hidrica", color: "#56b8d4", x: 38, y: 22, desc: "Canal Los Ángeles y colectores que conducen el agua superficial.", connects: ["h_infiltra", "h_humedales", "h_lluvia", "b_insectos", "b_flora", "b_aves_mig"] },
      { id: "b_insectos", corto: "Cadena\ntrófica", name: "Polinización y\ncadena trófica", icon: "fa-bug", systemId: "biotica", color: "#68d391", x: 54, y: 20, desc: "Arañas tejedoras, abejas y libélulas que sostienen la cadena trófica.", connects: ["h_escorre", "b_flora", "b_aves_mig", "b_aves_res", "b_refugio"] },
      { id: "b_aves_res", corto: "Fauna\nresidente", name: "Ciclos de vida de\nla fauna residente", icon: "fa-crow", systemId: "biotica", color: "#68d391", x: 70, y: 34, desc: "Monjitas bogotanas, mirlas y fauna local con ciclos continuos en el ecosistema.", connects: ["b_flora", "b_insectos", "b_refugio", "f_cerramientos", "f_impermeable", "h_humedales"] },
      { id: "f_edificios", corto: "Vivienda\nconstruida", name: "Densificación de\nla vivienda construida", icon: "fa-city", systemId: "fisico", color: "#b8c0c8", x: 76, y: 44, desc: "Conjuntos habitacionales y manzanas construidas sobre el borde del humedal.", connects: ["f_impermeable", "f_cerramientos", "f_vias", "se_vivienda", "f_andenes"] },
      { id: "f_andenes", corto: "Espacio\npúblico", name: "Uso cotidiano del\nespacio público", icon: "fa-person-walking", systemId: "fisico", color: "#b8c0c8", x: 72, y: 58, desc: "Superficies peatonales, plazoletas y senderos perimetrales.", connects: ["f_impermeable", "f_vias", "m_peatonal", "m_transporte", "f_edificios"] },
      { id: "m_transporte", corto: "Transporte\nmasivo", name: "Operación del\ntransporte masivo", icon: "fa-bus", systemId: "movilidad", color: "#f1cf5b", x: 70, y: 70, desc: "Flota de TransMilenio y SITP que conecta Kennedy con el resto de Bogotá.", connects: ["f_andenes", "m_peatonal", "m_estaciones", "m_congestion", "m_ciclorrutas"] },
      { id: "m_ciclorrutas", corto: "Viajes en\nbicicleta", name: "Viajes en bicicleta\npor ciclorrutas", icon: "fa-bicycle", systemId: "movilidad", color: "#f1cf5b", x: 54, y: 76, desc: "Red de ciclorrutas de El Tintal y Av. Cali para viajes limpios de proximidad.", connects: ["m_peatonal", "m_congestion", "s_vecinos", "s_conflictos", "m_transporte"] },
      { id: "s_vecinos", corto: "Habitar\nel barrio", name: "Habitar cotidiano\ndel barrio", icon: "fa-people-roof", systemId: "social", color: "#ee9a4b", x: 46, y: 72, desc: "Comunidades de los barrios circundantes que habitan y recorren el sector.", connects: ["m_peatonal", "s_cuidado", "m_ciclorrutas", "s_conflictos", "se_vivienda", "s_org_amb"] },
      { id: "s_conflictos", corto: "Conflicto\nvecinal", name: "Conflicto y\nacuerdo vecinal", icon: "fa-comments", systemId: "social", color: "#ee9a4b", x: 36, y: 74, desc: "Mecanismos de resolución comunitaria frente a presiones de uso y residuos.", connects: ["s_cuidado", "s_vecinos", "m_ciclorrutas", "s_org_amb", "se_equipamientos", "se_vivienda"] },
      { id: "se_equipamientos", corto: "Servicios\nde cuidado", name: "Servicios de cuidado\nen las manzanas", icon: "fa-building-shield", systemId: "socioeconomico", color: "#e58d62", x: 26, y: 60, desc: "Equipamientos sociales que reducen sobrecargas en las personas cuidadoras.", connects: ["se_vivienda", "s_cuidado", "s_conflictos", "se_biblioteca", "se_suelo", "se_comercio"] },
      { id: "se_comercio", corto: "Abasto\ndiario", name: "Abastecimiento e\nintercambio diario", icon: "fa-cart-shopping", systemId: "socioeconomico", color: "#e58d62", x: 24, y: 46, desc: "Corabastos y locales de proximidad; nodos de intercambio y abastecimiento.", connects: ["se_vivienda", "h_infiltra", "se_suelo", "f_edificios", "se_equipamientos"] },

      // --- PERÍMETRO EXTERIOR (12 dinámicas de borde) ---
      { id: "h_lluvia", corto: "Lluvia\nextrema", name: "Recarga por lluvia\ny eventos extremos", icon: "fa-cloud-showers-heavy", systemId: "hidrica", color: "#56b8d4", x: 16, y: 18, desc: "Aporte pluvial constante y eventos de lluvia extrema que recargan la cuenca.", connects: ["h_infiltra", "h_escorre", "h_desborde"] },
      { id: "h_desborde", corto: "Desborde\ny arrastre", name: "Desborde y arrastre\nde sedimentos", icon: "fa-triangle-exclamation", systemId: "hidrica", color: "#56b8d4", x: 12, y: 34, desc: "Riesgo de inundación y acumulación de sedimentos en eventos de lluvia.", connects: ["h_lluvia", "h_infiltra", "h_humedales", "se_suelo"] },
      { id: "b_aves_mig", corto: "Migración\nde aves", name: "Migración estacional\nde aves", icon: "fa-dove", systemId: "biotica", color: "#68d391", x: 68, y: 14, desc: "Tingua azul, playeritos y especies boreales que usan el humedal como escala.", connects: ["b_insectos", "b_flora", "b_refugio", "h_escorre"] },
      { id: "b_refugio", corto: "Refugio\ny nidos", name: "Refugio y anidación\nde la fauna", icon: "fa-shield-heart", systemId: "biotica", color: "#68d391", x: 82, y: 18, desc: "Zonas de anidación y amortiguamiento frente a las perturbaciones urbanas.", connects: ["b_aves_mig", "b_aves_res", "f_cerramientos"] },
      { id: "f_cerramientos", corto: "Corte\ndel paso", name: "Fragmentación por\ncerramientos", icon: "fa-border-all", systemId: "fisico", color: "#b8c0c8", x: 90, y: 28, desc: "Muros y rejas perimetrales que fragmentan el hábitat pero protegen el cuerpo hídrico.", connects: ["b_refugio", "b_aves_res", "f_edificios"] },
      { id: "f_vias", corto: "Carga\nen la vía", name: "Carga y vibración\nde la malla vial", icon: "fa-road", systemId: "fisico", color: "#b8c0c8", x: 92, y: 50, desc: "Av. Ciudad de Cali y Av. Américas; soporte de transporte y fuente de vibración.", connects: ["f_edificios", "f_andenes", "m_transporte", "f_impermeable"] },
      { id: "m_estaciones", corto: "Transbordo\nen portales", name: "Transbordo en\nestaciones y portales", icon: "fa-door-open", systemId: "movilidad", color: "#f1cf5b", x: 88, y: 76, desc: "Portal Américas y Estación Banderas; puntos neurálgicos de transbordo masivo.", connects: ["m_transporte", "m_congestion", "m_peatonal"] },
      { id: "m_congestion", corto: "Congestión\nvial", name: "Congestión y\ntiempos de viaje", icon: "fa-clock", systemId: "movilidad", color: "#f1cf5b", x: 76, y: 88, desc: "Fricción espacial y demoras que impactan la calidad de vida y el tiempo de cuidado.", connects: ["m_transporte", "m_estaciones", "m_ciclorrutas"] },
      { id: "s_org_amb", corto: "Grupos\nde base", name: "Organización\nambiental de base", icon: "fa-hands-holding-circle", systemId: "social", color: "#ee9a4b", x: 32, y: 88, desc: "Colectivos ecológicos de base que defienden la conservación de los humedales.", connects: ["s_conflictos", "s_pedagogia", "s_cuidado", "s_vecinos"] },
      { id: "s_pedagogia", corto: "Ciencia\nciudadana", name: "Aprendizaje y\nciencia ciudadana", icon: "fa-graduation-cap", systemId: "social", color: "#ee9a4b", x: 18, y: 86, desc: "Recorridos escolares, avistamiento de aves y talleres de ciencia ciudadana.", connects: ["s_org_amb", "se_biblioteca", "s_conflictos"] },
      { id: "se_biblioteca", corto: "Vida en la\nbiblioteca", name: "Vida cultural en\nla biblioteca", icon: "fa-book-open", systemId: "socioeconomico", color: "#e58d62", x: 10, y: 72, desc: "Centro cultural y educativo de escala metropolitana contiguo al humedal.", connects: ["se_equipamientos", "s_pedagogia", "se_suelo"] },
      { id: "se_suelo", corto: "Valor\ndel suelo", name: "Presión y valorización\ndel suelo", icon: "fa-chart-line", systemId: "socioeconomico", color: "#e58d62", x: 8, y: 52, desc: "Valorización del suelo y tensiones entre desarrollo urbano y preservación ecológica.", connects: ["se_equipamientos", "se_comercio", "se_biblioteca", "h_desborde"] },

      /* --- Dos dinámicas más por sistema: solo aparecen en la red completa --- */
      { id: "h_calidad", corto: "Calidad\ndel agua", name: "Calidad del agua\ny vertimientos", icon: "fa-flask-vial", systemId: "hidrica", color: "#56b8d4", x: 48, y: 52, soloRedCompleta: true, desc: "Cargas de aguas residuales y basuras que llegan al cuerpo de agua y cambian su química.", connects: ["h_escorre", "h_humedales", "se_comercio", "f_residuos"] },
      { id: "h_evapo", corto: "Vapor\ny calor", name: "Evaporación y\nregulación térmica", icon: "fa-temperature-half", systemId: "hidrica", color: "#56b8d4", x: 28, y: 16, soloRedCompleta: true, desc: "El espejo de agua y la vegetación bajan la temperatura del aire del sector.", connects: ["h_humedales", "b_flora", "f_impermeable", "h_lluvia"] },
      { id: "b_semillas", corto: "Semillas\nque viajan", name: "Dispersión de\nsemillas", icon: "fa-seedling", systemId: "biotica", color: "#68d391", x: 34, y: 6, soloRedCompleta: true, desc: "Aves e insectos mueven semillas y con eso se rehace la cobertura vegetal.", connects: ["b_flora", "b_aves_res", "b_aves_mig", "b_insectos"] },
      { id: "b_invasoras", corto: "Especies\ninvasoras", name: "Avance de especies\ninvasoras", icon: "fa-bugs", systemId: "biotica", color: "#68d391", x: 44, y: 12, soloRedCompleta: true, desc: "Retamo, pasto kikuyo y fauna doméstica que desplazan a las especies propias del humedal.", connects: ["b_flora", "h_humedales", "b_refugio", "f_cerramientos"] },
      { id: "f_residuos", corto: "Residuos\nsin recoger", name: "Acumulación de\nresiduos", icon: "fa-trash-can", systemId: "fisico", color: "#b8c0c8", x: 48, y: 30, soloRedCompleta: true, desc: "Escombros y basura en bordes y canales, que taponan el drenaje y atraen fauna oportunista.", connects: ["f_andenes", "s_conflictos", "h_escorre", "h_calidad"] },
      { id: "f_ruido", corto: "Ruido\nurbano", name: "Ruido urbano\ny su propagación", icon: "fa-volume-high", systemId: "fisico", color: "#b8c0c8", x: 58, y: 8, soloRedCompleta: true, desc: "El ruido del tráfico se propaga hasta el humedal y enmascara las señales de las aves.", connects: ["f_vias", "m_transporte", "b_aves_res", "m_congestion"] },
      { id: "m_carga", corto: "Carga\ny abasto", name: "Circulación de\ncarga y abasto", icon: "fa-truck", systemId: "movilidad", color: "#f1cf5b", x: 78, y: 7, soloRedCompleta: true, desc: "Camiones que abastecen Corabastos y el comercio local, con horarios y rutas propias.", connects: ["m_congestion", "se_comercio", "f_vias", "m_transporte"] },
      { id: "m_informal", corto: "Transporte\ninformal", name: "Transporte informal\ny de proximidad", icon: "fa-motorcycle", systemId: "movilidad", color: "#f1cf5b", x: 84, y: 59, soloRedCompleta: true, desc: "Bicitaxis y moto-transporte que cubren el último tramo donde no llega el sistema.", connects: ["m_peatonal", "m_estaciones", "s_vecinos", "m_ciclorrutas"] },
      { id: "s_memoria", corto: "Memoria\ndel lugar", name: "Memoria y relato\ndel humedal", icon: "fa-book-journal-whills", systemId: "social", color: "#ee9a4b", x: 88, y: 88, soloRedCompleta: true, desc: "Lo que los vecinos recuerdan y cuentan del humedal sostiene su defensa.", connects: ["s_org_amb", "s_pedagogia", "se_biblioteca", "s_vecinos"] },
      { id: "s_seguridad", corto: "Sentirse\nseguro", name: "Percepción de\nseguridad", icon: "fa-shield-halved", systemId: "social", color: "#ee9a4b", x: 56, y: 88, soloRedCompleta: true, desc: "Sentirse o no seguro decide quién usa el borde del humedal y a qué horas.", connects: ["s_vecinos", "f_andenes", "m_peatonal", "s_conflictos"] },
      { id: "se_informal", corto: "Economía\npopular", name: "Economía popular\ny rebusque", icon: "fa-store", systemId: "socioeconomico", color: "#e58d62", x: 6, y: 83, soloRedCompleta: true, desc: "Ventas ambulantes y oficios de calle que dependen del flujo de gente, no de un local.", connects: ["se_comercio", "s_vecinos", "m_informal", "se_equipamientos"] },
      { id: "se_alquiler", corto: "Arriendo\ny salida", name: "Arriendo y\ndesplazamiento", icon: "fa-file-signature", systemId: "socioeconomico", color: "#e58d62", x: 24, y: 75, soloRedCompleta: true, desc: "La subida del arriendo empuja a los hogares a irse del sector.", connects: ["se_vivienda", "se_suelo", "s_conflictos", "se_informal"] },

      /* --- 3 subsistemas nuevos (9 dinámicas), solo en la red completa —
         se agregan nodos y sus propias conexiones hacia el resto de la red
         sin tocar ninguna conexión existente. Colores iguales a los del
         Módulo 08 para que el mismo subsistema se lea igual en toda la app. --- */
      { id: "c_jardines", corto: "Jardines\ninfantiles", name: "Jardines\ninfantiles", icon: "fa-child-reaching", systemId: "cuidado", color: "#ee9a4b", x: 6.0, y: 62.0, soloRedCompleta: true, desc: "Primera infancia y cuidado diario en los barrios del entorno del humedal.", connects: ["s_cuidado", "se_vivienda", "c_salud_barrial"] },
      { id: "c_salud_barrial", corto: "Salud\nbarrial", name: "Puestos de salud\nbarrial", icon: "fa-house-medical", systemId: "cuidado", color: "#ee9a4b", x: 4.0, y: 41.0, soloRedCompleta: true, desc: "Atención primaria de proximidad para las comunidades vecinas.", connects: ["s_vecinos", "se_equipamientos", "c_jardines", "c_espacio_publico"] },
      { id: "c_espacio_publico", corto: "Plazas\ny andenes", name: "Espacio público\ny plazoletas", icon: "fa-tree-city", systemId: "cuidado", color: "#ee9a4b", x: 13.7, y: 92.5, soloRedCompleta: true, desc: "Andenes, plazoletas y zonas de encuentro que sostienen la vida cotidiana.", connects: ["m_peatonal", "f_andenes", "c_salud_barrial"] },

      { id: "p_memoria_local", corto: "Memoria\ndel barrio", name: "Memoria\ndel barrio", icon: "fa-clock-rotate-left", systemId: "patrimonio", color: "#e58d62", x: 4.0, y: 10.0, soloRedCompleta: true, desc: "Relatos y archivos comunitarios sobre la transformación del territorio.", connects: ["s_org_amb", "s_pedagogia", "p_tradiciones"] },
      { id: "p_patrimonio_construido", corto: "Patrimonio\nconstruido", name: "Patrimonio\nconstruido", icon: "fa-landmark", systemId: "patrimonio", color: "#e58d62", x: 96.0, y: 10.0, soloRedCompleta: true, desc: "Edificaciones y trazados con valor histórico o simbólico para la comunidad.", connects: ["f_edificios", "f_cerramientos", "p_memoria_local"] },
      { id: "p_tradiciones", corto: "Saberes\nlocales", name: "Tradiciones y\nsaberes locales", icon: "fa-masks-theater", systemId: "patrimonio", color: "#e58d62", x: 50.0, y: 98.0, soloRedCompleta: true, desc: "Prácticas culturales y saberes ambientales transmitidos entre generaciones.", connects: ["s_pedagogia", "b_flora", "p_patrimonio_construido"] },

      { id: "i_alcaldia_local", corto: "Alcaldía\nlocal", name: "Alcaldía\nlocal", icon: "fa-building-columns", systemId: "institucional", color: "#b8c0c8", x: 96.0, y: 62.0, soloRedCompleta: true, desc: "Gestión administrativa y presupuestal del territorio a escala local.", connects: ["s_conflictos", "se_suelo", "i_curaduria"] },
      { id: "i_curaduria", corto: "Curaduría\ny norma", name: "Curaduría y\nnormativa", icon: "fa-stamp", systemId: "institucional", color: "#b8c0c8", x: 98.0, y: 48.0, soloRedCompleta: true, desc: "Licencias y normas urbanísticas que regulan lo que se construye.", connects: ["f_edificios", "se_suelo", "i_alcaldia_local", "i_control_ambiental"] },
      { id: "i_control_ambiental", corto: "Control\nambiental", name: "Control y vigilancia\nambiental", icon: "fa-clipboard-check", systemId: "institucional", color: "#b8c0c8", x: 88.0, y: 97.0, soloRedCompleta: true, desc: "Inspección y seguimiento del cumplimiento de las normas ambientales.", connects: ["h_desborde", "b_refugio", "i_curaduria"] }
    ];

        // Mapeo por sistema para las explosiones individuales al hacer clic en cada bolita
    const URBAN_DYNAMICS_DATA = {
      hidrica: { id: "hidrica", name: "Dinámica hídrica", color: "#56b8d4", icon: "fa-droplet", elements: UNIFIED_URBAN_ELEMENTS.filter(e => e.systemId === "hidrica" && !e.soloRedCompleta) },
      biotica: { id: "biotica", name: "Dinámica biótica", color: "#68d391", icon: "fa-seedling", elements: UNIFIED_URBAN_ELEMENTS.filter(e => e.systemId === "biotica" && !e.soloRedCompleta) },
      fisico: { id: "fisico", name: "Sistema físico-urbano", color: "#b8c0c8", icon: "fa-building", elements: UNIFIED_URBAN_ELEMENTS.filter(e => e.systemId === "fisico" && !e.soloRedCompleta) },
      movilidad: { id: "movilidad", name: "Sistema de movilidad", color: "#f1cf5b", icon: "fa-route", elements: UNIFIED_URBAN_ELEMENTS.filter(e => e.systemId === "movilidad" && !e.soloRedCompleta) },
      social: { id: "social", name: "Sistema social-comunitario", color: "#ee9a4b", icon: "fa-people-group", elements: UNIFIED_URBAN_ELEMENTS.filter(e => e.systemId === "social" && !e.soloRedCompleta) },
      socioeconomico: { id: "socioeconomico", name: "Sistema socioeconómico y de ocupación", color: "#e58d62", icon: "fa-house-chimney", elements: UNIFIED_URBAN_ELEMENTS.filter(e => e.systemId === "socioeconomico" && !e.soloRedCompleta) }
    };

    function renderFullSubsystemsNetworkInPlace(target) {
      if (!target) return;
      target.dataset.revealState = "complete";
      target.classList.add("network-active");

      const elementPosMap = {};
      UNIFIED_URBAN_ELEMENTS.forEach((el) => { elementPosMap[el.id] = el; });

      // La red completa se dibuja más abierta que la vista de subsistemas:
      // son las mismas posiciones, estiradas hasta los bordes del tablero,
      // para que las bolitas queden separadas y no se vean espichadas.
      const POS = (function repartoAbierto() {
        const xs = UNIFIED_URBAN_ELEMENTS.map((e) => e.x);
        const ys = UNIFIED_URBAN_ELEMENTS.map((e) => e.y);
        const remapear = (v, min, max, destMin, destMax) =>
          max - min < 0.001 ? (destMin + destMax) / 2 : destMin + ((v - min) / (max - min)) * (destMax - destMin);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const mapa = {};
        UNIFIED_URBAN_ELEMENTS.forEach((el) => {
          mapa[el.id] = {
            x: remapear(el.x, minX, maxX, 5, 95),
            y: remapear(el.y, minY, maxY, 5, 95)
          };
        });
        return mapa;
      })();
      const posDe = (el) => POS[el.id] || { x: el.x, y: el.y };

      // Generar líneas de conexión nítidas, limpias y visibles (SIN PUNTOS EN MOVIMIENTO)
      let unifiedLinesHtml = "";
      const drawnPairs = new Set();
      // Ritmo de entrada: las bolitas salen de a una (PASO_NODOS) y solo
      // cuando terminan empiezan a aparecer las relaciones (TURNO_ENLACES).
      const PASO_NODOS = 42;
      const TURNO_ENLACES = UNIFIED_URBAN_ELEMENTS.length * PASO_NODOS + 620;

      UNIFIED_URBAN_ELEMENTS.forEach((el) => {
        (el.connects || []).forEach((targetId) => {
          const targetEl = elementPosMap[targetId];
          if (!targetEl) return;
          const pairKey = [el.id, targetId].sort().join("---");
          if (drawnPairs.has(pairKey)) return;
          drawnPairs.add(pairKey);

          const cruzada = el.systemId !== targetEl.systemId;
          // Cada relación aparece sola, una tras otra, después de que hayan
          // salido todas las bolitas: --link-delay es su turno. La línea es
          // continua (antes se dibujaba con un trazo progresivo que en
          // pantalla se veía punteado).
          const pa = posDe(el), pb = posDe(targetEl);
          const turno = TURNO_ENLACES + drawnPairs.size * 24;
          unifiedLinesHtml += `
            <g class="full-unified-group" data-source="${el.id}" data-target="${targetId}">
              <line x1="${pa.x.toFixed(2)}" y1="${pa.y.toFixed(2)}" x2="${pb.x.toFixed(2)}" y2="${pb.y.toFixed(2)}" class="full-unified-link${cruzada ? " is-cross" : ""}" style="--link-color:${el.color};--link-delay:${turno}ms"/>
            </g>
          `;
        });
      });

      // Cuántas relaciones vigentes tiene cada dinámica: las más conectadas se
      // dibujan más grandes, para que se vea de un golpe cuáles sostienen la red.
      const gradoElemento = {};
      UNIFIED_URBAN_ELEMENTS.forEach((el) => { gradoElemento[el.id] = 0; });
      drawnPairs.forEach((par) => {
        const [a, b] = par.split("---");
        if (gradoElemento[a] !== undefined) gradoElemento[a]++;
        if (gradoElemento[b] !== undefined) gradoElemento[b]++;
      });
      const gradoMax = Math.max(1, ...Object.values(gradoElemento));
      const gradoMin = Math.min(...Object.values(gradoElemento));

      // La red se arma desde sus nodos más fuertes: primero las dinámicas con
      // más relaciones y después las de los bordes.
      const ordenAparicion = {};
      UNIFIED_URBAN_ELEMENTS.slice()
        .sort((a, b) => (gradoElemento[b.id] - gradoElemento[a.id]) || a.id.localeCompare(b.id))
        .forEach((el, i) => { ordenAparicion[el.id] = i; });

      // Render de las dinámicas de la red completa
      const nodesHtml = UNIFIED_URBAN_ELEMENTS.map((el) => {
        // en la bola va el nombre corto; el completo sigue en la ficha y en
        // el tooltip, para que quepa dentro del círculo sin salirse
        const formattedName = (el.corto || el.name).replace(/\n/g, "<br>");
        const parentCenter = PARENT_SYSTEM_CENTERS[el.systemId] || { x: 50, y: 48 };
        const pos = posDe(el);
        // El tamaño va por número de relaciones, con diferencia visible: la
        // más suelta queda en 0.86 y la que sostiene la red en 1.34.
        const t = gradoMax > gradoMin ? (gradoElemento[el.id] - gradoMin) / (gradoMax - gradoMin) : 0;
        const escala = (0.86 + t * 0.48).toFixed(3);
        return `
          <button type="button" class="full-dynamic-node" data-elem-id="${el.id}" data-sys-id="${el.systemId}"
            style="--node-x:${pos.x.toFixed(2)}%;--node-y:${pos.y.toFixed(2)}%;--origin-x:${parentCenter.x}%;--origin-y:${parentCenter.y}%;--node-color:${el.color};--node-delay:${ordenAparicion[el.id] * PASO_NODOS}ms;--node-scale:${escala};"
            title="${el.name.replace(/\n/g, ' ')} · ${gradoElemento[el.id]} relaciones">
            <i class="fa-solid ${el.icon} full-node-icon"></i>
            <span class="full-node-label" lang="es">${formattedName}</span>
          </button>
        `;
      }).join("");

      // Botón flotante para regresar a 6 sistemas (elegante en la esquina superior)
      const centerToggleHtml = `
        <button type="button" id="mapNetworkCenterHub" class="map-network-back-pill is-expanded-mode" aria-label="Volver a los 6 subsistemas">
          <i class="fa-solid fa-arrow-rotate-left"></i>
          <span>Volver a 6 subsistemas</span>
        </button>
      `;

      target.innerHTML = `
        <div class="map-network-stage systems-network is-full-dynamics-active">
          ${centerToggleHtml}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <g class="full-unified-layer">${unifiedLinesHtml}</g>
          </svg>
          ${nodesHtml}
          <div id="fullDynamicsDetailCard" class="full-dynamics-detail-card" style="display:none;"></div>
        </div>
      `;

      // El nombre tiene que caber DENTRO de la bola: se mide el texto ya
      // dibujado y se le baja la letra hasta que entre en el cuadrado que
      // cabe dentro del círculo. Si aun así no entra, el nombre le gana el
      // puesto al icono. Se mide con offsetWidth/scrollHeight (medidas de
      // maquetación) para que la animación de entrada, que escala la bola,
      // no falsee la medida.
      const ajustarRotulosDentroDeLaBola = () => {
        target.querySelectorAll(".full-dynamic-node").forEach((btn) => {
          const rotulo = btn.querySelector(".full-node-label");
          if (!rotulo || !btn.offsetWidth) return;
          if (getComputedStyle(rotulo).display === "none") return;   // en teléfono va solo el icono
          const icono = btn.querySelector(".full-node-icon");
          if (icono) icono.style.display = "";
          const r = btn.offsetWidth / 2 - 2.5;                        // radio útil, sin el borde
          const altoIcono = () => (icono && getComputedStyle(icono).display !== "none" ? icono.offsetHeight + 1 : 0);
          // Dentro de un círculo el texto puede ser más ancho de lo que
          // parece: cuanto más bajo el bloque de texto, más ancho cabe.
          // anchoQueCabe() es el ancho máximo a la altura que ocupa el texto.
          const anchoQueCabe = (alto) => 2 * Math.sqrt(Math.max(1, r * r - (alto / 2) * (alto / 2))) - 2;
          const cabe = () => {
            for (let k = 0; k < 3; k++) {
              const total = altoIcono() + rotulo.scrollHeight;
              if (total > 2 * r - 1) return false;
              rotulo.style.maxWidth = anchoQueCabe(total).toFixed(1) + "px";
            }
            const total = altoIcono() + rotulo.scrollHeight;
            return total <= 2 * r - 1 && rotulo.scrollWidth <= parseFloat(rotulo.style.maxWidth) + 0.5;
          };
          rotulo.style.lineHeight = "1.05";
          let f = parseFloat(getComputedStyle(rotulo).fontSize) || 8;
          let vueltas = 0;
          while (!cabe() && f > 6.6 && vueltas++ < 30) {
            f -= 0.2;
            rotulo.style.setProperty("font-size", f.toFixed(2) + "px", "important");
          }
          if (!cabe() && icono) icono.style.display = "none";         // manda el nombre
          vueltas = 0;
          while (!cabe() && f > 5.4 && vueltas++ < 30) {
            f -= 0.2;
            rotulo.style.setProperty("font-size", f.toFixed(2) + "px", "important");
          }
        });
      };
      ajustarRotulosDentroDeLaBola();
      if (document.fonts && document.fonts.ready) {
        // con la tipografía ya cargada las medidas cambian: se repite el ajuste
        document.fonts.ready.then(ajustarRotulosDentroDeLaBola).catch(() => {});
      }

      // Listener para volver a 6 sistemas con transición suave
      const backToOverview = (e) => {
        e.stopPropagation();
        try { DINAMICA_SOUND.play("expansion"); } catch (err) {}
        const stageEl = target.querySelector(".map-network-stage");
        if (stageEl) {
          stageEl.classList.add("is-stage-imploding");
          window.setTimeout(() => {
            renderMapNetwork("systems", true, target, false);
          }, 320);
        } else {
          renderMapNetwork("systems", true, target, false);
        }
      };
      target.querySelector("#mapNetworkCenterHub")?.addEventListener("click", backToOverview);

      // Interactividad de los 30 nodos
      // ---------- Física ligera: arrastrar un nodo mueve a sus conectados ----------
      // Muelles a lo largo de cada conexión (con la distancia inicial como
      // reposo) + un muelle suave a la posición original, para que la red se
      // deforme al tirar de un nodo y luego se reacomode sola.
      (function iniciarFisica() {
        const escenario = target.querySelector(".map-network-stage");
        if (!escenario) return;
        const nodos = UNIFIED_URBAN_ELEMENTS.map((el) => ({
          id: el.id, x: posDe(el).x, y: posDe(el).y, hx: posDe(el).x, hy: posDe(el).y, vx: 0, vy: 0,
          dom: target.querySelector(`.full-dynamic-node[data-elem-id="${el.id}"]`)
        }));
        const porId = {}; nodos.forEach((n) => { porId[n.id] = n; });
        const enlaces = [];
        target.querySelectorAll(".full-unified-group").forEach((g) => {
          const a = porId[g.dataset.source], b = porId[g.dataset.target];
          const linea = g.querySelector("line");
          if (!a || !b || !linea) return;
          enlaces.push({ a, b, linea });
        });
        let arrastrado = null, raf = 0, corriendo = false;
        // el lienzo no es cuadrado: se corrige la proporción para que los
        // muelles no se vean estirados en un eje
        const proporcion = () => { const r = escenario.getBoundingClientRect(); return (r.width / Math.max(1, r.height)) || 1; };

        function pintar() {
          nodos.forEach((n) => {
            if (!n.dom) return;
            n.dom.style.setProperty("--node-x", n.x.toFixed(2) + "%");
            n.dom.style.setProperty("--node-y", n.y.toFixed(2) + "%");
          });
          enlaces.forEach((e) => {
            e.linea.setAttribute("x1", e.a.x.toFixed(2));
            e.linea.setAttribute("y1", e.a.y.toFixed(2));
            e.linea.setAttribute("x2", e.b.x.toFixed(2));
            e.linea.setAttribute("y2", e.b.y.toFixed(2));
          });
        }
        function paso() {
          const ar = proporcion();
          const K_ENLACE = 0.055, K_CASA = 0.012, AMORT = 0.9;
          enlaces.forEach((e) => {
            const dx = (e.b.x - e.a.x) * ar, dy = e.b.y - e.a.y;
            const d = Math.hypot(dx, dy) || 0.001;
            // reposo = la distancia que tenían en el reparto original, medida
            // en las mismas unidades corregidas por la proporción del lienzo
            const reposo = Math.hypot((e.b.hx - e.a.hx) * ar, e.b.hy - e.a.hy) || 0.001;
            const f = K_ENLACE * (d - reposo);
            const ux = dx / d, uy = dy / d;
            if (e.a !== arrastrado) { e.a.vx += (ux * f) / ar; e.a.vy += uy * f; }
            if (e.b !== arrastrado) { e.b.vx -= (ux * f) / ar; e.b.vy -= uy * f; }
          });
          let movimiento = 0;
          nodos.forEach((n) => {
            if (n === arrastrado) { n.vx = 0; n.vy = 0; return; }
            n.vx += (n.hx - n.x) * K_CASA;
            n.vy += (n.hy - n.y) * K_CASA;
            n.vx *= AMORT; n.vy *= AMORT;
            n.x = Math.max(3, Math.min(97, n.x + n.vx));
            n.y = Math.max(4, Math.min(96, n.y + n.vy));
            movimiento += Math.abs(n.vx) + Math.abs(n.vy);
          });
          pintar();
          if (arrastrado || movimiento > 0.02) { raf = requestAnimationFrame(paso); }
          else { corriendo = false; }
        }
        function arrancar() { if (!corriendo) { corriendo = true; raf = requestAnimationFrame(paso); } }

        nodos.forEach((n) => {
          if (!n.dom) return;
          n.dom.addEventListener("pointerdown", (ev) => {
            ev.preventDefault();
            arrastrado = n;
            n.dom.setPointerCapture?.(ev.pointerId);
            n.dom.classList.add("is-dragging");
            escenario.classList.add("is-dragging-node");
            n.movido = 0;
            arrancar();
          });
          n.dom.addEventListener("pointermove", (ev) => {
            if (arrastrado !== n) return;
            const r = escenario.getBoundingClientRect();
            const nx = ((ev.clientX - r.left) / r.width) * 100;
            const ny = ((ev.clientY - r.top) / r.height) * 100;
            n.movido = (n.movido || 0) + Math.abs(nx - n.x) + Math.abs(ny - n.y);
            n.x = Math.max(3, Math.min(97, nx));
            n.y = Math.max(4, Math.min(96, ny));
            arrancar();
          });
          const soltar = (ev) => {
            if (arrastrado !== n) return;
            arrastrado = null;
            n.dom.releasePointerCapture?.(ev.pointerId);
            n.dom.classList.remove("is-dragging");
            escenario.classList.remove("is-dragging-node");
            // si de verdad se arrastró, se evita que cuente como clic
            if ((n.movido || 0) > 1.2) { n.dom.dataset.suppressClick = "1"; window.setTimeout(() => { delete n.dom.dataset.suppressClick; }, 60); }
            arrancar();
          };
          n.dom.addEventListener("pointerup", soltar);
          n.dom.addEventListener("pointercancel", soltar);
        });
      })();

      // Pasar el cursor por un nodo enciende solo sus conexiones (sin abrir
      // la ficha): es la forma de leer la red sin tener que hacer clic.
      const stageEl = () => target.querySelector(".map-network-stage");
      target.querySelectorAll(".full-dynamic-node").forEach((btn) => {
        btn.addEventListener("mouseenter", () => {
          const stage = stageEl();
          if (!stage || stage.classList.contains("has-selection")) return;
          const elemId = btn.dataset.elemId;
          stage.classList.add("has-hover");
          target.querySelectorAll(".full-unified-group").forEach((g) => {
            g.classList.toggle("is-hovered", g.dataset.source === elemId || g.dataset.target === elemId);
          });
          const dato = elementPosMap[elemId];
          target.querySelectorAll(".full-dynamic-node").forEach((n) => {
            const vecino = dato?.connects?.includes(n.dataset.elemId) || elementPosMap[n.dataset.elemId]?.connects?.includes(elemId);
            n.classList.toggle("is-near", n === btn || !!vecino);
          });
        });
        btn.addEventListener("mouseleave", () => {
          const stage = stageEl();
          if (!stage) return;
          stage.classList.remove("has-hover");
          target.querySelectorAll(".full-unified-group").forEach((g) => g.classList.remove("is-hovered"));
          target.querySelectorAll(".full-dynamic-node").forEach((n) => n.classList.remove("is-near"));
        });
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (btn.dataset.suppressClick) return;   // venía de arrastrar el nodo
          const elemId = btn.dataset.elemId;
          const nodeData = elementPosMap[elemId];
          if (!nodeData) return;

          try { DINAMICA_SOUND.play(nodeData.systemId); } catch (err) {}

          target.querySelectorAll(".full-dynamic-node").forEach((n) => {
            n.classList.toggle("is-active", n === btn);
            const isConnected = nodeData.connects?.includes(n.dataset.elemId) || elementPosMap[n.dataset.elemId]?.connects?.includes(elemId);
            n.classList.toggle("is-connected", isConnected);
          });

          target.querySelectorAll(".full-unified-group").forEach((group) => {
            const s = group.dataset.source, t = group.dataset.target;
            const matches = s === elemId || t === elemId;
            group.classList.toggle("is-highlighted", matches);
          });
          target.querySelector(".map-network-stage")?.classList.add("has-selection");

          const card = target.querySelector("#fullDynamicsDetailCard");
          if (card) {
            const connectsHtml = (nodeData.connects || []).map((cId) => {
              const cData = elementPosMap[cId];
              if (!cData) return "";
              return `<span class="full-detail-tag" data-tag-target="${cId}" style="--tag-color:${cData.color};"><i class="fa-solid ${cData.icon}"></i> ${cData.name.replace(/\n/g, ' ')}</span>`;
            }).join("");

            card.innerHTML = `
              <div class="full-detail-head">
                <div class="full-detail-sys-badge" style="background:${nodeData.color}22;color:${nodeData.color};border:1px solid ${nodeData.color}55;">
                  <i class="fa-solid ${nodeData.icon}"></i> ${nodeData.systemId.toUpperCase()}
                </div>
                <button type="button" class="full-detail-close" aria-label="Cerrar">&times;</button>
              </div>
              <h4 class="full-detail-title" style="color:${nodeData.color};"><i class="fa-solid ${nodeData.icon}"></i> ${nodeData.name.replace(/\n/g, ' ')}</h4>
              <p class="full-detail-desc">${nodeData.desc}</p>
              <div class="full-detail-connections">
                <strong><i class="fa-solid fa-arrows-split-up-and-left"></i> Relaciones territoriales directas:</strong>
                <div class="full-detail-tags-wrap">${connectsHtml}</div>
              </div>
            `;
            card.style.display = "block";
            card.querySelector(".full-detail-close")?.addEventListener("click", (closeEv) => {
              closeEv.stopPropagation();
              card.style.display = "none";
              target.querySelectorAll(".full-dynamic-node").forEach((n) => n.classList.remove("is-active", "is-connected"));
              target.querySelectorAll(".full-unified-group").forEach((g) => g.classList.remove("is-highlighted"));
              target.querySelector(".map-network-stage")?.classList.remove("has-selection");
            });

            card.querySelectorAll(".full-detail-tag").forEach((tag) => {
              tag.addEventListener("click", (tagEv) => {
                tagEv.stopPropagation();
                const targetBtn = target.querySelector(`.full-dynamic-node[data-elem-id="${tag.dataset.tagTarget}"]`);
                targetBtn?.click();
              });
            });
          }
        });
      });
    }

    const buildHidricaDiagramHtml = (row) => {
      // Coordenadas en un lienzo de 400x260. "dot" = punto sobre el río,
      // "label" = dónde queda el recuadro de texto (siempre en un borde).
      const callouts = [
        { dot: [55, 205], label: [60, 240], side: "left", icon: "fa-cloud-showers-heavy", title: "Lluvia y escorrentía", text: "El agua lluvia cae sobre el suelo y las vías, y empieza a moverse ladera abajo." },
        { dot: [112, 150], label: [40, 105], side: "left", icon: "fa-arrow-down-to-line", title: "Infiltración en el suelo", text: "Parte del agua se filtra según el tipo de suelo y su capacidad de absorción." },
        { dot: [175, 100], label: [40, 40], side: "left", icon: "fa-water", title: "Circulación y acumulación", text: "El agua se junta en canales y humedales; sube o baja de nivel según lluvia y pendiente." },
        { dot: [245, 68], label: [345, 105], side: "right", icon: "fa-layer-group", title: "Sedimentos y arrastre", text: "El flujo arrastra sedimentos que se acumulan o se remueven con el tiempo." },
        { dot: [310, 40], label: [345, 175], side: "right", icon: "fa-triangle-exclamation", title: "Desborde en creciente", text: "En eventos fuertes, el agua sobrepasa el canal y se desborda sobre el borde urbano." },
        { dot: [365, 22], label: [345, 40], side: "right", icon: "fa-right-left", title: "Descarga al sistema principal", text: "El agua termina conectándose con el río principal, aguas abajo de toda la red hídrica." },
      ];
      const riverPath = "M 15 225 C 70 210, 65 165, 112 150 C 150 138, 150 112, 175 100 C 205 87, 225 80, 245 68 C 270 54, 285 48, 310 40 C 330 33, 345 30, 365 22";
      const calloutsSvg = callouts.map((c) =>
        `<g class="hidrica-callout"><line x1="${c.dot[0]}" y1="${c.dot[1]}" x2="${c.label[0]}" y2="${c.label[1]}" class="hidrica-callout-line"/><circle cx="${c.dot[0]}" cy="${c.dot[1]}" r="3.4" class="hidrica-callout-dot"/></g>`
      ).join("");
      const labelsHtml = callouts.map((c, i) => {
        const leftPct = (c.label[0] / 400) * 100;
        const topPct = (c.label[1] / 260) * 100;
        return `<div class="hidrica-callout-label ${c.side === "left" ? "cal-left" : "cal-right"}" style="left:${leftPct}%;top:${topPct}%"><b><i class="fa-solid ${c.icon}"></i> ${i + 1}. ${c.title}</b><span>${c.text}</span></div>`;
      }).join("");
      return `<div class="subsystem-panel-heading"><strong><i class="fa-solid fa-water"></i> DINÁMICA HÍDRICA DE BOGOTÁ · CICLOS Y DINÁMICAS</strong><button type="button" class="subsystem-panel-close" aria-label="Cerrar diagrama"><i class="fa-solid fa-xmark"></i></button></div><div class="hidrica-diagram-wrap"><svg viewBox="0 0 400 260" class="hidrica-diagram-svg" preserveAspectRatio="xMidYMid meet"><path d="${riverPath}" class="hidrica-river-path"/>${calloutsSvg}</svg>${labelsHtml}</div><p class="hidrica-diagram-summary"><b>¿Qué se analiza?</b> ${row.process}</p>`;
    };
    const renderSubsystemPoints = (item) => {
      const points = getComponentPoints(item);
      const source = componentPointMap?.getSource("subsystem-component-points");
      if (!source) return;
      source.setData({ type: "FeatureCollection", features: points.map((point) => ({ type: "Feature", properties: { label: point.label, code: point.code, color: point.color, subsystem: item.name }, geometry: { type: "Point", coordinates: point.coords } })) });
      ["subsystem-component-point-halo", "subsystem-component-points"].forEach((layerId) => { if (componentPointMap.getLayer(layerId)) componentPointMap.setLayoutProperty(layerId, "visibility", "visible"); });
      announceCartography(`${item.name.toUpperCase()} · ${points.length} LOCALIZACIONES DE COMPONENTES`, true);
    };
    const clearSubsystemPoints = () => {
      const source = componentPointMap?.getSource("subsystem-component-points");
      source?.setData({ type: "FeatureCollection", features: [] });
      ["subsystem-component-point-halo", "subsystem-component-points"].forEach((layerId) => { if (componentPointMap?.getLayer(layerId)) componentPointMap.setLayoutProperty(layerId, "visibility", "none"); });
    };
    const componentVisuals = [
      { match: /espejo de agua/i, icon: "fa-water", label: "Agua" },
      { match: /canal/i, icon: "fa-arrows-left-right-to-line", label: "Canal" },
      { match: /rondas?/i, icon: "fa-wave-square", label: "Ronda" },
      { match: /escorrent/i, icon: "fa-cloud-rain", label: "Escorrentía" },
      { match: /suelo/i, icon: "fa-layer-group", label: "Suelo" },
      { match: /migratori/i, icon: "fa-crow", label: "Migratorias", className: "bird-migratory" },
      { match: /resident/i, icon: "fa-crow", label: "Residentes", className: "bird-resident" },
      { match: /arañas?/i, icon: "fa-spider", label: "Arañas" },
      { match: /insectos?/i, icon: "fa-bug", label: "Insectos" },
      { match: /junco/i, icon: "fa-leaf", label: "Junco", className: "leaf-transparent" },
      { match: /enea/i, icon: "fa-leaf", label: "Enea", className: "leaf-transparent" },
      { match: /kikuyo/i, icon: "fa-leaf", label: "Kikuyo", className: "leaf-transparent" },
      { match: /vegetación/i, icon: "fa-seedling", label: "Vegetación", className: "leaf-transparent" },
      { match: /avenida/i, icon: "fa-road", label: "Avenida" },
      { match: /edific/i, icon: "fa-building", label: "Edificaciones" },
      { match: /ciclorruta/i, icon: "fa-person-biking", label: "Ciclorruta" },
      { match: /senderos?/i, icon: "fa-person-walking", label: "Senderos" },
      { match: /personas|habitantes|visitantes/i, icon: "fa-person", label: "Personas" },
      { match: /junta/i, icon: "fa-people-group", label: "Junta" },
      { match: /organizaciones?/i, icon: "fa-hands-holding-circle", label: "Organización" },
      { match: /jardín botánico/i, icon: "fa-seedling", label: "Jardín Botánico" },
      { match: /secretaría/i, icon: "fa-landmark", label: "Secretaría" },
      { match: /ciudad limpia|residuos/i, icon: "fa-recycle", label: "Residuos" },
      { match: /biblioteca/i, icon: "fa-book-open", label: "Biblioteca" }
    ];
    const getComponentVisuals = (item) => componentVisuals.filter((visual) => visual.match.test(item.componentsText || ""));
    const subsystemNetworks = {
      "Dinámica hídrica": { note: "circulación, acumulación y transformación del agua", nodes: [{ id: "lluvia", label: "Lluvia", x: 14, y: 24 }, { id: "escorrentia", label: "Escorrentía", x: 14, y: 76 }, { id: "suelo", label: "Suelo húmedo", x: 50, y: 18 }, { id: "agua", label: "Espejo de agua", x: 50, y: 50 }, { id: "sedimentos", label: "Sedimentos", x: 50, y: 82 }, { id: "canal", label: "Canal Los Ángeles", x: 86, y: 28 }, { id: "ronda", label: "Ronda hídrica", x: 86, y: 72 }], edges: [{ a: "lluvia", b: "escorrentia", label: "precipitación" }, { a: "lluvia", b: "suelo", label: "infiltración" }, { a: "escorrentia", b: "suelo", label: "flujo superficial" }, { a: "escorrentia", b: "agua", label: "aporte" }, { a: "suelo", b: "agua", label: "saturación" }, { a: "suelo", b: "sedimentos", label: "erosión" }, { a: "agua", b: "sedimentos", label: "transporte" }, { a: "agua", b: "canal", label: "conexión" }, { a: "agua", b: "ronda", label: "borde húmedo" }, { a: "canal", b: "ronda", label: "salida y regulación" }, { a: "sedimentos", b: "canal", label: "arrastre" }] },
      "Dinámica biótica": { note: "hábitat, alimentación, reproducción y desplazamiento de organismos", nodes: [{ id: "vegetacion", label: "Vegetación", x: 50, y: 50 }, { id: "migratorias", label: "Aves migratorias", x: 14, y: 22 }, { id: "residentes", label: "Aves residentes", x: 14, y: 78 }, { id: "insectos", label: "Insectos", x: 86, y: 22 }, { id: "aranas", label: "Arañas", x: 86, y: 78 }, { id: "agua", label: "Agua y humedad", x: 50, y: 16 }, { id: "refugio", label: "Refugios y hábitats", x: 50, y: 84 }], edges: [{ a: "agua", b: "vegetacion", label: "humedad" }, { a: "agua", b: "migratorias", label: "descanso" }, { a: "agua", b: "residentes", label: "permanencia" }, { a: "vegetacion", b: "migratorias", label: "refugio" }, { a: "vegetacion", b: "residentes", label: "alimento" }, { a: "vegetacion", b: "insectos", label: "polinización" }, { a: "vegetacion", b: "aranas", label: "microhábitat" }, { a: "migratorias", b: "refugio", label: "desplazamiento" }, { a: "residentes", b: "refugio", label: "anidación" }, { a: "insectos", b: "aranas", label: "depredación" }, { a: "insectos", b: "migratorias", label: "recurso trófico" }, { a: "residentes", b: "insectos", label: "alimentación" }, { a: "aranas", b: "refugio", label: "control biológico" }] },
      "Sistema biótico del humedal": { note: "hábitat, alimentación, reproducción y desplazamiento de organismos", nodes: [{ id: "vegetacion", label: "Vegetación", x: 50, y: 50 }, { id: "migratorias", label: "Aves migratorias", x: 14, y: 22 }, { id: "residentes", label: "Aves residentes", x: 14, y: 78 }, { id: "insectos", label: "Insectos", x: 86, y: 22 }, { id: "aranas", label: "Arañas", x: 86, y: 78 }, { id: "agua", label: "Agua y humedad", x: 50, y: 16 }, { id: "refugio", label: "Refugios y hábitats", x: 50, y: 84 }], edges: [{ a: "agua", b: "vegetacion", label: "humedad" }, { a: "agua", b: "migratorias", label: "descanso" }, { a: "agua", b: "residentes", label: "permanencia" }, { a: "vegetacion", b: "migratorias", label: "refugio" }, { a: "vegetacion", b: "residentes", label: "alimento" }, { a: "vegetacion", b: "insectos", label: "polinización" }, { a: "vegetacion", b: "aranas", label: "microhábitat" }, { a: "migratorias", b: "refugio", label: "desplazamiento" }, { a: "residentes", b: "refugio", label: "anidación" }, { a: "insectos", b: "aranas", label: "depredación" }, { a: "insectos", b: "migratorias", label: "recurso trófico" }, { a: "residentes", b: "insectos", label: "alimentación" }, { a: "aranas", b: "refugio", label: "control biológico" }] },
      "Infraestructura y borde urbano": { note: "fragmentación, acceso y transformación del borde", nodes: [{ id: "avenida", label: "Avenida Ciudad de Cali", x: 16, y: 50 }, { id: "edificios", label: "Edificaciones", x: 50, y: 20 }, { id: "cerramientos", label: "Cerramientos", x: 84, y: 50 }, { id: "senderos", label: "Senderos", x: 50, y: 80 }], edges: [{ a: "avenida", b: "edificios", label: "ocupación" }, { a: "edificios", b: "cerramientos", label: "borde" }, { a: "cerramientos", b: "senderos", label: "acceso" }, { a: "senderos", b: "avenida", label: "conexión" }] },
      "Movilidad y accesibilidad cotidiana": { note: "recorridos, accesos y presión sobre el borde", nodes: [{ id: "usuarios", label: "Usuarios", x: 16, y: 50 }, { id: "peatones", label: "Peatones", x: 50, y: 20 }, { id: "ciclistas", label: "Ciclistas", x: 84, y: 20 }, { id: "cicloruta", label: "Ciclorruta", x: 50, y: 80 }, { id: "biblioteca", label: "Biblioteca El Tintal", x: 84, y: 80 }], edges: [{ a: "usuarios", b: "peatones", label: "recorrido" }, { a: "usuarios", b: "ciclistas", label: "elección" }, { a: "peatones", b: "cicloruta", label: "acceso" }, { a: "ciclistas", b: "biblioteca", label: "destino" }, { a: "cicloruta", b: "biblioteca", label: "conexión" }] },
      "Prácticas comunitarias": { note: "participación, cuidado y apropiación del territorio", nodes: [{ id: "habitantes", label: "Habitantes", x: 16, y: 50 }, { id: "visitantes", label: "Visitantes", x: 50, y: 20 }, { id: "estudiantes", label: "Estudiantes", x: 84, y: 50 }, { id: "junta", label: "Junta de Acción Comunal", x: 50, y: 80 }, { id: "organizaciones", label: "Organizaciones", x: 84, y: 80 }], edges: [{ a: "habitantes", b: "visitantes", label: "uso" }, { a: "visitantes", b: "estudiantes", label: "aprendizaje" }, { a: "habitantes", b: "junta", label: "organización" }, { a: "junta", b: "organizaciones", label: "coordinación" }, { a: "organizaciones", b: "estudiantes", label: "educación" }] },
      "Gestión institucional y manejo": { note: "coordinación, restauración y toma de decisiones", nodes: [{ id: "jardin", label: "Jardín Botánico", x: 16, y: 50 }, { id: "ambiente", label: "Secretaría de Ambiente", x: 50, y: 20 }, { id: "residuos", label: "Ciudad Limpia", x: 84, y: 50 }, { id: "restauracion", label: "Restauración", x: 50, y: 80 }, { id: "seguimiento", label: "Seguimiento", x: 84, y: 80 }], edges: [{ a: "jardin", b: "ambiente", label: "regulación" }, { a: "ambiente", b: "residuos", label: "manejo" }, { a: "jardin", b: "restauracion", label: "acción" }, { a: "restauracion", b: "seguimiento", label: "evaluación" }, { a: "seguimiento", b: "ambiente", label: "decisión" }] }
    };
    const renderSubsystemNetwork = (item) => { const graph = subsystemNetworks[item.name]; if (!graph) return ""; const byId = Object.fromEntries(graph.nodes.map((node) => [node.id, node])); const wildlife = item.name === "Sistema biótico del humedal" ? `<span class="process-network-bird migratory bird-one" aria-label="Ave migratoria volando"><i class="fa-solid fa-crow"></i></span><span class="process-network-bird migratory bird-two" aria-label="Ave migratoria volando"><i class="fa-solid fa-crow"></i></span><span class="process-network-bird resident bird-three" aria-label="Ave residente en el hábitat"><i class="fa-solid fa-crow"></i></span><span class="process-network-bird resident bird-four" aria-label="Ave residente en el hábitat"><i class="fa-solid fa-crow"></i></span>` : ""; return `<section class="process-network" style="--bubble-color:${item.color}"><strong><i class="fa-solid fa-diagram-project"></i> RED INTERNA · RELACIONES</strong><small>${graph.note}</small><div class="process-network-canvas"><svg viewBox="0 0 100 100" aria-hidden="true">${graph.edges.map((edge) => { const a = byId[edge.a]; const b = byId[edge.b]; return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"><title>${edge.label}</title></line>`; }).join("")}</svg>${wildlife}${graph.nodes.map((node) => `<span class="process-network-node" style="left:${node.x}%;top:${node.y}%" title="${node.label}"><i class="fa-solid fa-circle-dot"></i><em>${node.label}</em></span>`).join("")}</div><small class="process-network-legend">Las líneas muestran procesos de relación entre unidades del mismo nivel.</small></section>`; };
    const projectToPercent = (coords) => {
      if (!componentPointMap) return null;
      try {
        const p = componentPointMap.project(coords);
        const container = componentPointMap.getContainer();
        const w = container.clientWidth, h = container.clientHeight;
        if (!w || !h) return null;
        return { x: (p.x / w) * 100, y: (p.y / h) * 100 };
      } catch (err) { return null; }
    };
    // Las bolitas de lugares reales no se pueden "empujar": si se desplazan
    // dejan de coincidir con la cartografía y las rutas parecen flotantes.
    // La separación se resuelve moviendo las cajas, no los puntos geográficos.
    let declutteredPositions = {};
    function computeDeclutteredPositions() {
      const items = [];
      KENNEDY_PHENOMENA.forEach((p, i) => {
        const proj = projectToPercent(p.coords);
        if (proj) items.push({ key: `phen-${i}`, x: proj.x, y: proj.y });
      });
      KENNEDY_TEXT_BOXES.forEach((box, i) => box.coords.forEach((c, j) => {
        const proj = projectToPercent(c.pos);
        if (proj) items.push({ key: `box-${i}-${j}`, x: proj.x, y: proj.y });
      }));
      // Si dos bolitas quedan muy cerca (por estar geográficamente cerca en
      // la realidad), se empujan un poquito para que no se toquen entre sí.
      const minDist = 6;
      for (let iter = 0; iter < 10; iter++) {
        for (let a = 0; a < items.length; a++) {
          for (let b = a + 1; b < items.length; b++) {
            const dx = items[b].x - items[a].x, dy = items[b].y - items[a].y;
            const dist = Math.hypot(dx, dy) || 0.0001;
            if (dist < minDist) {
              const push = (minDist - dist) / 2;
              const ux = dx / dist, uy = dy / dist;
              items[a].x -= ux * push; items[a].y -= uy * push;
              items[b].x += ux * push; items[b].y += uy * push;
            }
          }
        }
      }
      const map = {};
      items.forEach((it) => { map[it.key] = { x: it.x, y: it.y }; });
      return map;
    }
    // Una sola bolita grande (mismo tamaño que las bolas de los sistemas)
    // con su ícono, puesta encima de cada lugar real — sin nombre visible,
    // sin líneas. Aparecen en cascada, suave, no todas de golpe.
    const buildPhenomenaHtml = () => KENNEDY_PHENOMENA.map((p, i) => {
      const proj = declutteredPositions[`phen-${i}`];
      if (!proj) return "";
      const style = KENNEDY_SYSTEM_STYLE[p.system] || { color: "#fff", icon: "fa-circle" };
      return `<button type="button" class="map-network-node map-phenomenon-node" id="map-phenomenon-${i}" data-phenomenon-index="${i}" style="left:${proj.x.toFixed(2)}%;top:${proj.y.toFixed(2)}%;--node-color:${style.color};--reveal-delay:${i * 180}ms"><i class="map-network-node-icon fa-solid ${style.icon}" aria-hidden="true"></i></button>`;
    }).join("");
    const updatePhenomenaPositions = () => {
      declutteredPositions = computeDeclutteredPositions();
      KENNEDY_PHENOMENA.forEach((p, i) => {
        const proj = declutteredPositions[`phen-${i}`];
        const el = subsystemBubbles?.querySelector(`#map-phenomenon-${i}`);
        if (proj && el) { el.style.left = proj.x.toFixed(2) + "%"; el.style.top = proj.y.toFixed(2) + "%"; }
      });
    };
    // Cajas de texto piloto: nodo circular de color en la coordenada real +
    // línea en L (blanca) hacia la caja de texto fija, igual al referente.
    // Línea recta con giro de 90° REDONDEADO (como tu foto de referencia):
    // no es una curva en S ni un ángulo filoso — son tramos rectos con una
    // esquina suave. "hvh" = sale horizontal, gira, termina horizontal.
    // "vhv" = sale vertical (arriba/abajo), gira, termina vertical.
    function roundedElbowHVH(x1, y1, x2, y2, offset, r) {
      const midX = x1 + offset;
      const sign1 = Math.sign(midX - x1) || 1;
      const sign2 = Math.sign(x2 - midX) || 1;
      const vSign = Math.sign(y2 - y1) || 1;
      const r1 = Math.min(r, Math.abs(offset) || r, Math.abs(y2 - y1) / 2 || r);
      const r2 = Math.min(r, Math.abs(x2 - midX) || r, Math.abs(y2 - y1) / 2 || r);
      const pt = (px, py) => `${px.toFixed(2)} ${py.toFixed(2)}`;
      return `M ${pt(x1, y1)} L ${pt(midX - sign1 * r1, y1)} Q ${pt(midX, y1)} ${pt(midX, y1 + vSign * r1)} L ${pt(midX, y2 - vSign * r2)} Q ${pt(midX, y2)} ${pt(midX + sign2 * r2, y2)} L ${pt(x2, y2)}`;
    }
    function roundedElbowVHV(x1, y1, x2, y2, offset, r) {
      const midY = y1 + offset;
      const sign1 = Math.sign(midY - y1) || 1;
      const sign2 = Math.sign(y2 - midY) || 1;
      const hSign = Math.sign(x2 - x1) || 1;
      const r1 = Math.min(r, Math.abs(offset) || r, Math.abs(x2 - x1) / 2 || r);
      const r2 = Math.min(r, Math.abs(y2 - midY) || r, Math.abs(x2 - x1) / 2 || r);
      const pt = (px, py) => `${px.toFixed(2)} ${py.toFixed(2)}`;
      return `M ${pt(x1, y1)} L ${pt(x1, midY - sign1 * r1)} Q ${pt(x1, midY)} ${pt(x1 + hSign * r1, midY)} L ${pt(x2 - hSign * r2, midY)} Q ${pt(x2, midY)} ${pt(x2, midY + sign2 * r2)} L ${pt(x2, y2)}`;
    }
    // Las rutas salen del borde geométrico de la bolita y llegan al borde
    // real de la caja. Primero hay un fallback para el primer render; en
    // cuanto el DOM existe, updateTextBoxes() mide los rectángulos exactos.
    const BUBBLE_EDGE = 2.35, CORNER_R = 0.95;
    const stagePercentRect = (element) => {
      const stage = subsystemBubbles?.querySelector(".map-network-stage");
      if (!stage || !element) return null;
      const sr = stage.getBoundingClientRect(), r = element.getBoundingClientRect();
      if (!sr.width || !sr.height) return null;
      return {
        left: ((r.left - sr.left) / sr.width) * 100,
        right: ((r.right - sr.left) / sr.width) * 100,
        top: ((r.top - sr.top) / sr.height) * 100,
        bottom: ((r.bottom - sr.top) / sr.height) * 100,
        centerX: (((r.left + r.right) / 2 - sr.left) / sr.width) * 100,
        centerY: (((r.top + r.bottom) / 2 - sr.top) / sr.height) * 100,
      };
    };
    const sidePoint = (metrics, side, fallbackX, fallbackY, fallbackEdge) => {
      if (metrics) {
        if (side === "left") return [metrics.left, metrics.centerY];
        if (side === "right") return [metrics.right, metrics.centerY];
        if (side === "top") return [metrics.centerX, metrics.top];
        return [metrics.centerX, metrics.bottom];
      }
      return side === "left" ? [fallbackX - fallbackEdge, fallbackY]
        : side === "right" ? [fallbackX + fallbackEdge, fallbackY]
        : side === "top" ? [fallbackX, fallbackY - fallbackEdge]
        : [fallbackX, fallbackY + fallbackEdge];
    };
    const boxFallbackMetrics = (boxPos, box) => {
      const stage = subsystemBubbles?.querySelector(".map-network-stage");
      const width = stage?.clientWidth ? (188 / stage.clientWidth) * 100 : 18;
      const height = 14;
      const right = boxPos[0] > 50 ? boxPos[0] : boxPos[0] + width;
      const left = boxPos[0] > 50 ? boxPos[0] - width : boxPos[0];
      return { left, right, top: boxPos[1] - height / 2, bottom: boxPos[1] + height / 2, centerX: (left + right) / 2, centerY: boxPos[1] };
    };
    const textBoxLinkD = (boxPos, nodeProj, route, nodeEl = null, boxEl = null, box = null) => {
      const nodeMetrics = stagePercentRect(nodeEl);
      const boxMetrics = stagePercentRect(boxEl) || boxFallbackMetrics(boxPos, box);
      if (!route) {
        const [x1, y1] = sidePoint(nodeMetrics, "right", nodeProj.x, nodeProj.y, BUBBLE_EDGE);
        const [x2, y2] = sidePoint(boxMetrics, "left", boxPos[0], boxPos[1], 0);
        return roundedElbowHVH(x1, y1, x2, y2, (x2 - x1) * 0.35, CORNER_R);
      }
      const [bx, by] = sidePoint(nodeMetrics, route.bubbleSide || "right", nodeProj.x, nodeProj.y, BUBBLE_EDGE);
      const [ox, oy] = sidePoint(boxMetrics, route.boxSide || "left", boxPos[0], boxPos[1], 0);
      // bendNear: box garantiza el orden visual indicado: primero sale de
      // la caja en horizontal/vertical y luego entra por el lado pedido de
      // la bolita. La geometría solo usa segmentos y pequeños arcos en las
      // esquinas; nunca una curva orgánica.
      const fn = route.type === "vhv" ? roundedElbowVHV : roundedElbowHVH;
      return route.bendNear === "box" ? fn(ox, oy, bx, by, route.offset, CORNER_R) : fn(bx, by, ox, oy, route.offset, CORNER_R);
    };
    // Si la caja trae "boxCoords" (una coordenada real), su posición en
    // pantalla se calcula proyectando esa coordenada — igual que un nodo —
    // en vez de usar el porcentaje fijo de "boxPos".
    const effectiveBoxPos = (box) => {
      if (box.boxCoords) {
        const proj = projectToPercent(box.boxCoords);
        if (proj) {
          const offset = box.screenOffset || [0, 0];
          return [proj.x + offset[0], proj.y + offset[1]];
        }
      }
      return box.boxPos ? [box.boxPos[0] + (box.screenOffset?.[0] || 0), box.boxPos[1] + (box.screenOffset?.[1] || 0)] : box.boxPos;
    };
    // Cada caja puede tener MÁS DE UNA coordenada real (ej. "Biblioteca El
    // Tintal / Portal Américas" son 2 lugares) — sale una línea y un nodo
    // por cada una, todas desde el mismo punto de anclaje de la caja.
    const buildTextBoxesSvg = () => KENNEDY_TEXT_BOXES.map((box, i) => {
      const boxPos = effectiveBoxPos(box);
        return box.coords.map((c, j) => {
        const proj = declutteredPositions[`box-${i}-${j}`];
        if (!proj) return "";
        // Nota: los nodos con hideIcon SÍ dibujan su línea, pero en
        // updateTextBoxes se redirige a la bolita única de ese mismo lugar
        // (en otra caja), para que no haya dos bolitas del mismo sitio.
        return `<path id="kennedy-textbox-link-${i}-${j}" class="kennedy-box-link" d="${textBoxLinkD(boxPos, proj, c.route, null, null, box)}"/>`;
      }).join("");
    }).join("");
    const buildTextBoxesHtml = () => KENNEDY_TEXT_BOXES.map((box, i) => {
      const boxPos = effectiveBoxPos(box);
      const nodesHtml = box.coords.map((c, j) => {
        const proj = declutteredPositions[`box-${i}-${j}`];
        if (!proj || c.hideIcon) return "";
        const labelHtml = c.label ? `<span class="kennedy-node-label">${c.label}</span>` : "";
        return `<div class="kennedy-node-wrap" id="kennedy-textbox-node-${i}-${j}" style="left:${proj.x.toFixed(2)}%;top:${proj.y.toFixed(2)}%"><button type="button" class="map-network-node map-phenomenon-node" data-kennedy-place="${c.label || "Lugar"}" data-kennedy-sound="${box.sound || "fisico"}" data-kennedy-box-index="${i}" data-kennedy-node-index="${j}" style="--node-color:${c.color || box.color}" aria-label="${c.label || box.title}"><i class="map-network-node-icon fa-solid ${c.icon || box.icon}" aria-hidden="true"></i></button>${labelHtml}</div>`;
      }).join("");
      const sectionsHtml = box.sections.map((section) => {
        const items = section.submodelos.map((s) => `<li><i class="fa-solid ${section.icon} kennedy-item-icon" aria-hidden="true"></i>${s}</li>`).join("");
        return `<div class="kennedy-section"><p class="kennedy-mainline">Sub-modelos:</p><ul>${items}</ul></div>`;
      }).join("");
      // La caja "crece" hacia el lado que sí cabe en la pantalla (a la
      // derecha del nodo si está en la mitad izquierda del mapa, a la
      // izquierda del nodo si está en la mitad derecha) para que no se
      // recorte contra el borde del contenedor.
      const anchorClass = boxPos[0] > 50 ? "kennedy-anchor-right" : "kennedy-anchor-left";
      const modelIconsHtml = `<div class="kennedy-model-icons"><i class="fa-regular fa-circle-dot"></i><i class="fa-regular fa-compass"></i><i class="fa-regular fa-hourglass-half"></i></div>`;
      const purposeBtnHtml = box.purpose
        ? `<button type="button" class="kennedy-purpose-btn" data-purpose-index="${i}"><i class="fa-solid fa-bullseye" aria-hidden="true"></i> Propósito</button>`
        : "";
      // El popup NO va dentro de la caja: la caja tiene overflow:hidden y lo
      // recortaría. Va como hermano, en la misma coordenada, corrido al lado.
      const purposePopHtml = box.purpose
        ? `<div class="kennedy-purpose-pop ${anchorClass}" id="kennedy-purpose-${i}" style="left:${boxPos[0]}%;top:${boxPos[1]}%;--node-color:${box.color}" hidden><button type="button" class="kennedy-purpose-close" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button><p class="kennedy-purpose-label">Propósito de Epstein</p><p class="kennedy-purpose-main">${box.purpose.epstein}</p><p class="kennedy-purpose-label">Para qué sirve</p><p class="kennedy-purpose-text">${box.purpose.para}</p></div>`
        : "";
      return `<div class="kennedy-info-box ${anchorClass}" id="kennedy-box-${i}" style="left:${boxPos[0]}%;top:${boxPos[1]}%;--node-color:${box.color}"><i class="kennedy-watermark-icon fa-solid ${box.icon}" aria-hidden="true"></i>${modelIconsHtml}<h4 class="kennedy-title-line">${box.title}</h4>${sectionsHtml}${purposeBtnHtml}</div>${purposePopHtml}${nodesHtml}`;
    }).join("");
    const updateTextBoxes = () => {
      const stage = subsystemBubbles?.querySelector(".systems-network svg .map-network-flows");
      KENNEDY_TEXT_BOXES.forEach((box, i) => {
        const boxPos = effectiveBoxPos(box);
        const boxEl = subsystemBubbles?.querySelector(`#kennedy-box-${i}`);
        if (boxEl) {
          boxEl.style.left = boxPos[0].toFixed ? boxPos[0].toFixed(2) + "%" : boxPos[0] + "%";
          boxEl.style.top = boxPos[1].toFixed ? boxPos[1].toFixed(2) + "%" : boxPos[1] + "%";
        }
        box.coords.forEach((c, j) => {
          const proj = declutteredPositions[`box-${i}-${j}`];
          const link = stage?.querySelector(`#kennedy-textbox-link-${i}-${j}`);
          const node = subsystemBubbles?.querySelector(`#kennedy-textbox-node-${i}-${j}`);
          // Si este lugar no tiene bolita propia (hideIcon), se busca la
          // bolita ÚNICA de ese mismo lugar en otra caja, para que la
          // línea llegue ahí en vez de a un punto vacío.
          const nodeButton = node?.querySelector(".map-phenomenon-node") || [...(subsystemBubbles?.querySelectorAll(".kennedy-node-wrap") || [])]
            .find((wrap) => wrap.querySelector(".kennedy-node-label")?.textContent?.trim() === c.label)
            ?.querySelector(".map-phenomenon-node");
          if (!proj) return;
          // Para un nodo con ícono oculto, la línea se dirige a la posición
          // real de la bolita única de ese lugar, no a su propia proyección.
          let targetProj = proj;
          if (c.hideIcon && nodeButton) {
            const wrap = nodeButton.closest(".kennedy-node-wrap");
            if (wrap) targetProj = { x: parseFloat(wrap.style.left), y: parseFloat(wrap.style.top) };
          }
          if (link) link.setAttribute("d", textBoxLinkD(boxPos, targetProj, c.route, nodeButton, boxEl, box));
          if (node) { node.style.left = proj.x.toFixed(2) + "%"; node.style.top = proj.y.toFixed(2) + "%"; }
        });
      });
    };
    // Al mover o hacer zoom en el mapa, las bolitas de fenómenos se
    // recalculan para que sigan exactamente sobre su coordenada real.
    const updateFlowGroups = () => {
      if (!subsystemBubbles?.classList.contains("network-active")) return;
      updateTextBoxes();
      updatePhenomenaPositions();
    };
    const renderMapNetwork = (mode = "systems", showBonds = true, target = subsystemBubbles, withFlows = true) => {
      if (!target) return;
      const systems = mode === "systems";
      const rows = systems ? territorySystems : submodelRows;
      const isPlainView = target !== subsystemBubbles;
      // La vista "solo red" (Subsistemas/Submodelos) usa un acomodo más
      // compacto y centrado, pensado para un contenedor alto sin mapa —
      // la vista anclada al mapa usa las posiciones de siempre.
      const positions = systems
        ? (isPlainView ? [[23,40],[43,16],[67,16],[82,42],[68,76],[30,76]] : [[10,46],[38,10],[70,12],[90,48],[70,86],[18,84]])
        : (isPlainView ? [[23,40],[43,16],[67,16],[82,42],[68,76],[30,76]] : [[10,46],[38,10],[70,12],[90,48],[70,86],[18,84]]);
      const colors = ["#56b8d4", "#68d391", "#b8c0c8", "#f1cf5b", "#ee9a4b", "#e58d62"];
      const systemIcons = ["fa-droplet", "fa-feather-pointed", "fa-building", "fa-route", "fa-people-group", "fa-house-chimney"];
      const submodelIcons = ["fa-water", "fa-feather-pointed", "fa-city", "fa-person-walking", "fa-house-chimney", "fa-people-arrows"];
      const label = (row) => systems ? row.name : row.name.replace(/^Submodelo de /, "");
      const icon = (index) => (systems ? systemIcons : submodelIcons)[index] || "fa-circle-nodes";
      const dynamicItems = {
        // Dinámicas observables: cada ítem describe un cambio, ciclo, flujo o condición territorial.
        hidrica: ["Precipitación y duración de las lluvias", "Infiltración, escorrentía y acumulación", "Conexión entre canales, humedales y drenajes", "Calidad del agua y carga de sedimentos", "Desborde y recuperación después de la lluvia"],
        biotica: ["Reproducción y ciclos de vida", "Alimentación y disponibilidad de refugio", "Migración y desplazamiento de especies", "Cobertura vegetal y humedad", "Calidad del aire y presión urbana"],
        fisico: ["Construcción y transformación de edificaciones", "Apertura, cierre y mantenimiento de vías", "Continuidad y deterioro de andenes", "Expansión o reducción de cerramientos", "Calidad del aire junto al borde vial"],
        movilidad: ["Desplazamientos diarios de personas y vehículos", "Cambios de ruta por congestión", "Tiempos de viaje y espera", "Entrada y salida del humedal y los equipamientos", "Conexión o aislamiento entre barrios"],
        social: ["Visita, permanencia y horarios de uso", "Cuidado y mantenimiento comunitario", "Educación ambiental y transmisión de conocimiento", "Participación y toma de decisiones", "Conflictos, acuerdos y cambios en la apropiación"],
        socioeconomico: ["Construcción y crecimiento de viviendas", "Apertura y cierre de comercios", "Concentración o desplazamiento de actividades", "Llegada o pérdida de equipamientos", "Cambio de usos del suelo y presión sobre el borde"]
      };
      // Cuando la red está anclada al mapa real (Cartografía interactiva),
      // NINGUNA bolita abstracta de sistema se muestra — solo las bolitas
      // de lugar real (Humedal El Burro, Corabastos, etc.).
      const hideAllSystemBubbles = withFlows;
      const nodes = hideAllSystemBubbles ? "" : rows.map((row, index) => { const [x,y] = positions[index]; return `<button type="button" class="map-network-node ${systems ? "map-system-node" : "map-submodel-node"}" data-map-network-index="${index}" data-sound-id="${row.id || ""}" aria-label="${label(row)}. Activar sonido del subsistema" style="--node-x:${x}%;--node-y:${y}%;--node-color:${row.color || colors[index]};--node-index:${index}"><i class="map-network-node-icon fa-solid ${icon(index)}" aria-hidden="true"></i><strong>${label(row)}</strong></button>`; }).join("");
      // Botón central: en la vista "solo red" de subsistemas, al centro del
      // anillo de las 6 bolas, dispara la explosión de las 6 a la vez con
      // todas sus dinámicas y la red completa conectada entre sí.
      const centerHubHtml = (systems && isPlainView && !hideAllSystemBubbles)
        ? `<button type="button" id="mapNetworkCenterHub" class="map-network-center-hub" aria-label="Explotar los 6 subsistemas y ver la red completa"><i class="fa-solid fa-burst"></i><span>Ver red<br>completa</span></button>`
        : "";
      // El botón fijo abajo a la izquierda hace lo mismo que el del centro
      // (queda como una segunda forma de activarlo); solo se muestra junto
      // con las 6 bolas de sistemas, no mientras están las 30 dinámicas.
      
      if (hideAllSystemBubbles) declutteredPositions = computeDeclutteredPositions();
      const kennedyBoxesHtml = hideAllSystemBubbles ? buildPhenomenaHtml() + buildTextBoxesHtml() : "";
      const relationPairs = hideAllSystemBubbles ? [] : (systems
        ? [[0,1],[0,2],[0,5],[1,2],[1,3],[1,5],[2,3],[2,4],[3,4],[3,5],[4,5]]
        : [[0,1],[0,2],[1,2],[1,3],[2,3],[2,4],[3,4],[3,5],[4,5],[4,6],[5,6],[0,6],[1,5]]
      );
      const gradientDefs = [];
      const bonds = relationPairs.map(([fromIndex, toIndex], edgeIndex) => {
        const row = rows[fromIndex], other = rows[toIndex];
        if (!row || !other) return "";
        const [x, y] = positions[fromIndex], [nx, ny] = positions[toIndex];
        const dx = nx - x, dy = ny - y, length = Math.max(1, Math.hypot(dx, dy));
        const bend = (edgeIndex % 2 ? -1 : 1) * Math.min(7.5, length * .12);
        const unit = (vx, vy) => { const size = Math.max(.001, Math.hypot(vx, vy)); return [vx / size, vy / size]; };
        const normalPoint = (px, py, tx, ty, width) => [px - ty * width, py + tx * width];
        const [ux, uy] = unit(dx, dy);
        const start = [x + ux * .15, y + uy * .15];
        const end = [nx - ux * .15, ny - uy * .15];
        const mid = [(start[0] + end[0]) / 2 - (dy / length) * bend, (start[1] + end[1]) / 2 + (dx / length) * bend];
        const curvePoint = (t) => {
          const mt = 1 - t;
          return [mt * mt * start[0] + 2 * mt * t * mid[0] + t * t * end[0], mt * mt * start[1] + 2 * mt * t * mid[1] + t * t * end[1]];
        };
        const curveTangent = (t) => unit(2 * (1 - t) * (mid[0] - start[0]) + 2 * t * (end[0] - mid[0]), 2 * (1 - t) * (mid[1] - start[1]) + 2 * t * (end[1] - mid[1]));
        const shoulder = Math.min(2.45, Math.max(1.7, length * .06));
        const widthAt = (t) => .08 + shoulder * Math.pow(Math.abs(.5 - t) * 2, 3.6);
        const ts = [0, .16, .33, .5, .67, .84, 1];
        const left = [], right = [];
        ts.forEach((t) => {
          const [px, py] = curvePoint(t);
          const [tx, ty] = curveTangent(t);
          const width = widthAt(t);
          left.push(normalPoint(px, py, tx, ty, width));
          right.push(normalPoint(px, py, tx, ty, -width));
        });
        const point = ([px, py]) => `${px.toFixed(2)} ${py.toFixed(2)}`;
        const smoothSide = (points) => {
          let d = `M ${point(points[0])}`;
          for (let i = 1; i < points.length - 1; i++) {
            const next = [(points[i][0] + points[i + 1][0]) / 2, (points[i][1] + points[i + 1][1]) / 2];
            d += ` Q ${point(points[i])} ${point(next)}`;
          }
          d += ` Q ${point(points[points.length - 1])} ${point(points[points.length - 1])}`;
          return d;
        };
        const path = `${smoothSide(left)} L ${point(right[right.length - 1])} ${smoothSide([...right].reverse()).replace(/^M [^Q]+/, "")} Z`;
        const centerPath = `M ${point(start)} Q ${point(mid)} ${point(end)}`;
        const sourceColor = row.color || colors[fromIndex];
        const targetColor = other.color || colors[toIndex];
        const gradientId = `map-network-gradient-${systems ? "systems" : "submodels"}-${edgeIndex}`;
        const pathId = `map-network-flow-${systems ? "systems" : "submodels"}-${edgeIndex}`;
        const duration = (7.5 + (edgeIndex % 4) * 1.15).toFixed(2);
        gradientDefs.push(`<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${sourceColor}" stop-opacity=".82"/><stop offset="50%" stop-color="${sourceColor}" stop-opacity=".42"/><stop offset="100%" stop-color="${targetColor}" stop-opacity=".82"/></linearGradient>`);
        return `<g class="map-network-bond-group" style="--bond-color:${sourceColor};--bond-gradient:url(#${gradientId})"><path id="${pathId}" class="map-network-bond-flow" d="${centerPath}" pathLength="1"/><path class="map-network-bond-soft" d="${path}"/><path class="map-network-bond" d="${path}"><title>Relación entre ${label(row)} y ${label(other)}</title></path><circle class="map-network-pulse" r=".42" fill="${sourceColor}"><animateMotion dur="${duration}s" begin="-${(edgeIndex * .7).toFixed(2)}s" repeatCount="indefinite" rotate="auto"><mpath href="#${pathId}"/></animateMotion></circle><circle class="map-network-pulse map-network-pulse-secondary" r=".34" fill="${targetColor}"><animateMotion dur="${duration}s" begin="-${(edgeIndex * .7 + 3.2).toFixed(2)}s" repeatCount="indefinite" rotate="auto"><mpath href="#${pathId}"/></animateMotion></circle></g>`;
      }).join("");
      target.dataset.revealState = "complete";
      target.classList.add("network-active");
      const flowsSvg = hideAllSystemBubbles ? buildTextBoxesSvg() : "";
      const flowDotsHtml = "";
      target.innerHTML = `<div class="map-network-stage ${systems ? "systems-network" : "submodels-network"}"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs>${gradientDefs.join("")}</defs><g class="map-network-flows">${flowsSvg}</g><g class="map-network-bonds">${showBonds ? bonds : ""}</g></svg>${flowDotsHtml}${nodes}${centerHubHtml}${kennedyBoxesHtml}</div>`;
      // Ya existen los rectángulos reales: corrige en el siguiente frame el
      // punto de entrada/salida para que ninguna línea quede suspendida.
      if (hideAllSystemBubbles) requestAnimationFrame(() => updateTextBoxes());
      const openFullNetwork = (event) => {
        event?.stopPropagation();
        try { DINAMICA_SOUND.play("expansion"); } catch (err) {}
        const stage = target.querySelector(".map-network-stage");
        if (stage) {
          stage.classList.add("is-stage-fading-out");
          window.setTimeout(() => {
            renderFullSubsystemsNetworkInPlace(target);
          }, 320);
        } else {
          renderFullSubsystemsNetworkInPlace(target);
        }
      };
      window.__openFullSubsystemsNetwork = openFullNetwork;
      target.querySelector("#mapNetworkCenterHub")?.addEventListener("click", openFullNetwork);
      target.querySelectorAll(".map-network-node").forEach((button) => button.addEventListener("click", () => {
        if (button.classList.contains("map-phenomenon-node")) return; // tiene su propio manejador, más abajo
        const row = rows[Number(button.dataset.mapNetworkIndex)];
        if (!row) return;
        target.querySelectorAll(".subsystem-components, .subsystem-purpose-panel, .subsystem-diagram-panel, .map-network-detail, .submodel-failure-popup, .model-objectives-popup").forEach((node) => node.remove());
        const color = row.color || colors[Number(button.dataset.mapNetworkIndex)];

        // Animación de "explosión": la bolita principal lanza hacia afuera
        // una bolita chiquita por cada componente/dinámica que la forma,
        // igual que en "Ver toda la red junta" pero en el lugar donde se
        // hizo clic, sin abrir ningún modal.
        target.querySelectorAll(".bubble-explode-satellite").forEach((n) => n.remove());
        try {
          const items = row.dynamics || row.components || (row.parts ? row.parts.split(/\s*\+\s*|\s*,\s*/) : null);
          if (items && items.length) {
            const stageRect = target.getBoundingClientRect();
            const btnRect = button.getBoundingClientRect();
            const originX = btnRect.left + btnRect.width / 2 - stageRect.left;
            const originY = btnRect.top + btnRect.height / 2 - stageRect.top;
            const satR = Math.max(70, btnRect.width * 1.3);
            const satHalf = 39; // mitad del tamaño de cada bolita (78px), para no dejar que se corte en el borde
            const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
            const sysKey = ["hidrica", "biotica", "fisico", "movilidad", "social", "socioeconomico"][Number(button.dataset.mapNetworkIndex)];
            const dynSys = sysKey && URBAN_DYNAMICS_DATA[sysKey];
            const elemList = dynSys ? dynSys.elements : (items || []).map(text => ({ name: text, icon: "fa-circle-dot", desc: text }));
            elemList.forEach((el, i) => {
              const angle = (i / elemList.length) * Math.PI * 2 - Math.PI / 2;
              const finalX = clamp(originX + satR * Math.cos(angle), satHalf, stageRect.width - satHalf);
              const finalY = clamp(originY + satR * Math.sin(angle), satHalf, stageRect.height - satHalf);
              const sat = document.createElement("div");
              sat.className = "bubble-explode-satellite";
              sat.style.setProperty("--node-color", color);
              sat.style.setProperty("--origin-x", `${originX}px`);
              sat.style.setProperty("--origin-y", `${originY}px`);
              sat.style.setProperty("--final-x", `${finalX}px`);
              sat.style.setProperty("--final-y", `${finalY}px`);
              sat.style.setProperty("--explode-delay", `${i * 55}ms`);
              sat.innerHTML = `<i class="fa-solid ${el.icon || 'fa-circle-dot'}"></i><span>${(el.name || el).replace(/\n/g, ' ')}</span>`;
              sat.title = el.desc || (el.name || el);
              sat.addEventListener("click", (satEv) => {
                satEv.stopPropagation();
                DINAMICA_SOUND.play(sysKey || "hidrica");
              });
              target.appendChild(sat);
            });
            requestAnimationFrame(() => {
              target.querySelectorAll(".bubble-explode-satellite").forEach((n) => n.classList.add("exploded"));
            });
          }
        } catch (err) {
          console.error("No se pudo mostrar la animación de explosión:", err);
        }

        // El popup de escenario de falla va PRIMERO y en su propio bloque
        // protegido: así, sin importar si algo más abajo en este mismo
        // clic falla, el popup siempre se intenta mostrar.
        let failurePopup = null;
        if (!systems) {
          try {
            const scenarioSet = submodelFailureScenarios[Number(button.dataset.mapNetworkIndex)];
            if (scenarioSet) {
              failurePopup = document.createElement("div");
              failurePopup.className = "submodel-failure-popup";
              failurePopup.style.setProperty("--bubble-color", color);
              const iconsHtml = (scenarioSet.shortIcons || []).map((ic) => `<i class="fa-solid ${ic} submodel-failure-icon"></i>`).join("");
              failurePopup.innerHTML = `<button type="button" class="submodel-failure-close" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button><div class="submodel-failure-icons">${iconsHtml}</div><span>“${scenarioSet.shortQuote}”</span>`;
              target.append(failurePopup);
              failurePopup.querySelector(".submodel-failure-close")?.addEventListener("click", (event) => { event.stopPropagation(); failurePopup.remove(); });
            }
          } catch (err) {
            console.error("No se pudo mostrar el popup de escenario de falla:", err);
          }
        }

        // Popup de Maximiza (+) / Minimiza (-) / Qué mide de este submodelo.
        let objectivesPopup = null;
        if (!systems) {
          try {
            const obj = MODEL_OBJECTIVES[Number(button.dataset.mapNetworkIndex)];
            if (obj) {
              objectivesPopup = document.createElement("div");
              objectivesPopup.className = "model-objectives-popup";
              objectivesPopup.style.setProperty("--bubble-color", color);
              objectivesPopup.innerHTML = `<div class="subsystem-panel-heading"><strong><i class="fa-solid fa-bullseye"></i> Objetivo del modelo</strong><button type="button" class="subsystem-panel-close" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button></div>
                <div class="model-objective-row"><div class="model-objective-icon up">+</div><div><b>Maximiza</b><p>${obj.max}</p></div></div>
                <div class="model-objective-row"><div class="model-objective-icon down">−</div><div><b>Minimiza</b><p>${obj.min}</p></div></div>
                <div class="model-objective-measures"><b>Qué mide</b><p>${obj.measures}</p></div>`;
              target.append(objectivesPopup);
              objectivesPopup.querySelector(".subsystem-panel-close")?.addEventListener("click", (event) => { event.stopPropagation(); objectivesPopup.remove(); });
            }
          } catch (err) {
            console.error("No se pudo mostrar el popup de objetivos del modelo:", err);
          }
        }

        try {
          DINAMICA_SOUND.play(button.dataset.soundId || row.id); button.classList.remove("sound-playing"); void button.offsetWidth; button.classList.add("sound-playing"); window.setTimeout(() => button.classList.remove("sound-playing"), 900);
        } catch (err) { console.error("Error de sonido:", err); }
        target.querySelectorAll(".map-network-node").forEach((node) => node.classList.toggle("selected", node === button));
        try {
          const purpose = document.createElement("aside");
          purpose.className = "subsystem-purpose-panel active map-purpose-panel temporal-only-panel";
          purpose.style.setProperty("--bubble-color", color);
          const forresterBtnHtml = !systems ? `<button type="button" class="forrester-open-btn" id="openForresterBtn"><i class="fa-solid fa-diagram-project"></i> Ver diagrama de Forrester</button>` : "";
          const purposeHtml = row.purpose ? `<p class="panel-scope-label">PROPÓSITO</p><p class="panel-specific-reading">${row.purpose}</p>` : "";
          const partsPurposeHtml = row.partsPurpose ? `<p class="panel-scope-label">¿LAS PARTES TIENEN PROPÓSITO?</p><p class="panel-specific-reading"><b>${row.partsPurpose}</b></p>` : "";
          const totalPurposeHtml = row.totalPurpose ? `<p class="panel-scope-label">¿EL TODO TIENE PROPÓSITO?</p><p class="panel-specific-reading"><b>${row.totalPurpose}</b></p>` : "";
          const systemTypeHtml = row.category ? `<p class="panel-scope-label">TIPO DE SISTEMA</p><p class="panel-specific-reading"><b>${row.category}</b></p>${partsPurposeHtml}${totalPurposeHtml}` : "";
          purpose.innerHTML = `<div class="subsystem-panel-heading"><strong><i class="fa-solid fa-arrows-rotate"></i> ${label(row)}</strong><button type="button" class="subsystem-panel-close" aria-label="Cerrar panel"><i class="fa-solid fa-xmark"></i></button></div>${purposeHtml}${systemTypeHtml}${forresterBtnHtml}`;
          target.append(purpose);
          purpose.querySelector("#openForresterBtn")?.addEventListener("click", (event) => { event.stopPropagation(); showForresterModal(Number(button.dataset.mapNetworkIndex), label(row), color); });
          const closePanels = (event) => { event?.stopPropagation(); purpose.remove(); failurePopup?.remove(); objectivesPopup?.remove(); target.querySelectorAll(".bubble-explode-satellite").forEach((n) => n.remove()); clearSubsystemPoints(); button.classList.remove("selected"); };
          purpose.querySelector(".subsystem-panel-close")?.addEventListener("click", closePanels);
          if (systems && withFlows) renderSubsystemPoints(subsystemData[Number(button.dataset.mapNetworkIndex)]);
        } catch (err) {
          console.error("Error mostrando los paneles de dinámica/propósito:", err);
        }
      }));
      if (hideAllSystemBubbles) {
        // Botón "Propósito" de cada caja: abre su popup al lado y cierra el
        // de las demás cajas (solo uno abierto a la vez).
        const closeAllPurposePops = () => target.querySelectorAll(".kennedy-purpose-pop").forEach((pop) => { pop.hidden = true; });
        target.querySelectorAll(".kennedy-purpose-btn").forEach((button) => button.addEventListener("click", (event) => {
          event.stopPropagation();
          const pop = target.querySelector(`#kennedy-purpose-${button.dataset.purposeIndex}`);
          if (!pop) return;
          const wasOpen = !pop.hidden;
          closeAllPurposePops();
          pop.hidden = wasOpen;
        }));
        target.querySelectorAll(".kennedy-purpose-close").forEach((button) => button.addEventListener("click", (event) => {
          event.stopPropagation();
          button.closest(".kennedy-purpose-pop").hidden = true;
        }));
        // Los nodos de lugar tienen su propio click porque el listener general
        // de la red los deja pasar. El audio vuelve a dispararse aquí, al
        // igual que en las burbujas de subsistemas y submodelos.
        target.querySelectorAll(".kennedy-node-wrap .map-phenomenon-node").forEach((button) => button.addEventListener("click", (event) => {
          event.stopPropagation();
          const box = KENNEDY_TEXT_BOXES[Number(button.dataset.kennedyBoxIndex)];
          const place = box?.coords?.[Number(button.dataset.kennedyNodeIndex)];
          if (!box || !place) return;
          DINAMICA_SOUND.play(button.dataset.kennedySound || "fisico");
          target.querySelectorAll(".map-network-node").forEach((node) => node.classList.toggle("selected", node === button));
          target.querySelectorAll(".subsystem-components, .subsystem-purpose-panel, .subsystem-diagram-panel, .map-network-detail").forEach((node) => node.remove());
          // Si este lugar tiene datos de Epstein (Corabastos, Humedal La
          // Vaca, Estación Banderas, Humedal El Burro), se muestra ESE
          // popup de Aumenta/Disminuye en vez del panel genérico.
          const placeLabel = (place.label || box.title || "").toLowerCase();
          const epsteinSpot = EPSTEIN_HOTSPOTS.find((s) => placeLabel.includes(s.label.toLowerCase()) || s.label.toLowerCase().includes(placeLabel));
          if (epsteinSpot) { showEpsteinModal(epsteinSpot); return; }
          const purpose = document.createElement("aside");
          purpose.className = "subsystem-purpose-panel active map-purpose-panel";
          purpose.style.setProperty("--bubble-color", place.color || box.color || "#fff");
          purpose.innerHTML = `<div class="subsystem-panel-heading"><strong>${place.label || box.title}</strong><button type="button" class="subsystem-panel-close" aria-label="Cerrar panel"><i class="fa-solid fa-xmark"></i></button></div><p class="panel-scope-label">NODO DEL MODELO</p><h4>${box.title}</h4><p class="panel-scope-label">CONEXIÓN</p><p>Este lugar se conecta con el modelo por el lado ${place.route?.bubbleSide || "derecho"} de la bolita, siguiendo una ruta ortogonal de segmentos rectos con giros redondeados.</p>`;
          target.append(purpose);
          const closePanels = (closeEvent) => { closeEvent?.stopPropagation(); purpose.remove(); button.classList.remove("selected"); };
          purpose.querySelector(".subsystem-panel-close")?.addEventListener("click", closePanels);
        }));
      }
    };
    const clearMapNetwork = () => { if (!subsystemBubbles) return; subsystemBubbles.classList.remove("network-active"); subsystemBubbles.replaceChildren(); clearSubsystemPoints(); };
    const drawSubsystems = ({ hidden = false } = {}) => { if (!subsystemBubbles) return; subsystemBubbles.dataset.revealState = hidden ? "pending" : "complete"; if (hidden) { clearMapNetwork(); return; } renderMapNetwork("systems"); };
    const revealSubsystems = (stagger = 150) => {
      if (!subsystemBubbles) return;
      const bubbles = [...subsystemBubbles.querySelectorAll(".subsystem-bubble")];
      subsystemBubbles.dataset.revealState = "revealing";
      bubbles.forEach((bubble, index) => window.setTimeout(() => bubble.classList.replace("is-pending", "is-visible"), index * stagger));
      window.setTimeout(() => { subsystemBubbles.dataset.revealState = "complete"; }, Math.max(0, bubbles.length - 1) * stagger + 700);
    };
    const announceCartography = (text, live = false) => { const node = document.getElementById("mapDataStatus"); if (node) node.textContent = text; node?.parentElement?.classList.toggle("live", live); };
    const showWaterMarkers = (map, stagger = 90) => { (map?.__waterMarkers || []).forEach((marker, index) => { const element = marker.getElement(); element.style.display = "grid"; window.setTimeout(() => element.classList.add("is-visible"), index * stagger); }); };
    const createSubsystemFormation = (map) => {
      const shell = map?.getContainer()?.parentElement;
      if (!shell) return;
      shell.querySelector(".subsystem-formation-overlay")?.remove();
      const overlay = document.createElement("div");
      overlay.className = "subsystem-formation-overlay";
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML = `<div class="formation-mass"><span class="formation-core"></span>${Array.from({ length: 6 }, (_, index) => `<span class="formation-cell" style="--cell-index:${index};--cell-angle:${index * 60}deg;--cell-angle-reverse:${index * -60}deg"></span>`).join("")}</div>`;
      shell.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add("formation-visible"));
      window.setTimeout(() => overlay.classList.add("formation-condensing"), 650);
      window.setTimeout(() => overlay.classList.add("formation-separating"), 1450);
      window.setTimeout(() => overlay.classList.add("formation-stretching"), 2050);
      window.setTimeout(() => overlay.classList.add("formation-released"), 2850);
      window.setTimeout(() => { overlay.remove(); drawSubsystems({ hidden: true }); revealSubsystems(160); }, 5200);
    };
    // Una vez el mapa llega a Kennedy, se queda fijo como un plano estático
    // — ya no se puede mover ni hacer zoom, así las cajas y las bolitas
    // nunca se desalinean (no hay que recalcular nada después de esto).
    function freezeMapAsStaticPlan(map) {
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.dragRotate.disable();
      map.dragPan.disable();
      map.keyboard.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();
    }
    const runCartographyOpening = (map) => {
      if (!map || map.__openingPlayed) return;
      map.__openingPlayed = true;
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      if (reduced) {
        map.jumpTo({ center: [-74.158, 4.629], zoom: 13.3 });
        announceCartography("HUMEDAL EL BURRO · AGUA Y SUBSISTEMAS", true);
        showCartography();
        freezeMapAsStaticPlan(map);
        return;
      }
      announceCartography("BOGOTÁ · LECTURA GENERAL", true);
      map.stop();
      map.jumpTo({ center: [-74.09, 4.65], zoom: 9.3 });
      window.setTimeout(() => {
        announceCartography("KENNEDY · PERÍMETRO ADMINISTRATIVO", true);
        map.flyTo({ center: [-74.158, 4.629], zoom: 12.2, duration: 4400, essential: true });
      }, 700);
      window.setTimeout(() => {
        announceCartography("APROXIMACIÓN · HUMEDAL EL BURRO", true);
        map.flyTo({ center: [-74.158, 4.629], zoom: 13.3, duration: 3800, essential: true });
        // Las bolitas, las cajas y las líneas SOLO salen cuando el mapa YA
        // terminó TODO el recorrido del zoom (este es el último tramo) y
        // queda quieto de verdad — nunca antes, nunca a medio zoom.
        map.once("moveend", () => {
          showCartography();
          freezeMapAsStaticPlan(map);
        });
      }, 5300);
      window.setTimeout(() => {
        announceCartography("HUMEDAL EL BURRO · LISTO PARA ACTIVAR UNA RED", true);
      }, 9400);
    };
    const setupCartographyEntrance = (map) => {
      const section = document.querySelector(".cartography-section");
      if (!map || !section) return runCartographyOpening(map);
      const maybePlay = () => {
        if ((window.scrollY || window.pageYOffset || 0) < 90 || map.__openingPlayed) return;
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight * .78 && rect.bottom > window.innerHeight * .18) {
          map.__openingScrollHandler && window.removeEventListener("scroll", map.__openingScrollHandler);
          map.__openingObserver?.disconnect();
          runCartographyOpening(map);
        }
      };
      const observer = "IntersectionObserver" in window ? new IntersectionObserver(maybePlay, { threshold: [.28, .55], rootMargin: "-6% 0px -12%" }) : null;
      map.__openingObserver = observer;
      map.__openingScrollHandler = maybePlay;
      observer?.observe(section);
      window.addEventListener("scroll", maybePlay, { passive: true });
    };
    drawSubsystems({ hidden: true });
    // El mapa real (Cartografía interactiva) va en su propio try/catch: si
    // MapLibre falla por cualquier motivo (red, CDN, etc.), esto NO debe
    // impedir que se dibuje la red de Subsistemas del territorio que viene
    // justo después — son funciones independientes.
    try {
      initRealCartography();
    } catch (err) {
      console.error("No se pudo iniciar la cartografía real (el resto del módulo sigue funcionando):", err);
    }
    // Lo primero que se ve al entrar al módulo son los Subsistemas del
    // territorio (solo la red, sin mapa) — Cartografía interactiva solo
    // se abre cuando el usuario le hace click a ese botón.
    try {
      showPlainNetwork("systems", directSubsystemsBtn);
    } catch (err) {
      console.error("Error mostrando la red de subsistemas:", err);
    }
  });
})();
