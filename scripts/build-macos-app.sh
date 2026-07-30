#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MACOS_DIR="$PROJECT_DIR/macos/til.ly"
BUILD_DIR="$MACOS_DIR/.build/release"
APP_NAME="Tilly"
APP_BUNDLE="$PROJECT_DIR/public/downloads/$APP_NAME.app"
ZIP_PATH="$PROJECT_DIR/public/downloads/til-ly-macos.zip"

echo "→ Building Swift binary (release)..."
cd "$MACOS_DIR"
swift build -c release --disable-sandbox

echo "→ Creating .app bundle..."
rm -rf "$APP_BUNDLE"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

cp "$BUILD_DIR/tilly" "$APP_BUNDLE/Contents/MacOS/tilly"
cp "$MACOS_DIR/Info.plist" "$APP_BUNDLE/Contents/Info.plist"
cp "$MACOS_DIR/Resources/logo-brand.png" "$APP_BUNDLE/Contents/Resources/AppIcon.png"
printf "APPL????" > "$APP_BUNDLE/Contents/PkgInfo"

echo "→ Signing app bundle..."
codesign --sign - --force --entitlements "$MACOS_DIR/tilly.entitlements" --deep "$APP_BUNDLE"

echo "→ Zipping..."
rm -f "$ZIP_PATH"
ditto -c -k --sequesterRsrc --keepParent "$APP_BUNDLE" "$ZIP_PATH"

echo "→ Cleaning up .app bundle..."
rm -rf "$APP_BUNDLE"

echo "✅ Done: $ZIP_PATH"
echo "   Size: $(du -h "$ZIP_PATH" | cut -f1)"
