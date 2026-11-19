import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Hide LayerContext divs instead of removing them, in case JS references them
html = re.sub(r'<div id="(nat|cul|tech)LayerContext"([^>]*)>', r'<div id="\1LayerContext"\2 style="display:none !important;">', html)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
