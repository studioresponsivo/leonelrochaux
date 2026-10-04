// Estilo EA FC — gera o index.html (HyperFrames + GSAP) a partir do plano resolvido (plan.mjs).
// Linguagem (ref. S2G + Neto EA FC): rosto em tela cheia com punch-ins a cada frase, escudos que batem na tela com glow,
// placar/ficha/fixtures em cards de broadcast, texto gigante (serifa ou condensada) atrás do rosto (matte), carimbo de data
// digitado, card de tweet, montagem 1 s/corte com flash+impacto, glitch, flash, chacoalhão de câmera. Ver docs/motion/estilo-eafc.md.
import { f2, norm, TEAMS } from "./plan.mjs";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const J = (o) => JSON.stringify(o);

// Sons (studio/assets/sfx-eafc): [latência até o ataque, duração útil]
const SND = {
  "impact-bass-1": [0.07, 2.1], "impact-bass-2": [0.13, 2.4], "whoosh-short": [0.16, 0.57], whoosh: [0.16, 0.57], "whoosh-cinematic": [2.5, 5.5],
  riser: [3.98, 10], "glitch-1": [0.2, 1.2], "glitch-2": [0.02, 0.7], "glitch-3": [0.3, 1.0], notification: [0.23, 2.4], typing: [0.46, 1.5],
  pop: [0.12, 0.72], click: [0.05, 0.37], "click-soft": [0.05, 0.37], "key-press": [0.07, 0.4], ping: [0.32, 1.32], sparkle: [0.03, 1.8], error: [0.74, 1.6], chime: [0.42, 2.5],
};
const ICON = {
  check: '<svg viewBox="0 0 24 24"><path fill="#1d9bf0" d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/></svg>',
  reply: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"/></svg>',
  repost: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>',
  heartF: '<svg viewBox="0 0 24 24"><path fill="#f91880" d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>',
  views: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
};
// textura grunge estática (SVG rasterizado uma vez pelo Chrome)
const GRUNGE = (seed) => `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.004 0.007' numOctaves='5' seed='${seed}'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.6 -0.55'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='0.9'/></svg>`)}")`;
const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.35 0'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>`)}")`;

