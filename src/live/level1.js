'use strict';
// Level 1: Siddhashrama, on a clear morning. Rama and Lakshmana start in the forest west of a river and walk right (east).
// Across the river the map proper begins: about a hundred and eighty metres of country, shut in on the far side by a second river.
// The altar where Vishwamitra sits is in the middle, his hut just beyond it. Half way along the road rakshasas hold prisoners.
// Still to come here: what happens on arrival, the waves, the altar's health, and winning and losing.

// ---------- the stage ----------
setDay();
shadowFollow = true;
BOUND = 1e5;
PLAYABLE = ['rama', 'lak'];
FOLLOW = true;
// WX and EX are the two rivers, ZN and ZS the far and near limits. The brothers start a little west of the first river.
// That river comes down from a waterfall on the far side and runs toward the camera in a channel below the ground;
// where the road meets it the land simply carries on across. The second river has no crossing at all.
const WX = -90,
  EX = 90,
  ZN = -60,
  ZS = 60,
  START_X = WX - 16,
  X0 = START_X - 14,
  R = (a, b) => a + Math.random() * (b - a),
  riverX = (z, c = WX) => c + 1.6 * Math.sin(z * 0.16 + (c > 0 ? 1.7 : 0)),
  roadZ = (x) => 0.5 * Math.sin(x * 0.21),
  RIVER_FROM = -18,
  CAMP = V3(-55, 0, 0),
  // on the road (which ends at the clearing), in the demons' camp, or in or beside either river or the ridge the first one falls from
  onRoad = (x, z, pad) => x < 2 && Math.abs(z - roadZ(x)) < pad,
  inCamp = (x, z, pad) => Math.abs(x - CAMP.x) < pad && Math.abs(z) < pad,
  nearRiver = (x, z, pad) =>
    (z > RIVER_FROM - 4 ? Math.abs(x - riverX(z)) < 2.6 + pad : Math.abs(x - WX) < 5 + pad) || Math.abs(x - riverX(z, EX)) < 2.6 + pad;
// the ground anyone may walk on is a rectangle here, not a circle round the fire
hem = (P) => {
  P.x = Math.max(X0, Math.min(EX - 3.5, P.x));
  P.z = Math.max(ZN, Math.min(ZS, P.z));
};
// the ground is spread wide enough for the whole map, and the hills are moved back behind its far edge
scene.children.find((m) => m.material === GROUND).scale.setScalar(2.6);
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
const BUSHM = [toon(0x3c7a34, { rim: 0.2 }), toon(0x4f8f3a, { rim: 0.2 }), toon(0x2f6a3a, { rim: 0.2 })],
  ROCKM = [toon(0x8a8f96, { rim: 0.12 }), toon(0x73777f, { rim: 0.12 })],
  crownG = new THREE.IcosahedronGeometry(1.7, 1),
  topG = new THREE.IcosahedronGeometry(1.1, 1),
  blobG = new THREE.IcosahedronGeometry(1, 1),
  rockG = new THREE.DodecahedronGeometry(1, 0),
  TRUNK = lot(new THREE.CylinderGeometry(0.18, 0.26, 3, 8), TREE_MATS.trunk),
  CROWN = [lot(crownG, TREE_MATS.leaf), lot(crownG, TREE_MATS.leaf2)],
  TOP = [lot(topG, TREE_MATS.leaf2), lot(topG, TREE_MATS.leaf)],
  BUSH = BUSHM.map((m) => lot(blobG, m)),
  ROCK = ROCKM.map((m) => lot(rockG, m)),
  WOODS = [];

// ---------- forest ----------
// The clearing's own ring of trees can be very large (up to thirteen units tall), and the camera always looks from the near side.
// So every one of them on the near side goes, along with any standing on the road or in the camp
for (const t of [...TREES])
  if (t.z > 4 || (t.x < 0 && t.z > -4.5) || inCamp(t.x, t.z, 10)) {
    t.parts.forEach((m) => scene.remove(m));
    SOLIDS.splice(SOLIDS.indexOf(t.solid), 1);
    TREES.splice(TREES.indexOf(t), 1);
  }
