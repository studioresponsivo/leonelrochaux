// Reels "80/20 das IAs" — gera index.html (HyperFrames) a partir dos dados do corte.
// Uso: node build.mjs   (dados em data/: cuts.json, faces.json, transcript.json)
import fs from "node:fs";
const P = new URL(".", import.meta.url).pathname.replace(/\/$/, "");
const cuts = JSON.parse(fs.readFileSync(`${P}/data/cuts.json`, "utf8"));
const faces = JSON.parse(fs.readFileSync(`${P}/data/faces.json`, "utf8"));
const words = JSON.parse(fs.readFileSync(`${P}/data/transcript.json`, "utf8"));
const f2 = (n) => +n.toFixed(3);

// ── Tempo: fonte → timeline do corte ───────────────────────────────────────────
const T = (src) => {
  const c = cuts.find((c) => src >= c.in - 0.001 && src <= c.out + 0.001);
  if (!c) throw new Error(`fora do corte: ${src}`);
  return f2(c.t0 + (src - c.in));
};
const END_VOICE = f2(cuts.at(-1).t0 + cuts.at(-1).dur); // 70.05
const CTA_DUR = 5;
const TOTAL = f2(END_VOICE + CTA_DUR);
const SCREEN_IN = cuts.find((c) => c.id === "c3").t0; // 14.36
const SCREEN_OUT = f2(cuts.find((c) => c.id === "c6").t0 + cuts.find((c) => c.id === "c6").dur); // 44.68

// ── Legendas: palavras dentro dos cortes, com correções de transcrição ─────────
const FIX = { "Só": "Se", "pra": "alguém", "desconfio,": "desconfie,", "afastam": "afasta", "curioso": "curiosos" };
const HL = /^\d+%$/; // números com % viram pílula verde
const KW = new Set(["ia", "desconfie", "mentira", "horrível", "sua", "tokens", "tipografias", "conceito", "mão", "errado", "torta", "vida",
  "bonitos", "vendem", "valorizados", "vitrine", "bolso", "clientes", "curiosos", "valor", "design", "organizados", "prática", "responsabilidade", "leonel"]);
const capWords = [];
for (const c of cuts) {
  for (const w of words) {
    if (w.start < c.in - 0.02 || w.start >= c.out - 0.05) continue;
    let txt = FIX[w.text] ?? w.text;
    const end = /[.?!,]$/.test(txt);
    const q = txt.endsWith("?");
    txt = txt.replace(/[.,!]+$/, "");
    const bare = txt.replace(/\?$/, "").toLowerCase();
    capWords.push({
      t: T(Math.max(w.start, c.in)), e: T(Math.min(w.end, c.out)), txt, q, end,
      kind: HL.test(bare) ? "hl" : KW.has(bare) ? "kw" : "",
    });
  }
}
// agrupa: até 3 palavras / 18 caracteres, quebra em pontuação ou pausa
const groups = [];
let g = [];
for (let i = 0; i < capWords.length; i++) {
  const w = capWords[i], prev = g.at(-1);
  const len = g.reduce((a, x) => a + x.txt.length + 1, 0) + w.txt.length;
  if (g.length && (g.length >= 3 || len > 18 || prev.end || w.t - prev.e > 0.35)) { groups.push(g); g = []; }
  g.push(w);
}
if (g.length) groups.push(g);
groups.forEach((gr, i) => {
  gr.start = gr[0].t;
  gr.stop = f2(Math.min(groups[i + 1]?.[0].t ?? END_VOICE, gr.at(-1).e + 0.9));
});
const capsHtml = groups.map((gr, i) =>
  `<div class="cap" id="cap-${i}">${gr.map((w, j) => `<span class="w ${w.kind}" id="w-${i}-${j}">${w.txt}</span>`).join(" ")}</div>`).join("\n        ");

// ── Câmera do rosto (9:16 a partir do 16:9) ────────────────────────────────────
const VS = 1920 / 1080; // vídeo escalado pra altura cheia
const panX = (x) => f2(Math.min(0, Math.max(1080 - 1920 * VS, 540 - x * VS)));
const facePan = [];
for (const c of cuts.filter((c) => c.kind === "face")) {
  const pts = faces[c.id].map(([t, x]) => [T(Math.min(Math.max(t, c.in), c.out)), x]);
  const sm = pts.map((p, i) => { // mediana móvel (janela 5)
    const win = pts.slice(Math.max(0, i - 2), i + 3).map((q) => q[1]).sort((a, b) => a - b);
    return [p[0], win[Math.floor(win.length / 2)]];
  });
  const keys = [sm[0]];
  for (const p of sm.slice(1)) if (Math.abs(p[1] - keys.at(-1)[1]) > 40) keys.push(p); // zona morta: sem tremedeira
  facePan.push({ cut: c.id, t0: c.t0, keys: keys.map(([t, x]) => [t, panX(x)]) });
}

