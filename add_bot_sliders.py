import io

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

bot_controls = """
      <!-- Controles independientes para el corte inferior -->
      <div id="botControls" style="position:absolute; right:10px; top:10px; width:220px; background:rgba(255,255,255,0.9); padding:10px; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.15); font-family:'Segoe UI',sans-serif; font-size:11px; color:#333; z-index:10;">
        <div style="font-weight:600; margin-bottom:8px; border-bottom:1px solid #ccc; padding-bottom:4px;">Recorte del Sector Inferior</div>
        <div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label>Rotaci&oacute;n <span id="botRotVal">58&deg;</span></label>
          <input type="range" id="botRot" min="0" max="179" value="58" step="1" style="width:100px;">
        </div>
        <div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label>X m&iacute;n <span id="botXMinVal">0%</span></label>
          <input type="range" id="botXMin" min="0" max="100" value="0" step="1" style="width:100px;">
        </div>
        <div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label>X m&aacute;x <span id="botXMaxVal">90%</span></label>
          <input type="range" id="botXMax" min="0" max="100" value="90" step="1" style="width:100px;">
        </div>
        <div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label>Y m&iacute;n (piso) <span id="botYMinVal">0%</span></label>
          <input type="range" id="botYMin" min="0" max="100" value="0" step="1" style="width:100px;">
        </div>
        <div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label>Y m&aacute;x (alt) <span id="botYMaxVal">100%</span></label>
          <input type="range" id="botYMax" min="0" max="100" value="100" step="1" style="width:100px;">
        </div>
        <div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label>Z m&iacute;n <span id="botZMinVal">0%</span></label>
          <input type="range" id="botZMin" min="0" max="100" value="0" step="1" style="width:100px;">
        </div>
        <div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label>Z m&aacute;x <span id="botZMaxVal">29%</span></label>
          <input type="range" id="botZMax" min="0" max="100" value="29" step="1" style="width:100px;">
        </div>
      </div>
"""

# Insert right after the canvas in sectionWrap
target = '<canvas id="sectionCanvas" style="width:100%; height:100%; display:block; cursor:grab;"></canvas>'
replacement = target + bot_controls
html = html.replace(target, replacement)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
