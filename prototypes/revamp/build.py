#!/usr/bin/env python3
"""build.py -- renders the case studies and the 404 into the revamp's design system.
Run:  python3 build.py   (writes work/*.html and soon.html). Edit the DATA, not the output.
Media is served through the images/ and videos/ symlinks into ~/Desktop/portfolio/public."""
import html, os, re, pathlib

# ------------------------------------------------------------------ shared chrome
TOKENS = """
:root{--jak:"Plus Jakarta Sans",sans-serif;--hel:"Helvetica Neue",Helvetica,Arial,sans-serif;
  --gold:#A99939;--oxblood:#340414;--charcoal:#1C1A17}
:root,[data-theme="light"]{--paper:#FAF9F7;--ink:#14171B;--ink2:rgba(20,23,27,.66);--ink3:rgba(20,23,27,.42);
  --hair:rgba(20,23,27,.16);--touch:#340414;--flick-a:#A99939;--flick-b:#340414;--plate:#FAF9F7;
  --outline:oklch(0 0 0 / 0.1);--pill:#fff;--pill-shadow:0 1px 2px rgba(20,23,27,.04),0 6px 20px rgba(20,23,27,.07);color-scheme:light}
[data-theme="dark"]{--paper:#1C1A17;--ink:#FAF9F7;--ink2:rgba(250,249,247,.66);--ink3:rgba(250,249,247,.42);
  --hair:rgba(250,249,247,.16);--touch:#A99939;--flick-a:#A99939;--flick-b:#FAF9F7;--plate:#262320;
  --outline:oklch(1 0 0 / 0.1);--pill:#262320;--pill-shadow:0 1px 2px rgba(0,0,0,.3),0 8px 24px rgba(0,0,0,.35);color-scheme:dark}
"""
BASE = """
html{background:var(--paper);scroll-behavior:smooth}*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--hel);font-weight:300;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
h1,h2,h3,h4{font-family:var(--jak);font-weight:500;letter-spacing:-.012em;text-wrap:balance;margin:0}
p{text-wrap:pretty;margin:0}
a{color:inherit}
.wrap{max-width:1180px;margin:0 auto;padding:0 30px}
.label{font-family:var(--jak);font-weight:600;font-size:10.5px;line-height:1.5;letter-spacing:.15em;text-transform:uppercase;color:var(--ink3)}
/* nav: the pill from index.html, verbatim */
nav{position:fixed;top:0;left:0;right:0;z-index:60;pointer-events:none}
nav .in{display:flex;justify-content:space-between;align-items:center;padding-top:24px;position:relative}
/* THE NAV HAS A GROUND. It is fixed, and headlines scroll up under it, so the mark and the pill sit
   on a band of paper that fades out below them; the content dims into it instead of crashing. */
nav::before{content:"";position:absolute;left:0;right:0;top:0;height:104px;pointer-events:none;
  background:linear-gradient(var(--paper) 46%,color-mix(in srgb,var(--paper) 70%,transparent) 72%,transparent);
  -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);-webkit-mask:linear-gradient(#000 50%,transparent);mask:linear-gradient(#000 50%,transparent);
  opacity:0;transition:opacity .3s ease}
nav.grounded::before{opacity:1}

nav .mark{pointer-events:auto;font-family:var(--jak);font-weight:600;font-size:13px;letter-spacing:-.01em;padding:10px 0;text-decoration:none;color:var(--ink)}

nav .links{pointer-events:auto;display:flex;align-items:center;gap:8px;background:var(--pill);border-radius:999px;
  padding:4px 12px 4px 8px;box-shadow:var(--pill-shadow)}
[data-theme="dark"] nav .links{outline:1px solid var(--outline);outline-offset:-1px}
nav a.l{font-family:var(--hel);font-weight:400;font-size:14.5px;color:var(--ink);text-decoration:none;
  padding:10px 16px;border-radius:999px;transition:color .18s ease,background .18s ease}
nav a.l:hover{color:var(--ink)}
#theme{width:38px;height:38px;border-radius:50%;border:0;background:transparent;color:var(--ink2);cursor:pointer;padding:0;
  display:grid;place-items:center;transition:background .18s ease,color .18s ease}
#theme:hover{background:color-mix(in srgb,var(--ink) 6%,transparent);color:var(--ink)}
#theme:active{transform:scale(.96)}
#theme svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
[data-theme="dark"] #theme .sun{display:none}
:root:not([data-theme="dark"]) #theme .moon{display:none}
@media(max-width:640px){nav .in{padding-top:16px} nav a.l{padding:9px 10px;font-size:12.5px}}
@media(max-width:480px){nav .in{flex-direction:column;align-items:flex-start;gap:10px} nav a.l{padding:8px 9px;font-size:12px}}
footer{padding:64px 0 46px}
body>.pushing{transition:transform .5s cubic-bezier(.22,1,.36,1)}
footer .in{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}
footer a{color:var(--ink2);text-decoration:none;font-size:12.5px}
footer a:hover{color:var(--touch)}
.rule{height:1px;background:var(--hair);margin-bottom:26px}
.grain{position:absolute;inset:0;pointer-events:none;background-image:var(--noise);background-size:170px 170px;mix-blend-mode:overlay;opacity:.5}
/* ---------- the cursor ----------
   His dot, in our ink: a flat charcoal disc with a soft coloured shadow beneath it,
   which is the glow. No highlight, no sphere: it is a dot, not a bead. Over anything pressable it grows, softly, on his spring;
   pressing shrinks it a little. Fine pointers only; the system cursor stays for text. */
@media(pointer:fine){
  html,body,*,*::before,*::after{cursor:none!important}
  #cur{position:fixed;left:0;top:0;width:12px;height:12px;pointer-events:none;z-index:1000;
    transform:translate(-100px,-100px);will-change:transform;opacity:0;transition:opacity .2s ease}
  #cur i{position:absolute;inset:0;border-radius:50%;
    background:var(--charcoal);
    box-shadow:0 3px 14px rgba(28,26,23,.30);
    transform:scale(1);transition:transform .46s cubic-bezier(.33,1.18,.37,1),opacity .32s ease,box-shadow .32s ease}
  [data-theme="dark"] #cur i{background:var(--ink);box-shadow:0 3px 14px rgba(250,249,247,.26)}
  #cur.on{opacity:1}
  #cur{transition:height .32s cubic-bezier(.33,1.18,.37,1),width .5s cubic-bezier(.33,1.18,.37,1) .05s}
  #cur:not(.pill){transition:width .34s cubic-bezier(.2,.7,.2,1),height .3s cubic-bezier(.2,.7,.2,1) .1s}
  #cur b{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);white-space:nowrap;font:500 12.5px var(--jak);letter-spacing:.01em;
    color:var(--paper);opacity:0;transition:opacity .16s ease}
  #cur.pill{width:var(--pw,180px);height:34px}
  #cur.pill i{border-radius:999px;transform:none;opacity:1;background:var(--ink);box-shadow:0 8px 26px rgba(28,26,23,.22)}
  #cur i{transition:transform .32s cubic-bezier(.33,1.18,.37,1),opacity .2s ease,border-radius .3s ease,background .2s ease}
  #cur.pill b{opacity:1;transition:opacity .22s ease .22s}
  [data-theme="dark"] #cur b{color:var(--paper)}
  #cur.hot i{transform:scale(2.6);opacity:.62;box-shadow:0 6px 22px rgba(28,26,23,.22)}
  [data-theme="dark"] #cur.hot i{box-shadow:0 6px 22px rgba(250,249,247,.2)}
  #cur.down i{transform:scale(2.1);opacity:.75}

  #cur.text{opacity:0}
}
/* ---------- the nav highlight ----------
   One drop of ink under the glass. It travels to whatever the pointer is over on a soft
   spring (a hair of overshoot, then it settles), and on leaving the pill it draws back into
   its own centre and fades. Nothing else: no stretch, no trail. */
nav .links{position:relative;isolation:isolate}
nav .links .drop{position:absolute;top:4px;bottom:4px;left:0;width:0;border-radius:999px;pointer-events:none;z-index:0;
  background:color-mix(in srgb,var(--ink) 8%,transparent);opacity:0;will-change:transform,width;
  transition:transform .46s cubic-bezier(.33,1.18,.37,1),width .46s cubic-bezier(.33,1.18,.37,1),opacity .46s cubic-bezier(.33,1.18,.37,1)}
/* leaving: the spring's overshoot would push a width that is heading to zero below zero,
   which pops. Retract on a plain ease-out instead, same length. */
nav .links .drop.out{transition-timing-function:cubic-bezier(.22,1,.36,1)}
nav .links .drop.on{opacity:1}
nav .links>a,nav .links>button{position:relative;z-index:1}
nav a.l:hover{background:transparent}
#theme:hover{background:transparent}
#theme svg{transition:transform .5s cubic-bezier(.22,1,.36,1),opacity .3s ease}
html.theming #theme svg{transform:rotate(90deg) scale(.6);opacity:0}
/* his mode change, exactly: nothing wipes, every colour on the page just eases to the
   other one over half a second. The class is worn for the duration of the change only,
   so the page's own quick transitions come back the moment it is over. */
html.theming,html.theming *{transition:background-color .5s ease,color .5s ease,border-color .5s ease,outline-color .5s ease,box-shadow .5s ease,fill .5s ease,stroke .5s ease!important}
@media(prefers-reduced-motion:reduce){html.theming,html.theming *{transition:none!important}}
"""
CASE_CSS = """
/* ---------- the case study ----------
   Two materials, same as the home: TEXT lives in sharp hairline CELLS (the hero grid's
   object: head rule, foot rule, a stem at each start), MEDIA lives in rounded PLATES with
   the 10% outline. Type is the image exactly once per page (the h1); after that it recedes. */
.cs-hero{padding:136px 0 0}
.cs-hero .eyebrow{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.cs-hero .eyebrow .logo{height:22px;width:auto;opacity:.9}
[data-theme="dark"] .cs-hero .eyebrow .logo{filter:invert(1) hue-rotate(180deg)}
.cs-hero h1{font-size:clamp(28px,4vw,44px);line-height:1.12;max-width:22ch;margin-top:12px}
.cs-hero .facts{display:grid;grid-template-columns:repeat(12,1fr);gap:24px;margin-top:48px;border-top:1px solid var(--hair);padding-top:24px}
.cs-hero .facts>div{grid-column:span 3}
.cs-hero .facts p{font-size:14px;line-height:1.55;color:var(--ink2);margin-top:8px}
.cs-hero .facts p b{font-weight:400;color:var(--ink)}
.cs-hero .facts ul{list-style:none;margin:8px 0 0;padding:0;font-size:14px;line-height:1.55;color:var(--ink2)}
@media(max-width:900px){.cs-hero .facts>div{grid-column:span 6}}
@media(max-width:560px){.cs-hero .facts>div{grid-column:span 12}}
.cs-hero .plate{width:min(100%,920px);margin:48px auto 0}
/* the table of contents is a row of the hero's cells */
.toc{display:flex;flex-wrap:wrap;margin-top:24px}
.toc a{display:flex;align-items:center;height:40px;padding:0 18px;border-top:1px solid var(--hair);border-bottom:1px solid var(--hair);
  border-left:1px solid var(--hair);text-decoration:none;font:400 13.5px var(--hel);color:var(--ink2);transition:background .16s ease,color .16s ease}
.toc a:last-child{border-right:1px solid var(--hair)}
.toc a:hover{background:var(--flick-b);color:var(--paper)}
.toc a.g:hover{background:var(--flick-a);color:var(--ink)}
[data-theme="dark"] .toc a:hover{color:var(--paper)}
/* results chips -- inked tiles, the knocked-out letter */
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.chips span{font:400 13px var(--hel);padding:8px 12px;background:var(--flick-b);color:var(--paper)}
.chips span:nth-child(2n){background:var(--flick-a);color:var(--ink)}
[data-theme="dark"] .chips span{color:var(--paper)}
[data-theme="dark"] .chips span:nth-child(2n){color:var(--ink)}
/* sections */
section.cs{padding:96px 0 0;scroll-margin-top:32px}
section.cs:last-of-type{padding-bottom:32px}
.head{display:grid;grid-template-columns:5fr 7fr;gap:48px;align-items:start}
.head h2{font-size:clamp(22px,2.6vw,30px);line-height:1.2;margin-top:12px}
.head .lede p{font-size:17px;line-height:1.62;color:var(--ink2)}
.head .lede p+p{margin-top:16px}
@media(max-width:900px){.head{grid-template-columns:1fr;gap:24px}}
.row{display:grid;grid-template-columns:6fr 6fr;gap:48px;align-items:center;margin-top:48px}
/* two text blocks side by side start on the same line; centring only fits a picture beside text */
.row.text{align-items:start}
.row.r7{grid-template-columns:5fr 7fr}
.row.r75{grid-template-columns:7fr 5fr}
@media(max-width:900px){.row,.row.r7,.row.r75{grid-template-columns:1fr;gap:24px}}
.solo{margin-top:48px;max-width:64ch}
/* two small sketches side by side, shown under their file size so they stay crisp */
.pair{display:grid;grid-template-columns:repeat(2,minmax(0,170px));gap:16px}
.pair.trio{grid-template-columns:repeat(3,1fr);margin-top:48px}
.pair figure{margin:0}
.tx h3{font-size:17px;line-height:1.3}
.tx ul+h3,.tx p+h3,.tx ol+h3{margin-top:28px}
.tx h3 .a{color:var(--ink3);font-weight:400}
.tx p{font-size:15.5px;line-height:1.62;color:var(--ink2);margin-top:12px}
.tx p b,.tx li b{font-weight:400;color:var(--ink)}
.tx ul,.tx ol{margin:12px 0 0;padding-left:18px;font-size:15.5px;line-height:1.62;color:var(--ink2)}
.tx li+li{margin-top:8px}
.tx .note{font-size:13px;color:var(--ink3);margin-top:16px}
.tx p a{color:var(--touch);text-decoration:underline;text-underline-offset:3px}
/* media */
.plate{position:relative;border-radius:20px;overflow:hidden;background:var(--plate);outline:1px solid var(--outline);outline-offset:-1px}
.plate img,.plate video{display:block;width:100%;height:auto}
.plate.pad{padding:24px}
/* a bare plate is no plate: the picture draws its own edges, so a box around it was a box in a box */
.plate.bare{background:transparent;outline:0;border-radius:0}
[data-theme="dark"] .plate.bare.paper{background:#FAF9F7;border-radius:20px;padding:24px}
.plate.pad img,.plate.pad video{border-radius:8px}
figure{margin:0}
figure.mt{margin-top:48px}
figcaption{font-size:12.5px;line-height:1.5;color:var(--ink3);margin-top:12px;max-width:60ch}
/* THE DECK. Three plates in a row gave each image a third of the width, which is
   too small to read. Now one card holds the width and the others wait under it: the pile
   shows two edges below the top card so the reader knows there is more, and a click sends
   the top card to the bottom. Same size for every card, so nothing jumps. */
.deck{margin-top:48px;cursor:pointer;outline:0}
.deck .pile{position:relative;aspect-ratio:16/10;margin-bottom:20px}
.deck .card{position:absolute;inset:0;margin:0;transform-origin:50% 100%;
  transition:transform .48s cubic-bezier(.2,.7,.2,1),opacity .3s ease}
.deck .card .plate{height:100%;margin:0}
.deck .card .plate{background:var(--plate)}
.deck .card .plate.bare{background:transparent}
.deck .card .plate.bare img{border-radius:12px}
/* the pile takes the FIRST card's own proportions (set on load), so the cards in a group,
   which come from the same flow, are shown whole and all at one size */
.deck .card .plate img,.deck .card .plate video{height:100%;object-fit:contain}
.deck .card figcaption{position:absolute;left:0;right:0;top:calc(100% + 32px);opacity:0;transition:opacity .25s ease}
.deck .card.top figcaption{opacity:1;transition-delay:.18s}
.deck .card.top{z-index:3}
.deck .card.next{z-index:2;transform:translateY(10px) scale(.965)}
.deck .card.after{z-index:1;transform:translateY(20px) scale(.93)}
.deck .card.gone{z-index:0;opacity:0;transform:translateY(20px) scale(.93)}
.deck .card.leaving{z-index:4;transform:translateY(56px) scale(1.02);opacity:0}
.deck .deck-foot{display:flex;justify-content:space-between;align-items:baseline;margin-top:64px;font-family:var(--jak);font-weight:500;font-size:12.5px;color:var(--ink3)}
.deck .deck-foot b{font-weight:600;color:var(--ink)}
.deck:focus-visible .pile{outline:2px solid var(--ink);outline-offset:6px;border-radius:20px}
.deck .card figcaption{margin-top:0}
@media(max-width:700px){.three{grid-template-columns:1fr}}
/* cells: the hero grid's object, holding text */
.cells{display:grid;grid-template-columns:repeat(3,1fr);margin-top:48px}
.cells.c2{grid-template-columns:repeat(2,1fr)}
.cells.c4{grid-template-columns:repeat(4,1fr)}
.cells{padding:1px 0 0 1px}
.cell{border:1px solid var(--hair);margin:-1px 0 0 -1px;padding:24px;min-width:0}
.cell h3{font-size:15.5px;line-height:1.3}
.cell h4{font-size:15.5px}
.cell p{font-size:14.5px;line-height:1.55;color:var(--ink2);margin-top:10px}
.cell ul{margin:10px 0 0;padding-left:16px;font-size:14.5px;line-height:1.55;color:var(--ink2)}
.cell li+li{margin-top:6px}
.cell .big{font:300 40px/1 var(--hel);letter-spacing:-.02em;color:var(--ink);margin:0}
.cell .big+p{margin-top:12px}
.cell img.av{width:56px;height:56px;border-radius:50%;object-fit:cover;outline:1px solid var(--outline);outline-offset:-1px;display:block;margin-bottom:14px}
.cell svg.av{width:56px;height:56px;display:block;margin-bottom:14px}
.cell .kv{font-size:12.5px;color:var(--ink3);margin-top:4px}
.cell.ink{background:var(--flick-b);color:var(--paper);border-color:transparent}
.cell.ink p,.cell.ink h3{color:inherit}
.cell.gold{background:var(--flick-a);color:var(--ink);border-color:transparent}
.cell.gold p,.cell.gold h3{color:inherit}
[data-theme="dark"] .cell.ink{color:var(--paper)}
.cell .st{font-family:var(--jak);font-weight:600;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3);margin-top:12px}
.cell.dim{opacity:.55}
@media(max-width:900px){.cells,.cells.c4{grid-template-columns:repeat(2,1fr)}.cell:nth-child(2n){border-right:1px solid var(--hair)}.cell:nth-child(n+3){border-top:0}}
@media(max-width:560px){.cells,.cells.c2,.cells.c4{grid-template-columns:1fr}.cell{border-right:1px solid var(--hair)}.cell:nth-child(n+2){border-top:0}}
/* quotes: a row of cells, the opening mark large and quiet */
.quotes{display:grid;grid-template-columns:repeat(3,1fr);margin-top:48px}
.quotes .cell p{font-size:15px;line-height:1.55;color:var(--ink);margin-top:0}
.quotes .cell .who{font-size:12.5px;color:var(--ink3);margin-top:16px}
.quotes .cell:before{content:"\\201C";display:block;font:300 40px/1 var(--hel);color:var(--ink3);margin-bottom:10px}
@media(max-width:900px){.quotes{grid-template-columns:1fr}.quotes .cell{border-right:1px solid var(--hair)}.quotes .cell:nth-child(n+2){border-top:0}}
/* flow: the solution preview as a strip of cells with the arrow as a stem */
.flow{display:grid;grid-template-columns:repeat(4,1fr);margin-top:48px}
.flow .cell{display:flex;flex-direction:column;gap:14px}
.flow .cell p{margin:0;font-size:14px;line-height:1.5;color:var(--ink);min-height:3em}
/* four equal plates: the recordings fill theirs, the icons sit centred in the same frame,
   so a step that is a drawing and a step that is a recording are the same object */
.flow .cell .m{border-radius:12px;overflow:hidden;outline:1px solid var(--outline);outline-offset:-1px;background:var(--plate);
  aspect-ratio:1920/1042;display:grid;place-items:center}
.flow .cell .m video,.flow .cell .m img{display:block;width:100%;height:100%;object-fit:cover}
.flow .cell .m.icon .ic{width:36%;height:44%;color:var(--ink2)}
@media(max-width:900px){.flow{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.flow{grid-template-columns:1fr}}
/* takeaways */
.take{margin-top:48px;display:grid;grid-template-columns:6fr 6fr;gap:48px;align-items:start}
/* one photo beside the takeaways: it fills its column and no more, rounded like every plate */
.take .take-one{margin:0}
.take .take-one .plate.bare{border-radius:20px;overflow:hidden}
.take .take-one img{display:block;width:100%;height:auto;border-radius:20px}
.take ol{list-style:none;margin:16px 0 0;padding:0;counter-reset:t}
.take li{counter-increment:t;display:grid;grid-template-columns:40px 1fr;gap:16px;padding:16px 0;border-top:1px solid var(--hair);font-size:15.5px;line-height:1.6;color:var(--ink2)}
.take li:before{content:counter(t,decimal-leading-zero);font:300 20px/1.4 var(--hel);color:var(--ink3)}
.take li:last-child{border-bottom:1px solid var(--hair)}
@media(max-width:900px){.take{grid-template-columns:1fr}}
/* ---- phones and tablets: one column, the same rhythm ---- */
@media(max-width:640px){
  .cs-hero{padding-top:104px}.cs-hero h1{font-size:26px}.toc a{height:36px;padding:0 12px;font-size:12.5px}
  .cs-hero .plate{margin-top:32px}section.cs{padding-top:64px}.row{gap:20px;margin-top:32px}
  .three,.pair,.pair.trio{grid-template-columns:1fr}.deck{max-width:100%!important}
  .flow .cell p{min-height:0}.ab{padding-top:104px}.ab .keeps{grid-template-columns:1fr 1fr;gap:10px}
  .ab .keep .box{padding:18px}.thanks{flex-direction:column;align-items:flex-start;gap:12px}.more .cells{grid-template-columns:1fr}
  .gal{padding-top:104px}.wall{grid-template-columns:1fr}.wall .slot{border-right:1px solid var(--hair)}
  footer .in{flex-wrap:wrap;gap:10px}
}

/* thanks + more */
.thanks{margin-top:96px;display:flex;gap:24px;align-items:center;border-top:1px solid var(--hair);border-bottom:1px solid var(--hair);padding:24px 0}
.thanks img.sig{width:118px;height:auto;flex:0 0 auto}
.thanks .sm-paper{display:none}
[data-theme="dark"] .thanks .sm-ink{display:none}
[data-theme="dark"] .thanks .sm-paper{display:block}
.thanks h3{font-size:17px}
.thanks p{font-size:15px;color:var(--ink2);margin-top:6px;line-height:1.55}
.thanks a{color:var(--touch)}
.more{margin:96px 0}
.more .cells{margin-top:16px}
.more a.cell{display:block;text-decoration:none;color:inherit;transition:background .16s ease}
.more a.cell:hover{background:color-mix(in srgb,var(--ink) 4%,transparent)}
.more a.cell .t{font:300 28px/1.15 var(--hel);letter-spacing:-.015em;color:var(--ink);display:block}
.more a.cell p{margin-top:8px}
.more a.cell .n{font:500 11px var(--jak);letter-spacing:.12em;color:var(--ink3);display:block;margin-bottom:12px}


/* IN THE SHEET. Opened from the home page, the case study is the sheet's whole content:
   no nav, no footer, the sheet's own chrome carries the tabs and the close. */
html.sheet nav,html.sheet footer,html.sheet site-mark{display:none}
html.sheet .cs-hero{padding-top:56px}
html.sheet body{background:transparent}
"""
NAV = """<nav class="grounded"><div class="wrap in">
  <site-mark href="/"></site-mark>
  <span class="links">
    <button id="theme" aria-label="Switch colour mode" title="Colour mode">
      <svg class="sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      <svg class="moon" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
    </button>
    <a class="l" href="/#work">Projects</a><a class="l" href="https://portfolio-experiments.vercel.app/sandbox">Sandbox</a><a class="l" href="/art-gallery.html">Art Gallery</a><a class="l" href="/about.html">About</a></span>
</div></nav>"""
THEME_HEAD = """<script>(function(){if(new URLSearchParams(location.search).get('sheet')=='1')document.documentElement.classList.add('sheet');const q=new URLSearchParams(location.search).get('theme');let t=q||localStorage.getItem('theme');
if(t!=='light'&&t!=='dark') t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t);})();</script>"""
SITE_JS = """<script>
/* ---------- alpha recordings: Safari takes the HEVC, everyone else the WebM ---------- */
(function(){
  const safari=/^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
  document.querySelectorAll('video[data-alpha]').forEach(v=>{
    v.src=v.dataset.alpha+(safari?'.mov':'.webm');
    v.addEventListener('error',()=>{ if(v.src.indexOf('-alpha')>-1){ v.src=v.dataset.flat; v.load(); } },{once:true});
  });
})();
/* ---------- THE PAGE MAKES ROOM ----------
   When the line drops out from under the name, everything below the nav moves down just
   far enough to clear its foot, on the site's ease, and comes back to its place when the
   line goes. Measured live off the line and the first piece of content, so it is the
   same gesture on every page whatever sits at the top of it. */
(function(){
  const EXCLUDE='nav,.hero-foot,script,style,svg,#load,#cur,#gooL,site-mark,#ghost';
  const pushed=()=>[...document.body.children].filter(el=>!el.matches(EXCLUDE));
  const firstContent=()=>[...document.querySelectorAll('.hero .stack, .cs-hero .label, main .label, main h1')].find(el=>el.getBoundingClientRect().height>0);
  let peek=0, t=0;
  addEventListener('markpeek',e=>{
    const els=pushed(); clearTimeout(t);
    if(e.detail.on){ const f=firstContent(); const top=f?f.getBoundingClientRect().top-peek:0; peek=Math.max(0,e.detail.bottom+20-top); }
    else peek=0;
    els.forEach(el=>{ el.classList.add('pushing'); el.style.transform=peek?`translateY(${peek.toFixed(1)}px)`:''; });
    t=setTimeout(()=>els.forEach(el=>el.classList.remove('pushing')),560);
  });
})();
/* ---------- the cursor ---------- */
(function(){
  if(!matchMedia('(hover: hover) and (pointer:fine)').matches) return;
  const c=document.createElement('div'); c.id='cur'; c.appendChild(document.createElement('i')); const lb=document.createElement('b'); c.appendChild(lb); document.body.appendChild(c);
  let tx=-100,ty=-100,x=-100,y=-100,raf=0,shown=false;
  const HOT='a,button,[role=button],label,summary,.rows li,.tags button';
  function loop(){
    /* a plain ease toward the pointer: a beat behind it, never bouncing */
    x+=(tx-x)*.42; y+=(ty-y)*.42;
    c.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%)`;
    if(Math.abs(tx-x)+Math.abs(ty-y)>.05) raf=requestAnimationFrame(loop); else raf=0;
  }
  addEventListener('pointermove',e=>{
    tx=e.clientX; ty=e.clientY;
    if(!shown){ x=tx; y=ty; shown=true; c.classList.add('on'); }
    const t=e.target.closest ? e.target.closest(HOT) : null;
    /* THE PILL. Over anything with a data-cur line the dot opens into a pill that says it,
       the way the live site's cursor becomes the email over the intro. The width is measured
       off the label so the morph runs between two real numbers. */
    const say=e.target.closest ? e.target.closest('[data-cur]') : null;
    if(say){ if(lb.textContent!==say.dataset.cur) lb.textContent=say.dataset.cur; c.style.setProperty('--pw',(lb.scrollWidth+34)+'px'); }
    c.classList.toggle('pill',!!say);
    c.classList.toggle('hot',!!t&&!say);
    c.classList.toggle('text',!t && getComputedStyle(e.target).cursor==='text');
    if(!raf) raf=requestAnimationFrame(loop);
  },{passive:true});
  addEventListener('pointerdown',()=>c.classList.add('down'));
  addEventListener('pointerup',()=>c.classList.remove('down'));
  document.documentElement.addEventListener('pointerleave',()=>c.classList.remove('on'));
  document.documentElement.addEventListener('pointerenter',()=>{ if(shown) c.classList.add('on'); });
})();
/* ---------- the nav highlight ---------- */
(function(){
  const pill=document.querySelector('nav .links'); if(!pill) return;
  const drop=document.createElement('span'); drop.className='drop'; pill.prepend(drop);
  const items=[...pill.querySelectorAll(':scope > a, :scope > button')];
  let seeded=false, cx=0;
  const set=(x,w)=>{ drop.style.transform=`translateX(${x.toFixed(1)}px)`; drop.style.width=w.toFixed(1)+'px'; };
  function go(el){
    const r=el.getBoundingClientRect(), p=pill.getBoundingClientRect(); const x=r.left-p.left, w=r.width;
    if(!seeded){ /* first arrival grows out of the item itself instead of sliding in from the edge */
      drop.style.transition='none'; set(x+w/2,0); void drop.offsetWidth; drop.style.transition=''; seeded=true; }
    cx=x+w/2; drop.classList.remove('out'); set(x,w); drop.classList.add('on');
  }
  function leave(){ drop.classList.add('out'); set(cx,0); drop.classList.remove('on'); }
  items.forEach(el=>{ el.addEventListener('pointerenter',()=>go(el)); el.addEventListener('focus',()=>go(el)); });
  pill.addEventListener('pointerleave',leave); pill.addEventListener('focusout',e=>{ if(!pill.contains(e.relatedTarget)) leave(); });
})();
/* theme: every colour eases to the other mode, his way */
(function(){
  const b=document.getElementById('theme'); if(!b) return;
  b.addEventListener('click',(e)=>{
    const cur=document.documentElement.getAttribute('data-theme'); const t=cur==='dark'?'light':'dark';
    const apply=()=>{ document.documentElement.setAttribute('data-theme',t); try{localStorage.setItem('theme',t);}catch(err){}
      dispatchEvent(new CustomEvent('themechange',{detail:{theme:t}})); };
    document.documentElement.classList.add('theming');
    setTimeout(()=>document.documentElement.classList.remove('theming'),560);
    apply();
  },{capture:true});
})();

(function(){const n=document.createElement('canvas');n.width=n.height=170;const g=n.getContext('2d'),d=g.createImageData(170,170);
for(let i=0;i<d.data.length;i+=4){const v=118+(Math.random()*72-36);d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}
g.putImageData(d,0,0);document.documentElement.style.setProperty('--noise',`url(${n.toDataURL()})`);})();
/* the sandbox is another origin, so the colour mode travels in the URL */
(function(){document.querySelectorAll('a[href*="/sandbox"]').forEach(a=>{const base=a.getAttribute('href');
a.addEventListener('click',()=>{a.href=base+'?theme='+(document.documentElement.getAttribute('data-theme')||'light');});});})();
(function(){const el=document.getElementById('clock');if(!el)return;const f=()=>el.textContent=new Date().toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit',second:'2-digit',timeZoneName:'short'});f();setInterval(f,1000);})();
/* videos only play while on screen */
(function(){const io=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting){v.play().catch(()=>{});}else v.pause();}),{rootMargin:'160px'});
document.querySelectorAll('video[data-io]').forEach(v=>io.observe(v));})();
</script>"""
FOOTER = """<footer><div class="wrap"><div class="rule"></div><div class="in">
  <span style="font-size:12.5px;color:var(--ink3)">My local time <b id="clock" style="font-weight:400;color:var(--ink2);font-variant-numeric:tabular-nums"></b></span>
  <span style="display:flex;gap:20px"><a href="mailto:jazkurnz06@gmail.com">Email</a><a href="https://www.linkedin.com/in/jazlynn-kurniandra-a456292a8/" target="_blank" rel="noopener">LinkedIn</a><a href="https://x.com/jazlynnkurni" target="_blank" rel="noopener">X</a></span>
  <span style="font-size:12.5px;color:var(--ink3)">© 2026 Jazlynn Kurniandra</span>
</div></div></footer>"""

