# Estilo EA FC — bíblia de edição e assets do canal 2 (Théo / modo carreira)

Base medida em `work/refs-eafc/` (folhas de contato com tempo, tiras quadro a quadro, cortes, picos de movimento, onsets de áudio e espectrogramas):
- **Assets** → pacote de motion da Premier League: `pl-01` (scorebugs de gol, 5 clubes por tela, 30 fps) e `pl-02` (broadcast ARS×TOT 0–16 s + "Clubs Logo Animation" 16–89 s, 1080p60) + 6 prints do site premierleague.com.
- **Edição** → vídeo do S2G (modo carreira do Man United, 16 min, 1080p60, narração em inglês transcrita em `edicao/transcript.txt`).
- Os 12 clipes de WhatsApp na mesma pasta são as referências i.editverse do **estilo v2** (já descritas em `estilo-v2.md`). Valem aqui como **régua de qualidade de movimento**, não como visual.

Resumo em uma frase: **contar a história como o S2G (ritmo, câmera, prova na tela, música de tensão) usando gráficos no nível da Premier League (vetor chapado, cor de clube, tipografia pesada, muro tipográfico, escudo desconstruído) com a disciplina do v2 (1 objeto por vez, nada pula, nada "de template").**

---

## 1. O que torna a Premier League "insana" (e o que a gente copia)

1. **Cor de clube como material, não como detalhe.** O fundo inteiro vira a cor do clube (vermelho Arsenal, azul Brighton, claret Burnley). A identidade entra pela cor cheia antes de qualquer texto.
2. **Vetor chapado, sem luz.** Nenhuma sombra, gradiente ou 3D nos assets. Formas sólidas, contornos grossos, branco puro. O brilho vem do movimento, não do render.
3. **Escudo desconstruído.** O escudo nunca "aparece": seus elementos chegam um por um (cerejas caem, gaivota voa para dentro do círculo, galo gira, chamas tomam a tela e recuam revelando o diabo, raios de luz revelam a bola). Montagem = narrativa de 2–4 s.
4. **Muro tipográfico.** Nome do clube repetido em 6–8 linhas, caixa alta, pesado, cor de clube sobre branco (ou branco vazado sobre cor), linhas deslocadas e correndo em sentidos alternados. É o "palco" onde o escudo pousa.
5. **Scorebug vivo.** A barra de placar é um objeto com estados: neutro (roxo) → GOAL (varredura de cor + padrão do clube + escudo + dígito que gira) → neutro. Tudo em ~0,5 s de transformação e ~2,5 s de permanência.
6. **Tipografia geométrica pesada, caixa alta, tracking apertado.** Números tabulares. Nada de serifa, nada de itálico.
7. **Ritmo cel-animado**: entradas de 8–15 frames a 60 fps (0,13–0,25 s), `expo.out` com leve overshoot, **sem motion blur** nos assets (o blur fica para a câmera e para os cortes, como no v2).

## 2. O que torna o S2G "profissional" (e o que a gente copia)

Medido no gancho (0–60 s) e em 8 segmentos de 2 min:

| Métrica | Gancho | Corpo (mediana dos segmentos) |
|---|---|---|
| Cortes secos | 1 a cada ~2,5 s (51 em 60 s; o pico de 20 "cortes" em 2,5–3,1 s é a transição de fogo) | 1 a cada 3,6–10 s (holds longos em prints com setas/cards) |
| Batidas visuais | a cada **0,7 s** (8/10 s) | a cada 1,0–1,8 s (4,5–7,7/10 s) |
| Onsets de áudio | 17/10 s (música de tensão + SFX) | 17–19/10 s (a música nunca para) |
| Hold mais longo | 6 s (print da tabela com seta) | 11–23 s (gameplay com card fixo) |

