/**
 * Pieczec: a rubber stamp over a ruled sheet. The stamp follows the pointer
 * across the sheet on springs, and presses down onto it; let go and it rises
 * to hover over its resting corner. The base of the stamp is the only bright
 * edge. The slider is how high it hovers, in world units.
 *
 * The pattern: scrub and press. A spring for where, a spring for how high.
 */
const {
  Cam, clamp, facing, fit, poly, prism, proj, put, rings, rrect, seg, solid, spring, stepS, unproj,
  disposer, mk, pointer, register,
} = HL;

const W = 96, D = 70, SH = 2.6, RX = 70, RY = 44;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let hover = value, over = null;
  const C = Cam(45, 0.5, 2.2);
  fit(C, [[-8, -8, -5], [W + 8, D + 8, -5], [W + 8, -8, -5], [-8, D + 8, -5], [W / 2, D / 2, 50]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [dr, di] = rings(-8, -8, W + 8, D + 8, 7, 1.8);
  put(solid(g), prism(P, front, dr, di, -5, 0));
  const [sr, si] = rings(0, 0, W, D, 3, 1);
  put(solid(g), prism(P, front, sr, si, 0, SH));
  const lines = [14, 24, 34].map((y) => seg(P(10, y, SH), P(W - 10 - (y === 34 ? 22 : 0), y, SH))).join("");
  mk("path", { d: lines, class: "nf lo" }, g);
  const spot = mk("path", { class: "nf dash" }, g);

  // the stamp: a disc foot, a neck and a knob, each a rounded solid on the same axis
  const foot = solid(g), neck = solid(g), knob = solid(g);
  const sx = spring(RX), sy = spring(RY), sz = spring(hover);
  const ring = (R) => rrect(-R, -R, R, R, R, 14);
  const parts = [[ring(11), ring(10), 0, 4, foot], [ring(4.4), ring(3.6), 4, 17, neck], [ring(8.4), ring(7.4), 17, 23, knob]];
  let last = "";

  function draw() {
    const x = sx.x, y = sy.x, z = SH + Math.max(0, sz.x);
    const key = [x, y, z].map((v) => v.toFixed(2)).join();
    if (key === last) return;
    last = key;
    for (const [r, inn, a, b, el] of parts) {
      const mv = (q) => q.map((p) => ({ ...p, u: p.u + x, v: p.v + y }));
      put(el, prism(P, front, mv(r), mv(inn), z + a, z + b));
    }
    const ring2 = ring(11).map((p) => P(p.u + x, p.v + y, SH));
    spot.setAttribute("d", poly(ring2));
  }

  const B = register(stage, (dt) => {
    const m = [stepS(sx, dt), stepS(sy, dt), stepS(sz, dt)].some(Boolean);
    draw();
    return m;
  });
  bag.add(B.unregister);

  foot.sil.classList.add("hi");
  function retarget() {
    const p = over && over[0] > -2 && over[0] < W + 2 && over[1] > -2 && over[1] < D + 2;
    sx.t = over ? clamp(over[0], 12, W - 12) : RX;
    sy.t = over ? clamp(over[1], 12, D - 12) : RY;
    sz.t = p ? 0 : hover;
    read.textContent = over ? (p ? "press" : "hover") : "rest";
    B.wake();
  }
  retarget();

  bag.add(pointer(stage, {
    move: (q) => { over = unproj(C, q[0], q[1], SH); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { hover = v; if (!over) { sz.t = v; B.wake(); } },
    destroy: bag.dispose,
  };
}

hairline({
  name: "pieczec",
  means: "A rubber stamp follows the pointer over a ruled sheet and presses down; let go and it lifts away.",
  rules: [3, 4, 5, 8],
  range: [14, 22, 34],
  tour: [[170, 190], [230, 150], [190, 130], null],
  mount,
});
