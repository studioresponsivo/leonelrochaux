# Roteiro de carrossel (`instagram/carrosseis/<slug>.json`)

Saída: `work/ig/<slug>/01.jpg…` (1080×1350, 4:5, JPEG), `prova.jpg` (folha de prova) e `legenda.txt`.
Render: `node instagram/carrossel/render.mjs instagram/carrosseis/<slug>.json` (~3 s). Publicar: `node instagram/ig.mjs postar work/ig/<slug>`.

```json
{
  "handle": "@leonelrochaux",
  "fundo": "light",
  "legenda": "texto do post… Comenta QUERO …",
  "slides": [ { "tipo": "capa", … }, … ]
}
```

- 2 a 10 slides. `*palavra*` = destaque verde. `\n` = quebra de linha.
- `fundo` por slide: `light` | `dark` | `green`. Padrão: capa `dark`, CTA `green`, resto `fundo` do roteiro (`light`).
- Texto grande demais encolhe sozinho até um mínimo; se ainda não couber, o render avisa ⚠.

| tipo | campos |
|---|---|
| `capa` | `kicker` (pílula pequena), `titulo`, `subtitulo` |
| `texto` | `titulo`, `texto`, `numero` (opcional; padrão 01, 02… só entre os slides `texto`) |
| `lista` | `titulo`, `itens` [3–5 curtos] |
| `numero` | `valor` ("3×", "47%"), `titulo`, `texto` |
| `frase` | `frase`, `autor` |
| `imagem` | `titulo`, `imagem` (caminho relativo ao JSON, ex. print de tela salvo em `work/`), `legenda` |
| `comparacao` | `titulo`, `ruim` {`rotulo`, `itens`}, `bom` {`rotulo`, `itens`} |
| `cta` | `titulo`, `palavra` (a palavra-chave), `texto` (padrão "que eu te mando no direct.") |

## Regras de conteúdo (as mesmas do estilo v2)
- Capa = gancho de 1 ideia, ≤ 8 palavras no título. Slide 2 já entrega valor (não "vem comigo").
- 1 ideia por slide, título ≤ 70 caracteres, corpo ≤ 2 linhas de leitura rápida.
- Sem emoji nos slides (o render avisa). Variar fundo e tipo entre carrosseis seguidos.
- Último slide = `cta` com uma palavra que EXISTE em `instagram/bot/palavras.json` (o render avisa se não existir) e a legenda repete a mesma palavra.
