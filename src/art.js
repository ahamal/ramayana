// art.js — one jointed figure rig, drawn in five traditional styles. Everything is SVG built in code.
const Art = (() => {
const f = n => Math.round(n * 10) / 10;
const rad = a => a * Math.PI / 180;
const W = 300, H = 440;

// ---------- styles ----------
const frame = (inset, fill) => `<path fill-rule="evenodd" d="M0,0H${W}V${H}H0Z M${inset},${inset}V${H - inset}H${W - inset}V${inset}Z" fill="${fill}"/>`;
const STYLES = {
  puppet: {
    name: 'Shadow puppet', sub: 'Tholu Bommalata · Andhra and Karnataka',
    blurb: 'Dyed, translucent leather figures with punched-hole ornament, held on bamboo rods against a lamp-lit cloth. Joints are riveted, so limbs swing. The Ramayana is this tradition’s main repertoire, and it is performed at night by firelight.',
    line: '#160a05', lw: 2.5, alpha: 0.88, rods: true,
    pal: { hole: '#ffeeb0', gold: '#e6a726', red: '#b8222c', green: '#1f8050', blue: '#1d52a6', saffron: '#e5861a', white: '#f6e6ba', black: '#22130c', wood: '#6a3b1a', bone: '#f0e1b8', stone: '#9c8f7a', hair: '#170d08', rama: '#2a70b8', lak: '#e6b340', fair: '#d8954e', sage: '#c8853e', dRed: '#b53325', dDark: '#553562', dGreen: '#3c8257', dGold: '#cf9f28', dBlue: '#2f5a86' },
    bg: () => `<rect width="${W}" height="${H}" fill="url(#lampG)"/><rect width="${W}" height="${H}" filter="url(#grain)" opacity=".4"/><rect width="${W}" height="${H}" fill="#ff7a10" opacity="0"><animate attributeName="opacity" values="0;.09;.02;.12;.04;0" dur="2.7s" repeatCount="indefinite"/></rect><path d="M0,${H - 14}H${W}V${H}H0Z" fill="#1a0b04" opacity=".85"/>`,
  },
  patta: {
    name: 'Pattachitra', sub: 'Cloth scroll painting · Odisha',
    blurb: 'Thick black outlines, flat mineral colour on a red ground, white dot ornament and a patterned border on every panel. It reads clearly at small sizes, which suits a game seen from a distance.',
    line: '#120d0d', lw: 2.8,
    pal: { hole: '#ffffff', gold: '#f4b81e', red: '#c62b1d', green: '#2f8040', blue: '#1f4396', saffron: '#f28c1c', white: '#fbf3df', black: '#141010', wood: '#7c4b22', bone: '#f5ebd0', stone: '#b9b3a6', hair: '#0e0b0b', rama: '#2f66bd', lak: '#f5d24c', fair: '#f1c890', sage: '#e4aa68', dRed: '#e0562c', dDark: '#3c2e4e', dGreen: '#4c8f4c', dGold: '#dba822', dBlue: '#35527e' },
    bg: () => {
      let s = `<rect width="${W}" height="${H}" fill="#9f1f18"/>`;
      for (let i = 0; i < 26; i++) { const x = 30 + (i * 97) % 240, y = 30 + (i * 151) % 380; s += `<g fill="#f6d9a0" opacity=".8"><circle cx="${x}" cy="${y}" r="1.6"/><circle cx="${x + 4}" cy="${y}" r="1.2"/><circle cx="${x - 4}" cy="${y}" r="1.2"/><circle cx="${x}" cy="${y + 4}" r="1.2"/><circle cx="${x}" cy="${y - 4}" r="1.2"/></g>`; }
      return s + frame(16, 'url(#patta-border)') + `<rect x="16" y="16" width="${W - 32}" height="${H - 32}" fill="none" stroke="#120d0d" stroke-width="2.5"/><rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="#120d0d" stroke-width="2"/>`;
    },
  },
  mural: {
    name: 'Kerala mural', sub: 'Temple wall painting · Kerala',
    blurb: 'Five earth colours: ochre, red, green, black and white. Forms are rounded and shaded for volume, noble figures are green-skinned and demons dark or red, the same convention Kathakali uses.',
    line: '#3a0f08', lw: 2.1, shade: true,
    pal: { hole: '#fff4d6', gold: '#e2a62a', red: '#b5351f', green: '#3f7c46', blue: '#2f5c7c', saffron: '#da842a', white: '#f5ead0', black: '#1c1410', wood: '#6e3f1e', bone: '#efe0bd', stone: '#a79f90', hair: '#120c0a', rama: '#3f8c5c', lak: '#e9b84a', fair: '#e2a262', sage: '#d59c54', dRed: '#aa321f', dDark: '#34302f', dGreen: '#58753b', dGold: '#ca972a', dBlue: '#3b5068' },
    bg: () => `<rect width="${W}" height="${H}" fill="url(#muralG)"/><rect width="${W}" height="${H}" filter="url(#grain)" opacity=".5"/>` + frame(12, '#7a1c10') + `<rect x="12" y="12" width="${W - 24}" height="${H - 24}" fill="none" stroke="#f5ead0" stroke-width="1.6"/><rect x="5" y="5" width="${W - 10}" height="${H - 10}" fill="none" stroke="#e2a62a" stroke-width="1.2" stroke-dasharray="2 5"/>`,
  },
  kalam: {
    name: 'Kalamkari', sub: 'Pen-drawn dyed cloth · Srikalahasti',
    blurb: 'Drawn with a bamboo pen on cotton and coloured with vegetable dyes: indigo, madder red, iron black and a soft yellow. Quieter and more hand-made than the others.',
    line: '#2a1c18', lw: 1.6, alpha: 0.92,
    pal: { hole: '#f2e8cf', gold: '#c9a23a', red: '#9c3a2a', green: '#5f6f3a', blue: '#2f3f66', saffron: '#c98a3a', white: '#efe5cb', black: '#2a1f1c', wood: '#6b4a2e', bone: '#e6d9b8', stone: '#a39a88', hair: '#231a18', rama: '#3f5f8a', lak: '#d9b860', fair: '#d9b088', sage: '#c99c6c', dRed: '#a34a34', dDark: '#4a3f4f', dGreen: '#6f7f52', dGold: '#b8963f', dBlue: '#44566e' },
    bg: () => `<rect width="${W}" height="${H}" fill="#e7d9ba"/><rect width="${W}" height="${H}" filter="url(#weave)" opacity=".55"/>` + frame(15, 'url(#kalam-border)') + `<rect x="15" y="15" width="${W - 30}" height="${H - 30}" fill="none" stroke="#2a1c18" stroke-width="1.4"/>`,
  },
  mini: {
    name: 'Pahari miniature', sub: 'Court painting · Kangra and Guler',
    blurb: 'Fine brown line, soft opaque colour and touches of gold, with figures set in a pale landscape inside a dark border. The most delicate of the five, and the hardest to read at game scale.',
    line: '#4a3626', lw: 1.15,
    pal: { hole: '#fffaf0', gold: '#d4af37', red: '#c8553d', green: '#6f9a6a', blue: '#5a7fb0', saffron: '#e8a24a', white: '#faf5e6', black: '#2b2622', wood: '#8a6a48', bone: '#f0e8d4', stone: '#b8b4aa', hair: '#221c1a', rama: '#6f9fd0', lak: '#f0d890', fair: '#f2cfa8', sage: '#e0b890', dRed: '#c86a50', dDark: '#6a5a78', dGreen: '#8aa878', dGold: '#d8b860', dBlue: '#6a7f9a' },
    bg: () => {
      let s = `<rect width="${W}" height="${H}" fill="url(#skyG)"/><path d="M0,330 Q80,280 160,318 T${W},300 V${H}H0Z" fill="#a9c193"/><path d="M0,380 Q120,356 ${W},384 V${H}H0Z" fill="#8fae7c"/>`;
      for (let i = 0; i < 9; i++) { const x = 30 + i * 31, y = 312 - ((i * 37) % 22); s += `<path d="M${x},${y + 14}V${y}" stroke="#5c4a34" stroke-width="1"/><circle cx="${x}" cy="${y - 4}" r="${6 + i % 3}" fill="#5f8a5c" stroke="#3f6a44" stroke-width=".6"/>`; }
      return s + `<rect width="${W}" height="${H}" filter="url(#grain)" opacity=".25"/>` + frame(14, '#1d2a4a') + `<rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="#d4af37" stroke-width="1.6"/><rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="none" stroke="#d4af37" stroke-width=".7" stroke-dasharray="1 4"/>`;
    },
  },
  master: {
    name: 'Master puppet', sub: 'Shadow puppet, cut by a master craftsman',
    blurb: 'The shadow puppet taken further: finer line inside a bold cut contour, tooled leather grain, floral filigree instead of plain dots, and pierced ornament that glows where the lamp shines through. Drawn hands, flying crown ribbons and flower garlands replace the simple shapes.',
    line: '#120703', lw: 1.5, rods: true, master: true,
    pal: { hole: '#fff6c8', gold: '#f0b22a', red: '#d0262e', green: '#1f9a5c', blue: '#2360c4', saffron: '#f28f1a', white: '#f1dfb4', black: '#2a1810', wood: '#8a4e22', bone: '#ecdcb4', stone: '#b3a48c', hair: '#1c0f08', rama: '#2f7fd0', lak: '#f0bf45', fair: '#e3a05a', sage: '#d6944a', dRed: '#c93a28', dDark: '#6a4280', dGreen: '#3f9a66', dGold: '#dcab2c', dBlue: '#3068a0' },
    bg: () => {
      let s = `<rect width="${W}" height="${H}" fill="url(#lampG)"/>`;
      for (let x = 24; x < W; x += 46) s += `<path d="M${x},0Q${x + 6},${H / 2} ${x - 3},${H}" stroke="#7a3a08" stroke-width="1.3" opacity=".15" fill="none"/>`;
      s += `<rect width="${W}" height="${H}" filter="url(#grain)" opacity=".4"/><path d="M0,0H${W}V12Q${W / 2},28 0,12Z" fill="#1c0a03"/>`;
      for (let i = 0; i <= 12; i++) { const x = i * 25, y = 12 + Math.sin(i / 12 * Math.PI) * 12; s += i % 2 ? `<circle cx="${x}" cy="${f(y + 7)}" r="5.5" fill="#b8440f"/><circle cx="${x}" cy="${f(y + 7)}" r="2" fill="#ffd27a"/>` : `<path d="M${x},${f(y)}q-8,15 0,32q8,-17 0,-32Z" fill="#33400f"/><path d="M${x},${f(y + 3)}v24" stroke="#ffd27a" stroke-width=".6" opacity=".6"/>`; }
      s += `<path d="M0,${H - 16}H${W}V${H}H0Z" fill="#160803"/>`;
      for (const x of [34, 266]) s += `<circle cx="${x}" cy="${H - 28}" r="20" fill="#ffb040" opacity=".28"/><path d="M${x - 10},${H - 17}q10,10 20,0Z" fill="#160803"/><path d="M${x},${H - 17}q-5,-9 0,-19q5,10 0,19Z" fill="#fff2b0"><animate attributeName="opacity" values="1;.7;1;.85;1" dur="1.3s" repeatCount="indefinite"/></path>`;
      return s + `<rect width="${W}" height="${H}" fill="#ff7a10" opacity="0"><animate attributeName="opacity" values="0;.08;.02;.11;.04;0" dur="2.7s" repeatCount="indefinite"/></rect>`;
    },
    fg: () => `<rect width="${W}" height="${H}" fill="url(#hotG)" style="mix-blend-mode:soft-light"/><rect width="${W}" height="${H}" fill="url(#vigG)"/>`,
  },
};

// Shared filters, gradients and per-style cloth patterns; injected once per page.
function defs() {
  let s = `<svg width="0" height="0" style="position:absolute"><defs>
<radialGradient id="lampG" cx="50%" cy="46%" r="70%"><stop offset="0" stop-color="#fff6cf"/><stop offset=".4" stop-color="#ffd682"/><stop offset=".78" stop-color="#e8983a"/><stop offset="1" stop-color="#8a3f10"/></radialGradient>
<radialGradient id="muralG" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#e0a548"/><stop offset=".7" stop-color="#c98430"/><stop offset="1" stop-color="#a55a20"/></radialGradient>
<linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd6d8"/><stop offset=".6" stop-color="#f1ead2"/><stop offset="1" stop-color="#e6dcb8"/></linearGradient>
<linearGradient id="shadeG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#3a0800" stop-opacity=".42"/></linearGradient>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .25  0 0 0 0 .12  0 0 0 0 0  0 0 0 .6 0"/></filter>
<filter id="weave" x="0" y="0" width="100%" height="100%"><feTurbulence type="turbulence" baseFrequency=".9 .08" numOctaves="2" seed="2"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .15  0 0 0 .5 0"/></filter>
<radialGradient id="hotG" cx="50%" cy="48%" r="64%"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
<radialGradient id="vigG" cx="50%" cy="48%" r="76%"><stop offset=".62" stop-color="#1a0800" stop-opacity="0"/><stop offset="1" stop-color="#1a0800" stop-opacity=".7"/></radialGradient>
<filter id="masterFx" x="-30%" y="-15%" width="160%" height="130%" color-interpolation-filters="sRGB">
<feMorphology in="SourceAlpha" operator="dilate" radius="1.4" result="d"/><feFlood flood-color="#120703" result="k"/><feComposite in="k" in2="d" operator="in" result="outline"/>
<feGaussianBlur in="d" stdDeviation="7" result="sb"/><feColorMatrix in="sb" values="0 0 0 0 .3  0 0 0 0 .1  0 0 0 0 0  0 0 0 .55 0" result="shadow"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="3" result="ib"/><feComposite in="SourceAlpha" in2="ib" operator="out" result="r0"/><feColorMatrix in="r0" values="0 0 0 0 .2  0 0 0 0 .05  0 0 0 0 0  0 0 0 .8 0" result="rim"/>
<feColorMatrix in="SourceGraphic" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  12 12 12 0 -31.4" result="bright"/><feGaussianBlur in="bright" stdDeviation="2.4" result="glow"/>
<feMerge><feMergeNode in="shadow"/><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/><feMergeNode in="rim"/><feMergeNode in="glow"/><feMergeNode in="glow"/></feMerge></filter>
<pattern id="master-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><path d="M0,2.5H5" stroke="#200a00" stroke-width=".7" opacity=".17"/></pattern>
<pattern id="patta-border" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#f4b81e"/><path d="M0,16L8,3L16,16Z" fill="#141010"/><circle cx="8" cy="11" r="1.7" fill="#fff"/><circle cx="0" cy="4" r="1.3" fill="#c62b1d"/><circle cx="16" cy="4" r="1.3" fill="#c62b1d"/></pattern>
<pattern id="kalam-border" width="18" height="15" patternUnits="userSpaceOnUse"><rect width="18" height="15" fill="#9c3a2a"/><path d="M1,7.5Q5,1 9,7.5T17,7.5" fill="none" stroke="#efe5cb" stroke-width="1.1"/><circle cx="9" cy="7.5" r="1.6" fill="#2f3f66"/><circle cx="0" cy="7.5" r="1.3" fill="#c9a23a"/><circle cx="18" cy="7.5" r="1.3" fill="#c9a23a"/></pattern>`;
  for (const [id, st] of Object.entries(STYLES)) {
    const m = st.pal.hole, k = st.line;
    if (st.master) {
      let ro = ''; for (let i = 0; i < 6; i++) ro += `<circle cx="${f(6 + Math.cos(i * 1.047) * 3.7)}" cy="${f(6 + Math.sin(i * 1.047) * 3.7)}" r=".8"/>`;
      s += `<pattern id="${id}-dots" width="12" height="12" patternUnits="userSpaceOnUse"><g fill="${m}"><circle cx="6" cy="6" r="1.5"/>${ro}<circle cx="0" cy="0" r=".7"/><circle cx="12" cy="12" r=".7"/></g></pattern>
<pattern id="${id}-dia" width="16" height="16" patternUnits="userSpaceOnUse"><g fill="${m}"><ellipse cx="8" cy="4" rx="1.3" ry="2.7"/><ellipse cx="8" cy="12" rx="1.3" ry="2.7"/><ellipse cx="4" cy="8" rx="2.7" ry="1.3"/><ellipse cx="12" cy="8" rx="2.7" ry="1.3"/><circle cx="8" cy="8" r="1.2"/><circle cx="0" cy="0" r="1.2"/><circle cx="16" cy="0" r="1.2"/><circle cx="0" cy="16" r="1.2"/><circle cx="16" cy="16" r="1.2"/><circle cx="8" cy="0" r=".6"/><circle cx="0" cy="8" r=".6"/><circle cx="8" cy="16" r=".6"/><circle cx="16" cy="8" r=".6"/></g></pattern>
<pattern id="${id}-stripe" width="12" height="12" patternUnits="userSpaceOnUse"><g fill="${m}"><path d="M2.5,6q3.5,-5 7,0q-3.5,5 -7,0Z"/><circle cx="0" cy="6" r=".8"/><circle cx="12" cy="6" r=".8"/><circle cx="3" cy="0" r=".7"/><circle cx="9" cy="0" r=".7"/><circle cx="3" cy="12" r=".7"/><circle cx="9" cy="12" r=".7"/></g></pattern>
<pattern id="${id}-scale" width="10" height="8" patternUnits="userSpaceOnUse"><path d="M0,0Q5,9 10,0" fill="none" stroke="${k}" stroke-width=".8"/><circle cx="5" cy="2.2" r=".9" fill="${m}"/><circle cx="0" cy="6" r=".6" fill="${m}"/></pattern>
<pattern id="${id}-tiger" width="16" height="12" patternUnits="userSpaceOnUse"><path d="M1,2Q5,6 2,10M9,0Q13,5 10,9" fill="none" stroke="${k}" stroke-width="1.8" stroke-linecap="round"/><circle cx="6" cy="6" r=".7" fill="${m}"/><circle cx="14" cy="3" r=".7" fill="${m}"/></pattern>`;
      continue;
    }
    s += `<pattern id="${id}-dots" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.25" fill="${m}"/><circle cx="7" cy="7" r="1.25" fill="${m}"/></pattern>
<pattern id="${id}-stripe" width="10" height="11" patternUnits="userSpaceOnUse"><path d="M0,5.5H10" stroke="${m}" stroke-width="1.5"/><circle cx="5" cy="0" r="1" fill="${m}"/><circle cx="0" cy="11" r="1" fill="${m}"/></pattern>
<pattern id="${id}-dia" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M7,1L13,7L7,13L1,7Z" fill="none" stroke="${m}" stroke-width="1.05"/><circle cx="7" cy="7" r="1.5" fill="${m}"/><circle cx="0" cy="0" r="1" fill="${m}"/><circle cx="14" cy="14" r="1" fill="${m}"/></pattern>
<pattern id="${id}-scale" width="10" height="8" patternUnits="userSpaceOnUse"><path d="M0,0Q5,9 10,0" fill="none" stroke="${k}" stroke-width=".9"/><circle cx="5" cy="2" r=".9" fill="${m}"/></pattern>
<pattern id="${id}-tiger" width="16" height="12" patternUnits="userSpaceOnUse"><path d="M1,2Q5,6 2,10M9,0Q13,5 10,9" fill="none" stroke="${k}" stroke-width="2" stroke-linecap="round"/></pattern>`;
  }
  return s + '</defs></svg>';
}

// ---------- the rig ----------
// Figure space: feet at y=0, y negative is up, facing right. Angles are degrees from straight down, positive = forward.
function figure(c, sid) {
  const st = STYLES[sid], b = c.build || 1, L = st.lw, K = st.line, skin = c.skin, bw = c.arm || (b > 1.2 ? 1.35 : 1);
  let o = '';
  const col = r => st.pal[r] || r;
  const op = st.alpha ? ` fill-opacity="${st.alpha}"` : '';
  const P = (d, fill, flat) => { o += `<path d="${d}" fill="${col(fill)}"${op} stroke="${K}" stroke-width="${L}" stroke-linejoin="round"/>`; if (st.shade && !flat) o += `<path d="${d}" fill="url(#shadeG)"/>`; if (st.master && fill === skin) o += `<path d="${d}" fill="url(#master-hatch)"/>`; };
  const pat = (d, id) => { if (id && id !== 'none') o += `<path d="${d}" fill="url(#${sid}-${id})"/>`; };
  const Ln = (d, stroke, w) => { o += `<path d="${d}" fill="none" stroke="${stroke ? col(stroke) : K}" stroke-width="${w || L * 0.6}" stroke-linecap="round" stroke-linejoin="round"/>`; };
  const gold = (d, w, fill = 'gold') => { Ln(d, K, w + L * 1.3); Ln(d, fill, w); };
  const C = (x, y, r, fill, w) => { o += `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${col(fill)}" stroke="${K}" stroke-width="${w === undefined ? L * 0.55 : w}"/>`; };
  const dotsQ = (x1, y1, cx, cy, x2, y2, n, r = 1.3, fill = 'hole') => { for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; C(u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y1 + 2 * u * t * cy + t * t * y2, r, fill, fill === 'hole' ? 0 : L * 0.35); } };
  const dots = (x1, y1, x2, y2, n, r, fill) => dotsQ(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2, x2, y2, n, r, fill);
  const limb = (x1, y1, x2, y2, w1, w2, fill) => {
    const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a), ny = Math.cos(a), A = `${f(x1 + nx * w1)},${f(y1 + ny * w1)}`, B = `${f(x2 + nx * w2)},${f(y2 + ny * w2)}`, Cc = `${f(x2 - nx * w2)},${f(y2 - ny * w2)}`, D = `${f(x1 - nx * w1)},${f(y1 - ny * w1)}`;
    if (!st.master) return P(`M${A}L${B}L${Cc}L${D}Z`, fill);
    const mx = x1 + (x2 - x1) * 0.38, my = y1 + (y2 - y1) * 0.38, k = w1 * 1.32;
    P(`M${A}Q${f(mx + nx * k)},${f(my + ny * k)} ${B}L${Cc}Q${f(mx - nx * k)},${f(my - ny * k)} ${D}Z`, fill);
  };
  const band = (x1, y1, x2, y2, t, w, wd = 3, fill = 'gold') => { const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a) * w, ny = Math.cos(a) * w, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t; gold(`M${f(x + nx)},${f(y + ny)}L${f(x - nx)},${f(y - ny)}`, wd, fill); };
  const rivet = (x, y) => { if (st.rods) { C(x, y, 2.6, K, 0); C(x - 0.7, y - 0.7, 0.8, 'hole', 0); } };

  function arm(sx, sy, a1, a2, swing) {
    const U = 46, F = 42, ex = sx + Math.sin(rad(a1)) * U, ey = sy + Math.cos(rad(a1)) * U, hx = ex + Math.sin(rad(a2)) * F, hy = ey + Math.cos(rad(a2)) * F;
    if (swing && st.rods) o += `<g><animateTransform attributeName="transform" type="rotate" values="-3 ${f(sx)} ${f(sy)};4 ${f(sx)} ${f(sy)};-3 ${f(sx)} ${f(sy)}" dur="4.6s" repeatCount="indefinite"/>`;
    limb(sx, sy, ex, ey, 8.5 * bw, 6.8 * bw, skin); limb(ex, ey, hx, hy, 6.8 * bw, 5.2 * bw, skin);
    C(ex, ey, 6.8 * bw, skin); C(sx, sy, 9 * bw, skin);
    if (!c.plain) { band(sx, sy, ex, ey, 0.42, 8.6 * bw, 4.2); C(sx + (ex - sx) * 0.42, sy + (ey - sy) * 0.42, 2.4, c.demon ? 'bone' : 'red'); }
    band(ex, ey, hx, hy, 0.74, 6.2 * bw, 2.4, c.demon ? 'bone' : 'gold'); band(ex, ey, hx, hy, 0.86, 5.8 * bw, 2.4, c.demon ? 'bone' : 'gold');
    if (st.master) { o += `<g transform="translate(${f(hx)} ${f(hy)}) rotate(${f(-a2)}) scale(${bw})">`; P('M-5.5,-3Q-7.5,5 -5,11L-4.5,19Q-3,22 -1.6,19L-1.4,12L-0.6,21Q1,24 2.4,21L2.6,12L3.6,19.5Q5,22 6.2,19L6,9Q9,13 11.5,11Q10,3 5.5,-3Z', skin); o += '</g>'; }
    else C(hx, hy, 6.4 * bw, skin);
    if (c.claws) for (const k of [-0.5, 0, 0.5]) { const a = rad(a2) + k; P(`M${f(hx + Math.sin(a - 0.25) * 6)},${f(hy + Math.cos(a - 0.25) * 6)}L${f(hx + Math.sin(a) * 15 * bw)},${f(hy + Math.cos(a) * 15 * bw)}L${f(hx + Math.sin(a + 0.25) * 6)},${f(hy + Math.cos(a + 0.25) * 6)}Z`, 'bone', 1); }
    else Ln(`M${f(hx + Math.sin(rad(a2)) * 4 - 3)},${f(hy + Math.cos(rad(a2)) * 4)}l5,2`);
    rivet(sx, sy); rivet(ex, ey);
    return [hx, hy];
  }

  function item(kind, x, y) {
    if (kind === 'bow') {
      const d = `M${x - 6},${y - 100}Q${x + 32},${y - 58} ${x + 4},${y - 11}L${x + 4},${y + 11}Q${x + 32},${y + 58} ${x - 6},${y + 100}`;
      Ln(`M${x - 6},${y - 100}L${x - 6},${y + 100}`, K, 1.1); gold(d, 5, 'wood');
      gold(`M${x + 4},${y - 12}L${x + 4},${y + 12}`, 6.5); dotsQ(x + 8, y - 80, x + 24, y - 55, x + 12, y - 26, 5, 1); dotsQ(x + 8, y + 80, x + 24, y + 55, x + 12, y + 26, 5, 1);
      for (const s of [-1, 1]) { P(`M${x - 6},${y + 100 * s}q8,${-6 * s} 12,${-16 * s}q-10,${4 * s} -12,${16 * s}Z`, 'gold'); C(x - 6, y + 104 * s, 2.6, 'red'); }
    } else if (kind === 'arrow') {
      gold(`M${x - 8},${y + 44}L${x + 12},${y - 62}`, 2.2, 'wood');
      P(`M${x + 12},${y - 62}l-6,3l11,-22l-1,23Z`, 'white'); for (const k of [0, 7, 14]) Ln(`M${f(x - 8 + k * 0.19)},${y + 44 - k}l-7,5M${f(x - 8 + k * 0.19)},${y + 44 - k}l6,7`, 'red', 1.6);
    } else if (kind === 'club' || kind === 'mace') {
      const up = c.itemDown ? 1 : -1, tx = x + (c.itemDown ? 14 : 20), ty = c.itemDown ? -24 : y - 78, R = kind === 'mace' ? 19 : 17 * bw;
      gold(`M${x - 4},${y - 14 * up}L${tx},${ty}`, 5.5 * bw, 'wood');
      if (kind === 'club') for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; P(`M${f(tx + Math.cos(a - 0.22) * R)},${f(ty + Math.sin(a - 0.22) * R)}L${f(tx + Math.cos(a) * (R + 9))},${f(ty + Math.sin(a) * (R + 9))}L${f(tx + Math.cos(a + 0.22) * R)},${f(ty + Math.sin(a + 0.22) * R)}Z`, 'bone', 1); }
      C(tx, ty, R, kind === 'mace' ? 'gold' : 'wood');
      if (kind === 'mace') { for (const k of [-0.55, 0, 0.55]) Ln(`M${f(tx + k * R)},${f(ty - R * Math.sqrt(1 - k * k))}Q${f(tx + k * R * 1.7)},${ty} ${f(tx + k * R)},${f(ty + R * Math.sqrt(1 - k * k))}`); C(tx, ty, 5, 'red'); P(`M${tx - 5},${ty - R}q5,-18 10,0Z`, 'gold'); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; C(tx + Math.cos(a) * R * 0.62, ty + Math.sin(a) * R * 0.62, 1.4, 'hole', 0); }
    } else if (kind === 'staff') {
      gold(`M${x},${y - 112}L${x},0`, 4, 'wood'); P(`M${x},${y - 104}q22,-4 26,10q-12,-2 -16,6q-4,-8 -10,-6Z`, 'saffron'); C(x, y - 114, 4.5, 'gold');
      for (const k of [-70, -30, 40, 90]) Ln(`M${x - 3},${y + k}h6`);
    } else if (kind === 'kamandalu') {
      Ln(`M${x - 8},${y + 10}Q${x},${y - 6} ${x + 8},${y + 10}`, K, L); P(`M${x - 5},${y + 9}h10l2,6q10,6 8,18q-3,11 -15,11t-15,-11q-2,-12 8,-18Z`, 'gold');
      P(`M${x + 12},${y + 22}l12,-7l1,4l-10,8Z`, 'gold'); dots(x - 10, y + 30, x + 10, y + 30, 5, 1.2); Ln(`M${x - 12},${y + 24}h24`);
    } else if (kind === 'wood') {
      for (let i = 0; i < 5; i++) gold(`M${x - 34 + i * 2},${y - 10 + i * 5}L${x + 30 + i * 2},${y - 26 + i * 5}`, 4.4, 'wood');
      gold(`M${x - 16},${y - 16}l8,24`, 2.4, 'red'); gold(`M${x + 12},${y - 23}l8,24`, 2.4, 'red');
    } else if (kind === 'rock') {
      const d = `M${x - 30},${y - 22}l8,-24l24,-12l26,10l8,24l-14,20l-34,4Z`; P(d, 'stone'); pat(d, 'dots');
      Ln(`M${x - 14},${y - 50}l10,14l-6,12M${x + 10},${y - 44}l6,16`);
    } else if (kind === 'pot') {
      P(`M${x - 16},${y - 4}h32q4,22 -16,26q-20,-4 -16,-26Z`, 'wood'); gold(`M${x - 18},${y - 5}h36`, 3.4); dots(x - 10, y + 6, x + 10, y + 6, 4, 1.3);
      for (const [k, l] of [[-9, 18], [2, 30], [11, 14]]) P(`M${x + k - 2.5},${y + 20}q2.5,${l} 2.5,${l}q0,0 2.5,${-l}Z`, 'red', 1);
    } else if (kind === 'sword') {
      P(`M${x - 4},${y - 10}q-10,-50 20,-96q10,2 10,2q-22,44 -18,92Z`, 'white'); Ln(`M${x + 2},${y - 16}q-6,-44 18,-80`);
      gold(`M${x - 13},${y - 8}h24`, 4.5); gold(`M${x - 1},${y - 6}v16`, 5.5, 'red'); C(x - 1, y + 13, 4, 'gold');
    }
  }

  // --- behind the body ---
  if (c.halo) { C(5, -272, 47, 'gold'); C(5, -272, 37, 'red'); for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283; C(5 + Math.cos(a) * 42, -272 + Math.sin(a) * 42, 1.5, 'hole', 0); } for (let i = 0; i < 13; i++) { const a = i / 13 * 6.283; P(`M${f(5 + Math.cos(a - 0.1) * 47)},${f(-272 + Math.sin(a - 0.1) * 47)}L${f(5 + Math.cos(a) * 56)},${f(-272 + Math.sin(a) * 56)}L${f(5 + Math.cos(a + 0.1) * 47)},${f(-272 + Math.sin(a + 0.1) * 47)}Z`, 'gold', 1); } }
  if (c.wings) for (const [tr, sw] of [['translate(8 -6) scale(-0.72 0.8)', 0], ['', 1]]) {
    o += `<g transform="${tr}">` + (st.rods && sw ? `<animateTransform attributeName="transform" type="rotate" values="-4 -14 -222;5 -14 -222;-4 -14 -222" dur="1.8s" repeatCount="indefinite"/>` : '');
    const d = 'M-14,-222Q-70,-306 -132,-290Q-114,-264 -120,-238Q-100,-246 -94,-214Q-76,-226 -66,-192Q-50,-206 -36,-170L-10,-180Z';
    P(d, c.wings); pat(d, 'scale');
    for (const [x, y] of [[-132, -290], [-120, -238], [-94, -214], [-66, -192]]) { Ln(`M-14,-222Q${x * 0.5 - 10},${y * 0.5 - 126} ${x},${y}`, null, L); dotsQ(-24, -224, x * 0.5 - 10, y * 0.5 - 122, x * 0.9, y * 0.96 - 8, 7, 1.2); }
    o += '</g>';
  }
  if (c.quiver) { P('M-44,-270L-27,-275L-12,-198L-30,-193Z', 'red'); pat('M-44,-270L-27,-275L-12,-198L-30,-193Z', 'dia'); gold('M-45,-268L-27,-273', 3.2); gold('M-33,-206L-15,-211', 3.2); for (const k of [0, 6, 12]) { Ln(`M${-42 + k},${-272 - k * 0.3}l-5,-26`, 'wood', 1.8); P(`M${-47 + k},${-298 - k * 0.3}l-6,-4l3,-12l6,6Z`, k === 6 ? 'white' : 'saffron', 1); } }
  if (c.locks) { const d = c.female ? 'M-18,-286Q-70,-250 -58,-170Q-50,-130 -62,-104Q-34,-128 -38,-172Q-20,-150 -30,-120Q-8,-160 -16,-232Z' : 'M-16,-264Q-42,-242 -32,-196Q-24,-212 -13,-232Z'; P(d, 'hair', 1); if (c.female) Ln('M-28,-262Q-58,-220 -50,-150M-22,-250Q-40,-210 -34,-160', 'stone', 1); }
  const [fx, fy] = arm(-30 * b, -224, c.far[0], c.far[1]);
  if (c.farItem) item(c.farItem, fx, fy);

  // --- legs and lower cloth ---
  const hem = c.hem || -32, xb = -20 * b - 1, xf = 16 * b;
  const foot = x => { P(`M${x - 9},-11L${x + 6},-11Q${x + 16},-7 ${x + 26},-3Q${x + 29},1 ${x + 22},1L${x - 9},1Q${x - 13},-5 ${x - 9},-11Z`, skin); Ln(`M${x + 16},-4l3,4M${x + 21},-3l2,3`); gold(`M${x - 9},-14h16`, 3, c.demon ? 'bone' : 'gold'); if (c.claws) for (const k of [18, 23, 28]) P(`M${x + k - 3},-1l8,-1l-6,5Z`, 'bone', 1); };
  for (const x of [xb, xf]) { limb(x, hem - 6, x, -10, 8.5 * bw, 6 * bw, skin); if (hem < -60) { C(x, hem + (-12 - hem) * 0.38, 7.6 * bw, skin); rivet(x, hem + (-12 - hem) * 0.38); } foot(x); }
  if (c.skirt) {
    const d = `M${-25 * b},-152L${25 * b},-152Q46,-80 44,-22L-46,-22Q-48,-80 ${-25 * b},-152Z`; P(d, c.skirt); pat(d, c.pat);
    for (const y of [-112, -72]) { gold(`M${-36 - (y + 112) * -0.12},${y}Q0,${y + 8} ${36 + (y + 112) * 0.1},${y}`, 3); }
    P('M-46,-34L44,-34L44,-22L-46,-22Z', 'gold'); dots(-40, -28, 38, -28, 14, 1.4); Ln('M-8,-150Q-14,-90 -10,-36M10,-150Q16,-90 14,-36');
  } else {
    const dB = `M${-24 * b},-152L2,-152L${xb + 13},${hem}L${xb - 12},${hem}Q${xb - 14},-92 ${-24 * b},-152Z`, dF = `M-2,-152L${24 * b},-152Q${xf + 15},-92 ${xf + 12},${hem}L${xf - 12},${hem}Z`;
    for (const [d, x] of [[dB, xb], [dF, xf]]) {
      P(d, c.dhoti); pat(d, c.pat);
      Ln(`M${x * 0.5 - 4},-146Q${x - 6},-100 ${x - 5},${hem + 2}M${x * 0.5 + 4},-146Q${x + 4},-100 ${x + 4},${hem + 2}`);
      P(`M${x - 12},${hem - 9}L${x + 12.5},${hem - 9}L${x + 12.5},${hem}L${x - 12},${hem}Z`, c.trim || 'gold'); dots(x - 8, hem - 4.5, x + 9, hem - 4.5, 4, 1.3);
    }
    const ft = Math.max(hem - 12, -150 + 44), fd = `M-8,-150L10,-150L17,${ft - 14}L2,${ft}L-12,${ft - 14}Z`;
    P(fd, c.sash || 'red'); for (const k of [-8, -3, 2, 7, 12]) Ln(`M1,-148L${k},${ft - 13}`); dots(-8, ft - 17, 13, ft - 17, 5, 1.2);
  }
  if (c.sashes) for (const s of [-1, 1]) { const d = `M${s * 24 * b},-150Q${s * 52 * b},-128 ${s * 46 * b},-92L${s * 34 * b},-98Q${s * 38 * b},-124 ${s * 20 * b},-142Z`; P(d, c.sash || 'red'); pat(d, 'stripe'); dots(s * 45 * b, -95, s * 35 * b, -100, 3, 1.2); }

  // --- torso ---
  const tor = `M${-34 * b},-232Q0,-241 ${34 * b},-232L${36 * b},-206Q${31 * b},-176 ${24 * b},-150L${-24 * b},-150Q${-31 * b},-176 ${-36 * b},-206Z`;
  P(tor, skin); if (c.spots) pat(tor, 'dots');
  if (c.female) { const d = `M${-35 * b},-216Q0,-226 ${35 * b},-216L${34 * b},-194Q${17 * b},-184 0,-194Q${-17 * b},-184 ${-34 * b},-194Z`; P(d, 'red'); pat(d, 'dots'); }
  else if (c.armor) { const d = `M${-31 * b},-231Q0,-238 ${31 * b},-231L${27 * b},-178Q0,-164 ${-27 * b},-178Z`; P(d, 'gold'); pat(d, 'scale'); C(0, -205, 9, 'red'); C(0, -205, 3.4, 'hole', 0); for (let i = 0; i < 8; i++) C(Math.cos(i * 0.785) * 13, -205 + Math.sin(i * 0.785) * 13, 1.2, 'hole', 0); }
  else { Ln(`M-3,-207Q${-16 * b},-199 ${-29 * b},-210M5,-207Q${16 * b},-199 ${29 * b},-210`); Ln('M1,-200L1,-172'); C(1, -166, 1.7, K, 0); if (c.ribs) for (const y of [-196, -187, -178]) Ln(`M${-26 * b},${y}Q${-12 * b},${y + 7} -3,${y + 1}M${26 * b},${y}Q${12 * b},${y + 7} 5,${y + 1}`); }
  if (c.shawl) { const d = `M${-35 * b},-233L${-17 * b},-237L${27 * b},-158L${13 * b},-151Z`; P(d, c.shawl); pat(d, 'stripe'); }
  if (c.thread) { Ln(`M${-24 * b},-232Q${12 * b},-196 ${19 * b},-153`, K, 3.4); Ln(`M${-24 * b},-232Q${12 * b},-196 ${19 * b},-153`, 'white', 1.8); }
  if (c.mala) for (const [cy, n] of [[-176, 15], [-150, 19]]) dotsQ(-22 * b, -231, 1, cy, 24 * b, -231, n, 2.5, 'wood');
  if (c.bones) { for (let i = 0; i <= 8; i++) { const t = i / 8, u = 1 - t, x = u * u * -22 * b + t * t * 24 * b + 2 * u * t, y = u * u * -231 + 2 * u * t * -186 + t * t * -231; P(`M${f(x - 3)},${f(y)}l3,9l3,-9Z`, 'bone', 1); } }
  if (c.skulls) for (let i = 0; i <= 4; i++) { const t = i / 4, u = 1 - t, x = u * u * -24 * b + t * t * 26 * b + 2 * u * t, y = u * u * -230 + 2 * u * t * -150 + t * t * -230; C(x, y - 1, 6, 'bone'); P(`M${f(x - 3.4)},${f(y + 3)}h6.8l-0.8,5h-5.2Z`, 'bone', 1); C(x - 2.3, y - 1.4, 1.9, K, 0); C(x + 2.3, y - 1.4, 1.9, K, 0); P(`M${f(x)},${f(y + 0.6)}l1.1,2.2h-2.2Z`, K, 1); Ln(`M${f(x - 1.6)},${f(y + 4.4)}v3M${f(x)},${f(y + 4.4)}v3M${f(x + 1.6)},${f(y + 4.4)}v3`, null, 0.7); }
  if (c.jewels) {
    gold(`M${-17 * b},-234Q1,-212 ${19 * b},-234`, 4.2); dotsQ(-15 * b, -232, 1, -213, 17 * b, -232, 7, 1);
    if (c.jewels > 1) { gold(`M${-25 * b},-231Q1,-170 ${27 * b},-231`, 3); dotsQ(-23 * b, -228, 1, -172, 25 * b, -228, 13, 1); P('M1,-207l8,9l-8,12l-8,-12Z', 'gold'); C(1, -197, 3, 'red'); C(1, -183, 2.2, 'green'); }
  }
  const belt = `M${-26 * b},-159L${26 * b},-159L${25 * b},-146L${-25 * b},-146Z`; P(belt, c.demon && !c.armor ? 'bone' : 'gold'); dots(-21 * b, -152.5, 21 * b, -152.5, Math.round(8 * b), 1.3);
  P('M1,-161l9,8.5l-9,8.5l-9,-8.5Z', 'red'); C(1, -152.5, 2.2, 'hole', 0); rivet(-22 * b, -152); rivet(22 * b, -152);
  if (st.master && c.jewels > 1) for (let i = 0; i <= 26; i++) { const t = i / 26, u = 1 - t; C(u * u * -30 * b + 2 * u * t * 2 + t * t * 32 * b, u * u * -228 + 2 * u * t * -20 + t * t * -228, 3.1, i % 3 ? (i % 3 === 1 ? 'red' : 'saffron') : 'white'); }
  P('M-9,-249L11,-249L12,-229L-10,-229Z', skin); if (c.jewels) gold('M-9,-236L11,-236', 2.6);

  // --- head ---
  o += `<g transform="translate(6 -270) scale(${c.headS || (c.demon ? 1.24 : 1.18)})">`;
  if (c.head === 'wild') { let d = ''; const n = 15; for (let i = 0; i <= n; i++) { const a = rad(215 - i / n * 195), r = i % 2 ? c.spike : 25; d += `${i ? 'L' : 'M'}${f(Math.cos(a) * r - 2)},${f(-Math.sin(a) * r - 2)}`; } P(d + 'Z', 'hair', 1); }
  if (c.ears) P('M-9,-4L-38,-30L-16,8Z', skin);
  if (c.horns) { P('M-12,-23Q-22,-52 2,-62Q-8,-44 -2,-25Z', 'bone'); P('M4,-26Q-2,-54 22,-62Q12,-44 15,-25Z', 'bone'); Ln('M-12,-36l6,-2M-10,-44l7,-3M6,-38l6,-2M8,-46l7,-3'); }
  if (c.antlers) for (const d of ['M-4,-26Q-10,-52 2,-74M-6,-48l-14,-12M-3,-60l-12,-10', 'M8,-27Q8,-52 22,-72M9,-46l14,-8M14,-60l12,-6']) gold(d, 3.2);
  P(c.demon ? 'M-12,22C-35,12 -33,-25 -6,-29C6,-30 17,-25 22,-14L25,-7L25,-2Q35,0 37,9Q33,13 27,11L31,15L25,17L30,21Q29,28 20,30Q10,33 2,27L-12,22Z'
    : 'M-12,22C-32,12 -30,-24 -6,-27C4,-28 14,-24 20,-14L22,-7L23,-3Q28,1 31,5Q28,8 24,7L27,11L24,13L26,16Q26,21 21,24Q14,28 6,25L-12,22Z', skin);
  if (c.beard) { P('M-6,4Q-2,20 8,26Q16,28 22,23Q25,46 12,70Q6,50 -2,38Q-10,22 -6,4Z', 'white'); Ln('M2,22Q8,40 11,60M10,28Q14,40 13,54M-2,14Q0,26 4,34', 'stone', 1); Ln('M23,9Q14,9 8,15', 'white', 3); }
  if (c.stache) { Ln('M25,10Q13,8 6,15Q1,20 -4,12', K, 4.4); Ln('M25,10Q13,8 6,15Q1,20 -4,12', 'hair', 2.6); }
  if (c.tongue) P('M25,17Q38,26 30,38Q22,30 22,18Z', 'red');
  if (c.fangs) { P('M27,14l2,10l-6,-8Z', 'bone', 1); P('M20,17l1,9l-5,-8Z', 'bone', 1); }
  if (c.tusks) { P('M22,19Q33,12 33,-2Q26,8 19,14Z', 'bone'); P('M12,22Q22,18 24,6Q17,13 9,17Z', 'bone'); }
  if (c.head === 'crown' || c.head === 'jata') P('M-6,-27C-30,-25 -33,10 -12,22L-9,6Q-15,-8 -3,-16Q8,-20 17,-21Q8,-30 -6,-27Z', 'hair', 1);
  if (c.head === 'shikha') { P('M-16,-22Q-36,-34 -30,-10Q-22,-18 -13,-16Z', 'hair', 1); Ln('M-6,-27C-24,-26 -30,-8 -22,10', 'stone', 0.8); }
  if (c.head === 'bald') Ln('M-8,-28l-6,-12M-2,-29l-2,-14M5,-28l3,-12M-16,-24l-10,-8');
  if (c.demon) { C(13, -7, 8, 'white'); C(14.5, -7, 4, 'red'); C(15, -7, 1.8, K, 0); Ln('M0,-20L27,-11', K, L * 1.7); }
  else { P('M3,-6Q13,-15 25,-6Q13,1 3,-6Z', 'white', 1); C(15, -6.8, 3.3, K, 0); C(16.2, -8, 0.9, 'hole', 0); Ln('M3,-6L-6,-8', K, L * 0.8); Ln('M2,-14Q14,-22 27,-12', K, L); }
  if (!c.ears) { P('M-8,-9Q-17,-11 -16,0Q-14,9 -7,6Q-10,0 -8,-9Z', skin); C(-10.5, 14, c.demon ? 7 : 5.6, c.demon ? 'bone' : 'gold'); C(-10.5, 14, 2.1, 'hole', 0); if (!c.demon && !c.plain) for (let i = 0; i < 6; i++) C(-10.5 + Math.cos(i * 1.05) * 8.4, 14 + Math.sin(i * 1.05) * 8.4, 1.3, 'gold'); }
  if (st.master) {
    if (c.demon) { Ln('M2,-24Q12,-28 22,-20M5,-30Q12,-32 18,-28'); Ln('M30,4q3,1 4,4'); Ln('M9,19l2.5,3l2.5,-3l2.5,3l2.5,-3l2.5,3', 'bone', 1.4); Ln('M-4,2Q2,10 0,20'); }
    else { Ln('M3,-10Q13,-19 26,-9'); Ln('M26.5,5.5q-2,-2.2 -3.4,0'); P('M23.6,10.2Q26,9.6 27.2,11L24.4,13.4Z', 'red', 1); Ln('M-2,6Q4,16 3,24'); if (c.head === 'crown') for (let i = 0; i < 5; i++) C(17.5 - i * 5.6, -21.5 - Math.sin(i / 4 * 3.14) * 3.5, 2.7, 'hair'); }
  }
  if (c.tilak) { P('M16.5,-23l3.6,1l-1,8l-3.4,-0.8Z', 'red', 1); }
  if (c.ash) for (const k of [0, 3, 6]) Ln(`M${8 + k * 0.4},${-24 + k}l11,3`, 'white', 1.5);
  if (c.head === 'crown') {
    o += '<g transform="translate(-4 0) rotate(-6)">';
    if (st.master) { const r1 = 'M-30,-18Q-62,-32 -80,-6Q-64,-13 -55,0Q-46,-14 -30,-8Z', r2 = 'M-30,-8Q-56,-2 -66,24Q-53,13 -45,21Q-42,4 -28,0Z'; P(r1, 'red'); pat(r1, 'stripe'); P(r2, 'saffron'); pat(r2, 'dots'); }
    P('M-24,-22Q-44,-14 -38,10Q-31,-2 -21,-10Z', 'gold'); dotsQ(-27, -17, -38, -10, -35, 2, 4, 1.1);
    const n = c.tiers; let yt = -27;
    P('M-26,-27L26,-27L25,-19L-25,-19Z', 'red'); dots(-21, -23, 21, -23, 9, 1.2);
    for (let i = 0; i < n; i++) {
      const w = 24 - i * 4.4, yb = -27 - i * 14; yt = yb - 13;
      P(`M${-w},${yb}L${w},${yb}L${w - 3.4},${yt}L${-w + 3.4},${yt}Z`, 'gold');
      for (const s of [-1, 1]) P(`M${s * w},${yb}l${s * 7},-10l${s * -9},0Z`, i % 2 ? 'green' : 'red');
      if (st.master) { let d = `M${f(-w + 4)},${yb - 1}`; const stp = (2 * w - 8) / 4; for (let j = 0; j < 4; j++) d += `q${f(stp / 2)},-9 ${f(stp)},0`; Ln(d); }
      C(0, yb - 6.5, 3, i % 2 ? 'green' : 'red'); dots(-w + 5, yb - 10, w - 5, yb - 10, Math.max(2, 5 - i), 1.1); dots(-w + 6, yb - 3, -5, yb - 3, 2, 1); dots(5, yb - 3, w - 6, yb - 3, 2, 1);
    }
    P(`M-7,${yt}Q0,${yt - 8} -3,${yt - 15}Q0,${yt - 27} 3,${yt - 15}Q0,${yt - 8} 7,${yt}Z`, 'gold'); C(0, yt - 9, 2.6, 'red'); C(0, yt - 25, 2.4, 'white');
    o += '</g>';
  }
  if (c.head === 'jata') { C(-5, -41, 14, 'hair'); Ln('M-17,-44Q-5,-36 7,-45M-15,-36Q-5,-30 6,-37M-12,-52Q-5,-47 3,-53', 'stone', 1); dotsQ(-20, -27, -4, -34, 14, -26, 8, 2.3, 'wood'); P('M-9,-55q4,-9 8,0Z', 'hair', 1); }
  o += '</g>';

  // --- in front ---
  const [nx, ny] = arm(30 * b, -224, c.near[0], c.near[1], true);
  if (c.nearItem) item(c.nearItem, nx, ny);
  if (st.rods) o += '</g>';
  if (st.rods) { o += `<path d="M1,-262L1,60" stroke="#1f0d05" stroke-width="4.5" opacity=".72" stroke-linecap="round"/><path d="M${f(nx)},${f(ny)}L${f(nx + 26)},60" stroke="#1f0d05" stroke-width="2.6" opacity=".6"/>`; for (const y of [-240, -200, -160]) o += `<path d="M-3,${y}h8" stroke="#ffeeb0" stroke-width="1.2" opacity=".8"/>`; }
  return o;
}

