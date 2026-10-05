#!/usr/bin/env node
// Roteiro (spec) → vídeo pronto. Uso:
//   node studio/bin/make.mjs <slug> <spec.json> [--proof] [--no-render]
// Lê work/<slug>/{source.mp4,transcript.json}; escreve work/<slug>/<nome>/ e entregas/<slug>/<nome>.mp4 (+ -previa.mp4)
// Motor: estilo v2 (studio/engine/v2) por padrão; roteiros antigos (com beat "hook") usam o v1 (studio/engine/compose.mjs).
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { compose } from "../engine/compose.mjs";
import { composeV2 } from "../engine/v2/compose.mjs";
import { buildPlan, variety } from "../engine/v2/plan.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const [slug, specArg, ...flags] = process.argv.slice(2);
if (!slug || !specArg) { console.error("uso: make.mjs <slug> <spec.json> [--proof] [--no-render]"); process.exit(1); }
const sh = (cmd, opt = {}) => execSync(cmd, { stdio: opt.quiet === false ? "inherit" : "pipe", maxBuffer: 1 << 28, ...opt }).toString();
const f2 = (n) => +(+n).toFixed(3);
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9%]/g, "");
const fail = (m) => { console.error("✗ " + m); process.exit(1); };

const W = path.join(ROOT, "work", slug);
const specPath = fs.existsSync(specArg) ? specArg : path.join(W, specArg);
if (!fs.existsSync(specPath)) fail(`roteiro não encontrado: ${specArg} (coloque em work/${slug}/)`);
let spec;
try { spec = JSON.parse(fs.readFileSync(specPath, "utf8")); } catch (e) { fail(`JSON inválido em ${path.basename(specPath)}: ${e.message}`); }
const name = spec.name || path.basename(specPath, ".json");
const fmtIn = spec.format || "vertical";
if (!["vertical", "horizontal", "portfolio"].includes(fmtIn)) fail(`format "${fmtIn}" inválido (vertical | horizontal | portfolio)`);
const portfolio = fmtIn === "portfolio";
const V = fmtIn === "vertical" || (portfolio && spec.aspect === "vertical");
const fmt = V ? "vertical" : "horizontal";
const isV1 = spec.engine === "v1" || (spec.beats || []).some((b) => b.do === "hook");
const P = path.join(W, name);
const src = path.join(W, "source.mp4");
const hasSrc = fs.existsSync(src);
const tPath = path.join(W, "transcript.json");
const words = fs.existsSync(tPath) ? JSON.parse(fs.readFileSync(tPath, "utf8")) : [];
if (!portfolio && !hasSrc) fail(`falta work/${slug}/source.mp4 (rode studio/bin/prep.sh)`);
if (!portfolio && !words.length) fail(`falta work/${slug}/transcript.json (rode studio/bin/prep.sh)`);
const NW = words.map((w) => norm(w.text));

// ── âncoras de texto → índices de palavras ─────────────────────────────────────
function findPhrase(phrase, near, within) {
  const tok = String(phrase).split(/\s+/).map(norm).filter(Boolean);
  const hits = [];
  for (let i = 0; i + tok.length <= NW.length; i++) {
    let ok = true;
    for (let j = 0; j < tok.length; j++) if (NW[i + j] !== tok[j]) { ok = false; break; }
    if (ok && (!within || within(i))) hits.push(i);
  }
  if (!hits.length) return null;
  if (near != null) hits.sort((a, b) => Math.abs(words[a].start - near) - Math.abs(words[b].start - near));
  return [hits[0], hits[0] + tok.length - 1];
}

