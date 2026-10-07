import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

# 1. Thinner building corner walls
cjs = cjs.replace('CORNER_THICK = 0.035;', 'CORNER_THICK = 0.015;')

# 2. Add renderOrder to meshes
# Roads
cjs = cjs.replace('roadMesh.receiveShadow = true;', 'roadMesh.receiveShadow = true;\n    roadMesh.renderOrder = 3;')
cjs = cjs.replace('const lines = new THREE.LineSegments(geo, mat);\n    sceneRoot.add(lines);', 'const lines = new THREE.LineSegments(geo, mat);\n    lines.renderOrder = 3;\n    sceneRoot.add(lines);')

# Parques
cjs = cjs.replace('mesh.receiveShadow = true;\n    sceneRoot.add(mesh);', 'mesh.receiveShadow = true;\n    mesh.renderOrder = 1;\n    sceneRoot.add(mesh);')

# Water
cjs = cjs.replace('waterMesh.receiveShadow = false; // sin sombras encima (se veian como parches/bloques feos sobre el agua)\n    sceneRoot.add(waterMesh);', 'waterMesh.receiveShadow = false;\n    waterMesh.renderOrder = 2;\n    sceneRoot.add(waterMesh);')

# Buildings
cjs = cjs.replace('mesh.receiveShadow = true;\n    sceneRoot.add(mesh);', 'mesh.receiveShadow = true;\n    mesh.renderOrder = 4;\n    sceneRoot.add(mesh);')
cjs = cjs.replace('const edgeMesh = new THREE.LineSegments(edgeGeo, edgeMat);\n    sceneRoot.add(edgeMesh);', 'const edgeMesh = new THREE.LineSegments(edgeGeo, edgeMat);\n    edgeMesh.renderOrder = 5;\n    sceneRoot.add(edgeMesh);')
cjs = cjs.replace('const cornerMesh = new THREE.Mesh(cornerGeo, cornerMat);\n    sceneRoot.add(cornerMesh);', 'const cornerMesh = new THREE.Mesh(cornerGeo, cornerMat);\n    cornerMesh.renderOrder = 5;\n    sceneRoot.add(cornerMesh);')

# Wait, `depthTest` / `depthWrite`?
# If we force renderOrder with transparency, it will draw roads over water, BUT if roads are actually below water in Y, depth testing might STILL cull the road pixels!
# Fortunately, I checked and Roads are at Y=0.03 to 0.08, while Water is at Y=0.022. So Roads ARE physically higher! Depth testing will NOT cull them. renderOrder just fixes the alpha blending sort!

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
