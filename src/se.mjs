const ASSET_ROOT = './assets/se/';
const SE2_ROOT = './assets/se2/';

const ASSETS = {
  fire: `${ASSET_ROOT}fire.mp3`,
  cardAppear: `${ASSET_ROOT}card-appear.mp3`,
  gather: `${SE2_ROOT}03_sparkle_shiny_02.wav`,
  hexLock: `${SE2_ROOT}03_sparkle_shiny_03.wav`,
  tensionReel: `${ASSET_ROOT}tension-reel.mp3`,
  rise: `${SE2_ROOT}08_sparkle_kira_03.wav`,
  ssrIn: `${ASSET_ROOT}ssr-in.mp3`,
  ssrLand: `${SE2_ROOT}10_ball_hit_kon_03.wav`,
  taiko: `${ASSET_ROOT}taiko.mp3`,
  darkenDrop: `${ASSET_ROOT}darken-drop.mp3`,
  whiteSsr: `${ASSET_ROOT}white-ssr.mp3`,
  whiteout: `${SE2_ROOT}03_sparkle_shiny_02.wav`,
  gachaStart: `${ASSET_ROOT}gacha-start.mp3`,
  uiClick: `${ASSET_ROOT}ui-click.mp3`,
  bgmMain: `${ASSET_ROOT}bgm-main.mp3`,
};

/** Per-shot gain (× master). */
const SHOT_VOL = {
  cardAppear: 0.78,
  gather: 0.68,
  hexLock: 0.72,
  rise: 0.88,
  ssrIn: 0.58,
  ssrLand: 0.95,
  taiko: 0.98,
  darkenDrop: 0.75,
  whiteSsr: 0.88,
  whiteout: 0.8,
  gachaStart: 0.9,
  uiClick: 0.5,
};

const FIRE_INTRO_KEY = 'gatya-fire-intro-done';
const SE_ENABLED = true;

const noopSE = {
  unlock: async () => {},
  play: () => {},
  playCombo: () => {},
  startFire: () => {},
  resumeFire: () => {},
  fadeOutFire: () => {},
  startTensionReel: () => {},
  stopTensionReel: () => {},
  startWhiteSsr: () => {},
  startBgmMain: () => {},
  rampBgmMain: () => {},
  crossfadeToBgmClimax: () => {},
  stopAllBgm: () => {},
  resetShow: () => {},
  setVolume: () => {},
  saveFireState: () => {},
};

