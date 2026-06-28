# 06 — Hex cylinder (six-card 3D)

[← Show timeline](./05-show-timeline.md) · [Index](./README.md) · [Next: SSR & video layers →](./07-ssr-and-video-layers.md)

---

## What you are looking at

Six PNG cards arranged on a hex ring. They:

1. Fly in along **diagonal paths** (after mode) or radial burst (before mode)
2. Form a **cup** shape (mouth wider at top)
3. **Stand up** and drift forward slightly
4. **Verticalize** while rising
5. Exit upward and fade out

All motion is tuned against reference video **`reference-r2-24fps.mp4`** (1.917s hex segment).

---

## 3D hierarchy (do not flatten)

```
scene
└── cylinder (Group)              ← anim.x, anim.y, anim.z
    └── cylinderTilt (Group)      ← anim.rotX, anim.rotZ
        └── cylinderSpin (Group)    ← spin.y + anim.rotYOff
            ├── card (Group) × 6    ← position/rotation from applyCardHexGather
            │   └── face (Mesh)     ← PlaneGeometry + ShaderMaterial
            └── …
```

**Why nested groups?** Tilt (rotX/rotZ) and Y-spin are independent. Merging into one Euler rotation causes gimbal-style bugs and makes tuning harder.

---

## Card definitions

Six cards at 60° intervals (gold at 180°):

| Color | Angle | PNG |
|-------|-------|-----|
| Blue | 0° | `blue card.png` |
| Silver | 60° | `silver card.png` |
| Rainbow | 120° | `rainbow card.png` |
| Gold | 180° | `gold card.png` |
| Green | 240° | `green card.png` |
| Red | 300° | `red card.png` |

Each card is a `PlaneGeometry(CARD_W, CARD_H)` where `CARD_H = CARD_W * 1.5`.

---

## State variables (GSAP targets)

| Object | Range | Drives |
|--------|-------|--------|
| `anim.x/y/z` | world units | Whole cylinder position |
| `anim.rotX/rotZ/rotYOff` | radians | Cylinder tilt |
| `anim.scaleMul` | number | Uniform scale of all cards |
| `anim.opacity` | 0–1 | Shader uniform on all faces |
| `spin.y` | radians | Y rotation of cylinderSpin |
| `gather.t` | 1→0 during slide | Spread → hex formed |
| `cardUpright.t` | 0→1 | Cup shape → vertical cards + gap narrow |
| `hexGap.scale` | START→FINAL | Ring radius (coupled to upright) |
| `motionBlur.px` | 0–14 | CSS blur on canvas |

---

## Phase-by-phase implementation

### Slide (`T.slide` = 0.22s)

**Functions:** `buildCardsTimeline()` + `applyCardHexGather()`

| Tween | Target | Effect |
|-------|--------|--------|
| `gather.t` 1→0 | Per-card spread | Cards move from outer diagonal paths to hex slots |
| `spin.y` | +`GATHER_ROTATIONS` turns | Full spin during gather (2.167 rot ≈ 60° offset for blue top-right) |
| `anim.y` | `yStart` → `FORM.y` | **After mode:** rise from below while forming |
| `anim` tilt | → `FORM.rotX/Z/rotYOff` | Cup attitude |
| `motionBlur` | peak 9px mid-slide | Speed feel |

**After mode gather math** (`applyCardHexGather`, `gatherMode === 'after'`):

- Each card extends ** outward along its hex angle** by `reach * reachEase`
- `reachEase` stretches the outward stroke early in the gather (diagonal “streaks” in ref)

**Cup tilt on each card:**

```javascript
const cupTilt = -(1 - spread) * cupBlend * CUP.cardTilt * Math.cos(ang);
```

Negative sign = mouth wider at top. **Do not flip sign** without visual check.

### Stand (`T.stand` = 0.12s)

| Tween | Target | Effect |
|-------|--------|--------|
| `anim.rotX/Z/rotYOff` | → `ROT.pose*` | Standing cylinder attitude |
| `anim.x/y` | → `FORM.poseX`, `FORM.driftY` | Starts moving to hold position |
| `cardUpright.t` | begins 0→1 | Cards start verticalizing |

### Hold (`T.hold` = 0.55s)

| Tween | Target | Effect |
|-------|--------|--------|
| `anim.z` | → 0.16 | Subtle move toward camera |
| `anim.scaleMul` | → `ROT.poseScale` | Slightly larger |
| `spin.y` | +`POST_GATHER_ROTATIONS` | Slow continued rotation |
| `cardUpright.t` | continues | Gap narrows (`hexGap.scale`) |

