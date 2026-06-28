import * as THREE from 'three';
import { makeProceduralInkLayerCanvas } from './ink-procedural.mjs';

const VIEW_W = 1080;
const VIEW_H = 1920;
const VIEW_ASPECT = VIEW_W / VIEW_H;

const SEQUENCE = ['5', '4', '3', '2', '1', 'LAST'];
const LAYER_DEFS = [
  { key: 'bg', z: -0.58, renderOrder: 0, opacityMul: 0.5, parallax: 0.82 },
  { key: 'mid', z: -0.4, renderOrder: 1, opacityMul: 1, parallax: 1 },
  { key: 'fg', z: -0.18, renderOrder: 2, opacityMul: 0.82, parallax: 1.14 },
];

/** countdown-three-overlay と同じ 1 秒ステップ */
const T = { appear: 0.42, hold: 0.4, exit: 0.2 };
const STEP = 1;

const MOTION = {
  5: { ox: -0.11, oy: 0.14, rz: 0.035, scaleIn: 0.9 },
  4: { ox: 0.12, oy: -0.1, rz: -0.028, scaleIn: 0.91 },
  3: { ox: 0, oy: -0.12, rz: 0.018, scaleIn: 0.93 },
  2: { ox: 0.1, oy: 0.12, rz: -0.022, scaleIn: 0.92 },
  1: { ox: -0.04, oy: -0.14, rz: 0.015, scaleIn: 0.94 },
  LAST: { ox: 0, oy: 0, rz: 0, scaleIn: 0.88 },
};

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`load failed: ${url}`));
    img.src = url;
  });
}

async function loadLayerSource(digit, layerKey, assetRoot) {
  const url = `${assetRoot}${digit}-${layerKey}.png`;
  try {
    const img = await loadImage(url);
    return { img, procedural: false };
  } catch {
    const canvas = makeProceduralInkLayerCanvas(digit, layerKey);
    return { img: canvas, procedural: true };
  }
}

