// Convierte index.html en MP4 (1920×1080) con su música y efectos.
//   node render.cjs                          → video completo: batalla-de-kpis-como-se-juega.mp4 (+ copia liviana)
//   node render.cjs --stills 3,12.5,40 out   → capturas sueltas en la carpeta out (para revisar escenas)
//   node render.cjs --audio out.wav          → solo la banda sonora
//   node render.cjs --voz                    → le pone la voz (voz/) al MP4 ya renderizado, sin volver a dibujar el video
// Necesita Playwright (con Chromium) y ffmpeg. Los clips del juego (clips/*.mp4) se pasan a cuadros JPG en .render/frames.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PAGE = 'file://' + path.join(__dirname, 'index.html');
const FPS = 30, WORKERS = Number(process.env.WORKERS || 3);
const OUT = path.join(__dirname, 'batalla-de-kpis-como-se-juega.mp4');
const LIGHT = path.join(__dirname, 'batalla-de-kpis-como-se-juega-liviano.mp4');
const TMP = path.join(__dirname, '.render');
const CLIPS = path.join(__dirname, 'clips'), FRAMES = path.join(TMP, 'frames');
const { execFileSync, spawnSync } = require('child_process');
// Cuántos cuadros tiene cada clip (a 30 cuadros por segundo).
const clipFrames = Object.fromEntries(fs.readdirSync(CLIPS).filter(f => f.endsWith('.mp4')).map(f => [f.slice(0, -4),
  Number(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=nb_frames', '-of', 'csv=p=0', path.join(CLIPS, f)]).toString().trim())]));

async function open(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('error en la página:', e.message));
  await page.addInitScript(f => { window.CLIP_FRAMES = f; }, clipFrames);
  await page.goto(PAGE);
  const D = await page.evaluate(() => window.ready);
  return { page, D };
}
function run(cmd, args, input) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: [input ? 'pipe' : 'ignore', 'ignore', 'pipe'] });
    let err = ''; p.stderr.on('data', d => { err += d; });
    p.on('close', c => (c === 0 ? res() : rej(new Error(`${cmd} salió con ${c}\n${err.slice(-2000)}`))));
    if (input) input(p.stdin);
  });
}

// Saca de cada clip solo el tramo de cuadros que el video usa.
async function extract(need) {
  await Promise.all(Object.entries(need).map(async ([name, [a, b]]) => {
    const dir = path.join(FRAMES, name);
    fs.mkdirSync(dir, { recursive: true });
    const have = n => fs.existsSync(path.join(dir, String(n).padStart(5, '0') + '.jpg'));
    if (have(a) && have(b)) return;
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(CLIPS, name + '.mp4'), '-vf', `select=between(n\\,${a}\\,${b})`,
      '-fps_mode', 'passthrough', '-start_number', String(a), '-q:v', '2', path.join(dir, '%05d.jpg')]);
  }));
  const n = Object.values(need).reduce((s, [a, b]) => s + b - a + 1, 0);
  console.log(`clips: ${Object.keys(need).length} · ${n} cuadros`);
}

async function stills(times, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const { page } = await open(browser);
  await extract(await page.evaluate(ts => window.clipPlan(ts), times));
  for (const t of times) {
    await page.evaluate(x => window.seek(x), t);
    await page.screenshot({ path: path.join(dir, `t${String(t).padStart(6, '0')}.png`) });
  }
  await browser.close();
  console.log('capturas ->', dir);
}

async function renderAudio(browser, wav) {
  const { page } = await open(browser);
  const info = await page.evaluate(() => window.renderAudio());
  const size = 4 * 1024 * 1024, parts = [];
  for (let i = 0; i * size < info.bytes; i++) parts.push(Buffer.from(await page.evaluate(([k, s]) => window.pcmChunk(k, s), [i, size]), 'base64'));
  const pcm = Buffer.concat(parts);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(info.sampleRate, 24);
  h.writeUInt32LE(info.sampleRate * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(wav, Buffer.concat([h, pcm]));
  await page.close();
}

async function renderSegment(browser, from, to, file, label) {
  const { page } = await open(browser);
  const t0 = Date.now();
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), file], async stdin => {
    for (let f = from; f < to; f++) {
      await page.evaluate(x => window.seek(x), f / FPS);
      const jpg = await page.screenshot({ type: 'jpeg', quality: 93 });
      if (!stdin.write(jpg)) await new Promise(r => stdin.once('drain', r));
      if ((f - from) % 300 === 0) console.log(`  [${label}] cuadro ${f - from} de ${to - from} (${Math.round((Date.now() - t0) / 1000)} s)`);
    }
    stdin.end();
  });
  await page.close();
}

