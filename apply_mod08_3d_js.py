import re

with open('modulo-08-3d.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update vehMat color to desaturated coral salmon #d66055
js = js.replace(
    'const vehMat = new THREE.MeshStandardMaterial({ color: 0xe2635a, roughness: 0.5, metalness: 0.15 });',
    'const vehMat = new THREE.MeshStandardMaterial({ color: 0xd66055, roughness: 0.5, metalness: 0.15 });'
)

# 2. Update waterMat color to soft turquoise teal #5a9ca4
js = js.replace(
    'color: 0x97a5af, roughness: 0.18, metalness: 0.15,',
    'color: 0x5a9ca4, roughness: 0.18, metalness: 0.15,'
)

# 3. Update parques color to soft moss green #8ca882
js = js.replace(
    'const mat = new THREE.MeshStandardMaterial({ map: pastoTex, color: 0xadaa90, roughness: 0.95, transparent: true, opacity: 0.85 });',
    'const mat = new THREE.MeshStandardMaterial({ map: pastoTex, color: 0x8ca882, roughness: 0.95, transparent: true, opacity: 0.85 });'
)

# 4. Remove roofs_flat.json overlay so roofs aren't covered in solid white
js = js.replace(
    'loadTriMesh("./assets/kennedy_roofs_flat.json", 0xffffff);    // techos planos con parapeto ya modelado',
    '// loadTriMesh("./assets/kennedy_roofs_flat.json", 0xffffff); // quitado para que los techos tengan el mismo color asignado que el edificio'
)

# 5. Replace buildBuildings function with vertex colors & range indexing
old_build_buildings = js[js.find('let buildingEdgeMat = null;'):js.find('function loadBuildings() {')]

new_build_buildings = '''let buildingEdgeMat = null; // referencia para ajustar su opacidad segun el zoom
  let currentBuildingMesh = null;
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

js = js.replace(old_build_buildings, new_build_buildings)

# 6. Update raycaster click listener to pick buildings when tree is not hit
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

# 7. Add Building UI event listeners setup at the bottom of JS initialization
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
'''

js += bldg_ui_listeners

with open('modulo-08-3d.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("SUCCESS: Updated modulo-08-3d.js!")
