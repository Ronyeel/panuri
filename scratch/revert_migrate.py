import sys

# 1. JSX Revert
with open('src/pages/bagongPamantayan.jsx', 'r') as f:
    bp_lines = f.readlines()

start_jsx = -1
end_jsx = -1
for i, l in enumerate(bp_lines):
    if '<div className="hp-cards-closing">' in l:
        start_jsx = i
        break

if start_jsx != -1:
    open_divs = 0
    for i in range(start_jsx, len(bp_lines)):
        open_divs += bp_lines[i].count('<div')
        open_divs -= bp_lines[i].count('</div')
        if open_divs == 0:
            end_jsx = i
            break

jsx_block = bp_lines[start_jsx:end_jsx+1]

# there might be empty lines before and after, but it's fine.
new_bp_lines = bp_lines[:start_jsx] + bp_lines[end_jsx+1:]

# clean up consecutive empty lines that we introduced
cleaned_bp = []
for i, l in enumerate(new_bp_lines):
    if l.strip() == '' and i > 0 and new_bp_lines[i-1].strip() == '':
        continue
    cleaned_bp.append(l)

with open('src/pages/bagongPamantayan.jsx', 'w') as f:
    f.writelines(cleaned_bp)

with open('src/pages/HomePage.jsx', 'r') as f:
    hp_lines = f.readlines()

# find insert location in HomePage.jsx
insert_idx = -1
for i, l in enumerate(hp_lines):
    if '          </div>' in l and '        </div>' in hp_lines[i+1] and '      </section>' in hp_lines[i+2]:
        insert_idx = i + 1
        break

if insert_idx == -1:
    print("Could not find insert idx in HomePage.jsx")
    sys.exit(1)

new_hp_lines = hp_lines[:insert_idx] + jsx_block + hp_lines[insert_idx:]
with open('src/pages/HomePage.jsx', 'w') as f:
    f.writelines(new_hp_lines)

# 2. CSS Revert
with open('src/pages/bagongPamantayan.css', 'r') as f:
    bp_css_lines = f.readlines()

start_css = -1
for i, l in enumerate(bp_css_lines):
    if '/* ── Closing text below grid ── */' in l:
        start_css = i
        break

if start_css != -1:
    css_block = bp_css_lines[start_css:]
    new_bp_css = bp_css_lines[:start_css]
    
    # clean trailing empty lines
    while new_bp_css and new_bp_css[-1].strip() == '':
        new_bp_css.pop()
        
    with open('src/pages/bagongPamantayan.css', 'w') as f:
        f.writelines(new_bp_css)

    with open('src/pages/HomePage.css', 'r') as f:
        hp_css_lines = f.readlines()

    insert_css_idx = -1
    for i, l in enumerate(hp_css_lines):
        if 'MODAL — Pamantayan Content' in l:
            # Insert before the comment block
            insert_css_idx = i - 1
            break

    if insert_css_idx != -1:
        new_hp_css = hp_css_lines[:insert_css_idx] + ['\n'] + css_block + ['\n'] + hp_css_lines[insert_css_idx:]
        with open('src/pages/HomePage.css', 'w') as f:
            f.writelines(new_hp_css)
    else:
        print("Could not find insert css idx in HomePage.css")
        sys.exit(1)

print("Revert completed!")
