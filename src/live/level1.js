'use strict';
// Level 1: Siddhashrama, on a clear morning. Rama and Lakshmana start in the forest west of a river and walk right (east).
// Across the river the map proper begins: about a hundred and eighty metres of country, shut in on the far side by a second river.
// The altar where Vishwamitra sits is in the middle, his hut just beyond it. Half way along the road rakshasas hold prisoners.
// Still to come here: what happens on arrival, the waves, the altar's health, and winning and losing.

// ---------- the stage ----------
setDay();
// (much less haze than the day's own: enough left to soften the far hills, and none to speak of over the hermitage, even
// with the camera drawn right back. It was 0.006)
scene.fog.density = 0.0025;
// (tree trunks here are a warm mid brown, not the scene's own dark one)
TREE_MATS.trunk.color.set(0x7b5a3d);
shadowFollow = true;
BOUND = 1e5;
PLAYABLE = ['rama', 'lak'];
FOLLOW = true;
// WX and EX are the two rivers, ZN and ZS the far and near limits. The brothers start a little west of the first river.
// That river comes down from a waterfall on the far side and runs toward the camera in a channel below the ground;
// where the road meets it the land simply carries on across. The second river has no crossing at all.
const WX = -90,
  EX = 120,
  ZN = -90,
  ZS = 90,
  START_X = WX - 16,
  X0 = START_X - 14,
  R = (a, b) => a + Math.random() * (b - a),
  // the road's line from the river as far as the hermitage: level with the crossing, wandering a little
  roadZ = (x) => 0.5 * Math.sin(x * 0.21) + (x > 92 ? (x - 92) * 0.36 : 0),
  RIVER_FROM = -18,
  // The rivers make a Y. The west arm comes down from its waterfall, passes under the road, then bends away east across the
  // south of the map; the east arm comes down from the north on the other side; they meet below the hermitage, and the
  // joined river runs on south. The hermitage lies in the fork. Each is the list of points its course is drawn through
  COURSES = [
    [
      [-90, -18],
      [-90.6, -8],
      [-90, 0],
      [-88.4, 9],
      [-82, 19],
      [-72, 32],
      [-52, 44],
      [-26, 51],
      [-2, 54],
      [22, 56.5],
      [42, 57.6],
      [56, 56.8],
      [65.5, 52.8],
    ],
    // the east river, the bigger of the two, which the west arm runs into: down from the north, under the road as far east of
    // the altar as the west crossing is west of it, then away south-west and off the map
    [
      [92, -126],
      [91, -74],
      [90, -40],
      [90.6, -15],
      [90, 0],
      [87, 16],
      [80, 30],
      [71, 43],
      [63, 57],
      [55, 90],
      [47, 124],
    ],
    // above the fall: the west arm's upper reach, coming down from the north on the high ground and ending at the lip
    [
      [-92, -126],
      [-93, -100],
      [-90.5, -76],
      [-92, -52],
      [-89.6, -33],
      [-90, -19.6],
    ],
  ],
  // the three crossings, where the land carries on over the water: the road's on the west arm, the road's on the east arm,
  // and the south road's, on the west arm just above where the rivers meet
  FORDS = [
    [-90, 0],
    [90, 0],
    [0.4, 54.2],
  ],
  FORD_R = 6.2,
  // half the width of a river, bank to bank
  RW = 4.4,
  // how much wider than that each river is on either side: the east one is the bigger
  WIDER = [0, 1.2, 0],
  // the road that comes up from the south beside the joined river, over the third crossing and on to the altar
  SOUTH_ROAD = [
    [0, 122],
    [1.5, 92],
    [2.6, 78],
    [3, 67],
    [1.8, 60],
    [0.4, 54.2],
    [0, 44],
    [0.4, 31],
  ],
  // The roads meet in a ring round the altar: a true circle, ROUND across its half, with the fire at its middle, so that it
  // frames the sacred ground (and the pattern that can be built on it) evenly on every side. The far half of it is drawn as
  // part of the main road; the near half is these two arms, which part where the south road comes in at the bottom and run
  // round to the two ends of the far half. This is the west arm, from the foot of the circle round to where the far half
  // begins; the east arm is the same, mirrored
  ROUND = 31,
  FORK = Array.from({ length: 12 }, (_, i) => {
    const f = (i / 11) * (Math.PI - 1.45);
    return [0.4 * (1 - i / 11) - ROUND * Math.sin(f), ROUND * Math.cos(f)];
  }),
  // (near either arm: a rough test against the straight pieces between its points, for keeping trees and tall plants off it)
  forkWay = (x, z, pad) => {
    const ax = Math.abs(x - 0.4);
    for (let i = 1; i < FORK.length; i++) {
      const a = FORK[i - 1],
        b = FORK[i],
        px = 0.4 - a[0],
        qx = 0.4 - b[0],
        dx = qx - px,
        dz = b[1] - a[1],
        t = Math.max(0, Math.min(1, ((ax - px) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
      if (Math.hypot(ax - px - dx * t, z - a[1] - dz * t) < pad) return true;
    }
    return false;
  },
  southWay = (x, z, pad) => z > 29 && Math.abs(x - (z < 54 ? 0.3 : z < 66 ? 0.4 + (z - 54) * 0.22 : 3 - (z - 66) * 0.035)) < pad,
  // the demons' camp is a little way past the river and off the road, on its far side
  CAMP = V3(-66, 0, -3.5),
  // until the prisoners are freed nobody may go further east than this: a dotted line across the map, just beyond the camp
  HOLD_X = -66 + 12,
  // and no further north or south than these: with the far limit in the west, a box round the camp and the first crossing
  HOLD_N = -3.5 - 16,
  HOLD_S = -3.5 + 16,
  // on the road (which ends at the clearing), in the demons' camp, or in or beside either river or the ridge the first one falls from
  onRoad = (x, z, pad) => ((x < -43 || x > 34) && Math.abs(z - roadZ(x)) < pad) || southWay(x, z, pad) || forkWay(x, z, pad),
  // The hermitage is laid out evenly about the line that runs north through the altar. The road comes in from the river on the
  // west, sweeps round the far side of the altar in a half ring (its middle is the fire), and comes back
  // down on the east, where it rounds the end of the cliff and goes on south into the low country.
  // Three round houses stand outside the half ring, facing its middle: the hall at the top, the largest, and a smaller one
  // either side of it, the sage's on the left and the pupils' on the right. Each place is [x, z, the way it faces]
  YARD = [0, -6],
  RING = ROUND,
  SAGE_HOUSE = [-35.5, -26.5, 1.047],
  HALL = [0, -47, 0],
  LONG = [35.5, -26.5, -1.047],
  // and two more below, outside the fork's arms, facing the middle as the others do: five houses round the fire
  SW_HOUSE = [-40, 17.5, 2.1],
  SE_HOUSE = [40, 17.5, -2.1],
  // the masons' yard, out beyond the top right house as the wood store is out beyond the top left one, and well clear of it.
  // (Those two houses are the workmen's: the woodcutters' on the left, the masons' on the right)
  WORKSHOP = [LONG[0] - Math.sin(LONG[2]) * 12.5, LONG[1] - Math.cos(LONG[2]) * 12.5, LONG[2]],
  // on the worn ground round the fire: nothing grows or lies there
  inCourt = (x, z, pad) => Math.hypot(x, z) < 11 + pad,
  // matching each other either side as well: the wood store beyond the sage's house and the lotus pond beyond the pupils';
  // the water jars and the cow's shelter out of the way behind the hall
  WOODSHED = [-48, -10, 1.35],
  POND = [48, -11, 0],
  JARS = [-11, -58, 0],
  SHED = [11.6, -59, 0],
  // every point of the road as drawn, filled in below: for keeping things off it
  ROADLINE = [],
  ROADS = [],
  nearRoad = (x, z, pad) => ROADLINE.some((p) => Math.abs(p.x - x) < pad && Math.abs(p.z - z) < pad && Math.hypot(p.x - x, p.z - z) < pad),
  // the hermitage's ground: nothing wild grows here. It is everything within the half ring and a good way outside it, on its near side as far as a little beyond the altar
  inHut = (x, z, pad) => (Math.hypot(x - YARD[0], z - YARD[1]) < 54 + pad && z < 32 + pad) || Math.hypot(x - WORKSHOP[0], z - WORKSHOP[1]) < 6.5 + pad,
  // the two camps where prisoners are kept at work, each beyond a river: stone masons past the east crossing, brahmins past the south
  WORK = [
    [110, -9],
    [-26, 70],
  ],
  inCamp = (x, z, pad) => [[CAMP.x, CAMP.z], ...WORK].some((q) => Math.abs(x - q[0]) < pad && Math.abs(z - q[1]) < pad),
  // near water, or the ridge of rock the west arm falls from
  nearRiver = (x, z, pad) => riverDist(x, z) < RW - 0.4 + pad;
// The courses themselves: each arm as a smooth line of points half a metre apart. And, worked out once from them, how far
// every spot on the map is from the nearest water. A crossing counts as land: the water under it is left out, so the
// distance there is to where the river begins again on either side
const RIV = COURSES.map((pts) => {
    const c = new THREE.CatmullRomCurve3(
      pts.map(([x, z]) => V3(x, 0, z)),
      false,
      'centripetal',
    );
    return c.getSpacedPoints(Math.ceil(c.getLength() / 0.5));
  }),
  atFord = (p, pad) => FORDS.some((f) => Math.hypot(p.x - f[0], p.z - f[1]) < FORD_R + pad),
  RF = { x0: -150, z0: -130, w: 306, h: 262 };
RF.d = new Float32Array(RF.w * RF.h).fill(99);
// (a wider river counts every spot as that much nearer its water, so its channel and banks are wider all along)
RIV.forEach((line, r) => {
  for (const p of line) {
    // (left out for some way either side of a crossing, so the land is level across the whole width of the way over)
    if (atFord(p, 3)) continue;
    const cx = Math.round(p.x - RF.x0),
      cz = Math.round(p.z - RF.z0);
    for (let iz = Math.max(0, cz - 12); iz <= Math.min(RF.h - 1, cz + 12); iz++)
      for (let ix = Math.max(0, cx - 12); ix <= Math.min(RF.w - 1, cx + 12); ix++) {
        const d = Math.hypot(ix + RF.x0 - p.x, iz + RF.z0 - p.z) - WIDER[r];
        if (d < RF.d[iz * RF.w + ix]) RF.d[iz * RF.w + ix] = d;
      }
  }
});
function riverDist(x, z) {
  const fx = Math.max(0, Math.min(RF.w - 1.001, x - RF.x0)),
    fz = Math.max(0, Math.min(RF.h - 1.001, z - RF.z0)),
    ix = Math.floor(fx),
    iz = Math.floor(fz),
    tx = fx - ix,
    tz = fz - iz,
    i = iz * RF.w + ix,
    D = RF.d;
  return (D[i] * (1 - tx) + D[i + 1] * tx) * (1 - tz) + (D[i + RF.w] * (1 - tx) + D[i + RF.w + 1] * tx) * tz;
}
// the ground anyone may walk on is a rectangle here, not a circle round the fire. Until the first camp's prisoners are freed
// it is only the box round that camp; after that the whole of it, back over the first crossing as well
hem = (P) => {
  const held = captive();
  P.x = Math.max(X0, Math.min(held ? HOLD_X : EX - 3.5, P.x));
  P.z = Math.max(held ? HOLD_N : ZN, Math.min(held ? HOLD_S : ZS, P.z));
};
// true while any prisoner of the first camp, the one by the road, is still bound
const captive = () => CAMPS[0].prisoners.some((p) => !p.free);
// ---------- the lie of the land ----------
// The ground is not flat. It rolls gently everywhere, except where it has to be level: along the roads, round the hermitage
// and under each camp. And each river runs in a channel that the land itself dips into: full depth along the water's middle,
// rising in a bank on either side. At a crossing there is no channel; the land carries straight on.
const ease = (t) => ((t = Math.max(0, Math.min(1, t))), t * t * (3 - 2 * t)),
  CHANNEL = 1.7,
  PADS = [[CAMP.x, CAMP.z], ...WORK],
  // North of the waterfall the land stands higher, by HIGH. Right beside the river it drops at once, in the short steep face the
  // water falls over; further off to either side the drop eases into a long slope, and well east of the river there is none
  HIGH = 4,
  lift = (x, z) => {
    const a = Math.abs(x - WX),
      w = 1.5 + 12 * ease((a - RW - 3) / 10);
    return HIGH * ease((RIVER_FROM - z) / w) * ease(1 - (a - 22) / 24);
  };
groundY = (x, z) => {
  const d = riverDist(x, z);
  // how far this spot is from anything that must be level: at nothing or less the land does not roll at all
  let calm = Math.min(d - RW - 4.6, Math.abs(z - roadZ(x)) - 6, southWay(x, z, 8) ? -1 : 1e9, Math.hypot(x - YARD[0], z - YARD[1]) - 56, x < WX ? -1 : 1e9);
  for (const q of PADS) calm = Math.min(calm, Math.max(Math.abs(x - q[0]), Math.abs(z - q[1])) - 13);
  return (
    (0.5 * Math.sin(x * 0.11 + 1.3) * Math.cos(z * 0.09) + 0.3 * Math.sin(x * 0.23 - z * 0.17)) * ease(calm / 9) - CHANNEL * ease(1 - (d - RW + 1.8) / 3) + lift(x, z)
  );
};
// The ground itself is a sheet of small squares pulled to that shape, grass-coloured except where it is steep, on the
// riverbanks, where it shows as bare earth. The scene's own flat ground is kept, sunk well below everything and spread
// wide, as the land seen in the far distance beyond the sheet's edge
{
  const far = scene.children.find((m) => m.material === GROUND);
  far.scale.setScalar(2.6);
  far.position.y = -3;
  far.geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(far.geometry.attributes.position.count * 3).fill(1), 3));
  const xa = -150,
    za = -126,
    st = 1,
    nx = 300,
    nz = 252,
    pos = [],
    col = [],
    idx = [],
    // (the tint that turns the ground's own green to the brown of a bank of earth)
    rockTint = [0.96, 0.65, 0.81];
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      const x = xa + i * st,
        z = za + j * st,
        steep = Math.hypot(groundY(x + 0.5, z) - groundY(x - 0.5, z), groundY(x, z + 0.5) - groundY(x, z - 0.5)),
        k = ease((steep - 0.55) / 0.6);
      pos.push(x, groundY(x, z), z);
      col.push(1 + (rockTint[0] - 1) * k, 1 + (rockTint[1] - 1) * k, 1 + (rockTint[2] - 1) * k);
      if (i < nx && j < nz) {
        const a = j * (nx + 1) + i;
        idx.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2);
      }
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const land = new THREE.Mesh(g, GROUND);
  land.receiveShadow = true;
  // (a finger's breadth below true, as the scene's own ground was, so that the altar's stone floor, which lies exactly at
  // ground level, is not fought over by the two surfaces)
  land.position.y = -0.02;
  scene.add(land);
  GROUND.vertexColors = true;
  GROUND.needsUpdate = true;
}
// the hills are moved back behind the map's far edge
scene.children
  .filter((m) => HILL_MATS.includes(m.material))
  .forEach((m, i) => {
    m.position.set(-210 + i * 52 + R(-8, 8), 5, ZN - 45 - R(0, 25));
    m.scale.setScalar(1.6);
  });

// ---------- scenery in bulk ----------
// A map this size has hundreds of trees, bushes and rocks. Each kind is drawn as one batch instead of one by one:
// a lot is a list of placements [x, y, z, rx, ry, rz, sx, sy, sz] that all share a shape and a material
const LOTS = [],
  lot = (geo, mat) => {
    const l = [];
    l.geo = geo;
    l.mat = mat;
    LOTS.push(l);
    return l;
  };
// A mass of leaves is not a smooth ball. It is a lump: a rough, faceted shape, uneven all over and flattened underneath,
// so that light falls on it in flat planes. There are three such shapes, so neighbouring masses differ
function lump(seed) {
  const geo = new THREE.IcosahedronGeometry(1, 1),
    P = geo.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i),
      y = P.getY(i),
      z = P.getZ(i),
      // the same point always moves the same way, so the facets that meet at it stay joined
      h = Math.sin(Math.round(x * 50) * 12.9898 + Math.round(y * 50) * 78.233 + Math.round(z * 50) * 37.719 + seed * 4.1) * 43758.5453,
      k = 1 + (h - Math.floor(h) - 0.5) * 0.36,
      yy = y * k;
    P.setXYZ(i, x * k, yy < -0.25 ? -0.25 + (yy + 0.25) * 0.35 : yy, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}
// the head of a palm, made in one piece: eleven fronds springing from the top of the trunk. Each is a long leaf, folded along
// its middle, that rises a little and then arches over and droops, widest a third of the way out and running to a point.
// Every other one is shorter and hangs lower, as the older fronds of a palm do
function palmHead() {
  const P = [];
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * 6.283 + (i % 2) * 0.14,
      old = i % 2,
      L = old ? 2.0 : 2.6,
      lift = old ? 0.08 : 0.5,
      ca = Math.cos(a),
      sa = Math.sin(a),
      at = (t, side) => {
        const r = L * t,
          w = 0.34 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.98 + 0.02)), 0.7) * side;
        return [ca * r - sa * w, L * (lift * 1.3 * t - t * t * (0.55 + lift * 0.5)) - Math.abs(side) * 0.09, sa * r + ca * w];
      };
    for (let k = 0; k < 7; k++)
      for (const side of [-1, 1])
        P.push(...at(k / 7, 0), ...at((k + 1) / 7, 0), ...at((k + 1) / 7, side), ...at(k / 7, 0), ...at((k + 1) / 7, side), ...at(k / 7, side));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.computeVertexNormals();
  return geo;
}
const BUSHM = [toon(0x3c7a34, { rim: 0.2 }), toon(0x4f8f3a, { rim: 0.2 }), toon(0x2f6a3a, { rim: 0.2 })],
  ROCKM = [toon(0x8a8f96, { rim: 0.12 }), toon(0x73777f, { rim: 0.12 })],
  LUMPS = [lump(1), lump(2), lump(3)],
  rockG = new THREE.DodecahedronGeometry(1, 0),
  // a tree is made of limbs (a trunk is a limb too: a tapering length of wood between two points) and masses of leaves.
  // Its leaves are of one green, in two tones: the darker for the under and inner masses, the lighter for those on top in the sun.
  // There are three such greens. LEAF[green][tone] is the three lump shapes in that colour
  LIMB = lot(new THREE.CylinderGeometry(0.62, 1, 1, 7), TREE_MATS.trunk),
  LEAF = [
    [0x2f6a3a, 0x40883f],
    [0x3d7a3a, 0x5c9a44],
    [0x4f8a38, 0x7aa848],
  ].map((pair) => pair.map((c) => LUMPS.map((geo) => lot(geo, toon(c, { rim: 0.2 }))))),
  PALM = lot(palmHead(), toon(0x5f9a3e, { rim: 0.2 })),
  NUT = lot(new THREE.IcosahedronGeometry(1, 0), toon(0x6a4a2a, { rim: 0.1 })),
  BUSH = BUSHM.map((m, i) => lot(LUMPS[i], m)),
  ROCK = ROCKM.map((m) => lot(rockG, m)),
  WOODS = [];

// ---------- forest ----------
// The clearing's own ring of trees can be very large (up to thirteen units tall), and the camera always looks from the near side.
// So every one of them on the near side goes, along with any standing on the road or in the camp
// (the rest are taken up too, and planted again below as trees of this level's own kinds, a little smaller)
const OLD_TREES = [];
for (const t of [...TREES]) {
  if (!(t.z > 4 || (t.x < 0 && t.z > -4.5) || onRoad(t.x, t.z, 4.5) || inCamp(t.x, t.z, 10) || inHut(t.x, t.z, 3))) OLD_TREES.push(t);
  t.parts.forEach((m) => scene.remove(m));
  SOLIDS.splice(SOLIDS.indexOf(t.solid), 1);
  TREES.splice(TREES.indexOf(t), 1);
}
const LQ = new THREE.Quaternion(),
  LE = new THREE.Euler(),
  LUP = V3(0, 1, 0),
  LD = V3();
