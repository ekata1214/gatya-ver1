# Composition overview

[← Index](./README.md) · [Next: Visual mediums →](./02-visual-mediums.md)

---

## What “composition” means here

The show is **one continuous performance** inside a single DOM container (`#stage`). There is no scene cut to another page.

**Composition** = how visual **layers** are stacked in that frame, **which technology draws each layer**, and **what updates them over time**.

You do not have separate “animation files” per phase. You have:

1. **One stage** (fixed aspect ratio 1080∶1920)
2. **Several layer slots** (video, canvas, div — always in the DOM)
3. **Visibility + content** that change phase by phase
4. **One master clock** (GSAP timelines + a few callbacks)

---

## The frame

Think of each moment as a **photograph of a layer cake**:

```
┌─────────────────────────────── #stage (1080×1920) ───────────────────────────────┐
│                                                                                  │
│   [UI: compare buttons, replay]                                    z: 1000+      │
│                                                                                  │
│   ┌────────────────────────────────────────────────────────────────────────┐   │
│   │  TOP: whiteout, darken, countdown canvas, SSR, cards canvas, ink, fire │   │
│   │         (only some layers visible at once)                              │   │
│   └────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

Every “frame” of the animation is the browser **compositing** whatever layers are visible at that instant. There is no film strip — the GPU and DOM paint the stack ~60 times per second.

---

## Two ideas to keep separate

### 1. Layer (compositing slot)

A **DOM element** with a fixed place in the z-order:

- `#fire-bg`
- `#cards-canvas`
- `#ssr-layer`
- etc.

Layers **exist for the whole show**. Most are hidden via `opacity: 0` or empty content until their phase.

### 2. Drawer (what paints pixels)

The **technology** that fills a layer:

| Drawer | Example layer |
|--------|----------------|
| HTML5 `<video>` | `#fire-bg`, `#ink-test`, `#white-ssr` |
| WebGL (Three.js) | `#cards-canvas`, `#countdown-canvas`, `#ssr-card-canvas` |
| DOM + CSS 3D | `#ssr-card-wrap` (transforms) |
| CSS solid div | `#darken`, `#whiteout` |
| CSS filter on canvas | `filter: blur()` on `#cards-canvas` |

**Animation driver** (who changes values over time) is usually **GSAP**; video uses **play / currentTime**; Three.js **renders** after values are set.

---

## Snapshot loop (the mental model)

For **moving** visuals, the loop is:

```
TIME (GSAP or video clock)
    → update state (numbers, transforms, opacity, video time)
    → drawer produces pixels (render / layout / decode video frame)
    → browser composites layers bottom → top
    → one displayed frame
```

| Layer type | State updated by | Pixels from |
|------------|------------------|-------------|
| Hex cards | GSAP → `anim`, `spin`, … | Three.js `render()` on `#cards-canvas` |
| Countdown | GSAP → mesh scale/rotation | Three.js on `#countdown-canvas` |
| SSR card | GSAP → `#ssr-card-wrap` transform | DOM layout + Three.js on child canvas |
| Fire / ink / white | `play()`, `currentTime` | Video decoder |
| Darken / whiteout | GSAP → `opacity` | CSS background on div |

Three.js does **not** run the show clock. It **redraws** when the clock says the 3D state changed.

---

## Three WebGL “worlds” (not one Three.js scene)

This confuses people: there are **three independent** Three.js setups:

| Canvas | Content | Motion driven by |
|--------|---------|------------------|
| `#cards-canvas` | Hex cylinder (6 cards) | GSAP → plain objects → `applyState()` |
| `#countdown-canvas` | 3D text 5→1→LAST | GSAP → mesh properties |
| `#ssr-card-canvas` | Flat card texture | Parent DOM transform (GSAP); canvas mostly redraws same quad |

They **never share a scene graph**. Switching phases often means **hiding one canvas and showing another**, not moving objects between scenes.

---

## Dimensions of composition (map to other docs)

| Dimension | Question it answers | Doc |
|-----------|---------------------|-----|
| **Medium** | Video vs canvas vs DOM? | [02-visual-mediums](./02-visual-mediums.md) |
| **Timeline** | When does each medium activate? | [03-timeline-and-drawers](./03-timeline-and-drawers.md) |
| **Layer stack** | What’s visible in the cake at t=? | [04-layer-stack-by-phase](./04-layer-stack-by-phase.md) |
| **Modification** | I want to change X — where? | [05-modification-map](./05-modification-map.md) |

---

## Phase names (used across docs)

| Phase | Rough time | Dominant visuals |
|-------|------------|------------------|
| A — Fire intro | 0–0.15s | Fire video only |
| B — Hex | 0.15–~1.92s | Fire + hex WebGL |
| C — SSR cross | ~1.14s+ | Fire + hex + SSR (overlap) |
| D — Ink / countdown | ~1.76s+ | Fire + ink + countdown WebGL + SSR |
| E — Finale | after LAST | Darken → white video + SSR → whiteout |

Exact times: [Show timeline](../05-show-timeline.md).

---

## What is *not* part of composition

- Side compare panels (`aside.side-panel`) — documentation UI, outside `#stage`
- `#compare-picker` — toggles tuning profile, not show art
- Legacy `GachaScene` single-canvas app — not used in production

[Next: Visual mediums →](./02-visual-mediums.md)
