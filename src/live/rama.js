'use strict';
// The shared skeleton, Rama's body and everything he wears and carries.
// ---------- skeleton (rest pose: arms out at 45 degrees) ----------
const REST = {
  hips: [null, 0, 0.96, 0],
  spine: ['hips', 0, 1.1, 0],
  chest: ['spine', 0, 1.28, 0],
  neck: ['chest', 0, 1.47, 0],
  head: ['neck', 0, 1.56, 0],
  armL: ['chest', 0.19, 1.43, 0],
  foreL: ['armL', 0.38, 1.24, 0],
  handL: ['foreL', 0.56, 1.06, 0],
  armR: ['chest', -0.19, 1.43, 0],
  foreR: ['armR', -0.38, 1.24, 0],
  handR: ['foreR', -0.56, 1.06, 0],
  legL: ['hips', 0.09, 0.95, 0],
  shinL: ['legL', 0.1, 0.5, 0],
  footL: ['shinL', 0.1, 0.075, 0],
  legR: ['hips', -0.09, 0.95, 0],
  shinR: ['legR', -0.1, 0.5, 0],
  footR: ['shinR', -0.1, 0.075, 0],
  tgtL: [null, 0.56, 1.06, 0],
  tgtR: [null, -0.56, 1.06, 0],
};
// `rama` and `bone` (and the bow, eyes and nocked arrow further down) are `let`: once a second archer exists, they point at whichever brother is being updated
let rama = new THREE.Group(),
  bone = {};
const bones = [],
  BI = {};