// a limb from one point to another, r thick at its foot
function limb(ax, ay, az, bx, by, bz, r) {
  LD.set(bx - ax, by - ay, bz - az);
  const len = LD.length();
  LE.setFromQuaternion(LQ.setFromUnitVectors(LUP, LD.divideScalar(len)));
  LIMB.push([(ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, LE.x, LE.y, LE.z, r, len, r]);
}
// Four kinds of tree, so that no two neighbours need look alike, and within a kind no two are quite the same.
// Each has a proper trunk, swelling at the foot, and a head built up of many overlapping lumps that read as one crown:
// darker ones low and inside, lighter ones on top.
//   0  round-headed: the trunk forks into boughs under a full, domed crown
//   1  tall and narrow: a straight trunk carrying a slim crown that tapers to a point, like a cypress or an ashoka
//   2  wide and spreading: a short thick trunk, long boughs, and a broad low canopy, like a banyan or a rain tree
//   3  a palm: a slender curving trunk with a head of arching, drooping fronds and a few nuts under them
function tree(x, z, s, kind) {
  const fam = LEAF[(Math.random() * 3) | 0],
    turn = R(0, 6.283),
    // one mass of leaves: tone 0 dark, 1 light; r across, flat is how squat it is
    leaf = (tone, px, py, pz, r, flat) => fam[tone][(Math.random() * 3) | 0].push([px, py, pz, 0, R(0, 6.283), 0, r, r * flat, r]),
    // the trunk: a swelling at the foot, then the bole up to height h
    bole = (h, r) => {
      limb(x, -0.3, z, x, 0.5 * s, z, r * 1.5);
      limb(x, 0.3 * s, z, x, h, z, r);
    };
  let trunk = 0.24 * s;
  if (kind === 0) {
    const fork = R(2.0, 2.6) * s,
      n = 4;
    bole(fork, trunk);
    for (let i = 0; i < 3; i++) {
      const a = turn + i * 2.1;
      limb(x, fork - 0.2 * s, z, x + Math.cos(a) * 1.0 * s, fork + 1.2 * s, z + Math.sin(a) * 1.0 * s, trunk * 0.55);
    }
    for (let i = 0; i < n; i++) {
      const a = turn + (i / n) * 6.283 + R(-0.25, 0.25),
        out = R(1.0, 1.35) * s;
      leaf(0, x + Math.cos(a) * out * 0.85, fork + R(0.9, 1.2) * s, z + Math.sin(a) * out * 0.85, R(0.9, 1.1) * s, 0.72);
    }
    leaf(1, x, fork + 1.8 * s, z, 1.45 * s, 0.8);
  } else if (kind === 1) {
    const h = R(5.8, 7) * s;
    trunk = 0.2 * s;
    bole(h * 0.8, trunk);
    for (let i = 0; i < 4; i++) {
      const t = i / 3,
        a = turn + i * 2.4,
        r = (1.05 - 0.55 * t) * s,
        off = 0.22 * s * (1 - t);
      leaf(i < 2 ? 0 : 1, x + Math.cos(a) * off, h * (0.4 + 0.56 * t), z + Math.sin(a) * off, r, i === 3 ? 1.5 : 1.1);
    }
  } else if (kind === 2) {
    const fork = R(1.5, 1.9) * s,
      n = 5;
    trunk = 0.36 * s;
    bole(fork + 0.4 * s, trunk);
    for (let i = 0; i < n; i++) {
      const a = turn + (i / n) * 6.283 + R(-0.2, 0.2),
        out = R(1.7, 2.2) * s,
        up = fork + R(0.9, 1.3) * s,
        bx = x + Math.cos(a) * out,
        bz = z + Math.sin(a) * out;
      if (i % 2 === 0) limb(x, fork, z, bx, up - 0.2 * s, bz, trunk * 0.42);
      leaf(0, bx, up, bz, R(1.1, 1.35) * s, 0.55);
    }
    leaf(1, x, fork + 1.6 * s, z, 2.0 * s, 0.5);
  } else {
    // the trunk leans and curves: three lengths of it, each a little slimmer, bending over toward the top
    const h = R(5, 6.4) * s,
      cx = Math.cos(turn) * s,
      cz = Math.sin(turn) * s,
      at = (t) => [x + cx * 1.3 * t * t, h * t, z + cz * 1.3 * t * t];
    trunk = 0.19 * s;
    limb(x, -0.3, z, x, 0.4 * s, z, trunk * 1.5);
    for (let i = 0; i < 4; i++) limb(...at(i / 4), ...at((i + 1) / 4), trunk * (1 - i * 0.12));
    const [tx, ty, tz] = at(1);
    PALM.push([tx, ty, tz, 0, turn, 0, s, s, s]);
    for (let i = 0; i < 3; i++)
      NUT.push([
        tx + Math.cos(turn + i * 2.1) * 0.2 * s,
        ty - 0.2 * s,
        tz + Math.sin(turn + i * 2.1) * 0.2 * s,
        0,
        0,
        0,
        0.15 * s,
        0.17 * s,
        0.15 * s,
      ]);
  }
  SOLIDS.push({ x, z, r: trunk + 0.06 });
  WOODS.push({ x, z, s });
}
for (const t of OLD_TREES) tree(t.x, t.z, Math.min(1.3, t.s * 0.75), [0, 2, 1][(Math.random() * 3) | 0]);
// trees stand in groves with open ground between them, not evenly everywhere. None on the road, in the camp, or in the clearing;
// just on the camera's side of the road, and on the near side of the clearing, only small ones that do not hide the brothers
for (let i = 0; i < 500; i++) {
  const x = R(X0 - 22, EX + 38),
    z = R(ZN - 30, ZS + 4),
    c = Math.hypot(x, z),
    grove = Math.sin(x * 0.045 + 1.3) * Math.cos(z * 0.06 - 0.7) + 0.35 * Math.sin(x * 0.11 + z * 0.09);
  if (grove < 0.1 || nearRiver(x, z, 1.5) || onRoad(x, z, 5) || inCamp(x, z, 12) || inHut(x, z, 3)) continue;
  if ((c < 58 && (z < 9 || c < 30)) || Math.hypot(Math.abs(x) - 40, z - 17.5) < 10 || inCourt(x, z, 3)) continue;
  const small = c < 58 || (x < 2 && z > roadZ(x) && z < roadZ(x) + 16);
  // which kind grows here. Palms like the riverbanks; elsewhere round and spreading trees are commonest, tall ones fewer
  const k = Math.random(),
    wet = nearRiver(x, z, 9),
    kind = wet ? (k < 0.5 ? 3 : k < 0.75 ? 0 : 2) : k < 0.42 ? 0 : k < 0.68 ? 2 : k < 0.9 ? 1 : 3;
  tree(x, z, small ? R(0.5, 0.7) : R(0.6, 1.1), kind);
}
// bushes: few, and never scattered singly. One clump sits at the foot of about every second tree, as undergrowth,
// and some more stand in small groups a little back from the road
function bush(x, z, r) {
  if (nearRiver(x, z, 0.6) || onRoad(x, z, 3.4) || inCamp(x, z, 7) || inHut(x, z, 0) || inCourt(x, z, 1)) return;
  for (let k = 0; k < 3; k++) {
    const q = r * R(0.6, 1);
    BUSH[(Math.random() * 3) | 0].push([x + R(-0.5, 0.5) * r, r * 0.45, z + R(-0.5, 0.5) * r, 0, R(0, 6), 0, q, q * 0.7, q]);
  }
}
WOODS.forEach((t, i) => {
  if (i % 2 === 0) bush(t.x + R(-1.2, 1.2), t.z + R(0.6, 1.6), R(0.45, 0.8));
});
for (let i = 0; i < 30; i++) {
  const x = R(X0, -14),
    z = roadZ(x) + (i % 2 ? 1 : -1) * R(4.5, 7.5);
  for (let k = 0; k < 3; k++) bush(x + R(-1.4, 1.4), z + R(-1, 1), R(0.4, 0.75));
}
// And in the hermitage itself, where nothing wild grows: planted clumps. Two or three beside and behind every house (never
// before its door), and more in loose groups round the outside of the clearing, so the open ground has a green edge
{
  const clump = (x, z, n) => {
    for (let k = 0; k < n; k++) {
      const bx = x + R(-1.1, 1.1),
        bz = z + R(-0.9, 0.9),
        r = R(0.45, 0.85);
      if (nearRiver(bx, bz, 0.6) || onRoad(bx, bz, 3) || nearRoad(bx, bz, 3) || inCourt(bx, bz, 2)) continue;
      for (let j = 0; j < 3; j++) {
        const q = r * R(0.6, 1);
        BUSH[(Math.random() * 3) | 0].push([bx + R(-0.5, 0.5) * r, r * 0.45, bz + R(-0.5, 0.5) * r, 0, R(0, 6), 0, q, q * 0.7, q]);
      }
    }
  };
  for (const [q, r] of [
    [SAGE_HOUSE, 4.4],
    [HALL, 5.4],
    [LONG, 4.4],
    [SW_HOUSE, 4.4],
    [SE_HOUSE, 4.4],
  ])
    for (const a of [2.0, -2.0, 2.75, -2.75, Math.PI]) clump(q[0] + Math.sin(q[2] + a) * (r + 2.6), q[1] + Math.cos(q[2] + a) * (r + 2.6), 3);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * 6.283 + R(-0.08, 0.08),
      d = R(46, 53);
    clump(YARD[0] + Math.sin(a) * d, YARD[1] + 4 + Math.cos(a) * d * 0.82, 3 + ((Math.random() * 2) | 0));
  }
}
// The roads: strips of bare trodden earth. The main one comes from the start over the first crossing, turns north and goes
// round the far side of the altar in a half ring past the three houses, comes back down, and runs on east over the second
// crossing to the camp beyond. The other comes up from the south beside the joined river, over the third crossing, to the altar
{
  const line = [];
  for (let x = START_X - 10; x < -44; x += 1.5) line.push(V3(x, 0, roadZ(x)));
  // from there on it is one smooth curve: it turns north to the foot of the half ring, goes round it, comes down the far side
  // the same way, and then heads east
  const through = [V3(-44, 0, roadZ(-44)), V3(-37, 0, 0.6)];
  for (let t = -1.45; t <= 1.46; t += 0.145) through.push(V3(RING * Math.sin(t), 0, -RING * Math.cos(t)));
  for (const [x, z] of [
    [40, -0.4],
    [50, 0.4],
    [60, 0.3],
    [75, 0.2],
    [90, 0],
    [100, 2.6],
    [108, 5.2],
    [120, 9.2],
    [134, 14],
  ])
    through.push(V3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(through, false, 'centripetal');
  line.push(...curve.getSpacedPoints(Math.ceil(curve.getLength() / 0.6)));
  const curve2 = new THREE.CatmullRomCurve3(
      SOUTH_ROAD.map(([x, z]) => V3(x, 0, z)),
      false,
      'centripetal',
    ),
    line2 = curve2.getSpacedPoints(Math.ceil(curve2.getLength() / 0.6)),
    // the two arms of the fork, the east one the west one mirrored about the south road's line
    arms = [1, -1].map((side) => {
      const c = new THREE.CatmullRomCurve3(
        FORK.map(([x, z]) => V3(0.4 + (x - 0.4) * side, 0, z)),
        false,
        'centripetal',
      );
      return c.getSpacedPoints(Math.ceil(c.getLength() / 0.6));
    });
  ROADS.push(line, line2, ...arms);
  ROADLINE.push(...line, ...line2, ...arms.flat());
  // a road's strip, from the line of points down its middle
  // (wide: half its width, for a footpath; a footpath also thins away at both ends instead of stopping blunt)
  const strip = (line, wide) => {
    // how far along the road each point is, and the whole length
    const along = [0];
    for (let i = 1; i < line.length; i++) along.push(along[i - 1] + line[i].distanceTo(line[i - 1]));
    const LEN = along[along.length - 1],
      pos = [],
      uv = [],
      idx = [];
    line.forEach((p, i) => {
      const a = line[Math.max(0, i - 1)],
        b = line[Math.min(line.length - 1, i + 1)],
        l = Math.hypot(b.x - a.x, b.z - a.z) || 1,
        nx = -(b.z - a.z) / l,
        nz = (b.x - a.x) / l,
        s = along[i],
        // it keeps its width to the very end and stops in a blunt, rounded tip
        e = wide ? Math.min(1, (LEN - s) / 5, s / 5) : Math.min(1, (LEN - s) / 1.5),
        end = wide ? 0.08 + 0.92 * e * e * (3 - 2 * e) : Math.sqrt(1 - (1 - e) * (1 - e)),
        // (the strip is cut a little wider than the road looks, because the picture laid on it fades out toward both edges)
        w = wide ? (wide + 0.22 * Math.sin(s * 0.9) + 0.12 * Math.sin(s * 2.3)) * end : (1.85 + 0.25 * Math.sin(s * 0.7)) * end,
        w2 = w * (0.9 + 0.15 * Math.sin(s * 0.31 + 1));
      // (it lies on the ground, just clear of it, whatever the ground's height)
      {
        const ax = p.x - nx * w,
          az = p.z - nz * w,
          bx = p.x + nx * w2,
          bz = p.z + nz * w2;
        pos.push(ax, groundY(ax, az) + 0.05, az, bx, groundY(bx, bz) + 0.05, bz);
      }
      uv.push(0, s / 9, 1, s / 9);
      if (i) idx.push(i * 2 - 2, i * 2 - 1, i * 2, i * 2 - 1, i * 2 + 1, i * 2);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  // The road is the plain flat earth colour it always was. The only thing the picture laid along it adds is the edge:
  // instead of a hard line, each side wanders a little and melts into the grass. The picture repeats every nine paces, and joins itself without a seam
  const W = 128,
    H = 512,
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d'),
    im = ctx.createImageData(W, H),
    // a wavering line that comes back to where it began after the full length, so the picture tiles
    wave = (y, k) =>
      Math.sin((y / H) * 6.283 * 2 + k) * 0.5 + Math.sin((y / H) * 6.283 * 5 + k * 2.3) * 0.3 + Math.sin((y / H) * 6.283 * 11 + k * 0.7) * 0.2,
    rnd = (x, y) => {
      const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
  for (let y = 0; y < H; y++) {
    const e1 = 9 + 4 * wave(y, 0.4),
      e2 = W - 9 + 4 * wave(y, 3.1);
    for (let x = 0; x < W; x++) {
      const d = Math.min(x - e1, e2 - x),
        // how much road there is here: none outside the edge, all of it a hand's breadth inside, crumbling in between
        t = Math.max(0, Math.min(1, d / 11)),
        cover = t * t * (3 - 2 * t),
        v = 143,
        i = (y * W + x) * 4;
      im.data[i] = v * 1.08;
      im.data[i + 1] = v * 0.93;
      im.data[i + 2] = v * 0.68;
      im.data[i + 3] = 255 * Math.max(0, Math.min(1, cover));
    }
  }
  ctx.putImageData(im, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  const roadM = toon(0xffffff, { map: tex, transparent: true, depthWrite: false, rim: 0 });
  for (const l of ROADS) {
    const m = new THREE.Mesh(strip(l), roadM);
    m.receiveShadow = true;
    m.renderOrder = -1;
    scene.add(m);
  }
}
// rocks: small ones anywhere, and a few boulders nobody can walk through
function rock(x, z, r, solid) {
  ROCK[(Math.random() * 2) | 0].push([x, r * 0.45, z, R(0, 6), R(0, 6), R(0, 6), r * R(0.9, 1.4), r * R(0.6, 0.9), r * R(0.9, 1.3)]);
  if (solid) SOLIDS.push({ x, z, r: r * 0.95 });
}
for (let i = 0; i < 170; i++) {
  const x = R(X0 - 10, EX + 20),
    z = R(ZN - 10, ZS),
    big = i % 7 === 0;
  if (onRoad(x, z, 3.4) || inCamp(x, z, 8) || inHut(x, z, 0) || inCourt(x, z, 1) || nearRoad(x, z, 3.2) || nearRiver(x, z, big ? 1 : -1.6)) continue;
  rock(x, z, big ? R(0.8, 1.4) : R(0.15, 0.45), big);
}

// ---------- grass and herbs ----------
// Things that grow underfoot and stop nobody: tufts of grass, and here and there a few
// herbs together, each a low rosette of leaves with small flowers standing over it, white, yellow or violet.
// None grow on the road, in the water, on the altar's floor or where a house stands
{
  // a tuft: seven blades fanned out from one root, each a short, broad blade leaning well outward, so the tuft is a low soft clump
  const blades = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * 6.283 + R(-0.3, 0.3),
      lean = R(0.1, 0.24),
      h = R(0.11, 0.2),
      cx = Math.cos(a),
      cz = Math.sin(a);
    blades.push(cx * 0.03 - cz * 0.045, 0, cz * 0.03 + cx * 0.045, cx * 0.03 + cz * 0.045, 0, cz * 0.03 - cx * 0.045, cx * lean, h, cz * lean);
  }
  const tuftG = new THREE.BufferGeometry();
  tuftG.setAttribute('position', new THREE.Float32BufferAttribute(blades, 3));
  tuftG.computeVertexNormals();
  // a herb's rosette: six pointed leaves lying out from the middle and tipped up a little
  const leaves = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.283,
      cx = Math.cos(a),
      cz = Math.sin(a),
      at = (r, y, side) => [cx * r - cz * side, y, cz * r + cx * side];
    leaves.push(
      ...at(0.02, 0.02, 0),
      ...at(0.11, 0.07, 0.045),
      ...at(0.2, 0.1, 0),
      ...at(0.02, 0.02, 0),
      ...at(0.2, 0.1, 0),
      ...at(0.11, 0.07, -0.045),
    );
  }
  const herbG = new THREE.BufferGeometry();
  herbG.setAttribute('position', new THREE.Float32BufferAttribute(leaves, 3));
  herbG.computeVertexNormals();
  const TUFT = [lot(tuftG, toon(0x7da548, { rim: 0.1 })), lot(tuftG, toon(0x6a9440, { rim: 0.1 }))],
    HERB = lot(herbG, toon(0x4c8a3c, { rim: 0.1 })),
    STEM = lot(new THREE.CylinderGeometry(0.008, 0.008, 1, 4), toon(0x5a9440, { rim: 0 })),
    bloomG = new THREE.IcosahedronGeometry(1, 0),
    BLOOM = [0xf4f0e6, 0xf2cf3a, 0x9a78d8].map((c) => lot(bloomG, toon(c, { rim: 0.15 }))),
    HOUSES = [
      [SAGE_HOUSE, 7.2],
      [HALL, 8.2],
      [LONG, 7.2],
      [SW_HOUSE, 7.2],
      [SE_HOUSE, 7.2],
      [WOODSHED, 2.6],
      [WORKSHOP, 5],
      [SHED, 3.6],
      [POND, 4.5],
    ],
    // may something grow here?
    open = (x, z) => {
      if (x < X0 || x > EX - 4 || z < ZN || z > ZS) return false;
      if (nearRiver(x, z, 0.4) || inCourt(x, z, 0.3)) return false;
      if (HOUSES.some(([q, r]) => Math.hypot(x - q[0], z - q[1]) < r)) return false;
      if (nearRoad(x, z, 2.4)) return false;
      return true;
    };
  // a patch of n tufts scattered within spread of a spot, and now and then a few herbs with it
  const patch = (px, pz, n, spread, herbs) => {
    for (let k = 0; k < n; k++) {
      const x = px + R(-spread, spread),
        z = pz + R(-spread, spread),
        sc = R(0.8, 1.2);
      if (open(x, z)) TUFT[(Math.random() * 2) | 0].push([x, 0, z, 0, R(0, 6.28), 0, sc, sc * R(0.8, 1.2), sc]);
    }
    const kind = (Math.random() * 3) | 0;
    for (let k = 0; k < herbs; k++) {
      const x = px + R(-spread, spread),
        z = pz + R(-spread, spread),
        sc = R(0.9, 1.5),
        h = R(0.16, 0.3) * sc;
      if (!open(x, z)) continue;
      HERB.push([x, 0, z, 0, R(0, 6.28), 0, sc, sc, sc]);
      STEM.push([x, h / 2, z, 0, 0, 0, 1, h, 1]);
      for (let b = 0; b < 3; b++)
        BLOOM[kind].push([x + R(-0.04, 0.04) * sc, h + R(-0.03, 0.03), z + R(-0.04, 0.04) * sc, 0, 0, 0, 0.03 * sc, 0.03 * sc, 0.03 * sc]);
    }
  };
  // They do not grow just anywhere, only where such things do:
  // round the foot of most trees, in their shade;
  for (const t of [...WOODS, ...TREES])
    if (Math.random() < 0.9)
      patch(t.x, t.z, 6 + ((Math.random() * 5) | 0), 0.9 + t.s * 0.7, Math.random() < 0.35 ? 2 + ((Math.random() * 2) | 0) : 0);
  // along both verges of the road, in broken stretches;
  for (let i = 2; i < ROADLINE.length - 2; i++) {
    const p = ROADLINE[i],
      q = ROADLINE[i + 1],
      l = Math.hypot(q.x - p.x, q.z - p.z) || 1;
    for (const side of [-1, 1])
      if (Math.random() < l * 0.24) {
        const off = side * R(2.7, 3.7);
        patch(p.x - ((q.z - p.z) / l) * off, p.z + ((q.x - p.x) / l) * off, 3 + ((Math.random() * 3) | 0), 0.7, Math.random() < 0.3 ? 2 : 0);
      }
  }
  // on the banks of the rivers;
  for (const line of RIV)
    for (let i = 4; i < line.length - 4; i += 5) {
      const p = line[i],
        q = line[i + 1],
        l = Math.hypot(q.x - p.x, q.z - p.z) || 1;
      for (const side of [-1, 1])
        if (Math.random() < 0.68) {
          const off = side * R(RW + 1.4, RW + 2.8);
          patch(p.x - ((q.z - p.z) / l) * off, p.z + ((q.x - p.x) / l) * off, 3 + ((Math.random() * 3) | 0), 0.7, Math.random() < 0.25 ? 2 : 0);
        }
    }
  // and round the pond
  for (let i = 0; i < 14; i++) {
    const a = R(0, 6.283),
      r = R(4.7, 5.8);
    patch(POND[0] + Math.cos(a) * r, POND[1] + Math.sin(a) * r, 3 + ((Math.random() * 3) | 0), 0.5, Math.random() < 0.4 ? 2 : 0);
  }
}

// ---------- river ----------
// Water is drawn by its own small shader, kept plain: one blue, a little paler toward the banks, with broad soft bands drifting from the
// fall toward the camera, a thin white line along each bank and white where the fall lands. The same shader, told it is falling, draws the waterfall.
const WATER_T = { value: 0 };
function waterMat(fall, head = 0) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: !fall,
    side: THREE.DoubleSide,
    uniforms: {
      uT: WATER_T,
      uFall: { value: fall ? 1 : 0 },
      uHead: { value: head },
      uDeep: { value: new THREE.Color(0x1f5f96) },
      uShallow: { value: new THREE.Color(0x4fa3cf) },
      uFoam: { value: new THREE.Color(0xf2fbff) },
      uFog: { value: scene.fog.color },
      uFogD: { value: scene.fog.density },
    },
    vertexShader: `varying vec2 vUv; varying float vZ; varying float vDepth;
      void main(){ vUv = uv; vZ = position.z; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uT, uFall, uHead, uFogD; uniform vec3 uDeep, uShallow, uFoam, uFog; varying vec2 vUv; varying float vZ; varying float vDepth;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ return noise(p) * 0.55 + noise(p * 2.1 + 7.3) * 0.3 + noise(p * 4.3 + 1.7) * 0.15; }
      void main(){
        bool falling = uFall > 0.5;
        float edge = abs(vUv.x - 0.5) * 2.0;
        float flow = falling ? vUv.y * 6.4 + uT * 4.0 : vUv.y - uT * 1.4;
        // plain water: one colour, a little paler toward the banks, with broad soft bands drifting along it
        float band = fbm(vec2(vUv.x * 3.0, flow * 0.3));
        vec3 col = mix(uDeep, uShallow, smoothstep(0.3, 1.0, edge) * 0.6);
        col = mix(col, uShallow, smoothstep(0.45, 0.75, band) * 0.25);
        // a thin clean line of white along each bank, and white where the fall comes down
        float foam = smoothstep(0.9, 0.97, edge);
        if (falling) foam = max(foam, 0.35 + smoothstep(0.4, 0.7, band) * 0.35);
        else foam = max(foam, (1.0 - smoothstep(0.0, 3.0, vUv.y - uHead)) * 0.8);
        col = mix(col, uFoam, clamp(foam, 0.0, 1.0));
        float fogF = 1.0 - exp(-uFogD * uFogD * vDepth * vDepth);
        float alpha = falling ? 0.9 * smoothstep(1.0, 0.85, edge) : 0.95;
        gl_FragColor = vec4(mix(col, uFog, fogF), alpha);
      }`,
  });
}
// Each river runs in the channel the land dips into (see the lie of the land). The water is a ribbon laid along its course, a
// little below the level of the ground; the banks are the land itself. Where a crossing is, the ribbon stops and begins again
// on the far side. Down the picture laid on it, across is from bank to bank and along is the distance downstream, so the bands
// in the water drift the way it flows.
const DEEP = 0.9;
RIV.forEach((line, r) => {
  const pos = [],
    uv = [],
    idx = [];
  let s = 0,
    last = -2;
  line.forEach((p, i) => {
    const a = line[Math.max(0, i - 1)],
      b = line[Math.min(line.length - 1, i + 1)],
      l = Math.hypot(b.x - a.x, b.z - a.z) || 1,
      nx = -(b.z - a.z) / l,
      nz = (b.x - a.x) / l;
    if (i) s += p.distanceTo(line[i - 1]);
    // (the three ribbons overlap where the rivers meet, so each lies a hair below the last and they do not fight)
    const y = lift(p.x, p.z) - DEEP - r * 0.006;
    const hw = RW + WIDER[r];
    pos.push(p.x - nx * hw, y, p.z - nz * hw, p.x + nx * hw, y, p.z + nz * hw);
    uv.push(0, s, 1, s);
    // joined to the point before, unless a crossing lies between
    if (!atFord(p, 0)) {
      if (last === i - 1) idx.push(i * 2 - 2, i * 2, i * 2 - 1, i * 2 - 1, i * 2, i * 2 + 1);
      last = i;
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  // only the west arm has a fall at its head, and so foam there
  scene.add(new THREE.Mesh(g, waterMat(false, r ? -999 : 0)));
  // nobody walks through water: a row of blocking circles down the middle of each river, left open at the crossings
  for (let i = 0; i < line.length; i += 3) if (!atFord(line[i], RW - 0.8 + WIDER[r])) SOLIDS.push({ x: line[i].x, z: line[i].z, r: RW - 0.8 + WIDER[r] });
  // Near a crossing the circles down the middle stop short, and alone they would leave the water by either bank open to anyone
  // coming off the crossing at an angle. So for ten paces either side of each crossing, two more rows stand in the water, one
  // toward each bank, starting right where the dry way over ends
  for (let i = 0; i < line.length; i += 2) {
    const p = line[i];
    if (atFord(p, 0.6) || !FORDS.some((f) => Math.hypot(p.x - f[0], p.z - f[1]) < FORD_R + 10)) continue;
    const a = line[Math.max(0, i - 1)],
      b = line[Math.min(line.length - 1, i + 1)],
      l = Math.hypot(b.x - a.x, b.z - a.z) || 1,
      hw = RW + WIDER[r];
    for (const k of [-0.62, 0.62]) SOLIDS.push({ x: p.x - ((b.z - a.z) / l) * hw * k, z: p.z + ((b.x - a.x) / l) * hw * k, r: hw * 0.45 });
  }
});

// ---------- waterfall ----------
// a wall of rock on the far side, the water coming over it in a sheet and breaking into foam where it lands
const FALL = V3(WX, 0, RIVER_FROM);
{
  // rocks along both edges of the drop, smaller and flatter toward the top, so the face the water goes over reads as stone
  for (const sx of [-1, 1])
    for (let i = 0; i < 9; i++) {
      const up = i / 8,
        r = R(0.7, 1.4) * (1.25 - up * 0.5);
      add(
        scene,
        new THREE.DodecahedronGeometry(r, 0),
        ROCKM[i % 2],
        [FALL.x + sx * (RW - 0.2 + R(0, 2.2)), -0.6 + up * HIGH, FALL.z + 0.4 - up * 2.2 + R(-0.4, 0.4)],
        [R(0, 6), R(0, 6), R(0, 6)],
        [1.3, 0.75, 1.1],
      );
    }
  for (let x = -7; x <= 7; x += 1.6) SOLIDS.push({ x: FALL.x + x, z: FALL.z - 2.2, r: 2 });
  // the falling water: a sheet that leaves the end of the upper river at the lip, bows a little outward as it drops, and lands
  // in the start of the lower one, so the three are one piece of water
  const pos = [],
    uv = [],
    idx = [],
    N = 12,
    top = HIGH - DEEP,
    lip = FALL.z - 1.6;
  for (let j = 0; j <= N; j++) {
    const t = j / N,
      y = top - (top + DEEP + 0.05) * t * t,
      z = lip + 2 * Math.sqrt(t),
      // a touch wider where it lands, where it spreads
      w = RW - 0.3 + 0.4 * t;
    pos.push(FALL.x - w, y, z, FALL.x + w, y, z);
    uv.push(0, 1 - t, 1, 1 - t);
    if (j) idx.push(j * 2 - 2, j * 2, j * 2 - 1, j * 2 - 1, j * 2, j * 2 + 1);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  sg.setIndex(idx);
  const sheet = new THREE.Mesh(sg, waterMat(true));
  scene.add(sheet);
}
// (the compound and the fire's ground, which stood here, are in altar.js: the sandbox has the same fire and floor)
// every lot is now complete: each becomes one batch
for (const l of LOTS) {
  const m = new THREE.InstancedMesh(l.geo, l.mat, l.length),
    o = new THREE.Object3D();
  l.forEach((p, i) => {
    // (each thing's height is counted from the ground where it stands)
    o.position.set(p[0], p[1] + groundY(p[0], p[2]), p[2]);
    o.rotation.set(p[3], p[4], p[5]);
    o.scale.set(p[6], p[7], p[8]);
    o.updateMatrix();
    m.setMatrixAt(i, o.matrix);
  });
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
}

// ---------- the hermitage ----------
// what it is built of: mud walls on a stone footing with a painted band at the foot, timber, plank doors, and hay for the roofs
// thatch is drawn with a picture of straw: a greyish, weathered ground covered in fine strands running down the slope, some paler,
// some darker, with the odd deep gap between bundles
function strawPicture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#a39b85';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1500; i++) {
    const v = 110 + Math.random() * 100,
      x = Math.random() * 256,
      y = Math.random() * 256,
      len = 30 + Math.random() * 110;
    g.strokeStyle = `rgba(${v | 0},${(v * 0.95) | 0},${(v * 0.8) | 0},${0.25 + Math.random() * 0.5})`;
    g.lineWidth = 0.6 + Math.random() * 1.4;
    for (const oy of [0, -256]) {
      g.beginPath();
      g.moveTo(x, y + oy);
      g.lineTo(x + (Math.random() - 0.5) * 5, y + oy + len);
      g.stroke();
    }
  }
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(40,34,26,${0.25 + Math.random() * 0.3})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random(), 20 + Math.random() * 60);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 1);
  t.anisotropy = 8;
  return t;
}
const STRAW = strawPicture();
const HM = {
  mud: toon(0xc9a36f, { rim: 0.1 }),
  band: toon(0x9c4a2c, { rim: 0.1 }),
  lime: toon(0xefe6d2, { rim: 0.05 }),
  // the roofs are thatch: grey weathered straw, its strands showing, laid in courses each with a darker edge
  thatch: toon(0xffffff, { map: STRAW, rim: 0.1 }),
  thatch2: toon(0xb9b2a4, { map: STRAW, rim: 0.05 }),
  plank: toon(0x8a5a30, { rim: 0.1 }),
  dark: toon(0x20140f, { rim: 0 }),
  clay: toon(0xb5603a, { rim: 0.2 }),
};
// a group standing at a site [x, z, turn], and a way to turn a spot measured inside it into a place on the map
function site([x, z, a]) {
  const g = new THREE.Group();
  g.position.set(x, groundY(x, z), z);
  g.rotation.y = a;
  scene.add(g);
  g.at = (lx, lz) => ({ x: x + lx * Math.cos(a) + lz * Math.sin(a), z: z - lx * Math.sin(a) + lz * Math.cos(a) });
  return g;
}
// A round house, R across the wall from the middle. A round stone footing with a step at the door; a mud wall with a painted band
// and a white line at the foot, timber posts set into it and a timber ring along its top; plank doors in a timber frame; shuttered
// windows; and a low cone of thatch, gentler in its upper half, with a darker edge under its eave, that
// overhangs all round on a ring of posts to make a veranda.
//   wins: how far round from the door (in radians) each window is
function house(q, { R: r, wins }) {
  const g = site(q),
    { mud, band, lime, thatch, thatch2, plank, dark } = HM,
    FH = 2.7,
    Y0 = 0.6,
    top = Y0 + FH,
    over = 1.4,
    RR = r + over,
    ry = top - 0.32,
    // something set against the wall, a given way round from the door: it is built facing out along z and then turned
    wall = (a) => {
      const w = new THREE.Group();
      w.rotation.y = a;
      g.add(w);
      return (x, y, z, m, p) => add(w, new THREE.BoxGeometry(x, y, z), m, [p[0], p[1], r + p[2]]);
    };
  // footing, wall, the band and line at its foot, and the timber: posts round the wall and a ring along its top
  add(g, new THREE.CylinderGeometry(RR - 0.1, RR + 0.05, Y0, 48), STONE, [0, Y0 / 2, 0]);
  add(g, new THREE.CylinderGeometry(r, r, FH, 40), mud, [0, Y0 + FH / 2, 0]);
  add(g, new THREE.CylinderGeometry(r + 0.03, r + 0.04, 0.5, 40), band, [0, Y0 + 0.25, 0]);
  add(g, new THREE.CylinderGeometry(r + 0.035, r + 0.035, 0.07, 40), lime, [0, Y0 + 0.56, 0]);
  tor(g, r + 0.02, 0.09, WOOD, [0, top - 0.08, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    cyl(g, 0.1, 0.1, FH, WOOD, [Math.sin(a) * r, Y0 + FH / 2, Math.cos(a) * r]);
  }
  // a pair of plank doors in a timber frame, with a stone step up to the footing
  {
    const bx = wall(0);
    bx(1.4, 2.15, 0.12, plank, [0, Y0 + 1.075, -0.02]);
    bx(0.03, 2.15, 0.14, dark, [0, Y0 + 1.075, -0.02]);
    for (const sx of [-1, 1]) bx(0.18, 2.3, 0.24, WOOD, [sx * 0.79, Y0 + 1.15, -0.02]);
    bx(2.0, 0.2, 0.28, WOOD, [0, Y0 + 2.36, -0.02]);
    bx(2.2, 0.16, 0.6, STONE, [0, 0.08, over + 0.75]);
  }
  // a window: a dark opening in a timber frame, its two shutters folded back against the wall
  for (const a of wins) {
    const bx = wall(a),
      y = Y0 + 1.6;
    bx(0.7, 0.75, 0.12, dark, [0, y, -0.03]);
    bx(0.86, 0.09, 0.18, WOOD, [0, y + 0.42, -0.01]);
    bx(0.94, 0.09, 0.22, WOOD, [0, y - 0.42, 0]);
    for (const sx of [-1, 1]) bx(0.33, 0.75, 0.05, plank, [sx * 0.53, y, -0.03]);
  }
  // The roof is thatch, in the shape of a cone that eases off half way up: steeper from the eave to the middle, then at a
  // gentler angle up to the peak, so the top is low and blunt. The eave comes well past the posts and the footing.
  // Under it is a second, slightly darker layer of the same shape that reaches a little further out, so only its edge shows.
  // The straw picture is wrapped many times round, so its strands stay fine and run from the peak down to the eave
  const RT = RR + 0.8,
    HT = RT * 0.52,
    low = (0.64 * HT) / (RT * 0.5),
    yb = ry - 0.45,
    shape = new THREE.LatheGeometry([new THREE.Vector2(RT, 0), new THREE.Vector2(RT * 0.5, HT * 0.64), new THREE.Vector2(0.001, HT)], 44);
  {
    const uv = shape.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * Math.round(RT * 1.1));
  }
  add(g, shape, thatch, [0, yb, 0]);
  add(g, shape, thatch2, [0, yb - 0.06, 0], [0, 0, 0], [1 + 0.07 / RT, 1, 1 + 0.07 / RT]);
  // the veranda: a ring of posts on stone bases round the edge of the footing, under the eave
  // (few of them, and stout)
  const n = Math.round((2 * Math.PI * (RR - 0.4)) / 4.4),
    ph = yb + low * (RT - (RR - 0.4)) - Y0 - 0.4;
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI * 2,
      x = Math.sin(a) * (RR - 0.4),
      z = Math.cos(a) * (RR - 0.4);
    cyl(g, 0.17, 0.2, ph, WOOD, [x, Y0 + ph / 2, z]);
    add(g, new THREE.BoxGeometry(0.52, 0.22, 0.52), STONE, [x, Y0 + 0.11, z], [0, a, 0]);
    add(g, new THREE.BoxGeometry(0.46, 0.14, 0.46), WOOD, [x, Y0 + ph - 0.07, z], [0, a, 0]);
  }
  SOLIDS.push({ x: q[0], z: q[1], r: r + 1.1 });
  return g;
}
// the sage's own house, on the left
house(SAGE_HOUSE, { R: 4.4, wins: [0.9, -0.9] });
// the hall, where the pupils eat and are taught
house(HALL, { R: 5.4, wins: [0.6, -0.6, 1.3, -1.3] });
// the pupils' house, on the right, the same size as the sage's
house(LONG, { R: 4.4, wins: [0.9, -0.9] });
// the two lower houses, the villagers'
house(SW_HOUSE, { R: 4.4, wins: [0.9, -0.9] });
house(SE_HOUSE, { R: 4.4, wins: [0.9, -0.9] });

