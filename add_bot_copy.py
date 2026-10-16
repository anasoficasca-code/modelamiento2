import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

bot_output_html = '''        <div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label>Z m&aacute;x <span id="botZMaxVal">29%</span></label>
          <input type="range" id="botZMax" min="0" max="100" value="29" step="1" style="width:100px;">
        </div>
        <button type="button" id="botBoxCopy" style="width:100%; margin-top:4px; padding:4px; font-size:10px; cursor:pointer;">&#128203; Copiar coordenadas</button>
        <textarea id="botBoxOutput" rows="4" spellcheck="false" readonly style="width:100%; margin-top:4px; font-size:10px; box-sizing:border-box; background:#f8f9fa; border:1px solid #ccc;"></textarea>'''
html = re.sub(r'<div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">\s*<label>Z m&aacute;x <span id="botZMaxVal">29%</span></label>\s*<input type="range" id="botZMax" min="0" max="100" value="29" step="1" style="width:100px;">\s*</div>\s*<textarea id="botBoxOutput" rows="4" spellcheck="false" readonly style="width:100%; margin-top:8px; font-size:10px; box-sizing:border-box; background:#f8f9fa; border:1px solid #ccc;"></textarea>', bot_output_html, html)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

bot_copy_js = '''  [botRot, botXMin, botXMax, botYMin, botYMax, botZMin, botZMax].forEach(el => {
    if(el) el.addEventListener("input", () => { updateBotBox(); });
  });
  
  const botBoxCopy = document.getElementById("botBoxCopy");
  if (botBoxCopy && botBoxOutput) {
    botBoxCopy.addEventListener("click", () => {
      botBoxOutput.select();
      document.execCommand("copy");
      const old = botBoxCopy.innerHTML;
      botBoxCopy.innerHTML = "¡Copiado!";
      setTimeout(() => botBoxCopy.innerHTML = old, 1500);
    });
  }'''
cjs = cjs.replace('  [botRot, botXMin, botXMax, botYMin, botYMax, botZMin, botZMax].forEach(el => {\n    if(el) el.addEventListener("input", () => { updateBotBox(); });\n  });', bot_copy_js)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
