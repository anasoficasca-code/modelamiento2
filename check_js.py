import sys, io

text = io.open('modulo-10-corte.js', encoding='utf-8').read()
stack = []
i = 0
in_str = False
str_char = ''
in_line_comment = False
in_block_comment = False

while i < len(text):
    c = text[i]
    if in_str:
        if c == '\\':
            i += 2
            continue
        if c == str_char:
            in_str = False
    elif in_line_comment:
        if c == '\n':
            in_line_comment = False
    elif in_block_comment:
        if c == '*' and i + 1 < len(text) and text[i+1] == '/':
            in_block_comment = False
            i += 2
            continue
    else:
        if c in ["'", '"', '`']:
            in_str = True
            str_char = c
        elif c == '/' and i + 1 < len(text) and text[i+1] == '/':
            in_line_comment = True
            i += 1
        elif c == '/' and i + 1 < len(text) and text[i+1] == '*':
            in_block_comment = True
            i += 1
        elif c == '{':
            stack.append(i)
        elif c == '}':
            if not stack:
                print(f'Unmatched }} at {i}')
                print(text[max(0, i-50):i+50])
                sys.exit(1)
            stack.pop()
    i += 1

if stack:
    print(f'Unclosed {{ at {stack}')
    for s in stack:
        print(text[max(0, s-50):s+50])
else:
    print('All matched')
