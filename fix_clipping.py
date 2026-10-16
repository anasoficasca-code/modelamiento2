import io
import re

# 1. Restore the HTML sliders to the user's EXACT requested cut values
with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    c = f.read()

c = re.sub(r'<input type="range" id="secRot"[^>]*>', r'<input type="range" id="secRot" min="0" max="179" value="58" step="1">', c)
c = re.sub(r'<span id="secRotVal">[^<]*</span>', r'<span id="secRotVal">58°</span>', c)

c = re.sub(r'<input type="range" id="secXMin"[^>]*>', r'<input type="range" id="secXMin" min="0" max="100" value="0" step="1">', c)
c = re.sub(r'<span id="secXMinVal">[^<]*</span>', r'<span id="secXMinVal">0%</span>', c)
c = re.sub(r'<input type="range" id="secXMax"[^>]*>', r'<input type="range" id="secXMax" min="0" max="100" value="90" step="1">', c)
c = re.sub(r'<span id="secXMaxVal">[^<]*</span>', r'<span id="secXMaxVal">90%</span>', c)

c = re.sub(r'<input type="range" id="secYMin"[^>]*>', r'<input type="range" id="secYMin" min="0" max="100" value="0" step="1">', c)
c = re.sub(r'<span id="secYMinVal">[^<]*</span>', r'<span id="secYMinVal">0%</span>', c)
c = re.sub(r'<input type="range" id="secYMax"[^>]*>', r'<input type="range" id="secYMax" min="0" max="100" value="100" step="1">', c)
c = re.sub(r'<span id="secYMaxVal">[^<]*</span>', r'<span id="secYMaxVal">100%</span>', c)

c = re.sub(r'<input type="range" id="secZMin"[^>]*>', r'<input type="range" id="secZMin" min="0" max="100" value="0" step="1">', c)
c = re.sub(r'<span id="secZMinVal">[^<]*</span>', r'<span id="secZMinVal">0%</span>', c)
c = re.sub(r'<input type="range" id="secZMax"[^>]*>', r'<input type="range" id="secZMax" min="0" max="100" value="29" step="1">', c)
c = re.sub(r'<span id="secZMaxVal">[^<]*</span>', r'<span id="secZMaxVal">29%</span>', c)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(c)

# 2. Fix JS so the main view is uncut, but the bottom view IS cut
with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

# Disable clipping on the main renderer
cjs = cjs.replace('renderer.localClippingEnabled = true;', 'renderer.localClippingEnabled = false;')

# Make sure sectionBoxActive is true so the bottom view gets clipped!
cjs = cjs.replace('let sectionBoxActive = false;', 'let sectionBoxActive = true;')

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
