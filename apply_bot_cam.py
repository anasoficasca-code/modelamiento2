import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

# 1. Ensure sectionCamera is properly instantiated
# It already is: const sectionCamera = new THREE.PerspectiveCamera(55, 1, 1, 5000);

# 2. Update placeSectionCutAtHumedal to use her exact coordinates and fix FOV
target_place = '''sectionCamera.position.set(130.7, 14.1, 11.9);
      sectionCamera.up.set(0, 1, 0);
      sectionCamera.lookAt(225.4, -31.3, -53.8);
      sectionCamera.fov = 15; // mucho mas zoom (mas del doble que el intento anterior de 32°), para que el corte llene el recuadro
      if (!sectionControls) {
        sectionControls = new THREE.OrbitControls(sectionCamera, sectionCanvas2);
        sectionControls.enableDamping = true;
        sectionControls.dampingFactor = 0.15;
        sectionControls.addEventListener("change", updateBotBox);
      }
      if (sectionControls) sectionControls.target.set(225.4, -31.3, -53.8);'''

repl_place = '''sectionCamera.position.set(-134.8, 35.6, 218.4);
      sectionCamera.up.set(0, 1, 0);
      sectionCamera.lookAt(165.3, 12.5, -18.4);
      sectionCamera.fov = 40; // FOV mas amplio para que se note la perspectiva real
      sectionCamera.zoom = 1.0;
      if (!sectionControls) {
        sectionControls = new THREE.OrbitControls(sectionCamera, sectionCanvas2);
        sectionControls.enableDamping = true;
        sectionControls.dampingFactor = 0.15;
        sectionControls.addEventListener("change", updateBotBox);
      }
      if (sectionControls) sectionControls.target.set(165.3, 12.5, -18.4);'''

cjs = cjs.replace(target_place, repl_place)

# 3. Remove the hijacked updateSectionCutRotation override
target_rot = '''// Hardcode requested camera coordinates
    sectionCamera.position.set(-610.7, 70.0, 693.2);
    sectionCamera.up.set(0, 1, 0);
    sectionCamera.lookAt(177.0, 5.5, -25.6);
    if (sectionControls) sectionControls.target.set(177.0, 5.5, -25.6);
    sectionCamera.zoom = 3.42;
    sectionCamera.updateProjectionMatrix();'''

repl_rot = '''// Removemos el reseteo de camara indeseado aqui'''

cjs = cjs.replace(target_rot, repl_rot)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
