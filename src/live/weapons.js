'use strict';
// Effects, the arrow kinds (the astras), and the things they act on.
// ---------- arrow kinds: the divine astras, each with its own flight, trail and impact ----------
const PN = 2400,
  ppos = new Float32Array(PN * 3).fill(-999),
  pcol = new Float32Array(PN * 3),
  pvel = new Float32Array(PN * 3),
  plife = new Float32Array(PN),
  pmax = new Float32Array(PN),
  pbase = new Float32Array(PN * 3),
  pgrav = new Float32Array(PN);
let pi = 0,
  shake = 0,
  slowT = 0,
  boost = 0;
const pgeo = new THREE.BufferGeometry(),
  tc = new THREE.Color();
pgeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
pgeo.setAttribute('color', new THREE.BufferAttribute(pcol, 3));
{
  const p = new THREE.Points(
    pgeo,
    new THREE.PointsMaterial({
      size: 0.2,
      map: glow(0xffffff, 1).material.map,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  p.frustumCulled = false;
  scene.add(p);
}
function puff(p, color, n, speed, life, grav = 0, spread = 0) {
  tc.set(color);
  for (let i = 0; i < n; i++) {
    const k = pi++ % PN,
      a = Math.random() * 6.283,
      u = Math.random() * 2 - 1,
      h = Math.sqrt(1 - u * u),
      sp = speed * (0.25 + Math.random() * 0.75);
    ppos[k * 3] = p.x + (Math.random() - 0.5) * spread;
    ppos[k * 3 + 1] = p.y + (Math.random() - 0.5) * spread;
    ppos[k * 3 + 2] = p.z + (Math.random() - 0.5) * spread;
    pvel[k * 3] = Math.cos(a) * h * sp;
    pvel[k * 3 + 1] = u * sp;
    pvel[k * 3 + 2] = Math.sin(a) * h * sp;
    pbase[k * 3] = tc.r;
    pbase[k * 3 + 1] = tc.g;
    pbase[k * 3 + 2] = tc.b;
    plife[k] = pmax[k] = life * (0.6 + Math.random() * 0.4);
    pgrav[k] = grav;
  }
}
const rings = [],
  ringGeo = new THREE.RingGeometry(0.9, 1, 56).rotateX(-Math.PI / 2);
function ring(p, r, color, dur = 0.5) {
  const m = new THREE.Mesh(
    ringGeo,
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    }),
  );
  m.position.set(p.x, Math.max(0.06, p.y * 0.2), p.z);
  scene.add(m);
  rings.push({ m, r, t: 0, dur });
}
const flashL = new THREE.PointLight(0xffffff, 0, 40, 1.5);
scene.add(flashL);
const flash = (p, color, power) => {
  flashL.position.set(p.x, p.y + 1.2, p.z);
  flashL.color.set(color);
  flashL.intensity = power;
};
function fxUpdate(dt) {
  streakT.offset.y -= dt * 1.6;
  for (let i = fx.length - 1; i >= 0; i--) if (!fx[i](dt)) fx.splice(i, 1);
  for (let k = 0; k < PN; k++) {
    if (plife[k] <= 0) continue;
    plife[k] -= dt;
    const f = Math.max(0, plife[k] / pmax[k]),
      j = k * 3;
    pvel[j + 1] -= pgrav[k] * dt;
    ppos[j] += pvel[j] * dt;
    ppos[j + 1] += pvel[j + 1] * dt;
    ppos[j + 2] += pvel[j + 2] * dt;
    pcol[j] = pbase[j] * f;
    pcol[j + 1] = pbase[j + 1] * f;
    pcol[j + 2] = pbase[j + 2] * f;
    if (plife[k] <= 0) ppos[j + 1] = -999;
  }
  pgeo.attributes.position.needsUpdate = pgeo.attributes.color.needsUpdate = true;
  for (let i = rings.length - 1; i >= 0; i--) {
    const q = rings[i];
    q.t += dt;
    const u = q.t / q.dur;
    q.m.scale.setScalar(q.r * (1 - (1 - Math.min(1, u)) ** 3));
    q.m.material.opacity = 1 - u;
    if (u >= 1) {
      scene.remove(q.m);
      q.m.material.dispose();
      rings.splice(i, 1);
    }
  }
  flashL.intensity *= Math.max(0, 1 - 7 * dt);
  shake = Math.max(0, shake - dt * 2.5);
  boost = Math.max(0, boost - dt * 2.2);
  bloom.strength = 0.42 + boost;
}
// ---------- Brahmastra: drawn textures (a yantra seal, streaked light, a banded shock dome) instead of plain glow ----------
function canvasTex(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const mandalaT = canvasTex(512, (g, S) => {
  g.translate(S / 2, S / 2);
  g.strokeStyle = g.fillStyle = '#fff';
  g.lineCap = 'round';
  const circ = (r, w) => {
    g.lineWidth = w;
    g.beginPath();
    g.arc(0, 0, r, 0, 7);
    g.stroke();
  };
  circ(246, 5);
  circ(232, 2);
  circ(168, 3);
  circ(96, 3);
  circ(40, 4);
  for (let i = 0; i < 48; i++) {
    g.save();
    g.rotate((i / 48) * 6.283);
    g.fillRect(-1.5, -230, 3, i % 4 ? 8 : 18);
    g.restore();
  }
  for (const [n, r0, r1, w] of [
    [16, 170, 228, 30],
    [8, 98, 166, 44],
  ])
    for (let i = 0; i < n; i++) {
      g.save();
      g.rotate((i / n) * 6.283);
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(0, -r0);
      g.quadraticCurveTo(w, -(r0 + r1) / 2, 0, -r1);
      g.quadraticCurveTo(-w, -(r0 + r1) / 2, 0, -r0);
      g.stroke();
      g.globalAlpha = 0.18;
      g.fill();
      g.restore();
    }
  for (let k = 0; k < 2; k++) {
    g.lineWidth = 3;
    g.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = k * Math.PI + i * 2.094 - 1.571;
      g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 94, Math.sin(a) * 94);
    }
    g.closePath();
    g.stroke();
  }
  for (let i = 0; i < 8; i++) {
    g.beginPath();
    g.arc(Math.cos(i * 0.785) * 68, Math.sin(i * 0.785) * 68, 5, 0, 7);
    g.fill();
  }
  g.beginPath();
  g.arc(0, 0, 10, 0, 7);
  g.fill();
});
const streakT = canvasTex(256, (g, S) => {
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * S,
      gr = g.createLinearGradient(0, 0, 0, S);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.1 + Math.random() * 0.8, `rgba(255,255,255,${0.15 + Math.random() * 0.7})`);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(x, 0, 1 + Math.random() * 5, S);
  }
});
streakT.wrapS = streakT.wrapT = THREE.RepeatWrapping;
const scorchT = canvasTex(256, (g, S) => {
  for (let i = 0; i < 900; i++) {
    const a = Math.random() * 6.283,
      r = Math.pow(Math.random(), 0.6) * 118;
    g.fillStyle = `rgba(0,0,0,${0.05 + (1 - r / 118) * 0.16})`;
    g.beginPath();
    g.arc(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r, 3 + Math.random() * 12, 0, 7);
    g.fill();
  }
});
const addMat = (map, color, o = {}) =>
  new THREE.MeshBasicMaterial({
    map,
    color,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
    ...o,
  });
