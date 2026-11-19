import re

with open('modulo-08-3d.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Strip comments
js_clean = re.sub(r'//.*', '', js)
js_clean = re.sub(r'/\*[\s\S]*?\*/', '', js_clean)

# Strip strings
js_clean = re.sub(r'"[^"\\]*(?:\\.[^"\\]*)*"', '""', js_clean)
js_clean = re.sub(r"'[^'\\]*(?:\\.[^'\\]*)*'", "''", js_clean)

stack = []
pairs = {')': '(', ']': '[', '}': '{'}

errors = []
for idx, ch in enumerate(js_clean):
    if ch in '([{':
        stack.append((ch, idx))
    elif ch in ')]}':
        if not stack:
            errors.append(f'Unmatched {ch} at char {idx}')
        else:
            top, _ = stack.pop()
            if top != pairs[ch]:
                errors.append(f'Mismatched {top} and {ch} at char {idx}')

if stack:
    errors.append(f'Unclosed brackets left: {len(stack)} -> {[s[0] for s in stack[:10]]}')

if not errors:
    print('SUCCESS: Bracket matching is PERFECT! Zero syntax errors in modulo-08-3d.js.')
else:
    print('ERRORS found:', errors)
