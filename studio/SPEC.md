# Roteiro (spec) v2 — referência

Um vídeo = um JSON em `work/<slug>/<nome>.json`. Exemplos validados: `studio/specs/pagina-24h-v2.json` (Reels), `studio/specs/yt-teste-v2.json` (YouTube longo), `studio/specs/case-portfolio-v2.json` (portfólio).
Guia visual completo: `docs/motion/estilo-v2.md` (só ler se precisar de efeito novo).
**Âncoras**: `at`/`to`/`until` aceitam um trecho do texto da transcrição (o motor acha a palavra exata) ou um número (segundos do vídeo original; no portfólio sem voz = segundos da timeline). `near` = segundos aproximados para desambiguar cortes.
Roteiros antigos (com beat `"hook"`) continuam rodando no motor v1 (`"engine":"v1"` força).

```jsonc
{
  "name": "reels-tema",              // arquivo final em entregas/<slug>/
  "format": "vertical",              // vertical 1080x1920 | horizontal 1920x1080 | portfolio (16:9; "aspect":"vertical" p/ 9:16)
  "captions": "phrase",              // phrase (padrão vertical) | word | none (padrão horizontal/portfólio)
  "fixes": { "glife": "briefing" },  // correções da transcrição (só na legenda)
  "keywords": ["ia", "figma"],       // palavras em verde na legenda
  "marks": ["engolir"],              // palavra com marca-texto verde (1–2 por vídeo)
  "hush": ["frase-chave"],           // trechos sem SFX (deixa a frase respirar)
  "cuts": [ { "near": 0, "from": "Eu vou te mostrar", "to": "nada genérico" },
            { "near": 300, "from": "Falei pra vocês", "to": "a estrela", "screen": "claude" } ],
  // YouTube já cortado no Premiere: "cuts": "all" (+ "screenRanges" opcional, igual ao v1)
  "screens": { "claude": { "crop": [440,100,1700,720], "cam": [1490,740,430,340] } },  // trecho de tela → UI em card 3D + câmera em círculo
  "opening": { "style": "screen-first", "face": "Não, não foi", "shots": [ { "src": 22.3, "crop": [740,0,1348,1080], "label": "PH Academy · no ar" } ] },
  "beats": [ /* cenas e modificadores, ver tabelas */ ],
  "cta": { "kicker": "Vídeo completo", "title": "O processo completo está no meu canal", "hl": ["canal"], "image": "capa.jpg", "pill": "Link na bio", "seconds": 5 },
  "music": { "file": "trilha.mp3", "volume": 0.08 },   // opcional
  "sfx": "normal"                    // normal | low | off  (ou "sfxMax": n por 10 s)
}
```

## Aberturas (`opening.style`) — obrigatória em Reels; o rosto é a recompensa
`face` = âncora do corte para o rosto (padrão: 1ª frase entre 1,8 e 4,2 s). O rosto entra fechado (take A) e abre na frase seguinte (take B); `"take": false` desliga.

| style | campos | o que faz |
|---|---|---|
| `screen-first` | `src`+`crop` ou `shots:[{src,crop,label}]`, `label`, `between` (transição entre shots, padrão whip) | B-roll/tela em tela cheia com a voz por baixo → blur-cut (T9) para o rosto |
| `type-hook` | `text`, `hl`, `bg` (light/dark/green), `sub` | frase palavra a palavra sincronizada com a fala → corte seco |
| `ticker-hook` | `text`, `hl` | fundo verde, frase correndo com motion blur → blur-cut |
| `number-hook` | `value`, `from`, `prefix`, `suffix`, `label` | número contando com glow em fundo escuro → corte |
| `search-hook` | `query`, `src`+`crop` (opcional) | busca com bloom → pergunta digitada → zoom-through no trecho → blur-cut |
| `result-first` | `src`, `crop`, `labels`, `kind` (browser/phone) | resultado em device 3D subindo (T7) → corte |
| `face-to-face-cut` | `src`, `insertAt`, `dur` | rosto take A → take B → insert de tela (whip) |
| `problem-flood` | `src`, `crop`, `label`, `color` | jeito errado dessaturado + inundação vermelha (T11) → rosto |
| `selection-hook` | `text`, `word` | frase com a palavra selecionada estilo iOS + punch-in |

