#!/usr/bin/env python3
from docx import Document

doc = Document('.tmp/f54191ff.docx')

print('=== GENERATED DOCUMENT CONTENT ===')
print()

section_content = {}
current_section = None

for para in doc.paragraphs:
    text = para.text.strip()
    
    if not text:
        continue
    
    # Check if it's a heading
    if para.style.name.startswith('Heading'):
        current_section = text
        section_content[current_section] = []
        print(f'\n[{para.style.name}] {text}')
        print('-' * 60)
    else:
        print(f'{text[:100]}')
        if current_section:
            section_content[current_section].append(text)

print()
print('=== VERIFICATION ===')
print('Looking for template content (should NOT be present):')
template_keywords = ['VWO', 'React', 'jQuery', 'Sauce Demo', 'inventory', 'locked_out_user']
found_template = False
for keyword in template_keywords:
    for section, content in section_content.items():
        full_text = ' '.join(content).lower()
        if keyword.lower() in full_text and keyword.lower() not in 'user login':
            print(f'WARNING: Found template keyword "{keyword}" in {section}')
            found_template = True

if not found_template:
    print('✓ No template content detected - document is clean')
