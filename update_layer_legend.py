import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

target = r'function updateAgentsLegend\(txt\) \{.*?c\.innerHTML = html;\s*\}'

replace = '''function updateAgentsLegend(txt) {
      const c = document.getElementById("legendAgentsContainer");
      if (!c) return;
      const lower = txt.toLowerCase();
      let html = `<div style="display:flex; flex-direction:column; gap:8px; margin-top:12px;">`;

      if (lower.includes("agua") || lower.includes("hídrica") || lower.includes("lluvias")) {
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:16px; border-radius:50%; background:url('assets/textura_agua.jpg') center/cover; border:1px solid #0284c7; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Agua (Humedal y Río)</span></div>`;
      } 
      if (lower.includes("vegetal") || lower.includes("florística") || lower.includes("cobertura") || lower.includes("árboles")) {
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#b06bff; border:1px solid #7c3aed;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Saúco (Alimento)</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#ff5fa8; border:1px solid #db2777;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Capulí / Cerezo</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#25d0a0; border:1px solid #059669;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Urapán / Fresno (Descanso)</span></div>`;
      }
      if (lower.includes("fauna") || lower.includes("aves") || lower.includes("mirlas")) {
        html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/pato.png" style="width:18px; height:18px; object-fit:contain; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));"> <span style="font-size:11px; font-weight:600; color:#334155;">Pato (Boreal)</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/garza.png" style="width:18px; height:18px; object-fit:contain; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));"> <span style="font-size:11px; font-weight:600; color:#334155;">Garza (Llanos)</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/tingua.png" style="width:18px; height:18px; object-fit:contain; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));"> <span style="font-size:11px; font-weight:600; color:#334155;">Tingua (Endémica)</span></div>`;
      }
      if (lower.includes("cultural") || lower.includes("histórica") || lower.includes("tecnológica")) {
          // If the user clicks base or overview without specific layer, show everything relevant
          if (!html.includes("Pato") && !html.includes("Agua")) {
            html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/pato.png" style="width:18px; height:18px; object-fit:contain; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));"> <span style="font-size:11px; font-weight:600; color:#334155;">Aves (Avistamiento)</span></div>`;
            html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:16px; border-radius:50%; background:url('assets/textura_agua.jpg') center/cover; border:1px solid #0284c7; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Cuerpo de Agua</span></div>`;
          }
      }

      html += `</div>`;
      c.innerHTML = html;
    }'''

js = re.sub(target, replace, js, flags=re.DOTALL)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
