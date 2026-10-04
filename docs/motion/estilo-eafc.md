# Estilo EA FC — guia do canal Théo Torres (Modo Carreira)

Base: dois vídeos de referência enviados pelo Leonel em `Assets para os videos/` (Drive "EA FC"):
- **`estilo visual.mp4`** (80 s, 1080p60; vídeo "Figlio di Roma", Modo Carreira com Totti) → **direção de arte**: abertura, tipografia, cor, texturas, cutaways.
- **`Estilo de edição.mp4`** (16 min, 1080p60; carreira com Man United, criador inglês) → **gramática de edição** de vídeo longo: PiP, cards, cutaways, transições, ritmo.
Análise: folhas de contato (`work/eafc/ref/frames/`), detecção de cortes e análise de áudio (`work/eafc/ref/analise/`). Propagandas e player do YouTube foram ignorados.

Nada deste guia se aplica ao Studio Responsivo. É outro canal, outra linguagem.

---

## 1. Identidade visual

**Conceito**: documentário de cinema esportivo. Dramático, escuro, serifado, com textura. Pensar "trailer de série de futebol", não "vídeo de gamer".

### Paleta
| Papel | Hex | Uso |
|---|---|---|
| Amarelo América | `#F9D616` | acento único: barras, regras, itálico do nome, raios de luz, fenda de luz |
| Azul-marinho América | `#0A1F44` | sombras do grade, fundo do título, duotone |
| Tinta (preto azulado) | `#06101F` | preto de verdade (nunca `#000` puro em fundo de cena) |
| Creme | `#F4EFE2` | branco quente para texto grande |
| Cromado/champanhe | gradiente `#fff → #fbf7e8 → #cdb46a → #fff` | título principal (efeito metal da referência "Totti") |

Regra: **um acento por cena** (amarelo). Vermelho/rosa só se vier do jogo (uniforme adversário).

### Tipografia (fontes em `eafc/assets/fonts/`)
| Papel | Fonte | Specs |
|---|---|---|
| Título / nome / palavra cinética | **Playfair Display 900** (serifa Didone, alto contraste, como "Figlio"/"Totti"/"VOCÊS" da referência) | caixa alta, 240–300 px no título, 500–640 px em carimbo numérico; tracking +.015em; cromado ou creme |
| Contraponto do título | **Playfair Display 400 itálico** | "Théo", "di Roma": 110–130 px, amarelo |
| Rótulos, kickers, sub | **Barlow Condensed 600/700** (sans condensada, como "MODO CARREIRA TREINADOR") | caixa alta, 26–44 px, tracking .3–.42em, branco 70–100 % |
| Números de HUD, placares, OVR | **Bebas Neue** / **Oswald 700** | caixa alta, tabular; cards de jogo (estilo de edição) |
| Alternativa Didone mais pesada | **Bodoni Moda 900** | quando Playfair ficar leve demais em tamanhos grandes |

Nunca: Plus Jakarta, Articulat (isso é Studio Responsivo), fontes "gamer" (Orbitron etc.), Impact com contorno.

### Texturas e tratamento
- **Grão** fino em tudo (SVG `feTurbulence`, overlay, opacidade .18–.22, salta 12×/s). Dá "filme".
- **Duotone**: imagem em P&B → multiply amarelo-ouro (.6) → lighten azul-marinho. Sombras viram marinho, luzes viram ouro. Para fotos/renders de cutaway e fundo de título.
- **Grade de gameplay**: lighten marinho (.55) + multiply preto (.18): sombras azuladas, uniforme amarelo intacto. Nunca duotone completo em gameplay (perde o jogo).
- **Vinheta** radial forte (bordas a 55–78 % de preto azulado).
- **Raios de luz** (`repeating-conic-gradient` amarelo, screen, máscara radial) girando ±3° lentamente.
- **Vazamento de luz** quente (radial amarelo/laranja, screen) em cantos durante celebrações.
- **Borda áspera** em carimbos (`feDisplacementMap` com turbulência): número/palavra parece impresso.
- **Pena/splash** (referência): respingo vermelho/preto atrás de títulos. Nossa versão: raios + grão + vinheta; splash só se o Leonel mandar o PNG.

