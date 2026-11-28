'use strict';
// The fire and the ground it stands on, as Level 1 has them: the hearth with its tall flame, the plastered floor with its
// rice-flour diagram, the worn earth about it, Vishwamitra's mat and the brahmins'. It is its own file so that the sandbox
// stands on the same ground as the level and the two cannot drift apart. (It comes after the shared files and before the
// page's own)
// ---------- the compound ----------
{
  // The fire's hearth is turned so a flat side, not a corner, faces Vishwamitra (and the camera).
  // The six stone pillars that stood round it are taken away: there is nothing here but the fire (see the fire's ground, below)
  fire.rotation.y = Math.PI / 4;
  for (const m of [...scene.children]) if (m.material === STONE && Math.abs(Math.hypot(m.position.x, m.position.z) - 4.2) < 0.01) scene.remove(m);
  for (const o of [...SOLIDS]) if (o.r === 0.4 && Math.abs(Math.hypot(o.x, o.z) - 4.2) < 0.01) SOLIDS.splice(SOLIDS.indexOf(o), 1);
}
// ---------- the fire's ground ----------
// There is no altar here and no court: a fire on a small brick hearth, on the bare ground, and a man sitting by it. What marks
// the place is only what use has done to it. The grass is worn away to bare earth round the fire, in a patch with no edge
// and no shape, and fainter trodden ways lead off from it toward the roads and the houses, where feet go.
// (Old stone, and anything built to be looked at, belongs out in the forest where the demons are: see the camps)
const PAVE = {
  // old red sandstone, weathered, in two shades; and the moss that grows on it
  stone: toon(0xb56c4c, { rim: 0.08 }),
  stone2: toon(0x9b563e, { rim: 0.08 }),
  moss: toon(0x5f7a3c, { rim: 0.1 }),
  leaf: toon(0x3f8a3a, { rim: 0.15 }),
  bloom: toon(0xf2a11c, { rim: 0.2 }),
  clay: toon(0x96603f, { rim: 0.06 }),
  straw: toon(0xcbb67c, { rim: 0.05 }),
  strawEdge: toon(0x9c8450, { rim: 0.05 }),
};
const HEARTH = { stone: toon(0x4a4038, { rim: 0.05 }), log: toon(0x5a3a22, { rim: 0.08 }), log2: toon(0x7a5230, { rim: 0.08 }) };
// A picture of a patch of worn ground: the road's own earth colour, thick in the middle and thinning to nothing at a ragged
// edge that wanders in and out, with a few thin places inside it where the grass still shows. Three are made, so that no two
// patches next to each other are the same
function wornPicture(seed, clean) {
  const S = 256,
    c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d'),
    im = g.createImageData(S, S),
    rnd = (x, y) => {
      const v = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
      return v - Math.floor(v);
    },
    // a soft value that changes slowly from place to place
    soft = (x, y, n) => {
      const fx = (x / S) * n,
        fy = (y / S) * n,
        ix = Math.floor(fx),
        iy = Math.floor(fy),
        tx = fx - ix,
        ty = fy - iy,
        sx = tx * tx * (3 - 2 * tx),
        sy = ty * ty * (3 - 2 * ty);
      return (rnd(ix, iy) * (1 - sx) + rnd(ix + 1, iy) * sx) * (1 - sy) + (rnd(ix, iy + 1) * (1 - sx) + rnd(ix + 1, iy + 1) * sx) * sy;
    };
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const dx = (x - S / 2) / (S / 2),
        dy = (y - S / 2) / (S / 2),
        a = Math.atan2(dy, dx),
        // how far out the patch reaches in this direction
        reach = clean ? 0.8 : 0.7 + 0.12 * Math.sin(a * 2 + seed) + 0.09 * Math.sin(a * 3 + seed * 2.3) + 0.06 * Math.sin(a * 7 + seed * 5.1),
        t = Math.max(0, Math.min(1, (reach - Math.hypot(dx, dy)) / (clean ? 0.3 : 0.22) + (soft(x, y, 11) - 0.5) * (clean ? 0.1 : 0.45))),
        cover = t * t * (3 - 2 * t) * (0.93 + 0.07 * soft(x, y, 5)),
        v = 128 + 10 * soft(x, y, 22),
        i = (y * S + x) * 4;
      im.data[i] = v * 1.08;
      im.data[i + 1] = v * 0.93;
      im.data[i + 2] = v * 0.68;
      im.data[i + 3] = 255 * cover;
    }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const WORN = [1.3, 4.1, 7.7].map((seed) => {
  const m = toon(0xffffff, { map: wornPicture(seed), transparent: true, depthWrite: false, rim: 0 });
  return m;
});
// a patch of worn ground at a place: so far across, drawn out long one way (long: how many times longer) and turned
let wornN = 0;
function worn(x, z, r, long = 1, turn = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), WORN[wornN++ % 3]);
  m.rotation.set(-Math.PI / 2, turn + wornN * 2.1 * (long === 1 ? 1 : 0), 0, 'YXZ');
  m.scale.set(r * long, r, 1);
  m.position.set(x, groundY(x, z) + 0.035, z);
  m.receiveShadow = true;
  m.renderOrder = -1;
  scene.add(m);
}
// a round mat of woven grass to sit on, with a darker bound edge
function seatMat(x, z, r = 0.56) {
  add(scene, new THREE.CylinderGeometry(r, r, 0.03, 20), PAVE.strawEdge, [x, 0.055, z]).castShadow = false;
  add(scene, new THREE.CylinderGeometry(r - 0.07, r - 0.07, 0.03, 20), PAVE.straw, [x, 0.071, z]).castShadow = false;
}
{
  // the round stone floor the fire used to stand on is taken up, and the hearth sits on the ground, a little larger than it was
  const slab = scene.children.find((m) => m.geometry && m.geometry.parameters && m.geometry.parameters.radiusTop === 4.6);
  if (slab) scene.remove(slab);
  fire.scale.setScalar(1.5);
  SOLIDS.push({ x: 0, z: 0, r: 1.1 });
  // The fire is the one thing here made to be seen, so it is a real fire: a ring of blackened stones round the hearth, split
  // logs leaning in against it, and over it a tall flame in three sheets, one inside another, far larger than the little flame
  // the hearth had. On the ground under it lies a pool of its own warm light, which shows even in full day
  HEARTH.flames = [
    [0.42, 1.55, 0xff5a10],
    [0.3, 1.15, 0xffa020],
    [0.17, 0.75, 0xffe070],
  ].map(([r, h, c]) => {
    const m = new THREE.Mesh(
      new THREE.ConeGeometry(r, h, 10, 4),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    m.geometry.translate(0, h / 2, 0);
    m.position.y = 0.5;
    scene.add(m);
    return m;
  });
  {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d'),
      gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,170,80,1)');
    gr.addColorStop(0.35, 'rgba(255,140,50,.45)');
    gr.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    HEARTH.pool = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.5 }),
    );
    HEARTH.pool.rotation.x = -Math.PI / 2;
    HEARTH.pool.position.y = 0.06;
    HEARTH.pool.scale.setScalar(4.6);
    scene.add(HEARTH.pool);
  }
  // The ground round the fire is one clean round clearing of bare earth with a soft edge, and nothing else lies on it
  {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), toon(0xffffff, { map: wornPicture(2.2, true), transparent: true, depthWrite: false, rim: 0 }));
    m.rotation.x = -Math.PI / 2;
    m.scale.set(11.5, 11.5, 1);
    m.position.set(0, 0.035, 0);
    m.receiveShadow = true;
    m.renderOrder = -1;
    scene.add(m);
  }
  // The altar itself. Round the fire lies a floor made for the rite: a round of earth smoothed and plastered, with the
  // rite's diagram drawn on it in rice flour: two rings at its edge, a ring of lotus petals, a double square with a gate in
  // each side, and eight petals close round the hearth. The hearth stands in the middle on a low base of red sandstone
  {
    const S = 1024,
      R = 5.2,
      k = S / 2 / R,
      c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    g.translate(S / 2, S / 2);
    g.scale(k, k);
    // the plastered round, a shade warmer than the earth about it, with an ochre band at its edge
    g.fillStyle = 'rgba(172,126,84,.6)';
    g.beginPath();
    g.arc(0, 0, 4.95, 0, 6.2832);
    g.fill();
    g.lineCap = g.lineJoin = 'round';
    g.strokeStyle = 'rgba(140,72,40,.8)';
    g.lineWidth = 0.12;
    g.beginPath();
    g.arc(0, 0, 4.95, 0, 6.2832);
    g.stroke();
    // the diagram, in rice flour
    g.strokeStyle = g.fillStyle = 'rgba(244,228,198,.58)';
    g.lineWidth = 0.045;
    const ring = (r) => {
      g.beginPath();
      g.arc(0, 0, r, 0, 6.2832);
      g.stroke();
    };
    const P = (r, t) => [r * Math.cos(t), r * Math.sin(t)];
    // (a ring of n petals from radius r0 out to r1; w is how much of its share of the ring each one fills)
    const petals = (n, r0, r1, w, off) => {
      for (let i = 0; i < n; i++) {
        const a = ((i + off) / n) * 6.2832,
          d = (6.2832 / n) * w,
          rm = r0 + (r1 - r0) * 0.6;
        g.beginPath();
        g.moveTo(...P(r0, a - d));
        g.quadraticCurveTo(...P(rm, a - d * 0.9), ...P(r1, a));
        g.quadraticCurveTo(...P(rm, a + d * 0.9), ...P(r0, a + d));
        g.stroke();
      }
    };
    ring(4.62);
    ring(4.45);
    petals(24, 3.72, 4.28, 0.46, 0);
    ring(3.72);
    // the square with a gate in each side, drawn double, a dot in each corner
    for (let i = 0; i < 4; i++) {
      g.save();
      g.rotate((i * Math.PI) / 2);
      for (const o of [0, 0.16]) {
        g.beginPath();
        g.moveTo(-2.5 + o, 2.5 - o);
        g.lineTo(-0.6 - o, 2.5 - o);
        g.lineTo(-0.6 - o, 2.95 - o);
        g.lineTo(0.6 + o, 2.95 - o);
        g.lineTo(0.6 + o, 2.5 - o);
        g.lineTo(2.5 - o, 2.5 - o);
        g.stroke();
      }
      g.beginPath();
      g.arc(2.08, 2.08, 0.08, 0, 6.2832);
      g.fill();
      g.restore();
    }
    // eight broad petals round the hearth, a dot between each pair
    ring(1.72);
    petals(8, 1.72, 2.2, 0.42, 0.5);
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      g.arc(...P(2.0, (i / 8) * 6.2832), 0.05, 0, 6.2832);
      g.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * R * 1.414, 2 * R * 1.414), toon(0xffffff, { map: tex, transparent: true, depthWrite: false, rim: 0 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, 0.042, 0);
    m.receiveShadow = true;
    scene.add(m);
    // the base under the hearth
    add(scene, new THREE.BoxGeometry(2.5, 0.08, 2.5), PAVE.stone2, [0, 0.04, 0]);
    add(scene, new THREE.BoxGeometry(2.0, 0.14, 2.0), PAVE.stone, [0, 0.07, 0]);
    SOLIDS.push({ x: 0, z: 0, r: 1.4 });
  }
  // Vishwamitra's own seat by the fire: a plain square mat of kusha grass with a bound edge, and his brass water pot beside it
  {
    const flat = (m) => ((m.castShadow = false), m),
      X = 0,
      Z = -2,
      brass = toon(0xc0903c, { rim: 0.35 });
    flat(add(scene, new THREE.BoxGeometry(1.5, 0.03, 1.3), PAVE.strawEdge, [X, 0.05, Z]));
    // (the mat's middle stands a clear finger's breadth above its bound edge: when the two tops were a hair apart, they
    // could not be told apart from far off, and flickered one through the other)
    flat(add(scene, new THREE.BoxGeometry(1.38, 0.03, 1.18), PAVE.straw, [X, 0.066, Z]));
    sph(scene, 0.15, brass, [X + 1.05, 0.14, Z + 0.1], [1, 0.85, 1]);
    cyl(scene, 0.05, 0.07, 0.1, brass, [X + 1.05, 0.3, Z + 0.1]);
    // and three smaller mats of the same make, east, west and south of the fire, for the brahmins (their seats are BSEATS)
    for (const [x, z, w, d] of [
      [2.7, 0, 1.05, 1.2],
      [-2.7, 0, 1.05, 1.2],
      [0, 2.7, 1.2, 1.05],
    ]) {
      flat(add(scene, new THREE.BoxGeometry(w, 0.03, d), PAVE.strawEdge, [x, 0.05, z]));
      flat(add(scene, new THREE.BoxGeometry(w - 0.12, 0.03, d - 0.12), PAVE.straw, [x, 0.066, z]));
    }
  }
  // (and its light reaches further across the worn ground)
  fireL.distance = 20;
}
// The fire, each frame: its three sheets of flame each leaping and leaning in their own time, the pool of light under it
// breathing with them; a thread of smoke going up from its tip, and now and then an ember. (s: how high it burns, 1 when whole)
function hearthUpdate(dt, s = 1) {
  HEARTH.flames.forEach((m, i) => {
    const k = 1 + 0.16 * Math.sin(T * (9 + i * 2.3) + i) + 0.09 * Math.sin(T * (17.3 + i * 3.1));
    m.scale.set(1 + 0.08 * Math.sin(T * 7 + i * 2), k, 1 + 0.08 * Math.cos(T * 6.1 + i)).multiplyScalar(s);
    m.rotation.z = Math.sin(T * 3.1 + i * 1.7) * 0.07;
    m.rotation.x = Math.cos(T * 2.6 + i * 2.2) * 0.06;
  });
  // (the pool of light on the ground, the smoke and the embers all shrink with the flame)
  HEARTH.pool.material.opacity = (0.26 + 0.05 * Math.sin(T * 11) + 0.03 * Math.sin(T * 6.3)) * (0.25 + 0.75 * s);
  HEARTH.pool.scale.setScalar(4.6 * (0.4 + 0.6 * s));
  const j = (r) => (Math.random() * 2 - 1) * r;
  if (Math.random() < dt * 22) puff(tmpA.set(j(0.15), 0.6 + 1.5 * s, j(0.15)), 0x77726c, 1, 0.25, 3.6, -0.8, 0.22);
  if (Math.random() < dt * 7 * s) puff(tmpA.set(j(0.3), 0.5 + 0.9 * s, j(0.3)), 0xffa040, 1, 0.6, 1.4, -1.8, 0.1);
}
// Day into night, by k from 0 (the day as it was) to 1 (full night): the sky going from pale blue down to a deep blue with
// an ember of red left at the horizon, the sun's disc paling to a moon, the light on the ground thin and blue. What the day
// looked like is kept the first time this is asked for, so it must first be asked for while it is still day
const DAY = { from: null };
function skyNight(k) {
  const U = SKY.material.uniforms,
    C = (h) => new THREE.Color(h);
  if (!DAY.from)
    DAY.from = {
      a: U.uA.value.clone(),
      b: U.uB.value.clone(),
      c: U.uC.value.clone(),
      g: U.uGlow.value.clone(),
      sun: SUN.material.color.clone(),
      fog: scene.fog.color.clone(),
      hs: HEMI.color.clone(),
      hg: HEMI.groundColor.clone(),
      hi: HEMI.intensity,
      kc: key.color.clone(),
      ki: key.intensity,
      fi: fill.intensity,
      bt: bloom.threshold,
      bs: bloom.strength,
    };
  const F = DAY.from,
    e = k * k * (3 - 2 * k),
    mix = (a, b) => a + (b - a) * e;
  U.uA.value.lerpVectors(F.a, tmpA.set(0.42, 0.24, 0.34), e);
  U.uB.value.lerpVectors(F.b, tmpA.set(0.1, 0.1, 0.24), e);
  U.uC.value.lerpVectors(F.c, tmpA.set(0.02, 0.03, 0.09), e);
  U.uGlow.value.lerpVectors(F.g, tmpA.set(0.5, 0.55, 0.75), e);
  SUN.material.color.lerpColors(F.sun, C(0xcfd8ff), e);
  scene.fog.color.lerpColors(F.fog, C(0x141a34), e);
  HEMI.color.lerpColors(F.hs, C(0x7f8fd0), e);
  HEMI.groundColor.lerpColors(F.hg, C(0x1a1a2c), e);
  HEMI.intensity = mix(F.hi, 0.85);
  key.color.lerpColors(F.kc, C(0x9fb4ff), e);
  key.intensity = mix(F.ki, 1.0);
  fill.intensity = mix(F.fi, 0.3);
  bloom.threshold = mix(F.bt, 0.85);
  bloom.strength = mix(F.bs, 0.5);
}
