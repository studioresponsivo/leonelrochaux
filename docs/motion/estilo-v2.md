# Estilo v2 — guia de direção de edição e motion

Base: 13 referências em `work/estilo/ref/` (análise de cortes, folhas de contato a 2 fps, tiras quadro a quadro nas transições, onsets de áudio e espectrogramas). Todas terminam com ~3,5 s de vinheta do TikTok (ignorar). `ref07` = `ref08` (duplicadas). `ref07`, `ref11` e `ref12` mostram a **timeline de SFX** embaixo do vídeo: é a fonte mais valiosa sobre como o som é montado.

> Atenção: 12 das 13 referências são **motion de UI sem rosto** (estilo "i.editverse": objetos de interface animados sobre fundo limpo). Só a `ref13` tem apresentador. O guia traduz essa linguagem para o formato do Leonel (rosto + tela), usando a `ref13` como prova de que funciona: UI conta a história com a voz por baixo e **só depois** corta para o rosto.

---

## 1. Visão geral — o que torna isso premium

1. **Um objeto por vez, no centro, muito ar em volta.** O quadro tem 1 elemento protagonista (ícone, pílula, card, celular, frase). Ocupa 25–45% da largura; o resto é fundo limpo.
2. **Tudo se move, nada pula.** Não há "aparecer seco": todo elemento entra com escala + blur + opacidade, e sai com blur de movimento. Mas cortes secos existem — entre *capítulos*, não entre elementos.
3. **Continuidade de objeto (match/morph).** O elemento da cena anterior vira o da próxima: ícone → pílula → card → celular. O olho segue um único "ator". Isso é o que dá a sensação de direção, não de slides.
4. **Motion blur direcional real** em todo movimento rápido (texto que corre, card que gira, whip). É a assinatura mais forte do estilo.
5. **Ritmo de microbatidas**: algo muda a cada 0,7–1,5 s; corte seco a cada 3–6 s.
6. **Som de UI em camadas**: cada micro-evento tem um clique/whoosh curtinho, baixo, e as transições grandes têm um whoosh "dreamy". Música é cama discreta (ou nenhuma).
7. **Paleta contida**: neutro claro (#f2f2f2–#fafafa) ou escuro (#0b0b0f) + **um** acento de cor por vídeo (verde, vermelho, azul). Acento só em destaques.

### O que NÃO fazer
- Rosto num card com ícones/vídeos flutuando em volta como abertura.
- Mais de 2 elementos animando ao mesmo tempo no mesmo plano (exceto colagens deliberadas, `ref10`).
- Sombras duras, gradientes arco-íris, glow neon, bordas grossas, emojis 3D genéricos ("cara de IA").
- Transição "de template" (cubo 3D, página virando, zoom com estrela).
- SFX em todo evento com o mesmo volume; risers longos; boom cinematográfico.
- Legendas grandes amarelas com contorno estilo "podcast cortes".

---

## 2. Ritmo e montagem

| Métrica (medida) | Valor |
|---|---|
| Cortes secos (scene > 0,25) | 0–4 por vídeo; intervalo médio **3,4–6 s** (`ref03`: 4,3 / 6,0 / 10,2; `ref05`: 4,2 / 7,0; `ref13`: 1,7 / 6,3) |
| "Batidas" visuais (picos de movimento) | a cada **1,0–1,7 s** (`ref02` 1,1 s; `ref10` 1,3 s; `ref06` 1,4 s; `ref04` 1,7 s) |
| Duração de uma transição interna | 6–15 frames (0,2–0,5 s) |
| Duração de um corte seco "de capítulo" | 0 frames + flash/blur de 1–3 frames |

### Padrões de montagem
- **Capítulo = 1 fundo.** Muda o fundo (claro → escuro → cor cheia) = muda o capítulo, com corte seco. Dentro do capítulo, só transições de objeto (morph, push, swap). Ex. `ref04`: claro (problema) → preto "Meet Plugsy" (solução) → claro (benefícios) → preto (métricas) → claro (assinatura).
- **Voz por baixo da cena (J-cut).** `ref13`: 6 s de UI (vídeo do YouTube → título → bloco de notas) com a voz rolando; só aos 6,3 s corta para o rosto, que já está no meio da frase. O rosto é a *recompensa*, não a abertura.
- **Insert de tela em tela cheia → volta ao rosto com blur-cut** (rack focus de 3–4 frames, `ref13` 6,27 s).
- **Frase-ponte em fundo liso**: entre dois blocos de UI, uma frase de 3–6 palavras em tipografia cinética sobre fundo liso (`ref05` "Take advantage of the store while you can", `ref09` "You've always wanted to build a…").
- **Loop/eco**: várias referências repetem a sequência (A-B-A-B). Para o Leonel, usar a ideia como *callback*: o objeto do gancho volta no CTA.
- **Alternância rosto × cena** (adaptação): rosto nunca fica > 4 s sem um insert ou mudança de enquadramento; cena/UI nunca fica > 6 s sem voltar ao rosto (exceto demonstrações).

---

## 3. Catálogo de transições

Frames a 30 fps. Easing em nomenclatura GSAP.

### T1 `blur-word-cascade` — palavras chegando com blur (ref03 0:00, ref05 6:0)
- f0: palavra 1 nasce deslocada (+40 px x, +20 px y), scale 0.9, blur 8 px, opacidade 0, tom azulado/cor de acento.
- f4: palavra pousa (blur 0, opacidade 1) e volta para a cor do texto em +4 f.
- Próxima palavra começa 2–3 f depois (stagger 0,07–0,1 s). A linha inteira se re-centraliza suavemente (`x` do container anima 0,3 s `power2.out`).
- Easing: `power3.out`, 0,15–0,2 s por palavra.
- Uso: ganchos de texto, frase-ponte. SFX: tique suave por palavra só nas 2–3 primeiras, ou 1 "short whoosh" no início.

### T2 `ticker-blur` — frase que corre lateralmente (ref09 0:13–1:7, ref05 6:2)
- A frase é maior que a tela; o container anda para a esquerda acompanhando a palavra falada (câmera segue o texto). Palavras novas entram à direita com blur; as antigas saem à esquerda com **motion blur horizontal 12–20 px**.
- Velocidade ~600–900 px/s (em 1080 de largura); `none`/linear durante a corrida, `power2.out` na parada final.
- Fundo: cor cheia de acento com gradiente diagonal (verde em `ref09`).
- SFX: 1 whoosh contínuo curto (0,4–0,6 s) sob a corrida.

### T3 `card-swap-blur` — troca de conteúdo dentro do card (ref02 5:0, 11:0)
- O card fica parado; as linhas de conteúdo antigas recebem blur vertical 6–10 px e somem (4 f); as novas resolvem do blur (4–6 f), staggered por linha (2 f).
- Easing `power2.inOut`, total 0,3–0,4 s. SFX: "ui click" suave.

### T4 `spin-out` — saída girando com motion blur (ref02 5:5, 12:5)
- Card gira 0 → 25–35° (sentido horário) e desloca +15% x, +10% y; scale 1 → 0.9; blur cresce 0 → 10 px nos 3 últimos frames; corte ao chegar a ~35°.
- 6–8 f, `power2.in`. O próximo plano entra parado (nunca girar entrada e saída juntos).
- SFX: whoosh curto (pico no frame de maior velocidade).

### T5 `click-ripple-whiteout` — clique que leva à revelação (ref04 4:3–5:5)
- Cursor (mão) entra e clica: o alvo escala 1 → 0.94 → 1 (3 f + 4 f).
- Ondulação: círculo do acento, opacidade 0.6 → 0, raio 0 → 3× o alvo, 9 f `power2.out`.
- A cena toda clareia para branco (opacidade do overlay 0 → 1 em 6 f) e **corta seco** para fundo escuro com a frase de revelação (T1).
- SFX: "button/click" no clique + "dreamy whoosh" saindo do branco para o preto.

### T6 `stroke-draw-pill` — pílula/contorno desenhado (ref04 1:5–4:5)
- O contorno da pílula é desenhado (stroke-dashoffset) a partir de um lado, 10–12 f, `power2.out`; ícones entram dentro em stagger 3 f (scale 0.6 → 1, `back.out(1.6)`).
- Quando a pílula precisa dar lugar ao próximo: ela "empurra" para a esquerda, escala 1 → 1.6 (zoom em direção ao alvo do clique).
- SFX: "ui-sound" leve por ícone.

### T7 `shrink-to-cut` → `3d-device-rise` (ref04 7:6–8:7)
- Logo/elemento encolhe 1 → 0 em 10 f `power3.in`; **corte seco** para preto.
- No preto, celular em 3D: inicia pequeno (scale 0.35), `rotateX 25°`, `rotateY -30°`, `rotateZ -20°`; sobe e endireita para `rotate 0 / -8°` e scale 1 em 1,0–1,2 s `power3.out`; spot de luz suave atrás (radial #fff 6% opacidade).
- Depois: flutuação lenta (rotateY ±6°, y ±8 px, 4–6 s, `sine.inOut`).
- SFX: whoosh grave + "transform" metálico baixo na subida.

### T8 `whip-pan-blur` — pan rápido dentro da mesma "página" (ref13 1:6–2:1)
- Câmera (container) translada 60–100% da altura/largura em 5–6 f; blur direcional 15–25 px no meio do movimento; pousa com leve overshoot (2–3%) e assenta em 4 f.
- `power4.inOut` (ou `expo.inOut`). Ideal para ir de um bloco de UI a outro (vídeo → título; título → notas).
- SFX: "short whoosh", pico no frame central.

### T9 `blur-cut-to-face` — corte para o rosto com foco entrando (ref13 6:2)
- Último plano de UI: push-out lento (scale 1 → 0.92 em 0,6 s `power1.inOut`), depois 2 f com blur 8 px e opacidade caindo.
- **Corte seco** para o rosto com blur gaussiano 20 px → 0 em 4–5 f (`power2.out`) e scale 1.06 → 1.0 em 0,5 s.
- A legenda começa já no primeiro frame nítido.
- SFX: nenhum ou "soft swish" baixo; a voz já está correndo (J-cut).

### T10 `stack-push-up` — card novo sobe por cima do anterior (ref03 7:9–8:3)
- Novo card (vídeo/foto) entra de baixo (+60% y) até o centro em 8–10 f `power3.out`, levemente maior que o anterior.
- O card anterior recua: y −8%, scale 0.92, opacidade 1 → 0 em 10 f (fica atrás, em profundidade).
- SFX: whoosh curto ascendente.

### T11 `color-flood` — inundação de cor de baixo para cima (ref09 6:6–7:3)
- Gradiente vertical da cor de acento (ou vermelho = problema) sobe de baixo: overlay com `background: linear-gradient(to top, cor 0%, cor 40%, transparent 100%)` translada de +100% a 0 em 18–22 f `power2.inOut`; objeto ao centro perde saturação e some.
- Corta para fundo branco no próximo capítulo.
- SFX: riser curto (≤ 0,7 s) + impacto leve no corte.

### T12 `curtain-scene-push` — cena nova desce como camada (ref06 0:8–1:2)
- Fundo A (céu) e fundo B (campo): B desce de cima como painel full-bleed (y −100% → 0) em 10–12 f `power3.inOut`, com 1–2 f de véu branco 30%; A fica visível só numa faixa inferior que vira "palco" do dock.
- SFX: "dreamy whoosh".

### T13 `glow-pop-icon` — ícone surge com bloom (ref10 0:0–0:5, ref01 0:0)
- Ícone entra da direita com motion blur (x +80 px → 0, 4 f), scale 0.7 → 1 `back.out(2)`.
- Halo radial do acento (opacidade 0.5 → 0, raio 0.5× → 2× o ícone) em 10–12 f.
- Badge (notificação) pop: scale 0 → 1.15 → 1 em 6 f. Leve wobble do ícone (rotate ±4°, 2 ciclos).
- SFX: "pop/ui" + "notification".

### T14 `text-highlight-select` — seleção estilo iOS (ref03 1:5–4:0)
- Trecho da frase ganha caixa de seleção azul-clara (#cfe3ff), com as alças (barras com bolinha) nas pontas; a caixa expande da esquerda para a direita em 6–8 f.
- Câmera dá zoom 1 → 1.8 na palavra selecionada em 0,5 s `power2.inOut`.
- SFX: "tap".

### T15 `marker-swipe` — marca-texto que varre a palavra (ref10 1:5, 3:5)
- Retângulo do acento (vermelho em `ref10`) cresce de largura 0 → 100% da palavra em 5 f `power2.out`, com borda suave (blur 2 px) e glow radial atrás. Às vezes "censura" a palavra e é substituída.
- SFX: "swipe" curtinho.

### T16 `number-rollup` — contador com glow (ref03 4:3, ref04 20:0–24:5)
- Número conta (60.784 → 100.000) em 0,6–1,0 s `power3.out`, dígitos com blur vertical leve durante a contagem; glow verde sutil (text-shadow 0 0 24px acento 40%).
- Em sequências de KPIs: o card ativo fica nítido e os outros ficam com blur 4 px e opacidade 0.4 (foco por profundidade).
- SFX: "tick" de contagem (granular, baixo) + "ding" suave no valor final.

---

## 4. Câmera e movimento

- **Push-in lento constante** em quase todo plano estático: scale 1 → 1.04–1.08 ao longo do plano (`none` ou `sine.inOut`). Nunca deixar o quadro 100% parado por > 1 s.
- **Push-out antes de cortar** (T9): 1 → 0.92, sensação de "fechar o capítulo".
- **Punch-in em palavra/elemento**: 1 → 1.6–1.8 em 0,4–0,5 s `power2.inOut` (T14).
- **Whip** só em translação, com blur direcional (T8). Nada de whip em rotação.
- **3D**: dispositivos e cards em leve perspectiva (perspective 1200–1600 px; rotateY ±8–30°). Nunca texto em 3D.
- **Parallax**: colagens (`ref10`) e controle com cartas (`ref09`) — 2–3 camadas, a da frente se move 1,3–1,6× a de trás; blur de profundidade 2–6 px na camada de trás.
- **Shake**: não usado. Usar no máximo micro-shake de 2–4 px, 4 f, num impacto de capítulo (opcional, raro).
- **Motion blur**: obrigatório em qualquer movimento > ~40 px/frame. Em CSS, simular com `filter: blur()` direcional (duplicar camada com `blur` + `scaleX 1.1` ou SVG `feGaussianBlur stdDeviation="20 0"`).

---

## 5. Tipografia e legendas

- **Fonte**: grotesca neo-humanista/SF-like (SF Pro, Inter). Para o Leonel: **Articulat CF**.
- **Peso**: 500–600 no corpo da frase; 700 para a palavra-chave. Nunca 800/900.
- **Caixa**: sentença ou Title Case. Nada de CAPS LOCK (exceto rótulos minúsculos de UI, 10–12 px, tracking +4%).
- **Tamanho relativo**: frase-gancho em tela limpa = 4–6% da altura do quadro (≈ 80–110 px em 1920 de altura); legenda sobre rosto = 2,8–3,5% (≈ 54–64 px em 9:16), uma linha, centralizada no terço inferior (`ref13`: y ≈ 72% da altura).
- **Tracking**: −1% a −2% em tamanhos grandes.
- **Entrada**: palavra a palavra (T1) nos ganchos; por **frase curta** (3–6 palavras) nas legendas sobre rosto, com fade+blur de 4 f; ticker (T2) para frases longas e enfáticas.
- **Palavra em destaque**: (a) cor de acento + peso 700, (b) marca-texto (T15), (c) seleção iOS (T14), (d) ícone embutido no meio da frase (`ref09` "You don't know how to [</>] Code", `ref12` "how to find this [Figma] files?" — o ícone troca como slot-machine: Figma → Ps → Ae).
- **Permanência**: frase de gancho 1,2–2 s após completar; legenda fica até a próxima frase (troca seca + blur 3 f).
- **Escala de tamanho mista** (`ref10`): numa colagem, palavras em tamanhos diferentes ("do something / with / your **mind**") — usar só em 1 momento por vídeo.

---

## 6. Gráficos / VFX

- **Cards de UI**: cantos 16–28 px (proporcional), fundo branco ou #111 sólido, sombra muito difusa (0 20px 60px rgba(0,0,0,.08–.12)), borda 1 px rgba(0,0,0,.06). Sempre réplicas limpas de interfaces reais (iOS, YouTube, Notes, Pinterest, Figma).
- **Pílulas** (`ref04`, `ref02`): botão "+ New", barra de busca, toggles. Contorno fino 1,5 px; ícones dentro.
- **Cursor/mão**: cursor do macOS ou mãozinha; clique = escala do alvo + ripple (T5).
- **Pilha de avatares + contador** (`ref03` "33+ → 62+ → 91+"): prova social; contador conta.
- **Máscara circular colorida** (`ref03` casa num círculo azul com pin): foto num círculo de acento que contrai e "solta" a foto em card retangular.
- **Halo/bloom radial** de acento atrás de ícone ou botão (T13).
- **Spot de luz** em fundo escuro atrás de device (radial branco 4–8%).
- **Gradientes**: só em fundos de capítulo (verde diagonal, vermelho de baixo, mesh rosado suave em `ref12`).
- **Grão/ruído**: não usado. **Vinheta**: só em fundos escuros, muito leve (bordas −10% de luminância).
- **Entrada padrão de elemento**: scale 0.85 → 1, blur 8 → 0, opacidade 0 → 1, y +20 → 0, 0,35 s `power3.out`. **Saída padrão**: scale 1 → 0.95, blur 0 → 6, opacidade → 0, 0,2 s `power2.in`.

---

## 7. Cor e acabamento

- **Fundos claros**: #eeeeee–#f7f7f9 (levemente frios), sem textura.
- **Fundos escuros**: #0b0b0f–#141418, com spot radial; usados para "revelação" e métricas.
- **Fundos de acento**: cor cheia em gradiente diagonal (verde-água em `ref09`), só para frase-ponte ou alerta.
- **Footage (rosto)**: contraste médio, pele natural, levemente quente; nada de teal & orange forte. Profundidade de campo rasa (fundo desfocado) ajuda a casar com a UI limpa.
- **Sem grão, sem LUT pesado, sem aberração cromática** (exceto o glitch do TikTok no outro, que não é do estilo).

---

## 8. SFX

Lido da timeline das próprias referências (`ref07`, `ref11`, `ref12`) e dos espectrogramas.

| Tipo | Nomes vistos na timeline | Onde cai | Volume relativo |
|---|---|---|---|
| Whoosh curto | "Short Whoosh", "2 Short Whoosh" | whip, spin-out, stack-push, ticker | −14 a −10 dB |
| Whoosh "dreamy"/swish suave | "Dreamy Whoosh", "SMOOTH" | troca de capítulo, curtain, white-out | −16 a −12 dB |
| Clique de UI | "ui-sounds-pack", "Button", "Enter", "confirm", "Copy of…" | cada clique, toggle, ícone que pousa | −22 a −16 dB |
| Teclado | "4 typing", "Key" | texto sendo digitado (pulsos rápidos, 0,5–1 s) | −22 dB |
| Glitch/transform | "Glitch", "Transform" | device/objeto que se transforma | −18 dB |
| Granular/tick | "Gran…" | contadores, listas | −24 dB |
| Música | cama contínua em `ref02`, `ref04`, `ref10` | sob tudo | −24 a −20 dB sob voz |

- Observado: 3–4 trilhas paralelas de SFX; 10–20 onsets por 10 s nos demos *só de SFX* (muitos são cliques empilhados no mesmo evento). ~50–70% dos onsets coincidem com pico de movimento (o SFX cai **no frame de maior velocidade** da transição, não no início).
- **Regra para o Leonel (importante, sem exagero)**: máx. **6 SFX audíveis por 10 s** com voz; 1 por evento (não empilhar mais de 2); whoosh adiantado 2–3 f em relação ao pico visual; clique exatamente no frame do contato. Sem SFX em legenda comum. Silenciar SFX durante frases-chave da voz (deixar a frase respirar).
- **Música**: opcional; quando houver, lo-fi/eletrônica minimalista, sem vocal, com ducking −8 dB sob voz.

---

## 9. Repertório de variações

### 9.1 Aberturas / ganchos (≥ 8)

Regra geral: os 2 primeiros segundos mostram **a cena** (tela, objeto, frase), com a voz do Leonel por baixo. O rosto entra entre 1,5 s e 6 s via corte.

| slug | Descrição | Regras |
|---|---|---|
| `cold-ui` | Abre direto num objeto de UI (pílula "+ New", barra de busca, ícone com badge) que já está agindo enquanto ele fala. Corta para o rosto na 2ª frase (T9). | Objeto = o assunto do vídeo. Máx. 3 s antes do rosto. |
| `type-hook` | Frase-gancho entra palavra a palavra (T1) em fundo limpo, sincronizada com a voz; última palavra em acento; corte seco para o rosto. | ≤ 8 palavras. Fundo claro. |
| `ticker-hook` | Fundo verde cheio, frase longa correndo com motion blur (T2) na velocidade da fala. | Só para frases de impacto. Corta para o rosto com blur-cut. |
| `search-hook` | Ícone de busca com bloom (T13) → barra expande → a pergunta é digitada ("como fazer X no Figma?") com SFX de teclado → resultado/colagem. | A pergunta é a dor do público. |
| `screen-first` | Insert de tela cheia do trabalho real (Figma/Framer) com push-in lento e voz por baixo; corte para o rosto no "e eu vou te mostrar como". | Tela precisa ser legível em 9:16 (zoom em região). |
| `result-first` | Mostra o resultado final (site/app pronto em device 3D, T7) por 2 s; rosto entra dizendo quanto tempo levou. | Funciona para portfólio/case. |
| `number-hook` | Número grande contando em fundo escuro com glow verde (T16), ex. "40 telas em 1 dia"; corte seco para o rosto. | Número real e verificável. |
| `selection-hook` | Frase na tela, o Leonel "seleciona" a palavra-chave (T14) e a câmera dá punch-in; corte para o rosto. | A palavra selecionada = tese do vídeo. |
| `face-to-face-cut` | Começa no rosto em plano fechado (take A), corta seco para take B (plano aberto/ângulo diferente) na 2ª frase, depois insert de tela. | Precisa de 2 takes/enquadramentos (ou crop 1.0 → 1.35 simulando). |
| `problem-flood` | Mostra o "jeito errado" (UI bagunçada) e a tela é inundada de vermelho/neutral escuro (T11); corta para o rosto com a solução. | Usar vermelho só aqui; resto do vídeo em verde. |

### 9.2 Padrões de cena (≥ 10)

| slug | Descrição | Regras de uso |
|---|---|---|
| `talk-push` | Rosto em tela cheia, push-in 1 → 1.06 contínuo, legenda por frase no terço inferior. | Máx. 4 s sem evento; alternar com `talk-punch`. |
| `talk-punch` | Mesmo take com corte seco para crop 1.25–1.35 (simula 2ª câmera) na frase de ênfase. | No máx. 1 a cada 2 frases; nunca 2 seguidos. |
| `screen-insert` | Tela cheia do Figma/Framer/site; push-in lento ou punch na região relevante; voz continua (J/L-cut). | Entrar 0,2–0,4 s antes da palavra que a cita; sair com blur-cut (T9). |
| `ui-object` | Um único objeto de UI recriado (botão, card, notificação) no centro, fazendo uma ação. | 1 objeto, fundo limpo, 1 SFX. |
| `card-swap` | Card fixo trocando conteúdo (T3) a cada item de uma lista. | Listas de 2–4 itens. |
| `device-3d` | Device 3D flutuando em fundo escuro com spot, rolando a tela do projeto; rótulos de benefício entram à esquerda (T1) um por vez. | Ideal para portfólio/case; 4–8 s. |
| `kpi-row` | 2–3 cards de métrica; o ativo nítido, os outros em blur (T16). | Números contam; 1 SFX tick por card. |
| `inline-icon-sentence` | Frase com ícone de app embutido entre palavras; ícone troca tipo slot (Figma → Framer → IA). | Frases de comparação/ferramentas. |
| `collage-parallax` | Colagem de referências (prints, fotos) em 2–3 camadas com parallax e uma frase em tamanhos mistos por cima. | 1 vez por vídeo; inspiração/moodboard. |
| `stack-proof` | Prova empilhada: card de resultado sobe por cima do anterior (T10) — antes/depois, print de cliente, métrica. | 2–3 cards no máximo. |
| `bridge-phrase` | Frase-ponte em fundo liso ou cor cheia (T1/T2) entre dois blocos. | Marca troca de capítulo; ≤ 2 por vídeo curto. |
| `avatar-proof` | Pilha de avatares + contador subindo (prova social). | Só com dado real. |
| `cta-callback` | O objeto do gancho volta transformado no CTA (ex. a pílula "+ New" vira "Seguir"/link do portfólio); termina com logo (T7 invertido: shrink). | Sempre fechar o loop do gancho. |

### Regras anti-repetição
- Nunca repetir o mesmo `hook` em dois vídeos seguidos; registrar no JSON (`"hookStyle"`) e alternar.
- Por vídeo curto (≤ 90 s): 1 gancho + 4–6 padrões de cena diferentes; nenhuma transição T* mais de 3 vezes.
- Alternar o "fundo de capítulo" (claro/escuro/verde) entre vídeos.

---

## 10. Tabela de implementação (GSAP/HTML)

Valores para 1080×1920 (9:16). Para 1920×1080 (16:9), multiplicar deslocamentos em x por 1,78 e em y por 0,56; tamanhos de fonte × 0,75; blur igual.

| ID | Duração | Easing | Escala | Blur | Offsets / outros |
|---|---|---|---|---|---|
| Entrada padrão | 0,35 s | `power3.out` | 0.85 → 1 | 8 → 0 px | y +20 → 0; opacity 0 → 1 |
| Saída padrão | 0,20 s | `power2.in` | 1 → 0.95 | 0 → 6 px | opacity → 0 |
| T1 blur-word-cascade | 0,18 s/palavra, stagger 0,08 s | `power3.out` | 0.9 → 1 | 8 → 0 | x +40, y +20 → 0; cor acento → texto em 0,15 s |
| T2 ticker-blur | duração da fala | `none`, parada `power2.out` 0,3 s | 1 | blur X 12–20 px no movimento | 600–900 px/s |
| T3 card-swap-blur | 0,35 s | `power2.inOut` | 1 | 0 → 8 → 0 (Y) | stagger 0,066 s por linha |
| T4 spin-out | 0,25 s | `power2.in` | 1 → 0.9 | 0 → 10 (últimos 3 f) | rotate 0 → 30°; x +15%, y +10% |
| T5 click-ripple-whiteout | clique 0,23 s + ripple 0,3 s + white 0,2 s | `power2.out` | alvo 1 → .94 → 1; ripple 0 → 3× | — | ripple opacity .6 → 0; overlay branco 0 → 1 |
| T6 stroke-draw-pill | 0,4 s + ícones stagger 0,1 s | `power2.out` / ícones `back.out(1.6)` | ícones 0.6 → 1 | — | stroke-dashoffset 100% → 0 |
| T7 3d-device-rise | 1,1 s | `power3.out` | 0.35 → 1 | 6 → 0 | rotateX 25 → 0, rotateY −30 → −8, rotateZ −20 → 0; perspective 1400 px; idle rotateY ±6° 5 s `sine.inOut` |
| Shrink-to-cut | 0,33 s | `power3.in` | 1 → 0 | — | corte seco no fim |
| T8 whip-pan-blur | 0,18–0,2 s + assentar 0,13 s | `power4.inOut` | 1 | 0 → 20 → 0 (direcional) | 60–100% do quadro; overshoot 2–3% |
| T9 blur-cut-to-face | push-out 0,6 s; corte; foco 0,16 s; settle 0,5 s | `power1.inOut` / `power2.out` | out 1 → .92; face 1.06 → 1 | face 20 → 0 px | — |
| T10 stack-push-up | 0,3 s | `power3.out` | novo 1.05 → 1; antigo 1 → .92 | antigo 0 → 4 | novo y +60% → 0; antigo y −8%, opacity → 0 |
| T11 color-flood | 0,7 s | `power2.inOut` | — | — | gradiente y +100% → 0; objeto saturate 1 → 0 |
| T12 curtain-scene-push | 0,4 s | `power3.inOut` | — | véu 1–2 f | camada B y −100% → 0; A fica em faixa de 25% |
| T13 glow-pop-icon | 0,15 s entrada + halo 0,4 s | `back.out(2)` / `power2.out` | 0.7 → 1; halo 0.5 → 2× | entrada X 10 px | badge 0 → 1.15 → 1 em 0,2 s; wobble ±4° |
| T14 text-highlight-select | caixa 0,25 s; zoom 0,5 s | `power2.out` / `power2.inOut` | câmera 1 → 1.8 | — | cor caixa `rgba(34,197,94,.22)` |
| T15 marker-swipe | 0,17 s | `power2.out` | — | borda 2 px | width 0 → 100%; glow radial 40% |
| T16 number-rollup | 0,6–1,0 s | `power3.out` | — | dígitos Y 3 px durante contagem | text-shadow 0 0 24px acento 40%; cards inativos blur 4 px, opacity .4 |
| Push-in contínuo | duração do plano | `none` | 1 → 1.04–1.08 | — | — |
| Punch (talk-punch) | 0 (corte) | — | 1 → 1.3 | — | ancorar nos olhos (y ≈ 35%) |
| SFX offset | — | — | — | — | whoosh −2/−3 f do pico; clique no frame do contato |

Tamanhos de referência 9:16: frase-gancho 88–110 px; legenda 56–64 px peso 600; rótulos de UI 28–34 px; cards 70–80% da largura. Margens seguras: 120 px laterais, 260 px topo, 380 px base (UI do app).

---

## 11. Adaptação à identidade do Leonel

- **Acento**: verde #22C55E no lugar do azul/vermelho das referências — seleção (T14), marca-texto (T15), halo (T13), glow de número (T16), fundo de `ticker-hook` (gradiente #22C55E → #15803d diagonal). Vermelho apenas em `problem-flood`, e dessaturado (#ef4444 a 80%).
- **Neutros**: claro #fafafa/#f5f5f5 (fundos), #e5e5e5 (bordas), #a3a3a3 (texto secundário), #171717 (texto); escuro #0a0a0a/#070707 (capítulos de revelação), cards escuros #171717.
- **Fonte**: Articulat CF — 500 corpo, 600 legenda, 700 palavra-chave; tracking −1,5% em ≥ 80 px.
- **Ícones de ferramenta** (Figma, Framer, IA) são o equivalente dele aos ícones de app das referências — usar em `inline-icon-sentence` e `cold-ui`.
- **Reels/Shorts/TikTok (9:16)**: gancho ≤ 3 s antes do rosto; 1 batida a cada ~1,2 s; corte seco a cada 3–5 s; legendas por frase.
- **YouTube longo (16:9)**: o Premiere já cortou; a camada visual usa `screen-insert`, `card-swap`, `kpi-row`, `bridge-phrase` nos inícios de capítulo; batidas mais espaçadas (a cada 3–6 s); legendas opcionais/menores (40–48 px em 1080p); SFX ≤ 3 por 10 s.
- **Portfólio/case**: `result-first` + `device-3d` + `stack-proof` + `kpi-row`, fundo escuro dominante, música discreta, quase sem fala.

---

## 12. Evidências

- **ref01**: ícone com badge e wobble (T13) → card de fotos que expande → zoom-through numa foto → mapa; loop A-B; música contínua.
- **ref02**: pílula "+ New" + cursor, card-swap com blur (T3) e spin-out com motion blur (T4); música alta e contínua.
- **ref03**: palavras chegando com blur (T1), seleção iOS + punch-in (T14), contador com glow em fundo navy (T16), stack-push de vídeo sobre card (T10), pilha de avatares, máscara circular.
- **ref04**: narrativa completa por capítulos de fundo (claro/escuro): pílula desenhada (T6), clique + ripple + white-out (T5), shrink-to-cut + device 3D (T7), KPIs com foco por profundidade (T16); música + SFX (19 onsets/10 s).
- **ref05**: mensagem/chat entrando com blur, grade de cards, frase em ticker com motion blur forte em fundo escuro (T2).
- **ref06**: céu → campo como camada que desce (T12), dock de apps, mensagem digitada, notes com texto se escrevendo, ícone "fn"; mix final com música.
- **ref07 / ref08** (iguais): mesma peça da ref06 só com SFX + timeline visível — whooshes, "4 typing", "Button", "Key", "Glitch", "Dreamy Whoosh"; silêncio entre eventos.
- **ref09**: palavra a palavra → corte para fundo verde com ticker blur (T2), controle 3D com cartas em parallax, color-flood vermelho (T11), frase com ícone embutido (inline-icon-sentence).
- **ref10**: busca com bloom (T13), marcador vermelho (T15), colagem em parallax com tipografia de tamanhos mistos; música contínua.
- **ref11**: SFX isolados da ref10 com timeline ("Short Whoosh", "Enter", "ui-", "Gran…", "SMOOTH") — densidade alta de cliques miúdos.
- **ref12**: barra de navegador → "new way of searching is here" com mesh gradient, "how to find this [Figma/Ps] files?" com ícone trocando, "Use AI" em fundo preto; timeline de SFX com "Short Whoosh", "Dreamy Whoosh", "Transform".
- **ref13**: única com apresentadora: card do YouTube → whip para o título (T8) → notas com push-out → blur-cut para o rosto (T9) com legenda por frase; voz por baixo desde o frame 0 (J-cut).
