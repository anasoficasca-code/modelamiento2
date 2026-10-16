import io, re

with io.open('old_js.js', 'r', encoding='utf-16') as f:
    old_js = f.read()

# Extract captureBaseWithContext from old_js
start_idx = old_js.find('function captureBaseWithContext(renderFocusSetup) {')
end_idx = old_js.find('function offsetPoly', start_idx)

old_func = old_js[start_idx:end_idx].strip()

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    new_js = f.read()

start_idx2 = new_js.find('function captureBaseWithContext(renderFocusSetup) {')
end_idx2 = new_js.find('function offsetPoly', start_idx2)

if start_idx2 != -1 and end_idx2 != -1:
    new_js = new_js[:start_idx2] + old_func + "\n\n  // ---- OFFSET real" + new_js[end_idx2 + 19:]
    with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
        f.write(new_js)
    print("Replaced captureBaseWithContext successfully.")
else:
    print("Could not find captureBaseWithContext in modulo-10-corte.js")