const flat = (s) => new THREE.PlaneGeometry(s, s).rotateX(-Math.PI / 2),
  fx = [],
  tmpA = V3(),
  tmpB = V3();
const chargeA = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addMat(mandalaT, 0xffe9a0)),
  chargeB = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addMat(mandalaT, 0xffb050));
const chargeC = new THREE.Mesh(flat(1), addMat(mandalaT, 0xffc060));
chargeA.visible = chargeB.visible = chargeC.visible = false;
scene.add(chargeA, chargeB, chargeC);
function armBrahma(s) {
  // a spinning seal at the arrowhead and a streaked ribbon behind it
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), addMat(mandalaT, 0xffe9a0));
  disc.name = 'disc';
  disc.position.z = 0.9;
  s.g.add(disc);
  s.disc = disc;
  s.hist = [];
  const N = 28,
    g = new THREE.BufferGeometry(),
    uv = [],
    idx = [];
  for (let i = 0; i < N; i++) uv.push(0, (i / (N - 1)) * 3, 1, (i / (N - 1)) * 3);
  for (let i = 0; i < N - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  s.trail = new THREE.Mesh(g, addMat(streakT, 0xffd27a));
  s.trail.frustumCulled = false;
  scene.add(s.trail);
}
// the streak behind a plain arrow: its colour, half-width and length (in frames of travel). Faint at dusk; a level in daylight makes it stronger
const STREAK = { color: 0x8a7a62, tw: 0.025, hl: 4 };
function armStreak(s) {
  const N = 28,
    g = new THREE.BufferGeometry(),
    uv = [],
    idx = [];
  for (let i = 0; i < N; i++) uv.push(0, (i / (N - 1)) * 3, 1, (i / (N - 1)) * 3);
  for (let i = 0; i < N - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  s.trail = new THREE.Mesh(g, addMat(streakT, STREAK.color));
  s.trail.frustumCulled = false;
  scene.add(s.trail);
  s.hist = [];
  s.ribbon = true;
  s.tw = STREAK.tw;
  s.hl = STREAK.hl;
} // a short faint streak behind a plain arrow, tapering to nothing
function trailUpdate(s) {
  const N = 28,
    HL = s.hl || N,
    h = s.hist,
    pa = s.trail.geometry.attributes.position;
  {
    const q = s.g.position.clone();
    if (s.helix) q.addScaledVector(s.side, Math.sin(s.t * 18) * 0.2).addScaledVector(UP, Math.cos(s.t * 18) * 0.2);
    h.unshift(q);
  }
  if (h.length > HL) h.pop();
  for (let i = 0; i < N; i++) {
    const k = Math.min(i, h.length - 1),
      p = h[k];
    tmpA.copy(h[Math.max(0, k - 1)]).sub(h[Math.min(h.length - 1, k + 1)]);
    tmpB.copy(cam.position).sub(p);
    tmpA
      .cross(tmpB)
      .normalize()
      .multiplyScalar((s.tw || 0.6) * Math.max(0, 1 - i / HL));
    pa.setXYZ(i * 2, p.x - tmpA.x, p.y - tmpA.y, p.z - tmpA.z);
    pa.setXYZ(i * 2 + 1, p.x + tmpA.x, p.y + tmpA.y, p.z + tmpA.z);
  }
  pa.needsUpdate = true;
}
const domeMat = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
    uniforms: { uT: { value: 0 }, uA: { value: 1 } },
    vertexShader:
      'varying vec3 vN, vV, vP; void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader:
      'uniform float uT, uA; varying vec3 vN, vV, vP; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.6); float a = atan(vP.z, vP.x); float bands = 0.5 + 0.5 * sin(vP.y * 30.0 - uT * 16.0 + sin(a * 9.0) * 1.6); float cells = 0.5 + 0.5 * sin(a * 24.0 + vP.y * 9.0); vec3 c = vec3(1.0, 0.78, 0.36) * (f * 1.5 + bands * 0.5 * (0.25 + f) + cells * 0.12); gl_FragColor = vec4(c * uA, 1.0); }',
  });
