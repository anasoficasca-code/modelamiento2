import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

bot_output_html = '''      <!-- Controles independientes para el corte inferior -->
      <div id="botControls" style="position:absolute; right:10px; top:10px; width:220px; background:rgba(255,255,255,0.9); padding:10px; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.15); font-family:'Segoe UI',sans-serif; font-size:11px; color:#333; z-index:10;">
        <div style="font-weight:600; margin-bottom:8px; border-bottom:1px solid #ccc; padding-bottom:4px;">Recorte del Sector Inferior</div>
        <div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label>Rotaci&oacute;n <span id="botRotVal">58&deg;</span></label>
          <input type="range" id="botRot" min="0" max="179" value="58" step="1" style="width:100px;">
        </div>
        <div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label>X m&iacute;n <span id="botXMinVal">0%</span></label>
          <input type="range" id="botXMin" min="0" max="100" value="0" step="1" style="width:100px;">
        </div>
        <div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label>X m&aacute;x <span id="botXMaxVal">90%</span></label>
          <input type="range" id="botXMax" min="0" max="100" value="90" step="1" style="width:100px;">
        </div>
        <div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label>Y m&iacute;n (piso) <span id="botYMinVal">0%</span></label>
          <input type="range" id="botYMin" min="0" max="100" value="0" step="1" style="width:100px;">
        </div>
        <div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label>Y m&aacute;x (alt) <span id="botYMaxVal">100%</span></label>
          <input type="range" id="botYMax" min="0" max="100" value="100" step="1" style="width:100px;">
        </div>
        <div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label>Z m&iacute;n <span id="botZMinVal">0%</span></label>
          <input type="range" id="botZMin" min="0" max="100" value="0" step="1" style="width:100px;">
        </div>
        <div class="rotate-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label>Z m&aacute;x <span id="botZMaxVal">29%</span></label>
          <input type="range" id="botZMax" min="0" max="100" value="29" step="1" style="width:100px;">
        </div>
        <button type="button" id="botBoxCopy" style="width:100%; margin-top:4px; padding:4px; font-size:10px; cursor:pointer;">&#128203; Copiar coordenadas</button>
        <textarea id="botBoxOutput" rows="4" spellcheck="false" readonly style="width:100%; margin-top:4px; font-size:10px; box-sizing:border-box; background:#f8f9fa; border:1px solid #ccc;"></textarea>
      </div>'''

target = '<canvas id="sectionCanvas" style="width:100%; height:100%; display:block; cursor:grab;"></canvas>'
html = html.replace(target, target + '\n' + bot_output_html)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)


with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

# Global variables
cjs = cjs.replace('let sectionRenderer = null, sectionCutZ = null;', 'let sectionRenderer = null, sectionCutZ = null, sectionControls = null;')

