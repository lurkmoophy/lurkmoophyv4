# Riso print header — CodePen version

Standalone version of the risograph header from lurkmoophy.com, extracted for
CodePen.

## How to use

1. Upload `riso-background.png`, `clouds-back.png`, and `clouds-front.png`
   as CodePen Assets.
2. New Pen.
3. Paste `index.html` into the **HTML** panel.
4. Paste `style.css` into the **CSS** panel.
5. Replace the three `url('...png')` values in the CSS with your CodePen
   asset URLs (search for `.png` — one mask in `.riso`, two backgrounds in
   the cloud layers).
6. That's it — no JS panel needed.

## How the effect works

Four tricks stacked together:

1. **The grain mask.** `.riso` applies a repeating, tiled `mask-image` — a PNG
   of risograph grain where the "ink" is opaque and the paper shows through
   the holes. Any element with the class gets punched full of tiny holes.

2. **Blend modes as ink.** Each masked layer blends into what's below it —
   `multiply` for the sky, `overlay` for the clouds, `plus-darker` for the
   headline — so overlapping layers mix and darken like translucent riso ink
   instead of stacking opaquely.

3. **The goo filter.** The masked grain has hard square pixel edges. The SVG
   `#round-corners` filter (Gaussian blur, then an `feColorMatrix` that
   crushes the alpha contrast, composited back) melts them into soft round
   dots, like ink spreading into paper. It's the classic "gooey effect"
   filter applied to texture instead of blobs.

4. **Misregistration.** The headline's coral ink sits on an inner
   `<span class="riso">`. The `h1::before` draws a second, *unmasked* solid
   white copy of the same text nudged 3px left. Where it peeks out from under
   the coral grain it reads as a second print pass that didn't quite line up.

The paper itself is just an off-white gradient panel rotated `0.5deg` so the
whole print sits slightly askew.

## On the real site

The live version references the full-res images from `/public/images` instead
of data URIs, and the `.riso` styles live inline in `src/pages/index.astro`.
The scroll-driven unicorn sprite isn't part of the riso effect, so it's not
included here.
