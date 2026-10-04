# Studio Responsivo — edição de vídeo de baixo custo

Leonel Rocha (Product Designer, Studio Responsivo / Conversão Visual). Responder em PT-BR, direto.
Todos os vídeos (Reels/Shorts/TikTok, YouTube longo e portfólio) seguem o **estilo v2** (`docs/motion/estilo-v2.md`), pronto no motor `studio/` (`studio/engine/v2/`).

## Fluxo padrão — siga exatamente, sem explorar
0. Vídeos chegam no Drive (conta hello@studioresponsivo.com.br), pasta **"Claude Code + Hyperframes"** (id `1_khvFisNSGJUU_RWa8MiBhJ2fllkAw-5`), uma subpasta por vídeo com o nome que o Leonel avisar.
   Achar a subpasta: `search_files` com `parentId = '1_khvFisNSGJUU_RWa8MiBhJ2fllkAw-5' and title contains '<nome>'` (excludeContentSnippets: true);
   listar arquivos: `parentId = '<id da subpasta>'`. Vídeo → `prep.sh <id do arquivo>`; capa (imagem) → baixar para `work/<slug>/`.
1. `studio/bin/prep.sh <id-ou-link-do-arquivo> <slug>` → baixa e transcreve. Saída curta.
2. Ler **só** `work/<slug>/transcript.txt` (uma linha por frase, com tempo).
3. Escrever o roteiro `work/<slug>/<nome>.json` seguindo `studio/SPEC.md` (ler uma vez) e o exemplo `studio/specs/pagina-24h-v2.json`.
   Antes, ver a última entrada de `studio/specs/historico.json` para NÃO repetir abertura/sequência.
   Capa do vídeo (se houver CTA com imagem) → salvar em `work/<slug>/`.
4. `node studio/bin/make.mjs <slug> <nome>.json --proof --no-render` → olhar a folha de prova (contact-sheet; pode vir em 2–3 imagens) e os avisos ⚠.
5. Ajustar o JSON se precisar → `node studio/bin/make.mjs <slug> <nome>.json` (renderiza; ~4 min por 75 s).
6. Entregar: `entregas/<slug>/<nome>-previa.mp4` via SendUserFile (o arquivo cheio passa do limite do chat); commit + push de `entregas/<slug>/` e do JSON em `studio/specs/`.

**Formatos**: `vertical` (Reels/Shorts/TikTok, 45–75 s + CTA) · `horizontal` (YouTube longo) · `portfolio` (case de projeto, sem rosto: telas/imagens + música/voz opcional; cenas encadeadas por `dur`).
**YouTube longo**: o Leonel entrega o vídeo JÁ CORTADO no Premiere → roteiro com `"format":"horizontal"`, `"cuts":"all"` e só a camada visual (opening, cenas de capítulo, `screenRanges` para trechos de tela). Não cortar nada.
**Entrega**: master ≤ 95 MB vai para `entregas/<slug>/` (git). Se maior, o make guarda o master em `entregas/<slug>/grandes/` (fora do git) e gera `<nome>-postar.mp4` ≤ 93 MB (~9 Mbps a 80 s), que vai para o git. Para longos, o ideal é renderizar no computador dele (Claude Code desktop).
**Fonte**: Articulat CF em `studio/assets/fonts-marca/` (não versionar enquanto o repositório for público); sem ela o make avisa "SEM fonte Articulat" e usa Plus Jakarta Sans.

Vários cortes do mesmo vídeo = vários JSON na mesma sessão (a transcrição é lida uma vez). Um vídeo longo por sessão.

## Padrões do Leonel (inegociáveis)
- **Gancho de cinema**: todo vídeo abre com `opening` (screen-first, type-hook, ticker-hook, number-hook, search-hook, result-first, face-to-face-cut, problem-flood, selection-hook). A cena entra com a voz por baixo e o rosto é a recompensa. NUNCA "rosto num card com vídeos/ícones flutuando".
- **Variação**: cada vídeo é novo — não repetir a abertura nem a sequência de cenas do vídeo anterior (o make avisa via `historico.json`); alternar fundo de capítulo (light/dark/green). Usar `cutaway` (B-roll de qualquer ponto do original sobre a fala) para mostrar a tela/resultado.
- **Densidade**: 1 objeto por vez; algo muda a cada ~1–1,5 s; nenhuma transição especial > 3× por vídeo; SFX ≤ 6 audíveis/10 s no vertical (3 no horizontal) — o limitador corta o excesso; `hush` nas frases-chave. Organizado, nunca poluído, nunca "cara de IA".
- **Qualidade**: câmera profissional — nunca entregar abaixo da resolução/fps da fonte. Prévia 720p só para o chat; o arquivo final completo vai para `entregas/` (GitHub).

## Economia de tokens (regras)
- NÃO ler skills do HyperFrames, `compose.mjs` nem docs, a menos que algo quebre ou o estilo precise de um efeito novo.
- NÃO imprimir transcrição em JSON nem logs inteiros; os scripts já resumem.
- No máximo 1 folha de prova por roteiro; frames avulsos só para conferir coordenadas de `note`/`focus`.
- Efeito novo pedido pelo Leonel → implementar em `studio/engine/v2/compose.mjs` (cenas/transições) ou `plan.mjs` (aberturas) e documentar em `studio/SPEC.md`. O v1 (`studio/engine/compose.mjs`) só roda roteiros antigos.

## Ambiente
- Rede precisa liberar: drive.usercontent.google.com, huggingface.co, us.aws.cdn.hf.co, cdn.jsdelivr.net.
- `studio/bin/setup.sh` instala Chrome do HyperFrames, modelo Parakeet e OpenCV (roda sozinho no início da sessão).
- Marca: verde #22C55E + escala neutral; fonte Articulat CF (pesos 400/450/500/600/700).
- Referência visual: estilo v2 (motion de UI tipo editverse adaptado a rosto + tela) — `docs/motion/estilo-v2.md`.

## Canal 2 — EA FC (modo carreira, Leicester) — estilo `eafc`
Pasta no Drive: **"Claude Code + Hyperframes"** › "Assets para os videos" (referências S2G/Neto) e uma subpasta por gancho (vídeo já cortado + roteiro + Simbolos/Estadios/Titulos/Campeonatos/Tipografia).
Fluxo igual ao padrão, mas: roteiro com `"style":"eafc"`, `"format":"horizontal"`, `"cuts":"all"` (não cortar nada, não tratar áudio); imagens recortadas em `work/<slug>/img/` (escudos `logo-<time>.png` com transparência aparada, fotos `.jpg`); cama de tensão com `studio/bin/trilha.py`; texto atrás do rosto (`"behind": true`) custa ~1 min por 1,3 s de matte — 2–3 por vídeo. Guia: `docs/motion/estilo-eafc.md`; cenas: `studio/SPEC.md` › EA FC; exemplo: `studio/specs/gancho-ep06-eafc.json`; histórico próprio em `studio/specs/historico-eafc.json`.
Entrega: 1080p60 em `entregas/<slug>/` (≤ 93 MB no git) e o link de download é o arquivo no GitHub (`github.com/<repo>/raw/<branch>/entregas/...`). O MCP do Drive não sobe arquivos grandes (base64 inline) — upload no Drive só manual.
