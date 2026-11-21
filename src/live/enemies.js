'use strict';
// The enemies: rakshasa, brute, pishacha and defiler, how they are summoned, and how they move, fight and die.
// ---------- motion: stand, walk and run blend on the whole body; shooting is an upper-body layer finished with IK ----------
const E = new THREE.Euler(),
  eq = (x, y, z) => new THREE.Quaternion().setFromEuler(E.set(x, y, z));
const foldR = (() => {
  const rp = eq(0, 0, -0.78);
  return rp
    .clone()
    .invert()
    .multiply(new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), 1.75))
    .multiply(rp);
})();
// ---------- Rakshasa foot soldier: the same body made heavy and hunched, horned and tusked, with a studded club ----------
const grunts = [],
  EG = new THREE.Euler(),
  HPBG = new THREE.SpriteMaterial({ color: 0x160c12, transparent: true, opacity: 0.85, depthTest: false, fog: false }),
  HPFG = new THREE.SpriteMaterial({ color: 0xe04a38, depthTest: false, fog: false });
const cordPts = Array.from({ length: 17 }, (_, i) => {
    const t = -1.3 + (i / 16) * 2.6;
    return [Math.sin(t) * 0.12, 1.47 - Math.cos(t) * 0.1];
  }),
  cordGeo = weigh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(chestPathN(cordPts, 0.01).map((q) => V3(...q))), 48, 0.006, 6), SKIN),
  toothAt = chestPathN(
    cordPts.filter((_, i) => i > 1 && i < 15 && i % 2 === 0),
    0.014,
  );
// a tusk built from tapering segments along an arc: thick at the root, ending in a point
function tusk(head, s, x0, y0, z, Rt, a0, a1, r0, mat) {
  const n = 6,
    cx = x0 - Rt * Math.cos(a0),
    cy = y0 - Rt * Math.sin(a0);
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * (i + 0.5)) / n;
    cyl(
      head,
      r0 * (1 - (i + 1) / n),
      r0 * (1 - i / n),
      ((Rt * (a1 - a0)) / n) * 1.2,
      mat,
      [s * (cx + Rt * Math.cos(a)), cy + Rt * Math.sin(a), z],
      [0, 0, s * a],
    );
  }
}

