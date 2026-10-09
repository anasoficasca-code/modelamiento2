import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

panels = re.findall(r'id=\"((?:nat|cult|tech)[A-Za-z0-9]+Panel)\"', html)
print(panels)
