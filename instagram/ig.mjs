#!/usr/bin/env node
// CLI do bot do Instagram — roda no seu computador ou numa sessão do Claude Code.
// Config: IG_BOT_URL e IG_ADMIN_TOKEN no ambiente ou em instagram/.env (fora do git).
//
//   node instagram/ig.mjs postar <pasta | arquivos...> [--legenda arq.txt | --texto "..."] [--quando "2026-10-10 09:00"]
//                                [--capa capa.jpg] [--tipo carrossel|reels|imagem]
//        pasta → todos os .jpg/.mp4 em ordem (menos prova*.jpg e _*) + legenda.txt da pasta
//        --quando sem fuso = horário de Brasília (IG_FUSO para mudar)
//   node instagram/ig.mjs palavras [instagram/bot/palavras.json]   sobe as palavras-chave (vale na hora)
//   node instagram/ig.mjs leads                                     baixa work/ig/leads.csv
//   node instagram/ig.mjs status                                    conta, token, varredura, fila
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, basename, extname, dirname, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = dirname(AQUI);

const envArq = join(AQUI, '.env');
if (existsSync(envArq)) {
  for (const linha of readFileSync(envArq, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
const BOT = (process.env.IG_BOT_URL || '').replace(/\/$/, '');
const TOKEN = process.env.IG_ADMIN_TOKEN || '';
const FUSO = process.env.IG_FUSO || '-03:00';

const morrer = msg => { console.error(`✗ ${msg}`); process.exit(1); };
if (!BOT || !TOKEN) morrer('defina IG_BOT_URL e IG_ADMIN_TOKEN (ambiente ou instagram/.env)');

async function api(metodo, caminho, corpo, tipo = 'application/json') {
  const r = await fetch(`${BOT}/admin/${caminho}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(corpo !== undefined && { 'Content-Type': tipo }) },
    body: corpo === undefined ? undefined : typeof corpo === 'string' || Buffer.isBuffer(corpo) ? corpo : JSON.stringify(corpo),
  }).catch(e => morrer(`bot fora do ar? ${BOT} (${e.cause?.code || e.message})`));
  const texto = await r.text();
  if (!r.ok) morrer(`${metodo} ${caminho}: ${(() => { try { return JSON.parse(texto).erro; } catch { return texto.slice(0, 200); } })()}`);
  return r.headers.get('content-type')?.includes('json') ? JSON.parse(texto) : texto;
}

// "Capa Final (2).JPG" → "capa-final-2.jpg"
const limpo = n => {
  const ext = extname(n).toLowerCase();
  const base = basename(n, extname(n)).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base || 'arquivo'}${ext}`;
};

function quandoISO(txt) {
  if (!txt) return undefined;
  const t = txt.trim().replace(' ', 'T');
  const data = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(t) ? t : `${t}${t.length <= 16 ? ':00' : ''}${FUSO}`);
  if (Number.isNaN(data.getTime())) morrer(`data inválida: ${txt} (use "AAAA-MM-DD HH:MM")`);
  if (data < Date.now() - 60e3) morrer(`--quando está no passado: ${txt}`);
  return data.toISOString();
}

function opcoes(args) {
  const o = { arquivos: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) o[a.slice(2)] = args[++i];
    else o.arquivos.push(a);
  }
  return o;
}

async function postar(args) {
  const o = opcoes(args);
  let arquivos = [];
  let legenda = o.texto ?? (o.legenda ? readFileSync(o.legenda, 'utf8') : undefined);
  for (const a of o.arquivos) {
    if (!existsSync(a)) morrer(`não existe: ${a}`);
    if (statSync(a).isDirectory()) {
      const nomes = readdirSync(a)
        .filter(n => /\.(jpe?g|mp4|mov)$/i.test(n) && !/^(prova|_)/i.test(n))
        .sort((x, y) => x.localeCompare(y, undefined, { numeric: true }));
      arquivos.push(...nomes.map(n => join(a, n)));
      if (legenda === undefined && existsSync(join(a, 'legenda.txt'))) legenda = readFileSync(join(a, 'legenda.txt'), 'utf8');
    } else arquivos.push(a);
  }
  if (!arquivos.length) morrer('nenhum .jpg/.mp4 encontrado');
  const png = arquivos.find(f => /\.png$/i.test(f));
  if (png) morrer(`${png}: a API só aceita JPEG — exporte em .jpg`);
  if (arquivos.length > 10) morrer(`${arquivos.length} arquivos: carrossel vai até 10`);
  legenda = (legenda ?? '').trim();
  if (!legenda) console.log('⚠ sem legenda (use --legenda arquivo.txt, --texto "..." ou legenda.txt na pasta)');

  const lote = randomBytes(12).toString('hex');
  const enviar = async (arq, nome) => {
    const buf = readFileSync(arq);
    await api('PUT', `arquivos/${lote}/${encodeURIComponent(nome)}`, buf, 'application/octet-stream');
    console.log(`↑ ${basename(arq)} (${(buf.length / 1e6).toFixed(1)} MB)`);
    return nome;
  };
  const nomes = [];
  for (const [i, arq] of arquivos.entries()) nomes.push(await enviar(arq, `${String(i + 1).padStart(2, '0')}-${limpo(arq)}`));
  const capa = o.capa ? await enviar(o.capa, `capa-${limpo(o.capa)}`) : undefined;

  const quando = quandoISO(o.quando);
  let p = await api('POST', 'publicar', { lote, arquivos: nomes, legenda, quando, capa, tipo: o.tipo });
  if (quando && Date.parse(quando) > Date.now() + 60e3) {
    console.log(`✓ ${p.tipo} agendado (#${p.id}) para ${new Date(quando).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    return;
  }
  console.log(`… publicando ${p.tipo} (#${p.id}) — vídeo pode levar alguns minutos`);
  const fim = Date.now() + 20 * 60e3;
  while (!['publicado', 'erro'].includes(p.status) && Date.now() < fim) {
    await new Promise(r => setTimeout(r, 4000));
    p = await api('GET', `publicacoes/${p.id}`);
  }
  if (p.status === 'publicado') console.log(`✓ publicado: ${p.permalink || '(sem link)'}`);
  else if (p.status === 'erro') morrer(`a publicação falhou: ${p.erro}`);
  else console.log(`… ainda processando — confira com: node instagram/ig.mjs status`);
}

const comandos = {
  postar,
  async palavras([arq = join(AQUI, 'bot', 'palavras.json')]) {
    const r = await api('PUT', 'palavras', readFileSync(arq, 'utf8'));
    console.log(`✓ palavras-chave no ar: ${r.palavras.join(', ')}`);
  },
  async leads() {
    const csv = await api('GET', 'leads.csv');
    const destino = join(RAIZ, 'work', 'ig', 'leads.csv');
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, csv);
    console.log(`✓ ${Math.max(0, csv.trim().split('\n').length - 1)} leads → ${resolve(destino)}`);
  },
  async status() { console.log(JSON.stringify(await api('GET', 'status'), null, 2)); },
};

const [cmd, ...resto] = process.argv.slice(2);
if (!comandos[cmd]) morrer(`comando: ${Object.keys(comandos).join(' | ')}  (detalhes no topo de instagram/ig.mjs)`);
await comandos[cmd](resto);
