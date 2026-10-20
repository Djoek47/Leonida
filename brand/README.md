# Leonida Live logo library
- `logo-options.png`, `logo-options-2.png`: overview of profile logos A to O (day, night, seasonal, Leonida humour). Each is `logo-X-1000.png` with an editable `avatar-X.svg`.
- `weekly/`: one logo per weekly video, weeks 1 to 10 from launch (Nov 19, 2026). Overview: `weekly-logos.png`.
- Banners: `banner-youtube-2560x1440.png`, `banner-x-1500x500.png`, `banner-twitch-1200x480.png`, `banner-facebook-1640x624.png`.
Font: Overpass (SIL Open Font License), embedded in each SVG.

## "In clips we trust" seals
`seal-options.png` (full size) and `seal-options-small.png` (48px avatar test) show S01-S20.
Each is `seals/SXX.png` (1000x1000) with an editable `seals/SXX.svg`.
`seals/generate.py` rebuilds them all: `python3 -I seals/generate.py "$(base64 -w0 ../src/fonts/overpass-latin-wght-normal.woff2)"`

## Activity series
`series/` (A01-A27) — sunset silhouettes: Florida wildlife, vehicles, gear.
`series2/` (B01-B27) — concept seals: varied scenes (night neon, swamp, underwater, storm, noon,
blaze, dawn, asphalt, crate label) and non-vehicle subjects — road signs, broadcast gear,
Florida found objects, Miami culture.
Sheets: `series-options.png`, `series2-options.png`. Each `XX.png` is 1000x1000 with an editable `.svg`.
Rebuild: `python3 -I series2/generate.py "$(base64 -w0 ../src/fonts/overpass-latin-wght-normal.woff2)"`
