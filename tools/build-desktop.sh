#!/usr/bin/env bash

nx build desktop -c stage
nx build desktop-electron -c production
if [ -e dist/apps/desktop-electron/main.preload.ts.js ]
then
  mv dist/apps/desktop-electron/main.preload.ts.js dist/apps/desktop-electron/main.preload.js
fi
nx run desktop-electron:make