import glob
import re

html_files = sorted(glob.glob("*.html"))

for f in html_files:
    with open(f, "r", encoding="utf-8", errors="ignore") as fp:
        lines = fp.readlines()
    
    for idx, line in enumerate(lines, 1):
        if any(target in line for target in ["modulo-metropolitano.html", "modulo-02.html", "modulo-05.html", "modulo-08-corte.html", "Medir la red", "Medir la Red"]):
            print(f"{f}:{idx}: {line.strip()}")