// ---------- voz ----------
// voz/guion.json tiene las frases por bloques; cada bloque es un audio voz/<id>.mp3 con una pausa larga entre frase y frase.
// Cada frase se corta en las pausas más largas y se pone en su segundo del video (t).
const VOZ = path.join(__dirname, 'voz');
const durationOf = f => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());
function silences(file) {
  const out = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'silencedetect=noise=-38dB:d=0.25', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const st = [...out.matchAll(/silence_start: ([\d.]+)/g)].map(m => Number(m[1]));
  const en = [...out.matchAll(/silence_end: ([\d.]+)/g)].map(m => Number(m[1]));
  return st.map((a, i) => ({ a, e: en[i] === undefined ? Infinity : en[i] })).map(x => ({ ...x, d: x.e - x.a }));
}
function vozPlan() {
  const g = JSON.parse(fs.readFileSync(path.join(VOZ, 'guion.json'), 'utf8'));
  // Si falta algún bloque, el video sale sin voz (mejor eso que una voz a medias).
  const missing = g.bloques.filter(b => !fs.existsSync(path.join(VOZ, b.id + '.mp3'))).map(b => b.id);
  if (missing.length) { console.log(`voz incompleta (faltan ${missing.join(', ')}): el video sale sin voz`); return []; }
  const lines = [];
  for (const b of g.bloques) {
    const file = path.join(VOZ, b.id + '.mp3');
    const len = durationOf(file), n = b.frases.length, sil = silences(file);
    const head = sil.find(x => x.a < 0.05), tail = sil.find(x => x.e >= len - 0.05);
    const cuts = sil.filter(x => x !== head && x !== tail).sort((x, y) => y.d - x.d).slice(0, n - 1).sort((x, y) => x.a - y.a);
    if (cuts.length !== n - 1) throw new Error(`el bloque ${b.id} trae ${cuts.length + 1} frases y el guion tiene ${n}`);
    let a = head ? head.e : 0;
    b.frases.forEach((f, k) => {
      const e = k < n - 1 ? cuts[k].a : tail ? tail.a : len;
      lines.push({ file, a: Math.max(0, a - 0.04), e: Math.min(len, e + 0.1), t: f.t, texto: f.texto });
      if (k < n - 1) a = cuts[k].e;
    });
  }
  lines.sort((x, y) => x.t - y.t);
  // Si una frase no termina antes de que empiece la siguiente, la siguiente espera un momento.
  let end = 0;
  for (const l of lines) {
    if (l.t < end + 0.15) { console.log(`  se corre ${(end + 0.15 - l.t).toFixed(2)} s: ${l.texto}`); l.t = end + 0.15; }
    end = l.t + (l.e - l.a);
  }
  return lines;
}
// Pista de voz del largo del video, con las frases en su lugar y a −17 LUFS.
async function vozTrack(lines, D, wav) {
  const raw = wav.replace(/\.wav$/, '-crudo.wav');
  const parts = lines.map((l, i) => `[${i}:a]atrim=${l.a.toFixed(3)}:${l.e.toFixed(3)},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,`
    + `afade=t=in:d=0.03,afade=t=out:st=${Math.max(0, l.e - l.a - 0.08).toFixed(3)}:d=0.08,adelay=${Math.round(l.t * 1000)}:all=1[v${i}]`);
  const graph = parts.join(';') + ';' + lines.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${lines.length}:normalize=0,apad=whole_len=${Math.round(D * 48000)},atrim=0:${D}[out]`;
  await run('ffmpeg', ['-y', '-loglevel', 'error', ...lines.flatMap(l => ['-i', l.file]), '-filter_complex', graph, '-map', '[out]', raw]);
  const meter = spawnSync('ffmpeg', ['-hide_banner', '-i', raw, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const I = Number((meter.match(/I:\s+(-?[\d.]+) LUFS/g) || ['I: -17 LUFS']).pop().match(/-?[\d.]+/)[0]);
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af', `volume=${(-17 - I).toFixed(2)}dB`, wav]);
}
// Mezcla: la música y los efectos bajan solos cuando habla la voz. Después se mide y se lleva todo a −16 LUFS.
const MIX = '[0:a]acompressor=threshold=0.18:ratio=3:attack=5:release=150:knee=3,volume=0.7[bed];[1:a]asplit=2[key][voz];'
  + '[bed][key]sidechaincompress=threshold=0.015:ratio=8:attack=15:release=450[duck];[duck][voz]amix=inputs=2:normalize=0[a]';
const loudness = f => Number((spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' }).stderr
  .match(/I:\s+(-?[\d.]+) LUFS/g) || ['I: -16 LUFS']).pop().match(/-?[\d.]+/)[0]);
async function addVoz(video, bed, D, out) {
  const lines = vozPlan();
  if (!lines.length) return false;
  const voz = path.join(TMP, 'voz.wav'), mix = path.join(TMP, 'mezcla.wav');
  await vozTrack(lines, D, voz);
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', bed, '-i', voz, '-filter_complex', MIX, '-map', '[a]', mix]);
  const gain = (-16 - loudness(mix)).toFixed(2);
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', mix, '-i', video, '-map', '1:v', '-map', '0:a', '-c:v', 'copy',
    '-af', `volume=${gain}dB,alimiter=limit=0.84:attack=3:release=60:level=disabled`, '-ar', '48000', '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-shortest', out]);
  console.log(`voz: ${lines.length} frases · mezcla ${gain} dB`);
  return true;
}
async function light() {
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', OUT, '-vf', 'scale=1280:720', '-c:v', 'libx264', '-preset', 'medium', '-crf', '27',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', LIGHT]);
}
// Le pone la voz al MP4 ya hecho: el video se copia tal cual, solo cambia el audio.
async function voiceOnly() {
  fs.mkdirSync(TMP, { recursive: true });
  const browser = await chromium.launch();
  const bed = path.join(TMP, 'audio.wav');
  await renderAudio(browser, bed);
  await browser.close();
  const src = path.join(TMP, 'video.mp4');
  fs.copyFileSync(OUT, src);
  await addVoz(src, bed, durationOf(src), OUT);
  await light();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log('listo ->', OUT, '\n        ', LIGHT);
}

async function full() {
  fs.rmSync(TMP, { recursive: true, force: true }); fs.mkdirSync(TMP);
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const { page, D } = await open(browser);
  await extract(await page.evaluate(() => window.clipPlan()));
  await page.close();
  const frames = Math.round(D * FPS);
  console.log(`duración ${D} s · ${frames} cuadros · ${WORKERS} procesos`);
  const wav = path.join(TMP, 'audio.wav');
  await renderAudio(browser, wav);
  console.log('audio listo');
  const per = Math.ceil(frames / WORKERS), segs = [];
  await Promise.all(Array.from({ length: WORKERS }, (_, i) => {
    const file = path.join(TMP, `seg${i}.mp4`); segs.push(file);
    return renderSegment(browser, i * per, Math.min(frames, (i + 1) * per), file, `parte ${i + 1}`);
  }));
  await browser.close();
  fs.writeFileSync(path.join(TMP, 'list.txt'), segs.map(s => `file '${s}'`).join('\n'));
  // Une las partes, mezcla el audio (con la voz, si está) y lo deja a −16 LUFS (volumen estándar para video).
  const joined = path.join(TMP, 'video.mp4');
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(TMP, 'list.txt'), '-c', 'copy', joined]);
  if (!(await addVoz(joined, wav, D, OUT))) {
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', joined, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
      '-af', 'acompressor=threshold=0.18:ratio=3:attack=5:release=150:knee=3,loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k',
      '-movflags', '+faststart', '-shortest', OUT]);
  }
  await light();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log('listo ->', OUT, '\n        ', LIGHT);
}

const i = process.argv.indexOf('--stills'), ia = process.argv.indexOf('--audio');
if (process.argv.includes('--voz')) voiceOnly().catch(e => { console.error(e); process.exit(1); });
else if (ia > 0) chromium.launch().then(async b => { await renderAudio(b, process.argv[ia + 1]); await b.close(); console.log('audio ->', process.argv[ia + 1]); });
else if (i > 0) stills(process.argv[i + 1].split(',').map(Number), process.argv[i + 2] || path.join(__dirname, 'stills'));
else full().catch(e => { console.error(e); process.exit(1); });
