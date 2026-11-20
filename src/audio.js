// audio.js — all sound is synthesised with WebAudio; there are no audio files.
const Snd = (() => {
  let ac, master, music, noiseBuf, night = false, muted = false, step = 0, nextT = 0, idx = 2;
  const last = {};

  function init() {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0.7; master.connect(ac.destination);
    music = ac.createGain(); music.gain.value = 0.55; music.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    drone();
    nextT = ac.currentTime + 0.3;
    setInterval(sched, 100);
  }

  function tone(f, t, dur, type = 'sine', vol = 0.2, f2, dest = master, attack = 0.008) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }

  function noise(t, dur, vol, freq, type = 'bandpass', f2, dest = master) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = type; f.frequency.setValueAtTime(freq, t);
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  // Tanpura-like Sa–Pa–Sa drone that runs under everything.
  function drone() {
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 2;
    const g = ac.createGain(); g.gain.value = 0.05; lp.connect(g); g.connect(music);
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.11; lg.gain.value = 220;
    lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    for (const f of [73.42, 110, 146.83, 147.6]) {
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start();
    }
  }

  const DAY = [0, 2, 4, 7, 9, 12, 14, 16], NIGHT = [0, 1, 3, 5, 7, 8, 10, 12];
  function sched() {
    while (nextT < ac.currentTime + 0.25) {
      const t = nextT, s = step % 8;
      if (night) {
        if (s === 0 || s === 3 || s === 6) tone(95, t, 0.28, 'sine', 0.5, 48, music);
        if (s === 2 || s === 5 || s === 7) tone(230, t, 0.09, 'triangle', 0.16, 170, music);
        if (s % 2 === 0 && Math.random() < 0.55) {
          idx = Math.max(0, Math.min(7, idx + ((Math.random() * 3) | 0) - 1));
          tone(146.83 * Math.pow(2, NIGHT[idx] / 12), t, 0.42, 'triangle', 0.1, 0, music, 0.03);
        }
      } else {
        if (s === 0) noise(t, 0.25, 0.04, 7000, 'highpass', 0, music);
        if (s % 2 === 0 && Math.random() < 0.6) {
          idx = Math.max(0, Math.min(7, idx + ((Math.random() * 5) | 0) - 2));
          const o = tone(587.33 * Math.pow(2, DAY[idx] / 12), t, 0.7, 'sine', 0.085, 0, music, 0.08);
          const v = ac.createOscillator(), vg = ac.createGain(); v.frequency.value = 5.5; vg.gain.value = 5;
          v.connect(vg); vg.connect(o.frequency); v.start(t); v.stop(t + 0.8);
        }
      }
      step++; nextT += night ? 0.24 : 0.34;
    }
  }

  const FX = {
    arrow: t => { noise(t, 0.07, 0.1, 2600); tone(820, t, 0.07, 'triangle', 0.05, 300); },
    hit: t => tone(170, t, 0.09, 'triangle', 0.14, 70),
    die: t => { tone(210, t, 0.24, 'sawtooth', 0.07, 50); noise(t, 0.15, 0.08, 500); },
    build: t => { tone(320, t, 0.06, 'square', 0.1, 160); tone(260, t + 0.1, 0.07, 'square', 0.1, 130); },
    wood: t => { tone(660, t, 0.08, 'sine', 0.08); tone(990, t + 0.07, 0.12, 'sine', 0.07); },
    click: t => tone(500, t, 0.04, 'sine', 0.08),
    deny: t => tone(140, t, 0.14, 'square', 0.07, 100),
    conch: t => { for (const f of [220, 221.5, 440]) tone(f, t, 2.2, 'sawtooth', 0.07, f * 1.06, master, 0.5); noise(t, 2.2, 0.03, 700); },
    bell: t => { for (const [f, v] of [[523, 0.14], [1049, 0.07], [1571, 0.04]]) tone(f, t, 2.4, 'sine', v); },
    agni: t => { noise(t, 1.0, 0.4, 250, 'lowpass', 2600); tone(70, t, 0.9, 'sine', 0.4, 35); },
    manava: t => { tone(1400, t, 0.55, 'sine', 0.18, 180); noise(t, 0.4, 0.15, 4000, 'highpass'); },
    brazier: t => noise(t, 0.3, 0.1, 400, 'lowpass', 1400),
    boulder: t => { tone(90, t, 0.5, 'sine', 0.5, 28); noise(t, 0.4, 0.3, 180, 'lowpass'); },
    crash: t => { noise(t, 0.5, 0.3, 900, 'bandpass', 200); tone(120, t, 0.3, 'square', 0.1, 50); },
    defile: t => tone(310, t, 0.3, 'sawtooth', 0.06, 110),
    roar: t => { tone(110, t, 1.3, 'sawtooth', 0.2, 55, master, 0.2); noise(t, 1.3, 0.14, 300, 'lowpass'); },
    win: t => [0, 4, 7, 12, 16].forEach((n, i) => tone(293.66 * Math.pow(2, n / 12), t + i * 0.18, 1.2, 'triangle', 0.14)),
    lose: t => [7, 3, 1, 0].forEach((n, i) => tone(146.83 * Math.pow(2, n / 12), t + i * 0.35, 1.2, 'sawtooth', 0.09)),
  };

  function sfx(name) {
    if (!ac || muted) return;
    const now = ac.currentTime;
    if (now - (last[name] || 0) < 0.05) return;
    last[name] = now; FX[name](now);
  }

  return {
    init, sfx,
    setNight(v) { night = v; },
    toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.7; return muted; },
  };
})();
