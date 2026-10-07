import io
import re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Update rotation slider
c = re.sub(r'<input type="range" id="secRot" [^>]*value="[^"]*"', r'<input type="range" id="secRot" min="0" max="179" value="58"', c)
c = re.sub(r'<span id="secRotVal">[^<]*</span>', r'<span id="secRotVal">58°</span>', c)

# Update X sliders (which act as U)
c = re.sub(r'<input type="range" id="secXMin" [^>]*value="[^"]*"', r'<input type="range" id="secXMin" min="0" max="100" value="0"', c)
c = re.sub(r'<span id="secXMinVal">[^<]*</span>', r'<span id="secXMinVal">0%</span>', c)
c = re.sub(r'<input type="range" id="secXMax" [^>]*value="[^"]*"', r'<input type="range" id="secXMax" min="0" max="100" value="90"', c)
c = re.sub(r'<span id="secXMaxVal">[^<]*</span>', r'<span id="secXMaxVal">90%</span>', c)

# Update Y sliders
c = re.sub(r'<input type="range" id="secYMin" [^>]*value="[^"]*"', r'<input type="range" id="secYMin" min="0" max="100" value="0"', c)
c = re.sub(r'<span id="secYMinVal">[^<]*</span>', r'<span id="secYMinVal">0%</span>', c)
c = re.sub(r'<input type="range" id="secYMax" [^>]*value="[^"]*"', r'<input type="range" id="secYMax" min="0" max="100" value="100"', c)
c = re.sub(r'<span id="secYMaxVal">[^<]*</span>', r'<span id="secYMaxVal">100%</span>', c)

# Update Z sliders (which act as V)
c = re.sub(r'<input type="range" id="secZMin" [^>]*value="[^"]*"', r'<input type="range" id="secZMin" min="0" max="100" value="0"', c)
c = re.sub(r'<span id="secZMinVal">[^<]*</span>', r'<span id="secZMinVal">0%</span>', c)
c = re.sub(r'<input type="range" id="secZMax" [^>]*value="[^"]*"', r'<input type="range" id="secZMax" min="0" max="100" value="29"', c)
c = re.sub(r'<span id="secZMaxVal">[^<]*</span>', r'<span id="secZMaxVal">29%</span>', c)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(c)
