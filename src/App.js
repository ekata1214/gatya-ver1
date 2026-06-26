import { GachaScene } from './GachaScene.js';
import { ASSETS } from './assets.js';

export class App {
  constructor() {
    this.dom = {
      canvas: document.getElementById('canvas'),
      flash: document.getElementById('flash'),
      darken: document.getElementById('darken'),
      telop: document.getElementById('telop-img'),
      startBtn: document.getElementById('start-btn'),
      retryBtn: document.getElementById('retry-btn'),
      skipBtn: document.getElementById('skip-btn'),
    };
    this.dom.telop.src = ASSETS.telop;
    this.dom.telop.onerror = () => console.warn(`[assets] telop load failed: ${ASSETS.telop}`);
    this.dom.startBtn.disabled = true;
    this.scene = new GachaScene(this.dom);
  }

  async init() {
    await this.scene.init();
    this.scene.onFinish = () => this.onFinish();
    this.dom.startBtn.disabled = false;
    this.dom.startBtn.onclick = () => this.start();
    this.dom.retryBtn.onclick = () => { this.reset(); this.start(); };
    this.dom.skipBtn.onclick = () => this.reset();
    window.onresize = () => this.scene.resize();
  }

  setUI(on) {
    this.dom.startBtn.classList.toggle('off', on);
    this.dom.skipBtn.hidden = !on;
    this.dom.skipBtn.classList.toggle('off', !on);
    if (on) {
      this.dom.retryBtn.classList.remove('on');
      this.dom.retryBtn.hidden = true;
    }
  }

  start() {
    this.setUI(true);
    this.scene.start();
  }

  reset() {
    this.scene.reset();
    this.setUI(false);
    this.dom.startBtn.classList.remove('off');
    this.dom.retryBtn.classList.remove('on');
    this.dom.retryBtn.hidden = true;
  }

  onFinish() {
    this.dom.skipBtn.classList.add('off');
    this.dom.skipBtn.hidden = true;
    this.dom.retryBtn.hidden = false;
    this.dom.retryBtn.classList.add('on');
  }
}

const app = new App();
app.init().catch((e) => console.error('[App] init failed:', e));
window.__gachaApp = app;