Gramática observada (tempos do gancho):
- **0,0 s**: voz no frame zero sobre cutscene; nenhum logo, nenhuma vinheta. Corte a 1,2 s para outra cutscene. **Rosto só aparece a 5,2 s**, pequeno, no canto, sobre um print.
- **2,3–3,0 s**: transição de **fogo cartoon** (chamas laranja/amarelo sobem, 3 frames de tela cheia, recuam). Única transição "gráfica" grande em 60 s.
- **3,0–5,2 s**: gameplay + **lower-third vermelho full-width** "Man United on a Roll" (branco bold sobre vermelho, estilo Sky Sports), estático.
- **5,2–9,0 s**: print da tabela (UI roxa do EA FC) + **facecam no canto superior direito** (~18 % da largura, cantos arredondados) + **seta vermelha** que entra com pop (0,2 s) apontando a linha. Hold de 3,8 s: o tempo de ler.
- **9,0–12,5 s**: cutscene + **mini-tabela fixa** no canto inferior esquerdo ("TEAM/PTS · 1 MCI 29 · 2 MUN 27", card branco, cabeçalho roxo) que **sobrevive a 3 cortes**; a 11,5 s a linha do City acende em amarelo (highlight = "é dele que estamos falando").
- **12,7–15,5 s**: **manchete gigante** "114 CHARGES" (vermelho, extrudado, tremendo) sobre estádio + escudo do City grande no centro. 2,8 s.
- **15,5–18,3 s**: **recorte de jornal** ("CITY APPEAL — NO PUNISHMENT YET?") em 3D sobre mesa de madeira, câmera inclinada.
- **18,5 s**: **flash branco** (1 frame cheio + 3 de decaimento) → **TV retrô** com imagem de arquivo (troféu) e luz magenta, 2,5 s.
- **22–24 s**: footage de fumaça vermelha (ambiente), 24,5 s print da formação.
- **27–35 s**: cutscenes de contratação + **card de jogador OVR** no canto inferior esquerdo (foto, "87 OVR · CM · AGE 22 · PABLO GAVI", vermelho), **um card novo a cada nome falado**.
- **35,5–39,5 s**: fumaça + comemoração com a mini-tabela de volta (callback).
- **39,7–45 s**: tabela com badges verdes "10 WINS" e facecam no canto inferior.

Mapeamento som ↔ imagem (onsets fortes do gancho): clique seco a 1,06 s (corte) e 2,45 s (início do fogo); whoosh longo 3,8–4,5 s (lower-third); whoosh curto 6,0–8,1 s a cada pop de seta; clique 8,8 s (corte); ticks 9,8–10,4 s (mini-tabela montando); clique 12,65 s (manchete); whoosh 13,8 s; clique 15,36 s (jornal); whoosh 16,5 s (1 s, câmera no jornal); whoosh 18,1–18,7 s (flash + TV). Regra: **corte = clique/impacto no frame; overlay = whoosh 2–3 frames antes do pico; nada soa em legenda**.

O que **não** levar do S2G: assets de stock (fogo cartoon, madeira, TV com luz magenta) e a poluição de 3 elementos simultâneos. A **estrutura** fica; a **pele** vira Premier League.

## 3. Sistema visual (tokens)

Medido nos prints e nos vídeos; oficial da marca PL onde indicado.

| Token | Valor | Uso |
|---|---|---|
| `--pl-purple` | `#37003C` (oficial; medido `#38003c`) | fundo de capítulo, scorebug neutro, cabeçalho de tabela |
| `--pl-purple-2` | `#2d0033` → `#1a001f` (gradiente radial) | fundo "arquibancada" dos cards |
| `--pl-card` | `#3d0a47` a 60 % + borda `rgba(255,255,255,.06)` | linhas/cards sobre roxo |
| `--pl-pink` | `#E90052` (oficial) | acento de perigo/rival, badge L |
| `--pl-green` | `#00FF85` (oficial) | badge W, "subiu", gol a favor |
| `--pl-cyan` | `#04F5FF` (oficial; fundo da abertura do reel) | barra de posição CL, destaque de dado |
| `--pl-white` | `#FFFFFF` | texto primário, fundo dos blocos de escudo |
| `--pl-lilac` | `#c8b3d6` (medido) | texto secundário sobre roxo |
| `--pl-yellow` | `#F5D000` | linha em destaque na tabela ("é dele que falamos"), barra Europa |
| Clubes do Théo | América `#F8E808` / `#081838` / `#E82828` · Cruz Azul `#082858` / `#C80828` / `#FFFFFF` (medidos nos escudos) | cor cheia de capítulo, scorebug GOAL, muro tipográfico |
| Neutros do Leonel | `#0a0a0a`, `#171717`, `#fafafa` | rosto, legendas, HUD sobre o rosto |

