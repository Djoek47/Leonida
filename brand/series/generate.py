import sys, math
F = sys.argv[1]
DEFS = (f'<style>@font-face{{font-family:O;src:url(data:font/woff2;base64,{F}) format("woff2");font-weight:100 900}}'
        f'text{{font-family:O,sans-serif}}</style>'
        '<path id="t" d="M150,500 A350,350 0 0 1 850,500"/>'
        '<path id="b" d="M170,500 A330,330 0 0 0 830,500"/>')
Y="#ffc72c"; DRED="#b3261e"; G="#00704a"; W="#fff"; R="#ff3b30"
SIL="#241508"            # backlit silhouette
SKY="#ff8a3c"; SUN="#fff1e8"; SEA="#2aa7b8"; SAND="#f2d9a0"

def scene(subject, horizon=620, sun_y=470):
    rays = "".join(f'<path d="M500,{sun_y} L{500+460*math.cos(a/57.3):.0f},{sun_y-460*math.sin(a/57.3):.0f} '
                   f'L{500+460*math.cos((a+8)/57.3):.0f},{sun_y-460*math.sin((a+8)/57.3):.0f}z" fill="{Y}" opacity=".45"/>'
                   for a in range(14, 170, 16))
    return (f'<rect x="150" y="150" width="700" height="700" fill="{SKY}"/>{rays}'
            f'<circle cx="500" cy="{sun_y}" r="92" fill="{SUN}"/>'
            f'<rect x="150" y="{horizon}" width="700" height="{860-horizon}" fill="{SEA}"/>'
            f'<path d="M150,{horizon} q170,-30 350,0 q170,30 350,0 l0,40 q-170,30 -350,0 q-170,-30 -350,0z" fill="{SAND}"/>'
            + subject)

def plate():
    return (f'<rect x="330" y="690" width="340" height="96" rx="14" fill="{G}" stroke="{W}" stroke-width="9"/>'
            f'<circle cx="385" cy="738" r="17" fill="{R}"/>'
            f'<text x="545" y="769" font-weight="900" font-size="70" fill="{W}" text-anchor="middle" letter-spacing="4">LIVE</text>')

def seal(name, subject, bot, horizon=620, sun_y=470):
    L = len(bot)
    fs = 58 if L <= 18 else (50 if L <= 22 else 44)
    ls = 8 if L <= 18 else 5
    body = (f'<circle cx="500" cy="500" r="500" fill="{Y}"/>'
            f'<circle cx="500" cy="500" r="470" fill="none" stroke="{DRED}" stroke-width="10"/>'
            f'<circle cx="500" cy="500" r="330" fill="{SUN}"/>'
            f'<clipPath id="ci"><circle cx="500" cy="500" r="330"/></clipPath>'
            f'<g clip-path="url(#ci)">{scene(subject, horizon, sun_y)}{plate()}</g>'
            f'<circle cx="500" cy="500" r="330" fill="none" stroke="{DRED}" stroke-width="10"/>'
            f'<circle cx="136" cy="548" r="17" fill="{DRED}"/><circle cx="864" cy="548" r="17" fill="{DRED}"/>'
            f'<text font-weight="900" font-size="90" fill="{DRED}" letter-spacing="10" text-anchor="middle">'
            f'<textPath href="#t" startOffset="50%"><tspan dy="-28">LEONIDA LIVE</tspan></textPath></text>'
            f'<text font-weight="900" font-size="{fs}" fill="{DRED}" letter-spacing="{ls}" text-anchor="middle">'
            f'<textPath href="#b" startOffset="50%"><tspan dy="88">{bot}</tspan></textPath></text>')
    open(f"series/{name}.svg","w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">'
        f'<defs>{DEFS}</defs>{body}</svg>')

def g(d, tx=500, ty=470, s=1.0):
    return f'<g transform="translate({tx} {ty}) scale({s})" fill="{SIL}">{d}</g>'

