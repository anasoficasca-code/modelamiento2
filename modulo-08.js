/* ==========================================================
   UN NUEVO MODELO DE LECTURA — Módulo 09
   Implementa la metodología del paper "Un nuevo modelo de lectura
   para un territorio dinámico":
   - Los COMPONENTES TERRITORIALES son los mismos ya documentados en
     las 4 estructuras del POT (Construir la Red, módulo 01): EEP, EFS,
     ESE y EIP, aquí consolidados en una sola red.
   - Los ACTORES y MEDIADORES son nodos independientes (no partes de un
     componente): se activan con "Activar Dimensión Dinámica".
   - Las SITUACIONES no agregan nodos: cambian intensidad/opacidad de
     relaciones ya existentes (hora pico, lluvias, obras, etc.).
   - Color de nodo = estructura de referencia. Ícono = tipo de nodo.
   - Línea continua = directa documentada. Punteada = indirecta o
     interpretativa. Flecha = dirección sustentada. Grosor = intensidad.

   NOTA: las citas y páginas del POT reutilizan, donde el par de
   componentes coincide, el mismo sustento documental del módulo 01.
   Las relaciones que cruzan estructuras (p. ej. Humedales–Servicios
   empresariales) son interpretativas y están marcadas como tal —
   reemplázalas por la cita exacta si cuentas con ella.
   ========================================================== */

const SVG_NS = "http://www.w3.org/2000/svg";
const XHTML_NS = "http://www.w3.org/1999/xhtml";

const STRUCT_COLOR = {
  eco: "#2fd4c8",
  func: "#f5a623",
  patrim: "#f76fb0",
  actor: "#eef0f6",
  agente: "#ff5c8a",
  mediador: "#7d8ea3",
  simulador: "#b08cff",
};

/* -------- Componentes territoriales (31, red consolidada del POT) -------- */
const BASE_NODES = [
  { id: "quebradas", name: "QUEBRADAS", icon: "fa-water", struct: "eco", x: 171, y: 69, r: 24 },
  { id: "complejo_paramos", name: "COMPLEJO DE\nPÁRAMOS", icon: "fa-mountain-sun", struct: "eco", x: 337, y: 71, r: 24 },

  { id: "areas_protegidas", name: "ÁREAS\nPROTEGIDAS", icon: "fa-shield", struct: "eco", x: 166, y: 168, r: 27 },
  { id: "areas_resiliencia", name: "ÁREAS DE\nRESILIENCIA", icon: "fa-cloud-sun", struct: "eco", x: 70, y: 201, r: 26 },
  { id: "humedales", name: "HUMEDALES", icon: "fa-droplet", struct: "eco", x: 250, y: 232, r: 54 },
  { id: "rios", name: "RÍOS", icon: "fa-water", struct: "eco", x: 162, y: 296, r: 32 },
  { id: "coberturas_vegetales", name: "COBERTURAS\nVEGETALES", icon: "fa-spa", struct: "eco", x: 116, y: 359, r: 32 },

  { id: "corredores_verdes", name: "CORREDORES\nVERDES", icon: "fa-leaf", struct: "func", x: 748, y: 180, r: 27 },
  { id: "transporte_publico", name: "TRANSPORTE\nPÚBLICO", icon: "fa-bus", struct: "func", x: 499, y: 123, r: 38 },
  { id: "servicios_sociales", name: "SERVICIOS\nSOCIALES", icon: "fa-hand-holding-heart", struct: "func", x: 450, y: 54, r: 24 },
  { id: "equipamientos", name: "EQUIPAMIENTOS", icon: "fa-building", struct: "func", x: 600, y: 109, r: 34 },
  { id: "ciclorrutas", name: "CICLORRUTAS", icon: "fa-bicycle", struct: "func", x: 643, y: 37, r: 24 },
  { id: "vivienda", name: "VIVIENDA", icon: "fa-house", struct: "func", x: 561, y: 207, r: 58 },
  { id: "red_vial", name: "RED VIAL", icon: "fa-road", struct: "func", x: 664, y: 193, r: 29 },
  { id: "manzanas_cuidado", name: "MANZANAS\nDEL CUIDADO", icon: "fa-share-nodes", struct: "func", x: 627, y: 289, r: 32 },
  { id: "parques", name: "PARQUES", icon: "fa-tree-city", struct: "func", x: 682, y: 355, r: 24 },

  { id: "servicios_empresariales", name: "SERVICIOS\nEMPRESARIALES", icon: "fa-briefcase", struct: "func", x: 355, y: 466, r: 52 },
  { id: "produccion_artesanal", name: "PRODUCCIÓN\nARTESANAL", icon: "fa-gem", struct: "func", x: 243, y: 441, r: 24 },
  { id: "centros_financieros", name: "CENTROS\nFINANCIEROS", icon: "fa-building-columns", struct: "func", x: 156, y: 468, r: 24 },
  { id: "plazas_mercado", name: "PLAZAS DE\nMERCADO", icon: "fa-store", struct: "func", x: 250, y: 532, r: 24 },
  { id: "zonas_industriales", name: "ZONAS\nINDUSTRIALES", icon: "fa-industry", struct: "func", x: 470, y: 495, r: 34 },
  { id: "distrito_tecnologico", name: "DISTRITO CENTRO\nTECNOLÓGICO", icon: "fa-share-nodes", struct: "func", x: 423, y: 577, r: 27 },
  { id: "sistema_educacion", name: "SISTEMA DE\nEDUCACIÓN", icon: "fa-graduation-cap", struct: "func", x: 323, y: 589, r: 27 },
  { id: "zonas_interes_turistico", name: "ZONAS INTERÉS\nTURÍSTICO", icon: "fa-map-location-dot", struct: "func", x: 531, y: 559, r: 24 },
  { id: "centros_abastecimiento", name: "CENTROS DE\nABASTECIMIENTO", icon: "fa-truck", struct: "func", x: 304, y: 657, r: 24 },

  { id: "patrimonio_material", name: "PATRIMONIO\nMATERIAL", icon: "fa-landmark", struct: "patrim", x: 664, y: 484, r: 34 },
  { id: "patrimonio_natural", name: "PATRIMONIO\nNATURAL", icon: "fa-mountain", struct: "patrim", x: 759, y: 462, r: 34 },
  { id: "patrimonio_inmaterial", name: "PATRIMONIO\nINMATERIAL", icon: "fa-masks-theater", struct: "patrim", x: 699, y: 577, r: 27 },
  { id: "patrimonio_arqueologico", name: "PATRIMONIO\nARQUEOLÓGICO", icon: "fa-monument", struct: "patrim", x: 729, y: 654, r: 24 },
  { id: "comunidades_patrimonio", name: "COMUNIDADES", icon: "fa-people-group", struct: "patrim", x: 834, y: 450, r: 27 },
];

/* -------- Actores: nodos independientes, no partes de un componente -------- */
const ACTOR_NODES = [
  { id: "habitantes", name: "HABITANTES", icon: "fa-person", x: 395, y: 150, r: 22 },
  { id: "estudiantes", name: "ESTUDIANTES", icon: "fa-user-graduate", x: 130, y: 610, r: 22 },
  { id: "trabajadores", name: "TRABAJADORES", icon: "fa-user-tie", x: 600, y: 600, r: 22 },
  { id: "personas_cuidadoras", name: "PERSONAS\nCUIDADORAS", icon: "fa-hands-holding-child", x: 800, y: 280, r: 22 },
  { id: "comunidades_actor", name: "COMUNIDADES", icon: "fa-people-group", x: 50, y: 330, r: 22 },
  { id: "operadores_transporte", name: "OPERADORES DE\nTRANSPORTE", icon: "fa-id-badge", x: 820, y: 90, r: 22 },
  { id: "aves", name: "AVES", icon: "fa-dove", x: 170, y: 150, r: 20 },
  { id: "planeadores_pot", name: "PLANEADORES\nDEL POT", icon: "fa-compass-drafting", x: 905, y: 120, r: 22 },
  { id: "autoridad_ambiental", name: "AUTORIDAD\nAMBIENTAL", icon: "fa-leaf", x: 930, y: 245, r: 22 },
  { id: "constructores", name: "CONSTRUCTORES", icon: "fa-helmet-safety", x: 920, y: 370, r: 22 },
  { id: "arrendadores", name: "ARRENDADORES", icon: "fa-key", x: 920, y: 500, r: 22 },
  { id: "personal_salud", name: "PERSONAL DE\nSALUD", icon: "fa-user-doctor", x: 875, y: 625, r: 22 },
  { id: "emergencias", name: "EMERGENCIAS", icon: "fa-truck-medical", x: 720, y: 730, r: 22 },
  { id: "conductores", name: "CONDUCTORES", icon: "fa-steering-wheel", x: 540, y: 735, r: 22 },
  { id: "ciclistas_actor", name: "CICLISTAS", icon: "fa-person-biking", x: 360, y: 735, r: 22 },
  { id: "repartidores", name: "REPARTIDORES", icon: "fa-box", x: 180, y: 735, r: 22 },
  { id: "organizaciones_barriales", name: "ORGANIZACIONES\nBARRIALES", icon: "fa-people-roof", x: 40, y: 555, r: 22 },
  { id: "mantenimiento_urbano", name: "MANTENIMIENTO\nURBANO", icon: "fa-screwdriver-wrench", x: 45, y: 455, r: 22 },
  { id: "cuidados_salud", name: "REDES DE\nCUIDADO", icon: "fa-heart-pulse", x: 50, y: 95, r: 22 },
];

/* -------- Mediadores: qué permite que la relación ocurra -------- */
const MEDIADOR_NODES = [
  { id: "estaciones", name: "ESTACIONES", icon: "fa-train-subway", x: 540, y: 150, r: 20 },
  { id: "andenes", name: "ANDENES", icon: "fa-person-walking", x: 740, y: 230, r: 20 },
  { id: "senderos", name: "SENDEROS", icon: "fa-shoe-prints", x: 140, y: 220, r: 20 },
  { id: "puentes_peatonales", name: "PUENTES\nPEATONALES", icon: "fa-bridge", x: 60, y: 340, r: 20 },
];

const AGENT_NODES = [
  { id: "agente_cuidadora", name: "AGENTE\nCUIDADORA", icon: "fa-person-dress", x: 455, y: 292, r: 25 },
  { id: "agente_trabajador", name: "AGENTE\nTRABAJADOR", icon: "fa-person-walking", x: 540, y: 292, r: 25 },
  { id: "agente_ninez", name: "AGENTE\nNIÑEZ", icon: "fa-child-reaching", x: 575, y: 350, r: 25 },
  { id: "agente_riesgo", name: "AGENTE EN\nRIESGO", icon: "fa-triangle-exclamation", x: 420, y: 350, r: 25 },
  { id: "agente_migrante", name: "AGENTE\nMIGRANTE", icon: "fa-person-walking-luggage", x: 350, y: 315, r: 25 },
  { id: "agente_discapacidad", name: "AGENTE CON\nMOVILIDAD REDUCIDA", icon: "fa-wheelchair", x: 650, y: 315, r: 25 },
  { id: "agente_comerciante", name: "AGENTE\nCOMERCIANTE", icon: "fa-store", x: 350, y: 370, r: 25 },
  { id: "agente_mayor", name: "AGENTE\nMAYOR", icon: "fa-person-cane", x: 650, y: 370, r: 25 },
];

const SIMULATOR_NODES = [
  { id: "personas_sim", name: "PERSONAS\nAGENTES DE CUIDADO", icon: "fa-people-arrows", struct: "simulador", x: 492, y: 342, r: 42 },
  { id: "viviendas_sim", name: "VIVIENDAS\nHABITABILIDAD", icon: "fa-house-chimney-user", struct: "simulador", x: 610, y: 430, r: 42 },
  { id: "ecosistemas_sim", name: "ECOSISTEMAS\nMATRIZ ORDENADORA", icon: "fa-water", struct: "simulador", x: 270, y: 520, r: 42 },
];

const ALL_DYNAMIC_NODES = [...ACTOR_NODES, ...MEDIADOR_NODES, ...AGENT_NODES, ...SIMULATOR_NODES];

const LIVE_SCRIPTS = {
  agente_cuidadora: "Aquí muestro que el cuidado no es una actividad invisible: la agente encadena llevar, acompañar, comprar y regresar. Su recorrido se mide por tiempo, fatiga y barreras, no por un círculo geométrico.",
  agente_trabajador: "Este agente conecta vivienda, transporte y empleo. Si cambia la hora o aparece una congestión, cambia también su estrés, su tiempo disponible y la ruta que puede sostener.",
  agente_ninez: "La niñez necesita una red segura, no solamente un colegio localizado. Un cruce peligroso, un andén roto o una inundación pueden hacer imposible el recorrido previsto.",
  agente_riesgo: "Este agente representa una decisión de supervivencia: cuando no hay acceso formal, la vivienda se autoconstruye en una ladera y el riesgo aparece como resultado del sistema.",
  agente_migrante: "El agente migrante muestra que el acceso no es igual para todos. La distancia a vivienda, empleo y servicios se combina con redes de apoyo y barreras económicas.",
  agente_discapacidad: "Este agente obliga a medir la ciudad por accesibilidad efectiva. Una ruta existe en el mapa, pero deja de existir si no tiene continuidad, pendiente habitable o cruce seguro.",
  agente_comerciante: "El comerciante conecta vivienda, abastecimiento, movilidad y economía cotidiana. Una obra vial puede mejorar una conexión y al mismo tiempo cortar su clientela y su ingreso.",
  agente_mayor: "El agente mayor hace visible que el tiempo y la seguridad tienen otra escala. Un recorrido de quince minutos para una persona puede ser mucho más largo para otra.",
};

