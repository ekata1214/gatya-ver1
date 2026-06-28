# 04 — Tech stack

[← Architecture](./03-architecture.md) · [Index](./README.md) · [Next: Show timeline →](./05-show-timeline.md)

---

## Summary table

| Technology | Responsibility | Key files |
|------------|----------------|-----------|
| **HTML / CSS** | Layer DOM, z-index, aspect ratio stage, `mix-blend-mode`, CSS 3D perspective for SSR | `cards-six.html` |
| **Three.js 0.170** | WebGL rendering: hex card planes, countdown extruded text, SSR card texture | `gatya-unified.mjs`, `countdown-three-overlay.mjs` |
| **GSAP 3.12** | All timing/easing: hex motion, spin, blur, DOM SSR transforms, opacity fades | `gatya-unified.mjs`, `countdown-three-overlay.mjs` |
| **Custom GLSL** | Card edge glow + metallic sheen from PNG alpha | `makeCardGlowMaterial()` |
| **HTML5 Video** | Fire loop, ink splash (once per digit), white SSR loop | DOM in `cards-six.html` |
| **Web Audio / Audio()** | SE clips (optional) | `se.mjs` |
| **Python 3** | Static file server only | `serve.py` |
| **ES Modules** | No bundler; import map for `three` CDN | `cards-six.html` |

**Not used in production:** React, Vue, npm/webpack, WebGL beyond Three.js, physics engines, Spine/Lottie.

---

## HTML & CSS

### What CSS does

- **Stage sizing** — portrait 1080/1920 inside `#stage-wrap`, accounting for side compare panels on wide screens.
- **Compositing** — absolute positioning + z-index for layer cake.
- **Ink blend** — `#ink-test { mix-blend-mode: multiply }` darkens fire where ink video is dark.
- **SSR 3D** — `#ssr-layer { perspective: 900px }` + `#ssr-card-wrap { transform-style: preserve-3d }` so GSAP `rotationX/Y/Z` work like CSS 3D.
- **Motion blur (hex only)** — `filter: blur(Npx)` on `#cards-canvas` (cheap post-effect, not GPU motion vectors).

### What CSS does *not* do

- Card yellow edge glow (that's the shader — no `box-shadow` sleeve frames).
- Hex card positions (Three.js).

---

## Three.js

### Three render contexts in one page

| Canvas | Scene contents | Camera |
|--------|----------------|--------|
| `#cards-canvas` | 6 card meshes in cylinder hierarchy | `PerspectiveCamera` (config in `ref-match-config.mjs`) |
| `#ssr-card-canvas` | Single card plane | `OrthographicCamera` (flat UI-style card) |
| `#countdown-canvas` | Extruded `TextGeometry` meshes + fire background plane | `PerspectiveCamera` |

Each has its own `WebGLRenderer` with **alpha: true** where needed so video shows through.

### Loaders & addons used

- `TextureLoader` — card PNGs
- `FontLoader` + `TTFLoader` — countdown font (Anton)
- `TextGeometry` — 3D letters for 5→1→LAST

CDN import map in `cards-six.html`:

```html
"three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js"
"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
```

---

## GSAP

GSAP is the **master clock** for the entire show.

| Use | Example |
|-----|---------|
| Hex timeline | `buildCardsTimeline()` — chained `.to()` on `anim`, `spin`, `gather`, `cardUpright` |
| Scheduled callbacks | `.add(() => dropSsrCard(), ssrAt)` |
| SSR drop | `.to(ssrCard, { x, y, z, rotationX, … })` |
| Layer fades | `.to(darkenEl, { opacity: 1 })` |
| Infinite bounce | `{ yoyo: true, repeat: -1 }` on SSR |
| Render hook | `gsap.ticker.add(cardsFrame)` |

Custom eases registered at init: `heavy`, `heavyIO`, `post` (countdown uses `heavy`).

Hex cylinder segment eases: **`power2.out`** (`CYL_EASE`) for all sub-phases in current production config.

---

## Shaders (card glow)

Cards use `ShaderMaterial`, not `MeshBasicMaterial`, to draw:

1. PNG texture with alpha discard (`texColor.a < 0.04`)
2. Edge detection on alpha channel → yellow border (`#ffdd22`)
3. Subtle metallic sheen and surface glow

Constants: `CARD_FX` (hex cards), `SSR_CARD_FX` (stronger metal on SSR).

**Rule:** no rectangular CSS frames or `::before` overlays — glow must follow PNG silhouette only.

---

## Video

| Video | Element | Behavior |
|-------|---------|----------|
| Fire | `#fire-bg` | Autoplay, muted, loop; runs until darken |
| Ink | `#ink-test` | No loop; restarted on each digit via `syncInkToDigit()`; frozen on LAST |
| White SSR | `#white-ssr` | Hidden until finale; then loop |

Videos are composited **under** WebGL canvases (except white SSR sits inside `#ssr-layer`).

---

## Sound (`se.mjs`)

| Clip | Trigger |
|------|---------|
| `re fire se.mp3` | Loop from first pointerdown |
| `六角筒上昇.mp3` | Rise start (`t3`) |
| `ssr card登場.mp3` | SSR drop start |
| `和太鼓でドン.mp3` | Each digit 5–1 |
| `LAST.mp3` | LAST shown |
| `white ssr.mp3` | White SSR fade in |

**Note:** `SE_ENABLED = false` in current code — all SE calls are no-ops until you flip this flag.

Browser autoplay policy: SE unlocks on first `pointerdown`.

---

## Python server

`serve.py` is a thin wrapper over `SimpleHTTPRequestHandler` with path aliases. It does not transform assets or inject env vars. Port default: **8878** (`PORT` env override).

---

## Mental model for web devs

```
┌─────────────────────────────────────────┐
│  GSAP timelines (time → numbers)        │
├─────────────────────────────────────────┤
│  applyState / DOM transforms            │
├─────────────────────────────────────────┤
│  Three.js render (meshes → pixels)      │
├─────────────────────────────────────────┤
│  Video + CSS layers (background FX)     │
└─────────────────────────────────────────┘
```

You usually edit **numbers in config** or **GSAP durations**, not the render loop itself.

[Next: Show timeline →](./05-show-timeline.md)
