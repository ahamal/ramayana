'use strict';
// Sitting, and Vishwamitra: a second figure on the same skeleton.
// ---------- sitting: any character on this skeleton can fold down cross-legged for the yagya ----------
const qe = (x, y, z, o = 'XYZ') => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, o));
const SIT_Y = 0.15,
  SITQ = {
    hips: qe(0, 0, 0),
    spine: qe(0.03, 0, 0),
    chest: qe(0, 0, 0),
    neck: qe(0, 0, 0),
    head: qe(0.05, 0, 0),
    legL: qe(-1.62, 0.8, 0, 'YXZ'),
    legR: qe(-1.62, -0.8, 0, 'YXZ'),
    shinL: qe(2.3, 1.57, 0, 'YXZ'),
    shinR: qe(2.3, -1.57, 0, 'YXZ'),
    footL: qe(0.5, 0, 0),
    footR: qe(0.5, 0, 0),
    armL: qe(-0.5, 0, -0.45),
    foreL: qe(-0.55, 0, 0),
    armR: qe(-0.5, 0, 0.45),
    foreR: qe(-0.55, 0, 0),
    handL: qe(0, 0, 0),
    handR: qe(0, 0, 0),
  };

// ---------- Vishwamitra: a second rig on the same skeleton and body, robed, bearded, with his staff ----------
function makeRig() {
  const group = new THREE.Group(),
    bone = {},
    bones = [];
  for (const [name, [par, x, y, z]] of Object.entries(REST)) {
    const b = new THREE.Bone(),
      p = par ? REST[par] : [0, 0, 0, 0];
    b.position.set(x - p[1], y - p[2], z - p[3]);
    (par ? bone[par] : group).add(b);
    bone[name] = b;
    bones.push(b);
  }
  group.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  return {
    group,
    bone,
    skin: (geo, mat) => {
      const m = new THREE.SkinnedMesh(geo, mat);
      m.castShadow = m.receiveShadow = true;
      m.frustumCulled = false;
      group.add(m);
      m.bind(skeleton, new THREE.Matrix4());
      return m;
    },
    on: (name, obj, world) => {
      const r = R3(name);
      obj.position.set(world[0] - r[0], world[1] - r[1], world[2] - r[2]);
      bone[name].add(obj);
      return obj;
    },
  };
}
const weigh = (geo, mat) => {
  const m = skinned(geo, mat);
  rama.remove(m);
  return geo;
};
const V = makeRig();
V.group.position.set(0, 0, 1.55);
V.group.rotation.y = Math.PI;
scene.add(V.group);
const danda = new THREE.Group();
scene.add(danda);
const fist = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10), toon(0xb8733a, { rim: 0.3 }));
fist.scale.set(1, 0.85, 1);
fist.castShadow = true;
let dandaHand, gripG, dandaRest; // fingers closed round the shaft; the carried copy of the staff
{
  const skinV = toon(0xb8733a, { vertexColors: true, rim: 0.3 }),
    sk = toon(0xb8733a, { rim: 0.3 }),
    white = toon(0xf2ece0, { rim: 0.5 }),
    saffron = toon(0xe8801a, { vertexColors: true }),
    maroon = toon(0x8a2420),
    bead = toon(0x4a2410);
  V.body = V.skin(rama.children.find((o) => o.isSkinnedMesh).geometry, skinV);
  const robeF = (x, y, z) => {
    const ax = x < 0 ? -0.1 : 0.1,
      fold = Math.sin(Math.atan2(z, x - ax) * 8 + y * 10) * 0.007;
    return Math.max(lowerF(x, y, z) - 0.03 - fold, y - 1.05, 0.13 - y, GAP(x, y));
  };
  V.skin(
    unlap(
      weigh(
        sculpt(robeF, [-0.32, 0.1, -0.24], [0.32, 1.07, 0.24], 0.0095, (x, y) =>
          y < 0.17 ? [1.3, 0.95, 0.35] : y > 0.19 && y < 0.21 ? [0.6, 0.14, 0.12] : [1, 1, 1],
        ),
        saffron,
      ),
    ),
    saffron,
  );
  V.skin(
    torsoOnly(weigh(
      strip(
        dense([
          [0.17, 1.47],
          [0.1, 1.38],
          [0, 1.25],
          [-0.09, 1.12],
          [-0.14, 1.04],
        ]),
        0.17,
        0.014,
        7,
      ),
      maroon,
    )),
    maroon,
  );
  for (const ry of [0.16, 0.3]) {
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const t = -1.3 + (i / 16) * 2.6;
      pts.push([Math.sin(t) * 0.1, 1.475 - Math.cos(t) * ry]);
    }
    V.skin(weigh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(chestPath(pts, 0.014).map((q) => V3(...q))), 48, 0.012, 6), bead), bead);
  }
  {
    const b = V.on('hips', new THREE.Mesh(new THREE.TorusGeometry(0.158, 0.022, 10, 36), maroon), [0, 1.03, 0.004]);
    b.rotation.x = Math.PI / 2;
    b.scale.set(1, 0.76, 1);
  }
  for (const s of ['L', 'R']) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 24), bead),
      a = R3('arm' + s),
      e = R3('fore' + s);
    m.quaternion.setFromUnitVectors(V3(0, 0, 1), V3(e[0] - a[0], e[1] - a[1], 0).normalize());
    V.on('arm' + s, m, L3(a, e, 0.45));
  }
  const head = V.on('head', new THREE.Group(), [0, 1.725, 0.012]);
  head.scale.setScalar(1.04);
  sph(head, 0.12, sk, [0, 0, 0], [0.94, 1.12, 1.02]);
  sph(head, 0.092, sk, [0, -0.072, 0.02], [0.94, 0.92, 1]);
  cyl(head, 0.0075, 0.0125, 0.052, sk, [0, -0.005, 0.1255], [-0.235, 0, 0], [0.95, 1, 1]);
  sph(head, 0.0135, sk, [0, -0.034, 0.1325], [1, 0.82, 0.9]);
  for (const s of [-1, 1]) {
    sph(head, 0.0095, sk, [s * 0.013, -0.041, 0.1195], [1, 0.8, 1.15]);
    sph(head, 0.024, new THREE.MeshBasicMaterial({ color: 0xf6efe2 }), [s * 0.047, 0.012, 0.098], [1.3, 0.62, 0.5]);
    sph(head, 0.0125, DARK, [s * 0.049, 0.01, 0.109], [1, 1, 0.5]);
    sph(head, 0.027, sk, [s * 0.047, 0.027, 0.094], [1.32, 0.46, 0.55]);
    add(head, new THREE.BoxGeometry(0.068, 0.02, 0.016), white, [s * 0.047, 0.05, 0.103], [0, s * -0.3, s * 0.12]);
    sph(head, 0.03, sk, [s * 0.113, -0.005, 0], [0.5, 1, 0.8]);
    sph(head, 0.03, white, [s * 0.03, -0.066, 0.106], [1.5, 0.5, 0.6], [0, 0, s * -0.3]);
  }
  add(head, new THREE.SphereGeometry(0.128, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.56), white, [0, 0.012, -0.012], [-0.42, 0, 0], [0.96, 1.1, 1.04]);
  lathe(
    head,
    [
      [0.1, 0],
      [0.11, -0.12],
      [0.09, -0.3],
      [0.03, -0.42],
    ],
    white,
    [0, 0, -0.07],
    [0.14, 0, 0],
    [1, 1, 0.6],
  );
  sph(head, 0.075, white, [0, 0.175, -0.03], [1, 0.95, 1]);
  for (const y of [0.15, 0.185]) tor(head, 0.07, 0.012, bead, [0, y, -0.03], [Math.PI / 2 + 0.1, 0, 0]);
  lathe(
    head,
    [
      [0.062, 0.02],
      [0.092, -0.04],
      [0.074, -0.17],
      [0.03, -0.3],
      [0.001, -0.36],
    ],
    white,
    [0, -0.085, 0.045],
    [-0.2, 0, 0],
    [1, 1, 0.72],
  );
  for (const y of [0.05, 0.066, 0.082])
    add(
      head,
      new THREE.BoxGeometry(0.11, 0.007, 0.004),
      new THREE.MeshBasicMaterial({ color: 0xf6efe2 }),
      [0, y, 0.113 - (y - 0.05) * 0.25],
      [-0.22, 0, 0],
    );
  // the staff: a plain ascetic's danda of knotted wood, a little taller than he is, wrapped in cloth near the top
  cyl(danda, 0.014, 0.017, 0.33, WOOD, [0, 0.165, 0]);
  for (const y of [0.09, 0.24]) tor(danda, 0.017, 0.004, toon(0x4a2c14), [0, y, 0], [Math.PI / 2, 0, 0]);
  sph(danda, 0.02, WOOD, [0, 0.33, 0]);
  for (const sx of [-1, 1]) {
    cyl(danda, 0.011, 0.014, 0.1, WOOD, [sx * 0.032, 0.368, 0], [0, 0, -sx * 0.7]);
    sph(danda, 0.014, WOOD, [sx * 0.066, 0.407, 0]);
  } // a slim shaft that forks into a Y at the top, built at true size so nothing is stretched
  {
    const d = V3(0.7071, -0.7071, 0),
      ax = V3(0, 0, 1).addScaledVector(d, -0.25).normalize(),
      palm = d.clone().multiplyScalar(0.055);
    dandaHand = danda.clone();
    dandaHand.quaternion.setFromUnitVectors(V3(0, 1, 0), ax);
    dandaRest = dandaHand.quaternion.clone();
    dandaHand.position.copy(palm).addScaledVector(ax, -0.165);
    dandaHand.userData.palm = palm.clone();
    gripG = new THREE.Group();
    V.bone.handL.add(gripG);
    gripG.add(dandaHand, fist);
    fist.position.copy(d).multiplyScalar(0.048);
    fist.quaternion.setFromUnitVectors(V3(0, 1, 0), d);
    fist.scale.set(1.15, 1.5, 1.1);
  } // the fist is large enough to cover his open mitt, so the hand reads as closed round the shaft
  const pot = new THREE.Group();
  pot.position.set(0.62, 0, -1.85);
  scene.add(pot);
  lathe(
    pot,
    [
      [0.001, 0],
      [0.07, 0.005],
      [0.11, 0.07],
      [0.1, 0.15],
      [0.045, 0.2],
      [0.05, 0.24],
      [0.062, 0.25],
    ],
    toon(0xc8862a, { emissive: 0x3a1c00 }),
  );
  tor(pot, 0.06, 0.008, GOLD, [0, 0.27, 0], [0, 0, 0], [1, 0.8, 1]);
}
const SG = {
  move: 'sit',
  wWalk: 0,
  wRun: 0,
  wSit: 1,
  phase: 0,
  pathA: Math.PI,
  facing: 0,
  namaste: false,
  firing: false,
  wNam: 0,
  wFire: 0,
  fireT: 0,
  twist: 0,
};
let who = 'rama',
  fireFlare = 0,
  lastOffer = -1;
