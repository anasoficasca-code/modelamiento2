with open('modulo-08-3d.js', 'r', encoding='utf-8') as f:
    js = f.read()

clean = []
in_str = False
str_ch = ''
i = 0
while i < len(js):
    ch = js[i]
    if in_str:
        if ch == '\\':
            i += 2
            continue
        if ch == str_ch:
            in_str = False
        i += 1
        continue
    if ch in ('"', "'", '`'):
        in_str = True
        str_ch = ch
        i += 1
        continue
    if ch == '/' and i + 1 < len(js) and js[i+1] == '/':
        while i < len(js) and js[i] != '\n':
            i += 1
        continue
    clean.append(ch)
    i += 1

clean_js = ''.join(clean)

stack = []
pairs = {')': '(', ']': '[', '}': '{'}
errors = []
for idx, ch in enumerate(clean_js):
    if ch in '([{':
        stack.append((ch, idx))
    elif ch in ')]}':
        if not stack:
            errors.append(f'Unmatched {ch} at {idx}')
        else:
            top, _ = stack.pop()
            if top != pairs[ch]:
                errors.append(f'Mismatched {top} and {ch} at {idx}')

if not errors and not stack:
    print('SUCCESS: Bracket matching is PERFECT! Zero syntax errors.')
else:
    print('ERRORS:', errors, 'Stack remaining:', len(stack))