# ---------------- silhouettes ----------------
IGUANA = ('<path d="M-210,34 Q-120,16 -46,12 Q6,8 44,-10 Q74,-24 100,-18 L120,-6 Q128,2 116,10 '
          'L82,20 Q50,38 4,44 Q-70,52 -210,62 Z"/>'
          '<path d="M-60,8 l12,-26 l14,24 l14,-30 l14,28 l16,-32 l14,30 l16,-30 l12,28"/>'
          '<circle cx="96" cy="-6" r="7" fill="#ffc72c"/>'
          '<path d="M86,14 q22,16 6,30 q-18,8 -24,-12z"/>'
          '<path d="M-30,42 l-10,46 l20,0 l8,-42z M44,34 l-8,48 l20,0 l6,-44z M-150,52 l-8,40 l18,0 l6,-38z"/>')
GATOR  = ('<path d="M-250,40 Q-160,-12 -20,-12 L180,-34 Q226,-40 228,-10 L206,6 L40,18 Q-4,28 -24,56 L-70,76 Z"/>'
          '<path d="M-10,0 l16,-18 l12,20 l16,-22 l12,22 l16,-24 l12,24 l16,-24 l12,24"/>'
          '<circle cx="20" cy="-22" r="9" fill="#ffc72c"/>'
          '<path d="M-190,66 l-12,46 l22,0 l10,-42z M-40,70 l-10,44 l22,0 l8,-40z"/>')
FLAM   = ('<ellipse cx="10" cy="60" rx="92" ry="58"/>'
          '<path d="M-38,10 q-52,-34 -18,-118 q26,-52 -8,-100" fill="none" stroke="'+SIL+'" stroke-width="26" stroke-linecap="round"/>'
          '<circle cx="-64" cy="-220" r="36"/>'
          '<path d="M-98,-214 q-50,8 -40,48 q18,-26 40,-26z"/>'
          '<path d="M-14,114 l-8,86 M30,114 l10,86" stroke="'+SIL+'" stroke-width="14"/>')
SHARK  = ('<path d="M0,-130 Q40,-40 118,20 L-118,20 Q-40,-40 0,-130 Z"/>'
          '<path d="M-200,56 q50,-22 100,0 q50,22 100,0 q50,-22 100,0 q50,22 100,0" fill="none" stroke="'+SIL+'" stroke-width="13"/>')
MARLIN = ('<path d="M-130,40 Q-40,-56 90,-62 L212,-104 L120,-28 Q150,10 120,54 Q20,96 -130,40 Z"/>'
          '<path d="M-130,40 l-96,-54 l24,60 l-28,56 Z"/>'
          '<path d="M10,-48 l30,-70 l34,62 Z"/>'
          '<circle cx="96" cy="-44" r="9" fill="#ffc72c"/>')
PELICAN= ('<ellipse cx="0" cy="40" rx="94" ry="62"/>'
          '<circle cx="-72" cy="-70" r="40"/>'
          '<path d="M-104,-62 L-230,-20 Q-244,8 -212,14 Q-150,10 -96,-32 Z"/>'
          '<path d="M-12,100 l-6,66 M26,100 l8,66" stroke="'+SIL+'" stroke-width="14"/>')
PYTHON = ('<path d="M-200,70 Q-120,-30 -20,24 Q70,74 140,10 Q186,-32 216,8 Q236,34 206,52 '
          'Q176,66 160,44" fill="none" stroke="'+SIL+'" stroke-width="40" stroke-linecap="round"/>'
          '<path d="M-200,70 q-40,6 -56,-18" fill="none" stroke="'+SIL+'" stroke-width="20" stroke-linecap="round"/>'
          '<circle cx="196" cy="26" r="8" fill="#ffc72c"/>')
MANATEE= ('<path d="M-180,10 Q-120,-62 10,-58 Q130,-54 176,6 Q196,34 170,58 Q120,92 10,92 Q-120,92 -180,46 Z"/>'
          '<path d="M-180,28 l-78,-34 l18,46 l-22,44 Z"/>'
          '<circle cx="132" cy="-10" r="8" fill="#ffc72c"/>'
          '<path d="M30,86 q34,34 86,26" fill="none" stroke="'+SIL+'" stroke-width="18"/>')
