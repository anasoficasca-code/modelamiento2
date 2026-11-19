import io, re

# 1. Update JS
with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Fix Z-index of cars and noise
js = js.replace('dummy.position.set(p.x, 0.1, p.z);', 'dummy.position.set(p.x, 0.25, p.z);')
js = js.replace('mesh.position.set((c0.x + c1.x) / 2, 0.06, (c0.z + c1.z) / 2);', 'mesh.position.set((c0.x + c1.x) / 2, 0.2, (c0.z + c1.z) / 2);')

# Update agents legend
def replace_legend(match):
    return '''function updateAgentsLegend(txt) {
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
    html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:16px; border-radius:50%; background:#0284c7; border:1px solid #0369a1; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div> <span style="font-size:11px; font-weight:600; color:#334155;">R\\u00edo Fucha</span></div>`;
    html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:16px; border-radius:50%; background:#0284c7; border:1px solid #0369a1; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Humedal La Vaca</span></div>`;
    html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:16px; border-radius:50%; background:#0284c7; border:1px solid #0369a1; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Humedal del Burro</span></div>`;
    html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:16px; border-radius:50%; background:#0284c7; border:1px solid #0369a1; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div> <span style="font-size:11px; font-weight:600; color:#334155;">R\\u00edo Tunjuelo</span></div>`;
    html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:16px; border-radius:50%; background:#0284c7; border:1px solid #0369a1; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div> <span style="font-size:11px; font-weight:600; color:#334155;">R\\u00edo Bogot\\u00e1</span></div>`;
    html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:16px; border-radius:50%; background:transparent; border:2px dashed #0369a1;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Cota de Inundaci\\u00f3n Anual</span></div>`;
}
if (showVeg) {
    html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#ff5fa8; border:1px solid #db2777;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Capul\\u00ed</span></div>`;
    html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#25d0a0; border:1px solid #059669;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Urap\\u00e1n</span></div>`;
    html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#b06bff; border:1px solid #7c3aed;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Sa\\u00faco</span></div>`;
}
if (showBirds) {
    html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/tingua.png" style="width:18px; height:18px; object-fit:contain; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));"> <span style="font-size:11px; font-weight:600; color:#334155;">Tingua</span></div>`;
    html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/garza.png" style="width:18px; height:18px; object-fit:contain; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));"> <span style="font-size:11px; font-weight:600; color:#334155;">Garza</span></div>`;
}

html += `</div>`;
c.innerHTML = html;
}'''

js = re.sub(r'function updateAgentsLegend\(txt\) \{.*?\n\}\n(?=syncLegendFromEscala)', replace_legend, js, flags=re.DOTALL)

# Add sectionCamera coordinates listener
cam_logger = '''
if (typeof sectionControls !== 'undefined') {
    sectionControls.addEventListener("change", () => {
        const cx = sectionCamera.position.x.toFixed(2);
        const cy = sectionCamera.position.y.toFixed(2);
        const cz = sectionCamera.position.z.toFixed(2);
        const tx = sectionControls.target.x.toFixed(2);
        const ty = sectionControls.target.y.toFixed(2);
        const tz = sectionControls.target.z.toFixed(2);
        const out = document.getElementById("sectionCamCoords");
        if (out) {
            out.value = `sectionCamera.position.set(${cx}, ${cy}, ${cz});\\nsectionControls.target.set(${tx}, ${ty}, ${tz});`;
        }
    });
}
'''
if 'sectionCamCoords' not in js:
    js += '\n' + cam_logger

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)

# 2. Update HTML
with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Update tags position
html = html.replace('left: 240px;', 'left: 260px;')
html = html.replace('right:calc(100% + 10px)', 'left: 260px')

# Add coords box to zoom panel
zoom_box = '''<label style="display:block; font-size:12px; margin-bottom:5px; margin-top:10px; font-weight:bold;">Coordenadas Corte:</label>
  <textarea id="sectionCamCoords" style="width:150px; height:60px; font-size:10px; font-family:monospace;" readonly></textarea>'''

if 'sectionCamCoords' not in html:
    html = html.replace('</div>\n<div class="legend-panel"', zoom_box + '\n</div>\n<div class="legend-panel"')
    html = html.replace('</div>\n<div id="legendPanel"', zoom_box + '\n</div>\n<div id="legendPanel"')
    # If standard inject didn't work, inject before </body>
    if zoom_box not in html:
        html = html.replace('</body>', '''<div style="position:fixed; bottom:20px; right:20px; background:rgba(255,255,255,0.95); border:1px solid #ccc; padding:10px; z-index:9999; border-radius:8px;">
        <label style="display:block; font-size:12px; margin-bottom:5px; font-weight:bold;">Coordenadas Corte:</label>
        <textarea id="sectionCamCoords" style="width:200px; height:60px; font-size:10px; font-family:monospace;" readonly></textarea>
        </div>\n</body>''')

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
