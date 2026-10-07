import io, re

# 1. Update HTML
with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

target_html = '<div style="font-weight:600; margin-bottom:8px; border-bottom:1px solid #ccc; padding-bottom:4px;">Coordenadas de la vista</div>'
zoom_html = '''<div style="font-weight:600; margin-bottom:8px; border-bottom:1px solid #ccc; padding-bottom:4px;">Coordenadas de la vista</div>
<div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
  <span>Zoom: <span id="sectionZoomVal">1.00</span></span>
  <div>
    <button type="button" id="btnZoomOutSec" style="padding:2px 8px; cursor:pointer; background:#fff; border:1px solid #ccc; border-radius:4px;">-</button>
    <button type="button" id="btnZoomInSec" style="padding:2px 8px; cursor:pointer; background:#fff; border:1px solid #ccc; border-radius:4px;">+</button>
  </div>
</div>'''

if 'sectionZoomVal' not in html:
    html = html.replace(target_html, zoom_html)
    with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
        f.write(html)

# 2. Update JS
with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

js_zoom_code = '''
const btnZoomInSec = document.getElementById("btnZoomInSec");
const btnZoomOutSec = document.getElementById("btnZoomOutSec");
const sectionZoomVal = document.getElementById("sectionZoomVal");

if (btnZoomInSec && btnZoomOutSec && typeof sectionCamera !== 'undefined') {
  btnZoomInSec.addEventListener("click", () => {
    sectionCamera.zoom = Math.min(5.0, sectionCamera.zoom + 0.1);
    sectionCamera.updateProjectionMatrix();
    if(sectionZoomVal) sectionZoomVal.textContent = sectionCamera.zoom.toFixed(2);
    if(typeof updateBotBox === "function") updateBotBox();
  });
  btnZoomOutSec.addEventListener("click", () => {
    sectionCamera.zoom = Math.max(0.1, sectionCamera.zoom - 0.1);
    sectionCamera.updateProjectionMatrix();
    if(sectionZoomVal) sectionZoomVal.textContent = sectionCamera.zoom.toFixed(2);
    if(typeof updateBotBox === "function") updateBotBox();
  });
  
  // also listen to orbit controls so moving updates the box
  if(typeof sectionControls !== 'undefined') {
      sectionControls.addEventListener("change", () => {
          if(typeof updateBotBox === "function") updateBotBox();
      });
  }
}
'''

if 'btnZoomInSec' not in js:
    js += '\n' + js_zoom_code

# Update camStr to include Zoom
js = js.replace('`Mira hacia: ${sectionControls.target.x.toFixed(1)}, ${sectionControls.target.y.toFixed(1)}, ${sectionControls.target.z.toFixed(1)}\\n` +', '`Mira hacia: ${sectionControls.target.x.toFixed(1)}, ${sectionControls.target.y.toFixed(1)}, ${sectionControls.target.z.toFixed(1)}\\n` +\n                 `Zoom: ${sectionCamera.zoom.toFixed(2)}\\n` +')

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
