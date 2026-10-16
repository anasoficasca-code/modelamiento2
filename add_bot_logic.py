import io

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

# 1. Define botPlanes globally (find where secPlanes is defined)
target_planes = '''const secPlanes = {
    xMin: new THREE.Plane(new THREE.Vector3(1, 0, 0), 1e6),
    xMax: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e6),
    yMin: new THREE.Plane(new THREE.Vector3(0, 1, 0), 1e6),
    yMax: new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6),
    zMin: new THREE.Plane(new THREE.Vector3(0, 0, 1), 1e6),
    zMax: new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e6)
  };
  const sectionClipPlanesArr = [secPlanes.xMin, secPlanes.xMax, secPlanes.yMin, secPlanes.yMax, secPlanes.zMin, secPlanes.zMax];'''

replacement_planes = target_planes + '''
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
cjs = cjs.replace(target_planes, replacement_planes)


# 2. Add bottom slider handlers and updateBotBox function
target_handlers = '''  const secXMin = document.getElementById("secXMin"), secXMinVal = document.getElementById("secXMinVal");'''
replacement_handlers = '''  const botRot = document.getElementById("botRot"), botRotVal = document.getElementById("botRotVal");
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

''' + target_handlers
cjs = cjs.replace(target_handlers, replacement_handlers)


# 3. Apply the clipping array to sectionRenderer
target_clipping = '''if (sectionRenderer) {
      sectionRenderer.clippingPlanes = [sectionCutPlane];'''
replacement_clipping = '''if (sectionRenderer) {
      updateBotBox();
      sectionRenderer.localClippingEnabled = true;
      sectionRenderer.clippingPlanes = botClipPlanesArr;'''
cjs = cjs.replace(target_clipping, replacement_clipping)


# 4. Modify rebuildFilteredGeometry so it builds the FULL city, BUT border is still cropped to main view sliders.
target_rebuild = '''const isFullRange = secXMin.value == 0 && secXMax.value == 100 && secYMin.value == 0 && secYMax.value == 100 && secZMin.value == 0 && secZMax.value == 100;
    const isRotated = secRot && parseFloat(secRot.value) !== 0;
    // Con rotacion distinta de 0, el filtro geometrico (axis-aligned) no
    // sirve para una caja girada -- se deja toda la geometria cargada y
    // el recorte por shader (arriba) es el que de verdad muestra el
    // corte girado.
    const boxFilter = (sectionBoxActive && !isFullRange && !isRotated) ? { xMin, xMax, zMin, zMax, yMin, yMax } : null;
    if (rawBuildingsData) buildBuildings(rawBuildingsData, boxFilter);
    if (rawEdgesData) buildRoads(rawEdgesData, boxFilter);
    // El borde negro sigue el area de la caja de seccion (lo que en
    // verdad se ve), no el terreno completo (que quedaria muy lejos del
    // recorte y no se notaria).
    if (boxFilter) buildAxoBorder(xMin, xMax, zMin, zMax);
    else buildAxoBorder(-halfW, halfW, -halfH, halfH);'''

replacement_rebuild = '''const isFullRange = secXMin.value == 0 && secXMax.value == 100 && secYMin.value == 0 && secYMax.value == 100 && secZMin.value == 0 && secZMax.value == 100;
    const isRotated = secRot && parseFloat(secRot.value) !== 0;
    // USER REQUEST: Render everything so that the bottom viewport has full access to the territory.
    // The main view will still visually crop it using its own shader clipping planes (sectionClipPlanesArr).
    const boxFilter = null;
    if (rawBuildingsData) buildBuildings(rawBuildingsData, boxFilter);
    if (rawEdgesData) buildRoads(rawEdgesData, boxFilter);
    
    // El borde negro sigue el area de la caja de seccion principal (lo que en verdad se ve en la main view)
    const mainBoxFilter = (sectionBoxActive && !isFullRange && !isRotated) ? { xMin, xMax, zMin, zMax, yMin, yMax } : null;
    if (mainBoxFilter) buildAxoBorder(xMin, xMax, zMin, zMax);
    else buildAxoBorder(-halfW, halfW, -halfH, halfH);'''

cjs = cjs.replace(target_rebuild, replacement_rebuild)


with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
