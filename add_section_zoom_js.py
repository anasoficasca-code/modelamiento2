import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Update applyEscalaTransform to also output FOV
target1 = r'const out = document\.getElementById\("escalaCoordsOutput"\);\s*if \(out\) out\.value = `// === TAMA.*?POSIC.*?===\\nconst ESCALA_TRANSFORM = \{\\n  scale: \$\{escalaScale\.toFixed\(2\)\},\\n  offsetX: \$\{Math\.round\(escalaOffX\)\},\\n  offsetY: \$\{Math\.round\(escalaOffY\)\}\\n\};`;'
replace1 = '''const out = document.getElementById("escalaCoordsOutput");
    if (out) {
      const fovVal = typeof sectionCamera !== 'undefined' && sectionCamera ? sectionCamera.fov : 12;
      out.value = `// === TAMAÑO Y POSICIÓN ===\\nconst ESCALA_TRANSFORM = {\\n  scale: ${escalaScale.toFixed(2)},\\n  offsetX: ${Math.round(escalaOffX)},\\n  offsetY: ${Math.round(escalaOffY)}\\n};\\n\\n// Zoom del corte (FOV): ${fovVal}`;
    }'''
js = re.sub(target1, replace1, js, flags=re.DOTALL)


# Add event listener for sectionZoomSlider
target2 = r'  const escalaZoomSlider = document\.getElementById\("escalaZoomSlider"\);\s*if \(escalaZoomSlider\) \{\s*escalaZoomSlider\.addEventListener\("input", \(e\) => \{\s*escalaScale = parseFloat\(e\.target\.value\) / 100;\s*applyEscalaTransform\(\);\s*\}\);\s*\}'
replace2 = '''  const escalaZoomSlider = document.getElementById("escalaZoomSlider");
  if (escalaZoomSlider) {
    escalaZoomSlider.addEventListener("input", (e) => {
      escalaScale = parseFloat(e.target.value) / 100;
      applyEscalaTransform();
    });
  }

  const sectionZoomSlider = document.getElementById("sectionZoomSlider");
  if (sectionZoomSlider) {
    sectionZoomSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      const valEl = document.getElementById("sectionZoomVal");
      if (valEl) valEl.textContent = val;
      if (typeof sectionCamera !== 'undefined' && sectionCamera) {
        sectionCamera.fov = val;
        sectionCamera.updateProjectionMatrix();
        applyEscalaTransform(); // to update output
      }
    });
  }'''
js = re.sub(target2, replace2, js, flags=re.DOTALL)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
