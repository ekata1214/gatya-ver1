# Modification map — what to touch for each element

[← Layer stack by phase](./04-layer-stack-by-phase.md) · [Index](./README.md)

---

## How to use this doc

1. Find the **element** you want to change (left column).
2. Note **which phases** it appears in.
3. Use **medium** + **files** columns to know where to work.
4. Cross-check [tuning guide](../09-tuning-guide.md) for constant names.

---

## By visual element

### Fire background

| | |
|--|--|
| **Phases** | A → E2 (hidden E3+) |
| **Medium** | Video A (`#fire-bg`) |
| **Motion driver** | native loop (no GSAP position) |
| **Files** | `cards-six.html` (source), finale chain in `gatya-unified.mjs` |
| **Change look** | Replace `re fire2.mp4` |
| **Change when it stops** | `onLastShown` finale TL — `fireVideo.pause()`, opacity |
| **Do not** | `fireVideo.load()` mid-show |

---

### Hex cylinder (six cards)

| | |
|--|--|
| **Phases** | B only (canvas hidden D+) |
| **Medium** | WebGL B (`#cards-canvas`) |
| **Motion driver** | GSAP `buildCardsTimeline()` → `anim`, `spin`, `gather`, `cardUpright` |
| **Files** | `ref-match-config.mjs` (numbers), `gatya-unified.mjs` (timeline, gather math, shader) |
| **Change timing** | `T.*`, `CARD_INTRO_DELAY` |
| **Change position/path** | `FORM`, `RISE`, `GATHER_DIAG` |
| **Change camera** | `CAMERA` |
| **Change card border glow** | `CARD_FX`, `makeCardGlowMaterial()` |
| **Change streak blur** | `CYL_BLUR` + `applyCardsMotionBlur()` |

---

### SSR card (drop + bounce + finale)

| | |
|--|--|
| **Phases** | C → end |
| **Medium** | DOM 3D C (`#ssr-card-wrap`) + WebGL B child (`#ssr-card-canvas`) |
| **Motion driver** | GSAP `dropSsrCard()`, `startSsrBounce()` |
| **Files** | `gatya-unified.mjs` (`SSR_DROP`, `SSR_POSE`), `cards-six.html` (CSS size/perspective) |
| **Change drop/land** | `SSR_DROP`, `SSR_POSE`, `SSR_DROP_DUR` |
| **Change when drop starts** | `SSR_CROSS_RISE_OFFSET`, hex `t3` |
| **Change bounce** | `startSsrBounce()` |
| **Change card art/glow** | `ssr card.png`, `SSR_CARD_FX` |
| **Do not** | Re-trigger drop on ink phase |

---

### Ink splashes

| | |
|--|--|
| **Phases** | D per digit → freeze E2 |
| **Medium** | Video A (`#ink-test`) + CSS multiply |
| **Motion driver** | `syncInkToDigit()` on `onDigitStart` |
| **Files** | `gatya-unified.mjs`, `cards-six.html` (blend mode) |
| **Change look** | Replace `ink test2.mp4` |
| **Change sync** | `onDigitStart`, `syncInkToDigit`, countdown timing |
| **Change blend** | `#ink-test { mix-blend-mode }` |

---

### Countdown digits (5→1)

| | |
|--|--|
| **Phases** | D (until each digit exits) |
| **Medium** | WebGL B (`#countdown-canvas`) |
| **Motion driver** | GSAP in `addDigitAnim()` |
| **Files** | `countdown-three-overlay.mjs` |
| **Change motion** | `DIGIT_ANIM`, `T.appear/hold/exit` |
| **Change pacing** | `TOTAL`, `STEP`, `POST_SHOW_AFTER.countdownDelay` |
| **Change fire reflection** | `NUMBER_FIRE_TUNING`, fire video setup in countdown module |

---

### LAST text