const CARRY = { armL: qe(-0.22, 0, -0.4), foreL: qe(-1.25, 0, 0) },
  OFFER = { armR: qe(-1.15, 0, 0.2), foreR: qe(-0.15, 0, 0), spine: qe(0.14, 0, 0) },
  sPre = { armL: new THREE.Quaternion(), foreL: new THREE.Quaternion(), armR: new THREE.Quaternion(), foreR: new THREE.Quaternion() };
let sageIK = null,
  sageIK2 = null;
const ARMS = ['armL', 'foreL', 'armR', 'foreR'];
// lightning: a jagged ribbon of light from the staff to the target, with two forks, redrawn once so it flickers
function bolt(a, b, sc = 1) {
  const dir = b.clone().sub(a),
    len = dir.length();
  dir.normalize();
  const side = V3().crossVectors(dir, tmpA.copy(cam.position).sub(a)).normalize(),
    up2 = V3().crossVectors(side, dir),
    n = 14,
    pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n,
      j = Math.sin(t * Math.PI) * 0.35;
    pts.push(
      a
        .clone()
        .addScaledVector(dir, len * t)
        .addScaledVector(side, (Math.random() - 0.5) * j * 2)
        .addScaledVector(up2, (Math.random() - 0.5) * j * 2),
    );
  }
  const mk = (P, w, color, o) => {
    const m = new THREE.Mesh(
      band2(P.length - 1, (t) => {
        const p = P[Math.round(t * (P.length - 1))];
        return [[p.x + side.x * w, p.y + side.y * w, p.z + side.z * w], [p.x - side.x * w, p.y - side.y * w, p.z - side.z * w], t];
      }),
      addMat(null, color, { opacity: o }),
    );
    m.userData.o = o;
    m.frustumCulled = false;
    scene.add(m);
    return m;
  };
  const out = [mk(pts, 0.11 * sc, 0x7fb0ff, 0.5 * sc), mk(pts, 0.03 * sc, 0xffffff, 1)];
  for (let k = 0; k < (sc < 1 ? 0 : 2); k++) {
    const br = [pts[3 + ((Math.random() * 7) | 0)].clone()],
      d2 = dir
        .clone()
        .addScaledVector(side, (Math.random() - 0.5) * 1.6)
        .addScaledVector(up2, (Math.random() - 0.5) * 1.2)
        .normalize();
    for (let i = 1; i <= 5; i++)
      br.push(
        br[i - 1]
          .clone()
          .addScaledVector(d2, 0.25)
          .addScaledVector(side, (Math.random() - 0.5) * 0.2),
      );
    out.push(mk(br, 0.018, 0xdfeaff, 0.8));
  }
  return out;
}
const sageGlow = glow(0xcfe0ff, 0.3);
sageGlow.visible = false;
scene.add(sageGlow);
function zap(a0, b0, first) {
  const b = b0.clone(),
    made = bolt(a0.clone(), b);
  let t = 0;
  fx.push((dt) => {
    t += dt;
    const u = t / 0.09;
    made.forEach((m) => {
      m.material.opacity = m.userData.o * Math.max(0, 1 - u * u);
    });
    if (u >= 1) {
      made.forEach((m) => {
        scene.remove(m);
        m.geometry.dispose();
        m.material.dispose();
      });
      return false;
    }
    return true;
  });
  puff(b, 0xdfeaff, first ? 26 : 5, first ? 6 : 4, 0.35, 4);
  flash(b, 0xbfd8ff, first ? 60 : 32);
  shake = Math.max(shake, first ? 0.16 : 0.05);
  if (first) ring(b, 1.2, 0xcfe0ff, 0.25);
  for (const d of dummies) {
    if (d.flung || d.dead) continue;
    const dx = d.g.position.x - b.x,
      dz = d.g.position.z - b.z,
      l = Math.hypot(dx, dz);
    if (l < 1.3) {
      d.wob = Math.max(d.wob, first ? 1 : 0.6);
      d.char = Math.min(1, d.char + (first ? 0.2 : 0.06));
      if (first) {
        d.vel.x += (dx / (l || 1)) * 2;
        d.vel.z += (dz / (l || 1)) * 2;
      }
    }
  }
  // chain: from the dummy that was struck, the bolt leaps on to the nearest ones not yet touched, thinner each time
  {
    const near = (p, r, skip) => {
      let best = null;
      for (const d of dummies) {
        if (d.flung || d.dead || (skip && skip.has(d))) continue;
        const l = Math.hypot(d.g.position.x - p.x, d.g.position.z - p.z);
        if (l < r) {
          r = l;
          best = d;
        }
      }
      return best;
    };
    let cur = near(b, 1.6);
    if (cur) {
      const hit = new Set([cur]);
      let from = cur.g.position.clone().setY(1.1);
      for (let k = 1; k <= 3; k++) {
        const nx = near(from, 7, hit);
        if (!nx) break;
        hit.add(nx);
        const to = nx.g.position.clone().setY(1.1),
          links = bolt(from.clone(), to, 1 - k * 0.2);
        let t2 = 0;
        fx.push((dt) => {
          t2 += dt;
          const u = t2 / 0.09;
          links.forEach((m) => {
            m.material.opacity = m.userData.o * Math.max(0, 1 - u * u);
          });
          if (u >= 1) {
            links.forEach((m) => {
              scene.remove(m);
              m.geometry.dispose();
              m.material.dispose();
            });
            return false;
          }
          return true;
        });
        puff(to, 0xdfeaff, first ? 12 : 2, 3, 0.3, 2);
        if (first) flash(to, 0xbfd8ff, 22 - k * 4);
        nx.wob = Math.max(nx.wob, first ? 0.8 : 0.45);
        nx.char = Math.min(1, nx.char + (first ? 0.12 : 0.035));
        from = to;
      }
    }
  }
  if (first)
    for (const t of targets)
      if (t.c.distanceTo(b) < 1.2) {
        t.wob = 1;
        hits++;
      }
}
function lightning(a0, b0) {
  const a = a0.clone(),
    b = b0.clone();
  for (const delay of [0, 0.07]) {
    let t = -delay,
      made = null;
    fx.push((dt) => {
      t += dt;
      if (t < 0) return true;
      if (!made) made = bolt(a, b);
      const u = t / 0.11;
      made.forEach((m) => {
        m.material.opacity = m.userData.o * Math.max(0, 1 - u);
      });
      if (u >= 1) {
        made.forEach((m) => {
          scene.remove(m);
          m.geometry.dispose();
          m.material.dispose();
        });
        return false;
      }
      return true;
    });
  }
  flash(b, 0xbfd8ff, 55);
  shake = Math.max(shake, 0.14);
  puff(b, 0xdfeaff, 26, 6, 0.35, 4);
  puff(a, 0xdfeaff, 8, 2, 0.25, 0);
  ring(b, 1.2, 0xcfe0ff, 0.25);
  for (const d of dummies) {
    if (d.flung || d.dead) continue;
    const dx = d.g.position.x - b.x,
      dz = d.g.position.z - b.z,
      l = Math.hypot(dx, dz);
    if (l < 1.3) {
      d.wob = 1;
      d.char = Math.min(1, d.char + 0.3);
      d.vel.x += (dx / (l || 1)) * 2;
      d.vel.z += (dz / (l || 1)) * 2;
    }
  }
  for (const t of targets)
    if (t.c.distanceTo(b) < 1.2) {
      t.wob = 1;
      hits++;
    }
}
function sageUpdate(dt) {
  // he walks his own circle nearer the fire; seated, one hand rests in the U of his staff and the other feeds the fire
  if (!sageIK)
    sageIK = new CCDIKSolver(V.body, [{ target: BI.tgtL, effector: BI.handL, links: [{ index: BI.foreL }, { index: BI.armL }], iteration: 12 }]);
  const S = SG,
    g = V.group,
    Z = [0, 0, 0];
  S.wWalk += ((S.move === 'walk' ? 1 : 0) - S.wWalk) * Math.min(1, dt * 5);
  S.wRun += ((S.move === 'run' ? 1 : 0) - S.wRun) * Math.min(1, dt * 5);
  S.wSit += ((S.move === 'sit' ? 1 : 0) - S.wSit) * Math.min(1, dt * 2.6);
  const es = S.wSit * S.wSit * (3 - 2 * S.wSit),
    still = 1 - S.wSit,
    sp = (1.1 * S.wWalk + 3.4 * S.wRun) * still;
  S.pathA += (sp * dt) / 2.0;
  S.phase += dt * ((S.wWalk * 1.1) / 0.36 + S.wRun * 9) * still;
  g.position.set(Math.sin(S.pathA) * 2.0, 0, Math.cos(S.pathA) * 2.0);
  if (S.move !== 'sit' && S.namaste) {
    S.namaste = false;
    ui();
  }
  S.wNam += ((S.namaste && S.wSit > 0.8 ? 1 : 0) - S.wNam) * Math.min(1, dt * 4);
  S.wFire += ((S.firing ? 1 : 0) - S.wFire) * Math.min(1, dt * 6);
  const en = S.wNam * S.wNam * (3 - 2 * S.wNam),
    ef = S.wFire * S.wFire * (3 - 2 * S.wFire),
    aimYaw = Math.atan2(aimPt.x - g.position.x, aimPt.z - g.position.z),
    wrapA = (v) => Math.atan2(Math.sin(v), Math.cos(v));
  const want =
    S.move === 'sit' ? Math.atan2(-g.position.x, -g.position.z) : S.firing && Math.max(S.wWalk, S.wRun) < 0.3 ? aimYaw : S.pathA + Math.PI / 2;
  S.twist += (Math.max(-1.5, Math.min(1.5, wrapA(aimYaw - S.facing))) * S.wFire - S.twist) * Math.min(1, dt * 12);
  let dy = want - S.facing;
  dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  S.facing += dy * Math.min(1, dt * 6);
  g.rotation.y = S.facing;
  const a = idle(T + 1.7),
    b = walk(S.phase),
    c = run(S.phase),
    cyc = (T % 3.4) / 3.4,
    k = clamp01((cyc - 0.1) / 0.18) * (1 - clamp01((cyc - 0.42) / 0.2)),
    reach = S.wSit > 0.95 ? k * k * (3 - 2 * k) * (1 - S.wNam) : 0;
  for (const name of Object.keys(REST)) {
    if (name[0] === 't') continue;
    const bn = V.bone[name];
    bn.quaternion.setFromEuler(E.set(...(a[name] || Z)));
    if (S.wWalk > 0.001) bn.quaternion.slerp(qI.setFromEuler(E.set(...(b[name] || Z))), S.wWalk);
    if (S.wRun > 0.001) bn.quaternion.slerp(qI.setFromEuler(E.set(...(c[name] || Z))), S.wRun);
    if (es > 0.001 && SITQ[name]) bn.quaternion.slerp(SITQ[name], es);
    if (name === 'spine') bn.quaternion.multiply(qI.setFromAxisAngle(tmp.set(1, 0, 0), 0.18 * es));
    if (name === 'head') bn.quaternion.multiply(qI.setFromAxisAngle(tmp.set(1, 0, 0), -0.12 * es));
    if (reach > 0 && OFFER[name]) bn.quaternion.slerp(OFFER[name], reach);
    if ((name === 'spine' || name === 'chest') && Math.abs(S.twist) > 0.001) bn.quaternion.premultiply(qI.setFromAxisAngle(UP, S.twist * 0.5));
  }
  let y = a._y;
  y += (b._y - y) * S.wWalk;
  y += (c._y - y) * S.wRun;
  V.bone.hips.position.set(0, (REST.hips[2] + y) * (1 - es) + SIT_Y * es, 0);
  g.updateMatrixWorld(true);
  const eh = es * (1 - en);
  if (eh > 0.01) {
    sPre.armL.copy(V.bone.armL.quaternion);
    sPre.foreL.copy(V.bone.foreL.quaternion);
    V.bone.tgtL.position.set(0.26, 0.365, 0.47);
    g.updateMatrixWorld(true);
    sageIK.update();
    for (const n of ['armL', 'foreL']) {
      qI.copy(V.bone[n].quaternion);
      V.bone[n].quaternion.copy(sPre[n]).slerp(qI, eh);
    }
    g.updateMatrixWorld(true);
    {
      const hb = V.bone.handL;
      qB.setFromUnitVectors(tmp.set(0.7071, -0.7071, 0), tmp2.set(0.05, -0.5, 0.86).normalize());
      g.getWorldQuaternion(qT).multiply(qB);
      hb.parent.getWorldQuaternion(qI).invert().multiply(qT);
      hb.quaternion.identity().slerp(qI, eh);
      g.updateMatrixWorld(true);
    }
  } // wrist rests in the U, hand draped forward over it
  if ((en > 0.01 || ef > 0.01) && !sageIK2)
    sageIK2 = new CCDIKSolver(V.body, [
      { target: BI.tgtL, effector: BI.handL, links: [{ index: BI.foreL }, { index: BI.armL }], iteration: 12 },
      { target: BI.tgtR, effector: BI.handR, links: [{ index: BI.foreR }, { index: BI.armR }], iteration: 12 },
    ]);
  if (en > 0.01) {
    // namaste: palms together at the heart, fingers up, head bowed; the staff stays planted
    for (const q of ARMS) sPre[q].copy(V.bone[q].quaternion);
    V.bone.chest
      .getWorldPosition(tmp)
      .addScaledVector(tN.set(Math.sin(S.facing), 0, Math.cos(S.facing)), 0.2)
      .addScaledVector(UP, 0.07);
    tB.set(Math.cos(S.facing), 0, -Math.sin(S.facing));
    V.bone.tgtL.position.copy(g.worldToLocal(tmp2.copy(tmp).addScaledVector(tB, 0.032)));
    V.bone.tgtR.position.copy(g.worldToLocal(tmp2.copy(tmp).addScaledVector(tB, -0.032)));
    g.updateMatrixWorld(true);
    sageIK2.update();
    for (const q of ARMS) {
      qI.copy(V.bone[q].quaternion);
      V.bone[q].quaternion.copy(sPre[q]).slerp(qI, en);
    }
    V.bone.head.quaternion.multiply(qI.setFromAxisAngle(tmp.set(1, 0, 0), 0.22 * en));
    g.updateMatrixWorld(true);
    for (const [q, sx] of [
      ['handL', 1],
      ['handR', -1],
    ]) {
      const hb = V.bone[q];
      qB.setFromUnitVectors(tmp.set(sx * 0.7071, -0.7071, 0), tmp2.set(-sx * 0.08, 0.94, 0.33).normalize());
      g.getWorldQuaternion(qT).multiply(qB);
      hb.parent.getWorldQuaternion(qI).invert().multiply(qT);
      hb.quaternion.identity().slerp(qI, en);
    }
    g.updateMatrixWorld(true);
  }
  if (ef > 0.01) {
    // lightning: the staff arm straightens toward the target, the staff turns to point at it, and a bolt leaps from its fork
    for (const q of ARMS) sPre[q].copy(V.bone[q].quaternion);
    V.bone.armL.getWorldPosition(tmp);
    tT.copy(aimPt).sub(tmp).setY(0).normalize();
    S.thr = (S.thr || 0) + ((S.fireT >= 1.3 ? 1 : 0) - (S.thr || 0)) * Math.min(1, dt * 14);
    const wv = 1 - S.thr,
      ph = T * 4.2;
    tB.set(tT.z, 0, -tT.x);
    V.bone.tgtL.position.copy(
      g.worldToLocal(
        tmp2
          .copy(tmp)
          .addScaledVector(tT, 0.507 + 0.012 * S.thr)
          .addScaledVector(UP, 0.03 * Math.sin(ph) * wv + (Math.random() - 0.5) * 0.012 * S.thr)
          .addScaledVector(tB, 0.035 * Math.cos(ph) * wv),
      ),
    );
    V.bone.tgtR.position.copy(g.worldToLocal(V.bone.handR.getWorldPosition(tmp2)));
    g.updateMatrixWorld(true);
    sageIK2.update();
    for (const q of ['armL', 'foreL']) {
      qI.copy(V.bone[q].quaternion);
      V.bone[q].quaternion.copy(sPre[q]).slerp(qI, ef);
    }
    V.bone.armR.quaternion.copy(sPre.armR);
    V.bone.foreR.quaternion.copy(sPre.foreR);
    g.updateMatrixWorld(true);
    V.bone.handL.getWorldQuaternion(qT).invert();
    dandaHand.quaternion.copy(dandaRest).slerp(
      qT.multiply(
        qB.setFromUnitVectors(
          UP,
          tN
            .copy(tT)
            .addScaledVector(UP, 0.45 - 0.15 * S.thr)
            .addScaledVector(tB, 0.06 * Math.cos(ph) * wv)
            .normalize(),
        ),
      ),
      ef,
    );
    dandaHand.position
      .set(0, -0.165 + 0.13 * ef, 0)
      .applyQuaternion(dandaHand.quaternion)
      .add(dandaHand.userData.palm);
    dandaHand.updateWorldMatrix(true, false);
    // each cycle: 1.3 s gathering charge at the fork, then a bolt held on the target for 0.8 s, flickering
    const CH = 1.3,
      HOLD = 0.8,
      tip = dandaHand.localToWorld(tmpA.set(0, 0.4, 0));
    if (S.wFire > 0.9 && es < 0.3) S.fireT += dt;
    else S.fireT = 0;
    const ch = Math.min(1, S.fireT / CH),
      striking = S.fireT >= CH;
    sageGlow.visible = true;
    sageGlow.position.copy(tip);
    sageGlow.scale.setScalar(0.12 + ch * ch * 0.75 + (striking ? 0.35 + Math.random() * 0.25 : 0));
    sageGlow.material.opacity = 0.35 + ch * 0.65;
    if (!striking) {
      if (Math.random() < 0.25 + ch * 0.75)
        puff(
          tmp.copy(tip).add(tmp2.set((Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7)),
          0xcfe0ff,
          1,
          0.4,
          0.3,
          0,
        );
      if (Math.random() < ch * 0.25) {
        const m = bolt(tip.clone(), tip.clone().add(tmp2.set((Math.random() - 0.5) * 0.5, (Math.random() - 0.3) * 0.5, (Math.random() - 0.5) * 0.5)));
        let t = 0;
        fx.push((d2) => {
          t += d2;
          if (t > 0.07) {
            m.forEach((q) => {
              scene.remove(q);
              q.geometry.dispose();
              q.material.dispose();
            });
            return false;
          }
          return true;
        });
      }
      S.zapT = 0;
      S.struck = false;
    } else {
      S.zapT -= dt;
      if (S.zapT <= 0) {
        S.zapT = 0.055;
        zap(tip, aimPt, !S.struck);
        S.struck = true;
      }
      if (S.fireT > CH + HOLD) {
        S.fireT = 0;
        if (!held()) {
          SG.firing = false;
          ui();
        }
      }
    }
  } else {
    sageGlow.visible = false;
    S.fireT = 0;
    dandaHand.quaternion.copy(dandaRest);
    dandaHand.position.set(0, -0.165, 0).applyQuaternion(dandaRest).add(dandaHand.userData.palm);
  }
  const n = Math.floor(T / 3.4);
  if (reach > 0.97 && n !== lastOffer) {
    lastOffer = n;
    V.bone.handR.getWorldPosition(tmpA);
    spray(tmpA, tmpB.set(0, 0.75, 0).sub(tmpA).normalize(), 0xffd070, 16, 3.4, 0.5, 0.45);
    fireFlare = 1;
  }
  g.localToWorld(tmpA.set(0.26, 0, 0.47));
  danda.position.copy(tmpA);
  danda.rotation.set(0, S.facing, 0);
  danda.visible = es >= 0.5;
  gripG.visible = es < 0.5;
  {
    const hs = es < 0.5 ? 0.62 : 1;
    V.bone.handL.scale.setScalar(hs);
    gripG.scale.setScalar(1 / hs);
  } // while he carries it, the open hand is shrunk away inside the fist // seated: the planted staff; otherwise: the one in his hand
  if (fireFlare > 0.02 && Math.random() < 0.8)
    puff(tmpB.set((Math.random() - 0.5) * 0.3, 0.6, (Math.random() - 0.5) * 0.3), Math.random() < 0.6 ? 0xff8a20 : 0xffd060, 2, 1.2, 0.7, -3.5);
  fireFlare = Math.max(0, fireFlare - dt * 1.3);
}
