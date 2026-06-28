# 09 — Tuning guide

[← Countdown & finale](./08-countdown-and-finale.md) · [Index](./README.md) · [Next: Dev tools →](./10-dev-tools.md)

---

## Golden rule

**Change constants first, code second.**

1. `src/ref-match-config.mjs` — hex cylinder numbers
2. `src/gatya-unified.mjs` — SSR poses, post-show, wiring
3. `src/countdown-three-overlay.mjs` — countdown motion
4. `src/compare-panels.mjs` — document visible changes
5. `cards-six.html` → bump **`ASSET_V`** (cache bust)

After edits: hard reload, compare at `/ref`, toggle before/after if hex-related.

---

## “I want to change X”

### Hex cylinder

| Goal | File | Keys / functions |
|------|------|------------------|
| When cards appear | `ref-match-config.mjs` | `CARD_INTRO_DELAY` |
| Gather / slide speed | `ref-match-config.mjs` | `T.slide` |
| Stand / hold / rise / exit duration | `ref-match-config.mjs` | `T.stand`, `T.hold`, `T.rise`, `T.exit` |
| Horizontal position | `ref-match-config.mjs` | `FORM.x`, `FORM.poseX` |
| Vertical position (formed) | `ref-match-config.mjs` | `FORM.y`, `FORM.yStart` |
| Hold drift height | `ref-match-config.mjs` | `FORM.driftY` |
| Cup tilt at formation | `ref-match-config.mjs` | `FORM.rotX`, `rotZ`, `rotYOff` |
| Standing angle | `ref-match-config.mjs` | `ROT.poseX`, `poseZ`, `poseYOff` |
| Overall hex size | `ref-match-config.mjs` | `CARD_W`, `FORM.scaleMul`, `ROT.poseScale` |
| Card gap when formed | `ref-match-config.mjs` | `HEX_GAP_FINAL`, `HEX_GAP_START` |
| Diagonal gather reach | `ref-match-config.mjs` | `GATHER_DIAG.reach`, `reachEase`, `lift` |
| Spin amount during gather | `ref-match-config.mjs` | `GATHER_ROTATIONS` |
| Rise / exit path | `ref-match-config.mjs` | `RISE.mid`, `RISE.exit` |
| Verticalize speed on rise | `ref-match-config.mjs` | `CYL_VERTICAL_DUR` |
| Motion blur intensity | `ref-match-config.mjs` | `CYL_BLUR.gatherPeak`, `exitPeak` |
| Camera framing | `ref-match-config.mjs` | `CAMERA.fov`, `pos`, `look`, `exposure` |
| Cup mouth width | `ref-match-config.mjs` | `CUP.cardTilt`, `mouthGapBoost` |
| Segment easing | `gatya-unified.mjs` | `CYL_EASE`, `segEase()` |
| Gather algorithm | `gatya-unified.mjs` | `gatherMode`, `applyCardHexGather()` |

### SSR card

| Goal | File | Keys / functions |
|------|------|------------------|
| Drop origin | `gatya-unified.mjs` | `SSR_DROP.from` |
| Landing pose | `gatya-unified.mjs` | `SSR_POSE` |
| Drop duration | `gatya-unified.mjs` | `SSR_DROP_DUR` |
| When SSR starts vs hex rise | `gatya-unified.mjs` | `SSR_CROSS_RISE_OFFSET` |
| Bounce | `gatya-unified.mjs` | `startSsrBounce()` |
| SSR glow / metal | `gatya-unified.mjs` | `SSR_CARD_FX` |
| DOM perspective | `cards-six.html` | `#ssr-layer` perspective |

### Post-hex timing

| Goal | File | Keys |
|------|------|------|
| Ink phase after SSR lands | `gatya-unified.mjs` | `POST_SHOW_AFTER.inkAfterSsrLand` |
| Countdown start delay | `gatya-unified.mjs` | `POST_SHOW_AFTER.countdownDelay` |
| Ink freeze after LAST | `gatya-unified.mjs` | `POST_SHOW_AFTER.lastInkFreeze` |
| Delay before darken | `gatya-unified.mjs` | `POST_SHOW_AFTER.lastToDarken` |
| Darken / whiteout durations | `gatya-unified.mjs` | `darkenDur`, `whiteRevealDur`, `finaleHold`, `whiteoutDur` |

