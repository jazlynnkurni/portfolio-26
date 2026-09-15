#!/usr/bin/env python3
"""JK marks built from the site's own objects. Run: python3 make2.py -> *.svg, sheet.html, png/.
Every mark is a true vector (glyphs outlined with fontTools), in the two brand faces only."""
from fontTools.ttLib import TTFont, TTCollection
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
from fontTools.varLib.instancer import instantiateVariableFont
import os, subprocess, glob, shutil, math, tempfile, re

CHAR='#1C1A17'; GOLD='#A99939'; OX='#340414'; PAPER='#FAF9F7'; INK='#14171B'
HAIR_A=.16   # the hairline is ink at 16%, exactly the site's --hair

def face(path, want):
    for f in TTCollection(path).fonts:
        if f['name'].getDebugName(4)==want: return f
    raise SystemExit('no face '+want)
HEL=face('/System/Library/Fonts/HelveticaNeue.ttc','Helvetica Neue')
HELM=face('/System/Library/Fonts/HelveticaNeue.ttc','Helvetica Neue Medium')
JAK=instantiateVariableFont(TTFont('fonts/PlusJakartaSans.ttf'),{'wght':600})

def glyph(font, ch, size, dx=0, dy=0):
    """path d + bounds (x0,y0,x1,y1, y down) + advance, for one character at a pixel size"""
    cmap=font.getBestCmap(); gs=font.getGlyphSet(); name=cmap[ord(ch)]
    k=size/font['head'].unitsPerEm
    pen=SVGPathPen(gs); gs[name].draw(TransformPen(pen,(k,0,0,-k,dx,dy)))
    bp=BoundsPen(gs); gs[name].draw(bp); x0,y0,x1,y1=bp.bounds
    return pen.getCommands(), (x0*k+dx,-y1*k+dy,x1*k+dx,-y0*k+dy), gs[name].width*k
def capH(font,size): 
    _,b,_=glyph(font,'H',size); return b[3]-b[1]

def svg(w,h,inner): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}" width="{w:.1f}" height="{h:.1f}">{inner}</svg>'
out={}   # name -> (w,h,inner with {c} = ink colour, {p} = paper/knockout colour, {h} = hairline colour)

# ---------------------------------------------------------------- 1. the cells
# The hero grid, two cells of it. Head rule, foot rule, a stem at each letter's start, the
# right stem closing the row. Cell 40 tall, glyph 34, the same ratio as the site.
H=40; FS=34; R=1.0     # R: rule weight in cell units (1px at the site's 40px cell)
def cells(letters, inked=None, gap=0):
    x=0; parts=[]; cells_=[]
    for i,ch in enumerate(letters):
        d,b,adv=glyph(HEL,ch,FS)
        w=(b[2]-b[0])+FS*.36+gap
        cy=(H-capH(HEL,FS))/2
        dd,_,_=glyph(HEL,ch,FS,x+FS*.18-b[0],cy+capH(HEL,FS))
        cells_.append((x,w)); 
        fill='{p}' if inked==i else '{c}'
        if inked==i: parts.append(f'<rect x="{x:.2f}" y="0" width="{w:.2f}" height="{H}" fill="{{c}}"/>')
        parts.append(f'<path d="{dd}" fill="{fill}"/>')
        x+=w
    W=x
    rules=f'<rect x="0" y="0" width="{W:.2f}" height="{R}" fill="{{h}}"/><rect x="0" y="{H-R}" width="{W:.2f}" height="{R}" fill="{{h}}"/>'
    stems=''.join(f'<rect x="{cx:.2f}" y="0" width="{R}" height="{H}" fill="{{h}}"/>' for cx,_ in cells_)+f'<rect x="{W-R:.2f}" y="0" width="{R}" height="{H}" fill="{{h}}"/>'
    return W,H,rules+stems+''.join(parts)
