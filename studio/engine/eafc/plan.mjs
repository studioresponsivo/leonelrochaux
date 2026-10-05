// Estilo EA FC (canal 2 — modo carreira, referência S2G + Neto EA FC) — resolve o roteiro em cenas com tempo absoluto.
// Entrada ctx: { W, H, tw, endVoice, anchor(v,label,after), span(v,label,after), fail, srcW, srcH, phr }
//   tw = palavras já na timeline [{ t, e, txt }]
import { f2, norm } from "../v2/plan.mjs";
export { f2, norm };

// cenas que cobrem o rosto (full) e sobreposições (overlay — convivem com o rosto e entre si)
const FULL = {
  photo: { in: "zoom", out: "blur", dur: 2.2 },
  crest: { in: "impact", out: "blur", dur: 2.0 },
  score: { in: "whip", out: "blur", dur: 3.0 },
  record: { in: "impact", out: "glitch", dur: 2.6 },
  ladder: { in: "cut", out: "blur", dur: 3.0 },
  fixtures: { in: "whip", out: "blur", dur: 3.4 },
  number: { in: "cut", out: "cut", dur: 2.0 },
  title: { in: "flash", out: "cut", dur: 3.0 },
  montage: { in: "flash", out: "cut" },
  split: { in: "whip", out: "blur", dur: 2.4 },
};
const OVERLAY = { word: { dur: 1.8 }, stamp: { dur: 2.4 }, tweet: { dur: 3.2 }, badge: { dur: 2.0 } };
export const SCENES = [...Object.keys(FULL), ...Object.keys(OVERLAY)];
export const MODS = ["punch", "shake", "lights", "flash", "sfx", "freeze", "letterbox", "flashframe", "ambience"];
export const TRANS_IN = ["none", "cut", "flash", "cutflash", "ink", "glitch", "whip", "whip-left", "whip-right", "whip-up", "whip-down", "zoom", "blur", "impact"];
export const TRANS_OUT = ["none", "cut", "flash", "ink", "glitch", "whip", "whip-left", "whip-right", "whip-up", "whip-down", "zoom", "blur"];
export const TEAMS = {
  leicester: { name: "Leicester City", abbr: "LEI", color: "#0053A0", color2: "#FDBE11", logo: "img/logo-leicester.png" },
  arsenal: { name: "Arsenal", abbr: "ARS", color: "#EF0107", color2: "#9C824A", logo: "img/logo-arsenal.png" },
  "manchester-united": { name: "Manchester United", abbr: "MUN", color: "#DA291C", color2: "#FBE122", logo: "img/logo-manchester-united.png" },
  "aston-villa": { name: "Aston Villa", abbr: "AVL", color: "#670E36", color2: "#95BFE5", logo: "img/logo-aston-villa.png" },
  liverpool: { name: "Liverpool", abbr: "LIV", color: "#C8102E", color2: "#00B2A9", logo: "img/logo-liverpool.png" },
  "premier-league": { name: "Premier League", abbr: "PL", color: "#38003C", color2: "#00FF85", logo: "img/logo-premier-league.png" },
  "league-one": { name: "League One", abbr: "L1", color: "#0B1E4B", color2: "#E4002B", logo: "img/logo-league-one.png" },
};

// sincroniza as palavras de um texto com a fala (janela); devolve tempos por palavra
export function syncText(text, t0, tEnd, tw) {
  const ws = String(text).split(/\s+/).filter(Boolean);
  const times = new Array(ws.length).fill(null), ends = new Array(ws.length).fill(null);
  let j = tw.findIndex((w) => w.t >= t0 - 0.4);
  if (j < 0) j = tw.length;
  for (let i = 0; i < ws.length; i++) {
    const n = norm(ws[i]); if (!n) continue;
    for (let k = j; k < tw.length && tw[k].t <= tEnd + 0.6 && k < j + 8; k++) {
      if (norm(tw[k].txt) === n) { times[i] = tw[k].t; ends[i] = tw[k].e; j = k + 1; break; }
    }
  }
  const matched = times.filter((x) => x != null).length;
  let last = t0 + 0.05;
  for (let i = 0; i < ws.length; i++) {
    if (times[i] != null) { last = times[i]; continue; }
    const nxt = times.slice(i + 1).find((x) => x != null);
    times[i] = f2(nxt != null ? Math.min(last + 0.12, nxt - 0.05) : last + 0.12);
    last = times[i];
  }
  for (let i = 0; i < ws.length; i++) times[i] = f2(Math.max(t0 + 0.04 + i * 0.02, times[i]));
  const lastEnd = ends.filter((x) => x != null).at(-1) ?? times.at(-1) + 0.3;
  return { ws, times, matched, lastEnd };
}

