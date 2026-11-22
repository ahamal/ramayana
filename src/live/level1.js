'use strict';
// Level 1: Siddhashrama, on a clear morning. Rama and Lakshmana start in the forest west of a river and walk right (east).
// Across the river the map proper begins: about a hundred and eighty metres of country, shut in on the far side by a second river.
// The altar where Vishwamitra sits is in the middle, his hut just beyond it. Half way along the road rakshasas hold prisoners.
// Still to come here: what happens on arrival, the waves, the altar's health, and winning and losing.

// ---------- the stage ----------
setDay();
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
      [-68, 28],
      [-48, 34.5],
      [-24, 38.5],
      [-2, 41.6],
      [24, 44],
      [46, 45],
      [62, 45.2],
      [73.5, 41.5],
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
    [0.4, 41.9],
  ],
  FORD_R = 4.6,
  // half the width of a river, bank to bank
  RW = 4.4,
  // how much wider than that each river is on either side: the east one is the bigger
  WIDER = [0, 1.2, 0],
  // the road that comes up from the south beside the joined river, over the third crossing and on to the altar
  SOUTH_ROAD = [
    [0, 122],
    [1.5, 86],
    [3.2, 74],
    [4.4, 64],
    [5.4, 54],
    [2.6, 47],
    [0.4, 41.9],
    [0, 34],
    [0.5, 24],
    [0, 13.5],
  ],
  southWay = (x, z, pad) => z > 11 && Math.abs(x - (z < 42 ? 0.3 : z < 54 ? 0.4 + (z - 42) * 0.42 : 5.4 - (z - 54) * 0.12)) < pad,
  // the demons' camp is a little way past the river and off the road, on its far side
  CAMP = V3(-66, 0, -3.5),
  // until the prisoners are freed nobody may go further east than this: a dotted line across the map, just beyond the camp
  HOLD_X = -66 + 12,
  // and no further north or south than these: with the far limit in the west, a box round the camp and the first crossing
  HOLD_N = -3.5 - 16,
  HOLD_S = -3.5 + 16,
  // on the road (which ends at the clearing), in the demons' camp, or in or beside either river or the ridge the first one falls from
  onRoad = (x, z, pad) => ((x < -33 || x > 24) && Math.abs(z - roadZ(x)) < pad) || southWay(x, z, pad),
  // The hermitage is laid out evenly about the line that runs north through the altar. The road comes in from the river on the
  // west, sweeps round the far side of the altar in a half ring (its middle is YARD, a little north of the fire), and comes back
  // down on the east, where it rounds the end of the cliff and goes on south into the low country.
  // Three round houses stand outside the half ring, facing its middle: the hall at the top, the largest, and a smaller one
  // either side of it, the sage's on the left and the pupils' on the right. Each place is [x, z, the way it faces]
  YARD = [0, -6],
  RING = 20,
  SAGE_HOUSE = [-26.8, -21.5, 1.047],
  HALL = [0, -38.5, 0],
  LONG = [26.8, -21.5, -1.047],
  // matching each other either side as well: the wood store beyond the sage's house and the lotus pond beyond the pupils';
  // the water jars and the cow's shelter out of the way behind the hall
  WOODSHED = [-38, -9, 1.35],
  POND = [38, -10, 0],
  JARS = [-9, -48, 0],
  SHED = [9.5, -49, 0],
  // every point of the road as drawn, filled in below: for keeping things off it
  ROADLINE = [],
  ROADS = [],
  nearRoad = (x, z, pad) => ROADLINE.some((p) => Math.abs(p.x - x) < pad && Math.abs(p.z - z) < pad && Math.hypot(p.x - x, p.z - z) < pad),
  // the hermitage's ground: nothing wild grows here. It is everything within the half ring and a good way outside it, on its near side as far as a little beyond the altar
  inHut = (x, z, pad) => Math.hypot(x - YARD[0], z - YARD[1]) < 48 + pad && z < 16 + pad,
  // the two camps where prisoners are kept at work, each outside the fork: one beyond the east crossing, one beyond the south
  WORK = [
    [30, -72],
    [-26, 51],
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
  let calm = Math.min(d - RW - 4.6, Math.abs(z - roadZ(x)) - 6, southWay(x, z, 8) ? -1 : 1e9, Math.hypot(x - YARD[0], z - YARD[1]) - 50, x < WX ? -1 : 1e9);
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
for (let i = 0; i < 420; i++) {
  const x = R(X0 - 22, EX + 38),
    z = R(ZN - 30, ZS + 4),
    c = Math.hypot(x, z),
    grove = Math.sin(x * 0.045 + 1.3) * Math.cos(z * 0.06 - 0.7) + 0.35 * Math.sin(x * 0.11 + z * 0.09);
  if (grove < 0.1 || nearRiver(x, z, 1.5) || onRoad(x, z, 5) || inCamp(x, z, 12) || inHut(x, z, 3)) continue;
  if (c < 52 && (z < 9 || c < 14)) continue;
  const small = c < 52 || (x < 2 && z > roadZ(x) && z < roadZ(x) + 16);
  // which kind grows here. Palms like the riverbanks; elsewhere round and spreading trees are commonest, tall ones fewer
  const k = Math.random(),
    wet = nearRiver(x, z, 9),
    kind = wet ? (k < 0.5 ? 3 : k < 0.75 ? 0 : 2) : k < 0.42 ? 0 : k < 0.68 ? 2 : k < 0.9 ? 1 : 3;
  tree(x, z, small ? R(0.5, 0.7) : R(0.6, 1.1), kind);
}
// bushes: few, and never scattered singly. One clump sits at the foot of about every third tree, as undergrowth,
// and some more stand in small groups a little back from the road
function bush(x, z, r) {
  if (nearRiver(x, z, 0.6) || onRoad(x, z, 3.4) || inCamp(x, z, 7) || inHut(x, z, 0)) return;
  for (let k = 0; k < 3; k++) {
    const q = r * R(0.6, 1);
    BUSH[(Math.random() * 3) | 0].push([x + R(-0.5, 0.5) * r, r * 0.45, z + R(-0.5, 0.5) * r, 0, R(0, 6), 0, q, q * 0.7, q]);
  }
}
WOODS.forEach((t, i) => {
  if (i % 3 === 0) bush(t.x + R(-1.2, 1.2), t.z + R(0.6, 1.6), R(0.45, 0.8));
});
for (let i = 0; i < 22; i++) {
  const x = R(X0, -14),
    z = roadZ(x) + (i % 2 ? 1 : -1) * R(4.5, 7.5);
  for (let k = 0; k < 3; k++) bush(x + R(-1.4, 1.4), z + R(-1, 1), R(0.4, 0.75));
}
// The roads: strips of bare trodden earth. The main one comes from the start over the first crossing, turns north and goes
// round the far side of the altar in a half ring past the three houses, comes back down, and runs on east over the second
// crossing to the camp beyond. The other comes up from the south beside the joined river, over the third crossing, to the altar
{
  const line = [];
  for (let x = START_X - 10; x < -34; x += 1.5) line.push(V3(x, 0, roadZ(x)));
  // from there on it is one smooth curve: it turns north to the foot of the half ring, goes round it, comes down the far side
  // the same way, and then heads east
  const through = [V3(-34, 0, roadZ(-34)), V3(-27, 0, 0.6), V3(-22.4, 0, -1.6)];
  for (let t = -1.45; t <= 1.46; t += 0.145) through.push(V3(YARD[0] + RING * Math.sin(t), 0, YARD[1] - RING * Math.cos(t)));
  for (const [x, z] of [
    [22.4, -1.6],
    [30, -0.4],
    [45, 0.5],
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
    line2 = curve2.getSpacedPoints(Math.ceil(curve2.getLength() / 0.6));
  ROADS.push(line, line2);
  ROADLINE.push(...line, ...line2);
  // a road's strip, from the line of points down its middle
  const strip = (line) => {
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
        e = Math.min(1, (LEN - s) / 1.5),
        end = Math.sqrt(1 - (1 - e) * (1 - e)),
        // (the strip is cut a little wider than the road looks, because the picture laid on it fades out toward both edges)
        w = (1.85 + 0.25 * Math.sin(s * 0.7)) * end,
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
  if (onRoad(x, z, 3.4) || inCamp(x, z, 8) || inHut(x, z, 0) || nearRoad(x, z, 3.2) || nearRiver(x, z, big ? 1 : -1.6)) continue;
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
      [WOODSHED, 2.6],
      [SHED, 3.6],
      [POND, 4.5],
    ],
    // may something grow here?
    open = (x, z) => {
      if (x < X0 || x > EX - 4 || z < ZN || z > ZS) return false;
      if (nearRiver(x, z, 0.4) || Math.hypot(x, z) < 5.2) return false;
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
    if (Math.random() < 0.7)
      patch(t.x, t.z, 4 + ((Math.random() * 4) | 0), 0.9 + t.s * 0.7, Math.random() < 0.35 ? 2 + ((Math.random() * 2) | 0) : 0);
  // along both verges of the road, in broken stretches;
  for (let i = 2; i < ROADLINE.length - 2; i++) {
    const p = ROADLINE[i],
      q = ROADLINE[i + 1],
      l = Math.hypot(q.x - p.x, q.z - p.z) || 1;
    for (const side of [-1, 1])
      if (Math.random() < l * 0.16) {
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
        if (Math.random() < 0.5) {
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
// ---------- the compound ----------
{
  // The altar is set square to Vishwamitra: the fire pit is turned so a flat side, not a corner, faces him (and the camera).
  // Its six pillars are rebuilt to match, the same either side of the line from him through the fire: two low ones at the front
  // so the fire is in plain view, two middling ones at the sides, and two tall ones at the back, framing him
  fire.rotation.y = Math.PI / 4;
  for (const m of [...scene.children]) if (m.material === STONE && Math.abs(Math.hypot(m.position.x, m.position.z) - 4.2) < 0.01) scene.remove(m);
  for (const o of [...SOLIDS]) if (o.r === 0.4 && Math.abs(Math.hypot(o.x, o.z) - 4.2) < 0.01) SOLIDS.splice(SOLIDS.indexOf(o), 1);
  const pillar = (h) => [
    [0.36, 0],
    [0.36, 0.14],
    [0.27, 0.2],
    [0.3, 0.3],
    [0.22, 0.38],
    [0.2, h - 0.5],
    [0.25, h - 0.44],
    [0.22, h - 0.36],
    [0.33, h - 0.2],
    [0.36, h - 0.06],
    [0.3, h],
    [0.001, h],
  ];
  for (const [a, h] of [
    [0.52, 1.5],
    [Math.PI / 2, 2.5],
    [Math.PI - 0.52, 3.4],
  ])
    for (const sx of [-1, 1]) {
      const x = sx * Math.sin(a) * 4.2,
        z = Math.cos(a) * 4.2;
      lathe(scene, pillar(h), STONE, [x, 0, z]);
      SOLIDS.push({ x, z, r: 0.4 });
    }
}
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

// ---------- behind the houses ----------
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
function prisoner(x, z, i, job, ends) {
  const g = new THREE.Group(),
    rig = makeRig(),
    tone = [0xb8733a, 0xa5683a, 0xc08a58][i % 3],
    skin = toon(tone, { vertexColors: true, rim: 0.3 }),
    sk = toon(tone, { rim: 0.3 }),
    cloth = toon([0xd9c9a3, 0xc9a25a, 0xe2ddd0][i % 3], { vertexColors: true }),
    hair = toon(i % 3 === 1 ? 0xb9b4ac : 0x1a1418, { rim: 0.2 });
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
  add(head, new THREE.SphereGeometry(0.128, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.56), hair, [0, 0.012, -0.012], [-0.42, 0, 0], [1, 1.08, 1.04]);
  if (i % 3 !== 2) sph(head, 0.04, hair, [0, 0.15, -0.06], [1, 0.9, 1]);
  if (i % 3 === 1) sph(head, 0.07, hair, [0, -0.125, 0.05], [1.05, 0.95, 0.8]);
  // bound: the stake he is tied to, and three turns of rope round his chest and the stake together.
  // (the stake stands in the ground, not on him, so it stays behind when he walks off)
  // At work: the thing he works with, which he drops when he is freed: a hoe in his hand, or a sack across his shoulders
  let ropes = [];
  if (!job) {
    cyl(scene, 0.055, 0.07, 1.5, WOOD, [x, 0.75, z - 0.27]);
    ropes = [0.36, 0.43, 0.5].map((y) => tor(g, 0.23, 0.016, ROPE, [0, y, -0.1], [Math.PI / 2, 0, 0], [1, 1.2, 1]));
    SOLIDS.push({ x, z, r: 0.34 });
  } else if (job === 'dig') {
    const hoe = new THREE.Group();
    cyl(hoe, 0.018, 0.02, 1.3, WOOD, [0, 0, 0.45], [Math.PI / 2, 0, 0]);
    add(hoe, new THREE.BoxGeometry(0.2, 0.26, 0.03), toon(0x55585e, { rim: 0.3 }), [0, -0.12, 1.08], [0.5, 0, 0]);
    rig.bone.handR.add(hoe);
    ropes = [hoe];
  } else {
    const sack = rig.on('chest', sph(new THREE.Group(), 0.3, toon(0xb39a6a, { rim: 0.1 }), [0, 0, 0], [1.15, 0.8, 0.8]).parent, [0, 1.56, -0.16]);
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
      path: job ? [] : [[x + 2.5, roadZ(x + 2.5) + (i - 1) * 0.7], [-38, roadZ(-38) + (i - 1) * 0.7], [-28, 0.6 + (i - 1) * 0.7], VSEATS[i]],
    };
  pose(p);
  PRISONERS.push(p);
  return p;
}
// ---------- the camps ----------
// There are three. The first is the one by the road, where the prisoners sit bound. In the other two, each outside the fork
// of the rivers and beyond a crossing, the demons have their prisoners at work, hoeing or hauling sacks, under a ragged red banner by a fire.
// Every camp works the same way: its demons stand idle until a brother comes near or one of them is hurt, then all go for whichever
// brother is closest; once they are dead its prisoners can be freed, and those bow and walk to the hermitage to sit before the houses.
SPAWN_MAX = 40;
const CAMPS = [],
  apart = (a, b) => Math.hypot(a.x - b.x, a.z - b.z),
  // places to sit: a row just inside the half ring of road, facing the fire, taken in turn as men are freed
  VSEATS = Array.from({ length: 15 }, (_, i) => {
    const t = -0.98 + i * 0.14;
    return [YARD[0] + (RING - 3.6) * Math.sin(t), YARD[1] - (RING - 3.6) * Math.cos(t)];
  });
// (the first three are taken by the men from the camp by the road)
let seatsTaken = 3;
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
// a working camp: a banner on a pole, a fire in a ring of stones, a strip of turned earth where the hoers work and two heaps of
// sacks that the carriers trudge between. jobs is what each prisoner does
function workCamp(x, z, guards, jobs) {
  const red = toon(0x7a1616, { rim: 0.1 }),
    sackM = toon(0xb39a6a, { rim: 0.1 }),
    A = [x - 5, z + 4.5],
    B = [x + 4.5, z + 5.5],
    // (everything in the camp stands on its level pad, at the height the land has there)
    G = new THREE.Group();
  G.position.y = groundY(x, z);
  scene.add(G);
  cyl(G, 0.06, 0.08, 3.6, WOOD, [x - 2.2, 1.8, z - 3]);
  add(G, new THREE.BoxGeometry(1.0, 1.5, 0.03), red, [x - 1.66, 2.75, z - 3]);
  add(G, new THREE.BoxGeometry(1.02, 0.16, 0.035), DARK, [x - 1.66, 2.45, z - 3]);
  SOLIDS.push({ x: x - 2.2, z: z - 3, r: 0.2 });
  for (let i = 0; i < 7; i++)
    add(G, new THREE.DodecahedronGeometry(0.16, 0), ROCKM[i % 2], [x + Math.cos(i * 0.9) * 0.55, 0.08, z + Math.sin(i * 0.9) * 0.55], [i, i * 2, 0]);
  add(G, new THREE.ConeGeometry(0.22, 0.6, 7), new THREE.MeshBasicMaterial({ color: 0xff8a2a }), [x, 0.36, z]).castShadow = false;
  const fl = glow(0xffb040, 1.1);
  fl.position.set(x, 0.5, z);
  G.add(fl);
  SOLIDS.push({ x, z, r: 0.7 });
  add(G, new THREE.BoxGeometry(6.5, 0.06, 2.6), toon(0x4a3626, { rim: 0 }), [x + 0.5, 0.03, z - 5.6]).castShadow = false;
  for (const [hx, hz] of [A, B])
    for (let i = 0; i < 4; i++)
      sph(G, 0.34, sackM, [hx + (i % 2) * 0.55 - 0.3, i > 1 ? 0.62 : 0.26, hz - 1 + (i > 1 ? 0.15 : (i % 2) * 0.2)], [1.2, 0.75, 0.85]);
  let dig = 0,
    haul = 0;
  const men = jobs.map((job, i) =>
    job === 'dig'
      ? prisoner(x - 1.6 + dig++ * 2.1, z - 5.2 + (i % 2) * 0.5, CAMPS.length + i, 'dig')
      : prisoner(A[0] + 1 + haul * 2.4, A[1] + 0.4 * haul++, CAMPS.length + i, 'carry', haul % 2 ? [A, B] : [B, A]),
  );
  // the hoers face the earth they are working
  men.forEach((m) => m.job === 'dig' && (m.g.rotation.y = Math.PI));
  return camp(x, z, guards, men, V3(x, 0, z - 4));
}
// up north, beyond the hall and the cow's shelter, off any road
workCamp(
  ...WORK[0],
  [
    ['brute', -4, 0.5],
    ['grunt', 3.5, 2],
    ['grunt', 2, -2.5],
    ['pish', -1.5, 3.2],
  ],
  ['dig', 'carry', 'dig'],
).via = [
  [48, -50],
  [50, -10],
  [31, -0.5],
];
// beyond the south crossing, down the far bank of the west arm: the furthest, and the most strongly held
workCamp(
  ...WORK[1],
  [
    ['brute', 4, 1],
    ['grunt', -3.5, -1],
    ['grunt', 0.5, 3.4],
    ['pish', -2, 3],
    ['pish', 2.6, -2.6],
  ],
  ['carry', 'dig', 'carry'],
).via = [
  [-9, 47.5],
  [0.4, 41.9],
  [0.2, 31],
];
function campUpdate(dt) {
  const me = SEL.group.position;
  for (const c of CAMPS) {
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
          { who: 'Elder', face: f[1], text: 'They dragged us from the hermitage at dawn, to spill our blood on the sage’s altar. Bless you both.' },
          { who: 'Rama', face: photo(RAMA), text: 'Go to Vishwamitra. You will be safe by his fire.' },
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
        saviour = c.first ? null : c.prisoners.map((p) => near(p, 7)).find(Boolean);
      for (const p of c.prisoners) {
        const h = p.free ? null : c.first ? near(p, 2.6) : saviour;
        if (!h) continue;
        p.free = true;
        p.by = h;
        // the ropes fall away, or he lets drop what he was made to carry
        p.ropes.forEach((o) => o.parent.remove(o));
        puff(tmpA.set(p.g.position.x, 0.5, p.g.position.z), 0xe8d8a8, 16, 2, 0.5, 2);
      }
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
        pose(p);
        continue;
      }
      p.g.visible = true;
      // freed: first he gets to his feet (or straightens from his work); only when all of that camp are standing do they bow together.
      // They hold the bow a moment (at the first camp, while they give their thanks), then lower their hands and walk to
      // Vishwamitra's hermitage, where they sit down facing the fire
      p.up = Math.min(1, p.up + dt / 0.45);
      p.jobW = Math.max(0, p.jobW - dt / 0.4);
      let want;
      if (!p.go) {
        p.wk = Math.max(0, p.wk - dt * 4);
        if (allUp) p.nam = Math.min(1, p.nam + dt / 0.7);
        if (p.nam >= 1 && !talking() && (p.hold += dt) > (c.first ? 0.8 : 1.6) + p.wait) {
          p.go = true;
          if (!p.path.length) {
            // (out by the camp's own way to its crossing and in, then on to his seat)
            const via = c.via || [],
              from = via.length ? { x: via[via.length - 1][0], z: via[via.length - 1][1] } : P;
            p.path = [...via, ...route(from, VSEATS[Math.min(VSEATS.length - 1, seatsTaken++)])];
          }
        }
        // on his feet he turns to whoever freed him
        const q = p.by.group.position;
        want = Math.atan2(q.x - P.x, q.z - P.z);
      } else {
        p.nam = Math.max(0, p.nam - dt / 0.4);
        const w = p.path[0],
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
          const v = p.pace * p.wk * (last ? Math.min(1, 0.35 + l / 2.5) : 1) * dt,
            a = p.g.rotation.y;
          P.x += Math.sin(a) * v;
          P.z += Math.cos(a) * v;
          p.ph += v / 0.45;
        }
        want = Math.atan2(dx, dz);
        if (!w && p.wk < 0.05) p.sit = Math.min(1, p.sit + dt / 0.9);
      }
      pose(p);
      p.g.rotation.y +=
        Math.atan2(Math.sin(want - p.g.rotation.y), Math.cos(want - p.g.rotation.y)) *
        Math.min(1, dt * (p.go ? (p.path.length === 1 ? 5 : 2.2) : 3)) *
        p.up;
    }
  }
}

// ---------- the men's orders ----------
// After Vishwamitra's talk, the men freed from the first camp are sitting by the fire. Walk up to them and Rama sets them to
// gathering wood for the night; they get up and go to the wood store. Before they go they tell him of the two other camps, north
// and south, and that there is time to reach only one before dark. The player chooses by going: the first camp a brother comes
// near becomes the objective
const ORDER = { done: false, pick: null };
function orderUpdate() {
  // the choice is made by going: whichever of the two camps a brother comes near first is the one he has chosen
  if (ORDER.done && !ORDER.pick) {
    const near = (c) => HEROES.some((h) => apart(h.group.position, c) < 30);
    if (near(CAMPS[1])) ORDER.pick = 'north';
    else if (near(CAMPS[2])) ORDER.pick = 'south';
  }
  if (ORDER.asked || !ARR.talked || LOCK || talking()) return;
  const men = CAMPS[0].prisoners,
    P = SEL.group.position;
  if (!men.some((p) => p.sit >= 1 && apart(P, p.g.position) < 5)) return;
  ORDER.asked = true;
  LOCK = true;
  const f = men.map((p) => snap(p.rig.bone.head, p.g.rotation.y, null)),
    elder = f[1] || f[0];
  say(
    [
      { who: 'Rama', face: photo(RAMA), text: 'Rest is over, friends. The fire must burn through the night. Gather all the wood you can.' },
      { who: 'Elder', face: elder, text: 'Gladly, prince. But hear this first: they hold two more camps, with our people in both.' },
      { who: 'Villager', face: f[0], text: 'One north, past the hall. One south, over the river. They move them at dusk.' },
      { who: 'Elder', face: elder, text: 'You will not reach both before dark. Choose well, prince.' },
    ],
    () => {
      LOCK = false;
      ORDER.done = true;
      // off they go to the wood store, each to his own place beside it
      men.forEach((p, i) => {
        p.path = route(p.g.position, [WOODSHED[0] + 2.2 - i * 1.4, WOODSHED[1] + 2.6 + i * 0.6]);
        p.wait = 0;
      });
    },
  );
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
//   sageGreets     he stops before them and begins
//   sageTalks      he tells them why they are here
//   sageReturns    he goes back to his seat by the fire and sits
//   sageOffers     seated, eyes shut, he makes an offering to the fire: it flares, and the astra passes from it to Rama
//   ramaReceives   Rama sits still while he receives it
//   brothersRise   the brothers get up, and the level is the player's again
//   done           (after it) nothing more happens
// the brothers sit off the road, to the near left of the fire. Vishwamitra goes round the fire to them by way of SAGE_VIA, not through it
const SEATS = { rama: V3(-4.3, 0, 4.5), lak: V3(-5.3, 0, 3.5) },
  SAGE_HOME = V3(0, 0, -2),
  SAGE_VIA = V3(-2.4, 0, -0.3),
  SAGE_MEET = V3(-2.7, 0, 2.9),
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
    // three more seconds of stillness after the Om. His eyes open near the end of it, and then he gets up
    if (A.t > 2.3) sageEyes(false);
    if (A.t > 3) {
      SG.at = V.group.position.clone();
      to('sageComes');
    }
  } else if (A.step === 'sageComes') {
    if (!A.via) A.via = sageWalk(SAGE_VIA, dt, true);
    else if (sageWalk(SAGE_MEET, dt)) {
      SG.move = 'idle';
      // he turns to face them, unhurriedly (see the top of this function)
      A.face = Math.atan2(-4.8 - SAGE_MEET.x, 4 - SAGE_MEET.z);
      to('sageGreets');
    }
  } else if (A.step === 'sageGreets') {
    if (A.t > 0.6) {
      A.bow = false;
      const f = snap(V.bone.head, V.group.rotation.y, null);
      say(
        [
          { who: 'Vishwamitra', face: f, text: 'Rama. Lakshmana. You have come, and not a day too soon.' },
          {
            who: 'Vishwamitra',
            face: f,
            text: 'For six nights this fire must burn without a break. Once the rite begins I may not rise, nor lift a hand in anger.',
          },
          { who: 'Vishwamitra', face: f, text: 'The rakshasas know it. Maricha and Subahu send their kind to foul the altar with blood and filth.' },
          { who: 'Vishwamitra', face: f, text: 'You met some on the road. More will come with the dark, and from every side.' },
          { who: 'Rama', face: photo(RAMA), text: 'Then tend your fire, Gurudev. Nothing will reach it while we stand.' },
          { who: 'Vishwamitra', face: f, text: 'Guard the fire. That is all I ask of you.' },
          { who: 'Vishwamitra', face: f, text: 'And take this, Rama. The Agneyastra: Agni himself, bound to an arrow.' },
          { who: 'Vishwamitra', face: f, text: 'Call on it when the bow alone will not do. It asks for your strength each time.' },
        ],
        () => {
          A.via = false;
          A.face = null;
          // the talk is over: the camera goes straight back to the brother being played, and does not follow the sage home.
          // The brothers stay as they are, seated and still, until he has given the astra from his own seat (see 'sageOffers')
          CAM = null;
          to('sageReturns');
        },
      );
      to('sageTalks');
    }
  } else if (A.step === 'sageReturns') {
    if (!A.via) A.via = sageWalk(SAGE_VIA, dt, true);
    else if (sageWalk(SAGE_HOME, dt)) {
      // he sits; over the next moment he is eased the last hand's breadth onto his own spot (see 'sageOffers')
      SG.yaw = null;
      SG.pathA = Math.PI;
      SG.move = 'sit';
      to('sageOffers');
    }
  } else if (A.step === 'sageOffers') {
    if (SG.at) SG.at.lerp(SAGE_HOME, Math.min(1, dt * 6));
    if (A.t > 0.6) SG.at = null;
    // Seated again, he shuts his eyes. The astra is given at the moment his hand next goes out to the fire with an offering
    // (he makes one every 3.4 seconds while he sits: see the sage's own file), so the fire flares under his hand and the
    // flames that cross to Rama are plainly his doing
    if (A.t > 0.8) sageEyes(true);
    const cyc = (T % 3.4) / 3.4;
    if (A.t > 1.2 && SG.wSit > 0.95 && cyc > 0.27 && cyc < 0.36) {
      giveAstra(1);
      to('ramaReceives');
    }
  } else if (A.step === 'ramaReceives') {
    // Rama sits through it without moving. When the last of it has gone into him the sage opens his eyes, and the brothers rise
    if (!(ASTRA.fx > 0) && A.t > 0.5) {
      sageEyes(false);
      A.talked = true;
      HEROES.forEach((h) => (h.sat = false));
      to('brothersRise');
    }
  } else if (A.step === 'brothersRise') {
    if (A.t > 0.7) {
      LOCK = false;
      to('done');
    }
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
const MINI = { W: 200, shown: false, n: 0 };
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
    cv = document.createElement('canvas'),
    bg = document.createElement('canvas');
  box.style.cssText =
    'position:fixed;right:16px;bottom:16px;padding:3px;background:#170d22;border:2px solid #e9c07a;border-radius:6px;' +
    'box-shadow:0 0 0 1px #170d22,0 0 0 4px rgba(233,192,122,.25),0 10px 30px rgba(0,0,0,.5);opacity:0;transition:opacity .8s;pointer-events:none;z-index:15;line-height:0';
  for (const c of [cv, bg]) {
    c.width = W * 2;
    c.height = H * 2;
  }
  // (the page's own rule for canvases pins them to the top left corner at full size; this one must not take it)
  cv.style.cssText = `position:static;inset:auto;width:${W}px;height:${H}px;border-radius:3px;display:block`;
  box.append(cv);
  document.body.append(box);
  // what never changes
  const g = bg.getContext('2d');
  g.scale(2, 2);
  g.fillStyle = '#74904f';
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(58,104,52,.75)';
  for (const t of WOODS) {
    g.beginPath();
    g.arc(mx(t.x), my(t.z), 1.1 + t.s * 0.9, 0, 7);
    g.fill();
  }
  const stroke = (pts, col, w) => {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.lineJoin = g.lineCap = 'round';
    g.beginPath();
    pts.forEach(([x, z], i) => (i ? g.lineTo(mx(x), my(z)) : g.moveTo(mx(x), my(z))));
    g.stroke();
  };
  for (const line of RIV)
    stroke(
      line.filter((_, i) => i % 4 === 0).map((p) => [p.x, p.z]),
      '#4a9fd0',
      5.4,
    );
  // (the roads go on over the rivers: those are the crossings)
  for (const line of ROADS)
    stroke(
      line.filter((_, i) => i % 3 === 0).map((p) => [p.x, p.z]),
      '#c9ad7a',
      2.4,
    );
  g.fillStyle = '#4a9fd0';
  g.beginPath();
  g.arc(mx(POND[0]), my(POND[1]), 3.8 * k, 0, 7);
  g.fill();
  for (const [q, r] of [
    [SAGE_HOUSE, 4.4],
    [HALL, 5.4],
    [LONG, 4.4],
  ]) {
    g.fillStyle = '#b9ad90';
    g.strokeStyle = '#5a4a36';
    g.lineWidth = 1;
    g.beginPath();
    g.arc(mx(q[0]), my(q[1]), (r + 1.6) * k, 0, 7);
    g.fill();
    g.stroke();
  }
  // the altar: a small flame-coloured diamond with a pale edge
  g.save();
  g.translate(mx(0), my(0));
  g.rotate(Math.PI / 4);
  g.fillStyle = '#ff9a30';
  g.strokeStyle = '#fff3df';
  g.lineWidth = 1.2;
  g.fillRect(-4, -4, 8, 8);
  g.strokeRect(-4, -4, 8, 8);
  g.restore();
  const d = cv.getContext('2d');
  d.scale(2, 2);
  const dot = (x, z, r, fill, edge) => {
    d.beginPath();
    d.arc(mx(x), my(z), r, 0, 7);
    d.fillStyle = fill;
    d.fill();
    if (edge) {
      d.lineWidth = 1.3;
      d.strokeStyle = edge;
      d.stroke();
    }
  };
  MINI.draw = () => {
    if (!MINI.shown) {
      // (for now it shows from the start; it used to wait for the sage's talk to end: ARR.step === 'done')
      MINI.shown = true;
      box.style.opacity = 1;
    }
    d.drawImage(bg, 0, 0, W, H);
    for (const c of CAMPS) {
      const live = c.guards.filter((e) => grunts.includes(e) && !e.dead);
      for (const p of c.prisoners) dot(p.g.position.x, p.g.position.z, 1.6, p.free ? '#fff8e6' : 'rgba(255,248,230,.45)');
      if (live.length) {
        // a pennant on a short staff
        const x = mx(c.x),
          y = my(c.z);
        d.fillStyle = '#2a1414';
        d.fillRect(x - 0.6, y - 8, 1.2, 9);
        d.fillStyle = '#e03a2a';
        d.beginPath();
        d.moveTo(x + 0.6, y - 8);
        d.lineTo(x + 7, y - 5.5);
        d.lineTo(x + 0.6, y - 3);
        d.fill();
      }
      for (const e of live) if (!e.asleep && c.roused) dot(e.g.position.x, e.g.position.z, e.br ? 2.6 : 1.9, '#ff4a36', '#3a0c08');
    }
    // what is on screen: where the corners of the view meet the ground. The map outside it is shaded a little darker, so the
    // part in view stands out as a lighter green, with no line drawn round it
    d.beginPath();
    d.rect(0, 0, W, H);
    [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].forEach(([sx, sy], i) => {
      const v = VIEW.set(sx, sy, 0.5).unproject(cam).sub(cam.position),
        t = v.y < -1e-4 ? Math.min(-cam.position.y / v.y, 400) : 400,
        x = mx(cam.position.x + v.x * t),
        y = my(cam.position.z + v.z * t);
      i ? d.lineTo(x, y) : d.moveTo(x, y);
    });
    d.closePath();
    d.fillStyle = 'rgba(20,30,12,.2)';
    d.fill('evenodd');
    // each brother as a small arrow pointing the way he faces; the one you are playing larger and ringed
    for (const h of HEROES) {
      const P = h.group.position,
        f = h === SEL ? facing : h.s ? h.s.facing : 0,
        fx = Math.sin(f),
        fy = Math.cos(f),
        k = h === SEL ? 1.25 : 1,
        x = mx(P.x),
        y = my(P.z);
      if (h === SEL) dot(P.x, P.z, 6.4, 'rgba(255,255,255,.28)');
      d.beginPath();
      d.moveTo(x + fx * 6 * k, y + fy * 6 * k);
      d.lineTo(x - fx * 3.5 * k + fy * 4 * k, y - fy * 3.5 * k - fx * 4 * k);
      d.lineTo(x - fx * 1.5 * k, y - fy * 1.5 * k);
      d.lineTo(x - fx * 3.5 * k - fy * 4 * k, y - fy * 3.5 * k + fx * 4 * k);
      d.closePath();
      d.fillStyle = h.name === 'rama' ? '#4a8cf0' : '#e8a53c';
      d.fill();
      d.lineWidth = 1.2;
      d.strokeStyle = '#ffffff';
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
  campUpdate(dt);
  arriveUpdate(dt);
  orderUpdate();
  astraFx(dt);
  if (++MINI.n % 5 === 0) MINI.draw();
  talkUpdate(dt);
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
// the camera stays on the near side, looking north: it turns no more than about 35 degrees either way, tilts only between a
// low and a high view, and zooms only so far in and out
CAMLIM.yaw = [-0.6, 0.6];
CAMLIM.pitch = [0.5, 1.2];
CAMLIM.dist = [12, 30];

// ---------- health and mana ----------
// the camp's demons can hurt the brothers, but nothing yet happens at zero. Rama's astras draw on his mana, which comes back slowly
RAMA.hp = RAMA.hpMax = 640;
LAK.hp = LAK.hpMax = 560;
RAMA.mp = RAMA.mpMax = 100;
// Lakshmana has stamina instead: every quick shot spends some, and with none left he reloads only as fast as Rama until it comes back
LAK.st = LAK.stMax = 100;
const COST = { 'Agneyastra · fire': 33, 'Vayavyastra · wind': 10, Manavastra: 20, 'Nagastra · serpent': 25, Brahmastra: 60 };
for (const k of KINDS) k.cost = COST[k.name] || 0;

// ---------- objectives ----------
// what to do next, in the top right corner below the menu button: each line is ticked and dimmed once it is done
const OBJ = [
  { text: 'Reach Vishwamitra’s camp', done: () => ARR.step !== 'wait' },
  // (ticked once they have thanked the brothers, not the moment the last rope falls)
  { text: 'Rescue the villagers', done: () => !!CAMPS[0].rescued, show: () => CAMPS[0].seen },
  { text: 'Order the men to gather wood', done: () => ORDER.done, show: () => !!ARR.talked },
  { text: 'Free the north or the south camp', done: () => false, show: () => ORDER.done && !ORDER.pick },
  { text: 'Free the north camp', done: () => CAMPS[1].prisoners.every((p) => p.free), show: () => ORDER.pick === 'north' },
  { text: 'Free the south camp', done: () => CAMPS[2].prisoners.every((p) => p.free), show: () => ORDER.pick === 'south' },
];
{
  const box = document.createElement('div');
  box.style.cssText =
    'position:fixed;right:16px;top:66px;z-index:14;min-width:210px;padding:10px 14px 11px;background:rgba(24,12,28,.55);' +
    'border:1px solid rgba(255,210,150,.3);border-radius:6px;backdrop-filter:blur(5px);font:14px Marcellus,serif;color:#fff3df;user-select:none';
  box.innerHTML =
    '<div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#ffd08a;margin-bottom:4px">Objectives</div>' +
    OBJ.map(
      (o) =>
        `<div style="display:flex;gap:8px;align-items:center;margin-top:4px"><i style="flex:none;width:11px;height:11px;border:1.5px solid #ffd08a;border-radius:2px;display:grid;place-items:center;font:700 10px/1 sans-serif;font-style:normal;color:#2a1220"></i><span>${o.text}</span></div>`,
    ).join('');
  document.body.append(box);
  // a button beside the menu button, with a scroll for an icon, shows and hides the list
  const btn = document.createElement('button');
  btn.setAttribute('aria-label', 'Objectives');
  btn.style.cssText =
    'position:fixed;right:64px;top:16px;z-index:30;width:40px;height:40px;padding:0;display:grid;place-items:center;background:rgba(24,12,28,.6);' +
    'border:1px solid rgba(255,210,150,.45);border-radius:6px;backdrop-filter:blur(5px)';
  btn.innerHTML =
    '<svg viewBox="0 0 16 16" width="19" height="19" fill="none" stroke="#ffd08a" stroke-width="1.3" stroke-linejoin="round"><rect x="1.8" y="1.6" width="12.4" height="3" rx="1.5"/><rect x="1.8" y="11.4" width="12.4" height="3" rx="1.5"/><path d="M3.4 4.6v6.8M12.6 4.6v6.8M5.8 7h4.4M5.8 9.2h4.4" stroke-linecap="round"/></svg>';
  btn.onclick = () => {
    OBJ.open = !OBJ.open;
    box.style.display = OBJ.open ? '' : 'none';
  };
  document.body.append(btn);
  OBJ.open = true;
  OBJ.forEach((o, i) => {
    o.row = box.children[i + 1];
    o.tick = o.row.querySelector('i');
  });
}
function objectives() {
  for (const o of OBJ) {
    // (a line not yet given, such as the rescue before the camp has been seen, stays hidden)
    o.row.style.display = !o.show || o.show() ? 'flex' : 'none';
    const d = o.done();
    if (d === o.was) continue;
    o.was = d;
    o.row.style.opacity = d ? 0.55 : 1;
    o.row.querySelector('span').style.textDecoration = d ? 'line-through' : 'none';
    o.tick.style.background = d ? '#ffd08a' : 'none';
    o.tick.textContent = d ? '✓' : '';
  }
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
  em.style.cssText = 'display:flex;align-items:center;gap:5px;font:12px Marcellus,serif;font-style:normal;color:#f3dcb4;letter-spacing:.04em';
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
  renderer.setRenderTarget(rt);
  renderer.render(scene, pc);
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
//   the cost   an astra is dear: each one takes a third of his strength (mana), so a full measure is three. The lights under
//              its slot show how many he can loose right now. With too little for even one, the slot is dark and will not
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
  bar.style.cssText = 'position:fixed;left:16px;top:16px;z-index:14;display:flex;gap:8px;align-items:flex-start;transition:opacity .3s';
  document.body.append(bar);
  ASTRA.bar = bar;
}
// Rama's kind of arrow: the global while he is the one being played, otherwise kept in his saved state
function setRamaKind(k) {
  if (SEL === RAMA) kind = k;
  else RAMA.s.kind = k;
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
    'position:relative;flex:none;width:44px;height:44px;display:grid;place-items:center;font-style:normal;border-radius:6px;cursor:pointer;' +
    'background:rgba(24,12,28,.7);border:1.5px solid rgba(255,210,150,.35);backdrop-filter:blur(5px);transition:box-shadow .15s,border-color .15s,background .15s';
  b.innerHTML =
    `<span style="width:28px;height:28px;display:block;transition:opacity .15s">${ASTRA_ICON[k]}</span>` +
    `<b style="position:absolute;left:4px;top:2px;font:600 10px/1 sans-serif;color:#fff3df;opacity:.8">${n}</b>` +
    // one light for each he could loose on a full measure, lit for each he can loose now
    `<u style="position:absolute;left:0;right:0;bottom:-9px;display:flex;justify-content:center;gap:3px;text-decoration:none">${'<s style="width:8px;height:4px;border-radius:2px;background:#3a2a44;transition:background .2s"></s>'.repeat(max)}</u>`;
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
  ASTRA.bar.style.opacity = SEL === RAMA ? 1 : 0.4;
  for (const b of ASTRA.slots) {
    const on = b.k === ASTRA.armed,
      col = astraCol(b.k),
      cost = KINDS[b.k].cost,
      can = cost ? Math.floor(RAMA.mp / cost) : 1;
    b.style.borderColor = on ? col : 'rgba(255,210,150,.35)';
    b.style.boxShadow = on ? `0 0 0 1px ${col}, 0 0 14px ${col}` : 'none';
    b.style.background = on ? `linear-gradient(${col}55, rgba(24,12,28,.8))` : 'rgba(24,12,28,.7)';
    b.icon.style.opacity = can ? (on ? 1 : 0.8) : 0.3;
    b.pips.forEach((s, i) => (s.style.background = i < can ? col : '#3a2a44'));
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
//   first   four tongues of flame leave the altar fire one after another and arc across to his chest, each leaving a trail
//   then    a ring of light on the ground closes in on him from five paces out, and a soft column of light stands over him
//   last    a small burst at his chest, and a line of words at the top of the screen says what he has received and its key
const GIFT = { T: 2.6 };
{
  const m = (o) => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, ...o });
  GIFT.beam = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 10, 24, 1, true), m());
  GIFT.ring = new THREE.Mesh(new THREE.RingGeometry(0.88, 1, 64), m());
  GIFT.ring.rotation.x = -Math.PI / 2;
  GIFT.all = [GIFT.beam, GIFT.ring];
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
    // (the altar fire flares as the flames leave it)
    flash(tmpA.set(0, 1.4, 0), col, 14);
    puff(tmpA, col, 30, 2.5, 0.6, -2, 0.6);
  }
  // the tongues of flame: each takes 0.9 s to cross from the fire to his chest, rising in an arc on the way
  for (let j = 0; j < 4; j++) {
    const u = (t - j * 0.22) / 0.9;
    if (u < 0 || u > 1) continue;
    const e = u * u * (3 - 2 * u),
      side = (j % 2 ? 1 : -1) * Math.sin(Math.PI * u) * 0.9,
      dx = P.x,
      dz = P.z,
      l = Math.hypot(dx, dz) || 1;
    tmpA.set(dx * e - (dz / l) * side, 1.4 + (P.y + ch - 1.4) * e + Math.sin(Math.PI * u) * 2.2, dz * e + (dx / l) * side);
    puff(tmpA, col, 5, 0.5, 0.55, -0.6, 0.25);
    puff(tmpA, 0xfff0c0, 1, 0.2, 0.3, 0, 0.1);
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
  if (ASTRA.fx <= 0) {
    GIFT.all.forEach((o) => (o.visible = false));
    puff(tmpA.set(P.x, P.y + ch, P.z), col, 30, 2.6, 0.7, 1, 0.3);
    astraSaid(ASTRA.fxK);
  }
}
// the words: a short line near the top of the screen, there for a few seconds
function astraSaid(k) {
  const n = ASTRA.slots.findIndex((b) => b.k === k) + 1,
    el = document.createElement('div');
  el.style.cssText =
    'position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:25;display:flex;align-items:center;gap:12px;padding:9px 18px 9px 12px;pointer-events:none;' +
    'background:rgba(24,12,28,.7);border:1px solid rgba(255,210,150,.5);border-radius:6px;backdrop-filter:blur(5px);color:#fff3df;font:17px Marcellus,serif;' +
    'opacity:0;transition:opacity .4s';
  el.innerHTML =
    `<span style="width:30px;height:30px;flex:none">${ASTRA_ICON[k]}</span>` +
    `<span>Rama has received the <b style="font-weight:400;color:#ffd08a">${ASTRA_NAME[k]}</b>` +
    `<br><small style="font-size:13px;opacity:.8">Press ${n} to take it up · 1 for plain arrows · Q swaps</small></span>`;
  document.body.append(el);
  requestAnimationFrame(() => (el.style.opacity = 1));
  setTimeout(() => (el.style.opacity = 0), 4500);
  setTimeout(() => el.remove(), 5000);
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
function frame(now) {
  requestAnimationFrame(frame);
  const dt = tick(now);
  // while anyone is speaking the enemies stand frozen, just as the brothers do
  HOLD_FOES = talking();
  heroUpdate(dt);
  shotsUpdate(dt);
  worldUpdate(dt);
  sceneryUpdate(dt);
  cameraUpdate(dt);
  if (!shot && T > 0.5) {
    shot = 1;
    HEROES.forEach(portrait);
  }
  composer.render();
  if (++fr % 6 === 0) {
    meters();
    objectives();
  }
  // the curtain lifts only once the scene has run for a moment
  if (!shown && T > 0.8) {
    shown = 1;
    $('load').style.opacity = 0;
    setTimeout(() => $('load').remove(), 700);
  }
}
ui();
pickKind(0);
requestAnimationFrame(frame);
window.L = { rama, grunts, summon, state: () => ({ move, firing, shots: shots.length, who, follow: FOLLOW }) };
