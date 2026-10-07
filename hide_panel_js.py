import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Add logic to hide escalaZoomPanel in unzoomAll
target_unzoom = 'zoomedLayer = null;\n  }'
replace_unzoom = '''zoomedLayer = null;
    const p = document.getElementById("escalaZoomPanel");
    if (p) p.style.display = "none";
    const l = document.getElementById("legendActiveLayer");
    if (l) l.style.display = "none";
  }'''
js = js.replace(target_unzoom, replace_unzoom)

# Add logic to hide escalaZoomPanel in close functions
targets = ['function closeNaturalExplode() {', 'function closeCulturalExplode() {', 'function closeTechExplode() {']
for t in targets:
    js = js.replace(t, t + '\n    const p = document.getElementById("escalaZoomPanel");\n    if (p) p.style.display = "none";\n    const l = document.getElementById("legendActiveLayer");\n    if (l) l.style.display = "none";')

# Ensure sceneWrap is hidden in open functions
targets_open = ['function openNaturalExplode() {', 'function openCulturalExplode() {', 'function openTechExplode() {']
for t in targets_open:
    js = js.replace(t, t + '\n    const sw = document.getElementById("sceneWrap");\n    if (sw) sw.style.display = "none";')

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
