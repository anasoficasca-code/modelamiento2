import io

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    c = f.read()

target = 'let sectionBoxActive = true;'
replacement = 'let sectionBoxActive = false;'
c = c.replace(target, replacement)

# We also want to restore updateSectionBox so it doesn't immediately check 'sectionBoxActive' and leave things messed up
# But if sectionBoxActive is false, updateSectionBox() will clear clippingPlanes. Let's make sure it does!
# In modulo-10-corte.js, does updateSectionBox() do: if(!sectionBoxActive) renderer.clippingPlanes = []; ?
# Let's see!
with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(c)
