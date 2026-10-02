// Gera index.html da intro a partir dos paths vetoriais da logo (texto já em curvas no PDF).
// Uso: node build.mjs
import fs from "node:fs";
const P = new URL(".", import.meta.url).pathname.replace(/\/$/, "");
const svg = fs.readFileSync(`${P}/assets/logo-studio-responsivo.svg`, "utf8");
const paths = [...svg.matchAll(/<path[^>]*fill="([^"]+)"[^>]*d="([^"]+)"/g)].map((m) => ({
  fill: m[1],
  d: m[2].trim(),
  x: parseFloat(m[2].split(" ")[1]),
}));
const letters = paths.filter((p) => !p.fill.startsWith("rgb(12.")).sort((a, b) => a.x - b.x);
const studio = letters.filter((p) => p.x < 160);
const resp = letters.filter((p) => p.x > 260);
if (studio.length !== 6 || resp.length !== 10) throw new Error(`letters ${studio.length}/${resp.length}`);
const g = (arr, cls) => arr.map((p, i) => `<path class="${cls}" id="${cls}-${i}" d="${p.d}" />`).join("\n          ");

// ── Geometria exata dos blocos (unidades do SVG original) ──────────────────────
// Cada bloco: raio 5 em 3 cantos, canto INFERIOR ESQUERDO reto (marca da logo).
const Y = 43, H = 20, R = 5, K = 0.5523; // K = constante de arco em cúbica (igual ao arquivo)
const M = { x: 167.910156, w: 10 }; // mobile 10x20
const T = { x: 184.574219, w: 20 }; // tablet 20x20
const D = { x: 211.242188, w: 40 }; // desktop 40x20
const SPAN = { x: M.x, w: D.x + D.w - M.x }; // largura total dos 3 blocos juntos
const SEAM1 = (M.x + M.w + T.x) / 2; // centro do vão mobile|tablet
const SEAM2 = (T.x + T.w + D.x) / 2; // centro do vão tablet|desktop

// Path com raio por canto, sempre com a MESMA estrutura de comandos → o GSAP interpola o "d".
// r = [topoEsq, topoDir, baseDir, baseEsq]
const f = (n) => +n.toFixed(3);
function block(x, w, [tl, tr, br, bl] = [R, R, R, 0], y = Y, h = H) {
  const r = x + w, b = y + h;
  return [
    `M ${f(x + tl)} ${f(y)}`,
    `L ${f(r - tr)} ${f(y)}`,
    `C ${f(r - tr + K * tr)} ${f(y)} ${f(r)} ${f(y + tr - K * tr)} ${f(r)} ${f(y + tr)}`,
    `L ${f(r)} ${f(b - br)}`,
    `C ${f(r)} ${f(b - br + K * br)} ${f(r - br + K * br)} ${f(b)} ${f(r - br)} ${f(b)}`,
    `L ${f(x + bl)} ${f(b)}`,
    `C ${f(x + bl - K * bl)} ${f(b)} ${f(x)} ${f(b - bl + K * bl)} ${f(x)} ${f(b - bl)}`,
    `L ${f(x)} ${f(y + tl)}`,
    `C ${f(x)} ${f(y + tl - K * tl)} ${f(x + tl - K * tl)} ${f(y)} ${f(x + tl)} ${f(y)}`,
    "Z",
  ].join(" ");
}

const S = {
  // entrada do mobile: cresce de baixo pra cima
  mobileSeed: block(M.x, M.w, [R, R, R, 0], Y + H - 6, 6),
  mobile: block(M.x, M.w),
  tablet: block(M.x, T.w),
  full: block(SPAN.x, SPAN.w),
  // no instante do corte: 3 peças encostadas, cantos internos retos (soma = forma cheia)
  cutA: block(M.x, SEAM1 - M.x, [R, 0, 0, 0]),
  cutB: block(SEAM1, SEAM2 - SEAM1, [0, 0, 0, 0]),
  cutC: block(SEAM2, SPAN.x + SPAN.w - SEAM2, [0, R, R, 0]),
  // final: os 3 blocos exatos da logo
  A: block(M.x, M.w),
  B: block(T.x, T.w),
  C: block(D.x, D.w),
};

// ── Câmera = viewBox 16:9 ──────────────────────────────────────────────────────
const vb = (cx, cy, w) => { const h = (w * 9) / 16; return `${f(cx - w / 2)} ${f(cy - h / 2)} ${f(w)} ${f(h)}`; };
const CY = 53;
const cam = {
  mobile: vb(M.x + M.w / 2, CY, 140),
  tablet: vb(M.x + T.w / 2, CY, 160),
  full: vb(SPAN.x + SPAN.w / 2, CY, 230),
  logo: vb(246.2, CY, 702), // logo inteira ~1100px de largura
  push: vb(246.2, CY, 668),
};

