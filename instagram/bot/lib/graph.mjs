// API do Instagram com Instagram Login (graph.instagram.com) + token de longa duração com renovação automática.
import { createHash } from 'node:crypto';
import { cfg } from './config.mjs';
import { ler, gravar, agora } from './db.mjs';

let token = '';
export const conta = { id: 'me', usuario: '' };

// corpo → JSON (mensagens, que têm objetos aninhados); form → x-www-form-urlencoded (o formato dos exemplos da Meta).
export async function graph(metodo, caminho, { corpo, form, query } = {}) {
  const url = new URL(`${cfg.graphUrl}/${cfg.graphVersao}/${caminho}`);
  for (const [k, v] of Object.entries(query || {})) url.searchParams.set(k, String(v));
  const headers = { Authorization: `Bearer ${token}` };
  let body;
  if (corpo) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(corpo); }
  if (form) body = new URLSearchParams(Object.entries(form).map(([k, v]) => [k, String(v)]));
  const r = await fetch(url, { method: metodo, headers, body, signal: AbortSignal.timeout(60_000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) {
    const e = new Error(j.error?.error_user_msg || j.error?.message || `HTTP ${r.status}`);
    Object.assign(e, { status: r.status, codigo: j.error?.code, subcodigo: j.error?.error_subcode });
    throw e;
  }
  return j;
}

export async function iniciarConta() {
  const marca = createHash('sha256').update(cfg.token).digest('hex').slice(0, 16);
  if (ler('token_env') !== marca) { // token novo no .env passa a valer; primeira renovação em ~1 dia
    gravar('token_env', marca);
    gravar('token', cfg.token);
    gravar('token_renovado_em', new Date(Date.now() - 6 * 864e5).toISOString());
  }
  token = ler('token');
  const eu = await graph('GET', 'me', { query: { fields: 'user_id,username' } });
  conta.id = String(eu.user_id || eu.id);
  conta.usuario = eu.username || '';
  return conta;
}

// O token dura 60 dias; renovando a cada 7, nunca chega perto de vencer.
export async function renovarSePreciso() {
  if (Date.now() - Date.parse(ler('token_renovado_em') || 0) < 7 * 864e5) return;
  const url = new URL(`${cfg.graphUrl}/refresh_access_token`);
  url.searchParams.set('grant_type', 'ig_refresh_token');
  url.searchParams.set('access_token', token);
  const r = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) throw new Error(`renovar token: ${j.error?.message || `HTTP ${r.status}`}`);
  token = j.access_token;
  gravar('token', token);
  gravar('token_renovado_em', agora());
  if (j.expires_in) gravar('token_expira_em', new Date(Date.now() + j.expires_in * 1000).toISOString());
  console.log(`✓ token renovado (vale ${Math.round((j.expires_in || 0) / 86400)} dias)`);
}

// Liga os webhooks desta conta no app (sem isso o painel não entrega nada, mesmo com a URL configurada).
export async function assinarWebhooks() {
  let erro;
  for (const campos of ['comments,messages,messaging_postbacks', 'comments,messages']) {
    try {
      await graph('POST', `${conta.id}/subscribed_apps`, { form: { subscribed_fields: campos } });
      return campos;
    } catch (e) { erro = e; }
  }
  throw erro;
}