// ---------- behind the houses ----------
const MASON_AT = [];
{
  const { mud, band, lime, thatch, thatch2, clay } = HM,
    box = (g, w, h, d, m, p, r) => add(g, new THREE.BoxGeometry(w, h, d), m, p, r);
  // the wood store, between the sage's house and the hall: a small lean-to on four posts with one stack of split logs under it, and the chopping block beside it
  {
    const g = site(WOODSHED),
      LOGM = [toon(0x7a4a22, { rim: 0.1 }), toon(0x8a5a2c, { rim: 0.1 })];
    for (const sx of [-1, 1]) {
      cyl(g, 0.07, 0.09, 1.8, WOOD, [sx * 1.2, 0.9, 0.8]);
      cyl(g, 0.07, 0.09, 1.4, WOOD, [sx * 1.2, 0.7, -0.8]);
    }
    box(g, 3.1, 0.32, 2.5, thatch, [0, 1.86, 0], [-0.22, 0, 0]);
    box(g, 3.3, 0.12, 2.7, thatch2, [0, 1.68, 0], [-0.22, 0, 0]);
    for (let row = 0; row < 4; row++)
      for (let i = 0; i < 5 - (row % 2); i++)
        cyl(g, 0.11, 0.12, 1.5, LOGM[row % 2], [R(-0.04, 0.04), 0.14 + row * 0.21, -0.5 + i * 0.25 + (row % 2) * 0.12], [0, 0, Math.PI / 2]);
    cyl(g, 0.3, 0.34, 0.42, WOOD, [1.9, 0.21, 0.9]);
    cyl(g, 0.025, 0.03, 0.75, WOOD, [2.05, 0.7, 0.9], [0, 0, -0.5]);
    box(g, 0.22, 0.14, 0.05, toon(0x55585e, { rim: 0.3 }), [1.9, 0.48, 0.9], [0, 0, -0.5]);
    SOLIDS.push({ ...g.at(0, 0), r: 1.3 }, { ...g.at(1.9, 0.9), r: 0.4 });
  }
  // The masons' yard, out behind the top right house: a small open workshop, left as it was on the morning they were taken. Under a
  // thatch on four posts stands their bench, with a mallet and chisels still on it. To one side a guardian is half out of
  // its stone: head, shoulders and one arm cut, and below the waist still the square block, with a chisel left standing in
  // it. To the other side a second block lies across two logs with no more than a head roughed out at one end. Behind are
  // the blocks not yet begun. A hammer lies where it was dropped, a stool is on its side, and the ground is pale with dust
  // and chips. (Its near side, +z here, is toward the house)
  {
    const g = site(WORKSHOP),
      iron = toon(0x55585e, { rim: 0.3 }),
      pale = toon(0xb9b6ae, { rim: 0.15 }),
      dust = add(g, new THREE.CircleGeometry(4.2, 28), toon(0xd8d2c4, { rim: 0, transparent: true, depthWrite: false }), [0, 0.03, 0], [-Math.PI / 2, 0, 0]);
    dust.material.opacity = 0.32;
    dust.castShadow = false;
    // the shelter and the bench under it
    for (const sx of [-1, 1]) {
      cyl(g, 0.07, 0.09, 2.1, WOOD, [sx * 1.35, 1.05, 0.75]);
      cyl(g, 0.07, 0.09, 1.7, WOOD, [sx * 1.35, 0.85, -0.75]);
    }
    box(g, 3.3, 0.3, 2.3, thatch, [0, 2.12, 0], [-0.22, 0, 0]);
    box(g, 3.5, 0.12, 2.5, thatch2, [0, 1.95, 0], [-0.22, 0, 0]);
    box(g, 1.9, 0.09, 0.7, WOOD, [0, 0.82, -0.1]);
    for (const [lx, lz] of [
      [-0.85, -0.38],
      [0.85, -0.38],
      [-0.85, 0.18],
      [0.85, 0.18],
    ])
      cyl(g, 0.045, 0.05, 0.8, WOOD, [lx, 0.4, lz]);
    cyl(g, 0.09, 0.09, 0.2, WOOD, [-0.45, 0.94, -0.1], [0, 0, Math.PI / 2]);
    cyl(g, 0.02, 0.02, 0.34, WOOD, [-0.45, 0.94, 0.12], [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 3; i++) cyl(g, 0.014, 0.018, 0.3, iron, [0.2 + i * 0.16, 0.885, -0.1 + i * 0.04], [Math.PI / 2, 0, 0.5 - i * 0.4]);
    // the guardian, half out of its block
    {
      const X = -2.7,
        Z = 0.3;
      box(g, 1.0, 0.3, 1.0, ROCKM[1], [X, 0.15, Z]);
      box(g, 0.86, 1.05, 0.62, ROCKM[0], [X, 0.82, Z]);
      // (the waist up is cut: chest, shoulders, head and tall crown, and his right arm down to the head of a mace)
      cyl(g, 0.3, 0.36, 0.62, pale, [X, 1.64, Z], [0, 0, 0], [1, 1, 0.72]);
      sph(g, 0.2, pale, [X, 2.14, Z + 0.02]);
      cyl(g, 0.1, 0.19, 0.3, pale, [X, 2.42, Z]);
      cyl(g, 0.09, 0.1, 0.62, pale, [X - 0.4, 1.62, Z + 0.06], [0, 0, -0.12]);
      sph(g, 0.15, pale, [X - 0.46, 1.24, Z + 0.1]);
      // (his left side is still the rough of the block)
      box(g, 0.36, 0.7, 0.5, ROCKM[0], [X + 0.36, 1.62, Z], [0, 0, 0.06]);
      // (a chisel left standing in the stone at his waist)
      cyl(g, 0.016, 0.02, 0.3, iron, [X + 0.1, 1.38, Z + 0.4], [1.1, 0, 0]);
      SOLIDS.push({ ...g.at(X, Z), r: 0.62 });
    }
    // the second, hardly begun, lying across two logs
    {
      const X = 2.7,
        Z = 0.2;
      for (const o of [-0.6, 0.6]) cyl(g, 0.11, 0.12, 1.0, WOOD, [X + o, 0.11, Z], [Math.PI / 2, 0, 0]);
      box(g, 2.0, 0.62, 0.72, ROCKM[1], [X, 0.53, Z], [0, 0.04, 0]);
      sph(g, 0.22, pale, [X - 1.0, 0.6, Z], [0.8, 1, 1]);
      SOLIDS.push({ ...g.at(X - 0.5, Z), r: 0.55 }, { ...g.at(X + 0.5, Z), r: 0.55 });
    }
    // the blocks not yet begun, at the back
    for (const [bx, by, bz, ry] of [
      [0.1, 0.24, -2.6, 0.1],
      [1.05, 0.24, -2.5, -0.15],
      [0.55, 0.72, -2.55, 0.3],
    ])
      box(g, 0.9, 0.48, 0.6, ROCKM[(bx * 10) & 1], [bx, by, bz], [0, ry, 0]);
    SOLIDS.push({ ...g.at(0.55, -2.55), r: 0.85 }, { ...g.at(0, -0.1), r: 0.9 });
    // left as it fell: a hammer on the ground, a stool on its side, a water pot tipped over, chips everywhere
    cyl(g, 0.02, 0.022, 0.8, WOOD, [-1.5, 0.03, 1.7], [Math.PI / 2, 0, 0.9]);
    box(g, 0.13, 0.13, 0.22, iron, [-1.2, 0.07, 1.46], [0, 0.9, 0]);
    cyl(g, 0.2, 0.2, 0.3, WOOD, [1.3, 0.2, 1.7], [0, 0.4, Math.PI / 2]);
    sph(g, 0.24, clay, [0.2, 0.2, 2.2], [1, 0.9, 1.15]);
    for (let i = 0; i < 26; i++) {
      const cx = i % 2 ? R(-3.6, -1.6) : R(1.4, 3.8),
        cz = R(-0.8, 1.6);
      box(g, R(0.06, 0.2), 0.05, R(0.05, 0.14), i % 3 ? pale : ROCKM[0], [cx, 0.04, cz], [0, R(0, 6), 0]).castShadow = false;
    }
    // where each of the three stands to work, and what he works at (h: how high his hammer falls)
    for (const [x, z, fx, fz, h] of [
      [-2.7, 1.3, -2.7, 0.3, 1.3],
      [2.7, 1.15, 2.7, 0.2, 0.75],
      [0.55, -1.35, 0.55, -2.55, 0.85],
    ])
      MASON_AT.push({ ...g.at(x, z), face: { ...g.at(fx, fz), h } });
  }
  // the cow's shelter: a low back wall, four posts and a sloping thatch roof, open at the front, with a trough and a heap of hay
  {
    const g = site(SHED);
    box(g, 5.2, 0.14, 4.2, STONE, [0, 0.07, 0]);
    box(g, 4.6, 1.2, 0.3, mud, [0, 0.74, -1.6]);
    box(g, 4.66, 0.35, 0.36, band, [0, 0.31, -1.6]);
    for (const sx of [-1, 1]) {
      cyl(g, 0.09, 0.11, 2.2, WOOD, [sx * 2.2, 1.24, 1.5]);
      cyl(g, 0.09, 0.11, 1.7, WOOD, [sx * 2.2, 0.99, -1.6]);
      box(g, 0.1, 0.1, 3.3, WOOD, [sx * 2.2, 2.07, -0.05], [-0.16, 0, 0]);
    }
    box(g, 5.2, 0.18, 4.0, thatch, [0, 2.2, -0.05], [-0.16, 0, 0]);
    box(g, 5.4, 0.1, 4.2, thatch2, [0, 2.1, -0.05], [-0.16, 0, 0]);
    box(g, 1.8, 0.34, 0.55, WOOD, [-0.9, 0.31, -0.9]);
    sph(g, 0.75, thatch, [1.3, 0.5, -0.7], [1.2, 0.7, 1]);
    SOLIDS.push({ ...g.at(-1.1, -0.6), r: 1.6 }, { ...g.at(1.1, -0.6), r: 1.6 });
  }
  // three water jars of different sizes at the back of the sage's house
  {
    const g = site(JARS);
    for (const [x, z, r] of [
      [0, 0, 0.42],
      [0.75, 0.25, 0.3],
      [0.3, 0.7, 0.24],
    ]) {
      sph(g, r, clay, [x, r * 0.85, z], [1, 0.9, 1]);
      tor(g, r * 0.4, r * 0.1, clay, [x, r * 1.72, z], [Math.PI / 2, 0, 0]);
    }
    SOLIDS.push({ ...g.at(0.3, 0.3), r: 0.8 });
  }
}

// ---------- the lotus pond ----------
// A round pond lying flat in the ground. Lotus leaves float
// on it, flat and round; among them are open flowers, pink with a yellow heart, and a few buds still closed on their stalks
{
  const [PX, PZ, PA] = POND,
    A = 3.8,
    B = 3.8,
    g = site(POND),
    many = (geo, mat, list, shadow) => {
      const m = new THREE.InstancedMesh(geo, mat, list.length),
        o = new THREE.Object3D();
      list.forEach((q, i) => {
        o.position.set(q[0], q[1], q[2]);
        o.rotation.set(q[3], q[4], q[5], 'YXZ');
        o.scale.set(q[6], q[7], q[8]);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
      });
      m.castShadow = !!shadow;
      m.receiveShadow = true;
      g.add(m);
    },
    // a random spot on the water, no nearer the kerb than k (1 is the kerb itself)
    spot = (k) => {
      const a = R(0, 6.283),
        r = Math.sqrt(Math.random()) * k;
      return [Math.cos(a) * A * r, Math.sin(a) * B * r];
    };
  // the water lies flat in the ground, darker in the middle where it is deep, with a narrow margin of damp earth round it
  // and a few stones on the bank. There is no kerb
  const flat = (r, mat, y) => (add(g, new THREE.CircleGeometry(r, 56), mat, [0, y, 0], [-Math.PI / 2, 0, 0]).castShadow = false);
  flat(A + 0.45, toon(0x6e6044, { rim: 0 }), 0.006);
  flat(A, toon(0x3f8a94, { rim: 0 }), 0.012);
  flat(A * 0.62, toon(0x2f7484, { rim: 0 }), 0.016);
  for (let i = 0; i < 7; i++) {
    const a = R(0, 6.283),
      r = R(0.16, 0.34);
    add(
      g,
      new THREE.DodecahedronGeometry(r, 0),
      ROCKM[i % 2],
      [Math.cos(a) * (A + 0.35), r * 0.4, Math.sin(a) * (A + 0.35)],
      [R(0, 6), R(0, 6), R(0, 6)],
      [1.2, 0.8, 1],
    );
  }
  // leaves
  const pads = [];
  for (let i = 0; i < 26; i++) {
    const [x, z] = spot(0.88),
      r = R(0.24, 0.46);
    pads.push([x, 0.03 + i * 0.0005, z, -Math.PI / 2, R(0, 6.28), 0, r, r, 1]);
  }
  many(new THREE.CircleGeometry(1, 12, 0.35, 5.6), toon(0x3f8f45, { rim: 0.1 }), pads);
  // flowers: two rings of petals, the outer ones spread wide and the inner ones more upright, round a yellow heart
  const petals = [],
    hearts = [],
    stalks = [],
    buds = [];
  for (let i = 0; i < 7; i++) {
    const [x, z] = spot(0.8),
      s = R(0.85, 1.2),
      y = 0.07;
    for (let k = 0; k < 8; k++) petals.push([x, y, z, 1.05, (k / 8) * 6.283, 0, 0.075 * s, 0.2 * s, 0.03 * s]);
    for (let k = 0; k < 6; k++) petals.push([x, y + 0.01, z, 0.5, ((k + 0.5) / 6) * 6.283, 0, 0.06 * s, 0.17 * s, 0.03 * s]);
    hearts.push([x, y + 0.04, z, 0, 0, 0, 0.055 * s, 0.045 * s, 0.055 * s]);
  }
  for (let i = 0; i < 4; i++) {
    const [x, z] = spot(0.8),
      h = R(0.3, 0.5);
    stalks.push([x, 0.02 + h / 2, z, 0, 0, 0, 1, h, 1]);
    buds.push([x, 0.02 + h + 0.1, z, 0, 0, 0, 0.07, 0.16, 0.07]);
  }
  // (a petal is a small pointed leaf shape standing on its base, so that tipping it leans it outward from the flower's heart)
  const petalG = new THREE.SphereGeometry(1, 8, 6);
  petalG.translate(0, 1, 0);
  const pink = toon(0xf08ab0, { rim: 0.25 });
  many(petalG, pink, petals, true);
  many(new THREE.SphereGeometry(1, 8, 6), toon(0xf2c53a, { rim: 0.2 }), hearts);
  many(new THREE.CylinderGeometry(0.015, 0.015, 1, 5), toon(0x4a8a3c, { rim: 0 }), stalks);
  many(new THREE.SphereGeometry(1, 8, 6), pink, buds, true);
  // nobody walks through it
  SOLIDS.push({ x: PX, z: PZ, r: A - 0.1 });
}

// ---------- the demons' camp ----------
// Half way along the road a brute and three rakshasas stand over three prisoners, who sit bound to stakes beside it.
// The demons do nothing until a brother comes near or one of them is shot; then they all go for whichever brother is closest.
// Their blows cost health. Once they are all dead, walking up to a prisoner frees him: the ropes fall away and he stands.
// When all three are up they bow, and then walk to the hermitage.
const ROPE = toon(0xc9b27a, { rim: 0.1 }),
  EYEW = new THREE.MeshBasicMaterial({ color: 0xf2efe6 }),
  QI = new THREE.Quaternion(),
  TIED = {
    ...SITQ,
    spine: qe(0.1, 0, 0),
    head: qe(0.32, 0, 0),
    armL: qe(0.7, 0, -0.8),
    foreL: qe(-0.3, 0, 0),
    armR: qe(0.7, 0, 0.8),
    foreR: qe(-0.3, 0, 0),
  },
  STAND = { armL: qe(0.06, 0, -0.64), foreL: qe(-0.38, 0, 0), armR: qe(0.06, 0, 0.64), foreR: qe(-0.3, 0, 0) },
  PRISONERS = [],
  PRE = { armL: new THREE.Quaternion(), foreL: new THREE.Quaternion(), armR: new THREE.Quaternion(), foreR: new THREE.Quaternion() },
  PQ = new THREE.Quaternion(),
  PT = new THREE.Quaternion(),
  PV = V3(),
  PV2 = V3(),
  PV3 = V3(),
  PE = new THREE.Euler(),
  M0 = new THREE.Matrix4(),
  M1 = new THREE.Matrix4(),
  FLARE = { armL: qe(-0.35, 0, -0.3), foreL: qe(-1.3, 0, 0), armR: qe(-0.35, 0, 0.3), foreR: qe(-1.3, 0, 0) };
// a prisoner is a plain villager on the shared body: p.up runs from 0 (sitting bound) to 1 (standing free)
// Felling: he stands square to the trunk with the axe in both hands and swings it round from his right. Each stroke is drawn
// back slowly, comes round fast, bites, and rests a moment in the wood before the next. chopAt is where he is in the stroke,
// from 0 to 1 (it bites at CHOP_HIT)
const CHOP_HIT = 0.66,
  chopAt = (p) => (T * 0.85 + p.ph0) % 1;
function chopPose(p) {
  const u = chopAt(p),
    // how far round the axe is: 0 drawn right back, 1 in the wood
    k = u < 0.5 ? 1 - ease(u / 0.5) : u < CHOP_HIT ? Math.pow((u - 0.5) / (CHOP_HIT - 0.5), 2) : 1,
    tw = -1.15 + 1.45 * k,
    jolt = u > CHOP_HIT ? Math.max(0, 1 - (u - CHOP_HIT) / 0.08) * 0.06 : 0;
  return {
    spine: [0.16, tw * 0.4, 0],
    chest: [0.08, tw * 0.45, 0],
    head: [-0.1, -tw * 0.7, 0],
    armR: [-0.75 + 0.25 * (1 - k) - jolt, 0, 0.12],
    foreR: [-0.35 - 0.5 * (1 - k), 0, 0],
    armL: [-0.95 + 0.2 * (1 - k) - jolt, 0, -0.55],
    foreL: [-0.55 - 0.4 * (1 - k), 0, 0],
    legL: [-0.22, 0, 0.12],
    shinL: [0.35, 0, 0],
    legR: [0.1, 0, -0.12],
    shinR: [0.2, 0, 0],
  };
}
function pose(p) {
  const k = p.up * p.up * (3 - 2 * p.up);
  for (const n in TIED) p.rig.bone[n].quaternion.copy(TIED[n]).slerp(STAND[n] || QI, k);
  p.rig.bone.hips.position.y = SIT_Y + (REST.hips[2] - SIT_Y) * k;
  // walking: the brothers' own walk, faded in over his standing pose
  if (p.wk > 0.001) {
    // the brothers' walk, made brisker and looser for a man glad to be going: a slight lean into it, a fuller swing of the arms,
    // and the forearms hanging nearly straight instead of held bent out in front
    const W = walk(p.ph),
      sw = Math.sin(p.ph);
    W.spine[0] = p.lean;
    W.armL[0] = sw * p.swing;
    W.armR[0] = -sw * p.swing;
    W.foreL[0] = -0.12 - Math.max(0, -sw) * 0.4;
    W.foreR[0] = -0.12 - Math.max(0, sw) * 0.4;
    // hurrying, it becomes the brothers' run by as much as he is hurrying (p.rk): knees up, heels kicked back, elbows bent and
    // pumping, leaning into it, off the ground between steps. Without this a man going fast only walked faster, and slid
    if (p.rk > 0.001) {
      const Rn = run(p.ph);
      for (const n in Rn) {
        if (n[0] === '_') continue;
        const a = W[n] || (W[n] = [0, 0, 0]);
        for (let i = 0; i < 3; i++) a[i] += (Rn[n][i] - a[i]) * p.rk;
      }
      W._y += (Rn._y - W._y) * p.rk;
    }
    for (const n in W)
      if (p.rig.bone[n]) {
        PQ.setFromEuler(PE.set(W[n][0], W[n][1], W[n][2]));
        p.rig.bone[n].quaternion.slerp(PQ, p.wk);
      }
    p.rig.bone.hips.position.y += W._y * p.wk;
  }
  // at forced work: hoeing, bent over, both arms swinging the hoe; or bowed under a sack held on his shoulders
  if (p.jobW > 0.001) {
    const sw = Math.sin(T * 3.2 + p.ph0),
      J =
        p.job === 'dig'
          ? {
              spine: [0.5 + 0.12 * sw, 0, 0],
              chest: [0.2, 0, 0],
              head: [-0.25, 0, 0],
              armL: [-0.85 + 0.45 * sw, 0, -0.35],
              foreL: [-0.7 - 0.25 * sw, 0, 0],
              armR: [-0.85 + 0.45 * sw, 0, 0.35],
              foreR: [-0.7 - 0.25 * sw, 0, 0],
              legL: [-0.25, 0, 0.08],
              shinL: [0.5, 0, 0],
              legR: [-0.25, 0, -0.08],
              shinR: [0.5, 0, 0],
            }
          : p.job === 'chop'
            ? chopPose(p)
            : { spine: [0.32, 0, 0], head: [-0.1, 0, 0], armL: [-1.1, 0, -0.15], foreL: [-2.0, 0, 0], armR: [-1.1, 0, 0.15], foreR: [-2.0, 0, 0] };
    for (const n in J) {
      PQ.setFromEuler(PE.set(J[n][0], J[n][1], J[n][2]));
      p.rig.bone[n].quaternion.slerp(PQ, p.jobW);
    }
  }
  // arrived, he folds down cross-legged with his hands on his knees
  if (p.sit > 0) {
    const ks = p.sit * p.sit * (3 - 2 * p.sit),
      hy = p.rig.bone.hips.position;
    for (const n in SITQ) p.rig.bone[n].quaternion.slerp(SITQ[n], ks);
    hy.y += (SIT_Y - hy.y) * ks;
  }
  if (!p.nam) return;
  // namaste, once he is standing, done the way Vishwamitra's is: the hands are brought together at the heart, fingers up, head bowed
  const kn = p.nam * p.nam * (3 - 2 * p.nam);
  const B = p.rig.bone,
    rg = p.rig.group;
  rg.updateMatrixWorld(true);
  // the arms start the reach from a pose with the elbows lifted out to the sides, so they end up held away from the ribs
  for (const n of ARMS) {
    PRE[n].copy(B[n].quaternion);
    B[n].quaternion.copy(FLARE[n]);
  }
  rg.updateMatrixWorld(true);
  rg.worldToLocal(B.chest.getWorldPosition(PV));
  B.tgtL.position.set(PV.x + 0.03, PV.y + 0.06, PV.z + 0.2);
  B.tgtR.position.set(PV.x - 0.03, PV.y + 0.06, PV.z + 0.2);
  rg.updateMatrixWorld(true);
  p.ik.update();
  for (const n of ARMS) {
    PQ.copy(B[n].quaternion);
    B[n].quaternion.copy(PRE[n]).slerp(PQ, kn);
  }
  B.head.quaternion.multiply(PQ.setFromAxisAngle(PV.set(1, 0, 0), 0.22 * kn));
  rg.updateMatrixWorld(true);
  for (const [n, sx] of [
    ['handL', 1],
    ['handR', -1],
  ]) {
    // the hand is a flat blade (see below). It is turned so its length points up and a little forward and its flat faces the other hand.
    // Either flat face will do, so of the two ways round the one that turns the wrist least is used: too much roll wrings the wrist thin
    PV.set(sx * 0.7071, -0.7071, 0);
    M0.makeBasis(PV, PV2.set(0, 0, 1).cross(PV), PV3.set(0, 0, 1));
    PV.set(-sx * 0.08, 0.94, 0.33).normalize();
    PV2.set(1, 0, 0).cross(PV).normalize();
    M1.makeBasis(PV, PV2, PV3.crossVectors(PV, PV2));
    PQ.setFromRotationMatrix(M1.multiply(M0.transpose()));
    rg.getWorldQuaternion(PT).multiply(PQ);
    B[n].parent.getWorldQuaternion(PQ).invert().multiply(PT);
    PT.setFromAxisAngle(PV3.set(sx * 0.7071, -0.7071, 0), Math.PI);
    PT.premultiply(PQ);
    if (Math.abs(PT.w) > Math.abs(PQ.w)) PQ.copy(PT);
    B[n].quaternion.identity().slerp(PQ, kn);
  }
}
// job is what the demons have him doing: nothing (he sits bound to a stake), 'dig' (hoeing) or 'carry' (hauling sacks between two heaps)
// LOOK is who the next prisoners made are: nothing (villagers), 'brahmin' or 'mason'
let LOOK = null;
function prisoner(x, z, i, job, ends) {
  const g = new THREE.Group(),
    rig = makeRig(),
    tone = [0xb8733a, 0xa5683a, 0xc08a58][i % 3],
    skin = toon(tone, { vertexColors: true, rim: 0.3 }),
    sk = toon(tone, { rim: 0.3 }),
    // brahmins wear white or ochre; masons a dull working cloth, grey with stone dust
    cloth = toon(LOOK === 'brahmin' ? [0xf1ece0, 0xd9902e, 0xf1ece0][i % 3] : LOOK === 'mason' ? [0x8f8a80, 0x7d776c, 0x9a9488][i % 3] : [0xd9c9a3, 0xc9a25a, 0xe2ddd0][i % 3], { vertexColors: true }),
    hair = toon(i % 3 === 1 ? 0xb9b4ac : 0x1a1418, { rim: 0.2 }),
    look = LOOK;
  g.position.set(x, groundY(x, z), z);
  scene.add(g);
  g.add(rig.group);
  rig.group.scale.setScalar(0.95);
  const body = rig.skin(V.body.geometry, skin);
  // the shared body's hand is a round mitten: his are pressed flatter, more like an open palm
  for (const n of ['handL', 'handR']) rig.bone[n].scale.set(1, 1, 0.55);
  rig.skin(dhotiGeo, cloth);
  // a plain face, simpler than the brothers': the same skull and hairline, but only dots of white and dark for eyes, a button nose,
  // a line for a mouth and a bar for each brow. The three differ in hair: a knot, grey with a beard, and cropped
  const head = rig.on('head', new THREE.Group(), [0, 1.725, 0.012]);
  sph(head, 0.12, sk, [0, 0, 0], [0.98, 1.1, 1.02]);
  sph(head, 0.095, sk, [0, -0.07, 0.02], [0.98, 0.92, 1]);
  sph(head, 0.016, sk, [0, -0.03, 0.125], [1.1, 0.9, 0.9]);
  add(head, new THREE.BoxGeometry(0.04, 0.007, 0.01), DARK, [0, -0.082, 0.108]);
  for (const s of [-1, 1]) {
    sph(head, 0.021, EYEW, [s * 0.046, 0.012, 0.099], [1.25, 0.8, 0.5]);
    sph(head, 0.011, DARK, [s * 0.047, 0.011, 0.109], [1, 1, 0.5]);
    add(head, new THREE.BoxGeometry(0.052, 0.011, 0.012), hair, [s * 0.046, 0.046, 0.104], [0, s * -0.3, s * -0.1]);
    sph(head, 0.03, sk, [s * 0.115, -0.005, 0], [0.5, 1, 0.8]);
  }
  if (look === 'brahmin') {
    // a brahmin: the head shaved but for a tuft at the crown, three pale lines across the brow, and the sacred thread
    // over his left shoulder and across his chest
    sph(head, 0.035, hair, [0, 0.13, -0.07], [0.8, 1.5, 0.8]);
    add(head, new THREE.BoxGeometry(0.09, 0.022, 0.01), toon(0xf1ece0, { rim: 0 }), [0, 0.062, 0.107]);
    rig.on('chest', tor(new THREE.Group(), 0.2, 0.008, toon(0xf6f1e4, { rim: 0 }), [0, 0, 0], [0.25, 0, 0.75], [0.8, 1.25, 1]).parent, [0, 1.36, 0.01]);
  } else {
    add(head, new THREE.SphereGeometry(0.128, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.56), hair, [0, 0.012, -0.012], [-0.42, 0, 0], [1, 1.08, 1.04]);
    // (a mason ties a band of cloth round his head against the dust)
    if (look === 'mason') tor(head, 0.118, 0.022, cloth, [0, 0.05, -0.005], [Math.PI / 2 - 0.12, 0, 0], [1, 1.04, 1]).castShadow = false;
  }
  if (i % 3 !== 2 && look !== 'brahmin') sph(head, 0.04, hair, [0, 0.15, -0.06], [1, 0.9, 1]);
  if (i % 3 === 1) sph(head, 0.07, hair, [0, -0.125, 0.05], [1.05, 0.95, 0.8]);
  // bound: the stake he is tied to, and three turns of rope round his chest and the stake together.
  // (the stake stands in the ground, not on him, so it stays behind when he walks off)
  // At work: the thing he works with, which he drops when he is freed: a hoe in his hand, or a sack across his shoulders
  let ropes = [],
    stake = null,
    solid = null;
  if (!job) {
    stake = cyl(scene, 0.055, 0.07, 1.5, WOOD, [x, groundY(x, z) + 0.75, z - 0.27]);
    ropes = [0.36, 0.43, 0.5].map((y) => tor(g, 0.23, 0.016, ROPE, [0, y, -0.1], [Math.PI / 2, 0, 0], [1, 1.2, 1]));
    SOLIDS.push((solid = { x, z, r: 0.34 }));
  } else if (job === 'dig') {
    const hoe = new THREE.Group();
    cyl(hoe, 0.018, 0.02, 1.3, WOOD, [0, 0, 0.45], [Math.PI / 2, 0, 0]);
    add(hoe, new THREE.BoxGeometry(0.2, 0.26, 0.03), toon(0x55585e, { rim: 0.3 }), [0, -0.12, 1.08], [0.5, 0, 0]);
    rig.bone.handR.add(hoe);
    ropes = [hoe];
  } else if (job === 'chop') {
    // a mason dressing stone: a short heavy hammer
    const ham = new THREE.Group();
    cyl(ham, 0.02, 0.022, 0.8, WOOD, [0, 0, 0.3], [Math.PI / 2, 0, 0]);
    add(ham, new THREE.BoxGeometry(0.13, 0.22, 0.13), toon(0x55585e, { rim: 0.3 }), [0, 0, 0.68]);
    rig.bone.handR.add(ham);
    ropes = [ham];
  } else {
    // across his shoulders: a sack, or for a mason a cut block
    const sack =
      look === 'mason'
        ? rig.on('chest', add(new THREE.Group(), new THREE.BoxGeometry(0.62, 0.34, 0.36), ROCKM[0], [0, 0, 0]).parent, [0, 1.6, -0.14])
        : rig.on('chest', sph(new THREE.Group(), 0.3, toon(0xb39a6a, { rim: 0.1 }), [0, 0, 0], [1.15, 0.8, 0.8]).parent, [0, 1.56, -0.16]);
    ropes = [sack];
  }
  const ik = new CCDIKSolver(body, [
      { target: BI.tgtL, effector: BI.handL, links: [{ index: BI.foreL }, { index: BI.armL }], iteration: 12 },
      { target: BI.tgtR, effector: BI.handR, links: [{ index: BI.foreR }, { index: BI.armR }], iteration: 12 },
    ]),
    p = {
      g,
      rig,
      ropes,
      ik,
      up: job ? 1 : 0,
      nam: 0,
      free: false,
      job,
      jobW: job ? 1 : 0,
      ph0: Math.random() * 6.28,
      ends,
      leg: 0,
      hold: 0,
      go: false,
      look,
      wk: job === 'carry' ? 1 : 0,
      sit: 0,
      // no two walk alike: each sets off a little after the last, at his own pace, out of step, with his own swing and lean
      ph: Math.random() * 6.28,
      wait: [0, 0.9, 0.4][i % 3],
      pace: [2.5, 2.2, 2.7][i % 3],
      swing: [0.65, 0.45, 0.8][i % 3],
      lean: [0.08, 0.13, 0.04][i % 3],
      // his way to the hermitage (for the bound ones by the road; the others' is worked out when they are freed): onto the road,
      // along it to the sage's house, and to his own place on the grass in front of it
      path: job ? [] : [[x + 2.5, roadZ(x + 2.5) + (i - 1) * 0.7], [-48, roadZ(-48) + (i - 1) * 0.7], VSEATS[i]],
    };
  p.stake = stake;
  p.solid = solid;
  pose(p);
  PRISONERS.push(p);
  return p;
}
// ---------- the camps ----------
// There are three. The first is the one by the road, where the prisoners sit bound. In the other two, each outside the fork
// of the rivers and beyond a crossing, the demons have their prisoners at work, hoeing or hauling sacks, by a fire.
// Every camp works the same way: its demons stand idle until a brother comes near or one of them is hurt, then all go for whichever
// brother is closest; once they are dead its prisoners can be freed, and those bow and walk to the hermitage to sit before the houses.
SPAWN_MAX = 40;
const CAMPS = [],
  apart = (a, b) => Math.hypot(a.x - b.x, a.z - b.z),
  // Places to sit: on the ground in front of the wood store, in a loose half circle two deep round the open space before it,
  // as people sit who have not been told where to. Each is a little out of line with its neighbours, nearer or further and to
  // one side (by amounts that are fixed, so a man's seat is the same every time). They are taken in turn as men are freed
  VFOCUS = [WOODSHED[0] + 3 * Math.sin(WOODSHED[2]), WOODSHED[1] + 3 * Math.cos(WOODSHED[2])],
  VSEATS = Array.from({ length: 16 }, (_, i) => {
    const row = i % 2,
      wob = (n) => Math.sin(i * 12.9898 + n * 78.233) * 43758.5453,
      j = (n) => wob(n) - Math.floor(wob(n)) - 0.5,
      a = WOODSHED[2] - 1.15 + (Math.floor(i / 2) + row * 0.5) * 0.3 + j(1) * 0.1,
      r = 3.3 + row * 1.6 + j(2) * 0.5;
    return [VFOCUS[0] + r * Math.sin(a), VFOCUS[1] + r * Math.cos(a)];
  });
// (the first three are taken by the men from the camp by the road)
let seatsTaken = 3,
  bSeat = 0,
  mSeat = 0;
// the brahmins' places: close round the fire, either side of Vishwamitra and across from him, clear of where the brothers sit
// (the sage has the north side of the fire; the three brahmins take the east, the west and the south)
const BSEATS = [
  [2.7, 0],
  [-2.7, 0],
  [0, 2.7],
];
// the way from where a man stands to his seat: straight there, unless that would take him across the altar, when he goes round it.
// A camp outside the fork gives the first part of the way itself: to its crossing, over it, and in
function route(P, seat) {
  const dx = seat[0] - P.x,
    dz = seat[1] - P.z,
    t = Math.max(0, Math.min(1, -(P.x * dx + P.z * dz) / (dx * dx + dz * dz))),
    cx = P.x + dx * t,
    cz = P.z + dz * t,
    d = Math.hypot(cx, cz);
  return d < 9 ? [d > 0.5 ? [(cx / d) * 11.5, (cz / d) * 11.5] : [-dz > 0 ? 11.5 : -11.5, 0], seat] : [seat];
}
// a camp: where it is, which demons [kind, dx, dz] guard it, and its prisoners, already made
function camp(x, z, guards, prisoners, watch) {
  const c = { x, z, prisoners, roused: false, thanked: false, first: !CAMPS.length };
  c.guards = guards.map(([kind, dx, dz]) => {
    const d = spawn(0, kind, V3(x + dx, 0, z + dz));
    // until roused he stands watching the prisoners
    d.wait = true;
    d.to = watch;
    d.onHit = () => {
      const h = d.foe;
      if (!h) return;
      const hp = h.group.position;
      if (Math.hypot(hp.x - d.g.position.x, hp.z - d.g.position.z) > d.rng + 0.8) return;
      const [lo, hi] = d.def.dmg;
      h.hp = Math.max(0, h.hp - Math.round(lo + Math.random() * (hi - lo)));
      heroHit(h, d.g.position.x, d.g.position.z);
      puff(tmpA.set(hp.x, 1.2, hp.z), 0xff6a50, 12, 2.6, 0.3, 2);
    };
    return d;
  });
  CAMPS.push(c);
  return c;
}
// the first camp
{
  const HELD = V3(CAMP.x, 0, CAMP.z - 3.6);
  camp(
    CAMP.x,
    CAMP.z,
    [
      ['brute', 6.5, 0.4],
      ['grunt', -4, -1.6],
      ['grunt', 3.4, -2.0],
      ['grunt', -0.5, 2.8],
    ],
    [-1.6, 0, 1.6].map((dx, i) => prisoner(CAMP.x + dx, HELD.z + (i === 1 ? -0.4 : 0), i)),
    HELD,
  );
}
// a demon camp beyond a river: pitched, not built. One hide tent on the far side from the way the brothers come (open is that
// direction, as an angle) and a fire.
//   the masons' camp is a stone yard: boulders dragged in, standing slabs the masons dress with hammers, and cut blocks
//   carried across the yard from one heap to another
//   the brahmins' camp is a larder: they sit bound to stakes in a row before a great black pot on the fire
function workCamp(x, z, guards, jobs, open) {
  const hide = toon(0x4a3524, { rim: 0.08 }),
    stakeM = toon(0x3a2a1c, { rim: 0.05 }),
    A = [x - 5, z + 4.5],
    B = [x + 4.5, z + 5.5],
    mason = LOOK === 'mason',
    // (everything in the camp stands on its level pad, at the height the land has there)
    G = new THREE.Group();
  G.position.y = groundY(x, z);
  scene.add(G);
  // It is a camp pitched for a few days, not a place built: one hide tent and a fire. All of that (K) is
  // what the demons would carry off with them; KS is what of it stands in the way
  const back = open + Math.PI,
    K = new THREE.Group(),
    KS = [],
    FL = [];
  G.add(K);
  // the tent: a low cone of dark hide with a black mouth, facing the fire
  // (the masons' camp has none: there the demons sleep on the ground among the stone)
  for (const s of mason ? [] : [-1]) {
    const a = back + s * 1.3,
      tx = x + Math.cos(a) * 7,
      tz = z + Math.sin(a) * 7,
      TENT = new THREE.Group();
    TENT.position.set(tx, 0, tz);
    TENT.rotation.y = Math.atan2(x - tx, z - tz);
    K.add(TENT);
    TENT.scale.setScalar(0.85);
    add(TENT, new THREE.ConeGeometry(2, 3, 7), hide, [0, 1.5, 0], [0, Math.PI / 7, 0]);
    add(TENT, new THREE.ConeGeometry(0.75, 1.7, 3), DARK, [0, 0.85, 1.42], [-0.5, Math.PI, 0], [1, 1, 0.3]).castShadow = false;
    cyl(TENT, 0.03, 0.03, 0.9, WOOD, [0, 3.2, 0], [0.2, 0, 0.15]);
    cyl(TENT, 0.03, 0.03, 0.9, WOOD, [0, 3.2, 0], [-0.15, 0, -0.25]);
    KS.push({ x: tx, z: tz, r: 1.55 });
  }
  // the fire in its ring of stones
  for (let i = 0; i < 9; i++)
    add(G, new THREE.DodecahedronGeometry(0.2, 0), ROCKM[i % 2], [x + Math.cos(i * 0.7) * 0.85, 0.1, z + Math.sin(i * 0.7) * 0.85], [i, i * 2, 0]);
  // The flame is made as the altar's is, only small: three sheets one inside another, red-orange outside and pale yellow at
  // the heart, each see-through and adding its light to what is behind it, and each growing from its foot. (Under the
  // brahmins' pot it is kept low)
  const fk = mason ? 1 : 0.55;
  for (const [r, h, c] of [
    [0.3, 0.95, 0xff5a10],
    [0.21, 0.7, 0xffa020],
    [0.12, 0.46, 0xffe070],
  ]) {
    const m = new THREE.Mesh(
      new THREE.ConeGeometry(r * fk, h * fk, 10, 4),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    m.geometry.translate(0, (h * fk) / 2, 0);
    m.position.set(x, 0.1, z);
    K.add(m);
    FL.push(m);
  }
  const fl = glow(0xffb040, mason ? 1.3 : 1.0);
  fl.position.set(x, mason ? 0.6 : 0.35, z);
  K.add(fl);
  SOLIDS.push({ x, z, r: mason ? 1 : 1.5 });
  let men;
  if (mason) {
    // boulders dragged in from the river, waiting to be split
    for (const [dx, dz, r] of [
      [-6, -7, 1.3],
      [-4.2, -8.2, 0.95],
    ]) {
      add(G, new THREE.DodecahedronGeometry(r, 0), ROCKM[(r * 10) & 1], [x + dx, r * 0.55, z + dz], [dx, dz, r]);
      SOLIDS.push({ x: x + dx, z: z + dz, r: r * 0.9 });
    }
    // cut blocks stacked at either end of the carriers' walk
    for (const [hx, hz] of [A, B])
      for (let i = 0; i < (hx === A[0] ? 2 : 1); i++) add(G, new THREE.BoxGeometry(0.8, 0.42, 0.5), ROCKM[i % 2], [hx + (i ? 0.2 : 0), i ? 0.63 : 0.21, hz - 1.1], [0, i * 0.2, 0]);
    let cut = 0,
      haul = 0;
    men = jobs.map((job, i) => {
      if (job !== 'chop') return prisoner(A[0] + 1 + haul * 2.4, A[1] + 0.4 * haul++, CAMPS.length + i, 'carry', haul % 2 ? [A, B] : [B, A]);
      // one standing slab, and the two masons at it with their hammers, one on either side
      const sx = x - 0.7,
        far = cut++ > 0;
      if (!far) {
        add(G, new THREE.BoxGeometry(0.8, 1.35, 0.42), ROCKM[1], [sx, 0.66, z - 5.6], [0, 0.12, 0.03]);
        SOLIDS.push({ x: sx, z: z - 5.6, r: 0.5 });
      }
      const m = prisoner(sx + (far ? -0.15 : 0.15), z - 5.6 + (far ? -0.85 : 0.85), CAMPS.length + i, 'chop');
      m.g.rotation.y = far ? 0 : Math.PI;
      m.slab = [sx, z - 5.6];
      return m;
    });
  } else {
    // the pot: black, wide-mouthed, sitting on the fire, with something pale simmering in it
    const pot = toon(0x1c1a1c, { rim: 0.25 });
    add(K, new THREE.SphereGeometry(0.9, 24, 14, 0, Math.PI * 2, Math.PI * 0.32, Math.PI * 0.68), pot, [x, 1.15, z]);
    tor(K, 0.79, 0.08, pot, [x, 1.62, z], [Math.PI / 2, 0, 0]);
    add(K, new THREE.CircleGeometry(0.75, 24), toon(0x8a7d5c, { rim: 0 }), [x, 1.58, z], [-Math.PI / 2, 0, 0]).castShadow = false;
    // (three legs of stone hold it over the flames)
    for (let i = 0; i < 3; i++) add(G, new THREE.BoxGeometry(0.3, 0.7, 0.3), ROCKM[i % 2], [x + Math.cos(i * 2.1 + 0.5) * 0.85, 0.3, z + Math.sin(i * 2.1 + 0.5) * 0.85]);
    // firewood for it, stacked to one side
    for (let i = 0; i < 6; i++) cyl(K, 0.11, 0.11, 1.5, WOOD, [x + 4.3, 0.11 + ((i / 3) | 0) * 0.21, z + 3 + (i % 3) * 0.23 + ((i / 3) | 0) * 0.11], [0, 0, Math.PI / 2]);
    // the brahmins: bound to stakes in a row, facing the pot
    men = jobs.map((_, i) => {
      const m = prisoner(x + (i - (jobs.length - 1) / 2) * 1.9, z - 3.7 - (i === 1 ? 0.4 : 0), CAMPS.length + i);
      m.path = [];
      return m;
    });
  }
  SOLIDS.push(...KS);
  const c = camp(x, z, guards, men, V3(x, 0, z - 4));
  c.kit = K;
  c.kitS = KS;
  // (its flames, and the glow about them, for the flicker)
  c.flames = FL;
  c.glow = fl;
  c.glow0 = fl.scale.x;
  return c;
}
// the masons' camp: past the east crossing, a little north of the road
LOOK = 'mason';
workCamp(
  ...WORK[0],
  [
    ['brute', -4, 0.5],
    ['grunt', 3.5, 2],
    ['grunt', 2, -2.5],
    ['pish', -1.5, 3.2],
  ],
  ['chop', 'carry', 'chop'],
  Math.PI / 2,
).via = [
  [100, 1.5],
  [90, 0],
  [62, 0.3],
  [42, -0.5],
];
// the brahmins' camp: beyond the south crossing, down the far bank of the west arm, the most strongly held
LOOK = 'brahmin';
workCamp(
  ...WORK[1],
  [
    ['brute', 4, 1],
    ['grunt', -3.5, -1],
    ['grunt', 0.5, 3.4],
    ['pish', -2, 3],
    ['pish', 2.6, -2.6],
  ],
  [0, 0, 0],
  Math.atan2(-8, 17),
).via = [
  [-9, 62],
  [0.4, 54.2],
  [0.2, 31],
];
LOOK = null;
// The two far camps are not there on the first day. They are made with everything else, then put away: nothing of them is
// drawn, their guards sleep, and nothing of theirs stands in anyone's way. On the second morning (see nightUpdate) they are
// brought out, and the woodcutter comes with word of them
function campHide(c) {
  c.late = true;
  if (c.kit) c.kit.visible = false;
  c.hid = [...(c.kitS || []), ...c.prisoners.map((q) => q.solid)].filter((q) => q && SOLIDS.includes(q));
  for (const q of c.hid) SOLIDS.splice(SOLIDS.indexOf(q), 1);
  for (const q of c.prisoners) {
    q.g.visible = false;
    if (q.stake) q.stake.visible = false;
  }
  for (const d of c.guards) {
    d.asleep = true;
    d.g.visible = false;
  }
}
function campShow(c) {
  if (!c.late) return;
  c.late = false;
  if (c.kit) c.kit.visible = true;
  SOLIDS.push(...c.hid);
  for (const q of c.prisoners) if (q.stake) q.stake.visible = true;
}
for (const c of CAMPS) if (!c.first) campHide(c);
function campUpdate(dt) {
  const me = SEL.group.position;
  for (const c of CAMPS) {
    if (c.gone || c.late) continue;
    // the camp's fire: its three sheets of flame leap and lean as the altar's do, and the glow about it breathes with them
    if (c.flames) {
      c.flames.forEach((m, i) => {
        m.scale.set(1 + 0.08 * Math.sin(T * 7 + i * 2 + c.x), 1 + 0.16 * Math.sin(T * (9 + i * 2.3) + i + c.x) + 0.09 * Math.sin(T * (17.3 + i * 3.1)), 1 + 0.08 * Math.cos(T * 6.1 + i));
        m.rotation.z = Math.sin(T * 3.1 + i * 1.7) * 0.07;
        m.rotation.x = Math.cos(T * 2.6 + i * 2.2) * 0.06;
      });
      c.glow.scale.setScalar(c.glow0 * (1 + 0.07 * Math.sin(T * 8) + 0.04 * Math.sin(T * 13.7)));
    }
    const live = c.guards.filter((d) => grunts.includes(d) && !d.dead),
      far = apart(me, c) > 62;
    if (!c.roused)
      c.roused =
        live.length < c.guards.length ||
        live.some((d) => d.hp < d.hp0 || d.wob > 0.2) ||
        // (at the first camp, the guards do not notice the brothers until the prisoners' cry has been heard out)
        ((!c.first || c.seen) && HEROES.some((h) => apart(h.group.position, c) < 16));
    for (const d of live) {
      // far off and still idle, a guard is put to sleep and hidden: he costs nothing until someone comes
      d.asleep = far && !c.roused;
      d.g.visible = !d.asleep;
      if (!c.roused) continue;
      let foe = HEROES[0];
      for (const h of HEROES) if (apart(h.group.position, d.g.position) < apart(foe.group.position, d.g.position)) foe = h;
      d.wait = false;
      d.foe = foe;
      d.to = foe.group.position;
      // near enough to club or claw a man, not the long reach they keep from the altar fire
      d.rng = d.br ? 2.3 : d.pi ? 1.3 : 1.5;
    }
    // at the first camp, the moment the brothers come in sight of it, the prisoners cry out and a guard answers them; only after
    // that does rescuing them become an objective
    if (c.first && !c.cried && !talking() && HEROES.some((h) => apart(h.group.position, c) < 15)) {
      c.cried = true;
      // (nobody moves while it is said)
      LOCK = true;
      const g = live.find((d) => !d.br) || live[0],
        p = c.prisoners;
      say(
        [
          { who: 'Villager', face: snap(p[0].rig.bone.head, p[0].g.rotation.y, null), text: 'Please, let us go!' },
          { who: 'Rakshasa', face: g && g.rig.bone.head ? snap(g.rig.bone.head, g.g.rotation.y, null) : '', text: 'Shut up, dinner!' },
          { who: 'Villager', face: snap(p[p.length - 1].rig.bone.head, p[p.length - 1].g.rotation.y, null), text: 'Help!' },
        ],
        () => {
          c.seen = true;
          LOCK = false;
        },
      );
    }
    const allUp = c.prisoners.every((p) => p.free && p.up >= 1);
    // at the first camp, the moment the last of them is on his feet they thank the brothers. Nobody moves until it has been said
    if (c.first && allUp && !c.thanked) {
      c.thanked = true;
      const f = c.prisoners.map((p) => snap(p.rig.bone.head, p.g.rotation.y, null));
      LOCK = true;
      say(
        [
          { who: 'Villager', face: f[0], text: 'You came! We thought no one would.' },
          { who: 'Elder', face: f[1], text: 'We cut wood for the sage Vishwamitra. They took us at dawn, out among the trees. Bless you both.' },
          { who: 'Rama', face: photo(RAMA), text: 'Then go back to your work, friends. His fire must burn through the night.' },
          // (all of them together, as they turn to go)
          { who: 'Villagers', face: f[f.length - 1], text: 'Jai Shree Ram!' },
        ],
        () => {
          LOCK = false;
          c.rescued = true;
        },
      );
    }
    // with the demons dead, the bound ones are freed one by one as a brother reaches each; the workers all at once, as soon as one comes near
    if (!live.length) {
      const near = (p, r) => HEROES.find((o) => apart(o.group.position, p.g.position) < r),
        saviour = c.prisoners.map((p) => (p.job ? near(p, 7) : null)).find(Boolean);
      for (const p of c.prisoners) {
        const h = p.free ? null : p.job ? saviour : near(p, 2.6);
        if (!h) continue;
        p.free = true;
        p.by = h;
        // the ropes fall away, or he lets drop what he was made to carry
        p.ropes.forEach((o) => o.parent.remove(o));
        puff(tmpA.set(p.g.position.x, 0.5, p.g.position.z), 0xe8d8a8, 16, 2, 0.5, 2);
      }
    }
    // at the other camps too, once all are on their feet, they speak before they go
    if (!c.first && allUp && !c.thanked && !talking()) {
      c.thanked = true;
      const f = c.prisoners.map((p) => snap(p.rig.bone.head, p.g.rotation.y, null)),
        mason = c.prisoners[0].look === 'mason';
      LOCK = true;
      say(
        mason
          ? [
              { who: 'Mason', face: f[0], text: 'They had us cutting stone for a wall to their king. Not one block more.' },
              { who: 'Old mason', face: f[1], text: 'These hands have raised temples, prince. And this is what they paid us in. Take it. It is better spent on your fire.' },
              { who: 'Rama', face: photo(RAMA), text: 'Go to the hermitage. There will be work worth your hands.' },
              { who: 'Masons', face: f[f.length - 1], text: 'Jai Shree Ram!' },
            ]
          : [
              { who: 'Brahmin', face: f[0], text: 'The pot was already on the fire. Another hour and you would have found bones.' },
              { who: 'Old brahmin', face: f[1], text: 'Live long, sons of Dasharatha. We will sit at the sage’s fire and chant till dawn. But first, a blessing on your bow. Choose.' },
              { who: 'Rama', face: photo(RAMA), text: 'Go to Vishwamitra. Keep the rite. We will keep the night.' },
              { who: 'Brahmins', face: f[f.length - 1], text: 'Jai Shree Ram!' },
            ],
        () => {
          if (mason) {
            // the masons' pay, handed over at once: coins from each of them to the counter
            LOCK = false;
            c.rescued = true;
            for (let i = 0; i < MASON_GIFT; i++) {
              const q = c.prisoners[i % c.prisoners.length].g.position;
              coinToCounter(tmpB.set(q.x, q.y + 1.2, q.z), 1, i * 0.07);
            }
          } else
            // the brahmins' blessing: one of three, his to choose (the level stays held until he has)
            boonPick(() => {
              LOCK = false;
              c.rescued = true;
            });
        },
      );
    }
    for (const p of c.prisoners) {
      const P = p.g.position;
      P.y = groundY(P.x, P.z);
      if (!p.free) {
        // still at work. Out of sight he is hidden and left alone
        p.g.visible = !far;
        if (far || !p.job) continue;
        if (p.job === 'carry') {
          const w = p.ends[p.leg],
            dx = w[0] - P.x,
            dz = w[1] - P.z,
            l = Math.hypot(dx, dz) || 1;
          if (l < 0.6) p.leg ^= 1;
          P.x += (dx / l) * 0.85 * dt;
          P.z += (dz / l) * 0.85 * dt;
          p.ph += (0.85 * dt) / 0.36;
          const want = Math.atan2(dx, dz);
          p.g.rotation.y += Math.atan2(Math.sin(want - p.g.rotation.y), Math.cos(want - p.g.rotation.y)) * Math.min(1, dt * 3);
        }
        // each hammer blow knocks chips from the slab
        if (p.slab) {
          const u = chopAt(p);
          if (p.hitU < CHOP_HIT && u >= CHOP_HIT) puff(tmpA.set(p.slab[0], P.y + 1.05, p.slab[1] + 0.3), 0xb9bcc2, 7, 2.2, 0.35, 5, 0.15);
          p.hitU = u;
        }
        pose(p);
        continue;
      }
      p.g.visible = true;
      // the stake he was tied to: once he has walked off it sinks slowly into the ground and is gone, and no longer bars the way
      if (p.stake && p.go) {
        p.stake.position.y -= dt * 0.55;
        if ((p.stakeT = (p.stakeT || 0) + dt) > 3) {
          scene.remove(p.stake);
          p.stake = null;
          const i = SOLIDS.indexOf(p.solid);
          if (i >= 0) SOLIDS.splice(i, 1);
        }
      }
      // freed: first he gets to his feet (or straightens from his work); only when all of that camp are standing do they bow together.
      // They hold the bow a moment (at the first camp, while they give their thanks), then lower their hands and walk to
      // Vishwamitra's hermitage, where they sit down facing the fire
      p.up = Math.min(1, p.up + dt / 0.45);
      if (p.wood || p.mason) woodNight(p);
      if (p.wood || p.mason) p.jobW += (((p.wood || p.mason).bent ? 1 : 0) - p.jobW) * Math.min(1, dt * 5);
      else p.jobW = Math.max(0, p.jobW - dt / 0.4);
      let want;
      if (!p.go) {
        p.wk = Math.max(0, p.wk - dt * 4);
        // (freed in the middle of a demon's camp, nobody lingers: a quick bow, a short moment held, and away. The bow took 0.7 and
        // was held 0.8 at the first camp and 1.6 at the others, with up to 0.9 more between one man and the next)
        if (allUp) p.nam = Math.min(1, p.nam + dt / 0.45);
        if (p.nam >= 1 && !talking() && (p.hold += dt) > (c.first ? 0.5 : 0.7) + p.wait * 0.5) {
          p.go = true;
          // (and he hurries all the way to where he is going: see `hur` below)
          p.hurry = true;
          // the men from the camp by the road are the sage's woodcutters: they walk home along the road and go straight back to work
          if (c.first && !p.wood) {
            toWood(p, woodN++);
            p.path = [...p.path.slice(0, -1), p.wood.home];
          }
          if (!p.path.length) {
            // (out by the camp's own way to its crossing and in, then on to his seat)
            const via = c.via || [],
              from = via.length ? { x: via[via.length - 1][0], z: via[via.length - 1][1] } : P;
            // (any other freed villager goes straight to gathering wood)
            // The brahmins come to Vishwamitra's fire and sit close round it. The masons go to their yard beyond the top right house.
            if (p.look === 'brahmin') p.path = [...via, ...route(from, BSEATS[bSeat++ % BSEATS.length])];
            else if (p.look === 'mason') {
              // (the masons go straight back to their yard and take up the work where it was left)
              p.stand = true;
              toStone(p, mSeat++);
              p.path = [...via, ...route(from, p.mason.spot)];
            } else {
              toWood(p, woodN++);
              p.path = [...via, ...route(from, p.wood.home)];
            }
          }
        }
        // on his feet he turns to whoever freed him
        const q = p.by.group.position;
        want = Math.atan2(q.x - P.x, q.z - P.z);
      } else {
        p.nam = Math.max(0, p.nam - dt / 0.4);
        const w = p.path[0],
          // (seated, wherever he sits, he faces the fire)
          dx = w ? w[0] - P.x : -P.x,
          dz = w ? w[1] - P.z : -P.z,
          l = Math.hypot(dx, dz) || 1,
          // (nobody walks on while someone is speaking)
          moving = w && p.nam <= 0 && p.sit <= 0 && !talking();
        // one given somewhere new to go while sitting gets up first
        if (w) p.sit = Math.max(0, p.sit - dt / 0.6);
        // he walks the way he is facing and turns gradually toward the next point, so a corner is a curve, not a pivot.
        // A point on the way counts as reached from three paces off, which starts the turn early; only the last is walked right up to,
        // and he slows over the final stretch so he does not circle it
        const last = p.path.length === 1;
        if (w && l < (last ? 0.4 : 3)) p.path.shift();
        p.wk += ((moving ? 1 : 0) - p.wk) * Math.min(1, dt * 5);
        if (moving) {
          // (hurrying away from the camp he was held in: the working men at close to twice their walk, the brahmins at half as
          // fast again, and never faster than a man can run. It lasts until he reaches where he was going)
          const hur = p.hurry ? (p.look === 'brahmin' ? 1.35 : 1.6) : 1,
            v = (p.dash ? 5.2 : Math.min(p.pace * hur, 5.2)) * p.wk * (last ? Math.min(1, 0.35 + l / 2.5) : 1) * dt,
            a = p.g.rotation.y;
          P.x += Math.sin(a) * v;
          P.z += Math.cos(a) * v;
          // (a longer stride with it, so the legs are not a blur)
          // (how much of a run it is: the messenger flat out, the working men most of the way, the old brahmins a jog; and the
          // same for the dash to the houses at nightfall. The ground covered by one stride grows with it, so the feet keep
          // their grip on the ground)
          const home = ((p.wood || p.mason) || {}).s === 'home',
            rkTo = p.dash ? 1 : p.hurry || home ? (p.look === 'brahmin' ? 0.55 : 0.8) : 0;
          p.rk = (p.rk || 0) + (rkTo - (p.rk || 0)) * Math.min(1, dt * 5);
          p.ph += v / (0.45 + 0.07 * p.rk);
        }
        want = Math.atan2(dx, dz);
        // (with something between him and the next point of his way, he goes round it. The end of the way may itself be
        // hard by a tree or a wall, so the last stretch of the line is not counted as blocked)
        p.via = false;
        if (moving) {
          const A = navAim(P, w[0], w[1], 1.8);
          if ((p.via = A.via)) want = Math.atan2(A.x - P.x, A.z - P.z);
        }
        if (!w && p.mason && p.mason.s === 'work') want = Math.atan2(p.mason.spot[2].x - P.x, p.mason.spot[2].z - P.z);
        // (at his tree he faces it)
        if (!w && p.wood && p.wood.s !== 'drop' && p.wood.s !== 'fetch') want = Math.atan2(p.wood.spot[2].x - P.x, p.wood.spot[2].z - P.z);
        if (!w) p.hurry = false;
        if (!moving) p.rk = Math.max(0, (p.rk || 0) - dt * 4);
        if (!w && p.wk < 0.05) {
          if (p.wood) woodStep(p, dt);
          else if (p.mason) stoneStep(p, dt);
          else if (p.stand) p.sit = 0;
          else p.sit = Math.min(1, p.sit + dt / 0.9);
        }
      }
      pose(p);
      p.g.rotation.y +=
        Math.atan2(Math.sin(want - p.g.rotation.y), Math.cos(want - p.g.rotation.y)) *
        Math.min(1, dt * (p.go ? (p.path.length === 1 || p.via ? 5 : p.hurry ? 3.4 : 2.2) : 3)) *
        p.up;
    }
  }
}

// ---------- gathering wood ----------
// A man set to gather wood does not sit down again. He walks out to one of the trees nearest the wood store, bends and
// chops for a while with an axe he took up at the store, straightens with a bundle across his shoulders, carries it back to the store, puts it down,
// and goes out again to another place, for as long as the level lasts
const STICK = [toon(0x7a4a22, { rim: 0.1 }), toon(0x8a5a2c, { rim: 0.1 })],
  AXEM = toon(0x55585e, { rim: 0.3 });
let woodN = 0,
  FELL;
// Where the men cut. The trees nearest the wood store (the nearest two, and up to two more if they are close by), and before
// any of them a tree already down: a felled trunk lying by its stump at the forest's edge, between the store and the nearest
// standing tree. The first man works at that; men at the same tree stand on different sides of it
FELL = [...WOODS, ...TREES]
  .sort((a, b) => Math.hypot(a.x - WOODSHED[0], a.z - WOODSHED[1]) - Math.hypot(b.x - WOODSHED[0], b.z - WOODSHED[1]))
  .filter((t, k) => k < 2 || Math.hypot(t.x - WOODSHED[0], t.z - WOODSHED[1]) < 24)
  .slice(0, 4);
{
  const n = FELL[0],
    l = Math.hypot(WOODSHED[0] - n.x, WOODSHED[1] - n.z) || 1,
    // (toward the store from that tree, and as far as it takes to lie clear of every other trunk)
    dx = (WOODSHED[0] - n.x) / l,
    dz = (WOODSHED[1] - n.z) / l,
    clear = (x, z) => [...WOODS, ...TREES].every((t) => Math.hypot(t.x - x, t.z - z) > 3.2),
    d = [4, 5.5, 7, 8.5].find((d) => clear(n.x + dx * d, n.z + dz * d)) || 4,
    x = n.x + dx * d,
    z = n.z + dz * d,
    // it lies across the way to the store, a little askew
    yaw = Math.atan2(dx, dz) + Math.PI / 2 + 0.25,
    ux = Math.sin(yaw + Math.PI / 2),
    uz = Math.cos(yaw + Math.PI / 2),
    g = new THREE.Group(),
    BARK = toon(0x6a4a30, { rim: 0.1 }),
    CUT = toon(0xd8b888, { rim: 0.1 });
  g.position.set(x, groundY(x, z), z);
  g.rotation.y = yaw;
  scene.add(g);
  // the trunk, thick end toward the stump, resting on the ground; its cut end pale
  cyl(g, 0.33, 0.24, 5.6, BARK, [0.5, 0.31, 0], [0, 0, Math.PI / 2]);
  cyl(g, 0.3, 0.3, 0.03, CUT, [-2.31, 0.31, 0], [0, 0, Math.PI / 2]);
  // the stump it came from, a pace off, cut pale across the top, with a few chips about it
  cyl(g, 0.36, 0.42, 0.5, BARK, [-3.3, 0.25, 0.35]);
  cyl(g, 0.33, 0.33, 0.03, CUT, [-3.3, 0.51, 0.35]);
  for (let i = 0; i < 7; i++) add(g, new THREE.BoxGeometry(0.12, 0.02, 0.07), CUT, [-3.3 + R(-0.9, 0.9), 0.02, 0.35 + R(-0.9, 0.9)], [0, R(0, 6), 0]);
  // the stubs of its boughs, lopped short
  cyl(g, 0.05, 0.08, 1.1, BARK, [1.3, 0.75, 0.15], [0.35, 0, -0.5]);
  cyl(g, 0.045, 0.07, 0.9, BARK, [2.2, 0.6, -0.3], [-0.9, 0, -0.3]);
  cyl(g, 0.04, 0.06, 0.8, BARK, [0.2, 0.62, -0.28], [-0.8, 0, 0.4]);
  for (const o of [-1.6, -0.5, 0.6, 1.7, 2.8]) SOLIDS.push({ x: x + ux * o, z: z + uz * o, r: 0.42 });
  // (as a place to cut: low marks that the axe bites near the ground; ax is the way it lies, side the store's side of it)
  FELL.unshift({ x, z, s: 0.4, low: true, ax: [ux, uz], side: [dx, dz] });
}
// (tree: the tree itself, or the point on the fallen trunk, so that he can face it)
const woodSpot = (i) => {
  const t = FELL[i % FELL.length];
  if (t.low) {
    // at the fallen trunk he stands beside it, somewhere along its length, on the store's side
    const o = R(-1.4, 2.2),
      px = t.x + t.ax[0] * o,
      pz = t.z + t.ax[1] * o;
    return [px + t.side[0] * 0.9, pz + t.side[1] * 0.9, { x: px, z: pz, low: true }];
  }
  const a = Math.atan2(WOODSHED[0] - t.x, WOODSHED[1] - t.z) + R(-0.9, 0.9),
    d = 0.75 + 0.45 * t.s;
  return [t.x + Math.sin(a) * d, t.z + Math.cos(a) * d, t];
};
function toWood(p, i) {
  // the bundle he will carry: a handful of sticks across his shoulders, unseen until he has gathered it
  const b = new THREE.Group();
  for (let k = 0; k < 6; k++) cyl(b, 0.022, 0.03, R(0.85, 1.1), STICK[k % 2], [R(-0.05, 0.05), (k % 3) * 0.05, (k % 2) * 0.06 - 0.03], [0, R(-0.12, 0.12), Math.PI / 2 + R(-0.08, 0.08)]);
  p.rig.on('chest', b, [0, 1.6, -0.15]);
  b.visible = false;
  // and the axe he takes up at the wood store, in his right hand
  const axe = new THREE.Group();
  cyl(axe, 0.018, 0.022, 0.95, WOOD, [0, 0, 0.32], [Math.PI / 2, 0, 0]);
  add(axe, new THREE.BoxGeometry(0.045, 0.24, 0.15), AXEM, [0, -0.07, 0.74]);
  p.rig.bone.handR.add(axe);
  axe.visible = false;
  p.wood = { axe, s: 'fetch', t: 0, i, spot: woodSpot(i), home: [WOODSHED[0] - 3.6 + (i % 3) * 1.3, WOODSHED[1] + 3.6 + (i % 2) * 0.9], bundle: b, bent: false };
}
// No one works in the dark. When the day goes, each man drops what he is doing and runs for his own house, nearly twice
// as fast as he walks, and is gone in at its door: the woodcutters to the top left house, the masons to the top right.
// At dawn he comes out again and goes back to his work (a woodcutter by way of the store, for his axe)
const HUT_DOOR = [SAGE_HOUSE[0] + Math.sin(SAGE_HOUSE[2]) * 5.5, SAGE_HOUSE[1] + Math.cos(SAGE_HOUSE[2]) * 5.5],
  HUT_DOOR_E = [LONG[0] + Math.sin(LONG[2]) * 5.5, LONG[1] + Math.cos(LONG[2]) * 5.5];
function woodNight(p) {
  const W = p.wood || p.mason,
    door = p.mason ? HUT_DOOR_E : HUT_DOOR,
    dark = NIGHT.go && !NIGHT.dawn;
  if (dark && !W.in) {
    W.in = true;
    W.s = 'home';
    W.t = 0;
    W.bent = false;
    if (W.bundle) W.bundle.visible = false;
    W.axe.visible = false;
    W.pace0 = p.pace;
    p.pace *= 1.9;
    p.path = route(p.g.position, [door[0] + R(-0.5, 0.5), door[1] + R(-0.5, 0.5)]);
  } else if (!dark && W.in && W.s === 'in') {
    W.in = false;
    p.g.visible = true;
    p.pace = W.pace0;
    W.s = p.mason ? 'go' : 'fetch';
    W.t = 0;
    p.path = [p.mason ? W.spot : W.home];
  }
}
// A mason at his work: he walks to his place in the yard, takes up a hammer and works at the stone before him without
// stopping, dust jumping from it at each blow. What the work earns is counted as the woodcutters' is, and paid at dawn
function toStone(p, i) {
  const ham = new THREE.Group(),
    q = MASON_AT[i % MASON_AT.length];
  cyl(ham, 0.02, 0.022, 0.8, WOOD, [0, 0, 0.3], [Math.PI / 2, 0, 0]);
  add(ham, new THREE.BoxGeometry(0.13, 0.22, 0.13), AXEM, [0, 0, 0.68]);
  p.rig.bone.handR.add(ham);
  ham.visible = false;
  p.mason = { axe: ham, s: 'go', t: 0, u: 1, earn: R(0, 10), spot: [q.x, q.z, q.face], bent: false };
}
function stoneStep(p, dt) {
  const W = p.mason,
    P = p.g.position;
  W.t += dt;
  if (W.s === 'home' || W.s === 'in') {
    p.g.visible = false;
    W.s = 'in';
    return;
  }
  if (W.s === 'go') {
    W.s = 'work';
    W.axe.visible = true;
    p.job = 'chop';
    W.bent = true;
    W.u = 1;
    return;
  }
  const u = chopAt(p),
    t = W.spot[2];
  if (W.u < CHOP_HIT && u >= CHOP_HIT) puff(tmpA.set(t.x + (P.x - t.x) * 0.4, groundY(t.x, t.z) + t.h, t.z + (P.z - t.z) * 0.4), 0xdcd7cc, 6, 2, 0.4, 6, 0.12);
  W.u = u;
  if ((W.earn += dt) > MASON_PAY_T) {
    W.earn = 0;
    STOCK.pendS += 1;
  }
}
// (called each frame while he stands at the end of his way: at the forest's edge, or back at the store)
function woodStep(p, dt) {
  const W = p.wood,
    P = p.g.position;
  W.t += dt;
  if (W.s === 'home' || W.s === 'in') {
    // (at the door: in, and out of sight)
    p.g.visible = false;
    W.s = 'in';
    return;
  }
  if (W.s === 'fetch') {
    // at the store he takes an axe, and goes out with it
    if (W.t < 0.5) return;
    W.axe.visible = true;
    W.s = 'out';
    p.path = [W.spot];
  } else if (W.s === 'out') {
    W.s = 'pick';
    W.t = 0;
    p.job = 'chop';
    W.bent = true;
    W.u = 1;
  } else if (W.s === 'pick') {
    // each time the axe bites, chips fly from the trunk
    const u = chopAt(p),
      t = W.spot[2];
    if (W.bent && W.u < CHOP_HIT && u >= CHOP_HIT) {
      const dx = t.x - P.x,
        dz = t.z - P.z,
        l = Math.hypot(dx, dz) || 1;
      puff(tmpA.set(t.x - (dx / l) * 0.3, groundY(t.x, t.z) + (t.low ? 0.45 : 0.95), t.z - (dz / l) * 0.3), 0xd9b98a, 7, 2.4, 0.45, 6, 0.12);
    }
    W.u = u;
    // he works at it for a while, then he straightens...
    if (W.t > 24) W.bent = false;
    if (W.t > 24.5) {
      // ...and sets off back with the bundle up on his shoulders
      W.s = 'back';
      p.job = 'carry';
      W.bent = true;
      W.bundle.visible = true;
      W.axe.visible = false;
      p.path = [W.home];
    }
  } else if (W.s === 'back') {
    W.s = 'drop';
    W.t = 0;
    W.bent = false;
  } else if (W.t > 0.45) {
    W.bundle.visible = false;
    // (wood brought in feeds the fire; what the fire gives back for it is counted at the end of the night)
    STOCK.pend += 1;
    W.axe.visible = true;
    puff(tmpA.set(P.x, 0.2, P.z), 0xcbb48a, 5, 1, 0.4, 2);
    W.s = 'out';
    W.spot = woodSpot(++W.i);
    p.path = [W.spot];
  }
}

// ---------- the brahmins' blessing ----------
// Freed, the brahmins bless Rama's bow, and he chooses how: three cards are laid out, drawn by chance from the blessings
// below, each with its name and what it does. One is taken with a click or with 1, 2 or 3, and the others are gone. They are
// all for Rama and they last the rest of the level; one already taken is not offered again.
const MASON_GIFT = 12,
  BOONS = [
    { name: 'Vajra Points', text: 'Arrows strike a third harder.', sign: '◆', take: () => (RAMA.dmg = RAMA.dmg.map((v) => Math.round(v * 1.33))) },
    { name: 'Swift Hands', text: 'Draw and loose a quarter faster.', sign: '≫', take: () => (RAMA.pace *= 0.75) },
    { name: 'Twin Arrows', text: 'Every plain shot looses two arrows.', sign: '⇉', take: () => (RAMA.twin = (RAMA.twin || 0) + 1) },
    { name: 'Far Sight', text: 'Shoots on his own from a third further off.', sign: '◎', take: () => (RAMA.range = Math.round(RAMA.range * 1.33)) },
    { name: 'Inner Fire', text: 'Astra power returns twice as fast.', sign: '✹', take: () => (RAMA.mpRegen *= 2) },
  ];
function boonPick(done) {
  const pool = BOONS.filter((b) => !b.got),
    offer = [];
  while (offer.length < 3 && pool.length) offer.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  if (!offer.length) return done();
  if (!boonPick.css) {
    boonPick.css = document.createElement('style');
    boonPick.css.textContent = `
    #boon { position: fixed; inset: 0; z-index: 30; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px;
      background: rgba(12, 12, 14, .62); opacity: 0; transition: opacity .25s; font-family: var(--f, Marcellus, Georgia, serif); color: #fff3df; user-select: none; }
    #boon.on { opacity: 1; }
    #boon h2 { margin: 0; font: 600 15px var(--f, Marcellus, Georgia, serif); letter-spacing: .22em; text-transform: uppercase; color: #ffd08a; }
    #boon .row { display: flex; gap: 18px; flex-wrap: wrap; justify-content: center; padding: 0 16px; }
    #boon button { width: 200px; min-height: 250px; padding: 22px 18px 18px; display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer;
      color: #fff3df; background: rgba(24, 24, 26, .94); border: 2px solid rgba(255, 208, 138, .35); border-radius: 10px; font: inherit;
      transform: translateY(14px); opacity: 0; transition: transform .28s ease-out, opacity .28s, border-color .15s, background .15s; }
    #boon.on button { transform: none; opacity: 1; }
    #boon button:nth-child(2) { transition-delay: .07s, .07s, 0s, 0s; }
    #boon button:nth-child(3) { transition-delay: .14s, .14s, 0s, 0s; }
    #boon button:hover { border-color: #ffd08a; background: rgba(40, 36, 30, .96); transform: translateY(-4px); }
    #boon i { font: 400 46px/1 Georgia, serif; font-style: normal; color: #ffd08a; height: 56px; display: grid; place-items: center; }
    #boon b { font: 600 21px var(--f, Marcellus, Georgia, serif); }
    #boon span { font: 500 16px/1.35 var(--f, Marcellus, Georgia, serif); opacity: .82; flex: 1; }
    #boon kbd { font: 700 12px var(--f, Marcellus, Georgia, serif); letter-spacing: .1em; color: #ffd08a; opacity: .7; }`;
    document.head.append(boonPick.css);
  }
  const el = document.createElement('div');
  el.id = 'boon';
  el.innerHTML = '<h2>The brahmins’ blessing · choose one</h2><div class="row"></div>';
  const take = (b) => {
      if (!el.isConnected || el.dataset.gone) return;
      el.dataset.gone = 1;
      b.got = true;
      b.take();
      removeEventListener('keydown', key, true);
      el.classList.remove('on');
      setTimeout(() => el.remove(), 260);
      flash(tmpA.copy(RAMA.group.position).setY(RAMA.group.position.y + 1.3), 0xffd08a, 14);
      puff(tmpA, 0xffd08a, 26, 2.6, 0.5, -1.2, 0.7);
      done();
    },
    // (its own keys, taken before anything else hears them: 1, 2 and 3 would otherwise change how he stands)
    key = (e) => {
      const b = offer[{ Digit1: 0, Digit2: 1, Digit3: 2 }[e.code]];
      e.stopPropagation();
      e.preventDefault();
      if (b && !e.repeat) take(b);
    };
  offer.forEach((b, i) => {
    const c = document.createElement('button');
    c.innerHTML = `<i>${b.sign}</i><b>${b.name}</b><span>${b.text}</span><kbd>${i + 1}</kbd>`;
    c.onclick = () => take(b);
    el.lastChild.append(c);
  });
  document.body.append(el);
  addEventListener('keydown', key, true);
  requestAnimationFrame(() => el.classList.add('on'));
}

// ---------- the men's orders ----------
// The two far camps (stone masons in the east, brahmins in the south) are not part of this first day: freeing them is for the
// next. Nothing here sends the player to them, and no choice between them is asked for. (ORDER is kept for the code that reads it)
const ORDER = { done: false, pick: null };
// The morning after the first night, word comes of them. One of the woodcutters, out of his house with the day, runs to the
// brother you lead and tells him: two more camps, the masons one way and the brahmins the other. What each brings is said in
// the same breath: the masons, coins at once; the brahmins, a blessing on Rama's bow, his to choose. Both are to be freed
// that day, and the night cannot be called until they are.
// After it, each camp has a small label at the edge of the screen, pointing its way and named, with what it would bring. A
// label is only there while its camp is off the screen, and each goes for good the moment a brother reaches its camp (near
// enough for its guards to turn on him). There is no objective line with them.
//   off    nothing yet        run    he is on his way to the brother        talk    he is speaking        done    said
const MESS = { st: 'off', p: null, els: null };
function orderUpdate() {
  const far = CAMPS.filter((c) => !c.first),
    open = far.length === 2 && far.some((c) => !c.thanked && !c.roused),
    isMason = (c) => c.prisoners[0].look === 'mason';
  if (MESS.st === 'off') {
    // (once the day is most of the way back, and with one of them out of doors to carry it)
    if (dayN() < 2 || !open || talking() || LOCK || SEL.hp <= 0) return;
    const p = CAMPS[0].prisoners.find((q) => q.wood && q.go && q.g.visible && !q.wood.in);
    if (!p) return;
    MESS.p = p;
    MESS.st = 'run';
  }
  // (if both camps have been found before he gets there, he has nothing to tell: he turns back to his work)
  if (MESS.st === 'run' && !open) {
    const p = MESS.p;
    MESS.st = 'over';
    p.dash = p.hurry = false;
    p.wood.s = 'fetch';
    p.wood.t = 0;
    p.path = [p.wood.home];
    return;
  }
  if (MESS.st === 'run' || MESS.st === 'talk') {
    const p = MESS.p,
      P = p.g.position,
      H = SEL.group.position,
      W = p.wood;
    // his own work waits: no axe, no bundle, and the woodcutter's round held at its first step until he is let go
    W.s = 'fetch';
    W.t = 0;
    W.bent = false;
    W.axe.visible = false;
    if (W.bundle) W.bundle.visible = false;
    p.job = null;
    // (the way is always the brother himself, wherever he has got to; and while they speak it keeps the man facing him)
    p.path = [[H.x, H.z]];
    p.hurry = p.dash = true;
    if (MESS.st === 'run' && Math.hypot(H.x - P.x, H.z - P.z) < 2.6 && !talking() && !LOCK) {
      MESS.st = 'talk';
      // which way each lies from where they stand, in a word
      const way = (c) => {
          const dx = c.x - H.x,
            dz = c.z - H.z;
          return Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'east' : 'west') : dz > 0 ? 'south' : 'north';
        },
        m = far.find(isMason),
        b = far.find((c) => !isMason(c)),
        f = snap(p.rig.bone.head, p.g.rotation.y, null),
        me = { who: NAMES[SEL.name] || 'Rama', face: photo(SEL) };
      LOCK = true;
      say(
        [
          { who: 'Woodcutter', face: f, text: 'Prince! Prince! They came back in the night. There are two camps in the forest now, and more of us in them.' },
          { who: 'Woodcutter', face: f, text: `To the ${way(m)} they hold the stone masons. To the ${way(b)}, the brahmins who chant for the sage.` },
          { who: 'Woodcutter', face: f, text: 'The masons were made to carry their plunder, and will give it to you. The brahmins can put a blessing on your bow.' },
          { ...me, text: 'Then both must be free before dark. Go back to your work, friend. You have done well.' },
        ],
        () => {
          LOCK = false;
          MESS.st = 'done';
          // back to the store for his axe, and out to his tree, at his own pace
          p.dash = p.hurry = false;
          W.s = 'fetch';
          W.t = 0;
          p.path = [W.home];
        },
      );
    }
  }
  // the two labels
  if (MESS.st !== 'done') return;
  // (each goes for good when a brother reaches its camp; with both gone there is nothing more to do here)
  if (MESS.els) {
    for (const e of MESS.els.filter((e) => e.c.roused || e.c.thanked)) {
      e.el.remove();
      MESS.els.splice(MESS.els.indexOf(e), 1);
    }
    if (!MESS.els.length) {
      MESS.els = null;
      MESS.st = 'over';
      return;
    }
  }
  if (!MESS.els) {
    // Each is a round picture of one of the men held there, ringed, with a notch on the ring that points the way to their camp.
    // The words sit under it, outside the ring: who they are, and what freeing them would bring
    const st = document.createElement('style');
    st.textContent = `
    .way { position: fixed; left: 0; top: 0; z-index: 12; display: none; flex-direction: column; align-items: center; gap: 8px; pointer-events: none;
      color: #fff3df; white-space: nowrap; text-align: center; font: 600 15px var(--f, Marcellus, Georgia, serif); text-shadow: 0 1px 3px rgba(0, 0, 0, .95), 0 0 8px rgba(0, 0, 0, .7); }
    .way.side { flex-direction: row; text-align: left; gap: 16px; }
    .way .rd { position: relative; width: 46px; height: 46px; flex: none; }
    .way img { position: absolute; inset: 0; width: 100%; height: 100%; box-sizing: border-box; border-radius: 50%; object-fit: cover;
      background: #1a1a1c; border: 5px solid #1a1a1c; }
    .way .nt { position: absolute; inset: 0; }
    .way .nt::after { content: ''; position: absolute; left: 100%; top: 50%; margin: -8px 0 0 -2px; border: 8px solid transparent; border-left: 10px solid #1a1a1c; border-right: 0; }
    .way small { display: block; font: 500 12px var(--f, Marcellus, Georgia, serif); color: #ffd08a; letter-spacing: .04em; }`;
    document.head.append(st);
    MESS.els = far.map((c) => {
      const el = document.createElement('div'),
        q = c.prisoners[0],
        was = q.g.visible;
      // (his picture is taken as he stands in the camp, whether or not he is being drawn just now)
      q.g.visible = true;
      q.g.updateMatrixWorld(true);
      const face = snap(q.rig.bone.head, q.g.rotation.y, null);
      q.g.visible = was;
      el.className = 'way';
      el.innerHTML =
        `<div class="rd"><img alt="" src="${face}"><div class="nt"></div></div>` +
        (isMason(c) ? '<span>Masons<small>Coins</small></span>' : '<span>Brahmins<small>A blessing for the bow</small></span>');
      document.body.append(el);
      return { el, c, tip: el.querySelector('.nt') };
    });
  }
  for (const e of MESS.els) {
    const v = tmpA.set(e.c.x, groundY(e.c.x, e.c.z) + 1, e.c.z).project(cam),
      back = v.z > 1,
      x = back ? -v.x : v.x,
      y = back ? -v.y : v.y,
      // (how far out toward the edge its camp lies: under one, it is on the screen, and the label is not needed)
      // (the ring's middle is kept this many pixels in from each edge: 64 at the sides, where the words under it need half
      // their width; 40 at the top; 104 at the foot, clear of the instruction line and the counters. It was a tenth of the
      // screen's width and a seventh of its height, which left it floating well inside)
      k = Math.max(Math.abs(x) / (1 - 128 / innerWidth), y > 0 ? y / (1 - 80 / innerHeight) : -y / (1 - 208 / innerHeight));
    if ((k < 1 && !back) || talking() || LOCK) {
      e.el.style.display = 'none';
      continue;
    }
    const ex = x / (k || 1),
      ey = y / (k || 1);
    e.el.style.display = 'flex';
    // (placed by the middle of the ring, not of the whole label, so the notch turns about the right point. The words go under
    // the ring, except at the foot of the screen, where there is no room under it and they go beside it)
    const side = ey < -0.6;
    e.el.classList.toggle('side', side);
    e.el.style.transform = `translate(${side ? '-23px,-50%' : '-50%,-23px'}) translate(${((ex + 1) / 2) * innerWidth}px,${((1 - ey) / 2) * innerHeight}px)`;
    e.tip.style.transform = `rotate(${Math.atan2(-ey, ex)}rad)`;
  }
}

// ---------- arriving at the hermitage ----------
// When the brother you are playing comes near the altar with no enemy about, the scene takes over:
// Each step is named for who is doing what, so no two can be mistaken for each other:
//   wait           (before it starts) until a brother comes near the altar
//   brothersSit    both walk to their places before the fire, sit and bow
//   hush           a moment after both are down...
//   sageOm         ...Vishwamitra, eyes shut, makes them wait through one long Om
//   sageRises      he gets to his feet, unhurried
//   sageComes      and walks round the fire to them
//   sageGreets     he stops before the two of them, facing both
//   sageTalks      he asks, they answer, and he turns to Rama, raises his hand and gives him the Agneyastra: the fire
//                  passes from his palm to Rama, who sits still to receive it
//   sageReturns    the brothers rise and the level is the player's again, while he goes back to his seat by the fire and sits
//   sageOffers     he settles onto his own spot
//   done           (after it) nothing more happens
// the brothers sit off the road, to the near left of the fire. Vishwamitra goes round the fire to them by way of SAGE_VIA, not through it
const SEATS = { rama: V3(-4.3, 0, 4.5), lak: V3(-5.3, 0, 3.5) },
  SAGE_HOME = V3(0, 0, -2),
  SAGE_VIA = V3(-2.4, 0, -0.3),
  // He stops squarely in front of the pair, the same distance from each, having come the last few steps straight toward the
  // middle of them (by SAGE_VIA2), so he is plainly walking to both and not to Rama
  SAGE_MID = V3((SEATS.rama.x + SEATS.lak.x) / 2, 0, (SEATS.rama.z + SEATS.lak.z) / 2),
  SAGE_MEET = V3(SAGE_MID.x + 2.3 * 0.7071, 0, SAGE_MID.z - 2.3 * 0.7071),
  SAGE_VIA2 = V3(SAGE_MID.x + 3.9 * 0.7071, 0, SAGE_MID.z - 3.9 * 0.7071),
  ARR = { step: 'wait', t: 0, bow: true },
  // Vishwamitra has no eyelids of his own. He is given a pair here, hidden until he shuts his eyes, and his pupils hide when he does
  SAGE_EYES = { lids: [], pupils: [] };
{
  const head = V.bone.head.children.find((o) => o.isGroup),
    near = (a, b) => Math.abs(a - b) < 1e-4,
    skinM = head.children.find((o) => o.isMesh && near(o.position.y, 0.027) && near(o.position.z, 0.094)).material;
  SAGE_EYES.pupils = head.children.filter((o) => o.isMesh && near(o.position.y, 0.01) && near(o.position.z, 0.109));
  for (const s of [-1, 1])
    SAGE_EYES.lids.push(
      sph(head, 0.0265, skinM, [s * 0.047, 0.012, 0.103], [1.32, 0.68, 0.5]),
      add(head, new THREE.BoxGeometry(0.05, 0.004, 0.004), DARK, [s * 0.047, 0.003, 0.1145], [0, s * -0.25, 0]),
    );
  SAGE_EYES.lids.forEach((o) => (o.visible = false));
}
function sageEyes(shut) {
  SAGE_EYES.lids.forEach((o) => (o.visible = shut));
  SAGE_EYES.pupils.forEach((o) => (o.visible = !shut));
}
// the scene's orders to a brother. While anything has the controls locked he at least stands still and holds his fire
DIRECT = (h) => {
  if (!LOCK) return false;
  IN.x = IN.z = 0;
  IN.walk = IN.fire = false;
  IN.at = null;
  firing = false;
  if (ARR.talked) {
    // (after the talk: up off the ground, standing)
    move = 'idle';
    namaste = false;
  } else if (ARR.step !== 'wait' && ARR.step !== 'done') {
    const s = SEATS[h.name],
      P = h.group.position,
      dx = s.x - P.x,
      dz = s.z - P.z,
      l = Math.hypot(dx, dz);
    if (!h.sat && l > 0.25) {
      IN.x = dx / l;
      IN.z = dz / l;
      // they walk to their seats, not run, but at a good brisk walk
      IN.walk = true;
      IN.quick = 1.8;
    } else {
      h.sat = true;
      move = 'sit';
      namaste = ARR.bow;
    }
  }
  return true;
};
// And while something is being built where a brother stands, he walks off the spot: a few brisk steps straight away from
// it, his own walk, whoever is playing him. (Once he is clear he is his own again)
{
  const scene0 = DIRECT;
  DIRECT = (h, dt) => {
    if (scene0(h, dt)) return true;
    const l = STOCK.at;
    if (!STOCK.hold || !l || !l.kind || h.clearOf === l) return false;
    const o = offPlace(l, h.group.position);
    if (o.d >= o.R) return false;
    IN.x = o.dx;
    IN.z = o.dz;
    IN.walk = true;
    IN.quick = 2;
    IN.fire = false;
    IN.at = null;
    firing = false;
    return true;
  };
}
// Vishwamitra walks in a straight line to a spot, at his own walking pace; true once he is there
function sageWalk(to, dt, pass) {
  const P = SG.at,
    dx = to.x - P.x,
    dz = to.z - P.z,
    l = Math.hypot(dx, dz),
    wrap = (v) => Math.atan2(Math.sin(v), Math.cos(v));
  // a point he is only passing (pass) counts as reached from a pace off, so he is already turning for the next as he rounds it
  if (l < (pass ? 1.1 : 0.2)) return true;
  if (SG.yaw == null) SG.yaw = SG.facing;
  // He turns toward the spot gradually, and only ever steps the way his body is actually facing: never sideways.
  // While he is still turned well away from where he is going (as when he first gets up, facing the fire) he stands and turns,
  // and sets off once he has come round. That also means he cannot circle a spot he is close to
  const want = Math.atan2(dx, dz),
    off = Math.abs(wrap(want - SG.facing)),
    go = off < 0.6;
  SG.yaw += wrap(want - SG.yaw) * Math.min(1, dt * 3);
  SG.move = go ? 'walk' : 'idle';
  // a little quicker than his stroll round the fire, with his stride quickened to match so his feet do not slide.
  // His pace is tied to how far his walk has got going, so he gathers way and loses it with his legs
  const k = SG.wWalk * (1 - SG.wSit) * dt,
    v = go ? Math.min(l, 1.7 * k) : 0;
  SG.phase += (0.6 * k) / 0.36;
  P.x += Math.sin(SG.facing) * v;
  P.z += Math.cos(SG.facing) * v;
  return false;
}
function arriveUpdate(dt) {
  const A = ARR,
    P = SEL.group.position,
    to = (step) => {
      A.step = step;
      A.t = 0;
    };
  A.t += dt;
  if (A.face != null && SG.yaw != null) SG.yaw += Math.atan2(Math.sin(A.face - SG.yaw), Math.cos(A.face - SG.yaw)) * Math.min(1, dt * 2.5);
  if (A.step === 'wait') {
    const clear = !grunts.some((d) => !d.dead && Math.hypot(d.g.position.x - P.x, d.g.position.z - P.z) < 25);
    if (!LOCK && !talking() && clear && Math.hypot(P.x, P.z) < 9) {
      LOCK = true;
      to('brothersSit');
    }
  } else if (A.step === 'brothersSit') {
    // once both are seated the camera passes over to Vishwamitra at the altar, and stays with him as he comes across and goes back
    if (HEROES.every((h) => h.sat && h.s.wSit > 0.9)) {
      CAM = V.group.position;
      to('hush');
    }
  } else if (A.step === 'hush') {
    // then he keeps them waiting. His eyes close, and he says one long Om before anything else happens: patience.
    // The brothers hold their bow all through it, and until he has come over and begins to speak
    if (A.t > 1.5) {
      sageEyes(true);
      say([{ who: 'Vishwamitra', face: snap(V.bone.head, V.group.rotation.y, null), text: 'Om…' }], () => to('sageRises'));
      to('sageOm');
    }
  } else if (A.step === 'sageRises') {
    // a short stillness after the Om. His eyes open near the end of it, and then he gets up
    if (A.t > 0.8) sageEyes(false);
    if (A.t > 1.3) {
      SG.at = V.group.position.clone();
      to('sageComes');
    }
  } else if (A.step === 'sageComes') {
    if (!A.via) A.via = sageWalk(SAGE_VIA, dt, true);
    else if (!A.via2) A.via2 = sageWalk(SAGE_VIA2, dt, true);
    else if (sageWalk(SAGE_MEET, dt)) {
      SG.move = 'idle';
      // he turns to face them, unhurriedly (see the top of this function)
      A.face = Math.atan2(SAGE_MID.x - SAGE_MEET.x, SAGE_MID.z - SAGE_MEET.z);
      to('sageGreets');
    }
  } else if (A.step === 'sageGreets') {
    // (he stands a moment facing the two of them before he speaks)
    if (A.t > 0.6) {
      A.bow = false;
      const f = snap(V.bone.head, V.group.rotation.y, null);
      say(
        [
          { who: 'Vishwamitra', face: f, text: 'So Dasharatha sent you boys to help me?' },
          { who: 'Rama', face: photo(RAMA), text: 'We are only your pupils, Gurudev. Tell us what must be done, and we will try to be worthy of it.' },
          { who: 'Lakshmana', face: photo(LAK), text: 'Let the demons come. Not one of them will reach your fire.' },
          {
            who: 'Vishwamitra',
            face: f,
            text: 'Then take this, Rama. The Agneyastra: Agni himself, bound to an arrow.',
            // as he says it he raises his hand and the fire passes from it to Rama; the line stays up while it does
            wait: GIFT.T + 0.2,
            on: () => {
              // (for the gift he turns from the pair to Rama)
              A.face = Math.atan2(SEATS.rama.x - SAGE_MEET.x, SEATS.rama.z - SAGE_MEET.z);
              A.giving = true;
              giveAstra(1);
            },
          },
          { who: 'Vishwamitra', face: f, text: 'Use it when the bow alone will not do.' },
        ],
        () => {
          A.via = A.via2 = false;
          A.face = null;
          // the talk is over: the camera goes straight back to the brother being played, and does not follow the sage home,
          // and the brothers get up at once (see 'sageReturns')
          CAM = null;
          A.giving = false;
          A.talked = true;
          HEROES.forEach((h) => (h.sat = false));
          to('sageReturns');
        },
      );
      to('sageTalks');
    }
  } else if (A.step === 'sageReturns') {
    // the brothers are on their feet in a moment, and the player has them back while the sage is still walking home
    if (A.t > 0.7 && !A.loose) {
      A.loose = true;
      LOCK = false;
    }
    if (!A.via) A.via = sageWalk(SAGE_VIA, dt, true);
    else if (!A.home) {
      // At his place he is still facing the way he walked in, well over a quarter turn away from the fire. He stops and comes
      // round to face it first, at an old man's pace (A.face, eased above); sitting straight down would spin him round in a flick
      if (sageWalk(SAGE_HOME, dt)) {
        A.home = true;
        SG.move = 'idle';
        A.face = 0;
      }
    } else if (Math.abs(Math.atan2(Math.sin(SG.facing), Math.cos(SG.facing))) < 0.3) {
      // facing the fire, he sits; over the next moment he is eased the last hand's breadth onto his own spot (see 'sageOffers')
      A.face = null;
      SG.yaw = null;
      SG.pathA = Math.PI;
      SG.move = 'sit';
      to('sageOffers');
    }
  } else if (A.step === 'sageOffers') {
    if (SG.at) SG.at.lerp(SAGE_HOME, Math.min(1, dt * 6));
    if (A.t > 0.6) SG.at = null;
    if (A.t > 1.8) to('done');
  }
  // His hand, while he gives the astra: the right arm comes up and out toward Rama, palm forward, and stays there until the
  // last of the fire has left it. (This runs after his own pose for the frame has been set, and is laid over it)
  A.raise = (A.raise || 0) + ((A.giving && ASTRA.fx > 0 ? 1 : 0) - (A.raise || 0)) * Math.min(1, dt * 5);
  if (A.raise > 0.01) {
    const w = A.raise * A.raise * (3 - 2 * A.raise);
    V.bone.armR.quaternion.slerp(GIVE.arm, w);
    V.bone.foreR.quaternion.slerp(GIVE.fore, w);
    V.bone.handR.quaternion.slerp(GIVE.hand, w);
  }
}

// ---------- the minimap ----------
// A small map of the level in the bottom right corner, north at the top, in the manner of the old strategy games.
// It appears once Vishwamitra has had his say. The ground, trees, rivers, road, pond, houses and altar are painted once;
// over them, a few times a second, go the things that move or change:
//   a red pennant   a camp whose demons are still alive
//   red dots        demons that are awake
//   pale dots       prisoners: dim while held, bright once freed
//   blue and gold   Rama and Lakshmana, the one you are playing ringed in white
// It makes its own elements and carries its own styles, like the dialogue box
const MINI = { W: 480, shown: false, open: false, n: 0 };
const VIEW = new THREE.Vector3();
{
  // (it shows exactly the land you can walk on: from the west limit, past the first river's left bank, to the east limit,
  // and the north and south limits, so its edges are the edges of the playing ground)
  const XL = X0,
    XR = EX - 3.5,
    W = MINI.W,
    H = Math.round((W * (ZS - ZN)) / (XR - XL)),
    k = W / (XR - XL),
    mx = (x) => (x - XL) * k,
    my = (z) => (z - ZN) * k,
    box = document.createElement('div'),
    cv = ((MINI.H = H), document.createElement('canvas')),
    bg = document.createElement('canvas');
  box.style.cssText =
    // (a dark panel like the others, with a hairline round it so its edge is clear against the grass)
    // (a sheet of paper laid on the screen, a little askew: no panel round it, no bar over it)
    'position:fixed;right:20px;bottom:62px;transform-origin:100% 100%;transform:rotate(-1.2deg) scale(.97);opacity:0;transition:opacity .2s,transform .2s;pointer-events:none;z-index:35;line-height:0';
  for (const c of [cv, bg]) {
    c.width = W * 2;
    c.height = H * 2;
  }
  // (the page's own rule for canvases pins them to the top left corner at full size; this one must not take it)
  cv.style.cssText = `position:static;inset:auto;width:340px;display:block;border-radius:3px;max-width:calc(100vw - 60px);height:auto;box-shadow:0 4px 14px rgba(40,25,10,.35)`;
  box.append(cv);
  // (a small cross in ink in the sheet's top corner puts it away)
  box.insertAdjacentHTML(
    'beforeend',
    '<i data-x style="position:absolute;right:16px;top:16px;width:26px;height:26px;display:grid;place-items:center;cursor:pointer;opacity:.7"><svg viewBox="0 0 16 16" width="15" height="15" stroke="#4a3522" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l10 10M13 3L3 13"/></svg></i>',
  );
  document.body.append(box);
  // The map is not kept on the screen. In its corner is only a small icon of a folded map, bare and black like the arrows;
  // a click on it, or the M key, opens the map in the middle of the screen, and the same again puts it away
  const ic = document.createElement('div');
  ic.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:15;width:36px;height:36px;display:grid;place-items:center;cursor:pointer;opacity:.95';
  ic.innerHTML =
    '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#000" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20Z"/><path d="M9 4v13.5M15 6.5V20"/></svg>';
  MINI.toggle = (on = !MINI.open) => {
    MINI.open = on;
    box.style.opacity = on ? 1 : 0;
    box.style.transform = `rotate(-1.2deg) scale(${on ? 1 : 0.97})`;
    box.style.pointerEvents = on ? 'auto' : 'none';
    if (on) MINI.draw();
  };
  const x = box.querySelector('[data-x]');
  x.onclick = () => MINI.toggle(false);
  x.onmouseenter = () => (x.style.opacity = 1);
  x.onmouseleave = () => (x.style.opacity = 0.7);
  ic.onclick = () => MINI.toggle();
  addEventListener('keydown', (e) => e.code === 'KeyM' && !e.repeat && MINI.toggle());
  // what never changes
  const g = bg.getContext('2d');
  g.scale(2, 2);
  // A drawn map, not a picture: old paper, darker toward its edges and stained here and there; the woods a wash of olive,
  // the rivers a pale blue wash with an ink line either side, the roads dotted in sepia, the houses small inked rounds
  const INK = '#4a3522',
    wobble = (i, n) => {
      const v = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
  g.fillStyle = '#e9dab2';
  g.fillRect(0, 0, W, H);
  {
    const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.72);
    v.addColorStop(0, 'rgba(150,110,60,0)');
    v.addColorStop(1, 'rgba(150,110,60,.38)');
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) {
      g.fillStyle = `rgba(140,105,60,${0.04 + wobble(i, 3) * 0.05})`;
      g.beginPath();
      g.ellipse(wobble(i, 1) * W, wobble(i, 2) * H, 20 + wobble(i, 4) * 50, 14 + wobble(i, 5) * 30, wobble(i, 6) * 3, 0, 7);
      g.fill();
    }
  }
  g.fillStyle = 'rgba(112,128,72,.3)';
  for (const t of WOODS) {
    g.beginPath();
    g.arc(mx(t.x), my(t.z), 2 + t.s * 1.8, 0, 7);
    g.fill();
  }
  const stroke = (pts, col, w, dash) => {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.setLineDash(dash || []);
    g.lineJoin = g.lineCap = 'round';
    g.beginPath();
    pts.forEach(([x, z], i) => (i ? g.lineTo(mx(x), my(z)) : g.moveTo(mx(x), my(z))));
    g.stroke();
  };
  for (const [col, w] of [
    ['#5d7480', 2 * RW * k + 1.6],
    ['#b5cfd6', 2 * RW * k],
  ])
    for (const line of RIV)
      stroke(
        line.filter((_, i) => i % 4 === 0).map((p) => [p.x, p.z]),
        col,
        w,
      );
  // (the roads go on over the rivers: those are the crossings)
  for (const line of ROADS)
    stroke(
      line.filter((_, i) => i % 3 === 0).map((p) => [p.x, p.z]),
      '#7a5a3a',
      1.5,
      [1, 4.5],
    );
  g.setLineDash([]);
  g.fillStyle = '#b5cfd6';
  g.strokeStyle = '#5d7480';
  g.lineWidth = 0.9;
  g.beginPath();
  g.arc(mx(POND[0]), my(POND[1]), 3.8 * k, 0, 7);
  g.fill();
  g.stroke();
  for (const [q, r] of [
    [SAGE_HOUSE, 4.4],
    [HALL, 5.4],
    [LONG, 4.4],
    [SW_HOUSE, 4.4],
    [SE_HOUSE, 4.4],
  ]) {
    g.fillStyle = '#cdb383';
    g.strokeStyle = INK;
    g.lineWidth = 1;
    g.beginPath();
    g.arc(mx(q[0]), my(q[1]), (r + 0.6) * k, 0, 7);
    g.fill();
    g.stroke();
  }
  // the altar: a small flame-coloured diamond with a pale edge
  g.fillStyle = '#d2562a';
  g.strokeStyle = INK;
  g.lineWidth = 1;
  g.beginPath();
  g.arc(mx(0), my(0), 4, 0, 7);
  g.fill();
  g.stroke();
  // the frame: two ruled lines just inside the edge of the sheet
  g.strokeStyle = INK;
  g.lineWidth = 1.4;
  g.strokeRect(7, 7, W - 14, H - 14);
  g.lineWidth = 0.6;
  g.strokeRect(10.5, 10.5, W - 21, H - 21);
  // the name of the place, lettered in a corner, and north (written each time the map is drawn, not once, since the
  // lettering's own face may not have arrived when the page first loads)
  MINI.letter = (g) => {
  g.fillStyle = INK;
  g.font = "italic 600 24px 'Cormorant Garamond', Georgia, serif";
  g.font = "italic 500 16px 'Cormorant Garamond', Georgia, serif";
  {
    const nx = 34,
      ny = H - 36;
    g.beginPath();
    g.moveTo(nx, ny - 14);
    g.lineTo(nx + 5, ny + 4);
    g.lineTo(nx, ny);
    g.lineTo(nx - 5, ny + 4);
    g.closePath();
    g.fill();
    g.font = "600 12px 'Cormorant Garamond', Georgia, serif";
    g.textAlign = 'center';
  }
  };
  const d = cv.getContext('2d');
  d.scale(2, 2);
  // a name on the map: small italic, pale, with a thin dark edge so it reads on green or water
  const name = (t, x, z, dy) => {
    d.font = "italic 600 17px 'Cormorant Garamond', Georgia, serif";
    d.textAlign = 'center';
    d.lineWidth = 3;
    d.strokeStyle = 'rgba(233,218,178,.85)';
    d.strokeText(t, mx(x), my(z) + dy);
    d.fillStyle = INK;
    d.fillText(t, mx(x), my(z) + dy);
  };
  const dot = (x, z, r, fill, edge) => {
    d.beginPath();
    d.arc(mx(x), my(z), r, 0, 7);
    d.fillStyle = fill;
    d.fill();
    if (edge) {
      d.lineWidth = 1;
      d.strokeStyle = edge;
      d.stroke();
    }
  };
  MINI.draw = () => {
    if (!MINI.open) return;
    d.clearRect(0, 0, W, H);
    d.drawImage(bg, 0, 0, W, H);
    MINI.letter(d);
    for (const c of CAMPS) {
      // (a camp that has been emptied, or is not there yet, shows nothing)
      if (c.gone || c.late) continue;
      const live = c.guards.filter((e) => grunts.includes(e) && !e.dead);
      for (const p of c.prisoners) dot(p.g.position.x, p.g.position.z, 2, p.free ? INK : 'rgba(0,0,0,0)', INK);
      if (live.length) {
        // a camp still held: a red ring
        d.beginPath();
        d.arc(mx(c.x), my(c.z), 11, 0, 7);
        d.lineWidth = 1.6;
        d.strokeStyle = '#b3301f';
        d.stroke();
      }
      for (const e of live) if (!e.asleep && c.roused) dot(e.g.position.x, e.g.position.z, e.br ? 3.2 : 2.3, '#b3301f');
    }
    // the lamps: a dull dot, bright once lit
    for (const l of LAMPS) dot(l.x, l.z, l.lit ? 3.4 : 2.6, l.lit ? '#e8a020' : l.built ? '#9a8660' : 'rgba(0,0,0,0)', INK);
    // each brother as a small arrow pointing the way he faces; the one you are playing larger and ringed
    for (const h of HEROES) {
      const P = h.group.position,
        f = h === SEL ? facing : h.s ? h.s.facing : 0,
        fx = Math.sin(f),
        fy = Math.cos(f),
        k = h === SEL ? 1.5 : 1.15,
        x = mx(P.x),
        y = my(P.z);
      d.beginPath();
      d.moveTo(x + fx * 6 * k, y + fy * 6 * k);
      d.lineTo(x - fx * 3.5 * k + fy * 4 * k, y - fy * 3.5 * k - fx * 4 * k);
      d.lineTo(x - fx * 1.5 * k, y - fy * 1.5 * k);
      d.lineTo(x - fx * 3.5 * k - fy * 4 * k, y - fy * 3.5 * k + fx * 4 * k);
      d.closePath();
      d.fillStyle = h.name === 'rama' ? '#3a6fc0' : '#d98a20';
      d.fill();
      d.lineWidth = 1;
      d.strokeStyle = INK;
      d.stroke();
    }
  };
}

