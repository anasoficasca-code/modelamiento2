import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Update defaults to what she requested
html = re.sub(r'(id="botRot"[^>]*value=")\d+(")', r'\g<1>143\2', html)
html = re.sub(r'(id="botXMin"[^>]*value=")\d+(")', r'\g<1>26\2', html)
html = re.sub(r'(id="botXMax"[^>]*value=")\d+(")', r'\g<1>38\2', html)
html = re.sub(r'(id="botYMin"[^>]*value=")\d+(")', r'\g<1>0\2', html)
html = re.sub(r'(id="botYMax"[^>]*value=")\d+(")', r'\g<1>100\2', html)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
