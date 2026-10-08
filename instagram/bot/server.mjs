#!/usr/bin/env node
// Bot do Instagram — API oficial da Meta (Instagram Login), sem assinatura de terceiros e sem dependências (Node 22+).
//   • comentário com palavra-chave → DM com link + resposta pública (webhook e/ou varredura)
//   • palavra-chave no direct → link
//   • publica imagem, carrossel e Reels (agora ou agendado) servindo os arquivos pela URL pública
//   • leads em SQLite, exportáveis em CSV
import { createServer } from 'node:http';
import { createReadStream, createWriteStream, existsSync, mkdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { join, extname } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { cfg } from './lib/config.mjs';
import { db, ler, gravar, agora } from './lib/db.mjs';
import { graph, conta, iniciarConta, renovarSePreciso, assinarWebhooks } from './lib/graph.mjs';
import { tratarComentario, tratarMensagem, varrer } from './lib/automacao.mjs';
import { MIDIA, LOTE, NOME, agendar, publicacao, processarFila, recuperarInterrompidas, limparMidia } from './lib/publicar.mjs';
import { regras, atual as palavrasAtuais, salvar as salvarPalavras } from './lib/palavras.mjs';

const TIPOS = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp4': 'video/mp4', '.mov': 'video/quicktime' };

function sair(res, status, corpo, tipo = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': tipo });
  res.end(typeof corpo === 'string' ? corpo : JSON.stringify(corpo));
}

async function lerCorpo(req, limite = 2 * 1024 * 1024) {
  const partes = [];
  let total = 0;
  for await (const p of req) {
    total += p.length;
    if (total > limite) throw Object.assign(new Error('corpo grande demais'), { status: 413 });
    partes.push(p);
  }
  return Buffer.concat(partes);
}

// HMAC-SHA256 do corpo cru com o segredo do app (header X-Hub-Signature-256).
function assinaturaOk(req, corpo) {
  const sig = String(req.headers['x-hub-signature-256'] || '');
  if (!sig.startsWith('sha256=')) return false;
  const recebida = Buffer.from(sig.slice(7), 'hex');
  return cfg.segredos.some(s => {
    const h = createHmac('sha256', s).update(corpo).digest();
    return h.length === recebida.length && timingSafeEqual(h, recebida);
  });
}

function ehAdmin(req) {
  const t = Buffer.from(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  const a = Buffer.from(cfg.adminToken);
  return t.length === a.length && timingSafeEqual(t, a);
}

function processarWebhook(evento) {
  if (evento.object !== 'instagram') return;
  for (const entrada of evento.entry || []) {
    for (const mud of entrada.changes || []) {
      if (mud.field !== 'comments') continue;
      const v = mud.value || {};
      tratarComentario({ id: v.id, texto: v.text, userId: v.from?.id, usuario: v.from?.username, mediaId: v.media?.id, origem: 'webhook' });
    }
    for (const ev of entrada.messaging || []) tratarMensagem(ev).catch(e => console.error('✗ mensagem:', e.message));
  }
}

// A Meta baixa as mídias daqui; suporta Range (vídeo).
function servirMidia(req, res, partes) {
  const [lote, nomeCod] = partes;
  const nome = decodeURIComponent(nomeCod || '');
  const arq = join(MIDIA, lote || '', nome);
  if (!LOTE.test(lote || '') || !NOME.test(nome) || !existsSync(arq)) return sair(res, 404, { erro: 'não encontrado' });
  const { size } = statSync(arq);
  let ini = 0, fim = size - 1, status = 200;
  const faixa = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (faixa && (faixa[1] || faixa[2])) {
    if (faixa[1]) { ini = Number(faixa[1]); if (faixa[2]) fim = Math.min(Number(faixa[2]), size - 1); }
    else ini = Math.max(0, size - Number(faixa[2]));
    if (ini > fim) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }); return res.end(); }
    status = 206;
  }
  res.writeHead(status, {
    'Content-Type': TIPOS[extname(nome).toLowerCase()] || 'application/octet-stream',
    'Content-Length': fim - ini + 1,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
    ...(status === 206 && { 'Content-Range': `bytes ${ini}-${fim}/${size}` }),
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(arq, { start: ini, end: fim }).pipe(res);
}

async function receberArquivo(req, lote, nome) {
  const dir = join(MIDIA, lote);
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, `.${nome}.parcial`);
  let total = 0;
  const contar = new Transform({
    transform(pedaco, _, cb) {
      total += pedaco.length;
      cb(total > cfg.limiteUpload ? Object.assign(new Error('arquivo grande demais'), { status: 413 }) : null, pedaco);
    },
  });
  try { await pipeline(req, contar, createWriteStream(tmp)); } catch (e) { rmSync(tmp, { force: true }); throw e; }
  renameSync(tmp, join(dir, nome));
  return { url: `${cfg.urlPublica}/midia/${lote}/${encodeURIComponent(nome)}`, bytes: total };
}