out['1-cells']=cells('JK')
out['1b-cells-inked']=cells('JK',inked=1)
out['1c-cells-breath']=cells('JK',gap=FS*.9)

# ---------------------------------------------------------------- 2. the tile
# The flicker tile at rest: a square of ink, the letters knocked out of it. The favicon.
def tile(font, size=40, fs=17, square=True):
    dj,bj,aj=glyph(font,'J',fs); dk,bk,ak=glyph(font,'K',fs)
    ch=capH(font,fs); trk=-fs*.02
    W=size; Hh=size
    kx=(bj[2]-bj[0])+trk
    tot=kx+(bk[2]-bk[0])
    x0=(W-tot)/2; y0=(Hh-ch)/2+ch
    dj,_,_=glyph(font,'J',fs,x0-bj[0],y0); dk,_,_=glyph(font,'K',fs,x0+kx-bk[0],y0)
    return W,Hh,f'<rect width="{W}" height="{Hh}" fill="{{c}}"/><path d="{dj}" fill="{{p}}"/><path d="{dk}" fill="{{p}}"/>'
out['2-tile']=tile(HELM)
out['2b-tile-jakarta']=tile(JAK,fs=18)

# ---------------------------------------------------------------- 3. the jakarta mark
# The nav wordmark's face, reduced to two letters, tracked tight so the K's arm reaches the J.
def jak(track=-.05):
    fs=40; dj,bj,aj=glyph(JAK,'J',fs); dk,bk,ak=glyph(JAK,'K',fs)
    kx=(bj[2]-bj[0])+fs*track
    dj,_,_=glyph(JAK,'J',fs,-bj[0],capH(JAK,fs)); dk,bk2,_=glyph(JAK,'K',fs,kx-bk[0],capH(JAK,fs))
    W=bk2[2]; Hh=capH(JAK,fs)
    return W,Hh,f'<path d="{dj}" fill="{{c}}"/><path d="{dk}" fill="{{c}}"/>'
out['3-jakarta']=jak()

# ---------------------------------------------------------------- 4. the rules
# No glyph at all: a J and a K drawn with the grid's own lines, one weight throughout, the
# head and foot rules running over both. The site's construction drawing of its initials.
def rules():
    Hh=40; sw=1.6; top=6; bot=34
    J=f'<path d="M14 {top} V{bot-6} A6 6 0 0 1 2 {bot-6}" />'
    K=f'<path d="M24 {top} V{bot} M38 {top} L24 {top+14} M27 {top+11} L39 {bot}" />'
    W=42
    return W,Hh,(f'<g fill="none" stroke="{{c}}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{J}{K}</g>'
                 f'<rect x="0" y="0" width="{W}" height="1" fill="{{h}}"/><rect x="0" y="{Hh-1}" width="{W}" height="1" fill="{{h}}"/>')
out['4-rules']=rules()

# ---------------------------------------------------------------- 5. the stems
# The grid's stems ARE the letters: J is one stem with a foot, K is a stem and two arms,
# built only from rules of the hairline family, filled, no curves anywhere.
def stems():
    Hh=40; t=5   # t: stroke as a solid bar
    parts=[f'<rect x="12" y="4" width="{t}" height="28" />', f'<rect x="2" y="27" width="15" height="{t}" />',   # J: stem + foot
           f'<rect x="24" y="4" width="{t}" height="32" />',                                                     # K stem
           f'<polygon points="29,20 41,4 41,11 32,22 41,29 41,36" />']                                          # K arms as one wedge
    return 44,Hh,f'<g fill="{{c}}">{"".join(parts)}</g>'
out['5-stems']=stems()

# ---------------------------------------------------------------- write svgs
def render(inner,c,p,h): return inner.replace('{c}',c).replace('{p}',p).replace('{h}',h)
VARS=[('charcoal',INK,PAPER,f'rgba(20,23,27,{HAIR_A})'),('oxblood',OX,PAPER,f'rgba(20,23,27,{HAIR_A})'),('gold',GOLD,INK,f'rgba(20,23,27,{HAIR_A})'),
      ('paper',PAPER,CHAR,f'rgba(250,249,247,{HAIR_A})')]
