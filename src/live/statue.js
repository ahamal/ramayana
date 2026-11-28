'use strict';
// Guard statues: dvarapalas, the door-guardians that stand either side of a temple's entrance.
// These are the guardians of a shrine of Vishnu, of the kind called Jaya and Vijaya, and are drawn as that tradition draws
// them. Such a guardian looks much like the god whose door he keeps: calm-faced (though with a guardian's small fangs), in a tall tapering crown (the kirita), with four arms. His two upper hands hold up the discus and the conch.
// One lower hand is raised before his chest with the forefinger up, in warning (tarjani). The other rests on the head of a
// mace that stands on the ground at his side, and he leans on it, his weight on one leg and the other crossed easily over
// it, toe to the ground. He is richly dressed: long-lobed ears with heavy rings, two necklaces, the sacred thread, a band
// under the chest, armlets and bracelets, a jewelled belt, and a dhoti with its pleats hanging before him and its sashes
// at his hips. All of it is one pale warm stone, new-cut.
// He is a wall that fights back. He does not walk. Demons that come near him on foot stop to break him before they go on,
// and while they are at it he turns on his plinth to face one of them, takes up the mace he was leaning on, heaves it up
// over his shoulder, slowly, and brings it down, fast: whatever is under it is struck hard and thrown back. Then the mace
// is set down at his side again. Blows wear him down; at the last he breaks, and what is left is his plinth and rubble.
// (This file comes after the enemies and the heroes. A page makes one with makeStatue and calls statuesUpdate each frame.)
const STATUES = [],
  STAT = {
    hp: 600,
    // how near a demon must be for the statue to turn to it, and to swing at it; how far before him the mace lands, and how
    // wide the blow is; what it does; and how long he rests between blows
    see: 4.6,
    reach: 2.5,
    out: 1.2,
    wide: 1.5,
    dmg: 150,
    rest: 1.1,
    // the blow, in seconds: up, down, held, back
    up: 0.85,
    down: 0.13,
    hold: 0.28,
    back: 0.6,
    // the mace arm at rest, raised and struck: how far the arm is swung forward from hanging, and the mace's own angle on it
    pose: { rest: [0.45, 0.45], up: [2.9, -0.3], hit: [1.0, 0.69] },
  };
