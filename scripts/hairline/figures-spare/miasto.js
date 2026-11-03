/**
 * Miasto: nine office towers on a plinth, each with a setback crown. The
 * pointer is projected onto the ground and the towers near it rise, each on
 * its own spring. At rest the skyline is uneven and its tallest tower is
 * bright. The slider is the radius of the rise, in cells.
 *
 * The pattern: a field, as in Terrain, with parts that have a shape of their
 * own (a body and a crown).
 */
const {
  Cam, clamp, facing, fit, prism, proj, put, rings, solid, spring, stepS, unproj,
  disposer, mk, pointer, register,
} = HL;

const N = 3, CELL = 32, FOOT = 23, CROWN = 12, CH = 9, RISE = 30;
const H0 = [14, 26, 12, 30, 18, 38, 10, 22, 16];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let R = value * CELL, over = null;
  const EXT = N * CELL;
  const C = Cam(45, 0.5, 1.85);
  fit(C, [[-6, -6, -5], [EXT + 6, EXT + 6, -5], [EXT + 6, -6, -5], [-6, EXT + 6, -5], [0, 0, 70], [EXT, EXT, 70]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [pr, pi] = rings(-6, -6, EXT + 6, EXT + 6, 9, 2.2);
  put(solid(g), prism(P, front, pr, pi, -5, 0));

  // diagonal by diagonal from the far corner, so appending is painting back to front
  const towers = [];
  for (let s = 0; s <= 2 * (N - 1); s++) for (let i = 0; i < N; i++) {
    const j = s - i;
    if (j < 0 || j >= N) continue;
    const x0 = i * CELL + (CELL - FOOT) / 2, y0 = j * CELL + (CELL - FOOT) / 2, o = (FOOT - CROWN) / 2;
    const [ring, inner] = rings(x0, y0, x0 + FOOT, y0 + FOOT, 3, 1);
    const [cr, ci] = rings(x0 + o, y0 + o, x0 + o + CROWN, y0 + o + CROWN, 2.2, 0.8);
    towers.push({ i, j, h0: H0[i * N + j], ring, inner, cr, ci, body: solid(g), crown: solid(g), sp: spring(H0[i * N + j], { eps: 0.04 }), drawn: NaN });
  }
  const tall = towers.reduce((a, b) => (b.h0 > a.h0 ? b : a));

  function draw(t) {
    const h = Math.max(1, t.sp.x);
    if (h === t.drawn) return;
    t.drawn = h;
    put(t.body, prism(P, front, t.ring, t.inner, 0, h));
    put(t.crown, prism(P, front, t.cr, t.ci, h, h + CH));
  }

  let lit = null;
  const B = register(stage, (dt) => {
    let m = false;
    for (const t of towers) { if (stepS(t.sp, dt)) m = true; draw(t); }
    return m;
  });
  bag.add(B.unregister);

  function retarget() {
    let pick = tall;
    if (over) {
      const i = clamp(Math.floor(over[0] / CELL), 0, N - 1), j = clamp(Math.floor(over[1] / CELL), 0, N - 1);
      pick = towers.find((t) => t.i === i && t.j === j);
    }
    for (const t of towers) {
      if (!over) { t.sp.t = t.h0; continue; }
      const u = Math.hypot((t.i + 0.5) * CELL - over[0], (t.j + 0.5) * CELL - over[1]) / R;
      t.sp.t = t.h0 + RISE * (u >= 1 ? 0 : (1 - u) * (1 - u));
    }
    if (pick !== lit) {
      if (lit) lit.body.sil.classList.remove("hi");
      lit = pick;
      lit.body.sil.classList.add("hi");
    }
    read.textContent = over ? `tower ${pick.i}·${pick.j}` : "rest";
    B.wake();
  }
  retarget();

  bag.add(pointer(stage, {
    move: (p) => { over = unproj(C, p[0], p[1], 0); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v * CELL; if (over) retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "miasto",
  means: "Nine towers with setback crowns: the ones near the pointer rise, the farther the less.",
  rules: [1, 3, 5, 9],
  range: [1.2, 2, 3.2],
  tour: [[150, 170], [250, 170], [200, 220], null],
  mount,
});
