#!/usr/bin/env node
// Carrossel: roteiro JSON → slides JPEG 1080×1350 (4:5) + prova.jpg (folha de prova) + legenda.txt em work/ig/<slug>/.
//   node instagram/carrossel/render.mjs instagram/carrosseis/<slug>.json
// Formato do roteiro: instagram/carrossel/SPEC.md. Usa o Chrome do HyperFrames (studio/bin/setup.sh) ou CHROME_BIN.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, basename, resolve, isAbsolute } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..', '..');
const W = 1080, H = 1350;

const arqRoteiro = process.argv[2];
if (!arqRoteiro || !existsSync(arqRoteiro)) { console.error('uso: node instagram/carrossel/render.mjs instagram/carrosseis/<slug>.json'); process.exit(1); }
const roteiro = JSON.parse(readFileSync(arqRoteiro, 'utf8'));
const slug = basename(arqRoteiro, '.json');
const saida = join(RAIZ, 'work', 'ig', slug);
mkdirSync(saida, { recursive: true });

const avisos = [];
const avisar = m => avisos.push(m);
const slides = roteiro.slides || [];
if (slides.length < 2 || slides.length > 10) { console.error(`✗ ${slides.length} slides: carrossel vai de 2 a 10`); process.exit(1); }

// ---------- HTML ----------
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rico = s => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>'); // *destaque* e quebra de linha
const EMOJI = /\p{Extended_Pictographic}/u;
const url = p => pathToFileURL(isAbsolute(p) ? p : resolve(dirname(arqRoteiro), p)).href;

function fontes() {
  const dir = join(RAIZ, 'studio', 'assets', 'fonts-marca');
  const marca = existsSync(dir) ? readdirSync(dir).filter(n => /articulat.*?(\d{3})\.(woff2?|otf|ttf)$/i.test(n)) : [];
  if (marca.length) {
    return marca.map(n => `@font-face{font-family:Marca;font-weight:${n.match(/(\d{3})\.\w+$/)[1]};src:url("${pathToFileURL(join(dir, n)).href}")}`).join('\n');
  }
  avisar('SEM fonte Articulat (studio/assets/fonts-marca/) — usando Plus Jakarta Sans');
  const pj = join(RAIZ, 'studio', 'assets', 'fonts');
  return [500, 700, 800].map(p => ['latin', 'latin-ext'].map(sub =>
    `@font-face{font-family:Marca;font-weight:${p};src:url("${pathToFileURL(join(pj, `plus-jakarta-sans-${sub}-${p}-normal.woff2`)).href}")}`).join('\n')).join('\n');
}

const CHECK = '<svg class="ic" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" class="ic-bg"/><path d="M12 20.5l5.2 5.2L28.5 14.5" class="ic-tr"/></svg>';
const XIS = '<svg class="ic" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" class="ic-x"/><path d="M14 14l12 12M26 14L14 26" class="ic-tr"/></svg>';
const SETA = '<svg width="34" height="20" viewBox="0 0 34 20"><path d="M2 10h28M22 2l8 8-8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Slides "texto" numerados em sequência própria (01, 02, 03…), não pela posição no carrossel.
const ordemTexto = new Map();
slides.forEach((s, k) => { if (s.tipo === 'texto') ordemTexto.set(k + 1, ordemTexto.size + 1); });

