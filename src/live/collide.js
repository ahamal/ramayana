'use strict';
// Collision: everyone who walks is a circle on the ground. After they have all moved, circles that overlap are pushed apart,
// the lighter one giving way more. Pillars, the altar, the seated sage, straw dummies and target boards do not give way at all.
// Things in the air (a flying defiler, anything thrown by the wind) and the dead are left out.
const BODIES = [];
function collide() {
  BODIES.length = 0;
  const body = (p, r, m) => BODIES.push({ p, r, m });
  for (const h of HEROES) body(h.group.position, 0.32, 3);
  body(V.group.position, 0.36, 0);
  for (const d of dummies) {
    if (d.dead || d.flung || d.df) continue;
    if (d.rig) body(d.g.position, d.def.radius, d.def.mass);
    else body(d.g.position, 0.3, 0);
  }
  for (const t of targets) body(t.g.position, 0.5, 0);
  // m = 0 means it never moves
  for (let i = 0; i < BODIES.length; i++) {
    const a = BODIES[i];
    for (let j = i + 1; j < BODIES.length; j++) {
      const b = BODIES[j];
      if (!a.m && !b.m) continue;
      push(a, b.p.x, b.p.z, b.r, b);
    }
    if (a.m) for (const s of SOLIDS) push(a, s.x, s.z, s.r, null);
  }
}
function push(a, bx, bz, br, b) {
  let dx = a.p.x - bx,
    dz = a.p.z - bz;
  const min = a.r + br,
    d2 = dx * dx + dz * dz;
  if (d2 >= min * min) return;
  let d = Math.sqrt(d2);
  if (d < 1e-4) {
    // exactly on top of each other: pick any direction
    dx = 1;
    dz = 0;
    d = 1;
  }
  const over = min - d,
    ma = a.m,
    mb = b ? b.m : 0,
    // share of the overlap each one takes: all of it if the other cannot move, otherwise in proportion to the other's weight
    ka = !ma ? 0 : !mb ? 1 : mb / (ma + mb),
    kb = !mb ? 0 : !ma ? 1 : ma / (ma + mb);
  a.p.x += (dx / d) * over * ka;
  a.p.z += (dz / d) * over * ka;
  if (b) {
    b.p.x -= (dx / d) * over * kb;
    b.p.z -= (dz / d) * over * kb;
  }
}

