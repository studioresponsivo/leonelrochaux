#!/usr/bin/env node
// Gancho/edição do canal EA FC: spec → composição HyperFrames sobre o vídeo cortado → render 1080p60.
// Uso: node eafc/bin/gancho.mjs <slug> [spec.json] [--proof] [--no-render]
//   spec padrão: eafc/specs/<slug>.json. Lê o vídeo em spec.source (ou work/eafc/<slug>/source.mp4).
//   Saída: work/eafc/<slug>/<nome>/ e entregas/eafc/<slug>/<nome>.mp4 (+ -previa.mp4)
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { composeGancho } from "../engine/gancho.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const [slug, ...rest] = process.argv.slice(2);
const flags = rest.filter((a) => a.startsWith("--"));
const specArg = rest.find((a) => !a.startsWith("--"));
if (!slug) { console.error("uso: gancho.mjs <slug> [spec.json] [--proof] [--no-render]"); process.exit(1); }
const sh = (cmd, opt = {}) => execSync(cmd, { stdio: "pipe", maxBuffer: 1 << 28, ...opt }).toString();
const f2 = (n) => +(+n).toFixed(3);
const fail = (m) => { console.error("✗ " + m); process.exit(1); };
const abs = (p) => (path.isAbsolute(p) ? p : path.join(ROOT, p));
const mb = (p) => (fs.statSync(p).size / 1e6).toFixed(1) + " MB";
const dur = (f) => +sh(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${f}"`).trim();

const specPath = [specArg && abs(specArg), specArg && path.join(ROOT, "eafc/specs", specArg), path.join(ROOT, "eafc/specs", `${slug}.json`)].filter(Boolean).find((p) => fs.existsSync(p));
if (!specPath) fail(`spec não encontrado: ${specArg || slug + ".json"} (procurei em eafc/specs/)`);
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const name = spec.name || path.basename(specPath, ".json");
const FPS = spec.fps || 60;
const P = path.join(ROOT, "work/eafc", slug, name);
for (const d of ["assets/media", "assets/img", "assets/fonts", "assets/sfx", "assets/vendor"]) fs.mkdirSync(path.join(P, d), { recursive: true });

// ── fonte (vídeo cortado do Leonel) ──────────────────────────────────────────
const srcPath = abs(spec.source || `work/eafc/${slug}/source.mp4`);
if (!fs.existsSync(srcPath)) fail(`vídeo não encontrado: ${srcPath}`);
const srcDst = path.join(P, "assets/media/source.mp4");
if (!fs.existsSync(srcDst)) fs.copyFileSync(srcPath, srcDst);
const source = { file: "source.mp4", dur: f2(dur(srcPath)) };
const [sw, shh, sr] = sh(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 "${srcPath}"`).trim().split(",");
if (+sw !== 1920 || +shh !== 1080) console.log(`⚠ fonte ${sw}x${shh} (esperado 1920x1080)`);

// ── assets estáticos ──────────────────────────────────────────────────────────
const cpDir = (from, to) => { if (!fs.existsSync(from)) return; for (const f of fs.readdirSync(from)) if (fs.statSync(path.join(from, f)).isFile()) fs.copyFileSync(path.join(from, f), path.join(to, f)); };
cpDir(path.join(ROOT, "eafc/assets/fonts-marca"), path.join(P, "assets/fonts"));
cpDir(path.join(ROOT, "eafc/assets/fonts"), path.join(P, "assets/fonts"));
cpDir(path.join(ROOT, "eafc/assets/sfx"), path.join(P, "assets/sfx"));
cpDir(path.join(ROOT, "eafc/assets/vendor"), path.join(P, "assets/vendor"));
if (!fs.existsSync(path.join(P, "assets/fonts/Heavy.otf"))) console.log("⚠ SEM fonte Articulat (eafc/assets/fonts-marca/) — vai cair no fallback");
const images = {};
for (const [k, src] of Object.entries(spec.images || {})) {
  const s = abs(src); if (!fs.existsSync(s)) fail(`imagem não encontrada: ${src}`);
  const dst = `assets/img/${k}${path.extname(s).toLowerCase()}`; fs.copyFileSync(s, path.join(P, dst)); images[k] = dst;
}

// ── clipes de B-roll (recorte do PiP/HUD, velocidade, 60 fps) ─────────────────
const probe = (f) => { const [w, h, r] = sh(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 "${f}"`).trim().split(","); const [a, b] = r.split("/"); return { w: +w, h: +h, fps: +a / +(b || 1) }; };
const clips = {};
for (const [k, c] of Object.entries(spec.clips || {})) {
  const src = abs(c.src); if (!fs.existsSync(src)) fail(`clipe não encontrado: ${c.src}`);
  const out = path.join(P, "assets/media", `${k}.mp4`);
  if (!fs.existsSync(out)) {
    if (c.prepared) fs.copyFileSync(src, out);
    else {
      const speed = c.speed ?? 1; const pr = probe(src); const cr = c.crop || spec.crop || [1640, 922, 0, 158];
      const vf = [`crop=${cr[0]}:${cr[1]}:${cr[2]}:${cr[3]}`, `scale=1920:1080:flags=lanczos`];
      if (speed !== 1) vf.push(`setpts=${f2(1 / speed)}*PTS`);
      if (speed !== 1 || pr.fps < FPS - 1) vf.push(`minterpolate=fps=${FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1`); else vf.push(`fps=${FPS}`);
      sh(`ffmpeg -v error -y -ss ${c.in} -t ${c.dur} -i "${src}" -an -vf "${vf.join(",")}" -c:v libx264 -crf 12 -preset medium -pix_fmt yuv420p "${out}"`);
    }
  }
  clips[k] = { file: `${k}.mp4`, dur: f2(dur(out)) };
}

