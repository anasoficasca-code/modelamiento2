import io, re

html_path = 'modulo-10-corte.html'
js_path = 'modulo-10-corte.js'

# Load HTML
with io.open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update the main title (both HUD and inner title) to exactly "Corte Humedal del Burro"
html = re.sub(r'<h1>[^<]*</h1>', '<h1>Corte Humedal del Burro</h1>', html)
html = re.sub(r'Corte\s*—\s*Humedal\s*El\s*Burro', 'Corte Humedal del Burro', html)

# 2. Remove fullscreen and download HD buttons completely
html = re.sub(r'\s*<button[^>]*id="sectionFullscreenBtn"[^>]*>.*?</button>', '', html, flags=re.DOTALL)
html = re.sub(r'\s*<button[^>]*id="sectionDownloadBtn"[^>]*>.*?</button>', '', html, flags=re.DOTALL)

# 3. Remove the entire botControls div (contains zoom UI and other sliders we don't need)
html = re.sub(r'\s*<div id="botControls"[^>]*>.*?</div>', '', html, flags=re.DOTALL)

# 4. Clean empty lines created by removals
html = re.sub(r'\n{3,}', '\n\n', html)

# 5. Add CSS rule to ensure pato image has transparent background (remove white square)
# Insert just before closing </style>
css_rule = '\n/* Pató image transparent background */\nimg[src*="pato.png"] { background: transparent !important; mix-blend-mode: multiply; }\n'
if '</style>' in html:
    html = re.sub(r'(</style>)', css_rule + r'\1', html, flags=re.IGNORECASE)
else:
    # fallback: append to head
    html = re.sub(r'(</head>)', '<style>' + css_rule + '</style>\1', html, flags=re.IGNORECASE)

# Write back HTML
with io.open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

# Load JS
with io.open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# 6. Remove zoom button event listener block (any code that references btnZoomOutSec / btnZoomInSec)
js = re.sub(r'if \(btnZoomOutSec && btnZoomInSec[^}]*\}\);?', '', js, flags=re.DOTALL)

# 7. Ensure urapán (Urapán) color is lime green (#a3e635) in the legend creation
js = js.replace('const colorDescanso = new THREE.Color(0x25d0a0);', 'const colorDescanso = new THREE.Color(0xa3e635); // Urapán lime')
js = re.sub(r'background:#25d0a0;', 'background:#a3e635;', js)

# 8. Make context fade smoother (increase gradient radius and lower alpha) – already set but ensure values
js = re.sub(r'c\.globalAlpha = \d+\.\d+;', 'c.globalAlpha = 0.4;', js)
js = re.sub(r'const g = t\.createRadialGradient\([^;]*\);',
            'const g = t.createRadialGradient(0, 0, rad * 0.4, 0, 0, rad * 2.8);', js)

# Write back JS
with io.open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print('HTML and JS cleaned up as requested.')