# botPlanes definition
target_planes = '''const sectionClipPlanesArr = [secPlanes.xMin, secPlanes.xMax, secPlanes.yMin, secPlanes.yMax, secPlanes.zMin, secPlanes.zMax];'''
bot_planes = '''
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
cjs = cjs.replace(target_planes, target_planes + bot_planes)


# placeSectionCutAtHumedal logic
target_clip = '''if (sectionRenderer) {
      sectionRenderer.clippingPlanes = [sectionCutPlane];
      sectionCamera.position.set(-610.7, 70.0, 693.2);
      sectionCamera.up.set(0, 1, 0);
      sectionCamera.lookAt(177.0, 5.5, -25.6);'''

replacement_clip = '''if (sectionRenderer) {
      if (typeof updateBotBox === 'function') updateBotBox();
      sectionRenderer.localClippingEnabled = true;
      sectionRenderer.clippingPlanes = botClipPlanesArr;
      sectionCamera.position.set(-610.7, 70.0, 693.2);
      if (!sectionControls) {
        sectionControls = new THREE.OrbitControls(sectionCamera, sectionCanvas2);
        sectionControls.enableDamping = true;
        sectionControls.dampingFactor = 0.15;
      }
      sectionCamera.up.set(0, 1, 0);
      sectionCamera.lookAt(177.0, 5.5, -25.6);
      if (sectionControls) sectionControls.target.set(177.0, 5.5, -25.6);'''
cjs = cjs.replace(target_clip, replacement_clip)

# updateSectionCutRotation update sectionControls
target_rot = '''sectionCamera.position.set(-610.7, 70.0, 693.2);
    sectionCamera.up.set(0, 1, 0);
    sectionCamera.lookAt(177.0, 5.5, -25.6);'''
replacement_rot = '''sectionCamera.position.set(-610.7, 70.0, 693.2);
    sectionCamera.up.set(0, 1, 0);
    sectionCamera.lookAt(177.0, 5.5, -25.6);
    if (sectionControls) sectionControls.target.set(177.0, 5.5, -25.6);'''
cjs = cjs.replace(target_rot, replacement_rot)

# animate loop sectionControls update
target_anim = '''controls.update();
    renderer.render(scene, camera);'''
replacement_anim = '''controls.update();
    if (sectionControls) sectionControls.update();
    renderer.render(scene, camera);'''
cjs = cjs.replace(target_anim, replacement_anim)

# rebuildFilteredGeometry changes (only make boxFilter null, leave everything else)
target_rebuild = '''const boxFilter = (sectionBoxActive && !isFullRange && !isRotated) ? { xMin, xMax, zMin, zMax, yMin, yMax } : null;
    if (rawBuildingsData) buildBuildings(rawBuildingsData, boxFilter);
    if (rawEdgesData) buildRoads(rawEdgesData, boxFilter);
    // El borde negro sigue el area de la caja de seccion (lo que en
    // verdad se ve), no el terreno completo (que quedaria muy lejos del
    // recorte y no se notaria).
    if (boxFilter) buildAxoBorder(xMin, xMax, zMin, zMax);'''
replacement_rebuild = '''const mainBoxFilter = (sectionBoxActive && !isFullRange && !isRotated) ? { xMin, xMax, zMin, zMax, yMin, yMax } : null;
    if (rawBuildingsData) buildBuildings(rawBuildingsData, null); // Render full geometry for bottom view
    if (rawEdgesData) buildRoads(rawEdgesData, null); // Render full geometry for bottom view
    if (mainBoxFilter) buildAxoBorder(xMin, xMax, zMin, zMax);'''
cjs = cjs.replace(target_rebuild, replacement_rebuild)


# Add updateBotBox logic right before updateSectionBox
bot_handlers = '''
  const botRot = document.getElementById("botRot"), botRotVal = document.getElementById("botRotVal");
  const botXMin = document.getElementById("botXMin"), botXMinVal = document.getElementById("botXMinVal");
  const botXMax = document.getElementById("botXMax"), botXMaxVal = document.getElementById("botXMaxVal");
  const botYMin = document.getElementById("botYMin"), botYMinVal = document.getElementById("botYMinVal");
  const botYMax = document.getElementById("botYMax"), botYMaxVal = document.getElementById("botYMaxVal");
  const botZMin = document.getElementById("botZMin"), botZMinVal = document.getElementById("botZMinVal");
  const botZMax = document.getElementById("botZMax"), botZMaxVal = document.getElementById("botZMaxVal");
  const botBoxOutput = document.getElementById("botBoxOutput");

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
    
    if(botRotVal) botRotVal.textContent = rot + "°";
    botPlanes.xMin.normal.set(ux, 0, uz); botPlanes.xMin.constant = -xMin;
    botPlanes.xMax.normal.set(-ux, 0, -uz); botPlanes.xMax.constant = xMax;
    botPlanes.yMin.constant = -yMin;
    botPlanes.yMax.constant = yMax;
    botPlanes.zMin.normal.set(vx, 0, vz); botPlanes.zMin.constant = -zMin;
    botPlanes.zMax.normal.set(-vx, 0, -vz); botPlanes.zMax.constant = zMax;
    
    if(botXMinVal) botXMinVal.textContent = botXMin.value + "%"; 
    if(botXMaxVal) botXMaxVal.textContent = botXMax.value + "%";
    if(botYMinVal) botYMinVal.textContent = botYMin.value + "%"; 
    if(botYMaxVal) botYMaxVal.textContent = botYMax.value + "%";
    if(botZMinVal) botZMinVal.textContent = botZMin.value + "%"; 
    if(botZMaxVal) botZMaxVal.textContent = botZMax.value + "%";

    if (botBoxOutput && typeof sceneToReal === "function") {
      const r0 = sceneToReal(xMin, zMin), r1 = sceneToReal(xMax, zMax);
      botBoxOutput.value =
        `Rotación: ${rot}°\\n` +
        `U (a lo largo del giro): ${botXMin.value}% a ${botXMax.value}%\\n` +
        `Y (altura, m): ${(yMin / SCALE).toFixed(1)} a ${(yMax / SCALE).toFixed(1)}\\n` +
        `V (perpendicular): ${botZMin.value}% a ${botZMax.value}%\\n` +
        `(referencia sin girar — real ${Math.round(Math.min(r0[0], r1[0]))} a ${Math.round(Math.max(r0[0], r1[0]))} / ${Math.round(Math.min(r0[1], r1[1]))} a ${Math.round(Math.max(r0[1], r1[1]))})`;
    }
  }

  [botRot, botXMin, botXMax, botYMin, botYMax, botZMin, botZMax].forEach(el => {
    if(el) el.addEventListener("input", () => { updateBotBox(); });
  });

  const botBoxCopy = document.getElementById("botBoxCopy");
  if (botBoxCopy && botBoxOutput) {
    botBoxCopy.addEventListener("click", () => {
      botBoxOutput.select();
      document.execCommand("copy");
      const old = botBoxCopy.innerHTML;
      botBoxCopy.innerHTML = "¡Copiado!";
      setTimeout(() => botBoxCopy.innerHTML = old, 1500);
    });
  }

'''

idx = cjs.find('const secRot = document.getElementById("secRot")')
cjs = cjs[:idx] + bot_handlers + cjs[idx:]

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
