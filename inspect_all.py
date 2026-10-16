import glob
import re

targets = ["modulo-metropolitano", "modulo-02", "modulo-05", "modulo-08-corte", "Medir la red", "medir la red"]

for filename in sorted(glob.glob("*.html") + glob.glob("*.js")):
    if filename.startswith("inspect_") or filename.startswith("old_") or filename.startswith("temp"):
        continue
    with open(filename, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    hits = []
    for line_num, line in enumerate(content.splitlines(), 1):
        for target in targets:
            if target.lower() in line.lower():
                hits.append((line_num, line.strip()))
    if hits:
        print(f"=== {filename} ===")
        for line_num, line in hits[:10]:
            print(f"  Line {line_num}: {line}")
