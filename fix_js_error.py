import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

target = r'// Renderizamos SOLAMENTE el area de estudio \(la base del rombo\), sin el contexto desvanecido de la axonometria inicial\.\s*Object\.values\(secPlanes\)\.forEach\(\(p, i\) => \(p\.constant = savedConst\[i\]\)\);\s*renderer\.clippingPlanes = origClip;'

replace = '''// Renderizamos SOLAMENTE el area de estudio (la base del rombo), sin el contexto desvanecido de la axonometria inicial.'''

js = re.sub(target, replace, js)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
