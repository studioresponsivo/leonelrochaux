# Studio Responsivo — edição de vídeo de baixo custo

Leonel Rocha (Product Designer, Studio Responsivo / Conversão Visual). Responder em PT-BR, direto.
Todos os vídeos (Reels/Shorts/TikTok e YouTube longo) seguem UM estilo, já pronto no motor `studio/`.

## Fluxo padrão — siga exatamente, sem explorar
1. `studio/bin/prep.sh <link-do-drive> <slug>` → baixa e transcreve. Saída curta.
2. Ler **só** `work/<slug>/transcript.txt` (uma linha por frase, com tempo).
3. Escrever o roteiro `work/<slug>/<nome>.json` seguindo `studio/SPEC.md` (ler uma vez) e o exemplo `studio/specs/exemplo-80-20-reels.json`.
   Capa do vídeo (se houver CTA com imagem) → salvar em `work/<slug>/`.
4. `node studio/bin/make.mjs <slug> <nome>.json --proof --no-render` → olhar **uma** folha de prova (contact-sheet).
5. Ajustar o JSON se precisar → `node studio/bin/make.mjs <slug> <nome>.json` (renderiza; ~4 min por 75 s).
6. Entregar: `entregas/<slug>/<nome>-previa.mp4` via SendUserFile (o arquivo cheio passa do limite do chat); commit + push de `entregas/<slug>/` e do JSON em `studio/specs/`.

Vários cortes do mesmo vídeo = vários JSON na mesma sessão (a transcrição é lida uma vez). Um vídeo longo por sessão.

## Economia de tokens (regras)
- NÃO ler skills do HyperFrames, `compose.mjs` nem docs, a menos que algo quebre ou o estilo precise de um efeito novo.
- NÃO imprimir transcrição em JSON nem logs inteiros; os scripts já resumem.
- No máximo 1 folha de prova por roteiro; frames avulsos só para conferir coordenadas de `note`/`focus`.
- Efeito novo pedido pelo Leonel → implementar no `studio/engine/compose.mjs` (vira padrão para todos) e documentar em `studio/SPEC.md`.

## Ambiente
- Rede precisa liberar: drive.usercontent.google.com, huggingface.co, us.aws.cdn.hf.co, cdn.jsdelivr.net.
- `studio/bin/setup.sh` instala Chrome do HyperFrames, modelo Parakeet e OpenCV (roda sozinho no início da sessão).
- Marca: verde #22C55E + escala neutral; fonte provisória Plus Jakarta Sans (oficial: Articulat CF, pendente).
- Referência visual: estilo uxpeak (fundo claro, UI em 3D, pílulas brancas) — ver `docs/motion/receita-reels-talking-head.md`.
