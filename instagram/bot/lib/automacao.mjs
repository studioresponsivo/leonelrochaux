// Comentário com palavra-chave → DM (resposta privada) + resposta pública. Palavra direto no direct → link.
// Varredura de comentários a cada N segundos: funciona antes do App Review (webhook de comentário exige acesso avançado).
import { db, agora, ler, gravar, atualizar } from './db.mjs';
import { graph, conta } from './graph.mjs';
import { casar, buscar, montar, linkDa, normalizar } from './palavras.mjs';
import { cfg } from './config.mjs';

const SETE_DIAS = 7 * 864e5; // a Meta só aceita resposta privada até 7 dias depois do comentário
const espera = ms => new Promise(r => setTimeout(r, ms));
const sortear = lista => lista[Math.floor(Math.random() * lista.length)];
const lead = (id, campos) => atualizar('leads', 'comment_id', id, campos);

// Uma ação por vez, com intervalo aleatório: ritmo de gente, não de robô.
let fila = Promise.resolve();
function enfileirar(tarefa) {
  fila = fila
    .then(async () => {
      const [a, b] = cfg.atraso;
      await espera(a + Math.random() * (b - a));
      await tarefa();
    })
    .catch(e => console.error('✗', e.message));
  return fila;
}

const inserir = db.prepare(`INSERT OR IGNORE INTO leads
  (comment_id, origem, media_id, user_id, usuario, palavra, texto, criado_em, dm_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const jaAtendido = db.prepare(`SELECT 1 FROM leads
  WHERE user_id = ? AND palavra = ? AND media_id = ? AND dm_status NOT IN ('erro', 'repetido') LIMIT 1`);

export function tratarComentario({ id, texto, userId, usuario, mediaId, criadoEm, origem }) {
  if (!id || !texto) return;
  if ((userId && userId === conta.id) || (usuario && usuario === conta.usuario)) return; // suas próprias respostas
  const regra = casar(texto);
  if (!regra) return;
  // Mesma pessoa, mesma palavra, mesmo post: uma DM só (comentar 3× não gera 3 DMs).
  const repetido = Boolean(userId && mediaId && jaAtendido.get(userId, regra.palavra, mediaId));
  const novo = inserir.run(id, origem, mediaId ?? null, userId ?? null, usuario ?? null, regra.palavra,
    texto.slice(0, 500), criadoEm || agora(), repetido ? 'repetido' : 'na_fila').changes;
  if (!novo || repetido) return;
  console.log(`→ @${usuario || '?'} comentou "${texto.slice(0, 40)}" (${regra.palavra}, ${origem})`);
  enfileirar(() => responderComentario(id, regra, usuario));
}

async function responderComentario(commentId, regra, usuario) {
  const mensagem = { text: montar(regra.dm, { usuario, link: linkDa(regra) }) };
  if (regra.pedir_resposta && regra.botao) {
    mensagem.quick_replies = [{ content_type: 'text', title: String(regra.botao).slice(0, 20), payload: `LINK:${regra.palavra}` }];
  }
  const enviar = () => graph('POST', `${conta.id}/messages`, { corpo: { recipient: { comment_id: commentId }, message: mensagem } });
  try {
    let r;
    try { r = await enviar(); } catch (e) {
      if (!mensagem.quick_replies) throw e;
      delete mensagem.quick_replies; // se a API recusar botão na resposta privada, vai só o texto
      r = await enviar();
    }
    const pede = Boolean(regra.pedir_resposta);
    lead(commentId, { igsid: r.recipient_id, dm_status: pede ? 'aguardando' : 'enviado', link_enviado_em: pede ? null : agora() });
    console.log(`✓ DM → @${usuario || r.recipient_id} (${regra.palavra})`);
  } catch (e) {
    lead(commentId, { dm_status: 'erro', erro: e.message });
    console.error(`✗ DM (comentário ${commentId}): ${e.message}${dica(e)}`);
    return;
  }
  if (regra.publico.length) {
    try {
      await espera(1500);
      await graph('POST', `${commentId}/replies`, { form: { message: montar(sortear(regra.publico), { usuario }) } });
    } catch (e) { console.error(`✗ resposta pública (${commentId}): ${e.message}`); }
  }
}

const jaVista = db.prepare('INSERT OR IGNORE INTO mensagens (mid, criado_em) VALUES (?, ?)');

export async function tratarMensagem(ev) {
  const m = ev.message, pb = ev.postback;
  if ((!m && !pb) || m?.is_echo || m?.is_deleted) return;
  const igsid = ev.sender?.id;
  if (!igsid || igsid === conta.id) return;
  const mid = m?.mid || pb?.mid;
  if (mid && !jaVista.run(mid, agora()).changes) return;

  const payload = m?.quick_reply?.payload || pb?.payload || '';
  const alvo = payload.startsWith('LINK:') ? normalizar(payload.slice(5)) : null;
  // 1) Quem recebeu "responde SIM" e respondeu qualquer coisa (ou tocou no botão) → manda o link.
  const pendente = db.prepare(`SELECT comment_id, palavra, usuario FROM leads WHERE igsid = ? AND dm_status = 'aguardando'
    ${alvo ? 'AND palavra = ?' : ''} ORDER BY criado_em DESC LIMIT 1`).get(...(alvo ? [igsid, alvo] : [igsid]));
  if (pendente) {
    const regra = buscar(pendente.palavra);
    if (regra) enfileirar(() => enviarLink(igsid, regra, pendente.usuario, pendente.comment_id));
    return;
  }
  // 2) Palavra-chave mandada direto no direct.
  const regra = (alvo && buscar(alvo)) || (m?.text && casar(m.text));
  if (!regra) return;
  const id = `dm:${mid || `${igsid}:${Date.now()}`}`;
  inserir.run(id, 'dm', null, igsid, null, regra.palavra, String(m?.text || payload).slice(0, 500), agora(), 'na_fila');
  lead(id, { igsid });
  enfileirar(async () => {
    const usuario = await nomeDe(igsid);
    if (usuario) lead(id, { usuario });
    await enviarLink(igsid, regra, usuario, id);
  });
}

async function enviarLink(igsid, regra, usuario, leadId) {
  const modelo = regra.pedir_resposta ? regra.link_dm : regra.dm;
  try {
    await graph('POST', `${conta.id}/messages`, {
      corpo: { recipient: { id: igsid }, message: { text: montar(modelo, { usuario, link: linkDa(regra) }) } },
    });
    lead(leadId, { dm_status: 'enviado', link_enviado_em: agora() });
    console.log(`✓ link → @${usuario || igsid} (${regra.palavra})`);
  } catch (e) {
    lead(leadId, { dm_status: 'erro', erro: e.message });
    console.error(`✗ link (${igsid}): ${e.message}${dica(e)}`);
  }
}

async function nomeDe(igsid) {
  try { return (await graph('GET', igsid, { query: { fields: 'username' } })).username || ''; } catch { return ''; }
}

function dica(e) {
  const m = e.message.toLowerCase();
  if ([10, 200, 230].includes(e.codigo) || m.includes('permission')) return ' → permissão: app em Live? a conta é tester? acesso avançado aprovado?';
  if (m.includes('window') || m.includes('outside')) return ' → fora da janela (7 dias do comentário / 24 h da última mensagem da pessoa)';
  return '';
}

// Varredura: últimos N posts, comentários feitos depois que o bot ligou e dentro dos 7 dias.
let semFrom = false; // se a conta não liberar o campo "from", segue só com "username"
async function comentarios(postId, after) {
  const query = { fields: `id,text,timestamp,username${semFrom ? '' : ',from'}`, limit: 50, ...(after && { after }) };
  try {
    return await graph('GET', `${postId}/comments`, { query });
  } catch (e) {
    if (semFrom) throw e;
    semFrom = true;
    console.log(`! comentários sem o campo "from" (${e.message}) — seguindo só com username`);
    return comentarios(postId, after);
  }
}

export async function varrer() {
  const desde = Math.max(Date.parse(ler('inicio')), Date.now() - SETE_DIAS);
  const { data: posts = [] } = await graph('GET', `${conta.id}/media`, { query: { fields: 'id', limit: cfg.pollPosts } });
  for (const post of posts) {
    let pagina = await comentarios(post.id);
    for (let n = 0; pagina && n < 4; n++) {
      for (const c of pagina.data || []) {
        if (Date.parse(c.timestamp) < desde) continue;
        tratarComentario({
          id: c.id, texto: c.text, userId: c.from?.id, usuario: c.from?.username || c.username,
          mediaId: post.id, criadoEm: c.timestamp, origem: 'varredura',
        });
      }
      const depois = pagina.paging?.next && pagina.paging?.cursors?.after;
      pagina = depois ? await comentarios(post.id, depois) : null;
    }
  }
  gravar('ultima_varredura', agora());
}