// ---------- level 1 cast ----------
const CAST = [
  { id: 'rama', name: 'Rama', dev: 'राम', role: 'Prince of Ayodhya. You play him.', skin: 'rama', s: 0.97, head: 'crown', tiers: 4, halo: 1, dhoti: 'saffron', pat: 'dia', sash: 'red', sashes: 1, thread: 1, tilak: 1, locks: 1, quiver: 1, jewels: 2, far: [72, 96], farItem: 'bow', near: [-14, 36], nearItem: 'arrow' },
  { id: 'lak', name: 'Lakshmana', dev: 'लक्ष्मण', role: 'His brother. Holds the post you choose.', skin: 'lak', s: 0.95, head: 'crown', tiers: 3, dhoti: 'blue', pat: 'stripe', sash: 'saffron', sashes: 1, thread: 1, tilak: 1, locks: 1, quiver: 1, jewels: 2, far: [72, 96], farItem: 'bow', near: [-8, 22], nearItem: 'arrow' },
  { id: 'vish', name: 'Vishwamitra', dev: 'विश्वामित्र', role: 'The sage whose sacrifice you guard.', skin: 'sage', s: 0.97, plain: 1, head: 'jata', beard: 1, ash: 1, dhoti: 'saffron', pat: 'none', trim: 'red', sash: 'saffron', shawl: 'red', mala: 1, thread: 1, far: [26, 58], farItem: 'kamandalu', near: [40, 118], nearItem: 'staff' },
  { id: 'disc', name: 'Disciple', dev: 'शिष्य', role: 'Gathers wood for the fire by day.', skin: 'fair', s: 0.86, plain: 1, head: 'shikha', dhoti: 'white', pat: 'none', trim: 'saffron', sash: 'white', thread: 1, far: [12, 34], near: [52, 98], nearItem: 'wood' },
  { id: 'rak', name: 'Rakshasa', dev: 'राक्षस', role: 'The common foot soldier of the night.', skin: 'dRed', s: 0.98, demon: 1, head: 'wild', spike: 42, horns: 1, fangs: 1, stache: 1, bones: 1, claws: 1, dhoti: 'black', pat: 'dots', trim: 'bone', hem: -80, sash: 'red', far: [-22, 26], near: [112, 162], nearItem: 'club' },
  { id: 'pish', name: 'Pishacha', dev: 'पिशाच', role: 'Fast, frail, and never alone.', skin: 'dGreen', s: 0.8, build: 0.82, lean: 9, demon: 1, plain: 1, head: 'bald', ears: 1, fangs: 1, ribs: 1, claws: 1, dhoti: 'wood', pat: 'none', trim: 'bone', hem: -104, sash: 'wood', far: [46, 72], near: [64, 86] },
  { id: 'def', name: 'Defiler', dev: 'निशाचर', role: 'Flies over walls to foul the altar.', skin: 'dDark', s: 0.8, lift: 34, demon: 1, plain: 1, head: 'bald', ears: 1, fangs: 1, claws: 1, wings: 'red', dhoti: 'red', pat: 'dots', trim: 'bone', hem: -98, sash: 'black', far: [58, 78], near: [70, 62], nearItem: 'pot' },
  { id: 'brute', name: 'Brute', dev: 'महाकाय', role: 'Slow and vast. Smashes what you build.', skin: 'dBlue', s: 1.0, build: 1.5, demon: 1, head: 'wild', spike: 36, horns: 1, tusks: 1, bones: 1, dhoti: 'saffron', pat: 'tiger', trim: 'bone', hem: -76, sash: 'red', far: [-16, 10], near: [14, 6], nearItem: 'club', itemDown: 1 },
  { id: 'tataka', name: 'Tataka', dev: 'ताटका', role: 'Boss of night three. Hurls boulders, raises dust.', skin: 'dGreen', s: 1.0, build: 1.15, demon: 1, female: 1, locks: 1, head: 'wild', spike: 54, fangs: 1, tongue: 1, skulls: 1, claws: 1, skirt: 'red', pat: 'dia', far: [38, 98], near: [150, 196], nearItem: 'rock' },
  { id: 'subahu', name: 'Subahu', dev: 'सुबाहु', role: 'Boss of night six. Leads the ground host.', skin: 'dRed', s: 1.02, build: 1.35, demon: 1, head: 'crown', tiers: 2, horns: 1, tusks: 1, stache: 1, armor: 1, sashes: 1, dhoti: 'green', pat: 'stripe', hem: -62, sash: 'black', far: [-18, 24], near: [100, 168], nearItem: 'mace' },
  { id: 'maricha', name: 'Maricha', dev: 'मारीच', role: 'Boss of night six. Master of illusion, later the golden deer.', skin: 'dGold', s: 0.96, lift: 16, demon: 1, head: 'crown', tiers: 1, antlers: 1, fangs: 1, spots: 1, wings: 'green', sashes: 1, jewels: 1, dhoti: 'red', pat: 'dia', hem: -72, sash: 'blue', far: [30, 80], near: [96, 150], nearItem: 'sword' },
];

function svg(c, sid) {
  const st = STYLES[sid], gy = 420;
  const sh = st.rods ? '' : `<ellipse cx="150" cy="${gy + 1}" rx="${(c.lift ? 40 : 70) * c.s}" ry="${c.lift ? 5 : 8}" fill="#000" opacity="${c.lift ? 0.16 : 0.24}"/>`;
  const sway = st.rods ? `<animateTransform attributeName="transform" type="rotate" values="-1.3;1.3;-1.3" dur="${f(5 + c.s * 2)}s" repeatCount="indefinite"/>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${c.name}, ${st.name} style">${st.bg()}${sh}<g transform="translate(${148 - (c.wings ? -14 : 0)} ${gy - (c.lift || 0)}) scale(${c.s}) rotate(${c.lean || 0})" ${st.master ? 'filter="url(#masterFx)"' : st.rods ? 'style="filter:drop-shadow(0 0 5px rgba(70,25,0,.55))"' : ''}><g>${sway}${figure(c, sid)}</g></g>${st.fg ? st.fg() : ''}</svg>`;
}

return { STYLES, CAST, svg, defs };
})();
