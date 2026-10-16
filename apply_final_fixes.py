import io, re

# 1. Update HTML title and remove zoom controls
html_path = 'modulo-10-corte.html'
with io.open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Change HUD title (h1) to "Corte Humedal del Burro"
html = re.sub(r'<h1>[^<]*</h1>', '<h1>Corte Humedal del Burro</h1>', html)

# Change section title span (line 372) to plain text without dash
html = re.sub(r'Corte\s*—\s*Humedal El Burro', 'Corte Humedal del Burro', html)

# Remove zoom +/- buttons from botControls (they are hidden but we delete them)
html = re.sub(r'\s*<button type="button" id="btnZoomOutSec"[^>]*>[^<]*</button>', '', html)
html = re.sub(r'\s*<button type="button" id="btnZoomInSec"[^>]*>[^<]*</button>', '', html)

# Optionally clean empty lines where they were
html = re.sub(r'\n\s*\n', '\n', html)

with io.open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

# 2. Update JS legend colors and context fade
js_path = 'modulo-10-corte.js'
with io.open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Adjust urapán color to lime green (#a3e635)
js = js.replace('const colorDescanso = new THREE.Color(0x25d0a0);', 'const colorDescanso = new THREE.Color(0xa3e635); // Urapán lime')
# Update legend HTML for urapán to use new color
js = re.sub(r"background:#25d0a0;", "background:#a3e635;", js)
# Ensure legend colors for capulí and sauco remain rosado and morado (already correct)

# Improve context fade: lower alpha and smoother gradient (already changed earlier). We'll ensure globalAlpha = 0.4
js = re.sub(r'c\.globalAlpha = \d+\.\d+;', 'c.globalAlpha = 0.4;', js)

# Ensure pato image has transparent background via CSS (add rule)
css_rule = '\n/* Remove white background from pato images */\nimg[src*="pato.png"] { background: transparent !important; mix-blend-mode: multiply; }\n'
if '<style>' in js:
    # Not applicable, need to insert into HTML style section
    pass
else:
    # Append to HTML style block
    with io.open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    # Insert before </style>
    html_content = re.sub(r'(</style>)', css_rule + r'\1', html_content, flags=re.IGNORECASE)
    with io.open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

with io.open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
