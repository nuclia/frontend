#!/usr/bin/env bash
# exit when any command fails
set -e

echo "Build video widget"
vite build -c=libs/search-widget/vite.config.js -- search-widget nuclia-video-widget
mv dist/libs/search-widget/style.css dist/libs/search-widget/nuclia-video-widget.css

echo "Build viewer widget"
vite build -c=libs/search-widget/vite.config.js -- viewer-widget nuclia-viewer-widget
mv dist/libs/viewer-widget/style.css dist/libs/search-widget/nuclia-viewer-widget.css
cp dist/libs/viewer-widget/* dist/libs/search-widget

echo "Post build cleanup"
rm -rf dist/libs/viewer-widget