- **Fundos de capítulo**: roxo PL (narrativa/dados), **cor cheia do clube** (identidade/virada), **branco** (muro tipográfico + escudo). Alternar entre vídeos como no v2 (`historico.json`).
- **Padrão gráfico**: diagonais de 68° em 2 tons da mesma cor (o "raio" dos cards do site: 6–10 % de contraste, 3 faixas largas); nos scorebugs, o padrão do clube é uma ilustração do símbolo (canhão, gaivota, listras) em 1 tom acima da cor base. Para América/Cruz Azul: águia estilizada / cruz em faixa.
- **Formas**: cantos 12–16 px em 1080p (cards), pílulas 999 px (Follow, posição), fotos de jogador em quadrado 10 px de raio com fundo de cor do clube.
- **Sombra/luz**: zero nos assets. Só o rosto e os prints reais têm sombra (como no v2).
- **Tipografia**: Articulat CF. Display (manchete, muro, placar) **Heavy 900 / ExtraBold 800**, caixa alta, tracking −3 %, line-height 0,86. Rótulos de UI **DemiBold 600** 26–30 px, tracking +4 %, caixa alta. Nomes **Bold 700** em sentence case (site PL: "Rúben" leve + "Dias" pesado = contraste de peso no nome). Números **tabulares** sempre. Tamanhos em 1080p: manchete 160–220 px, placar 96 px, muro 150 px por linha, legenda 44 px (600), mini-tabela 28/34 px.

## 4. Catálogo de assets (cenas) — spec replicável

Frames a 60 fps. Easing em GSAP. Tudo vetor chapado (HTML/CSS/SVG), sem blur nos assets.

### A1 `scorebug` — placar vivo (pl-01, pl-02a 8,4–9,4 s)
- Anatomia (1080p): barra 560×72 px, centro superior (y 60) ou inferior esquerdo; bloco esquerdo cor do mandante com sigla (3 letras, 800, 34 px), placar "0 – 0" branco 44 px tabular com o símbolo da liga entre os dígitos, bloco direito sigla do visitante; pílula do relógio 120×36 px abaixo, roxo.
- Entrada: barra cresce da esquerda (`scaleX 0 → 1`, origin left, 14 f `expo.out`) + siglas `y +20 → 0` 10 f.
- **GOAL** (0,5 s): (1) varredura — um gradiente da cor do clube (com 20 % de verde/ciano PL na borda de ataque) corre da esquerda para a direita cobrindo a barra em **18 f** `power3.inOut`; (2) o padrão do clube (ilustração) chega junto com a varredura, deslocado 40 px e assentando em 8 f; (3) o escudo entra por trás do dígito (scale 0,6 → 1, 10 f `back.out(1.6)`); (4) o **dígito gira no eixo Y** (`rotationY 0 → 90` 6 f `power2.in`, troca o texto, `90 → 0` 8 f `power2.out`); (5) a palavra GOAL ocupa o lugar da sigla do adversário (clip-path da esquerda, 10 f). Permanece 2,4–3,0 s; **volta** com a varredura inversa (18 f) e a barra fica neutra com o novo placar.
- SFX: tick no corte da varredura, impacto curto no dígito, nada no retorno.
- Variante Leonel: `"do":"scorebug"` com `home`, `away`, `score`, `goal:{at,side}`, `clock`; 5 scorebugs empilhados (pl-01) = `"stack":[...]` com stagger 0,12 s para "todos os jogos da rodada".

