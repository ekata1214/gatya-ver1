# 07 — SSR card & video layers

[← Hex cylinder](./06-hex-cylinder.md) · [Index](./README.md) · [Next: Countdown & finale →](./08-countdown-and-finale.md)

---

## Overview

After the hex cylinder exits, the **SSR rare card** dominates the frame. It uses a **hybrid** approach:

- **DOM + CSS 3D** for position, rotation, scale, bounce
- **WebGL canvas child** for the card art + glow shader

Background layers (`fire`, `ink`, `white ssr`) are plain `<video>` or `<div>` elements.

---

## Layer: Fire (`#fire-bg`)

| Property | Value |
|----------|-------|
| File | `re fire2.mp4` |
| z-index | 0 |
| Behavior | Autoplay, muted, **loop** |
| Lifecycle | Start → darken (opacity 0 + pause) |

**Rules:**

- Never call `fireVideo.load()` during the show (causes flash/restart).
- Fire stays playing through hex, SSR drop, and countdown until blackout.

---

## Layer: SSR (`#ssr-layer`)

Structure in `cards-six.html`:

```html
<div id="ssr-layer">          <!-- perspective: 900px -->
  <video id="white-ssr" />    <!-- hidden until finale -->
  <div id="ssr-card-wrap">    <!-- GSAP 3D transform target -->
    <canvas id="ssr-card-canvas" />
  </div>
</div>
```

### Drop animation

Triggered at `ssrAt = t3 + 0.1` ≈ **1.14s** via `dropSsrCard()`.

**From pose** (`SSR_DROP.from`):

| Property | Value |
|----------|-------|
| x, y | 165, -920 (off-screen upper-right) |
| z | 110 |
| scale | 0.72 |
| rotationX/Y/Z | -3°, -8°, 12° |

**Landing pose** (`SSR_POSE`):

| Property | Value |
|----------|-------|
| x, y, z | -6, 14, -28 |
| scale | 0.94 |
| rotationX/Y/Z | -5°, -10°, 6° |

| Parameter | Value |
|-----------|-------|
| Duration | 0.5s |
| Ease | `power3.in` |
| Centering | `xPercent: -50`, `yPercent: -50` on wrap |

During drop, shader opacity animates 0→1. On complete → `startSsrBounce()`.

### Bounce

Infinite GSAP yoyo on `y`:

```javascript
y: SSR_POSE.y - 16  // 16px above rest
duration: 0.9s
ease: 'sine.inOut'
```

### WebGL child canvas

`initSsrCardRenderer()` creates a **separate** Three.js scene:

- Orthographic camera (flat card, no perspective distortion in texture)
- Same `makeCardGlowMaterial()` as hex cards with stronger `SSR_CARD_FX`

The DOM element handles **3D tilt**; the canvas draws the **flat textured quad**.

### What not to change casually

- Do not revert to `<img>` for SSR art (loses shader glow).
- Do not re-drop SSR on ink phase — only opacity/layer changes.
- Do not use CSS `drop-shadow` or pseudo-element frames (creates “sleeve” look).

---

## Layer: Ink (`#ink-test`)

| Property | Value |
|----------|-------|
| File | `ink test2.mp4` |
| z-index | 1 (above fire) |
| Blend | `mix-blend-mode: multiply` |
| Loop | false |

### Sync behavior

| Event | Action |
|-------|--------|
| Each digit 5–1 | `syncInkToDigit()` — restart video from 0, opacity 1 |
| LAST shown | Force sync once; schedule freeze after `lastInkFreeze` |
| Darken | `hideInk()` — pause + opacity 0 |

Ink is **hidden** during hex phase (`opacity: 0`). It only composites once countdown starts.

---

## Layer: White SSR (`#white-ssr`)

| Property | Value |
|----------|-------|
| File | `white ssr.mp4` |
| Location | Inside `#ssr-layer`, behind card wrap |
| Initial | opacity 0 |

On finale (after darken):

1. `playVideo(whiteSsrVideo)`
2. Fade opacity 1 in sync with SSR card shader opacity
3. `#darken` fades out to reveal white scene
4. SSR bounce continues

---

## Overlays: darken & whiteout

| Element | Color | When |
|---------|-------|------|
| `#darken` | `#000` | LAST → finale transition |
| `#whiteout` | `#fff` | End hold → full white |

Pure opacity tweens — no 3D.

---

## Layer switch: hex → countdown

`showInkLayer()` (called from `startInkPhase()`):

```javascript
cardsAnimating = false;           // stop hex render loop work
gsap.set(cardsCanvas, { opacity: 0 });
gsap.set(countdownCanvas, { opacity: 1 });
// fire + ssr stay visible
```

`showCardsLayer()` reverses this on replay.

---

## Motion blur (hex only)

Not applied to SSR. Hex canvas uses:

```javascript
gsap.set(cardsCanvas, {
  filter: motionBlur.px > 0.05 ? `blur(${motionBlur.px}px)` : 'blur(0px)',
});
```

Peaks: 9px (gather), 14px (exit).

---

## Visual stack during each phase

| Phase | fire | ink | cards canvas | SSR | countdown | darken |
|-------|------|-----|--------------|-----|-----------|--------|
| Hex | ✓ | — | ✓ | hidden | — | — |
| SSR drop | ✓ | — | ✓→fade | ✓ | — | — |
| Countdown | ✓ | ✓ multiply | hidden | ✓ bounce | ✓ | — |
| Darken | fade | hide | hidden | ✓ | hide | ✓ |
| White finale | hidden | hidden | hidden | ✓ + white video | hidden | fade out |
| Whiteout | hidden | hidden | hidden | ✓ | hidden | — |

---

## Code map

| Concern | Function | File |
|---------|----------|------|
| SSR drop | `dropSsrCard()` | `gatya-unified.mjs` |
| SSR bounce | `startSsrBounce()` | `gatya-unified.mjs` |
| SSR pose reset | `setSsrCardCenter()` | `gatya-unified.mjs` |
| Ink sync | `syncInkToDigit()`, `freezeInk()` | `gatya-unified.mjs` |
| Layer visibility | `showInkLayer()`, `showCardsLayer()` | `gatya-unified.mjs` |
| Finale chain | `onLastShown` callback | `gatya-unified.mjs` init |

---

## Tuning pointers

| Goal | Edit |
|------|------|
| SSR drop path / angle | `SSR_DROP`, `SSR_POSE` in `gatya-unified.mjs` |
| SSR glow strength | `SSR_CARD_FX` |
| Bounce height/speed | `startSsrBounce()` params |
| Ink timing vs digits | `onDigitStart` + countdown module |
| Finale fade durations | `POST_SHOW_AFTER` |

[Next: Countdown & finale →](./08-countdown-and-finale.md)