const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <!-- GSAP local: o CDN jsdelivr é bloqueado no ambiente de render remoto -->
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      :root {
        --bg: #ffffff;
        --ink: #06070a;
        --brand: #1f6fe5;
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: var(--bg); }
      #stage { position: relative; width: 1920px; height: 1080px; background: var(--bg); }
      #logo { position: absolute; inset: 0; width: 1920px; height: 1080px; display: block; }
      .ltr { fill: var(--ink); }
      .blk { fill: var(--brand); }
      /* B e C só existem a partir do corte */
      #blk-b, #blk-c { opacity: 0; visibility: hidden; }
    </style>
  </head>
  <body>
    <div id="stage" data-composition-id="main" data-start="0" data-duration="5" data-width="1920" data-height="1080">
      <div id="logo-clip" class="clip" data-start="0" data-duration="5" data-track-index="0">
        <svg id="logo" viewBox="${cam.mobile}" preserveAspectRatio="xMidYMid meet" data-layout-allow-overflow="true" xmlns="http://www.w3.org/2000/svg">
          <g id="word-studio">
          ${g(studio, "ltr s")}
          </g>
          <g id="blocks">
            <path class="blk" id="blk-a" d="${S.mobile}" />
            <path class="blk" id="blk-b" d="${S.cutB}" />
            <path class="blk" id="blk-c" d="${S.cutC}" />
          </g>
          <g id="word-responsivo">
          ${g(resp, "ltr r")}
          </g>
        </svg>
      </div>

      <!-- SFX (biblioteca embutida do HyperFrames media-use) -->
      <audio id="sfx-pop" src="assets/sfx/pop.mp3" data-start="0.28" data-duration="0.72" data-track-index="1" data-volume="0.4"></audio>
      <audio id="sfx-stretch-tablet" src="assets/sfx/click-soft.mp3" data-start="0.95" data-duration="0.36" data-track-index="2" data-volume="0.55"></audio>
      <audio id="sfx-stretch-desktop" src="assets/sfx/whoosh-short.mp3" data-start="1.5" data-duration="0.57" data-track-index="3" data-volume="0.35"></audio>
      <audio id="sfx-cut" src="assets/sfx/click.mp3" data-start="2.3" data-duration="0.36" data-track-index="4" data-volume="0.5"></audio>
      <audio id="sfx-reveal" src="assets/sfx/whoosh-short.mp3" data-start="2.75" data-duration="0.57" data-track-index="5" data-volume="0.3"></audio>
      <audio id="sfx-chime" src="assets/sfx/chime.mp3" data-start="2.95" data-duration="2.05" data-track-index="6" data-volume="0.4"></audio>
    </div>

    <script>
      const S = ${JSON.stringify(S)};
      const CAM = ${JSON.stringify(cam)};
      const tl = gsap.timeline({ paused: true });


      // 1. Mobile nasce, crescendo de baixo pra cima (0.30–0.85)
      tl.fromTo("#blk-a", { autoAlpha: 0, attr: { d: S.mobileSeed } },
        { autoAlpha: 1, attr: { d: S.mobile }, duration: 0.55, ease: "power3.out" }, 0.3);

      // 2. Estica para tablet (0.95–1.45)
      tl.to("#blk-a", { attr: { d: S.tablet }, duration: 0.5, ease: "expo.inOut" }, 0.95);
      tl.fromTo("#logo", { attr: { viewBox: CAM.mobile } },
        { attr: { viewBox: CAM.tablet }, duration: 0.5, ease: "expo.inOut" }, 0.95);

      // 3. Estica até o tamanho final desktop (1.55–2.15)
      tl.to("#blk-a", { attr: { d: S.full }, duration: 0.6, ease: "expo.inOut" }, 1.55);
      tl.to("#logo", { attr: { viewBox: CAM.full }, duration: 0.6, ease: "expo.inOut" }, 1.55);

      // 4. Corte suave: troca invisível para 3 peças encostadas, depois os vãos abrem (2.30–2.85)
      tl.set("#blk-a", { attr: { d: S.cutA } }, 2.3);
      tl.set("#blk-b, #blk-c", { autoAlpha: 1 }, 2.3);
      tl.to("#blk-a", { attr: { d: S.A }, duration: 0.55, ease: "power3.inOut" }, 2.3);
      tl.fromTo("#blk-b", { attr: { d: S.cutB } }, { attr: { d: S.B }, duration: 0.55, ease: "power3.inOut" }, 2.3);
      tl.fromTo("#blk-c", { attr: { d: S.cutC } }, { attr: { d: S.C }, duration: 0.55, ease: "power3.inOut" }, 2.3);

      // 5. Câmera abre e os nomes aparecem depois do corte (2.85–3.75)
      tl.to("#logo", { attr: { viewBox: CAM.logo }, duration: 0.9, ease: "power3.inOut" }, 2.85);
      tl.fromTo("#word-studio .s", { autoAlpha: 0, x: 4 },
        { autoAlpha: 1, x: 0, duration: 0.55, ease: "power2.out", stagger: { each: 0.04, from: "end" } }, 3.05);
      tl.fromTo("#word-responsivo .r", { autoAlpha: 0, x: -4 },
        { autoAlpha: 1, x: 0, duration: 0.55, ease: "power2.out", stagger: { each: 0.035, from: "start" } }, 3.05);

      // 6. Push-in lento até o fim (3.75–5.0)
      tl.to("#logo", { attr: { viewBox: CAM.push }, duration: 1.25, ease: "sine.inOut" }, 3.75);

      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
fs.writeFileSync(`${P}/index.html`, html);
console.log("ok");
