'use strict';
// The clearing: ground, pillars, trees, the altar fire and the lights.
// ---------- the practice ground ----------
// things nobody can walk through: each is a circle on the ground. The altar is the first; the pillars add themselves below
const SOLIDS = [{ x: 0, z: 0, r: 1.05 }];
// How high the ground is at a spot. Here it is flat; a level with hills and cliffs gives its own rule, and everything that
// stands on the ground (heroes, enemies, arrows that fall) asks this instead of assuming zero
let groundY = (x, z) => 0;
function kolam() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#8a6e56';
  g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 14000; i++) {
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '40,24,20' : '220,180,140'},${Math.random() * 0.12})`;
    g.fillRect(Math.random() * 1024, Math.random() * 1024, 1 + Math.random() * 4, 1 + Math.random() * 4);
  }
  g.translate(512, 512);
  g.strokeStyle = 'rgba(255,236,200,.75)';
  g.lineWidth = 3;
  for (const r of [70, 150, 162, 300, 312, 470, 490]) {
    g.beginPath();
    g.arc(0, 0, r, 0, 7);
    g.stroke();
  }
  for (const [n, r0, r1, w] of [
    [12, 74, 148, 26],
    [24, 166, 296, 26],
    [48, 316, 466, 16],
  ])
    for (let i = 0; i < n; i++) {
      g.save();
      g.rotate((i / n) * Math.PI * 2);
      g.beginPath();
      g.moveTo(r0, 0);
      g.quadraticCurveTo((r0 + r1) / 2, w, r1, 0);
      g.quadraticCurveTo((r0 + r1) / 2, -w, r0, 0);
      g.fillStyle = i % 2 ? 'rgba(226,120,40,.5)' : 'rgba(160,40,40,.42)';
      g.fill();
      g.stroke();
      g.restore();
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
add(scene, new THREE.CylinderGeometry(4.6, 4.75, 0.3, 64), [STONE, toon(0xb8b0a8, { map: kolam(), rim: 0.06 }), STONE], [0, -0.15, 0]);
const GROUND = toon(0x4a3a38, { rim: 0 });
add(scene, new THREE.CircleGeometry(120, 64), GROUND, [0, -0.02, 0], [-Math.PI / 2, 0, 0]);
const fire = new THREE.Group();
scene.add(fire);
[
  [0.74, 0x7a3220],
  [0.6, 0x8e3c24],
  [0.46, 0xa04828],
].forEach(([w, c], i) => add(fire, new THREE.BoxGeometry(w, 0.1, w), toon(c), [0, 0.05 + i * 0.1, 0], [0, Math.PI / 4, 0]));
const flames = [0xff5a10, 0xffa020, 0xffe070].map((c, i) => {
  const m = new THREE.Mesh(
    new THREE.ConeGeometry(0.15 - i * 0.04, 0.5 - i * 0.1, 10),
    new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
  );
  m.position.y = 0.52 - i * 0.04;
  fire.add(m);
  return m;
});
const fireL = new THREE.PointLight(0xff8a3a, 9, 9, 1.8);
fireL.position.y = 0.8;
fire.add(fireL);
{
  const pr = (h) => [
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
  [3.4, 2.2, 3.4, 3.4, 1.4, 3.4].forEach((h, i) => {
    const a = 0.5 + i * 1.05;
    lathe(scene, pr(h), STONE, [Math.cos(a) * 4.2, 0, Math.sin(a) * 4.2]);
    SOLIDS.push({ x: Math.cos(a) * 4.2, z: Math.sin(a) * 4.2, r: 0.4 });
  });
}
function butt() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  [
    ['#e9d9a8', 128],
    ['#c8382c', 100],
    ['#e9d9a8', 72],
    ['#c8382c', 44],
    ['#f2b632', 18],
  ].forEach(([col, r]) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(128, 128, r, 0, 7);
    g.fill();
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const straw = toon(0xc9a45a),
  face = toon(0xffffff, { map: butt(), rim: 0.05 }),
  targets = [];
// every tree is kept on a list with its parts and the circle its trunk blocks, so a level can clear a path through the forest
const TREES = [],
  TREE_MATS = { trunk: toon(0x2e1e30, { rim: 0.1 }), leaf: toon(0x3a2848, { rim: 0.25 }), leaf2: toon(0x4a3458, { rim: 0.25 }) },
  HILL_MATS = [];
function addTree(x, z, s, i = TREES.length) {
  const { trunk, leaf, leaf2 } = TREE_MATS,
    solid = { x, z, r: 0.3 * s },
    parts = [
      cyl(scene, 0.18 * s, 0.26 * s, 3 * s, trunk, [x, 1.5 * s - 0.3, z]),
      add(scene, new THREE.IcosahedronGeometry(1.7 * s, 1), i % 2 ? leaf : leaf2, [x, 3.8 * s, z], [0, x * 7.3, 0], [1, 0.85, 1]),
      add(scene, new THREE.IcosahedronGeometry(1.1 * s, 1), i % 2 ? leaf2 : leaf, [x + 0.5 * s, 5 * s, z - 0.3 * s]),
    ];
  SOLIDS.push(solid);
  TREES.push({ x, z, s, parts, solid });
}
{
  for (let i = 0; i < 70; i++) {
    const a = Math.random() * 6.3,
      r = 19 + Math.random() * 30;
    addTree(Math.cos(a) * r, Math.sin(a) * r, 0.8 + Math.random() * 1.4, i);
  }
  for (let i = 0; i < 9; i++)
    add(
      scene,
      new THREE.ConeGeometry(14 + Math.random() * 10, 10 + Math.random() * 12, 5),
      (HILL_MATS[i] = toon(0x38203e, { rim: 0 })),
      [-70 + i * 17 + Math.random() * 6, 3, -62 - Math.random() * 20],
      [0, Math.random() * 3, 0],
    );
}
// the sky: three colours from horizon to zenith and a glow round the sun, all changeable so a level can set the time of day
const SKY = new THREE.Mesh(
  new THREE.SphereGeometry(200, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uA: { value: new THREE.Vector3(0.99, 0.66, 0.36) },
      uB: { value: new THREE.Vector3(0.66, 0.28, 0.42) },
      uC: { value: new THREE.Vector3(0.13, 0.09, 0.28) },
      uSun: { value: new THREE.Vector3(-0.34, 0.13, -1).normalize() },
      uGlow: { value: new THREE.Vector3(1.0, 0.72, 0.42) },
    },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader:
      'uniform vec3 uA, uB, uC, uSun, uGlow; varying vec3 vP; void main(){ vec3 d = normalize(vP); vec3 c = mix(uA, uB, smoothstep(-0.04,0.26,d.y)); c = mix(c, uC, smoothstep(0.18,0.75,d.y)); float s = max(dot(d, uSun), 0.0); c += uGlow * (pow(s, 40.0) * 0.9 + pow(s, 6.0) * 0.25); gl_FragColor = vec4(pow(c, vec3(2.2)), 1.0); }',
  }),
);
scene.add(SKY);
const sunDir = V3(-0.34, 0.2, -1).normalize();
const SUN = glow(0xffd9a0, 30);
SUN.position.copy(sunDir).multiplyScalar(150);
scene.add(SUN);
const HEMI = new THREE.HemisphereLight(0xffb48a, 0x2a1c3a, 1.5);
scene.add(HEMI);
const key = new THREE.DirectionalLight(0xffa868, 3.2);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0008;
// One shadow map for the whole clearing, fixed in place: everything on the ground is shadowed wherever the hero stands,
// and shadows do not swim or pop in as he moves. The box is wide and shallow because the sun is low.
Object.assign(key.shadow.camera, { left: -17, right: 17, top: 11, bottom: -8, near: 1, far: 75 });
key.position.copy(sunDir).multiplyScalar(16).add(V3(0, 4, 0)).multiplyScalar(2.6);
key.shadow.mapSize.set(4096, 2304);
scene.add(key, key.target);
// in the sandbox the shadow map sits still over the clearing. A level that roams sets shadowFollow, and the map then moves with the camera's target, in whole steps
let shadowFollow = false;
const shadowOff = key.position.clone();
const fill = new THREE.DirectionalLight(0xc8d0ff, 1.5);
// ---------- time of day ----------
// the scene is built at dusk. setDay() turns it to a clear morning: blue sky, a high white sun, green forest and grass
function setDay() {
  const U = SKY.material.uniforms,
    sun = V3(-0.45, 0.85, -0.4).normalize();
  U.uA.value.set(0.78, 0.88, 0.96);
  U.uB.value.set(0.45, 0.68, 0.93);
  U.uC.value.set(0.2, 0.42, 0.82);
  U.uSun.value.copy(sun);
  U.uGlow.value.set(1.0, 0.95, 0.8);
  SUN.position.copy(sun).multiplyScalar(150);
  SUN.material.color.set(0xfff6dc);
  scene.fog.color.set(0xbcd6e8);
  scene.fog.density = 0.006;
  HEMI.color.set(0xdcecff);
  HEMI.groundColor.set(0x6a6048);
  HEMI.intensity = 1.5;
  key.color.set(0xfff0d8);
  key.intensity = 3.0;
  // the shadow map covers everything the camera can see round the hero, not just the ground near him, so no shadow is cut off in view
  shadowOff.copy(sun).multiplyScalar(80);
  key.position.copy(shadowOff);
  Object.assign(key.shadow.camera, { left: -48, right: 48, top: 40, bottom: -40, near: 1, far: 200 });
  key.shadow.camera.updateProjectionMatrix();
  fill.intensity = 0.7;
  GROUND.color.set(0x6f7f45);
  TREE_MATS.trunk.color.set(0x5a3c28);
  TREE_MATS.leaf.color.set(0x3f7a3c);
  TREE_MATS.leaf2.color.set(0x57903f);
  HILL_MATS.forEach((m) => m.color.set(0x7088a0));
  bloom.threshold = 0.96;
  bloom.strength = 0.3;
  // against bright grass a faint streak vanishes: in daylight an arrow's trail is white, three times as wide and twice as long
  Object.assign(STREAK, { color: 0xffffff, tw: 0.075, hl: 9 });
}
fill.position.set(4, 5, 7);
scene.add(fill);
const DN = 500,
  dpos = new Float32Array(DN * 3);
for (let i = 0; i < DN; i++) {
  dpos[i * 3] = (Math.random() - 0.5) * 30;
  dpos[i * 3 + 1] = Math.random() * 6;
  dpos[i * 3 + 2] = (Math.random() - 0.5) * 30;
}
const dgeo = new THREE.BufferGeometry();
dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
scene.add(
  new THREE.Points(
    dgeo,
    new THREE.PointsMaterial({ color: 0xffc890, size: 0.04, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }),
  ),
);
const reticle = glow(0xffe0a0, 0.5);
scene.add(reticle);
