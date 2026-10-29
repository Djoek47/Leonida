import sys, math
F = sys.argv[1]
DEFS = (f'<style>@font-face{{font-family:O;src:url(data:font/woff2;base64,{F}) format("woff2");font-weight:100 900}}'
        f'text{{font-family:O,sans-serif}}</style>'
        '<path id="t" d="M150,500 A350,350 0 0 1 850,500"/>'
        '<path id="b" d="M170,500 A330,330 0 0 0 830,500"/>')
G="#00704a"; Y="#ffc72c"; R="#ff3b30"; K="#15191c"; W="#fff"; V="#8a2be2"
P="#ff3d8b"; O="#ff7a1a"; CREAM="#fff4e0"; DRED="#b3261e"; GOLD="#d4af37"; TEAL="#2aa7b8"

# ---------- centre motifs (drawn inside a 330r circle at 500,500) ----------
def m_sign(fg, plate, ptxt, dot=R):
    return (f'<rect x="250" y="420" width="500" height="170" rx="22" fill="none" stroke="{fg}" stroke-width="14"/>'
            f'<rect x="275" y="445" width="450" height="120" rx="14" fill="{plate}"/>'
            f'<circle cx="340" cy="505" r="26" fill="{dot}"/>'
            f'<text x="545" y="548" font-weight="900" font-size="104" fill="{ptxt}" text-anchor="middle" letter-spacing="4">LIVE</text>')

def m_live(fg, dot=R):
    return (f'<text x="500" y="552" font-weight="900" font-size="186" fill="{fg}" text-anchor="middle" letter-spacing="-4">LIVE</text>'
            f'<circle cx="500" cy="330" r="30" fill="{dot}"/>'
            f'<rect x="330" y="600" width="110" height="22" rx="11" fill="{fg}" opacity=".55"/>'
            f'<rect x="560" y="600" width="110" height="22" rx="11" fill="{fg}" opacity=".55"/>')

def m_scene(sky1, sky2, sand, sea, fg, plate, ptxt):
    rays = "".join(f'<path d="M500,500 L{500+420*math.cos(a/57.3):.0f},{500-420*math.sin(a/57.3):.0f} '
                   f'L{500+420*math.cos((a+8)/57.3):.0f},{500-420*math.sin((a+8)/57.3):.0f}z" fill="{Y}" opacity=".45"/>'
                   for a in range(14, 170, 16))
    palm = ('<g transform="translate(728 560)"><path d="M0,0 q10,-90 -6,-150" stroke="#7a4b2a" stroke-width="15" fill="none"/>'
            + "".join(f'<path d="M-6,-150 q{34*math.cos(a/57.3):.0f},{-34*math.sin(a/57.3):.0f} '
                      f'{74*math.cos(a/57.3):.0f},{-74*math.sin(a/57.3)+24:.0f}" stroke="#2e8b3a" '
                      f'stroke-width="15" fill="none" stroke-linecap="round"/>' for a in (22, 68, 112, 158))
            + '</g>')
    return (f'<rect x="170" y="170" width="660" height="660" fill="{sky1}"/>{rays}'
            f'<circle cx="500" cy="500" r="84" fill="{sky2}"/>'
            f'<rect x="170" y="560" width="660" height="270" fill="{sea}"/>'
            f'<path d="M170,560 q170,-34 330,0 q170,34 330,0 l0,46 q-170,34 -330,0 q-160,-32 -330,0z" fill="{sand}"/>'
            + palm +
            f'<rect x="300" y="610" width="400" height="118" rx="16" fill="{fg}" stroke="{W}" stroke-width="11"/>'
            f'<circle cx="368" cy="669" r="21" fill="{R}"/>'
            f'<text x="560" y="708" font-weight="900" font-size="86" fill="{ptxt}" text-anchor="middle" letter-spacing="4">LIVE</text>')