function nodeKind(id) {
  if (BASE_NODES.some(n => n.id === id)) return "componente";
  if (ACTOR_NODES.some(n => n.id === id)) return "actor";
  if (MEDIADOR_NODES.some(n => n.id === id)) return "mediador";
  if (AGENT_NODES.some(n => n.id === id)) return "agente";
  if (SIMULATOR_NODES.some(n => n.id === id)) return "simulador";
  return "componente";
}

function findNode(id) {
  return BASE_NODES.find(n => n.id === id) || ALL_DYNAMIC_NODES.find(n => n.id === id);
}

/* -------- Relaciones entre componentes territoriales -------- */
/* tipo: "directa" (línea continua) | "indirecta" (línea punteada, incluye
   relaciones interpretativas sin cita textual). dirigida: si hay flecha. */
const BASE_EDGES = [
  { s: "quebradas", t: "humedales", tipo: "directa", dirigida: true, evidencia: "El POT reconoce las quebradas como afluentes que alimentan el sistema de humedales urbanos.", page: "p. 196", critica: "La relación es hídrica y unidireccional aguas abajo; no muestra la variación estacional del caudal." },
  { s: "areas_protegidas", t: "humedales", tipo: "directa", dirigida: true, evidencia: "Las áreas protegidas incluyen la ronda de protección de los humedales.", page: "p. 200", critica: "La protección normativa no garantiza por sí sola el estado ecológico del humedal." },
  { s: "areas_resiliencia", t: "coberturas_vegetales", tipo: "directa", dirigida: true, evidencia: "Las áreas de resiliencia climática dependen de la conservación de coberturas vegetales.", page: "p. 201", critica: "La dependencia es ecológica; no incorpora el efecto de la urbanización sobre esas coberturas." },
  { s: "humedales", t: "rios", tipo: "directa", dirigida: true, evidencia: "Los humedales hacen parte del sistema hídrico junto con los ríos de la ciudad.", page: "p. 196", critica: "La relación no distingue temporada seca de temporada de lluvias, donde la intensidad cambia." },
  { s: "humedales", t: "coberturas_vegetales", tipo: "directa", dirigida: true, evidencia: "Los humedales sostienen las coberturas vegetales de su ronda hidráulica.", page: "p. 197", critica: "No especifica qué franja de ronda queda realmente cubierta en la práctica." },
  { s: "humedales", t: "servicios_empresariales", tipo: "indirecta", dirigida: true, evidencia: "Relación interpretativa: la cercanía de actividad empresarial condiciona el régimen de uso del suelo alrededor del humedal.", page: null, critica: "No hay cita textual del POT para este cruce; se incluye porque ambos aparecen en el mismo corredor territorial." },
  { s: "vivienda", t: "transporte_publico", tipo: "directa", dirigida: true, evidencia: "La vivienda se conecta con el resto de la ciudad a través del transporte público.", page: "p. 30", critica: "La conexión documentada no dice nada sobre tiempos de espera ni transbordos reales." },
  { s: "vivienda", t: "equipamientos", tipo: "directa", dirigida: true, evidencia: "La vivienda se articula con los sistemas de cuidado y equipamientos comunitarios.", page: "p. 29", critica: "No diferencia el tipo de equipamiento ni su distancia real a la vivienda." },
  { s: "vivienda", t: "red_vial", tipo: "directa", dirigida: true, evidencia: "La vivienda se conecta con el resto de la ciudad a través de la red vial.", page: "p. 30", critica: "Es una relación de accesibilidad general, no de calidad de la malla vial." },
  { s: "vivienda", t: "manzanas_cuidado", tipo: "directa", dirigida: true, evidencia: "Las Manzanas del Cuidado se organizan alrededor de la vivienda cercana.", page: "p. 32", critica: "El radio de proximidad real varía según el barrio y no está fijado en el documento." },
  { s: "vivienda", t: "comunidades_patrimonio", tipo: "indirecta", dirigida: true, evidencia: "Relación interpretativa: la vivienda del sector se asocia con las comunidades que sostienen su patrimonio.", page: null, critica: "Es una lectura territorial, no una relación explícitamente documentada en el POT." },
  { s: "transporte_publico", t: "servicios_sociales", tipo: "indirecta", dirigida: true, evidencia: "El transporte público facilita, sin ser la única vía, el acceso a servicios sociales.", page: "p. 29", critica: "No es exclusiva: hay otros modos de acceso a servicios sociales no representados aquí." },
  { s: "transporte_publico", t: "ciclorrutas", tipo: "indirecta", dirigida: true, evidencia: "El transporte público se complementa con la red de ciclorrutas en los últimos tramos del viaje.", page: "p. 39", critica: "La intermodalidad depende de infraestructura de transbordo que no siempre existe." },
  { s: "equipamientos", t: "corredores_verdes", tipo: "directa", dirigida: true, evidencia: "Los equipamientos se articulan con los corredores verdes urbanos cercanos.", page: "p. 40", critica: "La articulación física no siempre implica continuidad peatonal real." },
  { s: "manzanas_cuidado", t: "parques", tipo: "directa", dirigida: true, evidencia: "Las Manzanas del Cuidado incluyen parques como parte de sus servicios de proximidad.", page: "p. 40", critica: "No especifica el estándar mínimo de área verde por Manzana." },
  { s: "servicios_empresariales", t: "produccion_artesanal", tipo: "directa", dirigida: true, evidencia: "Los servicios empresariales impulsan la producción artesanal local.", page: "p. 60", critica: "La relación es de impulso económico, no de encadenamiento productivo formalizado." },
  { s: "servicios_empresariales", t: "centros_financieros", tipo: "directa", dirigida: true, evidencia: "Los servicios empresariales dependen del respaldo de los centros financieros.", page: "p. 55", critica: "No distingue financiamiento formal de informal, ambos presentes en el territorio." },
  { s: "servicios_empresariales", t: "plazas_mercado", tipo: "directa", dirigida: true, evidencia: "Los servicios empresariales se articulan con las plazas de mercado del sector.", page: "p. 60", critica: "La plaza de mercado tiene una lógica de escala barrial distinta a la empresarial." },
  { s: "servicios_empresariales", t: "zonas_industriales", tipo: "directa", dirigida: true, evidencia: "Los servicios empresariales se complementan con las zonas industriales cercanas.", page: "p. 48", critica: "No aborda el conflicto de usos entre industria y otros usos urbanos." },
  { s: "servicios_empresariales", t: "distrito_tecnologico", tipo: "directa", dirigida: true, evidencia: "Los servicios empresariales se apoyan en el Distrito Centro Tecnológico e Innovación.", page: "p. 46", critica: "El distrito es un proyecto de escala mayor; su efecto local aún no está evaluado." },
  { s: "servicios_empresariales", t: "sistema_educacion", tipo: "directa", dirigida: true, evidencia: "El sistema de educación forma el talento humano de los servicios empresariales.", page: "p. 53", critica: "La formación de talento humano es un proceso de largo plazo, no inmediato." },
  { s: "zonas_industriales", t: "patrimonio_material", tipo: "indirecta", dirigida: true, evidencia: "Relación interpretativa: la actividad industrial cercana condiciona la conservación del patrimonio material.", page: null, critica: "No hay cita textual; se infiere del cruce territorial entre ambos usos." },
  { s: "zonas_industriales", t: "zonas_interes_turistico", tipo: "indirecta", dirigida: false, evidencia: "Relación interpretativa: ambos usos conviven en el mismo corredor sin una jerarquía definida.", page: null, critica: "La convivencia puede ser complementaria o conflictiva según el caso concreto." },
  { s: "patrimonio_material", t: "patrimonio_natural", tipo: "directa", dirigida: true, evidencia: "El patrimonio material y el patrimonio natural comparten un mismo sistema de conservación.", page: "p. 196", critica: "No define un mecanismo de gestión conjunta entre ambos tipos de patrimonio." },
  { s: "patrimonio_natural", t: "comunidades_patrimonio", tipo: "directa", dirigida: true, evidencia: "Las comunidades son testimonio y sostén del patrimonio natural del territorio.", page: "p. 186", critica: "No distingue qué comunidad específica ejerce ese sostén en cada caso." },
  { s: "patrimonio_natural", t: "patrimonio_inmaterial", tipo: "directa", dirigida: true, evidencia: "El patrimonio natural y el patrimonio inmaterial se reconocen como un sistema integrado.", page: "p. 196", critica: "La integración normativa no implica una gestión articulada en la práctica." },
  { s: "patrimonio_inmaterial", t: "patrimonio_arqueologico", tipo: "indirecta", dirigida: true, evidencia: "Relación interpretativa: el patrimonio inmaterial documenta prácticas asociadas a hallazgos arqueológicos del sector.", page: null, critica: "Es una asociación temática, no una relación de manejo documentada." },
  { s: "distrito_tecnologico", t: "zonas_interes_turistico", tipo: "indirecta", dirigida: true, evidencia: "El Distrito Centro Tecnológico e Innovación incrementa el valor turístico de la zona.", page: "p. 50", critica: "El efecto turístico proyectado aún no tiene evidencia de resultado." },
  { s: "centros_abastecimiento", t: "sistema_educacion", tipo: "indirecta", dirigida: false, evidencia: "Relación interpretativa: ambos comparten el mismo corredor de servicios del sector.", page: null, critica: "La coincidencia espacial no implica una relación funcional comprobada." },
];

