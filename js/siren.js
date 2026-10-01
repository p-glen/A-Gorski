/* Police-light glow on the "Sprawa pilna" section.

   Two soft lights (red, blue) sit ON the section's perimeter, so half of each
   spills into the card. They flash in irregular bursts and travel clockwise
   around the whole section, so no two flashes look alike:

   - a burst is 1-3 flashes; the gap before the next is random;
   - each flash has its own strength and reach (shallow or deep into the card);
   - the light drifts a little while it flashes, and each burst starts
     further round the perimeter;
   - "energy" follows how fast the page is being scrolled: parked on the
     section it is calm and faint, while scrolling the flashes are stronger,
     deeper and more frequent;
   - between flashes the lights are at exactly zero.

   Per frame only transform and opacity of two elements change, and the loop
   runs only while the section is on screen. Onsets are at least MIN_GAP apart
   (<= 3 flashes per second, WCAG 2.3.1). With reduced motion nothing runs. */
(function () {
  var section = document.querySelector('.sprawa-pilna-section');
  var rim = section && section.querySelector('.siren-rim');
  if (!rim) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var R = 280;          // half the light's box; .siren-rim__light is 560px in css
  var MIN_GAP = 360;    // ms between any two flash onsets (<= 2.8 per second)
  var IDLE = 0.25;      // energy while the visitor is not scrolling

  var lights = [
    { el: rim.querySelector('.siren-rim__light--red'), p: 0.05, flash: null },
    { el: rim.querySelector('.siren-rim__light--blue'), p: 0.55, flash: null }
  ];
  if (!lights[0].el || !lights[1].el) return;

  var W = 1, H = 1, P = 4;
  function measure() {
    W = section.clientWidth || 1;
    H = section.clientHeight || 1;
    P = 2 * (W + H);
  }

  // p in [0,1) -> a point on the perimeter, clockwise from the top-left
  // corner, plus whether that edge runs horizontally (top or bottom).
  function point(p) {
    var d = (((p % 1) + 1) % 1) * P;
    if (d < W) return [d, 0, true];
    d -= W;
    if (d < H) return [W, d, false];
    d -= H;
    if (d < W) return [W - d, H, true];
    d -= W;
    return [0, H - d, false];
  }

  function rand(a, b) { return a + Math.random() * (b - a); }
  // 0 while parked, 1 while scrolling fast.
  function lively() { return (energy - IDLE) / (1 - IDLE); }

  var energy = IDLE, lastY = 0, lastT = 0;
  var queue = [], cursor = 0, turn = 0;

  // Where a flash lands, as a fraction of the way round the perimeter.
  // `other` is the light that flashed just before (the "call"), if any.
  function pickPosition(L, other) {
    var r = Math.random();
    if (other && r < 0.65) {
      // The answer: across the section from the call, or tight beside it.
      return Math.random() < 0.7 ? other.p + rand(0.35, 0.65) : other.p + rand(-0.1, 0.1);
    }
    if (r < 0.55) return L.p + rand(0.06, 0.4);     // on round the section
    if (r < 0.8) return L.p + 0.5 + rand(-0.12, 0.12);   // jump to the far side
    return L.p - rand(0.05, 0.25);                  // sometimes back the other way
  }

  function planBurst(now) {
    // A burst is a short run of flashes. The two lights answer each other
    // (blue, then red almost at once), but not always, and not in a fixed
    // order, so the rhythm keeps changing. Scrolling fast allows longer runs.
    var roll = Math.random(), lv = lively();
    var n = roll < 0.2 ? 1 : roll < 0.48 ? 2 : roll < 0.72 ? 3 : roll < 0.88 ? 4 : 5;
    if (lv > 0.5 && Math.random() < 0.35) n += 1;
    var idx = Math.random() < 0.5 ? 0 : 1;
    // Parked: a burst every few seconds, with the odd long silence.
    // Scrolling fast: about every second.
    var t = Math.max(now, cursor) +
      (900 + Math.pow(Math.random(), 1.6) * 9000) / (1 + 3 * lv);
    var prev = null;
    for (var i = 0; i < n; i++) {
      // Within a burst the other light usually answers.
      if (i > 0 && Math.random() < 0.72) idx ^= 1;
      var L = lights[idx];
      L.p = (((pickPosition(L, prev && prev !== L ? prev : null)) % 1) + 1) % 1;
      var onset = Math.max(t, cursor + MIN_GAP);
      cursor = onset;
      queue.push({
        at: onset, light: L, p0: L.p,
        sweep: rand(-0.06, 0.09),        // drift while flashing (either way)
        k1: rand(0.3, 1),                // strength
        k2: rand(0.2, 1),                // reach
        k3: rand(1.0, 2.8),              // stretch along the edge it lights
        tau: rand(60, 210),              // decay, ms
        wild: Math.random() < 0.12       // now and then a strong, deep one even when parked
      });
      prev = L;
      // The answer follows straight away (the spacing floor still applies).
      t = onset + (Math.random() < 0.6 ? rand(0, 150) : rand(150, 700));
    }
  }

  function fire(f, now) {
    var peak = parseFloat(getComputedStyle(section).getPropertyValue('--siren-peak')) || 1;
    var e = f.wild ? Math.max(energy, 0.85) : energy;
    f.light.flash = {
      t0: now,
      peak: peak * f.k1 * (0.3 + 0.7 * e),
      r: Math.min(W * 0.42, Math.max(70, f.k2 * R * (0.4 + 0.6 * e))),
      tau: f.tau, p0: f.p0, sweep: f.sweep, stretch: f.k3
    };
  }

  function clear(L) {
    L.flash = null;
    L.el.style.opacity = '0';
  }

  function draw(L, now) {
    var f = L.flash;
    if (!f) return;
    var dt = now - f.t0;
    var o = dt < 60 ? dt / 60 : Math.exp(-(dt - 60) / f.tau);
    // Shift the curve down a hair so it meets zero instead of trailing off
    // into a barely visible tint.
    var op = Math.max(0, f.peak * o - 0.02);
    // The rise starts at zero, so only judge "done" once it has peaked.
    if (dt >= 60 && op === 0) { clear(L); return; }
    var pt = point(f.p0 + f.sweep * Math.min(dt / 500, 1));
    var s = (f.r / R) * (1 + 0.25 * (1 - Math.exp(-dt / 300)));   // blooms as it fades
    // Reach (into the card) is s; the light is longer than it is deep,
    // running along the edge it sits on.
    var sx = pt[2] ? s * f.stretch : s;
    var sy = pt[2] ? s : s * f.stretch;
    L.el.style.opacity = op.toFixed(3);
    L.el.style.transform = 'translate3d(' + (pt[0] - R).toFixed(1) + 'px,' +
      (pt[1] - R).toFixed(1) + 'px,0) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
  }

  var raf = 0, running = false, visible = false;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    var dt = now - lastT;
    lastT = now;
    var y = window.scrollY;
    if (dt > 0) {
      var v = Math.abs(y - lastY) / dt;                       // px per ms
      var target = IDLE + (1 - IDLE) * Math.min(v / 1.2, 1);
      energy += (target - energy) * (target > energy ? 0.25 : 0.03);
    }
    lastY = y;

    if (!queue.length) planBurst(now);
    // Scrolling after a long calm: don't make the next flash wait it out.
    var wait = queue[0].at - now, cap = 6000 / (1 + 3 * lively());
    if (wait > cap) {
      var shift = wait - cap;
      queue.forEach(function (q) { q.at -= shift; });
      cursor -= shift;
    }
    while (queue.length && queue[0].at <= now) fire(queue.shift(), now);

    draw(lights[0], now);
    draw(lights[1], now);
  }

  function start() {
    if (running) return;
    running = true;
    measure();
    lastT = performance.now();
    lastY = window.scrollY;
    cursor = 0;
    queue = [];
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    clear(lights[0]);
    clear(lights[1]);
  }
  function sync() {
    if (visible && !document.hidden) start();
    else stop();
  }

  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(section);
  window.addEventListener('resize', measure);
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[entries.length - 1].isIntersecting;
      sync();
    }).observe(section);
  } else {
    // No way to tell: run it (the loop is cheap, two elements).
    visible = true;
    sync();
  }
})();
