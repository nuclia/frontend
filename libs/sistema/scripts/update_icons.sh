#!/bin/sh

echo "Generate sprite from glyphs folder"
python3 ./libs/sistema/scripts/generate-sprite.py > ./libs/sistema/assets/glyphs-sprite.svg

echo "Generate json list of glyphs"
python3 -c "import json; import xml.dom.minidom; print(json.dumps([el.getAttribute('id') for el in xml.dom.minidom.parseString(open('./libs/sistema/assets/glyphs-sprite.svg').read()).getElementsByTagName('symbol')]))" > apps/sistema-demo/src/assets/glyphs.json

echo "Generate typescript icon list"
touch apps/sistema-demo/src/assets/glyphs.ts
echo "export const ICONS = " > apps/sistema-demo/src/assets/glyphs.ts
cat apps/sistema-demo/src/assets/glyphs.json >> apps/sistema-demo/src/assets/glyphs.ts
echo ";" >> apps/sistema-demo/src/assets/glyphs.ts

echo "Remove glyphs.json"
rm apps/sistema-demo/src/assets/glyphs.json

echo "All good!"
