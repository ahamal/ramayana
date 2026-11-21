'use strict';
// Rama as the player's hero: his poses, the controls (keys and mouse), shooting, and the per-frame updates every page shares.
// A page that loads this must define ui(), called whenever a control changes state.
function idle(t) {
  const b = Math.sin(t * 1.6),
    s = Math.sin(t * 0.8);
  return {
    hips: [0, 0, s * 0.02],
    spine: [-0.015 + b * 0.008, 0, -s * 0.015],
    chest: [-0.01 + b * 0.012, Math.sin(t * 0.5) * 0.04, 0],
    head: [Math.sin(t * 0.7) * 0.03, Math.sin(t * 0.4) * 0.16, 0],
    armL: [0.06, 0, -0.64 + b * 0.01],
    foreL: [-0.38, 0, 0],
    armR: [0.06, 0, 0.64 - b * 0.01],
    foreR: [-0.3, 0, 0],
    legL: [0, 0, 0.02 - s * 0.02],
    legR: [0, 0, -0.02 - s * 0.02],
    _y: 0,
    _x: s * 0.012,
  };
}
function walk(p) {
  const s = Math.sin(p),
    c = Math.cos(p);
  return {
    hips: [0, s * 0.09, c * 0.03],
    spine: [0.025, -s * 0.06, 0],
    chest: [0, -s * 0.09, -c * 0.02],
    head: [-0.02, s * 0.06, 0],
    legL: [-s * 0.5, 0, 0],
    shinL: [Math.max(0, c) * 0.95 + 0.07, 0, 0],
    footL: [s * 0.22, 0, 0],
    legR: [s * 0.5, 0, 0],
    shinR: [Math.max(0, -c) * 0.95 + 0.07, 0, 0],
    footR: [-s * 0.22, 0, 0],
    armL: [s * 0.45, 0, -0.62],
    foreL: [-0.4 - Math.max(0, -s) * 0.35, 0, 0],
    armR: [-s * 0.45, 0, 0.62],
    foreR: [-0.4 - Math.max(0, s) * 0.35, 0, 0],
    _y: -Math.abs(s) * 0.03,
    _x: 0,
  };
}
function run(p) {
  // a true run: airborne twice a cycle, high front knee, heel kicked up behind, strong lean, elbows locked at a right angle
  const s = Math.sin(p),
    c = Math.cos(p),
    fl = (q) => 0.25 + 1.75 * Math.max(0, Math.cos(q - 0.5)),
    push = (q) => 0.55 * Math.max(0, -Math.sin(q + 0.6));
  return {
    hips: [0.2, s * 0.2, c * 0.05],
    spine: [0.2, -s * 0.1, 0],
    chest: [0.06, -s * 0.24, -c * 0.03],
    neck: [-0.1, 0, 0],
    head: [-0.2, s * 0.12, 0],
    legL: [-0.28 - s * 0.84, 0, 0],
    shinL: [fl(p), 0, 0],
    footL: [push(p), 0, 0],
    legR: [-0.28 + s * 0.84, 0, 0],
    shinR: [fl(p + Math.PI), 0, 0],
    footR: [push(p + Math.PI), 0, 0],
    armL: [0.1 + s * 1.05, 0, -0.72],
    foreL: [-1.6, 0, 0],
    armR: [0.1 - s * 1.05, 0, 0.72],
    foreR: [-1.6, 0, 0],
    _y: -0.07 + Math.abs(s) * 0.13,
    _x: 0,
  };
}
const INV = { spine: [0, 0.12, 0.2], chest: [0, 0.2, 0.28], neck: [0.14, 0.25, -0.2], head: [0.34, 0.45, -0.24] }; // head bowed while the bow is held skyward
const AIM = {
    spine: [0, 0.12, 0],
    chest: [0, 0.2, 0],
    neck: [0, 0.35, 0],
    head: [0.02, 0.75, 0],
    armL: [0, 0, 0.78],
    armR: [0, 0, -0.78],
    foreL: [0, 0, 0],
    handL: [0, 0, 0],
    handR: [0, 0, 0],
  },
  STANCE = { legL: [0, 0, 0.17], legR: [0, 0, -0.17] };
let solver = new CCDIKSolver(
  rama.children.find((o) => o.isSkinnedMesh),
  [
    { target: BI.tgtL, effector: BI.handL, links: [{ index: BI.foreL }, { index: BI.armL }], iteration: 14 },
    { target: BI.tgtR, effector: BI.handR, links: [{ index: BI.foreR }, { index: BI.armR }], iteration: 14 },
  ],
);

let namaste = false,
  wNam = 0;
const qT = new THREE.Quaternion();
let wSit = 0,
  invoking = false,
  wInv = 0,
  invP = 0,
  haltW = 0,
  mKick = 0,
  twist = 0;
let move = 'idle',
  firing = false,
  wWalk = 0,
  wRun = 0,
  wAim = 0,
  phase = 0,
  mface = 0.6 + Math.PI / 2,
  keyed = false,
  orbit = false,
  back = false,
  wBk = 0,
  facing = 0,
  draw = 0,
  fireT = 0,
  hits = 0,
  T = 0;
let yaw = 0.5,
  pitch = 0.74,
  dist = 15,
  drag = null;
let camInit = 0;
const tgt = V3(0, 1, 0),
  ndc = new THREE.Vector2(0.3, 0.1);
rama.position.set(Math.sin(0.6) * 4, 0, Math.cos(0.6) * 4);
let aimLock = null;
const bodyPt = (d, out) => out.set(d.g.position.x, d.g.position.y + d.def.aimY, d.g.position.z); // where on an enemy a shot is aimed: chest of a rakshasa, back of a crawling pishacha, the body of a flying defiler
let keyDir = V3(),
  aimPt = V3(0, 1.15, 9);
const ray = new THREE.Raycaster(),
  plane = new THREE.Plane(V3(0, 1, 0), -1.15);
function setMove(m) {
  if (who !== 'sage') {
    move = m;
    orbit = m === 'walk' || m === 'run';
    if (m === 'sit') firing = false;
    else namaste = false;
  } else {
    SG.move = m;
    if (m === 'sit') SG.firing = false;
    else SG.namaste = false;
  }
}
function toggleNam() {
  if (who !== 'sage') {
    namaste = !namaste;
    if (namaste) {
      move = 'sit';
      firing = false;
    }
  } else {
    SG.namaste = !SG.namaste;
    if (SG.namaste) {
      SG.move = 'sit';
      SG.firing = false;
    }
  }
}
let shotQ = 0,
  holdT = 0,
  latch = false,
  mDown = false,
  kDown = false;
const keys = {},
  held = () => (AUTO ? IN.fire : latch || mDown || kDown);
