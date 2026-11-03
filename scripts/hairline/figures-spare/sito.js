/**
 * Sito: three round sieves stacked over a pan, each with its mesh of dots.
 * The pointer's height picks a sieve; the ones above it lift away and open it
 * up, and the picked one takes the bright edge. At rest the stack is closed
 * and one dot in the middle mesh is bright. The slider is the gap, in world
 * units.
 *
 * The pattern: scrub and pick, with the layers of Exploded.
 */
const {
  Cam, facing, fit, flatDot, place, prism, proj, put, rings, rrect, solid,
  tdone, tset, tval, tween, disposer, mk, pointer, register,
} = HL;

const N = 3, R = 40, T = 3.6, STEP = 11, STAG = 50, K = 14;
const CELLS = [];
for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if (Math.hypot(i, j) < 2.5) CELLS.push([i * K, j * K]);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let gap = value;
  const C = Cam(45, 0.5, 2.05);
  fit(C, [[-R - 5, -R - 5, -6], [R + 5, R + 5, -6], [-R - 5, -R - 5, 2 + (N - 1) * STEP + T + 40], [R + 5, R + 5, 2 + (N - 1) * STEP + T + 40]], 200, 166);
  const P = proj(C), front = facing(C);
  const disc = (r, c) => rrect(-r + c, -r + c, r + c, r + c, r, 14);

  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, disc(R + 5, 0), disc(R + 3, 0), -6, 2));

  const layers = [];
  for (let i = 0; i < N; i++) {
    const off = i === 1 ? K / 2 : 0;
    const dots = CELLS.map(([x, y]) => ({ x: x + off, y: y - off, el: flatDot(g, C, 0.9, "dot off") }));
    const plate = solid(g);
    layers.push({ plate, dots, z: tween(0), drawn: NaN });
    // each sieve is a plate with its mesh drawn on it, so the dots follow the plate
    g.insertBefore(plate.g, dots[0].el);
  }
  const mark = layers[1].dots[10].el;
  mark.setAttribute("class", "dot");

  function draw(i, lift) {
    const L = layers[i];
    if (lift === L.drawn) return;
    L.drawn = lift;
    const z0 = 2 + i * STEP + lift, z1 = z0 + T;
    put(L.plate, prism(P, front, disc(R, 0), disc(R - 1.6, 0), z0, z1));
    L.dots.forEach((d) => place(d.el, P(d.x, d.y, z1)));
  }

  const B = register(stage, (_dt, now) => {
    let m = false;
    layers.forEach((L, i) => { draw(i, tval(L.z, now)); if (!tdone(L.z, now)) m = true; });
    return m;
  });
  bag.add(B.unregister);

  // hit: the rest height of every sieve, on screen
  const ys = layers.map((_, i) => P(0, 0, 2 + i * STEP + T / 2)[1]);
  const hit = ([x, y]) => {
    if (x < 70 || x > 330 || y < ys[N - 1] - 50 || y > ys[0] + 40) return -1;
    let a = 0;
    ys.forEach((v, i) => { if (Math.abs(y - v) < Math.abs(y - ys[a])) a = i; });
    return a;
  };

  let act = -2;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : Math.max(act, 0);
    act = a;
    layers.forEach((L, i) => {
      tset(L.z, a >= 0 && i > a ? gap * (i - a) : 0, now, Math.abs(i - from) * STAG);
      L.plate.sil.classList.toggle("hi", a >= 0 && i === a);
      L.dots.forEach((d) => { if (d.el !== mark) d.el.setAttribute("class", "dot " + (a >= 0 && i === a ? "m" : "off")); });
    });
    mark.setAttribute("class", a < 0 || a === 1 ? "dot" : "dot m");
    read.textContent = a < 0 ? "rest" : "mesh " + (a + 1);
    B.wake();
  }
  setActive(-1);

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { gap = v; act = -2; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "sito",
  means: "Three sieves stacked over a pan: the one under the pointer is opened up as the sieves above it lift away.",
  rules: [1, 3, 4, 8],
  range: [9, 14, 20],
  tour: [[200, 230], [200, 175], [200, 120], null],
  mount,
});