function makeStatue(x, z, face = 0) {
  const G = new THREE.Group(),
    top = new THREE.Group(),
    arm = new THREE.Group(),
    mace = new THREE.Group(),
    st = toon(0xc6b79c, { rim: 0.22 }),
    st2 = toon(0x9d8e74, { rim: 0.15 }),
    dk = toon(0x5a5042, { rim: 0.1 }),
    box = (g, w, h, d, m, p, r) => add(g, new THREE.BoxGeometry(w, h, d), m, p, r),
    // a shape turned on a lathe from a list of [radius, height]
    lathe = (g, pts, m, p, sc) => add(g, new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), 28), m, p, [0, 0, 0], sc),
    // a limb from one point to another, thicker at the first
    limb = (g, a, b, r0, r1, m) => {
      const A = V3(...a),
        B = V3(...b),
        c = cyl(g, r1, r0, A.distanceTo(B), m, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]);
      c.quaternion.setFromUnitVectors(V3(0, 1, 0), B.clone().sub(A).normalize());
      sph(g, r1 * 1.05, m, b);
      return c;
    };
  G.position.set(x, groundY(x, z), z);
  scene.add(G);
  // the plinth: a square base and a round lotus seat on it
  box(G, 1.55, 0.26, 1.55, st2, [0, 0.13, 0]);
  lathe(G, [[0.7, 0], [0.74, 0.07], [0.62, 0.13], [0.66, 0.2], [0.6, 0.2], [0, 0.2]], st, [0, 0.26, 0]);
  top.position.y = 0.46;
  top.rotation.y = face;
  G.add(top);
  // He stands in an easy curve: his weight on his left leg, the hip to that side, and his right leg crossed over in front
  // of it with only the toes on the ground
  limb(top, [0.13, 1.0, 0], [0.11, 0.5, 0.02], 0.16, 0.12, st);
  limb(top, [0.11, 0.5, 0.02], [0.1, 0.08, 0.02], 0.12, 0.09, st);
  box(top, 0.2, 0.09, 0.4, st, [0.1, 0.045, 0.1]);
  limb(top, [-0.14, 1.0, 0], [-0.3, 0.52, 0.16], 0.16, 0.12, st);
  limb(top, [-0.3, 0.52, 0.16], [0.02, 0.12, 0.3], 0.12, 0.085, st);
  box(top, 0.17, 0.09, 0.3, st, [0.07, 0.1, 0.4], [0.75, -0.5, 0]);
  for (const [px, py, pz] of [
    [0.1, 0.17, 0.02],
    [0.0, 0.2, 0.28],
  ])
    tor(top, 0.105, 0.028, st2, [px, py, pz], [Math.PI / 2, 0, 0]);
  // the dhoti: close round the hips and thighs, its pleats hanging in a long tongue between his legs, a sash tied in a loop
  // at each hip with its ends falling, and over it a jewelled belt with a round clasp
  lathe(top, [[0.3, 0], [0.35, 0.12], [0.36, 0.3], [0.31, 0.45], [0, 0.45]], st2, [0, 0.62, 0], [1, 1, 0.82]);
  lathe(top, [[0.02, 0], [0.11, 0.05], [0.13, 0.5], [0.09, 0.62], [0, 0.62]], st, [0, 0.36, 0.25], [1, 1, 0.35]);
  for (const s of [-1, 1]) {
    tor(top, 0.11, 0.035, st, [s * 0.36, 0.98, 0.02], [0.2, 0, s * 0.5], [1, 1.2, 1]);
    lathe(top, [[0.01, 0], [0.07, 0.04], [0.05, 0.4], [0, 0.42]], st, [s * 0.4, 0.5, 0.03], [1, 1, 0.4]);
  }
  tor(top, 0.33, 0.045, st, [0, 1.07, 0], [Math.PI / 2, 0, 0], [1, 0.82, 1]);
  sph(top, 0.075, st, [0, 1.07, 0.28], [1, 1, 0.45]);
  for (let i = 0; i < 7; i++) sph(top, 0.022, st2, [Math.sin((i - 3) * 0.36) * 0.33, 1.0, Math.cos((i - 3) * 0.36) * 0.27 + 0.01]);
  // the body, turned as one shape: narrow at the waist, full in the chest, sloping to the neck; with a band under the chest,
  // the sacred thread across it from the left shoulder, and two necklaces, one close and one long
  const body = new THREE.Group();
  body.position.set(0.03, 1.05, 0);
  body.rotation.z = 0.05;
  top.add(body);
  lathe(body, [[0.26, 0], [0.25, 0.1], [0.3, 0.32], [0.37, 0.52], [0.36, 0.62], [0.26, 0.72], [0.12, 0.78], [0.11, 0.9]], st, [0, 0, 0], [1, 1, 0.74]);
  tor(body, 0.3, 0.022, st2, [0, 0.3, 0], [Math.PI / 2, 0, 0], [1, 0.75, 1]);
  {
    const th = new THREE.Group();
    th.position.set(0, 0.38, 0);
    th.rotation.z = -0.65;
    body.add(th);
    tor(th, 0.34, 0.014, st2, [0, 0, 0], [Math.PI / 2, 0, 0], [1, 0.76, 0.66]);
  }
  tor(body, 0.17, 0.03, st2, [0, 0.69, 0.05], [1.25, 0, 0]);
  tor(body, 0.24, 0.018, st2, [0, 0.58, 0.1], [1.05, 0, 0], [1, 1.25, 1]);
  sph(body, 0.04, st2, [0, 0.41, 0.26], [1, 1.2, 0.5]);
  // the head: an oval face, calm, the eyes long and half closed under arched brows, a straight nose, a small full mouth;
  // long ear lobes with a heavy ring in each
  const head = new THREE.Group();
  head.position.set(0, 0.98, 0.01);
  body.add(head);
  sph(head, 0.215, st, [0, 0.12, 0], [0.92, 1.1, 0.96]);
  sph(head, 0.13, st, [0, 0.0, 0.07], [1.05, 0.9, 0.9]);
  cyl(head, 0.016, 0.032, 0.13, st, [0, 0.1, 0.215], [-0.12, 0, 0]);
  sph(head, 0.034, st, [0, 0.04, 0.215], [1.2, 0.7, 0.8]);
  sph(head, 0.045, st2, [0, -0.035, 0.195], [1.25, 0.45, 0.6]);
  for (const s of [-1, 1]) {
    sph(head, 0.05, st2, [s * 0.085, 0.135, 0.17], [1.25, 0.42, 0.5], [0, 0, s * 0.12]);
    sph(head, 0.02, dk, [s * 0.085, 0.13, 0.196], [1.3, 0.5, 0.5]);
    // (and, as so many of the old guardians have, a small fang at each corner of the mouth)
    cyl(head, 0.003, 0.016, 0.055, st, [s * 0.05, -0.058, 0.2], [Math.PI, 0, 0]);
    tor(head, 0.07, 0.011, st2, [s * 0.085, 0.165, 0.17], [0.2, 0, 0], [1, 0.55, 1]).geometry = new THREE.TorusGeometry(0.07, 0.011, 6, 14, Math.PI);
    sph(head, 0.05, st, [s * 0.2, 0.07, -0.01], [0.45, 1.9, 0.8]);
    tor(head, 0.062, 0.022, st2, [s * 0.215, -0.07, 0], [0, Math.PI / 2, 0]);
  }
  // the crown: a jewelled band round the brow with a crest at the front, and over it the tall tapering crown, ringed three
  // times, with a bud at its point
  tor(head, 0.205, 0.03, st2, [0, 0.27, 0], [Math.PI / 2 - 0.08, 0, 0]);
  sph(head, 0.06, st, [0, 0.33, 0.19], [0.8, 1.3, 0.4]);
  lathe(head, [[0.2, 0], [0.235, 0.07], [0.22, 0.2], [0.17, 0.4], [0.1, 0.58], [0.06, 0.66], [0.085, 0.7], [0.04, 0.78], [0, 0.8]], st, [0, 0.27, 0]);
  for (const [r, y] of [
    [0.225, 0.37],
    [0.19, 0.55],
    [0.135, 0.74],
  ])
    tor(head, r, 0.018, st2, [0, y, 0], [Math.PI / 2, 0, 0]);
  // His four arms. The two upper ones go out and up from behind the shoulders and hold their emblems level with his
  // crown: the discus in his right hand, a wheel on edge; the conch in his left, point up
  for (const s of [-1, 1]) {
    sph(body, 0.15, st, [s * 0.4, 0.66, 0]);
    limb(body, [s * 0.38, 0.68, -0.06], [s * 0.66, 0.74, -0.08], 0.1, 0.085, st);
    limb(body, [s * 0.66, 0.74, -0.08], [s * 0.72, 1.12, 0.0], 0.085, 0.07, st);
    tor(body, 0.1, 0.022, st2, [s * 0.52, 0.71, -0.07], [0, Math.PI / 2, 0.2 * s]);
    tor(body, 0.08, 0.018, st2, [s * 0.71, 1.04, -0.02], [Math.PI / 2, 0, 0]);
  }
  {
    const ch = new THREE.Group();
    ch.position.set(-0.72, 1.33, 0.0);
    ch.rotation.y = 0.5;
    body.add(ch);
    tor(ch, 0.15, 0.03, st, [0, 0, 0]);
    sph(ch, 0.045, st2, [0, 0, 0], [1, 1, 0.8]);
    for (let i = 0; i < 4; i++) box(ch, 0.3, 0.022, 0.022, st2, [0, 0, 0], [0, 0, (i * Math.PI) / 4]);
    const co = new THREE.Group();
    co.position.set(0.72, 1.3, 0.0);
    body.add(co);
    lathe(co, [[0.02, -0.16], [0.09, -0.06], [0.11, 0.02], [0.08, 0.1], [0.045, 0.15], [0.02, 0.21], [0, 0.22]], st, [0, 0, 0]);
    for (const y of [0.04, 0.1, 0.15]) tor(co, 0.1 - y * 0.42, 0.012, st2, [0, y, 0], [Math.PI / 2, 0, 0]);
  }
  // his lower left arm: the elbow at his side, the forearm raised before his chest, the fist closed with the forefinger up
  limb(body, [0.4, 0.62, 0.02], [0.47, 0.26, 0.1], 0.105, 0.09, st);
  limb(body, [0.47, 0.26, 0.1], [0.36, 0.52, 0.34], 0.09, 0.075, st);
  tor(body, 0.085, 0.018, st2, [0.39, 0.46, 0.29], [0.9, 0.3, 0]);
  sph(body, 0.075, st, [0.35, 0.56, 0.36]);
  cyl(body, 0.02, 0.024, 0.15, st, [0.35, 0.68, 0.37]);
  // his lower right arm, which is the one that moves: straight, swung from the shoulder, its hand on the mace. The mace is
  // a short thick haft with a round knob at the top, where his hand is, and at the other end a great ribbed head with a
  // point below it. At rest it stands on its head on the ground beside him
  arm.position.set(-0.4, 1.05 + 0.6, 0.0);
  top.add(arm);
  cyl(arm, 0.11, 0.09, 0.92, st, [0, -0.46, 0]);
  tor(arm, 0.115, 0.024, st2, [0, -0.2, 0], [Math.PI / 2, 0, 0]);
  tor(arm, 0.095, 0.02, st2, [0, -0.8, 0], [Math.PI / 2, 0, 0]);
  sph(arm, 0.105, st, [0, -0.92, 0]);
  mace.position.set(0, -0.92, 0);
  arm.add(mace);
  cyl(mace, 0.045, 0.055, 1.0, st2, [0, -0.5, 0]);
  sph(mace, 0.075, st2, [0, 0.06, 0]);
  for (const y of [-0.25, -0.9]) tor(mace, 0.06, 0.018, st, [0, y, 0], [Math.PI / 2, 0, 0]);
  lathe(mace, [[0, -0.3], [0.06, -0.24], [0.2, -0.14], [0.25, 0], [0.2, 0.14], [0.07, 0.24], [0, 0.26]], st, [0, -1.18, 0]);
  for (let i = 0; i < 4; i++) tor(mace, 0.235, 0.022, st2, [0, -1.18, 0], [0, (i * Math.PI) / 4, 0], [1, 1.08, 1]);
  G.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  const solid = { x, z, r: 0.95 },
    S = { x, z, y: G.position.y, G, top, arm, mace, solid, hp: STAT.hp, face, ph: 'rest', t: 0, cd: 0.4, to: null, dead: false, r: 0.95 };
  SOLIDS.push(solid);
  statuePose(S, 'rest', 'rest', 0);
  STATUES.push(S);
  return S;
}
// the mace arm, part of the way k from one pose to another
function statuePose(S, a, b, k) {
  const A = STAT.pose[a],
    B = STAT.pose[b],
    e = k * k * (3 - 2 * k);
  S.arm.rotation.x = -(A[0] + (B[0] - A[0]) * e);
  S.mace.rotation.x = A[1] + (B[1] - A[1]) * e;
}
// a blow on a statue: chips fly, and at the last it breaks
function statueHurt(S, n) {
  if (S.dead) return;
  // (something that is not a statue but is broken the same way, a wall, takes the blow itself)
  if (S.hurt) return S.hurt(n);
  S.hp -= n;
  puff(tmpA.set(S.x, S.y + 1.6, S.z), 0xcfc8b8, 8, 2.4, 0.35, 5, 0.12);
  if (S.hp > 0) return;
  // broken: the figure goes, the plinth stays, with what is left of him heaped on and about it
  S.dead = true;
  S.G.remove(S.top);
  SOLIDS.splice(SOLIDS.indexOf(S.solid), 1);
  const rub = S.top.children[0].material;
  for (let i = 0; i < 9; i++) {
    const a = i * 0.7 + 0.3,
      r = i < 3 ? 0.25 : 0.7 + (i % 3) * 0.28,
      w = 0.22 + (i % 4) * 0.09;
    add(S.G, new THREE.BoxGeometry(w * 1.3, w, w), rub, [Math.cos(a) * r, i < 3 ? 0.46 + w / 2 : w / 2, Math.sin(a) * r], [i * 0.9, i * 1.7, i * 0.5]).castShadow = true;
  }
  puff(tmpA.set(S.x, S.y + 1.2, S.z), 0xcfc8b8, 50, 4, 0.9, 4, 0.5);
  puff(tmpA, 0x8f887a, 20, 5, 0.4, 9, 0.25);
}
// ---------- the archer statue ----------
// The other guard that can be built: an archer, carved in the same pale stone, standing on a tall pedestal. Where the mace-
// bearer holds what comes to him, the archer reaches out, and he is the only guard that can touch what flies. He stands in
// the archer's stance of the old carvings: side-on, the front knee bent and the back leg straight, the bow arm out level
// and the string drawn back to his ear, his face turned along the arrow. He wears a low crown, earrings, a necklace and the
// sacred thread, and a quiver stands behind his shoulder. On his pedestal he turns, as a whole, toward whatever demon is
// nearest within his range, and an arrow leaves his bow every so often. His arrows are light: he wears a crowd down, he
// does not stop it. Foot soldiers and brutes break him as they do the mace-bearer, and he comes down in rubble.
// (In the code he is still a "tower", from when he was a timber watchtower with a bowman on it.)
const TOWER = { hp: 380, see: 15, every: 1.5, dmg: 34, speed: 30 },
  TOWER_SHOTS = [],
  TOWER_ARROW = new THREE.CylinderGeometry(0.012, 0.012, 0.9, 5).rotateX(Math.PI / 2),
  TOWER_ARROW_M = new THREE.MeshBasicMaterial({ color: 0xf3e6c4 });
