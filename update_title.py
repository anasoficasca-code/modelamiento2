import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Modify legend title and subtitle
html = re.sub(r'<h3[^>]*>Convenciones</h3>', '<h3 style="margin:0 0 4px 0; font-size:16px; font-weight:700; color:#0f172a;">Convenciones</h3><p style="margin:0 0 12px 0; font-size:12px; color:#475569; font-weight:500;">Agentes dentro de la simulación</p>', html)

# If standard replace didn't work, we replace based on actual text
if 'Agentes dentro de la simulación' not in html:
    html = html.replace('Convenciones</h3>', 'Convenciones</h3>\n  <p style="margin:0 0 12px 0; font-size:12px; color:#475569; font-weight:500;">Agentes dentro de la simulación</p>')
    
with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
