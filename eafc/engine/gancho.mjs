// Gancho/edição do canal EA FC — camada visual sobre o vídeo já cortado (modelo de edição S2G, identidade Club América).
// O vídeo do Leonel é a base (voz e corte intocados). Em cima: cutaways full-screen (escondem o rosto), cards com push-in,
// tweet, placar, TV retrô, carimbo, chaveamento, inscreva-se, câmera (push lento + punch-ins). Uma timeline GSAP pausada (seek-safe).
// Áudio: o bin mixa a voz original (ganho 1) + SFX de biblioteca abaixo da voz → assets/media/mix.m4a.

import { cssVars, SCALES } from "./tokens.mjs";

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
  const half = (e, inner) => (e.pos ? `<div class="half half-${e.pos === "left" ? "l" : "r"}">${inner}</div>` : inner);
  const rel = (e) => (e.pos ? " rel" : "");
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
      const ic = `<svg class="twv" viewBox="0 0 24 24"><path fill="#1D9BF0" d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/></svg>`;
      const mi = {
        reply: `<svg viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`,
        repost: `<svg viewBox="0 0 24 24"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>`,
        like: `<svg viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
      };
      html.push(`<div id="${id}" class="ov hid">${half(e, `<div id="${id}z" class="tweet${rel(e)}"><div class="twh"><div class="twav">${e.avatar ? crest(e.avatar, 64) : ""}</div><div class="twn"><b>${esc(e.name)} ${ic}</b><span>${esc(e.handle)}</span></div><svg class="twx" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div>
        <p>${esc(e.text)}</p><div class="twm"><span>${mi.reply}${esc(e.replies || "84")}</span><span>${mi.repost}${esc(e.reposts || "312")}</span><span class="twlike">${mi.like}${esc(e.likes || "2,1 mil")}</span></div></div>`)}</div>`);
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
        <div class="foseam"></div><div class="fomid"><span>${esc(e.mid || "LIGUILLA")}</span></div></div></div>`);
      show(id, e.at, e.dur); whipIn(`${id}z`, e.at, 0.28);
      js.push(`tl.fromTo("#${id}l .foin, #${id}r .foin", { scale: 1 }, { scale: 1.06, duration: ${f2(e.dur)}, ease: "none" }, ${f2(e.at)});`);
      if (e.badge && e.badgeAt) { show(`${id}b`, e.badgeAt); pop(`${id}b`, e.badgeAt); sfx("pop", e.badgeAt, 0.3); }
      if (door) { js.push(`tl.to("#${id}l", { xPercent: -106, duration: 0.42, ease: "power3.inOut" }, ${f2(e.at + e.dur - 0.42)}); tl.to("#${id}r", { xPercent: 106, duration: 0.42, ease: "power3.inOut" }, ${f2(e.at + e.dur - 0.42)}); tl.to("#${id} .fomid, #${id} .foseam", { opacity: 0, duration: 0.1 }, ${f2(e.at + e.dur - 0.42)}); tl.to("#${id} .dark, #${id} .blurbg", { opacity: 0, duration: 0.3 }, ${f2(e.at + e.dur - 0.35)});`); sfx("whoosh-short", e.at + e.dur - 0.45, 0.3); }
      sfx("impact-bass-2", e.at, 0.42); sfx("whoosh-short", e.at - 0.05, 0.35);
      covers.push([e.at, e.at + e.dur - (door ? 0.3 : 0)]); proof.push(e.at + 0.35, e.badgeAt ? e.badgeAt + 0.3 : e.at + 1, e.at + e.dur - 0.2);
    },
    // head-to-head (canto inferior esquerdo)
    h2h(e) {
      const id = nid("hh");
      html.push(`<div id="${id}" class="ov hid">${half(e, `<div id="${id}z" class="h2h${rel(e)}"><div class="h2hh">${esc(e.title)}</div><div class="h2hb">${crest("ame", 80)}<b>${esc(e.home || "AME")}</b><span>×</span><b>${esc(e.away || "CRU")}</b>${crest("cru", 80)}</div></div>`)}</div>`);
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
      html.push(`<div id="${id}" class="ov hid">${half(e, `<div id="${id}z" class="score${rel(e)}"><div class="sce scl">${crest("cru", 72)}<b>${esc(e.home)}</b></div><div class="scc">${num("h", e.h)}<i>–</i>${num("a", e.a)}</div><div class="sce scr"><b>${esc(e.away)}</b>${crest("ame", 72)}</div>
        <div id="${id}t" class="sctag hid"></div></div>`)}</div>`);
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
        like: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>`,
        sub: `<svg viewBox="0 0 24 24"><path fill="#FF0033" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8z"/><path fill="#fff" d="M9.6 15.6V8.4l6.2 3.6z"/></svg>`,
        bell: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>`,
      };
      const labels = { like: "LIKE", sub: "INSCREVA-SE", bell: "ATIVE O SINO" };
      html.push(`<div id="${id}" class="ov hid">${half(e, `<div id="${id}z" class="subs${rel(e)}">${(e.items || []).map((it, i) => `<div id="${id}i${i}" class="subi hid"><div class="subic">${icons[it.kind]}</div><b>${esc(it.label || labels[it.kind])}</b></div>`).join("")}</div>`)}</div>`);
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
  // tela dividida: o vídeo recua para um painel (880×495) de um lado; o outro lado recebe o gráfico (pos: "left"|"right")
  const PW = 960, PS = f2(PW / W), PY = Math.round((H - H * (PW / W)) / 2 / 8) * 8;
  for (const sp of spec.splits || []) {
    const X = sp.side === "right" ? W - 80 - PW : 80, t0 = f2(sp.at), t1 = f2(sp.at + sp.dur);
    js.push(`tl.set("#splitBg", { autoAlpha: 1 }, ${t0}); tl.fromTo("#splitBg", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" }, ${t0});
  tl.fromTo("#splitBg .stripes", { x: 0 }, { x: 64, duration: ${f2(sp.dur + 0.4)}, ease: "none" }, ${t0});
  tl.to("#camWrap", { scale: ${PS}, x: ${X}, y: ${PY}, duration: 0.45, ease: "power3.inOut" }, ${t0});
  tl.to("#camClip", { clipPath: "inset(0px round 48px)", duration: 0.45, ease: "power3.inOut" }, ${t0});
  tl.to("#camWrap", { scale: 1, x: 0, y: 0, duration: 0.4, ease: "power3.inOut" }, ${t1});
  tl.to("#camClip", { clipPath: "inset(0px round 0.01px)", duration: 0.4, ease: "power3.inOut" }, ${t1});
  tl.to("#splitBg", { opacity: 0, duration: 0.25, ease: "power2.in" }, ${f2(t1 + 0.15)}); tl.set("#splitBg", { autoAlpha: 0 }, ${f2(t1 + 0.41)});`);
    sfx("whoosh-short", t0 - 0.02, 0.26); sfx("whoosh-short", t1 - 0.02, 0.22);
    proof.push(t0 + 0.6, t1 - 0.2);
  }

  // ── CSS ───────────────────────────────────────────────────────────────────────
  const weights = { Thin: 100, ExtraLight: 200, Light: 300, Regular: 400, Normal: 450, Medium: 500, DemiBold: 600, Bold: 700, ExtraBold: 800, Heavy: 900 };
  const fonts = Object.entries(weights).map(([n, w]) => `@font-face { font-family: "Articulat"; font-weight: ${w}; src: url(assets/fonts/${n}.otf) format("opentype"); }`).join("\n      ");
  const css = `
      :root { ${cssVars()}
        --y: var(--y-400); --navy: var(--n-900); --ink: var(--n-950); --cru: var(--c-700); --red: var(--r-600); --cream: #F4EFE2; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #000; }
      #stage { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: #000; font-family: "Articulat", sans-serif; color: #fff; font-feature-settings: "tnum"; }
      b, strong { font-weight: inherit; }
      .fill { position: absolute; inset: 0; transform-origin: 50% 50%; }
      .fill > video, .fill > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #splitBg { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 80% at 50% 50%, var(--n-900) 0%, var(--n-950) 70%); }
      #camWrap { position: absolute; inset: 0; transform-origin: 0 0; }
      #camClip { position: absolute; inset: 0; overflow: hidden; clip-path: inset(0px round 0.01px); }
      #cam { position: absolute; inset: 0; transform-origin: 50% 42%; }
      .half { position: absolute; top: 0; width: 720px; height: ${H}px; display: flex; align-items: center; justify-content: center; }
      .half-l { left: var(--safe); } .half-r { left: ${W - 80 - 720}px; }
      .rel { position: relative !important; left: auto !important; right: auto !important; top: auto !important; bottom: auto !important; margin: 0 !important; width: 720px !important; transform-origin: 50% 50% !important; }
      .half .scc { width: 240px; } .half .scn { width: 80px; } .half .sce { font-size: var(--t-h5); gap: var(--s1); } .half .sce img { width: 64px !important; height: 64px !important; }
      #splitBg .wm { position: absolute; right: var(--safe); bottom: var(--safe); width: 112px; height: 112px; opacity: .22; }
      .half .subs { transform: none !important; flex-direction: column; align-items: stretch; width: auto; min-width: 560px; }
      .half .subi { justify-content: flex-start; }
      .half .subi b { font-size: var(--t-h5); }
      .half .tweet p { font-size: var(--t-body); }
      .half .h2hb b { font-size: var(--t-h3); }
      .half .h2hh { font-size: 20px; letter-spacing: .14em; white-space: nowrap; }
      #cam video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .scene { position: absolute; inset: 0; opacity: 0; visibility: hidden; }
      .ov { position: absolute; inset: 0; pointer-events: none; }
      .hid { opacity: 0; visibility: hidden; }
      .vig { position: absolute; inset: -2px; background: radial-gradient(ellipse 72% 66% at 50% 50%, rgba(0,18,60,0) 50%, rgba(0,18,60,.5) 100%); }
      .dark { position: absolute; inset: 0; background: rgba(0,18,60,.64); }
      .blurbg img { filter: blur(32px) brightness(.72); transform: scale(1.15); }
      .stripes { position: absolute; inset: 0; background: repeating-linear-gradient(-14deg, rgba(249,214,22,.06) 0 2px, transparent 2px 32px); }
      /* lower-third / rótulo */
      .lt { position: absolute; left: var(--safe); bottom: var(--safe); display: flex; align-items: stretch; gap: var(--s2); }
      .lt i { width: var(--s1); border-radius: 4px; background: var(--y-400); }
      .lt b { font: 800 var(--t-h5)/1.2 "Articulat"; letter-spacing: .06em; text-transform: uppercase; color: #fff; text-shadow: var(--sh-text); padding: var(--s1) 0; }
      /* photoCard */
      .pcw { position: absolute; inset: 0; display: grid; place-items: center; transform-origin: 50% 50%; }
      .pcard { width: 1248px; height: 704px; border-radius: var(--r-lg); overflow: hidden; background: var(--n-950); box-shadow: 0 0 0 4px #fff, var(--sh-float); transform-origin: 50% 50%; }
      .pcard img { width: 100%; height: 100%; object-fit: cover; }
      /* playerCard */
      .plcard { position: absolute; left: var(--safe); bottom: var(--safe); width: 928px; height: 304px; border-radius: var(--r-md); background: linear-gradient(135deg, var(--n-800) 0%, var(--n-900) 50%, var(--n-950) 100%); box-shadow: inset 0 0 0 1px var(--n-700), var(--sh-card); display: flex; align-items: center; gap: var(--s3); padding: 0 var(--s4) 0 0; overflow: hidden; transform-origin: 50% 50%; }
      .plbar { width: var(--s2); height: 100%; background: var(--y-400); flex: none; }
      .plph { width: 192px; height: 192px; border-radius: 50%; overflow: hidden; flex: none; box-shadow: 0 0 0 4px var(--y-400), 0 0 0 8px var(--n-950); background: var(--n-800); margin-left: var(--s2); }
      .plph img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 20%; }
      .plnum { display: flex; flex-direction: column; align-items: center; line-height: 1; padding: 0 var(--s2); border-right: 1px solid var(--n-700); }
      .plnum b { font: 900 160px/1 "Articulat"; color: var(--y-400); letter-spacing: -.03em; }
      .plnum span { font: 700 var(--t-label)/1 "Articulat"; letter-spacing: .3em; color: var(--g-200); margin-top: var(--s1); padding-left: .3em; }
      .plname { display: flex; flex-direction: column; gap: var(--s1); min-width: 0; }
      .plname b { font: 900 var(--t-h4)/1 "Articulat"; text-transform: uppercase; letter-spacing: .01em; color: #fff; white-space: nowrap; }
      .plname span { font: 500 var(--t-label)/1 "Articulat"; letter-spacing: .16em; color: var(--g-300); text-transform: uppercase; white-space: nowrap; }
      /* counter */
      .ctr { position: absolute; left: var(--safe); top: 160px; display: flex; align-items: center; gap: var(--s4); padding: var(--s4) var(--s6) var(--s4) var(--s4); border-radius: var(--r-lg); background: rgba(0,18,60,.9); box-shadow: inset 0 0 0 1px var(--n-700), var(--sh-card); transform-origin: 50% 50%; }
      .ctr b { display: block; font: 900 var(--t-display)/1 "Articulat"; color: var(--y-400); letter-spacing: -.03em; }
      .ctr span { display: block; font: 700 var(--t-body)/1 "Articulat"; letter-spacing: .28em; color: var(--g-100); margin-top: var(--s1); text-transform: uppercase; }
      /* tweet */
      .tweet { position: absolute; left: 50%; bottom: var(--safe); width: 960px; margin-left: -480px; padding: var(--s4); border-radius: var(--r-lg); background: #fff; color: var(--g-900); box-shadow: inset 0 0 0 1px var(--g-100), var(--sh-float); transform-origin: 50% 100%; }
      .twh { display: flex; align-items: center; gap: var(--s2); }
      .twav { width: 64px; height: 64px; border-radius: 50%; overflow: hidden; background: var(--g-100); display: grid; place-items: center; flex: none; }
      .twn { display: flex; flex-direction: column; flex: 1; gap: 4px; }
      .twn b { display: flex; align-items: center; gap: var(--s1); font: 700 var(--t-body)/1.1 "Articulat"; color: var(--g-900); }
      .twv { width: 28px; height: 28px; }
      .twn span { font: 400 var(--t-label)/1.2 "Articulat"; color: var(--g-500); }
      .twx { width: 32px; height: 32px; fill: var(--g-900); }
      .tweet p { font: 400 var(--t-body)/1.35 "Articulat"; margin: var(--s2) 0; color: var(--g-900); }
      .twm { display: flex; gap: var(--s6); font: 500 var(--t-label)/1 "Articulat"; color: var(--g-500); }
      .twm span { display: flex; align-items: center; gap: var(--s1); }
      .twm svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
      .twlike { color: var(--r-500); }
      /* fixture */
      .fxw { position: absolute; inset: 0; display: grid; place-items: center; transform-origin: 50% 50%; }
      .fxcard { width: 1360px; border-radius: var(--r-lg); background: var(--n-900); box-shadow: inset 0 0 0 1px var(--n-600), 0 0 0 1px rgba(255,255,255,.12), 0 0 64px 8px rgba(255,255,255,.12), var(--sh-float); overflow: hidden; }
      .fxh { background: var(--y-400); color: var(--n-950); font: 800 var(--t-body)/1 "Articulat"; letter-spacing: .2em; text-transform: uppercase; padding: var(--s3) var(--s5); text-align: center; }
      .fxrow { display: flex; align-items: center; justify-content: space-around; padding: var(--s6) var(--s8) var(--s7); }
      .fxt { display: flex; flex-direction: column; align-items: center; gap: var(--s3); }
      .fxt b { font: 900 var(--t-h2)/1 "Articulat"; letter-spacing: .04em; color: #fff; }
      .fxvs { font: 800 var(--t-h3)/1 "Articulat"; color: var(--y-400); letter-spacing: .1em; }
      .fxq { width: 224px; height: 224px; border-radius: 50%; display: grid; place-items: center; background: var(--n-800); color: var(--y-400); font: 900 152px/1 "Articulat"; box-shadow: inset 0 0 0 8px var(--y-400); }
      /* faceoff */
      .foh { position: absolute; top: 0; bottom: 0; width: 56%; overflow: hidden; }
      .fol { left: 0; background: var(--y-400); clip-path: polygon(0 0, 100% 0, 88% 100%, 0 100%); }
      .for { right: 0; background: var(--c-700); clip-path: polygon(12% 0, 100% 0, 100% 100%, 0 100%); }
      .fostripes { position: absolute; inset: 0; background: repeating-linear-gradient(-14deg, rgba(0,0,0,.07) 0 24px, transparent 24px 64px); }
      .foseam { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(255,255,255,0), #fff 40%, #fff 60%, rgba(255,255,255,0)); clip-path: polygon(${f2(0.56 * W + 0.12 * 0.56 * W - 0.12 * 0.56 * W - 14)}px 0, ${f2(0.44 * W + 0.12 * 0.56 * W + 14)}px 0, ${f2(0.44 * W + 14)}px 100%, ${f2(0.44 * W - 14)}px 100%); filter: drop-shadow(0 0 24px rgba(0,18,60,.5)); }
      .foin { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--s3); transform-origin: 50% 50%; }
      .fol .foin { padding-right: 160px; } .for .foin { padding-left: 160px; }
      .foin b { font: 900 304px/1 "Articulat"; letter-spacing: .02em; }
      .fol .foin b { color: var(--n-950); } .for .foin b { color: #fff; }
      .fobadge { padding: var(--s2) var(--s4); border-radius: var(--r-pill); background: var(--r-600); color: #fff; font: 800 var(--t-body)/1 "Articulat"; letter-spacing: .2em; text-transform: uppercase; box-shadow: var(--sh-card); }
      .fomid { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
      .fomid span { display: inline-block; padding: var(--s2) var(--s5); border-radius: var(--r-pill); background: #fff; color: var(--n-950); font: 800 var(--t-body)/1 "Articulat"; letter-spacing: .24em; box-shadow: var(--sh-float); }
      /* h2h */
      .h2h { position: absolute; left: var(--safe); bottom: var(--safe); width: 864px; border-radius: var(--r-md); overflow: hidden; background: #fff; color: var(--g-900); box-shadow: inset 0 0 0 1px var(--g-100), var(--sh-float); transform-origin: 50% 100%; }
      .h2hh { background: linear-gradient(90deg, var(--y-300), var(--y-500)); color: var(--n-950); font: 800 var(--t-label)/1 "Articulat"; letter-spacing: .2em; text-transform: uppercase; padding: var(--s2) var(--s4); }
      .h2hb { display: flex; align-items: center; justify-content: center; gap: var(--s4); padding: var(--s3) var(--s4); }
      .h2hb b { font: 900 72px/1 "Articulat"; color: var(--g-900); letter-spacing: .03em; }
      .h2hb span { font: 700 var(--t-h4)/1 "Articulat"; color: var(--g-300); }
      /* tvRetro */
      .tvroom { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 70% at 60% 55%, #3F1232 0%, #1b0e2c 45%, #0b0716 100%); }
      .tvyear { position: absolute; left: var(--safe); top: 50%; transform: translateY(-50%); font: 900 var(--t-giant)/1 "Articulat"; letter-spacing: -.02em; color: #fff; text-shadow: 0 0 64px rgba(255,120,200,.45), var(--sh-text); transform-origin: 0 50%; }
      .tvw { position: absolute; right: 112px; top: 50%; width: 976px; height: 784px; margin-top: -392px; transform-origin: 50% 50%; }
      .tvset { position: absolute; inset: 0; border-radius: var(--r-xl); background: linear-gradient(180deg, var(--g-700), var(--g-900) 60%, var(--g-950)); box-shadow: var(--sh-float), inset 0 0 0 2px rgba(255,255,255,.07), inset 0 -8px 0 rgba(0,0,0,.5), 0 0 96px rgba(255,80,180,.2); padding: var(--s7) var(--s7) 152px; }
      .tvset::after { content: ""; position: absolute; left: var(--s7); right: var(--s7); bottom: var(--s6); height: 64px; border-radius: var(--r-sm); background: repeating-linear-gradient(90deg, rgba(255,255,255,.07) 0 4px, transparent 4px 12px); box-shadow: inset 0 0 0 2px rgba(0,0,0,.4); }
      .tvset::before { content: ""; position: absolute; right: 88px; bottom: 56px; width: 48px; height: 48px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, var(--g-500), var(--g-950)); box-shadow: -72px 0 0 0 var(--g-900), -72px 0 0 2px rgba(255,255,255,.08), 0 0 0 2px rgba(255,255,255,.08); z-index: 2; }
      .tvscreen { position: relative; width: 100%; height: 100%; border-radius: 48px / 64px; overflow: hidden; background: #000; box-shadow: inset 0 0 96px rgba(0,0,0,.95), inset 0 0 0 8px #0a0a0c; }
      .tvscreen .fill { transform-origin: 50% 50%; }
      .scan { position: absolute; inset: 0; background: repeating-linear-gradient(180deg, rgba(0,0,0,.22) 0 2px, transparent 2px 5px); mix-blend-mode: multiply; }
      .glass { position: absolute; inset: 0; background: radial-gradient(ellipse 60% 50% at 30% 20%, rgba(255,255,255,.18), rgba(255,255,255,0) 60%); }
      .tvfoot { display: none; }
      /* scoreline */
      .score { position: absolute; left: 50%; bottom: var(--safe); margin-left: -400px; width: 800px; height: 128px; border-radius: var(--r-md); overflow: visible; background: #fff; box-shadow: inset 0 0 0 1px var(--g-100), var(--sh-float); display: flex; align-items: stretch; transform-origin: 50% 100%; }
      .sce { flex: 1; display: flex; align-items: center; justify-content: center; gap: var(--s2); font: 900 var(--t-h4)/1 "Articulat"; letter-spacing: .04em; }
      .scl { background: var(--c-700); color: #fff; border-radius: var(--r-md) 0 0 var(--r-md); } .scr { background: var(--y-400); color: var(--n-950); border-radius: 0 var(--r-md) var(--r-md) 0; }
      .scc { width: 304px; display: flex; align-items: center; justify-content: center; gap: var(--s2); color: var(--g-900); }
      .scc i { font: 900 var(--t-h3)/1 "Articulat"; color: var(--g-300); font-style: normal; }
      .scn { position: relative; width: 88px; height: 104px; overflow: hidden; }
      .scn b { position: absolute; inset: 0; display: grid; place-items: center; font: 900 var(--t-h2)/1 "Articulat"; color: var(--g-900); }
      .sctag { position: absolute; left: 50%; top: -56px; transform: translateX(-50%); padding: var(--s1) var(--s3); border-radius: var(--r-pill); background: var(--r-600); color: #fff; font: 800 var(--t-label)/1.2 "Articulat"; letter-spacing: .2em; text-transform: uppercase; white-space: nowrap; box-shadow: var(--sh-card); }
      /* bigText */
      .bigtxt { position: absolute; inset: 0; display: grid; place-items: center; font: 900 var(--t-display)/1 "Articulat"; letter-spacing: .04em; color: #fff; text-shadow: 0 0 48px rgba(249,214,22,.45), var(--sh-text); transform-origin: 50% 50%; }
      /* zoomCapture */
      .zcw { position: absolute; inset: 0; display: grid; place-items: center; transform-origin: 50% 50%; }
      .zcframe { width: 1248px; height: 896px; border-radius: var(--r-md); overflow: hidden; background: #fff; box-shadow: inset 0 0 0 1px var(--g-200), var(--sh-float); }
      .zcbar { height: 64px; background: var(--g-100); display: flex; align-items: center; gap: var(--s1); padding: 0 var(--s3); }
      .zcbar i { width: 16px; height: 16px; border-radius: 50%; } .zcbar i:nth-child(1) { background: var(--r-400); } .zcbar i:nth-child(2) { background: var(--y-400); } .zcbar i:nth-child(3) { background: #34C759; }
      .zcbar u { margin-left: var(--s2); flex: 1; max-width: 60%; height: 40px; border-radius: var(--r-pill); background: #fff; text-decoration: none; font: 500 var(--t-label)/40px "Articulat"; color: var(--g-500); padding-left: var(--s2); }
      .zcbody { position: relative; width: 100%; height: calc(100% - 64px); overflow: hidden; }
      .zcimg { position: absolute; inset: 0; }
      .zcimg img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 0; }
      .marker { position: absolute; background: var(--y-300); opacity: .6; mix-blend-mode: multiply; transform-origin: 0 50%; border-radius: var(--r-sm); }
      /* stamp */
      .stbg img { filter: blur(2px); }
      .stcrest { position: absolute; left: 152px; top: 50%; transform: translateY(-50%); filter: drop-shadow(0 32px 64px rgba(0,18,60,.6)); transform-origin: 50% 50%; }
      .stamp { position: absolute; left: 0; right: 0; top: 144px; text-align: center; font: 900 224px/1 "Articulat"; letter-spacing: .02em; color: var(--r-600); text-transform: uppercase; filter: url(#rough) drop-shadow(0 24px 48px rgba(0,18,60,.6)); transform: rotate(-4deg); transform-origin: 50% 50%; }
      /* bracket */
      .brbg { background: radial-gradient(ellipse 70% 80% at 50% 40%, var(--n-800) 0%, var(--n-900) 45%, var(--n-950) 100%); }
      .brw { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--s4); transform-origin: 50% 50%; }
      .brtitle { font: 700 var(--t-body)/1 "Articulat"; letter-spacing: .32em; color: var(--g-300); text-transform: uppercase; }
      .brbig { display: flex; align-items: baseline; gap: var(--s3); }
      .brbig b { font: 900 240px/1 "Articulat"; color: var(--y-400); letter-spacing: -.03em; }
      .brbig span { font: 800 var(--t-h3)/1 "Articulat"; letter-spacing: .2em; color: #fff; }
      .brrow { display: flex; gap: var(--s5); margin-top: var(--s1); }
      .brstep { width: 448px; padding: var(--s4) var(--s3); border-radius: var(--r-lg); background: var(--n-800); box-shadow: inset 0 0 0 1px var(--n-600), var(--sh-card); display: flex; flex-direction: column; align-items: center; gap: var(--s2); transform-origin: 50% 50%; }
      .brstep b { font: 900 var(--t-h4)/1 "Articulat"; letter-spacing: .04em; color: #fff; }
      .brstep span { font: 700 var(--t-label)/1 "Articulat"; letter-spacing: .28em; color: var(--n-950); background: var(--y-400); padding: var(--s1) var(--s2); border-radius: var(--r-pill); padding-left: calc(var(--s2) + .28em); }
      /* subscribe */
      .subs { position: absolute; left: 50%; bottom: var(--safe); transform: translateX(-50%); display: flex; gap: var(--s2); transform-origin: 50% 100%; }
      .subi { display: flex; align-items: center; gap: var(--s2); padding: var(--s2) var(--s4) var(--s2) var(--s2); border-radius: var(--r-pill); background: rgba(0,18,60,.9); box-shadow: inset 0 0 0 1px var(--n-600), var(--sh-card); transform-origin: 50% 50%; }
      .subic { width: 56px; height: 56px; border-radius: 50%; background: var(--n-700); display: grid; place-items: center; color: #fff; }
      .subic svg { width: 32px; height: 32px; }
      .subi b { font: 800 var(--t-body)/1 "Articulat"; letter-spacing: .12em; color: #fff; white-space: nowrap; }
      /* lowerThird */
      .lt3 { position: absolute; left: var(--safe); bottom: var(--safe); display: flex; align-items: stretch; gap: var(--s3); transform-origin: 0 100%; }
      .lt3 i { width: var(--s1); background: var(--y-400); border-radius: 4px; }
      .lt3 b { display: block; font: 900 var(--t-h3)/1 "Articulat"; letter-spacing: .02em; text-transform: uppercase; text-shadow: var(--sh-text); }
      .lt3 span { display: block; margin-top: var(--s1); font: 600 var(--t-label)/1 "Articulat"; letter-spacing: .28em; color: var(--y-300); text-transform: uppercase; }`;

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
      <div id="splitBg" class="hid"><div class="stripes"></div>${crest("ame", 112, "position:absolute;right:80px;bottom:80px;opacity:.22")}</div>
      <div id="camWrap"><div id="camClip"><div id="cam"><video id="src" class="clip" src="assets/media/${src.file}" muted playsinline data-start="0" data-duration="${T}" data-media-start="0" data-track-index="0"></video></div></div></div>
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
