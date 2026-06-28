# 02 — 表現手段（5種類）

[← 全体像](./01-overview.md) · [目次](./README.md) · [次: タイムライン →](./03-timeline-and-drawers.md)

---

## この演出で使う5種類

`#stage` に映るピクセルは、次のいずれかから来ます。

| 種類 | DOM | 描画 | だいたいの駆動 |
|------|-----|------|---------------|
| **A. 動画** | `<video>` | ブラウザの動画デコーダ | `play()`, `currentTime`, `opacity` |
| **B. WebGL** | `<canvas>` + Three.js | `WebGLRenderer.render()` | GSAP → 状態反映 → render |
| **C. DOM 3D** | `<div>` + CSS `perspective` | ブラウザのレイアウト/合成 | GSAP transform |
| **D. CSS オーバーレイ** | 単色 `<div>` | `background` + `opacity` | GSAP opacity |
| **E. CSS filter** | canvas 要素への filter | GPU が canvas 画像を加工 | GSAP `filter`（六角筒ブラーのみ） |

---

## A. 動画

### 使っているレイヤー

| ID | 素材 | z-index | 備考 |
|----|------|---------|------|
| `#fire-bg` | `re fire2.mp4` | 0 | 暗転までループ |
| `#ink-test` | `ink test2.mp4` | 1 | `multiply` 合成。数字ごとに1回 |
| `#white-ssr` | `white ssr.mp4` | `#ssr-layer` 内 | 終盤まで非表示 |

### 動きの仕組み

動画は **中身が勝手にコマ送り** されます。コードがピクセルを tween するわけではありません。

やっているのは：

- 再生 / 停止
- 墨同期で `currentTime = 0` に戻す
- LAST 後に pause（フリーズ）
- 終盤用に **opacity** だけ tween

### 直すとき

| 目的 | 触る場所 |
|------|----------|
| 見た目（炎・墨・白） | `.mp4` 差し替え |
| 墨のタイミング | `syncInkToDigit()`, `onDigitStart` |
| 墨の乗り方 | CSS `mix-blend-mode`, opacity |
| 炎を消すタイミング | 終盤 GSAP（`gatya-unified.mjs`） |

---

## B. WebGL（Three.js）

### キャンバスは3つ独立

| キャンバス | シーン内容 | カメラ | 主に出るフェーズ |
|-----------|-----------|--------|-----------------|
| `#cards-canvas` | 六角筒・カード6枚 | 透視投影 | B |
| `#countdown-canvas` | 3D 文字 5→1→LAST | 透視投影 | D |
| `#ssr-card-canvas` | カード1枚（平面） | 正投影 | C 以降（SSR 表示中） |

### 動きの仕組み

```
GSAP が毎 tick で数値更新
    → Three.js の position / rotation / uniform に反映
    → renderer.render()
    → 透明部分から下のレイヤーが見える
```

六角筒だけ `gsap.ticker.add(cardsFrame)` で、`cardsAnimating` が true の間だけ render。

カウントダウンは `countdown-three-overlay.mjs` 内のループ。  
SSR 子 canvas は `requestAnimationFrame` で常時 render するが、**軌道は親 DOM の transform**。

### WebGL の「中」の階層（六角筒）

DOM の z-index とは別に、**1キャンバス内** に3D階層があります：

```
Scene
└── cylinder
    └── cylinderTilt
        └── cylinderSpin
            └── card × 6
                └── face（Mesh + シェーダー）
```

奥行き順・`renderOrder` で gold カードを手前に、など。

### シェーダー（見た目専用）

カード面は `makeCardGlowMaterial()` の **GLSL**：

- PNG を貼る
- アルファ縁から黄色グロー

**動き** → GSAP。**縁の光・メタル感** → uniform / GLSL。

### 直すとき

| 目的 | 触る場所 |
|------|----------|
| 六角筒の動き | GSAP + `ref-match-config.mjs` |
| カメラ | `CAMERA` |
| カード縁 | `CARD_FX`, シェーダー |
| カウントダウン演出 | `countdown-three-overlay.mjs` |
| SSR カードの絵 | `ssr card.png`, `SSR_CARD_FX` |

---

## C. DOM 3D（SSR カードの動き）

```html
<div id="ssr-layer">              <!-- perspective: 900px -->
  <video id="white-ssr" />          <!-- レイヤー内 z:0 -->
  <div id="ssr-card-wrap">          <!-- GSAP の transform 対象 -->
    <canvas id="ssr-card-canvas" />
  </div>
</div>
```

ステージ上 z-index **90**（六角筒 canvas より手前、カウントダウンより奥）。

GSAP が `#ssr-card-wrap` の **CSS 3D transform** を直接 tween：

- `x`, `y`, `z`, `scale`
- `rotationX/Y/Z`
- 中央基準 `xPercent/yPercent: -50`

**降下軌道は DOM 側。** 子 canvas はカード絵を描くだけ。

### 直すとき

| 目的 | 触る場所 |
|------|----------|
| 降下・着地 | `SSR_DROP`, `SSR_POSE` |
| バウンス | `startSsrBounce()` |
| パース感 | `#ssr-layer` の `perspective` |
| 画面上の大きさ | `#ssr-card-wrap` の width（CSS） |

---

## D. CSS オーバーレイ（暗転・ホワイトアウト）

| ID | 色 | z-index |
|----|-----|---------|
| `#darken` | 黒 | 150 |
| `#whiteout` | 白 | 250 |

全面 `absolute`。**opacity だけ** 変える。

カウントダウン canvas より手前なので、不透明になれば下全部隠せる。

---

## E. CSS filter（六角筒のモーションブラー）

WebGL の中ではなく **`#cards-canvas` 要素全体** に：

```javascript
filter: blur(${motionBlur.px}px)
```

集結・消失ピーク時だけ GSAP が `motionBlur.px` を tween。canvas の bitmap ごとぼかす。

---

## 比較表

| | 動画 | WebGL | DOM 3D | CSS overlay | filter |
|---|------|-------|--------|-------------|--------|
| **動かす** | 再生位置 | GSAP→3D | GSAP transform | opacity | blur 半径 |
| **描く** | デコーダ | Three.js | ブラウザ | ブラウザ | GPU |
| **透明** | 基本なし | あり | canvas 部分 | なし | — |
| **用途** | 背景 FX | カード・数字 | SSR 軌道 | フェード | 速度感 |

---

## 何を変えたいとき、どれを学ぶ？

| 変えたいもの | まず見る |
|-------------|----------|
| 炎の雰囲気 | 動画 A |
| 六角筒の位置・回転 | WebGL B + GSAP |
| カードの黄色い縁 | WebGL シェーダー B |
| SSR の降り方・角度 | DOM 3D C |
| 画面を真っ暗に | CSS D |
| 集結時の筋ブラー | filter E |
| カウントダウンの spin | WebGL B + GSAP |

[次: タイムライン →](./03-timeline-and-drawers.md)
