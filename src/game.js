// game.js — Level 1: the six nights of Siddhashrama.
(() => {
'use strict';
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const hyp = Math.hypot;

// ---------- data ----------
const CELL = 2, N = 40, HALF = 40, R_BUILD = 18, R_SPAWN = 35;
const GATES = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const T = {
  arch: { name: 'Archer Platform', cost: 40, hp: 320, tiers: [{ r: 11, d: 9, cd: 0.9 }, { r: 12, d: 15, cd: 0.85, w: 50, m: 20 }, { r: 13, d: 24, cd: 0.7, w: 80, m: 45 }] },
  shr: { name: "Rishi's Shrine", cost: 50, hp: 320, tiers: [{ r: 7, slow: 0.35, v: 0.15 }, { r: 8, slow: 0.45, v: 0.25, w: 50, m: 25 }, { r: 9, slow: 0.55, v: 0.35, w: 70, m: 50 }] },
  braz: { name: 'Fire Brazier', cost: 60, hp: 320, tiers: [{ r: 5.5, d: 10, cd: 1.4 }, { r: 6, d: 17, cd: 1.3, w: 60, m: 25 }, { r: 6.5, d: 27, cd: 1.2, w: 90, m: 50 }] },
  wall: { name: 'Palisade', cost: 10, hp: 120, tiers: [{}] },
};
const E = {
  rak: { hp: 40, sp: 3.2, fire: 2, merit: 2, touch: 6 },
  pish: { hp: 16, sp: 6, fire: 1, merit: 1, touch: 3 },
  def: { hp: 28, sp: 4.5, fire: 1.5, merit: 3, fly: 1 },
  brute: { hp: 170, sp: 2, fire: 5, merit: 8, touch: 14, smash: 30 },
  tataka: { hp: 1300, sp: 1.5, fire: 4, merit: 60, touch: 30, smash: 60, boss: 'Tataka' },
  subahu: { hp: 1700, sp: 2, fire: 4, merit: 60, touch: 25, smash: 50, boss: 'Subahu' },
  maricha: { hp: 1100, sp: 5, fire: 3, merit: 60, fly: 1, boss: 'Maricha' },
};
// [type, count, gate, start second, gap]
const WAVES = [
  [['rak', 14, 'N', 0, 1.4]],
  [['rak', 14, 'N', 0, 1.4], ['pish', 16, 'E', 4, 0.45], ['pish', 16, 'W', 14, 0.45]],
  [['rak', 16, 'N', 0, 1.2], ['pish', 16, 'E', 6, 0.5], ['tataka', 1, 'N', 14, 1], ['pish', 10, 'W', 24, 0.5]],
  [['def', 8, 'E', 0, 1.4], ['rak', 18, 'N', 2, 1.1], ['def', 8, 'W', 10, 1.4], ['pish', 14, 'S', 12, 0.5]],
  [['brute', 3, 'N', 0, 5], ['rak', 20, 'S', 2, 1.1], ['pish', 24, 'E', 6, 0.45], ['def', 10, 'W', 10, 1.3], ['brute', 3, 'S', 18, 5]],
  [['rak', 12, 'N', 0, 1.2], ['pish', 12, 'S', 3, 0.5], ['def', 6, 'E', 5, 1.5], ['brute', 2, 'N', 8, 5], ['subahu', 1, 'W', 12, 1], ['maricha', 1, 'E', 12, 1]],
];
const STORY = [
  'The first night. Rakshasas will come down the north path. Build archer platforms beside it.',
  'Pishachas hunt in swarms from east and west. A fire brazier burns many at once.',
  'The earth trembles. Tataka, terror of this forest, is coming for the fire.',
  'Defilers take wing to foul the altar from above. Only arrows can reach them.',
  'Brutes will tear down what you have built. Hold the north and south paths.',
  'The final night. Maricha and Subahu lead the host themselves.',
];

const S = { phase: 'title', night: 0, t: 0, dayT: 0, wood: 120, merit: 0, sanct: 100, astras: false, cdQ: 0, cdE: 0, dust: 0, queue: [], build: null, post: false, sel: null };

// ---------- renderer & world ----------
const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0, 60, 140);
const cam = new THREE.PerspectiveCamera(40, 1, 1, 400);
let camK = 1;
const camT = new THREE.Vector3(0, 0, 3);

const hemi = new THREE.HemisphereLight(0xcfe0ff, 0x4a3a20, 0.5); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d0, 1.1); sun.position.set(22, 46, 16); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006;
Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 130 });
scene.add(sun);
const fireLight = new THREE.PointLight(0xff8a30, 1, 60, 1.4); fireLight.position.set(0, 3.5, 0); scene.add(fireLight);
const flash = new THREE.PointLight(0xffb060, 0, 60, 1.5); flash.position.y = 6; scene.add(flash);

function groundTex() {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const g = c.getContext('2d'), U = 1024 / 120, C = 512;
  g.fillStyle = '#3d5a2a'; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 20000; i++) { g.fillStyle = `hsla(${rnd(75, 120)},${rnd(25, 45)}%,${rnd(16, 34)}%,.5)`; g.fillRect(rnd(0, 1024), rnd(0, 1024), rnd(1, 4), rnd(1, 4)); }
  g.strokeStyle = '#8a7650'; g.lineWidth = 5.5 * U; g.beginPath(); g.moveTo(C, 0); g.lineTo(C, 1024); g.moveTo(0, C); g.lineTo(1024, C); g.stroke();
  const gr = g.createRadialGradient(C, C, 8 * U, C, C, 22 * U);
  gr.addColorStop(0, '#a48e60'); gr.addColorStop(0.85, '#8f7a52'); gr.addColorStop(1, 'rgba(143,122,82,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(C, C, 22 * U, 0, 7); g.fill();
  for (let i = 0; i < 12000; i++) { const a = rnd(0, 6.3), r = rnd(0, 21) * U; g.fillStyle = `rgba(${rnd(60, 130) | 0},${rnd(50, 100) | 0},${rnd(30, 60) | 0},.25)`; g.fillRect(C + Math.cos(a) * r, C + Math.sin(a) * r, rnd(1, 3.5), rnd(1, 3.5)); }
  // rangoli around the altar
  g.lineWidth = 2.5; g.strokeStyle = 'rgba(255,244,220,.85)';
  for (const r of [2.9, 4.6, 5.0]) { g.beginPath(); g.arc(C, C, r * U, 0, 7); g.stroke(); }
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    g.save(); g.translate(C + Math.cos(a) * 3.8 * U, C + Math.sin(a) * 3.8 * U); g.rotate(a);
    g.fillStyle = i % 2 ? 'rgba(255,138,26,.85)' : 'rgba(200,40,40,.8)'; g.beginPath(); g.ellipse(0, 0, 0.75 * U, 0.3 * U, 0, 0, 7); g.fill(); g.stroke(); g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
}
const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ map: groundTex(), roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

