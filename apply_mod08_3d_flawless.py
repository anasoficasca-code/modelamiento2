import re

# =========================================================================
# 1. Update modulo-08-3d.html
# =========================================================================
with open('modulo-08-3d.html', 'r', encoding='utf-8') as f:
    html = f.read()

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
    <div class="tree-info" id="buildingInfo" style="width:310px;">
      <button type="button" class="tree-info-close" id="buildingInfoClose">✕</button>
      <p class="tree-info-kind">Edificio seleccionado</p>
      <h3 id="buildingInfoTitle">Edificio</h3>
      <p id="buildingInfoDetails" style="margin-bottom:10px;"></p>
      
      <label style="font-size:11px; font-weight:600; color:var(--ink-dim); display:block; margin-bottom:6px;">Cambiar color (paredes + techo):</label>
      <div id="buildingColorPalette" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
        <button type="button" class="color-swatch" data-color="#e8e4dc" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#e8e4dc; cursor:pointer;" title="Crema suave"></button>
        <button type="button" class="color-swatch" data-color="#d4aa6a" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#d4aa6a; cursor:pointer;" title="Ocre arcilla"></button>
        <button type="button" class="color-swatch" data-color="#d88a70" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#d88a70; cursor:pointer;" title="Terracota"></button>
        <button type="button" class="color-swatch" data-color="#789882" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#789882; cursor:pointer;" title="Verde sabana"></button>
        <button type="button" class="color-swatch" data-color="#6a8cae" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#6a8cae; cursor:pointer;" title="Azul pizarra"></button>
        <button type="button" class="color-swatch" data-color="#c88a96" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#c88a96; cursor:pointer;" title="Rosa ceniza"></button>
        <button type="button" class="color-swatch" data-color="#9b8ab4" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#9b8ab4; cursor:pointer;" title="Lavanda"></button>
        <input type="color" id="buildingCustomColorPicker" value="#d88a70" style="width:30px; height:26px; padding:0; border:1px solid rgba(255,255,255,.2); border-radius:6px; background:none; cursor:pointer;" title="Color personalizado">
      </div>
      <div style="display:flex; gap:6px;">
        <button type="button" id="applyBuildingColorSingleBtn" style="flex:1; padding:7px 8px; border-radius:6px; border:1px solid var(--accent); background:var(--accent); color:#0b0c0f; font-size:10.5px; font-weight:700; cursor:pointer;">Aplicar a este edificio</button>
        <button type="button" id="applyBuildingColorTypeBtn" style="flex:1; padding:7px 8px; border-radius:6px; border:1px solid var(--panel-border); background:var(--panel); color:var(--ink); font-size:10.5px; font-weight:600; cursor:pointer;">Aplicar a la categoría</button>
      </div>
    </div>'''

html = html.replace(tree_info_end, building_info_html)

# Update legend HTML with desaturated matching colors
old_legend_html = '''<div class="legend">
      <span><i style="background:#e2635a"></i> Vehículo</span>
      <span><i style="background:#b7babd"></i> Vía</span>
      <span><i style="background:#ffffff"></i> Edificio</span>
      <span><i style="background:#5c8f52"></i> Árbol</span>
      <span><i style="background:#97a5af"></i> Cuerpo de agua</span>
      <span><i style="background:#8a8f96"></i> Manzana</span>
      <span><i style="background:#adaa90"></i> Parque/zona verde</span>
      <span><i style="background:#b5714a"></i> Techo a dos aguas</span>
      <span><i style="background:#ffffff"></i> Techo plano/parapeto</span>
      <span><i style="background:#e5484d"></i> Ruido alto</span>
      <span><i style="background:#2e7d5b"></i> Ruido bajo</span>
    </div>'''

new_legend_html = '''<div class="legend" id="legendPanel">
      <div style="font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:var(--ink-dim); margin-bottom:4px;">Convenciones 3D</div>
      <span><i id="legVeh" style="background:#d66055"></i> Vehículo</span>
      <span><i id="legRoad" style="background:#889098"></i> Vía / Calzada</span>
      <span><i id="legBldgLow" style="background:#e8e4dc"></i> Edificio Residencial (Bajo)</span>
      <span><i id="legBldgMid" style="background:#d4aa6a"></i> Edificio Mixto (Medio)</span>
      <span><i id="legBldgCom" style="background:#d88a70"></i> Edificio Comercial</span>
      <span><i id="legBldgTall" style="background:#6a8cae"></i> Torre / Equipamiento</span>
      <span><i id="legTree" style="background:#68c498"></i> Árbol nativo</span>
      <span><i id="legWater" style="background:#5a9ca4"></i> Cuerpo de agua</span>
      <span><i id="legManzana" style="background:#a0a5ad"></i> Manzana urbana</span>
      <span><i id="legPark" style="background:#8ca882"></i> Parque / Zona verde</span>
    </div>'''

html = html.replace(old_legend_html, new_legend_html)

# Bump script version to v=102
html = html.replace('modulo-08-3d.js?v=73', 'modulo-08-3d.js?v=102')

with open('modulo-08-3d.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("SUCCESS: Updated modulo-08-3d.html!")

# =========================================================================
# 2. Update modulo-08-3d.js
# =========================================================================
with open('modulo-08-3d.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Update vehMat color to desaturated coral salmon #d66055
js = js.replace(
    'const vehMat = new THREE.MeshStandardMaterial({ color: 0xe2635a, roughness: 0.5, metalness: 0.15 });',
    'const vehMat = new THREE.MeshStandardMaterial({ color: 0xd66055, roughness: 0.5, metalness: 0.15 });'
)

# Update waterMat color to soft turquoise teal #5a9ca4
js = js.replace(
    'color: 0x97a5af, roughness: 0.18, metalness: 0.15,',
    'color: 0x5a9ca4, roughness: 0.18, metalness: 0.15,'
)

# Update parques color to soft moss green #8ca882
js = js.replace(
    'const mat = new THREE.MeshStandardMaterial({ map: pastoTex, color: 0xadaa90, roughness: 0.95, transparent: true, opacity: 0.85 });',
    'const mat = new THREE.MeshStandardMaterial({ map: pastoTex, color: 0x8ca882, roughness: 0.95, transparent: true, opacity: 0.85 });'
)

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

  function buildBuildings(buildings) {
    const positions = [];
    const normals = [];
    const colors = [];
    const edgePositions = [];
    buildingRanges = [];
    buildingStarts = [];

    // Paleta armónica desaturada (no chillona)
    const COLOR_PALETTE = {
      low: new THREE.Color("#e8e4dc"),   // Crema suave (<6m)
      mid: new THREE.Color("#d4aa6a"),   // Ocre suave (6m-12m)
      com: new THREE.Color("#d88a70"),   // Terracota cálida (12m-24m)
      tall: new THREE.Color("#6a8cae")   // Azul pizarra (>24m)
    };

    let vertexOffset = 0;

    buildings.forEach((b, idx) => {
      const pts = b.pts.map(p => toScene(p[0], p[1]));
      const h = b.h * SCALE;
      if (pts.length < 4) return;

      const startV = vertexOffset;
      let c = COLOR_PALETTE.low;
      let cat = "low";
      if (b.h > 24) { c = COLOR_PALETTE.tall; cat = "tall"; }
      else if (b.h > 12) { c = COLOR_PALETTE.com; cat = "com"; }
      else if (b.h > 6) { c = COLOR_PALETTE.mid; cat = "mid"; }

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
          colors.push(c.r, c.g, c.b); // ¡EL TECHO LLEVA EXACTAMENTE EL MISMO COLOR QUE LAS PAREDES!
        }
        bVertCount += 3;
      });

      vertexOffset += bVertCount;
      buildingRanges.push({
        index: idx,
        start: startV,
        count: bVertCount,
        colorHex: "#" + c.getHexString(),
        category: cat,
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
      roughness: 0.65,
      metalness: 0.04,
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

  function setBuildingColor(range, hexColor) {
    if (!currentBuildingMesh) return;
    const c = new THREE.Color(hexColor);
    const colorAttr = currentBuildingMesh.geometry.attributes.color;
    for (let i = range.start; i < range.start + range.count; i++) {
      colorAttr.setXYZ(i, c.r, c.g, c.b);
    }
    colorAttr.needsUpdate = true;
    range.colorHex = hexColor;
  }

  function setBuildingCategoryColor(category, hexColor) {
    buildingRanges.forEach(r => {
      if (r.category === category) {
        setBuildingColor(r, hexColor);
      }
    });
    const legMap = {
      low: "legBldgLow",
      mid: "legBldgMid",
      com: "legBldgCom",
      tall: "legBldgTall"
    };
    if (legMap[category]) {
      const el = document.getElementById(legMap[category]);
      if (el) el.style.background = hexColor;
    }
  }

  function showBuildingEditor(range) {
    selectedBuildingRange = range;
    const info = document.getElementById("buildingInfo");
    const title = document.getElementById("buildingInfoTitle");
    const details = document.getElementById("buildingInfoDetails");
    const customPicker = document.getElementById("buildingCustomColorPicker");
    if (!info) return;

    const catNames = { low: "Residencial (Bajo)", mid: "Mixto (Medio)", com: "Comercial", tall: "Torre / Equipamiento" };
    const catName = catNames[range.category] || "Edificio";
    if (title) title.textContent = `Edificio #${range.index + 1}`;
    if (details) details.textContent = `Altura: ${range.hMeters.toFixed(1)} m · Tipo: ${catName}`;
    if (customPicker) customPicker.value = range.colorHex;
    
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
  let activeSelectedColor = "#d88a70";

  colorSwatches.forEach(btn => {
    btn.addEventListener("click", () => {
      activeSelectedColor = btn.dataset.color;
      const customPicker = document.getElementById("buildingCustomColorPicker");
      if (customPicker) customPicker.value = activeSelectedColor;
      if (selectedBuildingRange) {
        setBuildingColor(selectedBuildingRange, activeSelectedColor);
      }
    });
  });

  const customPicker = document.getElementById("buildingCustomColorPicker");
  if (customPicker) {
    customPicker.addEventListener("input", (e) => {
      activeSelectedColor = e.target.value;
      if (selectedBuildingRange) {
        setBuildingColor(selectedBuildingRange, activeSelectedColor);
      }
    });
  }

  const applySingleBtn = document.getElementById("applyBuildingColorSingleBtn");
  if (applySingleBtn) {
    applySingleBtn.addEventListener("click", () => {
      if (selectedBuildingRange) {
        setBuildingColor(selectedBuildingRange, activeSelectedColor);
      }
    });
  }

  const applyTypeBtn = document.getElementById("applyBuildingColorTypeBtn");
  if (applyTypeBtn) {
    applyTypeBtn.addEventListener("click", () => {
      if (selectedBuildingRange) {
        setBuildingCategoryColor(selectedBuildingRange.category, activeSelectedColor);
      }
    });
  }

  resize();
  requestAnimationFrame(animate);'''

js = js.replace('resize();\n  requestAnimationFrame(animate);', bldg_ui_listeners)

with open('modulo-08-3d.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("SUCCESS: Updated modulo-08-3d.js cleanly!")