### Countdown

| Goal | File | Keys |
|------|------|------|
| Per-digit motion | `countdown-three-overlay.mjs` | `DIGIT_ANIM` |
| LAST letter motion | `countdown-three-overlay.mjs` | `LAST_LETTER_ANIM`, `LAST_GROUP_REST/SHOW` |
| Appear / hold / exit times | `countdown-three-overlay.mjs` | `T.appear`, `T.hold`, `T.exit` |
| Overall countdown length | `countdown-three-overlay.mjs` | `TOTAL`, `STEP` |
| Font | `countdown-three-overlay.mjs` | `FONT_CANDIDATES` |
| Fire reflection on text | `countdown-three-overlay.mjs` | `NUMBER_FIRE_TUNING`, `FIRE_CHAR_TUNING` |

### Card edge glow (hex + SSR)

| Goal | File | Keys |
|------|------|------|
| Border color | `gatya-unified.mjs` | `CARD_FX.borderColor` |
| Edge thickness / fluff | `gatya-unified.mjs` | `edgeSampleScale`, `edgeBlurScale`, `edgeMix`, `edgeAdd` |
| Metallic sheen | `gatya-unified.mjs` | `metalStrength`, `surfaceGlow` |

### Audio

| Goal | File | Keys |
|------|------|------|
| Enable/disable all SE | `se.mjs` | `SE_ENABLED` |
| Clip paths | `se.mjs` | `ASSETS` |
| Master volume | `se.mjs` | `createSE({ volume })` |

### UI / compare

| Goal | File |
|------|------|
| Side panel copy / diagrams | `compare-panels.mjs` |
| Stage layout / z-index | `cards-six.html` |
| Module cache bust | `cards-six.html` → `ASSET_V` |

---

## Easing reference

| Region | Current ease | Where |
|--------|--------------|-------|
| Hex all segments | `power2.out` | `CYL_EASE` in `gatya-unified.mjs` |
| SSR drop | `power3.in` | `dropSsrCard()` |
| SSR bounce | `sine.inOut` | `startSsrBounce()` |
| Countdown digits | `heavy` (custom) | `countdown-three-overlay.mjs` |
| Finale fades | `post` (custom) | `onLastShown` timeline |

---

## Safe edit checklist

Before submitting hex/SSR changes:

- [ ] `ref-match-config.mjs` updated (if hex)
- [ ] `compare-panels.mjs` updated (if user-visible story changed)
- [ ] `ASSET_V` bumped in `cards-six.html`
- [ ] Checked **after** mode at `/show`
- [ ] Scrubbed ref at 0.37, 0.50, 1.04 on `/ref`
- [ ] Fire does not restart mid-show
- [ ] SSR does not re-drop on ink phase
- [ ] Replay button resets cleanly

---

## Constants snapshot (production `ref-final-v3`)

For quick reference — authoritative source is always the file:

```
CARD_INTRO_DELAY: 0.15
T: slide 0.22 | stand 0.12 | hold 0.55 | rise 0.38 | exit 0.50
REF_TOTAL ≈ 1.97s
FORM: x 0 | y -0.58 | yStart -0.72 | driftY -0.18
CYL_VERTICAL_DUR: 0.14
RISE.mid: (0, 2.05, 0.88) | exit: (0, 5.55, 1.02)
CAMERA: fov 44 | pos [0, 0.12, 6.05] | look [0, -0.18, 0.22]
```

---

## Related

- [Dev tools](./10-dev-tools.md) — calibration helpers
- [Hex cylinder](./06-hex-cylinder.md) — phase detail
- [`.cursor/rules/gatya-compare-workflow.mdc`](../.cursor/rules/gatya-compare-workflow.mdc) — maintainer workflow

[Next: Dev tools →](./10-dev-tools.md)