function makeTower(x, z, face = 0) {
  const G = new THREE.Group(),
    top = new THREE.Group(),
    man = new THREE.Group(),
    st = toon(0xc6b79c, { rim: 0.22 }),
    st2 = toon(0x9d8e74, { rim: 0.15 }),
    dk = toon(0x5a5042, { rim: 0.1 }),
    PH = 1.55,
    lathe = (g, pts, m, p, sc, seg = 28) => add(g, new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), seg), m, p, [0, 0, 0], sc),
    limb = (g, a, b, r0, r1, m) => {
      const A = V3(...a),
        B = V3(...b),
        c = cyl(g, r1, r0, A.distanceTo(B), m, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]);
      c.quaternion.setFromUnitVectors(V3(0, 1, 0), B.clone().sub(A).normalize());
      sph(g, r1 * 1.05, m, b);
      return c;
    };
  G.position.set(x, groundY(x, z), z);
  G.rotation.y = face;
  scene.add(G);
  G.add(top);
  // the pedestal: a square foot, an eight-sided shaft drawn in at the waist, and a lotus cap for him to stand on
  add(top, new THREE.BoxGeometry(1.3, 0.24, 1.3), st2, [0, 0.12, 0]);
  add(top, new THREE.BoxGeometry(1.05, 0.14, 1.05), st, [0, 0.31, 0]);
  lathe(top, [[0.42, 0.38], [0.4, 0.5], [0.3, 0.62], [0.28, 1.1], [0.36, 1.22], [0.5, 1.3], [0.56, 1.4], [0.5, PH], [0, PH]], st, [0, 0, 0], [1, 1, 1], 8);
  for (const y of [0.6, 1.12]) tor(top, 0.31, 0.03, st2, [0, y, 0], [Math.PI / 2, 0, 0]);
  tor(top, 0.53, 0.04, st2, [0, 1.38, 0], [Math.PI / 2, 0, 0]);
  // the archer. He shoots along +z, and stands side-on to it, his chest toward +x
  man.position.y = PH;
  man.scale.setScalar(0.92);
  top.add(man);
  // legs: the front one forward and bent at the knee, the back one straight out behind
  limb(man, [0, 0.9, 0.07], [0.02, 0.5, 0.36], 0.14, 0.11, st);
  limb(man, [0.02, 0.5, 0.36], [0, 0.07, 0.33], 0.11, 0.085, st);
  add(man, new THREE.BoxGeometry(0.17, 0.08, 0.36), st, [0, 0.04, 0.41]);
  limb(man, [0, 0.9, -0.07], [0, 0.5, -0.33], 0.14, 0.11, st);
  limb(man, [0, 0.5, -0.33], [0, 0.07, -0.56], 0.11, 0.085, st);
  add(man, new THREE.BoxGeometry(0.17, 0.08, 0.34), st, [0.03, 0.04, -0.6], [0, 0.5, 0]);
  // the dhoti about his hips, its pleats falling before him, and a belt
  lathe(man, [[0.2, 0], [0.26, 0.1], [0.27, 0.26], [0.23, 0.38], [0, 0.38]], st2, [0, 0.66, 0], [0.82, 1, 1.05]);
  lathe(man, [[0.02, 0], [0.08, 0.04], [0.09, 0.36], [0, 0.4]], st, [0.2, 0.48, 0.02], [0.35, 1, 1]);
  tor(man, 0.245, 0.035, st, [0, 1.0, 0], [Math.PI / 2, 0, 0], [0.82, 1.05, 1]);
  // the body, turned as one shape, its breadth along the line of the shot
  lathe(man, [[0.2, 0], [0.19, 0.08], [0.23, 0.26], [0.29, 0.42], [0.28, 0.5], [0.2, 0.58], [0.09, 0.63], [0.085, 0.72]], st, [0, 1.0, 0], [0.74, 1, 1]);
  tor(man, 0.14, 0.022, st2, [0.05, 1.56, 0], [0, 0, 1.25]);
  {
    const th = new THREE.Group();
    th.position.set(0, 1.32, 0);
    th.rotation.x = 0.65;
    man.add(th);
    tor(th, 0.27, 0.012, st2, [0, 0, 0], [Math.PI / 2, 0, 0], [0.76, 1, 0.66]);
  }
  for (const s of [-1, 1]) sph(man, 0.115, st, [0, 1.52, s * 0.31]);
  // the head, turned to look along his bow arm: a calm face, long eyes, a low crown of three tiers, rings in his ears
  const head = new THREE.Group();
  head.position.set(0.01, 1.83, 0.03);
  man.add(head);
  sph(head, 0.165, st, [0, 0, 0], [0.92, 1.08, 0.96]);
  sph(head, 0.1, st, [0, -0.09, 0.05], [1.05, 0.9, 0.9]);
  cyl(head, 0.012, 0.025, 0.1, st, [0, -0.01, 0.165], [-0.12, 0, 0]);
  sph(head, 0.035, st2, [0, -0.115, 0.15], [1.2, 0.45, 0.6]);
  for (const s of [-1, 1]) {
    sph(head, 0.038, st2, [s * 0.065, 0.015, 0.13], [1.25, 0.42, 0.5]);
    sph(head, 0.015, dk, [s * 0.065, 0.012, 0.15], [1.3, 0.5, 0.5]);
    sph(head, 0.04, st, [s * 0.155, -0.04, -0.01], [0.45, 1.8, 0.8]);
    tor(head, 0.048, 0.017, st2, [s * 0.165, -0.15, 0], [0, Math.PI / 2, 0]);
  }
  tor(head, 0.158, 0.024, st2, [0, 0.115, 0], [Math.PI / 2 - 0.08, 0, 0]);
  lathe(head, [[0.155, 0], [0.18, 0.05], [0.16, 0.14], [0.11, 0.26], [0.06, 0.34], [0.07, 0.37], [0, 0.42]], st, [0, 0.115, 0]);
  tor(head, 0.165, 0.014, st2, [0, 0.2, 0], [Math.PI / 2, 0, 0]);
  tor(head, 0.115, 0.012, st2, [0, 0.33, 0], [Math.PI / 2, 0, 0]);
  // the bow arm, straight out before him, and the bow in its fist: a tall recurve, upright, its belly toward the mark
  limb(man, [0.02, 1.52, 0.31], [0.13, 1.52, 0.62], 0.085, 0.07, st);
  limb(man, [0.13, 1.52, 0.62], [0.14, 1.52, 0.94], 0.07, 0.06, st);
  tor(man, 0.075, 0.016, st2, [0.07, 1.52, 0.46], [0.35, 0, 0]);
  {
    const bw = new THREE.Group();
    bw.position.set(0.14, 1.52, 0.97 - 0.78);
    bw.rotation.y = -Math.PI / 2;
    man.add(bw);
    add(bw, new THREE.TorusGeometry(0.78, 0.022, 6, 22, 1.9), st2, [0, 0, 0], [0, 0, -0.95]);
    for (const s of [-1, 1]) sph(bw, 0.035, st, [0.78 * Math.cos(0.95), s * 0.78 * Math.sin(0.95), 0]);
  }
  // the drawing arm: the elbow high and back, the hand at his ear; the string from each tip of the bow to that hand, and the
  // arrow laid across from hand to bow
  limb(man, [0.02, 1.52, -0.31], [0.1, 1.6, -0.55], 0.085, 0.07, st);
  limb(man, [0.1, 1.6, -0.55], [0.14, 1.56, -0.04], 0.07, 0.06, st);
  for (const s of [-1, 1]) limb(man, [0.14, 1.52 + s * 0.635, 0.19 + 0.78 * Math.cos(0.95)], [0.14, 1.55, -0.04], 0.007, 0.007, st2);
  limb(man, [0.14, 1.55, -0.06], [0.14, 1.53, 1.12], 0.011, 0.011, st2);
  cyl(man, 0.001, 0.03, 0.09, st2, [0.14, 1.53, 1.16], [Math.PI / 2, 0, 0]);
  // (and the quiver behind his shoulder)
  {
    const q = new THREE.Group();
    q.position.set(-0.15, 1.42, -0.12);
    q.rotation.set(0.5, 0, 0.1);
    man.add(q);
    cyl(q, 0.06, 0.045, 0.46, st2, [0, 0, 0]);
    for (let i = 0; i < 4; i++) cyl(q, 0.008, 0.008, 0.18, st, [Math.cos(i * 1.6) * 0.025, 0.3, Math.sin(i * 1.6) * 0.025]);
  }
  G.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  const solid = { x, z, r: 0.85 },
    S = { kind: 'tower', x, z, y: G.position.y, G, top, man, solid, hp: TOWER.hp, face, cd: 0.6, dead: false, r: 0.85 };
  SOLIDS.push(solid);
  STATUES.push(S);
  return S;
}
function towerStep(S, dt) {
  // whom he shoots at: the nearest living demon within his range, on foot or in the air
  let best = null,
    bd = TOWER.see;
  for (const d of grunts) {
    if (d.dead || d.flung) continue;
    const l = Math.hypot(d.g.position.x - S.x, d.g.position.z - S.z);
    if (l < bd) {
      bd = l;
      best = d;
    }
  }
  S.cd -= dt;
  if (!best) return;
  // (he turns to it; the tower itself may be set at any angle, so his own turn is counted from that)
  const want = Math.atan2(best.g.position.x - S.x, best.g.position.z - S.z) - S.G.rotation.y,
    off = Math.atan2(Math.sin(want - S.man.rotation.y), Math.cos(want - S.man.rotation.y));
  S.man.rotation.y += Math.max(-4 * dt, Math.min(4 * dt, off));
  if (S.cd > 0 || Math.abs(off) > 0.35) return;
  S.cd = TOWER.every * (0.85 + Math.random() * 0.3);
  const m = new THREE.Mesh(TOWER_ARROW, TOWER_ARROW_M);
  S.man.localToWorld(m.position.set(0.14, 1.53, 1.15));
  // (stone dust shaken from the bow as it looses)
  puff(m.position, 0xcfc8b8, 5, 1.2, 0.25, 3, 0.1);
  scene.add(m);
  TOWER_SHOTS.push({ m, d: best });
}
function towerShots(dt) {
  for (let i = TOWER_SHOTS.length - 1; i >= 0; i--) {
    const a = TOWER_SHOTS[i],
      d = a.d;
    // (it flies at where its mark now is, so it does not miss; if its mark is gone before it lands, so is it)
    if (!grunts.includes(d) || d.dead) {
      scene.remove(a.m);
      TOWER_SHOTS.splice(i, 1);
      continue;
    }
    tmpA.set(d.g.position.x, d.g.position.y + (d.df ? 1.4 : d.def.aimY || 1), d.g.position.z);
    const l = a.m.position.distanceTo(tmpA),
      step = TOWER.speed * dt;
    a.m.lookAt(tmpA);
    if (l > step) {
      a.m.position.lerp(tmpA, step / l);
      continue;
    }
    d.wob = 1;
    d.pw = -1;
    d.dmg = TOWER.dmg;
    puff(tmpA, 0xfff0c8, 6, 2, 0.25, 2, 0.1);
    scene.remove(a.m);
    TOWER_SHOTS.splice(i, 1);
  }
}
function statuesUpdate(dt) {
  towerShots(dt);
  for (const S of STATUES) {
    if (S.dead) continue;
    if (S.kind === 'tower') {
      towerStep(S, dt);
      continue;
    }
    // whom he has to do with: the nearest demon on foot within his sight
    let best = null,
      bd = STAT.see;
    for (const d of grunts) {
      if (d.dead || d.flung || d.df) continue;
      const l = Math.hypot(d.g.position.x - S.x, d.g.position.z - S.z);
      if (l < bd) {
        bd = l;
        best = d;
      }
    }
    // he turns on his plinth toward it, but not once the mace is on its way down
    const want = best ? Math.atan2(best.g.position.x - S.x, best.g.position.z - S.z) : S.face,
      off = Math.atan2(Math.sin(want - S.top.rotation.y), Math.cos(want - S.top.rotation.y));
    if (S.ph === 'rest' || S.ph === 'up') S.top.rotation.y += Math.max(-1.7 * dt, Math.min(1.7 * dt, off));
    S.t += dt;
    if (S.ph === 'rest') {
      S.cd -= dt;
      if (best && bd < STAT.reach && Math.abs(off) < 0.5 && S.cd <= 0) {
        S.ph = 'up';
        S.t = 0;
      }
    } else if (S.ph === 'up') {
      statuePose(S, 'rest', 'up', Math.min(1, S.t / STAT.up));
      if (S.t >= STAT.up) {
        S.ph = 'down';
        S.t = 0;
      }
    } else if (S.ph === 'down') {
      const k = Math.min(1, S.t / STAT.down);
      // (faster and faster as it falls)
      S.arm.rotation.x = -(STAT.pose.up[0] + (STAT.pose.hit[0] - STAT.pose.up[0]) * k * k);
      S.mace.rotation.x = STAT.pose.up[1] + (STAT.pose.hit[1] - STAT.pose.up[1]) * k * k;
      if (S.t >= STAT.down) {
        // the mace lands
        S.ph = 'hold';
        S.t = 0;
        const a = S.top.rotation.y,
          ix = S.x + Math.sin(a) * STAT.out - Math.cos(a) * 0.45,
          iz = S.z + Math.cos(a) * STAT.out + Math.sin(a) * 0.45;
        puff(tmpA.set(ix, S.y + 0.15, iz), 0xcbb48a, 30, 4, 0.6, 4, 0.4);
        ring(tmpA.setY(S.y + 0.08), STAT.wide, 0xcfc8b8, 0.45);
        for (const d of grunts) {
          if (d.dead || d.flung || d.df) continue;
          const dx = d.g.position.x - ix,
            dz = d.g.position.z - iz,
            l = Math.hypot(dx, dz);
          if (l > STAT.wide + (d.def.radius || 0.4)) continue;
          d.wob = 1;
          d.pw = -1;
          d.dmg = STAT.dmg;
          d.vel.x += (Math.sin(a) + dx / (l || 1)) * 2.2;
          d.vel.z += (Math.cos(a) + dz / (l || 1)) * 2.2;
        }
      }
    } else if (S.ph === 'hold') {
      if (S.t >= STAT.hold) {
        S.ph = 'back';
        S.t = 0;
      }
    } else {
      statuePose(S, 'hit', 'rest', Math.min(1, S.t / STAT.back));
      if (S.t >= STAT.back) {
        S.ph = 'rest';
        S.cd = STAT.rest;
      }
    }
    // (worn, he leans a little off true)
    S.top.rotation.z = (1 - Math.max(0, S.hp) / STAT.hp) * 0.07;
  }
}

