import sys, math
F = sys.argv[1]
D = (f'<style>@font-face{{font-family:O;src:url(data:font/woff2;base64,{F}) format("woff2");font-weight:100 900}}'
     f'text{{font-family:O,sans-serif}}</style>'
     '<path id="t" d="M150,500 A350,350 0 0 1 850,500"/>'
     '<path id="b" d="M170,500 A330,330 0 0 0 830,500"/>')
Y="#ffc72c"; DRED="#b3261e"; G="#00704a"; W="#fff"; R="#ff3b30"; K="#15191c"
CRM="#fff4e0"; SIL="#241508"; GOLD="#d4af37"
N1="#140a26"; N2="#43206e"; PINK="#ff3d8b"; VIO="#a24dff"
SW1="#24381f"; SW2="#5d7f37"; MIST="#d8e6c0"
SEA1="#07314a"; SEA2="#1f7fa0"
SL1="#333c47"; SL2="#78848f"
CY="#5ec8ea"; TURQ="#17a2b8"
BZ1="#5e1200"; BZ2="#ff7a1a"
DW1="#ffb3c9"; DW2="#b58be0"
ASPH="#262a2e"

def grad(i,a,b,c=None):
    s=f'<linearGradient id="{i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{a}"/>'
    if c: s+=f'<stop offset=".55" stop-color="{b}"/><stop offset="1" stop-color="{c}"/>'
    else: s+=f'<stop offset="1" stop-color="{b}"/>'
    return s+'</linearGradient>'
def rnd(n,seed,lo,hi):
    out=[];x=seed
    for _ in range(n):
        x=(1103515245*x+12345)%2147483648; out.append(lo+(x%(hi-lo)))
    return out

# ---------------- scenes ----------------
def sc_sunset():
    rays="".join(f'<path d="M500,470 L{500+460*math.cos(a/57.3):.0f},{470-460*math.sin(a/57.3):.0f} '
                 f'L{500+460*math.cos((a+8)/57.3):.0f},{470-460*math.sin((a+8)/57.3):.0f}z" fill="{Y}" opacity=".42"/>'
                 for a in range(14,170,16))
    return (grad("s","#ff8a3c","#ffb347"),
      f'<rect x="150" y="150" width="700" height="700" fill="url(#s)"/>{rays}'
      f'<circle cx="500" cy="470" r="92" fill="{CRM}"/>'
      f'<rect x="150" y="620" width="700" height="240" fill="{TURQ}"/>'
      f'<path d="M150,620 q170,-28 350,0 q170,28 350,0 l0,38 q-170,28 -350,0 q-170,-28 -350,0z" fill="#f2d9a0"/>')
def sc_night():
    st="".join(f'<circle cx="{x}" cy="{y}" r="{3+(x%3)}" fill="{CRM}" opacity=".85"/>'
               for x,y in zip(rnd(16,7,180,820),rnd(16,13,180,520)))
    sky="".join(f'<rect x="{x}" y="{620-h}" width="{w}" height="{h}" fill="{N1}"/>'
                for x,w,h in [(200,54,120),(262,40,180),(310,66,140),(384,48,210),(440,58,160),
                              (506,44,190),(558,62,130),(628,50,175),(686,56,115),(750,46,150)])
    return (grad("s",N1,N2,"#7a2d8f"),
      f'<rect x="150" y="150" width="700" height="700" fill="url(#s)"/>{st}'
      f'<circle cx="690" cy="300" r="66" fill="{CRM}"/><circle cx="664" cy="286" r="58" fill="url(#s)"/>'
      f'{sky}<rect x="150" y="620" width="700" height="240" fill="#1b0f33"/>'
      f'<path d="M330,640 h40 v180 h-40z M470,650 h30 v170 h-30z M620,642 h36 v178 h-36z" fill="{PINK}" opacity=".3"/>')
def sc_swamp():
    mist="".join(f'<rect x="150" y="{y}" width="700" height="{h}" fill="{MIST}" opacity=".16"/>'
                 for y,h in [(430,34),(492,26),(548,30)])
    cat="".join(f'<g transform="translate({x} 640)"><path d="M0,0 v-130" stroke="{SIL}" stroke-width="7"/>'
                f'<rect x="-9" y="-178" width="18" height="52" rx="9" fill="{SIL}"/></g>'
                for x in (214,250,790,758,730))
    return (grad("s",SW1,SW2,"#9bb36a"),
      f'<rect x="150" y="150" width="700" height="700" fill="url(#s)"/>{mist}'
      f'<rect x="150" y="640" width="700" height="220" fill="#1d3426"/>'
      f'<path d="M150,660 q110,-14 220,0 q110,14 220,0 q110,-14 220,0" fill="none" stroke="{MIST}" stroke-width="7" opacity=".4"/>{cat}')
