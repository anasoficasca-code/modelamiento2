import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# I will find the exact string indices.
idx1 = html.find('Tamaño y posición')
idx2 = html.find('escalaCoordsOutput')

if idx1 != -1 and idx2 != -1:
    # Find start of the div
    start = html.rfind('<div', 0, idx1)
    end = html.rfind('<textarea', 0, idx2)
    
    replacement = '''<div style="font-weight:700; text-transform:uppercase; letter-spacing:.05em; font-size:9.5px; color:#64748b; margin-bottom:6px;">Posición de Axonometría</div>
        <div style="display:grid; grid-template-columns:30px 30px 30px; gap:4px; justify-content:center; margin-bottom:8px;">
          <div></div>
          <button type="button" id="panUp" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; cursor:pointer;">&#8593;</button>
          <div></div>
          <button type="button" id="panLeft" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; cursor:pointer;">&#8592;</button>
          <button type="button" id="panDown" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; cursor:pointer;">&#8595;</button>
          <button type="button" id="panRight" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; cursor:pointer;">&#8594;</button>
        </div>
        '''
        
    html = html[:start] + replacement + html[end:]

    with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
        f.write(html)
