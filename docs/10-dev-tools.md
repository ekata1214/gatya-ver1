# 10 — Dev tools

[← Tuning guide](./09-tuning-guide.md) · [Index](./README.md) · [Next: Three.js primer →](./11-threejs-for-web-devs.md)

---

## Local server

```bash
python3 serve.py
# PORT=9000 python3 serve.py   # optional override
```

| URL | Purpose |
|-----|---------|
| http://localhost:8878/show | **Production show** (recommended) |
| http://localhost:8878/cards-six.html | Same as above |
| http://localhost:8878/ref | Dual reference viewer |
| http://localhost:8878/reference-viewer.html | Single ref scrubber |
| http://localhost:8878/ref-calibrate.html | Overlay + timeline seek |

---

## Reference dual viewer (`/ref`)

**File:** `reference-dual-viewer.html`

Side-by-side:

- `reference-r2.mp4` (60fps source)
- `reference-r2-24fps.mp4` (24fps — **primary timing reference**, 1.917s)

Shared seek slider syncs both videos. Use to inspect keyframes:

| Button / time | Phase |
|---------------|-------|
| 0.37s | gather-end |
| 0.50s | formed |
| 0.62s | hold |
| 1.04s | pre-rise |

Console helpers after load:

```javascript
window.seekRef(1.04);   // seek both to 1.04s
window.KEYFRAMES;       // named times
```

---

## Ref calibrate (`ref-calibrate.html`)

Overlays a **semi-transparent reference frame** on the live hex 3D render.

Features:

- Timeline slider → calls `show.seekCardsTime(t)`
- Quick buttons for 0.37, 0.50, 0.62, 1.04
- Prints `measureCardsScreenBBox()` vs target bbox

Use when tuning `FORM`, `CARD_W`, or camera so hex **screen position/size** matches ref.

Boot uses same `initGatyaShow()` with dummy elements for unused layers.

---

## before / after compare UI

Built into `cards-six.html`:

- Top toggle: **before** | **after**
- Side panels (wide screens): explanation + SVG from `compare-panels.mjs`
- Calls `playShow(mode)` → reloads spatial profile + timeline

**after** = production `REF_MATCH` (ref-final-v3)  
**before** = legacy `BEFORE_MATCH` (intentionally wrong height for comparison)

When documenting changes, update `COMPARE_NOTE` in `compare-panels.mjs`.

---

## Programmatic API

Returned from `await initGatyaShow({ … })`:

### `playShow(mode?)`

Restart full show. Optional `'before'` | `'after'`.

### `seekCardsTime(t)`

Seek hex timeline to `t` seconds, pause, render one frame.

```javascript
show.seekCardsTime(0.37);  // gather complete
```

### `measureCardsScreenBBox()`

Returns normalized screen bounds of hex cards:

```javascript
{ cx, cy, w, h }  // 0–1 relative to stage
```

Used by calibrate page to compare against ref targets.

### `getRefConstants()`

Snapshot of active `FORM`, `ROT`, `RISE`, `T`, `TOTAL`, etc.

### Mode helpers

```javascript
show.setGatherMode('after');
show.getGatherMode();
show.setCupRiseMode('after');  // cylinder verticalize behavior
show.getPostShow('after');     // POST_SHOW_AFTER object
```

---

## Cache busting

Modules load with query string:

```javascript
import(`./src/gatya-unified.mjs?v=${ASSET_V}`);
```

After editing `.mjs` files, increment `ASSET_V` in `cards-six.html` (e.g. `20260628-tuning-a`) and hard reload.

---

## Offline script

**`scripts/fit-ref-pose.py`** — helper for projection/pose fitting (not part of runtime). Run manually when doing numerical alignment work.

---

## Debugging tips

| Symptom | Check |
|---------|-------|
| Blank page on double-click HTML | Must use `serve.py`, not `file://` |
| Old code after edit | Bump `ASSET_V`, Cmd+Shift+R |
| Fire flashes on countdown | Search for `fireVideo.load()` — should not run mid-show |
| SSR drops twice | Ensure `startInkPhase` doesn't call `dropSsrCard` |
| No sound | `SE_ENABLED` in `se.mjs`; need pointerdown for unlock |
| Countdown missing font | Network / `./assets/fonts/` paths |
| Hex wrong only in before mode | Expected — compare uses `BEFORE_MATCH` |

### Console access

After boot, the show instance is not global by default. Temporarily expose in `cards-six.html`:

```javascript
window.show = show;
```

Then in DevTools:

```javascript
show.seekCardsTime(1.04);
show.measureCardsScreenBBox();
```

---

## Recommended validation loop

1. Make constant change in `ref-match-config.mjs`
2. Bump `ASSET_V`
3. `/show` — full playthrough
4. `/ref` — scrub keyframes
5. `ref-calibrate.html` — bbox at 0.37 and 1.04
6. Toggle before/after if gathering changed
7. Update `compare-panels.mjs` if needed

[Next: Three.js primer →](./11-threejs-for-web-devs.md)
