#!/usr/bin/env python3
"""Mechanically convert a CMS page to the Tailwind build: replace the
per-file <link rel="stylesheet"> block in <head> with a single link to
the compiled tailwind.css. Body is copied byte-for-byte untouched.

Usage: python3 convert_page.py <src.html> <dst.html>

Keeps any <link> whose tag does not start with '<link rel="stylesheet"'
(e.g. Google Fonts preconnect links, or v1.5's jsdelivr Pretendard link
which is written as '<link href="..." rel="stylesheet">' — attribute
order means it does not match the removal check and survives untouched).
"""
import sys

src_path, dst_path = sys.argv[1], sys.argv[2]
with open(src_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
out = []
removed_any = False
for line in lines:
    stripped = line.strip()
    is_css_link = stripped.startswith('<link rel="stylesheet"') and 'fonts.googleapis.com' not in stripped
    if is_css_link:
        removed_any = True
        continue
    out.append(line)
content = '\n'.join(out)

if not removed_any:
    print('WARNING: no stylesheet links removed - check source structure', file=sys.stderr)
    sys.exit(1)

head_close_count = content.count('</head>')
if head_close_count > 1:
    print(f'WARNING: {head_close_count} literal "</head>" occurrences found '
          '(likely one is inside a JS string, e.g. an iframe srcdoc template) '
          '- only the first (the real closing head tag) is replaced', file=sys.stderr)
content = content.replace('</head>', '  <link rel="stylesheet" href="assets/css/tailwind.css">\n</head>', 1)

with open(dst_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Converted {src_path} -> {dst_path}')