(function forest() {
  const TN = 320, o = new THREE.Object3D(), col = new THREE.Color();
  const trunk = new THREE.InstancedMesh(M.geo.cyl, M.mat(0x4a3220), TN);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1 });
  const l1 = new THREE.InstancedMesh(M.geo.cone, leafMat, TN), l2 = new THREE.InstancedMesh(M.geo.cone, leafMat, TN);
  for (let n = 0; n < TN;) {
    const r = rnd(22.5, 57), a = rnd(0, 6.3), x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (Math.abs(x) < 3.4 || Math.abs(z) < 3.4 || z > 31) continue;
    const s = rnd(0.8, 1.6);
    o.rotation.y = rnd(0, 6); o.position.set(x, 1.2 * s, z); o.scale.set(0.28 * s, 2.4 * s, 0.28 * s); o.updateMatrix(); trunk.setMatrixAt(n, o.matrix);
    o.position.y = 3.6 * s; o.scale.set(1.7 * s, 3.4 * s, 1.7 * s); o.updateMatrix(); l1.setMatrixAt(n, o.matrix);
    o.position.y = 5.3 * s; o.scale.set(1.2 * s, 2.6 * s, 1.2 * s); o.updateMatrix(); l2.setMatrixAt(n, o.matrix);
    col.setHSL(rnd(0.24, 0.36), rnd(0.35, 0.55), rnd(0.2, 0.32)); l1.setColorAt(n, col); l2.setColorAt(n, col.offsetHSL(0, 0, 0.04));
    n++;
  }
  for (const m of [trunk, l1, l2]) { m.castShadow = true; scene.add(m); }
})();

const altar = M.altar(); scene.add(altar.g);

// ---------- grid & pathing ----------
const occ = new Array(N * N).fill(null);
const cidx = (x, z) => { const i = Math.floor((x + HALF) / CELL), j = Math.floor((z + HALF) / CELL); return i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i; };
const cpos = k => [(k % N + 0.5) * CELL - HALF, (((k / N) | 0) + 0.5) * CELL - HALF];
const GATE_CELLS = Object.values(GATES).map(g => cidx(g[0] * R_SPAWN + 0.5, g[1] * R_SPAWN + 0.5));
function flow(test = -1) {
  const d = new Float32Array(N * N).fill(1e9), nx = new Int16Array(N * N).fill(-1), q = [];
  const blocked = m => occ[m] || m === test;
  for (const k of [19 * N + 19, 19 * N + 20, 20 * N + 19, 20 * N + 20]) { d[k] = 0; q.push(k); }
  for (let h = 0; h < q.length; h++) {
    const k = q[h], i = k % N, j = (k / N) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= N || b >= N) continue;
      const m = b * N + a; if (blocked(m)) continue;
      if (di && dj && (blocked(j * N + a) || blocked(b * N + i))) continue;
      const nd = d[k] + (di && dj ? 1.414 : 1);
      if (nd < d[m] - 1e-3) { d[m] = nd; nx[m] = k; q.push(m); }
    }
  }
  return { d, nx };
}

const huts = [[-13, 9], [13, 9], [-11, -13]].map(([x, z]) => { const h = M.hut(); h.position.set(x, 0, z); h.rotation.y = Math.atan2(-x, -z); scene.add(h); occ[cidx(x, z)] = { fixed: true }; return { x, z }; });
let F = flow();

// ---------- gate markers: show where the next foes come from ----------
const gateMarks = {};
for (const [n, g] of Object.entries(GATES)) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1.6, 3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff3020, transparent: true, depthWrite: false }));
  m.position.set(g[0] * 22.5, 0.12, g[1] * 22.5); m.rotation.y = Math.atan2(g[1], -g[0]); m.visible = false; scene.add(m); gateMarks[n] = m;
}

// ---------- effects ----------
const PN = 900, ppos = new Float32Array(PN * 3).fill(-999), pcol = new Float32Array(PN * 3), pvel = new Float32Array(PN * 3), plife = new Float32Array(PN), pmax = new Float32Array(PN), pbase = new Float32Array(PN * 3), pgrav = new Float32Array(PN);
let pi = 0, shake = 0;
const pgeo = new THREE.BufferGeometry();
pgeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3)); pgeo.setAttribute('color', new THREE.BufferAttribute(pcol, 3));
const dot = document.createElement('canvas'); dot.width = dot.height = 32;
{ const g = dot.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }
const points = new THREE.Points(pgeo, new THREE.PointsMaterial({ size: 0.9, map: new THREE.CanvasTexture(dot), vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
points.frustumCulled = false; scene.add(points);
const tc = new THREE.Color();
function burst(x, y, z, color, n = 8, speed = 3, life = 0.6, grav = 6) {
  tc.set(color);
  for (let i = 0; i < n; i++) {
    const k = pi++ % PN, a = rnd(0, 6.3), u = rnd(-0.3, 1), s = speed * rnd(0.3, 1), h = Math.sqrt(1 - Math.min(1, u * u));
    ppos[k * 3] = x; ppos[k * 3 + 1] = y; ppos[k * 3 + 2] = z;
    pvel[k * 3] = Math.cos(a) * h * s; pvel[k * 3 + 1] = u * s; pvel[k * 3 + 2] = Math.sin(a) * h * s;
    pbase[k * 3] = tc.r; pbase[k * 3 + 1] = tc.g; pbase[k * 3 + 2] = tc.b;
    plife[k] = pmax[k] = life * rnd(0.6, 1); pgrav[k] = grav;
  }
}
function updParticles(dt) {
  for (let k = 0; k < PN; k++) {
    if (plife[k] <= 0) continue;
    plife[k] -= dt; const f = Math.max(0, plife[k] / pmax[k]), j = k * 3;
    pvel[j + 1] -= pgrav[k] * dt;
    ppos[j] += pvel[j] * dt; ppos[j + 1] += pvel[j + 1] * dt; ppos[j + 2] += pvel[j + 2] * dt;
    pcol[j] = pbase[j] * f; pcol[j + 1] = pbase[j + 1] * f; pcol[j + 2] = pbase[j + 2] * f;
    if (plife[k] <= 0) ppos[j + 1] = -999;
  }
  pgeo.attributes.position.needsUpdate = pgeo.attributes.color.needsUpdate = true;
}
const ringGeo = new THREE.RingGeometry(0.9, 1, 48); ringGeo.rotateX(-Math.PI / 2);
const shocks = [];
function shock(x, z, r, color, dur = 0.5) {
  const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.position.set(x, 0.15, z); scene.add(m); shocks.push({ m, r, t: 0, dur });
}
function floatText(x, y, z, text, color) {
  const [sx, sy] = toScreen(x, y, z), d = document.createElement('div');
  d.className = 'float'; d.textContent = text; d.style.cssText = `left:${sx}px;top:${sy}px;color:${color}`;
  document.body.appendChild(d); setTimeout(() => d.remove(), 1200);
}
const v3 = new THREE.Vector3();
function toScreen(x, y, z) { v3.set(x, y, z).project(cam); return [(v3.x + 1) / 2 * innerWidth, (1 - v3.y) / 2 * innerHeight]; }
function toGround(cx, cy) { v3.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1, 0.5).unproject(cam).sub(cam.position); const t = -cam.position.y / v3.y; return [cam.position.x + v3.x * t, cam.position.z + v3.z * t]; }
let bannerT, toastT;
function banner(text, dur = 7) { const b = $('banner'); b.textContent = text; b.classList.add('show'); clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('show'), dur * 1000); }
function toast(text) { const b = $('toast'); b.textContent = text; b.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => b.classList.remove('show'), 1600); Snd.sfx('deny'); }

