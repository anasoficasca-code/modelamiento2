import glob
import re
import os

files_to_remove = [
    "modulo-metropolitano.html",
    "modulo-02.html",
    "modulo-02.js",
    "modulo-02.css",
    "modulo-05.html",
    "modulo-05.js",
    "modulo-05.css",
    "modulo-08-corte.html",
    "modulo-08-corte.js",
    "navegador-multiescalar.html"
]

for f in files_to_remove:
    if os.path.exists(f):
        os.remove(f)
        print(f"Deleted file: {f}")

# Now clean links and buttons from all remaining HTML files
html_files = [f for f in glob.glob("*.html") if not f.startswith("old_") and not f.startswith("temp")]

for hf in html_files:
    with open(hf, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    orig = content

    # Remove <a> tags pointing to these modules
    # Patterns for sidebar icon-nav items or list items
    patterns = [
        r'\s*<a\s+[^>]*href=["\'](?:modulo-metropolitano\.html|modulo-02\.html[^"\']*|modulo-05\.html[^"\']*|modulo-08-corte\.html[^"\']*|navegador-multiescalar\.html)[^"\']*["\'][^>]*>.*?</a>',
        r'\s*<li[^>]*>\s*<a\s+[^>]*href=["\'](?:modulo-metropolitano\.html|modulo-02\.html[^"\']*|modulo-05\.html[^"\']*|modulo-08-corte\.html[^"\']*|navegador-multiescalar\.html)[^"\']*["\'][^>]*>.*?</a>\s*</li>',
    ]

    for pat in patterns:
        content = re.sub(pat, '', content, flags=re.DOTALL | re.IGNORECASE)

    # In v2.html, also clean up the MODS array and the button Medir la red
    if hf == "v2.html":
        # Remove button: <a class="btn-kelp" href="modulo-02.html?v2=1">Medir la red</a>
        content = re.sub(r'<a\s+class="btn-kelp"\s+href="modulo-02\.html\?v2=1">Medir la red</a>', '', content)
        # Remove items in MODS: ['02',...], ['M',...], ['05',...]
        content = re.sub(r"\s*\['02'.*?'modulo-02\.html'\],?", "", content)
        content = re.sub(r"\s*\['M'.*?'modulo-metropolitano\.html'\],?", "", content)
        content = re.sub(r"\s*\['05'.*?'modulo-05\.html'\],?", "", content)

    if content != orig:
        with open(hf, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated links in: {hf}")