// ── composição ────────────────────────────────────────────────────────────────
const { html, audio, proof, log, segs } = composeGancho(spec, { source, images, clips });
log.forEach((l) => console.log(l));

// ── mix: voz original intocada + SFX (bus limitado, abaixo da voz) ─────────────
const M = path.join(P, "assets/media");
const inputs = [`-i "${srcDst}"`], chains = [];
audio.forEach((e) => {
  const f = path.join(P, "assets", e.file); if (!fs.existsSync(f)) { console.log(`⚠ áudio ausente: ${e.file}`); return; }
  if (e.at < 0) return;
  const n = inputs.length; inputs.push(`-i "${f}"`);
  const d = e.dur ?? Math.max(0.05, Math.min(dur(f) - (e.trim || 0), source.dur - e.at));
  const parts = [`atrim=start=${f2(e.trim || 0)}:duration=${f2(d)}`, "asetpts=PTS-STARTPTS", "aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo"];
  if (e.fadeIn) parts.push(`afade=t=in:d=${f2(e.fadeIn)}`);
  if (e.fadeOut) parts.push(`afade=t=out:st=${f2(Math.max(0, d - e.fadeOut))}:d=${f2(e.fadeOut)}`);
  parts.push(`volume=${f2(e.gain ?? 1)}`, `adelay=${Math.round(e.at * 1000)}|${Math.round(e.at * 1000)}`);
  chains.push(`[${n}]${parts.join(",")}[s${n}]`);
});
const sfxGain = spec.sfxGain ?? 0.55;
const bus = chains.length ? `${chains.join(";")};${chains.map((_, i) => `[s${i + 1}]`).join("")}amix=inputs=${chains.length}:normalize=0:dropout_transition=0,volume=${sfxGain},alimiter=limit=0.5:attack=3:release=80:level=false[bus];` : "";
const mixF = `[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[v];${bus}${chains.length ? "[v][bus]amix=inputs=2:normalize=0:dropout_transition=0" : "[v]anull"},atrim=0:${source.dur},alimiter=limit=0.89:attack=2:release=60:level=false`;
sh(`ffmpeg -v error -y ${inputs.join(" ")} -filter_complex "${mixF}" -ar 48000 -ac 2 -c:a aac -b:a 320k "${M}/mix.m4a"`);
const lu = sh(`ffmpeg -i "${M}/mix.m4a" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\\s+(I|Peak):" | tr -s ' ' | tr '\\n' ' '`).trim();

