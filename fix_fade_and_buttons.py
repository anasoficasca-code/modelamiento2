import re

html_file = 'modulo-10-corte.html'
js_file = 'modulo-10-corte.js'

# --- 1. Clean HTML UI elements ---
with open(html_file, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Remove fullscreen button logic
html_content = re.sub(r'const sectionFullscreenBtn.*?\n', '', html_content, flags=re.IGNORECASE)

# Write back HTML
with open(html_file, 'w', encoding='utf-8') as f:
    f.write(html_content)


# --- 2. Clean JS UI elements and fade opacity ---
with open(js_file, 'r', encoding='utf-8') as f:
    js_content = f.read()

# Remove section is fullscreen var
js_content = re.sub(r'let sectionIsFullscreen = false;.*?\n', '', js_content)

# Remove the section download logic block
download_pattern = r'const sectionDownloadBtn = document.getElementById\("sectionDownloadBtn"\);.*?if \(sectionDownloadBtn\) \{.*?\}\);\s*\}'
js_content = re.sub(download_pattern, '', js_content, flags=re.DOTALL)

# Remove the fullscreen logic block
fullscreen_pattern = r'const sectionWrapEl2 = document.getElementById\("sectionWrap"\);.*?const sectionFullscreenBtn = document.getElementById\("sectionFullscreenBtn"\);.*?if \(sectionFullscreenBtn && sectionWrapEl2\) \{.*?\}\);\s*\}'
js_content = re.sub(fullscreen_pattern, '', js_content, flags=re.DOTALL)

# Write back JS
with open(js_file, 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Cleanup complete.")
