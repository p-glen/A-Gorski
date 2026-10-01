(function () {
  var root = document.documentElement;
  var themeToggle = document.querySelector('.theme-toggle');
  var stored = localStorage.getItem('kag-theme');
  if (stored) root.setAttribute('data-theme', stored);

  function currentTheme() {
    return root.getAttribute('data-theme') || 'dark';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('kag-theme', next);
    });
  }

  var navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      document.body.classList.toggle('nav-open');
    });
  }

  document.querySelectorAll('.site-nav__links a').forEach(function (link) {
    link.addEventListener('click', function () {
      document.body.classList.remove('nav-open');
    });
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Contact card -> hero scene (see "Scene" in style.css). Scroll position
  // becomes one number, --p (0..1), published on the scene and the nav; all
  // choreography is CSS derived from it. The only other work is measuring
  // the crop geometry when the layout changes. With reduced motion (or no
  // JS) this never runs, data-scene is never set, and the section stays a
  // plain, stacked page.
  var scene = document.querySelector('.scene');
  if (scene && !reduceMotion) initScene(scene);

  function initScene(scene) {
    var stage = scene.querySelector('.scene__stage');
    var avatar = scene.querySelector('.scene__avatar-wrap');
    var card = scene.querySelector('.scene__card');
    var hero = scene.querySelector('.scene__hero');
    var nav = document.querySelector('.site-nav');
    var wide = window.matchMedia('(min-width: 900px)');

    // Source image (img/arkadiusz-gorski-portret.webp) and the square window
    // of it shown in the circle. Must match .scene__avatar in style.css.
    var IMG_W = 896, IMG_H = 1200;
    var CROP = { x: 450, y: 285, half: 150 };

    // Opt in first: the sticky layout changes the geometry we measure.
    root.setAttribute('data-scene', 'on');

    var travel = 1;
    function measure() {
      var s = stage.getBoundingClientRect();
      var a = avatar.getBoundingClientRect();
      var W = s.width, H = s.height;
      var r = a.width / 2;
      var cx = a.left - s.left + r;
      var cy = a.top - s.top + r;
      travel = H;

      // Where the full photo sits in the stage: mirrors the object-fit /
      // object-position rules on .scene__photo img.
      var sc, x0, y0;
      if (wide.matches) {
        sc = Math.min(W / IMG_W, H / IMG_H);
        x0 = W - IMG_W * sc;
        y0 = (H - IMG_H * sc) / 2;
      } else {
        sc = Math.max(W / IMG_W, H / IMG_H);
        x0 = (W - IMG_W * sc) / 2;
        y0 = (H - IMG_H * sc) * 0.1;
      }
      // Crop centre in stage px; zoom that makes the crop window fill the circle.
      var ox = x0 + CROP.x * sc;
      var oy = y0 + CROP.y * sc;
      var z = (r / CROP.half) / sc;

      var set = function (k, v) { scene.style.setProperty(k, v); };
      set('--top0', (cy - r) + 'px');
      set('--bottom0', (H - cy - r) + 'px');
      set('--left0', (cx - r) + 'px');
      set('--right0', (W - cx - r) + 'px');
      set('--r0', r + 'px');
      set('--ox', ox + 'px');
      set('--oy', oy + 'px');
      set('--tx', (cx - ox) + 'px');
      set('--ty', (cy - oy) + 'px');
      set('--z', z.toFixed(4));
      scene.setAttribute('data-ready', '');
      update();
    }

    // Off-screen controls must not take keyboard focus; the H1 stays in the
    // accessibility tree throughout.
    var state = null;
    function setFocusable(root_, on) {
      root_.querySelectorAll('a, button').forEach(function (el) {
        if (on) el.removeAttribute('tabindex');
        else el.setAttribute('tabindex', '-1');
      });
    }
    function setState(next) {
      if (state === next) return;
      state = next;
      scene.setAttribute('data-state', next);
      setFocusable(card, next === 'card');
      setFocusable(hero, next === 'hero');
      card.setAttribute('aria-hidden', next === 'card' ? 'false' : 'true');
    }

    var ticking = false;
    function update() {
      ticking = false;
      var p = Math.min(Math.max(-scene.getBoundingClientRect().top / travel, 0), 1);
      var v = p.toFixed(4);
      scene.style.setProperty('--p', v);
      if (nav) nav.style.setProperty('--p', v);
      setState(p < 0.5 ? 'card' : 'hero');
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    // Layout changes: window resize, mobile address bar (svh), web fonts
    // arriving and reflowing the card.
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(measure);
      ro.observe(stage);
      ro.observe(card);
    } else {
      window.addEventListener('resize', measure);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();
  }

  var siteNav = document.querySelector('.site-nav');

  // The nav's real height becomes #page-content's top padding (see
  // style.css) so the page's resting layout starts right below the fixed
  // nav instead of underneath it.
  if (siteNav) {
    var setNavHeight = function () {
      root.style.setProperty('--nav-height', siteNav.offsetHeight + 'px');
    };
    setNavHeight();
    window.addEventListener('resize', setNavHeight);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(setNavHeight);
    }
  }

})();