export async function initInkOverlay({ canvas, stageEl, assetRoot = './assets/ink/' }) {
  CustomEase.create('inkHeavy', 'M0,0 C0.16,1 0.3,1 1,1');
  const HEAVY = 'inkHeavy';

  let renderer;
  let scene;
  let camera;
  let masterTL = null;
  let activeDigit = null;
  let frozen = false;
  const steps = {};

  function stageSize() {
    return {
      w: stageEl.clientWidth || VIEW_W,
      h: stageEl.clientHeight || VIEW_H,
    };
  }

  function makeInkMesh(tex, layerDef) {
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.position.z = layerDef.z;
    mesh.renderOrder = layerDef.renderOrder;
    mesh.userData.opacityMul = layerDef.opacityMul;
    mesh.userData.parallax = layerDef.parallax;
    mesh.userData.baseOffset = { x: 0, y: 0 };
    return mesh;
  }

  function fitInkPlane(mesh) {
    const fov = (camera.fov * Math.PI) / 180;
    const dist = camera.position.z - mesh.position.z;
    const vh = 2 * dist * Math.tan(fov / 2);
    const vw = vh * camera.aspect;
    const cover = Math.max(vw / VIEW_W, vh / VIEW_H) * 1.14;
    mesh.userData.baseScale = { x: VIEW_W * cover, y: VIEW_H * cover };
    const mul = mesh.userData.scaleMul ?? 1;
    mesh.scale.set(mesh.userData.baseScale.x * mul, mesh.userData.baseScale.y * mul, 1);
  }

  function setInkScale(mesh, mul) {
    mesh.userData.scaleMul = mul;
    const b = mesh.userData.baseScale;
    if (b) mesh.scale.set(b.x * mul, b.y * mul, 1);
  }

  function applyInkLayer(mesh, proxy) {
    mesh.material.opacity = proxy.opacity * mesh.userData.opacityMul;
    const par = mesh.userData.parallax;
    const mot = MOTION[activeDigit] ?? MOTION['3'];
    mesh.position.x = mesh.userData.baseOffset.x + proxy.offsetX * par * mot.ox * 4;
    mesh.position.y = mesh.userData.baseOffset.y + proxy.offsetY * par * mot.oy * 4;
    mesh.rotation.z = proxy.rotZ * par * mot.rz * 2;
    setInkScale(mesh, proxy.scale);
  }

  function resetStep(key) {
    const step = steps[key];
    if (!step) return;
    step.inks.forEach((ink) => {
      ink.visible = false;
      ink.material.opacity = 0;
      ink.position.x = 0;
      ink.position.y = 0;
      ink.rotation.z = 0;
      ink.userData.scaleMul = 1;
      setInkScale(ink, 1);
    });
    step.proxy = { opacity: 0, scale: 1, offsetX: 0, offsetY: 0, rotZ: 0 };
  }

  function hideAll() {
    SEQUENCE.forEach(resetStep);
    activeDigit = null;
  }

  function killStepTweens(key) {
    const step = steps[key];
    if (!step) return;
    gsap.killTweensOf(step.proxy);
    gsap.killTweensOf(step.inks);
  }

  function playForDigit(char) {
    if (frozen && char !== 'LAST') return;
    if (activeDigit && activeDigit !== char) {
      killStepTweens(activeDigit);
      resetStep(activeDigit);
    }

    const step = steps[char];
    if (!step) return;

    activeDigit = char;
    const mot = MOTION[char] ?? MOTION['3'];
    const proxy = step.proxy;
    proxy.opacity = 0;
    proxy.scale = mot.scaleIn;
    proxy.offsetX = mot.ox * 2;
    proxy.offsetY = mot.oy * 2;
    proxy.rotZ = mot.rz * 3;

    masterTL?.kill();
    const tl = gsap.timeline();
    masterTL = tl;

    const apply = () => {
      step.inks.forEach((ink) => applyInkLayer(ink, proxy));
    };

    tl.add(() => {
      step.inks.forEach((ink) => { ink.visible = true; });
      apply();
      canvas.style.opacity = '1';
    });

    tl.to(proxy, {
      opacity: 1,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      rotZ: 0,
      duration: T.appear * 0.85,
      ease: HEAVY,
      onUpdate: apply,
    });

    if (char !== 'LAST') {
      const exitStart = T.appear + T.hold;
      tl.to(proxy, {
        opacity: 0,
        scale: 0.98,
        duration: T.exit,
        ease: HEAVY,
        onUpdate: apply,
      }, exitStart);

      tl.add(() => {
        if (activeDigit === char) resetStep(char);
      }, STEP);
    }
  }

  function freeze() {
    frozen = true;
    if (activeDigit) killStepTweens(activeDigit);
  }

  function hide() {
    frozen = false;
    masterTL?.kill();
    hideAll();
    canvas.style.opacity = '0';
  }

  function reset() {
    frozen = false;
    masterTL?.kill();
    hideAll();
    canvas.style.opacity = '0';
  }

  function onResize() {
    const { w, h } = stageSize();
    camera.aspect = VIEW_ASPECT;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    SEQUENCE.forEach((key) => {
      steps[key].inks.forEach((ink) => fitInkPlane(ink));
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const { w, h } = stageSize();
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(52, VIEW_ASPECT, 0.1, 50);
  camera.position.set(0, 0, 6.2);
  camera.lookAt(0, 0, 0);

  window.addEventListener('resize', onResize);
  animate();

  await Promise.all(SEQUENCE.map(async (digit) => {
    const inks = [];
    for (const def of LAYER_DEFS) {
      const { img } = await loadLayerSource(digit, def.key, assetRoot);
      const tex = img instanceof HTMLCanvasElement
        ? new THREE.CanvasTexture(img)
        : new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      if (!(img instanceof HTMLCanvasElement)) tex.needsUpdate = true;

      const mesh = makeInkMesh(tex, def);
      fitInkPlane(mesh);
      mesh.visible = false;
      scene.add(mesh);
      inks.push(mesh);
    }
    steps[digit] = {
      inks,
      proxy: { opacity: 0, scale: 1, offsetX: 0, offsetY: 0, rotZ: 0 },
    };
    resetStep(digit);
  }));

  canvas.style.opacity = '0';

  return {
    playForDigit,
    hideAll,
    freeze,
    hide,
    reset,
  };
}
