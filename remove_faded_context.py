import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

target = r'// 1\) Contexto: sin recorte, con edificios y vias alrededor.*?// 2\) Area de estudio nitida \(con su recorte normal\), fondo transparente'
replace = '''// Renderizamos SOLAMENTE el area de estudio (la base del rombo), sin el contexto desvanecido de la axonometria inicial.'''

js = re.sub(target, replace, js, flags=re.DOTALL)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