function csvLeads() {
  const cab = ['criado_em', 'usuario', 'palavra', 'origem', 'dm_status', 'link_enviado_em', 'comentario', 'media_id', 'comment_id', 'erro'];
  const linhas = db.prepare(`SELECT criado_em, usuario, palavra, origem, dm_status, link_enviado_em, texto, media_id, comment_id, erro
    FROM leads ORDER BY criado_em DESC`).all();
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return '﻿' + [cab.join(','), ...linhas.map(l => Object.values(l).map(esc).join(','))].join('\n') + '\n';
}

async function status() {
  const contagem = Object.fromEntries(db.prepare('SELECT dm_status, COUNT(*) n FROM leads GROUP BY dm_status').all().map(r => [r.dm_status, r.n]));
  const limite = await graph('GET', `${conta.id}/content_publishing_limit`, { query: { fields: 'quota_usage,config' } })
    .then(r => r.data?.[0]).catch(() => null);
  return {
    conta: `@${conta.usuario}`,
    palavras: regras().map(r => r.palavra),
    varredura: cfg.pollSeg > 0 ? `a cada ${cfg.pollSeg}s (última: ${ler('ultima_varredura') || '—'})` : 'desligada',
    webhooks: ler('webhooks') || '—',
    token_renovado_em: ler('token_renovado_em'),
    token_expira_em: ler('token_expira_em') || '—',
    leads: contagem,
    posts_api_24h: limite ? `${limite.quota_usage}/${limite.config?.quota_total ?? '?'}` : '—',
    fila: db.prepare(`SELECT id, tipo, status, quando, permalink, erro FROM publicacoes ORDER BY id DESC LIMIT 10`).all(),
  };
}

