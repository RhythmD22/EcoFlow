#!/bin/bash
# Build production bundle by concatenating JS modules into a single IIFE.
# Strips import/export keywords since functions share a single closure.

set -euo pipefail

OUTPUT="js/bundle.js"

# Files in dependency order (no-dependency modules first).
FILES=(
  js/constants.js
  js/icons.js
  js/data.js
  js/theme.js
  js/nav.js
  js/utils.js
  js/geo.js
  js/weather.js
  js/aqi.js
  js/climate.js
  js/coach.js
  js/scan.js
  js/index.js
  js/habits-page.js
  js/coach-page.js
  js/impact-page.js
  js/settings-page.js
  js/scan-page.js
  js/app.js
)

echo "(() => {" > "$OUTPUT"
echo "  'use strict';" >> "$OUTPUT"

for file in "${FILES[@]}"; do
  name=$(basename "$file")
  echo "" >> "$OUTPUT"
  echo "  // ============================================================" >> "$OUTPUT"
  echo "  // $name" >> "$OUTPUT"
  echo "  // ============================================================" >> "$OUTPUT"
  echo "" >> "$OUTPUT"

  # Delete import lines, delete export { ... }; blocks, strip export keyword from declarations
  sed -E '/^[[:space:]]*import /d' "$file" \
    | sed -E '/^[[:space:]]*export \{/,/^\};/d' \
    | sed -E 's/^([[:space:]]*)export /\1/' \
    | sed -E 's/^/  /' \
    >> "$OUTPUT"
done

echo "" >> "$OUTPUT"
echo "})();" >> "$OUTPUT"

echo "Bundle written to $OUTPUT ($(wc -l < "$OUTPUT" | tr -d ' ') lines)"