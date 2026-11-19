import io, re

with io.open('red-residuos-organicos.html', 'r', encoding='utf-8') as f:
    html = f.read()

saved_old = r'const SAVED_MACRO_POSITIONS = \{.*?\};'
saved_new = '''const SAVED_MACRO_POSITIONS = {
  "c1": { x: 250, y: 50, r: 68.0, t: "C1" },
  "k1": { x: 350, y: 400, r: 72.0, t: "K1" },
  "k1_2": { x: 480, y: 100, r: 64.0, t: "K1.2" },
  "c2": { x: 950, y: 50, r: 60.0, t: "C2" },
  "s1": { x: 750, y: 80, r: 72.0, t: "S1" },
  "k12": { x: 50, y: 50, r: 60.0, t: "K12" },
  "s2": { x: 100, y: 350, r: 68.0, t: "S2" },
  "s3": { x: 180, y: 600, r: 60.0, t: "S3" },
  "k6": { x: 550, y: 580, r: 60.0, t: "K6" },
  "s10": { x: 750, y: 620, r: 64.0, t: "S10" },
  "s4": { x: 850, y: 450, r: 68.0, t: "S4" },
  "s9": { x: 1100, y: 200, r: 72.0, t: "S9" },
  "s5": { x: 1250, y: 950, r: 64.0, t: "S5" },
  "c5": { x: 150, y: 800, r: 60.0, t: "C5" },
  "s6": { x: 450, y: 950, r: 68.0, t: "S6" },
  "s7": { x: 550, y: 700, r: 68.0, t: "S7" },
  "s_ox": { x: 850, y: 850, r: 64.0, t: "S_ox" },
  "c7": { x: 1000, y: 680, r: 64.0, t: "C7" },
};'''

html = re.sub(saved_old, saved_new, html, flags=re.DOTALL)

with io.open('red-residuos-organicos.html', 'w', encoding='utf-8') as f:
    f.write(html)