/* -------- Relaciones actor/mediador → componente (dimensión dinámica) -------- */
const DYNAMIC_EDGES = [
  { s: "agente_cuidadora", t: "personas_sim", tipo: "directa", dirigida: true, evidencia: "La agente cuidadora organiza una trayectoria diaria para resolver tareas de cuidado y servicios de proximidad.", page: "Módulo Simulador", actores: "Agente cuidadora", critica: "La ruta depende del tiempo disponible, la fatiga y la simultaneidad de tareas, no de una distancia abstracta." },
  { s: "agente_trabajador", t: "personas_sim", tipo: "directa", dirigida: true, evidencia: "El agente trabajador combina vivienda, transporte y empleo en una trayectoria cotidiana que cambia según la hora y la accesibilidad.", page: "Módulo Simulador", actores: "Agente trabajador", critica: "El POT localiza usos, pero no observa la cadena completa de desplazamientos ni los tiempos de espera." },
  { s: "agente_ninez", t: "personas_sim", tipo: "directa", dirigida: true, evidencia: "La niñez depende de recorridos seguros hacia educación, cuidado, parques y espacio público cercano.", page: "Módulo Simulador", actores: "Agente niñez", critica: "La seguridad del recorrido no se reduce a la existencia de un equipamiento: depende de cruces, andenes y acompañamiento." },
  { s: "agente_riesgo", t: "viviendas_sim", tipo: "indirecta", dirigida: true, evidencia: "Cuando el acceso formal falla, el agente puede autoconstruir en una ladera de riesgo como respuesta de supervivencia.", page: "Escenario de informalidad", actores: "Agente en riesgo", critica: "La informalidad es una dinámica de acceso y supervivencia, no solamente una categoría morfológica." },
  { s: "agente_cuidadora", t: "manzanas_cuidado", tipo: "directa", dirigida: true, evidencia: "La agente cuidadora usa las Manzanas del Cuidado para resolver necesidades dentro de un rango de 15 minutos caminando.", page: "Módulo Simulador", actores: "Agente cuidadora", critica: "El radio real se mide por tiempo vivido, barreras y continuidad peatonal." },
  { s: "agente_trabajador", t: "transporte_publico", tipo: "directa", dirigida: true, evidencia: "El transporte público conecta vivienda y trabajo, y su accesibilidad cambia con la hora pico o el cierre de una estación.", page: "Módulo Simulador", actores: "Agente trabajador", critica: "El flujo no es constante: una interrupción redistribuye las rutas y el estrés del agente." },
  { s: "agente_ninez", t: "andenes", tipo: "directa", dirigida: true, evidencia: "El andén funciona como mediador de un recorrido seguro hacia equipamientos, cuidado y parques.", page: "Módulo Simulador", actores: "Agente niñez", critica: "Si el andén se rompe o se inunda, la trayectoria formal deja de ser utilizable." },
  { s: "agente_riesgo", t: "ecosistemas_sim", tipo: "indirecta", dirigida: true, evidencia: "La localización de la vivienda informal expone al agente a pendientes, escorrentía y amenazas ambientales.", page: "Escenario de informalidad", actores: "Agente en riesgo · Ecosistemas", critica: "La matriz ambiental condiciona las decisiones de localización y no opera como un simple telón de fondo." },
  { s: "agente_migrante", t: "viviendas_sim", tipo: "indirecta", dirigida: true, evidencia: "El acceso a vivienda se cruza con redes de apoyo, empleo, arriendo y localización de servicios.", page: "Módulo Simulador", actores: "Agente migrante", critica: "La formalidad de la vivienda no explica por sí sola la capacidad de permanecer y acceder a la ciudad." },
  { s: "agente_migrante", t: "servicios_sociales", tipo: "directa", dirigida: true, evidencia: "El agente migrante depende de servicios sociales y redes de cuidado para estabilizar su trayectoria urbana.", page: "Módulo Simulador", actores: "Agente migrante", critica: "La red normativa no muestra la secuencia de trámites, esperas y desplazamientos necesarios para acceder." },
  { s: "agente_discapacidad", t: "andenes", tipo: "directa", dirigida: true, evidencia: "La continuidad y calidad del andén determinan si la ruta es realmente accesible.", page: "Módulo Simulador", actores: "Agente con movilidad reducida", critica: "La presencia de infraestructura no equivale a accesibilidad efectiva." },
  { s: "agente_discapacidad", t: "estaciones", tipo: "directa", dirigida: true, evidencia: "Las estaciones deben funcionar como intercambiadores accesibles entre vivienda, trabajo y servicios.", page: "Módulo Simulador", actores: "Agente con movilidad reducida", critica: "Una estación aislada no resuelve el último tramo del viaje." },
  { s: "agente_comerciante", t: "plazas_mercado", tipo: "directa", dirigida: true, evidencia: "El comercio cotidiano conecta abastecimiento, empleo y recorridos de proximidad.", page: "Módulo Simulador", actores: "Agente comerciante", critica: "El cierre de una vía puede transformar la economía local aunque la infraestructura principal siga funcionando." },
  { s: "agente_comerciante", t: "red_vial", tipo: "indirecta", dirigida: true, evidencia: "La actividad comercial depende de accesos peatonales, carga, transporte y continuidad de la red vial.", page: "Módulo Simulador", actores: "Agente comerciante", critica: "La red vial se mide también por los efectos que produce sobre ingresos y permanencia." },
  { s: "agente_mayor", t: "parques", tipo: "directa", dirigida: true, evidencia: "Los parques y espacios de proximidad sostienen actividad física, encuentro y cuidado cotidiano.", page: "Módulo Simulador", actores: "Agente mayor", critica: "La proximidad debe considerar descanso, sombra, seguridad y continuidad, no solo distancia." },
  { s: "agente_mayor", t: "servicios_sociales", tipo: "directa", dirigida: true, evidencia: "El agente mayor requiere una red de servicios sociales conectada con la vivienda y los recorridos cotidianos.", page: "Módulo Simulador", actores: "Agente mayor", critica: "La oferta localizada no garantiza acceso si el recorrido es inseguro o demasiado exigente." },
  { s: "personas_sim", t: "viviendas_sim", tipo: "directa", dirigida: true, evidencia: "La vivienda es el nodo de origen y retorno de cada agente de cuidado; sus condiciones de habitabilidad modifican el estrés, la salud y el tiempo disponible.", page: "Módulo Simulador", actores: "Personas · Viviendas", critica: "El POT fija usos y estándares, pero no corre la trayectoria diaria ni la experiencia acumulada de sus habitantes." },
  { s: "personas_sim", t: "ecosistemas_sim", tipo: "directa", dirigida: true, evidencia: "Las personas recorren una ciudad atravesada por conectores ecosistémicos, escorrentías y espacios públicos seguros; el entorno modifica las rutas posibles.", page: "Módulo Simulador", actores: "Personas · Ecosistemas", critica: "El recorrido no es una línea recta: depende de fatiga, tiempo disponible, simultaneidad del cuidado y condiciones ambientales." },
  { s: "ecosistemas_sim", t: "viviendas_sim", tipo: "directa", dirigida: true, evidencia: "La matriz ecológica ordena el borde urbano mediante comportamiento hídrico, mitigación del riesgo y sistemas urbanos de drenaje sostenible.", page: "Módulo Simulador", actores: "Ecosistemas · Viviendas", critica: "El polígono de protección no permite anticipar por sí solo cómo una inundación o la escorrentía afectan la vivienda de borde." },
  { s: "personas_sim", t: "manzanas_cuidado", tipo: "directa", dirigida: true, evidencia: "Cada agente tiene una trayectoria cotidiana orientada a resolver necesidades en un rango de 15 minutos caminando, con enfoque de género y derechos del Sistema Distrital de Cuidado.", page: "Módulo Simulador", actores: "Personas cuidadoras", critica: "Los 15 minutos se prueban como tiempo vivido y red accesible, no como un círculo abstracto medido en línea recta." },
  { s: "viviendas_sim", t: "vivienda", tipo: "directa", dirigida: true, evidencia: "El Artículo 384 fija 36 m² como área mínima de una vivienda VIS o VIP y el Parágrafo 1 exige 42 m² de área mínima habitable para acreditar la obligación urbanística.", page: "Art. 384", actores: "Viviendas", critica: "La norma establece una condición inicial; la simulación observa el mejoramiento progresivo, el hacinamiento y sus efectos sobre la vida cotidiana." },
  { s: "ecosistemas_sim", t: "humedales", tipo: "directa", dirigida: true, evidencia: "Los ecosistemas se modelan como actores: conectores, escorrentía, mitigación de riesgo y drenaje sostenible interactúan con la movilidad y la estabilidad urbana.", page: "Módulo Simulador", actores: "Ecosistemas", critica: "El entorno deja de ser un fondo inerte y pasa a modificar físicamente las decisiones de agentes y viviendas." },
  { s: "personas_sim", t: "vivienda", tipo: "indirecta", dirigida: true, evidencia: "Cuando no existe acceso a vivienda formal, un agente puede autoconstruir en una ladera de riesgo por supervivencia.", page: "Escenario de informalidad", actores: "Personas · Viviendas", critica: "La autoorganización informal aparece como resultado emergente, no como una excepción que el plan pueda resolver solo con una categoría." },
  { s: "personas_sim", t: "ecosistemas_sim", tipo: "indirecta", dirigida: true, evidencia: "Ante un sismo o una inundación, los agentes pueden abandonar la ruta prevista y autodeterminar una evacuación hacia el espacio público seguro más cercano.", page: "Escenarios de perturbación", actores: "Personas · Ecosistemas", critica: "La ciudad se observa mientras está siendo: una ruta formal puede romperse y producir nuevas decisiones en tiempo real." },
  { s: "habitantes", t: "transporte_publico", tipo: "indirecta", dirigida: true, evidencia: "Los habitantes son quienes usan cotidianamente el transporte público.", page: null, actores: "Habitantes", critica: "El uso no es homogéneo: cambia con la edad, el ingreso y la movilidad reducida." },
  { s: "habitantes", t: "vivienda", tipo: "indirecta", dirigida: true, evidencia: "Los habitantes son quienes ocupan y sostienen la vivienda día a día.", page: null, actores: "Habitantes", critica: "La ocupación real puede diferir del uso previsto por el POT (subarriendo, hacinamiento)." },
  { s: "estudiantes", t: "sistema_educacion", tipo: "indirecta", dirigida: true, evidencia: "Los estudiantes son actores centrales del sistema de educación del sector.", page: null, actores: "Estudiantes", critica: "No todos los estudiantes acceden al sistema de educación más cercano a su vivienda." },
  { s: "trabajadores", t: "servicios_empresariales", tipo: "indirecta", dirigida: true, evidencia: "Los trabajadores activan diariamente los servicios empresariales del sector.", page: null, actores: "Trabajadores", critica: "La relación no distingue empleo formal de informal, con condiciones muy distintas." },
  { s: "trabajadores", t: "zonas_industriales", tipo: "indirecta", dirigida: true, evidencia: "Los trabajadores operan y sostienen la actividad de las zonas industriales.", page: null, actores: "Trabajadores", critica: "El desplazamiento de los trabajadores hacia la zona industrial no siempre es corto." },
  { s: "personas_cuidadoras", t: "manzanas_cuidado", tipo: "indirecta", dirigida: true, evidencia: "Las personas cuidadoras son quienes usan y sostienen las Manzanas del Cuidado.", page: null, actores: "Personas cuidadoras", critica: "El diseño de la Manzana no siempre responde a los tiempos reales del cuidado." },
  { s: "comunidades_actor", t: "humedales", tipo: "indirecta", dirigida: true, evidencia: "Las comunidades vecinas protegen y usan cotidianamente el humedal.", page: null, actores: "Comunidades", critica: "No toda comunidad vecina tiene el mismo nivel de organización para proteger el humedal." },
  { s: "operadores_transporte", t: "transporte_publico", tipo: "indirecta", dirigida: true, evidencia: "Los operadores de transporte son quienes ponen en funcionamiento el sistema.", page: null, actores: "Operadores de transporte", critica: "La calidad del servicio depende de condiciones laborales no representadas en la red." },
  { s: "aves", t: "humedales", tipo: "indirecta", dirigida: true, evidencia: "Las aves migratorias y residentes dependen del ecosistema del humedal.", page: null, actores: "Aves (especies concretas)", critica: "La relación cambia según la temporada migratoria, no es constante todo el año." },
  { s: "estaciones", t: "transporte_publico", tipo: "directa", dirigida: false, evidencia: "Las estaciones son el mediador físico que hace posible el uso del transporte público.", page: null, critica: "El número y ubicación real de estaciones condiciona la equidad de acceso." },
  { s: "andenes", t: "red_vial", tipo: "directa", dirigida: false, evidencia: "Los andenes son el mediador que permite el uso peatonal de la red vial.", page: null, critica: "El estado físico del andén no está representado, solo su existencia." },
  { s: "senderos", t: "humedales", tipo: "directa", dirigida: false, evidencia: "Los senderos median el uso comunitario y recreativo del humedal.", page: null, actores: "Comunidades", critica: "Un exceso de senderos puede presionar ecológicamente el borde del humedal." },
  { s: "senderos", t: "areas_protegidas", tipo: "directa", dirigida: false, evidencia: "Los senderos permiten el recorrido controlado dentro de áreas protegidas.", page: null, critica: "El control real del recorrido depende de mantenimiento y señalización." },
  { s: "puentes_peatonales", t: "rios", tipo: "directa", dirigida: false, evidencia: "Los puentes peatonales median el cruce seguro sobre los ríos urbanos.", page: null, critica: "No todos los tramos del río cuentan con un puente peatonal cercano." },
];

/* -------- Cadenas de interacción: la red no termina en una relación aislada -------- */
const CHAIN_EDGES = [
  { s: "agente_cuidadora", t: "viviendas_sim", tipo: "directa", dirigida: true, evidencia: "La vivienda es origen y retorno de la cadena diaria de cuidado.", page: "Módulo Simulador", actores: "Agente cuidadora · Viviendas", critica: "El cuidado reorganiza la jornada alrededor del lugar donde se habita.", live: "Puedes decir: “La vivienda no es un punto: es el origen y el regreso de una cadena de tareas.”" },
  { s: "viviendas_sim", t: "andenes", tipo: "directa", dirigida: true, evidencia: "El andén convierte la vivienda en un recorrido peatonal posible.", page: "Módulo Simulador", actores: "Viviendas · Andenes", critica: "La habitabilidad depende también de poder salir y llegar de forma segura.", live: "Puedes decir: “Aquí conectamos el interior de la vivienda con la primera condición urbana: poder caminar hasta la red.”" },
  { s: "andenes", t: "estaciones", tipo: "directa", dirigida: true, evidencia: "Los andenes conectan el origen cotidiano con las estaciones y sus intercambios.", page: "Módulo Simulador", actores: "Andenes · Estaciones", critica: "Una estación no es accesible si el último tramo está roto o discontinuo.", live: "Puedes decir: “La estación empieza antes de la estación: empieza en la continuidad del andén.”" },
  { s: "estaciones", t: "transporte_publico", tipo: "directa", dirigida: true, evidencia: "Las estaciones activan el servicio de transporte y permiten el transbordo.", page: "Módulo Simulador", actores: "Estaciones · Transporte público", critica: "El sistema cambia cuando una estación se cierra o se congestiona.", live: "Puedes decir: “El transporte es una red temporal: si un nodo falla, la trayectoria completa se reorganiza.”" },
  { s: "transporte_publico", t: "servicios_empresariales", tipo: "indirecta", dirigida: true, evidencia: "El transporte conecta los hogares con los lugares de empleo y actividad económica.", page: "Módulo Simulador", actores: "Transporte · Trabajo", critica: "El mapa muestra conexión, pero no muestra el tiempo perdido ni la desigualdad del viaje.", live: "Puedes decir: “La conexión con el empleo no se mide solo porque exista una línea: se mide por el tiempo que le roba o le devuelve al agente.”" },
  { s: "agente_trabajador", t: "viviendas_sim", tipo: "directa", dirigida: true, evidencia: "El trabajador sale de la vivienda y retorna a ella bajo condiciones cambiantes de transporte y empleo.", page: "Módulo Simulador", actores: "Agente trabajador · Viviendas", critica: "La jornada laboral y la vivienda se afectan mutuamente mediante tiempo y estrés.", live: "Puedes decir: “El agente trabaja en la ciudad, pero la ciudad también entra a su casa convertida en cansancio y tiempo de retorno.”" },
  { s: "viviendas_sim", t: "equipamientos", tipo: "directa", dirigida: true, evidencia: "La vivienda se articula con educación, salud, cuidado y otros equipamientos.", page: "Módulo Simulador", actores: "Viviendas · Equipamientos", critica: "La proximidad normativa no garantiza acceso efectivo.", live: "Puedes decir: “La pregunta no es si el equipamiento existe, sino si este hogar puede llegar a él.”" },
  { s: "equipamientos", t: "sistema_educacion", tipo: "directa", dirigida: true, evidencia: "Los equipamientos educativos reciben y organizan trayectorias de estudiantes y cuidadores.", page: "Módulo Simulador", actores: "Equipamientos · Educación", critica: "La trayectoria educativa depende de horarios, seguridad y acompañamiento.", live: "Puedes decir: “Un colegio produce muchas trayectorias alrededor: estudiantes, cuidadores, transporte y comercio.”" },
  { s: "manzanas_cuidado", t: "parques", tipo: "directa", dirigida: true, evidencia: "Las Manzanas del Cuidado se apoyan en parques y espacio público de proximidad.", page: "Módulo Simulador", actores: "Cuidado · Parques", critica: "El espacio público debe sostener descanso, juego, acompañamiento y seguridad.", live: "Puedes decir: “El cuidado no ocurre dentro de un edificio aislado: se extiende por la red de espacio público.”" },
  { s: "agente_ninez", t: "sistema_educacion", tipo: "directa", dirigida: true, evidencia: "La trayectoria de la niñez conecta vivienda, andenes, cuidado y educación.", page: "Módulo Simulador", actores: "Agente niñez · Educación", critica: "La ruta escolar puede cambiar por una barrera mínima que el plano no registra.", live: "Puedes decir: “Para la niñez, una interrupción pequeña en la red puede convertirse en una interrupción total del acceso.”" },
  { s: "agente_migrante", t: "vivienda", tipo: "indirecta", dirigida: true, evidencia: "La búsqueda de arriendo y vivienda formal conecta redes de apoyo con el mercado urbano.", page: "Módulo Simulador", actores: "Agente migrante · Vivienda", critica: "El acceso residencial está mediado por ingreso, información y redes sociales.", live: "Puedes decir: “La vivienda no se asigna de manera abstracta: cada agente llega con recursos y barreras diferentes.”" },
  { s: "agente_discapacidad", t: "vivienda_sim", tipo: "directa", dirigida: true, evidencia: "La vivienda y el espacio público deben formar una cadena accesible de origen a destino.", page: "Módulo Simulador", actores: "Agente con movilidad reducida", critica: "Una barrera en un solo tramo invalida toda la cadena de accesibilidad.", live: "Puedes decir: “La accesibilidad no es una propiedad de un punto: es una propiedad de toda la ruta.”" },
  { s: "agente_comerciante", t: "centros_abastecimiento", tipo: "directa", dirigida: true, evidencia: "El agente comerciante conecta abastecimiento, ventas, vivienda y movilidad cotidiana.", page: "Módulo Simulador", actores: "Agente comerciante · Abastecimiento", critica: "La economía barrial depende de conexiones pequeñas que el modelo oficial suele dejar fuera.", live: "Puedes decir: “Esta conexión demuestra que la movilidad también es ingreso, abastecimiento y permanencia económica.”" },
  { s: "centros_abastecimiento", t: "plazas_mercado", tipo: "directa", dirigida: true, evidencia: "Los centros de abastecimiento alimentan circuitos de comercio y consumo local.", page: "Módulo Simulador", actores: "Abastecimiento · Plazas", critica: "La red de alimentos tiene tiempos, cargas y dependencias que no aparecen en un polígono de uso.", live: "Puedes decir: “La ciudad se sostiene por cadenas de abastecimiento, no solo por edificios localizados.”" },
  { s: "agente_mayor", t: "viviendas_sim", tipo: "directa", dirigida: true, evidencia: "La vivienda es base de la autonomía, el cuidado y la salud cotidiana de las personas mayores.", page: "Módulo Simulador", actores: "Agente mayor · Viviendas", critica: "La habitabilidad debe medirse por autonomía y seguridad, no únicamente por metros cuadrados.", live: "Puedes decir: “Los mismos metros cuadrados pueden producir experiencias muy distintas según quién habita la vivienda.”" },
  { s: "agente_mayor", t: "parques", tipo: "directa", dirigida: true, evidencia: "Los parques sostienen recorridos cortos, actividad física y encuentro social.", page: "Módulo Simulador", actores: "Agente mayor · Parques", critica: "La proximidad requiere sombra, descanso, continuidad y seguridad.", live: "Puedes decir: “Para este agente, la distancia se convierte en pausas, pendientes y sensación de seguridad.”" },
  { s: "ecosistemas_sim", t: "quebradas", tipo: "directa", dirigida: true, evidencia: "La matriz ecológica se expresa en flujos de agua que atraviesan el territorio.", page: "Módulo Simulador", actores: "Ecosistemas · Quebradas", critica: "El agua no respeta la separación rígida entre categorías urbanas.", live: "Puedes decir: “El ecosistema no es el fondo del mapa: es un flujo que atraviesa y reorganiza la ciudad.”" },
  { s: "quebradas", t: "humedales", tipo: "directa", dirigida: true, evidencia: "Las quebradas conducen escorrentías hacia humedales y otros cuerpos de agua.", page: "Módulo Simulador", actores: "Quebradas · Humedales", critica: "La intensidad del vínculo cambia con la lluvia y la ocupación del suelo.", live: "Puedes decir: “Cuando llueve, esta conexión se activa y el agua convierte el mapa en una secuencia física.”" },
  { s: "humedales", t: "andenes", tipo: "indirecta", dirigida: true, evidencia: "La condición hídrica del humedal puede modificar la continuidad de recorridos y bordes urbanos.", page: "Módulo Simulador", actores: "Humedales · Andenes", critica: "El límite ecológico y el recorrido cotidiano se afectan mutuamente.", live: "Puedes decir: “Una inundación no es solamente un problema ambiental: también es una interrupción de movilidad.”" },
  { s: "rios", t: "puentes_peatonales", tipo: "directa", dirigida: true, evidencia: "Los puentes permiten que la red peatonal atraviese el sistema hídrico.", page: "Módulo Simulador", actores: "Ríos · Puentes", critica: "Si el cruce falla, la ciudad se fragmenta aunque los destinos sigan cerca.", live: "Puedes decir: “La resiliencia aparece cuando el sistema mantiene el cruce, no solamente cuando dibuja el río.”" },
  { s: "agente_riesgo", t: "puentes_peatonales", tipo: "indirecta", dirigida: true, evidencia: "En una perturbación, el agente busca cruces y espacios públicos seguros fuera de la ruta habitual.", page: "Escenario de perturbación", actores: "Agente en riesgo · Puentes", critica: "La evacuación es una decisión adaptativa, no una ruta fija del plano.", live: "Puedes decir: “Cuando la ruta formal se rompe, el agente busca el siguiente puente, parque o espacio seguro disponible.”" },
];

