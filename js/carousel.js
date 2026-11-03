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
    // Read live: the review script reorders the cards after this runs.
    function list() { return Array.prototype.slice.call(track.querySelectorAll(':scope > .specjalizacje-card')); }
    var cards = list();
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-carousel-dot]'));
    if (cards.length < 2) return;

    // Scroll offset at which the first card sits at its snap position; every
    // other card's target is its offsetLeft minus this.
    function origin() { return cards[0].offsetLeft; }

    // Where each card's start-edge position is; the spacer after the last card
    // (see .carousel__track::after) lets every card reach it.
    function stops() {
      cards = list();
      return cards.map(function (card) { return Math.min(maxScroll(), card.offsetLeft - origin()); });
    }

    function maxScroll() { return track.scrollWidth - track.clientWidth; }

    // The card currently at the start edge. At the very end the last cards
    // cannot reach the start edge, so the end of the track means "last".
    function current() {
      var x = track.scrollLeft, at = stops();
      if (x >= maxScroll() - 2) return cards.length - 1;
      var best = 0, bestDist = Infinity;
      at.forEach(function (s, i) {
        var d = Math.abs(s - x);
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

    function scrollToX(left) {
      track.scrollTo({ left: left, behavior: reduce.matches ? 'auto' : 'smooth' });
    }

    function go(i) {
      var at = stops();
      scrollToX(at[Math.max(0, Math.min(at.length - 1, i))]);
    }

    // Arrows move to the nearest stop strictly before / after where the track
    // is now, so they never stall when stops are clamped at the ends.
    prev.addEventListener('click', function () {
      var x = track.scrollLeft, before = stops().filter(function (s) { return s < x - 2; });
      scrollToX(before.length ? before[before.length - 1] : 0);
    });
    next.addEventListener('click', function () {
      var x = track.scrollLeft, after = stops().filter(function (s) { return s > x + 2; });
      scrollToX(after.length ? after[0] : maxScroll());
    });
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
