import io, re

with io.open('red-residuos-organicos.html', 'r', encoding='utf-8') as f:
    html = f.read()

saved_old = r'const SAVED_MACRO_POSITIONS = \{.*?\};'
saved_new = '''const SAVED_MACRO_POSITIONS = {
  "c1": { x: 340.0, y: 300.0, r: 68.0, t: "C1" },
  "k1": { x: 571.2, y: 138.2, r: 72.0, t: "K1" },
  "k1_2": { x: 780.0, y: 300.0, r: 64.0, t: "K1.2" },
  "c2": { x: 740.0, y: 147.4, r: 60.0, t: "C2" },
  "s1": { x: 1000.0, y: 260.0, r: 72.0, t: "S1" },
  "k12": { x: 147.4, y: 300.0, r: 60.0, t: "K12" },
  "s2": { x: 1220.0, y: 340.0, r: 68.0, t: "S2" },
  "s3": { x: 1308.6, y: 340.0, r: 60.0, t: "S3" },
  "k6": { x: 960.0, y: 147.4, r: 60.0, t: "K6" },
  "s10": { x: 1220.0, y: 160.0, r: 64.0, t: "S10" },
  "s4": { x: 560.0, y: 500.0, r: 68.0, t: "S4" },
  "s9": { x: 780.0, y: 500.0, r: 72.0, t: "S9" },
  "s5": { x: 780.0, y: 547.6, r: 64.0, t: "S5" },
  "c5": { x: 560.0, y: 547.6, r: 60.0, t: "C5" },
  "s6": { x: 1000.0, y: 543.6, r: 68.0, t: "S6" },
  "s7": { x: 1220.0, y: 547.6, r: 68.0, t: "S7" },
  "s_ox": { x: 1308.6, y: 547.6, r: 64.0, t: "S_ox" },
  "c7": { x: 960.0, y: 440.0, r: 64.0, t: "C7" },
};'''

html = re.sub(saved_old, saved_new, html, flags=re.DOTALL)

with io.open('red-residuos-organicos.html', 'w', encoding='utf-8') as f:
    f.write(html)
