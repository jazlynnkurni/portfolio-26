#!/usr/bin/env python3
"""JK logo directions for the revamp. Three styles, each a true vector (glyphs converted
to paths with fontTools, no font dependency). Run: python3 make.py -> *.svg, sheet.html, png/."""
from fontTools.ttLib import TTFont, TTCollection
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
import os, subprocess, glob, shutil

CHAR='#1C1A17'; GOLD='#A99939'; OX='#340414'; PAPER='#FAF9F7'

def face(path, want):
    coll=TTCollection(path) if path.endswith('.ttc') else None
    fonts=coll.fonts if coll else [TTFont(path)]
    for f in fonts:
        n=f['name'].getDebugName(4) or ''
        if want.lower() in n.lower(): return f,n
    raise SystemExit(f'no face {want} in {path}: '+', '.join(f['name'].getDebugName(4) for f in fonts))

def glyph(font, ch, scale=1.0, dx=0, dy=0):
    """SVG path d for one character, in a y-down space at the given scale, plus its bounds."""
    cmap=font.getBestCmap(); gs=font.getGlyphSet(); name=cmap[ord(ch)]
    upm=font['head'].unitsPerEm; k=scale*1000/upm
    pen=SVGPathPen(gs); tp=TransformPen(pen,(k,0,0,-k,dx,dy)); gs[name].draw(tp)
    bp=BoundsPen(gs); gs[name].draw(bp); x0,y0,x1,y1=bp.bounds
    adv=gs[name].width*k
    return pen.getCommands(), (x0*k+dx, -y1*k+dy, x1*k+dx, -y0*k+dy), adv

def svg(w,h,inner,vb=None):
    vb=vb or f'0 0 {w} {h}'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{h}">{inner}</svg>'

out={}
# ---------------------------------------------------------------- A. the serif monogram
# Bodoni 72 Bold: hairlines and fat stems, the Didone the reference is drawn in. The K sits
# lower and smaller, its arm tucking under the J's shoulder, the two stems reading as a pair.
F,_=face('/System/Library/Fonts/Supplemental/Bodoni 72.ttc','Bold')
J,jb,_=glyph(F,'J',1.0,0,0); K,kb,_=glyph(F,'K',0.78,0,0)
# place J so its bounds start at (0,0); place K to the right overlapping the J's hook
jx=-jb[0]; jy=-jb[1]; J,jb,_=glyph(F,'J',1.0,jx,jy)
K,kb,_=glyph(F,'K',0.70,0,0)
kx=jb[2]-4; ky=jb[3]-(kb[3]-kb[1])           # -4: the two stems touch and become one ligature
K,kb,_=glyph(F,'K',0.70,kx-kb[0],ky-kb[1])
W=max(jb[2],kb[2]); H=max(jb[3],kb[3]); pad=W*0.12
out['A-monogram']=(W+2*pad,H+2*pad,f'<g transform="translate({pad},{pad})" fill="{{c}}"><path d="{J}"/><path d="{K}"/></g>')

# ---------------------------------------------------------------- B. the badge
# Avenir Next Heavy knocked out of a charcoal rounded rectangle, letters set tight so they
# touch and their counters do the drawing. Corner radius = 1/6 of the height.
F,_=face('/System/Library/Fonts/Avenir Next.ttc','Heavy')
J,jb,ja=glyph(F,'J',1.0,0,0); K,kb,ka=glyph(F,'K',1.0,0,0)
jx=-jb[0]; J,jb,_=glyph(F,'J',1.0,jx,0)
K,kb,_=glyph(F,'K',1.0,jb[2]-kb[0]-22,0)          # -22: pulled in until they touch
x0=min(jb[0],kb[0]); x1=max(jb[2],kb[2]); y0=min(jb[1],kb[1]); y1=max(jb[3],kb[3])
mx=(x1-x0)*0.16; my=(y1-y0)*0.20
W=(x1-x0)+2*mx; H=(y1-y0)+2*my; r=H/6
out['B-badge']=(W,H,f'''<mask id="m"><rect width="{W}" height="{H}" fill="#fff"/><g transform="translate({mx-x0},{my-y0})" fill="#000"><path d="{J}"/><path d="{K}"/></g></mask>
<rect width="{W}" height="{H}" rx="{r}" fill="{{c}}" mask="url(#m)"/>''')