// cortes — "all" = vídeo já editado no Premiere: usa tudo; trechos de tela via screenRanges
if (spec.cuts === "all") {
  if (!hasSrc) fail(`"cuts":"all" precisa de work/${slug}/source.mp4`);
  const dur = +sh(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${src}"`).trim();
  const rs = (spec.screenRanges || []).map((r, ri) => {
    let a = r.in, b = r.out;
    if (r.from != null) {
      const s0 = findPhrase(r.from, r.near); if (!s0) fail(`screenRange ${ri + 1}: não achei "${r.from}"`);
      const e0 = findPhrase(r.to, words[s0[0]].start, (i) => i >= s0[0]); if (!e0) fail(`screenRange ${ri + 1}: não achei "${r.to}"`);
      a = words[s0[0]].start - 0.05; b = words[e0[1]].end + 0.1;
    }
    return { in: Math.max(0, a), out: Math.min(dur, b), screen: r.screen };
  }).sort((x, y) => x.in - y.in);
  const all = []; let pos = 0;
  for (const r of rs) { if (r.in - pos > 0.3) all.push({ in: pos, out: r.in }); all.push(r); pos = r.out; }
  if (dur - pos > 0.05) all.push({ in: pos, out: dur });
  spec.cuts = all;
}
let t = 0;
const cuts = (spec.cuts || []).map((c, ci) => {
  let a = c.in, b = c.out;
  if (c.from != null) {
    const s = findPhrase(c.from, c.near); if (!s) fail(`corte ${ci + 1}: não achei "${c.from}" na transcrição${c.near != null ? ` (perto de ${c.near}s)` : ""}`);
    a = Math.max(words[s[0] - 1]?.end ?? 0, words[s[0]].start - 0.06);
    const e = findPhrase(c.to, words[s[0]].start + 1, (i) => i >= s[0]); if (!e) fail(`corte ${ci + 1}: não achei o fim "${c.to}" depois de "${c.from}"`);
    b = Math.min(words[e[1]].end + 0.12, words[e[1] + 1]?.start ?? Infinity);
    // "tight": o Parakeet cola o silêncio seguinte na última palavra — corta no fim real da fala (silencedetect)
    if (spec.tight && hasSrc && c.out == null) {
      const ws = words[e[1]].start, win = b - ws;
      if (win > 0.45) {
        const log = execSync(`ffmpeg -v info -ss ${ws} -t ${f2(win)} -i "${src}" -vn -af silencedetect=n=-34dB:d=0.14 -f null - 2>&1 || true`, { maxBuffer: 1 << 24 }).toString();
        const m = log.match(/silence_start: ([\d.]+)/);
        if (m && +m[1] > 0.18) b = Math.min(b, ws + +m[1] + 0.1);
      }
    }
    if (c.outMax != null) b = Math.min(b, c.outMax); // teto manual (ex.: o layout da tela muda logo depois da frase)
  }
  if (a == null || b == null || b <= a) fail(`corte ${ci + 1}: use "from"/"to" (texto) ou "in"/"out" (segundos)`);
  const cut = { in: f2(a), out: f2(b), t0: f2(t), dur: f2(b - a), screen: c.screen || null, box: c.box || null, faceX: c.faceX ?? null };
  t += b - a;
  return cut;
});
const endVoice = f2(t);
const T = (s) => { const c = cuts.find((c) => s >= c.in - 0.001 && s <= c.out + 0.001); if (!c) fail(`tempo ${s}s do vídeo original está fora dos cortes`); return f2(c.t0 + s - c.in); };

// âncora: texto (procura dentro dos cortes, na ordem) ou número (segundos da fonte; no portfólio sem voz = segundos da timeline)
let lastT = 0;
function spanOf(v, label, after = lastT) {
  if (v == null) fail(`${label}: falta a âncora ("at")`);
  if (v === "start") return [0.02, 0.02];
  if (typeof v === "number") { const x = cuts.length ? T(v) : f2(v); return [x, x]; }
  if (!cuts.length) fail(`${label}: âncora de texto "${v}" sem transcrição/cortes — use segundos`);
  const inCut = (i) => cuts.some((c) => words[i].start >= c.in - 0.02 && words[i].start < c.out - 0.05);
  const tok = String(v).split(/\s+/).map(norm).filter(Boolean);
  const cands = [];
  for (let i = 0; i + tok.length <= NW.length; i++) {
    if (!inCut(i)) continue;
    let ok = true; for (let j = 0; j < tok.length; j++) if (NW[i + j] !== tok[j]) { ok = false; break; }
    if (!ok) continue;
    const c = cuts.find((c) => words[i].start >= c.in - 0.02 && words[i].start < c.out);
    const e = words[i + tok.length - 1].end;
    cands.push([T(Math.max(words[i].start, c.in)), T(Math.min(e, c.out))]);
  }
  cands.sort((a, b) => a[0] - b[0]);
  const pick = cands.find((x) => x[0] >= after - 0.5) ?? cands[0];
  if (pick == null) fail(`${label}: não achei "${v}" dentro dos cortes (confira a grafia na transcript.txt)`);
  return pick;
}
const anchor = (v, label, after) => spanOf(v, label, after)[0];

// ── mídia base ──────────────────────────────────────────────────────────────────
for (const d of ["assets/media", "assets/fonts", "assets/sfx", "assets/vendor", "assets/brand"]) fs.mkdirSync(path.join(P, d), { recursive: true });
for (const d of ["fonts", "sfx", "vendor", "brand"]) sh(`cp -r "${ROOT}/studio/assets/${d}/." "${P}/assets/${d}/"`);
const brandFont = fs.existsSync(`${ROOT}/studio/assets/fonts-marca/articulat-700.woff2`);
if (brandFont) { fs.mkdirSync(`${P}/assets/fonts-marca`, { recursive: true }); sh(`cp -r "${ROOT}/studio/assets/fonts-marca/." "${P}/assets/fonts-marca/"`); }
const cache = path.join(W, "cache"); fs.mkdirSync(cache, { recursive: true });
// qualidade: resolução e fps da câmera (fps máx. 60), intermediário quase sem perda
const probe = hasSrc ? sh(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 "${src}"`).trim().split(",") : ["1920", "1080", "60/1"];
const [fn, fd] = probe[2].split("/").map(Number);
const FPS = spec.fps || Math.min(60, Math.round(fn / (fd || 1)));
if (cuts.length) {
  const segs = cuts.map((c) => {
    const f = path.join(cache, `seg_${c.in}_${c.out}_${FPS}.mov`);
    if (!fs.existsSync(f)) sh(`ffmpeg -v error -ss ${c.in} -i "${src}" -t ${c.dur} -vf "fps=${FPS}" -c:v libx264 -crf 10 -preset fast -pix_fmt yuv420p -af "afade=t=in:d=0.012,afade=t=out:st=${f2(c.dur - 0.015)}:d=0.015" -ar 48000 -ac 2 -c:a pcm_s16le -y "${f}"`);
    return f;
  });
  fs.writeFileSync(path.join(P, "segs.txt"), segs.map((s) => `file '${s}'`).join("\n"));
  sh(`ffmpeg -v error -f concat -safe 0 -i "${P}/segs.txt" -c copy -y "${P}/joined.mov"`);
  sh(`ffmpeg -v error -i "${P}/joined.mov" -map 0:v -c copy -y "${P}/assets/media/edit.mp4"`);
  sh(`ffmpeg -v error -i "${P}/joined.mov" -map 0:a -af "highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-14:TP=-1.5:LRA=7" -ar 48000 -c:a aac -b:a 192k -y "${P}/assets/media/voice.m4a"`);
  fs.rmSync(path.join(P, "joined.mov"));
}

// rosto (vertical: câmera segue; horizontal v2: origem do punch)
let faces = {};
if (cuts.length && !portfolio && (V || !isV1)) {
  const list = cuts.map((c, i) => (c.screen ? null : [i, c.in, c.out])).filter(Boolean);
  const key = path.join(cache, "faces.json");
  const old = fs.existsSync(key) ? JSON.parse(fs.readFileSync(key, "utf8")) : {};
  const need = list.filter(([, a, b]) => !old[`${a}_${b}`]);
  if (need.length) {
    fs.writeFileSync(path.join(cache, "faces-req.json"), JSON.stringify(need.map(([, a, b]) => [a, b])));
    const got = JSON.parse(sh(`python3 "${ROOT}/studio/bin/faces.py" "${src}" "${cache}/faces-req.json"`));
    need.forEach(([, a, b], k) => (old[`${a}_${b}`] = got[k]));
    fs.writeFileSync(key, JSON.stringify(old));
  }
  list.forEach(([i, a, b]) => (faces[i] = old[`${a}_${b}`]));
}
const copyIn = (file) => { const f = path.join(W, file); if (!fs.existsSync(f)) fail(`arquivo não encontrado: work/${slug}/${file}`); fs.copyFileSync(f, path.join(P, "assets/media", path.basename(file))); };
if (spec.cta?.image) copyIn(spec.cta.image);

let html, total, summary = "", proofTimes = [];
if (isV1) {
  // ── v1 (legado) ───────────────────────────────────────────────────────────────
  const ctaDur = spec.cta ? (spec.cta.seconds ?? 5) : 0;
  total = f2(endVoice + ctaDur);
  const beats = (spec.beats || []).map((b, bi) => {
    const r = { ...b, t: f2(anchor(b.at, `beat ${bi + 1} (${b.do})`) + (b.offset || 0)) };
    lastT = r.t;
    for (const k of ["flash", "complete", "until"]) if (b[k] != null) r[k] = anchor(b[k], `beat ${bi + 1}.${k}`, r.t);
    if (b.cards) r.cards = b.cards.map((c, ci) => ({ ...c, mt: c.at != null ? anchor(c.at, `beat ${bi + 1} card ${ci + 1}`, 0) : null }));
    if (b.items) r.items = b.items.map((it, ii) => ({ ...it, t: anchor(it.at, `beat ${bi + 1} item ${ii + 1}`, r.t) }));
    return r;
  }).sort((a, b) => a.t - b.t);
  const screens = {};
  for (const [id, s] of Object.entries(spec.screens || {})) {
    const first = cuts.find((c) => c.screen === id);
    if (!first) continue;
    const still = s.still != null ? s.still : f2(first.in + Math.min(2, first.dur / 2));
    const file = `screen-${id}.png`;
    if (!s.live) sh(`ffmpeg -v error -ss ${still} -i "${src}" -frames:v 1 -vf scale=1920:1080 -y "${P}/assets/media/${file}"`);
    screens[id] = { file, live: !!s.live, crop: s.crop || [0, 0, 1490, 1080], cam: s.cam || [1490, 740, 430, 340] };
  }
  beats.forEach((b, bi) => (b.cards || []).forEach((c, ci) => {
    if (c.type !== "clip" || c.src == null) return;
    c.file = `card-${bi}-${ci}.mp4`;
    sh(`ffmpeg -v error -ss ${c.src} -i "${src}" -t ${(b.hold ?? 3) + 1.5} -an -vf "fps=${FPS},scale=1280:-2" -c:v libx264 -crf 14 -preset fast -pix_fmt yuv420p -y "${P}/assets/media/${c.file}"`);
  }));
  for (const b of spec.beats || []) for (const c of b.cards || []) if (c.type === "image") copyIn(c.src);
  html = compose({ fmt, cuts, beats, words, faces, screens, spec, endVoice, total, brandFont });
  summary = `${cuts.length} cortes, ${beats.length} beats (motor v1)`;
  proofTimes = [0.6, ...cuts.map((c) => f2(c.t0 + c.dur / 2)), ...beats.map((b) => f2(b.t + 0.6)), ctaDur ? f2(endVoice + 2) : null];
} else {
  // ── v2 ────────────────────────────────────────────────────────────────────────
  const tw = [];
  for (const c of cuts) for (const w of words) if (w.start >= c.in - 0.02 && w.start < c.out - 0.05) tw.push({ t: f2(c.t0 + Math.max(w.start, c.in) - c.in), e: f2(c.t0 + Math.min(w.end, c.out) - c.in), txt: w.text });
  const warns = [];
  const ctx = {
    V, W: V ? 1080 : 1920, H: V ? 1920 : 1080, portfolio, tw, endVoice, fail, srcW: +probe[0], srcH: +probe[1],
    anchor: (v, label, after) => { const x = anchor(v, label, after); lastT = x; return x; },
    span: (v, label, after) => spanOf(v, label, after),
  };
  const plan = buildPlan(spec, ctx);
  warns.push(...plan.warns);
  const ctaDur = spec.cta ? (spec.cta.seconds ?? 5) : 0;
  const bodyEnd = portfolio && !endVoice ? plan.end : endVoice;
  total = f2(bodyEnd + ctaDur);
  // mídia das cenas (trechos do vídeo original ou arquivos em work/<slug>/), cortada/escalada no tamanho final
  for (const m of plan.media) {
    const [bw, bh] = m.box, [x1, y1, x2, y2] = m.crop;
    if (m.image) { copyIn(m.src); m.file = path.basename(m.src); continue; }
    const fromFile = typeof m.src === "string";
    const input = fromFile ? path.join(W, m.src) : src;
    if (!fs.existsSync(input)) fail(`mídia não encontrada: ${fromFile ? `work/${slug}/${m.src}` : "source.mp4"}`);
    const ss = fromFile ? (m.from ?? 0) : m.src;
    if (m.still) { // quadro congelado (PNG) — a tela do original pode estar se mexendo
      const key = `st_${fromFile ? norm(m.src) : m.src}_${m.crop.join("-")}_${bw}x${bh}.png`, out = path.join(cache, key);
      if (!fs.existsSync(out)) sh(`ffmpeg -v error -ss ${ss} -i "${input}" -frames:v 1 -vf "${fromFile ? "" : `crop=${x2 - x1}:${y2 - y1}:${x1}:${y1},`}scale=${bw}:${bh}:force_original_aspect_ratio=increase:flags=lanczos,crop=${bw}:${bh}" -y "${out}"`);
      m.file = key; m.image = true;
      fs.copyFileSync(out, path.join(P, "assets/media", key));
      continue;
    }
    const key = `cw_${fromFile ? norm(m.src) : m.src}_${m.crop.join("-")}_${bw}x${bh}_${m.dur}_${FPS}.mp4`;
    const out = path.join(cache, key);
    const cropF = fromFile ? "" : `crop=${x2 - x1}:${y2 - y1}:${x1}:${y1},`;
    if (!fs.existsSync(out)) sh(`ffmpeg -v error -ss ${ss} -i "${input}" -t ${m.dur} -an -vf "${cropF}scale=${bw}:${bh}:force_original_aspect_ratio=increase:flags=lanczos,crop=${bw}:${bh},fps=${FPS}" -c:v libx264 -crf 12 -preset fast -pix_fmt yuv420p -y "${out}"`);
    m.file = key;
    fs.copyFileSync(out, path.join(P, "assets/media", key));
  }
  if (spec.music) copyIn(spec.music.file ?? spec.music);
  const hush = (spec.hush || []).map((h, i) => { const [a, b] = spanOf(h, `hush ${i + 1}`, 0); return [f2(a - 0.2), f2(b + 0.2)]; });
  const screens = {};
  for (const [id, s] of Object.entries(spec.screens || {})) screens[id] = { crop: s.crop || [0, 0, 1490, 1080], cam: s.cam || [1490, 740, 430, 340] };
  for (const c of cuts) if (c.screen && !screens[c.screen]) fail(`corte usa "screen":"${c.screen}" mas "screens" não define esse id`);
  const out = composeV2({ fmt, V, W: ctx.W, H: ctx.H, portfolio, cuts, words, faces, screens, spec, endVoice: bodyEnd, total, brandFont,
    scenes: plan.scenes, punches: plan.punches, focus: plan.focus, phr: plan.phr, hush, voice: cuts.length > 0 });
  html = out.html;
  // histórico de variação
  const histPath = path.join(ROOT, "studio/specs/historico.json");
  const hist = fs.existsSync(histPath) ? JSON.parse(fs.readFileSync(histPath, "utf8")) : [];
  const entry = { name, slug, format: fmtIn, opening: plan.opening, patterns: plan.scenes.filter((s) => s.origin !== "opening").map((s) => s.do), transitions: out.used.transitions, chapterBg: out.used.chapterBg, date: new Date().toISOString().slice(0, 10) };
  warns.push(...variety(entry, hist));
  const idx = hist.findIndex((h) => h.name === entry.name);
  if (idx >= 0) hist.splice(idx, 1);
  hist.push(entry);
  fs.writeFileSync(histPath, JSON.stringify(hist, null, 1) + "\n");
  summary = `${cuts.length} cortes, abertura ${plan.opening ?? "—"}, ${plan.scenes.length} cenas [${[...new Set(entry.patterns)].join(", ")}], ${out.log.join("; ")}`;
  for (const w of warns) console.log(`⚠ ${w}`);
  // folha de prova: frames da abertura, de cada cena e do CTA
  const pt = [0.35, 1.3];
  if (plan.faceT) pt.push(plan.faceT + 0.45);
  for (const s of plan.scenes) { pt.push(s.t0 + Math.min(0.9, (s.t1 - s.t0) * 0.4)); if (s.t1 - s.t0 > 2.6) pt.push(s.t1 - 0.9); }
  for (const c of cuts) if (c.dur > 3) pt.push(c.t0 + c.dur / 2);
  if (ctaDur) pt.push(bodyEnd + 2.4);
  proofTimes = pt;
}
fs.writeFileSync(path.join(P, "index.html"), html);
if (!fs.existsSync(path.join(P, "hyperframes.json"))) fs.writeFileSync(path.join(P, "hyperframes.json"), JSON.stringify({ paths: { assets: "assets" } }));
fs.writeFileSync(path.join(P, "plan.json"), JSON.stringify({ cuts, endVoice, total }, null, 1));
console.log(`• ${name}: ${fmtIn} ${FPS}fps${brandFont ? "" : " (SEM fonte Articulat)"} (fonte ${probe[0]}x${probe[1]}), ${summary}, total ${total}s`);

const lint = sh(`cd "${P}" && npx hyperframes lint . 2>&1 || true`);
const errs = lint.split("\n").filter((l) => l.includes("✗"));
if (errs.length) { console.log(errs.join("\n")); fail("lint com erros"); }

if (flags.includes("--proof")) {
  let times = [...new Set(proofTimes.filter((x) => x != null && x < total - 0.05).map(f2))].sort((a, b) => a - b).filter((x, i, a) => i === 0 || x - a[i - 1] > 0.8);
  if (times.length > 20) times = times.filter((_, i) => i % Math.ceil(times.length / 20) === 0);
  sh(`cd "${P}" && rm -rf snapshots && npx hyperframes snapshot --at ${times.join(",")} --no-end --describe false`);
  const sheets = fs.readdirSync(path.join(P, "snapshots")).filter((f) => f.startsWith("contact-sheet"));
  console.log(`• prova (${times.length} frames): ${sheets.map((s) => path.join(P, "snapshots", s)).join(" ")}`);
}

if (!flags.includes("--no-render")) {
  const out = path.join(ROOT, "entregas", slug); fs.mkdirSync(out, { recursive: true });
  const t0 = Date.now();
  sh(`cd "${P}" && npx hyperframes render . --fps ${FPS} --crf ${spec.crf ?? 14} -o ./render.mp4`);
  const big = fs.statSync(`${P}/render.mp4`).size > 95e6;
  const dest = big ? path.join(out, "grandes") : out; fs.mkdirSync(dest, { recursive: true });
  sh(`ffmpeg -v error -i "${P}/render.mp4" -c copy -movflags +faststart -y "${dest}/${name}.mp4"`); // sem recompressão
  if (big) {
    // versão para postar ≤ 93 MB (cabe no GitHub; bem acima do que as redes usam após recomprimir)
    const dur = +sh(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${P}/render.mp4"`).trim();
    const kbps = Math.floor((93e6 * 8) / dur / 1000) - 200;
    const pass = `-c:v libx264 -preset slow -b:v ${kbps}k -maxrate ${Math.floor(kbps * 1.4)}k -bufsize ${kbps * 2}k -pix_fmt yuv420p`;
    sh(`cd "${P}" && ffmpeg -v error -y -i render.mp4 ${pass} -pass 1 -an -f mp4 /dev/null && ffmpeg -v error -y -i render.mp4 ${pass} -pass 2 -c:a aac -b:a 192k -movflags +faststart "${out}/${name}-postar.mp4"`);
    console.log(`• master > 95 MB em entregas/${slug}/grandes/ (fora do git); versão para postar: entregas/${slug}/${name}-postar.mp4 (${kbps} kbps)`);
  }
  const pv = V ? "720:1280" : "960:540";
  sh(`ffmpeg -v error -i "${P}/render.mp4" -vf scale=${pv} -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k -y "${out}/${name}-previa.mp4"`);
  const mb = (f) => (fs.statSync(f).size / 1e6).toFixed(1) + " MB";
  console.log(`• render ${((Date.now() - t0) / 60000).toFixed(1)} min → ${path.relative(ROOT, dest)}/${name}.mp4 (${mb(`${dest}/${name}.mp4`)}), prévia ${mb(`${out}/${name}-previa.mp4`)}`);
}
