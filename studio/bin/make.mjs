#!/usr/bin/env node
// Roteiro (spec) → vídeo pronto. Uso:
//   node studio/bin/make.mjs <slug> <spec.json> [--proof] [--no-render]
// Lê work/<slug>/{source.mp4,transcript.json}; escreve work/<slug>/<nome>/ e entregas/<slug>/<nome>.mp4 (+ -previa.mp4)
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { compose } from "../engine/compose.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const [slug, specArg, ...flags] = process.argv.slice(2);
if (!slug || !specArg) { console.error("uso: make.mjs <slug> <spec.json> [--proof] [--no-render]"); process.exit(1); }
const sh = (cmd, opt = {}) => execSync(cmd, { stdio: opt.quiet === false ? "inherit" : "pipe", maxBuffer: 1 << 28, ...opt }).toString();
const f2 = (n) => +(+n).toFixed(3);
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9%]/g, "");

const W = path.join(ROOT, "work", slug);
const specPath = fs.existsSync(specArg) ? specArg : path.join(W, specArg);
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const name = spec.name || path.basename(specPath, ".json");
const fmt = spec.format || "vertical";
const P = path.join(W, name);
const words = JSON.parse(fs.readFileSync(path.join(W, "transcript.json"), "utf8"));
const NW = words.map((w) => norm(w.text));
const fail = (m) => { console.error("✗ " + m); process.exit(1); };

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
  const dur = +sh(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${path.join(W, "source.mp4")}"`).trim();
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
const cuts = spec.cuts.map((c, ci) => {
  let a = c.in, b = c.out;
  if (c.from != null) {
    const s = findPhrase(c.from, c.near); if (!s) fail(`corte ${ci + 1}: não achei "${c.from}"`);
    a = Math.max(words[s[0] - 1]?.end ?? 0, words[s[0]].start - 0.06);
    const e = findPhrase(c.to, words[s[0]].start + 1, (i) => i >= s[0]); if (!e) fail(`corte ${ci + 1}: não achei "${c.to}"`);
    b = Math.min(words[e[1]].end + 0.12, words[e[1] + 1]?.start ?? Infinity);
  }
  const cut = { in: f2(a), out: f2(b), t0: f2(t), dur: f2(b - a), screen: c.screen || null };
  t += b - a;
  return cut;
});
const endVoice = f2(t);
const ctaDur = spec.cta ? (spec.cta.seconds ?? 5) : 0;
const total = f2(endVoice + ctaDur);
const T = (src) => { const c = cuts.find((c) => src >= c.in - 0.001 && src <= c.out + 0.001); if (!c) fail(`tempo ${src}s fora dos cortes`); return f2(c.t0 + src - c.in); };

// âncora de beat: texto (procura dentro dos cortes, na ordem) ou número (segundos da fonte)
let lastT = 0;
function anchor(v, label, after = lastT) {
  if (v == null) return null;
  if (v === "start") return 0.02;
  if (typeof v === "number") return T(v);
  const inCut = (i) => cuts.some((c) => words[i].start >= c.in - 0.02 && words[i].start < c.out - 0.05);
  const tok = String(v).split(/\s+/).map(norm).filter(Boolean);
  const cands = [];
  for (let i = 0; i + tok.length <= NW.length; i++) {
    if (!inCut(i)) continue;
    let ok = true; for (let j = 0; j < tok.length; j++) if (NW[i + j] !== tok[j]) { ok = false; break; }
    if (ok) cands.push(T(Math.max(words[i].start, cuts.find((c) => words[i].start >= c.in - 0.02 && words[i].start < c.out).in)));
  }
  cands.sort((a, b) => a - b);
  const pick = cands.find((x) => x >= after - 0.5) ?? cands[0];
  if (pick == null) fail(`${label}: não achei "${v}" dentro dos cortes`);
  return pick;
}
const beats = (spec.beats || []).map((b, bi) => {
  const r = { ...b, t: f2(anchor(b.at, `beat ${bi + 1} (${b.do})`) + (b.offset || 0)) };
  lastT = r.t;
  for (const k of ["flash", "complete", "until"]) if (b[k] != null) r[k] = anchor(b[k], `beat ${bi + 1}.${k}`, r.t);
  if (b.cards) r.cards = b.cards.map((c, ci) => ({ ...c, mt: c.at != null ? anchor(c.at, `beat ${bi + 1} card ${ci + 1}`, 0) : null }));
  if (b.items) r.items = b.items.map((it, ii) => ({ ...it, t: anchor(it.at, `beat ${bi + 1} item ${ii + 1}`, r.t) }));
  return r;
}).sort((a, b) => a.t - b.t);

// ── mídia ───────────────────────────────────────────────────────────────────────
for (const d of ["assets/media", "assets/fonts", "assets/sfx", "assets/vendor", "assets/brand"]) fs.mkdirSync(path.join(P, d), { recursive: true });
for (const d of ["fonts", "sfx", "vendor", "brand"]) sh(`cp -r "${ROOT}/studio/assets/${d}/." "${P}/assets/${d}/"`);
const brandFont = fs.existsSync(`${ROOT}/studio/assets/fonts-marca/articulat-700.woff2`);
if (brandFont) { fs.mkdirSync(`${P}/assets/fonts-marca`, { recursive: true }); sh(`cp -r "${ROOT}/studio/assets/fonts-marca/." "${P}/assets/fonts-marca/"`); }
const src = path.join(W, "source.mp4");
const cache = path.join(W, "cache"); fs.mkdirSync(cache, { recursive: true });
// qualidade: resolução e fps da câmera (fps máx. 60), intermediário quase sem perda
const probe = sh(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 "${src}"`).trim().split(",");
const [fn, fd] = probe[2].split("/").map(Number);
const FPS = spec.fps || Math.min(60, Math.round(fn / (fd || 1)));
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

// rosto (só vertical)
let faces = {};
if (fmt === "vertical") {
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

// telas (frame congelado ou ao vivo)
const screens = {};
for (const [id, s] of Object.entries(spec.screens || {})) {
  const first = cuts.find((c) => c.screen === id);
  if (!first) continue;
  const still = s.still != null ? s.still : f2(first.in + Math.min(2, first.dur / 2));
  const file = `screen-${id}.png`;
  if (!s.live) sh(`ffmpeg -v error -ss ${still} -i "${src}" -frames:v 1 -vf scale=1920:1080 -y "${P}/assets/media/${file}"`);
  screens[id] = { file, live: !!s.live, crop: s.crop || [0, 0, 1490, 1080], cam: s.cam || [1490, 740, 430, 340] };
}
// cards do gancho com "src" (segundos do vídeo original) → clipe próprio, de qualquer ponto do vídeo
beats.forEach((b, bi) => (b.cards || []).forEach((c, ci) => {
  if (c.type !== "clip" || c.src == null) return;
  c.file = `card-${bi}-${ci}.mp4`;
  sh(`ffmpeg -v error -ss ${c.src} -i "${src}" -t ${(b.hold ?? 3) + 1.5} -an -vf "fps=${FPS},scale=1280:-2" -c:v libx264 -crf 14 -preset fast -pix_fmt yuv420p -y "${P}/assets/media/${c.file}"`);
}));
for (const b of spec.beats || []) for (const c of b.cards || []) if (c.type === "image") sh(`cp "${path.join(W, c.src)}" "${P}/assets/media/${c.src}"`);
if (spec.cta?.image) sh(`cp "${path.join(W, spec.cta.image)}" "${P}/assets/media/${spec.cta.image}"`);

// ── composição ──────────────────────────────────────────────────────────────────
const html = compose({ fmt, cuts, beats, words, faces, screens, spec, endVoice, total, brandFont });
fs.writeFileSync(path.join(P, "index.html"), html);
if (!fs.existsSync(path.join(P, "hyperframes.json"))) fs.writeFileSync(path.join(P, "hyperframes.json"), JSON.stringify({ paths: { assets: "assets" } }));
fs.writeFileSync(path.join(P, "plan.json"), JSON.stringify({ cuts, beats: beats.map((b) => ({ do: b.do, t: b.t })), endVoice, total }, null, 1));
console.log(`• ${name}: ${fmt} ${FPS}fps${brandFont ? "" : " (SEM fonte Articulat)"} (fonte ${probe[0]}x${probe[1]}), ${cuts.length} cortes, ${beats.length} beats, voz ${endVoice}s + CTA ${ctaDur}s = ${total}s`);

const lint = sh(`cd "${P}" && npx hyperframes lint . 2>&1 || true`);
const errs = lint.split("\n").filter((l) => l.includes("✗"));
if (errs.length) { console.log(errs.join("\n")); fail("lint com erros"); }

if (flags.includes("--proof")) {
  const times = [...new Set([0.6, ...cuts.map((c) => f2(c.t0 + c.dur / 2)), ...beats.map((b) => f2(b.t + 0.6)), ctaDur ? f2(endVoice + 2) : null].filter((x) => x != null))]
    .sort((a, b) => a - b).filter((x, i, a) => i === 0 || x - a[i - 1] > 2.5).slice(0, 16);
  sh(`cd "${P}" && rm -rf snapshots && npx hyperframes snapshot --at ${times.join(",")} --no-end`);
  const sheets = fs.readdirSync(path.join(P, "snapshots")).filter((f) => f.startsWith("contact-sheet"));
  console.log(`• prova: ${sheets.map((s) => path.join(P, "snapshots", s)).join(" ")}`);
}

if (!flags.includes("--no-render")) {
  const out = path.join(ROOT, "entregas", slug); fs.mkdirSync(out, { recursive: true });
  const t0 = Date.now();
  sh(`cd "${P}" && npx hyperframes render . --fps ${FPS} --crf ${spec.crf ?? 14} -o ./render.mp4`);
  const big = fs.statSync(`${P}/render.mp4`).size > 95e6;
  const dest = big ? path.join(out, "grandes") : out; fs.mkdirSync(dest, { recursive: true });
  sh(`ffmpeg -v error -i "${P}/render.mp4" -c copy -movflags +faststart -y "${dest}/${name}.mp4"`); // sem recompressão
  if (big) console.log(`• arquivo final > 95 MB: fica em entregas/${slug}/grandes/ (fora do GitHub) — renderizar local ou combinar entrega`);
  const pv = fmt === "vertical" ? "720:1280" : "960:540";
  sh(`ffmpeg -v error -i "${P}/render.mp4" -vf scale=${pv} -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k -y "${out}/${name}-previa.mp4"`);
  const mb = (f) => (fs.statSync(f).size / 1e6).toFixed(1) + " MB";
  console.log(`• render ${((Date.now() - t0) / 60000).toFixed(1)} min → ${path.relative(ROOT, dest)}/${name}.mp4 (${mb(`${dest}/${name}.mp4`)}), prévia ${mb(`${out}/${name}-previa.mp4`)}`);
}
