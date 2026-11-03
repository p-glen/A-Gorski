/**
 * Bramki: five checkpoints along a road, each a pair of posts with a boom
 * barrier between them. The checkpoint under the pointer raises its barrier,
 * and its neighbours settle, staggered outwards. At rest the barriers sit at
 * different heights and the middle one is half open and bright. The slider is
 * the stagger, in ms.
 *
 * The pattern: one of many, along a line. Tweens and a hit test on the
 * resting posts.
 */
const {
  Cam, facing, fit, prism, proj, put, rings, solid,
  tdone, tset, tval, tween, disposer, mk, pointer, register,
} = HL;

const N = 5, PITCH = 24, GW = 40, PW = 6, PH = 24, BT = 2.6, OPEN = 19, SHUT = 5;
const REST = [5, 8, 12, 6, 4];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;
  const L = N * PITCH, C = Cam(45, 0.5, 2.35);
  fit(C, [[-GW / 2 - 12, -10, -4], [GW / 2 + 12, L + 2, -4], [-GW / 2 - 12, L + 2, PH + 3], [GW / 2 + 12, -10, PH + 3]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [rr, ri] = rings(-GW / 2 - 12, -10, GW / 2 + 12, L + 2, 7, 1.8);
  put(solid(g), prism(P, front, rr, ri, -4, 0));

  const gates = [];
  for (let i = 0; i < N; i++) {
    const y = i * PITCH + 8, a = -GW / 2, b = GW / 2 - PW;
    const [lr, li] = rings(a, y, a + PW, y + PW, 2, 0.8), [rr2, ri2] = rings(b, y, b + PW, y + PW, 2, 0.8);
    const [br, bi] = rings(a + PW, y + 1.6, b, y + 1.6 + BT, 0.9, 0.4);
    const left = solid(g), bar = solid(g), right = solid(g);
    put(left, prism(P, front, lr, li, 0, PH));
    put(right, prism(P, front, rr2, ri2, 0, PH));
    gates.push({ br, bi, bar, z: tween(REST[i]), drawn: NaN, y });
  }


  function draw(k, z) {
    if (z === k.drawn) return;
    k.drawn = z;
    put(k.bar, prism(P, front, k.br, k.bi, 3 + z, 3 + z + BT));
  }
  const B = register(stage, (_dt, now) => {
    let m = false;
    gates.forEach((k) => { draw(k, tval(k.z, now)); if (!tdone(k.z, now)) m = true; });
    return m;
  });
  bag.add(B.unregister);

  // hit: the rest centre of every checkpoint, on screen
  const cs = gates.map((k) => P(0, k.y + PW / 2, PH / 2));
  const hit = ([x, y]) => {
    let a = -1, best = 70;
    cs.forEach((c, i) => { const d = Math.hypot(x - c[0], y - c[1]); if (d < best) { best = d; a = i; } });
    return a;
  };

  let act = -2;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : Math.max(act, 0);
    act = a;
    gates.forEach((k, i) => {
      const to = a < 0 ? REST[i] : i === a ? OPEN : SHUT;
      tset(k.z, to, now, Math.abs(i - from) * stag);
      k.bar.sil.classList.toggle("hi", a < 0 ? i === 2 : i === a);
    });
    read.textContent = a < 0 ? "rest" : "gate " + (a + 1);
    B.wake();
  }
  setActive(-1);

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "bramki",
  means: "Five checkpoints on a road: the one under the pointer raises its barrier while the others settle.",
  rules: [1, 2, 5, 8],
  range: [0, 45, 100],
  tour: [[130, 120], [200, 170], [270, 215], null],
  mount,
});
