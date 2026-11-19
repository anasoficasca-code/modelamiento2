import io

html = io.open('modulo-10-corte.html', 'r', encoding='utf-8').read()

panel = '''<div id="escalaZoomPanel" style="position:fixed; top:20px; right:20px; background:rgba(255,255,255,0.95); border:1px solid #ccc; padding:10px; z-index:9999; border-radius:8px;">
  <label style="display:block; font-size:12px; margin-bottom:5px;">Zoom Corte (FOV): <span id="valFov">35</span></label>
  <input type="range" id="fovSlider" min="1" max="100" value="35" style="width:150px;">
  <br><br>
  <label style="display:block; font-size:12px; margin-bottom:5px;">Zoom Axo: <span id="valScale">1.2</span></label>
  <input type="range" id="scaleSlider" min="0.5" max="3.0" step="0.1" value="1.2" style="width:150px;">
  <label style="display:block; font-size:12px; margin-bottom:5px; margin-top:5px;">OffX: <span id="valOffX">60</span></label>
  <input type="range" id="offXSlider" min="-200" max="200" value="60" style="width:150px;">
  <label style="display:block; font-size:12px; margin-bottom:5px; margin-top:5px;">OffY: <span id="valOffY">20</span></label>
  <input type="range" id="offYSlider" min="-200" max="200" value="20" style="width:150px;">
</div>'''

# Find the legendPanel and insert this panel right after it
if '<div id="legendPanel"' in html and 'escalaZoomPanel' not in html:
    html = html.replace('<div id="legendPanel"', panel + '\n<div id="legendPanel"')

io.open('modulo-10-corte.html', 'w', encoding='utf-8').write(html)
