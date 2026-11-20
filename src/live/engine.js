'use strict';
// Renderer, scene, camera, toon materials, small geometry helpers, and the sculpting that turns a distance field into a mesh.
// The characters are one continuous skinned body on a skeleton, posed by blended motions and finished with inverse kinematics.

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z),
  $ = (id) => document.getElementById(id);
const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x8a4658, 0.02);
const cam = new THREE.PerspectiveCamera(36, 1, 0.1, 300);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, cam));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42, 0.7, 0.86);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- materials ----------
const ramp = new THREE.DataTexture(new Uint8Array([40, 90, 150, 205, 255]), 5, 1, THREE.RedFormat);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
ramp.needsUpdate = true;
function toon(color, o = {}) {
  const rim = o.rim === undefined ? 0.3 : o.rim;
  delete o.rim;
  const m = new THREE.MeshToonMaterial({ color, gradientMap: ramp, side: THREE.DoubleSide, ...o });
  m.userData.dis = { value: 0 }; // 0 = whole, 1 = gone: the surface is eaten away in fine grains with a faint glow at the edge
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uDis = m.userData.dis;
    sh.fragmentShader =
      'uniform float uDis;\n' +
      sh.fragmentShader.replace(
        '#include <tonemapping_fragment>',
        `if (uDis > 0.0) { float nz = fract(sin(dot(floor(vViewPosition * 120.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453); if (nz < uDis) discard; gl_FragColor.rgb += vec3(0.45, 0.18, 0.6) * clamp(1.0 - (nz - uDis) / 0.06, 0.0, 1.0); }\nfloat rimF = pow(1.0 - clamp(abs(dot(normalize(vViewPosition), normal)), 0.0, 1.0), 3.0); gl_FragColor.rgb += vec3(1.0, 0.55, 0.26) * rimF * ${rim.toFixed(2)};\n#include <tonemapping_fragment>`,
      );
  };
  return m;
}
const GOLD = toon(0xf0b030, { emissive: 0x4a2a00, rim: 0.5 }),
  DARK = toon(0x15101a),
  WOOD = toon(0x7a4a22),
  STONE = toon(0x6a5244, { rim: 0.15 });
const gem = (c) => new THREE.MeshBasicMaterial({ color: c });

// ---------- geometry helpers ----------
function add(parent, geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...p);
  m.rotation.set(...r);
  m.scale.set(...s);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
const sph = (parent, rad, mat, p, s, r) => add(parent, new THREE.SphereGeometry(rad, 24, 18), mat, p, r, s);
const tor = (parent, rad, tube, mat, p, r, s) => add(parent, new THREE.TorusGeometry(rad, tube, 10, 36), mat, p, r, s);
const cyl = (parent, r0, r1, len, mat, p, r, s) => add(parent, new THREE.CylinderGeometry(r0, r1, len, 20), mat, p, r, s);
const lathe = (parent, pts, mat, p, r, s) =>
  add(
    parent,
    new THREE.LatheGeometry(
      pts.map((q) => new THREE.Vector2(q[0], q[1])),
      36,
    ),
    mat,
    p,
    r,
    s,
  );
function glow(color, size) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d'),
    gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,255,255,.5)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr;
  x.fillRect(0, 0, 128, 128);
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c),
      color,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      fog: false,
    }),
  );
  s.scale.setScalar(size);
  return s;
}

