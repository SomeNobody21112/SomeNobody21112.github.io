# SomeNobody21112.github.io

My personal portfolio → **https://SomeNobody21112.github.io**

Static site, no build step. Plain HTML/CSS/JS with [GSAP](https://gsap.com/) (loaded from CDN) for the scroll animations, custom cursor, magnetic buttons and count-ups. Degrades gracefully: with JS off or reduced-motion on, everything is still visible and readable.

```
index.html      markup + content
css/styles.css  design system (red / black / white, single dark theme)
js/main.js      GSAP interactions, progressive enhancement
```

## Run locally

Any static server works, e.g.:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Deploy

GitHub Pages serves `main` at the repo root. Push to `main` and it's live.
