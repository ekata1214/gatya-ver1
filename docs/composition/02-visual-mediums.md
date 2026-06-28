# Visual mediums (drawers)

[← Overview](./01-overview.md) · [Index](./README.md) · [Next: Timeline & drawers →](./03-timeline-and-drawers.md)

---

## Five medium types in this show

| Medium | DOM element(s) | Drawer | Typical driver |
|--------|----------------|--------|----------------|
| **A. Video** | `<video>` | Browser video decoder | `play()`, `currentTime`, `opacity` |
| **B. WebGL canvas** | `<canvas>` + Three.js | `WebGLRenderer.render()` | GSAP → state → apply → render |
| **C. DOM 3D** | `<div>` + CSS `perspective` | Browser layout/compositor | GSAP transforms |
| **D. CSS overlay** | `<div>` solid fill | CSS `background` + `opacity` | GSAP opacity |
| **E. CSS filter** | filter on canvas | GPU filter on canvas bitmap | GSAP `filter` (hex blur only) |

Every visible pixel in `#stage` comes from one of these.

---

## A. Video medium

### Layers using video

| ID | Asset | z-index | Notes |
|----|-------|---------|-------|
| `#fire-bg` | `re fire2.mp4` | 0 | Looped until darken |
| `#ink-test` | `ink test2.mp4` | 1 | `mix-blend-mode: multiply`; one-shot per digit |
| `#white-ssr` | `white ssr.mp4` | inside `#ssr-layer` | Hidden until finale |

### How animation works

Video is **self-animating**: each frame is the next decoded video frame.

Code **does not** tween pixel data. It:

- starts/stops playback
- seeks to `0` on ink sync
- pauses on freeze (LAST)
- tweens **opacity** for handoff to finale

### What you edit

| Goal | Edit |
|------|------|
| Look of fire/ink/white | Replace `.mp4` asset |
| When ink plays | `syncInkToDigit()`, `onDigitStart` callbacks |
| Ink blend strength | CSS `mix-blend-mode`, opacity |
| Fire visibility | `gsap.set(fireVideo, { opacity })` in finale chain |

---

## B. WebGL canvas medium (Three.js)

### Three separate canvases

| Canvas | Scene | Camera | Active phases |
|--------|-------|--------|---------------|
| `#cards-canvas` | Hex cylinder, 6 `PlaneGeometry` meshes | Perspective | B (hex) |
| `#countdown-canvas` | `TextGeometry` digits + LAST | Perspective | D (countdown) |
| `#ssr-card-canvas` | Single card plane | Orthographic | C onward (while SSR visible) |

### How animation works

```
GSAP updates values each tick
    → copy into Three.js (position, rotation, uniforms)
    → renderer.render(scene, camera)
    → transparent pixels show layers below
```

Hex-specific path:

```javascript
gsap.ticker.add(cardsFrame);  // only while cardsAnimating
```

Countdown: own render loop inside `countdown-three-overlay.mjs`.

SSR canvas: `requestAnimationFrame(animateSsrCard)` — continuous redraw; **pose** comes from parent DOM.

### Sub-layers inside a WebGL canvas (hex example)

Within **one** `#cards-canvas` frame, the 3D scene has its own hierarchy (not DOM z-index):

```
Scene
└── cylinder
    └── cylinderTilt
        └── cylinderSpin
            └── card × 6
                └── face (Mesh + ShaderMaterial)
```

**“Layers” inside WebGL** = scene graph depth + `renderOrder` (gold card on top).

### Shader sub-medium (inside WebGL)

Card faces use **custom GLSL** (`makeCardGlowMaterial`):

- Input: PNG texture
- Output: colored pixels + yellow edge glow

Changing **motion** = GSAP. Changing **glow/metal** = shader uniforms / GLSL.

### What you edit

| Goal | Edit |
|------|------|
| Hex motion | GSAP timeline + `ref-match-config.mjs` |
| Hex camera | `CAMERA` in config |
| Card edge look | `CARD_FX`, shader in `gatya-unified.mjs` |
| Countdown motion | `DIGIT_ANIM`, `countdown-three-overlay.mjs` |
| SSR card art look | `SSR_CARD_FX`, `ssr card.png` |

---

## C. DOM 3D medium

### Layer structure

```html
<div id="ssr-layer">           <!-- perspective: 900px -->
  <video id="white-ssr" />       <!-- z:0 inside layer -->
  <div id="ssr-card-wrap">       <!-- z:1, GSAP transform target -->
    <canvas id="ssr-card-canvas" />
  </div>
</div>
```

`#ssr-layer` is at **z-index 90** on the stage (above hex canvas, below countdown).

### How animation works

GSAP tweens **CSS 3D transforms** on `#ssr-card-wrap`:

- `x`, `y`, `z`, `scale`
- `rotationX`, `rotationY`, `rotationZ`
- `xPercent: -50`, `yPercent: -50` for center anchor

The child canvas **fills** the div; it does not define drop trajectory.

### What you edit

| Goal | Edit |
|------|------|
| Drop path / landing pose | `SSR_DROP`, `SSR_POSE` |
| Bounce | `startSsrBounce()` |
| Perspective feel | `#ssr-layer` CSS `perspective` |
| Card size on screen | `#ssr-card-wrap` width in CSS |

---

## D. CSS overlay medium

| ID | Color | z-index |
|----|-------|---------|
| `#darken` | `#000` | 150 |
| `#whiteout` | `#fff` | 250 |

Full-screen `position: absolute; inset: 0`. Animation = **opacity only**.

Sits **above** countdown canvas so it can hide everything below when opaque.

### What you edit

| Goal | Edit |
|------|------|
| Blackout duration | `POST_SHOW_AFTER.darkenDur` |
| White flash duration | `POST_SHOW_AFTER.whiteoutDur` |
| Easing | `POST` custom ease in finale timeline |

---

## E. CSS filter (hex motion blur)

Applied to **`#cards-canvas`** element (not inside WebGL):

```javascript
filter: blur(${motionBlur.px}px)
```

GSAP tweens `motionBlur.px` during gather and exit. This blurs the **entire canvas bitmap** (cards + transparency).

### What you edit

| Goal | Edit |
|------|------|
| Blur strength | `CYL_BLUR.gatherPeak`, `exitPeak` in config |

---

## Medium comparison table

| | Video | WebGL | DOM 3D | CSS overlay | CSS filter |
|---|-------|-------|--------|-------------|------------|
| **Moves by** | timecode | GSAP→3D state | GSAP transforms | opacity | blur radius |
| **Redrawn by** | decoder | Three.js | browser | browser | GPU on canvas |
| **Transparent?** | no (opaque rect) | yes (alpha) | wrap is box; canvas alpha | no | N/A |
| **In this show** | backgrounds FX | cards + countdown | SSR motion | fade transitions | hex speed feel |

---

## Which medium should you learn for X?

| You want to change… | Medium |
|---------------------|--------|
| Fire atmosphere | Video (A) |
| Hex position/spin | WebGL (B) + GSAP |
| Card yellow border | WebGL shader (B) |
| SSR drop angle | DOM 3D (C) |
| Screen goes black | CSS overlay (D) |
| Streak blur on gather | CSS filter (E) |
| Countdown digit spin | WebGL (B) + GSAP |

[Next: Timeline & drawers →](./03-timeline-and-drawers.md)
