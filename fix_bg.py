import io

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

# Fix Cultural
target_cult = '''    if (roadMat) roadMat.color.set(0x9099a3);

    scene.background = new THREE.Color(0xffffff);
    renderer.render(scene, camera);
    const fotoBase = captureBaseWithContext(); // mismo contexto clarito + area de estudio que en Natural'''

repl_cult = '''    if (roadMat) roadMat.color.set(0x9099a3);

    const fotoBase = captureBaseWithContext(); // mismo contexto clarito + area de estudio que en Natural'''
cjs = cjs.replace(target_cult, repl_cult)

# Fix Tech
target_tech = '''    const origBg = scene.background;
    scene.background = new THREE.Color(0xffffff);

    // 1. CAPA BASE (Sin ruido, sin carros)
    if (noiseMesh) noiseMesh.visible = false;
    if (birdsGroup) birdsGroup.visible = false;
    if (vehInstanced) { vehInstanced.visible = false; vehInstanced.count = 0; }
    if (roadMat) roadMat.color.set(0x9099a3);

    renderer.render(scene, camera);
    const fotoBase = captureBaseWithContext(); // mismo contexto clarito + area de estudio que en Natural'''

repl_tech = '''    const origBg = scene.background;

    // 1. CAPA BASE (Sin ruido, sin carros)
    if (noiseMesh) noiseMesh.visible = false;
    if (birdsGroup) birdsGroup.visible = false;
    if (vehInstanced) { vehInstanced.visible = false; vehInstanced.count = 0; }
    if (roadMat) roadMat.color.set(0x9099a3);

    const fotoBase = captureBaseWithContext(); // mismo contexto clarito + area de estudio que en Natural'''
cjs = cjs.replace(target_tech, repl_tech)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
