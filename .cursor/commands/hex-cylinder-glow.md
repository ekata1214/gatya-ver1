# Adjust hex cylinder card glow

Tune the **six hex cards** on `#cards-canvas` (single mesh + `makeCardGlowMaterial` + `hexBloom`). Do **not** change SSR settings or the face/edge split architecture.

## User intent

Apply the glow changes the user describes in this chat (strength, width, color, softer/harder, etc.). If they gave no specifics, ask briefly what to change (e.g. "stronger yellow", "wider bleed", "less face wash").

## Files to edit

| File | What |
|------|------|
| `src/gatya-unified.mjs` | `CARD_FX`, optional `CARD_BLOOM` overrides |
| `src/card-bloom-composer.mjs` | `CARD_BLOOM_DEFAULTS` only if changing hex bloom defaults globally |
| `cards-six.html` | Bump `ASSET_V` after any JS change |

## Knobs (`CARD_FX` in `src/gatya-unified.mjs`)

| Constant | Effect | Typical range |
|----------|--------|----------------|
| `glowColor` | Neon tint | `new THREE.Color(0xffdd22)` — pass hex as `0xRRGGBB` |
| `glowRadius` | Outer halo reach (texels) | 10–18 |
| `glowFalloff` | Halo tightness (>1 tighter) | 1.4–2.2 |
| `haloStrength` | Fringe brightness outside PNG | 0.8–1.6 |
| `rimStrength` | Thin on-edge yellow line | 0.15–0.35 |
| `bloomStrength` | Edge HDR → bloom | 2.5–4.5 |
| `bloomInteriorCap` | Max face RGB before bloom (lower = less face wash) | 0.45–0.58 |

## Post-process (`CARD_BLOOM` / `CARD_BLOOM_DEFAULTS`)

| Constant | Effect | Typical range |
|----------|--------|----------------|
| `strength` | Bloom scatter intensity | 0.5–0.85 |
| `radius` | Bloom blur width | 0.35–0.6 |
| `threshold` | HDR pickup (higher = edges only) | 0.94–0.99 |

## Recipes

- **Stronger glow:** raise `haloStrength`, `bloomStrength`, `CARD_BLOOM.strength`
- **Wider soft bleed:** raise `glowRadius`, lower `glowFalloff`, raise `CARD_BLOOM.radius`
- **Less face wash:** lower `bloomStrength` / `CARD_BLOOM.strength`, raise `bloomInteriorCap` or `threshold`
- **New color:** set `glowColor: new THREE.Color(0xRRGGBB)`

## Constraints (do not break)

- Hex stays **one mesh** per card + `makeCardGlowMaterial()` + `createTransparentBloomComposer` on full scene
- PNG alpha edge only — no rectangular sleeves, `LineSegments`, or CSS overlays
- Do not modify hex cylinder motion, timing, or `SSR_*` constants
- Bump `ASSET_V` in `cards-six.html` after changes

## Done when

- Only hex-related constants changed
- `ASSET_V` bumped
- User told which knobs were changed and by how much