function brahmaHit(p) {
  const at = (m, y) => {
    m.position.set(p.x, y, p.z);
    scene.add(m);
    return m;
  };
  const seal = at(new THREE.Mesh(flat(1), addMat(mandalaT, 0xffd27a)), 0.07),
    seal2 = at(new THREE.Mesh(flat(1), addMat(mandalaT, 0xfff2c0)), 0.09);
  const pillar = at(new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.8, 34, 40, 1, true), addMat(streakT, 0xffe2a0)), 17),
    core = at(new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.85, 34, 20, 1, true), addMat(streakT, 0xffffff)), 17);
  const dome = at(new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, 6.283, 0, Math.PI / 2), domeMat()), 0);
  const scorch = at(
    new THREE.Mesh(flat(12), new THREE.MeshBasicMaterial({ map: scorchT, transparent: true, depthWrite: false, opacity: 0, fog: false })),
    0.05,
  );
  puff(p, 0xfff2c0, 220, 14, 1.4, 1);
  puff(p, 0xffb040, 120, 6, 1.9, -1);
  ring(p, 6, 0xfff2c0, 0.5);
  flash(p, 0xfff0c0, 200);
  shake = 1;
  // the hit freezes for a beat, the screen whites out, then a second shockwave follows
  for (const d of dummies) {
    if (d.flung || d.dead) continue;
    tmpA.copy(d.g.position).sub(p).setY(0);
    if (tmpA.length() < 9) fling(d, tmpA.normalize(), 9, 12);
  }
  slowT = 0.32;
  boost = 1.7;
  {
    const f = $('flash');
    f.style.transition = 'none';
    f.style.opacity = 0.85;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        f.style.transition = 'opacity .8s';
        f.style.opacity = 0;
      }),
    );
  }
  const orbs = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.283,
      m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), addMat(mandalaT, 0xffd27a));
    m.position.set(p.x + Math.cos(a) * 6, 1.2, p.z + Math.sin(a) * 6);
    m.lookAt(p.x, 1.2, p.z);
    scene.add(m);
    orbs.push(m);
  }
  let u = 0,
    pulsed = false;
  fx.push((dt) => {
    u += dt;
    orbs.forEach((m, i) => {
      m.position.y = 1.2 + u * 2.4;
      m.rotateZ(dt * (i % 2 ? 2 : -2));
      m.material.opacity = Math.max(0, 1 - u / 2.4);
      m.scale.setScalar(Math.min(1, u * 5));
    });
    if (u < 2.2) {
      const a = Math.random() * 6.283,
        r = Math.random() * 8;
      puff(tmpA.set(p.x + Math.cos(a) * r, 0.2, p.z + Math.sin(a) * r), 0xffd27a, 3, 1.5, 1.4, -3.5);
    }
    if (!pulsed && u > 0.45) {
      pulsed = true;
      ring(p, 16, 0xffc060, 0.95);
      ring(p, 10, 0xfff2c0, 0.6);
      puff(p, 0xfff2c0, 180, 22, 1.1, 2);
      flash(p, 0xffe0a0, 180);
      shake = 0.8;
    }
    if (u > 2.5) {
      orbs.forEach((m) => {
        scene.remove(m);
        m.geometry.dispose();
        m.material.dispose();
      });
      return false;
    }
    return true;
  });
  let t = 0;
  fx.push((dt) => {
    t += dt;
    const grow = 1 - (1 - Math.min(1, t / 0.45)) ** 3,
      fade = t < 2.2 ? 1 : Math.max(0, 1 - (t - 2.2) / 1.3);
    seal.scale.setScalar(15 * grow);
    seal.rotation.y += dt * 0.6;
    seal.material.opacity = fade;
    seal2.scale.setScalar(7.5 * grow);
    seal2.rotation.y -= dt * 1.3;
    seal2.material.opacity = fade;
    const pf = Math.max(0, 1 - t / 1.8);
    pillar.scale.set(0.2 + pf * 1.2, 1, 0.2 + pf * 1.2);
    pillar.material.opacity = pf;
    pillar.rotation.y += dt * 2;
    core.scale.set(pf, 1, pf);
    core.material.opacity = pf;
    dome.scale.setScalar(12 * (1 - (1 - Math.min(1, t / 0.6)) ** 2) + 0.01);
    dome.material.uniforms.uT.value = t;
    dome.material.uniforms.uA.value = Math.max(0, 1 - t / 0.85);
    scorch.material.opacity = Math.min(0.6, t * 2) * (t < 4 ? 1 : Math.max(0, 1 - (t - 4) / 3));
    if (t > 7) {
      for (const m of [seal, seal2, pillar, core, dome, scorch]) {
        scene.remove(m);
        m.geometry.dispose();
        m.material.dispose();
      }
      return false;
    }
    return true;
  });
}
// ---------- Nagastra: a serpent seal on the bow, an arrow wound in green energy, and a naga spirit that rises and strikes ----------
const scaleT = canvasTex(128, (g, S) => {
  g.fillStyle = '#1f6a2c';
  g.fillRect(0, 0, S, S);
  for (let r = -1; r < 9; r++)
    for (let c = -1; c < 9; c++) {
      const x = c * 16 + (r % 2 ? 8 : 0),
        y = r * 16;
      const gr = g.createLinearGradient(0, y, 0, y + 22);
      gr.addColorStop(0, '#9af07a');
      gr.addColorStop(0.55, '#3fae4a');
      gr.addColorStop(1, '#14501f');
      g.fillStyle = gr;
      g.strokeStyle = '#0a2c12';
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + 9, y + 6, x + 8, y + 22);
      g.quadraticCurveTo(x - 1, y + 16, x - 8, y + 22);
      g.quadraticCurveTo(x - 9, y + 6, x, y);
      g.fill();
      g.stroke();
    }
});
scaleT.wrapS = scaleT.wrapT = THREE.RepeatWrapping;
const nagaT = canvasTex(512, (g, S) => {
  g.translate(S / 2, S / 2);
  g.strokeStyle = g.fillStyle = '#fff';
  g.lineCap = 'round';
  const circ = (r, w) => {
    g.lineWidth = w;
    g.beginPath();
    g.arc(0, 0, r, 0, 7);
    g.stroke();
  };
  circ(248, 4);
  circ(196, 2.5);
  circ(100, 3);
  circ(34, 3);
  for (let i = 0; i < 44; i++) {
    g.save();
    g.rotate((i / 44) * 6.283);
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-13, -242);
    g.quadraticCurveTo(0, -196, 13, -242);
    g.stroke();
    g.restore();
  } // a band of scales
  for (let k = 0; k < 2; k++) {
    g.save();
    g.rotate(k * Math.PI); // two serpents chasing each other round the ring
    for (let q = 0; q < 46; q++) {
      const a = (q / 46) * 2.75;
      g.beginPath();
      g.arc(Math.cos(a) * 150, Math.sin(a) * 150, 15 - q * 0.27, 0, 7);
      g.fill();
    }
    g.beginPath();
    g.ellipse(150, -14, 26, 34, 0, 0, 7);
    g.fill();
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(146, -46);
    g.lineTo(140, -70);
    g.moveTo(146, -46);
    g.lineTo(156, -68);
    g.stroke();
    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    g.arc(140, -20, 4.5, 0, 7);
    g.arc(160, -20, 4.5, 0, 7);
    g.fill();
    g.globalCompositeOperation = 'source-over';
    g.restore();
  }
  for (let i = 0; i < 8; i++) {
    g.save();
    g.rotate((i / 8) * 6.283);
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(0, -38);
    g.quadraticCurveTo(24, -66, 0, -96);
    g.quadraticCurveTo(-24, -66, 0, -38);
    g.stroke();
    g.globalAlpha = 0.2;
    g.fill();
    g.restore();
  }
  g.beginPath();
  g.arc(0, 0, 12, 0, 7);
  g.fill();
});
const TS = 8;
function makeTube(N, mat) {
  const g = new THREE.BufferGeometry(),
    uv = [],
    idx = [];
  for (let i = 0; i < N; i++) for (let k = 0; k <= TS; k++) uv.push((k / TS) * 3, i * 0.22);
  for (let i = 0; i < N - 1; i++)
    for (let k = 0; k < TS; k++) {
      const a = i * (TS + 1) + k,
        b = a + TS + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * (TS + 1) * 3), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, mat);
  m.frustumCulled = false;
  m.userData.N = N;
  scene.add(m);
  return m;
}
const tT = V3(),
  tN = V3(),
  tB = V3();
function setTube(m, pts, rad) {
  const N = m.userData.N,
    pa = m.geometry.attributes.position,
    L = pts.length;
  for (let i = 0; i < N; i++) {
    const k = Math.min(i, L - 1),
      p = pts[k];
    tT.copy(pts[Math.max(0, k - 1)]).sub(pts[Math.min(L - 1, k + 1)]);
    if (tT.lengthSq() < 1e-8) tT.set(0, 0, 1);
    tT.normalize();
    tN.crossVectors(tT, UP);
    if (tN.lengthSq() < 1e-4) tN.set(1, 0, 0);
    tN.normalize();
    tB.crossVectors(tT, tN);
    const r = rad(i);
    for (let q = 0; q <= TS; q++) {
      const a = (q / TS) * 6.283,
        c = Math.cos(a) * r,
        d = Math.sin(a) * r;
      pa.setXYZ(i * (TS + 1) + q, p.x + tN.x * c + tB.x * d, p.y + tN.y * c + tB.y * d, p.z + tN.z * c + tB.z * d);
    }
  }
  pa.needsUpdate = true;
}
// charge: two serpent seals turn on the bow, like the Brahmastra's but in the naga's sign
const nagaA = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addMat(nagaT, 0x8aff6a)),
  nagaB = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addMat(nagaT, 0xd8ffb0));
