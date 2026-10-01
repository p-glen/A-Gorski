/* Carousel controls for [data-carousel] (the "Specjalizacje" cards).
   The scrolling itself is native CSS scroll-snap; this only wires the arrows
   and dots and keeps them in sync with where the track is. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function init(root) {
    var track = root.querySelector('[data-carousel-track]');
    var prev = root.querySelector('[data-carousel-prev]');
    var next = root.querySelector('[data-carousel-next]');
    if (!track || !prev || !next) return;
    var cards = Array.prototype.slice.call(track.children);
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-carousel-dot]'));
    if (cards.length < 2) return;

    // Scroll offset at which the first card sits at its snap position; every
    // other card's target is its offsetLeft minus this.
    function origin() { return cards[0].offsetLeft; }

    function maxScroll() { return track.scrollWidth - track.clientWidth; }

    // The card currently at the start edge. At the very end the last cards
    // cannot reach the start edge, so the end of the track means "last".
    function current() {
      var x = track.scrollLeft;
      if (x >= maxScroll() - 2) return cards.length - 1;
      var best = 0, bestDist = Infinity;
      cards.forEach(function (card, i) {
        var d = Math.abs(card.offsetLeft - origin() - x);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    }

    function update() {
      var i = current();
      dots.forEach(function (dot, k) {
        if (k === i) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= maxScroll() - 2;
    }

    function go(i) {
      i = Math.max(0, Math.min(cards.length - 1, i));
      track.scrollTo({
        left: Math.min(maxScroll(), cards[i].offsetLeft - origin()),
        behavior: reduce.matches ? 'auto' : 'smooth'
      });
    }

    prev.addEventListener('click', function () { go(current() - 1); });
    next.addEventListener('click', function () { go(current() + 1); });
    dots.forEach(function (dot, k) { dot.addEventListener('click', function () { go(k); }); });

    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    window.addEventListener('resize', update);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
    update();
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-carousel]'), init);
})();
