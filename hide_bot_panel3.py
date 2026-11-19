import io

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('id="botRot" min="0" max="179" value="58"', 'id="botRot" min="0" max="179" value="143"')
html = html.replace('id="botXMin" min="0" max="100" value="0"', 'id="botXMin" min="0" max="100" value="26"')
html = html.replace('id="botXMax" min="0" max="100" value="90"', 'id="botXMax" min="0" max="100" value="38"')
# YMin is already 0
# YMax is already 100

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