// fire is held: the mouse button, Space or F, or the Rapid fire button latched on. A short press still gets one full shot; holding keeps them coming
function press() {
  if (LOCK) return;
  if (who !== 'sage') {
    namaste = false;
    if (move === 'sit') move = 'idle';
    firing = true;
    holdT = 0;
    shotQ = 1;
  } else {
    SG.namaste = false;
    if (SG.move === 'sit') SG.move = 'idle';
    SG.firing = true;
  }
  ui();
}
function release() {
  if (!held() && firing && !shotQ) holdT = 0.2;
}
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code.startsWith('Arrow')) e.preventDefault();
  const m = { Digit1: 'idle', Digit2: 'walk', Digit3: 'run', Digit4: 'sit' }[e.code];
  if (m) setMove(m);
  else if (e.code === 'KeyV' || e.code === 'Tab') {
    selectHero(PLAYABLE[(PLAYABLE.indexOf(who) + 1) % PLAYABLE.length]);
    e.preventDefault();
  } else if (e.code === 'KeyF' || e.code === 'Space') {
    if (!e.repeat) {
      kDown = true;
      press();
    }
    e.preventDefault();
  } else if (e.code === 'KeyN') toggleNam();
  else if (e.code === 'KeyG') FOLLOW = !FOLLOW;
  else return;
  ui();
});
const cv = renderer.domElement;
cv.style.cursor = 'grab';
addEventListener('keyup', (e) => {
  keys[e.code] = false;
  if (e.code === 'KeyF' || e.code === 'Space') {
    kDown = false;
    release();
  }
});
addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  mDown = kDown = false;
  release();
});
// left button fires at the pointer for as long as it is held; the right button drags the camera round
cv.addEventListener('pointerdown', (e) => {
  if (e.button === 0) {
    mDown = true;
    ndc.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
    press();
  } else drag = [e.clientX, e.clientY];
});
cv.addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('pointermove', (e) => {
  ndc.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
  if (drag) {
    yaw -= (e.clientX - drag[0]) * 0.006;
    pitch = Math.max(0.05, Math.min(1.35, pitch + (e.clientY - drag[1]) * 0.004));
    drag = [e.clientX, e.clientY];
  }
});
addEventListener('pointerup', (e) => {
  if (e.button === 0 && mDown) {
    mDown = false;
    release();
  } else drag = null;
});
cv.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    dist = Math.max(2.5, Math.min(32, dist * (1 + e.deltaY * 0.001)));
  },
  { passive: false },
);
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  composer.setSize(innerWidth, innerHeight);
  cam.aspect = innerWidth / innerHeight;
  cam.fov = cam.aspect < 1 ? 54 : 36;
  cam.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

let aimDir = V3(1, 0, 0),
  poseDir = V3(1, 0, 0),
  front = V3(),
  hL = V3(),
  hR = V3();
const tmp = V3(),
  tmp2 = V3(),
  mB = new THREE.Matrix4(),
  qB = new THREE.Quaternion(),
  qI = new THREE.Quaternion(),
  pre = {},
  UP = V3(0, 1, 0);
