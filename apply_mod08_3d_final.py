import re

# =========================================================================
# 1. Update modulo-08-3d.html
# =========================================================================
with open('modulo-08-3d.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Hide rotatePanel (the panel with XYZ sliders / section box controls)
html = html.replace('<div class="rotate-panel" id="rotatePanel">', '<div class="rotate-panel" id="rotatePanel" style="display:none !important;">')

# Hide textareas with raw coordinates
html = html.replace('id="sectionCoordsOutput" readonly style="', 'id="sectionCoordsOutput" readonly style="display:none !important;')
html = html.replace('<textarea id="sectionBoxOutput" rows="4" spellcheck="false" readonly></textarea>', '<textarea id="sectionBoxOutput" rows="4" spellcheck="false" readonly style="display:none !important;"></textarea>')

# Add buildingInfo popup right after treeInfo
tree_info_end = '<div class="tree-info" id="treeInfo">\n      <button type="button" class="tree-info-close" id="treeInfoClose">✕</button>\n      <p class="tree-info-kind">Árbol</p>\n      <h3 id="treeInfoName"></h3>\n      <p id="treeInfoDetails"></p>\n    </div>'

building_info_html = '''<div class="tree-info" id="treeInfo">
      <button type="button" class="tree-info-close" id="treeInfoClose">✕</button>
      <p class="tree-info-kind">Árbol</p>
      <h3 id="treeInfoName"></h3>
      <p id="treeInfoDetails"></p>
    </div>

    <!-- Tarjeta de edición de color de edificio (techo + paredes) -->
    <div class="tree-info" id="buildingInfo" style="width:320px;">
      <button type="button" class="tree-info-close" id="buildingInfoClose">✕</button>
      <p class="tree-info-kind">Edificio seleccionado</p>
      <h3 id="buildingInfoTitle">Edificio</h3>
      <p id="buildingInfoDetails" style="margin-bottom:8px;"></p>
      
      <label style="font-size:11px; font-weight:600; color:var(--ink-dim); display:block; margin-bottom:6px;">Cambiar color (paredes + techo):</label>
      <div id="buildingColorPalette" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
        <button type="button" class="color-swatch" data-color="#ffffff" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.3); background:#ffffff; cursor:pointer;" title="Blanco original"></button>
        <button type="button" class="color-swatch" data-color="#e8e4dc" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#e8e4dc; cursor:pointer;" title="Crema"></button>
        <button type="button" class="color-swatch" data-color="#d4aa6a" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#d4aa6a; cursor:pointer;" title="Ocre"></button>
        <button type="button" class="color-swatch" data-color="#d88a70" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#d88a70; cursor:pointer;" title="Terracota"></button>
        <button type="button" class="color-swatch" data-color="#789882" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#789882; cursor:pointer;" title="Verde sabana"></button>
        <button type="button" class="color-swatch" data-color="#6a8cae" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#6a8cae; cursor:pointer;" title="Azul pizarra"></button>
        <button type="button" class="color-swatch" data-color="#c88a96" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#c88a96; cursor:pointer;" title="Rosa ceniza"></button>
        <input type="color" id="buildingCustomColorPicker" value="#d88a70" style="width:30px; height:26px; padding:0; border:1px solid rgba(255,255,255,.2); border-radius:6px; background:none; cursor:pointer;" title="Color personalizado">
      </div>
      
      <textarea id="buildingColorConfigOutput" rows="3" readonly spellcheck="false" style="width:100%; font:9.5px/1.3 monospace; background:#0d0f12; color:var(--accent); border:1px solid var(--panel-border); border-radius:6px; padding:6px; margin-bottom:8px; resize:none;"></textarea>
      <button type="button" id="copyBuildingColorConfigBtn" style="width:100%; padding:7px 8px; border-radius:6px; border:1px solid var(--accent); background:var(--accent); color:#0b0c0f; font-size:11px; font-weight:700; cursor:pointer;">📋 Copiar cambios de color</button>
    </div>'''

html = html.replace(tree_info_end, building_info_html)

# Bump script version to v=103
html = html.replace('modulo-08-3d.js?v=73', 'modulo-08-3d.js?v=103')

with open('modulo-08-3d.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("SUCCESS: Updated modulo-08-3d.html!")

# =========================================================================
# 2. Update modulo-08-3d.js
# =========================================================================
with open('modulo-08-3d.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Remove roofs_flat.json overlay so roofs aren't covered in solid white
js = js.replace(
    'loadTriMesh("./assets/kennedy_roofs_flat.json", 0xffffff);    // techos planos con parapeto ya modelado',
    '// loadTriMesh("./assets/kennedy_roofs_flat.json", 0xffffff); // quitado para que los techos tengan el mismo color asignado que el edificio'
)

# Find EXACT start and end of buildBuildings function
start_idx = js.find('function buildBuildings(buildings) {')
end_idx = js.find('function loadBuildings() {')

if start_idx == -1 or end_idx == -1:
    print("ERROR: Could not find buildBuildings boundaries!")
    exit(1)

new_build_buildings = '''let currentBuildingMesh = null;
  let buildingRanges = [];
  let buildingStarts = [];
  let selectedBuildingRange = null;
  let customBuildingColorsMap = {};

  function buildBuildings(buildings) {
    const positions = [];
    const normals = [];
    const colors = [];
    const edgePositions = [];
    buildingRanges = [];
    buildingStarts = [];

    let vertexOffset = 0;

    buildings.forEach((b, idx) => {
      const pts = b.pts.map(p => toScene(p[0], p[1]));
      const h = b.h * SCALE;
      if (pts.length < 4) return;

      const startV = vertexOffset;
      const bldgId = `bldg_${idx + 1}`;
      const userHex = customBuildingColorsMap[bldgId] || "#ffffff";
      const c = new THREE.Color(userHex);

      let bVertCount = 0;

      // Paredes: 2 triángulos (6 vértices) por cada segmento del perímetro
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], cSeg = pts[i + 1];
        const dx = cSeg.x - a.x, dz = cSeg.z - a.z;
        const len = Math.hypot(dx, dz) || 0.001;
        const nx = dz / len, nz = -dx / len;

        positions.push(
          a.x, 0, a.z,  cSeg.x, 0, cSeg.z,  cSeg.x, h, cSeg.z,
          a.x, 0, a.z,  cSeg.x, h, cSeg.z,  a.x, h, a.z
        );
        for (let k = 0; k < 6; k++) {
          normals.push(nx, 0, nz);
          colors.push(c.r, c.g, c.b);
        }
        bVertCount += 6;
        edgePositions.push(a.x, h, a.z, cSeg.x, h, cSeg.z);
      }

      // Techo: triangulación del polígono superior en la altura h
      const pts2d = pts.map(p => new THREE.Vector2(p.x, p.z));
      let tris;
      try { tris = THREE.ShapeUtils.triangulateShape(pts2d, []); }
      catch (e) { tris = []; }

      tris.forEach(([ia, ib, ic]) => {
        positions.push(
          pts[ia].x, h, pts[ia].z,
          pts[ib].x, h, pts[ib].z,
          pts[ic].x, h, pts[ic].z
        );
        for (let k = 0; k < 3; k++) {
          normals.push(0, 1, 0);
          colors.push(c.r, c.g, c.b);
        }
        bVertCount += 3;
      });

      vertexOffset += bVertCount;
      buildingRanges.push({
        id: bldgId,
        index: idx,
        start: startV,
        count: bVertCount,
        colorHex: userHex,
        hMeters: b.h
      });
      buildingStarts.push(startV);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.6,
      metalness: 0.03,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 2,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    currentBuildingMesh = mesh;
    sceneRoot.add(mesh);

    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x2b2e33, transparent: true, opacity: 0.14 });
    buildingEdgeMat = edgeMat;
    sceneRoot.add(new THREE.LineSegments(edgeGeo, edgeMat));
  }

  function findBuildingByVertexIndex(vIdx) {
    if (!buildingStarts.length) return null;
    let lo = 0, hi = buildingStarts.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const st = buildingStarts[mid];
      const count = buildingRanges[mid].count;
      if (vIdx >= st && vIdx < st + count) {
        return buildingRanges[mid];
      }
      if (vIdx < st) hi = mid - 1;
      else lo = mid + 1;
    }
    return null;
  }

  function updateBuildingColorOutput() {
    const outputEl = document.getElementById("buildingColorConfigOutput");
    if (!outputEl) return;
    const keys = Object.keys(customBuildingColorsMap);
    const nl = String.fromCharCode(10);
    if (!keys.length) {
      outputEl.value = "// === CAMBIOS DE COLOR DE EDIFICIOS ===" + nl + "const BUILDING_COLORS = {};";
      return;
    }
    const lines = ["// === CAMBIOS DE COLOR DE EDIFICIOS ===", "const BUILDING_COLORS = {"];
    keys.forEach((k, i) => {
      lines.push('  "' + k + '": "' + customBuildingColorsMap[k] + '"' + (i < keys.length - 1 ? ',' : ''));
    });
    lines.push("};");
    outputEl.value = lines.join(nl);
  }

  function setBuildingColor(range, hexColor) {
    if (!currentBuildingMesh) return;
    const c = new THREE.Color(hexColor);
    const colorAttr = currentBuildingMesh.geometry.attributes.color;
    for (let i = range.start; i < range.start + range.count; i++) {
      colorAttr.setXYZ(i, c.r, c.g, c.b);
    }
    colorAttr.needsUpdate = true;
    range.colorHex = hexColor;
    if (hexColor === "#ffffff") {
      delete customBuildingColorsMap[range.id];
    } else {
      customBuildingColorsMap[range.id] = hexColor;
    }
    updateBuildingColorOutput();
  }

  function showBuildingEditor(range) {
    selectedBuildingRange = range;
    const info = document.getElementById("buildingInfo");
    const title = document.getElementById("buildingInfoTitle");
    const details = document.getElementById("buildingInfoDetails");
    const customPicker = document.getElementById("buildingCustomColorPicker");
    if (!info) return;

    if (title) title.textContent = `Edificio #${range.index + 1}`;
    if (details) details.textContent = `Altura: ${range.hMeters.toFixed(1)} m · ID: ${range.id}`;
    if (customPicker) customPicker.value = range.colorHex;
    updateBuildingColorOutput();
    info.classList.add("show");
  }

  function hideBuildingEditor() {
    selectedBuildingRange = null;
    const info = document.getElementById("buildingInfo");
    if (info) info.classList.remove("show");
  }

  '''

js = js[:start_idx] + new_build_buildings + js[end_idx:]

# Update raycaster click listener to pick buildings when tree is not hit
old_click_listener = '''    if (best) {
      const [, , hMeters, nombre] = best.data;
      treeInfoName.textContent = nombre;
      treeInfoDetails.textContent = `Altura aproximada: ${hMeters.toFixed(1)} m`;
      treeInfo.classList.add("show");
    } else {
      treeInfo.classList.remove("show");
    }'''

new_click_listener = '''    if (best) {
      const [, , hMeters, nombre] = best.data;
      treeInfoName.textContent = nombre;
      treeInfoDetails.textContent = `Altura aproximada: ${hMeters.toFixed(1)} m`;
      treeInfo.classList.add("show");
      hideBuildingEditor();
    } else {
      treeInfo.classList.remove("show");
      if (currentBuildingMesh) {
        const bHits = raycaster.intersectObject(currentBuildingMesh);
        if (bHits.length > 0) {
          const hitVIdx = bHits[0].faceIndex * 3;
          const bRange = findBuildingByVertexIndex(hitVIdx);
          if (bRange) {
            showBuildingEditor(bRange);
            return;
          }
        }
      }
      hideBuildingEditor();
    }'''

js = js.replace(old_click_listener, new_click_listener)

# Add Building UI event listeners setup INSIDE the IIFE right before resize(); requestAnimationFrame(animate);
bldg_ui_listeners = '''
  // ---- Controles de edición de color de edificios ----
  const bInfoClose = document.getElementById("buildingInfoClose");
  if (bInfoClose) bInfoClose.addEventListener("click", hideBuildingEditor);

  const colorSwatches = document.querySelectorAll("#buildingColorPalette .color-swatch");
  colorSwatches.forEach(btn => {
    btn.addEventListener("click", () => {
      const hexColor = btn.dataset.color;
      const customPicker = document.getElementById("buildingCustomColorPicker");
      if (customPicker) customPicker.value = hexColor;
      if (selectedBuildingRange) {
        setBuildingColor(selectedBuildingRange, hexColor);
      }
    });
  });

  const customPicker = document.getElementById("buildingCustomColorPicker");
  if (customPicker) {
    customPicker.addEventListener("input", (e) => {
      const hexColor = e.target.value;
      if (selectedBuildingRange) {
        setBuildingColor(selectedBuildingRange, hexColor);
      }
    });
  }

  const copyConfigBtn = document.getElementById("copyBuildingColorConfigBtn");
  if (copyConfigBtn) {
    copyConfigBtn.addEventListener("click", async () => {
      const outputEl = document.getElementById("buildingColorConfigOutput");
      if (!outputEl) return;
      try {
        await navigator.clipboard.writeText(outputEl.value);
        copyConfigBtn.textContent = "✅ Configuración copiada";
        setTimeout(() => { copyConfigBtn.textContent = "📋 Copiar cambios de color"; }, 1600);
      } catch (e) {}
    });
  }

  resize();
  requestAnimationFrame(animate);'''

js = js.replace('resize();\n  requestAnimationFrame(animate);', bldg_ui_listeners)

with open('modulo-08-3d.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("SUCCESS: Updated modulo-08-3d.js cleanly using String.fromCharCode(10)!")
