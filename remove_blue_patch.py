import io

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix 1: buildWaterBodies (3D)
target1 = '''bodies.forEach(w => {
      const pts = w.pts.map(p => toScene(p[0], p[1]));'''
replacement1 = '''bodies.forEach(w => {
      if (!(w.nombre || "").includes("Burro")) return; // USER REQUEST: Remove dark blue patches (other water bodies)
      const pts = w.pts.map(p => toScene(p[0], p[1]));'''
c = c.replace(target1, replacement1)

# Fix 2: renderNaturalWaterLayer (2D Canvas)
target2 = '''    // 2. Cuerpos de agua (Humedal y afluentes) - Azul pizarra / mineral realista con reflejos tenues
    rawWaterData.forEach(body => {
      const isBurro = body === burro;
      let pts = body.pts;'''
replacement2 = '''    // 2. Cuerpos de agua (Humedal y afluentes) - Azul pizarra / mineral realista con reflejos tenues
    rawWaterData.forEach(body => {
      const isBurro = body === burro;
      if (!isBurro) return; // USER REQUEST: Remove dark blue patches that aren't the humedal
      let pts = body.pts;'''
c = c.replace(target2, replacement2)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(c)
