import io, re

with io.open('red-residuos-organicos.html', 'r', encoding='utf-8') as f:
    html = f.read()

saved_old = r'const SAVED_MACRO_POSITIONS = \{.*?\};'
saved_new = '''const SAVED_MACRO_POSITIONS = {
  "n1": { x: 1149.6, y: 475.8, r: 87.1, t: "P7 \u00b7 Sobrecarga de la malla vial" },
  "n2": { x: 203.8, y: 491.2, r: 81.5, t: "P3 \u00b7 Eutrofizaci\u00f3n h\u00eddrica" },
  "n3": { x: 808.0, y: 532.6, r: 123.8, t: "P1 \u00b7 Concentraci\u00f3n del mercado mayorista" },
  "n4": { x: 467.6, y: 475.2, r: 92.7, t: "P4 \u00b7 Densificaci\u00f3n residencial en altura" },
  "n5": { x: 858.4, y: 174.2, r: 98.3, t: "P6 \u00b7 Interferencia en el espacio p\u00fablico" },
  "n6": { x: 386.4, y: 199.8, r: 75.9, t: "P2 \u00b7 Degradaci\u00f3n de suelos" },
  "n7": { x: 607.2, y: 323.8, r: 98.3, t: "P5 \u00b7 Inoperancia del ordenamiento" },
};'''

html = re.sub(saved_old, saved_new, html, flags=re.DOTALL)

with io.open('red-residuos-organicos.html', 'w', encoding='utf-8') as f:
    f.write(html)
