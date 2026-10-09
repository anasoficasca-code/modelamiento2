import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

tags = re.findall(r'class=\"(?:nat|cult|tech)-layer-tag\".*?</div>', html, re.DOTALL)
for t in tags:
    print(t)
    print('---')
