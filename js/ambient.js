/* Ambient motion for the landing page.
   - Falling leaves (ginkgo, maple, bamboo) on a canvas over the hero.
     Leaves tumble in three dimensions, ride a slow wind, and settle into a
     pile at the foot of the hero before fading away and returning.
   - Scroll reveals for sections.
   Everything respects prefers-reduced-motion and pauses when the hero is
   off screen or the tab is hidden. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* ------------------------------------------------------------------ */
  /* Scroll reveal                                                        */
  /* ------------------------------------------------------------------ */

  var revealNodes = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealNodes.forEach(function (n) { n.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealNodes.forEach(function (n) { io.observe(n); });
  }

  /* ------------------------------------------------------------------ */
  /* Leaves                                                               */
  /* ------------------------------------------------------------------ */

  var hero = document.querySelector('.hero');
  var canvas = document.getElementById('leaf-canvas');
  if (!hero || !canvas) return;

  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, groundY = 0;
  var leaves = [];
  var settled = [];
  var running = false;
  var visible = true;
  var lastT = 0;
  var rafId = null;

  var PALETTE = {
    ginkgo: ['#d9a648', '#c98f3a', '#e2b45c', '#b8802f'],
    maple:  ['#d97757', '#b85e40', '#c9673f', '#e08a68'],
    bamboo: ['#8f9b6a', '#7a8a5a', '#a3ad7c']
  };
  var TYPES = ['ginkgo', 'ginkgo', 'maple', 'maple', 'bamboo'];

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function targetCount() {
    var byWidth = Math.round(W / 48);
    return Math.max(10, Math.min(36, byWidth));
  }

  function resize() {
    var r = hero.getBoundingClientRect();
    W = Math.round(r.width);
    H = Math.round(r.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = H - 14;
  }

  function makeLeaf(fromTop) {
    var type = pick(TYPES);
    var depth = rand(0.45, 1);          /* 1 = nearest */
    var size = (type === 'bamboo' ? rand(9, 14) : rand(11, 19)) * (0.6 + depth * 0.5);
    return {
      type: type,
      color: pick(PALETTE[type]),
      x: rand(-W * 0.1, W * 1.05),
      y: fromTop ? rand(-H * 0.6, -size * 2) : rand(-size, H * 0.9),
      size: size,
      depth: depth,
      vy: rand(18, 34) * (0.55 + depth * 0.6),   /* px per second */
      rot: rand(0, Math.PI * 2),
      rotV: rand(-1.1, 1.1),
      flip: rand(0, Math.PI * 2),
      flipV: rand(1.2, 2.6) * (Math.random() < 0.5 ? -1 : 1),
      swayPhase: rand(0, Math.PI * 2),
      swayFreq: rand(0.6, 1.3),
      swayAmp: rand(14, 34),
      alpha: 0,
      state: 'falling'
    };
  }

  function settle(leaf, now) {
    leaf.state = 'settled';
    leaf.settledAt = now;
    leaf.y = groundY - leaf.size * 0.25 - rand(0, 6);
    leaf.restRot = leaf.rot + rand(-0.4, 0.4);
    leaf.restFlip = Math.abs(Math.cos(leaf.flip)) < 0.45 ? rand(0.5, 0.75) : Math.abs(Math.cos(leaf.flip));
    leaf.landT = 0;
    leaf.life = rand(16, 28);          /* seconds resting before fading */
    settled.push(leaf);
    if (settled.length > 48) {
      var old = settled.shift();
      old.state = 'fading';
    }
  }

  /* ---- leaf shapes, drawn centred on the origin ---- */

  function drawGinkgo(s) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.42);
    ctx.bezierCurveTo(-s * 1.05, s * 0.28, -s * 0.95, -s * 0.78, -s * 0.06, -s * 0.52);
    ctx.lineTo(0, -s * 0.38);
    ctx.lineTo(s * 0.06, -s * 0.52);
    ctx.bezierCurveTo(s * 0.95, -s * 0.78, s * 1.05, s * 0.28, 0, s * 0.42);
    ctx.closePath();
    ctx.fill();
    /* radiating veins */
    ctx.globalAlpha *= 0.35;
    ctx.beginPath();
    for (var i = -3; i <= 3; i++) {
      var a = -Math.PI / 2 + i * 0.28;
      ctx.moveTo(0, s * 0.42);
      ctx.lineTo(Math.cos(a) * s * 0.85, s * 0.42 + Math.sin(a) * s * 0.95);
    }
    ctx.stroke();
    ctx.globalAlpha /= 0.35;
    /* stem */
    ctx.beginPath();
    ctx.moveTo(0, s * 0.42);
    ctx.lineTo(0, s * 0.95);
    ctx.stroke();
  }

  function drawMaple(s) {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.72, -s * 0.62, s * 0.66, s * 0.42, 0, s * 0.92);
    ctx.bezierCurveTo(-s * 0.66, s * 0.42, -s * 0.72, -s * 0.62, 0, -s);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha *= 0.4;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.85);
    ctx.lineTo(0, s * 0.85);
    for (var i = 0; i < 3; i++) {
      var y = -s * 0.5 + i * s * 0.4;
      ctx.moveTo(0, y);
      ctx.lineTo(s * 0.34, y + s * 0.28);
      ctx.moveTo(0, y);
      ctx.lineTo(-s * 0.34, y + s * 0.28);
    }
    ctx.stroke();
    ctx.globalAlpha /= 0.4;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.92);
    ctx.lineTo(0, s * 1.3);
    ctx.stroke();
  }

  function drawBamboo(s) {
    ctx.beginPath();
    ctx.moveTo(0, -s * 1.5);
    ctx.quadraticCurveTo(s * 0.42, 0, 0, s * 1.5);
    ctx.quadraticCurveTo(-s * 0.42, 0, 0, -s * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha *= 0.4;
    ctx.beginPath();
    ctx.moveTo(0, -s * 1.3);
    ctx.lineTo(0, s * 1.3);
    ctx.stroke();
    ctx.globalAlpha /= 0.4;
  }

  function drawLeaf(leaf) {
    var scaleX = leaf.state === 'falling' ? Math.cos(leaf.flip) : leaf.restFlip;
    if (Math.abs(scaleX) < 0.08) scaleX = 0.08 * (scaleX < 0 ? -1 : 1);
    var shade = leaf.state === 'falling' ? 0.78 + Math.abs(Math.cos(leaf.flip)) * 0.22 : 0.9;

    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.state === 'falling' ? leaf.rot : leaf.restRot);
    ctx.scale(scaleX, 1);
    ctx.globalAlpha = leaf.alpha * (0.55 + leaf.depth * 0.45);
    ctx.fillStyle = leaf.color;
    ctx.strokeStyle = 'rgba(70, 45, 30, 0.9)';
    ctx.lineWidth = Math.max(0.6, leaf.size * 0.06);
    ctx.lineCap = 'round';

    /* soft shadow for nearer leaves */
    if (leaf.depth > 0.75) {
      ctx.shadowColor = 'rgba(60, 40, 30, 0.18)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
    }

    /* darken the underside when the leaf turns edge-on */
    if (shade < 1) {
      ctx.fillStyle = leaf.color;
    }

    if (leaf.type === 'ginkgo') drawGinkgo(leaf.size);
    else if (leaf.type === 'maple') drawMaple(leaf.size);
    else drawBamboo(leaf.size);

    if (shade < 0.95) {
      ctx.shadowColor = 'transparent';
      ctx.globalAlpha *= (1 - shade) * 0.9;
      ctx.fillStyle = '#3f3531';
      if (leaf.type === 'ginkgo') drawGinkgo(leaf.size);
      else if (leaf.type === 'maple') drawMaple(leaf.size);
      else drawBamboo(leaf.size);
    }
    ctx.restore();
  }

  /* ---- simulation ---- */

  function wind(t) {
    return 22 * Math.sin(t * 0.00035) + 12 * Math.sin(t * 0.0011 + 1.7) + 6 * Math.sin(t * 0.0029);
  }

  function step(now) {
    var dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
    lastT = now;
    var w = wind(now);
    var i, leaf;

    /* keep population up */
    var falling = 0;
    for (i = 0; i < leaves.length; i++) if (leaves[i].state === 'falling') falling++;
    var want = targetCount();
    if (falling < want && Math.random() < 0.35) leaves.push(makeLeaf(true));

    ctx.clearRect(0, 0, W, H);

    /* draw settled first so falling leaves pass in front */
    for (i = 0; i < leaves.length; i++) {
      leaf = leaves[i];
      if (leaf.state === 'falling') continue;
      var age = (now - leaf.settledAt) / 1000;
      if (leaf.state === 'settled') {
        leaf.landT = Math.min(1, leaf.landT + dt * 1.8);
        var ease = 1 - Math.pow(1 - leaf.landT, 3);
        leaf.restRot = leaf.restRot + (leaf.rot - leaf.restRot) * 0 ; /* keep chosen rest angle */
        leaf.alpha = 0.92;
        /* tiny settle nudge */
        leaf.y += (1 - ease) * 0.3;
        if (age > leaf.life) leaf.state = 'fading';
      }
      if (leaf.state === 'fading') {
        leaf.alpha -= dt * 0.35;
        if (leaf.alpha <= 0) {
          var idx = settled.indexOf(leaf);
          if (idx >= 0) settled.splice(idx, 1);
          leaves[i] = makeLeaf(true);
          continue;
        }
      }
      drawLeaf(leaf);
    }

    for (i = 0; i < leaves.length; i++) {
      leaf = leaves[i];
      if (leaf.state !== 'falling') continue;
      leaf.alpha = Math.min(1, leaf.alpha + dt * 1.2);
      leaf.flip += leaf.flipV * dt;
      leaf.rot += leaf.rotV * dt + (w / 400) * dt;
      var sway = Math.sin(now * 0.001 * leaf.swayFreq + leaf.swayPhase) * leaf.swayAmp;
      leaf.x += (w * leaf.depth * 0.9 + sway * 0.9) * dt;
      /* an edge-on leaf slips faster, a flat one floats */
      var drag = 0.7 + Math.abs(Math.cos(leaf.flip)) * 0.0 + (1 - Math.abs(Math.cos(leaf.flip))) * 0.5;
      leaf.y += leaf.vy * drag * dt;

      if (leaf.x < -60) leaf.x = W + 40;
      if (leaf.x > W + 60) leaf.x = -40;

      if (leaf.y >= groundY - leaf.size * 0.25) {
        settle(leaf, now);
      }
      drawLeaf(leaf);
    }

    if (running) rafId = requestAnimationFrame(step);
  }

  function start() {
    if (running || !visible || document.hidden) return;
    running = true;
    lastT = performance.now();
    rafId = requestAnimationFrame(step);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function drawStatic() {
    /* Reduced motion: a still scattering of fallen leaves along the ground. */
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < 22; i++) {
      var leaf = makeLeaf(false);
      leaf.x = rand(0, W);
      leaf.state = 'settled';
      leaf.y = groundY - leaf.size * 0.25 - rand(0, 8);
      leaf.restRot = rand(0, Math.PI * 2);
      leaf.restFlip = rand(0.55, 1);
      leaf.alpha = 0.9;
      drawLeaf(leaf);
    }
  }

  resize();

  if (reduceMotion) {
    drawStatic();
    window.addEventListener('resize', function () { resize(); drawStatic(); });
    return;
  }

  /* seed a few leaves mid-air so the first frame isn't empty */
  for (var s = 0; s < targetCount() * 0.6; s++) leaves.push(makeLeaf(false));
  leaves.forEach(function (l) { l.alpha = 1; });

  if ('ResizeObserver' in window) {
    new ResizeObserver(function () { resize(); }).observe(hero);
  } else {
    window.addEventListener('resize', resize);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0.02 }).observe(hero);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  start();
})();
