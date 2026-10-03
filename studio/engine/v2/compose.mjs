// Estilo v2 — gera o index.html (HyperFrames + GSAP) a partir do plano resolvido.
// Linguagem: cena com a voz por baixo (J-cut), cortes de capítulo, 1 objeto por vez, motion blur direcional,
// legendas por frase (Articulat 600), SFX com densidade limitada. Ver docs/motion/estilo-v2.md.
// plan: { fmt, V, W, H, portfolio, cuts, words, faces, screens, spec, endVoice, total, brandFont,
//         scenes, punches, focus, phr, hush, voice }
import { f2, norm, OVERLAY } from "./plan.mjs";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const J = (o) => JSON.stringify(o);

// Sons: [latência até o pico, duração]
const SND = {
  chime: [0.42, 2.54], ping: [0.31, 1.32], pop: [0.04, 0.72], click: [0.045, 0.36], "click-soft": [0.045, 0.36],
  "whoosh-short": [0.07, 0.57], whoosh: [0.07, 0.57], "impact-bass-1": [0.04, 2.1], "key-press": [0.07, 0.43], notification: [0.09, 2.4],
};

const ICONS = {
  figma: '<svg viewBox="0 0 38 57"><path fill="#1abcfe" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"/><path fill="#0acf83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"/><path fill="#ff7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z"/><path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"/><path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"/></svg>',
  framer: '<svg viewBox="0 0 24 36"><path fill="#0a0a0a" d="M0 0h24v12H12zM0 12h12l12 12H12v12L0 24z"/></svg>',
  ia: '<svg viewBox="0 0 40 40"><path fill="#22c55e" d="M20 2c1.6 9.4 8.6 16.4 18 18-9.4 1.6-16.4 8.6-18 18-1.6-9.4-8.6-16.4-18-18C11.4 18.4 18.4 11.4 20 2z"/><path fill="#16a34a" d="M33 2c.5 2.8 2.2 4.5 5 5-2.8.5-4.5 2.2-5 5-.5-2.8-2.2-4.5-5-5 2.8-.5 4.5-2.2 5-5z"/></svg>',
  claude: '<svg viewBox="0 0 40 40"><g stroke="#d97757" stroke-width="4.2" stroke-linecap="round"><path d="M20 4v32M4 20h32M8.7 8.7l22.6 22.6M31.3 8.7 8.7 31.3"/></g></svg>',
  code: '<svg viewBox="0 0 40 40"><path d="M14 11 5 20l9 9M26 11l9 9-9 9M23 7l-6 26" fill="none" stroke="#0a0a0a" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  web: '<svg viewBox="0 0 40 40"><g fill="none" stroke="#0a0a0a" stroke-width="3"><circle cx="20" cy="20" r="15"/><path d="M5 20h30M20 5c5 5 5 25 0 30M20 5c-5 5-5 25 0 30"/></g></svg>',
  search: '<svg viewBox="0 0 40 40"><g fill="none" stroke="#0a0a0a" stroke-width="3.6" stroke-linecap="round"><circle cx="17" cy="17" r="10"/><path d="m25 25 9 9"/></g></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#fff"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="#fafafa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  thumb: '<svg viewBox="0 0 24 24"><path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zm0 0 4-8a2.5 2.5 0 0 1 2.5 2.5V9H19a2 2 0 0 1 2 2.3l-1.1 7A2 2 0 0 1 17.9 20H7" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M6 17v-6a6 6 0 1 1 12 0v6l1.5 2h-15L6 17zM10 21h4" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4.2" fill="#a3a3a3"/><path d="M4 21c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5" fill="#a3a3a3"/></svg>',
  cursor: '<svg viewBox="0 0 24 24"><path d="M5 3l14 9.5-6.3.9 3.6 6.4-2.6 1.4-3.6-6.5L5 19z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>',
};

