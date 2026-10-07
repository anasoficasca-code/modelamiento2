import io, re

# 1. Update HTML height for bottom panel
with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('height:38%;', 'height:25%;')

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)

# 2. Update JS zoom for sectionCamera
with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

target = '''sectionCamera.lookAt(165.3, 12.5, -18.4);
      sectionCamera.fov = 40; // FOV mas amplio para que se note la perspectiva real
      sectionCamera.zoom = 1.0;'''

repl = '''sectionCamera.lookAt(165.3, 12.5, -18.4);
      sectionCamera.fov = 40; // FOV mas amplio para que se note la perspectiva real
      sectionCamera.zoom = 5.0; // Zoom alto solicitado por usuaria'''

cjs = cjs.replace(target, repl)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
