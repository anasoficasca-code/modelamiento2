import io

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

cjs = cjs.replace('"sceneWrap", ', '')

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