export function composeEafc(plan) {
  const { W, H, cuts, words, faces, spec, endVoice, total, scenes, mods, mattes } = plan;
  const js = [], sfx = [], log = [];
  const at = (t) => f2(t);
  const ft = (sel, from, to, t) => js.push(`tl.fromTo(${J(sel)},${J(from)},${J({ ...to, immediateRender: false })},${at(Math.max(0, t))});`);
  const set = (sel, v, t) => js.push(`tl.set(${J(sel)},${J(v)},${at(Math.max(0, t))});`);
  // saídas de overlay: tween "to" (um fromTo com immediateRender:false some na captura do HyperFrames)
  const tto = (sel, to, t) => js.push(`tl.to(${J(sel)},${J(to)},${at(Math.max(0, t))});`);
  const snd = (name, t, vol, pri = 1) => { if (!SND[name]) throw new Error(`sfx "${name}" não existe (${Object.keys(SND).join(", ")})`); sfx.push({ name, t: f2(t), vol, pri }); };
  const ACC = spec.accent || "#FDBE11";
  const TEAM = spec.team ? TEAMS[spec.team] : TEAMS.leicester;
  let track = 20; const nextTrack = () => track++;
  const used = { patterns: [], transitions: [], bgs: { dark: 0 } };

  // ── motion blur direcional / glitch (filtros SVG compartilhados) ─────────────
  let mbN = 0; const mbDefs = [];
  const mblur = (sel, axis, t, dur, peak) => {
    const fid = `mb${axis}${++mbN}`, gid = `${fid}g`;
    mbDefs.push(axis === "x"
      ? `<filter id="${fid}" x="-30%" y="-5%" width="160%" height="110%" color-interpolation-filters="sRGB"><feGaussianBlur id="${gid}" stdDeviation="0 0" /></filter>`
      : `<filter id="${fid}" x="-5%" y="-30%" width="110%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur id="${gid}" stdDeviation="0 0" /></filter>`);
    const z = "0 0", p = axis === "x" ? `${peak} 0` : `0 ${peak}`;
    set(sel, { filter: `url(#${fid})` }, t);
    ft(`#${gid}`, { attr: { stdDeviation: z } }, { attr: { stdDeviation: p }, duration: f2(dur * 0.5), ease: "power2.in" }, t);
    ft(`#${gid}`, { attr: { stdDeviation: p } }, { attr: { stdDeviation: z }, duration: f2(dur * 0.5), ease: "power2.out" }, t + dur * 0.5);
    set(sel, { filter: "none" }, t + dur + 0.01);
  };
  const glitchOn = (sel, t, dur = 0.16, amp = 14) => {
    set(sel, { filter: "url(#rgb)" }, t);
    const n = Math.max(3, Math.round(dur / 0.033));
    for (let i = 0; i < n; i++) { const k = i % 2 ? -1 : 1, a = amp * (1 - i / n); set(sel, { x: f2(k * a * (0.5 + ((i * 7) % 5) / 5)), y: f2((i % 3 - 1) * a * 0.3) }, t + (i * dur) / n); }
    set(sel, { x: 0, y: 0, filter: "none" }, t + dur);
    set("#slices", { autoAlpha: 1 }, t);
    for (let i = 0; i < 3; i++) { set(`#sl${i}`, { y: f2(H * (0.15 + i * 0.28 + ((t * 13) % 10) / 60)) }, t); ft(`#sl${i}`, { x: (i % 2 ? -1 : 1) * 60 }, { x: (i % 2 ? 1 : -1) * 40, duration: dur, ease: "steps(4)" }, t); }
    set("#slices", { autoAlpha: 0 }, t + dur);
  };
  const shake = (t, amp = 14, dur = 0.32) => {
    const n = 7;
    for (let i = 0; i < n; i++) { const a = amp * (1 - i / n), s = i % 2 ? -1 : 1; set("#shake", { x: f2(s * a), y: f2(-s * a * 0.55), rotation: f2(s * a * 0.03) }, t + (i * dur) / n); }
    set("#shake", { x: 0, y: 0, rotation: 0 }, t + dur);
  };
  const flash = (t, color = "#fff", dur = 0.28, peak = 1) => {
    set("#flash", { backgroundColor: color }, t - 0.05);
    ft("#flash", { autoAlpha: 0 }, { autoAlpha: peak, duration: 0.05, ease: "power2.in" }, t - 0.05);
    ft("#flash", { autoAlpha: peak }, { autoAlpha: 0, duration: dur, ease: "power2.out" }, t);
  };

  // ── transições (o = seletor externo; m = camada que se move; c = conteúdo; below = o que está por baixo) ──
  const whipDir = (k) => ({ "whip": [-1, 0], "whip-left": [-1, 0], "whip-right": [1, 0], "whip-up": [0, -1], "whip-down": [0, 1] }[k]);
  function trIn(kind, o, m, t, below, color) {
    if (kind === "none") { set(o, { autoAlpha: 1 }, t); return 0; }
    if (kind === "cut") { set(o, { autoAlpha: 1 }, t); ft(m, { filter: "blur(8px)", scale: 1.03 }, { filter: "blur(0px)", scale: 1, duration: 0.12, ease: "power2.out" }, t); return 0.12; }
    if (kind === "flash") { flash(t, color || "#fff", 0.3); set(o, { autoAlpha: 1 }, t); ft(m, { scale: 1.06 }, { scale: 1, duration: 0.5, ease: "power3.out" }, t); snd("whoosh-short", t - 0.08, 0.3, 2); return 0.1; }
    if (kind === "glitch") { if (below) glitchOn(below, t - 0.14, 0.14); set(o, { autoAlpha: 1 }, t); glitchOn(m, t, 0.16); snd("glitch-2", t - 0.1, 0.32, 3); return 0.16; }
    if (kind === "impact") {
      set(o, { autoAlpha: 1 }, t);
      ft(m, { scale: 1.35, filter: "blur(14px)" }, { scale: 1, filter: "blur(0px)", duration: 0.26, ease: "power4.out" }, t);
      if (below) { ft(below, { scale: 1 }, { scale: 1.07, duration: 0.14, ease: "power2.in" }, t - 0.14); set(below, { scale: 1 }, t + 0.3); }
      shake(t + 0.02, 12); snd("impact-bass-1", t, 0.6, 3);
      return 0.26;
    }
    if (kind === "blur") {
      ft(o, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14 }, t);
      ft(m, { filter: "blur(22px)", scale: 1.06 }, { filter: "blur(0px)", scale: 1, duration: 0.32, ease: "power2.out" }, t);
      return 0.2;
    }
    if (kind.startsWith("whip")) {
      const [dx, dy] = whipDir(kind), d = 0.22, t0 = t - d / 2;
      const ax = dx ? "x" : "y", D = dx ? W : H, k = dx || dy;
      set(o, { autoAlpha: 1 }, t0);
      ft(m, { [ax]: -k * D }, { [ax]: 0, duration: d, ease: "power4.inOut" }, t0);
      ft(m, { [ax]: 0 }, { [ax]: k * D * 0.015, duration: 0.06, ease: "power1.out" }, t0 + d);
      ft(m, { [ax]: k * D * 0.015 }, { [ax]: 0, duration: 0.1, ease: "power2.inOut" }, t0 + d + 0.06);
      mblur(m, ax, t0, d, 28);
      if (below) { ft(below, { [ax]: 0 }, { [ax]: k * D, duration: d, ease: "power4.inOut" }, t0); mblur(below, ax, t0, d, 28); set(below, { [ax]: 0 }, t0 + d + 0.02); }
      snd("whoosh-short", t - 0.06, 0.34, 3);
      return d / 2;
    }
    if (kind === "zoom") {
      const t0 = t - 0.16;
      if (below) { ft(below, { scale: 1, filter: "blur(0px)" }, { scale: 1.8, filter: "blur(14px)", duration: 0.3, ease: "power2.in" }, t0); set(below, { scale: 1, filter: "none" }, t0 + 0.5); }
      ft(o, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.16 }, t0 + 0.12);
      ft(m, { scale: 1.45, filter: "blur(16px)" }, { scale: 1, filter: "blur(0px)", duration: 0.4, ease: "power3.out" }, t0 + 0.12);
      snd("whoosh", t - 0.06, 0.3, 3);
      return 0.36;
    }
    set(o, { autoAlpha: 1 }, t); return 0;
  }
  function trOut(kind, o, m, c, t, below, color) {
    const recv = () => { if (below) { ft(below, { filter: "blur(10px)", scale: 1.04 }, { filter: "blur(0px)", scale: 1, duration: 0.14, ease: "power2.out" }, t); set(below, { filter: "none" }, t + 0.15); } };
    if (kind === "none") { set(o, { autoAlpha: 0 }, t + 0.5); return; }
    if (kind === "cut") { set(o, { autoAlpha: 0 }, t); recv(); return; }
    if (kind === "flash") { flash(t, color || "#fff", 0.3); set(o, { autoAlpha: 0 }, t); recv(); snd("whoosh-short", t - 0.08, 0.26, 2); return; }
    if (kind === "glitch") { glitchOn(m, t - 0.14, 0.14); set(o, { autoAlpha: 0 }, t); if (below) glitchOn(below, t, 0.14); snd("glitch-2", t - 0.12, 0.3, 3); return; }
    if (kind === "blur") {
      ft(c, { scale: 1 }, { scale: 0.94, duration: 0.5, ease: "power1.inOut" }, t - 0.5);
      ft(c, { filter: "blur(0px)" }, { filter: "blur(9px)", duration: 0.08 }, t - 0.08);
      set(o, { autoAlpha: 0 }, t);
      if (below) { ft(below, { filter: "blur(20px)", scale: 1.06 }, { filter: "blur(0px)", scale: 1, duration: 0.3, ease: "power2.out" }, t); set(below, { filter: "none" }, t + 0.31); }
      return;
    }
    if (kind.startsWith("whip")) {
      const [dx, dy] = whipDir(kind), d = 0.22, t0 = t - d / 2;
      const ax = dx ? "x" : "y", D = dx ? W : H, k = dx || dy;
      ft(m, { [ax]: 0 }, { [ax]: k * D, duration: d, ease: "power4.inOut" }, t0);
      mblur(m, ax, t0, d, 28);
      set(o, { autoAlpha: 0 }, t0 + d);
      if (below) { ft(below, { [ax]: -k * D }, { [ax]: 0, duration: d, ease: "power4.inOut" }, t0); mblur(below, ax, t0, d, 28); }
      snd("whoosh-short", t - 0.06, 0.34, 3);
      return;
    }
    if (kind === "zoom") {
      ft(m, { scale: 1, filter: "blur(0px)" }, { scale: 2.2, filter: "blur(16px)", duration: 0.3, ease: "power2.in" }, t - 0.15);
      ft(o, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.16 }, t - 0.03);
      if (below) { ft(below, { scale: 1.3, filter: "blur(12px)" }, { scale: 1, filter: "blur(0px)", duration: 0.4, ease: "power3.out" }, t - 0.08); set(below, { filter: "none" }, t + 0.35); }
      snd("whoosh", t - 0.1, 0.3, 3);
      return;
    }
    set(o, { autoAlpha: 0 }, t);
  }

  // ── legendas (frase, pequenas, embaixo — estilo Neto) ───────────────────────
  const capMode = spec.captions ?? "phrase";
  const FIX = Object.fromEntries(Object.entries(spec.fixes || {}).map(([k, v]) => [norm(k), v]));
  const KW = new Set((spec.keywords || []).map(norm));
  const capWords = [];
  if (capMode !== "none") {
    const ents = [];
    for (const c of cuts) for (const w of words) {
      if (w.start < c.in - 0.02 || w.start >= c.out - 0.05) continue;
      const punct = (w.text.match(/[.,!?;:]+$/) || [""])[0];
      ents.push({ t: f2(c.t0 + Math.max(w.start, c.in) - c.in), e: f2(c.t0 + Math.min(w.end, c.out) - c.in), txt: w.text.replace(/[.,!?;:]+$/, ""), end: /[.?!,;:]/.test(punct), drop: false });
    }
    const phrases = Object.entries(spec.fixes || {}).filter(([k]) => /\s/.test(k)).map(([k, v]) => [k.split(/\s+/).map(norm), v]);
    for (const [tok, v] of phrases) for (let i = 0; i + tok.length <= ents.length; i++) {
      if (tok.every((x, j) => norm(ents[i + j].txt) === x)) { ents[i].txt = v; for (let j = 1; j < tok.length; j++) ents[i + j].drop = true; ents[i].end = ents[i + tok.length - 1].end; ents[i].e = ents[i + tok.length - 1].e; }
    }
    for (const en of ents) {
      if (en.drop) continue;
      const fixed = FIX[norm(en.txt)];
      const txt = fixed ?? en.txt;
      if (txt === "") continue;
      const bare = norm(txt);
      capWords.push({ t: en.t, e: en.e, txt, end: en.end, kind: KW.has(bare) || /^\d+%?$/.test(bare) ? "kw" : "" });
    }
  }
  const groups = [];
  { let g = [];
    for (const w of capWords) {
      const prev = g.at(-1), len = g.reduce((a, x) => a + x.txt.length + 1, 0) + w.txt.length;
      if (g.length && (g.length >= 6 || len > 34 || prev.end || w.t - prev.e > 0.32)) { groups.push(g); g = []; }
      g.push(w);
    }
    if (g.length) groups.push(g); }
  groups.forEach((g, i) => { g.s = g[0].t; g.e = f2(Math.min(groups[i + 1]?.[0].t ?? endVoice, g.at(-1).e + 0.7)); });
  const capsHtml = groups.map((g, i) => `<div class="cap" id="cap${i}">${g.map((w) => `<span class="w ${w.kind}">${esc(w.txt)}</span>`).join(" ")}</div>`).join("\n        ");
  groups.forEach((g, i) => {
    ft(`#cap${i}`, { autoAlpha: 0, y: 8, filter: "blur(6px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.12, ease: "power2.out" }, g.s);
    set(`#cap${i}`, { autoAlpha: 0 }, g.e);
  });
  const fulls = scenes.filter((s) => s.full);
  const capsState = (show, t) => { if (capMode === "none") return; set("#caps", { autoAlpha: show ? 1 : 0 }, t); };

  // ── base: rosto em tela cheia + punch-ins automáticos a cada frase ──────────
  const blocks = [];
  for (const c of cuts) { const last = blocks.at(-1); if (last && !c.screen) { last.out = f2(c.t0 + c.dur); last.cuts.push(c); } else blocks.push({ in: c.t0, out: f2(c.t0 + c.dur), cuts: [c] }); }
  const faceVideos = blocks.map((b, i) => `<video id="vF${i}" class="clip" src="assets/media/edit.mp4" muted playsinline data-start="${b.in}" data-duration="${f2(b.out - b.in)}" data-media-start="${b.in}" data-track-index="0"></video>`).join("\n          ");
  let faceOrigin = "50% 36%";
  { const xs = Object.values(faces || {}).flat().map((p) => p[1]).sort((a, b) => a - b); if (xs.length) faceOrigin = `${f2((xs[xs.length >> 1] / (plan.srcW || 1920)) * 100)}% 36%`; }
  const punches = mods.filter((m) => m.do === "punch").map((m) => ({ t0: m.t0, t1: m.t1, scale: m.scale ?? 1.22 }));
  {
    const alt = spec.autoFrame === false ? [1, 1] : [1, 1.14];
    const gap = spec.punchGap ?? 2.4;
    const marks = [[0, alt[0]]]; let k = 1, last = 0;
    for (const p of plan.phr || []) { if (p - last < gap || p > endVoice - 1.2) continue; marks.push([p, alt[k++ % 2]]); last = p; }
    const scaleAt = (t) => { let s = 1; for (const [mt, ms] of marks) if (mt <= t + 1e-3) s = ms; return s; };
    const ev = [];
    for (const [mt, ms] of marks) if (!punches.some((p) => mt >= p.t0 - 1e-3 && mt < p.t1)) ev.push([mt, ms]);
    for (const p of punches) { ev.push([p.t0, p.scale]); ev.push([p.t1, scaleAt(p.t1)]); }
    ev.sort((a, b) => a[0] - b[0]);
    const clean = [];
    for (const e of ev) { if (clean.length && e[0] - clean.at(-1)[0] <= 0.05) clean[clean.length - 1] = e; else clean.push(e); }
    clean.forEach(([t, s], i) => {
      set("#facePunch", { scale: s }, t || 0.001);
      const nxt = clean[i + 1]?.[0] ?? endVoice;
      if (nxt - t > 0.4) ft("#facePush", { scale: 1 }, { scale: 1.04, duration: f2(nxt - t), ease: "none" }, t || 0.001);
    });
    log.push(`${clean.length} enquadramentos`);
  }
  // matte (recorte do rosto) para texto atrás
  const fgHtml = (mattes || []).map((m, i) => `<div id="fgw${i}" class="layer" style="opacity:0;visibility:hidden"><video id="fg${i}" class="clip" src="assets/media/${m.file}" muted playsinline data-start="${m.in}" data-duration="${f2(m.out - m.in)}" data-media-start="0" data-track-index="${nextTrack()}"></video></div>`).join("\n          ");
  (mattes || []).forEach((m, i) => { set(`#fgw${i}`, { autoAlpha: 1 }, m.in + 0.02); set(`#fgw${i}`, { autoAlpha: 0 }, m.out - 0.02); });

  // ── modificadores: shake, lights, flash, sfx ────────────────────────────────
  for (const m of mods) {
    if (m.do === "shake") shake(m.t0, m.amp ?? 14, m.dur ?? 0.32);
    if (m.do === "flash") flash(m.t0, m.color || "#fff", m.dur ?? 0.3, m.peak ?? 1);
    if (m.do === "sfx") snd(m.name, m.t0, m.vol ?? 0.5, 3);
    if (m.do === "lights") {
      const d = m.t1 - m.t0;
      ft("#lights", { autoAlpha: 0 }, { autoAlpha: 0.94, duration: 0.1, ease: "power3.in" }, m.t0);
      ft("#lights", { autoAlpha: 0.94 }, { autoAlpha: 0.6, duration: 0.05, repeat: 3, yoyo: true, ease: "steps(1)" }, m.t0 + 0.14);
      ft("#lights", { autoAlpha: 0.94 }, { autoAlpha: 0, duration: 0.22, ease: "power2.out" }, m.t1 - 0.22);
      snd("error", m.t0 - 0.2, 0.4, 3); snd("click", m.t1 - 0.2, 0.3, 2);
      log.push(`lights ${d.toFixed(1)}s`);
    }
  }

  // ── helpers de cena ─────────────────────────────────────────────────────────
  const imgEl = (m, style = "") => `<img src="assets/media/${m.file}" alt="" style="${style}" />`;
  const wordsHtml = (id, ws, hl, cls = "") => ws.map((w, i) => `<span class="cw${hl.has(norm(w)) ? " hl" : ""}${cls}" id="${id}w${i}">${esc(w)}</span>`).join(" ");
  const cascade = (id, ws, times, { dx = 40, blur = 10, dur = 0.22, snd: s = null } = {}) => {
    ws.forEach((_, i) => {
      ft(`#${id}w${i}`, { autoAlpha: 0, x: dx, scale: 0.92, filter: `blur(${blur}px)` }, { autoAlpha: 1, x: 0, scale: 1, filter: "blur(0px)", duration: dur, ease: "power3.out" }, times[i]);
      if (s) snd(s, times[i], 0.18, 1);
    });
  };
  const typeIn = (sel, text, t, dur) => js.push(`(()=>{const o={n:0};const el=document.querySelector(${J(sel)});const s=${J(text)};tl.fromTo(o,{n:0},{n:s.length,duration:${f2(dur)},ease:"none",immediateRender:false,onUpdate:()=>{el.textContent=s.slice(0,Math.round(o.n));}},${at(t)});})();`);
  const countTo = (sel, from, to, t, dur, dec = 0) => js.push(`(()=>{const o={v:${from}};const el=document.querySelector(${J(sel)});tl.fromTo(o,{v:${from}},{v:${to},duration:${f2(dur)},ease:"power3.out",immediateRender:false,onUpdate:()=>{el.textContent=Number(${dec ? "o.v" : "Math.round(o.v)"}).toLocaleString("pt-BR",{minimumFractionDigits:${dec},maximumFractionDigits:${dec}});}},${at(t)});})();`);
  const crestImg = (tm, size, extra = "") => `<img class="crest" src="assets/media/${tm.media.file}" alt="" style="height:${size}px;max-width:${Math.round(size * 1.1)}px;filter:drop-shadow(0 0 ${Math.round(size * 0.12)}px ${tm.color}aa) drop-shadow(0 ${Math.round(size * 0.06)}px ${Math.round(size * 0.14)}px rgba(0,0,0,.6));${extra}" />`;
  const posStyle = (pos) => ({
    tl: "left:90px;top:70px;justify-content:flex-start", tr: "right:90px;top:70px;justify-content:flex-end", bl: "left:90px;bottom:170px;justify-content:flex-start", br: "right:90px;bottom:170px;justify-content:flex-end",
    center: "left:0;right:0;top:46%;transform:translateY(-50%)", top: "left:0;right:0;top:90px", bottom: "left:0;right:0;bottom:190px",
    left: "left:90px;top:46%;transform:translateY(-50%);justify-content:flex-start", right: "right:90px;top:46%;transform:translateY(-50%);justify-content:flex-end",
  }[pos] || "left:0;right:0;top:46%;transform:translateY(-50%)");
  const toneCss = (tone, color) => tone === "mono" ? "filter:grayscale(1) contrast(1.12)" : tone === "red" ? "filter:grayscale(1) contrast(1.15) brightness(.85)" : tone === "blue" ? "filter:grayscale(1) contrast(1.12) brightness(.9)" : "";
  const toneOverlay = (tone, color) => tone === "red" ? `<div class="layer" style="background:${color || "#c8102e"};mix-blend-mode:multiply;opacity:.78"></div><div class="layer" style="background:linear-gradient(to top, rgba(0,0,0,.55), transparent 50%)"></div>`
    : tone === "blue" ? `<div class="layer" style="background:${color || "#0053A0"};mix-blend-mode:multiply;opacity:.75"></div><div class="layer" style="background:linear-gradient(to top, rgba(0,0,0,.55), transparent 50%)"></div>`
    : `<div class="layer shade"></div>`;

  // ── cenas ───────────────────────────────────────────────────────────────────
  let sceneHtml = "", overlayHtml = "", behindHtml = "";
  scenes.forEach((s, i) => {
    const id = `S${i}`, o = `#${id}`, m = `#${id}m`, c = `#${id}c`;
    const t0 = s.t0, t1 = s.t1, dur = f2(t1 - t0);
    const fi = fulls.indexOf(s);
    const below = s.prevAdj ? `#S${scenes.indexOf(fulls[fi - 1])}m` : "#baseM";
    let inner = "", bgStyle = "background:#07070c", color = null;
    used.patterns.push(s.do);
    switch (s.do) {
      case "photo": {
        color = s.color || TEAM.color;
        bgStyle = "background:#050507";
        inner = `<div id="${id}k" class="layer kb">${imgEl(s.media, `position:absolute;inset:0;width:100%;height:100%;object-fit:cover;${toneCss(s.tone)}`)}${toneOverlay(s.tone, s.color)}</div>
          ${s.grain ? `<div class="layer grain"></div>` : ""}
          ${s.label ? `<div id="${id}l" class="bigLabel"><i style="background:${color}"></i><b>${esc(s.label)}</b>${s.sub ? `<small>${esc(s.sub)}</small>` : ""}</div>` : ""}
          ${s.stamp ? `<div id="${id}st" class="stamp tl"><u></u><span id="${id}stt"></span></div>` : ""}`;
        const fx = s.fx ?? "push";
        if (fx === "pan") ft(`#${id}k`, { xPercent: -3, scale: 1.14 }, { xPercent: 3, scale: 1.14, duration: dur + 0.3, ease: "none" }, t0 - 0.1);
        else if (fx === "out") ft(`#${id}k`, { scale: 1.18 }, { scale: 1.02, duration: dur + 0.3, ease: "power1.out" }, t0 - 0.1);
        else ft(`#${id}k`, { scale: 1 }, { scale: 1.1, duration: dur + 0.3, ease: "none" }, t0 - 0.1);
        if (s.label) { ft(`#${id}l`, { autoAlpha: 0, x: -80, filter: "blur(10px)" }, { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 0.32, ease: "power4.out" }, t0 + 0.18); mblur(`#${id}l`, "x", t0 + 0.18, 0.2, 18); snd("whoosh-short", t0 + 0.12, 0.26, 2); }
        if (s.stamp) { ft(`#${id}st`, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, t0 + 0.35); typeIn(`#${id}stt`, s.stamp, t0 + 0.4, Math.min(1.1, s.stamp.length * 0.03, Math.max(0.25, dur - 0.85))); snd("typing", t0 + 0.4, 0.3, 1); }
        break;
      }
      case "crest": {
        const ts = s.teams, duel = ts.length > 1;
        color = s.color || ts[0].color;
        const bgm = s.bgMedia ? `<div class="layer kb"><img src="assets/media/${s.bgMedia.file}" alt="" id="${id}bg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(${s.bgBlur ?? 10}px) brightness(.5) saturate(.8);transform:scale(1.12)" /></div><div class="layer" style="background:radial-gradient(1200px 800px at 50% 50%, rgba(0,0,0,0), rgba(0,0,0,.6))"></div>`
          : `<div class="layer" style="background:radial-gradient(1100px 760px at 50% 48%, ${color}55 0%, #0a0a12 60%, #050508 100%)"></div><div class="layer grunge" style="opacity:.35"></div>`;
        if (!duel) {
          inner = `${bgm}<div class="spotGlow" style="background:radial-gradient(closest-side, ${color}66, transparent)"></div>
            <div id="${id}cr" class="heroCrest">${crestImg(ts[0], s.size ?? 520)}</div>
            ${s.label ? `<div id="${id}l" class="crestLabel">${esc(s.label)}</div>` : ""}
            ${s.sub ? `<div id="${id}s" class="crestSub" style="color:${s.subColor || ACC}">${esc(s.sub)}</div>` : ""}`;
          ft(`#${id}cr`, { scale: 2.6, autoAlpha: 0, filter: "blur(24px)" }, { scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 0.3, ease: "power4.out" }, t0 + 0.02);
          ft(`#${id}cr`, { y: 0 }, { y: -10, duration: 1.6, ease: "sine.inOut", repeat: Math.max(1, Math.ceil(dur / 1.6)), yoyo: true }, t0 + 0.35);
          if (s.in !== "impact") { snd("impact-bass-2", t0 + 0.05, 0.55, 3); shake(t0 + 0.1, 10); }
          flash(t0 + 0.12, color, 0.45, 0.35);
          if (s.label) { ft(`#${id}l`, { autoAlpha: 0, y: 40, filter: "blur(10px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.3, ease: "power4.out" }, t0 + 0.32); }
          if (s.sub) ft(`#${id}s`, { autoAlpha: 0, scaleX: 1.3, filter: "blur(6px)" }, { autoAlpha: 1, scaleX: 1, filter: "blur(0px)", duration: 0.5, ease: "power3.out" }, t0 + 0.5);
        } else {
          const a = ts[0], b = ts[1], sz = s.size ?? 400;
          const mid = s.compT ? crestImg(s.compT, 170) : `<b class="vs">${esc(s.vs ?? "×")}</b>`;
          inner = `${bgm}<div class="duelGlow" style="background:linear-gradient(90deg, ${a.color}66, transparent 40%, transparent 60%, ${b.color}66)"></div>
            <div class="duel"><div id="${id}a" class="duelSide">${crestImg(a, sz)}<span>${esc(s.labels?.[0] ?? a.name)}</span></div><div id="${id}vs" class="duelMid">${mid}</div><div id="${id}b" class="duelSide">${crestImg(b, sz)}<span>${esc(s.labels?.[1] ?? b.name)}</span></div></div>
            ${s.label ? `<div id="${id}l" class="crestLabel small">${esc(s.label)}</div>` : ""}
            ${s.sub ? `<div id="${id}s" class="crestSub" style="color:${s.subColor || ACC}">${esc(s.sub)}</div>` : ""}`;
          ft(`#${id}a`, { x: -W * 0.6, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.3, ease: "power4.out" }, t0 + 0.02); mblur(`#${id}a`, "x", t0 + 0.02, 0.26, 24);
          ft(`#${id}b`, { x: W * 0.6, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.3, ease: "power4.out" }, t0 + 0.1); mblur(`#${id}b`, "x", t0 + 0.1, 0.26, 24);
          ft(`#${id}vs`, { scale: 0, autoAlpha: 0, rotation: -40 }, { scale: 1, autoAlpha: 1, rotation: 0, duration: 0.34, ease: "back.out(2.2)" }, t0 + 0.36);
          snd("whoosh-short", t0, 0.3, 2); snd("impact-bass-1", t0 + 0.36, 0.6, 3); shake(t0 + 0.38, 12); flash(t0 + 0.4, "#fff", 0.3, 0.5);
          if (s.label) ft(`#${id}l`, { autoAlpha: 0, y: 30, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.3, ease: "power3.out" }, t0 + 0.55);
          if (s.sub) ft(`#${id}s`, { autoAlpha: 0, scaleX: 1.3, filter: "blur(6px)" }, { autoAlpha: 1, scaleX: 1, filter: "blur(0px)", duration: 0.5, ease: "power3.out" }, t0 + 0.65);
        }
        break;
      }
      case "split": {
        const a = s.teams[0], b = s.teams[1] || s.teams[0];
        color = a.color;
        inner = `<div id="${id}L" class="half" style="left:0;background:${a.color}"><div class="halfTx" style="color:${a.color2 === "#FBE122" ? "#fff" : "#fff"}">${esc(s.labels?.[0] ?? a.abbr)}</div><div class="halfCrest" style="left:70px;bottom:60px">${crestImg(a, 230)}</div></div>
          <div id="${id}R" class="half" style="right:0;background:${b.color}"><div class="halfTx r" style="color:#fff">${esc(s.labels?.[1] ?? b.abbr)}</div><div class="halfCrest" style="right:70px;top:60px">${crestImg(b, 230)}</div></div>
          ${s.compT ? `<div id="${id}c0" class="splitMid">${crestImg(s.compT, 230)}</div>` : ""}
          ${s.sub ? `<div id="${id}s" class="crestSub low" style="color:#fff">${esc(s.sub)}</div>` : ""}`;
        ft(`#${id}L`, { x: -W / 2 }, { x: 0, duration: 0.3, ease: "power4.out" }, t0); mblur(`#${id}L`, "x", t0, 0.26, 26);
        ft(`#${id}R`, { x: W / 2 }, { x: 0, duration: 0.3, ease: "power4.out" }, t0 + 0.06); mblur(`#${id}R`, "x", t0 + 0.06, 0.26, 26);
        ft(`#${id}L .halfTx`, { x: -120, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.4, ease: "power4.out" }, t0 + 0.2);
        ft(`#${id}R .halfTx`, { x: 120, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.4, ease: "power4.out" }, t0 + 0.26);
        if (s.compT) ft(`#${id}c0`, { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.34, ease: "back.out(2)" }, t0 + 0.34);
        if (s.sub) ft(`#${id}s`, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3 }, t0 + 0.6);
        snd("impact-bass-1", t0 + 0.3, 0.55, 3); shake(t0 + 0.32, 10);
        break;
      }
      case "score": {
        const a = s.homeT, b = s.awayT;
        color = s.color || a.color;
        const [h0, a0] = String(s.score ?? "0-0").split(/[-x×–]/).map((x) => x.trim());
        inner = `<div class="layer" style="background:linear-gradient(100deg, ${a.color}55 0%, #07070c 45%, #07070c 55%, ${b.color}55 100%)"></div><div class="layer grunge" style="opacity:.3"></div>
          ${s.meta ? `<div id="${id}meta" class="meta">${esc(s.meta)}</div>` : ""}
          <div class="scoreRow">
            <div id="${id}ha" class="scoreTeam">${crestImg(a, 300)}<span>${esc(a.name)}</span></div>
            <div id="${id}num" class="scoreNum"><b id="${id}h"><i class="dg">${esc(h0)}</i></b><em>–</em><b id="${id}a"><i class="dg">${esc(a0)}</i></b></div>
            <div id="${id}aw" class="scoreTeam">${crestImg(b, 300)}<span>${esc(b.name)}</span></div>
          </div>
          ${s.flip?.tag ? `<div id="${id}tag" class="rubber" style="color:${s.flip.color || "#e11d2e"};border-color:${s.flip.color || "#e11d2e"}">${esc(s.flip.tag)}</div>` : ""}`;
        ft(`#${id}ha`, { x: -300, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.34, ease: "power4.out" }, t0 + 0.05); mblur(`#${id}ha`, "x", t0 + 0.05, 0.24, 20);
        ft(`#${id}aw`, { x: 300, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.34, ease: "power4.out" }, t0 + 0.1); mblur(`#${id}aw`, "x", t0 + 0.1, 0.24, 20);
        ft(`#${id}num`, { scale: 1.8, autoAlpha: 0, filter: "blur(12px)" }, { scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 0.3, ease: "power4.out" }, t0 + 0.3);
        snd("impact-bass-1", t0 + 0.3, 0.55, 3); shake(t0 + 0.32, 9);
        if (s.meta) ft(`#${id}meta`, { autoAlpha: 0, y: -16, scaleX: 1.3, filter: "blur(6px)" }, { autoAlpha: 1, y: 0, scaleX: 1, filter: "blur(0px)", duration: 0.4, ease: "power3.out" }, t0 + 0.45);
        if (s.flip) {
          const tf = s.flip.t ?? t0 + dur * 0.6;
          const [h1, a1] = String(s.flip.score).split(/[-x×–]/).map((x) => x.trim());
          for (const [sel, from, to] of [[`#${id}h`, h0, h1], [`#${id}a`, a0, a1]]) {
            if (from === to) continue;
            ft(`${sel} .dg`, { y: 0, filter: "blur(0px)" }, { y: -220, filter: "blur(14px)", autoAlpha: 0, duration: 0.18, ease: "power3.in" }, tf);
            set(`${sel} .dg`, { textContent: to }, tf + 0.18);
            ft(`${sel} .dg`, { y: 220, filter: "blur(14px)", autoAlpha: 0 }, { y: 0, filter: "blur(0px)", autoAlpha: 1, duration: 0.24, ease: "power4.out" }, tf + 0.19);
          }
          snd("whoosh-short", tf, 0.3, 2); snd("impact-bass-2", tf + 0.3, 0.65, 3); shake(tf + 0.32, 16); flash(tf + 0.3, s.flip.color || b.color, 0.4, 0.5);
          if (s.flip.tag) { ft(`#${id}tag`, { scale: 3, autoAlpha: 0, rotation: -4 }, { scale: 1, autoAlpha: 1, rotation: -9, duration: 0.2, ease: "power4.in" }, tf + 0.4); snd("impact-bass-1", tf + 0.58, 0.45, 2); shake(tf + 0.6, 10, 0.25); }
          log.push(`placar ${h0}-${a0} → ${h1}-${a1} @${f2(tf)}s`);
        }
        break;
      }
      case "record": {
        const tm = s.teamT; color = s.color || tm?.color || TEAM.color;
        const its = s.items || [];
        inner = `<div class="layer" style="background:radial-gradient(1000px 700px at 50% 55%, ${color}44, #07070c 65%)"></div><div class="layer grunge" style="opacity:.3"></div>
          <div id="${id}box" class="recBox">
            ${tm ? `<div class="recCrest">${crestImg(tm, 240)}</div>` : ""}
            <div class="recNums">${its.map((it, k) => `<div class="recCell"><b id="${id}v${k}">${esc(it.from ?? 0)}</b><span>${esc(it.label)}</span></div>`).join("")}</div>
          </div>
          ${s.title ? `<div id="${id}t" class="crestLabel small" style="top:auto;bottom:130px">${esc(s.title)}</div>` : ""}
          ${s.sub ? `<div id="${id}s" class="crestSub" style="top:auto;bottom:80px;color:${ACC}">${esc(s.sub)}</div>` : ""}`;
        ft(`#${id}box`, { y: 140, scale: 1.06, autoAlpha: 0, filter: "blur(10px)" }, { y: 0, scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 0.34, ease: "power4.out" }, t0 + 0.04);
        its.forEach((it, k) => { countTo(`#${id}v${k}`, +(it.from ?? 0), +it.value, t0 + 0.3 + k * 0.12, 0.7); snd("click", t0 + 0.3 + k * 0.12, 0.2, 1); });
        if (s.in !== "impact") { snd("impact-bass-1", t0 + 0.08, 0.5, 3); }
        if (s.title) ft(`#${id}t`, { autoAlpha: 0, y: 30, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.3, ease: "power3.out" }, t0 + 0.5);
        if (s.sub) ft(`#${id}s`, { autoAlpha: 0, scaleX: 1.3, filter: "blur(6px)" }, { autoAlpha: 1, scaleX: 1, filter: "blur(0px)", duration: 0.5, ease: "power3.out" }, t0 + 0.6);
        break;
      }
      case "ladder": {
        const tm = s.teamT; color = s.color || tm?.color || TEAM.color;
        const rows = s.rows || [], n = rows.length, rowH = 150, gapY = 26, top = (H - (n * rowH + (n - 1) * gapY)) / 2 + 20;
        const from = s.fromRow ?? 0, to = s.toRow ?? n - 1; // ("to" é âncora de fim; a linha-alvo é toRow)
        inner = `<div class="layer" style="background:radial-gradient(1100px 760px at 50% 40%, #16162a, #07070c 65%)"></div><div class="layer grunge" style="opacity:.25"></div>
          ${rows.map((r, k) => `<div id="${id}r${k}" class="ladRow" style="top:${f2(top + k * (rowH + gapY))}px;height:${rowH}px"><i></i><span class="ladIdx">${k + 1}</span><b>${esc(r.text)}</b>${r.tag ? `<em id="${id}tg${k}">${esc(r.tag)}</em>` : ""}</div>`).join("")}
          ${tm ? `<div id="${id}cr" class="ladCrest" style="top:${f2(top + from * (rowH + gapY) + rowH / 2)}px">${crestImg(tm, 180)}</div>` : ""}
          ${s.title ? `<div id="${id}t" class="meta" style="top:70px">${esc(s.title)}</div>` : ""}`;
        rows.forEach((r, k) => { ft(`#${id}r${k}`, { x: -120, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.3, ease: "power4.out" }, t0 + 0.05 + k * 0.08); });
        set(`#${id}r${from} i`, { backgroundColor: color }, t0);
        if (s.title) ft(`#${id}t`, { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.3 }, t0 + 0.2);
        if (tm) {
          ft(`#${id}cr`, { scale: 2, autoAlpha: 0, filter: "blur(10px)" }, { scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 0.3, ease: "power4.out" }, t0 + 0.35);
          snd("impact-bass-1", t0 + 0.35, 0.4, 2);
          const steps = Math.abs(to - from), dir = Math.sign(to - from) || 1;
          const tStart = rows[from + dir]?.t ?? t0 + 1.0;
          for (let k = 1; k <= steps; k++) {
            const r = from + dir * k, tk = rows[r]?.t ?? (tStart + (k - 1) * 0.55);
            const y = (r - from) * (rowH + gapY);
            ft(`#${id}cr`, { y: (r - dir - from) * (rowH + gapY) }, { y, duration: 0.3, ease: "power3.in" }, tk - 0.3);
            mblur(`#${id}cr`, "y", tk - 0.16, 0.18, 14);
            ft(`#${id}cr`, { scaleY: 1 }, { scaleY: 0.86, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out" }, tk);
            set(`#${id}r${r - dir} i`, { backgroundColor: "#2a2a36" }, tk);
            ft(`#${id}r${r} i`, { backgroundColor: "#2a2a36" }, { backgroundColor: color, duration: 0.15 }, tk);
            if (rows[r]?.tag) { ft(`#${id}tg${r}`, { scale: 2.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.2, ease: "power4.in" }, tk + 0.05); }
            snd("whoosh-short", tk - 0.3, 0.28, 2); snd("impact-bass-2", tk, 0.6, 3); shake(tk + 0.02, 14, 0.3); flash(tk + 0.02, color, 0.3, 0.3);
          }
        }
        break;
      }
      case "fixtures": {
        const rows = s.rows || []; color = s.color || TEAM.color;
        const n = rows.length, rowH = 170, gapY = 22, top = (H - (n * rowH + (n - 1) * gapY)) / 2 + 40;
        inner = `<div class="layer" style="background:linear-gradient(120deg, ${color}66, #0b0b18 50%, ${color}33)"></div><div class="layer grunge" style="opacity:.3"></div>
          ${s.title ? `<div id="${id}t" class="fixTitle">${s.compT ? crestImg(s.compT, 70) : ""}<span>${esc(s.title)}</span></div>` : ""}
          ${rows.map((r, k) => `<div id="${id}r${k}" class="fixRow" style="top:${f2(top + k * (rowH + gapY))}px;height:${rowH}px">
            ${r.tag ? `<em style="background:${color}">${esc(r.tag)}</em>` : ""}
            <div class="fixTeams">${r.teamT ? crestImg(r.teamT, 110) : ""}${r.vsT ? `<u>×</u>${crestImg(r.vsT, 110)}` : ""}</div>
            <div class="fixTx"><b>${esc(r.text)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</div></div>`).join("")}`;
        if (s.title) ft(`#${id}t`, { autoAlpha: 0, y: -20, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.3, ease: "power3.out" }, t0 + 0.02);
        rows.forEach((r, k) => {
          const a = Math.max(r.t ?? t0, t0 + 0.08 + k * 0.1);
          ft(`#${id}r${k}`, { x: -160, autoAlpha: 0, filter: "blur(10px)" }, { x: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.32, ease: "power4.out" }, a);
          mblur(`#${id}r${k}`, "x", a, 0.22, 18);
          snd("click", a + 0.05, 0.26, 2); snd("whoosh-short", a - 0.02, 0.2, 1);
          if (k > 0) ft(`#${id}r${k - 1}`, { opacity: 1 }, { opacity: 0.45, duration: 0.3 }, a);
        });
        break;
      }
      case "number": {
        color = s.color || TEAM.color;
        const v = +s.value, a = +(s.from ?? 0), dec = s.decimals ?? 0;
        inner = `<div class="layer" style="background:radial-gradient(900px 700px at 50% 45%, ${color}3d, #06060a 62%)"></div><div class="layer grunge" style="opacity:.3"></div>
          <div class="numWrap"><div id="${id}n" class="bigNum" style="font-family:${s.font === "serif" ? "var(--serif)" : "var(--display)"}">${esc(s.prefix || "")}<span id="${id}v">${a}</span>${esc(s.suffix || "")}</div>${s.label ? `<div id="${id}l" class="numLabel">${esc(s.label)}</div>` : ""}</div>
          ${s.stamp ? `<div id="${id}st" class="stamp bottom"><u></u><span id="${id}stt"></span></div>` : ""}`;
        ft(`#${id}n`, { autoAlpha: 0, scale: 0.7, filter: "blur(16px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.34, ease: "power4.out" }, t0 + 0.02);
        if (a !== v) countTo(`#${id}v`, a, v, t0 + 0.1, s.count ?? 0.8, dec);
        ft(`#${id}n`, { textShadow: `0 0 0px ${color}00` }, { textShadow: `0 0 50px ${color}99`, duration: 0.5 }, t0 + 0.6);
        snd("impact-bass-2", t0 + 0.05, 0.55, 3); shake(t0 + 0.08, 9);
        if (s.label) ft(`#${id}l`, { autoAlpha: 0, y: 24, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.3, ease: "power3.out" }, t0 + 0.55);
        if (s.stamp) { ft(`#${id}st`, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, t0 + 0.8); typeIn(`#${id}stt`, s.stamp, t0 + 0.85, Math.min(1.2, s.stamp.length * 0.028, Math.max(0.25, dur - 1.3))); snd("typing", t0 + 0.85, 0.3, 1); }
        break;
      }
      case "title": {
        color = s.color || TEAM.color;
        const tws = String(s.title).split(/\s+/);
        inner = `<div class="layer" style="background:radial-gradient(1300px 900px at 50% 50%, ${color}99, #0a0a12 70%)"></div><div class="layer grunge" style="opacity:.75;mix-blend-mode:multiply"></div><div class="layer grunge2"></div>
          ${s.media ? `<div class="layer kb"><img src="assets/media/${s.media.file}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.22;filter:grayscale(1) contrast(1.3)" /></div>` : ""}
          <div class="titleWrap">${s.kicker ? `<div id="${id}k" class="kicker">${esc(s.kicker)}</div>` : ""}<div id="${id}t" class="titleBig">${wordsHtml(id, tws, new Set((s.hl || []).map(norm)))}</div>${s.sub ? `<div id="${id}s" class="titleSub">${esc(s.sub)}</div>` : ""}</div>`;
        cascade(id, tws, tws.map((_, k) => f2(t0 + 0.12 + k * 0.1)), { dx: 0, blur: 18, dur: 0.5 });
        ft(`#${id}t`, { scale: 1.08 }, { scale: 1, duration: dur, ease: "power1.out" }, t0);
        if (s.kicker) ft(`#${id}k`, { autoAlpha: 0, scaleX: 1.3, filter: "blur(6px)" }, { autoAlpha: 1, scaleX: 1, filter: "blur(0px)", duration: 0.6, ease: "power3.out" }, t0 + 0.1);
        if (s.sub) ft(`#${id}s`, { autoAlpha: 0, y: 18, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45, ease: "power3.out" }, t0 + 0.12 + tws.length * 0.1 + 0.15);
        snd("whoosh-cinematic", t0, 0.5, 3); snd("impact-bass-2", t0 + 0.05, 0.5, 2);
        break;
      }
      case "montage": {
        const its = s.items, step = s.step ?? 1.0;
        color = s.color || TEAM.color;
        inner = its.map((it, k) => `<div id="${id}i${k}" class="layer kb" style="opacity:0;visibility:hidden">${imgEl(it.media, `position:absolute;inset:0;width:100%;height:100%;object-fit:cover;${toneCss(it.tone)}`)}${toneOverlay(it.tone, it.color)}${it.label ? `<div id="${id}l${k}" class="bigLabel center"><b>${esc(it.label)}</b></div>` : ""}</div>`).join("") + `<div class="layer grain"></div>`;
        its.forEach((it, k) => {
          const a = it.t, d = (its[k + 1]?.t ?? t1) - a;
          set(`#${id}i${k}`, { autoAlpha: 1 }, a);
          ft(`#${id}i${k}`, { scale: 1.18 }, { scale: 1.0, duration: d + 0.1, ease: "power2.out" }, a);
          if (k < its.length - 1) set(`#${id}i${k}`, { autoAlpha: 0 }, its[k + 1].t);
          if (it.label) ft(`#${id}l${k}`, { scale: 1.6, autoAlpha: 0, filter: "blur(10px)" }, { scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 0.22, ease: "power4.out" }, a + 0.04);
          if (k > 0 || s.in !== "flash") { flash(a, "#fff", 0.16, 0.7); snd(k % 2 ? "impact-bass-2" : "impact-bass-1", a, 0.55, 3); shake(a + 0.02, 10, 0.24); }
        });
        log.push(`montagem ${its.length}×${step}s`);
        break;
      }
      // ── overlays ──────────────────────────────────────────────────────────
      case "word": {
        const fam = s.font === "serif" ? "var(--serif)" : s.font === "brand" ? "var(--font)" : "var(--display)";
        const fs = s.size ?? (s.font === "serif" ? 230 : s.font === "brand" ? 180 : 260);
        const col = s.color === "accent" ? ACC : s.color === "team" ? TEAM.color : (s.color || "#fff");
        const ws = s.sync.ws, hl = new Set((s.hl || []).map(norm));
        const style = `font-family:${fam};font-size:${fs}px;color:${col};${posStyle(s.pos ?? "center")};${s.font === "serif" ? "" : "text-transform:uppercase;letter-spacing:.01em;"}${s.glow ? `text-shadow:0 0 60px ${col}88;` : ""}`;
        const html = `<div id="${id}" class="bigWord${s.behind ? " behind" : ""}" style="${style}">${wordsHtml(id, ws, hl)}</div>`;
        if (s.behind) behindHtml += html; else overlayHtml += html;
        cascade(id, ws, s.sync.times, { dx: s.font === "serif" ? 30 : 60, blur: 14, dur: 0.24, snd: s.silent ? null : (s.font === "serif" ? "whoosh-short" : "impact-bass-1") });
        ft(o, { x: 0 }, { x: s.drift ?? 14, duration: dur, ease: "none" }, t0);
        tto(o, { autoAlpha: 0, filter: "blur(10px)", duration: 0.2, ease: "power2.in" }, t1 - 0.2);
        return;
      }
      case "stamp": {
        if (s.style === "rubber") {
          const col = s.color || "#e11d2e";
          overlayHtml += `<div id="${id}" class="rubber ov" style="color:${col};border-color:${col};${posStyle(s.pos ?? "center")}">${esc(s.text)}</div>`;
          ft(o, { scale: 3.2, autoAlpha: 0, rotation: -2 }, { scale: 1, autoAlpha: 1, rotation: s.rot ?? -10, duration: 0.2, ease: "power4.in" }, t0);
          snd("impact-bass-1", t0 + 0.18, 0.6, 3); shake(t0 + 0.2, 14, 0.3); flash(t0 + 0.2, col, 0.3, 0.35);
          tto(o, { autoAlpha: 0, filter: "blur(8px)", duration: 0.18 }, t1 - 0.18);
        } else {
          overlayHtml += `<div id="${id}" class="stamp ${s.pos ?? "tl"}"><u></u><span id="${id}t"></span></div>`;
          ft(o, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, t0);
          typeIn(`#${id}t`, s.text, t0 + 0.05, Math.min(1.2, String(s.text).length * (s.speed ?? 0.03), Math.max(0.25, dur - 0.45)));
          snd("typing", t0 + 0.05, 0.32, 1);
          tto(o, { autoAlpha: 0, filter: "blur(8px)", duration: 0.18 }, t1 - 0.18);
        }
        return;
      }
      case "tweet": {
        const theme = s.theme ?? "light", pos = s.pos ?? "bl", big = pos === "center";
        const w = s.width ?? (big ? 980 : 760);
        const av = s.avatarMedia ? `<img src="assets/media/${s.avatarMedia.file}" alt="" />` : `<b style="background:linear-gradient(135deg, ${s.avatarColor || TEAM.color}, ${s.avatarColor2 || TEAM.color2})">${esc((s.initials || String(s.name || "?").slice(0, 1)).toUpperCase())}</b>`;
        const txt = String(s.text || ""), hl = new Set((s.hl || []).map(norm));
        const tws = txt.split(/(\s+)/).map((p) => /\s+/.test(p) ? p : (p.startsWith("#") || p.startsWith("@") || hl.has(norm(p)) ? `<a>${esc(p)}</a>` : esc(p))).join("");
        const posCss = pos === "bl" ? `left:80px;bottom:200px` : pos === "br" ? `right:80px;bottom:200px` : pos === "tr" ? `right:80px;top:90px` : pos === "tl" ? `left:80px;top:90px` : `left:${(W - w) / 2}px;top:${H / 2}px;transform:translateY(-50%)`;
        overlayHtml += `<div id="${id}" class="tweet ${theme}${big ? " big" : ""}" style="width:${w}px;${posCss}">
            <div class="twHead"><div class="twAv">${av}</div><div class="twWho"><b>${esc(s.name || "Torcedor")} ${s.verified !== false ? ICON.check : ""}</b><span>${esc(s.handle || "@torcedor")} · ${esc(s.time || "2h")}</span></div><i class="twX">${ICON.x}</i></div>
            <div class="twText" id="${id}tx">${tws}</div>
            <div class="twMeta"><span>${ICON.reply}<u>${esc(s.replies ?? "48")}</u></span><span>${ICON.repost}<u>${esc(s.reposts ?? "120")}</u></span><span id="${id}like" class="like">${ICON.heart}<u id="${id}lk">${esc(s.likes ?? "1.2K")}</u></span><span>${ICON.views}<u>${esc(s.views ?? "38K")}</u></span></div>
          </div>`;
        const fromY = big ? 90 : (pos === "tl" || pos === "tr" ? -H * 0.4 : -H * 0.5);
        ft(o, { autoAlpha: 0, y: fromY, scale: big ? 0.92 : 1 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: "power4.out" }, t0);
        mblur(o, "y", t0, 0.24, 22);
        ft(o, { y: 0 }, { y: 10, duration: 0.08, ease: "power1.out" }, t0 + 0.3); ft(o, { y: 10 }, { y: 0, duration: 0.14, ease: "power2.inOut" }, t0 + 0.38);
        snd("notification", t0 - 0.05, 0.5, 3); snd("whoosh-short", t0 - 0.06, 0.2, 1);
        if (s.likeAt !== false) {
          const tl2 = t0 + (s.likeDelay ?? 1.1);
          set(`#${id}like`, { innerHTML: `${ICON.heartF}<u id="${id}lk">${esc(s.likes ?? "1.2K")}</u>` }, tl2);
          set(`#${id}like`, { color: "#f91880" }, tl2);
          ft(`#${id}like`, { scale: 1 }, { scale: 1.35, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" }, tl2);
          if (s.likesAfter) set(`#${id}like`, { innerHTML: `${ICON.heartF}<u id="${id}lk">${esc(s.likesAfter)}</u>` }, tl2 + 0.12);
          snd("pop", tl2, 0.3, 2);
        }
        tto(o, { autoAlpha: 0, y: big ? 60 : H * 0.3, duration: 0.24, ease: "power3.in" }, t1 - 0.24);
        mblur(o, "y", t1 - 0.24, 0.22, 18);
        return;
      }
      case "badge": {
        const tm = s.teamT, size = s.size ?? 260, pos = s.pos ?? "right";
        const css = pos === "left" ? `left:140px;top:${H / 2 - size / 2}px` : pos === "right" ? `right:140px;top:${H / 2 - size / 2}px` : pos === "tr" ? `right:120px;top:80px` : `left:120px;top:80px`;
        overlayHtml += `<div id="${id}" class="badge" style="${css};width:${size}px;height:${size}px">${crestImg(tm, size)}</div>`;
        ft(o, { autoAlpha: 0, scale: 0.3, rotation: -25, filter: "blur(8px)" }, { autoAlpha: 1, scale: 1, rotation: 0, filter: "blur(0px)", duration: 0.36, ease: "back.out(2.2)" }, t0);
        ft(o, { y: 0 }, { y: -12, duration: 1.4, ease: "sine.inOut", repeat: Math.max(1, Math.ceil(dur / 1.4)), yoyo: true }, t0 + 0.4);
        snd("pop", t0 + 0.02, 0.35, 2);
        tto(o, { autoAlpha: 0, scale: 0.6, filter: "blur(8px)", duration: 0.2, ease: "power2.in" }, t1 - 0.2);
        return;
      }
    }
    // cena cheia: HTML + transições
    used.bgs.dark += dur;
    sceneHtml += `
      <div id="${id}" class="layer scene" style="opacity:0;visibility:hidden"><div id="${id}m" class="layer" style="${bgStyle}"><div id="${id}c" class="layer">${inner}</div></div></div>`;
    if (!s.prevAdj) { trIn(s.in, o, m, t0, below, color); used.transitions.push(s.in); }
    else { const d = trIn(s.in, o, m, t0, below, color); used.transitions.push(s.in); set(`#S${scenes.indexOf(fulls[fi - 1])}`, { autoAlpha: 0 }, t0 + Math.max(0.45, d + 0.1)); }
    if (!s.next && t1 < total - 0.05) { trOut(s.out, o, m, c, t1, "#baseM", color); used.transitions.push(s.out); }
    capsState(false, s.prevAdj ? t0 : t0 - 0.02);
    if (!s.next) capsState(true, t1);
  });

  // ── SFX: limitador de densidade ─────────────────────────────────────────────
  const maxPer10 = spec.sfxMax ?? (spec.sfx === "off" ? 0 : spec.sfx === "low" ? 3 : 7);
  const hush = plan.hush || [];
  const cand = sfx.filter((x) => x.t >= 0 && x.t < total - 0.1 && !hush.some(([a, b]) => x.t >= a && x.t <= b)).sort((a, b) => b.pri - a.pri || b.vol - a.vol || a.t - b.t);
  const kept = [];
  const fits = (x) => {
    if (kept.some((k) => Math.abs(k.t - x.t) < 0.12 && k.name === x.name)) return false;
    if (kept.filter((k) => Math.abs(k.t - x.t) < 0.15).length >= 2) return false;
    const ts = [...kept.map((k) => k.t), x.t].filter((t) => Math.abs(t - x.t) < 10).sort((a, b) => a - b);
    for (let i = 0, j = 0; j < ts.length; j++) { while (ts[j] - ts[i] >= 10) i++; if (j - i + 1 > maxPer10) return false; }
    return true;
  };
  for (const x of cand) if (fits(x)) kept.push(x);
  kept.sort((a, b) => a.t - b.t);
  log.push(`SFX ${kept.length}/${sfx.length} (limite ${maxPer10}/10 s${hush.length ? `, ${hush.length} trecho(s) em silêncio` : ""})`);
  const sfxHtml = kept.map((x, i) => {
    const st = f2(Math.max(0, x.t - SND[x.name][0]));
    return `<audio id="sfx${i}" src="assets/sfx-eafc/${x.name}.mp3" data-start="${st}" data-duration="${f2(Math.min(SND[x.name][1], total - st))}" data-track-index="${4 + (i % 4)}" data-volume="${x.vol}"></audio>`;
  }).join("\n      ");
  const music = plan.music ? `<audio id="music" src="assets/media/${esc(plan.music.file)}" data-start="${f2(plan.music.at)}" data-duration="${f2(total - plan.music.at)}" data-track-index="9" data-volume="${plan.music.volume}"></audio>` : "";

  // ── CSS ─────────────────────────────────────────────────────────────────────
  const css = `
      :root { --acc: ${ACC}; --team: ${TEAM.color}; --n50: #fafafa; --n400: #a3a3a3; --n900: #171717; --n950: #0a0a0a;
        --font: "Brand", "Jakarta", system-ui, sans-serif; --display: "Anton", "Oswald", Impact, sans-serif; --cond: "Oswald", "Anton", sans-serif; --serif: "Playfair", Georgia, serif; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #000; }
      #stage { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: #000; font-family: var(--font); color: var(--n50); }
      .layer { position: absolute; inset: 0; }
      #shake { position: absolute; inset: 0; }
      #faceCam { overflow: hidden; }
      #facePunch, #facePush { position: absolute; inset: 0; transform-origin: ${faceOrigin}; }
      #facePan { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; }
      #facePan video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #behind { position: absolute; inset: 0; }
      #faceShade { background: linear-gradient(to top, rgba(0,0,0,${capMode === "none" ? ".12" : ".42"}) 0%, rgba(0,0,0,.08) 20%, transparent 36%); }
      #vig { background: radial-gradient(1400px 900px at 50% 45%, transparent 55%, rgba(0,0,0,.42) 100%); }
      #lights { background: #000; opacity: 0; visibility: hidden; }
      .shade { background: linear-gradient(to top, rgba(0,0,0,.6) 0%, rgba(0,0,0,.15) 30%, transparent 55%); }
      .kb { overflow: hidden; }
      .grain { background: ${GRAIN}; background-size: 400px 400px; opacity: .22; mix-blend-mode: overlay; }
      .grunge { background: ${GRUNGE(7)}; background-size: cover; mix-blend-mode: screen; }
      .grunge2 { background: ${GRUNGE(31)}; background-size: cover; mix-blend-mode: multiply; opacity: .5; }
      .crest { display: block; width: auto; object-fit: contain; }
      .spotGlow { position: absolute; left: 50%; top: 50%; width: 1100px; height: 1100px; margin: -550px 0 0 -550px; border-radius: 50%; opacity: .9; }
      .heroCrest { position: absolute; left: 0; right: 0; top: 150px; display: flex; justify-content: center; opacity: 0; }
      .heroCrest img { max-width: 900px; }
      .crestLabel { position: absolute; left: 0; right: 0; top: 760px; text-align: center; font: 400 128px/1 var(--display); text-transform: uppercase; letter-spacing: .02em; color: #fff; text-shadow: 0 10px 40px rgba(0,0,0,.6); opacity: 0; }
      .crestLabel.small { font-size: 96px; top: 820px; }
      .crestSub { position: absolute; left: 0; right: 0; top: 905px; text-align: center; font: 600 32px/1 var(--font); text-transform: uppercase; letter-spacing: .22em; opacity: 0; }
      .crestSub.low { top: 960px; }
      .duelGlow { position: absolute; inset: 0; }
      .duel { position: absolute; left: 0; right: 0; top: 0; bottom: 0; display: flex; align-items: center; justify-content: center; gap: 110px; padding-bottom: 120px; }
      .duelSide { display: flex; flex-direction: column; align-items: center; gap: 34px; opacity: 0; }
      .duelSide span { font: 600 40px/1 var(--cond); text-transform: uppercase; letter-spacing: .08em; color: #fff; text-shadow: 0 6px 24px rgba(0,0,0,.6); }
      .duelMid { display: flex; align-items: center; justify-content: center; width: 220px; opacity: 0; padding-bottom: 70px; }
      .duelMid .vs { font: 400 190px/1 var(--display); color: #fff; text-shadow: 0 0 40px rgba(255,255,255,.35); }
      .half { position: absolute; top: 0; bottom: 0; width: ${W / 2}px; overflow: hidden; }
      .halfTx { position: absolute; left: 70px; top: 120px; font: 400 420px/1 var(--display); text-transform: uppercase; letter-spacing: -.01em; opacity: 0; }
      .halfTx.r { left: auto; right: 70px; top: auto; bottom: 90px; }
      .halfCrest { position: absolute; }
      .splitMid { position: absolute; left: 50%; top: 50%; width: 260px; height: 260px; margin: -130px 0 0 -130px; display: grid; place-items: center; }
      .splitMid img { filter: drop-shadow(0 0 30px rgba(0,0,0,.7)) !important; }
      .meta { position: absolute; left: 0; right: 0; top: 150px; text-align: center; font: 600 30px/1 var(--font); letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,.78); opacity: 0; }
      .scoreRow { position: absolute; left: 0; right: 0; top: 250px; display: flex; align-items: center; justify-content: center; gap: 90px; }
      .scoreTeam { display: flex; flex-direction: column; align-items: center; gap: 30px; width: 420px; opacity: 0; }
      .scoreTeam span { font: 600 38px/1 var(--cond); text-transform: uppercase; letter-spacing: .08em; color: #fff; }
      .scoreNum { display: flex; align-items: center; gap: 30px; font: 400 330px/1 var(--display); color: #fff; opacity: 0; padding-bottom: 60px; }
      .scoreNum b { position: relative; display: inline-block; width: 230px; text-align: center; height: 330px; overflow: hidden; font-weight: 400; }
      .scoreNum b i { display: block; font-style: normal; }
      .scoreNum em { font-style: normal; color: rgba(255,255,255,.5); font-size: 200px; padding-bottom: 20px; }
      .rubber { position: absolute; left: 50%; top: 680px; transform: translateX(-50%); padding: 14px 40px 10px; border: 10px solid; border-radius: 18px; font: 400 150px/1 var(--display); text-transform: uppercase; letter-spacing: .04em; opacity: 0; mix-blend-mode: normal; text-shadow: 0 0 30px rgba(0,0,0,.4); box-shadow: 0 20px 60px rgba(0,0,0,.45); background: rgba(10,10,14,.35); }
      .rubber.ov { transform: none; left: auto; top: auto; margin: 0 auto; width: fit-content; display: inline-block; }
      .recBox { position: absolute; left: 50%; top: 44%; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 70px; padding: 50px 80px; border-radius: 40px; background: rgba(12,12,20,.72); box-shadow: inset 0 0 0 2px rgba(255,255,255,.1), 0 60px 120px -30px rgba(0,0,0,.8); opacity: 0; }
      .recNums { display: flex; gap: 70px; }
      .recCell { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 170px; }
      .recCell b { font: 400 220px/1 var(--display); color: #fff; font-variant-numeric: tabular-nums; }
      .recCell span { font: 600 34px/1 var(--cond); text-transform: uppercase; letter-spacing: .25em; color: var(--acc); }
      .ladRow { position: absolute; left: 330px; right: 330px; display: flex; align-items: center; gap: 40px; padding: 0 60px 0 0; border-radius: 26px; background: rgba(18,18,30,.9); box-shadow: inset 0 0 0 2px rgba(255,255,255,.08); opacity: 0; overflow: hidden; }
      .ladRow i { width: 18px; align-self: stretch; background: #2a2a36; }
      .ladIdx { font: 400 70px/1 var(--display); color: rgba(255,255,255,.3); width: 90px; text-align: center; }
      .ladRow b { font: 600 62px/1 var(--cond); text-transform: uppercase; letter-spacing: .06em; color: #fff; flex: 1; }
      .ladRow em { font: 400 44px/1 var(--display); font-style: normal; text-transform: uppercase; letter-spacing: .06em; color: #fff; padding: 8px 24px 4px; border-radius: 10px; background: #e11d2e; opacity: 0; }
      .ladCrest { position: absolute; left: 150px; margin-top: -90px; opacity: 0; }
      .fixTitle { position: absolute; left: 0; right: 0; top: 110px; display: flex; align-items: center; justify-content: center; gap: 24px; font: 600 40px/1 var(--cond); text-transform: uppercase; letter-spacing: .18em; color: #fff; opacity: 0; }
      .fixRow { position: absolute; left: 300px; right: 300px; display: flex; align-items: center; gap: 50px; padding: 0 60px; border-radius: 28px; background: rgba(14,14,24,.86); box-shadow: inset 0 0 0 2px rgba(255,255,255,.1), 0 30px 60px -30px rgba(0,0,0,.8); opacity: 0; }
      .fixRow em { font: 400 44px/1 var(--display); font-style: normal; text-transform: uppercase; letter-spacing: .06em; color: #fff; padding: 10px 26px 6px; border-radius: 12px; }
      .fixTeams { display: flex; align-items: center; gap: 26px; }
      .fixTeams u { text-decoration: none; font: 400 60px/1 var(--display); color: rgba(255,255,255,.55); }
      .fixTx { display: flex; flex-direction: column; gap: 10px; }
      .fixTx b { font: 600 60px/1 var(--cond); text-transform: uppercase; letter-spacing: .05em; color: #fff; }
      .fixTx small { font: 500 28px/1 var(--font); letter-spacing: .14em; text-transform: uppercase; color: var(--acc); }
      .numWrap { position: absolute; left: 0; right: 0; top: 280px; text-align: center; }
      .bigNum { display: inline-block; font-size: 420px; line-height: 1; color: #fff; opacity: 0; font-variant-numeric: tabular-nums; letter-spacing: .01em; }
      .numLabel { margin-top: 10px; font: 600 54px/1.1 var(--cond); text-transform: uppercase; letter-spacing: .3em; color: var(--acc); opacity: 0; }
      .titleWrap { position: absolute; left: 160px; right: 160px; top: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px; text-align: center; }
      .kicker { font: 500 26px/1 var(--font); letter-spacing: .4em; text-transform: uppercase; color: rgba(255,255,255,.7); opacity: 0; }
      .titleBig { display: flex; flex-wrap: wrap; justify-content: center; gap: 0 .22em; font: 900 190px/1 var(--serif); color: #fff; letter-spacing: -.01em; text-shadow: 0 20px 60px rgba(0,0,0,.5); }
      .titleBig .cw.hl { color: var(--acc); font-style: italic; }
      .titleSub { font: 900 72px/1.1 var(--serif); font-style: italic; color: var(--acc); opacity: 0; }
      .cw { display: inline-block; opacity: 0; }
      .bigLabel { position: absolute; left: 110px; bottom: 150px; display: flex; flex-direction: column; gap: 14px; opacity: 0; }
      .bigLabel i { display: block; width: 120px; height: 12px; border-radius: 6px; }
      .bigLabel b { font: 400 150px/1 var(--display); text-transform: uppercase; letter-spacing: .01em; color: #fff; text-shadow: 0 12px 40px rgba(0,0,0,.7); }
      .bigLabel small { font: 500 34px/1 var(--font); letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,.8); }
      .bigLabel.center { left: 0; right: 0; bottom: auto; top: 50%; transform: translateY(-50%); align-items: center; }
      .bigLabel.center b { font-size: 200px; text-align: center; }
      .stamp { position: absolute; display: flex; align-items: center; gap: 18px; font: 500 30px/1 var(--font); letter-spacing: .18em; text-transform: uppercase; color: #fff; text-shadow: 0 2px 12px rgba(0,0,0,.6); opacity: 0; white-space: nowrap; }
      .stamp u { width: 14px; height: 14px; border-radius: 3px; background: var(--acc); flex: none; }
      .stamp span::after { content: "_"; opacity: .7; }
      .stamp.tl { left: 90px; top: 80px; } .stamp.tr { right: 90px; top: 80px; } .stamp.bl { left: 90px; bottom: 150px; } .stamp.br { right: 90px; bottom: 150px; }
      .stamp.bottom { left: 0; right: 0; bottom: 150px; justify-content: center; }
      .bigWord { position: absolute; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 0 .28em; line-height: .95; font-weight: 900; opacity: 1; white-space: nowrap; }
      .bigWord .cw { text-shadow: 0 10px 40px rgba(0,0,0,.45); }
      .bigWord .cw.hl { color: var(--acc); }
      .tweet { position: absolute; border-radius: 26px; padding: 30px 34px 26px; opacity: 0; box-shadow: 0 40px 90px -20px rgba(0,0,0,.6), 0 0 0 1px rgba(0,0,0,.08); font-family: var(--font); }
      .tweet.light { background: #fff; color: #0f1419; } .tweet.dark { background: #000; color: #e7e9ea; box-shadow: 0 40px 90px -20px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.15); }
      .twHead { display: flex; align-items: center; gap: 18px; }
      .twAv { width: 72px; height: 72px; border-radius: 50%; overflow: hidden; flex: none; } .twAv img { width: 100%; height: 100%; object-fit: cover; } .twAv b { display: grid; place-items: center; width: 100%; height: 100%; font: 700 34px/1 var(--font); color: #fff; }
      .twWho { display: flex; flex-direction: column; gap: 6px; flex: 1; } .twWho b { display: flex; align-items: center; gap: 8px; font: 700 31px/1 var(--font); } .twWho b svg { width: 30px; height: 30px; } .twWho span { font: 450 27px/1 var(--font); color: #536471; }
      .tweet.dark .twWho span { color: #71767b; }
      .twX { width: 34px; height: 34px; color: #0f1419; } .tweet.dark .twX { color: #e7e9ea; } .twX svg { width: 100%; height: 100%; }
      .twText { margin: 22px 0 18px; font: 450 34px/1.3 var(--font); letter-spacing: -.005em; } .twText a { color: #1d9bf0; }
      .tweet.big .twText { font-size: 42px; }
      .twMeta { display: flex; justify-content: space-between; padding: 0 10px; color: #536471; font: 450 26px/1 var(--font); } .tweet.dark .twMeta { color: #71767b; }
      .twMeta span { display: inline-flex; align-items: center; gap: 10px; } .twMeta svg { width: 30px; height: 30px; } .twMeta u { text-decoration: none; }
      .badge { position: absolute; display: grid; place-items: center; opacity: 0; }
      #caps { position: absolute; left: 0; right: 0; top: 950px; height: 120px; }
      .cap { position: absolute; left: 280px; right: 280px; top: 0; text-align: center; font: 700 40px/1.2 var(--font); letter-spacing: -.005em; color: #fff; opacity: 0; visibility: hidden; }
      .w { display: inline-block; text-shadow: 0 2px 16px rgba(0,0,0,.6), 0 1px 3px rgba(0,0,0,.45); }
      .w.kw { color: var(--acc); }
      #flash { position: absolute; inset: 0; background: #fff; opacity: 0; visibility: hidden; }
      #slices { position: absolute; inset: 0; opacity: 0; visibility: hidden; pointer-events: none; }
      #slices div { position: absolute; left: 0; right: 0; top: 0; height: 26px; background: rgba(255,255,255,.08); mix-blend-mode: difference; }
  `;
  const jakarta = [500, 700, 800].map((w) => `@font-face { font-family: "Jakarta"; font-weight: ${w}; src: url(assets/fonts/plus-jakarta-sans-latin-${w}-normal.woff2) format("woff2"); }`).join("\n      ");
  const brand = plan.brandFont ? [300, 400, 450, 500, 600, 700, 800, 900].map((w) => `@font-face { font-family: "Brand"; font-weight: ${w}; src: url(assets/fonts-marca/articulat-${w}.woff2) format("woff2"); }`).join("\n      ") : "";
  const display = `
      @font-face { font-family: "Anton"; font-weight: 400; src: url(assets/fonts-eafc/anton-latin-400-normal.woff2) format("woff2"); }
      @font-face { font-family: "Anton"; font-weight: 400; src: url(assets/fonts-eafc/anton-latin-ext-400-normal.woff2) format("woff2"); unicode-range: U+0100-024F; }
      ${[500, 600, 700].map((w) => `@font-face { font-family: "Oswald"; font-weight: ${w}; src: url(assets/fonts-eafc/oswald-latin-${w}-normal.woff2) format("woff2"); }
      @font-face { font-family: "Oswald"; font-weight: ${w}; src: url(assets/fonts-eafc/oswald-latin-ext-${w}-normal.woff2) format("woff2"); unicode-range: U+0100-024F; }`).join("\n      ")}
      ${[700, 900].map((w) => `@font-face { font-family: "Playfair"; font-weight: ${w}; src: url(assets/fonts-eafc/playfair-display-latin-${w}-normal.woff2) format("woff2"); }
      @font-face { font-family: "Playfair"; font-weight: ${w}; src: url(assets/fonts-eafc/playfair-display-latin-ext-${w}-normal.woff2) format("woff2"); unicode-range: U+0100-024F; }`).join("\n      ")}
      @font-face { font-family: "Playfair"; font-weight: 900; font-style: italic; src: url(assets/fonts-eafc/playfair-display-latin-900-italic.woff2) format("woff2"); }`;

  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      ${jakarta}
      ${brand}
      ${display}
      ${css}
    </style>
  </head>
  <body>
    <div id="stage" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
      <svg width="0" height="0" style="position:absolute"><defs>
        ${mbDefs.join("\n        ")}
        <filter id="rgb" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/><feOffset in="r" dx="-14" dy="0" result="ro"/>
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb"/><feOffset in="gb" dx="12" dy="0" result="gbo"/>
          <feBlend in="ro" in2="gbo" mode="screen"/>
        </filter>
      </defs></svg>
      <div id="shake">
        <div id="base" class="layer"><div id="baseM" class="layer">
          <div id="faceCam" class="layer"><div id="facePunch"><div id="facePush"><div id="facePan">
            ${faceVideos}
            <div id="behind">${behindHtml}</div>
            ${fgHtml}
          </div></div></div><div id="vig" class="layer"></div><div id="faceShade" class="layer"></div><div id="lights" class="layer"></div></div>
        </div></div>
        ${sceneHtml}
        <div id="overlays" class="layer">${overlayHtml}</div>
      </div>
      <div id="caps">
        ${capsHtml}
      </div>
      <div id="slices"><div id="sl0"></div><div id="sl1"></div><div id="sl2"></div></div>
      <div id="flash"></div>
      ${plan.voice ? `<audio id="voice" src="assets/media/voice.m4a" data-start="0" data-duration="${endVoice}" data-track-index="3" data-volume="1"></audio>` : ""}
      ${music}
      ${sfxHtml}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      ${js.join("\n      ")}
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
  return { html, log, used: { ...used, chapterBg: "dark" } };
}