// ---------- heroes & workers ----------
function mkHero(kind, x, z, o) {
  const mesh = M.hero(kind); scene.add(mesh);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: kind === 'rama' ? 0x60b0ff : 0xffd24a, transparent: true, opacity: 0.8, depthWrite: false }));
  ring.position.y = 0.06; ring.scale.setScalar(0.85); mesh.add(ring);
  return Object.assign({ kind, x, z, mesh, hp: 200, max: 200, cd: 0, face: Math.PI, down: 0, lastHit: 9, walk: 0 }, o); }
const rama = mkHero('rama', 0, 6, { range: 13, dmg: 18, rate: 0.45, sp: 9, dest: null });
const lak = mkHero('lak', 4, 5, { range: 12, dmg: 10, rate: 0.55, sp: 8, px: 4, pz: 5 });
const postFlag = M.part('cone', 0xffd24a, 0.25, 0.6, 0.25, 0, 0.3, 0, 0x7a5a00); postFlag.rotation.x = Math.PI; postFlag.visible = false; scene.add(postFlag);
const workers = [0, 1, 2].map(i => { const mesh = M.figure({ skin: 0xc89868, cloth: 0xf0ead8, hair: 0x18120e, s: 0.8 }); scene.add(mesh); return { mesh, x: huts[0].x + i, z: huts[0].z + 2.5, state: 'idle', t: 0, tx: 0, tz: 0 }; });

function moveTo(o, tx, tz, sp, dt) {
  const dx = tx - o.x, dz = tz - o.z, l = hyp(dx, dz);
  if (l < 0.15) return true;
  const st = Math.min(l, sp * dt); o.x += dx / l * st; o.z += dz / l * st; o.face = Math.atan2(dx, dz); o.walk += dt * sp * 1.4;
  return false;
}
function damageHero(h, d) { if (h.down > 0) return; if (h === rama) { $('vig').style.opacity = 1; setTimeout(() => { $('vig').style.opacity = 0; }, 160); } h.hp -= d; h.lastHit = 0; burst(h.x, 1.5, h.z, 0xff4040, 5, 2); if (h.hp <= 0) { h.down = 6; h.mesh.rotation.x = -Math.PI / 2; if (h === rama) banner('Rama is struck down! He will rise again by the fire.', 4); } }
function updHero(h, dt) {
  h.lastHit += dt; h.cd -= dt;
  if (h.down > 0) { h.down -= dt; if (h.down <= 0) { h.hp = h.max; h.x = h === rama ? 0 : 3; h.z = 5; h.mesh.rotation.x = 0; burst(h.x, 1.5, h.z, 0xffe080, 20, 4, 1); } h.mesh.position.set(h.x, 0.3, h.z); return; }
  if (h.lastHit > 4) h.hp = Math.min(h.max, h.hp + 5 * dt);
  let moved = false;
  if (h === rama) {
    let mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), mz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
    if (joy) { mx = joy[0]; mz = joy[1]; }
    if (mx || mz) {
      h.dest = null; const l = hyp(mx, mz), nx = h.x + mx / l * h.sp * dt, nz = h.z + mz / l * h.sp * dt;
      const free = (x, z) => { const k = cidx(x, z); return k >= 0 && !occ[k] && hyp(x, z) < 26 && hyp(x, z) > 2.2; };
      if (free(nx, nz)) { h.x = nx; h.z = nz; } else if (free(nx, h.z)) h.x = nx; else if (free(h.x, nz)) h.z = nz;
      h.face = Math.atan2(mx, mz); h.walk += dt * 12; moved = true;
    } else if (h.dest) { if (moveTo(h, h.dest[0], h.dest[1], h.sp, dt)) h.dest = null; moved = true; }
  } else if (!moveTo(h, h.px, h.pz, h.sp, dt)) moved = true;
  const t = pick(h.x, h.z, h.range * (S.dust > 0 && h !== rama ? 0.6 : 1));
  if (t) { if (!moved) h.face = Math.atan2(t.x - h.x, t.z - h.z); if (h.cd <= 0) { h.cd = h.rate; shoot(h.x, 1.7, h.z, t, h.dmg, h === rama ? 0xffe9a0 : 0xffffff); } }
  M.walk(h.mesh, h.walk, moved ? 0.7 : 0);
  h.mesh.position.set(h.x, 0, h.z); h.mesh.rotation.y = h.face;
}
function updWorker(w, dt) {
  const day = S.phase === 'day';
  if (w.state === 'idle') { if (day) { const a = rnd(0, 6.3); w.tx = Math.sin(a) * 21.5; w.tz = Math.min(15, Math.cos(a) * 21.5); w.state = 'out'; w.mesh.visible = true; } }
  else if (w.state === 'out') { if (!day) w.state = 'back'; else if (moveTo(w, w.tx, w.tz, 5, dt)) { w.state = 'chop'; w.t = 2.5; } }
  else if (w.state === 'chop') { w.t -= dt; w.mesh.userData.armR.rotation.x = -1.4 + Math.sin(w.t * 9) * 0.8; if (w.t <= 0) { w.state = 'back'; w.carry = day; } }
  else if (moveTo(w, huts[0].x, huts[0].z + 2.5, 5, dt)) {
    if (w.carry) { S.wood += 8; floatText(w.x, 2.5, w.z, '+8 🪵', '#ffd24a'); Snd.sfx('wood'); w.carry = false; }
    w.state = 'idle'; if (!day) w.mesh.visible = false;
  }
  if (w.state !== 'chop') M.walk(w.mesh, w.walk || 0, w.state === 'idle' ? 0 : 0.6);
  w.mesh.position.set(w.x, 0, w.z); w.mesh.rotation.y = w.face || 0;
}

