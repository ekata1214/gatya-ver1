# Composition — visual structure of the show

How a **single portrait frame** (1080×1920 stage) is built over time: layers, mediums, drivers, and what to edit.

Read in order — each doc adds a dimension.

---

## Reading order

| # | Document | Dimension |
|---|----------|-----------|
| 1 | [Overview](./01-overview.md) | Mental model: frame, snapshot, layers, mediums |
| 2 | [Visual mediums](./02-visual-mediums.md) | Video vs WebGL vs DOM vs CSS — how each is drawn |
| 3 | [Timeline & drawers](./03-timeline-and-drawers.md) | Each show phase → medium + driver + source file |
| 4 | [Layer stack by phase](./04-layer-stack-by-phase.md) | What is visible in the stack at each moment |
| 5 | [Modification map](./05-modification-map.md) | Change element X → files, layers, timeline |

---

## Related docs

- [Show timeline](../05-show-timeline.md) — numeric timings
- [Architecture](../03-architecture.md) — module wiring
- [Tuning guide](../09-tuning-guide.md) — constant lookup table

---

## One-sentence model

> **One fixed stage (`#stage`) composites stacked layers; GSAP (and video playback) updates each layer over time; Three.js redraws only the WebGL canvases.**
