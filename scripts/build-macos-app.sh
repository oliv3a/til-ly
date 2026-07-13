#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MACOS_DIR="$PROJECT_DIR/macos/KeizoKode"
BUILD_DIR="$MACOS_DIR/.build/release"
APP_NAME="KeizoKode"
APP_BUNDLE="$PROJECT_DIR/public/downloads/$APP_NAME.app"
ZIP_PATH="$PROJECT_DIR/public/downloads/keizokode-macos.zip"

echo "→ Building Swift binary (release)..."
cd "$MACOS_DIR"
swift build -c release --disable-sandbox

echo "→ Creating .app bundle..."
rm -rf "$APP_BUNDLE"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

cp "$BUILD_DIR/KeizoKode" "$APP_BUNDLE/Contents/MacOS/KeizoKode"
cp "$MACOS_DIR/Info.plist" "$APP_BUNDLE/Contents/Info.plist"

echo "→ Zipping..."
rm -f "$ZIP_PATH"
ditto -c -k --sequesterRsrc --keepParent "$APP_BUNDLE" "$ZIP_PATH"

echo "→ Cleaning up .app bundle..."
rm -rf "$APP_BUNDLE"

echo "✅ Done: $ZIP_PATH"
echo "   Size: $(du -h "$ZIP_PATH" | cut -f1)"
