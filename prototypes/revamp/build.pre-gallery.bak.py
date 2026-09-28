#!/usr/bin/env python3
"""build.py -- renders the case studies and the 404 into the revamp's design system.
Run:  python3 build.py   (writes work/*.html and 404.html). Edit the DATA, not the output.
Media is served through the images/ and videos/ symlinks into ~/Desktop/portfolio/public."""
import html, os, re

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
.label{font-family:var(--jak);font-weight:600;font-size:10.5px;letter-spacing:.15em;text-transform:uppercase;color:var(--ink3)}
/* nav: the pill from index.html, verbatim */
nav{position:fixed;top:0;left:0;right:0;z-index:60;pointer-events:none}
nav .in{display:flex;justify-content:space-between;align-items:center;padding-top:24px}
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
footer{padding:64px 0 46px}
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
  html,body,a,button,[role=button]{cursor:none}
  #cur{position:fixed;left:0;top:0;width:12px;height:12px;pointer-events:none;z-index:1000;
    transform:translate(-100px,-100px);will-change:transform;opacity:0;transition:opacity .2s ease}
  #cur i{position:absolute;inset:0;border-radius:50%;
    background:var(--charcoal);
    box-shadow:0 3px 14px rgba(28,26,23,.30);
    transform:scale(1);transition:transform .46s cubic-bezier(.33,1.18,.37,1),opacity .32s ease,box-shadow .32s ease}
  [data-theme="dark"] #cur i{background:var(--ink);box-shadow:0 3px 14px rgba(250,249,247,.26)}
  #cur.on{opacity:1}
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
.cs-hero h1{font-size:clamp(28px,4vw,44px);line-height:1.12;max-width:22ch;margin-top:24px}
.cs-hero .facts{display:grid;grid-template-columns:repeat(12,1fr);gap:24px;margin-top:48px;border-top:1px solid var(--hair);padding-top:24px}
.cs-hero .facts>div{grid-column:span 3}
.cs-hero .facts p{font-size:14px;line-height:1.55;color:var(--ink2);margin-top:8px}
.cs-hero .facts p b{font-weight:400;color:var(--ink)}
.cs-hero .facts ul{list-style:none;margin:8px 0 0;padding:0;font-size:14px;line-height:1.55;color:var(--ink2)}
@media(max-width:900px){.cs-hero .facts>div{grid-column:span 6}}
@media(max-width:560px){.cs-hero .facts>div{grid-column:span 12}}
.cs-hero .plate{margin-top:48px}
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
.row.r7{grid-template-columns:5fr 7fr}
.row.r75{grid-template-columns:7fr 5fr}
@media(max-width:900px){.row,.row.r7,.row.r75{grid-template-columns:1fr;gap:24px}}
.tx h3{font-size:17px;line-height:1.3}
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
.plate.pad img,.plate.pad video{border-radius:8px}
figure{margin:0}
figure.mt{margin-top:48px}
figcaption{font-size:12.5px;line-height:1.5;color:var(--ink3);margin-top:12px;max-width:60ch}
.three{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:48px}
.three figcaption{margin-top:10px}
@media(max-width:700px){.three{grid-template-columns:1fr}}
/* cells: the hero grid's object, holding text */
.cells{display:grid;grid-template-columns:repeat(3,1fr);margin-top:48px}
.cells.c2{grid-template-columns:repeat(2,1fr)}
.cells.c4{grid-template-columns:repeat(4,1fr)}
.cell{border-top:1px solid var(--hair);border-bottom:1px solid var(--hair);border-left:1px solid var(--hair);padding:24px;min-width:0}
.cell:last-child{border-right:1px solid var(--hair)}
.cell h3{font-size:15.5px;line-height:1.3}
.cell h4{font-size:15.5px}
.cell p{font-size:14.5px;line-height:1.55;color:var(--ink2);margin-top:10px}
.cell ul{margin:10px 0 0;padding-left:16px;font-size:14.5px;line-height:1.55;color:var(--ink2)}
.cell li+li{margin-top:6px}
.cell .big{font:300 40px/1 var(--hel);letter-spacing:-.02em;color:var(--ink);margin:0}
.cell .big+p{margin-top:12px}
.cell img.av{width:56px;height:56px;border-radius:50%;object-fit:cover;outline:1px solid var(--outline);outline-offset:-1px;display:block;margin-bottom:14px}
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
.flow .cell p{margin:0;font-size:14px;color:var(--ink)}
.flow .cell .m{border-radius:12px;overflow:hidden;outline:1px solid var(--outline);outline-offset:-1px;background:var(--plate)}
.flow .cell .m video,.flow .cell .m img{display:block;width:100%;height:auto}
.flow .cell .ic{height:48px;width:auto;opacity:.85}
[data-theme="dark"] .flow .cell .ic{filter:invert(1)}
@media(max-width:900px){.flow{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.flow{grid-template-columns:1fr}}
/* takeaways */
.take{margin-top:48px;display:grid;grid-template-columns:6fr 6fr;gap:48px;align-items:start}
.take ol{list-style:none;margin:16px 0 0;padding:0;counter-reset:t}
.take li{counter-increment:t;display:grid;grid-template-columns:40px 1fr;gap:16px;padding:16px 0;border-top:1px solid var(--hair);font-size:15.5px;line-height:1.6;color:var(--ink2)}
.take li:before{content:counter(t,decimal-leading-zero);font:300 20px/1.4 var(--hel);color:var(--ink3)}
.take li:last-child{border-bottom:1px solid var(--hair)}
@media(max-width:900px){.take{grid-template-columns:1fr}}
/* thanks + more */
.thanks{margin-top:96px;display:flex;gap:24px;align-items:center;border-top:1px solid var(--hair);border-bottom:1px solid var(--hair);padding:24px 0}
.thanks img{width:96px;height:96px;object-fit:contain}
.thanks h3{font-size:17px}
.thanks p{font-size:15px;color:var(--ink2);margin-top:6px;line-height:1.55}
.thanks a{color:var(--touch)}
.more{margin-top:96px}
.more .cells{margin-top:16px}
.more a.cell{display:block;text-decoration:none;color:inherit;transition:background .16s ease}
.more a.cell:hover{background:color-mix(in srgb,var(--ink) 4%,transparent)}
.more a.cell .t{font:300 28px/1.15 var(--hel);letter-spacing:-.015em;color:var(--ink);display:block}
.more a.cell p{margin-top:8px}
.more a.cell .n{font:500 11px var(--jak);letter-spacing:.12em;color:var(--ink3);display:block;margin-bottom:12px}
"""
NAV = """<nav><div class="wrap in">
  <a class="mark" href="/">Jazlynn Kurniandra</a>
  <span class="links">
    <button id="theme" aria-label="Switch colour mode" title="Colour mode">
      <svg class="sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      <svg class="moon" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
    </button>
    <a class="l" href="/#work">Projects</a><a class="l" href="http://localhost:3000/sandbox">Sandbox</a><a class="l" href="/about.html">About</a></span>
</div></nav>"""
THEME_HEAD = """<script>(function(){const q=new URLSearchParams(location.search).get('theme');let t=q||localStorage.getItem('theme');
if(t!=='light'&&t!=='dark') t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t);})();</script>"""
SITE_JS = """<script>
/* ---------- the cursor ---------- */
(function(){
  if(!matchMedia('(hover: hover) and (pointer:fine)').matches) return;
  const c=document.createElement('div'); c.id='cur'; c.appendChild(document.createElement('i')); document.body.appendChild(c);
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
    c.classList.toggle('hot',!!t);
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
(function(){const el=document.getElementById('clock');if(!el)return;const f=()=>el.textContent=new Date().toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit',second:'2-digit',timeZoneName:'short'});f();setInterval(f,1000);})();
/* videos only play while on screen */
(function(){const io=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting){v.play().catch(()=>{});}else v.pause();}),{rootMargin:'160px'});
document.querySelectorAll('video[data-io]').forEach(v=>io.observe(v));})();
</script>"""
FOOTER = """<footer><div class="wrap"><div class="rule"></div><div class="in">
  <span style="font-size:12.5px;color:var(--ink3)">My local time <b id="clock" style="font-weight:400;color:var(--ink2);font-variant-numeric:tabular-nums"></b></span>
  <span style="display:flex;gap:20px"><a href="mailto:jazkurnz06@gmail.com">Email</a><a href="#">LinkedIn</a><a href="#">X</a></span>
  <span style="font-size:12.5px;color:var(--ink3)">© 2026 Jazlynn Kurniandra</span>
