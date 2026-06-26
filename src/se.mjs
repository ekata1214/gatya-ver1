const ASSETS = {
  fire: './re fire se.mp3',
  rise: './六角筒上昇.mp3',
  ssrIn: './ssr card登場.mp3',
  taiko: './和太鼓でドン.mp3',
  last: './LAST.mp3',
  whiteSsr: './white ssr.mp3',
};

const FIRE_INTRO_KEY = 'gatya-fire-intro-done';
const SE_ENABLED = false;

const noopSE = {
  unlock: async () => {},
  play: () => {},
  startFire: () => {},
  resumeFire: () => {},
  fadeOutFire: () => {},
  startWhiteSsr: () => {},
  setVolume: () => {},
  saveFireState: () => {},
};

export function createSE({ volume = 1 } = {}) {
  if (!SE_ENABLED) return noopSE;

  let master = volume;
  let unlocked = false;
  const clips = new Map();
  let fireTween = null;
  let whiteTween = null;

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
        setTimeout(done, 1500);
      })),
    );
  }

  function playShot(key, { v = 1 } = {}) {
    if (!unlocked) return;
    const src = ASSETS[key];
    if (!src) return;
    const a = new Audio(src);
    a.volume = vol(v);
    const p = a.play();
    if (p?.catch) p.catch(() => {});
  }

  function startFire({ v = 0.75, resume = false } = {}) {
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

  function resumeFire({ v = 0.75 } = {}) {
    unlocked = true;
    startFire({ v, resume: true });
  }

  function saveFireState() {
    const a = clips.get('fire');
    if (!a || a.paused) return;
    sessionStorage.setItem('gatya-fire-audio-t', String(a.currentTime));
  }

  function fadeOutFire({ fade = 3 } = {}) {
    const a = clips.get('fire');
    if (!a) return;
    gsap?.killTweensOf?.(a);
    fadeAudio(a, 0, fade, () => {
      try { a.pause(); } catch (_) {}
    });
  }

  function startWhiteSsr({ fadeIn = 0.6, v = 0.85 } = {}) {
    if (!unlocked) return;
    const a = clip('whiteSsr');
    a.loop = false;
    if (whiteTween) {
      gsap?.killTweensOf?.(a);
      whiteTween = null;
    }
    try { a.currentTime = 0; } catch (_) {}
    a.volume = 0;
    const p = a.play();
    if (p?.catch) p.catch(() => {});
    fadeAudio(a, vol(v), fadeIn);
  }

  function play(name) {
    switch (name) {
      case 'rise': playShot('rise'); break;
      case 'ssrIn': playShot('ssrIn'); break;
      case 'taiko': playShot('taiko'); break;
      case 'last': playShot('last'); break;
      default: break;
    }
  }

  function setVolume(v) {
    master = Math.max(0, Math.min(1.5, v));
  }

  return { unlock, play, startFire, resumeFire, fadeOutFire, startWhiteSsr, setVolume, saveFireState };
}

export function resetFireIntro() {
  if (!SE_ENABLED) return;
  sessionStorage.removeItem(FIRE_INTRO_KEY);
}
