#!/usr/bin/env bash
# exit when any command fails
set -e

echo "Build SDK docs"
cd libs/sdk-core
npx typedoc --plugin typedoc-plugin-markdown --excludePrivate ./src/index.ts
cd -