</div></div></footer>"""

def page(title, body, extra_css=""):
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Cache-Control" content="no-cache">
<title>{html.escape(title)} — Jazlynn Kurniandra</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600&display=swap" rel="stylesheet">
<style>{TOKENS}{BASE}{extra_css}</style>{THEME_HEAD}</head><body>
{NAV}
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
def media(src, alt="", pad=False):
    cls = 'plate pad' if pad else 'plate'
    if src.endswith('.mp4'):
        return f'<div class="{cls}"><video src="{src}" muted loop playsinline preload="metadata" data-io></video></div>'
    return f'<div class="{cls}"><img src="{src}" alt="{E(alt)}" loading="lazy"></div>'
def FIG(src, cap="", alt="", pad=False, mt=True):
    c = f'<figcaption>{rich(cap)}</figcaption>' if cap else ''
    return f'<figure class="{"mt" if mt else ""}">{media(src, alt or cap, pad)}{c}</figure>'
def ROW(left, right, kind=""):
    return f'<div class="row {kind}">{left}{right}</div>'
def THREE(items):
    out=''.join(f'<figure>{media(s,a)}<figcaption>{rich(c)}</figcaption></figure>' for s,c,a in items)
    return f'<div class="three">{out}</div>'
def CELLS(cells, cols=3):
    return f'<div class="cells c{cols}">'+''.join(cells)+'</div>'
def CELL(inner, cls=""): return f'<div class="cell {cls}">{inner}</div>'
def STAT(big, text): return CELL(f'<p class="big">{E(big)}</p><p>{rich(text)}</p>')
def QUOTES(qs): return '<div class="quotes">'+''.join(f'<div class="cell"><p>{rich(q)}</p><p class="who">{E(w)}</p></div>' for q,w in qs)+'</div>'
def PERSONA(av, name, kv, bullets):
    return CELL(f'<img class="av" src="{av}" alt=""><h4>{E(name)}</h4><p class="kv">{E(kv)}</p>'+UL(bullets))
def HMW(a, b):
    return CELLS([CELL(f'<h3>{E(a)}</h3>','ink'), CELL(f'<h3>{E(b)}</h3>','gold')], 2)
def FLOW(steps):
    out=''
    for cap, kind, src in steps:
        if kind=='icon': m=f'<img class="ic" src="{src}" alt="">'
        elif kind=='video': m=f'<div class="m"><video src="{src}" muted loop playsinline preload="metadata" data-io></video></div>'
        else: m=f'<div class="m"><img src="{src}" alt="" loading="lazy"></div>'
        out+=f'<div class="cell"><p>{E(cap)}</p>{m}</div>'
    return f'<div class="flow">{out}</div>'
def SECTION(id, eyebrow, h2, lede, *blocks):
    lede_html = f'<div class="lede">{P(*lede)}</div>' if lede else '<div></div>'
    return f'<section class="cs" id="{id}"><div class="wrap"><div class="head"><div><div class="label">{E(eyebrow)}</div><h2>{rich(h2)}</h2></div>{lede_html}</div>{"".join(blocks)}</div></section>'
def TAKE(photos, points):
    ph = ''.join(f'<figure style="margin-top:{0 if i==0 else 16}px">{media(s,a)}</figure>' for i,(s,a) in enumerate(photos))
    ol = '<ol>'+''.join(f'<li>{rich(p)}</li>' for p in points)+'</ol>'
    return f'<div class="take"><div>{ph}</div><div><div class="label">Final thoughts</div><h3 style="font-size:22px;margin-top:12px">Key takeaways and next steps.</h3>{ol}</div></div>'
def NEXT(items):
    return CELLS([CELL(f'<div class="label">Next step {i+1:02d}</div><p style="color:var(--ink);margin-top:12px">{rich(t)}</p>') for i,t in enumerate(items)], 3)
def THANKS():
    return ('<div class="thanks"><img src="/images/manus/thanks/cartoon-jaz.png" alt=""><div><h3>Thanks for visiting!</h3>'
            '<p>I design better than I summarize. Let\'s fix that over a call or interview. Reach out <a href="mailto:jazkurnz06@gmail.com">here</a>.</p></div></div>')

PROJECTS = [
  dict(n='01', t='Manus AI',         y='2026', href='/work/manus-ai.html',          s='Designing an AI community platform to drive adoption'),
  dict(n='02', t='Clover',           y='2026', href='/404.html?p=Clover',            s='Designing the HUD interface and shipping the iOS companion app'),
  dict(n='03', t='Fostr',            y='2026', href='https://fostr.page/', ext=True, s='Building the brand, landing site and internal platform from 0 to 1'),
  dict(n='04', t='Olive',            y='2026', href='https://drive.google.com/file/d/15-mX_sIkPU_Ww4R1UueWG10Wv9CQbhEy/view', ext=True, s='Designing an AI-powered carbon tracking app'),
  dict(n='05', t='Second Self',      y='2026', href='https://devpost.com/software/second-self-giwmxh', ext=True, s='Building an AI agent that lives on your own Mac'),
  dict(n='06', t='Halodoc',          y='2025', href='/404.html?p=Halodoc',           s='Designing the onboarding journey for AI Prescription on mobile'),
  dict(n='07', t='Conduit Commerce', y='2025', href='/work/conduit-commerce.html',  s='Designing and shipping a B2B SaaS website for an AI-feature launch'),
  dict(n='08', t='SomiaCX',          y='2025', href='/work/somia-cx.html',          s='Architecting a unified UVP system for three financial subsidiaries'),
]
def MORE(current):
    others=[p for p in PROJECTS if p['href'].startswith('/work/') and p['t']!=current][:2]
    cells=''.join(f'<a class="cell" href="{p["href"]}"><span class="n">{p["n"]} &middot; {E(p["y"])}</span><span class="t">{E(p["t"])}</span><p>{E(p["s"])}</p></a>' for p in others)
    return f'<div class="more"><div class="label">More projects</div><div class="cells c2">{cells}</div></div>'

def HERO(n, name, logo, title, media_src, role, duration, team, results, toc, pad=False):
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
  {media(media_src, name, pad)}
</div></header>"""

