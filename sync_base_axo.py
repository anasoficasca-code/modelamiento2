import io

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

target = '["naturalExplodeOverlay", "culturalExplodeOverlay", "techExplodeOverlay"].forEach(id => {'
repl = '["sceneWrap", "naturalExplodeOverlay", "culturalExplodeOverlay", "techExplodeOverlay"].forEach(id => {'

cjs = cjs.replace(target, repl)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