function tree(x, z, s) {
  const i = WOODS.length % 2;
  TRUNK.push([x, 1.5 * s - 0.3, z, 0, 0, 0, s, s, s]);
  CROWN[i].push([x, 3.8 * s, z, 0, x * 7.3, 0, s, 0.85 * s, s]);
  TOP[i].push([x + 0.5 * s, 5 * s, z - 0.3 * s, 0, 0, 0, s, s, s]);
  SOLIDS.push({ x, z, r: 0.3 * s });
  WOODS.push({ x, z, s });
}
// trees stand in groves with open ground between them, not evenly everywhere. None on the road, in the camp, or in the clearing;
// just on the camera's side of the road, and on the near side of the clearing, only small ones that do not hide the brothers
for (let i = 0; i < 520; i++) {
  const x = R(X0 - 22, EX + 38),
    z = R(ZN - 30, ZS + 4),
    c = Math.hypot(x, z),
    grove = Math.sin(x * 0.045 + 1.3) * Math.cos(z * 0.06 - 0.7) + 0.35 * Math.sin(x * 0.11 + z * 0.09);
  if (grove < 0.1 || nearRiver(x, z, 1.5) || onRoad(x, z, 5) || inCamp(x, z, 12)) continue;
  if (c < 52 && (z < 9 || c < 14)) continue;
  const small = c < 52 || (x < 2 && z > 0 && z < 16);
  tree(x, z, small ? R(0.5, 0.7) : R(0.6, 1.1));
}
// bushes: few, and never scattered singly. One clump sits at the foot of about every third tree, as undergrowth,
// and some more stand in small groups a little back from the road
function bush(x, z, r) {
  if (nearRiver(x, z, 0.6) || onRoad(x, z, 3.4) || inCamp(x, z, 7) || Math.hypot(x, z) < 12) return;
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
// the road: a strip of bare trodden earth from the start to the clearing, so it is plain which way to go
{
  const pos = [],
    idx = [];
  let n = 0;
  for (let x = START_X - 10; x <= -10; x += 1.5, n++) {
    const w = 1.5 + 0.25 * Math.sin(x * 0.7),
      c = roadZ(x);
    pos.push(x, 0.012, c - w, x, 0.012, c + w);
    if (n) idx.push(n * 2 - 2, n * 2 - 1, n * 2, n * 2 - 1, n * 2 + 1, n * 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, toon(0x9a8460, { rim: 0 }));
  m.receiveShadow = true;
  scene.add(m);
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
  if (onRoad(x, z, 3.4) || inCamp(x, z, 8) || Math.hypot(x, z) < 14 || nearRiver(x, z, big ? 1 : -1.6)) continue;
  rock(x, z, big ? R(0.8, 1.4) : R(0.15, 0.45), big);
}

// ---------- river ----------
// Water is drawn by its own small shader, kept plain: one blue, a little paler toward the banks, with broad soft bands drifting from the
// fall toward the camera, a thin white line along each bank and white where the fall lands. The same shader, told it is falling, draws the waterfall.
const WATER_T = { value: 0 };
function waterMat(fall, head = RIVER_FROM) {
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
        float flow = falling ? vUv.y * 6.4 + uT * 4.0 : vZ - uT * 1.4;
        // plain water: one colour, a little paler toward the banks, with broad soft bands drifting along it
        float band = fbm(vec2(vUv.x * 3.0, flow * 0.3));
        vec3 col = mix(uDeep, uShallow, smoothstep(0.3, 1.0, edge) * 0.6);
        col = mix(col, uShallow, smoothstep(0.45, 0.75, band) * 0.25);
        // a thin clean line of white along each bank, and white where the fall comes down
        float foam = smoothstep(0.9, 0.97, edge);
        if (falling) foam = max(foam, 0.35 + smoothstep(0.4, 0.7, band) * 0.35);
        else foam = max(foam, (1.0 - smoothstep(0.0, 3.0, vZ - uHead)) * 0.8);
        col = mix(col, uFoam, clamp(foam, 0.0, 1.0));
        float fogF = 1.0 - exp(-uFogD * uFogD * vDepth * vDepth);
        float alpha = falling ? 0.9 * smoothstep(1.0, 0.85, edge) : 0.95;
        gl_FragColor = vec4(mix(col, uFog, fogF), alpha);
      }`,
  });
}
// Each river runs in a channel cut below the ground. The ground itself is not drawn where a channel is; inside the gap are sloping earth
// banks and the water, well down. Where the road crosses the first river the gap is simply not cut: the crossing is the land itself.
const DEEP = 0.9,
  CROSS = 2.4;
{
  // the ground leaves two river-shaped holes, the first one broken at the crossing
  const base = GROUND.onBeforeCompile;
  GROUND.onBeforeCompile = (sh) => {
    base(sh);
    sh.vertexShader =
      'varying vec3 vWP;\n' +
      sh.vertexShader.replace('#include <fog_vertex>', '#include <fog_vertex>\nvWP = (modelMatrix * vec4(position, 1.0)).xyz;');
    sh.fragmentShader =
      'varying vec3 vWP;\n' +
      sh.fragmentShader.replace(
        'void main() {',
        `void main() {
float wR = abs(vWP.x - (${WX.toFixed(1)} + 1.6 * sin(vWP.z * 0.16)));
float eR = abs(vWP.x - (${EX.toFixed(1)} + 1.6 * sin(vWP.z * 0.16 + 1.7)));
if ((vWP.z > ${RIVER_FROM.toFixed(1)} && abs(vWP.z) > ${CROSS.toFixed(1)} && wR < 2.5) || eR < 2.5) discard;`,
      );
  };
  GROUND.customProgramCacheKey = () => 'ground-with-rivers';
  GROUND.needsUpdate = true;
  // one stretch of channel: the water down the middle, a sloping bank on each side
  const bankMat = toon(0x5c4833, { rim: 0 });
  const stretch = (z0, z1, c = WX, head = RIVER_FROM) => {
    const wp = [],
      wuv = [],
      bp = [],
      wi = [],
      bi = [];
    let n = 0;
    for (let z = z0; ; z = Math.min(z1, z + 1), n++) {
      const cx = riverX(z, c);
      wp.push(cx - 2.05, -DEEP, z, cx + 2.05, -DEEP, z);
      wuv.push(0, z, 1, z);
      bp.push(cx - 2.5, 0, z, cx - 2.0, -DEEP - 0.05, z, cx + 2.0, -DEEP - 0.05, z, cx + 2.5, 0, z);
      if (n) {
        const a = n * 2 - 2,
          q = n * 4 - 4;
        wi.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        bi.push(q, q + 4, q + 1, q + 1, q + 4, q + 5, q + 2, q + 6, q + 3, q + 3, q + 6, q + 7);
      }
      if (z >= z1) break;
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
    wg.setAttribute('uv', new THREE.Float32BufferAttribute(wuv, 2));
    wg.setIndex(wi);
    scene.add(new THREE.Mesh(wg, waterMat(false, head)));
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
    bg.setIndex(bi);
    bg.computeVertexNormals();
    const bm = new THREE.Mesh(bg, bankMat);
    bm.receiveShadow = true;
    scene.add(bm);
  };
  stretch(RIVER_FROM, -CROSS);
  stretch(CROSS, ZS + 30);
  // the second river has no fall in sight: it comes out of the distance, so there is no foam at its head
  stretch(ZN - 40, ZS + 30, EX, -999);
  // the two faces of the crossing, where the land drops to the water on either side of the road
  for (const sz of [-1, 1]) {
    const cx = riverX(sz * CROSS),
      wall = add(scene, new THREE.PlaneGeometry(5, DEEP + 0.1), bankMat, [cx, -(DEEP + 0.1) / 2, sz * CROSS]);
    wall.castShadow = false;
  }
  // nobody walks through water: two rows of blocking circles down each river, the first left open at the crossing
  for (let z = RIVER_FROM; z <= ZS + 6; z += 1.2) if (Math.abs(z) > 3.3) for (const o of [-1.2, 1.2]) SOLIDS.push({ x: riverX(z) + o, z, r: 1.5 });
  for (let z = ZN - 6; z <= ZS + 6; z += 1.2) for (const o of [-1.2, 1.2]) SOLIDS.push({ x: riverX(z, EX) + o, z, r: 1.5 });
}

// ---------- waterfall ----------
// a wall of rock on the far side, the water coming over it in a sheet and breaking into foam where it lands
const FALL = V3(riverX(RIVER_FROM), 0, RIVER_FROM);
{
  for (let i = 0; i < 16; i++) {
    const x = FALL.x + R(-6, 6),
      r = R(1.6, 3.2);
    add(
      scene,
      new THREE.DodecahedronGeometry(r, 0),
      ROCKM[i % 2],
      [x, R(0.5, 4.5), FALL.z - R(1.2, 4.5)],
      [R(0, 6), R(0, 6), R(0, 6)],
      [1.2, 1.3, 1],
    );
  }
  for (const sx of [-1, 1])
    for (let i = 0; i < 3; i++)
      add(
        scene,
        new THREE.DodecahedronGeometry(R(1.2, 2), 0),
        ROCKM[i % 2],
        [FALL.x + sx * R(3, 4.4), R(0.6, 3.6), FALL.z - R(0, 1.2)],
        [R(0, 6), R(0, 6), R(0, 6)],
      );
  for (let x = -7; x <= 7; x += 1.6) SOLIDS.push({ x: FALL.x + x, z: FALL.z - 2.2, r: 2 });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 6.4 + DEEP), waterMat(true));
  sheet.position.set(FALL.x, 3.2 - DEEP / 2, FALL.z - 0.7);
  sheet.rotation.x = -0.09;
  scene.add(sheet);
  // beyond the fall the river's line carries on as a ridge of rock to the far limit, so the first river shuts the whole west side
  for (let z = RIVER_FROM - 6; z > ZN - 8; z -= 3) {
    const r = R(2, 3.2);
    ROCK[(Math.random() * 2) | 0].push([WX + R(-1.5, 1.5), R(0.4, 1.6), z, R(0, 6), R(0, 6), R(0, 6), r * 1.2, r * 1.3, r]);
    SOLIDS.push({ x: WX, z, r: 2.6 });
  }
}
// every lot is now complete: each becomes one batch
for (const l of LOTS) {
  const m = new THREE.InstancedMesh(l.geo, l.mat, l.length),
    o = new THREE.Object3D();
  l.forEach((p, i) => {
    o.position.set(p[0], p[1], p[2]);
    o.rotation.set(p[3], p[4], p[5]);
    o.scale.set(p[6], p[7], p[8]);
    o.updateMatrix();
    m.setMatrixAt(i, o.matrix);
  });
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
}

// ---------- Vishwamitra's hut ----------
// a stand-in for now, just beyond the altar: round mud walls, a thatched cone of a roof and a dark doorway facing the fire
{
  const hut = new THREE.Group();
  hut.position.set(0, 0, -12);
  scene.add(hut);
  cyl(hut, 2.6, 2.7, 2.2, toon(0xb79a72, { rim: 0.1 }), [0, 1.1, 0]);
  add(hut, new THREE.ConeGeometry(3.5, 2.4, 16), toon(0xc9a455, { rim: 0.15 }), [0, 3.35, 0]);
  add(hut, new THREE.BoxGeometry(0.9, 1.6, 0.12), toon(0x2a1c14, { rim: 0 }), [0, 0.8, 2.66]);
  SOLIDS.push({ x: 0, z: -12, r: 2.8 });
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
function prisoner(x, z, i) {
  const g = new THREE.Group(),
    rig = makeRig(),
    tone = [0xb8733a, 0xa5683a, 0xc08a58][i % 3],
    skin = toon(tone, { vertexColors: true, rim: 0.3 }),
    sk = toon(tone, { rim: 0.3 }),
    cloth = toon([0xd9c9a3, 0xc9a25a, 0xe2ddd0][i % 3], { vertexColors: true }),
    hair = toon(i === 1 ? 0xb9b4ac : 0x1a1418, { rim: 0.2 });
  g.position.set(x, 0, z);
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
  if (i !== 2) sph(head, 0.04, hair, [0, 0.15, -0.06], [1, 0.9, 1]);
  if (i === 1) sph(head, 0.07, hair, [0, -0.125, 0.05], [1.05, 0.95, 0.8]);
  // the stake he is tied to, and three turns of rope round his chest and the stake together
  // the stake stands in the ground, not on him, so it stays behind when he walks off
  cyl(scene, 0.055, 0.07, 1.5, WOOD, [x, 0.75, z - 0.27]);
  const ropes = [0.36, 0.43, 0.5].map((y) => tor(g, 0.23, 0.016, ROPE, [0, y, -0.1], [Math.PI / 2, 0, 0], [1, 1.2, 1]));
  SOLIDS.push({ x, z, r: 0.34 });
  const ik = new CCDIKSolver(body, [
      { target: BI.tgtL, effector: BI.handL, links: [{ index: BI.foreL }, { index: BI.armL }], iteration: 12 },
      { target: BI.tgtR, effector: BI.handR, links: [{ index: BI.foreR }, { index: BI.armR }], iteration: 12 },
    ]),
    p = {
      g,
      rig,
      ropes,
      ik,
      up: 0,
      nam: 0,
      free: false,
      hold: 0,
      go: false,
      wk: 0,
      sit: 0,
      // no two walk alike: each sets off a little after the last, at his own pace, out of step, with his own swing and lean
      ph: Math.random() * 6.28,
      wait: [0, 0.9, 0.4][i],
      pace: [2.5, 2.2, 2.7][i],
      swing: [0.65, 0.45, 0.8][i],
      lean: [0.08, 0.13, 0.04][i],
      // his way to the hermitage: onto the road, along it to the edge of the clearing, then to his own place beside the hut
      path: [
        [x + 2.5, roadZ(x + 2.5) + (i - 1) * 0.7],
        [-12, (i - 1) * 0.8],
        [
          [-6.5, -6],
          [-8.2, -7.6],
          [-6, -8.8],
        ][i],
      ],
    };
  pose(p);
  PRISONERS.push(p);
}
const CAMP_Z = roadZ(CAMP.x),
  HELD = V3(CAMP.x, 0, CAMP_Z - 3.6);
[-1.6, 0, 1.6].forEach((dx, i) => prisoner(CAMP.x + dx, HELD.z + (i === 1 ? -0.4 : 0), i));
const GUARDS = [
  ['brute', 6.5, 0.4],
  ['grunt', -4, -1.6],
  ['grunt', 3.4, -2.0],
  ['grunt', -0.5, 2.8],
].map(([kind, dx, dz]) => {
  const d = spawn(0, kind, V3(CAMP.x + dx, 0, CAMP_Z + dz));
  // until roused he stands watching the prisoners
  d.wait = true;
  d.to = HELD;
  d.onHit = () => {
    const h = d.foe;
    if (!h) return;
    const hp = h.group.position;
    if (Math.hypot(hp.x - d.g.position.x, hp.z - d.g.position.z) > d.rng + 0.8) return;
    h.hp = Math.max(0, h.hp - (d.br ? 18 : 6));
    puff(tmpA.set(hp.x, 1.2, hp.z), 0xff6a50, 12, 2.6, 0.3, 2);
  };
  return d;
});
let roused = false,
  thanked = false;
function campUpdate(dt) {
  const live = GUARDS.filter((d) => grunts.includes(d) && !d.dead),
    flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  if (!roused) roused = live.length < GUARDS.length || live.some((d) => d.hp < d.hp0) || HEROES.some((h) => flat(h.group.position, CAMP) < 16);
  if (roused)
    for (const d of live) {
      let foe = HEROES[0];
      for (const h of HEROES) if (flat(h.group.position, d.g.position) < flat(foe.group.position, d.g.position)) foe = h;
      d.wait = false;
      d.foe = foe;
      d.to = foe.group.position;
      // near enough to club a man, not the long reach they keep from the altar fire
      d.rng = d.br ? 2.3 : 1.5;
    }
  const allUp = PRISONERS.every((p) => p.up >= 1);
  // the moment the last of them is on his feet they thank the brothers. Nobody moves until it has been said
  if (allUp && !thanked) {
    thanked = true;
    const f = PRISONERS.map((p) => snap(p.rig.bone.head, p.g.rotation.y, null));
    LOCK = true;
    say(
      [
        { who: 'Villager', face: f[0], text: 'You came! We thought no one would.' },
        { who: 'Elder', face: f[1], text: 'They dragged us from the hermitage at dawn, to spill our blood on the sage’s altar. Bless you both.' },
        { who: 'Rama', face: RAMA.face, text: 'Go to Vishwamitra. You will be safe by his fire.' },
      ],
      () => (LOCK = false),
    );
  }
  for (const p of PRISONERS) {
    if (!p.free && !live.length) {
      const h = HEROES.find((o) => flat(o.group.position, p.g.position) < 2.6);
      if (h) {
        p.free = true;
        p.by = h;
        p.ropes.forEach((o) => p.g.remove(o));
        puff(tmpA.set(p.g.position.x, 0.5, p.g.position.z), 0xe8d8a8, 16, 2, 0.5, 2);
      }
    }
    if (p.free) {
      // first he gets to his feet; only when all of them are standing do they bow together. They hold the bow while they give their thanks,
      // then lower their hands and walk to Vishwamitra's hermitage, where they sit down facing the fire
      p.up = Math.min(1, p.up + dt / 0.45);
      let want;
      if (!p.go) {
        if (allUp) p.nam = Math.min(1, p.nam + dt / 0.7);
        if (p.nam >= 1 && !talking() && (p.hold += dt) > 0.8 + p.wait) p.go = true;
        // on his feet he turns to whoever freed him
        const q = p.by.group.position;
        want = Math.atan2(q.x - p.g.position.x, q.z - p.g.position.z);
      } else {
        p.nam = Math.max(0, p.nam - dt / 0.4);
        const P = p.g.position,
          w = p.path[0],
          dx = w ? w[0] - P.x : -P.x,
          dz = w ? w[1] - P.z : -P.z,
          l = Math.hypot(dx, dz) || 1,
          moving = w && p.nam <= 0;
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

// ---------- arriving at the hermitage ----------
// When the brother you are playing comes near the altar with no enemy about, the scene takes over:
//   seat   both walk to their places before the fire, sit and bow
//   pause  a second after both are down, and any freed villagers have sat down too...
//   om     ...Vishwamitra, eyes shut, makes them wait through one long Om
//   come   then he rises and walks over to them
//   talk   he tells them why they are here
//   back   he returns to his seat by the fire and sits
//   up     the brothers rise, and the level is the player's again
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
  if (ARR.step === 'up') {
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
    turn = (want, rate) => (SG.yaw += Math.atan2(Math.sin(want - SG.yaw), Math.cos(want - SG.yaw)) * Math.min(1, dt * rate));
  // a point he is only passing (pass) counts as reached from a pace off, so he is already turning for the next as he rounds it
  if (l < (pass ? 1.1 : 0.15)) return true;
  SG.move = 'walk';
  if (SG.yaw == null) SG.yaw = SG.facing;
  // he turns toward the spot gradually and walks the way he is facing, so his path bends instead of cornering.
  // Only over the last half pace does he step straight onto the spot, slowing as he comes up to it
  const want = Math.atan2(dx, dz);
  turn(want, pass ? 2.2 : 3.2);
  // a little quicker than his stroll round the fire, with his stride quickened to match so his feet do not slide
  const k = SG.wWalk * (1 - SG.wSit) * dt * (pass ? 1 : Math.min(1, 0.3 + l / 1.5)),
    v = Math.min(l, 1.7 * k),
    a = !pass && l < 0.6 ? want : SG.facing;
  SG.phase += (0.6 * k) / 0.36;
  P.x += Math.sin(a) * v;
  P.z += Math.cos(a) * v;
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
      to('seat');
    }
  } else if (A.step === 'seat') {
    if (HEROES.every((h) => h.sat && h.s.wSit > 0.9)) to('pause');
  } else if (A.step === 'pause') {
    // he waits for the freed villagers too, if any are still on their way to sit by his hut
    // (only once all three are free: they do not set off until then, so a man left tied cannot hold the scene up for ever)
    if (PRISONERS.every((p) => p.free) && PRISONERS.some((p) => p.sit < 1)) A.t = 0;
    // then he keeps them waiting. His eyes close, and he says one long Om before anything else happens: patience.
    // The brothers hold their bow all through it, and until he has come over and begins to speak
    if (A.t > 1.5) {
      sageEyes(true);
      say([{ who: 'Vishwamitra', face: snap(V.bone.head, V.group.rotation.y, null), text: 'Om…' }], () => to('rise'));
      to('om');
    }
  } else if (A.step === 'rise') {
    // five more seconds of stillness after the Om. His eyes open near the end of it, and then he gets up
    if (A.t > 4.2) sageEyes(false);
    if (A.t > 5) {
      SG.at = V.group.position.clone();
      to('come');
    }
  } else if (A.step === 'come') {
    if (!A.via) A.via = sageWalk(SAGE_VIA, dt, true);
    else if (sageWalk(SAGE_MEET, dt)) {
      SG.move = 'idle';
      // he turns to face them, unhurriedly (see the top of this function)
      A.face = Math.atan2(-4.8 - SAGE_MEET.x, 4 - SAGE_MEET.z);
      to('greet');
    }
  } else if (A.step === 'greet') {
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
          { who: 'Rama', face: RAMA.face, text: 'Then tend your fire, Gurudev. Nothing will reach it while we stand.' },
          { who: 'Vishwamitra', face: f, text: 'Guard the fire. That is all I ask of you.' },
        ],
        () => {
          A.via = false;
          A.face = null;
          to('back');
        },
      );
      to('talk');
    }
  } else if (A.step === 'back') {
    if (!A.via) A.via = sageWalk(SAGE_VIA, dt, true);
    else if (sageWalk(SAGE_HOME, dt)) {
      SG.at = SG.yaw = null;
      SG.pathA = Math.PI;
      SG.move = 'sit';
      to('up');
    }
  } else if (A.step === 'up') {
    if (A.t > 0.4) {
      LOCK = false;
      to('done');
    }
  }
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
    o.position.set(x, 0.05, z);
    // laid flat, then turned about the vertical so each dash lies along the line
    o.rotation.set(-Math.PI / 2, a, 0, 'YXZ');
    o.updateMatrix();
    EDGE.setMatrixAt(i, o.matrix);
  });
  EDGE.frustumCulled = false;
  EDGE.visible = false;
  scene.add(EDGE);
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
  }
  if (Math.abs(P.x - FALL.x) < 60 && Math.random() < dt * 40)
    puff(tmpA.set(FALL.x + R(-1.8, 1.8), 0.2 - DEEP, FALL.z + R(-0.2, 0.8)), 0xeaf6ff, 1, 1.4, 0.7, 2);
  campUpdate(dt);
  arriveUpdate(dt);
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
dist = 20;

// ---------- health and mana ----------
// the camp's demons can hurt the brothers, but nothing yet happens at zero. Rama's astras draw on his mana, which comes back slowly
for (const h of HEROES) h.hp = h.hpMax = 100;
RAMA.mp = RAMA.mpMax = 100;
// Lakshmana has stamina instead: every quick shot spends some, and with none left he reloads only as fast as Rama until it comes back
LAK.st = LAK.stMax = 100;
const COST = { 'Agneyastra · fire': 15, 'Vayavyastra · wind': 10, Manavastra: 20, 'Nagastra · serpent': 25, Brahmastra: 60 };
for (const k of KINDS) k.cost = COST[k.name] || 0;

// ---------- the party: a card for each brother, to switch between them and to show how they are ----------
const NAMES = { rama: 'Rama', lak: 'Lakshmana' },
  cards = {};
for (const h of HEROES) {
  const c = document.createElement('button');
  c.className = 'card';
  c.dataset.w = h.name;
  c.innerHTML = `<img alt=""><span><b>${NAMES[h.name]}</b><i class="hp"><s></s></i>${h.mp !== undefined ? '<i class="mp"><s></s></i>' : ''}${h.st !== undefined ? '<i class="st"><s></s></i>' : ''}</span>`;
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
function portrait(h) {
  cards[h.name].querySelector('img').src = h.face = snap(h.bone.head, h.group.rotation.y, h.group);
}
function meters() {
  for (const h of HEROES) {
    const c = cards[h.name];
    c.querySelector('.hp s').style.width = (100 * h.hp) / h.hpMax + '%';
    if (h.mp !== undefined) c.querySelector('.mp s').style.width = (100 * h.mp) / h.mpMax + '%';
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
  if (++fr % 6 === 0) meters();
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
