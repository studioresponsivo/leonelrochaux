# Canal EA FC — Théo Torres (Modo Carreira)

Canal separado do Studio Responsivo. **Nada aqui usa o estilo v2 nem o motor `studio/`.** Tudo que é do canal de EA FC vive em `eafc/` (motor, assets, specs, histórico), `work/eafc/` (temporários) e `entregas/eafc/` (arquivos finais).

## Fatos fixos
- Entrega sempre **1920×1080, 60 fps**, para YouTube (vídeo longo). Prévia 720p só para o chat.
- Jogador criado: **Théo Torres**, nº 14, Club América (amarelo `#F9D616` + azul-marinho `#0A1F44`), Estádio Azteca.
- Drive (conta hello@): pasta **"EA FC"** `1w2yRyZQsR0DYiUd_1qRMpKuHvp7jzpai`
  - `Assets para os videos/` → referências de estilo (`estilo visual.mp4`, `Estilo de edição.mp4`). São vídeos de outros criadores: só referência.
  - uma subpasta por trabalho (ex. `Vinheta Theo Torres/`) com clipes, imagens e o roteiro usado na gravação.
- O Leonel entrega o vídeo **já cortado e com áudio ajustado** no Premiere. Nunca cortar, nunca mexer no áudio da fala. O trabalho é a camada visual: vinheta, ganchos, cards, cutaways, transições.
- Guia de estilo (ler antes de qualquer vídeo): `docs/motion/estilo-eafc.md`.

## Tipos de pedido
| Pedido | O que fazer |
|---|---|
| **Vinheta / intro** | `node eafc/bin/vinheta.mjs <slug> [spec.json]` → `entregas/eafc/<slug>/` (ver `eafc/specs/vinheta-theo-torres.json`). |
| **Gancho inicial** | abertura cinematográfica de 5–15 s sobre o começo do vídeo cortado (mesma linguagem da vinheta: duotone, serifa, carimbo, glitch). |
| **Edição inteira** | camada visual sobre o vídeo do Premiere: PiP do rosto quando houver gameplay, cards de jogo (placar, OVR, tabela), cutaways das imagens que ele mandar, transições. |

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
  assets/sfx/          riser, impactos graves, whoosh cinematográfico, glitch, sparkle (Pixabay, uso livre)
  assets/brand/        escudo do Club América
  assets/theo/         imagens do Théo (renders do jogo) usadas em vinhetas/cutaways
  assets/vendor/       gsap
  engine/              geradores de composição HyperFrames (vinheta.mjs, …)
  bin/                 scripts de linha de comando (dl.sh, vinheta.mjs)
  specs/               specs dos trabalhos + historico.json (variação entre vídeos)
docs/motion/estilo-eafc.md   guia de estilo (identidade, vinheta, gramática de edição, áudio)
work/eafc/<slug>/            temporários (fora do git)
entregas/eafc/<slug>/        finais (git)
```
