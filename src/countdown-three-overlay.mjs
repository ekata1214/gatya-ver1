import * as THREE from 'three';
import { Font, FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export function initCountdownOverlay(options) {
      CustomEase.create('heavy', 'M0,0 C0.16,1 0.3,1 1,1');
      const HEAVY = 'heavy';
      const HOLD_TILT = 'sine.inOut';
      let lastShownFired = false;

      const VIEW_W = 1080;
      const VIEW_H = 1920;
      const VIEW_ASPECT = VIEW_W / VIEW_H;

      const TOTAL = 6;
      const STEP = TOTAL / 6;
      const D = THREE.MathUtils.degToRad;

      const T = {
        appear: 0.42,
        hold: 0.4,
        exit: 0.2,
      };

      const DIGIT_OPTS = {
        size: 1.55,
        height: 1.15,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.17,
        bevelSize: 0.1,
        bevelSegments: 6,
      };
      const LAST_OPTS = {
        size: 0.82,
        height: 0.82,
        curveSegments: 10,
        bevelEnabled: true,
        bevelThickness: 0.14,
        bevelSize: 0.085,
        bevelSegments: 5,
      };
      const DIGIT_ANIM = {
        '5': {
          entry: { x: D(-52), y: D(10), z: D(4) },
          rest:  { x: D(5),  y: D(-10), z: D(1) },
          show:  { x: D(7),  y: D(-7),  z: D(1) },
        },
        '4': {
          entry: { x: D(8),  y: D(48), z: D(-5) },
          rest:  { x: D(-3), y: D(9),  z: D(-1) },
          show:  { x: D(-1), y: D(12), z: D(-1) },
        },
        '3': {
          entry: { x: D(14), y: D(-38), z: D(28) },
          rest:  { x: D(4),  y: D(-8),  z: D(2) },
          show:  { x: D(6),  y: D(-5),  z: D(2) },
        },
        '2': {
          entry: { x: D(-40), y: D(34), z: D(6) },
          rest:  { x: D(-6), y: D(8),   z: D(-1) },
          show:  { x: D(-4), y: D(11),  z: D(-1) },
        },
        '1': {
          entry: { x: D(-6), y: D(-50), z: D(4) },
          rest:  { x: D(4),  y: D(-11), z: D(1) },
          show:  { x: D(6),  y: D(-8),  z: D(1) },
        },
      };
      const LAST_LETTER_ANIM = [
        {
          start: { x: -2.9, y: 1.7, z: -0.4 },
          home:  { x: -1.17, y: 0, z: 0 },
          entry: { x: D(-50), y: D(38), z: D(-14) },
        },
        {
          start: { x: 2.9, y: 1.5, z: -0.3 },
          home:  { x: -0.39, y: 0, z: 0 },
          entry: { x: D(22), y: D(-44), z: D(14) },
        },
        {
          start: { x: -2.6, y: -1.7, z: -0.4 },
          home:  { x: 0.39, y: 0, z: 0 },
          entry: { x: D(-18), y: D(-42), z: D(22) },
        },
        {
          start: { x: 2.7, y: -1.6, z: -0.3 },
          home:  { x: 1.17, y: 0, z: 0 },
          entry: { x: D(38), y: D(36), z: D(-20) },
        },
      ];
      const LAST_GROUP_REST = { x: D(5), y: D(-9), z: D(1) };
      const LAST_GROUP_SHOW = { x: D(7), y: D(-2), z: D(1) };

      // LAST文字ごとの炎フィット（数字には使わない）
      const FIRE_CHAR_TUNING = {
        L: { scale: 0.84, focalX: 0.5, focalY: 0.55 },
        A: { scale: 0.86, focalX: 0.5, focalY: 0.54 },
        S: { scale: 0.85, focalX: 0.5, focalY: 0.53 },
        T: { scale: 0.84, focalX: 0.5, focalY: 0.56 },
      };

      // 5〜1 共通：中心から uniform zoom（repeat は 1,1 固定）
      const NUMBER_FIRE_TUNING = {
        zoom: 0.68,
      };

      const FONT_CANDIDATES = [
        { type: 'ttf', url: './assets/fonts/Anton-Regular.ttf', name: 'Anton' },
        { type: 'ttf', url: 'https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm0K0.ttf', name: 'Anton CDN' },
        { type: 'ttf', url: './assets/fonts/BebasNeue-Regular.ttf', name: 'Bebas Neue' },
        { type: 'json', url: 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/helvetiker_bold.typeface.json', name: 'Helvetiker Bold' },
      ];

      const canvas = options.canvas;
      const stageEl = options.stageEl;
      const replayBtn = options.replayBtn;
      const fireVideo = options.fireVideoEl;

      let renderer, scene, camera;
      let fireTex;
      let fireVideoSize = { w: 1080, h: 1920 };
      let numberTextureFrame = { height: 1.5, width: 0.84, zoom: 0.68 };
      let fireBgPlane;
      let fireBgTex;
      let frontMatProto, frameMatProto;
      let masterTL = null;
      const items = {};

      function stageSize() {
        const w = stageEl.clientWidth || VIEW_W;
        const h = stageEl.clientHeight || VIEW_H;
        return { w, h };
      }

    

      async function loadFont() {
        const ttfLoader = new TTFLoader();
        const jsonLoader = new FontLoader();
        for (const candidate of FONT_CANDIDATES) {
          try {
            const font = await Promise.race([
              (async () => {
                if (candidate.type === 'ttf') {
                  const json = await ttfLoader.loadAsync(candidate.url);
                  return new Font(json);
                }
                return jsonLoader.loadAsync(candidate.url);
              })(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
            ]);
            console.info(`[countdown] font: ${candidate.name}`);
            return font;
          } catch (err) {
            console.warn(`[countdown] font load failed (${candidate.name})`, err);
          }
        }
        throw new Error('No font available');
      }

      async function setupFireVideo() {
        fireVideo.muted = true;
        fireVideo.playsInline = true;
        fireVideo.loop = true;
        await new Promise((resolve) => {
          if (fireVideo.readyState >= 1 && fireVideo.videoWidth) {
            resolve();
            return;
          }
          const done = () => resolve();
          fireVideo.addEventListener('loadedmetadata', done, { once: true });
          fireVideo.addEventListener('loadeddata', done, { once: true });
          // IMPORTANT:
          // This same <video> element is rendered as the page background in ink-sumi.html.
          // Calling `load()` here can briefly reset/blank the video, causing a visible flicker.
          setTimeout(done, 1200);
        });
        fireVideoSize = {
          w: fireVideo.videoWidth || 1080,
          h: fireVideo.videoHeight || 1920,
        };
        try {
          await fireVideo.play();
        } catch {
          await new Promise((resolve) => {
            const resume = () => {
              fireVideo.play().finally(resolve);
              window.removeEventListener('pointerdown', resume);
            };
            window.addEventListener('pointerdown', resume, { once: true });
            setTimeout(resolve, 300);
          });
        }
        fireTex = new THREE.VideoTexture(fireVideo);
        fireTex.colorSpace = THREE.SRGBColorSpace;
        fireTex.minFilter = THREE.LinearFilter;
        fireTex.magFilter = THREE.LinearFilter;
        fireTex.wrapS = THREE.ClampToEdgeWrapping;
        fireTex.wrapT = THREE.ClampToEdgeWrapping;
      }

      function createFireBackground() {
        fireBgTex = fireTex.clone();
        fireBgTex.repeat.set(1, 1);
        fireBgTex.offset.set(0, 0);

        fireBgPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 1),
          new THREE.MeshBasicMaterial({
            map: fireBgTex,
            depthWrite: false,
          }),
        );
        fireBgPlane.position.z = -14;
        fireBgPlane.renderOrder = -20;
        scene.add(fireBgPlane);
        if (fireBgPlane) fitFireBackground();
      }

      function fitFireBackground() {
        if (!fireBgPlane || !camera) return;
        const fov = (camera.fov * Math.PI) / 180;
        const dist = camera.position.z - fireBgPlane.position.z;
        const vh = 2 * dist * Math.tan(fov / 2);
        const vw = vh * camera.aspect;
        const { w: iw, h: ih } = fireVideoSize;
        const cover = Math.max(vw / iw, vh / ih);
        fireBgPlane.scale.set(iw * cover, ih * cover, 1);
      }

      function applyFireTextureFit(tex, charW, charH, tuning = {}) {
        // LAST専用：文字bboxに対するcontain（repeatX/Y別々）
        const { w: vw, h: vh } = fireVideoSize;
        const charAspect = charW / charH;
        const videoAspect = vw / vh;
        const fitScale = tuning.scale ?? 0.88;
        const focalX = tuning.focalX ?? 0.5;
        const focalY = tuning.focalY ?? 0.55;

        let repeatX;
        let repeatY;

        if (videoAspect > charAspect) {
          repeatY = fitScale;
          repeatX = fitScale * (charAspect / videoAspect);
        } else {
          repeatX = fitScale;
          repeatY = fitScale * (videoAspect / charAspect);
        }

        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(repeatX, repeatY);
        tex.offset.set((1 - repeatX) * focalX, (1 - repeatY) * focalY);
        tex.needsUpdate = true;
      }

      function applyDigitFireTexture(tex) {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(1, 1);
        tex.offset.set(0, 0);
        tex.needsUpdate = true;
      }

      function cloneFireTexture(charW, charH, tuning = {}) {
        const tex = fireTex.clone();
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        applyFireTextureFit(tex, charW, charH, tuning);
        return tex;
      }

      function cloneDigitFireTexture() {
        const tex = fireTex.clone();
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        applyDigitFireTexture(tex);
        return tex;
      }

      function measureDigitUvExtents(font, frameWidth, frameHeight) {
        const halfW = frameWidth * 0.5;
        const halfH = frameHeight * 0.5;
        let maxNorm = 0;

        ['5', '4', '3', '2', '1'].forEach((ch) => {
          const geo = new TextGeometry(ch, { font, ...DIGIT_OPTS });
          geo.computeBoundingBox();
          geo.center();
          const pos = geo.attributes.position;
          const norm = geo.attributes.normal;
          for (let i = 0; i < pos.count; i++) {
            if (norm.getZ(i) < 0.45) continue;
            maxNorm = Math.max(
              maxNorm,
              Math.abs(pos.getX(i) / halfW),
              Math.abs(pos.getY(i) / halfH),
            );
          }
        });

        return maxNorm;
      }

      function computeNumberTextureFrame(font) {
        const geo = new TextGeometry('5', { font, ...DIGIT_OPTS });
        const { h } = getGlyphSize(geo);
        const videoAspect = fireVideoSize.w / fireVideoSize.h;
        const frameHeight = h;
        const frameWidth = frameHeight * videoAspect;
        const maxNorm = measureDigitUvExtents(font, frameWidth, frameHeight);
        const targetZoom = NUMBER_FIRE_TUNING.zoom;
        const zoom = maxNorm > 0 ? Math.min(targetZoom, 0.5 / maxNorm) : targetZoom;

        return { height: frameHeight, width: frameWidth, zoom };
      }

      function remapDigitFrontUVs(geo, frame) {
        const pos = geo.attributes.position;
        const uv = geo.attributes.uv;
        const norm = geo.attributes.normal;
        const halfW = frame.width * 0.5;
        const halfH = frame.height * 0.5;
        const zoom = frame.zoom;

        for (let i = 0; i < pos.count; i++) {
          if (norm.getZ(i) < 0.45) continue;
          const x = pos.getX(i);
          const y = pos.getY(i);
          uv.setXY(
            i,
            0.5 + (x / halfW) * zoom,
            0.5 + (y / halfH) * zoom,
          );
        }
        uv.needsUpdate = true;
      }

      function getGlyphSize(geo) {
        geo.computeBoundingBox();
        const box = geo.boundingBox;
        return {
          w: box.max.x - box.min.x,
          h: box.max.y - box.min.y,
        };
      }

      function createMaterials() {
        frontMatProto = new THREE.MeshStandardMaterial({
          map: fireTex,
          emissive: new THREE.Color(0xff5500),
          emissiveMap: fireTex,
          emissiveIntensity: 0.42,
          metalness: 0.02,
          roughness: 0.42,
          transparent: true,
          opacity: 1,
        });

        // 側面・bevel・枠を一体の黒クロームに統一
        frameMatProto = new THREE.MeshPhysicalMaterial({
          color: 0x020202,
          metalness: 0.99,
          roughness: 0.03,
          clearcoat: 1,
          clearcoatRoughness: 0.04,
          reflectivity: 1,
          transparent: true,
          opacity: 1,
        });
      }

      function makeMeshMaterials(charW, charH, tuning = {}) {
        const tex = cloneFireTexture(charW, charH, tuning);
        const front = frontMatProto.clone();
        front.map = tex;
        front.emissiveMap = tex;
        return [front, frameMatProto.clone()];
      }

      function makeDigitMeshMaterials() {
        const tex = cloneDigitFireTexture();
        const front = frontMatProto.clone();
        front.map = tex;
        front.emissiveMap = tex;
        return [front, frameMatProto.clone()];
      }

      function splitBevelGroups(geo) {
        const groups = [...geo.groups];
        geo.clearGroups();
        groups.forEach((g) => {
          geo.addGroup(g.start, g.count, g.materialIndex === 0 ? 0 : 1);
        });
      }

      function makeTextMesh(font, char, opts) {
        const geo = new TextGeometry(char, { font, ...opts });
        geo.computeBoundingBox();
        geo.center();
        remapDigitFrontUVs(geo, numberTextureFrame);
        splitBevelGroups(geo);
        return new THREE.Mesh(geo, makeDigitMeshMaterials());
      }

      async function init() {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        const { w, h } = stageSize();
        renderer.setSize(w, h, false);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(52, VIEW_ASPECT, 0.1, 50);
        camera.position.set(0, 0.15, 6.2);
        camera.lookAt(0, 0, 0);

        scene.add(new THREE.AmbientLight(0xffffff, 0.14));

        const key = new THREE.DirectionalLight(0xfff8ee, 2.2);
        key.position.set(0.3, 6, 8);
        scene.add(key);

        const rimL = new THREE.DirectionalLight(0xffffff, 0.55);
        rimL.position.set(-8, 2, 3);
        scene.add(rimL);

        const rimR = new THREE.DirectionalLight(0xeeeeff, 0.5);
        rimR.position.set(8, 1, 2.5);
        scene.add(rimR);

        const edgeTop = new THREE.PointLight(0xffffff, 1.5, 16);
        edgeTop.position.set(0, 3.5, 5.5);
        scene.add(edgeTop);

        const edgeL = new THREE.PointLight(0xdde8ff, 1.0, 14);
        edgeL.position.set(-4.5, 0.5, 4);
        scene.add(edgeL);

        const edgeR = new THREE.PointLight(0xdde8ff, 1.0, 14);
        edgeR.position.set(4.5, -0.3, 4);
        scene.add(edgeR);

        const chromeSpec = new THREE.PointLight(0xffffff, 0.85, 12);
        chromeSpec.position.set(0, -2, 5);
        scene.add(chromeSpec);

        window.onresize = onResize;
        animate();

        await setupFireVideo();
        createMaterials();

        const font = await loadFont();
        numberTextureFrame = computeNumberTextureFrame(font);

        ['5', '4', '3', '2', '1'].forEach((ch) => {
          items[ch] = makeTextMesh(font, ch, DIGIT_OPTS);
          items[ch].visible = false;
          scene.add(items[ch]);
        });

        items.LAST = makeLastGroup(font);
        items.LAST.visible = false;
        scene.add(items.LAST);

        if (replayBtn) {
          replayBtn.hidden = false;
          replayBtn.onclick = options.onReplay ?? play;
        }
        if (options.autoplay !== false) play();
      }

      function setMeshOpacity(mesh, v) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => { m.opacity = v; });
      }

      function setGroupOpacity(group, v) {
        group.traverse((o) => {
          if (o.isMesh) setMeshOpacity(o, v);
        });
      }

      function resetMesh(mesh) {
        mesh.visible = false;
        mesh.scale.setScalar(1);
        mesh.rotation.set(0, 0, 0);
        mesh.position.set(0, 0, 0);
        setMeshOpacity(mesh, 1);
      }

      function resetGroup(group) {
        group.visible = false;
        group.scale.setScalar(1);
        group.rotation.set(0, 0, 0);
        group.position.set(0, 0, 0);
        setGroupOpacity(group, 1);
        group.userData.meshes.forEach((m) => {
          m.rotation.set(0, 0, 0);
          m.position.set(0, 0, 0);
        });
      }

      function addFadeOut(tl, target, at, duration, isGroup = false) {
        const proxy = { opacity: 1 };
        const apply = isGroup
          ? (v) => setGroupOpacity(target, v)
          : (v) => setMeshOpacity(target, v);
        tl.to(proxy, {
          opacity: 0,
          duration,
          ease: HEAVY,
          onUpdate: () => apply(proxy.opacity),
        }, at);
      }

      function makeLastGroup(font) {
        const group = new THREE.Group();
        const chars = 'LAST'.split('');
        const meshes = [];
        chars.forEach((ch, i) => {
          const geo = new TextGeometry(ch, { font, ...LAST_OPTS });
          const { w, h } = getGlyphSize(geo);
          geo.center();
          splitBevelGroups(geo);
          const m = new THREE.Mesh(geo, makeMeshMaterials(w, h, FIRE_CHAR_TUNING[ch]));
          const a = LAST_LETTER_ANIM[i];
          m.userData.anim = a;
          m.position.set(a.start.x, a.start.y, a.start.z);
          m.rotation.set(a.entry.x, a.entry.y, a.entry.z);
          group.add(m);
          meshes.push(m);
        });
        group.userData.meshes = meshes;
        return group;
      }

      function addDigitAnim(tl, mesh, char, at) {
        const cfg = DIGIT_ANIM[char];
        const holdStart = at + T.appear;
        const exitStart = at + T.appear + T.hold;

        tl.add(() => {
          mesh.visible = true;
          mesh.scale.setScalar(0.35);
          mesh.rotation.set(cfg.entry.x, cfg.entry.y, cfg.entry.z);
          mesh.position.set(0, -0.32, -0.55);
          setMeshOpacity(mesh, 1);
          options.onDigitStart?.(char);
        }, at);

        tl.to(mesh.scale, { x: 1, y: 1, z: 1, duration: T.appear, ease: HEAVY }, at);
        tl.to(mesh.rotation, {
          x: cfg.rest.x, y: cfg.rest.y, z: cfg.rest.z,
          duration: T.appear, ease: HEAVY,
        }, at);
        tl.to(mesh.position, { x: 0, y: 0, z: 0, duration: T.appear, ease: HEAVY }, at);

        tl.to(mesh.rotation, {
          x: cfg.show.x, y: cfg.show.y, z: cfg.show.z,
          duration: T.hold, ease: HOLD_TILT,
        }, holdStart);

        tl.to(mesh.scale, { x: 0, y: 0, z: 0, duration: T.exit, ease: HEAVY }, exitStart);
        addFadeOut(tl, mesh, exitStart, T.exit);

        tl.add(() => resetMesh(mesh), at + STEP);
      }

      function hideAll() {
        Object.values(items).forEach((o) => {
          if (o.userData?.meshes) resetGroup(o);
          else resetMesh(o);
        });
      }

      function addLastAnim(tl, group, at) {
        const meshes = group.userData.meshes;
        const holdStart = at + T.appear;
        // const exitStart = at + T.appear + T.hold;

        tl.add(() => {
          group.visible = true;
          group.scale.setScalar(0.35);
          group.rotation.set(LAST_GROUP_REST.x * 1.25, LAST_GROUP_REST.y * 1.25, LAST_GROUP_REST.z);
          group.position.set(0, -0.28, -0.5);
          setGroupOpacity(group, 1);
          meshes.forEach((m) => {
            const a = m.userData.anim;
            m.position.set(a.start.x, a.start.y, a.start.z);
            m.rotation.set(a.entry.x, a.entry.y, a.entry.z);
          });
          if (!lastShownFired) {
            lastShownFired = true;
            options.onLastShown?.();
          }
          options.onDigitStart?.('LAST');
        }, at);

        tl.to(group.scale, { x: 1, y: 1, z: 1, duration: T.appear, ease: HEAVY }, at);
        tl.to(group.position, { x: 0, y: 0, z: 0, duration: T.appear, ease: HEAVY }, at);
        tl.to(group.rotation, {
          x: LAST_GROUP_REST.x, y: LAST_GROUP_REST.y, z: LAST_GROUP_REST.z,
          duration: T.appear, ease: HEAVY,
        }, at);

        meshes.forEach((m) => {
          const a = m.userData.anim;
          tl.to(m.position, {
            x: a.home.x, y: a.home.y, z: a.home.z,
            duration: T.appear, ease: HEAVY,
          }, at);
          tl.to(m.rotation, { x: 0, y: 0, z: 0, duration: T.appear, ease: HEAVY }, at);
        });

        tl.to(group.rotation, {
          x: LAST_GROUP_SHOW.x, y: LAST_GROUP_SHOW.y, z: LAST_GROUP_SHOW.z,
          duration: T.hold, ease: HOLD_TILT,
        }, holdStart);

        // LASTは暗転まで表示を維持したいので、退出（scale/fade/reset）は行わない
      }

      function play() {
        masterTL?.kill();
        lastShownFired = false;
        hideAll();
        if (fireVideo.paused) fireVideo.play().catch(() => {});
        masterTL = gsap.timeline();

        addDigitAnim(masterTL, items['5'], '5', 0);
        addDigitAnim(masterTL, items['4'], '4', STEP);
        addDigitAnim(masterTL, items['3'], '3', STEP * 2);
        addDigitAnim(masterTL, items['2'], '2', STEP * 3);
        addDigitAnim(masterTL, items['1'], '1', STEP * 4);
        addLastAnim(masterTL, items.LAST, STEP * 5);
        masterTL.eventCallback('onComplete', () => {
          options.onComplete?.();
        });
      }

      function onResize() {
        const { w, h } = stageSize();
        camera.aspect = VIEW_ASPECT;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        if (fireBgPlane) fitFireBackground();
      }

      function animate() {
        requestAnimationFrame(animate);
        if (fireTex) fireTex.needsUpdate = true;
        if (fireBgTex) fireBgTex.needsUpdate = true;
        renderer.render(scene, camera);
      }

  return init()
    .then(() => ({
      play,
      reset: hideAll,
    }))
    .catch((err) => {
      console.error(err);
      throw err;
    });
}
