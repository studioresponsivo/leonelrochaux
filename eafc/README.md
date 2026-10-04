# Canal EA FC — Théo Torres (Modo Carreira)

Canal separado do Studio Responsivo. **Nada aqui usa o estilo v2 nem o motor `studio/`.** Tudo que é do canal de EA FC vive em `eafc/` (motor, assets, specs, histórico), `work/eafc/` (temporários) e `entregas/eafc/` (arquivos finais).

## Fatos fixos
- Entrega sempre **1920×1080, 60 fps**, para YouTube (vídeo longo). Prévia 720p só para o chat.
- Jogador criado: **Théo Torres**, nº 14, Club América (amarelo `#F9D616` + azul-marinho `#0A1F44`), Estádio Azteca.
- Drive (conta hello@): pasta **"EA FC"** `1w2yRyZQsR0DYiUd_1qRMpKuHvp7jzpai`
  - `Assets para os videos/` → referências de estilo (`estilo visual.mp4`, `Estilo de edição.mp4`). São vídeos de outros criadores: só referência.
  - uma subpasta por trabalho (ex. `Vinheta Theo Torres/`) com clipes, imagens e o roteiro usado na gravação.
- O Leonel entrega o vídeo **já cortado e com áudio ajustado** no Premiere. Nunca cortar, nunca mexer no áudio da fala. O trabalho é a camada visual: vinheta, ganchos, cards, cutaways, transições.
- Guia de estilo (ler antes de qualquer vídeo): `docs/motion/estilo-eafc.md`. Análise bruta das referências (S2G): `work/eafc/ref/analise/reports.md` (fora do git; regenerável).
- Tipografia dos gráficos: **Articulat CF** (a mesma do Leonel), Heavy/ExtraBold para números e siglas em caixa alta, Medium para rótulos.

## Tipos de pedido
| Pedido | O que fazer |
|---|---|
| **Vinheta / intro** | `node eafc/bin/vinheta.mjs <slug> [spec.json]` → `entregas/eafc/<slug>/` (ver `eafc/specs/vinheta-theo-torres.json`). |
| **Gancho inicial** | `node eafc/bin/gancho.mjs <slug> <spec.json> --proof --no-render` → conferir folhas de prova → `node eafc/bin/gancho.mjs <slug> <spec.json>`. Spec = lista de eventos ancorados nos tempos das palavras (ver `eafc/specs/gancho-ep03.json`). Modelo de edição S2G com identidade América. |
| **Edição inteira** | mesmo motor do gancho (`gancho.mjs`), vídeo inteiro: PiP do rosto quando houver gameplay (a construir), cards de jogo, cutaways, transições. |

### Componentes do `gancho.mjs` (eventos do spec)
`cutaway` (vídeo/imagem tela cheia + Ken Burns) · `photoCard` (foto pequena em card sobre ela mesma desfocada + rótulo) · `playerCard` (nº/idade + nome, inferior esquerdo) · `counter` (0→n com ticks) · `tweet` (card branco estilo X, perfil fake de torcedor) · `fixture` (sorteio AME vs ? sobre estádio, com shake) · `faceoff` (tela dividida AME | CRU, entra zoom-blur, sai abrindo portas) · `h2h` (card confronto) · `tvRetro` (CRT com imagem + ano gigante) · `scoreline` (placar com flip de números e tag) · `bigText` (texto gigante que atravessa o corte) · `zoomCapture` (print em mockup de navegador com zoom + marca-texto) · `stamp` (foto escurecida + escudo + carimbo que cai) · `bracket` (6 jogos: quartas/semi/final) · `subscribe` (like/inscrever/sino no tempo das palavras) · `lowerThird`.
Câmera (`camera` no spec): push lento 1,00→1,03 em todo trecho de rosto, punch-in nas palavras de ênfase. **Tela dividida** (`splits` no spec): o vídeo recua para um painel 960×540 com cantos arredondados de um lado, fundo marinho com listras e marca d'água, e o gráfico com `pos: "left"|"right"` ocupa a coluna de 720 px do outro lado (tweet, h2h, placar, inscreva-se). Nunca colocar gráfico em cima do rosto. Áudio: voz original intocada + SFX de biblioteca num bus −5 dB com limiter; limiter final em −1 dB só para sobras.
Fluxo: transcrever (`studio/bin/transcribe.py <video> <pasta>`), ler as palavras com tempo, escrever o spec, provar, renderizar.

## Fluxo
1. Achar a subpasta do trabalho no Drive: `search_files` com `parentId = '1w2yRyZQsR0DYiUd_1qRMpKuHvp7jzpai' and title contains '<nome>'` (excludeContentSnippets). Listar com `parentId = '<id>'`.
2. Baixar para `work/eafc/<slug>/assets/` com `eafc/bin/dl.sh <id> <destino>` (vídeos grandes em background). Ler o roteiro que ele mandou.
3. Olhar os assets (folha de contato dos clipes a 2–10 fps; imagens em miniatura). Escolher só o que serve.
4. Escrever o spec em `eafc/specs/<nome>.json` e gerar com o script do tipo de pedido. Conferir a folha de prova (`--proof`) antes de renderizar.
5. Renderizar 1080p60, prévia 720p via SendUserFile, master em `entregas/eafc/<slug>/` (≤ 95 MB no git; maior → `grandes/` fora do git). Commit + push.

## Pastas
```
eafc/
  README.md            ← este arquivo
  assets/fonts/        Playfair Display (serifa de título), Bodoni Moda, Bebas Neue, Barlow Condensed, Oswald
  assets/fonts-marca/  Articulat CF (fonte do Leonel; fora do git — baixar da pasta "Tipografia" do Drive)
  assets/ep03/         imagens do episódio 3 (troféu, campeões, dicionário, cruzazuleando)
  assets/sfx/          riser, impactos graves, whoosh cinematográfico, glitch, sparkle (Pixabay, uso livre)
  assets/brand/        escudo do Club América
  assets/theo/         imagens do Théo (renders do jogo) usadas em vinhetas/cutaways
  assets/vendor/       gsap
  engine/              geradores de composição HyperFrames (vinheta.mjs, gancho.mjs)
  bin/                 scripts de linha de comando (dl.sh, vinheta.mjs, gancho.mjs)
  specs/               specs dos trabalhos + historico.json (variação entre vídeos)
docs/motion/estilo-eafc.md   guia de estilo (identidade, vinheta, gramática de edição, áudio)
work/eafc/<slug>/            temporários (fora do git)
entregas/eafc/<slug>/        finais (git)
```