for (const [name, [par, x, y, z]] of Object.entries(REST)) {
  const b = new THREE.Bone();
  b.name = name;
  const p = par ? REST[par] : [0, 0, 0, 0];
  b.position.set(x - p[1], y - p[2], z - p[3]);
  (par ? bone[par] : rama).add(b);
  bone[name] = b;
  BI[name] = bones.length;
  bones.push(b);
}
rama.updateMatrixWorld(true);
const skeleton = new THREE.Skeleton(bones);
const R3 = (n) => REST[n].slice(1);
const SEG = [
  ['hips', [0, 0.9, 0], [0, 1.04, 0], 0],
  ['spine', [0, 1.07, 0], [0, 1.24, 0], 0],
  ['chest', [0, 1.27, 0], [0, 1.44, 0], 0],
  ['chest', [-0.13, 1.41, 0], [0.13, 1.41, 0], 0],
  ['neck', [0, 1.48, 0], [0, 1.55, 0], 0],
  ['head', [0, 1.58, 0], [0, 1.78, 0], 0],
];
for (const [s, sg] of [
  ['L', 1],
  ['R', -1],
]) {
  const hd = R3('hand' + s),
    ft = R3('foot' + s);
  SEG.push(
    ['arm' + s, R3('arm' + s), R3('fore' + s), sg],
    ['fore' + s, R3('fore' + s), hd, sg],
    ['hand' + s, hd, [hd[0] + sg * 0.1, hd[1] - 0.1, 0], sg],
    ['leg' + s, R3('leg' + s), R3('shin' + s), sg],
    ['shin' + s, R3('shin' + s), ft, sg],
    ['foot' + s, ft, [ft[0], 0.03, 0.15], sg],
  );
}
function skinned(geo, mat) {
  // weight every vertex to its nearest bones, then bind to the shared skeleton
  const p = geo.attributes.position,
    n = p.count,
    si = new Uint16Array(n * 4),
    sw = new Float32Array(n * 4),
    w = new Float32Array(bones.length);
  for (let i = 0; i < n; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    w.fill(0);
    for (const [name, a, b, side] of SEG) {
      if (side && x * side < -0.015) continue;
      const bx = b[0] - a[0],
        by = b[1] - a[1],
        bz = b[2] - a[2],
        px = x - a[0],
        py = y - a[1],
        pz = z - a[2];
      let h = (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz);
      h = h < 0 ? 0 : h > 1 ? 1 : h;
      const d2 = (px - bx * h) ** 2 + (py - by * h) ** 2 + (pz - bz * h) ** 2;
      let v = 1 / (d2 + 0.0005) ** 2;
      if (name.startsWith('arm')) {
        // the upper arm has no hold on the chest: its pull fades out from the shoulder inwards and is gone by the middle of each breast.
        // Otherwise the chest is dragged sideways and looks longer whenever an arm is raised or drawn back
        const t = Math.min(1, Math.max(0, (Math.abs(x) - 0.13) / 0.07));
        v *= t * t * (3 - 2 * t);
      }
      if (v > w[BI[name]]) w[BI[name]] = v;
    }
    let tot = 0;
    for (let k = 0; k < 4; k++) {
      let best = 0;
      for (let j = 1; j < w.length; j++) if (w[j] > w[best]) best = j;
      si[i * 4 + k] = best;
      sw[i * 4 + k] = w[best];
      tot += w[best];
      w[best] = 0;
    }
    for (let k = 0; k < 4; k++) sw[i * 4 + k] /= tot;
  }
  geo.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
  const m = new THREE.SkinnedMesh(geo, mat);
  m.castShadow = m.receiveShadow = true;
  m.frustumCulled = false;
  rama.add(m);
  m.bind(skeleton, new THREE.Matrix4());
  return m;
}
// cloth: each leg's cloth follows only its own leg, so nothing stretches across the lap when the legs fold
const BNAME = [];
for (const k in BI) BNAME[BI[k]] = k;
const GAP = (x, y) => 0.013 - Math.max(0, y - 0.84) * 0.5 - Math.abs(x);
// things worn on the chest follow the torso only. Left to the automatic weights, the parts nearest a shoulder also follow that arm,
// and are dragged out of place when the arm is raised or pulled back to draw the bow
function torsoOnly(geo) {
  const si = geo.attributes.skinIndex,
    sw = geo.attributes.skinWeight;
  for (let i = 0; i < si.count; i++) {
    let tot = 0;
    const w = [];
    for (let k = 0; k < 4; k++) {
      const v = /^(arm|fore|hand)/.test(BNAME[si.getComponent(i, k)]) ? 0 : sw.getComponent(i, k);
      w.push(v);
      tot += v;
    }
    if (tot < 1e-6) {
      // nothing but arm: pin it to the chest
      si.setXYZW(i, BI.chest, 0, 0, 0);
      sw.setXYZW(i, 1, 0, 0, 0);
    } else for (let k = 0; k < 4; k++) sw.setComponent(i, k, w[k] / tot);
  }
  return geo;
}
function unlap(geo) {
  const p = geo.attributes.position,
    si = geo.attributes.skinIndex,
    sw = geo.attributes.skinWeight;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      keep = Math.min(1, Math.max(0, (p.getY(i) - 0.86) / 0.1)),
      opp = x > 0 ? 'R' : 'L';
    let tot = 0;
    const w = [];
    for (let k = 0; k < 4; k++) {
      const n = BNAME[si.getComponent(i, k)];
      let v = sw.getComponent(i, k);
      if (/^(leg|shin|foot)/.test(n) && n.endsWith(opp)) v *= keep;
      w.push(v);
      tot += v;
    }
    for (let k = 0; k < 4; k++) sw.setComponent(i, k, w[k] / tot);
  }
  return geo;
}
const onBone = (name, obj, world) => {
  const r = R3(name);
  obj.position.set(world[0] - r[0], world[1] - r[1], world[2] - r[2]);
  bone[name].add(obj);
  return obj;
};
const ringOn = (name, a, b, t, rad, tube, mat) => {
  const m = new THREE.Mesh(new THREE.TorusGeometry(rad, tube, 10, 30), mat);
  m.castShadow = true;
  m.quaternion.setFromUnitVectors(V3(0, 0, 1), V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize());
  return onBone(name, m, L3(a, b, t));
};

