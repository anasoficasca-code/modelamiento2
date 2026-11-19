import re

# Update modulo-08-3d.html
with open('modulo-08-3d.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Hide textareas with coordinates
html = html.replace('id="sectionCoordsOutput" readonly style="', 'id="sectionCoordsOutput" readonly style="display:none !important;')
html = html.replace('<textarea id="sectionBoxOutput" rows="4" spellcheck="false" readonly></textarea>', '<textarea id="sectionBoxOutput" rows="4" spellcheck="false" readonly style="display:none !important;"></textarea>')

# 2. Add buildingInfo popup right after treeInfo
tree_info_end = '<div class="tree-info" id="treeInfo">\n      <button type="button" class="tree-info-close" id="treeInfoClose">✕</button>\n      <p class="tree-info-kind">Árbol</p>\n      <h3 id="treeInfoName"></h3>\n      <p id="treeInfoDetails"></p>\n    </div>'

building_info_html = '''<div class="tree-info" id="treeInfo">
      <button type="button" class="tree-info-close" id="treeInfoClose">✕</button>
      <p class="tree-info-kind">Árbol</p>
      <h3 id="treeInfoName"></h3>
      <p id="treeInfoDetails"></p>
    </div>

    <!-- Tarjeta de edición de color de edificio (techo + paredes) -->
    <div class="tree-info" id="buildingInfo" style="width:310px;">
      <button type="button" class="tree-info-close" id="buildingInfoClose">✕</button>
      <p class="tree-info-kind">Edificio seleccionado</p>
      <h3 id="buildingInfoTitle">Edificio</h3>
      <p id="buildingInfoDetails" style="margin-bottom:10px;"></p>
      
      <label style="font-size:11px; font-weight:600; color:var(--ink-dim); display:block; margin-bottom:6px;">Cambiar color (paredes + techo):</label>
      <div id="buildingColorPalette" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
        <button type="button" class="color-swatch" data-color="#e8e4dc" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#e8e4dc; cursor:pointer;" title="Crema suave"></button>
        <button type="button" class="color-swatch" data-color="#d4aa6a" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#d4aa6a; cursor:pointer;" title="Ocre arcilla"></button>
        <button type="button" class="color-swatch" data-color="#d88a70" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#d88a70; cursor:pointer;" title="Terracota"></button>
        <button type="button" class="color-swatch" data-color="#789882" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#789882; cursor:pointer;" title="Verde sabana"></button>
        <button type="button" class="color-swatch" data-color="#6a8cae" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#6a8cae; cursor:pointer;" title="Azul pizarra"></button>
        <button type="button" class="color-swatch" data-color="#c88a96" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#c88a96; cursor:pointer;" title="Rosa ceniza"></button>
        <button type="button" class="color-swatch" data-color="#9b8ab4" style="width:26px; height:26px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:#9b8ab4; cursor:pointer;" title="Lavanda"></button>
        <input type="color" id="buildingCustomColorPicker" value="#d88a70" style="width:30px; height:26px; padding:0; border:1px solid rgba(255,255,255,.2); border-radius:6px; background:none; cursor:pointer;" title="Color personalizado">
      </div>
      <div style="display:flex; gap:6px;">
        <button type="button" id="applyBuildingColorSingleBtn" style="flex:1; padding:7px 8px; border-radius:6px; border:1px solid var(--accent); background:var(--accent); color:#0b0c0f; font-size:10.5px; font-weight:700; cursor:pointer;">Aplicar a este edificio</button>
        <button type="button" id="applyBuildingColorTypeBtn" style="flex:1; padding:7px 8px; border-radius:6px; border:1px solid var(--panel-border); background:var(--panel); color:var(--ink); font-size:10.5px; font-weight:600; cursor:pointer;">Aplicar a la categoría</button>
      </div>
    </div>'''

html = html.replace(tree_info_end, building_info_html)

# 3. Update legend HTML with desaturated matching colors
old_legend_html = '''<div class="legend">
      <span><i style="background:#e2635a"></i> Vehículo</span>
      <span><i style="background:#b7babd"></i> Vía</span>
      <span><i style="background:#ffffff"></i> Edificio</span>
      <span><i style="background:#5c8f52"></i> Árbol</span>
      <span><i style="background:#97a5af"></i> Cuerpo de agua</span>
      <span><i style="background:#8a8f96"></i> Manzana</span>
      <span><i style="background:#adaa90"></i> Parque/zona verde</span>
      <span><i style="background:#b5714a"></i> Techo a dos aguas</span>
      <span><i style="background:#ffffff"></i> Techo plano/parapeto</span>
      <span><i style="background:#e5484d"></i> Ruido alto</span>
      <span><i style="background:#2e7d5b"></i> Ruido bajo</span>
    </div>'''

new_legend_html = '''<div class="legend" id="legendPanel">
      <div style="font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:var(--ink-dim); margin-bottom:4px;">Convenciones 3D</div>
      <span><i id="legVeh" style="background:#d66055"></i> Vehículo</span>
      <span><i id="legRoad" style="background:#889098"></i> Vía / Calzada</span>
      <span><i id="legBldgLow" style="background:#e8e4dc"></i> Edificio Residencial (Bajo)</span>
      <span><i id="legBldgMid" style="background:#d4aa6a"></i> Edificio Mixto (Medio)</span>
      <span><i id="legBldgCom" style="background:#d88a70"></i> Edificio Comercial</span>
      <span><i id="legBldgTall" style="background:#6a8cae"></i> Torre / Equipamiento</span>
      <span><i id="legTree" style="background:#68c498"></i> Árbol nativo</span>
      <span><i id="legWater" style="background:#5a9ca4"></i> Cuerpo de agua</span>
      <span><i id="legManzana" style="background:#a0a5ad"></i> Manzana urbana</span>
      <span><i id="legPark" style="background:#8ca882"></i> Parque / Zona verde</span>
    </div>'''

html = html.replace(old_legend_html, new_legend_html)

# 4. Bump script version
html = html.replace('modulo-08-3d.js?v=73', 'modulo-08-3d.js?v=100')

with open('modulo-08-3d.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("SUCCESS: Updated modulo-08-3d.html!")