// The brute (d.br) is built from the same parts made vast, with his own details: bald with a nose ring, bull's horns that sweep out and curl up, and a necklace of skulls with long fangs between them instead of the tooth necklace. Each wears a little gold, differently: an arm band, anklets, a nose ring, or none.
// He walks with his feet planted wide and his whole bulk rolling over each step. Straw dummies rattle when hit; living enemies only shudder, and a brute barely at all.
function makeGrunt(d, seed) {
  const g = d.g;
  while (g.children.length) g.remove(g.children[0]);
  const br = !!d.br,
    SC = (d.sz = br ? 1.65 : 1),
    gold = toon(0xe0a02a, { emissive: 0x3a2000, rim: 0.5 }),
    R = makeRig(),
    vr = br ? [(Math.random() * 3) | 0, (Math.random() * 4) | 0, Math.random() < 0.5, Math.random() < 0.5, Math.random() < 0.4] : [],
    skinC = br ? [0x2f4f8f, 0x35467f, 0x2a5a86][vr[0]] : 0x4b3f5c,
    skin = toon(skinC, { vertexColors: true, rim: 0.45 }),
    sk = toon(skinC, { rim: 0.45 }),
    cloth = toon(br ? [0xb5601a, 0x8f1f1a, 0x9a7a1e, 0x1f5a55][vr[1]] : 0x5a1410, { vertexColors: true }),
    iron = toon(0x2c2a30, { rim: 0.5 }),
    boneC = toon(0xd8cdb0, { rim: 0.4 }),
    hairC = toon(0x16101c, { rim: 0.25 }),
    eyeC = new THREE.MeshBasicMaterial({ color: 0xffa020 }),
    WOOD = toon(0x7a4a22),
    DARK = toon(0x15101a);
  {
    const k = (d.k || 1) * SC;
    R.group.scale.set((br ? 1.12 : 1.0) * k, 0.9 * k, (br ? 1.16 : 1.04) * k);
  }
  R.group.position.y = -0.04 * SC;
  g.add(R.group);
  if (br) {
    R.on('spine', sph(new THREE.Group(), 0.175, sk, [0, 0, 0], [1.12, 1, 1.02]).parent, [0, 1.14, 0.045]);
    R.on('chest', sph(new THREE.Group(), 0.19, sk, [0, 0, 0], [1.22, 0.85, 0.92]).parent, [0, 1.36, 0.02]);
    for (const s of [-1, 1]) R.on('chest', sph(new THREE.Group(), 0.11, sk, [0, 0, 0], [1.1, 0.95, 1.05]).parent, [s * 0.215, 1.46, -0.02]);
  } // the brute: a great belly, a slab of chest and heaped shoulders
  R.skin(V.body.geometry, skin);
  R.skin(dhotiGeo, cloth);
  {
    const b = R.on('hips', new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.024, 10, 36), iron), [0, 1.03, 0.004]);
    b.rotation.x = Math.PI / 2;
    b.scale.set(1, 0.76, 1);
  }
  if (!br) {
    R.skin(cordGeo, hairC);
    const n = R.on('chest', new THREE.Group(), [0, 0, 0]);
    for (const q of toothAt) cyl(n, 0.002, 0.012, 0.05, boneC, [q[0], q[1] - 0.026, q[2]], [Math.PI, 0, 0]);
  } else
    for (let i = 0; i < 9; i++) {
      const x = (i - 4) * 0.05,
        u = x / 0.26,
        q = R.on('chest', new THREE.Group(), [x, 1.43 - (1 - u * u) * 0.085, 0.02 + 0.178 * Math.sqrt(1 - u * u * 0.9) + 0.02]);
      q.rotation.y = u * 0.9;
      if (i % 2) cyl(q, 0.011, 0.001, 0.075, boneC, [0, -0.03, 0]);
      else {
        const z = i === 4 ? 1.3 : 1;
        q.scale.setScalar(z);
        sph(q, 0.03, boneC, [0, 0, 0], [1, 1.08, 0.95]);
        sph(q, 0.019, boneC, [0, -0.027, 0.006], [1, 0.8, 0.9]);
        for (const e of [-1, 1]) sph(q, 0.009, DARK, [e * 0.012, 0.004, 0.024], [1, 1.1, 0.6]);
        sph(q, 0.004, DARK, [0, -0.01, 0.028]);
        add(q, new THREE.BoxGeometry(0.022, 0.004, 0.006), DARK, [0, -0.03, 0.022]);
      }
    }
  for (const s of [-1, 1]) {
    const S = s > 0 ? 'L' : 'R';
    R.on('chest', sph(new THREE.Group(), 0.085, sk, [0, 0, 0], [1.1, 0.9, 1]).parent, [s * 0.2, 1.455, -0.02]);
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.014, 8, 24), iron),
      a = R3('fore' + S),
      e = R3('hand' + S);
    m.quaternion.setFromUnitVectors(V3(0, 0, 1), V3(e[0] - a[0], e[1] - a[1], 0).normalize());
    R.on('fore' + S, m, L3(a, e, 0.75));
    if (br)
      for (const [on, bn, to, t, rad] of [
        [vr[2], 'arm', 'fore', 0.5, 0.073],
        [vr[4], 'shin', 'foot', 0.88, 0.06],
      ])
        if (on) {
          const a2 = R3(bn + S),
            e2 = R3(to + S),
            q = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.012, 8, 24), gold);
          q.quaternion.setFromUnitVectors(V3(0, 0, 1), V3(e2[0] - a2[0], e2[1] - a2[1], e2[2] - a2[2]).normalize());
          R.on(bn + S, q, L3(a2, e2, t));
        }
  }
  const head = R.on('head', new THREE.Group(), [0, 1.715, 0.012]);
  sph(head, 0.125, sk, [0, 0, 0], [1.05, 1, 1.05]);
  sph(head, 0.105, sk, [0, -0.085, 0.03], [1.12, 0.8, 1.05]);
  add(head, new THREE.BoxGeometry(0.19, 0.04, 0.06), sk, [0, 0.032, 0.098], [0.25, 0, 0]);
  sph(head, 0.024, sk, [0, -0.028, 0.122], [1.4, 0.8, 0.8]);
  add(head, new THREE.BoxGeometry(0.11, 0.022, 0.02), DARK, [0, -0.095, 0.118]);
  if (!br) {
    sph(head, 0.132, hairC, [0, 0.03, -0.045], [1.06, 1.05, 1]);
    sph(head, 0.11, hairC, [0, -0.09, -0.1], [1.25, 1.35, 0.8]);
  } else if (vr[3]) tor(head, 0.022, 0.005, gold, [0, -0.052, 0.138]);
  for (const s of [-1, 1]) {
    sph(head, 0.026, DARK, [s * 0.05, 0, 0.104], [1.3, 0.75, 0.55], [0, 0, s * 0.3]);
    sph(head, 0.013, eyeC, [s * 0.05, -0.002, 0.116], [1.35, 0.55, 0.5], [0, 0, s * 0.3]);
    sph(head, 0.005, DARK, [s * 0.05, -0.002, 0.1225], [0.55, 1.1, 0.4]);
    tusk(head, s, 0.05, -0.088, 0.118, 0.03, 1.25 * Math.PI, 2.35 * Math.PI, 0.016, boneC);
    if (br) tusk(head, s, 0.1, 0.045, -0.005, 0.095, 1.5 * Math.PI, 2.3 * Math.PI, 0.038, boneC);
    else cyl(head, 0.003, 0.03, 0.17, boneC, [s * 0.1, 0.14, 0], [0, 0, s * -0.55]);
    cyl(head, 0.002, 0.03, 0.1, sk, [s * 0.145, 0.005, -0.01], [0, 0, s * -1.25], [1, 1, 0.5]);
  }
  {
    const dir = V3(-0.7071, -0.7071, 0),
      grip = new THREE.Group(),
      club = new THREE.Group();
    R.bone.handR.add(grip);
    grip.add(club);
    sph(grip, 0.046, sk, [dir.x * 0.048, dir.y * 0.048, 0], [1.15, 1.4, 1.1], [0, 0, -Math.PI / 4]);
    cyl(club, 0.018, 0.015, 0.22, WOOD, [0, 0.03, 0]);
    cyl(club, 0.058, 0.026, 0.36, WOOD, [0, 0.32, 0]);
    sph(club, 0.058, WOOD, [0, 0.5, 0], [1, 0.6, 1]);
    for (let i = 0; i < 8; i++) {
      const a = i * 2.4,
        y = 0.24 + i * 0.03;
      cyl(club, 0.002, 0.014, 0.04, iron, [Math.cos(a) * 0.055, y, Math.sin(a) * 0.055], [0, -a, -Math.PI / 2]);
    }
    for (const y of [0.16, 0.47]) tor(club, y < 0.3 ? 0.03 : 0.055, 0.007, iron, [0, y, 0], [Math.PI / 2, 0, 0]);
    club.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(0, 0.25, 1).normalize());
    if (br) {
      club.scale.setScalar(1.3);
      head.scale.setScalar(0.88);
    }
    club.position.copy(dir).multiplyScalar(0.055);
    d.club = club;
    d.grip = grip;
    d.clubP = club.position.clone();
    d.clubQ = club.quaternion.clone();
  }
  d.mats = new Set();
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      d.mats.add(o.material);
    }
  });
  d.mat = skin;
  d.mat2 = sk;
  d.base = skin.color.clone();
  d.rig = R;
  d.seed = seed;
  grunts.push(d);
}
// ---------- Pishacha: the rakshasa's starved cousin. Same build of head and the same dark palette, but gaunt, hornless and long-eared, with lank hair, a rag for cloth and claws for weapons. It goes on all fours ----------
function makePish(d, seed) {
  const g = d.g,
    R = makeRig(),
    skin = toon(0x3f5c52, { vertexColors: true, rim: 0.45 }),
    sk = toon(0x3f5c52, { rim: 0.45 }),
    cloth = toon(0x4a1612),
    boneC = toon(0xd8cdb0, { rim: 0.4 }),
    hairC = toon(0x16101c, { rim: 0.25 }),
    eyeC = new THREE.MeshBasicMaterial({ color: 0xc4c0b4 }),
    DARK = toon(0x15101a);
  const k = d.k || 1;
  R.group.scale.set(1.0 * k, 0.8 * k, 1.06 * k);
  d.by = -0.43 * 0.8 * k;
  R.group.position.y = d.by;
  g.add(R.group);
  R.skin(V.body.geometry, skin);
  {
    const b = R.on('hips', new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.014, 8, 28), hairC), [0, 1.02, 0.004]);
    b.rotation.x = Math.PI / 2;
    b.scale.set(1, 0.76, 1);
    for (const z of [0.105, -0.105]) R.on('hips', new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.22, 0.012), cloth), [0, 0.91, z]);
  }
  for (let i = 0; i < 6; i++) {
    const y = 1.08 + i * 0.07;
    R.on(y < 1.26 ? 'spine' : 'chest', sph(new THREE.Group(), 0.017, sk, [0, 0, 0], [1, 1.1, 1]).parent, [0, y, -0.098]);
  } // knobs of the backbone
  const head = R.on('head', new THREE.Group(), [0, 1.715, 0.012]);
  sph(head, 0.116, sk, [0, 0, 0], [0.98, 1.04, 1.05]);
  sph(head, 0.086, sk, [0, -0.082, 0.03], [1.05, 0.82, 1.05]);
  add(head, new THREE.BoxGeometry(0.175, 0.032, 0.05), sk, [0, 0.066, 0.084], [0.28, 0, 0]);
  sph(head, 0.02, sk, [0, -0.026, 0.116], [1.3, 0.8, 0.8]);
  add(head, new THREE.BoxGeometry(0.115, 0.024, 0.02), DARK, [0, -0.09, 0.106]);
  sph(head, 0.122, hairC, [0, 0.028, -0.042], [1.02, 1.03, 1]);
  for (const x of [-0.014, 0.014]) cyl(head, 0.001, 0.007, 0.026, boneC, [x, -0.074, 0.11]);
  for (const s of [-1, 1]) {
    sph(head, 0.04, DARK, [s * 0.053, 0.024, 0.086], [1, 1, 0.6]);
    sph(head, 0.031, eyeC, [s * 0.053, 0.024, 0.099], [1, 1, 0.6]);
    sph(head, 0.016, DARK, [s * 0.053, 0.024, 0.1135], [1, 1, 0.4]); // big white staring eyes
    tusk(head, s, 0.045, -0.085, 0.094, 0.042, 1.15 * Math.PI, 2.3 * Math.PI, 0.019, boneC); // a tusk from each corner of the mouth, sweeping down and out to the side, then up to a sharp point
    cyl(head, 0.002, 0.03, 0.17, sk, [s * 0.165, 0.03, -0.02], [0, 0, s * -1.15], [1, 1, 0.45]);
    const dir = V3(s * 0.7071, -0.7071, 0),
      c = new THREE.Group();
    c.quaternion.setFromUnitVectors(V3(0, 1, 0), dir);
    c.position.copy(dir).multiplyScalar(0.085);
    R.bone[s > 0 ? 'handL' : 'handR'].add(c);
    for (const z of [-0.02, 0, 0.02]) cyl(c, 0.001, 0.007, 0.055, boneC, [0, 0.02, z], [z * 8, 0, 0]);
  }
  d.mats = new Set();
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      d.mats.add(o.material);
    }
  });
  d.pi = true;
  d.cr = Math.random() < 0.5;
  d.club = null;
  d.mat = skin;
  d.mat2 = sk;
  d.base = skin.color.clone();
  d.rig = R;
  d.seed = seed;
  grunts.push(d);
}
// ---------- Defiler (nishachara): a winged rakshasa that flies in over everything to foul the altar. Same build of head and body as the foot soldier, but lean and hornless, with green eyes, long fangs, crimson bat wings and a pot of filth carried in both hands ----------
const wingGeo = (() => {
  const sh = new THREE.Shape();
  sh.moveTo(0, 0.06);
  sh.lineTo(0.32, 0.2);
  sh.lineTo(0.82, 0.06);
  sh.quadraticCurveTo(0.6, 0, 0.56, -0.22);
  sh.quadraticCurveTo(0.42, -0.06, 0.32, -0.3);
  sh.quadraticCurveTo(0.2, -0.1, 0.03, -0.26);
  sh.lineTo(0, 0.06);
  return new THREE.ShapeGeometry(sh, 8);
})();
const globGeo = new THREE.SphereGeometry(0.035, 8, 6),
  SLIME = new THREE.MeshBasicMaterial({ color: 0x6ee040 }),
  DQ1 = new THREE.Quaternion(),
  DQ2 = new THREE.Quaternion();