// ---------- the edge of the level ----------
// a dotted line on the ground along the three open limits (the fourth is the second river). It is invisible until the brother
// you are playing comes within three units of it, and is at its clearest when he is stopped against it
const DASH = [];
for (const [x0, z0, x1, z1] of [
  [X0 - 0.45, ZN, X0 - 0.45, ZS],
  [X0, ZN - 0.45, EX, ZN - 0.45],
  [X0, ZS + 0.45, EX, ZS + 0.45],
]) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  for (let t = 0; t < len; t += 1.5) DASH.push([x0 + ((x1 - x0) * t) / len, z0 + ((z1 - z0) * t) / len, x0 === x1 ? Math.PI / 2 : 0]);
}
const EDGE = new THREE.InstancedMesh(
  new THREE.PlaneGeometry(0.75, 0.14),
  new THREE.MeshBasicMaterial({ color: 0xfff3df, transparent: true, opacity: 0, depthWrite: false, fog: false }),
  DASH.length,
);
{
  const o = new THREE.Object3D();
  DASH.forEach(([x, z, a], i) => {
    o.position.set(x, groundY(x, z) + 0.06, z);
    // laid flat, then turned about the vertical so each dash lies along the line
    o.rotation.set(-Math.PI / 2, a, 0, 'YXZ');
    o.updateMatrix();
    EDGE.setMatrixAt(i, o.matrix);
  });
  EDGE.frustumCulled = false;
  EDGE.visible = false;
  scene.add(EDGE);
}
// the box that holds the brothers at the first camp: the same dashes, on its north, east and south sides
const HOLD_DASH = [];
for (const [x0, z0, x1, z1] of [
  [HOLD_X + 0.45, HOLD_N, HOLD_X + 0.45, HOLD_S],
  [X0, HOLD_N - 0.45, HOLD_X, HOLD_N - 0.45],
  [X0, HOLD_S + 0.45, HOLD_X, HOLD_S + 0.45],
]) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  for (let t = 0; t < len; t += 1.5) HOLD_DASH.push([x0 + ((x1 - x0) * t) / len, z0 + ((z1 - z0) * t) / len, x0 === x1 ? Math.PI / 2 : 0]);
}
const HOLD = new THREE.InstancedMesh(EDGE.geometry, EDGE.material.clone(), HOLD_DASH.length);
{
  const o = new THREE.Object3D();
  HOLD_DASH.forEach(([x, z, a], i) => {
    o.position.set(x, groundY(x, z) + 0.06, z);
    o.rotation.set(-Math.PI / 2, a, 0, 'YXZ');
    o.updateMatrix();
    HOLD.setMatrixAt(i, o.matrix);
  });
  HOLD.frustumCulled = false;
  HOLD.visible = false;
  scene.add(HOLD);
}
// each frame: the water's clock runs on, foam flies up at the foot of the fall, the edge line shows or hides, the camp is run,
// and the sky and sun keep the camera at their centre, since on a map this wide it would otherwise walk out from under them
const SUN0 = SUN.position.clone();
function sceneryUpdate(dt) {
  WATER_T.value += dt;
  const P = SEL.group.position;
  {
    const near = Math.max(0, Math.min(1, 1 - Math.min(P.x - X0, P.z - ZN, ZS - P.z) / 3)),
      m = EDGE.material;
    m.opacity += (near * 0.85 - m.opacity) * Math.min(1, dt * 6);
    EDGE.visible = m.opacity > 0.01;
    // the holding line shows the same way while it is in force, and fades out for good once the prisoners are free
    const hm = HOLD.material,
      hn = captive() ? Math.max(0, Math.min(1, 1 - Math.min(HOLD_X - P.x, P.z - HOLD_N, HOLD_S - P.z) / 3)) : 0;
    hm.opacity += (hn * 0.85 - hm.opacity) * Math.min(1, dt * 6);
    HOLD.visible = hm.opacity > 0.01;
  }
  if (Math.abs(P.x - FALL.x) < 60 && Math.random() < dt * 70)
    puff(tmpA.set(FALL.x + R(-RW + 0.6, RW - 0.6), 0.1 - DEEP, FALL.z + R(0.2, 1.2)), 0xeaf6ff, 1, 1.4, 0.7, 2);
  // the fire: its three sheets of flame each leaping and leaning in their own time, the pool of light under it breathing with
  // them; a thread of smoke going up from its tip, and now and then an ember
  hearthUpdate(dt, FIRE.s);
  campUpdate(dt);
  arriveUpdate(dt);
  orderUpdate();
  astraFx(dt);
  lampsUpdate(dt);
  statuesUpdate(dt);
  if (++MINI.n % 5 === 0) MINI.draw();
  talkUpdate(dt);
  tipsUpdate();
  heroBars(dt);
  foeBars();
  aimMarks(dt);
  coinsUpdate(dt);
  SKY.position.copy(cam.position);
  SUN.position.copy(cam.position).add(SUN0);
}

