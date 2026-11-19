import io

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Restore overlays to fullscreen
c = c.replace('bottom:20%; z-index:320;', 'bottom:0; z-index:320;')

# Make sectionWrap sit on top (z-index 400) and span full width (left: 0 instead of left: 200px)
target_wrap = 'id="sectionWrap" style="display:none; position:absolute; left:200px; right:0; bottom:0; height:20%; min-height:120px; z-index:150;'
replacement_wrap = 'id="sectionWrap" style="display:none; position:absolute; left:0; right:0; bottom:0; height:20%; min-height:120px; z-index:400;'
c = c.replace(target_wrap, replacement_wrap)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(c)