def sc_water():
    bub="".join(f'<circle cx="{x}" cy="{y}" r="{6+(x%9)}" fill="{CRM}" opacity=".3"/>'
                for x,y in zip(rnd(12,3,200,800),rnd(12,29,250,780)))
    shaft="".join(f'<path d="M{x},150 l70,0 l-130,700 l-70,0z" fill="{CRM}" opacity=".10"/>' for x in (300,470,650))
    return (grad("s",SEA2,SEA1),
      f'<rect x="150" y="150" width="700" height="700" fill="url(#s)"/>{shaft}{bub}'
      f'<path d="M150,790 q90,-26 180,0 q90,26 180,0 q90,-26 180,0 q90,26 180,0 l0,70 l-720,0z" fill="#04202f"/>')
def sc_storm():
    rain="".join(f'<path d="M{x},{y} l-16,54" stroke="{CRM}" stroke-width="5" opacity=".45"/>'
                 for x,y in zip(rnd(26,11,170,860),rnd(26,17,170,700)))
    return (grad("s",SL1,SL2),
      f'<rect x="150" y="150" width="700" height="700" fill="url(#s)"/>'
      f'<ellipse cx="420" cy="300" rx="190" ry="74" fill="#2a323c"/><ellipse cx="610" cy="276" rx="150" ry="62" fill="#2a323c"/>'
      f'{rain}<path d="M560,340 l-54,120 l46,0 l-40,116 l118,-150 l-52,0 l40,-86z" fill="{Y}"/>'
      f'<rect x="150" y="700" width="700" height="160" fill="#20262e"/>')
def sc_noon():
    return (grad("s",CY,"#bfeaf7"),
      f'<rect x="150" y="150" width="700" height="700" fill="url(#s)"/>'
      f'<circle cx="700" cy="286" r="62" fill="{CRM}"/>'
      f'<rect x="150" y="600" width="700" height="260" fill="{TURQ}"/>'
      f'<path d="M150,600 q170,-26 350,0 q170,26 350,0 l0,44 q-170,26 -350,0 q-170,-26 -350,0z" fill="#f6e4b8"/>'
      f'<rect x="150" y="644" width="700" height="216" fill="#f2d9a0"/>')
def sc_blaze():
    sm="".join(f'<circle cx="{x}" cy="{y}" r="{40+(x%50)}" fill="{K}" opacity=".22"/>'
               for x,y in zip(rnd(9,5,220,780),rnd(9,23,200,460)))
    return (f'<radialGradient id="s" cx="50%" cy="68%"><stop offset="0" stop-color="{Y}"/>'
            f'<stop offset=".5" stop-color="{BZ2}"/><stop offset="1" stop-color="{BZ1}"/></radialGradient>',
      f'<rect x="150" y="150" width="700" height="700" fill="url(#s)"/>{sm}')
def sc_dawn():
    return (grad("s",DW2,DW1,"#ffd9a0"),
      f'<rect x="150" y="150" width="700" height="700" fill="url(#s)"/>'
      f'<circle cx="500" cy="560" r="110" fill="{CRM}" opacity=".9"/>'
      f'<rect x="150" y="620" width="700" height="240" fill="#8fa8d8"/>'
      f'<path d="M150,660 q100,-16 200,0 q100,16 200,0 q100,-16 200,0 q100,16 200,0" fill="none" stroke="{CRM}" stroke-width="8" opacity=".55"/>')
def sc_asphalt():
    sp="".join(f'<circle cx="{x}" cy="{y}" r="2.6" fill="{CRM}" opacity=".2"/>'
               for x,y in zip(rnd(60,19,170,840),rnd(60,31,170,840)))
    return ("", f'<rect x="150" y="150" width="700" height="700" fill="{ASPH}"/>{sp}'
      f'<rect x="150" y="492" width="700" height="14" fill="{Y}" opacity=".9"/>'
      f'<rect x="150" y="534" width="700" height="14" fill="{Y}" opacity=".9"/>')
