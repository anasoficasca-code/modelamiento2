import io
import re

# 1. HTML Sliders update
with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace secXMin and secXMax, secZMin, secZMax, secRot
html = re.sub(r'<input type="range" id="secRot" min="0" max="179" value="0" step="1">', r'<input type="range" id="secRot" min="0" max="179" value="58" step="1">', html)
html = re.sub(r'<span id="secRotVal">0°</span>', r'<span id="secRotVal">58°</span>', html)

html = re.sub(r'<input type="range" id="secXMin" min="0" max="100" value="58" step="1">', r'<input type="range" id="secXMin" min="0" max="100" value="0" step="1">', html)
html = re.sub(r'<span id="secXMinVal">58%</span>', r'<span id="secXMinVal">0%</span>', html)

html = re.sub(r'<input type="range" id="secXMax" min="0" max="100" value="67" step="1">', r'<input type="range" id="secXMax" min="0" max="100" value="90" step="1">', html)
html = re.sub(r'<span id="secXMaxVal">67%</span>', r'<span id="secXMaxVal">90%</span>', html)

html = re.sub(r'<input type="range" id="secZMin" min="0" max="100" value="39" step="1">', r'<input type="range" id="secZMin" min="0" max="100" value="0" step="1">', html)
html = re.sub(r'<span id="secZMinVal">39%</span>', r'<span id="secZMinVal">0%</span>', html)

html = re.sub(r'<input type="range" id="secZMax" min="0" max="100" value="54" step="1">', r'<input type="range" id="secZMax" min="0" max="100" value="29" step="1">', html)
html = re.sub(r'<span id="secZMaxVal">54%</span>', r'<span id="secZMaxVal">29%</span>', html)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)

# 2. JS Updates
with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()
with io.open('modulo-08-corte.js', 'r', encoding='utf-8') as f:
    c08 = f.read()

# Copy buildBuildings function
b08_start = c08.find('function buildBuildings(buildings)')
b08_end = c08.find('function buildRoads(')
buildBuildings_08 = c08[b08_start:b08_end]

b10_start = cjs.find('function buildBuildings(buildings, boxFilter)')
b10_end = cjs.find('function buildRoads(')
cjs = cjs[:b10_start] + buildBuildings_08 + cjs[b10_end:]

# Wait, buildBuildings in 08 takes (buildings), but in 10 it was (buildings, boxFilter).
# I removed boxFilter in my last commit anyway: buildBuildings(rawBuildingsData, null);
# But the callers in 10 pass 2 args! Let's update the definition in the copied code to accept boxFilter so it doesn't break, even if it ignores it!
cjs = cjs.replace('function buildBuildings(buildings) {', 'function buildBuildings(buildings, boxFilter) {')

# Copy main camera coordinates from 08
# In 08:
# camera.position.set(-610.4, 70.5, 693.5);
# controls.target.set(177.3, 6.0, -25.3);
# camera.zoom = 3.42;

cam10_start = cjs.find('camera.position.set(')
cam10_end = cjs.find('camera.updateProjectionMatrix();', cam10_start) + len('camera.updateProjectionMatrix();')
cam10_code = cjs[cam10_start:cam10_end]

cam08_code = '''camera.position.set(-610.4, 70.5, 693.5);
    controls.target.set(177.3, 6.0, -25.3);
    camera.zoom = 3.42;
    camera.updateProjectionMatrix();'''

cjs = cjs.replace(cam10_code, cam08_code)

# Reset sectionBoxReset values
reset_10_target = '''secXMin.value = 58; secXMax.value = 67; secYMin.value = 0; secYMax.value = 100; secZMin.value = 39; secZMax.value = 54;
    if (secRot) secRot.value = 0;'''
reset_10_replacement = '''secXMin.value = 0; secXMax.value = 90; secYMin.value = 0; secYMax.value = 100; secZMin.value = 0; secZMax.value = 29;
    if (secRot) secRot.value = 58;'''
cjs = cjs.replace(reset_10_target, reset_10_replacement)


# Make sure we don't have the "camera centering" logic from modulo-10 overriding our camera!
# In modulo-10:
# // Centrar en el area de estudio (caja de seccion) con el mismo angulo,
# // y ajustar el zoom para que el rombo completo quepa sin cortarse.
# This logic overrides the camera!!! Let's comment it out completely!
center_logic_target = '''const centerCam = () => {
      if (typeof secXMin !== 'undefined' && secXMin && sceneExtentW) {
        const halfW = sceneExtentW / 2 * 1.4, halfH = sceneExtentH / 2 * 1.4;
        const x0 = -halfW + (parseFloat(secXMin.value) / 100) * (2 * halfW), x1 = -halfW + (parseFloat(secXMax.value) / 100) * (2 * halfW);
        const z0 = -halfH + (parseFloat(secZMin.value) / 100) * (2 * halfH), z1 = -halfH + (parseFloat(secZMax.value) / 100) * (2 * halfH);
        if (isFinite(x0) && isFinite(z0) && x1 > x0 && z1 > z0) {
          const off = new THREE.Vector3().subVectors(camera.position, controls.target);
          controls.target.set((x0 + x1) / 2, controls.target.y, (z0 + z1) / 2);
          camera.position.copy(controls.target).add(off);
          camera.lookAt(controls.target);
          camera.zoom = 1.65; // tamaño grande original (el ajuste automatico la dejaba diminuta)
          camera.updateProjectionMatrix(); camera.updateMatrixWorld();
          const v = new THREE.Vector3(); let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
          [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].forEach(([x, z]) => [-6, 0, 8].forEach(yy => { v.set(x, yy, z).project(camera); mnx = Math.min(mnx, v.x); mxx = Math.max(mxx, v.x); mny = Math.min(mny, v.y); mxy = Math.max(mxy, v.y); }));
          // No auto-zoom para no perder la perspectiva que el usuario ajusto
        }
      }
    };
    centerCam();'''
cjs = cjs.replace(center_logic_target, '/* Auto-centering disabled to match mod-08 camera exactly */')


with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
