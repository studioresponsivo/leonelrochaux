// Banco local (SQLite nativo do Node): leads, mensagens já vistas, fila de publicação e valores soltos (token etc.).
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { cfg } from './config.mjs';

mkdirSync(cfg.dados, { recursive: true });
export const db = new DatabaseSync(join(cfg.dados, 'bot.db'));

db.exec(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE IF NOT EXISTS leads (
  comment_id TEXT PRIMARY KEY,      -- id do comentário (ou "dm:<mid>" quando a palavra veio direto no direct)
  origem TEXT,                      -- webhook | varredura | dm
  media_id TEXT, user_id TEXT, igsid TEXT, usuario TEXT,
  palavra TEXT, texto TEXT, criado_em TEXT,
  dm_status TEXT,                   -- na_fila | aguardando | enviado | repetido | erro
  link_enviado_em TEXT, erro TEXT
);
CREATE INDEX IF NOT EXISTS leads_igsid ON leads (igsid, dm_status);
CREATE TABLE IF NOT EXISTS mensagens (mid TEXT PRIMARY KEY, criado_em TEXT);
CREATE TABLE IF NOT EXISTS publicacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT, lote TEXT, arquivos TEXT, legenda TEXT, capa TEXT,
  quando TEXT, status TEXT,         -- agendado | processando | publicado | erro
  media_id TEXT, permalink TEXT, erro TEXT, criado_em TEXT, atualizado_em TEXT
);
`);

export const agora = () => new Date().toISOString();
export const ler = k => db.prepare('SELECT v FROM kv WHERE k = ?').get(k)?.v;
export const gravar = (k, v) =>
  db.prepare('INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').run(k, String(v));

// UPDATE com só os campos passados (undefined vira NULL).
export function atualizar(tabela, chave, id, campos) {
  const ks = Object.keys(campos);
  db.prepare(`UPDATE ${tabela} SET ${ks.map(k => `${k} = ?`).join(', ')} WHERE ${chave} = ?`)
    .run(...ks.map(k => campos[k] ?? null), id);
}
