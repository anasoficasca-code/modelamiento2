import re

with open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace syncLegendFromEscala and updateAgentsLegend functions
old_sync_start = js.find('function syncLegendFromEscala() {')
if old_sync_start == -1:
    print("ERROR: syncLegendFromEscala not found!")
    exit(1)

# Find end of updateAgentsLegend
old_sync_end = js.find('applyEscalaTransform();', old_sync_start)

new_sync_code = """function syncLegendFromEscala() {
      const legendActiveLayer = document.getElementById("legendActiveLayer");
      const legendActiveLayerText = document.getElementById("legendActiveLayerText");
      
      const natOverlay = document.getElementById("naturalExplodeOverlay");
      const cultOverlay = document.getElementById("culturalExplodeOverlay");
      const techOverlay = document.getElementById("techExplodeOverlay");

      let txt = "";

      if (natOverlay && natOverlay.style.display !== "none") {
          if (typeof natExplodeStep !== "undefined") {
              if (natExplodeStep === 1 || natExplodeStep === 2) txt = "Capa 1: Sistema Inerte & Físico-Hidrológico (Agua)";
              else if (natExplodeStep === 3 || natExplodeStep === 4) txt = "Capa 2: Cobertura Vegetal (Árboles)";
              else if (natExplodeStep === 5 || natExplodeStep === 6) txt = "Capa 3: Vegetación Riparia (Flora)";
              else if (natExplodeStep === 7 || natExplodeStep === 8) txt = "Capa 4: Dinámica de Fauna y Aves (Animales)";
              else txt = "Escala Natural — General";
          } else {
              txt = "Escala Natural — General";
          }
      } else if (cultOverlay && cultOverlay.style.display !== "none") {
          if (typeof cultExplodeStep !== "undefined") {
              if (cultExplodeStep === 1 || cultExplodeStep === 2 || cultExplodeStep === 0) txt = "Capa Histórica: Crecimiento del Humedal";
              else if (cultExplodeStep === 3 || cultExplodeStep === 4) txt = "Capa 2: Cerramiento EAAB & Filtro de Borde";
              else if (cultExplodeStep === 5 || cultExplodeStep === 6) txt = "Capa 3: Redes de Uso & Conectividad";
              else if (cultExplodeStep === 7 || cultExplodeStep === 8) txt = "Capa 4: Dinámica Cultural & Actores";
              else txt = "Capa Histórica: Crecimiento del Humedal";
          } else {
              txt = "Capa Histórica: Crecimiento del Humedal";
          }
      } else if (techOverlay && techOverlay.style.display !== "none") {
          txt = "Escala Tecnológica";
      } else {
          txt = "Corte Humedal del Burro";
      }

      if (legendActiveLayer && legendActiveLayerText) {
          legendActiveLayer.style.display = "block";
          legendActiveLayerText.textContent = txt;
      }

      const cultCapa1Panel = document.getElementById("cultCapa1Panel");
      if (cultCapa1Panel) {
          if (txt.toLowerCase().includes("histórica") || txt.toLowerCase().includes("crecimiento")) {
              cultCapa1Panel.style.display = "block";
          } else {
              cultCapa1Panel.style.display = "none";
          }
      }

      updateAgentsLegend(txt);
    }
    
    function updateAgentsLegend(txt) {
      const c = document.getElementById("legendAgentsContainer");
      if (!c) return;
      if (!txt) { c.innerHTML = ""; return; }
      
      let html = `<div style="display:flex; flex-direction:column; gap:8px; margin-top:8px; padding-top:8px; border-top:1px solid rgba(0,0,0,0.08);">`;
      const lower = txt.toLowerCase();
      
      const isHist = lower.includes("histórica") || lower.includes("crecimiento");
      const isCapa1 = lower.includes("capa 1") || lower.includes("hídrico") || lower.includes("agua");
      const isCapa2 = lower.includes("capa 2") || lower.includes("árboles") || lower.includes("arboles") || lower.includes("cobertura vegetal");
      const isCapa3 = lower.includes("capa 3") || lower.includes("riparia") || lower.includes("flora");
      const isCapa4 = lower.includes("capa 4") || lower.includes("fauna") || lower.includes("animales") || lower.includes("aves");

      if (isHist) {
          html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:14px; height:14px; border-radius:3px; background:#9333ea; border:1px solid #7e22ce;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Área Histórica del Humedal</span></div>`;
          html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:4px; background:#e11d48; border-radius:2px;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Reducción del Espejo Hídrico</span></div>`;
      } else if (isCapa1) {
          // CAPA 1 EXCLUSIVA: Agua
          html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:4px; background:#0284c7; border-radius:2px;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Río Bogotá</span></div>`;
          html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:4px; background:#38bdf8; border-radius:2px;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Río Funza</span></div>`;
          html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:14px; height:14px; border-radius:3px; background:#7dd3fc; border:1px solid #0284c7;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Humedal El Burro / La Vaca</span></div>`;
      } else if (isCapa2) {
          // CAPA 2 EXCLUSIVA: Árboles
          html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#b06bff; border:1px solid #7c3aed;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Saúco (Morado)</span></div>`;
          html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#ff5fa8; border:1px solid #db2777;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Capulí (Rosado)</span></div>`;
          html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#a3e635; border:1px solid #059669;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Urapán (Verde Lima)</span></div>`;
      } else if (isCapa3) {
          // CAPA 3 EXCLUSIVA: Vegetación Riparia
          html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:14px; height:14px; border-radius:3px; background:#84cc16; border:1px solid #65a30d;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Franja Riparia / Typha</span></div>`;
          html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:14px; height:14px; border-radius:3px; background:#15803d; border:1px solid #166534;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Matorral Perimetral ZMPA</span></div>`;
      } else if (isCapa4) {
          // CAPA 4 EXCLUSIVA: Fauna / Aves
          html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/pato.png" style="width:20px; height:20px; object-fit:contain; mix-blend-mode:multiply;"> <span style="font-size:11px; font-weight:600; color:#334155;">Pato</span></div>`;
          html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/garza.png" style="width:20px; height:20px; object-fit:contain; mix-blend-mode:multiply;"> <span style="font-size:11px; font-weight:600; color:#334155;">Garza</span></div>`;
          html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/tingua.png" style="width:20px; height:20px; object-fit:contain; mix-blend-mode:multiply;"> <span style="font-size:11px; font-weight:600; color:#334155;">Tingua</span></div>`;
      } else {
          html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:16px; height:4px; background:#0284c7; border-radius:2px;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Sistema Hídrico</span></div>`;
          html += `<div style="display:flex; align-items:center; gap:8px;"><div style="width:12px; height:12px; border-radius:50%; background:#a3e635; border:1px solid #059669;"></div> <span style="font-size:11px; font-weight:600; color:#334155;">Cobertura Vegetal</span></div>`;
          html += `<div style="display:flex; align-items:center; gap:8px;"><img src="assets/tingua.png" style="width:20px; height:20px; object-fit:contain; mix-blend-mode:multiply;"> <span style="font-size:11px; font-weight:600; color:#334155;">Fauna Nativa</span></div>`;
      }
      
      html += `</div>`;
      c.innerHTML = html;
    }
    
    syncLegendFromEscala();\n    """

js_updated = js[:old_sync_start] + new_sync_code + js[old_sync_end:]

# Now make sure updateNaturalLayersStep calls syncLegendFromEscala at its start or end
# Let's add syncLegendFromEscala(); inside updateNaturalLayersStep and updateCulturalLayersStep
js_updated = js_updated.replace("function updateNaturalLayersStep(animated = true) {", "function updateNaturalLayersStep(animated = true) {\n    syncLegendFromEscala();")
js_updated = js_updated.replace("function updateCulturalLayersStep(animated = true) {", "function updateCulturalLayersStep(animated = true) {\n    syncLegendFromEscala();")

with open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js_updated)

print("SUCCESS: Updated legend logic and layer step hooks!")
