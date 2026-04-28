import sys

# 1. READ HOMEPAGE JSX
with open('src/pages/HomePage.jsx', 'r') as f:
    hp_lines = f.readlines()

# Extract state variables
active_card_idx = -1
modal_card_idx = -1
for i, l in enumerate(hp_lines):
    if 'const [activeCard, setActiveCard]' in l:
        active_card_idx = i
    if 'const [selectedModalCard, setSelectedModalCard]' in l:
        modal_card_idx = i

states_to_transfer = []
if active_card_idx != -1:
    states_to_transfer.append(hp_lines[active_card_idx])
if modal_card_idx != -1:
    states_to_transfer.append(hp_lines[modal_card_idx])

# Extract main section
cards_start = -1
cards_end = -1
for i, l in enumerate(hp_lines):
    if '{/* ── Pamantayan Cards' in l:
        cards_start = i
        break

if cards_start != -1:
    # find the closing </section>
    for i in range(cards_start, len(hp_lines)):
        if '</section>' in hp_lines[i]:
            cards_end = i
            break

main_section_jsx = hp_lines[cards_start:cards_end+1]

# Extract modal
modal_start = -1
modal_end = -1
for i, l in enumerate(hp_lines):
    if '{/* ── Modal' in l:
        modal_start = i
        break

if modal_start != -1:
    open_divs = 0
    in_modal = False
    for i in range(modal_start + 1, len(hp_lines)):
        if '<div' in hp_lines[i]:
            open_divs += hp_lines[i].count('<div')
            in_modal = True
        if '</div' in hp_lines[i]:
            open_divs -= hp_lines[i].count('</div')
        if in_modal and open_divs == 0:
            modal_end = i
            break
    
    if modal_end == -1: # fallback to just before </main> or </Fragment>
        pass

if modal_end != -1:
    modal_jsx = hp_lines[modal_start:modal_end+1]
else:
    modal_jsx = hp_lines[modal_start:-2] # rough guess, we'll refine if needed

# We will remove states, main section and modal from HomePage.jsx
new_hp = []
for i, l in enumerate(hp_lines):
    if i in (active_card_idx, modal_card_idx):
        continue
    if cards_start <= i <= cards_end:
        continue
    if modal_start <= i <= (modal_end if modal_end != -1 else len(hp_lines)-2):
        continue
    new_hp.append(l)

with open('src/pages/HomePage.jsx', 'w') as f:
    f.writelines(new_hp)

# 2. MODIFY BAGONG PAMANTAYAN JSX
with open('src/pages/bagongPamantayan.jsx', 'r') as f:
    bp_lines = f.readlines()

# add import { useState }
has_use_state = any('useState' in l for l in bp_lines)
if not has_use_state:
    bp_lines.insert(0, "import { useState } from 'react';\n")

# remove item 7 from PAMANTAYAN_CARDS if present
bp_lines = [l for l in bp_lines if "numeral: 'VIII'" not in l]

# find export default function BagongPamantayan()
func_start = -1
for i, l in enumerate(bp_lines):
    if 'export default function BagongPamantayan' in l:
        func_start = i
        break

new_bp = bp_lines[:func_start+1]
new_bp.append('  const [activeCard, setActiveCard] = useState(null);\n')
new_bp.append('  const [selectedModalCard, setSelectedModalCard] = useState(null);\n')

# find end of Panimula section
panimula_end = -1
for i in range(func_start, len(bp_lines)):
    if '</section>' in bp_lines[i]:
        panimula_end = i
        break

new_bp.extend(bp_lines[func_start+1:panimula_end+1])

# add space and the sections
new_bp.append('\n      <div style={{ height: "40px" }} />\n\n')
new_bp.extend(main_section_jsx)
new_bp.append('\n')

# add modal right before the last </div></div>
# find last closing div
end_idx = len(bp_lines) - 1
while end_idx >= 0 and '</div>' not in bp_lines[end_idx]:
    end_idx -= 1

new_bp.extend(bp_lines[panimula_end+1:end_idx-1]) # rest of content except closing
new_bp.extend(modal_jsx)
new_bp.extend(bp_lines[end_idx-1:]) # closing tags

with open('src/pages/bagongPamantayan.jsx', 'w') as f:
    f.writelines(new_bp)

# 3. CSS TRANSFER
with open('src/pages/HomePage.css', 'r') as f:
    hp_css = f.readlines()

css_start = -1
for i, l in enumerate(hp_css):
    if 'PAMANTAYAN CARDS' in l:
        css_start = i - 1 # include the top comment border
        break

if css_start != -1:
    css_block = hp_css[css_start:]
    new_hp_css = hp_css[:css_start]
    with open('src/pages/HomePage.css', 'w') as f:
        f.writelines(new_hp_css)
        
    with open('src/pages/bagongPamantayan.css', 'a') as f:
        f.write('\n')
        f.writelines(css_block)

print("Done")