// ── Dashboard (frame congelado) ────────────────────────────────────────────────
const DASH = { ox: 456, oy: 150, s: 0.788, W: 980, H: 465 }; // recorte da tela → card
const dp = (x, y) => [f2((x - DASH.ox) * DASH.s), f2((y - DASH.oy) * DASH.s)];
const dcam = (z, fx, fy) => { // centraliza o ponto (coords da tela original) com zoom z
  const [px, py] = dp(fx, fy);
  const x = Math.min(0, Math.max(DASH.W - DASH.W * z, DASH.W / 2 - px * z));
  const y = Math.min(0, Math.max(DASH.H - DASH.H * z, DASH.H / 2 - py * z));
  return { x: f2(x), y: f2(y), scale: z };
};
// anotações de revisão (coords da tela original)
const NOTES = [
  { id: "n1", x: 1329, y: 377, r: 34, label: "errado", at: T(360.11) },
  { id: "n2", x: 1613, y: 281, r: 44, label: "não gostei", at: T(361.15) },
  { id: "n3", x: 1050, y: 625, r: 70, label: "torto", at: T(362.51) },
];
const notesSvg = NOTES.map((n) => {
  const [cx, cy] = dp(n.x, n.y), r = f2(n.r * DASH.s);
  return `<g class="note" id="${n.id}">
              <circle class="ring" cx="${cx}" cy="${cy}" r="${r}" pathLength="1" />
              <g transform="translate(${cx > DASH.W * 0.6 ? f2(cx - r * 0.7 - (n.label.length * 13 + 26)) : f2(cx + r * 0.7)} ${f2(cy - r - 10)})"><g class="tag"><rect x="0" y="-22" rx="11" width="${n.label.length * 13 + 26}" height="30"/><text x="13" y="-2">${n.label}</text></g></g>
              <g transform="translate(${cx} ${cy})"><g class="ok"><circle r="17"/><path d="M-8 0 L-2 6 L9 -6" /></g></g>
            </g>`;
}).join("\n            ");

