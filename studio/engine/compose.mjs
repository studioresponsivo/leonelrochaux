// Motor de composição Studio Responsivo — gera o index.html (HyperFrames) a partir de um plano resolvido.
// Estilo: rosto full-bleed + cenas de tela claras com UI em 3D + legendas palavra a palavra (IDV verde/neutral).
// Entrada (montada por bin/make.mjs): { fmt, cuts, beats, words, faces, screens, spec, endVoice, total }
//   cuts:   [{ in, out, t0, dur, screen? }]   (in/out = tempo da fonte; t0 = tempo na timeline)
//   beats:  [{ do, t, ...campos }]           (t = tempo na timeline, já resolvido)

const f2 = (n) => +(+n).toFixed(3);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9%]/g, "");

const ICON = {
  check: '<svg viewBox="0 0 24 24"><path d="M5 12l4 4 10-10" fill="none" stroke="#070707" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#737373" stroke-width="3" stroke-linecap="round"/></svg>',
  gem: '<svg viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 12L2 9z M2 9h20 M9 3l3 18 3-18" fill="none" stroke="#070707" stroke-width="2.2" stroke-linejoin="round"/></svg>',
  store: '<svg viewBox="0 0 56 56"><path d="M8 22 L12 10 H44 L48 22 M8 22 H48 M8 22 V48 H48 V22 M20 48 V32 H36 V48" pathLength="1" /></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#070707"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="#fafafa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

// Sons: [arquivo, latência até soar, duração]
const SND = {
  "chime": [0.42, 2.54], "ping": [0.31, 1.32], "pop": [0.04, 0.72], "click": [0.045, 0.36], "click-soft": [0.045, 0.36],
  "whoosh-short": [0.07, 0.57], "whoosh": [0.07, 0.57], "impact-bass-1": [0.04, 2.1], "key-press": [0.07, 0.43], "notification": [0.09, 2.4],
};

export function compose(plan) {
  const { fmt, cuts, beats, words, faces, screens, spec, endVoice, total } = plan;
  const V = fmt === "vertical";
  const W = V ? 1080 : 1920, H = V ? 1920 : 1080;
  const js = [], sfx = [];
  const snd = (name, t, vol) => sfx.push([name, t, vol]);
  const at = (t) => f2(t);

  // ── blocos: corridas contínuas de rosto ou de tela ──────────────────────────
  const blocks = [];
  for (const c of cuts) {
    const kind = c.screen ? "screen" : "face";
    const last = blocks.at(-1);
    if (last && last.kind === kind && last.screen === c.screen) { last.out = f2(c.t0 + c.dur); last.cuts.push(c); }
    else blocks.push({ kind, screen: c.screen, in: c.t0, out: f2(c.t0 + c.dur), cuts: [c] });
  }
  const screenBlocks = blocks.filter((b) => b.kind === "screen");
  const blockAt = (t) => blocks.find((b) => t >= b.in - 0.001 && t < b.out) || blocks.at(-1);

  // ── layout por formato ────────────────────────────────────────────────────────
  const L = V ? {
    capsTop: 1450, capFont: 76, capSide: 60, faceTopY: 236, meterW: 900, wordY: 250, wordSize: 190,
    sticker: "right: 120px; top: 760px;",
  } : {
    capsTop: 890, capFont: 62, capSide: 200, faceTopY: 70, meterW: 900, wordY: 120, wordSize: 170,
    sticker: "right: 160px; top: 150px;",
  };
  const screenLayout = (s) => {
    const cw = s.crop[2] - s.crop[0], ch = s.crop[3] - s.crop[1];
    const [, , camW, camH] = s.cam;
    if (V) {
      let dW = 980, dH = dW * ch / cw;
      if (dH > 560) { dH = 560; dW = dH * cw / ch; }
      const dL = (W - dW) / 2, dT = 170, midT = dT + dH + 42;
      let bW = 630, bH = bW * camH / camW;
      const bT = midT + 160;
      if (bT + bH > 1400) { bH = 1400 - bT; bW = bH * camW / camH; }
      return { dL, dT, dW, dH, midL: 90, midT, midW: 900, bL: (W - bW) / 2, bT, bW, bH };
    }
    let dW = 1180, dH = dW * ch / cw;
    if (dH > 680) { dH = 680; dW = dH * cw / ch; }
    const dL = 80, dT = 110, midT = dT + dH + 36;
    const bW = 540, bH = bW * camH / camW;
    return { dL, dT, dW, dH, midL: dL, midT, midW: dW, bL: 1300, bT: 150, bW, bH };
  };

  // ── legendas ──────────────────────────────────────────────────────────────────
  const capMode = spec.captions ?? (V ? "full" : "none");
  const FIX = spec.fixes || {};
  const KW = new Set((spec.keywords || []).map(norm));
  const capWords = [];
  if (capMode !== "none") for (const c of cuts) for (const w of words) {
    if (w.start < c.in - 0.02 || w.start >= c.out - 0.05) continue;
    let txt = FIX[w.text] ?? w.text;
    const end = /[.?!,]$/.test(txt);
    txt = txt.replace(/[.,!;:]+$/, "");
    const bare = norm(txt);
    const kind = /^\d+%$/.test(bare) ? "hl" : KW.has(bare) ? "kw" : "";
    capWords.push({ t: f2(c.t0 + Math.max(w.start, c.in) - c.in), e: f2(c.t0 + Math.min(w.end, c.out) - c.in), txt, end, kind });
  }
  const groups = [];
  { let g = [];
    for (const w of capWords) {
      const prev = g.at(-1), len = g.reduce((a, x) => a + x.txt.length + 1, 0) + w.txt.length;
      if (g.length && (g.length >= 3 || len > (V ? 18 : 30) || prev.end || w.t - prev.e > 0.35)) { groups.push(g); g = []; }
      g.push(w);
    }
    if (g.length) groups.push(g); }
  groups.forEach((g, i) => { g.s = g[0].t; g.e = f2(Math.min(groups[i + 1]?.[0].t ?? endVoice, g.at(-1).e + 0.9)); });
  const capsHtml = groups.map((g, i) => `<div class="cap" id="cap-${i}">${g.map((w, j) => `<span class="w ${w.kind}" id="w-${i}-${j}">${esc(w.txt)}</span>`).join(" ")}</div>`).join("\n        ");
  groups.forEach((g, i) => {
    js.push(`tl.set("#cap-${i}",{autoAlpha:1},${g.s});tl.set("#cap-${i}",{autoAlpha:0},${g.e});`);
    g.forEach((w, j) => js.push(`tl.fromTo("#w-${i}-${j}",{autoAlpha:0,y:26,scale:0.7},{autoAlpha:1,y:0,scale:1,duration:0.22,ease:"back.out(2.6)",immediateRender:false},${w.t});`));
  });

  // ── rosto ─────────────────────────────────────────────────────────────────────
  const VS = V ? H / 1080 : 1; // escala do vídeo 16:9 no quadro
  const vidW = 1920 * VS, vidH = 1080 * VS;
  let faceVideos = "";
  blocks.forEach((b, i) => {
    if (b.kind !== "face") return;
    faceVideos += `<video id="vF${i}" class="clip" src="assets/media/edit.mp4" muted playsinline data-start="${b.in}" data-duration="${f2(b.out - b.in)}" data-media-start="${b.in}" data-track-index="0"></video>\n            `;
  });
  if (V) { // câmera que segue o rosto, corte seco a cada corte
    const panX = (x) => f2(Math.min(0, Math.max(W - vidW, W / 2 - x * VS)));
    cuts.forEach((c, ci) => {
      if (c.screen) return;
      const pts = (faces[ci] || []).map(([t, x]) => [f2(c.t0 + Math.min(Math.max(t, c.in), c.out) - c.in), x]);
      if (!pts.length) { js.push(`tl.set("#facePan",{x:${panX(960)}},${c.t0 || 0.001});`); return; }
      const sm = pts.map((p, i) => { const w = pts.slice(Math.max(0, i - 2), i + 3).map((q) => q[1]).sort((a, b) => a - b); return [p[0], w[w.length >> 1]]; });
      const keys = [sm[0]];
      for (const p of sm.slice(1)) if (Math.abs(p[1] - keys.at(-1)[1]) > 40) keys.push(p);
      js.push(`tl.set("#facePan",{x:${panX(keys[0][1])}},${c.t0 || 0.001});`);
      for (let k = 1; k < keys.length; k++) {
        const dt = Math.max(0.4, Math.min(1.2, keys[k][0] - keys[k - 1][0]));
        js.push(`tl.to("#facePan",{x:${panX(keys[k][1])},duration:${f2(dt)},ease:"sine.inOut"},${f2(Math.max(c.t0, keys[k][0] - dt / 2))});`);
      }
    });
  }
  if (!beats.some((b) => b.do === "hook" && b.t < 0.5)) js.push(`tl.fromTo("#faceZoom",{scale:1.08},{scale:1,duration:0.7,ease:"expo.out"},0.01);`);
  snd("impact-bass-1", 0.02, 0.3);

  // ── cenas de tela ─────────────────────────────────────────────────────────────
  let screenHtml = "";
  const scr = {}; // por bloco: layout, notas, slot
  screenBlocks.forEach((b, k) => {
    const s = screens[b.screen];
    const lay = screenLayout(s);
    const sc = lay.dW / (s.crop[2] - s.crop[0]);
    const camSc = lay.bW / s.cam[2];
    scr[k] = { b, s, lay, sc, notes: [], id: `s${k}` };
    const media = s.live
      ? `<video id="s${k}live" class="clip" src="assets/media/edit.mp4" muted playsinline data-start="${b.in}" data-duration="${f2(b.out - b.in)}" data-media-start="${b.in}" data-track-index="2" style="position:absolute;left:${f2(-s.crop[0] * sc)}px;top:${f2(-s.crop[1] * sc)}px;width:${f2(1920 * sc)}px;height:${f2(1080 * sc)}px"></video>`
      : `<img src="assets/media/${s.file}" alt="" style="position:absolute;left:${f2(-s.crop[0] * sc)}px;top:${f2(-s.crop[1] * sc)}px;width:${f2(1920 * sc)}px;height:${f2(1080 * sc)}px" />`;
    screenHtml += `
      <div id="s${k}" class="layer bg-brand" style="opacity:0;visibility:hidden">
        <div class="dashStage"><div id="s${k}dash" class="card" style="left:${f2(lay.dL)}px;top:${f2(lay.dT)}px;width:${f2(lay.dW)}px;height:${f2(lay.dH)}px">
          <div id="s${k}in" class="dashInner" style="width:${f2(lay.dW)}px;height:${f2(lay.dH)}px">
            ${media}
            <svg class="notes" width="${f2(lay.dW)}" height="${f2(lay.dH)}" viewBox="0 0 ${f2(lay.dW)} ${f2(lay.dH)}">__NOTES_s${k}__</svg>
          </div>
          <svg id="s${k}cur" class="cursor" viewBox="0 0 24 24"><path d="M4 2 L4 20 L9 15 L12 22 L15 21 L12 14 L19 14 Z" fill="#fafafa" stroke="#070707" stroke-width="1.5" stroke-linejoin="round"/></svg>
          <div id="s${k}glow" class="glow"></div>
        </div></div>
        __SLOT_s${k}__
        <div id="s${k}bub" class="card" style="left:${f2(lay.bL)}px;top:${f2(lay.bT)}px;width:${f2(lay.bW)}px;height:${f2(lay.bH)}px">
          <video id="s${k}cam" class="clip" src="assets/media/edit.mp4" muted playsinline data-start="${b.in}" data-duration="${f2(b.out - b.in)}" data-media-start="${b.in}" data-track-index="1" style="position:absolute;left:${f2(-s.cam[0] * camSc)}px;top:${f2(-s.cam[1] * camSc)}px;width:${f2(1920 * camSc)}px;height:${f2(1080 * camSc)}px"></video>
          <div class="bubRing"></div>
        </div>
      </div>`;
    const tIn = b.in, tOut = b.out;
    js.push(`tl.to("#faceZoom",{scale:1.25,duration:0.35,ease:"power2.in"},${at(tIn - 0.35)});`);
    js.push(`tl.fromTo("#s${k}",{autoAlpha:0},{autoAlpha:1,duration:0.25,ease:"power1.out"},${at(tIn - 0.1)});`);
    js.push(`tl.set("#faceZoom",{scale:1},${at(tIn + 0.3)});`);
    js.push(`tl.fromTo("#s${k}dash",{y:90,scale:0.88,autoAlpha:0,rotationY:-26,rotationX:16},{y:0,scale:1,autoAlpha:1,rotationY:-9,rotationX:7,duration:0.9,ease:"expo.out"},${tIn});`);
    js.push(`tl.to("#s${k}dash",{rotationY:-2,rotationX:2,duration:${f2(Math.max(1, tOut - tIn - 1.4))},ease:"sine.inOut"},${at(tIn + 0.9)});`);
    js.push(`tl.fromTo("#s${k}bub",{y:120,autoAlpha:0},{y:0,autoAlpha:1,duration:0.7,ease:"expo.out"},${at(tIn + 0.12)});`);
    js.push(`tl.set("#caps",{attr:{"data-mode":"light"}},${tIn});tl.set("#caps",{attr:{"data-mode":"dark"}},${tOut});`);
    js.push(`tl.to("#s${k}",{autoAlpha:0,duration:0.25,ease:"power1.in"},${at(tOut - 0.08)});`);
    js.push(`tl.set("#faceZoom",{scale:1.2},${tOut});tl.to("#faceZoom",{scale:1,duration:0.6,ease:"expo.out"},${at(tOut + 0.01)});`);
    snd("whoosh", tIn - 0.25, 0.42);
    if (tOut < endVoice - 0.2) snd("whoosh", tOut - 0.1, 0.42);
  });
  const screenOf = (t) => Object.values(scr).find((x) => t >= x.b.in - 0.001 && t < x.b.out);
  // câmera dentro do dashboard (coords da tela original)
  const dcam = (x, z, fx, fy) => {
    const { lay, sc, s } = x;
    const px = (fx - s.crop[0]) * sc, py = (fy - s.crop[1]) * sc;
    return { x: f2(Math.min(0, Math.max(lay.dW - lay.dW * z, lay.dW / 2 - px * z))), y: f2(Math.min(0, Math.max(lay.dH - lay.dH * z, lay.dH / 2 - py * z))), scale: z };
  };

  // ── slots: ocupantes que se substituem (topo do rosto / meio da tela) ─────────
  const slots = { face: [] };
  screenBlocks.forEach((_, k) => (slots[`s${k}`] = []));
  const slotOf = (t) => { const x = screenOf(t); return x ? x.id : "face"; };
  const slotEnd = (name, t) => {
    if (name !== "face") return scr[name.slice(1)].b.out;
    const nextScreen = screenBlocks.find((b) => b.in > t);
    return nextScreen ? nextScreen.in - 0.4 : endVoice;
  };

  let faceExtra = "", splitHtml = "", n = 0;
  let meterN = 0, chipGroup = null;
  const split = [];

  for (const b of beats) {
    const t = b.t, id = `b${n++}`;
    switch (b.do) {
      case "punch": {
        const s = b.scale ?? 1.07;
        js.push(`tl.to("#faceZoom",{scale:${s},duration:0.22,ease:"expo.out"},${t});tl.to("#faceZoom",{scale:1,duration:0.5,ease:"power2.inOut"},${at(t + (b.hold ?? 0.7))});`);
        if (b.sound !== false) snd("pop", t, 0.25);
        break;
      }
      case "wiggle":
        js.push(`tl.to("#faceShake",{rotation:1.2,x:8,duration:0.06,ease:"sine.inOut"},${t});tl.to("#faceShake",{rotation:-1,x:-7,duration:0.08,ease:"sine.inOut"},${at(t + 0.06)});tl.to("#faceShake",{rotation:0.5,x:4,duration:0.08,ease:"sine.inOut"},${at(t + 0.14)});tl.to("#faceShake",{rotation:0,x:0,duration:0.12,ease:"sine.out"},${at(t + 0.22)});`);
        snd("click", t, 0.35);
        break;
      case "hook": {
        const slot = slotOf(t);
        const HLW = new Set((b.hl || []).map(norm));
        const ws = String(b.text).split(/\s+/);
        const html = `<div class="hook">${ws.map((w, i) => `<span class="hw${/\d+%/.test(w) || HLW.has(norm(w)) ? " hl" : ""}" id="${id}w${i}">${esc(w)}</span>`).join(" ")}</div>`;
        slots[slot].push({ t: at(t), id, html, kind: "hook", hold: b.hold ?? 3 });
        ws.forEach((_, i) => js.push(`tl.fromTo("#${id}w${i}",{autoAlpha:0,y:30,scale:0.8},{autoAlpha:1,y:0,scale:1,duration:0.35,ease:"back.out(2.2)"},${at(t + 0.08 + i * 0.07)});`));
        snd("whoosh-short", t, 0.32);
        const cards = b.cards || [];
        if (!cards.length) {
          if (b.punch !== false) js.push(`tl.fromTo("#faceZoom",{scale:1.1},{scale:1,duration:0.9,ease:"expo.out"},${at(t + 0.01)});`);
          break;
        }
        // modo palco: rosto em card central + cards 3D com trechos do vídeo, depois expande
        const hEnd = at(t + (b.hold ?? 3));
        const clip = V ? "inset(430px 150px 520px 150px round 40px)" : "inset(200px 560px 110px 560px round 36px)";
        const fz = V ? "{scale:0.62" : "{scale:0.8,y:60";
        js.push(`tl.fromTo("#splitBg",{autoAlpha:1},{autoAlpha:1,duration:0.01},${at(t)});tl.fromTo("#faceCam",{clipPath:"${clip}"},{clipPath:"${clip}",duration:0.01},${at(t)});tl.fromTo("#faceZoom",${fz}},${fz},duration:0.01},${at(t)});`);
        js.push(`tl.to("#faceCam",{clipPath:"inset(0px 0px 0px 0px round 0px)",duration:0.6,ease:"power3.inOut"},${hEnd});tl.to("#faceZoom",{scale:1,y:0,duration:0.6,ease:"power3.inOut"},${hEnd});tl.to("#splitBg",{autoAlpha:0,duration:0.4},${at(hEnd + 0.2)});`);
        snd("whoosh", hEnd, 0.38);
        js.push(`tl.set("#caps",{attr:{"data-mode":"light"}},${at(t)});tl.set("#caps",{attr:{"data-mode":"dark"}},${hEnd});`);
        const POS = V
          ? [{ l: 30, t: 1060, w: 420, h: 280, ry: 20 }, { l: 640, t: 455, w: 400, h: 265, ry: -20 }, { l: 600, t: 1150, w: 360, h: 230, ry: -16 }]
          : [{ l: 120, t: 300, w: 480, h: 300, ry: 22 }, { l: 1320, t: 230, w: 480, h: 300, ry: -22 }, { l: 1350, t: 600, w: 420, h: 260, ry: -18 }];
        cards.slice(0, 3).forEach((c, i) => {
          const p = POS[i], cid = `${id}c${i}`, ct = at(t + 0.25 + i * 0.22);
          let inner = "";
          if (c.type === "clip") inner = `<video id="${cid}v" class="clip" src="assets/media/${c.file || "edit.mp4"}" muted playsinline data-start="${at(t)}" data-duration="${f2(hEnd + 0.6 - t)}" data-media-start="${c.file ? 0 : c.mt}" data-track-index="${8 + i}" style="width:100%;height:100%;object-fit:cover"></video>`;
          else if (c.type === "screen") { const sc = screens[c.id]; const cx = ((sc.crop[0] + sc.crop[2]) / 2 / 19.2).toFixed(1), cy = ((sc.crop[1] + sc.crop[3]) / 2 / 10.8).toFixed(1); inner = `<img src="assets/media/${sc.file}" alt="" style="width:100%;height:100%;object-fit:cover;object-position:${cx}% ${cy}%;transform:scale(${c.zoom ?? 1.6});transform-origin:${cx}% ${cy}%" />`; }
          else inner = `<img src="assets/media/${c.src}" alt="" style="width:100%;height:100%;object-fit:cover" />`;
          faceExtra += `<div class="hookStage"><div id="${cid}" class="hookCard" style="left:${p.l}px;top:${p.t}px;width:${p.w}px;height:${p.h}px">${inner}${c.label ? `<div class="hookLabel">${esc(c.label)}</div>` : ""}</div></div>`;
          js.push(`tl.fromTo("#${cid}",{autoAlpha:0,y:90,scale:0.8,rotationY:${p.ry * 2},rotationX:10},{autoAlpha:1,y:0,scale:1,rotationY:${p.ry},rotationX:4,duration:0.7,ease:"expo.out"},${ct});tl.to("#${cid}",{y:-14,rotationY:${p.ry * 0.7},duration:${f2(hEnd - ct - 0.7)},ease:"sine.inOut"},${at(ct + 0.7)});tl.to("#${cid}",{autoAlpha:0,y:-60,scale:0.9,duration:0.4,ease:"power2.in"},${at(hEnd - 0.1)});`);
          snd("pop", ct, 0.26);
        });
        break;
      }
      case "meter": {
        const slot = slotOf(t), m = meterN++;
        const v = b.value ?? 80;
        const html = `<div id="${id}" class="bar"><div class="track"><div class="seg ai" style="width:${v}%"><span>${esc(b.a ?? "IA")}</span><small id="${id}pct">${slot === "face" ? "0" : v}%</small></div><div class="seg you"><div class="fill"></div><span id="${id}b">${esc(b.b ?? "VOCÊ")}${b.complete != null ? " ?" : ""}</span></div></div></div>`;
        slots[slot].push({ t: at(t - 0.06), id, html, kind: "meter" });
        js.push(`tl.fromTo("#${id} .ai",{scaleX:0},{scaleX:1,duration:0.8,ease:"expo.out"},${t});`);
        if (slot === "face") js.push(`(()=>{const o={v:0};tl.fromTo(o,{v:0},{v:${v},duration:0.8,ease:"expo.out",onUpdate:()=>{document.getElementById("${id}pct").textContent=Math.round(o.v)+"%";}},${t});})();`);
        snd("whoosh-short", t - 0.06, 0.3); snd("ping", t + 0.84, 0.22);
        if (b.flash != null) { js.push(`tl.to("#${id} .you",{boxShadow:"inset 0 0 0 3px #22c55e",duration:0.3},${b.flash});tl.to("#${id} .you",{scale:1.08,duration:0.2,ease:"expo.out",yoyo:true,repeat:3},${b.flash});`); snd("click", b.flash, 0.3); }
        if (b.complete != null) {
          js.push(`tl.fromTo("#${id} .you .fill",{scaleX:0,autoAlpha:1},{scaleX:1,autoAlpha:1,duration:0.8,ease:"expo.out"},${b.complete});tl.set("#${id}b",{textContent:"${100 - v}%"},${b.complete});tl.to("#${id}b",{color:"#070707",duration:0.3},${b.complete});`);
          if (b.total) { slots[slot].at(-1).extra = `<div id="${id}tot" class="total">${esc(b.total)}</div>`; js.push(`tl.fromTo("#${id}tot",{autoAlpha:0,y:10},{autoAlpha:1,y:0,duration:0.4,ease:"expo.out"},${at(b.complete + 0.6)});`); }
          snd("ping", b.complete + 0.75, 0.25);
        }
        chipGroup = null;
        break;
      }
      case "chip": case "badge": {
        const slot = slotOf(t);
        if (!chipGroup || chipGroup.slot !== slot || chipGroup.kind === "done") {
          chipGroup = { slot, id: `cg${n}`, items: [], badges: [] };
          slots[slot].push({ t: at(t - 0.05), id: chipGroup.id, kind: "chips", group: chipGroup });
        }
        if (b.do === "chip") { chipGroup.items.push(`<div class="chip" id="${id}"><i>${ICON.check}</i>${esc(b.text)}</div>`); js.push(`tl.fromTo("#${id}",{autoAlpha:0,y:24,scale:0.85},{autoAlpha:1,y:0,scale:1,duration:0.45,ease:"back.out(2)"},${t});`); snd("click-soft", t, 0.4); }
        else { chipGroup.badges.push(`<div class="badge" id="${id}">${esc(b.text)}</div>`); js.push(`tl.fromTo("#${id}",{autoAlpha:0,y:14,scale:0.8},{autoAlpha:1,y:0,scale:1,duration:0.45,ease:"back.out(2.2)"},${t});`); snd("pop", t, 0.3); }
        break;
      }
      case "focus": {
        const x = screenOf(t); if (!x) break;
        const o = b.z === 1 || b.z == null && b.x == null ? dcam(x, 1, (x.s.crop[0] + x.s.crop[2]) / 2, (x.s.crop[1] + x.s.crop[3]) / 2) : dcam(x, b.z ?? 1.7, b.x, b.y);
        js.push(`tl.to("#${x.id}in",${JSON.stringify({ ...o, duration: b.dur ?? 0.8, ease: "power2.inOut" })},${at(t - (b.lead ?? 0.3))});`);
        break;
      }
      case "note": {
        const x = screenOf(t); if (!x) break;
        const cx = f2((b.x - x.s.crop[0]) * x.sc), cy = f2((b.y - x.s.crop[1]) * x.sc), r = f2((b.r ?? 40) * x.sc), lw = b.label.length * 13 + 26;
        const tx = cx > x.lay.dW * 0.6 ? f2(cx - r * 0.7 - lw) : f2(cx + r * 0.7);
        x.notes.push({ id, cx, cy, svg: `<g class="note" id="${id}"><circle class="ring" cx="${cx}" cy="${cy}" r="${r}" pathLength="1"/><g transform="translate(${tx} ${f2(cy - r - 10)})"><g class="tag"><rect x="0" y="-22" rx="11" width="${lw}" height="30"/><text x="13" y="-2">${esc(b.label)}</text></g></g><g transform="translate(${cx} ${cy})"><g class="ok"><circle r="17"/><path d="M-8 0 L-2 6 L9 -6"/></g></g></g>`, fixed: false });
        js.push(`tl.to("#${id} .ring",{strokeDashoffset:0,duration:0.45,ease:"power2.out"},${t});tl.fromTo("#${id} .tag",{autoAlpha:0,y:8},{autoAlpha:1,y:0,duration:0.3,ease:"back.out(2)"},${at(t + 0.15)});`);
        snd("key-press", t, 0.45);
        break;
      }
      case "fix": {
        const x = screenOf(t); if (!x) break;
        const open = x.notes.filter((q) => !q.fixed);
        open.forEach((q, i) => {
          const ft = f2(t + i * 0.6);
          if (i === 0) js.push(`tl.fromTo("#${x.id}cur",{autoAlpha:0,x:${f2(x.lay.dW * 0.9)},y:${f2(x.lay.dH * 0.9)}},{autoAlpha:1,x:${q.cx},y:${q.cy},duration:0.45,ease:"power2.inOut"},${at(ft - 0.45)});`);
          else js.push(`tl.to("#${x.id}cur",{x:${q.cx},y:${q.cy},duration:0.45,ease:"power2.inOut"},${at(ft - 0.45)});`);
          js.push(`tl.to("#${x.id}cur",{scale:0.8,duration:0.08,yoyo:true,repeat:1},${ft});tl.to("#${q.id} .ring",{stroke:"#22c55e",duration:0.25},${ft});tl.to("#${q.id} .tag",{autoAlpha:0,duration:0.2},${ft});tl.fromTo("#${q.id} .ok",{autoAlpha:0,scale:0.3,transformOrigin:"50% 50%"},{autoAlpha:1,scale:1,duration:0.35,ease:"back.out(3)"},${at(ft + 0.05)});`);
          snd("click-soft", ft + 0.05, 0.4);
          q.fixed = true;
        });
        if (open.length) js.push(`tl.to("#${x.id}cur",{autoAlpha:0,duration:0.3},${at(t + (open.length - 1) * 0.6 + 0.6)});`);
        break;
      }
      case "glow": {
        const x = screenOf(t); if (!x) break;
        js.push(`tl.fromTo("#${x.id}glow",{autoAlpha:0},{autoAlpha:1,duration:0.5,ease:"expo.out"},${t});tl.to("#${x.id}glow",{autoAlpha:0.35,duration:0.6},${at(t + 0.6)});tl.to("#${x.id}dash",{rotationY:4,rotationX:3,duration:1.4,ease:"power2.inOut"},${at(t - 0.2)});`);
        snd("chime", t, 0.22);
        break;
      }
      case "list": {
        const tIn = at(t - 0.3), tOut = at(b.until);
        const k = split.length;
        split.push({ tIn, tOut });
        const icon = (tone) => tone === "bad" ? ICON.x : tone === "best" ? ICON.gem : ICON.check;
        splitHtml += `
      <div id="L${k}" class="layer listLayer" style="opacity:0;visibility:hidden">
        <div class="listTitle" id="L${k}t">${b.icon === "none" ? "" : ICON.store}${esc(b.title || "")}</div>
        ${(b.items || []).map((it, i) => `<div class="row ${it.tone === "bad" ? "bad" : "good"}" id="L${k}r${i}" style="${V ? `top:${1186 + i * 138}px` : `top:${300 + i * 150}px`}"><i>${icon(it.tone)}</i>${esc(it.text)}</div>`).join("\n        ")}
      </div>`;
        const clip = V ? "inset(150px 48px 860px 48px round 44px)" : "inset(90px 860px 90px 60px round 40px)";
        const fz = V ? "{y:-150,scale:0.62" : "{x:-300,scale:0.9";
        js.push(`tl.fromTo("#faceCam",{clipPath:"inset(0px 0px 0px 0px round 0px)"},{clipPath:"${clip}",duration:0.6,ease:"power2.inOut"},${tIn});tl.to("#faceZoom",${fz},duration:0.6,ease:"power2.inOut"},${tIn});tl.to("#faceShade",{autoAlpha:0.4,duration:0.6},${tIn});tl.fromTo("#splitBg",{autoAlpha:0},{autoAlpha:1,duration:0.5},${tIn});tl.fromTo("#L${k}",{autoAlpha:0},{autoAlpha:1,duration:0.4},${at(tIn + 0.2)});tl.fromTo("#L${k}t path",{strokeDasharray:1,strokeDashoffset:1},{strokeDashoffset:0,duration:0.8,ease:"power2.out"},${at(tIn + 0.25)});tl.fromTo("#L${k}t",{autoAlpha:0,x:-20},{autoAlpha:1,x:0,duration:0.5,ease:"expo.out"},${at(tIn + 0.25)});`);
        if (V) js.push(`tl.to("#caps",{y:-560,duration:0.6,ease:"power2.inOut"},${tIn});tl.to("#caps",{y:0,duration:0.55,ease:"power2.inOut"},${tOut});`);
        else js.push(`tl.to("#caps",{x:-430,duration:0.6,ease:"power2.inOut"},${tIn});tl.to("#caps",{x:0,duration:0.55,ease:"power2.inOut"},${tOut});`);
        (b.items || []).forEach((it, i) => {
          js.push(`tl.fromTo("#L${k}r${i}",{autoAlpha:0,x:-60},{autoAlpha:1,x:0,duration:0.5,ease:"expo.out"},${it.t});`);
          if (it.tone === "best") js.push(`tl.to("#L${k}r${i}",{boxShadow:"0 0 0 3px #22c55e, 0 26px 50px -16px rgba(34,197,94,.45)",duration:0.4},${at(it.t + 0.4)});`);
          snd("click-soft", it.t, 0.4);
        });
        js.push(`tl.to("#faceCam",{clipPath:"inset(0px 0px 0px 0px round 0px)",duration:0.55,ease:"power2.inOut"},${tOut});tl.to("#faceZoom",{x:0,y:0,scale:1,duration:0.55,ease:"power2.inOut"},${tOut});tl.to("#faceShade",{autoAlpha:1,duration:0.55},${tOut});tl.to("#L${k}",{autoAlpha:0,duration:0.3},${tOut});tl.to("#splitBg",{autoAlpha:0,duration:0.5},${tOut});`);
        snd("whoosh-short", tIn, 0.32); snd("whoosh-short", tOut, 0.3);
        break;
      }
      case "sticker":
        faceExtra += `<div id="${id}" class="sticker" style="${L.sticker}">${esc(b.text)}</div>`;
        js.push(`tl.fromTo("#${id}",{autoAlpha:0,scale:0.5,rotation:-12},{autoAlpha:1,scale:1,rotation:-6,duration:0.45,ease:"back.out(2.5)"},${t});tl.to("#${id}",{autoAlpha:0,scale:0.8,duration:0.3},${at(t + (b.hold ?? 1.1))});`);
        snd("pop", t, 0.3);
        break;
      case "word": {
        const hide = at(Math.min(endVoice - 0.05, t + (b.hold ?? 2.5)));
        faceExtra += `<div id="${id}" class="bigWord">${esc(b.text)}</div><div id="${id}l" class="bigLine"></div>`;
        js.push(`tl.fromTo("#${id}",{autoAlpha:0,scale:1.3,y:20},{autoAlpha:1,scale:1,y:0,duration:0.45,ease:"expo.out"},${t});tl.fromTo("#${id}l",{scaleX:0,autoAlpha:1},{scaleX:1,autoAlpha:1,duration:0.5,ease:"expo.out"},${at(t + 0.15)});tl.to("#${id},#${id}l",{autoAlpha:0,duration:0.3},${hide});`);
        js.push(`tl.to("#faceZoom",{scale:1.07,duration:0.22,ease:"expo.out"},${t});tl.to("#faceZoom",{scale:1.02,duration:0.5,ease:"power2.inOut"},${at(t + 0.7)});`);
        snd("impact-bass-1", t, 0.35);
        break;
      }
    }
  }

  // ── montar slots ──────────────────────────────────────────────────────────────
  const slotHtml = { face: "" };
  for (const [name, occ] of Object.entries(slots)) {
    occ.sort((a, b) => a.t - b.t);
    let html = "";
    occ.forEach((o, i) => {
      const end = at(Math.min(occ[i + 1] ? occ[i + 1].t - 0.05 : Infinity, slotEnd(name, o.t), o.hold ? o.t + o.hold : Infinity));
      const inner = o.kind === "chips" ? `<div class="chips">${o.group.items.join("")}</div>${o.group.badges.join("")}` : o.html + (o.extra || "");
      html += `<div id="${o.id}w" class="slotItem" style="opacity:0;visibility:hidden">${inner}</div>`;
      js.push(`tl.fromTo("#${o.id}w",{autoAlpha:0,y:${name === "face" ? -30 : 30}},{autoAlpha:1,y:0,duration:0.45,ease:"expo.out"},${o.t});tl.to("#${o.id}w",{autoAlpha:0,y:${name === "face" ? -24 : -16},duration:0.3,ease:"power2.in"},${at(end - 0.3)});`);
    });
    slotHtml[name] = html;
  }
  for (const [k, x] of Object.entries(scr)) {
    screenHtml = screenHtml.replace(`__NOTES_s${k}__`, x.notes.map((q) => q.svg).join(""))
      .replace(`__SLOT_s${k}__`, `<div class="slot" style="left:${f2(x.lay.midL)}px;top:${f2(x.lay.midT)}px;width:${f2(x.lay.midW)}px">${slotHtml[`s${k}`] || ""}</div>`);
  }

  // ── CTA ───────────────────────────────────────────────────────────────────────
  const cta = spec.cta;
  let ctaHtml = "";
  const C = endVoice;
  if (cta) {
    ctaHtml = `
      <div id="cta" class="layer bg-brand" style="opacity:0;visibility:hidden">
        <img id="ctaIcon" src="assets/brand/logo-icone.png" alt="" />
        <div id="ctaKicker">${esc(cta.kicker ?? "VÍDEO COMPLETO")}</div>
        <div id="ctaHead">${esc(cta.title ?? "Assista agora no meu canal do YouTube")}</div>
        ${cta.image ? `<div id="ctaCardWrap"><div id="ctaCard"><img src="assets/media/${cta.image}" alt="" /><div id="play">${ICON.play}</div></div></div>` : ""}
        <div id="bio">${ICON.up}${esc(cta.pill ?? "Link na bio")}</div>
      </div>`;
    js.push(`tl.to("#faceCam",{autoAlpha:0,duration:0.3},${at(C - 0.05)});tl.fromTo("#cta",{autoAlpha:0},{autoAlpha:1,duration:0.3},${at(C - 0.05)});tl.fromTo("#ctaIcon",{autoAlpha:0,scale:0.5,rotation:-90},{autoAlpha:1,scale:1,rotation:0,duration:0.7,ease:"expo.out"},${at(C + 0.05)});tl.fromTo("#ctaKicker",{autoAlpha:0,y:16},{autoAlpha:1,y:0,duration:0.5,ease:"expo.out"},${at(C + 0.2)});tl.fromTo("#ctaHead",{autoAlpha:0,y:30},{autoAlpha:1,y:0,duration:0.6,ease:"expo.out"},${at(C + 0.3)});tl.fromTo("#bio",{autoAlpha:0,y:40,scale:0.9},{autoAlpha:1,y:0,scale:1,duration:0.55,ease:"back.out(2)"},${at(C + 0.95)});tl.to("#bio svg",{y:-10,duration:0.35,ease:"sine.inOut",yoyo:true,repeat:7},${at(C + 1.5)});`);
    if (cta.image) js.push(`tl.fromTo("#ctaCard",{autoAlpha:0,rotationX:28,y:120,scale:0.86},{autoAlpha:1,rotationX:0,y:0,scale:1,duration:0.9,ease:"expo.out"},${at(C + 0.45)});tl.fromTo("#play",{scale:0},{scale:1,duration:0.5,ease:"back.out(2.5)"},${at(C + 1.1)});tl.to("#play",{scale:1.1,duration:0.5,ease:"sine.inOut",yoyo:true,repeat:5},${at(C + 1.7)});tl.to("#ctaCard",{scale:1.03,duration:3.5,ease:"sine.inOut"},${at(C + 1.4)});`);
    snd("whoosh", C - 0.1, 0.42); snd("notification", C + 0.95, 0.3);
  }

  // ── SFX (dedup + latência) ────────────────────────────────────────────────────
  sfx.sort((a, b) => a[1] - b[1]);
  const kept = [];
  for (const s of sfx) if (!kept.some((k) => Math.abs(k[1] - s[1]) < 0.12)) kept.push(s);
  const sfxHtml = kept.map(([nm, t, v], i) => {
    const st = f2(Math.max(0, t - SND[nm][0]));
    return `<audio id="sfx${i}" src="assets/sfx/${nm}.mp3" data-start="${st}" data-duration="${f2(Math.min(SND[nm][1], total - st))}" data-track-index="${4 + (i % 3)}" data-volume="${v}"></audio>`;
  }).join("\n      ");

  // ── CSS por formato ───────────────────────────────────────────────────────────
  const ctaCss = V ? `
      #ctaIcon { position: absolute; left: 504px; top: 300px; width: 72px; height: 72px; }
      #ctaKicker { top: 420px; } #ctaHead { left: 80px; right: 80px; top: 476px; font-size: 68px; }
      #ctaCardWrap { left: 60px; top: 720px; width: 960px; height: 540px; } #bio { top: 1340px; }` : `
      #ctaIcon { position: absolute; left: 924px; top: 80px; width: 72px; height: 72px; }
      #ctaKicker { top: 180px; } #ctaHead { left: 200px; right: 200px; top: 222px; font-size: 60px; }
      #ctaCardWrap { left: 530px; top: 330px; width: 860px; height: 484px; } #bio { top: 870px; }`;
  const faceTopCss = `left: ${(W - L.meterW) / 2}px; top: ${L.faceTopY}px; width: ${L.meterW}px;`;

  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      ${[500, 700, 800].map((w) => `@font-face { font-family: "Jakarta"; font-weight: ${w}; src: url(assets/fonts/plus-jakarta-sans-latin-${w}-normal.woff2) format("woff2"); }
      @font-face { font-family: "Jakarta"; font-weight: ${w}; src: url(assets/fonts/plus-jakarta-sans-latin-ext-${w}-normal.woff2) format("woff2"); unicode-range: U+0100-024F; }`).join("\n      ")}
      :root { --g500: #22c55e; --g400: #4ade80; --g600: #16a34a; --n50: #fafafa; --n200: #e5e5e5; --n500: #737373; --n900: #0f0f0f; --n950: #070707; --red: #ef4444; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: var(--n950); }
      #stage { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: var(--n950); font-family: "Jakarta", sans-serif; color: var(--n50); }
      .layer { position: absolute; inset: 0; }
      .bg-brand { background: radial-gradient(${V ? "900px 700px" : "1400px 700px"} at 50% -8%, rgba(34,197,94,.16), transparent 62%), radial-gradient(800px 700px at 100% 105%, rgba(34,197,94,.09), transparent 60%), linear-gradient(180deg, #fafafa 0%, #efefef 100%); }
      #faceCam { overflow: hidden; }
      #faceZoom { position: absolute; inset: 0; transform-origin: 50% 40%; }
      #facePan { position: absolute; left: 0; top: 0; width: ${f2(vidW)}px; height: ${f2(vidH)}px; }
      #facePan video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #faceShade { background: linear-gradient(to top, rgba(7,7,7,${capMode === "none" ? ".35" : ".78"}) 0%, rgba(7,7,7,.3) 26%, transparent 46%), linear-gradient(to bottom, rgba(7,7,7,.4), transparent 18%); }
      .card { position: absolute; border-radius: ${V ? 34 : 28}px; overflow: hidden; background: var(--n900); box-shadow: 0 0 0 1px rgba(15,15,15,.06), 0 60px 110px -24px rgba(15,15,15,.42), 0 24px 44px -20px rgba(15,15,15,.28); }
      .dashStage { position: absolute; inset: 0; perspective: 1800px; }
      .dashInner { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
      .notes { position: absolute; left: 0; top: 0; overflow: visible; }
      .note .ring { fill: none; stroke: var(--red); stroke-width: 4; stroke-dasharray: 1; stroke-dashoffset: 1; }
      .note .tag rect { fill: var(--red); } .note .tag text { fill: #fff; font: 700 17px "Jakarta"; }
      .note .ok circle { fill: var(--g500); } .note .ok path { fill: none; stroke: var(--n950); stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }
      .note .tag, .note .ok { opacity: 0; }
      .cursor { position: absolute; left: 0; top: 0; width: 34px; height: 34px; opacity: 0; filter: drop-shadow(0 4px 8px rgba(0,0,0,.5)); }
      .glow { position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 2px var(--g500), 0 0 80px rgba(34,197,94,.45); opacity: 0; }
      .bubRing { position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 7px #fff; }
      .slot, #faceTop { position: absolute; height: 140px; }
      #faceTop { ${faceTopCss} }
      .slotItem { position: absolute; left: 0; right: 0; top: 0; display: flex; flex-direction: column; align-items: center; gap: 14px; }
      .chips { display: flex; justify-content: center; gap: 16px; }
      .chip { display: flex; align-items: center; gap: 12px; padding: 16px 26px 16px 18px; border-radius: 999px; background: #fff; box-shadow: 0 0 0 1px rgba(15,15,15,.05), 0 16px 34px -10px rgba(15,15,15,.28); font: 700 30px "Jakarta"; color: var(--n900); opacity: 0; white-space: nowrap; }
      .chip i { width: 34px; height: 34px; border-radius: 50%; background: var(--g500); display: grid; place-items: center; } .chip i svg { width: 20px; height: 20px; }
      .badge { padding: 10px 22px; border-radius: 999px; background: var(--g500); color: var(--n950); font: 800 24px "Jakarta"; letter-spacing: .06em; opacity: 0; white-space: nowrap; }
      .hook { max-width: ${L.meterW}px; padding: ${V ? "26px 34px" : "22px 34px"}; border-radius: 30px; background: #fff; color: var(--n900); text-align: center; font: 800 ${V ? 60 : 52}px/1.12 "Jakarta"; letter-spacing: -.02em; box-shadow: 0 0 0 1px rgba(15,15,15,.05), 0 34px 70px -18px rgba(15,15,15,.45); }
      .hookStage { position: absolute; inset: 0; perspective: 1400px; pointer-events: none; }
      .hookCard { position: absolute; border-radius: 26px; overflow: hidden; background: var(--n900); opacity: 0; box-shadow: 0 0 0 6px #fff, 0 50px 90px -24px rgba(15,15,15,.55), 0 20px 40px -20px rgba(15,15,15,.35); }
      .hookLabel { position: absolute; left: 16px; bottom: 16px; padding: 8px 16px; border-radius: 999px; background: #fff; color: var(--n900); font: 800 22px "Jakarta"; box-shadow: 0 10px 24px -8px rgba(15,15,15,.4); }
      .hook .hw { display: inline-block; opacity: 0; } .hook .hw.hl { background: var(--g500); color: var(--n950); padding: 0 14px; border-radius: 14px; }
      .bar { position: relative; width: ${L.meterW}px; max-width: 100%; height: 112px; padding: 16px; border-radius: 30px; background: #fff; box-shadow: 0 0 0 1px rgba(15,15,15,.05), 0 34px 70px -18px rgba(15,15,15,.45); }
      .bar .track { position: relative; width: 100%; height: 100%; display: flex; gap: 10px; }
      .bar .seg { position: relative; height: 100%; border-radius: 16px; display: flex; align-items: center; padding: 0 24px; font: 800 36px "Jakarta"; white-space: nowrap; overflow: hidden; }
      .bar .ai { background: var(--g500); color: var(--n950); transform-origin: 0 50%; }
      .bar .you { flex: 1; justify-content: center; color: var(--n900); box-shadow: inset 0 0 0 2.5px #d4d4d4; background: repeating-linear-gradient(135deg, rgba(15,15,15,.05) 0 10px, transparent 10px 20px); }
      .bar .you .fill { position: absolute; inset: 0; background: var(--g400); transform-origin: 0 50%; opacity: 0; border-radius: 16px; }
      .bar .you span { position: relative; } .bar small { font-weight: 800; font-size: 36px; margin-left: 14px; }
      .total { font: 800 26px "Jakarta"; color: var(--g600); letter-spacing: .12em; opacity: 0; white-space: nowrap; }
      .listTitle { position: absolute; ${V ? "left: 90px; top: 1100px;" : "left: 1140px; top: 200px;"} display: flex; align-items: center; gap: 18px; font: 800 30px "Jakarta"; letter-spacing: .18em; color: var(--g600); }
      .listTitle svg { width: 56px; height: 56px; } .listTitle path { fill: none; stroke: var(--g600); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
      .row { position: absolute; ${V ? "left: 90px; width: 900px;" : "left: 1140px; width: 700px;"} height: 118px; display: flex; align-items: center; gap: 26px; padding: 0 30px; border-radius: 28px; background: #fff; color: var(--n900); box-shadow: 0 0 0 1px rgba(15,15,15,.05), 0 22px 46px -16px rgba(15,15,15,.3); font: 800 ${V ? 46 : 40}px "Jakarta"; opacity: 0; }
      .row i { width: 64px; height: 64px; border-radius: 20px; display: grid; place-items: center; flex: none; } .row i svg { width: 34px; height: 34px; }
      .row.good i { background: var(--g500); } .row.bad i { background: var(--n200); } .row.bad { color: var(--n500); }
      .sticker { position: absolute; padding: 18px 30px; border-radius: 999px; background: var(--n900); color: var(--n50); font: 800 44px "Jakarta"; box-shadow: 0 20px 50px rgba(0,0,0,.5); opacity: 0; }
      .bigWord { position: absolute; left: 0; right: 0; top: ${L.wordY}px; text-align: center; font: 800 ${L.wordSize}px/1 "Jakarta"; letter-spacing: -.02em; color: var(--n50); text-shadow: 0 20px 60px rgba(0,0,0,.6); opacity: 0; }
      .bigLine { position: absolute; left: ${W / 2 - 300}px; width: 600px; top: ${L.wordY + L.wordSize + 30}px; height: 14px; border-radius: 7px; background: var(--g500); transform-origin: 0 50%; opacity: 0; }
      #caps { position: absolute; left: 0; right: 0; top: ${L.capsTop}px; height: 240px; }
      .cap { position: absolute; left: ${L.capSide}px; right: ${L.capSide}px; top: 0; text-align: center; font: 800 ${L.capFont}px/1.12 "Jakarta"; letter-spacing: -.01em; opacity: 0; visibility: hidden; }
      .w { display: inline-block; opacity: 0; visibility: hidden; text-shadow: 0 6px 26px rgba(0,0,0,.65), 0 2px 4px rgba(0,0,0,.4); }
      .w.kw { color: var(--g400); }
      #caps[data-mode="light"] .w { color: var(--n900); text-shadow: none; } #caps[data-mode="light"] .w.kw { color: var(--g600); }
      .w.hl, #caps[data-mode="light"] .w.hl { color: var(--n950); background: var(--g500); padding: 0 16px; border-radius: 18px; text-shadow: none; }
      #ctaKicker { position: absolute; left: 0; right: 0; text-align: center; font: 800 28px "Jakarta"; letter-spacing: .22em; color: var(--g600); }
      #ctaHead { position: absolute; text-align: center; font-weight: 800; line-height: 1.1; letter-spacing: -.02em; color: var(--n900); }
      #ctaCardWrap { position: absolute; perspective: 1400px; }
      #ctaCard { position: absolute; inset: 0; border-radius: 30px; overflow: hidden; box-shadow: 0 0 0 8px #fff, 0 70px 130px -30px rgba(15,15,15,.5), 0 30px 60px -30px rgba(15,15,15,.35); transform-origin: 50% 100%; }
      #ctaCard img { width: 100%; height: 100%; object-fit: cover; }
      #play { position: absolute; left: 50%; top: 50%; width: 140px; height: 100px; margin: -50px 0 0 -70px; border-radius: 28px; background: var(--g500); display: grid; place-items: center; box-shadow: 0 20px 50px rgba(0,0,0,.5); } #play svg { width: 44px; height: 44px; }
      #bio { position: absolute; left: 0; right: 0; margin: 0 auto; width: fit-content; display: flex; align-items: center; gap: 16px; padding: 24px 40px; border-radius: 999px; background: var(--n900); color: var(--n50); font: 800 44px "Jakarta"; white-space: nowrap; opacity: 0; box-shadow: 0 24px 50px -18px rgba(15,15,15,.5); } #bio svg { width: 40px; height: 40px; }
      ${ctaCss}
    </style>
  </head>
  <body>
    <div id="stage" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
      <div id="splitBg" class="layer bg-brand" style="opacity:0;visibility:hidden"></div>
      <div id="faceCam" class="layer">
        <div id="faceZoom"><div id="faceShake" class="layer"><div id="facePan">
            ${faceVideos}
        </div></div></div>
        <div id="faceShade" class="layer"></div>
      </div>
      <div id="faceTop">${slotHtml.face}</div>
      ${faceExtra}
      ${screenHtml}
      ${splitHtml}
      ${ctaHtml}
      <div id="caps" data-mode="dark">
        ${capsHtml}
      </div>
      <audio id="voice" src="assets/media/voice.m4a" data-start="0" data-duration="${endVoice}" data-track-index="3" data-volume="1"></audio>
      ${sfxHtml}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      ${js.join("\n      ")}
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
  if (!plan.brandFont) return html;
  // fonte oficial (Articulat CF) com a Jakarta de reserva; 800 usa o Bold
  const fontFaces = [[400, 400], [450, 450], [500, 500], [600, 600], [700, 700], [800, 700]]
    .map(([w, f]) => `@font-face { font-family: "Brand"; font-weight: ${w}; src: url(assets/fonts-marca/articulat-${f}.woff2) format("woff2"); }`).join("\n      ");
  return html
    .replace(/(font: [^;"]*)"Jakarta"/g, '$1"Brand", "Jakarta"')
    .replace('font-family: "Jakarta", sans-serif;', 'font-family: "Brand", "Jakarta", sans-serif;')
    .replace(":root {", fontFaces + "\n      :root {");
}
