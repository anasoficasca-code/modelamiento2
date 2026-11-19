import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace all occurrences of setting sceneWrap to block with setting it to none (or just commenting them out)
js = js.replace('document.getElementById("sceneWrap").style.display = "block";', '// document.getElementById("sceneWrap").style.display = "block";')
js = js.replace('if (sceneWrapRestore) sceneWrapRestore.style.display = "block";', '// if (sceneWrapRestore) sceneWrapRestore.style.display = "block";')
js = js.replace('if (sceneWrapRestore2) sceneWrapRestore2.style.display = "block";', '// if (sceneWrapRestore2) sceneWrapRestore2.style.display = "block";')
js = js.replace('if (sceneWrapRestore3) sceneWrapRestore3.style.display = "block";', '// if (sceneWrapRestore3) sceneWrapRestore3.style.display = "block";')

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