const ACTANT_EDGES = [
  { s: "planeadores_pot", t: "vivienda", tipo: "directa", dirigida: true, evidencia: "Los planeadores traducen reglas de ordenamiento en localizaciones, estándares y autorizaciones.", page: "Módulo Simulador", actores: "Planeadores · POT", critica: "La regla escrita no muestra las trayectorias que produce al ser aplicada por miles de agentes.", live: "Puedes decir: “El planeador escribe la regla, pero esta red pregunta qué ocurre después, cuando la regla entra en contacto con habitantes, mercados y riesgos.”" },
  { s: "planeadores_pot", t: "equipamientos", tipo: "directa", dirigida: true, evidencia: "La planificación distribuye equipamientos y organiza sus relaciones con la vivienda.", page: "Módulo Simulador", actores: "Planeadores · Equipamientos", critica: "La localización no garantiza uso ni accesibilidad cotidiana.", live: "Puedes decir: “Planear un equipamiento no es lo mismo que comprobar quién puede llegar a él y en cuánto tiempo.”" },
  { s: "planeadores_pot", t: "ecosistemas_sim", tipo: "indirecta", dirigida: true, evidencia: "El POT formula una matriz ecológica que debe ordenar el crecimiento urbano.", page: "Módulo Simulador", actores: "Planeadores · Ecosistemas", critica: "La matriz se vuelve dinámica cuando el agua y el riesgo modifican las decisiones urbanas.", live: "Puedes decir: “El ecosistema no es una capa decorativa: obliga a que la planificación responda a flujos y perturbaciones.”" },
  { s: "autoridad_ambiental", t: "humedales", tipo: "directa", dirigida: true, evidencia: "La autoridad ambiental define condiciones de manejo y protección de los humedales.", page: "Módulo Simulador", actores: "Autoridad ambiental · Humedales", critica: "La delimitación jurídica no agota el comportamiento ecológico del humedal.", live: "Puedes decir: “La autoridad fija un límite, pero el agua, las especies y las comunidades hacen que el ecosistema continúe más allá de ese borde.”" },
  { s: "autoridad_ambiental", t: "rios", tipo: "directa", dirigida: true, evidencia: "La regulación ambiental interviene sobre cuerpos de agua y sus zonas de manejo.", page: "Módulo Simulador", actores: "Autoridad ambiental · Ríos", critica: "La gestión requiere observar cambios temporales de caudal, contaminación y ocupación.", live: "Puedes decir: “El río exige una lectura temporal: no se comporta igual en sequía, lluvia o emergencia.”" },
  { s: "constructores", t: "vivienda", tipo: "directa", dirigida: true, evidencia: "Los constructores materializan estándares de vivienda, densidad y mejoramiento.", page: "Art. 384 · Módulo Simulador", actores: "Constructores · Viviendas", critica: "La regla de 36/42 m² no muestra por sí sola hacinamiento, adaptación ni calidad de vida.", live: "Puedes decir: “Aquí la norma se vuelve materia: los 36 y 42 metros cuadrados se convierten en condiciones reales de habitabilidad.”" },
  { s: "constructores", t: "red_vial", tipo: "directa", dirigida: true, evidencia: "La construcción modifica simultáneamente vivienda, vías, andenes y accesos.", page: "Módulo Simulador", actores: "Constructores · Red vial", critica: "Una obra puede mejorar la conexión para unos agentes y producir barreras temporales para otros.", live: "Puedes decir: “La infraestructura no tiene un efecto único: mientras construye una conexión, también puede interrumpir recorridos.”" },
  { s: "arrendadores", t: "vivienda", tipo: "directa", dirigida: true, evidencia: "El mercado de arriendo media el acceso cotidiano a la vivienda.", page: "Módulo Simulador", actores: "Arrendadores · Vivienda", critica: "La oferta formal puede ser inaccesible aunque exista físicamente.", live: "Puedes decir: “La vivienda disponible no es automáticamente vivienda accesible: el ingreso y el arriendo filtran quién puede habitarla.”" },
  { s: "arrendadores", t: "agente_migrante", tipo: "indirecta", dirigida: true, evidencia: "Las condiciones de arriendo afectan permanencia, movilidad residencial y acceso de hogares migrantes.", page: "Módulo Simulador", actores: "Arrendadores · Agente migrante", critica: "La exclusión residencial puede empujar al hacinamiento o a localizaciones más expuestas.", live: "Puedes decir: “La informalidad también puede producirse dentro del mercado de arriendo, cuando el agente no tiene capacidad de elegir.”" },
  { s: "personal_salud", t: "servicios_sociales", tipo: "directa", dirigida: true, evidencia: "El personal de salud activa los servicios sociales y sus recorridos de atención.", page: "Módulo Simulador", actores: "Personal de salud · Servicios sociales", critica: "La cobertura no se mide solo por número de instituciones, sino por tiempo de acceso y continuidad.", live: "Puedes decir: “La salud es una red de atención: necesita vivienda, transporte, cuidado y tiempo, no solo un edificio.”" },
  { s: "personal_salud", t: "viviendas_sim", tipo: "indirecta", dirigida: true, evidencia: "La habitabilidad de la vivienda condiciona riesgos de salud y necesidades de cuidado.", page: "Módulo Simulador", actores: "Personal de salud · Viviendas", critica: "El estándar espacial debe conectarse con ventilación, hacinamiento, estrés y salud.", live: "Puedes decir: “La vivienda se convierte en salud: sus condiciones producen bienestar o aumentan la carga de atención.”" },
  { s: "emergencias", t: "areas_resiliencia", tipo: "directa", dirigida: true, evidencia: "Los servicios de emergencia requieren áreas de resiliencia y espacios públicos para responder a perturbaciones.", page: "Escenario de perturbación", actores: "Emergencias · Áreas de resiliencia", critica: "La evacuación depende de rutas que sigan disponibles bajo presión.", live: "Puedes decir: “La resiliencia no es un dibujo: es la capacidad de llegar, evacuar y cuidar cuando la red cambia.”" },
  { s: "emergencias", t: "puentes_peatonales", tipo: "directa", dirigida: true, evidencia: "Los cruces y puentes hacen posible la respuesta de emergencia y la evacuación peatonal.", page: "Escenario de perturbación", actores: "Emergencias · Puentes", critica: "Un puente bloqueado puede aislar a toda una parte de la red.", live: "Puedes decir: “En emergencia, un mediador pequeño puede convertirse en el cuello de botella de toda la ciudad.”" },
  { s: "conductores", t: "transporte_publico", tipo: "directa", dirigida: true, evidencia: "Los conductores hacen operativo el sistema de transporte y sus frecuencias.", page: "Módulo Simulador", actores: "Conductores · Transporte público", critica: "La operación cotidiana y las condiciones laborales no aparecen en la lectura normativa.", live: "Puedes decir: “El sistema funciona porque hay actores que lo operan; la infraestructura sola no produce movilidad.”" },
  { s: "conductores", t: "red_vial", tipo: "directa", dirigida: true, evidencia: "Los conductores producen flujos, congestión y tiempos variables sobre la red vial.", page: "Módulo Simulador", actores: "Conductores · Red vial", critica: "La misma vía cambia de comportamiento según la hora, la demanda y una perturbación.", live: "Puedes decir: “La vía no tiene un comportamiento fijo: lo producen los flujos que la usan simultáneamente.”" },
  { s: "ciclistas_actor", t: "ciclorrutas", tipo: "directa", dirigida: true, evidencia: "Las personas ciclistas activan la ciclorruta como infraestructura cotidiana de movilidad.", page: "Módulo Simulador", actores: "Ciclistas · Ciclorrutas", critica: "La continuidad y seguridad de la red determinan si el modo es viable.", live: "Puedes decir: “La ciclorruta funciona como red solo si conecta origen, destino y seguridad en toda la trayectoria.”" },
  { s: "ciclistas_actor", t: "corredores_verdes", tipo: "indirecta", dirigida: true, evidencia: "La movilidad ciclista puede articularse con corredores verdes y espacio público.", page: "Módulo Simulador", actores: "Ciclistas · Corredores verdes", critica: "La integración entre movilidad y ecología requiere continuidad real, no solo superposición cartográfica.", live: "Puedes decir: “Aquí se cruzan dos redes: la ecológica y la de movilidad, y ambas dependen de continuidad.”" },
  { s: "repartidores", t: "red_vial", tipo: "directa", dirigida: true, evidencia: "Los repartidores dependen de la red vial, los andenes y la proximidad de los destinos.", page: "Módulo Simulador", actores: "Repartidores · Red vial", critica: "La economía de entrega introduce flujos pequeños y constantes que el POT no modela.", live: "Puedes decir: “Los repartidores revelan una ciudad de microtrayectorias que no aparece cuando solo miramos grandes corredores.”" },
  { s: "repartidores", t: "centros_abastecimiento", tipo: "directa", dirigida: true, evidencia: "Los repartidores conectan centros de abastecimiento con hogares y comercios.", page: "Módulo Simulador", actores: "Repartidores · Abastecimiento", critica: "El abastecimiento depende de horarios, accesos, carga y condiciones de la calle.", live: "Puedes decir: “La ciudad también se mueve por entregas: si se interrumpe el último tramo, se interrumpe el abastecimiento.”" },
  { s: "organizaciones_barriales", t: "comunidades_actor", tipo: "directa", dirigida: true, evidencia: "Las organizaciones barriales coordinan usos, cuidado, defensa del territorio y respuesta comunitaria.", page: "Módulo Simulador", actores: "Organizaciones · Comunidades", critica: "La capacidad de organización local cambia la respuesta del sistema.", live: "Puedes decir: “La comunidad no es un receptor pasivo del POT: también interpreta, cuida y responde.”" },
  { s: "organizaciones_barriales", t: "humedales", tipo: "directa", dirigida: true, evidencia: "Las organizaciones barriales participan en la apropiación y protección cotidiana de los humedales.", page: "Módulo Simulador", actores: "Organizaciones · Humedales", critica: "La protección ecológica requiere prácticas y vigilancia comunitaria, no solo delimitación.", live: "Puedes decir: “El humedal existe jurídicamente, pero también existe socialmente por las prácticas que lo sostienen.”" },
  { s: "mantenimiento_urbano", t: "andenes", tipo: "directa", dirigida: true, evidencia: "El mantenimiento urbano conserva la continuidad física de los recorridos peatonales.", page: "Módulo Simulador", actores: "Mantenimiento · Andenes", critica: "La infraestructura solo funciona mientras se mantiene.", live: "Puedes decir: “El andén no es una línea permanente: es un estado que puede mejorar, deteriorarse o romperse.”" },
  { s: "mantenimiento_urbano", t: "estaciones", tipo: "directa", dirigida: true, evidencia: "El mantenimiento sostiene la operación y accesibilidad de estaciones y nodos de transporte.", page: "Módulo Simulador", actores: "Mantenimiento · Estaciones", critica: "El cierre temporal redistribuye recorridos y cargas sobre otros nodos.", live: "Puedes decir: “Una estación no es solo un punto: necesita mantenimiento para seguir siendo una conexión.”" },
  { s: "cuidados_salud", t: "personas_cuidadoras", tipo: "directa", dirigida: true, evidencia: "Las redes de cuidado sostienen a quienes cuidan y a quienes requieren atención.", page: "Módulo Simulador", actores: "Redes de cuidado · Personas cuidadoras", critica: "La carga de cuidado se distribuye de manera desigual y cambia con la disponibilidad de servicios.", live: "Puedes decir: “El cuidado tiene actores detrás: redes familiares, comunitarias y de salud que sostienen la vida cotidiana.”" },
  { s: "cuidados_salud", t: "manzanas_cuidado", tipo: "directa", dirigida: true, evidencia: "Las redes de cuidado activan el uso de las Manzanas del Cuidado y sus servicios asociados.", page: "Módulo Simulador", actores: "Redes de cuidado · Manzanas", critica: "La infraestructura de cuidado necesita conectarse con tiempo, transporte y vivienda.", live: "Puedes decir: “La Manzana del Cuidado solo funciona si la red completa permite llegar, permanecer y regresar.”" },
];

