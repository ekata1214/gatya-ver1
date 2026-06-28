# 05 — 修正マップ（要素別）

[← フェーズ別レイヤー](./04-layer-stack-by-phase.md) · [目次](./README.md)

---

## 使い方

1. 変えたい **要素** を探す
2. **出るフェーズ** を確認
3. **表現手段** と **ファイル** で作業場所を特定
4. 定数名は [チューニング早見表](../09-tuning-guide.md) も参照

---

## 要素別

### 炎背景

| 項目 | 内容 |
|------|------|
| **フェーズ** | A → E2（E3 以降非表示） |
| **表現手段** | 動画 A（`#fire-bg`） |
| **駆動** | ループ再生（位置は tween しない） |
| **ファイル** | `cards-six.html`, 終盤 TL（`gatya-unified.mjs`） |
| **見た目** | `re fire2.mp4` 差し替え |
| **止めるタイミング** | `onLastShown` 内 `fireVideo.pause()`, opacity |
| **禁止** | 演出中の `fireVideo.load()` |

---

### 六角筒（6枚）

| 項目 | 内容 |
|------|------|
| **フェーズ** | B のみ（D 以降 canvas 非表示） |
| **表現手段** | WebGL B（`#cards-canvas`） |
| **駆動** | GSAP `buildCardsTimeline()` → `anim`, `spin`, `gather`, `cardUpright` |
| **ファイル** | `ref-match-config.mjs`, `gatya-unified.mjs` |
| **タイミング** | `T.*`, `CARD_INTRO_DELAY` |
| **位置・軌道** | `FORM`, `RISE`, `GATHER_DIAG` |
| **カメラ** | `CAMERA` |
| **縁グロー** | `CARD_FX`, `makeCardGlowMaterial()` |
| **筋ブラー** | `CYL_BLUR`, `applyCardsMotionBlur()` |

---

### SSR カード（降下・バウンス・終盤）

| 項目 | 内容 |
|------|------|
| **フェーズ** | C → 終了 |
| **表現手段** | DOM 3D C + 子 WebGL B |
| **駆動** | `dropSsrCard()`, `startSsrBounce()` |
| **ファイル** | `gatya-unified.mjs`, `cards-six.html`（CSS） |
| **降下・着地** | `SSR_DROP`, `SSR_POSE`, `SSR_DROP_DUR` |
| **開始タイミング** | `SSR_CROSS_RISE_OFFSET`, 筒の `t3` |
| **バウンス** | `startSsrBounce()` |
| **絵・グロー** | `ssr card.png`, `SSR_CARD_FX` |
| **禁止** | 墨フェーズで降下をやり直さない |

---

### 墨

| 項目 | 内容 |
|------|------|
| **フェーズ** | D（各数字）→ E2 フリーズ |
| **表現手段** | 動画 A + CSS multiply |
| **駆動** | `onDigitStart` → `syncInkToDigit()` |
| **ファイル** | `gatya-unified.mjs`, `cards-six.html` |
| **見た目** | `ink test2.mp4` |
| **同期** | カウントダウンタイミング、`onDigitStart` |
| **乗り方** | `#ink-test { mix-blend-mode }` |

---

### カウントダウン数字（5〜1）

| 項目 | 内容 |
|------|------|
| **フェーズ** | D（各数字は退出まで） |
| **表現手段** | WebGL B（`#countdown-canvas`） |
| **駆動** | `addDigitAnim()` 内 GSAP |
| **ファイル** | `countdown-three-overlay.mjs` |
| **モーション** | `DIGIT_ANIM`, `T.appear/hold/exit` |
| **間隔** | `TOTAL`, `STEP`, `POST_SHOW_AFTER.countdownDelay` |
| **炎反射** | `NUMBER_FIRE_TUNING` 等 |

---

### LAST 文字