function loose() {
  let K = KINDS[kind];
  // a hero with stamina spends some on every quick shot. When it runs out he is tired, and shoots at Rama's pace until half of it is back
  if (CUR.st !== undefined && !CUR.tired) {
    CUR.st -= 10;
    if (CUR.st <= 0) {
      CUR.st = 0;
      CUR.tired = true;
    }
  }
  // where heroes have mana, an astra costs some; without enough, the shot leaves as a plain arrow
  if (CUR.mp !== undefined && K.cost) {
    if (CUR.mp >= K.cost) CUR.mp -= K.cost;
    else K = KINDS[0];
  }
  const n = K.fan || 1;
  if (K.wind) return windGust(hL, aimDir);
  if (K.manava) return manavaFire(hL, aimDir);
  for (let i = 0; i < n; i++) {
    const a = shots.length < 70 ? makeArrow() : shots.shift().g;
    a.visible = true;
    a.scale.setScalar(1);
    a.children.filter((c) => c.name === 'disc').forEach((c) => a.remove(c));
    a.children.forEach((c) => {
      if (!c.isSprite) c.visible = true;
    });
    const d = aimDir.clone().applyAxisAngle(UP, (i - (n - 1) / 2) * 0.1),
      gl = a.userData.glow;
    a.position.copy(hL);
    gl.visible = !!K.glow;
    gl.material.color.set(K.color);
    gl.scale.setScalar(K.glow || 0.6);
    const sh = {
      g: a,
      v: d.clone().multiplyScalar(K.speed * (K.naga ? 1.5 : 1)),
      live: true,
      K,
      t: Math.random() * 6,
      side: V3().crossVectors(UP, d).normalize(),
    };
    // where it left the bow, so its flight can be limited from there
    sh.from = sh.g.position.clone();
    shots.push(sh);
    if (aimLock && i === (n - 1) >> 1) sh.lock = aimLock;
    if (!K.charge && !K.naga && !K.agni) armStreak(sh);
    if (K.charge) armBrahma(sh);
    if (K.naga) armNaga(sh);
    if (K.agni) armAgni(sh);
  }
  if (K.naga) nagaLaunch(hL, aimDir);
  else if (K.agni) agniLaunch(hL, aimDir);
  else if (K.glow) {
    puff(hL, K.color, 14, 2.5, 0.35, 0);
    if (K.charge) {
      flash(hL, K.color, 60);
      shake = 0.3;
    }
  }
}
function setPose(delta) {
  const ww = wWalk * (1 - haltW),
    wr = wRun * (1 - haltW),
    a = idle(T),
    b = walk(phase),
    c = run(phase);
  if (wBk > 0.01) {
    c.hips = [c.hips[0] - 0.3 * wBk, c.hips[1], c.hips[2]];
    c.spine = [c.spine[0] - 0.3 * wBk, c.spine[1], c.spine[2]];
  }
  const cd = Math.cos(delta),
    sd = Math.sin(delta),
    moving = Math.max(ww, wr);
  const strafe = (name, e) => (name.startsWith('leg') ? [e[0] * cd, 0, e[2] - e[0] * sd] : e); // legs swing along the travel direction even when the body is turned to shoot
  for (const name of Object.keys(REST)) {
    if (name[0] === 't') continue;
    const bn = bone[name],
      Z = [0, 0, 0];
    bn.quaternion.setFromEuler(E.set(...(a[name] || Z)));
    if (ww > 0.001) bn.quaternion.slerp(qI.setFromEuler(E.set(...strafe(name, b[name] || Z))), ww);
    if (wr > 0.001) bn.quaternion.slerp(qI.setFromEuler(E.set(...strafe(name, c[name] || Z))), wr);
    if (wAim > 0.001) {
      if (name === 'foreR') bn.quaternion.slerp(foldR, wAim);
      else if (AIM[name]) bn.quaternion.slerp(qI.setFromEuler(E.set(...AIM[name])), wAim);
      else if (STANCE[name]) bn.quaternion.slerp(qI.setFromEuler(E.set(...STANCE[name])), wAim * (1 - moving));
    }
    if (wInv > 0.001 && INV[name]) bn.quaternion.slerp(qI.setFromEuler(E.set(...INV[name])), wInv);
    if ((name === 'spine' || name === 'chest') && Math.abs(twist) > 0.001) bn.quaternion.premultiply(qI.setFromAxisAngle(UP, twist * 0.5));
    if (wSit > 0.001 && SITQ[name]) bn.quaternion.slerp(SITQ[name], wSit * wSit * (3 - 2 * wSit));
  }
  let y = a._y;
  y += (b._y - y) * ww;
  y += (c._y - y) * wr;
  {
    const es = wSit * wSit * (3 - 2 * wSit);
    bone.hips.position.set(a._x * (1 - moving) * (1 - es), (REST.hips[2] + y) * (1 - es) + SIT_Y * es, 0);
  }
}
// ---------- the brothers: one set of code drives both ----------
// Everything above and in heroStep below is written for one archer and reads plain variables (move, firing, bone, bow ...).
// Each brother keeps his own copy of those in a record; before one is updated his copy is loaded into the variables, and saved back after.
// The one the player holds is always loaded last, so between frames the variables are his, and the buttons and keys act on him.
function heroState() {
  return {
    namaste,
    wNam,
    wSit,
    invoking,
    wInv,
    invP,
    haltW,
    mKick,
    twist,
    move,
    firing,
    wWalk,
    wRun,
    wAim,
    phase,
    mface,
    keyed,
    orbit,
    back,
    wBk,
    facing,
    draw,
    fireT,
    aimLock,
    shotQ,
    holdT,
    kind,
  };
}
function saveHero(h) {
  h.s = heroState();
}
function loadHero(h) {
  ({
    namaste,
    wNam,
    wSit,
    invoking,
    wInv,
    invP,
    haltW,
    mKick,
    twist,
    move,
    firing,
    wWalk,
    wRun,
    wAim,
    phase,
    mface,
    keyed,
    orbit,
    back,
    wBk,
    facing,
    draw,
    fireT,
    aimLock,
    shotQ,
    holdT,
    kind,
  } = h.s);
  ({ group: rama, bone, lids, eyeBits, bow, strGeo, nock, solver, aimPt, aimDir, poseDir, front, keyDir, hL, hR } = h);
  CUR = h;
}
const IKS = [
  { target: BI.tgtL, effector: BI.handL, links: [{ index: BI.foreL }, { index: BI.armL }], iteration: 14 },
  { target: BI.tgtR, effector: BI.handR, links: [{ index: BI.foreR }, { index: BI.armR }], iteration: 14 },
];
// pace: how long each shot takes compared with Rama's. Lakshmana draws and looses in a little over half the time
// range: how far he can hit when he is on his own. keep: how close he lets an enemy come before backing away
const RAMA = {
  name: 'rama',
  pace: 1,
  range: 13,
  keep: 4.5,
  group: rama,
  bone,
  lids,
  eyeBits,
  bow,
  strGeo,
  nock,
  solver,
  aimPt,
  aimDir,
  poseDir,
  front,
  keyDir,
  hL,
  hR,
  post: rama.position.clone(),
  s: heroState(),
};
// Lakshmana: Rama's own body and gear copied, on a skeleton of his own, fair-skinned and dressed in blue. He carries no astras, only plain arrows
function cloneHero(src, name, at, tint) {
  lids.forEach((o) => (o.userData.lid = 1));
  eyeBits.forEach((o) => (o.userData.eyeBit = 1));
  const g = SkeletonUtils.clone(src.group),
    bn = {},
    l2 = [],
    e2 = [],
    bw = src.bow.clone(true);
  g.traverse((o) => {
    if (o.isBone) bn[o.name] = o;
    if (o.userData.lid) l2.push(o);
    if (o.userData.eyeBit) e2.push(o);
    if (o.isMesh && tint.has(o.material)) o.material = tint.get(o.material);
  });
  let sg = null;
  bw.traverse((o) => {
    if (o.isLine) sg = o.geometry = o.geometry.clone();
  });
  g.position.copy(at);
  scene.add(g, bw);
  const mesh = g.children.find((o) => o.isSkinnedMesh);
  return {
    name,
    pace: 0.68,
    range: 14,
    keep: 3.5,
    group: g,
    bone: bn,
    lids: l2,
    eyeBits: e2,
    bow: bw,
    strGeo: sg,
    nock: makeArrow(),
    solver: new CCDIKSolver(mesh, IKS),
    aimPt: V3(0, 1.15, -9),
    aimDir: V3(-1, 0, 0),
    poseDir: V3(-1, 0, 0),
    front: V3(),
    keyDir: V3(),
    hL: V3(),
    hR: V3(),
    post: at.clone(),
    s: { ...src.s, mface: Math.atan2(-at.x, -at.z) + Math.PI / 2, facing: 0, kind: 0 },
  };
}
const LAK = cloneHero(
  RAMA,
  'lak',
  V3(Math.sin(0.6 + Math.PI) * 4, 0, Math.cos(0.6 + Math.PI) * 4),
  new Map([
    [SKIN, toon(0xbf8048, { vertexColors: true, rim: 0.34 })],
    [SKINP, toon(0xbf8048, { rim: 0.34 })],
    [rama.children.find((o) => o.geometry === dhotiGeo).material, toon(0x2c5fa8, { vertexColors: true })],
  ]),
);
// his head: Rama's cap of short hair with no knot and nothing down the neck, no earrings and nothing on the brow
{
  const head = LAK.bone.head.children.find((o) => o.isGroup);
  for (const o of [...head.children])
    if (Math.abs(o.position.x) < 0.01 && o.position.y > 0.05 && o.position.z !== 0) if (o.position.y > 0.12 || o.position.z > 0.11) head.remove(o);
  // Rama's lips are violet to suit blue skin; on brown skin that reads as paint, so his are a plain darker brown
  for (const o of head.children)
    if (o.isMesh && Math.abs(o.position.x) < 0.001 && o.position.y < -0.07 && o.position.y > -0.1 && o.position.z > 0.09) o.material = toon(0x8a4a30);
  // no earrings, and no hair down the back of the neck: only the cap of hair on the crown
  for (const o of [...head.children]) {
    const earring = Math.abs(Math.abs(o.position.x) - 0.122) < 0.002 && o.position.y < -0.04,
      napeHair = o.position.x === 0 && o.position.y === 0 && Math.abs(o.position.z + 0.062) < 0.001;
    if (earring || napeHair) head.remove(o);
  }
}
// everyone the player can take control of; collision treats each as a walker
const HEROES = [RAMA, LAK],
  // how long his reload takes next to Rama's: his own quick pace, or Rama's while he is tired
  pace = (h) => (h.tired ? 1 : h.pace);
let SEL = RAMA,
  CUR = RAMA,
  AUTO = false,
  FOLLOW = false,
  // how far from the fire anyone may walk, and who Tab cycles through: a level may change both
  BOUND = 13,
  PLAYABLE = ['rama', 'lak', 'sage'];
const IN = { x: 0, z: 0, walk: false, fire: false, at: null, quick: 1 };
// for a level's scenes: LOCK shuts out firing and switching brothers; DIRECT(h, dt), if it returns true, has given that hero his orders
// for this frame by filling IN (and may set move, namaste and firing, which are his at that moment)
let LOCK = false,
  DIRECT = null,
  CAM = null;
