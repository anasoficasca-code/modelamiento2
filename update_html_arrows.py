import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

target_html = '''<div style="font-weight:700; text-transform:uppercase; letter-spacing:.05em; font-size:9.5px; color:#64748b; margin-bottom:6px;">Tamaño y posición</div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <button type="button" id="escalaZoomOut" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; font-weight:700; cursor:pointer;">−</button>
          <span id="escalaZoomVal" style="font-size:11px; font-variant-numeric:tabular-nums;">100%</span>
          <button type="button" id="escalaZoomIn" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; font-weight:700; cursor:pointer;">+</button>
          <button type="button" id="escalaZoomReset" style="margin-left:auto; font-size:10.5px; padding:5px 8px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; cursor:pointer;">Restablecer</button>
        </div>
        <div style="font-size:10px; color:#64748b; margin-bottom:6px;">Arrastra la simulación para moverla por la pantalla.</div>'''

replacement_html = '''<div style="font-weight:700; text-transform:uppercase; letter-spacing:.05em; font-size:9.5px; color:#64748b; margin-bottom:6px;">Posición de Axonometría</div>
        <div style="display:grid; grid-template-columns:30px 30px 30px; gap:4px; justify-content:center; margin-bottom:8px;">
          <div></div>
          <button type="button" id="panUp" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; cursor:pointer;">↑</button>
          <div></div>
          <button type="button" id="panLeft" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; cursor:pointer;">←</button>
          <button type="button" id="panDown" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; cursor:pointer;">↓</button>
          <button type="button" id="panRight" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; cursor:pointer;">→</button>
        </div>'''

html = html.replace(target_html, replacement_html)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)

