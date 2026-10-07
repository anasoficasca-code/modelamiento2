import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

# Change localClippingEnabled = true to false for sectionRenderer
cjs = cjs.replace('sectionRenderer.localClippingEnabled = true;', 'sectionRenderer.localClippingEnabled = false;')

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