---

## 2. Vinheta / abertura — anatomia (7 s, 1080p60)

Implementada em `eafc/engine/vinheta.mjs` (spec `eafc/specs/vinheta-theo-torres.json`). Decisão do Leonel (v2): **motion design puro** — escudo do América, o Théo em recortes (sem fundo) e só o nome "Théo". Sem gameplay, sem áudio da gravação dele. Fundos alternam marinho → amarelo → marinho → amarelo → marinho (ritmo por inversão de cor).

| t (s) | Beat | Visual | Áudio |
|---|---|---|---|
| 0,00–0,75 | **Ponto → barra → amarelo** | ponto amarelo (back.out) vira pílula de 1920 px (scaleX, power4.inOut) e a pílula se expande na vertical (scaleY, power3.in) até tomar a tela | whoosh cinematográfico (pico na expansão); drone começa |
| 0,77–1,10 | **Anel se desenha** | anel marinho (SVG, stroke-dashoffset) fecha em 0,42 s | — |
| 1,10 | **Escudo entra** | placa marinha (back.out) + escudo (scale .35→1, rotação −28→0, back.out) + burst branco; anel explode (scale 2,3, some) | impacto grave + sub-boom |
| 1,85–2,25 | **Painel diagonal** (−14°) marinho com faixa amarela 3 frames atrás | escudo encolhe a 0 enquanto o painel passa | whoosh curto |
| 2,05–2,95 | **Théo de corpo inteiro** | círculo amarelo (back.out) + silhueta chapada (tinta) chegando 3 frames antes do recorte colorido (parallax); 3 barras amarelas à esquerda, deslizam com stagger de 4 frames; drift lento do grupo | impacto leve |
| 2,93–3,31 | **Íris** | círculo amarelo cresce do peito do Théo (clip-path circle) e revela a cena amarela | whoosh curto |
| 3,00–4,15 | **Rosto em duotone** | disco marinho com o rosto (P&B → multiply ouro → lighten marinho), fade no ombro; anel tracejado grosso gira +110°, anel pontilhado fino gira −90°; 3 barras marinhas à direita; escudo pequeno (back.out) | sparkle discreto |
| 4,15–4,41 | **Persianas** | duas metades marinhas fecham (power4.inOut) | whoosh curto |
| 4,40 | **Lockup** | escudo (scale 1,5→1, rotação −14→0, power4.out) + burst amarelo (screen) + anel que expande; raios amarelos atrás (0→.5) | impacto grave + sub-boom (o maior); riser termina aqui |
| 4,56–5,30 | **"Théo"** | Playfair 700 itálico 320 px, gradiente creme→amarelo, desliza de trás do escudo (máscara); régua amarela desenha (power3.inOut); 10 pontos orbitam o escudo | — |
| 5,35–6,05 | **Brilho** varre o nome (banda branca, screen) | zoom lento 1,00→1,035; escudo gira +3° | sparkle |
| 6,40–6,75 | **Saída** | painel amarelo diagonal, painel preto 4 frames atrás → preto | whoosh + impacto curto |

Mix: integrado ≈ −13 LUFS, pico −1 dBFS. Camadas: drone sintetizado (55 + 82 Hz + ruído marrom filtrado), riser (3,6 s antes do lockup), impactos, sub-boom, whooshes, sparkle. Tudo de biblioteca livre ou sintetizado — nunca áudio da gravação do Leonel.

**Regras que a vinheta fixa para o canal**: cada mudança de cena inverte o fundo (marinho ↔ amarelo); todo elemento entra com overshoot (`back.out`) ou `power4.out`; transições só por painel diagonal (−14°), íris ou persiana; silhueta chapada atrás do recorte; um único texto.

**Variações para as próximas** (`eafc/specs/historico.json`): abrir pelo rosto e terminar no corpo inteiro; painéis a +14°; íris saindo do escudo; versão curta de 4 s para capítulos (só persiana → lockup → saída).

## 3. Gramática de edição em vídeo longo (`Estilo de edição.mp4`)

