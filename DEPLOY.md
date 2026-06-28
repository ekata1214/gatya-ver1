# Deploy — GitHub Pages

本番公開用の最小バンドルを `site/` にビルドし、GitHub Actions で GitHub Pages にデプロイする。

開発はリポジトリ直下（`cards-six.html` + 全 `src/`）で行い、公開時だけ `site/` に必要ファイルをコピーする。

---

## 概要

```
repo root (開発)                    site/ (本番バンドル)
─────────────────                   ─────────────────────
cards-six.html  ──build-site.py──►  index.html
src/*.mjs       ──(7 modules)────►  src/*.mjs
動画・SE・PNG   ──(manifest)─────►  同名ファイル
assets/ink/     ──copy tree──────►  assets/ink/
assets/fonts/   ──copy tree──────►  assets/fonts/
                                    .nojekyll

site/ ──GitHub Actions────────────► https://<user>.github.io/<repo>/
```

| 項目 | 値 |
|------|-----|
| ビルドスクリプト | `scripts/build-site.py` |
| 出力先 | `site/`（生成物は git に含めない） |
| ワークフロー | `.github/workflows/deploy-pages.yml` |
| 公開エントリ | `index.html`（`cards-six.html` のコピー） |

---

## `site/` を git にコミットする必要はあるか？

**このリポジトリの構成では不要。** GitHub Pages には 2 つの公開方式がある。

| 方式 | `site/` をコミット？ | このリポジトリ |
|------|---------------------|----------------|
| **GitHub Actions** | 不要 — CI が push のたびに `build-site.py` を実行し、生成物を artifact として Pages に渡す | **こちらを使用** |
| **Deploy from branch**（`/docs` や `/` フォルダ指定） | **必要** — GitHub がリポジトリ内の静的ファイルをそのまま配信する | 未使用 |

`site/*` は `.gitignore` で除外しているのは意図的。ソース（`cards-six.html`, `src/`, 動画・SE など）はリポジトリルートにあり、Actions がデプロイ時に `site/` を組み立てる。

**Settings → Pages → Source が「GitHub Actions」になっていることを確認すること。** 「Deploy from branch」で `/site` を指定しても、中身がコミットされていないため公開されない。

---

## 何が含まれるか

### 含まれる（本番に必要なものだけ）

| カテゴリ | ファイル |
|----------|----------|
| HTML | `index.html` |
| JS | `gatya-unified.mjs`, `countdown-three-overlay.mjs`, `ink-three-overlay.mjs`, `ink-procedural.mjs`, `se.mjs`, `ref-match-config.mjs`, `card-bloom-composer.mjs` |
| 動画 | `re fire2.mp4`, `white ssr.mp4` |
| SE | `re fire se.mp3`, `六角筒上昇.mp3`, `ssr card登場.mp3`, `和太鼓でドン.mp3`, `LAST.mp3`, `white ssr.mp3` |
| カード画像 | `blue/silver/rainbow/gold/green/red/ssr card.png` |
| アセット | `assets/ink/*`, `assets/fonts/*` |
| その他 | `.nojekyll`（Jekyll 無効化） |

### 含まれない

- `docs/`（Markdown ドキュメント）
- 比較 UI（`compare-panels.mjs`、before/after ピッカーは HTML 上 CSS で非表示）
- リファレンス動画・キャリブレーション HTML（`reference-*.mp4`, `ref-calibrate.html` など）
- 旧プロトタイプ HTML（`countdown.html`, `ink-generate.html` など）
- レガシー `src/managers/`, `GachaScene.js` など
- `serve.py`, `scripts/`（ビルド時のみ CI が使用）

マニフェストの一覧は `scripts/build-site.py` 内の `SRC_MODULES` / `MEDIA_ROOT` / `HTML_PAGES` が唯一のソース。

---

## ビルド

### コマンド

```bash
python3 scripts/build-site.py
```

### 動作

1. `site/` をクリア（`site/README.md` は残す）
2. 上記マニフェストのファイルをリポジトリルートからコピー
3. `cards-six.html` を `index.html` としてコピー（GitHub Pages のルートエントリ）
4. `.nojekyll` を書き出し