### A2 `wordwall` — muro tipográfico (pl-02b 25–30 s Arsenal, Brighton; pl-02c Man City, Southampton, Newcastle)
- 7 linhas do nome em caixa alta, 150 px, Heavy, cor do clube sobre branco (variante: branco vazado sobre cor do clube, ou contorno 3 px nas linhas pares — Spurs/Newcastle).
- Linhas deslocadas 0 / −0,25 / −0,5 em (ciclo) e **correndo** em sentidos alternados a 40–60 px/s (`none`); entrada: cada linha vem de fora (`x ±120 %`, stagger 0,04 s, 12 f `expo.out`).
- A palavra pode ser a tese do vídeo ("CRUZAZULEAR" × 7) — equivale ao `bridge`/`ticker` do v2 com corpo de clube. Permanência 2–4 s. SFX: 1 whoosh na chegada, só.
- Saída: inundação de cor do clube de baixo para cima (12 f) ou corte seco para o escudo.

### A3 `crest-build` — escudo desconstruído (pl-02b/c, 3–4 s por clube)
- Receita: separar o escudo em 3–5 camadas (fundo, símbolo, anel/contorno, texto). Ordem: **símbolo primeiro** (chega grande e assenta: scale 1,4 → 1, 12 f `expo.out`, ou gira para dentro: `rotation −180 → 0` 16 f `power3.out` como o galo do Spurs), depois o anel **desenhado** (`stroke-dashoffset` 100 → 0, 18 f), depois o fundo preenche por **clip-path circular** (0 → 120 %, 14 f), por fim texto/ano em fade 6 f.
- "Efeitos de matéria" (1 por escudo, no máximo): **chamas** (Man Utd 63,6–64,6 s: formas vermelho/amarelo sobem por clip-path irregular, cobrem 100 % por 10 f, recuam deixando o símbolo); **respingo** (Burnley 34,3 s, Cardiff 37,6–38,3 s: manchas da cor com overshoot 1,15); **raios** (Southampton 71 s: 24 raios radiais `scale 0 → 3` 10 f + bola no centro); **queda** (Bournemouth: cerejas caem com `bounce.out` 20 f).
- Apelido abaixo em 28 px, 500, cinza (`The Gunners`, `Las Águilas`).
- SFX: 1 por camada (tick), 1 impacto no assentamento final. Para o Leonel: América (águia + anel + "CA") e Cruz Azul (cruz + anel + texto circular).

### A4 `club-flood` — cor cheia do clube (pl-02b 24,6 s Arsenal, 27,3 s Brighton, 38 s Cardiff)
- Transição de capítulo: a tela inteira vira a cor do clube por um **wipe** (retângulo da esquerda, 12 f `power4.inOut`) ou por uma mancha (círculo que cresce do símbolo, 14 f). Em cima, só o símbolo em branco, 2 s. Substitui o `color-flood` do v2. Máx. 2 por vídeo.

### A5 `table` — tabela de classificação (print-04 + S2G 5,2–9 s e 39,7–45 s)
- Card roxo (`--pl-purple`), linhas de 64 px, colunas Pos · escudo · Clube · PJ V E D GP GC SG **Pts** (700) · forma (5 bolinhas 22 px: W verde, D cinza `#6b5a75`, L rosa) · próximo (escudo 28 px). Barra de 4 px à esquerda da posição (ciano = vaga continental, amarelo = Liguilla/play-in, rosa = queda).
- Entrada: cabeçalho em 8 f, linhas em stagger 0,05 s (`y +24 → 0`, fade), 4–8 linhas no máximo (zoom na faixa relevante).
- **Highlight**: a linha do protagonista acende em amarelo (`background` 0 → 1 em 8 f) **na palavra falada**; seta/chevron de posição (▲▼) pisca 1×.
- `mini` = versão compacta 300×120 px (card branco, cabeçalho roxo, 2–3 linhas) **sobre o rosto/gameplay**, que sobrevive aos cortes (overlay como o `hud` do v2); `then` troca os pontos com dígito girando (A1).
- SFX: ticks nas linhas (limitador), 1 ping no highlight.

