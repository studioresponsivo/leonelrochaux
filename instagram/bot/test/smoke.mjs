#!/usr/bin/env node
// Teste de fumaça: sobe uma Graph API falsa + o bot + o CLI e confere o fluxo inteiro, sem tocar na Meta.
//   node instagram/bot/test/smoke.mjs
import { createServer } from 'node:http';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHmac } from 'node:crypto';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const BOT_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const CLI = join(BOT_DIR, '..', 'ig.mjs');
const tmp = mkdtempSync(join(tmpdir(), 'igbot-'));
const SEGREDO = 'segredo-teste', ADMIN = 'a'.repeat(32), VERIFY = 'verifica';
// async: a Graph falsa roda neste mesmo processo e precisa do event loop livre
const cli = async (...args) => (await promisify(execFile)(process.execPath, [CLI, ...args], { env: { ...process.env, IG_BOT_URL: BOT, IG_ADMIN_TOKEN: ADMIN }, encoding: 'utf8' })).stdout;
const espera = ms => new Promise(r => setTimeout(r, ms));
let ok = 0;
const passo = nome => { ok++; console.log(`  ✓ ${nome}`); };

// ---- Graph API falsa ----
const chamadas = [];
let n = 0;
const graphFalsa = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://g');
  let corpo = '';
  for await (const p of req) corpo += p;
  const dados = req.headers['content-type']?.includes('json') ? JSON.parse(corpo || '{}') : Object.fromEntries(new URLSearchParams(corpo));
  const caminho = url.pathname.replace(/^\/v\d+\.\d+/, '');
  chamadas.push({ metodo: req.method, caminho, dados, query: Object.fromEntries(url.searchParams), auth: req.headers.authorization });
  const json = o => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  if (caminho === '/me') return json({ user_id: 'IGME', username: 'leonel' });
  if (caminho === '/IGME/subscribed_apps') return json({ success: true });
  if (caminho === '/IGME/messages') {
    const r = dados.recipient;
    return json({ recipient_id: r.comment_id ? `SID_${r.comment_id}` : r.id, message_id: `m${++n}` });
  }
  if (/^\/C\w+\/replies$/.test(caminho)) return json({ id: `r${++n}` });
  if (caminho === '/IGME/media' && req.method === 'GET') return json({ data: [{ id: 'POST1' }] });
  if (caminho === '/POST1/comments') {
    if (url.searchParams.get('fields').includes('from')) { res.writeHead(400); return res.end('{"error":{"message":"(#100) campo from indisponível","code":100}}'); }
    return json({ data: [
      { id: 'CPOLL', text: 'Quero 🔥', timestamp: new Date().toISOString(), username: 'ana' },
      { id: 'COLD', text: 'quero', timestamp: new Date(Date.now() - 864e5).toISOString(), username: 'velho' },
    ] });
  }
  if (caminho === '/IGME/media' && req.method === 'POST') {
    const alvo = dados.image_url || dados.video_url;
    if (alvo) { // a Meta baixa a mídia pela URL pública
      const r = await fetch(alvo);
      if (!r.ok || !/^(image\/jpeg|video\/mp4)/.test(r.headers.get('content-type'))) { res.writeHead(400); return res.end('{"error":{"message":"midia"}}'); }
    }
    return json({ id: `CT${++n}` });
  }
  if (/^\/CT\d+$/.test(caminho)) return json({ status_code: 'FINISHED' });
  if (caminho === '/IGME/media_publish') return json({ id: 'MEDIA1' });
  if (caminho === '/MEDIA1') return json({ permalink: 'https://www.instagram.com/p/teste/' });
  if (caminho === '/IGME/content_publishing_limit') return json({ data: [{ quota_usage: 1, config: { quota_total: 50 } }] });
  if (caminho === '/SID_ZDM') return json({ username: 'bia' });
  res.writeHead(404); res.end('{"error":{"message":"rota falsa inexistente"}}');
});
await new Promise(r => graphFalsa.listen(0, r));
const GRAPH = `http://127.0.0.1:${graphFalsa.address().port}`;

