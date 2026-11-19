import io, re

with io.open('red-residuos-organicos.html', 'r', encoding='utf-8') as f:
    html = f.read()

old_code = r'''nodePos = best;

    // Fijacion final de limites'''

new_code = '''nodePos = best;
    
    // Bugfix: aseguremonos que TODO nodo tenga una posicion asignada (incluso si fallaron las fuerzas)
    const step = (Math.PI * 2) / Math.max(1, nodes.length);
    nodes.forEach((n, i) => {
      if (!nodePos[n.id] || isNaN(nodePos[n.id].x) || isNaN(nodePos[n.id].y)) {
        nodePos[n.id] = {
          x: cx + spread * Math.cos(i * step),
          y: cy + spread * Math.sin(i * step)
        };
      }
    });

    // Fijacion final de limites'''

html = re.sub(old_code, new_code, html, flags=re.DOTALL)

with io.open('red-residuos-organicos.html', 'w', encoding='utf-8') as f:
    f.write(html)
