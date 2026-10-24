import math, sys
def ticks(cx, cy, r, color):
    out=[]
    for i in range(12):
        a=math.radians(i*30)
        big = i % 3 == 0
        r1 = r-(70 if big else 46); r2 = r-22
        w = 26 if big else 14
        x1,y1=cx+r1*math.sin(a),cy-r1*math.cos(a); x2,y2=cx+r2*math.sin(a),cy-r2*math.cos(a)
        out.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{color}" stroke-width="{w}" stroke-linecap="round"/>')
    return '\n'.join(out)

def thumb(hand, cuff, outline):
    # Thumbs-up centred on the clock: a short, chunky thumb points to 12; the fist sits below the centre.
    return f"""
    <g stroke="{outline}" stroke-width="16" stroke-linejoin="round">
      <rect x="318" y="520" width="96" height="246" rx="20" fill="{cuff}"/>
      <path d="M 446 552 L 446 352 Q 446 286 506 286 Q 566 286 566 352 L 566 470 Z" fill="{hand}"/>
      <rect x="408" y="470" width="236" height="296" rx="54" fill="{hand}"/>
      <rect x="560" y="478" width="150" height="70" rx="35" fill="{hand}"/>
      <rect x="560" y="550" width="160" height="70" rx="35" fill="{hand}"/>
      <rect x="560" y="622" width="152" height="70" rx="35" fill="{hand}"/>
      <rect x="552" y="694" width="134" height="68" rx="34" fill="{hand}"/>
    </g>"""

def icon(bg, face, rim, tickc, hand, cuff, outline, bg2=None):
    grad = ''
    fill = bg
    if bg2:
        grad = f'<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{bg}"/><stop offset="1" stop-color="{bg2}"/></linearGradient></defs>'
        fill = 'url(#g)'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  {grad}
  <rect width="1024" height="1024" fill="{fill}"/>
  <circle cx="512" cy="512" r="392" fill="{face}" stroke="{rim}" stroke-width="34"/>
  {ticks(512, 512, 392, tickc)}
  {thumb(hand, cuff, outline)}
</svg>'''

variants = {
  'a-sunny':  icon('#ffb238', '#fffaf0', '#1f3b73', '#1f3b73', '#ffcf6b', '#1f3b73', '#1f3b73'),
  'b-navy':   icon('#1f3b73', '#ffffff', '#ffcf3a', '#1f3b73', '#ffcf3a', '#5b8def', '#1f3b73'),
  'd-green':  icon('#2f9e6a', '#ffffff', '#16533a', '#16533a', '#ffd166', '#16533a', '#16533a'),
}
for k,v in variants.items():
    open(f'{sys.argv[1]}/{k}.svg','w').write(v)
