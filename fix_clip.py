import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# For natBaseImg
target_nat = '<div class="sublayer-diamond" style="width:100%; height:100%; cursor:pointer; position:relative; box-shadow:none; background:transparent;"><img id="natBaseImg"'
replace_nat = '<div class="sublayer-diamond" style="width:100%; height:100%; clip-path:polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); cursor:pointer; position:relative; box-shadow:none; background:transparent;"><img id="natBaseImg"'
html = html.replace(target_nat, replace_nat)

# For techBaseImg
target_tech = '<div class="sublayer-diamond" style="width:100%; height:100%; cursor:pointer; position:relative; box-shadow:none; background:transparent;"><img id="techBaseImg"'
replace_tech = '<div class="sublayer-diamond" style="width:100%; height:100%; clip-path:polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); cursor:pointer; position:relative; box-shadow:none; background:transparent;"><img id="techBaseImg"'
html = html.replace(target_tech, replace_tech)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
