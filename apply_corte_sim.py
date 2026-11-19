import re

with open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update openNaturalExplode to ensure sectionWrap is displayed
js = js.replace(
    'setTimeout(() => { if (natPlayYearBtn && !natYearPlaying) natPlayYearBtn.click(); }, 900);',
    '''setTimeout(() => { if (natPlayYearBtn && !natYearPlaying) natPlayYearBtn.click(); }, 900);
    const secWrapNat = document.getElementById("sectionWrap");
    if (secWrapNat) { secWrapNat.style.display = "block"; secWrapNat.style.zIndex = "600"; }
    resizeSectionView();'''
)

# 2. Update openCulturalExplode to ensure sectionWrap is displayed
old_cult_open_end = 'cultOverlay.style.display = "flex";'
new_cult_open_end = '''cultOverlay.style.display = "flex";
    const secWrapCult = document.getElementById("sectionWrap");
    if (secWrapCult) { secWrapCult.style.display = "block"; secWrapCult.style.zIndex = "600"; }
    resizeSectionView();'''
js = js.replace(old_cult_open_end, new_cult_open_end)

# 3. Add section cut synchronization inside updateNaturalLayersStep
sync_nat_code = '''
    const secWrapNat = document.getElementById("sectionWrap");
    if (secWrapNat) { secWrapNat.style.display = "block"; secWrapNat.style.zIndex = "600"; }
    resizeSectionView();

    if (natExplodeStep === 1 || natExplodeStep === 2) {
      if (typeof applyMainBurroMes === "function" && natMesSlider) {
        applyMainBurroMes(parseInt(natMesSlider.value, 10));
      }
    } else if (natExplodeStep === 3 || natExplodeStep === 4) {
      if (treeMesh) {
        treeMesh.visible = true;
        if (treeMesh.instanceColor) treeMesh.instanceColor.needsUpdate = true;
      }
    } else if (natExplodeStep === 7 || natExplodeStep === 8) {
      if (birdsGroup) birdsGroup.visible = true;
      birdOn = true;
    }
'''

js = js.replace(
    'function updateNaturalLayersStep(animated = true) {\n    syncLegendFromEscala();',
    'function updateNaturalLayersStep(animated = true) {\n    syncLegendFromEscala();' + sync_nat_code
)

# 4. Add section cut synchronization inside updateCulturalLayersStep
sync_cult_code = '''
    const secWrapCult = document.getElementById("sectionWrap");
    if (secWrapCult) { secWrapCult.style.display = "block"; secWrapCult.style.zIndex = "600"; }
    resizeSectionView();

    if (cultExplodeStep === 1 || cultExplodeStep === 2 || cultExplodeStep === 0) {
      if (cultYearSlider && typeof applyMainBurroMes === "function") {
        const yr = parseInt(cultYearSlider.value, 10);
        const monthEquiv = Math.max(1, Math.min(12, Math.round((2024 - yr) / 74 * 11 + 1)));
        applyMainBurroMes(monthEquiv);
      }
    }
'''

js = js.replace(
    'function updateCulturalLayersStep(animated = true) {\n    syncLegendFromEscala();',
    'function updateCulturalLayersStep(animated = true) {\n    syncLegendFromEscala();' + sync_cult_code
)

# 5. Connect cultYearSlider to update 3D section cut water height as slider moves
old_cult_slider_listener = '''if (cultYearSlider) {
    cultYearSlider.addEventListener("input", () => {
      const year = parseInt(cultYearSlider.value, 10);
      if (cultYearLabel) cultYearLabel.textContent = String(year);
      renderCulturalCapa1(year);
    });
  }'''

new_cult_slider_listener = '''if (cultYearSlider) {
    cultYearSlider.addEventListener("input", () => {
      const year = parseInt(cultYearSlider.value, 10);
      if (cultYearLabel) cultYearLabel.textContent = String(year);
      renderCulturalCapa1(year);
      if (typeof applyMainBurroMes === "function") {
        const monthEquiv = Math.max(1, Math.min(12, Math.round((2024 - year) / 74 * 11 + 1)));
        applyMainBurroMes(monthEquiv);
      }
    });
  }'''

js = js.replace(old_cult_slider_listener, new_cult_slider_listener)

with open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("SUCCESS: Applied 3D section cut layer simulation sync!")
