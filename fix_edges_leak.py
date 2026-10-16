import io

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

# Replace the start of buildBuildings
target_start = '''function buildBuildings(buildings, boxFilter) {
    const positions = [];'''

replacement_start = '''let currentBuildingEdgeGroup = null;
  function buildBuildings(buildings, boxFilter) {
    if (currentBuildingMesh) { scene.remove(currentBuildingMesh); currentBuildingMesh.geometry.dispose(); }
    if (currentBuildingEdgeGroup) { 
        scene.remove(currentBuildingEdgeGroup); 
        currentBuildingEdgeGroup.children.forEach(c => { c.geometry.dispose(); c.material.dispose(); });
    }
    currentBuildingEdgeGroup = new THREE.Group();
    scene.add(currentBuildingEdgeGroup);
    
    const positions = [];'''

cjs = cjs.replace(target_start, replacement_start)

# Replace the edge adding
target_edge = '''buildingEdgeMat = edgeMat;
      scene.add(new THREE.LineSegments(edgeGeo, edgeMat));'''

replacement_edge = '''buildingEdgeMat = edgeMat;
      currentBuildingEdgeGroup.add(new THREE.LineSegments(edgeGeo, edgeMat));'''

cjs = cjs.replace(target_edge, replacement_edge)

# Replace the mesh adding
target_mesh = '''const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.6, metalness: 0.03, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2, // evita z-fighting con las lineas de borde (que quedan exactamente sobre
    });
    buildingMat = mat;
    scene.add(new THREE.Mesh(geo, mat));
  }'''

replacement_mesh = '''const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.6, metalness: 0.03, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2
    });
    buildingMat = mat;
    currentBuildingMesh = new THREE.Mesh(geo, mat);
    scene.add(currentBuildingMesh);
  }'''
cjs = cjs.replace(target_mesh, replacement_mesh)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