// ---------- finding a way round ----------
// Everything that stands still and blocks the way is a circle in SOLIDS: trees, houses, the altar, and the rivers too (a row
// of circles, with gaps at the fords). The map for finding a way is made from that same list, so it cannot disagree with
// what the collision does: a grid of one-unit cells, each either open or shut, a cell being shut if its middle is inside a
// circle widened by about a walker's own width. It is made the first time it is asked for, and made again by itself whenever
// the list has changed (a lamp built, a tree felled), which is looked for a few times a second.
//
// A way is not searched for one walker at a time. For a place to get to, every open cell is given its distance from that
// place, once: that is a field, and anyone at all heading for that place reads his next step from it, so a crowd going to
// the altar costs the same as one demon. A few fields are kept (the altar's, each lamp's, the cell Rama is in), the least
// lately used being dropped.
//
// And the map is only looked at when it is needed. A walker with a clear straight line to where he is going walks it, just
// as before; only when something is in the way does he take the field's way round, and then he makes for the furthest point
// along it that he can see, so that he walks in straight lines and cuts corners, and not from cell to cell.
const NAV = { box: null, pad: 0.4, x0: 0, z0: 0, w: 0, h: 0, wall: null, sig: NaN, at: -1e9, fields: [], buckets: [], aim: { x: 0, z: 0, via: false } };
function navBake() {
  let x0 = Infinity,
    z0 = Infinity,
    x1 = -Infinity,
    z1 = -Infinity;
  if (NAV.box) [x0, z0, x1, z1] = NAV.box;
  else {
    // (no limits given: the ground the circles cover, and a good margin round it)
    for (const s of SOLIDS) {
      x0 = Math.min(x0, s.x - 15);
      z0 = Math.min(z0, s.z - 15);
      x1 = Math.max(x1, s.x + 15);
      z1 = Math.max(z1, s.z + 15);
    }
  }
  NAV.x0 = Math.floor(x0);
  NAV.z0 = Math.floor(z0);
  const w = (NAV.w = Math.max(1, Math.min(600, Math.ceil(x1) - NAV.x0))),
    h = (NAV.h = Math.max(1, Math.min(600, Math.ceil(z1) - NAV.z0))),
    W = (NAV.wall = new Uint8Array(w * h));
  for (const s of SOLIDS) {
    const r = s.r + NAV.pad,
      ia = Math.max(0, Math.floor(s.x - r - NAV.x0)),
      ib = Math.min(w - 1, Math.floor(s.x + r - NAV.x0)),
      ja = Math.max(0, Math.floor(s.z - r - NAV.z0)),
      jb = Math.min(h - 1, Math.floor(s.z + r - NAV.z0));
    for (let j = ja; j <= jb; j++)
      for (let i = ia; i <= ib; i++) {
        const dx = NAV.x0 + i + 0.5 - s.x,
          dz = NAV.z0 + j + 0.5 - s.z;
        if (dx * dx + dz * dz < r * r) W[j * w + i] = 1;
      }
    // (a thin post may cover no cell's middle: the cell it stands in is shut all the same)
    const c = navCell(s.x, s.z);
    if (c >= 0) W[c] = 1;
  }
  NAV.fields.length = 0;
}
function navFresh() {
  const now = performance.now();
  if (NAV.wall && now - NAV.at < 400) return;
  NAV.at = now;
  let sig = SOLIDS.length;
  for (const s of SOLIDS) sig += s.x * 3 + s.z * 7 + s.r * 13;
  if (NAV.box) sig += NAV.box[0] + NAV.box[1] * 2 + NAV.box[2] * 4 + NAV.box[3] * 8;
  if (sig !== NAV.sig) {
    NAV.sig = sig;
    navBake();
  }
}
// the cell a point is in, or -1 if it is off the map
function navCell(x, z) {
  const i = Math.floor(x - NAV.x0),
    j = Math.floor(z - NAV.z0);
  return i < 0 || j < 0 || i >= NAV.w || j >= NAV.h ? -1 : j * NAV.w + i;
}
// the open cell nearest a cell (itself, if it is open), looking a few cells round it; -1 if there is none
function navOpen(c) {
  if (c < 0) return -1;
  const { w, h, wall } = NAV;
  if (!wall[c]) return c;
  const x = c % w,
    y = (c - x) / w;
  let best = -1,
    bd = 1e9;
  for (let r = 1; r <= 5 && best < 0; r++)
    for (let j = Math.max(0, y - r); j <= Math.min(h - 1, y + r); j++)
      for (let i = Math.max(0, x - r); i <= Math.min(w - 1, x + r); i++) {
        if (wall[j * w + i]) continue;
        const d = (i - x) * (i - x) + (j - y) * (j - y);
        if (d < bd) {
          bd = d;
          best = j * w + i;
        }
      }
  return best;
}
// is the straight line between two points open? (The first step of it is not looked at, since a walker pressed up against
// something is himself inside its widened circle; nor is anything within `near` of the far end, which may be the very thing
// he is going to)
function navClear(ax, az, bx, bz, near) {
  const dx = bx - ax,
    dz = bz - az,
    len = Math.hypot(dx, dz),
    n = Math.ceil(len / 0.5),
    { wall } = NAV;
  for (let k = 1; k < n; k++) {
    const t = k / n;
    if (t * len < 0.9 || (1 - t) * len < near) continue;
    const c = navCell(ax + dx * t, az + dz * t);
    if (c >= 0 && wall[c]) return false;
  }
  return true;
}
// the field for one cell: how far every open cell is from it, going round whatever is shut. (2 for a step along a row or
// column and 3 for one corner to corner; 65535 where there is no way at all)
function navField(goal) {
  const F = NAV.fields;
  for (let k = 0; k < F.length; k++)
    if (F[k].goal === goal) {
      const f = F[k];
      if (k) {
        F.splice(k, 1);
        F.unshift(f);
      }
      return f;
    }
  const { w, h, wall, buckets: B } = NAV,
    f = F.length >= 12 ? F.pop() : { goal: 0, d: null };
  if (!f.d || f.d.length !== w * h) f.d = new Uint16Array(w * h);
  const d = f.d;
  f.goal = goal;
  d.fill(65535);
  d[goal] = 0;
  (B[0] || (B[0] = [])).push(goal);
  for (let c = 0, top = 0; c <= top; c++) {
    const q = B[c];
    if (!q) continue;
    for (let k = 0; k < q.length; k++) {
      const i = q[k];
      if (d[i] !== c) continue;
      const x = i % w,
        y = (i - x) / w;
      for (let oy = -1; oy <= 1; oy++)
        for (let ox = -1; ox <= 1; ox++) {
          if (!ox && !oy) continue;
          const nx = x + ox,
            ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          // (no squeezing corner to corner between two shut cells)
          if (wall[j] || (ox && oy && (wall[y * w + nx] || wall[ny * w + x]))) continue;
          const nd = c + (ox && oy ? 3 : 2);
          if (nd < d[j] && nd < 65535) {
            d[j] = nd;
            (B[nd] || (B[nd] = [])).push(j);
            if (nd > top) top = nd;
          }
        }
    }
    q.length = 0;
  }
  F.unshift(f);
  return f;
}
// Where a walker at P should make for, to get to (gx, gz): that point itself when the way is clear (or when there is no way,
// or either end is off the map), and otherwise a point on the way round. What comes back is one shared object, to be read
// at once: x, z, and via (true when it is a point on the way round)
function navAim(P, gx, gz, near) {
  const A = NAV.aim;
  A.x = gx;
  A.z = gz;
  A.via = false;
  navFresh();
  if (navClear(P.x, P.z, gx, gz, near || 0)) return A;
  const g = navOpen(navCell(gx, gz)),
    s = navOpen(navCell(P.x, P.z));
  if (g < 0 || s < 0 || g === s) return A;
  const { w, h, wall } = NAV,
    d = navField(g).d;
  if (d[s] === 65535) return A;
  // down the field from where he is, a cell at a time, for as long as he can still see the cell he has come to
  for (let i = s, k = 0; k < 16 && d[i] > 0; k++) {
    const x = i % w,
      y = (i - x) / w;
    let best = -1,
      bd = d[i];
    for (let oy = -1; oy <= 1; oy++)
      for (let ox = -1; ox <= 1; ox++) {
        if (!ox && !oy) continue;
        const nx = x + ox,
          ny = y + oy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (wall[j] || (ox && oy && (wall[y * w + nx] || wall[ny * w + x]))) continue;
        if (d[j] < bd) {
          bd = d[j];
          best = j;
        }
      }
    if (best < 0) break;
    i = best;
    const cx = NAV.x0 + (i % w) + 0.5,
      cz = NAV.z0 + ((i - (i % w)) / w) + 0.5;
    if (A.via && !navClear(P.x, P.z, cx, cz, 0)) break;
    A.x = cx;
    A.z = cz;
    A.via = true;
  }
  return A;
}