function glob(from) {
  const m = new THREE.Mesh(globGeo, SLIME),
    a = from.clone(),
    b = V3((Math.random() - 0.5) * 0.4, 0.75, (Math.random() - 0.5) * 0.4);
  scene.add(m);
  let t = 0;
  fx.push((dt) => {
    t += dt / 0.55;
    if (t >= 1) {
      scene.remove(m);
      puff(b, 0x6ee040, 4, 1.3, 0.4, 2);
      puff(b, 0x2a3a1a, 2, 0.6, 0.7, -1.5);
      return false;
    }
    m.position.lerpVectors(a, b, t);
    m.position.y += Math.sin(t * Math.PI) * 0.3;
    m.scale.setScalar(1 - 0.4 * t);
    return true;
  });
}
function makeDefiler(d, seed) {
  const g = d.g,
    R = makeRig(),
    skin = toon(0x5b3a86, { vertexColors: true, rim: 0.5 }),
    sk = toon(0x5b3a86, { rim: 0.5 }),
    wingM = toon(0x8f1d2e, { rim: 0.35 }),
    cloth = toon(0x5a1410),
    boneC = toon(0xd8cdb0, { rim: 0.4 }),
    hairC = toon(0x16101c, { rim: 0.25 }),
    eyeC = new THREE.MeshBasicMaterial({ color: 0x7cf04a }),
    DARK = toon(0x15101a),
    clay = toon(0x4a2c1c, { rim: 0.3 });
  const k = d.k || 1;
  R.group.scale.set(0.86 * k, 0.86 * k, 0.9 * k);
  g.add(R.group);
  R.skin(V.body.geometry, skin);
  {
    const b = R.on('hips', new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.02, 8, 28), boneC), [0, 1.02, 0.004]);
    b.rotation.x = Math.PI / 2;
    b.scale.set(1, 0.76, 1);
    for (const z of [0.108, -0.108]) R.on('hips', new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.26, 0.014), cloth), [0, 0.9, z]);
  }
  const head = R.on('head', new THREE.Group(), [0, 1.715, 0.012]);
  sph(head, 0.12, sk, [0, 0, 0], [1, 1.02, 1.05]);
  sph(head, 0.092, sk, [0, -0.084, 0.03], [1.06, 0.8, 1.05]);
  add(head, new THREE.BoxGeometry(0.18, 0.038, 0.058), sk, [0, 0.032, 0.096], [0.3, 0, 0]);
  sph(head, 0.022, sk, [0, -0.028, 0.12], [1.3, 0.8, 0.8]);
  add(head, new THREE.BoxGeometry(0.1, 0.022, 0.02), DARK, [0, -0.092, 0.112]);
  sph(head, 0.124, hairC, [0, 0.03, -0.045], [1.02, 1.02, 1]);
  for (const s of [-1, 1]) {
    sph(head, 0.026, DARK, [s * 0.05, 0, 0.102], [1.3, 0.75, 0.55], [0, 0, s * 0.3]);
    sph(head, 0.014, eyeC, [s * 0.05, -0.002, 0.113], [1.35, 0.6, 0.5], [0, 0, s * 0.3]);
    sph(head, 0.005, DARK, [s * 0.05, -0.002, 0.1195], [0.55, 1.1, 0.4]);
    cyl(head, 0.007, 0.001, 0.055, boneC, [s * 0.026, -0.118, 0.112]);
    cyl(head, 0.002, 0.034, 0.22, sk, [s * 0.15, 0.06, -0.06], [-0.6, 0, s * -0.85], [1, 1, 0.4]);
    // wing: a membrane stretched over an arm and three fingers, hinged at the shoulder blade
    const w = R.on('chest', new THREE.Group(), [s * 0.07, 1.4, -0.1]);
    w.scale.set(s * 1.3, 1.3, 1.3);
    add(w, wingGeo, wingM);
    for (const [a, b, r] of [
      [[0, 0.02], [0.32, 0.2], 0.016],
      [[0.32, 0.2], [0.82, 0.06], 0.009],
      [[0.32, 0.2], [0.56, -0.22], 0.007],
      [[0.32, 0.2], [0.32, -0.3], 0.007],
    ]) {
      const dx = b[0] - a[0],
        dy = b[1] - a[1];
      cyl(w, r * 0.5, r, Math.hypot(dx, dy), sk, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.004], [0, 0, -Math.atan2(dx, dy)]);
    }
    cyl(w, 0.001, 0.008, 0.05, boneC, [0.32, 0.225, 0.004]);
    d[s > 0 ? 'wingL' : 'wingR'] = w;
  }
  {
    const grip = new THREE.Group(),
      pot = new THREE.Group();
    R.bone.handR.add(grip);
    grip.position.set(-0.05, -0.05, 0);
    grip.add(pot);
    cyl(pot, 0.003, 0.003, 0.1, hairC, [0, -0.04, 0]);
    sph(pot, 0.075, clay, [0, -0.15, 0], [1, 0.9, 1]);
    tor(pot, 0.045, 0.012, clay, [0, -0.09, 0], [Math.PI / 2, 0, 0]);
    sph(pot, 0.043, SLIME, [0, -0.092, 0], [1, 0.35, 1]);
    for (const [x, z, l] of [
      [0.05, 0.01, 0.07],
      [-0.03, 0.045, 0.1],
      [-0.02, -0.05, 0.05],
    ])
      cyl(pot, 0.006, 0.001, l, SLIME, [x, -0.1 - l / 2, z]);
    d.club = pot;
  }
  d.mats = new Set();
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      if (o.material !== SLIME) d.mats.add(o.material);
    }
  });
  d.df = true;
  d.mat = skin;
  d.mat2 = sk;
  d.base = skin.color.clone();
  d.rig = R;
  d.seed = seed;
  grunts.push(d);
}
// summoning, one button per kind: each press brings one, from a random point round the clearing. All of them are gone for good when they die
// what each kind of enemy is, in numbers: hit points, speed over the ground, how far from the fire it stops to attack, seconds per attack,
// how wide and heavy it is for collision, how high on it a shot lands, and how high its health bar floats
const FOES = {
  grunt: { hp: 3, speed: 2.6, reach: 5.4, swing: 1.05, radius: 0.4, mass: 1, aimY: 1.1, barY: 2.15 },
  brute: { hp: 12, speed: 1.3, reach: 6.0, swing: 1.7, radius: 0.75, mass: 12, aimY: 1.82, barY: 3.55 },
  pish: { hp: 2, speed: 3.0, reach: 4.8, swing: 1.4, radius: 0.34, mass: 1, aimY: 0.45, barY: 1.15 },
  defiler: { hp: 2, speed: 3.2, reach: 2.5, swing: 2.6, radius: 0, mass: 0, aimY: 1.55, barY: 2.35 },
};
// a level may name the spot (at) instead of the angle; the enemy then simply stands there, with no flash of arrival
function spawn(a, kind, at) {
  const pi = kind === 'pish',
    br = kind === 'brute';
  if (grunts.length >= 16) return;
  const r = 11 + Math.random() * 2.5,
    g = new THREE.Group();
  if (at) g.position.copy(at);
  else g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  g.rotation.y = Math.atan2(-g.position.x, -g.position.z);
  scene.add(g);
  const d = {
    g,
    mat: null,
    home: g.position.clone(),
    vel: V3(),
    wob: 0,
    rest: 0,
    char: 0,
    flung: false,
    ft: 0,
    summoned: true,
    k: br ? 1 : pi ? 0.9 + Math.random() * 0.2 : 0.88 + Math.random() * 0.3,
    br,
    def: FOES[kind] || FOES.grunt,
  };
  dummies.push(d);
  (pi ? makePish : kind === 'defiler' ? makeDefiler : makeGrunt)(d, Math.random() * 9);
  if (at) return d;
  const c = pi ? 0x6fd09a : 0x9a5ad0;
  tmpA.copy(g.position).setY(1);
  puff(tmpA, c, pi ? 14 : 30, 3, 0.7, -1);
  ring(tmpA.setY(0.06), pi ? 0.8 : 1.3, c, 0.6);
  flash(tmpA.setY(1), c, pi ? 6 : 14);
  return d;
}
function summon(kind) {
  spawn(Math.random() * 6.283, kind);
}
function banish(d) {
  scene.remove(d.g);
  if (d.bar) scene.remove(d.bar.g);
  if (d.club) scene.remove(d.club);
  for (const o of d.club ? [d.g, d.club] : [d.g])
    o.traverse((m) => {
      if (m.isMesh && !m.isSkinnedMesh) m.geometry.dispose();
    });
  d.mats.forEach((m) => m.dispose());
  grunts.splice(grunts.indexOf(d), 1);
  dummies.splice(dummies.indexOf(d), 1);
}
const GS = [1.2, 1.1, 1.28],
  kf = (u, K) => {
    for (let i = 0; i < K.length - 1; i++)
      if (u <= K[i + 1][0]) {
        let t = (u - K[i][0]) / (K[i + 1][0] - K[i][0]);
        t = t * t * (3 - 2 * t);
        return K[i][1] + (K[i + 1][1] - K[i][1]) * t;
      }
    return K[K.length - 1][1];
  };