const ALL_DYNAMIC_EDGES = [...DYNAMIC_EDGES, ...CHAIN_EDGES, ...ACTANT_EDGES];

function edgeKey(e) { return e.s + "→" + e.t; }

/* -------- Situaciones: cambian intensidad de relaciones ya existentes -------- */
const SITUACIONES = [
  {
    id: "ciudad_15_minutos", label: "Ciudad de 15 minutos", icon: "fa-person-walking",
    desc: "Resalta las trayectorias de cuidado: el acceso se mide como tiempo caminando, fatiga y simultaneidad de servicios, no como distancia en línea recta.",
    live: "Puedes decir: “Aquí el POT deja de ser una lista de lugares y se convierte en una prueba de tiempo. La pregunta es si una agente puede encadenar cuidado, compras y regreso sin agotar su tiempo disponible.”",
    boost: ["personas_sim→manzanas_cuidado", "personas_sim→viviendas_sim", "personas_sim→ecosistemas_sim", "agente_cuidadora→manzanas_cuidado", "agente_cuidadora→personas_sim", "agente_ninez→andenes"],
    dim: [],
  },
  {
    id: "vivienda_informal", label: "Autoconstrucción en riesgo", icon: "fa-house-crack",
    desc: "Activa el escenario en que la falta de vivienda formal empuja a un agente a autoconstruirse en una ladera de riesgo por supervivencia.",
    live: "Puedes decir: “La informalidad no aparece como una falla aislada: emerge cuando el sistema no ofrece una vivienda accesible. El agente resuelve su supervivencia, pero aumenta su exposición al riesgo.”",
    boost: ["personas_sim→vivienda", "viviendas_sim→vivienda", "ecosistemas_sim→viviendas_sim", "agente_riesgo→viviendas_sim", "agente_riesgo→ecosistemas_sim"],
    dim: ["vivienda→equipamientos"],
  },
  {
    id: "perturbacion", label: "Sismo / inundación", icon: "fa-house-tsunami",
    desc: "Simula una perturbación que rompe el andén o la ruta formal: los agentes se autodeterminan y buscan el espacio público seguro más cercano.",
    live: "Puedes decir: “El sismo o la inundación muestran lo que el plano no puede anticipar: cuando se rompe el andén, la ruta oficial deja de existir y los agentes deben encontrar otra salida en tiempo real.”",
    boost: ["ecosistemas_sim→viviendas_sim", "personas_sim→ecosistemas_sim", "personas_sim→viviendas_sim", "agente_ninez→andenes", "agente_riesgo→ecosistemas_sim"],
    dim: ["vivienda→red_vial", "vivienda→transporte_publico"],
  },
  {
    id: "hora_pico_manana", label: "Hora pico (mañana)", icon: "fa-sun",
    desc: "Aumenta el peso visual de las relaciones entre Vivienda, Transporte público y los lugares de empleo.",
    live: "Puedes decir: “En hora pico vemos que la infraestructura no se mueve sola: son miles de trayectorias simultáneas las que cargan la red y redistribuyen el tiempo perdido.”",
    boost: ["vivienda→transporte_publico", "habitantes→transporte_publico", "trabajadores→servicios_empresariales"],
    dim: [],
  },
  {
    id: "hora_pico_tarde", label: "Hora pico (tarde)", icon: "fa-cloud-sun",
    desc: "Cambia la intensidad de las relaciones de regreso hacia la vivienda.",
    boost: ["transporte_publico→servicios_sociales", "vivienda→transporte_publico", "habitantes→vivienda"],
    dim: [],
  },
  {
    id: "mantenimiento", label: "Mantenimiento", icon: "fa-screwdriver-wrench",
    desc: "Atenúa o interrumpe temporalmente la relación con una estación o servicio.",
    live: "Puedes decir: “El mantenimiento no elimina la ciudad: obliga a los agentes a cambiar de ruta, esperar más o abandonar el viaje. Esa adaptación es la dinámica que el POT no ejecuta.”",
    boost: [],
    dim: ["estaciones→transporte_publico"],
  },
  {
    id: "obra_vial", label: "Obra vial", icon: "fa-triangle-exclamation",
    desc: "Modifica las relaciones entre la Red vial, el Transporte público y los recorridos cotidianos.",
    boost: ["andenes→red_vial"],
    dim: ["vivienda→red_vial"],
  },
  {
    id: "cierre_estacion", label: "Cierre de estación", icon: "fa-ban",
    desc: "Desactiva un punto de acceso y activa rutas alternativas.",
    boost: ["andenes→red_vial"],
    dim: ["estaciones→transporte_publico"],
  },
  {
    id: "temporada_lluvias", label: "Temporada de lluvias", icon: "fa-cloud-showers-heavy",
    desc: "Aumenta la intensidad de las relaciones hídricas entre Quebradas, Ríos y Humedales.",
    boost: ["quebradas→humedales", "humedales→rios", "humedales→coberturas_vegetales"],
    dim: [],
  },
  {
    id: "temporada_seca", label: "Temporada seca", icon: "fa-sun-plant-wilt",
    desc: "Reduce la intensidad de las relaciones hídricas y cambia la lectura del sistema.",
    boost: [],
    dim: ["quebradas→humedales", "humedales→rios", "humedales→coberturas_vegetales"],
  },
  {
    id: "intervencion_vial", label: "Intervención vial", icon: "fa-road-barrier",
    desc: "Resalta la relación conflictiva entre una obra cercana y el humedal.",
    boost: ["humedales→servicios_empresariales"],
    dim: [],
  },
  {
    id: "uso_comunitario", label: "Uso comunitario", icon: "fa-people-group",
    desc: "Resalta las relaciones entre comunidades, senderos y humedales.",
    boost: ["comunidades_actor→humedales", "senderos→humedales"],
    dim: [],
  },
];

/* -------- estado global -------- */
let agencyOn = true;
let viewMode = "todas";
let activeSituacion = null;
const nodeOff = new Set();
let cityZoom = 1;
const CITY_ZOOM_MIN = 1;
const CITY_ZOOM_MAX = 1;
const CITY_ZOOM_TITLE_THRESHOLD = 999;

/* -------- física -------- */
[...BASE_NODES, ...ALL_DYNAMIC_NODES].forEach(n => {
  n.homeX = n.x; n.homeY = n.y; n.vx = 0; n.vy = 0;
  n.fixed = (n.id === "vivienda" || n.id === "humedales" || n.id === "servicios_empresariales");
});

function allActiveEdges() {
  return agencyOn ? [...BASE_EDGES, ...ALL_DYNAMIC_EDGES] : BASE_EDGES;
}

BASE_EDGES.concat(ALL_DYNAMIC_EDGES).forEach(e => {
  const s = findNode(e.s), t = findNode(e.t);
  if (!s || !t) return;
  e.restLength = Math.hypot(t.x - s.x, t.y - s.y) || 200;
});

/* -------- defs: glow + flechas -------- */
function buildDefs(svg) {
  const defs = document.createElementNS(SVG_NS, "defs");
  Object.values(STRUCT_COLOR).forEach(color => {
    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", "rd-glow-" + color.replace("#", ""));
    filter.setAttribute("x", "-60%"); filter.setAttribute("y", "-60%");
    filter.setAttribute("width", "220%"); filter.setAttribute("height", "220%");
    const blur = document.createElementNS(SVG_NS, "feGaussianBlur");
    blur.setAttribute("stdDeviation", "3"); blur.setAttribute("result", "blur");
    const merge = document.createElementNS(SVG_NS, "feMerge");
    ["blur", "blur", "SourceGraphic"].forEach(ref => {
      const m = document.createElementNS(SVG_NS, "feMergeNode");
      m.setAttribute("in", ref);
      merge.appendChild(m);
    });
    filter.appendChild(blur); filter.appendChild(merge);
    defs.appendChild(filter);
  });

  const marker = document.createElementNS(SVG_NS, "marker");
  marker.setAttribute("id", "rd-arrow");
  marker.setAttribute("viewBox", "0 0 10 10");
  marker.setAttribute("refX", "8"); marker.setAttribute("refY", "5");
  marker.setAttribute("markerWidth", "6.5"); marker.setAttribute("markerHeight", "6.5");
  marker.setAttribute("orient", "auto-start-reverse");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", "M0,0 L10,5 L0,10 z");
  path.setAttribute("fill", "#c9cedb");
  marker.appendChild(path);
  defs.appendChild(marker);

  svg.appendChild(defs);
}

function edgePathData(s, t) {
  const dx = t.x - s.x, dy = t.y - s.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / dist, uy = dy / dist;
  const startPad = s.r + 2, endPad = t.r + 7;
  const x1 = s.x + ux * startPad, y1 = s.y + uy * startPad;
  const x2 = t.x - ux * endPad, y2 = t.y - uy * endPad;
  return `M${x1},${y1} L${x2},${y2}`;
}

function edgeIntensity(e) {
  let w = 1.3, op = 0.55;
  if (activeSituacion) {
    const sit = SITUACIONES.find(s => s.id === activeSituacion);
    const key = edgeKey(e);
    if (sit.boost.includes(key)) { w = 3; op = 1; }
    else if (sit.dim.includes(key)) { w = 0.8; op = 0.15; }
    else { op = 0.22; }
  }
  return { w, op };
}

function drawEdges(svg) {
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("class", "edges-layer");

  allActiveEdges().forEach((edge, i) => {
    const s = findNode(edge.s), t = findNode(edge.t);
    if (!s || !t) return;
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("class", "rd-edge-group");
    group.dataset.index = i;
    group.dataset.source = edge.s;
    group.dataset.target = edge.t;
    group.dataset.dynamic = ALL_DYNAMIC_EDGES.includes(edge) ? "1" : "0";

    const { w, op } = edgeIntensity(edge);
    const d = edgePathData(s, t);

    const visual = document.createElementNS(SVG_NS, "path");
    visual.setAttribute("class", "rd-edge");
    visual.setAttribute("d", d);
    visual.setAttribute("stroke", "#c9cedb");
    visual.setAttribute("stroke-width", w);
    visual.setAttribute("opacity", op);
    if (edge.tipo === "indirecta") visual.setAttribute("stroke-dasharray", "5,5");
    if (edge.dirigida) visual.setAttribute("marker-end", "url(#rd-arrow)");

    const hit = document.createElementNS(SVG_NS, "path");
    hit.setAttribute("class", "rd-edge-hit");
    hit.setAttribute("d", d);

    group.appendChild(visual);
    group.appendChild(hit);
    group.addEventListener("click", () => showEdgeInfo(edge, i));
    g.appendChild(group);
    edge._el = { visual, hit, group };
  });

  svg.appendChild(g);
}

const INITIAL_CITY_NODE_NUMBERS = new Set(
  (typeof CITY_DATA_SUBSYSTEMS === "undefined" ? [] : CITY_DATA_SUBSYSTEMS)
    .flatMap(subsystem => (CITY_DATA_NODES || []).filter(node => node.subsystem === subsystem).slice(0, 5).map(node => node.n))
);

