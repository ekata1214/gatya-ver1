export class AudioManager {
  constructor() {
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { this.ctx = null; }
    this.fireSrc = null;
    this.fireGain = null;
  }

  resume() { this.ctx?.resume(); }

  stopFire() {
    try { this.fireSrc?.stop(); } catch (_) {}
    this.fireSrc = null;
    this.fireGain = null;
  }

  playFireLoop() {
    if (!this.ctx) return;
    this.stopFire();
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 3, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.35;
    this.fireSrc = this.ctx.createBufferSource();
    this.fireSrc.buffer = buf;
    this.fireSrc.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 260;
    this.fireGain = this.ctx.createGain();
    this.fireGain.gain.value = 0.14;
    this.fireSrc.connect(f).connect(this.fireGain).connect(this.ctx.destination);
    this.fireSrc.start();
  }

  setFireVolume(v) {
    if (this.fireGain) this.fireGain.gain.value = v;
  }

  playImpact(freq = 88) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(freq, t0);
    o.frequency.exponentialRampToValueAtTime(freq * 0.4, t0 + 0.22);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.6, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
    o.connect(g).connect(this.ctx.destination);
    o.start(t0);
    o.stop(t0 + 0.34);
  }

  playLowBoom() {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(48, t0);
    o.frequency.exponentialRampToValueAtTime(24, t0 + 0.7);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.75, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.95);
    o.connect(g).connect(this.ctx.destination);
    o.start(t0);
    o.stop(t0 + 1);
  }

  playKiraan() {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'triangle';
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(1300, t0);
    o.frequency.exponentialRampToValueAtTime(2500, t0 + 0.5);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.32, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
    o.connect(g).connect(this.ctx.destination);
    o.start(t0);
    o.stop(t0 + 0.58);
  }
}