nagaA.visible = nagaB.visible = false;
scene.add(nagaA, nagaB);
// flight: an ordinary arrow, wound in a helix of green scaled light (no snake on the shaft)
function armNaga(s) {
  const N = 28,
    g = new THREE.BufferGeometry(),
    uv = [],
    idx = [];
  for (let i = 0; i < N; i++) uv.push(0, (i / (N - 1)) * 5, 1, (i / (N - 1)) * 5);
  for (let i = 0; i < N - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  s.trail = new THREE.Mesh(g, addMat(scaleT, 0x9aff7a));
  s.trail.frustumCulled = false;
  scene.add(s.trail);
  s.hist = [];
  s.ribbon = s.helix = true;
  s.tw = 0.2;
}
const muzzleGeo = new THREE.RingGeometry(0.82, 1, 40);
function spray(p, dir, color, n, speed, spread, life) {
  tc.set(color);
  for (let i = 0; i < n; i++) {
    const k = pi++ % PN,
      sp = speed * (0.4 + Math.random() * 0.6);
    ppos[k * 3] = p.x;
    ppos[k * 3 + 1] = p.y;
    ppos[k * 3 + 2] = p.z;
    pvel[k * 3] = dir.x * sp + (Math.random() - 0.5) * spread;
    pvel[k * 3 + 1] = dir.y * sp + (Math.random() - 0.5) * spread;
    pvel[k * 3 + 2] = dir.z * sp + (Math.random() - 0.5) * spread;
    pbase[k * 3] = tc.r;
    pbase[k * 3 + 1] = tc.g;
    pbase[k * 3 + 2] = tc.b;
    plife[k] = pmax[k] = life * (0.6 + Math.random() * 0.4);
    pgrav[k] = 0;
  }
}
function nagaLaunch(p, dir) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addMat(nagaT, 0xd8ffb0));
  m.position.copy(p).addScaledVector(dir, 0.35);
  m.quaternion.setFromUnitVectors(V3(0, 0, 1), dir);
  scene.add(m);
  let t = 0;
  fx.push((dt) => {
    t += dt;
    const u = t / 0.28;
    m.scale.setScalar(1.5 + u * 1.6);
    m.rotateZ(dt * 9);
    m.material.opacity = 1 - u;
    if (u >= 1) {
      scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
      return false;
    }
    return true;
  });
  spray(p, dir, 0x9aff6a, 24, 10, 2, 0.32);
}
// strike: the arrow lands, a seal opens under the target, and a tall glowing naga spirit rises beyond it, rears, and strikes down
function spiritHead(mat) {
  const g = new THREE.Group(),
    fang = new THREE.MeshBasicMaterial({ color: 0xeaffd0 });
  const m = (geo, p, sc) => {
    const x = new THREE.Mesh(geo, mat);
    x.position.set(...p);
    x.scale.set(...sc);
    g.add(x);
    return x;
  };
  m(new THREE.SphereGeometry(1, 20, 14), [0, 0.02, -0.22], [0.62, 0.11, 0.72]);
  m(new THREE.SphereGeometry(1, 16, 12), [0, 0.04, 0.3], [0.2, 0.15, 0.36]);
  m(new THREE.SphereGeometry(1, 14, 10), [0, -0.1, 0.28], [0.17, 0.05, 0.3]);
  for (const s of [-1, 1]) {
    const e = glow(0xfff7a0, 0.42);
    e.position.set(s * 0.13, 0.16, 0.38);
    g.add(e);
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.2, 6), fang);
    f.position.set(s * 0.09, -0.12, 0.5);
    f.rotation.x = Math.PI;
    g.add(f);
  }
  {
    const mk = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), addMat(nagaT, 0xd8ffb0));
    mk.position.set(0, 0.14, -0.26);
    mk.rotation.x = -Math.PI / 2;
    g.add(mk);
  } // the seal marked on the hood
  return g;
}
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
function nagaHit(p, dir) {
  const ty = Math.max(0.9, Math.min(1.5, p.y)),
    d = V3(dir.x, 0, dir.z);
  if (d.lengthSq() < 1e-4) d.set(1, 0, 0);
  d.normalize();
  const side = V3(-d.z, 0, d.x),
    B = V3(p.x + d.x * 1.15, 0, p.z + d.z * 1.15),
    Hs = V3(p.x, ty, p.z);
  const seal = new THREE.Mesh(flat(1), addMat(nagaT, 0x8aff6a));
  seal.position.set(p.x, 0.07, p.z);
  scene.add(seal);
  const bodyM = addMat(scaleT, 0x8dff96),
    auraM = addMat(null, 0x2f9a52, { opacity: 0.3 }),
    body = makeTube(48, bodyM),
    aura = makeTube(48, auraM),
    head = spiritHead(bodyM);
  scene.add(head);
  for (const dm of dummies) if (!dm.flung && Math.hypot(dm.g.position.x - p.x, dm.g.position.z - p.z) < 1) dm.hold = 1.7;
  puff(p, 0x8aff5a, 14, 2.2, 0.45, 0);
  ring(p, 0.9, 0x8aff5a, 0.3);
  const cv = new THREE.CatmullRomCurve3([V3(), V3(), V3(), V3(), V3()]),
    pts = Array.from({ length: 48 }, () => V3()),
    H = V3(),
    Nk = V3();
  let t = 0,
    struck = false;
  fx.push((dt) => {
    t += dt;
    const r0 = clamp01(t / 0.5),
      rise = 1 - (1 - r0) ** 3,
      st = clamp01((t - 0.8) / 0.15),
      strike = st * st,
      rec = clamp01((t - 0.98) / 0.3),
      gone = clamp01((t - 1.3) / 0.45),
      sway = Math.sin(t * 8) * 0.2 * (1 - strike) * rise;
    H.set(B.x - d.x * 0.3 + side.x * sway, 3.4 * rise, B.z - d.z * 0.3 + side.z * sway).lerp(Hs, strike * (1 - rec * 0.3));
    Nk.copy(H)
      .addScaledVector(d, 0.5)
      .setY(H.y + 0.28 * (1 - strike) + 0.3 * strike);
    cv.points[0].set(B.x, -0.5, B.z);
    cv.points[1].set(B.x + d.x * 0.5 - side.x * sway, 0.95 * rise, B.z + d.z * 0.5 - side.z * sway);
    cv.points[2].set(B.x + d.x * 0.15 + side.x * sway * 0.6, (2.2 - strike * 0.7) * rise, B.z + d.z * 0.15 + side.z * sway * 0.6);
    cv.points[3].copy(Nk);
    cv.points[4].copy(H);
    for (let j = 0; j < 48; j++) cv.getPoint(1 - j / 47, pts[j]);
    const show = (1 - gone) * Math.min(1, t * 6),
      rr = (i) => (0.2 - (0.1 * i) / 48) * (1 - gone * 0.7) * Math.min(1, t * 5);
    setTube(body, pts, rr);
    setTube(aura, pts, (i) => rr(i) * 1.8);
    bodyM.opacity = show;
    auraM.opacity = 0.3 * show;
    scaleT.offset.y -= dt * 0.8;
    head.position.copy(H);
    head.lookAt(tmpA.copy(H).multiplyScalar(2).sub(Nk));
    head.rotateX(-0.3 * (1 - strike) + 0.45 * strike);
    head.scale.setScalar((1 - gone * 0.5) * Math.min(1, t * 4) + 0.001);
    head.children.forEach((c) => {
      if (c.isSprite) c.material.opacity = show;
    });
    seal.scale.setScalar(2.8 * (1 - (1 - clamp01(t / 0.25)) ** 2));
    seal.rotation.y += dt * 2.4;
    seal.material.opacity = 1 - gone;
    if (t < 0.55 && Math.random() < 0.7)
      puff(tmpA.set(B.x + (Math.random() - 0.5) * 0.8, 0.1, B.z + (Math.random() - 0.5) * 0.8), 0x9aff6a, 2, 1.2, 0.6, -3);
    if (!struck && t > 0.94) {
      struck = true;
      puff(Hs, 0xb8ff7a, 50, 6.5, 0.6, 5);
      puff(Hs, 0xb060ff, 18, 3, 0.7, 0);
      ring(Hs, 2.2, 0x9aff6a, 0.4);
      flash(Hs, 0x80ff60, 45);
      shake = 0.2;
    }
    if (gone > 0 && gone < 1) puff(pts[(Math.random() * 48) | 0], 0x9aff6a, 4, 0.7, 0.55, -2);
    if (t > 1.8) {
      scene.remove(body, aura, head, seal);
      for (const m of [body, aura, seal]) m.geometry.dispose();
      bodyM.dispose();
      auraM.dispose();
      seal.material.dispose();
      return false;
    }
    return true;
  });
}
// ---------- Agneyastra: Agni's seal on the bow, a burning arrow, and a blossom of fire that leaves the ground alight ----------
const agniT = canvasTex(512, (g, S) => {
  g.translate(S / 2, S / 2);
  g.strokeStyle = g.fillStyle = '#fff';
  g.lineCap = g.lineJoin = 'round';
  const circ = (r, w) => {
    g.lineWidth = w;
    g.beginPath();
    g.arc(0, 0, r, 0, 7);
    g.stroke();
  };
  circ(196, 4);
  circ(184, 2);
  circ(112, 3);
  for (let i = 0; i < 24; i++) {
    g.save();
    g.rotate((i / 24) * 6.283);
    const h = i % 2 ? 44 : 58;
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(-15, -198);
    g.bezierCurveTo(-22, -214, 6, -222, 2, -198 - h);
    g.bezierCurveTo(16, -224, 22, -212, 15, -198);
    g.stroke();
    g.globalAlpha = 0.25;
    g.fill();
    g.restore();
  } // a rim of flame tongues
  for (let i = 0; i < 12; i++) {
    g.save();
    g.rotate((i / 12) * 6.283);
    g.lineWidth = i % 3 ? 2 : 4;
    g.beginPath();
    g.moveTo(0, -118);
    g.lineTo(0, -178);
    g.stroke();
    g.restore();
  }
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(-88, -52);
  g.lineTo(88, -52);
  g.lineTo(0, 100);
  g.closePath();
  g.stroke();
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(-58, -34);
  g.lineTo(58, -34);
  g.lineTo(0, 66);
  g.closePath();
  g.stroke(); // the downward triangle of fire
  g.beginPath();
  g.moveTo(0, 34);
  g.bezierCurveTo(-30, 6, -8, -10, -2, -26);
  g.bezierCurveTo(8, -6, 30, 6, 0, 34);
  g.fill();
});
const flameT = canvasTex(256, (g, S) => {
  const tongue = (x, w, top, c0, c1, c2) => {
    const gr = g.createLinearGradient(0, S, 0, top);
    gr.addColorStop(0, c0);
    gr.addColorStop(0.45, c1);
    gr.addColorStop(1, c2);
    g.fillStyle = gr;
    const sw = (Math.random() - 0.5) * w;
    g.beginPath();
    g.moveTo(x - w, S);
    g.bezierCurveTo(x - w * 1.25, S * 0.62, x - w * 0.2 + sw, top + (S - top) * 0.35, x + sw * 0.6, top);
    g.bezierCurveTo(x + w * 0.5, top + (S - top) * 0.4, x + w * 1.25, S * 0.62, x + w, S);
    g.fill();
  };
  for (let i = 0; i < 9; i++)
    tongue(20 + Math.random() * 216, 22 + Math.random() * 26, Math.random() * 110, 'rgba(255,150,40,.95)', 'rgba(230,70,15,.75)', 'rgba(150,20,5,0)');
  for (let i = 0; i < 7; i++)
    tongue(
      40 + Math.random() * 176,
      10 + Math.random() * 16,
      70 + Math.random() * 90,
      'rgba(255,246,190,1)',
      'rgba(255,190,60,.85)',
      'rgba(255,120,20,0)',
    );
});
const agniA = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addMat(agniT, 0xff8a2a)),
  agniB = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addMat(agniT, 0xffe0a0));
