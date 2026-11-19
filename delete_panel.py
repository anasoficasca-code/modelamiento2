import io, re
with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = re.sub(r'<div id="escalaZoomPanel".*?<!-- Cota de Inundacion Anual', '<!-- Cota de Inundacion Anual', html, flags=re.DOTALL)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