def sc_crate():
    rays="".join(f'<path d="M500,500 L{500+480*math.cos(a/57.3):.0f},{500-480*math.sin(a/57.3):.0f} '
                 f'L{500+480*math.cos((a+11)/57.3):.0f},{500-480*math.sin((a+11)/57.3):.0f}z" fill="{Y}" opacity=".35"/>'
                 for a in range(0,360,24))
    return ("", f'<rect x="150" y="150" width="700" height="700" fill="{CRM}"/>{rays}'
      f'<rect x="150" y="300" width="700" height="22" fill="{DRED}"/>'
      f'<rect x="150" y="690" width="700" height="22" fill="{DRED}"/>')

SCENES={"sunset":sc_sunset,"night":sc_night,"swamp":sc_swamp,"water":sc_water,"storm":sc_storm,
        "noon":sc_noon,"blaze":sc_blaze,"dawn":sc_dawn,"asphalt":sc_asphalt,"crate":sc_crate}

def seal(name, scene, subject, bot, ring, arc, inner=CRM):
    defs, bg = SCENES[scene]()
    L=len(bot); fs=58 if L<=18 else (50 if L<=22 else 43); ls=8 if L<=18 else 5
    body=(f'<circle cx="500" cy="500" r="500" fill="{ring}"/>'
          f'<circle cx="500" cy="500" r="470" fill="none" stroke="{arc}" stroke-width="10"/>'
          f'<circle cx="500" cy="500" r="330" fill="{inner}"/>'
          f'<clipPath id="ci"><circle cx="500" cy="500" r="330"/></clipPath>'
          f'<g clip-path="url(#ci)">{bg}{subject}</g>'
          f'<circle cx="500" cy="500" r="330" fill="none" stroke="{arc}" stroke-width="10"/>'
          f'<circle cx="136" cy="548" r="16" fill="{arc}"/><circle cx="864" cy="548" r="16" fill="{arc}"/>'
          f'<text font-weight="900" font-size="74" fill="{arc}" letter-spacing="6" text-anchor="middle">'
          f'<textPath href="#t" startOffset="50%"><tspan dy="-34">LIVE FROM LEONIDA</tspan></textPath></text>'
          f'<text font-weight="900" font-size="{fs}" fill="{arc}" letter-spacing="{ls}" text-anchor="middle">'
          f'<textPath href="#b" startOffset="50%"><tspan dy="88">{bot}</tspan></textPath></text>')
    open(f"series2/{name}.svg","w").write(
      f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">'
      f'<defs>{D}{defs}</defs>{body}</svg>')

def g(d,x=500,y=470,s=1.0,f=SIL): return f'<g transform="translate({x} {y}) scale({s})" fill="{f}">{d}</g>'
def live(c=G,t=W,y=712):
    return (f'<rect x="352" y="{y}" width="296" height="84" rx="13" fill="{c}" stroke="{W}" stroke-width="8"/>'
            f'<circle cx="400" cy="{y+42}" r="15" fill="{R}"/>'
            f'<text x="545" y="{y+69}" font-weight="900" font-size="62" fill="{t}" text-anchor="middle" letter-spacing="4">LIVE</text>')

# ---------------- subjects ----------------
ORANGE=('<circle cx="0" cy="0" r="150"/><circle cx="-52" cy="-56" r="40" fill="#ffd9a0" opacity=".5"/>'
 '<path d="M10,-150 q46,-78 136,-66 q-34,76 -136,66z" fill="#2e8b3a"/>'
 '<circle cx="56" cy="36" r="26" fill="#5e1200"/><circle cx="56" cy="36" r="13" fill="#2a0800"/>'
 '<path d="M56,62 q-10,46 -34,70" stroke="#5e1200" stroke-width="9" fill="none"/>')
BUFFER="".join(f'<path d="M0,-150 a150,150 0 0,1 0,0" />' for _ in [0])+ "".join(
 f'<rect x="-17" y="-152" width="34" height="62" rx="17" transform="rotate({a})" opacity="{0.25+0.75*i/7:.2f}"/>'
 for i,a in enumerate(range(0,360,45)))
ONAIR=('<rect x="-190" y="-70" width="380" height="140" rx="26"/>'
 '<rect x="-166" y="-46" width="332" height="92" rx="16" fill="#ff3b30"/>'
 '<text x="0" y="28" font-weight="900" font-size="74" fill="#fff" text-anchor="middle" letter-spacing="6">ON AIR</text>'
 '<rect x="-30" y="70" width="60" height="96"/><rect x="-96" y="166" width="192" height="26" rx="12"/>')
