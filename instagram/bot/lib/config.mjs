// Configuração do bot: variáveis de ambiente (no Docker vêm do .env via env_file; rodando direto, lê o .env ao lado).
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

export const RAIZ = dirname(dirname(fileURLToPath(import.meta.url)));

const envArq = join(RAIZ, '.env');
if (existsSync(envArq)) {
  for (const linha of readFileSync(envArq, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const e = process.env;
const [atrasoMin = 0, atrasoMax = atrasoMin] = (e.ATRASO_MS || '2000-8000').split('-').map(Number);

export const cfg = {
  porta: Number(e.PORT || 3000),
  urlPublica: (e.URL_PUBLICA || (e.DOMINIO ? `https://${e.DOMINIO}` : '')).replace(/\/$/, ''),
  token: e.IG_TOKEN || '',
  // Aceita mais de um segredo (separados por vírgula): o do app do Instagram e o de Configurações > Básico.
  segredos: (e.APP_SECRET || '').split(',').map(s => s.trim()).filter(Boolean),
  verifyToken: e.VERIFY_TOKEN || '',
  adminToken: e.ADMIN_TOKEN || '',
  graphUrl: (e.GRAPH_URL || 'https://graph.instagram.com').replace(/\/$/, ''),
  graphVersao: e.GRAPH_VERSION || 'v25.0',
  dados: resolve(RAIZ, e.DATA_DIR || 'dados'),
  pollSeg: Number(e.POLL_SEGUNDOS ?? 120),
  pollPosts: Number(e.POLL_POSTS || 5),
  atraso: [atrasoMin, atrasoMax],
  limiteUpload: Number(e.LIMITE_UPLOAD_MB || 1024) * 1024 * 1024,
};

const faltando = ['IG_TOKEN', 'APP_SECRET', 'VERIFY_TOKEN', 'ADMIN_TOKEN'].filter(k => !e[k]);
if (!cfg.urlPublica) faltando.push('DOMINIO');
if (faltando.length) {
  console.error(`✗ faltam no .env: ${faltando.join(', ')}`);
  process.exit(1);
}
if (cfg.adminToken.length < 24) {
  console.error('✗ ADMIN_TOKEN curto demais — gere um com: openssl rand -hex 24');
  process.exit(1);
}