agniA.visible = agniB.visible = false;
scene.add(agniA, agniB);
function armAgni(s) {
  const N = 28,
    g = new THREE.BufferGeometry(),
    uv = [],
    idx = [];
  for (let i = 0; i < N; i++) uv.push(0, 1 - i / (N - 1), 1, 1 - i / (N - 1));
  for (let i = 0; i < N - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  s.trail = new THREE.Mesh(g, addMat(flameT, 0xffffff));
  s.trail.frustumCulled = false;
  scene.add(s.trail);
  s.hist = [];
  s.ribbon = true;
  s.tw = 0.34;
}
function agniLaunch(p, dir) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addMat(agniT, 0xffd08a));
  m.position.copy(p).addScaledVector(dir, 0.35);
  m.quaternion.setFromUnitVectors(V3(0, 0, 1), dir);
  scene.add(m);
  let t = 0;
  fx.push((dt) => {
    t += dt;
    const u = t / 0.28;
    m.scale.setScalar(1.5 + u * 1.7);
    m.rotateZ(-dt * 8);
    m.material.opacity = 1 - u;
    if (u >= 1) {
      scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
      return false;
    }
    return true;
  });
  spray(p, dir, 0xff8a20, 26, 10, 2.4, 0.34);
  spray(p, dir, 0xffe07a, 10, 15, 0.9, 0.24);
}
const petalGeo = (w, l) => new THREE.PlaneGeometry(w, l).translate(0, l / 2, 0),
  emberGlowT = glow(0xffffff, 1).material.map;
