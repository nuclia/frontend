#!/usr/bin/env bash
# exit when any command fails
set -e

echo "Build desktop for stage"
./node_modules/.bin/nx build desktop -c stage

echo "Build desktop electron for production"
./node_modules/.bin/nx build desktop-electron -c production
./node_modules/.bin/tsc -p apps/desktop/electron/tsconfig.server.json
cp -r dist/service ./dist/apps/desktop-electron/assets
if [ -e dist/apps/desktop-electron/main.preload.ts.js ]
then
  mv dist/apps/desktop-electron/main.preload.ts.js dist/apps/desktop-electron/main.preload.js
fi
./node_modules/.bin/nx run desktop-electron:make
