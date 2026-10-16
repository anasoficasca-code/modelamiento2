import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

# 1. Update Camera
cjs = cjs.replace('camera.position.set(-389.40, 559.68, 542.58);', 'camera.position.set(-610.4, 70.5, 693.5);')
cjs = cjs.replace('controls.target.set(218.76, -53.06, -86.62);', 'controls.target.set(177.3, 6.0, -25.3);')
cjs = cjs.replace('camera.zoom = 1.65;', 'camera.zoom = 3.42;')
cjs = cjs.replace('camera.zoom = 1.65; // tamaño grande original', '/* camera.zoom = 1.65; */')

# Disable auto center
cjs = cjs.replace('controls.target.set((x0 + x1) / 2, controls.target.y, (z0 + z1) / 2);', '/* controls.target.set((x0 + x1) / 2, controls.target.y, (z0 + z1) / 2); */')
cjs = cjs.replace('camera.position.copy(controls.target).add(off);', '/* camera.position.copy(controls.target).add(off); */')
cjs = cjs.replace('camera.lookAt(controls.target);', '/* camera.lookAt(controls.target); */')


# 2. Update Box Filter to null so bottom view has full geometry
target_rebuild = '''const boxFilter = (sectionBoxActive && !isFullRange && !isRotated) ? { xMin, xMax, zMin, zMax, yMin, yMax } : null;
    if (rawBuildingsData) buildBuildings(rawBuildingsData, boxFilter);
    if (rawEdgesData) buildRoads(rawEdgesData, boxFilter);
    // El borde negro sigue el area de la caja de seccion (lo que en
    // verdad se ve), no el terreno completo (que quedaria muy lejos del
    // recorte y no se notaria).
    if (boxFilter) buildAxoBorder(xMin, xMax, zMin, zMax);'''
replacement_rebuild = '''const mainBoxFilter = (sectionBoxActive && !isFullRange && !isRotated) ? { xMin, xMax, zMin, zMax, yMin, yMax } : null;
    if (rawBuildingsData) buildBuildings(rawBuildingsData, null);
    if (rawEdgesData) buildRoads(rawEdgesData, null);
    
    if (mainBoxFilter) buildAxoBorder(xMin, xMax, zMin, zMax);'''
cjs = cjs.replace(target_rebuild, replacement_rebuild)


# 3. Modify Edge extraction for Modulo 8 style
target_edges = '''edgePositions.push(a.x, h, a.z, c.x, h, c.z); // perimetro del techo
        // Esquina vertical como una mini-pared delgada real (2 caras
        // perpendiculares en cruz, para que se vea igual de gruesa
        // mirando desde CUALQUIER angulo, no solo una linea plana que
        // puede volverse invisible al verla de filo).
        const ex = a.x, ez = a.z;
        cornerPositions.push(
          ex - CORNER_THICK, 0, ez, ex + CORNER_THICK, 0, ez, ex + CORNER_THICK, h, ez,
          ex - CORNER_THICK, 0, ez, ex + CORNER_THICK, h, ez, ex - CORNER_THICK, h, ez,
          ex, 0, ez - CORNER_THICK, ex, 0, ez + CORNER_THICK, ex, h, ez + CORNER_THICK,
          ex, 0, ez - CORNER_THICK, ex, h, ez + CORNER_THICK, ex, h, ez - CORNER_THICK
        );
      }'''

replacement_edges = '''// Aristas 3D manuales completas
      }
      for (let i = 0; i < pts.length - 1; i++) {
        edgePositions.push(pts[i].x, h, pts[i].z, pts[i + 1].x, h, pts[i + 1].z);
      }
      edgePositions.push(pts[pts.length - 1].x, h, pts[pts.length - 1].z, pts[0].x, h, pts[0].z);
      for (let i = 0; i < pts.length - 1; i++) {
        edgePositions.push(pts[i].x, 0, pts[i].z, pts[i + 1].x, 0, pts[i + 1].z);
      }
      edgePositions.push(pts[pts.length - 1].x, 0, pts[pts.length - 1].z, pts[0].x, 0, pts[0].z);
      for (let i = 0; i < pts.length; i++) {
        edgePositions.push(pts[i].x, 0, pts[i].z, pts[i].x, h, pts[i].z);
      }'''

cjs = cjs.replace(target_edges, replacement_edges)

# Remove the cornerMesh addition
target_corner_add = '''const cornerGeo = new THREE.BufferGeometry();
    cornerGeo.setAttribute("position", new THREE.Float32BufferAttribute(cornerPositions, 3));
    const cornerMat = new THREE.MeshBasicMaterial({ color: 0x1f2124, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    const cornerMesh = new THREE.Mesh(cornerGeo, cornerMat);
    sceneRoot.add(cornerMesh);
    currentBuildingCornerMesh = cornerMesh;'''
cjs = cjs.replace(target_corner_add, '')

# Change Edge Material to Green
target_edge_mat = '''const edgeMat = new THREE.LineBasicMaterial({ color: 0x2b2e33, transparent: true, opacity: 0.35 });'''
replacement_edge_mat = '''const edgeMat = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: false, opacity: 1.0, depthWrite: false, depthTest: false, clippingPlanes: [] });'''
cjs = cjs.replace(target_edge_mat, replacement_edge_mat)


# 4. Fix HTML Sliders reset
target_reset = '''secXMin.value = 58; secXMax.value = 67; secYMin.value = 0; secYMax.value = 100; secZMin.value = 39; secZMax.value = 54;
    if (secRot) secRot.value = 0;'''
replacement_reset = '''secXMin.value = 0; secXMax.value = 90; secYMin.value = 0; secYMax.value = 100; secZMin.value = 0; secZMax.value = 29;
    if (secRot) secRot.value = 58;'''
cjs = cjs.replace(target_reset, replacement_reset)


# 5. Connect botClipPlanesArr to sectionRenderer
target_clip = '''if (sectionRenderer) {
      sectionRenderer.clippingPlanes = [sectionCutPlane];'''
replacement_clip = '''if (sectionRenderer) {
      updateBotBox();
      sectionRenderer.localClippingEnabled = true;
      sectionRenderer.clippingPlanes = botClipPlanesArr;'''
cjs = cjs.replace(target_clip, replacement_clip)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
    
# Update HTML file sliders
with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

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
