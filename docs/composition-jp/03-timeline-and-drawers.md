# 03 — タイムラインと「誰が描くか」

[← 表現手段](./02-visual-mediums.md) · [目次](./README.md) · [次: フェーズ別レイヤー →](./04-layer-stack-by-phase.md)

---

## 時計は1本ではない

最初から最後まで **1本の GSAP タイムライン** だけ、というわけではありません。

| 時計 | 担当範囲 | 場所 |
|------|----------|------|
| **六角筒マスター TL** | 炎待ち → 六角筒 → SSR/墨の予約 | `buildCardsTimeline()` |
| **カウントダウン TL** | 5→1→LAST | `countdown-three-overlay.mjs` → `play()` |
| **終盤 TL** | 暗転 → 白 SSR → ホワイトアウト | `onLastShown` 内 |
| **SSR バウンス** | 上下 yoyo ループ | `startSsrBounce()` |
| **動画の時計** | 炎ループ、墨の頭出し | `<video>` ネイティブ |

すべて `playShow()`（初回 or リプレイ）から起動します。

---

## フェーズ一覧（本番 `after`）

`playShow()` 開始を **t = 0** とした目安。定数は [演出タイムライン](../05-show-timeline.md)。

| フェーズ | 時間 (s) | きっかけ | 動くもの | 表現手段 | ファイル |
|---------|----------|---------|---------|----------|----------|
| **A0** 炎のみ | 0 – 0.15 | TL 開始 | 動画コマ | 動画 A | `cards-six.html` |
| **B1** 集結 | 0.15 – 0.37 | `gather.t` | 筒 + 6枚 | WebGL B | `gatya-unified.mjs` |
| **B2** 立ち | 0.37 – 0.49 | `t1` | 筒の傾き | WebGL B | 同上 |
| **B3** ホールド | 0.49 – 1.04 | `t2` | ドリフト・垂直化 | WebGL B | 同上 |
| **B4** 上昇 | 1.04 – 1.42 | `t3` | 垂直化・軌道 | WebGL B | 同上 |
| **B5** 消失 | 1.42 – 1.92 | `t4` | 退出・フェード | WebGL B | 同上 |
| **C1** SSR 降下 | 〜1.14 – 〜1.64 | `dropSsrCard()` | wrap transform | DOM 3D C + WebGL 子 | 同上 |
| **C2** SSR バウンス | 〜1.64〜 | `startSsrBounce()` | y 揺れ | DOM 3D C | 同上 |
| **D0** レイヤー切替 | 〜1.76 | `startInkPhase()` | canvas opacity | DOM/CSS | `showInkLayer()` |
| **D1** カウントダウン | 〜2.86〜 | `countdownCtrl.play()` | 3D 文字 | WebGL B | `countdown-three-overlay.mjs` |
| **D2** 墨（各数字） | 数字ごと | `onDigitStart` | 墨動画頭出し | 動画 A | `syncInkToDigit()` |
| **E1** LAST 表示 | 6番目スロット | `onLastShown` | LAST 固定 | WebGL B | カウントダウン側 |
| **E2** 墨フリーズ | LAST+0.5s | `freezeInk()` | 動画 pause | 動画 A | `gatya-unified.mjs` |
| **E3** 暗転 | LAST+1.0s | 終盤 TL | `#darken` | CSS D | `onLastShown` |
| **E4** 白 SSR | 暗転ピーク後 | 終盤 TL | 白動画 + SSR | 動画+DOM+WebGL | 同上 |
| **E5** ホワイトアウト | ホールド後 | 終盤 TL | `#whiteout` | CSS D | 同上 |

**重なり:** C1（SSR）は B4（上昇）の最中に始まる。D0 で六角筒 canvas は消えるが SSR は継続。

---

## フェーズ別：駆動 → 描画の流れ

### A〜B — 六角筒

```
GSAP buildCardsTimeline()
  → anim, spin, gather, cardUpright, motionBlur を tween
  → applyState() + applyCardHexGather()
  → gsap.ticker の cardsFrame()
  → Three.js が #cards-canvas を render
```

炎は **独立ループ**。位置は GSAP では動かさない。

### C — SSR

```
GSAP dropSsrCard() + startSsrBounce()
  → #ssr-card-wrap を tween
  → シェーダー opacity
  → rAF で #ssr-card-canvas render
```

D0 までは六角筒 canvas も **下で** 描画されうる。

### D — カウントダウン + 墨

```
startInkPhase()
  → 六角筒 canvas opacity 0、カウントダウン canvas opacity 1

カウントダウン GSAP
  → メッシュの scale/rotation/position
  → #countdown-canvas render

各数字 onDigitStart
  → inkVideo.currentTime = 0; play()
  → 炎の上に multiply 合成
```

### E — 終盤

```
onLastShown → delayedCall → gsap.timeline()
  → darken, fire, countdown, ink の opacity
  → whiteSsr 再生 + opacity
  → SSR カードフェードイン
  → whiteout opacity
```

---

## 要素がタイムラインをまたぐとき

| 要素 | 出るフェーズ | 表現手段は変わる？ |
|------|-------------|-------------------|
| **炎** | A → E3 | ずっと動画。E3 で非表示 |
| **六角筒** | B のみ | WebGL。D 以降 canvas 非表示 |
| **SSR カード** | C → 終了 | DOM 3D + 子 WebGL のまま |
| **墨** | D（各数字）→ E2 | 動画。フリーズ後非表示 |
| **数字 5〜1** | D → E3 | WebGL。暗転で消す |
| **LAST** | D 後半 → E3 | WebGL。退出アニメなし |
| **白 SSR 動画** | E4〜 | `#ssr-layer` 内動画 |
| **暗転** | E3 – E4 | CSS |
| **ホワイトアウト** | E5 | CSS |

---

## キャンバス表示の切り替え

六角筒用とカウントダウン用は **同時に見せない** 設計：

| 時間帯 | `#cards-canvas` | `#countdown-canvas` |
|--------|-----------------|---------------------|
| A – B5 | 表示 | 非表示 |
| C（SSR 中、筒まだ） | 表示 | 非表示 |
| D – E3 | 非表示 | 表示 |
| E3 以降 | 非表示 | 非表示 |

`#ssr-card-canvas` は `#ssr-card-wrap` が見えている間 render しうる。

---

## 予約の入口（コード）

| イベント | 関数 | 意味 |
|---------|------|------|
| 演出開始 | `playShow()` | 全レイヤーリセット + 六角筒 TL |
| SSR 降下 | `dropSsrCard()` | 六角筒 TL の `ssrAt` |
| 墨フェーズ | `startInkPhase()` | 六角筒 TL の `inkAt` |
| カウントダウン開始 | `countdownCtrl.play()` | `startInkPhase` 内 delay |
| 終盤 | `onLastShown` | カウントダウンからコールバック |
| リプレイ | `playShow()` | 最初から |

---

## 時間軸イメージ（ASCII）

```
時間 ───────────────────────────────────────────────────────────►

炎動画       ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░
六角筒 WebGL  ░░████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░
SSR DOM+GL   ░░░░░░░░░░░░█████████████████████████████████████
墨動画       ░░░░░░░░░░░░░░░░░░░░░░▌▌▌▌▌▌▌░░░░░░░░░░░░░░░░░░░░
カウント GL  ░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████████░░░░░░
暗転 CSS     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░
白 SSR 動画  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████
白フラ CSS   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░███

▌ = 数字ごとの短い墨
```

[次: フェーズ別レイヤー →](./04-layer-stack-by-phase.md)
