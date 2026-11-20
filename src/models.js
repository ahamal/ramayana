// models.js — every model is assembled from primitives in code; there are no asset files.
const M = (() => {
  const geo = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new THREE.CylinderGeometry(1, 1, 1, 7),
    cone: new THREE.ConeGeometry(1, 1, 6),
    sph: new THREE.IcosahedronGeometry(1, 1),
  };
  const cache = {};
  function mat(color, emissive) {
    const k = color + '/' + (emissive || 0);
    return cache[k] || (cache[k] = new THREE.MeshStandardMaterial({
      color, flatShading: true, roughness: 0.9, metalness: 0,
      emissive: emissive || 0, emissiveIntensity: emissive ? 1 : 0,
    }));
  }
  function part(g, color, sx, sy, sz, x = 0, y = 0, z = 0, emissive) {
    const m = new THREE.Mesh(geo[g], mat(color, emissive));
    m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.castShadow = true;
    return m;
  }
  function limb(color, r, len, x, y) {
    const p = new THREE.Group(); p.position.set(x, y, 0);
    p.add(part('cyl', color, r, len, r, 0, -len / 2, 0));
    return p;
  }

  // Generic two-legged figure. Front faces +z.
  function figure(o) {
    const g = new THREE.Group(), w = o.wide || 1;
    const legL = limb(o.cloth, 0.15 * w, 0.75, -0.2 * w, 0.75), legR = limb(o.cloth, 0.15 * w, 0.75, 0.2 * w, 0.75);
    const armL = limb(o.skin, 0.11 * w, 0.7, -0.46 * w, 1.5), armR = limb(o.skin, 0.11 * w, 0.7, 0.46 * w, 1.5);
    g.add(legL, legR, armL, armR,
      part('cyl', o.skin, 0.34 * w, 0.8, 0.26 * w, 0, 1.15, 0),
      part('cyl', o.cloth, 0.38 * w, 0.35, 0.3 * w, 0, 0.85, 0),
      part('sph', o.skin, 0.27, 0.29, 0.27, 0, 1.85, 0));
    if (o.sash) g.add(part('box', o.sash, 0.12, 0.85, 0.56 * w, 0, 1.15, 0).rotateZ(0.6));
    if (o.hair) g.add(part('sph', o.hair, 0.29, 0.2, 0.29, 0, 1.99, -0.05), part('sph', o.hair, 0.13, 0.14, 0.13, 0, 2.2, -0.05));
    if (o.horns) g.add(part('cone', o.horns, 0.08, 0.38, 0.08, -0.18, 2.15, 0), part('cone', o.horns, 0.08, 0.38, 0.08, 0.18, 2.15, 0));
    if (o.eyes) g.add(part('sph', o.eyes, 0.06, 0.06, 0.06, -0.1, 1.9, 0.23, o.eyes), part('sph', o.eyes, 0.06, 0.06, 0.06, 0.1, 1.9, 0.23, o.eyes));
    if (o.club) armR.add(part('cyl', 0x3a2a1a, 0.09, 1.1, 0.09, 0, -0.75, 0.3).rotateX(1.2));
    g.userData = { legL, legR, armL, armR };
    g.scale.setScalar(o.s || 1);
    return g;
  }

  function wings(g, color, y, span) {
    const mk = sx => {
      const p = new THREE.Group(); p.position.set(0.25 * sx, y, -0.1);
      p.add(part('box', color, span, 0.05, 0.7, span / 2 * sx, 0, 0));
      g.add(p); return p;
    };
    g.userData.wingL = mk(-1); g.userData.wingR = mk(1);
  }

  function hero(kind) {
    const rama = kind === 'rama';
    const g = figure({ skin: rama ? 0x3f6fd0 : 0xd9a878, cloth: rama ? 0xe8a020 : 0xd8c070, hair: 0x18120e, sash: rama ? 0xf2d27a : 0xc86a20, s: 1.15 });
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.035, 5, 10, Math.PI), mat(0x6a3d1a));
    bow.rotation.set(0, -Math.PI / 2, -Math.PI / 2); bow.position.set(-0.5, 1.25, 0.35); bow.castShadow = true;
    g.add(bow, part('cyl', 0x7a4a20, 0.09, 0.6, 0.09, 0.15, 1.45, -0.3).rotateZ(0.3));
    g.add(part('cyl', 0xf2c84a, 0.2, 0.08, 0.2, 0, 2.08, 0)); // circlet
    return g;
  }

  function enemy(type) {
    if (type === 'rak') return figure({ skin: 0x8a3030, cloth: 0x2a1a14, horns: 0xd8c8a0, eyes: 0xffcc33, club: 1, s: 1.05 });
    if (type === 'pish') return figure({ skin: 0x7f9a66, cloth: 0x33402a, eyes: 0xff4444, s: 0.7 });
    if (type === 'brute') return figure({ skin: 0x5a466a, cloth: 0x1e1a22, wide: 1.6, horns: 0xe8dcc0, eyes: 0xff7722, club: 1, s: 1.75 });
    if (type === 'tataka') {
      const g = figure({ skin: 0x35584a, cloth: 0x5a1626, wide: 1.25, eyes: 0xff2a00, s: 3 });
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2;
        g.add(part('cone', 0x0c0c10, 0.12, 0.7, 0.12, Math.sin(a) * 0.22, 2.2, Math.cos(a) * 0.22 - 0.05).rotateX(Math.cos(a) * 0.7).rotateZ(-Math.sin(a) * 0.7));
      }
      return g;
    }
    if (type === 'subahu') {
      const g = figure({ skin: 0x9a2a1a, cloth: 0x2a1a10, wide: 1.5, horns: 0xf2c84a, eyes: 0xffee66, club: 1, s: 2.4 });
      g.add(part('sph', 0xc89a2a, 0.28, 0.2, 0.28, -0.7, 1.6, 0), part('sph', 0xc89a2a, 0.28, 0.2, 0.28, 0.7, 1.6, 0), part('box', 0xc89a2a, 0.7, 0.5, 0.1, 0, 1.25, 0.4));
      return g;
    }
    if (type === 'maricha') {
      const g = figure({ skin: 0xb0862e, cloth: 0x3a1a4a, horns: 0x1a1a1a, eyes: 0x66ffee, s: 2 });
      wings(g, 0x3a1a4a, 1.5, 1.5);
      return g;
    }
    // defiler: a bat-winged thing that fouls the altar from above
    const g = new THREE.Group();
    g.add(part('sph', 0x3a2a4a, 0.4, 0.5, 0.4, 0, 0, 0), part('sph', 0x4a3560, 0.26, 0.26, 0.26, 0, 0.3, 0.35),
      part('sph', 0xff3355, 0.06, 0.06, 0.06, -0.1, 0.36, 0.57, 0xff3355), part('sph', 0xff3355, 0.06, 0.06, 0.06, 0.1, 0.36, 0.57, 0xff3355));
    wings(g, 0x2a1c38, 0.1, 1.1);
    g.scale.setScalar(1.2);
    return g;
  }

  function walk(g, t, amp) {
    const u = g.userData, s = Math.sin(t) * amp;
    if (u.legL) { u.legL.rotation.x = s; u.legR.rotation.x = -s; u.armL.rotation.x = -s * 0.7; u.armR.rotation.x = s * 0.7; }
    if (u.wingL) { const f = Math.sin(t * 1.6) * 0.6; u.wingL.rotation.z = -f; u.wingR.rotation.z = f; }
  }

  function flame(s) {
    const g = new THREE.Group();
    [[0xff5a10, 1, 1], [0xffa020, 0.7, 0.8], [0xffe070, 0.4, 0.55]].forEach(([c, r, h]) => {
      const m = new THREE.Mesh(geo.cone, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.scale.set(r * 0.5 * s, h * 1.6 * s, r * 0.5 * s); m.position.y = h * 0.8 * s; g.add(m);
    });
    return g;
  }

  function tower(type, tier) {
    const g = new THREE.Group();
    if (type === 'arch') {
      for (const [x, z] of [[-0.65, -0.65], [0.65, -0.65], [-0.65, 0.65], [0.65, 0.65]]) g.add(part('cyl', 0xa8873a, 0.08, 3.9, 0.08, x, 1.95, z));
      g.add(part('box', 0x8a6a2e, 1.6, 0.14, 1.6, 0, 2.5, 0), part('cone', tier > 1 ? 0xc89a2a : 0x9a7a30, 1.35, 0.9, 1.35, 0, 4.35, 0),
        part('box', 0x8a6a2e, 1.6, 0.08, 0.08, 0, 1.2, 0.65), part('box', 0x8a6a2e, 1.6, 0.08, 0.08, 0, 1.2, -0.65));
      const a = figure({ skin: 0xc89868, cloth: 0xf0ead8, hair: 0x18120e, s: 0.7 }); a.position.y = 2.57; g.add(a);
    } else if (type === 'shr') {
      g.add(part('cyl', 0x9a9488, 0.9, 0.35, 0.9, 0, 0.18, 0), part('cyl', 0xe07a1a, 0.4, 0.5, 0.36, 0, 0.6, 0),
        part('sph', 0xc89868, 0.22, 0.24, 0.22, 0, 1.05, 0), part('cone', 0xf0f0f0, 0.16, 0.36, 0.12, 0, 0.82, 0.2).rotateX(Math.PI),
        part('sph', 0xe8e8e8, 0.14, 0.14, 0.14, 0, 1.3, -0.02),
        part('cyl', 0xa8873a, 0.04, 2.8, 0.04, -0.7, 1.4, -0.5), part('box', 0xff8a1a, 0.7, 0.4, 0.04, -0.33, 2.55, -0.5, 0x662200));
    } else if (type === 'braz') {
      for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; g.add(part('cyl', 0x4a4038, 0.07, 1.5, 0.07, Math.sin(a) * 0.4, 0.7, Math.cos(a) * 0.4)); }
      g.add(part('sph', 0x5a4a3a, 0.75, 0.35, 0.75, 0, 1.45, 0));
      const f = flame(0.8 + tier * 0.15); f.position.y = 1.5; g.add(f); g.userData.flame = f;
    } else {
      for (let i = 0; i < 4; i++) {
        const x = -0.72 + i * 0.48;
        g.add(part('cyl', 0x9a7a3a, 0.2, 1.7, 0.2, x, 0.85, 0), part('cone', 0xb89448, 0.2, 0.45, 0.2, x, 1.92, 0));
      }
      g.add(part('box', 0x6a4a22, 1.9, 0.12, 0.3, 0, 1.1, 0));
    }
    for (let i = 1; i < tier; i++) g.add(part('sph', 0xffd24a, 0.16, 0.16, 0.16, -0.25 + i * 0.25, type === 'arch' ? 4.95 : type === 'braz' ? 0.3 : 0.5, type === 'arch' ? 0 : 0.85, 0x7a5a00));
    return g;
  }

  function altar() {
    const g = new THREE.Group();
    g.add(part('box', 0x8a3e22, 3.4, 0.4, 3.4, 0, 0.2, 0), part('box', 0xa04a28, 2.5, 0.4, 2.5, 0, 0.6, 0), part('box', 0xb85a30, 1.7, 0.4, 1.7, 0, 1.0, 0));
    for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) g.add(part('cyl', 0xc89a2a, 0.12, 0.5, 0.12, x, 0.65, z, 0x3a2a00));
    const f = flame(1.5); f.position.y = 1.2; g.add(f);
    g.children.forEach(c => { c.receiveShadow = true; });
    return { g, flame: f };
  }

  function hut() {
    const g = new THREE.Group();
    g.add(part('cyl', 0xb89468, 1.15, 1.5, 1.15, 0, 0.75, 0), part('cone', 0x8a6a2a, 1.6, 1.4, 1.6, 0, 2.2, 0), part('box', 0x3a2414, 0.5, 0.95, 0.1, 0, 0.5, 1.12));
    return g;
  }

  const H = { rak: 2.5, pish: 1.8, def: 1.2, brute: 4.2, tataka: 7.2, subahu: 5.7, maricha: 4.8 };
  return { geo, mat, part, figure, hero, enemy, walk, tower, altar, hut, H };
})();