def m_gator(fg, water, plate, ptxt):
    return (f'<rect x="170" y="170" width="660" height="660" fill="{water}"/>'
            f'<g transform="translate(470 600) scale(.82)">'
            f'<path d="M-330,120 Q-230,30 -50,30 L250,8 Q300,8 292,40 L92,48 Q46,56 30,86 L-16,120z" fill="#3b7a2a"/>'
            f'<path d="M-50,30 L246,-62 Q284,-70 284,-38 L262,0z" fill="#4c9a36"/>'
            f'<path d="M-8,22 l16,-14 l11,17 l16,-20 l11,20 l16,-22 l11,22 l16,-23 l11,23 l16,-25 l11,25" fill="none" stroke="{W}" stroke-width="8"/>'
            f'<circle cx="16" cy="-16" r="16" fill="{Y}"/><circle cx="19" cy="-16" r="6" fill="{K}"/></g>'
            f'<rect x="300" y="300" width="400" height="118" rx="16" fill="{fg}" stroke="{W}" stroke-width="11"/>'
            f'<circle cx="368" cy="359" r="21" fill="{R}"/>'
            f'<text x="560" y="398" font-weight="900" font-size="86" fill="{ptxt}" text-anchor="middle" letter-spacing="4">LIVE</text>')

def m_vi(fg, plate, ptxt):
    return (f'<text x="500" y="470" font-weight="900" font-size="190" fill="{fg}" text-anchor="middle" letter-spacing="6">VI</text>'
            f'<rect x="290" y="510" width="420" height="112" rx="16" fill="{plate}"/>'
            f'<circle cx="352" cy="566" r="22" fill="{R}"/>'
            f'<text x="548" y="604" font-weight="900" font-size="84" fill="{ptxt}" text-anchor="middle" letter-spacing="5">LIVE</text>')

def m_flamingo(fg, plate, ptxt, bg):
    bird = (f'<g transform="translate(500 452) scale(1.08)">'
            f'<ellipse cx="0" cy="40" rx="86" ry="56" fill="{P}"/>'
            f'<path d="M-46,-4 q-48,-32 -16,-110 q24,-48 -8,-94" fill="none" stroke="{P}" stroke-width="25" stroke-linecap="round"/>'
            f'<circle cx="-70" cy="-212" r="35" fill="{P}"/>'
            f'<path d="M-102,-206 q-46,8 -38,46 q16,-24 38,-24z" fill="{K}"/>'
            f'<path d="M-16,92 l-6,74 M24,92 l8,74" stroke="{P}" stroke-width="13"/></g>')
    return (f'<rect x="170" y="170" width="660" height="660" fill="{bg}"/>{bird}'
            f'<rect x="286" y="628" width="428" height="112" rx="16" fill="{plate}"/>'
            f'<circle cx="348" cy="684" r="22" fill="{R}"/>'
            f'<text x="546" y="722" font-weight="900" font-size="84" fill="{ptxt}" text-anchor="middle" letter-spacing="5">LIVE</text>')

def m_clap(fg, plate, ptxt):
    return (f'<g transform="translate(500 500) rotate(-6)">'
            f'<rect x="-210" y="-60" width="420" height="190" rx="16" fill="{fg}"/>'
            f'<rect x="-214" y="-134" width="428" height="74" rx="12" fill="{fg}"/>'
            + "".join(f'<path d="M{-206+i*72},-134 l34,0 l-24,74 l-34,0z" fill="{W}"/>' for i in range(6))
            + f'<circle cx="-146" cy="40" r="22" fill="{R}"/>'
            f'<text x="36" y="76" font-weight="900" font-size="94" fill="{plate}" text-anchor="middle" letter-spacing="4">LIVE</text></g>')