def page(title, body, extra_css=""):
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Cache-Control" content="no-cache">
<title>{html.escape(title)} · Jazlynn Kurniandra</title>
<link rel="icon" href="/favicon.png" type="image/png"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><meta property="og:image" content="https://jazlynnwashere.com/og.png"><meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet">
<script src="/site-mark.js?v=sig11"></script>
<style>{TOKENS}{BASE}{extra_css}</style>{THEME_HEAD}</head><body>
{NAV}
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <!-- DUOTONE, locked from the cover lab: oxblood to paper. tableValues are the R, G, B at 0 and 1 -->
  <filter id="print-light" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"/>
    <feComponentTransfer><feFuncR type="table" tableValues="0.204 0.980"/><feFuncG type="table" tableValues="0.016 0.976"/><feFuncB type="table" tableValues="0.078 0.969"/></feComponentTransfer>
  </filter>
  <!-- DITHER, purple: the photograph goes to grey, takes a fine grain, is cut to seven steps so the
       grain reads as a dot screen, then the steps are mapped from the signature purple to paper -->
  <filter id="dither-purple" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%">
    <feColorMatrix in="SourceGraphic" type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" result="g"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="1" seed="7" stitchTiles="stitch" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  1 0 0 0 0" result="nl"/>
    <feComposite in="g" in2="nl" operator="arithmetic" k1="0" k2="1" k3="0.55" k4="-0.27" result="gn"/>
    <feComponentTransfer in="gn" result="q"><feFuncR type="discrete" tableValues="0 .17 .33 .5 .67 .83 1"/><feFuncG type="discrete" tableValues="0 .17 .33 .5 .67 .83 1"/><feFuncB type="discrete" tableValues="0 .17 .33 .5 .67 .83 1"/></feComponentTransfer>
    <feComponentTransfer in="q"><feFuncR type="table" tableValues="0.510 0.980"/><feFuncG type="table" tableValues="0.478 0.976"/><feFuncB type="table" tableValues="0.522 0.969"/></feComponentTransfer>
  </filter>
  <!-- on charcoal the shadows are the ground itself -->
  <filter id="print-dark" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"/>
    <feComponentTransfer><feFuncR type="table" tableValues="0.110 0.980"/><feFuncG type="table" tableValues="0.102 0.976"/><feFuncB type="table" tableValues="0.090 0.969"/></feComponentTransfer>
  </filter>