for name,(w,h,inner) in out.items():
    for v,c,p,hh in VARS: open(f'{name}-{v}.svg','w').write(svg(w,h,render(inner,c,p,hh)))
print('svgs:',len(glob.glob('*.svg')))

# ---------------------------------------------------------------- png exports
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
os.makedirs('png',exist_ok=True)
for name,(w,h,_) in out.items():
    for v in ['charcoal','oxblood','paper']:
        if os.environ.get('SKIP_PNG'): continue
        if os.path.exists(f'png/{name}-{v}-16.png'): continue
        px=1024; W=math.ceil(px*w/h)
        open('png/_p.html','w').write(f'<!doctype html><meta charset="utf-8"><style>html,body{{margin:0;background:transparent}}svg{{display:block;height:{px}px;width:{W}px}}</style>'+open(f'{name}-{v}.svg').read())
        prof=tempfile.mkdtemp(); big=os.path.abspath(f'png/{name}-{v}-1024.png')
        try: subprocess.run([C,'--headless','--disable-gpu','--hide-scrollbars',f'--user-data-dir={prof}','--default-background-color=00000000',f'--screenshot={big}',f'--window-size={W},{px}','--virtual-time-budget=1200','http://localhost:5330/logos/png/_p.html'],capture_output=True,timeout=40)
        except subprocess.TimeoutExpired: print('timeout',name,v)
        shutil.rmtree(prof,ignore_errors=True)
        if os.path.exists(big):
            for sz in [512,180,64,32,16]: subprocess.run(['sips','-Z',str(sz),big,'--out',os.path.abspath(f'png/{name}-{v}-{sz}.png')],capture_output=True)
if os.path.exists('png/_p.html'): os.remove('png/_p.html')
print('pngs:',len(glob.glob('png/*.png')))

# ---------------------------------------------------------------- the sheet
def fit(name,v,h): return re.sub(r'width="[^"]+" height="[^"]+"', f'height="{h}"', open(f'{name}-{v}.svg').read(), count=1)
NOTES=[('1-cells','1. The cells','Two cells of the hero grid, at rest. Helvetica Neue Regular at the site\'s 34/40 ratio, head rule, foot rule, a stem at each start. This is the site itself as a mark. The hairlines are 1/40 of the height, so below 24px they need the inked variant.'),
       ('1b-cells-inked','1b. The cells, one inked','Same object with the K\'s cell inked and the letter knocked out, which is the flicker frozen. Reads at 16px because the tile carries it.'),
       ('1c-cells-breath','1c. The cells, mid-breath','The wide moment of the animation: the same two letters with the stretch left in. Best as a wide mark for the footer or Open Graph, not a favicon.'),
       ('2-tile','2. The tile','The flicker tile alone: a square of ink with JK knocked out, Helvetica Neue Medium. The favicon in this system. Oxblood is the brand version, charcoal the quiet one.'),
       ('2b-tile-jakarta','2b. The tile, Jakarta','The same tile in the nav\'s face, Plus Jakarta Sans 600. Slightly rounder, matches the wordmark exactly.'),
       ('3-jakarta','3. The Jakarta mark','Just the two letters in the wordmark\'s face, tracked in so the K\'s arm reaches the J. No box, no rule. The most conventional and the most portable.'),
       ('4-rules','4. The rules','No glyph. A J and a K drawn with the grid\'s own lines at one weight, the head and foot rules running over both: the site\'s construction drawing of its initials.'),
       ('5-stems','5. The stems','The stems are the letters. Bars only, no curves: J is a stem with a foot, K a stem with one wedge. The most abstract, and the one that survives 16px with nothing lost.')]