AIRBOAT= ('<path d="M-220,60 L170,60 L140,106 L-190,106 Z"/>'
          '<rect x="-80" y="-10" width="96" height="74" rx="10"/>'
          '<circle cx="128" cy="-4" r="92" fill="none" stroke="'+SIL+'" stroke-width="16"/>'
          '<path d="M128,-96 v184 M36,-4 h184" stroke="'+SIL+'" stroke-width="12"/>')
BOAT   = ('<path d="M-210,44 L190,44 L150,104 L-170,104 Z"/>'
          '<path d="M-96,-16 L92,-16 L120,44 L-124,44 Z"/>'
          '<rect x="-40" y="-70" width="110" height="56" rx="8"/>'
          '<path d="M-260,118 q60,-24 120,0 q60,24 120,0 q60,-24 120,0" fill="none" stroke="'+SIL+'" stroke-width="14"/>')
HELI   = ('<path d="M-130,0 Q-130,-56 -40,-56 L80,-56 Q150,-56 176,-14 L186,2 Q190,26 160,26 L-100,26 Q-130,26 -130,0 Z"/>'
          '<path d="M186,2 L300,-26 L296,-6 L196,20 Z"/>'
          '<rect x="-16" y="-96" width="22" height="42" rx="6"/>'
          '<path d="M-230,-96 L240,-96" stroke="'+SIL+'" stroke-width="16"/>'
          '<path d="M-110,56 L130,56 M-80,26 l-20,30 M100,26 l20,30" stroke="'+SIL+'" stroke-width="13"/>')
CAR    = ('<path d="M-220,34 Q-210,-10 -150,-14 L-80,-66 Q-30,-96 60,-92 L140,-66 Q210,-44 224,-8 '
          'Q232,24 206,34 Z"/>'
          '<path d="M-96,-22 L-44,-66 Q-10,-82 50,-80 L112,-58 L130,-22 Z" fill="'+SKY+'"/>'
          '<circle cx="-126" cy="38" r="48"/><circle cx="130" cy="38" r="48"/>'
          '<circle cx="-126" cy="38" r="20" fill="'+SKY+'"/><circle cx="130" cy="38" r="20" fill="'+SKY+'"/>')
MOTO   = ('<circle cx="-140" cy="30" r="66" fill="none" stroke="'+SIL+'" stroke-width="20"/>'
          '<circle cx="140" cy="30" r="66" fill="none" stroke="'+SIL+'" stroke-width="20"/>'
          '<path d="M-140,30 L-40,-40 L60,-40 L140,30" fill="none" stroke="'+SIL+'" stroke-width="20"/>'
          '<path d="M-40,-40 L-20,30 L120,20" fill="none" stroke="'+SIL+'" stroke-width="18"/>'
          '<path d="M-56,-66 L24,-66 L74,-44" fill="none" stroke="'+SIL+'" stroke-width="18"/>'
          '<path d="M-10,-54 q50,-18 80,6" fill="none" stroke="'+SIL+'" stroke-width="16"/>')
COP    = ('<path d="M-224,36 Q-214,-6 -156,-12 L-90,-62 Q-40,-88 54,-84 L136,-60 Q206,-40 220,-6 '
          'Q228,26 202,36 Z"/>'
          '<path d="M-100,-20 L-52,-62 Q-16,-76 46,-74 L108,-54 L126,-20 Z" fill="'+SKY+'"/>'
          '<rect x="-56" y="-116" width="112" height="30" rx="10"/>'
          '<rect x="-52" y="-112" width="48" height="22" rx="7" fill="#ff3b30"/>'
          '<rect x="6" y="-112" width="46" height="22" rx="7" fill="#3fa9f5"/>'
          '<circle cx="-130" cy="40" r="48"/><circle cx="126" cy="40" r="48"/>'
          '<circle cx="-130" cy="40" r="20" fill="'+SKY+'"/><circle cx="126" cy="40" r="20" fill="'+SKY+'"/>')
