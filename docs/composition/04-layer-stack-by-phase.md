# Layer stack by phase

[← Timeline & drawers](./03-timeline-and-drawers.md) · [Index](./README.md) · [Next: Modification map →](./05-modification-map.md)

---

## How to read this doc

For each **phase**, we list the **stage layer stack** bottom → top (what you would see if you peeled the cake).

Legend:

| Symbol | Meaning |
|--------|---------|
| ● | Visible, animating |
| ○ | In DOM but opacity 0 / not playing |
| — | Not relevant |

**z-index** is from `cards-six.html` (stage children).

---

## Global z-order reference

| z | Element | Medium |
|---|---------|--------|
| 0 | `#fire-bg` | Video |
| 1 | `#ink-test` | Video + multiply |
| 5 | `#cards-canvas` | WebGL |
| 90 | `#ssr-layer` | DOM 3D + nested video + canvas |
| 100 | `#countdown-canvas` | WebGL |
| 150 | `#darken` | CSS |
| 250 | `#whiteout` | CSS |
| 1000+ | `#replay`, `#compare-picker` | HTML UI |

Inside `#ssr-layer`:

| z | Element |
|---|---------|
| 0 | `#white-ssr` |
| 1 | `#ssr-card-wrap` → `#ssr-card-canvas` |

---

## Phase A — Fire intro (0 – 0.15s)

```
TOP ─────────────────────────────
      [replay] [before/after]     UI (always)
      #whiteout                   ○
      #darken                     ○
      #countdown-canvas           ○
      #ssr-layer                  ○ (wrap opacity 0)
      #cards-canvas               ○ (opacity 1 but hex opacity 0 in 3D)
      #ink-test                   ○
      #fire-bg                    ● looping
BOTTOM ───────────────────────────
```

**Single-frame content:** fire video fills stage. Hex scene may render transparent empty scene.

---

## Phase B — Hex active (0.15 – ~1.92s)

```
TOP ─────────────────────────────
      #whiteout / #darken         ○
      #countdown-canvas           ○
      #ssr-layer                  ○ until phase C
      #cards-canvas               ● WebGL hex + optional CSS blur
      #ink-test                   ○
      #fire-bg                    ●
BOTTOM ───────────────────────────
```

**Single-frame content:** fire + six cards in 3D. Cards drawn with shader glow; transparent areas show fire.

**Internal WebGL stack (one canvas):** sorted by depth / `renderOrder` (gold card often on top).

---

## Phase C — SSR overlaps hex (~1.14 – ~1.76s)

```
TOP ─────────────────────────────
      #countdown-canvas           ○
      #ssr-layer                  ●
        └ #ssr-card-wrap          ● GSAP 3D transform
            └ #ssr-card-canvas    ● flat card art
        └ #white-ssr              ○
      #cards-canvas               ● hex still visible (rise/exit)
      #ink-test                   ○
      #fire-bg                    ●
BOTTOM ───────────────────────────
```

**Single-frame content:** fire + rising/fading hex + SSR dropping/bouncing **in front of hex** (z 90 > 5).

---

## Phase D — Countdown + ink (~1.76s – LAST)

After `showInkLayer()`:

```
TOP ─────────────────────────────
      #darken                     ○
      #countdown-canvas           ● 3D digits / LAST
      #ssr-layer                  ● bounce continues
      #cards-canvas               ○ hidden (opacity 0)
      #ink-test                   ● on each digit (multiply)
      #fire-bg                    ●
BOTTOM ───────────────────────────
```

**Single-frame content:** fire darkened locally by ink × multiply, 3D countdown on top, SSR bouncing mid-screen.

**Ink** is not full-screen continuous — it **restarts** per digit (`currentTime = 0`).

---

## Phase E1 — LAST visible, pre-darken

Same stack as D, but:

- LAST mesh stays (no scale-out)
- ink may freeze ~0.5s after LAST
- countdown canvas still ●

---

## Phase E2 — Darken in (~1s after LAST)

```
TOP ─────────────────────────────
      #whiteout                   ○
      #darken                     ● opacity → 1
      #countdown-canvas           ● then hidden mid-phase
      #ssr-layer                  ●
      #cards-canvas               ○
      #ink-test                   ○ hidden
      #fire-bg                    ● fading out / pause
BOTTOM ───────────────────────────
```

**Single-frame content:** black wash covers everything; fire and countdown turned off during transition.

---

## Phase E3 — White SSR reveal

```
TOP ─────────────────────────────
      #darken                     ● opacity → 0 (revealing below)
      #ssr-layer                  ●
        └ #white-ssr              ● video opacity → 1
        └ #ssr-card-wrap          ● fade in
      #countdown-canvas           ○
      #fire-bg                    ○ hidden
BOTTOM ───────────────────────────
```

**Single-frame content:** bright white SSR video fills background; card on top with bounce.

---

## Phase E4 — Whiteout

```
TOP ─────────────────────────────
      #whiteout                   ● opacity → 1
      (everything below washed out)
BOTTOM ───────────────────────────
```

---

## Variations summary

Not every phase uses the same **set of active mediums**:

| Phase group | Video layers | WebGL canvases | DOM 3D | CSS overlays |
|-------------|--------------|----------------|--------|--------------|
| A | fire | (empty hex) | — | — |
| B | fire | hex | — | blur on hex canvas |
| C | fire | hex + SSR child | SSR wrap | — |
| D | fire + ink | countdown + SSR child | SSR wrap | — |
| E | white SSR | SSR child | SSR wrap | darken + whiteout |

**Key transition:** B/C → D is a **canvas swap** (hex off, countdown on), not a scene change inside one WebGL world.

---

## Side panels (outside stage)

On wide screens, `aside.side-panel` sits **beside** `#stage-wrap`, not in the layer stack. Tuning compare UI does not affect show composition.

---

## Quick lookup: “what’s on screen at t?”

| t (s) | Dominant layers (bottom → top) |
|-------|--------------------------------|
| 0.10 | fire |
| 0.37 | fire, hex (formed) |
| 1.14 | fire, hex, SSR dropping |
| 1.50 | fire, hex fading, SSR landed |
| 1.80 | fire, SSR, countdown prep (hex hidden) |
| 3.00 | fire, ink, countdown digit, SSR |
| LAST+ | fire, ink, LAST, SSR |
| finale | darken → white SSR + card → whiteout |

Use `seekCardsTime(t)` + `/ref` for hex alignment; full show for post-hex.

[Next: Modification map →](./05-modification-map.md)
