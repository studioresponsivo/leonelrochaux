// Estilo EA FC — gera o index.html (HyperFrames + GSAP) a partir do plano resolvido (plan.mjs).
// Linguagem (ref. S2G + Neto EA FC), versão "cinema": rosto em tela cheia com câmera viva (punch-in/zoom-out, deriva na mão,
// grade, vinheta, letterbox), grão de filme animado, fotos em parallax com vazamento de luz, escudos com varredura especular
// e poeira, placar antigo numa TV de tubo, tipografia serifada atrás do rosto (matte), carimbos, tweet, flash-frames,
// SFX em camadas (riser → hit, sub-drop, ambiente de estádio). Sem legendas por padrão. Ver docs/motion/estilo-eafc.md.
import { f2, norm, TEAMS } from "./plan.mjs";
import { grainHtml, leak, sweepHtml, sweep, letterbox, drift, parallaxPhotoHtml, parallaxPhoto, crtHtml, crt, inkReveal, dustHtml, dust, flashFrame, FX_CSS } from "./fx.mjs";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const J = (o) => JSON.stringify(o);

// Sons (studio/assets/sfx-eafc): [latência até o ataque, duração útil]
const SND = {
  "impact-bass-1": [0.07, 2.1], "impact-bass-2": [0.13, 2.4], "whoosh-short": [0.16, 0.57], whoosh: [0.16, 0.57], "whoosh-cinematic": [2.5, 5.5],
  riser: [3.98, 10], "glitch-1": [0.2, 1.2], "glitch-2": [0.02, 0.7], "glitch-3": [0.3, 1.0], notification: [0.23, 2.4], typing: [0.46, 1.5],
  pop: [0.12, 0.72], click: [0.05, 0.37], "click-soft": [0.05, 0.37], "key-press": [0.07, 0.4], ping: [0.32, 1.32], sparkle: [0.03, 1.8], error: [0.74, 1.6], chime: [0.42, 2.5],
  crowd: [0, 20], "sub-drop": [0.02, 1.4], tick: [0.01, 0.12], shutter: [0.01, 0.25], boom: [0.02, 1.8], shimmer: [0.03, 1.2],
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
const GRUNGE = (seed) => `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.004 0.007' numOctaves='5' seed='${seed}'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.6 -0.55'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='0.9'/></svg>`)}")`;
const SCRATCH = `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'><filter id='s'><feTurbulence type='fractalNoise' baseFrequency='0.9 0.004' numOctaves='2' seed='4'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 -0.78'/></filter><rect width='100%' height='100%' filter='url(#s)'/></svg>`)}")`;