### A6 `player-card` — ficha de jogador (print-05, print-02, S2G 27–35 s)
- Card 420×150 px (1080p) canto inferior esquerdo: foto recortada em quadrado 110 px com fundo de cor do clube; **OVR 64 px Heavy** + posição 24 px; nome em duas pesagens ("Théo" 500 / "TORRES" 800); linha de rótulos "América · 16 anos · Atacante" com "•" separadores; cor de borda = clube.
- Entrada pop (`scale 0,85 → 1` + `y 30 → 0`, 10 f `back.out(1.4)`); **um card novo a cada nome falado** (o anterior sai por `x −40` + fade 6 f). Permanência 2–4 s.
- SFX: click-soft na entrada.

### A7 `headline` — manchete gigante (S2G 12,7–15,5 s "114 CHARGES")
- Fundo: foto/cutscene escurecida 60 % + vinheta; texto 2–3 palavras, 200 px Heavy, caixa alta, **cor cheia do clube ou rosa PL**, sem extrusão (o 3D do S2G vira **duas camadas** — texto + sombra dura deslocada 8 px na cor escura); escudo grande (520 px) centrado atrás/abaixo.
- Entrada: palavras chegam com `scale 1,3 → 1` + 2 f de `x ±6` (micro-tremor de impacto, só na chegada), stagger 0,08 s; push-in lento 1 → 1,05 durante o hold (2,5–3 s).
- SFX: impacto grave na chegada (único "boom" permitido por vídeo), hush na frase.

### A8 `record` — número contra número (roteiro do Théo: 17 anos e 37 dias × 16 anos)
- Duas colunas em roxo: valor grande (180 px tabular) + rótulo (30 px lilás); o primeiro valor conta (`number-rollup` do v2, 0,8 s), o segundo entra em corte seco em amarelo e o primeiro recua (scale 0,8, opacidade 0,5) — "foco por profundidade" do v2 com pele PL. Para "16 títulos", "jejum desde 2024", "8º lugar raspando".

### A9 `fixture` — confronto (A × B)
- Dois escudos (260 px) com um "×" ou "VS" pesado no centro, fundo dividido ao meio nas duas cores de clube (wipe de cada lado em 12 f, encontrando-se no centro, 1 f de branco). Rótulo em pílula: "Liguilla · Quartas · Ida". Para "o sorteio trouxe o pior adversário": lado do Cruz Azul entra por último com impacto.

### A10 `tweet` — torcedor fake (twitter-light + pedido do Leonel)
- Card branco 820 px, raio 20, avatar 56 px (círculo de cor de clube com inicial), nome 600 + selo + @ + "1h" em cinza, texto 34 px, linha de ações com contagens; sobre fundo roxo ou cor do clube, com leve inclinação 3D (`rotationY −8`, como o `device` do v2).
- Entrada push-up (v2 T10); texto pode **digitar** (cps 40) se for curto. 1 por vídeo, 3–4 s. SFX: notification.

### A11 `paper` — recorte de manchete (S2G 15,5–18,3 s) — versão limpa
- Sem madeira: card branco com borda irregular (clip-path 8 pontos), título Heavy 72 px preto, subtítulo 28 px, data em cima; fundo roxo; `rotationZ −4°` + push-in. Usar para fatos históricos ("2013: a final que virou verbo").

### A12 `tv-archive` — arquivo (S2G 19–21,5 s) — versão limpa
- Moldura 4:3 com cantos arredondados, scanlines 2 px a 12 %, leve aberração cromática (2 px) **só aqui**, rótulo "Azteca · 2013" em pílula. Entrada por flash branco (1 f cheio + 4 f de decaimento). Para o Théo: fotos de arquivo do 2013 e do Azteca.

### A13 `arrow` / `circle` — apontar no print (S2G 7,2 s)
- Seta curta na cor rosa PL ou amarelo, entra com `scale 0 → 1` 8 f `back.out(2)` + micro-bounce; círculo desenhado (`stroke-dashoffset`, 12 f). Sempre junto de um `focus` (punch na região). Máx. 2 por print.

### A14 `smoke-bed` — ambiente de estádio
- Em vez do footage de fumaça do S2G: **cutaway** do próprio gameplay/cutscene (torcida, túnel) com `fx: pan` lento e grading roxo (overlay `--pl-purple` a 35 %, `mix-blend: multiply`). Som de estádio por baixo (−24 dB) é o "som de cama" do canal.

