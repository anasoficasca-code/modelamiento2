import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Hide botControls
html = html.replace('<div id="botControls" style="display:block;', '<div id="botControls" style="display:none;')

# 2. Hide rotacion y enderezar
html = html.replace('<div style="position:absolute; bottom:8px; left:14px; display:flex; align-items:center; gap:8px; z-index:5;">', '<div style="display:none;">')

# 3. Hide sectionCoordsOutput
html = html.replace('<textarea id="sectionCoordsOutput"', '<textarea id="sectionCoordsOutput" style="display:none;"')

# 4. Add + and - buttons to the title
title_tag = '<span style="position:absolute; top:8px; left:14px; font:700 10.5px \'Segoe UI\',sans-serif; color:#475569; letter-spacing:.04em; text-transform:uppercase; pointer-events:none;">Corte — Humedal El Burro</span>'
new_title_tag = '''<span style="position:absolute; top:8px; left:14px; z-index:10;">
  <button id="btnZoomOutSec" style="padding:2px 8px; cursor:pointer; font-size:14px; font-weight:bold; background:#fff; border:1px solid #ccc; border-radius:4px;">-</button>
  <button id="btnZoomInSec" style="padding:2px 8px; cursor:pointer; font-size:14px; font-weight:bold; background:#fff; border:1px solid #ccc; border-radius:4px;">+</button>
</span>
<span style="position:absolute; top:8px; left:75px; font:700 10.5px 'Segoe UI',sans-serif; color:#475569; letter-spacing:.04em; text-transform:uppercase; pointer-events:none;">Corte — Humedal El Burro</span>'''
html = html.replace(title_tag, new_title_tag)

# 5. Add a simple div for tag coordinates
tag_box = '''<div id="tagCoordsBox" style="position:fixed; top:20px; right:20px; background:#fff; border:2px solid #000; padding:10px; z-index:9999; font-family:monospace; display:none;"></div>'''
if 'tagCoordsBox' not in html:
    html = html.replace('</body>', tag_box + '\n</body>')

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