Serve para "gancho inicial" e "edição inteira". O Leonel entrega o vídeo cortado; esta é a **camada visual**.

### 3.1 Rosto em PiP sobre gameplay
- Posição padrão **canto superior direito**, retângulo de cantos arredondados (~16 px), ~ 300×170 px (16:9) com sombra suave; sem borda grossa.
- Desce para o **canto inferior direito** quando o menu do jogo usa o topo (tabela, calendário, negociação).
- Rosto em tela cheia só em reações fortes ("Bro's in love" — rosto + legenda estilizada), 2–4 s.
- Na gravação do Leonel o PiP já vem queimado no OBS (ver gols). Em edições nossas: se o bruto tiver o PiP, recortar (crop `1640×922 @ 0,158`) e recolocar o rosto com o nosso frame; se vier separado, melhor ainda.

### 3.2 Catálogo de overlays (o que existe na referência e vamos construir)
| Componente | O que é | Specs de partida |
|---|---|---|
| **Tabela de classificação** `TEAM / PTS` | card roxo/escuro, 2–3 linhas com escudo, sigla e pontos; entra com slide + fade | fundo `#0A1F44` 92 %, cantos 18 px, Bebas 52 px, escudo 56 px; 3–4 s |
| **Card de jogador** `OVR · POS · IDADE · NOME` | canto inferior esquerdo, foto/escudo, OVR grande | Bebas 64 px p/ OVR, Barlow 28 px p/ meta; 3 s |
| **Placar / HEAD TO HEAD** | dois escudos + números, fundo escuro, borda fina | centro-inferior; 2–3 s |
| **Confronto** `MUN × BOU` | tela cheia dividida nas cores dos clubes, siglas gigantes | Playfair 900 ou Bebas 300 px; 1–1,5 s; entra com whip |
| **Carimbo de headline** `114 CHARGES` | palavra gigante em caixa alta, vermelho "carimbo", sobre foto/escudo | Bebas/Oswald 220 px, leve rotação −3°, borda áspera; 1,5 s |
| **FULL TIME / GOL** | texto 3D branco com extrusão sobre gameplay | Bebas 180 px + sombra longa; 1 s |
| **Stats W-D-L / GOALS·GAMES** | números grandes + rótulo; fundo nas cores do clube | Bebas 120 px; 3 s |
| **Tweet / post** | card branco com avatar, nome, texto; entra de baixo com escala | 900 px largura, cantos 24 px; 4–6 s |
| **Jornal / manchete** | foto da capa com leve Ken Burns e vinheta | 3–4 s |
| **Laptop / TV retrô** | mockup com conteúdo dentro (lista, ano "2013" em chunky) | só com asset do Leonel |
| **Calendário / DEADLINE DAY** | tela do jogo com zoom + destaque | reaproveitar tela gravada |
| **Palavras cinéticas** (ref. visual) | 1 palavra por vez, serifa, sobre foto duotone + raios; cromado em 1 de cada 4 | Playfair 900 160–220 px; 0,4–0,7 s por palavra |
| **Card de foto "polaroid"** (ref. visual) | foto em moldura branca sobre fundo branco, leve rotação; sequência rápida de 3–8 fotos a 0,25 s | 2 s total |
| **Inscreva-se** | lower-third pequeno com avatar, @ e botão | 4 s, uma vez por vídeo |

### 3.3 Cutaways
- **Fotos de arquivo** em rajada: 6–8 fotos a 0,25 s cada, com pequeno zoom e grão. (ref. visual 46–48 s)
- **Telas do jogo** (tabela, calendário, negociação): zoom 1,15× no trecho relevante + PiP realocado.
- **Gameplay como B-roll**: gol/jogada com speed ramp (1× → 0,4× no toque → 1×) e grade.
- Cutaway nunca fica > 6 s sem voltar ao rosto/gameplay principal.

