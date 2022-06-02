#!/usr/bin/env bash

./node_modules/.bin/nx build desktop -c stage
./node_modules/.bin/nx build desktop-electron -c production
if [ -e dist/apps/desktop-electron/main.preload.ts.js ]
then
  mv dist/apps/desktop-electron/main.preload.ts.js dist/apps/desktop-electron/main.preload.js
fi
./node_modules/.bin/nx run desktop-electron:make