import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Update camera pos
js = js.replace('sectionCamera.position.set(163.0, 6.8, -21.2);', 'sectionCamera.position.set(142.6, 9.5, -6.0);')

# Remove any old zoom logic at the end
js = re.sub(r'const btnZoomInSec = document.getElementById.*?\}\n?', '', js, flags=re.DOTALL)

# Add new FOV zoom and tags logic
logic = '''
const btnZoomOutSec = document.getElementById("btnZoomOutSec");
const btnZoomInSec = document.getElementById("btnZoomInSec");

if (btnZoomOutSec && btnZoomInSec && typeof sectionCamera !== 'undefined') {
    btnZoomOutSec.addEventListener("click", () => {
        sectionCamera.fov = Math.min(100, sectionCamera.fov + 2);
        sectionCamera.updateProjectionMatrix();
    });
    btnZoomInSec.addEventListener("click", () => {
        sectionCamera.fov = Math.max(2, sectionCamera.fov - 2);
        sectionCamera.updateProjectionMatrix();
    });
}

const tags = document.querySelectorAll(".tech-layer-tag");
const tagOut = document.getElementById("tagCoordsBox");

function updateTagCoords() {
    if(!tagOut) return;
    tagOut.style.display = "block";
    let out = "<b>COORDENADAS:</b><br>";
    tags.forEach((t, i) => {
        out += `Capa ${i}: left: ${t.style.left}, top: ${t.style.top}<br>`;
    });
    tagOut.innerHTML = out;
}

tags.forEach((t, i) => {
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
    panel.style.zIndex = "9999";
    
    t.style.pointerEvents = "auto";
    
    const btnUp = document.createElement("button"); btnUp.textContent = "↑";
    const btnDown = document.createElement("button"); btnDown.textContent = "↓";
    const btnLeft = document.createElement("button"); btnLeft.textContent = "←";
    const btnRight = document.createElement("button"); btnRight.textContent = "→";
    
    btnUp.onclick = (e) => { e.stopPropagation(); let top = parseFloat(t.style.top) || 50; t.style.top = (top - 1) + "%"; updateTagCoords(); };
    btnDown.onclick = (e) => { e.stopPropagation(); let top = parseFloat(t.style.top) || 50; t.style.top = (top + 1) + "%"; updateTagCoords(); };
    btnLeft.onclick = (e) => { e.stopPropagation(); let left = parseFloat(t.style.left) || 240; t.style.left = (left - 5) + "px"; updateTagCoords(); };
    btnRight.onclick = (e) => { e.stopPropagation(); let left = parseFloat(t.style.left) || 240; t.style.left = (left + 5) + "px"; updateTagCoords(); };
    
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
'''

js += '\n' + logic

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