function agniHit(p) {
  // the seal stamps down, petals of flame open outward like a lotus, then a ring of low fire burns on
  const grp = new THREE.Group();
  grp.position.set(p.x, 0, p.z);
  scene.add(grp);
  zones.push({ x: p.x, z: p.z, r: 2.3, end: T + 3.1 });
  shove(p, 2.6, 3.5);
  const pm = addMat(flameT, 0xffffff),
    fm = addMat(flameT, 0xffffff),
    petals = [],
    fires = [];
  for (const [n, w, l, off, z0] of [
    [10, 1.0, 2.5, 0, 0.3],
    [6, 0.8, 1.6, 0.5, 0.1],
  ])
    for (let i = 0; i < n; i++) {
      const piv = new THREE.Object3D();
      piv.rotation.order = 'YXZ';
      piv.rotation.y = ((i + off) / n) * 6.283;
      piv.position.y = 0.1;
      const m = new THREE.Mesh(petalGeo(w, l), pm);
      m.position.z = z0;
      piv.add(m);
      grp.add(piv);
      petals.push([piv, off ? 0.85 : 1]);
    }
  for (const [n, r, w, h] of [
    [12, 1.75, 0.8, 1.0],
    [6, 0.85, 0.7, 0.8],
  ])
    for (let i = 0; i < n; i++) {
      const piv = new THREE.Object3D();
      piv.rotation.order = 'YXZ';
      piv.rotation.y = ((i + (r < 1 ? 0.5 : 0)) / n) * 6.283 + Math.random() * 0.2;
      piv.rotation.x = 0.55;
      piv.position.y = 0.05;
      const m = new THREE.Mesh(petalGeo(w, h), fm);
      m.position.z = r;
      m.scale.x = Math.random() < 0.5 ? -1 : 1;
      piv.add(m);
      grp.add(piv);
      fires.push([m, Math.random() * 6]);
    }
  const sealM = addMat(agniT, 0xff9a3a),
    seal = new THREE.Mesh(flat(1), sealM);
  seal.position.y = 0.07;
  grp.add(seal);
  const glowM = addMat(emberGlowT, 0xff5a10),
    bed = new THREE.Mesh(flat(1), glowM);
  bed.position.y = 0.06;
  bed.scale.setScalar(5.2);
  grp.add(bed);
  const scM = new THREE.MeshBasicMaterial({ map: scorchT, transparent: true, depthWrite: false, opacity: 0, fog: false }),
    scorch = new THREE.Mesh(flat(4.8), scM);
  scorch.position.y = 0.05;
  grp.add(scorch);
  puff(p, 0xff6a1a, 70, 7, 0.8, 3);
  puff(p, 0xffd060, 30, 3.5, 0.7, -2.5);
  ring(p, 2.7, 0xff7a20, 0.4);
  flash(p, 0xff7a30, 60);
  shake = 0.2;
  let t = 0;
  fx.push((dt) => {
    t += dt;
    const open = 1 - (1 - clamp01(t / 0.35)) ** 3,
      pf = 1 - clamp01((t - 0.45) / 0.45),
      burn = clamp01((t - 0.25) / 0.3) * (1 - clamp01((t - 3.0) / 0.6)),
      end = clamp01((t - 3.2) / 0.6);
    pm.opacity = pf;
    for (const [piv, k] of petals) {
      piv.rotation.x = 0.2 + open * 1.08 * k;
      piv.scale.setScalar(0.25 + open * 0.75);
      piv.visible = pf > 0;
    }
    fm.opacity = burn;
    for (const [m, ph] of fires) {
      m.scale.y = 0.55 + 0.55 * Math.abs(Math.sin(t * 8 + ph)) + 0.15 * Math.sin(t * 23 + ph * 3);
      m.visible = burn > 0;
    }
    seal.scale.setScalar(3.4 + (1 - clamp01(t / 0.18)) * 1.6);
    seal.rotation.y -= dt * 0.9;
    sealM.opacity = (t < 0.5 ? 1 : 0.45 + 0.15 * Math.sin(t * 9)) * (1 - end);
    glowM.opacity = (0.25 + 0.5 * pf + 0.3 * burn * (0.8 + 0.2 * Math.sin(t * 13))) * (1 - end);
    scM.opacity = Math.min(0.55, t * 2) * (1 - clamp01((t - 3.4) / 0.9));
    if (burn > 0.3 && Math.random() < 0.8) {
      const a = Math.random() * 6.283,
        r = Math.random() * 1.9;
      puff(tmpA.set(p.x + Math.cos(a) * r, 0.2, p.z + Math.sin(a) * r), Math.random() < 0.7 ? 0xff8a20 : 0xffd060, 1, 0.5, 0.8, -2.6);
    }
    if (t > 4.3) {
      scene.remove(grp);
      grp.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
      });
      for (const m of [pm, fm, sealM, glowM, scM]) m.dispose();
      return false;
    }
    return true;
  });
}
// ---------- practice dummies: straw figures that can be shoved, set alight and thrown, so each weapon shows what it does ----------
const dummies = [],
  zones = [],
  strawC = new THREE.Color(0xc9a45a),
  charC = new THREE.Color(0x2a1a12);
function shove(p, r, power) {
  for (const d of dummies) {
    if (d.flung || d.dead) continue;
    tmpA.copy(d.g.position).sub(p).setY(0);
    const l = tmpA.length();
    if (l < r) {
      d.vel.addScaledVector(tmpA.normalize(), power * (1 - (l / r) * 0.6));
      d.wob = 1;
    }
  }
}
function fling(d, dir, sp, up) {
  if (d.br) {
    d.wob = 1;
    d.pw = -1;
    return;
  } // too heavy to be thrown: it only takes the blow
  d.flung = true;
  d.ft = 0;
  d.vel.set(dir.x * sp, up, dir.z * sp);
}
function dummyUpdate(dt) {
  for (let i = zones.length - 1; i >= 0; i--) if (T > zones[i].end) zones.splice(i, 1);
  for (const d of dummies) {
    const g = d.g;
    if (d.flung) {
      d.ft += dt;
      d.vel.y -= 11 * dt;
      g.position.addScaledVector(d.vel, dt);
      g.rotation.x += dt * 9;
      g.rotation.z += dt * 6;
      puff(tmpA.copy(g.position).setY(g.position.y + 1), 0xbfe6ff, 2, 0.6, 0.5, 0);
      if (d.ft > 2.6) {
        d.flung = false;
        g.position.copy(d.home);
        g.rotation.set(0, Math.atan2(-d.home.x, -d.home.z), 0);
        d.vel.set(0, 0, 0);
        d.wob = 0.6;
        puff(tmpA.copy(d.home).setY(1), 0xffe9c0, 14, 2, 0.4, 0);
      }
      continue;
    }
    if (d.hold > 0) {
      d.hold -= dt;
      d.vel.set(0, 0, 0);
      d.wob = Math.max(d.wob, 0.45);
      d.rest = 0;
    }
    g.position.addScaledVector(d.vel, dt);
    d.vel.multiplyScalar(Math.max(0, 1 - 4 * dt));
    d.rest = d.vel.lengthSq() > 0.05 ? 0 : d.rest + dt;
    if (d.rest > 2.2) g.position.lerp(d.home, Math.min(1, dt * 1.6));
    d.wob = Math.max(0, d.wob - dt * 1.4);
    {
      const wf = d.rig ? (d.br ? 0.06 : 0.25) : 1,
        wv = d.rig ? d.fw || 0 : d.wob;
      g.rotation.x = Math.sin(T * 21) * 0.2 * wv * wf;
      g.rotation.z = Math.cos(T * 17) * 0.14 * wv * wf;
    }
    const burning = zones.some((z) => Math.hypot(g.position.x - z.x, g.position.z - z.z) < z.r);
    d.char += ((burning ? 1 : 0) - d.char) * Math.min(1, dt * (burning ? 1.2 : 0.35));
    d.mat.color.lerpColors(d.base || strawC, charC, d.char);
    if (d.mat2) d.mat2.color.copy(d.mat.color);
    if (burning) {
      d.wob = Math.max(d.wob, 0.25);
      puff(
        tmpA.set(g.position.x + (Math.random() - 0.5) * 0.4, 0.5 + Math.random() * 1.2, g.position.z + (Math.random() - 0.5) * 0.4),
        Math.random() < 0.6 ? 0xff7a20 : 0xffd060,
        2,
        0.6,
        0.5,
        -3.5,
      );
    }
  }
}