export function buildPlanEafc(spec, ctx) {
  const { tw, endVoice, fail } = ctx;
  const warns = [];
  const phr = []; // inícios de frase na timeline
  tw.forEach((w, i) => { if (i === 0) return phr.push(w.t); const p = tw[i - 1]; if (/[.?!,]$/.test(p.txt) || w.t - p.e > 0.3) phr.push(w.t); });
  const at = (v, label, after) => (v === "start" ? 0 : ctx.anchor(v, label, after));
  const scenes = [], mods = [];

  (spec.beats || []).forEach((b, bi) => {
    const label = `beat ${bi + 1} (${b.do})`;
    if (MODS.includes(b.do)) {
      // modificadores não avançam a âncora global (lastT): resolvem a partir dela sem movê-la
      const t0 = f2((b.at === "start" ? 0 : ctx.span(b.at, label)[0]) + (b.offset || 0));
      const t1 = b.to != null ? f2(ctx.span(b.to, label + ".to", t0)[1] + 0.1) : b.until != null ? f2(ctx.span(b.until, label + ".until", t0)[0]) : f2(t0 + (b.dur ?? (b.do === "punch" ? 2 : b.do === "lights" ? 0.9 : b.do === "freeze" ? 1.2 : b.do === "letterbox" ? 4 : b.do === "ambience" ? 6 : 0.4)));
      mods.push({ ...b, t0, t1 }); return;
    }
    const def = FULL[b.do] || OVERLAY[b.do];
    if (!def) fail(`${label}: tipo "${b.do}" não existe no estilo eafc. Cenas: ${SCENES.join(", ")}; modificadores: ${MODS.join(", ")}`);
    const t0 = f2(at(b.at, label) + (b.offset || 0));
    let t1 = b.to != null ? f2(ctx.span(b.to, label + ".to", t0)[1] + (b.tail ?? 0.3))
      : b.until != null ? at(b.until, label + ".until", t0)
      : b.dur != null ? f2(t0 + b.dur) : null;
    const s = { ...b, t0, t1, full: !!FULL[b.do], in: b.in ?? def.in ?? "cut", out: b.out ?? def.out ?? "cut" };
    const sub = (v, lb) => (v === "start" ? 0 : ctx.span(v, lb, t0)[0]); // não avança lastT
    for (const k of ["items", "rows"]) if (Array.isArray(b[k])) s[k] = b[k].map((it, ii) => (typeof it === "string" ? { text: it } : { ...it, t: it.at != null ? sub(it.at, `${label} ${k}[${ii}]`) : null }));
    if (b.flip) s.flip = { ...b.flip, t: b.flip.at != null ? sub(b.flip.at, label + ".flip") : null };
    scenes.push(s);
  });

  // ── tempos automáticos / sincronia / validação ─────────────────────────────
  scenes.sort((a, b) => a.t0 - b.t0 || (a.full ? -1 : 1));
  const fulls = scenes.filter((s) => s.full);
  scenes.forEach((s) => {
    const def = FULL[s.do] || OVERLAY[s.do];
    if (s.full) {
      if (!TRANS_IN.includes(s.in)) fail(`cena ${s.do} em ${s.t0}s: transição de entrada "${s.in}" não existe (${TRANS_IN.join(", ")})`);
      if (!TRANS_OUT.includes(s.out)) fail(`cena ${s.do} em ${s.t0}s: transição de saída "${s.out}" não existe (${TRANS_OUT.join(", ")})`);
    }
    if (s.do === "word" || s.do === "title" || s.do === "stamp") {
      const txt = s.do === "title" ? s.title : s.text;
      if (!txt || !String(txt).trim()) fail(`cena ${s.do} em ${s.t0}s: falta "${s.do === "title" ? "title" : "text"}"`);
      if (s.do === "word") {
        const sy = syncText(txt, s.t0, s.t1 ?? s.t0 + 3, tw);
        s.sync = sy;
        if (s.t1 == null) s.t1 = f2(sy.matched >= Math.min(2, sy.ws.length) ? sy.lastEnd + (s.tail ?? 0.9) : s.t0 + 0.5 + sy.ws.length * 0.12 + 1.2);
      }
    }
    if (s.do === "montage") {
      const its = s.items || [];
      if (!its.length) fail(`montage em ${s.t0}s: faltam "items"`);
      const step = s.step ?? 1.0;
      its.forEach((it, k) => { if (it.t == null) it.t = f2(s.t0 + k * step); });
      if (s.t1 == null) s.t1 = f2(its.at(-1).t + step);
    }
    if ((s.do === "fixtures" || s.do === "ladder") && s.t1 == null) {
      const lt = Math.max(...(s.rows || []).map((r) => r.t ?? 0));
      s.t1 = f2(Math.max(s.t0 + (def.dur ?? 3), lt + 1.4));
    }
    if (s.do === "score" && s.t1 == null && s.flip?.t != null) s.t1 = f2(s.flip.t + 1.6);
    if (s.t1 == null) s.t1 = f2(s.t0 + (s.dur ?? def.dur ?? 2));
    if (s.do === "score" && s.flip?.t != null && (s.flip.t < s.t0 + 0.4 || s.flip.t > s.t1 - 0.5)) fail(`score em ${s.t0}s: flip.at (${s.flip.t}s) fora da cena ${s.t0}–${s.t1}s`);
    if (s.full && (s.label || s.sub) && s.t1 - s.t0 < 1.1) warns.push(`${s.do} em ${s.t0}s dura só ${f2(s.t1 - s.t0)} s com rótulo — difícil de ler (ideal ≥ 1,2 s)`);
    if (s.t1 > endVoice) s.t1 = f2(endVoice);
    if (s.t1 - s.t0 < 0.4) fail(`cena ${s.do} em ${s.t0}s ficou curta demais (${f2(s.t1 - s.t0)} s); revise "at"/"to"/"dur"`);
    // itens sem âncora: distribui
    if (s.rows) { const n = s.rows.length, span = s.t1 - s.t0 - 0.9; s.rows.forEach((it, ii) => { if (it.t == null) it.t = f2(s.t0 + 0.35 + (span * ii) / Math.max(1, n)); }); }
  });
  fulls.forEach((s, i) => {
    const prev = fulls[i - 1];
    if (!prev) return;
    if (s.t0 < prev.t1 - 0.15) fail(`cena ${s.do} (${s.t0}s) começa antes de ${prev.do} terminar (${prev.t1}s). Ajuste "at"/"dur"/"to".`);
    if (s.t0 - prev.t1 <= 0.15) { s.t0 = prev.t1; prev.next = true; s.prevAdj = true; }
    else if (s.t0 - prev.t1 < 0.7) warns.push(`rosto aparece só ${f2(s.t0 - prev.t1)} s entre ${prev.do} e ${s.do} (pisca) — junte as cenas ou afaste`);
  });
  // overlays que caem dentro de cena cheia: aviso (ficam escondidos)
  for (const o of scenes.filter((s) => !s.full)) {
    const hid = fulls.find((f) => o.t0 >= f.t0 - 0.05 && o.t0 < f.t1 - 0.05);
    if (hid && o.do !== "stamp" && o.do !== "badge") warns.push(`${o.do} em ${o.t0}s começa dentro de ${hid.do} (${hid.t0}–${hid.t1}s) — vai aparecer por cima da cena, não do rosto`);
  }

  // ── mídia (imagens em work/<slug>/) e trechos a recortar (matte) ──────────
  const media = [];
  const seen = new Map();
  const img = (src, label) => {
    if (!src) return null;
    if (seen.has(src)) return seen.get(src);
    if (!/\.(png|jpe?g|webp|gif|svg)$/i.test(src)) fail(`${label}: "${src}" não é imagem (png/jpg/webp/svg)`);
    const m = { src, image: true, id: `m${media.length}` };
    media.push(m); seen.set(src, m); return m;
  };
  const team = (k, label) => { const t = TEAMS[k]; if (!t) fail(`${label}: time "${k}" não existe (${Object.keys(TEAMS).join(", ")})`); return { key: k, ...t, media: img(t.logo, label) }; };
  const mattes = [];
  for (const s of scenes) {
    const lb = `${s.do} em ${s.t0}s`;
    if (s.do === "photo") { s.media = img(s.src, lb); if (!s.media) fail(`${lb}: falta "src" (imagem em work/<slug>/)`); }
    if (s.do === "montage") s.items.forEach((it) => { it.media = img(it.src, lb); if (!it.media) fail(`${lb}: item sem "src"`); });
    if (s.do === "crest" || s.do === "split") { s.teams = (s.teams || []).map((k) => team(k, lb)); if (!s.teams.length) fail(`${lb}: falta "teams"`); if (s.comp) s.compT = team(s.comp, lb); if (s.bg && /\.(png|jpe?g|webp)$/i.test(s.bg)) s.bgMedia = img(s.bg, lb); }
    if (s.do === "score") { s.homeT = team(s.home, lb); s.awayT = team(s.away, lb); }
    if (s.do === "record" || s.do === "ladder") { if (s.team) s.teamT = team(s.team, lb); }
    if (s.do === "fixtures") s.rows.forEach((r) => { if (r.team) r.teamT = team(r.team, lb); if (r.vs) r.vsT = team(r.vs, lb); });
    if (s.do === "badge") { s.teamT = team(s.team, lb); }
    if (s.do === "tweet" && s.avatar && /\.(png|jpe?g|webp)$/i.test(s.avatar)) s.avatarMedia = img(s.avatar, lb);
    if (s.do === "title" && s.image) s.media = img(s.image, lb);
    if (s.do === "word" && s.behind) mattes.push([f2(Math.max(0, s.t0 - 0.15)), f2(Math.min(endVoice, s.t1 + 0.15))]);
    if (s.bg && /\.(png|jpe?g|webp)$/i.test(s.bg) && !s.bgMedia) s.bgMedia = img(s.bg, lb);
  }
  for (const m of mods) if (m.do === "flashframe") { m.media = img(m.src, `flashframe em ${m.t0}s`); if (!m.media) fail(`flashframe em ${m.t0}s: falta "src"`); }
  // junta trechos de matte próximos
  mattes.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const m of mattes) { const l = merged.at(-1); if (l && m[0] <= l[1] + 0.4) l[1] = Math.max(l[1], m[1]); else merged.push([...m]); }
  return { scenes, mods, media, mattes: merged, warns, phr };
}
