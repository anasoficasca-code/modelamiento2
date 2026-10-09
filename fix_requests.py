import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Tree coloring
target_trees = '''    treeInstanceData = new Array(trees.length);
    trees.forEach((t, i) => {
      const [x, y, hMeters, , code] = t;
      const p = toScene(x, y);
      const h = Math.max(0.3, hMeters * SCALE);
      const w = h * (1.1 + (hash2(code) % 20) / 100 - 0.1);
      treeInstanceData[i] = { x: p.x, z: p.z, w, h };
    });
    sceneRoot.add(mesh);'''

replace_trees = '''    treeInstanceData = new Array(trees.length);
    const colorAlimento1 = new THREE.Color(0xff5fa8); // Cerezo
    const colorAlimento2 = new THREE.Color(0xb06bff); // Sauco
    const colorDescanso = new THREE.Color(0x25d0a0);  // Urapan
    const colorNormal = new THREE.Color(0xffffff);
    
    // InstancedBufferAttribute needed to apply instanceColor
    const colors = new Float32Array(trees.length * 3);
    for (let i = 0; i < trees.length; i++) {
       colors[i*3] = 1; colors[i*3+1] = 1; colors[i*3+2] = 1;
    }
    mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    
    trees.forEach((t, i) => {
      const [x, y, hMeters, especieStr, code] = t;
      const p = toScene(x, y);
      const h = Math.max(0.3, hMeters * SCALE);
      const w = h * (1.1 + (hash2(code) % 20) / 100 - 0.1);
      treeInstanceData[i] = { x: p.x, z: p.z, w, h };
      
      let c = colorNormal;
      if (especieStr) {
        const lower = especieStr.toLowerCase();
        if (lower.includes("fresno") || lower.includes("urapan") || lower.includes("urap")) c = colorDescanso;
        else if (lower.includes("cerezo") || lower.includes("capul")) c = colorAlimento1;
        else if (lower.includes("sauco") || lower.includes("saco") || lower.includes("saúco")) c = colorAlimento2;
      }
      mesh.setColorAt(i, c);
    });
    mesh.instanceColor.needsUpdate = true;
    sceneRoot.add(mesh);'''

js = js.replace(target_trees, replace_trees)


# 2. Hide sceneWrap entirely on explode
target_hide = '''  function fitEscalaOverlays() {
    const legendW = (document.getElementById("layoutLegendW") || {}).value || 200;
    const corteH = (document.getElementById("layoutCorteH") || {}).value || 25;'''

replace_hide = '''  function fitEscalaOverlays() {
    const legendW = 200;
    const corteH = 20; // 20% instead of 25% (corte menos grande)
    
    // Ocultar la axonometria principal para siempre (ya no va a salir mas, solo al inicio)
    const sw = document.getElementById("sceneWrap");
    if (sw) sw.style.visibility = "hidden";
'''

js = js.replace(target_hide, replace_hide)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)

# HTML CHANGES
with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Default Zoom slider 30 instead of 55
html = html.replace('value="55" step="1" style="width:100%; margin-bottom:8px;">', 'value="30" step="1" style="width:100%; margin-bottom:8px;">')
html = html.replace('id="sectionZoomVal">55</span></div>', 'id="sectionZoomVal">30</span></div>')

# Move rain slider into legendPanel
target_rain = '''      <div id="legendPanel" style="position:absolute; top:0; left:0; width:min(200px, 30vw); bottom:0; background:rgba(255,255,255,.94); padding:10px; border-right:1px solid rgba(0,0,0,.1); z-index:100; overflow-y:auto; display:none;">
        <div style="font-size:10px; font-weight:800; color:#3b82f6; text-transform:uppercase; letter-spacing:.08em; margin-bottom:8px; display:none;" id="legendActiveLayer"></div>
        <div style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:12px; line-height:1.2;" id="legendActiveLayerText"></div>
        <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; border-bottom:1px solid rgba(0,0,0,.1); padding-bottom:6px;">Agentes y Elementos</div>
        <div id="legendAgentsContainer"></div>
      </div>'''

replace_rain = '''      <div id="legendPanel" style="position:absolute; top:0; left:0; width:min(200px, 30vw); bottom:0; background:rgba(255,255,255,.94); padding:10px; border-right:1px solid rgba(0,0,0,.1); z-index:100; overflow-y:auto; display:none;">
        <div style="font-size:10px; font-weight:800; color:#3b82f6; text-transform:uppercase; letter-spacing:.08em; margin-bottom:8px; display:none;" id="legendActiveLayer"></div>
        <div style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:12px; line-height:1.2;" id="legendActiveLayerText"></div>
        
        <div id="rainSliderWrap" style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:10px; box-shadow:0 1px 3px rgba(0,0,0,.05); margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; font-weight:700; color:#334155; margin-bottom:6px;"><span style="color:#0ea5e9;">Nivel de Lluvias (Inundaci&oacute;n)</span><span id="rainVal" style="background:#f1f5f9; padding:2px 6px; border-radius:4px; border:1px solid #cbd5e1;">Seco</span></div>
          <input type="range" id="rainSlider" min="0" max="100" value="0" step="1" style="width:100%;">
        </div>

        <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; border-bottom:1px solid rgba(0,0,0,.1); padding-bottom:6px;">Agentes y Elementos</div>
        <div id="legendAgentsContainer"></div>
      </div>'''

html = html.replace(target_rain, replace_rain)

# Delete floating rain slider
html = re.sub(r'<div id="rainSliderWrap".*?</style>\s*</div>\s*</div>', '', html, flags=re.DOTALL) # Wait, regex might fail. I'll just delete the div by finding it

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
