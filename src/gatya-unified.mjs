import * as THREE from 'three';
import { initCountdownOverlay } from './countdown-three-overlay.mjs';
import { initInkOverlay } from './ink-three-overlay.mjs';
import { createSE, resetFireIntro } from './se.mjs';
import { REF_MATCH, REF_TOTAL, BEFORE_MATCH } from './ref-match-config.mjs';

export async function initGatyaShow({
  stageEl,
  cardsCanvas,
  countdownCanvas,
  inkCanvas,
  fireVideo,
  whiteSsrVideo,
  ssrCard,
  ssrCardCanvas,
  ssrLayer,
  darkenEl,
  whiteoutEl,
  replayBtn,
  resolveGatherMode,
  skipCountdown = false,
}) {
  CustomEase.create('heavy', 'M0,0 C0.16,1 0.3,1 1,1');
  CustomEase.create('heavyIO', 'M0,0 C0.45,0 0.2,1 1,1');
  CustomEase.create('post', 'M0,0 C0.45,0 0.55,1 1,1');
  gsap.ticker.lagSmoothing(0);
  const HEAVY = 'heavy';
  const HEAVY_IO = 'heavyIO';
  const POST = 'post';

  const se = createSE({ volume: 0.95 });
  let seReady = false;

  async function bootSE() {
    await se.unlock();
    seReady = true;
    se.startFire();
  }

  document.addEventListener('pointerdown', () => bootSE(), { once: true });

  function playVideo(el) {
    if (!el) return;
    const p = el.play();
    if (p?.catch) p.catch(() => {});
  }

  let ssrBounceTween = null;
  let inkCountdownTimer = null;
  let inkCtrl = null;
  let lastInkLocked = false;
  let lastInkFreezeTimer = null;
  let cardsMasterTL = null;
  let cardsAnimating = true;
  let countdownCtrl = null;

  const CARD_W = REF_MATCH.CARD_W;
  const CARD_H = CARD_W * 1.5;
  const CARD_FX = {
    borderColor: new THREE.Color(0xffdd22),
    metalStrength: 0.0225,
    surfaceGlow: 0.0125,
    edgeSampleScale: 4.0,
    edgeBlurScale: 2.4,
    edgeMix: 0.9,
    edgeAdd: 0.58,
  };
  const SSR_CARD_FX = {
    metalStrength: 0.055,
    surfaceGlow: 0.032,
  };
  const DEG = Math.PI / 180;
  const VIEW_W = 1080;
  const VIEW_H = 1920;
  const VIEW_ASPECT = VIEW_W / VIEW_H;
  const HEX_GAP_FINAL = REF_MATCH.HEX_GAP_FINAL;
  const HEX_GAP_START = REF_MATCH.HEX_GAP_START;
  const _hexBaseR = CARD_W / (2 * Math.sin(Math.PI / 6));
  const _hexBaseGap = Math.PI / 3 - 2 * Math.atan(CARD_W / (2 * _hexBaseR));
  function hexRadiusForGapScale(gapScale) {
    return CARD_W / (2 * Math.tan((Math.PI / 3 - _hexBaseGap * gapScale) / 2));
  }
  const CYL_RADIUS = hexRadiusForGapScale(HEX_GAP_FINAL);
  const hexGap = { scale: HEX_GAP_START };

  const T = { ...REF_MATCH.T };
  const CARD_INTRO_DELAY = REF_MATCH.CARD_INTRO_DELAY;
  const TOTAL = REF_TOTAL;
  const SSR_DROP_DUR = 0.5;
  const SSR_CROSS_RISE_OFFSET = 0.1;
  /** before: 旧タイミング（空白あり） / after: 現行（詰め） */
  const POST_SHOW_BEFORE = {
    inkAfterSsrLand: 0.45,
    countdownDelay: 2.5,
    lastInkFreeze: 0.8,
    lastToDarken: 2.0,
    darkenDur: 3.0,
    fireFadeOut: 3.0,
    whiteRevealDur: 0.6,
    finaleHold: 3.0,
    whiteoutDur: 1.2,
  };
  const POST_SHOW_AFTER = {
    inkAfterSsrLand: 0.12,
    countdownDelay: 1.1,
    lastInkFreeze: 0.5,
    lastToDarken: 1.0,
    darkenDur: 2.0,
    fireFadeOut: 2.0,
    whiteRevealDur: 0.45,
    finaleHold: 2.0,
    whiteoutDur: 0.9,
  };
  /** before 比較用: カード完全消失後の空白（秒） */
  const SSR_GAP_AFTER_CARDS_BEFORE = 0.9;
  let activePostShow = POST_SHOW_AFTER;

  function getPostShow(mode) {
    return mode === 'before' ? POST_SHOW_BEFORE : POST_SHOW_AFTER;
  }
  const FORM = {
    x: REF_MATCH.FORM.x,
    y: REF_MATCH.FORM.y,
    yStart: REF_MATCH.FORM.yStart ?? REF_MATCH.FORM.y,
    poseX: REF_MATCH.FORM.poseX,
    driftY: REF_MATCH.FORM.driftY,
    rotX: REF_MATCH.FORM.rotX,
    rotZ: REF_MATCH.FORM.rotZ,
    rotYOff: REF_MATCH.FORM.rotYOff,
    scaleMul: REF_MATCH.FORM.scaleMul,
  };
  const ROT = {
    horizontal: Math.PI / 2,
    cupX: FORM.rotX,
    cupZ: FORM.rotZ,
    cupYOff: FORM.rotYOff,
    poseX: REF_MATCH.ROT.poseX,
    poseZ: REF_MATCH.ROT.poseZ,
    poseYOff: REF_MATCH.ROT.poseYOff,
    poseDepth: REF_MATCH.ROT.poseDepth,
    poseScale: REF_MATCH.ROT.poseScale,
  };
  const CUP_RISE_MODES = {
    before: {
      exitCupX: DEG * 85,
      exitCupZ: DEG * -5,
      exitCupYOff: DEG * 3,
    },
    after: {
      exitCupX: DEG * 6,
      exitCupZ: 0,
      exitCupYOff: 0,
    },
  };
  let cupRiseMode = 'after';
  const CYL_VERTICAL_DUR = REF_MATCH.CYL_VERTICAL_DUR;
  const CYL_BLUR = { ...REF_MATCH.CYL_BLUR };
  const motionBlur = { px: 0 };
  /** 六角筒：各区間 tween の ease（確定） */
  const CYL_EASE = 'power2.out';

  function segEase(_segment) {
    return CYL_EASE;
  }

  function getCupRiseExit() {
    return CUP_RISE_MODES[cupRiseMode] ?? CUP_RISE_MODES.after;
  }

  function setCupRiseMode(mode) {
    if (CUP_RISE_MODES[mode]) cupRiseMode = mode;
  }

  function getCupRiseMode() {
    return cupRiseMode;
  }
  const RISE = {
    mid: { ...REF_MATCH.RISE.mid },
    exit: { ...REF_MATCH.RISE.exit },
  };
  const CLOSE_SPIN_SLOW = 0.35;
  const CLOSE_SPIN_FAST = 1.1;
  const GATHER = { ...REF_MATCH.GATHER };
  const GATHER_DIAG = { ...REF_MATCH.GATHER_DIAG };
  let gatherMode = 'after';
  let GATHER_ROTATIONS = REF_MATCH.GATHER_ROTATIONS;

  function applySpatialProfile(mode) {
    const src = mode === 'before' ? BEFORE_MATCH : REF_MATCH;
    const cardRatio = src.CARD_W ? CARD_W / src.CARD_W : 1;
    FORM.x = src.FORM.x;
    FORM.y = src.FORM.y;
    FORM.yStart = src.FORM.yStart ?? src.FORM.y;
    FORM.poseX = src.FORM.poseX;
    FORM.driftY = src.FORM.driftY;
    FORM.rotX = src.FORM.rotX;
    FORM.rotZ = src.FORM.rotZ;
    FORM.rotYOff = src.FORM.rotYOff;
    FORM.scaleMul = src.FORM.scaleMul * cardRatio;
    ROT.poseX = src.ROT.poseX;
    ROT.poseZ = src.ROT.poseZ;
    ROT.poseYOff = src.ROT.poseYOff;
    ROT.poseDepth = src.ROT.poseDepth;
    ROT.poseScale = src.ROT.poseScale * cardRatio;
    GATHER_ROTATIONS = src.GATHER_ROTATIONS ?? REF_MATCH.GATHER_ROTATIONS;
    const diag = src.GATHER_DIAG ?? REF_MATCH.GATHER_DIAG;
    GATHER_DIAG.reach = diag.reach;
    GATHER_DIAG.lift = diag.lift;
    GATHER_DIAG.liftWave = diag.liftWave;
    GATHER_DIAG.reachEase = diag.reachEase ?? 1;
    const rise = src.RISE ?? REF_MATCH.RISE;
    Object.assign(RISE.mid, rise.mid);
    Object.assign(RISE.exit, rise.exit);
  }

  applySpatialProfile('after');

  function setGatherMode(mode) {
    if (mode === 'before' || mode === 'after') {
      gatherMode = mode;
      applySpatialProfile(mode);
    }
  }

  function getGatherMode() {
    return gatherMode;
  }

  function resolveGather() {
    const m = resolveGatherMode?.();
    return m === 'before' || m === 'after' ? m : gatherMode;
  }
  const CUP = { ...REF_MATCH.CUP };
  const gather = { t: 1 };
  const cardUpright = { t: 0 };
  const SSR_DROP = {
    from: {
      x: 165,
      y: -920,
      z: 110,
      scale: 0.72,
      rotationX: -3,
      rotationY: -8,
      rotationZ: 12,
    },
  };
  const SSR_POSE = {
    x: -6,
    y: 14,
    z: -28,
    scale: 0.94,
    rotationX: -5,
    rotationY: -10,
    rotationZ: 6,
  };

  const CARD_DEFS = [
    { src: './blue card.png', deg: 0, isGold: false },
    { src: './silver card.png', deg: 60, isGold: false },
    { src: './rainbow card.png', deg: 120, isGold: false },
    { src: './gold card.png', deg: 180, isGold: true },
    { src: './green card.png', deg: 240, isGold: false },
    { src: './red card.png', deg: 300, isGold: false },
  ];

  let renderer, scene, camera, cylinder, cylinderTilt, cylinderSpin, cards = [];
  let ssrRenderer, ssrScene, ssrCamera, ssrMesh;
  const anim = { x: 0, y: 0, z: 0, rotX: ROT.horizontal, rotZ: 0, rotYOff: 0, scaleMul: 1, opacity: 0 };
  const spin = { rate: 0, y: 0 };
  const SPIN_START = 0.55;
  const SPIN_FAST_RISE = 10;
  const RISE_ROTATIONS = 1.5;
  const POST_GATHER_ROTATIONS = REF_MATCH.POST_GATHER_ROTATIONS;
  const SPIN_RAMP = 0.35;

  function syncHexGapFromUpright() {
    hexGap.scale = HEX_GAP_START + (HEX_GAP_FINAL - HEX_GAP_START) * cardUpright.t;
  }

  function applyCardsMotionBlur() {
    gsap.set(cardsCanvas, {
      filter: motionBlur.px > 0.05 ? `blur(${motionBlur.px}px)` : 'blur(0px)',
    });
  }

  function stageSize() {
    const w = stageEl.clientWidth || VIEW_W;
    const h = stageEl.clientHeight || VIEW_H;
    return { w, h };
  }

  function setSsrCardCenter(overrides = {}) {
    gsap.set(ssrCard, {
      xPercent: -50,
      yPercent: -50,
      transformPerspective: 900,
      x: SSR_POSE.x,
      y: SSR_POSE.y,
      z: SSR_POSE.z,
      scale: SSR_POSE.scale,
      rotationX: SSR_POSE.rotationX,
      rotationY: SSR_POSE.rotationY,
      rotationZ: SSR_POSE.rotationZ,
      rotation: 0,
      ...overrides,
    });
  }

  function startSsrBounce() {
    ssrBounceTween?.kill();
    ssrBounceTween = gsap.to(ssrCard, {
      y: SSR_POSE.y - 16,
      duration: 0.9,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  function syncInkToDigit(char, { force } = { force: false }) {
    if (!inkCtrl || !char) return;
    if (lastInkLocked && !force) return;
    inkCtrl.playForDigit(char);
  }

  function freezeInk() {
    lastInkLocked = true;
    lastInkFreezeTimer?.kill?.();
    inkCtrl?.freeze?.();
  }

  function hideInk() {
    freezeInk();
    inkCtrl?.hide?.();
  }

  function showCardsLayer() {
    cardsAnimating = true;
    motionBlur.px = 0;
    gsap.set(cardsCanvas, { opacity: 1, filter: 'blur(0px)' });
    gsap.set(countdownCanvas, { opacity: 0 });
  }

  function showInkLayer() {
    cardsAnimating = false;
    gsap.set(cardsCanvas, { opacity: 0 });
    gsap.set(countdownCanvas, { opacity: 1 });
    gsap.set(fireVideo, { opacity: 1 });
    gsap.set(ssrLayer, { opacity: 1, filter: 'blur(0px)' });
    playVideo(fireVideo);
  }

  function leftCornerOffscreen() {
    const fov = camera.fov * DEG;
    const dist = camera.position.z;
    const vh = 2 * dist * Math.tan(fov / 2);
    const vw = vh * VIEW_ASPECT;
    return {
      x: -(vw / 2 + CYL_RADIUS * 1.8 + CARD_W * 0.5),
      y: -(vh / 2 + CYL_RADIUS * 1.1 + CARD_H * 0.4),
    };
  }

  function hexSlot(deg, radiusMul = 1) {
    const radius = hexRadiusForGapScale(hexGap.scale) * radiusMul;
    const r = deg * DEG;
    return {
      x: Math.sin(r) * radius,
      z: -Math.cos(r) * radius,
      ry: Math.atan2(-Math.sin(r), Math.cos(r)),
    };
  }

  function applyCardHexGather() {
    const cupBlend = 1 - cardUpright.t;
    const cupFlare = 1 + cupBlend * (CUP.mouthGapBoost - 1);
    const isDiag = gatherMode === 'after';
    cards.forEach((root) => {
      const spread = root.userData.gather?.t ?? 0;
      const def = root.userData.def;
      const ang = def.deg * DEG;
      const slot = hexSlot(def.deg, cupFlare);
      let px;
      let py;
      let pz;
      if (isDiag) {
        const reachEase = GATHER_DIAG.reachEase ?? 1;
        const reachMul = 1 + spread * (reachEase - 1);
        const reach = spread * GATHER_DIAG.reach * reachMul;
        const lift = spread * (GATHER_DIAG.lift + Math.sin(ang * 2) * GATHER_DIAG.liftWave);
        px = slot.x + Math.sin(ang) * reach;
        py = lift;
        pz = slot.z - Math.cos(ang) * reach;
      } else {
        const r = 1 + spread * (GATHER.radiusMul - 1);
        px = slot.x * r;
        py = spread * GATHER.burstY;
        pz = slot.z * r;
      }
      const gatherTilt = spread * GATHER.tiltOut * Math.cos(ang);
      const cupTilt = -(1 - spread) * cupBlend * CUP.cardTilt * Math.cos(ang);
      root.position.set(px, py, pz);
      root.rotation.set(gatherTilt + cupTilt, slot.ry, 0);
    });
  }

  function applyState() {
    cylinder.position.set(anim.x, anim.y, anim.z);
    cylinderTilt.rotation.set(anim.rotX, 0, anim.rotZ);
    cylinderSpin.rotation.set(0, spin.y + anim.rotYOff, 0);
    applyCardHexGather();
    cards.forEach((root) => {
      root.scale.setScalar(anim.scaleMul);
      setCardOpacity(root, anim.opacity);
    });
  }

  function tickCardsSpin(dt) {
    if (dt > 0 && dt < 0.25) spin.y += spin.rate * dt;
  }

  function makeCardGlowMaterial(tex, overrides = {}) {
    const fx = { ...CARD_FX, ...overrides };
    const w = tex.image?.width || 512;
    const h = tex.image?.height || 768;
    return new THREE.ShaderMaterial({
      uniforms: {
        map: { value: tex },
        opacity: { value: 0 },
        texelSize: { value: new THREE.Vector2(1 / w, 1 / h) },
        borderColor: { value: fx.borderColor },
        metalStrength: { value: fx.metalStrength },
        surfaceGlow: { value: fx.surfaceGlow },
        edgeSampleScale: { value: fx.edgeSampleScale },
        edgeBlurScale: { value: fx.edgeBlurScale },
        edgeMix: { value: fx.edgeMix },
        edgeAdd: { value: fx.edgeAdd },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform float opacity;
        uniform vec2 texelSize;
        uniform vec3 borderColor;
        uniform float metalStrength;
        uniform float surfaceGlow;
        uniform float edgeSampleScale;
        uniform float edgeBlurScale;
        uniform float edgeMix;
        uniform float edgeAdd;
        varying vec2 vUv;

        float sampleA(vec2 uv) {
          return texture2D(map, uv).a;
        }

        float edgeRaw(vec2 uv) {
          vec2 ts = texelSize * edgeSampleScale;
          float aR = sampleA(uv + vec2(ts.x, 0.0));
          float aL = sampleA(uv - vec2(ts.x, 0.0));
          float aU = sampleA(uv + vec2(0.0, ts.y));
          float aD = sampleA(uv - vec2(0.0, ts.y));
          float edgeGrad = length(vec2(aR - aL, aU - aD));
          return smoothstep(0.48, 1.35, edgeGrad);
        }

        float edgeFluff(vec2 uv) {
          vec2 b = texelSize * edgeBlurScale;
          float e = edgeRaw(uv);
          e = max(e, edgeRaw(uv + vec2(b.x, 0.0)) * 0.8);
          e = max(e, edgeRaw(uv - vec2(b.x, 0.0)) * 0.8);
          e = max(e, edgeRaw(uv + vec2(0.0, b.y)) * 0.8);
          e = max(e, edgeRaw(uv - vec2(0.0, b.y)) * 0.8);
          e = max(e, edgeRaw(uv + vec2(b.x, b.y)) * 0.62);
          e = max(e, edgeRaw(uv + vec2(-b.x, b.y)) * 0.62);
          e = max(e, edgeRaw(uv + vec2(b.x, -b.y)) * 0.62);
          e = max(e, edgeRaw(uv + vec2(-b.x, -b.y)) * 0.62);
          return pow(min(e, 1.0), 1.45);
        }

        void main() {
          vec4 texColor = texture2D(map, vUv);
          if (texColor.a < 0.04) discard;

          float edge = edgeFluff(vUv);

          float sheen = sin((vUv.x * 6.0 + vUv.y * 4.0) * 3.14159);
          sheen = pow(abs(sheen), 10.0) * metalStrength;
          float luma = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

          vec3 col = texColor.rgb;
          col += vec3(1.0, 0.95, 0.72) * sheen;
          col += vec3(1.0, 0.9, 0.55) * surfaceGlow * luma;
          col = mix(col, borderColor, edge * edgeMix);
          col += borderColor * edge * edgeAdd;

          gl_FragColor = vec4(col, texColor.a * opacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
  }

  function setCardOpacity(root, opacity) {
    root.userData.face.material.uniforms.opacity.value = opacity;
  }

  function makeCard(tex, def) {
    const root = new THREE.Group();
    root.userData.def = def;
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(CARD_W, CARD_H),
      makeCardGlowMaterial(tex),
    );
    root.add(face);
    root.userData.face = face;
    root.userData.gather = gather;
    const slot = hexSlot(def.deg);
    root.position.set(slot.x, 0, slot.z);
    root.rotation.set(0, slot.ry, 0);
    return root;
  }

  function setSsrCardShaderOpacity(opacity) {
    if (ssrMesh) ssrMesh.material.uniforms.opacity.value = opacity;
  }

  function initSsrCardRenderer(tex) {
    const aspect = tex.image.width / tex.image.height;
    const planeH = 2;
    const planeW = planeH * aspect;

    ssrRenderer = new THREE.WebGLRenderer({
      canvas: ssrCardCanvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    ssrRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    ssrRenderer.setClearColor(0x000000, 0);
    ssrRenderer.outputColorSpace = THREE.SRGBColorSpace;

    ssrScene = new THREE.Scene();
    ssrCamera = new THREE.OrthographicCamera(-planeW / 2, planeW / 2, planeH / 2, -planeH / 2, 0.1, 10);
    ssrCamera.position.z = 1;
    ssrMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(planeW, planeH),
      makeCardGlowMaterial(tex, SSR_CARD_FX),
    );
    ssrScene.add(ssrMesh);
    resizeSsrCardCanvas();
  }

  function resizeSsrCardCanvas() {
    if (!ssrRenderer || !ssrMesh) return;
    const cssW = ssrCard.clientWidth || 400;
    const aspect = ssrMesh.geometry.parameters.height / ssrMesh.geometry.parameters.width;
    const dpr = Math.min(devicePixelRatio, 2);
    ssrRenderer.setSize(
      Math.max(1, Math.round(cssW * dpr)),
      Math.max(1, Math.round(cssW * aspect * dpr)),
      false,
    );
  }

  function animateSsrCard() {
    requestAnimationFrame(animateSsrCard);
    if (ssrRenderer) ssrRenderer.render(ssrScene, ssrCamera);
  }

  async function loadTexture(url) {
    return new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        resolve(tex);
      }, undefined, reject);
    });
  }

  function resetCardsShow() {
    const corner = leftCornerOffscreen();
    anim.x = corner.x;
    anim.y = corner.y;
    anim.z = 0;
    anim.rotX = ROT.horizontal;
    anim.rotZ = 0;
    anim.rotYOff = 0;
    anim.scaleMul = 1;
    anim.opacity = 0;
    spin.y = 0;
    spin.rate = 0;
    gather.t = 1;
    hexGap.scale = HEX_GAP_START;
    cardUpright.t = 0;
    syncHexGapFromUpright();
    cylinder.visible = false;
    cards.forEach((root) => {
      root.scale.setScalar(1);
      setCardOpacity(root, 0);
    });
    applyCardHexGather();
    applyState();
  }

  function buildCardsTimeline() {
    const tl = gsap.timeline();
    const isDiag = gatherMode === 'after';
    const d = CARD_INTRO_DELAY;
    const t1 = d + T.slide;
    const t2 = t1 + T.stand;
    const t3 = t2 + T.hold;
    const t4 = t3 + T.rise;

    tl.add(() => {
      motionBlur.px = 0;
      applyCardsMotionBlur();
    }, 0);

    tl.add(() => {
      if (isDiag) {
        anim.x = FORM.x;
        anim.y = FORM.yStart ?? FORM.y;
      } else {
        const corner = leftCornerOffscreen();
        anim.x = corner.x;
        anim.y = corner.y;
      }
      cylinder.visible = true;
      anim.z = 0;
      anim.rotX = ROT.horizontal;
      anim.rotZ = 0;
      anim.rotYOff = 0;
      anim.scaleMul = 1;
      anim.opacity = 0;
      spin.y = 0;
      spin.rate = 0;
      gather.t = 1;
      hexGap.scale = HEX_GAP_START;
      cardUpright.t = 0;
      syncHexGapFromUpright();
      applyState();
    }, d);

    tl.fromTo(gather, { t: 1 }, { t: 0, duration: T.slide, ease: segEase('gatherSpread') }, d);
    tl.to(spin, {
      y: `+=${GATHER_ROTATIONS * Math.PI * 2}`,
      duration: T.slide,
      ease: segEase('gatherSpin'),
    }, d);
    if (isDiag) {
      tl.to(anim, {
        y: FORM.y,
        scaleMul: FORM.scaleMul,
        opacity: 1,
        duration: T.slide,
        ease: segEase('slideMove'),
      }, d);
    } else {
      tl.to(anim, {
        x: FORM.x,
        y: FORM.y,
        scaleMul: FORM.scaleMul,
        opacity: 1,
        duration: T.slide,
        ease: segEase('slideMove'),
      }, d);
    }
    tl.to(anim, {
      rotX: FORM.rotX,
      rotZ: FORM.rotZ,
      rotYOff: FORM.rotYOff,
      duration: T.slide,
      ease: segEase('slideTilt'),
    }, d);
    tl.fromTo(motionBlur, { px: 0 }, {
      px: CYL_BLUR.gatherPeak,
      duration: T.slide * 0.55,
      ease: segEase('gatherBlur'),
      onUpdate: applyCardsMotionBlur,
    }, d);
    tl.to(motionBlur, {
      px: 0,
      duration: T.slide * 0.45,
      ease: segEase('gatherBlur'),
      onUpdate: applyCardsMotionBlur,
    }, d + T.slide * 0.55);

    tl.to(anim, {
      rotX: ROT.poseX,
      rotZ: ROT.poseZ,
      rotYOff: ROT.poseYOff,
      duration: T.stand,
      ease: segEase('standTilt'),
    }, t1);
    tl.to(anim, {
      x: FORM.poseX,
      y: FORM.driftY,
      duration: T.stand + T.hold,
      ease: segEase('holdMove'),
    }, t1);
    tl.to(spin, {
      y: `+=${POST_GATHER_ROTATIONS * Math.PI * 2}`,
      duration: T.stand + T.hold,
      ease: segEase('holdSpin'),
    }, t1);
    tl.to(anim, {
      scaleMul: ROT.poseScale,
      duration: T.stand + T.hold,
      ease: segEase('holdScale'),
    }, t1);
    tl.to(anim, {
      z: 0.16,
      duration: T.hold,
      ease: segEase('holdDepth'),
    }, t2);
    tl.to(cardUpright, {
      t: 1,
      duration: T.stand + T.hold + T.rise,
      ease: segEase('cardUpright'),
      onUpdate: syncHexGapFromUpright,
    }, t1);

    tl.to(anim, {
      rotX: 0,
      rotZ: 0,
      rotYOff: 0,
      duration: CYL_VERTICAL_DUR,
      ease: segEase('riseVertical'),
    }, t3);
    tl.to(spin, {
      y: `+=${CLOSE_SPIN_SLOW * Math.PI * 2}`,
      duration: T.rise,
      ease: segEase('riseSpin'),
    }, t3);
    tl.to(anim, {
      x: RISE.mid.x,
      y: RISE.mid.y,
      z: RISE.mid.z,
      duration: T.rise,
      ease: segEase('riseMove'),
    }, t3);
    tl.to(anim, {
      scaleMul: 0.55,
      opacity: 0.35,
      duration: T.rise * 0.65,
      ease: segEase('riseFade'),
    }, t3);
    tl.add(() => se.play('rise'), t3);

    tl.to(spin, {
      y: `+=${CLOSE_SPIN_FAST * Math.PI * 2}`,
      duration: T.exit,
      ease: segEase('exitSpin'),
    }, t4);
    tl.to(anim, {
      x: RISE.exit.x,
      y: RISE.exit.y,
      z: RISE.exit.z,
      duration: T.exit,
      ease: segEase('exitMove'),
    }, t4);
    tl.to(anim, {
      scaleMul: 0.12,
      opacity: 0,
      duration: T.exit,
      ease: segEase('exitFade'),
    }, t4);
    tl.fromTo(motionBlur, { px: 0 }, {
      px: CYL_BLUR.exitPeak,
      duration: T.exit * 0.45,
      ease: segEase('exitBlur'),
      onUpdate: applyCardsMotionBlur,
    }, t4);
    tl.to(motionBlur, {
      px: 0,
      duration: T.exit * 0.55,
      ease: segEase('exitBlur'),
      onUpdate: applyCardsMotionBlur,
    }, t4 + T.exit * 0.45);

    tl.add(() => {
      motionBlur.px = 0;
      applyCardsMotionBlur();
      resetCardsShow();
    }, TOTAL);

    const post = POST_SHOW_AFTER;
    const ssrAt = t3 + SSR_CROSS_RISE_OFFSET;
    const inkAt = ssrAt + SSR_DROP_DUR + post.inkAfterSsrLand;
    tl.add(() => dropSsrCard(), ssrAt);
    tl.add(() => startInkPhase(), inkAt);
    return tl;
  }

  function dropSsrCard() {
    ssrBounceTween?.kill();
    gsap.killTweensOf([ssrCard, ssrLayer]);
    gsap.set(ssrLayer, { opacity: 1, filter: 'blur(0px)' });
    setSsrCardCenter({ ...SSR_DROP.from });
    gsap.set(ssrCard, { opacity: 1 });
    setSsrCardShaderOpacity(0);
    se.play('ssrIn');
    gsap.to(ssrCard, {
      x: SSR_POSE.x,
      y: SSR_POSE.y,
      z: SSR_POSE.z,
      scale: SSR_POSE.scale,
      rotationX: SSR_POSE.rotationX,
      rotationY: SSR_POSE.rotationY,
      rotationZ: SSR_POSE.rotationZ,
      rotation: 0,
      duration: SSR_DROP_DUR,
      ease: 'power3.in',
    });
    gsap.to({ v: 0 }, {
      v: 1,
      duration: SSR_DROP_DUR,
      ease: 'power3.in',
      onUpdate() {
        setSsrCardShaderOpacity(this.targets()[0].v);
      },
      onComplete: () => {
        startSsrBounce();
      },
    });
  }

  function startInkPhase() {
    showInkLayer();
    inkCtrl?.reset?.();
    gsap.set([darkenEl, whiteoutEl], { opacity: 0 });
    gsap.set(whiteSsrVideo, { opacity: 0 });
    inkCountdownTimer = gsap.delayedCall(activePostShow.countdownDelay, () => {
      if (countdownCtrl) countdownCtrl.play();
    });
  }

  function resetInkPhase() {
    lastInkLocked = false;
    lastInkFreezeTimer?.kill?.();
    gsap.killTweensOf([darkenEl, whiteoutEl, ssrCard, whiteSsrVideo, fireVideo, countdownCanvas]);
    inkCtrl?.reset?.();
    gsap.set([darkenEl, whiteoutEl], { opacity: 0 });
    gsap.set(whiteSsrVideo, { opacity: 0 });
    gsap.set(fireVideo, { opacity: 1 });
    gsap.set(countdownCanvas, { opacity: 0 });
    countdownCtrl?.reset?.();
  }

  function playShow(mode) {
    if (mode) setGatherMode(mode);
    else setGatherMode(resolveGather());
    cupRiseMode = 'after';
    activePostShow = POST_SHOW_AFTER;
    cardsMasterTL?.kill();
    inkCountdownTimer?.kill();
    ssrBounceTween?.kill();
    gsap.killTweensOf([ssrCard, ssrLayer, cardsCanvas]);
    resetInkPhase();
    resetCardsShow();
    showCardsLayer();
    gsap.set(ssrLayer, { opacity: 1, filter: 'blur(0px)' });
    setSsrCardCenter();
    gsap.set(ssrCard, { opacity: 0 });
    setSsrCardShaderOpacity(0);
    if (fireVideo.paused) playVideo(fireVideo);
    if (seReady) se.startFire();
    cardsMasterTL = buildCardsTimeline();
  }

  const depthSortPos = new THREE.Vector3();

  function updateDepthSort() {
    if (!cylinder.visible) return;
    cards.forEach((root) => {
      root.getWorldPosition(depthSortPos);
      const def = root.userData.def;
      const order = def.isGold ? 100 : Math.round(depthSortPos.z * 20);
      root.userData.face.renderOrder = order;
    });
  }

  function onResize() {
    const { w, h } = stageSize();
    camera.aspect = VIEW_ASPECT;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    resizeSsrCardCanvas();
  }

  function cardsFrame(_time, deltaTime) {
    if (!cardsAnimating) return;
    tickCardsSpin(Math.min(0.05, deltaTime));
    applyState();
    updateDepthSort();
    renderer.render(scene, camera);
  }

  // --- init ---
  setSsrCardCenter();
  gsap.set(fireVideo, { opacity: 1 });
  gsap.set(ssrLayer, { opacity: 1, filter: 'blur(0px)' });
  gsap.set(ssrCard, { opacity: 0 });
  gsap.set(countdownCanvas, { opacity: 0 });
  showCardsLayer();

  [fireVideo, whiteSsrVideo].forEach((el) => {
    playVideo(el);
    el.addEventListener('canplay', () => playVideo(el));
    el.addEventListener('loadeddata', () => playVideo(el));
  });

  renderer = new THREE.WebGLRenderer({
    canvas: cardsCanvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const { w, h } = stageSize();
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = REF_MATCH.CAMERA.exposure;
  renderer.sortObjects = true;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(REF_MATCH.CAMERA.fov, VIEW_ASPECT, 0.1, 50);
  camera.position.set(...REF_MATCH.CAMERA.pos);
  camera.lookAt(...REF_MATCH.CAMERA.look);
  cylinder = new THREE.Group();
  cylinderTilt = new THREE.Group();
  cylinderSpin = new THREE.Group();
  cylinder.add(cylinderTilt);
  cylinderTilt.add(cylinderSpin);
  scene.add(cylinder);
  window.onresize = onResize;
  gsap.ticker.add(cardsFrame);

  fireVideo.muted = true;
  fireVideo.playsInline = true;
  fireVideo.loop = true;
  await new Promise((resolve) => {
    if (fireVideo.readyState >= 1 && fireVideo.videoWidth) { resolve(); return; }
    const done = () => resolve();
    fireVideo.addEventListener('loadedmetadata', done, { once: true });
    fireVideo.addEventListener('loadeddata', done, { once: true });
    setTimeout(done, 1200);
  });
  try { await fireVideo.play(); } catch {
    await new Promise((resolve) => {
      const resume = () => { fireVideo.play().finally(resolve); window.removeEventListener('pointerdown', resume); };
      window.addEventListener('pointerdown', resume, { once: true });
      setTimeout(resolve, 300);
    });
  }

  const textures = await Promise.all(CARD_DEFS.map((d) => loadTexture(d.src)));
  cards = CARD_DEFS.map((def, i) => {
    const card = makeCard(textures[i], def);
    cylinderSpin.add(card);
    return card;
  });

  const ssrTexture = await loadTexture('./ssr card.png');
  initSsrCardRenderer(ssrTexture);
  setSsrCardShaderOpacity(0);
  animateSsrCard();

  if (inkCanvas) {
    inkCtrl = await initInkOverlay({ canvas: inkCanvas, stageEl });
  }

  const countdownPromise = skipCountdown
    ? Promise.resolve({ reset() {}, start() {} })
    : initCountdownOverlay({
    canvas: countdownCanvas,
    stageEl,
    fireVideoEl: fireVideo,
    replayBtn,
    onReplay: () => {
      resetFireIntro();
      playShow();
    },
    autoplay: false,
    onDigitStart: (char) => {
      if (char === 'LAST') {
        se.play('last');
        return;
      }
      if (lastInkLocked) return;
      syncInkToDigit(char);
      se.play('taiko');
    },
    onLastShown: () => {
      lastInkLocked = true;
      syncInkToDigit('LAST', { force: true });
      lastInkFreezeTimer?.kill?.();
      lastInkFreezeTimer = gsap.delayedCall(activePostShow.lastInkFreeze, freezeInk);
      gsap.killTweensOf([darkenEl, ssrLayer, whiteoutEl, whiteSsrVideo, ssrCard]);
      gsap.delayedCall(activePostShow.lastToDarken, () => {
        gsap.killTweensOf([darkenEl, ssrLayer, whiteoutEl, whiteSsrVideo, ssrCard]);
        gsap.set([darkenEl, whiteoutEl], { opacity: 0 });
        gsap.set(ssrLayer, { opacity: 1, filter: 'blur(0px)' });
        gsap.set(whiteSsrVideo, { opacity: 0 });

        const tl = gsap.timeline();
        tl.add(() => se.fadeOutFire({ fade: activePostShow.fireFadeOut }), 0);
        tl.to(darkenEl, { opacity: 1, duration: activePostShow.darkenDur, ease: POST }, 0);
        tl.add(() => {
          gsap.set(countdownCanvas, { opacity: 0 });
          hideInk();
          gsap.set(fireVideo, { opacity: 0 });
          try { fireVideo.pause(); } catch (_) {}
          playVideo(whiteSsrVideo);
          se.startWhiteSsr({ fadeIn: activePostShow.whiteRevealDur });
          ssrBounceTween?.kill();
          setSsrCardCenter();
          gsap.set(ssrCard, { opacity: 1 });
          setSsrCardShaderOpacity(0);
        }, '>');
        tl.to(darkenEl, { opacity: 0, duration: activePostShow.whiteRevealDur, ease: POST }, '<');
        tl.to(whiteSsrVideo, { opacity: 1, duration: activePostShow.whiteRevealDur, ease: POST }, '<');
        tl.to({ ssrO: 0 }, {
          ssrO: 1,
          duration: activePostShow.whiteRevealDur,
          ease: POST,
          onUpdate() {
            setSsrCardShaderOpacity(this.targets()[0].ssrO);
          },
        }, '<');
        tl.add(() => startSsrBounce(), '<');
        tl.to({}, { duration: activePostShow.finaleHold, ease: 'none' }, '>');
        tl.to(whiteoutEl, { opacity: 1, duration: activePostShow.whiteoutDur, ease: POST }, '>');
      });
    },
    onComplete: () => {},
  });

  countdownCtrl = await countdownPromise;

  if (replayBtn) {
    replayBtn.hidden = false;
    replayBtn.onclick = () => {
      resetFireIntro();
      playShow();
    };
  }

  resetCardsShow();

  const _measurePt = new THREE.Vector3();
  function measureCardsScreenBBox() {
    const { w, h } = stageSize();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    cards.forEach((root) => {
      root.updateWorldMatrix(true, true);
      const geo = root.userData.face.geometry;
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i += 1) {
        _measurePt.fromBufferAttribute(pos, i);
        root.localToWorld(_measurePt);
        _measurePt.project(camera);
        const sx = (_measurePt.x * 0.5 + 0.5) * w;
        const sy = (-_measurePt.y * 0.5 + 0.5) * h;
        minX = Math.min(minX, sx);
        maxX = Math.max(maxX, sx);
        minY = Math.min(minY, sy);
        maxY = Math.max(maxY, sy);
      }
    });
    if (!Number.isFinite(minX)) return null;
    return {
      cx: (minX + maxX) / 2 / w,
      cy: (minY + maxY) / 2 / h,
      w: (maxX - minX) / w,
      h: (maxY - minY) / h,
    };
  }

  function seekCardsTime(t) {
    cardsAnimating = false;
    cardsMasterTL?.kill();
    gatherMode = 'after';
    cupRiseMode = 'after';
    resetCardsShow();
    showCardsLayer();
    cylinder.visible = true;
    anim.opacity = 1;
    cards.forEach((root) => setCardOpacity(root, 1));
    cardsMasterTL = buildCardsTimeline();
    cardsMasterTL.pause();
    cardsMasterTL.seek(t);
    applyState();
    updateDepthSort();
    renderer.render(scene, camera);
    return measureCardsScreenBBox();
  }

  return {
    playShow,
    setCupRiseMode,
    getCupRiseMode,
    getPostShow,
    setGatherMode,
    getGatherMode,
    seekCardsTime,
    measureCardsScreenBBox,
    getRefConstants: () => ({
      CARD_W,
      FORM: { ...FORM },
      ROT: { ...ROT },
      GATHER_DIAG: { ...GATHER_DIAG },
      RISE: { mid: { ...RISE.mid }, exit: { ...RISE.exit } },
      T: { ...T },
      TOTAL,
    }),
  };
}
