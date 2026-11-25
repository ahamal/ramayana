'use strict';
// The character workshop: straw dummies and target boards to shoot at, the on-screen buttons, and the frame loop.
// It stands on the same ground as Level 1: the same clear morning, the same grass, and (from altar.js) the same fire on its
// plastered floor, looked at from the same height and distance
setDay();
TREE_MATS.trunk.color.set(0x7b5a3d);
yaw = 0;
dist = 28;
pitch = 0.62;
// ---------- practice dummies and target boards ----------
for (let i = 0; i < 10; i++) {
  const a = (i / 10) * 6.283 + 0.15,
    r = 7.2 + (i % 3) * 1.6,
    g = new THREE.Group(),
    mat = toon(0xc9a45a);
  g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  g.rotation.y = Math.atan2(-g.position.x, -g.position.z);
  scene.add(g);
  cyl(g, 0.04, 0.05, 0.6, WOOD, [0, 0.3, 0]);
  cyl(g, 0.24, 0.3, 0.85, mat, [0, 0.98, 0]);
  sph(g, 0.2, mat, [0, 1.6, 0], [1, 1.05, 1]);
  cyl(g, 0.07, 0.07, 1.0, mat, [0, 1.25, 0], [0, 0, Math.PI / 2]);
  for (const y of [0.75, 1.2]) tor(g, 0.28 - (y - 0.75) * 0.06, 0.02, WOOD, [0, y, 0], [Math.PI / 2, 0, 0]);
  dummies.push({ g, mat, home: g.position.clone(), vel: V3(), wob: 0, rest: 9, char: 0, flung: false, ft: 0 });
}
for (let i = 0; i < 7; i++) {
  const a = (i / 7) * Math.PI * 2 + 0.3,
    r = 11 + (i % 3) * 2.5,
    g = new THREE.Group();
  g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  g.lookAt(0, 0, 0);
  scene.add(g);
  add(g, new THREE.CylinderGeometry(0.62, 0.62, 0.22, 28), [straw, face, straw], [0, 1.15, 0], [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) cyl(g, 0.03, 0.03, 1.5, WOOD, [s * 0.35, 0.72, -0.25], [-0.3, 0, s * 0.12]);
  cyl(g, 0.03, 0.03, 1.5, WOOD, [0, 0.72, -0.5], [0.45, 0, 0]);
  targets.push({ g, c: V3(g.position.x, 1.15, g.position.z), n: V3(-Math.cos(a), 0, -Math.sin(a)), wob: 0 });
}
// the Night button: the same night as the level's, coming on and going over a couple of seconds
const DARK_ON = { on: false, k: 0 };
function ui() {
  const mv = who !== 'sage' ? move : SG.move;
  $('arrows').style.display = who === 'rama' ? '' : 'none';
  document.querySelector('#tabs [data-f]').textContent = who === 'sage' ? 'Lightning' : 'Rapid fire';
  document.querySelector('#tabs [data-g]').style.display = who === 'sage' ? 'none' : '';
  document
    .querySelectorAll('#tabs button, #who button')
    .forEach((b) =>
      b.classList.toggle(
        'on',
        b.dataset.w ? b.dataset.w === who : b.dataset.n ? (who !== 'sage' ? namaste : SG.namaste) : b.dataset.f ? latch : b.dataset.g ? FOLLOW : b.dataset.c ? CALM : b.dataset.t ? DARK_ON.on : b.dataset.m === mv,
      ),
    );
}
$('tabs').onclick = (e) => {
  const d = e.target.dataset;
  if (d.w) selectHero(d.w);
  else if (d.m) setMove(d.m);
  else if (d.n) toggleNam();
  else if (d.g) FOLLOW = !FOLLOW;
  else if (d.c) CALM = !CALM;
  else if (d.t) DARK_ON.on = !DARK_ON.on;
  else if (d.f) {
    latch = !latch;
    if (latch) press();
    else release();
  } else return;
  ui();
};
$('who').onclick = $('tabs').onclick;
$('summon').onclick = (e) => {
  e.stopPropagation();
  if (e.target.dataset.k) summon(e.target.dataset.k);
};
let fpsN = 0,
  fpsT = 0,
  shown = 0;
function frame(now) {
  fpsN++;
  if (now - fpsT >= 500) {
    $('fps').textContent = Math.round((fpsN * 1000) / (now - fpsT)) + ' fps · ' + grunts.length + ' enemies';
    fpsN = 0;
    fpsT = now;
  }
  requestAnimationFrame(frame);
  const dt = tick(now);
  heroUpdate(dt);
  shotsUpdate(dt);
  worldUpdate(dt);
  hearthUpdate(dt);
  if (DARK_ON.k !== (DARK_ON.on ? 1 : 0)) {
    DARK_ON.k = Math.max(0, Math.min(1, DARK_ON.k + ((DARK_ON.on ? 1 : -1) * dt) / 2));
    skyNight(DARK_ON.k);
  }
  cameraUpdate(dt);
  composer.render();
  if (!shown && T > 0.8) {
    shown = 1;
    $('load').style.opacity = 0;
    setTimeout(() => $('load').remove(), 700);
  } // the curtain lifts only once the scene has run for a moment: shaders are compiled and everything has settled
}
ui();
pickKind(0);
requestAnimationFrame(frame);
window.L = {
  PB,
  renderer,
  camDbg: () => [tgt.x, tgt.z, shake, cam.position.x, cam.position.y, cam.position.z].map((v) => +v.toFixed(3)),
  grunts,
  summon,
  bone,
  rama,
  pickKind,
  set: (m, f) => {
    move = m;
    firing = !!f;
    ui();
  },
  sage: (m) => {
    SG.move = m;
    ui();
  },
  SG,
  view: (y, p, d) => {
    yaw = y;
    pitch = p;
    dist = d;
  },
  pick: (w) => {
    selectHero(w);
  },
  V,
  state: () => ({
    back,
    twist: +twist.toFixed(2),
    face: +facing.toFixed(2),
    mface: +mface.toFixed(2),
    move,
    firing,
    shots: shots.length,
    hits,
    draw,
    wAim,
    wWalk,
    wRun,
  }),
};