function corpo(s, i) {
  const titulo = (t, tag = 'h2', min = 48) => (t ? `<${tag} data-fit="${min}">${rico(t)}</${tag}>` : '');
  const texto = t => (t ? `<p data-fit="28">${rico(t)}</p>` : '');
  switch (s.tipo) {
    case 'capa':
      return `${s.kicker ? `<span class="kicker">${esc(s.kicker)}</span>` : ''}${titulo(s.titulo, 'h1', 64)}${texto(s.subtitulo)}`;
    case 'texto':
      return `<span class="num">${esc(s.numero ?? String(ordemTexto.get(i)).padStart(2, '0'))}</span>${titulo(s.titulo)}${texto(s.texto)}`;
    case 'lista':
      return `${titulo(s.titulo)}<ul class="lista">${(s.itens || []).map(t => `<li>${CHECK}<span data-fit="26">${rico(t)}</span></li>`).join('')}</ul>`;
    case 'numero':
      return `<div class="big" data-fit="120">${rico(s.valor)}</div>${titulo(s.titulo, 'h2', 40)}${texto(s.texto)}`;
    case 'frase':
      return `<blockquote data-fit="48">${rico(s.frase)}</blockquote>${s.autor ? `<span class="autor">— ${esc(s.autor)}</span>` : ''}`;
    case 'imagem':
      if (s.imagem && !existsSync(isAbsolute(s.imagem) ? s.imagem : resolve(dirname(arqRoteiro), s.imagem))) avisar(`slide ${i}: imagem não encontrada (${s.imagem})`);
      return `${titulo(s.titulo)}<div class="img"><img src="${url(s.imagem || '')}"></div>${texto(s.legenda)}`;
    case 'comparacao': {
      const col = (c, cls, ic) => `<div class="col ${cls}"><h3>${esc(c?.rotulo || '')}</h3><ul>${(c?.itens || []).map(t => `<li>${ic}<span data-fit="24">${rico(t)}</span></li>`).join('')}</ul></div>`;
      return `${titulo(s.titulo)}<div class="cols">${col(s.ruim, 'ruim', XIS)}${col(s.bom, 'bom', CHECK)}</div>`;
    }
    case 'cta':
      return `${titulo(s.titulo)}<span class="comenta">Comenta</span><span class="chave">${esc(s.palavra || '')}</span>${texto(s.texto || 'que eu te mando no direct.')}`;
    default:
      avisar(`slide ${i}: tipo desconhecido "${s.tipo}"`);
      return titulo(s.titulo) + texto(s.texto);
  }
}

