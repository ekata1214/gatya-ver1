import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

export function makeVideo(src, loop = false) {
  const v = document.createElement('video');
  v.src = src;
  v.muted = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.loop = loop;
  v.setAttribute('playsinline', 'true');
  v.setAttribute('webkit-playsinline', 'true');
  v.addEventListener('error', () => console.warn(`[video] load failed: ${src}`));
  return v;
}

export function loadTexture(loader, url) {
  return new Promise((resolve) => {
    loader.load(
      url,
      (t) => { t.colorSpace = THREE.SRGBColorSpace; resolve(t); },
      undefined,
      () => { console.warn(`[texture] load failed: ${url}`); resolve(null); },
    );
  });
}

export function pxToWorld(px, camera, h = innerHeight) {
  const fov = (camera.fov * Math.PI) / 180;
  const worldH = 2 * camera.position.z * Math.tan(fov / 2);
  return (px / h) * worldH;
}

export function make3DLabel(THREE_NS, text, wide = false) {
  const g = new THREE_NS.Group();
  const w = wide ? 4.4 : 2.5;
  const h = wide ? 1.35 : 1.55;
  const layers = 12;
  for (let i = 0; i < layers; i++) {
    const c = document.createElement('canvas');
    c.width = wide ? 800 : 512;
    c.height = 256;
    const ctx = c.getContext('2d');
    const fs = wide ? 118 : 178;
    ctx.font = `900 ${fs}px "Black Han Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const front = i === layers - 1;
    if (front) {
      const grad = ctx.createLinearGradient(0, 0, c.width, c.height);
      grad.addColorStop(0, '#ff2200');
      grad.addColorStop(0.5, '#cc0000');
      grad.addColorStop(1, '#330000');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#110000';
      ctx.lineWidth = 16;
      ctx.strokeText(text, c.width / 2, c.height / 2);
      ctx.fillText(text, c.width / 2, c.height / 2);
      ctx.shadowColor = 'rgba(255,60,0,0.8)';
      ctx.shadowBlur = 28;
      ctx.fillText(text, c.width / 2, c.height / 2);
    } else {
      ctx.fillStyle = `rgb(${28 + i * 6},${8 + i * 2},0)`;
      ctx.fillText(text, c.width / 2, c.height / 2);
    }
    const mesh = new THREE_NS.Mesh(
      new THREE_NS.PlaneGeometry(w, h),
      new THREE_NS.MeshBasicMaterial({
        map: new THREE_NS.CanvasTexture(c),
        transparent: true,
        side: THREE_NS.DoubleSide,
        blending: front ? THREE_NS.AdditiveBlending : THREE_NS.NormalBlending,
      }),
    );
    mesh.position.z = -i * 0.016;
    g.add(mesh);
  }
  return g;
}

export function fitContainPlane(plane, camera) {
  const fov = (camera.fov * Math.PI) / 180;
  const dist = camera.position.z - plane.position.z;
  const vh = 2 * dist * Math.tan(fov / 2);
  const vw = vh * camera.aspect;
  const tex = plane.material.map;
  if (!tex?.image) {
    plane.scale.set(vw * 0.92, vh * 0.92, 1);
    return;
  }
  const iw = tex.image.videoWidth || tex.image.width || 1;
  const ih = tex.image.videoHeight || tex.image.height || 1;
  const contain = Math.min(vw / iw, vh / ih) * 0.92;
  plane.scale.set(iw * contain, ih * contain, 1);
}

export function fitBgPlane(plane, camera) {
  const fov = (camera.fov * Math.PI) / 180;
  const dist = camera.position.z - plane.position.z;
  const vh = 2 * dist * Math.tan(fov / 2);
  const vw = vh * camera.aspect;
  const tex = plane.material.map;
  if (!tex?.image) {
    plane.scale.set(vw, vh, 1);
    return;
  }
  const iw = tex.image.videoWidth || tex.image.width || 1;
  const ih = tex.image.videoHeight || tex.image.height || 1;
  const cover = Math.max(vw / iw, vh / ih);
  plane.scale.set(iw * cover, ih * cover, 1);
}
