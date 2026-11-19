import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Remove the old btnZoomOutSec logic
js = re.sub(r'const btnZoomInSec = document.getElementById.*?\}\n\}\n?', '', js, flags=re.DOTALL)

# Add the new logic
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
    panel.style.zIndex = "9999";
    
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
setTimeout(updateTagCoords, 500);
'''

js += '\n' + logic

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
