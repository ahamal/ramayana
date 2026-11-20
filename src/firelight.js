// firelight.js — a second, unrelated art direction: cinematic cel-shaded figures in lit forest scenes.
// Each figure is posed with forward kinematics and shaded in three tones from one light source.
const Fire = (() => {
const W = 360, H = 520, GY = 448;
const rad = a => a * Math.PI / 180, f = n => Math.round(n * 10) / 10;
const rng = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

const MOODS = {
  dusk: { sky: ['#1a1238', '#5a2550', '#e0703a'], glow: '#ffb050', rim: '#ffdca8', L: [-0.98, 0.18], trees: ['#402448', '#2a1838', '#150c22'], ground: '#0e0818', fire: 1 },
  night: { sky: ['#040816', '#0c2238', '#1c4a55'], glow: '#bfefff', rim: '#a8ecff', L: [0.78, -0.62], trees: ['#123040', '#0a1e2c', '#040c16'], ground: '#02060c' },
  dust: { sky: ['#1c1206', '#6a4418', '#c89040'], glow: '#ffe0a0', rim: '#ffe6b0', L: [0.78, -0.62], trees: ['#6a4a20', '#3a2810', '#160e06'], ground: '#0c0803' },
  blood: { sky: ['#0c0408', '#4a0c18', '#a8281c'], glow: '#ff9a70', rim: '#ffc0a0', L: [0.78, -0.62], trees: ['#4a1018', '#2a080e', '#100306'], ground: '#080204' },
  mirage: { sky: ['#060a1c', '#1c2a5a', '#3a8a7a'], glow: '#c8ffe0', rim: '#c0ffe8', L: [0.78, -0.62], trees: ['#16304a', '#0c1c30', '#040a16'], ground: '#02060c' },
};

function backdrop(m, seed, id) {
  const r = rng(seed);
  let s = `<rect width="${W}" height="${H}" fill="url(#sky-${id})"/>`;
  s += m.fire ? `<ellipse cx="40" cy="${GY - 6}" rx="250" ry="170" fill="url(#fireglow)"/>` : `<circle cx="258" cy="100" r="78" fill="${m.glow}" opacity=".1"/><circle cx="258" cy="100" r="52" fill="${m.glow}" opacity=".12"/><circle cx="258" cy="100" r="33" fill="${m.glow}" opacity=".92"/>`;
  for (let l = 0; l < 3; l++) {
    const col = m.trees[l], n = [9, 6, 3][l], wd = [5, 10, 19][l], base = GY - 44 + l * 22;
    for (let i = 0; i < n; i++) {
      const x = l === 2 ? [18, 322, 352][i] + r() * 8 : (i + r()) * W / n, w = wd * (0.7 + r() * 0.6), lean = (r() - 0.5) * 16;
      s += `<path d="M${f(x - w / 2)},${base}L${f(x + lean - w * 0.3)},-10L${f(x + lean + w * 0.3)},-10L${f(x + w / 2)},${base}Z" fill="${col}"/>`;
      if (r() > 0.35) { const by = 70 + r() * 170, dn = r() > 0.5 ? 1 : -1; s += `<path d="M${f(x + lean * 0.6)},${f(by)}q${dn * 16},-12 ${f(dn * (24 + r() * 22))},-42" stroke="${col}" stroke-width="${f(w * 0.36)}" fill="none" stroke-linecap="round"/>`; }
    }
    for (let i = 0; i < 7; i++) s += `<circle cx="${f(r() * W)}" cy="${f(-8 + r() * (36 - l * 9))}" r="${f(24 + r() * 30)}" fill="${col}"/>`;
    s += `<path d="M0,${base}Q${f(80 + r() * 70)},${f(base - 14 - r() * 10)} 180,${base - 4}T${W},${f(base - 6 - r() * 8)}V${H}H0Z" fill="${col}"/>`;
    if (l < 2) s += `<ellipse cx="${W / 2}" cy="${base + 6}" rx="${W * 0.75}" ry="${22 - l * 6}" fill="${m.glow}" opacity="${0.13 - l * 0.04}" filter="url(#blur8)"/>`;
  }
  return s + `<path d="M0,${GY}Q120,${GY - 7} 200,${GY - 2}T${W},${GY - 4}V${H}H0Z" fill="${m.ground}"/>`;
}

function foreground(m, seed) {
  const r = rng(seed + 7); let s = '';
  for (let i = 0; i < 46; i++) { const x = r() * W, h = 8 + r() * 20, b = (r() - 0.5) * 14; s += `<path d="M${f(x)},${GY + 6}q${f(b * 0.3)},${f(-h * 0.6)} ${f(b)},${f(-h)}" stroke="${m.ground}" stroke-width="${f(1.4 + r() * 1.6)}" fill="none" stroke-linecap="round"/>`; }
  for (let i = 0; i < (m.fire ? 16 : 9); i++) {
    const x = m.fire ? 10 + r() * 190 : r() * W, y = GY - r() * 120, d = 3 + r() * 4, rr = 0.8 + r() * 1.4;
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="${m.fire ? '#ffb347' : m.glow}"><animate attributeName="cy" values="${f(y)};${f(y - 150 - r() * 120)}" dur="${f(d)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;${m.fire ? 1 : 0.5};0" dur="${f(d)}s" repeatCount="indefinite"/></circle>`;
  }
  return s;
}

// ---------- the figure ----------
function figure(c, m) {
  const [lx, ly] = m.L, rim = m.rim, k = c.k || 1, pal = c.pal, A = c.pose, turn = A.turn === undefined ? 0.4 : A.turn;
  const L = Object.assign({ thigh: 78, shin: 76, torso: 84, neck: 8, upper: 54, fore: 50, head: 17.5, sw: 31, hw: 17 }, c.len);
  const dv = a => [Math.sin(rad(a)), Math.cos(rad(a))];
  const add = (p, a, l) => { const d = dv(a); return [p[0] + d[0] * l, p[1] + d[1] * l]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const off = (p, x, y) => [p[0] + x, p[1] + y];
  const pt = p => `${f(p[0])},${f(p[1])}`, seg = (a, b) => `M${pt(a)}L${pt(b)}`;
  // three-tone stroke: shadow body, lit band pushed toward the light, thin rim on the lit edge
  const S = (d, w, R) => { const [dk, md] = pal[R], o1 = w * 0.17, o2 = w * 0.37; return `<path d="${d}" stroke="${dk}" stroke-width="${f(w)}"/><path d="${d}" stroke="${md}" stroke-width="${f(w * 0.62)}" transform="translate(${f(lx * o1)} ${f(ly * o1)})"/><path d="${d}" stroke="${rim}" stroke-width="${f(Math.max(1.1, w * 0.12))}" transform="translate(${f(lx * o2)} ${f(ly * o2)})" opacity=".92"/>`; };
  const F = (d, R) => `<path d="${d}" fill="url(#${c.id}-${R})"/>`;
  const Ld = (d, col, w, op = 1) => `<path d="${d}" stroke="${col}" stroke-width="${w}" opacity="${op}"/>`;
  const dot = (p, r, col, glow) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${r}" fill="${col}"${glow ? ' filter="url(#glow)"' : ''}/>`;
  const ribbon = (p, a, len, w, amp, ph = 0, n = 12) => { // tapering wavy strip from p heading at angle a (0 = right, 90 = down)
    const dx = Math.cos(rad(a)), dy = Math.sin(rad(a)), l = [], rr = [];
    for (let i = 0; i <= n; i++) { const t = i / n, wv = Math.sin(t * 5 + ph) * amp * t, hw = w * (1 - t * 0.88), cx = p[0] + dx * len * t - dy * wv, cy = p[1] + dy * len * t + dx * wv; l.push(`${f(cx - dy * hw)},${f(cy + dx * hw)}`); rr.unshift(`${f(cx + dy * hw)},${f(cy - dx * hw)}`); }
    return 'M' + l.join('L') + 'L' + rr.join('L') + 'Z';
  };
  const band = (a, b, t, w, R = 'gold') => { const p = mix(a, b, t), an = Math.atan2(b[1] - a[1], b[0] - a[0]), n = [-Math.sin(an) * w, Math.cos(an) * w]; return Ld(seg(off(p, n[0], n[1]), off(p, -n[0], -n[1])), pal[R][0], 4.6) + Ld(seg(off(p, n[0], n[1]), off(p, -n[0], -n[1])), pal[R][1], 2.6); };

  // skeleton
  const legs = p => { const kN = add(p, A.nLeg[0], L.thigh), fN = add(kN, A.nLeg[1], L.shin), kF = add(p, A.fLeg[0], L.thigh), fF = add(kF, A.fLeg[1], L.shin); return { kN, fN, kF, fF }; };
  let lg = legs([0, 0]); const pel = [0, -Math.max(lg.fN[1], lg.fF[1]) - 5 * k - (c.lift || 0)]; lg = legs(pel);
  const sd = [Math.sin(rad(A.lean)), -Math.cos(rad(A.lean))], pp = [-sd[1], sd[0]];
  const nb = off(pel, sd[0] * L.torso, sd[1] * L.torso), sw = L.sw * k * (1 - 0.5 * turn), hw = L.hw * k * (1 - 0.3 * turn);
  const sN = off(nb, -pp[0] * sw, -pp[1] * sw + 3), sF = off(nb, pp[0] * sw, pp[1] * sw + 3);
  const eN = add(sN, A.nArm[0], L.upper), hN = add(eN, A.nArm[1], L.fore), eF = add(sF, A.fArm[0], L.upper), hF = add(eF, A.fArm[1], L.fore);
  const hd = off(nb, sd[0] * (L.neck + L.head), sd[1] * (L.neck + L.head));
  const J = { pel, nb, sN, sF, eN, hN, eF, hF, hd, sd, pp, hw, sw, ...lg };
  const h = { S, F, Ld, dot, ribbon, band, seg, pt, add, mix, off, k, rim, pal, J, A, L, glow: m.glow };

  const prof = (keys, t) => { for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return v0 + (v1 - v0) * (t - t0) / (t1 - t0); } return keys[keys.length - 1][1]; };
  const chain = (bones, R) => { // one tapered form across several bones, shaded in three passes so joints never show
    const ps = []; for (const [a, b, wd, keys] of bones) for (let i = 0; i < 8; i++) ps.push([mix(a, b, i / 8), mix(a, b, (i + 1) / 8), wd * prof(keys, (i + 0.5) / 8)]);
    const [dk, md] = pal[R]; let s = '';
    for (const [o, wf, col] of [[0, 1, dk], [0.17, 0.62, md], [0.37, 0.12, rim]]) { s += `<g stroke="${col}">`; for (const [a, b, w] of ps) s += `<path d="M${f(a[0] + lx * o * w)},${f(a[1] + ly * o * w)}L${f(b[0] + lx * o * w)},${f(b[1] + ly * o * w)}" stroke-width="${f(Math.max(1.1, w * wf))}"/>`; s += '</g>'; }
    return s;
  };
  const TH = [[0, 1], [0.3, 1.07], [1, 0.66]], SH = [[0, 0.66], [0.28, 0.77], [1, 0.4]], UP = [[0, 1], [0.4, 1.03], [1, 0.7]], FO = [[0, 0.7], [0.25, 0.79], [1, 0.5]];
  const leg = (kn, ft, a) => chain([[pel, kn, 31 * k, TH], [kn, ft, 31 * k, SH], [ft, ft[1] > -14 * k ? off(ft, 15 * k, 2) : add(ft, a + 70, 15 * k), 31 * k, [[0, 0.4], [1, 0.3]]]], 'skin') + (c.plain ? '' : band(kn, ft, 0.88, 7.5 * k) + band(kn, ft, 0.79, 8.3 * k));
  const arm = (s, e, hh) => chain([[s, e, 22 * k, UP], [e, hh, 22 * k, FO], [hh, off(hh, (hh[0] - e[0]) / L.fore * 10 * k, (hh[1] - e[1]) / L.fore * 10 * k), 22 * k, [[0, 0.58], [1, 0.42]]]], 'skin') + (c.plain ? '' : band(s, e, 0.45, 11.5 * k)) + band(e, hh, 0.86, 6.5 * k, c.demon ? 'bone' : 'gold') + (c.plain ? '' : band(e, hh, 0.76, 7.2 * k, c.demon ? 'bone' : 'gold') + (c.demon ? '' : Ld(seg(off(mix(s, e, 0.45), lx * 8 * k, ly * 8 * k), off(mix(s, e, 0.28), lx * 7 * k, ly * 7 * k)), pal.gold[1], 2.6)) + dot(mix(s, e, 0.45), 2.4 * k, c.demon ? pal.bone[1] : '#ff5a4a'));
  const cloth = kn => { if (c.wear === 'robe') return ''; const e = mix(pel, kn, c.wear === 'loin' ? 0.42 : 0.86), cw = (c.clothW || 38) * k; return chain([[pel, e, cw, [[0, 0.95], [0.5, 1.06], [1, 0.82]]]], 'cloth') + (c.demon ? '' : band(pel, e, 0.95, cw * 0.4) + band(pel, e, 0.82, cw * 0.44, 'cloth2')); };
  const wc = off(pel, sd[0] * L.torso * 0.38, sd[1] * L.torso * 0.38), wN = off(wc, -pp[0] * sw * 0.66, -pp[1] * sw * 0.66), wF = off(wc, pp[0] * sw * 0.74, pp[1] * sw * 0.74);
  const torso = `M${pt(sN)}Q${pt(off(nb, sd[0] * 9, sd[1] * 9))} ${pt(sF)}Q${pt(off(mix(sF, wF, 0.4), pp[0] * 7 * k, pp[1] * 7 * k))} ${pt(wF)}L${pt(off(pel, hw, 2))}L${pt(off(pel, -hw, 2))}L${pt(wN)}Q${pt(off(mix(sN, wN, 0.5), -pp[0] * 3 * k, -pp[1] * 3 * k))} ${pt(sN)}Z`;
  const x = c.extra ? c.extra(h) : {};
  const hs = (c.headS || 1) * L.head / 15;
  const eye = c.demon ? `<circle cx="7.5" cy="-3.5" r="3" fill="${c.eye || '#ffe36a'}" filter="url(#glow)"/><circle cx="7.5" cy="-3.5" r="1.5" fill="#fff"/>` + Ld('M1,-9L13,-5', pal.skin[0], 2.2) : `<path d="M3.6,-3.2Q8,-7 12.6,-3.2Q8,-0.8 3.6,-3.2Z" fill="#fdf6e6"/><circle cx="8.8" cy="-3.5" r="1.9" fill="#0c0714"/><circle cx="9.5" cy="-4.2" r="0.6" fill="#fff"/>` + Ld('M2.6,-3.4Q8,-7.6 13,-3.2', '#0c0714', 1.3) + Ld('M2.5,-8.4Q8,-11.4 13.5,-7.6', '#0c0714', 1.5) + Ld('M13.6,7.4Q11.5,9.2 9,8.6', '#7a1c1c', 1.7) + Ld('M15.6,3.4q-1.6,-1 -2.4,0.4', '#0c0714', 0.8, 0.7) + Ld('M-3,-5q-5,-1 -4.4,4.4q1.6,4 4.6,2', '#0c0714', 1, 0.55);
  const head = `<g transform="translate(${f(hd[0])} ${f(hd[1])}) rotate(${f(A.lean * 0.45 + (A.head || 0))}) scale(${f(hs)})">${x.headBack || ''}${F('M-13,-5C-15,-21 9,-23 12.5,-8L18,2.5L13,4.5L14,9.5L8.5,16.5L-3,15.5C-10,11 -13,3 -13,-5Z', 'skin')}${eye}${x.headFront || ''}</g>`;

  let o = (x.behind || '') + arm(sF, eF, hF) + (x.farHand || '') + leg(lg.kF, lg.fF, A.fLeg[1]) + cloth(lg.kF) + (x.back || '');
  o += F(torso, c.armor ? 'gold' : 'skin') + (c.armor ? '' : Ld(`M${pt(off(mix(nb, wc, 0.45), -pp[0] * sw * 0.45, -pp[1] * sw * 0.45))}Q${pt(off(mix(nb, wc, 0.62), pp[0] * sw * 0.25, pp[1] * sw * 0.25))} ${pt(off(mix(nb, wc, 0.4), pp[0] * sw * 0.85, pp[1] * sw * 0.85))}M${pt(off(mix(nb, wc, 0.62), pp[0] * sw * 0.2, pp[1] * sw * 0.2))}L${pt(off(mix(wc, pel, 0.6), pp[0] * sw * 0.16, 0))}`, pal.skin[0], 1.5, 0.5)) + (x.chest || '') + leg(lg.kN, lg.fN, A.nLeg[1]) + cloth(lg.kN);
  if (c.wear === 'robe') { const x0 = Math.min(lg.fN[0], lg.fF[0]) - 16 * k, x1 = Math.max(lg.fN[0], lg.fF[0]) + 24 * k; o += F(`M${pt(off(pel, -hw - 3, -4))}L${pt(off(pel, hw + 4, -4))}Q${f(x1 + 4)},${f(pel[1] * 0.5)} ${f(x1)},-3q-8,5 -16,0t-16,1t-16,-1t-16,2L${f(x0)},-2Q${f(x0 - 2)},${f(pel[1] * 0.5)} ${pt(off(pel, -hw - 3, -4))}Z`, 'cloth') + Ld(`M${pt(off(pel, 2, 0))}Q${f(pel[0] + 10)},${f(pel[1] * 0.5)} ${f(pel[0] + 4)},-6`, pal.cloth[0], 1.6, 0.7) + Ld(`M${pt(off(pel, -hw * 0.5, 0))}Q${f(x0 + 14)},${f(pel[1] * 0.5)} ${f(x0 + 10)},-8M${pt(off(pel, hw * 0.7, 0))}Q${f(x1 - 6)},${f(pel[1] * 0.55)} ${f(x1 - 12)},-8`, pal.cloth[0], 1.6, 0.6) + Ld(`M${f(x0 + 1)},-11Q${f((x0 + x1) / 2)},-5 ${f(x1 - 1)},-11`, pal.gold[1], 2.6, 0.95) + Ld(`M${f(x0 + 2)},-18Q${f((x0 + x1) / 2)},-12 ${f(x1 - 2)},-18`, pal.cloth2[1], 1.5, 0.9); }
  else o += F(ribbon(off(pel, 3, -2), 84, c.wear === 'loin' ? 40 * k : 74 * k, 10 * k, 3, 1), 'cloth2');
  o += S(seg(off(pel, -hw, 0), off(pel, hw, 0)), 11 * k, c.demon && !c.armor ? 'bone' : 'gold') + (c.plain ? '' : dot(off(pel, 2, 0), 3.2 * k, c.demon ? pal.bone[1] : '#ff5a4a') + (c.demon ? '' : [-0.55, 0.65].map(t => Ld(seg(off(pel, hw * t, 5), off(pel, hw * t - 1, 20 * k)), pal.gold[1], 1.6) + dot(off(pel, hw * t - 1, 21 * k), 2.2, rim)).join(''))) + (x.waist || '');
  o += S(seg(nb, mix(nb, hd, 0.7)), 14 * k, 'skin') + head + (x.mid || '') + arm(sN, eN, hN) + (c.demon && !c.plain ? [-34, 0, 34].map(a => F(`M${pt(off(sN, -5 * k, 0))}L${pt(add(sN, 180 + a, 17 * k))}L${pt(off(sN, 5 * k, 0))}Z`, 'bone')).join('') : '') + (x.front || '');
  return o;
}

// ---------- shared drawing bits (head-local unless noted) ----------
const spikes = (n, r1, r2, a0, a1) => { let d = ''; for (let i = 0; i <= n * 2; i++) { const a = rad(a0 + (a1 - a0) * i / (n * 2)), r = i % 2 ? r2 : r1; d += (i ? 'L' : 'M') + f(Math.cos(a) * r) + ',' + f(Math.sin(a) * r); } return d + 'Z'; };
const HAIR = 'M-13,-5C-16,-22 7,-25 12.5,-11C5,-15 -3,-13 -6,-4L-8,10Q-16,6 -13,-5Z';
const CROWN = n => { let d = 'M-13,-13L12,-15', y = -15, w = 12; for (let i = 0; i < n; i++) { d += `L${w - 2.5},${y - 9}L${w - 5.5},${y - 9}`; y -= 9; w -= 3.2; } d += `L0,${y - 16}`; w = -w; for (let i = 0; i < n; i++) { d += `L${w - 3},${y}L${w},${y}`; y += 9; w -= 3.2; } return d + 'Z'; };
const HORNS = 'M3,-17Q4,-36 20,-41Q11,-30 11,-16ZM-8,-17Q-13,-36 0,-45Q-4,-31 0,-17Z';
const jewel = (h, extraChest = '') => { const { J } = h, a = h.off(J.sN, 4, 2), c2 = h.off(J.nb, 4, 50), b = h.off(J.sF, -2, 2);
  return h.Ld(`M${h.pt(h.off(J.sN, 8, 2))}L${h.pt(h.off(J.pel, J.hw - 2, -7))}`, '#f3ead8', 1.3, 0.85) + h.Ld(`M${h.pt(h.off(J.sN, 6, 0))}Q${h.pt(h.off(J.nb, 2, 22))} ${h.pt(h.off(J.sF, -4, 0))}`, h.pal.gold[1], 3) + h.Ld(`M${h.pt(a)}Q${h.pt(c2)} ${h.pt(b)}`, h.pal.gold[1], 1.6)
    + [0.25, 0.5, 0.75].map((t, n) => h.dot([(1 - t) * (1 - t) * a[0] + 2 * t * (1 - t) * c2[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * t * (1 - t) * c2[1] + t * t * b[1]], n === 1 ? 3 : 2, n === 1 ? '#ff5a4a' : h.rim)).join('') + h.dot(h.off(J.nb, 3, 13), 2.4, h.rim) + extraChest; };
const crown = (h, n) => { let d = h.F('M-13,-13q-11,0 -12,14q5,-7 12,-8Z', 'gold') + h.F(CROWN(n), 'gold'); for (let i = 0; i < n; i++) { const y = -15 - 9 * i, w = 12 - 3.2 * i; d += h.Ld(`M${-w},${y + 1}L${w},${y - 1}`, h.pal.gold[0], 1.1) + h.dot([0, y - 4.5], 1.7, i % 2 ? '#4ad0a0' : '#ff5a4a'); } return d + h.dot([0, -31 - 9 * n], 2.2, h.rim, 1); };
const club = (h, hand, a, len, r, spiked) => { const tip = h.add(hand, a, len), back = h.add(hand, a + 180, 12); let s = h.S(h.seg(back, tip), 6.5 * h.k, 'prop') + h.S(`M${h.pt(tip)}l0.1,0`, r * 2, 'prop'); if (spiked) for (let i = 0; i < 9; i++) { const d = [Math.cos(i * 0.7) * r, Math.sin(i * 0.7) * r]; s += h.Ld(h.seg(h.off(tip, d[0] * 0.9, d[1] * 0.9), h.off(tip, d[0] * 1.5, d[1] * 1.5)), h.pal.bone[1], 3); } return s; };
const wings = (h, R) => { const s = h.J.sN, one = (dx, sc) => { const P2 = (x, y) => [s[0] + x * dx * sc, s[1] + y * sc], wr = P2(-66, -74), t = [P2(-150, -70), P2(-128, -4), P2(-84, 34), P2(-30, 44)], q = (a, b) => `Q${h.pt(h.mix(h.mix(a, b, 0.5), wr, 0.34))} ${h.pt(b)}`; return h.F(`M${h.pt(s)}L${h.pt(wr)}L${h.pt(t[0])}${q(t[0], t[1])}${q(t[1], t[2])}${q(t[2], t[3])}L${h.pt(P2(-4, 30))}Z`, R) + h.Ld(h.seg(s, wr) + t.slice(0, 3).map(p => h.seg(wr, p)).join(''), h.rim, 1.3, 0.6) + h.dot(wr, 2.4, h.rim); }; return one(-0.8, 0.82) + one(1, 1); };

const P = { // palettes: [shadow, lit]
  gold: ['#7a4c0c', '#f0b83a'], hair: ['#08060f', '#231c36'], wood: ['#2c1608', '#8a5226'], bone: ['#7a705c', '#eadfc4'], white: ['#857f72', '#ece6d6'], rock: ['#2c2a2a', '#8a8378'],
};
const CAST = [
  { id: 'rama', name: 'Rama', dev: 'राम', role: 'Prince of Ayodhya. You play him.', mood: 'dusk', sc: 1.06, cx: 128,
    pal: { skin: ['#10265c', '#2f6fd0'], cloth: ['#8a3a08', '#f08c1a'], cloth2: ['#5e0f18', '#cc2a30'], gold: P.gold, hair: P.hair, prop: P.wood },
    pose: { lean: 5, turn: 0.4, nLeg: [-25, -17], fLeg: [31, 3], nArm: [-106, 80], fArm: [93, 95], head: -4 },
    extra: h => { const { J } = h, t1 = h.off(J.hF, -12, -92), t2 = h.off(J.hF, -8, 94), u = [(J.hF[0] - J.hN[0]), (J.hF[1] - J.hN[1])], ul = Math.hypot(u[0], u[1]), tip = h.off(J.hF, u[0] / ul * 44, u[1] / ul * 44);
      return { behind: h.F(h.ribbon(h.off(J.pel, -6, -2), 196, 96, 9, 9, 0.5), 'cloth2') + h.F(h.ribbon(h.off(J.pel, -4, 4), 168, 78, 8, 8, 2.2), 'cloth') + h.S(h.seg(h.off(J.sN, -16, -30), h.off(J.sN, 6, 34)), 13, 'cloth2') + [0, 5, 10].map(i => h.Ld(h.seg(h.off(J.sN, -17 + i * 0.4, -34 - i), h.off(J.sN, -22 + i, -50 - i)), h.rim, 1.6)).join('') + h.F(h.ribbon(h.off(J.hd, -12, 2), 172, 46, 8, 5, 1), 'hair'),
        farHand: h.S(`M${h.pt(t1)}Q${h.pt(h.off(J.hF, 34, -46))} ${h.pt(J.hF)}Q${h.pt(h.off(J.hF, 34, 48))} ${h.pt(t2)}`, 6, 'prop') + h.Ld(`M${h.pt(t1)}L${h.pt(J.hN)}L${h.pt(t2)}`, h.rim, 0.9, 0.9),
        chest: jewel(h), headBack: h.F(HAIR, 'hair'), headFront: crown(h, 4) + h.dot([1, -20], 2.2, '#ff5a4a') + h.dot([-5, 7], 3, h.pal.gold[1]) + h.Ld('M12,-13l1.5,5', '#ff5a4a', 2),
        front: h.Ld(h.seg(h.off(J.hN, -10, 1), tip), '#f4e3b8', 2) + h.F(h.ribbon(tip, Math.atan2(u[1], u[0]) * 57.3 + 180, 34, 5, 4, 0), 'flame') + h.dot(tip, 5, '#ffb347', 1) + h.dot(tip, 2.4, '#fff6d8') }; } },
  { id: 'lak', name: 'Lakshmana', dev: 'लक्ष्मण', role: 'His brother. Holds the post you choose.', mood: 'dusk', sc: 1.16, cx: 170,
    pal: { skin: ['#6e3f18', '#dba05a'], cloth: ['#12224e', '#2e5ebc'], cloth2: ['#8a3a08', '#f08c1a'], gold: P.gold, hair: P.hair, prop: P.wood },
    pose: { lean: -2, turn: 0.3, nLeg: [-9, -3], fLeg: [13, 5], nArm: [-14, 34], fArm: [40, 64], head: 6 },
    extra: h => { const { J } = h, top = h.off(J.hF, 8, -128), bot = [J.hF[0] + 2, -2];
      return { behind: h.F(`M${h.pt(h.off(J.sN, 2, -4))}Q${f(J.sN[0] - 60)},${f(J.sN[1] + 60)} ${f(J.sN[0] - 74)},-24q12,-10 22,2q8,-12 20,-2q10,-12 22,-4L${h.pt(h.off(J.pel, -4, -30))}Z`, 'cloth2') + [[-30, -40], [-50, -28], [-12, -46]].map(([x, y]) => h.Ld(`M${h.pt(h.off(J.sN, -2, 6))}Q${f(J.sN[0] + x * 0.8)},${f(J.sN[1] * 0.5)} ${f(J.sN[0] + x)},${y}`, h.pal.cloth2[0], 1.8, 0.65)).join('') + h.F(h.ribbon(h.off(J.hd, -12, 2), 150, 40, 8, 4, 1), 'hair'),
        farHand: h.S(`M${h.pt(top)}Q${h.pt(h.off(J.hF, 40, -60))} ${h.pt(J.hF)}Q${f(J.hF[0] + 36)},${f(J.hF[1] * 0.5)} ${h.pt(bot)}`, 6, 'prop') + h.Ld(h.seg(top, bot), h.rim, 0.9, 0.9),
        chest: jewel(h), headBack: h.F(HAIR, 'hair'), headFront: crown(h, 3) + h.dot([1, -20], 2.2, '#4ad0a0') + h.dot([-12, 6], 3.2, h.pal.gold[1]),
        front: h.Ld(h.seg(h.off(J.hN, -2, -34), h.off(J.hN, 3, 46)), '#f4e3b8', 2) + h.Ld(h.seg(h.off(J.hN, 3, 46), h.off(J.hN, 3.6, 56)), h.rim, 3.4) }; } },
  { id: 'vish', name: 'Vishwamitra', dev: 'विश्वामित्र', role: 'The sage whose sacrifice you guard.', mood: 'dusk', sc: 1.14, cx: 160, plain: 1, wear: 'robe',
    pal: { skin: ['#6a3a16', '#c98a4a'], cloth: ['#8a3408', '#e8801a'], cloth2: ['#5e0f18', '#b83a1c'], gold: P.wood, hair: P.white, prop: P.wood },
    pose: { lean: 4, turn: 0.35, nLeg: [-6, -2], fLeg: [10, 2], nArm: [52, 176], fArm: [38, 70], head: 2 },
    extra: h => { const { J } = h;
      return { behind: h.S(h.seg(h.off(J.hF, -4, -150), [J.hF[0] + 6, -2]), 5.5, 'prop') + h.F(h.ribbon(h.off(J.hF, -4, -140), 20, 30, 7, 4, 0), 'cloth2'),
        chest: h.F(`M${h.pt(h.off(J.sN, -2, -3))}L${h.pt(h.off(J.sN, 14, -6))}L${h.pt(h.off(J.pel, J.hw + 6, -6))}L${h.pt(h.off(J.pel, J.hw - 10, -2))}Z`, 'cloth2') + [0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map(t => h.dot(h.mix(h.off(J.sF, -4, 4), h.off(J.nb, -4, 46), t), 2.3, '#3a1c0a')).join(''),
        headBack: h.F(HAIR, 'hair') + h.F('M-12,-16a11,11 0 1,1 18,-6a9,9 0 0,1 -18,6Z', 'hair'), headFront: h.F('M-7,6Q0,16 12,12L14,10Q20,34 8,58Q3,40 -3,30Q-9,18 -7,6Z', 'hair') + h.Ld('M4,-17l9,3M3.5,-14l10,3', '#f3ead8', 1.2, 0.9),
        front: h.dot(h.off(J.hN, 2, -10), 9, h.glow, 1).replace('/>', ' opacity=".5"/>') }; } },
  { id: 'disc', name: 'Disciple', dev: 'शिष्य', role: 'Gathers wood for the fire by day.', mood: 'dusk', sc: 1.0, cx: 165, plain: 1,
    pal: { skin: ['#6e4420', '#d8a06a'], cloth: ['#8a7a5a', '#efe0b8'], cloth2: ['#8a3a08', '#e88a2a'], gold: ['#8a3a08', '#e88a2a'], hair: P.hair, prop: P.wood },
    pose: { lean: 9, turn: 0.45, nLeg: [-22, -34], fLeg: [26, 6], nArm: [70, 168], fArm: [30, 60], head: 4 },
    extra: h => { const { J } = h, c0 = h.off(J.sN, 2, -15);
      return { mid: [0, 1, 2, 3, 4].map(i => h.S(h.seg(h.off(c0, -46, 8 - i * 4.5), h.off(c0, 44, -8 - i * 4.5)), 6, 'prop')).join('') + h.Ld(h.seg(h.off(c0, -18, 6), h.off(c0, -20, -18)), h.pal.cloth2[1], 2.4) + h.Ld(h.seg(h.off(c0, 20, -2), h.off(c0, 18, -26)), h.pal.cloth2[1], 2.4),
        chest: h.Ld(`M${h.pt(h.off(J.sN, 6, 0))}L${h.pt(h.off(J.pel, J.hw - 2, -6))}`, '#f3ead8', 1.4, 0.9), headBack: h.F('M-13,-10q-12,-8 -9,8q4,-6 9,-5Z', 'hair') }; } },
  { id: 'rak', name: 'Rakshasa', dev: 'राक्षस', role: 'The common foot soldier of the night.', mood: 'night', sc: 1.1, cx: 150, demon: 1, wear: 'loin',
    pal: { skin: ['#360a0e', '#b02a2c'], cloth: ['#0c0a12', '#2c2636'], cloth2: ['#0c0a12', '#3a2f44'], gold: P.gold, hair: P.hair, prop: P.wood, bone: P.bone },
    pose: { lean: 27, turn: 0.5, nLeg: [-42, -78], fLeg: [56, -8], nArm: [-150, 172], fArm: [84, 58], head: -12 },
    extra: h => ({ behind: h.F(h.ribbon(h.off(h.J.pel, -8, 0), 190, 50, 9, 6, 1), 'cloth'), headBack: h.F(spikes(6, 12, 31, 140, 300), 'hair') + h.F(HORNS, 'bone'), headFront: h.Ld('M13,8l-1,6M9,9.5l-0.5,5', h.pal.bone[1], 2), chest: [0.2, 0.4, 0.6, 0.8].map(t => h.dot(h.mix(h.off(h.J.sN, 6, 8), h.off(h.J.sF, -2, 10), t), 2.6, h.pal.bone[1])).join(''), front: club(h, h.J.hN, h.A.nArm[1] - 6, 62, 14, 1) }) },
  { id: 'pish', name: 'Pishacha', dev: 'पिशाच', role: 'Fast, frail, and never alone.', mood: 'night', sc: 1.02, cx: 150, demon: 1, plain: 1, wear: 'loin', k: 0.62, headS: 1.5, eye: '#ff5a4a',
    len: { thigh: 70, shin: 74, upper: 66, fore: 70, torso: 78 },
    pal: { skin: ['#0e2a1c', '#4a8a5c'], cloth: ['#20140c', '#5a3a22'], cloth2: ['#20140c', '#5a3a22'], gold: P.bone, hair: P.hair, prop: P.wood, bone: P.bone },
    pose: { lean: 58, turn: 0.6, nLeg: [28, -84], fLeg: [78, -30], nArm: [34, 12], fArm: [62, 36], head: -34 },
    extra: h => { const claw = p => [-0.5, 0, 0.5].map(a => h.Ld(h.seg(p, h.off(p, Math.sin(a + 0.4) * 13, Math.cos(a + 0.4) * 13)), h.pal.bone[1], 1.8)).join('');
      return { headBack: h.F('M-9,-6L-30,-24L-12,6Z', 'skin') + h.Ld('M-6,-20l-5,-12M0,-21l-1,-13M6,-19l4,-10', h.pal.hair[1], 1.3), headFront: h.Ld('M13,8l-1,5M9.5,9.5l-0.5,4.5M6,10l0,4', h.pal.bone[1], 1.5), chest: [0.3, 0.45, 0.6].map(t => h.Ld(h.seg(h.mix(h.J.sN, h.J.pel, t), h.off(h.mix(h.J.sF, h.J.pel, t), 0, 3)), h.pal.skin[0], 1.4, 0.8)).join(''), farHand: claw(h.J.hF), front: claw(h.J.hN) }; } },
  { id: 'def', name: 'Defiler', dev: 'निशाचर', role: 'Flies over walls to foul the altar.', mood: 'night', sc: 0.98, cx: 176, lift: 150, demon: 1, plain: 1, wear: 'loin', k: 0.72, headS: 1.3, eye: '#8aff5a',
    pal: { skin: ['#1a0e30', '#6a44a0'], cloth: ['#2a0a16', '#8a1e3a'], cloth2: ['#2a0a16', '#8a1e3a'], gold: P.bone, hair: P.hair, prop: P.wood, bone: P.bone, wing: ['#2a0816', '#9a2440'] },
    pose: { lean: 52, turn: 0.55, nLeg: [-58, -84], fLeg: [-40, -70], nArm: [44, 70], fArm: [58, 76], head: -30 },
    extra: h => { const p = h.off(h.mix(h.J.hN, h.J.hF, 0.5), 4, 10);
      return { behind: wings(h, 'wing'), headBack: h.F('M-9,-6L-28,-26L-12,6Z', 'skin'), headFront: h.Ld('M13,8l-1,5M9.5,9.5l-0.5,4.5', h.pal.bone[1], 1.5),
        front: h.F(`M${f(p[0] - 15)},${f(p[1] - 6)}h30q3,22 -15,26q-18,-4 -15,-26Z`, 'prop') + [[-8, 60, 3], [2, 96, 0], [10, 46, 5]].map(([dx, l, ph]) => h.F(h.ribbon(h.off(p, dx, 18), 92, l, 2.6, 2, ph), 'slime')).join('') + h.dot(h.off(p, 0, -4), 7, '#8aff5a', 1).replace('/>', ' opacity=".7"/>') }; } },
  { id: 'brute', name: 'Brute', dev: 'महाकाय', role: 'Slow and vast. Smashes what you build.', mood: 'night', sc: 1.0, cx: 150, demon: 1, wear: 'loin', k: 1.75, clothW: 26, headS: 0.74, eye: '#ffb347',
    len: { thigh: 62, shin: 58, torso: 96, upper: 62, fore: 58, neck: 4, sw: 25, hw: 14 },
    pal: { skin: ['#0c1a30', '#3a629a'], cloth: ['#7a3a08', '#e08a1a'], cloth2: ['#7a3a08', '#e08a1a'], gold: P.gold, hair: P.hair, prop: P.wood, bone: P.bone },
    pose: { lean: 12, turn: 0.25, nLeg: [-20, -5], fLeg: [24, 1], nArm: [-34, 196], fArm: [16, 34], head: 8 },
    extra: h => ({ headBack: h.F(spikes(5, 12, 24, 150, 290), 'hair') + h.F(HORNS, 'bone'), headFront: h.F('M10,12Q20,6 19,-6Q14,3 7,8ZM2,14Q11,10 12,0Q6,7 0,10Z', 'bone'), chest: [0.15, 0.32, 0.5, 0.68, 0.85].map(t => h.dot(h.mix(h.off(h.J.sN, 10, 16), h.off(h.J.sF, -4, 18), t), 4, h.pal.bone[1])).join(''), waist: [-14, 4, 20].map(dx => h.Ld(`M${h.pt(h.off(h.J.pel, dx, 12))}q6,10 0,22`, '#1a0c04', 4, 0.8)).join(''), mid: club(h, h.J.hN, 236, 104, 30, 1) }) },
  { id: 'tataka', name: 'Tataka', dev: 'ताटका', role: 'Boss of night three. Hurls boulders, raises dust.', mood: 'dust', sc: 1.0, cx: 168, demon: 1, wear: 'robe', k: 1.12, eye: '#ff4a2a', len: { sw: 36, hw: 21 },
    pal: { skin: ['#0c2a22', '#2f8a66'], cloth: ['#4a0a14', '#b8242e'], cloth2: ['#2a060c', '#7a1420'], gold: P.gold, hair: ['#050508', '#1c1826'], prop: P.wood, bone: P.bone, rock: P.rock },
    pose: { lean: -8, turn: 0.35, nLeg: [-16, -6], fLeg: [18, 4], nArm: [168, 194], fArm: [186, 168], head: -10 },
    extra: h => { const { J } = h, c0 = h.off(h.mix(J.hN, J.hF, 0.5), 0, -34), pg = [[-44, 8], [-36, -24], [-8, -40], [28, -34], [46, -6], [34, 24], [-6, 32], [-34, 26]].map(p => h.off(c0, p[0], p[1]));
      return { behind: [[200, 150, 12, 14, 0], [186, 190, 13, 16, 2], [172, 168, 11, 12, 4], [215, 110, 9, 10, 1]].map(([a, l, w, am, ph]) => h.F(h.ribbon(h.off(J.hd, -8, 0), a - 100, l, w, am, ph), 'hair')).join(''),
        headBack: h.F(spikes(7, 12, 34, 120, 310), 'hair'), headFront: h.Ld('M13,8l-1,7M9,9.5l-0.5,6', h.pal.bone[1], 2.2) + h.F('M10,11q9,8 3,18q-5,-7 -5,-17Z', 'cloth') + h.Ld('M-6,6a6,6 0 1,0 0.1,0', h.pal.gold[1], 1.8),
        chest: h.F(`M${h.pt(h.off(J.sN, -1, 14))}L${h.pt(h.off(J.sF, 2, 14))}L${h.pt(h.off(J.sF, 3, 36))}L${h.pt(h.off(J.sN, 0, 34))}Z`, 'cloth') + [0.1, 0.3, 0.5, 0.7, 0.9].map(t => h.dot(h.mix(h.off(J.sN, 4, 44), h.off(J.sF, 0, 46), t).map((v, i) => i ? v + Math.sin(t * 3.14) * 12 : v), 4.2, h.pal.bone[1])).join(''),
        front: h.F('M' + pg.map(h.pt).join('L') + 'Z', 'rock') + h.Ld(h.seg(pg[1], h.off(c0, 2, -4)) + h.seg(h.off(c0, 2, -4), pg[5]) + h.seg(h.off(c0, 2, -4), pg[3]), '#1a1818', 1.3, 0.7) }; } },
  { id: 'subahu', name: 'Subahu', dev: 'सुबाहु', role: 'Boss of night six. Leads the ground host.', mood: 'blood', sc: 1.02, cx: 150, demon: 1, armor: 1, k: 1.4, headS: 0.86, eye: '#ffe36a',
    len: { thigh: 70, shin: 68, torso: 90, upper: 58, fore: 54 },
    pal: { skin: ['#3a0a0c', '#b02a2a'], cloth: ['#0c1a12', '#1f6a44'], cloth2: ['#12060a', '#5a1626'], gold: P.gold, hair: P.hair, prop: P.gold, bone: P.bone },
    pose: { lean: 4, turn: 0.2, nLeg: [-25, -5], fLeg: [28, 2], nArm: [-22, 30], fArm: [62, 152], head: 0 },
    extra: h => { const { J } = h;
      return { behind: h.F(`M${h.pt(h.off(J.sN, 4, -6))}Q${f(J.sN[0] - 90)},${f(J.sN[1] + 70)} ${f(J.sN[0] - 96)},-10q14,-12 26,2q10,-14 24,-2q12,-12 26,-2q10,-10 24,0L${h.pt(h.off(J.sF, -6, 0))}Z`, 'cloth2'),
        farHand: club(h, J.hF, 176, 92, 20, 0) + h.dot(h.add(J.hF, 176, 92), 7, '#ff5a4a', 1),
        chest: h.Ld(`M${h.pt(h.off(J.sN, 4, 10))}Q${h.pt(h.off(J.nb, 2, 44))} ${h.pt(h.off(J.sF, -2, 10))}M${h.pt(h.off(J.sN, 2, 30))}Q${h.pt(h.off(J.nb, 2, 62))} ${h.pt(h.off(J.sF, 0, 30))}`, h.pal.gold[0], 1.8, 0.8) + h.dot(h.off(J.nb, 3, 30), 6, '#ff5a4a', 1),
        headBack: h.F(HAIR, 'hair') + h.F(HORNS, 'bone'), headFront: crown(h, 2) + h.F('M10,12Q20,6 19,-6Q14,3 7,8Z', 'bone') + h.Ld('M14,6Q4,5 -2,12', '#0a0608', 3), front: '' }; } },
  { id: 'maricha', name: 'Maricha', dev: 'मारीच', role: 'Boss of night six. Master of illusion, later the golden deer.', mood: 'mirage', sc: 1.02, cx: 176, lift: 62, demon: 1, wear: 'loin', eye: '#7affd8',
    pal: { skin: ['#5a3e08', '#dcae30'], cloth: ['#1a0a2e', '#6a34a8'], cloth2: ['#1a0a2e', '#6a34a8'], gold: P.gold, hair: P.hair, prop: P.white, bone: P.bone },
    pose: { lean: 20, turn: 0.45, nLeg: [-52, -104], fLeg: [82, -28], nArm: [-140, 182], fArm: [72, 98], head: -8 },
    extra: h => { const { J } = h, t = h.add(J.hN, 190, 96);
      return { behind: h.F(h.ribbon(h.off(J.pel, -6, 0), 160, 110, 12, 12, 0.5), 'cloth') + h.F(h.ribbon(h.off(J.sN, 0, 0), 175, 130, 14, 14, 2), 'cloth'),
        headBack: h.F(HAIR, 'hair'), headFront: crown(h, 1) + h.Ld('M-4,-20Q-10,-40 0,-56M-6,-36l-13,-9M-3,-46l-11,-8M6,-20Q8,-40 20,-54M8,-36l13,-6M13,-46l11,-5', h.pal.gold[1], 2.6) + h.Ld('M13,8l-1,5', h.pal.bone[1], 1.6),
        chest: jewel(h), farHand: h.dot(h.off(J.hF, 10, 0), 16, h.glow, 1).replace('/>', ' opacity=".55"/>') + h.dot(h.off(J.hF, 10, 0), 4, '#fff'),
        front: h.F(`M${h.pt(h.off(J.hN, -3, 0))}Q${h.pt(h.off(h.mix(J.hN, t, 0.5), -16, 0))} ${h.pt(t)}Q${h.pt(h.off(h.mix(J.hN, t, 0.5), 2, 4))} ${h.pt(h.off(J.hN, 5, 0))}Z`, 'prop') + h.Ld(h.seg(h.off(J.hN, -9, 3), h.off(J.hN, 10, -1)), h.pal.gold[1], 4) }; },
    ghost: '<g transform="translate(78 392)" fill="none" stroke="#ffe08a" stroke-linecap="round" opacity=".5" filter="url(#glow)"><path d="M-30,-40q28,-12 56,0" stroke-width="20"/><path d="M26,-44l14,-30" stroke-width="9"/><path d="M40,-78l12,2" stroke-width="9"/><path d="M-30,-34l-6,34M-18,-32l2,32M22,-32l-4,32M30,-34l8,34" stroke-width="3.4"/><path d="M40,-84q-4,-16 4,-28M40,-92l-10,-8M44,-84q6,-14 16,-18M48,-94l10,-2" stroke-width="2.2"/><path d="M-38,-44l-8,-6" stroke-width="4"/></g>' },
];

function card(c, i) {
  const m = MOODS[c.mood], [lx, ly] = m.L;
  const grads = Object.entries({ flame: ['#ff5a10', '#ffd24a'], slime: ['#2a6a1a', '#8aff5a'], ...c.pal }).map(([r, [dk, md]]) => `<linearGradient id="${c.id}-${r}" x1="${f(0.5 - lx * 0.5)}" y1="${f(0.5 - ly * 0.5)}" x2="${f(0.5 + lx * 0.5)}" y2="${f(0.5 + ly * 0.5)}"><stop offset="0" stop-color="${dk}"/><stop offset=".44" stop-color="${dk}"/><stop offset=".48" stop-color="${md}"/><stop offset=".84" stop-color="${md}"/><stop offset=".87" stop-color="${m.rim}"/><stop offset="1" stop-color="${m.rim}"/></linearGradient>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${c.name}"><defs><linearGradient id="sky-${c.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${m.sky[0]}"/><stop offset=".5" stop-color="${m.sky[1]}"/><stop offset=".88" stop-color="${m.sky[2]}"/></linearGradient>${grads}</defs>
${backdrop(m, 11 + i * 7, c.id)}${c.ghost || ''}<ellipse cx="${c.cx}" cy="${GY + 2}" rx="${c.lift ? 46 : 78}" ry="${c.lift ? 5 : 8}" fill="#000" opacity="${c.lift ? 0.3 : 0.5}"/>
<g transform="translate(${c.cx} ${GY}) scale(${c.sc})" fill="none" stroke-linecap="round" stroke-linejoin="round">${figure(c, m)}</g>
${foreground(m, i)}<rect width="${W}" height="${H}" fill="url(#vig)"/><rect width="${W}" height="${H}" filter="url(#grain2)" opacity=".5"/>
<text x="22" y="${H - 44}" font-family="'Tiro Devanagari Sanskrit',serif" font-size="15" fill="${m.rim}" opacity=".85">${c.dev}</text><text x="21" y="${H - 16}" font-family="Marcellus,serif" font-size="27" letter-spacing="3" fill="#fff6e2">${c.name.toUpperCase()}</text><path d="M22,${H - 62}h34" stroke="${m.rim}" stroke-width="1.4"/></svg>`;
}

const defs = () => `<svg width="0" height="0" style="position:absolute"><defs>
<radialGradient id="fireglow"><stop offset="0" stop-color="#ffb347" stop-opacity=".85"/><stop offset=".35" stop-color="#ff7a1a" stop-opacity=".4"/><stop offset="1" stop-color="#ff5a10" stop-opacity="0"/></radialGradient>
<radialGradient id="vig" cx="50%" cy="46%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>
<filter id="blur8" x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="grain2" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="9"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .4  0 0 0 .22 0"/></filter>
</defs></svg>`;

return { CAST, card, defs };
})();
