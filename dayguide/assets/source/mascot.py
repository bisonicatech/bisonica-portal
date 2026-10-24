import math, sys
NAVY, YELLOW, GOLD, CREAM, PINK, RED, WHITE = '#1f3b73', '#ffcf3a', '#e8a817', '#fffaf0', '#ff9e9e', '#e2574c', '#ffffff'
OL = 14  # outline width

def hand(x, y, s):
    """Thumbs-up glove; (x, y) is roughly the centre of the fist, s = scale."""
    return f'''<g transform="translate({x - 519*s:.1f} {y - 600*s:.1f}) scale({s})" stroke="{NAVY}" stroke-width="{OL/s:.1f}" stroke-linejoin="round">
      <rect x="318" y="520" width="104" height="246" rx="30" fill="{WHITE}"/>
      <path d="M 446 552 L 446 352 Q 446 286 506 286 Q 566 286 566 352 L 566 470 Z" fill="{WHITE}"/>
      <rect x="408" y="470" width="236" height="296" rx="54" fill="{WHITE}"/>
      <rect x="560" y="478" width="150" height="70" rx="35" fill="{WHITE}"/>
      <rect x="560" y="550" width="160" height="70" rx="35" fill="{WHITE}"/>
      <rect x="560" y="622" width="152" height="70" rx="35" fill="{WHITE}"/>
      <rect x="552" y="694" width="134" height="68" rx="34" fill="{WHITE}"/>
    </g>'''

def clock(cx, cy, r, legs=False):
    out = []
    # bells, hammer and handle behind the body
    for side in (-1, 1):
        bx, by = cx + side * r * 0.62, cy - r * 0.86
        rot = side * 28
        out.append(f'''<g transform="rotate({rot} {bx:.1f} {by:.1f})" stroke="{NAVY}" stroke-width="{OL}" stroke-linejoin="round">
          <path d="M {bx - r*0.36:.1f} {by + r*0.12:.1f} Q {bx - r*0.36:.1f} {by - r*0.34:.1f} {bx:.1f} {by - r*0.34:.1f} Q {bx + r*0.36:.1f} {by - r*0.34:.1f} {bx + r*0.36:.1f} {by + r*0.12:.1f} Z" fill="{YELLOW}"/>
          <circle cx="{bx:.1f}" cy="{by - r*0.40:.1f}" r="{r*0.07:.1f}" fill="{YELLOW}"/>
        </g>''')
    out.append(f'<rect x="{cx - r*0.05:.1f}" y="{cy - r*1.18:.1f}" width="{r*0.10:.1f}" height="{r*0.22:.1f}" rx="{r*0.04:.1f}" fill="{GOLD}" stroke="{NAVY}" stroke-width="{OL}"/>')
    if legs:
        for side in (-1, 1):
            lx = cx + side * r * 0.42
            out.append(f'<path d="M {lx:.1f} {cy + r*0.8:.1f} L {lx:.1f} {cy + r*1.28:.1f}" stroke="{NAVY}" stroke-width="{r*0.11:.1f}" stroke-linecap="round"/>')
            out.append(f'<ellipse cx="{lx + side*r*0.12:.1f}" cy="{cy + r*1.32:.1f}" rx="{r*0.26:.1f}" ry="{r*0.13:.1f}" fill="{YELLOW}" stroke="{NAVY}" stroke-width="{OL}"/>')
    # body: yellow rim, cream face
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{YELLOW}" stroke="{NAVY}" stroke-width="{OL}"/>')
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{r*0.80:.1f}" fill="{CREAM}" stroke="{NAVY}" stroke-width="{OL*0.8:.1f}"/>')
    # hour marks
    for i in range(12):
        a = math.radians(i * 30); big = i % 3 == 0
        r1, r2 = r * (0.62 if big else 0.68), r * 0.74
        out.append(f'<line x1="{cx + r1*math.sin(a):.1f}" y1="{cy - r1*math.cos(a):.1f}" x2="{cx + r2*math.sin(a):.1f}" y2="{cy - r2*math.cos(a):.1f}" stroke="{NAVY}" stroke-width="{r*(0.045 if big else 0.025):.1f}" stroke-linecap="round"/>')
    # clock hands as happy eyebrows: one each side, raised
    for side in (-1, 1):
        ex = cx + side * r * 0.26
        out.append(f'<path d="M {ex - r*0.12:.1f} {cy - r*0.36 + side*0:.1f} Q {ex:.1f} {cy - r*0.46:.1f} {ex + r*0.12:.1f} {cy - r*0.36:.1f}" fill="none" stroke="{NAVY}" stroke-width="{r*0.045:.1f}" stroke-linecap="round"/>')
    # eyes with shine
    for side in (-1, 1):
        ex = cx + side * r * 0.26
        out.append(f'<ellipse cx="{ex:.1f}" cy="{cy - r*0.14:.1f}" rx="{r*0.085:.1f}" ry="{r*0.12:.1f}" fill="{NAVY}"/>')
        out.append(f'<circle cx="{ex + r*0.03:.1f}" cy="{cy - r*0.18:.1f}" r="{r*0.03:.1f}" fill="{WHITE}"/>')
        out.append(f'<circle cx="{cx + side*r*0.44:.1f}" cy="{cy + r*0.08:.1f}" r="{r*0.08:.1f}" fill="{PINK}" opacity="0.8"/>')
    # big open smile with tongue
    out.append(f'''<path d="M {cx - r*0.30:.1f} {cy + r*0.06:.1f} Q {cx:.1f} {cy + r*0.62:.1f} {cx + r*0.30:.1f} {cy + r*0.06:.1f} Z" fill="{NAVY}" stroke="{NAVY}" stroke-width="{OL*0.6:.1f}" stroke-linejoin="round"/>
      <path d="M {cx - r*0.16:.1f} {cy + r*0.27:.1f} Q {cx:.1f} {cy + r*0.20:.1f} {cx + r*0.16:.1f} {cy + r*0.27:.1f} Q {cx:.1f} {cy + r*0.40:.1f} {cx - r*0.16:.1f} {cy + r*0.27:.1f} Z" fill="{RED}"/>''')
    return '\n'.join(out)

