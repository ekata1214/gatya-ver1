# 11 — Three.js primer (for web devs)

[← Dev tools](./10-dev-tools.md) · [Index](./README.md) · [Next: Legacy & gotchas →](./12-legacy-and-gotchas.md)

---

## Do you need to learn Three.js?

**For most tuning:** no. You'll edit GSAP durations and config numbers.

**For structural changes:** yes — read this chapter, then [Hex cylinder](./06-hex-cylinder.md).

This project uses a **small subset** of Three.js: scenes, groups, planes, one custom shader, text geometry.

---

## Core objects

### Scene

Container for everything visible. This repo has **three separate scenes**:

1. Hex cards scene (`#cards-canvas`)
2. SSR card scene (`#ssr-card-canvas`)
3. Countdown scene (`#countdown-canvas`)

### Camera

Defines viewpoint.

| Type | Used for |
|------|----------|
| `PerspectiveCamera(fov, aspect, near, far)` | Hex + countdown — natural depth |
| `OrthographicCamera` | SSR card — flat, no foreshortening |

Camera does **not** move during the show (fixed framing). Motion = moving objects.

### Renderer

```javascript
new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(w, h);
renderer.render(scene, camera);
```

`alpha: true` lets fire video show through empty pixels.

### Mesh = Geometry + Material

```javascript
new THREE.Mesh(
  new THREE.PlaneGeometry(width, height),
  makeCardGlowMaterial(texture)
);
```

Hex cards are just **textured quads** in 3D space.

### Group

Empty container; transforms apply to all children.

The hex cylinder uses nested Groups for **position → tilt → spin → cards**.

---

## Coordinate system

Three.js default:

- **+Y** up
- **+Z** toward viewer (camera sits at +Z looking at origin)
- **+X** right

Card hex ring lives mostly near origin; camera at `(0, 0.12, 6.05)` looking slightly downward.

---

## How animation works here

**Not:** physics simulation every frame.  
**Yes:** GSAP writes numbers → `applyState()` copies to Three.js → render.

```javascript
// GSAP tweens this:
anim.y = -0.58;

// Each frame:
cylinder.position.set(anim.x, anim.y, anim.z);
renderer.render(scene, camera);
```

Think of it like updating React state and re-rendering — except the "state" is `anim` and the render is WebGL.

---

## Textures

PNG cards loaded with `TextureLoader`:

```javascript
tex.colorSpace = THREE.SRGBColorSpace;
```

Passed to shader as `uniform sampler2D map`.

SSR and hex cards share the same loader pattern.

---

## Custom shader (simplified)

Vertex shader: pass UV to fragment.

Fragment shader:

1. Sample texture
2. If alpha < threshold → `discard` (transparent)
3. Detect alpha edges → mix yellow border color
4. Output `gl_FragColor` with opacity uniform

You tune visuals via **uniforms** (`metalStrength`, `edgeMix`, …) without rewriting GLSL for small tweaks.

---

## TextGeometry (countdown only)

```javascript
new TextGeometry('5', { font, size, height, bevelEnabled: true, … });
```

Extrudes 2D font outlines into 3D meshes. Heavy but fine for 10 letters total.

---

## Render loop

Hex cards:

```javascript
gsap.ticker.add(cardsFrame);

function cardsFrame(_time, deltaTime) {
  if (!cardsAnimating) return;
  tickCardsSpin(deltaTime);
  applyState();
  updateDepthSort();
  renderer.render(scene, camera);
}
```

When ink phase starts, `cardsAnimating = false` — loop skips render (saves GPU).

SSR mini-renderer uses its own `requestAnimationFrame` loop (always on while page open).

---

## Depth sorting

Gold card gets higher `renderOrder` so it draws on top when z-fighting. Other cards sorted by world Z:

```javascript
root.userData.face.renderOrder = Math.round(depthSortPos.z * 20);
```

---

## Common Three.js terms → this repo

| Term | In Gatya |
|------|----------|
| Object3D | `Group`, `Mesh` |
| World matrix | Built from parent chain (cylinder → tilt → spin → card) |
| UV | Texture coordinates on card plane |
| Uniform | Shader parameter (opacity, border color) |
| DoubleSide | Cards visible from back during spin |
| toneMapping | `ACESFilmicToneMapping` on hex renderer |

---

## What this repo does NOT use

- GLTF/OBJ models
- Skinned animations / morph targets
- Raycasting / interaction
- Post-processing passes (bloom, etc.)
- Instancing
- Physics (Cannon.js, etc.)

Motion blur = **CSS filter on canvas**, not Three.js post-FX.

---

## Minimal experiment template

To test a idea in isolation, copy pattern from hex init:

```javascript
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 50);
camera.position.z = 5;

const mesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1.5),
  new THREE.MeshBasicMaterial({ map: texture, transparent: true })
);
scene.add(mesh);

function frame() {
  requestAnimationFrame(frame);
  mesh.rotation.y += 0.01;
  renderer.render(scene, camera);
}
frame();
```

Then integrate successful experiments into `gatya-unified.mjs`.

---

## Further reading

- [Three.js docs — Fundamentals](https://threejs.org/manual/#en/fundamentals)
- [GSAP docs — Timeline](https://gsap.com/docs/v3/GSAP/Timeline/)
- Repo: [Hex cylinder](./06-hex-cylinder.md), [Architecture](./03-architecture.md)

[Next: Legacy & gotchas →](./12-legacy-and-gotchas.md)