function cityDataFilterMatches(node, filter) {
  if (!filter || filter === "initial") return INITIAL_CITY_NODE_NUMBERS.has(node.n);
  if (filter === "all") return true;
  return node.subsystem === filter;
}

function setCityDataFilter(filter) {
  window.currentCityDataFilter = filter;
  renderNetwork();
}

function cityDataNodeRadius(node) {
  const degree = CITY_DATA_RELATION_DEGREES[node.name] || 0;
  // La escala sigue el grado real: hubs de la tabla claramente mayores.
  if (degree >= 15) return 64;
  if (degree >= 10) return 51;
  if (degree >= 7) return 39;
  if (degree >= 4) return 29;
  if (degree >= 2) return 20;
  return 14;
}

function cityDataOrganicLayout(visible) {
  const center = { x: 530, y: 400 };
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const sorted = [...visible].sort((a, b) => {
    const degreeDelta = (CITY_DATA_RELATION_DEGREES[b.name] || 0) - (CITY_DATA_RELATION_DEGREES[a.name] || 0);
    return degreeDelta || a.n - b.n;
  });
  const points = sorted.map((node, order) => {
    const degree = CITY_DATA_RELATION_DEGREES[node.name] || 0;
    const ring = degree >= 15 ? 142 : degree >= 10 ? 206 : degree >= 7 ? 278 : degree >= 4 ? 338 : degree >= 2 ? 376 : 408;
    const angle = order * goldenAngle + Math.sin(node.n * 9.17) * .48;
    const radiusJitter = Math.sin(node.n * 4.61) * 20;
    const ellipseX = 1.34;
    const ellipseY = .82;
    return {
      node,
      x: center.x + Math.cos(angle) * (ring + radiusJitter) * ellipseX,
      y: center.y + Math.sin(angle) * (ring + radiusJitter) * ellipseY,
      r: cityDataNodeRadius(node),
    };
  });

  // Relajación determinista: misma separación libre para todos los pares,
  // conservando la forma orgánica y evitando una cuadrícula rígida.
  for (let iteration = 0; iteration < 180; iteration += 1) {
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      for (let j = i + 1; j < points.length; j += 1) {
        const b = points[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distance = Math.hypot(dx, dy);
        if (!distance) { dx = .5; dy = .25; distance = .56; }
        const desired = a.r + b.r + 22;
        if (distance < desired) {
          const push = (desired - distance) * .34;
          const ux = dx / distance;
          const uy = dy / distance;
          a.x -= ux * push; a.y -= uy * push;
          b.x += ux * push; b.y += uy * push;
        }
      }
      // Mantiene una nube centrada y abierta, no una caja de celdas.
      a.x += (center.x - a.x) * .00045;
      a.y += (center.y - a.y) * .00045;
      a.x = Math.max(40 + a.r, Math.min(1020 - a.r, a.x));
      a.y = Math.max(38 + a.r, Math.min(762 - a.r, a.y));
    }
  }
  return new Map(points.map(point => [point.node.name, { x: point.x, y: point.y }]));
}

function showCityTableNodeInfo(node) {
  const panel = document.getElementById("edgeInfoPanel");
  if (!panel || !node) return;
  document.querySelectorAll(".rd-node").forEach(el => el.classList.remove("edge-selected"));
  const selected = document.querySelector(`.rd-node[data-table-id="${node.n}"]`);
  selected?.classList.add("edge-selected");
  document.getElementById("edgeInfoTitle").textContent = node.name;
  document.getElementById("edgeInfoConvencion").textContent = node.name;
  document.getElementById("edgeInfoEvidencia").textContent = node.subsystem;
  document.getElementById("edgeInfoPage").textContent = `Tabla · nodo ${node.n} de 150`;
  document.getElementById("edgeInfoActores").textContent = node.type;
  document.getElementById("edgeInfoSituacion").textContent = "Registro completo de la tabla · nodo observable del sistema urbano";
  document.getElementById("edgeInfoCritica").textContent = "La tabla evita convertir el subsistema en un objeto abstracto: aquí se observa un lugar, agente, flujo, infraestructura o proceso concreto.";
  document.getElementById("edgeInfoLiveScript").textContent = `Qué decir: “Aquí no estoy mostrando el sistema como una categoría vacía; estoy mostrando ${node.name}, un elemento concreto que puede relacionarse con otros elementos de la ciudad.”`;
  panel.classList.add("visible");
}

function subsystemDisplayName(subsystem) {
  return String(subsystem || '').replace(/^Sistema\s+/, '');
}

function subsystemTitleLines(subsystem) {
  const words = subsystemDisplayName(subsystem).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  words.forEach(word => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > 18 && current) { lines.push(current); current = word; }
    else current = candidate;
  });
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function cityDataIcon(node) {
  const text = `${node.name || ""} ${node.type || ""}`.toLowerCase();
  if (/(agua|hídric|lluvia|escorrentía|drenaje|canal|río|humedal|cuerpo)/i.test(text)) return "fa-droplet";
  if (/(ave|pájaro|organismo móvil|fauna|animal|artrópodo|insecto|araña)/i.test(text)) return "fa-feather-pointed";
  if (/(planta|veget|árbol|flora|cobertura verde)/i.test(text)) return "fa-seedling";
  if (/(atmosfér|clima|viento|lluvia|variación temporal|estacional)/i.test(text)) return "fa-cloud-sun";
  if (/(vivienda|residencial|construcción|edificación|superficie construida|espacio construido)/i.test(text)) return "fa-house";
  if (/(vial|carretera|calle|red vial|vehículo|transporte|movilidad|ciclista|ciclorruta)/i.test(text)) return "fa-road";
  if (/(flujo de personas|usuario|agente|habitante|población|comunidad|organización|actor)/i.test(text)) return "fa-people-group";
  if (/(equipamiento|salud|educativ|colegio|cuidado|servicio social)/i.test(text)) return "fa-building";
  if (/(económ|comerc|mercado|empleo|laboral|bienes|productor|empresa)/i.test(text)) return "fa-store";
  if (/(patrimonio|cultural|memoria|paisaje|sitio|lugar valorado)/i.test(text)) return "fa-landmark";
  if (/(institucional|normativo|gestión|decisión|pot|entidad)/i.test(text)) return "fa-scale-balanced";
  if (/(red|infraestructura|energét|sanitaria|material|recurso)/i.test(text)) return "fa-network-wired";
  if (/(amenaza|riesgo|presión|evento|transformación|condición)/i.test(text)) return "fa-triangle-exclamation";
  return "fa-circle-nodes";
}

const CITY_DATA_RELATION_DEGREES = (() => {
  const degrees = {};
  if (typeof CITY_DATA_RELATIONS === "undefined") return degrees;
  CITY_DATA_RELATIONS.forEach(relation => {
    degrees[relation.source] = (degrees[relation.source] || 0) + 1;
    degrees[relation.target] = (degrees[relation.target] || 0) + 1;
  });
  return degrees;
})();

const CITY_SITUATION_MATCHERS = {
  ciudad_15_minutos: {
    include: [/cuidado|servicios|peaton|anden|recorrido|tiempo de acceso|vivienda|barrio|habitante|transporte|comercio/i],
    dim: [/industria|carga que entra|residuos de construcción/i],
  },
  vivienda_informal: {
    include: [/vivienda|construcciones|lotes|ocupación|borde|taludes|remoción|barrios|trabajo informal|residencial/i],
    dim: [/patrimonio arqueológico|universidades|redes de telecomunicaciones/i],
  },
  perturbacion: {
    include: [/inundación|encharcamiento|lluvia|escorrentía|nivel del agua|sedimento|daño|riesgo|anden|vía|evacuación|drenaje|residuo/i],
    dim: [/patrimonio|centros financieros|comercio local/i],
  },
  hora_pico_manana: {
    include: [/transporte|congestión|tiempo de viaje|recorrido|empleo|viaje|vivienda|habitante|vía|peatón/i],
    dim: [/humedal|vegetación|patrimonio|compostaje/i],
  },
  hora_pico_tarde: {
    include: [/vivienda|transporte|habitante|recorrido|tiempo|empleo|viaje|comercio|barrio/i],
    dim: [/páramo|río|humedal|vegetación|patrimonio/i],
  },
  mantenimiento: {
    include: [/estación|paradero|anden|vía|red|drenaje|contenedor|ruta de recolección|ciclorruta|alumbrado/i],
    dim: [/lotes vacantes|patrimonio arqueológico|aves migratorias/i],
  },
  obra_vial: {
    include: [/vía|construcción|paviment|borde|anden|transporte|tráfico|ruido|ciclorruta|escorrentía/i],
    dim: [/humedal|vegetación|aves|patrimonio natural/i],
  },
  cierre_estacion: {
    include: [/estación|transporte|paradero|recorrido|tiempo de viaje|anden|vía|peatón/i],
    dim: [/universidad|biblioteca|parque/i],
  },
  temporada_lluvias: {
    include: [/lluvia|agua|río|quebrada|humedal|canal|sedimento|suelo|inundación|encharcamiento|drenaje|nivel|infiltración|humedad/i],
    dim: [/temperatura superficial alta|consumo de energía|superficies pavimentadas/i],
  },
  temporada_seca: {
    include: [/agua|río|quebrada|humedal|canal|suelo|nivel|infiltración|vegetación|aves|humedad|temperatura/i],
    dim: [/lluvia|escorrentía|drenaje|inundación|encharcamiento/i],
  },
  intervencion_vial: {
    include: [/vía|construcción|ocupación|borde|transporte|anden|paviment|ciclorruta|tráfico|ruido|suelo/i],
    dim: [/humedal|vegetación acuática|aves migratorias|patrimonio natural/i],
  },
  uso_comunitario: {
    include: [/comunidad|habitante|visitante|organización|junta|recorrido|humedal|patrimonio|parque|biblioteca|colectivo|memoria|observación de aves|comercio local/i],
    dim: [/red eléctrica|consumo de energía|industria|carga urbana/i],
  },
};

function cityRelationSearchText(relation) {
  return `${relation.source} ${relation.target} ${relation.relation} ${relation.process}`;
}

function cityRelationIntensity(relation) {
  let result = { width: .72, opacity: .19, active: false, dim: false };
  if (!activeSituacion) return result;
  const matcher = CITY_SITUATION_MATCHERS[activeSituacion];
  if (!matcher) return result;
  const text = cityRelationSearchText(relation);
  const isDim = matcher.dim.some(pattern => pattern.test(text));
  const isActive = matcher.include.some(pattern => pattern.test(text));
  if (isDim && !isActive) return { width: .38, opacity: .055, active: false, dim: true };
  if (isActive) return { width: 1.62, opacity: .86, active: true, dim: false };
  return { width: .34, opacity: .045, active: false, dim: true };
}

function cityNodeIsAffected(node) {
  if (!activeSituacion) return false;
  const matcher = CITY_SITUATION_MATCHERS[activeSituacion];
  if (!matcher) return false;
  const text = `${node.name} ${node.type}`;
  return matcher.include.some(pattern => pattern.test(text));
}

function cityDataRelationPath(a, b, radiusA, radiusB, index) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy) || 1;
  const ux = dx / distance;
  const uy = dy / distance;
  const nx = -uy;
  const ny = ux;
  const startPad = Math.min(radiusA + 2, distance * .30);
  const endPad = Math.min(radiusB + 2, distance * .30);
  const x1 = a.x + ux * startPad;
  const y1 = a.y + uy * startPad;
  const x2 = b.x - ux * endPad;
  const y2 = b.y - uy * endPad;
  const bend = (((index * 17) % 9) - 4) * 4.5;
  const cx = (x1 + x2) / 2 + nx * bend;
  const cy = (y1 + y2) / 2 + ny * bend;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function showCityRelationInfo(relation, index) {
  const sourceNode = CITY_DATA_NODES.find(node => node.name === relation.source);
  const targetNode = CITY_DATA_NODES.find(node => node.name === relation.target);
  const panel = document.getElementById("edgeInfoPanel");
  if (!sourceNode || !targetNode || !panel) return;
  document.querySelectorAll(".city-relation").forEach(el => el.classList.remove("edge-selected"));
  document.querySelector(`.city-relation[data-relation-index="${index}"]`)?.classList.add("edge-selected");
  document.querySelectorAll(".rd-node").forEach(el => el.classList.remove("edge-selected"));
  document.querySelector(`.rd-node[data-table-id="${sourceNode.n}"]`)?.classList.add("edge-selected");
  document.querySelector(`.rd-node[data-table-id="${targetNode.n}"]`)?.classList.add("edge-selected");
  document.getElementById("edgeInfoTitle").textContent = `${relation.source} ↔ ${relation.target}`;
  document.getElementById("edgeInfoConvencion").textContent = `${relation.relation} · ${relation.directness === "directa" ? "Línea continua" : "Línea punteada"}`;
  document.getElementById("edgeInfoEvidencia").textContent = `${sourceNode.subsystem} ↔ ${targetNode.subsystem}`;
  document.getElementById("edgeInfoPage").textContent = `Tabla de relaciones · relación ${relation.n} de 165`;
  document.getElementById("edgeInfoActores").textContent = relation.process;
  document.getElementById("edgeInfoSituacion").textContent = activeSituacion ? (SITUACIONES.find(s => s.id === activeSituacion)?.label || "Situación activa") : "Lectura de base";
  document.getElementById("edgeInfoCritica").textContent = `Proceso observable: ${relation.process}.`;
  document.getElementById("edgeInfoLiveScript").textContent = `Qué decir: “Esta relación muestra ${relation.relation} entre ${relation.source} y ${relation.target}: ${relation.process}.”`;
  panel.classList.add("visible");
}