// both brothers face along the path toward the altar. The camera looks across it, so D (or the right arrow) walks them in
RAMA.group.position.set(START_X, 0, 0);
RAMA.post.copy(RAMA.group.position);
mface = facing = Math.PI / 2;
LAK.group.position.set(START_X - 1.6, 0, 1.5);
LAK.post.copy(LAK.group.position);
LAK.s.mface = LAK.s.facing = Math.PI / 2;
yaw = 0;
dist = 28;
// (it starts a little lower than the shared default of 0.74, so more of the land ahead is in view)
pitch = 0.62;
// the camera stays on the near side, looking north: it turns no more than about 35 degrees either way, tilts only between a
// low and a high view, and zooms only so far in and out
CAMLIM.yaw = [-0.6, 0.6];
CAMLIM.pitch = [0.5, 1.2];
CAMLIM.dist = [12, 60];
// the map for finding a way round things covers the level's own ground
NAV.box = [X0, ZN, EX, ZS];

// ---------- health and mana ----------
// the camp's demons can hurt the brothers, but nothing yet happens at zero. Rama's astras draw on his mana, which comes back slowly
RAMA.hp = RAMA.hpMax = 640;
LAK.hp = LAK.hpMax = 560;
RAMA.mp = RAMA.mpMax = 100;
// (his comes back at seven a second: one Agneyastra's worth in about three and a half seconds)
RAMA.mpRegen = 7;
// Lakshmana has stamina instead: every quick shot spends some, and with none left he reloads only as fast as Rama until it comes back
LAK.st = LAK.stMax = 100;
const COST = { 'Agneyastra · fire': 25, 'Vayavyastra · wind': 10, Manavastra: 20, 'Nagastra · serpent': 25, Brahmastra: 60 };
for (const k of KINDS) k.cost = COST[k.name] || 0;

// ---------- the goal ----------
// What to do next: one line, said in the same place as everything else that is told to the player (see the instructions,
// below). There is no list of objectives: only ever the one thing in front of him. Nothing, while a scene is playing
function goal() {
  const C = CAMPS;
  if (ARR.step === 'wait') return C[0].seen && !C[0].rescued ? 'Free the villagers.' : 'Follow the road to Vishwamitra’s hermitage.';
  if (!ARR.talked) return '';
  // one thing at a time: first the lamps are to be built, and only when all stand are they to be lit. The astra's name and
  // the count are picked out in gold, so they do not run into the rest of the line
  const n = LAMPS.length,
    built = LAMPS.filter((l) => l.built).length,
    lit = LAMPS.filter((l) => l.lit).length,
    gold = (t) => `<em style="font-style:normal;color:#ffd08a">${t}</em>`;
  if (built < n) return `Build the lamps. ${gold(built + ' of ' + n)}`;
  // every lamp stands, dark: the night is his to begin when he is ready
  if (NIGHT.on) return WAVE.msg;
  // (said before the first night only: after that he knows)
  return !LAMPS.every((l) => l.ready) || dayN() > 1 ? '' : 'Call the night from any of the four symbols.';
}

// ---------- the party: a card for each brother, to switch between them and to show how they are ----------
const NAMES = { rama: 'Rama', lak: 'Lakshmana' },
  cards = {},
  // a sword for the damage of one arrow, and a clock for attack speed
  ICON_ATK =
    '<svg viewBox="0 0 16 16"><path d="M14 2 L 13.6 5 L 7.4 11.2 L 4.8 8.6 L 11 2.4 Z" fill="#ffd08a"/><path d="M3.4 7.6 L 8.4 12.6" stroke="#ffd08a" stroke-width="1.8" stroke-linecap="round"/><path d="M5.2 10.8 L 2.4 13.6" stroke="#c9902e" stroke-width="2" stroke-linecap="round"/><circle cx="2" cy="14" r="1.2" fill="#ffd08a"/></svg>',
  ICON_SPD =
    '<svg viewBox="0 0 16 16" fill="none" stroke="#ffd08a" stroke-width="1.6" stroke-linecap="round"><circle cx="8" cy="8.5" r="5.5"/><path d="M8 5.5v3l2 1.5M6.5 1.8h3"/></svg>';
// (on this page they sit in the bottom left corner; set here, since the stylesheet may be an old cached one)
$('party').style.cssText = 'top:auto;bottom:16px;left:16px';
for (const h of HEROES) {
  const c = document.createElement('button');
  c.className = 'card';
  c.dataset.w = h.name;
  c.innerHTML = `<img alt=""><span><b>${NAMES[h.name]}</b><i class="hp"><s></s></i>${h.mp !== undefined ? '<i class="mp"><s></s></i>' : ''}${h.st !== undefined ? '<i class="st"><s></s></i>' : ''}<em>${ICON_ATK}<u class="atk"></u>${ICON_SPD}<u class="spd"></u></em></span>`;
  // (styled here rather than in the stylesheet, which the browser may have kept from before)
  const em = c.querySelector('em');
  em.style.cssText = 'display:flex;align-items:center;gap:5px;font:600 14px var(--f);font-style:normal;color:#f3dcb4;letter-spacing:.04em';
  for (const u of em.querySelectorAll('u')) u.style.cssText = 'text-decoration:none;margin-right:8px';
  for (const v of em.querySelectorAll('svg')) v.style.cssText = 'width:13px;height:13px;flex:none';
  // (the picture square and without its gold border, not cut to a circle; set here, as the stylesheet may be an old cached one)
  c.querySelector('img').style.border = 'none';
  c.querySelector('img').style.borderRadius = '0';
  c.querySelector('img').style.background = 'none';
  c.onclick = () => selectHero(h.name);
  $('party').append(c);
  cards[h.name] = c;
}
// a portrait is a small photograph of the hero's own head, taken once after he has settled into his pose
// A portrait is a small photograph of someone's own head. snap() takes one of anybody: the head bone, which way he faces, and his own group
function snap(head, yaw, own) {
  const S = 144,
    rt = new THREE.WebGLRenderTarget(S, S),
    pc = new THREE.PerspectiveCamera(15, 1, 0.1, 30),
    hp = head.getWorldPosition(V3()).add(V3(0, 0.13, 0)),
    a = yaw + 0.35,
    fog = scene.fog,
    // everyone else, and the bows and nocked arrows, step out of the picture
    hide = [...HEROES.map((o) => o.group), ...HEROES.flatMap((o) => [o.bow, o.nock])].filter((o) => o !== own && o.visible);
  hide.forEach((o) => (o.visible = false));
  pc.position.set(hp.x + Math.sin(a) * 1.7, hp.y + 0.04, hp.z + Math.cos(a) * 1.7);
  pc.lookAt(hp);
  scene.fog = null;
  // where the camera sees past everything there is no sky to photograph, so a soft warm one is put there for the picture
  const back = scene.background;
  scene.background = new THREE.Color(0xd9c9a0);
  renderer.setRenderTarget(rt);
  renderer.render(scene, pc);
  scene.background = back;
  const px = new Uint8Array(S * S * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, S, S, px);
  renderer.setRenderTarget(null);
  scene.fog = fog;
  hide.forEach((o) => (o.visible = true));
  rt.dispose();
  // the picture comes back upside down and in linear light: flip it and brighten it for the screen
  const cv2 = document.createElement('canvas');
  cv2.width = cv2.height = S;
  const g = cv2.getContext('2d'),
    im = g.createImageData(S, S);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4,
        j = ((S - 1 - y) * S + x) * 4;
      for (let k = 0; k < 3; k++) im.data[i + k] = 255 * Math.pow(px[j + k] / 255, 1 / 2.2);
      im.data[i + 3] = 255;
    }
  g.putImageData(im, 0, 0);
  return cv2.toDataURL();
}
// each brother's goes on his card, and is kept for when he speaks
// The brothers' own portraits are drawn rather than photographed, in the Firelight manner of the art studies: lit by one
// source, the sacred fire low on the left, and every form shaded in three tones from it — a dark body, a lit band pushed
// toward the fire, and a thin warm rim along the edge that faces it. A god's halo glows behind each head, and nothing else: the picture is cut out, like a sticker, with no background or frame.
// They face right: everything is drawn facing left, then the whole picture is turned over (so the fire's light falls from the right).
// Both are seen in profile, facing the fire: boys still, with no crowns, their hair tied up in a student's knot. Both have the same
// face; what tells them apart is the skin (Rama's blue, Lakshmana's fair) and the cloth over the shoulder
function drawnFace(o) {
  // toward the light (left and a little below), how far the lit band is pushed, and how wide the rim is
  const LX = -0.94,
    LY = 0.34,
    RIM = '#ffdca8';
  let n = 0;
  // one form in three tones: its outline is d (a path), its colours [dark, lit]
  const shade = (d, [dk, md], s = 3.2, r = 0.9) => {
    const id = 'f' + n++;
    return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})"><path d="${d}" fill="${dk}"/><g transform="translate(${LX * s} ${LY * s})"><g clip-path="url(#${id})"><path d="${d}" fill="${RIM}"/><path d="${d}" fill="${md}" transform="translate(${-LX * (s + r)} ${-LY * (s + r)})"/></g></g></g>`;
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs>
  <radialGradient id="halo"><stop offset="0" stop-color="#fff0b8" stop-opacity=".9"/><stop offset=".6" stop-color="#ffc860" stop-opacity=".55"/><stop offset=".86" stop-color="#ff9a40" stop-opacity=".35"/><stop offset="1" stop-color="#ff9a40" stop-opacity="0"/></radialGradient>
</defs>
<g transform="translate(100 0) scale(-1 1)">
<g opacity=".42">
<circle cx="53" cy="42" r="31" fill="url(#halo)"/>
<circle cx="53" cy="42" r="27" fill="none" stroke="#ffd98a" stroke-width="1.2" opacity=".9"/>
<circle cx="53" cy="42" r="30.2" fill="none" stroke="#ffd98a" stroke-width=".6" opacity=".6"/>
${Array.from({ length: 24 }, (_, i) => {
  const a = (i / 24) * Math.PI * 2;
  return `<circle cx="${(53 + Math.cos(a) * 28.6).toFixed(2)}" cy="${(42 + Math.sin(a) * 28.6).toFixed(2)}" r=".75" fill="#fff0c0"/>`;
}).join('')}
</g>
${shade('M10 100 C 13 84, 28 77, 42 75 L 60 75 C 74 77, 88 84, 91 100 Z', o.skinT, 10)}
${shade('M42 74 C 41.5 68, 43.5 63, 45 60 L 56 58 C 57 64, 58 70, 59.5 76 C 53 78.5, 47 78, 42 74 Z', o.skinT, 5)}
${shade('M10 100 C 14 88, 24 81, 36 78 L 62 100 Z', o.clothT, 7)}
<path d="M17 92 C 25 85, 31 81, 37 79" stroke="${o.clothEdge}" stroke-width="1.8" fill="none"/>
<path d="M40 76.5 C 43 88, 57 88, 61 76" stroke="#8a5a18" stroke-width="3.4" fill="none"/>
<path d="M40 76.5 C 43 88, 57 88, 61 76" stroke="#f0b93a" stroke-width="1.8" fill="none" transform="translate(-0.4 -0.3)"/>
<circle cx="49" cy="86.4" r="3" fill="#a8202a" stroke="#f0b93a" stroke-width="1.2"/>
${shade('M44 31 C 38.5 33, 36.6 38, 37 42.6 C 36.8 44.5, 36.2 45.6, 35.6 46.8 C 34.2 49, 32.3 51.6, 32.8 53 C 33.4 54.2, 35.4 54.4, 36.9 54.6 C 36.4 55.6, 36.3 56.5, 36.9 57.1 C 36.4 57.9, 36.6 59, 37.5 59.8 C 37.2 61.6, 37.8 63.6, 39.8 64.7 C 43.5 66.6, 48.5 66.8, 52.5 64.2 C 56.5 61.6, 59.5 57.5, 61 52.5 C 63.5 45, 63.5 36.5, 58 32 C 54 29.4, 48.5 29.4, 44 31 Z', o.skinT, 7, 1.1)}
<path d="M39.8 64.7 C 43.5 66.6, 48.5 66.8, 52.5 64.2 L 53 66 C 48.5 68.6, 43 68.2, 40.5 66.6 Z" fill="${o.skinT[0]}" opacity=".9"/>
${shade('M40 37.5 C 40.5 30.5, 48 27, 56 28.3 C 66 30.2, 70.5 39.5, 69.6 51.5 C 69 61.5, 70.5 71.5, 74.5 81.5 C 68.5 84, 62.5 80.5, 60.5 74.5 C 58.8 67, 58.2 60.5, 58.8 55 C 58.4 50, 56 46, 52.5 44 C 48.5 41.5, 44 39.5, 40 37.5 Z', ['#0c0814', '#2e1f38'], 4)}
${shade('M54.2 49 C 54.6 45.8, 58.6 45.8, 59 49.4 L 59 54.6 C 58.6 57.6, 55 57.8, 54.6 55 Z', o.skinT, 1.6, 0.7)}
<path d="M55.6 50 C 56.6 49.4, 57.6 50.5, 57.2 52.5" stroke="${o.skinT[0]}" stroke-width=".9" fill="none"/>
${shade('M50.5 30 C 48.5 25, 51 19.5, 56 19.5 C 61 19.5, 63.5 24.5, 61.5 29 C 59 31.5, 53 31.5, 50.5 30 Z', ['#0c0814', '#2e1f38'], 2.6)}
<path d="M50.8 29.2 C 54 31.4, 58.5 31.4, 61.3 28.6" stroke="#8a5a18" stroke-width="2.2" fill="none"/>
<path d="M50.8 28.8 C 54 31, 58.5 31, 61.3 28.2" stroke="#f0b93a" stroke-width="1" fill="none"/>
<circle cx="56.6" cy="59.6" r="2" fill="none" stroke="#8a5a18" stroke-width="1.8"/><circle cx="56.3" cy="59.4" r="2" fill="none" stroke="#f0b93a" stroke-width=".9"/>
<path d="M37 45.6 Q 40.6 42.9 44.6 45 Q 40.8 44.2 37 45.6 Z" fill="#120a18"/>
<path d="M38 48.5 Q 40.9 46 43.8 48 Q 41 50.4 38 48.5 Z" fill="#f4ecdc"/><circle cx="39.9" cy="48.3" r="1.45" fill="#120a18"/><circle cx="39.4" cy="47.8" r=".45" fill="#fff"/>
<path d="M37.9 48.4 Q 40.9 45.8 43.8 48 L 45 47.2" stroke="#120a18" stroke-width="1.1" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
<path d="M36.8 57.3 Q 38.4 58.4 40.2 57.4" stroke="#5a1424" stroke-width="1.2" fill="none" stroke-linecap="round"/>
<path d="M35.6 53.6 Q 37 54.2 37.9 53" stroke="${o.skinT[0]}" stroke-width="1" fill="none" stroke-linecap="round"/>
<path d="M38 36.6 L 38.6 43.4 M41 36.4 L 41 43.2" stroke="#fff3df" stroke-width="1" stroke-linecap="round"/>
<path d="M39.6 37.4 L 39.7 43" stroke="#d4313a" stroke-width="1.2" stroke-linecap="round"/>
</g>
</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
const FACES = {
  rama: drawnFace({ skinT: ['#2a4a86', '#5d97da'], clothT: ['#b0661a', '#f2b632'], clothEdge: '#c9461e' }),
  lak: drawnFace({ skinT: ['#94603e', '#e6b583'], clothT: ['#1f3a76', '#4a7ccc'], clothEdge: '#f0c050' }),
};
// ---------- Rama's astras ----------
// Rama carries one kind of arrow at a time, and it stays chosen until he changes it: plain arrows, or an astra once it has been
// given (Agni, from Vishwamitra, after his talk). Everything he looses is of the chosen kind, with the ordinary fire buttons.
//   choosing   1 for plain arrows, 2 for the first astra, and so on; Q swaps between plain arrows and the astra last used;
//              or click a slot. The slots are a row in the top left corner, and exactly one is always lit: the one in use
//   the cost   an astra is dear: each one takes a quarter of his strength (mana), so a full measure is four. The lights under
//              its slot show how many he can loose right now, and the next one filling as his strength comes back. With too little for even one, the slot is dark and will not
//              be chosen (it shakes its head); and when the last one he can afford has gone, the astra puts itself away and
//              he is back on plain arrows, without the player having to do anything
//   seeing it  besides the slot, the choice shows where the player is looking: the arrow on the string and the aiming mark
//              take the astra's colour (the shared code does that), and a puff of that colour bursts at the bow as he changes
const ASTRA = { have: [0], armed: 0, last: 0, slots: [] },
  ASTRA_ICON = {
    0: '<svg viewBox="0 0 20 20" fill="#f0dcb4"><path d="M17.8 2.2 L 15.9 8.9 L 13.9 7.5 L 12.5 6.1 L 11.1 4.1 Z"/><path d="M4 16 L 13.2 6.8" stroke="#f0dcb4" stroke-width="1.2" stroke-linecap="round" fill="none"/><path d="M8.6 11.4 L 5.2 11 L 2.2 14 L 5.2 14.2 Z"/><path d="M8.6 11.4 L 9 14.8 L 6 17.8 L 5.8 14.8 Z"/></svg>',
    1: '<svg viewBox="0 0 20 20"><path fill="#f0dcb4" fill-rule="evenodd" d="M10.6 1.6 C 11 5.2, 15.8 7.6, 15.8 12.2 C 15.8 15.8, 13.2 18.4, 10 18.4 C 6.8 18.4, 4.2 15.8, 4.2 12.4 C 4.2 10, 5.4 8.4, 6.6 7 C 6.8 8.6, 7.4 9.6, 8.4 10.2 C 8 7, 8.8 3.8, 10.6 1.6 Z M10.2 10.4 C 10.2 12.4, 12.6 13.2, 12.6 15 C 12.6 16.3, 11.5 17.2, 10 17.2 C 8.5 17.2, 7.4 16.3, 7.4 15 C 7.4 14, 8 13.4, 8.6 12.8 C 8.8 13.4, 9.2 13.8, 9.6 13.9 C 9.4 12.6, 9.6 11.4, 10.2 10.4 Z"/></svg>',
  },
  ASTRA_NAME = { 0: 'Arrow', 1: 'Agneyastra' },
  astraCol = (k) => '#' + KINDS[k].color.toString(16).padStart(6, '0');
{
  const bar = document.createElement('div');
  // (the arrow on Rama's bow sits in the bottom left corner; the count of wood keeps the top left)
  bar.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:14;display:flex;gap:8px;align-items:flex-end;transition:opacity .3s';
  const row = document.createElement('div');
  row.style.cssText = 'position:fixed;left:16px;top:16px;z-index:14;display:flex;flex-direction:column;gap:18px;align-items:flex-start';
  document.body.append(row, bar);
  ASTRA.row = row;
  ASTRA.bar = bar;
}
// Rama's kind of arrow: the global while he is the one being played, otherwise kept in his saved state
function setRamaKind(k) {
  // (both, always: his saved state is what is loaded back whenever the heroes are switched or set up, and a kind chosen
  // before that, as on a dev start, was otherwise lost while the icon went on showing it)
  if (RAMA.s) RAMA.s.kind = k;
  if (SEL === RAMA) kind = k;
}
// choose a kind. why: 'spent' when an astra has put itself away. Returns false if it could not be chosen
function armAstra(k, why) {
  const b = ASTRA.slots.find((o) => o.k === k);
  if (!b || k === ASTRA.armed) return false;
  if (KINDS[k].cost > RAMA.mp) {
    b.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 220 });
    return false;
  }
  ASTRA.armed = k;
  if (k) ASTRA.last = k;
  setRamaKind(k);
  // seen at the bow: a burst in the new colour, or a wisp of grey smoke when an astra has gone out
  if (SEL === RAMA) puff(tmpA.copy(RAMA.hL), why === 'spent' ? 0x9a9088 : KINDS[k].color, why === 'spent' ? 10 : 18, 1.6, 0.45, why === 'spent' ? -1.5 : 0, 0.15);
  b.animate([{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 180, easing: 'ease-out' });
  astraDraw();
  return true;
}
function astraSlot(k) {
  const b = document.createElement('i'),
    n = ASTRA.slots.length + 1,
    max = KINDS[k].cost ? Math.floor(RAMA.mpMax / KINDS[k].cost) : 0;
  b.style.cssText =
    'position:relative;flex:none;width:42px;height:42px;border-radius:50%;background:rgba(22,22,24,.88);display:grid;place-items:center;font-style:normal;cursor:pointer';
  b.innerHTML =
    // (the icon in its own pale colour on a dark disc, like the coin's count across the screen; no key number on it)
    `<span style="width:26px;height:26px;display:block;transition:opacity .15s">${ASTRA_ICON[k]}</span>` +
    // one light for each he could loose on a full measure, lit for each he can loose now
    `<u style="position:absolute;left:2px;right:2px;bottom:-11px;display:flex;justify-content:center;gap:2px;text-decoration:none">${'<s style="flex:1;max-width:11px;height:5px;border-radius:2px;background:rgba(22,22,24,.6)"></s>'.repeat(max)}</u>`;
  b.addEventListener('click', () => who === 'rama' && !LOCK && armAstra(k));
  b.k = k;
  b.icon = b.firstChild;
  b.pips = [...b.querySelectorAll('s')];
  ASTRA.bar.append(b);
  ASTRA.slots.push(b);
  return b;
}
function astraDraw() {
  // (only the brother being played chooses; left to himself Rama keeps to plain arrows)
  if (SEL !== RAMA && ASTRA.armed) {
    ASTRA.armed = 0;
    RAMA.s.kind = 0;
  }
  ASTRA.bar.style.opacity = SEL === RAMA ? 1 : 0.45;
  for (const b of ASTRA.slots) {
    const on = b.k === ASTRA.armed,
      col = astraCol(b.k),
      cost = KINDS[b.k].cost,
      can = cost ? Math.floor(RAMA.mp / cost) : 1;
    b.icon.style.opacity = can ? 0.95 : 0.3;
    // only the arrow now on the bow is shown, with a dot beside it for each he can loose
    b.style.display = on ? 'grid' : 'none';
    // each light full for one he can loose; the next fills from the left, dimmer, as that one comes back
    const part = cost ? Math.round(((RAMA.mp % cost) / cost) * 100) : 0;
    b.pips.forEach(
      (s, i) => (s.style.background = i < can ? col : i === can ? `linear-gradient(90deg, ${col}99 ${part}%, rgba(22,22,24,.6) ${part}%)` : 'rgba(22,22,24,.6)'),
    );
  }
}
astraSlot(0);
astraDraw();
// an astra given: its slot appears with a flash, and the power is seen entering Rama
function giveAstra(k) {
  if (ASTRA.have.includes(k)) return;
  ASTRA.have.push(k);
  const b = astraSlot(k);
  b.animate([{ transform: 'scale(2)', boxShadow: '0 0 24px #ffb050' }, { transform: 'scale(1)', boxShadow: '0 0 0 transparent' }], { duration: 700, easing: 'ease-out' });
  // and the gift shows on Rama himself (see astraFx)
  ASTRA.fx = GIFT.T;
  ASTRA.fxCol = KINDS[k].color;
  ASTRA.fxK = k;
  astraDraw();
}
// The gift, shown as something passing to Rama, not just happening near him:
//   first   four tongues of flame leave Vishwamitra's raised palm one after another and arc across to his chest, each leaving a trail
//   then    a ring of light on the ground closes in on him from five paces out, and a soft column of light stands over him
//   last    a small burst at his chest, and a line of words at the top of the screen says what he has received and its key
const GIFT = { T: 2.6, from: V3(), hand: V3() },
  // his arm as he gives: up and out in front of him, the forearm a little raised, the palm turned forward
  GIVE = {
    arm: new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.45, 0, 0.12)),
    fore: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.3, 0, 0)),
    hand: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.9, 0, 0)),
  };
{
  const m = (o) => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, ...o });
  GIFT.beam = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 10, 24, 1, true), m());
  GIFT.ring = new THREE.Mesh(new THREE.RingGeometry(0.88, 1, 64), m());
  GIFT.ring.rotation.x = -Math.PI / 2;
  // the column's dressing: three thin hoops of light that climb it one after another, narrowing as they rise
  GIFT.hoops = [0, 1, 2].map(() => {
    const h = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48), m());
    h.rotation.x = -Math.PI / 2;
    return h;
  });
  // and the fire itself: four small flames, each a bright heart in a halo, the same as float over Rama afterwards
  GIFT.orbs = [0, 1, 2, 3].map(() => {
    const o = { g: glow(0xffffff, 1), c: glow(0xfff2c0, 1) };
    o.g.visible = o.c.visible = false;
    scene.add(o.g, o.c);
    return o;
  });
  GIFT.all = [GIFT.beam, GIFT.ring, ...GIFT.hoops];
  GIFT.all.forEach((o) => {
    o.visible = false;
    o.frustumCulled = false;
    scene.add(o);
  });
}
function astraFx(dt) {
  if (!(ASTRA.fx > 0)) return;
  const P = RAMA.group.position,
    first = ASTRA.fx === GIFT.T,
    t = GIFT.T - ASTRA.fx,
    col = ASTRA.fxCol,
    // (his chest is lower while he sits)
    ch = RAMA.sat ? 0.75 : 1.3;
  ASTRA.fx -= dt;
  if (first) {
    GIFT.all.forEach((o) => (o.visible = true));
    GIFT.all.forEach((o) => o.material.color.set(col));
  }
  // where it comes from: the palm of Vishwamitra's raised hand, which flares as each flame leaves it
  V.bone.handR.getWorldPosition(GIFT.hand);
  const F = GIFT.from.lerp(GIFT.hand, first ? 1 : Math.min(1, dt * 10)),
    dx = P.x - F.x,
    dz = P.z - F.z,
    far = Math.hypot(dx, dz) || 1;
  if (ASTRA.fx > 0.9 && Math.random() < dt * 40) puff(F, col, 2, 0.5, 0.35, -1, 0.12);
  // the tongues of flame: each takes 0.9 s to cross from his palm to Rama's chest, rising in an arc on the way and swinging
  // out to one side or the other (both by an amount that suits how far apart the two are)
  for (let j = 0; j < 4; j++) {
    const u = (t - j * 0.22) / 0.9,
      orb = GIFT.orbs[j];
    orb.g.visible = orb.c.visible = u >= 0 && u <= 1;
    if (u < 0 || u > 1) continue;
    const e = u * u * (3 - 2 * u),
      side = (j % 2 ? 1 : -1) * Math.sin(Math.PI * u) * Math.min(0.9, far * 0.3);
    if (u < dt / 0.9 + 1e-3) flash(F, col, 10);
    tmpA.set(F.x + dx * e - (dz / far) * side, F.y + (P.y + ch - F.y) * e + Math.sin(Math.PI * u) * Math.min(2.2, far * 0.45), F.z + dz * e + (dx / far) * side);
    // the flame itself, flickering as it flies (swelling as it leaves the palm, and again as it reaches him), and its trail
    const fl = (0.75 + 0.5 * Math.sin(Math.PI * u)) * (1 + 0.14 * Math.sin(T * 19 + j * 2.1));
    orb.g.position.copy(tmpA);
    orb.c.position.copy(tmpA);
    orb.g.material.color.set(col);
    orb.g.scale.setScalar(0.85 * fl);
    orb.c.scale.setScalar(0.32 * fl);
    puff(tmpA, col, 3, 0.5, 0.45, -0.6, 0.25);
    // as each arrives it flares at his chest
    if (u + dt / 0.9 > 1) {
      flash(tmpA.set(P.x, P.y + ch, P.z), col, 8);
      puff(tmpA, col, 14, 1.6, 0.4, 0, 0.2);
    }
  }
  // the ring closing in, and the column over him, from when the first flame lands
  const v = Math.max(0, Math.min(1, (t - 0.9) / 1.2)),
    k = Math.min(1, Math.max(0, t - 0.9) / 0.3) * Math.min(1, ASTRA.fx / 0.5);
  GIFT.ring.position.set(P.x, P.y + 0.12, P.z);
  GIFT.ring.scale.setScalar(5 - 4.5 * v * v);
  GIFT.ring.material.opacity = v > 0 && v < 1 ? 0.2 + 0.6 * v : 0;
  GIFT.beam.position.set(P.x, P.y + 5, P.z);
  GIFT.beam.scale.set(0.75, 1, 0.75);
  GIFT.beam.material.opacity = 0.25 * k;
  GIFT.hoops.forEach((h, i) => {
    const u = (t * 0.8 + i / 3) % 1;
    h.position.set(P.x, P.y + 0.2 + u * 5.2, P.z);
    h.scale.setScalar(0.95 - 0.3 * u);
    h.material.opacity = 0.75 * k * Math.sin(Math.PI * u);
  });
  // and sparks winding up round it, two threads on opposite sides
  if (k > 0.2)
    for (let i = 0; i < 2; i++) {
      const a = t * 7 + i * Math.PI,
        u = (t * 0.9 + i * 0.5) % 1;
      puff(tmpA.set(P.x + Math.cos(a) * 0.8, P.y + 0.3 + u * 4.6, P.z + Math.sin(a) * 0.8), i ? 0xfff0c0 : col, 1, 0.15, 0.28, -0.4, 0.12);
    }
  if (ASTRA.fx <= 0) {
    GIFT.all.forEach((o) => (o.visible = false));
    GIFT.orbs.forEach((o) => (o.g.visible = o.c.visible = false));
    // (it is his now, but not put on the bow for him: he chooses it himself)
    puff(tmpA.set(P.x, P.y + ch, P.z), col, 30, 2.6, 0.7, 1, 0.3);
  }
}
// the words: a small notice at the top of the screen, dressed like the dialogue box (the same dark panel, gold rule and
// lettering) but a fraction of its size, and it asks nothing of the player: it comes, stays a few seconds, and goes
function astraSaid(k) {
  const n = ASTRA.slots.findIndex((b) => b.k === k) + 1,
    el = document.createElement('div');
  el.style.cssText =
    'position:fixed;left:50%;top:20px;transform:translate(-50%,-8px);z-index:25;display:flex;align-items:center;gap:10px;padding:8px 16px 8px 11px;pointer-events:none;' +
    'color:#fff3df;background:linear-gradient(#2b2b2ef2,#1a1a1cf2);border:2px solid #e9c07a;border-radius:8px;' +
    'box-shadow:0 0 0 1px #1a1a1c,0 0 0 4px rgba(233,192,122,.28),0 10px 28px rgba(0,0,0,.5);opacity:0;transition:opacity .3s,transform .3s';
  el.innerHTML =
    `<span style="width:24px;height:24px;flex:none">${ASTRA_ICON[k].replaceAll('#f0dcb4', astraCol(k))}</span>` +
    `<span style="display:flex;flex-direction:column;gap:1px"><b style="font:700 12px var(--f);letter-spacing:.16em;text-transform:uppercase;color:#ffd08a">${ASTRA_NAME[k]} received</b>` +
    `<span style="font:italic 500 17px var(--f)">Press ${n} to take it up · 1 for plain arrows</span></span>`;
  document.body.append(el);
  requestAnimationFrame(() => {
    el.style.opacity = 1;
    el.style.transform = 'translate(-50%,0)';
  });
  setTimeout(() => (el.style.opacity = 0), 5200);
  setTimeout(() => el.remove(), 5600);
}
// when he can no longer afford another of the astra he is using, it puts itself away and he is back on plain arrows
AFTER_SHOT = (h) => {
  if (h === RAMA && ASTRA.armed && RAMA.mp < KINDS[ASTRA.armed].cost) armAstra(0, 'spent');
  else if (h === RAMA) astraDraw();
};
// The number keys choose Rama's arrow (1 plain, 2 the first astra, …) and Q swaps between plain and the astra last used.
// These are caught first, before the shared controls see them (which use the numbers for his walk and Q and E to run through
// every astra there is); while someone is speaking the keys are left to the dialogue box
addEventListener(
  'keydown',
  (e) => {
    if (talking()) return;
    const m = /^Digit([1-9])$/.exec(e.code);
    if (!m && e.code !== 'KeyQ' && e.code !== 'KeyE') return;
    e.stopImmediatePropagation();
    if (e.repeat || who !== 'rama' || LOCK) return;
    if (m) {
      const b = ASTRA.slots[+m[1] - 1];
      if (b) armAstra(b.k);
    } else if (e.code === 'KeyQ') armAstra(ASTRA.armed ? 0 : ASTRA.last || (ASTRA.slots[1] ? ASTRA.slots[1].k : 0));
  },
  true,
);