# ---------------------------------------------------------------- C. the signature
# Snell Roundhand Bold as an OUTLINE, no fill, the way the reference is inked: only the
# edge of the stroke, the inside left as paper. Tilted the way a hand writes across a page.
F,_=face('/System/Library/Fonts/Supplemental/SnellRoundhand.ttc','Bold')
J,jb,ja=glyph(F,'J',1.0,0,0)
K,kb,_=glyph(F,'K',1.0,ja*1.02,0)
x0=min(jb[0],kb[0]); x1=max(jb[2],kb[2]); y0=min(jb[1],kb[1]); y1=max(jb[3],kb[3])
sw=(y1-y0)*0.028
W=(x1-x0)*1.30; H=(y1-y0)*1.30
cx=W/2; cy=H/2
out['C-signature']=(W,H,f'''<g transform="rotate(-12 {cx} {cy}) translate({cx-(x0+x1)/2},{cy-(y0+y1)/2})" fill="none" stroke="{{c}}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round"><path d="{J}"/><path d="{K}"/></g>''')

# ---------------------------------------------------------------- write svgs
for name,(w,h,inner) in out.items():
    for cname,c in [('charcoal',CHAR),('gold',GOLD),('oxblood',OX),('paper',PAPER)]:
        open(f'{name}-{cname}.svg','w').write(svg(round(w,1),round(h,1),inner.replace('{c}',c)))
print('svgs:',len(glob.glob('*.svg')))

# ---------------------------------------------------------------- png exports
# One transparent 1024 render per mark and colour through Chrome (over localhost: file://
# hangs headless Chrome on this machine), then sips downscales, which keeps the alpha.
import math, tempfile
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
os.makedirs('png',exist_ok=True)
for name,(w,h,_) in out.items():
    for cname in ['charcoal','paper','gold','oxblood']:
        px=1024; W=math.ceil(px*w/h)
        page=f'<!doctype html><meta charset="utf-8"><style>html,body{{margin:0;background:transparent}}svg{{display:block;height:{px}px;width:{W}px}}</style>'+open(f'{name}-{cname}.svg').read()
        open('png/_p.html','w').write(page); prof=tempfile.mkdtemp()
        big=os.path.abspath(f'png/{name}-{cname}-1024.png')
        try:
            subprocess.run([C,'--headless','--disable-gpu','--hide-scrollbars',f'--user-data-dir={prof}','--default-background-color=00000000',
                            f'--screenshot={big}',f'--window-size={W},{px}','--virtual-time-budget=1200','http://localhost:5330/logos/png/_p.html'],capture_output=True,timeout=40)
        except subprocess.TimeoutExpired: print('timeout',name,cname)
        shutil.rmtree(prof,ignore_errors=True)
        if os.path.exists(big):
            for sz in [512,180,64,32,16]:
                subprocess.run(['sips','-Z',str(sz),big,'--out',os.path.abspath(f'png/{name}-{cname}-{sz}.png')],capture_output=True)
if os.path.exists('png/_p.html'): os.remove('png/_p.html')
print('pngs:',len(glob.glob('png/*.png')))

# ---------------------------------------------------------------- the sheet
def inline(name,c): return open(f'{name}-{c}.svg').read()
def fit(name,c,h):
    """the svg inlined at a given pixel height, width following"""
    import re as _re
    return _re.sub(r'width="[^"]+" height="[^"]+"', f'height="{h}"', open(f'{name}-{c}.svg').read(), count=1)