def case(name, n, body_sections, title):
    body = ''.join(body_sections) + f'<div class="wrap">{THANKS()}{MORE(name)}</div>'
    return page(f'{name} — {title}', body, CASE_CSS)

# ------------------------------------------------------------------ MANUS AI
TOC5=[('overview','Overview'),('problem','Problem'),('research','Research'),('development','Development'),('testing','Testing'),('solution','Solution')]
manus = case('Manus AI','01',[
 HERO('01','Manus AI','/images/manus/hero/logo.svg','Designing an AI community platform to drive adoption.','/images/manus/hero/laptop-mockup.mp4',
   'Leading user research, architecting the design system, user flows and interaction mechanisms, and ideating the UI features.','3 months, winter break',
   ['1 product designer (me!)','1 co-founder CMO','2 engineers','2 PMs','1 business strategist'],['Retention ~30% → 65–70%','Shipped & handed off'],TOC5),
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
       TX(H3('Understanding our users'), P('Thirteen participants in two groups: **Community Newcomers (5)** and **Power Users (8)**.'))),
   CELLS([PERSONA('/images/manus/research/persona-newcomer.png','Community Newcomer','Age 22–35',['**Doesn\'t know where to start** or what Manus is capable of doing for them.','**Wants to learn fast**, find relevant opportunities, and get value quickly.']),
          PERSONA('/images/manus/research/persona-power-user.png','Power User','Age 25–40+',['Has **no structured way** to surface or share their work meaningfully.','**Wants visibility and credibility** for their contributions within the community.'])],2),
   '<div class="label" style="margin-top:96px">Finding the gaps in the market</div><h2 style="font-size:clamp(22px,2.6vw,30px);line-height:1.2;margin-top:12px;max-width:28ch">What existed already left gaps where users needed structure, signal, and momentum.</h2>',
   CELLS([CELL('<h3>Discord / chat communities</h3>'+UL(['Fast, informal interaction','Knowledge fragments instantly','No durable contribution tracking'])),
          CELL('<h3>Gamified builder platforms</h3>'+UL(['Short-term engagement spikes','Incentivizes activity over impact','High cognitive load'])),
          CELL('<h3>Traditional forums and docs</h3>'+UL(['Structured and searchable','Low participation, slow feedback','Not built for fast updates']))]),
   '<div class="label" style="margin-top:48px">Our direction</div>',
   HMW('How might we make AI capabilities legible to everyday users?','How might we turn passive members into active contributors?'),
 ),
 SECTION('development','Development','Iterating toward a system that could actually scale.',[],
   FIG('/images/manus/development/whiteboard-sketches.png','Lo-fi whiteboards across four iterations. The search bar was repurposed as an AI feature, scalable explore and event CTAs arrived in version 2, and the engineering team kept event submission manual through Luma to prioritise reliability and speed to launch.'),
   ROW(FIG('/images/manus/development/second-approach-hifi-specs.png','Second approach hi-fi specs across six responsive breakpoints.',mt=False),
       TX(H3('Problem with static scalability'), P('After internally launching the static experience, we ran a third round of usability testing. **7 out of 10 users disengaged quickly.** But the more revealing finding wasn\'t that they left, it was where they lingered before leaving.'),
          H3('Interactive elements'), P('Users spent significantly less time on the role selector and the three-card feature section, and disproportionately more time on the Global Distribution map and the Next Hackathon countdown. Both were the only two elements with motion: the map was pulsing, the countdown was live.')),'r7'),
   ROW(media('/videos/manus/interaction-walkthrough.mp4'), TX(H3('Take away'), P('This told me two things: the information architecture needed realignment, and users were drawn to interactivity that felt personally relevant and alive. Immediately, I began another round of iteration for longer time-on-page.')),'r7'),
 ),
 SECTION('testing','Testing','Testing our personalized journey feature.',[],
   THREE([('/images/manus/testing/your-path-second.png','Second prototype. A simpler "choose your path" role grid.',''),('/images/manus/testing/your-path-third-v1.png','Third prototype v1. A Your Path card with role, focus area and mode.',''),('/images/manus/testing/your-path-third-v2.png','Third prototype v2. Recommended next steps expand from the card.','')]),
   ROW(TX(H3('Adjustment to personalized path #1'), P('Based on 8 usability tests, I found that the **"Start My AI-Guided Path"** CTA had the highest click-through of any version tested. I pulled inspiration from RPG-style gamification: instead of assigning users a generic role, the system treats each user as a character with their own stats, focus areas, and progression mode, making the community feel like a world they\'re actively moving through, not a page they\'re passively browsing.','The "Powered by Manus" tag was a detail the founder specifically liked, because it demonstrated the product\'s own intelligence working natively inside the community experience.')),
       TX(H3('Adjustment to personalized path #2'), P('After presenting to my PM, **she mentioned they were planning to add more community roles.** The original design used a fixed 3-card layout, one card per featured opportunity. It worked for the current three roles, but it would break the moment the community team launched a new one.','Every new role, Campus Leader, Ambassador, Regional Hub, would require a manual design update. I redesigned the recommendations layer to be role-agnostic and AI-driven, so the "Powered by Manus" inference layer surfaces what\'s relevant to each user, whether that\'s a hackathon, an ambassador program, or a role that doesn\'t exist yet.'))),
   THREE([('/images/manus/testing/hackathon-card-before.png','Second prototype. Three post-it style recommendation cards.',''),('/images/manus/testing/hackathon-card-after-1.png','Third prototype, before. A single hackathon card with effort and duration.',''),('/images/manus/testing/hackathon-card-after.png','Third prototype, after. The same card with a "Why this matters" reveal.','')]),
   ROW(FIG('/images/manus/adjustment/journey-flow.png','Mapping a comprehensive user journey and shared APIs with the PM and engineers.',mt=False), TX(H3('Mapping the journey with PM and SWEs'), P('A shared flow across the engineering team, community team, PM and design, so every opportunity surfaced by the inference layer had an owner and an API behind it.')),'r75'),
 ),
 SECTION('solution','Solution','An AI-guided community system that adapts as users grow.',[],
   ROW(media('/videos/manus/solution-1-dashboard.mp4'), TX('<div class="label">01</div>',H3('Centralized community dashboard'), P('A single home for everything a Manus user needs to know, do, and track. Users land on a dashboard that orients them immediately: their role, their active path, upcoming events, and pending contributions all visible in one place. Reminders surface when something needs attention. Nothing gets missed because nothing is buried.')),'r7'),
   ROW(media('/videos/manus/solution-2-paths.mp4'), TX('<div class="label">02</div>',H3('AI-guided personalized paths'), P('"Your Path, Powered by Manus" infers each user\'s role, focus area, and current mode from their behavior, then generates a guided next step tailored to them. Instead of a generic feed, users are met with "Recommended this week. Prioritized by fit, not engagement." Every recommendation carries a "Why this matters" explanation so users always know the reasoning behind what they\'re shown.')),'r7'),
   ROW(media('/videos/manus/solution-3-recommendations.mp4'), TX('<div class="label">03</div>',H3('Scalable role-agnostic recommendations'), P('The final system is role-agnostic and AI-driven: when users log into Manus, the inference layer immediately surfaces relevant opportunities, whether they\'re interested in hackathons, ambassador programs, campus leadership, or roles that don\'t exist yet. The community scales without the design breaking.')),'r7'),
   '<div class="label" style="margin-top:96px">The results</div>',
   CELLS([STAT('65–70%','Retention, up from ~30% following rollout of the AI-guided architecture.'),STAT('2.1×','Time-on-site, indicating deeper engagement with paths, events, and recommendations.'),STAT('80%','of users reported improved clarity around where to start and how to contribute meaningfully.')]),
   TX(P('Following the rollout, users specifically cited personalized paths, contextual recommendations, and "why this matters" explanations as the primary reasons they felt motivated to stay. **75%** described the experience as more personally relevant compared to the static version.')),
   TAKE([('/images/manus/final-thoughts/photo-group.jpg','Manus AI team'),('/images/manus/final-thoughts/photo-skyline.jpg','MBS skyline from the Manus office'),('/images/manus/final-thoughts/photo-laptop.jpg','Manus workspace')],
        ['Designing for community at scale is less about driving engagement and more about building trust through guidance and simplicity.','Pivoting early concepts through research was critical to finding the right way to solve problems.','The most important design decision is asking "so what?" before your users have to ask it themselves.']),
   NEXT(['Increase transparency in AI decisions by adding lightweight user feedback.','Track time-to-first-meaningful-action for actual contribution.','Finish up development and launch!']),
 ),
], 'Designing an AI community platform to drive adoption')

