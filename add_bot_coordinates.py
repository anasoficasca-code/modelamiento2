import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

bot_output_html = '''        <div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label>Z m&aacute;x <span id="botZMaxVal">29%</span></label>
          <input type="range" id="botZMax" min="0" max="100" value="29" step="1" style="width:100px;">
        </div>
        <textarea id="botBoxOutput" rows="4" spellcheck="false" readonly style="width:100%; margin-top:8px; font-size:10px; box-sizing:border-box; background:#f8f9fa; border:1px solid #ccc;"></textarea>'''
html = re.sub(r'<div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">\s*<label>Z m&aacute;x <span id="botZMaxVal">29%</span></label>\s*<input type="range" id="botZMax" min="0" max="100" value="29" step="1" style="width:100px;">\s*</div>', bot_output_html, html)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

bot_output_js_var = 'const botZMax = document.getElementById("botZMax"), botZMaxVal = document.getElementById("botZMaxVal");\n  const botBoxOutput = document.getElementById("botBoxOutput");'
cjs = cjs.replace('const botZMax = document.getElementById("botZMax"), botZMaxVal = document.getElementById("botZMaxVal");', bot_output_js_var)

bot_output_js_logic = '''botZMinVal.textContent = botZMin.value + "%"; botZMaxVal.textContent = botZMax.value + "%";
    
    if (botBoxOutput && typeof sceneToReal === "function") {
      const r0 = sceneToReal(xMin, zMin), r1 = sceneToReal(xMax, zMax);
      botBoxOutput.value =
        `Rotación: ${rot}°\\n` +
        `U (a lo largo del giro): ${botXMin.value}% a ${botXMax.value}%\\n` +
        `Y (altura, m): ${(yMin / SCALE).toFixed(1)} a ${(yMax / SCALE).toFixed(1)}\\n` +
        `V (perpendicular): ${botZMin.value}% a ${botZMax.value}%\\n` +
        `(referencia sin girar — real ${Math.round(Math.min(r0[0], r1[0]))} a ${Math.round(Math.max(r0[0], r1[0]))} / ${Math.round(Math.min(r0[1], r1[1]))} a ${Math.round(Math.max(r0[1], r1[1]))})`;
    }'''
cjs = cjs.replace('botZMinVal.textContent = botZMin.value + "%"; botZMaxVal.textContent = botZMax.value + "%";', bot_output_js_logic)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
