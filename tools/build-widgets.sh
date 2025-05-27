#!/usr/bin/env bash
# exit when any command fails
set -e

echo "Build video widget"
vite build -c=libs/search-widget/vite.config.mjs -- search-widget nuclia-video-widget

echo "Build popup widget"
vite build -c=libs/search-widget/vite.config.mjs -- popup-widget nuclia-popup-widget
cp dist/libs/popup-widget/* dist/libs/search-widget

echo "Build viewer widget"
vite build -c=libs/search-widget/vite.config.mjs -- viewer-widget nuclia-viewer-widget
cp dist/libs/viewer-widget/* dist/libs/search-widget

echo "Build chat widget"
vite build -c=libs/search-widget/vite.config.mjs -- chat-widget nuclia-chat-widget
cp dist/libs/chat-widget/* dist/libs/search-widget

echo "Build global widget"
vite build -c=libs/search-widget/vite.config.mjs -- global-widget nuclia-global-widget
cp dist/libs/global-widget/* dist/libs/search-widget

echo "Post build cleanup"
rm -rf dist/libs/popup-widget
rm -rf dist/libs/viewer-widget
rm -rf dist/libs/chat-widget
rm -rf dist/libs/global-widget
