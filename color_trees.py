import io, re

with io.open('modulo-08-3d.js', 'r', encoding='utf-8') as f:
    js = f.read()

target = '''    treeInstanceData = new Array(trees.length);
    trees.forEach((t, i) => {
      const [x, y, hMeters, , code] = t;
      const p = toScene(x, y);
      const h = Math.max(0.3, hMeters * SCALE);
      const w = h * (1.1 + (hash2(code) % 20) / 100 - 0.1);
      treeInstanceData[i] = { x: p.x, z: p.z, w, h };
    });
    scene.add(mesh);'''

replace = '''    treeInstanceData = new Array(trees.length);
    const colorAlimento1 = new THREE.Color(0xff5fa8); // Cerezo
    const colorAlimento2 = new THREE.Color(0xb06bff); // Sauco
    const colorDescanso = new THREE.Color(0x25d0a0);  // Urapan
    const colorNormal = new THREE.Color(0xffffff);
    
    trees.forEach((t, i) => {
      const [x, y, hMeters, especieStr, code] = t;
      const p = toScene(x, y);
      const h = Math.max(0.3, hMeters * SCALE);
      const w = h * (1.1 + (hash2(code) % 20) / 100 - 0.1);
      treeInstanceData[i] = { x: p.x, z: p.z, w, h };
      
      let c = colorNormal;
      if (especieStr === "Sauco") c = colorAlimento2;
      else if (especieStr === "Cerezo, capuli") c = colorAlimento1;
      else if (especieStr === "Urapán, Fresno") c = colorDescanso;
      
      mesh.setColorAt(i, c);
    });
    mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);'''

# Note: BIRD_TREE_SPECIES keys in the code might be exact or not. The code above uses the species string which is t[3].
# In the file it says:
# const meta = BIRD_TREE_SPECIES[t[3]];
# So t[3] IS the exact string "Sauco", "Cerezo, capuli", etc.

js = js.replace(target, replace)

with io.open('modulo-08-3d.js', 'w', encoding='utf-8') as f:
    f.write(js)