## 5. Câmera e transições

- **Push-in constante** em tudo (1 → 1,05), como no v2. **Punch** (corte seco para 1,2–1,3) na palavra de ênfase; no S2G o punch cai no nome do jogador/clube.
- **Cortes**: corpo a cada 2,5–4 s; gancho a cada 1,5–2,5 s. Holds de 4–6 s só em print com seta/tabela (tempo de ler).
- **Flash branco** (1 f cheio + 4 f decaimento, `power3.out`) = troca de "era" (arquivo, memória). Máx. 2 por vídeo.
- **Fogo/respingo**: existe, mas em **vetor** e na cor do clube (A3/A4), nunca stock. Máx. 1 por vídeo.
- **Wipe de cor** (12 f) entre capítulos; **whip** com motion blur (v2 T8) entre prints da mesma tela; **blur-cut** (v2 T9) para voltar ao rosto.
- **Micro-tremor** só na chegada da manchete (A7): 2 f, ±6 px. Nada de shake contínuo.
- **Rosto**: no S2G é pequeno e no canto (18 %, sobre print). No Leonel: rosto em tela cheia é a regra (v2), e a versão **"facecam no canto"** (`"face":"corner"`) só sobre prints/tabela, canto superior direito, 22 % da largura, raio 20, borda 2 px na cor do clube.

## 6. SFX e música

- **Música de tensão contínua** (o S2G nunca para: 17–19 onsets/10 s com música): cama cinematográfica em tom menor, sem vocal, −22 dB sob a voz, sobe para −16 dB nos `headline`/`fixture`. É a maior diferença para o canal de design (que quase não tem música).
- **Som de estádio** (−26 dB) por baixo de cutaways e do `smoke-bed`.
- SFX por evento (1 por evento, limitador do motor em 6/10 s no vertical, **4/10 s no horizontal**): corte seco → clique; overlay/card → whoosh curto 2–3 f antes; dígito/placar → tick + impacto curto; manchete → impacto grave (1 por vídeo); flash → whoosh longo (0,4 s); escudo assentando → impacto médio; tweet → notification. `hush` nas frases-chave (ex.: "virou um verbo").
- Pack a montar (`studio/assets/eafc/sfx/`): `stadium-bed`, `whistle` (só em gol/virada), `net-hit` (gol), `impact-deep`, `impact-mid`, `riser-short` (≤ 0,7 s, antes do `fixture`), `flash`, `paper`, `tv-on`, mais os do pack base (click, whoosh, tick, notification).

## 7. Repertório

### 7.1 Aberturas (gancho ≤ 4 s antes do rosto; voz no frame 0)
| slug | o que faz |
|---|---|
| `scorebug-hook` | placar vivo em fundo preto/roxo; na frase-chave vira GOAL na cor do clube → corte para o rosto |
| `wordwall-hook` | muro tipográfico da tese ("CRUZAZULEAR") correndo, escudo pousa no centro → inundação de cor → rosto |
| `record-hook` | A8: número contra número contando com a voz ("17 anos e 37 dias" × "16") → corte seco |
| `fixture-hook` | A9: dois escudos se chocando no centro, pílula com a fase → rosto |
| `headline-hook` | A7: manchete gigante sobre cutscene escurecida + escudo → blur-cut |
| `archive-hook` | flash → A12 TV com imagem de arquivo + rótulo de ano → rosto ("em 2013…") |
| `table-hook` | tabela com a linha do clube acendendo na palavra ("entrou em oitavo, raspando") → punch na linha → rosto |
| `cutscene-first` | cutscene/gameplay em tela cheia com `smoke-bed` e lower-third do clube (S2G 0–5 s) → rosto |

### 7.2 Cenas (corpo)
`scorebug`, `wordwall`, `crest-build`, `club-flood`, `table` (+ `mini` overlay), `player-card` (overlay), `headline`, `record`, `fixture`, `tweet`, `paper`, `tv-archive`, `arrow`/`circle` (modificador de `cutaway`), `smoke-bed` (cutaway com grading) + as do v2 que seguem valendo: `cutaway`, `bridge` (com pele PL), `number`, `kpis`, `stack`, `grid`, `hud`, `ytcta`, `punch`, `focus`.

