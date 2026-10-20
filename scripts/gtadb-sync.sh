#!/bin/bash
# Pull the GTADB open data (CC BY 4.0, https://map.gtadb.org) into public/gtadb.
#   ./scripts/gtadb-sync.sh   tiles + a curated set of places (no photos)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${GTADB_DIR:-$ROOT/../rolux/gtadb.org}"
if [ -d "$SRC/.git" ]; then git -C "$SRC" pull -q || true
else GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 -q https://github.com/rolux/gtadb.org "$SRC"; fi

OUT="$ROOT/public/gtadb"
TILESET="yanis,17"   # latest GTA VI base map, zoom 0-5
rm -rf "$OUT" && mkdir -p "$OUT/tiles"
cp -r "$SRC/maps/tiles/6/$TILESET/." "$OUT/tiles/"
# Make it ours: paint out the source poster's side panel (legend, credits, frame references)
# and its scale bar, so only the island remains. Credit lives on /credits.
python3 -I - "$OUT/tiles" <<'CROP'
import glob, os, sys
from PIL import Image, ImageDraw
SEA = (44, 103, 164)
MASKS = [(3500, -16384, 16384, 16384), (-600, -8400, 3500, -7100)]  # world metres x0,y0,x1,y1
for f in glob.glob(f"{sys.argv[1]}/*/*.jpg"):
    z, ty, tx = map(int, os.path.basename(f)[:-4].split(","))
    mpp = 32768 / (1024 * 2 ** z)            # metres per pixel
    wx0, wy0 = tx * 256 * mpp - 16384, 16384 - ty * 256 * mpp
    hit = False
    im = None
    for x0, y0, x1, y1 in MASKS:
        px0, px1 = (x0 - wx0) / mpp, (x1 - wx0) / mpp
        py0, py1 = (wy0 - y1) / mpp, (wy0 - y0) / mpp
        if px1 <= 0 or px0 >= 256 or py1 <= 0 or py0 >= 256: continue
        if im is None: im = Image.open(f).convert("RGB")
        ImageDraw.Draw(im).rectangle([max(0, px0), max(0, py0), min(256, px1), min(256, py1)], fill=SEA)
        hit = True
    if hit: im.save(f, quality=88)
CROP

python3 -I - "$SRC/map/data/6/landmarks.json" "$SRC/map/photos/6" "$OUT" <<'PY'
# Curate: only named places with an in-game (trailer/screenshot) photo, a few per area,
# grouped into our own map layers. Everything else stays out to keep the map readable.
import json, os, sys, subprocess, collections
src, photos, out = sys.argv[1:4]
d = json.load(open(src))
LAYERS = [  # (layer, tags) first match wins
    ("sights", {"landmark", "leisure", "natural", "events", "public"}),
    ("nightlife", {"hotel", "restaurant"}),
    ("gas", {"#gas"}),
    ("shops", {"retail", "#supermarket"}),
    ("transport", {"transportation"}),
    ("city", {"government", "industrial", "utilities"}),
]
PRIORITY = {"sights": 0, "nightlife": 1, "gas": 2, "shops": 3, "transport": 4, "city": 5}
cand = []
for lid, v in d.items():
    name, xy, _, real, _, _, tags, *_ = v
    if not xy or len(xy) < 2 or not os.path.exists(f"{photos}/{lid},ig.jpg"): continue
    parts = [p.strip() for p in name.split(",")]
    title = parts[0].strip('"') if parts[0] not in ("?", "") else ""
    if not title or "?" in title or "residential" in tags or "unconfirmed" in tags: continue
    layer = next((l for l, ts in LAYERS if ts & set(tags)), None)
    if "gas station" in title.lower(): layer = "gas"
    if not layer: continue
    area = ", ".join(parts[1:])
    cand.append((PRIORITY[layer], lid, title, area, round(xy[0]), round(xy[1]), real.split(",")[0] if real else "", layer))
cand.sort()
per_area, rows = collections.Counter(), []
for c in cand:
    if per_area[(c[3], c[7])] >= 1 or per_area[c[3]] >= 3: continue
    per_area[c[3]] += 1
    per_area[(c[3], c[7])] += 1
    rows.append(list(c[1:]))
json.dump(rows, open(f"{out}/places.json", "w"), separators=(",", ":"))
print(len(rows), "curated places", collections.Counter(r[6] for r in rows))
PY
du -sh "$OUT"
