import sys

# 1. JSX Transfer
with open('src/pages/HomePage.jsx', 'r') as f:
    hp_lines = f.readlines()

start_jsx = -1
end_jsx = -1
for i, l in enumerate(hp_lines):
    if '<div className="hp-cards-closing">' in l:
        start_jsx = i
        break

if start_jsx != -1:
    open_divs = 0
    for i in range(start_jsx, len(hp_lines)):
        open_divs += hp_lines[i].count('<div')
        open_divs -= hp_lines[i].count('</div')
        if open_divs == 0:
            end_jsx = i
            break

jsx_block = hp_lines[start_jsx:end_jsx+1]
new_hp_lines = hp_lines[:start_jsx] + hp_lines[end_jsx+1:]

with open('src/pages/HomePage.jsx', 'w') as f:
    f.writelines(new_hp_lines)

with open('src/pages/bagongPamantayan.jsx', 'r') as f:
    bp_lines = f.readlines()

# find hero end
hero_end = -1
for i, l in enumerate(bp_lines):
    if '</header>' in l:
        hero_end = i
        break

new_bp_lines = bp_lines[:hero_end+1] + ['\n'] + jsx_block + ['\n'] + bp_lines[hero_end+1:]
with open('src/pages/bagongPamantayan.jsx', 'w') as f:
    f.writelines(new_bp_lines)

# 2. CSS Transfer
with open('src/pages/HomePage.css', 'r') as f:
    css_lines = f.readlines()

start_css = -1
end_css = -1
for i, l in enumerate(css_lines):
    if '/* ── Closing text below grid ── */' in l:
        start_css = i
    if '/* ════════════════════════════════════════' in l:
        if i+1 < len(css_lines) and 'MODAL — Pamantayan Content' in css_lines[i+1]:
            end_css = i
            break

css_block = css_lines[start_css:end_css]
new_css_lines = css_lines[:start_css] + css_lines[end_css:]

with open('src/pages/HomePage.css', 'w') as f:
    f.writelines(new_css_lines)

with open('src/pages/bagongPamantayan.css', 'a') as f:
    f.write('\n')
    f.writelines(css_block)

print("Done transfer!")
