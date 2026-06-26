import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { ASSETS } from './assets.js';
import { StateMachine, States } from './core/StateMachine.js';
import { loadTexture } from './utils/helpers.js';
import { AudioManager } from './managers/AudioManager.js';
import { CameraManager } from './managers/CameraManager.js';
import { ParticleManager } from './managers/ParticleManager.js';
import { CardManager } from './managers/CardManager.js';
import { EffectManager } from './managers/EffectManager.js';
import { AnimationManager } from './managers/AnimationManager.js';

export class GachaScene {
  constructor(dom) {
    this.dom = dom;
    this.playing = false;
    this.clock = new THREE.Clock();
    this.loader = new THREE.TextureLoader();
    this.sm = new StateMachine((s) => { document.body.dataset.state = s; });
    this.anim = new AnimationManager(this);
    this.onFinish = null;
  }

  async init() {
    this.timeline = await fetch('config/timeline.json').then((r) => r.json());

    this.textures = {};
    const allUrls = [...ASSETS.cards, ASSETS.ssrCard];
    await Promise.all(allUrls.map(async (url) => {
      this.textures[url] = await loadTexture(this.loader, url);
    }));

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.dom.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setClearColor(0x000000);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.cam = new CameraManager(this.timeline.camera, this.dom.canvas);
    this.audio = new AudioManager();
    this.particles = new ParticleManager(this.scene);
    this.cards = new CardManager(this.scene, ASSETS, this.timeline.card, this.textures);
    this.effects = new EffectManager(this.scene, ASSETS);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1);
    key.position.set(2, 4, 6);
    this.scene.add(key);

    this.effects.resize(this.cam.camera);
    this._loop();
    return this;
  }

  resize() {
    if (!this.renderer) return;
    this.renderer.setSize(innerWidth, innerHeight);
    this.cam.resize(innerWidth, innerHeight);
    this.effects.resize(this.cam.camera);
  }

  start() {
    if (this.playing) return false;
    this.playing = true;
    this.audio.resume();
    this.anim.build();
    return true;
  }

  reset() {
    this.anim.kill();
    gsap.killTweensOf([
      this.dom.flash, this.dom.darken,
      this.effects.firePlane?.material,
      this.effects.ssrPlane?.material,
      this.cards.ring,
      this.cards.heroGroup,
      this.cards.circlePlane?.material,
      this.cards.hero?.material,
      this.effects.inkPlane?.material,
      this.effects.countPlane?.material,
      this.cam.camera,
    ]);
    this.audio.stopFire();
    this.particles.reset();
    this.cards.reset();
    this.effects.reset();
    this.effects.hidePostTelopVideos();
    this.cam.reset();
    gsap.killTweensOf(this.cam.camera);
    this.dom.flash.style.opacity = '0';
    this.dom.darken.style.opacity = '0';
    this.dom.telop.className = '';
    this.dom.telop.style.opacity = '0';
    this.sm.reset();
    this.playing = false;
  }

  _loop() {
    requestAnimationFrame(() => this._loop());
    if (!this.renderer) return;
    const dt = Math.min(this.clock.getDelta(), 0.033);
    const anchor = this.cards.heroGroup?.visible ? this.cards.heroGroup.position : null;
    this.particles.update(dt, anchor);
    this.cards.update(dt);
    this.renderer.render(this.scene, this.cam.camera);
  }
}

export { States };
