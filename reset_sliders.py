import io
import re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Restore ALL sliders to 0 - 100 so the main view is uncut
c = re.sub(r'<input type="range" id="secXMin" [^>]*>', r'<input type="range" id="secXMin" min="0" max="100" value="0" step="1">', c)
c = re.sub(r'<span id="secXMinVal">[^<]*</span>', r'<span id="secXMinVal">0%</span>', c)
c = re.sub(r'<input type="range" id="secXMax" [^>]*>', r'<input type="range" id="secXMax" min="0" max="100" value="100" step="1">', c)
c = re.sub(r'<span id="secXMaxVal">[^<]*</span>', r'<span id="secXMaxVal">100%</span>', c)

c = re.sub(r'<input type="range" id="secYMin" [^>]*>', r'<input type="range" id="secYMin" min="0" max="100" value="0" step="1">', c)
c = re.sub(r'<span id="secYMinVal">[^<]*</span>', r'<span id="secYMinVal">0%</span>', c)
c = re.sub(r'<input type="range" id="secYMax" [^>]*>', r'<input type="range" id="secYMax" min="0" max="100" value="100" step="1">', c)
c = re.sub(r'<span id="secYMaxVal">[^<]*</span>', r'<span id="secYMaxVal">100%</span>', c)

c = re.sub(r'<input type="range" id="secZMin" [^>]*>', r'<input type="range" id="secZMin" min="0" max="100" value="0" step="1">', c)
c = re.sub(r'<span id="secZMinVal">[^<]*</span>', r'<span id="secZMinVal">0%</span>', c)
c = re.sub(r'<input type="range" id="secZMax" [^>]*>', r'<input type="range" id="secZMax" min="0" max="100" value="100" step="1">', c)
c = re.sub(r'<span id="secZMaxVal">[^<]*</span>', r'<span id="secZMaxVal">100%</span>', c)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(c)