### Rise (`T.rise` = 0.38s)

| Tween | Target | Effect |
|-------|--------|--------|
| `anim.rotX/Z/rotYOff` | → 0 in `CYL_VERTICAL_DUR` (0.14s) | Whole cylinder vertical |
| `anim.x/y/z` | → `RISE.mid` | Up and forward |
| `anim.scaleMul/opacity` | shrink / fade | Exit foreshadow |
| `se.play('rise')` | — | Rise SE (if enabled) |

### Exit (`T.exit` = 0.50s)

| Tween | Target | Effect |
|-------|--------|--------|
| `anim.x/y/z` | → `RISE.exit` | Continue off-screen path |
| `anim.opacity` | → 0 | Gone |
| `motionBlur` | peak 14px | Exit speed |
| callback | `resetCardsShow()` | Hide cylinder |

---

## Key constants (`ref-match-config.mjs`)

### Timing `T`

```javascript
T: { slide: 0.22, stand: 0.12, hold: 0.55, rise: 0.38, exit: 0.50 }
CARD_INTRO_DELAY: 0.15
```

### Formation `FORM`

| Field | Value | Meaning |
|-------|-------|---------|
| `x` | 0 | Horizontal center |
| `y` | -0.58 | Gather complete height (center-ish, slightly low) |
| `yStart` | -0.72 | Gather begins lower (build-up feel) |
| `driftY` | -0.18 | Hold position Y |
| `rotX/Z/rotYOff` | 68° / -5.5° / 4° | Cup tilt at formation |
| `scaleMul` | 1.06 | Scale at formation |

### Standing `ROT`

| Field | Value |
|-------|-------|
| `poseX/Z/YOff` | 20° / -15° / 5° |
| `poseScale` | 1.12 |

### Gather diagonal `GATHER_DIAG`

| Field | Value |
|-------|-------|
| `reach` | 5.35 |
| `lift` | 2.08 |
| `liftWave` | 0.38 |
| `reachEase` | 1.35 |

### Cup shape `CUP`

| Field | Value |
|-------|-------|
| `cardTilt` | 24° |
| `mouthGapBoost` | 1.16 |

### Rise path `RISE`

| Point | x | y | z |
|-------|---|---|---|
| mid | 0 | 2.05 | 0.88 |
| exit | 0 | 5.55 | 1.02 |

### Camera `CAMERA`

| Field | Value |
|-------|-------|
| fov | 44 |
| pos | [0, 0.12, 6.05] |
| look | [0, -0.18, 0.22] |
| exposure | 1.12 |

---

## Card shader (edge glow)

`makeCardGlowMaterial()` in `gatya-unified.mjs`:

- Samples PNG alpha neighbors → edge mask
- Adds `#ffdd22` border glow
- Optional metallic sheen on interior

Tune via `CARD_FX`:

```javascript
metalStrength: 0.0225,
surfaceGlow: 0.0125,
edgeSampleScale: 4.0,
edgeBlurScale: 2.4,
edgeMix: 0.9,
edgeAdd: 0.58,
```

---

## before vs after gather

| | **after** (production) | **before** (compare) |
|---|------------------------|----------------------|
| Config | `REF_MATCH` | `BEFORE_MATCH` |
| Gather | Diagonal per-card (`GATHER_DIAG`) | Radial burst (`GATHER`) |
| Y motion | `yStart` → `FORM.y` | Fixed higher `FORM.y -0.40` |
| Entry position | Center x=0 | Slides from off-screen corner |

Toggle via UI buttons → `playShow('before'|'after')`.

---

## Functions to read in source

| Function | Line area (approx) | Purpose |
|----------|-------------------|---------|
| `buildCardsTimeline()` | ~616–804 | All GSAP tweens |
| `applyCardHexGather()` | ~375–406 | Per-card positions |
| `applyState()` | ~408–417 | Sync anim → Three.js |
| `hexSlot()` | ~365–373 | Hex ring math |
| `makeCardGlowMaterial()` | ~423–511 | Shader |
| `resetCardsShow()` | ~591–614 | Initial/hidden state |

---

## Tuning workflow

1. Change values in `ref-match-config.mjs` first.
2. Bump `ASSET_V` in `cards-six.html`.
3. Compare at `/ref` keyframes 0.37, 0.50, 1.04.
4. Use `ref-calibrate.html` overlay for pixel alignment.
5. Update `compare-panels.mjs` if the change is user-visible in before/after story.

See [Dev tools](./10-dev-tools.md) and [Tuning guide](./09-tuning-guide.md).

[Next: SSR & video layers →](./07-ssr-and-video-layers.md)
