// Vinheta/intro do canal EA FC — motion design com o escudo do Club América, o Théo em recortes e só o nome "Théo".
// Linguagem: painéis diagonais, círculos, anel que se desenha, íris, silhueta chapada, duotone — amarelo + azul-marinho.
// Uma timeline GSAP pausada (seek-safe). Áudio é mixado pelo bin (eafc/bin/vinheta.mjs) em assets/media/mix.m4a — só biblioteca/sintetizado.

const f2 = (n) => +(+n).toFixed(3);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export const DEFAULTS = {
  duration: 7.0,
  fps: 60,
  text: "Théo",
  colors: { yellow: "#F9D616", navy: "#0A1F44", ink: "#06101F", cream: "#F4EFE2" },
  beats: { wipe1: 0.75, crest: 1.10, wipe2: 1.90, player: 2.05, iris: 2.95, close: 4.15, lockup: 4.40, out: 6.40 },
  grain: 0.12,
};

export function composeVinheta(specIn, ctx = {}) {
  const spec = { ...DEFAULTS, ...specIn, colors: { ...DEFAULTS.colors, ...(specIn.colors || {}) }, beats: { ...DEFAULTS.beats, ...(specIn.beats || {}) } };
  const W = 1920, H = 1080, T = spec.duration, B = spec.beats, C = spec.colors, FR = 1 / spec.fps;
  const img = ctx.images || {}; // { crest, player, face }
  const js = [], proof = [], audio = [], log = [];
  for (const k of ["crest", "player", "face"]) if (!img[k]) log.push(`⚠ falta imagem "${k}" no spec (images.${k})`);

  // grão determinístico
  const r = rng(20261004);
  const grainKf = [];
  for (let i = 0; i < Math.ceil(T * 12); i++) grainKf.push({ x: Math.round(r() * 512), y: Math.round(r() * 512), duration: f2(1 / 12), ease: "steps(1)" });
  const noiseSvg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch' seed='9'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`);

  // ── S0: ponto → barra → amarelo toma a tela ───────────────────────────────────
  js.push(`tl.set("#dot", { autoAlpha: 1, scale: 0 }, 0.04);
  tl.to("#dot", { scale: 1, duration: 0.26, ease: "back.out(2.4)" }, 0.04);
  tl.set("#bar", { autoAlpha: 1, scaleX: ${f2(36 / W)} }, 0.34);
  tl.to("#bar", { scaleX: 1, duration: 0.26, ease: "power4.inOut" }, 0.34);
  tl.set("#dot", { autoAlpha: 0 }, 0.37);
  tl.set("#fill", { autoAlpha: 1, scaleY: ${f2(36 / H)} }, ${f2(B.wipe1 - 0.2)});
  tl.to("#fill", { scaleY: 1, duration: 0.22, ease: "power3.in" }, ${f2(B.wipe1 - 0.2)});
  tl.set("#sYellow", { autoAlpha: 1 }, ${f2(B.wipe1)});
  tl.set("#bar, #fill", { autoAlpha: 0 }, ${f2(B.wipe1 + FR)});`);
  proof.push(0.22, 0.5, B.wipe1 - 0.08);
  audio.push({ file: "sfx/whoosh-cinematic.mp3", at: 0.0, trim: 1.55, dur: 1.6, gain: 0.8, fadeIn: 0.05, fadeOut: 0.45 });

  // ── S1: anel se desenha, escudo entra, anel explode ───────────────────────────
  const ringLen = f2(2 * Math.PI * 250);
  js.push(`tl.set("#ring1", { autoAlpha: 1, rotation: -90 }, ${f2(B.wipe1 + 0.02)});
  tl.fromTo("#ring1c", { attr: { "stroke-dashoffset": ${ringLen} } }, { attr: { "stroke-dashoffset": 0 }, duration: 0.42, ease: "power2.inOut" }, ${f2(B.wipe1 + 0.02)});
  tl.set("#crestPlate", { autoAlpha: 1 }, ${f2(B.crest)});
  tl.fromTo("#crestPlate", { scale: 0.2 }, { scale: 1, duration: 0.34, ease: "back.out(1.9)" }, ${f2(B.crest)});
  tl.set("#crest1", { autoAlpha: 1 }, ${f2(B.crest + 0.03)});
  tl.fromTo("#crest1", { scale: 0.35, rotation: -28 }, { scale: 1, rotation: 0, duration: 0.42, ease: "back.out(1.7)" }, ${f2(B.crest + 0.03)});
  tl.set("#burst1", { autoAlpha: 1 }, ${f2(B.crest + 0.1)});
  tl.fromTo("#burst1", { scale: 0.3, opacity: 0.9 }, { scale: 1.6, opacity: 0, duration: 0.5, ease: "power2.out" }, ${f2(B.crest + 0.1)});
  tl.to("#ring1", { scale: 2.3, autoAlpha: 0, duration: 0.5, ease: "power3.out" }, ${f2(B.crest + 0.18)});
  tl.to("#crest1", { scale: 1.08, duration: ${f2(B.wipe2 - B.crest - 0.45)}, ease: "none" }, ${f2(B.crest + 0.45)});
  tl.to("#crestPlate", { scale: 1.08, duration: ${f2(B.wipe2 - B.crest - 0.45)}, ease: "none" }, ${f2(B.crest + 0.45)});
  tl.to("#crest1, #crestPlate", { scale: 0, duration: 0.22, ease: "power3.in" }, ${f2(B.wipe2 - 0.02)});`);
  proof.push(B.wipe1 + 0.25, B.crest + 0.12, B.crest + 0.4, B.wipe2 - 0.2);
  audio.push({ file: "sfx/impact-bass-2.mp3", at: B.crest, gain: 0.9 });
  audio.push({ file: "media/boom.wav", at: B.crest, gain: 0.6 });

  // ── S2: painel diagonal marinho + faixa amarela; Théo de corpo inteiro com silhueta e círculo ──
  js.push(`tl.set("#panelNavy", { autoAlpha: 1, xPercent: -125 }, ${f2(B.wipe2 - 0.05)});
  tl.to("#panelNavy", { xPercent: 0, duration: 0.30, ease: "power3.inOut" }, ${f2(B.wipe2 - 0.05)});
  tl.set("#panelStripe", { autoAlpha: 1, xPercent: -125 }, ${f2(B.wipe2 - 0.05)});
  tl.to("#panelStripe", { xPercent: 125, duration: 0.42, ease: "power3.inOut" }, ${f2(B.wipe2 - 0.05 + 3 * FR)});
  tl.set("#sNavy", { autoAlpha: 1 }, ${f2(B.wipe2 + 0.22)});
  tl.set("#sYellow", { autoAlpha: 0 }, ${f2(B.wipe2 + 0.26)});
  tl.set("#panelNavy", { autoAlpha: 0 }, ${f2(B.wipe2 + 0.27)});
  tl.set("#panelStripe", { autoAlpha: 0 }, ${f2(B.wipe2 + 0.45)});
  tl.set("#circ2", { autoAlpha: 1 }, ${f2(B.player)});
  tl.fromTo("#circ2", { scale: 0 }, { scale: 1, duration: 0.5, ease: "back.out(1.6)" }, ${f2(B.player)});
  tl.set("#silh", { autoAlpha: 1 }, ${f2(B.player + 0.04)});
  tl.fromTo("#silh", { x: 520 }, { x: -46, duration: 0.5, ease: "power4.out" }, ${f2(B.player + 0.04)});
  tl.set("#player", { autoAlpha: 1 }, ${f2(B.player + 0.08)});
  tl.fromTo("#player", { x: 560 }, { x: 0, duration: 0.5, ease: "power4.out" }, ${f2(B.player + 0.08)});
  tl.fromTo("#grp2", { x: 0 }, { x: -26, duration: ${f2(B.iris - B.player)}, ease: "none" }, ${f2(B.player)});
  tl.set("#bars2", { autoAlpha: 1 }, ${f2(B.player + 0.1)});
  tl.fromTo("#bar2a", { xPercent: -130 }, { xPercent: 0, duration: 0.45, ease: "power4.out" }, ${f2(B.player + 0.10)});
  tl.fromTo("#bar2b", { xPercent: -130 }, { xPercent: 0, duration: 0.45, ease: "power4.out" }, ${f2(B.player + 0.16)});
  tl.fromTo("#bar2c", { xPercent: -130 }, { xPercent: 0, duration: 0.45, ease: "power4.out" }, ${f2(B.player + 0.22)});`);
  proof.push(B.wipe2 + 0.1, B.player + 0.12, B.player + 0.45, B.iris - 0.1);
  audio.push({ file: "sfx/whoosh-short.mp3", at: B.wipe2 - 0.05, gain: 0.7 });
  audio.push({ file: "sfx/impact-bass-1.mp3", at: B.player + 0.08, gain: 0.7 });

  // ── S3: íris amarela → rosto em duotone num círculo marinho, anel tracejado girando, barras ──
  js.push(`tl.set("#sIris", { autoAlpha: 1, clipPath: "circle(0px at 1180px 520px)" }, ${f2(B.iris - 0.02)});
  tl.to("#sIris", { clipPath: "circle(1500px at 1180px 520px)", duration: 0.38, ease: "power3.inOut" }, ${f2(B.iris - 0.02)});
  tl.set("#sNavy", { autoAlpha: 0 }, ${f2(B.iris + 0.38)});
  tl.set("#faceDisc", { autoAlpha: 1 }, ${f2(B.iris + 0.06)});
  tl.fromTo("#faceDisc", { scale: 0.6 }, { scale: 1, duration: 0.5, ease: "back.out(1.5)" }, ${f2(B.iris + 0.06)});
  tl.fromTo("#faceImg", { scale: 1.14, y: 24 }, { scale: 1.02, y: 0, duration: ${f2(B.close - B.iris)}, ease: "power1.out" }, ${f2(B.iris + 0.06)});
  tl.set("#ring3", { autoAlpha: 1 }, ${f2(B.iris + 0.1)});
  tl.fromTo("#ring3", { rotation: -40, scale: 0.8 }, { rotation: 70, scale: 1, duration: ${f2(B.close - B.iris)}, ease: "power1.out" }, ${f2(B.iris + 0.1)});
  tl.set("#ring3b", { autoAlpha: 1 }, ${f2(B.iris + 0.14)});
  tl.fromTo("#ring3b", { rotation: 30 }, { rotation: -60, duration: ${f2(B.close - B.iris)}, ease: "power1.out" }, ${f2(B.iris + 0.14)});
  tl.set("#bars3", { autoAlpha: 1 }, ${f2(B.iris + 0.12)});
  tl.fromTo("#bar3a", { xPercent: 140 }, { xPercent: 0, duration: 0.5, ease: "power4.out" }, ${f2(B.iris + 0.12)});
  tl.fromTo("#bar3b", { xPercent: 140 }, { xPercent: 0, duration: 0.5, ease: "power4.out" }, ${f2(B.iris + 0.18)});
  tl.fromTo("#bar3c", { xPercent: 140 }, { xPercent: 0, duration: 0.5, ease: "power4.out" }, ${f2(B.iris + 0.24)});
  tl.set("#crest3", { autoAlpha: 1 }, ${f2(B.iris + 0.3)});
  tl.fromTo("#crest3", { scale: 0, rotation: 40 }, { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(1.8)" }, ${f2(B.iris + 0.3)});`);
  proof.push(B.iris + 0.12, B.iris + 0.5, B.close - 0.15);
  audio.push({ file: "sfx/whoosh-short.mp3", at: B.iris - 0.03, gain: 0.6 });
  audio.push({ file: "sfx/sparkle.mp3", at: B.iris + 0.3, gain: 0.35 });

  // ── S4: fecha em marinho (duas metades) → escudo + nome ─────────────────────
  const t0 = B.lockup;
  js.push(`tl.set("#shutTop, #shutBot", { autoAlpha: 1 }, ${f2(B.close)});
  tl.fromTo("#shutTop", { yPercent: -100 }, { yPercent: 0, duration: 0.26, ease: "power4.inOut" }, ${f2(B.close)});
  tl.fromTo("#shutBot", { yPercent: 100 }, { yPercent: 0, duration: 0.26, ease: "power4.inOut" }, ${f2(B.close)});
  tl.set("#sFinal", { autoAlpha: 1 }, ${f2(B.close + 0.26)});
  tl.set("#sIris", { autoAlpha: 0 }, ${f2(B.close + 0.27)});
  tl.set("#shutTop, #shutBot", { autoAlpha: 0 }, ${f2(B.close + 0.28)});
  tl.fromTo("#finalRays", { opacity: 0 }, { opacity: 0.5, duration: 0.6, ease: "power2.out" }, ${f2(t0)});
  tl.fromTo("#finalRays", { rotate: 2 }, { rotate: -2, duration: ${f2(T - t0)}, ease: "none" }, ${f2(t0)});
  tl.set("#crestF", { autoAlpha: 1 }, ${f2(t0)});
  tl.fromTo("#crestF", { scale: 1.5, rotation: -14 }, { scale: 1, rotation: 0, duration: 0.42, ease: "power4.out" }, ${f2(t0)});
  tl.set("#burstF", { autoAlpha: 1 }, ${f2(t0)});
  tl.fromTo("#burstF", { scale: 0.4, opacity: 1 }, { scale: 2.2, opacity: 0, duration: 0.7, ease: "power2.out" }, ${f2(t0)});
  tl.set("#ringF", { autoAlpha: 1 }, ${f2(t0 + 0.05)});
  tl.fromTo("#ringF", { scale: 0.5, opacity: 0.9 }, { scale: 1.9, opacity: 0, duration: 0.6, ease: "power3.out" }, ${f2(t0 + 0.05)});
  tl.set("#nameWrap", { autoAlpha: 1 }, ${f2(t0 + 0.16)});
  tl.fromTo("#nameTxt", { x: -520 }, { x: 0, duration: 0.6, ease: "power4.out" }, ${f2(t0 + 0.16)});
  tl.fromTo("#ruleF", { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power3.inOut" }, ${f2(t0 + 0.5)});
  tl.set("#shine", { autoAlpha: 1 }, ${f2(t0 + 0.95)});
  tl.fromTo("#shine", { backgroundPosition: "180% 0" }, { backgroundPosition: "-80% 0", duration: 0.7, ease: "power1.inOut" }, ${f2(t0 + 0.95)});
  tl.set("#shine", { autoAlpha: 0 }, ${f2(t0 + 1.66)});
  tl.fromTo("#lockup", { scale: 1, x: 112 }, { scale: 1.035, x: 112, duration: ${f2(T - t0)}, ease: "none" }, ${f2(t0)});
  tl.to("#crestF", { rotation: 3, duration: ${f2(T - t0 - 0.42)}, ease: "none" }, ${f2(t0 + 0.42)});
  tl.set("#dots", { autoAlpha: 1 }, ${f2(t0 + 0.3)});
  tl.fromTo("#dots", { rotation: 0 }, { rotation: 28, duration: ${f2(T - t0)}, ease: "none" }, ${f2(t0 + 0.3)});`);
  proof.push(B.close + 0.12, t0 + 0.08, t0 + 0.45, t0 + 1.2, t0 + 1.9);
  audio.push({ file: "sfx/whoosh-short.mp3", at: B.close - 0.02, gain: 0.6 });
  audio.push({ file: "sfx/impact-bass-2.mp3", at: t0, gain: 1.0 });
  audio.push({ file: "media/boom.wav", at: t0, gain: 1.0 });
  audio.push({ file: "sfx/sparkle.mp3", at: t0 + 0.9, gain: 0.55 });

  // ── S5: saída — painel amarelo e depois preto ────────────────────────────────
  js.push(`tl.set("#outYellow", { autoAlpha: 1, xPercent: 125 }, ${f2(B.out)});
  tl.to("#outYellow", { xPercent: 0, duration: 0.26, ease: "power3.inOut" }, ${f2(B.out)});
  tl.set("#outBlack", { autoAlpha: 1, xPercent: 125 }, ${f2(B.out + 4 * FR)});
  tl.to("#outBlack", { xPercent: 0, duration: 0.26, ease: "power3.inOut" }, ${f2(B.out + 4 * FR)});
  tl.set("#sFinal", { autoAlpha: 0 }, ${f2(B.out + 0.34)});
  tl.set("#outYellow", { autoAlpha: 0 }, ${f2(B.out + 0.36)});`);
  proof.push(B.out + 0.1, B.out + 0.4);
  audio.push({ file: "sfx/whoosh-short.mp3", at: B.out - 0.02, gain: 0.7 });
  audio.push({ file: "sfx/impact-bass-1.mp3", at: B.out + 0.2, gain: 0.6 });

  // camas
  audio.push({ file: "media/drone.wav", at: 0, gain: 1.6 });
  audio.push({ file: "sfx/riser.mp3", at: f2(t0 - 3.6), trim: 0, dur: 3.65, gain: 1.0, fadeIn: 0.4, fadeOut: 0.08 });

  js.push(`tl.to("#grain", { keyframes: ${JSON.stringify(grainKf)} }, 0);`);

  // ── HTML ─────────────────────────────────────────────────────────────────────
  const fonts = `
      @font-face { font-family: "Playfair"; font-weight: 700; font-style: italic; src: url(assets/fonts/playfair-display-latin-700-italic.woff2) format("woff2"); }
      @font-face { font-family: "Playfair"; font-weight: 400; font-style: italic; src: url(assets/fonts/playfair-display-latin-400-italic.woff2) format("woff2"); }`;
  const css = `
      :root { --y: ${C.yellow}; --navy: ${C.navy}; --ink: ${C.ink}; --cream: ${C.cream}; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #000; }
      #stage { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: var(--navy); color: #fff; font-family: "Playfair", serif; }
      .layer { position: absolute; inset: 0; }
      .scene { position: absolute; inset: 0; opacity: 0; visibility: hidden; }
      .hid { opacity: 0; visibility: hidden; }
      .stripes { position: absolute; inset: 0; background: repeating-linear-gradient(-14deg, rgba(249,214,22,.07) 0 2px, transparent 2px 30px); }
      .stripesN { position: absolute; inset: 0; background: repeating-linear-gradient(-14deg, rgba(10,31,68,.08) 0 2px, transparent 2px 30px); }
      #dot { position: absolute; left: 50%; top: 50%; width: 36px; height: 36px; margin: -18px 0 0 -18px; border-radius: 18px; background: var(--y); box-shadow: 0 0 30px rgba(249,214,22,.6); }
      #bar { position: absolute; left: 0; top: 50%; width: ${W}px; height: 36px; margin-top: -18px; border-radius: 18px; background: var(--y); box-shadow: 0 0 40px rgba(249,214,22,.5); transform-origin: 50% 50%; }
      #fill { position: absolute; inset: 0; background: var(--y); transform-origin: 50% 50%; }
      #sYellow { background: var(--y); }
      #ring1 { position: absolute; left: 50%; top: 50%; width: 560px; height: 560px; margin: -280px 0 0 -280px; }
      #ring1c { fill: none; stroke: var(--navy); stroke-width: 16; stroke-linecap: round; stroke-dasharray: ${ringLen}; }
      #crestPlate { position: absolute; left: 50%; top: 50%; width: 470px; height: 470px; margin: -235px 0 0 -235px; border-radius: 50%; background: var(--navy); box-shadow: 0 30px 80px rgba(6,16,31,.35); }
      #crest1 { position: absolute; left: 50%; top: 50%; width: 420px; height: 420px; margin: -210px 0 0 -210px; }
      .crestImg { width: 100%; height: 100%; object-fit: contain; display: block; }
      #burst1 { position: absolute; left: 50%; top: 50%; width: 900px; height: 900px; margin: -450px 0 0 -450px; border-radius: 50%; background: radial-gradient(closest-side, rgba(255,255,255,.75), rgba(255,255,255,0)); }
      .panel { position: absolute; left: -35%; top: -40%; width: 170%; height: 180%; transform: rotate(-14deg); transform-origin: 50% 50%; }
      #panelNavy { background: var(--navy); }
      #panelStripe { background: linear-gradient(90deg, transparent 0 44%, var(--y) 44% 48%, transparent 48%); }
      #sNavy { background: var(--navy); }
      #grp2 { position: absolute; inset: 0; }
      #circ2 { position: absolute; left: 1180px; top: 560px; width: 760px; height: 760px; margin: -380px 0 0 -380px; border-radius: 50%; background: var(--y); }
      #silh { position: absolute; left: 1180px; top: 60px; width: 640px; height: 1036px; margin-left: -320px; background: var(--ink); -webkit-mask: url(${img.player || ""}) center / contain no-repeat; mask: url(${img.player || ""}) center / contain no-repeat; opacity: .9; }
      #player { position: absolute; left: 1180px; top: 60px; width: 640px; height: 1036px; margin-left: -320px; }
      #player img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 20px 40px rgba(0,0,0,.35)); }
      #bars2 { position: absolute; left: 120px; top: 430px; width: 620px; }
      #bars2 div { height: 22px; margin-bottom: 26px; background: var(--y); transform-origin: 0 50%; }
      #bar2b { width: 72%; } #bar2c { width: 44%; }
      #sIris { background: var(--y); }
      #faceDisc { position: absolute; left: 640px; top: 540px; width: 820px; height: 820px; margin: -410px 0 0 -410px; border-radius: 50%; background: var(--navy); overflow: hidden; }
      #faceImg { position: absolute; left: 50%; top: 50%; width: 900px; height: 815px; margin: -412px 0 0 -450px; transform-origin: 50% 30%; }
      #faceImg img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; filter: grayscale(1) contrast(1.2) brightness(1.1); }
      .duoY { position: absolute; inset: 0; background: #e2c231; mix-blend-mode: multiply; opacity: .85; }
      .duoN { position: absolute; inset: 0; background: var(--navy); mix-blend-mode: lighten; }
      #faceFade { position: absolute; left: 0; right: 0; bottom: 0; height: 240px; background: linear-gradient(to top, var(--navy) 18%, rgba(10,31,68,0)); }
      #ring3, #ring3b { position: absolute; left: 640px; top: 540px; width: 920px; height: 920px; margin: -460px 0 0 -460px; }
      #ring3 circle { fill: none; stroke: var(--navy); stroke-width: 10; stroke-dasharray: 420 160; stroke-linecap: round; }
      #ring3b { width: 1010px; height: 1010px; margin: -505px 0 0 -505px; }
      #ring3b circle { fill: none; stroke: var(--navy); stroke-width: 4; stroke-dasharray: 8 26; }
      #bars3 { position: absolute; right: 120px; top: 410px; width: 640px; display: flex; flex-direction: column; align-items: flex-end; }
      #bars3 div { height: 22px; margin-bottom: 26px; background: var(--navy); width: 100%; }
      #bar3b { width: 70% !important; } #bar3c { width: 42% !important; }
      #crest3 { position: absolute; right: 150px; top: 610px; width: 230px; height: 230px; }
      #shutTop, #shutBot { position: absolute; left: 0; right: 0; height: 50%; background: var(--navy); }
      #shutTop { top: 0; } #shutBot { bottom: 0; }
      #sFinal { background: radial-gradient(ellipse 70% 80% at 40% 45%, #11295a 0%, var(--navy) 45%, var(--ink) 100%); }
      .rays { position: absolute; left: 40%; top: -40%; width: 2600px; height: 2600px; margin-left: -1300px; transform-origin: 50% 0; mix-blend-mode: screen; opacity: 0;
        background: repeating-conic-gradient(from -9deg at 50% 0%, rgba(249,214,22,0) 0deg, rgba(249,214,22,.14) 2.5deg, rgba(249,214,22,0) 6deg, rgba(249,214,22,0) 11deg);
        -webkit-mask-image: radial-gradient(ellipse 50% 60% at 50% 0%, #000 0%, rgba(0,0,0,.6) 40%, transparent 72%); mask-image: radial-gradient(ellipse 50% 60% at 50% 0%, #000 0%, rgba(0,0,0,.6) 40%, transparent 72%); }
      #lockup { position: absolute; inset: 0; transform-origin: 50% 50%; }
      #crestF { position: absolute; left: 430px; top: 540px; width: 360px; height: 360px; margin: -180px 0 0 -180px; filter: drop-shadow(0 20px 50px rgba(0,0,0,.5)); }
      #burstF { position: absolute; left: 430px; top: 540px; width: 1100px; height: 1100px; margin: -550px 0 0 -550px; border-radius: 50%; background: radial-gradient(closest-side, rgba(249,214,22,.6), rgba(249,214,22,0)); mix-blend-mode: screen; }
      #ringF { position: absolute; left: 430px; top: 540px; width: 520px; height: 520px; margin: -260px 0 0 -260px; border-radius: 50%; border: 6px solid var(--y); }
      #dots { position: absolute; left: 430px; top: 540px; width: 640px; height: 640px; margin: -320px 0 0 -320px; }
      #dots circle { fill: var(--y); }
      #nameWrap { position: absolute; left: 650px; top: 330px; width: 1200px; height: 420px; overflow: hidden; }
      #nameTxt, #shine { position: absolute; left: 0; top: 0; font: italic 700 320px/1.1 "Playfair"; letter-spacing: -.01em; white-space: nowrap; padding-left: 10px; }
      #nameTxt { color: transparent; background: linear-gradient(180deg, #fffdf2 0%, var(--y) 55%, #e4c21a 100%); -webkit-background-clip: text; background-clip: text; filter: drop-shadow(0 16px 40px rgba(0,0,0,.55)); }
      #shine { color: transparent; background: linear-gradient(105deg, rgba(255,255,255,0) 42%, rgba(255,255,255,.95) 50%, rgba(255,255,255,0) 58%); background-size: 280% 100%; background-position: 180% 0; -webkit-background-clip: text; background-clip: text; mix-blend-mode: screen; }
      #ruleF { position: absolute; left: 672px; top: 740px; width: 640px; height: 5px; background: linear-gradient(90deg, var(--y) 0%, var(--y) 60%, rgba(249,214,22,0) 100%); transform-origin: 0 50%; box-shadow: 0 0 20px rgba(249,214,22,.5); }
      .vig { position: absolute; inset: -2px; background: radial-gradient(ellipse 72% 66% at 50% 50%, rgba(0,0,0,0) 50%, rgba(2,6,16,.5) 100%); }
      #outYellow, #outBlack { position: absolute; left: -35%; top: -40%; width: 170%; height: 180%; transform: rotate(-14deg); }
      #outYellow { background: var(--y); } #outBlack { background: #000; }
      #grain { position: absolute; left: -600px; top: -600px; width: ${W + 1200}px; height: ${H + 1200}px; background: url("data:image/svg+xml,${noiseSvg}"); background-size: 512px 512px; mix-blend-mode: overlay; opacity: ${spec.grain}; pointer-events: none; }`;

  const dots = Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return `<circle cx="${f2(320 + 300 * Math.cos(a))}" cy="${f2(320 + 300 * Math.sin(a))}" r="${i % 3 === 0 ? 7 : 4}"/>`; }).join("");

  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>${fonts}
