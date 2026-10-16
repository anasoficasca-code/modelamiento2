import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

target = '''    if (l) l.style.display = "none";
  }'''
replace = '''    if (l) l.style.display = "none";
    const lp = document.getElementById("legendPanel");
    if (lp) lp.style.display = "none";
  }'''
js = js.replace(target, replace)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
