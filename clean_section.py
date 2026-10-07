import io, re

# 1. HTML modifications
with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove botControls (the entire panel)
html = re.sub(r'<!-- Controles independientes para el corte inferior -->.*?</div>\s*<span style="position:absolute; top:8px; left:14px', '<span style="position:absolute; top:8px; left:14px', html, flags=re.DOTALL)

# Remove Controls: rotar y enderezar
html = re.sub(r'<!-- Controls: rotar y enderezar -->.*?</div>\s*<!-- Coordenadas del corte -->', '<!-- Coordenadas del corte -->', html, flags=re.DOTALL)

# Remove Coordenadas del corte text area
html = re.sub(r'<!-- Coordenadas del corte -->.*?</textarea>', '', html, flags=re.DOTALL)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)

# 2. JS modifications
with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Update camera position
js = js.replace('sectionCamera.position.set(163.0, 6.8, -21.2);', 'sectionCamera.position.set(142.6, 9.5, -6.0);')

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