${css}
    </style>
  </head>
  <body>
    <div id="stage" data-composition-id="main" data-start="0" data-duration="${f2(T)}" data-width="${W}" data-height="${H}">
      <div class="stripes"></div>
      <div id="dot" class="hid"></div>
      <div id="bar" class="hid"></div>
      <div id="fill" class="hid"></div>

      <div id="sYellow" class="scene">
        <div class="stripesN"></div>
        <svg id="ring1" class="hid" viewBox="0 0 560 560"><circle id="ring1c" cx="280" cy="280" r="250"/></svg>
        <div id="burst1" class="hid"></div>
        <div id="crestPlate" class="hid"></div>
        <div id="crest1" class="hid"><img class="crestImg" src="${img.crest || ""}" alt=""></div>
      </div>
      <div id="panelNavy" class="panel hid"></div>
      <div id="panelStripe" class="panel hid"></div>

      <div id="sNavy" class="scene">
        <div class="stripes"></div>
        <div id="grp2">
          <div id="circ2" class="hid"></div>
          <div id="silh" class="hid"></div>
          <div id="player" class="hid"><img src="${img.player || ""}" alt=""></div>
          <div id="bars2" class="hid"><div id="bar2a"></div><div id="bar2b"></div><div id="bar2c"></div></div>
        </div>
      </div>

      <div id="sIris" class="scene">
        <div class="stripesN"></div>
        <svg id="ring3b" class="hid" viewBox="0 0 1010 1010"><circle cx="505" cy="505" r="490"/></svg>
        <svg id="ring3" class="hid" viewBox="0 0 920 920"><circle cx="460" cy="460" r="440"/></svg>
        <div id="faceDisc" class="hid"><div id="faceImg"><img src="${img.face || ""}" alt=""><div class="duoY"></div><div class="duoN"></div></div><div id="faceFade"></div></div>
        <div id="bars3" class="hid"><div id="bar3a"></div><div id="bar3b"></div><div id="bar3c"></div></div>
        <div id="crest3" class="hid"><img class="crestImg" src="${img.crest || ""}" alt=""></div>
      </div>
      <div id="shutTop" class="hid"></div>
      <div id="shutBot" class="hid"></div>

      <div id="sFinal" class="scene">
        <div id="finalRays" class="rays"></div>
        <div class="stripes"></div>
        <div id="lockup">
          <div id="burstF" class="hid"></div>
          <div id="ringF" class="hid"></div>
          <svg id="dots" class="hid" viewBox="0 0 640 640">${dots}</svg>
          <div id="crestF" class="hid"><img class="crestImg" src="${img.crest || ""}" alt=""></div>
          <div id="nameWrap" class="hid"><div id="nameTxt">${esc(spec.text)}</div><div id="shine" class="hid">${esc(spec.text)}</div></div>
          <div id="ruleF" style="transform:scaleX(0)"></div>
        </div>
        <div class="vig"></div>
      </div>

      <div id="outYellow" class="hid"></div>
      <div id="outBlack" class="hid"></div>
      <div id="grain"></div>
      <audio id="mix" src="assets/media/mix.m4a" data-start="0" data-duration="${f2(T)}" data-track-index="6" data-volume="1"></audio>
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      ${js.join("\n      ")}
      tl.set({}, {}, ${f2(T)});
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
  return { html, audio, proof: [...new Set(proof.map(f2))].sort((a, b) => a - b), log };
}
