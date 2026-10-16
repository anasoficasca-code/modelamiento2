import io

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace left:calc(100% + 20px); with right:calc(100% + 10px);
html = html.replace('left:calc(100% + 20px);', 'right:calc(100% + 10px);')

# Replace text-align:left; with text-align:right; for those specific tags
html = html.replace('transform:translateY(-50%); font-family:\'Segoe UI\',sans-serif; text-align:left;',
                    'transform:translateY(-50%); font-family:\'Segoe UI\',sans-serif; text-align:right;')

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
