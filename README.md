# SomeNobody21112.github.io

My personal portfolio → **https://somenobody21112.github.io**

A monochrome, near-black, film-grain site in the editorial style of the sites I love
(giordanobetti.com, orizon.one): a loading screen that opens on my portrait, a serif
display face (Fraunces), Lenis smooth scroll, GSAP scroll reveals, a custom VIEW cursor,
and a big-type work list. Strictly single-theme (dark); light is the only accent.

## Structure

```
index.html        markup + content
css/styles.css    design system — Fraunces / Inter Tight / JetBrains Mono, monochrome tokens
js/main.js        loader sequence, Lenis, GSAP reveals, count-ups, cursor (progressive enhancement)
assets/
  hero.jpg        landscape portrait (grayscale, optimised)
  portrait.jpg    cropped portrait (loader + about)
  portrait.txt    ASCII text-art of the portrait (used on the GitHub profile)
scripts/check.mjs build check — asserts local assets resolve, no red survived, libs pinned
```

Libraries load from CDN, pinned: [GSAP 3.12.5](https://cdnjs.com/libraries/gsap) +
ScrollTrigger (cdnjs), [Lenis 1.1.14](https://www.npmjs.com/package/lenis) (jsDelivr).

## Progressive enhancement

Nothing depends on JS to be readable. The loader and the image clip-reveals are gated behind
`html.js`; with JS disabled or `prefers-reduced-motion`, every section and image is shown at
rest and the loader never appears.

## Develop

```bash
python -m http.server 8000   # serve, then open http://localhost:8000
node scripts/check.mjs        # run the build check
```

Regenerate the optimised image + ASCII art from a source photo:

```bash
python scripts/assets.py <source.jpg> assets
```

## Deploy

GitHub Pages serves `main` at the repo root (`.nojekyll` keeps `js/` intact). Push to deploy.