</defs></svg>
{body}
{FOOTER}
{SITE_JS}</body></html>"""

# ------------------------------------------------------------------ html helpers
E = html.escape
def rich(t):
    """**bold** -> <b>, [text](url) -> link. Everything else escaped."""
    t = E(t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2" target="_blank" rel="noopener">\1</a>', t)
    return t
def P(*ps): return ''.join(f'<p>{rich(p)}</p>' for p in ps)
def H3(t): return f'<h3>{rich(t)} <span class="a">&rarr;</span></h3>'
def UL(items): return '<ul>'+''.join(f'<li>{rich(i)}</li>' for i in items)+'</ul>'
def TX(*inner): return '<div class="tx">'+''.join(inner)+'</div>'
# see-through pictures whose ink is dark: on charcoal they stand on a paper card
PAPER = ['your-path-second.png', 'your-path-third-v1.png', 'your-path-third-v2.png', 'hackathon-card-before.png', 'hackathon-card-after-1.png', 'hackathon-card-after.png', 'design-system-exploration.png', 'hero.png']
def media(src, alt="", pad=False, bare=False, cur=None):
    cls = 'plate pad' if pad else 'plate'
    if bare: cls += ' bare' + (' paper' if os.path.basename(src) in PAPER else '')
    attrs = f'class="{cls}"' + (f' data-cur="{E(cur)}"' if cur else '')
    if src.endswith('.mp4'):
        # a recording with an alpha twin on disk (<name>-alpha.webm / .mov) plays with its ground
        # transparent, so it sits on the page's own paper in either colour mode
        base = src[:-4] + '-alpha'
        if os.path.exists(base.lstrip('/') + '.webm'):
            return f'<div {attrs}><video muted loop playsinline preload="metadata" data-io data-alpha="{base}" data-flat="{src}"></video></div>'
        return f'<div {attrs}><video src="{src}" muted loop playsinline preload="metadata" data-io></video></div>'
    return f'<div {attrs}><img src="{src}" alt="{E(alt)}" loading="lazy"></div>'
def FIG(src, cap="", alt="", pad=False, mt=True, bare=False):
    c = f'<figcaption>{rich(cap)}</figcaption>' if cap else ''
    return f'<figure class="{"mt" if mt else ""}">{media(src, alt or cap, pad, bare)}{c}</figure>'
def ROW(left, right, kind=""):
    return f'<div class="row {kind}">{left}{right}</div>'
def THREE(items, bare=False):
    """Three or more images that used to sit side by side are a DECK now: one card at a
    time at full width, the rest stacked under it. Click or press right for the next card;
    the card you were on drops to the bottom of the pile. Every card is the same size."""
    cards=''.join(f'<figure class="card" data-i="{k}">{media(s,a,False,bare)}<figcaption>{rich(c)}</figcaption></figure>' for k,(s,c,a) in enumerate(items))
    return f'<div class="deck" data-n="{len(items)}" tabindex="0" role="group" aria-label="{len(items)} images, click for the next"><div class="pile">{cards}</div><div class="deck-foot"><span class="deck-n"><b>1</b> / {len(items)}</span><span class="deck-hint">click for the next</span></div></div>'
def CELLS(cells, cols=3):
    return f'<div class="cells c{cols}">'+''.join(cells)+'</div>'
def CELL(inner, cls=""): return f'<div class="cell {cls}">{inner}</div>'
def STAT(big, text): return CELL(f'<p class="big">{E(big)}</p><p>{rich(text)}</p>')
def QUOTES(qs): return '<div class="quotes">'+''.join(f'<div class="cell"><p>{rich(q)}</p><p class="who">{E(w)}</p></div>' for q,w in qs)+'</div>'
PERSON_SVG = '<svg class="av" viewBox="0 0 56 56" aria-hidden="true" style="color:{c}"><circle cx="28" cy="28" r="28" fill="currentColor"/><circle cx="28" cy="21" r="7.5" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M14 44c2.2-7.6 7.4-11.5 14-11.5S39.8 36.4 42 44" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>'
def PERSONA(av, name, kv, bullets):
    """av is a photo path, or 'person:<colour>' for the outline figure in a palette colour."""
    if av.startswith('person:'):
        head = PERSON_SVG.format(c=av.split(':',1)[1])
    else:
        head = f'<img class="av" src="{av}" alt="">'
    return CELL(f'{head}<h4>{E(name)}</h4><p class="kv">{E(kv)}</p>'+UL(bullets))
def HMW(a, b):
    return CELLS([CELL(f'<h3>{E(a)}</h3>','ink'), CELL(f'<h3>{E(b)}</h3>','gold')], 2)
ICON_BOX = {"laptop": "11.25 25.67 131.50 104.25", "people": "0.01 0.00 94.61 94.63", "phone": "24.59 9.84 68.83 98.33"}  # measured drawn bounds plus half the stroke
def ICON(src):
    """A flow icon is inlined so its lines take the page's ink and its knock-outs take the plate,
    in either colour mode; as an <img> its baked colours went black on charcoal."""
    svg = pathlib.Path(src.lstrip('/')).read_text()
    svg = re.sub(r'<\?xml[^>]*>', '', svg)
    svg = re.sub(r'stroke="#[0-9A-Fa-f]{3,6}"', 'style="stroke:currentColor"', svg)
    # a dark fill in the source is a solid shape (the front figure's body): it takes the ink;
    # a light fill is a knock-out and takes the plate
    def fill(m):
        h = m.group(1); h = ''.join(ch*2 for ch in h) if len(h) == 3 else h
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        return 'style="fill:currentColor"' if (0.3*r + 0.59*g + 0.11*b) < 128 else 'style="fill:var(--plate)"'
    svg = re.sub(r'fill="#([0-9A-Fa-f]{3,6})"', fill, svg)
    svg = svg.replace('style="stroke:currentColor" style="fill:var(--plate)"','style="stroke:currentColor;fill:var(--plate)"').replace('style="fill:var(--plate)" style="stroke:currentColor"','style="stroke:currentColor;fill:var(--plate)"')
    key = os.path.basename(src).replace('.svg','')
    if key in ICON_BOX: svg = re.sub(r'viewBox="[^"]*"', f'viewBox="{ICON_BOX[key]}"', svg, count=1)
    svg = re.sub(r'<svg ', '<svg class="ic" aria-hidden="true" preserveAspectRatio="xMidYMid meet" ', svg, count=1)
    return svg
def FLOW(steps):
    out=''
    for cap, kind, src in steps:
        if kind=='icon': m=f'<div class="m icon">{ICON(src)}</div>'
        elif kind=='video': m=f'<div class="m"><video src="{src}" muted loop playsinline preload="metadata" data-io></video></div>'
        else: m=f'<div class="m"><img src="{src}" alt="" loading="lazy"></div>'
        out+=f'<div class="cell"><p>{E(cap)}</p>{m}</div>'
    return f'<div class="flow">{out}</div>'
def SECTION(id, eyebrow, h2, lede, *blocks):
    lede_html = f'<div class="lede">{P(*lede)}</div>' if lede else '<div></div>'
    return f'<section class="cs" id="{id}"><div class="wrap"><div class="head"><div><div class="label">{E(eyebrow)}</div><h2>{rich(h2)}</h2></div>{lede_html}</div>{"".join(blocks)}</div></section>'
def ph_args(t):
    """(src, alt) or (src, alt, cursor line): the third is what the cursor says over the photo"""
    return (t[0], t[1], False, False, t[2] if len(t)>2 else None)
def TAKE(photos, points, cur=None):
    """photos are bare: they draw their own edges. cur is the line the cursor says over them."""
    if len(photos) >= 2:
        ph = THREE([(t[0], '', t[1]) for t in photos], bare=True).replace('class="deck"', f'class="deck" style="margin-top:0;max-width:420px"' + (f' data-cur="{E(cur)}"' if cur else ''))
    else:
        ph = ''.join(f'<figure class="take-one">{media(t[0], t[1], False, True, (t[2] if len(t)>2 else None) or cur)}</figure>' for t in photos)
    ol = '<ol>'+''.join(f'<li>{rich(p)}</li>' for p in points)+'</ol>'
    return f'<div class="take"><div>{ph}</div><div><div class="label">Final thoughts</div><h3 style="font-size:22px;margin-top:12px">Key takeaways and next steps.</h3>{ol}</div></div>'
def NEXT(items):
    return CELLS([CELL(f'<div class="label">Next step {i+1:02d}</div><p style="color:var(--ink);margin-top:12px">{rich(t)}</p>') for i,t in enumerate(items)], 3)
def THANKS():
    return ('<div class="thanks"><img class="sig sm-ink" src="/jaz-signature.svg?v=ox1" alt="Jazlynn"><img class="sig sm-paper" src="/jaz-signature-paper.svg?v=ox1" alt=""><div><h3>Thanks for visiting!</h3>'
            '<p>I design better than I summarize. Let\'s fix that over a call or interview. Reach out <a href="mailto:jazkurnz06@gmail.com">here</a>.</p></div></div>')

PROJECTS = [
  dict(n='01', t='Clover',           y='2026', href='/soon.html?p=Clover',            s='Designing the HUD interface and shipping the iOS companion app'),
  dict(n='02', t='Fostr',            y='2026', href='https://fostr.page/', ext=True, s='Building the brand, landing site and internal platform from 0 to 1'),
  dict(n='03', t='Halodoc',          y='2026', href='/soon.html?p=Halodoc',           s='Designing the onboarding journey for AI Prescription on mobile'),
  dict(n='04', t='Conduit Commerce', y='2026', href='/work/conduit-commerce.html',  s='Designing and shipping a B2B SaaS website for an AI-feature launch'),
  dict(n='05', t='Second Self',      y='2026', href='https://devpost.com/software/second-self-giwmxh', ext=True, s='Building an AI agent that lives on your own Mac'),
  dict(n='06', t='Manus AI',         y='2025', href='/work/manus-ai.html',          s='Designing an AI community platform to drive adoption'),
  dict(n='07', t='Olive',            y='2025', href='https://drive.google.com/file/d/15-mX_sIkPU_Ww4R1UueWG10Wv9CQbhEy/view', ext=True, s='Designing an AI-powered carbon tracking app'),
  dict(n='08', t='SomiaCX',          y='2024', href='/work/somia-cx.html',          s='Architecting a unified UVP system for three financial subsidiaries'),
]
def MORE(current):
    others=[p for p in PROJECTS if p['href'].startswith('/work/') and p['t']!=current][:2]
    cells=''.join(f'<a class="cell" href="{p["href"]}"><span class="n">{p["n"]} &middot; {E(p["y"])}</span><span class="t">{E(p["t"])}</span><p>{E(p["s"])}</p></a>' for p in others)
    return f'<div class="more"><div class="label">More projects</div><div class="cells c2">{cells}</div></div>'

def HERO(n, name, logo, title, media_src, role, duration, team, results, toc, pad=False, bare=False, width=None):
    tocs=''.join(f'<a href="#{i}" class="{"g" if k%2 else ""}">{E(l)}</a>' for k,(i,l) in enumerate(toc))
    return f"""<header class="cs-hero"><div class="wrap">
  <div class="eyebrow"><span class="label">Project {n}</span><img class="logo" src="{logo}" alt="{E(name)}"></div>
  <h1>{E(title)}</h1>
  <div class="toc">{tocs}</div>
  <div class="facts">
    <div><div class="label">My role</div><p>{E(role)}</p></div>
    <div><div class="label">Duration</div><p>{E(duration)}</p></div>
    <div><div class="label">Team</div><ul>{''.join(f'<li>{E(t)}</li>' for t in team)}</ul></div>
    <div><div class="label">Results</div><div class="chips">{''.join(f'<span>{E(r)}</span>' for r in results)}</div></div>
  </div>
  {media(media_src, name, pad, bare).replace('class="plate', f'style="width:min(100%,{width}px)" class="plate', 1) if width else media(media_src, name, pad, bare)}
