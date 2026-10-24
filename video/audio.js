'use strict';
// Música y efectos del video, sintetizados con Web Audio (los mismos instrumentos y canciones del juego).
// renderAudio() lo dibuja todo en un OfflineAudioContext siguiendo window.cues (cada aparición con data-sfx)
// y la lista MUSIC de abajo. Es determinista: el ruido usa una semilla fija.
(function () {
  const SR = 48000;
  const A = { ctx: null, music: null, sfx: null, noise: null };
  let seed = 7;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  // Cada sonido se anota (cuándo, a qué bus y con qué forma); renderAudio los dibuja por tramos de pocos segundos.
  // Así el navegador no procesa miles de nodos a la vez.
  const NOTES = [];
  let envAt = () => 1;   // volumen de la canción en un instante (entrada y salida suaves)
  function tone(dest, t, o) { NOTES.push({ k: 'tone', bus: dest, t, o: { ...o, gain: (o.gain || 0.2) * (dest === 'music' ? envAt(t) : 1) } }); }
  function noise(dest, t, o) { NOTES.push({ k: 'noise', bus: dest, t, off: rnd() * 0.3, o: { ...o, gain: (o.gain || 0.2) * (dest === 'music' ? envAt(t) : 1) } }); }
  function mkTone(c, out, t, o) {
    const dur = o.dur || 0.2, peak = Math.max(0.0002, o.gain), att = Math.min(o.attack || 0.005, dur * 0.9);
    const osc = c.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    if (o.detune) osc.detune.value = o.detune;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (o.filter) {
      const fl = c.createBiquadFilter();
      fl.type = o.filter.type || 'lowpass';
      fl.frequency.setValueAtTime(o.filter.f, t);
      if (o.filter.f2) fl.frequency.exponentialRampToValueAtTime(o.filter.f2, t + dur);
      fl.Q.value = o.filter.q || 0.8;
      osc.connect(fl);
      node = fl;
    }
    node.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }
  function mkNoise(c, out, t, o, off) {
    const dur = o.dur || 0.2, peak = Math.max(0.0002, o.gain), att = Math.min(o.attack || 0.003, dur * 0.9);
    const src = c.createBufferSource();
    src.buffer = A.noise;
    src.loop = true;
    const fl = c.createBiquadFilter();
    fl.type = o.type || 'highpass';
    fl.frequency.setValueAtTime(o.f || 1000, t);
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    fl.Q.value = o.q || 0.7;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(fl);
    fl.connect(g);
    g.connect(out);
    src.start(t, off);
    src.stop(t + dur + 0.05);
  }

  // --- instrumentos y canciones (copiados del juego) ---
  const bus = 'music';
  const INST = {
    kick: t => tone(bus, t, { f: 150, f2: 42, dur: 0.3, gain: 0.8, attack: 0.003 }),
    snare: t => { noise(bus, t, { dur: 0.16, gain: 0.3, type: 'bandpass', f: 1900, q: 0.8 }); tone(bus, t, { type: 'triangle', f: 210, f2: 140, dur: 0.1, gain: 0.16 }); },
    clap: t => [0, 0.012, 0.024].forEach(o => noise(bus, t + o, { dur: 0.09, gain: 0.18, type: 'bandpass', f: 1400, q: 1.2 })),
    hat: (t, v, open) => noise(bus, t, { dur: open ? 0.22 : 0.045, gain: 0.08 * v, type: 'highpass', f: 7500 }),
    bass: (t, m, dur) => tone(bus, t, { type: 'sawtooth', f: mtof(m), dur: Math.max(0.08, dur * 0.95), gain: 0.2, attack: 0.006, filter: { f: 900, f2: 220, q: 4 } }),
    pluck: (t, m, v) => tone(bus, t, { type: 'triangle', f: mtof(m), dur: 0.22, gain: 0.07 * v, attack: 0.003 }),
    bell: (t, m, v) => { tone(bus, t, { f: mtof(m), dur: 0.45, gain: 0.06 * v, attack: 0.002 }); tone(bus, t, { f: mtof(m) * 2.76, dur: 0.18, gain: 0.02 * v, attack: 0.002 }); },
    tom: (t, m) => { tone(bus, t, { f: mtof(m), f2: mtof(m) * 0.62, dur: 0.24, gain: 0.3 }); noise(bus, t, { dur: 0.03, gain: 0.05, type: 'bandpass', f: 900 }); },
    pad: (t, notes, dur, v) => notes.forEach((m, i) => tone(bus, t, { type: 'sawtooth', f: mtof(m), dur, gain: 0.022 * v, attack: 0.25, detune: i % 2 ? 7 : -7, filter: { f: 1400, q: 0.5 } }))
  };
  const SONGS = {
    lobby: { bpm: 100, vol: 0.38, chords: [
      { r: 36, n: [60, 64, 67, 71] }, { r: 45, n: [57, 60, 64, 67] }, { r: 41, n: [57, 60, 64, 65] }, { r: 43, n: [55, 59, 62, 67] }],
      kick: [0, 7, 10], snare: [4, 12], clap: [], hat: [2, 6, 10, 14], ohat: [14],
      bass: [[0, 0, 3], [3, 12, 1], [6, 0, 2], [8, 0, 3], [11, 12, 1], [14, 7, 2]],
      pad: 1, arp: { steps: [0, 3, 6, 8, 11, 14], pattern: [0, 2, 1, 3, 2, 1], oct: 12, v: 0.8 } },
    question: { bpm: 124, vol: 0.28, chords: [
      { r: 45, n: [57, 60, 64] }, { r: 45, n: [57, 60, 64] }, { r: 41, n: [57, 60, 65] }, { r: 40, n: [56, 59, 64] }],
      kick: [0, 4, 8, 12], snare: [], clap: [12], hat: 'all', ohat: [],
      bass: [[0, 0, 1], [2, 12, 1], [4, 0, 1], [6, 12, 1], [8, 0, 1], [10, 12, 1], [12, 0, 1], [14, 12, 1]],
      pad: 0.7, arp: { steps: [0, 3, 6, 10, 13], pattern: [2, 1, 0], oct: 12, v: 0.6 } },
    standings: { bpm: 112, vol: 0.4, chords: [
      { r: 41, n: [57, 60, 65] }, { r: 36, n: [55, 60, 64] }, { r: 38, n: [57, 62, 65] }, { r: 46, n: [58, 62, 65] }],
      kick: [0, 8, 11], snare: [4, 12], clap: [12], hat: [2, 6, 10, 14], ohat: [],
      bass: [[0, 0, 2], [3, 0, 1], [6, 12, 1], [8, 0, 2], [10, 7, 1], [13, 12, 2]],
      pad: 1, arp: { steps: [0, 2, 4, 6, 8, 10, 12, 14], pattern: [0, 1, 2, 1], oct: 12, v: 0.9 } },
    final: { bpm: 120, vol: 0.42, chords: [
      { r: 36, n: [60, 64, 67] }, { r: 43, n: [59, 62, 67] }, { r: 45, n: [57, 60, 64] }, { r: 41, n: [57, 60, 65] }],
      kick: [0, 4, 8, 12], snare: [4, 12], clap: [4, 12], hat: [2, 6, 10, 14], ohat: [6, 14],
      bass: [[0, 0, 2], [3, 12, 1], [4, 0, 2], [8, 0, 2], [11, 12, 1], [12, 7, 2]],
      pad: 1, arp: { steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], pattern: [0, 1, 2, 1], oct: 12, v: 0.55 } },
    cq_standings: { bpm: 104, vol: 0.4, chords: [
      { r: 38, n: [62, 65, 69] }, { r: 41, n: [60, 65, 69] }, { r: 36, n: [60, 64, 67] }, { r: 34, n: [58, 62, 65] }],
      kick: [0, 8], snare: [4, 12], clap: [], hat: [2, 6, 10, 14], ohat: [14],
      tom: [[13, 54], [14, 52], [15, 49]],
      bass: [[0, 0, 3], [4, 12, 1], [8, 0, 3], [12, 7, 2]],
      pad: 1, arp: { steps: [0, 3, 6, 8, 11, 14], pattern: [0, 2, 1], oct: 12, v: 0.8 } },
    st_question: { bpm: 116, vol: 0.3, chords: [
      { r: 45, n: [57, 60, 64, 67] }, { r: 38, n: [57, 60, 62, 66] }, { r: 41, n: [57, 60, 64, 65] }, { r: 40, n: [56, 59, 62, 64] }],
      kick: [0, 7, 10], snare: [4, 12], clap: [], hat: 'all', ohat: [6, 14],
      bass: [[0, 0, 1], [3, 12, 1], [5, 0, 1], [7, 7, 1], [10, 0, 1], [12, 12, 1], [14, 10, 1]],
      pad: 0.6, arp: { steps: [1, 3, 5, 9, 11, 13], pattern: [3, 2, 1, 0], oct: 24, v: 0.6, inst: 'bell' } }
  };
  // [desde, hasta, canción, volumen relativo] en segundos del video. null = sin música (suspenso).
  const MUSIC = [
    [0, 9.2, 'final', 0.9], [9.2, 22, 'lobby', 1.15], [22, 39, 'standings', 1], [39, 96, 'lobby', 1.15],
    [96, 131, 'question', 1.25], [131, 198, 'cq_standings', 1.05], [198, 260, 'st_question', 1.25],
    [269.6, 289, 'final', 0.9]
  ];
  function scheduleSong(name, t0, t1, rel) {
    const song = SONGS[name], sd = 60 / song.bpm / 4;
    const lvl = song.vol * rel, fade = 0.8;
    envAt = t => lvl * Math.min(1, (t - t0) / fade + 0.02, Math.max(0, (t1 - t) / fade));
    let arp = 0;
    for (let i = 0, t = t0; t < t1 - 0.05; i++, t = t0 + i * sd) {
      const s = i % 16, b = Math.floor(i / 16) % song.chords.length, ch = song.chords[b];
      if (song.kick.includes(s)) INST.kick(t);
      if (song.snare.includes(s)) INST.snare(t);
      if (song.clap.includes(s)) INST.clap(t);
      if (song.hat === 'all' || song.hat.includes(s)) INST.hat(t, s % 4 === 2 ? 1 : 0.6, song.ohat.includes(s));
      song.bass.forEach(([st, oct, len]) => { if (st === s) INST.bass(t, ch.r + oct, len * sd); });
      if (song.tom) song.tom.forEach(([st, m]) => { if (st === s) INST.tom(t, m); });
      if (s === 0 && song.pad) INST.pad(t, ch.n, Math.min(sd * 16, t1 - t), song.pad);
      if (song.arp && song.arp.steps.includes(s)) {
        const p = song.arp.pattern;
        INST[song.arp.inst || 'pluck'](t, ch.n[p[arp++ % p.length] % ch.n.length] + song.arp.oct, song.arp.v);
      }
    }
  }

  // --- efectos ---
  const S = () => 'sfx';
  function brass(t, m, dur, g) { tone(S(), t, { type: 'sawtooth', f: mtof(m), dur, gain: g, attack: 0.03, filter: { f: 2600, f2: 900, q: 0.8 } }); }
  function thump(t, f, f2, dur, gain) {
    tone(S(), t, { f, f2, dur, gain });
    tone(S(), t, { type: 'triangle', f: f * 2.5, f2: f2 * 2.5, dur: dur * 0.8, gain: gain * 0.45 });
    noise(S(), t, { dur: 0.04, gain: gain * 0.25, type: 'bandpass', f: 1400, q: 1.2 });
  }
  function impact(t, g = 1) {
    tone(S(), t, { f: 130, f2: 34, dur: 0.7, gain: 0.9 * g });
    tone(S(), t, { type: 'triangle', f: 260, f2: 90, dur: 0.4, gain: 0.25 * g });
    noise(S(), t, { dur: 1.2, gain: 0.18 * g, type: 'highpass', f: 3500 });
    noise(S(), t, { dur: 0.6, gain: 0.22 * g, type: 'lowpass', f: 900, f2: 120 });
  }
  function podium(t, place) {
    const m = { 3: 67, 2: 72, 1: 76 }[place], long = place === 1 ? 1.1 : 0.55;
    thump(t, 190, 70, 0.4, 0.6);
    noise(S(), t, { dur: 0.18, gain: 0.16, type: 'bandpass', f: 1600, q: 0.9 });
    brass(t, m, long, 0.11); brass(t, m - 12, long, 0.07);
    if (place === 1) {
      [84, 88, 91, 96].forEach((n, i) => tone(S(), t + 0.12 + i * 0.07, { type: 'triangle', f: mtof(n), dur: 0.45, gain: 0.1 }));
      noise(S(), t, { dur: 1.3, gain: 0.14, type: 'highpass', f: 4500 });
    }
  }
  function claps(t, n, gap, g) { for (let i = 0; i < n; i++) [0, 0.012, 0.024].forEach(o => noise(S(), t + i * gap + o + rnd() * 0.02, { dur: 0.08, gain: g, type: 'bandpass', f: 1300 + rnd() * 600, q: 1.2 })); }
  const SFX = {
    whoosh: t => noise(S(), t, { dur: 0.5, gain: 0.2, type: 'bandpass', f: 2600, f2: 380, q: 1.2, attack: 0.14 }),
    hit: t => { impact(t, 0.8); [60, 64, 67].forEach(m => brass(t, m, 0.5, 0.05)); },
    hit2: t => { impact(t, 0.9); [64, 67, 72].forEach(m => brass(t, m, 0.7, 0.06)); },
    pop: t => { tone(S(), t, { type: 'triangle', f: mtof(84), dur: 0.09, gain: 0.15 }); tone(S(), t + 0.05, { type: 'triangle', f: mtof(91), dur: 0.12, gain: 0.09 }); },
    card: t => { SFX.whoosh(t - 0.1); thump(t + 0.12, 180, 70, 0.3, 0.45); tone(S(), t + 0.12, { type: 'triangle', f: mtof(79), dur: 0.25, gain: 0.14 }); },
    ding: t => { tone(S(), t, { f: mtof(88), dur: 0.5, gain: 0.17 }); tone(S(), t, { f: mtof(95), dur: 0.35, gain: 0.06 }); },
    buzz: t => { [146.8, 155.6].forEach(f => tone(S(), t, { type: 'sawtooth', f, dur: 0.45, gain: 0.13, attack: 0.01, filter: { f: 1300, f2: 500 } })); },
    tick: t => [0, 0.5, 1.0, 1.5].forEach((o, i) => tone(S(), t + o, { type: 'square', f: i === 3 ? 1760 : 1320, dur: 0.07, gain: 0.07, filter: { type: 'bandpass', f: i === 3 ? 1760 : 1320, q: 5 } })),
    lock: t => {
      noise(S(), t, { dur: 0.04, gain: 0.3, type: 'bandpass', f: 3200, q: 2 });
      noise(S(), t + 0.06, { dur: 0.05, gain: 0.25, type: 'bandpass', f: 2200, q: 2 });
      tone(S(), t + 0.06, { type: 'square', f: 1900, dur: 0.05, gain: 0.05 });
      thump(t, 120, 60, 0.3, 0.45);
    },
    win: t => {
      [[67, 0, 0.13], [67, 0.15, 0.13], [67, 0.3, 0.13], [72, 0.45, 1.3]].forEach(([m, o, d]) => { brass(t + o, m, d, 0.12); brass(t + o, m - 12, d, 0.05); });
      [64, 67, 72, 76].forEach(m => brass(t + 0.45, m, 1.4, 0.035));
      thump(t + 0.45, 150, 60, 0.5, 0.6);
      claps(t + 0.5, 10, 0.16, 0.05);
    },
    coin: t => {
      noise(S(), t, { dur: 0.06, gain: 0.22, type: 'bandpass', f: 3600, q: 2 });
      [84, 88, 91, 96].forEach((m, i) => tone(S(), t + 0.04 + i * 0.05, { type: 'triangle', f: mtof(m), dur: 0.3, gain: 0.1 }));
    },
    steal: t => { thump(t, 190, 55, 0.4, 0.6); noise(S(), t, { dur: 0.22, gain: 0.2, type: 'bandpass', f: 1700, q: 0.9 }); brass(t, 66, 0.5, 0.09); brass(t + 0.12, 69, 0.5, 0.07); },
    shield: t => { [2400, 3600, 5100].forEach((f, i) => tone(S(), t + i * 0.015, { type: 'square', f, dur: 0.35, gain: 0.04, filter: { type: 'bandpass', f, q: 9 } })); thump(t, 240, 120, 0.3, 0.45); },
    title: t => {
      noise(S(), t, { dur: 0.95, gain: 0.24, type: 'bandpass', f: 250, f2: 6000, q: 1.1, attack: 0.85 });
      tone(S(), t, { type: 'sawtooth', f: 110, f2: 440, dur: 0.95, gain: 0.07, attack: 0.8, filter: { f: 600, f2: 3000 } });
      impact(t + 0.95, 1);
      [60, 64, 67, 72].forEach(m => brass(t + 0.95, m, 0.7, 0.06));
    },
    warm: t => { [[60, 64, 67], [64, 67, 72], [67, 72, 76]].forEach((ch, i) => ch.forEach(m => brass(t + i * 0.28, m, 0.45, 0.045))); thump(t, 170, 70, 0.35, 0.5); claps(t + 0.6, 6, 0.18, 0.05); },
    alarm: t => { thump(t, 110, 50, 0.4, 0.6); for (let i = 0; i < 4; i++) tone(S(), t + 0.1 + i * 0.4, { type: 'square', f: i % 2 ? 660 : 880, dur: 0.36, gain: 0.04, filter: { f: 2400, q: 1 } }); },
    votes: t => { for (let i = 0; i < 18; i++) { const x = t + 0.4 + i * 0.24; tone(S(), x, { type: 'triangle', f: mtof(72 + (i % 6) * 2), dur: 0.08, gain: 0.08 }); } },
    podium3: t => { podium(t + 0.2, 3); podium(t + 0.9, 2); podium(t + 1.7, 1); },
    podium: t => { podium(t + 0.5, 3); podium(t + 1.2, 2); podium(t + 2.0, 1); claps(t + 2.2, 14, 0.14, 0.06); },
    tension: t => {
      [[45, -8], [46, 8]].forEach(([m, d]) => tone(S(), t, { type: 'sawtooth', f: mtof(m), dur: 6.8, gain: 0.05, attack: 2, detune: d, filter: { f: 500, f2: 2200, q: 1.5 } }));
      tone(S(), t, { type: 'triangle', f: mtof(81), dur: 6.8, gain: 0.02, attack: 2.5 });
      [0.3, 2.1].forEach((o, i) => thump(t + o, 70, 38, 0.3, 0.5 + i * 0.1));
    },
    roll: t => {
      for (let x = 0; x < 2.8;) { const k = x / 2.8; noise(S(), t + x, { dur: 0.07, gain: 0.07 + 0.25 * k, type: 'bandpass', f: 1800, q: 0.7 }); x += 0.12 - 0.09 * k; }
      noise(S(), t, { dur: 2.8, gain: 0.18, type: 'bandpass', f: 200, f2: 5000, q: 1.2, attack: 2.6 });
      tone(S(), t, { type: 'sawtooth', f: 110, f2: 520, dur: 2.8, gain: 0.06, attack: 2.6, filter: { f: 500, f2: 3500 } });
    },
    boom: t => {
      impact(t, 1); impact(t + 0.03, 0.8);
      [[67, 0, 0.14], [67, 0.16, 0.14], [67, 0.32, 0.14], [72, 0.48, 0.3], [76, 0.8, 0.3], [79, 1.1, 1.8]].forEach(([m, o, d]) => { brass(t + o, m, d, 0.12); brass(t + o, m - 12, d, 0.05); });
      [60, 64, 67, 72, 76].forEach(m => brass(t + 1.1, m, 2.0, 0.035));
      noise(S(), t + 0.1, { dur: 4, gain: 0.16, type: 'bandpass', f: 1300, q: 0.5, attack: 0.6 });
      claps(t + 0.3, 24, 0.13, 0.06);
    },
    // --- los mismos sonidos del juego, alineados con los clips grabados de la TV ---
    // alguien entra a la sala
    join: t => { tone(S(), t, { type: 'triangle', f: mtof(76), dur: 0.14, gain: 0.2 }); tone(S(), t + 0.07, { type: 'triangle', f: mtof(83), dur: 0.24, gain: 0.17 }); },
    // «¡Se acabó!»
    timeup: t => { [[146.8, 0.2], [155.6, 0.18]].forEach(([f, g]) => tone(S(), t, { type: 'sawtooth', f, dur: 0.8, gain: g, attack: 0.01, filter: { f: 1400, f2: 500 } })); impact(t + 0.05, 1); },
    // «¡Se acabó!» y el podio del reto, en los mismos tiempos que la TV (3.º, 2.º y 1.º)
    showtime: t => { SFX.timeup(t); podium(t + 2.1, 3); podium(t + 3.0, 2); podium(t + 4.0, 1); },
    // Conquista: ciudad conquistada
    capture: t => { tone(S(), t, { type: 'triangle', f: mtof(78), dur: 0.16, gain: 0.2 }); tone(S(), t + 0.08, { type: 'triangle', f: mtof(85), dur: 0.3, gain: 0.18 }); brass(t, 66, 0.6, 0.09); tone(S(), t, { f: 160, f2: 60, dur: 0.35, gain: 0.5 }); },
    // Bolsa: campana del cierre y caja registradora
    market: t => {
      [0, 0.22].forEach(o => { tone(S(), t + o, { f: mtof(88), dur: 0.9, gain: 0.13 }); tone(S(), t + o, { f: mtof(95), dur: 0.6, gain: 0.05 }); });
      noise(S(), t + 0.55, { dur: 0.07, gain: 0.25, type: 'bandpass', f: 3600, q: 2 });
      [84, 88, 91, 96].forEach((m, i) => tone(S(), t + 0.6 + i * 0.06, { type: 'triangle', f: mtof(m), dur: 0.35, gain: 0.12 }));
    },
    // la revelación del ganador completa (t = cuando el anfitrión toca «Revelar ganador»), igual que en la TV
    reveal: t => {
      [[45, -8], [46, 8]].forEach(([m, d]) => tone(S(), t, { type: 'sawtooth', f: mtof(m), dur: 9, gain: 0.045, attack: 2, detune: d, filter: { f: 500, f2: 2200, q: 1.5 } }));
      tone(S(), t, { type: 'triangle', f: mtof(81), dur: 9, gain: 0.018, attack: 2.5 });
      thump(t, 90, 30, 0.6, 0.7);
      noise(S(), t + 0.6, { dur: 0.5, gain: 0.12, type: 'bandpass', f: 300, f2: 2500, attack: 0.3 });
      tone(S(), t + 0.8, { type: 'triangle', f: mtof(69), dur: 0.8, gain: 0.12 }); tone(S(), t + 0.95, { type: 'triangle', f: mtof(72), dur: 0.9, gain: 0.1 });
      [0.9, 1.15, 2.0, 2.25, 4.0, 4.25].forEach(b => thump(t + b, 70, 38, 0.22, 0.55));
      [2.4, 2.55, 2.7].forEach(b => noise(S(), t + b, { dur: 0.35, gain: 0.1, type: 'bandpass', f: 600, f2: 3000, attack: 0.15 }));
      [[3.2, 67], [5.0, 72]].forEach(([b, m]) => { tone(S(), t + b, { f: 180, f2: 70, dur: 0.4, gain: 0.6 }); brass(t + b, m, 0.6, 0.1); brass(t + b, m - 12, 0.6, 0.06); noise(S(), t + b, { dur: 0.25, gain: 0.15, type: 'bandpass', f: 1500 }); });
      for (let x = 6.4; x < 9;) { const k = (x - 6.4) / 2.6; noise(S(), t + x, { dur: 0.07, gain: 0.07 + 0.25 * k, type: 'bandpass', f: 1800, q: 0.7 }); x += 0.12 - 0.09 * k; }
      noise(S(), t + 6.4, { dur: 2.6, gain: 0.2, type: 'bandpass', f: 200, f2: 5000, q: 1.2, attack: 2.4 });
      tone(S(), t + 6.4, { type: 'sawtooth', f: 110, f2: 520, dur: 2.6, gain: 0.07, attack: 2.4, filter: { f: 500, f2: 3500 } });
      SFX.boom(t + 9);
      [0.5, 1.3, 2.1, 2.8, 3.6, 4.5, 5.3, 6.2].forEach(b => { thump(t + 9 + b, 80, 40, 0.5, 0.3); for (let i = 0; i < 10; i++) noise(S(), t + 9 + b + 0.15 + rnd() * 0.6, { dur: 0.03, gain: 0.04 + rnd() * 0.05, type: 'highpass', f: 4000 }); });
      podium(t + 13.4, 3); podium(t + 14.1, 2); podium(t + 14.9, 1); claps(t + 15.1, 16, 0.14, 0.06);
    }
  };

  window.renderAudio = async function () {
    const D = window.DURATION, n = Math.ceil(D * SR);
    NOTES.length = 0;
    MUSIC.forEach(([a, b, name, rel]) => scheduleSong(name, a, b, rel));
    // golpe final
    impact(D - 1.4, 1); [48, 55, 60, 64, 67].forEach(m => brass(D - 1.4, m, 1.3, 0.05));
    (window.cues || []).forEach(c => { if (SFX[c.k]) SFX[c.k](Math.max(0.01, c.t)); });
    NOTES.sort((x, y) => x.t - y.t);
    const L = new Float32Array(n), R = new Float32Array(n);
    const STEP = 5, TAIL = 8, GAIN = { music: 1, sfx: 0.85 };
    let k = 0;
    for (let a = 0; a < D; a += STEP) {
      const len = Math.min(n - Math.floor(a * SR), Math.ceil((STEP + TAIL) * SR));
      const ctx = A.ctx = new OfflineAudioContext(2, len, SR);
      if (!A.noise || A.noise.sampleRate !== SR) {
        A.noise = ctx.createBuffer(1, SR * 2, SR);
        const d = A.noise.getChannelData(0); let z = 99;
        for (let i = 0; i < d.length; i++) { z = (z * 1664525 + 1013904223) % 4294967296; d[i] = z / 2147483648 - 1; }
      }
      const out = { music: ctx.createGain(), sfx: ctx.createGain() };
      out.music.gain.value = GAIN.music; out.sfx.gain.value = GAIN.sfx;
      out.music.connect(ctx.destination); out.sfx.connect(ctx.destination);
      while (k < NOTES.length && NOTES[k].t < a + STEP) {
        const x = NOTES[k++], t = Math.max(0, x.t - a);
        if (x.k === 'tone') mkTone(ctx, out[x.bus], t, x.o); else mkNoise(ctx, out[x.bus], t, x.o, x.off);
      }
      const buf = await ctx.startRendering(), cl = buf.getChannelData(0), cr = buf.getChannelData(1), base = Math.floor(a * SR);
      for (let i = 0; i < len && base + i < n; i++) { L[base + i] += cl[i]; R[base + i] += cr[i]; }
    }
    const pcm = new Int16Array(n * 2);
    for (let i = 0; i < n; i++) {
      pcm[2 * i] = Math.max(-32768, Math.min(32767, Math.round(L[i] * 0.7 * 32767)));
      pcm[2 * i + 1] = Math.max(-32768, Math.min(32767, Math.round(R[i] * 0.7 * 32767)));
    }
    window.__pcm = new Uint8Array(pcm.buffer);
    return { bytes: window.__pcm.length, sampleRate: SR, channels: 2, notes: NOTES.length };
  };
  // Trozo del PCM en base64 (para sacarlo del navegador sin pasar un string gigante).
  window.pcmChunk = function (i, size) {
    const part = window.__pcm.subarray(i * size, (i + 1) * size);
    let s = '';
    for (let k = 0; k < part.length; k += 0x8000) s += String.fromCharCode.apply(null, part.subarray(k, k + 0x8000));
    return btoa(s);
  };
})();