function drawCityDataRelations(field, visible, positionsByName) {
  if (typeof CITY_DATA_RELATIONS === "undefined") return;
  const visibleNames = new Set(visible.map(node => node.name));
  const edges = document.createElementNS(SVG_NS, "g");
  edges.setAttribute("class", "city-table-relations");
  CITY_DATA_RELATIONS.forEach((relation, index) => {
    if (!visibleNames.has(relation.source) || !visibleNames.has(relation.target)) return;
    const sourceNode = CITY_DATA_NODES.find(node => node.name === relation.source);
    const targetNode = CITY_DATA_NODES.find(node => node.name === relation.target);
    const a = positionsByName.get(relation.source);
    const b = positionsByName.get(relation.target);
    if (!sourceNode || !targetNode || !a || !b) return;
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("class", "city-relation");
    group.dataset.relationIndex = String(index);
    group.dataset.source = relation.source;
    group.dataset.target = relation.target;
    group.setAttribute("role", "button");
    group.setAttribute("tabindex", "0");
    group.setAttribute("aria-label", `${relation.source} y ${relation.target} · ${relation.relation}`);
    const color = CITY_DATA_SUBSYSTEM_COLORS[sourceNode.subsystem] || "#c9cedb";
    const intensity = cityRelationIntensity(relation);
    const d = cityDataRelationPath(a, b, cityDataNodeRadius(sourceNode), cityDataNodeRadius(targetNode), index);
    const line = document.createElementNS(SVG_NS, "path");
    line.setAttribute("class", "city-relation-line");
    line.setAttribute("d", d);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", intensity.width);
    line.setAttribute("opacity", intensity.opacity);
    if (relation.directness !== "directa") line.setAttribute("stroke-dasharray", "4 5");
    const flow = document.createElementNS(SVG_NS, "path");
    flow.setAttribute("class", "city-relation-flow");
    flow.setAttribute("d", d);
    flow.setAttribute("stroke", color);
    flow.setAttribute("stroke-width", Math.max(.55, intensity.width * .7));
    flow.setAttribute("opacity", intensity.active ? .52 : .16);
    flow.setAttribute("stroke-dasharray", "1 8");
    flow.style.setProperty("--relation-delay", `${-((index % 18) * .22).toFixed(2)}s`);
    const hit = document.createElementNS(SVG_NS, "path");
    hit.setAttribute("class", "city-relation-hit");
    hit.setAttribute("d", d);
    group.classList.toggle("relation-focus", intensity.active);
    group.classList.toggle("relation-dim", intensity.dim);
    group.appendChild(line);
    group.appendChild(flow);
    group.appendChild(hit);
    group.addEventListener("click", event => { event.stopPropagation(); showCityRelationInfo(relation, index); });
    group.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); showCityRelationInfo(relation, index); } });
    edges.appendChild(group);
  });
  field.appendChild(edges);
}

function drawCityDataCloud(svg) {
  if (typeof CITY_DATA_NODES === "undefined") return;
  const filter = window.currentCityDataFilter || "all";
  const visible = CITY_DATA_NODES.filter(node => cityDataFilterMatches(node, filter));
  const field = document.createElementNS(SVG_NS, "g");
  field.setAttribute("class", "city-table-field flat-city-table-field");
  const points = document.createElementNS(SVG_NS, "g");
  points.setAttribute("class", "city-table-points flat-city-table-points");
  const positionsByName = cityDataOrganicLayout(visible);

  visible.forEach((node) => {
    const p = positionsByName.get(node.name);
    const color = CITY_DATA_SUBSYSTEM_COLORS[node.subsystem] || "#c9cedb";
    const isAgent = /Agente|Usuarios|Organización|Agentes|Comunidad|Personas|Comerciantes|Productores/i.test(node.type);
    const degree = CITY_DATA_RELATION_DEGREES[node.name] || 0;
    const radius = cityDataNodeRadius(node) + (isAgent ? 2 : 0);
    const dot = document.createElementNS(SVG_NS, "g");
    dot.setAttribute("class", `city-table-point rd-node ${isAgent ? "city-table-agent" : ""}`);
    dot.dataset.tableId = String(node.n);
    dot.dataset.id = `table-${node.n}`;
    dot.dataset.kind = isAgent ? "actor" : "componente";
    dot.setAttribute("role", "button");
    dot.setAttribute("tabindex", "0");
    dot.setAttribute("aria-label", `${node.name} · ${node.subsystem} · ${node.type}`);
    dot.addEventListener("click", event => { event.stopPropagation(); showCityTableNodeInfo(node); });
    dot.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); showCityTableNodeInfo(node); } });
    dot.style.setProperty("--table-color", color);
    dot.style.setProperty("--table-delay", `${-((node.n % 24) * .13).toFixed(2)}s`);
    dot.setAttribute("data-table-node", String(node.n));
    dot.setAttribute("data-degree", String(degree));
    dot.classList.toggle("situation-affected", cityNodeIsAffected(node));

    const halo = document.createElementNS(SVG_NS, "circle");
    halo.setAttribute("class", "city-table-node-halo");
    halo.setAttribute("cx", p.x.toFixed(1));
    halo.setAttribute("cy", p.y.toFixed(1));
    halo.setAttribute("r", (radius + 3).toFixed(1));
    halo.setAttribute("stroke", color);

    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("class", "city-table-node-ring");
    circle.setAttribute("cx", p.x.toFixed(1));
    circle.setAttribute("cy", p.y.toFixed(1));
    circle.setAttribute("r", radius.toFixed(1));
    circle.setAttribute("stroke", color);
    circle.setAttribute("fill", color);

    const fo = document.createElementNS(SVG_NS, "foreignObject");
    fo.setAttribute("class", "city-table-node-content");
    fo.setAttribute("x", (p.x - radius).toFixed(1));
    fo.setAttribute("y", (p.y - radius).toFixed(1));
    fo.setAttribute("width", (radius * 2).toFixed(1));
    fo.setAttribute("height", (radius * 2).toFixed(1));
    const wrapper = document.createElementNS(XHTML_NS, "div");
    wrapper.setAttribute("class", "city-table-node-inner");
    const iconEl = document.createElementNS(XHTML_NS, "i");
    iconEl.setAttribute("class", `fa-solid ${cityDataIcon(node)}`);
    iconEl.setAttribute("aria-hidden", "true");
    wrapper.appendChild(iconEl);
    fo.appendChild(wrapper);

    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = `${node.n}. ${node.name} · ${node.subsystem} · ${node.type}`;
    dot.appendChild(halo);
    dot.appendChild(circle);
    dot.appendChild(fo);
    dot.appendChild(title);
    points.appendChild(dot);
  });

  drawCityDataRelations(field, visible, positionsByName);
  field.appendChild(points);
  svg.appendChild(field);
}

function applyCityZoom() {
  const svg = document.getElementById("readerViz");
  if (!svg) return;
  const content = svg.querySelector(".city-table-zoom-content");
  if (content) content.removeAttribute("transform");
  svg.classList.remove("city-zoomed");
  const value = document.getElementById("cityZoomValue");
  if (value) value.textContent = "100%";
}

function setCityZoom(nextZoom) {
  cityZoom = 1;
  applyCityZoom();
}

function setupCityZoom() {
  // La red se presenta completa desde el inicio; no hay zoom semántico para leerla.
  cityZoom = 1;
  applyCityZoom();
}

function drawNodes(svg) {
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("class", "nodes-layer");

  const list = agencyOn ? [...BASE_NODES, ...ALL_DYNAMIC_NODES] : BASE_NODES;

  list.forEach(node => {
    const kind = nodeKind(node.id);
    const color = kind === "componente" ? STRUCT_COLOR[node.struct] : STRUCT_COLOR[kind];

    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("class", "rd-node");
    group.dataset.id = node.id;
    group.dataset.kind = kind;

    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("class", "node-ring");
    circle.setAttribute("cx", node.x); circle.setAttribute("cy", node.y); circle.setAttribute("r", node.r);
    circle.setAttribute("stroke", color);
    circle.setAttribute("stroke-width", node.id === "vivienda" ? 3.2 : (kind === "componente" ? 2.2 : 1.6));
    circle.setAttribute("filter", "url(#rd-glow-" + color.replace("#", "") + ")");
    if (kind !== "componente") circle.setAttribute("stroke-dasharray", "3,2");

    const fo = document.createElementNS(SVG_NS, "foreignObject");
    const size = node.r * 2.3;
    fo.setAttribute("x", node.x - size / 2); fo.setAttribute("y", node.y - size / 2);
    fo.setAttribute("width", size); fo.setAttribute("height", size);

    const wrapper = document.createElementNS(XHTML_NS, "div");
    wrapper.setAttribute("style",
      "width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;pointer-events:none;");

    const iconEl = document.createElementNS(XHTML_NS, "i");
    iconEl.setAttribute("class", "fa-solid " + node.icon + " node-icon");
    iconEl.setAttribute("style", `color:${color}; font-size:${node.r * 0.4}px; margin:1px 0;`);

    const nameEl = document.createElementNS(XHTML_NS, "div");
    nameEl.setAttribute("class", "node-name");
    nameEl.setAttribute("style", `font-size:${Math.max(node.r * 0.16, 7)}px; padding:0 3px; white-space:pre-line;`);
    nameEl.textContent = node.name;

    wrapper.appendChild(iconEl); wrapper.appendChild(nameEl);
    fo.appendChild(wrapper);

    group.appendChild(circle);
    group.appendChild(fo);
    attachNodeClick(group, node.id);
    attachNodeDrag(group, node);
    g.appendChild(group);

    node._el = { group, circle, fo };
  });

  svg.appendChild(g);
}

function updatePositions() {
  const list = agencyOn ? [...BASE_NODES, ...ALL_DYNAMIC_NODES] : BASE_NODES;
  list.forEach(n => {
    if (!n._el) return;
    n._el.circle.setAttribute("cx", n.x);
    n._el.circle.setAttribute("cy", n.y);
    const size = n.r * 2.3;
    n._el.fo.setAttribute("x", n.x - size / 2);
    n._el.fo.setAttribute("y", n.y - size / 2);
  });
  allActiveEdges().forEach(edge => {
    if (!edge._el) return;
    const s = findNode(edge.s), t = findNode(edge.t);
    if (!s || !t) return;
    const d = edgePathData(s, t);
    edge._el.visual.setAttribute("d", d);
    edge._el.hit.setAttribute("d", d);
  });
}

const PHYSICS = { spring: 0.035, anchor: 0.014, damping: 0.82, minVel: 0.02 };
let physicsRunning = false;

function physicsStep() {
  let moving = false;
  const nodes = agencyOn ? [...BASE_NODES, ...ALL_DYNAMIC_NODES] : BASE_NODES;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const ni = nodes[i], nj = nodes[j];
      const dx = nj.x - ni.x, dy = nj.y - ni.y;
      const dist = Math.hypot(dx, dy) || 1;
      const minDist = ni.r + nj.r + 44;
      if (dist < minDist) {
        const force = (minDist - dist) * 0.14;
        const fx = (dx / dist) * force, fy = (dy / dist) * force;
        if (!ni.fixed) { ni.vx -= fx; ni.vy -= fy; }
        if (!nj.fixed) { nj.vx += fx; nj.vy += fy; }
      }
    }
  }

  allActiveEdges().forEach(edge => {
    const s = findNode(edge.s), t = findNode(edge.t);
    if (!s || !t) return;
    const dx = t.x - s.x, dy = t.y - s.y;
    const dist = Math.hypot(dx, dy) || 1;
    const diff = (dist - edge.restLength) * PHYSICS.spring;
    const fx = (dx / dist) * diff, fy = (dy / dist) * diff;
    if (!s.fixed) { s.vx += fx; s.vy += fy; }
    if (!t.fixed) { t.vx -= fx; t.vy -= fy; }
  });

  nodes.forEach(n => {
    if (n.fixed) { n.vx = 0; n.vy = 0; return; }
    n.vx += (n.homeX - n.x) * PHYSICS.anchor;
    n.vy += (n.homeY - n.y) * PHYSICS.anchor;
    n.vx *= PHYSICS.damping; n.vy *= PHYSICS.damping;
    n.x += n.vx; n.y += n.vy;
    if (Math.abs(n.vx) > PHYSICS.minVel || Math.abs(n.vy) > PHYSICS.minVel) moving = true;
  });

  updatePositions();
  if (moving) requestAnimationFrame(physicsStep);
  else physicsRunning = false;
}

function wakePhysics() {
  if (!physicsRunning) { physicsRunning = true; requestAnimationFrame(physicsStep); }
}

