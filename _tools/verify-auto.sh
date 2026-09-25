#!/usr/bin/env bash
# Auto-Äquivalenz: Dark vs Auto(--scheme dark) und Light vs Auto(--scheme light), pixelgenau (threshold 0).
#   [THEME=Name] [VERIFY_OUT=ordner] [VERIFY_MASK=0] bash _tools/verify-auto.sh [seiten] [app]
# [seiten]: Kommaliste wie bei shoot --pages (Seiten, Sets, gemischt). Fotos (<img>, <video>, Raster-
# Hintergrundbilder) werden vor jedem Screenshot durch eine graue Fläche ersetzt (shoot --mask-images),
# weil Chrome JPEGs gelegentlich um ±1 Farbwert anders dekodiert (z. B. Karten auf 3110) – Größe, Radius,
# Rahmen und Filter der Bildflächen werden weiter verglichen. VERIFY_MASK=0 schaltet das ab.
set -u
cd "$(dirname "$0")/.."
PAGES="${1:-1101,1201,1402,1500,1601,1410,3110}"
APP="${2:-9042}"
THEME="${THEME:-Passepartout}"
OUT="${VERIFY_OUT:-_tmp/audit}/eq-$APP"
MASK="--mask-images"
[ "${VERIFY_MASK:-1}" = "0" ] && MASK=""
rm -rf "$OUT"; mkdir -p "$OUT"/{light,dark,autolight,autodark}
node _tools/shoot.mjs --theme "$THEME" --app "$APP" --style light --pages "$PAGES" --out "$OUT/light" $MASK >/dev/null
node _tools/shoot.mjs --theme "$THEME" --app "$APP" --style dark --pages "$PAGES" --out "$OUT/dark" $MASK >/dev/null
node _tools/shoot.mjs --theme "$THEME" --app "$APP" --style auto --scheme light --pages "$PAGES" --out "$OUT/autolight" $MASK >/dev/null
node _tools/shoot.mjs --theme "$THEME" --app "$APP" --style auto --scheme dark --pages "$PAGES" --out "$OUT/autodark" $MASK >/dev/null
# gleiche Dateinamen herstellen: <app>-<seite>.png
for d in light dark autolight autodark; do
  for f in "$OUT/$d"/*.png; do b=$(basename "$f"); n=$(echo "$b" | sed -E 's/^([0-9]+-[0-9]+)-.*\.png$/\1.png/'); mv "$f" "$OUT/$d/$n"; done
done
echo "== Light vs Auto (hell)"; node _tools/pixel-diff.mjs --dir-a "$OUT/light" --dir-b "$OUT/autolight" --threshold 0
echo "== Dark vs Auto (dunkel)"; node _tools/pixel-diff.mjs --dir-a "$OUT/dark" --dir-b "$OUT/autodark" --threshold 0
