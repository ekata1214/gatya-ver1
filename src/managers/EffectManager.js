import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { makeVideo, fitBgPlane, fitContainPlane } from '../utils/helpers.js';

export class EffectManager {
  constructor(scene, assets) {
    this.scene = scene;
    this.assets = assets;
    this._camera = null;
    this._buildBackgrounds();
    this.inkPlane = this._makeCenterVideo(assets.ink1, 'ink1');
    this.countPlane = this._makeCenterVideo(assets.count, 'count');
  }

  _bgPlane(video, z, additive = false) {
    const v = makeVideo(video, true);
    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 1,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
      }),
    );
    mesh.position.z = z;
    mesh.renderOrder = additive ? -5 : -10;
    mesh.material.depthTest = false;
    mesh.userData.video = v;
    v.addEventListener('loadeddata', () => {
      if (this._camera) fitBgPlane(mesh, this._camera);
    });
    this.scene.add(mesh);
    return mesh;
  }

  _makeCenterVideo(src, name) {
    const v = makeVideo(src, false);
    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    mesh.position.set(0, 0, 0.55);
    mesh.renderOrder = 9;
    mesh.visible = false;
    mesh.userData.video = v;
    mesh.userData.name = name;
    v.addEventListener('loadeddata', () => {
      if (this._camera) fitContainPlane(mesh, this._camera);
    });
    this.scene.add(mesh);
    return mesh;
  }

  _buildBackgrounds() {
    this.firePlane = this._bgPlane(this.assets.fireVideo, -20);
    this.ssrPlane = this._bgPlane(this.assets.ssrVideo, -8, true);
    this.ssrPlane.material.opacity = 0;
  }

  resize(camera) {
    this._camera = camera;
    fitBgPlane(this.firePlane, camera);
    fitBgPlane(this.ssrPlane, camera);
    if (this.inkPlane?.visible) fitContainPlane(this.inkPlane, camera);
    if (this.countPlane?.visible) fitContainPlane(this.countPlane, camera);
  }

  playFire() {
    this.firePlane.material.opacity = 1;
    this.firePlane.userData.video.play().catch(() => {});
  }

  hideFire() {
    return gsap.to(this.firePlane.material, { opacity: 0, duration: 0.35, ease: 'power2.inOut' });
  }

  /** SSR降下〜テロップ中の白い光オーバーレイ */
  showSSRReveal(opacity = 0.55) {
    const v = this.ssrPlane.userData.video;
    if (v.paused) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
    return gsap.to(this.ssrPlane.material, { opacity, duration: 0.45, ease: 'power2.out' });
  }

  hideSSRReveal() {
    return gsap.to(this.ssrPlane.material, { opacity: 0, duration: 0.4, ease: 'power2.in' });
  }

  showSSRFinale() {
    const v = this.ssrPlane.userData.video;
    v.currentTime = 0;
    v.play().catch(() => {});
    return gsap.to(this.ssrPlane.material, { opacity: 1, duration: 0.6, ease: 'power2.out' });
  }

  _hideCenterVideo(plane) {
    if (!plane) return;
    plane.userData.video?.pause();
    plane.visible = false;
    plane.material.opacity = 0;
  }

  _playCenterVideoOnce(plane) {
    return new Promise((resolve) => {
      const v = plane.userData.video;
      if (!v) {
        console.warn(`[EffectManager] video missing: ${plane.userData.name}`);
        resolve();
        return;
      }
      const finish = () => {
        v.removeEventListener('ended', onEnd);
        v.removeEventListener('error', onErr);
        this._hideCenterVideo(plane);
        resolve();
      };
      const onEnd = () => finish();
      const onErr = () => {
        console.warn(`[EffectManager] playback failed: ${plane.userData.name}`);
        finish();
      };
      v.loop = false;
      v.currentTime = 0;
      plane.visible = true;
      plane.material.opacity = 1;
      if (this._camera) fitContainPlane(plane, this._camera);
      v.addEventListener('ended', onEnd);
      v.addEventListener('error', onErr);
      v.play().catch(onErr);
    });
  }

  async playPostTelopSequence(sm, States) {
    this._hideCenterVideo(this.inkPlane);
    this._hideCenterVideo(this.countPlane);
    sm?.transition(States.INK_PLAY);
    await this._playCenterVideoOnce(this.inkPlane);
    sm?.transition(States.COUNT_VIDEO);
    await this._playCenterVideoOnce(this.countPlane);
  }

  hidePostTelopVideos() {
    this._hideCenterVideo(this.inkPlane);
    this._hideCenterVideo(this.countPlane);
  }

  reset() {
    this.hidePostTelopVideos();
    this.firePlane.material.opacity = 1;
    this.ssrPlane.material.opacity = 0;
    this.firePlane.userData.video.pause();
    this.ssrPlane.userData.video.pause();
    this.firePlane.userData.video.currentTime = 0;
    this.ssrPlane.userData.video.currentTime = 0;
    this.inkPlane.userData.video.currentTime = 0;
    this.countPlane.userData.video.currentTime = 0;
  }
}
