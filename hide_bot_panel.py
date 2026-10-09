import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Hide the panel
html = html.replace('id="botControls" style="position:absolute;', 'id="botControls" style="display:none; position:absolute;')

# Update defaults to what she requested
html = re.sub(r'<input type="range" id="botRot" min="0" max="179" value="\d+" step="1" style="width:100px;">', '<input type="range" id="botRot" min="0" max="179" value="143" step="1" style="width:100px;">', html)
html = re.sub(r'<input type="range" id="botXMin" min="0" max="100" value="\d+" step="1" style="width:100px;">', '<input type="range" id="botXMin" min="0" max="100" value="26" step="1" style="width:100px;">', html)
html = re.sub(r'<input type="range" id="botXMax" min="0" max="100" value="\d+" step="1" style="width:100px;">', '<input type="range" id="botXMax" min="0" max="100" value="38" step="1" style="width:100px;">', html)
html = re.sub(r'<input type="range" id="botYMin" min="0" max="100" value="\d+" step="1" style="width:100px;">', '<input type="range" id="botYMin" min="0" max="100" value="0" step="1" style="width:100px;">', html)
html = re.sub(r'<input type="range" id="botYMax" min="0" max="100" value="\d+" step="1" style="width:100px;">', '<input type="range" id="botYMax" min="0" max="100" value="100" step="1" style="width:100px;">', html)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