// ---------- projectiles ----------
const arrows = [], arrowPool = [], boulders = [];
function shoot(x, y, z, target, dmg, color) {
  const m = arrowPool.pop() || new THREE.Mesh(M.geo.box, new THREE.MeshBasicMaterial());
  m.material.color.set(color); m.scale.set(0.07, 0.07, 1.1); m.position.set(x, y, z); m.visible = true; scene.add(m);
  arrows.push({ m, target, dmg }); Snd.sfx('arrow');
}
function updArrows(dt) {
  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i], e = a.target, p = a.m.position;
    let done = e.dead || e.gone;
    if (!done) {
      v3.set(e.x, e.y + M.H[e.type] * 0.55, e.z); const l = p.distanceTo(v3), st = 48 * dt;
      if (l <= st) { hurt(e, a.dmg); burst(v3.x, v3.y, v3.z, 0xffd080, 3, 2, 0.3); Snd.sfx('hit'); done = true; }
      else { a.m.lookAt(v3); p.lerp(v3, st / l); if (Math.random() < 0.5) burst(p.x, p.y, p.z, 0xffe0a0, 1, 0.2, 0.25, 0); }
    }
    if (done) { a.m.visible = false; arrowPool.push(a.m); arrows.splice(i, 1); }
  }
}
function throwBoulder(e, tx, tz) {
  const m = M.part('sph', 0x6a6258, 0.9, 0.8, 0.9); scene.add(m);
  boulders.push({ m, x0: e.x, z0: e.z, x1: tx, z1: tz, t: 0 });
}
function updBoulders(dt) {
  for (let i = boulders.length - 1; i >= 0; i--) {
    const b = boulders[i]; b.t += dt / 1.3; const p = Math.min(1, b.t);
    b.m.position.set(lerp(b.x0, b.x1, p), lerp(6, 0, p) + Math.sin(p * Math.PI) * 9, lerp(b.z0, b.z1, p)); b.m.rotation.x += dt * 5;
    if (p >= 1) {
      burst(b.x1, 0.5, b.z1, 0xc8a878, 30, 7, 0.8); shock(b.x1, b.z1, 3.2, 0xc8a878); Snd.sfx('boulder'); shake = 0.7;
      for (const h of [rama, lak]) if (hyp(h.x - b.x1, h.z - b.z1) < 3.2) damageHero(h, 40);
      for (const s of structs.slice()) if (hyp(s.x - b.x1, s.z - b.z1) < 3) hitStruct(s, 50);
      scene.remove(b.m); boulders.splice(i, 1);
    }
  }
}

// ---------- structures ----------
const structs = [];
const sBarMat = new THREE.SpriteMaterial({ color: 0x60e060, depthTest: false });
function canPlace(k) {
  if (k < 0 || occ[k]) return false;
  const [x, z] = cpos(k), r = hyp(x, z);
  if (r > R_BUILD || r < 4.5) return false;
  for (const e of enemies) if (!e.def.fly && cidx(e.x, e.z) === k) return false;
  const f = flow(k);
  for (const g of GATE_CELLS) if (f.d[g] > 1e8) return false;
  for (const e of enemies) if (!e.def.fly) { const c = cidx(e.x, e.z); if (c >= 0 && !occ[c] && f.d[c] > 1e8) return false; }
  return true;
}
function setMesh(s) {
  if (s.mesh) scene.remove(s.mesh);
  s.mesh = M.tower(s.type, s.tier + 1); s.mesh.position.set(s.x, 0, s.z);
  if (s.type === 'wall') s.mesh.rotation.y = Math.abs(s.x) > Math.abs(s.z) ? Math.PI / 2 : 0;
  scene.add(s.mesh);
}
function place(type, k) {
  const def = T[type];
  if (S.wood < def.cost) return toast('Not enough wood');
  if (!canPlace(k)) return toast('Cannot build there — the path must stay open');
  S.wood -= def.cost;
  const [x, z] = cpos(k), s = { type, tier: 0, k, x, z, hp: def.hp, max: def.hp, cd: 0, spent: def.cost };
  setMesh(s); occ[k] = s; structs.push(s); F = flow();
  burst(x, 0.5, z, 0xd8c090, 14, 4, 0.5); Snd.sfx('build');
}
function removeStruct(s) { occ[s.k] = null; scene.remove(s.mesh); if (s.bar) scene.remove(s.bar); structs.splice(structs.indexOf(s), 1); F = flow(); if (S.sel === s) select(null); }
function hitStruct(s, d) { s.hp -= d; burst(s.x, 1.5, s.z, 0xc8a060, 10, 4, 0.5); Snd.sfx('hit'); if (s.hp <= 0) { burst(s.x, 1, s.z, 0xc8a060, 30, 6, 0.9); Snd.sfx('crash'); shake = 0.4; removeStruct(s); } }
function updStruct(s, dt) {
  const tr = T[s.type].tiers[s.tier]; s.cd -= dt;
  if (s.hp < s.max) {
    if (!s.bar) { s.bar = new THREE.Sprite(sBarMat); s.bar.center.set(0, 0.5); scene.add(s.bar); }
    s.bar.visible = true; s.bar.position.set(s.x - 0.8, s.type === 'wall' ? 2.8 : 5.4, s.z); s.bar.scale.set(1.6 * s.hp / s.max, 0.18, 1);
  } else if (s.bar) s.bar.visible = false;
  if (s.type === 'arch') {
    if (s.cd <= 0) { const t = pick(s.x, s.z, tr.r * (S.dust > 0 ? 0.6 : 1), true); if (t) { s.cd = tr.cd; shoot(s.x, 3.6, s.z, t, tr.d, 0xfff0c0); } }
  } else if (s.type === 'braz') {
    const f = s.mesh.userData.flame; f.scale.y = 1 + Math.sin(clock * 11 + s.k) * 0.15;
    if (s.cd <= 0) {
      let any = false;
      for (const e of enemies) if (!e.def.fly && hyp(e.x - s.x, e.z - s.z) < tr.r) { hurt(e, tr.d); burst(e.x, 1, e.z, 0xff7a20, 3, 2, 0.4); any = true; }
      if (any) { s.cd = tr.cd; shock(s.x, s.z, tr.r, 0xff7a20, 0.35); Snd.sfx('brazier'); }
    }
  } else if (s.type === 'shr' && Math.random() < dt * 3) burst(s.x + rnd(-1, 1) * tr.r * 0.7, 0.3, s.z + rnd(-1, 1) * tr.r * 0.7, 0xffb040, 1, 0.5, 1.4, -1.5);
}