### 7.3 Regras anti-repetição e densidade
- Nunca a mesma abertura em dois vídeos seguidos; alternar fundo dominante (roxo / cor de clube / branco).
- Por gancho de 45–60 s: 1 abertura + 5–7 cenas diferentes; `headline` e `club-flood` ≤ 1; `arrow` ≤ 2; `tweet` ≤ 1; nenhuma transição > 3×.
- 1 objeto por vez. A mini-tabela e o card de jogador são os únicos overlays que podem coexistir com um cutaway (nunca os dois juntos).
- Algo muda a cada 1–1,5 s no gancho, a cada 2–3 s no corpo.

## 8. Esqueleto do gancho do Théo (EP 03, 56 s — `work/theo-ep03/transcript.txt`)
Para a próxima sessão; os tempos vêm da transcrição real.

| t | fala | cena |
|---|---|---|
| 0,0 | "o Torres tem 16 anos… titular do maior campeão mexicano" | `record-hook`: "16 ANOS" conta → corte para o rosto em "maior campeão" |
| 5,3 | "Tem 16 títulos. Só que o América não vence desde 2024" | `crest-build` América (3 s) → `record` 16 títulos × "0 desde 2024" em amarelo |
| 9,6 | "o sorteio trouxe logo o pior adversário possível" | rosto com punch; `riser-short` |
| 15,0 | "O Cruz Azul, o atual campeão mexicano" | `fixture` América × Cruz Azul, lado azul entra por último com impacto; `club-flood` azul |
| 17–22 | "confronto que mais aconteceu… Liguilla" | `table` Liguilla (8 linhas) com América em 8º acendendo em amarelo |
| 26,0 | "em 2013… no Azteca, 2 a 0" | flash → `tv-archive` "Azteca · 2013" + `scorebug` CAZ 2–0 AME |
| 33,6 | "o América conseguiu empatar… pênaltis… campeão" | `scorebug` vira GOAL ×2 (amarelo) e "4–2 pên." ; `hush` |
| 40,6 | "virou um verbo… Cruz Azul-ear" | `wordwall` "CRUZAZULEAR" ×7 correndo em azul → `tweet` de torcedor fake ("cruzazuleó otra vez 😭") |
| 47,0 | "Serão seis jogos, quartas, semi e duas finais" | `kpis` 6 · 3 fases · ida e volta (pele PL) |
| 50,4 | "deixa o like, se inscreve…" | `ytcta` do v2 sobre o rosto + `player-card` Théo como callback final |

## 9. Anti-padrões (o que esse canal nunca faz)
- Stock de fogo/fumaça/madeira/luz neon; texto extrudado 3D; brilho/glow; gradiente arco-íris; sombra dura nos assets.
- Mais de 2 elementos animando ao mesmo tempo; facecam + overlay + seta no mesmo plano.
- Legendas amarelas de "cortes"; emojis 3D; vinheta de abertura antes da voz; música parando no meio.
- Escudo "aparecendo" com fade; tabela inteira de 18 linhas ilegível; cores fora da paleta do clube em cena de clube.
- Repetir a abertura ou a sequência do vídeo anterior.

## 10. Implementação (próxima sessão, sem ultracode)
1. Tema no motor v2 (`spec.theme = "eafc"`): tokens do §3 no `:root`, fontes Articulat 800/900, pack `studio/assets/eafc/sfx/`, escudos em `studio/assets/eafc/brand/` (`america.png`, `cruz-azul.png` já normalizados, 1400 px, fundo transparente).
2. Cenas A1–A14 como `case`s novos em `studio/engine/v2/compose.mjs` + defs em `plan.mjs`; aberturas do §7.1 como macros.
3. Prova de estilo: `make.mjs theo-ep03 gancho-ep03.json --proof --no-render` com o esqueleto do §8, 1 folha de prova, ajustar, render 1080p60.
4. Registrar no `historico.json` e seguir a regra de variação a partir do EP 04.