PISTOL = ('<path d="M-170,-50 L150,-50 L150,-4 L60,-4 L50,30 Q40,86 -20,96 L-70,100 L-40,26 '
          'L-40,-4 L-170,-4 Z"/>'
          '<rect x="112" y="-74" width="26" height="24" rx="5"/>')
RIFLE  = ('<path d="M-250,-26 L120,-26 L120,2 L-40,2 L-40,20 L-96,20 L-96,2 L-250,2 Z"/>'
          '<path d="M120,-26 L228,-26 L228,-8 L120,-8 Z"/>'
          '<path d="M-46,20 Q-30,86 -96,96 L-130,98 L-104,24 Z"/>'
          '<path d="M-10,-26 q10,-54 56,-56 l6,22 q-32,4 -38,34 Z"/>'
          '<rect x="-210" y="-54" width="80" height="22" rx="7"/>')
BAG    = ('<path d="M-104,-30 Q-160,120 100,120 Q160,120 104,-30 Z"/>'
          '<path d="M-62,-40 L62,-40 L34,-84 L-34,-84 Z"/>'
          '<text x="0" y="86" font-weight="900" font-size="128" fill="'+SKY+'" text-anchor="middle">$</text>')
CASH   = ('<g transform="rotate(-8)"><rect x="-170" y="-40" width="340" height="122" rx="12"/>'
          '<rect x="-150" y="-22" width="300" height="86" rx="8" fill="none" stroke="'+SKY+'" stroke-width="9"/>'
          '<circle cx="0" cy="21" r="34" fill="'+SKY+'"/></g>'
          '<g transform="translate(0 96) rotate(5)"><rect x="-170" y="-40" width="340" height="112" rx="12"/>'
          '<rect x="-150" y="-22" width="300" height="78" rx="8" fill="none" stroke="'+SKY+'" stroke-width="9"/></g>')
CHUTE  = ('<path d="M-200,-10 Q-200,-170 0,-170 Q200,-170 200,-10 Q120,-54 60,-10 Q0,-56 -60,-10 Q-120,-54 -200,-10 Z"/>'
          '<path d="M-190,-6 L-20,96 M-60,-8 L-14,96 M60,-8 L14,96 M190,-6 L20,96" stroke="'+SIL+'" stroke-width="10"/>'
          '<circle cx="0" cy="124" r="36"/><rect x="-16" y="150" width="32" height="56" rx="12"/>')
JETSKI = ('<path d="M-190,34 Q-120,-16 10,-16 L150,-16 Q200,-16 196,22 L176,64 L-160,64 Z"/>'
          '<path d="M-10,-16 L40,-72 L96,-72 L110,-16 Z"/>'
          '<circle cx="40" cy="-104" r="34"/>'
          '<path d="M-250,86 q60,-22 120,0 q60,22 120,0 q60,-22 120,0" fill="none" stroke="'+SIL+'" stroke-width="14"/>')
CART   = ('<rect x="-150" y="-10" width="280" height="70" rx="12"/>'
          '<rect x="-60" y="-104" width="30" height="96"/><rect x="92" y="-104" width="30" height="96"/>'
          '<rect x="-96" y="-150" width="250" height="34" rx="10"/>'
          '<rect x="-120" y="-70" width="60" height="60" rx="8"/>'
          '<circle cx="-96" cy="78" r="44"/><circle cx="92" cy="78" r="44"/>'
          '<circle cx="-96" cy="78" r="18" fill="'+SKY+'"/><circle cx="92" cy="78" r="18" fill="'+SKY+'"/>')
