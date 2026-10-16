import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Remove the static items
items_target = '''<div style="display:flex; flex-direction:column; gap:10px; font-size:11.5px; color:#1e293b;">
        <div style="display:flex; align-items:center; gap:8px;"><i style="width:12px; height:12px; border-radius:3px; background:#7a838d; flex:none;"></i> Vías y malla vial</div>
        <div style="display:flex; align-items:center; gap:8px;"><i style="width:12px; height:12px; border-radius:3px; background:#c7cdd3; flex:none;"></i> Edificios y manzanas</div>
        <div style="display:flex; align-items:center; gap:8px;"><i style="width:12px; height:12px; border-radius:50%; background:#e2635a; flex:none;"></i> Vehículos en movimiento</div>
        <div style="display:flex; align-items:center; gap:8px;"><i style="width:12px; height:12px; border-radius:3px; background:#0369a1; flex:none;"></i> Cuerpos de agua / humedal</div>
        <div style="display:flex; align-items:center; gap:8px;"><i style="width:12px; height:12px; border-radius:3px; background:#6b9e78; flex:none;"></i> Cobertura vegetal</div>
        <div style="display:flex; align-items:center; gap:8px;"><i style="width:12px; height:12px; border-radius:50%; background:#f59e0b; flex:none;"></i> Mapa de ruido (si está activo)</div>
      </div>
      <div style="margin-top:22px; padding-top:14px; border-top:1px dashed rgba(0,0,0,.1); font-size:10.5px; color:#64748b; line-height:1.5;">
        Arriba: axonometría en vivo del territorio.<br>Abajo: el mismo territorio, cortado a la altura del humedal.
      </div>'''
html = html.replace(items_target, '')

# 2. Remove escalaZoomPanel
zoom_start = html.find('<div id="escalaZoomPanel"')
if zoom_start != -1:
    zoom_end = html.find('</div>', html.find('id="escalaCoordsCopy"')) + 6
    html = html[:zoom_start] + html[zoom_end:]

# 3. Extract cultCapa1..4, and remove from original locations
panels = ['cultCapa1Panel', 'cultCapa2Panel', 'cultCapa3Panel', 'cultCapa4Panel']
extracted = []

for pid in panels:
    p_start = html.find(f'<div id="{pid}"')
    if p_start == -1: continue
    
    open_tags = 0
    p_end = -1
    for i in range(p_start, len(html)):
        if html.startswith('<div', i):
            open_tags += 1
        elif html.startswith('</div', i):
            open_tags -= 1
            if open_tags == 0:
                p_end = i + 6
                break
                
    if p_end != -1:
        p_html = html[p_start:p_end]
        html = html[:p_start] + html[p_end:]
        
        # fix styles
        p_html = re.sub(r'position:absolute;[^"]*?(?:display:none;?)', 'display:none; font-family:\'Segoe UI\',sans-serif; margin-top:16px;', p_html)
        p_html = re.sub(r'width:\d+px;', 'width:100%;', p_html)
        if 'position:absolute' in p_html:
            p_html = re.sub(r'style="[^"]*position:absolute[^"]*"', 'style="display:none; font-family:\'Segoe UI\',sans-serif; margin-top:16px;"', p_html)
            
        extracted.append(p_html)

# 4. Insert extracted into legendPanel
legend_start = html.find('id="legendPanel"')
if legend_start != -1:
    # Find the closing </aside> for legendPanel specifically
    # legendPanel has <divs> inside, but only one </aside> closes it.
    aside_end = html.find('</aside>', legend_start)
    if aside_end != -1:
        panels_str = '\n'.join(extracted)
        html = html[:aside_end] + panels_str + '\n    ' + html[aside_end:]

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