// three strikes, picked at random each swing. Each gives the club arm, forearm and wrist angles, the torso twist and the forward lean at a moment u of the swing (0..1); in all of them the wrist lets go last
const pulseS = (u) => (u > 0.4 && u < 0.62 ? Math.sin(((u - 0.4) / 0.22) * Math.PI) : 0),
  STRIKES = [
    (u) => ({
      a: [
        0.35,
        kf(u, [
          [0, 0.2],
          [0.35, -0.75],
          [0.5, 1.45],
          [0.68, 1.6],
          [1, 0.2],
        ]),
        kf(u, [
          [0, -0.6],
          [0.35, -1.0],
          [0.5, -0.7],
          [0.7, -0.55],
          [1, -0.6],
        ]),
      ],
      f: [
        0,
        kf(u, [
          [0, 0.6],
          [0.35, 1.25],
          [0.43, 1.2],
          [0.5, 0.15],
          [0.7, 0.3],
          [1, 0.6],
        ]),
        0,
      ], // forehand: right to left
      w: [
        0,
        kf(u, [
          [0, -1.2],
          [0.35, -2.2],
          [0.43, -2.1],
          [0.5, -1.0],
          [0.68, -0.5],
          [1, -1.2],
        ]),
      ],
      tw: kf(u, [
        [0, 0],
        [0.35, -0.5],
        [0.5, 0.5],
        [0.7, 0.55],
        [1, 0],
      ]),
      lean: pulseS(u) * 0.3,
    }),
    (u) => ({
      a: [
        0.2,
        kf(u, [
          [0, 0.2],
          [0.35, 1.55],
          [0.5, -0.35],
          [0.68, -0.6],
          [1, 0.2],
        ]),
        kf(u, [
          [0, -0.6],
          [0.35, -0.8],
          [0.5, -0.75],
          [0.7, -0.9],
          [1, -0.6],
        ]),
      ],
      f: [
        0,
        kf(u, [
          [0, 0.6],
          [0.35, 1.4],
          [0.43, 1.3],
          [0.5, 0.1],
          [0.7, 0.2],
          [1, 0.6],
        ]),
        0,
      ], // backhand: club folded across his chest, then lashed out to the right
      w: [
        0,
        kf(u, [
          [0, -1.2],
          [0.35, -0.2],
          [0.43, -0.3],
          [0.5, -1.5],
          [0.68, -2.1],
          [1, -1.2],
        ]),
      ],
      tw: kf(u, [
        [0, 0],
        [0.35, 0.5],
        [0.5, -0.4],
        [0.7, -0.5],
        [1, 0],
      ]),
      lean: pulseS(u) * 0.2,
    }),
    (u) => ({
      a: [
        kf(u, [
          [0, -0.6],
          [0.35, -2.7],
          [0.42, -2.6],
          [0.5, -0.95],
          [0.68, -0.7],
          [1, -0.6],
        ]),
        0,
        0.3,
      ],
      f: [
        kf(u, [
          [0, -0.7],
          [0.35, -1.5],
          [0.44, -1.4],
          [0.5, -0.15],
          [0.7, -0.3],
          [1, -0.7],
        ]),
        0,
        0,
      ], // chop: club dropped behind his head, then brought down in front
      w: [
        kf(u, [
          [0, 0.4],
          [0.35, -0.4],
          [0.44, -0.3],
          [0.5, 1.2],
          [0.68, 1.5],
          [1, 0.4],
        ]),
        0,
      ],
      tw: kf(u, [
        [0, 0],
        [0.35, -0.2],
        [0.5, 0.15],
        [1, 0],
      ]),
      lean: kf(u, [
        [0, 0],
        [0.35, -0.3],
        [0.5, 0.45],
        [0.75, 0.2],
        [1, 0],
      ]),
    }),
  ];
