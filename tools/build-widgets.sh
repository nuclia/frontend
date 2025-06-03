#!/usr/bin/env bash
# exit when any command fails
set -e

echo "Build regular widgets"
vite build -c=libs/search-widget/vite.config.mjs -- search-widget nuclia-widget

echo "Build global widget"
vite build -c=libs/search-widget/vite.config.mjs -- global-widget nuclia-global-widget
cp dist/libs/global-widget/* dist/libs/search-widget

echo "Post build cleanup"
rm -rf dist/libs/global-widget

echo "Backward compatibility"
cp dist/libs/search-widget/nuclia-widget.umd.js dist/libs/search-widget/nuclia-video-widget.umd.js
cp dist/libs/search-widget/nuclia-widget.umd.js dist/libs/search-widget/nuclia-chat-widget.umd.js
cp dist/libs/search-widget/nuclia-widget.umd.js dist/libs/search-widget/nuclia-popup-widget.umd.js
cp dist/libs/search-widget/nuclia-widget.umd.js dist/libs/search-widget/nuclia-viewer-widget.umd.js