// ---------- Vayavyastra: no arrow and no glow, just a widening gust that travels in a line and shoves whatever it crosses ----------
const crescentGeo = (() => {
  const pos = [],
    uv = [],
    idx = [],
    n = 18;
  for (let i = 0; i <= n; i++) {
    const a = -1.15 + (i / n) * 2.3,
      th = 0.22 * Math.cos(a * 1.25) + 0.02;
    pos.push(Math.sin(a), 0, Math.cos(a) * 0.5, Math.sin(a) * 0.93, 0, Math.cos(a) * 0.5 - th);
    uv.push(0, (i / n) * 2, 1, (i / n) * 2);
    if (i < n) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
})();
const band2 = (n, f) => {
  const pos = [],
    uv = [],
    idx = [];
  for (let i = 0; i <= n; i++) {
    const [a, b, v] = f(i / n);
    pos.push(...a, ...b);
    uv.push(0, v, 1, v);
    if (i < n) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
};
const swirlGeo = band2(48, (t) => {
  const a = t * 11,
    r = 1 - t * 0.85,
    w = 0.07 * (1 - t * 0.5);
  return [[Math.cos(a) * (r + w), Math.sin(a) * (r + w), 0], [Math.cos(a) * (r - w), Math.sin(a) * (r - w), 0], t * 3];
}); // air winding inward
const helixGeo = band2(64, (t) => {
  const a = t * 18.85,
    z = -t * 3.4;
  return [[Math.cos(a), Math.sin(a), z], [Math.cos(a), Math.sin(a), z - 0.2], t * 4];
}); // a rolling coil of air
const windSwM = addMat(streakT, 0xf2fff8),
  windSw = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(swirlGeo, windSwM);
    m.visible = false;
    scene.add(m);
    return m;
  });
const leafGeo = new THREE.PlaneGeometry(0.15, 0.08);
function windGust(o, dir0) {
  // a blast of air: a ring off the bow, a rolling coil with crescents ahead of it, leaves and dust carried along, the ground combed flat beneath
  const dir = V3(dir0.x, 0, dir0.z).normalize(),
    side = V3(-dir.z, 0, dir.x),
    q = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), dir),
    qz = new THREE.Quaternion(),
    Z = V3(0, 0, 1);
  const mat = addMat(streakT, 0xf2fff8),
    hm = addMat(streakT, 0xdff6ee),
    gm = addMat(streakT, 0xfff4dc),
    rm = addMat(null, 0xffffff),
    lm = [0x8fb85a, 0xd8b84a].map((c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, transparent: true, fog: false }));
  const arcs = [],
    leaves = [],
    done = new Set(),
    all = [];
  let d = 0,
    t = 0,
    tail = 0;
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(crescentGeo, mat);
    m.quaternion.copy(q);
    m.userData = { lag: i * 0.55, y: 0.25 + ((i * 0.37) % 1.7), w: 0.65 + (i % 3) * 0.2 };
    arcs.push(m);
  }
  const helix = [0, 1].map((i) => {
    const m = new THREE.Mesh(helixGeo, hm);
    m.userData.ph = i * Math.PI;
    return m;
  });
  const ground = new THREE.Mesh(flat(1), gm);
  ground.quaternion.copy(q);
  const ringM = new THREE.Mesh(muzzleGeo, rm);
  ringM.quaternion.copy(q);
  ringM.position.copy(o).addScaledVector(dir, 0.3);
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(leafGeo, lm[i % 2]);
    m.userData = { off: Math.random() * 3, lat: (Math.random() - 0.5) * 1.8, h: 0.3 + Math.random() * 1.5, ph: Math.random() * 6 };
    m.rotation.set(Math.random() * 6, Math.random() * 6, 0);
    leaves.push(m);
  }
  all.push(arcs[0], arcs[2], arcs[4], ...leaves);
  all.forEach((m) => scene.add(m)); // a few faint crescents of air; the coil, ground strip and ring stay off
  fx.push((dt) => {
    t += dt;
    if (d < 14) d += 30 * dt;
    else tail += dt;
    const run = d + tail * 7,
      w = 0.9 + d * 0.13,
      fade = d < 14 ? 1 - (d / 14) ** 2 * 0.5 : Math.max(0, 0.5 - tail * 1.3);
    mat.opacity = fade * 0.55;
    hm.opacity = fade * 0.65;
    gm.opacity = fade * 0.45;
    lm[0].opacity = lm[1].opacity = Math.min(1, fade * 2.5);
    for (const m of arcs) {
      const u = m.userData,
        a = run - u.lag;
      m.visible = a > 0;
      m.position.copy(o).setY(u.y).addScaledVector(dir, a);
      m.scale.set(w * u.w * (1 + tail * 1.6), 1, 1 + d * 0.12);
    }
    for (const m of helix) {
      m.position
        .copy(o)
        .setY(1.0)
        .addScaledVector(dir, run - 0.4);
      m.quaternion.copy(q).multiply(qz.setFromAxisAngle(Z, t * 15 + m.userData.ph));
      m.scale.set(w * 0.75, 0.75 + d * 0.02, Math.min(1, d / 4));
    }
    ground.position
      .copy(o)
      .setY(0.05)
      .addScaledVector(dir, d / 2);
    ground.scale.set(w * 1.9, 1, Math.max(0.01, d));
    ringM.visible = t < 0.25;
    if (ringM.visible) {
      const u = t / 0.25;
      ringM.scale.setScalar(0.2 + u * 1.5);
      rm.opacity = 1 - u;
    }
    for (const m of leaves) {
      const u = m.userData,
        a = run * 0.9 - u.off;
      m.visible = a > 0;
      m.position
        .copy(o)
        .addScaledVector(dir, a)
        .addScaledVector(side, u.lat * w * 0.6 + Math.sin(t * 6 + u.ph) * 0.3)
        .setY(u.h + Math.sin(t * 8 + u.ph) * 0.3);
      m.rotation.x += dt * 10;
      m.rotation.z += dt * 7;
    }
    if (d < 14) {
      for (let i = 0; i < 10; i++)
        puff(
          tmpA
            .copy(o)
            .setY(0.1 + Math.random() * 1.3)
            .addScaledVector(dir, d - Math.random() * 1.2)
            .addScaledVector(side, (Math.random() - 0.5) * 2 * w),
          i % 5 ? 0xd8c8a0 : 0x9ac870,
          1,
          1.8,
          0.55,
          -1,
        );
      for (const dm of dummies) {
        if (dm.flung || done.has(dm)) continue;
        tmpA.copy(dm.g.position).sub(o);
        const al = tmpA.dot(dir),
          lat = Math.abs(tmpA.dot(side));
        if (al > 0.3 && al < d && al > d - 3 && lat < w + 0.3) {
          done.add(dm);
          dm.vel.addScaledVector(dir, 12);
          dm.wob = 1;
          puff(tmpB.copy(dm.g.position).setY(1), 0xf2fff8, 10, 3, 0.35, 0);
          puff(tmpB, 0x9ac870, 5, 2.4, 0.5, 2);
        }
      }
      for (const tg of targets) {
        if (done.has(tg)) continue;
        tmpA.copy(tg.c).sub(o);
        const al = tmpA.dot(dir);
        if (al > 0 && al < d && Math.abs(tmpA.dot(side)) < w + 0.5) {
          done.add(tg);
          tg.wob = 1;
        }
      }
    }
    if (fade <= 0) {
      all.forEach((m) => scene.remove(m));
      ground.geometry.dispose();
      for (const m of [mat, hm, gm, rm, ...lm]) m.dispose();
      return false;
    }
    return true;
  });
  spray(o, dir, 0xf2fff8, 18, 16, 3, 0.25);
  tmpA.copy(dir).multiplyScalar(-1);
  spray(o, tmpA, 0xd8c8a0, 8, 3, 2, 0.4);
}

