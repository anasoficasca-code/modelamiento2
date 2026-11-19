import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Restore zoom buttons in botControls header
if 'id="btnZoomOutSec"' not in html:
    html = html.replace('<span style="position:absolute; top:8px; left:14px', 
        '<span style="position:absolute; top:8px; left:14px; z-index:10;"><button id="btnZoomOutSec" style="padding:2px 6px; cursor:pointer; font-size:14px;">-</button> <button id="btnZoomInSec" style="padding:2px 6px; cursor:pointer; font-size:14px;">+</button></span>\n<span style="position:absolute; top:8px; left:70px', 1)

# 2. Add coordinates box for tags
tag_coords_box = '''
<div id="tagCoordsBox" style="position:fixed; top:10px; right:10px; background:rgba(255,255,255,0.9); padding:10px; border:1px solid #ccc; z-index:9999; font-family:monospace; font-size:11px;">
  <b>Coordenadas de Textos (Capa 0 a 4):</b><br>
  <textarea id="tagCoordsOut" rows="6" cols="40"></textarea>
</div>
'''
if 'tagCoordsBox' not in html:
    html = html.replace('</body>', tag_coords_box + '\n</body>')

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 3. Add JS logic for zoom and tags
logic = '''
// Zoom logic (using FOV)
const btnZoomOutSec = document.getElementById("btnZoomOutSec");
const btnZoomInSec = document.getElementById("btnZoomInSec");
if (btnZoomOutSec && btnZoomInSec && typeof sectionCamera !== 'undefined') {
    btnZoomOutSec.addEventListener("click", () => {
        sectionCamera.fov = Math.min(100, sectionCamera.fov + 2);
        sectionCamera.updateProjectionMatrix();
        console.log("FOV:", sectionCamera.fov);
    });
    btnZoomInSec.addEventListener("click", () => {
        sectionCamera.fov = Math.max(2, sectionCamera.fov - 2);
        sectionCamera.updateProjectionMatrix();
        console.log("FOV:", sectionCamera.fov);
    });
}

// Tags arrows logic
const tags = document.querySelectorAll(".tech-layer-tag");
const tagOut = document.getElementById("tagCoordsOut");

function updateTagCoords() {
    let out = "";
    tags.forEach((t, i) => {
        out += `Tag ${i}: left: ${t.style.left}, top: ${t.style.top}\\n`;
    });
    if(tagOut) tagOut.value = out;
}

tags.forEach((t, i) => {
    // Force initial absolute values if not set
    if(!t.style.left) t.style.left = "240px";
    if(!t.style.top) t.style.top = "50%";
    
    const panel = document.createElement("div");
    panel.style.position = "absolute";
    panel.style.left = "-60px";
    panel.style.top = "0px";
    panel.style.background = "#fff";
    panel.style.border = "1px solid #000";
    panel.style.padding = "2px";
    panel.style.display = "grid";
    panel.style.gridTemplateColumns = "1fr 1fr 1fr";
    panel.style.gap = "2px";
    panel.style.pointerEvents = "auto";
    
    t.style.pointerEvents = "auto"; // ensure we can click
    
    const btnUp = document.createElement("button"); btnUp.textContent = "↑";
    const btnDown = document.createElement("button"); btnDown.textContent = "↓";
    const btnLeft = document.createElement("button"); btnLeft.textContent = "←";
    const btnRight = document.createElement("button"); btnRight.textContent = "→";
    
    btnUp.onclick = (e) => { e.stopPropagation(); let top = parseFloat(t.style.top) || 50; t.style.top = (top - 1) + "%"; updateTagCoords(); };
    btnDown.onclick = (e) => { e.stopPropagation(); let top = parseFloat(t.style.top) || 50; t.style.top = (top + 1) + "%"; updateTagCoords(); };
    btnLeft.onclick = (e) => { e.stopPropagation(); let left = parseFloat(t.style.left) || 240; t.style.left = (left - 10) + "px"; updateTagCoords(); };
    btnRight.onclick = (e) => { e.stopPropagation(); let left = parseFloat(t.style.left) || 240; t.style.left = (left + 10) + "px"; updateTagCoords(); };
    
    panel.appendChild(document.createElement("div"));
    panel.appendChild(btnUp);
    panel.appendChild(document.createElement("div"));
    panel.appendChild(btnLeft);
    panel.appendChild(document.createElement("div"));
    panel.appendChild(btnRight);
    panel.appendChild(document.createElement("div"));
    panel.appendChild(btnDown);
    panel.appendChild(document.createElement("div"));
    
    t.appendChild(panel);
});
updateTagCoords();
'''

if 'btnZoomOutSec' not in js:
    js += '\n' + logic

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
