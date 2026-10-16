import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

target = '<div id="escalaZoomPanel" style="margin-top:16px;'
replace = '<div id="escalaZoomPanel" style="display:none; margin-top:16px;'

html = html.replace(target, replace)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
