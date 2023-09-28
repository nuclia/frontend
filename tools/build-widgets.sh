#!/usr/bin/env bash
# exit when any command fails
set -e

echo "Build video widget"
vite build -c=libs/search-widget/vite.config.mjs -- search-widget nuclia-video-widget
mv dist/libs/search-widget/style.css dist/libs/search-widget/nuclia-video-widget.css

echo "Build viewer widget"
vite build -c=libs/search-widget/vite.config.mjs -- viewer-widget nuclia-viewer-widget
mv dist/libs/viewer-widget/style.css dist/libs/search-widget/nuclia-viewer-widget.css
cp dist/libs/viewer-widget/* dist/libs/search-widget

echo "Build chat widget"
vite build -c=libs/search-widget/vite.config.mjs -- chat-widget nuclia-chat-widget
mv dist/libs/chat-widget/style.css dist/libs/search-widget/nuclia-chat-widget.css
cp dist/libs/chat-widget/* dist/libs/search-widget

echo "Post build cleanup"
rm -rf dist/libs/viewer-widget
rm -rf dist/libs/chat-widget
