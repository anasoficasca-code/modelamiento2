import io

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

target = '<div class="sublayer-diamond" style="width:100%; height:100%; clip-path:polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); cursor:pointer; position:relative; box-shadow:none; background:transparent;"><img id="cultBaseImg"'
repl = '<div class="sublayer-diamond" style="width:100%; height:100%; cursor:pointer; position:relative; box-shadow:none; background:transparent;"><img id="cultBaseImg"'

html = html.replace(target, repl)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
