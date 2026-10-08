// Palavras-chave: dados/palavras.json (enviado pelo `ig.mjs palavras`) ou, se não existir, o palavras.json do repositório.
// O arquivo é relido sozinho quando muda — não precisa reiniciar o bot.
import { readFileSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cfg, RAIZ } from './config.mjs';

const ARQ_DADOS = join(cfg.dados, 'palavras.json');
let cache = { arq: '', mtime: 0, regras: [] };

// "Eu QUERO!!! 🔥" → "eu quero"  (minúsculas, sem acento, sem emoji/pontuação)
export const normalizar = t => String(t ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const arquivo = () => (existsSync(ARQ_DADOS) ? ARQ_DADOS : join(RAIZ, 'palavras.json'));

export function validar(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('precisa ser um objeto { "palavra": { ... } }');
  const regras = [];
  for (const [palavra, r] of Object.entries(obj)) {
    if (palavra.startsWith('_')) continue; // comentários/instruções
    if (!r?.dm) throw new Error(`"${palavra}": falta "dm"`);
    if (r.pedir_resposta && !r.link_dm) throw new Error(`"${palavra}": com pedir_resposta, escreva "link_dm" (a mensagem que leva o link)`);
    const termos = [palavra, ...(r.variacoes || [])].map(normalizar).filter(Boolean);
    regras.push({ ...r, palavra: normalizar(palavra), termos, publico: [].concat(r.publico || []) });
  }
  return regras;
}

export function regras() {
  const arq = arquivo();
  const { mtimeMs } = statSync(arq);
  if (arq !== cache.arq || mtimeMs !== cache.mtime) {
    try {
      cache = { arq, mtime: mtimeMs, regras: validar(JSON.parse(readFileSync(arq, 'utf8'))) };
      console.log(`✓ palavras-chave: ${cache.regras.map(r => r.palavra).join(', ') || '(nenhuma)'}`);
    } catch (e) {
      console.error(`✗ ${arq}: ${e.message} (mantendo as anteriores)`);
      Object.assign(cache, { arq, mtime: mtimeMs });
    }
  }
  return cache.regras;
}

// Palavra inteira dentro do comentário ("eu quero!" casa com "quero"); "exato": true exige o comentário só com ela.
export function casar(texto) {
  const t = ` ${normalizar(texto)} `;
  let melhor = null;
  for (const r of regras()) {
    for (const termo of r.termos) {
      const ok = r.exato ? t.trim() === termo : t.includes(` ${termo} `);
      if (ok && (!melhor || termo.length > melhor.termo.length)) melhor = { regra: r, termo };
    }
  }
  return melhor?.regra || null;
}

export const buscar = palavra => regras().find(r => r.palavra === normalizar(palavra)) || null;
export const atual = () => readFileSync(arquivo(), 'utf8');

export function salvar(texto) {
  validar(JSON.parse(texto));
  writeFileSync(ARQ_DADOS, texto);
  return regras().map(r => r.palavra);
}

// Link com UTM (para medir no Analytics/Framer quantos cliques cada palavra gera). "utm": false desliga.
export function linkDa(regra) {
  if (!regra.link || regra.utm === false) return regra.link || '';
  try {
    const u = new URL(regra.link);
    for (const [k, v] of [['utm_source', 'instagram'], ['utm_medium', 'dm'], ['utm_campaign', regra.palavra.replace(/ /g, '-')]]) {
      if (!u.searchParams.has(k)) u.searchParams.set(k, v);
    }
    return u.toString();
  } catch { return regra.link; }
}

export function montar(modelo, { usuario = '', link = '' } = {}) {
  return String(modelo)
    .replace(/@?\{usuario\}/g, usuario ? `@${usuario}` : '')
    .replace(/\{link\}/g, link)
    .replace(/[ \t]+([!?.,])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