// ---------- enemies ----------
const enemies = [];
const barMat = new THREE.SpriteMaterial({ color: 0xff4030, depthTest: false });
function spawn(type, gate, at) {
  const def = E[type], g = GATES[gate] || [0, 0];
  const x = at ? at[0] : g[0] * R_SPAWN + (g[0] ? 0 : rnd(-2, 2)), z = at ? at[1] : g[1] * R_SPAWN + (g[1] ? 0 : rnd(-2, 2));
  const mesh = M.enemy(type), bar = new THREE.Sprite(barMat), max = def.hp * (def.boss ? 1 : 1 + 0.2 * S.night);
  bar.center.set(0, 0.5); bar.visible = false; scene.add(mesh, bar);
  const e = { type, def, x, z, y: def.fly ? 5.5 : 0, hp: max, max, mesh, bar, slow: 0, vuln: 0, cd: rnd(1, 2), cd2: 5, cd3: 12, t: rnd(0, 6), hitCd: 0, kx: 0, kz: 0, ang: Math.atan2(x, z) };
  enemies.push(e);
  if (def.boss) {
    const d = document.createElement('div'); d.innerHTML = `<div class="lbl"><span>${def.boss}</span></div><div class="bar"><i></i></div>`;
    $('bosses').appendChild(d); e.dom = d; Snd.sfx('roar');
  }
  return e;
}
function pick(x, z, r, byFire) {
  let best = null, bv = 1e9;
  for (const e of enemies) { if (e.dead || e.gone || e.stag) continue; const d = hyp(e.x - x, e.z - z); if (d > r) continue; const v = byFire ? hyp(e.x, e.z) : d; if (v < bv) { bv = v; best = e; } }
  return best;
}
function hurt(e, d) {
  if (e.dead || e.gone || e.stag) return;
  e.hp -= d * (1 + e.vuln);
  if (e.type === 'maricha' && e.hp <= e.max * 0.15) { e.hp = e.max * 0.15; e.stag = true; S.cdE = 0; banner('Maricha reels! Loose the Manavastra — press E.', 30); return; }
  if (e.hp <= 0) {
    e.dead = true; S.merit += e.def.merit; Snd.sfx('die');
    burst(e.x, e.y + 1, e.z, e.def.boss ? 0xff5030 : 0xa04060, e.def.boss ? 80 : 12, e.def.boss ? 9 : 4, e.def.boss ? 1.4 : 0.6);
    if (e.type === 'tataka') { S.dust = 0; banner('Tataka falls. The forest is quiet again.'); }
    if (e.type === 'subahu') banner('Subahu is slain!');
  }
}
function defile(e, amt) { S.sanct -= amt; Snd.sfx('defile'); for (let i = 0; i < 6; i++) burst(lerp(e.x, 0, i / 6), lerp(e.y, 2, i / 6), lerp(e.z, 0, i / 6), 0x70ff40, 2, 0.6, 0.6, 3); }
function updEnemy(e, dt) {
  const d = e.def; e.t += dt; e.cd -= dt; e.cd2 -= dt; e.cd3 -= dt; e.hitCd -= dt;
  let face = null, attack = false, walking = true;
  if (e.gone) { e.x += 34 * dt; e.y += 16 * dt; e.mesh.rotation.z += 9 * dt; burst(e.x, e.y, e.z, 0x80c0ff, 2, 1, 0.5, 0); if (e.y > 70) e.dead = true; }
  else if (e.type === 'maricha') {
    e.ang += d.sp * (e.stag ? 0.25 : 1 - e.slow) / 11 * dt;
    const k = Math.min(1, dt * 1.5); e.x += (Math.sin(e.ang) * 11 - e.x) * k; e.z += (Math.cos(e.ang) * 11 - e.z) * k;
    face = [Math.cos(e.ang), -Math.sin(e.ang)];
    if (e.stag) { e.mesh.rotation.z = Math.sin(e.t * 12) * 0.3; if (Math.random() < dt * 20) burst(e.x, e.y + 2, e.z, 0x66ffee, 1, 2, 0.5); }
    else {
      if (e.cd <= 0 && hyp(e.x, e.z) < 14) { e.cd = 4; defile(e, d.fire); }
      if (e.cd2 <= 0) { e.cd2 = 9; burst(e.x, e.y + 2, e.z, 0xb060ff, 30, 6, 0.7); e.ang += rnd(2, 4.3); e.x = Math.sin(e.ang) * 11; e.z = Math.cos(e.ang) * 11; burst(e.x, e.y + 2, e.z, 0xb060ff, 30, 6, 0.7); }
    }
  } else if (d.fly) {
    const r = hyp(e.x, e.z);
    if (r > 3.4) { const sp = d.sp * (1 - e.slow); e.x -= e.x / r * sp * dt; e.z -= e.z / r * sp * dt; }
    else if (e.cd <= 0) { e.cd = 2; defile(e, d.fire); }
    face = [-e.x, -e.z];
  } else {
    if (Math.abs(e.kx) + Math.abs(e.kz) > 0.2) { e.x += e.kx * dt; e.z += e.kz * dt; const f = Math.max(0, 1 - 5 * dt); e.kx *= f; e.kz *= f; }
    const r = hyp(e.x, e.z);
    if (r < (d.boss ? 4.4 : 3.3)) { S.sanct -= d.fire * dt; attack = true; walking = false; face = [-e.x, -e.z]; if (Math.random() < dt * 3) burst(0, 2, 0, 0x70ff40, 2, 2, 0.5); }
    else {
      let tgt = null;
      if (d.smash) for (const s of structs) if (hyp(s.x - e.x, s.z - e.z) < (d.boss ? 3.8 : 2.7)) { tgt = s; break; }
      if (tgt) { attack = true; walking = false; face = [tgt.x - e.x, tgt.z - e.z]; if (e.cd <= 0) { e.cd = 1; hitStruct(tgt, d.smash); } }
      else {
        const k = cidx(e.x, e.z), n = k >= 0 ? F.nx[k] : -1; let tx = 0, tz = 0;
        if (n >= 0 && F.d[k] > 1.5) [tx, tz] = cpos(n);
        const dx = tx - e.x, dz = tz - e.z, l = hyp(dx, dz) || 1, sp = d.sp * (1 - e.slow);
        e.x += dx / l * sp * dt; e.z += dz / l * sp * dt; face = [dx, dz];
      }
    }
    if (d.touch && e.hitCd <= 0) for (const h of [rama, lak]) if (!h.down && hyp(h.x - e.x, h.z - e.z) < (d.boss ? 3.2 : 1.7)) { damageHero(h, d.touch); e.hitCd = 1; attack = true; }
    if (e.type === 'tataka') {
      if (e.cd2 <= 0) { e.cd2 = 4.5; const s = structs.length && Math.random() < 0.5 ? structs[(Math.random() * structs.length) | 0] : (Math.random() < 0.6 ? rama : lak); throwBoulder(e, s.x, s.z); }
      if (e.cd3 <= 0) { e.cd3 = 22; S.dust = 8; Snd.sfx('roar'); banner("Tataka raises a storm of dust. Your archers can barely see!", 5); }
    }
    if (e.type === 'subahu' && e.cd2 <= 0) { e.cd2 = 10; Snd.sfx('roar'); for (let i = 0; i < 4; i++) spawn('pish', null, [e.x + rnd(-2, 2), e.z + rnd(-2, 2)]); burst(e.x, 1, e.z, 0xff3020, 30, 6, 0.8); }
  }
  M.walk(e.mesh, e.t * (d.fly ? 9 : d.sp * 2.2), walking ? 0.6 : 0);
  if (attack && e.mesh.userData.armR) e.mesh.userData.armR.rotation.x = -Math.abs(Math.sin(e.t * 7)) * 2;
  if (face && !e.gone) e.mesh.rotation.y = Math.atan2(face[0], face[1]);
  e.mesh.position.set(e.x, e.y + (d.fly ? Math.sin(e.t * 3) * 0.3 : 0), e.z);
  if (e.dom) e.dom.querySelector('i').style.width = Math.max(0, e.hp / e.max * 100) + '%';
  else if (e.hp < e.max) { e.bar.visible = true; e.bar.position.set(e.x - 0.7, e.y + M.H[e.type] + 0.3, e.z); e.bar.scale.set(1.4 * Math.max(0, e.hp / e.max), 0.16, 1); }
}
function updEnemies(dt) {
  for (const e of enemies) { e.slow = 0; e.vuln = 0; }
  for (const s of structs) if (s.type === 'shr') { const tr = T.shr.tiers[s.tier]; for (const e of enemies) if (hyp(e.x - s.x, e.z - s.z) < tr.r) { e.slow = Math.max(e.slow, e.def.boss ? tr.slow * 0.5 : tr.slow); e.vuln = Math.max(e.vuln, tr.v); } }
  for (const e of enemies.slice()) updEnemy(e, dt);
  for (let i = 0; i < enemies.length; i++) { // keep ground enemies from stacking
    const a = enemies[i]; if (a.def.fly || a.def.boss) continue;
    for (let j = i + 1; j < enemies.length; j++) {
      const b = enemies[j]; if (b.def.fly || b.def.boss) continue;
      const dx = b.x - a.x, dz = b.z - a.z, l = hyp(dx, dz);
      if (l < 0.9 && l > 0.001) { const p = (0.9 - l) / 2 / l; a.x -= dx * p; a.z -= dz * p; b.x += dx * p; b.z += dz * p; }
    }
  }
  for (let i = enemies.length - 1; i >= 0; i--) { const e = enemies[i]; if (e.dead) { scene.remove(e.mesh, e.bar); if (e.dom) e.dom.remove(); enemies.splice(i, 1); } }
}

