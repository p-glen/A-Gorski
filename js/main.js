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

  var introScreen = document.querySelector('.intro-screen');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The call bar is fixed to the bottom edge and must not cover anything, so
  // its measured height is published as --cta-bar-height; the intro screen,
  // #page-content and the theme toggle all subtract it (see style.css). It is
  // measured rather than hardcoded because the label wraps at narrow widths.
  var callBar = document.querySelector('.intro-floating-cta');
  if (callBar) {
    var setCallBarHeight = function () {
      root.style.setProperty('--cta-bar-height', callBar.offsetHeight + 'px');
    };
    setCallBarHeight();
    window.addEventListener('resize', setCallBarHeight);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(setCallBarHeight);
    }
  }
  if (introScreen && !reduceMotion) {
    // Opts the intro retreat and the nav slide-in into their scroll-linked
    // CSS (see style.css). Without it -- no JS, or reduced motion -- the
    // intro stays opaque and the nav stays visible, which is a fine page.
    root.setAttribute('data-intro', 'on');
  }
  var introStage = document.querySelector('.intro-stage');
  if (introScreen) {
    var ticking = false;
    var introDone = false;
    var updateIntroProgress = function () {
      // The stage, not the screen, defines the scroll budget: the screen is
      // position: fixed and reserves no space of its own.
      var introHeight = (introStage && introStage.offsetHeight) || window.innerHeight || 1;
      var progress = Math.min(Math.max(window.scrollY / introHeight, 0), 1);
      root.style.setProperty('--intro-progress', progress.toFixed(3));
      var done = progress >= 1;
      if (done !== introDone) {
        introDone = done;
        if (done) root.setAttribute('data-intro-done', '');
        else root.removeAttribute('data-intro-done');
      }
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateIntroProgress);
        ticking = true;
      }
    }, { passive: true });
    updateIntroProgress();
  }

  // Rotator headline: a single word element. Its font-size is computed from
  // the widest of the three words so it never changes size between them --
  // only the word itself changes, via a left-to-right "typed in" clip-path
  // reveal (steps() timing so it lands per-letter, not a smooth wipe), then
  // a quick blur+fade dissolve before the next word types in.
  var rotator = document.querySelector('.intro-screen__rotator');
  var wordEl = rotator && rotator.querySelector('.intro-screen__rotator-word');
  if (rotator && wordEl) {
    var ROTATOR_WORDS = ['Zatrzymanie', 'Przeszukanie', 'Wezwanie'];
    var TARGET_FRACTION = 0.88; // leave a margin so it reads as centered, not edge-to-edge
    var PROBE_SIZE = 100;
    var probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;top:-9999px;left:-9999px;';
    document.body.appendChild(probe);

    var fitRotatorFont = function () {
      var cs = getComputedStyle(rotator);
      probe.style.fontFamily = cs.fontFamily;
      probe.style.fontWeight = cs.fontWeight;
      probe.style.letterSpacing = cs.letterSpacing;
      probe.style.textTransform = cs.textTransform;
      probe.style.fontSize = PROBE_SIZE + 'px';
      var maxWidth = 0;
      ROTATOR_WORDS.forEach(function (w) {
        probe.textContent = w;
        maxWidth = Math.max(maxWidth, probe.getBoundingClientRect().width);
      });
      var targetWidth = rotator.parentElement.clientWidth * TARGET_FRACTION;
      var fontSize = PROBE_SIZE * (targetWidth / maxWidth);
      rotator.style.fontSize = fontSize + 'px';
      var lineHeightPx = parseFloat(cs.lineHeight) || fontSize;
      rotator.style.height = lineHeightPx + 'px';
    };

    fitRotatorFont();
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fitRotatorFont, 150);
    });

    if (ROTATOR_WORDS.length > 1) {
      var index = 0;
      var HOLD_MS = 2400;
      var MS_PER_CHAR = 70;
      var MIN_TYPE_MS = 260;
      var ERASE_MS = 300;
      var activeAnim = null; // WAAPI fill:'forwards' overrides inline styles
                              // until canceled, so only one may be alive
                              // at a time or the older one wins visually.

      var typeWord = function (word) {
        wordEl.textContent = word;
        var duration = Math.max(word.length * MS_PER_CHAR, MIN_TYPE_MS);
        if (activeAnim) activeAnim.cancel();
        activeAnim = wordEl.animate(
          [{ clipPath: 'inset(-50% 100% -50% 0)' }, { clipPath: 'inset(-50% 0% -50% 0)' }],
          { duration: duration, easing: 'steps(' + word.length + ', end)', fill: 'forwards' }
        );
      };

      var advance = function () {
        if (reduceMotion) {
          index = (index + 1) % ROTATOR_WORDS.length;
          wordEl.textContent = ROTATOR_WORDS[index];
          return;
        }
        if (activeAnim) activeAnim.cancel();
        activeAnim = wordEl.animate(
          [{ opacity: 1 }, { opacity: 0 }],
          { duration: ERASE_MS, easing: 'ease-in', fill: 'forwards' }
        );
        activeAnim.onfinish = function () {
          activeAnim.cancel();
          activeAnim = null;
          index = (index + 1) % ROTATOR_WORDS.length;
          typeWord(ROTATOR_WORDS[index]);
        };
      };

      if (reduceMotion) {
        wordEl.textContent = ROTATOR_WORDS[0];
      } else {
        wordEl.style.opacity = '1';
        typeWord(ROTATOR_WORDS[0]);
      }
      setInterval(advance, HOLD_MS);
    }
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
