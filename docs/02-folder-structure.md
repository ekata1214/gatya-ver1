# 02 — Folder structure

[← Overview](./01-overview.md) · [Index](./README.md) · [Next: Architecture →](./03-architecture.md)

---

## Tree (production-relevant)

```
gatya-ver1/
├── cards-six.html              ★ Main entry — DOM layers + boot script
├── serve.py                    ★ Local dev server (use this)
├── show.html / index.html      Redirect → cards-six.html
│
├── src/
│   ├── gatya-unified.mjs       ★ Show orchestrator (~1100 lines)
│   ├── ref-match-config.mjs    ★ Hex cylinder constants (ref-final-v3)
│   ├── countdown-three-overlay.mjs   Countdown 5→1→LAST (Three.js text)
│   ├── compare-panels.mjs      before/after side panel copy + SVG
│   └── se.mjs                  Sound effects (optional; disabled by default)
│
├── reference-r2.mp4              Reference (60fps source)
├── reference-r2-24fps.mp4        Reference (24fps, 1.917s — primary timing ref)
├── reference-dual-viewer.html    Sync scrubber for both refs
├── ref-calibrate.html            Overlay ref on live 3D + timeline seek
│
├── *.mp4, *.mp3, *.png          Media at repo root (cards, fire, ink, SSR)
├── scripts/fit-ref-pose.py       Offline helper for projection fit
└── .cursor/rules/                Baseline + workflow rules for contributors
```

---

## File roles

### Entry & shell

| File | Role |
|------|------|
| `cards-six.html` | Defines all layers (`#fire-bg`, canvases, SSR wrap, overlays), import map, loads modules with cache-bust `ASSET_V`, wires before/after compare UI |
| `serve.py` | Serves static files; maps `/show`, `/gatya`, `/ref` to HTML paths |

### Core logic (`src/`)

| File | Role |
|------|------|
| `gatya-unified.mjs` | `initGatyaShow()` — Three.js scenes, GSAP master timeline, SSR drop, ink phase, finale callbacks |
| `ref-match-config.mjs` | Exported `REF_MATCH`, `BEFORE_MATCH`, `REF_TOTAL` — single source for hex tuning |
| `countdown-three-overlay.mjs` | `initCountdownOverlay()` — extruded 3D digits, fire-textured materials, digit/LAST motion |
| `compare-panels.mjs` | `COMPARE_NOTE` + `mountComparePanels()` for left/right explanation panels |
| `se.mjs` | `createSE()` — mp3 playback; `SE_ENABLED` flag (currently `false`) |

### Dev / reference tools

| File | Role |
|------|------|
| `reference-dual-viewer.html` | Side-by-side ref videos, shared seek bar |
| `ref-calibrate.html` | Semi-transparent ref overlay + `seekCardsTime()` slider |
| `reference-viewer.html` | Single ref scrubber |

### Legacy (not used in production)

| Path | Notes |
|------|-------|
| `src/App.js`, `src/GachaScene.js` | Older state-machine prototype |
| `src/managers/*` | CardManager, AnimationManager, etc. for legacy scene |
| `src/core/StateMachine.js` | Legacy state transitions |
| `config/timeline.json` | Legacy JSON timeline — production uses `ref-match-config.mjs` |

No current HTML imports `App.js`. Safe to ignore unless reviving the old architecture.

### Experimental pages (not the shipped show)

| File | Purpose |
|------|---------|
| `countdown-three.html`, `countdown.html` | Countdown experiments |
| `ink-generate.html`, `ink-generate-3d.html` | Ink asset tooling |
| `countdown-ink.html` | Ink + countdown prototype |

---

## Media assets (typical)

Expected at repo root (may be gitignored locally):

| Asset | Used by |
|-------|---------|
| `re fire2.mp4` | `#fire-bg` loop |
| `ink test2.mp4` | `#ink-test` multiply overlay |
| `white ssr.mp4` | Finale white background |
| `blue/silver/rainbow/gold/green/red card.png` | Hex cylinder faces |
| `ssr card.png` | SSR card texture |
| `re fire se.mp3`, `六角筒上昇.mp3`, etc. | SE (when enabled) |

---

## Where to edit (cheat sheet)

| Change type | Start here |
|-------------|------------|
| Hex motion / camera / gather | `ref-match-config.mjs` |
| Timeline wiring, SSR, shaders, post-show | `gatya-unified.mjs` |
| Countdown digit motion | `countdown-three-overlay.mjs` |
| Compare panel text | `compare-panels.mjs` |
| Layer CSS / DOM structure | `cards-six.html` |
| Cache bust after module edits | `ASSET_V` in `cards-six.html` |

See [Tuning guide](./09-tuning-guide.md) for the full map.

[Next: Architecture →](./03-architecture.md)
