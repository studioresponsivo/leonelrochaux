// Fila de publicação: imagem, carrossel (2–10 itens) e Reels. Os arquivos ficam em dados/midia/<lote>/
// e a Meta busca cada um pela URL pública do bot (a API não aceita upload direto de imagem).
import { readdirSync, statSync, rmSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { db, agora, atualizar } from './db.mjs';
import { graph, conta } from './graph.mjs';
import { cfg } from './config.mjs';

export const MIDIA = join(cfg.dados, 'midia');
export const LOTE = /^[a-f0-9]{16,64}$/;
export const NOME = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/;
const IMAGEM = new Set(['.jpg', '.jpeg']);
const VIDEO = new Set(['.mp4', '.mov']);
const ehVideo = n => VIDEO.has(extname(n).toLowerCase());
const espera = ms => new Promise(r => setTimeout(r, ms));
const marcar = (id, campos) => atualizar('publicacoes', 'id', id, { ...campos, atualizado_em: agora() });

export function agendar({ lote, arquivos, legenda = '', quando, tipo, capa }) {
  if (!LOTE.test(lote || '')) throw new Error('lote inválido');
  if (!Array.isArray(arquivos) || !arquivos.length) throw new Error('nenhum arquivo');
  for (const n of [...arquivos, ...(capa ? [capa] : [])]) {
    const ext = extname(n).toLowerCase();
    if (!NOME.test(n) || !existsSync(join(MIDIA, lote, n))) throw new Error(`arquivo não enviado: ${n}`);
    if (!IMAGEM.has(ext) && !VIDEO.has(ext)) throw new Error(`${n}: use JPEG (imagem) ou MP4/MOV (vídeo) — a API não aceita PNG`);
  }
  tipo ||= arquivos.length > 1 ? 'carrossel' : ehVideo(arquivos[0]) ? 'reels' : 'imagem';
  if (!['carrossel', 'reels', 'imagem'].includes(tipo)) throw new Error(`tipo desconhecido: ${tipo}`);
  if (tipo === 'carrossel' && (arquivos.length < 2 || arquivos.length > 10)) throw new Error('carrossel: de 2 a 10 itens');
  if (tipo !== 'carrossel' && arquivos.length > 1) throw new Error(`${tipo}: um arquivo só`);
  if (tipo === 'reels' && !ehVideo(arquivos[0])) throw new Error('reels: precisa de MP4/MOV');
  if (tipo === 'imagem' && ehVideo(arquivos[0])) throw new Error('imagem: precisa de JPEG');
  if ([...legenda].length > 2200) throw new Error(`legenda com ${[...legenda].length} caracteres (máx. 2200)`);
  if ((legenda.match(/#[\p{L}\p{N}_]+/gu) || []).length > 30) throw new Error('legenda com mais de 30 hashtags');
  const data = quando ? new Date(quando) : new Date();
  if (Number.isNaN(data.getTime())) throw new Error(`data inválida: ${quando}`);
  const { lastInsertRowid } = db.prepare(`INSERT INTO publicacoes
    (tipo, lote, arquivos, legenda, capa, quando, status, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, 'agendado', ?, ?)`)
    .run(tipo, lote, JSON.stringify(arquivos), legenda, capa || null, data.toISOString(), agora(), agora());
  return Number(lastInsertRowid);
}

export const publicacao = id =>
  db.prepare('SELECT id, tipo, status, quando, permalink, erro, atualizado_em FROM publicacoes WHERE id = ?').get(id);

let ocupado = false;
export async function processarFila() {
  if (ocupado) return;
  ocupado = true;
  try {
    let p;
    while ((p = db.prepare(`SELECT * FROM publicacoes WHERE status = 'agendado' AND quando <= ? ORDER BY quando LIMIT 1`).get(agora()))) {
      await publicar(p);
    }
  } finally { ocupado = false; }
}

// Se o bot caiu no meio de uma publicação, não repete sozinho (poderia postar duas vezes).
export function recuperarInterrompidas() {
  db.prepare(`UPDATE publicacoes SET status = 'erro', erro = 'interrompida (o bot reiniciou no meio) — confira no Instagram antes de repetir'
    WHERE status = 'processando'`).run();
}

async function publicar(p) {
  marcar(p.id, { status: 'processando' });
  const url = n => `${cfg.urlPublica}/midia/${p.lote}/${encodeURIComponent(n)}`;
  const arquivos = JSON.parse(p.arquivos);
  try {
    let criacao;
    if (p.tipo === 'reels') {
      criacao = await criar({ media_type: 'REELS', video_url: url(arquivos[0]), caption: p.legenda, share_to_feed: true, ...(p.capa && { cover_url: url(p.capa) }) });
    } else if (p.tipo === 'imagem') {
      criacao = await criar({ image_url: url(arquivos[0]), caption: p.legenda });
    } else {
      const filhos = [];
      for (const n of arquivos) {
        filhos.push(await criar(ehVideo(n)
          ? { media_type: 'VIDEO', video_url: url(n), is_carousel_item: true }
          : { image_url: url(n), is_carousel_item: true }));
      }
      for (const f of filhos) await pronto(f);
      criacao = await criar({ media_type: 'CAROUSEL', children: filhos.join(','), caption: p.legenda });
    }
    await pronto(criacao);
    const { id } = await graph('POST', `${conta.id}/media_publish`, { form: { creation_id: criacao } });
    const { permalink = '' } = await graph('GET', id, { query: { fields: 'permalink' } }).catch(() => ({}));
    marcar(p.id, { status: 'publicado', media_id: id, permalink });
    console.log(`✓ publicado (${p.tipo}): ${permalink || id}`);
  } catch (e) {
    marcar(p.id, { status: 'erro', erro: e.message });
    console.error(`✗ publicação ${p.id}: ${e.message}`);
  }
}

const criar = async params => (await graph('POST', `${conta.id}/media`, { form: params })).id;

// Vídeo leva de segundos a minutos para a Meta processar; imagem costuma vir pronta.
async function pronto(id, limite = 15 * 60e3) {
  const fim = Date.now() + limite;
  while (Date.now() < fim) {
    const { status_code, status } = await graph('GET', id, { query: { fields: 'status_code,status' } });
    if (status_code === 'FINISHED' || status_code === 'PUBLISHED') return;
    if (status_code === 'ERROR' || status_code === 'EXPIRED') throw new Error(`a Meta recusou a mídia (${status_code}): ${status || 'sem detalhe'}`);
    await espera(5000);
  }
  throw new Error('a Meta não terminou de processar em 15 min');
}

// Apaga lotes com mais de 3 dias que não estão esperando publicação.
export function limparMidia() {
  if (!existsSync(MIDIA)) return;
  const ativos = new Set(db.prepare(`SELECT lote FROM publicacoes WHERE status IN ('agendado', 'processando')`).all().map(r => r.lote));
  for (const lote of readdirSync(MIDIA)) {
    const dir = join(MIDIA, lote);
    if (!ativos.has(lote) && Date.now() - statSync(dir).mtimeMs > 3 * 864e5) rmSync(dir, { recursive: true, force: true });
  }
}
