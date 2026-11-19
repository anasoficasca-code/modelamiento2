import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Fix openNaturalExplode
target_nat = 'function openNaturalExplode() {'
replace_nat = '''function openNaturalExplode() {
    const lp = document.getElementById("legendPanel");
    if (lp) lp.style.display = "block";
    const cp = document.getElementById("natClimatePanel");
    if (cp) cp.style.display = "block";
    const c1 = document.getElementById("cultCapa1Panel");
    if (c1) c1.style.display = "none";
    const t4 = document.getElementById("techCapa4Panel");
    if (t4) t4.style.display = "none";'''
js = js.replace(target_nat, replace_nat)

# Fix openCulturalExplode
target_cul = 'function openCulturalExplode() {'
replace_cul = '''function openCulturalExplode() {
    const lp = document.getElementById("legendPanel");
    if (lp) lp.style.display = "block";
    const cp = document.getElementById("natClimatePanel");
    if (cp) cp.style.display = "none";
    const c1 = document.getElementById("cultCapa1Panel");
    if (c1) c1.style.display = "block";
    const t4 = document.getElementById("techCapa4Panel");
    if (t4) t4.style.display = "none";'''
js = js.replace(target_cul, replace_cul)

# Fix openTechExplode
target_tech = 'function openTechExplode() {'
replace_tech = '''function openTechExplode() {
    const lp = document.getElementById("legendPanel");
    if (lp) lp.style.display = "block";
    const cp = document.getElementById("natClimatePanel");
    if (cp) cp.style.display = "none";
    const c1 = document.getElementById("cultCapa1Panel");
    if (c1) c1.style.display = "none";
    const t4 = document.getElementById("techCapa4Panel");
    if (t4) t4.style.display = "block";'''
js = js.replace(target_tech, replace_tech)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
