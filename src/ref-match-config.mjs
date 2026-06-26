/**
 * r2.mp4（60fps）+ r2_2.mp4（24fps）共通タイミング 1.917s
 * フレーム分析 2026-06-27 final
 *
 * キーフレーム（秒）:
 *  0.15 カード出現 / 0.37 集結完了 / 0.49 立ち完了
 *  1.04 ホールド終了→上昇 / 1.42 上昇完了 / 1.92 消失
 */
const DEG = Math.PI / 180;

export const REF_MATCH = {
  id: 'ref-final-v3',
  updated: '2026-06-27',
  fps: 24,
  duration: 1.917,
  CARD_W: 0.72,
  HEX_GAP_START: 1.38,
  HEX_GAP_FINAL: 0.078,
  CARD_INTRO_DELAY: 0.15,
  T: { slide: 0.22, stand: 0.12, hold: 0.55, rise: 0.38, exit: 0.50 },
  /** 青=右上(60°) · 2.167rot ≡ 60° */
  GATHER_ROTATIONS: 2.167,
  POST_GATHER_ROTATIONS: 0.88,
  FORM: {
    x: 0,
    /** 集結完了位置: 画面中央やや下（旧 -0.40 は高すぎ） */
    y: -0.58,
  /** 集結開始: さらに下から六角が組み上がる */
    yStart: -0.72,
    poseX: 0,
    driftY: -0.18,
    rotX: 68 * DEG,
    rotZ: -5.5 * DEG,
    rotYOff: 4 * DEG,
    scaleMul: 1.06,
  },
  ROT: {
    poseX: 20 * DEG,
    poseZ: -15 * DEG,
    poseYOff: 5 * DEG,
    poseDepth: 1.35,
    poseScale: 1.12,
  },
  GATHER_DIAG: {
    reach: 5.35,
    lift: 2.08,
    liftWave: 0.38,
    /** 集結前半は外側に長く、後半で締まる（r2 対角線筋） */
    reachEase: 1.35,
  },
  GATHER: {
    radiusMul: 5.0,
    burstY: 0.28,
    tiltOut: 14 * DEG,
  },
  CUP: {
    cardTilt: 24 * DEG,
    mouthGapBoost: 1.16,
  },
  CYL_VERTICAL_DUR: 0.14,
  CYL_BLUR: { gatherPeak: 9, exitPeak: 14 },
  RISE: {
    mid: { x: 0, y: 2.05, z: 0.88 },
    exit: { x: 0, y: 5.55, z: 1.02 },
  },
  CAMERA: {
    fov: 44,
    pos: [0, 0.12, 6.05],
    look: [0, -0.18, 0.22],
    exposure: 1.12,
  },
  KEYFRAMES: {
    0.15: { phase: 'gather-start', cy: 0.55, w: 0.18 },
    0.25: { phase: 'gather-mid', cy: 0.48, w: 0.32 },
    0.37: { phase: 'gather-end', cy: 0.46, w: 0.50 },
    0.50: { phase: 'formed', cy: 0.44, w: 0.56 },
    0.62: { phase: 'hold', cy: 0.43, w: 0.58 },
    1.04: { phase: 'pre-rise', cy: 0.41, w: 0.62 },
    1.25: { phase: 'rise-mid', cy: 0.36, w: 0.56 },
    1.67: { phase: 'exit', cy: 0.30, w: 0.40 },
  },
};

export const REF_TOTAL =
  REF_MATCH.CARD_INTRO_DELAY
  + REF_MATCH.T.slide
  + REF_MATCH.T.stand
  + REF_MATCH.T.hold
  + REF_MATCH.T.rise
  + REF_MATCH.T.exit;

/** before: ref-match-all（形成位置が高すぎた版） */
export const BEFORE_MATCH = {
  CARD_W: 0.70,
  HEX_GAP_FINAL: 0.075,
  FORM: {
    x: 0,
    y: -0.40,
    yStart: -0.40,
    poseX: 0,
    driftY: -0.36,
    rotX: 74 * DEG,
    rotZ: -5.5 * DEG,
    rotYOff: 3.5 * DEG,
    scaleMul: 1.10,
  },
  ROT: {
    poseX: 21 * DEG,
    poseZ: -14 * DEG,
    poseYOff: 5 * DEG,
    poseDepth: 1.35,
    poseScale: 1.14,
  },
  GATHER_ROTATIONS: 2.167,
  GATHER_DIAG: { reach: 4.6, lift: 1.72, liftWave: 0.30, reachEase: 1.0 },
  RISE: {
    mid: { x: 0, y: 2.15, z: 0.68 },
    exit: { x: 0, y: 5.35, z: 0.82 },
  },
};