def arm_and_hand(cx, cy, r, hx, hy, hs):
    # arm from the right of the body up to the thumbs-up
    sx, sy = cx + r * 0.92, cy + r * 0.10
    arm = f'<path d="M {sx:.1f} {sy:.1f} Q {sx + r*0.30:.1f} {sy - r*0.05:.1f} {hx - 30*hs*2.2:.1f} {hy + 70*hs*2.2:.1f}" fill="none" stroke="{NAVY}" stroke-width="{r*0.10:.1f}" stroke-linecap="round"/>'
    return arm + hand(hx, hy, hs)

def svg(body, bg=None):
    bgr = f'<rect width="1024" height="1024" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">{bgr}{body}</svg>'

# App icon: big head-and-thumb, navy background
icon = svg(clock(410, 585, 275) + arm_and_hand(410, 585, 275, 790, 455, 0.62), bg=NAVY)
# Full-body mascot: transparent, for the splash screen and store
mascot = svg(clock(440, 480, 240, legs=True) + arm_and_hand(440, 480, 240, 790, 360, 0.52))
d = sys.argv[1]
# Android adaptive foreground: same artwork, no background, shrunk into the safe zone
open(f'{d}/fg.svg', 'w').write(svg('<g transform="translate(195 195) scale(0.62)">' + clock(410, 585, 275) + arm_and_hand(410, 585, 275, 790, 455, 0.62) + '</g>'))
open(f'{d}/icon.svg', 'w').write(icon)
open(f'{d}/mascot.svg', 'w').write(mascot)
