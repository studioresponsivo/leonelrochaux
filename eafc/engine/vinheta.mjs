// Vinheta/intro do canal EA FC — gera a composição HyperFrames (HTML + GSAP) a partir do spec.
// Linguagem: cinema esportivo (serifa Didone, duotone amarelo/azul-marinho, grão, raios de luz, carimbo, glitch, whip).
// Tudo roda numa única timeline GSAP pausada (seek-safe). Áudio é mixado pelo bin (eafc/bin/vinheta.mjs) em assets/media/mix.m4a.

const f2 = (n) => +(+n).toFixed(3);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// PRNG determinístico (grão e glitch precisam ser iguais em toda renderização)
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export const DEFAULTS = {
  duration: 7.0,
  fps: 60,
  label: "MODO CARREIRA",
  number: "14",
  title: { first: "Théo", last: "TORRES" },
  subtitle: "MODO CARREIRA · CLUB AMÉRICA",
  colors: { yellow: "#F9D616", navy: "#0A1F44", ink: "#06101F", cream: "#F4EFE2" },
  beats: { tunnel: 0.40, shot: 1.60, net: 2.40, celeb: 3.60, title: 4.60, out: 6.75 },
  grain: 0.2,
};

export function composeVinheta(specIn, ctx = {}) {
  const spec = { ...DEFAULTS, ...specIn, title: { ...DEFAULTS.title, ...(specIn.title || {}) }, colors: { ...DEFAULTS.colors, ...(specIn.colors || {}) }, beats: { ...DEFAULTS.beats, ...(specIn.beats || {}) } };
  const W = 1920, H = 1080, T = spec.duration, B = spec.beats, C = spec.colors;
  const clips = ctx.clips || {}; // { shot: { file, dur }, ... } preparados pelo bin
  const img = ctx.images || {}; // { tunnel: "assets/img/x.jpg", portrait: ..., crest: ... }
  const js = [];
  const proof = [];
  const audio = [];
  const log = [];

  // ── grão: 12 saltos/s, offsets determinísticos ───────────────────────────────
  const r = rng(20261004);
  const grainKf = [];
  for (let i = 0; i < Math.ceil(T * 12); i++) grainKf.push({ x: Math.round(r() * 512), y: Math.round(r() * 512), duration: f2(1 / 12), ease: "steps(1)" });
  const noiseSvg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch' seed='9'/><feColorMatrix type='saturate' values='0'/><feComponentTransfer><feFuncA type='linear' slope='0.9'/></feComponentTransfer></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`);

  // ── cenas ─────────────────────────────────────────────────────────────────────
  // 0) preto + fenda de luz que abre e revela o túnel
  js.push(`tl.set("#slit", { autoAlpha: 1, scaleX: 0, scaleY: 1 }, 0.12);
  tl.to("#slit", { scaleX: 1, duration: 0.22, ease: "power3.out" }, 0.12);
  tl.to("#slit", { scaleY: 40, autoAlpha: 0.0, duration: 0.34, ease: "power2.in" }, ${f2(B.tunnel - 0.02)});
  tl.set("#sTunnel", { autoAlpha: 1, clipPath: "inset(49.6% 0 49.6% 0)" }, ${f2(B.tunnel - 0.02)});
  tl.to("#sTunnel", { clipPath: "inset(0% 0 0% 0)", duration: 0.34, ease: "power3.inOut" }, ${f2(B.tunnel - 0.02)});
  tl.fromTo("#tunnelImg", { scale: 1.0, y: 10 }, { scale: 1.09, y: -14, duration: ${f2(B.shot - B.tunnel + 0.1)}, ease: "none" }, ${f2(B.tunnel - 0.02)});
  tl.fromTo("#tunnelRays", { opacity: 0 }, { opacity: 0.55, duration: 0.6, ease: "power2.out" }, ${f2(B.tunnel + 0.1)});
  tl.fromTo("#tunnelRays", { rotate: -2 }, { rotate: 2, duration: ${f2(B.shot - B.tunnel)}, ease: "none" }, ${f2(B.tunnel)});
  tl.set("#lbl", { autoAlpha: 1 }, ${f2(B.tunnel + 0.22)});
  tl.fromTo("#lblBar", { scaleY: 0 }, { scaleY: 1, duration: 0.22, ease: "power3.out" }, ${f2(B.tunnel + 0.22)});
  tl.fromTo("#lblTxt", { xPercent: -104 }, { xPercent: 0, duration: 0.42, ease: "power4.out" }, ${f2(B.tunnel + 0.30)});
  tl.fromTo("#lblSub", { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: 0.35, ease: "power2.out" }, ${f2(B.tunnel + 0.55)});
  tl.to("#lbl", { autoAlpha: 0, duration: 0.08 }, ${f2(B.shot - 0.08)});
  tl.set("#sTunnel", { autoAlpha: 0 }, ${f2(B.shot)});`);
  proof.push(0.30, B.tunnel + 0.15, B.tunnel + 0.75, B.shot - 0.1);
  audio.push({ file: "sfx/whoosh-cinematic.mp3", at: 0.0, trim: 1.5, dur: 1.7, gain: 0.9, fadeIn: 0.05, fadeOut: 0.5 }); // pico do whoosh (2–3 s do arquivo) cai na abertura da fenda

  // 1) chute — corte seco com flash branco + aberração cromática; carimbo "14"
  const shotDur = f2(B.net - B.shot + 0.18);
  js.push(`tl.set("#sShot", { autoAlpha: 1 }, ${f2(B.shot)});
  tl.set("#flash", { autoAlpha: 0.95 }, ${f2(B.shot)});
  tl.to("#flash", { autoAlpha: 0, duration: 0.14, ease: "power2.out" }, ${f2(B.shot + 0.03)});
  tl.set("#shotMedia", { filter: "url(#chroma)" }, ${f2(B.shot)});
  tl.fromTo("#chR", { attr: { dx: -16 } }, { attr: { dx: 0 }, duration: 0.14, ease: "power2.out" }, ${f2(B.shot)});
  tl.fromTo("#chB", { attr: { dx: 16 } }, { attr: { dx: 0 }, duration: 0.14, ease: "power2.out" }, ${f2(B.shot)});
  tl.set("#shotMedia", { filter: "none" }, ${f2(B.shot + 0.15)});
  tl.fromTo("#shotMedia", { scale: 1.08 }, { scale: 1.0, duration: ${shotDur}, ease: "power1.out" }, ${f2(B.shot)});
  tl.set("#stamp", { autoAlpha: 1 }, ${f2(B.shot + 0.14)});
  tl.fromTo("#stampIn", { scale: 1.9, opacity: 0, filter: "blur(18px)" }, { scale: 1.0, opacity: 1, filter: "blur(0px)", duration: 0.16, ease: "power4.out" }, ${f2(B.shot + 0.14)});
  tl.set("#stampHit", { autoAlpha: 0.9 }, ${f2(B.shot + 0.26)});
  tl.to("#stampHit", { autoAlpha: 0, duration: 0.25, ease: "power2.out" }, ${f2(B.shot + 0.27)});
  tl.to("#stampIn", { scale: 1.05, duration: ${f2(B.net - B.shot - 0.3)}, ease: "none" }, ${f2(B.shot + 0.3)});
  // whip para a próxima cena
  tl.to("#sShot", { x: -260, duration: 0.17, ease: "power3.in" }, ${f2(B.net - 0.02)});
  tl.to("#mbShotG", { attr: { stdDeviation: "30 0" }, duration: 0.17, ease: "power2.in" }, ${f2(B.net - 0.02)});
  tl.set("#sShot", { autoAlpha: 0 }, ${f2(B.net + 0.16)});`);
  proof.push(B.shot + 0.04, B.shot + 0.3, B.net - 0.15);
  audio.push({ file: "sfx/impact-bass-1.mp3", at: B.shot, gain: 1.0 });
  audio.push({ file: "media/boom.wav", at: B.shot, gain: 0.8 });

  // 2) bola na rede em câmera lenta — entra com whip + blur, zoom lento
  js.push(`tl.set("#sNet", { autoAlpha: 1, x: 300 }, ${f2(B.net)});
  tl.set("#netMedia", { filter: "url(#mbNet)" }, ${f2(B.net)});
  tl.fromTo("#mbNetG", { attr: { stdDeviation: "34 0" } }, { attr: { stdDeviation: "0 0" }, duration: 0.24, ease: "power3.out" }, ${f2(B.net)});
  tl.to("#sNet", { x: 0, duration: 0.24, ease: "power4.out" }, ${f2(B.net)});
  tl.set("#netMedia", { filter: "none" }, ${f2(B.net + 0.25)});
  tl.fromTo("#netMedia", { scale: 1.04 }, { scale: 1.12, duration: ${f2(B.celeb - B.net)}, ease: "none" }, ${f2(B.net)});
  tl.fromTo("#netLeak", { opacity: 0 }, { opacity: 0.5, duration: 0.8, ease: "power1.inOut" }, ${f2(B.net + 0.2)});
  tl.set("#sNet", { autoAlpha: 0 }, ${f2(B.celeb)});`);
  proof.push(B.net + 0.06, B.net + 0.6);
  audio.push({ file: "sfx/whoosh-short.mp3", at: B.net - 0.05, gain: 0.6 });

  // 3) comemoração — glitch de 5 frames (fatias RGB entre o último frame da rede e o primeiro da comemoração), depois limpo
  const gr = rng(7);
  const slices = 7;
  const glitchJs = [];
  for (let fr = 0; fr < 5; fr++) {
    const t = f2(B.celeb + fr / spec.fps);
    for (let s = 0; s < slices; s++) {
      const useNew = gr() > (fr < 2 ? 0.55 : 0.25);
      const dx = Math.round((gr() - 0.5) * (fr < 3 ? 120 : 50));
      glitchJs.push(`tl.set("#gl${s}", { x: ${dx}, backgroundImage: "url(${useNew ? "assets/media/celeb-first.jpg" : "assets/media/net-last.jpg"})" }, ${t});`);
    }
    glitchJs.push(`tl.set("#glR", { x: ${Math.round((gr() - 0.5) * 40)}, opacity: ${fr < 3 ? 0.7 : 0.35} }, ${t}); tl.set("#glB", { x: ${Math.round((gr() - 0.5) * 40)}, opacity: ${fr < 3 ? 0.7 : 0.35} }, ${t});`);
  }
  js.push(`tl.set("#sCeleb", { autoAlpha: 1 }, ${f2(B.celeb)});
  tl.set("#glitch", { autoAlpha: 1 }, ${f2(B.celeb)});
  ${glitchJs.join("\n  ")}
  tl.set("#glitch", { autoAlpha: 0 }, ${f2(B.celeb + 5 / spec.fps)});
  tl.fromTo("#celebMedia", { scale: 1.0 }, { scale: 1.07, duration: ${f2(B.title - B.celeb)}, ease: "none" }, ${f2(B.celeb)});
  tl.fromTo("#celebLeak", { opacity: 0.0 }, { opacity: 0.7, duration: 0.5, ease: "power2.out" }, ${f2(B.celeb + 0.1)});
  tl.to("#celebLeak", { opacity: 0.25, duration: 0.5, ease: "power1.in" }, ${f2(B.celeb + 0.6)});
  tl.set("#sCeleb", { autoAlpha: 0 }, ${f2(B.title)});`);
  proof.push(B.celeb + 1 / spec.fps, B.celeb + 0.5);
  audio.push({ file: "sfx/glitch-1.mp3", at: B.celeb - 0.02, trim: 0.0, dur: 0.55, gain: 0.5, fadeOut: 0.2 });

  // 4) título — fundo marinho, raios, retrato duotone, lockup serifado com cromado e brilho
  const t0 = B.title;
  js.push(`tl.set("#sTitle", { autoAlpha: 1 }, ${f2(t0)});
  tl.set("#black", { autoAlpha: 1 }, ${f2(t0)}); tl.set("#black", { autoAlpha: 0 }, ${f2(t0 + 1 / spec.fps)});
  tl.fromTo("#titleRays", { opacity: 0, scale: 0.8 }, { opacity: 0.9, scale: 1, duration: 0.35, ease: "power3.out" }, ${f2(t0)});
  tl.to("#titleRays", { opacity: 0.55, duration: 1.2, ease: "power1.inOut" }, ${f2(t0 + 0.4)});
  tl.fromTo("#titleRays", { rotate: 3 }, { rotate: -3, duration: ${f2(T - t0)}, ease: "none" }, ${f2(t0)});
  tl.fromTo("#titleRays2", { rotate: -4 }, { rotate: 4, duration: ${f2(T - t0)}, ease: "none" }, ${f2(t0)});
  tl.fromTo("#portrait", { scale: 1.06, x: 36 }, { scale: 1.14, x: 0, duration: ${f2(T - t0)}, ease: "none" }, ${f2(t0)});
  tl.fromTo("#portrait", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" }, ${f2(t0)});
  tl.fromTo("#crest", { scale: 0.4, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "back.out(2.2)" }, ${f2(t0 + 0.04)});
  tl.fromTo("#tFirst", { yPercent: 110 }, { yPercent: 0, duration: 0.55, ease: "power4.out" }, ${f2(t0 + 0.08)});
  tl.fromTo("#tLast", { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: "power4.out" }, ${f2(t0 + 0.18)});
  tl.fromTo("#rule", { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power3.inOut" }, ${f2(t0 + 0.45)});
  tl.fromTo("#tSub", { opacity: 0, scaleX: 1.14, x: 18, transformOrigin: "0 50%" }, { opacity: 1, scaleX: 1, x: 0, duration: 0.6, ease: "power3.out" }, ${f2(t0 + 0.6)});
  tl.set("#shine", { autoAlpha: 1 }, ${f2(t0 + 1.0)});
  tl.fromTo("#shine", { backgroundPosition: "180% 0" }, { backgroundPosition: "-80% 0", duration: 0.7, ease: "power1.inOut" }, ${f2(t0 + 1.0)});
  tl.set("#shine", { autoAlpha: 0 }, ${f2(t0 + 1.72)});
  tl.fromTo("#lockup", { scale: 1 }, { scale: 1.035, duration: ${f2(T - t0)}, ease: "none" }, ${f2(t0)});`);
  proof.push(t0 + 0.1, t0 + 0.5, t0 + 1.15, t0 + 1.7);
  audio.push({ file: "sfx/impact-bass-2.mp3", at: t0, gain: 1.0 });
  audio.push({ file: "media/boom.wav", at: t0, gain: 1.0 });
  audio.push({ file: "sfx/sparkle.mp3", at: t0 + 0.95, gain: 0.6 });
  audio.push({ file: "media/crowd.wav", at: t0 - 0.05, trim: 0.0, dur: f2(T - t0 + 0.05), gain: 1.1, fadeIn: 0.08, fadeOut: 0.4 }); // explosão da torcida no título

  // 5) saída — flash branco e preto
  js.push(`tl.set("#flash", { autoAlpha: 1 }, ${f2(B.out)});
  tl.to("#flash", { autoAlpha: 0, duration: 0.14, ease: "power2.in" }, ${f2(B.out + 0.03)});
  tl.set("#black", { autoAlpha: 1 }, ${f2(B.out + 0.05)});
  tl.set("#sTitle", { autoAlpha: 0 }, ${f2(B.out + 0.06)});`);
  proof.push(B.out + 0.01, B.out + 0.15);
  audio.push({ file: "sfx/impact-bass-1.mp3", at: B.out, gain: 0.8 });
  audio.push({ file: "media/boom.wav", at: B.out, gain: 0.7 });

  // camas: drone (sintetizado pelo bin), riser até o título, torcida limpa a partir do chute
  audio.push({ file: "media/drone.wav", at: 0, gain: 2.2 });
  audio.push({ file: "sfx/riser.mp3", at: f2(t0 - 3.6), trim: 0, dur: 3.65, gain: 1.2, fadeIn: 0.3, fadeOut: 0.08 }); // o riser vive nos primeiros 4,5 s do arquivo; pico (3,0–4,0 s) termina no impacto do título
  audio.push({ file: "media/crowd.wav", at: B.shot, trim: 0.5, dur: f2(T - B.shot), gain: 1.5, fadeIn: 0.12, fadeOut: 0.35 });

  // grão
  js.push(`tl.to("#grain", { keyframes: ${JSON.stringify(grainKf)} }, 0);`);

  // ── HTML ─────────────────────────────────────────────────────────────────────
  const vid = (id, key, start, dur, track) => clips[key]
    ? `<video id="${id}" class="clip" src="assets/media/${clips[key].file}" muted playsinline data-start="${f2(start)}" data-duration="${f2(Math.min(dur, clips[key].dur))}" data-media-start="0" data-track-index="${track}"></video>`
    : `<div id="${id}" style="position:absolute;inset:0;background:#1a2a1a"></div>`;
  if (!clips.shot || !clips.net || !clips.celeb) log.push("⚠ faltam clipes (shot/net/celeb): usando placeholders");

  const fonts = `
      @font-face { font-family: "Playfair"; font-weight: 400; font-style: italic; src: url(assets/fonts/playfair-display-latin-400-italic.woff2) format("woff2"); }
      @font-face { font-family: "Playfair"; font-weight: 400; src: url(assets/fonts/playfair-display-latin-400-normal.woff2) format("woff2"); }
      @font-face { font-family: "Playfair"; font-weight: 700; src: url(assets/fonts/playfair-display-latin-700-normal.woff2) format("woff2"); }
      @font-face { font-family: "Playfair"; font-weight: 900; src: url(assets/fonts/playfair-display-latin-900-normal.woff2) format("woff2"); }
      @font-face { font-family: "Barlow Condensed"; font-weight: 600; src: url(assets/fonts/barlow-condensed-latin-600-normal.woff2) format("woff2"); }
      @font-face { font-family: "Barlow Condensed"; font-weight: 700; src: url(assets/fonts/barlow-condensed-latin-700-normal.woff2) format("woff2"); }`;

  const css = `
      :root { --y: ${C.yellow}; --navy: ${C.navy}; --ink: ${C.ink}; --cream: ${C.cream}; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #000; }
      #stage { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: #000; color: #fff; font-family: "Barlow Condensed", sans-serif; }
      .layer { position: absolute; inset: 0; }
      .scene { position: absolute; inset: 0; opacity: 0; visibility: hidden; }
      .media { position: absolute; inset: 0; transform-origin: 50% 50%; }
      .media video, .media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .grade { position: absolute; inset: 0; background: var(--navy); mix-blend-mode: lighten; opacity: .55; }
      .contrast { position: absolute; inset: 0; background: rgba(0,0,0,.18); mix-blend-mode: multiply; }
      .vig { position: absolute; inset: -2px; background: radial-gradient(ellipse 70% 62% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,.55) 100%); }
      .vigHard { position: absolute; inset: -2px; background: radial-gradient(ellipse 62% 56% at 50% 48%, rgba(0,0,0,0) 40%, rgba(2,6,16,.78) 100%); }
      .leak { position: absolute; inset: 0; opacity: 0; mix-blend-mode: screen; }
      #netLeak { background: radial-gradient(ellipse 60% 70% at 100% 0%, rgba(249,214,22,.55), rgba(249,214,22,0) 60%); }
      #celebLeak { background: radial-gradient(ellipse 55% 75% at 0% 100%, rgba(255,200,60,.6), rgba(255,200,60,0) 60%), radial-gradient(ellipse 40% 50% at 100% 10%, rgba(249,214,22,.35), rgba(249,214,22,0) 60%); }
      #slit { position: absolute; left: 0; right: 0; top: 50%; height: 3px; margin-top: -1.5px; background: var(--y); box-shadow: 0 0 24px 6px rgba(249,214,22,.55), 0 0 90px 20px rgba(249,214,22,.25); opacity: 0; visibility: hidden; transform-origin: 50% 50%; }
      #sTunnel { clip-path: inset(50% 0 50% 0); }
      #tunnelImg { transform-origin: 50% 60%; }
      .rays { position: absolute; left: 50%; top: -34%; width: 2600px; height: 2600px; margin-left: -1300px; transform-origin: 50% 0; mix-blend-mode: screen; opacity: 0;
        background: repeating-conic-gradient(from -9deg at 50% 0%, rgba(249,214,22,0) 0deg, rgba(249,214,22,.16) 2.5deg, rgba(249,214,22,0) 6deg, rgba(249,214,22,0) 11deg);
        -webkit-mask-image: radial-gradient(ellipse 50% 60% at 50% 0%, #000 0%, rgba(0,0,0,.6) 40%, transparent 72%); mask-image: radial-gradient(ellipse 50% 60% at 50% 0%, #000 0%, rgba(0,0,0,.6) 40%, transparent 72%); }
      #titleRays2 { background: repeating-conic-gradient(from 4deg at 50% 0%, rgba(255,255,255,0) 0deg, rgba(255,240,180,.10) 1.5deg, rgba(255,255,255,0) 4deg, rgba(255,255,255,0) 9deg); }
      #lbl { position: absolute; left: 110px; top: 92px; display: flex; align-items: stretch; gap: 22px; opacity: 0; visibility: hidden; }
      #lblBar { width: 8px; background: var(--y); transform-origin: 50% 0; box-shadow: 0 0 18px rgba(249,214,22,.6); }
      #lblBox { overflow: hidden; }
      #lblTxt { font: 700 44px/1 "Barlow Condensed"; letter-spacing: .42em; color: #fff; text-transform: uppercase; text-shadow: 0 2px 20px rgba(0,0,0,.6); padding: 2px 0; }
      #lblSub { margin-top: 10px; font: 600 26px/1 "Barlow Condensed"; letter-spacing: .3em; color: rgba(255,255,255,.7); text-transform: uppercase; opacity: 0; }
      #stamp { position: absolute; inset: 0; display: grid; place-items: center; opacity: 0; visibility: hidden; }
      #stampIn { position: relative; font: 900 640px/1 "Playfair"; color: #fff; letter-spacing: -.04em; filter: url(#rough) drop-shadow(0 30px 70px rgba(0,0,0,.6)); opacity: .97; transform-origin: 50% 50%; }
      #stampHit { position: absolute; left: 50%; top: 50%; width: 1500px; height: 1500px; margin: -750px 0 0 -750px; border-radius: 50%; background: radial-gradient(closest-side, rgba(249,214,22,.65), rgba(249,214,22,0)); mix-blend-mode: screen; opacity: 0; visibility: hidden; }
      #glitch { position: absolute; inset: 0; opacity: 0; visibility: hidden; }
      .gl { position: absolute; left: 0; width: 100%; background-size: 1920px 1080px; background-repeat: no-repeat; }
      #glR, #glB { position: absolute; inset: 0; background-size: 1920px 1080px; mix-blend-mode: screen; opacity: 0; }
      #glR { background-image: url(assets/media/celeb-first.jpg); filter: url(#onlyR); }
      #glB { background-image: url(assets/media/net-last.jpg); filter: url(#onlyB); }
      #sTitle { background: radial-gradient(ellipse 70% 80% at 62% 40%, #122a5a 0%, var(--navy) 38%, var(--ink) 100%); }
      #portraitWrap { position: absolute; right: 0; top: 0; width: 1180px; height: 1080px; opacity: 1;
        -webkit-mask-image: linear-gradient(90deg, transparent 0%, rgba(0,0,0,.45) 30%, #000 58%, #000 100%); mask-image: linear-gradient(90deg, transparent 0%, rgba(0,0,0,.45) 30%, #000 58%, #000 100%); }
      #portrait { position: absolute; inset: 0; transform-origin: 60% 40%; opacity: 0; }
      #portrait img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 62% 30%; filter: grayscale(1) contrast(1.22) brightness(1.08); }
      .duoY { position: absolute; inset: 0; background: #e2c231; mix-blend-mode: multiply; opacity: .6; }
      .duoN { position: absolute; inset: 0; background: var(--navy); mix-blend-mode: lighten; }
      .duoV { position: absolute; inset: 0; background: radial-gradient(ellipse 60% 70% at 62% 35%, rgba(0,0,0,0) 42%, rgba(6,16,31,.8) 100%); }
      #lockup { position: absolute; left: 150px; top: 262px; width: 1300px; transform-origin: 0 50%; }
      #crest { width: 136px; height: 136px; object-fit: contain; display: block; margin-left: 6px; opacity: 0; filter: drop-shadow(0 8px 24px rgba(0,0,0,.6)); }
      .mask { overflow: hidden; }
      #tFirst { display: block; font: italic 400 124px/1.1 "Playfair"; color: var(--y); margin-top: 8px; margin-left: 10px; text-shadow: 0 6px 30px rgba(0,0,0,.5); }
      #tLastWrap { position: relative; margin-top: -26px; }
      #tLast, #shine { display: block; font: 900 262px/1.08 "Playfair"; letter-spacing: .015em; text-transform: uppercase; white-space: nowrap; }
      #tLast { color: transparent; background: linear-gradient(180deg, #ffffff 0%, #fbf7e8 36%, #cdb46a 50%, #ffffff 60%, #e7dcb4 100%); -webkit-background-clip: text; background-clip: text; filter: drop-shadow(0 14px 34px rgba(0,0,0,.6)); }
      #shine { position: absolute; left: 0; top: 0; opacity: 0; visibility: hidden; color: transparent; background: linear-gradient(105deg, rgba(255,255,255,0) 42%, rgba(255,255,255,.95) 50%, rgba(255,255,255,0) 58%); background-size: 280% 100%; background-position: 180% 0; -webkit-background-clip: text; background-clip: text; mix-blend-mode: screen; }
      #rule { width: 560px; height: 4px; margin: 10px 0 0 14px; background: linear-gradient(90deg, var(--y) 0%, var(--y) 55%, rgba(249,214,22,0) 100%); transform-origin: 0 50%; box-shadow: 0 0 20px rgba(249,214,22,.5); }
      #tSub { margin: 24px 0 0 16px; font: 600 38px/1 "Barlow Condensed"; letter-spacing: .36em; color: rgba(255,255,255,.82); text-transform: uppercase; opacity: 0; }
      #grain { position: absolute; left: -600px; top: -600px; width: ${W + 1200}px; height: ${H + 1200}px; background: url("data:image/svg+xml,${noiseSvg}"); background-size: 512px 512px; mix-blend-mode: overlay; opacity: ${spec.grain}; pointer-events: none; }
      #flash { position: absolute; inset: 0; background: #fff; opacity: 0; visibility: hidden; }
      #black { position: absolute; inset: 0; background: #000; opacity: 0; visibility: hidden; }`;

  const glSlices = Array.from({ length: slices }, (_, s) => {
    const top = Math.round((s / slices) * H), h = Math.round(H / slices) + 2;
    return `<div id="gl${s}" class="gl" style="top:${top}px;height:${h}px;background-position:0 -${top}px"></div>`;
  }).join("\n            ");

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
      <svg width="0" height="0" style="position:absolute"><defs>
        <filter id="rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="3" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G"/></filter>
        <filter id="mbShot" x="-30%" y="-5%" width="160%" height="110%" color-interpolation-filters="sRGB"><feGaussianBlur id="mbShotG" stdDeviation="0 0"/></filter>
        <filter id="mbNet" x="-30%" y="-5%" width="160%" height="110%" color-interpolation-filters="sRGB"><feGaussianBlur id="mbNetG" stdDeviation="0 0"/></filter>
        <filter id="chroma" x="-5%" y="0" width="110%" height="100%" color-interpolation-filters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/><feOffset id="chR" in="r" dx="0" dy="0" result="ro"/>
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/><feOffset id="chB" in="b" dx="0" dy="0" result="bo"/>
          <feBlend in="ro" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="bo" mode="screen"/>
        </filter>
        <filter id="onlyR" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>
        <filter id="onlyB" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"/></filter>
      </defs></svg>

      <div id="sTunnel" class="scene">
        <div id="tunnelImg" class="media"><img src="${img.tunnel || ""}" alt=""><div class="grade" style="opacity:.35"></div><div class="contrast"></div></div>
        <div id="tunnelRays" class="rays"></div>
        <div class="vigHard"></div>
        <div id="lbl"><div id="lblBar"></div><div><div id="lblBox"><div id="lblTxt">${esc(spec.label)}</div></div><div id="lblSub">${esc(spec.labelSub || "Club América · Estádio Azteca")}</div></div></div>
      </div>

      <div id="sShot" class="scene" style="filter:url(#mbShot)">
        <div id="shotMedia" class="media">${vid("vShot", "shot", B.shot, B.net - B.shot + 0.18, 0)}<div class="grade"></div><div class="contrast"></div></div>
        <div class="vig"></div>
        <div id="stamp"><div id="stampHit"></div><div id="stampIn">${esc(spec.number)}</div></div>
      </div>

      <div id="sNet" class="scene">
        <div id="netMedia" class="media">${vid("vNet", "net", B.net, B.celeb - B.net, 1)}<div class="grade"></div><div class="contrast"></div></div>
        <div id="netLeak" class="leak"></div>
        <div class="vig"></div>
      </div>

      <div id="sCeleb" class="scene">
        <div id="celebMedia" class="media">${vid("vCeleb", "celeb", B.celeb, B.title - B.celeb, 2)}<div class="grade"></div><div class="contrast"></div></div>
        <div id="celebLeak" class="leak"></div>
        <div class="vig"></div>
        <div id="glitch">
            ${glSlices}
            <div id="glR"></div><div id="glB"></div>
        </div>
      </div>

      <div id="sTitle" class="scene">
        <div id="titleRays" class="rays"></div>
        <div id="titleRays2" class="rays"></div>
        <div id="portraitWrap"><div id="portrait"><img src="${img.portrait || ""}" alt=""><div class="duoY"></div><div class="duoN"></div><div class="duoV"></div></div></div>
        <div id="lockup">
          <img id="crest" src="${img.crest || ""}" alt="">
          <div class="mask"><div id="tFirst">${esc(spec.title.first)}</div></div>
          <div class="mask" id="tLastWrap"><div id="tLast">${esc(spec.title.last)}</div><div id="shine">${esc(spec.title.last)}</div></div>
          <div id="rule"></div>
          <div id="tSub">${esc(spec.subtitle)}</div>
        </div>
        <div class="vig" style="opacity:.7"></div>
      </div>

      <div id="slit"></div>
      <div id="grain"></div>
      <div id="flash"></div>
      <div id="black"></div>
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
