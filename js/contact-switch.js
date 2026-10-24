(function () {
  var wrap = document.querySelector('[data-contact-switch]');
  if (!wrap) return;
  var tabs = Array.prototype.slice.call(wrap.querySelectorAll('[role="tab"]'));

  function show(name) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === name;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () {
      show(t.getAttribute('data-tab'));
    });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      show(next.getAttribute('data-tab'));
    });
  });

  function fromHash() {
    if (location.hash === '#formularz') show('anon');
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