// keeps a walker on the ground anyone may walk on: a circle round the fire, unless a level gives the ground another shape
let hem = (P) => {
  const r = Math.hypot(P.x, P.z);
  if (r > BOUND) P.multiplyScalar(BOUND / r);
};
// taking control of a brother, or of the sage. The brother you leave holds the spot where you left him
function selectHero(w) {
  if (LOCK) return;
  who = w;
  const h = HEROES.find((x) => x.name === w);
  if (h && h !== SEL) {
    saveHero(SEL);
    SEL.post.copy(SEL.group.position);
    SEL = h;
    loadHero(h);
    mDown = kDown = false;
  }
  ui();
}
// a brother on his own. He watches the nearest living enemy:
//   out of his range     he goes toward it, and stops once it is comfortably inside;
//   inside his range     he stands and shoots;
//   closer than he likes he backs away from it, still shooting, sliding round the edge of the ground if he runs out of room.
// The two switch-over distances are a little apart, so he does not dither on the line. With nothing to fight he walks back to his post.
function brain(h, dt) {
  const P = h.group.position;
  let best = null,
    bd = 1e9,
    // the push away from everything that is too close, each counting for more the nearer it is
    tx = 0,
    tz = 0,
    crowd = 0;
  for (const d of grunts) {
    if (d.dead || d.flung) continue;
    const l = Math.hypot(d.g.position.x - P.x, d.g.position.z - P.z);
    // on a big map, enemies too far off to matter are not his concern
    if (l > h.range + 12) continue;
    if (l < bd) {
      bd = l;
      best = d;
    }
    if (l < h.keep + 0.8) {
      const k = 1 - l / (h.keep + 0.8);
      tx += ((P.x - d.g.position.x) / (l || 1)) * k;
      tz += ((P.z - d.g.position.z) / (l || 1)) * k;
      crowd++;
    }
  }
  // he stays on the enemy he is already shooting unless it is gone, or another has come much closer. Otherwise, in a crowd,
  // the nearest one changes from moment to moment and he snaps from target to target
  const cur = h.tgt && !h.tgt.dead && !h.tgt.flung && grunts.includes(h.tgt) ? h.tgt : null,
    cd = cur ? Math.hypot(cur.g.position.x - P.x, cur.g.position.z - P.z) : 1e9;
  if (cur && cd <= h.range && bd > cd * 0.6) {
    best = cur;
    bd = cd;
  }
  h.tgt = best;
  IN.at = best && bd <= h.range ? best : null;
  IN.fire = !!IN.at;
  IN.x = IN.z = 0;
  IN.walk = false;
  if (best && (move === 'sit' || namaste)) {
    move = 'idle';
    namaste = false;
  }
  if (move === 'sit') return;
  let dx = 0,
    dz = 0;
  // following: with Follow on, the brother you are not playing stays with the one you are. He still fights, but will not stray far:
  // past the length of his leash he drops everything and comes back
  const lead = FOLLOW && who !== 'sage' && h !== SEL ? SEL.group.position : null,
    ld = lead ? Math.hypot(lead.x - P.x, lead.z - P.z) : 0;
  if (lead) h.post.copy(P);
  if (lead && ld > 6.5 && !(best && bd < h.keep)) {
    h.mode = null;
    dx = lead.x - P.x;
    dz = lead.z - P.z;
  } else if (best) {
    if (bd < h.keep) h.mode = 'back';
    else if (bd > h.range * 0.92) h.mode = 'close';
    else if (h.mode === 'back' ? bd > h.keep + 1.2 : h.mode === 'close' ? bd < h.range * 0.72 : !h.mode) h.mode = 'hold';
    const ex = (best.g.position.x - P.x) / (bd || 1),
      ez = (best.g.position.z - P.z) / (bd || 1);
    if (h.mode === 'close') {
      dx = ex;
      dz = ez;
    } else if (h.mode === 'back') {
      // away from the whole crowd, not just the nearest of them. Hemmed in on all sides the pushes cancel, and he stands his ground and shoots
      const tl = Math.hypot(tx, tz);
      dx = crowd > 1 ? (tl > 0.25 ? tx / tl : 0) : -ex;
      dz = crowd > 1 ? (tl > 0.25 ? tz / tl : 0) : -ez;
      // at the edge of the ground he cannot back off any further outwards: he slides round the edge instead
      const r = Math.hypot(P.x, P.z) || 1,
        out = (dx * P.x + dz * P.z) / r;
      if (r > BOUND - 1.5 && out > 0) {
        dx -= (out * P.x) / r;
        dz -= (out * P.z) / r;
        if (Math.hypot(dx, dz) < 0.2) {
          dx = -P.z / r;
          dz = P.x / r;
        }
      }
    }
  } else if (lead) {
    // nothing to fight: walk at his brother's shoulder. He sets off once he has fallen three paces behind and stops two paces short
    h.mode = null;
    if (ld > (keyed ? 2.2 : 3.2)) {
      dx = lead.x - P.x;
      dz = lead.z - P.z;
      IN.walk = ld < 4.5;
    }
  } else {
    h.mode = null;
    dx = h.post.x - P.x;
    dz = h.post.z - P.z;
    const l = Math.hypot(dx, dz);
    if (l < (keyed ? 0.25 : 0.9)) dx = dz = 0;
    IN.walk = l < 3;
  }
  // the heading he wants is eased, so a change of mind turns him over a few frames instead of flipping him on the spot,
  // and he needs a clear wish to move before he sets off
  const l = Math.hypot(dx, dz),
    k = Math.min(1, dt * 7);
  h.hx = (h.hx || 0) + ((l > 1e-3 ? dx / l : 0) - (h.hx || 0)) * k;
  h.hz = (h.hz || 0) + ((l > 1e-3 ? dz / l : 0) - (h.hz || 0)) * k;
  const hl = Math.hypot(h.hx, h.hz);
  if (hl > (keyed ? 0.3 : 0.6)) {
    IN.x = h.hx / hl;
    IN.z = h.hz / hl;
  }
}
// the player's keys, turned into the same kind of orders: a direction on the ground, relative to the camera
function keysIn() {
  const kx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0),
    kz = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0),
    l = Math.hypot(kx, kz) || 1;
  IN.x = (-Math.sin(yaw) * kz + Math.cos(yaw) * kx) / l;
  IN.z = (-Math.cos(yaw) * kz - Math.sin(yaw) * kx) / l;
  IN.walk = !!(keys.ShiftLeft || keys.ShiftRight);
  IN.at = null;
  IN.fire = false;
}
function heroUpdate(dt) {
  saveHero(SEL);
  const one = (h, auto) => {
    loadHero(h);
    // a level's scene may take a hero over for a while: it then gives the orders, and neither the player nor his own wits do
    IN.quick = 1;
    const scripted = !!(DIRECT && DIRECT(h, dt));
    AUTO = auto || scripted;
    if (scripted) {
    } else if (auto) brain(h, dt);
    else keysIn();
    heroStep(dt);
    // his feet are on the ground, whatever its height where he now stands
    h.group.position.y = groundY(h.group.position.x, h.group.position.z);
    saveHero(h);
  };
  for (const h of HEROES) if (h !== SEL) one(h, true);
  one(SEL, who === 'sage');
  AUTO = false;
  for (const h of HEROES) {
    if (h.mp !== undefined) h.mp = Math.min(h.mpMax, h.mp + dt * 4);
    if (h.st !== undefined) {
      h.st = Math.min(h.stMax, h.st + dt * 4);
      if (h.st >= h.stMax * 0.5) h.tired = false;
    }
  }
}
// ---------- one frame, in the pieces a page calls in order: tick, heroUpdate, shotsUpdate, worldUpdate, cameraUpdate, then it renders ----------
let prev = performance.now();
function tick(now) {
  const raw = Math.max(0, Math.min(0.05, (now - prev) / 1000));
  prev = now;
  slowT = Math.max(0, slowT - raw);
  const dt = raw * (slowT > 0 ? 0.2 : 1);
  T += dt;
  return dt;
}
function heroStep(dt) {
  {
    if (IN.x || IN.z) {
      const m = IN.walk ? 'walk' : 'run';
      keyDir.set(IN.x, 0, IN.z);
      if (!keyed || move !== m) {
        keyed = true;
        orbit = false;
        move = m;
        namaste = false;
        if (!AUTO) ui();
      }
    } else if (keyed) {
      keyed = false;
      move = 'idle';
      if (!AUTO) ui();
    }
  }
  wWalk += ((move === 'walk' ? 1 : 0) - wWalk) * Math.min(1, dt * (move === 'idle' && !orbit ? 12 : 5));
  wRun += ((move === 'run' ? 1 : 0) - wRun) * Math.min(1, dt * (move === 'idle' && !orbit ? 12 : 5));
  wSit += ((move === 'sit' ? 1 : 0) - wSit) * Math.min(1, dt * 3);
  if (move !== 'sit' && namaste) {
    namaste = false;
    if (!AUTO) ui();
  }
  wNam += ((namaste && wSit > 0.8 ? 1 : 0) - wNam) * Math.min(1, dt * 4);
  wAim += ((firing ? 1 : 0) - wAim) * Math.min(1, dt * 7);
  wInv += ((invoking ? 1 : 0) - wInv) * Math.min(1, dt * (invoking ? 5 : 12));
  // going backwards he keeps his speed and the stride runs in reverse
  haltW = KINDS[kind].halt ? wInv : 0;
  const still = (1 - haltW) * (1 - wSit),
    // IN.quick is a scene's brisker walk: the same stride, taken faster
    sp = (1.3 * IN.quick * wWalk + 5.0 * wRun) * still;
  phase += dt * ((wWalk * 1.3 * IN.quick) / 0.36 + wRun * 10) * still * (1 - 2 * wBk);
  {
    const P = rama.position;
    if (!orbit) {
      if (keyed) {
        P.addScaledVector(keyDir, sp * dt);
        hem(P);
        mface = Math.atan2(keyDir.x, keyDir.z);
      }
    } else if (sp > 0.001) {
      const r = Math.hypot(P.x, P.z) || 1,
        a = Math.atan2(P.x, P.z) + (sp * dt) / r;
      P.set(Math.sin(a) * r, 0, Math.cos(a) * r);
      mface = a + Math.PI / 2;
    }
  } // with the keys: straight where they point; he stops dead and keeps that heading when they are let go. With the Walk and Run buttons: round the fire, as before
  // aim. Under the player: at the point under the pointer, snapping to the body of the nearest living enemy within 2.5 units of it.
  // On his own: at the enemy his own judgement picked
  if (AUTO) {
    aimLock = IN.at;
    if (IN.at) aimPt.lerp(bodyPt(IN.at, tmp), Math.min(1, dt * 10));
    if (IN.fire && !firing && move !== 'sit') {
      firing = true;
      shotQ = 1;
      holdT = 0;
    } else if (!IN.fire && firing && holdT <= 0) {
      shotQ = 0;
      holdT = 0.2;
    }
  } else {
    ray.setFromCamera(ndc, cam);
    // where the pointer's line meets chest height above the ground. On uneven ground that height is found in a few steps:
    // try the hero's own level, see how high the land is where that lands, and try again at that level
    plane.constant = -(rama.position.y + 1.15);
    for (let i = 0; i < 3; i++) if (ray.ray.intersectPlane(plane, tmp)) plane.constant = -(groundY(tmp.x, tmp.z) + 1.15);
    if (ray.ray.intersectPlane(plane, tmp)) {
      let best = null,
        bd = 2.5;
      for (const d of grunts) {
        if (d.dead || d.flung) continue;
        const l = Math.hypot(d.g.position.x - tmp.x, d.g.position.z - tmp.z);
        if (l < bd) {
          bd = l;
          best = d;
        }
      }
      aimLock = best;
      if (best) bodyPt(best, tmp);
      aimPt.lerp(tmp, Math.min(1, dt * 14));
    } else aimLock = null;
  }
  // (the aim is taken from his own chest height, wherever the ground has put him)
  tmp.copy(aimPt).sub(tmp2.copy(rama.position).setY(rama.position.y + 1.3));
  if (tmp.length() > 0.8) aimDir.copy(tmp.normalize());
  const aimFace = Math.atan2(-aimDir.z, aimDir.x),
    wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a)),
    mvW = Math.max(wWalk, wRun) * (1 - haltW);
  // backpedal. He shoots side-on, bow arm toward the target, so `off` is 0 with the target on his left, 90 degrees with it dead ahead or dead behind, and 180 with it on his right.
  // Ahead, behind and left he keeps running forwards and turns at the waist. Only when the target is well round to his right (off past about 130 degrees) do the legs turn to face the other way and run backwards; they turn back once it is under about 110
  {
    const off = Math.abs(wrap(aimFace - mface));
    if (wAim < 0.5 || mvW < 0.3) back = false;
    else if (off > 2.25) back = true;
    else if (off < 1.95) back = false;
    wBk += ((back ? 1 : 0) - wBk) * Math.min(1, dt * 8);
  }
  const moveFace = mface + (back ? Math.PI : 0);
  let dfA = wrap(aimFace - moveFace);
  if (Math.abs(dfA) > 2.3 && twist !== 0 && Math.sign(dfA) !== Math.sign(twist)) dfA -= Math.sign(dfA) * 6.2832; // target behind him: keep twisting the same way, never snap to the other side
  const want =
    move === 'sit' ? Math.atan2(-rama.position.x, -rama.position.z) : wAim > 0.5 ? aimFace - Math.max(-1.45, Math.min(1.45, dfA)) * mvW : moveFace; // standing: turn the whole body; moving: turn only as far as the waist cannot
  let dy = want - facing;
  dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  facing += dy * Math.min(1, dt * 10);
  rama.rotation.y = facing;
  twist += (Math.max(-1.6, Math.min(1.6, wrap(aimFace - facing))) * wAim - twist) * Math.min(1, dt * 14);
  front.set(Math.sin(facing + twist), 0, Math.cos(facing + twist));
  // rapid fire: draw, loose, recover
  const INVT = KINDS[kind].invoke || 0,
    RATE = (INVT ? 0.32 : KINDS[kind].rate) * pace(CUR);
  if (!firing) fireT = shotQ = 0;
  else if (wAim > 0.85 && (held() || shotQ)) {
    // a new draw only starts while fire is held, or to finish the one shot a short press is owed.
    // Without this a fast archer began another shot inside the lowering pause after release, and so never stopped
    fireT += dt;
    if (fireT > INVT + RATE) {
      loose();
      fireT = -0.15 * pace(CUR);
      shotQ = 0;
      if (!held()) holdT = 0.3;
    }
  }
  if (held()) holdT = 0;
  else if (holdT > 0 && (holdT -= dt) <= 0 && !shotQ) {
    firing = false;
    if (!AUTO) ui();
  }
  invoking = firing && INVT > 0 && fireT >= 0 && fireT < INVT;
  invP = INVT ? Math.max(0, Math.min(1, fireT / INVT)) : 0;
  {
    // how far the string is drawn. It follows the draw as it builds, but on release it eases forward over a few frames instead of snapping,
    // so the string hand does not jump
    const want = INVT ? invP : Math.max(0, Math.min(1, fireT / (RATE * 0.82)));
    draw = want >= draw ? want : draw + (want - draw) * Math.min(1, dt * 26);
  }
  {
    const shut = wInv > 0.5 || wNam > 0.6;
    lids.forEach((l) => {
      l.visible = shut;
    });
    eyeBits.forEach((l) => {
      l.visible = !shut;
    });
  }
  poseDir.set(aimDir.x, 0, aimDir.z).normalize().multiplyScalar(Math.cos(0.92)).addScaledVector(UP, Math.sin(0.92));
  poseDir.lerpVectors(aimDir, poseDir, wInv).normalize(); // where the bow points: skyward while meditating, at the target otherwise
  setPose(moveFace - facing);
  rama.updateMatrixWorld(true);
  if (wAim > 0.01) {
    // IK: the bow hand reaches along the aim line; the draw hand pulls the string back in front of the chest
    for (const n of ['armL', 'foreL', 'armR', 'foreR']) pre[n] = (pre[n] || new THREE.Quaternion()).copy(bone[n].quaternion);
    bone.armL
      .getWorldPosition(tmp)
      .addScaledVector(poseDir, 0.475)
      .addScaledVector(front, 0.09 * (1 - wInv));
    bone.tgtL.position.copy(rama.worldToLocal(tmp2.copy(tmp)));
    tmp.addScaledVector(poseDir, -(0.2 + draw * 0.44)).addScaledVector(front, 0.1 + 0.04 * wInv);
    tmp.y += 0.02;
    bone.tgtR.position.copy(rama.worldToLocal(tmp2.copy(tmp)));
    rama.updateMatrixWorld(true);
    solver.update();
    for (const n of ['armL', 'foreL', 'armR', 'foreR']) {
      qI.copy(bone[n].quaternion);
      bone[n].quaternion.copy(pre[n]).slerp(qI, wAim);
    }
    rama.updateMatrixWorld(true);
  }
  if (wNam > 0.01) {
    // namaste: both palms are brought together at the heart with IK, fingers turned upward, head bowed
    const e = wNam * wNam * (3 - 2 * wNam);
    for (const n of ['armL', 'foreL', 'armR', 'foreR']) pre[n] = (pre[n] || new THREE.Quaternion()).copy(bone[n].quaternion);
    bone.chest.getWorldPosition(tmp).addScaledVector(front, 0.2).addScaledVector(UP, 0.07);
    tmpB.set(Math.cos(facing), 0, -Math.sin(facing));
    bone.tgtL.position.copy(rama.worldToLocal(tmp2.copy(tmp).addScaledVector(tmpB, 0.032)));
    bone.tgtR.position.copy(rama.worldToLocal(tmp2.copy(tmp).addScaledVector(tmpB, -0.032)));
    rama.updateMatrixWorld(true);
    solver.update();
    for (const n of ['armL', 'foreL', 'armR', 'foreR']) {
      qI.copy(bone[n].quaternion);
      bone[n].quaternion.copy(pre[n]).slerp(qI, e);
    }
    bone.head.quaternion.multiply(qI.setFromAxisAngle(tmp.set(1, 0, 0), 0.24 * e));
    rama.updateMatrixWorld(true);
    for (const [n, sx] of [
      ['handL', 1],
      ['handR', -1],
    ]) {
      const hb = bone[n];
      qB.setFromUnitVectors(tmp.set(sx * 0.7071, -0.7071, 0), tmp2.set(-sx * 0.08, 0.94, 0.33).normalize());
      rama.getWorldQuaternion(qT).multiply(qB);
      hb.parent.getWorldQuaternion(qI).invert().multiply(qT);
      hb.quaternion.identity().slerp(qI, e);
    }
    rama.updateMatrixWorld(true);
  }
  // bow: upright and facing the target when shooting; otherwise carried low, pointing down and forward beside the leg
  bone.handL.getWorldPosition(hL);
  bone.handR.getWorldPosition(hR);
  const bz = V3(),
    bx = V3(),
    by = V3();
  if (wAim > 0.5) {
    bz.copy(poseDir);
    bx.crossVectors(UP, bz).normalize();
    by.crossVectors(bz, bx).normalize();
  } else {
    by.copy(front).multiplyScalar(0.8).addScaledVector(UP, -0.6).normalize();
    bz.set(Math.cos(facing), 0, -Math.sin(facing));
    bx.crossVectors(by, bz).normalize();
    bz.crossVectors(bx, by).normalize();
  }
  qB.setFromRotationMatrix(mB.makeBasis(bx, by, bz));
  bow.quaternion.slerp(qB, Math.min(1, dt * 12));
  bow.position.copy(hL);
  if (wSit > 0.5) {
    by.copy(front);
    bz.copy(UP);
    bx.crossVectors(by, bz).normalize();
    bow.quaternion.setFromRotationMatrix(mB.makeBasis(bx, by, bz));
    bow.position.set(rama.position.x + Math.cos(facing) * 0.6, rama.position.y + 0.05, rama.position.z - Math.sin(facing) * 0.6);
  }
  const drawn = wAim > 0.8 && fireT >= 0,
    sp2 = strGeo.attributes.position;
  if (drawn) {
    const l = bow.worldToLocal(tmp.copy(hR));
    sp2.setXYZ(1, l.x, l.y, l.z);
  } else sp2.setXYZ(1, 0, 0, -0.21);
  sp2.needsUpdate = true;
  nock.visible = drawn;
  if (drawn) {
    nock.position.copy(hR);
    tmp.copy(hL).sub(hR);
    if (tmp.length() > 0.05) nock.quaternion.setFromUnitVectors(V3(0, 0, 1), tmp.normalize());
  }
  {
    const K = KINDS[kind],
      gl = nock.userData.glow;
    gl.visible = drawn && !!K.glow;
    gl.material.color.set(K.color);
    gl.scale.setScalar((K.glow || 0.6) * (0.4 + draw * 0.8));
    if (drawn && K.charge && Math.random() < 0.7) puff(hL, K.color, 2, 1.2, 0.5, 0, 0.9);
    const wd = drawn && !!K.wind;
    windSw.forEach((m, i) => {
      m.visible = wd;
      if (wd) {
        m.position.copy(hL).addScaledVector(poseDir, 0.25);
        m.quaternion.setFromUnitVectors(V3(0, 0, 1), poseDir).multiply(qB.setFromAxisAngle(V3(0, 0, 1), -T * 12 + i * 2.094));
        m.scale.setScalar(1.3 - draw * 0.8);
      }
    });
    windSwM.opacity = draw * 0.9;
    if (wd && Math.random() < 0.9) {
      const a = Math.random() * 6.283,
        r = 0.9 + Math.random() * 0.9;
      tmp.set(rama.position.x + Math.cos(a) * r, rama.position.y + 0.1 + Math.random() * 0.5, rama.position.z + Math.sin(a) * r);
      spray(
        tmp,
        tmp2
          .copy(hL)
          .sub(tmp)
          .normalize()
          .addScaledVector(V3(-Math.sin(a), 0, Math.cos(a)), 0.8),
        Math.random() < 0.7 ? 0xd8c8a0 : 0x9ac870,
        1,
        3.2,
        0.1,
        0.4,
      );
    }
    const mv = drawn && !!K.manava,
      MF = manaFx;
    manaRing.visible = false;
    manaPt.visible = MF.seal.visible = MF.brow.visible = mv;
    MF.thread.visible = false;
    MF.orbs.forEach((o) => {
      o.visible = mv;
    });
    mKick = Math.max(0, mKick - dt * 5);
    if (!mv) {
      MF.rings.forEach((m) => {
        m.visible = false;
      });
      MF.landed.fill(false);
    } else {
      const e = draw,
        P = tmp.copy(hL).addScaledVector(poseDir, 0.3);
      qI.setFromUnitVectors(V3(0, 0, 1), poseDir);
      if (e < 0.05) MF.landed.fill(false);
      MF.rings.forEach((m, i) => {
        const land = [0.4, 0.7, 1][i],
          p = Math.min(1, e / land),
          after = Math.max(0, (e - land) / 0.12);
        m.visible = after < 1;
        m.position.copy(P).addScaledVector(poseDir, (1.5 + i * 0.35) * (1 - p) ** 2);
        m.quaternion.copy(qI);
        m.scale.setScalar(1.3 * (1 - p) + 0.13 + after * 0.5);
        m.material.opacity = p * 0.9 * (1 - Math.min(1, after));
        if (p >= 1 && !MF.landed[i]) {
          MF.landed[i] = true;
          puff(P, 0xdff2ff, 10, 2.2, 0.3, 0);
          mKick = 1;
        }
      });
      manaPt.position.copy(P);
      manaPt.scale.setScalar(0.15 + e * 0.75 + mKick * 0.4);
      manaPt.material.opacity = 0.4 + e * 0.6;
      MF.seal.position.copy(P).addScaledVector(poseDir, 0.04);
      MF.seal.quaternion.copy(qI).multiply(qB.setFromAxisAngle(V3(0, 0, 1), T * 1.5));
      MF.seal.scale.setScalar(0.3 + e * 0.95 + mKick * 0.12);
      MF.seal.material.opacity = e * 0.85;
      MF.orbs.forEach((o, i) => {
        const a = T * (5 + e * 16) + i * 2.094,
          r = 0.55 * (1 - e) + 0.05;
        o.position
          .copy(P)
          .addScaledVector(bx, Math.cos(a) * r)
          .addScaledVector(by, Math.sin(a) * r)
          .addScaledVector(poseDir, (i - 1) * 0.14 * (1 - e));
        o.scale.setScalar(0.16 + e * 0.1);
      });
      const tr = 0.01 + e * 0.022 + mKick * 0.03;
      MF.thread.position.copy(P).addScaledVector(poseDir, 4.5);
      MF.thread.quaternion.setFromUnitVectors(UP, poseDir);
      MF.thread.scale.set(tr, 9, tr);
      MF.thread.material.opacity = e * 0.7;
      bone.head.getWorldPosition(tmp2);
      MF.brow.position.copy(tmp2).addScaledVector(UP, 0.2);
      MF.brow.scale.setScalar(0.18 + e * 0.3);
      MF.brow.material.opacity = e * 0.85;
    }
    const ag = drawn && !!K.agni;
    agniA.visible = agniB.visible = ag;
    if (ag) {
      const e = draw * draw * (3 - 2 * draw),
        fl = 1 + Math.sin(T * 31) * 0.04 + Math.sin(T * 17) * 0.03;
      qI.setFromUnitVectors(V3(0, 0, 1), poseDir);
      agniA.position.copy(hL).addScaledVector(poseDir, 0.28);
      agniA.quaternion.copy(qI).multiply(qB.setFromAxisAngle(V3(0, 0, 1), -T * 2.2));
      agniA.scale.setScalar((0.25 + e * 1.35) * fl);
      agniA.material.opacity = e * (0.85 + 0.15 * Math.sin(T * 40));
      agniB.position.copy(hL).addScaledVector(poseDir, 0.52);
      agniB.quaternion.copy(qI).multiply(qB.setFromAxisAngle(V3(0, 0, 1), T * 3.8));
      agniB.scale.setScalar((0.15 + e * 0.7) * fl);
      agniB.material.opacity = e * 0.9;
      if (Math.random() < 0.6)
        puff(
          tmp
            .copy(hL)
            .addScaledVector(bx, (Math.random() - 0.5) * 0.7)
            .addScaledVector(by, (Math.random() - 0.5) * 0.9),
          Math.random() < 0.6 ? 0xff8a20 : 0xffd060,
          1,
          0.5,
          0.55,
          -4.5,
        );
    }
    const ng = drawn && !!K.naga;
    nagaA.visible = nagaB.visible = ng;
    if (ng) {
      const e = draw * draw * (3 - 2 * draw);
      qI.setFromUnitVectors(V3(0, 0, 1), poseDir);
      nagaA.position.copy(hL).addScaledVector(poseDir, 0.28);
      nagaA.quaternion.copy(qI).multiply(qB.setFromAxisAngle(V3(0, 0, 1), T * 2.6));
      nagaA.scale.setScalar(0.25 + e * 1.3);
      nagaA.material.opacity = e;
      nagaB.position.copy(hL).addScaledVector(poseDir, 0.52);
      nagaB.quaternion.copy(qI).multiply(qB.setFromAxisAngle(V3(0, 0, 1), -T * 4.2));
      nagaB.scale.setScalar(0.15 + e * 0.65);
      nagaB.material.opacity = e * 0.9;
      if (Math.random() < 0.5) {
        tmp
          .copy(hL)
          .addScaledVector(bx, (Math.random() - 0.5) * 1.2)
          .addScaledVector(by, (Math.random() - 0.5) * 1.2);
        spray(tmp, tmp2.copy(hL).sub(tmp).normalize(), 0x9aff6a, 1, 2.2, 0.1, 0.3);
      }
    }
    const ch = drawn && !!K.charge;
    chargeA.visible = chargeB.visible = chargeC.visible = ch;
    if (ch) {
      chargeC.position.set(rama.position.x, rama.position.y + 0.06, rama.position.z);
      chargeC.scale.setScalar(0.5 + draw * 6);
      chargeC.rotation.y = T * 1.5;
      chargeC.material.opacity = draw * 0.9;
      qI.setFromUnitVectors(V3(0, 0, 1), poseDir);
      chargeA.position.copy(hL).addScaledVector(poseDir, 0.3);
      chargeA.quaternion.copy(qI).multiply(qB.setFromAxisAngle(V3(0, 0, 1), T * 2.2));
      chargeA.scale.setScalar(0.3 + draw * 1.7);
      chargeA.material.opacity = draw;
      chargeB.position.copy(hL).addScaledVector(poseDir, 0.62);
      chargeB.quaternion.copy(qI).multiply(qB.setFromAxisAngle(V3(0, 0, 1), -T * 3.4));
      chargeB.scale.setScalar(0.2 + draw * 0.9);
      chargeB.material.opacity = draw * 0.9;
    }
  }
  if (invoking && Math.random() < 0.9) {
    const a = Math.random() * 6.283,
      r = 0.5 + Math.random() * 2.4;
    puff(
      tmp2.set(rama.position.x + Math.cos(a) * r, rama.position.y + 0.1, rama.position.z + Math.sin(a) * r),
      KINDS[kind].color,
      1,
      0.3,
      1.1,
      -2.2 - invP * 2,
    );
  }
  reticle.visible = firing;
  reticle.position.copy(aimPt);
  reticle.material.color.set(KINDS[kind].color);
}
function shotsUpdate(dt) {
  // arrows in flight: trails, weaving, impacts
  for (const s of shots) {
    if (!s.live) {
      if (s.g.visible) {
        s.gone = (s.gone || 0) + dt;
        const k = 1 - Math.max(0, s.gone - 0.9) / 0.3;
        if (k <= 0) s.g.visible = false;
        else s.g.scale.setScalar(k);
      }
      continue;
    }
    const K = s.K,
      p0 = tmp.copy(s.g.position);
    s.t += dt;
    if (s.lock && (s.lock.dead || s.lock.flung)) s.lock = null;
    let struck = null;
    if (s.lock) {
      const sp = s.v.length(),
        dl = bodyPt(s.lock, tmpB).sub(s.g.position).length();
      if (dl <= sp * dt + 0.25) {
        s.g.position.copy(bodyPt(s.lock, tmpB));
        struck = s.lock;
      } else {
        s.v.lerp(tmpB.multiplyScalar(sp / dl), Math.min(1, dt * 14)).setLength(sp);
        s.g.position.addScaledVector(s.v, dt);
      }
    } else {
      s.v.y -= K.grav * dt;
      s.g.position.addScaledVector(s.v, dt);
    }
    if (K.naga) {
      const sp = s.v.length();
      if (sp > K.speed) s.v.multiplyScalar(Math.max(K.speed / sp, 1 - 4 * dt));
    }
    if (K.wave) s.g.position.addScaledVector(s.side, Math.cos(s.t * 9) * 6.5 * dt);
    tmp2.copy(s.v).normalize();
    s.g.quaternion.setFromUnitVectors(V3(0, 0, 1), tmp2);
    if (s.disc) {
      s.disc.rotation.z += dt * 7;
      trailUpdate(s);
    }
    if (s.ribbon) trailUpdate(s);
    if (K.trail) {
      const [c, n, life, spd, gr] = K.trail,
        q = s.g.position.clone();
      if (K.spiral) q.addScaledVector(s.side, Math.cos(s.t * 34) * 0.28).addScaledVector(UP, Math.sin(s.t * 34) * 0.28);
      puff(q, c, n, spd, life, gr, 0.08);
    }
    let hitP = null;
    if (struck) {
      hitP = s.g.position.clone();
      struck.wob = 1;
      struck.pw = -1;
      struck.vel.addScaledVector(tmp2, 1.2);
    }
    if (!s.lock)
      for (const t of targets) {
        const d0 = p0.clone().sub(t.c).dot(t.n),
          d1 = s.g.position.clone().sub(t.c).dot(t.n);
        if (d0 > 0.1 && d1 <= 0.1) {
          const hit = p0.clone().lerp(s.g.position, (d0 - 0.1) / (d0 - d1));
          if (hit.distanceTo(t.c) < 0.7) {
            hitP = hit;
            t.wob = 1;
            hits++;
          }
        }
      }
    if (!hitP && !s.lock)
      for (const d of dummies) {
        const q = s.g.position;
        if (
          !d.flung &&
          !d.dead &&
          Math.hypot(q.x - d.g.position.x, q.z - d.g.position.z) < 0.42 &&
          q.y - d.g.position.y < 1.85 &&
          q.y - d.g.position.y > -0.5
        ) {
          hitP = q.clone();
          d.wob = 1;
          d.pw = -1;
          d.vel.addScaledVector(tmp2, 1.2);
          break;
        }
      }
    if (!hitP && (s.g.position.y < groundY(s.g.position.x, s.g.position.z) + 0.02 || s.g.position.distanceTo(s.from) > 70))
      hitP = s.g.position.clone();
    if (hitP) {
      s.live = false;
      s.g.position.copy(hitP).addScaledVector(tmp2, -0.45);
      s.g.userData.glow.visible = false;
      K.hit(hitP, tmp2.clone());
      if (s.disc) {
        s.g.remove(s.disc);
        s.disc = null;
      }
      if (s.trail) {
        const tr = s.trail;
        s.trail = null;
        s.ribbon = false;
        let o = 1;
        fx.push((dt) => {
          o -= dt * 3;
          tr.material.opacity = Math.max(0, o);
          if (o <= 0) {
            scene.remove(tr);
            tr.geometry.dispose();
            return false;
          }
          return true;
        });
      }
    }
  }
}
function worldUpdate(dt) {
  dummyUpdate(dt);
  gruntUpdate(dt);
  sageUpdate(dt);
  collide();
  if (shadowFollow) {
    key.target.position.set(Math.round(tgt.x), groundY(tgt.x, tgt.z), Math.round(tgt.z));
    key.position.copy(key.target.position).add(shadowOff);
  }
  fxUpdate(dt);
  for (const t of targets) {
    if (t.wob > 0) {
      t.wob = Math.max(0, t.wob - dt * 1.6);
      t.g.rotation.x = Math.sin(t.wob * 22) * 0.07 * t.wob;
    }
  }
  flames.forEach((m, i) => {
    m.scale.set(
      (1 + Math.sin(T * 9 + i) * 0.1) * (1 + fireFlare * 0.5),
      (1 + Math.sin(T * 12 + i * 2) * 0.18) * (1 + fireFlare * 1.1),
      1 + fireFlare * 0.5,
    );
    m.rotation.y = T * (1 + i);
  });
  fireL.intensity = 9 + Math.sin(T * 13) * 1.2 + Math.sin(T * 7.3) * 0.8 + fireFlare * 16;
}
function cameraUpdate(dt) {
  // camera: one orbiting view from above, never cutting in close
  // a level's scene may point the camera at something else for a while (CAM, a position that may move): it drifts across, unhurried
  tgt.lerp(
    tmp.copy(CAM || (who === 'sage' ? V.group.position : rama.position)).add(V3(0, 0.9, 0)),
    camInit ? Math.min(1, dt * (CAM ? 1.4 : 4)) : (camInit = 1),
  );
  cam.position.set(
    tgt.x + Math.sin(yaw) * Math.cos(pitch) * dist + (Math.random() - 0.5) * shake * 0.5,
    tgt.y + Math.sin(pitch) * dist + (Math.random() - 0.5) * shake * 0.5,
    tgt.z + Math.cos(yaw) * Math.cos(pitch) * dist,
  );
  cam.lookAt(tgt);
}