def m_shield(fg, plate, ptxt):
    return (f'<path d="M340,330 h320 q22,0 22,22 v170 q0,132 -182,210 q-182,-78 -182,-210 v-170 q0,-22 22,-22z" fill="{fg}" stroke="{W}" stroke-width="12"/>'
            f'<text x="500" y="470" font-weight="900" font-size="112" fill="{W}" text-anchor="middle" letter-spacing="4">VI</text>'
            f'<rect x="368" y="500" width="264" height="86" rx="12" fill="{plate}"/>'
            f'<circle cx="412" cy="543" r="17" fill="{R}"/>'
            f'<text x="548" y="573" font-weight="900" font-size="64" fill="{ptxt}" text-anchor="middle" letter-spacing="4">LIVE</text>')

# ---------- ring ornaments ----------
def orn_stars(c):
    def st(cx, cy, r):
        pts = " ".join(f"{cx+(r if i%2==0 else r*.44)*math.cos(math.pi/2+i*math.pi/5):.1f},"
                       f"{cy-(r if i%2==0 else r*.44)*math.sin(math.pi/2+i*math.pi/5):.1f}" for i in range(10))
        return f'<polygon points="{pts}" fill="{c}"/>'
    return st(132, 548, 24) + st(868, 548, 24)
def orn_dots(c):
    return f'<circle cx="136" cy="548" r="17" fill="{c}"/><circle cx="864" cy="548" r="17" fill="{c}"/>'
def orn_diamond(c):
    return (f'<rect x="120" y="534" width="30" height="30" rx="5" fill="{c}" transform="rotate(45 135 549)"/>'
            f'<rect x="850" y="534" width="30" height="30" rx="5" fill="{c}" transform="rotate(45 865 549)"/>')
def orn_none(c):
    return ""

def seal(name, ring, inner, arc, orn, motif, ring_edge=None, rope=False, top="LIVE FROM LEONIDA", bot="IN CLIPS WE TRUST"):
    edge = ring_edge or arc
    rope_ring = ""
    if rope:
        rope_ring = "".join(f'<circle cx="{500+472*math.cos(a/57.3):.1f}" cy="{500+472*math.sin(a/57.3):.1f}" r="9" fill="{edge}"/>'
                            for a in range(0, 360, 6))
    body = (f'<circle cx="500" cy="500" r="500" fill="{ring}"/>'
            f'<circle cx="500" cy="500" r="470" fill="none" stroke="{edge}" stroke-width="10"/>'
            + rope_ring +
            f'<circle cx="500" cy="500" r="330" fill="{inner}"/>'
            f'<clipPath id="ci"><circle cx="500" cy="500" r="330"/></clipPath>'
            f'<g clip-path="url(#ci)">{motif}</g>'
            f'<circle cx="500" cy="500" r="330" fill="none" stroke="{edge}" stroke-width="10"/>'
            f'<text font-weight="900" font-size="74" fill="{arc}" letter-spacing="6" text-anchor="middle">'
            f'<textPath href="#t" startOffset="50%"><tspan dy="-34">{top}</tspan></textPath></text>'
            f'<text font-weight="900" font-size="58" fill="{arc}" letter-spacing="8" text-anchor="middle">'
            f'<textPath href="#b" startOffset="50%"><tspan dy="88">{bot}</tspan></textPath></text>'
            + orn)
    open(f"seals/{name}.svg", "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">'
        f'<defs>{DEFS}</defs>{body}</svg>')

S = []
def add(n, label, **kw):
    seal(n, **kw); S.append((n, label))

# 1-4 : classic Florida seal colourway
add("S01", "Classic seal, sign centre", ring=Y, inner=G, arc=DRED, orn=orn_dots(DRED), motif=m_sign(W, Y, K))
add("S02", "Classic seal, big LIVE",    ring=Y, inner=G, arc=DRED, orn=orn_stars(DRED), motif=m_live(W))
add("S03", "Classic seal, sunset scene",ring=Y, inner=CREAM, arc=DRED, orn=orn_dots(DRED),
    motif=m_scene("#ff8a3c", "#fff1e8", "#f2d9a0", TEAL, G, Y, W))
