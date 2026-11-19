import io

# 1. Update HTML: z-index of sectionWrap to 400 so it sits on top of the fullscreen overlays.
with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    c = f.read()

target_wrap = 'id="sectionWrap" style="display:none; position:absolute; left:200px; right:0; bottom:0; height:20%; min-height:120px; z-index:150;'
replacement_wrap = 'id="sectionWrap" style="display:none; position:absolute; left:0; right:0; bottom:0; height:20%; min-height:120px; z-index:400;'
c = c.replace(target_wrap, replacement_wrap)
# Notice I also changed left:200px to left:0 so it spans the full bottom! The user said "la barrita que dice corte V al burro".
# Wait, let's keep left:0.

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(c)

# 2. Update JS: Apply the requested camera to the bottom viewport ONLY. And turn off global clipping just to be safe.
with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

# Turn off local clipping for main renderer so it never gets chopped
cjs = cjs.replace('renderer.localClippingEnabled = true;', 'renderer.localClippingEnabled = false;')

# Hardcode the camera and cut plane for placeSectionCutAtHumedal
place_orig = '''function placeSectionCutAtHumedal() {
    if (!rawWaterData) return;
    const b = rawWaterData.find(w => (w.nombre || "").includes("Burro"));
    if (!b || !b.pts || !b.pts.length) return;
    const cx = b.pts.reduce((s, p) => s + p[0], 0) / b.pts.length;
    const cy = b.pts.reduce((s, p) => s + p[1], 0) / b.pts.length;
    const sp = toScene(cx, cy);
    sectionCutZ = sp.z; sectionCutX = sp.x;
    // El corte se orienta transversal (perpendicular) a la calle real mas
    // cercana al humedal -- se busca el segmento de via mas cercano y se
    // usa su misma direccion para poner el plano de corte, en vez de
    // cortar siempre de este a oeste sin relacion con el territorio real.
    let roadAngleReal = 0, bestDist = Infinity;
    if (rawEdgesData) {
      rawEdgesData.forEach(([kind, pts]) => {
        for (let i = 0; i < pts.length - 1; i++) {
          const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
          const sp1 = toScene(x1, y1), sp2 = toScene(x2, y2);
          const d = pointToSegmentDistSq(sp.x, sp.z, sp1.x, sp1.z, sp2.x, sp2.z);
          if (d < bestDist) {
            bestDist = d;
            roadAngleReal = Math.atan2(sp2.z - sp1.z, sp2.x - sp1.x);
          }
        }
      });
    }
    // perpendicular a la calle: +90 grados (PI/2)
    const ang = roadAngleReal + Math.PI / 2;
    sectionRotAngle = Math.round(ang * 180 / Math.PI) % 180;
    if (sectionRotAngle < 0) sectionRotAngle += 180;
    if (sectionRot) {
      sectionRot.value = sectionRotAngle;
      if (sectionRotVal) sectionRotVal.textContent = sectionRotAngle + "°";
    }

    const nx = Math.cos(sectionRotAngle * Math.PI / 180), nz = Math.sin(sectionRotAngle * Math.PI / 180);
    sectionCutPlane.normal.set(nx, 0, nz); // normal = misma direccion de la calle -> el corte queda transversal a ella
    sectionCutPlane.constant = -(nx * sp.x + nz * sp.z);
    if (sectionRenderer) {
      sectionRenderer.clippingPlanes = [sectionCutPlane];
      // la camara mira horizontalmente hacia el humedal, desde el lado
      // perpendicular a la calle, ligeramente por encima del nivel del
      // suelo, para que el corte se vea como un alzado
      const camY = 6, camDist = 420;
      sectionCamera.position.set(sp.x + nx * camDist, camY, sp.z + nz * camDist);
      sectionCamera.up.set(0, 1, 0);
      sectionCamera.lookAt(sp.x, camY, sp.z);
      resizeSectionView();
    }
  }'''

place_new = '''function placeSectionCutAtHumedal() {
    // User requested explicitly hardcoded coordinates and values for the section cut
    sectionCutX = 177.0;
    sectionCutZ = -25.6;
    sectionRotAngle = 58;

    const nx = Math.cos(sectionRotAngle * Math.PI / 180), nz = Math.sin(sectionRotAngle * Math.PI / 180);
    sectionCutPlane.normal.set(nx, 0, nz);
    sectionCutPlane.constant = -(nx * sectionCutX + nz * sectionCutZ);
    if (sectionRenderer) {
      sectionRenderer.clippingPlanes = [sectionCutPlane];
      sectionCamera.position.set(-610.7, 70.0, 693.2);
      sectionCamera.up.set(0, 1, 0);
      sectionCamera.lookAt(177.0, 5.5, -25.6);
      sectionCamera.zoom = 3.42;
      resizeSectionView();
      sectionCamera.zoom = 3.42;
      sectionCamera.updateProjectionMatrix();
    }
  }'''
cjs = cjs.replace(place_orig, place_new)

rot_orig = '''function updateSectionCutRotation() {
    if (!sectionRenderer || !sectionCutZ) return;
    const rad = sectionRotAngle * Math.PI / 180;
    const nx = Math.cos(rad), nz = Math.sin(rad);
    sectionCutPlane.normal.set(nx, 0, nz);
    sectionCutPlane.constant = -(nx * sectionCutX + nz * sectionCutZ);
    // Reposicionar la camara del corte segun la rotacion
    const camY = 6, camDist = 420;
    sectionCamera.position.set(sectionCutX + nx * camDist, camY, sectionCutZ + nz * camDist);
    sectionCamera.up.set(0, 1, 0);
    sectionCamera.lookAt(sectionCutX, camY, sectionCutZ);
    sectionCamera.updateProjectionMatrix();'''

rot_new = '''function updateSectionCutRotation() {
    if (!sectionRenderer || sectionCutZ == null) return;
    const rad = sectionRotAngle * Math.PI / 180;
    const nx = Math.cos(rad), nz = Math.sin(rad);
    sectionCutPlane.normal.set(nx, 0, nz);
    sectionCutPlane.constant = -(nx * sectionCutX + nz * sectionCutZ);
    
    // Hardcode requested camera coordinates
    sectionCamera.position.set(-610.7, 70.0, 693.2);
    sectionCamera.up.set(0, 1, 0);
    sectionCamera.lookAt(177.0, 5.5, -25.6);
    sectionCamera.zoom = 3.42;
    sectionCamera.updateProjectionMatrix();'''
cjs = cjs.replace(rot_orig, rot_new)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
