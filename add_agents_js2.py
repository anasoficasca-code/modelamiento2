import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

target1 = r'legendActiveLayer\.style\.display = "block";\s*legendActiveLayerText\.textContent = label\.textContent\.trim\(\) \+ \(btnText \? " [^"]+ " \+ btnText\.textContent\.trim\(\) : ""\);\s*\}'
replace1 = '''legendActiveLayer.style.display = "block";
      const txt = label.textContent.trim() + (btnText ? " \\u2014 " + btnText.textContent.trim() : "");
      legendActiveLayerText.textContent = txt;
      updateAgentsLegend(txt);
    }
    
    function updateAgentsLegend(txt) {
      const c = document.getElementById("legendAgentsContainer");
      if (!c) return;
      const lower = txt.toLowerCase();
      let html = `<div style="display:flex; flex-direction:column; gap:8px; margin-top:12px;">`;
      
      if (lower.includes("natural") || lower.includes("hídrica") || lower.includes("vegetal") || lower.includes("fauna") || lower.includes("lluvias")) {
        html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/pato.png" style="width:18px; height:18px; object-fit:contain; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));"> <span style="font-size:11px; font-weight:600; color:#334155;">Pato (Boreal)</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/garza.png" style="width:18px; height:18px; object-fit:contain; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));"> <span style="font-size:11px; font-weight:600; color:#334155;">Garza (Llanos)</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/tingua.png" style="width:18px; height:18px; object-fit:contain; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));"> <span style="font-size:11px; font-weight:600; color:#334155;">Tingua (Endémica)</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:16px; border-radius:50%; background:url('assets/textura_agua.jpg') center/cover; border:1px solid #0284c7; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Espejo de Agua</span></div>`;
      } else if (lower.includes("cultural") || lower.includes("histórica") || lower.includes("pedagógico") || lower.includes("fricción")) {
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:16px; border-radius:50%; background:url('assets/textura_agua.jpg') center/cover; border:1px solid #0284c7; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Cuerpo de Agua Histórico</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/pato.png" style="width:18px; height:18px; object-fit:contain; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));"> <span style="font-size:11px; font-weight:600; color:#334155;">Aves (Avistamiento)</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:2px; background:#94a3b8; border:1px solid #64748b;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Edificios y Manzanas</span></div>`;
      } else if (lower.includes("tecnológica") || lower.includes("vial") || lower.includes("ruido") || lower.includes("red vial") || lower.includes("tráfico")) {
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:16px; border-radius:50%; background:url('assets/textura_via.jpg') center/cover; border:1px solid #64748b; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Vías (Kennedy)</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#ef4444; border:1px solid #b91c1c;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Vehículos Reales (SUMO)</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:8px; border-radius:2px; background:linear-gradient(90deg, transparent, rgba(239,68,68,0.8));"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Mapa de Ruido</span></div>`;
      } else {
        html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/pato.png" style="width:18px; height:18px; object-fit:contain; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));"> <span style="font-size:11px; font-weight:600; color:#334155;">Pato (Boreal)</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/garza.png" style="width:18px; height:18px; object-fit:contain; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));"> <span style="font-size:11px; font-weight:600; color:#334155;">Garza (Llanos)</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:16px; border-radius:50%; background:url('assets/textura_agua.jpg') center/cover; border:1px solid #0284c7; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Cuerpos de Agua</span></div>`;
      }
      
      html += `</div>`;
      c.innerHTML = html;
    }'''

js = re.sub(target1, replace1, js, flags=re.DOTALL)

target2 = r'legendActiveLayerText\.textContent = `\$\{explodeStep\}/12 [^$]+\$\{layer\.name\}` \+ \(layer\.live \? "" : " \(en construcción\)"\);'
replace2 = '''const txt = `${explodeStep}/12 \\u2014 ${layer.name}` + (layer.live ? "" : " (en construcción)");
      legendActiveLayerText.textContent = txt;
      if (typeof updateAgentsLegend === "function") updateAgentsLegend(txt);
      else if (window.updateAgentsLegend) window.updateAgentsLegend(txt);'''
js = re.sub(target2, replace2, js)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
