import { States } from '../core/StateMachine.js';

export class AnimationManager {
  constructor(app) {
    this.app = app;
    this.tl = null;
  }

  build() {
    const a = this.app;
    const T = a.timeline;
    const S = T.scenes;
    const C = T.card;
    const { sm, audio, cam, cards, particles, effects, dom } = a;

    cards.prepareSpawn();
    cards.buildHero();
    effects.reset();

    const { ring, heroGroup, hero, dropKiseki, circlePlane, circleVideo, exitKiseki, spawnKiseki } = cards;

    ring.visible = false;
    ring.rotation.set(C.tiltX, 0, 0);
    ring.position.set(0, C.enterY, -1.8);
    ring.scale.setScalar(0.2);

    heroGroup.visible = false;
    heroGroup.position.set(0, 0, 1.1);
    heroGroup.scale.setScalar(1.62);
    dropKiseki.visible = false;
    dropKiseki.material.opacity = 0;
    circlePlane.visible = false;
    circlePlane.material.opacity = 0;

    dom.flash.style.opacity = '0';
    dom.darken.style.opacity = '0';
    dom.telop.className = '';
    dom.telop.style.opacity = '0';

    effects.playFire();
    audio.playFireLoop();
    particles.setMode('fire');
    cam.reset();

    const tl = gsap.timeline({ defaults: { ease: T.ease } });
    const go = (st, t) => tl.add(() => sm.transition(st), t);
    const spawnEnd = S.CARD_SPAWN.start + S.CARD_SPAWN.duration;
    const titleOutEnd = S.TITLE_OUT.start + S.TITLE_OUT.duration;
    const dropLand = S.SSR_DROP.start + S.SSR_DROP.duration;

    // 0.0〜0.5s 炎のみ
    go(States.FIRE_ONLY, S.FIRE_ONLY.start);

    // 0.5〜1.5s カード出現→中央で回転
    go(States.CARD_SPAWN, S.CARD_SPAWN.start);
    tl.add(() => { ring.visible = true; }, S.CARD_SPAWN.start);
    tl.to(ring.position, { y: C.centerY, z: 0.05, duration: S.CARD_SPAWN.duration, ease: 'power3.out' }, S.CARD_SPAWN.start);
    tl.to(ring.scale, { x: 1, y: 1, z: 1, duration: S.CARD_SPAWN.duration, ease: 'power3.out' }, S.CARD_SPAWN.start);
    tl.to(ring.rotation, { y: Math.PI * 0.32, duration: S.CARD_SPAWN.duration, ease: 'power3.out' }, S.CARD_SPAWN.start);

    cards.cards.forEach((card, i) => {
      const tgt = card.userData.target;
      const t0 = S.CARD_SPAWN.start + i * 0.07;
      tl.to(card.position, {
        x: tgt.x, y: tgt.y, z: tgt.z,
        duration: S.CARD_SPAWN.duration - i * 0.06,
        ease: 'power3.out',
      }, t0);
      tl.to(card.rotation, {
        y: card.rotation.y - Math.PI * 1.4,
        duration: S.CARD_SPAWN.duration - i * 0.05,
        ease: 'power2.out',
      }, t0);
      tl.to(card.scale, { x: 0.9, y: 0.9, z: 0.9, duration: 0.55, ease: 'back.out(1.5)' }, t0);
      const k = spawnKiseki[i];
      tl.add(() => cards.playVideo(k, 0.3), t0);
      tl.to(k.material, { opacity: 0, duration: 0.25, ease: 'power1.in' }, spawnEnd - 0.2);
    });

    tl.add(() => cards.startHexFloat(), spawnEnd - 0.35);
    tl.to(ring.rotation, { y: Math.PI * 0.55, duration: 0.35, ease: 'none' }, spawnEnd - 0.35);

    // 1.5〜2.0s カード退場
    go(States.CARD_DISAPPEAR, S.CARD_DISAPPEAR.start);
    tl.add(() => {
      cards.stopHexFloat();
      cards.playVideo(exitKiseki, 0.8);
      particles.burst(ring.position.y);
      audio.playImpact(92);
    }, S.CARD_DISAPPEAR.start);
    tl.to(ring.position, { y: C.exitY, duration: S.CARD_DISAPPEAR.duration, ease: 'power2.in' }, S.CARD_DISAPPEAR.start);
    tl.to(ring.rotation, { y: `+=${Math.PI * 1.4}`, duration: S.CARD_DISAPPEAR.duration, ease: 'power1.in' }, S.CARD_DISAPPEAR.start);
    cards.cards.forEach((card) => {
      tl.to(card.material, { opacity: 0, duration: S.CARD_DISAPPEAR.duration * 0.7, ease: 'power2.in' }, S.CARD_DISAPPEAR.start + 0.06);
    });
    tl.to(exitKiseki.material, { opacity: 0, duration: 0.2, ease: 'power2.in' }, S.CARD_DISAPPEAR.start + S.CARD_DISAPPEAR.duration - 0.2);
    tl.add(() => {
      ring.visible = false;
      cards.stopVideo(exitKiseki);
      spawnKiseki.forEach((k) => cards.stopVideo(k));
      cards.cards.forEach((c) => { c.material.opacity = 1; });
    }, S.CARD_DISAPPEAR.start + S.CARD_DISAPPEAR.duration);

    // 2.0s〜 SSR降下
    go(States.SSR_DROP, S.SSR_DROP.start);
    tl.add(() => {
      heroGroup.visible = true;
      heroGroup.position.set(0, 7.8, 1.05);
      heroGroup.rotation.set(0.15, 0.05, 0);
      heroGroup.scale.setScalar(1.3);
      cards.playVideo(dropKiseki, 0.85);
    }, S.SSR_DROP.start);
    tl.to(heroGroup.position, { y: -0.05, z: 1.28, duration: S.SSR_DROP.duration, ease: 'power3.out' }, S.SSR_DROP.start);
    tl.to(heroGroup.rotation, { x: 0, y: 0, duration: S.SSR_DROP.duration, ease: 'power2.out' }, S.SSR_DROP.start);
    tl.to(heroGroup.scale, { x: 1.68, y: 1.68, z: 1.68, duration: S.SSR_DROP.duration, ease: 'power2.out' }, S.SSR_DROP.start);
    tl.add(() => {
      cam.shake(0.05, 0.28);
      audio.playImpact(80);
      circlePlane.visible = true;
      circleVideo.currentTime = 0;
      circleVideo.play().catch(() => {});
      gsap.to(circlePlane.material, { opacity: 0.75, duration: 0.3, ease: 'power2.out' });
      effects.showSSRReveal(0.5);
    }, dropLand - 0.08);
    tl.to(dropKiseki.material, { opacity: 0, duration: 0.22, ease: 'power2.in' }, dropLand - 0.05);
    tl.add(() => cards.stopVideo(dropKiseki), dropLand);

    // テロップ表示（SSR着地後）
    go(States.TITLE_SHOW, S.TITLE_SHOW.start);
    tl.add(() => {
      dom.telop.className = 'glitch-in';
      dom.telop.style.opacity = '1';
      cards.startBounce(C.telopBouncePx, C.telopBouncePeriod, cam.camera);
      audio.playKiraan();
    }, S.TITLE_SHOW.start + 0.1);

    // テロップ消失
    go(States.TITLE_OUT, S.TITLE_OUT.start);
    tl.add(() => {
      cards.stopBounce();
      dom.telop.className = 'zoom-out';
      cam.zoomOut(S.TITLE_OUT.duration, -3);
    }, S.TITLE_OUT.start);
    tl.to(circlePlane.material, { opacity: 0, duration: S.TITLE_OUT.duration, ease: 'power2.in' }, S.TITLE_OUT.start);
    tl.to(hero.material, { opacity: 0, duration: S.TITLE_OUT.duration, ease: 'power2.in' }, S.TITLE_OUT.start);
    tl.add(() => effects.hideSSRReveal(), S.TITLE_OUT.start);
    tl.add(() => {
      heroGroup.visible = false;
      circlePlane.visible = false;
      circleVideo.pause();
      hero.material.opacity = 1;
      dom.telop.style.opacity = '0';
      dom.telop.className = '';
      cam.reset();
    }, titleOutEnd);

    // テロップ完全消失後 → ink1 → count（連続）
    tl.add(() => effects.playPostTelopSequence(sm, States), titleOutEnd);

    // フィナーレ
    tl.add(() => {
      effects.hidePostTelopVideos();
      sm.transition(States.BLACKOUT);
      effects.hideFire();
      gsap.to(dom.darken, { opacity: 1, duration: 0.4, ease: 'power2.in' });
      audio.stopFire();
      audio.playLowBoom();
      particles.setMode('off');
    }, '>');
    tl.to(dom.darken, { opacity: 1, duration: S.BLACKOUT.duration, ease: 'none' }, '>');

    tl.add(() => {
      dom.darken.style.opacity = '0';
      sm.transition(States.SSR_RESULT);
      effects.showSSRFinale();
      heroGroup.visible = true;
      heroGroup.position.set(0, -0.05, 1.35);
      heroGroup.scale.setScalar(1.8);
      hero.material.opacity = 0;
      gsap.to(hero.material, { opacity: 1, duration: 0.65, ease: 'power2.out' });
      cards.startBounce(C.resultBouncePx, C.resultBouncePeriod, cam.camera);
      particles.setMode('ssr');
      audio.playKiraan();
    }, '>');

    tl.to({}, { duration: S.SSR_RESULT.duration }, '>');
    tl.add(() => {
      sm.transition(States.WHITEOUT);
      cards.stopBounce();
      particles.setMode('off');
    }, '>');
    tl.to(dom.flash, { opacity: 1, duration: 0.08, ease: 'power3.in' }, '>');
    tl.to(dom.flash, { opacity: 0, duration: S.WHITEOUT.duration - 0.08, ease: 'power2.out' }, '>+=0.08');
    tl.add(() => { sm.transition(States.FINISH); a.onFinish?.(); }, '>');

    this.tl = tl;
    return tl;
  }

  kill() {
    this.tl?.kill();
    this.tl = null;
  }
}
