import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('value="12" step="1" style="width:100%; margin-bottom:8px;"', 'value="55" step="1" style="width:100%; margin-bottom:8px;"')
html = html.replace('<span id="sectionZoomVal">12</span>', '<span id="sectionZoomVal">55</span>')

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace('const sectionCamera = new THREE.PerspectiveCamera(12, 1, 1, 5000);', 'const sectionCamera = new THREE.PerspectiveCamera(55, 1, 1, 5000);')

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