// ---------- the lamps ----------
// Four plain clay lamps on stands are set in the grass round the worn ground, one toward each corner, not quite evenly: inside
// the loop of road, clear of every road and of the straight ways in to the fire from west, east, south and the hall, so nobody
// walks into one and together they light the whole court. They are cold until Rama lights them: an Agneyastra that flies through one, or lands within a few
// paces of it, sets its bowl burning, and it burns from then on, a flame with a light of its own, so there is light there at night.
// Tejas: what lamps are bought with. Its sign is an old punch-marked coin: a round piece of worn silver with a thick edge,
// stamped with a sun, a crescent and a few dots
const TEJAS_ICON =
  '<svg viewBox="0 0 24 24" width="100%" height="100%"><defs><linearGradient id="tjF" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6e0d2"/><stop offset=".55" stop-color="#bdb6a5"/><stop offset="1" stop-color="#8f8878"/></linearGradient></defs><circle cx="12" cy="13.4" r="8.8" fill="#5f594c"/><circle cx="12" cy="12" r="8.8" fill="#7b7465"/><circle cx="12" cy="10.6" r="8.8" fill="url(#tjF)"/><g fill="none" stroke="#6a6355" stroke-width="1.1" stroke-linecap="round"><circle cx="9.6" cy="8.8" r="1.4"/><path d="M11.8 8.8L13.0 8.8M10.7 10.7L11.3 11.7M8.5 10.7L7.9 11.7M7.4 8.8L6.2 8.8M8.5 6.9L7.9 5.9M10.7 6.9L11.3 5.9"/><path d="M13.8 11.6a2.5 2.5 0 1 0 3.4 1.2"/></g><g fill="#6a6355"><circle cx="15.4" cy="6.6" r=".8"/><circle cx="8.2" cy="14" r=".8"/><circle cx="10.8" cy="15.2" r=".8"/></g><path d="M5.6 6.6A8 8 0 0 1 16.6 3.6" fill="none" stroke="#fffaf0" stroke-opacity=".7" stroke-width=".9" stroke-linecap="round"/></svg>',
  WOOD_ICON =
  '<svg viewBox="0 0 20 20"><g fill="none" stroke="#f0dcb4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5 L 13 4.2 a2.3 2.3 0 0 1 2 4.2 L 5.5 12.7"/><circle cx="4.5" cy="10.6" r="2.3"/><path d="M6 15.8 L 15.5 11.5 a2.3 2.3 0 0 1 2 4.2" opacity=".7"/></g></svg>';
const PED = 0.3,
  LAMP_COST = 2,
  // how long a lamp takes to put itself together once paid for, and how long each piece is in the air
  LAMP_T = 0.8,
  PIECE_T = 0.22,
  // the ghost: the lamp that could stand here, shown faint while Rama is near enough to build it
  GHOST = new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.3, depthWrite: false, fog: false });
// The lamp's outline from the middle out, bottom to top, in the three pieces it is made of: the stepped foot, the slender
// stem with its rings, and the dish at the top with the knob in its middle
const LAMP_PROF = [
  [
    [0, 0],
    [0.66, 0],
    [0.7, 0.08],
    [0.54, 0.17],
    [0.58, 0.24],
    [0.36, 0.36],
    [0.2, 0.5],
    [0.13, 0.7],
    [0, 0.7],
  ],
  [
    [0, 0.7],
    [0.13, 0.7],
    [0.21, 0.82],
    [0.11, 0.95],
    [0.1, 1.45],
    [0.19, 1.55],
    [0.1, 1.66],
    [0.1, 1.9],
    [0, 1.9],
  ],
  [
    [0, 1.9],
    [0.1, 1.9],
    [0.23, 2.0],
    [0.14, 2.08],
    [0.36, 2.2],
    [0.54, 2.31],
    [0.56, 2.38],
    [0.5, 2.38],
    [0.36, 2.3],
    [0.12, 2.32],
    [0.16, 2.46],
    [0.09, 2.54],
    [0, 2.6],
  ],
].map((pr) => new THREE.LatheGeometry(pr.map(([r, h]) => new THREE.Vector2(r, h)), 20));
const LAMPS = [
  [-10.9, -10.2],
  [10.4, -11],
  [-10.2, 10.7],
  [11.1, 10.3],
].map(([x, z]) => {
  // Each place is one low round platform of stone, there from the start. The lamp that Rama builds on it is a standing lamp
  // of the shape kept in temples, but a hermitage's own: turned from plain fired clay and no taller than a man's shoulder,
  // with five spouts round the rim of its dish and a wick in each. Lit, it burns with five small flames.
  // It is kept as separate pieces (foot, stem, dish, and the five spouts), each unseen until it flies in to its place
  const y = groundY(x, z),
    G = new THREE.Group(),
    clay = PAVE.clay,
    deep = toon(0x2e1c12, { rim: 0 }),
    parts = [],
    // a piece: what it is made of, and when after the start it sets off. It comes in from up and to one side
    piece = (t0, a) => {
      const o = new THREE.Group();
      o.visible = false;
      G.add(o);
      parts.push({ o, t0, from: V3(Math.sin(a) * 2.6, 3.4, Math.cos(a) * 2.6), down: false });
      return o;
    };
  add(scene, new THREE.CylinderGeometry(0.56, 0.62, PED, 24), PAVE.stone2, [x, y + PED / 2, z]);
  G.position.set(x, y + PED, z);
  G.scale.setScalar(0.6);
  scene.add(G);
  const turn = Math.random() * 6.28;
  LAMP_PROF.forEach((geo, i) => add(piece(i * 0.14, turn + i * 2.3), geo, clay));
  // the oil, dark in the dish (it comes with the dish)
  add(parts[2].o, new THREE.CylinderGeometry(0.42, 0.42, 0.03, 16), deep, [0, 2.33, 0]).castShadow = false;
  const fm = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.95, depthWrite: false, fog: false }),
    flame = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3,
      sx = Math.sin(a),
      cz = Math.cos(a);
    // a spout: a little lip pushed out from the rim, pointing outward. Each comes in from its own side, one after another
    add(piece(0.42 + i * 0.04, a), new THREE.ConeGeometry(0.13, 0.34, 6), clay, [sx * 0.62, 2.35, cz * 0.62], [0, 0, 0], [1, 1, 0.55]).rotation.set(Math.PI / 2 - 0.15, a, 0, 'YXZ');
    // and its flame, two cones one inside the other, hidden until the lamp is lit
    const f = new THREE.Group();
    add(f, new THREE.ConeGeometry(0.11, 0.42, 7), fm(0xff8a20), [0, 0.21, 0]).castShadow = false;
    add(f, new THREE.ConeGeometry(0.06, 0.27, 7), fm(0xffe9a0), [0, 0.15, 0]).castShadow = false;
    f.position.set(sx * 0.72, 2.4, cz * 0.72);
    flame.add(f);
  }
  flame.visible = false;
  G.add(flame);
  const light = new THREE.PointLight(0xffa040, 0, 28, 1.5); // (its reach was 18)
  light.position.set(0, 3.2, 0);
  G.add(light);
  SOLIDS.push({ x, z, r: 0.7 });
  // its ghost: every clay piece again, in its place, in faint light
  const ghost = new THREE.Group();
  for (const q of parts)
    for (const m of q.o.children) {
      if (m.material !== clay) continue;
      const c = new THREE.Mesh(m.geometry, GHOST);
      c.position.copy(m.position);
      c.rotation.copy(m.rotation);
      c.scale.copy(m.scale);
      ghost.add(c);
    }
  ghost.visible = false;
  G.add(ghost);
  // built: paid for and going up. ready: all its pieces are in, and it can be lit
  return { x, y: y + PED, z, G, parts, ghost, flame, light, built: false, ready: false, t: 0, lit: false, glow: 0, seed: Math.random() * 9 };
});
// (a lamp is lit only by the arrow that ends the day: no arrow aimed at one lights it, and the aim does not snap to one)
function lampOut(l) {
  l.lit = false;
  l.hits = 0;
  l.glow = 0;
  l.flame.visible = false;
  if (l.light) l.light.intensity = 0;
}
function lampLight(l) {
  if (l.lit || !l.ready) return;
  l.lit = true;
  l.flame.visible = true;
  flash(tmpA.set(l.x, l.y + 1.6, l.z), 0xffa040, 16);
  puff(tmpA, 0xffb050, 26, 2.2, 0.6, -1.5, 0.3);
}
// ---------- wood, and building ----------
// Wood is what things are built with. The men bring it in a bundle at a time; Rama has a little to begin with. The count is
// shown under the astras.
// An empty platform is a place to build. When Rama (played) stands by one, a sign comes up over it: a round Space key with a
// ring round it, and beside it what would be built and what it costs. Building is a hold, not a tap: while Space (or the mouse,
// on the sign) is held the ring fills round the key, and when it closes the wood is spent and the lamp puts itself together.
// Let go early and the ring runs back; nothing is spent. With too little wood the cost shows red and the sign shakes
const COST_HTML = `<span style="width:14px;height:14px;display:block">${TEJAS_ICON}</span><i style="font-style:normal;line-height:1;font-variant-numeric:lining-nums">${LAMP_COST}</i>`,
  MOON_ICON =
    '<svg width="22" height="22" viewBox="0 0 22 22" style="display:block"><path fill="#f0dcb4" d="M14.6 2.6 A 8.6 8.6 0 1 0 19.4 14.2 A 7 7 0 0 1 14.6 2.6 Z"/></svg>';
// (pend: what the woodcutters have earned and not yet been paid out; pendS: the same for the masons, one coin each every
// MASON_PAY_T seconds of work)
const MASON_PAY_T = 30;
const STOCK = { n: 10, pend: 0, pendS: 0, el: null, sign: null, ring: null, at: null, hold: false, k: 0 },
  RING_LEN = 2 * Math.PI * 23.5,
  HOLD_T = 0.8;
{
  const el = document.createElement('div');
  // (the count of Tejas keeps the bottom right corner)
  el.style.cssText =
    'position:fixed;right:16px;bottom:16px;z-index:14;display:flex;align-items:center;gap:9px;padding:7px 18px 7px 9px;border-radius:999px;' +
    'background:rgba(22,22,24,.88);color:#fff3df;font:700 19px var(--f)';
  el.innerHTML = `<span style="width:28px;height:28px;display:block">${TEJAS_ICON}</span><b style="font-weight:700;line-height:1;font-variant-numeric:lining-nums;position:relative;top:-1px">0</b>`;
  document.body.append(el);
  STOCK.el = el;
  const sg = document.createElement('div');
  // (one dark disc, like the arrow's across the screen, with the cost in it; the ring that fills runs round its edge.
  // Nothing else: the key is named on the instruction line, and the ghost of the lamp shows what will be built)
  sg.style.cssText =
    'position:fixed;left:0;top:0;z-index:13;display:none;align-items:center;justify-content:center;width:52px;height:52px;cursor:pointer;white-space:nowrap;user-select:none;' +
    'color:#fff3df;font:700 14px var(--f)';
  sg.innerHTML =
    `<svg width="52" height="52" viewBox="0 0 52 52" style="position:absolute;left:0;top:0"><circle cx="26" cy="26" r="26" fill="rgba(22,22,24,.88)"/>` +
    // (a faint ring marks where the one that fills will run)
    `<circle cx="26" cy="26" r="23.5" fill="none" stroke="rgba(255,208,138,.2)" stroke-width="5"/>` +
    `<circle cx="26" cy="26" r="23.5" fill="none" stroke="#ffd08a" stroke-width="5" stroke-linecap="round" stroke-dasharray="${RING_LEN}" stroke-dashoffset="${RING_LEN}" transform="rotate(-90 26 26)"/></svg>` +
    `<span style="position:relative;display:flex;align-items:center;gap:4px">${COST_HTML}</span>`;
  document.body.append(sg);
  STOCK.sign = sg;
  STOCK.ring = sg.querySelectorAll('circle')[2];
  const hold = (on) => {
    // (at a plinth that is waiting for its guard nothing is held: the guard is chosen by a click on its card)
    if (STOCK.at && STOCK.at.wait) return;
    if (on && STOCK.at && !STOCK.at.rite && (STOCK.shut || STOCK.n < costOf(STOCK.at))) {
      STOCK.denyT = T + 0.9;
      for (const o of [sg, el]) o.animate([{ translate: '0' }, { translate: '-4px' }, { translate: '4px' }, { translate: '0' }], { duration: 220 });
      return;
    }
    STOCK.hold = on;
  };
  sg.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    hold(true);
  });
  STOCK.holdFn = hold;
  addEventListener('pointerup', () => hold(false));
  addEventListener('blur', () => hold(false));
  // Space is held to build while the sign is up, instead of loosing an arrow
  addEventListener(
    'keydown',
    (e) => {
      if ((e.code !== 'Space' && e.code !== 'KeyF') || !STOCK.at || talking()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat) hold(true);
    },
    true,
  );
  addEventListener('keyup', (e) => (e.code === 'Space' || e.code === 'KeyF') && hold(false));
  // by a lamp's place or on one of the four signs the mouse's fire is the same hold: the click is taken here, before it can
  // loose an arrow
  addEventListener(
    'pointerdown',
    (e) => {
      if (e.button !== 0 || e.target !== cv || !STOCK.at || STOCK.at.wait || talking()) return;
      e.stopImmediatePropagation();
      hold(true);
    },
    true,
  );
  woodGain(0);
}
// ---------- the night begins ----------
// The night is the player's to start, from wherever he is. When all the lamps stand (dark: they do not light themselves) he
// holds N, and a ring fills over Rama's head as it does to build. Rama looses a fire arrow straight up. High over him it
// bursts, and from the burst a spark falls to every lamp and lights it, one after another, and one to the altar, where the
// fire leaps and Vishwamitra's eyes close. Nobody says anything. As it bursts the day goes, quickly: the sky down to a deep
// blue with an ember of red left at the horizon, the sun's disc paling to a moon, the light on the ground thin and blue
const NIGHT = { on: false, go: false, k: 0, from: null, key: false, t: -1, arrow: null, top: V3(), sparks: [] },
  RITE = { x: 0, y: 0, z: 0, rite: true, sign: '' },
  SIGNS_AT = [],
  RITE_R = 9,
  NIGHT_T = 5,
  // (how long Space is held on the crescent: the length of his draw)
  RITE_T = 1.7,
  RISE_T = 0.65,
  RISE_H = 24;
// (which day it is: 1 until the first night is over. From the second day on, the night cannot be called until the men of
// both far camps are free)
const dayN = () => NIGHT.day || 1,
  farFree = () => dayN() < 2 || CAMPS.every((c) => c.first || c.rescued);
function nightReady() {
  return !NIGHT.on && (!LOCK || NIGHT.lock) && !talking() && ARR.talked && LAMPS.every((l) => l.ready) && farFree();
}
// the four signs: four plastered rounds at the four quarters of the altar, made as its floor is: the same plastered earth,
// the same ochre edge and rice-flour line. Each has a sign drawn on it in rice flour: the conch to the south, the trident to
// the north, the lotus to the west and the mace to the east. Standing on any one of them, Rama may begin the night
{
  const INK = 'rgba(244,228,198,.72)',
    WASH = 'rgba(244,228,198,.2)';
  const SIGNS = {
    shankha(g) {
      g.beginPath();
      g.moveTo(-8, -64);
      g.bezierCurveTo(50, -62, 64, 0, 8, 72);
      g.bezierCurveTo(-18, 32, -54, 12, -48, -22);
      g.bezierCurveTo(-44, -48, -28, -62, -8, -64);
      g.fill();
      g.stroke();
      // (the whorls at its crown, and the lip of its mouth)
      g.beginPath();
      g.moveTo(-34, -48);
      g.quadraticCurveTo(-4, -34, 28, -52);
      g.moveTo(-46, -30);
      g.quadraticCurveTo(-4, -10, 42, -34);
      g.moveTo(-47, -8);
      g.quadraticCurveTo(-16, 8, 12, -4);
      g.moveTo(12, -4);
      g.quadraticCurveTo(30, 30, 8, 72);
      g.stroke();
    },
    trishul(g) {
      g.lineWidth = 7;
      g.beginPath();
      g.moveTo(0, 74);
      g.lineTo(0, -50);
      g.moveTo(0, -12);
      g.bezierCurveTo(-36, -10, -40, -34, -30, -62);
      g.moveTo(0, -12);
      g.bezierCurveTo(36, -10, 40, -34, 30, -62);
      g.moveTo(-13, 2);
      g.lineTo(13, 2);
      g.stroke();
      // (the three points)
      g.fillStyle = INK;
      for (const [x, y, k] of [
        [0, -50, 1],
        [-30, -62, 0.7],
        [30, -62, 0.7],
      ]) {
        g.beginPath();
        g.moveTo(x, y - 26 * k);
        g.quadraticCurveTo(x + 13 * k, y - 4 * k, x, y + 4 * k);
        g.quadraticCurveTo(x - 13 * k, y - 4 * k, x, y - 26 * k);
        g.fill();
      }
    },
    padma(g) {
      // (the outer petals first, so that the nearer ones lie over them)
      for (const [a, L, w] of [
        [-1.3, 62, 17],
        [1.3, 62, 17],
        [-0.68, 72, 19],
        [0.68, 72, 19],
        [0, 82, 21],
      ]) {
        g.save();
        g.translate(0, 36);
        g.rotate(a);
        g.beginPath();
        g.moveTo(0, 0);
        g.bezierCurveTo(w * 1.5, -L * 0.3, w, -L * 0.75, 0, -L);
        g.bezierCurveTo(-w, -L * 0.75, -w * 1.5, -L * 0.3, 0, 0);
        g.fill();
        g.stroke();
        g.restore();
      }
      g.beginPath();
      g.moveTo(-40, 52);
      g.quadraticCurveTo(0, 66, 40, 52);
      g.stroke();
    },
    gada(g) {
      g.rotate(0.5);
      g.lineWidth = 7;
      g.beginPath();
      g.moveTo(0, 74);
      g.lineTo(0, -8);
      g.moveTo(-11, -8);
      g.lineTo(11, -8);
      g.stroke();
      g.lineWidth = 5;
      g.beginPath();
      g.ellipse(0, -38, 25, 29, 0, 0, 6.2832);
      g.fill();
      g.stroke();
      // (the ribs of its head, and the knobs at either end)
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(0, -38, 10, 29, 0, 0, 6.2832);
      g.moveTo(0, -67);
      g.lineTo(0, -9);
      g.stroke();
      g.fillStyle = INK;
      g.beginPath();
      g.arc(0, -72, 6, 0, 6.2832);
      g.arc(0, 76, 6, 0, 6.2832);
      g.fill();
    },
  };
  for (const [name, x, z] of [
    ['shankha', 0, RITE_R],
    ['trishul', 0, -RITE_R],
    ['padma', -RITE_R, 0],
    ['gada', RITE_R, 0],
  ]) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.translate(128, 128);
    g.fillStyle = 'rgba(172,126,84,.6)';
    g.beginPath();
    g.arc(0, 0, 118, 0, 6.2832);
    g.fill();
    g.strokeStyle = 'rgba(140,72,40,.8)';
    g.lineWidth = 8;
    g.stroke();
    g.strokeStyle = 'rgba(244,228,198,.58)';
    g.lineWidth = 3.5;
    g.beginPath();
    g.arc(0, 0, 100, 0, 6.2832);
    g.stroke();
    g.strokeStyle = INK;
    g.fillStyle = WASH;
    g.lineWidth = 4;
    g.lineCap = g.lineJoin = 'round';
    g.scale(0.92, 0.92);
    SIGNS[name](g);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.7), toon(0xffffff, { map: tex, transparent: true, depthWrite: false, rim: 0 }));
    p.rotation.x = -Math.PI / 2;
    p.position.set(x, groundY(x, z) + 0.045, z);
    p.receiveShadow = true;
    scene.add(p);
    SIGNS_AT.push({ name, x, z, y: groundY(x, z) });
  }
}
function nightStart() {
  if (NIGHT.on) return;
  NIGHT.on = true;
  NIGHT.t = 0;
  NIGHT.lock = LOCK = true;
  // (the bow is already up and drawn, from the holding of N; on a dev start it is not, and he is given it so)
  if (!SKYSHOT) SKYSHOT = { h: SEL, draw: 1, nock: true };
}
// Rama's draw, the arrow going up, its burst, and the sparks coming down to the lamps and the altar
function nightArrow(dt) {
  if (NIGHT.t < 0) {
    // Before the night: holding Space on the crescent is his draw. While it is held he stands, turns to the camera and raises the bow straight up
    // (see SKYSHOT, with the heroes), and the string comes back as the ring fills. Let go early and the ring runs back, the
    // string eases forward, and the bow comes down
    const pull = STOCK.at === RITE && STOCK.hold,
      d = Math.max(0, Math.min(1, (STOCK.k - 0.12) / 0.88));
    if (pull) {
      if (!SKYSHOT) SKYSHOT = { h: SEL, draw: 0, nock: true };
      NIGHT.lock = LOCK = true;
      SKYSHOT.draw = d;
    } else if (SKYSHOT) {
      SKYSHOT.draw = d;
      if (STOCK.k <= 0) {
        SKYSHOT = null;
        if (NIGHT.lock) LOCK = NIGHT.lock = false;
      }
    }
    return;
  }
  NIGHT.t += dt;
  const t = NIGHT.t,
    SHOT_T = 0;
  if (SKYSHOT) {
    // the ring has closed: he looses
    if (SKYSHOT.nock) {
      SKYSHOT.nock = false;
      const by = SKYSHOT.h;
      by.hL.y > 0 ? NIGHT.top.copy(by.hL) : NIGHT.top.copy(by.group.position).setY(by.group.position.y + 2.3);
      NIGHT.arrow = glow(0xffa040, 1.6);
      NIGHT.arrow.position.copy(NIGHT.top);
      scene.add(NIGHT.arrow);
      flash(NIGHT.top, 0xffa040, 8);
    } else SKYSHOT.draw = Math.max(0, SKYSHOT.draw - dt * 14);
    // (the bow stays up a moment after the arrow has gone, then he has his hands back)
    if (t > 0.6) {
      SKYSHOT = null;
      if (NIGHT.lock) LOCK = NIGHT.lock = false;
    }
  }
  const A = NIGHT.arrow;
  if (A) {
    const k = Math.min(1, (t - SHOT_T) / RISE_T);
    A.position.y = NIGHT.top.y + RISE_H * (1 - (1 - k) * (1 - k));
    puff(A.position, 0xffb050, 2, 0.5, 0.5, -0.5, 0.3);
    if (k >= 1) {
      // the burst: the day begins to go, and a spark sets out for each lamp, the nearer ones first, and one for the altar
      scene.remove(A);
      NIGHT.arrow = null;
      NIGHT.top.copy(A.position);
      NIGHT.go = true;
      flash(NIGHT.top, 0xffc070, 40);
      puff(NIGHT.top, 0xffb050, 60, 6, 0.9, -1, 0.6);
      const to = [...LAMPS].sort((a, b) => Math.hypot(a.x - NIGHT.top.x, a.z - NIGHT.top.z) - Math.hypot(b.x - NIGHT.top.x, b.z - NIGHT.top.z));
      [...to, null].forEach((l, i) => {
        const g = glow(0xffa040, 0.9);
        g.position.copy(NIGHT.top);
        scene.add(g);
        NIGHT.sparks.push({ g, l, t: -i * 0.07, to: l ? V3(l.x, l.y + 1.5, l.z) : V3(0, 1.2, 0) });
      });
    }
  }
  for (const q of [...NIGHT.sparks]) {
    q.t += dt;
    if (q.t < 0) continue;
    const k = Math.min(1, q.t / 0.55),
      e = k * k;
    q.g.position.lerpVectors(NIGHT.top, q.to, e);
    // (it swings out a little on its way down)
    q.g.position.y += Math.sin(k * Math.PI) * 2.5;
    if (Math.random() < dt * 40) puff(q.g.position, 0xffb050, 1, 0.4, 0.4, -0.5, 0.25);
    if (k >= 1) {
      scene.remove(q.g);
      NIGHT.sparks.splice(NIGHT.sparks.indexOf(q), 1);
      if (q.l) lampLight(q.l);
      else {
        // at the altar the fire leaps, and the sage's eyes close: the rite has begun
        sageEyes(true);
        flash(tmpA.set(0, 1.4, 0), 0xffa040, 22);
        puff(tmpA, 0xffb050, 40, 3, 0.7, -2, 0.35);
      }
    }
  }
}
function nightUpdate(dt) {
  nightArrow(dt);
  waveUpdate(dt);
  // (the day goes at the arrow's burst, and comes back the same way at dawn)
  // The night is over and the day is all the way back: it is the next day. Everything about the night is put back as it was
  // before the first, so that another can be called; and on the second morning the two far camps are there
  if (NIGHT.dawn && NIGHT.done && NIGHT.k <= 0 && !NIGHT.lost) {
    NIGHT.on = NIGHT.go = NIGHT.dawn = NIGHT.done = false;
    NIGHT.t = -1;
    NIGHT.day = dayN() + 1;
    WAVE.i = -1;
    WAVE.st = 'off';
    WAVE.msg = '';
    for (const c of CAMPS) campShow(c);
  }
  const dir = NIGHT.dawn ? -1 : NIGHT.go ? 1 : 0;
  if (!dir || (dir > 0 ? NIGHT.k >= 1 : NIGHT.k <= 0)) return;
  // (the look of it, day to night, is skyNight's, in altar.js: the sandbox turns to the same night)
  NIGHT.k = Math.max(0, Math.min(1, NIGHT.k + (dir * dt) / NIGHT_T));
  skyNight(NIGHT.k);
}
// ---------- the waves ----------
// The night is five waves. Each comes out of the forest from one side or more (a side is chosen afresh every night), and a few
// seconds before it does the instruction line says from where and a dull glow shows there among the trees. Between waves
// there is a short quiet, in which the fire recovers a little.
//   rakshasas and brutes make for the fire and strike it, but turn on a brother who comes near them
//   pishachas make for the nearest burning lamp and claw it out (four blows); with none left burning, for the fire
//   defilers fly straight to the fire and pour their filth on it
// A burning lamp slows every demon near it. One that has been put out can be lit again with a fire arrow.
// The fire is what is lost: every blow and every pouring takes from it, and it burns lower as it is hurt. If it goes out the
// rite is broken and the level is over. When the last wave is dead the day comes back, and the day's gathering is counted
const FIRE = { hp: 100, max: 100, s: 1 },
  WAVE = { i: -1, st: 'off', t: 0, msg: '', a0: 0, q: [], live: [] },
  WAVE_R = 30,
  // each wave: [kind, how many, side (in quarter turns from the night's first side), seconds after the wave begins]
  WAVES = [
    [['grunt', 2, 0, 0], ['grunt', 2, 0, 4], ['grunt', 2, 0, 8]],
    [['pish', 4, 1, 0], ['pish', 4, 3, 7], ['runner', 2, 2, 11]],
    [['grunt', 3, 0, 0], ['defiler', 2, 2, 0], ['grunt', 3, 2, 3], ['archer', 2, 1, 4], ['defiler', 1, 0, 5], ['hurler', 1, 3, 6]],
    [['grunt', 3, 1, 0], ['brute', 1, 1, 2], ['runner', 3, 3, 4], ['grunt', 3, 1, 6]],
    [['brute', 1, 0, 0], ['pish', 4, 2, 0], ['defiler', 2, 1, 4], ['archer', 3, 2, 6], ['hurler', 2, 1, 7], ['pish', 4, 0, 8], ['brute', 1, 3, 10], ['defiler', 2, 3, 13]],
  ],
  sideOf = (q) => WAVE.a0 + (q * Math.PI) / 2,
  sideName = (a) => (Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) > 0 ? 'east' : 'west') : Math.sin(a) > 0 ? 'south' : 'north');
