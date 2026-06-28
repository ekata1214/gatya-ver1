/** @typedef {'SSR'|'SR'|'R'|'NORMAL'} Rarity */

export const RARITIES = /** @type {const} */ (['SSR', 'SR', 'R', 'NORMAL']);

/** 各レア 25%（合計 1.0） */
export const RARITY_WEIGHTS = /** @type {Record<Rarity, number>} */ ({
  SSR: 0.25,
  SR: 0.25,
  R: 0.25,
  NORMAL: 0.25,
});

/** @type {Record<Rarity, {
 *   label: string;
 *   cardSrc: string;
 *   glowColor: number;
 *   sheenColor: [number, number, number];
 *   surfaceTint: [number, number, number];
 *   radialFilter: string;
 * }>} */
export const RARITY_CONFIG = {
  SSR: {
    label: 'SSR',
    cardSrc: './ssr card.png',
    glowColor: 0xffdd22,
    sheenColor: [1.0, 0.95, 0.72],
    surfaceTint: [1.0, 0.9, 0.55],
    radialFilter: 'sepia(0.35) saturate(2.8) hue-rotate(-10deg) brightness(1.15)',
  },
  SR: {
    label: 'SR',
    cardSrc: './rainbow card.png',
    glowColor: 0xcc66ff,
    sheenColor: [0.95, 0.78, 1.0],
    surfaceTint: [0.88, 0.58, 1.0],
    radialFilter: 'sepia(0.2) saturate(2.4) hue-rotate(255deg) brightness(1.1)',
  },
  R: {
    label: 'R',
    cardSrc: './blue card.png',
    glowColor: 0x4488ff,
    sheenColor: [0.75, 0.88, 1.0],
    surfaceTint: [0.55, 0.75, 1.0],
    radialFilter: 'sepia(0.15) saturate(2.6) hue-rotate(185deg) brightness(1.1)',
  },
  NORMAL: {
    label: 'NORMAL',
    cardSrc: './red card.png',
    glowColor: 0xff5555,
    sheenColor: [1.0, 0.78, 0.72],
    surfaceTint: [1.0, 0.55, 0.45],
    radialFilter: 'sepia(0.25) saturate(2.8) hue-rotate(-45deg) brightness(1.08)',
  },
};

/**
 * @param {string | null | undefined} forced 開発用固定（本番は null）
 * @returns {Rarity}
 */
export function rollRarity(forced) {
  const key = typeof forced === 'string' ? forced.toUpperCase() : '';
  if (key && RARITIES.includes(/** @type {Rarity} */ (key))) {
    return /** @type {Rarity} */ (key);
  }

  const r = Math.random();
  let acc = 0;
  for (const rarity of RARITIES) {
    acc += RARITY_WEIGHTS[rarity];
    if (r < acc) return rarity;
  }
  return 'NORMAL';
}