// ---------- astras ----------
function agni() {
  if (!S.astras || S.cdQ > 0 || rama.down || S.phase !== 'night') return;
  const t = pick(rama.x, rama.z, 18); if (!t) return toast('No foe within reach');
  S.cdQ = 16; Snd.sfx('agni'); shake = 0.9; const x = t.x, z = t.z;
  for (const e of enemies.slice()) if (hyp(e.x - x, e.z - z) < 6.5) hurt(e, 90);
  shock(x, z, 6.5, 0xff7a20, 0.7); shock(x, z, 4, 0xffd060, 0.5);
  burst(x, 1, z, 0xff6a10, 90, 11, 1.1, 2); burst(x, 2, z, 0xffe070, 40, 6, 0.8, -2);
  flash.position.set(x, 6, z); flash.color.set(0xff8030); flash.intensity = 6;
}
function manava() {
  if (!S.astras || S.cdE > 0 || rama.down || S.phase !== 'night') return;
  const t = enemies.find(e => e.stag && !e.gone) || pick(rama.x, rama.z, 28);
  let dx = Math.sin(rama.face), dz = Math.cos(rama.face), dist = 30, ty = 1.5;
  if (t) { dist = hyp(t.x - rama.x, t.z - rama.z) || 1; dx = (t.x - rama.x) / dist; dz = (t.z - rama.z) / dist; rama.face = Math.atan2(dx, dz); ty = t.y + 1.5; }
  S.cdE = 12; Snd.sfx('manava');
  for (let i = 0; i < 70; i++) { const p = i / 70 * 30; burst(rama.x + dx * p, lerp(1.6, ty, Math.min(1, p / dist)), rama.z + dz * p, 0x90c8ff, 2, 1.2, 0.7, 0); }
  flash.position.set(rama.x, 5, rama.z); flash.color.set(0x80b0ff); flash.intensity = 4;
  for (const e of enemies.slice()) {
    const ex = e.x - rama.x, ez = e.z - rama.z, along = ex * dx + ez * dz, perp = Math.abs(ex * dz - ez * dx);
    if (along < 0 || along > 30 || perp > 2.4) continue;
    if (e.stag) { e.stag = false; e.gone = true; S.merit += e.def.merit; Snd.sfx('roar'); banner('The Manavastra hurls Maricha a hundred yojanas, far out over the sea.', 7); continue; }
    hurt(e, 70); if (!e.def.boss && !e.def.fly) { e.kx = dx * 16; e.kz = dz * 16; }
  }
}