// ---------- Rama ----------
const SKIN = toon(0x5a92ea, { vertexColors: true, rim: 0.34 }),
  SKINP = toon(0x5a92ea, { rim: 0.34 });
const K = 0.03,
  P = [],
  legP = [];
for (const s of ['L', 'R']) {
  const sg = s === 'L' ? 1 : -1,
    sh = R3('arm' + s),
    el = R3('fore' + s),
    wr = R3('hand' + s),
    hp = R3('leg' + s),
    kn = R3('shin' + s),
    an = R3('foot' + s),
    bi = L3(sh, el, 0.42),
    fm = L3(el, wr, 0.28),
    cf = L3(kn, an, 0.3);
  bi[2] += 0.01;
  cf[2] -= 0.016;
  P.push(
    ['c', sh, el, 0.058, 0.045, K],
    ['e', bi, [0.062, 0.062, 0.048], 0.02],
    ['c', el, fm, 0.046, 0.05, K],
    ['c', fm, wr, 0.05, 0.032, K],
    ['e', sh, [0.066, 0.06, 0.062], K],
    ['c', [0, 1.5, -0.02], [sh[0] * 0.92, sh[1] + 0.02, 0], 0.042, 0.05, 0.04],
    ['e', [wr[0] + sg * 0.045, wr[1] - 0.045, 0.004], [0.04, 0.04, 0.026], 0.02],
    ['c', [wr[0] + sg * 0.05, wr[1] - 0.05, 0.01], [wr[0] + sg * 0.095, wr[1] - 0.095, 0.014], 0.03, 0.02, 0.015],
    ['c', [wr[0] + sg * 0.03, wr[1] - 0.03, 0.02], [wr[0] + sg * 0.05, wr[1] - 0.085, 0.045], 0.014, 0.011, 0.012],
  );
  legP.push(
    ['c', hp, kn, 0.09, 0.062, K],
    ['c', kn, cf, 0.06, 0.066, K],
    ['c', cf, an, 0.066, 0.038, K],
    ['e', [an[0], 0.04, an[2] + 0.07], [0.047, 0.037, 0.11], 0.02],
  );
}
const pelP = [
  ['e', [0, 0.97, 0], [0.165, 0.12, 0.108], K],
  // the seat: kept slim, about 2.5 cm shallower at the back than it was
  ['e', [-0.08, 0.935, -0.048], [0.082, 0.08, 0.062], K],
  ['e', [0.08, 0.935, -0.048], [0.082, 0.08, 0.062], K],
];
P.push(
  ...legP,
  ...pelP,
  ['e', [0, 1.12, 0.005], [0.138, 0.17, 0.1], K],
  ['e', [0, 1.31, 0], [0.17, 0.17, 0.112], K],
  ['e', [-0.085, 1.365, 0.07], [0.086, 0.06, 0.044], 0.025],
  ['e', [0.085, 1.365, 0.07], [0.086, 0.06, 0.044], 0.025],
  ['c', [0, 1.46, -0.01], [0, 1.62, 0], 0.054, 0.05, K],
);
const bodyF = field(P),
  lowerF = field([...legP, ...pelP]);
skinned(sculpt(bodyF, [-0.74, -0.01, -0.22], [0.74, 1.64, 0.26], 0.0095), SKIN);
// dhoti grown from the legs, with a woven border
const clothF = (x, y, z) => {
  const ax = x < 0 ? -0.1 : 0.1,
    fold = Math.sin(Math.atan2(z, x - ax) * 9 + y * 14) * 0.006 * Math.min(1, (1.03 - y) * 4);
  return Math.max(lowerF(x, y, z) - 0.024 - fold, y - 1.035, 0.37 - y, GAP(x, y));
};
const dhotiGeo = unlap(
  skinned(
    sculpt(clothF, [-0.3, 0.35, -0.22], [0.3, 1.05, 0.22], 0.0085, (x, y) =>
      y < 0.395 ? [1.35, 0.95, 0.3] : y > 0.408 && y < 0.424 ? [0.8, 0.14, 0.16] : [1, 1, 1],
    ),
    toon(0xb5601a, { vertexColors: true }),
  ).geometry,
);
// sash and sacred thread, skinned so they bend with the torso
const chestPath = (pts, lift) => pts.map(([x, y]) => [x, y, surfZ(bodyF, x, y) + lift]);
const chestPathN = (pts, lift) =>
  pts.map(([x, y]) => {
    const e = 0.004,
      z = surfZ(bodyF, x, y),
      nx = -(surfZ(bodyF, x + e, y) - surfZ(bodyF, x - e, y)) / (2 * e),
      ny = -(surfZ(bodyF, x, y + e) - surfZ(bodyF, x, y - e)) / (2 * e),
      l = Math.hypot(nx, ny, 1);
    return [x + (nx / l) * lift, y + (ny / l) * lift, z + lift / l];
  });
