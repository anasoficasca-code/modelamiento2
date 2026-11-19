import io

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

cjs = cjs.replace('const CORNER_THICK = 0.12;', 'const CORNER_THICK = 0.035;')
cjs = cjs.replace('opacity: 0.7, transparent: true', 'opacity: 0.35, transparent: true')
cjs = cjs.replace('camera.zoom = 1.65;', 'camera.zoom = 2.27;') # Restore zoom

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
