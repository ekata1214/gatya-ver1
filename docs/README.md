# Gatya Show — Engineering Documentation

Documentation for engineers helping tune the **SSR gacha show**: 3D card animation, composition, timing, and visual polish.

Read **top to bottom** — each chapter adds detail without assuming prior 3D experience.

---

## Reading order

| # | Document | What you'll learn |
|---|----------|-------------------|
| 1 | [Overview](./01-overview.md) | What the app is, how to run it, production entry point |
| 2 | [Folder structure](./02-folder-structure.md) | Which files matter vs legacy/experimental |
| 3 | [Architecture](./03-architecture.md) | Single-page design, layer stack, data flow |
| 4 | [Tech stack](./04-tech-stack.md) | Three.js, GSAP, video, shaders — who owns what |
| 5 | [Show timeline](./05-show-timeline.md) | Full sequence from fire → whiteout with timings |
| 6 | [Hex cylinder](./06-hex-cylinder.md) | Six-card 3D animation — structure, phases, tuning |
| 7 | [SSR & video layers](./07-ssr-and-video-layers.md) | SSR drop, fire/ink/white video, DOM compositing |
| 8 | [Countdown & finale](./08-countdown-and-finale.md) | 5→1→LAST text, darken, white SSR reveal |
| 9 | [Tuning guide](./09-tuning-guide.md) | “I want to change X” → file + constant map |
| 10 | [Dev tools](./10-dev-tools.md) | Reference viewers, calibration, compare UI |
| 11 | [Three.js primer](./11-threejs-for-web-devs.md) | Concepts used in this repo (minimal 3D background) |
| 12 | [Legacy & gotchas](./12-legacy-and-gotchas.md) | Old code to ignore, common pitfalls |

### Composition (visual structure)

| Doc | What you'll learn |
|-----|-------------------|
| [Composition index](./composition/README.md) | Layers, mediums, frame stack, what to edit per element |
| [画面構成（日本語）](./composition-jp/README.md) | 同上 — 日本語版 |

---

## Quick start

```bash
cd /path/to/gatya-ver1
python3 serve.py
```

Open **http://localhost:8878/show** (alias for `cards-six.html`).

- Do **not** open via `file://` — ES modules will fail.
- Use **`serve.py`**, not bare `python -m http.server` (URL aliases break).
- After code changes: **Cmd+Shift+R** and bump `ASSET_V` in `cards-six.html` if modules are cached.

---

## Authoritative sources in repo

These docs explain *how* to work on the show. For *frozen* animation specs (do-not-regress rules), also read:

- [`README.md`](../README.md) — project README (Japanese, maintainer-facing)
- [`.cursor/rules/gatya-show-baseline.mdc`](../.cursor/rules/gatya-show-baseline.mdc) — baseline hex/SSR/shader specs
- [`.cursor/rules/gatya-compare-workflow.mdc`](../.cursor/rules/gatya-compare-workflow.mdc) — workflow when making changes

**Production constants:** [`src/ref-match-config.mjs`](../src/ref-match-config.mjs) (`ref-final-v3`).

---

## One-line summary

> A single HTML page layers looping fire video, WebGL card animation (Three.js + GSAP), DOM 3D SSR card, ink video, 3D countdown text, and fade overlays — with **no page navigation** and **no build step**.