SIGNHOLE=('<rect x="-26" y="40" width="52" height="250"/>'
 '<rect x="-230" y="-200" width="460" height="250" rx="18"/>'
 '<rect x="-206" y="-176" width="412" height="202" rx="12" fill="none" stroke="#fff4e0" stroke-width="10"/>'
 '<text x="0" y="-100" font-weight="900" font-size="66" fill="#fff4e0" text-anchor="middle">LEONIDA</text>'
 '<text x="0" y="-26" font-weight="900" font-size="48" fill="#fff4e0" text-anchor="middle">POP. ???</text>'
 '<circle cx="-140" cy="-150" r="19" fill="#5ec8ea"/><circle cx="150" cy="-60" r="15" fill="#5ec8ea"/>'
 '<circle cx="76" cy="-168" r="12" fill="#5ec8ea"/><circle cx="-60" cy="-36" r="16" fill="#5ec8ea"/>')
PELSIGN=('<rect x="-20" y="60" width="40" height="230"/>'
 '<rect x="-180" y="-20" width="360" height="110" rx="14"/>'
 '<text x="0" y="56" font-weight="900" font-size="60" fill="#fff4e0" text-anchor="middle">NO FISHING</text>'
 '<g transform="translate(10 -40)"><ellipse cx="0" cy="-54" rx="86" ry="58"/><circle cx="-62" cy="-150" r="37"/>'
 '<path d="M-92,-142 L-216,-96 q-14,28 18,32 q60,-2 112,-44z"/>'
 '<path d="M-20,2 l-4,24 M22,2 l6,24" stroke="#241508" stroke-width="13"/></g>')
IGSIGN=('<rect x="-20" y="50" width="40" height="250"/>'
 '<rect x="-128" y="-128" width="256" height="256" rx="18" transform="rotate(45)"/>'
 '<text x="0" y="22" font-weight="900" font-size="72" fill="#fff4e0" text-anchor="middle">SLOW</text>'
 '<g transform="translate(-30 -138)"><path d="M-170,22 Q-96,8 -36,6 Q6,2 38,-12 Q62,-24 84,-18 L100,-8 '
 'Q106,0 94,6 L64,16 Q38,32 0,36 Q-68,44 -170,50 Z"/>'
 '<path d="M-48,2 l10,-20 l12,18 l12,-24 l12,22 l14,-26 l12,24 l14,-24 l10,22"/>'
 '<circle cx="90" cy="-10" r="6" fill="#ffc72c"/>'
 '<path d="M-24,38 l-8,40 l18,0 l6,-36z M36,30 l-6,42 l18,0 l4,-38z"/></g>')
CONE=('<path d="M-130,160 L-96,160 L-20,-150 L20,-150 L96,160 L130,160 L130,196 L-130,196 Z"/>'
 '<rect x="-74" y="16" width="148" height="40" fill="#fff4e0"/>'
 '<rect x="-50" y="-84" width="100" height="34" fill="#fff4e0"/>'
 '<g transform="translate(0 -104)"><rect x="-86" y="-14" width="76" height="46" rx="14"/>'
 '<rect x="10" y="-14" width="76" height="46" rx="14"/><rect x="-14" y="0" width="28" height="12"/></g>')
PAYPHONE=('<rect x="-120" y="-200" width="240" height="330" rx="20"/>'
 '<rect x="-94" y="-174" width="188" height="150" rx="10" fill="#fff4e0"/>'
 '<circle cx="0" cy="-100" r="46" fill="#241508"/>'
 + "".join(f'<circle cx="{-46+c*46}" cy="{10+r*44}" r="14" fill="#fff4e0"/>' for r in range(3) for c in range(3))
 + '<path d="M120,-150 q86,0 86,96 q0,96 -86,96" fill="none" stroke="#241508" stroke-width="16"/>'
 '<rect x="176" y="-180" width="54" height="130" rx="26"/>')
