import io, re

def fix_sample_attractor(filename):
    with io.open(filename, 'r', encoding='utf-8') as f:
        js = f.read()
    
    target = '''  function sampleAttractorTrees(trees) {
    const porEspecie = {};
    trees.forEach(t => {
      const meta = BIRD_TREE_SPECIES[t[3]]; // el codigo de especie va en el indice 3 (verificado con datos reales: 9250 coincidencias de 119886 arboles); mi "correccion" anterior a indice 4 (el codigo numerico de identificacion, no la especie) estaba mal
      if (meta) (porEspecie[meta.key] || (porEspecie[meta.key] = [])).push({ x: t[0], y: t[1], meta });
    });'''
    
    replace = '''  function sampleAttractorTrees(trees) {
    const porEspecie = {};
    trees.forEach(t => {
      let meta = null;
      if (t[3]) {
          const lower = t[3].toLowerCase();
          if (lower.includes("fresno") || lower.includes("urapan") || lower.includes("urap")) meta = BIRD_TREE_SPECIES["Urapán, Fresno"] || { key: "urapan", color: 0x25d0a0, weight: 0.52, base: 220 };
          else if (lower.includes("cerezo") || lower.includes("capul")) meta = BIRD_TREE_SPECIES["Cerezo, capuli"] || { key: "capuli", color: 0xff5fa8, weight: 0.76, base: 200 };
          else if (lower.includes("sauco") || lower.includes("saco") || lower.includes("saúco")) meta = BIRD_TREE_SPECIES["Sauco"] || { key: "sauco", color: 0xb06bff, weight: 1.0, base: 260 };
      }
      if (meta) (porEspecie[meta.key] || (porEspecie[meta.key] = [])).push({ x: t[0], y: t[1], meta });
    });'''
    
    # Also handle the encoded string in the BIRD_TREE_SPECIES object just in case
    
    js = js.replace(target, replace)
    
    with io.open(filename, 'w', encoding='utf-8') as f:
        f.write(js)

fix_sample_attractor('modulo-10-corte.js')
fix_sample_attractor('modulo-08-3d.js')