// ---------- sculpting: a signed distance field meshed with surface nets ----------
const smin = (a, b, k) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
const L3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function field(prims) {
  // ['c', a, b, ra, rb, k] tapered capsule · ['e', centre, radii, k] ellipsoid
  return (x, y, z) => {
    let d = 9;
    for (const p of prims) {
      let v;
      if (p[0] === 'c') {
        const a = p[1],
          b = p[2],
          bx = b[0] - a[0],
          by = b[1] - a[1],
          bz = b[2] - a[2],
          px = x - a[0],
          py = y - a[1],
          pz = z - a[2];
        let h = (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz);
        h = h < 0 ? 0 : h > 1 ? 1 : h;
        const dx = px - bx * h,
          dy = py - by * h,
          dz = pz - bz * h;
        v = Math.sqrt(dx * dx + dy * dy + dz * dz) - (p[3] + (p[4] - p[3]) * h);
      } else {
        const c = p[1],
          r = p[2],
          qx = (x - c[0]) / r[0],
          qy = (y - c[1]) / r[1],
          qz = (z - c[2]) / r[2];
        v = (Math.sqrt(qx * qx + qy * qy + qz * qz) - 1) * Math.min(r[0], r[1], r[2]);
      }
      d = smin(d, v, p[p.length - 1]);
    }
    return d;
  };
}
function sculpt(f, lo, hi, cell, colFn) {
  const nx = Math.ceil((hi[0] - lo[0]) / cell),
    ny = Math.ceil((hi[1] - lo[1]) / cell),
    nz = Math.ceil((hi[2] - lo[2]) / cell),
    sx = nx + 1,
    sxy = sx * (ny + 1),
    g = new Float32Array(sxy * (nz + 1));
  for (let k = 0, n = 0; k <= nz; k++)
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) g[n++] = f(lo[0] + i * cell, lo[1] + j * cell, lo[2] + k * cell);
  const vid = new Int32Array(nx * ny * nz).fill(-1),
    pos = [],
    idx = [],
    cv = new Float32Array(8),
    E = [
      [0, 1],
      [2, 3],
      [4, 5],
      [6, 7],
      [0, 2],
      [1, 3],
      [4, 6],
      [5, 7],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ];
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        let mask = 0;
        for (let c = 0; c < 8; c++) {
          const v = g[i + (c & 1) + (j + ((c >> 1) & 1)) * sx + (k + (c >> 2)) * sxy];
          cv[c] = v;
          if (v < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;
        let px = 0,
          py = 0,
          pz = 0,
          n = 0;
        for (const [a, b] of E) {
          if (cv[a] < 0 === cv[b] < 0) continue;
          const t = cv[a] / (cv[a] - cv[b]),
            ax = a & 1,
            ay = (a >> 1) & 1,
            az = a >> 2;
          px += ax + ((b & 1) - ax) * t;
          py += ay + (((b >> 1) & 1) - ay) * t;
          pz += az + ((b >> 2) - az) * t;
          n++;
        }
        vid[i + j * nx + k * nx * ny] = pos.length / 3;
        pos.push(lo[0] + (i + px / n) * cell, lo[1] + (j + py / n) * cell, lo[2] + (k + pz / n) * cell);
      }
  const V = (i, j, k) => vid[i + j * nx + k * nx * ny],
    quad = (a, b, c, d) => {
      if (a >= 0 && b >= 0 && c >= 0 && d >= 0) idx.push(a, b, c, a, c, d);
    };
  for (let k = 1; k < nz; k++)
    for (let j = 1; j < ny; j++)
      for (let i = 1; i < nx; i++) {
        const v0 = g[i + j * sx + k * sxy] < 0;
        if (v0 !== g[i + 1 + j * sx + k * sxy] < 0) quad(V(i, j, k), V(i, j - 1, k), V(i, j - 1, k - 1), V(i, j, k - 1));
        if (v0 !== g[i + (j + 1) * sx + k * sxy] < 0) quad(V(i, j, k), V(i, j, k - 1), V(i - 1, j, k - 1), V(i - 1, j, k));
        if (v0 !== g[i + j * sx + (k + 1) * sxy] < 0) quad(V(i, j, k), V(i - 1, j, k), V(i - 1, j - 1, k), V(i, j - 1, k));
      }
  const nv = pos.length / 3,
    nor = new Float32Array(pos.length),
    col = new Float32Array(pos.length),
    e = cell * 0.7;
  for (let i = 0; i < nv; i++) {
    const x = pos[i * 3],
      y = pos[i * 3 + 1],
      z = pos[i * 3 + 2];
    let gx = f(x + e, y, z) - f(x - e, y, z),
      gy = f(x, y + e, z) - f(x, y - e, z),
      gz = f(x, y, z + e) - f(x, y, z - e);
    const l = Math.hypot(gx, gy, gz) || 1;
    gx /= l;
    gy /= l;
    gz /= l;
    nor[i * 3] = gx;
    nor[i * 3 + 1] = gy;
    nor[i * 3 + 2] = gz;
    const ao = 0.78 + 0.22 * Math.max(0, Math.min(1, f(x + gx * 0.035, y + gy * 0.035, z + gz * 0.035) / 0.035)),
      c = colFn ? colFn(x, y, z) : [1, 1, 1];
    col[i * 3] = c[0] * ao;
    col[i * 3 + 1] = c[1] * ao;
    col[i * 3 + 2] = c[2] * ao;
  }
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3,
      b = idx[t + 1] * 3,
      c = idx[t + 2] * 3,
      ux = pos[b] - pos[a],
      uy = pos[b + 1] - pos[a + 1],
      uz = pos[b + 2] - pos[a + 2],
      vx = pos[c] - pos[a],
      vy = pos[c + 1] - pos[a + 1],
      vz = pos[c + 2] - pos[a + 2];
    if ((uy * vz - uz * vy) * nor[a] + (uz * vx - ux * vz) * nor[a + 1] + (ux * vy - uy * vx) * nor[a + 2] < 0) {
      const tmp = idx[t + 1];
      idx[t + 1] = idx[t + 2];
      idx[t + 2] = tmp;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  return geo;
}
const surfZ = (f, x, y) => {
  if (f(x, y, 0) > 0) return 0;
  let a = 0,
    b = 0.4;
  for (let i = 0; i < 18; i++) {
    const m = (a + b) / 2;
    if (f(x, y, m) < 0) a = m;
    else b = m;
  }
  return a;
};
