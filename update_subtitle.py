import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('>Convenciones</div>', '>Convenciones</div>\n  <div style="font-size:12px; color:#475569; font-weight:500; margin-bottom:12px;">Agentes dentro de la simulación</div>')

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