ANGLER = ('<circle cx="-70" cy="-120" r="38"/>'
          '<path d="M-110,-76 L-30,-76 L-14,40 L-124,40 Z"/>'
          '<path d="M-124,40 l-18,96 l34,0 l16,-70 l16,70 l34,0 l-18,-96 Z"/>'
          '<path d="M-36,-96 L210,-200" stroke="'+SIL+'" stroke-width="12"/>'
          '<path d="M210,-200 q30,80 -10,130" fill="none" stroke="'+SIL+'" stroke-width="7"/>'
          '<path d="M196,-66 l24,-18 l0,36 Z"/>')
SKYLINE= ('<rect x="-250" y="-40" width="62" height="190"/><rect x="-176" y="-130" width="54" height="280"/>'
          '<rect x="-110" y="-74" width="70" height="224"/><rect x="-28" y="-186" width="60" height="336"/>'
          '<rect x="44" y="-104" width="66" height="254"/><rect x="122" y="-16" width="54" height="166"/>'
          '<rect x="188" y="-130" width="58" height="280"/>'
          + "".join(f'<rect x="{x}" y="{y}" width="12" height="16" fill="{Y}"/>'
                    for x, y in [(-166,-104),(-140,-104),(-166,-60),(-18,-160),(8,-160),(-18,-112),(8,-112),
                                 (54,-78),(80,-78),(54,-34),(198,-104),(224,-104),(198,-60),(-100,-48),(-74,-48)]))
DOLPHIN= ('<path d="M-180,70 Q-120,-40 10,-70 Q120,-96 190,-50 Q140,-40 110,-6 Q70,44 -30,70 Z"/>'
          '<path d="M20,-64 L60,-140 L96,-78 Z"/>'
          '<path d="M-180,70 l-80,-30 l30,56 l-18,56 Z"/>'
          '<circle cx="152" cy="-50" r="8" fill="#ffc72c"/>')
CRAB   = ('<ellipse cx="0" cy="20" rx="130" ry="84"/>'
          '<path d="M-130,-10 q-70,-40 -120,-10 q50,10 60,40 q-60,-6 -66,30 q60,-26 126,-16 Z"/>'
          '<path d="M130,-10 q70,-40 120,-10 q-50,10 -60,40 q60,-6 66,30 q-60,-26 -126,-16 Z"/>'
          '<circle cx="-46" cy="-30" r="14" fill="'+Y+'"/><circle cx="46" cy="-30" r="14" fill="'+Y+'"/>'
          '<path d="M-96,96 l-30,52 M-34,104 l-14,56 M34,104 l14,56 M96,96 l30,52" stroke="'+SIL+'" stroke-width="15"/>')
STORM  = ('<path d="M-170,-70 Q0,-140 170,-70 Q40,-60 20,10 Q120,-20 160,40 Q0,110 -150,40 '
          'Q-20,30 -10,-30 Q-110,-10 -170,-70 Z"/>'
          '<circle cx="4" cy="-14" r="34" fill="'+SKY+'"/>'
          '<path d="M-60,120 l50,0 l-30,54 l56,-6 l-80,96 l22,-76 l-46,6 Z" fill="'+Y+'"/>')
PALMS  = ('<g transform="translate(-130 120)"><path d="M0,0 q14,-130 -8,-220" stroke="#241508" stroke-width="26" fill="none"/>'
          + "".join(f'<path d="M-8,-220 q{56*math.cos(a/57.3):.0f},{-56*math.sin(a/57.3):.0f} '
                    f'{124*math.cos(a/57.3):.0f},{-124*math.sin(a/57.3)+40:.0f}" stroke="#241508" '
                    f'stroke-width="25" fill="none" stroke-linecap="round"/>' for a in (20,64,116,160))
          + '</g>'
          '<g transform="translate(140 140) scale(.76)"><path d="M0,0 q14,-130 -8,-220" stroke="#241508" stroke-width="26" fill="none"/>'
          + "".join(f'<path d="M-8,-220 q{56*math.cos(a/57.3):.0f},{-56*math.sin(a/57.3):.0f} '
                    f'{124*math.cos(a/57.3):.0f},{-124*math.sin(a/57.3)+40:.0f}" stroke="#241508" '
                    f'stroke-width="25" fill="none" stroke-linecap="round"/>' for a in (20,64,116,160))
          + '</g>')

