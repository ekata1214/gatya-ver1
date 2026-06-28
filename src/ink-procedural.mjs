/** プロシージャル墨汁（API素材未配置時のフォールバック） */

const VIEW_W = 1080;
const VIEW_H = 1920;

export const INK_SEEDS = { 5: 101, 4: 202, 3: 303, 2: 404, 1: 505, LAST: 606 };

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function drawBlob(ctx, x, y, rx, ry, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTendril(ctx, x0, y0, angle, len, width, rng) {
  const x1 = x0 + Math.cos(angle) * len;
  const y1 = y0 + Math.sin(angle) * len;
  const cx = x0 + Math.cos(angle) * len * (0.35 + rng() * 0.25)
    + Math.cos(angle + Math.PI / 2) * (rng() - 0.5) * width * 2;
  const cy = y0 + Math.sin(angle) * len * (0.35 + rng() * 0.25)
    + Math.sin(angle + Math.PI / 2) * (rng() - 0.5) * width * 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.stroke();
  const tipR = width * (0.45 + rng() * 0.55);
  drawBlob(ctx, x1, y1, tipR * 1.2, tipR, angle);
}

function scatterDrops(ctx, w, h, rng, count, minR, maxR, cx, cy, radius) {
  for (let i = 0; i < count; i++) {
    const ang = rng() * Math.PI * 2;
    const dist = radius ? Math.sqrt(rng()) * radius : Math.sqrt(rng()) * Math.min(w, h) * 0.48;
    const x = (cx ?? w * 0.5) + Math.cos(ang) * dist;
    const y = (cy ?? h * 0.5) + Math.sin(ang) * dist;
    if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;
    const r = minR + (maxR - minR) * Math.pow(rng(), 0.6);
    drawBlob(ctx, x, y, r * (0.7 + rng() * 0.6), r * (0.5 + rng() * 0.5), rng() * Math.PI);
  }
}

function drawSplatterHub(ctx, w, h, rng, cx, cy, intensity, sizeMul = 1) {
  const s = intensity * (0.85 + rng() * 0.3) * sizeMul;
  scatterDrops(ctx, w, h, rng, Math.floor(80 * s), 2, 14 * sizeMul, cx, cy, Math.min(w, h) * 0.55 * s);
  const mainCount = 4 + Math.floor(rng() * 4);
  for (let i = 0; i < mainCount; i++) {
    const ox = (rng() - 0.5) * w * 0.28 * s;
    const oy = (rng() - 0.5) * h * 0.22 * s;
    const rx = w * (0.11 + rng() * 0.2) * s;
    const ry = rx * (0.45 + rng() * 0.85);
    drawBlob(ctx, cx + ox, cy + oy, rx, ry, rng() * Math.PI);
  }
  const tendrils = 5 + Math.floor(rng() * 5);
  for (let i = 0; i < tendrils; i++) {
    const angle = rng() * Math.PI * 2;
    const len = w * (0.14 + rng() * 0.34) * s;
    const width = (10 + rng() * 52 * s) * sizeMul;
    drawTendril(ctx, cx, cy, angle, len, width, rng);
  }
  scatterDrops(ctx, w, h, rng, Math.floor(55 * s), 8 * sizeMul, 48 * sizeMul, cx, cy, Math.min(w, h) * 0.5 * s);
  scatterDrops(ctx, w, h, rng, Math.floor(90 * s), 2, 16 * sizeMul, cx, cy, Math.min(w, h) * 0.62 * s);
}

function edgeBias(rng, w, h) {
  const edge = rng();
  if (edge < 0.25) return { x: w * (0.02 + rng() * 0.14), y: h * (0.1 + rng() * 0.8) };
  if (edge < 0.5) return { x: w * (0.86 + rng() * 0.12), y: h * (0.1 + rng() * 0.8) };
  if (edge < 0.75) return { x: w * (0.1 + rng() * 0.8), y: h * (0.02 + rng() * 0.12) };
  return { x: w * (0.1 + rng() * 0.8), y: h * (0.86 + rng() * 0.12) };
}

function centerBias(rng, w, h, ox = 0.5, oy = 0.5) {
  return {
    x: w * (ox - 0.18 + rng() * 0.36),
    y: h * (oy - 0.16 + rng() * 0.32),
  };
}

const BIAS = {
  5: { ox: 0.32, oy: 0.68 },
  4: { ox: 0.72, oy: 0.28 },
  3: { ox: 0.5, oy: 0.5 },
  2: { ox: 0.72, oy: 0.72 },
  1: { ox: 0.5, oy: 0.28 },
  LAST: { ox: 0.5, oy: 0.5 },
};

function generateBackgroundInk(seed, digit) {
  const w = VIEW_W;
  const h = VIEW_H;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const rng = mulberry32(seed + 11);
  const bias = BIAS[digit] ?? BIAS[3];

  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
  ctx.globalAlpha = 0.55;
  scatterDrops(ctx, w, h, rng, 520, 1, 9);

  const hubs = 10 + Math.floor(rng() * 6);
  for (let i = 0; i < hubs; i++) {
    const p = centerBias(rng, w, h, bias.ox, bias.oy);
    drawSplatterHub(ctx, w, h, rng, p.x, p.y, 0.28 + rng() * 0.22, 0.42);
  }
  scatterDrops(ctx, w, h, rng, 280, 1, 6);
  ctx.globalAlpha = 1;
  return c;
}

function generateMiddleInk(seed, digit) {
  const w = VIEW_W;
  const h = VIEW_H;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const rng = mulberry32(seed + 29);
  const bias = BIAS[digit] ?? BIAS[3];

  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
  scatterDrops(ctx, w, h, rng, 180, 2, 12);

  const hubs = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < hubs; i++) {
    const p = centerBias(rng, w, h, bias.ox, bias.oy);
    drawSplatterHub(ctx, w, h, rng, p.x, p.y, 0.7 + rng() * 0.45);
  }
  const main = centerBias(rng, w, h, bias.ox, bias.oy);
  drawSplatterHub(ctx, w, h, rng, main.x, main.y, digit === 'LAST' ? 1.55 : 1.25 + rng() * 0.35);
  scatterDrops(ctx, w, h, rng, 140, 2, 14);
  return c;
}