// ---------- phases ----------
function startDay() {
  S.phase = 'day'; S.dayT = S.night === 0 ? 70 : 42; Snd.setNight(false);
  banner(STORY[S.night], 9);
}
function startNight() {
  if (S.phase !== 'day') return;
  S.phase = 'night'; S.t = 0; S.queue = [];
  for (const [type, n, gate, t0, gap] of WAVES[S.night]) for (let i = 0; i < n; i++) S.queue.push({ t: 2 + t0 + i * gap, type, gate });
  S.queue.sort((a, b) => a.t - b.t);
  Snd.setNight(true); Snd.sfx('conch'); select(null);
}
function endNight() {
  if (S.night === 5) return finish(true);
  S.night++; const grant = 40 + 10 * S.night; S.wood += grant; S.sanct = Math.min(100, S.sanct + 8); S.dust = 0;
  for (const s of structs) s.hp = s.max;
  for (const h of [rama, lak]) h.hp = h.max;
  Snd.sfx('bell'); startDay();
  if (S.night === 3) {
    S.astras = true; $('q').classList.remove('hide'); $('e').classList.remove('hide');
    banner('Vishwamitra grants Rama the divine astras. Q: Agneyastra burns a host. E: Manavastra hurls foes back.', 12);
  }
  floatText(0, 6, 0, `Dawn: +${grant} 🪵`, '#ffd24a');
}
function finish(won) {
  S.phase = won ? 'won' : 'lost'; Snd.setNight(false); Snd.sfx(won ? 'win' : 'lose');
  $('endT').textContent = won ? 'The Sixth Dawn' : 'The Fire Is Defiled';
  $('stars').textContent = won ? '★'.repeat(S.sanct >= 80 ? 3 : S.sanct >= 45 ? 2 : 1) + '☆'.repeat(S.sanct >= 80 ? 0 : S.sanct >= 45 ? 1 : 2) : '';
  $('endP').textContent = won
    ? 'Subahu is slain and Maricha is cast into the distant sea. The yajna is complete, and Vishwamitra blesses the princes of Ayodhya. The road now leads to Mithila.'
    : `The rakshasas fouled the altar on night ${S.night + 1}. The sage must begin the rite again.`;
  $('end').classList.remove('hide');
}