// ---- bot ----
const PORTA = 3900 + Math.floor(Math.random() * 90);
const BOT = `http://127.0.0.1:${PORTA}`;
mkdirSync(join(tmp, 'dados'), { recursive: true });
writeFileSync(join(tmp, 'dados', 'palavras.json'), JSON.stringify({
  quero: { dm: 'Oi {usuario}! Link: {link}', link: 'https://exemplo.com/check', publico: ['Te mandei no direct'] },
  aula: { pedir_resposta: true, botao: 'Quero o link', dm: 'Toca no botão', link_dm: 'Aqui: {link}', link: 'https://exemplo.com/aula', publico: [] },
}));
const bot = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', join(BOT_DIR, 'server.mjs')], {
  env: { ...process.env, PORT: PORTA, URL_PUBLICA: BOT, IG_TOKEN: 'tok', APP_SECRET: `outro,${SEGREDO}`, VERIFY_TOKEN: VERIFY,
    ADMIN_TOKEN: ADMIN, GRAPH_URL: GRAPH, DATA_DIR: join(tmp, 'dados'), POLL_SEGUNDOS: '0', ATRASO_MS: '0-0' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
bot.stdout.on('data', d => { log += d; });
bot.stderr.on('data', d => { log += d; });
const fim = codigo => { bot.kill(); graphFalsa.close(); rmSync(tmp, { recursive: true, force: true }); process.exit(codigo); };
process.on('uncaughtException', e => { console.error(`\n✗ ${e.message}\n--- log do bot ---\n${log}`); fim(1); });
process.on('unhandledRejection', e => { console.error(`\n✗ ${e.message}\n--- log do bot ---\n${log}`); fim(1); });

for (let i = 0; i < 50 && !log.includes('ouvindo'); i++) await espera(100);
assert.ok(log.includes('ouvindo'), 'bot não subiu');
console.log('bot no ar');

const assinar = corpo => `sha256=${createHmac('sha256', SEGREDO).update(corpo).digest('hex')}`;
const webhook = (obj, assinado = true) => {
  const corpo = JSON.stringify(obj);
  return fetch(`${BOT}/webhook`, { method: 'POST', body: corpo, headers: { 'Content-Type': 'application/json', ...(assinado && { 'X-Hub-Signature-256': assinar(corpo) }) } });
};
const comentario = (id, texto, de = { id: 'U1', username: 'joao' }) => ({
  object: 'instagram',
  entry: [{ id: 'IGME', time: 1, changes: [{ field: 'comments', value: { id, text: texto, from: de, media: { id: 'POST1' } } }] }],
});
const mensagem = msg => ({ object: 'instagram', entry: [{ id: 'IGME', time: 1, messaging: [{ sender: { id: msg.de }, recipient: { id: 'IGME' }, timestamp: 1, message: msg.message }] }] });
const dms = () => chamadas.filter(c => c.caminho === '/IGME/messages');
const admin = (caminho, init = {}) => fetch(`${BOT}/admin/${caminho}`, { ...init, headers: { Authorization: `Bearer ${ADMIN}`, ...init.headers } });

assert.equal((await fetch(`${BOT}/health`).then(r => r.json())).ok, true); passo('/health');
assert.equal(await fetch(`${BOT}/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY}&hub.challenge=123`).then(r => r.text()), '123'); passo('verificação do webhook');
assert.equal((await fetch(`${BOT}/webhook?hub.mode=subscribe&hub.verify_token=errado&hub.challenge=1`)).status, 403); passo('verify token errado → 403');
assert.equal((await webhook(comentario('C1', 'quero'), false)).status, 401); passo('webhook sem assinatura → 401');
assert.ok(chamadas.some(c => c.caminho === '/IGME/subscribed_apps' && c.dados.subscribed_fields?.includes('comments'))); passo('webhooks ligados na conta (subscribed_apps)');
assert.ok(chamadas.every(c => c.auth === 'Bearer tok')); passo('token vai no header Authorization');

await webhook(comentario('C1', 'Eu QUERÓ!!! 🔥🔥'));
await espera(2000);
let d = dms().find(c => c.dados.recipient?.comment_id === 'C1');
assert.ok(d, 'DM do C1 não saiu');
assert.match(d.dados.message.text, /^Oi @joao! Link: https:\/\/exemplo\.com\/check\?utm_source=instagram&utm_medium=dm&utm_campaign=quero$/);
passo('comentário "Eu QUERÓ!!! 🔥" → DM com @usuario e link com UTM');
assert.ok(chamadas.some(c => c.caminho === '/C1/replies' && c.dados.message === 'Te mandei no direct')); passo('resposta pública no comentário');

await webhook(comentario('C1', 'Eu QUERÓ!!! 🔥🔥'));
await webhook(comentario('C2', 'quero de novo'));
await webhook(comentario('C3', 'quero', { id: 'IGME', username: 'leonel' }));
await webhook(comentario('C4', 'queroo não casa'));
await espera(1500);
assert.equal(dms().length, 1, `esperava 1 DM, saíram ${dms().length}`); passo('sem DM duplicada (mesmo comentário, mesma pessoa no mesmo post, a própria conta, palavra parcial)');

await webhook(comentario('CA', 'AULA', { id: 'U2', username: 'carla' }));
await espera(1500);
d = dms().find(c => c.dados.recipient?.comment_id === 'CA');
assert.equal(d.dados.message.quick_replies?.[0]?.payload, 'LINK:aula'); passo('pedir_resposta → DM com botão');
await webhook(mensagem({ de: 'SID_CA', message: { mid: 'mid1', text: 'Quero o link', quick_reply: { payload: 'LINK:aula' } } }));
await espera(1500);
d = dms().find(c => c.dados.recipient?.id === 'SID_CA');
assert.match(d?.dados.message.text || '', /^Aqui: https:\/\/exemplo\.com\/aula\?utm_source=instagram/); passo('toque no botão → link enviado (janela de 24 h)');
await webhook(mensagem({ de: 'SID_CA', message: { mid: 'mid1', text: 'Quero o link' } }));
await webhook(mensagem({ de: 'SID_CA', message: { mid: 'mid2', text: 'valeu!', is_echo: true } }));
await espera(1200);
assert.equal(dms().filter(c => c.dados.recipient?.id === 'SID_CA').length, 1); passo('mensagem repetida/eco ignorada');

await webhook(mensagem({ de: 'SID_ZDM', message: { mid: 'mid3', text: 'quero' } }));
await espera(1500);
d = dms().find(c => c.dados.recipient?.id === 'SID_ZDM');
assert.match(d?.dados.message.text || '', /^Oi @bia! Link:/); passo('palavra-chave direto no direct → link');

// publicação de carrossel via CLI
const pasta = join(tmp, 'carrossel');
mkdirSync(pasta);
for (const n of ['01.jpg', '02.jpg', '10.jpg', 'prova.jpg']) writeFileSync(join(pasta, n), Buffer.from('\xff\xd8\xff fake jpeg'));
writeFileSync(join(pasta, 'legenda.txt'), 'Legenda de teste #design\nComenta QUERO');
const saida = await cli('postar', pasta);
assert.match(saida, /publicado: https:\/\/www\.instagram\.com\/p\/teste\//, saida);
const criadas = chamadas.filter(c => c.caminho === '/IGME/media' && c.metodo === 'POST');
assert.equal(criadas.filter(c => c.dados.is_carousel_item === 'true').length, 3, 'prova.jpg não pode entrar');
const pai = criadas.find(c => c.dados.media_type === 'CAROUSEL');
assert.equal(pai.dados.children.split(',').length, 3);
assert.equal(pai.dados.caption, 'Legenda de teste #design\nComenta QUERO');
assert.ok(chamadas.some(c => c.caminho === '/IGME/media_publish'));
passo('CLI postar pasta → upload, 3 filhos, CAROUSEL com legenda, publish, permalink');

const lote = new URL(criadas[0].dados.image_url).pathname.split('/')[2];
const faixa = await fetch(`${BOT}/midia/${lote}/01-01.jpg`, { headers: { Range: 'bytes=0-3' } });
assert.equal(faixa.status, 206); assert.equal((await faixa.arrayBuffer()).byteLength, 4); passo('mídia pública com Range (vídeo)');
assert.equal((await fetch(`${BOT}/midia/${lote}/..%2F..%2Fbot.db`)).status, 404); passo('sem path traversal na mídia');

assert.equal((await fetch(`${BOT}/admin/status`)).status, 401); passo('admin sem token → 401');
assert.equal((await admin('palavras', { method: 'PUT', body: '{"x":{}}' })).status, 400); passo('palavras inválidas recusadas');
const csv = await admin('leads.csv').then(r => r.text());
assert.ok(csv.includes('"joao","quero"') && csv.includes('"carla","aula"') && csv.includes('"bia","quero"')); passo('leads.csv');
const st = await admin('status').then(r => r.json());
assert.equal(st.posts_api_24h, '1/50'); passo('status (limite de posts da API)');

const agendado = await cli('postar', join(pasta, '01.jpg'), '--texto', 'agendado', '--quando', '2099-01-01 09:00');
assert.match(agendado, /imagem agendado/); passo('agendamento (--quando)');

// varredura num segundo bot, mesmo banco: comentário recente casa, antigo (antes da 1ª partida) não
bot.kill(); await espera(300);
const bot2 = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', join(BOT_DIR, 'server.mjs')], {
  env: { ...process.env, PORT: PORTA + 1, URL_PUBLICA: BOT, IG_TOKEN: 'tok', APP_SECRET: SEGREDO, VERIFY_TOKEN: VERIFY, ADMIN_TOKEN: ADMIN,
    GRAPH_URL: GRAPH, DATA_DIR: join(tmp, 'dados'), POLL_SEGUNDOS: '60', ATRASO_MS: '0-0' },
  stdio: 'ignore',
});
await espera(4500);
bot2.kill();
assert.ok(dms().some(c => c.dados.recipient?.comment_id === 'CPOLL'), 'varredura não respondeu o CPOLL');
assert.ok(!dms().some(c => c.dados.recipient?.comment_id === 'COLD')); passo('varredura: responde comentário novo, ignora o anterior ao bot, segue sem o campo "from"');

console.log(`\n${ok} verificações ok`);
fim(0);
