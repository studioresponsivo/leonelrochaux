# Roteiro (spec) — referência completa

Um vídeo = um JSON em `work/<slug>/<nome>.json`. Exemplo validado: `studio/specs/exemplo-80-20-reels.json`.
**Âncoras**: `from`/`to`/`at` aceitam um trecho do texto da transcrição (o motor acha o tempo exato da palavra) ou um número (segundos do vídeo original). `near` = segundos aproximados (da `transcript.txt`) para desambiguar.

```jsonc
{
  "name": "reels-tema",            // nome do arquivo final em entregas/<slug>/
  "format": "vertical",            // vertical (1080x1920) | horizontal (1920x1080)
  "captions": "full",              // full (padrão no vertical) | none (padrão no horizontal)
  "fixes": { "desconfio,": "desconfie," },   // correções da transcrição (só na legenda)
  "keywords": ["ia", "design"],    // palavras em verde na legenda (números com % viram pílula sozinhos)
  // VÍDEO JÁ CORTADO NO PREMIERE (YouTube longo): "cuts": "all" + trechos de tela opcionais:
  //   "cuts": "all", "screenRanges": [{ "screen": "dash", "near": 120, "from": "olha esse painel", "to": "ficou pronto" }]
  "cuts": [                        // em ordem de exibição; pode reordenar o vídeo original
    { "near": 0,   "from": "Se alguém te falar", "to": "pelo menos 80%" },
    { "near": 340, "from": "E veja, eu defini",  "to": "fazer na mão", "screen": "dash" }
  ],
  "screens": {                     // trechos de gravação de tela → cena clara com UI em 3D + câmera em card
    "dash": { "still": 348, "crop": [456,150,1700,740], "cam": [1490,740,430,340], "live": false }
  },                               // crop = área da tela [x1,y1,x2,y2]; cam = bolinha da câmera [x,y,w,h]; still = segundo do frame congelado
  "beats": [ /* efeitos, em ordem — ver tabela */ ],
  "cta": { "kicker": "VÍDEO COMPLETO", "title": "Assista agora no meu canal do YouTube", "image": "capa.webp", "pill": "Link na bio", "seconds": 5 }
}
```

## Beats (todos com `at`; opcional `offset` em segundos)
| do | campos | onde | o que faz (SFX já incluso) |
|---|---|---|---|
| `hook` | `text`, `hl:[palavras]`, `hold` (≈3 s), `cards:[{type:"clip",at,label} \| {type:"screen",id,label,zoom} \| {type:"image",src,label}]` | início (`"at":"start"`) | **gancho obrigatório**: copy animada desde o frame 1; com `cards` vira palco (rosto em card + até 3 cards 3D com trechos de outros momentos/print/imagem) e expande para tela cheia |
| `punch` | `scale` (1.05–1.09), `hold`, `sound:false` | rosto | zoom de ênfase |
| `wiggle` | — | rosto | tremidinha |
| `word` | `text`, `hold` | rosto | palavra gigante + sublinhado verde + impacto |
| `meter` | `value`, `a`, `b`, `flash`, `complete`, `total` | rosto ou tela | barra 80/20; `flash` pisca o lado B; `complete` preenche B; `total` = texto final |
| `chip` | `text` | rosto ou tela | pílula branca com check (empilha) |
| `badge` | `text` | rosto ou tela | selo verde abaixo dos chips |
| `sticker` | `text`, `hold` | rosto | adesivo escuro inclinado (ex.: "R$ R$ R$") |
| `list` | `title`, `until`, `icon:"none"`, `items:[{at,text,tone:good|bad|best}]` | rosto | tela dividida: rosto em card + lista entrando |
| `focus` | `x`,`y`,`z` (coords da tela original; `z:1` = geral), `dur`, `lead` | tela | câmera dentro da UI |
| `note` | `x`,`y`,`r`,`label` | tela | círculo vermelho de revisão + etiqueta |
| `fix` | — | tela | cursor visita as notas abertas e vira check verde |
| `glow` | — | tela | brilho verde + giro final do card |

## Regras de estilo (não quebrar)
- **Todo vídeo começa com `hook` em `"at":"start"`, com copy forte + 2–3 `cards`** (de preferência trechos de momentos fortes mais à frente: tela do produto, prova, resultado). Gancho só com rosto falando é proibido.
- Qualidade: o motor mantém resolução e fps da câmera (fps máx. 60) e não recomprime o render final. `crf` (padrão 14) e `fps` podem ser forçados no JSON. A prévia 720p é só para o chat.
- No máx. ~1 efeito a cada 2–3 s. Punch ≤ 1.09. Gancho nos 3 primeiros segundos.
- Reels/Shorts: 45–90 s de voz + CTA 5 s. Arco: gancho → prova (tela) → virada → analogia/lista → fecho.
- Coordenadas de tela: pegar 1 frame (`ffmpeg -ss T -i source.mp4 -frames:v 1 x.png`) só quando houver `note`/`focus` novos.
