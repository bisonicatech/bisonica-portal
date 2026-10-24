import sys
sys.argv=['x','.']
exec(open('make.py').read().split("variants = {")[0])
NAVY, YELLOW, BLUE = '#1f3b73', '#ffcf3a', '#5b8def'
def face(scale, bg=None, mono=False):
    hand = '#ffffff' if mono else YELLOW
    cuff = '#ffffff' if mono else BLUE
    outline = '#ffffff' if mono else NAVY
    facec = 'none' if mono else '#ffffff'
    rim = '#ffffff' if mono else YELLOW
    tick = '#ffffff' if mono else NAVY
    t = (1 - scale) * 512
    inner = f'''<circle cx="512" cy="512" r="392" fill="{facec}" stroke="{rim}" stroke-width="34"/>
  {ticks(512, 512, 392, tick)}
  {thumb(hand, cuff, outline)}'''
    bgrect = f'<rect width="1024" height="1024" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">{bgrect}<g transform="translate({t} {t}) scale({scale})">{inner}</g></svg>'
open('out-icon.svg','w').write(face(1.0, bg=NAVY))
open('out-fg.svg','w').write(face(0.62))              # Android adaptive: keep inside the safe zone
open('out-mono.svg','w').write(face(0.62, mono=True))
open('out-splash.svg','w').write(face(1.0))
open('out-bg.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="{NAVY}"/></svg>')
