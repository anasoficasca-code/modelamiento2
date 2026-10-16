import io

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

# Add sectionControls global
cjs = cjs.replace('let sectionRenderer, sectionCamera;', 'let sectionRenderer, sectionCamera, sectionControls;')

# Initialize it
init_target = '''if (sectionRenderer) {
      sectionRenderer.clippingPlanes = [sectionCutPlane];
      sectionCamera.position.set(-610.7, 70.0, 693.2);'''
init_replacement = '''if (sectionRenderer) {
      sectionRenderer.clippingPlanes = [sectionCutPlane];
      sectionCamera.position.set(-610.7, 70.0, 693.2);
      if (!sectionControls) {
        sectionControls = new THREE.OrbitControls(sectionCamera, sectionCanvas2);
        sectionControls.enableDamping = true;
        sectionControls.dampingFactor = 0.15;
      }'''
cjs = cjs.replace(init_target, init_replacement)

# Update it in animate loop
anim_target = '''controls.update();
    renderer.render(scene, camera);'''
anim_replacement = '''controls.update();
    if (sectionControls) sectionControls.update();
    renderer.render(scene, camera);'''
cjs = cjs.replace(anim_target, anim_replacement)

# Also update the lookAt for sectionControls so it orbits around the target
lookat_target = '''sectionCamera.lookAt(177.0, 5.5, -25.6);
      sectionCamera.zoom = 3.42;'''
lookat_replacement = '''sectionCamera.lookAt(177.0, 5.5, -25.6);
      if (sectionControls) sectionControls.target.set(177.0, 5.5, -25.6);
      sectionCamera.zoom = 3.42;'''
cjs = cjs.replace(lookat_target, lookat_replacement)

# Since I have TWO places where lookAt might happen (placeSectionCutAtHumedal and updateSectionCutRotation), let's make sure it updates both!
# I'll just find all `sectionCamera.lookAt(`
# Wait, my previous script hardcoded both! Let's check updateSectionCutRotation:
rot_target = '''sectionCamera.lookAt(177.0, 5.5, -25.6);
    sectionCamera.zoom = 3.42;'''
rot_replacement = '''sectionCamera.lookAt(177.0, 5.5, -25.6);
    if (sectionControls) sectionControls.target.set(177.0, 5.5, -25.6);
    sectionCamera.zoom = 3.42;'''
cjs = cjs.replace(rot_target, rot_replacement)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
