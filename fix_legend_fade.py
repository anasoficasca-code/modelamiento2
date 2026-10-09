import io, re

# 1. HTML: Remove full screen, download, and zoom buttons
with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = re.sub(r'<button type="button" id="sectionFullscreenBtn".*?</button>', '', html)
html = re.sub(r'<button type="button" id="sectionDownloadBtn".*?</button>', '', html)
html = re.sub(r'<span style="position:absolute; top:8px; left:14px; z-index:10;">.*?</span>\s*<span style="position:absolute; top:8px; left:75px', '<span style="position:absolute; top:8px; left:14px', html, flags=re.DOTALL)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)

# 2. JS: Rewrite legend logic, remove zoom logic, and fix context fade
with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Fix context fade (createRadialGradient)
js = js.replace('const g = t.createRadialGradient(0, 0, rad * 0.7, 0, 0, rad * 1.25);', 'const g = t.createRadialGradient(0, 0, rad * 0.4, 0, 0, rad * 2.8);')

# Rewrite updateAgentsLegend function
old_legend = r'function updateAgentsLegend\(txt\)\s*\{.*?c\.innerHTML = html;\s*\}'
new_legend = '''function updateAgentsLegend(txt) {
    const c = document.getElementById("legendAgentsContainer");
    if (!c) return;
    if (!txt) { c.innerHTML = ""; return; }
    
    let html = `<div style="display:flex; flex-direction:column; gap:6px;">`;
    const lower = txt.toLowerCase();
    
    // CAPA 1: Hídrico / Físico
    if (lower.includes("físico") || lower.includes("hídrico") || lower.includes("agua") || lower.includes("inunda") || lower.includes("capa 1")) {
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:4px; background:#0284c7; border-radius:2px;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Río Bogotá</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:4px; background:#38bdf8; border-radius:2px;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Río Fucha / Tunjuelo</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:14px; height:14px; border-radius:3px; background:#7dd3fc; border:1px solid #0284c7;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Humedal El Burro / La Vaca</span></div>`;
    }
    
    // CAPA 2/3: Vegetal / Verde
    if (lower.includes("vegetal") || lower.includes("verde") || lower.includes("estratificación") || lower.includes("flora") || lower.includes("capa 2") || lower.includes("capa 3")) {
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#b06bff; border:1px solid #7c3aed;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Saúco</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#ff5fa8; border:1px solid #db2777;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Capulí</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#25d0a0; border:1px solid #059669;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Urapán</span></div>`;
    }
    
    // CAPA 4: Animal / Fauna
    if (lower.includes("animal") || lower.includes("fauna") || lower.includes("aves") || lower.includes("capa 4") || lower.includes("pato") || lower.includes("garza") || lower.includes("tingua")) {
        html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/pato.png" style="width:20px; height:20px; object-fit:contain; mix-blend-mode:multiply;"> <span style="font-size:11px; font-weight:600; color:#334155;">Pato</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/garza.png" style="width:20px; height:20px; object-fit:contain; mix-blend-mode:multiply;"> <span style="font-size:11px; font-weight:600; color:#334155;">Garza</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/tingua.png" style="width:20px; height:20px; object-fit:contain; mix-blend-mode:multiply;"> <span style="font-size:11px; font-weight:600; color:#334155;">Tingua</span></div>`;
    }
    
    // If it's a general base or global view, show a bit of everything or nothing
    if (!lower.includes("capa") && !lower.includes("físico") && !lower.includes("vegetal") && !lower.includes("animal") && !lower.includes("verde") && !lower.includes("fauna") && !lower.includes("agua")) {
        html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/tingua.png" style="width:20px; height:20px; object-fit:contain; mix-blend-mode:multiply;"> <span style="font-size:11px; font-weight:600; color:#334155;">Fauna Nativa</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#25d0a0; border:1px solid #059669;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Cobertura Vegetal</span></div>`;
        html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:4px; background:#0284c7; border-radius:2px;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Sistema Hídrico</span></div>`;
    }
    
    html += `</div>`;
    c.innerHTML = html;
}'''
js = re.sub(old_legend, new_legend, js, flags=re.DOTALL)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
