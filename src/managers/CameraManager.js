import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

export class CameraManager {
  constructor(cfg, dom) {
    this.cfg = cfg;
    this.camera = new THREE.PerspectiveCamera(cfg.fov, dom.clientWidth / dom.clientHeight, 0.1, 80);
    this.camera.position.fromArray(cfg.position);
    this.camera.lookAt(...cfg.lookAt);
    this.base = this.camera.position.clone();
    this.shakeTL = null;
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  reset() {
    this.shakeTL?.kill();
    this.camera.position.copy(this.base);
    this.camera.fov = this.cfg.fov;
    this.camera.updateProjectionMatrix();
  }

  shake(intensity = 0.07, duration = 0.3) {
    this.shakeTL?.kill();
    this.shakeTL = gsap.timeline();
    for (let i = 0; i < 5; i++) {
      this.shakeTL.to(this.camera.position, {
        x: this.base.x + (Math.random() - 0.5) * intensity,
        y: this.base.y + (Math.random() - 0.5) * intensity,
        duration: duration / 5,
        ease: 'none',
      });
    }
    this.shakeTL.to(this.camera.position, { x: this.base.x, y: this.base.y, duration: 0.06 });
  }

  zoomOut(duration, delta = -3.5) {
    return gsap.to(this.camera, {
      fov: this.cfg.fov + delta,
      duration,
      ease: 'power2.in',
      onUpdate: () => this.camera.updateProjectionMatrix(),
    });
  }
}
