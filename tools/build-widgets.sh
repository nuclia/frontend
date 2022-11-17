#!/usr/bin/env bash
# exit when any command fails
set -e

echo "Build main search widget"
vite build -c=libs/search-widget/vite.config.js -- search-widget nuclia-widget
cp -r libs/search-widget/public/i18n dist/libs/search-widget

echo "Build video widget"
vite build -c=libs/search-widget/vite.config.js -- search-video-widget nuclia-video-widget
mv dist/libs/search-video-widget/style.css dist/libs/search-video-widget/nuclia-video-widget.css
cp dist/libs/search-video-widget/* dist/libs/search-widget

echo "Build no shadow widget"
vite build -c=libs/search-widget/vite.no-shadow.config.js
cp dist/libs/search-widget-no-shadow/* dist/libs/search-widget

echo "Build viewer widget"
vite build -c=libs/search-widget/vite.config.js -- viewer-widget nuclia-viewer-widget
mv dist/libs/viewer-widget/style.css dist/libs/search-widget/nuclia-viewer-widget.css
cp dist/libs/viewer-widget/* dist/libs/search-widget

echo "Post build cleanup"
rm -rf dist/libs/search-video-widget
rm -rf dist/libs/viewer-widget