fs.writeFileSync(path.join(P, "index.html"), html);
if (!fs.existsSync(path.join(P, "hyperframes.json"))) fs.writeFileSync(path.join(P, "hyperframes.json"), JSON.stringify({ paths: { assets: "assets" } }));
console.log(`• ${name}: ${source.dur}s, ${(spec.events || []).length} eventos, ${audio.length} SFX, rosto visível em ${segs.map(([a, b]) => `${a.toFixed(1)}–${b.toFixed(1)}`).join(" ")} · mix ${lu}`);

const lint = sh(`cd "${P}" && npx hyperframes lint . 2>&1 || true`);
const errs = lint.split("\n").filter((l) => l.includes("✗"));
if (errs.length) { console.log(errs.join("\n")); fail("lint com erros"); }

if (flags.includes("--proof")) {
  let times = proof.filter((t) => t < source.dur - 0.05);
  if (times.length > 36) times = times.filter((_, i) => i % Math.ceil(times.length / 36) === 0);
  sh(`cd "${P}" && rm -rf snapshots && npx hyperframes snapshot --at ${times.join(",")} --no-end --describe false`);
  const sheets = fs.readdirSync(path.join(P, "snapshots")).filter((f) => f.startsWith("contact-sheet"));
  console.log(`• prova (${times.length} frames): ${sheets.map((s) => path.join(P, "snapshots", s)).join(" ")}`);
}

if (!flags.includes("--no-render")) {
  const t0 = Date.now();
  const dest = path.join(ROOT, "entregas/eafc", slug); fs.mkdirSync(dest, { recursive: true });
  sh(`cd "${P}" && npx hyperframes render . --fps ${FPS} --crf ${spec.crf ?? 14} -o ./render.mp4`);
  const big = fs.statSync(`${P}/render.mp4`).size > 95e6;
  const out = big ? path.join(dest, "grandes") : dest; fs.mkdirSync(out, { recursive: true });
  sh(`ffmpeg -v error -i "${P}/render.mp4" -c copy -movflags +faststart -y "${out}/${name}.mp4"`);
  if (big) {
    const d = dur(`${P}/render.mp4`); const kbps = Math.floor((93e6 * 8) / d / 1000) - 320;
    const pass = `-c:v libx264 -b:v ${kbps}k -maxrate ${Math.floor(kbps * 1.2)}k -bufsize ${kbps * 2}k -preset slow -pix_fmt yuv420p`;
    sh(`cd "${P}" && ffmpeg -v error -y -i render.mp4 ${pass} -pass 1 -an -f mp4 /dev/null && ffmpeg -v error -y -i render.mp4 ${pass} -pass 2 -c:a aac -b:a 320k -movflags +faststart "${dest}/${name}-postar.mp4"`);
  }
  sh(`ffmpeg -v error -i "${P}/render.mp4" -vf scale=1280:720 -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 160k -y "${dest}/${name}-previa.mp4"`);
  const hp = path.join(ROOT, "eafc/specs/historico.json");
  const hist = fs.existsSync(hp) ? JSON.parse(fs.readFileSync(hp, "utf8")) : [];
  hist.push({ name, slug, type: "gancho", duration: source.dur, components: [...new Set((spec.events || []).map((e) => e.type))], date: new Date().toISOString().slice(0, 10) });
  fs.writeFileSync(hp, JSON.stringify(hist, null, 1));
  console.log(`• render ${((Date.now() - t0) / 60000).toFixed(1)} min → ${big ? `entregas/eafc/${slug}/grandes/${name}.mp4 (fora do git) + ${name}-postar.mp4` : `entregas/eafc/${slug}/${name}.mp4`} (${mb(`${out}/${name}.mp4`)}), prévia ${mb(`${dest}/${name}-previa.mp4`)}`);
}
