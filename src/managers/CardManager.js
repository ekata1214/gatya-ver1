import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { makeVideo, pxToWorld } from '../utils/helpers.js';

export class CardManager {
  constructor(scene, assets, cfg, textures) {
    this.scene = scene;
    this.assets = assets;
    this.cfg = cfg;
    this.textures = textures;
    this.H = cfg.height;
    this.W = cfg.height * cfg.aspect;

    this.ring = new THREE.Group();
    this.ring.visible = false;
    scene.add(this.ring);

    this.cards = [];
    this.spawnKiseki = [];
    this.exitKiseki = null;
    this.hero = null;
    this.heroGroup = null;
    this.dropKiseki = null;
    this.circlePlane = null;
    this.circleVideo = null;
    this.bounceTL = null;
    this.floatTL = null;
    this.holdSpinTL = null;
  }

  _cardMesh(tex) {
    return new THREE.Mesh(
      new THREE.PlaneGeometry(this.W, this.H),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }),
    );
  }

  _kisekiPlane(src, w, h, loop = true) {
    const v = makeVideo(src, loop);
    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    mesh.renderOrder = 2;
    mesh.userData.video = v;
    mesh.visible = false;
    return mesh;
  }

  prepareSpawn() {
    this.cards.forEach((c) => this.ring.remove(c));
    this.spawnKiseki.forEach((k) => this.ring.remove(k));
    this.cards = [];
    this.spawnKiseki = [];

    this.assets.cards.forEach((url, i) => {
      const tex = this.textures[url];
      const card = this._cardMesh(tex);
      const deg = i * 60;
      const rad = (deg * Math.PI) / 180;
      const r = this.cfg.hexRadius;
      const tx = Math.cos(rad) * r;
      const tz = Math.sin(rad) * r;

      card.position.set(tx * 2.8, -2.5, tz * 2.8);
      card.rotation.set(-0.2, rad + Math.PI * 1.5, 0);
      card.scale.setScalar(0.15);
      card.userData.target = { x: tx, y: 0, z: tz };
      card.userData.idx = i;
      this.ring.add(card);
      this.cards.push(card);

      const kSrc = i % 2 === 0 ? this.assets.kiseki2 : this.assets.kiseki2;
      const k = this._kisekiPlane(kSrc, this.W * 1.05, this.H * 1.1);
      k.position.copy(card.position);
      k.position.z -= 0.08;
      this.ring.add(k);
      this.spawnKiseki.push(k);
    });

    if (!this.exitKiseki) {
      this.exitKiseki = this._kisekiPlane(this.assets.kiseki2, 6, 10);
      this.exitKiseki.position.set(0, 0.15, -0.7);
      this.ring.add(this.exitKiseki);
    }
  }

  buildHero() {
    if (this.heroGroup) this.scene.remove(this.heroGroup);
    this.heroGroup = new THREE.Group();
    this.heroGroup.visible = false;
    this.scene.add(this.heroGroup);

    this.dropKiseki = this._kisekiPlane(this.assets.kiseki2, 2.0, 8.5, false);
    this.dropKiseki.position.z = -0.35;
    this.dropKiseki.renderOrder = 0;
    this.heroGroup.add(this.dropKiseki);

    this.hero = this._cardMesh(this.textures[this.assets.ssrCard]);
    this.hero.renderOrder = 3;
    this.heroGroup.add(this.hero);

    const cv = makeVideo(this.assets.ssrCircle, true);
    const cTex = new THREE.VideoTexture(cv);
    cTex.colorSpace = THREE.SRGBColorSpace;
    this.circleVideo = cv;
    this.circlePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(this.W * 1.4, this.W * 1.4),
      new THREE.MeshBasicMaterial({
        map: cTex, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    this.circlePlane.rotation.x = Math.PI / 2;
    this.circlePlane.position.y = -this.H * 0.48;
    this.circlePlane.renderOrder = 1;
    this.heroGroup.add(this.circlePlane);
  }

  startHexFloat() {
    this.floatTL?.kill();
    this.floatTL = gsap.timeline({ repeat: -1, yoyo: true });
    this.cards.forEach((card, i) => {
      this.floatTL.to(card.position, {
        y: (card.userData.target?.y ?? 0) + this.cfg.floatAmp,
        duration: this.cfg.floatPeriod / 2,
        ease: 'sine.inOut',
        delay: i * 0.06,
      }, 0);
    });
  }

  startHoldSpin() {
    this.holdSpinTL?.kill();
    this.holdSpinTL = gsap.to(this.ring.rotation, {
      y: `+=${Math.PI * this.cfg.holdSpin}`,
      duration: this.cfg.floatPeriod * 2.5,
      ease: 'none',
      repeat: -1,
    });
  }

  stopHexFloat() { this.floatTL?.kill(); this.floatTL = null; }
  stopHoldSpin() { this.holdSpinTL?.kill(); this.holdSpinTL = null; }

  startBounce(px, period, camera) {
    this.bounceTL?.kill();
    const amp = pxToWorld(px, camera);
    const y0 = this.heroGroup.position.y;
    this.bounceTL = gsap.timeline({ repeat: -1, yoyo: true });
    this.bounceTL.to(this.heroGroup.position, { y: y0 + amp, duration: period / 2, ease: 'sine.inOut' });
  }

  stopBounce() { this.bounceTL?.kill(); this.bounceTL = null; }

  playVideo(plane, opacity = 0.85) {
    if (!plane) return;
    const v = plane.userData.video;
    plane.visible = true;
    if (v) { v.currentTime = 0; v.play().catch(() => {}); }
    gsap.to(plane.material, { opacity, duration: 0.22, ease: 'power2.out' });
  }

  fadeVideo(plane, to, dur = 0.25) {
    if (!plane) return;
    gsap.to(plane.material, {
      opacity: to, duration: dur, ease: 'power2.inOut',
      onComplete: () => { if (to === 0) this.stopVideo(plane); },
    });
  }

  stopVideo(plane) {
    if (!plane) return;
    plane.userData.video?.pause();
    plane.visible = false;
    plane.material.opacity = 0;
  }

  update(dt) {
    if (this.circlePlane?.visible) this.circlePlane.rotation.z += dt * 0.38;
  }

  reset() {
    this.stopBounce();
    this.stopHexFloat();
    this.stopHoldSpin();
    this.ring.visible = false;
    this.spawnKiseki.forEach((k) => this.stopVideo(k));
    this.stopVideo(this.exitKiseki);
    if (this.heroGroup) {
      this.scene.remove(this.heroGroup);
      this.heroGroup = null;
      this.hero = null;
      this.dropKiseki = null;
      this.circlePlane = null;
    }
    this.cards.forEach((c) => this.ring.remove(c));
    this.cards = [];
    this.spawnKiseki = [];
  }
}
