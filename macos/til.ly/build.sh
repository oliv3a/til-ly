#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "Building tilly..."
swift build -c release 2>&1

APP="Tilly.app"
CONTENTS="$APP/Contents"
MACOS="$CONTENTS/MacOS"

echo "Bundling..."
cp .build/release/tilly "$MACOS/tilly"
codesign --sign - --force --entitlements tilly.entitlements "$MACOS/tilly"

echo "Done — double-click $APP or run: open $APP"
