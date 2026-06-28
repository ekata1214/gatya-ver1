# 08 — Countdown & finale

[← SSR & video layers](./07-ssr-and-video-layers.md) · [Index](./README.md) · [Next: Tuning guide →](./09-tuning-guide.md)

---

## Countdown module

**File:** `src/countdown-three-overlay.mjs`  
**Entry:** `initCountdownOverlay(options)`  
**Canvas:** `#countdown-canvas` (z-index 100)

The countdown renders **extruded 3D text** (5, 4, 3, 2, 1, LAST) in a dedicated Three.js scene with chrome/fire-inspired materials.

---

## Boot & dependencies

On init, the module:

1. Creates renderer, scene, perspective camera on `#countdown-canvas`
2. Loads font (tries local Anton TTF → CDN fallbacks → Helvetiker)
3. Builds text meshes via `TextGeometry`
4. Sets up fire video texture sampling for digit materials
5. Exposes `{ play, reset }` to `gatya-unified.mjs`

Countdown does **not** autoplay in production — `autoplay: false`; main show calls `countdownCtrl.play()` after `POST_SHOW_AFTER.countdownDelay`.

---

## Timing structure

```javascript
const TOTAL = 6;           // seconds for full 5→LAST sequence
const STEP = TOTAL / 6;    // 1.0s per slot

const T = {
  appear: 0.42,
  hold: 0.4,
  exit: 0.2,
};
```

| Slot | Start offset | Content |
|------|--------------|---------|
| 0 | 0s | Digit **5** |
| 1 | 1s | Digit **4** |
| 2 | 2s | Digit **3** |
| 3 | 3s | Digit **2** |
| 4 | 4s | Digit **1** |
| 5 | 5s | **LAST** |

Digits 5–1: enter → hold tilt → scale out + fade.  
**LAST:** enter → hold — **no exit** (stays until darken hides canvas).

---

## Per-digit animation

Each digit uses config in `DIGIT_ANIM`:

```javascript
'5': {
  entry: { x, y, z },   // starting rotation (radians)
  rest:  { x, y, z },   // mid appear pose
  show:  { x, y, z },   // hold pose
},
// … unique per digit
```

Animation steps (`addDigitAnim`):

1. **Appear** — scale from 0.35, rotate from `entry`, move from below (`y: -0.32`)
2. **Hold** — subtle tilt to `show` rotation
3. **Exit** — scale to 0, fade opacity

Easing: Custom `heavy` ease (defined via `CustomEase.create`).

---

## LAST animation

`LAST` is four separate meshes (`L`, `A`, `S`, `T`) in a `Group`:

- Each letter has `LAST_LETTER_ANIM[i]` with `start`, `home`, `entry` positions/rotations
- Group scales in like digits
- On show callback: fires `onLastShown()` once (guarded by `lastShownFired`)

**Important:** LAST does not scale/fade out — it remains visible through ink freeze until `#countdown-canvas` opacity goes 0 at darken.

---

## Fire-textured materials

Digits sample the **live fire video** as a texture (uniform zoom via `NUMBER_FIRE_TUNING`).

LAST letters use per-char tuning `FIRE_CHAR_TUNING` (scale, focal point).

This creates the “chrome on fire” look without separate video assets per digit.

---

## Callbacks into main show

Configured in `gatya-unified.mjs` during `initCountdownOverlay()`:

### `onDigitStart(char)`

| char | Action |
|------|--------|
| `'5'`…`'1'` | `syncInkToDigit()` + taiko SE |
| `'LAST'` | `se.play('last')` |

### `onLastShown()`

Runs once when LAST appears:

1. Lock ink (`lastInkLocked = true`)
2. Force final ink sync; schedule `freezeInk()` after `lastInkFreeze` (0.5s)
3. After `lastToDarken` (1.0s), start finale GSAP timeline:

```
fadeOutFire (2s)
  ∥ darkenEl opacity 0→1 (2s)
  → hide countdown canvas + ink + fire video
  → play whiteSsrVideo, fade in SSR card shader
  → darkenEl opacity 1→0 (white reveal 0.45s)
  → hold 2s
  → whiteoutEl opacity 0→1 (0.9s)
```

### `onReplay`

Resets fire intro session key; calls `playShow()`.

---

## Finale constants (`POST_SHOW_AFTER`)

From `gatya-unified.mjs`:

| Key | Value | Role |
|-----|-------|------|
| `countdownDelay` | 1.1s | Delay after ink phase before `play()` |
| `lastInkFreeze` | 0.5s | Ink pause after LAST |
| `lastToDarken` | 1.0s | Wait before blackout |
| `darkenDur` | 2.0s | Black overlay fade in |
| `fireFadeOut` | 2.0s | Fire SE fade |
| `whiteRevealDur` | 0.45s | White SSR + card reveal |
| `finaleHold` | 2.0s | Pause on white scene |
| `whiteoutDur` | 0.9s | Final white flash |

---

## Font candidates

Loaded in order until one succeeds:

1. `./assets/fonts/Anton-Regular.ttf`
2. Anton from Google Fonts CDN
3. `./assets/fonts/BebasNeue-Regular.ttf`
4. Helvetiker Bold (Three.js examples JSON)

If countdown shows missing text, check font paths and network.

---

## Replay flow

`#replay` button → `playShow()`:

1. Kill all active tweens (SSR, layers, master TL)
2. `resetInkPhase()` — ink locked false, opacities reset
3. `resetCardsShow()` — hex hidden
4. `showCardsLayer()` — cards canvas back on
5. SSR hidden at center pose; fire restarted if paused
6. `buildCardsTimeline()` from t=0

---

## Code map

| Concern | Location |
|---------|----------|
| Digit mesh creation | `makeTextMesh`, `makeLastGroup` |
| Master countdown TL | `play()` |
| Digit step | `addDigitAnim()` |
| LAST step | `addLastAnim()` |
| Finale scheduling | `onLastShown` in `gatya-unified.mjs` |
| Ink layer arm | `startInkPhase()` |

---

## Tuning pointers

| Goal | Edit |
|------|------|
| Digit entry angles | `DIGIT_ANIM` in `countdown-three-overlay.mjs` |
| LAST letter paths | `LAST_LETTER_ANIM` |
| Step duration / pacing | `TOTAL`, `T.appear/hold/exit` |
| Fire reflection on numbers | `NUMBER_FIRE_TUNING`, `FIRE_CHAR_TUNING` |
| Delay before countdown | `POST_SHOW_AFTER.countdownDelay` |
| Blackout / whiteout timing | `POST_SHOW_AFTER.*` in `gatya-unified.mjs` |

[Next: Tuning guide →](./09-tuning-guide.md)