| 項目 | 内容 |
|------|------|
| **フェーズ** | D 後半 → E3 で canvas 非表示 |
| **表現手段** | WebGL B（数字と同じ canvas） |
| **駆動** | `addLastAnim()` — **退出なし** |
| **ファイル** | `countdown-three-overlay.mjs`, 終盤定数 |
| **文字モーション** | `LAST_LETTER_ANIM`, `LAST_GROUP_*` |
| **暗転までの猶予** | `lastToDarken`, `lastInkFreeze` |

---

### 白 SSR 背景（終盤）

| 項目 | 内容 |
|------|------|
| **フェーズ** | E3 → E4 |
| **表現手段** | 動画 A（`#white-ssr`） |
| **駆動** | 終盤 TL + `playVideo()` |
| **ファイル** | `gatya-unified.mjs`, `cards-six.html` |
| **見た目** | `white ssr.mp4` |
| **フェード** | `whiteRevealDur`, `finaleHold` |

---

### 暗転 / ホワイトアウト

| 項目 | 内容 |
|------|------|
| **フェーズ** | E2 – E5 |
| **表現手段** | CSS D |
| **駆動** | 終盤 GSAP |
| **ファイル** | `POST_SHOW_AFTER`（`gatya-unified.mjs`） |
| **調整** | `darkenDur`, `whiteoutDur`, `lastToDarken` |

---

## 切り口別（何を変えたい？）

| 切り口 | 例 | 触る場所 |
|--------|-----|----------|
| **タイミング** | SSR を早く | `ssrAt`, `inkAt` |
| **タイミング** | カウントダウン開始 | `countdownDelay` |
| **表示切替** | カウントダウン中に筒が見える | `showInkLayer()` |
| **素材** | 背景 FX | mp4 + HTML `<source>` |
| **3D 追加** | 筒にオブジェクト追加 | `gatya-unified.mjs` シーングラフ + TL |
| **重ね順** | SSR を筒の後ろに | **非推奨**（z 90>5 は意図的） |
| **見た目のみ** | 縁グロー | GLSL / `CARD_FX` |

---

## フェーズ別：開くファイル

| フェーズ | まず開く |
|---------|----------|
| 炎のみ | `cards-six.html`, 動画素材 |
| 六角筒 | `ref-match-config.mjs`, `buildCardsTimeline` |
| リファレンス合わせ | `ref-calibrate.html`, `/ref` |
| SSR | `SSR_*`, `dropSsrCard` |
| 墨・レイヤー切替 | `startInkPhase`, `showInkLayer` |
| カウントダウン | `countdown-three-overlay.mjs` |
| 終盤 | `onLastShown`, `POST_SHOW_AFTER` |
| 比較 UI 文言 | `compare-panels.mjs` |

---

## 判断フロー

```
何を変える？
│
├─ 背景の雰囲気（炎・墨・白）
│   └─ 動画ファイル + gatya-unified の再生/opacity
│
├─ 六角筒の動き・構図
│   └─ ref-match-config.mjs → buildCardsTimeline / applyCardHexGather
│
├─ SSR カードの動き
│   └─ SSR_DROP / SSR_POSE（DOM の GSAP。Three シーンではない）
│
├─ カードの黄色い縁・メタル
│   └─ CARD_FX / SSR_CARD_FX + シェーダー
│
├─ カウントダウンの数字
│   └─ countdown-three-overlay.mjs
│
├─ 暗転・白フラ
│   └─ POST_SHOW_AFTER + onLastShown の GSAP
│
└─ いつ起きるか（見た目ではなく順番・秒数）
    └─ buildCardsTimeline の offset + POST_SHOW_AFTER + カウントダウン TOTAL
```

---

## 変更後チェックリスト

- [ ] `/show` をリプレイから通し確認
- [ ] 墨以降、六角筒 canvas が残っていない
- [ ] SSR が二回降りない
- [ ] 炎が途中でチラつかない
- [ ] LAST が暗転まで残る
- [ ] `cards-six.html` の `ASSET_V` を更新

---

[画面構成トップ](./README.md) · [メイン docs](../README.md) · [English composition](../composition/README.md)
