// Design tokens do canal EA FC — escalas de cor 50–950 (OKLCH, matiz fixo), grid de 8 px, raios, tipografia, sombras.
// Usado pelos motores (gancho.mjs, vinheta.mjs). `cssVars()` devolve as variáveis CSS; `scale(hex)` devolve a escala.

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const hex2rgb = (h) => { const n = parseInt(h.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255); };
const rgb2hex = (rgb) => "#" + rgb.map((v) => Math.round(clamp01(v) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

export function rgb2oklch(hex) {
  const [r, g, b] = hex2rgb(hex).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, B), h: (Math.atan2(B, A) * 180) / Math.PI };
}
export function oklch2hex({ L, C, h }) {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return rgb2hex([r, g, bb].map(gam));
}
// reduz o croma até caber no sRGB (evita cores "estouradas")
function fit(c) { let { L, C, h } = c; for (let i = 0; i < 24; i++) { const hx = oklch2hex({ L, C, h }); const back = rgb2oklch(hx); if (Math.abs(back.L - L) < 0.02 && Math.abs(back.C - C) < 0.02) return hx; C *= 0.9; } return oklch2hex({ L, C: 0, h }); }

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const L_TOP = 0.975, L_BOTTOM = 0.20;
const CHROMA = { 50: 0.18, 100: 0.35, 200: 0.6, 300: 0.85, 400: 1, 500: 1, 600: 0.95, 700: 0.85, 800: 0.72, 900: 0.58, 950: 0.42 };

/** Escala 50–950 a partir de uma cor base: mesmo matiz; a cor da marca fica no passo `anchor` e a rampa de luminância
 *  é esticada dos dois lados (50 ≈ quase branco, 950 ≈ quase preto). Croma relativo ao da base, caindo nas pontas. */
export function scale(baseHex, opts = {}) {
  const base = rgb2oklch(baseHex);
  const anchor = opts.anchor ?? 500;
  const ai = STEPS.indexOf(anchor);
  const cBase = Math.max(base.C, opts.chroma ?? 0.08);
  const out = { base: anchor };
  STEPS.forEach((s, i) => {
    let L;
    if (i < ai) L = L_TOP + (base.L - L_TOP) * (i / ai);
    else if (i > ai) L = base.L + (L_BOTTOM - base.L) * ((i - ai) / (STEPS.length - 1 - ai));
    else L = base.L;
    const cRel = CHROMA[s] / CHROMA[anchor];
    out[s] = s === anchor ? baseHex.toUpperCase() : fit({ L, C: cBase * cRel * (opts.sat ?? 1), h: base.h });
  });
  return out;
}

export const BRAND = { yellow: "#F9D616", navy: "#0A1F44", cruz: "#0A3D91", red: "#D7141A", neutral: "#6B7280" };
export const SCALES = {
  y: scale(BRAND.yellow, { anchor: 400 }),
  n: scale(BRAND.navy, { anchor: 900, chroma: 0.12 }),
  c: scale(BRAND.cruz, { anchor: 700 }),
  r: scale(BRAND.red, { anchor: 600 }),
  g: scale("#64748B", { anchor: 500, chroma: 0.03, sat: 0.8 }), // neutro frio (cinza-azulado)
};

// grid de 8 px
export const SPACE = { 1: 8, 2: 16, 3: 24, 4: 32, 5: 40, 6: 48, 7: 56, 8: 64, 10: 80, 12: 96, 14: 112, 16: 128 };
export const RADIUS = { sm: 8, md: 16, lg: 24, xl: 32, pill: 999 };
export const STROKE = { hair: 1, thin: 2, bar: 8, bold: 16 };
// escala tipográfica (múltiplos de 8; Articulat CF)
export const TYPE = { label: 24, body: 32, h5: 40, h4: 48, h3: 64, h2: 96, h1: 128, display: 192, hero: 256, giant: 320 };
export const SAFE = 80; // margem segura (YouTube) = 10 × 8

export function cssVars() {
  const lines = [];
  for (const [k, sc] of Object.entries(SCALES)) for (const s of STEPS) lines.push(`--${k}-${s}: ${sc[s]};`);
  for (const [k, v] of Object.entries(SPACE)) lines.push(`--s${k}: ${v}px;`);
  for (const [k, v] of Object.entries(RADIUS)) lines.push(`--r-${k}: ${v}px;`);
  for (const [k, v] of Object.entries(TYPE)) lines.push(`--t-${k}: ${v}px;`);
  lines.push(`--safe: ${SAFE}px;`);
  // sombras em camadas (marinho 950 em vez de preto puro)
  lines.push(`--sh-card: 0 1px 0 rgba(255,255,255,.06) inset, 0 8px 24px -8px rgba(5,14,32,.55), 0 32px 64px -24px rgba(5,14,32,.7);`);
  lines.push(`--sh-float: 0 24px 48px -16px rgba(5,14,32,.6), 0 64px 128px -40px rgba(5,14,32,.7);`);
  lines.push(`--sh-text: 0 2px 4px rgba(5,14,32,.35), 0 8px 24px rgba(5,14,32,.45);`);
  return lines.join("\n      ");
}

/** Tabela markdown das escalas (para a documentação). */
export function markdownTable() {
  const names = { y: "Amarelo América", n: "Marinho América", c: "Azul Cruz Azul", r: "Vermelho", g: "Neutro frio" };
  const head = `| Escala | ${STEPS.join(" | ")} |\n|---|${STEPS.map(() => "---").join("|")}|`;
  return head + "\n" + Object.entries(SCALES).map(([k, sc]) => `| **${names[k]}** \`--${k}-*\` | ${STEPS.map((s) => `\`${sc[s]}\`${sc.base === s ? " ★" : ""}`).join(" | ")} |`).join("\n");
}