// pishacha attacks, picked at random each time and thrown with either hand. Each gives the striking arm (as the right one; mirrored for the left), its forearm, how far the body rears off its hands, the torso twist, a lunge forward, a hop, and how far the legs kick out
const PB = [0.06, 0.14, -0.3]; // bound: mean lift, swing and phase of the body's height
const PA = (o) => Object.assign({ lean: 0, w: [0, 0], hop: 0, leg: 0, lunge: 0, tw: 0, both: 0 }, o),
  PATK = [
    (u) =>
      PA({
        a: [
          kf(u, [
            [0, -1.55],
            [0.3, -2.9],
            [0.42, -0.7],
            [0.62, -1.2],
            [1, -1.55],
          ]),
          0,
          0.45,
        ],
        f: kf(u, [
          [0, -0.3],
          [0.3, -1.3],
          [0.42, -0.05],
          [0.62, -0.3],
          [1, -0.3],
        ]), // overhead rake: rears up, claw high, tears down
        rear: kf(u, [
          [0, 0],
          [0.3, 1],
          [0.42, 0.2],
          [0.7, 0],
          [1, 0],
        ]),
        tw: kf(u, [
          [0, 0],
          [0.3, -0.4],
          [0.42, 0.4],
          [0.7, 0],
          [1, 0],
        ]),
        lunge: kf(u, [
          [0, 0],
          [0.3, -0.06],
          [0.42, 0.14],
          [0.75, 0],
          [1, 0],
        ]),
        hit: 0.42,
      }),
    (u) =>
      PA({
        a: [
          kf(u, [
            [0, -1.55],
            [0.3, -1.0],
            [0.44, -2.6],
            [0.62, -1.9],
            [1, -1.55],
          ]),
          0,
          0.3,
        ],
        f: kf(u, [
          [0, -0.3],
          [0.3, -1.5],
          [0.44, -0.05],
          [0.62, -0.3],
          [1, -0.3],
        ]), // pounce: sinks back, springs forward with both claws out, drops back
        rear: kf(u, [
          [0, 0],
          [0.3, 0.35],
          [0.44, 0.55],
          [0.62, 0.15],
          [1, 0],
        ]),
        lunge: kf(u, [
          [0, 0],
          [0.3, -0.2],
          [0.44, 0.6],
          [0.6, 0.55],
          [1, 0],
        ]),
        hop: kf(u, [
          [0, 0],
          [0.3, -0.03],
          [0.4, 0.2],
          [0.5, 0.06],
          [0.62, 0],
          [1, 0],
        ]),
        leg: kf(u, [
          [0, 0],
          [0.3, -0.3],
          [0.44, 0.9],
          [0.62, 0.3],
          [1, 0],
        ]),
        both: 1,
        hit: 0.44,
      }),
    (u) =>
      PA({
        a: [
          kf(u, [
            [0, -1.55],
            [0.3, -0.2],
            [0.5, -0.2],
            [0.8, -1.55],
            [1, -1.55],
          ]),
          kf(u, [
            [0, 0],
            [0.3, -0.5],
            [0.44, 1.7],
            [0.58, 1.8],
            [0.8, 0],
            [1, 0],
          ]),
          kf(u, [
            [0, 0.45],
            [0.3, -0.7],
            [0.55, -0.6],
            [0.8, 0.45],
            [1, 0.45],
          ]),
        ],
        f: kf(u, [
          [0, -0.3],
          [0.3, -0.9],
          [0.44, -0.05],
          [0.8, -0.3],
          [1, -0.3],
        ]), // side slash: arm flung wide, swept flat across the front
        rear: kf(u, [
          [0, 0],
          [0.3, 0.8],
          [0.58, 0.7],
          [0.85, 0],
          [1, 0],
        ]),
        tw: kf(u, [
          [0, 0],
          [0.3, -0.5],
          [0.44, 0.5],
          [0.58, 0.6],
          [0.85, 0],
          [1, 0],
        ]),
        hit: 0.44,
      }),
  ];
