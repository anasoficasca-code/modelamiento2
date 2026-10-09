import io, re

# 1. HTML CHANGES
with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Delete escalaZoomPanel from HTML
start_idx = html.find('<div id="escalaZoomPanel"')
if start_idx != -1:
    end_idx = html.find('</div>\n      </div>\n\n      <!-- Cota de Inundacion Anual', start_idx)
    if end_idx != -1:
        html = html[:start_idx] + html[end_idx + 13:]

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)


# 2. JS CHANGES
with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Change FOV from 55 to 16
js = js.replace('const sectionCamera = new THREE.PerspectiveCamera(55, 1, 1, 5000);', 'const sectionCamera = new THREE.PerspectiveCamera(16, 1, 1, 5000);')
js = js.replace('const sectionCamera = new THREE.PerspectiveCamera(30, 1, 1, 5000);', 'const sectionCamera = new THREE.PerspectiveCamera(16, 1, 1, 5000);')

# Comment out or remove the UI event listeners to avoid null errors since panel is deleted
target_js = '''  const escalaZoomSlider = document.getElementById("escalaZoomSlider");
  if (escalaZoomSlider) {
    escalaZoomSlider.addEventListener("input", (e) => {
      escalaScale = parseFloat(e.target.value) / 100;
      document.getElementById("escalaZoomVal").textContent = e.target.value + "%";
      applyEscalaTransform();
    });
  }
  const panUp = document.getElementById("panUp"), panDown = document.getElementById("panDown");
  const panLeft = document.getElementById("panLeft"), panRight = document.getElementById("panRight");
  
  function applyEscalaTransform() {
    ["naturalExplodeOverlay", "culturalExplodeOverlay", "techExplodeOverlay"].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.transform = `scale(${escalaScale}) translate(${escalaOffX}px, ${escalaOffY}px)`;
    });
    const out = document.getElementById("escalaCoordsOutput");
    if (!out) return;
    const fovVal = typeof sectionCamera !== 'undefined' && sectionCamera ? sectionCamera.fov : 12;
    out.value = `// === TAMA\u00d1O Y POSICI\u00d3N ===\nconst ESCALA_TRANSFORM = {\n  scale: ${escalaScale.toFixed(2)},\n  offsetX: ${Math.round(escalaOffX)},\n  offsetY: ${Math.round(escalaOffY)}\n};\n\n// Zoom del corte (FOV): ${fovVal}`;
  }

  const sectionZoomSlider = document.getElementById("sectionZoomSlider");
  if (sectionZoomSlider) {
    sectionZoomSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      const valEl = document.getElementById("sectionZoomVal");
      if (valEl) valEl.textContent = val;
      if (typeof sectionCamera !== 'undefined' && sectionCamera) {
        sectionCamera.fov = val;
        sectionCamera.updateProjectionMatrix();
        applyEscalaTransform(); // to update output
      }
    });
  }
  if (panUp) panUp.addEventListener("click", (e) => { e.stopPropagation(); escalaOffY -= PAN_STEP; applyEscalaTransform(); });
  if (panDown) panDown.addEventListener("click", (e) => { e.stopPropagation(); escalaOffY += PAN_STEP; applyEscalaTransform(); });
  if (panLeft) panLeft.addEventListener("click", (e) => { e.stopPropagation(); escalaOffX -= PAN_STEP; applyEscalaTransform(); });
  if (panRight) panRight.addEventListener("click", (e) => { e.stopPropagation(); escalaOffX += PAN_STEP; applyEscalaTransform(); });
  const escalaCoordsCopy = document.getElementById("escalaCoordsCopy");
  if (escalaCoordsCopy) escalaCoordsCopy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(document.getElementById("escalaCoordsOutput").value); escalaCoordsCopy.textContent = "\u2705 Copiado"; setTimeout(() => { escalaCoordsCopy.textContent = "\ud83d\udccb Copiar coordenadas"; }, 1600); } catch (err) {}
  });'''

replace_js = '''  function applyEscalaTransform() {
    ["naturalExplodeOverlay", "culturalExplodeOverlay", "techExplodeOverlay"].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.transform = `scale(${escalaScale}) translate(${escalaOffX}px, ${escalaOffY}px)`;
    });
  }'''

# The target might not exactly match because of formatting or unicode \u2705.
# I'll use regex to nuke the whole block.
js = re.sub(r'const escalaZoomSlider.*?try { await navigator.*?\}\s*\n  \}\);\n', replace_js + '\n', js, flags=re.DOTALL)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
