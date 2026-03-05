#!/usr/bin/env bash
set -euo pipefail

# Build marketplace package.zip with only runtime files.
OUTPUT="package.zip"
TEMP_DIR="$(mktemp -d)"
ROOT="$(pwd)"

cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

echo "Copying runtime files..."
cp "$ROOT/index.js" "$TEMP_DIR/"
cp "$ROOT/index.css" "$TEMP_DIR/"
cp "$ROOT/plugin.json" "$TEMP_DIR/"
cp "$ROOT/README.md" "$TEMP_DIR/"
cp "$ROOT/README_zh_CN.md" "$TEMP_DIR/"
cp "$ROOT/LICENSE" "$TEMP_DIR/"
cp "$ROOT/icon.png" "$TEMP_DIR/"
cp "$ROOT/preview.png" "$TEMP_DIR/"
cp -R "$ROOT/i18n" "$TEMP_DIR/"

rm -f "$ROOT/$OUTPUT"
(cd "$TEMP_DIR" && zip -r "$ROOT/$OUTPUT" . >/dev/null)

echo "Done: $OUTPUT"