| | |
|--|--|
| **Phases** | D late → hidden E3 |
| **Medium** | WebGL B (same canvas as digits) |
| **Motion driver** | GSAP `addLastAnim()` — **no exit** |
| **Files** | `countdown-three-overlay.mjs`, finale timing in `gatya-unified.mjs` |
| **Change letter motion** | `LAST_LETTER_ANIM`, `LAST_GROUP_REST/SHOW` |
| **Change hold duration** | `lastToDarken`, `lastInkFreeze` in `POST_SHOW_AFTER` |

---

### White SSR background (finale)

| | |
|--|--|
| **Phases** | E3 → E4 |
| **Medium** | Video A (`#white-ssr` inside `#ssr-layer`) |
| **Motion driver** | GSAP opacity + `playVideo()` in finale TL |
| **Files** | `gatya-unified.mjs` (`onLastShown`), `cards-six.html` |
| **Change look** | Replace `white ssr.mp4` |
| **Change fade timing** | `whiteRevealDur`, `finaleHold` |

---

### Darken / whiteout

| | |
|--|--|
| **Phases** | E2 – E5 |
| **Medium** | CSS D (`#darken`, `#whiteout`) |
| **Motion driver** | GSAP finale timeline |
| **Files** | `gatya-unified.mjs` (`POST_SHOW_AFTER`) |
| **Change timing** | `darkenDur`, `whiteoutDur`, `lastToDarken` |

---

## By composition dimension

| Dimension | You want to… | Go to |
|-----------|--------------|-------|
| **Timeline** | Shift when SSR appears | `buildCardsTimeline()` `ssrAt`, `inkAt` |
| **Timeline** | Shift countdown start | `POST_SHOW_AFTER.countdownDelay` |
| **Layer visibility** | What’s on during countdown | `showInkLayer()`, `showCardsLayer()` |
| **Medium** | Replace background FX | video assets + HTML `<source>` |
| **Medium** | New 3D object in hex | `gatya-unified.mjs` scene graph + timeline |
| **Stack order** | Put SSR behind hex | **Avoid** — z-index 90 > 5 is intentional |
| **Drawer** | Card glow not motion | GLSL / `CARD_FX` |

---

## By show phase (what file bundle to open)

| Phase | Open these |
|-------|------------|
| Fire intro | `cards-six.html`, video asset |
| Hex motion | `ref-match-config.mjs`, `gatya-unified.mjs` → `buildCardsTimeline` |
| Hex vs ref | `ref-calibrate.html`, `/ref` viewer |
| SSR | `gatya-unified.mjs` → `SSR_*`, `dropSsrCard` |
| Ink + layer switch | `gatya-unified.mjs` → `startInkPhase`, `showInkLayer` |
| Countdown | `countdown-three-overlay.mjs` |
| Finale | `gatya-unified.mjs` → `onLastShown`, `POST_SHOW_AFTER` |
| Compare story | `compare-panels.mjs` |

---

## Decision tree

```
What are you changing?
│
├─ Background atmosphere (fire, ink, white)
│   └─ Video file + opacity/play timing in gatya-unified.mjs
│
├─ Six-card hex motion or layout
│   └─ ref-match-config.mjs, then buildCardsTimeline / applyCardHexGather
│
├─ SSR card movement
│   └─ SSR_DROP / SSR_POSE (DOM GSAP) — not Three.js scene
│
├─ Card yellow edge / metal
│   └─ CARD_FX / SSR_CARD_FX + shader (both hex and SSR)
│
├─ Countdown numbers
│   └─ countdown-three-overlay.mjs
│
├─ Screen fade to black / white
│   └─ POST_SHOW_AFTER + finale GSAP in onLastShown
│
└─ When something happens (not how it looks)
    └─ buildCardsTimeline offsets + POST_SHOW_AFTER + countdown TOTAL/STEP
```

---

## Checklist after composition changes

- [ ] Full play `/show` from replay
- [ ] Hex still hidden after ink (no double canvas)
- [ ] SSR does not drop twice
- [ ] Fire does not flash on transition
- [ ] LAST visible until darken
- [ ] Bump `ASSET_V` in `cards-six.html`

---

[Back to composition index](./README.md) · [Main docs index](../README.md)
