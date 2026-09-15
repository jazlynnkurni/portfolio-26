# Revamp

The 2026 redesign of jazlynnwashere.com, as a static prototype. Not the live site and not
wired into the Next.js app: these are plain files, served with

    cd prototypes/revamp && python3 -m http.server 5330

`index.html` is hand-edited and is the source of truth. `build.py` generates the pages that
share a chassis — `about.html`, `404.html` and everything in `work/` — so edit `build.py`
for those, never the generated file, and re-run it.

`images` and `videos` are symlinks to the app's own `public/`, so the prototype uses the
real project media rather than a second copy of it.

## What is in it

- The hero: a letter grid where each cell's width breathes on its own phase, sitting at the
  golden section of the viewport.
- The sheets: translucent discs scattered middle-to-right, draggable, under the type.
  Pigment that multiplies on the paper ground, light that adds on the charcoal one.
- Projects: filter chips, titles as the page, and the real case-study clips on hover.
- Light and dark, with the interaction colour swapping because oxblood is 12:1 on paper and
  invisible on charcoal.

## The rule

This stays a prototype. The live site is `main`, and nothing here reaches it until the
revamp is deliberately shipped.
