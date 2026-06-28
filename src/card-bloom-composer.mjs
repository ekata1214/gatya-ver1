import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { CopyShader } from 'three/addons/shaders/CopyShader.js';

export const CARD_BLOOM_DEFAULTS = {
  strength: 0.65,
  radius: 0.5,
  threshold: 0.97,
};

export const SSR_EDGE_BLOOM_DEFAULTS = {
  strength: 0.88,
  radius: 0.52,
  threshold: 0.94,
};

const AlphaMixShader = {
  uniforms: {
    baseTexture: { value: null },
    bloomTexture: { value: null },
  },
  vertexShader: CopyShader.vertexShader,
  fragmentShader: `
    uniform sampler2D baseTexture;
    uniform sampler2D bloomTexture;
    varying vec2 vUv;

    void main() {
      vec4 base = texture2D(baseTexture, vUv);
      vec4 bloom = texture2D(bloomTexture, vUv);
      float baseLuma = dot(base.rgb, vec3(0.299, 0.587, 0.114));
      // Attenuate bloom on capped interior face pixels (prevents face wash from edge scatter)
      float bloomWeight = mix(
        1.0,
        0.15,
        smoothstep(0.38, 0.54, baseLuma) * smoothstep(0.5, 0.92, base.a)
      );
      gl_FragColor = vec4(base.rgb + bloom.rgb * bloomWeight, base.a);
    }
  `,
};

export function createTransparentBloomComposer(renderer, scene, camera, size, options = {}) {
  const {
    strength = CARD_BLOOM_DEFAULTS.strength,
    radius = CARD_BLOOM_DEFAULTS.radius,
    threshold = CARD_BLOOM_DEFAULTS.threshold,
  } = options;

  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;

  const bloomRenderPass = new RenderPass(scene, camera);
  bloomRenderPass.clearAlpha = 0;
  bloomComposer.addPass(bloomRenderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(size.w, size.h),
    strength,
    radius,
    threshold,
  );
  bloomComposer.addPass(bloomPass);

  const finalComposer = new EffectComposer(renderer);
  const finalRenderPass = new RenderPass(scene, camera);
  finalRenderPass.clearAlpha = 0;
  finalComposer.addPass(finalRenderPass);

  const mixPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture },
      },
      vertexShader: AlphaMixShader.vertexShader,
      fragmentShader: AlphaMixShader.fragmentShader,
    }),
    'baseTexture',
  );
  mixPass.needsSwap = true;
  finalComposer.addPass(mixPass);

  bloomComposer.setSize(size.w, size.h);
  finalComposer.setSize(size.w, size.h);

  return {
    composer: finalComposer,
    bloomPass,
    resize(w, h) {
      bloomComposer.setSize(w, h);
      finalComposer.setSize(w, h);
      bloomPass.resolution.set(w, h);
    },
    render() {
      bloomComposer.render();
      finalComposer.render();
    },
  };
}

const SelectiveAlphaMixShader = {
  uniforms: {
    baseTexture: { value: null },
    bloomTexture: { value: null },
  },
  vertexShader: CopyShader.vertexShader,
  fragmentShader: `
    uniform sampler2D baseTexture;
    uniform sampler2D bloomTexture;
    varying vec2 vUv;

    void main() {
      vec4 base = texture2D(baseTexture, vUv);
      vec4 bloom = texture2D(bloomTexture, vUv);
      float bloomLuma = dot(bloom.rgb, vec3(0.299, 0.587, 0.114));
      float outAlpha = max(base.a, bloomLuma);
      float bloomWeight = 1.0 - smoothstep(0.5, 0.95, base.a);
      float fringeFade = smoothstep(0.0, 0.04, bloomLuma);
      outAlpha = max(outAlpha, bloomLuma * fringeFade);
      gl_FragColor = vec4(base.rgb + bloom.rgb * bloomWeight, outAlpha);
    }
  `,
};

export function createSelectiveBloomComposer(renderer, baseScene, bloomScene, camera, size, options = {}) {
  const {
    strength = SSR_EDGE_BLOOM_DEFAULTS.strength,
    radius = SSR_EDGE_BLOOM_DEFAULTS.radius,
    threshold = SSR_EDGE_BLOOM_DEFAULTS.threshold,
  } = options;

  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;

  const bloomRenderPass = new RenderPass(bloomScene, camera);
  bloomRenderPass.clearAlpha = 0;
  bloomComposer.addPass(bloomRenderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(size.w, size.h),
    strength,
    radius,
    threshold,
  );
  bloomComposer.addPass(bloomPass);

  const finalComposer = new EffectComposer(renderer);
  const finalRenderPass = new RenderPass(baseScene, camera);
  finalRenderPass.clearAlpha = 0;
  finalComposer.addPass(finalRenderPass);

  const mixPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture },
      },
      vertexShader: SelectiveAlphaMixShader.vertexShader,
      fragmentShader: SelectiveAlphaMixShader.fragmentShader,
    }),
    'baseTexture',
  );
  mixPass.needsSwap = true;
  finalComposer.addPass(mixPass);

  bloomComposer.setSize(size.w, size.h);
  finalComposer.setSize(size.w, size.h);

  return {
    composer: finalComposer,
    bloomPass,
    resize(w, h) {
      bloomComposer.setSize(w, h);
      finalComposer.setSize(w, h);
      bloomPass.resolution.set(w, h);
    },
    render() {
      bloomComposer.render();
      finalComposer.render();
    },
  };
}
