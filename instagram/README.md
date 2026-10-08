# Instagram no automático — Claude Code + API oficial da Meta

Sem ManyChat, sem assinatura, sem "Instagram MCP" de terceiros. Só a API gratuita da Meta, um bot pequeno na sua VPS e o Claude Code como braço.

```
Claude Code (seu Mac) ──ig.mjs──▶ bot na VPS (https://ig.seudominio) ──▶ API oficial da Meta ──▶ Instagram
                                     ▲   serve as imagens/vídeos (a Meta baixa pela URL pública)
Instagram ── webhook (comentário/DM) ┘   + varredura dos comentários a cada 2 min
```

**O que você ganha**
1. **Carrossel/Reels**: o Claude escreve o roteiro → gera os slides na sua marca → você aprova a folha de prova → ele publica ou agenda.
2. **Palavra-chave → DM**: alguém comenta "QUERO" → recebe a DM com o link (com UTM) + resposta pública no comentário. Palavra mandada direto no direct também funciona.
3. **Leads**: todo mundo que pediu fica salvo (usuário, palavra, post, horário) → CSV.

Custo: R$ 0 além da VPS que você já tem. Tempo de setup: ~1 h, uma vez.

---

## Parte 1 — Pré-requisitos (10 min)

- [ ] Instagram **profissional** (Criador ou Empresa) e **público**: Instagram → Configurações → Tipo de conta e ferramentas.
- [ ] Conta de desenvolvedor em [developers.facebook.com](https://developers.facebook.com) (entra com seu Facebook).
- [ ] Uma página de **política de privacidade** no seu site (pode ser uma página simples no Framer). A Meta exige a URL para o app ir ao ar.
- [ ] Um subdomínio para o bot, ex. `ig.studioresponsivo.com.br`.

## Parte 2 — Criar o app na Meta (15 min)

Os nomes dos menus mudam de vez em quando; procure pelos termos em negrito (o painel pode estar em inglês).

1. [developers.facebook.com/apps](https://developers.facebook.com/apps) → **Criar app**.
2. Caso de uso: **Gerenciar mensagens e conteúdo no Instagram** (*Manage messaging & content on Instagram*). Se pedir portfólio empresarial, escolha o do Studio.
3. No painel do app: **Casos de uso → Instagram → Personalizar → Configuração da API com login do Instagram** (*API setup with Instagram business login*).
4. Confira as permissões adicionadas: `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_comments`, `instagram_business_manage_messages`.
5. **Gerar tokens de acesso → Adicionar conta** → entre com o seu Instagram → **copie o token** → é o `IG_TOKEN`.
   Se aparecer convite de testador: Instagram → Configurações → Apps e sites → Convites de testador → aceitar.
6. Na mesma tela, copie a **Chave secreta do app do Instagram** → `APP_SECRET`. Em **Configurações do app → Básico** tem outra "Chave secreta do app": cole as duas separadas por vírgula (o bot aceita qualquer uma — a Meta não deixa claro qual assina o webhook).
7. Ainda em **Configurações do app → Básico**: URL da política de privacidade, ícone e categoria → Salvar.
8. O webhook (passo 9) só dá para salvar com o bot no ar. Faça a Parte 3 e volte aqui.
9. **Configurar webhooks**: URL de callback `https://ig.SEUDOMINIO/webhook`, **Verificar token** = o mesmo `VERIFY_TOKEN` do `.env` → **Verificar e salvar** → assine os campos **comments**, **messages** e **messaging_postbacks**.
10. Coloque o app **Ao vivo** (*Live* / **Publicar**). Em modo desenvolvimento a Meta não entrega webhooks.

## Parte 3 — Subir o bot na VPS (15 min)

1. **DNS** (hPanel da Hostinger → Domínios → DNS): registro **A**, nome `ig`, apontando para o IP da VPS.
2. **Copiar a pasta** do seu computador para a VPS:
   ```bash
   scp -r instagram/bot root@IP_DA_VPS:/opt/ig-bot
   ```
3. **Configurar** (na VPS):
   ```bash
   ssh root@IP_DA_VPS
   cd /opt/ig-bot && cp .env.example .env
   openssl rand -hex 16   # → VERIFY_TOKEN
   openssl rand -hex 24   # → ADMIN_TOKEN
   nano .env              # DOMINIO, IG_TOKEN, APP_SECRET, VERIFY_TOKEN, ADMIN_TOKEN
   ```
4. **Subir**. Primeiro veja se as portas 80/443 estão livres: `ss -tlnp | grep -E ':(80|443) '`
   - Nada apareceu → `docker compose --profile caddy up -d --build` (o Caddy emite o HTTPS sozinho).
   - Já tem nginx (sites) → `docker compose up -d --build` e um bloco no nginx + `certbot --nginx -d ig.SEUDOMINIO`:
     ```nginx
     server {
       server_name ig.SEUDOMINIO;
       client_max_body_size 1g;
       location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; proxy_request_buffering off; }
     }
     ```
5. **Testar**: `curl https://ig.SEUDOMINIO/health` → `{"ok":true}`. Logs: `docker compose logs -f bot` → deve aparecer `✓ conta @seuuser`.
6. Volte na Parte 2, passo 9 (webhook).

> Atalho: no Claude Code do seu computador, peça: *"Leia instagram/README.md e suba o bot na minha VPS (ssh root@IP). Meu subdomínio é ig.xxx. Me pergunte os tokens."* Ele detecta nginx/Traefik e faz o resto.

Atualizar o bot depois: copie a pasta de novo e rode `docker compose up -d --build` (os dados ficam no volume `dados`).

## Parte 4 — Seu computador (2 min)

Crie `instagram/.env` (já está no `.gitignore`):
```
IG_BOT_URL=https://ig.SEUDOMINIO
IG_ADMIN_TOKEN=<o mesmo ADMIN_TOKEN da VPS>
```
Teste: `node instagram/ig.mjs status`. Suba suas palavras-chave: `node instagram/ig.mjs palavras`.

## Parte 5 — App Review (grátis, alguns dias)

| | Antes do App Review | Depois |
|---|---|---|
| Publicar carrossel / Reels / imagem | ✓ | ✓ |
| Comentário → DM + resposta pública | ✓ pela **varredura** (até 2 min de atraso). Na sua própria conta o acesso padrão deve bastar; se a DM falhar com erro de permissão, é o review que falta. Teste com uma 2ª conta. | ✓ na hora (webhook) |
| "Responde SIM" (`pedir_resposta`) e palavra mandada no direct | ✗ (precisa do webhook de mensagens) | ✓ |

Como pedir:
1. **Verificação da empresa** no portfólio empresarial (CNPJ do Studio). A Meta costuma exigir antes do acesso avançado.
2. Em **Análise do app → Permissões e recursos**, peça **acesso avançado** para `instagram_business_basic`, `instagram_business_manage_comments` e `instagram_business_manage_messages`.
3. Para cada uma: texto de uso + vídeo de tela (screencast) mostrando o fluxo de ponta a ponta. Roteiro do vídeo (1–2 min):
   1. Post com o CTA "Comenta QUERO".
   2. De outra conta, comentar "quero".
   3. A DM chegando com o link e a resposta pública no comentário.
   4. O log do bot / o `leads.csv`.
4. Texto sugerido (em inglês, os revisores leem inglês):
   > We use this permission only on our own Instagram professional account (@SEUUSER). When a user comments a specific keyword (e.g. "QUERO") on our posts, our server replies once with a private reply containing the link the user asked for, and posts a short public reply. Users who reply to that message receive the link within the 24-hour window. We do not message users who did not request it and we do not store data beyond username, keyword and timestamp.

Enquanto espera: a varredura já roda; teste com contas que você controla.

## Parte 6 — Uso diário (pedindo ao Claude Code)

| Você pede | O que acontece |
|---|---|
| "Faz um carrossel sobre *X* para o Studio, CTA QUERO → checklist" | Claude escreve `instagram/carrosseis/<slug>.json` ([SPEC](carrossel/SPEC.md)) → `node instagram/carrossel/render.mjs …` → te mostra `work/ig/<slug>/prova.jpg` |
| "Aprovado, posta amanhã 9h" | `node instagram/ig.mjs postar work/ig/<slug> --quando "AAAA-MM-DD 09:00"` (sem fuso = Brasília) |
| "Posta o reels do vídeo X com essa legenda" | `node instagram/ig.mjs postar entregas/<slug>/<nome>.mp4 --legenda legenda.txt` |
| "Cria a palavra GUIA que manda o link Y" | edita `instagram/bot/palavras.json` → `node instagram/ig.mjs palavras` (vale na hora) |
| "Baixa os leads" | `node instagram/ig.mjs leads` → `work/ig/leads.csv` |

Funciona no Claude Code do seu computador. Numa sessão na nuvem, o domínio do bot precisa estar liberado na política de rede do ambiente.

### `palavras.json`
```json
"quero": {
  "variacoes": ["eu quero"],
  "dm": "Oi {usuario}! Aqui está o checklist:\n{link}",
  "link": "https://seusite.com/checklist",
  "publico": ["Te mandei no direct 📩", "Enviado! Olha seu direct 👀"]
}
```
- Acento, maiúscula e emoji não importam ("Eu QUERÓ!!! 🔥" casa com `quero`). `"exato": true` exige o comentário só com a palavra.
- O link sai com `utm_source=instagram&utm_medium=dm&utm_campaign=<palavra>` (`"utm": false` desliga).
- `pedir_resposta: true` + `botao` + `link_dm`: a 1ª DM convida ("toca no botão ou responde SIM") e o link só vai quando a pessoa responde. Abre a janela de 24 h para conversar — mas perde gente no caminho. Use só quando quiser conversa (qualificar, vender serviço).
- Mesma pessoa comentando 3× no mesmo post recebe 1 DM. Suas próprias respostas são ignoradas.

## Regras da Meta (não dá para contornar)

- **1 resposta privada por comentário**, até **7 dias** depois dele. A 2ª mensagem só se a pessoa responder, dentro de **24 h**.
- Quem não te segue recebe a DM em **Solicitações de mensagem**.
- **50 posts por 24 h** via API (carrossel conta 1). O `status` mostra o uso.
- Carrossel: **2–10 itens**, **JPEG**, 4:5 (1080×1350), até 8 MB por imagem. 3:4 não está confirmado na API — fique no 4:5.
- Reels: MP4 (H.264 + AAC), 9:16. Música da biblioteca do Instagram não entra pela API: publique com o áudio já mixado.
- Legenda até 2.200 caracteres e 30 hashtags.
- Token dura 60 dias; o bot renova sozinho a cada 7.

## Estratégia (para virar lead, não só automação)

1. **A palavra-chave é o meio.** A DM entrega na hora o que o post prometeu + **um** próximo passo (página com formulário ou WhatsApp).
2. **Uma palavra por campanha**, curta e sem ambiguidade (QUERO, GUIA, AULA). A mesma no último slide, na legenda e num comentário fixado.
3. **Resposta pública com 3–5 variações**: cada uma é +1 comentário no post e não parece robô.
4. **Meça o funil**: comentários → DMs (`leads.csv`) → cliques (UTM no Analytics/Framer) → leads (formulário). Clique baixo = a DM está fraca. Lead baixo = a página está fraca.
5. **Nunca mande DM para quem não pediu.** Spam derruba o alcance e pode restringir a conta.

## Segurança

- Tokens só no `.env` da VPS e em `instagram/.env` — os dois fora do git (o repositório é público).
- Não use "Instagram MCP" da comunidade com o seu token: ele ganha poder de postar e mandar DM pela sua conta. Este bot é seu e cabe numa leitura (`instagram/bot/`, ~700 linhas, zero dependências).
- Se vazar: Instagram → Configurações → Apps e sites → remover o app; gere token novo e troque o `ADMIN_TOKEN`.

## Arquivos

| | |
|---|---|
| `bot/server.mjs` + `bot/lib/` | o bot (Node 22, SQLite nativo, sem `npm install`) |
| `bot/palavras.json` | palavras-chave (modelo) |
| `bot/docker-compose.yml`, `Dockerfile`, `Caddyfile`, `.env.example` | deploy |
| `bot/test/smoke.mjs` | teste com uma API da Meta falsa: `node instagram/bot/test/smoke.mjs` |
| `ig.mjs` | CLI: `postar`, `palavras`, `leads`, `status` |
| `carrossel/render.mjs` + `SPEC.md` | roteiro JSON → slides JPEG na marca |
| `carrosseis/` | roteiros de carrossel (versionados) |
