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
    ar = !!d.ar,
    rn = !!d.rn,
    skinC = br ? [0x2f4f8f, 0x35467f, 0x2a5a86][vr[0]] : ar ? 0x5c4450 : rn ? 0xb8862c : 0x4b3f5c,
    skin = toon(skinC, { vertexColors: true, rim: 0.45 }),
    sk = toon(skinC, { rim: 0.45 }),
    cloth = toon(br ? [0xb5601a, 0x8f1f1a, 0x9a7a1e, 0x1f5a55][vr[1]] : ar ? 0x74201c : rn ? 0x2c2622 : 0x5a1410, { vertexColors: true }),
    iron = toon(0x2c2a30, { rim: 0.5 }),
    boneC = toon(0xd8cdb0, { rim: 0.4 }),
    hairC = toon(0x16101c, { rim: 0.25 }),
    eyeC = new THREE.MeshBasicMaterial({ color: 0xffa020 }),
    bronze = toon(0x6a4526, { rim: 0.6 }),
    bronze2 = toon(0x3a2616, { rim: 0.4 }),
    WOOD = toon(0x7a4a22),
    DARK = toon(0x15101a);
  {
    const k = (d.k || 1) * SC;
    // (the archer is the same foot soldier stood up tall: no squatter than a man, where they are short and broad)
    R.group.scale.set((br ? 1.12 : ar ? 0.96 : 1.0) * k, (ar ? 1.0 : 0.9) * k, (br ? 1.16 : ar ? 0.96 : 1.04) * k);
  }
  R.group.position.y = -0.04 * SC;
  g.add(R.group);
  if (br) {
    R.on('spine', sph(new THREE.Group(), 0.175, sk, [0, 0, 0], [1.12, 1, 1.02]).parent, [0, 1.14, 0.045]);
    R.on('chest', sph(new THREE.Group(), 0.19, sk, [0, 0, 0], [1.22, 0.85, 0.92]).parent, [0, 1.36, 0.02]);
    for (const s of [-1, 1]) R.on('chest', sph(new THREE.Group(), 0.11, sk, [0, 0, 0], [1.1, 0.95, 1.05]).parent, [s * 0.215, 1.46, -0.02]);
  } // the brute: a great belly, a slab of chest and heaped shoulders
  const body = R.skin(V.body.geometry, skin);
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
    if (!ar) R.on('fore' + S, m, L3(a, e, 0.75));
    else {
      // the archer's arms and legs are armoured: a long bronze bracer on each forearm and a greave on each shin, each
      // bound top and bottom with a darker band, and a gold ring round the upper arm
      for (const [bn, to, t, r0, r1, len] of [
        ['fore', 'hand', 0.52, 0.05, 0.043, 0.15],
        ['shin', 'foot', 0.5, 0.06, 0.05, 0.27],
      ]) {
        const a2 = R3(bn + S),
          e2 = R3(to + S),
          q = new THREE.Group();
        q.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(a2[0] - e2[0], a2[1] - e2[1], a2[2] - e2[2]).normalize());
        cyl(q, r0, r1, len, bronze, [0, 0, 0]);
        for (const y of [-1, 1]) tor(q, y > 0 ? r0 + 0.004 : r1 + 0.004, 0.008, bronze2, [0, (y * len) / 2, 0], [Math.PI / 2, 0, 0]);
        R.on(bn + S, q, L3(a2, e2, t));
      }
      const a2 = R3('arm' + S),
        e2 = R3('fore' + S),
        q = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.012, 8, 24), gold);
      q.quaternion.setFromUnitVectors(V3(0, 0, 1), V3(e2[0] - a2[0], e2[1] - a2[1], e2[2] - a2[2]).normalize());
      R.on('arm' + S, q, L3(a2, e2, 0.5));
    }
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
  if (ar) {
    // The archer is a rakshasa of Lanka's army, and no hunter: the foot soldier's own dusky hide, horns, tusks and burning
    // eyes, but a soldier's bearing and a soldier's bronze. His head is bare; a gold ring hangs in each ear
    // (his head is the foot soldier's own size. The body it sits on is narrower and taller than theirs, and on average a
    // little smaller, which shrank and narrowed the head with it; this puts it back)
    head.scale.set(1.12, 0.97, 1.16);
    for (const e of [-1, 1]) tor(head, 0.03, 0.009, gold, [e * 0.14, -0.07, 0.0], [0, Math.PI / 2, 0]);
    // The armour. A cuirass of bronze scales in three courses (chest, belly, and a short skirt of plates over the hips),
    // each course lapping the one below and edged with a darker band; a leather strap across it from his left shoulder; a
    // broad belt with a gold boss at the front and a tongue of gold-edged cloth hanging from it; and on his right shoulder
    // alone one great guard of gilded bronze with a spike, which is what marks him out from far off
    const course = (bn, y, r0, r1, h) => {
      const q = R.on(bn, new THREE.Group(), [0, y, 0.008]);
      q.scale.set(1, 1, 0.74);
      add(q, new THREE.CylinderGeometry(r0, r1, h, 20, 1, true), bronze);
      tor(q, r1 + 0.003, 0.01, bronze2, [0, -h / 2, 0], [Math.PI / 2, 0, 0]);
      for (let i = 1; i < 3; i++) tor(q, r0 + ((r1 - r0) * i) / 3 + 0.002, 0.004, bronze2, [0, h / 2 - (h * i) / 3, 0], [Math.PI / 2, 0, 0]);
    };
    course('hips', 0.99, 0.172, 0.21, 0.15);
    course('spine', 1.14, 0.168, 0.176, 0.19);
    course('chest', 1.335, 0.2, 0.178, 0.23);
    const st = R.on('chest', new THREE.Group(), [0, 1.3, 0.008]);
    st.rotation.z = 0.75;
    tor(st, 0.212, 0.016, toon(0x4a2c18, { rim: 0.2 }), [0, 0, 0], [Math.PI / 2, 0, 0], [1, 0.72, 0.62]);
    sph(R.on('hips', new THREE.Group(), [0, 1.03, 0.135]), 0.05, gold, [0, 0, 0], [1.1, 1, 0.5]);
    {
      const t = R.on('hips', new THREE.Group(), [0, 0.86, 0.15]);
      // (its own plain cloth: the dhoti's is coloured point by point, which a plain box is not)
      add(t, new THREE.BoxGeometry(0.11, 0.3, 0.012), toon(0x8a2a20, { rim: 0.15 }), [0, 0, 0], [0.06, 0, 0]);
      add(t, new THREE.BoxGeometry(0.115, 0.03, 0.014), gold, [0, -0.135, 0.008], [0.06, 0, 0]);
    }
    {
      const pg = R.on('chest', new THREE.Group(), [-0.235, 1.5, 0]);
      pg.rotation.z = 0.35;
      sph(pg, 0.115, gold, [0, 0, 0], [1.25, 0.72, 1.2]);
      sph(pg, 0.105, bronze, [-0.05, -0.05, 0], [1.2, 0.5, 1.25]);
      tor(pg, 0.11, 0.012, bronze2, [0, -0.02, 0], [Math.PI / 2, 0, 0], [1.25, 1.2, 1]);
      cyl(pg, 0.003, 0.03, 0.12, boneC, [-0.03, 0.11, 0], [0, 0, 0.5]);
    }
  } else if (rn) {
    // The runner: a small ochre-yellow rakshasa, bare-headed, with a strip of pale cloth bound round his brow and nothing on him
    // to slow him down. He is told by his size, his colour and his pace
    tor(head, 0.127, 0.02, toon(0xd8cdb0, { rim: 0.2 }), [0, 0.05, 0], [Math.PI / 2 - 0.12, 0, 0], [1.05, 1.06, 1]);
  } else if (!br) {
    sph(head, 0.132, hairC, [0, 0.03, -0.045], [1.06, 1.05, 1]);
    sph(head, 0.11, hairC, [0, -0.09, -0.1], [1.25, 1.35, 0.8]);
  } else if (vr[3]) tor(head, 0.022, 0.005, gold, [0, -0.052, 0.138]);
  for (const s of [-1, 1]) {
    sph(head, 0.026, DARK, [s * 0.05, 0, 0.104], [1.3, 0.75, 0.55], [0, 0, s * 0.3]);
    sph(head, 0.013, eyeC, [s * 0.05, -0.002, 0.116], [1.35, 0.55, 0.5], [0, 0, s * 0.3]);
    sph(head, 0.005, DARK, [s * 0.05, -0.002, 0.1225], [0.55, 1.1, 0.4]);
    tusk(head, s, 0.05, -0.088, 0.118, 0.03, 1.25 * Math.PI, 2.35 * Math.PI, 0.016, boneC);
    if (br) tusk(head, s, 0.1, 0.045, -0.005, 0.095, 1.5 * Math.PI, 2.3 * Math.PI, 0.038, boneC);
    // (the archer's horns are curved like the brute's, a little smaller)
    else if (ar) tusk(head, s, 0.095, 0.05, -0.005, 0.085, 1.5 * Math.PI, 2.35 * Math.PI, 0.033, boneC);
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
    if (ar) {
      // The archer's bow is his own thing in the world, as Rama's is, and not fixed in a hand: each frame it is put in his
      // left hand and turned along his aim (see the archer, below), so the hands can be brought to it and to its string.
      // In it +y runs up the stave and +z is the way the arrow goes. A dark recurved bow bound with gold at the grip, each
      // tip a serpent's head in gold; a string that follows his drawing hand; and an iron-headed arrow
      const horn = toon(0x2a1a1c, { rim: 0.4 });
      R.bone.handR.remove(grip);
      add(club, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, -0.56, BOW_Z + 0.015), V3(0, -0.46, BOW_Z - 0.02), V3(0, -0.2, 0.02), V3(0, 0, 0.05), V3(0, 0.2, 0.02), V3(0, 0.46, BOW_Z - 0.02), V3(0, 0.56, BOW_Z + 0.015)]), 28, 0.014, 6), horn);
      for (const y of [-1, 1]) {
        const h = new THREE.Group();
        h.position.set(0, y * 0.57, BOW_Z + 0.03);
        h.rotation.x = y * -0.3;
        club.add(h);
        sph(h, 0.026, gold, [0, 0, 0.012], [0.9, 0.75, 1.5]);
        cyl(h, 0.004, 0.018, 0.045, gold, [0, -0.004, 0.055], [Math.PI / 2, 0, 0]);
        tor(club, 0.016, 0.006, gold, [0, y * 0.5, BOW_Z - 0.01], [Math.PI / 2, 0, 0]);
      }
      for (const y of [-0.07, 0.07]) tor(club, 0.018, 0.007, gold, [0, y, 0.045], [Math.PI / 2, 0, 0]);
      cyl(club, 0.019, 0.019, 0.12, toon(0x6a1a1a, { rim: 0.2 }), [0, 0, 0.047]);
      const sg = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, -0.5, BOW_Z, 0, 0, BOW_Z, 0, 0.5, BOW_Z], 3)),
        str = new THREE.Line(sg, new THREE.LineBasicMaterial({ color: 0xd8cdb0 })),
        arrow = new THREE.Group();
      str.frustumCulled = false;
      club.add(str, arrow);
      cyl(arrow, 0.007, 0.007, 0.72, DARK, [0, 0, 0.36], [Math.PI / 2, 0, 0]);
      cyl(arrow, 0.001, 0.02, 0.08, iron, [0, 0, 0.76], [Math.PI / 2, 0, 0]);
      for (const r of [0, 1.05, 2.1]) add(arrow, new THREE.BoxGeometry(0.003, 0.04, 0.09), DARK, [0, 0, 0.05], [0, 0, r]);
      arrow.visible = false;
      d.bow = { str, arrow };
      // (an archer's arms: a tenth longer and thicker than the foot soldier's, bracers and all)
      R.bone.armL.scale.setScalar(1.1);
      R.bone.armR.scale.setScalar(1.1);
      // (the hands are brought to bow and string by this, as Rama's are)
      d.ik = new CCDIKSolver(body, [
        { target: BI.tgtL, effector: BI.handL, links: [{ index: BI.foreL }, { index: BI.armL }], iteration: 14 },
        { target: BI.tgtR, effector: BI.handR, links: [{ index: BI.foreR }, { index: BI.armR }], iteration: 14 },
      ]);
      d.pre = {};
      // and a quiver at his right hip, tipped forward so the arrows' ends come to his hand, full of black-fletched arrows
      const q = R.on('hips', new THREE.Group(), [-0.215, 0.93, -0.02]);
      q.rotation.set(0.42, 0, 0.1);
      cyl(q, 0.055, 0.042, 0.42, toon(0x5a3a22, { rim: 0.15 }), [0, 0, 0]);
      for (const y of [-0.17, 0.0, 0.19]) tor(q, 0.05 + (y + 0.17) * 0.02, 0.008, bronze, [0, y, 0], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 5; i++) {
        const x = Math.cos(i * 1.257) * 0.022,
          z = Math.sin(i * 1.257) * 0.022;
        cyl(q, 0.005, 0.005, 0.2, DARK, [x, 0.3, z]);
        add(q, new THREE.BoxGeometry(0.004, 0.07, 0.03), DARK, [x, 0.37, z], [0, i, 0]);
      }
    } else if (rn) {
      // What the runner carries is a wooden bucket nearly as big as his own body, brimming with water, hugged before
      // him in both hands. Like the archer's bow it is its own thing in
      // the world: each frame it is put where he is holding it and his hands are brought to its rim (see the runner, below).
      // Staves bound with two iron hoops, open at the top; its middle is the group's own middle
      const stave = toon(0x6a4526, { rim: 0.15 }),
        blood = new THREE.MeshBasicMaterial({ color: 0x5fb884 });
      R.bone.handR.remove(grip);
      add(club, new THREE.CylinderGeometry(0.115, 0.085, 0.2, 16, 1, true), stave);
      add(club, new THREE.CircleGeometry(0.085, 16), stave, [0, -0.099, 0], [Math.PI / 2, 0, 0]);
      for (const [y, r] of [
        [-0.055, 0.094],
        [0.075, 0.114],
      ])
        tor(club, r, 0.008, iron, [0, y, 0], [Math.PI / 2, 0, 0]);
      d.wet = add(club, new THREE.CircleGeometry(0.108, 16), blood, [0, 0.08, 0], [-Math.PI / 2, 0, 0]);
      {
        const sg = new THREE.CylinderGeometry(1, 1, 1, STREAM_R, STREAM_N - 1, true);
        d.stream = new THREE.Mesh(sg, STREAM_M);
        d.stream.frustumCulled = false;
        d.stream.visible = false;
        d.stream.castShadow = false;
        scene.add(d.stream);
      }
      d.ik = new CCDIKSolver(body, [
        { target: BI.tgtL, effector: BI.handL, links: [{ index: BI.foreL }, { index: BI.armL }], iteration: 14 },
        { target: BI.tgtR, effector: BI.handR, links: [{ index: BI.foreR }, { index: BI.armR }], iteration: 14 },
      ]);
      // (his arms are a little long for him, to go round such a bucket and hold it clear of his chest)
      R.bone.armL.scale.setScalar(1.15);
      R.bone.armR.scale.setScalar(1.15);
    } else {
      cyl(club, 0.018, 0.015, 0.22, WOOD, [0, 0.03, 0]);
      cyl(club, 0.058, 0.026, 0.36, WOOD, [0, 0.32, 0]);
      sph(club, 0.058, WOOD, [0, 0.5, 0], [1, 0.6, 1]);
      for (let i = 0; i < 8; i++) {
        const a = i * 2.4,
          y = 0.24 + i * 0.03;
        cyl(club, 0.002, 0.014, 0.04, iron, [Math.cos(a) * 0.055, y, Math.sin(a) * 0.055], [0, -a, -Math.PI / 2]);
      }
      for (const y of [0.16, 0.47]) tor(club, y < 0.3 ? 0.03 : 0.055, 0.007, iron, [0, y, 0], [Math.PI / 2, 0, 0]);
    }
    if (!ar) club.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(0, 0.25, 1).normalize());
    if (br) {
      club.scale.setScalar(1.3);
      head.scale.setScalar(0.88);
    }
    club.position.copy(dir).multiplyScalar(0.055);
    if (ar) {
      scene.add(club);
      club.position.copy(g.position);
      club.scale.setScalar(1.12 * (d.k || 1));
    }
    if (rn) {
      scene.add(club);
      club.position.copy(g.position);
      club.scale.setScalar(BUCKET * (d.k || 1));
    }
    d.club = club;
    d.grip = grip;
    d.clubP = club.position.clone();
    d.clubQ = club.quaternion.clone();
  }
  d.mats = new Set();
  for (const root of ar || rn ? [g, d.club] : [g])
    root.traverse((o) => {
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
// what each kind of enemy is, in numbers: hit points, the damage of one blow (lowest to highest), speed over the ground, how far from the fire it stops to attack, seconds per attack,
// how wide and heavy it is for collision, how high on it a shot lands, and how high its health bar floats
const FOES = {
  grunt: { hp: 150, dmg: [34, 42], speed: 2.6, reach: 5.4, swing: 1.05, radius: 0.4, mass: 1, aimY: 1.1, barY: 2.15 },
  brute: { hp: 1000, dmg: [100, 120], speed: 2.2, reach: 6.0, swing: 1.7, radius: 0.75, mass: 12, aimY: 1.82, barY: 3.55 },
  pish: { hp: 100, dmg: [20, 26], speed: 3.0, reach: 4.8, swing: 1.4, radius: 0.34, mass: 1, aimY: 0.45, barY: 1.15 },
  defiler: { hp: 100, dmg: [20, 26], speed: 3.2, reach: 2.5, swing: 2.6, radius: 0, mass: 0, aimY: 1.55, barY: 2.35 },
  // the archer stands off (reach is how near he comes before he stops and shoots) and looses one arrow every `swing` seconds
  // the runner is small, quick (quicker than the brothers) and frail, and has eyes only for a fire: he carries a bucket of water to it
  // (his health is set by the brothers' arrows: Rama's does 48 to 56 and Lakshmana's 30 to 36, so 45 is one of Rama's
  // or two of Lakshmana's)
  runner: { hp: 45, dmg: [10, 14], speed: 5.5, reach: 2.2, swing: 1.15, radius: 0.28, mass: 0.7, aimY: 0.72, barY: 1.5 },
  archer: { hp: 90, dmg: [22, 30], speed: 2.5, reach: 12, swing: 2.3, radius: 0.38, mass: 1, aimY: 1.1, barY: 2.1 },
};
// a level may name the spot (at) instead of the angle; the enemy then simply stands there, with no flash of arrival
// how many enemies may be about at once: a level with several camps raises it
let SPAWN_MAX = 16;
function spawn(a, kind, at) {
  const pi = kind === 'pish',
    br = kind === 'brute';
  if (grunts.length >= SPAWN_MAX) return;
  // (an archer arrives well out, beyond his own bowshot, and walks in to it)
  const r = kind === 'archer' ? 19 + Math.random() * 3 : 11 + Math.random() * 2.5,
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
    k: br ? 1 : pi ? 0.9 + Math.random() * 0.2 : kind === 'archer' ? 0.9 + Math.random() * 0.12 : kind === 'runner' ? 0.76 + Math.random() * 0.06 : 0.88 + Math.random() * 0.3,
    br,
    ar: kind === 'archer',
    rn: kind === 'runner',
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
  if (d.stream) scene.remove(d.stream);
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
// ---------- the runner ----------
// He runs hugging his bucket to him, held high against his chest, a hand on either side of it on the outside of its staves.
// At a fire he heaves it: rocks it back and down, then swings it up over his head and tips it, and a gout of water leaves
// it and flies in a high arc onto the flame. The bucket holds RUN_WATER such throws, and the water in it sinks with each.
// The bucket turns about his hands, so they stay on its sides and never go into it. When it is dry he does not leave: he
// takes the empty bucket by its rim in one hand and lays about the fire with it as the others do with a club, which does
// little.
// (Places are in his own frame: y up, z forward. BUCKET is how many times its made size the bucket is. d.threw is true
// when the blow just struck was a throw of water, for a level that counts the harm)
const BUCKET = 2.5,
  RUN_WATER = 3,
  RUN_AT = [0, 1.12, 0.51],
  RUN_KF = (u, a, b, c) =>
    kf(u, [
      [0, 0],
      [0.3, a],
      [0.48, b],
      [0.64, c],
      [1, 0],
    ]),
  WATER = 0x7fd09c,
  // The thrown water is one gout of it, not drops: a tube of STREAM_N rings, fat in the middle and drawn to a point at
  // either end, that travels along a high arc from the bucket's lip to the fire, its rings put on the arc afresh each frame
  STREAM_N = 14,
  STREAM_R = 7,
  STREAM_M = new THREE.MeshBasicMaterial({ color: 0x5fc98c, transparent: true, opacity: 0.8, depthWrite: false, fog: false }),
  [RN_C, RN_H, RN_T, RN_P] = [0, 0, 0, 0].map(() => new THREE.Vector3()),
  [RN_Q, RN_Q2, RN_Q3] = [0, 0, 0].map(() => new THREE.Quaternion()),
  RN_X = new THREE.Vector3(1, 0, 0);
// ---------- the archer ----------
// The same foot soldier, lean, with a bow where the club would be. He does not come to the fire: he makes for whichever
// brother is nearest, stops a good bowshot off (or nearer, if something stands between them), and shoots. One shot takes his
// whole `swing`: the bow comes up, the string comes back over about a third of it, he looses at RELEASE, and the bow comes
// down. The arrow flies straight at where the brother stood when it left the string, so a brother who keeps moving is missed;
// and anything that stops a walker stops an arrow, so a tree is cover.
// He stands to shoot as Rama does, and by the same means. His whole body turns side-on, left side to his mark; both arms go
// out level, the right forearm folded; his head turns along his left arm. Then his hands are put where they must be: the
// left on the bow's grip, out along the line of aim from his left shoulder, and the right on the string, which it brings
// back along that line as he draws, in front of his chest and never through it. The bow itself is set in his left hand and
// turned along the aim, and the string and the arrow follow his right hand.
const BOW_Z = -0.16,
  RELEASE = 0.62,
  ARCH = (u) => ({
    dr: kf(u, [
      [0, 0],
      [0.3, 0],
      [0.58, 1],
      [RELEASE, 1],
      [RELEASE + 0.03, 0],
      [1, 0],
    ]),
    // (rl: his drawing hand away at the quiver for the next arrow, after the shot)
    rl: kf(u, [
      [0, 0],
      [RELEASE + 0.08, 0],
      [0.84, 1],
      [0.9, 1],
      [1, 0],
    ]),
    a: [0, 0, -0.78],
    f: [0, 0, 0],
    aL: [0, 0, 0.78],
    fL: [0, 0, 0],
    w: [0, 0],
    tw: 0,
    lean: -0.88,
  }),
  AR_UP = new THREE.Vector3(0, 1, 0),
  [AR_A, AR_T, AR_L, AR_R, AR_X, AR_Y, AR_Z] = [0, 0, 0, 0, 0, 0, 0].map(() => new THREE.Vector3()),
  [AR_Q, AR_Q2] = [new THREE.Quaternion(), new THREE.Quaternion()],
  AR_M = new THREE.Matrix4(),
  // (how fast his arrow flies)
  FOE_SPEED = 21,
  FOE_SHOTS = [],
  FOE_SHAFT = new THREE.CylinderGeometry(0.009, 0.009, 1.0, 5).rotateX(Math.PI / 2).translate(0, 0, -0.3),
  FOE_TRAIL = new THREE.CylinderGeometry(0.017, 0.001, 2.4, 5).rotateX(Math.PI / 2).translate(0, 0, -1.5),
  FOE_SHAFT_M = new THREE.MeshBasicMaterial({ color: 0x1c1418 }),
  // (a plain red streak, not one that adds its light: over bright grass in daylight an added one all but vanishes)
  FOE_TRAIL_M = new THREE.MeshBasicMaterial({ color: 0xff5a2a, transparent: true, opacity: 0.8, depthWrite: false, fog: false });
const heroUp = (h) => (h.hp === undefined || h.hp > 0) && h.group.visible;
function foeShoot(d) {
  if (!d.foe) return;
  const m = new THREE.Group(),
    q = d.foe.group.position,
    [lo, hi] = d.def.dmg;
  d.club.localToWorld(m.position.set(0, 0, 0.1));
  const v = V3(q.x, q.y + 1.15, q.z).sub(m.position).normalize();
  m.add(new THREE.Mesh(FOE_SHAFT, FOE_SHAFT_M), new THREE.Mesh(FOE_TRAIL, FOE_TRAIL_M));
  m.lookAt(tmpA.copy(m.position).add(v));
  scene.add(m);
  // (the string's snap: a burst of sparks off the bow)
  puff(m.position, 0xffa040, 14, 2.6, 0.3, 0, 0.12);
  FOE_SHOTS.push({ m, v: v.multiplyScalar(FOE_SPEED), far: 0, dmg: Math.round(lo + Math.random() * (hi - lo)) });
}
function foeShotsUpdate(dt) {
  if (!FOE_SHOTS.length) return;
  navFresh();
  for (let i = FOE_SHOTS.length - 1; i >= 0; i--) {
    const a = FOE_SHOTS[i],
      P = a.m.position;
    let gone = false;
    // (in two steps a frame, so that a fast arrow does not step over a man)
    for (let k = 0; k < 2 && !gone; k++) {
      P.addScaledVector(a.v, dt / 2);
      // (and sheds sparks behind it as it flies)
      if (Math.random() < dt * 22) puff(P, 0xff9a3a, 1, 0.5, 0.3, 1.5, 0.09);
      a.far += (FOE_SPEED * dt) / 2;
      for (const h of HEROES) {
        const q = h.group.position;
        if (!heroUp(h) || Math.hypot(P.x - q.x, P.z - q.z) > 0.45 || Math.abs(P.y - q.y - 1.05) > 1.05) continue;
        // it has struck a brother
        if (h.hp !== undefined) h.hp = Math.max(0, h.hp - a.dmg);
        heroHit(h, P.x - a.v.x, P.z - a.v.z);
        puff(P, 0xff6a50, 12, 2.6, 0.3, 2);
        gone = true;
        break;
      }
      if (gone) break;
      const c = navCell(P.x, P.z);
      // (or the ground, or something standing, or it has simply flown its distance)
      if (P.y < groundY(P.x, P.z) + 0.05 || a.far > 40 || (a.far > 1.5 && c >= 0 && NAV.wall[c] && P.y < groundY(P.x, P.z) + 2.4)) {
        puff(P, 0xcbb48a, 5, 1.2, 0.3, 2, 0.1);
        gone = true;
      }
    }
    if (gone) {
      scene.remove(a.m);
      FOE_SHOTS.splice(i, 1);
    }
  }
}
// A brute loses his temper, briefly: for about a second and a half he comes on at nearly three times his pace (6.4, clearly
// quicker than the brothers' 5), weaving, and lays about him left and right: a sweep from his right, a backhand from his left,
// and again. After it he cannot lose his temper again for a few seconds
function rageOn(d) {
  d.rage = 1.4 + Math.random() * 0.4;
  d.rageCd = d.rage + 3 + Math.random() * 3;
  // the blows start afresh, with the sweep from his right
  d.at = 0;
  d.sk = 1;
}
// a level may hold every enemy still for a while (HOLD_FOES), as it does while someone is speaking
let HOLD_FOES = false;
function gruntUpdate(dt) {
  if (HOLD_FOES) return;
  foeShotsUpdate(dt);
  for (const d of grunts) {
    // one that a level has put to sleep (far off, standing idle, out of sight) costs nothing until it is woken
    if (d.asleep) continue;
    // his feet are on the ground, whatever its height where he stands (while he is being thrown through the air he is not)
    if (!d.flung) d.g.position.y = groundY(d.g.position.x, d.g.position.z);
    const B = d.rig.bone,
      g = d.g,
      R = d.rig.group;
    if (d.hp === undefined) {
      d.hp0 = d.hp = d.def.hp;
      d.rng = d.def.reach + (d.pi ? (d.seed % 1) * 0.8 : d.df ? (d.seed % 1) * 0.6 : d.ar ? (d.seed % 1) * 3 : 0);
      d.pw = 0;
      d.wW = 0;
      d.wA = 0;
      d.ph = d.seed * 2;
      d.at = 0;
      d.dead = 0;
      d.lu = 0;
      // (a runner's bucket holds so many throws)
      d.water = RUN_WATER;
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
        // an arrow brings the damage of the brother who loosed it; any other blow (an astra's blast, being thrown) a set amount
        d.hp -= d.dmg != null ? d.dmg : d.vel.length() > 6 ? 150 : 50;
        d.dmg = null;
        // a brute that is hurt may lose his temper (see rageOn)
        if (d.br && !d.rage && !d.rageCd && Math.random() < 0.3) rageOn(d);
        const fl = Math.floor(d.at),
          uu = d.at - fl;
        // (only early in the wind-up; once the swing is well under way a hit no longer stops it. A brute is checked only half
        // as much, or two archers shooting in turn would hold his club back for ever; and in a rage he is not checked at all)
        if (uu < 0.35 && !(d.rage > 0)) {
          d.at = fl + Math.max(0, uu - (d.br ? 0.04 : 0.08));
          d.hitch = d.br ? 0.06 : 0.12;
        }
      }
      if (d.char > 0.7) d.hp = 0;
      if (d.hp <= 0) {
        d.dead = 0.0001;
        d.vel.multiplyScalar(0.4);
        d.rg = Array.from({ length: 6 }, () => Math.random());
        if (d.vel.length() > 0.8) g.rotation.y = Math.atan2(-d.vel.x, -d.vel.z);
        if (d.club) {
          scene.attach(d.club);
          d.club.scale.setScalar((d.br ? 1.3 : d.ar ? 1.12 : d.rn ? BUCKET : 1) * d.sz * (d.k || 1));
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
    // a brute's temper: it runs out, and he cannot lose it again straight away. Once hurt he may also lose it at any moment,
    // for no reason at all; rageW eases in and out so he does not snap between states
    if (d.br && !d.dead) {
      d.rage = Math.max(0, (d.rage || 0) - dt);
      d.rageCd = Math.max(0, (d.rageCd || 0) - dt);
      if (!d.rage && !d.rageCd && d.hp < d.hp0 && Math.random() < dt * 0.12) rageOn(d);
      d.rageW = (d.rageW || 0) + ((d.rage > 0 ? 1 : 0) - (d.rageW || 0)) * Math.min(1, dt * 5);
    }
    // what he is making for: the altar fire, unless a level has given him something else (d.to, a point that may move).
    // d.wait keeps him standing where he is, doing nothing, until the level lets him go
    // (an archer is after the nearest brother still standing, wherever he is)
    if (d.ar && !d.dead) {
      let best = null;
      for (const h of HEROES) if (heroUp(h) && (!best || g.position.distanceToSquared(h.group.position) < g.position.distanceToSquared(best.group.position))) best = h;
      d.foe = best;
      d.to = best ? best.group.position : null;
    }
    const ox = d.to ? d.to.x : 0,
      oz = d.to ? d.to.z : 0,
      r = Math.hypot(g.position.x - ox, g.position.z - oz) || 1,
      stag = (!d.br && d.wob > 0.8 && !(d.wA > 0.5 && d.at % 1 > 0.35)) || d.hold > 0 || d.flung || d.dead > 0 || d.wait,
      // (an archer in range but with something between him and his mark keeps coming, until he can see it)
      blind = d.ar && r <= d.rng && r > 4 && (navFresh(), !navClear(g.position.x, g.position.z, ox, oz, 1)),
      walking = !stag && (r > d.rng || blind) && !(d.ar && !d.foe),
      attacking = !stag && !walking && !(d.ar && !d.foe);
    // he comes in at a run, weaving from side to side, and turns to face wherever he is heading; once in range he squares up to the fire, bouncing on his feet
    {
      const nx = (ox - g.position.x) / r,
        nz = (oz - g.position.z) / r,
        // the way he walks: straight at it when the way is clear, and otherwise round what is in the way. (Not for those in
        // the air, which nothing on the ground stops)
        A = walking && !d.df ? navAim(g.position, ox, oz, d.ar ? 1 : d.rng + 0.6) : null,
        al = A && A.via ? Math.hypot(A.x - g.position.x, A.z - g.position.z) || 1 : 0,
        wx = al ? (A.x - g.position.x) / al : nx,
        wz = al ? (A.z - g.position.z) / al : nz,
        // (d.slowK: a level may slow him, as a lit lamp does those near it)
        sp = (d.pi && d.cr ? 2.6 : d.def.speed * (d.br ? 1 + 1.9 * (d.rageW || 0) : 1)) * (d.slowK || 1),
        bm = d.pi && !d.cr ? 1 + 0.4 * Math.sin(d.ph - 0.3) : 1,
        lat = !walking
          ? 0
          : d.df
            ? Math.sin(T * 1.3 + d.seed * 3) * 0.9
            : d.pi
              ? Math.sin(T * 1.6 + d.seed * 3) * 1.2
              : d.br
                ? Math.sin(T * 2.4 + d.seed * 3) * 1.8 * (d.rageW || 0)
                : // (a runner hardly weaves: he comes straight)
                  Math.sin(T * 1.9 + d.seed * 3) * (d.rn ? 0.35 : 1.4),
        // (on a way round he weaves less, so the weave does not carry him into what he is going round)
        vx = wx * sp - wz * lat * (al ? 0.35 : 1),
        vz = wz * sp + wx * lat * (al ? 0.35 : 1);
      if (walking) {
        g.position.x += vx * bm * dt;
        g.position.z += vz * bm * dt;
        d.ph += dt * (d.br ? 3.2 * (1 + 1.75 * (d.rageW || 0)) : d.pi ? (d.cr ? 8.5 : 11.5) : d.rn ? 16 : 10);
      }
      if (!d.flung && !d.dead) {
        // (a raging brute weaves as he runs but keeps turned square to whoever he is after, so his swings go at them)
        const want = walking && !(d.br && d.rage > 0) ? Math.atan2(vx, vz) : Math.atan2(nx, nz);
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
    // A raging brute swings as he runs: his own blows, one after another and quicker than usual, without stopping to plant his feet
    const raging = d.br && d.rage > 0 && !d.dead && !stag,
      rs = d.br && !d.dead ? d.rageW || 0 : 0,
      wa = Math.max(d.wA, rs);
    {
      const was = Math.floor(d.at);
      d.hitch = Math.max(0, (d.hitch || 0) - dt);
      d.at =
        (attacking || raging) && !d.hitch
          ? d.at + dt / (d.def.swing * (raging ? 0.42 : 1))
          : attacking || d.wA >= 0.05 || rs >= 0.05
            ? d.at
            : 0;
      if (Math.floor(d.at) !== was || d.sk === undefined) {
        // (in a rage, the two sideways blows turn and turn about: from his right, from his left)
        d.sk = raging ? (d.sk === 0 ? 1 : 0) : (Math.random() * (d.br ? BSTR.length : STRIKES.length)) | 0;
        d.sd = Math.random() < 0.5 ? -1 : 1;
      }
    }
    const u = d.at % 1,
      wind = 0,
      S = d.ar ? ARCH(u) : d.pi ? PATK[d.sk](u) : d.br ? BSTR[d.sk](u) : STRIKES[d.sk](u),
      smash = S.lean * wa,
      // (an archer keeps his stance for as long as he is shooting: he does not lower the bow and turn to face front
      // between one arrow and the next, as a club comes back to the shoulder between blows)
      aw = d.df
        ? 0
        : d.ar
          ? wa
          : kf(u, [
            [0, 0],
            [0.32, 1],
            [0.76, 1],
            [1, 0],
          ]) * wa,
      tw = d.df ? 0 : S.tw * wa * (d.pi ? d.sd : 1),
      Ap = d.pi ? {} : S.aL ? { armR: S.a, foreR: S.f, armL: S.aL, foreL: S.fL } : { armR: S.a, foreR: S.f },
      wrist = S.w,
      lg = (S.leg || 0) * wa;
    if (d.ar) {
      if (attacking && d.lu < RELEASE && u >= RELEASE) foeShoot(d);
    } else if (d.pi) {
      if (attacking && d.lu < S.hit && u >= S.hit)
        for (const h of S.both ? [B.handR, B.handL] : [d.sd > 0 ? B.handR : B.handL]) {
          h.getWorldPosition(tmpA);
          puff(tmpA, 0xffd0c0, 7, 2.2, 0.25, 2);
          if (d.onHit) d.onHit();
        }
    } else if (!d.df && (attacking || raging) && d.lu < 0.48 && u >= 0.48) {
      d.club.localToWorld(tmpA.set(0, d.rn ? (d.water > 0 ? 0.1 : -0.1) : 0.42, 0));
      if (d.rn) {
        d.threw = d.water > 0;
        if (d.threw) {
          // a throw: the water leaves the bucket's mouth as one gout (see the runner, below), with spray about the lip
          d.water--;
          d.gout = { t: 0, from: tmpA.clone(), to: V3(ox, d.to && d.to.y !== undefined ? d.to.y + 1.5 : groundY(ox, oz) + 1.0, oz) };
          puff(tmpA, 0xc8f0d6, 10, 2.4, 0.3, 5, 0.12);
        } else puff(tmpA, 0xcbb48a, 8, 1.8, 0.3, 3, 0.1);
      } else {
        puff(tmpA, 0xffe2b0, 16, 3.2, 0.3, 2);
        flash(tmpA, 0xffc890, 10);
      }
      // (the ground shakes under a planted blow; a swing thrown on the run, which may be far from anyone, barely stirs it)
      shake = Math.max(shake, !attacking ? 0.03 : d.br ? 0.14 : 0.05);
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
      if (walking && st2 !== d.stp) puff(tmpA.set(g.position.x, g.position.y + 0.08, g.position.z), 0xd9b98a, 8, 1.6, 0.5, 2);
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
        const c = d.club,
          // (the ground under the falling club, wherever that is)
          floor = groundY(c.position.x, c.position.z) + 0.075;
        if (c.position.y > floor) {
          d.cv.y -= 9 * dt;
          c.position.addScaledVector(d.cv, dt);
          c.rotation.x += dt * 5;
          if (c.position.y <= floor) {
            c.position.y = floor;
            c.rotation.set(Math.PI / 2, 0, d.seed * 2.3 + 0.6);
            if (d.df) puff(c.position, 0x6ee040, 22, 2.4, 0.5, 3);
            else puff(c.position, 0xffd9a0, 5, 1.2, 0.3, 2);
          }
        }
      }
      if (d.dead > 1.3)
        puff(
          tmpA.set(g.position.x + (Math.random() - 0.5) * 0.6, g.position.y + 0.2, g.position.z + (Math.random() - 0.5) * 0.9),
          0x9a5ad0,
          2,
          0.5,
          0.6,
          -2.5,
        );
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
      // (an archer shooting turns head and shoulders along his bow arm, and holds his head level: the foot soldier's is
      // tipped back, to look out of his stoop)
      if (d.ar && !d.dead) {
        const y = { spine: 0.12, chest: 0.2, neck: 0.35, head: 0.75 }[n];
        if (y) c[1] += y * aw;
        if (n === 'head') c[0] += 0.4 * aw;
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
    if (d.rn && d.gout) {
      // the gout in the air: its head runs the arc in a third of a second, its tail a little behind, and where the head
      // comes down it bursts in a splash and a breath of steam
      const G = d.gout,
        was = G.t;
      G.t += dt / 0.36;
      const head = Math.min(1, G.t),
        tail = Math.max(0, G.t - 0.42),
        dx = G.to.x - G.from.x,
        dz = G.to.z - G.from.z,
        dl = Math.hypot(dx, dz) || 1,
        pos = d.stream.geometry.attributes.position,
        ring = STREAM_R + 1;
      for (let j = 0; j < STREAM_N; j++) {
        const q = j / (STREAM_N - 1),
          t = head + (tail - head) * q,
          cx = G.from.x + dx * t,
          // (a low, flat throw: it rises only a little above the straight line to the fire)
          cy = G.from.y + (G.to.y - G.from.y) * t + 0.28 * 4 * t * (1 - t),
          cz = G.from.z + dz * t,
          // (thickest just behind its head and drawn out thin behind, as thrown water is)
          r = 0.015 + 0.085 * Math.pow(Math.sin(Math.PI * Math.pow(q, 0.6)), 0.8) * (1 + 0.18 * Math.sin(q * 14 + T * 20));
        for (let i = 0; i < ring; i++) {
          const a = (i / STREAM_R) * 6.2832;
          pos.setXYZ(j * ring + i, cx + (-dz / dl) * Math.cos(a) * r, cy + Math.sin(a) * r, cz + (dx / dl) * Math.cos(a) * r);
        }
      }
      pos.needsUpdate = true;
      d.stream.visible = tail < 1 && !d.dead;
      // (drops break from it all the way, so that it is not one smooth shape)
      if (head < 1)
        for (let i = 0; i < 2; i++) {
          const t = tail + (head - tail) * Math.random();
          puff(tmpA.set(G.from.x + dx * t, G.from.y + (G.to.y - G.from.y) * t + 0.28 * 4 * t * (1 - t), G.from.z + dz * t), i ? 0xd6f4e2 : WATER, 1, 0.9, 0.3, 6, 0.16);
        }
      if (was < 1 && G.t >= 1) {
        puff(G.to, WATER, 26, 3, 0.45, 7, 0.25);
        puff(G.to, 0xd6f4e2, 10, 2, 0.3, 5, 0.15);
        puff(tmpA.copy(G.to).setY(G.to.y + 0.2), 0xdcd8d2, 12, 1.2, 1.0, -1.4, 0.45);
      }
      if (tail >= 1) d.gout = null;
    } else if (d.rn) d.stream.visible = false;
    if (d.rn && !d.dead) {
      const bk = d.club,
        dry = !(d.water > 0);
      // He does not change in an instant from carrying the bucket to swinging it. d.dryK runs from 0 (in both hands) to 1
      // (hanging from his right hand) over half a second once it is empty: his left hand lets go, his arms ease from where
      // they were placed to where the foot soldier's blows put them, and the bucket swings down from his chest to his fist
      d.dryK = Math.max(0, Math.min(1, (d.dryK || 0) + ((dry ? 1 : -1) * dt) / 0.5));
      const k = d.dryK * d.dryK * (3 - 2 * d.dryK);
      if (k < 1) {
        // in both hands: carried level and high; at a fire, each throw rocks it back and down, then swings it up over his
        // head and tips it right over, and holds it there a moment
        const w2 = dry ? 0 : wa,
          py = RUN_KF(u, -0.1, 0.32, 0.3) * w2,
          pz = RUN_KF(u, -0.08, 0.03, 0.03) * w2,
          tilt = RUN_KF(u, -0.45, 1.9, 1.8) * w2,
          side = 0.1 * BUCKET + 0.045;
        d.pre = d.pre || {};
        for (const n of ['armL', 'foreL', 'armR', 'foreR']) d.pre[n] = (d.pre[n] || new THREE.Quaternion()).copy(B[n].quaternion);
        RN_C.set(RUN_AT[0], RUN_AT[1] + py + 0.025 * Math.sin(d.ph * 2) * d.wW, RUN_AT[2] + pz);
        B.tgtL.position.set(RN_C.x + side, RN_C.y, RN_C.z);
        B.tgtR.position.set(RN_C.x - side, RN_C.y, RN_C.z);
        g.updateMatrixWorld(true);
        d.ik.update();
        if (k > 0)
          for (const n of ['armL', 'foreL', 'armR', 'foreR']) {
            RN_Q.copy(B[n].quaternion);
            B[n].quaternion.copy(RN_Q).slerp(d.pre[n], k);
          }
        g.updateMatrixWorld(true);
        RN_P.copy(R.localToWorld(RN_H.copy(RN_C)));
        R.getWorldQuaternion(RN_Q3).multiply(RN_Q2.setFromAxisAngle(RN_X, tilt));
      }
      if (k > 0) {
        // in one hand: the bucket is a club. It hangs from his right hand by its rim, its bottom the striking end, and
        // goes where the hand goes
        B.handR.getWorldPosition(RN_H);
        B.handR.getWorldQuaternion(RN_Q);
        RN_Q.multiply(RN_Q2.setFromUnitVectors(RN_T.set(0, -1, 0), RN_C.set(-0.5, -0.35, 0.8).normalize()));
        RN_H.add(RN_C.set(0, -0.11 * bk.scale.x, 0).applyQuaternion(RN_Q));
        if (k < 1) {
          bk.position.copy(RN_P).lerp(RN_H, k);
          bk.quaternion.copy(RN_Q3).slerp(RN_Q, k);
        } else {
          bk.position.copy(RN_H);
          bk.quaternion.copy(RN_Q);
        }
      } else {
        bk.position.copy(RN_P);
        bk.quaternion.copy(RN_Q3);
      }
      // (the water in it: lower with every throw, and gone when it is dry)
      d.wet.visible = !dry;
      d.wet.position.y = -0.06 + 0.14 * (d.water / RUN_WATER);
      d.wet.scale.setScalar(0.82 + 0.18 * (d.water / RUN_WATER));
    }
    if (d.ar && !d.dead) {
      const bow = d.club,
        // (an arrow is on the string from the moment his hand is back from the quiver until it is loosed)
        drawn = aw > 0.8 && (u < RELEASE || u > 0.97);
      // side-on, and the drawing forearm folded, before the hands are placed
      R.rotation.y = -1.5708 * aw;
      B.foreR.quaternion.slerp(foldR, aw);
      g.updateMatrixWorld(true);
      AR_A.set(ox - g.position.x, 0, oz - g.position.z).normalize();
      if (aw > 0.01) {
        for (const n of ['armL', 'foreL', 'armR', 'foreR']) d.pre[n] = (d.pre[n] || new THREE.Quaternion()).copy(B[n].quaternion);
        // (the aim as his own frame has it; places for the hands are in that frame, as the rig's lengths are)
        AR_T.copy(AR_A).applyQuaternion(R.getWorldQuaternion(AR_Q).invert());
        R.worldToLocal(B.armL.getWorldPosition(AR_L));
        AR_L.addScaledVector(AR_T, 0.475);
        AR_L.z += 0.09;
        B.tgtL.position.copy(AR_L);
        AR_L.addScaledVector(AR_T, -(0.2 + S.dr * 0.44));
        AR_L.z += 0.1;
        AR_L.y += 0.02;
        // Or it is on its way to the quiver at his right hip and back, between shots. It does not go there straight, which
        // would take it through his own chest: it swings out in front of him and round (a curve through a point well
        // before his chest), down to the arrows' ends, which stand forward of his hip
        {
          const t = S.rl,
            k = 1 - t;
          B.tgtR.position.set(
            k * k * AR_L.x + 2 * t * k * 0.1 + t * t * -0.27,
            k * k * AR_L.y + 2 * t * k * 1.3 + t * t * 1.2,
            k * k * AR_L.z + 2 * t * k * 0.46 + t * t * 0.15,
          );
        }
        g.updateMatrixWorld(true);
        d.ik.update();
        for (const n of ['armL', 'foreL', 'armR', 'foreR']) {
          AR_Q.copy(B[n].quaternion);
          B[n].quaternion.copy(d.pre[n]).slerp(AR_Q, aw);
        }
        g.updateMatrixWorld(true);
      }
      // the bow: upright and along the aim when he shoots; otherwise carried low at his side, pointing down and forward
      B.handL.getWorldPosition(AR_L);
      B.handR.getWorldPosition(AR_R);
      if (aw > 0.5) {
        AR_Z.copy(AR_A);
        AR_X.crossVectors(AR_UP, AR_Z).normalize();
        AR_Y.crossVectors(AR_Z, AR_X).normalize();
      } else {
        AR_Y.set(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y)).multiplyScalar(0.8).addScaledVector(AR_UP, -0.6).normalize();
        AR_X.crossVectors(AR_Y, AR_Z.set(Math.cos(g.rotation.y), 0, -Math.sin(g.rotation.y))).normalize();
        AR_Z.crossVectors(AR_X, AR_Y).normalize();
      }
      bow.quaternion.slerp(AR_Q2.setFromRotationMatrix(AR_M.makeBasis(AR_X, AR_Y, AR_Z)), Math.min(1, dt * 12));
      bow.position.copy(AR_L);
      bow.updateMatrixWorld(true);
      // the string comes to his drawing hand, and the arrow lies from that hand to the grip
      const sp = d.bow.str.geometry.attributes.position;
      if (drawn) {
        bow.worldToLocal(AR_R);
        sp.setXYZ(1, AR_R.x, AR_R.y, AR_R.z);
        d.bow.arrow.position.copy(AR_R);
        d.bow.arrow.quaternion.setFromUnitVectors(AR_Z.set(0, 0, 1), AR_T.set(0, 0.035, 0.05).sub(AR_R).normalize());
      } else sp.setXYZ(1, 0, 0, BOW_Z);
      sp.needsUpdate = true;
      d.bow.arrow.visible = drawn;
      // (as he draws, sparks spit from the arrow's head, more the further the string is back: it is how a shot is seen coming)
      if (drawn && S.dr > 0.15 && Math.random() < dt * 34 * S.dr) puff(d.bow.arrow.localToWorld(AR_T.set(0, 0, 0.78)), 0xffa040, 1, 0.9, 0.3, -1.6, 0.1);
    } else if (d.ar) {
      // (dead: no arrow)
      d.bow.arrow.visible = false;
    }
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