CASSETTE=('<rect x="-210" y="-130" width="420" height="260" rx="20"/>'
 '<rect x="-180" y="-104" width="360" height="104" rx="10" fill="#fff4e0"/>'
 '<rect x="-150" y="20" width="300" height="86" rx="12" fill="#fff4e0"/>'
 '<circle cx="-72" cy="62" r="40" fill="#241508"/><circle cx="72" cy="62" r="40" fill="#241508"/>'
 '<circle cx="-72" cy="62" r="15" fill="#fff4e0"/><circle cx="72" cy="62" r="15" fill="#fff4e0"/>'
 '<text x="0" y="-36" font-weight="900" font-size="54" fill="#241508" text-anchor="middle">SIDE A</text>')
DISCO=("".join(f'<circle cx="0" cy="0" r="{r}" fill="none" stroke="#241508" stroke-width="5" opacity=".5"/>' for r in (44,88,132))
 + '<circle cx="0" cy="0" r="150" fill="none" stroke="#241508" stroke-width="10"/>'
 + "".join(f'<path d="M0,0 L{150*math.cos(a/57.3):.0f},{150*math.sin(a/57.3):.0f}" stroke="#241508" stroke-width="5" opacity=".5"/>' for a in range(0,360,30))
 + '<rect x="-8" y="-230" width="16" height="80"/>'
 + "".join(f'<rect x="{x}" y="{y}" width="26" height="26" rx="5" opacity=".85"/>' for x,y in [(-120,-90),(60,-50),(-40,70),(94,60),(-128,30)]))
ROAD=('<path d="M-46,-150 L46,-150 L300,200 L-300,200 Z"/>'
 + "".join(f'<rect x="-9" y="{-120+i*72}" width="18" height="{26+i*8}" fill="#ffc72c"/>' for i in range(5))
 + '<path d="M-300,200 l-60,0 l0,-30 l54,0z M300,200 l60,0 l0,-30 l-54,0z"/>')
TLIGHT=('<rect x="-86" y="-220" width="172" height="400" rx="26"/>'
 '<circle cx="0" cy="-140" r="46" fill="#4a1414"/><circle cx="0" cy="-20" r="46" fill="#5a4a14"/>'
 '<circle cx="0" cy="100" r="54" fill="#2ecc71"/><circle cx="0" cy="100" r="80" fill="#2ecc71" opacity=".3"/>'
 '<rect x="-20" y="180" width="40" height="150"/>')
CAFE=('<path d="M-110,-40 L110,-40 L92,86 Q86,118 48,118 L-48,118 Q-86,118 -92,86 Z"/>'
 '<path d="M106,-16 q70,0 70,56 q0,56 -74,56" fill="none" stroke="#241508" stroke-width="20"/>'
 '<ellipse cx="0" cy="150" rx="168" ry="30"/>'
 '<path d="M-46,-74 q22,-40 0,-80 M0,-74 q22,-40 0,-80 M46,-74 q22,-40 0,-80" fill="none" stroke="#241508" stroke-width="12" stroke-linecap="round"/>')
CONCH=('<path d="M-30,130 Q-190,110 -170,-10 Q-150,-130 -20,-146 Q110,-162 150,-60 Q186,30 96,96 '
 'Q40,138 -30,130 Z"/>'
 '<path d="M-10,96 Q-110,80 -96,-4 Q-82,-82 -6,-94" fill="none" stroke="#8a4a2a" stroke-width="12"/>'
 '<path d="M8,48 Q-46,38 -38,-10" fill="none" stroke="#8a4a2a" stroke-width="10"/>'
 '<path d="M96,96 L220,170 L140,166 Z"/>')
CART=('<g transform="rotate(16)"><path d="M-180,-110 l50,0 l62,210 l266,0 l50,-162 l-350,0" fill="none" stroke="#241508" stroke-width="22"/>'
 + "".join(f'<path d="M{-100+i*62},-62 l16,162" stroke="#241508" stroke-width="12"/>' for i in range(5))
 + '<circle cx="-40" cy="150" r="30"/><circle cx="162" cy="150" r="30"/></g>')
MATTRESS=('<g transform="rotate(-14)"><rect x="-240" y="-96" width="480" height="192" rx="30"/>'
 '<rect x="-214" y="-70" width="428" height="140" rx="20" fill="#fff4e0"/>'
 + "".join(f'<circle cx="{-150+c*100}" cy="{-26+r*52}" r="11" fill="#241508"/>' for r in range(2) for c in range(4))
 + '</g>')
