// Gera index.html da intro a partir dos paths vetoriais da logo (texto já em curvas no PDF).
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

// Geometria exata dos 3 blocos (unidades do SVG original): mobile 10x20, tablet 20x20, desktop 40x20
const B = { y: 43, h: 20, r: 5, m: { x: 167.910156, w: 10 }, t: { x: 184.574219, w: 20 }, d: { x: 211.242188, w: 40 } };

// Câmera = viewBox 16:9. Final: logo centralizada com ~1100px de largura em 1920.
const vb = (cx, cy, w) => { const h = (w * 9) / 16; return `${+(cx - w / 2).toFixed(3)} ${+(cy - h / 2).toFixed(3)} ${+w.toFixed(3)} ${+h.toFixed(3)}`; };
const CY = 53;
const cam = {
  mobile: vb(B.m.x + 5, CY, 150),
  tablet: vb((B.m.x + B.t.x + B.t.w) / 2, CY, 190),
  desktop: vb((B.m.x + B.d.x + B.d.w) / 2, CY, 250),
  full: vb(246.2, CY, 702),
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
            <rect class="blk" id="blk-mobile" x="${B.m.x}" y="${B.y}" width="${B.m.w}" height="${B.h}" rx="${B.r}" />
            <rect class="blk" id="blk-tablet" x="${B.t.x}" y="${B.y}" width="${B.t.w}" height="${B.h}" rx="${B.r}" />
            <rect class="blk" id="blk-desktop" x="${B.d.x}" y="${B.y}" width="${B.d.w}" height="${B.h}" rx="${B.r}" />
          </g>
          <g id="word-responsivo">
          ${g(resp, "ltr r")}
          </g>
        </svg>
      </div>

      <!-- SFX (biblioteca embutida do HyperFrames media-use) -->
      <audio id="sfx-pop" src="assets/sfx/pop.mp3" data-start="0.30" data-duration="0.72" data-track-index="1" data-volume="0.4"></audio>
      <audio id="sfx-click-tablet" src="assets/sfx/click-soft.mp3" data-start="0.95" data-duration="0.36" data-track-index="2" data-volume="0.6"></audio>
      <audio id="sfx-click-desktop" src="assets/sfx/click-soft.mp3" data-start="1.55" data-duration="0.36" data-track-index="3" data-volume="0.65"></audio>
      <audio id="sfx-whoosh" src="assets/sfx/whoosh-short.mp3" data-start="2.02" data-duration="0.57" data-track-index="4" data-volume="0.45"></audio>
      <audio id="sfx-chime" src="assets/sfx/chime.mp3" data-start="2.6" data-duration="2.4" data-track-index="5" data-volume="0.4"></audio>
    </div>

    <script>
      // Câmera (viewBox) por estado: mobile → tablet → desktop → logo inteira → push-in lento
      const CAM = ${JSON.stringify(cam)};
      const B = ${JSON.stringify(B)};
      const tl = gsap.timeline({ paused: true });

      // 1. Mobile nasce (0.30–0.85)
      tl.fromTo("#blk-mobile", { autoAlpha: 0, attr: { y: B.y + 6, height: B.h - 12 } },
        { autoAlpha: 1, attr: { y: B.y, height: B.h }, duration: 0.55, ease: "power3.out" }, 0.3);

      // 2. Tablet se estica a partir do mobile (0.95–1.45)
      tl.fromTo("#blk-tablet", { autoAlpha: 0, attr: { x: B.m.x, width: B.m.w } },
        { autoAlpha: 1, attr: { x: B.t.x, width: B.t.w }, duration: 0.5, ease: "expo.out" }, 0.95);
      tl.fromTo("#logo", { attr: { viewBox: CAM.mobile } },
        { attr: { viewBox: CAM.tablet }, duration: 0.6, ease: "power2.inOut" }, 0.9);

      // 3. Desktop se estica a partir do tablet (1.55–2.05)
      tl.fromTo("#blk-desktop", { autoAlpha: 0, attr: { x: B.t.x, width: B.t.w } },
        { autoAlpha: 1, attr: { x: B.d.x, width: B.d.w }, duration: 0.5, ease: "expo.out" }, 1.55);
      tl.to("#logo", { attr: { viewBox: CAM.desktop }, duration: 0.55, ease: "power2.inOut" }, 1.5);

      // 4. Câmera abre para a logo inteira (2.05–2.95)
      tl.to("#logo", { attr: { viewBox: CAM.full }, duration: 0.9, ease: "power3.inOut" }, 2.05);

      // 5. Letras entram em cascata a partir dos blocos (2.35–3.1)
      tl.fromTo("#word-studio .s", { autoAlpha: 0, y: 4 },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: { each: 0.04, from: "end" } }, 2.35);
      tl.fromTo("#word-responsivo .r", { autoAlpha: 0, y: 4 },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: { each: 0.035, from: "start" } }, 2.35);

      // 6. Push-in lento até o fim (2.95–5.0)
      tl.to("#logo", { attr: { viewBox: CAM.push }, duration: 2.05, ease: "sine.inOut" }, 2.95);

      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
fs.writeFileSync(`${P}/index.html`, html);
console.log("ok", cam);