// ---------- Manavastra: a point of light, an instant line, and the one enemy it touches is hurled off the field ----------
const manaRing = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48), addMat(null, 0xcfeaff)),
  manaPt = glow(0xdff2ff, 1);
manaRing.visible = manaPt.visible = false;
scene.add(manaRing, manaPt);
const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
const manaT = canvasTex(512, (g, S) => {
  g.translate(S / 2, S / 2);
  g.strokeStyle = g.fillStyle = '#fff';
  g.lineCap = 'round';
  for (const [r, w] of [
    [244, 3],
    [204, 1.6],
    [122, 2.2],
    [58, 1.8],
  ]) {
    g.lineWidth = w;
    g.beginPath();
    g.arc(0, 0, r, 0, 7);
    g.stroke();
  }
  for (let i = 0; i < 72; i++) {
    g.save();
    g.rotate((i / 72) * 6.283);
    g.fillRect(-0.9, -238, 1.8, i % 6 ? 16 : 30);
    g.restore();
  }
  for (let i = 0; i < 12; i++) {
    g.save();
    g.rotate((i / 12) * 6.283);
    g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(0, -124);
    g.quadraticCurveTo(17, -164, 0, -202);
    g.quadraticCurveTo(-17, -164, 0, -124);
    g.stroke();
    g.globalAlpha = 0.14;
    g.fill();
    g.restore();
  }
  for (let i = 0; i < 8; i++) {
    g.beginPath();
    g.arc(Math.cos(i * 0.785) * 90, Math.sin(i * 0.785) * 90, 4, 0, 7);
    g.fill();
  }
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(0, -40);
  g.lineTo(35, 20);
  g.lineTo(-35, 20);
  g.closePath();
  g.stroke();
  g.beginPath();
  g.arc(0, 0, 7, 0, 7);
  g.fill();
});
const manaFx = {
  rings: [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.93, 1, 56), addMat(null, 0xcfeaff));
    m.visible = false;
    scene.add(m);
    return m;
  }),
  seal: new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addMat(manaT, 0xbfe0ff)),
  orbs: [0, 1, 2].map(() => glow(0xe8f6ff, 0.2)),
  thread: new THREE.Mesh(beamGeo, addMat(null, 0xdff2ff)),
  brow: glow(0xdff2ff, 0.3),
  landed: [false, false, false],
};
for (const o of [manaFx.seal, manaFx.thread, manaFx.brow, ...manaFx.orbs]) {
  o.visible = false;
  scene.add(o);
}
function manavaFire(o, dir) {
  const hx = dir.x,
    hz = dir.z,
    hl = Math.hypot(hx, hz) || 1;
  let best = 42,
    hitD = null,
    hitT = null;
  for (const d of dummies) {
    if (d.flung || d.dead) continue;
    const dx = d.g.position.x - o.x,
      dz = d.g.position.z - o.z,
      al = (dx * hx + dz * hz) / hl / hl,
      lat = Math.abs(dx * hz - dz * hx) / hl;
    if (al > 0.5 && al < best && lat < 0.5) {
      best = al;
      hitD = d;
      hitT = null;
    }
  }
  for (const t of targets) {
    const dn = dir.dot(t.n);
    if (dn > -0.05) continue;
    const tt = tmpA.copy(t.c).sub(o).dot(t.n) / dn;
    if (tt > 0.5 && tt < best && tmpB.copy(o).addScaledVector(dir, tt).distanceTo(t.c) < 0.7) {
      best = tt;
      hitT = t;
      hitD = null;
    }
  }
  const end = o.clone().addScaledVector(dir, best),
    q = new THREE.Quaternion().setFromUnitVectors(UP, dir),
    beams = [
      [0.03, 0xffffff, 1],
      [0.13, 0x8ac8ff, 0.5],
    ].map(([r, c, op]) => {
      const m = new THREE.Mesh(beamGeo, addMat(null, c, { opacity: op }));
      m.position.copy(o).lerp(end, 0.5);
      m.quaternion.copy(q);
      m.scale.set(r, best, r);
      m.userData.r = r;
      scene.add(m);
      return m;
    });
  let t = 0;
  fx.push((dt) => {
    t += dt;
    const u = t / 0.22;
    beams.forEach((m) => {
      m.scale.x = m.scale.z = m.userData.r * (1 + u * 1.5) * (1 - u);
    });
    if (u >= 1) {
      beams.forEach((m) => {
        scene.remove(m);
        m.material.dispose();
      });
      return false;
    }
    return true;
  });
  puff(o, 0xdff2ff, 10, 3, 0.25, 0);
  flash(end, 0xbfe6ff, 30);
  shake = 0.14;
  puff(end, 0xdff2ff, 26, 5, 0.4, 0);
  ring(end, 1.0, 0xcfeaff, 0.28);
  if (hitD) fling(hitD, dir, 17, 13);
  if (hitT) {
    hitT.wob = 1;
    hits++;
  }
}
// trail: [colour, particles per frame, life, speed, gravity]
const KINDS = [
  { name: 'Arrow', color: 0xffe9c0, rate: 0.34, speed: 34, grav: 5, hit: (p) => puff(p, 0xc8a878, 10, 2, 0.4, 4) },
  {
    name: 'Agneyastra · fire',
    color: 0xff6a1a,
    rate: 0.46,
    speed: 32,
    grav: 4,
    glow: 1.3,
    agni: 1,
    trail: [0xff8a20, 2, 0.5, 0.6, 3],
    hit: (p) => agniHit(p),
  },
  { name: 'Vayavyastra · wind', color: 0xe8fff4, rate: 0.48, wind: 1 },
  { name: 'Manavastra', color: 0xbfe6ff, rate: 0.6, invoke: 1.6, manava: 1 },
  {
    name: 'Nagastra · serpent',
    color: 0x8aff5a,
    rate: 0.6,
    speed: 30,
    grav: 2,
    glow: 1.1,
    naga: 1,
    trail: [0x7aff4a, 1, 0.45, 0.3, 0],
    hit: (p, d) => nagaHit(p, d),
  },
  {
    name: 'Brahmastra',
    color: 0xfff2c0,
    rate: 1.0,
    invoke: 2.0,
    halt: 1,
    speed: 52,
    grav: 0,
    glow: 1.6,
    charge: 1,
    trail: [0xffe9a0, 3, 0.7, 0.9, 0],
    hit: (p) => brahmaHit(p),
  },
];
let kind = 0;
function pickKind(i) {
  kind = (i + KINDS.length) % KINDS.length;
  [...$('arrows').children].forEach((b, j) => {
    b.classList.toggle('on', j === kind);
    b.style.background = j === kind ? '#' + KINDS[j].color.toString(16).padStart(6, '0') : '';
  });
}
$('arrows').innerHTML = KINDS.map((k, i) => `<button data-k="${i}">${k.name}</button>`).join('');
$('arrows').onclick = (e) => {
  if (e.target.dataset.k) pickKind(+e.target.dataset.k);
};
addEventListener('keydown', (e) => {
  if (who !== 'rama') return; // only Rama carries the astras
  if (e.code === 'KeyQ') pickKind(kind - 1);
  else if (e.code === 'KeyE') pickKind(kind + 1);
});
