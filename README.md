# Gatya — SSRオリパガチャ演出

`r2.mp4` / `r2_2.mp4`（24fps）をリファレンスにした、1ページ統合のガチャ演出プロトタイプ。

---

## クイックスタート

```bash
cd /path/to/gatya
python3 serve.py
```

ブラウザで開く（いずれか）:

| URL | 内容 |
|-----|------|
| http://localhost:8878/show | 本番演出（推奨） |
| http://localhost:8878/cards-six.html | 同上 |
| http://localhost:8878/ref | 両リファレンス同期ビューア |
| http://localhost:8878/reference-viewer.html | r2_2 単体スクラブ |

**注意**

- `file://` では動きません（ES Module 制限）
- `python3 -m http.server` では `/cards-six`（拡張子なし）が 404 になります → **`serve.py` を使う**
- 修正後は **Cmd+Shift+R** でハードリロード

---

## アーキテクチャ

### エントリ

```
cards-six.html  →  src/gatya-unified.mjs
```

`ink-sumi.html` は `cards-six.html` へのリダイレクトのみ。**ページ遷移で演出をつながない。**

### 1ページ統合の原則

- 六角筒・SSR・墨汁・カウントダウン・暗転・ホワイトアウトを **同一 DOM** で継続
- 炎動画 `#fire-bg` は暗転までループ（暗転後 pause）
- 5.5秒相当で `location.href` しない → `startInkPhase()` でレイヤー切替のみ
- 炎 SE・SSR カードはリロード・頭出しリセット禁止

### レイヤー（下 → 上）

| z | 要素 | 役割 |
|---|------|------|
| 0 | `#fire-bg` | 炎動画（暗転までループ） |
| 1 | `#ink-test` | 墨汁動画（multiply・カウントダウン中） |
| 5 | `#cards-canvas` | 六角筒 WebGL（透明） |
| 90 | `#ssr-layer` | SSR 動画 + SSR カード canvas |
| 100 | `#countdown-canvas` | カウントダウン 3D 文字 |
| 150 | `#darken` | 暗転 |
| 250 | `#whiteout` | ホワイトアウト |
| 1000 | `#replay` | リプレイボタン |

---

## リファレンス動画

| ファイル | 説明 |
|----------|------|
| `reference-r2.mp4` | r2（60fps ソース） |
| `reference-r2-24fps.mp4` | r2_2（24fps・46f・**1.917s**） |

両者とも **タイミングは 1.917s で共通**。調整の主参照は 24fps 版。

### リファレンス・キーフレーム（秒）

| 時刻 | フェーズ | 内容 |
|------|----------|------|
| 0.00 | — | 炎のみ |
| 0.15 | gather-start | カード出現 |
| 0.25 | gather-mid | 対角線で飛来（個別の筋） |
| 0.37 | gather-end | 六角リング形成完了 |
| 0.49 | stand-end | 立ち姿勢へ |
| 0.50 | formed | 形成安定（**画面中央**・やや下） |
| 0.62 | hold | ホールド中 |
| 1.04 | pre-rise | 上昇開始前 |
| 1.25 | rise-mid | 上昇中・垂直化 |
| 1.42 | rise-end | 上昇完了 |
| 1.92 | exit-end | 消失完了 |

**形成位置**: リファレンス上、完成時（0.37〜0.50s）は **左右中央**。左端ではない。集結途中（0.15〜0.30s）は斜め筋が左から見えることがある。

---

## タイムライン（cards-six 開始 = 0）

### 六角筒フェーズ（`REF_TOTAL` ≈ 1.92s）

| 区間 | 秒数 | 内容 |
|------|------|------|
| 炎のみ | 0.15 | `CARD_INTRO_DELAY` |
| slide | 0.22 | 対角線集結・スピン・傾き・モーションブラー |
| stand | 0.12 | 立ち姿勢へ回転 |
| hold | 0.55 | 位置ドリフト・スケール・奥行き・カード垂直化 |
| rise | 0.38 | 垂直化・上昇・フェード |
| exit | 0.50 | 消失・モーションブラー |

**イージング**: 全区間 `power2.out`（区間別 tween）

**モーションブラー**: 集結ピーク 9px / 消失ピーク 14px

### SSR 以降（現行 `POST_SHOW_AFTER`）

| 内容 | タイミング |
|------|------------|
| SSR 降下 | 筒上昇開始 `t3` + 0.1s（すれ違い） |
| 墨汁フェーズ | SSR 着地 + 0.12s |
| カウントダウン | 墨汁後 + 1.1s |
| LAST → 暗転 | +1.0s |
| 暗転 | 2.0s |
| ホワイト SSR | 暗転後フェードイン |
| ホワイトアウト | +2.0s ホールド後 0.9s |

---

## 六角筒仕様（本番: `ref-final-v3`）

設定の単一ソース: **`src/ref-match-config.mjs`**

### 集まり方（after・本番）

