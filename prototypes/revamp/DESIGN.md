# jazlynnwashere.com design system

Pulled from the shipped source (index.html, build.py, site-mark.js) on 2026-10-10. Tokens are CSS custom properties; every number below is the one in the code.

## Colour

Three fixed colours, in both modes:

| token | hex | job |
| --- | --- | --- |
| `--gold` | #A99939 | accent tile, chips, hover ink in dark mode |
| `--oxblood` | #340414 | accent tile, hover ink in light mode, the signature mark |
| `--charcoal` | #1C1A17 | the dark ground |

Signature pair (hero discs, personas, About shelf): green #9ba69c, purple #827a85. Frost disc swatches: #dfddc8 #c7c7c7 #827a85 #9ba69c #c4c1c8 #8f9484 #c2beb3 #dfdac8.

Two modes, one palette: the ground and the ink swap, nothing new is introduced.

| token | light | dark |
| --- | --- | --- |
| `--paper` (ground) | #FAF9F7 | #1C1A17 |
| `--ink` | #14171B | #FAF9F7 |
| `--ink2` (body text) | ink at 66% | ink at 66% |
| `--ink3` (labels, captions) | ink at 42% | ink at 42% |
| `--hair` (rules, borders) | ink at 16% | ink at 16% |
| `--outline` (plates) | black at 10% | white at 10% |
| `--plate` (media ground) | #FAF9F7 | #262320 |
| `--touch` (links) | #340414 | #A99939 |
| `--flick-a` / `--flick-b` (tiles) | gold / oxblood | gold / paper |
| `--pill` (nav) | #fff | #262320 |

Rule: oxblood is 12:1 on paper and invisible on charcoal; gold is the reverse. Each mode uses the one that reads. Theme follows the visitor's system unless they choose; the choice is stored.

## Type

Two families. Jakarta for anything that names or labels; Helvetica for anything you read or that is big and light.

| role | spec |
| --- | --- |
| Eyebrow label | Jakarta 600 · 10.5px · line 1.5 · tracking .15em · uppercase · `--ink3` |
| Page headline (h1) | Jakarta 500 · clamp(28px, 4vw, 44px) · line 1.12 · tracking -.012em · max 22ch |
| Section headline (h2) | Jakarta 500 · clamp(22px, 2.6vw, 30px) · line 1.2 · max 26ch |
| Block heading (h3) | Jakarta 500 · 17px · line 1.3 (15.5px inside cells) |
| Lede | Helvetica 300 · 17px · line 1.62 · `--ink2` · max 52ch |
| Body | Helvetica 300 · 15.5px · line 1.62 · `--ink2`; bold = weight 400 in `--ink` |
| Caption / meta | Helvetica 300 · 12.5px · line 1.5 · `--ink2` or `--ink3` |
| UI label (pills, buttons, counters) | Jakarta 500 · 12.5 to 13.5px · tracking .01em |
| Project titles (home list) | Helvetica 300 · 44px · line 1.15 · tracking -.015em (32px under 900px, 26px under 640px) |
| Big numbers (stats) | Helvetica 300 · 40px · line 1 · tracking -.02em |
| Hero wall letters | Helvetica 400 · 0.9 × row height; rows 22 to 72px |
| Nav links | Helvetica 400 · 14.5px |
| Mark (signature) | height clamp(28px, 2.6vw, 38px) |

All headings `text-wrap: balance`, paragraphs `text-wrap: pretty`. No em dashes anywhere in copy.

## Spacing

8pt base. The numbers that recur:

| where | value |
| --- | --- |
| Page gutter | 30px each side; content max 1180px |
| Top of a page (under the fixed nav) | 136px (104px under 640px) |
| Between sections | 96px (64px under 640px) |
| Head stack: eyebrow to headline | 12px (measured 32px top to top) |
| Head stack: headline to lede | 16px (measured 64px line to lede) |
| Block to block inside a section | 48px (32px on phones) |
| Row gap (two columns) | 48px; grid 6fr 6fr, text rows top-aligned |
| Cell padding | 24px; slot padding 20px |
| Media card inset | 12px on all four sides, always equal |
| Stacked headings inside one text block | 28px |
| Nav pill top | 24px (16px under 640px) |
| Footer | 64px above, 46px below; More projects ends with 96px |

Golden rule for media: every card the same size, the same padding on all four sides, fit with `cover`, never `contain`, captions below the media never over it.

## Shape

| element | radius |
| --- | --- |
| Plates, previews, sheet, shelf boxes | 20px (12px for the media inside a 12px-inset card) |
| Gallery cards, small figures | 8px |
| Flow plates, deck cards | 12px |
| Pills, buttons, tags | 999px |
| Persona discs, theme switch | 50% |

Borders are `--hair` 1px. Grids of cells draw all four sides and overlap their seams (`margin:-1px 0 0 -1px` on a 1px-padded parent) so a lone cell is still a box. Plates use `outline` at `--outline`, inset 1px, not a border. Pictures that draw their own edges are shown bare, with no plate.

## Motion

Three eases, by job:

| ease | use |
| --- | --- |
| `cubic-bezier(.33,1.18,.37,1)` | arrivals with a little overshoot: the mark scaling, the pill, a hovered card lifting, the lid of the phone |
| `cubic-bezier(.2,.7,.2,1)` | layout moves: the sheet opening, the deck, the leader drawing in, the push when the hover line drops |
| `cubic-bezier(.22,1,.36,1)` | small settles |

Durations: 140 to 180ms for colour and ink changes, 300 to 500ms for lifts and swaps, 900ms for the sheet and the phone. Motion that ends is preferred to motion that loops: the hero wall arrives over 2.6s, lives for 5s, then glides to rest over about 3s and only stirs under the pointer. The marks belt is the one exception and it pauses under the pointer. `prefers-reduced-motion` removes every loop.

Cursor: the native pointer is never shown on a fine-pointer device. The bead is a 12px disc in `--ink`; over a link it scales to 2.6× at 62%; over anything with `data-cur` it pours into a 34px pill that says the line. Inside a sandbox plate only the plate's cursor exists.

## Components, in one line each

- **Nav**: fixed, mark left, pill right (links then the theme switch last); a paper band fades out below it so headlines dim into it. Home only grounds the band once past the hero.
- **Mark**: the signature SVG, oxblood on paper, paper on charcoal; hover scales to .9 and drops the three-line blurb on a pill, and the page below makes room.
- **Hero wall**: ten words in breathing cells, left-aligned, ragged right; every letter inset from its cell by the same optical gap.
- **Project list**: titles in the left column, one preview card on the right (16:9, 12px inset, cover), a dotted leader from title to card carrying the year, the filter row All · 0 → 1 · Personal projects · AI · Mobile · Web.
- **Sheet**: case studies open over the home, floating 36px off the bottom, tabs across the top, expand in place, close returns to the list.
- **Case study**: eyebrow / h2 / lede head, then rows; three or more images are a deck or a row of three, never a grid; flow strip of four equal 1920:1042 plates; personas as filled green and purple discs; results as cells; thanks block with the signature.
- **Gallery**: desk first (680×380 pad, four stocks), then the wall of 12 closed slots with your card first; the home carries a belt of the latest marks.
- **About**: the flip phone (dithered screen, keys change the photo), focus areas, years-only timeline, the shelf of things kept close (one box each, hover lifts and colours, click for the next).
