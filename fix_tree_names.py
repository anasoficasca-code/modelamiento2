import io, re

with io.open('modulo-08-3d.js', 'r', encoding='utf-8') as f:
    js = f.read()

target = r'if \(especieStr === "Sauco"\) c = colorAlimento2;\s*else if \(especieStr === "Cerezo, capuli"\) c = colorAlimento1;\s*else if \(especieStr === "Urapán, Fresno"\) c = colorDescanso;'

replace = '''if (especieStr.includes("Sauco")) c = colorAlimento2;
      else if (especieStr.includes("capuli")) c = colorAlimento1;
      else if (especieStr.includes("Fresno") || especieStr.includes("Urap")) c = colorDescanso;'''

js = re.sub(target, replace, js)

with io.open('modulo-08-3d.js', 'w', encoding='utf-8') as f:
    f.write(js)
