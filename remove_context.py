import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = re.sub(r'<div id="(nat|cul|tech)LayerContext".*?</div>\s*</div>', '', html, flags=re.DOTALL)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
