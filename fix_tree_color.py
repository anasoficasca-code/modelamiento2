import io, re

with io.open('modulo-08-3d.js', 'r', encoding='utf-8') as f:
    js = f.read()

target = r'const mesh = new THREE\.InstancedMesh\(planeGeo, mat, trees\.length\);\s*mesh\.castShadow = false;\s*treeMesh = mesh;'

replace = '''const mesh = new THREE.InstancedMesh(planeGeo, mat, trees.length);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(trees.length * 3), 3);
    mesh.castShadow = false;
    treeMesh = mesh;'''

js = re.sub(target, replace, js)

with io.open('modulo-08-3d.js', 'w', encoding='utf-8') as f:
    f.write(js)
