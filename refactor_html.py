import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Clean the #legendPanel
legend_start = html.find('<div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.06em; color:#64748b; margin-bottom:12px;">Convenciones</div>')
legend_end = html.find('</aside>')

legend_content = html[legend_start:legend_end]

# Remove the static items
items_start = legend_content.find('<div style="display:flex; flex-direction:column; gap:10px;')
items_end = legend_content.find('</div>', legend_content.find('Mapa de ruido (si est activo)')) + 13
if items_start != -1 and items_end != -1:
    legend_content = legend_content[:items_start] + legend_content[items_end:]

# Remove escalaZoomPanel
zoom_start = legend_content.find('<!-- Zoom y posicion de la axonometria/escala')
zoom_end = legend_content.find('</div>\n\n      <!-- Cota de Inundacin Anual') + 6
if zoom_start == -1: # fallback
    zoom_start = legend_content.find('<div id="escalaZoomPanel"')
    zoom_end = legend_content.find('</div>', legend_content.find('id="escalaCoordsCopy"')) + 6

if zoom_start != -1 and zoom_end != -1:
    legend_content = legend_content[:zoom_start] + legend_content[zoom_end:]

html = html[:legend_start] + legend_content + html[legend_end:]

# 2. Extract panels and remove their absolute positioning, then inject them into legendPanel!
panel_ids = ['natClimatePanel', 'cultCapa1Panel', 'cultCapa2Panel', 'cultCapa3Panel', 'cultCapa4Panel', 'techCapa1Panel', 'techCapa2Panel', 'techCapa3Panel', 'techCapa4Panel']
extracted_panels = []

for pid in panel_ids:
    # We will use regex to find the div and its closing div
    # But nested divs make regex hard.
    # We can do it by simple character matching for open/close tags.
    start_idx = html.find(f'<div id="{pid}"')
    if start_idx == -1:
        continue
    
    # find end of the div
    open_tags = 0
    end_idx = -1
    for i in range(start_idx, len(html)):
        if html.startswith('<div', i):
            open_tags += 1
        elif html.startswith('</div', i):
            open_tags -= 1
            if open_tags == 0:
                end_idx = i + 6
                break
    
    if end_idx != -1:
        panel_str = html[start_idx:end_idx]
        # Remove it from html
        html = html[:start_idx] + html[end_idx:]
        
        # Remove position:absolute; bottom:...; left:...; z-index:...; box-shadow:...; background:...; border-radius:...; width:340px; 
        # Actually it's easier to just replace style completely or remove specific parts.
        panel_str = re.sub(r'position:absolute;[^"]*?(?:display:none;?)', 'display:none; font-family:\'Segoe UI\',sans-serif; margin-top:16px;', panel_str)
        panel_str = re.sub(r'width:\d+px;', 'width:100%;', panel_str)
        # just replace everything between style=" and " that has absolute with display:none
        if 'position:absolute' in panel_str:
            panel_str = re.sub(r'style="[^"]*position:absolute[^"]*"', 'style="display:none; font-family:\'Segoe UI\',sans-serif; margin-top:16px;"', panel_str)
            
        extracted_panels.append(panel_str)

# Inject panels into legendPanel
legend_end = html.find('</aside>')
panels_str = '\n'.join(extracted_panels)
html = html[:legend_end] + panels_str + '\n    ' + html[legend_end:]

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
