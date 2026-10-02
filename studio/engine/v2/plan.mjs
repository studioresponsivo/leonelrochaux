// Estilo v2 — resolve o roteiro (spec) em cenas com tempo absoluto na timeline.
// Aberturas são "macros": viram cenas + enquadramentos no início do vídeo.
// Entrada ctx: { V, W, H, portfolio, tw, endVoice, anchor(v,label,after), span(v,label,after), fail, srcW, srcH, warn }
//   tw = palavras já na timeline [{ t, e, txt }]

export const f2 = (n) => +(+n).toFixed(3);
export const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9%]/g, "");

export const OPENINGS = {
  "screen-first": "tela/B-roll em tela cheia com a voz por baixo → blur-cut para o rosto (take A fechado) → take B",
  "type-hook": "frase-gancho palavra a palavra sincronizada com a voz, fundo limpo → corte seco para o rosto",
  "ticker-hook": "fundo verde, frase correndo com motion blur na velocidade da fala → blur-cut",
  "number-hook": "número grande contando em fundo escuro com glow → corte seco",
  "search-hook": "ícone de busca com bloom → barra → pergunta digitada → zoom-through num trecho → blur-cut",
  "result-first": "resultado num device 3D que sobe em fundo escuro → corte para o rosto",
  "face-to-face-cut": "rosto fechado (take A) → take B aberto na 2ª frase → insert de tela",
  "problem-flood": "o jeito errado (trecho dessaturado) inundado de vermelho → rosto com a solução",
  "selection-hook": "frase na tela, palavra-chave selecionada estilo iOS + punch-in → corte",
};
const SCENE_DEF = {
  cutaway: { in: "zoom", out: "blur", dur: 2.4 },
  bridge: { in: "cut", out: "cut" },
  ticker: { in: "whip", out: "blur" },
  number: { in: "cut", out: "cut", dur: 2.4 },
  kpis: { in: "push-up", out: "blur", dur: 4 },
  search: { in: "cut", out: "zoom", dur: 2.6 },
  select: { in: "cut", out: "blur" },
  device: { in: "curtain", out: "blur", dur: 3.6 },
  stack: { in: "push-up", out: "blur" },
  swap: { in: "push-up", out: "blur" },
  icons: { in: "whip-up", out: "cut" },
};
export const SCENES = Object.keys(SCENE_DEF);
export const MODS = ["punch", "focus"];
export const TRANS_IN = ["none", "cut", "blur", "whip", "whip-left", "whip-right", "whip-up", "whip-down", "push-up", "curtain", "zoom", "whiteout"];
export const TRANS_OUT = ["none", "cut", "blur", "whip", "whip-left", "whip-right", "whip-up", "whip-down", "spin", "shrink", "flood", "whiteout", "zoom"];
const TEXT_SYNC = new Set(["bridge", "ticker", "select", "icons"]);

// ── caixas de mídia (tamanho em px no quadro) ───────────────────────────────────
export function mediaBox(kind, crop, ctx) {
  const { V, W, H } = ctx;
  const cw = crop[2] - crop[0], ch = crop[3] - crop[1], ar = cw / ch;
  const even = (n) => Math.max(2, Math.round(n / 2) * 2);
  const fit = (mw, mh) => { let w = mw, h = w / ar; if (h > mh) { h = mh; w = h * ar; } return [even(w), even(h)]; };
  if (kind === "full") return [W, H];
  if (kind === "card") return V ? fit(960, 1080) : fit(1500, 760);
  if (kind === "browser") return V ? fit(940, 980) : fit(1180, 640);
  if (kind === "phone") return V ? [420, 900] : [300, 640];
  if (kind === "stack") return V ? fit(900, 980) : fit(1100, 620);
  return [W, H];
}

// sincroniza as palavras de um texto com a fala (dentro da janela); devolve tempos por palavra
function syncText(text, t0, tEnd, tw) {
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
  // preenche lacunas: interpola entre vizinhos ou escalona 0,1 s
  let last = t0 + 0.05;
  for (let i = 0; i < ws.length; i++) {
    if (times[i] != null) { last = times[i]; continue; }
    const nxt = times.slice(i + 1).find((x) => x != null);
    times[i] = f2(nxt != null ? Math.min(last + 0.1, nxt - 0.05) : last + 0.1);
    last = times[i];
  }
  // nunca antes da própria cena
  for (let i = 0; i < ws.length; i++) times[i] = f2(Math.max(t0 + 0.04 + i * 0.02, times[i]));
  const lastEnd = ends.filter((x) => x != null).at(-1) ?? times.at(-1) + 0.3;
  return { ws, times, matched, lastEnd };
}

