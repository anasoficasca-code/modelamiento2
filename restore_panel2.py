import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

replace = '''<div id="legendActiveLayerText"></div>
      </div>

      <!-- Zoom y posicion de la axonometria/escala -->
      <div id="escalaZoomPanel" style="margin-top:16px; padding:10px 12px; border-radius:8px; background:#f1f5f9; font-size:11px; color:#0f172a;">
        <div style="font-weight:700; text-transform:uppercase; letter-spacing:.05em; font-size:9.5px; color:#64748b; margin-bottom:6px;">Posición de Axonometría</div>
        <div style="display:grid; grid-template-columns:30px 30px 30px; gap:4px; justify-content:center; margin-bottom:8px;">
          <div></div>
          <button type="button" id="panUp" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; cursor:pointer;">&#8593;</button>
          <div></div>
          <button type="button" id="panLeft" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; cursor:pointer;">&#8592;</button>
          <button type="button" id="panDown" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; cursor:pointer;">&#8595;</button>
          <button type="button" id="panRight" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; cursor:pointer;">&#8594;</button>
        </div>
        <textarea id="escalaCoordsOutput" rows="3" readonly spellcheck="false" style="width:100%; background:#0b0c0f; color:#8fd4c8; border:1px solid rgba(0,0,0,.14); border-radius:6px; font:10.5px/1.4 monospace; padding:6px; resize:vertical;"></textarea>
        <button type="button" id="escalaCoordsCopy" style="width:100%; margin-top:6px; padding:6px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:11px; font-weight:700; cursor:pointer;"> Copiar coordenadas</button>
      </div>

      <!-- Cota de Inundacion Anual'''

html = re.sub(r'<div id="legendActiveLayerText"></div>\s*</div>\s*<!-- Zoom y posicion de la axonometria/escala [^>]*-->\s*<!-- Cota de Inundacion Anual', replace, html)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