ITEMS = [
 ("A01","Iguana hunt",    g(IGUANA,500,450,.92), "IGUANA SEASON"),
 ("A02","Gator",          g(GATOR,500,455,.92),  "IN GATORS WE TRUST"),
 ("A03","Flamingo",       g(FLAM,520,470,.78),   "PRETTY AND DANGEROUS"),
 ("A04","Shark",          g(SHARK,500,470,1.05), "SWIM AT YOUR OWN RISK"),
 ("A05","Marlin",         g(MARLIN,490,460,.92), "THE BIG ONE GOT AWAY"),
 ("A06","Pelican",        g(PELICAN,520,460,.86),"WATCH YOUR LUNCH"),
 ("A07","Python",         g(PYTHON,500,470,.90), "SOMETHING IN THE GRASS"),
 ("A08","Manatee",        g(MANATEE,510,470,.86),"SLOW DOWN, SEA COW"),
 ("A09","Airboat",        g(AIRBOAT,490,450,.86),"NO ROADS NEEDED"),
 ("A10","Speedboat",      g(BOAT,500,450,.88),   "OUTRUN THE COAST GUARD"),
 ("A11","Helicopter",     g(HELI,480,440,.84),   "EYES IN THE SKY"),
 ("A12","Sports car",     g(CAR,500,460,.86),    "BORROWED, NOT STOLEN"),
 ("A13","Motorcycle",     g(MOTO,500,460,.90),   "TWO WHEELS, NO FEAR"),
 ("A14","Police chase",   g(COP,500,460,.86),    "FIVE STARS OR NOTHING"),
 ("A15","Pistol",         g(PISTOL,500,470,.92), "AIM SMALL, MISS SMALL"),
 ("A16","Rifle",          g(RIFLE,500,470,.88),  "COME BACK WITH CLIPS"),
 ("A17","Money bag",      g(BAG,500,440,.96),    "CRIME PAYS WEEKLY"),
 ("A18","Cash stack",     g(CASH,500,430,.88),   "SPEND IT ON THE BOAT"),
 ("A19","Parachute",      g(CHUTE,500,440,.84),  "LOOK DOWN, SEND IT"),
 ("A20","Jet ski",        g(JETSKI,500,460,.92), "SALT IN THE THROTTLE"),
 ("A21","Golf cart",      g(CART,500,450,.80),   "SNOWBIRD SPEED LIMIT"),
 ("A22","Fishing",        g(ANGLER,520,470,.84), "GONE FISHING"),
 ("A23","Vice City",      g(SKYLINE,500,500,.80),"LIVE FROM VICE CITY"),
 ("A24","Dolphin",        g(DOLPHIN,500,470,.88),"SMARTER THAN YOU"),
 ("A25","Stone crab",     g(CRAB,500,460,.80),   "STONE CRAB SEASON"),
 ("A26","Hurricane",      g(STORM,500,450,.86),  "RIDE OUT THE STORM"),
 ("A27","Palms",          g(PALMS,500,520,.92),  "SUN, CRIME, REPEAT"),
]
for n, label, subj, bot in ITEMS:
    seal(n, subj, bot)
open("series/list.txt","w").write("\n".join(n for n,_,_,_ in ITEMS))
html = ('<body style="margin:0;background:#ececec;font:600 15px system-ui;display:grid;'
        'grid-template-columns:repeat(6,240px);gap:20px;padding:22px">'
        + "".join(f'<div><img src="series/{n}.svg" width="222" style="border-radius:50%;display:block">'
                  f'<div style="display:flex;gap:8px;align-items:center;margin-top:6px">'
                  f'<img src="series/{n}.svg" width="42" style="border-radius:50%">'
                  f'<span>{n}<br><span style="font-weight:400;font-size:13px">{l}</span></span></div></div>'
                  for n,l,_,_ in ITEMS) + '</body>')
open("series.html","w").write(html)
print(len(ITEMS), "activity seals")
