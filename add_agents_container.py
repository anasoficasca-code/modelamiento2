import io

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

target = '<div id="legendActiveLayerText"></div>\n      </div>'
replace = '''<div id="legendActiveLayerText"></div>
        <div id="legendAgentsContainer"></div>
      </div>'''

html = html.replace(target, replace)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
