// Gancho/edição do canal EA FC — camada visual sobre o vídeo já cortado (modelo de edição S2G, identidade Club América).
// O vídeo do Leonel é a base (voz e corte intocados). Em cima: cutaways full-screen (escondem o rosto), cards com push-in,
// tweet, placar, TV retrô, carimbo, chaveamento, inscreva-se, câmera (push lento + punch-ins). Uma timeline GSAP pausada (seek-safe).
// Áudio: o bin mixa a voz original (ganho 1) + SFX de biblioteca abaixo da voz → assets/media/mix.m4a.

const f2 = (n) => +(+n).toFixed(3);
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const TOKENS = {
  yellow: "#F9D616", navy: "#0A1F44", ink: "#06101F", cream: "#F4EFE2", white: "#FFFFFF",
  cru: "#0A3D91", cruDark: "#062B6B", red: "#D7141A", gray: "#3A3A3A",
};

export function composeGancho(spec, ctx = {}) {
  const W = 1920, H = 1080, FPS = spec.fps || 60;
  const src = ctx.source; // { file, dur }
  const T = f2(spec.duration ?? src.dur);
  const img = ctx.images || {}; const clips = ctx.clips || {};
  const C = { ...TOKENS, ...(spec.colors || {}) };
  const js = [], html = [], audio = [], proof = [], log = [];
  let uid = 0; const nid = (p) => `${p}${++uid}`;
  const sfx = (file, at, gain, extra = {}) => audio.push({ file: `sfx/${file}.mp3`, at: f2(at), gain, ...extra });

  // ── helpers de animação ───────────────────────────────────────────────────────
  const show = (id, at, dur) => { js.push(`tl.set("#${id}", { autoAlpha: 1 }, ${f2(at)});`); if (dur != null) js.push(`tl.set("#${id}", { autoAlpha: 0 }, ${f2(at + dur)});`); };
  const pushIn = (id, at, dur, from = 1, to = 1.04) => js.push(`tl.fromTo("#${id}", { scale: ${from} }, { scale: ${to}, duration: ${f2(dur)}, ease: "none" }, ${f2(at)});`);
  const pop = (id, at, d = 0.28) => js.push(`tl.fromTo("#${id}", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: ${d}, ease: "back.out(1.8)" }, ${f2(at)});`);
  const slideL = (id, at, d = 0.26) => js.push(`tl.fromTo("#${id}", { x: -240, opacity: 0, filter: "blur(14px)" }, { x: 0, opacity: 1, filter: "blur(0px)", duration: ${d}, ease: "power4.out" }, ${f2(at)});`);
  const slideUp = (id, at, d = 0.24) => js.push(`tl.fromTo("#${id}", { y: 180, opacity: 0 }, { y: 0, opacity: 1, duration: ${d}, ease: "power4.out" }, ${f2(at)});`);
  const drop = (id, at, d = 0.34) => js.push(`tl.fromTo("#${id}", { y: -420, scale: 1.35, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: ${d}, ease: "back.out(1.3)" }, ${f2(at)});`);
  const whipIn = (id, at, d = 0.26) => js.push(`tl.fromTo("#${id}", { scale: 1.22, opacity: 0, filter: "blur(22px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: ${d}, ease: "power3.out" }, ${f2(at)});`);
  const fadeIn = (id, at, d = 0.3) => js.push(`tl.fromTo("#${id}", { opacity: 0 }, { opacity: 1, duration: ${d}, ease: "power2.out" }, ${f2(at)});`);
  const fadeOut = (id, at, d = 0.3) => js.push(`tl.to("#${id}", { opacity: 0, duration: ${d}, ease: "power2.in" }, ${f2(at)});`);
  const crest = (key, size, extra = "") => `<img src="${img[key] || ""}" alt="" style="width:${size}px;height:${size}px;object-fit:contain;${extra}">`;

  const covers = []; // trechos em que o rosto está coberto (para a câmera)

  // ── componentes ───────────────────────────────────────────────────────────────
  const comp = {
    // vídeo/imagem em tela cheia com Ken Burns
    cutaway(e) {
      const id = nid("cut"); const kb = e.kb || [1.0, 1.06];
      const media = e.clip
        ? `<video id="${id}v" class="clip" src="assets/media/${clips[e.clip].file}" muted playsinline data-start="${f2(e.at)}" data-duration="${f2(Math.min(e.dur, clips[e.clip].dur))}" data-media-start="${f2(e.mediaStart || 0)}" data-track-index="${e.track ?? 1}"></video>`
        : `<img src="${img[e.img]}" alt="">`;
      html.push(`<div id="${id}" class="scene"><div id="${id}k" class="fill">${media}</div><div class="vig"></div>${e.label ? `<div class="lt"><i></i><b>${esc(e.label)}</b></div>` : ""}</div>`);
      show(id, e.at, e.dur); js.push(`tl.fromTo("#${id}k", { scale: ${kb[0]} }, { scale: ${kb[1]}, duration: ${f2(e.dur)}, ease: "none" }, ${f2(e.at)});`);
      if (e.sfx !== false) sfx("whoosh-short", e.at - 0.04, 0.32);
      covers.push([e.at, e.at + e.dur]); proof.push(e.at + Math.min(0.6, e.dur / 2));
    },
    // foto pequena dentro de um card sobre a própria foto desfocada (mockup) + rótulo
    photoCard(e) {
      const id = nid("pc");
      html.push(`<div id="${id}" class="scene"><div class="fill blurbg"><img src="${img[e.img]}" alt=""></div><div class="dark"></div>
        <div id="${id}w" class="pcw"><div id="${id}c" class="pcard"><img src="${img[e.img]}" alt=""></div></div>
        ${e.label ? `<div id="${id}l" class="lt hid"><i></i><b>${esc(e.label)}</b></div>` : ""}</div>`);
      show(id, e.at, e.dur);
      js.push(`tl.fromTo("#${id}c", { scale: 0.8, opacity: 0, rotation: ${e.tilt ?? -3} }, { scale: 1, opacity: 1, rotation: ${(e.tilt ?? -3) + 1.5}, duration: 0.32, ease: "power4.out" }, ${f2(e.at)});`);
      js.push(`tl.fromTo("#${id}w", { scale: 1 }, { scale: 1.05, duration: ${f2(e.dur)}, ease: "none" }, ${f2(e.at)});`);
      if (e.label) { show(`${id}l`, e.at + 0.25); slideL(`${id}l`, e.at + 0.25); }
      sfx("whoosh-short", e.at - 0.04, 0.32);
      covers.push([e.at, e.at + e.dur]); proof.push(e.at + 0.6);
    },
    // card de jogador (canto inferior esquerdo)
    playerCard(e) {
      const id = nid("pl");
      html.push(`<div id="${id}" class="ov hid"><div id="${id}z" class="plcard"><div class="plbar"></div><div class="plph"><img src="${img[e.photo]}" alt=""></div>
        <div class="plnum"><b>${esc(e.num)}</b><span>${esc(e.unit)}</span></div><div class="plname"><b>${esc(e.name)}</b><span>${esc(e.sub)}</span></div></div></div>`);
      show(id, e.at, e.dur); slideL(id, e.at); pushIn(`${id}z`, e.at, e.dur, 1, 1.04);
      sfx("whoosh-short", e.at - 0.03, 0.3); proof.push(e.at + 0.4);
    },
    // contador grande (0 → n) com rótulo e escudo
    counter(e) {
      const id = nid("ct"); const steps = e.to;
      html.push(`<div id="${id}" class="ov hid"><div id="${id}z" class="ctr">${e.crest ? crest(e.crest, 150) : ""}<div><b id="${id}n">0</b><span>${esc(e.label)}</span></div></div></div>`);
      show(id, e.at, e.dur); pop(id, e.at);
      js.push(`tl.to("#${id}n", { innerText: ${steps}, snap: { innerText: 1 }, duration: ${f2(e.countDur ?? 0.9)}, ease: "power1.inOut" }, ${f2(e.at + 0.1)});`);
      pushIn(`${id}z`, e.at, e.dur, 1, 1.03);
      sfx("pop", e.at, 0.3);
      const n = Math.min(steps, 16); for (let i = 1; i <= n; i++) sfx("click-soft", e.at + 0.1 + (i / n) * (e.countDur ?? 0.9), 0.14);
      sfx("ping", e.at + 0.1 + (e.countDur ?? 0.9), 0.22); proof.push(e.at + 0.5);
    },
    // tweet branco (centro-base)
    tweet(e) {
      const id = nid("tw");
      const ic = `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#1D9BF0" d="M22.5 12.3l-2-2.2.3-3-2.9-.7-1.5-2.6L13.6 5 12 3.5 10.4 5 7.6 3.8 6.1 6.4l-2.9.7.3 3-2 2.2 2 2.2-.3 3 2.9.7 1.5 2.6 2.8-1.2 1.6 1.5 1.6-1.5 2.8 1.2 1.5-2.6 2.9-.7-.3-3zM10.3 16.3l-3.4-3.4 1.4-1.4 2 2 5.3-5.3 1.4 1.4z"/></svg>`;
      html.push(`<div id="${id}" class="ov hid"><div id="${id}z" class="tweet"><div class="twh"><div class="twav">${e.avatar ? crest(e.avatar, 64) : ""}</div><div class="twn"><b>${esc(e.name)} ${ic}</b><span>${esc(e.handle)}</span></div><svg class="twx" viewBox="0 0 24 24"><path fill="#111" d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.9-6.4L6.3 22H3.2l7.3-8.3L3 2h6.4l4.4 5.8zm-1.1 18.2h1.7L8.3 3.7H6.5z"/></svg></div>
        <p>${esc(e.text)}</p><div class="twm"><span>💬 ${esc(e.replies || "84")}</span><span>↻ ${esc(e.reposts || "312")}</span><span>♥ ${esc(e.likes || "2,1 mil")}</span></div></div></div>`);
      show(id, e.at, e.dur); slideUp(id, e.at); pushIn(`${id}z`, e.at, e.dur, 1, 1.03);
      sfx("notification", e.at, 0.26); proof.push(e.at + 0.5);
    },
    // card de sorteio: AME vs ? (ou escudo revelado) sobre estádio
    fixture(e) {
      const id = nid("fx");
      html.push(`<div id="${id}" class="scene"><div class="fill blurbg"><img src="${img.azteca}" alt=""></div><div class="dark"></div>
        <div id="${id}z" class="fxw"><div class="fxcard"><div class="fxh">${esc(e.title || "SORTEIO · LIGUILLA · QUARTAS DE FINAL")}</div>
          <div class="fxrow"><div class="fxt">${crest("ame", 230)}<b>${esc(e.home || "AME")}</b></div><div class="fxvs">VS</div>
          <div class="fxt"><div id="${id}q" class="fxq">?</div><b id="${id}qt">${esc(e.awayLabel || "???")}</b></div></div></div></div></div>`);
      show(id, e.at, e.dur); whipIn(`${id}z`, e.at); pushIn(`${id}z`, e.at + 0.26, e.dur - 0.26, 1, 1.05);
      if (e.shakeAt) js.push(`tl.to("#${id}q", { keyframes: [{ x: -14, rotation: -4, duration: 0.05 }, { x: 14, rotation: 4, duration: 0.05 }, { x: -10, rotation: -3, duration: 0.05 }, { x: 10, rotation: 3, duration: 0.05 }, { x: 0, rotation: 0, duration: 0.06 }], ease: "none" }, ${f2(e.shakeAt)});
  tl.fromTo("#${id}q", { backgroundColor: "${C.navy}", color: "${C.yellow}" }, { backgroundColor: "${C.red}", color: "#fff", duration: 0.12 }, ${f2(e.shakeAt)});`);
      sfx("whoosh-cinematic", e.at - 0.3, 0.3, { trim: 1.7, dur: 1.2, fadeOut: 0.3 });
      if (e.shakeAt) sfx("impact-bass-1", e.shakeAt, 0.3);
      sfx("riser", f2(e.at + e.dur - 2.2), 0.28, { trim: 1.9, dur: 2.2, fadeIn: 0.3, fadeOut: 0.05 });
      covers.push([e.at, e.at + e.dur]); proof.push(e.at + 0.5, e.shakeAt ? e.shakeAt + 0.1 : e.at + 1.5);
    },
    // tela dividida AME | CRU com escudos; entra com zoom-blur, sai abrindo as portas
    faceoff(e) {
      const id = nid("fo"); const door = e.exit === "door";
      html.push(`<div id="${id}" class="scene"><div class="fill blurbg"><img src="${img.azteca}" alt=""></div><div class="dark"></div>
        <div id="${id}z" class="fill"><div id="${id}l" class="foh fol"><div class="fostripes"></div><div class="foin">${crest("ame", 300)}<b>${esc(e.home || "AME")}</b></div></div>
        <div id="${id}r" class="foh for"><div class="fostripes"></div><div class="foin">${crest("cru", 300)}<b>${esc(e.away || "CRU")}</b>${e.badge ? `<div id="${id}b" class="fobadge hid">${esc(e.badge)}</div>` : ""}</div></div>
        <div class="fomid"><span>${esc(e.mid || "LIGUILLA")}</span></div></div></div>`);
      show(id, e.at, e.dur); whipIn(`${id}z`, e.at, 0.28);
      js.push(`tl.fromTo("#${id}l .foin, #${id}r .foin", { scale: 1 }, { scale: 1.06, duration: ${f2(e.dur)}, ease: "none" }, ${f2(e.at)});`);
      if (e.badge && e.badgeAt) { show(`${id}b`, e.badgeAt); pop(`${id}b`, e.badgeAt); sfx("pop", e.badgeAt, 0.3); }
      if (door) { js.push(`tl.to("#${id}l", { xPercent: -106, duration: 0.42, ease: "power3.inOut" }, ${f2(e.at + e.dur - 0.42)}); tl.to("#${id}r", { xPercent: 106, duration: 0.42, ease: "power3.inOut" }, ${f2(e.at + e.dur - 0.42)}); tl.to("#${id} .fomid", { opacity: 0, duration: 0.15 }, ${f2(e.at + e.dur - 0.42)}); tl.to("#${id} .dark, #${id} .blurbg", { opacity: 0, duration: 0.3 }, ${f2(e.at + e.dur - 0.35)});`); sfx("whoosh-short", e.at + e.dur - 0.45, 0.3); }
      sfx("impact-bass-2", e.at, 0.42); sfx("whoosh-short", e.at - 0.05, 0.35);
      covers.push([e.at, e.at + e.dur - (door ? 0.3 : 0)]); proof.push(e.at + 0.35, e.badgeAt ? e.badgeAt + 0.3 : e.at + 1, e.at + e.dur - 0.2);
    },
    // head-to-head (canto inferior esquerdo)
    h2h(e) {
      const id = nid("hh");
      html.push(`<div id="${id}" class="ov hid"><div id="${id}z" class="h2h"><div class="h2hh">${esc(e.title)}</div><div class="h2hb">${crest("ame", 76)}<b>${esc(e.home || "AME")}</b><span>×</span><b>${esc(e.away || "CRU")}</b>${crest("cru", 76)}</div></div></div>`);
      show(id, e.at, e.dur); pop(id, e.at); pushIn(`${id}z`, e.at, e.dur, 1, 1.04); sfx("pop", e.at, 0.3); proof.push(e.at + 0.5);
    },
    // TV retrô com imagem dentro e ano gigante atrás
    tvRetro(e) {
      const id = nid("tv");
      html.push(`<div id="${id}" class="scene"><div class="tvroom"></div><div id="${id}y" class="tvyear">${esc(e.year)}</div>
        <div id="${id}z" class="tvw"><div class="tvset"><div class="tvscreen"><div id="${id}i" class="fill"><img src="${img[e.img]}" alt=""></div><div class="scan"></div><div class="glass"></div></div><div class="tvfoot"></div></div></div>
        ${e.label ? `<div id="${id}l" class="lt hid"><i></i><b>${esc(e.label)}</b></div>` : ""}</div>`);
      show(id, e.at, e.dur);
      js.push(`tl.fromTo("#${id}y", { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "power4.out" }, ${f2(e.at + 0.05)});`);
      js.push(`tl.fromTo("#${id}z", { scale: 0.86, y: 60, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: "power4.out" }, ${f2(e.at)});`);
      js.push(`tl.to("#${id}z", { scale: 1.06, duration: ${f2(e.dur - 0.45)}, ease: "none" }, ${f2(e.at + 0.45)});`);
      js.push(`tl.fromTo("#${id}i", { scale: 1 }, { scale: ${e.pushAt ? 1.0 : 1.08}, duration: ${f2(e.pushAt ? e.pushAt - e.at : e.dur)}, ease: "none" }, ${f2(e.at)});`);
      if (e.pushAt) js.push(`tl.to("#${id}i", { scale: 1.3, duration: ${f2(e.at + e.dur - e.pushAt)}, ease: "power2.inOut" }, ${f2(e.pushAt)});`);
      if (e.label) { show(`${id}l`, e.at + 0.4); slideL(`${id}l`, e.at + 0.4); }
      sfx("whoosh-short", e.at - 0.04, 0.32); sfx("impact-bass-1", e.at + 0.05, 0.28); sfx("glitch-3", e.at, 0.12, { trim: 0.2, dur: 1.2, fadeOut: 0.6 });
      if (e.pushAt) sfx("whoosh-short", e.pushAt, 0.22);
      covers.push([e.at, e.at + e.dur]); proof.push(e.at + 0.5, e.pushAt ? e.pushAt + 0.8 : e.at + e.dur - 0.3);
    },
    // placar (centro-base) com atualizações (flip de números) e tag
    scoreline(e) {
      const id = nid("sc"); const ups = e.updates || [];
      const num = (k, v) => `<div class="scn"><b id="${id}${k}a">${v}</b><b id="${id}${k}b" class="scnb"></b></div>`;
      html.push(`<div id="${id}" class="ov hid"><div id="${id}z" class="score"><div class="sce scl">${crest("cru", 70)}<b>${esc(e.home)}</b></div><div class="scc">${num("h", e.h)}<i>–</i>${num("a", e.a)}</div><div class="sce scr"><b>${esc(e.away)}</b>${crest("ame", 70)}</div>
        <div id="${id}t" class="sctag hid"></div></div></div>`);
      show(id, e.at, e.dur); slideUp(id, e.at); pushIn(`${id}z`, e.at, e.dur, 1, 1.03); sfx("pop", e.at, 0.3);
      let cur = { h: e.h, a: e.a };
      ups.forEach((u) => {
        for (const k of ["h", "a"]) if (u[k] != null && u[k] !== cur[k]) {
          js.push(`tl.set("#${id}${k}b", { innerText: "${u[k]}" }, ${f2(u.at - 0.01)});
  tl.fromTo("#${id}${k}a", { yPercent: 0 }, { yPercent: -110, duration: 0.22, ease: "power3.in" }, ${f2(u.at)});
  tl.fromTo("#${id}${k}b", { yPercent: 110 }, { yPercent: 0, duration: 0.26, ease: "back.out(1.6)" }, ${f2(u.at + 0.08)});`);
          cur[k] = u[k]; sfx("click", u.at, 0.3);
        }
        if (u.tag) { js.push(`tl.set("#${id}t", { innerText: "${esc(u.tag)}" }, ${f2(u.at - 0.01)});`); show(`${id}t`, u.at); pop(`${id}t`, u.at); sfx("pop", u.at, 0.3); }
        proof.push(u.at + 0.35);
      });
      proof.push(e.at + 0.4);
    },
    // texto gigante central (persiste por cima dos cortes)
    bigText(e) {
      const id = nid("bt");
      html.push(`<div id="${id}" class="ov hid"><div id="${id}z" class="bigtxt">${esc(e.text)}</div></div>`);
      show(id, e.at, e.dur); js.push(`tl.fromTo("#${id}z", { scale: 1.3, opacity: 0, filter: "blur(16px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.3, ease: "power3.out" }, ${f2(e.at)});`);
      pushIn(`${id}z`, e.at + 0.3, e.dur - 0.3, 1, 1.05); fadeOut(id, e.at + e.dur - 0.25, 0.25);
      sfx("sparkle", e.at, 0.28); sfx("impact-bass-1", e.at, 0.3); proof.push(e.at + 0.4);
    },
    // captura (página/print) em mockup com zoom até uma região + marca-texto
    zoomCapture(e) {
      const id = nid("zc"); const m = e.marker;
      html.push(`<div id="${id}" class="scene"><div class="fill blurbg"><img src="${img[e.img]}" alt=""></div><div class="dark"></div>
        <div id="${id}w" class="zcw"><div class="zcframe"><div class="zcbar"><i></i><i></i><i></i><u>rae.es · observatorio de palabras</u></div><div class="zcbody"><div id="${id}z" class="zcimg" style="transform-origin:${e.origin || "50% 50%"}"><img src="${img[e.img]}" alt="">${m ? `<div id="${id}m" class="marker hid" style="left:${f2(m.x * 100)}%;top:${f2(m.y * 100)}%;width:${f2(m.w * 100)}%;height:${f2(m.h * 100)}%"></div>` : ""}</div></div></div></div></div>`);
      show(id, e.at, e.dur);
      js.push(`tl.fromTo("#${id}w", { scale: 0.9, y: 40, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.35, ease: "power4.out" }, ${f2(e.at)});`);
      js.push(`tl.fromTo("#${id}z", { scale: 1 }, { scale: ${e.zoom || 1.8}, duration: ${f2(e.zoomDur || 0.8)}, ease: "power2.inOut" }, ${f2(e.at + (e.zoomAt || 0.35))});`);
      if (m) { const ma = e.at + (e.zoomAt || 0.35) + (e.zoomDur || 0.8) - 0.1; show(`${id}m`, ma); js.push(`tl.fromTo("#${id}m", { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: "power2.out" }, ${f2(ma)});`); sfx("key-press", ma, 0.22); }
      sfx("whoosh-short", e.at - 0.04, 0.32); sfx("whoosh-short", e.at + (e.zoomAt || 0.35), 0.2);
      covers.push([e.at, e.at + e.dur]); proof.push(e.at + 0.3, e.at + (e.zoomAt || 0.35) + (e.zoomDur || 0.8) + 0.3);
    },
    // carimbo: foto escurecida + escudo + texto que cai
    stamp(e) {
      const id = nid("st");
      html.push(`<div id="${id}" class="scene"><div id="${id}k" class="fill stbg"><img src="${img[e.img]}" alt=""></div><div class="dark" style="opacity:.55"></div><div class="vig"></div>
        ${e.crest ? `<div id="${id}c" class="stcrest">${crest(e.crest, 520)}</div>` : ""}<div id="${id}t" class="stamp">${esc(e.text)}</div></div>`);
      show(id, e.at, e.dur); js.push(`tl.fromTo("#${id}k", { scale: 1.0 }, { scale: 1.07, duration: ${f2(e.dur)}, ease: "none" }, ${f2(e.at)});`);
      if (e.crest) js.push(`tl.fromTo("#${id}c", { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(1.6)" }, ${f2(e.at + 0.05)});`);
      drop(`${id}t`, e.at + (e.textAt || 0.18));
      sfx("whoosh-short", e.at - 0.04, 0.32); sfx("impact-bass-2", e.at + (e.textAt || 0.18) + 0.2, 0.45);
      covers.push([e.at, e.at + e.dur]); proof.push(e.at + (e.textAt || 0.18) + 0.4);
    },
    // chaveamento: 3 fases que entram em sequência
    bracket(e) {
      const id = nid("br"); const steps = e.steps || [];
      html.push(`<div id="${id}" class="scene brbg"><div class="stripes"></div><div id="${id}z" class="brw"><div class="brtitle">${esc(e.title || "LIGUILLA · APERTURA")}</div><div class="brbig"><b>${esc(e.big || "6")}</b><span>${esc(e.bigLabel || "JOGOS")}</span></div>
        <div class="brrow">${steps.map((s, i) => `<div id="${id}s${i}" class="brstep hid"><b>${esc(s.label)}</b><span>${esc(s.sub || "IDA · VOLTA")}</span></div>`).join("")}</div></div>${crest("ame", 120, "position:absolute;right:70px;bottom:50px;opacity:.9")}</div>`);
      show(id, e.at, e.dur); whipIn(`${id}z`, e.at, 0.28); pushIn(`${id}z`, e.at + 0.3, e.dur - 0.3, 1, 1.04);
      steps.forEach((s, i) => { show(`${id}s${i}`, s.at); pop(`${id}s${i}`, s.at); sfx("pop", s.at, 0.3); proof.push(s.at + 0.3); });
      sfx("whoosh-short", e.at - 0.05, 0.35); sfx("impact-bass-1", e.at, 0.3);
      covers.push([e.at, e.at + e.dur]);
    },
    // inscreva-se: like, inscrever, sino aparecem no tempo de cada palavra
    subscribe(e) {
      const id = nid("sb");
      const icons = {
        like: `<svg viewBox="0 0 24 24"><path fill="#fff" d="M2 10h4v11H2zM22 11c0-1.1-.9-2-2-2h-5.3l.9-4.3v-.3c0-.4-.2-.8-.4-1.1L14.2 2 7.6 8.6c-.4.4-.6.9-.6 1.4v9c0 1.1.9 2 2 2h7.5c.8 0 1.5-.5 1.8-1.2l2.6-6.1c.1-.2.1-.5.1-.7z"/></svg>`,
        sub: `<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="4" fill="#FF0033"/><path fill="#fff" d="M10 9v6l5-3z"/></svg>`,
        bell: `<svg viewBox="0 0 24 24"><path fill="#fff" d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22zm7-6v-5c0-3.1-1.7-5.6-4.5-6.3V4a2.5 2.5 0 0 0-5 0v.7C6.7 5.4 5 7.9 5 11v5l-2 2v1h18v-1z"/></svg>`,
      };
      const labels = { like: "LIKE", sub: "INSCREVA-SE", bell: "ATIVE O SINO" };
      html.push(`<div id="${id}" class="ov hid"><div id="${id}z" class="subs">${(e.items || []).map((it, i) => `<div id="${id}i${i}" class="subi hid"><div class="subic">${icons[it.kind]}</div><b>${esc(it.label || labels[it.kind])}</b></div>`).join("")}</div></div>`);
      show(id, e.at, e.dur); slideUp(id, e.at); pushIn(`${id}z`, e.at, e.dur, 1, 1.02);
      (e.items || []).forEach((it, i) => { show(`${id}i${i}`, it.at); pop(`${id}i${i}`, it.at); sfx("pop", it.at, 0.3); });
      proof.push((e.items?.[e.items.length - 1]?.at ?? e.at) + 0.4);
    },
    // lower-third simples (título + sub) com barra amarela
    lowerThird(e) {
      const id = nid("lt");
      html.push(`<div id="${id}" class="ov hid"><div id="${id}z" class="lt3"><i></i><div><b>${esc(e.title)}</b><span>${esc(e.sub || "")}</span></div></div></div>`);
      show(id, e.at, e.dur); slideL(id, e.at); pushIn(`${id}z`, e.at, e.dur, 1, 1.02); sfx("whoosh-short", e.at - 0.03, 0.28); proof.push(e.at + 0.4);
    },
  };

  for (const e of spec.events || []) { if (!comp[e.type]) { log.push(`⚠ evento desconhecido: ${e.type}`); continue; } comp[e.type](e); }

  // ── câmera: push lento nos trechos de rosto + punch-ins ──────────────────────
  covers.sort((a, b) => a[0] - b[0]);
  const segs = []; let t = 0;
  for (const [a, b] of covers) { if (a > t + 0.05) segs.push([t, a]); t = Math.max(t, b); }
  if (t < T - 0.05) segs.push([t, T]);
  const punches = (spec.camera || []).slice().sort((a, b) => a.at - b.at);
  const camJs = [];
  for (const [a, b] of segs) {
    camJs.push(`tl.set("#cam", { scale: 1 }, ${f2(a)});`);
    let cur = a, curScale = 1;
    const ps = punches.filter((p) => p.at > a && p.at < b - 0.3);
    for (const p of ps) {
      const drift = f2(curScale + 0.03 * ((p.at - cur) / (b - a)));
      camJs.push(`tl.to("#cam", { scale: ${drift}, duration: ${f2(p.at - cur)}, ease: "none" }, ${f2(cur)});`);
      camJs.push(`tl.to("#cam", { scale: ${p.punch}, duration: 0.14, ease: "power3.out" }, ${f2(p.at)});`);
      const hold = p.hold ?? 0.8; const back = f2(Math.max(1.0, drift + 0.005));
      camJs.push(`tl.to("#cam", { scale: ${f2(p.punch + 0.01)}, duration: ${f2(hold)}, ease: "none" }, ${f2(p.at + 0.14)});`);
      camJs.push(`tl.to("#cam", { scale: ${back}, duration: 0.45, ease: "power2.inOut" }, ${f2(p.at + 0.14 + hold)});`);
      cur = f2(p.at + 0.14 + hold + 0.45); curScale = back;
      sfx("whoosh-short", p.at - 0.02, 0.18);
    }
    if (b - cur > 0.05) camJs.push(`tl.to("#cam", { scale: ${f2(curScale + 0.03 * ((b - cur) / (b - a)))}, duration: ${f2(b - cur)}, ease: "none" }, ${f2(cur)});`);
  }
  js.push(...camJs);
  for (const [a] of segs) if (a > 0.1) proof.push(a + 0.3);

  // ── CSS ───────────────────────────────────────────────────────────────────────
  const weights = { Thin: 100, ExtraLight: 200, Light: 300, Regular: 400, Normal: 450, Medium: 500, DemiBold: 600, Bold: 700, ExtraBold: 800, Heavy: 900 };
  const fonts = Object.entries(weights).map(([n, w]) => `@font-face { font-family: "Articulat"; font-weight: ${w}; src: url(assets/fonts/${n}.otf) format("opentype"); }`).join("\n      ");
  const css = `
      :root { --y: ${C.yellow}; --navy: ${C.navy}; --ink: ${C.ink}; --cream: ${C.cream}; --cru: ${C.cru}; --red: ${C.red}; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #000; }
      #stage { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: #000; font-family: "Articulat", sans-serif; color: #fff; }
      .fill { position: absolute; inset: 0; transform-origin: 50% 50%; }
      .fill > video, .fill > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #cam { position: absolute; inset: 0; transform-origin: 50% 42%; }
      #cam video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .scene { position: absolute; inset: 0; opacity: 0; visibility: hidden; }
      .ov { position: absolute; inset: 0; pointer-events: none; }
      .hid { opacity: 0; visibility: hidden; }
      .vig { position: absolute; inset: -2px; background: radial-gradient(ellipse 72% 66% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,.45) 100%); }
      .dark { position: absolute; inset: 0; background: rgba(4,10,24,.62); }
      .blurbg img { filter: blur(28px) brightness(.7); transform: scale(1.15); }
      .stripes { position: absolute; inset: 0; background: repeating-linear-gradient(-14deg, rgba(249,214,22,.07) 0 2px, transparent 2px 30px); }
      .lt { position: absolute; left: 90px; bottom: 90px; display: flex; align-items: stretch; gap: 18px; }
      .lt i { width: 10px; background: var(--y); border-radius: 3px; }
      .lt b { font: 800 44px/1.1 "Articulat"; letter-spacing: .06em; text-transform: uppercase; color: #fff; text-shadow: 0 4px 24px rgba(0,0,0,.6); padding: 6px 0; }
      .pcw { position: absolute; inset: 0; display: grid; place-items: center; transform-origin: 50% 50%; }
      .pcard { width: 1240px; height: 700px; border-radius: 18px; overflow: hidden; background: #111; box-shadow: 0 50px 120px rgba(0,0,0,.6), 0 0 0 6px rgba(255,255,255,.9); transform-origin: 50% 50%; }
      .pcard img { width: 100%; height: 100%; object-fit: cover; }
      .plcard { position: absolute; left: 70px; bottom: 80px; width: 920px; height: 300px; border-radius: 18px; background: linear-gradient(135deg, #10306a 0%, var(--navy) 55%, var(--ink) 100%); box-shadow: 0 30px 70px rgba(0,0,0,.5), inset 0 0 0 2px rgba(255,255,255,.08); display: flex; align-items: center; gap: 26px; padding: 0 36px 0 0; overflow: hidden; transform-origin: 50% 50%; }
      .plbar { width: 14px; height: 100%; background: var(--y); }
      .plph { width: 200px; height: 200px; border-radius: 50%; overflow: hidden; flex: none; box-shadow: 0 0 0 5px var(--y); background: #222; }
      .plph img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 20%; }
      .plnum { display: flex; flex-direction: column; align-items: center; line-height: 1; margin-right: 10px; }
      .plnum b { font: 900 150px/1 "Articulat"; color: var(--y); letter-spacing: -.03em; }
      .plnum span { font: 700 30px/1 "Articulat"; letter-spacing: .3em; color: #fff; margin-top: 2px; }
      .plname { display: flex; flex-direction: column; gap: 10px; }
      .plname { min-width: 0; }
      .plname b { font: 900 50px/1 "Articulat"; text-transform: uppercase; letter-spacing: .01em; color: #fff; white-space: nowrap; }
      .plname span { font: 500 24px/1 "Articulat"; letter-spacing: .14em; color: rgba(244,239,226,.75); text-transform: uppercase; white-space: nowrap; }
      .ctr { position: absolute; left: 120px; top: 150px; display: flex; align-items: center; gap: 30px; padding: 30px 56px 30px 36px; border-radius: 22px; background: rgba(6,16,31,.86); box-shadow: 0 30px 70px rgba(0,0,0,.5), inset 0 0 0 2px rgba(249,214,22,.5); transform-origin: 50% 50%; }
      .ctr b { display: block; font: 900 190px/1 "Articulat"; color: var(--y); letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
      .ctr span { display: block; font: 700 34px/1 "Articulat"; letter-spacing: .28em; color: #fff; margin-top: 6px; }
      .tweet { position: absolute; left: 50%; bottom: 80px; width: 980px; margin-left: -490px; padding: 26px 32px 22px; border-radius: 22px; background: #fff; color: #0f1419; box-shadow: 0 30px 70px rgba(0,0,0,.45); transform-origin: 50% 100%; }
      .twh { display: flex; align-items: center; gap: 16px; }
      .twav { width: 68px; height: 68px; border-radius: 50%; overflow: hidden; background: #e6ecf0; display: grid; place-items: center; flex: none; }
      .twn { display: flex; flex-direction: column; flex: 1; }
      .twn b { display: flex; align-items: center; gap: 8px; font: 700 30px/1.1 "Articulat"; }
      .twn span { font: 400 26px/1.2 "Articulat"; color: #536471; margin-top: 4px; }
      .twx { width: 34px; height: 34px; }
      .tweet p { font: 400 34px/1.3 "Articulat"; margin: 16px 0 14px; color: #0f1419; }
      .twm { display: flex; gap: 40px; font: 500 24px/1 "Articulat"; color: #536471; }
      .fxw { position: absolute; inset: 0; display: grid; place-items: center; transform-origin: 50% 50%; }
      .fxcard { width: 1360px; border-radius: 26px; background: var(--navy); box-shadow: 0 0 0 3px rgba(255,255,255,.18), 0 0 60px 10px rgba(255,255,255,.14), 0 50px 120px rgba(0,0,0,.6); overflow: hidden; }
      .fxh { background: var(--y); color: var(--navy); font: 800 34px/1 "Articulat"; letter-spacing: .22em; text-transform: uppercase; padding: 26px 40px; text-align: center; }
      .fxrow { display: flex; align-items: center; justify-content: space-around; padding: 44px 60px 54px; }
      .fxt { display: flex; flex-direction: column; align-items: center; gap: 22px; }
      .fxt b { font: 900 96px/1 "Articulat"; letter-spacing: .04em; color: #fff; }
      .fxvs { font: 800 60px/1 "Articulat"; color: var(--y); letter-spacing: .1em; }
      .fxq { width: 230px; height: 230px; border-radius: 50%; display: grid; place-items: center; background: var(--navy); color: var(--y); font: 900 150px/1 "Articulat"; box-shadow: inset 0 0 0 8px var(--y); }
      .foh { position: absolute; top: 0; bottom: 0; width: 56%; overflow: hidden; }
      .fol { left: 0; background: var(--y); clip-path: polygon(0 0, 100% 0, 88% 100%, 0 100%); }
      .for { right: 0; background: var(--cru); clip-path: polygon(12% 0, 100% 0, 100% 100%, 0 100%); }
      .fostripes { position: absolute; inset: 0; background: repeating-linear-gradient(-14deg, rgba(0,0,0,.08) 0 24px, transparent 24px 60px); }
      .foin { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; transform-origin: 50% 50%; }
      .fol .foin { padding-right: 160px; } .for .foin { padding-left: 160px; }
      .foin b { font: 900 300px/1 "Articulat"; letter-spacing: .02em; }
      .fol .foin b { color: var(--navy); } .for .foin b { color: #fff; }
      .fobadge { padding: 16px 34px; border-radius: 999px; background: var(--red); color: #fff; font: 800 36px/1 "Articulat"; letter-spacing: .2em; text-transform: uppercase; box-shadow: 0 16px 40px rgba(0,0,0,.4); }
      .fomid { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
      .fomid span { display: inline-block; padding: 18px 40px; border-radius: 999px; background: #fff; color: var(--navy); font: 800 34px/1 "Articulat"; letter-spacing: .26em; box-shadow: 0 20px 50px rgba(0,0,0,.45); }
      .h2h { position: absolute; left: 70px; bottom: 80px; width: 860px; border-radius: 18px; overflow: hidden; background: #fff; color: #222; box-shadow: 0 30px 70px rgba(0,0,0,.5); transform-origin: 50% 100%; }
      .h2hh { background: linear-gradient(90deg, var(--y), #e2c231); color: var(--navy); font: 800 28px/1 "Articulat"; letter-spacing: .2em; text-transform: uppercase; padding: 18px 28px; }
      .h2hb { display: flex; align-items: center; justify-content: center; gap: 28px; padding: 22px 28px; }
      .h2hb b { font: 900 76px/1 "Articulat"; color: #222; letter-spacing: .03em; }
      .h2hb span { font: 700 56px/1 "Articulat"; color: #999; }
      .tvroom { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 70% at 60% 55%, #3F1232 0%, #1b0e2c 45%, #0b0716 100%); }
      .tvyear { position: absolute; left: 80px; top: 50%; transform: translateY(-50%); font: 900 330px/1 "Articulat"; letter-spacing: -.02em; color: #fff; text-shadow: 0 0 60px rgba(255,120,200,.45), 0 20px 60px rgba(0,0,0,.6); transform-origin: 0 50%; }
      .tvw { position: absolute; right: 110px; top: 50%; width: 980px; height: 780px; margin-top: -390px; transform-origin: 50% 50%; }
      .tvset { position: absolute; inset: 0; border-radius: 38px; background: linear-gradient(180deg, #3a3a42, #1a1a20 60%, #101014); box-shadow: 0 60px 120px rgba(0,0,0,.7), inset 0 0 0 3px rgba(255,255,255,.07), inset 0 -8px 0 rgba(0,0,0,.5), 0 0 90px rgba(255,80,180,.2); padding: 54px 54px 150px; }
      .tvset::after { content: ""; position: absolute; left: 54px; right: 54px; bottom: 44px; height: 70px; border-radius: 12px; background: repeating-linear-gradient(90deg, rgba(255,255,255,.07) 0 4px, transparent 4px 12px); box-shadow: inset 0 0 0 2px rgba(0,0,0,.4); }
      .tvset::before { content: ""; position: absolute; right: 84px; bottom: 54px; width: 46px; height: 46px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #555, #151518); box-shadow: -70px 0 0 0 #1b1b20, -70px 0 0 2px rgba(255,255,255,.08), 0 0 0 2px rgba(255,255,255,.08); z-index: 2; }
      .tvscreen { position: relative; width: 100%; height: 100%; border-radius: 48px / 60px; overflow: hidden; background: #000; box-shadow: inset 0 0 90px rgba(0,0,0,.95), inset 0 0 0 10px #0a0a0c; }
      .tvscreen .fill { transform-origin: 50% 50%; }
      .scan { position: absolute; inset: 0; background: repeating-linear-gradient(180deg, rgba(0,0,0,.22) 0 2px, transparent 2px 5px); mix-blend-mode: multiply; }
      .glass { position: absolute; inset: 0; background: radial-gradient(ellipse 60% 50% at 30% 20%, rgba(255,255,255,.18), rgba(255,255,255,0) 60%); }
      .tvfoot { position: absolute; left: 50%; bottom: 22px; width: 300px; height: 34px; margin-left: -150px; border-radius: 10px; background: #0d0d10; box-shadow: inset 0 0 0 2px rgba(255,255,255,.05); }
      .score { position: absolute; left: 50%; bottom: 84px; margin-left: -400px; width: 800px; height: 128px; border-radius: 16px; overflow: visible; background: #fff; box-shadow: 0 30px 70px rgba(0,0,0,.5); display: flex; align-items: stretch; transform-origin: 50% 100%; }
      .sce { flex: 1; display: flex; align-items: center; justify-content: center; gap: 16px; font: 900 56px/1 "Articulat"; letter-spacing: .04em; }
      .scl { background: var(--cru); color: #fff; border-radius: 16px 0 0 16px; } .scr { background: var(--y); color: var(--navy); border-radius: 0 16px 16px 0; }
      .scc { width: 300px; display: flex; align-items: center; justify-content: center; gap: 18px; color: #111; }
      .scc i { font: 900 70px/1 "Articulat"; color: #888; font-style: normal; }
      .scn { position: relative; width: 90px; height: 100px; overflow: hidden; }
      .scn b { position: absolute; inset: 0; display: grid; place-items: center; font: 900 96px/1 "Articulat"; color: #111; }
      .sctag { position: absolute; left: 50%; top: -58px; transform: translateX(-50%); padding: 12px 26px; border-radius: 999px; background: var(--red); color: #fff; font: 800 28px/1 "Articulat"; letter-spacing: .22em; white-space: nowrap; box-shadow: 0 14px 30px rgba(0,0,0,.4); }
      .bigtxt { position: absolute; inset: 0; display: grid; place-items: center; font: 900 190px/1 "Articulat"; letter-spacing: .04em; color: #fff; text-shadow: 0 0 40px rgba(255,255,255,.5), 0 20px 60px rgba(0,0,0,.6); transform-origin: 50% 50%; }
      .zcw { position: absolute; inset: 0; display: grid; place-items: center; transform-origin: 50% 50%; }
      .zcframe { width: 1240px; height: 900px; border-radius: 20px; overflow: hidden; background: #fff; box-shadow: 0 50px 120px rgba(0,0,0,.6); }
      .zcbar { height: 64px; background: #e9e9ec; display: flex; align-items: center; gap: 12px; padding: 0 24px; }
      .zcbar i { width: 16px; height: 16px; border-radius: 50%; background: #c9c9ce; } .zcbar i:nth-child(1) { background: #ff5f57; } .zcbar i:nth-child(2) { background: #febc2e; } .zcbar i:nth-child(3) { background: #28c840; }
      .zcbar u { margin-left: 20px; flex: 1; max-width: 60%; height: 36px; border-radius: 999px; background: #fff; text-decoration: none; font: 500 22px/36px "Articulat"; color: #666; padding-left: 18px; }
      .zcbody { position: relative; width: 100%; height: calc(100% - 64px); overflow: hidden; }
      .zcimg { position: absolute; inset: 0; }
      .zcimg img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 0; }
      .marker { position: absolute; background: rgba(249,214,22,.55); mix-blend-mode: multiply; transform-origin: 0 50%; border-radius: 6px; }
      .stbg img { filter: blur(2px); }
      .stcrest { position: absolute; left: 150px; top: 50%; transform: translateY(-50%); filter: drop-shadow(0 30px 60px rgba(0,0,0,.6)); transform-origin: 50% 50%; }
      .stamp { position: absolute; left: 0; right: 0; top: 140px; text-align: center; font: 900 220px/1 "Articulat"; letter-spacing: .02em; color: var(--red); text-transform: uppercase; filter: url(#rough) drop-shadow(0 20px 50px rgba(0,0,0,.6)); transform: rotate(-4deg); transform-origin: 50% 50%; }
      .brbg { background: radial-gradient(ellipse 70% 80% at 50% 40%, #11295a 0%, var(--navy) 45%, var(--ink) 100%); }
      .brw { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 34px; transform-origin: 50% 50%; }
      .brtitle { font: 700 34px/1 "Articulat"; letter-spacing: .34em; color: rgba(255,255,255,.75); text-transform: uppercase; }
      .brbig { display: flex; align-items: baseline; gap: 22px; }
      .brbig b { font: 900 240px/1 "Articulat"; color: var(--y); letter-spacing: -.03em; }
      .brbig span { font: 800 64px/1 "Articulat"; letter-spacing: .2em; color: #fff; }
      .brrow { display: flex; gap: 40px; margin-top: 10px; }
      .brstep { width: 440px; padding: 34px 20px; border-radius: 22px; background: rgba(255,255,255,.07); box-shadow: inset 0 0 0 2px rgba(249,214,22,.6); display: flex; flex-direction: column; align-items: center; gap: 16px; transform-origin: 50% 50%; }
      .brstep b { font: 900 54px/1 "Articulat"; letter-spacing: .04em; color: #fff; }
      .brstep span { font: 700 24px/1 "Articulat"; letter-spacing: .3em; color: var(--navy); background: var(--y); padding: 10px 18px; border-radius: 999px; }
      .subs { position: absolute; left: 50%; bottom: 80px; transform: translateX(-50%); display: flex; gap: 22px; transform-origin: 50% 100%; }
      .subi { display: flex; align-items: center; gap: 16px; padding: 18px 30px 18px 20px; border-radius: 999px; background: rgba(6,16,31,.86); box-shadow: inset 0 0 0 2px rgba(249,214,22,.55), 0 20px 50px rgba(0,0,0,.45); transform-origin: 50% 50%; }
      .subic { width: 54px; height: 54px; border-radius: 50%; background: var(--navy); display: grid; place-items: center; }
      .subic svg { width: 34px; height: 34px; }
      .subi b { font: 800 30px/1 "Articulat"; letter-spacing: .16em; color: #fff; white-space: nowrap; }
      .lt3 { position: absolute; left: 90px; bottom: 90px; display: flex; align-items: stretch; gap: 20px; transform-origin: 0 100%; }
      .lt3 i { width: 12px; background: var(--y); border-radius: 4px; }
      .lt3 b { display: block; font: 900 64px/1 "Articulat"; letter-spacing: .03em; text-transform: uppercase; text-shadow: 0 4px 24px rgba(0,0,0,.6); }
      .lt3 span { display: block; margin-top: 10px; font: 600 28px/1 "Articulat"; letter-spacing: .28em; color: var(--y); text-transform: uppercase; }`;

  const page = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      ${fonts}
${css}
    </style>
  </head>
  <body>
    <div id="stage" data-composition-id="main" data-start="0" data-duration="${T}" data-width="${W}" data-height="${H}">
      <svg width="0" height="0" style="position:absolute"><defs>
        <filter id="rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="10" xChannelSelector="R" yChannelSelector="G"/></filter>
      </defs></svg>
      <div id="cam"><video id="src" class="clip" src="assets/media/${src.file}" muted playsinline data-start="0" data-duration="${T}" data-media-start="0" data-track-index="0"></video></div>
      ${html.join("\n      ")}
      <audio id="mix" src="assets/media/mix.m4a" data-start="0" data-duration="${T}" data-track-index="6" data-volume="1"></audio>
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      ${js.join("\n      ")}
      tl.set({}, {}, ${T});
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
  return { html: page, audio, proof: [...new Set(proof.map(f2))].filter((x) => x > 0 && x < T).sort((a, b) => a - b), log, segs };
}
