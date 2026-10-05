// Estilo EA FC — efeitos de "vida": grão, vazamento de luz, varredura especular, letterbox, deriva de câmera,
// foto em parallax, TV de tubo, revelação por tinta (displacement), poeira, flash-frame.
// Todas as funções recebem a API do compositor: { ft, set, tto, snd, mblur, W, H, uid }.
import { f2 } from "../v2/plan.mjs";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

// grão animado: vídeo de ruído em overlay (determinístico, é um clip)
export function grainHtml(total, track, opacity = 0.14, loop = 4) {
  const clips = [];
  for (let k = 0; k * loop < total; k++) clips.push(`<video id="grain${k}" class="clip" src="assets/fx/grain-540p.mp4" muted playsinline data-start="${f2(k * loop)}" data-duration="${f2(Math.min(loop, total - k * loop))}" data-media-start="0" data-track-index="${track}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>`);
  return `<div id="grain" class="layer" style="mix-blend-mode:overlay;opacity:${opacity};pointer-events:none">${clips.join("")}</div>`;
}

// vazamento de luz: duas manchas radiais que cruzam o quadro (screen)
export function leak(api, id, t0, dur, { color = "#ffb36b", color2 = "#5aa8ff", from = "left", strength = 0.55 } = {}) {
  const { ft, set, W, H } = api;
  const html = `<div id="${id}" class="layer leak" style="opacity:0"><i style="background:radial-gradient(closest-side, ${color}cc, ${color}00)"></i><b style="background:radial-gradient(closest-side, ${color2}99, ${color2}00)"></b></div>`;
  const dir = from === "left" ? -1 : 1;
  ft(`#${id}`, { autoAlpha: 0 }, { autoAlpha: strength, duration: 0.25, ease: "power2.out" }, t0);
  ft(`#${id} i`, { x: dir * W * 0.9, y: -H * 0.2, scale: 1.1 }, { x: -dir * W * 0.6, y: H * 0.1, scale: 1.5, duration: dur, ease: "sine.inOut" }, t0);
  ft(`#${id} b`, { x: -dir * W * 0.7, y: H * 0.5, scale: 0.9 }, { x: dir * W * 0.5, y: -H * 0.3, scale: 1.3, duration: dur, ease: "sine.inOut" }, t0);
  ft(`#${id}`, { autoAlpha: strength }, { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, t0 + dur - 0.5);
  return html;
}

// varredura especular mascarada pelo próprio PNG do escudo
export function sweepHtml(id, file, w, h) {
  return `<div id="${id}" class="sweep" style="width:${w}px;height:${h}px;-webkit-mask-image:url(assets/media/${file});mask-image:url(assets/media/${file});-webkit-mask-size:contain;mask-size:contain;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center"><i></i></div>`;
}
export function sweep(api, id, t, dur = 0.7, { snd: s = "shimmer", vol = 0.22 } = {}) {
  const { ft, set, snd } = api;
  set(`#${id}`, { autoAlpha: 1 }, t - 0.02);
  ft(`#${id} i`, { xPercent: -130 }, { xPercent: 130, duration: dur, ease: "power2.inOut" }, t);
  set(`#${id}`, { autoAlpha: 0 }, t + dur + 0.02);
  if (s) snd(s, t + 0.1, vol, 1);
}

// letterbox cinema (2.35:1) — barras entram/saem
export function letterbox(api, t0, t1, bar = 132) {
  const { ft } = api;
  ft("#lbT", { yPercent: -100 }, { yPercent: 0, duration: 0.45, ease: "power3.out" }, t0);
  ft("#lbB", { yPercent: 100 }, { yPercent: 0, duration: 0.45, ease: "power3.out" }, t0);
  ft("#lbT", { yPercent: 0 }, { yPercent: -100, duration: 0.4, ease: "power3.in" }, t1 - 0.4);
  ft("#lbB", { yPercent: 0 }, { yPercent: 100, duration: 0.4, ease: "power3.in" }, t1 - 0.4);
}

// deriva "na mão": movimento lento e contínuo (x/y/rotação) num wrapper
export function drift(api, sel, t0, t1, amp = 6) {
  const { ft } = api;
  const dur = t1 - t0; if (dur < 1) return;
  const n = Math.max(1, Math.round(dur / 2.6));
  ft(sel, { x: -amp, y: amp * 0.5, rotation: -0.25 }, { x: amp, y: -amp * 0.5, rotation: 0.25, duration: f2(dur / n), ease: "sine.inOut", repeat: n - 1, yoyo: true }, t0);
}

// foto em parallax: fundo desfocado (lento) + frente nítida (rápido) + vinheta + varredura de luz
export function parallaxPhotoHtml(id, file, { tone = null, color = "#0053A0", dark = 0.25 } = {}) {
  const toneCss = tone === "mono" ? "filter:grayscale(1) contrast(1.15)" : tone === "duo" ? "filter:grayscale(1) contrast(1.2) brightness(.9)" : "filter:contrast(1.12) saturate(.82)";
  const wash = (tone === "duo" ? `<div class="layer" style="background:${color};mix-blend-mode:multiply;opacity:.8"></div><div class="layer" style="background:${color};mix-blend-mode:screen;opacity:.25"></div>` : "") + `<div class="layer" style="background:#3b1f7a;mix-blend-mode:soft-light;opacity:.16"></div>`;
  return `<div id="${id}" class="layer kb">
      <div id="${id}bg" class="layer"><img src="assets/media/${file}" alt="" style="position:absolute;inset:-8%;width:116%;height:116%;object-fit:cover;filter:blur(14px) brightness(.55) saturate(.8)" /></div>
      <div id="${id}fg" class="layer"><img src="assets/media/${file}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;${toneCss}" />${wash}</div>
      <div class="layer" style="background:linear-gradient(to top, rgba(0,0,0,${0.55 + dark}) 0%, rgba(0,0,0,.1) 40%, transparent 65%)"></div>
      <div class="layer vig"></div>
      <div id="${id}sw" class="layer" style="opacity:0;background:linear-gradient(115deg, transparent 40%, rgba(255,255,255,.22) 50%, transparent 60%);mix-blend-mode:screen"></div>
    </div>`;
}
export function parallaxPhoto(api, id, t0, dur, { fx = "push", sweepAt = 0.15 } = {}) {
  const { ft } = api;
  const d = dur + 0.4, t = t0 - 0.2;
  if (fx === "pan") {
    ft(`#${id}bg`, { xPercent: -1.5, scale: 1.08 }, { xPercent: 1.5, scale: 1.08, duration: d, ease: "none" }, t);
    ft(`#${id}fg`, { xPercent: -3.5, scale: 1.16 }, { xPercent: 3.5, scale: 1.16, duration: d, ease: "none" }, t);
  } else if (fx === "out") {
    ft(`#${id}bg`, { scale: 1.12 }, { scale: 1.04, duration: d, ease: "power1.out" }, t);
    ft(`#${id}fg`, { scale: 1.28, yPercent: 2 }, { scale: 1.06, yPercent: 0, duration: d, ease: "power1.out" }, t);
  } else {
    ft(`#${id}bg`, { scale: 1.02 }, { scale: 1.08, duration: d, ease: "none" }, t);
    ft(`#${id}fg`, { scale: 1.06, yPercent: 1 }, { scale: 1.18, yPercent: -1.5, duration: d, ease: "none" }, t);
  }
  if (sweepAt != null) { ft(`#${id}sw`, { xPercent: -60, autoAlpha: 0.9 }, { xPercent: 60, autoAlpha: 0.9, duration: 1.1, ease: "power2.inOut" }, t0 + sweepAt); ft(`#${id}sw`, { autoAlpha: 0.9 }, { autoAlpha: 0, duration: 0.2 }, t0 + sweepAt + 1.0); }
}

// TV de tubo (CSS): moldura, tela curva, scanlines, flicker; conteúdo em #<id>scr
export function crtHtml(id, inner, { w = 1180, h = 760, label = "" } = {}) {
  return `<div id="${id}" class="crt" style="width:${w}px;height:${h}px;left:${(1920 - w) / 2}px;top:${(1080 - h) / 2 + 10}px">
      <div class="crtBezel"></div>
      <div id="${id}scr" class="crtScreen"><div id="${id}in" class="layer">${inner}</div><div class="layer crtScan"></div><div class="layer crtGlare"></div><div id="${id}fl" class="layer crtFlicker"></div></div>
      ${label ? `<div class="crtLabel">${esc(label)}</div>` : ""}
    </div>`;
}
export function crt(api, id, t0, dur) {
  const { ft, set, snd } = api;
  ft(`#${id}`, { autoAlpha: 0, scale: 0.86, rotationY: -14, rotationX: 6, filter: "blur(10px)" }, { autoAlpha: 1, scale: 1, rotationY: -4, rotationX: 2, filter: "blur(0px)", duration: 0.55, ease: "power3.out" }, t0);
  ft(`#${id}`, { rotationY: -4, rotationX: 2 }, { rotationY: 3, rotationX: -1, duration: Math.max(1, dur - 0.55), ease: "sine.inOut" }, t0 + 0.55);
  // liga: linha branca que abre (scaleY) + flicker
  ft(`#${id}scr`, { scaleY: 0.02, scaleX: 0.6 }, { scaleY: 1, scaleX: 1, duration: 0.32, ease: "power4.out" }, t0 + 0.1);
  const n = Math.max(2, Math.round(dur / 0.9));
  ft(`#${id}fl`, { opacity: 0.0 }, { opacity: 0.12, duration: 0.07, repeat: n * 2, yoyo: true, ease: "steps(1)" }, t0 + 0.5);
  snd("tick", t0 + 0.12, 0.3, 1); snd("error", t0 + 0.2, 0.18, 1);
}

// revelação por tinta/grunge: displacement map crescendo e sumindo (filtro SVG por uso)
export function inkReveal(api, sel, t, dur = 0.5, scale = 120) {
  const { ft, set, uid, defs } = api;
  const fid = `ink${uid()}`;
  defs.push(`<filter id="${fid}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="3" seed="${(t * 7) % 50 | 0}" result="n"/><feDisplacementMap id="${fid}d" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>`);
  set(sel, { filter: `url(#${fid})` }, t);
  ft(`#${fid}d`, { attr: { scale: scale } }, { attr: { scale: 0 }, duration: dur, ease: "power3.out" }, t);
  set(sel, { filter: "none" }, t + dur + 0.02);
}

// poeira: pontos desfocados subindo devagar
export function dustHtml(id, n = 26, seed = 1) {
  let s = seed, rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const dots = [];
  for (let i = 0; i < n; i++) { const sz = 2 + rnd() * 5; dots.push(`<i style="left:${(rnd() * 100).toFixed(1)}%;top:${(rnd() * 100).toFixed(1)}%;width:${sz.toFixed(1)}px;height:${sz.toFixed(1)}px;opacity:${(0.25 + rnd() * 0.5).toFixed(2)};filter:blur(${(rnd() * 1.5).toFixed(1)}px)"></i>`); }
  return `<div id="${id}" class="layer dust">${dots.join("")}</div>`;
}
export function dust(api, id, t0, dur) {
  const { ft } = api;
  ft(`#${id}`, { y: 20 }, { y: -40, duration: dur + 0.5, ease: "none" }, t0 - 0.2);
  ft(`#${id}`, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, t0);
}

// flash-frame: 2–3 quadros de uma imagem (subliminar) num hit
export function flashFrame(api, id, t, frames = 3, fps = 60) {
  const { set } = api;
  set(`#${id}`, { autoAlpha: 1 }, t);
  set(`#${id}`, { autoAlpha: 0 }, t + frames / fps);
}

export const FX_CSS = `
      .leak { pointer-events: none; mix-blend-mode: screen; overflow: hidden; }
      .leak i, .leak b { position: absolute; left: 50%; top: 50%; width: 1500px; height: 1100px; margin: -550px 0 0 -750px; border-radius: 50%; }
      .sweep { position: absolute; left: 0; top: 0; overflow: hidden; opacity: 0; pointer-events: none; }
      .sweep i { position: absolute; inset: -20% -10%; background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,.9) 50%, transparent 62%); mix-blend-mode: screen; }
      #lbT, #lbB { position: absolute; left: 0; right: 0; height: 132px; background: #000; z-index: 5; }
      #lbT { top: 0; } #lbB { bottom: 0; }
      .vig { background: radial-gradient(1500px 950px at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%); }
      .crt { position: absolute; transform-style: preserve-3d; opacity: 0; }
      .crtBezel { position: absolute; inset: -34px; border-radius: 42px; background: linear-gradient(160deg, #2a2a2e, #0d0d10 55%, #1b1b1f); box-shadow: 0 60px 120px -30px rgba(0,0,0,.9), inset 0 0 0 2px rgba(255,255,255,.06), inset 0 2px 0 rgba(255,255,255,.12); }
      .crtScreen { position: absolute; inset: 0; border-radius: 28px / 40px; overflow: hidden; background: #050507; box-shadow: inset 0 0 80px rgba(0,0,0,.9), inset 0 0 0 3px rgba(255,255,255,.04); }
      .crtScan { background: repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0 2px, rgba(0,0,0,.28) 2px 4px); mix-blend-mode: multiply; }
      .crtGlare { background: radial-gradient(900px 500px at 30% 10%, rgba(255,255,255,.14), transparent 60%); }
      .crtFlicker { background: #fff; mix-blend-mode: overlay; opacity: 0; }
      .crtLabel { position: absolute; left: 0; right: 0; bottom: -84px; text-align: center; font: 500 26px/1 var(--font); letter-spacing: .3em; text-transform: uppercase; color: rgba(255,255,255,.6); }
      .dust { pointer-events: none; opacity: 0; }
      .dust i { position: absolute; border-radius: 50%; background: #fff; }
      #faceGrade { background: linear-gradient(160deg, rgba(255,170,90,.10), rgba(0,40,120,.14)); mix-blend-mode: soft-light; }
      .flashImg { position: absolute; inset: 0; opacity: 0; visibility: hidden; }
      .flashImg img { width: 100%; height: 100%; object-fit: cover; }
`;
