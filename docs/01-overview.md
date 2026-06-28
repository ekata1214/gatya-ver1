# 01 — Overview

[← Index](./README.md) · [Next: Folder structure →](./02-folder-structure.md)

---

## What this project is

**Gatya** is a small interactive HTML demo of an online **gacha** (loot-box) reveal, styled after a premium “SSR” pull:

1. Fire background
2. Six trading cards fly in and form a hexagonal “cup”
3. The cup rises, verticalizes, and disappears
4. A rare SSR card drops and bounces
5. Ink splashes sync with a 5→1 countdown
6. **LAST** → screen darkens → white SSR reveal → whiteout

There is no backend, no React, and no bundler. It is a **static prototype** meant for visual iteration against reference videos (`reference-r2.mp4`, `reference-r2-24fps.mp4`).

---

## Production entry point

```
cards-six.html  →  src/gatya-unified.mjs
```

Aliases via `serve.py`:

| URL | Same as |
|-----|---------|
| http://localhost:8878/show | `cards-six.html` |
| http://localhost:8878/ | redirects to cards-six |

`ink-sumi.html`, `show.html`, and `index.html` only redirect — **the show never uses page navigation** to connect phases.

---

## Core design rules (do not break)

1. **One page, one DOM** — fire video, SSR card, and audio continuity survive the whole show.
2. **Layer switch, not reload** — at ~5.5s equivalent, `startInkPhase()` hides the cards canvas and shows the countdown canvas. No `location.href`.
3. **Fire until darken** — `#fire-bg` loops until the blackout phase; then it pauses (do not call `fireVideo.load()` mid-show).
4. **SSR does not re-drop** — after the initial drop, only opacity/layer changes through ink and finale.

---

## Who this doc series is for

- Web developers comfortable with HTML, CSS, and JavaScript
- Contributors tuning **timing**, **composition**, or **motion** without deep Three.js experience
- Reviewers who need a map before reading ~1,100 lines of `gatya-unified.mjs`

---

## Suggested first session (~30 min)

1. Run the show once end-to-end (`/show`).
2. Open [Dev tools — reference viewer](./10-dev-tools.md) at `/ref` and scrub to **0.37s** (hex formed) and **1.04s** (pre-rise).
3. Skim [Show timeline](./05-show-timeline.md).
4. Open [`src/ref-match-config.mjs`](../src/ref-match-config.mjs) — all hex cylinder numbers live here.
5. Read [Hex cylinder](./06-hex-cylinder.md) when you need to change gather/rise motion.

---

## What you will *not* find here

- Game logic, pull rates, or inventory — this is **presentation only**
- A npm/build pipeline — dependencies load from CDN (Three.js, GSAP)
- Automated tests — validation is visual against reference video

[Next: Folder structure →](./02-folder-structure.md)
