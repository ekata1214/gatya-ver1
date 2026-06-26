import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

export class ParticleManager {
  constructor(scene) {
    this.scene = scene;
    this.spark = this._make(180, 0xffffff, 0.05);
    this.ash = this._make(50, 0x999999, 0.035, 0.3);
    this.stars = this._make(60, 0xffeecc, 0.07);
    this.mode = 'off';
  }

  _make(n, color, size, opacity = 0.85) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size, color, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    pts.visible = false;
    this.scene.add(pts);
    this._scatter(geo, 3, -2, 5);
    return { pts, geo };
  }

  _scatter(geo, sx, y0, y1) {
    const p = geo.attributes.position.array;
    for (let i = 0; i < p.length / 3; i++) {
      p[i * 3] = (Math.random() - 0.5) * sx;
      p[i * 3 + 1] = y0 + Math.random() * (y1 - y0);
      p[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    geo.attributes.position.needsUpdate = true;
  }

  setMode(mode) {
    this.mode = mode;
    this.spark.pts.visible = mode === 'fire' || mode === 'rare' || mode === 'ssr';
    this.ash.pts.visible = mode === 'fire';
    this.stars.pts.visible = mode === 'rare' || mode === 'ssr';
    if (mode === 'ssr') this.spark.pts.material.color.set(0xffffff);
  }

  burst(y = 0) {
    this._scatter(this.spark.geo, 2.4, y, y + 1.5);
    this.spark.pts.visible = true;
  }

  update(dt, anchor = null) {
    const step = (b, vy, minY) => {
      if (!b.pts.visible) return;
      const p = b.geo.attributes.position.array;
      for (let i = 0; i < p.length / 3; i++) {
        p[i * 3 + 1] += vy * dt;
        if (p[i * 3 + 1] < minY || p[i * 3 + 1] > 8) {
          p[i * 3] = (Math.random() - 0.5) * 3;
          p[i * 3 + 1] = anchor ? anchor.y + 2 + Math.random() : 3 + Math.random() * 2;
          p[i * 3 + 2] = anchor?.z ?? 0.5;
        }
      }
      b.geo.attributes.position.needsUpdate = true;
    };
    step(this.ash, 0.4, -4);
    step(this.spark, anchor ? -1.2 : 0.5, -4);
    step(this.stars, -0.8, -4);
    if (this.mode === 'ssr') {
      this.spark.pts.material.color.setHSL((performance.now() * 0.00025) % 1, 0.75, 0.6);
    }
  }

  reset() {
    this.setMode('off');
  }
}
