"""Social banners for Live From Leonida: the circular seal plus the wordmark.
Usage: python3 -I banners/generate.py "$(base64 -w0 ../src/fonts/overpass-latin-wght-normal.woff2)"
"""
import sys
F = sys.argv[1]
SEAL = open("seals/S03.svg").read()
SEAL_INNER = SEAL[SEAL.index("</defs>") + 7: SEAL.rindex("</svg>")]
SEAL_DEFS = SEAL[SEAL.index("<defs>") + 6: SEAL.index("</defs>")]
W = "#fffdf7"; GOLD = "#ffc12b"; DRED = "#b3261e"

def grad():
    return ('<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#ff9a3c"/><stop offset=".55" stop-color="#ff3d8b"/>'
            '<stop offset="1" stop-color="#6b2fc9"/></linearGradient>')

def banner(w, h, name, seal_px):
    s = seal_px / 1000
    gap = seal_px * 0.14
    cx = w / 2 - gap - seal_px          # seal left of centre
    cy = (h - seal_px) / 2
    fs = seal_px * 0.26
    tx = w / 2 - gap + gap * 1.4
    mid = h / 2
    body = (f'<rect width="{w}" height="{h}" fill="url(#sky)"/>'
            f'<g transform="translate({cx:.0f},{cy:.0f}) scale({s:.4f})">{SEAL_INNER}</g>'
            f'<text x="{tx:.0f}" y="{mid - fs * 0.62:.0f}" font-weight="900" font-size="{fs:.0f}" fill="{W}">LIVE FROM</text>'
            f'<text x="{tx:.0f}" y="{mid + fs * 0.42:.0f}" font-weight="900" font-size="{fs:.0f}" fill="{GOLD}">LEONIDA</text>'
            f'<text x="{tx:.0f}" y="{mid + fs * 1.25:.0f}" font-weight="700" font-size="{fs * 0.33:.0f}" fill="{W}">'
            f'Get paid for your GTA VI clips</text>')
    open(name, "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
        f'<defs>{SEAL_DEFS}{grad()}</defs>{body}</svg>')

banner(2560, 1440, "banner-youtube.svg", 380)   # keeps inside YouTube's 1546x423 safe area
banner(1500,  500, "banner-x.svg",       330)
banner(1200,  480, "banner-twitch.svg",  320)
banner(1640,  624, "banner-facebook.svg", 400)
print("banners written")
