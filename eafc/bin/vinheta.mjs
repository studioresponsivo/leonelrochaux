#!/usr/bin/env node
// Vinheta do canal EA FC: spec → clipes preparados → mix de áudio → composição HyperFrames → render 1080p60.
// Uso: node eafc/bin/vinheta.mjs <slug> [spec.json] [--proof] [--no-render]
//   spec padrão: eafc/specs/<slug>.json. Saída: work/eafc/<slug>/<nome>/ e entregas/eafc/<slug>/<nome>.mp4 (+ -previa.mp4)
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { composeVinheta } from "../engine/vinheta.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const [slug, ...rest] = process.argv.slice(2);
const flags = rest.filter((a) => a.startsWith("--"));
const specArg = rest.find((a) => !a.startsWith("--"));
if (!slug) { console.error("uso: vinheta.mjs <slug> [spec.json] [--proof] [--no-render]"); process.exit(1); }
const sh = (cmd, opt = {}) => execSync(cmd, { stdio: "pipe", maxBuffer: 1 << 28, ...opt }).toString();
const f2 = (n) => +(+n).toFixed(3);
const fail = (m) => { console.error("✗ " + m); process.exit(1); };
const abs = (p) => (path.isAbsolute(p) ? p : path.join(ROOT, p));
const mb = (p) => (fs.statSync(p).size / 1e6).toFixed(1) + " MB";

const specPath = [specArg && abs(specArg), specArg && path.join(ROOT, "eafc/specs", specArg), path.join(ROOT, "eafc/specs", `${slug}.json`)].filter(Boolean).find((p) => fs.existsSync(p));
if (!specPath) fail(`spec não encontrado: ${specArg || slug + ".json"} (procurei em eafc/specs/)`);
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const name = spec.name || path.basename(specPath, ".json");
const FPS = spec.fps || 60;
const P = path.join(ROOT, "work/eafc", slug, name);
for (const d of ["assets/media", "assets/img", "assets/fonts", "assets/sfx", "assets/vendor"]) fs.mkdirSync(path.join(P, d), { recursive: true });

// ── assets estáticos ──────────────────────────────────────────────────────────
const cpDir = (from, to) => { for (const f of fs.readdirSync(from)) if (fs.statSync(path.join(from, f)).isFile()) fs.copyFileSync(path.join(from, f), path.join(to, f)); };
cpDir(path.join(ROOT, "eafc/assets/fonts"), path.join(P, "assets/fonts"));
cpDir(path.join(ROOT, "eafc/assets/sfx"), path.join(P, "assets/sfx"));
cpDir(path.join(ROOT, "eafc/assets/vendor"), path.join(P, "assets/vendor"));
const images = {};
for (const [k, src] of Object.entries(spec.images || {})) {
  const s = abs(src); if (!fs.existsSync(s)) fail(`imagem não encontrada: ${src}`);
  const dst = `assets/img/${k}${path.extname(s)}`; fs.copyFileSync(s, path.join(P, dst)); images[k] = dst;
}
if (spec.crest) { const s = abs(spec.crest); if (!fs.existsSync(s)) fail(`escudo não encontrado: ${spec.crest}`); fs.copyFileSync(s, path.join(P, "assets/img/crest.png")); images.crest = "assets/img/crest.png"; }