LAWNFLAM=('<g transform="translate(0 -40)"><ellipse cx="0" cy="40" rx="84" ry="54" fill="#ff3d8b"/>'
 '<path d="M-40,-4 q-48,-32 -16,-110 q24,-48 -8,-92" fill="none" stroke="#ff3d8b" stroke-width="24" stroke-linecap="round"/>'
 '<circle cx="-62" cy="-204" r="33" fill="#ff3d8b"/><path d="M-92,-198 q-46,8 -36,44 q16,-24 36,-24z" fill="#241508"/>'
 '<circle cx="-70" cy="-212" r="6" fill="#241508"/></g>'
 '<path d="M-26,54 l-8,196 M24,54 l10,196" stroke="#9aa0a6" stroke-width="13"/>'
 '<path d="M-60,250 l140,0" stroke="#9aa0a6" stroke-width="11"/>')
LIGHTHOUSE=('<path d="M160,-120 L560,-250 L560,10 L160,-20 Z" fill="#ffc72c" opacity=".45"/>'
 '<path d="M-160,-120 L-560,-250 L-560,10 L-160,-20 Z" fill="#ffc72c" opacity=".45"/>'
 '<path d="M-90,230 L-60,-140 L60,-140 L90,230 Z"/>'
 '<rect x="-76" y="-70" width="152" height="46" fill="#fff4e0"/>'
 '<rect x="-72" y="18" width="144" height="46" fill="#fff4e0"/>'
 '<rect x="-66" y="-186" width="132" height="48" rx="8"/>'
 '<circle cx="0" cy="-162" r="22" fill="#ffc72c"/>'
 '<path d="M-44,-186 L0,-240 L44,-186 Z"/>')
BOTTLE=('<g transform="rotate(-20)"><path d="M-40,-190 L40,-190 L40,-110 Q110,-70 110,30 L110,150 '
 'Q110,190 66,190 L-66,190 Q-110,190 -110,150 L-110,30 Q-110,-70 -40,-110 Z" fill="#9ed8c0" opacity=".9"/>'
 '<rect x="-46" y="-226" width="92" height="44" rx="10" fill="#8a5a2a"/>'
 '<rect x="-64" y="-20" width="128" height="150" rx="10" fill="#fff4e0"/>'
 '<path d="M-40,20 h80 M-40,56 h80 M-40,92 h56" stroke="#241508" stroke-width="9"/></g>')
VU=('<path d="M-220,60 A230,230 0 0 1 220,60 Z" fill="none" stroke="#241508" stroke-width="12"/>'
 '<path d="M66,-128 A230,230 0 0 1 220,60 L120,60 Z" fill="#ff3b30"/>'
 '<path d="M-220,60 A230,230 0 0 1 66,-128 L40,60 Z" fill="#fff4e0" opacity=".55"/>'
 '<path d="M0,60 L150,-96" stroke="#241508" stroke-width="16" stroke-linecap="round"/>'
 '<circle cx="0" cy="60" r="26"/>'
 '<rect x="-250" y="76" width="500" height="26" rx="12"/>')
DISH=('<path d="M-30,260 q20,-230 -4,-420" stroke="#5a3a1e" stroke-width="30" fill="none"/>'
 + "".join(f'<path d="M-34,-160 q{60*math.cos(a/57.3):.0f},{-60*math.sin(a/57.3):.0f} '
           f'{130*math.cos(a/57.3):.0f},{-130*math.sin(a/57.3)+44:.0f}" stroke="#2e8b3a" stroke-width="24" '
           f'fill="none" stroke-linecap="round"/>' for a in (18,62,118,162))
 + '<g transform="translate(110 -30) rotate(-24)"><ellipse cx="0" cy="0" rx="106" ry="118" fill="#d8dde2"/>'
 '<ellipse cx="0" cy="0" rx="78" ry="90" fill="#aab2ba"/>'
 '<path d="M0,0 L126,-16" stroke="#5a6068" stroke-width="13"/><circle cx="132" cy="-18" r="20" fill="#5a6068"/></g>')
TRIPOD=('<path d="M0,40 l-150,230 M0,40 l150,230 M0,40 l0,230" stroke="#241508" stroke-width="18"/>'
 '<rect x="-130" y="-78" width="260" height="130" rx="18"/>'
 '<circle cx="24" cy="-14" r="46" fill="#fff4e0"/><circle cx="24" cy="-14" r="24"/>'
 '<rect x="-150" y="-118" width="70" height="44" rx="10"/>'
 '<rect x="-166" y="-30" width="40" height="18" fill="#ff3b30"/>')