## Cenas (beats que cobrem a tela com a voz por baixo — J/L-cut)
Todas: `at` (início), fim por `to` (texto falado) / `until` (âncora) / `dur` (s); `in`/`out` trocam a transição padrão.
Texto de `bridge`/`ticker`/`select`/`icons` que bate com a fala é sincronizado palavra a palavra; legenda some nessas cenas.

| do | campos | padrão in → out | uso |
|---|---|---|---|
| `cutaway` | `src` (s do original ou arquivo), `crop` [x1,y1,x2,y2], `frame` full/card, `fx` push/pan/zoom-through, `label`, `bg` | zoom → blur | B-roll de QUALQUER ponto do vídeo sobre a fala atual |
| `bridge` | `text`, `hl`, `bg` light/dark/green, `sub` | cut → cut | frase-ponte de capítulo (≤ 2 por vídeo curto) |
| `ticker` | `text`, `hl` | whip → blur | frase longa enfática correndo |
| `number` | `value`, `from`, `prefix`, `suffix`, `decimals`, `label` | cut → cut | número-prova com glow |
| `kpis` | `items:[{at,value,prefix,suffix,label}]` | push-up → blur | 2–3 métricas; a ativa nítida, as outras em blur |
| `search` | `query` | cut → zoom | pergunta digitada |
| `select` | `text`, `word` | cut → blur | tese do vídeo selecionada + punch-in |
| `device` | `src`, `crop`, `kind` browser/phone, `url`, `labels:[]`, `bg` | curtain → blur | resultado/site em device 3D com spot |
| `stack` | `cards:[{at,src,crop,label}]` | push-up → blur | prova empilhada (antes/depois, prints) |
| `swap` | `title`, `items:[{at,text,tone:good/bad}]` | push-up → blur | lista 2–4 itens trocando no card |
| `icons` | `before`, `after`, `icons:[figma,framer,ia,claude,code,web]` | whip-up → cut | frase com ícone de ferramenta trocando (slot) |

**Modificadores (sobre o rosto/tela)**: `punch` (`scale` 1.15–1.25, `to`/`dur`) = corte seco para enquadramento fechado (2ª câmera); `focus` (`x`,`y`,`z`,`dur`) = câmera dentro do bloco de tela.
Automático: push-in contínuo em todo plano; alternância de enquadramento a cada corte e no meio de planos > 6,5 s (`"autoFrame": false` desliga).

**Transições** — entrada: `none cut blur whip whip-left/right/up/down push-up curtain zoom whiteout`; saída: `none cut blur whip* spin shrink flood whiteout zoom`. Whip/push/curtain com motion blur direcional real (SVG). Cenas coladas (fim = início da próxima) viram transição direta entre elas.

## Regras (o make avisa com ⚠)
- **Variação**: o make grava `studio/specs/historico.json` e avisa se a abertura, os 3 primeiros padrões ou o fundo dominante repetem o vídeo anterior. Nunca a mesma abertura duas vezes seguidas.
- Nenhuma transição especial (whip, zoom, push-up…) mais de 3× por vídeo; 4–6 tipos de cena por vídeo curto; rosto nunca "pisca" (< 0,8 s) entre cenas.
- **SFX** automáticos com limitador: máx. 6 audíveis/10 s no vertical, 3/10 s no horizontal, 2 empilhados; legendas não têm som; `hush` silencia frases-chave.
- Reels/Shorts/TikTok: 45–75 s + CTA 5 s; uma batida a cada ~1–1,5 s; gancho ≤ 3–4 s antes do rosto. Arco: gancho → prova (tela) → virada → erro comum → direção → CTA.
- YouTube longo: `"format":"horizontal","cuts":"all"`, só camada visual (bridge/swap/kpis/select nos capítulos), legenda `none` ou `phrase`.
- Portfólio: sem rosto; cenas sem `at` encadeiam pela `dur`; `device`/`stack`/`kpis`/`bridge` + `number-hook`/`result-first`; música opcional.
- Qualidade: resolução/fps da fonte (máx. 60), trechos recortados em lanczos no tamanho final; `crf` (14) e `fps` podem ser forçados.
- Coordenadas: `crop` em pixels do vídeo original. Para tela cheia no vertical use recorte ~608×1080 (9:16); recorte 16:9 vira card. Pegar 1 frame só quando precisar (`ffmpeg -ss T -i source.mp4 -frames:v 1 x.png`).

