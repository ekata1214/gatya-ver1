# 04 — フェーズ別レイヤー構成

[← タイムライン](./03-timeline-and-drawers.md) · [目次](./README.md) · [次: 修正マップ →](./05-modification-map.md)

---

## 読み方

各フェーズで **奥 → 手前**（下 → 上）に何があるかを書きます。ケーキを下から剥がすイメージです。

凡例：

| 記号 | 意味 |
|------|------|
| ● | 表示中・動いている |
| ○ | DOM にはあるが非表示 / 停止 |
| — | 関係なし |

z-index は `cards-six.html` の `#stage` 子要素基準。

---

## 全体 z-order

| z | 要素 | 表現手段 |
|---|------|----------|
| 0 | `#fire-bg` | 動画 |
| 1 | `#ink-test` | 動画 + multiply |
| 5 | `#cards-canvas` | WebGL |
| 90 | `#ssr-layer` | DOM 3D + 内包 video/canvas |
| 100 | `#countdown-canvas` | WebGL |
| 150 | `#darken` | CSS |
| 250 | `#whiteout` | CSS |
| 1000+ | `#replay`, `#compare-picker` | UI |

`#ssr-layer` の内部：

| z | 要素 |
|---|------|
| 0 | `#white-ssr` |
| 1 | `#ssr-card-wrap` → `#ssr-card-canvas` |

---

## フェーズ A — 炎のみ（0 – 0.15s）

```
手前 ────────────────────────────
      [リプレイ] [before/after]    UI
      #whiteout                    ○
      #darken                      ○
      #countdown-canvas            ○
      #ssr-layer                   ○（wrap 非表示）
      #cards-canvas                ○（3D 上は opacity 0）
      #ink-test                    ○
      #fire-bg                     ● ループ
奥 ───────────────────────────────
```

**この1コマ:** 炎動画が全面。六角筒 canvas は透明な render のみの可能性あり。

---

## フェーズ B — 六角筒（0.15 – 〜1.92s）

```
手前 ────────────────────────────
      #whiteout / #darken          ○
      #countdown-canvas            ○
      #ssr-layer                   ○（C まで）
      #cards-canvas                ● 六角筒 + CSS blur 可
      #ink-test                    ○
      #fire-bg                     ●
奥 ───────────────────────────────
```

**この1コマ:** 炎 + 6枚カード（WebGL）。透明部分から炎が見える。

**WebGL 内部:** 奥行・`renderOrder`（gold を手前に、など）。

---

## フェーズ C — SSR と六角筒のすれ違い（〜1.14 – 〜1.76s）

```
手前 ────────────────────────────
      #countdown-canvas            ○
      #ssr-layer                   ●
        └ #ssr-card-wrap           ● GSAP 3D
            └ #ssr-card-canvas     ● カード絵
        └ #white-ssr               ○
      #cards-canvas                ● 上昇・消失中
      #ink-test                    ○
      #fire-bg                     ●
奥 ───────────────────────────────
```

**この1コマ:** 炎 + 上がる筒 + **手前に** SSR（z 90 > 5）。

---

## フェーズ D — カウントダウン + 墨（〜1.76s – LAST）

`showInkLayer()` 後：

```
手前 ────────────────────────────
      #darken                      ○
      #countdown-canvas            ● 3D 数字 / LAST
      #ssr-layer                   ● バウンス継続
      #cards-canvas                ○ 非表示
      #ink-test                    ● 数字ごと（multiply）
      #fire-bg                     ●
奥 ───────────────────────────────
```

**この1コマ:** 炎に墨が乗る + 手前に 3D 数字 + SSR。

墨は **常時ループではなく** 数字のたびに `currentTime = 0` で頭出し。

---

## フェーズ E1 — LAST 表示〜暗転前

D と同じスタック。違い：

- LAST は **消えない**（退出 tween なし）
- LAST 後 〜0.5s で墨フリーズ
- カウントダウン canvas はまだ ●

---

## フェーズ E2 — 暗転 IN（LAST 約 +1s）

```
手前 ────────────────────────────
      #whiteout                    ○
      #darken                      ● opacity → 1
      #countdown-canvas            ● → 途中で非表示
      #ssr-layer                   ●
      #cards-canvas                ○
      #ink-test                    ○
      #fire-bg                     ● → フェード / pause
奥 ───────────────────────────────
```

**この1コマ:** 黒が被さる。炎・カウントダウンは遷移中に OFF。

---

## フェーズ E3 — 白 SSR 揭示

```
手前 ────────────────────────────
      #darken                      ● opacity → 0（下を見せる）
      #ssr-layer                   ●
        └ #white-ssr               ● フェード IN
        └ #ssr-card-wrap           ●
      #countdown-canvas            ○
      #fire-bg                     ○
奥 ───────────────────────────────
```

**この1コマ:** 白い SSR 動画が背景、カードが手前。

---

## フェーズ E4 — ホワイトアウト

```
手前 ────────────────────────────
      #whiteout                    ● opacity → 1
      （下全部白潰し）
奥 ───────────────────────────────
```

---

## フェーズごとに「使う手段」が違う

| フェーズ群 | 動画 | WebGL | DOM 3D | CSS |
|-----------|------|-------|--------|-----|
| A | 炎 | （空の筒） | — | — |
| B | 炎 | 六角筒 | — | canvas blur |
| C | 炎 | 筒 + SSR 子 | SSR wrap | — |
| D | 炎+墨 | カウントダウン + SSR 子 | SSR wrap | — |
| E | 白 SSR | SSR 子 | SSR wrap | 暗転+白フラ |

**B/C → D の境界** は、WebGL シーン内の切替ではなく **キャンバス差し替え**（筒 OFF / カウントダウン ON）。

---

## ステージ外

ワイド画面の `aside.side-panel` は `#stage` の横。演出のレイヤー構成には含まれません。

---

## 時刻早見（何が見える？）

| t (s) | 奥 → 手前の主な要素 |
|-------|---------------------|
| 0.10 | 炎 |
| 0.37 | 炎、六角筒（形成完了） |
| 1.14 | 炎、筒、SSR 降下中 |
| 1.50 | 炎、筒フェード、SSR 着地 |
| 1.80 | 炎、SSR、カウントダウン準備（筒非表示） |
| 3.00 | 炎、墨、数字、SSR |
| LAST+ | 炎、墨、LAST、SSR |
| 終盤 | 暗転 → 白 SSR+カード → ホワイトアウト |

筒の位置合わせ: `seekCardsTime(t)` + `/ref`。筒以降は `/show` 通し再生。

[次: 修正マップ →](./05-modification-map.md)
