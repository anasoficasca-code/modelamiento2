import glob
import re

for filename in sorted(glob.glob("*.html")):
    with open(filename, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    matches = re.findall(r'<a\s+[^>]*href=["\'](modulo-metropolitano\.html|modulo-02\.html|modulo-05\.html|modulo-08-corte\.html)[^"\']*["\'][^>]*>.*?</a>', content, re.DOTALL | re.IGNORECASE)
    if matches:
        print(f"File: {filename} -> matches: {len(matches)}")
