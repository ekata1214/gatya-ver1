# Timeline & what draws each phase

[← Visual mediums](./02-visual-mediums.md) · [Index](./README.md) · [Next: Layer stack by phase →](./04-layer-stack-by-phase.md)

---

## Master clocks

The show is not one monolithic GSAP timeline end-to-end. It uses:

| Clock | Scope | File |
|-------|-------|------|
| **Hex master TL** | Fire intro → hex → schedules SSR + ink | `buildCardsTimeline()` |
| **Countdown TL** | 5→1→LAST | `countdown-three-overlay.mjs` → `play()` |
| **Finale TL** | Darken → white SSR → whiteout | `onLastShown` callback |
| **SSR bounce** | Infinite yoyo | `startSsrBounce()` |
| **Video clocks** | Fire loop, ink restarts | native `<video>` |

All are started from `playShow()` (replay button or initial load).

---

## Phase table (production `after` mode)

Times are approximate from `t = 0` at `playShow()`. See [show timeline](../05-show-timeline.md) for constants.

| Phase | Time (s) | Trigger | What moves | Medium | Source file |
|-------|----------|---------|------------|--------|-------------|
| **A0** Fire only | 0 – 0.15 | timeline start | video frames | Video A | `cards-six.html` |
| **B1** Hex slide | 0.15 – 0.37 | `gather.t` 1→0 | cylinder + 6 cards | WebGL B | `gatya-unified.mjs` |
| **B2** Hex stand | 0.37 – 0.49 | `t1` | cylinder tilt | WebGL B | same |
| **B3** Hex hold | 0.49 – 1.04 | `t2` | drift, scale, upright | WebGL B | same |
| **B4** Hex rise | 1.04 – 1.42 | `t3` | verticalize, rise path | WebGL B | same |
| **B5** Hex exit | 1.42 – 1.92 | `t4` | exit path, fade | WebGL B | same |
| **C1** SSR drop | ~1.14 – ~1.64 | `dropSsrCard()` | wrap transform | DOM 3D C + WebGL B child | `gatya-unified.mjs` |
| **C2** SSR bounce | ~1.64+ | `startSsrBounce()` | y oscillation | DOM 3D C | same |
| **D0** Layer switch | ~1.76 | `startInkPhase()` | canvas opacity | DOM/CSS | `showInkLayer()` |
| **D1** Countdown | ~2.86+ | `countdownCtrl.play()` | text meshes | WebGL B | `countdown-three-overlay.mjs` |
| **D2** Ink per digit | each digit | `onDigitStart` | ink video restart | Video A | `syncInkToDigit()` |
| **E1** LAST hold | digit 5 slot | `onLastShown` | LAST stays | WebGL B | countdown module |
| **E2** Ink freeze | +0.5s after LAST | `freezeInk()` | pause video | Video A | `gatya-unified.mjs` |
| **E3** Darken | +1.0s after LAST | finale TL | `#darken` opacity | CSS D | `onLastShown` |
| **E4** White reveal | after darken peak | finale TL | white video + SSR | Video A + DOM + WebGL | same |
| **E5** Whiteout | +2.0s hold | finale TL | `#whiteout` opacity | CSS D | same |

**Overlap note:** C1 (SSR) starts during B4 (hex rise). D0 hides hex canvas while SSR keeps going.

---

## Per-phase: driver → drawer chain

### Phase A–B — Hex

```
GSAP buildCardsTimeline()
  → tweens anim, spin, gather, cardUpright, motionBlur
  → applyState() + applyCardHexGather()
  → cardsFrame() on gsap.ticker
  → Three.js render #cards-canvas
```

Fire video runs **independently** underneath (no GSAP on fire position).

### Phase C — SSR

```
GSAP dropSsrCard() + startSsrBounce()
  → tweens #ssr-card-wrap (DOM 3D)
  → setSsrCardShaderOpacity (uniform)
  → animateSsrCard() rAF loop
  → Three.js render #ssr-card-canvas
```

Hex may still render **under** SSR until phase D0.

### Phase D — Countdown + ink

```
startInkPhase()
  → cardsCanvas opacity 0, countdownCanvas opacity 1

GSAP countdown masterTL
  → mesh scale/rotation/position
  → Three.js render #countdown-canvas

onDigitStart (each digit)
  → inkVideo.currentTime = 0; play()
  → multiply composite over fire
```

### Phase E — Finale

```
onLastShown → delayedCall → gsap.timeline()
  → darkenEl, fireVideo, countdownCanvas, inkVideo opacities
  → whiteSsrVideo play + opacity
  → ssrCard opacity + shader opacity
  → whiteoutEl opacity
```

---

## Element → medium across timeline

Use this when an **element** appears in multiple phases:

| Element | Phases active | Medium changes? |
|---------|---------------|-----------------|
| **Fire** | A → E3 | Always video; hidden at E3 |
| **Hex cards** | B only | WebGL only; canvas hidden D+ |
| **SSR card** | C → end | DOM 3D + child WebGL throughout |
| **Ink** | D (per digit) → E2 | Video; frozen then hidden |
| **Countdown digits** | D → E3 | WebGL; hidden at darken |
| **LAST text** | D late → E3 | WebGL; no exit animation |
| **White SSR video** | E4 → end | Video behind SSR card |
| **Darken** | E3 – E4 | CSS overlay |
| **Whiteout** | E5 | CSS overlay |

---

## Canvas visibility timeline

Only one of hex / countdown canvases is **meant** to be visible at a time:

| Time | `#cards-canvas` | `#countdown-canvas` |
|------|-----------------|---------------------|
| A – B5 | visible (opacity 1) | hidden (0) |
| C (SSR, hex still up) | visible | hidden |
| D – E3 | hidden | visible |
| E3+ | hidden | hidden |

`#ssr-card-canvas` can render whenever `#ssr-card-wrap` opacity > 0.

---

## Who schedules what (code entry points)

| Event | Function | Line of thought |
|-------|----------|-----------------|
| Show start | `playShow()` | Reset all layers, `buildCardsTimeline()` |
| SSR drop | `dropSsrCard()` | Added to hex TL at `ssrAt` |
| Ink/countdown arm | `startInkPhase()` | Added to hex TL at `inkAt` |
| Countdown start | `countdownCtrl.play()` | delayed inside `startInkPhase` |
| Finale | `onLastShown` | wired in `initCountdownOverlay` options |
| Replay | `replayBtn` → `playShow()` | full reset |

---

## Diagram: mediums over time

```
time ──────────────────────────────────────────────────────────────►

fire video     ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░
hex WebGL      ░░████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░
SSR DOM+GL     ░░░░░░░░░░░░███████████████████████████████████████
ink video      ░░░░░░░░░░░░░░░░░░░░░░▌▌▌▌▌▌▌░░░░░░░░░░░░░░░░░░░░░
countdown GL   ░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████████░░░░░░░░░
darken CSS     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░░░
white video    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████
whiteout CSS   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░███

▌ = brief ink bursts per digit
```

[Next: Layer stack by phase →](./04-layer-stack-by-phase.md)
