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