SHUTTERS=('<rect x="-240" y="-180" width="480" height="340" rx="14" fill="#6b7785"/>'
 '<rect x="-214" y="-154" width="428" height="288" rx="8" fill="#39424d"/>'
 + "".join(f'<rect x="-206" y="{-146+i*34}" width="412" height="24" rx="6" fill="#8a95a2"/>' for i in range(9))
 + '<g transform="translate(0 210) rotate(-6)"><rect x="-176" y="-40" width="352" height="80" rx="10" fill="#fff4e0"/>'
 '<text x="0" y="22" font-weight="900" font-size="54" fill="#b3261e" text-anchor="middle">BACK SOON</text></g>')
DICE=('<g transform="translate(-110 20) rotate(-12)"><rect x="-100" y="-100" width="200" height="200" rx="34" fill="#fff4e0"/>'
 + "".join(f'<circle cx="{x}" cy="{y}" r="17" fill="#241508"/>' for x,y in [(-50,-50),(50,-50),(0,0),(-50,50),(50,50)])
 + '</g><g transform="translate(120 -40) rotate(14)"><rect x="-86" y="-86" width="172" height="172" rx="30" fill="#ff3b30"/>'
 + "".join(f'<circle cx="{x}" cy="{y}" r="15" fill="#fff4e0"/>' for x,y in [(-44,-44),(44,-44),(-44,44),(44,44),(0,0),(-44,0),(44,0)][:6])
 + '</g>')
THERMO=('<rect x="-40" y="-230" width="80" height="330" rx="40" fill="#fff4e0"/>'
 '<circle cx="0" cy="120" r="86" fill="#ff3b30"/><rect x="-26" y="-180" width="52" height="300" fill="#ff3b30"/>'
 '<path d="M-40,-230 q40,-60 80,0" fill="#fff4e0"/>'
 + "".join(f'<rect x="40" y="{-170+i*52}" width="40" height="9" fill="#241508"/>' for i in range(6))
 + '<path d="M0,-300 l30,56 l-30,-14 l-30,14z" fill="#ffc72c"/>')
PLANE=('<g transform="rotate(-18)"><path d="M-250,-40 L250,-90 L30,110 L-10,10 Z" fill="#fff4e0"/>'
 '<path d="M250,-90 L-10,10 L-60,120 Z" fill="#d8dde2"/>'
 '<path d="M-250,-40 L-10,10 L30,110" fill="none" stroke="#241508" stroke-width="7"/></g>'
 '<path d="M-300,70 q90,-50 190,-20" fill="none" stroke="#fff4e0" stroke-width="9" stroke-dasharray="26 22"/>')
SPRINK=('<rect x="-30" y="60" width="60" height="150" rx="10"/>'
 '<ellipse cx="0" cy="214" rx="130" ry="26"/>'
 '<circle cx="0" cy="46" r="48"/>'
 + "".join(f'<path d="M0,20 q{d*90},-150 {d*230},-60" fill="none" stroke="#9ed8f0" stroke-width="13" '
           f'stroke-linecap="round" opacity=".9"/>' for d in (-1,1))
 + "".join(f'<path d="M0,20 q{d*50},-170 {d*130},-130" fill="none" stroke="#9ed8f0" stroke-width="11" '
           f'stroke-linecap="round" opacity=".75"/>' for d in (-1,1))
 + "".join(f'<circle cx="{x}" cy="{y}" r="9" fill="#9ed8f0"/>' for x,y in [(-250,-60),(250,-56),(-170,-150),(180,-146),(0,-190)]))

