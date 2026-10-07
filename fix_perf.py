import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

# 1. Update loadBuildings to call buildBuildings directly
target_load_b = '''rawBuildingsData = data; rebuildFilteredGeometry();'''
repl_load_b = '''rawBuildingsData = data; buildBuildings(rawBuildingsData, null); rebuildFilteredGeometry();'''
cjs = cjs.replace(target_load_b, repl_load_b)

# 2. Update fetch(NET_URL) to call buildRoads directly
target_load_r = '''rawEdgesData = data.edges;
      const w = (data.bbox[2] - data.bbox[0]) * SCALE;'''
repl_load_r = '''rawEdgesData = data.edges;
      buildRoads(rawEdgesData, null);
      const w = (data.bbox[2] - data.bbox[0]) * SCALE;'''
cjs = cjs.replace(target_load_r, repl_load_r)

# 3. Remove buildBuildings and buildRoads from rebuildFilteredGeometry
target_rebuild = '''const mainBoxFilter = (sectionBoxActive && !isFullRange && !isRotated) ? { xMin, xMax, zMin, zMax, yMin, yMax } : null;
    if (rawBuildingsData) buildBuildings(rawBuildingsData, null); // Render full geometry for bottom view
    if (rawEdgesData) buildRoads(rawEdgesData, null); // Render full geometry for bottom view
    if (mainBoxFilter) buildAxoBorder(xMin, xMax, zMin, zMax);'''
repl_rebuild = '''const mainBoxFilter = (sectionBoxActive && !isFullRange && !isRotated) ? { xMin, xMax, zMin, zMax, yMin, yMax } : null;
    if (mainBoxFilter) buildAxoBorder(xMin, xMax, zMin, zMax);'''
cjs = cjs.replace(target_rebuild, repl_rebuild)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