### ローカルプレビュー

```bash
python3 scripts/build-site.py
python3 serve.py --site
```

ブラウザで `http://localhost:8878/` を開く。`--site` は `site/` をドキュメントルートとして配信する。

開発用サーバー（リポジトリ全体）との違い:

| コマンド | ルート | 用途 |
|----------|--------|------|
| `python3 serve.py` | リポジトリ直下 | 開発・比較 UI・リファレンス |
| `python3 serve.py --site` | `site/` | 本番と同じバンドルの確認 |

---

## デプロイ（GitHub Pages）

### 初回セットアップ

1. リポジトリを GitHub に push する
2. **Settings → Pages → Build and deployment**
3. **Source** を **GitHub Actions** に設定する（`Deploy from branch` ではない）

### 自動デプロイ

`main` への push のたびに `.github/workflows/deploy-pages.yml` が実行される。

```
push to main
    │
    ▼
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   build     │────►│ upload artifact  │────►│   deploy    │
│ build-site  │     │ path: site       │     │ Pages CDN   │
└─────────────┘     └──────────────────┘     └─────────────┘
```

| ジョブ | 内容 |
|--------|------|
| `build` | checkout → `python3 scripts/build-site.py` → `site/` を artifact としてアップロード |
| `deploy` | artifact を GitHub Pages に公開 |

手動実行: **Actions → Deploy GitHub Pages → Run workflow**

### 公開 URL

プロジェクトサイト（通常）:

```
https://<github-username>.github.io/<repo-name>/
```

例: リポジトリが `gatya-ver1` なら `https://amon.github.io/gatya-ver1/`

`index.html` がルートに配信される（ソースは `cards-six.html`）。

---

## 公開前チェックリスト

1. **`SHOW_DEV_UI = false`** — `cards-six.html` 内（本番 UI・手動再生）
2. **`ASSET_V` を更新** — `cards-six.html` 内。JS 変更後はキャッシュバスティング用に日付や内容を変える
3. **ローカルで本番バンドルを確認**

   ```bash
   python3 scripts/build-site.py && python3 serve.py --site
   ```

4. `main` に merge / push する
5. **Actions** タブでワークフローが成功したことを確認する
6. **Settings → Pages** に表示される URL を開く

---

## トラブルシューティング

### `site/ is empty. Run: python3 scripts/build-site.py`

`serve.py --site` をビルド前に実行した。先に `python3 scripts/build-site.py` を走らせる。

### `build-site: missing file: …`

マニフェストに載っているメディアがリポジトリにない（未コミット・`.gitignore` など）。該当ファイルを追加するか、`scripts/build-site.py` のマニフェストを更新する。

### デプロイ後も古い JS が動く

- `ASSET_V` を更新して push したか確認
- ブラウザでハードリロード（Cmd+Shift+R）

### Actions は成功するが Pages が 404

- **Settings → Pages → Source** が **GitHub Actions** になっているか（**Deploy from branch** になっていないか）
- 初回は `github-pages` environment の作成承認が必要な場合がある

### 「Deploy from branch」で `/site` を指定したが何も出ない

このプロジェクトは Actions デプロイ用。`site/` は git に含まれないため、branch 方式では動かない。**Source を GitHub Actions に切り替える。**

### `file://` では動かない

ES Modules と CORS の制約のため、必ず HTTP 経由（ローカルは `serve.py`、本番は GitHub Pages）で開く。

---

## ファイル一覧（デプロイ関連）

| ファイル | 役割 |
|----------|------|
| `scripts/build-site.py` | `site/` 生成スクリプト |
| `site/README.md` | 出力フォルダの短い説明（git に含む） |
| `site/*`（README 以外） | 生成物（`.gitignore` で除外） |
| `.github/workflows/deploy-pages.yml` | CI/CD ワークフロー |
| `serve.py --site` | 本番バンドルのローカル配信 |

新しい本番アセット（動画・SE・画像）を追加したら **`scripts/build-site.py` のマニフェストを更新** すること。
