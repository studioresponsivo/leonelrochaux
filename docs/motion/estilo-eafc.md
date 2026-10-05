# Estilo EA FC — canal 2 (modo carreira)

Referências do Leonel (Drive › "Assets para os videos"): **"Estilo de edição.mp4"** (S2G, Man United career) e **"estilo visual.mp4"** (Neto EA FC, Totti/Roma). O motor fica em `studio/engine/eafc/` e é acionado por `"style": "eafc"` no roteiro. Fonte: facecam já cortada no Premiere (`"cuts": "all"`), áudio e luz já tratados (o make não filtra a voz, só limita o pico).

## O que foi tirado de cada referência
**S2G (edição / gráficos de transmissão)**
- Transição-assinatura: **whip-zoom com motion blur direcional, 0,3–0,4 s** (`whip`, `zoom`). Cortes secos para cutaways; **1 flash** branco por bloco de contexto.
- Overlays **deslizam com motion blur (0,2–0,3 s) e ficam estáticos** no hold: tweet desce de cima (canto) ou sobe (centro), stat card sobe de baixo e sai descendo, linhas de ficha entram em stagger de ~0,35 s.
- Prova social: **cards de tweet** (dark 85 % ou branco), 1 por bloco, no terço inferior, ~800×260 px.
- Gráficos de broadcast: escudos gigantes com glow sobre estádio desfocado, **duelo de escudos** com × no meio, **blocos de cor do time com abreviação** (MCI | MUN), tabela TEAM/PTS, ficha W-D-L com dígitos enormes, seta vermelha de anotação, TV antiga com foto/ano.
- Tipografia: condensada pesada caixa-alta (Anton/Oswald) para títulos de arte; geométrica extra-bold (aqui **Articulat CF**) para rótulos e tweet; número de destaque em **amarelo**.
- Ritmo em gameplay: 1 recurso a cada 20–60 s; em menus/narração 1 a cada 5–10 s. Hold típico 2–3 s (tweet 3–7 s).

**Neto EA FC (visual / cinema)**
- **Texto gigante atrás do rosto** (serifa Playfair 900 ou condensada), palavra a palavra na fala — exige recorte do rosto (`behind: true` → `hyperframes remove-background` no trecho; ~0,8 s por quadro na CPU, então só em 2–3 momentos por vídeo).
- Punch-ins frequentes no rosto (1,0 ↔ 1,14 automático a cada frase; 1,2–1,26 explícito nas frases-chave).
- Fotos com Ken Burns, duotone vermelho/azul, textura grunge, flash de cor, glitch RGB, carimbo de data pequeno e digitado ("28 de janeiro de 2020 — Villa Park — 93'").
- Legendas pequenas e discretas embaixo (Articulat 700 40 px, palavra-chave em amarelo); somem nas cenas cheias.
- Cartela de título em serifa sobre textura (usar com parcimônia; o gancho termina no rosto).

## Paleta e fontes
- Time do canal: Leicester azul `#0053A0` + dourado `#FDBE11` (acento/legendas). Times: `TEAMS` em `plan.mjs` (arsenal, manchester-united, aston-villa, liverpool, premier-league, league-one).
- Fundo escuro `#07070c` com radial da cor do time + `.grunge` (feTurbulence estático).
- Fontes (`studio/assets/fonts-eafc/`, OFL): **Anton** (display), **Oswald 500/600/700** (condensada), **Playfair Display 700/900 + 900 italic** (serifa). Marca: **Articulat CF** (`fonts-marca/`, não versionada) para legendas, rótulos, tweet; sem ela cai em Plus Jakarta Sans.

## Gramática (regras)
1. Abrir frio com gráfico (número, escudo, foto) e **entregar o rosto na 2ª frase** com punch-in.
2. **1 ideia por cena**; algo muda a cada 1–1,5 s (punch, overlay, cutaway). Nunca dois overlays no mesmo canto ao mesmo tempo.
3. Rosto escondido no máximo ~8 s seguidos; entre cenas cheias, ou colar (transição direta) ou deixar ≥ 0,7 s de rosto.
4. Cada entrada de cena cheia tem **1 hit** (impact-bass) ou whoosh; overlays têm pop/click/notification; `stamp` digitado tem typing. Limitador: 7 SFX audíveis/10 s, 2 empilhados.
5. Texto atrás do rosto só com matte (`behind: true`); na frente (`behind: false`) use tamanhos menores e cantos.
6. Variação: `studio/specs/historico-eafc.json` guarda padrões/transições; não repetir a sequência do gancho anterior; whip/zoom/glitch/flash no máximo 3× cada por gancho.
7. Música: cama de tensão sintética (`studio/bin/trilha.py`: drone + pulso a partir da virada + riser no final) a 0,14–0,18 de volume; trocar por trilha licenciada quando houver (`"music": {"file": …}`).

## O que matou a "cara de IA" (v2, depois do feedback do Leonel)
- Sem legendas. Nada repete a fala; só palavras-arte (serifa cromada/dourada atrás da cabeça) e uma linha pequena de data/lugar.
- Nada flutua no vazio: todo gráfico mora num objeto ou numa chapa com textura — TV de tubo (placar antigo), painel LED (90', 93'), foto em parallax com vazamento de luz e poeira, faixas de cor com listras em movimento, escudos como adesivos com traço branco (S2G) ou com névoa e reflexo (herói).
- Câmera viva no rosto: punch-in por frase, zoom-out ao voltar de cena cheia, deriva na mão, grade + vinheta; letterbox 2.35 marca "arquivo"; freeze com boom no fechamento.
- Cortes com peso: flash preto→cor→branco (`cutflash`), aberração cromática nos hits, flash-frame subliminar, sub-drop antes dos impactos, ambiente de estádio sob estádios.
- Grão de filme animado por cima de tudo. Proibido: cards arredondados "dashboard", gradiente radial liso, halo neon atrás de PNG, cursor digitando, carimbo em cima dos olhos.

## Cenas disponíveis (ver `studio/SPEC.md` › EA FC)
`number` · `crest` (hero / duelo) · `split` · `photo` · `score` (+flip) · `record` · `ladder` · `fixtures` · `title` · `montage` — cheias; `word` · `stamp` (digitado / rubber) · `tweet` · `badge` — overlays; `punch` · `shake` · `lights` · `flash` · `sfx` — modificadores.
