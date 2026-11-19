import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

target = r'if \(mainBurroMesh\) mainBurroMesh\.visible = burroVisPrev;\s*return off\.toDataURL\("image/png"\);'
replace = '''if (mainBurroMesh) mainBurroMesh.visible = burroVisPrev;
    // Restore full city geometry for the main live view
    if (rawBuildingsData) buildBuildings(rawBuildingsData, null);
    if (rawEdgesData) buildRoads(rawEdgesData, null);
    rebuildFilteredGeometry(); // Re-apply section box if active
    return off.toDataURL("image/png");'''

js = re.sub(target, replace, js)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