export function composeV2(plan) {
  const { V, W, H, portfolio, cuts, words, faces, screens, spec, endVoice, total, scenes, punches, focus } = plan;
  const js = [], sfx = [], log = [];
  const at = (t) => f2(t);
  const ft = (sel, from, to, t) => js.push(`tl.fromTo(${J(sel)},${J(from)},${J({ ...to, immediateRender: false })},${at(t)});`);
  const set = (sel, v, t) => js.push(`tl.set(${J(sel)},${J(v)},${at(Math.max(0, t))});`);
  const snd = (name, t, vol, pri = 1) => sfx.push({ name, t: f2(t), vol, pri });
  const K = V ? 1 : 0.82; // escala de tipografia no horizontal
  const px = (n) => Math.round(n * K);
  const ACC = "#22c55e";
  let track = 20; const nextTrack = () => track++;

  // ── motion blur direcional (SVG feGaussianBlur compartilhado por eixo) ───────
  const mblur = (sel, axis, t, dur, peak) => {
    const z = "0 0", p = axis === "x" ? `${peak} 0` : `0 ${peak}`;
    set(sel, { filter: `url(#mb${axis})` }, t);
    ft(`#mb${axis}g`, { attr: { stdDeviation: z } }, { attr: { stdDeviation: p }, duration: f2(dur * 0.5), ease: "power2.in" }, t);
    ft(`#mb${axis}g`, { attr: { stdDeviation: p } }, { attr: { stdDeviation: z }, duration: f2(dur * 0.5), ease: "power2.out" }, t + dur * 0.5);
    set(sel, { filter: "none" }, t + dur + 0.01);
  };

  // ── transições (o = seletor externo p/ visibilidade; m = camada que se move; c = conteúdo; below = o que está por baixo) ──
  const whipDir = (k) => ({ "whip": [-1, 0], "whip-left": [-1, 0], "whip-right": [1, 0], "whip-up": [0, -1], "whip-down": [0, 1] }[k]);
  function trIn(kind, o, m, t, below) {
    if (kind === "none") { set(o, { autoAlpha: 1 }, t); return 0; }
    if (kind === "cut") {
      set(o, { autoAlpha: 1 }, t);
      ft(m, { filter: "blur(10px)", scale: 1.035 }, { filter: "blur(0px)", scale: 1, duration: 0.14, ease: "power2.out" }, t);
      return 0.14;
    }
    if (kind === "blur") {
      ft(o, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14 }, t);
      ft(m, { filter: "blur(22px)" }, { filter: "blur(0px)", duration: 0.2, ease: "power2.out" }, t);
      ft(m, { scale: 1.06 }, { scale: 1, duration: 0.5, ease: "power2.out" }, t);
      return 0.2;
    }
    if (kind.startsWith("whip")) {
      const [dx, dy] = whipDir(kind), d = 0.24, t0 = t - d / 2;
      const ax = dx ? "x" : "y", D = dx ? W : H, k = dx || dy;
      set(o, { autoAlpha: 1 }, t0);
      ft(m, { [ax]: -k * D }, { [ax]: 0, duration: d, ease: "power4.inOut" }, t0);
      ft(m, { [ax]: 0 }, { [ax]: k * D * 0.018, duration: 0.07, ease: "power1.out" }, t0 + d);
      ft(m, { [ax]: k * D * 0.018 }, { [ax]: 0, duration: 0.12, ease: "power2.inOut" }, t0 + d + 0.07);
      mblur(m, ax, t0, d, 26);
      if (below) { ft(below, { [ax]: 0 }, { [ax]: k * D, duration: d, ease: "power4.inOut" }, t0); mblur(below, ax, t0, d, 26); set(below, { [ax]: 0 }, t0 + d + 0.02); }
      snd("whoosh-short", t - 0.05, 0.3, 3);
      return d / 2;
    }
    if (kind === "push-up") {
      set(o, { autoAlpha: 1 }, t);
      ft(m, { y: H * 0.6, scale: 1.05 }, { y: 0, scale: 1, duration: 0.34, ease: "power3.out" }, t);
      mblur(m, "y", t, 0.22, 14);
      if (below) { ft(below, { y: 0, scale: 1 }, { y: -H * 0.08, scale: 0.92, duration: 0.34, ease: "power3.out" }, t); ft(below, { filter: "blur(0px)" }, { filter: "blur(5px)", duration: 0.3 }, t); set(below, { y: 0, scale: 1, filter: "none" }, t + 0.36); }
      snd("whoosh-short", t + 0.02, 0.24, 2);
      return 0.34;
    }
    if (kind === "curtain") {
      const t0 = t - 0.2;
      set(o, { autoAlpha: 1 }, t0);
      ft(m, { y: -H }, { y: 0, duration: 0.42, ease: "power3.inOut" }, t0);
      mblur(m, "y", t0 + 0.05, 0.3, 18);
      ft("#veil", { autoAlpha: 0.3 }, { autoAlpha: 0, duration: 0.07 }, t0 + 0.4);
      snd("whoosh", t - 0.06, 0.26, 3);
      return 0.22;
    }
    if (kind === "zoom") {
      const t0 = t - 0.16;
      if (below) { ft(below, { scale: 1, filter: "blur(0px)" }, { scale: 1.75, filter: "blur(14px)", duration: 0.3, ease: "power2.in" }, t0); set(below, { scale: 1, filter: "none" }, t0 + 0.5); }
      ft(o, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18 }, t0 + 0.12);
      ft(m, { scale: 1.4, filter: "blur(16px)" }, { scale: 1, filter: "blur(0px)", duration: 0.42, ease: "power3.out" }, t0 + 0.12);
      snd("whoosh", t - 0.06, 0.26, 3);
      return 0.38;
    }
    if (kind === "whiteout") {
      ft("#white", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18, ease: "power2.in" }, t - 0.18);
      set(o, { autoAlpha: 1 }, t);
      ft("#white", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: "power2.out" }, t);
      snd("whoosh", t - 0.1, 0.24, 3);
      return 0.3;
    }
    set(o, { autoAlpha: 1 }, t); return 0;
  }
  function trOut(kind, o, m, c, t, below, flood) {
    if (kind === "none") { set(o, { autoAlpha: 0 }, t + 0.5); return; }
    const recv = () => { if (below) { ft(below, { filter: "blur(10px)", scale: 1.035 }, { filter: "blur(0px)", scale: 1, duration: 0.14, ease: "power2.out" }, t); set(below, { filter: "none" }, t + 0.15); } };
    if (kind === "cut") { set(o, { autoAlpha: 0 }, t); recv(); return; }
    if (kind === "blur") { // T9: push-out → corte → foco entrando
      ft(c, { scale: 1 }, { scale: 0.93, duration: 0.6, ease: "power1.inOut" }, t - 0.6);
      ft(c, { filter: "blur(0px)" }, { filter: "blur(9px)", duration: 0.08 }, t - 0.08);
      set(o, { autoAlpha: 0 }, t);
      if (below) {
        ft(below, { filter: "blur(20px)" }, { filter: "blur(0px)", duration: 0.2, ease: "power2.out" }, t);
        ft(below, { scale: 1.06 }, { scale: 1, duration: 0.5, ease: "power2.out" }, t);
        set(below, { filter: "none" }, t + 0.21);
      }
      return;
    }
    if (kind.startsWith("whip")) {
      const [dx, dy] = whipDir(kind), d = 0.24, t0 = t - d / 2;
      const ax = dx ? "x" : "y", D = dx ? W : H, k = dx || dy;
      ft(m, { [ax]: 0 }, { [ax]: k * D, duration: d, ease: "power4.inOut" }, t0);
      mblur(m, ax, t0, d, 26);
      set(o, { autoAlpha: 0 }, t0 + d);
      if (below) { ft(below, { [ax]: -k * D }, { [ax]: 0, duration: d, ease: "power4.inOut" }, t0); mblur(below, ax, t0, d, 26); }
      snd("whoosh-short", t - 0.05, 0.3, 3);
      return;
    }
    if (kind === "spin") { // T4: sai girando com blur; o plano de baixo fica parado
      const d = 0.28;
      ft(m, { rotation: 0, x: 0, y: 0, scale: 1 }, { rotation: 32, x: W * 0.16, y: H * 0.1, scale: 0.88, duration: d, ease: "power2.in" }, t - d);
      ft(c, { filter: "blur(0px)" }, { filter: "blur(10px)", duration: 0.1 }, t - 0.1);
      set(o, { autoAlpha: 0 }, t);
      snd("whoosh-short", t - 0.08, 0.28, 3);
      return;
    }
    if (kind === "shrink") {
      ft(c, { scale: 1 }, { scale: 0, duration: 0.34, ease: "power3.in" }, t - 0.34);
      set(o, { autoAlpha: 0 }, t); recv();
      return;
    }
    if (kind === "flood") { // T11
      set(`${o}fl`, { yPercent: 100 }, 0);
      ft(`${o}fl`, { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: "power2.inOut" }, t - 0.7);
      ft(c, { filter: "saturate(1) blur(0px)" }, { filter: "saturate(0) blur(6px)", duration: 0.6 }, t - 0.6);
      set(o, { autoAlpha: 0 }, t); recv();
      snd("whoosh", t - 0.35, 0.22, 3);
      return;
    }
    if (kind === "whiteout") {
      ft("#white", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18, ease: "power2.in" }, t - 0.18);
      set(o, { autoAlpha: 0 }, t);
      ft("#white", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: "power2.out" }, t);
      snd("whoosh", t - 0.1, 0.24, 3);
      return;
    }
    if (kind === "zoom") {
      ft(m, { scale: 1, filter: "blur(0px)" }, { scale: 2.2, filter: "blur(16px)", duration: 0.3, ease: "power2.in" }, t - 0.15);
      ft(o, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.18 }, t - 0.03);
      if (below) { ft(below, { scale: 1.3, filter: "blur(12px)" }, { scale: 1, filter: "blur(0px)", duration: 0.42, ease: "power3.out" }, t - 0.08); set(below, { filter: "none" }, t + 0.35); }
      snd("whoosh", t - 0.1, 0.26, 3);
    }
  }

  // ── legendas (por frase; "word" = palavra a palavra; "none") ────────────────
  const capMode = spec.captions ?? (portfolio || !cuts.length ? "none" : V ? "phrase" : "none");
  const FIX = spec.fixes || {};
  const KW = new Set((spec.keywords || []).map(norm));
  const MK = new Set((spec.marks || []).map(norm));
  const capWords = [];
  if (capMode !== "none") for (const c of cuts) for (const w of words) {
    if (w.start < c.in - 0.02 || w.start >= c.out - 0.05) continue;
    let txt = FIX[w.text] ?? w.text;
    const end = /[.?!,;:]$/.test(txt);
    txt = txt.replace(/[.,!;:]+$/, "");
    const bare = norm(txt);
    capWords.push({ t: f2(c.t0 + Math.max(w.start, c.in) - c.in), e: f2(c.t0 + Math.min(w.end, c.out) - c.in), txt, end, kind: MK.has(bare) ? "mk" : KW.has(bare) || /^\d+%?$/.test(bare) ? "kw" : "" });
  }
  const groups = [];
  { const maxW = V ? 5 : 7, maxC = V ? 24 : 40; let g = [];
    for (const w of capWords) {
      const prev = g.at(-1), len = g.reduce((a, x) => a + x.txt.length + 1, 0) + w.txt.length;
      if (g.length && (g.length >= maxW || len > maxC || prev.end || w.t - prev.e > 0.32)) { groups.push(g); g = []; }
      g.push(w);
    }
    if (g.length) groups.push(g); }
  groups.forEach((g, i) => { g.s = g[0].t; g.e = f2(Math.min(groups[i + 1]?.[0].t ?? endVoice, g.at(-1).e + 0.7)); });
  const capsHtml = groups.map((g, i) => `<div class="cap" id="cap${i}">${g.map((w, j) => `<span class="w ${w.kind}" id="w${i}_${j}">${w.kind === "mk" ? `<i class="mkb" id="mk${i}_${j}"></i>` : ""}<b>${esc(w.txt)}</b></span>`).join(" ")}</div>`).join("\n        ");
  groups.forEach((g, i) => {
    if (capMode === "word") {
      set(`#cap${i}`, { autoAlpha: 1 }, g.s);
      g.forEach((w, j) => ft(`#w${i}_${j}`, { autoAlpha: 0, y: 12, filter: "blur(6px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.15, ease: "power3.out" }, w.t));
    } else {
      ft(`#cap${i}`, { autoAlpha: 0, y: 10, filter: "blur(6px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.13, ease: "power2.out" }, g.s);
    }
    set(`#cap${i}`, { autoAlpha: 0 }, g.e);
    g.forEach((w, j) => { if (w.kind === "mk") set(`#mk${i}_${j}`, { scaleX: 0 }, 0); });
    g.forEach((w, j) => { if (w.kind === "mk") ft(`#mk${i}_${j}`, { scaleX: 0 }, { scaleX: 1, duration: 0.17, ease: "power2.out" }, w.t); });
  });
  const covered = (t) => scenes.some((x) => !OVERLAY.has(x.do) && t >= x.t0 - 0.05 && t < x.t1 - 0.05);
  const capsState = (mode, t, fromBase) => { if (fromBase && covered(t)) return; if (capMode === "none") return; if (mode === "hide") set("#caps", { autoAlpha: 0 }, t); else { set("#caps", { autoAlpha: 1 }, t); set("#caps", { attr: { "data-mode": mode } }, t); } };

  // ── base: rosto (talk) ou fundo escuro (portfólio) ─────────────────────────
  const blocks = [];
  for (const c of cuts) {
    const kind = c.screen ? "screen" : "face", last = blocks.at(-1);
    if (last && last.kind === kind && last.screen === c.screen) { last.out = f2(c.t0 + c.dur); last.cuts.push(c); }
    else blocks.push({ kind, screen: c.screen, in: c.t0, out: f2(c.t0 + c.dur), cuts: [c] });
  }
  const hasFace = !portfolio && blocks.some((b) => b.kind === "face");
  const VS = V ? H / 1080 : 1, vidW = 1920 * VS, vidH = 1080 * VS;
  let faceVideos = "";
  blocks.forEach((b, i) => { if (b.kind === "face") faceVideos += `<video id="vF${i}" class="clip" src="assets/media/edit.mp4" muted playsinline data-start="${b.in}" data-duration="${f2(b.out - b.in)}" data-media-start="${b.in}" data-track-index="0"></video>\n          `; });
  // câmera que segue o rosto (vertical)
  const faceXs = Object.values(faces).flat().map((p) => p[1]).sort((a, b) => a - b);
  const faceCx = faceXs.length ? faceXs[faceXs.length >> 1] : 960;
  let faceOrigin = "50% 38%";
  if (hasFace && V) {
    const panX = (x) => f2(Math.min(0, Math.max(W - vidW, W / 2 - x * VS)));
    cuts.forEach((c, ci) => {
      if (c.screen) return;
      const pts = (faces[ci] || []).map(([t, x]) => [f2(c.t0 + Math.min(Math.max(t, c.in), c.out) - c.in), x]);
      if (!pts.length) { set("#facePan", { x: panX(960) }, c.t0 || 0.001); return; }
      const sm = pts.map((p, i) => { const w = pts.slice(Math.max(0, i - 2), i + 3).map((q) => q[1]).sort((a, b) => a - b); return [p[0], w[w.length >> 1]]; });
      const keys = [sm[0]];
      for (const p of sm.slice(1)) if (Math.abs(p[1] - keys.at(-1)[1]) > 40) keys.push(p);
      set("#facePan", { x: panX(keys[0][1]) }, c.t0 || 0.001);
      for (let k = 1; k < keys.length; k++) {
        const dt = Math.max(0.4, Math.min(1.2, keys[k][0] - keys[k - 1][0]));
        ft("#facePan", { x: panX(keys[k - 1][1]) }, { x: panX(keys[k][1]), duration: f2(dt), ease: "sine.inOut" }, Math.max(c.t0, keys[k][0] - dt / 2));
      }
    });
  } else if (hasFace) {
    const xs = Object.values(faces).flat().map((p) => p[1]).sort((a, b) => a - b);
    if (xs.length) faceOrigin = `${f2((xs[xs.length >> 1] / 1920) * 100)}% 36%`;
  }
  // enquadramentos: alternância automática a cada corte (simula 2ª câmera) + punches explícitos; push-in contínuo
  if (hasFace) {
    const alt = spec.autoFrame === false ? [1, 1] : V ? [1, 1.14] : [1, 1.12];
    const marks = []; // [t, scale]
    let k = 0;
    cuts.forEach((c) => {
      if (c.screen) return;
      marks.push([c.t0, alt[k++ % 2]]);
      if (spec.autoFrame !== false && c.dur > 6.5) { // plano longo: troca no meio, numa frase
        const mid = c.t0 + c.dur / 2, p = (plan.phr || []).filter((x) => x > c.t0 + 2.5 && x < c.t0 + c.dur - 2.5).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
        if (p != null) marks.push([p, alt[k++ % 2]]);
      }
    });
    marks.sort((a, b) => a[0] - b[0]);
    const scaleAt = (t) => { let s = 1; for (const [mt, ms] of marks) if (mt <= t + 1e-3) s = ms; return s; };
    const ev = [];
    for (const [mt, ms] of marks) if (!punches.some((p) => mt >= p.t0 - 1e-3 && mt < p.t1)) ev.push([mt, ms]);
    for (const p of punches) { ev.push([p.t0, p.scale]); ev.push([p.t1, scaleAt(p.t1)]); }
    ev.sort((a, b) => a[0] - b[0]);
    const clean = [];
    for (const e of ev) { if (clean.length && e[0] - clean.at(-1)[0] <= 0.05) clean[clean.length - 1] = e; else clean.push(e); }
    const ends = [...cuts.map((c) => c.t0), endVoice];
    clean.forEach(([t, s], i) => {
      set("#facePunch", { scale: s }, t || 0.001);
      const nxt = Math.min(clean[i + 1]?.[0] ?? endVoice, ends.find((x) => x > t + 0.05) ?? endVoice);
      if (nxt - t > 0.4) ft("#facePush", { scale: 1 }, { scale: 1.045, duration: f2(nxt - t), ease: "none" }, t || 0.001);
    });
  }

  // ── blocos de tela (cortes com "screen"): UI em card 3D + câmera em círculo ───
  let screenHtml = "";
  const scr = [];
  blocks.filter((b) => b.kind === "screen").forEach((b, k) => {
    const s = screens[b.screen]; if (!s) return;
    const cw = s.crop[2] - s.crop[0], ch = s.crop[3] - s.crop[1];
    let dW = V ? 1000 : 1320, dH = dW * ch / cw;
    const mH = V ? 760 : 820; if (dH > mH) { dH = mH; dW = dH * cw / ch; }
    const dL = V ? (W - dW) / 2 : 90, dT = V ? 230 : (H - dH) / 2;
    const sc = dW / cw, bD = V ? 330 : 360, bL = V ? (W - bD) / 2 : 1500 + (420 - bD) / 2, bT = V ? dT + dH + 70 : (H - bD) / 2;
    const camSc = bD / Math.min(s.cam[2], s.cam[3]);
    const id = `K${k}`;
    scr.push({ b, s, sc, dW, dH, id });
    screenHtml += `
        <div id="${id}" class="layer bg-light" style="opacity:0;visibility:hidden"><div id="${id}m" class="layer"><div id="${id}c" class="layer">
          <div class="persp"><div id="${id}d" class="uicard" style="left:${f2(dL)}px;top:${f2(dT)}px;width:${f2(dW)}px;height:${f2(dH)}px">
            <div id="${id}in" class="dashInner" style="width:${f2(dW)}px;height:${f2(dH)}px">
              <video id="${id}v" class="clip" src="assets/media/edit.mp4" muted playsinline data-start="${b.in}" data-duration="${f2(b.out - b.in)}" data-media-start="${b.in}" data-track-index="${nextTrack()}" style="position:absolute;left:${f2(-s.crop[0] * sc)}px;top:${f2(-s.crop[1] * sc)}px;width:${f2(1920 * sc)}px;height:${f2(1080 * sc)}px"></video>
            </div></div></div>
          <div id="${id}b" class="bubble" style="left:${f2(bL)}px;top:${f2(bT)}px;width:${bD}px;height:${bD}px">
            <video id="${id}cam" class="clip" src="assets/media/edit.mp4" muted playsinline data-start="${b.in}" data-duration="${f2(b.out - b.in)}" data-media-start="${b.in}" data-track-index="${nextTrack()}" style="position:absolute;left:${f2(-s.cam[0] * camSc - (s.cam[2] * camSc - bD) / 2)}px;top:${f2(-s.cam[1] * camSc)}px;width:${f2(1920 * camSc)}px;height:${f2(1080 * camSc)}px"></video>
          </div>
        </div></div></div>`;
    trIn(b.in < 0.05 ? "none" : "zoom", `#${id}`, `#${id}m`, b.in, b.in < 0.05 ? null : "#faceCam");
    ft(`#${id}d`, { rotationY: -14, rotationX: 8, y: 60 }, { rotationY: -6, rotationX: 4, y: 0, duration: 0.9, ease: "expo.out" }, b.in);
    ft(`#${id}d`, { rotationY: -6, rotationX: 4, scale: 1 }, { rotationY: -1, rotationX: 1, scale: 1.04, duration: f2(Math.max(1, b.out - b.in - 0.9)), ease: "sine.inOut" }, b.in + 0.9);
    ft(`#${id}b`, { autoAlpha: 0, scale: 0.6, filter: "blur(10px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.45, ease: "back.out(1.6)" }, b.in + 0.2);
    capsState("light", b.in, true);
    if (b.out < endVoice - 0.1) { trOut("blur", `#${id}`, `#${id}m`, `#${id}c`, b.out, "#faceCam"); capsState("dark", b.out, true); }
  });
  const screenAt = (t) => scr.find((x) => t >= x.b.in - 0.001 && t < x.b.out);
  for (const f of focus) {
    const x = screenAt(f.t); if (!x) continue;
    const z = f.z ?? 1.7, cx = f.x ?? (x.s.crop[0] + x.s.crop[2]) / 2, cy = f.y ?? (x.s.crop[1] + x.s.crop[3]) / 2;
    const ppx = (cx - x.s.crop[0]) * x.sc, ppy = (cy - x.s.crop[1]) * x.sc;
    const o = { x: f2(Math.min(0, Math.max(x.dW - x.dW * z, x.dW / 2 - ppx * z))), y: f2(Math.min(0, Math.max(x.dH - x.dH * z, x.dH / 2 - ppy * z))), scale: z };
    js.push(`tl.to("#${x.id}in",${J({ ...o, duration: f.dur ?? 0.8, ease: "power2.inOut" })},${at(f.t - (f.lead ?? 0.3))});`);
  }

  // ── cenas ───────────────────────────────────────────────────────────────────
  let sceneHtml = "";
  const used = { patterns: [], transitions: [], bgs: {} };
  const mediaEl = (m, t0, dur, style = "") => m.image
    ? `<img src="assets/media/${m.file}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;${style}" />`
    : `<video id="mv${track}" class="clip" src="assets/media/${m.file}" muted playsinline data-start="${at(Math.max(0, t0))}" data-duration="${f2(dur)}" data-media-start="${f2(Math.max(0, -t0))}" data-track-index="${nextTrack()}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;${style}"></video>`;
  const fitBox = (m, mw, mh) => { const ar = (m.iw || 16) / (m.ih || 9); let w = mw, h = w / ar; if (h > mh) { h = mh; w = h * ar; } return [Math.round(w), Math.round(h)]; };
  const countTo = (elId, a, b, dur, t, ease = "power3.out", dec = 0) => js.push(`(()=>{const o={v:${a}};const el=document.getElementById("${elId}");tl.fromTo(o,{v:${a}},{v:${b},duration:${f2(dur)},ease:${J(ease)},immediateRender:false,onUpdate:()=>{el.textContent=Number(${dec ? "o.v" : "Math.round(o.v)"}).toLocaleString("pt-BR",{minimumFractionDigits:${dec},maximumFractionDigits:${dec}});}},${at(t)});})();`);
  // texto em cascata (T1): spans com tempos
  const cascade = (id, ws, times, hl, base, accent) => {
    ws.forEach((w, i) => {
      const isHl = hl.has(norm(w));
      ft(`#${id}w${i}`, { autoAlpha: 0, x: 40 * K, y: 20 * K, scale: 0.9, filter: "blur(8px)", color: accent }, { autoAlpha: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)", duration: 0.18, ease: "power3.out" }, times[i]);
      if (!isHl) ft(`#${id}w${i}`, { color: accent }, { color: base, duration: 0.18 }, times[i] + 0.18);
    });
  };
  const wordsHtml = (id, ws, hl, cls = "") => ws.map((w, i) => `<span class="cw${hl.has(norm(w)) ? " hl" : ""}${cls}" id="${id}w${i}">${esc(w)}</span>`).join(" ");

  scenes.forEach((s, i) => {
    const id = `S${i}`, o = `#${id}`, m = `#${id}m`, c = `#${id}c`, p = `#${id}p`;
    const t0 = s.t0, t1 = s.t1, dur = f2(t1 - t0);
    const prev = scenes[i - 1];
    const overlay = OVERLAY.has(s.do); // cena sobre o rosto (fundo transparente)
    const below = overlay ? null : s.prevAdj && !OVERLAY.has(prev?.do) ? `#S${i - 1}m` : "#baseM";
    let bg = "light", inner = "", caps = "dark", extra = "";
    used.patterns.push(s.do);
    const hl = new Set((s.hl || []).map(norm));
    switch (s.do) {
      case "cutaway": {
        const full = s.frame === "full";
        bg = full ? "black" : (s.bg ?? "light");
        const med = mediaEl(s.media, t0 - 0.15, dur + 0.5, s.gray ? "filter:grayscale(.55) contrast(1.05)" : "");
        if (full) inner = `<div id="${id}k" class="layer kb">${med}</div><div class="layer shadeB"></div>`;
        else { const [bw, bh] = s.media.box; inner = `<div class="persp"><div id="${id}k" class="uicard" style="left:${(W - bw) / 2}px;top:${V ? 300 : (H - bh) / 2 - 20}px;width:${bw}px;height:${bh}px">${med}</div></div>`; }
        if (s.label) inner += `<div id="${id}l" class="tag" style="top:${V ? 190 : 70}px"><i></i>${esc(s.label)}</div>`;
        const fx = s.fx ?? "push";
        if (fx === "pan") ft(`#${id}k`, { xPercent: -2.5, scale: 1.1 }, { xPercent: 2.5, scale: 1.1, duration: dur, ease: "none" }, t0);
        else if (fx === "push") ft(`#${id}k`, { scale: 1 }, { scale: 1.08, duration: dur, ease: "none" }, t0);
        if (!full) ft(`#${id}k`, { rotationY: -10, rotationX: 6 }, { rotationY: -2, rotationX: 2, duration: dur, ease: "sine.inOut" }, t0);
        if (s.label) ft(`#${id}l`, { autoAlpha: 0, y: 16, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.35, ease: "power3.out" }, t0 + 0.25);
        if (s.out === "flood") extra = `<div id="${id}fl" class="flood ${s.flood === "green" ? "fg" : "fr"}"></div>`;
        caps = full ? "dark" : bg === "dark" ? "dark" : "light";
        break;
      }
      case "bridge": {
        bg = s.bg ?? "light";
        const ws = s.sync.ws, long = ws.length > 6;
        inner = `<div id="${id}t" class="bridge ${long ? "long" : ""}">${wordsHtml(id, ws, hl)}${s.sub ? `<div id="${id}s" class="sub">${esc(s.sub)}</div>` : ""}</div>`;
        const base = bg === "light" ? "#171717" : "#fafafa", accent = bg === "green" ? "#052e16" : bg === "light" ? "#16a34a" : "#4ade80";
        cascade(id, ws, s.sync.times, hl, base, accent);
        if (s.sub) ft(`#${id}s`, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out" }, s.sync.times.at(-1) + 0.2);
        ft(`#${id}t`, { scale: 1 }, { scale: 1.045, duration: dur, ease: "none" }, t0);
        if (!s.sync.matched) snd("whoosh-short", t0 + 0.02, 0.18, 1);
        caps = "hide";
        break;
      }
      case "ticker": {
        bg = "green";
        const ws = s.sync.ws, fs = px(V ? 150 : 140);
        const estW = ws.reduce((a, w) => a + w.length * 0.54 * fs, 0) + (ws.length - 1) * 0.27 * fs;
        inner = `<div id="${id}t" class="ticker" style="font-size:${fs}px">${wordsHtml(id, ws, hl)}</div>`;
        const x0 = W * 0.1, x1 = Math.min(x0, W * 0.9 - estW), tA = s.sync.times[0], tB = Math.max(tA + 0.6, s.sync.times.at(-1) + 0.2);
        ws.forEach((w, k) => {
          ft(`#${id}w${k}`, { autoAlpha: 0, x: 60 * K, filter: "blur(10px)" }, { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 0.18, ease: "power3.out" }, s.sync.times[k]);
          if (estW > W * 0.8) ft(`#${id}w${k}`, { opacity: 1 }, { opacity: 0.32, duration: 0.5 }, s.sync.times[k] + 1.3);
        });
        if (x1 < x0) {
          ft(`#${id}t`, { x: x0 }, { x: x1, duration: f2(tB - tA), ease: "none" }, tA);
          ft(`#${id}t`, { x: x1 }, { x: x1 - 40, duration: 0.5, ease: "power2.out" }, tB);
          const v = (x0 - x1) / (tB - tA), b = Math.max(2, Math.min(6, (v / 60) * 0.4));
          set(`#${id}t`, { filter: "url(#mbx)" }, tA + 0.05);
          ft("#mbxg", { attr: { stdDeviation: "0 0" } }, { attr: { stdDeviation: `${f2(b)} 0` }, duration: 0.2 }, tA + 0.05);
          ft("#mbxg", { attr: { stdDeviation: `${f2(b)} 0` } }, { attr: { stdDeviation: "0 0" }, duration: 0.25 }, tB);
          set(`#${id}t`, { filter: "none" }, tB + 0.26);
        } else set(`#${id}t`, { x: (W - estW) / 2 }, t0);
        snd("whoosh-short", tA, 0.2, 1);
        caps = "hide";
        break;
      }
      case "number": {
        bg = "dark";
        const v = +s.value, a = +(s.from ?? 0), dec = s.decimals ?? 0;
        const fmt = (n) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
        const lw = String(s.label || "").split(/\s+/).filter(Boolean);
        inner = `<div class="spot"></div><div class="numWrap"><div id="${id}n" class="num">${esc(s.prefix || "")}<span id="${id}v">${fmt(a)}</span>${esc(s.suffix || "")}</div><div class="numLabel">${wordsHtml(id, lw, hl)}</div></div>`;
        ft(`#${id}n`, { autoAlpha: 0, scale: 0.86, filter: "blur(12px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.4, ease: "power3.out" }, t0 + 0.04);
        js.push(`(()=>{const o={v:${a}};const el=document.getElementById("${id}v");tl.fromTo(o,{v:${a}},{v:${v},duration:0.95,ease:"power3.out",immediateRender:false,onUpdate:()=>{el.textContent=Number(${dec ? "o.v" : "Math.round(o.v)"}).toLocaleString("pt-BR",{minimumFractionDigits:${dec},maximumFractionDigits:${dec}});}},${at(t0 + 0.12)});})();`);
        ft(`#${id}n`, { y: 0 }, { y: -6, duration: 0.95, ease: "power3.out" }, t0 + 0.12);
        cascade(id, lw, lw.map((_, k) => f2(t0 + 0.75 + k * 0.08)), hl, "#a3a3a3", "#4ade80");
        ft(`#${id}n`, { textShadow: "0 0 0px rgba(34,197,94,0)" }, { textShadow: "0 0 36px rgba(34,197,94,.45)", duration: 0.5 }, t0 + 0.9);
        snd("ping", t0 + 1.05, 0.18, 2);
        caps = "dark";
        break;
      }
      case "kpis": {
        bg = "dark";
        const its = s.items || [];
        inner = `<div class="spot"></div>` + its.map((it, k) => {
          const pos = V ? `left:110px;width:860px;top:${330 + k * 270}px;height:230px` : `left:${(W - its.length * 520 + 40) / 2 + k * 520}px;width:480px;top:330px;height:300px`;
          return `<div id="${id}i${k}" class="kpi" style="${pos}"><div class="kv">${esc(it.prefix || "")}<span id="${id}v${k}">${esc(it.from ?? 0)}</span>${esc(it.suffix || "")}</div><div class="kl">${esc(it.label || "")}</div></div>`;
        }).join("");
        its.forEach((it, k) => {
          ft(`#${id}i${k}`, { autoAlpha: 0, y: 30, scale: 0.9, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.35, ease: "power3.out" }, it.t);
          js.push(`(()=>{const o={v:${+(it.from ?? 0)}};const el=document.getElementById("${id}v${k}");tl.fromTo(o,{v:${+(it.from ?? 0)}},{v:${+it.value},duration:0.8,ease:"power3.out",immediateRender:false,onUpdate:()=>{el.textContent=Math.round(o.v).toLocaleString("pt-BR");}},${at(it.t + 0.05)});})();`);
          its.forEach((_, q) => { if (q < k) ft(`#${id}i${q}`, { filter: "blur(0px)", opacity: 1 }, { filter: "blur(4px)", opacity: 0.4, duration: 0.3 }, it.t); });
          snd("click-soft", it.t, 0.16, 1);
        });
        caps = "dark";
        break;
      }
      case "search": {
        bg = "light";
        const q = String(s.query), bw = V ? 900 : 1100, bh = px(V ? 132 : 120);
        inner = `<div class="halo" id="${id}h"></div><div id="${id}b" class="search" style="height:${bh}px;top:${V ? 760 : 420}px;margin-left:${-bh / 2}px;width:${bh}px"><i>${ICONS.search}</i><span id="${id}q" class="sq"></span><span id="${id}cr" class="caret"></span></div>`;
        ft(`#${id}b`, { autoAlpha: 0, scale: 0.7, x: 80 }, { autoAlpha: 1, scale: 1, x: 0, duration: 0.3, ease: "back.out(2)" }, t0 + 0.05);
        mblur(`#${id}b`, "x", t0 + 0.05, 0.14, 10);
        ft(`#${id}h`, { autoAlpha: 0.55, scale: 0.5 }, { autoAlpha: 0, scale: 2.2, duration: 0.6, ease: "power2.out" }, t0 + 0.12);
        ft(`#${id}b`, { width: bh, marginLeft: -bh / 2 }, { width: bw, marginLeft: -bw / 2, duration: 0.45, ease: "power3.inOut" }, t0 + 0.5);
        const tt = t0 + 0.95, td = Math.min(1.3, q.length * 0.045);
        js.push(`(()=>{const o={n:0};const el=document.getElementById("${id}q");const s=${J(q)};tl.fromTo(o,{n:0},{n:s.length,duration:${f2(td)},ease:"none",immediateRender:false,onUpdate:()=>{el.textContent=s.slice(0,Math.round(o.n));}},${at(tt)});})();`);
        ft(`#${id}cr`, { opacity: 1 }, { opacity: 0, duration: 0.3, repeat: Math.max(1, Math.floor((dur - 1) / 0.6)), yoyo: true, ease: "steps(1)" }, tt);
        ft(c, { scale: 1 }, { scale: 1.1, duration: dur, ease: "none" }, t0);
        snd("pop", t0 + 0.08, 0.22, 2); snd("key-press", tt + 0.05, 0.2, 1); snd("key-press", tt + td * 0.6, 0.18, 1);
        caps = "light";
        break;
      }
      case "select": {
        bg = "light";
        const ws = s.sync.ws, wi = ws.findIndex((w) => norm(w) === norm(s.word));
        if (wi < 0) throw new Error(`select: a palavra "${s.word}" não está em "${s.text}"`);
        const before = ws.slice(0, wi), after = ws.slice(wi + 1);
        const span = (w, k) => `<span class="cw" id="${id}w${k}">${esc(w)}</span>`;
        inner = `<div class="selTop">${before.map((w, k) => span(w, k)).join(" ")}</div>
          <div class="selMid"><span class="selWord" id="${id}w${wi}"><i id="${id}box" class="selBox"></i><i id="${id}h1" class="hd l"></i><i id="${id}h2" class="hd r"></i><b>${esc(ws[wi])}</b></span></div>
          <div class="selBot">${after.map((w, k) => span(w, wi + 1 + k)).join(" ")}</div>`;
        cascade(id, ws, s.sync.times, new Set(), "#171717", "#16a34a");
        const ts = Math.max(s.sync.times[wi] + 0.25, t0 + 0.6);
        set(`#${id}box`, { scaleX: 0 }, 0);
        ft(`#${id}box`, { scaleX: 0 }, { scaleX: 1, duration: 0.25, ease: "power2.out" }, ts);
        ft(`#${id}h1, #${id}h2`, { autoAlpha: 0, scaleY: 0.3 }, { autoAlpha: 1, scaleY: 1, duration: 0.2, ease: "back.out(2)" }, ts + 0.15);
        ft(c, { scale: 1 }, { scale: V ? 1.55 : 1.45, duration: 0.55, ease: "power2.inOut" }, ts + 0.3);
        snd("click-soft", ts, 0.3, 2);
        caps = "hide";
        break;
      }
      case "device": {
        bg = s.bg ?? "dark";
        const [bw, bh] = s.media.box, phone = s.kind === "phone";
        const top = V ? (phone ? 520 : 560) : (H - bh) / 2 + (phone ? 0 : 30);
        const left = V ? (W - bw) / 2 : (s.labels?.length ? W * 0.56 - bw / 2 : (W - bw) / 2);
        const frame = phone
          ? `<div id="${id}d" class="phone" style="left:${left}px;top:${top}px;width:${bw}px;height:${bh}px"><div class="scr">${mediaEl(s.media, t0 - 0.2, dur + 0.6)}</div></div>`
          : `<div id="${id}d" class="browser" style="left:${left}px;top:${top - 54}px;width:${bw}px;height:${bh + 54}px"><div class="bar"><i></i><i></i><i></i><u>${esc(s.url || "")}</u></div><div class="scr">${mediaEl(s.media, t0 - 0.2, dur + 0.6)}</div></div>`;
        const labs = s.labels || [];
        inner = `<div class="spot"></div><div class="persp">${frame}</div>` + labs.map((l, k) => `<div id="${id}l${k}" class="devLabel" style="${V ? `top:300px;left:0;right:0;text-align:center` : `left:120px;top:${H / 2 - 60}px;width:${W * 0.56 - bw / 2 - 180}px`}">${esc(l)}</div>`).join("");
        ft(`#${id}d`, { autoAlpha: 0, scale: 0.35, rotationX: 25, rotationY: -30, rotationZ: -20, y: H * 0.18, filter: "blur(6px)" }, { autoAlpha: 1, scale: 1, rotationX: 6, rotationY: -8, rotationZ: 0, y: 0, filter: "blur(0px)", duration: 1.1, ease: "power3.out" }, t0 + 0.05);
        ft(`#${id}d`, { rotationY: -8, rotationX: 6 }, { rotationY: -2, rotationX: 2, duration: Math.max(0.5, dur - 1.1), ease: "sine.inOut" }, t0 + 1.15);
        const lt = (dur - 0.9) / Math.max(1, labs.length);
        labs.forEach((_, k) => {
          const a = t0 + 0.7 + k * lt;
          ft(`#${id}l${k}`, { autoAlpha: 0, x: 40 * K, y: 16, filter: "blur(8px)" }, { autoAlpha: 1, x: 0, y: 0, filter: "blur(0px)", duration: 0.3, ease: "power3.out" }, a);
          if (k < labs.length - 1) ft(`#${id}l${k}`, { autoAlpha: 1, filter: "blur(0px)" }, { autoAlpha: 0, filter: "blur(6px)", duration: 0.2, ease: "power2.in" }, a + lt - 0.2);
        });
        if (s.in !== "curtain") snd("whoosh", t0 + 0.2, 0.22, 2);
        caps = "dark";
        break;
      }
      case "stack": {
        bg = s.bg ?? "light";
        const cs = s.cards || [];
        inner = cs.map((cd, k) => { const [bw, bh] = cd.media.box; return `<div id="${id}k${k}" class="stackCard" style="left:${(W - bw) / 2}px;top:${V ? 380 + (980 - bh) / 2 : (H - bh) / 2}px;width:${bw}px;height:${bh}px">${mediaEl(cd.media, cd.t - 0.1, t1 - cd.t + 0.5)}${cd.label ? `<div class="tag in">${esc(cd.label)}</div>` : ""}</div>`; }).join("");
        cs.forEach((cd, k) => {
          const a = k === 0 ? Math.max(cd.t, t0 + 0.1) : cd.t;
          ft(`#${id}k${k}`, { autoAlpha: 0, y: H * 0.6, scale: 1.05 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.34, ease: "power3.out" }, a);
          mblur(`#${id}k${k}`, "y", a, 0.22, 14);
          ft(`#${id}k${k}`, { scale: 1 }, { scale: 1.04, duration: Math.max(0.5, (cs[k + 1]?.t ?? t1) - a - 0.35), ease: "none" }, a + 0.35);
          if (k > 0) { ft(`#${id}k${k - 1}`, { y: 0, filter: "blur(0px)", opacity: 1 }, { y: -H * 0.08, filter: "blur(5px)", opacity: 0, duration: 0.36, ease: "power3.out" }, a); }
          if (k > 0 || s.in !== "push-up") snd("whoosh-short", a + 0.02, 0.22, 2);
        });
        caps = bg === "dark" ? "dark" : "light";
        break;
      }
      case "swap": {
        bg = s.bg ?? "light";
        const its = s.items || [];
        const cw = V ? 900 : 1100, top = V ? 560 : 300;
        inner = `<div id="${id}card" class="swapCard" style="left:${(W - cw) / 2}px;top:${top}px;width:${cw}px"><div class="swT"><span>${esc(s.title || "")}</span><span id="${id}cnt" class="swN"></span></div>${its.map((it, k) => `<div id="${id}r${k}" class="swR ${it.tone === "bad" ? "bad" : "good"}"><i>${it.tone === "bad" ? ICONS.x : ICONS.check}</i><b>${esc(it.text)}</b></div>`).join("")}</div>`;
        ft(`#${id}card`, { autoAlpha: 0, y: 40, scale: 0.9, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.4, ease: "power3.out" }, t0 + 0.05);
        ft(`#${id}card`, { scale: 1 }, { scale: 1.035, duration: dur, ease: "none" }, t0 + 0.45);
        its.forEach((it, k) => {
          const a = Math.max(it.t, t0 + 0.2 + k * 0.4);
          ft(`#${id}r${k}`, { autoAlpha: 0, y: 26, filter: "blur(9px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.22, ease: "power2.out" }, a);
          set(`#${id}cnt`, { textContent: `${k + 1}/${its.length}` }, a);
          if (k > 0) ft(`#${id}r${k - 1}`, { autoAlpha: 1, y: 0, filter: "blur(0px)" }, { autoAlpha: 0, y: -26, filter: "blur(9px)", duration: 0.14, ease: "power2.in" }, a - 0.14);
          snd("click-soft", a, 0.24, 2);
        });
        caps = "light";
        break;
      }
      case "icons": {
        bg = s.bg ?? "light";
        const ic = (s.icons || ["figma", "framer", "ia"]).filter((x) => ICONS[x]);
        const bwds = String(s.before ?? "").split(/\s+/).filter(Boolean), awds = String(s.after ?? "").split(/\s+/).filter(Boolean);
        const all = [...bwds, ...awds], tms = s.sync.times;
        inner = `<div id="${id}t" class="iconLine">${bwds.map((w, k) => `<span class="cw" id="${id}w${k}">${esc(w)}</span>`).join(" ")} <span id="${id}slot" class="slot">${ic.map((x, k) => `<i id="${id}i${k}">${ICONS[x]}</i>`).join("")}</span> ${awds.map((w, k) => `<span class="cw" id="${id}w${bwds.length + k}">${esc(w)}</span>`).join(" ")}</div>`;
        cascade(id, all, tms, new Set(), "#171717", "#16a34a");
        const sIn = Math.max(t0 + 0.1, (tms[bwds.length - 1] ?? t0) + 0.12);
        ft(`#${id}slot`, { autoAlpha: 0, scale: 0.6, filter: "blur(8px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.3, ease: "back.out(2)" }, sIn);
        const step = Math.min(0.62, Math.max(0.35, (t1 - sIn - 0.6) / Math.max(1, ic.length)));
        ic.forEach((_, k) => {
          const a = sIn + k * step;
          if (k === 0) set(`#${id}i0`, { yPercent: 0, autoAlpha: 1 }, sIn);
          else {
            ft(`#${id}i${k - 1}`, { yPercent: 0, filter: "blur(0px)" }, { yPercent: -110, filter: "blur(6px)", duration: 0.2, ease: "power3.in" }, a);
            ft(`#${id}i${k}`, { yPercent: 110, autoAlpha: 1, filter: "blur(6px)" }, { yPercent: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.24, ease: "power3.out" }, a + 0.12);
            if (k <= 2) snd("click", a + 0.12, 0.14, 1);
          }
        });
        ft(`#${id}t`, { scale: 1 }, { scale: 1.045, duration: dur, ease: "none" }, t0);
        caps = "hide";
        break;
      }
      case "gallery": { // fotos passando em pilha (+ contador opcional por cima)
        bg = s.bg ?? "dark";
        const ims = s.gal, n = ims.length, cT = s.counter?.t ?? null;
        const tEnd = cT != null ? cT + 0.1 : t1 - 0.4;
        const step = Math.max(0.14, (tEnd - t0 - 0.2) / n);
        const spots = [[-220, -30, -7], [200, 40, 6], [-40, -80, 3], [240, -70, -4], [-260, 70, 5], [110, 90, -3], [-10, 10, 2], [170, -30, -6], [-190, -60, 4], [60, -20, -2]];
        const mw = V ? 900 : 1000, mh = V ? 900 : 700;
        inner = `<div class="spot"></div><div id="${id}pile" class="layer">` + ims.map((m, k) => {
          const [w, h] = fitBox(m, mw, mh), [dx, dy] = spots[k % spots.length];
          return `<div id="${id}f${k}" class="photo" style="left:${f2((W - w) / 2 + dx * K)}px;top:${f2((H - h) / 2 + dy * K)}px;width:${w}px;height:${h}px">${mediaEl(m, t0, dur + 0.5)}</div>`;
        }).join("") + `</div>`;
        if (s.label) inner += `<div id="${id}l" class="tag" style="top:${V ? 190 : 70}px"><i></i>${esc(s.label)}</div>`;
        ims.forEach((m, k) => {
          const a = f2(t0 + 0.08 + k * step), rot = spots[k % spots.length][2];
          ft(`#${id}f${k}`, { autoAlpha: 0, x: 320 * K, y: 140 * K, rotation: rot + 9, scale: 1.1, filter: "blur(12px)" }, { autoAlpha: 1, x: 0, y: 0, rotation: rot, scale: 1, filter: "blur(0px)", duration: 0.3, ease: "power3.out" }, a);
          if (k > 0) ft(`#${id}f${k - 1}`, { scale: 1 }, { scale: 0.96, duration: 0.3, ease: "power2.out" }, a);
          if (k < 4) snd(k === 0 ? "whoosh-short" : "click-soft", a + 0.03, k === 0 ? 0.24 : 0.16, k === 0 ? 2 : 1);
        });
        ft(`#${id}pile`, { scale: 1 }, { scale: 1.06, duration: dur, ease: "none" }, t0);
        if (s.label) ft(`#${id}l`, { autoAlpha: 0, y: 16, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.35, ease: "power3.out" }, t0 + 0.3);
        if (s.counter) {
          const cn = s.counter, v = +cn.value, a0 = +(cn.from ?? 0), dec = cn.decimals ?? 0;
          const fmt = (x) => Number(x).toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
          const lw = String(cn.label || "").split(/\s+/).filter(Boolean), chl = new Set((cn.hl || []).map(norm));
          const tone = cn.tone === "bad" ? "#ef4444" : cn.tone === "good" ? "#22c55e" : null;
          inner += `<div class="numWrap"><div id="${id}n" class="num">${esc(cn.prefix || "")}<span id="${id}v">${fmt(a0)}</span>${esc(cn.suffix || "")}</div><div class="numLabel">${wordsHtml(id, lw, chl)}</div></div>`;
          const cd = cn.dur ?? 0.95, tc = cT + 0.1, tEndC = f2(tc + cd);
          ft(`#${id}pile`, { filter: "blur(0px)", opacity: 1 }, { filter: "blur(18px)", opacity: 0.22, duration: 0.45, ease: "power2.out" }, cT);
          if (s.label) ft(`#${id}l`, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2 }, cT);
          ft(`#${id}n`, { autoAlpha: 0, scale: 0.86, filter: "blur(12px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.4, ease: "power3.out" }, cT + 0.02);
          countTo(`${id}v`, a0, v, cd, tc, "power2.out", dec);
          ft(`#${id}n`, { y: 0 }, { y: -6, duration: cd, ease: "power3.out" }, tc);
          cascade(id, lw, lw.map((_, k) => f2(tc + 0.4 + k * 0.08)), chl, "#a3a3a3", "#4ade80");
          if (tone) { // bate no valor final e muda de cor (vermelho = caro/errado, verde = certo)
            ft(`#${id}n`, { color: "#ffffff", textShadow: "0 0 0px rgba(0,0,0,0)" }, { color: tone, textShadow: `0 0 46px ${tone}88`, duration: 0.22, ease: "power2.out" }, tEndC - 0.05);
            ft(`#${id}n`, { scale: 1 }, { scale: 1.08, duration: 0.09, yoyo: true, repeat: 1, ease: "power2.out" }, tEndC - 0.05);
            ft(c, { x: 0 }, { x: 6, duration: 0.04, yoyo: true, repeat: 5, ease: "none" }, tEndC);
            set(c, { x: 0 }, tEndC + 0.3);
            snd(cn.tone === "bad" ? "impact-bass-1" : "ping", tEndC - 0.02, cn.tone === "bad" ? 0.3 : 0.2, 3);
          } else { ft(`#${id}n`, { textShadow: "0 0 0px rgba(34,197,94,0)" }, { textShadow: "0 0 36px rgba(34,197,94,.45)", duration: 0.5 }, tEndC - 0.1); snd("ping", tEndC, 0.18, 2); }
        }
        caps = "dark";
        break;
      }
      case "hud": { // card com número sobre o rosto (continuação do contador) + troca de valor/cor + logo
        bg = "none";
        const v = +s.value, dec = s.decimals ?? 0;
        const fmt = (x) => Number(x).toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
        const col = (t) => (t === "bad" ? "#ef4444" : t === "good" ? "#22c55e" : "#fafafa");
        const right = String(s.pos ?? "bl").endsWith("r"), mg = V ? 70 : 120, top = V ? 1040 : H - 120 - 190;
        inner = `<div id="${id}row" class="hudRow" style="${right ? "right" : "left"}:${mg}px;top:${top}px">
          <div id="${id}card" class="hudCard"><div id="${id}k" class="hudK">${esc(s.label || "")}</div><div id="${id}n" class="hudN" style="color:${col(s.tone)}">${esc(s.prefix || "")}<span id="${id}v">${fmt(v)}</span>${esc(s.suffix || "")}</div></div>
          ${s.logo ? `<div id="${id}logo" class="hudLogo">${s.logo.media ? `<img src="assets/media/${s.logo.media.file}" alt="" />` : ""}${s.logo.text ? `<b>${esc(s.logo.text)}</b>` : ""}</div>` : ""}</div>`;
        const cardCx = right ? W - mg - 220 : mg + 220, fromX = W / 2 - cardCx, fromY = (V ? 740 : 400) - (top + 100);
        if (s.prevAdj) ft(`#${id}card`, { autoAlpha: 0, x: fromX, y: fromY, scale: 2.2, filter: "blur(10px)" }, { autoAlpha: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)", duration: 0.55, ease: "power3.inOut" }, t0);
        else ft(`#${id}card`, { autoAlpha: 0, y: 30, scale: 0.9, filter: "blur(10px)" }, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.4, ease: "power3.out" }, t0);
        snd("whoosh-short", t0 + 0.05, 0.22, 2);
        if (s.then) {
          const a = s.then.t, v2 = +s.then.value;
          countTo(`${id}v`, v, v2, 0.45, a, "power3.in", dec);
          ft(`#${id}n`, { color: col(s.tone) }, { color: col(s.then.tone), duration: 0.3, ease: "power2.out" }, a + 0.3);
          if (s.then.tone === "good") ft(`#${id}n`, { textShadow: "0 0 0px rgba(34,197,94,0)" }, { textShadow: "0 0 30px rgba(34,197,94,.55)", duration: 0.3 }, a + 0.4);
          ft(`#${id}card`, { scale: 1 }, { scale: 1.07, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" }, a + 0.4);
          if (s.then.label != null) {
            ft(`#${id}k`, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -8, duration: 0.15 }, a + 0.2);
            set(`#${id}k`, { textContent: s.then.label }, a + 0.36);
            ft(`#${id}k`, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.2 }, a + 0.37);
          }
          snd("pop", a + 0.42, 0.26, 3);
        }
        if (s.logo) {
          ft(`#${id}logo`, { autoAlpha: 0, scale: 0.5, x: -30, filter: "blur(8px)" }, { autoAlpha: 1, scale: 1, x: 0, filter: "blur(0px)", duration: 0.42, ease: "back.out(2)" }, s.logo.t);
          snd("click", s.logo.t + 0.06, 0.22, 3);
        }
        caps = "dark";
        break;
      }
      case "clones": { // o rosto se multiplica: zoom-out contínuo por grades NxN (cada nível entra em scale 2 = o nível anterior)
        bg = "black";
        const lv = s.tiles, hold = s.hold ?? 0.45, step = Math.max(0.18, (dur - hold) / lv.length);
        inner = lv.map((m, k) => `<div id="${id}l${k}" class="layer" style="transform-origin:50% 50%;opacity:0;visibility:hidden">${mediaEl(m, t0 - s.tileLead, dur + 0.8)}</div>`).join("");
        lv.forEach((m, k) => { // grades ímpares (3, 9, 27…): o tile central em scale N/N_anterior é exatamente o nível anterior → zoom-out contínuo com o rosto no centro
          const a = f2(t0 + k * step), fac = m.tile / (k ? lv[k - 1].tile : 1);
          set(`#${id}l${k}`, { autoAlpha: 1 }, a);
          ft(`#${id}l${k}`, { scale: fac }, { scale: 1, duration: f2(step), ease: "power2.inOut" }, a);
          if (k > 0) { // o nível anterior (nítido) fica por cima encolhendo em sincronia = tile central; some quando chega ao tamanho
            js.push(`tl.set(${J(`#${id}l${k - 1}`)},{zIndex:2},${at(a)});`);
            ft(`#${id}l${k - 1}`, { scale: 1 }, { scale: f2(1 / fac), duration: f2(step), ease: "power2.inOut" }, a);
            set(`#${id}l${k - 1}`, { autoAlpha: 0 }, a + step);
          }
          snd(k === 0 ? "whoosh-short" : "click", a + 0.02, k < 3 ? 0.22 : 0.14, k < 2 ? 3 : 1);
        });
        const last = f2(t0 + lv.length * step);
        ft(`#${id}l${lv.length - 1}`, { scale: 1 }, { scale: 1.04, duration: f2(Math.max(0.2, t1 - last + 0.1)), ease: "none" }, last);
        caps = "dark";
        break;
      }
      case "grid": { // cards em grade (thumbs, sequência de fotos); item com "bad" vira vermelho com ✕
        bg = s.bg ?? "dark";
        const its = s.items, n = its.length, cols = s.cols ?? (n <= 4 ? n : n <= 6 ? 3 : 4), rows = Math.ceil(n / cols);
        const [rw, rh] = String(s.ratio ?? "16:9").split(":").map(Number), ar = rw / rh;
        const gap = V ? 20 : 26, maxW = V ? W - 120 : W - 170, maxH = V ? H - 560 : H - 200;
        let cw = (maxW - gap * (cols - 1)) / cols, ch = cw / ar;
        if (ch * rows + gap * (rows - 1) > maxH) { ch = (maxH - gap * (rows - 1)) / rows; cw = ch * ar; }
        const gw = cols * cw + gap * (cols - 1), gh = rows * ch + gap * (rows - 1), x0 = (W - gw) / 2, y0 = (H - gh) / 2 + (s.label ? 26 : 0);
        const slotPos = (k) => { const r = Math.floor(k / cols), cc = k % cols, inRow = Math.min(cols, n - r * cols), off = ((cols - inRow) * (cw + gap)) / 2; return `left:${f2(x0 + off + cc * (cw + gap))}px;top:${f2(y0 + r * (ch + gap))}px;width:${f2(cw)}px;height:${f2(ch)}px`; };
        inner = `<div class="spot"></div><div class="persp"><div id="${id}g" class="layer">` + its.map((it, k) => `<div class="gslot" style="${slotPos(k)}"></div>`).join("") + its.map((it, k) =>
          `<div id="${id}c${k}" class="gcard${it.media ? "" : " gph"}" style="${slotPos(k)}">${it.media ? mediaEl(it.media, it.t - 0.2, t1 - it.t + 0.6) : `<i>${ICONS.user}</i>`}${it.label ? `<div class="tag in">${esc(it.label)}</div>` : ""}<div id="${id}x${k}" class="gbad"><i>${ICONS.x}</i>${it.badText ? `<u>${esc(it.badText)}</u>` : ""}</div></div>`
        ).join("") + `</div></div>`;
        if (s.label) inner += `<div id="${id}l" class="tag" style="top:${V ? 190 : 70}px"><i></i>${esc(s.label)}</div>`;
        its.forEach((it, k) => {
          ft(`#${id}c${k}`, { autoAlpha: 0, y: 90, scale: 0.92, filter: "blur(10px)" }, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.36, ease: "power3.out" }, it.t);
          snd("click-soft", it.t + 0.04, 0.16, k < 3 ? 2 : 1);
          if (it.badT != null) {
            ft(`#${id}x${k}`, { autoAlpha: 0, yPercent: 100 }, { autoAlpha: 1, yPercent: 0, duration: 0.3, ease: "power2.out" }, it.badT);
            if (it.media) ft(`#${id}c${k} video, #${id}c${k} img`, { filter: "grayscale(0)" }, { filter: "grayscale(1)", duration: 0.3 }, it.badT);
            ft(`#${id}x${k} i`, { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(2)" }, it.badT + 0.15);
            ft(`#${id}c${k}`, { x: 0 }, { x: 6, duration: 0.04, yoyo: true, repeat: 5, ease: "none" }, it.badT + 0.1);
            set(`#${id}c${k}`, { x: 0 }, it.badT + 0.4);
            snd("impact-bass-1", it.badT + 0.1, 0.22, 3);
          }
        });
        ft(`#${id}g`, { rotationX: 10, y: 40 }, { rotationX: 0, y: 0, duration: 1.0, ease: "power3.out" }, t0);
        ft(`#${id}g`, { scale: 1 }, { scale: 1.06, duration: dur, ease: "none" }, t0);
        if (s.label) ft(`#${id}l`, { autoAlpha: 0, y: 16, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.35, ease: "power3.out" }, t0 + 0.2);
        caps = bg === "dark" ? "dark" : "light";
        break;
      }
      case "split": { // rosto (ao vivo) de um lado + editor com prompt digitando sem parar; erros em vermelho
        bg = s.bg ?? "dark";
        const ph = V ? 760 : 840, pw = V ? W - 140 : 880, pt = V ? 180 : (H - ph) / 2, pl = V ? 70 : 80;
        const sc = (ph / 1080) * 1.18, vw = 1920 * sc, vh = 1080 * sc;
        const vx = f2(Math.min(0, Math.max(pw - vw, pw / 2 - faceCx * sc))), vy = f2(Math.min(0, Math.max(ph - vh, ph / 2 - 0.42 * vh)));
        const edL = V ? 70 : pl + pw + 40, edT = V ? pt + ph + 40 : pt, edW = V ? W - 140 : W - edL - 80, edH = V ? 620 : ph;
        const lines = s.prompt?.length ? s.prompt : ["retrato profissional, mesmo rosto da referência,", "iluminação de estúdio, lente 85mm, pele realista,", "manter identidade, expressão confiante, 8k, ultra detalhado,"];
        const cps = s.cps ?? 30; let full = ""; for (let k = 0; full.length < (dur + 0.5) * cps; k++) full += lines[k % lines.length] + "\n";
        const ms = at(Math.max(0, t0 - 0.3));
        inner = `<div id="${id}face" class="splitFace" style="left:${pl}px;top:${pt}px;width:${pw}px;height:${ph}px"><video id="${id}fv" class="clip" src="assets/media/edit.mp4" muted playsinline data-start="${ms}" data-duration="${f2(dur + 0.6)}" data-media-start="${ms}" data-track-index="${nextTrack()}" style="position:absolute;left:${vx}px;top:${vy}px;width:${f2(vw)}px;height:${f2(vh)}px"></video></div>
          <div id="${id}ed" class="editor" style="left:${edL}px;top:${edT}px;width:${f2(edW)}px;height:${edH}px"><div class="edBar"><i></i><i></i><i></i><u>${esc(s.file ?? "prompt.txt")}</u></div><pre id="${id}tx" class="edTx"></pre><div id="${id}err" class="edErr"><i>${ICONS.x}</i><span>${esc(s.error ?? "Rosto não corresponde à referência")}</span></div></div>`;
        ft(`#${id}face`, { autoAlpha: 0, x: -60, filter: "blur(10px)" }, { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 0.4, ease: "power3.out" }, t0 + 0.05);
        ft(`#${id}ed`, { autoAlpha: 0, x: 80, filter: "blur(10px)" }, { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 0.4, ease: "power3.out" }, t0 + 0.12);
        ft(`#${id}fv`, { scale: 1 }, { scale: 1.06, duration: dur, ease: "none" }, t0);
        const tt = t0 + 0.35, rows = s.rows ?? (V ? 9 : 13);
        js.push(`(()=>{const el=document.getElementById("${id}tx");const s=${J(full)};const o={n:0};tl.fromTo(o,{n:0},{n:s.length,duration:${f2(dur + 0.3)},ease:"none",immediateRender:false,onUpdate:()=>{const t=s.slice(0,Math.round(o.n));const ls=t.split("\\n");el.textContent=ls.slice(-${rows}).join("\\n")+"|";}},${at(tt)});})();`);
        for (let q = 0; q < Math.floor(dur / 0.8); q++) snd("key-press", tt + 0.1 + q * 0.8, 0.14, 1);
        const shN = "0 0 0 1px rgba(255,255,255,.08), 0 60px 120px -30px rgba(0,0,0,.85)", shR = "0 0 0 3px #ef4444, 0 0 60px rgba(239,68,68,.35), 0 60px 120px -30px rgba(0,0,0,.85)";
        const errs = (s.errT || []).filter((e) => e != null);
        errs.forEach((e, q) => {
          const hideAt = errs[q + 1] != null ? Math.min(e + 1.4, errs[q + 1] - 0.3) : t1 - 0.4;
          ft(`#${id}err`, { autoAlpha: 0, y: 24, scale: 0.9, filter: "blur(6px)" }, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.26, ease: "back.out(2)" }, e);
          ft(`#${id}ed`, { boxShadow: shN }, { boxShadow: shR, duration: 0.12 }, e);
          ft(`#${id}ed`, { x: 0 }, { x: 7, duration: 0.04, yoyo: true, repeat: 5, ease: "none" }, e + 0.02);
          set(`#${id}ed`, { x: 0 }, e + 0.3);
          if (hideAt > e + 0.5) { ft(`#${id}err`, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2 }, hideAt); ft(`#${id}ed`, { boxShadow: shR }, { boxShadow: shN, duration: 0.3 }, hideAt); }
          snd("impact-bass-1", e, 0.24, 3);
        });
        caps = V ? "hide" : "dark";
        break;
      }
      case "compare": { // texto (prompt) de um lado ≠ fotos do outro
        bg = s.bg ?? "light";
        const L = s.left || {}, lines = L.lines || [], ims = s.rImgs;
        const lineH = Math.round(px(42) * 1.3 + px(8) * 2 + 1);
        const cardW = V ? W - 140 : 680, cardH = V ? 600 : Math.max(360, px(44) * 2 + px(28) + px(30) + lines.length * lineH), cL = V ? 70 : 150, cT = V ? 240 : (H - cardH) / 2;
        const ph = V ? 520 : 560, pw = Math.round(ph * 0.75);
        const fanCx = V ? W / 2 : W * 0.75, fanCy = V ? 1290 : H / 2;
        const rots = [-10, 0, 10], offs = [-230, 0, 230];
        const fanL = fanCx - pw / 2 - 230 * K;
        inner = `<div id="${id}lc" class="cmpCard" style="left:${cL}px;top:${f2(cT)}px;width:${cardW}px;height:${cardH}px"><div class="cmpT">${esc(L.title || "Prompt")}</div>${lines.map((l, k) => `<div class="cl" id="${id}l${k}">${esc(l)}</div>`).join("")}</div>
          <div class="cmpT" id="${id}rt" style="position:absolute;left:${f2(fanCx - 300)}px;width:600px;text-align:center;top:${f2(fanCy - ph / 2 - 70)}px;opacity:0">${esc(s.right?.title || "")}</div>
          <div id="${id}fan" class="layer">${ims.map((m, k) => `<div id="${id}p${k}" class="fanPhoto" style="left:${f2(fanCx - pw / 2 + offs[k % 3] * K)}px;top:${f2(fanCy - ph / 2)}px;width:${pw}px;height:${ph}px">${mediaEl(m, t0, dur + 0.5)}</div>`).join("")}</div>
          <div id="${id}vs" class="vs" style="left:${f2(V ? W / 2 - 75 : cL + cardW + (fanL - (cL + cardW)) / 2 - 75)}px;top:${f2(V ? 900 : H / 2 - 75)}px">≠</div>`;
        ft(`#${id}lc`, { autoAlpha: 0, x: -50, filter: "blur(10px)" }, { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 0.4, ease: "power3.out" }, t0 + 0.04);
        lines.forEach((_, k) => ft(`#${id}l${k}`, { autoAlpha: 0, x: 20, filter: "blur(6px)" }, { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 0.22, ease: "power2.out" }, t0 + 0.2 + k * 0.08));
        ims.forEach((_, k) => ft(`#${id}p${k}`, { autoAlpha: 0, y: 80, rotation: rots[k % 3] + 6, scale: 0.9, filter: "blur(10px)" }, { autoAlpha: 1, y: 0, rotation: rots[k % 3], scale: 1, filter: "blur(0px)", duration: 0.4, ease: "power3.out" }, t0 + 0.3 + k * 0.14));
        ft(`#${id}rt`, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.3 }, t0 + 0.7);
        const vT = s.vsT ?? t0 + 1.2, gT = s.goodT ?? vT + 0.5;
        ft(`#${id}vs`, { autoAlpha: 0, scale: 0.3, filter: "blur(8px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.35, ease: "back.out(2.2)" }, vT);
        ft(`#${id}lc`, { filter: "grayscale(0) blur(0px)", opacity: 1 }, { filter: "grayscale(1) blur(1.5px)", opacity: 0.45, duration: 0.4 }, vT + 0.1);
        snd("pop", vT + 0.04, 0.24, 3);
        ims.forEach((_, k) => ft(`#${id}p${k}`, { boxShadow: "0 0 0 0px rgba(34,197,94,0), 0 50px 100px -30px rgba(0,0,0,.4)" }, { boxShadow: "0 0 0 5px #22c55e, 0 50px 100px -30px rgba(0,0,0,.4)", duration: 0.2 }, gT + k * 0.12));
        snd("click-soft", gT, 0.2, 2);
        ft(`#${id}fan`, { scale: 1 }, { scale: 1.05, duration: dur, ease: "none" }, t0);
        caps = bg === "dark" ? "dark" : "light";
        break;
      }
      case "ytcta": { // barra like / inscrever / sino sobre o rosto, com cursor clicando na palavra
        bg = "none";
        const bw = [240, 330, 104], gap = 16, tot = bw[0] + bw[1] + bw[2] + 2 * gap, bx = (W - tot) / 2, by = V ? 1500 : H - 170;
        inner = `<div id="${id}bar" class="ytBar" style="left:${f2(bx)}px;top:${by}px;width:${tot}px">
          <div id="${id}b0" class="ytBtn" style="width:${bw[0]}px"><i>${ICONS.thumb}</i><b>${esc(s.likeText ?? "Gostei")}</b></div>
          <div id="${id}b1" class="ytSub" style="width:${bw[1]}px"><span id="${id}subt">${esc(s.subText ?? "Inscrever-se")}</span></div>
          <div id="${id}b2" class="ytBtn" style="width:${bw[2]}px"><i>${ICONS.bell}</i></div></div>
          <div id="${id}cur" class="cursor">${ICONS.cursor}</div>`;
        ft(`#${id}bar`, { autoAlpha: 0, y: 40, scale: 0.94, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.4, ease: "power3.out" }, t0 + 0.02);
        const cx = [bx + bw[0] / 2, bx + bw[0] + gap + bw[1] / 2, bx + bw[0] + gap + bw[1] + gap + bw[2] / 2], cy = by + 44;
        const steps = [["likeT", 0], ["subT", 1], ["bellT", 2]].filter(([k]) => s[k] != null).map(([k, i]) => [s[k], i]).sort((a, b) => a[0] - b[0]);
        const start = [W / 2 + 300, by + 170];
        set(`#${id}cur`, { x: start[0], y: start[1] }, 0);
        if (steps.length) ft(`#${id}cur`, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, Math.max(t0 + 0.2, steps[0][0] - 0.5));
        steps.forEach(([tc, i], q) => {
          const from = q === 0 ? start : [cx[steps[q - 1][1]] + 12, cy + 14];
          ft(`#${id}cur`, { x: from[0], y: from[1] }, { x: cx[i] + 12, y: cy + 14, duration: 0.35, ease: "power2.inOut" }, tc - 0.38);
          ft(`#${id}b${i}`, { scale: 1 }, { scale: 0.9, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out" }, tc);
          set(`#${id}b${i}`, { attr: { "data-on": "1" } }, tc + 0.08);
          if (i === 1) set(`#${id}subt`, { textContent: s.subDone ?? "Inscrito" }, tc + 0.08);
          if (i === 2) ft(`#${id}b2 i`, { rotation: 0 }, { rotation: 18, duration: 0.07, yoyo: true, repeat: 5, ease: "sine.inOut" }, tc + 0.1);
          snd(i === 2 ? "ping" : "click", tc + 0.02, 0.24, 3);
        });
        ft(`#${id}cur`, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2 }, t1 - 0.4);
        caps = "dark";
        break;
      }
    }
    used.bgs[bg] = (used.bgs[bg] || 0) + dur;
    sceneHtml += `
      <div id="${id}" class="layer scene" style="opacity:0;visibility:hidden"><div id="${id}m" class="layer bg-${bg}"><div id="${id}p" class="layer"><div id="${id}c" class="layer">${inner}</div></div>${extra}</div></div>`;
    // transições
    const toCta = spec.cta && t1 >= endVoice - 0.05;
    if (overlay) { // sobre o rosto: entra seco, sai com blur; a cena anterior (se colada) some na hora e o rosto recebe o blur-cut
      set(o, { autoAlpha: 1 }, t0); used.transitions.push("cut");
      if (s.prevAdj) { set(`#S${i - 1}`, { autoAlpha: 0 }, t0); ft("#baseM", { filter: "blur(12px)", scale: 1.035 }, { filter: "blur(0px)", scale: 1, duration: 0.16, ease: "power2.out" }, t0); set("#baseM", { filter: "none" }, t0 + 0.17); }
      if (toCta) set(o, { autoAlpha: 0 }, t1 + 0.6);
      else if (!s.next) { ft(c, { filter: "blur(0px)", opacity: 1 }, { filter: "blur(10px)", opacity: 0, duration: 0.22, ease: "power2.in" }, t1 - 0.22); set(o, { autoAlpha: 0 }, t1); used.transitions.push("cut"); }
      else set(o, { autoAlpha: 0 }, t1);
    } else {
      if (!s.prevAdj) { trIn(s.in, o, m, t0, below); used.transitions.push(s.in); }
      else { const d = trIn(s.in, o, m, t0, below); used.transitions.push(s.in); set(`#S${i - 1}`, { autoAlpha: 0 }, t0 + Math.max(0.45, d + 0.1)); }
      if (toCta) set(o, { autoAlpha: 0 }, t1 + 0.6);
      else if (!s.next) { trOut(s.out, o, m, p, t1, "#baseM"); used.transitions.push(s.out); }
    }
    capsState(caps, s.prevAdj ? t0 : t0 - 0.02);
    if (!s.next && !toCta) capsState(screenAt(t1) ? "light" : "dark", t1);
  });

  // ── CTA ─────────────────────────────────────────────────────────────────────
  const cta = spec.cta;
  let ctaHtml = "";
  if (cta) {
    const C = endVoice;
    const tws = String(cta.title ?? "Assista o vídeo completo no meu canal").split(/\s+/);
    const chl = new Set((cta.hl || []).map(norm));
    ctaHtml = `
      <div id="cta" class="layer" style="opacity:0;visibility:hidden"><div id="ctam" class="layer bg-light"><div id="ctac" class="layer">
        <img id="ctaIcon" src="assets/brand/logo-icone.png" alt="" />
        <div id="ctaKicker">${esc(cta.kicker ?? "Vídeo completo")}</div>
        <div id="ctaHead">${wordsHtml("ct", tws, chl)}</div>
        ${cta.image ? `<div class="persp"><div id="ctaCard"><img src="assets/media/${cta.image}" alt="" /><div id="play">${ICONS.play}</div></div></div>` : ""}
        <div id="bio">${ICONS.up}${esc(cta.pill ?? "Link na bio")}</div>
      </div></div></div>`;
    const inK = cta.in ?? (portfolio ? "blur" : "curtain");
    const lastScene = scenes.at(-1);
    trIn(inK, "#cta", "#ctam", C, lastScene && lastScene.t1 >= C - 0.05 ? `#S${scenes.length - 1}m` : "#baseM");
    used.transitions.push(inK);
    capsState("hide", C);
    ft("#ctaIcon", { autoAlpha: 0, scale: 0.6, filter: "blur(8px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.45, ease: "back.out(2)" }, C + 0.2);
    ft("#ctaKicker", { autoAlpha: 0, y: 12, filter: "blur(6px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.35, ease: "power3.out" }, C + 0.3);
    cascade("ct", tws, tws.map((_, k) => f2(C + 0.4 + k * 0.08)), chl, "#171717", "#16a34a");
    if (cta.image) {
      ft("#ctaCard", { autoAlpha: 0, scale: 0.4, rotationX: 24, rotationY: -24, rotationZ: -10, y: 260, filter: "blur(6px)" }, { autoAlpha: 1, scale: 1, rotationX: 4, rotationY: -6, rotationZ: 0, y: 0, filter: "blur(0px)", duration: 1.0, ease: "power3.out" }, C + 0.55);
      ft("#ctaCard", { rotationY: -6, rotationX: 4 }, { rotationY: 3, rotationX: 1, duration: 3.2, ease: "sine.inOut" }, C + 1.55);
      ft("#play", { scale: 0 }, { scale: 1, duration: 0.4, ease: "back.out(2.4)" }, C + 1.2);
    }
    ft("#bio", { autoAlpha: 0, y: 30, scale: 0.9, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.4, ease: "back.out(1.8)" }, C + 1.35);
    snd("pop", C + 1.38, 0.22, 2);
  }

  // ── SFX: limitador de densidade (máx. N audíveis por 10 s; 2 empilhados; silêncio em "hush") ──
  const maxPer10 = spec.sfxMax ?? (spec.sfx === "off" ? 0 : spec.sfx === "low" ? 3 : portfolio && !plan.voice ? 8 : V ? 6 : 3);
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
    return `<audio id="sfx${i}" src="assets/sfx/${x.name}.mp3" data-start="${st}" data-duration="${f2(Math.min(SND[x.name][1], total - st))}" data-track-index="${4 + (i % 3)}" data-volume="${x.vol}"></audio>`;
  }).join("\n      ");
  const music = spec.music ? `<audio id="music" src="assets/media/${esc(spec.music.file ?? spec.music)}" data-start="0" data-duration="${total}" data-track-index="8" data-volume="${spec.music.volume ?? (endVoice ? 0.08 : 0.5)}"></audio>` : "";

  // ── CSS ─────────────────────────────────────────────────────────────────────
  const capTop = V ? 1330 : 910, capFs = V ? 58 : 44;
  const css = `
      :root { --g: #22c55e; --g4: #4ade80; --g6: #16a34a; --g9: #052e16; --n50: #fafafa; --n100: #f5f5f5; --n200: #e5e5e5; --n400: #a3a3a3; --n900: #171717; --n950: #0a0a0a; --font: "Brand", "Jakarta", system-ui, sans-serif; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: var(--n950); }
      #stage { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: var(--n950); font-family: var(--font); color: var(--n50); }
      .layer { position: absolute; inset: 0; }
      .bg-light { background: radial-gradient(${V ? "1100px 900px" : "1600px 900px"} at 50% 30%, #ffffff 0%, #f6f6f7 55%, #ececee 100%); }
      .bg-dark { background: radial-gradient(${V ? "900px 900px" : "1300px 800px"} at 50% 42%, #18181b 0%, #0b0b0f 60%, #070708 100%); }
      .bg-green { background: linear-gradient(135deg, #2bd469 0%, #22c55e 40%, #15803d 100%); }
      .bg-black { background: #050505; }
      .spot { position: absolute; left: 50%; top: 46%; width: ${V ? 1100 : 1400}px; height: ${V ? 1100 : 900}px; margin: ${V ? "-550px 0 0 -550px" : "-450px 0 0 -700px"}; background: radial-gradient(closest-side, rgba(255,255,255,.07), transparent); }
      #faceCam { overflow: hidden; }
      #facePunch, #facePush { position: absolute; inset: 0; transform-origin: ${faceOrigin}; }
      #facePan { position: absolute; left: 0; top: 0; width: ${f2(vidW)}px; height: ${f2(vidH)}px; }
      #facePan video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #faceShade { background: linear-gradient(to top, rgba(0,0,0,${capMode === "none" ? ".18" : ".5"}) 0%, rgba(0,0,0,.12) 24%, transparent 40%); }
      .shadeB { background: linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,.12) 26%, transparent 42%); }
      .kb { overflow: hidden; }
      .persp { position: absolute; inset: 0; perspective: 1500px; }
      .uicard { position: absolute; border-radius: ${V ? 28 : 24}px; overflow: hidden; background: #111; box-shadow: 0 0 0 1px rgba(0,0,0,.06), 0 40px 90px -20px rgba(0,0,0,.28), 0 18px 40px -18px rgba(0,0,0,.18); }
      .dashInner { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
      .bubble { position: absolute; border-radius: 50%; overflow: hidden; background: #111; box-shadow: 0 0 0 6px #fff, 0 30px 60px -20px rgba(0,0,0,.35); }
      .tag { position: absolute; left: 0; right: 0; margin: 0 auto; width: fit-content; display: flex; align-items: center; gap: 12px; padding: ${px(14)}px ${px(26)}px ${px(14)}px ${px(20)}px; border-radius: 999px; background: rgba(255,255,255,.96); color: var(--n900); font: 600 ${px(30)}px/1 var(--font); letter-spacing: -.01em; box-shadow: 0 16px 40px -14px rgba(0,0,0,.35); opacity: 0; }
      .tag i { width: 12px; height: 12px; border-radius: 50%; background: var(--g); box-shadow: 0 0 0 5px rgba(34,197,94,.18); }
      .tag.in { position: absolute; left: 24px; right: auto; bottom: 24px; top: auto; margin: 0; opacity: 1; }
      .bridge, .iconLine { position: absolute; left: ${V ? 90 : 220}px; right: ${V ? 90 : 220}px; top: 0; bottom: ${V ? 260 : 60}px; display: flex; flex-wrap: wrap; align-content: center; justify-content: center; gap: 0 ${px(26)}px; text-align: center; font: 600 ${px(104)}px/1.08 var(--font); letter-spacing: -.02em; }
      .bridge.long { font-size: ${px(84)}px; }
      .bg-light .bridge, .bg-light .iconLine, .bg-light .sel, .bg-light .cw { color: var(--n900); }
      .cw { display: inline-block; opacity: 0; }
      .cw.hl { font-weight: 700; }
      .bg-light .cw.hl { color: var(--g6); } .bg-dark .cw.hl { color: var(--g4); } .bg-green .cw.hl { color: var(--g9); }
      .bg-green .bridge { color: #fff; }
      .sub { flex-basis: 100%; margin-top: ${px(34)}px; font: 500 ${px(40)}px/1.2 var(--font); color: var(--n400); letter-spacing: -.01em; opacity: 0; }
      .ticker { position: absolute; left: 0; top: ${V ? 780 : 400}px; white-space: nowrap; font-weight: 600; line-height: 1.1; letter-spacing: -.025em; color: #fff; display: flex; gap: 0 .27em; }
      .ticker .cw.hl { color: var(--g9); }
      .numWrap { position: absolute; left: 0; right: 0; top: ${V ? 640 : 300}px; text-align: center; }
      .num { display: inline-block; font: 600 ${px(V ? 260 : 250)}px/1 var(--font); letter-spacing: -.04em; color: #fff; opacity: 0; font-variant-numeric: tabular-nums; }
      .numLabel { margin-top: ${px(36)}px; font: 500 ${px(56)}px/1.15 var(--font); color: var(--n400); letter-spacing: -.01em; padding: 0 90px; }
      .kpi { position: absolute; border-radius: 30px; background: #141417; box-shadow: inset 0 0 0 1px rgba(255,255,255,.07), 0 30px 60px -30px rgba(0,0,0,.6); display: flex; flex-direction: column; justify-content: center; padding: 0 48px; opacity: 0; }
      .kv { font: 600 ${px(118)}px/1 var(--font); color: #fff; letter-spacing: -.03em; } .kl { margin-top: 14px; font: 500 ${px(34)}px/1.2 var(--font); color: var(--n400); }
      .halo { position: absolute; left: 50%; top: ${V ? 826 : 480}px; width: 420px; height: 420px; margin: -210px 0 0 -210px; border-radius: 50%; background: radial-gradient(closest-side, rgba(34,197,94,.55), rgba(34,197,94,0)); opacity: 0; }
      .search { position: absolute; left: 50%; display: flex; align-items: center; gap: ${px(22)}px; padding: 0 ${px(38)}px; border-radius: 999px; background: #fff; box-shadow: 0 0 0 1.5px #e5e5e5, 0 30px 70px -24px rgba(0,0,0,.22); overflow: hidden; white-space: nowrap; color: var(--n900); font: 500 ${px(50)}px/1 var(--font); letter-spacing: -.015em; opacity: 0; }
      .search i { flex: none; width: ${px(56)}px; height: ${px(56)}px; display: grid; place-items: center; } .search i svg { width: 100%; height: 100%; }
      .caret { flex: none; width: 4px; height: ${px(58)}px; margin-left: -14px; border-radius: 2px; background: var(--g); }
      .selTop, .selBot { position: absolute; left: ${V ? 90 : 240}px; right: ${V ? 90 : 240}px; display: flex; flex-wrap: wrap; justify-content: center; gap: 0 ${px(24)}px; font: 600 ${px(84)}px/1.1 var(--font); letter-spacing: -.02em; color: var(--n900); }
      .selTop { bottom: ${H / 2 + px(80)}px; } .selBot { top: ${H / 2 + px(80)}px; }
      .selMid { position: absolute; left: 0; right: 0; top: ${H / 2 - px(70)}px; height: ${px(140)}px; display: flex; justify-content: center; align-items: center; }
      .selWord { position: relative; display: inline-block; padding: 0 ${px(14)}px; font: 700 ${px(124)}px/1 var(--font); letter-spacing: -.03em; color: var(--n900); opacity: 0; }
      .selWord b { position: relative; font-weight: 700; }
      .selBox { position: absolute; left: 0; right: 0; top: -${px(12)}px; bottom: -${px(16)}px; border-radius: 10px; background: rgba(34,197,94,.24); transform-origin: 0 50%; }
      .hd { position: absolute; top: -${px(26)}px; bottom: -${px(16)}px; width: 5px; border-radius: 3px; background: var(--g); opacity: 0; }
      .hd.l { left: -2px; } .hd.r { right: -2px; }
      .hd::after { content: ""; position: absolute; left: -7px; width: 19px; height: 19px; border-radius: 50%; background: var(--g); }
      .hd.l::after { top: -12px; } .hd.r::after { bottom: -12px; }
      .phone { position: absolute; border-radius: ${V ? 64 : 48}px; padding: 14px; background: #0d0d0f; box-shadow: inset 0 0 0 2px #2a2a2e, 0 60px 120px -30px rgba(0,0,0,.8); opacity: 0; }
      .phone .scr, .browser .scr { position: absolute; overflow: hidden; }
      .phone .scr { inset: 14px; border-radius: ${V ? 50 : 36}px; }
      .browser { position: absolute; border-radius: 22px; overflow: hidden; background: #1a1a1d; box-shadow: inset 0 0 0 1px rgba(255,255,255,.08), 0 60px 120px -30px rgba(0,0,0,.85); opacity: 0; }
      .browser .bar { position: absolute; left: 0; right: 0; top: 0; height: 54px; display: flex; align-items: center; gap: 10px; padding: 0 22px; }
      .browser .bar i { width: 13px; height: 13px; border-radius: 50%; background: #3a3a3f; }
      .browser .bar u { margin-left: 18px; flex: 1; max-width: 50%; height: 30px; border-radius: 999px; background: #2a2a2e; text-decoration: none; font: 500 17px/30px var(--font); color: var(--n400); padding-left: 16px; overflow: hidden; }
      .browser .scr { left: 0; right: 0; top: 54px; bottom: 0; }
      .devLabel { position: absolute; font: 600 ${px(64)}px/1.12 var(--font); letter-spacing: -.02em; color: #fff; opacity: 0; }
      .stackCard { position: absolute; border-radius: ${V ? 30 : 26}px; overflow: hidden; background: #111; box-shadow: 0 0 0 1px rgba(0,0,0,.06), 0 50px 100px -30px rgba(0,0,0,.4); opacity: 0; }
      .swapCard { position: absolute; padding: ${px(40)}px ${px(48)}px; border-radius: 34px; background: #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.05), 0 40px 90px -30px rgba(0,0,0,.25); height: ${px(330)}px; opacity: 0; overflow: hidden; }
      .swT { display: flex; justify-content: space-between; font: 600 ${px(28)}px/1 var(--font); letter-spacing: .04em; color: var(--n400); text-transform: uppercase; }
      .swR { position: absolute; left: ${px(48)}px; right: ${px(48)}px; top: ${px(130)}px; display: flex; align-items: center; gap: ${px(28)}px; font: 600 ${px(66)}px/1.08 var(--font); letter-spacing: -.02em; color: var(--n900); opacity: 0; }
      .swR i { flex: none; width: ${px(76)}px; height: ${px(76)}px; border-radius: 50%; display: grid; place-items: center; background: var(--g); } .swR i svg { width: 56%; height: 56%; }
      .swR.bad i { background: #a3a3a3; } .swR.bad b { color: #737373; font-weight: 600; }
      .slot { position: relative; display: inline-block; width: ${px(132)}px; height: ${px(132)}px; border-radius: ${px(34)}px; background: #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.05), 0 20px 40px -16px rgba(0,0,0,.25); overflow: hidden; vertical-align: middle; opacity: 0; margin: 0 ${px(6)}px; }
      .slot i { position: absolute; inset: 22%; display: grid; place-items: center; opacity: 0; } .slot i svg { width: 100%; height: 100%; }
      .flood { position: absolute; inset: 0; }
      .flood.fr { background: linear-gradient(to top, rgba(220,38,38,.92) 0%, rgba(239,68,68,.85) 45%, rgba(239,68,68,0) 100%); }
      .flood.fg { background: linear-gradient(to top, #15803d 0%, #22c55e 45%, rgba(34,197,94,0) 100%); }
      .bg-none { background: transparent; }
      .photo { position: absolute; border-radius: 18px; overflow: hidden; background: #111; box-shadow: 0 0 0 1px rgba(255,255,255,.06), 0 50px 100px -30px rgba(0,0,0,.7); opacity: 0; }
      .hudRow { position: absolute; display: flex; align-items: flex-end; gap: 18px; }
      .hudCard { padding: ${px(26)}px ${px(40)}px ${px(30)}px; border-radius: 28px; background: rgba(10,10,12,.78); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: inset 0 0 0 1px rgba(255,255,255,.1), 0 30px 70px -30px rgba(0,0,0,.6); opacity: 0; }
      .hudK { font: 500 ${px(28)}px/1 var(--font); color: var(--n400); letter-spacing: .04em; text-transform: uppercase; margin-bottom: ${px(14)}px; white-space: nowrap; }
      .hudN { font: 600 ${px(118)}px/1 var(--font); letter-spacing: -.04em; color: #fff; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .hudLogo { display: flex; align-items: center; gap: 16px; padding: ${px(20)}px ${px(30)}px ${px(20)}px ${px(22)}px; border-radius: 24px; background: #fff; box-shadow: 0 30px 70px -30px rgba(0,0,0,.6); opacity: 0; margin-bottom: ${px(10)}px; }
      .hudLogo img { width: ${px(72)}px; height: ${px(72)}px; border-radius: 18px; display: block; } .hudLogo b { font: 600 ${px(44)}px/1 var(--font); color: var(--n900); letter-spacing: -.02em; white-space: nowrap; }
      .gcard { position: absolute; border-radius: 22px; overflow: hidden; background: #111; box-shadow: 0 0 0 1px rgba(0,0,0,.06), 0 40px 90px -30px rgba(0,0,0,.5); opacity: 0; }
      .gslot { position: absolute; border-radius: 22px; background: rgba(0,0,0,.035); box-shadow: inset 0 0 0 1px rgba(0,0,0,.05); }
      .bg-dark .gslot { background: rgba(255,255,255,.04); box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); }
      .gcard.gph { background: #e9e9ec; display: grid; place-items: center; } .gcard.gph > i { width: 42%; height: 42%; display: grid; place-items: center; } .gcard.gph > i svg { width: 100%; height: 100%; }
      .bg-dark .gcard.gph { background: #1c1c20; }
      .gbad { position: absolute; inset: 0; background: linear-gradient(to top, rgba(220,38,38,.94), rgba(239,68,68,.6)); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; opacity: 0; }
      .gbad i { width: ${px(110)}px; height: ${px(110)}px; border-radius: 50%; background: #fff; display: grid; place-items: center; } .gbad i svg { width: 56%; height: 56%; } .gbad i svg path { stroke: #dc2626; }
      .gbad u { text-decoration: none; font: 600 ${px(36)}px/1 var(--font); color: #fff; letter-spacing: -.01em; }
      .splitFace { position: absolute; border-radius: 28px; overflow: hidden; background: #000; box-shadow: 0 0 0 1px rgba(255,255,255,.06), 0 60px 120px -30px rgba(0,0,0,.8); opacity: 0; }
      .splitFace video { transform-origin: 50% 40%; }
      .editor { position: absolute; border-radius: 28px; overflow: hidden; background: #141417; box-shadow: 0 0 0 1px rgba(255,255,255,.08), 0 60px 120px -30px rgba(0,0,0,.85); opacity: 0; }
      .edBar { position: absolute; left: 0; right: 0; top: 0; height: 60px; display: flex; align-items: center; gap: 10px; padding: 0 24px; background: #1b1b1f; } .edBar i { width: 13px; height: 13px; border-radius: 50%; background: #3a3a3f; } .edBar u { margin-left: 16px; font: 500 20px/1 var(--font); color: var(--n400); text-decoration: none; }
      .edTx { position: absolute; left: 0; right: 0; top: 60px; bottom: 0; padding: 30px 36px; font: 500 ${px(36)}px/1.5 ui-monospace, "SF Mono", Menlo, Consolas, monospace; color: #d4d4d8; white-space: pre-wrap; word-break: break-word; overflow: hidden; }
      .edErr { position: absolute; left: 36px; right: 36px; bottom: 34px; display: flex; align-items: center; gap: 16px; padding: 18px 26px; border-radius: 16px; background: #ef4444; color: #fff; font: 600 ${px(34)}px/1.1 var(--font); opacity: 0; box-shadow: 0 20px 50px -20px rgba(239,68,68,.6); } .edErr i { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,.22); display: grid; place-items: center; flex: none; } .edErr i svg { width: 60%; height: 60%; }
      .cmpCard { position: absolute; border-radius: 30px; background: #fff; padding: ${px(44)}px ${px(52)}px; box-shadow: 0 0 0 1px rgba(0,0,0,.05), 0 40px 90px -30px rgba(0,0,0,.25); opacity: 0; overflow: hidden; }
      .bg-dark .cmpCard { background: #141417; box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); }
      .cmpT { font: 600 ${px(28)}px/1 var(--font); letter-spacing: .06em; text-transform: uppercase; color: var(--n400); margin-bottom: ${px(30)}px; }
      .cl { font: 500 ${px(42)}px/1.3 var(--font); color: var(--n900); letter-spacing: -.01em; opacity: 0; padding: ${px(8)}px 0; border-bottom: 1px solid rgba(0,0,0,.06); }
      .bg-dark .cl { color: #e5e5e5; border-color: rgba(255,255,255,.08); }
      .fanPhoto { position: absolute; border-radius: 24px; overflow: hidden; background: #111; box-shadow: 0 0 0 0px rgba(34,197,94,0), 0 50px 100px -30px rgba(0,0,0,.4); opacity: 0; }
      .vs { position: absolute; width: 150px; height: 150px; border-radius: 50%; background: var(--n900); color: #fff; display: grid; place-items: center; font: 600 ${px(92)}px/1 var(--font); opacity: 0; box-shadow: 0 30px 60px -20px rgba(0,0,0,.5); }
      .ytBar { position: absolute; height: 88px; display: flex; align-items: center; gap: 16px; opacity: 0; }
      .ytBtn { height: 88px; border-radius: 999px; background: rgba(20,20,22,.6); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); box-shadow: inset 0 0 0 1px rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; gap: 14px; color: #fff; font: 600 ${px(34)}px/1 var(--font); }
      .ytBtn i { width: 40px; height: 40px; display: grid; place-items: center; } .ytBtn i svg { width: 100%; height: 100%; }
      .ytBtn[data-on] { background: #fff; color: var(--n900); } .ytBtn[data-on] svg path { fill: var(--n900); stroke: var(--n900); }
      .ytSub { height: 88px; border-radius: 999px; background: #ff0033; display: grid; place-items: center; color: #fff; font: 600 ${px(34)}px/1 var(--font); box-shadow: 0 20px 50px -20px rgba(255,0,51,.6); }
      .ytSub[data-on] { background: rgba(20,20,22,.6); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); box-shadow: inset 0 0 0 1px rgba(255,255,255,.18); }
      .cursor { position: absolute; left: 0; top: 0; width: 46px; height: 46px; opacity: 0; filter: drop-shadow(0 4px 10px rgba(0,0,0,.5)); } .cursor svg { width: 100%; height: 100%; }
      #veil, #white { position: absolute; inset: 0; background: #fff; }
      #caps { position: absolute; left: 0; right: 0; top: ${capTop}px; height: 200px; }
      .cap { position: absolute; left: ${V ? 70 : 260}px; right: ${V ? 70 : 260}px; top: 0; text-align: center; font: 600 ${capFs}px/1.16 var(--font); letter-spacing: -.012em; color: #fff; opacity: 0; visibility: hidden; }
      .w { display: inline-block; position: relative; text-shadow: 0 2px 18px rgba(0,0,0,.5), 0 1px 3px rgba(0,0,0,.35); }
      .w b { position: relative; font-weight: 600; }
      .w.kw b { color: var(--g4); font-weight: 700; }
      .w.mk { text-shadow: none; padding: 0 8px; } .w.mk b { color: var(--n950); font-weight: 700; }
      .mkb { position: absolute; left: 0; right: 0; top: 6%; bottom: 2%; border-radius: 10px; background: var(--g); transform-origin: 0 50%; box-shadow: 0 0 30px rgba(34,197,94,.4); }
      #caps[data-mode="light"] .w { color: var(--n900); text-shadow: none; } #caps[data-mode="light"] .w.kw b { color: var(--g6); }
      #ctaIcon { position: absolute; left: ${W / 2 - 36}px; top: ${V ? 250 : 70}px; width: 72px; height: 72px; opacity: 0; }
      #ctaKicker { position: absolute; left: 0; right: 0; top: ${V ? 360 : 168}px; text-align: center; font: 500 ${px(34)}px/1 var(--font); color: var(--n400); opacity: 0; }
      #ctaHead { position: absolute; left: ${V ? 90 : 300}px; right: ${V ? 90 : 300}px; top: ${V ? 420 : 214}px; display: flex; flex-wrap: wrap; justify-content: center; gap: 0 ${px(22)}px; font: 600 ${px(76)}px/1.1 var(--font); letter-spacing: -.02em; color: var(--n900); }
      #ctaCard { position: absolute; left: ${V ? 70 : 560}px; top: ${V ? 700 : 380}px; width: ${V ? 940 : 800}px; height: ${V ? 529 : 450}px; border-radius: 30px; overflow: hidden; box-shadow: 0 0 0 1px rgba(0,0,0,.06), 0 60px 120px -30px rgba(0,0,0,.4); opacity: 0; }
      #ctaCard img { width: 100%; height: 100%; object-fit: cover; }
      #play { position: absolute; left: 50%; top: 50%; width: 120px; height: 120px; margin: -60px 0 0 -60px; border-radius: 50%; background: rgba(10,10,10,.55); display: grid; place-items: center; box-shadow: 0 0 0 2px rgba(255,255,255,.4); } #play svg { width: 48px; height: 48px; margin-left: 6px; }
      #bio { position: absolute; left: 0; right: 0; top: ${V ? 1320 : 880}px; margin: 0 auto; width: fit-content; display: flex; align-items: center; gap: 14px; padding: ${px(24)}px ${px(40)}px; border-radius: 999px; background: var(--n900); color: var(--n50); font: 600 ${px(44)}px/1 var(--font); white-space: nowrap; opacity: 0; box-shadow: 0 24px 50px -18px rgba(0,0,0,.45); } #bio svg { width: ${px(36)}px; height: ${px(36)}px; }
  `;
  const jakarta = [500, 700].map((w) => `@font-face { font-family: "Jakarta"; font-weight: ${w}; src: url(assets/fonts/plus-jakarta-sans-latin-${w}-normal.woff2) format("woff2"); }
      @font-face { font-family: "Jakarta"; font-weight: ${w}; src: url(assets/fonts/plus-jakarta-sans-latin-ext-${w}-normal.woff2) format("woff2"); unicode-range: U+0100-024F; }`).join("\n      ");
  const brand = plan.brandFont ? [400, 450, 500, 600, 700].map((w) => `@font-face { font-family: "Brand"; font-weight: ${w}; src: url(assets/fonts-marca/articulat-${w}.woff2) format("woff2"); }`).join("\n      ") : "";

  const baseBg = portfolio ? "bg-dark" : "";
  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      ${jakarta}
      ${brand}
      ${css}
    </style>
  </head>
  <body>
    <div id="stage" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
      <svg width="0" height="0" style="position:absolute"><defs>
        <filter id="mbx" x="-30%" y="-5%" width="160%" height="110%" color-interpolation-filters="sRGB"><feGaussianBlur id="mbxg" stdDeviation="0 0" /></filter>
        <filter id="mby" x="-5%" y="-30%" width="110%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur id="mbyg" stdDeviation="0 0" /></filter>
      </defs></svg>
      <div id="base" class="layer"><div id="baseM" class="layer ${baseBg}">
        ${hasFace ? `<div id="faceCam" class="layer"><div id="facePunch"><div id="facePush"><div id="facePan">
          ${faceVideos}
        </div></div></div><div id="faceShade" class="layer"></div></div>` : portfolio ? '<div class="spot"></div>' : ""}
        ${screenHtml}
      </div></div>
      ${sceneHtml}
      ${ctaHtml}
      <div id="caps" data-mode="dark">
        ${capsHtml}
      </div>
      <div id="veil" style="opacity:0;visibility:hidden"></div>
      <div id="white" style="opacity:0;visibility:hidden"></div>
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
  const chapterBg = Object.entries(used.bgs).filter(([k]) => k !== "none").sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return { html, log, used: { ...used, chapterBg } };
}