ITEMS=[
 ("B01","Citrus crate label","crate",  g(ORANGE,500,500,1.0,"#ff7a1a"),               "PICKED FRESH, SOLD HOT", CRM, DRED),
 ("B02","Buffering sun","sunset",      g(BUFFER,500,440,1.05,CRM)+live(),   "ALWAYS LOADING",         Y,   DRED),
 ("B03","On-air lamp","night",         g(ONAIR,500,440,.86,CRM),            "WHEN IT'S RED, IT'S REAL", N1, Y),
 ("B04","Shot-up town sign","noon",    g(SIGNHOLE,500,420,.80),             "POPULATION: UNVERIFIED", Y,   DRED),
 ("B05","Pelican, no fishing","dawn",  g(PELSIGN,500,440,.88),              "RULES ARE FOR TOURISTS", CRM, DRED),
 ("B06","Iguana on SLOW","swamp",      g(IGSIGN,500,430,.82,"#1a2a14"),               "WHEN IT'S COLD THEY FALL", G, Y),
 ("B07","Cone in shades","noon",       g(CONE,500,450,.92,"#e85d1a"),                 "UNDER CONSTRUCTION",     Y,   DRED),
 ("B08","Pay phone","night",           g(PAYPHONE,480,430,.80,CRM),         "NOBODY'S ANSWERING",     N1,  PINK),
 ("B09","Cassette, side A","night",    g(CASSETTE,500,450,.86,VIO),         "REWIND AND SEND IT",     N1,  Y),
 ("B10","Disco ball moon","night",     g(DISCO,500,420,.94,"#e8e4ff"),            "THE NIGHT IS THE PLAN",  N1,  Y),
 ("B11","Road to the sun","sunset",    g(ROAD,500,520,.92),                 "THE ROAD OWES YOU NOTHING", Y, DRED),
 ("B12","Green light","asphalt",       g(TLIGHT,500,450,.80,CRM),           "GREEN MEANS GO",         Y,   K),
 ("B13","Cafecito","crate",            g(CAFE,500,470,.94),                 "FUELLED BY CAFECITO",    CRM, G),
 ("B14","Conch call","noon",           g(CONCH,490,450,.95,"#f0a07a"),                "BLOW IT AND THEY COME",  CRM, DRED),
 ("B15","Cart in the canal","swamp",   g(CART,500,450,.78),                 "SOMEBODY'S WEDNESDAY",   G,   Y),
 ("B16","Mattress, lane 2","asphalt",  g(MATTRESS,500,470,.84,CRM),         "SECURE YOUR LOAD",       Y,   K),
 ("B17","Lawn flamingo","noon",        g(LAWNFLAM,500,440,.80),             "NOT ALL OF US ARE REAL", CRM, DRED),
 ("B18","Lighthouse","storm",          g(LIGHTHOUSE,500,450,.82,CRM),       "SOMEONE IS WATCHING",    SL1, CRM),
 ("B19","Message in a bottle","water", g(BOTTLE,500,460,.82,CRM),           "SEND IT AND SEE",        SEA1, Y),
 ("B20","VU in the red","night",       g(VU,500,470,.80,CRM),               "ALWAYS IN THE RED",      N1,  Y),
 ("B21","Pirate signal","night",       g(DISH,470,430,.82,CRM),             "PIRATE SIGNAL",          N1,  Y),
 ("B22","Someone has to film","sunset",g(TRIPOD,500,440,.86),               "SOMEBODY HAS TO FILM IT", Y,  DRED),
 ("B23","Shutters up","storm",         g(SHUTTERS,500,430,.80,CRM),         "BE RIGHT BACK",          SL1, CRM),
 ("B24","Roll it","asphalt",           g(DICE,500,470,.84,CRM),             "ROLL IT, LIVE WITH IT",  Y,   K),
 ("B25","Feels like 112","blaze",      g(THERMO,500,440,.80,CRM),           "FEELS LIKE 112",         Y,   BZ1),
 ("B26","Paper plane","dawn",          g(PLANE,500,440,.80,CRM),            "AIM FOR THE ROOFTOPS",   CRM, DRED),
 ("B27","3am sprinkler","night",       g(SPRINK,500,440,.82,CRM),           "EVERY LAWN, EVERY NIGHT", N1, Y),
]
for n,l,sc,su,bot,ring,arc in ITEMS: seal(n,sc,su,bot,ring,arc)
open("series2/list.txt","w").write("\n".join(n for n,*_ in ITEMS))
html=('<body style="margin:0;background:#ececec;font:600 15px system-ui;display:grid;'
      'grid-template-columns:repeat(5,250px);gap:20px;padding:22px">'
      + "".join(f'<div><img src="series2/{n}.svg" width="232" style="border-radius:50%;display:block">'
                f'<div style="display:flex;gap:8px;align-items:center;margin-top:6px">'
                f'<img src="series2/{n}.svg" width="42" style="border-radius:50%">'
                f'<span>{n}<br><span style="font-weight:400;font-size:13px">{l}</span></span></div></div>'
                for n,l,*_ in ITEMS)+'</body>')
open("series2.html","w").write(html)
print(len(ITEMS),"concept seals")