// ---------- input & UI ----------
const keys = {}; let joy = null, hoverK = -1, ptr = null;
const ghost = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5, depthWrite: false }));
const rangeRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.6, depthWrite: false }));
ghost.position.y = 0.06; rangeRing.position.y = 0.08; ghost.visible = rangeRing.visible = false; scene.add(ghost, rangeRing);
let ghostOK = false;
function setBuild(type) {
  S.build = S.build === type ? null : type; S.post = false; select(null); Snd.sfx('click');
  document.querySelectorAll('#bottom [data-b]').forEach(b => b.classList.toggle('on', b.dataset.b === S.build));
  $('post').classList.remove('on'); hoverK = -1; ghost.visible = false; rangeRing.visible = false;
}
function setPost() { const on = !S.post; if (S.build) setBuild(S.build); S.post = on; $('post').classList.toggle('on', on); Snd.sfx('click'); }
function hover(cx, cy) {
  if (!S.build) return;
  const [x, z] = toGround(cx, cy), k = cidx(x, z); if (k === hoverK) return; hoverK = k;
  if (k < 0) { ghost.visible = false; return; }
  const [gx, gz] = cpos(k); ghostOK = canPlace(k);
  ghost.visible = true; ghost.position.set(gx, 0.06, gz); ghost.material.color.set(ghostOK ? 0x60ff60 : 0xff4040);
  const r = T[S.build].tiers[0].r; rangeRing.visible = !!r; if (r) { rangeRing.position.set(gx, 0.08, gz); rangeRing.scale.setScalar(r); }
}
function select(s) {
  S.sel = s; $('pop').classList.toggle('hide', !s);
  if (!S.build) rangeRing.visible = false;
  if (!s) return;
  const def = T[s.type], nx = def.tiers[s.tier + 1], r = def.tiers[s.tier].r;
  $('popName').textContent = `${def.name}${def.tiers.length > 1 ? ' · tier ' + (s.tier + 1) : ''}`;
  $('up').classList.toggle('hide', !nx); if (nx) $('up').textContent = `Upgrade 🪵${nx.w} ✦${nx.m}`;
  $('sell').textContent = `Remove +🪵${Math.round(s.spent * 0.6)}`;
  if (r) { rangeRing.visible = true; rangeRing.position.set(s.x, 0.08, s.z); rangeRing.scale.setScalar(r); }
}
function tap(cx, cy) {
  const [x, z] = toGround(cx, cy), k = cidx(x, z);
  if (S.build) { hoverK = -1; if (k >= 0) place(S.build, k); hover(cx, cy); return; }
  if (S.post) { if (hyp(x, z) < 22 && k >= 0 && !occ[k]) { lak.px = x; lak.pz = z; postFlag.position.set(x, 0.3, z); postFlag.visible = true; setPost(); } return; }
  const s = k >= 0 && occ[k]; if (s && !s.fixed) return select(s);
  select(null); if (hyp(x, z) < 26) rama.dest = [x, z];
}
const cv = $('c');
cv.addEventListener('pointerdown', e => { ptr = { x: e.clientX, y: e.clientY, drag: false }; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => {
  hover(e.clientX, e.clientY); if (!ptr) return;
  const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y, l = hyp(dx, dy);
  if (l > 14) { ptr.drag = true; joy = [dx / l, dy / l]; }
});
const pup = e => { if (ptr && !ptr.drag && e.type === 'pointerup') tap(e.clientX, e.clientY); ptr = null; joy = null; };
cv.addEventListener('pointerup', pup); cv.addEventListener('pointercancel', pup);
addEventListener('keydown', e => {
  keys[e.code] = true; if (S.phase === 'title' || e.repeat) return;
  const b = { Digit1: 'arch', Digit2: 'shr', Digit3: 'braz', Digit4: 'wall' }[e.code];
  if (b) setBuild(b);
  else if (e.code === 'Escape') { if (S.build) setBuild(S.build); if (S.post) setPost(); select(null); }
  else if (e.code === 'KeyQ') agni(); else if (e.code === 'KeyE') manava(); else if (e.code === 'KeyL') setPost();
  else if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); startNight(); }
  else if (e.code === 'KeyM') $('mute').click();
  else if (e.code === 'KeyP') $('pause').click();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
document.querySelectorAll('#bottom [data-b]').forEach(b => b.onclick = () => setBuild(b.dataset.b));
$('post').onclick = setPost; $('q').onclick = agni; $('e').onclick = manava; $('go').onclick = startNight;
$('mute').onclick = () => { $('mute').textContent = Snd.toggleMute() ? '🔇' : '🔊'; };
$('pause').onclick = () => { S.paused = !S.paused; $('pause').textContent = S.paused ? '▶️' : '⏸️'; $('paused').classList.toggle('hide', !S.paused); };
$('up').onclick = () => {
  const s = S.sel, nx = s && T[s.type].tiers[s.tier + 1]; if (!nx) return;
  if (S.wood < nx.w || S.merit < nx.m) return toast('Not enough wood or merit');
  S.wood -= nx.w; S.merit -= nx.m; s.spent += nx.w; s.tier++; setMesh(s); select(s); Snd.sfx('build'); burst(s.x, 2, s.z, 0xffd24a, 24, 5, 0.8);
};
$('sell').onclick = () => { const s = S.sel; if (!s) return; S.wood += Math.round(s.spent * 0.6); removeStruct(s); Snd.sfx('click'); };
$('begin').onclick = () => { Snd.init(); $('title').classList.add('hide'); startDay(); };

function resize() {
  const a = innerWidth / innerHeight; renderer.setSize(innerWidth, innerHeight, false);
  cam.aspect = a; camK = Math.max(1, Math.min(2.1, 1.2 / a)); cam.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

function hud() {
  $('night').textContent = `Night ${S.night + 1} of 6`;
  $('phase').textContent = S.phase === 'day' ? `Day · dusk in ${Math.ceil(S.dayT)}s` : S.phase === 'night' ? `${S.queue.length + enemies.length} foes remain` : '';
  $('sanct').firstChild.style.width = Math.max(0, S.sanct) + '%'; $('sanctN').textContent = Math.max(0, Math.ceil(S.sanct));
  $('hp').firstChild.style.width = Math.max(0, rama.hp / rama.max * 100) + '%';
  $('fire').classList.toggle('low', S.sanct < 30);
  $('wood').textContent = S.wood; $('merit').textContent = S.merit;
  document.querySelectorAll('#bottom [data-b]').forEach(b => b.classList.toggle('poor', S.wood < T[b.dataset.b].cost));
  $('go').classList.toggle('hide', S.phase !== 'day');
  $('q').lastChild.style.height = S.cdQ / 16 * 100 + '%'; $('e').lastChild.style.height = S.cdE / 12 * 100 + '%';
  if (S.sel) { const [x, y] = toScreen(S.sel.x, 4.5, S.sel.z); $('pop').style.left = x + 'px'; $('pop').style.top = y + 'px'; $('up').disabled = S.sel.tier < 2 && T[S.sel.type].tiers[S.sel.tier + 1] && (S.wood < T[S.sel.type].tiers[S.sel.tier + 1].w || S.merit < T[S.sel.type].tiers[S.sel.tier + 1].m); }
}

// ---------- main loop ----------
const cDay = new THREE.Color(0xa9cbdc), cNight = new THREE.Color(0x0b1228), cDust = new THREE.Color(0x6b5a3a), sky = new THREE.Color();
const sunDay = new THREE.Color(0xfff0d0), sunNight = new THREE.Color(0x8098ff);
let nightF = 0, dustF = 0, clock = 0, prev = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
  if (!S.paused) update(dt);
  renderer.render(scene, cam);
}
function update(dt) {
  clock += dt;
  const live = S.phase === 'day' || S.phase === 'night';
  if (live) {
    S.cdQ = Math.max(0, S.cdQ - dt); S.cdE = Math.max(0, S.cdE - dt); S.dust = Math.max(0, S.dust - dt);
    if (S.phase === 'day') { S.dayT -= dt; if (S.dayT <= 0) startNight(); }
    else {
      S.t += dt;
      while (S.queue.length && S.queue[0].t <= S.t) { const q = S.queue.shift(); spawn(q.type, q.gate); }
      if (!S.queue.length && !enemies.length) endNight();
    }
    updHero(rama, dt); updHero(lak, dt);
    for (const w of workers) updWorker(w, dt);
    for (const s of structs) updStruct(s, dt);
    updEnemies(dt); updArrows(dt); updBoulders(dt);
    if (S.sanct <= 0 && S.phase === 'night') finish(false);
    hud();
  }
  updParticles(dt);
  for (let i = shocks.length - 1; i >= 0; i--) { const s = shocks[i]; s.t += dt; const p = s.t / s.dur; s.m.scale.setScalar(s.r * Math.min(1, p * 1.4)); s.m.material.opacity = 1 - p; if (p >= 1) { scene.remove(s.m); s.m.material.dispose(); shocks.splice(i, 1); } }
  flash.intensity *= Math.max(0, 1 - 5 * dt);

  // light, sky, fire
  nightF += ((S.phase === 'night' ? 1 : 0) - nightF) * Math.min(1, dt * 0.8);
  dustF += ((S.dust > 0 ? 1 : 0) - dustF) * Math.min(1, dt * 1.5);
  sky.copy(cDay).lerp(cNight, nightF).lerp(cDust, dustF * 0.8);
  scene.fog.color.copy(sky); renderer.setClearColor(sky);
  scene.fog.near = lerp(58, 24, dustF) * camK; scene.fog.far = lerp(150, 78, dustF) * camK;
  sun.intensity = lerp(0.9, 0.26, nightF); sun.color.copy(sunDay).lerp(sunNight, nightF); hemi.intensity = lerp(0.5, 0.24, nightF);
  const vigor = 0.45 + 0.55 * Math.max(0, S.sanct) / 100;
  fireLight.intensity = lerp(0.7, 3.4, nightF) * vigor * (1 + Math.sin(clock * 13) * 0.08 + Math.sin(clock * 7.3) * 0.06);
  altar.flame.scale.set(vigor, vigor * (1 + Math.sin(clock * 10) * 0.12), vigor);
  if (Math.random() < dt * 14) burst(rnd(-0.4, 0.4), 2, rnd(-0.4, 0.4), 0xff9a30, 1, 0.6, 1.3, -2.5);

  const act = !live ? [] : S.phase === 'day' ? WAVES[S.night].map(w => w[2]) : S.queue.map(q => q.gate);
  for (const n in gateMarks) { const m = gateMarks[n]; m.visible = act.includes(n); m.material.opacity = 0.5 + 0.35 * Math.sin(clock * 5); }
  if (nightF > 0.5 && Math.random() < dt * 9) burst(rnd(-24, 24), rnd(0.5, 2.5), rnd(-22, 18), 0xc8ff60, 1, 0.4, 2.5, 0);

  camT.x += (rama.x * 0.3 * camK - camT.x) * Math.min(1, dt * 3); camT.z += (3 + rama.z * 0.3 * camK - camT.z) * Math.min(1, dt * 3);
  shake = Math.max(0, shake - dt * 2.2);
  cam.position.set(camT.x + rnd(-1, 1) * shake, 40 * camK + rnd(-1, 1) * shake, camT.z + 27 * camK); cam.lookAt(camT);
}
requestAnimationFrame(frame);
window.G = { sim(sec) { for (let i = 0; i < sec * 30; i++) update(1 / 30); renderer.render(scene, cam); }, T, S, enemies, structs, rama, lak, spawn, place, cidx, startNight, endNight, agni, manava };
})();