// things worn across the chest are laid on the body point by point: the line is sampled densely and every vertex of a ribbon is set on the surface under it and lifted along the surface normal, so nothing cuts across a curve of the chest
const dense = (pts, n = 28) => {
  const cv = new THREE.CatmullRomCurve3(pts.map(([x, y]) => V3(x, y, 0)));
  return Array.from({ length: n + 1 }, (_, i) => {
    const q = cv.getPoint(i / n);
    return [q.x, q.y];
  });
};
function strip(pts, w, lift, cols = 4) {
  const n = pts.length - 1,
    at = [],
    idx = [];
  for (let i = 0; i <= n; i++) {
    const a = pts[Math.max(0, i - 1)],
      b = pts[Math.min(n, i + 1)],
      l = Math.hypot(b[0] - a[0], b[1] - a[1]),
      sx = (((b[1] - a[1]) / l) * w) / 2,
      sy = ((-(b[0] - a[0]) / l) * w) / 2;
    for (let j = 0; j <= cols; j++) {
      const u = (j / cols) * 2 - 1;
      at.push([pts[i][0] + sx * u, pts[i][1] + sy * u]);
      if (i < n && j < cols) {
        const q = i * (cols + 1) + j;
        idx.push(q, q + 1, q + cols + 1, q + 1, q + cols + 2, q + cols + 1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(chestPathN(at, lift).flat(), 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const chestFrom = rama.children.length; // the scarf, its border, the sacred thread and the collar are made from here on
skinned(
  strip(
    dense([
      [0.15, 1.46],
      [0.09, 1.37],
      [-0.01, 1.24],
      [-0.09, 1.11],
      [-0.13, 1.03],
    ]),
    0.1,
    0.011,
    5,
  ),
  toon(0xead6a4),
);
skinned(
  strip(
    dense([
      [0.18, 1.475],
      [0.12, 1.39],
      [0.02, 1.26],
      [-0.06, 1.13],
      [-0.1, 1.05],
    ]),
    0.02,
    0.016,
    2,
  ),
  GOLD,
);
skinned(
  new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(
      chestPathN(
        dense([
          [-0.15, 1.45],
          [-0.06, 1.33],
          [0.04, 1.18],
          [0.12, 1.06],
        ]),
        0.0075,
      ).map((q) => V3(...q)),
    ),
    64,
    0.004,
    6,
  ),
  toon(0xfff1d8),
);
// rigid ornaments ride on single bones
{
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const t = -1.35 + (i / 16) * 2.7;
    pts.push([Math.sin(t) * 0.098, 1.475 - Math.cos(t) * 0.085]);
  }
  skinned(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(chestPathN(pts, 0.015).map((q) => V3(...q))), 64, 0.0095, 8), GOLD);
} // collar resting on the chest surface, clear of the skin
for (const m of rama.children.slice(chestFrom)) if (m.isSkinnedMesh) torsoOnly(m.geometry);
{
  const b = onBone('hips', new THREE.Mesh(new THREE.TorusGeometry(0.154, 0.02, 10, 36), GOLD), [0, 1.025, 0.004]);
  b.rotation.x = Math.PI / 2;
  b.scale.set(1, 0.74, 1);
  onBone('hips', new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 12), gem(0xff3a4a)), [0, 1.025, 0.12]);
}
{
  const pl = onBone('hips', new THREE.Group(), [0, 1.0, 0.12]);
  lathe(
    pl,
    [
      [0.03, 0],
      [0.05, -0.2],
      [0.085, -0.5],
      [0.07, -0.52],
    ],
    toon(0x8a1c2a),
    [0, 0, 0],
    [-0.1, 0, 0],
    [1, 1, 0.3],
  );
}
for (const s of ['L', 'R']) {
  const sh = R3('arm' + s),
    el = R3('fore' + s),
    wr = R3('hand' + s),
    kn = R3('shin' + s),
    an = R3('foot' + s);
  ringOn('arm' + s, sh, el, 0.45, 0.06, 0.012, GOLD);
  ringOn('fore' + s, el, wr, 0.84, 0.04, 0.008, GOLD);
  ringOn('fore' + s, el, wr, 0.93, 0.037, 0.008, GOLD);
  ringOn('shin' + s, kn, an, 0.86, 0.048, 0.009, GOLD);
  ringOn('shin' + s, kn, an, 0.78, 0.052, 0.007, GOLD);
}
{
  const q = onBone('chest', new THREE.Group(), [-0.1, 1.37, -0.15]);
  q.rotation.set(0.12, 0, 0.5);
  cyl(q, 0.05, 0.036, 0.44, toon(0x8a1c2a));
  for (const y of [0.2, 0.05, -0.19]) tor(q, 0.047 - (0.2 - y) * 0.022, 0.008, GOLD, [0, y, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * 0.02;
    cyl(q, 0.005, 0.005, 0.2, WOOD, [x, 0.3, (i % 2) * 0.02 - 0.01]);
    add(q, new THREE.ConeGeometry(0.016, 0.07, 4), toon(i % 2 ? 0xead6a4 : 0xe8a030), [x, 0.39, (i % 2) * 0.02 - 0.01], [0, 0.6, 0], [1, 1, 0.3]);
  }
}
let lids = [],
  eyeBits = [];
// head: rigid, rides the head bone
{
  const head = onBone('head', new THREE.Group(), [0, 1.725, 0.012]);
  head.scale.setScalar(1.06);
  const hair = toon(0x15101c, { rim: 0.22 });
  sph(head, 0.12, SKINP, [0, 0, 0], [0.94, 1.12, 1.02]);
  sph(head, 0.092, SKINP, [0, -0.072, 0.02], [0.94, 0.92, 1]);
  cyl(head, 0.0075, 0.0125, 0.052, SKINP, [0, -0.005, 0.1255], [-0.235, 0, 0], [0.95, 1, 1]);
  sph(head, 0.0135, SKINP, [0, -0.034, 0.1325], [1, 0.82, 0.9]);
  sph(head, 0.018, toon(0x6a3a6a), [0, -0.08, 0.103], [1.5, 0.42, 0.6]);
  sph(head, 0.016, toon(0x7a467a), [0, -0.09, 0.101], [1.25, 0.5, 0.6]);
  for (const s of [-1, 1]) {
    sph(head, 0.0095, SKINP, [s * 0.013, -0.041, 0.1195], [1, 0.8, 1.15]);
    sph(head, 0.024, new THREE.MeshBasicMaterial({ color: 0xf6efe2 }), [s * 0.047, 0.012, 0.098], [1.3, 0.62, 0.5]);
    eyeBits.push(
      sph(head, 0.0125, DARK, [s * 0.049, 0.01, 0.109], [1, 1, 0.5]),
      sph(head, 0.003, new THREE.MeshBasicMaterial({ color: 0xffffff }), [s * 0.049 + 0.004, 0.015, 0.1155]),
    );
    sph(head, 0.027, SKINP, [s * 0.047, 0.026, 0.094], [1.32, 0.42, 0.55]);
    {
      const lid = sph(head, 0.0265, SKINP, [s * 0.047, 0.012, 0.103], [1.32, 0.68, 0.5]);
      lid.visible = false;
      lids.push(lid);
      const lash = add(head, new THREE.BoxGeometry(0.05, 0.004, 0.004), DARK, [s * 0.047, 0.003, 0.1145], [0, s * -0.25, 0]);
      lash.visible = false;
      lids.push(lash);
    }
    add(head, new THREE.BoxGeometry(0.06, 0.014, 0.012), hair, [s * 0.047, 0.05, 0.103], [0, s * -0.3, s * -0.14]);
    sph(head, 0.03, SKINP, [s * 0.113, -0.005, 0], [0.5, 1, 0.8]);
    tor(head, 0.022, 0.0065, GOLD, [s * 0.122, -0.052, 0], [0, Math.PI / 2, 0]);
  }
  add(head, new THREE.SphereGeometry(0.128, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.56), hair, [0, 0.012, -0.012], [-0.42, 0, 0], [0.96, 1.1, 1.04]);
  lathe(
    head,
    [
      [0.106, 0.03],
      [0.112, -0.04],
      [0.092, -0.1],
      [0.06, -0.125],
    ],
    hair,
    [0, 0, -0.062],
    [0.12, 0, 0],
    [1.02, 1, 0.66],
  );
  sph(head, 0.04, hair, [0, 0.15, -0.06], [1, 0.9, 1]);
  tor(head, 0.03, 0.008, GOLD, [0, 0.125, -0.055], [Math.PI / 2 + 0.3, 0, 0]);
  add(head, new THREE.BoxGeometry(0.012, 0.05, 0.006), gem(0xff3a4a), [0, 0.058, 0.119], [-0.2, 0, 0]);
}
rama.scale.setScalar(0.95);
scene.add(rama);
// bow, string and arrows live in the world and are placed from the hands each frame
let bow = new THREE.Group();
scene.add(bow);
{
  const bc = new THREE.CatmullRomCurve3(
    [
      [-0.21, -0.88],
      [-0.13, -0.81],
      [0.01, -0.5],
      [0.04, -0.2],
      [0, 0],
      [0.04, 0.2],
      [0.01, 0.5],
      [-0.13, 0.81],
      [-0.21, 0.88],
    ].map((p) => V3(0, p[1], p[0])),
  );
  add(bow, new THREE.TubeGeometry(bc, 70, 0.016, 10), toon(0x9a5a22, { rim: 0.7 }));
  cyl(bow, 0.023, 0.023, 0.16, GOLD);
  for (const s of [-1, 1]) {
    sph(bow, 0.022, GOLD, [0, s * 0.88, -0.21], [1, 1.6, 1]);
    tor(bow, 0.019, 0.005, GOLD, [0, s * 0.5, 0.01], [Math.PI / 2, 0, 0]);
  }
}
let strGeo = new THREE.BufferGeometry().setFromPoints([V3(0, 0.88, -0.21), V3(0, 0, -0.21), V3(0, -0.88, -0.21)]);
bow.add(new THREE.Line(strGeo, new THREE.LineBasicMaterial({ color: 0xffe9c0 })));
function makeArrow() {
  const g = new THREE.Group();
  cyl(g, 0.006, 0.006, 0.78, WOOD, [0, 0, 0.39], [Math.PI / 2, 0, 0]);
  add(g, new THREE.ConeGeometry(0.018, 0.07, 6), GOLD, [0, 0, 0.8], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 3; i++) add(g, new THREE.BoxGeometry(0.045, 0.004, 0.1), toon(0xe8a030), [0, 0, 0.06], [0, 0, i * 1.05]);
  const gl = glow(0xffffff, 0.6);
  gl.position.z = 0.78;
  gl.visible = false;
  g.add(gl);
  g.userData.glow = gl;
  scene.add(g);
  return g;
}
let nock = makeArrow();
const shots = [];
