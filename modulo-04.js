let upzData = [];
let barriosData = [];
let currentSelection = null;
const humedales = [
  {id: 'h1', nombre: "Humedal Burro", lat: 4.644296801427965, lng: -74.15052710000018, area: 18.5},
  {id: 'h2', nombre: "Humedal El Techo", lat: 4.645366863767807, lng: -74.14136322378499, area: 32.2},
  {id: 'h3', nombre: "Humedal Vaca", lat: 4.627282592850425, lng: -74.15947984079249, area: 24.8},
];

const mapElement = document.getElementById('map');
const map = mapElement && window.L ? L.map('map').setView([4.60, -74.08], 11) : null;

if (map) {
  L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
    attribution: '© CartoDB',
    maxZoom: 19
  }).addTo(map);
}

let upzLayers = {};
let upzLabels = {};
let barriosLayers = {};
let barrioLabels = {};
let humedalLayers = {};
let humedalMarkers = {};
let eepNodos = [];
let eepLayers = {};
let networkLines = [];
let currentMode = 'meso';

// Cargar UPZ (MACRO)
fetch('upz_bogota.geojson')
  .then(r => r.json())
  .then(data => {
    upzData = data.features.map(f => f.properties);
    
    data.features.forEach((feature, idx) => {
      const props = feature.properties;
      const code = props.uplcodigo.split('UPZ')[1]?.trim() || props.id;
      
      const coords = feature.geometry.coordinates;
      
      const labelDiv = L.divIcon({
        html: `<div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: transparent; color: #2fd4c8; font-weight: 700; font-size: 9px; border: 1.5px solid #2fd4c8; border-radius: 50%; text-shadow: 0 0 6px rgba(0,0,0,0.8);">${code}</div>`,
        className: 'upz-label-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      
      const marker = L.marker([coords[1], coords[0]], { icon: labelDiv, interactive: false });
      upzLabels[props.id] = marker;
    });
    
    renderItemList();
  });

// Cargar Barrios (MESO)
fetch('barrios_bogota.geojson')
  .then(r => r.json())
  .then(data => {
    barriosData = data.features.map(f => f.properties);
    
    data.features.forEach((feature, idx) => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;
      
      const labelDiv = L.divIcon({
        html: `<div style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; background: transparent; color: #2fd4c8; font-weight: 700; font-size: 7px; border: 1px solid #2fd4c8; border-radius: 50%; text-shadow: 0 0 4px rgba(0,0,0,0.8);">${props.codigo}</div>`,
        className: 'barrio-label-marker',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      
      const marker = L.marker([coords[1], coords[0]], { icon: labelDiv, interactive: false });
      barrioLabels[props.id] = marker;
    });
  });

// Cargar nodos de la red EEP
fetch('red_eep.geojson')
  .then(r => r.json())
  .then(data => {
    eepNodos = data.features;
  });

function renderItemList() {
  const container = document.getElementById('item-list');
  container.innerHTML = '';
  
  if (currentMode === 'macro') {
    upzData.forEach(upz => {
      const div = document.createElement('div');
      div.className = 'upz-item' + (currentSelection?.id === upz.id ? ' active' : '');
      div.innerHTML = `${upz.uplcodigo}`;
      div.onclick = () => selectUPZ(upz);
      container.appendChild(div);
    });
  } else if (currentMode === 'meso') {
    barriosData.forEach(barrio => {
      const div = document.createElement('div');
      div.className = 'upz-item' + (currentSelection?.id === barrio.id ? ' active' : '');
      div.innerHTML = `${barrio.codigo} - ${barrio.nombre}`;
      div.onclick = () => selectBarrio(barrio);
      container.appendChild(div);
    });
  } else if (currentMode === 'micro') {
    humedales.forEach(h => {
      const div = document.createElement('div');
      div.className = 'upz-item humedal-card' + (currentSelection?.id === h.id ? ' active' : '');
      div.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <strong style="color: #2fd4c8; font-size: 11px;">${h.nombre}</strong>
          <div style="font-size: 9px; color: #7a8fa0;">
            <div>📍 ${h.lat.toFixed(4)}, ${h.lng.toFixed(4)}</div>
            <div>📏 Área: ${h.area} ha</div>
          </div>
        </div>
      `;
      div.onclick = () => selectHumedal(h);
      container.appendChild(div);
    });
  }
}

function selectUPZ(upz) {
  currentSelection = upz;
  
  document.getElementById('detail-title').textContent = `UPZ SELECCIONADA: ${upz.uplcodigo.toUpperCase()}`;
  
  document.getElementById('detail-description').innerHTML = `
    <p><strong>${upz.nombre}</strong></p>
    <p>Zona de Planeamiento de Bogotá</p>
  `;
  
  renderItemList();
}

function selectBarrio(barrio) {
  currentSelection = barrio;
  
  document.getElementById('detail-title').textContent = `${barrio.nombre.toUpperCase()}`;
  
  document.getElementById('detail-description').innerHTML = `
    <p><strong>${barrio.nombre}</strong></p>
    <p style="margin-top: 10px;">Barrio de Bogotá</p>
    <p style="font-size: 9px; color: #7a8fa0; margin-top: 8px;">Código: ${barrio.codigo}</p>
  `;
  
  renderItemList();
}

function showEepNetwork() {
  Object.values(eepLayers).forEach(layer => {
    try { map.removeLayer(layer); } catch(e) {}
  });
  eepLayers = {};
  
  if (eepNodos.length === 0) return;
  
  const conexiones = [
    {from: 'h1', to: 'rio', tipo: 'directa'},
    {from: 'h1', to: 'ce', tipo: 'directa'},
    {from: 'h1', to: 'qb', tipo: 'indirecta'},
    {from: 'h1', to: 'ap', tipo: 'indirecta'},
    {from: 'rio', to: 'corr', tipo: 'directa'},
    {from: 'rio', to: 'ec', tipo: 'indirecta'},
    {from: 'ce', to: 'cp', tipo: 'directa'},
    {from: 'ce', to: 'rf', tipo: 'directa'},
    {from: 'qb', to: 'ru', tipo: 'indirecta'},
    {from: 'qb', to: 'pb', tipo: 'indirecta'},
    {from: 'ap', to: 'rf', tipo: 'directa'},
    {from: 'cm', to: 'cv', tipo: 'indirecta'}
  ];
  
  conexiones.forEach(conn => {
    const nodoFrom = eepNodos.find(n => n.properties.id === conn.from);
    const nodoTo = eepNodos.find(n => n.properties.id === conn.to);
    
    if (nodoFrom && nodoTo) {
      const coords = nodoFrom.geometry.coordinates;
      const coordsTo = nodoTo.geometry.coordinates;
      
      const dashArray = conn.tipo === 'indirecta' ? '5, 3' : '0';
      const lineColor = conn.tipo === 'indirecta' ? '#ff9552' : '#2fd4c8';
      
      const line = L.polyline([
        [coords[1], coords[0]],
        [coordsTo[1], coordsTo[0]]
      ], {
        color: lineColor,
        weight: 2,
        opacity: 0.7,
        dashArray: dashArray
      }).addTo(map);
      
      eepLayers['conn_' + conn.from + '_' + conn.to] = line;
    }
  });
  
  eepNodos.forEach((nodo, index) => {
    const coords = nodo.geometry.coordinates;
    const props = nodo.properties;
    const icon = /río|agua|quebrada|humedal/i.test(props.nombre) ? 'fa-water' : /parque|bosque|cerro|veget/i.test(props.nombre) ? 'fa-tree' : 'fa-leaf';
    const nodeDiv = L.divIcon({
      html: `<div class="module06-leaflet-node" style="--node-color:#58d68d;--float-delay:${(index % 9) * -0.42}s"><span class="module06-leaflet-num">${index + 1}</span><i class="fa-solid ${icon}"></i><span class="module06-leaflet-name">${props.nombre}</span></div>`,
      className: 'module06-leaflet-icon',
      iconSize: [76, 76],
      iconAnchor: [38, 38]
    });
    const marker = L.marker([coords[1], coords[0]], { icon: nodeDiv })
      .bindPopup(`<strong>${props.nombre}</strong>`)
      .addTo(map);
    eepLayers['nodo_' + props.id] = marker;
  });
}

function selectHumedal(h) {
  currentSelection = h;
  
  networkLines.forEach(line => map.removeLayer(line));
  networkLines = [];
  
  map.setView([h.lat, h.lng], 13);
  
  humedales.forEach(other => {
    if (other.id !== h.id) {
      const line = L.polyline([
        [h.lat, h.lng],
        [other.lat, other.lng]
      ], {
        color: '#2fd4c8',
        weight: 2,
        opacity: 0.5,
        dashArray: '5, 5'
      }).addTo(map);
      
      networkLines.push(line);
    }
  });
  
  showEepNetwork();
  
  document.getElementById('detail-title').textContent = `HUMEDAL SELECCIONADO: ${h.nombre.toUpperCase()}`;
  
  document.getElementById('detail-description').innerHTML = `
    <p><strong>Estructura Ecológica Principal (EEP)</strong></p>
    <p>La EEP es la integración de áreas de origen natural que tienen una oferta ambiental significativa, es ordenadora del territorio y garante de los equilibrios ecosistémicos, del agua y la riqueza hídrica.</p>
    <p><strong>Relación Cuerpo Hídrico - Verde - Ecosistemas:</strong></p>
    <p>Los humedales son elementos clave de la EEP. Regulan el ciclo del agua, proveen hábitat para fauna silvestre y flora nativa, actúan como corredores ecológicos y mitigar el riesgo climático.</p>
    <p style="font-size: 9px; color: #7a8fa0; margin-top: 8px;">📍 ${h.lat.toFixed(4)}, ${h.lng.toFixed(4)}<br/>📏 Área: ${h.area} ha</p>
    <p style="font-size: 8px; color: #7a8fa0;">POT Bogotá Reverdece 2022-2035</p>
    <p style="margin-top: 10px; font-size: 9px;"><strong>Relaciones en la red EEP:</strong></p>
    <p style="font-size: 8px;">— Línea sólida teal = Relación directa<br/>— Línea punteada naranja = Relación indirecta</p>
  `;
  
  renderItemList();
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', function(e) {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    
    const scale = this.dataset.scale;
    
    Object.values(barrioLabels).forEach(marker => {
      try { map.removeLayer(marker); } catch(e) {}
    });
    Object.values(humedalLayers).forEach(layer => {
      try { map.removeLayer(layer); } catch(e) {}
    });
    Object.values(humedalMarkers).forEach(marker => {
      try { map.removeLayer(marker); } catch(e) {}
    });
    networkLines.forEach(line => {
      try { map.removeLayer(line); } catch(e) {}
    });
    Object.values(eepLayers).forEach(layer => {
      try { map.removeLayer(layer); } catch(e) {}
    });
    networkLines = [];
    eepLayers = {};
    
    if (scale === 'macro') {
      currentMode = 'macro';
      map.setView([4.60, -74.08], 10);
      Object.values(upzLabels).forEach(marker => marker.addTo(map));
    } else if (scale === 'meso') {
      currentMode = 'meso';
      map.setView([4.60, -74.08], 12);
      Object.values(barrioLabels).forEach(marker => marker.addTo(map));
      Object.values(upzLabels).forEach(marker => {
        try { map.removeLayer(marker); } catch(e) {}
      });
    } else if (scale === 'micro') {
      currentMode = 'micro';
      
      humedales.forEach(h => {
        const circle = L.circle([h.lat, h.lng], {
          radius: 1500,
          color: '#4ade80',
          weight: 2,
          opacity: 0.8,
          fillColor: '#4ade80',
          fillOpacity: 0.3
        })
        .on('click', () => selectHumedal(h))
        .addTo(map);
        
        humedalLayers[h.id] = circle;
        
        const marker = L.circleMarker([h.lat, h.lng], {
          radius: 8,
          fillColor: '#4ade80',
          color: '#2d8a5f',
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.7
        })
        .on('click', () => selectHumedal(h))
        .addTo(map);
        
        humedalMarkers[h.id] = marker;
      });
      
      const group = new L.featureGroup(Object.values(humedalLayers));
      map.fitBounds(group.getBounds().pad(0.2));
    }
    
    renderItemList();
  });
});


/* Zoom compatible con el lenguaje interactivo del Módulo 06. */
(() => {
  function setupModule06Zoom() {
    const svg = document.getElementById('networkViz');
    const wrap = svg?.parentElement;
    if (!svg || svg.dataset.module06ZoomReady === '1') return;
    svg.dataset.module06ZoomReady = '1';
    const initial = svg.getAttribute('viewBox').trim().split(/\s+/).map(Number);
    if (initial.length !== 4 || initial.some(Number.isNaN)) return;
    let scale = 1;
    const [x,y,w,h] = initial;
    const level = wrap?.querySelector('.network06-zoom-level');
    const update = () => {
      const nw=w/scale, nh=h/scale;
      svg.setAttribute('viewBox', `${x+(w-nw)/2} ${y+(h-nh)/2} ${nw} ${nh}`);
      if (level) level.textContent = `${Math.round(scale*100)}%`;
    };
    const change = delta => { scale=Math.min(2.25,Math.max(.75,+(scale+delta).toFixed(2))); update(); };
    wrap?.querySelector('.network06-zoom-in')?.addEventListener('click',()=>change(.25));
    wrap?.querySelector('.network06-zoom-out')?.addEventListener('click',()=>change(-.25));
    svg.addEventListener('wheel', e => { e.preventDefault(); change(e.deltaY<0?.10:-.10); }, {passive:false});
  }
  document.addEventListener('DOMContentLoaded', setupModule06Zoom);
})();

/* Renderizador SVG compartido con POT ↔ ODS para la lectura Macromodelos. */
(() => {
  const svg = document.getElementById('networkViz');
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  const POT_OBJECTIVES = {
    1: 'Proteger la estructura ecológica principal y los paisajes bogotanos y generar las condiciones de una relación más armoniosa y sostenible de la ciudad con su entorno rural. El Distrito Capital busca proteger, consolidar, conectar y apropiar socialmente, todos los elementos de importancia paisajística y ambiental, para mejorar la calidad vida de sus habitantes, actuales y futuros, y la calidad de los ecosistemas urbanos, rurales, distritales y regionales.',
    2: 'Incrementar la capacidad de resiliencia del territorio frente a la ocurrencia de desastres derivados de la variabilidad y del cambio climático. El Distrito Capital incorpora la gestión del riesgo en el ordenamiento territorial y la implementación de medidas de adaptación y mitigación que incidan en la protección de la vida y el bienestar de la población.',
    3: 'Mejorar el ambiente urbano y de los asentamientos rurales. El Distrito Capital busca mejorar la calidad ambiental de los entornos construidos, promoviendo la calidad del aire, la protección frente al ruido, el control del riesgo tecnológico, la disminución y el control de la contaminación de los cuerpos hídricos y, en general, la reducción de los impactos ambientales del desarrollo territorial.',
    4: 'Revitalizar la ciudad a través de intervenciones y proyectos de calidad. El Distrito Capital busca revitalizar y embellecer la ciudad, incentivando la producción de vivienda y soluciones habitacionales que promuevan la conservación de los barrios y edificios de importancia arquitectónica y urbanística, cualificando los barrios consolidados, y los asentamientos legalizados, desarrollando nuevas piezas ejemplares de ciudad y focalizando el mejoramiento integral y la renovación urbana en la modalidad de revitalización en sectores estratégicos, promoviendo la permanencia de moradores, unidades productivas y propietarios en los proyectos que transforman el territorio.',
    5: 'Promover el dinamismo, la reactivación económica y la creación de empleos. El Distrito Capital busca cualificar las zonas de aglomeración económica existentes y asegurar la disponibilidad de espacios adaptados a las nuevas necesidades de empresas industriales, teniendo en cuenta la necesaria evolución de las actividades de producción y las posibilidades de una cohabitación de actividades productivas y residenciales. Así mismo, promueve la permanencia de las industrias tradicionales en el tejido urbano, mejorando los entornos urbanos donde se aglomeran dichas industrias tradicionales, y el reconocimiento de la vivienda como un espacio con potencial productivo y de generación de ingresos para las familias.',
    6: 'Reducir los desequilibrios y desigualdades para un territorio más solidario y cuidador. El Distrito Capital busca corregir la inequidad en el acceso a los servicios públicos y sociales de la ciudad y avanzar hacia la convergencia de la calidad de vida en los diversos territorios que lo conforman, promoviendo la territorialización del Sistema Distrital de Cuidado, facilitando la localización de equipamientos, soluciones habitacionales y actividades generadoras de empleo. Para lograr este objetivo el Distrito establece mecanismos de traslado de cargas urbanísticas a las zonas más deficitarias de la ciudad para la habilitación de equipamientos y de espacio público, así como adoptar decisiones y adelantar acciones encaminadas a generar una red de movilidad sostenible, limpia, segura, asequible y eficiente que reduzca las desigualdades en el acceso a las oportunidades urbanas, especialmente para los hogares más vulnerables.',
    7: 'Alcanzar el Desarrollo Rural Sostenible. El Distrito Capital busca conciliar la necesidad de generar mayor valor agregado en las prácticas agrícolas, pecuarias y turísticas que se desarrollan en suelo rural, con la exigencia de preservación ambiental de sus áreas protegidas de importancia ecosistémica y paisajística y la puesta en valor de las formas de vida campesina.'
  };
  const systems = [
    { id:'ambiental', label:'Ambiental', color:'#58d68d', icon:'fa-leaf', x:180, y:305, r:82, objectives:[1,2,3], partial:[], description:'Estructura ecológica principal, paisajes, ecosistemas, agua, contaminación, riesgo, cambio climático y relación urbano-rural.' },
    { id:'humanista', label:'Humanista-social', color:'#ef8b3c', icon:'fa-people-group', x:450, y:300, r:136, objectives:[6], partial:[], description:'Calidad de vida, vivienda, cuidado, equidad, acceso a servicios y reducción de desigualdades.' },
    { id:'socio', label:'Económico-productivo', color:'#eab04c', icon:'fa-chart-line', x:760, y:285, r:72, objectives:[5], partial:[], description:'Empleo, empresas, actividades productivas, aglomeraciones económicas y relación entre vivienda y trabajo.' },
    { id:'cultural', label:'Cultural-territorial', color:'#a879ff', icon:'fa-landmark', x:970, y:300, r:82, objectives:[4,7], partial:[], description:'Patrimonio, memoria, identidad, apropiación social, permanencia de moradores, barrios, paisajes culturales y formas de vida campesina.' },
    { id:'tecnologico', label:'Tecnológico-infraestructural', color:'#55b7d9', icon:'fa-road', x:620, y:510, r:72, objectives:[], partial:[], description:'Transporte público, Metro, Regiotram, red vial, ciclorrutas, servicios públicos, equipamientos e infraestructura urbana.', noObjective:true }
  ];
  // La tabla solicita eliminar las líneas visibles: la red se lee por nodos, tamaños y clasificación.
  const links = [];
  const el = (tag, attrs={}) => { const n=document.createElementNS(NS,tag); Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v)); return n; };
  const render = () => {
    svg.innerHTML = '';
    svg.setAttribute('viewBox','0 0 1200 620');
    const defs = el('defs');
    systems.forEach(s => { const f=el('filter',{id:`glow-${s.color.slice(1)}`,x:'-80%',y:'-80%',width:'260%',height:'260%'}); f.appendChild(el('feGaussianBlur',{stdDeviation:'4',result:'blur'})); const merge=el('feMerge'); merge.appendChild(el('feMergeNode',{in:'blur'})); merge.appendChild(el('feMergeNode',{in:'SourceGraphic'})); f.appendChild(merge); defs.appendChild(f); });
    svg.appendChild(defs);
    const lines=el('g',{class:'network06-links'});
    links.forEach(([a,b])=>{const A=systems[a],B=systems[b]; lines.appendChild(el('line',{x1:A.x,y1:A.y,x2:B.x,y2:B.y,class:'network-edge',stroke:'#46d6d0','stroke-width':'2','stroke-opacity':'.65'}));});
    svg.appendChild(lines);
    const showMacroObjective = (s) => {
      const detail = document.getElementById('conceptDetail');
      const note = document.getElementById('selectionNote');
      if (!detail) return;
      systems.forEach(other => document.querySelector(`[data-node-index="${systems.indexOf(other)}"]`)?.classList.remove('selected'));
      const selected = document.querySelector(`[data-node-index="${systems.indexOf(s)}"]`);
      selected?.classList.add('selected');
      if (note) note.textContent = s.noObjective ? `Macromodelo seleccionado: ${s.label}. La tabla no le asigna ningún objetivo como clasificación principal.` : `Macromodelo seleccionado: ${s.label}. Objetivo${s.objectives.length > 1 ? 's' : ''} principal${s.objectives.length > 1 ? 'es' : ''}: ${s.objectives.join(', ')}.`;
      detail.innerHTML = `<strong>Qué analiza · ${s.label}</strong><div class="objective-description">${s.description}</div><div class="objective-list">${s.objectives.length ? s.objectives.map(number => `<article class="objective-card"><span>Objetivo ${number} · Artículo 5 · Clasificación exclusiva</span><p>“${POT_OBJECTIVES[number]}”</p></article>`).join('') : `<div class="objective-partial"><strong>Ningún objetivo como clasificación principal.</strong> La tabla lo propone como macromodelo útil para analizar cómo funciona materialmente la ciudad, pero no traslada artificialmente el objetivo 6 a esta categoría.</div>`}</div>`;
    };
    systems.forEach((s,i)=>{
      const g=el('g',{class:'network-node floating-node',transform:`translate(${s.x} ${s.y})`,style:`--node-color:${s.color};--node-filter:url(#glow-${s.color.slice(1)});color:${s.color}`,'data-node-index':i,tabindex:'0',role:'button','aria-label':s.label});
      g.appendChild(el('circle',{class:'node-ring',r:s.r,fill:'rgba(8,11,18,.6)',stroke:s.color,'stroke-width':'2.5',filter:`url(#glow-${s.color.slice(1)})`}));
      const fo=el('foreignObject',{x:-s.r*.95,y:-s.r*.95,width:s.r*1.9,height:s.r*1.9});
      const wrap=document.createElementNS('http://www.w3.org/1999/xhtml','div'); wrap.className='node-inner'; wrap.style.cssText='width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;text-align:center;pointer-events:none;font-family:Inter,sans-serif;';
      wrap.innerHTML=`<span class="node-num" style="font-family:'Space Grotesk';font-weight:800;color:${s.color};font-size:${Math.max(s.r*.2,12)}px;line-height:1">${i+1}</span><i class="fa-solid ${s.icon} node-icon" style="color:${s.color};font-size:${s.r*.38}px;line-height:1"></i><span class="node-name" style="color:var(--text-dim);font-size:${Math.max(s.r*.14,8)}px;font-weight:600;line-height:1.05">${s.label}</span>`;
      fo.appendChild(wrap); g.appendChild(fo);
      g.addEventListener('click',()=>showMacroObjective(s));
      g.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showMacroObjective(s); } });
      svg.appendChild(g);
    });
  };
  render();
})();