const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Jakarta"; font-weight: 500; src: url(assets/fonts/plus-jakarta-sans-latin-500-normal.woff2) format("woff2"); }
      @font-face { font-family: "Jakarta"; font-weight: 700; src: url(assets/fonts/plus-jakarta-sans-latin-700-normal.woff2) format("woff2"); }
      @font-face { font-family: "Jakarta"; font-weight: 800; src: url(assets/fonts/plus-jakarta-sans-latin-800-normal.woff2) format("woff2"); }
      @font-face { font-family: "Jakarta"; font-weight: 500; src: url(assets/fonts/plus-jakarta-sans-latin-ext-500-normal.woff2) format("woff2"); unicode-range: U+0100-024F; }
      @font-face { font-family: "Jakarta"; font-weight: 700; src: url(assets/fonts/plus-jakarta-sans-latin-ext-700-normal.woff2) format("woff2"); unicode-range: U+0100-024F; }
      @font-face { font-family: "Jakarta"; font-weight: 800; src: url(assets/fonts/plus-jakarta-sans-latin-ext-800-normal.woff2) format("woff2"); unicode-range: U+0100-024F; }
      :root {
        /* marca: primary + escala neutral (conversaovisual.com.br) */
        --g500: #22c55e; --g400: #4ade80; --g50: #f0fdf4;
        --n50: #fafafa; --n100: #f5f5f5; --n200: #e5e5e5; --n400: #a3a3a3; --n500: #737373;
        --n600: #525252; --n800: #232323; --n900: #0f0f0f; --n950: #070707;
        --red: #ef4444;
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1080px; height: 1920px; overflow: hidden; background: var(--n950); }
      #stage { position: relative; width: 1080px; height: 1920px; overflow: hidden; background: var(--n950); font-family: "Jakarta", sans-serif; color: var(--n50); }
      .layer { position: absolute; inset: 0; }
      .bg-brand {
        background:
          radial-gradient(900px 700px at 50% -8%, rgba(34,197,94,.16), transparent 62%),
          radial-gradient(800px 700px at 100% 105%, rgba(34,197,94,.09), transparent 60%),
          linear-gradient(180deg, #fafafa 0%, #efefef 100%);
      }

      /* rosto */
      #faceCam { overflow: hidden; }
      #faceZoom { position: absolute; inset: 0; transform-origin: 50% 40%; }
      #facePan { position: absolute; left: 0; top: 0; width: ${f2(1920 * VS)}px; height: 1920px; }
      #facePan video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #faceShade { background: linear-gradient(to top, rgba(7,7,7,.78) 0%, rgba(7,7,7,.35) 26%, transparent 46%), linear-gradient(to bottom, rgba(7,7,7,.45), transparent 18%); }

      /* cena de tela */
      #screenScene { opacity: 0; visibility: hidden; }
      .card { position: absolute; border-radius: 34px; overflow: hidden; background: var(--n900); box-shadow: 0 0 0 1px rgba(15,15,15,.06), 0 60px 110px -24px rgba(15,15,15,.42), 0 24px 44px -20px rgba(15,15,15,.28); }
      #dashStage { position: absolute; inset: 0; perspective: 1800px; }
      #dash { left: 50px; top: 170px; width: ${DASH.W}px; height: ${DASH.H}px; }
      #dashInner { position: absolute; left: 0; top: 0; width: ${DASH.W}px; height: ${DASH.H}px; transform-origin: 0 0; }
      #dashImg { position: absolute; left: ${f2(-DASH.ox * DASH.s)}px; top: ${f2(-DASH.oy * DASH.s)}px; width: ${f2(1920 * DASH.s)}px; height: ${f2(1080 * DASH.s)}px; }
      #notes { position: absolute; left: 0; top: 0; overflow: visible; }
      .note .ring { fill: none; stroke: var(--red); stroke-width: 4; stroke-dasharray: 1; stroke-dashoffset: 1; }
      .note .tag rect { fill: var(--red); }
      .note .tag text { fill: #fff; font: 700 17px "Jakarta"; }
      .note .ok circle { fill: var(--g500); }
      .note .ok path { fill: none; stroke: var(--n950); stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }
      .note .tag, .note .ok { opacity: 0; }
      #cursor { position: absolute; left: 0; top: 0; width: 34px; height: 34px; opacity: 0; filter: drop-shadow(0 4px 8px rgba(0,0,0,.5)); }
      #dashGlow { position: absolute; inset: 0; border-radius: 34px; box-shadow: inset 0 0 0 2px var(--g500), 0 0 80px rgba(34,197,94,.45); opacity: 0; }
      #bub { left: 225px; top: 830px; width: 630px; height: 498px; }
      #bub video { position: absolute; left: ${f2(-1490 * (630 / 430))}px; top: ${f2(-740 * (630 / 430))}px; width: ${f2(1920 * (630 / 430))}px; height: ${f2(1080 * (630 / 430))}px; }
      #bubRing { position: absolute; inset: 0; border-radius: 34px; box-shadow: inset 0 0 0 7px #fff; }
      #chips { position: absolute; left: 0; right: 0; top: 678px; display: flex; justify-content: center; gap: 16px; }
      .chip { display: flex; align-items: center; gap: 12px; padding: 16px 26px 16px 18px; border-radius: 999px; background: #fff; box-shadow: 0 0 0 1px rgba(15,15,15,.05), 0 16px 34px -10px rgba(15,15,15,.28); font: 700 30px "Jakarta"; color: var(--n900); opacity: 0; }
      .chip i { width: 34px; height: 34px; border-radius: 50%; background: var(--g500); display: grid; place-items: center; }
      .chip i svg { width: 20px; height: 20px; }
      #aiBadge { position: absolute; left: 0; right: 0; margin: 0 auto; width: fit-content; top: 762px; padding: 10px 22px; border-radius: 999px; background: var(--g500); color: var(--n950); font: 800 24px "Jakarta"; letter-spacing: .06em; opacity: 0; white-space: nowrap; }

      /* barra 80/20 */
      .bar { position: absolute; left: 90px; width: 900px; height: 112px; padding: 16px; border-radius: 30px; background: #fff; box-shadow: 0 0 0 1px rgba(15,15,15,.05), 0 34px 70px -18px rgba(15,15,15,.45); opacity: 0; }
      .bar .track { position: relative; width: 100%; height: 100%; display: flex; gap: 10px; }
      .bar .seg { position: relative; height: 100%; border-radius: 16px; display: flex; align-items: center; padding: 0 24px; font: 800 36px "Jakarta"; white-space: nowrap; overflow: hidden; }
      .bar .ai { width: 80%; background: var(--g500); color: var(--n950); transform-origin: 0 50%; }
      .bar .you { flex: 1; justify-content: center; color: var(--n900); box-shadow: inset 0 0 0 2.5px #d4d4d4; background: repeating-linear-gradient(135deg, rgba(15,15,15,.05) 0 10px, transparent 10px 20px); }
      .bar .you .fill { position: absolute; inset: 0; background: var(--g400); transform-origin: 0 50%; opacity: 0; border-radius: 16px; }
      .bar .you span { position: relative; }
      .bar small { font-weight: 800; font-size: 36px; margin-left: 14px; }
      #barHook { top: 236px; }
      #barScreen { top: 670px; }
      #total { position: absolute; left: 0; right: 0; margin: 0 auto; width: fit-content; top: 792px; font: 800 26px "Jakarta"; color: #16a34a; letter-spacing: .12em; opacity: 0; white-space: nowrap; }

      /* vitrine (modo dividido) */
      #vitrine { opacity: 0; visibility: hidden; }
      #vitTitle { position: absolute; left: 90px; top: 1100px; display: flex; align-items: center; gap: 18px; font: 800 30px "Jakarta"; letter-spacing: .18em; color: #16a34a; }
      #vitTitle svg { width: 56px; height: 56px; }
      #vitTitle path { fill: none; stroke: #16a34a; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
      .row { position: absolute; left: 90px; width: 900px; height: 118px; display: flex; align-items: center; gap: 26px; padding: 0 30px; border-radius: 28px; background: #fff; color: var(--n900); box-shadow: 0 0 0 1px rgba(15,15,15,.05), 0 22px 46px -16px rgba(15,15,15,.3); font: 800 46px "Jakarta"; opacity: 0; }
      .row i { width: 64px; height: 64px; border-radius: 20px; display: grid; place-items: center; flex: none; }
      .row i svg { width: 34px; height: 34px; }
      .row.good i { background: var(--g500); }
      .row.bad i { background: var(--n200); }
      .row.bad { color: var(--n500); }
      #row1 { top: 1186px; } #row2 { top: 1324px; } #row3 { top: 1462px; }
      #coin { position: absolute; right: 120px; top: 760px; padding: 18px 30px; border-radius: 999px; background: var(--n900); color: var(--n50); font: 800 44px "Jakarta"; box-shadow: 0 20px 50px rgba(0,0,0,.5); opacity: 0; }

      /* DESIGN */
      #designWord { position: absolute; left: 0; right: 0; top: 250px; text-align: center; font: 800 190px/1 "Jakarta"; letter-spacing: -.02em; color: var(--n50); text-shadow: 0 20px 60px rgba(0,0,0,.6); opacity: 0; }
      #designLine { position: absolute; left: 240px; width: 600px; top: 470px; height: 14px; border-radius: 7px; background: var(--g500); transform-origin: 0 50%; opacity: 0; }

      /* legendas */
      #caps { position: absolute; left: 0; right: 0; top: 1450px; height: 240px; }
      .cap { position: absolute; left: 60px; right: 60px; top: 0; text-align: center; font: 800 76px/1.12 "Jakarta"; letter-spacing: -.01em; opacity: 0; visibility: hidden; }
      .w { display: inline-block; opacity: 0; visibility: hidden; text-shadow: 0 6px 26px rgba(0,0,0,.65), 0 2px 4px rgba(0,0,0,.4); }
      .w.kw { color: var(--g400); }
      #caps[data-mode="light"] .w { color: var(--n900); text-shadow: none; }
      #caps[data-mode="light"] .w.kw { color: #16a34a; }
      .w.hl, #caps[data-mode="light"] .w.hl { color: var(--n950); background: var(--g500); padding: 0 16px; border-radius: 18px; text-shadow: none; }

      /* CTA */
      #cta { opacity: 0; visibility: hidden; }
      #ctaIcon { position: absolute; left: 504px; top: 300px; width: 72px; height: 72px; }
      #ctaKicker { position: absolute; left: 0; right: 0; top: 420px; text-align: center; font: 800 28px "Jakarta"; letter-spacing: .22em; color: #16a34a; }
      #ctaHead { position: absolute; left: 80px; right: 80px; top: 476px; text-align: center; font: 800 68px/1.1 "Jakarta"; letter-spacing: -.02em; color: var(--n900); }
      #ctaCardWrap { position: absolute; left: 60px; top: 720px; width: 960px; height: 540px; perspective: 1400px; }
      #ctaCard { position: absolute; inset: 0; border-radius: 30px; overflow: hidden; box-shadow: 0 0 0 8px #fff, 0 70px 130px -30px rgba(15,15,15,.5), 0 30px 60px -30px rgba(15,15,15,.35); transform-origin: 50% 100%; }
      #ctaCard img { width: 100%; height: 100%; object-fit: cover; }
      #play { position: absolute; left: 50%; top: 50%; width: 140px; height: 100px; margin: -50px 0 0 -70px; border-radius: 28px; background: var(--g500); display: grid; place-items: center; box-shadow: 0 20px 50px rgba(0,0,0,.5); }
      #play svg { width: 44px; height: 44px; }
      #bio { position: absolute; left: 0; right: 0; margin: 0 auto; width: fit-content; top: 1340px; display: flex; align-items: center; gap: 16px; padding: 24px 40px; border-radius: 999px; background: var(--n900); color: var(--n50); font: 800 44px "Jakarta"; white-space: nowrap; opacity: 0; box-shadow: 0 24px 50px -18px rgba(15,15,15,.5); }
      #bio svg { width: 40px; height: 40px; }
    </style>
  </head>
  <body>
    <div id="stage" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1080" data-height="1920">

      <div id="splitBg" class="layer bg-brand" style="opacity:0;visibility:hidden"></div>

      <!-- ROSTO (enquadramento vertical com câmera que segue o rosto) -->
      <div id="faceCam" class="layer">
        <div id="faceZoom">
          <div id="facePan">
            <video id="vFaceA" class="clip" src="assets/media/edit.mp4" muted playsinline data-start="0" data-duration="${SCREEN_IN}" data-media-start="0" data-track-index="0"></video>
            <video id="vFaceB" class="clip" src="assets/media/edit.mp4" muted playsinline data-start="${SCREEN_OUT}" data-duration="${f2(END_VOICE - SCREEN_OUT)}" data-media-start="${SCREEN_OUT}" data-track-index="1"></video>
          </div>
        </div>
        <div id="faceShade" class="layer"></div>
      </div>

      <div id="barHook" class="bar"><div class="track"><div class="seg ai"><span>IA</span><small id="hookPct">0%</small></div><div class="seg you"><span>VOCÊ</span></div></div></div>
      <div id="designWord">DESIGN</div><div id="designLine"></div>

      <!-- TELA (dashboard + câmera ao vivo) -->
      <div id="screenScene" class="layer bg-brand" style="opacity:0;visibility:hidden">
        <div id="dashStage"><div id="dash" class="card">
          <div id="dashInner">
            <img id="dashImg" src="assets/media/dashboard.png" alt="" />
            <svg id="notes" width="${DASH.W}" height="${DASH.H}" viewBox="0 0 ${DASH.W} ${DASH.H}">
            ${notesSvg}
            </svg>
          </div>
          <svg id="cursor" viewBox="0 0 24 24"><path d="M4 2 L4 20 L9 15 L12 22 L15 21 L12 14 L19 14 Z" fill="#fafafa" stroke="#070707" stroke-width="1.5" stroke-linejoin="round"/></svg>
          <div id="dashGlow"></div>
        </div></div>
        <div id="chips">
          <div class="chip" id="chip1"><i><svg viewBox="0 0 24 24"><path d="M5 12l4 4 10-10" fill="none" stroke="#070707" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></i>Tokens</div>
          <div class="chip" id="chip2"><i><svg viewBox="0 0 24 24"><path d="M5 12l4 4 10-10" fill="none" stroke="#070707" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></i>Tipografia</div>
          <div class="chip" id="chip3"><i><svg viewBox="0 0 24 24"><path d="M5 12l4 4 10-10" fill="none" stroke="#070707" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></i>Conceito</div>
        </div>
        <div id="aiBadge">100% FEITO POR IA</div>
        <div id="barScreen" class="bar"><div class="track"><div class="seg ai"><span>IA</span><small>80%</small></div><div class="seg you"><div class="fill"></div><span id="youTxt">VOCÊ ?</span></div></div></div>
        <div id="total">80% IA + 20% VOCÊ = 100%</div>
        <div id="bub" class="card">
          <video id="vBub" class="clip" src="assets/media/edit.mp4" muted playsinline data-start="${SCREEN_IN}" data-duration="${f2(SCREEN_OUT - SCREEN_IN)}" data-media-start="${SCREEN_IN}" data-track-index="2"></video>
          <div id="bubRing"></div>
        </div>
      </div>

      <!-- VITRINE (modo dividido) -->
      <div id="vitrine" class="layer" style="opacity:0;visibility:hidden">
        <div id="vitTitle"><svg viewBox="0 0 56 56"><path d="M8 22 L12 10 H44 L48 22 M8 22 H48 M8 22 V48 H48 V22 M20 48 V32 H36 V48" pathLength="1" /></svg>A VITRINE</div>
        <div class="row good" id="row1"><i><svg viewBox="0 0 24 24"><path d="M5 12l4 4 10-10" fill="none" stroke="#070707" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></i>Seleciona clientes</div>
        <div class="row bad" id="row2"><i><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#737373" stroke-width="3" stroke-linecap="round"/></svg></i>Afasta curiosos</div>
        <div class="row good" id="row3"><i><svg viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 12L2 9z M2 9h20 M9 3l3 18 3-18" fill="none" stroke="#070707" stroke-width="2.2" stroke-linejoin="round"/></svg></i>Gera valor</div>
      </div>
      <div id="coin">R$ R$ R$</div>

      <!-- CTA -->
      <div id="cta" class="layer bg-brand" style="opacity:0;visibility:hidden">
        <img id="ctaIcon" src="assets/brand/logo-icone.png" alt="" />
        <div id="ctaKicker">VÍDEO COMPLETO</div>
        <div id="ctaHead">Assista agora no meu canal do YouTube</div>
        <div id="ctaCardWrap"><div id="ctaCard"><img src="assets/brand/capa-youtube.webp" alt="" /><div id="play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#070707"/></svg></div></div></div>
        <div id="bio"><svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="#fafafa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>Link na bio</div>
      </div>

      <!-- LEGENDAS -->
      <div id="caps" data-mode="dark">
        ${capsHtml}
      </div>

      <!-- ÁUDIO: voz tratada (-14 LUFS) + SFX da biblioteca HyperFrames -->
      <audio id="voice" src="assets/media/voice.m4a" data-start="0" data-duration="${END_VOICE}" data-track-index="3" data-volume="1"></audio>
      __SFX__
    </div>

    <script>
      const FACE_PAN = ${JSON.stringify(facePan)};
      const GROUPS = ${JSON.stringify(groups.map((gr) => ({ s: gr.start, e: gr.stop, w: gr.map((w) => w.t) })))};
      const tl = gsap.timeline({ paused: true });
      const E = { o: "expo.out", p: "power3.out", io: "power2.inOut" };

      // ── câmera do rosto: segue o rosto, corta seco nos cortes ──
      FACE_PAN.forEach((seg) => {
        tl.set("#facePan", { x: seg.keys[0][1] }, seg.t0 === 0 ? 0.001 : seg.t0);
        for (let i = 1; i < seg.keys.length; i++) {
          const [t, x] = seg.keys[i], dt = Math.max(0.4, Math.min(1.2, t - seg.keys[i - 1][0]));
          tl.to("#facePan", { x, duration: dt, ease: "sine.inOut" }, t - dt * 0.5);
        }
      });

      // punch-ins (zoom de ênfase) e tremidinha
      const punch = (t, s, hold = 0.6, back = 1) => {
        tl.to("#faceZoom", { scale: s, duration: 0.22, ease: E.o }, t);
        if (back !== null) tl.to("#faceZoom", { scale: back, duration: 0.5, ease: E.io }, t + hold);
      };
      const wiggle = (t) => {
        tl.to("#faceZoom", { rotation: 1.2, x: 8, duration: 0.06, ease: "sine.inOut" }, t);
        tl.to("#faceZoom", { rotation: -1, x: -7, duration: 0.08, ease: "sine.inOut" }, t + 0.06);
        tl.to("#faceZoom", { rotation: 0.5, x: 4, duration: 0.08, ease: "sine.inOut" }, t + 0.14);
        tl.to("#faceZoom", { rotation: 0, x: 0, duration: 0.12, ease: "sine.out" }, t + 0.22);
      };
      tl.fromTo("#faceZoom", { scale: 1.08 }, { scale: 1, duration: 0.7, ease: E.o }, 0.01); // entrada
      punch(${T(3.6)}, 1.09, 0.75);            // desconfie
      wiggle(${T(6.56)});                      // horrível
      punch(${T(13.76)}, 1.06, 0, null);            // responsabilidade... sua
      punch(${T(395.3)}, 1.06, 0.8);           // vendem mais
      punch(${T(401.3)}, 1.05, 0.7);           // valorizados
      wiggle(${T(409.78)});                    // bolso?

      // ── barra 80/20 no gancho ──
      const hook = { v: 0 };
      tl.fromTo("#barHook", { autoAlpha: 0, y: -40, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: E.o }, ${T(9.7)});
      tl.fromTo("#barHook .ai", { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: E.o }, ${T(9.76)});
      tl.fromTo(hook, { v: 0 }, { v: 80, duration: 0.8, ease: E.o, onUpdate: () => { document.getElementById("hookPct").textContent = Math.round(hook.v) + "%"; } }, ${T(9.76)});
      tl.to("#barHook .you", { boxShadow: "inset 0 0 0 3px #22c55e", duration: 0.3, ease: E.p }, ${T(12.4)});
      tl.to("#barHook .you", { scale: 1.06, duration: 0.18, ease: E.o, yoyo: true, repeat: 1 }, ${T(12.4)});
      tl.to("#barHook", { autoAlpha: 0, y: -30, duration: 0.35, ease: "power2.in" }, ${f2(SCREEN_IN - 0.4)});

      // ── transição para a tela ──
      tl.to("#faceZoom", { scale: 1.25, duration: 0.35, ease: "power2.in" }, ${f2(SCREEN_IN - 0.35)});
      tl.fromTo("#screenScene", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: "power1.out" }, ${f2(SCREEN_IN - 0.1)});
      tl.set("#faceZoom", { scale: 1 }, ${SCREEN_IN + 0.3});
      tl.fromTo("#dash", { y: 90, scale: 0.88, autoAlpha: 0, rotationY: -26, rotationX: 16 }, { y: 0, scale: 1, autoAlpha: 1, rotationY: -9, rotationX: 7, duration: 0.9, ease: E.o }, ${SCREEN_IN});
      tl.to("#dash", { rotationY: -3, rotationX: 2.5, duration: 12, ease: "sine.inOut" }, ${f2(SCREEN_IN + 0.9)});
      tl.to("#dash", { rotationY: 0, rotationX: 0, duration: 1.2, ease: E.io }, ${f2(T(357.95) - 0.6)});
      tl.to("#dash", { rotationY: 4, rotationX: 3, duration: 1.4, ease: E.io }, ${f2(T(372.42) - 0.2)});
      tl.set("#caps", { attr: { "data-mode": "light" } }, ${SCREEN_IN});
      tl.set("#caps", { attr: { "data-mode": "dark" } }, ${SCREEN_OUT});
      tl.fromTo("#bub", { y: 120, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, ease: E.o }, ${f2(SCREEN_IN + 0.12)});

      // câmera do dashboard
      const dcam = (o, t, d = 0.8) => tl.to("#dashInner", { ...o, duration: d, ease: E.io }, t);
      tl.set("#dashInner", ${JSON.stringify(dcam(1, 1078, 445))}, ${SCREEN_IN});
      dcam(${JSON.stringify(dcam(1.75, 1080, 412))}, ${f2(T(341.63) - 0.35)});   // tokens → KPIs
      dcam(${JSON.stringify(dcam(2.3, 600, 196))}, ${f2(T(342.75) - 0.3)});      // tipografias → título
      dcam(${JSON.stringify(dcam(1, 1078, 445))}, ${f2(T(344.27) - 0.2)}, 0.9);  // conceito → tudo
      dcam(${JSON.stringify(dcam(1.45, 870, 640))}, ${f2(T(355.39))}, 2.2);      // "tão bem calculado"
      dcam(${JSON.stringify(dcam(1, 1078, 445))}, ${f2(T(358.0))}, 0.8);         // volta pro geral
      dcam(${JSON.stringify(dcam(1.06, 1078, 445))}, ${f2(T(372.42))}, 1.6);     // "dou vida"

      // chips: tokens / tipografia / conceito
      [["#chip1", ${T(341.63)}], ["#chip2", ${T(342.75)}], ["#chip3", ${T(344.27)}]].forEach(([id, t]) =>
        tl.fromTo(id, { autoAlpha: 0, y: 24, scale: 0.85 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(2)" }, t));
      tl.fromTo("#aiBadge", { autoAlpha: 0, y: 14, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(2.2)" }, ${T(346.91)});
      tl.to("#chips .chip", { autoAlpha: 0, y: -16, duration: 0.3, ease: "power2.in", stagger: 0.04 }, ${f2(T(348.67) - 0.45)});
      tl.to("#aiBadge", { autoAlpha: 0, y: -12, duration: 0.3, ease: "power2.in" }, ${f2(T(348.67) - 0.4)});

      // barra 80/20 na tela
      tl.fromTo("#barScreen", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: E.o }, ${f2(T(348.67) - 0.1)});
      tl.fromTo("#barScreen .ai", { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: E.o }, ${T(348.67)});
      tl.to("#barScreen .you", { scale: 1.08, duration: 0.2, ease: E.o, yoyo: true, repeat: 3 }, ${T(350.83)});

      // anotações de revisão (o que a IA errou)
      ${JSON.stringify(NOTES.map((n) => ({ id: n.id, at: n.at })))}.forEach((n, i) => {
        tl.to("#" + n.id + " .ring", { strokeDashoffset: 0, duration: 0.45, ease: "power2.out" }, n.at);
        tl.fromTo("#" + n.id + " .tag", { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "back.out(2)" }, n.at + 0.15);
      });
      // cursor corrige "à mão" → vira check verde
      const fixAt = [${T(367.78)}, ${f2(T(367.78) + 0.6)}, ${f2(T(367.78) + 1.2)}];
      const notePos = ${JSON.stringify(NOTES.map((n) => dp(n.x, n.y)))};
      tl.fromTo("#cursor", { autoAlpha: 0, x: 900, y: 420 }, { autoAlpha: 1, x: notePos[0][0], y: notePos[0][1], duration: 0.45, ease: E.io }, fixAt[0] - 0.45);
      ["n1", "n2", "n3"].forEach((id, i) => {
        if (i) tl.to("#cursor", { x: notePos[i][0], y: notePos[i][1], duration: 0.45, ease: E.io }, fixAt[i] - 0.45);
        tl.to("#cursor", { scale: 0.8, duration: 0.08, yoyo: true, repeat: 1 }, fixAt[i]);
        tl.to("#" + id + " .ring", { stroke: "#22c55e", duration: 0.25 }, fixAt[i]);
        tl.to("#" + id + " .tag", { autoAlpha: 0, duration: 0.2 }, fixAt[i]);
        tl.fromTo("#" + id + " .ok", { autoAlpha: 0, scale: 0.3, transformOrigin: "50% 50%" }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(3)" }, fixAt[i] + 0.05);
      });
      tl.to("#cursor", { autoAlpha: 0, duration: 0.3 }, fixAt[2] + 0.6);
      // 20% final: você completa os 100%
      tl.fromTo("#barScreen .you .fill", { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, autoAlpha: 1, duration: 0.8, ease: E.o }, ${T(368.98)});
      tl.set("#youTxt", { textContent: "20%" }, ${T(368.98)});
      tl.to("#youTxt", { color: "#070707", duration: 0.3 }, ${T(368.98)});
      tl.fromTo("#total", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: E.o }, ${f2(T(368.98) + 0.6)});
      tl.fromTo("#dashGlow", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: E.o }, ${T(372.42)});
      tl.to("#dashGlow", { autoAlpha: 0.35, duration: 0.6, ease: E.io }, ${f2(T(372.42) + 0.6)});

      // ── volta pro rosto ──
      tl.to("#screenScene", { autoAlpha: 0, duration: 0.25, ease: "power1.in" }, ${f2(SCREEN_OUT - 0.08)});
      tl.set("#faceZoom", { scale: 1.2 }, ${SCREEN_OUT});
      tl.to("#faceZoom", { scale: 1, duration: 0.6, ease: E.o }, ${f2(SCREEN_OUT + 0.01)});

      // ── vitrine: modo dividido ──
      const SPLIT_IN = ${f2(T(405.86) - 0.3)}, SPLIT_OUT = ${f2(cuts.find((c) => c.id === "c10").t0 - 0.05)};
      tl.fromTo("#faceCam", { clipPath: "inset(0px 0px 0px 0px round 0px)" }, { clipPath: "inset(150px 48px 860px 48px round 44px)", duration: 0.6, ease: E.io }, SPLIT_IN);
      tl.to("#faceZoom", { y: -150, scale: 0.62, duration: 0.6, ease: E.io }, SPLIT_IN);
      tl.to("#faceShade", { autoAlpha: 0.4, duration: 0.6 }, SPLIT_IN);
      tl.fromTo("#splitBg", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, SPLIT_IN);
      tl.fromTo("#vitrine", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, SPLIT_IN + 0.2);
      tl.fromTo("#vitTitle path", { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: "power2.out" }, SPLIT_IN + 0.25);
      tl.fromTo("#vitTitle", { autoAlpha: 0, x: -20 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: E.o }, SPLIT_IN + 0.25);
      tl.to("#caps", { y: -560, duration: 0.6, ease: E.io }, SPLIT_IN);
      tl.fromTo("#coin", { autoAlpha: 0, scale: 0.5, rotation: -12 }, { autoAlpha: 1, scale: 1, rotation: -6, duration: 0.45, ease: "back.out(2.5)" }, ${T(409.78)});
      tl.to("#coin", { autoAlpha: 0, scale: 0.8, duration: 0.3 }, ${f2(T(409.78) + 1.1)});
      [["#row1", ${T(415.38)}], ["#row2", ${T(417.38)}], ["#row3", ${T(419.54)}]].forEach(([id, t]) =>
        tl.fromTo(id, { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: E.o }, t));
      tl.to("#row3", { boxShadow: "0 0 0 3px #22c55e, 0 26px 50px -16px rgba(34,197,94,.45)", duration: 0.4 }, ${f2(T(419.94))});
      tl.to("#faceCam", { clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 0.55, ease: E.io }, SPLIT_OUT);
      tl.to("#faceZoom", { y: 0, scale: 1, duration: 0.55, ease: E.io }, SPLIT_OUT);
      tl.to("#faceShade", { autoAlpha: 1, duration: 0.55 }, SPLIT_OUT);
      tl.to("#vitrine", { autoAlpha: 0, duration: 0.3 }, SPLIT_OUT);
      tl.to("#splitBg", { autoAlpha: 0, duration: 0.5 }, SPLIT_OUT);
      tl.to("#caps", { y: 0, duration: 0.55, ease: E.io }, SPLIT_OUT);

      // ── DESIGN ──
      punch(${T(424.47)}, 1.07, 0.7, 1.02);
      tl.fromTo("#designWord", { autoAlpha: 0, scale: 1.3, y: 20 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.45, ease: E.o }, ${T(424.47)});
      tl.fromTo("#designLine", { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, autoAlpha: 1, duration: 0.5, ease: E.o }, ${f2(T(424.47) + 0.15)});

      // ── CTA ──
      const C = ${END_VOICE};
      tl.to("#faceCam, #designWord, #designLine", { autoAlpha: 0, duration: 0.3 }, C - 0.05);
      tl.fromTo("#cta", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, C - 0.05);
      tl.fromTo("#ctaIcon", { autoAlpha: 0, scale: 0.5, rotation: -90 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.7, ease: E.o }, C + 0.05);
      tl.fromTo("#ctaKicker", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: E.o }, C + 0.2);
      tl.fromTo("#ctaHead", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: E.o }, C + 0.3);
      tl.fromTo("#ctaCard", { autoAlpha: 0, rotationX: 28, y: 120, scale: 0.86 }, { autoAlpha: 1, rotationX: 0, y: 0, scale: 1, duration: 0.9, ease: E.o }, C + 0.45);
      tl.fromTo("#play", { scale: 0 }, { scale: 1, duration: 0.5, ease: "back.out(2.5)" }, C + 1.1);
      tl.to("#play", { scale: 1.1, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 5 }, C + 1.7);
      tl.fromTo("#bio", { autoAlpha: 0, y: 40, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(2)" }, C + 0.95);
      tl.to("#bio svg", { y: -10, duration: 0.35, ease: "sine.inOut", yoyo: true, repeat: 7 }, C + 1.5);
      tl.to("#ctaCard", { scale: 1.03, duration: 3.5, ease: "sine.inOut" }, C + 1.4);

      // ── legendas palavra por palavra ──
      GROUPS.forEach((gr, i) => {
        tl.set("#cap-" + i, { autoAlpha: 1 }, gr.s);
        tl.set("#cap-" + i, { autoAlpha: 0 }, gr.e);
        gr.w.forEach((t, j) => {
          const el = "#w-" + i + "-" + j;
          tl.fromTo(el, { autoAlpha: 0, y: 26, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.22, ease: "back.out(2.6)", immediateRender: false }, t);
        });
      });

      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;

// ── SFX (start = momento - latência do som) ───────────────────────────────────
const LAT = { "chime": 0.42, "ping": 0.31, "pop": 0.04, "click": 0.045, "click-soft": 0.045, "whoosh-short": 0.07, "whoosh": 0.07, "impact-bass-1": 0.04, "key-press": 0.07, "notification": 0.09 };
const DUR = { "chime": 2.54, "ping": 1.32, "pop": 0.72, "click": 0.36, "click-soft": 0.36, "whoosh-short": 0.57, "whoosh": 0.57, "impact-bass-1": 2.1, "key-press": 0.43, "notification": 2.4 };
const sfx = [
  ["impact-bass-1", 0.02, 0.3],
  ["pop", T(3.6), 0.3],
  ["click", T(6.56), 0.35],
  ["whoosh-short", T(9.7), 0.3],
  ["ping", T(10.6), 0.22],
  ["click-soft", T(12.4), 0.4],
  ["whoosh", SCREEN_IN - 0.25, 0.42],
  ["click-soft", T(341.63), 0.4], ["click-soft", T(342.75), 0.4], ["click-soft", T(344.27), 0.4],
  ["pop", T(346.91), 0.3],
  ["whoosh-short", T(348.6), 0.28],
  ["click", T(350.83), 0.3],
  ["key-press", T(360.11), 0.45], ["key-press", T(361.15), 0.45], ["key-press", T(362.51), 0.45],
  ["click-soft", T(367.78) + 0.05, 0.4], ["click-soft", T(367.78) + 0.65, 0.4], ["click-soft", T(367.78) + 1.25, 0.4],
  ["ping", T(368.98) + 0.75, 0.25],
  ["chime", T(372.42), 0.22],
  ["whoosh", SCREEN_OUT - 0.1, 0.42],
  ["pop", T(395.3), 0.25],
  ["whoosh-short", T(405.86) - 0.3, 0.32],
  ["pop", T(409.78), 0.3],
  ["click-soft", T(415.38), 0.4], ["click-soft", T(417.38), 0.4], ["click-soft", T(419.54), 0.4],
  ["whoosh-short", cuts.find((c) => c.id === "c10").t0 - 0.05, 0.3],
  ["impact-bass-1", T(424.47), 0.35],
  ["whoosh", END_VOICE - 0.1, 0.42],
  ["notification", END_VOICE + 0.95, 0.3],
];
const sfxHtml = sfx.map(([n, t, v], i) => {
  const s = f2(Math.max(0, t - LAT[n]));
  const d = f2(Math.min(DUR[n], TOTAL - s));
  return `<audio id="sfx-${i}" src="assets/sfx/${n}.mp3" data-start="${s}" data-duration="${d}" data-track-index="${4 + (i % 3)}" data-volume="${v}"></audio>`;
}).join("\n      ");

fs.writeFileSync(`${P}/index.html`, html.replace("__SFX__", sfxHtml));
console.log("ok", { TOTAL, groups: groups.length, words: capWords.length, facePan: facePan.map((s) => s.keys.length) });