---

# Estilo EA FC (canal 2) — `"style": "eafc"`

Motor `studio/engine/eafc/` (guia: `docs/motion/estilo-eafc.md`). Sempre `"format":"horizontal"`, `"cuts":"all"` (vídeo já cortado), 1920×1080 na fps da fonte (60). Imagens em `work/<slug>/img/` (escudos recortados `logo-<time>.png`, fotos `.jpg`). Exemplo validado: `studio/specs/gancho-ep06-eafc.json`.

```jsonc
{
  "name": "gancho-ep06", "style": "eafc", "format": "horizontal", "cuts": "all",
  "team": "leicester", "accent": "#FDBE11",          // time do canal (cores/escudo padrão) e cor de destaque
  "captions": "phrase",                               // phrase | none — legendas pequenas embaixo
  "fixes": { "Lester": "Leicester" }, "keywords": ["Arsenal"],
  "music": { "file": "trilha-tensao.wav", "at": "start", "volume": 0.16, "fade": 2.5 },  // gerar com studio/bin/trilha.py
  "sfxMax": 7, "hush": [], "limiter": true,                // limitador -1 dBTP na masterização (false desliga)
  "beats": [ /* cenas cheias, overlays e modificadores — tabelas abaixo */ ]
}
```
Âncoras iguais ao v2 (`at`/`to`/`until` = trecho da fala ou segundos; `dur`; `offset`). `punchGap` (padrão 2,4 s) controla a alternância automática 1,0 ↔ 1,14 do rosto; `"autoFrame": false` desliga.

**Cenas cheias** (cobrem o rosto; `in`: none cut flash glitch whip* zoom blur impact · `out`: none cut flash glitch whip* zoom blur)

| do | campos | padrão in → out | visual |
|---|---|---|---|
| `number` | `value`, `from`, `suffix`, `label`, `count` (s), `stamp` (linha pequena embaixo), `color`, `font` serif, `style` "led" | cut → cut | número gigante contando (ou painel LED âmbar) |
| `crest` | `teams:[1–2]`, `label`, `sub`, `labels` (duelo), `comp` (badge no meio), `vs` ("×"), `bg` (foto `img/…` desfocada), `size`, `layout: "bleed"` + `side` right/left (escudo gigante sangrando pela borda, label/sub empilhados do outro lado — use para não repetir o herói centralizado) | impact → blur | 1 escudo batendo na tela com glow / duelo com × |
| `split` | `teams:[2]`, `labels` (abreviações), `comp`, `sub` | whip → blur | metades na cor dos times (LEI \| ARS) |
| `photo` | `src`, `label`, `sub`, `stamp`, `fx` push/pan/out, `tone` red/blue/mono, `grain`, `color` | zoom → blur | foto tela cheia com Ken Burns e rótulo |
| `score` | `home`, `away`, `score` "1-0", `meta`, `flip:{at, score, tag, color}` | whip → blur | placar broadcast; `flip` rola os dígitos + carimbo "VIRADA" |
| `record` | `team`, `items:[{value,label}]`, `title`, `sub` | impact → glitch | ficha J-V-E-D com dígitos enormes |
| `ladder` | `team`, `rows:[{text,at,tag}]`, `fromRow`, `toRow`, `title` | cut → blur | escudo despencando divisão por divisão |
| `fixtures` | `title`, `comp`, `rows:[{tag,team,vs,text,sub,at}]`, `color` | whip → blur | card de jogos (ida/volta) linha a linha |
| `title` | `title`, `hl`, `sub`, `kicker`, `image`, `color` | flash → cut | cartela serifada sobre textura grunge |
| `montage` | `items:[{src,label,tone,at}]`, `step` (s) | flash → cut | 1 foto por `step`, flash + impacto a cada corte |