function generateForegroundInk(seed) {
  const w = VIEW_W;
  const h = VIEW_H;
  const scratch = document.createElement('canvas');
  scratch.width = w;
  scratch.height = h;
  const ctx = scratch.getContext('2d');
  const rng = mulberry32(seed + 47);

  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';

  const giants = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < giants; i++) {
    const p = edgeBias(rng, w, h);
    const rx = w * (0.16 + rng() * 0.2);
    const ry = rx * (0.45 + rng() * 0.75);
    drawBlob(ctx, p.x, p.y, rx, ry, rng() * Math.PI);
    drawTendril(ctx, p.x, p.y, rng() * Math.PI * 2, w * (0.1 + rng() * 0.18), 16 + rng() * 38, rng);
    scatterDrops(ctx, w, h, rng, 28, 8, 42, p.x, p.y, Math.min(w, h) * 0.22);
  }

  const edgeHubs = 3 + Math.floor(rng() * 2);
  for (let i = 0; i < edgeHubs; i++) {
    const p = edgeBias(rng, w, h);
    drawSplatterHub(ctx, w, h, rng, p.x, p.y, 0.95 + rng() * 0.35, 1.35);
  }

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const octx = out.getContext('2d');
  octx.filter = 'blur(9px)';
  octx.drawImage(scratch, 0, 0);
  octx.filter = 'none';
  return out;
}

export function makeProceduralInkLayerCanvas(digit, layerKey) {
  const seed = INK_SEEDS[digit] ?? 303;
  if (layerKey === 'bg') return generateBackgroundInk(seed, digit);
  if (layerKey === 'mid') return generateMiddleInk(seed, digit);
  return generateForegroundInk(seed);
}
