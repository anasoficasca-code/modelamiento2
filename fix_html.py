import io
import re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('id="naturalExplodeOverlay" style="position:absolute; inset:0;', 'id="naturalExplodeOverlay" style="position:absolute; left:0; top:0; right:0; bottom:20%;')
c = c.replace('id="culturalExplodeOverlay" style="position:absolute; inset:0;', 'id="culturalExplodeOverlay" style="position:absolute; left:0; top:0; right:0; bottom:20%;')
c = c.replace('id="techExplodeOverlay" style="position:absolute; inset:0;', 'id="techExplodeOverlay" style="position:absolute; left:0; top:0; right:0; bottom:20%;')

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(c)