- **対角線 per-card**（`GATHER_DIAG`）
- 筒グループは `FORM.x = 0`（中央）で固定
- **下から組み上げ**: `yStart -0.72` → `FORM.y -0.58`
- `reachEase 1.35` — 集結前半は外側に長い筋

### 主要パラメータ

| 項目 | 値 |
|------|-----|
| `CARD_W` | 0.72 |
| `HEX_GAP_FINAL` | 0.078 |
| `GATHER_ROTATIONS` | 2.167（青 = 右上 60°） |
| `FORM` 傾き | rotX 68° / rotZ -5.5° / rotYOff 4° |
| `FORM.scaleMul` | 1.06 |
| `ROT.poseScale` | 1.12 |
| ホールド | driftY -0.18 / z → 0.16 |
| 上昇 | `RISE.mid` y 2.05 z 0.88 / 垂直化 0.14s |
| カメラ | fov 44 / pos (0, 0.12, 6.05) / look (0, -0.18, 0.22) |

### 3D 構造（壊さない）

```
cylinder (位置 x/y/z)
└ cylinderTilt (rotX, rotZ)
 └ cylinderSpin (rotation.y = spin + rotYOff)
 └ カード×6（個別 rotation.x ＝ コップ傾き）
```

- カード装飾: `makeCardGlowMaterial()` — PNG アルファ境界の黄色縁グローのみ
- 上昇時: `cupRiseMode === 'after'` — 上昇開始と同時に筒全体が垂直化

### before 比較モード

画面上部 **before** ボタンで切替。`BEFORE_MATCH`（ref-match-all）を適用:

- `FORM.y -0.40` 固定（高すぎた版）
- `yStart` なし
- 放射状集結 + 左下スライド（`gatherMode === 'before'`）

---

## 比較 UI

`cards-six.html` 上部 **before / after** + 左右説明パネル。

| ファイル | 役割 |
|----------|------|
| `src/compare-panels.mjs` | `COMPARE_NOTE`（topic / SVG / 文章） |
| `cards-six.html` | `ASSET_V` キャッシュバスティング |

**修正のたびに更新すること**

1. `src/gatya-unified.mjs` — 本体
2. `src/ref-match-config.mjs` — 数値定数
3. `src/compare-panels.mjs` — 左右説明
4. `cards-six.html` の `ASSET_V` を更新

---

## ファイル構成

```
gatya/
├── cards-six.html          # メインエントリ
├── serve.py                # ローカルサーバー（URL エイリアス付き）
├── show.html               # cards-six へリダイレクト
├── reference-r2.mp4        # リファレンス（60fps）
├── reference-r2-24fps.mp4  # リファレンス（24fps）
├── reference-dual-viewer.html
├── reference-viewer.html
├── ref-calibrate.html      # 重ね合わせキャリブレーション用
├── src/
│   ├── gatya-unified.mjs   # 演出本体
│   ├── ref-match-config.mjs # 六角筒数値（ref-final-v3）
│   ├── compare-panels.mjs  # before/after 説明
│   ├── countdown-three-overlay.mjs
│   └── se.mjs              # SE 管理
├── scripts/
│   └── fit-ref-pose.py     # 投影フィット用スクリプト
└── .cursor/rules/          # 開発ルール（baseline / workflow）
```

---

## SE 一覧

| ファイル | 用途 |
|----------|------|
| `re fire se.mp3` | 炎ループ（初回 0.1s フェードイン） |
| `六角筒上昇.mp3` | 筒上昇開始 |
| `ssr card登場.mp3` | SSR 降下開始 |
| `和太鼓でドン.mp3` | カウントダウン 5〜1 |
| `LAST.mp3` | LAST 表示 |
| `white ssr.mp3` | ホワイト SSR フェードイン |

---

## Git バックアップ

```bash
git log -1
# 012915a Backup: r2/r2_2 hex cylinder ref-final-v3 and compare UI.
```

戻す場合:

```bash
git checkout 012915a
```

`.gitignore` で除外: `*.mov`（巨大素材）/ `tmp-r2-ref/` / `.cursor/`（rules 以外）

---

## 既知の注意点

1. **形成位置の見え方**  
   after 本番は `FORM.x = 0`（中央狙い）。集結途中は左から飛ぶカードがあり「左で形成」と感じやすい。完成は 0.37s 以降を見ること。

2. **before ボタン**  
   before 選択中は左下スライド + 放射状集結になり、リファレンスと大きく異なる。

3. **レイアウト**  
   左右説明パネル表示時、`#stage` は `100vw` 直指定ではなくパネル分を除いた幅で計算（潰れ防止済み）。

4. **未解決・今後の調整候補**  
   実画面とリファレンスのピクセル完全一致は未達。水平位置・サイズの微調整は `ref-match-config.mjs` の `FORM` / `CARD_W` / `CAMERA` で行う。

---

## 関連ドキュメント

- `.cursor/rules/gatya-show-baseline.mdc` — 確定ベースライン（六角筒 3D 構造・SSR・シェーダー）
- `.cursor/rules/gatya-compare-workflow.mdc` — 修正時ワークフロー