function attachNodeDrag(group, node) {
  const svg = document.getElementById("readerViz");
  let dragging = false, moved = false, startX = 0, startY = 0;

  function toSvgPoint(cx, cy) {
    const pt = svg.createSVGPoint();
    pt.x = cx; pt.y = cy;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  group.addEventListener("pointerdown", e => {
    dragging = true; moved = false; startX = e.clientX; startY = e.clientY;
    node.fixed = true;
    group.classList.add("dragging");
    group.setPointerCapture(e.pointerId);
    wakePhysics();
  });
  group.addEventListener("pointermove", e => {
    if (!dragging) return;
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > 4) moved = true;
    const p = toSvgPoint(e.clientX, e.clientY);
    node.x = p.x; node.y = p.y; node.vx = 0; node.vy = 0;
    updatePositions(); wakePhysics();
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    node.fixed = (node.id === "vivienda" || node.id === "humedales" || node.id === "servicios_empresariales" || SIMULATOR_NODES.some(n => n.id === node.id));
    group.classList.remove("dragging");
    try { group.releasePointerCapture(e.pointerId); } catch (err) {}
    wakePhysics();
    if (moved) { group.dataset.suppressClick = "1"; setTimeout(() => delete group.dataset.suppressClick, 0); }
  }
  group.addEventListener("pointerup", endDrag);
  group.addEventListener("pointercancel", endDrag);
}

function attachNodeClick(group, id) {
  group.addEventListener("click", () => {
    if (group.dataset.suppressClick) return;
    if (nodeKind(id) === "agente") { showNodeLiveScript(id); return; }
    toggleNodeOff(id);
  });
}

function showNodeLiveScript(id) {
  const node = findNode(id);
  const panel = document.getElementById("edgeInfoPanel");
  if (!node || !panel) return;
  document.querySelectorAll(".rd-edge-group").forEach(el => el.classList.remove("edge-selected"));
  document.getElementById("edgeInfoTitle").textContent = node.name.replace(/\n/g, " ");
  document.getElementById("edgeInfoConvencion").textContent = "Agente / estado dinámico";
  document.getElementById("edgeInfoEvidencia").textContent = "Este nodo cambia su trayectoria según el estado de la ciudad.";
  document.getElementById("edgeInfoPage").textContent = "Módulo Simulador";
  document.getElementById("edgeInfoActores").textContent = DYNAMIC_EDGES.filter(e => e.s === id || e.t === id).map(e => (findNode(e.s)?.name || e.s).replace(/\n/g, " ") + " → " + (findNode(e.t)?.name || e.t).replace(/\n/g, " ")).join(" · ") || "Sin relaciones activas.";
  document.getElementById("edgeInfoSituacion").textContent = SITUACIONES.filter(sit => sit.boost.some(k => k.startsWith(id + "→")) || sit.dim.some(k => k.startsWith(id + "→"))).map(s => s.label).join(" · ") || "Todas las situaciones de base.";
  document.getElementById("edgeInfoCritica").textContent = "El nodo no representa una población fija: representa decisiones, restricciones y cambios en el tiempo.";
  document.getElementById("edgeInfoLiveScript").textContent = LIVE_SCRIPTS[id] || "Este agente permite explicar cómo una regla del POT se transforma en una experiencia cotidiana.";
  panel.classList.add("visible");
}

function toggleNodeOff(id) {
  const group = document.querySelector(`.rd-node[data-id="${id}"]`);
  if (!group) return;
  if (nodeOff.has(id)) { nodeOff.delete(id); group.classList.remove("node-off"); }
  else { nodeOff.add(id); group.classList.add("node-off"); }
  refreshEdgeVisibility();
}

function refreshEdgeVisibility() {
  document.querySelectorAll(".rd-edge-group").forEach(group => {
    const s = group.dataset.source, t = group.dataset.target;
    group.classList.toggle("hidden-edge", nodeOff.has(s) || nodeOff.has(t));
  });
}

/* -------- panel de relación (clic en línea) -------- */
function showEdgeInfo(edge, index) {
  const s = findNode(edge.s), t = findNode(edge.t);
  document.querySelectorAll(".rd-edge-group").forEach(el => el.classList.remove("edge-selected"));
  document.querySelector(`.rd-edge-group[data-index="${index}"]`)?.classList.add("edge-selected");

  document.getElementById("edgeInfoTitle").textContent = `${s.name.replace(/\n/g, " ")} → ${t.name.replace(/\n/g, " ")}`;

  const dirTxt = edge.dirigida ? "Dirigida (con sentido sustentado)" : "Sin dirección única";
  const tipoTxt = edge.tipo === "directa" ? "Directa (línea continua)" : "Indirecta (línea punteada)";
  document.getElementById("edgeInfoConvencion").textContent = `${tipoTxt} · ${dirTxt}`;

  document.getElementById("edgeInfoEvidencia").textContent = edge.evidencia
    ? `"${edge.evidencia}"` : "Sin evidencia registrada.";
  document.getElementById("edgeInfoPage").textContent = edge.page ? `Fuente: ${edge.page}` : "Relación interpretativa — sin cita textual del POT.";

  const actoresRelacionados = [];
  if (edge.actores) actoresRelacionados.push(edge.actores);
  ALL_DYNAMIC_EDGES.forEach(de => {
    if ((de.s === edge.s || de.t === edge.s || de.s === edge.t || de.t === edge.t) && de.actores && !actoresRelacionados.includes(de.actores)) {
      if (agencyOn) actoresRelacionados.push(de.actores);
    }
  });
  document.getElementById("edgeInfoActores").textContent = actoresRelacionados.length
    ? actoresRelacionados.join(" · ") : "No hay actores asociados activos en esta vista.";

  const situacionesQueAfectan = SITUACIONES.filter(sit => sit.boost.includes(edgeKey(edge)) || sit.dim.includes(edgeKey(edge)))
    .map(sit => sit.label);
  document.getElementById("edgeInfoSituacion").textContent = situacionesQueAfectan.length
    ? situacionesQueAfectan.join(" · ") : "Sin situación registrada que la module.";

  document.getElementById("edgeInfoCritica").textContent = edge.critica || "—";
  document.getElementById("edgeInfoLiveScript").textContent = edge.live || `Lo que puedes decir: “Esta conexión muestra que ${s.name.replace(/\n/g, " ")} no funciona de manera aislada: cambia cuando cambia la vida cotidiana, la infraestructura o el ambiente.”`;

  document.getElementById("edgeInfoPanel").classList.add("visible");
}

function hideEdgeInfo() {
  document.getElementById("edgeInfoPanel").classList.remove("visible");
  document.querySelectorAll(".rd-edge-group").forEach(el => el.classList.remove("edge-selected"));
}

function toggleFindingsPanel(force) {
  const panel = document.getElementById("findingsSidePanel");
  if (!panel) return;
  const open = typeof force === "boolean" ? force : !panel.classList.contains("visible");
  panel.classList.toggle("visible", open);
  panel.setAttribute("aria-hidden", String(!open));
  document.getElementById("findingsToggle")?.classList.toggle("active", open);
}

/* -------- render principal -------- */
function renderNetwork() {
  const svg = document.getElementById("readerViz");
  if (!svg) return;
  svg.innerHTML = "";
  buildDefs(svg);
  drawCityDataCloud(svg);
  refreshEdgeVisibility();
  applyViewMode();
  wakePhysics();
}

/* -------- toggle: Activar Dimensión Dinámica -------- */
function toggleAgency() {
  agencyOn = !agencyOn;
  const btn = document.getElementById("agencyToggle");
  btn.classList.toggle("on", agencyOn);
  document.getElementById("statActoresCard").classList.toggle("stat-inactive", !agencyOn);
  document.getElementById("statMediadoresCard").classList.toggle("stat-inactive", !agencyOn);
  renderNetwork();
  updateStats();
  renderDynamicViz();
}

/* -------- filtro Todas / Componentes / Actores y mediadores -------- */
function filterView(mode) {
  viewMode = mode;
  document.querySelectorAll(".network-controls .control-btn").forEach(b => b.classList.toggle("active", b.dataset.view === mode));
  if (mode === "actores" && !agencyOn) toggleAgency();
  else applyViewMode();
}

function applyViewMode() {
  document.querySelectorAll(".rd-node").forEach(el => {
    const kind = el.dataset.kind;
    let dim = false;
    if (viewMode === "componentes") dim = kind !== "componente";
    if (viewMode === "actores") dim = kind === "componente" && !isComponenteConectadoADinamico(el.dataset.id);
    el.classList.toggle("node-focus-dim", dim);
  });
  document.querySelectorAll(".rd-edge-group").forEach(el => {
    const isDyn = el.dataset.dynamic === "1";
    let dim = false;
    if (viewMode === "componentes") dim = isDyn;
    el.classList.toggle("edge-focus-dim", dim);
  });
}

function isComponenteConectadoADinamico(id) {
  return DYNAMIC_EDGES.some(e => e.s === id || e.t === id);
}

/* -------- situaciones -------- */
function renderSituacionesRow() {
  const row = document.getElementById("situacionesRow");
  if (!row) return;   // el módulo puede cargarse sin la sección de la red
  row.innerHTML = SITUACIONES.map(s => `
    <button class="situacion-btn" data-sit="${s.id}" onclick="setSituacion('${s.id}')">
      <i class="fa-solid ${s.icon}"></i> ${s.label}
    </button>
  `).join("");
}

function setSituacion(id) {
  if (activeSituacion === id) { activeSituacion = null; }
  else { activeSituacion = id; }
  document.querySelectorAll(".situacion-btn").forEach(b => b.classList.toggle("active", b.dataset.sit === activeSituacion));
  const desc = document.getElementById("situacionDesc");
    if (activeSituacion) {
    const selected = SITUACIONES.find(s => s.id === activeSituacion);
    desc.textContent = selected.desc;
    document.getElementById("edgeInfoLiveScript").textContent = selected.live;
    document.getElementById("edgeInfoPanel").classList.add("visible");
  } else {
    desc.textContent = "Sin situación activa: todas las relaciones se leen en su intensidad documental de base.";
  }
  renderNetwork();
}

/* -------- stats -------- */
function updateStats() {
  // El módulo puede cargarse sin la sección de la red (y sin sus contadores).
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("statComponentes", BASE_NODES.length);
  set("statActores", agencyOn ? ACTOR_NODES.length : "—");
  set("statMediadores", agencyOn ? MEDIADOR_NODES.length : "—");
  set("statRelaciones", allActiveEdges().length);
}

/* -------- mini-viz "Lectura Dinámica" del hero (decorativo) -------- */
function renderDynamicViz() {
  const el = document.getElementById("dynamicViz");
  if (!el) return;
  el.innerHTML = `
    <svg viewBox="0 0 260 170">
      <circle cx="130" cy="85" r="30" class="dyn-core"/>
      ${[[50,30],[210,30],[45,140],[215,140],[130,20]].map(([x,y],i) => `
        <line x1="130" y1="85" x2="${x}" y2="${y}" class="dyn-line" style="animation-delay:${i*0.15}s" />
        <circle cx="${x}" cy="${y}" r="12" class="dyn-node" style="animation-delay:${i*0.15}s" />
      `).join("")}
    </svg>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const agencyButton = document.getElementById("agencyToggle");
  agencyButton?.classList.toggle("on", agencyOn);
  document.getElementById("statActoresCard")?.classList.toggle("stat-inactive", !agencyOn);
  document.getElementById("statMediadoresCard")?.classList.toggle("stat-inactive", !agencyOn);
  renderSituacionesRow();
  renderNetwork();
  setupCityZoom();
  applyCityZoom();
  updateStats();
  renderDynamicViz();
  document.getElementById("edgeInfoClose")?.addEventListener("click", hideEdgeInfo);
  document.getElementById("findingsToggle")?.addEventListener("click", () => toggleFindingsPanel());
  document.getElementById("findingsClose")?.addEventListener("click", () => toggleFindingsPanel(false));
  const noiseFormulaModal = document.getElementById("noiseFormulaModal");
  const abrirFormulaModal = () => { if (noiseFormulaModal) noiseFormulaModal.hidden = false; };
  const cerrarFormulaModal = () => { if (noiseFormulaModal) noiseFormulaModal.hidden = true; };
  document.getElementById("noiseFormulaToggle")?.addEventListener("click", abrirFormulaModal);
  document.getElementById("noiseFormulaModalClose")?.addEventListener("click", cerrarFormulaModal);
  document.getElementById("noiseFormulaModalBackdrop")?.addEventListener("click", cerrarFormulaModal);

  // Fórmula propia de cada agente, al hacer clic en su tarjeta dentro de
  // "Agentes" — la misma matemática que ya usa la simulación, no una
  // aparte inventada solo para mostrar.
  const AGENT_FORMULAS = {
    vehiculos: {
      title: '<i class="fa-solid fa-car"></i> Vehículos — acústica',
      body: `
        <div class="formula-display">
          <span>L = A + B·log<sub>10</sub></span>
          <span class="formula-paren">(</span>
          <span class="formula-frac"><span class="formula-frac-num">v</span><span class="formula-frac-den">v<sub>ref</sub></span></span>
          <span class="formula-paren">)</span>
          <span>+ ΔL</span>
        </div>
      `,
    },
    mirlas: {
      title: '<i class="fa-solid fa-dove"></i> Mirlas — fuerza de escape',
      body: `
        <div class="formula-display">
          <span>F<sub>rep</sub> = −K·(L<sub>ruido</sub> − 60)</span>
        </div>
      `,
    },
  };
  const agentFormulaModal = document.getElementById("agentFormulaModal");
  const abrirAgentFormula = (agente) => {
    const datos = AGENT_FORMULAS[agente];
    if (!datos || !agentFormulaModal) return;
    document.getElementById("agentFormulaModalTitle").innerHTML = datos.title;
    document.getElementById("agentFormulaModalBody").innerHTML = datos.body;
    agentFormulaModal.hidden = false;
  };
  const cerrarAgentFormula = () => { if (agentFormulaModal) agentFormulaModal.hidden = true; };
  document.querySelectorAll(".sumo-agent-col[data-agent]").forEach((col) => {
    col.addEventListener("click", () => abrirAgentFormula(col.dataset.agent));
    col.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirAgentFormula(col.dataset.agent); }
    });
  });
  document.getElementById("agentFormulaModalClose")?.addEventListener("click", cerrarAgentFormula);
  document.getElementById("agentFormulaModalBackdrop")?.addEventListener("click", cerrarAgentFormula);

  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (noiseFormulaModal && !noiseFormulaModal.hidden) cerrarFormulaModal();
    if (agentFormulaModal && !agentFormulaModal.hidden) cerrarAgentFormula();
  });
  window.addEventListener("resize", () => {
    const svg = document.getElementById("readerViz");
    if (svg) { svg.setAttribute("width", svg.clientWidth); svg.setAttribute("height", svg.clientHeight); }
  });
});

if (typeof window !== "undefined") {
  window.__readerBaseNodes = BASE_NODES;
  window.__readerActorNodes = ACTOR_NODES;
  window.__readerMediadorNodes = MEDIADOR_NODES;
  window.__readerBaseEdges = BASE_EDGES;
  window.__readerDynamicEdges = ALL_DYNAMIC_EDGES;
  window.__readerActantEdges = ACTANT_EDGES;
}
