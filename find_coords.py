import io

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re
m = re.search(r'<div[^>]*id="layoutCoordsOut[^>]*>.*?</div>', html, re.DOTALL)
if m:
    print(m.group(0))
else:
    print("Not found layoutCoordsOut")

m2 = re.search(r'<input[^>]*id="layoutCoordsOutput[^>]*>', html, re.DOTALL)
if m2:
    print(m2.group(0))
