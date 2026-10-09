import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

# 1. Update defaults
cjs = re.sub(r'let escalaScale = [\d.]+, escalaOffX = -?\d+, escalaOffY = -?\d+;', 'let escalaScale = 1.20, escalaOffX = -160, escalaOffY = -40;', cjs)

# 2. Update applyEscalaTransform to apply to ALL layers (remove the display none check)
target = '''    ["naturalExplodeOverlay", "culturalExplodeOverlay", "techExplodeOverlay"].forEach(id => {
      const el = document.getElementById(id);
      if (!el || el.style.display === "none") return;
      el.style.transform = `translate(${escalaOffX}px, ${escalaOffY}px) scale(${escalaScale})`;
      el.style.transformOrigin = "center center";
    });'''

repl = '''    ["naturalExplodeOverlay", "culturalExplodeOverlay", "techExplodeOverlay"].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.transform = `translate(${escalaOffX}px, ${escalaOffY}px) scale(${escalaScale})`;
      el.style.transformOrigin = "center center";
    });'''

cjs = cjs.replace(target, repl)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