async function rotaAdmin(req, res, partes) {
  const m = req.method;
  const rota = partes.join('/');
  if (m === 'GET' && rota === 'status') return sair(res, 200, await status());
  if (m === 'PUT' && partes[0] === 'arquivos' && partes.length === 3) {
    const [, lote, nomeCod] = partes;
    const nome = decodeURIComponent(nomeCod);
    if (!LOTE.test(lote) || !NOME.test(nome)) throw new Error('lote ou nome de arquivo inválido');
    return sair(res, 200, await receberArquivo(req, lote, nome));
  }
  if (m === 'POST' && rota === 'publicar') {
    const id = agendar(JSON.parse(await lerCorpo(req)));
    processarFila().catch(e => console.error('✗ fila:', e.message));
    return sair(res, 200, publicacao(id));
  }
  if (m === 'GET' && partes[0] === 'publicacoes' && partes[1]) {
    const p = publicacao(Number(partes[1]));
    return p ? sair(res, 200, p) : sair(res, 404, { erro: 'publicação não encontrada' });
  }
  if (m === 'GET' && rota === 'leads.csv') return sair(res, 200, csvLeads(), 'text/csv; charset=utf-8');
  if (m === 'GET' && rota === 'palavras') return sair(res, 200, palavrasAtuais());
  if (m === 'PUT' && rota === 'palavras') return sair(res, 200, { ok: true, palavras: salvarPalavras((await lerCorpo(req)).toString('utf8')) });
  sair(res, 404, { erro: 'rota admin desconhecida' });
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://bot');
  const partes = url.pathname.split('/').filter(Boolean);
  try {
    if (url.pathname === '/health') return sair(res, 200, { ok: true });
    if (url.pathname === '/webhook' && req.method === 'GET') {
      const q = url.searchParams;
      if (q.get('hub.mode') === 'subscribe' && q.get('hub.verify_token') === cfg.verifyToken) {
        console.log('✓ webhook verificado pela Meta');
        return sair(res, 200, q.get('hub.challenge') || '', 'text/plain');
      }
      return sair(res, 403, 'token de verificação não confere', 'text/plain');
    }
    if (url.pathname === '/webhook' && req.method === 'POST') {
      const corpo = await lerCorpo(req);
      if (!assinaturaOk(req, corpo)) {
        console.error('✗ webhook com assinatura inválida — confira APP_SECRET (segredo do app do Instagram)');
        return sair(res, 401, { erro: 'assinatura' });
      }
      sair(res, 200, 'EVENT_RECEIVED', 'text/plain'); // responde já; a Meta reenvia se demorar
      return processarWebhook(JSON.parse(corpo));
    }
    if (partes[0] === 'midia' && (req.method === 'GET' || req.method === 'HEAD') && partes.length === 3) {
      return servirMidia(req, res, partes.slice(1));
    }
    if (partes[0] === 'admin') {
      if (!ehAdmin(req)) return sair(res, 401, { erro: 'ADMIN_TOKEN' });
      return await rotaAdmin(req, res, partes.slice(1));
    }
    sair(res, 404, { erro: 'não encontrado' });
  } catch (e) {
    console.error('✗', req.method, url.pathname, e.message);
    if (!res.headersSent) sair(res, e.status || 400, { erro: e.message });
  }
});

// ---- partida ----
mkdirSync(MIDIA, { recursive: true });
recuperarInterrompidas();
if (!ler('inicio')) gravar('inicio', agora()); // a varredura ignora comentários anteriores à primeira partida
try {
  await iniciarConta();
} catch (e) {
  console.error(`✗ não consegui ler a conta com o IG_TOKEN: ${e.message}`);
  process.exit(1);
}
console.log(`✓ conta @${conta.usuario} (${conta.id})`);
regras();

servidor.listen(cfg.porta, () => console.log(`✓ ouvindo na porta ${cfg.porta} — público em ${cfg.urlPublica}`));

assinarWebhooks()
  .then(campos => { gravar('webhooks', campos); console.log(`✓ webhooks ligados nesta conta: ${campos}`); })
  .catch(e => {
    gravar('webhooks', `não ligados: ${e.message}`);
    console.log(`! webhooks não ligados (${e.message}) — normal antes do App Review; a varredura cobre os comentários`);
  });

const repetir = (fn, ms, nome) => {
  const rodar = () => Promise.resolve().then(fn).catch(e => console.error(`✗ ${nome}: ${e.message}`));
  setTimeout(rodar, 2000);
  setInterval(rodar, ms);
};
if (cfg.pollSeg > 0) repetir(varrer, cfg.pollSeg * 1000, 'varredura');
repetir(processarFila, 30_000, 'fila');
repetir(renovarSePreciso, 12 * 3600e3, 'token');
repetir(limparMidia, 24 * 3600e3, 'limpeza');

for (const sinal of ['SIGTERM', 'SIGINT']) {
  process.on(sinal, () => { servidor.close(); db.close(); process.exit(0); });
}
