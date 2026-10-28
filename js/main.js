(function () {
  var root = document.documentElement;
  var themeToggles = document.querySelectorAll('.theme-toggle');
  var stored = localStorage.getItem('kag-theme');
  if (stored) root.setAttribute('data-theme', stored);

  function currentTheme() {
    return root.getAttribute('data-theme') || 'dark';
  }

  // Each toggle names the mode it will switch to (there is one in the bar and
  // one inside the mobile menu).
  var themeColor = document.querySelector('meta[name="theme-color"]');
  function syncThemeToggle() {
    var label = currentTheme() === 'dark' ? 'Włącz jasny motyw' : 'Włącz ciemny motyw';
    themeToggles.forEach(function (btn) { btn.setAttribute('aria-label', label); });
    // Browser chrome on phones follows the page, not just the system setting.
    if (themeColor) themeColor.setAttribute('content', currentTheme() === 'dark' ? '#1C1A17' : '#F3EFE6');
  }
  syncThemeToggle();

  themeToggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('kag-theme', next);
      syncThemeToggle();
    });
  });

  // Scrollspy: the nav tab of the section in view gets aria-current="location"
  // (shown as the underline). Only on the landing page, where tabs are anchors.
  var spyLinks = document.querySelectorAll('.site-nav__links a[href^="#"]');
  if (spyLinks.length && 'IntersectionObserver' in window) {
    var spyMap = {};
    spyLinks.forEach(function (a) { spyMap[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = spyMap[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          spyLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
          link.setAttribute('aria-current', 'location');
        } else if (link.getAttribute('aria-current') === 'location') {
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(spyMap).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  // Menu (phones and tablets): the button states what it does, the page
  // behind stays put while it is open, Escape closes it and returns focus,
  // and it closes by itself when the window grows to the desktop bar.
  var navToggle = document.querySelector('.nav-toggle');
  function setMenu(open) {
    document.body.classList.toggle('nav-open', open);
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
    }
  }
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      setMenu(!document.body.classList.contains('nav-open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        setMenu(false);
        navToggle.focus();
      }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (e) {
      if (e.matches) setMenu(false);
    });
  }

  document.querySelectorAll('.site-nav__links a').forEach(function (link) {
    link.addEventListener('click', function () { setMenu(false); });
  });

  // Sticky call bar (phones, inner pages). It stays out of the way while the
  // page's own call to action is on screen (the guide's call button, the
  // closing block, the footer) and while the title block is, so two never
  // compete for one screen. Without JS a <noscript> rule keeps it in view.
  var callbar = document.querySelector('.callbar');
  if (callbar && 'IntersectionObserver' in window) {
    var visible = new Set();
    var watch = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target);
      });
      callbar.classList.toggle('callbar--wait', visible.size > 0);
    });
    [
      document.querySelector('.guide__call-button, .article__head, .page-head'),
      document.querySelector('.cta-block'),
      document.querySelector('.site-footer')
    ].forEach(function (el) { if (el) watch.observe(el); });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Contact card -> hero scene (see "Scene" in style.css). Scroll position
  // becomes one number, --p (0..1), published on the scene and the nav; all
  // choreography is CSS derived from it. The only other work is measuring
  // the crop geometry when the layout changes. With reduced motion (or no
  // JS) this never runs, data-scene is never set, and the section stays a
  // plain, stacked page.
  // A phone on its side is too short for the card to fit one screen, so it
  // gets the plain stacked page, like reduced motion does. Re-checked on
  // rotation: the scene starts or stops without a reload.
  var scene = document.querySelector('.scene');
  var short = window.matchMedia('(max-height: 520px)');
  var sceneApi = null;
  function syncScene() {
    if (!scene || reduceMotion) return;
    if (short.matches) {
      if (sceneApi) sceneApi.stop();
    } else if (sceneApi) {
      sceneApi.start();
    } else {
      sceneApi = initScene(scene);
    }
  }
  syncScene();
  short.addEventListener('change', syncScene);

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

    var active = false;
    var travel = 1;
    function measure() {
      if (!active) return;
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
      if (!active) return;
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

    function start() {
      if (active) return;
      active = true;
      // Opt in first: the sticky layout changes the geometry we measure.
      root.setAttribute('data-scene', 'on');
      measure();
    }
    // Back to the plain stacked page: no scene attributes, nothing hidden
    // from keyboard or screen reader.
    function stop() {
      if (!active) return;
      active = false;
      root.removeAttribute('data-scene');
      scene.removeAttribute('data-ready');
      scene.removeAttribute('data-state');
      scene.removeAttribute('style');
      if (nav) nav.style.removeProperty('--p');
      state = null;
      setFocusable(card, true);
      setFocusable(hero, true);
      card.removeAttribute('aria-hidden');
    }
    start();
    return { start: start, stop: stop };
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
