import io

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

target = 'window.addEventListener("pointerup", () => { dragPt = null; });\n  })();\n\n})();'
repl = 'window.addEventListener("pointerup", () => { dragPt = null; });\n  })();\n  applyEscalaTransform();\n})();'

cjs = cjs.replace(target, repl)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
