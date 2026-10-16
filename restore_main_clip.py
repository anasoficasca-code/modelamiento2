import io
import re

# 1. Restore HTML sliders to the exact original fbdd045 values (58-67, 39-54, 0 rot)
with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    c = f.read()

c = re.sub(r'<input type="range" id="secRot"[^>]*>', r'<input type="range" id="secRot" min="0" max="179" value="0" step="1">', c)
c = re.sub(r'<span id="secRotVal">[^<]*</span>', r'<span id="secRotVal">0°</span>', c)

c = re.sub(r'<input type="range" id="secXMin"[^>]*>', r'<input type="range" id="secXMin" min="0" max="100" value="58" step="1">', c)
c = re.sub(r'<span id="secXMinVal">[^<]*</span>', r'<span id="secXMinVal">58%</span>', c)
c = re.sub(r'<input type="range" id="secXMax"[^>]*>', r'<input type="range" id="secXMax" min="0" max="100" value="67" step="1">', c)
c = re.sub(r'<span id="secXMaxVal">[^<]*</span>', r'<span id="secXMaxVal">67%</span>', c)

c = re.sub(r'<input type="range" id="secYMin"[^>]*>', r'<input type="range" id="secYMin" min="0" max="100" value="0" step="1">', c)
c = re.sub(r'<span id="secYMinVal">[^<]*</span>', r'<span id="secYMinVal">0%</span>', c)
c = re.sub(r'<input type="range" id="secYMax"[^>]*>', r'<input type="range" id="secYMax" min="0" max="100" value="100" step="1">', c)
c = re.sub(r'<span id="secYMaxVal">[^<]*</span>', r'<span id="secYMaxVal">100%</span>', c)

c = re.sub(r'<input type="range" id="secZMin"[^>]*>', r'<input type="range" id="secZMin" min="0" max="100" value="39" step="1">', c)
c = re.sub(r'<span id="secZMinVal">[^<]*</span>', r'<span id="secZMinVal">39%</span>', c)
c = re.sub(r'<input type="range" id="secZMax"[^>]*>', r'<input type="range" id="secZMax" min="0" max="100" value="54" step="1">', c)
c = re.sub(r'<span id="secZMaxVal">[^<]*</span>', r'<span id="secZMaxVal">54%</span>', c)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(c)


# 2. Re-enable global clipping for the main renderer in JS
with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

cjs = cjs.replace('renderer.localClippingEnabled = false;', 'renderer.localClippingEnabled = true;')
cjs = cjs.replace('// renderer.clippingPlanes = sectionClipPlanesArr;', 'renderer.clippingPlanes = sectionClipPlanesArr;')

# Also ensure sectionBoxActive is true just in case
cjs = cjs.replace('let sectionBoxActive = false;', 'let sectionBoxActive = true;')

# Ensure sectionRot.value doesn't get messed up by placeSectionCutAtHumedal!
# In placeSectionCutAtHumedal, I was setting sectionRot.value = 58!
# Which changed the HTML slider, which in turn rotated the MAIN scene!
# This is WHY the main scene changed! Oh my god!
rot_target = '''    if (sectionRot) {
      sectionRot.value = sectionRotAngle;
      if (sectionRotVal) sectionRotVal.textContent = sectionRotAngle + "°";
    }'''
cjs = cjs.replace(rot_target, '') # Delete it so it doesn't touch the HTML slider for the main scene!

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
