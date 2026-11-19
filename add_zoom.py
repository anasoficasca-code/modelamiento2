import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

target = '<div style="display:grid; grid-template-columns:30px 30px 30px; gap:4px; justify-content:center; margin-bottom:8px;">'
replace = '''<div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Zoom</span><span id="escalaZoomVal">120%</span></div>
        <input type="range" id="escalaZoomSlider" min="50" max="300" value="120" step="1" style="width:100%; margin-bottom:8px;">
        <div style="display:grid; grid-template-columns:30px 30px 30px; gap:4px; justify-content:center; margin-bottom:8px;">'''

html = html.replace(target, replace)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
