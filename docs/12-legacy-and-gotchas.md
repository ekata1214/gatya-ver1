# 12 — Legacy code & gotchas

[← Three.js primer](./11-threejs-for-web-devs.md) · [Index](./README.md)

---

## Legacy architecture (ignore for production)

Early prototype under `src/` used a **state machine + manager** pattern:

```
App.js
└── GachaScene.js
    ├── StateMachine (core/StateMachine.js)
    ├── AnimationManager
    ├── CardManager
    ├── CameraManager
    ├── EffectManager
    ├── ParticleManager
    ├── AudioManager
    └── config/timeline.json
```

| Aspect | Legacy | Production |
|--------|--------|------------|
| Entry HTML | None wired today | `cards-six.html` |
| Timeline config | `config/timeline.json` | `ref-match-config.mjs` |
| Rendering | Single full-screen canvas | Multi-layer DOM + 3 canvases |
| Phases | State machine scenes | GSAP + layer opacity |

**Do not edit legacy managers** expecting the main show to change — they are orphaned unless someone reconnects an HTML entry.

---

## Experimental HTML pages

Not the shipped show — safe to ignore unless exploring history:

| File | Notes |
|------|-------|
| `countdown-three.html` | Standalone countdown test |
| `countdown.html`, `countdown-ink.html` | 2D/countdown experiments |
| `ink-generate.html`, `ink-generate-3d.html` | Ink asset generation |
| `ink-sumi.html` | Redirect to cards-six only |

---

## Gotchas

### 1. Fire video restart

**Never** call `fireVideo.load()` during the show. Documented in baseline rules — causes visible flash.

Fire pauses only at darken; resume only via full `playShow()` replay.

### 2. SSR must not re-drop

After `dropSsrCard()`, ink phase only changes layers. `setSsrCardCenter()` resets pose but does not replay drop animation.

### 3. `cardUpright.t` is coupled

Card verticalization and hex gap narrowing share `cardUpright.t` + `syncHexGapFromUpright()`. Splitting into independent tweens caused jitter in past tuning — keep one driver.

### 4. Cup tilt sign

In `applyCardHexGather()`:

```javascript
const cupTilt = -(1 - spread) * cupBlend * CUP.cardTilt * Math.cos(ang);
```

Flipping sign inverts cup shape (mouth up vs down).

### 5. Sound disabled

`se.mjs` → `SE_ENABLED = false`. All `se.play()` calls are no-ops until enabled.

### 6. Autoplay policies

- Video: muted autoplay works
- Audio: requires user gesture (`pointerdown` unlock in `gatya-unified.mjs`)

### 7. Cache bust required

ES modules cache aggressively. Always bump `ASSET_V` in `cards-six.html` when testing `.mjs` edits.

### 8. before mode ≠ production

**before** button applies `BEFORE_MATCH` — intentionally wrong vertical position for A/B storytelling. Tune against **after** only for ref matching.

### 9. Baseline rules vs current config

`.cursor/rules/gatya-show-baseline.mdc` may describe older constants (e.g. historical `FORM.x = -0.28`). **Trust `ref-match-config.mjs`** (`ref-final-v3`) and README for live values.

### 10. Media assets may be local-only

Large `.mp4` / `.mov` files may be gitignored. Clone might not include all assets — check repo root for `re fire2.mp4`, card PNGs, etc.

### 11. No npm test suite

Validation is visual. Use `/ref`, `ref-calibrate.html`, and full `/show` replay.

### 12. LAST countdown never exits

Do not add exit tweens to LAST in `countdown-three-overlay.mjs` without adjusting darken timing — LAST must stay until canvas hidden.

---

## Do-not-regress checklist (from baseline)

When changing hex / SSR / shaders, preserve:

- [ ] Nested cylinder group hierarchy (position / tilt / spin)
- [ ] PNG alpha edge glow only (no CSS rectangular frames)
- [ ] Single-page flow (no navigation between phases)
- [ ] Fire + SSR continuity through ink
- [ ] SSR DOM 3D transforms (not pure 2D rotation)
- [ ] `xPercent/yPercent: -50` SSR centering

Full spec: [`.cursor/rules/gatya-show-baseline.mdc`](../.cursor/rules/gatya-show-baseline.mdc)

---

## Git / backup

Project README notes backup commit for ref-final-v3 tuning. Use `git log` to find restore points before large experiments.

`.gitignore` typically excludes huge video exports and `.cursor/` (except rules).

---

## Where to go next

| Task | Read |
|------|------|
| First time setup | [Overview](./01-overview.md) |
| Change hex timing | [Tuning guide](./09-tuning-guide.md) + `ref-match-config.mjs` |
| Understand full sequence | [Show timeline](./05-show-timeline.md) |
| Match reference video | [Dev tools](./10-dev-tools.md) |
| Learn 3D basics | [Three.js primer](./11-threejs-for-web-devs.md) |

---

[Back to index](./README.md)