# ------------------------------------------------------------------ CONDUIT COMMERCE
conduit = case('Conduit Commerce','07',[
 HERO('07','Conduit Commerce','/images/conduit/hero/conduit-logo.svg','Designing and shipping a B2B SaaS website for an AI-feature launch.','/videos/conduit/hero/hero-laptop-mockup.mp4',
   'Leading product design, company branding, UX strategy, design system creation, UX copywriting, and usability testing.','3 months',
   ['2 UX designers (me!)','1 UX researcher','1 marketing designer','1 founder','1 PM'],['~40% lower bounce rate','~28% more demo requests','Shipped & live'],TOC5),
 SECTION('overview','At a glance','A Copilot launch for an industry that still ran on spreadsheets and phone calls.',
   ['As Product Design Lead, I led a team of 3 designers to support Conduit Commerce\'s Copilot launch. Conduit is a fintech backed by Dragonfly and Altos Ventures, and I worked directly with the founder, recognized on Forbes 30 Under 30, to align the design with the product\'s technical ambition and the practical needs of their B2B customer base.',
    'Conduit Copilot is an AI that streamlines the entire buying and selling process for wholesale and distribution businesses, an industry largely unfamiliar with AI adoption. The product was a genuine leap forward. Our job was to make sure their branding and website said so.']),
 SECTION('problem','Problem','The website was working against the product.',
   ['Conduit Commerce is a B2B SaaS and CaaS platform built for a specific, underserved audience: the people who buy and sell physical goods in wholesale and distribution. Think carpet sellers, materials buyers, regional distributors. Their product suite spans four pillars: Copilot, Ops, Wholesale, and Dropship.',
    'Conduit was looking to expand toward more tech-savvy, modern clients without losing their core base, Midwest wholesale buyers. It\'s a challenge of acquisition and retention at once, and it all comes down to how the brand, design, and copy position the product. Especially with their newly launched Copilot.'],
   '<div class="label" style="margin-top:48px">Solution preview</div>',
   FLOW([('User lands on website','icon','/images/manus/flow-icons/laptop.svg'),('Explores Copilot','video','/videos/conduit/solution-4-instructional-animations.mp4'),('Understands Conduit\'s core','video','/videos/conduit/solution-1-dashboard.mp4'),('Books a demo','icon','/images/manus/flow-icons/people.svg')]),
   '<div class="label" style="margin-top:96px">Initial pivot</div><h2 style="font-size:clamp(22px,2.6vw,30px);line-height:1.2;margin-top:12px;max-width:26ch">The first design looked great. Users thought we were selling hiking gear.</h2>',
   ROW(f'<div style="display:grid;gap:16px">{media("/images/conduit/initial-pivot/lofi-sketch-1.jpg")}{media("/images/conduit/initial-pivot/lofi-sketch-2.jpg")}</div>', TX(H3('LoFi exploration'), P('To rapid-prototype, I split my team into two pairs and produced two IA prototypes, then compared them to see what each could learn from the other. I did this so we would come up with original ideas first instead of building on one basis. We presented both to Conduit\'s PM, then pushed the exploration into Claude.')),'r7'),
   ROW(media('/videos/conduit/initial-pivot-ia-systems.mp4'), TX(H3('Information architecture systems exploration'), P('I used Claude to expedite the IA exploration and system-level thinking in this phase for quick usability feedback.')),'r7'),
   ROW(media('/images/conduit/initial-pivot/following-trends-japanese.mp4'), TX(H3('Following trends'), P('After feedback I used Framer to prototype the visual direction. The first design round drew on a trend: Ukiyo-e Japanese woodblock prints, a nature-forward visual language with texture, warmth, and mountain landscapes. It was distinctive. Intentional. And it communicated absolutely nothing about what Conduit Commerce did for a wholesale distributor.')),'r7'),
 ),
 SECTION('research','Research','Style over function was losing our users.',[],
   QUOTES([("Sometimes, the website wouldn't even load for me. I think it has too many things going on. Usually I just prefer contacting their customer service immediately.",'Conduit user'),
           ("I went straight to Copilot but I still don't know how it connects to Ops or Wholesale. Is this one platform or separate tools?",'Potential user'),
           ("I get that it's AI for suppliers and retailers, but what does it actually do? 'Proactive outreach' doesn't tell me anything.",'Conduit user')]),
   ROW(TX(H3('User interviews (11) and secondary research'), UL(['**4 out of 7 current users** reported the site failed to load entirely on slower connections, before they even saw the product.','Many potential users who weren\'t used to Conduit **didn\'t understand the products** they were selling.','**8 out of 11 users** described the first design as a lifestyle brand, not a B2B operations tool.'])),
       TX(H3('Understanding our users'), P('Eleven participants in two groups: **Core Users (7)** and **Potential Users (4)**.'))),
   CELLS([PERSONA('/images/conduit/users/core-user-avatar.png','Core user','Age 35–40+',['**Can\'t load the site reliably** on slower connections, leaving before seeing the product at all.','**Wants to know how to optimize** their Conduit subscription. Most didn\'t even know of the Copilot launch.']),
          PERSONA('/images/conduit/users/potential-user-avatar.png','Potential user','Age 25–35',['**Doesn\'t understand how Conduit\'s products connect**, whether Ops, Dropship, and Wholesale are one system or separate tools.','**Wants a clearer picture** of how everything fits together before committing to a demo.'])],2),
   '<div class="label" style="margin-top:96px">Finding the gaps in the market</div>',
   CELLS([CELL('<h3>Competitor #1</h3>'+UL(['Strong B2B buyer focus','Clear supplier/retailer split','Category-specific only','No storytelling components'])),
          CELL('<h3>Competitor #2</h3>'+UL(['Outcome-led copy','Strong trust signals','No AI positioning','Not operations-focused'])),
          CELL('<h3>Competitor #3</h3>'+UL(['Feature-rich and functional','Clear product hierarchy','Not aesthetics heavy','Built for technical buyers only']))]),
   ROW(THREE([('/images/conduit/gaps/moodboard-1.png','Moodboard 1',''),('/images/conduit/gaps/moodboard-2.png','Moodboard 2',''),('/images/conduit/gaps/moodboard-3.png','Moodboard 3','')]).replace('class="three"','class="three" style="margin-top:0;grid-template-columns:1fr;gap:12px"'),
       TX(H3('The pattern across all competitors'), UL(['None of them were competing on aesthetics. They were competing on clarity and function.','The best performing B2B sites led with outcomes, not features. Plain language over industry jargon.']),
          H3('The direction this revealed'), P('Conduit didn\'t need to out-design its competitors. It needed to out-communicate them. Clarity and functional UX copy were the gaps nobody in this market was filling.','Conduit is one of the first to implement AI into wholesale operations at this level. Users had no reference point for what that even meant. In situations like these, the words and the simplicity of the UI do more work than any visual treatment ever could.')),'r7'),
   '<div class="label" style="margin-top:48px">Our direction</div>',
   HMW('How might we write UX copy that sells the product?','How might we create animations that demonstrate?'),
 ),
 SECTION('development','Development','A human-centered design approach and conversational copy.',[],
   ROW(FIG('/images/conduit/development/figma-design-system-screenshot.png','The finalized design system in Figma.',mt=False), TX(H3('The founder disagreement'), P('The founder wanted to mirror competitor sites. I pushed back. Not because the competitors looked bad, but because their audiences were different. B2B SaaS for coastal tech buyers has different visual expectations than a wholesale operations tool for Midwest distributors. Designing for your actual audience rather than your aspirational peer set is a harder sell internally, but it\'s the right call. The testing data backed it, and the first design failure proved the point before the argument was fully resolved.')),'r7'),
   ROW(FIG('/images/conduit/development/design-system-exploration.png','Moodboards, typography and the palette.',mt=False), TX(H3('Design system exploration'), P('We were aiming for something original but sleek. Modern without being cold. After multiple iterations we landed on a design system built around shades of blue with soft gradients, and deliberately avoided sharp, rigid shapes. Conduit needed to feel flexible and inviting, something that pulls users in rather than presenting a wall of information.','Their clients were mainly non-tech-savvy people. We didn\'t want to infer coldness with the introduction of Copilot; we wanted a new era of Conduit that felt modern and tech-oriented while nudging users toward AI adoption. I sent this over to our marketing designer to begin the video assets for the website.')),'r7'),
   ROW(FIG('/images/conduit/development/ux-copy-wholesale-and-ops.png','The two UX copy documents, Wholesale and Ops.',mt=False), TX(H3('The UX copy rewrite'), P('I delivered two full UX copy documents, one for Conduit **Wholesale**, one for Conduit **Ops**. Each follows the same IA framework:'),
       UL(['Wholesale hero: "Order anytime, on your schedule. No calls, no emails, no waiting on anyone."','Ops hero: "Your whole team, always on the same page. One live view of every order, account, and update."','Copilot moved from vague AI claims to a concrete outcome: "The assistant that handles the busywork, so you can focus on the relationship."'])),'r7'),
 ),
 SECTION('testing','Testing','Some you win, some you lose.',
   ['Because of the founders\' rapid iteration timeline, there was no third round of usability testing before final dev handoff. With AI-accelerated product cycles, thoroughness is sometimes traded for speed. This is a real constraint that\'s becoming a reality for us product designers.']),
 SECTION('solution','Solution','A B2B SaaS website designed around user habits, while nudging AI adoption.',[],
   ROW(media('/videos/conduit/solution-1-dashboard.mp4'), TX('<div class="label">01</div>',H3('Centralized product dashboard'), P('A single home for all of Conduit\'s four core products. Each showcased with their benefits, their function, and all ending with an incentivized CTA to increase engagement.')),'r7'),
   ROW(media('/videos/conduit/solution-2-design-uniformity.mp4'), TX('<div class="label">02</div>',H3('Human-centered design uniformity'), P('All pages were designed around a cohesive visual language of gradients and soft-to-deep blues. Blue carries connotations of trust, reliability, and forward motion, which mapped directly to what a B2B audience needs to feel before making an operational decision. The gradient treatment kept it from feeling clinical.')),'r7'),
   ROW(media('/videos/conduit/solution-3-conversational-copy.mp4'), TX('<div class="label">03</div>',H3('Conversational UX copy'), P('Benefit-first, conversational copy across all product pages, written to onboard newcomers while still resonating with core users. Less jargon, a lower barrier to understanding what Conduit does, and a clear reason for every visitor to keep reading. We tackled retention with copy as a tool, not just a description.')),'r7'),
   ROW(media('/videos/conduit/solution-4-instructional-animations.mp4'), TX('<div class="label">04</div>',H3('Instructional animations'), P('The best way to showcase Conduit\'s products, especially Copilot, was through instructional micro-animations. Instead of decorative motion that slowed load times and communicated nothing, every animation serves a function: demonstrating how the product works as users interact with it.')),'r7'),
   '<div class="label" style="margin-top:96px">The results</div>',
   CELLS([STAT('~40%','lower bounce rate. Users can now immediately identify what Conduit does and who it\'s for.'),STAT('3×','time-on-site. Users are reading and engaging, not abandoning on slow connections.'),STAT('~28%','more demo requests in the first month post-launch.')]),
   TX(P('Following the launch, the **4 current users** who had reported complete site failures on slower connections can now access the site reliably.')),
   TAKE([('/images/conduit/final-thoughts/imessage-screenshot.png','Group chat with my designers during finals season')],
        ['Following trends and mirroring competitors doesn\'t make your design effective. Your design should fit your product and your user, not the aesthetic of whoever raised a Series B last quarter.','Working with AI tools in a fast-paced startup means trading thoroughness for speed. You expedite the process but sometimes skip the steps that would have caught something important.','The smallest details carry the most weight. Too much animation weakened engagement before users even read a word.','To become a product designer is to become a good teacher. Assume users know nothing when they arrive, and build an experience that teaches them as they scroll.']),
   NEXT(['Expand the design system for product surfaces beyond the Copilot landing site.','Conduct a post-launch usability study now that the site has real traffic.','Add trust signals, security badges and compliance language, for credibility.']),
 ),
], 'Designing and shipping a B2B SaaS website for an AI-feature launch')

