// Blog index: category chips (hidden until this script runs, so the full
// list is still readable without JS).
(function () {
  var chips = document.querySelector('[data-chips]');
  if (!chips) return;
  chips.hidden = false;
  var buttons = Array.prototype.slice.call(chips.querySelectorAll('[data-filter]'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('.post-card'));

  chips.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-filter]');
    if (!btn) return;
    var value = btn.getAttribute('data-filter');
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
    cards.forEach(function (card) {
      card.hidden = value !== 'all' && card.getAttribute('data-category') !== value;
    });
  });
})();

// Guide: the sticky call bar waits until the call button in the page header
// has scrolled out of view, so the first screen never shows two of them.
(function () {
  var bar = document.querySelector('.callbar');
  var button = document.querySelector('.guide__call-button');
  if (!bar || !button || !('IntersectionObserver' in window)) return;
  bar.classList.add('callbar--wait');
  new IntersectionObserver(function (entries) {
    bar.classList.toggle('callbar--wait', entries[0].isIntersecting);
  }).observe(button);
})();