// ---------- the wall ----------
// What the masons raise besides guards: a length of dry stone wall, chest high, three courses of dressed blocks under a row
// of capstones, the joints of each course set over the middle of the blocks below. It does nothing but stand in the way.
// Whoever walks goes round it (it is a row of SOLIDS, so the pathfinder sees it); a demon who finds no way round, or only a
// long one, breaks it instead (see wallInWay), and it comes down in a heap. makeWall(x, z, yaw, len): its middle, the way it
// runs (yaw 0 runs along x), and how long it is
const WALLS = [],
  WALL = { hp: 520, h: 1.42, thick: 0.72, far: 4 };
function makeWall(x, z, yaw = 0, len = 10) {
  const G = new THREE.Group(),
    top = new THREE.Group(),
    st = [toon(0xc6b79c, { rim: 0.16 }), toon(0xb3a488, { rim: 0.14 }), toon(0x9d8e74, { rim: 0.12 })],
    ux = Math.cos(yaw),
    uz = -Math.sin(yaw),
    solids = [];
  G.position.set(x, groundY(x, z), z);
  G.rotation.y = yaw;
  G.add(top);
  // the courses: blocks a little over a pace long, no two quite alike in length, shade or how far they stand out
  for (let c = 0; c < 3; c++) {
    let at = -len / 2 - (c % 2 ? 0.55 : 0);
    for (let i = 0; at < len / 2; i++) {
      const w0 = 1.05 + 0.3 * Math.abs(Math.sin(i * 12.9898 + c * 78.233 + x)),
        a = Math.max(at, -len / 2),
        b = Math.min(at + w0, len / 2);
      at += w0;
      if (b - a < 0.12) continue;
      const m = add(top, new THREE.BoxGeometry(b - a - 0.03, 0.4, WALL.thick + 0.06 * Math.sin(i * 3.1 + c)), st[(i + c * 2) % 3], [(a + b) / 2, 0.2 + c * 0.41, 0.02 * Math.sin(i * 5.3 + c * 2)]);
      m.castShadow = m.receiveShadow = true;
    }
  }
  // the capstones: flatter, a little wider than the wall, each rounded off by being set a hair askew
  for (let i = 0, at = -len / 2; at < len / 2; i++) {
    const w0 = 1.5 + 0.35 * Math.abs(Math.sin(i * 7.7 + z)),
      b = Math.min(at + w0, len / 2),
      m = add(top, new THREE.BoxGeometry(b - at - 0.04, 0.17, WALL.thick + 0.16), st[i % 2], [(at + b) / 2, 1.23 + 0.085, 0], [0, 0.03 * Math.sin(i * 4.1), 0]);
    m.castShadow = true;
    at = b;
  }
  scene.add(G);
  // (in the way of everything that walks: a row of small rounds along it)
  for (let t = -len / 2 + 0.4; t <= len / 2 - 0.4 + 1e-6; t += 0.8) {
    const q = { x: x + ux * t, z: z + uz * t, r: 0.5 };
    solids.push(q);
    SOLIDS.push(q);
  }
  const W = { x, z, y: G.position.y, yaw, len, ux, uz, G, top, solids, hp: WALL.hp, dead: false, st };
  WALLS.push(W);
  return W;
}
// a blow on a wall: chips fly, and at the last it falls
function wallHurt(W, n, px, pz) {
  if (W.dead) return;
  W.hp -= n;
  puff(tmpA.set(px === undefined ? W.x : px, W.y + 0.9, pz === undefined ? W.z : pz), 0xcfc8b8, 8, 2.4, 0.35, 5, 0.12);
  if (W.hp > 0) return;
  W.dead = true;
  W.G.remove(W.top);
  for (const q of W.solids) SOLIDS.splice(SOLIDS.indexOf(q), 1);
  // down: a low scatter of blocks along where it stood
  for (let i = 0; i < Math.round(W.len * 1.6); i++) {
    const t = (i / (W.len * 1.6) - 0.5) * W.len,
      w = 0.26 + (i % 4) * 0.09;
    add(W.G, new THREE.BoxGeometry(w * 1.5, w, w), W.st[i % 3], [t + 0.2 * Math.sin(i * 3.3), w / 2, Math.sin(i * 1.9) * 0.9], [i * 0.9, i * 1.7, i * 0.5]).castShadow = true;
  }
  for (let t = -W.len / 2; t <= W.len / 2; t += 1.5) {
    puff(tmpA.set(W.x + W.ux * t, W.y + 0.8, W.z + W.uz * t), 0xcfc8b8, 14, 3.4, 0.8, 4, 0.5);
  }
}
// Is a wall what stands between a walker at P and where he is going (tx, tz), with no reasonable way round it? If the
// straight line is open, or the way round is no more than WALL.far times the straight one (four times, and six paces: a maze is a long way round by design), no:
// he goes round. Otherwise the nearest standing wall that the straight line crosses is his to break, and what comes back is
// the spot on his side of it where he will stand to do it, made to look like a statue to the code that deals blows
// ({ x, z, r, dead, hurt }); or null
function wallInWay(P, tx, tz) {
  if (!WALLS.some((w) => !w.dead)) return null;
  navFresh();
  if (navClear(P.x, P.z, tx, tz, 2)) return null;
  const g = navOpen(navCell(tx, tz)),
    s = navOpen(navCell(P.x, P.z)),
    straight = Math.hypot(tx - P.x, tz - P.z);
  if (g >= 0 && s >= 0) {
    const d = navField(g).d[s];
    // (WALL.far: how many times the straight way the way round may be before he would sooner break through)
    if (d !== 65535 && d / 2 < straight * WALL.far + 6) return null;
  }
  let best = null,
    bt = 2;
  const dx = tx - P.x,
    dz = tz - P.z;
  for (const w of WALLS) {
    if (w.dead) continue;
    // where his line meets this wall's line: t along his, u along the wall from its middle
    const den = dx * w.uz - dz * w.ux;
    if (Math.abs(den) < 1e-6) continue;
    const ex = w.x - P.x,
      ez = w.z - P.z,
      t = (ex * w.uz - ez * w.ux) / den,
      u = (ex * dz - ez * dx) / den;
    if (t > 0 && t < 1 && Math.abs(u) <= w.len / 2 && t < bt) {
      bt = t;
      best = w;
    }
  }
  if (!best) return null;
  const back = 0.95 / (straight || 1),
    T = { x: P.x + dx * (bt - back), z: P.z + dz * (bt - back), r: 0.4, w: best, hurt: (n) => wallHurt(best, n, T.x, T.z) };
  Object.defineProperty(T, 'dead', { get: () => best.dead });
  return T;
}
