#!/usr/bin/env python

import os
import re
import xml.etree.ElementTree as ET

GLYPHS_DIR = os.path.join(os.path.dirname(__file__), '../glyphs')
ET.register_namespace('', "http://www.w3.org/2000/svg")
print('<svg width="0" height="0" class="hidden">')

for filename in os.listdir(GLYPHS_DIR):
    if filename.endswith('.svg'):
        tree = ET.parse(os.path.join(GLYPHS_DIR, filename))
        root = tree.getroot()
        glyph = ET.Element('symbol')
        glyph.set('viewBox', root.get('viewBox'))
        glyph.set('id', filename.strip().split('.')[0])
        for child in list(root):
            glyph.append(child)
        print(re.sub(r'(\n|\s{2,})', ' ', ET.tostring(glyph).decode('utf-8')))

print('</svg>')