import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { make3DLabel } from '../utils/helpers.js';

export class CountdownManager {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);
    this.label = null;
  }

  show(cfg) {
    this.hide();
    this.group.rotation.set(0, 0, 0);
    this.label = make3DLabel(THREE, cfg.label, cfg.wide);
    this.label.position.set(0, 0.15, 1.1);
    this.label.scale.setScalar(0.25);
    this.group.add(this.label);
    this.group.visible = true;
    return this.label;
  }

  hide() {
    this.group.visible = false;
    while (this.group.children.length) this.group.remove(this.group.children[0]);
    this.label = null;
  }

  reset() {
    this.hide();
    this.group.rotation.set(0, 0, 0);
  }
}
