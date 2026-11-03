/**
 * Sejf: a strongbox with its lid ajar and one document leaning out. As the
 * pointer comes near, the lid slides down and the documents drop out of
 * sight; the lock plate takes the bright edge. Leave and it opens again.
 * The slider is how far away the box starts to close, in world units.
 *
 * The pattern: proximity. One spring for the lid, one for the documents.
 */
const {
  Cam, clamp, facing, fit, prism, proj, put, rings, rrect, ringAt, poly, solid, spring, stepS, unproj,
  disposer, mk, pointer, register,
} = HL;

const W = 76, D = 52, H = 30, LID = 6, AJAR = 13;
const DOCS = [[11, 15, 11], [22, 19, 9], [33, 13, 6]];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let R = value, over = null;
  const C = Cam(45, 0.5, 2.3);
  fit(C, [[-8, -8, -4], [W + 8, D + 8, -4], [-8, -8, H + LID + AJAR + 12], [W + 8, D + 8, H + LID + AJAR + 12]], 200, 166);
  const P = proj(C), front = facing(C);
  const lid = spring(AJAR, { eps: 0.05 }), doc = spring(1, { eps: 0.01 });

  const g = mk("g", {}, svg);
  const [br, bi] = rings(0, 0, W, D, 6, 1.8);
  put(solid(g), prism(P, front, br, bi, 0, H));
  mk("path", { d: poly(ringAt(P, rrect(6, 6, W - 6, D - 6, 3, 6), H)), class: "nf lo" }, g);

  // documents standing in the box; the middle one stands highest
  const docs = DOCS.map(([x, h, y]) => {
    const [r, i] = rings(x + 8, y + 4, x + 8 + 36, y + 4 + 1.8, 0.8, 0.4);
    return { r, i, h, el: solid(g) };
  });
  const lidEl = solid(g), plate = solid(g);
  let last = "";

  function draw() {
    const o = Math.max(0, lid.x), d = doc.x, key = o.toFixed(2) + d.toFixed(2);
    if (key === last) return;
    last = key;
    docs.forEach((k) => put(k.el, prism(P, front, k.r, k.i, H, H + 1 + k.h * d)));
    const s = o * 0.7, [lr, li] = rings(0, -s, W, D - s, 6, 1.8);
    put(lidEl, prism(P, front, lr, li, H + o, H + o + LID));
    const [pr, pi] = rings(W / 2 - 7, D - 15 - s, W / 2 + 7, D - 7 - s, 2.4, 0.8);
    put(plate, prism(P, front, pr, pi, H + o + LID, H + o + LID + 2));
  }

  const B = register(stage, (dt) => {
    const m = [stepS(lid, dt), stepS(doc, dt)].some(Boolean);
    draw();
    const shut = lid.x < 1.5;
    plate.sil.classList.toggle("hi", shut);
    docs[1].el.sil.classList.toggle("hi", !shut && lid.x > 6);
    return m;
  });
  bag.add(B.unregister);

  function retarget() {
    const d = over ? Math.hypot(over[0] - W / 2, over[1] - D / 2) : Infinity;
    const f = clamp(d / R, 0, 1);
    lid.t = AJAR * f * f;
    doc.t = f * f;
    read.textContent = over ? (f < 0.25 ? "shut" : "closing") : "rest";
    B.wake();
  }
  retarget();

  bag.add(pointer(stage, {
    move: (p) => { over = unproj(C, p[0], p[1], 0); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v; if (over) retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "sejf",
  means: "A strongbox with its lid ajar: as the pointer nears, the lid slides shut and the documents drop out of sight.",
  rules: [3, 4, 5, 8],
  range: [60, 100, 150],
  tour: [[110, 120], [200, 170], [280, 220], null],
  mount,
});
