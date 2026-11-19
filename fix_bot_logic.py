import io
import re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

# 1. Define botPlanes
planes_str = '''const secPlanes = {
    xMin: new THREE.Plane(new THREE.Vector3(1, 0, 0), 1e6),
    xMax: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e6),
    yMin: new THREE.Plane(new THREE.Vector3(0, 1, 0), 1e6),
    yMax: new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6),
    zMin: new THREE.Plane(new THREE.Vector3(0, 0, 1), 1e6),
    zMax: new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e6),
  };
  const sectionClipPlanesArr = [secPlanes.xMin, secPlanes.xMax, secPlanes.yMin, secPlanes.yMax, secPlanes.zMin, secPlanes.zMax];'''

bot_planes_str = planes_str + '''
  const botPlanes = {
    xMin: new THREE.Plane(new THREE.Vector3(1, 0, 0), 1e6),
    xMax: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e6),
    yMin: new THREE.Plane(new THREE.Vector3(0, 1, 0), 1e6),
    yMax: new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6),
    zMin: new THREE.Plane(new THREE.Vector3(0, 0, 1), 1e6),
    zMax: new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e6)
  };
  const botClipPlanesArr = [botPlanes.xMin, botPlanes.xMax, botPlanes.yMin, botPlanes.yMax, botPlanes.zMin, botPlanes.zMax];
'''
cjs = cjs.replace(planes_str, bot_planes_str)


# 2. Add handlers. Let's find secRot and insert before it.
idx = cjs.find('const secRot = document.getElementById("secRot")')

bot_handlers = '''
  const botRot = document.getElementById("botRot"), botRotVal = document.getElementById("botRotVal");
  const botXMin = document.getElementById("botXMin"), botXMinVal = document.getElementById("botXMinVal");
  const botXMax = document.getElementById("botXMax"), botXMaxVal = document.getElementById("botXMaxVal");
  const botYMin = document.getElementById("botYMin"), botYMinVal = document.getElementById("botYMinVal");
  const botYMax = document.getElementById("botYMax"), botYMaxVal = document.getElementById("botYMaxVal");
  const botZMin = document.getElementById("botZMin"), botZMinVal = document.getElementById("botZMinVal");
  const botZMax = document.getElementById("botZMax"), botZMaxVal = document.getElementById("botZMaxVal");

  function updateBotBox() {
    if(!botXMin) return;
    const halfW = sceneExtentW / 2 * 1.4, halfH = sceneExtentH / 2 * 1.4;
    const xMin = -halfW + (parseFloat(botXMin.value) / 100) * (2 * halfW);
    const xMax = -halfW + (parseFloat(botXMax.value) / 100) * (2 * halfW);
    const zMin = -halfH + (parseFloat(botZMin.value) / 100) * (2 * halfH);
    const zMax = -halfH + (parseFloat(botZMax.value) / 100) * (2 * halfH);
    const yMin = (parseFloat(botYMin.value) / 100) * SECTION_Y_MAX;
    const yMax = (parseFloat(botYMax.value) / 100) * SECTION_Y_MAX;
    const rot = botRot ? parseFloat(botRot.value) : 0;
    const rad = rot * Math.PI / 180;
    const ux = Math.cos(rad), uz = Math.sin(rad);
    const vx = -Math.sin(rad), vz = Math.cos(rad);
    
    botRotVal.textContent = rot + "°";
    botPlanes.xMin.normal.set(ux, 0, uz); botPlanes.xMin.constant = -xMin;
    botPlanes.xMax.normal.set(-ux, 0, -uz); botPlanes.xMax.constant = xMax;
    botPlanes.yMin.constant = -yMin;
    botPlanes.yMax.constant = yMax;
    botPlanes.zMin.normal.set(vx, 0, vz); botPlanes.zMin.constant = -zMin;
    botPlanes.zMax.normal.set(-vx, 0, -vz); botPlanes.zMax.constant = zMax;
    
    botXMinVal.textContent = botXMin.value + "%"; botXMaxVal.textContent = botXMax.value + "%";
    botYMinVal.textContent = botYMin.value + "%"; botYMaxVal.textContent = botYMax.value + "%";
    botZMinVal.textContent = botZMin.value + "%"; botZMaxVal.textContent = botZMax.value + "%";
  }

  [botRot, botXMin, botXMax, botYMin, botYMax, botZMin, botZMax].forEach(el => {
    if(el) el.addEventListener("input", () => { updateBotBox(); });
  });

'''
cjs = cjs[:idx] + bot_handlers + cjs[idx:]

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
