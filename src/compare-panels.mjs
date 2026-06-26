/**
 * 画面左右の比較説明（before / after）
 */
export const COMPARE_NOTE = {
  id: 'ref-final-v3',
  updated: '2026-06-27',
  topic: 'r2 + r2_2 最終合わせ（形成位置・動き・角度）',
  ref: 'reference-r2.mp4 + reference-r2-24fps.mp4（1.917s）',
  layout: { left: 'before', right: 'after' },
  patterns: {
    before: {
      label: 'before',
      title: '修正前（ref-match-all）',
      gsap: 'FORM.y -0.40 固定',
      summary: '集結完了位置が画面上に寄りすぎ。形成開始＝完了が同じ高さで、下から組み上がる感じがない。',
      bullets: [
        'FORM (0, -0.40) — リファレンスより高い',
        'yStart なし（集結中の上昇なし）',
        'reach 4.6 — 対角線の伸びが短い',
        'hold 中の奥行き z 変化なし',
      ],
      diagram: /* svg */ `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="200" height="200" fill="#111" rx="8"/>
          <rect x="20" y="20" width="160" height="160" fill="none" stroke="#444"/>
          <rect x="55" y="55" width="90" height="55" fill="none" stroke="#f87171" stroke-width="2"/>
          <text x="100" y="88" fill="#f87171" font-size="9" text-anchor="middle" font-family="system-ui,sans-serif">高すぎ</text>
          <path d="M100 140 L100 110" stroke="#f87171" stroke-width="1.5" marker-end="url(#a)"/>
          <defs><marker id="a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#f87171"/></marker></defs>
        </svg>
      `,
    },
    after: {
      label: 'after',
      title: '最終（r2 / r2_2 分析）',
      gsap: 'ref-final-v3',
      summary: '両リファレンスのキーフレームに合わせ再構築。形成は下から上がりながら対角線集結、ホールドで奥行き・スケール、上昇で垂直化。',
      bullets: [
        'yStart -0.72 → FORM.y -0.58（下から組み上げ）',
        'CARD_W 0.72 / scale 1.06→1.12',
        'reach 5.35 + reachEase（外側に長い筋）',
        'hold: driftY -0.18 / z→0.16 / spin 0.88rot',
        'rise: 垂直化 0.14s / z→0.88 / 上昇 angle',
      ],
      diagram: /* svg */ `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="200" height="200" fill="#111" rx="8"/>
          <rect x="20" y="20" width="160" height="160" fill="none" stroke="#444"/>
          <path d="M40 150 L70 110 L100 95 L130 110 L160 150" fill="none" stroke="#4ade80" stroke-width="1.5"/>
          <polygon points="70,110 100,95 130,110 130,140 100,155 70,140" fill="none" stroke="#4ade80" stroke-width="2"/>
          <text x="100" y="175" fill="#4ade80" font-size="8" text-anchor="middle" font-family="system-ui,sans-serif">中央やや下・対角線</text>
        </svg>
      `,
    },
  },
};

export function mountComparePanels({ leftEl, centerEl, rightEl, note = COMPARE_NOTE }) {
  const slots = [
    { el: leftEl, key: note.layout.left },
    { el: centerEl, key: note.layout.center },
    { el: rightEl, key: note.layout.right },
  ].filter((s) => s.el && s.key);

  if (slots.length === 0) {
    console.warn('[compare-panels] no panel elements');
    return { setActive() {} };
  }

  function renderPanel(el, key) {
    const data = note.patterns[key];
    if (!data) return;
    el.className = `side-panel side-panel--${key}`;
    el.innerHTML = `
      <article class="side-panel__card">
        <p class="side-panel__topic">${note.topic}</p>
        <p class="side-panel__tag">${data.label}</p>
        <h2 class="side-panel__title">${data.title}</h2>
        <div class="side-panel__diagram">${data.diagram}</div>
        <p class="side-panel__summary">${data.summary}</p>
        <ul class="side-panel__list">
          ${data.bullets.map((b) => `<li>${b}</li>`).join('')}
        </ul>
        <p class="side-panel__meta">${data.gsap} · ${note.updated} · ${note.id}</p>
        ${note.ref ? `<p class="side-panel__ref">ref: ${note.ref}</p>` : ''}
      </article>
    `;
    el.dataset.compareMode = key;
  }

  slots.forEach(({ el, key }) => renderPanel(el, key));
  return {
    setActive(mode) {
      slots.forEach(({ el, key }) => {
        el.classList.toggle('is-active', mode === key);
      });
      document.body.dataset.compareMode = mode;
    },
  };
}
