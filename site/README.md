# site/ — GitHub Pages publish folder

Generated output. **Do not edit by hand** — edit the repo root sources and rebuild.

```bash
python3 scripts/build-site.py
python3 serve.py --site   # local preview at http://localhost:8878/
```

## Contents (minimal production bundle)

| Path | Role |
|------|------|
| `index.html` | Main show (`cards-six.html` copy, `SHOW_DEV_UI = false`) |
| `src/*.mjs` | Runtime modules only (no compare-panels, no legacy managers) |
| `assets/ink/` | Ink countdown layers |
| `assets/fonts/` | Countdown 3D text fonts |
| `*.mp4` / `*.mp3` / `* card.png` | Video, SE, card textures |

## GitHub Pages

本番公開は **`site/`**（`python3 scripts/build-site.py` で生成）。詳細は **[DEPLOY.md](../DEPLOY.md)**。
