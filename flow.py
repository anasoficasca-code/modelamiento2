import io
import re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Zoom out
c = c.replace('camera.zoom = 2.272;', 'camera.zoom = 1.65;')

# 2. Skip the 3 scales screen
c = c.replace('explodeOverlay.style.display = \'flex\';', 'openNaturalExplode(); // Skips the 3 scales overview screen')
c = c.replace('explodeOverlay.style.display = "flex";', 'openNaturalExplode(); // Skips the 3 scales overview screen')

# 3. Flow Natural -> Cultural
nat_orig = '''function advanceNaturalAssemble() {
    natExplodeStep++;
    if (natExplodeStep > 10) natExplodeStep = 0;
    updateNaturalLayersStep(true);
  }'''
nat_new = '''function advanceNaturalAssemble() {
    natExplodeStep++;
    if (natExplodeStep > 10) {
      natExplodeStep = 0;
      updateNaturalLayersStep(false);
      closeNaturalExplode();
      openCulturalExplode();
      return;
    }
    updateNaturalLayersStep(true);
  }'''
c = c.replace(nat_orig, nat_new)

# 4. Flow Cultural -> Tech
cult_orig = '''function advanceCulturalAssemble() {
    cultExplodeStep++;
    if (cultExplodeStep > 10) cultExplodeStep = 0;
    updateCulturalLayersStep(true);
  }'''
cult_new = '''function advanceCulturalAssemble() {
    cultExplodeStep++;
    if (cultExplodeStep > 10) {
      cultExplodeStep = 0;
      updateCulturalLayersStep(false);
      closeCulturalExplode();
      openTechExplode();
      return;
    }
    updateCulturalLayersStep(true);
  }'''
c = c.replace(cult_orig, cult_new)

# 5. Flow Tech -> Done
tech_orig = '''function advanceTechAssemble() {
    techExplodeStep++;
    if (techExplodeStep > 10) techExplodeStep = 0;
    updateTechLayersStep(true);
  }'''
tech_new = '''function advanceTechAssemble() {
    techExplodeStep++;
    if (techExplodeStep > 10) {
      techExplodeStep = 0;
      updateTechLayersStep(false);
      closeTechExplode();
      document.getElementById("sceneWrap").style.display = "block"; // Return to live 3D
      return;
    }
    updateTechLayersStep(true);
  }'''
c = c.replace(tech_orig, tech_new)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(c)