export function createSE({ volume = 1 } = {}) {
  if (!SE_ENABLED) return noopSE;

  let master = volume;
  let unlocked = false;
  const clips = new Map();
  let fireTween = null;
  let mainBgmTween = null;
  let reelTween = null;

  function clip(key) {
    if (!clips.has(key)) {
      const a = new Audio(ASSETS[key]);
      a.preload = 'auto';
      clips.set(key, a);
    }
    return clips.get(key);
  }

  function vol(v = 1) {
    return Math.max(0, Math.min(1, master * v));
  }

  function fadeAudio(audio, to, duration, onComplete) {
    if (!audio) return;
    const from = audio.volume;
    if (!duration || duration <= 0) {
      audio.volume = to;
      onComplete?.();
      return;
    }
    if (typeof gsap !== 'undefined') {
      gsap.killTweensOf(audio);
      gsap.to(audio, {
        volume: to,
        duration,
        ease: 'none',
        onComplete,
      });
      return;
    }
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / (duration * 1000));
      audio.volume = from + (to - from) * p;
      if (p < 1) requestAnimationFrame(step);
      else onComplete?.();
    };
    requestAnimationFrame(step);
  }

  async function unlock() {
    if (unlocked) return;
    unlocked = true;
    await Promise.all(
      Object.keys(ASSETS).map((key) => new Promise((resolve) => {
        const a = clip(key);
        const done = () => resolve();
        a.addEventListener('canplaythrough', done, { once: true });
        a.addEventListener('error', done, { once: true });
        a.load();
        setTimeout(done, 2500);
      })),
    );
  }

  function playShot(key, { v = 1 } = {}) {
    if (!unlocked) return;
    const src = ASSETS[key];
    if (!src) return;
    const a = new Audio(src);
    const gain = SHOT_VOL[key] ?? 1;
    a.volume = vol(v * gain);
    const p = a.play();
    if (p?.catch) p.catch(() => {});
  }

  function playCombo(names, { v = 1, stagger = 0 } = {}) {
    const list = Array.isArray(names) ? names : [names];
    list.forEach((name, i) => {
      const delay = stagger * i * 1000;
      if (delay > 0) setTimeout(() => playShot(name, { v }), delay);
      else playShot(name, { v });
    });
  }

  function startLoop(key, {
    v = 1,
    fadeIn = 0,
    resume = false,
    tweenRef = { current: null },
  } = {}) {
    if (!unlocked) return;
    const a = clip(key);
    a.loop = true;
    if (tweenRef.current) {
      gsap?.killTweensOf?.(a);
      tweenRef.current = null;
    }
    if (!resume) {
      try { a.currentTime = 0; } catch (_) {}
    }
    a.volume = fadeIn > 0 ? 0 : vol(v);
    const p = a.play();
    if (p?.catch) p.catch(() => {});
    if (fadeIn > 0) fadeAudio(a, vol(v), fadeIn);
  }

  function fadeOutLoop(key, { fade = 1, tweenRef = { current: null } } = {}) {
    const a = clips.get(key);
    if (!a) return;
    gsap?.killTweensOf?.(a);
    fadeAudio(a, 0, fade, () => {
      try { a.pause(); } catch (_) {}
      tweenRef.current = null;
    });
  }

  function startFire({ v = 0.72, resume = false } = {}) {
    if (!unlocked) return;
    const a = clip('fire');
    a.loop = true;
    if (fireTween) {
      gsap?.killTweensOf?.(a);
      fireTween = null;
    }

    const savedT = sessionStorage.getItem('gatya-fire-audio-t');
    if (resume && savedT != null) {
      try { a.currentTime = parseFloat(savedT); } catch (_) {}
      sessionStorage.removeItem('gatya-fire-audio-t');
      a.volume = vol(v);
      const p = a.play();
      if (p?.catch) p.catch(() => {});
      return;
    }

    if (!a.paused && a.currentTime > 0.05 && a.volume > 0.01) return;

    const introDone = sessionStorage.getItem(FIRE_INTRO_KEY) === '1';
    const fadeIn = introDone ? 0 : 0.1;
    if (!introDone) sessionStorage.setItem(FIRE_INTRO_KEY, '1');

    try { a.currentTime = 0; } catch (_) {}
    a.volume = fadeIn > 0 ? 0 : vol(v);
    const p = a.play();
    if (p?.catch) p.catch(() => {});
    if (fadeIn > 0) fadeAudio(a, vol(v), fadeIn);
  }

  function resumeFire({ v = 0.72 } = {}) {
    unlocked = true;
    startFire({ v, resume: true });
  }

  function saveFireState() {
    const a = clips.get('fire');
    if (!a || a.paused) return;
    sessionStorage.setItem('gatya-fire-audio-t', String(a.currentTime));
  }

  function fadeOutFire({ fade = 3 } = {}) {
    fadeOutLoop('fire', { fade, tweenRef: { current: fireTween } });
  }

  function startTensionReel({ fadeIn = 0.2, v = 0.3 } = {}) {
    startLoop('tensionReel', { v, fadeIn, tweenRef: { current: reelTween } });
  }

  function stopTensionReel({ fade = 0.22 } = {}) {
    fadeOutLoop('tensionReel', { fade, tweenRef: { current: reelTween } });
  }

  function startWhiteSsr() {
    if (!unlocked) return;
    playShot('whiteSsr');
  }

  function stopBgmMain({ fade = 0.6 } = {}) {
    fadeOutLoop('bgmMain', { fade, tweenRef: { current: mainBgmTween } });
  }

  function startBgmMain({ fadeIn = 0.45, v = 0.78 } = {}) {
    if (!unlocked) return;
    startLoop('bgmMain', { v, fadeIn, tweenRef: { current: mainBgmTween } });
  }

  function rampBgmMain({ to = 0.68, duration = 7, ease = 'power2.in' } = {}) {
    const a = clips.get('bgmMain');
    if (!a || a.paused) return;
    gsap?.killTweensOf?.(a);
    gsap?.to?.(a, { volume: vol(to), duration, ease });
  }

  /** 白演出 — 同一BGMを頭出しせず音量だけ盛る */
  function crossfadeToBgmClimax({ fadeIn = 1.0, v = 0.78 } = {}) {
    rampBgmMain({ to: v, duration: fadeIn, ease: 'power2.out' });
  }

  function stopAllBgm({ fade = 1.0 } = {}) {
    stopBgmMain({ fade });
    stopTensionReel({ fade: fade * 0.4 });
  }

  function resetShow() {
    ['bgmMain', 'tensionReel'].forEach((key) => {
      const a = clips.get(key);
      if (!a) return;
      gsap?.killTweensOf?.(a);
      try { a.pause(); a.currentTime = 0; } catch (_) {}
      a.volume = 0;
    });
    mainBgmTween = null;
    reelTween = null;
  }

  function play(name) {
    switch (name) {
      case 'cardAppear': playShot('cardAppear'); break;
      case 'gather': playShot('gather'); break;
      case 'hexLock': playShot('hexLock'); break;
      case 'rise': playShot('rise'); break;
      case 'ssrIn': playShot('ssrIn'); break;
      case 'ssrLand': playShot('ssrLand'); break;
      case 'taiko': playShot('taiko'); break;
      case 'darkenDrop': playShot('darkenDrop'); break;
      case 'whiteout': playShot('whiteout'); break;
      case 'gachaStart': playShot('gachaStart'); break;
      case 'uiClick': playShot('uiClick'); break;
      default: break;
    }
  }

  function setVolume(v) {
    master = Math.max(0, Math.min(1.5, v));
  }

  return {
    unlock,
    play,
    playCombo,
    startFire,
    resumeFire,
    fadeOutFire,
    startTensionReel,
    stopTensionReel,
    startWhiteSsr,
    startBgmMain,
    rampBgmMain,
    crossfadeToBgmClimax,
    stopAllBgm,
    resetShow,
    setVolume,
    saveFireState,
  };
}

export function resetFireIntro() {
  if (!SE_ENABLED) return;
  sessionStorage.removeItem(FIRE_INTRO_KEY);
}