SPAWN_MAX = 70;
function waveDemon(kind, a) {
  const b = a + R(-0.16, 0.16),
    r = WAVE_R + R(-2, 2),
    d = spawn(0, kind, V3(Math.cos(b) * r, 0, Math.sin(b) * r));
  if (!d) return;
  d.wave = true;
  d.g.rotation.y = Math.atan2(-d.g.position.x, -d.g.position.z);
  // the moment a blow of his lands: on the brother he is fighting, on the lamp he is at, or on the fire
  d.onHit = () => {
    const P = d.g.position,
      [lo, hi] = d.def.dmg;
    if (d.foe) {
      const hp = d.foe.group.position;
      if (apart(hp, P) > d.rng + 0.8) return;
      d.foe.hp = Math.max(0, d.foe.hp - Math.round(lo + Math.random() * (hi - lo)));
      heroHit(d.foe, P.x, P.z);
      puff(tmpA.set(hp.x, hp.y + 1.2, hp.z), 0xff6a50, 12, 2.6, 0.3, 2);
    } else if (d.lamp) {
      const l = d.lamp;
      if (!l.lit || apart(l, P) > d.rng + 0.8) return;
      puff(tmpA.set(l.x, l.y + 1.5, l.z), 0xffb050, 8, 2, 0.3, 1);
      l.dip = 1;
      // (a runner's thrown water counts for two blows on a lamp, and his empty bucket for half of one)
      if ((l.hits = (l.hits || 0) + (d.rn ? (d.threw ? 2 : 0.5) : 1)) >= 4) {
        lampOut(l);
        puff(tmpA, 0x77726c, 22, 1.4, 1.2, -0.8, 0.3);
      }
    } else if (Math.hypot(P.x, P.z) < d.rng + 1) fireHurt(d.br ? 6 : d.rn ? (d.threw ? 4 : 0.6) : d.pi ? 1 : 1.5);
  };
  // where one of his boulders comes down (a stone-hurler's only): any lit lamp under it takes two blows, and the altar's
  // fire, if it is that, a heavy one
  d.onStone = (x, z) => {
    for (const l of LAMPS)
      if (l.lit && Math.hypot(l.x - x, l.z - z) < 1.9) {
        l.dip = 1;
        puff(tmpA.set(l.x, l.y + 1.5, l.z), 0xffb050, 10, 2.2, 0.3, 1);
        if ((l.hits = (l.hits || 0) + 2) >= 4) {
          lampOut(l);
          puff(tmpA, 0x77726c, 22, 1.4, 1.2, -0.8, 0.3);
        }
      }
    if (Math.hypot(x, z) < 2.6) fireHurt(5);
  };
  WAVE.live.push(d);
}
function fireHurt(n) {
  if (FIRE.hp <= 0 || NIGHT.dawn) return;
  FIRE.hp = Math.max(0, FIRE.hp - n);
  if (n >= 1) FIRE.dip = 1;
  if (n >= 1) puff(tmpA.set(R(-0.4, 0.4), 1.2, R(-0.4, 0.4)), 0x5a6a3a, 8, 2, 0.5, 1, 0.3);
  if (FIRE.hp > 0) return;
  // the fire is out: the rite is broken
  NIGHT.lost = LOCK = true;
  WAVE.st = 'off';
  WAVE.msg = '';
  HEARTH.flames.forEach((m) => (m.visible = false));
  puff(tmpA.set(0, 1, 0), 0x77726c, 60, 2, 1.6, -1, 0.5);
  const o = document.createElement('div');
  o.style.cssText =
    'position:fixed;inset:0;z-index:55;display:grid;place-items:center;background:rgba(12,12,14,0);transition:background 1.2s;color:#f1e4cc;text-align:center;font:500 30px/1.4 Georgia,serif';
  o.innerHTML =
    '<div>The fire is out.<br><span style="font-size:20px;opacity:.75">The rite is broken.</span><br><a href="' +
    location.href +
    '" style="display:inline-block;margin-top:22px;padding:10px 22px;border-radius:999px;background:rgba(22,22,24,.88);color:#ffd08a;text-decoration:none;font:600 18px var(--f)">Try again</a></div>';
  document.body.append(o);
  requestAnimationFrame(() => (o.style.background = 'rgba(12,12,14,.72)'));
}
function waveUpdate(dt) {
  // the fire burns as high as it is whole
  // The fire's strength is its health, and is shown by the fire itself and nothing else: whole, it stands tall; as it is
  // hurt it sinks, its light and the pool of light under it sinking with it, until at the last it is a low flicker; and
  // then it is out. Each blow also makes it gutter for a moment (FIRE.dip), so that the blow is seen
  {
    const r = FIRE.hp / FIRE.max;
    FIRE.dip = Math.max(0, (FIRE.dip || 0) - dt * 2.5);
    FIRE.s += ((0.1 + 0.9 * r) * (1 - 0.35 * FIRE.dip) - FIRE.s) * Math.min(1, dt * (FIRE.dip > 0 ? 12 : 3));
    fireL.intensity = 9 * (0.12 + 0.88 * r) * (1 - 0.45 * FIRE.dip);
    // (the hearth's own small flames, inside the great one, are let show only while it is still taller than they are)
    for (const m of flames) m.visible = r > 0.3 && !NIGHT.lost;
  }
  if (NIGHT.lost || NIGHT.done) return;
  const W = WAVE;
  if (W.st === 'off') {
    // (the first wave is given a little while after dark has come)
    if (NIGHT.go && NIGHT.k >= 1 && !NIGHT.dawn) {
      W.a0 = Math.random() * 6.283;
      W.st = 'lull';
      W.t = 4;
    }
    return;
  }
  W.t -= dt;
  // each demon of the night is told, every frame, what he is after
  W.live = W.live.filter((d) => grunts.includes(d) && !d.dead);
  for (const d of W.live) {
    if (d.hp === undefined) continue;
    const P = d.g.position;
    let foe = null,
      lamp = null,
      slow = false;
    if (!d.pi && !d.df && !d.rn && !d.st)
      for (const h of HEROES) if (h.hp > 0 && apart(h.group.position, P) < (d.br ? 9 : 6.5) && (!foe || apart(h.group.position, P) < apart(foe.group.position, P))) foe = h;
    for (const l of LAMPS)
      if (l.lit) {
        if (apart(l, P) < 5.5) slow = true;
        if ((d.pi || d.rn || d.st) && (!lamp || apart(l, P) < apart(lamp, P))) lamp = l;
      }
    d.slowK = slow && !d.df ? 0.7 : 1;
    // (a runner makes for whichever fire is nearest him, a lamp's or the altar's, and for nothing else)
    // (and so does a stone-hurler, from his distance)
    if ((d.rn || d.st) && lamp && apart(lamp, P) > Math.hypot(P.x, P.z)) lamp = null;
    // (an archer chooses his own mark and his own distance: see the archer, with the enemies)
    if (d.ar) continue;
    d.foe = foe;
    d.lamp = foe ? null : lamp;
    d.to = foe ? foe.group.position : lamp;
    d.rng = d.st ? d.def.reach : foe ? (d.br ? 2.3 : 1.5) : lamp ? 1.3 : d.df ? d.def.reach : d.br ? 3.2 : d.pi || d.rn ? 2.2 : 2.6;
    // A guard statue near him: a foot soldier or a brute with no brother to fight stops to break it before he goes on
    d.stat = null;
    if (!foe && !d.pi && !d.df && !d.rn && !d.st) {
      let best = null,
        bd = 5.5;
      for (const S of STATUES) {
        const l = S.dead ? 99 : Math.hypot(S.x - P.x, S.z - P.z);
        if (l < bd) {
          bd = l;
          best = S;
        }
      }
      if (best) {
        d.stat = best;
        d.lamp = null;
        d.to = best;
        d.rng = best.r + (d.br ? 1.7 : 1.0);
      }
    }
    // A wall between him and where he is going: he goes round it if he can (the pathfinder's doing). With no way round, or
    // only a long one, he breaks it. He looks into it twice a second, and once set on a wall he stays on it until it is down
    // or a brother comes for him. (Not those that fly, nor the stone-hurler, who throws over it)
    if (d.wallT && (d.wallT.dead || foe)) d.wallT = null;
    if (!foe && !d.df && !d.st && !d.wallT && (d.wallCk = (d.wallCk === undefined ? Math.random() * 0.5 : d.wallCk) - dt) <= 0) {
      d.wallCk = 0.5;
      d.wallT = wallInWay(P, d.to ? d.to.x : 0, d.to ? d.to.z : 0);
    }
    if (d.wallT && !d.stat) {
      d.stat = d.wallT;
      d.lamp = null;
      d.to = d.wallT;
      d.rng = d.br ? 2.4 : 1.6;
    }
    // (a defiler has no blow: while its pot is tipped over the fire, the fire is fouled)
    if (d.df && d.pour > 0.5 && Math.hypot(P.x, P.z) < 4.5) fireHurt(2.5 * dt);
  }
  if (W.st === 'lull') {
    FIRE.hp = Math.min(FIRE.max, FIRE.hp + dt * 1.2);
    if (W.t <= 0) {
      W.i++;
      // (each later night is heavier: half as many again of everything, for each night after the first)
      W.q = WAVES[W.i].map((g) => [g[0], Math.ceil(g[1] * (1 + 0.5 * (dayN() - 1))), g[2], g[3]]);
      W.st = 'fight';
      W.t = 0;
    }
  } else if (W.st === 'fight') {
    // (W.t runs down from nothing: -W.t is how long the wave has been going)
    for (const g of [...W.q])
      if (-W.t >= g[3]) {
        W.q.splice(W.q.indexOf(g), 1);
        for (let i = 0; i < g[1]; i++) waveDemon(g[0], sideOf(g[2]));
      }
    if (!W.q.length && !W.live.length) {
      if (W.i < WAVES.length - 1) {
        W.msg = '';
        W.st = 'lull';
        W.t = 6;
      } else {
        // the last of them is dead: dawn. The day comes back, the sage opens his eyes, and the gathering is counted
        W.st = 'off';
        W.msg = '';
        NIGHT.dawn = true;
        NIGHT.done = true;
        sageEyes(false);
        coinsHome();
        // (and with the day the lamps go out, a wisp of smoke from each)
        for (const l of LAMPS)
          if (l.lit) {
            lampOut(l);
            puff(tmpA.set(l.x, l.y + 1.5, l.z), 0x77726c, 12, 1, 1, -0.8, 0.3);
          }
        setTimeout(() => (W.msg = ''), 7000);
      }
    }
  }
}
// The end of a night: what was gathered that day is counted into Tejas all at once
function nightTally() {
  const n = STOCK.pend;
  STOCK.pend = 0;
  woodGain(n);
  return n;
}
function woodGain(n) {
  STOCK.n += n;
  STOCK.el.lastChild.textContent = STOCK.n;
  if (n) STOCK.el.animate([{ transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
}
// which empty platform Rama is standing by, if any; the sign held over it on the screen; and the ring, filling while he holds
// ---------- places where something can be built ----------
// A place to build is shown the same way whatever is to be built there (a lamp today; a statue or a wall later), and
// building is always the player's choice, never an order. Nothing marks a place from afar: no token, no ghost, nothing on
// the screen. Only when the brother being played comes up to an empty place does it show itself, with the thing that could
// stand there as a faint ghost and the sign with its price and ring over it. The one moment the places draw the eye is
// when building first opens: each flares once.
// SITES is the list; a place is { x, y, z, cost, open(), ghost } and adds itself
const SITES = [],
  buildOpen = () => !!ARR.talked;
for (const l of LAMPS) SITES.push({ x: l.x, y: l.y, z: l.z, cost: LAMP_COST, open: () => !l.built, ghost: l.ghost, of: l });
// Once the masons are free the ground round the hermitage can be built on. What may be built is drawn on it as one pattern,
// in thin pale lines, like a kolam: dots, and lines joining them.
//   The lines are the sides of two eight-sided rings (RINGS, the first two), a zigzag between them corner to corner, and
//     eight points beyond the outer of the two (RINGS, the third, is how far out they reach): an eight-pointed star, all triangles. The
//     innermost ring runs inside the lamps, just clear of the four signs, and each lamp stands in a triangle of its own.
//     Any length can be raised into a wall, so the ground can be shut, opened or wound as he likes. A longer length costs
//     more. Walkers go round a wall; a demon with no way round, or only a long one, breaks it (see wallInWay, in statue.js)
//   The dots are small circles, one in the middle of every triangle that has no lamp in it, and a guard can be stood on
//     each: a mace-bearer, who holds what comes to him, or an archer on a pedestal, who shoots what comes in reach. Which of
//     the two is chosen once a plinth has been built on the circle (see buildUpdate).
// All of it is shown and paid for exactly as the lamps are (stand at one, hold fire).
// (the guards and walls themselves are in statue.js). PLACES.on says the masons have opened them
const PLACES = [],
  RINGS = [13.5, 20.9, 28.3],
  WALL_N = 8,
  GUARD = { kind: 'statue', cost: { statue: 5, tower: 5 }, name: { statue: 'Mace-bearer', tower: 'Archer' } },
  costOf = (l) => (l && l.cost) || LAMP_COST;
PLACES.rings = new URLSearchParams(location.search).get('pattern') === 'rings';
{
  const LINE = new THREE.MeshBasicMaterial({ color: 0xf3ead6, transparent: true, opacity: 0.08, depthWrite: false }),
    // (a wall's ghost is a big pale slab, so it has its own, much fainter, shade of the ghost's colour)
    WGHOST = GHOST.clone(),
    DOT = new THREE.RingGeometry(0.62, 0.72, 28).rotateX(-Math.PI / 2),
    put = (x, z, kind, cost, yaw, len = 0) => {
      const y = groundY(x, z),
        wall = kind === 'wall',
        base = wall ? add(scene, new THREE.BoxGeometry(len - 0.4, 0.02, 0.12), LINE, [x, y + 0.025, z], [0, yaw, 0]) : add(scene, DOT, LINE, [x, y + 0.03, z]),
        ghost = new THREE.Group(),
        q = { x, y, z, kind, cost, face: yaw, len, built: false, base, ghost };
      // (the ghost of what would stand there: the length of the wall, or the guard of either kind)
      if (wall) add(ghost, new THREE.BoxGeometry(len, 1.4, 0.75), WGHOST, [0, 0.7, 0], [0, yaw, 0]);
      // (a circle has no ghost of its own: the two guards' ghosts are shared, and brought to it. See buildUpdate)
      else q.pick = true;
      ghost.position.set(x, y, z);
      ghost.visible = base.visible = false;
      scene.add(ghost);
      PLACES.push(q);
      SITES.push({ x, y, z, cost, open: () => PLACES.on && !q.built, ghost, of: q });
    };
  // (the inner and outer rings have their corners half a step round, so a side of the inner ring faces each lamp)
  const step = (Math.PI * 2) / WALL_N,
    half = (k) => (k + 1) % 2,
    at = (k, i) => [Math.sin((i + half(k) * 0.5) * step) * RINGS[k], Math.cos((i + half(k) * 0.5) * step) * RINGS[k]],
    // (a length of up to about eleven paces is two coins; the sides of the middle ring, the longest, are three)
    seg = (a, b) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      put((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 'wall', Math.max(2, Math.round(len / 4.5)), Math.atan2(a[1] - b[1], b[0] - a[0]), len);
    },
    // (a circle in the middle of a triangle, unless a lamp stands in it; a guard there faces away from the fire)
    dot = (a, b, c) => dotAt((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3),
    dotAt = (x, z) => {
      if (!LAMPS.some((l) => Math.hypot(l.x - x, l.z - z) < 3.5)) put(x, z, GUARD.kind, GUARD.cost[GUARD.kind], Math.atan2(x, z));
    };
  // The other pattern, for trying beside this one (level1.html?pattern=rings): four rings and the short spokes between
  // them, as a chakravyuha is laid out. The two inner rings have eight sides and the two outer ones sixteen; a lane runs
  // between each ring and the next, cut into cells by the spokes, with a circle for a guard in each cell that has no lamp.
  // A ring's side is a wall or a gate; a spoke shuts the lane
  if (PLACES.rings) {
    const RR = [12.2, 17.3, 22.4, 27.5],
      e = Math.PI / 8,
      P = (r, a) => [Math.sin(a) * r, Math.cos(a) * r];
    for (let k = 0; k < 4; k++)
      for (let i = 0, n = k < 2 ? 8 : 16; i < n; i++) {
        const a = k < 2 ? e + i * 2 * e : i * e;
        seg(P(RR[k], a), P(RR[k], a + (k < 2 ? 2 * e : e)));
      }
    for (let l = 0; l < 3; l++)
      for (let i = 0, n = l < 2 ? 8 : 16; i < n; i++) {
        const a = l < 2 ? e + i * 2 * e : i * e;
        seg(P(RR[l], a), P(RR[l + 1], a));
        // (in the innermost lane both rings' sides run straight across the cell, nearer the fire than their corners)
        dotAt(...P(((RR[l] + RR[l + 1]) / 2) * (l ? 1 : Math.cos(e)), a + (l < 2 ? e : e / 2)));
      }
  }
  for (let k = 0; k < 2 && !PLACES.rings; k++)
    for (let i = 0; i < WALL_N; i++) {
      const c = at(k, i);
      seg(c, at(k, i + 1));
      if (!k) continue;
      // (the zigzag in from this ring: each corner to the two corners of the ring inside that it stands between; and the
      // two triangles that makes, one with its point out here and one with its point in there)
      const j = half(k) ? i : i - 1;
      seg(c, at(k - 1, j));
      seg(c, at(k - 1, j + 1));
      dot(c, at(k - 1, j), at(k - 1, j + 1));
      dot(c, at(k, i + 1), at(k - 1, j + 1));
    }
  // Beyond the middle ring there is no third ring, only its points: one out from the middle of each side of the middle
  // ring, almost at the road, joined to that side's two corners. So the outline of the whole is an eight-pointed star, and
  // each point is a triangle with a guard's circle in it
  for (let i = 0; i < WALL_N && !PLACES.rings; i++) {
    const m = at(1, i),
      n = at(1, i + 1),
      b = [Math.sin((i + 0.5) * step) * RINGS[2], Math.cos((i + 0.5) * step) * RINGS[2]];
    seg(m, b);
    seg(n, b);
    dot(m, n, b);
  }
  PLACES.line = LINE;
  PLACES.ghost = WGHOST;
}
// (the moment the masons are free the pattern is there on the ground)
function placesOpen() {
  if (PLACES.on || !CAMPS.some((c) => !c.first && c.rescued && c.prisoners[0].look === 'mason')) return;
  PLACES.on = true;
  for (const q of PLACES) q.base.visible = true;
}
// No wall may be built that would shut any ground off from the rest: nobody, brother, villager or demon, is ever walled in or
// walled out, and there is always a way to the fire. wouldLock(w) says whether raising w would do that.
// The lines of the pattern cut the ground into pieces: the triangles between the rings, the ground inside the inner ring,
// and everything outside the outer one. Each line lies between two of them (found once, wallCells: a point a little to each
// side of every line, and two such points are in the same piece if one can be seen from the other across no line; a point
// with no line beyond it is outside). A wall shuts the way between its two pieces, unless it has been broken. So w may be
// built only if, with it up, every piece can still be reached from outside through lines that are open
function wallCells() {
  const W = PLACES.filter((q) => q.len),
    ends = W.map((w) => {
      const ux = (Math.cos(w.face) * w.len) / 2,
        uz = (-Math.sin(w.face) * w.len) / 2;
      return [w.x - ux, w.z - uz, w.x + ux, w.z + uz];
    }),
    // (does the straight way from a to b cross any line?)
    cut = (ax, az, bx, bz) =>
      ends.some(([cx, cz, dx, dz]) => {
        const o = (px, pz, qx, qz, rx, rz) => Math.sign((qx - px) * (rz - pz) - (qz - pz) * (rx - px));
        return o(ax, az, bx, bz, cx, cz) !== o(ax, az, bx, bz, dx, dz) && o(cx, cz, dx, dz, ax, az) !== o(cx, cz, dx, dz, bx, bz);
      }),
    pts = [],
    of = [];
  for (const w of W)
    for (const sd of [1, -1]) pts.push([w.x + Math.sin(w.face) * 0.9 * sd, w.z + Math.cos(w.face) * 0.9 * sd]);
  // (piece 0 is outside; the rest are numbered as they are found)
  // (looking out a hair to one side of straight, so as never to look exactly through a corner where lines meet)
  const out = pts.map(([x, z]) => {
    const k = 80 / Math.hypot(x, z);
    return !cut(x, z, (x * 0.9997 - z * 0.0245) * k, (z * 0.9997 + x * 0.0245) * k);
  });
  let n = 1;
  pts.forEach(([x, z], i) => {
    if (out[i]) return (of[i] = 0);
    for (let j = 0; j < i; j++)
      if (!out[j] && !cut(x, z, pts[j][0], pts[j][1])) return (of[i] = of[j]);
    of[i] = n++;
  });
  W.forEach((w, i) => ((w.ca = of[2 * i]), (w.cb = of[2 * i + 1])));
  PLACES.cells = n;
  PLACES.walls = W;
}
function wouldLock(w) {
  if (!PLACES.cells) wallCells();
  const seen = new Uint8Array(PLACES.cells),
    go = [0];
  seen[0] = 1;
  let got = 1;
  while (go.length) {
    const c = go.pop();
    for (const q of PLACES.walls) {
      if (q === w || (q.built && !(q.S && q.S.dead)) || (q.ca !== c && q.cb !== c)) continue;
      const o = q.ca === c ? q.cb : q.ca;
      if (!seen[o]) (seen[o] = 1), got++, go.push(o);
    }
  }
  return got < PLACES.cells;
}
// how a walker stands to a place that is being built on: d, how far he is from it (from the line of a wall, or the middle
// of a circle); R, how far off is clear of it; and dx, dz, the way straight off it from where he is (if he is right on it,
// the way the place faces: out from the fire)
function offPlace(l, Q) {
  const ux = Math.cos(l.face),
    uz = -Math.sin(l.face),
    t = l.len ? Math.max(-l.len / 2, Math.min(l.len / 2, (Q.x - l.x) * ux + (Q.z - l.z) * uz)) : 0,
    dx = Q.x - l.x - ux * t,
    dz = Q.z - l.z - uz * t,
    d = Math.hypot(dx, dz);
  return d < 0.01 ? { d, R: l.len ? 1.0 : 1.45, dx: Math.sin(l.face), dz: Math.cos(l.face) } : { d, R: l.len ? 1.0 : 1.45, dx: dx / d, dz: dz / d };
}
// (the guard chosen for a plinth that was waiting: it stands there, and the plinth is part of it)
function guardPick(l, kind) {
  GUARD.pause = null;
  LOCK = false;
  STOCK.pickEl.style.display = 'none';
  l.kind = kind;
  l.wait = false;
  l.built = true;
  if (l.ped) scene.remove(l.ped);
  if (l.solid) SOLIDS.splice(SOLIDS.indexOf(l.solid), 1);
  placeBuilt(l);
  flash(tmpA.set(l.x, l.y + 0.2, l.z), 0xffd08a, 5);
  STOCK.at = null;
}
// (built: the wall or the guard stands where its mark was, in a burst of stone dust)
function placeBuilt(q) {
  q.base.visible = false;
  if (q.kind === 'wall') {
    // (it goes up in dust along its whole length)
    q.S = makeWall(q.x, q.z, q.face, q.len);
    for (let t = -q.len / 2; t <= q.len / 2; t += 1.6) puff(tmpA.set(q.x + q.S.ux * t, q.y + 0.7, q.z + q.S.uz * t), 0xe6dccb, 12, 2.6, 0.7, 3, 0.45);
    return;
  }
  q.S = (q.kind === 'tower' ? makeTower : makeStatue)(q.x, q.z, q.face);
  puff(tmpA.set(q.x, q.y + 1.2, q.z), 0xe6dccb, 40, 3.4, 0.8, 3, 0.5);
}
function siteMarks(dt) {
  if (buildOpen() && !STOCK.opened) {
    // building has just opened: each place flares
    STOCK.opened = true;
    for (const q of SITES)
      if (q.open()) {
        flash(tmpA.set(q.x, q.y + 0.3, q.z), 0xffd08a, 10);
        puff(tmpA, 0xffe2a8, 18, 2, 0.5, -1.2, 0.3);
        ring(tmpA.setY(q.y + 0.08), 1.6, 0xffd08a, 0.8);
      }
  }
  // (the ghost stands only on the place he is at)
  for (const q of SITES) q.ghost.visible = q.of === STOCK.at;
}
function buildUpdate(dt) {
  // (all of this is for whichever brother is being played, Rama or Lakshmana)
  const P = SEL.group.position;
  // (nothing can be built until Vishwamitra has spoken with the brothers: see buildOpen)
  placesOpen();
  // (the pattern is for the day's building: it goes out as the night comes down, and is back with the morning)
  // (and while it cannot be seen, nothing can be built on it)
  PLACES.line.opacity = 0.08 * Math.max(0, 1 - NIGHT.k * 2.5);
  PLACES.line.visible = PLACES.line.opacity > 0.004;
  const by = (l) => !l.built && Math.hypot(P.x - l.x, P.z - l.z) < 2.4,
    // (a length of the pattern is his when he stands anywhere along it: the nearest one within reach)
    off = (l) => {
      if (!l.len) return Math.hypot(P.x - l.x, P.z - l.z);
      const ux = Math.cos(l.face),
        uz = -Math.sin(l.face),
        t = Math.max(-l.len / 2, Math.min(l.len / 2, (P.x - l.x) * ux + (P.z - l.z) * uz));
      return Math.hypot(P.x - l.x - ux * t, P.z - l.z - uz * t);
    },
    place = () => {
      let b = null,
        bd = 2.4;
      for (const l of PLACES) {
        if (l.built) continue;
        // (a circle he is standing on comes before any line that ends there)
        const d = l.len ? off(l) : off(l) < 1.3 ? off(l) - 2 : 9;
        if (d < (l.len ? 1.5 : bd) && d < bd) (b = l), (bd = d);
      }
      return b;
    };
  // (a place he is in the middle of building stays his while he steps off it, though another may now be nearer)
  const mine = STOCK.hold && STOCK.at && STOCK.at.kind && !STOCK.at.built && !STOCK.at.wait && off(STOCK.at) < 2.4 ? STOCK.at : null;
  STOCK.at = (buildOpen() && !LOCK && !talking() && (LAMPS.find(by) || (PLACES.on && PLACES.line.visible && (mine || place())))) || null;
  // When every lamp stands, Rama standing on any of the four signs gets the same sign over his head, and Space held there
  // is his draw. Which sign he began the night from is kept in RITE.sign
  const on = !STOCK.at && nightReady() && SIGNS_AT.find((q) => Math.hypot(P.x - q.x, P.z - q.z) < 1.5);
  if (on) {
    RITE.x = on.x;
    RITE.z = on.z;
    RITE.y = on.y + 0.75;
    RITE.sign = on.name;
    STOCK.at = RITE;
  }
  nightUpdate(dt);
  const l = STOCK.at,
    sg = STOCK.sign;
  // (a wall that would shut ground off cannot be built: its ghost is red and its sign shows a cross for a price)
  STOCK.shut = !!(l && l.len && wouldLock(l));
  if (STOCK.shut) STOCK.hold = false;
  // A guard is built in two steps. First the place: at a circle there is one disc, as for a wall, and holding it builds a
  // bare plinth (both guards cost the same, so nothing is chosen yet; the ghost on the circle slowly shows the one and then
  // the other). Then the guard: the moment the plinth stands the level stops, and two cards come up in the middle of the
  // screen, one for each guard, in the dark ground and pale sign of the arrow in the corner: its sign, its name and a line
  // on what it does. A click on a card stands that guard on the plinth, and the level goes on
  if (!STOCK.pickEl) {
    const pk = document.createElement('div'),
      ICON = {
        // (a gada: a round ribbed head with a knob, on a short haft)
        statue:
          '<svg viewBox="0 0 24 24"><path d="M5 19.4 L 12.4 11.2" stroke="#f0dcb4" stroke-width="2.3" stroke-linecap="round" fill="none"/><circle cx="15.6" cy="7.8" r="5" fill="#f0dcb4"/><circle cx="19.6" cy="3.8" r="1.5" fill="#f0dcb4"/><path d="M12.4 4.9 L 18.6 11 M15.6 2.8 V 12.8" stroke="rgba(22,22,24,.55)" stroke-width="1" fill="none"/></svg>',
        // (a drawn bow with an arrow on the string)
        tower:
          '<svg viewBox="0 0 24 24"><path d="M9 2.6 C 18.6 6, 18.6 18, 9 21.4" stroke="#f0dcb4" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M9 2.6 L 5 12 L 9 21.4" stroke="#f0dcb4" stroke-width="1" stroke-linejoin="round" fill="none"/><path d="M5 12 H 19" stroke="#f0dcb4" stroke-width="1.3" stroke-linecap="round"/><path d="M22.4 12 L 18 9.4 V 14.6 Z" fill="#f0dcb4"/></svg>',
      };
    const row = document.createElement('div');
    // (over the whole screen, which it dims a little: the level is stopped behind it, and nothing under it can be clicked)
    pk.style.cssText =
      'position:fixed;inset:0;z-index:30;display:none;flex-direction:column;align-items:center;justify-content:center;gap:20px;user-select:none;color:#fff3df;background:rgba(10,10,12,.3)';
    pk.innerHTML = '<h2 style="margin:0;font:600 15px var(--f);letter-spacing:.22em;text-transform:uppercase;color:#ffd08a">Who stands guard here?</h2>';
    row.style.cssText = 'display:flex;gap:16px';
    pk.append(row);
    STOCK.opts = [
      ['statue', 'Stands his ground and strikes whatever comes near.'],
      ['tower', 'Shoots from his pedestal at whatever comes in reach.'],
    ].map(([kind, says]) => {
      const o = document.createElement('div'),
        rest = 'rgba(22,22,24,.88)';
      o.style.cssText =
        `width:190px;box-sizing:border-box;padding:24px 18px 22px;border-radius:12px;display:flex;flex-direction:column;align-items:center;gap:11px;cursor:pointer;text-align:center;background:${rest};` +
        'transition:transform .15s ease-out,background .15s';
      o.innerHTML =
        `<span style="width:60px;height:60px;display:block">${ICON[kind]}</span>` +
        `<b style="font:700 22px/1.1 var(--f)">${GUARD.name[kind]}</b>` +
        `<em style="font:italic 500 16px/1.3 var(--f);opacity:.8">${says}</em>`;
      o.kind = kind;
      // (under the pointer a card lifts and warms a little)
      o.onmouseenter = () => ((o.style.transform = 'translateY(-4px)'), (o.style.background = 'rgba(46,40,32,.95)'));
      o.onmouseleave = () => ((o.style.transform = ''), (o.style.background = rest));
      o.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (GUARD.pause) guardPick(GUARD.pause, kind);
        o.onmouseleave();
      });
      row.append(o);
      return o;
    });
    document.body.append(pk);
    STOCK.pickEl = pk;
  }
  if (l && l.pick) {
    l.kind = GUARD.kind;
    l.cost = GUARD.cost[l.kind];
  }
  // The ghost on a circle is the two guards themselves, as they would stand there, in the ghost's pale colour: the
  // mace-bearer for a couple of seconds, then the archer, then the mace-bearer again, the one simply taking the other's
  // place. (One of each is made, the first time it is wanted, and stood on whichever circle he is at)
  if (l && l.pick && !l.wait && !GUARD.ghost) {
    GUARD.ghost = {};
    for (const kind of ['statue', 'tower']) {
      const S = (kind === 'tower' ? makeTower : makeStatue)(0, 0, 0);
      // (it is only a figure: it guards nothing, and stands in nobody's way)
      STATUES.splice(STATUES.indexOf(S), 1);
      SOLIDS.splice(SOLIDS.indexOf(S.solid), 1);
      S.G.traverse((o) => {
        if (!o.isMesh) return;
        o.material = GHOST;
        o.castShadow = o.receiveShadow = false;
      });
      GUARD.ghost[kind] = S.G;
    }
  }
  if (GUARD.ghost) {
    const show = l && l.pick && !l.wait ? (Math.floor(T / 2.2) % 2 ? 'tower' : 'statue') : '';
    for (const kind in GUARD.ghost) {
      const g = GUARD.ghost[kind];
      g.visible = kind === show;
      if (g.visible) {
        g.position.set(l.x, l.y, l.z);
        g.rotation.y = l.face;
      }
    }
  }
  // (what the sign shows: a lamp's cost, or the moon)
  if (l && sg.rite !== !!l.rite) {
    sg.rite = !!l.rite;
    sg.lastChild.innerHTML = l.rite ? MOON_ICON : COST_HTML;
  }
  if (!l) STOCK.hold = false;
  // While a wall or a plinth is going up, nobody stands where it will be. A brother who is on the spot when the hold begins
  // walks off it (see DIRECT, where he is given the order), and the ring does not close until he has; one who is clear of
  // it cannot walk on. (The place is still his: he is near enough to go on building)
  if (STOCK.hold && l && l.kind)
    for (const h of HEROES) {
      const Q = h.group.position,
        o = offPlace(l, Q);
      if (o.d >= o.R) h.clearOf = l;
      else if (h.clearOf === l) {
        Q.x += o.dx * (o.R - o.d);
        Q.z += o.dz * (o.R - o.d);
      } else STOCK.k = Math.min(STOCK.k, 0.95);
    }
  else for (const h of HEROES) h.clearOf = null;
  STOCK.k = STOCK.hold ? Math.min(1, STOCK.k + dt / (l && l.rite ? RITE_T : HOLD_T)) : Math.max(0, STOCK.k - dt * 4);
  if (l && l.rite && STOCK.k >= 1) {
    STOCK.hold = false;
    STOCK.k = 0;
    STOCK.at = null;
    nightStart();
  } else if (l && l.pick && STOCK.k >= 1) {
    // the ring has closed at a circle: paid for, and a bare plinth stands there, waiting to be told which guard
    woodGain(-costOf(l));
    l.wait = true;
    l.base.visible = false;
    l.ped = cyl(scene, 0.8, 0.9, 0.45, toon(0xb3a488, { rim: 0.14 }), [l.x, l.y + 0.225, l.z]);
    l.ped.castShadow = true;
    // (and it is in the way, as the guard on it will be)
    l.solid = { x: l.x, z: l.z, r: 0.95 };
    SOLIDS.push(l.solid);
    puff(tmpA.set(l.x, l.y + 0.5, l.z), 0xe6dccb, 24, 2.6, 0.6, 3, 0.4);
    flash(tmpA.set(l.x, l.y + 0.2, l.z), 0xffd08a, 5);
    STOCK.hold = false;
    STOCK.k = 0;
    // and everything stops until he has said which: see frame, and guardPick
    GUARD.pause = l;
    LOCK = true;
    STOCK.pickEl.style.display = 'flex';
  } else if (l && STOCK.k >= 1) {
    // the ring has closed: the wood is spent and the lamp begins to put itself together
    woodGain(-costOf(l));
    l.built = true;
    if (l.kind) placeBuilt(l);
    STOCK.hold = false;
    STOCK.k = 0;
    STOCK.at = null;
    flash(tmpA.set(l.x, l.y + 0.2, l.z), 0xffd08a, 5);
  }
  // (one disc for a lamp, a wall or the night; the pair of them at a guard's circle)
  // The sign with the cost and the ring is there only while he is building: from the moment he holds until the ring has
  // run back. (Also for a moment when he tries and cannot, so that he sees the price or the cross that stopped him; and
  // always for calling the night.) Until then the place is shown by its faint ghost alone
  sg.style.display = STOCK.at && !STOCK.at.wait && (STOCK.at.rite || STOCK.hold || STOCK.k > 0 || T < (STOCK.denyT || 0)) ? 'flex' : 'none';

  // the ghost stands on the platform he is at: breathing a little, firmer as the ring fills, red if he cannot pay
  siteMarks(dt);
  GHOST.opacity = 0.13 + 0.03 * Math.sin(T * 3) + 0.45 * STOCK.k;
  GHOST.color.set(STOCK.shut || STOCK.n < costOf(STOCK.at) ? 0xff7a6a : 0xffd9a0);
  PLACES.ghost.color.copy(GHOST.color);
  PLACES.ghost.opacity = 0.045 + 0.4 * STOCK.k;
  STOCK.ring.setAttribute('stroke-dashoffset', RING_LEN * (1 - STOCK.k));
  if (!STOCK.at) return;
  // A place to build has its sign over the head of the brother being played, always in the same spot above him, so that it
  // is never in front of him wherever the place lies. The sign for calling the night stays over its symbol
  if (l.rite) tmpA.set(l.x, l.y + 2.0, l.z);
  else tmpA.set(P.x, P.y + 2.5, P.z);
  tmpA.project(cam);
  if (l.wait) return;
  sg.style.transform = `translate(-50%,-100%) translate(${((tmpA.x + 1) / 2) * innerWidth}px,${((1 - tmpA.y) / 2) * innerHeight}px) scale(${1 + 0.06 * STOCK.k})`;
  const poor = !l.rite && (STOCK.shut || STOCK.n < costOf(l)),
    num = sg.querySelector('i'),
    price = STOCK.shut ? '✕' : String(costOf(l));
  // (the price on the sign is this place's own)
  if (num && !l.rite && num.textContent !== price) num.textContent = price;
  if (num) num.style.color = poor ? '#ff8a7a' : '#fff3df';
  sg.style.opacity = poor ? 0.8 : 1;
}
// A lamp putting itself together: the foot comes down onto the platform, then the stem onto the foot, then the dish, then the
// five spouts one after another round its rim. Each piece flies in from up and to one side, small and turning, and grows to
// its size as it arrives; where it lands a little dust jumps. When the last is in, the lamp is ready to be lit
function assemble(l, dt) {
  l.t += dt;
  for (const q of l.parts) {
    const k = Math.max(0, Math.min(1, (l.t - q.t0) / PIECE_T));
    if (k <= 0) continue;
    const e = 1 - Math.pow(1 - k, 3),
      // (it swells a little past its size just as it lands, and settles)
      pop = k < 1 ? 0.25 + 0.75 * e + 0.18 * Math.sin(k * Math.PI) * k : 1;
    q.o.visible = true;
    q.o.position.copy(q.from).multiplyScalar(1 - e);
    q.o.rotation.y = (1 - e) * 4;
    q.o.scale.setScalar(pop);
    if (k >= 1 && !q.down) {
      q.down = true;
      const first = l.parts.indexOf(q);
      puff(tmpA.set(l.x, l.y + [0.05, 0.5, 1.3][first] || l.y + 1.4, l.z), first ? 0xe8c9a0 : 0xd8c8a0, first ? 6 : 16, first ? 1.2 : 2.2, 0.4, 2, first ? 0.15 : 0.5);
    }
  }
  if (l.t >= LAMP_T) {
    l.ready = true;
    // (it stands dark: Rama lights them all at once, with the arrow that ends the day)
    puff(tmpA.set(l.x, l.y + 1.5, l.z), 0xffe2a8, 14, 1.6, 0.6, -0.6, 0.35);
  }
}
// ---------- instructions ----------
// How to do each thing, shown the first time it can be done, where the dialogue box sits (see tip):
//   how to move      from the start, until Rama has gone a few paces
//   how to build     the first time he stands at a lamp's platform, until a lamp has been built
//   the Agneyastra   once it has been given, until he has loosed one
const TIPS = { from: null, moved: false, built: false, agni: false, t: {} };
// the type: one family for the whole level. Upright and firm for labels and numbers, italic for anything said or explained.
// (set here, with its own request for the face, as the page and its stylesheet may be old cached ones)
{
  const lk = document.createElement('link');
  lk.rel = 'stylesheet';
  lk.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap';
  const st = document.createElement('style');
  st.textContent =
    ":root{--f:'Cormorant Garamond',Georgia,serif}html,body{font:500 17px/1.4 var(--f)}button{font:600 16px var(--f)}#load{font:600 22px var(--f)}" +
    '#summon span{font:700 13px var(--f)}#party b{font-weight:700;font-size:17px}' +
    // Flat dark panels, no borders or glows. The gold is kept for what matters: names, the key numbers, and a bar of it down
    // the edge of the card of the brother being played
    'button{border:none}#party .card{border:none;background:rgba(22,22,24,.6);backdrop-filter:none;opacity:.85}' +
    '#party .card.on{background:rgba(22,22,24,.86);opacity:1;box-shadow:inset 3px 0 0 #ffd08a}#party img{border:none;background:none}#party b{color:#ffe2b0}';
  document.head.append(lk, st);
}
function tipsUpdate() {
  const P = RAMA.group.position;
  if (!TIPS.from) TIPS.from = P.clone();
  // how to move is said once, as the level opens from its start, and never later; the Agneyastra's keys only on being given it
  // (so not when the level is opened part-way through, with the gift already made)
  if (P.distanceTo(TIPS.from) > 8 || T > 12 || new URLSearchParams(location.search).get('skip')) TIPS.moved = true;
  if (TIPS.gift === undefined) TIPS.gift = !!ARR.talked;
  if (TIPS.gift) TIPS.agni = true;
  if (LAMPS.some((l) => l.built)) TIPS.built = true;
  if (!TIPS.agni && shots.some((s) => s.live && s.K.agni)) TIPS.agni = true;
  // (none stays long: the building one six seconds at a time, the others six seconds in all)
  const k = LOCK
      ? ''
      : !TIPS.built && STOCK.at
        ? 'build'
        : !TIPS.agni && ARR.talked
          ? 'agni'
          : !TIPS.moved
            ? 'move'
            : '',
    dt = Math.min(0.1, T - (TIPS.last || T));
  TIPS.last = T;
  if (k && !talking()) TIPS.t[k] = (TIPS.t[k] || 0) + dt;
  if (k !== 'build') TIPS.t.build = 0;
  if (TIPS.t.agni > 6) TIPS.agni = true;
  if (TIPS.t.move > 6) TIPS.moved = true;
  // a hint, while it lasts; otherwise the goal
  tip(
    !k || TIPS.t[k] > 6
      ? LOCK
        ? ''
        : goal()
      : k === 'build'
        ? STOCK.n < costOf(STOCK.at)
          ? 'A lamp needs more Tejas than you have.'
          : 'Hold <kbd>Space</kbd> or the mouse to construct the lamp.'
        : k === 'agni'
          ? 'Press <kbd>2</kbd> to draw the Agneyastra, then click to loose it.'
          : '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to move. Click to shoot. Hold the right mouse button to turn the view. <kbd>Esc</kbd> for the menu.',
  );
}
// ---------- the brothers' health ----------
// There are no cards for them on the screen. A brother who is hurt carries a small bar over his head, which is gone again
// once he is whole; and he mends by himself, slowly: a hundredth of his health each second
const REGEN = 0.01;
{
  $('party').style.display = 'none';
  for (const h of HEROES) {
    const el = document.createElement('div');
    el.style.cssText =
      'position:fixed;left:0;top:0;z-index:12;width:54px;height:6px;border-radius:3px;background:rgba(22,22,24,.6);overflow:hidden;pointer-events:none;opacity:0;transition:opacity .4s';
    el.innerHTML = '<s style="display:block;height:100%;width:100%;border-radius:3px;background:#d9483a"></s>';
    document.body.append(el);
    h.bar = el;
  }
}
function heroBars(dt) {
  for (const h of HEROES) {
    if (h.hp > 0 && h.hp < h.hpMax) h.hp = Math.min(h.hpMax, h.hp + h.hpMax * REGEN * dt);
    const hurt = h.hp > 0 && h.hp < h.hpMax - 0.5,
      P = h.group.position;
    h.bar.style.opacity = hurt ? 1 : 0;
    h.bar.firstChild.style.width = (100 * h.hp) / h.hpMax + '%';
    tmpA.set(P.x, P.y + 2.25, P.z).project(cam);
    h.bar.style.display = tmpA.z < 1 ? 'block' : 'none';
    h.bar.style.transform = `translate(-50%,-50%) translate(${((tmpA.x + 1) / 2) * innerWidth}px,${((1 - tmpA.y) / 2) * innerHeight}px)`;
  }
  // with an astra on the bow: small fires float in a slow ring over Rama's head, one for each he can loose now; the next kindles as his strength returns
  const k = ASTRA.armed,
    O = ASTRA.orbs || (ASTRA.orbs = []),
    cost = k ? KINDS[k].cost : 1,
    n = k ? Math.floor(RAMA.mpMax / cost) : 0,
    can = Math.floor(RAMA.mp / cost),
    part = (RAMA.mp % cost) / cost,
    P = RAMA.group.position,
    nk = RAMA.nock;
  while (O.length < n) {
    const g = glow(0xffffff, 1),
      c = glow(0xfff2c0, 1);
    scene.add(g, c);
    O.push({ g, c, s: 0 });
  }
  O.forEach((o, i) => {
    // (each swells in and dies away rather than popping)
    // (and only while he has the bow up: at rest there is nothing over his head)
    const want = !k || i >= n || !RAMA.group.visible || SKYSHOT || !(RAMA.s && RAMA.s.wAim > 0.3) ? 0 : i < can ? 1 : 0;
    o.s += (want - o.s) * Math.min(1, dt * 8);
    o.g.visible = o.c.visible = o.s > 0.02;
    if (!o.g.visible) return;
    const a = T * 1.1 + (i * 6.283) / Math.max(1, n),
      fl = 1 + 0.12 * Math.sin(T * 17 + i * 2.1) + 0.08 * Math.sin(T * 29.3 + i);
    o.g.position.set(P.x + Math.cos(a) * 0.62, P.y + 2.5 + 0.07 * Math.sin(T * 2.6 + i * 1.7), P.z + Math.sin(a) * 0.62);
    // the fire for the next arrow comes down out of the ring onto the arrow's head as he draws, and leaves with it
    const feed = nk.visible && i === can - 1;
    if (!feed && o.t > 0 && i >= can) o.t = o.s = 0;
    o.t = (o.t || 0) + ((feed ? 1 : 0) - (o.t || 0)) * Math.min(1, dt * 9);
    if (o.t > 0.01) o.g.position.lerp(nk.userData.glow.getWorldPosition(tmpA), o.t);
    o.c.position.copy(o.g.position);
    o.g.material.color.set(KINDS[k || ASTRA.last || 1].color);
    o.g.scale.setScalar(0.4 * o.s * fl);
    o.c.scale.setScalar(0.15 * o.s * fl);
    if (o.s > 0.8 && Math.random() < dt * 5) puff(o.g.position, KINDS[k || 1].color, 1, 0.5, 0.2, -1.5, 0.12);
  });
}
// ---------- what the aim is on ----------
// The pointer stays the ordinary hand. What the next arrow will go to is shown in the world instead, flat on the ground:
//   a demon the aim has snapped to   a broken ring round its feet, red, turning slowly; bigger round a brute
//   an unlit lamp it has snapped to  the same ring round the lamp's foot, in the fire's orange
//   anywhere                         the soft glow at the aim point itself, always there
// The ring closes in onto a new target from a little wider, so the eye catches the change. All of it is hidden during
// scenes and talk, and while the pointer is off the world
const MARK = { ring: new THREE.Group(), on: null, k: 0, a: 0 };
{
  const m = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, fog: false, side: THREE.DoubleSide });
  MARK.ringM = m(0xe04a38, 0);
  // (four arcs with gaps between them)
  for (let i = 0; i < 4; i++) {
    const a = new THREE.Mesh(new THREE.RingGeometry(0.95, 1, 20, 1, i * (Math.PI / 2) + 0.2, Math.PI / 2 - 0.4), MARK.ringM);
    a.rotation.x = -Math.PI / 2;
    MARK.ring.add(a);
  }
  MARK.ring.renderOrder = 3;
  MARK.ring.traverse((o) => (o.frustumCulled = false));
  scene.add(MARK.ring);
}
function aimMarks(dt) {
  const show = AIMED.on && !LOCK && !talking() && SEL.hp > 0,
    d = show && AIMED.lock && !AIMED.lock.dead ? AIMED.lock : null,
    lamp = show && !d ? AIMED.snap : null,
    tgt = d || lamp || null,
    ease = Math.min(1, dt * 12);
  // a new target: the ring starts a little wide and closes onto it
  if (tgt !== MARK.on) {
    MARK.on = tgt;
    if (tgt) MARK.k = 0;
  }
  MARK.k = Math.min(1, MARK.k + dt / 0.18);
  MARK.a += ((tgt ? 0.65 : 0) - MARK.a) * ease;
  MARK.ringM.opacity = MARK.a;
  MARK.ring.visible = MARK.a > 0.02;
  if (tgt) {
    const x = d ? d.g.position.x : lamp.x,
      z = d ? d.g.position.z : lamp.z,
      r = d ? (d.def.radius || 0.4) * 1.5 + 0.12 : 0.85;
    MARK.ringM.color.set(d ? 0xe04a38 : 0xff8a2a);
    MARK.ring.position.set(x, groundY(x, z) + 0.1, z);
    MARK.ring.scale.setScalar(r * (1.2 - 0.2 * MARK.k * (2 - MARK.k)));
    MARK.ring.rotation.y += dt * 0.9;
  }
  // the glow at the aim point: there all the time the player is aiming, not only while he shoots, and soft
  reticle.visible = show;
  reticle.material.opacity = 0.4;
}