### 3.4 Transições (frequência medida na referência de edição; use a mesma proporção)
| Tipo | Quando | Specs |
|---|---|---|
| **Corte seco** | padrão (≈ 85 % dos cortes) | 0 frames |
| **Whip + motion blur** | entre dois gráficos/telas; 1 a cada 30–60 s | 10–14 frames, blur 24–34 px |
| **Flash preto** (1–2 frames) | antes de carimbo/headline | — |
| **Flash branco** | antes de gameplay forte | 2 frames a .9 → 0 em 8 frames |
| **Glitch RGB** | 1–2 por vídeo, em viradas de assunto | 4–6 frames |
| **Zoom-blur / rack focus** | tela → rosto | 4–6 frames |
| **Estática VHS** (ref. visual) | 1 por vídeo, antes de "modo jogo" | 6–8 frames |

### 3.5 Ritmo (medido)
- Gameplay: planos de 4–10 s; algo novo na tela (card, placar, PiP) a cada ~6–8 s.
- Menus do jogo: 2–5 s por tela, sempre com zoom ou destaque (nunca tela parada).
- Rosto: inserts a cada 3–5 s no gancho; no corpo pode segurar mais.
- Gancho (0–25 s): densidade máxima — card/headline/cutaway a cada 1,5–3 s, speed ramp, 1 carimbo.

---

## 4. Áudio
- **Vinheta**: música/drone + impactos + torcida. Mix alto (−12 LUFS) porque é o momento "cinema".
- **Vídeo longo**: a fala do Leonel já vem tratada no Premiere — não mexer. Nossa camada só adiciona: whoosh em whip/card (≤ 1 a cada 8 s), impacto grave em carimbo/headline (≤ 3 por vídeo), glitch no glitch. Volume dos SFX −14 a −18 dB abaixo da voz.
- **Hush**: silêncio de SFX durante punchlines e reações.
- Biblioteca: `eafc/assets/sfx/` (riser 10 s, impact-bass-1/2, whoosh, whoosh-cinematic, glitch-1/2/3, sparkle; Pixabay, uso comercial livre).

---

## 5. Componentes do motor
1. `vinheta.mjs` ✅ motion design (ponto → barra → escudo → painel → Théo → íris → rosto → lockup).
2. `gancho.mjs` ✅ camada visual sobre o vídeo cortado, eventos ancorados nas palavras: cutaway, photoCard, playerCard, counter, tweet, fixture, faceoff, h2h, tvRetro, scoreline, bigText, zoomCapture, stamp, bracket, subscribe, lowerThird + câmera (push lento + punch-in). Primeiro uso: `eafc/specs/gancho-ep03.json`.
3. A construir: PiP do rosto com regras S2G (394×370 topo-direito em gameplay, 580×326 sangrando nos menus, some em cutscene), tabela TEAM/PTS com badges, card de confronto full-screen por partida, memes com legenda arredondada. Tudo entra como novos `type` no `gancho.mjs`.
4. Regras de SFX já no motor: voz intocada; bus de SFX −5 dB + limiter; nenhum SFX acima da voz; ~1 whoosh a cada 3–4 s, impacto só em carimbo/faceoff/título.

## 6. Anti-padrões (o que faz parecer amador)
- Rosto gigante com borda colorida e sombra dura; PiP mudando de tamanho a cada corte.
- Mais de um acento de cor; gradientes arco-íris; neon.
- Texto sem hierarquia (tudo Bebas gigante) ou com contorno grosso estilo "cortes de podcast".
- Transição de template (cubo, luz vazando toda hora, zoom com estrela), SFX em todo corte.
- Gameplay crua sem grade, sem vinheta, com HUD e PiP do OBS aparecendo em cutaway.
- Tela de menu parada por 5 s sem zoom nem destaque.
- Repetir a mesma vinheta/gancho em todos os vídeos (ver `historico.json`).

## 7. Checklist de entrega
- [ ] 1920×1080, 60 fps, CRF ≤ 14, áudio AAC 320 k; master em `entregas/eafc/<slug>/`.
- [ ] Nenhum PiP/HUD do OBS visível em cutaway.
- [ ] Um acento de cor; grão e vinheta presentes; tipografia do guia.
- [ ] SFX dentro do limite; pico ≤ −1 dBFS.
- [ ] Vinheta/gancho diferente do anterior (`eafc/specs/historico.json`).
