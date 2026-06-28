# Adjust SSR card glow

Tune the **SSR hero card** on `#ssr-card-canvas` (face mesh + edge mesh + selective bloom). Do **not** change hex card settings.

## User intent

Apply the glow changes the user describes in this chat (strength, width, color, softer/harder, etc.). If they gave no specifics, ask briefly what to change (e.g. "stronger neon", "wider halo", "#ffaa00 orange").

## Architecture (do not regress)

- `ssrFaceMesh` + `makeCardFaceMaterial` → **no glow, no bloom**
- `ssrEdgeMesh` + `makeCardEdgeMaterial` → fringe + edge HDR only
- `createSelectiveBloomComposer` — bloom on **edge scene only**
- `SSR_CANVAS_GLOW_PAD` — margin so glow is not clipped at canvas edges

## Files to edit

| File | What |
|------|------|
| `src/gatya-unified.mjs` | `SSR_EDGE_FX`, `SSR_FACE_FX` (face only if user asks), `SSR_EDGE_BLOOM`, `SSR_CANVAS_GLOW_PAD` |
| `src/card-bloom-composer.mjs` | `SSR_EDGE_BLOOM_DEFAULTS` if changing shared defaults |
| `cards-six.html` | Bump `ASSET_V` after any JS change |

## Edge glow (`SSR_EDGE_FX`)

| Constant | Effect | Typical range |
|----------|--------|----------------|
| `glowColor` | Neon tint | `new THREE.Color(0xffdd22)` — hex as `0xRRGGBB` |
| `glowRadius` | Shader halo reach (texels) | 16–24 |
| `glowFalloff` | Fringe tightness (>1 tighter) | 1.3–1.8 |
| `haloStrength` | Brightness outside PNG silhouette | 1.2–2.0 |
| `bloomStrength` | Edge HDR fed to UnrealBloomPass | 3.5–5.0 |

## Bloom (`SSR_EDGE_BLOOM` / `SSR_EDGE_BLOOM_DEFAULTS`)

| Constant | Effect | Typical range |
|----------|--------|----------------|
| `strength` | Bloom scatter (main brightness lever) | 0.65–1.0 |
| `radius` | Bloom blur width | 0.4–0.6 |
| `threshold` | HDR pickup | 0.92–0.98 |

## Other

| Constant | Effect |
|----------|--------|
| `SSR_CANVAS_GLOW_PAD` | Frustum/canvas padding per side (clip fix) | 0.12–0.22 |
| `SSR_FACE_FX.metalStrength` / `surfaceGlow` | Face sheen only — **not glow** |

## Recipes

- **Stronger neon:** raise `SSR_EDGE_BLOOM.strength`, then `bloomStrength`, then `haloStrength`
- **Wider bleed:** raise `glowRadius`, `SSR_EDGE_BLOOM.radius`, lower `glowFalloff`
- **New color:** `SSR_EDGE_FX.glowColor = new THREE.Color(0xRRGGBB)`
- **Glow clipped at edge:** raise `SSR_CANVAS_GLOW_PAD`
- **Face rim tint:** do **not** raise face bloom — lower `SSR_EDGE_BLOOM.radius` or check mix `bloomWeight` in `SelectiveAlphaMixShader` only as last resort

## Constraints (do not break)

- Keep face/edge **two meshes**; do not merge back to single `makeCardGlowMaterial` for SSR
- Do not add `OutputPass` or remove alpha-preserving mix
- Do not change SSR drop/bounce DOM motion or `#ssr-card-wrap` GSAP
- Do not modify `CARD_FX` / hex bloom
- Bump `ASSET_V` in `cards-six.html` after changes

## Done when

- Only SSR-related constants changed
- `ASSET_V` bumped
- User told which knobs were changed and by how much
