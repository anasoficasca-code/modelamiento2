import io, re

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

pattern = r'<div style="font-weight:700; text-transform:uppercase; letter-spacing:\.05em; font-size:9\.5px; color:#64748b; margin-bottom:6px;">Tamaño y posición</div>.*?<div style="font-size:10px; color:#64748b; margin-bottom:6px;">Arrastra la simulación para moverla por la pantalla\.</div>'

replacement = '''<div style="font-weight:700; text-transform:uppercase; letter-spacing:.05em; font-size:9.5px; color:#64748b; margin-bottom:6px;">Posición de Axonometría</div>
        <div style="display:grid; grid-template-columns:30px 30px 30px; gap:4px; justify-content:center; margin-bottom:8px;">
          <div></div>
          <button type="button" id="panUp" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; cursor:pointer;">↑</button>
          <div></div>
          <button type="button" id="panLeft" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; cursor:pointer;">←</button>
          <button type="button" id="panDown" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; cursor:pointer;">↓</button>
          <button type="button" id="panRight" style="width:30px; height:30px; border-radius:6px; border:1px solid rgba(0,0,0,.15); background:#fff; font-size:16px; cursor:pointer;">→</button>
        </div>'''

html = re.sub(pattern, replacement, html, flags=re.DOTALL)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