# ------------------------------------------------------------------ SOMIACX
UVPS=[('01 Support','Safety net','kept'),('02 Advisor','Future planning','kept'),('03 Mentor','Vehicle understanding','merged with 04'),('04 Assistant','Routine management','kept'),('05 Buddy','Shared wallet','cut, low ROI'),('06 Connector','Local investment','cut, misaligned KPI')]
somia = case('SomiaCX','08',[
 HERO('08','SomiaCX × MUFG Bank','/images/somiacx/hero/somiacx-mufg-logo.png','Architecting a unified UVP system for three financial subsidiaries.','/images/somiacx/hero/phone-home.png',
   'UX designer: market research, product alignment, UVP architecture, LoFi and MidFi prototyping.','3 months',
   ['1 founder','1 PM','2 UX designers (me!)','1 SWE','1 UI designer'],['Support tickets −18%','~72% onboarding retention','~25% fewer branch visits'],TOC5, pad=True),
 SECTION('overview','At a glance','Three subsidiaries, one app, and users who had almost nothing in common.',
   ['My first product internship. I interned at SomiaCX as a UX designer, embedded inside a project for MUFG. They have three separate subsidiaries (a bank, an insurance company, and a vehicle financing arm) that were being merged into one unified financial app. Each had different users, different revenue models, and different internal teams who didn\'t always agree on what the product should do.',
    'I worked on the UVP architecture that would hold all of it together: a shared value framework that made each subsidiary feel coherent, not competing, and that served an incredibly diverse user base, from upper-income urban professionals to low-income, unbanked Indonesians with no digital literacy. By the end I had the chance to present to our stakeholders.']),
 SECTION('problem','Problem','How might we design a scalable shared UVP architecture that unifies three subsidiaries, serving diverse financial users inclusively?',
   ['MUFG\'s three subsidiaries had been operating independently for years, each with its own product logic, its own users, and its own definition of what "financial services" meant.',
    'These three groups had almost nothing in common: different income levels, different relationships with technology, different mental models of what a financial app was even for. Yet all three were expected to converge inside a single unified ecosystem. This wasn\'t just a design challenge. It was a product strategy, stakeholder alignment, and cultural inclusion challenge all at once.'],
   '<p class="label" style="margin-top:24px">*Due to tight NDA restrictions, some end products can\'t be shown.</p>',
   '<div class="label" style="margin-top:48px">Solution preview</div>',
   FLOW([('User discovers the app','icon','/images/somiacx/hero/phone.svg'),('UVP system shows their financial path','img','/images/somiacx/problem/solution-preview-lofi-uvp-4.png'),('Explores personalized financial features','img','/images/somiacx/problem/solution-preview-midfi-uvp-5.png'),('Users grow financial confidence with MUFG','icon','/images/manus/flow-icons/people.svg')]),
 ),
 SECTION('research','Research','Users were failing to see themselves in the product, given their diverse needs.',[],
   ROW(THREE([('/images/somiacx/research/research-card-1-comics.png','Three customer comics: different priorities, constraints, expectations.',''),('/images/somiacx/research/research-card-2-ideas.png','The ideation board.',''),('/images/somiacx/research/research-card-3-ranked.png','Ranked priorities and findings.','')]).replace('class="three"','class="three" style="margin-top:0;grid-template-columns:1fr;gap:12px"'),
       TX(H3('Desk research'), P('I conducted further analysis from company-shared private datasets (marketing, financial, and customer intelligence), and extensive desk research to really understand the problem.')),'r7'),
   ROW(FIG('/images/somiacx/research/news-article-affinity-map.png','A Jakarta vehicle news article beside the UVP affinity map.',mt=False), TX(H3('The insight that unlocked everything'), P('At the end of 2023, Indonesia had approximately **132.43 million motorcycles and 17.17 million passenger cars.** Beyond pure numbers, vehicles in Indonesia carry deep cultural weight: social signals, shared family assets, and often the single largest financial commitment a household makes. Vehicle financing installments touch every one of MUFG\'s three subsidiaries, and every one of their user segments.','It was the cultural anchor the unified experience needed.')),'r7'),
   ROW(FIG('/images/somiacx/research/field-research.png','Testing photos, branch office visits, sticky-note workshops.',mt=False), TX(H3('Field research'), P('I created sacrificial lo-fi concepts and took them directly into the field and to branch offices.')),'r7'),
   '<div class="label" style="margin-top:96px">Finding the gaps in the market</div>',
   ROW(FIG('/images/somiacx/understanding-users/bca-bri-mobile-phone.png','BCA and BRI mobile home screens, each surfacing a separate set of fragmented features.',mt=False),
       CELLS([CELL('<h3>One feature per subsidiary</h3><p>Internal conflict with no visible unity. Not user-friendly, especially for users who are financially and digitally illiterate.</p><p class="st">Instead</p><p>Relevant financial services that unify all three subsidiaries into one coherent experience.</p>'),
              CELL('<h3>Lacks intuition</h3><p>Users couldn\'t figure out what to do for next steps.</p><p class="st">Instead</p><p>A path that shows the next step before it is asked for.</p>'),
              CELL('<h3>Findings lack "so what?"</h3><p>Data without meaning.</p><p class="st">Instead</p><p>Tie incentives to a culturally relevant commonality.</p>'),
              CELL('<h3>Feels cold or mechanical</h3><p>Blue color schemes tested as anxiety-inducing.</p><p class="st">Instead</p><p>Micro-joy, cultural warmth, and human tone throughout.</p>')],2).replace('margin-top:48px',''),'r7').replace('class="row r7"','class="row r7" style="align-items:start"'),
   '<div class="label" style="margin-top:48px">Our direction</div>',
   HMW('How might we utilize collectivism as a design principle?','How might we implement familiarity in innovation?'),
 ),
 SECTION('testing','Testing','Understanding our users.',[],
   THREE([('/images/somiacx/usability/quote-car-owner.png','A car owner: wants to save for family but has no idea where to start.',''),('/images/somiacx/usability/quote-motorcycle-customer.png','A motorcycle customer: the language felt made for people richer than them.',''),('/images/somiacx/usability/quote-motorcycle-owner-2.png','A motorcycle owner: pays installments, doesn\'t know what else the app offers.','')]),
   ROW(TX(H3('User interviews (12) and secondary research'), UL(['Users across income segments **couldn\'t connect their installment payments** to broader financial services available within the same ecosystem.','Lower-income users felt the product tone and language **created distance.** It didn\'t feel made for someone like them.','Internal teams had **no unified customer view.** Each subsidiary managed users independently, making holistic service slow.'])), '<div></div>'),
   CELLS([PERSONA('/images/manus/research/persona-power-user.png','Motorcycle owners','Income ~$193–$1,290/month',['Pays installments regularly but doesn\'t know what other financial services they qualify for within the same app.','Wants to understand the total cost of vehicle ownership without going to a branch every time.']),
          PERSONA('/images/manus/research/persona-newcomer.png','Car owners','Income ~$320–$1,290+/month',['Manages banking and financing separately; no single view of their full financial picture.','Wants one place to track installments, insurance, and savings without switching between apps or branches.']),
          PERSONA('/images/conduit/users/core-user-avatar.png','Internal subsidiary team','Income ~$658–$1,290+/month',['Each subsidiary operates its own system. No shared logic, no unified customer view across the three.','Wants a platform architecture that lets them serve customers across subsidiaries.'])],3),
 ),
 SECTION('development','Development','Six pillars built around culture. Four survived stakeholder reality.',[],
   *[FIG(f'/images/somiacx/development/uvp-{i}.png', cap, mt=(i>1)) for i,cap in enumerate([
     'UVP 1, Support (safety net). "Make the unpredictable, predictable."','UVP 2, Advisor (future planning). "Optimize your future with your own advisor."','UVP 3, Mentor (vehicle understanding). "Knowledgeable companionship with your own vehicle mentor."','UVP 4, Assistant (routine management). "Manage life chores easier with your personalized assistant."','UVP 5, Buddy (family and social savings). "Better together with a Buddy."','UVP 6, Connector (local inclusion). "Grow together with your local community."'],1)],
 ),
 SECTION('solution','Solution','A shared UVP architecture that unifies subsidiaries without disregarding their users.',[],
   ROW(CELLS([CELL(f'<h3>{E(a)}</h3><p>{E(b)}</p><p class="st">{E(c)}</p>', '' if c=='kept' else 'dim') for a,b,c in UVPS],2).replace('margin-top:48px',''),
       TX(H3('Post stakeholder meeting'), P('After presenting all six pillars, stakeholder feedback forced hard prioritization.'), UL(['UVP 3 (Mentor) was merged with UVP 4 (Assistant); their overlap was too significant to justify maintaining separately.','UVP 5 (Shared Wallet) was flagged as low ROI.','UVP 6 (Local Investment) was misaligned with KPIs at the subsidiary level.']), P('**Four pillars moved forward. Two were cut.**')),'r75').replace('class="row r75"','class="row r75" style="align-items:start"'),
   '<div class="label" style="margin-top:96px">The results</div><p class="label" style="margin-top:6px;text-transform:none;letter-spacing:0;font-weight:500">Backed by the subsidiaries\' final assessment report.</p>',
   CELLS([STAT('−18%','user friction and support tickets in first-round UVP testing.'),STAT('~72%','retention across onboarding flows, with culturally grounded choices resonating across income and literacy levels.'),STAT('~25%','projected reduction in branch-visit dependency as users felt confident navigating financial decisions independently.')]),
   TX(P('I also learned that sometimes it\'s okay to say no to stakeholders. Clarity under stakeholder pressure is a design skill. When everyone is asking for more, the ability to say "this specific thing, done well, serves the goal better than adding another feature" requires both research grounding and confidence in the process. This is the type of skill I couldn\'t have learned from the books.')),
   TAKE([('/images/somiacx/final-thoughts/team-selfie.png','SomiaCX team selfie'),('/images/somiacx/final-thoughts/meeting.png','A working meeting'),('/images/somiacx/final-thoughts/working.png','At the office')],
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
ABOUT_CSS = """
.about{padding:160px 0 64px;min-height:calc(100vh - 200px)}
.about .grid{display:grid;grid-template-columns:7fr 5fr;gap:64px;align-items:start}
.about h1{font-size:clamp(26px,3vw,36px);line-height:1.18;max-width:24ch}
.about .bio{margin-top:32px;max-width:58ch}
.about .bio p{font-size:19px;line-height:1.62;color:var(--ink2)}
.about .bio p+p{margin-top:16px}
.about .bio b{font-weight:400;color:var(--ink)}
/* the facts live in cells, the grid's own object, stacked into one column */
.about .facts{display:grid;grid-template-columns:1fr}
.about .facts .cell{padding:20px 24px;border-right:1px solid var(--hair)}
.about .facts .cell+.cell{border-top:0}
.about .facts .cell p{margin-top:8px;color:var(--ink);font-size:14.5px}
.about .facts .cell p span{color:var(--ink3)}
.about .facts .cell a{color:var(--ink);text-decoration:none;font-weight:400;transition:color .18s ease}
.about .facts .cell a:hover{color:var(--touch)}
.about .facts .cell .links{display:flex;gap:18px;margin-top:10px}
.about .facts .ext{font-size:.75em;vertical-align:.2em;color:var(--ink3)}
.about .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--gold);margin:0 8px 1px 0}
@media(max-width:900px){.about .grid{grid-template-columns:1fr;gap:40px}}
"""
about = page('About', f"""<main class="about"><div class="wrap">
  <div class="label">About</div>
  <div class="grid" style="margin-top:12px">
    <div>
      <h1>Hailing from Jakarta, Indonesia, Jazlynn Kurniandra is a lighthearted designer.</h1>
      <div class="bio">
        <p>She has a lasting interest in how people notice things, and translates a background in drawing and cognitive science into <b>charming consumer products and wearables</b>. Most recently that has meant a heads-up display for glasses and the iPhone app that runs it, a community platform for an AI agent, and a brand and internal platform for a foster-care startup, built from nothing.</p>
        <p>She is currently studying at Columbia University in New York.</p>
      </div>
    </div>
    <div class="facts">
      <div class="cell"><div class="label">Now</div><p><i class="dot"></i>Available for 2026 roles</p></div>
      <div class="cell"><div class="label">Previously</div><p>Clover <span>&middot;</span> Manus AI <span>(acquired by Meta)</span><br>Fostr <span>&middot;</span> Halodoc <span>&middot;</span> Conduit Commerce <span>&middot;</span> SomiaCX</p></div>
      <div class="cell"><div class="label">Education</div><p>Columbia University <span>&middot;</span> New York</p></div>
      <div class="cell"><div class="label">Reach</div><div class="links"><a href="#">Resume <span class="ext">&#8599;</span></a><a href="mailto:jazkurnz06@gmail.com">Email</a><a href="#">LinkedIn</a></div></div>
    </div>
  </div>
</div></main>""", CASE_CSS+ABOUT_CSS)

# ------------------------------------------------------------------ write
os.makedirs('work', exist_ok=True)
for path, doc in [('work/manus-ai.html', manus), ('work/conduit-commerce.html', conduit), ('work/somia-cx.html', somia), ('404.html', four), ('about.html', about)]:
    open(path,'w').write(doc); print(f'{path:28s} {len(doc)//1024} KB')