add("S04", "Classic seal, gator",       ring=Y, inner=TEAL, arc=DRED, orn=orn_stars(DRED),
    motif=m_gator(G, TEAL, Y, W))

# 5-8 : highway green colourway
add("S05", "Highway green, sign",   ring=G, inner=CREAM, arc=W, orn=orn_dots(Y), motif=m_sign(G, Y, K))
add("S06", "Highway green, LIVE",   ring=G, inner=W,     arc=Y, orn=orn_stars(Y), motif=m_live(G))
add("S07", "Highway green, VI",     ring=G, inner=Y,     arc=W, orn=orn_diamond(Y), motif=m_vi(K, G, W))
add("S08", "Highway green, shield", ring=G, inner=CREAM, arc=Y, orn=orn_dots(Y), motif=m_shield(G, Y, K))

# 9-12 : night / Vice City colourway
add("S09", "Night seal, sign",     ring="#21103d", inner=V,          arc=Y, orn=orn_dots(P), motif=m_sign(W, Y, K))
add("S10", "Night seal, LIVE",     ring="#140a26", inner="#2e1854",  arc=P, orn=orn_stars(Y), motif=m_live(Y))
add("S11", "Night seal, flamingo", ring="#21103d", inner="#2e1854",  arc=Y, orn=orn_dots(P),
    motif=m_flamingo(W, Y, K, "#2e1854"))
add("S12", "Night seal, clapper",  ring="#140a26", inner=V,          arc=Y, orn=orn_diamond(P), motif=m_clap(K, Y, K))

# 13-16 : premium / alt colourways
add("S13", "Black and gold, sign",  ring=K, inner="#1f1f1f", arc=GOLD, orn=orn_stars(GOLD), motif=m_sign(GOLD, GOLD, K))
add("S14", "Black and gold, LIVE",  ring=K, inner=K,         arc=GOLD, orn=orn_diamond(GOLD), motif=m_live(GOLD))
add("S15", "Citrus, sunset scene",  ring=O, inner=CREAM,     arc=W,    orn=orn_dots(W),
    motif=m_scene("#ffb347", "#fff8ec", "#f6e0b0", TEAL, G, Y, W))
add("S16", "Cream and red, sign",   ring=CREAM, inner=DRED,  arc=DRED, orn=orn_stars(DRED), motif=m_sign(W, CREAM, DRED))

# 17-20 : rope-edge / ornament variants on the strongest bases
add("S17", "Rope edge, classic sign", ring=Y, inner=G, arc=DRED, orn=orn_dots(DRED), motif=m_sign(W, Y, K), rope=True)
add("S18", "Rope edge, night LIVE",   ring="#140a26", inner="#2e1854", arc=Y, orn=orn_dots(P), motif=m_live(Y), rope=True)
add("S19", "Green on cream, LIVE",    ring=CREAM, inner=G, arc=G, orn=orn_dots(G), ring_edge=G, motif=m_live(Y))
add("S20", "Yellow on black, sign",   ring=Y, inner=K, arc=K, orn=orn_diamond(K), ring_edge=K, motif=m_sign(Y, Y, K))

open("seals/list.txt", "w").write("\n".join(n for n, _ in S))
html = ('<body style="margin:0;background:#ececec;font:600 16px system-ui;display:grid;'
        'grid-template-columns:repeat(5,270px);gap:22px;padding:24px">'
        + "".join(f'<div><img src="seals/{n}.svg" width="250" style="border-radius:50%;display:block">'
                  f'<div style="display:flex;gap:9px;align-items:center;margin-top:7px">'
                  f'<img src="seals/{n}.svg" width="44" style="border-radius:50%">'
                  f'<span>{n}<br><span style="font-weight:400;font-size:14px">{l}</span></span></div></div>'
                  for n, l in S) + '</body>')
open("seals.html", "w").write(html)
print(len(S), "seals")