// ── clipes: recorte (tira PiP/HUD), velocidade, interpolação para 60 fps ─────────
const probe = (f) => { const [w, h, r] = sh(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 "${f}"`).trim().split(","); const [a, b] = r.split("/"); return { w: +w, h: +h, fps: +a / +(b || 1) }; };
const dur = (f) => +sh(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${f}"`).trim();
const clips = {};
const crop = spec.crop || [1640, 922, 0, 158]; // [w,h,x,y] em 1920x1080: fora ficam o PiP (direita/alto) e o placar (alto)
for (const [k, c] of Object.entries(spec.clips || {})) {
  const src = abs(c.src); if (!fs.existsSync(src)) fail(`clipe não encontrado: ${c.src}`);
  const out = path.join(P, "assets/media", `${k}.mp4`);
  if (!fs.existsSync(out)) {
    const speed = c.speed ?? 1; const pr = probe(src);
    const cr = c.crop || crop;
    const vf = [`crop=${cr[0]}:${cr[1]}:${cr[2]}:${cr[3]}`, `scale=1920:1080:flags=lanczos`];
    if (speed !== 1) vf.push(`setpts=${f2(1 / speed)}*PTS`);
    if (speed !== 1 || pr.fps < FPS - 1) vf.push(`minterpolate=fps=${FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1`); else vf.push(`fps=${FPS}`);
    sh(`ffmpeg -v error -y -ss ${c.in} -t ${c.dur} -i "${src}" -an -vf "${vf.join(",")}" -c:v libx264 -crf 12 -preset medium -pix_fmt yuv420p "${out}"`);
  }
  clips[k] = { file: `${k}.mp4`, dur: f2(dur(out)) };
  // stills para o glitch
  sh(`ffmpeg -v error -y -i "${out}" -frames:v 1 -q:v 2 "${path.join(P, "assets/media", `${k}-first.jpg`)}"`);
  sh(`ffmpeg -v error -y -sseof -0.05 -i "${out}" -frames:v 1 -q:v 2 "${path.join(P, "assets/media", `${k}-last.jpg`)}"`);
}

// ── camas sintetizadas + torcida ─────────────────────────────────────────────
const T = spec.duration || 7;
const M = path.join(P, "assets/media");
if (!fs.existsSync(path.join(M, "drone.wav"))) {
  const tHit = spec.beats?.lockup ?? spec.beats?.title ?? 4.6;
  sh(`ffmpeg -v error -y -f lavfi -i "sine=frequency=55:duration=${T + 0.2}" -f lavfi -i "sine=frequency=82.41:duration=${T + 0.2}" -f lavfi -i "anoisesrc=color=brown:duration=${T + 0.2}:amplitude=0.6:seed=7" -filter_complex "[0]volume=0.5[a];[1]volume=0.22[b];[2]lowpass=f=180,volume=0.9[c];[a][b][c]amix=inputs=3:normalize=0,tremolo=f=0.6:d=0.25,lowpass=f=240,volume='if(lt(t,${tHit}),0.25+0.55*t/${tHit},if(lt(t,${T - 0.2}),0.8,0.8*(${T}-t)/0.2))':eval=frame,afade=t=in:d=0.4,aresample=48000" -ac 2 -c:a pcm_s16le "${M}/drone.wav"`);
  sh(`ffmpeg -v error -y -f lavfi -i "aevalsrc=0.9*sin(2*PI*(28+62*exp(-t*6))*t)*exp(-t*3.2):d=1.4:s=48000" -af "lowpass=f=160,aresample=48000" -ac 2 -c:a pcm_s16le "${M}/boom.wav"`);
}
if (spec.crowd && !fs.existsSync(path.join(M, "crowd.wav"))) {
  const c = spec.crowd; sh(`ffmpeg -v error -y -ss ${c.in} -t ${c.dur} -i "${abs(c.src)}" -vn -af "highpass=f=90,lowpass=f=7000,aresample=48000" -ac 2 -c:a pcm_s16le "${M}/crowd.wav"`);
}

// ── composição ────────────────────────────────────────────────────────────────
const { html, audio, proof, log } = composeVinheta(spec, { clips, images });
log.forEach((l) => console.log(l));

// ── mix de áudio (um arquivo só, determinístico) ───────────────────────────────
const inputs = [], chains = [];
audio.forEach((e, i) => {
  const f = path.join(P, "assets", e.file); if (!fs.existsSync(f)) { console.log(`⚠ áudio ausente: ${e.file}`); return; }
  const n = inputs.length; inputs.push(`-i "${f}"`);
  const d = e.dur ?? Math.max(0.05, Math.min(dur(f) - (e.trim || 0), T - e.at));
  const parts = [`atrim=start=${f2(e.trim || 0)}:duration=${f2(d)}`, "asetpts=PTS-STARTPTS", "aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo"];
  if (e.fadeIn) parts.push(`afade=t=in:d=${f2(e.fadeIn)}`);
  if (e.fadeOut) parts.push(`afade=t=out:st=${f2(Math.max(0, d - e.fadeOut))}:d=${f2(e.fadeOut)}`);
  parts.push(`volume=${f2(e.gain ?? 1)}`, `adelay=${Math.round(e.at * 1000)}|${Math.round(e.at * 1000)}`);
  chains.push(`[${n}]${parts.join(",")}[a${n}]`);
});
const mixF = `${chains.join(";")};${chains.map((_, i) => `[a${i}]`).join("")}amix=inputs=${chains.length}:normalize=0:dropout_transition=0,atrim=0:${f2(T)},volume=0.34,alimiter=limit=0.89:attack=3:release=80:level=false,afade=t=out:st=${f2(T - 0.06)}:d=0.06`;
sh(`ffmpeg -v error -y ${inputs.join(" ")} -filter_complex "${mixF}" -ar 48000 -ac 2 -c:a aac -b:a 320k "${M}/mix.m4a"`);
const peak = sh(`ffmpeg -i "${M}/mix.m4a" -af "volumedetect" -f null - 2>&1 | grep -o "max_volume: [-0-9.]* dB"`).trim();

fs.writeFileSync(path.join(P, "index.html"), html);
if (!fs.existsSync(path.join(P, "hyperframes.json"))) fs.writeFileSync(path.join(P, "hyperframes.json"), JSON.stringify({ paths: { assets: "assets" } }));
console.log(`• ${name}: 1920x1080 ${FPS}fps, ${T}s, clipes ${Object.entries(clips).map(([k, c]) => `${k} ${c.dur}s`).join(", ") || "nenhum"}, mix ${peak}`);

const lint = sh(`cd "${P}" && npx hyperframes lint . 2>&1 || true`);
const errs = lint.split("\n").filter((l) => l.includes("✗"));
if (errs.length) { console.log(errs.join("\n")); fail("lint com erros"); }

if (flags.includes("--proof")) {
  const times = proof.filter((t) => t < T - 0.02);
  sh(`cd "${P}" && rm -rf snapshots && npx hyperframes snapshot --at ${times.join(",")} --no-end --describe false`);
  const sheets = fs.readdirSync(path.join(P, "snapshots")).filter((f) => f.startsWith("contact-sheet"));
  console.log(`• prova (${times.length} frames): ${sheets.map((s) => path.join(P, "snapshots", s)).join(" ")}`);
}

if (!flags.includes("--no-render")) {
  const t0 = Date.now();
  const dest = path.join(ROOT, "entregas/eafc", slug); fs.mkdirSync(dest, { recursive: true });
  sh(`cd "${P}" && npx hyperframes render . --fps ${FPS} --crf ${spec.crf ?? 12} -o ./render.mp4`);
  sh(`ffmpeg -v error -i "${P}/render.mp4" -c copy -movflags +faststart -y "${dest}/${name}.mp4"`);
  sh(`ffmpeg -v error -i "${P}/render.mp4" -vf scale=1280:720 -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 160k -y "${dest}/${name}-previa.mp4"`);
  // histórico do canal (para variar nos próximos trabalhos)
  const hp = path.join(ROOT, "eafc/specs/historico.json");
  const hist = fs.existsSync(hp) ? JSON.parse(fs.readFileSync(hp, "utf8")) : [];
  hist.push({ name, slug, type: "vinheta", duration: T, beats: spec.beats, title: spec.title, date: new Date().toISOString().slice(0, 10) });
  fs.writeFileSync(hp, JSON.stringify(hist, null, 1));
  console.log(`• render ${((Date.now() - t0) / 60000).toFixed(1)} min → entregas/eafc/${slug}/${name}.mp4 (${mb(`${dest}/${name}.mp4`)}), prévia ${mb(`${dest}/${name}-previa.mp4`)}`);
}
