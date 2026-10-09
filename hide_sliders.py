import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Make sure natClimatePanel, cultCapa1Panel, techCapa4Panel are display: none
html = html.replace('<div id="natClimatePanel" style="margin-top:16px;', '<div id="natClimatePanel" style="display:none; margin-top:16px;')
html = html.replace('<div id="cultCapa1Panel" style="margin-top:16px;', '<div id="cultCapa1Panel" style="display:none; margin-top:16px;')
html = html.replace('<div id="techCapa4Panel" style="margin-top:16px;', '<div id="techCapa4Panel" style="display:none; margin-top:16px;')

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
