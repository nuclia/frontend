#!/usr/bin/env bash
# exit when any command fails
set -e

echo "Build RAO widget"
vite build -c=libs/rao-widget/vite.config.lib.ts