</div></header>"""

DECK_JS = """<script>(function(){
  document.querySelectorAll('.deck').forEach(deck=>{
    const cards=[...deck.querySelectorAll('.card')], n=cards.length, num=deck.querySelector('.deck-n b');
    let top=0, busy=false;
    const pile=deck.querySelector('.pile');
    /* the pile is the shape of the card on top, so every card is framed exactly; never wider than its file */
    /* ONE SIZE. The pile takes the first card's shape once and keeps it; every card is fitted to
       that frame (cover), so clicking through never changes the deck's size */
    const ratio=()=>{ const m=cards[0].querySelector('img,video'); const w=m.naturalWidth||m.videoWidth, h=m.naturalHeight||m.videoHeight;
      if(w&&h){ const maxw=Math.min(...cards.map(c=>{const e=c.querySelector('img,video'); return (e.naturalWidth||e.videoWidth)||Infinity;}));
        if(isFinite(maxw)) deck.style.maxWidth=maxw+'px'; pile.style.height=(pile.clientWidth*h/w).toFixed(1)+'px'; } };
    cards.forEach(c=>{ const m=c.querySelector('img,video'); m.addEventListener('load',ratio); m.addEventListener('loadedmetadata',ratio); });
    addEventListener('resize',ratio);
    /* the caption sits under the pile, so the pile's bottom margin has to clear it */
    function place(){ cards.forEach((c,k)=>{ const d=(k-top+n)%n;
      c.className='card '+(d===0?'top':d===1?'next':d===2?'after':'gone'); }); num.textContent=top+1; }
    function next(dir){ if(busy) return; busy=true;
      const leaving=cards[top]; top=(top+dir+n)%n;
      if(dir>0){ leaving.className='card leaving'; place(); leaving.className='card leaving';
        setTimeout(()=>{ leaving.className='card '+(n===2?'next':'gone'); place(); busy=false; },300); }
      else { place(); busy=false; } }
    deck.addEventListener('click',e=>{ if(e.target.closest('a')) return; next(1); });
    deck.addEventListener('keydown',e=>{ if(e.key==='ArrowRight'||e.key===' '||e.key==='Enter'){e.preventDefault();next(1);} if(e.key==='ArrowLeft'){e.preventDefault();next(-1);} });
    place();
  });
})();</script>"""

def case(name, n, body_sections, title):
    body = ''.join(body_sections) + f'<div class="wrap">{THANKS()}{MORE(name)}</div>' + DECK_JS
    return page(f'{name} · {title}', body, CASE_CSS)

# ------------------------------------------------------------------ MANUS AI
TOC5=[('overview','Overview'),('problem','Problem'),('research','Research'),('development','Development'),('testing','Testing'),('solution','Solution')]
manus = case('Manus AI','06',[
 HERO('06','Manus AI','/images/manus/hero/logo.svg','Designing an AI community platform to drive adoption.','/videos/trim/manus-hero.mp4',
   'Leading user research, architecting the design system, user flows and interaction mechanisms, and ideating the UI features.','3 months, winter break',
   ['1 product designer (me!)','1 co-founder CMO','2 engineers','2 PMs','1 business strategist'],['Retention ~30% → 65–70%','Shipped & handed off'],TOC5, bare=True, width=809),
 SECTION('overview','At a glance','Manus was growing faster than its users could keep up with.',
   ['Over winter break, I interned at Manus AI, a general AI agent that was growing faster than its users could keep up with. As the agent became more intelligent, it became harder for everyday users to understand, adopt, and actually leverage it. With the newly launched Manus 1.5 Max, feature depth was outpacing user comprehension, and the existing community was a static archive no one was navigating.',
    'I led the end-to-end redesign of the Manus Community: not a visual refresh, but a re-architecture from passive content IA to an AI-guided learning system that scales alongside both the product and its users.']),
 SECTION('problem','Problem','The more powerful Manus got, the more people struggled to use it.',
   ['Manus AI was becoming one of the most capable AI agents on the market. But capability created a new problem: cognitive load. The more the product could do, the harder it was for non-technical users to figure out where to begin, what was possible, and how to meaningfully participate in the community surrounding it.',
    'The community platform that existed was designed for simpler product exploration. It was a static archive of past events and content with no clear pathways, no progression, and no sense of where a new user should even start.'],
   '<div class="label" style="margin-top:48px">Solution preview</div>',
   FLOW([('User lands on community','icon','/images/manus/flow-icons/laptop.svg'),('AI infers role and builds their path','video','/videos/manus/solution-2-paths.mp4'),
         ('Explores personalized recommendations','video','/videos/manus/solution-3-recommendations.mp4'),('Users grow alongside Manus','icon','/images/manus/flow-icons/people.svg')]),
   '<div class="label" style="margin-top:96px">Initial pivot</div><h2 style="font-size:clamp(22px,2.6vw,30px);line-height:1.2;margin-top:12px;max-width:24ch">Our first two approaches both failed usability testing.</h2>',
   ROW(media('/videos/manus/pivot-hackathon.mp4'), TX(H3('Our initial problem framing'), P('We started by assuming the problem was motivation. If people weren\'t engaging, we thought gamification such as points, levels and quests would get them moving. We built toward it.')),'r7'),
   ROW(media('/videos/manus/pivot-walkthrough.mp4'), TX(H3('The problem with our first approach'), P('User testing showed that gamification was cognitively overwhelming. It added friction on top of an unclear system, as participants reported confusion around navigation, role progression, and what the game mechanics were for. This led us to pivot to a scalable, human-centered community system.'), '<p class="note">*I built the early prototype using Lovable for rapid usability feedback.</p>'),'r7'),
 ),
 SECTION('research','Research','Users weren\'t failing to engage. They were failing to understand.',[],
   QUOTES([("I've been using Manus for weeks, but some days I still can't figure out what new things upgraded. The community is filled with posts, but I have no idea what I missed from past events.",'Manus community member'),
           ("I opened the community page and just scrolled. There was a lot, but I didn't know where to start or what was for me.",'Manus community member'),
           ("I want to contribute and share what I've built, but I have no idea if anyone will see it or if it even matters. There's no feedback, no signal that my work is visible.",'Manus community member')]),
   ROW(TX(H3('User interviews (13) and secondary research'), UL(['**Cognitive overload** averaged across non-technical users who couldn\'t identify what Manus could do for them specifically.','**Community structure felt like a static archive**, leading users to disengage within minutes of arriving.','**Users wanted to contribute** but had no clear pathway to do so, leaving them passive instead of active.'])),
       TX(H3('Understanding our users'), P('Thirteen participants in two groups: **Community Newcomers (5)** and **Power Users (8)**.')),'text'),
   CELLS([PERSONA('person:#9ba69c','Community Newcomer','Age 22–35',['**Doesn\'t know where to start** or what Manus is capable of doing for them.','**Wants to learn fast**, find relevant opportunities, and get value quickly.']),
          PERSONA('person:#827a85','Power User','Age 25–40+',['Has **no structured way** to surface or share their work meaningfully.','**Wants visibility and credibility** for their contributions within the community.'])],2),
   '<div class="label" style="margin-top:96px">Finding the gaps in the market</div><h2 style="font-size:clamp(22px,2.6vw,30px);line-height:1.2;margin-top:12px;max-width:28ch">What existed already left gaps where users needed structure, signal, and momentum.</h2>',
   CELLS([CELL('<h3>Discord / chat communities</h3>'+UL(['Fast, informal interaction','Knowledge fragments instantly','No durable contribution tracking'])),
          CELL('<h3>Gamified builder platforms</h3>'+UL(['Short-term engagement spikes','Incentivizes activity over impact','High cognitive load'])),
          CELL('<h3>Traditional forums and docs</h3>'+UL(['Structured and searchable','Low participation, slow feedback','Not built for fast updates']))]),
   '<div class="label" style="margin-top:48px">Our direction</div>',
   HMW('How might we make AI capabilities legible to everyday users?','How might we turn passive members into active contributors?'),
 ),
 SECTION('development','Development','Iterating toward a system that could actually scale.',[],
   FIG('/images/trim/manus/whiteboard-sketches.png','Lo-fi whiteboards across four iterations. The search bar was repurposed as an AI feature, scalable explore and event CTAs arrived in version 2, and the engineering team kept event submission manual through Luma to prioritise reliability and speed to launch.'),
   ROW(FIG('/images/trim/manus/second-approach-hifi-specs.png','Second approach hi-fi specs across six responsive breakpoints.',mt=False,bare=True),
       TX(H3('Problem with static scalability'), P('After internally launching the static experience, we ran a third round of usability testing. **7 out of 10 users disengaged quickly.** But the more revealing finding wasn\'t that they left, it was where they lingered before leaving.'),
          H3('Interactive elements'), P('Users spent significantly less time on the role selector and the three-card feature section, and disproportionately more time on the Global Distribution map and the Next Hackathon countdown. Both were the only two elements with motion: the map was pulsing, the countdown was live.')),'r7'),
   ROW(media('/videos/trim/manus-interaction-walkthrough.mp4'), TX(H3('Take away'), P('This told me two things: the information architecture needed realignment, and users were drawn to interactivity that felt personally relevant and alive. Immediately, I began another round of iteration for longer time-on-page.')),'r7'),
 ),
 SECTION('testing','Testing','Testing our personalized journey feature.',[],
   '<div class="pair trio">'+FIG('/images/manus/testing/your-path-second.png','Second prototype. A simpler "choose your path" role grid.',mt=False,bare=True)+FIG('/images/manus/testing/your-path-third-v1.png','Third prototype v1. A Your Path card with role, focus area and mode.',mt=False,bare=True)+FIG('/images/manus/testing/your-path-third-v2.png','Third prototype v2. Recommended next steps expand from the card.',mt=False,bare=True)+'</div>',
   ROW(TX(H3('Adjustment to personalized path #1'), P('Based on 8 usability tests, I found that the **"Start My AI-Guided Path"** CTA had the highest click-through of any version tested. I pulled inspiration from RPG-style gamification: instead of assigning users a generic role, the system treats each user as a character with their own stats, focus areas, and progression mode, making the community feel like a world they\'re actively moving through, not a page they\'re passively browsing.','The "Powered by Manus" tag was a detail the founder specifically liked, because it demonstrated the product\'s own intelligence working natively inside the community experience.')),
       TX(H3('Adjustment to personalized path #2'), P('After presenting to my PM, **she mentioned they were planning to add more community roles.** The original design used a fixed 3-card layout, one card per featured opportunity. It worked for the current three roles, but it would break the moment the community team launched a new one.','Every new role, Campus Leader, Ambassador, Regional Hub, would require a manual design update. I redesigned the recommendations layer to be role-agnostic and AI-driven, so the "Powered by Manus" inference layer surfaces what\'s relevant to each user, whether that\'s a hackathon, an ambassador program, or a role that doesn\'t exist yet.')),'text'),
   '<div class="pair trio">'+FIG('/images/manus/testing/hackathon-card-before.png','Second prototype. Three post-it style recommendation cards.',mt=False,bare=True)+FIG('/images/manus/testing/hackathon-card-after-1.png','Third prototype, before. A single hackathon card with effort and duration.',mt=False,bare=True)+FIG('/images/manus/testing/hackathon-card-after.png','Third prototype, after. The same card with a "Why this matters" reveal.',mt=False,bare=True)+'</div>',
   ROW(FIG('/images/manus/adjustment/journey-flow.png','Mapping a comprehensive user journey and shared APIs with the PM and engineers.',mt=False), TX(H3('Mapping the journey with PM and SWEs'), P('A shared flow across the engineering team, community team, PM and design, so every opportunity surfaced by the inference layer had an owner and an API behind it.')),'r75'),
 ),
 SECTION('solution','Solution','An AI-guided community system that adapts as users grow.',[],
   ROW(media('/videos/trim/manus-solution-1-dashboard.mp4'), TX('<div class="label">01</div>',H3('Centralized community dashboard'), P('A single home for everything a Manus user needs to know, do, and track. Users land on a dashboard that orients them immediately: their role, their active path, upcoming events, and pending contributions all visible in one place. Reminders surface when something needs attention. Nothing gets missed because nothing is buried.')),'r7'),
   ROW(media('/videos/manus/solution-2-paths.mp4'), TX('<div class="label">02</div>',H3('AI-guided personalized paths'), P('"Your Path, Powered by Manus" infers each user\'s role, focus area, and current mode from their behavior, then generates a guided next step tailored to them. Instead of a generic feed, users are met with "Recommended this week. Prioritized by fit, not engagement." Every recommendation carries a "Why this matters" explanation so users always know the reasoning behind what they\'re shown.')),'r7'),
   ROW(media('/videos/manus/solution-3-recommendations.mp4'), TX('<div class="label">03</div>',H3('Scalable role-agnostic recommendations'), P('The final system is role-agnostic and AI-driven: when users log into Manus, the inference layer immediately surfaces relevant opportunities, whether they\'re interested in hackathons, ambassador programs, campus leadership, or roles that don\'t exist yet. The community scales without the design breaking.')),'r7'),
   '<div class="label" style="margin-top:96px">The results</div>',
   CELLS([STAT('65–70%','Retention, up from ~30% following rollout of the AI-guided architecture.'),STAT('2.1×','Time-on-site, indicating deeper engagement with paths, events, and recommendations.'),STAT('80%','of users reported improved clarity around where to start and how to contribute meaningfully.')]),
   TX(P('Following the rollout, users specifically cited personalized paths, contextual recommendations, and "why this matters" explanations as the primary reasons they felt motivated to stay. **75%** described the experience as more personally relevant compared to the static version.')),
   TAKE([('/images/trim/manus/photo-group.png','Manus AI team','best team eva')],
        ['Designing for community at scale is less about driving engagement and more about building trust through guidance and simplicity.','Pivoting early concepts through research was critical to finding the right way to solve problems.','The most important design decision is asking "so what?" before your users have to ask it themselves.'], cur='best team eva'),
   NEXT(['Increase transparency in AI decisions by adding lightweight user feedback.','Track time-to-first-meaningful-action for actual contribution.','Finish up development and launch!']),
 ),
], 'Designing an AI community platform to drive adoption')

# ------------------------------------------------------------------ CONDUIT COMMERCE
conduit = case('Conduit Commerce','04',[
 HERO('04','Conduit Commerce','/images/conduit/hero/conduit-logo.svg','Designing and shipping a B2B SaaS website for an AI-feature launch.','/videos/trim/conduit-hero.mp4',
   'Leading product design, company branding, UX strategy, design system creation, UX copywriting, and usability testing.','3 months',
   ['2 UX designers (me!)','1 UX researcher','1 marketing designer','1 founder','1 PM'],['~40% lower bounce rate','~28% more demo requests','Shipped & live'],TOC5, bare=True),
 SECTION('overview','At a glance','A Copilot launch for an industry that still ran on spreadsheets and phone calls.',
   ['As Product Design Lead, I led a team of 3 designers to support Conduit Commerce\'s Copilot launch. Conduit is a fintech backed by Dragonfly and Altos Ventures, and I worked directly with the founder, recognized on Forbes 30 Under 30, to align the design with the product\'s technical ambition and the practical needs of their B2B customer base.',
    'Conduit Copilot is an AI that streamlines the entire buying and selling process for wholesale and distribution businesses, an industry largely unfamiliar with AI adoption. The product was a genuine leap forward. Our job was to make sure their branding and website said so.']),
 SECTION('problem','Problem','The website was working against the product.',
   ['Conduit Commerce is a B2B SaaS and CaaS platform built for a specific, underserved audience: the people who buy and sell physical goods in wholesale and distribution. Think carpet sellers, materials buyers, regional distributors. Their product suite spans four pillars: Copilot, Ops, Wholesale, and Dropship.',
    'Conduit was looking to expand toward more tech-savvy, modern clients without losing their core base, Midwest wholesale buyers. It\'s a challenge of acquisition and retention at once, and it all comes down to how the brand, design, and copy position the product. Especially with their newly launched Copilot.'],
   '<div class="label" style="margin-top:48px">Solution preview</div>',
   FLOW([('User lands on website','icon','/images/manus/flow-icons/laptop.svg'),('Explores Copilot','video','/videos/trim/conduit-solution-4-instructional-animations.mp4'),('Understands Conduit\'s core','video','/videos/trim/conduit-solution-1-dashboard.mp4'),('Books a demo','icon','/images/manus/flow-icons/people.svg')]),
   '<div class="label" style="margin-top:96px">Initial pivot</div><h2 style="font-size:clamp(22px,2.6vw,30px);line-height:1.2;margin-top:12px;max-width:26ch">The first design looked great. Users thought we were selling hiking gear.</h2>',
   ROW('<div class="pair">'+FIG('/images/conduit/initial-pivot/lofi-sketch-1.jpg','Pair one.',mt=False)+FIG('/images/conduit/initial-pivot/lofi-sketch-2.jpg','Pair two.',mt=False)+'</div>', TX(H3('LoFi exploration'), P('To rapid-prototype, I split my team into two pairs and produced two IA prototypes, then compared them to see what each could learn from the other. I did this so we would come up with original ideas first instead of building on one basis. We presented both to Conduit\'s PM, then pushed the exploration into Claude.')),'r7'),
   ROW(media('/videos/trim/conduit-ia-systems.mp4'), TX(H3('Information architecture systems exploration'), P('I used Claude to expedite the IA exploration and system-level thinking in this phase for quick usability feedback.')),'r7'),
   ROW(media('/images/conduit/initial-pivot/following-trends-japanese.mp4'), TX(H3('Following trends'), P('After feedback I used Framer to prototype the visual direction. The first design round drew on a trend: Ukiyo-e Japanese woodblock prints, a nature-forward visual language with texture, warmth, and mountain landscapes. It was distinctive. Intentional. And it communicated absolutely nothing about what Conduit Commerce did for a wholesale distributor.')),'r7'),
 ),
 SECTION('research','Research','Style over function was losing our users.',[],
   QUOTES([("Sometimes, the website wouldn't even load for me. I think it has too many things going on. Usually I just prefer contacting their customer service immediately.",'Conduit user'),
           ("I went straight to Copilot but I still don't know how it connects to Ops or Wholesale. Is this one platform or separate tools?",'Potential user'),
           ("I get that it's AI for suppliers and retailers, but what does it actually do? 'Proactive outreach' doesn't tell me anything.",'Conduit user')]),
   ROW(TX(H3('User interviews (11) and secondary research'), UL(['**4 out of 7 current users** reported the site failed to load entirely on slower connections, before they even saw the product.','Many potential users who weren\'t used to Conduit **didn\'t understand the products** they were selling.','**8 out of 11 users** described the first design as a lifestyle brand, not a B2B operations tool.'])),
       TX(H3('Understanding our users'), P('Eleven participants in two groups: **Core Users (7)** and **Potential Users (4)**.')),'text'),
   CELLS([PERSONA('person:#827a85','Core user','Age 35–40+',['**Can\'t load the site reliably** on slower connections, leaving before seeing the product at all.','**Wants to know how to optimize** their Conduit subscription. Most didn\'t even know of the Copilot launch.']),
          PERSONA('person:#9ba69c','Potential user','Age 25–35',['**Doesn\'t understand how Conduit\'s products connect**, whether Ops, Dropship, and Wholesale are one system or separate tools.','**Wants a clearer picture** of how everything fits together before committing to a demo.'])],2),
   '<div class="label" style="margin-top:96px">Finding the gaps in the market</div>',
   CELLS([CELL('<h3>Competitor #1</h3>'+UL(['Strong B2B buyer focus','Clear supplier/retailer split','Category-specific only','No storytelling components'])),
          CELL('<h3>Competitor #2</h3>'+UL(['Outcome-led copy','Strong trust signals','No AI positioning','Not operations-focused'])),
          CELL('<h3>Competitor #3</h3>'+UL(['Feature-rich and functional','Clear product hierarchy','Not aesthetics heavy','Built for technical buyers only']))]),
   ROW(TX(H3('The pattern across all competitors'), UL(['None of them were competing on aesthetics. They were competing on clarity and function.','The best performing B2B sites led with outcomes, not features. Plain language over industry jargon.'])),
       TX(H3('The direction this revealed'), P('Conduit didn\'t need to out-design its competitors. It needed to out-communicate them. Clarity and functional UX copy were the gaps nobody in this market was filling.','Conduit is one of the first to implement AI into wholesale operations at this level. Users had no reference point for what that even meant. In situations like these, the words and the simplicity of the UI do more work than any visual treatment ever could.')),'text'),
   '<div class="label" style="margin-top:48px">Our direction</div>',
   HMW('How might we write UX copy that sells the product?','How might we create animations that demonstrate?'),
 ),
 SECTION('development','Development','A human-centered design approach and conversational copy.',[],
   ROW(FIG('/images/trim/conduit/figma-design-system-screenshot.png','The finalized design system in Figma.',mt=False,bare=True), TX(H3('The founder disagreement'), P('The founder wanted to mirror competitor sites. I pushed back. Not because the competitors looked bad, but because their audiences were different. B2B SaaS for coastal tech buyers has different visual expectations than a wholesale operations tool for Midwest distributors. Designing for your actual audience rather than your aspirational peer set is a harder sell internally, but it\'s the right call. The testing data backed it, and the first design failure proved the point before the argument was fully resolved.')),'r7'),
   ROW(FIG('/images/trim/conduit/design-system-exploration.png','Moodboards, typography and the palette.',mt=False,bare=True), TX(H3('Design system exploration'), P('We were aiming for something original but sleek. Modern without being cold. After multiple iterations we landed on a design system built around shades of blue with soft gradients, and deliberately avoided sharp, rigid shapes. Conduit needed to feel flexible and inviting, something that pulls users in rather than presenting a wall of information.','Their clients were mainly non-tech-savvy people. We didn\'t want to infer coldness with the introduction of Copilot; we wanted a new era of Conduit that felt modern and tech-oriented while nudging users toward AI adoption. I sent this over to our marketing designer to begin the video assets for the website.')),'r7'),
   '<div class="solo">'+TX(H3('The UX copy rewrite'), P('I delivered two full UX copy documents, one for Conduit **Wholesale**, one for Conduit **Ops**. Each follows the same IA framework:'),
       UL(['Wholesale hero: "Order anytime, on your schedule. No calls, no emails, no waiting on anyone."','Ops hero: "Your whole team, always on the same page. One live view of every order, account, and update."','Copilot moved from vague AI claims to a concrete outcome: "The assistant that handles the busywork, so you can focus on the relationship."']))+'</div>',
 ),
 SECTION('testing','Testing','Some you win, some you lose.',
   ['Because of the founders\' rapid iteration timeline, there was no third round of usability testing before final dev handoff. With AI-accelerated product cycles, thoroughness is sometimes traded for speed. This is a real constraint that\'s becoming a reality for us product designers.']),
 SECTION('solution','Solution','A B2B SaaS website designed around user habits, while nudging AI adoption.',[],
   ROW(media('/videos/trim/conduit-solution-1-dashboard.mp4'), TX('<div class="label">01</div>',H3('Centralized product dashboard'), P('A single home for all of Conduit\'s four core products. Each showcased with their benefits, their function, and all ending with an incentivized CTA to increase engagement.')),'r7'),
   ROW(media('/videos/trim/conduit-solution-2-design-uniformity.mp4'), TX('<div class="label">02</div>',H3('Human-centered design uniformity'), P('All pages were designed around a cohesive visual language of gradients and soft-to-deep blues. Blue carries connotations of trust, reliability, and forward motion, which mapped directly to what a B2B audience needs to feel before making an operational decision. The gradient treatment kept it from feeling clinical.')),'r7'),
   ROW(media('/videos/trim/conduit-solution-3-conversational-copy.mp4'), TX('<div class="label">03</div>',H3('Conversational UX copy'), P('Benefit-first, conversational copy across all product pages, written to onboard newcomers while still resonating with core users. Less jargon, a lower barrier to understanding what Conduit does, and a clear reason for every visitor to keep reading. We tackled retention with copy as a tool, not just a description.')),'r7'),
   ROW(media('/videos/trim/conduit-solution-4-instructional-animations.mp4'), TX('<div class="label">04</div>',H3('Instructional animations'), P('The best way to showcase Conduit\'s products, especially Copilot, was through instructional micro-animations. Instead of decorative motion that slowed load times and communicated nothing, every animation serves a function: demonstrating how the product works as users interact with it.')),'r7'),
   '<div class="label" style="margin-top:96px">The results</div>',
   CELLS([STAT('~40%','lower bounce rate. Users can now immediately identify what Conduit does and who it\'s for.'),STAT('3×','time-on-site. Users are reading and engaging, not abandoning on slow connections.'),STAT('~28%','more demo requests in the first month post-launch.')]),
   TX(P('Following the launch, the **4 current users** who had reported complete site failures on slower connections can now access the site reliably.')),
   TAKE([('/images/conduit/final-thoughts/imessage-screenshot.png','Group chat with my designers during finals season','our designers battling thru finals (and weekly syncs)')],
        ['Following trends and mirroring competitors doesn\'t make your design effective. Your design should fit your product and your user, not the aesthetic of whoever raised a Series B last quarter.','Working with AI tools in a fast-paced startup means trading thoroughness for speed. You expedite the process but sometimes skip the steps that would have caught something important.','The smallest details carry the most weight. Too much animation weakened engagement before users even read a word.','To become a product designer is to become a good teacher. Assume users know nothing when they arrive, and build an experience that teaches them as they scroll.']),
   NEXT(['Expand the design system for product surfaces beyond the Copilot landing site.','Conduct a post-launch usability study now that the site has real traffic.','Add trust signals, security badges and compliance language, for credibility.']),
 ),
], 'Designing and shipping a B2B SaaS website for an AI-feature launch')

# ------------------------------------------------------------------ SOMIACX
UVPS=[('01 Support','Safety net','kept'),('02 Advisor','Future planning','kept'),('03 Mentor','Vehicle understanding','merged with 04'),('04 Assistant','Routine management','kept'),('05 Buddy','Shared wallet','cut, low ROI'),('06 Connector','Local investment','cut, misaligned KPI')]
somia = case('SomiaCX','08',[
 HERO('08','SomiaCX × MUFG Bank','/images/somiacx/hero/somiacx-mufg-logo.png','Architecting a unified UVP system for three financial subsidiaries.','/images/trim/somia/hero.png',
   'UX designer: market research, product alignment, UVP architecture, LoFi and MidFi prototyping.','3 months',
   ['1 founder','1 PM','2 UX designers (me!)','1 SWE','1 UI designer'],['Support tickets −18%','~72% onboarding retention','~25% fewer branch visits'],TOC5, bare=True),
 SECTION('overview','At a glance','Three subsidiaries, one app, and users who had almost nothing in common.',
   ['My first product internship. I interned at SomiaCX as a UX designer, embedded inside a project for MUFG. They have three separate subsidiaries (a bank, an insurance company, and a vehicle financing arm) that were being merged into one unified financial app. Each had different users, different revenue models, and different internal teams who didn\'t always agree on what the product should do.',
    'I worked on the UVP architecture that would hold all of it together: a shared value framework that made each subsidiary feel coherent, not competing, and that served an incredibly diverse user base, from upper-income urban professionals to low-income, unbanked Indonesians with no digital literacy. By the end I had the chance to present to our stakeholders.']),
 SECTION('problem','Problem','How might we design a scalable shared UVP architecture that unifies three subsidiaries, serving diverse financial users inclusively?',
   ['MUFG\'s three subsidiaries had been operating independently for years, each with its own product logic, its own users, and its own definition of what "financial services" meant.',
    'These three groups had almost nothing in common: different income levels, different relationships with technology, different mental models of what a financial app was even for. Yet all three were expected to converge inside a single unified ecosystem. This wasn\'t just a design challenge. It was a product strategy, stakeholder alignment, and cultural inclusion challenge all at once.'],
   '<p class="label" style="margin-top:24px">*Due to tight NDA restrictions, some end products can\'t be shown.</p>',
   '<div class="label" style="margin-top:48px">Solution preview</div>',
   FLOW([('User discovers the app','icon','/images/somiacx/hero/phone.svg'),('UVP system shows their financial path','img','/images/trim/somia/lofi-uvp-4.png'),('Explores personalized financial features','img','/images/trim/somia/midfi-uvp-5.png'),('Users grow financial confidence with MUFG','icon','/images/manus/flow-icons/people.svg')]),
 ),
 SECTION('research','Research','Users were failing to see themselves in the product, given their diverse needs.',[],
   '<div class="pair trio">'+FIG('/images/trim/somia/research-card-1-comics.png','Three customer comics: different priorities, constraints, expectations.',mt=False,bare=True)+FIG('/images/trim/somia/research-card-2-ideas.png','The ideation board.',mt=False,bare=True)+FIG('/images/trim/somia/research-card-3-ranked.png','Ranked priorities and findings.',mt=False,bare=True)+'</div>',
   '<div class="solo">'+TX(H3('Desk research'), P('I conducted further analysis from company-shared private datasets (marketing, financial, and customer intelligence), and extensive desk research to really understand the problem.'))+'</div>',
   ROW(FIG('/images/trim/somia/news-article-affinity-map.png','A Jakarta vehicle news article beside the UVP affinity map.',mt=False,bare=True), TX(H3('The insight that unlocked everything'), P('At the end of 2023, Indonesia had approximately **132.43 million motorcycles and 17.17 million passenger cars.** Beyond pure numbers, vehicles in Indonesia carry deep cultural weight: social signals, shared family assets, and often the single largest financial commitment a household makes. Vehicle financing installments touch every one of MUFG\'s three subsidiaries, and every one of their user segments.','It was the cultural anchor the unified experience needed.')),'r7'),
   ROW(FIG('/images/trim/somia/field-research.png','Testing photos, branch office visits, sticky-note workshops.',mt=False,bare=True), TX(H3('Field research'), P('I created sacrificial lo-fi concepts and took them directly into the field and to branch offices.')),'r7'),
   '<div class="label" style="margin-top:96px">Finding the gaps in the market</div>',
   ROW(FIG('/images/somiacx/understanding-users/bca-bri-mobile-phone.png','BCA and BRI mobile home screens, each surfacing a separate set of fragmented features.',mt=False,bare=True),
       CELLS([CELL('<h3>One feature per subsidiary</h3><p>Internal conflict with no visible unity. Not user-friendly, especially for users who are financially and digitally illiterate.</p><p class="st">Instead</p><p>Relevant financial services that unify all three subsidiaries into one coherent experience.</p>'),
              CELL('<h3>Lacks intuition</h3><p>Users couldn\'t figure out what to do for next steps.</p><p class="st">Instead</p><p>A path that shows the next step before it is asked for.</p>'),
              CELL('<h3>Findings lack "so what?"</h3><p>Data without meaning.</p><p class="st">Instead</p><p>Tie incentives to a culturally relevant commonality.</p>'),
              CELL('<h3>Feels cold or mechanical</h3><p>Blue color schemes tested as anxiety-inducing.</p><p class="st">Instead</p><p>Micro-joy, cultural warmth, and human tone throughout.</p>')],2).replace('margin-top:48px',''),'r7').replace('class="row r7"','class="row r7" style="align-items:start"'),
   '<div class="label" style="margin-top:48px">Our direction</div>',
   HMW('How might we utilize collectivism as a design principle?','How might we implement familiarity in innovation?'),
 ),
 SECTION('testing','Testing','Understanding our users.',[],
   '<div class="pair trio">'+FIG('/images/trim/somia/quote-car-owner.png','A car owner: wants to save for family but has no idea where to start.',mt=False,bare=True)+FIG('/images/trim/somia/quote-motorcycle-customer.png','A motorcycle customer: the language felt made for people richer than them.',mt=False,bare=True)+FIG('/images/trim/somia/quote-motorcycle-owner-2.png',"A motorcycle owner: pays installments, doesn't know what else the app offers.",mt=False,bare=True)+'</div>',
   ROW(TX(H3('User interviews (12) and secondary research'), UL(['Users across income segments **couldn\'t connect their installment payments** to broader financial services available within the same ecosystem.','Lower-income users felt the product tone and language **created distance.** It didn\'t feel made for someone like them.','Internal teams had **no unified customer view.** Each subsidiary managed users independently, making holistic service slow.'])), '<div></div>'),
   CELLS([PERSONA('person:#827a85','Motorcycle owners','Income ~$193–$1,290/month',['Pays installments regularly but doesn\'t know what other financial services they qualify for within the same app.','Wants to understand the total cost of vehicle ownership without going to a branch every time.']),
          PERSONA('person:#9ba69c','Car owners','Income ~$320–$1,290+/month',['Manages banking and financing separately; no single view of their full financial picture.','Wants one place to track installments, insurance, and savings without switching between apps or branches.']),
          PERSONA('person:#827a85','Internal subsidiary team','Income ~$658–$1,290+/month',['Each subsidiary operates its own system. No shared logic, no unified customer view across the three.','Wants a platform architecture that lets them serve customers across subsidiaries.'])],3),
 ),
 SECTION('development','Development','Six pillars built around culture. Four survived stakeholder reality.',[],
   *[FIG(f'/images/trim/somia/uvp-{i}.png', cap, mt=(i>1), bare=True) for i,cap in enumerate([
     'UVP 1, Support (safety net). "Make the unpredictable, predictable."','UVP 2, Advisor (future planning). "Optimize your future with your own advisor."','UVP 3, Mentor (vehicle understanding). "Knowledgeable companionship with your own vehicle mentor."','UVP 4, Assistant (routine management). "Manage life chores easier with your personalized assistant."','UVP 5, Buddy (family and social savings). "Better together with a Buddy."','UVP 6, Connector (local inclusion). "Grow together with your local community."'],1)],
 ),
 SECTION('solution','Solution','A shared UVP architecture that unifies subsidiaries without disregarding their users.',[],
   ROW(CELLS([CELL(f'<h3>{E(a)}</h3><p>{E(b)}</p><p class="st">{E(c)}</p>', '' if c=='kept' else 'dim') for a,b,c in UVPS],2).replace('class="cells c2"','class="cells c2" style="margin-top:0"'),
       TX(H3('Post stakeholder meeting'), P('After presenting all six pillars, stakeholder feedback forced hard prioritization.'), UL(['UVP 3 (Mentor) was merged with UVP 4 (Assistant); their overlap was too significant to justify maintaining separately.','UVP 5 (Shared Wallet) was flagged as low ROI.','UVP 6 (Local Investment) was misaligned with KPIs at the subsidiary level.']), P('**Four pillars moved forward. Two were cut.**')),'r75').replace('class="row r75"','class="row r75" style="align-items:start"'),
   '<div class="label" style="margin-top:96px">The results</div><p class="label" style="margin-top:6px;text-transform:none;letter-spacing:0;font-weight:500">Backed by the subsidiaries\' final assessment report.</p>',
   CELLS([STAT('−18%','user friction and support tickets in first-round UVP testing.'),STAT('~72%','retention across onboarding flows, with culturally grounded choices resonating across income and literacy levels.'),STAT('~25%','projected reduction in branch-visit dependency as users felt confident navigating financial decisions independently.')]),
   TX(P('I also learned that sometimes it\'s okay to say no to stakeholders. Clarity under stakeholder pressure is a design skill. When everyone is asking for more, the ability to say "this specific thing, done well, serves the goal better than adding another feature" requires both research grounding and confidence in the process. This is the type of skill I couldn\'t have learned from the books.')),
   TAKE([('/images/trim/somia/team-selfie.png','SomiaCX team selfie','team gave me gifts')],
        ['Designing for financial inclusion across a diverse population taught me that systems-level thinking and cultural humility come to the forefront, before any other product decisions.','In-depth research is the way to go. The more participants, the more inclusive the design you\'re able to craft.','Clarity, good communication, and general business knowledge under stakeholder pressure are important skills to have.']),
   NEXT(['Hand off to the design and dev team.','Longitudinal testing of the personalization layer to validate the UVPs.','Realign with stakeholder needs.']),
 ),
], 'Architecting a unified UVP system for three financial subsidiaries')

# ------------------------------------------------------------------ 404 / in the making
FOUR_CSS = """
.four{min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:120px 0 96px}
/* the numerals are three of the hero's cells, at display size. Same rules, same stems,
   same breath, same random ink. Nothing on this page is a new object. */