export function buildPlan(spec, ctx) {
  const { tw, endVoice, fail } = ctx;
  const warns = [];
  const phr = []; // inícios de frase na timeline
  tw.forEach((w, i) => { if (i === 0) return phr.push(w.t); const p = tw[i - 1]; if (/[.?!,]$/.test(p.txt) || w.t - p.e > 0.3) phr.push(w.t); });
  const nextPhrase = (t, min = 0) => phr.find((p) => p >= t + min) ?? null;
  const autoFace = () => phr.find((p) => p >= 1.8 && p <= 4.2) ?? Math.min(2.6, Math.max(1.2, endVoice - 0.5));
  const at = (v, label, after) => (v === "start" ? 0 : ctx.anchor(v, label, after));
  const scenes = [], punches = [], focus = [];
  let faceT = 0, opening = null;

  // ── abertura ───────────────────────────────────────────────────────────────
  const o = spec.opening;
  if (o) {
    opening = o.style;
    if (!OPENINGS[o.style]) fail(`abertura "${o.style}" não existe. Use: ${Object.keys(OPENINGS).join(", ")}`);
    faceT = o.face != null ? at(o.face, "opening.face", 0) : autoFace();
    const takeA = (t) => { // rosto entra fechado (take A) e abre na próxima frase (take B)
      if (o.take === false || ctx.portfolio) return;
      const nb = nextPhrase(t, 1.2) ?? t + 2;
      punches.push({ t0: t, t1: f2(Math.min(nb, endVoice)), scale: o.takeScale ?? 1.18, src: "opening" });
    };
    const need = (k) => { if (o[k] == null) fail(`abertura ${o.style}: falta o campo "${k}"`); };
    switch (o.style) {
      case "screen-first": {
        const shots = o.shots || [{ src: o.src, crop: o.crop, label: o.label }];
        if (shots[0].src == null) fail(`abertura screen-first: informe "src" (segundos do vídeo original) ou "shots"`);
        const d = faceT / shots.length;
        shots.forEach((s, i) => scenes.push({ do: "cutaway", t0: f2(i * d), t1: f2((i + 1) * d), frame: s.frame ?? o.frame ?? "full", src: s.src, crop: s.crop, label: s.label ?? (i === 0 ? o.label : null), fx: s.fx ?? (i % 2 ? "pan" : "push"),
          in: i === 0 ? "none" : (o.between ?? "whip"), out: i === shots.length - 1 ? (o.out ?? "blur") : "none", origin: "opening" }));
        takeA(faceT); break;
      }
      case "type-hook": need("text");
        scenes.push({ do: "bridge", t0: 0, t1: faceT, text: o.text, hl: o.hl, bg: o.bg ?? "light", sub: o.sub, in: "none", out: o.out ?? "cut", origin: "opening" });
        takeA(faceT); break;
      case "ticker-hook": need("text");
        scenes.push({ do: "ticker", t0: 0, t1: faceT, text: o.text, hl: o.hl, in: "none", out: o.out ?? "blur", origin: "opening" });
        takeA(faceT); break;
      case "number-hook": need("value");
        scenes.push({ do: "number", t0: 0, t1: faceT, value: o.value, from: o.from, prefix: o.prefix, suffix: o.suffix, label: o.label, in: "none", out: o.out ?? "cut", origin: "opening" });
        takeA(faceT); break;
      case "search-hook": {
        need("query");
        const mid = o.src != null ? f2(Math.max(1.6, faceT * 0.55)) : faceT;
        scenes.push({ do: "search", t0: 0, t1: mid, query: o.query, in: "none", out: o.src != null ? "none" : (o.out ?? "zoom"), origin: "opening" });
        if (o.src != null) scenes.push({ do: "cutaway", t0: mid, t1: faceT, src: o.src, crop: o.crop, frame: o.frame ?? "full", fx: "push", in: "zoom", out: o.out ?? "blur", origin: "opening" });
        takeA(faceT); break;
      }
      case "result-first": need("src");
        scenes.push({ do: "device", t0: 0, t1: faceT, src: o.src, crop: o.crop, kind: o.kind ?? "browser", labels: o.labels || (o.label ? [o.label] : []), in: "none", out: o.out ?? "cut", origin: "opening" });
        takeA(faceT); break;
      case "face-to-face-cut": {
        const p2 = o.face != null ? faceT : (nextPhrase(0, 1.4) ?? 2);
        punches.push({ t0: 0, t1: p2, scale: o.takeScale ?? 1.25, src: "opening" });
        if (o.src != null) {
          const ti = o.insertAt != null ? at(o.insertAt, "opening.insertAt", p2) : (nextPhrase(p2, 1.2) ?? p2 + 1.5);
          scenes.push({ do: "cutaway", t0: ti, t1: f2(ti + (o.dur ?? 2.2)), src: o.src, crop: o.crop, frame: o.frame ?? "full", fx: "push", in: "whip", out: "blur", origin: "opening" });
        }
        faceT = 0; break;
      }
      case "problem-flood": need("src");
        scenes.push({ do: "cutaway", t0: 0, t1: faceT, src: o.src, crop: o.crop, frame: o.frame ?? "full", fx: "push", gray: true, label: o.label, in: "none", out: "flood", flood: o.color ?? "red", origin: "opening" });
        takeA(faceT); break;
      case "selection-hook": need("text"); need("word");
        scenes.push({ do: "select", t0: 0, t1: faceT, text: o.text, word: o.word, in: "none", out: o.out ?? "cut", origin: "opening" });
        takeA(faceT); break;
    }
  } else if (!ctx.portfolio) warns.push("sem \"opening\": o vídeo abre direto no rosto (o estilo v2 pede abertura de cinema)");

  // ── beats ──────────────────────────────────────────────────────────────────
  let lastEnd = scenes.length ? Math.max(...scenes.map((s) => s.t1)) : 0;
  (spec.beats || []).forEach((b, bi) => {
    const label = `beat ${bi + 1} (${b.do})`;
    if (b.do === "punch") {
      const t0 = f2(at(b.at, label) + (b.offset || 0));
      const t1 = b.to != null ? f2(ctx.span(b.to, label + ".to", t0)[1] + 0.1) : b.until != null ? at(b.until, label + ".until", t0) : f2(t0 + (b.dur ?? b.hold ?? 2));
      punches.push({ t0, t1, scale: b.scale ?? 1.2 }); return;
    }
    if (b.do === "focus") { focus.push({ ...b, t: f2(at(b.at, label) + (b.offset || 0)) }); return; }
    const def = SCENE_DEF[b.do];
    if (!def) fail(`${label}: tipo "${b.do}" não existe no v2. Cenas: ${SCENES.join(", ")}; modificadores: ${MODS.join(", ")}`);
    const t0 = f2((b.at == null && ctx.portfolio ? lastEnd : at(b.at, label)) + (b.offset || 0));
    let t1 = b.to != null ? f2(ctx.span(b.to, label + ".to", t0)[1] + 0.25)
      : b.until != null ? at(b.until, label + ".until", t0)
      : b.dur != null ? f2(t0 + b.dur) : null;
    const s = { ...b, t0, t1, in: b.in ?? (b.fx === "zoom-through" ? "zoom" : def.in), out: b.out ?? def.out };
    if (s.fx === "zoom-through") s.fx = "push";
    for (const k of ["items", "cards"]) if (b[k]) s[k] = b[k].map((it, ii) => ({ ...it, t: it.at != null ? at(it.at, `${label} ${k}[${ii}]`, t0) : null }));
    scenes.push(s);
    lastEnd = t1 ?? t0 + 2;
  });

  // ── tempos automáticos, sincronia de texto, validação ──────────────────────
  scenes.sort((a, b) => a.t0 - b.t0);
  scenes.forEach((s, i) => {
    const def = SCENE_DEF[s.do];
    if (!TRANS_IN.includes(s.in)) fail(`cena ${s.do} em ${s.t0}s: transição de entrada "${s.in}" não existe (${TRANS_IN.join(", ")})`);
    if (!TRANS_OUT.includes(s.out)) fail(`cena ${s.do} em ${s.t0}s: transição de saída "${s.out}" não existe (${TRANS_OUT.join(", ")})`);
    if (TEXT_SYNC.has(s.do)) {
      const txt = s.do === "select" ? `${s.text}` : s.do === "icons" ? `${s.before ?? ""} ${s.after ?? ""}` : s.text;
      if (!txt || !String(txt).trim()) fail(`cena ${s.do} em ${s.t0}s: falta "text"`);
      const guessEnd = s.t1 ?? s.t0 + 4;
      const sy = syncText(txt, s.t0, guessEnd, tw);
      s.sync = sy;
      if (s.t1 == null) s.t1 = f2(sy.matched >= Math.min(2, sy.ws.length) ? sy.lastEnd + 0.7 : s.t0 + 0.6 + sy.ws.length * 0.09 + 1.4);
    }
    if (s.do === "stack" && s.t1 == null) s.t1 = f2(s.t0 + 0.3 + (s.cards || []).length * 1.5);
    if ((s.do === "swap" || s.do === "kpis") && s.t1 == null) {
      const lt = Math.max(...(s.items || []).map((it) => it.t ?? 0));
      s.t1 = f2(Math.max(s.t0 + (def.dur ?? 3), lt + 1.6));
    }
    if (s.t1 == null) s.t1 = f2(s.t0 + (s.dur ?? def.dur ?? 2.4));
    if (!ctx.portfolio && s.t1 > endVoice) { s.t1 = f2(endVoice); }
    if (s.t1 - s.t0 < 0.5) fail(`cena ${s.do} em ${s.t0}s ficou curta demais (${f2(s.t1 - s.t0)} s); revise "at"/"to"/"dur"`);
    const prev = scenes[i - 1];
    if (prev) {
      if (s.t0 < prev.t1 - 0.15) fail(`cena ${s.do} (${s.t0}s) começa antes de ${prev.do} terminar (${prev.t1}s). Ajuste "at"/"dur"/"to".`);
      if (s.t0 - prev.t1 <= 0.15) { s.t0 = prev.t1; prev.next = true; s.prevAdj = true; }
      else if (s.t0 - prev.t1 < 0.8) warns.push(`rosto aparece só ${f2(s.t0 - prev.t1)} s entre ${prev.do} e ${s.do} (pisca) — junte as cenas ou afaste`);
    }
    // itens sem âncora: distribui na duração
    for (const k of ["items", "cards"]) if (s[k]) {
      const n = s[k].length, span = s.t1 - s.t0 - 0.6;
      s[k].forEach((it, ii) => { if (it.t == null) it.t = f2(s.t0 + 0.25 + (span * ii) / Math.max(1, n)); });
    }
  });
  if (ctx.portfolio && !scenes.length) fail("portfólio sem cenas: adicione beats (device, stack, cutaway, bridge…) com \"dur\"");

  // ── mídia necessária ───────────────────────────────────────────────────────
  const media = [];
  const full = [0, 0, ctx.srcW || 1920, ctx.srcH || 1080];
  const want = (s, obj, kind, dur) => {
    if (obj.src == null) return null;
    const crop = obj.crop || full;
    const box = mediaBox(kind, crop, ctx);
    const isImg = typeof obj.src === "string" && /\.(png|jpe?g|webp|gif|svg)$/i.test(obj.src);
    const m = { src: obj.src, from: obj.from, crop, box, dur: f2(dur + 0.4), image: isImg, id: `m${media.length}` };
    media.push(m); return m;
  };
  for (const s of scenes) {
    if (s.do === "cutaway") {
      const crop = s.crop || full;
      if (!s.frame) s.frame = ctx.V && (crop[2] - crop[0]) / (crop[3] - crop[1]) > 1.05 ? "card" : "full";
      s.media = want(s, s, s.frame === "full" ? "full" : "card", s.t1 - s.t0 + 0.5);
      if (!s.media) fail(`cutaway em ${s.t0}s: falta "src" (segundos do vídeo original ou arquivo em work/<slug>/)`);
    }
    if (s.do === "device") { s.media = want(s, s, s.kind === "phone" ? "phone" : "browser", s.t1 - s.t0 + 0.6); if (!s.media) fail(`device em ${s.t0}s: falta "src"`); }
    if (s.do === "stack") (s.cards || []).forEach((c) => { c.media = want(s, c, "stack", s.t1 - c.t + 0.6); if (!c.media) fail(`stack em ${s.t0}s: card sem "src"`); c.t0 = c.t; });
  }
  const end = scenes.length ? Math.max(...scenes.map((s) => s.t1)) : 0;
  return { scenes, punches, focus, opening, faceT, media, warns, phr, end };
}

