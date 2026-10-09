import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

# I corrupted offsetPoly
js = js.replace('// ---- OFFSET real(pts, d) {', 'function offsetPoly(pts, d) {')

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