export function composeEafc(plan) {
  const { W, H, cuts, words, faces, spec, endVoice, total, scenes, mods, mattes } = plan;
  const js = [], sfx = [], log = [], defs = [];
  let uidN = 0; const uid = () => ++uidN;
  const at = (t) => f2(t);
  const ft = (sel, from, to, t) => { const t0 = Math.max(0, t); js.push(`tl.set(${J(sel)},${J(from)},${at(Math.max(0, t0 - 0.0005))});`); js.push(`tl.to(${J(sel)},${J(to)},${at(t0)});`); };
  const set = (sel, v, t) => js.push(`tl.set(${J(sel)},${J(v)},${at(Math.max(0, t))});`);
  const tto = (sel, to, t) => js.push(`tl.to(${J(sel)},${J(to)},${at(Math.max(0, t))});`);
  const snd = (name, t, vol, pri = 1) => { if (!SND[name]) throw new Error(`sfx "${name}" não existe (${Object.keys(SND).join(", ")})`); sfx.push({ name, t: f2(t), vol, pri }); };
  const ACC = spec.accent || "#FDBE11";
  const TEAM = spec.team ? TEAMS[spec.team] : TEAMS.leicester;
  let track = 20; const nextTrack = () => track++;
  const used = { patterns: [], transitions: [], bgs: { dark: 0 } };

  // ── motion blur direcional (um filtro por uso) / glitch / shake / flash ──────
  let mbN = 0;
  const mblur = (sel, axis, t, dur, peak) => {
    const fid = `mb${axis}${++mbN}`, gid = `${fid}g`;
    defs.push(axis === "x"
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
  // aberração cromática curta no quadro todo (hits)
  const chroma = (t, dur = 0.18) => { set("#shake", { filter: "url(#rgb)" }, t); set("#shake", { filter: "none" }, t + dur); };
  const api = { ft, set, tto, snd, mblur, W, H, uid, defs };

  // ── transições (o = seletor externo; m = camada que se move; c = conteúdo; below = o que está por baixo) ──
  const whipDir = (k) => ({ "whip": [-1, 0], "whip-left": [-1, 0], "whip-right": [1, 0], "whip-up": [0, -1], "whip-down": [0, 1] }[k]);
  function trIn(kind, o, m, t, below, color) {
    if (kind === "none") { set(o, { autoAlpha: 1 }, t); return 0; }
    if (kind === "cut") { set(o, { autoAlpha: 1 }, t); ft(m, { filter: "blur(8px)", scale: 1.03 }, { filter: "blur(0px)", scale: 1, duration: 0.12, ease: "power2.out" }, t); return 0.12; }
    if (kind === "flash") { flash(t, color || "#fff", 0.3); chroma(t, 0.14); set(o, { autoAlpha: 1 }, t); ft(m, { scale: 1.06 }, { scale: 1, duration: 0.5, ease: "power3.out" }, t); snd("whoosh-short", t - 0.08, 0.3, 2); return 0.1; }
    if (kind === "cutflash") {
      const f = 1 / 60, c = color || "#EF0107";
      set("#flash", { backgroundColor: "#000", autoAlpha: 1 }, t - 5 * f); set("#flash", { backgroundColor: c + "66" }, t - 4 * f); set("#flash", { backgroundColor: c }, t - 3 * f); set("#flash", { backgroundColor: "#fff" }, t - f);
      set(o, { autoAlpha: 1 }, t); set("#flash", { autoAlpha: 0 }, t + f); ft(m, { scale: 1.05, filter: "brightness(1.5)" }, { scale: 1, filter: "brightness(1)", duration: 0.3, ease: "power3.out" }, t);
      snd("shutter", t - 4 * f, 0.4, 3); snd("impact-bass-2", t, 0.5, 3); return 0.1;
    }
    if (kind === "glitch") { if (below) glitchOn(below, t - 0.14, 0.14); set(o, { autoAlpha: 1 }, t); glitchOn(m, t, 0.16); snd("glitch-2", t - 0.1, 0.32, 3); return 0.16; }
    if (kind === "ink") { set(o, { autoAlpha: 1 }, t); inkReveal(api, m, t, 0.55, 140); ft(m, { scale: 1.08, filter: "blur(0px)" }, { scale: 1, duration: 0.6, ease: "power3.out" }, t); snd("whoosh", t - 0.08, 0.3, 2); return 0.3; }
    if (kind === "impact") {
      set(o, { autoAlpha: 1 }, t);
      ft(m, { scale: 1.35, filter: "blur(14px)" }, { scale: 1, filter: "blur(0px)", duration: 0.26, ease: "power4.out" }, t);
      if (below) { ft(below, { scale: 1 }, { scale: 1.07, duration: 0.14, ease: "power2.in" }, t - 0.14); set(below, { scale: 1 }, t + 0.3); }
      shake(t + 0.02, 12); chroma(t, 0.12); snd("impact-bass-1", t, 0.6, 3);
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
    if (kind === "flash") { flash(t, color || "#fff", 0.3); chroma(t, 0.14); set(o, { autoAlpha: 0 }, t); recv(); snd("whoosh-short", t - 0.08, 0.26, 2); return; }
    if (kind === "glitch") { glitchOn(m, t - 0.14, 0.14); set(o, { autoAlpha: 0 }, t); if (below) glitchOn(below, t, 0.14); snd("glitch-2", t - 0.12, 0.3, 3); return; }
    if (kind === "ink") { inkReveal(api, m, t - 0.4, 0.4, 0); ft(m, { filter: "blur(0px)" }, { filter: "blur(6px)", duration: 0.35 }, t - 0.35); set(o, { autoAlpha: 0 }, t); recv(); return; }
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

  // ── legendas (desligadas por padrão no eafc) ─────────────────────────────────
  const capMode = spec.captions ?? "none";
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
      const txt = FIX[norm(en.txt)] ?? en.txt;
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
  groups.forEach((g, i) => { ft(`#cap${i}`, { autoAlpha: 0, y: 8, filter: "blur(6px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.12, ease: "power2.out" }, g.s); set(`#cap${i}`, { autoAlpha: 0 }, g.e); });
  const fulls = scenes.filter((s) => s.full);
  const capsState = (show, t) => { if (capMode === "none") return; set("#caps", { autoAlpha: show ? 1 : 0 }, t); };

  // ── base: rosto em tela cheia + câmera viva ────────────────────────────────
  const blocks = [];
  for (const c of cuts) { const last = blocks.at(-1); if (last && !c.screen) { last.out = f2(c.t0 + c.dur); last.cuts.push(c); } else blocks.push({ in: c.t0, out: f2(c.t0 + c.dur), cuts: [c] }); }
  const faceVideos = blocks.map((b, i) => `<video id="vF${i}" class="clip" src="assets/media/edit.mp4" muted playsinline data-start="${b.in}" data-duration="${f2(b.out - b.in)}" data-media-start="${b.in}" data-track-index="0"></video>`).join("\n          ");
  let faceOrigin = "50% 36%";
  { const xs = Object.values(faces || {}).flat().map((p) => p[1]).sort((a, b) => a - b); if (xs.length) faceOrigin = `${f2((xs[xs.length >> 1] / (plan.srcW || 1920)) * 100)}% 36%`; }
  const punches = mods.filter((m) => m.do === "punch").map((m) => ({ t0: m.t0, t1: m.t1, scale: m.scale ?? 1.22, snap: m.snap }));
  {
    // enquadramentos: alternância a cada frase + zoom-out suave quando o rosto volta de uma cena cheia
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
    // volta do rosto depois de cena cheia: zoom-out rápido (1.16 → 1) estilo S2G/Neto
    for (const f of fulls) { if (f.t1 < endVoice - 0.6 && !fulls.some((g) => g !== f && Math.abs(g.t0 - f.t1) < 0.2)) ft("#faceZoom", { scale: 1.16 }, { scale: 1, duration: 0.55, ease: "power3.out" }, f.t1); }
    log.push(`${clean.length} enquadramentos`);
  }
  drift(api, "#faceDrift", 0, endVoice, spec.drift ?? 7);
  set("#lbT", { yPercent: -100 }, 0); set("#lbB", { yPercent: 100 }, 0);
  // matte (recorte do rosto) para texto atrás
  const fgHtml = (mattes || []).map((m, i) => `<div id="fgw${i}" class="layer" style="opacity:0;visibility:hidden"><video id="fg${i}" class="clip" src="assets/media/${m.file}" muted playsinline data-start="${m.in}" data-duration="${f2(m.out - m.in)}" data-media-start="0" data-track-index="${nextTrack()}"></video></div>`).join("\n          ");
  (mattes || []).forEach((m, i) => { set(`#fgw${i}`, { autoAlpha: 1 }, m.in + 0.02); set(`#fgw${i}`, { autoAlpha: 0 }, m.out - 0.02); });

  // ── modificadores ──────────────────────────────────────────────────────────
  let modHtml = "", ambHtml = "";
  for (const m of mods) {
    if (m.do === "shake") shake(m.t0, m.amp ?? 14, m.dur ?? 0.32);
    if (m.do === "flash") flash(m.t0, m.color || "#fff", m.dur ?? 0.3, m.peak ?? 1);
    if (m.do === "sfx") snd(m.name, m.t0, m.vol ?? 0.5, 3);
    if (m.do === "letterbox") letterbox(api, m.t0, m.t1, m.bar ?? 132);
    if (m.do === "ambience") ambHtml += `<audio id="amb${uid()}" src="assets/sfx-eafc/${m.name || "crowd"}.mp3" data-start="${f2(m.t0)}" data-duration="${f2(Math.min(m.t1 - m.t0, SND[m.name || "crowd"][1]))}" data-track-index="10" data-volume="${m.vol ?? 0.16}"></audio>`;
    if (m.do === "lights") {
      ft("#lights", { autoAlpha: 0 }, { autoAlpha: 0.94, duration: 0.1, ease: "power3.in" }, m.t0);
      ft("#lights", { autoAlpha: 0.94 }, { autoAlpha: 0.6, duration: 0.05, repeat: 3, yoyo: true, ease: "steps(1)" }, m.t0 + 0.14);
      ft("#lights", { autoAlpha: 0.94 }, { autoAlpha: 0, duration: 0.22, ease: "power2.out" }, m.t1 - 0.22);
      snd("error", m.t0 - 0.2, 0.4, 3); snd("click", m.t1 - 0.2, 0.3, 2);
    }
    if (m.do === "freeze") {
      const id = `fz${uid()}`;
      modHtml += `<div id="${id}" class="freeze layer" style="opacity:0;visibility:hidden"><div id="${id}k" class="layer"><img src="assets/media/${m.file}" alt="" /></div><div class="layer vig"></div><div class="layer" style="background:${SCRATCH};opacity:.25;mix-blend-mode:screen"></div></div>`;
      set(`#${id}`, { autoAlpha: 1 }, m.t0);
      ft(`#${id}k`, { scale: 1.0, filter: "grayscale(0) contrast(1)" }, { scale: m.zoom ?? 1.28, filter: "grayscale(.35) contrast(1.15)", duration: m.t1 - m.t0, ease: "power2.out" }, m.t0);
      shake(m.t0 + 0.02, 10, 0.25); chroma(m.t0, 0.12); snd(m.sound || "boom", m.t0, m.vol ?? 0.6, 3);
      if (m.hold !== true) set(`#${id}`, { autoAlpha: 0 }, m.t1);
      log.push(`freeze @${m.t0}`);
    }
    if (m.do === "flashframe") {
      const id = `ff${uid()}`;
      modHtml += `<div id="${id}" class="flashImg"><img src="assets/media/${m.media.file}" alt="" style="${m.tone === "mono" ? "filter:grayscale(1) contrast(1.3)" : m.tone === "neg" ? "filter:invert(1) grayscale(1)" : ""}" /></div>`;
      flashFrame(api, id, m.t0, m.frames ?? 3);
      if (m.sound !== false) snd("shutter", m.t0, 0.3, 2);
    }
  }

  // ── helpers de cena ─────────────────────────────────────────────────────────
  const wordsHtml = (id, ws, hl, cls = "") => ws.map((w, i) => `<span class="cw${hl.has(norm(w)) ? " hl" : ""}${cls}" id="${id}w${i}">${esc(w)}</span>`).join(" ");
  const cascade = (id, ws, times, { dx = 40, blur = 10, dur = 0.22, snd: s = null, vol = 0.18 } = {}) => {
    ws.forEach((_, i) => {
      ft(`#${id}w${i}`, { autoAlpha: 0, x: dx, scale: 0.92, filter: `blur(${blur}px)` }, { autoAlpha: 1, x: 0, scale: 1, filter: "blur(0px)", duration: dur, ease: "power3.out" }, times[i]);
      if (s) snd(s, times[i], vol, 1);
    });
  };
  const typeIn = (sel, text, t, dur) => js.push(`(()=>{const o={n:0};const el=document.querySelector(${J(sel)});const s=${J(text)};tl.fromTo(o,{n:0},{n:s.length,duration:${f2(dur)},ease:"none",immediateRender:false,onUpdate:()=>{el.textContent=s.slice(0,Math.round(o.n));}},${at(t)});})();`);
  const countTo = (sel, from, to, t, dur, dec = 0) => js.push(`(()=>{const o={v:${from}};const el=document.querySelector(${J(sel)});tl.fromTo(o,{v:${from}},{v:${to},duration:${f2(dur)},ease:"power3.out",immediateRender:false,onUpdate:()=>{el.textContent=Number(${dec ? "o.v" : "Math.round(o.v)"}).toLocaleString("pt-BR",{minimumFractionDigits:${dec},maximumFractionDigits:${dec}});}},${at(t)});})();`);
  // escudo com sombra + varredura especular (o sweep é um irmão mascarado pelo mesmo PNG)
  const crestEl = (tm, size, id, { sticker = false, reflect = false } = {}) => {
    const w = Math.round(size * 1.1);
    const flt = sticker ? `filter:url(#sticker) drop-shadow(0 ${Math.round(size * 0.06)}px ${Math.round(size * 0.1)}px rgba(0,0,0,.6))` : `filter:drop-shadow(0 ${Math.round(size * 0.06)}px ${Math.round(size * 0.14)}px rgba(0,0,0,.7)) drop-shadow(0 2px 0 rgba(255,255,255,.18))`;
    const refl = reflect ? `<img class="crestRefl" src="assets/media/${tm.media.file}" alt="" style="height:${size}px;max-width:${w}px;top:${Math.round(size * 1.03)}px" />` : "";
    return `<div id="${id}" class="crestWrap" style="width:${w}px;height:${size}px"><img class="crest" src="assets/media/${tm.media.file}" alt="" style="height:${size}px;max-width:${w}px;${flt}" />${refl}${sweepHtml(id + "sw", tm.media.file, w, size)}</div>`;
  };
  const fogHtml = (id) => `<div id="${id}f" class="layer fog"><i></i><b></b></div>`;
  const fog = (id, t0, dur) => { ft(`#${id}f i`, { x: -140, y: 20 }, { x: 160, y: -30, duration: dur + 0.5, ease: "sine.inOut" }, t0 - 0.2); ft(`#${id}f b`, { x: 120, y: -10 }, { x: -140, y: 30, duration: dur + 0.5, ease: "sine.inOut" }, t0 - 0.2); ft(`#${id}f`, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, t0); };
  const crestIn = (id, t, { from = "scale", dur = 0.42 } = {}) => {
    if (from === "scale") ft(`#${id}`, { scale: 2.4, autoAlpha: 0, rotationY: -30, filter: "blur(20px)" }, { scale: 1, autoAlpha: 1, rotationY: 0, filter: "blur(0px)", duration: dur, ease: "power4.out" }, t);
    else { const k = from === "left" ? -1 : 1; ft(`#${id}`, { x: k * W * 0.55, rotationY: k * 35, autoAlpha: 0 }, { x: 0, rotationY: 0, autoAlpha: 1, duration: dur, ease: "power4.out" }, t); mblur(`#${id}`, "x", t, Math.min(0.3, dur), 24); }
    sweep(api, `${id}sw`, t + dur + 0.05, 0.7);
    ft(`#${id}`, { y: 0 }, { y: -8, duration: 1.7, ease: "sine.inOut", repeat: 3, yoyo: true }, t + dur);
  };
  // fundo cinematográfico: cor do time + foto desfocada em parallax (opcional) + grunge + vinheta
  const cineBg = (id, color, media, { tone = "duo", blur = 12, bright = 0.5 } = {}) => {
    const photo = media ? `<div id="${id}bgp" class="layer"><img src="assets/media/${media.file}" alt="" style="position:absolute;inset:-6%;width:112%;height:112%;object-fit:cover;filter:blur(${blur}px) brightness(${bright}) saturate(${tone === "duo" ? 0.3 : 0.9})" />${tone === "duo" ? `<div class="layer" style="background:${color};mix-blend-mode:multiply;opacity:.7"></div>` : ""}</div>` : "";
    return `<div class="layer" style="background:#07070c"></div><div class="layer" style="background:radial-gradient(1300px 900px at 50% 42%, ${color}66 0%, ${color}22 40%, #07070c 75%)"></div>${photo}<div class="layer grunge" style="opacity:.42"></div><div class="layer vig"></div>`;
  };
  const cineBgMotion = (id, t0, dur, hasPhoto) => { if (hasPhoto) ft(`#${id}bgp`, { scale: 1.0, xPercent: -1 }, { scale: 1.08, xPercent: 1, duration: dur + 0.4, ease: "none" }, t0 - 0.2); };
  // posição dos overlays; o deslocamento vertical de -50% é feito via GSAP (yPercent) para não conflitar com transforms
  const posStyle = (pos) => ({
    tl: "left:90px;right:auto;top:70px;bottom:auto;justify-content:flex-start", tr: "right:90px;left:auto;top:70px;bottom:auto;justify-content:flex-end", bl: "left:90px;right:auto;bottom:170px;top:auto;justify-content:flex-start", br: "right:90px;left:auto;bottom:170px;top:auto;justify-content:flex-end",
    center: "left:0;right:0;top:46%;margin:0 auto", top: "left:0;right:0;top:160px;margin:0 auto", bottom: "left:0;right:0;bottom:190px;top:auto;margin:0 auto", low: "left:0;right:0;top:66%;margin:0 auto",
    left: "left:90px;right:auto;top:46%;justify-content:flex-start", right: "right:90px;left:auto;top:46%;justify-content:flex-end",
  }[pos] || "left:0;right:0;top:46%;margin:0 auto");
  const posMid = (pos) => ["center", "left", "right", undefined].includes(pos);
  const bigLabelIn = (id, t) => { ft(`#${id}`, { autoAlpha: 0, x: -90, filter: "blur(12px)" }, { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 0.36, ease: "power4.out" }, t); mblur(`#${id}`, "x", t, 0.22, 20); snd("whoosh-short", t - 0.05, 0.24, 2); };
  const subIn = (id, t) => ft(`#${id}`, { autoAlpha: 0, scaleX: 1.3, filter: "blur(6px)" }, { autoAlpha: 1, scaleX: 1, filter: "blur(0px)", duration: 0.5, ease: "power3.out" }, t);

  // ── cenas ───────────────────────────────────────────────────────────────────
  let sceneHtml = "", overlayHtml = "", behindHtml = "";
  scenes.forEach((s, i) => {
    const id = `S${i}`, o = `#${id}`, m = `#${id}m`, c = `#${id}c`;
    const t0 = s.t0, t1 = s.t1, dur = f2(t1 - t0);
    const fi = fulls.indexOf(s);
    const below = s.prevAdj ? `#S${scenes.indexOf(fulls[fi - 1])}m` : "#baseM";
    let inner = "", color = null, extra = "";
    used.patterns.push(s.do);
    if (s.ambience) ambHtml += `<audio id="amb${uid()}" src="assets/sfx-eafc/${s.ambience === true ? "crowd" : s.ambience}.mp3" data-start="${f2(Math.max(0, t0 - 0.2))}" data-duration="${f2(Math.min(dur + 0.6, 20))}" data-track-index="10" data-volume="${s.ambienceVol ?? 0.16}"></audio>`;
    switch (s.do) {
      case "photo": {
        color = s.color || TEAM.color;
        const pid = `${id}p`;
        inner = parallaxPhotoHtml(pid, s.media.file, { tone: s.tone, color, dark: s.dark ?? 0.2 })
          + dustHtml(`${id}d`, 22, i + 3)
          + leak(api, `${id}lk`, t0 + 0.1, Math.min(dur + 0.3, 2.6), { color: s.leak || "#ffc07a", color2: color, from: i % 2 ? "right" : "left", strength: s.leakStrength ?? 0.45 })
          + (s.label ? `<div id="${id}l" class="bigLabel"><b>${esc(s.label)}</b>${s.sub ? `<small>${esc(s.sub)}</small>` : ""}</div>` : "")
          + (s.stamp ? `<div id="${id}st" class="stamp tl"><span id="${id}stt">${esc(s.stamp)}</span></div>` : "");
        parallaxPhoto(api, pid, t0, dur, { fx: s.fx ?? "push", sweepAt: s.sweep === false ? null : 0.2 });
        dust(api, `${id}d`, t0, dur);
        if (s.label) bigLabelIn(`${id}l`, t0 + 0.2);
        if (s.stamp) { set(`#${id}st`, { autoAlpha: 1 }, t0 + 0.4); ft(`#${id}stt`, { xPercent: -104, autoAlpha: 0.6 }, { xPercent: 0, autoAlpha: 1, duration: 0.42, ease: "expo.out" }, t0 + 0.4); snd("tick", t0 + 0.42, 0.3, 1); }
        break;
      }
      case "crest": {
        const ts = s.teams, duel = ts.length > 1;
        color = s.color || ts[0].color;
        const bgh = cineBg(id, color, s.bgMedia, { tone: s.tone ?? "duo", blur: s.bgBlur ?? 10 });
        cineBgMotion(id, t0, dur, !!s.bgMedia);
        if (!duel) {
          const sz = s.size ?? 520;
          inner = `${bgh}${fogHtml(id)}${dustHtml(`${id}d`, 28, i + 11)}<div class="floorGlow" style="background:radial-gradient(closest-side, ${color}55, transparent)"></div>
            <div class="heroCrest">${crestEl(ts[0], sz, `${id}cr`, { reflect: true })}</div>
            ${s.label ? `<div id="${id}l" class="crestLabel">${esc(s.label)}</div>` : ""}
            ${s.sub ? `<div id="${id}s" class="crestSub" style="color:${s.subColor || ACC}">${esc(s.sub)}</div>` : ""}`
            + leak(api, `${id}lk`, t0 + 0.25, Math.min(dur + 0.2, 2.2), { color: "#ffd9a0", color2: color, from: "right", strength: 0.35 });
          crestIn(`${id}cr`, t0 + 0.02, { from: "scale", dur: 0.4 });
          dust(api, `${id}d`, t0, dur); fog(id, t0, dur);
          if (s.in !== "impact") { snd("impact-bass-2", t0 + 0.05, 0.55, 3); shake(t0 + 0.1, 10); chroma(t0 + 0.05, 0.12); }
          snd("sub-drop", t0 - 0.05, 0.4, 2);
          flash(t0 + 0.12, color, 0.45, 0.3);
          if (s.label) { ft(`#${id}l`, { autoAlpha: 0, y: 40, filter: "blur(10px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.34, ease: "power4.out" }, t0 + 0.34); }
          if (s.sub) subIn(`${id}s`, t0 + 0.55);
        } else {
          const a = ts[0], b = ts[1], sz = s.size ?? 400;
          const mid = s.compT ? crestEl(s.compT, 170, `${id}cp`) : `<b class="vs">${esc(s.vs ?? "×")}</b>`;
          inner = `${bgh}${dustHtml(`${id}d`, 24, i + 5)}<div class="duelGlow" style="background:linear-gradient(90deg, ${a.color}66, transparent 42%, transparent 58%, ${b.color}66)"></div>
            <div class="duel"><div class="duelSide">${crestEl(a, sz, `${id}a`, { sticker: true })}<span id="${id}la">${esc(s.labels?.[0] ?? a.name)}</span></div><div id="${id}vs" class="duelMid">${mid}</div><div class="duelSide">${crestEl(b, sz, `${id}b`, { sticker: true })}<span id="${id}lb">${esc(s.labels?.[1] ?? b.name)}</span></div></div>
            ${s.label ? `<div id="${id}l" class="crestLabel small">${esc(s.label)}</div>` : ""}
            ${s.sub ? `<div id="${id}s" class="crestSub" style="color:${s.subColor || ACC}">${esc(s.sub)}</div>` : ""}`
            + leak(api, `${id}lk`, t0 + 0.3, Math.min(dur + 0.2, 2.4), { color: a.color, color2: b.color, from: "left", strength: 0.3 });
          crestIn(`${id}a`, t0 + 0.02, { from: "left", dur: 0.34 });
          crestIn(`${id}b`, t0 + 0.1, { from: "right", dur: 0.34 });
          ft(`#${id}la`, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power3.out" }, t0 + 0.4);
          ft(`#${id}lb`, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power3.out" }, t0 + 0.48);
          ft(`#${id}vs`, { scale: 0, autoAlpha: 0, rotation: -40 }, { scale: 1, autoAlpha: 1, rotation: 0, duration: 0.34, ease: "back.out(2.2)" }, t0 + 0.4);
          if (s.compT) { set(`#${id}cp`, { autoAlpha: 1 }, t0 + 0.4); sweep(api, `${id}cpsw`, t0 + 0.9, 0.6, { snd: null }); }
          dust(api, `${id}d`, t0, dur);
          snd("whoosh-short", t0, 0.3, 2); snd("impact-bass-1", t0 + 0.4, 0.6, 3); shake(t0 + 0.42, 12); chroma(t0 + 0.4, 0.14); flash(t0 + 0.44, "#fff", 0.3, 0.45);
          if (s.label) ft(`#${id}l`, { autoAlpha: 0, y: 30, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.3, ease: "power3.out" }, t0 + 0.6);
          if (s.sub) subIn(`${id}s`, t0 + 0.7);
        }
        break;
      }
      case "split": {
        const a = s.teams[0], b = s.teams[1] || s.teams[0];
        color = a.color;
        inner = `<div class="layer" style="background:#07070c"></div>
          <div id="${id}L" class="half" style="left:0;background:${a.color}"><div class="layer grunge" style="opacity:.35"></div><div id="${id}sa" class="stripes wide"></div><div class="halfTx">${esc(s.labels?.[0] ?? a.abbr)}</div><div class="halfCrest" style="left:70px;bottom:60px">${crestEl(a, 230, `${id}ca`, { sticker: true })}</div></div>
          <div id="${id}R" class="half" style="right:0;background:${b.color}"><div class="layer grunge" style="opacity:.35"></div><div id="${id}sb" class="stripes wide"></div><div class="halfTx r">${esc(s.labels?.[1] ?? b.abbr)}</div><div class="halfCrest" style="right:70px;top:60px">${crestEl(b, 230, `${id}cb`, { sticker: true })}</div></div>
          ${s.compT ? `<div class="splitMid">${crestEl(s.compT, 230, `${id}cc`)}</div>` : ""}
          ${s.sub ? `<div id="${id}s" class="crestSub low" style="color:#fff">${esc(s.sub)}</div>` : ""}
          <div class="layer vig"></div>`;
        ft(`#${id}sa`, { x: 0 }, { x: -96, duration: dur + 0.5, ease: "none" }, t0 - 0.2); ft(`#${id}sb`, { x: -96 }, { x: 0, duration: dur + 0.5, ease: "none" }, t0 - 0.2);
        ft(`#${id}L`, { x: -W / 2 }, { x: 0, duration: 0.3, ease: "power4.out" }, t0); mblur(`#${id}L`, "x", t0, 0.26, 26);
        ft(`#${id}R`, { x: W / 2 }, { x: 0, duration: 0.3, ease: "power4.out" }, t0 + 0.06); mblur(`#${id}R`, "x", t0 + 0.06, 0.26, 26);
        ft(`#${id}L .halfTx`, { x: -120, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.4, ease: "power4.out" }, t0 + 0.2);
        ft(`#${id}R .halfTx`, { x: 120, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.4, ease: "power4.out" }, t0 + 0.26);
        set(`#${id}ca, #${id}cb`, { autoAlpha: 1 }, t0);
        sweep(api, `${id}casw`, t0 + 0.5, 0.6, { snd: null }); sweep(api, `${id}cbsw`, t0 + 0.65, 0.6);
        if (s.compT) { ft(`#${id}cc`, { scale: 0, rotation: -30, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.34, ease: "back.out(2)" }, t0 + 0.34); sweep(api, `${id}ccsw`, t0 + 0.8, 0.6, { snd: null }); }
        if (s.sub) subIn(`${id}s`, t0 + 0.6);
        snd("impact-bass-1", t0 + 0.3, 0.55, 3); shake(t0 + 0.32, 10); chroma(t0 + 0.3, 0.12);
        break;
      }
      case "score": {
        // placar antigo numa TV de tubo (ref. S2G "2013")
        const a = s.homeT, b = s.awayT;
        color = s.color || a.color;
        const [h0, a0] = String(s.score ?? "0-0").split(/[-x×–]/).map((x) => x.trim());
        const screen = `<div class="layer" style="background:linear-gradient(100deg, ${a.color}99 0%, #15151c 45%, #15151c 55%, ${b.color}99 100%)"></div><div class="layer grunge" style="opacity:.3"></div>
            ${s.meta ? `<div id="${id}meta" class="meta" style="top:48px;font-size:24px">${esc(s.meta)}</div>` : ""}
            <div class="scoreRow" style="top:110px;gap:50px">
              <div id="${id}ha" class="scoreTeam" style="width:280px">${crestEl(a, 210, `${id}ca`)}<span>${esc(a.name)}</span></div>
              <div id="${id}num" class="scoreNum" style="font-size:250px"><b id="${id}h" style="width:170px;height:250px"><i class="dg">${esc(h0)}</i></b><em style="font-size:150px">–</em><b id="${id}a" style="width:170px;height:250px"><i class="dg">${esc(a0)}</i></b></div>
              <div id="${id}aw" class="scoreTeam" style="width:280px">${crestEl(b, 210, `${id}cb`)}<span>${esc(b.name)}</span></div>
            </div>`;
        inner = `${cineBg(id, "#1a1a22", s.bgMedia, { tone: "mono", blur: 16, bright: 0.35 })}${dustHtml(`${id}d`, 18, i + 7)}<div class="persp">${crtHtml(`${id}tv`, screen, { w: s.tvW ?? 1180, h: s.tvH ?? 740, label: s.label || "" })}</div>
          ${s.flip?.tag ? `<div id="${id}tag" class="rubber" style="color:${s.flip.color || "#e11d2e"};border-color:${s.flip.color || "#e11d2e"}">${esc(s.flip.tag)}</div>` : ""}`
          + leak(api, `${id}lk`, t0 + 0.4, Math.min(dur, 2.4), { color: "#ffc98a", color2: "#6aa0ff", from: "left", strength: 0.22 });
        cineBgMotion(id, t0, dur, !!s.bgMedia);
        crt(api, `${id}tv`, t0, dur);
        dust(api, `${id}d`, t0, dur);
        set(`#${id}ca, #${id}cb`, { autoAlpha: 1 }, t0);
        ft(`#${id}ha`, { x: -200, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.34, ease: "power4.out" }, t0 + 0.45); mblur(`#${id}ha`, "x", t0 + 0.45, 0.24, 18);
        ft(`#${id}aw`, { x: 200, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.34, ease: "power4.out" }, t0 + 0.5); mblur(`#${id}aw`, "x", t0 + 0.5, 0.24, 18);
        ft(`#${id}num`, { scale: 1.8, autoAlpha: 0, filter: "blur(12px)" }, { scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 0.3, ease: "power4.out" }, t0 + 0.65);
        snd("impact-bass-1", t0 + 0.65, 0.5, 3); shake(t0 + 0.67, 8);
        if (s.meta) subIn(`${id}meta`, t0 + 0.75);
        if (s.flip) {
          const tf = s.flip.t ?? t0 + dur * 0.6;
          const [h1, a1] = String(s.flip.score).split(/[-x×–]/).map((x) => x.trim());
          for (const [sel, from, to] of [[`#${id}h`, h0, h1], [`#${id}a`, a0, a1]]) {
            if (from === to) continue;
            ft(`${sel} .dg`, { y: 0, filter: "blur(0px)" }, { y: -180, filter: "blur(14px)", autoAlpha: 0, duration: 0.18, ease: "power3.in" }, tf);
            set(`${sel} .dg`, { textContent: to }, tf + 0.18);
            ft(`${sel} .dg`, { y: 180, filter: "blur(14px)", autoAlpha: 0 }, { y: 0, filter: "blur(0px)", autoAlpha: 1, duration: 0.24, ease: "power4.out" }, tf + 0.19);
          }
          glitchOn(`#${id}tvin`, tf, 0.2, 10);
          snd("glitch-3", tf - 0.2, 0.3, 2); snd("impact-bass-2", tf + 0.3, 0.65, 3); shake(tf + 0.32, 16); chroma(tf + 0.3, 0.16); flash(tf + 0.3, s.flip.color || b.color, 0.4, 0.45);
          if (s.flip.tag) { ft(`#${id}tag`, { scale: 3, autoAlpha: 0, rotation: -4 }, { scale: 1, autoAlpha: 1, rotation: -9, duration: 0.2, ease: "power4.in" }, tf + 0.4); snd("impact-bass-1", tf + 0.58, 0.45, 2); shake(tf + 0.6, 10, 0.25); }
          log.push(`placar ${h0}-${a0} → ${h1}-${a1} @${f2(tf)}s`);
        }
        break;
      }
      case "record": {
        const tm = s.teamT; color = s.color || tm?.color || TEAM.color;
        const its = s.items || [];
        inner = `${cineBg(id, color, s.bgMedia, { tone: "duo", blur: 8, bright: 0.55 })}${dustHtml(`${id}d`, 24, i + 9)}
          ${tm ? `<div class="recCrestBig">${crestEl(tm, 300, `${id}cr`)}</div>` : ""}
          <div class="recNums">${its.map((it, k) => `<div class="recCell" id="${id}c${k}"><b id="${id}v${k}">${esc(it.from ?? 0)}</b><span>${esc(it.label)}</span></div>`).join("")}</div>
          ${s.title ? `<div id="${id}t" class="serifTitle">${esc(s.title)}</div>` : ""}
          ${s.sub ? `<div id="${id}s" class="crestSub" style="top:auto;bottom:90px;color:${ACC}">${esc(s.sub)}</div>` : ""}`
          + leak(api, `${id}lk`, t0 + 0.2, Math.min(dur + 0.2, 2.6), { color: "#ffd0a0", color2: color, from: "right", strength: 0.35 });
        cineBgMotion(id, t0, dur, !!s.bgMedia);
        if (tm) crestIn(`${id}cr`, t0 + 0.02, { from: "scale", dur: 0.4 });
        its.forEach((it, k) => {
          ft(`#${id}c${k}`, { autoAlpha: 0, y: 60, filter: "blur(10px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.34, ease: "power4.out" }, t0 + 0.3 + k * 0.12);
          countTo(`#${id}v${k}`, +(it.from ?? 0), +it.value, t0 + 0.35 + k * 0.12, 0.7); snd("tick", t0 + 0.3 + k * 0.12, 0.25, 1);
        });
        dust(api, `${id}d`, t0, dur);
        if (s.in !== "impact") snd("impact-bass-1", t0 + 0.08, 0.5, 3);
        if (s.title) ft(`#${id}t`, { autoAlpha: 0, y: 30, filter: "blur(10px)", scale: 1.1 }, { autoAlpha: 1, y: 0, filter: "blur(0px)", scale: 1, duration: 0.5, ease: "power3.out" }, t0 + 0.7);
        if (s.sub) subIn(`${id}s`, t0 + 0.9);
        break;
      }
      case "ladder": {
        // queda de divisão: tipografia grande, escudo despenca com motion blur, poeira no impacto
        const tm = s.teamT; color = s.color || tm?.color || TEAM.color;
        const rows = s.rows || [], n = rows.length, rowH = 190, top = (H - n * rowH) / 2 + 30;
        const from = s.fromRow ?? 0, to = s.toRow ?? n - 1;
        inner = `${cineBg(id, color, s.bgMedia, { tone: "duo", blur: 14, bright: 0.4 })}${dustHtml(`${id}d`, 26, i + 13)}
          ${rows.map((r, k) => `<div id="${id}r${k}" class="ladRow" style="top:${f2(top + k * rowH)}px;height:${rowH}px"><span class="ladIdx">0${k + 1}</span><b>${esc(r.text)}</b>${r.tag ? `<em id="${id}tg${k}" style="background:${r.tagColor || "#e11d2e"}">${esc(r.tag)}</em>` : ""}<u></u></div>`).join("")}
          ${tm ? `<div id="${id}cr" class="ladCrest" style="top:${f2(top + from * rowH + rowH / 2)}px">${crestEl(tm, 200, `${id}ce`)}</div>` : ""}
          ${s.title ? `<div id="${id}t" class="meta" style="top:70px">${esc(s.title)}</div>` : ""}`;
        cineBgMotion(id, t0, dur, !!s.bgMedia);
        rows.forEach((r, k) => { ft(`#${id}r${k}`, { x: -140, autoAlpha: 0, filter: "blur(10px)" }, { x: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.34, ease: "power4.out" }, t0 + 0.05 + k * 0.09); });
        set(`#${id}r${from}`, { opacity: 1 }, t0);
        dust(api, `${id}d`, t0, dur);
        if (s.title) subIn(`${id}t`, t0 + 0.2);
        if (tm) {
          set(`#${id}ce`, { autoAlpha: 1 }, t0);
          ft(`#${id}cr`, { scale: 2, autoAlpha: 0, filter: "blur(10px)" }, { scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 0.3, ease: "power4.out" }, t0 + 0.35);
          sweep(api, `${id}cesw`, t0 + 0.7, 0.6, { snd: null });
          snd("impact-bass-1", t0 + 0.35, 0.4, 2);
          const steps = Math.abs(to - from), dir = Math.sign(to - from) || 1;
          const tStart = rows[from + dir]?.t ?? t0 + 1.0;
          for (let k = 1; k <= steps; k++) {
            const r = from + dir * k, tk = rows[r]?.t ?? (tStart + (k - 1) * 0.55);
            const y = (r - from) * rowH;
            ft(`#${id}cr`, { y: (r - dir - from) * rowH }, { y, duration: 0.3, ease: "power3.in" }, tk - 0.3);
            mblur(`#${id}cr`, "y", tk - 0.16, 0.18, 14);
            ft(`#${id}cr`, { scaleY: 1 }, { scaleY: 0.86, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out" }, tk);
            ft(`#${id}r${r - dir}`, { opacity: 1 }, { opacity: 0.35, duration: 0.25 }, tk);
            ft(`#${id}r${r} u`, { scaleX: 0 }, { scaleX: 1, duration: 0.25, ease: "power3.out" }, tk);
            glitchOn(`#${id}r${r}`, tk, 0.14, 8);
            if (rows[r]?.tag) ft(`#${id}tg${r}`, { scale: 2.4, autoAlpha: 0, rotation: -6 }, { scale: 1, autoAlpha: 1, rotation: -4, duration: 0.2, ease: "power4.in" }, tk + 0.05);
            snd("whoosh-short", tk - 0.3, 0.28, 2); snd("impact-bass-2", tk, 0.6, 3); shake(tk + 0.02, 14, 0.3); chroma(tk, 0.12); flash(tk + 0.02, color, 0.3, 0.3);
          }
        }
        break;
      }
      case "fixtures": {
        // ida/volta como duas faixas diagonais nas cores dos times, tipografia grande, sem card
        const rows = s.rows || []; color = s.color || TEAM.color;
        const n = rows.length;
        inner = `<div class="layer" style="background:#07070c"></div>` + rows.map((r, k) => {
          const col = r.teamT?.color || color, col2 = r.vsT?.color || "#111";
          const topPx = 110 + k * ((H - 220) / n);
          return `<div id="${id}r${k}" class="fixBand" style="top:${f2(topPx)}px;height:${f2((H - 220) / n - 26)}px;background:linear-gradient(100deg, ${col} 0%, ${col} 55%, ${col2} 100%)"><div class="layer grunge" style="opacity:.35"></div><div class="layer stripes"></div>
            <div class="fixIn">${r.tag ? `<em>${esc(r.tag)}</em>` : ""}<div class="fixTeams">${r.teamT ? crestEl(r.teamT, 150, `${id}t${k}a`, { sticker: true }) : ""}${r.vsT ? `<u>×</u>${crestEl(r.vsT, 150, `${id}t${k}b`, { sticker: true })}` : ""}</div><div class="fixTx"><b>${esc(r.text)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</div></div></div>`;
        }).join("") + `${s.title ? `<div id="${id}t" class="meta" style="top:48px;color:#fff">${esc(s.title)}</div>` : ""}<div class="layer vig"></div>`;
        if (s.title) subIn(`${id}t`, t0 + 0.02);
        rows.forEach((r, k) => {
          // todas as faixas entram no corte (as futuras apagadas); cada uma "acende" na sua vez
          const e = t0 + 0.04 + k * 0.1, a = Math.max(r.t ?? t0, e + 0.1), dirK = k % 2 ? 1 : -1;
          ft(`#${id}r${k}`, { x: dirK * W, autoAlpha: 1 }, { x: 0, duration: 0.36, ease: "power4.out" }, e); mblur(`#${id}r${k}`, "x", e, 0.26, 26);
          set(`#${id}t${k}a, #${id}t${k}b`, { autoAlpha: 1 }, e);
          if (a - e > 0.3) { set(`#${id}r${k}`, { filter: "brightness(.45) saturate(.6)" }, e); ft(`#${id}r${k}`, { filter: "brightness(.45) saturate(.6)", scale: 1 }, { filter: "brightness(1) saturate(1)", scale: 1.02, duration: 0.25, ease: "power3.out" }, a); }
          sweep(api, `${id}t${k}asw`, a + 0.3, 0.6, { snd: null }); if (r.vsT) sweep(api, `${id}t${k}bsw`, a + 0.42, 0.6);
          snd("impact-bass-1", a + 0.05, 0.45, 2); shake(a + 0.07, 8, 0.25);
          if (k > 0) ft(`#${id}r${k - 1}`, { filter: "brightness(1) saturate(1)" }, { filter: "brightness(.55) saturate(.7)", duration: 0.3 }, a);
        });
        break;
      }
      case "number": {
        color = s.color || TEAM.color;
        const v = +s.value, a = +(s.from ?? 0), dec = s.decimals ?? 0;
        if (s.style === "led") {
          // painel de placar LED (ref. S2G): dígitos em matriz de pontos âmbar, bezel de metal, perspectiva, bloom
          const led = s.ledColor || "#FFB000";
          inner = `${cineBg(id, color, s.bgMedia, { tone: "duo", blur: 18, bright: 0.35 })}${dustHtml(`${id}d`, 20, i + 17)}
            <div class="persp"><div id="${id}p" class="ledPanel"><div class="ledBezel"></div><div class="ledScreen">
              <div class="ledGlow" style="color:${led}">${esc(s.prefix || "")}<span id="${id}g">${a}</span>${esc(s.suffix || "")}</div>
              <div class="ledDigits" style="color:${led}">${esc(s.prefix || "")}<span id="${id}v">${a}</span>${esc(s.suffix || "")}</div>
              ${s.label ? `<div class="ledLabel">${esc(s.label)}</div>` : ""}
            </div></div></div>
            ${s.stamp ? `<div id="${id}st" class="stamp bottom"><span id="${id}stt">${esc(s.stamp)}</span></div>` : ""}`
            + leak(api, `${id}lk`, t0 + 0.2, Math.min(dur + 0.3, 2.4), { color: led, color2: color, from: "right", strength: 0.3 });
          cineBgMotion(id, t0, dur, !!s.bgMedia);
          ft(`#${id}p`, { autoAlpha: 0, scale: 0.92, rotationY: -10, rotationX: 4 }, { autoAlpha: 1, scale: 1, rotationY: -6, rotationX: 3, duration: 0.5, ease: "power3.out" }, t0);
          ft(`#${id}p`, { rotationY: -6 }, { rotationY: -2, duration: Math.max(0.6, dur - 0.5), ease: "sine.inOut" }, t0 + 0.5);
          if (a !== v) { const nT = Math.max(2, Math.round((s.count ?? 0.8) / 0.09)); for (let k = 0; k < nT; k++) snd("tick", t0 + 0.15 + k * 0.09, 0.2, 0); js.push(`(()=>{const o={v:${a}};const e1=document.querySelector("#${id}v"),e2=document.querySelector("#${id}g");tl.fromTo(o,{v:${a}},{v:${v},duration:${f2(s.count ?? 0.8)},ease:"steps(${Math.max(1, Math.abs(v - a))})",immediateRender:false,onUpdate:()=>{const t=String(Math.round(o.v));e1.textContent=t;e2.textContent=t;}},${at(t0 + 0.15)});})();`); }
          dust(api, `${id}d`, t0, dur);
          snd("sub-drop", t0 + 0.02, 0.45, 3); snd("impact-bass-2", t0 + 0.15 + (s.count ?? 0.8), 0.5, 3); shake(t0 + 0.17 + (s.count ?? 0.8), 8);
          if (s.stamp) { set(`#${id}st`, { autoAlpha: 1 }, t0 + 0.7); ft(`#${id}stt`, { xPercent: -104, autoAlpha: 0.6 }, { xPercent: 0, autoAlpha: 1, duration: 0.42, ease: "expo.out" }, t0 + 0.7); snd("tick", t0 + 0.72, 0.3, 1); }
          break;
        }
        inner = `${cineBg(id, color, s.bgMedia, { tone: "duo", blur: 14, bright: 0.45 })}${dustHtml(`${id}d`, 30, i + 17)}
          <div class="numWrap"><div id="${id}n" class="bigNum" style="font-family:${s.font === "serif" ? "var(--serif)" : "var(--display)"}">${esc(s.prefix || "")}<span id="${id}v">${a}</span>${esc(s.suffix || "")}</div>${s.label ? `<div id="${id}l" class="numLabel">${esc(s.label)}</div>` : ""}</div>
          ${s.stamp ? `<div id="${id}st" class="stamp bottom"><span id="${id}stt">${esc(s.stamp)}</span></div>` : ""}`
          + leak(api, `${id}lk`, t0 + 0.15, Math.min(dur + 0.3, 2.4), { color: "#ffd9a0", color2: color, from: "left", strength: 0.4 });
        cineBgMotion(id, t0, dur, !!s.bgMedia);
        ft(`#${id}n`, { autoAlpha: 0, scale: 0.7, filter: "blur(16px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.34, ease: "power4.out" }, t0 + 0.02);
        if (a !== v) { countTo(`#${id}v`, a, v, t0 + 0.1, s.count ?? 0.8, dec); const nT = Math.max(2, Math.round((s.count ?? 0.8) / 0.09)); for (let k = 0; k < nT; k++) snd("tick", t0 + 0.1 + k * 0.09, 0.18, 0); }
        ft(`#${id}n`, { scale: 1 }, { scale: 1.06, duration: dur, ease: "none" }, t0 + 0.36);
        ft(`#${id}n`, { textShadow: `0 0 0px ${color}00` }, { textShadow: `0 0 60px ${color}aa`, duration: 0.5 }, t0 + 0.6);
        dust(api, `${id}d`, t0, dur);
        snd("impact-bass-2", t0 + 0.05, 0.55, 3); shake(t0 + 0.08, 9); chroma(t0 + 0.05, 0.1);
        if (s.label) subIn(`${id}l`, t0 + 0.55);
        if (s.stamp) { set(`#${id}st`, { autoAlpha: 1 }, t0 + 0.7); ft(`#${id}stt`, { xPercent: -104, autoAlpha: 0.6 }, { xPercent: 0, autoAlpha: 1, duration: 0.42, ease: "expo.out" }, t0 + 0.7); snd("tick", t0 + 0.72, 0.3, 1); }
        break;
      }
      case "title": {
        color = s.color || TEAM.color;
        const tws = String(s.title).split(/\s+/);
        inner = `${cineBg(id, color, s.bgMedia, { tone: "duo", blur: 6, bright: 0.5 })}<div class="layer grunge2"></div>${dustHtml(`${id}d`, 30, i + 23)}
          <div class="titleWrap">${s.kicker ? `<div id="${id}k" class="kicker">${esc(s.kicker)}</div>` : ""}<div id="${id}t" class="titleBig">${wordsHtml(id, tws, new Set((s.hl || []).map(norm)))}</div>${s.sub ? `<div id="${id}s" class="titleSub">${esc(s.sub)}</div>` : ""}</div>`
          + leak(api, `${id}lk`, t0 + 0.1, Math.min(dur + 0.3, 3), { color: "#ffd9a0", color2: color, from: "right", strength: 0.45 });
        cineBgMotion(id, t0, dur, !!s.bgMedia);
        cascade(id, tws, tws.map((_, k) => f2(t0 + 0.12 + k * 0.1)), { dx: 0, blur: 18, dur: 0.5 });
        ft(`#${id}t`, { scale: 1.08 }, { scale: 1, duration: dur, ease: "power1.out" }, t0);
        dust(api, `${id}d`, t0, dur);
        if (s.kicker) subIn(`${id}k`, t0 + 0.1);
        if (s.sub) ft(`#${id}s`, { autoAlpha: 0, y: 18, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45, ease: "power3.out" }, t0 + 0.12 + tws.length * 0.1 + 0.15);
        snd("whoosh-cinematic", t0, 0.5, 3); snd("impact-bass-2", t0 + 0.05, 0.5, 2);
        break;
      }
      case "montage": {
        const its = s.items, step = s.step ?? 1.0;
        color = s.color || TEAM.color;
        inner = its.map((it, k) => `<div id="${id}i${k}" class="layer" style="opacity:0;visibility:hidden">${parallaxPhotoHtml(`${id}p${k}`, it.media.file, { tone: it.tone, color: it.color || color, dark: 0.15 })}${it.label ? `<div id="${id}l${k}" class="bigLabel center"><b>${esc(it.label)}</b></div>` : ""}</div>`).join("");
        its.forEach((it, k) => {
          const a = it.t, d = (its[k + 1]?.t ?? t1) - a;
          set(`#${id}i${k}`, { autoAlpha: 1 }, a);
          parallaxPhoto(api, `${id}p${k}`, a, d, { fx: k % 2 ? "out" : "push", sweepAt: null });
          if (k < its.length - 1) set(`#${id}i${k}`, { autoAlpha: 0 }, its[k + 1].t);
          if (it.label) ft(`#${id}l${k}`, { scale: 1.6, autoAlpha: 0, filter: "blur(10px)" }, { scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 0.22, ease: "power4.out" }, a + 0.04);
          if (k > 0 || s.in !== "flash") { flash(a, "#fff", 0.16, 0.7); chroma(a, 0.1); snd(k % 2 ? "impact-bass-2" : "impact-bass-1", a, 0.55, 3); shake(a + 0.02, 10, 0.24); }
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
        const style = `font-family:${fam};font-size:${fs}px;color:${col};${posStyle(s.pos ?? "center")};${s.font === "serif" ? (s.italic ? "font-style:italic;" : "") : "text-transform:uppercase;letter-spacing:.01em;"}${s.glow ? `text-shadow:0 0 60px ${col}88;` : ""}`;
        const html = `<div id="${id}" class="bigWord${s.behind ? " behind" : ""}${s.gold ? " gold" : ""}${s.chrome ? " chrome" : ""}" style="${style}">${wordsHtml(id, ws, hl)}</div>`;
        if (s.behind) behindHtml += html; else overlayHtml += html;
        if (posMid(s.pos)) set(o, { yPercent: -50 }, 0);
        cascade(id, ws, s.sync.times, { dx: s.font === "serif" ? 30 : 60, blur: 14, dur: 0.26, snd: s.silent ? null : (s.font === "serif" ? "whoosh-short" : "impact-bass-1"), vol: s.font === "serif" ? 0.16 : 0.3 });
        ft(o, { x: 0 }, { x: s.drift ?? 14, duration: dur, ease: "none" }, t0);
        tto(o, { autoAlpha: 0, filter: "blur(10px)", duration: 0.2, ease: "power2.in" }, t1 - 0.2);
        return;
      }
      case "stamp": {
        if (s.style === "rubber") {
          const col = s.color || "#e11d2e";
          overlayHtml += `<div id="${id}" class="rubber ov" style="color:${col};border-color:${col};${posStyle(s.pos ?? "low")}">${esc(s.text)}</div>`;
          if (posMid(s.pos ?? "low") || (s.pos ?? "low") === "low") set(o, { yPercent: -50 }, 0);
          ft(o, { scale: 3.2, autoAlpha: 0, rotation: -2 }, { scale: 1, autoAlpha: 1, rotation: s.rot ?? -10, duration: 0.2, ease: "power4.in" }, t0);
          snd("impact-bass-1", t0 + 0.18, 0.6, 3); shake(t0 + 0.2, 14, 0.3); chroma(t0 + 0.18, 0.12); flash(t0 + 0.2, col, 0.3, 0.35);
          tto(o, { autoAlpha: 0, filter: "blur(8px)", duration: 0.18 }, t1 - 0.18);
        } else {
          overlayHtml += `<div id="${id}" class="stamp ${s.pos ?? "tl"}"><span id="${id}t">${esc(s.text)}</span></div>`;
          set(o, { autoAlpha: 1 }, t0);
          ft(`#${id}t`, { xPercent: -104, autoAlpha: 0.6 }, { xPercent: 0, autoAlpha: 1, duration: 0.42, ease: "expo.out" }, t0);
          snd("tick", t0 + 0.02, 0.3, 1);
          tto(`#${id}t`, { xPercent: 104, autoAlpha: 0, duration: 0.3, ease: "expo.in" }, t1 - 0.3);
        }
        return;
      }
      case "tweet": {
        const theme = s.theme ?? "light", pos = s.pos ?? "bl", big = pos === "center";
        const w = s.width ?? (big ? 980 : 760);
        const av = s.avatarMedia ? `<img src="assets/media/${s.avatarMedia.file}" alt="" />` : `<b style="background:linear-gradient(135deg, ${s.avatarColor || TEAM.color}, ${s.avatarColor2 || TEAM.color2})">${esc((s.initials || String(s.name || "?").slice(0, 1)).toUpperCase())}</b>`;
        const txt = String(s.text || ""), hl = new Set((s.hl || []).map(norm));
        const tws = txt.split(/(\s+)/).map((p) => /\s+/.test(p) ? p : (p.startsWith("#") || p.startsWith("@") || hl.has(norm(p)) ? `<a>${esc(p)}</a>` : esc(p))).join("");
        const posCss = pos === "bl" ? `left:80px;bottom:200px` : pos === "br" ? `right:80px;bottom:200px` : pos === "tr" ? `right:80px;top:90px` : pos === "tl" ? `left:80px;top:90px` : `left:${(W - w) / 2}px;top:${H / 2 - 220}px`;
        overlayHtml += `<div class="persp"><div id="${id}" class="tweet ${theme}${big ? " big" : ""}" style="width:${w}px;${posCss}">
            <div class="twHead"><div class="twAv">${av}</div><div class="twWho"><b>${esc(s.name || "Torcedor")} ${s.verified !== false ? ICON.check : ""}</b><span>${esc(s.handle || "@torcedor")} · ${esc(s.time || "2h")}</span></div><i class="twX">${ICON.x}</i></div>
            <div class="twText" id="${id}tx">${tws}</div>
            <div class="twMeta"><span>${ICON.reply}<u>${esc(s.replies ?? "48")}</u></span><span>${ICON.repost}<u>${esc(s.reposts ?? "120")}</u></span><span id="${id}like" class="like">${ICON.heart}<u id="${id}lk">${esc(s.likes ?? "1.2K")}</u></span><span>${ICON.views}<u>${esc(s.views ?? "38K")}</u></span></div>
          </div></div>`;
        const fromY = big ? 90 : (pos === "tl" || pos === "tr" ? -H * 0.4 : -H * 0.5);
        ft(o, { autoAlpha: 0, y: fromY, scale: big ? 0.92 : 1, rotationX: -18 }, { autoAlpha: 1, y: 0, scale: 1, rotationX: 0, duration: 0.32, ease: "power4.out" }, t0);
        mblur(o, "y", t0, 0.24, 22);
        ft(o, { y: 0 }, { y: 10, duration: 0.08, ease: "power1.out" }, t0 + 0.32); ft(o, { y: 10 }, { y: 0, duration: 0.14, ease: "power2.inOut" }, t0 + 0.4);
        ft(o, { rotationY: 0 }, { rotationY: -4, duration: dur, ease: "sine.inOut" }, t0 + 0.5);
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
        overlayHtml += `<div id="${id}" class="badge" style="${css};width:${Math.round(size * 1.1)}px;height:${size}px">${crestEl(tm, size, `${id}c`, { sticker: true })}</div>`;
        set(`#${id}c`, { autoAlpha: 1 }, t0);
        ft(o, { autoAlpha: 0, scale: 0.3, rotationY: -40, filter: "blur(8px)" }, { autoAlpha: 1, scale: 1, rotationY: 0, filter: "blur(0px)", duration: 0.4, ease: "back.out(1.8)" }, t0);
        sweep(api, `${id}csw`, t0 + 0.5, 0.6);
        ft(o, { y: 0 }, { y: -12, duration: 1.4, ease: "sine.inOut", repeat: Math.max(1, Math.ceil(dur / 1.4)), yoyo: true }, t0 + 0.4);
        snd("pop", t0 + 0.02, 0.35, 2);
        tto(o, { autoAlpha: 0, scale: 0.6, filter: "blur(8px)", duration: 0.2, ease: "power2.in" }, t1 - 0.2);
        return;
      }
    }
    used.bgs.dark += dur;
    const archive = s.archive ?? ["photo", "score", "record", "number", "montage", "title"].includes(s.do);
    if (archive) {
      const prevA = s.prevAdj && fulls[fi - 1] && (fulls[fi - 1].archive ?? ["photo", "score", "record", "number", "montage", "title"].includes(fulls[fi - 1].do));
      const nextF = fulls[fi + 1], nextA = nextF && Math.abs(nextF.t0 - t1) < 0.2 && (nextF.archive ?? ["photo", "score", "record", "number", "montage", "title"].includes(nextF.do));
      if (!prevA) { set("#lbT", { yPercent: 0 }, t0); set("#lbB", { yPercent: 0 }, t0); }
      if (!nextA) { set("#lbT", { yPercent: -100 }, t1); set("#lbB", { yPercent: 100 }, t1); }
    }
    sceneHtml += `
      <div id="${id}" class="layer scene" style="opacity:0;visibility:hidden"><div id="${id}m" class="layer" style="background:#07070c"><div id="${id}c" class="layer">${inner}</div></div>${extra}</div>`;
    if (!s.prevAdj) { trIn(s.in, o, m, t0, below, color); used.transitions.push(s.in); }
    else { const d = trIn(s.in, o, m, t0, below, color); used.transitions.push(s.in); set(`#S${scenes.indexOf(fulls[fi - 1])}`, { autoAlpha: 0 }, t0 + Math.max(0.45, d + 0.1)); }
    if (!s.next && t1 < total - 0.05) { trOut(s.out, o, m, c, t1, "#baseM", color); used.transitions.push(s.out); }
    capsState(false, s.prevAdj ? t0 : t0 - 0.02);
    if (!s.next) capsState(true, t1);
  });

  // ── SFX: limitador de densidade ─────────────────────────────────────────────
  const maxPer10 = spec.sfxMax ?? (spec.sfx === "off" ? 0 : spec.sfx === "low" ? 3 : 8);
  const hush = plan.hush || [];
  const cand = sfx.filter((x) => x.t >= 0 && x.t < total - 0.1 && !hush.some(([a, b]) => x.t >= a && x.t <= b)).sort((a, b) => b.pri - a.pri || b.vol - a.vol || a.t - b.t);
  const kept = [];
  const fits = (x) => {
    if (x.name === "tick" || x.name === "crowd") return !kept.some((k) => Math.abs(k.t - x.t) < 0.04 && k.name === x.name); // ticks fora do limitador
    if (kept.some((k) => Math.abs(k.t - x.t) < 0.12 && k.name === x.name)) return false;
    if (kept.filter((k) => Math.abs(k.t - x.t) < 0.15 && k.name !== "tick").length >= 2) return false;
    const ts = [...kept.filter((k) => k.name !== "tick").map((k) => k.t), x.t].filter((t) => Math.abs(t - x.t) < 10).sort((a, b) => a - b);
    for (let i = 0, j = 0; j < ts.length; j++) { while (ts[j] - ts[i] >= 10) i++; if (j - i + 1 > maxPer10) return false; }
    return true;
  };
  for (const x of cand) if (fits(x)) kept.push(x);
  kept.sort((a, b) => a.t - b.t);
  log.push(`SFX ${kept.length}/${sfx.length} (limite ${maxPer10}/10 s${hush.length ? `, ${hush.length} trecho(s) em silêncio` : ""})`);
  const sfxHtml = kept.map((x, i) => {
    const st = f2(Math.max(0, x.t - SND[x.name][0]));
    return `<audio id="sfx${i}" src="assets/sfx-eafc/${x.name}.mp3" data-start="${st}" data-duration="${f2(Math.min(SND[x.name][1], total - st))}" data-track-index="${4 + (i % 5)}" data-volume="${x.vol}"></audio>`;
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
      #facePunch, #facePush, #faceZoom { position: absolute; inset: 0; transform-origin: ${faceOrigin}; }
      #faceDrift { position: absolute; inset: -12px; }
      #facePan { position: absolute; left: 12px; top: 12px; width: ${W}px; height: ${H}px; }
      #facePan video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.05) saturate(1.06); }
      #behind { position: absolute; inset: 0; }
      #faceShade { background: linear-gradient(to top, rgba(0,0,0,${capMode === "none" ? ".14" : ".42"}) 0%, rgba(0,0,0,.06) 20%, transparent 36%); }
      #lights { background: #000; opacity: 0; visibility: hidden; }
      .kb { overflow: hidden; }
      .grunge { background: ${GRUNGE(7)}; background-size: cover; mix-blend-mode: screen; }
      .grunge2 { background: ${GRUNGE(31)}; background-size: cover; mix-blend-mode: multiply; opacity: .5; }
      .stripes { background: repeating-linear-gradient(-30deg, rgba(255,255,255,0) 0 44px, rgba(255,255,255,.045) 44px 48px); }
      .crest { display: block; width: auto; object-fit: contain; }
      .crestWrap { position: relative; display: grid; place-items: center; opacity: 0; transform-style: preserve-3d; }
      .spotGlow { position: absolute; left: 50%; top: 50%; width: 1100px; height: 1100px; margin: -550px 0 0 -550px; border-radius: 50%; opacity: .9; }
      .heroCrest { position: absolute; left: 0; right: 0; top: 150px; display: flex; justify-content: center; perspective: 1400px; }
      .crestLabel { position: absolute; left: 0; right: 0; top: 760px; text-align: center; font: 400 128px/1 var(--display); text-transform: uppercase; letter-spacing: .02em; color: #fff; -webkit-text-stroke: 2px #0a0a0a; paint-order: stroke fill; text-shadow: 2px 2px 0 #181818, 4px 4px 0 #121212, 6px 6px 0 #0c0c0c, 0 22px 40px rgba(0,0,0,.7); opacity: 0; }
      .crestLabel.small { font-size: 96px; top: 820px; }
      .crestSub { position: absolute; left: 0; right: 0; top: 905px; text-align: center; font: 600 32px/1 var(--font); text-transform: uppercase; letter-spacing: .22em; opacity: 0; }
      .crestSub.low { top: 960px; }
      .duelGlow { position: absolute; inset: 0; }
      .duel { position: absolute; left: 0; right: 0; top: 0; bottom: 0; display: flex; align-items: center; justify-content: center; gap: 110px; padding-bottom: 120px; perspective: 1400px; }
      .duelSide { display: flex; flex-direction: column; align-items: center; gap: 34px; }
      .duelSide span { font: 600 40px/1 var(--cond); text-transform: uppercase; letter-spacing: .08em; color: #fff; text-shadow: 0 6px 24px rgba(0,0,0,.6); opacity: 0; }
      .duelMid { display: flex; align-items: center; justify-content: center; width: 220px; opacity: 0; padding-bottom: 70px; }
      .duelMid .vs { font: 900 190px/1 var(--serif); font-style: italic; color: #fff; text-shadow: 0 0 40px rgba(255,255,255,.35); }
      .half { position: absolute; top: 0; bottom: 0; width: ${W / 2}px; overflow: hidden; }
      .halfTx { position: absolute; left: 70px; top: 120px; font: 400 420px/1 var(--display); text-transform: uppercase; letter-spacing: -.01em; opacity: 0; color: #fff; text-shadow: 0 20px 60px rgba(0,0,0,.35); }
      .halfTx.r { left: auto; right: 70px; top: auto; bottom: 90px; }
      .halfCrest { position: absolute; }
      .splitMid { position: absolute; left: 50%; top: 50%; width: 260px; height: 260px; margin: -130px 0 0 -130px; display: grid; place-items: center; }
      .meta { position: absolute; left: 0; right: 0; top: 150px; text-align: center; font: 600 30px/1 var(--font); letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,.78); opacity: 0; }
      .scoreRow { position: absolute; left: 0; right: 0; top: 250px; display: flex; align-items: center; justify-content: center; gap: 90px; }
      .scoreTeam { display: flex; flex-direction: column; align-items: center; gap: 22px; width: 420px; opacity: 0; }
      .scoreTeam span { font: 600 30px/1 var(--cond); text-transform: uppercase; letter-spacing: .08em; color: #fff; }
      .scoreNum { display: flex; align-items: center; gap: 24px; font: 400 330px/1 var(--display); color: #fff; opacity: 0; padding-bottom: 40px; }
      .scoreNum b { position: relative; display: inline-block; width: 230px; text-align: center; height: 330px; overflow: hidden; font-weight: 400; }
      .scoreNum b i { display: block; font-style: normal; }
      .scoreNum em { font-style: normal; color: rgba(255,255,255,.5); font-size: 200px; padding-bottom: 20px; }
      .rubber { position: absolute; left: 0; right: 0; margin: 0 auto; width: fit-content; top: 760px; padding: 10px 30px 6px; border: 7px solid; border-radius: 10px; font: 700 118px/1 var(--cond); text-transform: uppercase; letter-spacing: .05em; opacity: 0; filter: url(#stampRough); mix-blend-mode: normal; }
      .rubber.ov { display: inline-block; margin: 0; }
      .recCrestBig { position: absolute; left: 0; right: 0; top: 90px; display: flex; justify-content: center; perspective: 1400px; }
      .recNums { position: absolute; left: 0; right: 0; top: 430px; display: flex; justify-content: center; gap: 90px; }
      .recCell { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 170px; opacity: 0; }
      .recCell b { font: 400 230px/1 var(--display); color: #fff; font-variant-numeric: tabular-nums; text-shadow: 0 16px 50px rgba(0,0,0,.6); }
      .recCell span { font: 600 32px/1 var(--cond); text-transform: uppercase; letter-spacing: .3em; color: var(--acc); }
      .serifTitle { position: absolute; left: 0; right: 0; top: 760px; text-align: center; font: 900 118px/1 var(--serif); font-style: italic; color: #fff; letter-spacing: -.01em; text-shadow: 0 20px 60px rgba(0,0,0,.6); opacity: 0; }
      .ladRow { position: absolute; left: 420px; right: 220px; display: flex; align-items: center; gap: 44px; opacity: 0; }
      .ladRow .ladIdx { font: 900 54px/1 var(--serif); font-style: italic; color: rgba(255,255,255,.35); width: 90px; }
      .ladRow b { font: 400 120px/1 var(--display); text-transform: uppercase; letter-spacing: .01em; color: #fff; text-shadow: 0 14px 40px rgba(0,0,0,.6); flex: 1; }
      .ladRow em { font: 400 44px/1 var(--display); font-style: normal; text-transform: uppercase; letter-spacing: .06em; color: #fff; padding: 10px 24px 6px; border-radius: 8px; opacity: 0; }
      .ladRow u { position: absolute; left: 134px; right: 0; bottom: 12px; height: 4px; background: var(--acc); transform: scaleX(0); transform-origin: 0 50%; }
      .ladCrest { position: absolute; left: 150px; margin-top: -100px; opacity: 0; perspective: 1200px; }
      .fixBand { position: absolute; left: 0; right: 0; overflow: hidden; opacity: 0; box-shadow: 0 30px 60px -30px rgba(0,0,0,.8); }
      .fixIn { position: absolute; inset: 0; display: flex; align-items: center; gap: 60px; padding: 0 120px; }
      .fixIn em { font: 400 60px/1 var(--display); font-style: normal; text-transform: uppercase; letter-spacing: .06em; color: #fff; padding: 12px 28px 8px; border: 4px solid rgba(255,255,255,.85); }
      .fixTeams { display: flex; align-items: center; gap: 30px; perspective: 1200px; }
      .fixTeams u { text-decoration: none; font: 900 80px/1 var(--serif); font-style: italic; color: rgba(255,255,255,.8); }
      .fixTx { display: flex; flex-direction: column; gap: 10px; }
      .fixTx b { font: 400 112px/1 var(--display); text-transform: uppercase; letter-spacing: .01em; color: #fff; text-shadow: 0 12px 40px rgba(0,0,0,.5); }
      .fixTx small { font: 600 30px/1 var(--font); letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.85); }
      .numWrap { position: absolute; left: 0; right: 0; top: 280px; text-align: center; }
      .bigNum { display: inline-block; font-size: 420px; line-height: 1; color: #fff; opacity: 0; font-variant-numeric: tabular-nums; letter-spacing: .01em; text-shadow: 0 30px 80px rgba(0,0,0,.6); }
      .numLabel { margin-top: 10px; font: 600 54px/1.1 var(--cond); text-transform: uppercase; letter-spacing: .3em; color: var(--acc); opacity: 0; }
      .titleWrap { position: absolute; left: 160px; right: 160px; top: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px; text-align: center; }
      .kicker { font: 500 26px/1 var(--font); letter-spacing: .4em; text-transform: uppercase; color: rgba(255,255,255,.7); opacity: 0; }
      .titleBig { display: flex; flex-wrap: wrap; justify-content: center; gap: 0 .22em; font: 900 190px/1 var(--serif); color: #fff; letter-spacing: -.01em; text-shadow: 0 20px 60px rgba(0,0,0,.5); }
      .titleBig .cw.hl { color: var(--acc); font-style: italic; }
      .titleSub { font: 900 72px/1.1 var(--serif); font-style: italic; color: var(--acc); opacity: 0; }
      .cw { display: inline-block; opacity: 0; }
      .bigLabel { position: absolute; left: 110px; bottom: 150px; display: flex; flex-direction: column; gap: 14px; opacity: 0; }
      .bigLabel b { font: 400 150px/1 var(--display); text-transform: uppercase; letter-spacing: .01em; color: #fff; -webkit-text-stroke: 2px #0a0a0a; paint-order: stroke fill; text-shadow: 2px 2px 0 #181818, 4px 4px 0 #121212, 6px 6px 0 #0c0c0c, 0 22px 40px rgba(0,0,0,.7); }
      .bigLabel small { font: 500 34px/1 var(--font); letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,.8); }
      .bigLabel.center { left: 0; right: 0; bottom: auto; top: 0; height: 100%; justify-content: center; align-items: center; }
      .bigLabel.center b { font-size: 200px; text-align: center; }
      .stamp { position: absolute; overflow: hidden; padding: 6px 0; font: 500 28px/1 var(--font); letter-spacing: .22em; text-transform: uppercase; color: rgba(255,255,255,.92); text-shadow: 0 2px 14px rgba(0,0,0,.7); opacity: 0; white-space: nowrap; }
      .stamp span { display: inline-block; }
      .stamp.tl { left: 90px; top: 80px; } .stamp.tr { right: 90px; top: 80px; } .stamp.bl { left: 90px; bottom: 150px; } .stamp.br { right: 90px; bottom: 150px; }
      .stamp.bottom { left: 0; right: 0; bottom: 150px; justify-content: center; }
      .bigWord { position: absolute; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 0 .28em; line-height: .95; font-weight: 900; opacity: 1; white-space: nowrap; }
      .bigWord .cw { text-shadow: 0 10px 40px rgba(0,0,0,.45); }
      .bigWord .cw.hl { color: var(--acc); font-style: italic; }
      .bigWord.gold .cw { background: linear-gradient(170deg, #fff3c4 0%, #ffd766 35%, #c8961e 60%, #ffe9a3 100%); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; filter: drop-shadow(0 10px 30px rgba(0,0,0,.5)) drop-shadow(0 0 28px rgba(255,215,102,.35)); }
      .bigWord.chrome .cw { background: linear-gradient(180deg, #ffffff 0%, #f2f5f8 34%, #9fbad6 48%, #ffffff 56%, #c9d3df 100%); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; filter: drop-shadow(0 12px 30px rgba(0,0,0,.55)) drop-shadow(0 0 30px rgba(143,184,255,.45)); }
      .bigWord.chrome .cw.hl, .bigWord.gold .cw.hl { background: linear-gradient(170deg, #fff3c4 0%, #ffd766 35%, #c8961e 60%, #ffe9a3 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
      .tweet { position: absolute; border-radius: 26px; padding: 30px 34px 26px; opacity: 0; box-shadow: 0 40px 90px -20px rgba(0,0,0,.6), 0 0 0 1px rgba(0,0,0,.08); font-family: var(--font); transform-style: preserve-3d; }
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
      .badge { position: absolute; display: grid; place-items: center; opacity: 0; perspective: 1000px; }
      .persp { position: absolute; inset: 0; perspective: 1600px; }
      .freeze img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #caps { position: absolute; left: 0; right: 0; top: 950px; height: 120px; }
      .cap { position: absolute; left: 280px; right: 280px; top: 0; text-align: center; font: 700 40px/1.2 var(--font); letter-spacing: -.005em; color: #fff; opacity: 0; visibility: hidden; }
      .w { display: inline-block; text-shadow: 0 2px 16px rgba(0,0,0,.6), 0 1px 3px rgba(0,0,0,.45); }
      .w.kw { color: var(--acc); }
      #flash { position: absolute; inset: 0; background: #fff; opacity: 0; visibility: hidden; }
      #slices { position: absolute; inset: 0; opacity: 0; visibility: hidden; pointer-events: none; }
      #slices div { position: absolute; left: 0; right: 0; top: 0; height: 26px; background: rgba(255,255,255,.08); mix-blend-mode: difference; }
      .fog { opacity: 0; pointer-events: none; mix-blend-mode: screen; }
      .fog i, .fog b { position: absolute; width: 1400px; height: 700px; border-radius: 50%; background: radial-gradient(closest-side, rgba(255,255,255,.16), transparent); filter: blur(40px); }
      .fog i { left: -300px; top: 420px; } .fog b { left: 700px; top: 520px; }
      .crestRefl { position: absolute; left: 50%; transform: translateX(-50%) scaleY(-1); filter: blur(10px); opacity: .22; -webkit-mask-image: linear-gradient(to top, #000, transparent 60%); mask-image: linear-gradient(to top, #000, transparent 60%); pointer-events: none; }
      .floorGlow { position: absolute; left: 50%; top: 820px; width: 1300px; height: 400px; margin-left: -650px; border-radius: 50%; filter: blur(30px); opacity: .9; }
      .stripes.wide { position: absolute; top: 0; bottom: 0; left: 0; width: calc(100% + 100px); background: repeating-linear-gradient(-30deg, rgba(255,255,255,0) 0 44px, rgba(255,255,255,.045) 44px 48px); }
      .ledPanel { position: absolute; left: 310px; top: 230px; width: 1300px; height: 560px; opacity: 0; transform-style: preserve-3d; }
      .ledBezel { position: absolute; inset: -26px; border-radius: 22px; background: linear-gradient(160deg, #3a3a40, #15151a 55%, #26262c); box-shadow: 0 60px 120px -30px rgba(0,0,0,.9), inset 0 2px 0 rgba(255,255,255,.12), inset 0 -2px 0 rgba(0,0,0,.6); }
      .ledScreen { position: absolute; inset: 0; border-radius: 10px; background: #050506; box-shadow: inset 0 0 60px rgba(0,0,0,.9); overflow: hidden; background-image: radial-gradient(circle, rgba(255,255,255,.035) 0 1.4px, transparent 1.8px); background-size: 6px 6px; }
      .ledDigits, .ledGlow { position: absolute; left: 0; right: 0; top: 70px; text-align: center; font: 400 400px/1 "Bebas", var(--display); letter-spacing: .04em; }
      .ledDigits { -webkit-mask-image: radial-gradient(circle, #000 0 2.4px, transparent 2.7px); mask-image: radial-gradient(circle, #000 0 2.4px, transparent 2.7px); -webkit-mask-size: 6px 6px; mask-size: 6px 6px; }
      .ledGlow { filter: blur(22px); opacity: .55; }
      .ledLabel { position: absolute; left: 0; right: 0; bottom: 40px; text-align: center; font: 600 30px/1 var(--cond); letter-spacing: .4em; text-transform: uppercase; color: rgba(255,255,255,.55); }
      ${FX_CSS}
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
      @font-face { font-family: "Playfair"; font-weight: 900; font-style: italic; src: url(assets/fonts-eafc/playfair-display-latin-900-italic.woff2) format("woff2"); }
      @font-face { font-family: "Bebas"; font-weight: 400; src: url(assets/fonts-eafc/bebas-neue-latin-400-normal.woff2) format("woff2"); }`;

  const grainOn = spec.grain !== false;
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
        ${defs.join("\n        ")}
        <filter id="stampRough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d"/><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="9" result="n2"/><feColorMatrix in="n2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 3.2 -0.9" result="a"/><feComposite in="d" in2="a" operator="out"/></filter>
        <filter id="sticker" x="-15%" y="-15%" width="130%" height="130%"><feMorphology in="SourceAlpha" operator="dilate" radius="7" result="dil"/><feFlood flood-color="#ffffff" result="w"/><feComposite in="w" in2="dil" operator="in" result="stroke"/><feMerge><feMergeNode in="stroke"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="rgb" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/><feOffset in="r" dx="-14" dy="0" result="ro"/>
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb"/><feOffset in="gb" dx="12" dy="0" result="gbo"/>
          <feBlend in="ro" in2="gbo" mode="screen"/>
        </filter>
      </defs></svg>
      <div id="shake">
        <div id="base" class="layer"><div id="baseM" class="layer">
          <div id="faceCam" class="layer"><div id="facePunch"><div id="facePush"><div id="faceZoom"><div id="faceDrift"><div id="facePan">
            ${faceVideos}
            <div id="behind">${behindHtml}</div>
            ${fgHtml}
          </div></div></div></div></div><div id="faceGrade" class="layer"></div><div id="vig" class="layer vig"></div><div id="faceShade" class="layer"></div><div id="lights" class="layer"></div></div>
        </div></div>
        ${sceneHtml}
        <div id="overlays" class="layer">${overlayHtml}${modHtml}</div>
      </div>
      <div id="caps">
        ${capsHtml}
      </div>
      ${grainOn ? grainHtml(total, nextTrack(), spec.grainOpacity ?? 0.14) : ""}
      <div id="lbT"></div><div id="lbB"></div>
      <div id="slices"><div id="sl0"></div><div id="sl1"></div><div id="sl2"></div></div>
      <div id="flash"></div>
      ${plan.voice ? `<audio id="voice" src="assets/media/voice.m4a" data-start="0" data-duration="${endVoice}" data-track-index="3" data-volume="1"></audio>` : ""}
      ${music}
      ${ambHtml}
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
