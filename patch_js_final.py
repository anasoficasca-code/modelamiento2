import io

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

start = js.find('function updateAgentsLegend(txt) {')
end = js.find('syncLegendFromEscala();')

new_func = '''function updateAgentsLegend(txt) {
const c = document.getElementById("legendAgentsContainer");
if (!c) return;
let html = `<div style="display:flex; flex-direction:column; gap:8px; margin-top:12px;">`;

let showWater = false, showVeg = false, showBirds = false;

if (typeof natExplodeStep !== 'undefined') {
    if (natExplodeStep === 0 || natExplodeStep >= 9) {
        showWater = true; showVeg = true; showBirds = true;
    } else if (natExplodeStep === 1 || natExplodeStep === 2) {
        showWater = true;
    } else if (natExplodeStep === 3 || natExplodeStep === 4) {
        showVeg = true;
    } else if (natExplodeStep === 5 || natExplodeStep === 6) {
        showBirds = true;
    } else if (natExplodeStep === 7 || natExplodeStep === 8) {
        showBirds = true;
    }
}

const lower = txt.toLowerCase();
if (lower.includes("tecnol") || lower.includes("cultural") || lower.includes("lluvias")) {
    showWater = true; showBirds = true; showVeg = false;
}

if (showWater) {
    html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:16px; border-radius:50%; background:url('assets/textura_agua.jpg') center/cover; border:1px solid #0284c7; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Agua (Humedal y R\\u00edo)</span></div>`;
}
if (showVeg) {
    html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#b06bff; border:1px solid #7c3aed;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Sa\\u00faco (Alimento)</span></div>`;
    html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#ff5fa8; border:1px solid #db2777;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Capul\\u00ed / Cerezo</span></div>`;
    html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#25d0a0; border:1px solid #059669;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Urap\\u00e1n / Fresno</span></div>`;
}
if (showBirds) {
    html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/pato.png" style="width:18px; height:18px; object-fit:contain; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));"> <span style="font-size:11px; font-weight:600; color:#334155;">Pato (Boreal)</span></div>`;
    html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/garza.png" style="width:18px; height:18px; object-fit:contain; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));"> <span style="font-size:11px; font-weight:600; color:#334155;">Garza (Llanos)</span></div>`;
    html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/tingua.png" style="width:18px; height:18px; object-fit:contain; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));"> <span style="font-size:11px; font-weight:600; color:#334155;">Tingua (End\\u00e9mica)</span></div>`;
}

html += `</div>`;
c.innerHTML = html;
}
'''

if start != -1 and end != -1:
    js = js[:start] + new_func + js[end:]
    with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
        f.write(js)