// ---------- the demons' health bars ----------
// Drawn the same way as the brothers', a flat bar on the screen over the demon's head, but a little different to look at:
// square-ended, a touch thinner, on a darker track and in a deeper red, so a demon's bar is not taken for a brother's. They are
// placed after the camera has moved so it does not trail. (The bars the enemies make for themselves in the scene are kept
// hidden; their eased level, d.barV, is still what is shown.) A brute's is wider, a pishacha's narrower. Far off they fade out
const FOE_BARS = [];
function foeBars() {
  for (let i = FOE_BARS.length - 1; i >= 0; i--)
    if (!grunts.includes(FOE_BARS[i].d)) {
      FOE_BARS[i].el.remove();
      FOE_BARS.splice(i, 1);
    }
  for (const d of grunts) {
    if (!d.bar) continue;
    d.bar.g.visible = false;
    if (!d.hpEl) {
      const el = document.createElement('div');
      el.style.cssText = `position:fixed;left:0;top:0;z-index:11;width:${d.br ? 42 : d.pi ? 26 : 32}px;height:4px;border-radius:1px;background:rgba(22,12,18,.8);overflow:hidden;pointer-events:none;display:none`;
      el.innerHTML = '<s style="display:block;height:100%;width:100%;background:#b8321f"></s>';
      document.body.append(el);
      d.hpEl = el;
      FOE_BARS.push({ d, el });
    }
    const el = d.hpEl,
      P = d.g.position,
      on = d.hp < d.hp0 && (!d.dead || d.barV > 0.03) && d.g.visible;
    if (on) {
      tmpA.set(P.x, P.y + d.def.barY * (d.pi || d.df ? 1 : d.k || 1), P.z);
      const far = tmpA.distanceTo(cam.position);
      tmpA.project(cam);
      if (tmpA.z < 1 && far < 80) {
        el.style.display = 'block';
        el.style.opacity = Math.min(1, (80 - far) / 25);
        el.firstChild.style.width = 100 * Math.max(0, d.barV) + '%';
        el.style.transform = `translate(-50%,-50%) translate(${((tmpA.x + 1) / 2) * innerWidth}px,${((1 - tmpA.y) / 2) * innerHeight}px)`;
        continue;
      }
    }
    el.style.display = 'none';
  }
}
// ---------- coins ----------
// A brute carries a coin. When he dies it jumps out of him, falls and lies turning on the ground where it came down, shining a
// little; the first brother to come anywhere near draws it to him, and it is counted
const COINS = [],
  COIN_WORTH = 2,
  COIN_M = toon(0xa9a393, { rim: 0.15 }),
  COIN_G = new THREE.CylinderGeometry(0.26, 0.26, 0.06, 20);
// The end of the day (and of the night): every coin not yet claimed flies to Rama, wherever he is. Those lying on the ground
// go from where they lie; what the woodcutters have earned by their gathering comes from the wood store, a few coins one
// after another, each worth its share
// The night's end, for coins. Those lying near the brother being played (and the workmen's pay, if he stands near where it
// is kept) fly to him over the ground, as before. Anything further off does not cross the map to him: it goes straight to
// the counter at the foot of the screen, as a coin that comes in from where it lay (or from the screen's edge on that side,
// if it lay out of sight), swings up, and drops into the count
const COIN_NEAR = 14;
function coinToCounter(pos, worth, delay) {
  // (a plain drop: it appears a little above the counter and falls into it. It used to come in from where the coin lay in
  // the world, across the screen. `pos` is kept for the callers, and no longer used)
  const r = STOCK.el.getBoundingClientRect(),
    x1 = r.left + 10,
    y1 = r.top + r.height / 2,
    el = document.createElement('div');
  el.style.cssText = 'position:fixed;left:0;top:0;z-index:14;width:18px;height:18px;margin:-9px 0 0 -9px;pointer-events:none;opacity:0;filter:drop-shadow(0 0 6px rgba(255,208,138,.7))';
  el.innerHTML = TEJAS_ICON;
  document.body.append(el);
  const at = (x, y, sc) => `translate(${x}px,${y}px) scale(${sc})`;
  el.animate(
    [
      { transform: at(x1, y1 - 46, 0.8), opacity: 0, offset: 0 },
      { transform: at(x1, y1 - 40, 1), opacity: 1, offset: 0.25 },
      { transform: at(x1, y1, 0.75), opacity: 1, offset: 1 },
    ],
    { duration: 380, delay: delay * 1000, easing: 'cubic-bezier(.5,0,.9,.6)', fill: 'forwards' },
  ).onfinish = () => {
    el.remove();
    woodGain(worth);
  };
}
function coinsHome() {
  const me = SEL.group.position;
  let far = 0;
  for (const c of [...COINS]) {
    if (apart(c.g.position, me) < COIN_NEAR) {
      c.to = SEL;
      c.far = true;
      c.t = 0;
      continue;
    }
    coinToCounter(c.g.position, c.worth === undefined ? COIN_WORTH : c.worth, far++ * 0.09);
    scene.remove(c.g);
    COINS.splice(COINS.indexOf(c), 1);
  }
  // (the woodcutters' from the wood store, the masons' from their yard)
  for (const [n, at] of [
    [STOCK.pend, WOODSHED],
    [STOCK.pendS, WORKSHOP],
  ]) {
    const near = Math.hypot(at[0] - me.x, at[1] - me.z) < COIN_NEAR,
      m = Math.min(n, near ? 12 : 8);
    for (let i = 0; i < m; i++) {
      const worth = Math.floor(n / m) + (i < n % m ? 1 : 0);
      if (!near) {
        coinToCounter(tmpB.set(at[0] + R(-1, 1), groundY(at[0], at[1]) + 1.2, at[1] + R(-1, 1)), worth, far++ * 0.09);
        continue;
      }
      const g = new THREE.Group(),
        gl = glow(0xfff0c8, 0.55);
      add(g, COIN_G, COIN_M, [0, 0, 0], [Math.PI / 2, 0, 0]);
      g.add(gl);
      g.position.set(at[0] + R(-1, 1), groundY(at[0], at[1]) + 1.2, at[1] + R(-1, 1));
      g.visible = false;
      scene.add(g);
      COINS.push({ g, gl, vx: 0, vz: 0, vy: 0, down: true, to: SEL, far: true, t: 0, wait: i * 0.14, worth });
    }
  }
  STOCK.pend = STOCK.pendS = 0;
}
function coinsUpdate(dt) {
  for (const d of grunts)
    if (d.br && d.dead && !d.coin) {
      d.coin = true;
      const g = new THREE.Group(),
        P = d.g.position,
        a = Math.random() * 6.283,
        gl = glow(0xfff0c8, 0.55);
      add(g, COIN_G, COIN_M, [0, 0, 0], [Math.PI / 2, 0, 0]);
      g.add(gl);
      g.position.set(P.x, P.y + 1.6, P.z);
      scene.add(g);
      COINS.push({ g, gl, vx: Math.cos(a) * 1.6, vz: Math.sin(a) * 1.6, vy: 6.5, down: false, to: null, t: 0 });
    }
  for (let i = COINS.length - 1; i >= 0; i--) {
    const c = COINS[i],
      P = c.g.position;
    // (one sent for at the day's end waits its turn, unseen)
    if (c.wait > 0) {
      c.wait -= dt;
      continue;
    }
    c.g.visible = true;
    c.t += dt;
    c.g.rotation.y += dt * (c.down ? 2.6 : 11);
    c.gl.material.opacity = 0.1 + 0.04 * Math.sin(c.t * 4);
    if (c.to && c.far) {
      // One called in at the night's end: it lifts from where it lay and crosses to Rama in one even arc, slow to start and
      // slow to land, in a time set by how far it has to come
      const q = c.to.group.position;
      if (!c.from) {
        c.from = P.clone();
        c.t = 0;
        c.dur = 0.8 + 0.012 * Math.hypot(q.x - P.x, q.z - P.z);
      }
      const k = Math.min(1, c.t / c.dur),
        e = k * k * (3 - 2 * k);
      // (it ends over his head, not on him, and is gone there: smaller and smaller over the last of the way, to nothing)
      P.set(c.from.x + (q.x - c.from.x) * e, c.from.y + (q.y + 2.7 - c.from.y) * e + 2 * Math.sin(Math.PI * e), c.from.z + (q.z - c.from.z) * e);
      c.g.scale.setScalar(1 - Math.max(0, (k - 0.75) / 0.25));
      if (k >= 1) {
        woodGain(c.worth === undefined ? COIN_WORTH : c.worth);
        scene.remove(c.g);
        COINS.splice(i, 1);
      }
      continue;
    }
    if (c.to) {
      // drawn in to the brother who came for it, quicker the nearer it gets
      const q = c.to.group.position,
        k = Math.min(1, dt * (6 + c.t * 20));
      P.x += (q.x - P.x) * k;
      P.y += (q.y + 1.1 - P.y) * k;
      P.z += (q.z - P.z) * k;
      c.g.scale.setScalar(Math.max(0.3, 1 - c.t * 1.6));
      if (Math.hypot(q.x - P.x, q.z - P.z) < 0.35) {
        puff(P, 0xfff0c8, 8, 1.6, 0.3, 0, 0.25);
        woodGain(c.worth === undefined ? COIN_WORTH : c.worth);
        scene.remove(c.g);
        COINS.splice(i, 1);
      }
      continue;
    }
    if (!c.down) {
      c.vy -= 16 * dt;
      P.x += c.vx * dt;
      P.y += c.vy * dt;
      P.z += c.vz * dt;
      const y = groundY(P.x, P.z) + 0.42;
      if (P.y <= y && c.vy < 0) {
        // (one small bounce, then it stays)
        if (c.vy < -3) {
          P.y = y;
          c.vy *= -0.35;
          c.vx *= 0.4;
          c.vz *= 0.4;
        } else {
          c.down = true;
          c.y = y;
        }
      }
    } else {
      P.y = c.y + 0.07 * Math.sin(c.t * 2.4);
      const h = HEROES.find((h) => h.hp > 0 && Math.hypot(h.group.position.x - P.x, h.group.position.z - P.z) < 4.5);
      if (h) {
        c.to = h;
        c.t = 0;
      }
    }
  }
}
// ---------- the menu ----------
// There is no button for it. Escape brings up a short list in the middle of the screen: go on, look at the map, start the
// level again, or leave
{
  for (const id of ['menu', 'hud']) if ($(id)) $(id).style.display = 'none';
  const m = document.createElement('div');
  m.style.cssText = 'position:fixed;inset:0;z-index:60;display:none;place-items:center;background:rgba(12,12,14,.55);backdrop-filter:blur(3px)';
  m.innerHTML =
    '<div style="display:flex;flex-direction:column;gap:2px;min-width:230px;padding:14px;border-radius:10px;background:#1c1c1ef2;text-align:center">' +
    ['Resume', 'Map', 'Restart level', 'Main menu']
      .map((t, i) => `<a data-i="${i}" href="${['#', '#', 'level1.html', 'index.html'][i]}" style="padding:10px 14px;border-radius:6px;color:#f1e4cc;text-decoration:none;font:600 20px var(--f);letter-spacing:.03em">${t}</a>`)
      .join('') +
    '</div>';
  document.body.append(m);
  const show = (on) => (m.style.display = on ? 'grid' : 'none');
  for (const a of m.querySelectorAll('a')) {
    a.onmouseenter = () => (a.style.background = 'rgba(255,208,138,.14)');
    a.onmouseleave = () => (a.style.background = 'none');
  }
  m.addEventListener('pointerdown', (e) => e.stopPropagation());
  m.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a && a.dataset.i > 1) return;
    e.preventDefault();
    show(false);
    // (Map: the list goes away and the map opens in its place)
    if (a && a.dataset.i === '1') MINI.toggle(true);
  });
  addEventListener('keydown', (e) => e.code === 'Escape' && show(m.style.display === 'none'));
}
function lampsUpdate(dt) {
  buildUpdate(dt);
  for (const l of LAMPS) {
    if (l.built && !l.ready) assemble(l, dt);
    if (!l.lit) continue;
    // it catches over half a second, then burns unevenly: the flame leaning and stretching, the light wavering with it
    l.glow = Math.min(1, l.glow + dt * 2);
    // (a lamp shows its hurt as the fire does: each blow it has taken leaves its flames lower and its light less, and at
    // the blow itself they gutter)
    l.dip = Math.max(0, (l.dip || 0) - dt * 2.5);
    l.str = (l.str === undefined ? 1 : l.str) + ((1 - 0.2 * Math.min(4, l.hits || 0)) * (1 - 0.4 * l.dip) - (l.str === undefined ? 1 : l.str)) * Math.min(1, dt * 10);
    const f = (0.9 + 0.1 * Math.sin(T * 11 + l.seed) + 0.05 * Math.sin(T * 23.7 + l.seed * 2)) * l.str;
    // (each of the five flames wavers in its own time)
    l.flame.children.forEach((c, i) => {
      const k = 0.85 + 0.15 * Math.sin(T * (10 + i * 1.7) + l.seed + i * 2.1) + 0.08 * Math.sin(T * 24.3 + i * 4);
      c.scale.set(l.glow * l.str * (0.9 + 0.1 * k), l.glow * l.str * k, l.glow * l.str * (0.9 + 0.1 * k));
      c.rotation.z = Math.sin(T * 5 + l.seed + i) * 0.1;
    });
    l.light.intensity = 20 * l.glow * f; // (was 14)
    if (Math.random() < dt * 2) puff(tmpA.set(l.x + R(-0.5, 0.5), l.y + 1.7, l.z + R(-0.5, 0.5)), 0xffb347, 1, 0.3, 0.8, -1.5, 0.1);
  }
}

// in the dialogue box everyone is shown the same way, by a photograph taken by the game's own camera at the moment they speak,
// so the brothers' pictures there match Vishwamitra's and the villagers' (the drawn portraits are for the cards)
const photo = (h) => snap(h.bone.head, h.group.rotation.y, h.group);
function portrait(h) {
  cards[h.name].querySelector('img').src = h.face = FACES[h.name] || snap(h.bone.head, h.group.rotation.y, h.group);
}
function meters() {
  for (const h of HEROES) {
    const c = cards[h.name];
    c.querySelector('.hp s').style.width = (100 * h.hp) / h.hpMax + '%';
    // the damage of one arrow, and attack speed as Dota counts it: bigger is faster, with Rama's own pace counted as 120
    // (Lakshmana's drops to Rama's while he is tired)
    c.querySelector('.atk').textContent = h.dmg[0] + '–' + h.dmg[1];
    c.querySelector('.spd').textContent = Math.round(120 / (h.tired ? 1 : h.pace));
    if (h.mp !== undefined) c.querySelector('.mp s').style.width = (100 * h.mp) / h.mpMax + '%';
    if (h === RAMA) astraDraw();
    if (h.st !== undefined) {
      const bar = c.querySelector('.st s');
      bar.style.width = (100 * h.st) / h.stMax + '%';
      // set here, not in the stylesheet, so an old cached stylesheet cannot leave it blank
      bar.style.background = '#4fc45a';
    }
  }
}

// the shared files call ui() whenever a control changes state
function ui() {
  // no row of arrow buttons in this level: Rama's astras are still there on Q and E
  $('arrows').style.display = 'none';
  for (const n in cards) cards[n].classList.toggle('on', n === who);
}

// ---------- the loop ----------
let shown = 0,
  shot = 0,
  fr = 0;
// ---------- starting part-way through, for testing ----------
// The page's address can say where to begin, so what comes later can be tried without playing what comes before:
//   level1.html?skip=rescue   the first camp is already dealt with: its demons gone, its villagers freed and seated by the
//                             fire, and the brothers standing just west of the hermitage
//   level1.html?skip=talk     that, and Vishwamitra's talk is over too: Rama has the Agneyastra and the brothers stand by
//                             the altar, free to move
//   level1.html?skip=night    that, and the four lamps stand built as well, and the night begins by itself a moment after
//                             the level opens: for trying out what comes in the dark. (NIGHT.lab is set, for anything that
//                             should be different on such a night)
//   level1.html?skip=morning  that night is already over: the lamps stand, it is day again, and what the second morning
//                             brings (the woodcutter with word of the two far camps) begins at once
//   level1.html?skip=saved    the second morning with both far camps already freed: the masons' coins are in hand, a
//                             blessing (the first of them) is on the bow, and the ground can be built on
// With nothing after the name, the level starts at the beginning as usual
{
  const skip = new URLSearchParams(location.search).get('skip');
  if (skip === 'rescue' || skip === 'talk' || skip === 'night' || skip === 'morning' || skip === 'saved') {
    const c = CAMPS[0];
    c.guards.forEach((d) => grunts.includes(d) && banish(d));
    c.roused = c.cried = c.seen = c.thanked = c.rescued = true;
    c.prisoners.forEach((p, i) => {
      p.free = true;
      p.by = RAMA;
      p.ropes.forEach((o) => o.parent && o.parent.remove(o));
      p.up = p.nam = 1;
      p.hold = 99;
      p.go = true;
      p.path = [];
      toWood(p, woodN++);
      p.g.position.set(p.wood.home[0], 0, p.wood.home[1]);
    });
    const at = skip !== 'rescue' ? [SEATS.rama, SEATS.lak] : [V3(-42, 0, 1), V3(-44, 0, 2.2)];
    HEROES.forEach((h, i) => {
      h.group.position.copy(at[i]);
      if (h.post) h.post.copy(at[i]);
    });
    if (skip === 'night') {
      NIGHT.lab = true;
      // (each lamp is taken as built and its putting-together as over, so that it stands whole on the first frame)
      for (const l of LAMPS) {
        l.built = true;
        l.t = LAMP_T + 1;
      }
      const iv = setInterval(() => {
        if (T < 1.5 || !LAMPS.every((l) => l.ready)) return;
        clearInterval(iv);
        nightStart();
      }, 100);
    }
    if (skip === 'morning' || skip === 'saved') {
      // the first night is over without having been fought: the lamps stand, dark again, and it is day
      for (const l of LAMPS) {
        l.built = true;
        l.t = LAMP_T + 1;
      }
      NIGHT.day = 2;
      for (const c of CAMPS) campShow(c);
      // (and plenty to build with, for trying designs: these two starts are for that)
      woodGain(300);
    }
    if (skip === 'saved') {
      // both far camps are freed, with nothing fought or said: their guards are gone, their captives stand loose and set
      // off for the hermitage on their own, and what each camp gives has been given
      for (const c of CAMPS) {
        if (c.first) continue;
        c.guards.forEach((d) => grunts.includes(d) && banish(d));
        c.roused = c.cried = c.seen = c.thanked = c.rescued = true;
        for (const p of c.prisoners) {
          p.free = true;
          p.by = RAMA;
          p.ropes.forEach((o) => o.parent && o.parent.remove(o));
        }
      }
      woodGain(MASON_GIFT);
      BOONS[0].take();
    }
    if (skip !== 'rescue') {
      ARR.step = 'done';
      ARR.talked = true;
      ARR.bow = false;
      giveAstra(1);
      // (without the show of it being given)
      ASTRA.fx = 0;
    }
  }
}
// With the flag `dev` in the address (level1.html?dev), a small row of buttons shows at the top of the screen, one for each
// place the level can be started from. Pressing one reloads the page there, keeping the flag, so the buttons stay
if (new URLSearchParams(location.search).has('dev')) {
  // (there is no dawn yet: T counts the day's gathering as the end of a night would)
  addEventListener('keydown', (e) => e.code === 'KeyT' && !e.repeat && nightTally());
  // (and B begins the night at once, lamps or no lamps)
  addEventListener('keydown', (e) => e.code === 'KeyB' && !e.repeat && nightStart());
  const now = new URLSearchParams(location.search).get('skip') || '',
    row = document.createElement('div'),
    sel = document.createElement('select');
  // (a small box in the top right corner, faint until the pointer is on it, showing the place the level was started at)
  row.style.cssText = 'position:fixed;right:14px;top:10px;z-index:40;display:flex;gap:2px;align-items:center';
  for (const [label, skip] of [
    ['Start', ''],
    ['Rescue', 'rescue'],
    ['Talk', 'talk'],
    ['Night', 'night'],
    ['Morning', 'morning'],
    ['Saved', 'saved'],
  ]) {
    const o = document.createElement('option');
    o.textContent = label;
    o.value = skip;
    o.selected = skip === now;
    sel.append(o);
  }
  // (one small faint box: choosing a place reloads the page there. Keys never change it, so they stay with the game)
  sel.style.cssText = 'font:600 13px var(--f);letter-spacing:.06em;padding:3px 6px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.25);border-radius:5px;color:#fff;opacity:.45;transition:opacity .15s';
  sel.onmouseenter = () => (sel.style.opacity = 1);
  sel.onmouseleave = () => (sel.style.opacity = 0.45);
  // (and a second box beside it for which pattern is on the ground; either choice keeps the other)
  const pat = sel.cloneNode(false),
    go = () => (location.search = '?dev' + (sel.value ? '&skip=' + sel.value : '') + (pat.value ? '&pattern=' + pat.value : ''));
  for (const [label, v] of [
    ['Triangles', ''],
    ['Rings', 'rings'],
  ]) {
    const o = document.createElement('option');
    o.textContent = label;
    o.value = v;
    o.selected = PLACES.rings === !!v;
    pat.append(o);
  }
  for (const b of [sel, pat]) {
    b.onmouseenter = () => (b.style.opacity = 1);
    b.onmouseleave = () => (b.style.opacity = 0.45);
    b.onkeydown = (e) => e.preventDefault();
    b.onchange = go;
  }
  row.style.gap = '6px';
  row.append(pat, sel);
  document.body.append(row);
}
function frame(now) {
  requestAnimationFrame(frame);
  const dt = tick(now);
  // While the choice of a guard is up, the level is stopped: no time passes and nothing moves, the picture simply stays
  if (GUARD.pause) {
    T -= dt;
    composer.render();
    return;
  }
  // while anyone is speaking the enemies stand frozen, just as the brothers do
  HOLD_FOES = talking();
  heroUpdate(dt);
  shotsUpdate(dt);
  worldUpdate(dt);
  // The camera is moved before the level's own update, and its matrices brought up to date at once: the health bars, the lamp
  // sign and the sky are placed from where the camera is, and placed from last frame's camera they trail and shake as it moves
  cameraUpdate(dt);
  cam.updateMatrixWorld();
  sceneryUpdate(dt);
  if (!shot && T > 0.5) {
    shot = 1;
    HEROES.forEach(portrait);
  }
  composer.render();
  if (++fr % 6 === 0) {
    meters();
  }
  // the curtain lifts only once the scene has run for a moment
  if (!shown && T > 0.8) {
    shown = 1;
    $('load').style.opacity = 0;
    setTimeout(() => $('load').remove(), 700);
  }
}
ui();
// (the arrow he starts with: plain, unless a dev start has already armed an astra. This used to put the plain arrow back
// on the string after such a start, while the icon went on showing the astra)
pickKind(ASTRA.armed || 0);
if (RAMA.s) RAMA.s.kind = ASTRA.armed || 0;
requestAnimationFrame(frame);
window.L = { rama, grunts, summon, state: () => ({ move, firing, shots: shots.length, who, follow: FOLLOW }) };
