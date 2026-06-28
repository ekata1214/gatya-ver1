/** Shared edge line / halo / post-bloom tuning (cards + countdown digits) */

export const EDGE_LINE = {
  /** Tight rim line on card face */
  rimStrength: 0.25 * 0.75,
  /** Edge bloom emit (hex combined shader) */
  hexBloomStrength: 3.6 * 0.75,
  /** Edge bloom emit (result card edge shell) */
  ssrBloomStrength: 4.4 * 0.75,
};

export const EDGE_HALO = {
  hex: {
    glowRadius: 14 * 1.25,
    glowFalloff: 1.8,
    haloStrength: 1.2 * 1.3,
  },
  ssr: {
    glowRadius: 20 * 1.25,
    glowFalloff: 1.5,
    haloStrength: 1.75 * 1.3,
  },
};

export const EDGE_POST_BLOOM = {
  card: {
    strength: 0.65 * 1.2,
    radius: 0.5 * 1.15,
    threshold: 0.97,
  },
  ssrEdge: {
    strength: 0.88 * 1.2,
    radius: 0.52 * 1.15,
    threshold: 0.94,
  },
  /** Countdown digit edge shell — same blur feel as card edges */
  digit: {
    strength: 0.65 * 1.2,
    radius: 0.5 * 1.15,
    threshold: 0.82,
  },
};

export const DIGIT_EDGE_GLOW = {
  /** Yellow silhouette line */
  line: {
    expand: 0.026 * 0.65,
    color: 0xffdd22,
    opacity: 0.92,
  },
  /** Red outer blur halo */
  halo: {
    expand: 0.062,
    color: 0xff3333,
    opacity: 0.48,
  },
};

/** LAST letter size vs digit — same edge weight, no extra blur */
export const LAST_EDGE_GLOW = {
  expandScale: 0.82 / 1.55,
  haloOpacityScale: 0.68,
};