// ── variedade: compara com o vídeo anterior do histórico ──────────────────────
export function variety(entry, hist) {
  const w = [];
  const prev = [...hist].reverse().find((h) => h.name !== entry.name);
  if (prev) {
    if (entry.opening && prev.opening === entry.opening) w.push(`abertura "${entry.opening}" repete a do vídeo anterior (${prev.name}). Troque por: ${Object.keys(OPENINGS).filter((x) => x !== prev.opening).slice(0, 4).join(", ")}…`);
    const a = entry.patterns.join(">"), b = (prev.patterns || []).join(">");
    if (a && a === b) w.push(`sequência de padrões idêntica ao vídeo anterior (${prev.name}): ${a}`);
    else if (entry.patterns.length >= 3 && b.startsWith(entry.patterns.slice(0, 3).join(">"))) w.push(`os 3 primeiros padrões repetem o vídeo anterior (${prev.name}): ${entry.patterns.slice(0, 3).join(" > ")}`);
    if (prev.chapterBg && entry.chapterBg && prev.chapterBg === entry.chapterBg) w.push(`fundo de capítulo dominante "${entry.chapterBg}" igual ao do vídeo anterior — alterne (light/dark/green)`);
  }
  const cnt = {};
  for (const t of entry.transitions) cnt[t] = (cnt[t] || 0) + 1;
  for (const [t, n] of Object.entries(cnt)) if (n > 3 && !["cut", "none", "blur"].includes(t)) w.push(`transição "${t}" usada ${n}× (máx. 3 por vídeo)`);
  const kinds = new Set(entry.patterns);
  if (entry.format !== "horizontal" && entry.patterns.length && kinds.size < 3) w.push(`só ${kinds.size} tipo(s) de cena — o guia pede 4–6 padrões diferentes por vídeo curto`);
  return w;
}