**Overlays** (sobre o rosto; podem coexistir)

| do | campos | visual |
|---|---|---|
| `word` | `text`, `font` serif/display/brand, `size`, `color` (#hex / accent / team), `chrome`/`gold`/`italic`, `pos` center/top/bottom/left/right/tl… ou composição livre `lines` ["A HISTÓRIA","VAI SE","REPETIR?"] + `align` left/right/center + `x`/`y` em px (o rosto escala ~1,14 no punch: margem ≥ 150 px e `y` ≥ 190 com letterbox), `offset` (s), `behind` (matte), `hl`, `glow`, `tail`, `silent` | palavras gigantes sincronizadas à fala; `behind:true` recorta o rosto (lento: ~1 min por 1,3 s) |
| `stamp` | `text`, `pos` tl/tr/bl/br/bottom; `style:"rubber"` + `color`, `rot`, `pos` bl/br/low | linha pequena (data/lugar) que desliza, ou carimbo de tinta rugosa |
| `tweet` | `name`, `handle`, `time`, `text`, `hl`, `theme` light/dark, `pos` bl/br/tl/tr/center, `avatar` (imagem) ou `initials`+`avatarColor(2)`, `replies`, `reposts`, `likes`, `likesAfter`, `views`, `verified` | card de X deslizando com motion blur; coração anima em `likeDelay` |
| `badge` | `team`, `pos` left/right/tl/tr, `size` | escudo pequeno pulando ao lado do rosto |

**Modificadores**: `punch` (`scale`, `to`/`dur`) · `shake` (`amp`, `dur`) · `lights` (apaga a luz do rosto até `to`) · `flash` (`color`, `dur`) · `sfx` (`name`, `vol`, `offset`) · `letterbox` (`until`/`dur`; barras 2.35:1 no rosto — nas cenas de arquivo photo/score/record/number/montage/title elas entram sozinhas, `"archive": false` desliga) · `freeze` (quadro parado do rosto com zoom + boom; `zoom`, `hold`) · `flashframe` (`src`, `frames`, `tone` mono/neg: imagem subliminar num hit) · `ambience` (`name` crowd, `vol`, `until`).
**Look "cinema" (v2)**: grão de filme animado em tudo (`"grain": false` desliga, `grainOpacity`), deriva de câmera na mão (`drift`), zoom-out ao voltar para o rosto, vinheta e grade; fotos em parallax (fundo desfocado + frente nítida, `fx` push/pan/out, `tone` mono/duo) com vazamento de luz, poeira e varredura; escudos com varredura especular mascarada pelo PNG, adesivo com traço branco (duelo/split/badge/fixtures), névoa + reflexo no herói; `number` com `"style": "led"` (painel de placar LED, dígitos em matriz de pontos); `score` dentro de TV de tubo (scanlines, flicker); `word` com `"chrome": true` (serifa cromada gelo) ou `"gold": true`, `"italic": true`; `stamp` pequeno desliza (sem cursor), rubber com tinta rugosa (`pos` bl/br/low); transições extras `cutflash` (preto → cor → branco em 6 quadros, `color`) e `ink` (revelação por tinta). Cenas aceitam `bg` (foto desfocada em duotone da cor da cena), `ambience` + `ambienceVol`.
SFX (`studio/assets/sfx-eafc/`): impact-bass-1/2, whoosh, whoosh-short, whoosh-cinematic, riser, glitch-1/2/3, notification, typing, pop, click, click-soft, key-press, ping, sparkle, error, chime; sintéticos: crowd (ambiente 20 s), sub-drop, tick, shutter, boom, shimmer.