rows=''
for name,title,note in [('A-monogram','A. The monogram','Bodoni 72 Bold. Hairlines and fat stems, the K tucked under the J. Reads best at 40px and up; at 16px the hairlines go, so the favicon would be the J stem alone.'),
                        ('B-badge','B. The badge','Avenir Next Heavy knocked out of a rounded rectangle. The most durable at small sizes: still a mark at 16px. Radius is height/6, the concentric rule.'),
                        ('C-signature','C. The signature','Snell Roundhand Bold as an outline only. Personal, and the only one that is a line rather than a shape. Needs 32px+ or the loops close.')]:
    w,h,_=out[name]
    sizes=''.join(f'<div class="sz"><div style="height:{px}px">{fit(name,"charcoal",px)}</div><span>{px}px</span></div>' for px in [96,48,24,16])
    cols=''.join(f'<div class="c" style="background:{bg}">{fit(name,c,120)}</div>' for c,bg in [('charcoal',PAPER),('gold',PAPER),('oxblood',PAPER),('paper',CHAR),('gold',CHAR)])
    rows+=f'''<section><div class="hd"><h2>{title}</h2><p>{note}</p></div>
    <div class="big">{fit(name,"charcoal",260)}</div>
    <div class="cols">{cols}</div><div class="sizes">{sizes}</div>
    <div class="nav"><span class="mark">{fit(name,"charcoal",22)}</span><span class="pill"><i></i>Projects<i></i>Playground<i></i>About</span></div></section>'''
open('sheet.html','w').write(f'''<!doctype html><meta charset="utf-8"><title>JK logo directions</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600&display=swap" rel="stylesheet">
<style>body{{margin:0;background:{PAPER};color:{CHAR};font:300 15px/1.55 "Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}}
.wrap{{max-width:1180px;margin:0 auto;padding:64px 30px 96px}} h1{{font:500 30px "Plus Jakarta Sans",sans-serif;letter-spacing:-.012em;margin:0}}
h2{{font:500 20px "Plus Jakarta Sans",sans-serif;letter-spacing:-.012em;margin:0}} .lede{{color:rgba(20,23,27,.66);margin-top:12px;max-width:62ch}}
section{{margin-top:96px;border-top:1px solid rgba(20,23,27,.16);padding-top:32px}} .hd p{{color:rgba(20,23,27,.66);margin:8px 0 0;max-width:62ch}}
.big{{margin-top:32px;display:flex;justify-content:center;padding:48px;border:1px solid rgba(20,23,27,.16)}}
.cols{{display:grid;grid-template-columns:repeat(5,1fr);margin-top:16px}} .c{{display:flex;justify-content:center;align-items:center;height:200px;border:1px solid rgba(20,23,27,.16);margin-left:-1px}}
.sizes{{display:flex;gap:40px;align-items:flex-end;margin-top:24px;padding:24px;border:1px solid rgba(20,23,27,.16)}} .sz{{display:flex;flex-direction:column;align-items:center;gap:10px}} .sz span{{font-size:11px;color:rgba(20,23,27,.42)}} .sz svg{{height:100%;width:auto}}
.nav{{display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding:20px 24px;border:1px solid rgba(20,23,27,.16)}} .mark svg{{display:block}}
.pill{{display:flex;align-items:center;gap:0;background:#fff;border-radius:999px;padding:4px 12px 4px 8px;box-shadow:0 1px 2px rgba(20,23,27,.04),0 6px 20px rgba(20,23,27,.07);font-size:14.5px}} .pill i{{display:inline-block;width:16px}}
.spec{{margin-top:24px;font-size:13px;color:rgba(20,23,27,.66)}} .spec b{{font-weight:400;color:{CHAR}}}</style>
<div class="wrap"><h1>JK, three ways</h1><p class="lede">Each is a real vector (glyphs outlined with fontTools, no font dependency), in charcoal, gold, oxblood and paper. The PNGs in <b>png/</b> are exported at 1024, 512, 180 (Apple touch icon), 64, 32 and 16. The last row of each shows the mark at the size the nav actually uses, 22px tall, beside the pill.</p>
<p class="spec"><b>Sizes to keep in mind.</b> Nav mark: 22px tall. Favicon: 32px and 16px, PNG, plus the SVG for browsers that take it. Apple touch icon: 180px, no transparency, on paper. Open Graph: put the mark at 256px on a 1200x630 paper card. Everything is height-based: set the height, let width follow.</p>
{rows}</div>''')
print('sheet ok')