.num{display:flex;align-items:stretch}
.num .cell{flex:0 0 auto;height:clamp(120px,22vw,220px);border-top:1px solid var(--hair);border-bottom:1px solid var(--hair);border-left:1px solid var(--hair);
  display:flex;align-items:center;overflow:hidden;will-change:width;transition:background 140ms ease;padding:0}
.num .cell:last-child{border-right:1px solid var(--hair)}
.num .ch{font:400 clamp(100px,18vw,180px)/1 var(--hel);letter-spacing:-.02em;color:var(--ink);padding-left:6px;transition:color 140ms ease}
.four h1{font-size:clamp(22px,2.6vw,30px);line-height:1.2;margin-top:48px;max-width:26ch}
.four p{font-size:17px;line-height:1.6;color:var(--ink2);margin-top:16px;max-width:52ch}
.four p a{color:var(--touch);text-decoration:underline;text-underline-offset:3px}
.four .back{display:inline-flex;align-items:center;gap:8px;margin-top:32px;font:400 14.5px var(--hel);color:var(--ink);text-decoration:none;
  border:1px solid var(--hair);padding:12px 18px;transition:background .16s ease,color .16s ease}
.four .back:hover{background:var(--flick-b);color:var(--paper);border-color:transparent}
"""
FOUR_JS = """<script>
(function(){
  const p=new URLSearchParams(location.search).get('p');
  const h=document.getElementById('h'), d=document.getElementById('d');
  if(p){ h.textContent=`${p} is still in the making.`;
    d.innerHTML=`The ${p} case study is being written up. If you would like to hear about it before it is public, reach out at <a href="mailto:jazkurnz06@gmail.com">jazkurnz06@gmail.com</a>.`;
    document.title=`${p}, in the making — Jazlynn Kurniandra`; }
  /* the hero grid, verbatim, for three glyphs */
  const FS=Math.min(180,Math.max(100,innerWidth*.18)), STRETCH=FS*2.2, SPEED=.23, DRIFT=.74;
  const gauge=document.createElement('canvas').getContext('2d'); gauge.font=`400 ${FS}px "Helvetica Neue",Helvetica,Arial,sans-serif`;
  const row=document.getElementById('num'); const cells=[...'404'].map((ch,ci)=>{
    const c=document.createElement('span'); c.className='cell'; const s=document.createElement('span'); s.className='ch'; s.textContent=ch; c.appendChild(s); row.appendChild(c);
    return {cell:c,glyph:s,base:Math.ceil(gauge.measureText(ch).width)+12,ci,next:1+Math.random()*4,until:0,lit:false,col:Math.random()<.5?'var(--flick-a)':'var(--flick-b)'}; });
  let lit=0; const ink=(c,on)=>{ if(c.lit===on) return; c.lit=on; c.cell.style.background=on?c.col:'transparent'; c.glyph.style.color=on?'var(--paper)':''; };
  (function tick(now){ const t=(now||0)/1000;
    for(const c of cells){ const k=.5+.5*Math.sin(t*SPEED*Math.PI*2+c.ci*DRIFT*1.7); c.cell.style.width=(c.base+k*k*STRETCH).toFixed(1)+'px';
      if(c.lit&&t>c.until){ ink(c,false); lit--; c.next=t+4+Math.random()*10; }
      else if(!c.lit&&t>c.next){ if(lit>=1){ c.next=t+1+Math.random()*3; } else { ink(c,true); lit++; c.until=t+.3+Math.random()*.9; } } }
    requestAnimationFrame(tick); })();
})();
</script>"""
four = page('404', f"""<main class="four"><div class="wrap">
  <div class="num" id="num"></div>
  <h1 id="h">This page doesn't exist.</h1>
  <p id="d">The link may be old, or the page has moved. If you were looking for a project, they are all on the home page.</p>
  <a class="back" href="/"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>Back to home</a>
</div></main>{FOUR_JS}""", CASE_CSS+FOUR_CSS)

# ------------------------------------------------------------------ ABOUT, its own page
# The skeleton is yichenxie.com/about: eyebrow, a one line thesis, one object beside a
# short hello, then ruled rows for what she does, where she has worked and studied, and a
# way to reach her. 350 words, not 900. The material is hers: the object is a DIE, one photo
# per face, each face a postcard on stock with the toothed edge, dragged to roll and left
# to tumble. Six photos, six faces. Nothing on the page is decorated.
ABOUT_CSS = """
.ab{padding:136px 0 0}
.ab .thesis h1{font-size:clamp(28px,4vw,44px);line-height:1.12;max-width:20ch;margin-top:12px}
.ab .thesis p{font-size:17px;line-height:1.62;color:var(--ink2);margin-top:16px;max-width:52ch}
/* the object and the hello */
.ab .hello{display:grid;grid-template-columns:5fr 7fr;gap:64px;align-items:center;margin-top:64px}
.ab .hello .bio p{font-size:17px;line-height:1.62;color:var(--ink2);max-width:52ch}
.ab .hello .bio p+p{margin-top:16px}
.ab .hello .bio b{font-weight:400;color:var(--ink)}
@media(max-width:900px){.ab .hello{grid-template-columns:1fr;gap:40px}}
/* THE DIE. CSS 3D, six faces, --s in px set by the page so translateZ has a length. */
.die-wrap{aspect-ratio:1;display:grid;place-items:center;perspective:1400px;touch-action:pan-y;cursor:grab;user-select:none;-webkit-user-select:none}
.die-wrap:active{cursor:grabbing}
.die{position:relative;width:var(--s,260px);height:var(--s,260px);transform-style:preserve-3d;will-change:transform;
  transform:rotateX(-22deg) rotateY(32deg)}
