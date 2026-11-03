/**
 * Akta: a stack of five case files, each with its own tab. The pointer's
 * height picks a file; the files above it lift away in turn and the picked one
 * takes the bright edge. At rest the stack is a little crooked and the top
 * file is bright. The slider is the stagger, in ms.
 *
 * The pattern: one of many, on a vertical stack. Tweens, a stagger by
 * distance, and a hit test on the rest pose of every file.
 */
const {
  Cam, clamp, facing, fit, prism, proj, put, rings, seg, solid,
  tdone, tset, tval, tween, disposer, mk, pointer, register,
} = HL;

const N = 5, W = 66, D = 46, T = 5, STEP = 6.6, UP = 26;
const DX = [0, 4, -3, 3, -1], TAB = [8, 28, 46, 18, 36];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;
  const C = Cam(45, 0.5, 2.3);
  fit(C, [[-9, -11, -4], [W + 11, D + 7, -4], [W + 11, -11, -4], [-9, D + 7, -4], [-9, -11, N * STEP + UP + T], [W + 11, D + 7, N * STEP + UP + T]], 200, 168);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [br, bi] = rings(-9, -11, W + 11, D + 7, 7, 1.8);
  put(solid(g), prism(P, front, br, bi, -4, 0));

  const files = [];
  for (let i = 0; i < N; i++) {
    const [ring, inner] = rings(DX[i], 0, DX[i] + W, D, 3, 1);
    const [tr, ti] = rings(DX[i] + TAB[i], -6, DX[i] + TAB[i] + 17, 2, 2.2, 0.8);
    const tab = solid(g), body = solid(g);
    const fold = mk("path", { class: "nf lo" }, g);
    files.push({ ring, inner, tr, ti, tab, body, fold, z: tween(0), drawn: NaN });
  }

  function draw(i, lift) {
    const f = files[i];
    if (lift === f.drawn) return;
    f.drawn = lift;
    const z0 = i * STEP + lift, z1 = z0 + T;
    put(f.tab, prism(P, front, f.tr, f.ti, z0, z1 - 1.6));
    put(f.body, prism(P, front, f.ring, f.inner, z0, z1));
    f.fold.setAttribute("d", seg(P(DX[i] + 7, D - 9, z1), P(DX[i] + W - 7, D - 9, z1)));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    files.forEach((f, i) => { draw(i, tval(f.z, now)); if (!tdone(f.z, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  // hit: the rest height of every file, on screen; the stack never moves under the pointer
  const ys = files.map((_, i) => P(W / 2, D / 2, i * STEP + T / 2)[1]);
  const hit = ([x, y]) => {
    if (x < 70 || x > 330 || y < ys[N - 1] - 34 || y > ys[0] + 34) return -1;
    let a = 0;
    ys.forEach((v, i) => { if (Math.abs(y - v) < Math.abs(y - ys[a])) a = i; });
    return a;
  };

  let act = -2;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : Math.max(act, 0);
    act = a;
    files.forEach((f, i) => {
      tset(f.z, a >= 0 && i > a ? UP : 0, now, Math.abs(i - from) * stag);
      f.body.sil.classList.toggle("hi", a >= 0 ? i === a : i === N - 1);
    });
    read.textContent = a < 0 ? "rest" : "file " + String(a + 1).padStart(2, "0");
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
  name: "akta",
  means: "Five case files in a stack: the one under the pointer is pulled free as the files above it lift away.",
  rules: [1, 2, 5, 8],
  range: [0, 40, 90],
  tour: [[200, 220], [200, 160], [200, 110], null],
  mount,
});
