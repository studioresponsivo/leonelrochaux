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
  "screens": { "claude": { "crop": [440,100,1700,720], "cam": [1490,740,430,340], "bubble": 330 } },  // trecho de tela → UI em card 3D + câmera em círculo (bubble = diâmetro)
  // corte com layout tela + rosto (câmera num painel): "box": [x1, x2] limita o recorte vertical ao painel; "faceX" fixa o centro do rosto; "outMax": s = teto do fim do corte
  "opening": { "style": "screen-first", "face": "Não, não foi", "shots": [ { "src": 22.3, "crop": [740,0,1348,1080], "label": "PH Academy · no ar" } ] },
  "beats": [ /* cenas e modificadores, ver tabelas */ ],
  "cta": { "kicker": "Vídeo completo", "title": "O processo completo está no meu canal", "hl": ["canal"], "image": "capa.jpg", "pill": "Link na bio", "seconds": 5 },
  "music": { "file": "trilha.mp3", "volume": 0.08 },   // opcional
  "sfx": "normal",                   // normal | low | off  (ou "sfxMax": n por 10 s)
  "tight": true                      // corta o fim de cada corte no fim real da fala (o Parakeet cola o silêncio na última palavra)
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
| `prompt` | `lines:["…" ou {text,at}]`, `status:{text,tone:good/bad,at}`, `title`, `model`, `bg` dark/light, `mono` (JSON/código), `cps` | cut → blur | card de prompt (réplica de UI) sendo digitado com cursor; cada linha começa no seu `at` (fala); `@menção` vira chip verde (`_` = espaço), `Rótulo:` no início da linha fica em negrito; status ✗/✓ acende a borda |
| `compare` | `a`/`b`: `{src, crop, still, label}`, `sign` (`≠` `=` `+` `→`), `tone` (auto: ≠ ruim, = bom), `bAt`, `signAt`, `note`, `layout` row/col, `bg` | zoom → blur | duas imagens com sinal no meio: referência ≠ resultado, foto de corpo + foto de rosto, antes → depois. Recortes em pé ficam lado a lado; deitados, empilhados |

**Mídia congelada**: qualquer mídia de cena (`cutaway`, `stack`, `device`, `compare`) aceita `"still": true` → usa 1 quadro (PNG) do instante `src` (bom para telas que o Leonel está arrastando).
**`number`/`number-hook`**: `countAt` (âncora) faz a contagem terminar na palavra falada (ex.: `"countAt": "mil reais"`).

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