rows=''
for name,title,note in NOTES:
    cols=''.join(f'<div class="c" style="background:{bg}">{fit(name,v,72 if "breath" in name else 120)}</div>' for v,bg in [('charcoal',PAPER),('oxblood',PAPER),('gold',PAPER),('paper',CHAR)])
    sizes=''.join(f'<div class="sz"><div style="height:{px}px">{fit(name,"oxblood" if "tile" in name or "inked" in name else "charcoal",px)}</div><span>{px}px</span></div>' for px in [96,48,24,16])
    rows+=f'''<section><div class="hd"><h2>{title}</h2><p>{note}</p></div><div class="big">{fit(name,"charcoal",120 if "breath" in name else 200)}</div>
    <div class="cols">{cols}</div><div class="sizes">{sizes}</div>
    <div class="nav"><span class="mark">{fit(name,"charcoal",22)}</span><span class="pill"><i></i>Projects<i></i>Playground<i></i>About</span></div></section>'''
open('sheet.html','w').write(f'''<!doctype html><meta charset="utf-8"><title>JK marks, from the system</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600&display=swap" rel="stylesheet">
<style>body{{margin:0;background:{PAPER};color:{INK};font:300 15px/1.55 "Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}}
.wrap{{max-width:1180px;margin:0 auto;padding:64px 30px 96px}} h1{{font:500 30px "Plus Jakarta Sans",sans-serif;letter-spacing:-.012em;margin:0}}
h2{{font:500 20px "Plus Jakarta Sans",sans-serif;letter-spacing:-.012em;margin:0}} .lede{{color:rgba(20,23,27,.66);margin-top:12px;max-width:66ch}}
section{{margin-top:96px;border-top:1px solid rgba(20,23,27,.16);padding-top:32px}} .hd p{{color:rgba(20,23,27,.66);margin:8px 0 0;max-width:66ch}}
.big{{margin-top:32px;display:flex;justify-content:center;padding:48px;border:1px solid rgba(20,23,27,.16)}}
.cols{{display:grid;grid-template-columns:repeat(4,1fr);margin-top:16px}} .c{{display:flex;justify-content:center;align-items:center;height:200px;border:1px solid rgba(20,23,27,.16);margin-left:-1px}}
.sizes{{display:flex;gap:40px;align-items:flex-end;margin-top:24px;padding:24px;border:1px solid rgba(20,23,27,.16)}} .sz{{display:flex;flex-direction:column;align-items:center;gap:10px}} .sz span{{font-size:11px;color:rgba(20,23,27,.42)}} .sz svg{{height:100%;width:auto}}
.nav{{display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding:20px 24px;border:1px solid rgba(20,23,27,.16)}} .mark svg{{display:block}}
.pill{{display:flex;align-items:center;background:#fff;border-radius:999px;padding:4px 12px 4px 8px;box-shadow:0 1px 2px rgba(20,23,27,.04),0 6px 20px rgba(20,23,27,.07);font-size:14.5px}} .pill i{{display:inline-block;width:16px}}
.spec{{margin-top:24px;font-size:13px;color:rgba(20,23,27,.66)}} .spec b{{font-weight:400;color:{INK}}}</style>
<div class="wrap"><h1>JK, from the system</h1><p class="lede">Nothing here is borrowed. Every mark is made of the site\'s own objects: the hairline cell with its head rule, foot rule and stems; the inked tile with the letter knocked out; and the two faces the site already sets, Helvetica Neue and Plus Jakarta Sans. Charcoal, oxblood, gold, and paper on charcoal, each a true vector.</p>
<p class="spec"><b>Sizes to keep in mind.</b> Nav mark 22px tall. Favicon 32 and 16 as PNG plus the SVG. Apple touch icon 180 on paper. Open Graph: the mark at 256 on a 1200x630 paper card. Height sets everything, width follows. PNGs are in <b>png/</b> at 1024, 512, 180, 64, 32 and 16, transparent.</p>
{rows}</div>''')
print('sheet ok')