// the brute's blows, heavy and from four angles: a sweep across from his right · a backhand from his left · both hands straight down · a diagonal cut from high right to low left
const BSTR = [
  (u) => STRIKES[0](u),
  (u) => STRIKES[1](u),
  (u) => {
    const c = STRIKES[2](u);
    return { ...c, aL: [c.a[0], 0, -0.3], fL: [c.f[0], 0, 0], lean: c.lean * 1.2 };
  },
  (u) => {
    const a = STRIKES[0](u),
      c = STRIKES[2](u),
      m = (x, y) => x * 0.5 + y * 0.5;
    return {
      a: [m(a.a[0], c.a[0]), m(a.a[1], c.a[1]), m(a.a[2], c.a[2])],
      f: [m(a.f[0], c.f[0]), m(a.f[1], c.f[1]), 0],
      w: [m(a.w[0], c.w[0]), m(a.w[1], c.w[1])],
      tw: a.tw * 0.8,
      lean: m(a.lean, c.lean),
    };
  },
];
function gruntUpdate(dt) {
  for (const d of grunts) {
    const B = d.rig.bone,
      g = d.g,
      R = d.rig.group;
    if (d.hp === undefined) {
      d.hp0 = d.hp = d.def.hp;
      d.rng = d.def.reach + (d.pi ? (d.seed % 1) * 0.8 : d.df ? (d.seed % 1) * 0.6 : 0);
      d.pw = 0;
      d.wW = 0;
      d.wA = 0;
      d.ph = d.seed * 2;
      d.at = 0;
      d.dead = 0;
      d.lu = 0;
    }
    // health: every fresh blow costs one, a heavy one costs all three, and so does burning through; being flung away sends him back to the start
    const r0 = Math.hypot(g.position.x, g.position.z) || 1;
    if (d.flung) d.wasFlung = true;
    else if (d.wasFlung) {
      d.wasFlung = false;
      d.hp = d.hp0;
      d.char = 0;
    }
    if (!d.dead && !d.flung) {
      if (d.wob > d.pw + 0.25) {
        d.hp -= d.vel.length() > 6 ? 3 : 1;
        const fl = Math.floor(d.at),
          uu = d.at - fl;
        if (uu < 0.48) d.at = fl + Math.max(0, uu - 0.16);
        d.hitch = 0.22;
      }
      if (d.char > 0.7) d.hp = 0;
      if (d.hp <= 0) {
        d.dead = 0.0001;
        d.vel.multiplyScalar(0.4);
        d.rg = Array.from({ length: 6 }, () => Math.random());
        if (d.vel.length() > 0.8) g.rotation.y = Math.atan2(-d.vel.x, -d.vel.z);
        if (d.club) {
          scene.attach(d.club);
          d.club.scale.setScalar((d.br ? 1.3 : 1) * d.sz * (d.k || 1));
        }
        d.cv = V3((-g.position.x / r0) * 0.8, 1.6, (-g.position.z / r0) * 0.8);
        d.mats.forEach((m) => {
          if (!m.userData.dis) {
            m.transparent = true;
            m.needsUpdate = true;
          }
        });
        d.dk = d.pi ? (Math.random() * 4) | 0 : 0;
        if (d.br) R.rotation.z = 0;
        d.dD = d.br ? 0.95 : d.df ? 0.6 : [0.45, 0.45, 0.5, 0.55][d.dk];
        if (d.df) {
          d.px0 = R.rotation.x;
          d.dy0 = R.position.y;
        }
        d.ds = Math.random() < 0.5 ? -1 : 1;
        if (d.dk === 3) d.vel.set(-Math.sin(g.rotation.y) * 2.6, 0, -Math.cos(g.rotation.y) * 2.6);
      }
    }
    d.pw = d.wob;
    d.rest = 0;
    d.fw = (d.fw || 0) + (d.wob - (d.fw || 0)) * Math.min(1, dt * (d.wob > (d.fw || 0) ? 14 : 30));
    if (d.br) d.vel.multiplyScalar(Math.max(0, 1 - dt * 12));
    // (d.fw above is the flinch: it eases in over a few frames instead of snapping to full on the frame of the hit)
    // hit-point bar: appears over an enemy once it has been hurt, always facing the camera. The fill slides down to its new level, and on the killing blow it drains to nothing before the bar goes
    if (d.hp < d.hp0 && (!d.dead || d.barV > 0.03)) {
      if (!d.bar) {
        d.barV = 1;
        const bg = new THREE.Sprite(HPBG),
          fg = new THREE.Sprite(HPFG),
          bg2 = new THREE.Group();
        bg.scale.set(0.76, 0.11, 1);
        fg.center.set(0, 0.5);
        fg.renderOrder = 11;
        bg.renderOrder = 10;
        bg2.add(bg, fg);
        scene.add(bg2);
        d.bar = { g: bg2, fg };
      }
      const b = d.bar;
      b.g.visible = true;
      b.g.position.set(g.position.x, g.position.y + d.def.barY * (d.pi || d.df ? 1 : d.k || 1), g.position.z);
      b.fg.position.setFromMatrixColumn(cam.matrixWorld, 0).multiplyScalar(-0.35);
      d.barV += (Math.max(0, d.hp) / d.hp0 - d.barV) * Math.min(1, dt * 7);
      b.fg.scale.set(0.7 * d.barV, 0.07, 1);
    } else if (d.bar) d.bar.g.visible = false;
    // what he is making for: the altar fire, unless a level has given him something else (d.to, a point that may move).
    // d.wait keeps him standing where he is, doing nothing, until the level lets him go
    const ox = d.to ? d.to.x : 0,
      oz = d.to ? d.to.z : 0,
      r = Math.hypot(g.position.x - ox, g.position.z - oz) || 1,
      stag = (!d.br && d.wob > 0.6) || d.hold > 0 || d.flung || d.dead > 0 || d.wait,
      walking = !stag && r > d.rng,
      attacking = !stag && !walking;
    // he comes in at a run, weaving from side to side, and turns to face wherever he is heading; once in range he squares up to the fire, bouncing on his feet
    {
      const nx = (ox - g.position.x) / r,
        nz = (oz - g.position.z) / r,
        sp = d.pi && d.cr ? 2.6 : d.def.speed,
        bm = d.pi && !d.cr ? 1 + 0.4 * Math.sin(d.ph - 0.3) : 1,
        lat = !walking
          ? 0
          : d.df
            ? Math.sin(T * 1.3 + d.seed * 3) * 0.9
            : d.pi
              ? Math.sin(T * 1.6 + d.seed * 3) * 1.2
              : d.br
                ? 0
                : Math.sin(T * 1.9 + d.seed * 3) * 1.4,
        vx = nx * sp - nz * lat,
        vz = nz * sp + nx * lat;
      if (walking) {
        g.position.x += vx * bm * dt;
        g.position.z += vz * bm * dt;
        d.ph += dt * (d.br ? 3.2 : d.pi ? (d.cr ? 8.5 : 11.5) : 10);
      }
      if (!d.flung && !d.dead) {
        const want = walking ? Math.atan2(vx, vz) : Math.atan2(nx, nz);
        g.rotation.y += Math.atan2(Math.sin(want - g.rotation.y), Math.cos(want - g.rotation.y)) * Math.min(1, dt * 9);
        R.position.y =
          d.pi || d.df
            ? R.position.y
            : d.br
              ? -0.04 * d.sz - 0.06 * Math.abs(Math.sin(d.ph)) * d.wW
              : -0.04 + 0.035 * Math.abs(Math.sin(T * 5 + d.seed)) * d.wA;
      }
    }
    d.wW += ((walking ? 1 : 0) - d.wW) * Math.min(1, dt * 6);
    d.wA += ((attacking ? 1 : 0) - d.wA) * Math.min(1, dt * 6);
    // every hit that lands during the wind-up knocks the swing back a little and holds it for a moment, even on a brute that cannot be staggered.
    // a strike that is interrupted (he is hit and reels) is not thrown away on the spot: the swing holds where it was while its weight fades out, and picks up again from there if he recovers in time
    // attack: a sidearm swing. He coils to his right with the club cocked back, whips his torso round, and the forearm and wrist snap through last so the club head flicks across in front of him
    {
      const was = Math.floor(d.at);
      d.hitch = Math.max(0, (d.hitch || 0) - dt);
      d.at = attacking && !d.hitch ? d.at + dt / d.def.swing : attacking || d.wA >= 0.05 ? d.at : 0;
      if (Math.floor(d.at) !== was || d.sk === undefined) {
        d.sk = (Math.random() * (d.br ? BSTR.length : STRIKES.length)) | 0;
        d.sd = Math.random() < 0.5 ? -1 : 1;
      }
    }
    const u = d.at % 1,
      wind = 0,
      S = d.pi ? PATK[d.sk](u) : d.br ? BSTR[d.sk](u) : STRIKES[d.sk](u),
      smash = S.lean * d.wA,
      aw = d.df
        ? 0
        : kf(u, [
            [0, 0],
            [0.32, 1],
            [0.76, 1],
            [1, 0],
          ]) * d.wA,
      tw = d.df ? 0 : S.tw * d.wA * (d.pi ? d.sd : 1),
      Ap = d.pi ? {} : S.aL ? { armR: S.a, foreR: S.f, armL: S.aL, foreL: S.fL } : { armR: S.a, foreR: S.f },
      wrist = S.w,
      lg = (S.leg || 0) * d.wA;
    if (d.pi) {
      if (attacking && d.lu < S.hit && u >= S.hit)
        for (const h of S.both ? [B.handR, B.handL] : [d.sd > 0 ? B.handR : B.handL]) {
          h.getWorldPosition(tmpA);
          puff(tmpA, 0xffd0c0, 7, 2.2, 0.25, 2);
        }
    } else if (!d.df && attacking && d.lu < 0.48 && u >= 0.48) {
      d.club.localToWorld(tmpA.set(0, 0.42, 0));
      puff(tmpA, 0xffe2b0, 16, 3.2, 0.3, 2);
      flash(tmpA, 0xffc890, 10);
      shake = Math.max(shake, d.br ? 0.14 : 0.05);
      // the moment the blow lands: a level that wants it to hurt someone says how
      if (d.onHit) d.onHit();
      if (d.sk === 2) {
        tmpA.y = 0.08;
        puff(tmpA, 0xffd9a0, d.br ? 40 : 14, d.br ? 4 : 2.4, d.br ? 0.6 : 0.4, 3);
      }
    }
    d.lu = u;
    if (d.br) {
      const st2 = Math.sin(d.ph) > 0;
      if (walking && st2 !== d.stp) puff(tmpA.set(g.position.x, 0.08, g.position.z), 0xd9b98a, 8, 1.6, 0.5, 2);
      d.stp = st2;
    }
    // defiler: flies level with wings beating, slows to a hover near the altar, and every few seconds tips its pot so a stream of filth falls on the fire
    if (d.df && !d.dead) {
      const fa = T * (9 + 3 * d.wA) + d.seed * 5,
        flap = 0.12 + (0.5 + 0.15 * d.wA) * Math.sin(fa),
        pour =
          kf(u, [
            [0, 0],
            [0.3, 0],
            [0.42, 1],
            [0.72, 1],
            [0.85, 0],
            [1, 0],
          ]) * d.wA;
      d.pour = pour;
      d.wingL.rotation.y = flap;
      d.wingR.rotation.y = -flap;
      R.rotation.x = 1.15 - 0.4 * d.wA + pour * 0.15 - d.wob * 0.4;
      R.rotation.z = Math.cos(T * 1.3 + d.seed * 3) * 0.22 * d.wW;
      R.position.y = 1.2 + 0.3 * d.wA - 0.07 * Math.sin(fa - 0.9) - d.wob * 0.25;
      R.position.z = -0.7 + 0.25 * d.wA;
      d.club.parent.getWorldQuaternion(DQ1).invert();
      d.club.quaternion.copy(DQ1).multiply(DQ2.setFromAxisAngle(tmpA.set(Math.cos(g.rotation.y), 0, -Math.sin(g.rotation.y)), pour * 1.25));
      if (pour > 0.5) {
        if ((d.gt = (d.gt || 0) - dt) <= 0) {
          d.gt = 0.08;
          glob(d.club.localToWorld(tmpA.set(0, -0.09, 0)));
        }
      } else if (Math.random() < dt * 2.5) puff(d.club.localToWorld(tmpA.set(0, -0.2, 0)), 0x6ee040, 1, 0.2, 0.5, 3);
    }
    if (d.pi && !d.dead) {
      R.position.y = d.by + (d.cr ? 0.03 + 0.03 * Math.sin(d.ph * 2) : PB[0] + PB[1] * Math.sin(d.ph + PB[2])) * d.wW + S.hop * d.wA;
      R.position.z = S.lunge * 0.9 * d.wA;
    } else if (d.pi) R.position.z *= 0.9;
    // death: he topples onto his back, lies a moment, then withers away in dark wisps and a fresh one sets out from the start
    let f = 0;
    if (d.dead > 0) {
      d.dead += dt;
      const DD = d.dD || 0.45,
        k = Math.min(1, d.dead / DD);
      f = k * k;
      const sc = Math.max(0, 1 - Math.max(0, d.dead - 1.3) / 0.8);
      {
        const tb = Math.max(0, d.dead - DD),
          bn = k >= 1 ? 0.07 * Math.exp(-7 * tb) * Math.abs(Math.sin(14 * tb)) : 0,
          dk = d.dk || 0,
          air = Math.sin(k * Math.PI);
        // four ways down for a pishacha, none of them a spin: flipped onto its back · flat on its face · toppled onto its side · knocked off its feet backwards
        if (d.df) {
          R.rotation.x = d.px0 + (1.5708 - d.px0) * f - bn * 0.5;
          R.rotation.z *= 0.9;
          d.wingL.rotation.y += (1.25 - d.wingL.rotation.y) * Math.min(1, dt * 8);
          d.wingR.rotation.y = -d.wingL.rotation.y;
        } else if (dk === 1) R.rotation.x = 1.5708 * (f - bn);
        else if (dk === 2) R.rotation.z = d.ds * 1.5708 * (f - bn);
        else R.rotation.x = -1.5708 * (f - bn);
        R.position.y = d.df
          ? Math.max(0.12, d.dy0 - 4.5 * d.dead * d.dead)
          : (d.pi ? d.by * (1 - f) - 0.04 * f : -0.04 * (d.sz || 1)) + 0.15 * (d.sz || 1) * f + (dk === 3 ? 0.3 : 0) * air;
      }
      d.mats.forEach((m) => {
        if (m.userData.dis) m.userData.dis.value = 1 - sc;
        else m.opacity = sc;
      }); // the body crumbles away; the few plain parts (the eyes) fade with it
      if (d.club) {
        const c = d.club;
        if (c.position.y > 0.075) {
          d.cv.y -= 9 * dt;
          c.position.addScaledVector(d.cv, dt);
          c.rotation.x += dt * 5;
          if (c.position.y <= 0.075) {
            c.position.y = 0.075;
            c.rotation.set(Math.PI / 2, 0, d.seed * 2.3 + 0.6);
            if (d.df) puff(c.position, 0x6ee040, 22, 2.4, 0.5, 3);
            else puff(c.position, 0xffd9a0, 5, 1.2, 0.3, 2);
          }
        }
      }
      if (d.dead > 1.3)
        puff(tmpA.set(g.position.x + (Math.random() - 0.5) * 0.6, 0.2, g.position.z + (Math.random() - 0.5) * 0.9), 0x9a5ad0, 2, 0.5, 0.6, -2.5);
      if (d.dead > 2.3) {
        banish(d);
        continue;
      }
    }
    const t = T * 1.15 + d.seed * 2.1,
      P = idle(t),
      Wk = d.br ? walk(d.ph) : run(d.ph),
      w = d.dead ? 0 : d.fw * (d.br ? 0.15 : 0.5),
      fl = d.flung ? 1 : 0,
      br = Math.sin(t * 2.1),
      st = 1 - d.wW;
    // pishacha: at rest it is on hands and knees with a level back. Half of them crawl in, opposite hand and knee together with the spine snaking; the other half bound: both hands reach out and land, the body folds over them as the legs tuck through, then the legs drive it forward into the air again
    const sg = Math.sin(d.ph),
      cg = Math.cos(d.ph),
      W = d.wW,
      A = d.wA,
      mx = (x, y) => x + (y - x) * W,
      bnd = d.cr ? 0 : 1,
      bs = sg * bnd,
      bc = cg * bnd,
      ks = d.cr ? sg * W : 0,
      kc = d.cr ? cg * W : 0,
      rear = d.pi ? S.rear * A : 0;
    const HP = mx(1.1, 1.1 + 0.1 * bs - 0.2 * Math.max(0, bc)) - rear * 0.45,
      sX = mx(0.25, 0.25 - 0.25 * bs) - rear * 0.1 - w * 0.3 + br * 0.015,
      cX = mx(0.2, 0.2 - 0.1 * bs) - rear * 0.1 + br * 0.03,
      LT = HP + sX + cX;
    const ax = -LT + mx(0, -0.2 * bnd - 0.7 * bs) - w * 0.4,
      fx0 = mx(-0.3, -0.3 - 0.9 * Math.max(0, -bs) - 0.6 * Math.max(0, bc)),
      actR = d.pi && (S.both || d.sd > 0) ? A : 0,
      actL = d.pi && (S.both || d.sd < 0) ? A : 0,
      lp = (x, y, k) => x + (y - x) * k,
      th = mx(-0.2, -0.2 - 0.3 * bnd + 1.4 * bs) + (d.pi ? S.leg * A : 0) - HP,
      sh = mx(1.6, 1.6 - 0.35 * bnd - 0.75 * bs + 0.5 * Math.max(0, bc)) - (d.pi ? S.leg * A * 0.8 : 0),
      ft = mx(0.5, 0.5 - 0.3 * bnd + 0.5 * bs);
    const hv = d.wA,
      pr = d.pour || 0,
      kk = Math.sin(t * 3) * 0.08,
      O = d.df
        ? {
            spine: [-0.1 - w * 0.3, 0, 0],
            chest: [-0.15 + br * 0.03, 0, 0],
            neck: [-0.55 + 0.25 * hv, 0, 0],
            head: [-0.6 + 0.3 * hv, Math.sin(t * 0.9) * 0.2, 0],
            armR: [-2.05 + 0.4 * hv - 0.3 * pr, 0, 0.95],
            foreR: [-0.25 - 0.3 * hv + 0.3 * pr, 0, 0],
            armL: [-2.05 + 0.4 * hv - 0.3 * pr, 0, -0.95],
            foreL: [-0.25 - 0.3 * hv + 0.3 * pr, 0, 0],
            legL: [0.1 - 0.5 * hv + kk, 0, 0.08],
            legR: [0.1 - 0.5 * hv - kk, 0, -0.08],
            shinL: [0.2 + 0.6 * hv, 0, 0],
            shinR: [0.25 + 0.6 * hv, 0, 0],
            footL: [0.7, 0, 0],
            footR: [0.7, 0, 0],
          }
        : d.pi
          ? {
              hips: [HP, ks * 0.22, 0],
              spine: [sX, -ks * 0.12, 0],
              chest: [cX, -ks * 0.1, 0],
              neck: [-0.6, 0, 0],
              head: [-0.85 - (LT - 1.55) * 0.8 - w * 0.3, Math.sin(t * 1.1) * 0.25 * st * (1 - A), 0],
              armR: [lp(ax - ks * 0.5, S.a[0], actR), lp(0, S.a[1], actR), lp(0.45, S.a[2], actR) - fl * 0.6],
              foreR: [lp(fx0 - Math.max(0, kc) * 0.6, S.f, actR), 0, 0],
              armL: [lp(ax + ks * 0.5, S.a[0], actL), lp(0, -S.a[1], actL), lp(-0.45, -S.a[2], actL) + fl * 0.6],
              foreL: [lp(fx0 - Math.max(0, -kc) * 0.6, S.f, actL), 0, 0],
              legL: [th - ks * 0.8, 0, 0.22 + Math.max(0, kc) * 0.25],
              legR: [th + ks * 0.8, 0, -0.22 - Math.max(0, -kc) * 0.25],
              shinL: [sh + ks * 0.8 + Math.max(0, kc) * 0.6, 0, 0],
              shinR: [sh - ks * 0.8 + Math.max(0, -kc) * 0.6, 0, 0],
              footL: [ft, 0, 0],
              footR: [ft, 0, 0],
            }
          : {
              spine: [0.3 - w * 0.45 + br * 0.015 - wind * 0.2 + smash * 0.32 - 0 * 0.3, 0, 0],
              chest: [0.16 + br * 0.03 - w * 0.2 + smash * 0.2 - 0 * 0.16, wind * -0.25, 0],
              neck: [-0.1, 0, 0],
              head: [-0.3 - w * 0.45 + smash * 0.15, 0, 0],
              armL: [-0.1 - fl * 0.6 - smash * 0.3, 0, 0.26 + w * 0.5 + fl * 0.6 - br * 0.02],
              foreL: [-0.4 + w * 0.3, 0, 0],
              armR: [-0.45 - w * 0.5 - wind * 2.3 - smash * 0.5 + 0 * 0.4, 0, -0.2 - w * 0.4 - fl * 0.6],
              foreR: [-0.75 + br * 0.05 - wind * 0.5 + smash * 0.45 + 0 * 0.5, 0, 0],
              legL: [-0.32 * st + 0 * 0.25, 0, 0.13 + 0 * 0.2],
              legR: [-0.32 * st + 0 * 0.25 - lg * 1.15, 0, -0.13 - 0 * 0.2],
              shinL: [0.6 * st - 0 * 0.3, 0, 0],
              shinR: [0.6 * st - 0 * 0.3 + lg * 1.5, 0, 0],
              footL: [-0.28 * st, 0, 0],
              footR: [-0.28 * st, 0, 0],
            };
    // dead: every joint goes limp. The limbs trail behind as he drops, flop once when he lands, and settle flat in a slightly different sprawl each time
    const rg = d.rg || [0, 0, 0, 0, 0, 0],
      k = Math.min(1, d.dead / (d.dD || 0.45)),
      sw = f > 0 && k < 1 ? Math.sin(k * Math.PI) : 0,
      tau = Math.max(0, d.dead - (d.dD || 0.45)),
      fp = f > 0 && k >= 1 ? Math.exp(-6 * tau) * Math.cos(13 * tau) : 0;
    const Dp =
      f > 0
        ? {
            head: [0.35 * sw - 0.05, rg[0] * 0.7 * f, 0],
            armL: [-1.1 * sw - 0.3 * fp, 0, d.pi ? -0.35 + rg[1] * 0.9 : 0.2 + rg[1] * 0.5],
            foreL: [-0.5 * sw - (d.pi ? (0.3 + rg[2]) * f : 0), 0, rg[2] * 0.5],
            armR: [-1.3 * sw - 0.35 * fp, 0, d.pi ? 0.35 - rg[3] * 0.9 : -0.2 - rg[3] * 0.5],
            foreR: [-0.6 * sw - (d.pi ? (0.3 + rg[4]) * f : 0), 0, -rg[4] * 0.5],
            legL: [-0.55 * sw - 0.12 * fp, 0, 0.1 + rg[5] * 0.16],
            legR: [-0.4 * sw - 0.1 * fp, 0, -0.1 - rg[2] * 0.16],
            shinL: [0.7 * sw + (d.pi ? rg[5] * 0.9 * f : 0), 0, 0],
            shinR: [0.5 * sw + (d.pi ? rg[0] * 0.9 * f : 0), 0, 0],
          }
        : null;
    for (const n in B) {
      const arm = d.pi || d.df,
        a = arm ? null : P[n],
        b = arm ? null : n === 'armR' || n === 'foreR' ? a : Wk[n],
        o = O[n],
        dp = Dp && Dp[n];
      if (!a && !b && !o && !Dp) continue;
      const c = [0, 0, 0];
      for (let q = 0; q < 3; q++) {
        c[q] = (a ? a[q] : 0) * st + (b ? b[q] : 0) * d.wW + (o ? o[q] : 0);
        if (Ap[n]) c[q] = c[q] * (1 - aw) + Ap[n][q] * aw;
        if (Dp) c[q] = c[q] * (1 - f) + (dp ? dp[q] : 0);
      }
      if (n === 'hips') c[1] += tw * 0.2;
      else if (n === 'spine') c[1] += tw * 0.35;
      else if (n === 'chest') c[1] += tw * 0.45;
      else if (n === 'head') c[1] -= tw * 0.75;
      else if (n === 'armL' && !d.pi) c[0] += tw * 0.5;
      EG.set(c[0], c[1], c[2]);
      B[n].quaternion.setFromEuler(EG);
    }
    B.handR.quaternion.setFromEuler(EG.set(wrist[0] * aw * (1 - f), wrist[1] * aw * (1 - f), 0));
    if (d.br && !d.dead) {
      const s1 = Math.sin(d.ph) * d.wW;
      R.rotation.z = s1 * 0.055;
      B.hips.quaternion.multiply(DQ1.setFromEuler(EG.set(0, 0, s1 * 0.08)));
      B.spine.quaternion.multiply(DQ1.setFromEuler(EG.set(0, 0, -s1 * 0.1)));
      B.legL.quaternion.multiply(DQ1.setFromEuler(EG.set(0, 0, 0.03)));
      B.legR.quaternion.multiply(DQ1.setFromEuler(EG.set(0, 0, -0.03)));
      B.armL.quaternion.multiply(DQ1.setFromEuler(EG.set(0, 0, 0.18)));
    }
  }
}
