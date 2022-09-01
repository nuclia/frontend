#!/usr/bin/env bash

rm -rf ./build/protobuf
mkdir -p build/protobuf
cp package.json *.md ../../../LICENSE.md ./build/protobuf
node export_to_json.mjs
sed "s/__MODEL__/$(cat build/model.json)/" index.mjs > build/protobuf/index.mjs
