import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

target = '''if (!sectionControls) {
        sectionControls = new THREE.OrbitControls(sectionCamera, sectionCanvas2);
        sectionControls.enableDamping = true;
        sectionControls.dampingFactor = 0.15;
      }'''
repl = '''if (!sectionControls) {
        sectionControls = new THREE.OrbitControls(sectionCamera, sectionCanvas2);
        sectionControls.enableDamping = true;
        sectionControls.dampingFactor = 0.15;
        sectionControls.addEventListener("change", updateBotBox);
      }'''

cjs = cjs.replace(target, repl)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