const fundoPadrao = s => s.fundo || (s.tipo === 'capa' ? 'dark' : s.tipo === 'cta' ? 'green' : roteiro.fundo || 'light');
const handle = roteiro.handle || '@leonelrochaux';
const logo = pathToFileURL(join(RAIZ, 'studio', 'assets', 'brand', 'logo-icone.png')).href;
const total = slides.length;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${fontes()}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:#000}
body{font-family:Marca,'Plus Jakarta Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.slide{display:none;flex-direction:column;width:${W}px;height:${H}px;padding:84px 88px 80px;background:var(--bg);color:var(--tx)}
.slide.ativo{display:flex}
.light{--bg:#FAFAFA;--tx:#0A0A0A;--mu:#6B6B6B;--ln:#E5E5E5;--ac:#16A34A;--card:#FFFFFF;--chip:#22C55E;--chiptx:#052E16}
.dark{--bg:#0B0B0F;--tx:#FAFAFA;--mu:#A1A1AA;--ln:#26262C;--ac:#22C55E;--card:#141419;--chip:#22C55E;--chiptx:#052E16}
.green{--bg:#22C55E;--tx:#052E16;--mu:#14532D;--ln:rgba(5,46,22,.16);--ac:#FFFFFF;--card:rgba(255,255,255,.2);--chip:#0B0B0F;--chiptx:#22C55E}
.topo,.rodape{display:flex;align-items:center;justify-content:space-between;font-size:26px;font-weight:500;color:var(--mu);flex:none}
.marca{display:flex;align-items:center;gap:14px;color:var(--tx)}
.marca img{width:40px;height:40px;object-fit:contain}
.green .marca img{filter:brightness(0);opacity:.85}
.conteudo{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:34px;overflow:hidden;padding:24px 0}
.kicker{align-self:flex-start;font-size:24px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:12px 22px;border:1.5px solid var(--ln);border-radius:999px;color:var(--mu)}
h1{font-size:118px;line-height:.98;letter-spacing:-.04em;font-weight:700}
h2{font-size:78px;line-height:1.02;letter-spacing:-.035em;font-weight:700}
p{font-size:38px;line-height:1.36;color:var(--mu);font-weight:500;max-width:860px}
em{font-style:normal;color:var(--ac)}
.num{font-size:30px;font-weight:700;color:var(--ac);letter-spacing:.06em}
.lista,.col ul{list-style:none;display:flex;flex-direction:column;gap:18px}
.lista li{display:flex;gap:24px;align-items:center;font-size:40px;line-height:1.25;font-weight:500;padding:28px 32px;background:var(--card);border:1px solid var(--ln);border-radius:28px}
.ic{flex:none;width:40px;height:40px}
.ic-bg{fill:var(--ac)}.ic-x{fill:#EF4444}.ic-tr{fill:none;stroke:var(--bg);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}
.green .ic-bg{fill:#052E16}.green .ic-tr{stroke:#22C55E}
.big{font-size:300px;line-height:.86;letter-spacing:-.06em;font-weight:800;color:var(--ac)}
blockquote{font-size:88px;line-height:1.06;letter-spacing:-.035em;font-weight:700}
.autor{font-size:30px;color:var(--mu);font-weight:500}
.img{flex:1;min-height:0;border-radius:32px;overflow:hidden;border:1px solid var(--ln);background:var(--card)}
.img img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.col{background:var(--card);border:1px solid var(--ln);border-radius:28px;padding:34px 30px;display:flex;flex-direction:column;gap:24px}
.col h3{font-size:24px;letter-spacing:.08em;text-transform:uppercase;font-weight:700}
.col.ruim h3{color:#EF4444}.col.bom h3{color:var(--ac)}
.col li{display:flex;gap:16px;align-items:flex-start;font-size:32px;line-height:1.28;font-weight:500}
.col .ic{width:34px;height:34px;margin-top:3px}
.comenta{font-size:40px;font-weight:600;margin-bottom:-14px}
.chave{align-self:flex-start;font-size:150px;line-height:1;font-weight:800;letter-spacing:-.03em;padding:22px 56px 30px;border-radius:40px;background:var(--chip);color:var(--chiptx)}
.green p{color:var(--tx)}
.barra{display:flex;gap:8px}.barra i{display:block;width:22px;height:6px;border-radius:3px;background:var(--ln)}.barra i.on{width:56px;background:var(--tx)}
.arrasta{display:flex;align-items:center;gap:14px;color:var(--tx)}
</style></head><body>
${slides.map((s, k) => {
  const i = k + 1;
  const texto = JSON.stringify(s);
  if (EMOJI.test(texto)) avisar(`slide ${i}: emoji no slide (pode virar quadrado e tem "cara de IA") — tire`);
  for (const campo of ['titulo', 'frase']) if (s[campo] && s[campo].replace(/\*/g, '').length > 70) avisar(`slide ${i}: ${campo} com ${s[campo].length} caracteres (ideal ≤ 70)`);
  const barra = slides.map((_, j) => `<i class="${j === k ? 'on' : ''}"></i>`).join('');
  const dir = k === 0 ? `<span class="arrasta">Arrasta ${SETA}</span>` : '';
  return `<section class="slide ${fundoPadrao(s)}" id="s${i}">
  <div class="topo"><span class="marca"><img src="${logo}">${esc(handle)}</span><span>${String(i).padStart(2, '0')}/${String(total).padStart(2, '0')}</span></div>
  <div class="conteudo">${corpo(s, i)}</div>
  <div class="rodape"><span class="barra">${barra}</span>${dir}</div>
</section>`;
}).join('\n')}
<script>
function mostrar(i){document.querySelectorAll('.slide').forEach(s=>s.classList.toggle('ativo',s.id==='s'+i));return ajustar(document.getElementById('s'+i));}
// Diminui os textos (até o mínimo de data-fit) enquanto o conteúdo não couber; devolve true se ainda estourar.
function ajustar(s){const c=s.querySelector('.conteudo');const alvos=[...s.querySelectorAll('[data-fit]')];
  for(let n=0;n<80&&c.scrollHeight>c.clientHeight+1;n++){let mudou=false;
    for(const el of alvos){const fs=parseFloat(getComputedStyle(el).fontSize),min=+el.dataset.fit;if(fs>min){el.style.fontSize=Math.max(min,fs*0.96)+'px';mudou=true}}
    if(!mudou)break}
  return c.scrollHeight>c.clientHeight+1}
</script></body></html>`;

const arqHtml = join(saida, '_slides.html');
writeFileSync(arqHtml, html);

// ---------- Chrome (CDP pelo WebSocket nativo do Node 22) ----------
function acharChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const procurar = (dir, prof = 0) => {
    if (prof > 5 || !existsSync(dir)) return null;
    for (const n of readdirSync(dir)) {
      const p = join(dir, n);
      if (/^chrome-headless-shell(\.exe)?$/.test(n) && statSync(p).isFile()) return p;
      if (statSync(p).isDirectory()) { const r = procurar(p, prof + 1); if (r) return r; }
    }
    return null;
  };
  const hf = procurar(join(homedir(), '.cache', 'hyperframes', 'chrome'));
  if (hf) return hf;
  for (const c of ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']) if (existsSync(c)) return c;
  throw new Error('Chrome não encontrado — rode studio/bin/setup.sh (npx hyperframes browser ensure) ou defina CHROME_BIN');
}

async function abrirChrome() {
  const perfil = mkdtempSync(join(tmpdir(), 'ig-chrome-'));
  const proc = spawn(acharChrome(), ['--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb',
    '--allow-file-access-from-files', '--remote-debugging-port=0', `--user-data-dir=${perfil}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((ok, falha) => {
    let buf = '';
    const t = setTimeout(() => falha(new Error('o Chrome não abriu em 20 s')), 20000);
    proc.stderr.on('data', d => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); ok(m[1]); } });
    proc.on('exit', c => falha(new Error(`o Chrome fechou (código ${c})`)));
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((ok, falha) => { ws.onopen = ok; ws.onerror = () => falha(new Error('sem conexão com o Chrome')); });
  let seq = 0;
  const pend = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const [ok, falha] = pend.get(m.id); pend.delete(m.id); m.error ? falha(new Error(m.error.message)) : ok(m.result); }
  };
  const cmd = (method, params = {}, sessionId) => new Promise((ok, falha) => {
    const id = ++seq;
    pend.set(id, [ok, falha]);
    ws.send(JSON.stringify({ id, method, params, ...(sessionId && { sessionId }) }));
  });
  const { targetId } = await cmd('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cmd('Target.attachToTarget', { targetId, flatten: true });
  const pg = (m, p) => cmd(m, p, sessionId);
  const avaliar = async expressao => (await pg('Runtime.evaluate', { expression: expressao, awaitPromise: true, returnByValue: true })).result.value;
  const abrir = async (href, w, h) => {
    await pg('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await pg('Page.navigate', { url: href });
    for (let n = 0; n < 100 && (await avaliar('document.readyState').catch(() => '')) !== 'complete'; n++) await new Promise(r => setTimeout(r, 100));
    await avaliar('document.fonts.ready.then(()=>Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r}))))');
  };
  const foto = async () => Buffer.from((await pg('Page.captureScreenshot', { format: 'jpeg', quality: 92 })).data, 'base64');
  return { abrir, avaliar, foto, fechar: () => { ws.close(); proc.kill(); setTimeout(() => rmSync(perfil, { recursive: true, force: true }), 300); } };
}

// ---------- render ----------
const chrome = await abrirChrome();
try {
  await chrome.abrir(pathToFileURL(arqHtml).href, W, H);
  for (const n of readdirSync(saida)) if (/^\d+\.jpg$/.test(n)) rmSync(join(saida, n)); // slides de uma versão anterior
  for (let i = 1; i <= total; i++) {
    if (await chrome.avaliar(`mostrar(${i})`)) avisar(`slide ${i}: texto não coube nem no tamanho mínimo — corte o texto`);
    const jpg = await chrome.foto();
    writeFileSync(join(saida, `${String(i).padStart(2, '0')}.jpg`), jpg);
  }
  // folha de prova: todos os slides lado a lado
  const cols = Math.min(total, 5), tw = 324, th = tw * H / W, gap = 18;
  const pw = cols * tw + (cols + 1) * gap, ph = Math.ceil(total / cols) * (th + gap) + gap;
  const prova = `<!doctype html><body style="margin:0;background:#D4D4D4;display:grid;grid-template-columns:repeat(${cols},${tw}px);gap:${gap}px;padding:${gap}px">
${Array.from({ length: total }, (_, k) => `<img src="${String(k + 1).padStart(2, '0')}.jpg?${Date.now()}" style="width:${tw}px;height:${th}px;border-radius:10px;display:block">`).join('')}</body>`;
  writeFileSync(join(saida, '_prova.html'), prova);
  await chrome.abrir(pathToFileURL(join(saida, '_prova.html')).href, pw, ph);
  writeFileSync(join(saida, 'prova.jpg'), await chrome.foto());
} finally { chrome.fechar(); }

// ---------- legenda + checagens ----------
const legenda = String(roteiro.legenda || '').trim();
writeFileSync(join(saida, 'legenda.txt'), legenda);
if (!legenda) avisar('sem "legenda" no roteiro');
if ([...legenda].length > 2200) avisar(`legenda com ${[...legenda].length} caracteres (máx. 2200)`);
const cta = slides.find(s => s.tipo === 'cta');
if (cta?.palavra) {
  const p = cta.palavra.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const palavras = JSON.parse(readFileSync(join(RAIZ, 'instagram', 'bot', 'palavras.json'), 'utf8'));
  if (!Object.keys(palavras).some(k => k.toLowerCase() === p)) avisar(`palavra "${cta.palavra}" não está em instagram/bot/palavras.json — o bot não vai responder`);
  if (!legenda.toLowerCase().includes(cta.palavra.toLowerCase())) avisar(`a legenda não repete a palavra "${cta.palavra}" — repita (e fixe um comentário com ela)`);
}

console.log(`✓ ${total} slides → ${join('work', 'ig', slug)}/ (01.jpg…, prova.jpg, legenda.txt)`);
for (const a of avisos) console.log(`⚠ ${a}`);
