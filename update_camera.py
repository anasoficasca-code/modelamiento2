import io

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

target = '''      sectionCamera.position.set(152.7, 6.8, -12.5);
      sectionCamera.up.set(0, 1, 0);
      sectionCamera.lookAt(187.6, 2.1, -36.8);
      sectionCamera.fov = 18; // solo se agranda el contenido (mas zoom), el tamao del panel no se toca'''

repl = '''      sectionCamera.position.set(163.0, 6.8, -21.2);
      sectionCamera.up.set(0, 1, 0);
      sectionCamera.lookAt(182.4, 4.2, -35.7);
      sectionCamera.fov = 12; // a pedido, un poco ms de zoom (menor FOV = mas zoom)'''

# Wait, there may be unicode characters, let's use exact substring search on ascii parts
target1 = 'sectionCamera.position.set(152.7, 6.8, -12.5);'
repl1 = 'sectionCamera.position.set(163.0, 6.8, -21.2);'
cjs = cjs.replace(target1, repl1)

target2 = 'sectionCamera.lookAt(187.6, 2.1, -36.8);'
repl2 = 'sectionCamera.lookAt(182.4, 4.2, -35.7);'
cjs = cjs.replace(target2, repl2)

target3 = 'sectionCamera.fov = 18;'
repl3 = 'sectionCamera.fov = 12;'
cjs = cjs.replace(target3, repl3)

target4 = 'if (sectionControls) sectionControls.target.set(187.6, 2.1, -36.8);'
repl4 = 'if (sectionControls) sectionControls.target.set(182.4, 4.2, -35.7);'
cjs = cjs.replace(target4, repl4)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
