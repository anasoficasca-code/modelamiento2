import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace('`Zoom: ${sectionCamera.zoom.toFixed(2)}\\n` +\n                 `Zoom: ${sectionCamera.zoom.toFixed(2)}`;', '`Zoom: ${sectionCamera.zoom.toFixed(2)}`;')

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