.die .face{position:absolute;inset:0;background:#f4efe3;backface-visibility:hidden}
/* the die is the palette: each face a square of the signature green, each photograph pressed
   in the signature purple through the dither, no frame between them */
.die .face{background:#9ba69c}
.die .face i{display:none}
.die .face img{position:absolute;left:11%;top:11%;width:78%;height:78%;object-fit:cover;display:block;filter:url(#dither-purple);-webkit-user-drag:none}
.die .f1{transform:translateZ(calc(var(--s,260px) / 2))}
.die .f2{transform:rotateY(180deg) translateZ(calc(var(--s,260px) / 2))}
.die .f3{transform:rotateY(90deg) translateZ(calc(var(--s,260px) / 2))}
.die .f4{transform:rotateY(-90deg) translateZ(calc(var(--s,260px) / 2))}
.die .f5{transform:rotateX(90deg) translateZ(calc(var(--s,260px) / 2))}
.die .f6{transform:rotateX(-90deg) translateZ(calc(var(--s,260px) / 2))}
/* the ruled sections */
.ab .sec{margin-top:96px}
.ab .sec h2{font-size:clamp(22px,2.6vw,30px);line-height:1.2;margin-top:12px}
.ab .sec .cells{margin-top:24px}
.ab .cell .n{font:500 11px var(--jak);letter-spacing:.12em;color:var(--ink3);display:block;margin-bottom:10px}
.ab .cell h3{font-size:15.5px}
.ab .rows{margin-top:24px;border-top:1px solid var(--hair)}
.ab .row{display:grid;grid-template-columns:110px 1.1fr 1.6fr;gap:24px;padding:18px 0;border-bottom:1px solid var(--hair);font-size:14.5px;line-height:1.55;margin:0;align-items:start}
.ab .row .y{color:var(--ink3);font-variant-numeric:tabular-nums}
.ab .row .o{color:var(--ink)}.ab .row .o small{display:block;color:var(--ink3);font-size:12.5px;margin-top:2px}
.ab .row p{color:var(--ink2)}
@media(max-width:700px){.ab .row{grid-template-columns:90px 1fr}.ab .row p{grid-column:2}}
.ab .off .cell .plate{margin-top:12px}
.skip{display:inline-block;margin-top:14px;font:500 12.5px var(--jak);color:var(--ink2);text-decoration:none;border-bottom:1px solid var(--hair)}
.skip:hover{color:var(--ink)}
/* ---- the flip phone, from flip-lab: closed until the reader comes near ---- */
:root{--shell-a:#5a1d2c;--shell-b:#340414;--shell-c:#22030d;--key:#3f0c1b;--lx:50%;--ly:30%;--hx:-1px;--hy:-1px}
/* ---------- the stage ---------- */
.ab .flip-stage{aspect-ratio:1/1.18;display:grid;place-items:center;perspective:1500px;perspective-origin:50% 40%;user-select:none;touch-action:none}
.ab .phone{position:relative;width:236px;height:236px;margin-top:180px;transform-style:preserve-3d;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
/* the shell: matte plastic, lit from the cursor. Four custom properties carry the light. */
.ab .shell{background:linear-gradient(180deg,var(--shell-a) 0%,var(--shell-b) 40%,var(--shell-c) 100%);border-radius:30px;
  box-shadow:inset var(--hx) var(--hy) 2px -.5px rgba(255,252,246,.16),inset calc(var(--hx)*-1) calc(var(--hy)*-1) 3px -1px rgba(0,0,0,.6),0 30px 60px -20px rgba(0,0,0,.45)}
.ab .shell::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:radial-gradient(130% 100% at var(--lx) var(--ly),rgba(255,252,246,.09),rgba(255,252,246,.02) 45%,transparent 70%)}
/* BASE: keypad half. Stands upright; the hinge is its top edge. */
.ab .base{position:absolute;left:0;top:0;width:236px;height:236px;transform-style:preserve-3d}
.ab .base .shell{position:absolute;inset:0;border-radius:18px 18px 30px 30px;transform:translateZ(14px)}
.ab .base .slab{position:absolute;inset:0;border-radius:18px 18px 30px 30px;background:var(--shell-c);transform:translateZ(0)}
.ab .base .keys,.base .hinge{transform:translateZ(14px)}
.ab .keys{position:absolute;left:22px;right:22px;top:26px;bottom:22px;display:grid;grid-template-rows:auto 1fr;gap:12px}
.ab .nav{display:grid;grid-template-columns:44px 1fr 44px;gap:8px;align-items:center;justify-items:center}
.ab .nav .ring{width:78px;height:78px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#3b3936,#1b1a19 70%);box-shadow:inset 0 1px 1px rgba(255,255,255,.12),inset 0 -2px 3px rgba(0,0,0,.6),0 2px 3px rgba(0,0,0,.5);display:grid;place-items:center;position:relative}
.ab .nav .ring i{position:absolute;width:5px;height:5px;border-radius:50%;background:rgba(255,252,246,.28)}
.ab .nav .ring i:nth-child(1){top:8px}.nav .ring i:nth-child(2){bottom:8px}.nav .ring i:nth-child(3){left:8px}.nav .ring i:nth-child(4){right:8px}
.ab .nav .ring b{width:32px;height:32px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#4a4744,#262421);box-shadow:0 1px 2px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.14);cursor:pointer}
.ab .nav .ring b:active{transform:translateY(1px)}
.ab .soft{width:44px;height:26px;border-radius:9px;background:var(--key);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 2px 2px rgba(0,0,0,.5);display:grid;place-items:center;color:rgba(255,252,246,.55);cursor:pointer}
.ab .soft:active{transform:translateY(1px)}
.ab .soft svg{width:16px;height:12px;stroke:currentColor;fill:none;stroke-width:1.5;stroke-linejoin:round;stroke-linecap:round}
.ab .pad{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 8px}
.ab .pad span{height:100%;min-height:22px;border-radius:7px;background:var(--key);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 2px 2px rgba(0,0,0,.5);display:grid;place-items:center;font:500 12px var(--jak);color:rgba(255,252,246,.55)}
.ab .hinge{position:absolute;left:14px;right:14px;top:-7px;height:14px;border-radius:7px;background:linear-gradient(180deg,#2c2a27,#151413);box-shadow:0 1px 2px rgba(0,0,0,.6)}
/* LID: screen half. Hangs from the hinge; closed it lies over the base, open it stands above it. */
.ab .lid{position:absolute;left:0;bottom:236px;width:236px;height:236px;transform-origin:50% 100%;transform-style:preserve-3d;
  transform:translateZ(14px) rotateX(180deg);will-change:transform}
.ab .lid .edge{position:absolute;left:14px;right:14px;top:0;height:12px;transform-origin:50% 0;transform:rotateX(-90deg);background:linear-gradient(90deg,var(--shell-c),var(--shell-b) 30%,var(--shell-b) 70%,var(--shell-c));border-radius:0 0 4px 4px}
.ab .lid .face{position:absolute;inset:0}
.ab .lid.shut .in{visibility:hidden}
.ab .lid:not(.shut) .out{visibility:hidden}
.ab .lid .in.shell{border-radius:30px 30px 18px 18px;transform:translateZ(0)}
.ab .lid .out.shell{border-radius:18px 18px 30px 30px;transform:rotateX(180deg) translateZ(12px)}
.ab .screen{position:absolute;left:18px;right:18px;top:18px;bottom:22px;border-radius:16px;overflow:hidden;background:#0d0c0b;box-shadow:0 1px 0 rgba(255,252,246,.06),0 -1px 0 rgba(0,0,0,.5)}
.ab .screen canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.ab .screen img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.1)}
.ab .glare{position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,rgba(255,255,255,.1),transparent 38%)}
.ab .ext{position:absolute;left:50%;top:34px;width:120px;height:44px;transform:translateX(-50%);border-radius:10px;background:#0d0c0b;box-shadow:inset 0 0 0 1px rgba(255,252,246,.06);
  display:grid;place-items:center;font:600 13px var(--jak);letter-spacing:.06em;color:rgba(200,214,178,.85);text-shadow:0 0 8px rgba(200,214,178,.35)}
.ab .cam{position:absolute;left:50%;top:104px;width:12px;height:12px;border-radius:50%;transform:translateX(-50%);background:radial-gradient(circle at 40% 35%,#3c4448,#0b0d0e 65%);box-shadow:0 0 0 3px #1b1a19,0 0 0 4px rgba(255,255,255,.06)}
.ab .brand{position:absolute;left:0;right:0;bottom:24px;text-align:center;font:600 9px var(--jak);letter-spacing:.3em;color:rgba(255,252,246,.28)}


/* ---- what I keep close: four identical boxes, one item each ---- */
.ab .keeps{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:24px}
.ab .keep{cursor:pointer;outline:0;user-select:none}
.ab .keep .box{position:relative;margin-top:12px;aspect-ratio:1/1.15;border-radius:16px;background:var(--plate);outline:1px solid var(--outline);outline-offset:-1px;
  padding:28px;display:grid;place-items:center;transition:background .28s ease,outline-color .28s ease}
.ab .keep .box img{grid-area:1/1;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block;opacity:0;
  transform:translateY(6px) scale(.98);transition:opacity .32s ease,transform .5s cubic-bezier(.33,1.18,.37,1);filter:drop-shadow(0 8px 18px rgba(0,0,0,.12));pointer-events:none}
.ab .keep .box img.on{opacity:1;transform:none}
.ab .keep .box img.out{opacity:0;transform:translateY(-14px) scale(1.02);transition:opacity .22s ease,transform .3s ease}
/* hover: the item floats, the box takes the signature colour */
.ab .keep:hover .box,.ab .keep:focus-visible .box{outline-color:transparent}
.ab .keep.green:hover .box,.ab .keep.green:focus-visible .box{background:#9ba69c}
.ab .keep.purple:hover .box,.ab .keep.purple:focus-visible .box{background:#827a85}
.ab .keep:hover .box img.on,.ab .keep:focus-visible .box img.on{transform:translateY(-10px);filter:drop-shadow(0 22px 30px rgba(0,0,0,.24))}
.ab .keep .foot{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-top:12px;font:500 12.5px var(--jak);color:var(--ink2)}
.ab .keep .foot .n{color:var(--ink3);white-space:nowrap}.ab .keep .foot .n b{font-weight:600;color:var(--ink)}
.ab .keep .foot .t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media (max-width:900px){.ab .keeps{grid-template-columns:repeat(2,1fr)}}

.ab .reach{margin-top:24px;display:flex;gap:24px;flex-wrap:wrap;font-size:15px}
.ab .reach a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--hair);padding-bottom:2px;transition:color .18s ease,border-color .18s ease}
.ab .reach a:hover{color:var(--touch);border-color:var(--touch)}
.ab .reach .now{color:var(--ink2)}.ab .reach .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--gold);margin:0 8px 1px 0}
"""
DIE_JS = """<script>
/* the die: drag to roll it, let go and it carries a little, then tumbles slowly on its
   own. --s is the cube's edge in px, read off the slot so the faces can be placed. */
(function(){
  const w=document.getElementById('die-wrap'), d=document.getElementById('die'); if(!w||!d) return;
  let rx=-22, ry=32, vx=0, vy=0, held=false, lx=0, ly=0;
  const size=()=>{ const s=Math.round(w.getBoundingClientRect().width*.58); d.style.setProperty('--s', s+'px'); };
  size(); new ResizeObserver(size).observe(w);
  w.addEventListener('pointerdown',e=>{ held=true; lx=e.clientX; ly=e.clientY; vx=vy=0; w.setPointerCapture(e.pointerId); });
  w.addEventListener('pointermove',e=>{ if(!held) return; const dx=e.clientX-lx, dy=e.clientY-ly; lx=e.clientX; ly=e.clientY;
    ry+=dx*.45; rx-=dy*.45; vx=dx*.45; vy=-dy*.45; });
  const drop=()=>{ held=false; }; addEventListener('pointerup',drop); addEventListener('pointercancel',drop);
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  (function tick(){
    if(!held){ ry+=vx+(still?0:.05); rx+=vy; vx*=.94; vy*=.94; rx=Math.max(-70,Math.min(70,rx)); }
    d.style.transform=`rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    requestAnimationFrame(tick);
  })();
})();
</script>"""
FACES = ['bagels','camera','dog-beach','mun','snowboarding','teaching']
FOCUS = ['Design engineering','Product design','Product management','HCI research','Brand and identity','Illustration and motion']
WORKED = [  # years and the one line are the projects list's own; roles are hers to fill in
  ('2026','Clover','HUD and companion app','Designing the HUD interface and shipping the iOS companion app.'),
  ('2026','Manus AI','Community platform','Designing an AI community platform to drive adoption. Acquired by Meta.'),
  ('2026','Fostr','Brand, site and platform','Building the brand, landing site and internal platform from 0 to 1.'),
  ('2025','Halodoc','AI Prescription onboarding','Designing the onboarding journey for AI Prescription on mobile.'),
  ('2025','Conduit Commerce','B2B SaaS website','Designing and shipping a B2B SaaS website for an AI feature launch.'),
  ('2025','SomiaCX','UVP system','Architecting a unified UVP system for three financial subsidiaries.'),
]
# each thing she keeps close, one item at a time; the strips are split into items in images/trim/off
OFF = [
  ('Toolkit', 'purple', [('/images/trim/off/toolkit-4.png','Claude Code'),('/images/trim/off/toolkit-3.png','Cursor'),('/images/trim/off/toolkit-1.png','Figma'),('/images/trim/off/toolkit-2.png','Framer'),('/images/trim/off/toolkit-5.png','Premiere Pro'),('/images/trim/off/toolkit-6.png','Illustrator')]),
  ('Music',   'green',  [('/images/trim/off/music-1.png','Cherry Bomb'),('/images/trim/off/music-2.png','Baduizm'),('/images/trim/off/music-3.png','Love Deluxe'),('/images/trim/off/music-4.png','Because the Internet')]),
  ('Films',   'purple', [('/images/trim/off/films-1.png','Fantastic Mr. Fox'),('/images/trim/off/films-2.png','Ping Pong the Animation'),('/images/trim/off/films-3.png','Casablanca')]),
  ('Reads',   'green',  [('/images/trim/off/reads-1.png','Creative Machines'),('/images/trim/off/reads-2.png','Martyr!'),('/images/trim/off/reads-3.png','Kafka on the Shore')]),
]
def KEEP(name, tone, items):
    """THE SHELF. One item shows at a time in a box every cell shares the size of. Hover lifts it
    and the box takes the signature colour; a click brings the next one up."""
    ims=''.join(f'<img src="{src}" alt="{E(t)}" data-t="{E(t)}" loading="lazy"{" class=on" if i==0 else ""}>' for i,(src,t) in enumerate(items))
    return (f'<div class="keep {tone}" tabindex="0" role="button" aria-label="{E(name)}: click for the next">'
            f'<div class="label">{E(name)}</div><div class="box">{ims}</div>'
            f'<div class="foot"><span class="t">{E(items[0][1])}</span><span class="n"><b>1</b> / {len(items)}</span></div></div>')

FLIP_JS = r'''<script>(function(){
/* THE SCREEN. A four-tone ordered dither on a WebGL quad, the way the reference does it:
   each cell of the screen takes the photo's luminance at its centre, an 8x8 Bayer threshold
   decides which of four inks it prints in, and idle "drizzle" keeps the dark areas alive.
   The pointer opens a soft window onto the colour photo; a drag brushes a stroke of it away
   and the stroke heals. Photos dissolve cell by cell in random order. */
const PHOTOS=['camera','dog-beach','teaching','snowboarding','mun','bagels'].map(n=>`/images/about/about-me-stack/${n}.jpg`);
const P={dot:1.2,tones:3,rad:.56,rain:.6,ang:14,hold:3};
const screen=document.getElementById('screen'), fallback=document.getElementById('fallback');
const cv=document.createElement('canvas'); cv.style.visibility='hidden'; screen.insertBefore(cv,screen.querySelector('.glare'));
const gl=cv.getContext('webgl',{alpha:false,antialias:false,depth:false});
let live=false;
if(gl){
const VS='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const FS=`precision highp float;
uniform vec2 uRes; uniform float uDot,uTones,uFade,uSeed,uTime,uRain,uReveal,uRad; uniform vec2 uMouse;
uniform sampler2D uA,uB,uMask; uniform float uAspA,uAspB; uniform vec3 uInk,uPaper;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float b2(vec2 a){a=floor(a);return fract(a.x*.5+a.y*a.y*.75);}
float b8(vec2 a){return b2(.25*a)*.0625+b2(.5*a)*.25+b2(a);}
vec2 cover(vec2 uv,float a){float f=uRes.x/uRes.y;vec2 s=(a>f)?vec2(f/a,1.):vec2(1.,a/f);return (uv-.5)*s+.5;}
float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}
void main(){
  vec2 frag=gl_FragCoord.xy; vec2 uv=frag/uRes; vec2 cell=floor(frag/uDot); vec2 cuv=(cell+.5)*uDot/uRes;
  float pickB=step(hash(cell*.7311+uSeed),uFade);
  float La=lum(texture2D(uA,cover(cuv,uAspA)).rgb), Lb=lum(texture2D(uB,cover(cuv,uAspB)).rgb);
  float L=mix(La,Lb,pickB); L=clamp((L-.5)*1.06+.5,0.,1.); L=pow(L,.88);
  float q=clamp(floor(L*uTones+b8(cell))/uTones,0.,1.);
  float spd=3.+6.*hash(vec2(cell.x,91.7)); float drop=floor(uTime*spd);
  float onRain=step(hash(vec2(cell.x,mod(cell.y+drop,1024.))),L*1.25);
  float sparse=(1.-smoothstep(.05,.32,L))*uRain; float pickRain=step(hash(cell.yx*1.93+4.271),sparse);
  float on=mix(q,onRain,pickRain);
  float R=uReveal*uRad*min(uRes.x,uRes.y);
  float circ=(uReveal<.001)?0.:(1.-smoothstep(R*.25,R,distance(frag,uMouse)));
  float rev=clamp(circ+texture2D(uMask,uv).a,0.,1.);
  float tear=clamp(rev*1.45-hash(cell*2.17+9.13)*.45,0.,1.);
  vec3 photo=mix(texture2D(uA,cover(uv,uAspA)).rgb,texture2D(uB,cover(uv,uAspB)).rgb,uFade);
  gl_FragColor=vec4(mix(mix(uInk,uPaper,on),photo,tear),1.);
}`;
const mk=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x;};
const pg=gl.createProgram();gl.attachShader(pg,mk(gl.VERTEX_SHADER,VS));gl.attachShader(pg,mk(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pg);gl.useProgram(pg);
const q=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,q);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
const aL=gl.getAttribLocation(pg,'a');gl.enableVertexAttribArray(aL);gl.vertexAttribPointer(aL,2,gl.FLOAT,false,0,0);
const U={};['uRes','uDot','uTones','uFade','uSeed','uTime','uRain','uReveal','uRad','uMouse','uA','uB','uMask','uAspA','uAspB','uInk','uPaper'].forEach(n=>U[n]=gl.getUniformLocation(pg,n));
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
const tex=src=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);['TEXTURE_MIN_FILTER','TEXTURE_MAG_FILTER'].forEach(k=>gl.texParameteri(gl.TEXTURE_2D,gl[k],gl.LINEAR));['TEXTURE_WRAP_S','TEXTURE_WRAP_T'].forEach(k=>gl.texParameteri(gl.TEXTURE_2D,gl[k],gl.CLAMP_TO_EDGE));gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);return t;};
const imgs=PHOTOS.map(s=>{const im=new Image();im.src=s;return im;}); const T=[]; const asp=i=>imgs[i].naturalWidth?imgs[i].naturalWidth/imgs[i].naturalHeight:1;
const MW=96,MH=128,mc=document.createElement('canvas');mc.width=MW;mc.height=MH;const mx=mc.getContext('2d');
const sp=document.createElement('canvas');sp.width=sp.height=64;{const c=sp.getContext('2d');const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.55,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,64,64);}
const maskT=tex(mc); let maskE=0,maskDirty=false,heal=0;
function stamp(x,y){const r=MW*.17;mx.drawImage(sp,x-r,y-r,r*2,r*2);maskE=1;maskDirty=true;heal=1.4;}
function clearMask(){mx.clearRect(0,0,MW,MH);maskE=0;maskDirty=true;}
let idx=0,nextIdx=idx,fading=false,fadeT=0,holdT=0,seed=Math.random()*61.7,hovering=false,dragging=false,reveal=0,mX=-1e4,mY=-1e4,paused=false,simT=0,W=0,H=0,dot=3,dpr=1;
function ink(){const cs=getComputedStyle(document.documentElement);const p=h=>{h=h.trim();const m=h.match(/^#([0-9a-f]{6})$/i);if(m)return [0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16)/255);const r=h.match(/rgba?\(([^)]+)\)/);return r?r[1].split(',').slice(0,3).map(v=>+v/255):[0,0,0];};
  const a=p(cs.getPropertyValue('--ink')),b=p(cs.getPropertyValue('--paper'));const l=c=>.299*c[0]+.587*c[1]+.114*c[2];return l(a)<=l(b)?[a,b]:[b,a];}
function resize(){const w=screen.clientWidth,h=screen.clientHeight;if(!w||!h)return;dpr=Math.min(2,devicePixelRatio||1);W=Math.round(w*dpr);H=Math.round(h*dpr);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}dot=Math.max(2,Math.round(P.dot*dpr));}
new ResizeObserver(resize).observe(screen);resize();
function beginFade(to){if(fading||to===idx||!T[to])return;nextIdx=to;fading=true;fadeT=0;seed=Math.random()*61.7;}
function endFade(){idx=nextIdx;fading=false;fadeT=0;holdT=0;clearMask();}
function step(d){for(let s=1;s<PHOTOS.length;s++){const t=(idx+d*s+PHOTOS.length*s)%PHOTOS.length;if(T[t])return t;}return -1;}
let prev=performance.now();
function frame(now){const dt=Math.min(.05,(now-prev)/1000);prev=now;simT=(simT+dt)%600;
  for(let i=0;i<PHOTOS.length;i++) if(!T[i]&&imgs[i].complete&&imgs[i].naturalWidth) T[i]=tex(imgs[i]);
  reveal+=(((hovering||dragging)?1:0)-reveal)*(1-Math.exp(-dt*6));
  if(fading){fadeT+=dt*1000;if(fadeT>=850)endFade();} else if(!paused&&!hovering&&!dragging){holdT+=dt*1000;if(holdT>=P.hold*1000){const to=step(1);if(to>=0)beginFade(to);else holdT=0;}}
  if(maskE>.003&&!dragging){heal-=dt;if(heal<=0){mx.globalCompositeOperation='destination-out';mx.globalAlpha=Math.min(1,dt*.28);mx.fillStyle='#fff';mx.fillRect(0,0,MW,MH);mx.globalCompositeOperation='source-over';mx.globalAlpha=1;maskE*=1-Math.min(1,dt*.28);if(maskE<=.003)clearMask();else maskDirty=true;}}
  if(W&&T[idx]){const tB=(fading&&T[nextIdx])?T[nextIdx]:T[idx];if(maskDirty){gl.bindTexture(gl.TEXTURE_2D,maskT);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,mc);maskDirty=false;}
    gl.viewport(0,0,W,H);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,T[idx]);gl.uniform1i(U.uA,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,tB);gl.uniform1i(U.uB,1);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,maskT);gl.uniform1i(U.uMask,2);
    const [I,Pp]=ink();gl.uniform3fv(U.uInk,I);gl.uniform3fv(U.uPaper,Pp);
    gl.uniform2f(U.uRes,W,H);gl.uniform1f(U.uDot,dot);gl.uniform1f(U.uTones,P.tones);gl.uniform1f(U.uFade,fading?Math.min(1,fadeT/850):0);gl.uniform1f(U.uSeed,seed);gl.uniform1f(U.uTime,simT);gl.uniform1f(U.uRain,P.rain);gl.uniform1f(U.uReveal,reveal);gl.uniform1f(U.uRad,P.rad);gl.uniform2f(U.uMouse,mX,mY);gl.uniform1f(U.uAspA,asp(idx));gl.uniform1f(U.uAspB,asp(fading?nextIdx:idx));
    gl.drawArrays(gl.TRIANGLES,0,3); if(!live){live=true;cv.style.visibility='';fallback.style.visibility='hidden';}}
  requestAnimationFrame(frame);}
requestAnimationFrame(frame);
const pt=e=>{const r=screen.getBoundingClientRect();return [(e.clientX-r.left)*dpr,(r.height-(e.clientY-r.top))*dpr,(e.clientX-r.left)/r.width*MW,(e.clientY-r.top)/r.height*MH];};
screen.addEventListener('pointerenter',()=>hovering=true);screen.addEventListener('pointerleave',()=>{hovering=false;dragging=false;});
screen.addEventListener('pointermove',e=>{const [x,y,ux,uy]=pt(e);mX=x;mY=y;if(dragging)stamp(ux,uy);});
screen.addEventListener('pointerdown',e=>{dragging=true;const [x,y,ux,uy]=pt(e);mX=x;mY=y;stamp(ux,uy);});
addEventListener('pointerup',()=>dragging=false);
document.getElementById('prev').addEventListener('click',e=>{e.stopPropagation();const t=step(-1);if(t>=0)beginFade(t);});
document.getElementById('next').addEventListener('click',e=>{e.stopPropagation();const t=step(1);if(t>=0)beginFade(t);});
document.getElementById('play').addEventListener('click',e=>{e.stopPropagation();paused=!paused;e.target.title=paused?'Play':'Pause';});
}
/* THE HINGE. Closed, the lid lies over the keys with its outer face up; near it, it swings up
   and back a little past flat, on an ease with a small overshoot, the way a real one clicks open. */
const phone=document.getElementById('phone'), stage=document.getElementById('stage'), lid=document.getElementById('lid');
/* THE SWING. The lid's angle is animated here, frame by frame, from where it is to where it is
   going, on an ease with a small overshoot at the open end and a firm stop at the closed end.
   The face showing is decided from the same angle: the cover until the lid passes edge-on
   (90 degrees), the inside after. One number drives both, so they cannot disagree. */
let open=false, ang=180, from=180, to=180, t0=0, dur=900, raf=0;
const ease=(x,over)=>{ if(!over) return 1-Math.pow(1-x,3); const c=1.4; return 1+c*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
function place(a){ lid.style.transform=`translateZ(14px) rotateX(${a}deg)`; lid.classList.toggle('shut',a>90); }
function tick(now){ const x=Math.min(1,(now-t0)/dur); const e=ease(x, to<90); ang=from+(to-from)*e; place(ang);
  if(x<1) raf=requestAnimationFrame(tick); else { raf=0; ang=to; place(ang); } }
function setOpen(on){
  const stayEl=document.getElementById('stay'); const want=on||!!(stayEl&&stayEl.checked); if(want===open) return; open=want;
  from=ang; to=open?-P.ang:180; dur=open?900:700; t0=performance.now(); cancelAnimationFrame(raf); raf=requestAnimationFrame(tick);
}
place(-P.ang); open=true;
let leaveT=0;
stage.addEventListener('pointerleave',()=>{phone.style.transform='';});
/* the light and the tilt follow the pointer across the stage */
stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();const x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
  document.documentElement.style.setProperty('--lx',`${x*100}%`);document.documentElement.style.setProperty('--ly',`${y*100}%`);
  document.documentElement.style.setProperty('--hx',`${(x-.5)*-3}px`);document.documentElement.style.setProperty('--hy',`${(y-.5)*-3}px`);
  phone.style.transform=`rotateY(${(x-.5)*14}deg) rotateX(${(.5-y)*8}deg)`;});
/* the closed lid tells the time in New York */
const ext=document.getElementById('ext');
(function tick(){ext.textContent=new Date().toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'});setTimeout(tick,15000);})();

})();</script>'''

about = page('About', f"""<main class="ab"><div class="wrap">
  <div class="thesis"><div class="label">About</div>
    <h1>I make things people can feel, from paper to product.</h1>
    <p>Product designer and design engineer in New York. Cognitive science and HCI at Columbia.</p></div>

  <div class="hello">
    <div class="flip-stage" id="stage" aria-label="A flip phone open on six photographs; the keys change the photo."><div class="phone" id="phone">
            <div class="base">
              <div class="slab"></div>
              <div class="shell"></div>
              <div class="hinge"></div>
              <div class="keys">
                <div class="nav">
                  <div class="soft" id="prev" title="Previous"><svg viewBox="0 0 26 18"><path d="M11.5 2.6 3.4 9l8.1 6.4V2.6ZM22.6 2.6 14.5 9l8.1 6.4V2.6Z"/></svg></div>
                  <div class="ring"><i></i><i></i><i></i><i></i><b id="play" title="Pause"></b></div>
                  <div class="soft" id="next" title="Next"><svg viewBox="0 0 26 18"><path d="M3.4 2.6 11.5 9l-8.1 6.4V2.6ZM14.5 2.6 22.6 9l-8.1 6.4V2.6Z"/></svg></div>
                </div>
                <div class="pad"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>*</span><span>0</span><span>#</span></div>
              </div>
            </div>
            <div class="lid" id="lid">
              <div class="face in shell">
                <div class="screen" id="screen"><img id="fallback" src="/images/about/about-me-stack/camera.jpg" alt=""><div class="glare"></div></div>
                <div class="brand">JAZLYNN</div>
              </div>
              <div class="face out shell">
                <div class="ext" id="ext">--:--</div>
                <div class="cam"></div>
              </div>
            </div>
          </div>
    </div>
    <div class="bio"><div class="label">Hello</div>
      <p style="margin-top:12px">I am an artist at heart. At fifteen my work was being exhibited, auctioned and sold, and most of it came from the beach. I spent my childhood going back and forth to Bali, and nature was what I drew from. Starting that young shaped how I see things: <b style="color:#A99939">the best ideas, the ones that feel new, arrive where unrelated fields meet.</b></p>
      <p>That is why I ended up in design engineering and product management. Both sit where people meet technology, just through different mediums, and I have never liked being confined to one. What started as paper and pencil became paintings, then products.</p>
      <p>Life is too short to be constrained to one medium. Learning new forms of knowledge with empathy, care and intent is the quality I carry into every piece of work.</p>
    </div>
  </div>

  <div class="sec"><div class="label">What I do</div><h2>Focus areas</h2>
    {CELLS([CELL(f'<span class="n">{i+1:02d}</span><h3>{E(x)}</h3>') for i,x in enumerate(FOCUS)], 3)}</div>

  <div class="sec"><div class="label">Experience</div><h2>Where I&rsquo;ve worked</h2>
    <div class="rows" data-cur="reach out for resume">{''.join(f'<div class="row"><span class="y">{y}</span><span class="o">{E(o)}<small>{E(r)}</small></span><p>{E(l)}</p></div>' for y,o,r,l in WORKED)}</div></div>

  <div class="sec"><div class="label">Education</div><h2>Where I&rsquo;ve studied</h2>
    <div class="rows"><div class="row"><span class="y">Now</span><span class="o">Columbia University<small>New York</small></span><p>Cognitive Science, with a specialization in Human-Computer Interaction.</p></div><div class="row"><span class="y">2023 to 2025</span><span class="o">Shoreline College<small>Washington</small></span><p>Direct Transfer Associate of Arts.</p></div></div></div>

  <div class="sec off"><div class="label">Off the clock</div><h2>What I keep close</h2>
    <div class="keeps">{''.join(KEEP(n,t,items) for n,t,items in OFF)}</div></div>

  <div class="sec"><div class="label">Contact</div><h2>Let&rsquo;s work together.</h2>
    <div class="reach"><span class="now"><i class="dot"></i>Available for 2026 roles</span><a href="mailto:jazkurnz06@gmail.com">jazkurnz06@gmail.com</a><a href="https://www.linkedin.com/in/jazlynn-kurniandra-a456292a8/" target="_blank" rel="noopener">LinkedIn <svg class="ext-arrow" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a href="https://x.com/jazlynnkurni" target="_blank" rel="noopener">X <svg class="ext-arrow" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a></div></div>
</div></main><script>(function(){{
  document.querySelectorAll('.keep').forEach(k=>{{
    const ims=[...k.querySelectorAll('img')], t=k.querySelector('.foot .t'), n=k.querySelector('.foot .n b'); let i=0, busy=false;
    function next(){{ if(busy) return; busy=true; const a=ims[i]; i=(i+1)%ims.length; const b=ims[i];
      a.classList.remove('on'); a.classList.add('out'); b.classList.add('on'); t.textContent=b.dataset.t; n.textContent=i+1;
      setTimeout(()=>{{ a.classList.remove('out'); busy=false; }},320); }}
    k.addEventListener('click',next);
    k.addEventListener('keydown',e=>{{ if(e.key==='Enter'||e.key===' '||e.key==='ArrowRight'){{ e.preventDefault(); next(); }} }});
  }});
}})();</script>
{FLIP_JS}
""", CASE_CSS+ABOUT_CSS).replace('</body></html>', DIE_JS+'</body></html>')

# ------------------------------------------------------------------ ART GALLERY
# The guestbook wall from jazlynnwashere.com/art-gallery, rebuilt in this system. What
# carries over unchanged is the MECHANISM: draw a card, it is hung on a shared wall of the
# twelve most recent, and the memory layer (localStorage: your card and that you have been
# here) means a returning visitor lands straight on the wall with their card already up.
# The API contract is the live one, so this page drops onto the existing Redis route.
#
# What changes is the material. The four card colours are the palette itself (gold,
# oxblood, charcoal, paper) and the brush follows the hero grid's rule: on an inked card the
# stroke knocks out to paper, on the paper card it is ink. The picture frame is gone; the
# wall is the grid's own object, hairline cells. Nothing here is decorated.
GALLERY_CSS = """
/* the hidden attribute has to beat the class rules below, or a hidden gate still shows */
.gal [hidden]{display:none!important}
.gal{padding:136px 0 0}
/* the case study's head is a two column grid; this one is a stack */
.gal .head{display:block}
.gal .head h1{font-size:clamp(28px,4vw,44px);line-height:1.12;max-width:22ch;margin-top:12px}
.gal .head p{font-size:17px;line-height:1.62;color:var(--ink2);margin-top:16px;max-width:52ch}
/* ---- the desk: name, card colour, the canvas ---- */
.desk{margin-top:48px;display:grid;grid-template-columns:680px 1fr;gap:48px;align-items:start}
@media(max-width:1100px){.desk{grid-template-columns:1fr}}
.desk .plate{width:680px;max-width:100%;aspect-ratio:680/380;position:relative;user-select:none}
.desk canvas{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair}
@media(pointer:fine){.desk canvas{cursor:crosshair}}
.desk .mono{position:absolute;top:18px;left:20px;font:600 13px var(--jak);letter-spacing:.08em;pointer-events:none;opacity:.9}
.desk .side{display:grid;grid-template-columns:1fr}
.desk .side .cell{padding:20px 24px;border-right:1px solid var(--hair)}
.desk .side .cell+.cell{border-top:0}
.desk input{width:100%;margin-top:10px;font:300 17px var(--hel);color:var(--ink);background:transparent;border:0;border-bottom:1px solid var(--hair);padding:6px 0 8px;outline:none;border-radius:0}
.desk input:focus{border-bottom-color:var(--ink)}
.desk input::placeholder{color:var(--ink3)}
.sw{display:flex;gap:10px;margin-top:12px}
.sw button{width:36px;height:36px;border-radius:8px;border:0;padding:0;cursor:pointer;outline:1px solid var(--outline);outline-offset:-1px;
  transition:transform .18s cubic-bezier(.33,1.18,.37,1),box-shadow .18s ease}
.sw button[aria-pressed=true]{box-shadow:0 0 0 2px var(--paper),0 0 0 3.5px var(--ink);transform:scale(1.06)}
.sw button:active{transform:scale(.94)}
.acts{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}
.acts button{font:500 13px var(--jak);letter-spacing:.01em;color:var(--ink);background:transparent;border:1px solid var(--hair);border-radius:999px;padding:9px 16px;cursor:pointer;
  transition:color .15s ease,border-color .15s ease,background .15s ease,transform .1s ease}
.acts button:hover{border-color:var(--ink3)}
.acts button:active{transform:scale(.96)}
.acts button.go{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.acts button.go:disabled{background:transparent;color:var(--ink3);border-color:var(--hair);cursor:not-allowed}
.gal .err{font-size:13px;color:var(--touch);margin-top:12px}
/* ---- the wall: the grid's own cells, three across ---- */
.wall{margin-top:48px;display:grid;grid-template-columns:repeat(3,1fr)}
.wall .slot{border-top:1px solid var(--hair);border-bottom:1px solid var(--hair);border-left:1px solid var(--hair);padding:20px;min-width:0;position:relative}
.wall .slot:nth-child(3n){border-right:1px solid var(--hair)}
.wall .slot:nth-child(n+4){border-top:0}
.wall .slot.empty::after{content:"";display:block;aspect-ratio:680/380;border:1px dashed var(--hair);border-radius:8px}
.wall .slot.empty{padding-bottom:49px}   /* 20 + the name line, so an empty slot is as tall as a full one */
.card{position:relative;width:100%;aspect-ratio:680/380;border-radius:8px;overflow:hidden;outline:1px solid var(--outline);outline-offset:-1px;
  transition:transform .46s cubic-bezier(.33,1.18,.37,1),box-shadow .32s ease}
.card img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block;pointer-events:none}
.card .mono{position:absolute;top:8px;left:9px;font:600 9px var(--jak);letter-spacing:.08em;pointer-events:none;opacity:.9}
.slot:hover .card{transform:translateY(-3px);box-shadow:0 12px 28px rgba(20,23,27,.16)}
[data-theme="dark"] .slot:hover .card{box-shadow:0 12px 28px rgba(0,0,0,.4)}
.slot .who{display:block;font:300 12.5px var(--hel);color:var(--ink3);margin-top:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* the tag on your own card: an inked tile with the knocked out label, like the wall's letters */
/* a sticker on the card's top right corner, inked so it reads on every stock, with a paper
   ring so it sits ON the card instead of dissolving into it */
.you{position:absolute;top:8px;right:14px;z-index:2;font:600 10px var(--jak);letter-spacing:.14em;text-transform:uppercase;
  background:var(--ink);color:var(--paper);padding:5px 9px;border-radius:3px;box-shadow:0 0 0 2px var(--paper),0 4px 12px rgba(0,0,0,.14);
  transform:rotate(4deg);transform-origin:top right;pointer-events:none;
  opacity:0;animation:you .5s cubic-bezier(.33,1.18,.37,1) .7s forwards}
@keyframes you{to{opacity:1}}
@media(max-width:900px){.wall{grid-template-columns:repeat(2,1fr)}.wall .slot:nth-child(3n){border-right:0}.wall .slot:nth-child(2n){border-right:1px solid var(--hair)}.wall .slot:nth-child(n+3){border-top:0}}
/* ---- the works: her own pieces, three columns, packed by height ---- */
.works{margin-top:96px;padding-bottom:32px}
.works .cols{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
.works .col{display:flex;flex-direction:column;gap:16px}
.works .plate{margin:0}
.works .plate img,.works .plate video{display:block;width:100%;height:auto}
@media(max-width:700px){.works .cols{grid-template-columns:1fr}}
/* ---- THE STOCK. Every card is printed on the postcard stock from the texture lab: a
   coarse felt-side tooth lit by the one lamp, built once as a tile by the page and laid over
   the card as relief. Overlay, so it darkens the shade and brightens the ridges of whatever
   colour the card is, and stays out of the pointer's way so the pen still draws. ---- */
.desk .plate::after,.card::after,#ghost::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:2;
  background-image:var(--stock);background-size:190px 190px;mix-blend-mode:overlay;opacity:.5}
[data-theme="dark"] .desk .plate::after,[data-theme="dark"] .card::after{opacity:.4}
.desk .plate .mono,.card .mono{z-index:3}
/* the FLIP ghost: your card travelling from the desk to its slot */
#ghost{position:fixed;z-index:80;border-radius:8px;overflow:hidden;pointer-events:none;transform-origin:top left;
  transition:transform .7s cubic-bezier(.22,1,.36,1),opacity .2s ease .6s}
#ghost img{width:100%;height:100%;display:block}
/* the gate: drawing wants a desk, not a thumb */
.gate{min-height:70vh;display:grid;place-items:center;text-align:center}
.gate p{font-size:15px;line-height:1.62;color:var(--ink2);max-width:36ch}
.gate a{display:inline-block;margin-top:16px;color:var(--ink);text-decoration:none}
"""
GALLERY_JS = """<script>
(function(){
  /* the two keys the live site already uses, so a visitor who drew there is remembered here */
  const CARD_KEY='art-gallery:my-card', SEEN_KEY='art-gallery:intro-seen';
  const W=680,H=380,BRUSH=4;
  /* the palette as card stock. The stroke follows the hero grid's rule: a gold, oxblood or
     charcoal card knocks the ink out to paper; the paper card takes ink. */
  const STOCK={gold:'#A99939',oxblood:'#340414',charcoal:'#1C1A17',paper:'#FAF9F7'};
  /* cards from the old site carry other colour names; each lands on one of ours, by name */
  const OLD={orange:'gold',blue:'charcoal',clay:'oxblood',green:'gold',purple:'oxblood'};
  const tone=(c)=>STOCK[c]?c:(OLD[c]||['gold','oxblood','charcoal','paper'][(String(c||'').length+3)%4]);
  const INK=(c)=>tone(c)==='paper'?'#14171B':'#FAF9F7';
  const $=(s,r=document)=>r.querySelector(s);
  const intro=$('#intro'), wallSec=$('#wall'), gate=$('#gate');

  /* the stock, as a tile: the postcard's tooth from the texture lab, relit here once.
     A height field of coarse fibre, shaded by the lamp from the upper left, written out
     around mid grey so overlay leaves the card's colour alone and adds only the relief. */
  (function stock(){
    const N=256, cv=document.createElement('canvas'); cv.width=cv.height=N; const c=cv.getContext('2d');
    const hash=(x,y,s)=>{ const n=Math.sin((x%N)*127.1+(y%N)*311.7+s*74.7)*43758.5453; return n-Math.floor(n); };
    const swell=(x,y,f,ph)=>Math.sin((x/N)*6.2832*f+ph)*Math.sin((y/N)*6.2832*f+ph*1.7);
    const h=new Float32Array(N*N);
    for(let y=0;y<N;y++) for(let x=0;x<N;x++) h[y*N+x]=(hash(x,y,6)-.5)*.2+(hash(x>>1,y>>1,12)-.5)*.26+swell(x,y,3,.2)*.08;
    const L=[-0.58,-0.66,0.48], m=Math.hypot(...L); L[0]/=m; L[1]/=m; L[2]/=m;
    const at=(x,y)=>h[((y+N)%N)*N+((x+N)%N)];
    const img=c.createImageData(N,N), d=img.data;
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){
      const dx=(at(x+1,y)-at(x-1,y))*46, dy=(at(x,y+1)-at(x,y-1))*46, nz=1, nm=Math.hypot(dx,dy,nz);
      const diff=Math.max(0,(-dx/nm)*L[0]+(-dy/nm)*L[1]+(nz/nm)*L[2]);
      /* a breath of relief, not a rasp: the lab's postcard sits at about a third of this gain's first cut */
      const v=Math.max(0,Math.min(255,128+(diff-0.74)*110));
      const o=(y*N+x)*4; d[o]=d[o+1]=d[o+2]=v; d[o+3]=255;
    }
    c.putImageData(img,0,0);
    document.documentElement.style.setProperty('--stock',`url(${cv.toDataURL()})`);
  })();

  if(innerWidth<900){ intro.hidden=true; wallSec.hidden=true; gate.hidden=false; return; }
  gate.hidden=true;

  /* ---------- the desk ---------- */
  const cv=$('#pad'), ctx=cv.getContext('2d'), dpr=Math.min(devicePixelRatio||1,2);
  cv.width=W*dpr; cv.height=H*dpr; ctx.scale(dpr,dpr);
  let color='gold', strokes=[], cur=null, down=false;
  const mono=$('#mono');
  function repaint(){
    ctx.fillStyle=STOCK[tone(color)]; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle=INK(color); ctx.fillStyle=INK(color); ctx.lineWidth=BRUSH; ctx.lineCap='round'; ctx.lineJoin='round';
    for(const s of strokes){
      if(s.length===1){ ctx.beginPath(); ctx.arc(s[0].x,s[0].y,BRUSH/2,0,6.2832); ctx.fill(); continue; }
      ctx.beginPath(); ctx.moveTo(s[0].x,s[0].y); for(let i=1;i<s.length;i++) ctx.lineTo(s[i].x,s[i].y); ctx.stroke();
    }
    mono.style.color=INK(color);
  }
  const pt=(e)=>{ const r=cv.getBoundingClientRect(); return {x:(e.clientX-r.left)*(W/r.width), y:(e.clientY-r.top)*(H/r.height)}; };
  cv.addEventListener('pointerdown',e=>{ down=true; cur=[pt(e)]; strokes.push(cur); cv.setPointerCapture(e.pointerId); if(strokes.length===1) go.disabled=false; });
  cv.addEventListener('pointermove',e=>{ if(!down||!cur) return; const p=pt(e), q=cur[cur.length-1]; cur.push(p);
    ctx.strokeStyle=INK(color); ctx.lineWidth=BRUSH; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.beginPath(); ctx.moveTo(q.x,q.y); ctx.lineTo(p.x,p.y); ctx.stroke(); });
  const up=()=>{ down=false; cur=null; }; cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
  document.querySelectorAll('.sw button').forEach(b=>b.addEventListener('click',()=>{ color=b.dataset.c;
    document.querySelectorAll('.sw button').forEach(o=>o.setAttribute('aria-pressed',String(o===b))); repaint(); }));
  const go=$('#go'), name=$('#name'), err=$('#err');
  $('#clear').addEventListener('click',()=>{ strokes=[]; repaint(); go.disabled=true; });
  repaint();

  /* ---------- the wall ---------- */
  const grid=$('#grid'), GRID=12;
  function card(c, yours){
    const d=document.createElement('div'); d.className='slot';
    d.innerHTML=`${yours?'<span class="you">That\\u2019s you</span>':''}<div class="card" style="background:${STOCK[tone(c.color)]}"><img src="${c.drawing}" alt="" data-ink="${INK(c.color)}"><span class="mono" style="color:${INK(c.color)}">JK</span></div><span class="who" title="${esc(c.name)}">${esc(c.name)}</span>`;
    d.querySelector('img').addEventListener('load',e=>reink(e.target),{once:true});
    return d;
  }
  /* A DRAWING FROM THE OLD SITE has its ground baked in. It is read as ink on paper: the dark
     marks become the stroke, the rest goes clear, and the stroke takes the card's ink. */
  function reink(img){ try{ const w=img.naturalWidth,h=img.naturalHeight; if(!w) return; const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d'); x.drawImage(img,0,0);
    const d=x.getImageData(0,0,w,h), px=d.data; if(px[3]<250) return;   /* already transparent strokes */
    const ink=img.dataset.ink||'#14171B', r=parseInt(ink.slice(1,3),16), g=parseInt(ink.slice(3,5),16), b=parseInt(ink.slice(5,7),16);
    for(let i=0;i<px.length;i+=4){ const l=(0.299*px[i]+0.587*px[i+1]+0.114*px[i+2]); const a=Math.max(0,Math.min(255,(120-l)*3)); px[i]=r; px[i+1]=g; px[i+2]=b; px[i+3]=a; }
    x.putImageData(d,0,0); img.src=c.toDataURL(); }catch(e){} }
  const esc=(s)=>String(s||'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  async function hang(mine){
    grid.innerHTML=''; grid.appendChild(card(mine,true));
    let others=[];
    try{ const r=await fetch('/api/gallery/cards',{cache:'no-store'}); const j=await r.json(); others=(j.cards||[]).filter(c=>c.id!==mine.id).slice(0,GRID-1); }catch(e){}
    others.forEach((c,i)=>{ const el=card(c,false); el.style.opacity='0'; el.style.transform='translateY(8px)'; grid.appendChild(el);
      setTimeout(()=>{ el.style.transition='opacity .35s ease,transform .35s ease'; el.style.opacity='1'; el.style.transform='none'; }, 250+i*40); });
    for(let i=1+others.length;i<GRID;i++){ const e=document.createElement('div'); e.className='slot empty'; grid.appendChild(e); }
  }
  function showWall(mine, from){
    intro.hidden=true; wallSec.hidden=false;
    hang(mine).then(()=>{
      /* FLIP: your card travels from the desk to its slot, then the slot takes over */
      const to=$('.slot .card',grid); if(!from||!to) return;
      const t=to.getBoundingClientRect();
      const g=document.createElement('div'); g.id='ghost'; g.innerHTML=`<img src="${mine.drawing}" alt="">`;
      g.style.left=from.left+'px'; g.style.top=from.top+'px'; g.style.width=from.width+'px'; g.style.height=from.height+'px'; g.style.background=STOCK[tone(mine.color)];
      document.body.appendChild(g); to.style.visibility='hidden';
      requestAnimationFrame(()=>{ g.style.transform=`translate(${t.left-from.left}px,${t.top-from.top}px) scale(${t.width/from.width},${t.height/from.height})`; g.style.opacity='0'; });
      setTimeout(()=>{ to.style.visibility=''; g.remove(); }, 720);
    });
    if(from) setTimeout(()=>scrollTo({top:0,behavior:'smooth'}), 80);
  }

  /* ---------- the memory layer ---------- */
  /* the desk comes first for everyone; a returning visitor also gets a way straight to the wall */
  try{ const j=localStorage.getItem(CARD_KEY); if(j){ const mine=JSON.parse(j); const a=document.createElement('a'); a.href='#'; a.className='skip'; a.textContent='I already hung one, take me to the wall \u2192'; a.addEventListener('click',e=>{e.preventDefault(); showWall(mine,null);}); (err.parentNode||document.body).insertBefore(a,err); } }catch(e){}

  go.addEventListener('click', async ()=>{
    if(go.disabled) return; go.disabled=true; go.textContent='Hanging your art\\u2026'; err.textContent='';
    const from=$('#padPlate').getBoundingClientRect();
    try{
      const r=await fetch('/api/gallery/cards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name.value.trim(),color,drawing:cv.toDataURL('image/png')})});
      if(!r.ok){ const j=await r.json().catch(()=>({})); throw new Error(j.error||'Couldn\\u2019t save your card. Try again?'); }
      const {card:mine}=await r.json();
      try{ localStorage.setItem(CARD_KEY,JSON.stringify(mine)); localStorage.setItem(SEEN_KEY,'true'); }catch(e){}
      showWall(mine, from);
    }catch(e){ err.textContent=e.message||'Something went wrong.'; go.disabled=false; go.textContent='Enter \\u2192'; }
  });
})();
</script>"""

# her works, as on the live site: no titles, no captions. width/height ratios from the files.
WORKS = [
  ('/images/art-gallery/works/ceramic-mask.jpg',1.138),('/images/art-gallery/works/izakaya-sushi.png',1.699),
  ('/images/art-gallery/works/metropolis-hands.png',0.707),('/images/art-gallery/works/sunflower-collage.png',0.707),
  ('/images/art-gallery/works/anime-action.png',1.415),('/images/art-gallery/works/fallen-angel.png',1.415),
  ('/images/art-gallery/works/die-character-sheet.png',1.415),('/images/art-gallery/works/green-alien.png',1.0),
  ('/images/art-gallery/works/goggle-girl.png',1.0),('/images/art-gallery/works/angel.png',0.707),
  ('/images/art-gallery/works/cat.png',1.0),('/images/art-gallery/works/police.png',0.698),
  ('/images/art-gallery/works/spider-verse.png',0.707),('/images/art-gallery/works/tsk-art.png',1.415),
  ('/images/art-gallery/works/yourclothes.png',1.0),
  ('/videos/art-gallery/process-reel-1.mp4',1.816),('/videos/art-gallery/process-reel-2.mp4',1.831),('/videos/art-gallery/animation-loop.mp4',1.778),
]
def WORKS_HTML():
    # shortest column first, the same packing the live site does, resolved at build time
    cols=[[],[],[]]; h=[0,0,0]
    for src,ar in WORKS:
        i=h.index(min(h)); cols[i].append(src); h[i]+=1/ar
    out=''
    for col in cols:
        out+='<div class="col">'+''.join(media(s,'') for s in col)+'</div>'
    return f'<div class="works"><div class="label">Works</div><div class="cols">{out}</div></div>'

SWATCHES=''.join(f'<button type="button" data-c="{c}" aria-label="{c} card" aria-pressed="{str(c=="gold").lower()}" style="background:{v}"></button>'
                 for c,v in [('gold','#A99939'),('oxblood','#340414'),('charcoal','#1C1A17'),('paper','#FAF9F7')])
gallery = page('Art Gallery', f"""<main class="gal"><div class="wrap">
  <div class="gate" id="gate" hidden><div><div class="label">Art gallery</div><p style="margin-top:12px">The gallery is a drawing experience, and drawing wants a desk. Come back on a bigger screen to leave your mark.</p><a href="/">&larr; Back to home</a></div></div>

  <section id="intro">
    <div class="head"><div class="label">Art gallery</div>
      <h1>Everyone has an artist inside of them.</h1>
      <p>Leave your mark and we&rsquo;ll give it a wall.</p></div>
    <div class="desk">
      <div class="plate" id="padPlate"><canvas id="pad" width="680" height="380"></canvas><span class="mono" id="mono">JK</span></div>
      <div class="side">
        <div class="cell"><div class="label">Name</div><input id="name" type="text" maxlength="60" placeholder="Your name here" autocomplete="off"></div>
        <div class="cell"><div class="label">Card</div><div class="sw"><button type="button" data-c="gold" aria-label="gold card" aria-pressed="true" style="background:#A99939"></button><button type="button" data-c="oxblood" aria-label="oxblood card" aria-pressed="false" style="background:#340414"></button><button type="button" data-c="charcoal" aria-label="charcoal card" aria-pressed="false" style="background:#1C1A17"></button><button type="button" data-c="paper" aria-label="paper card" aria-pressed="false" style="background:#FAF9F7;outline:1px solid var(--hair)"></button></div></div>
        <div class="cell"><div class="label">Then</div><div class="acts"><button type="button" id="clear">Clear</button><button type="button" id="go" class="go" disabled>Enter &rarr;</button></div><p class="err" id="err"></p></div>
      </div>
    </div>
  </section>

  <section id="wall" hidden>
    <div class="head"><div class="label">The wall</div>
      <h1>Welcome to Jazlynn&rsquo;s Art Exhibit.</h1>
      <p>Thanks for being a part of it. Enjoy the rest of your stay!</p></div>
    <div class="wall" id="grid"></div>
    {WORKS_HTML()}
  </section>
</div></main>""", CASE_CSS+GALLERY_CSS) + ""
gallery = gallery.replace('</body></html>', GALLERY_JS + '</body></html>')

# ------------------------------------------------------------------ write
os.makedirs('work', exist_ok=True)
for path, doc in [('work/manus-ai.html', manus), ('work/conduit-commerce.html', conduit), ('work/somia-cx.html', somia), ('soon.html', four), ('about.html', about), ('art-gallery.html', gallery)]:
    open(path,'w').write(doc); print(f'{path:28s} {len(doc)//1024} KB')
