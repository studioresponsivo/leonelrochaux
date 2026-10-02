# Receita — Reels/Shorts a partir de vídeo longo (talking head + tela)

Origem: corte "80/20 das IAs" (out/2026). Projeto: `videos/reels-80-20-ias/`.

## Pipeline
1. Baixar o vídeo (Drive: `drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t`).
2. Extrair áudio 16 kHz mono e transcrever com Parakeet (`hyperframes transcribe --engine parakeet --language pt`). ~40s para 8 min.
3. Ler a transcrição inteira e escolher o arco: **gancho → prova (tela) → virada → analogia → CTA**.
4. Cortes palavra a palavra (`data/cuts.json`), tirando muletas ("Isso é maravilhoso", "Verdade" etc.).
5. Cortar segmento por segmento com ffmpeg (`-ss` antes do `-i`; filtro único estoura memória em vídeo de 2,6 GB).
6. Áudio: fades de 12–15 ms por corte, highpass 70 Hz, compressor 3:1, **loudnorm −14 LUFS**.
7. Rastrear o rosto (OpenCV Haar, a cada 0,5 s), mediana móvel + zona morta de 40 px → câmera 9:16 suave.
8. Montar no HyperFrames (`build.mjs` gera o `index.html`), checar, snapshots, render.

## Linguagem visual (ref. uxpeak + IDV Studio Responsivo/Conversão Visual)
- **Trechos de rosto:** vídeo full-bleed, legenda branca palavra por palavra, punch-ins de no máx. 1,06–1,09 (mais que isso estoura o rosto).
- **Trechos de tela:** fundo claro (#fafafa → #efefef) com brilho verde suave; UI em card **inclinado em 3D** (rotY −9°→0°) com sombra longa e macia; câmera ao vivo em card com moldura branca de 7 px.
- **Pílulas brancas** com sombra macia para chips/listas; destaque com anel verde.
- **Legenda:** Jakarta 800 76 px; palavras-chave em verde; números com % em pílula verde; vira escura sobre fundo claro.
- **Anotações de revisão** (círculo vermelho desenhado + etiqueta) → cursor corrige → check verde. Ótimo para "o que a IA erra".
- **Barra 80/20** como motivo recorrente (gancho → tela → fechamento em 100%).
- **CTA:** fundo claro, kicker em caixa alta espaçada, capa do vídeo com moldura branca e tilt 3D, pílula escura "Link na bio".

## SFX (biblioteca embutida) — latência até soar
chime 0,42 s · ping 0,31 s · demais < 0,1 s. Iniciar o som **antes** do evento nessa medida.
Volumes 0,22–0,45 sob a voz em −14 LUFS.

## Pendências de marca
- Fonte oficial **Articulat CF** (licenciada) — enviar .woff2 para substituir a Plus Jakarta Sans.
- Escala neutral oficial de 10 stops e logos em SVG.
