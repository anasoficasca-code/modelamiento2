import io

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

target = 'let sectionRenderer = null, sectionCutZ = null;'
replacement = 'let sectionRenderer = null, sectionCutZ = null, sectionControls = null;'
cjs = cjs.replace(target, replacement)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
