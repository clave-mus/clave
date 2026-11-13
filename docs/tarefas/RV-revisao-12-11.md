# RV · Revisão do Paulo em 12/11/2026

Ele testou boa parte do app (não tudo) e anotou. Esta lista é o registro fiel; o estado de cada
item é atualizado aqui conforme o trabalho anda. Itens de decisão esperam a resposta dele.

## Bugs (sem ambiguidade — arrumar)

| # | onde | o quê | estado |
|---|---|---|---|
| B1 | `nota-na-pauta` (escrever) e `intervalo-na-pauta` | **acidente fora da tonalidade**: Sol maior + material "só a tonalidade" pede Fá♭; em dó maior idem. O filtro de material não está valendo | ✅ o filtro de material era por CLASSE DE ALTURA: em Sol maior a classe 4 é permitida (é o Mi) e `Fá♭` tem classe 4, então passava. Agora, **com tonalidade fixa a armadura dita a grafia** (`applyKey`) — medido: 500 perguntas em Sol maior, só as sete notas da tonalidade, zero fora |
| B2 | `nota-no-instrumento` (baixo/guitarra) | **oitava errada no som**: Fá da casa 3 da corda Ré soou mais grave que o Si da corda Lá casa 2 | ✅ o ataque da corda durava no máximo 6 ms, mas o laço de uma grave dura 16–24 ms: só um terço do atraso recebia energia e a fundamental virava sorteio — em 56 de 120 casos o 2º harmônico vencia e a nota soava uma oitava acima, invertendo a ordem entre posições. Estouro triangular (como uma corda pulsada de verdade) + ruído: 0 falhas em 120, teste permanente |
| B3 | `nota-na-pauta`/`acorde-na-pauta` (audiar) | sem botão de contexto, sem ouvir a resposta, e "consegui" toca sempre o mesmo dó | ✅ 12/11: o `Listen` só renderizava com visual `ear`, e nas quatro direções `audiar` o visual é a pauta ou o braço — o botão que o comentário do código prometia nunca existiu. Agora os pedaços aparecem onde o item os declara, sem o botão grande (que tocaria o contexto como se fosse a pergunta). E ao responder toca a **resposta**, não o contexto: era de lá que vinha o "mesmo dó" |
| B4 | `pauta-armadura` | a armadura de dó maior (sem acidentes) sai maior que as outras e desloca a interface | ✅ o `viewBox` da pauta dependia do número de acidentes e o piso de 320 px dava a todas a mesma largura na tela — três escalas diferentes, e dó maior a maior de todas. Largura máxima agora é proporcional ao `viewBox` |
| B5 | `ouvido-tecla` (modo claro) | cores das teclas do piano invertidas | ✅ o teclado usava `--cream`/`--bk`, apelidos de `--ink`/`--ground`, que INVERTEM com o tema. Agora tem `--key-white`/`--key-black`, fora dos blocos de tema: medido, luminância 243 e 30 nos dois temas |
| B6 | `ouvido-escala` | a resposta vaza: dá para saber a escala só pela nota inicial citada nas alternativas | ✅ era o `pauta-escala`: as alternativas misturavam mesma tônica com tipos diferentes e tônicas diferentes com o tipo certo — e com um tipo só marcado (o padrão) a resposta era a ÚNICA com a tônica certa. Agora **todas as alternativas têm a mesma tônica** e diferem só no tipo; teste trava o invariante |

## Melhorias decididas (ele já escolheu — fazer)

| # | onde | o quê | estado |
|---|---|---|---|
| M1 | `ouvido-campo` | pausa maior entre contexto e acorde | ✅ grupo VAZIO em `groups` é um respiro de um `gap` — medido: 0,45 s de silêncio entre contexto e alvo |
| M2 | `ouvido-campo` | **arpejar só o acorde-alvo**, não o contexto | ✅ `SoundContent.arpejaveis` diz quais grupos o arpejo alcança; o item põe só o alvo. Medido: contexto em bloco, alvo nota por nota |
| M3 | `ouvido-campo` | presets: campo menor tríades · menor com empréstimos | ✅ menor tríades e menor com empréstimos (cinco) — sete atalhos no item |
| M4 | `acorde-no-instrumento` | opção de arpejar | ✅ o mesmo toggle de `ouvido-acorde`, com a mesma camada de apresentação |
| M5 | vários | **região só onde é altura**: no braço já existe "região do braço"; esconder "região" (MIDI) nos itens de braço — conferir todos | ✅ o painel esconde a Região quando a pergunta é no braço, onde a unidade é a faixa de CASAS. Sai da pergunta em vigor, não de uma tabela de itens |
| M6 | `nota-no-instrumento` | braço TODO como padrão (baixo e guitarra) | ✅ casas 0–12 por padrão: recorte é escolha, não entrada |
| M7 | `nota-no-instrumento` | escolher **quais cordas** entram (padrão: todas) | ✅ chip de cordas (1ª a 6ª, padrão todas); corda que não existe na afinação é ignorada |
| M8 | `nota-no-instrumento` | modo de pedir **altura específica** (ex.: E1) — parâmetro, não padrão | ✅ "Perguntar: o nome da nota · a altura exata (com oitava)" — com altura, o gabarito é a posição |
| M9 | todos com série | **feedback de acerto mais visível** — animação rápida e não exagerada | ✅ a resposta certa pulsa uma vez, 280 ms, na cor que já marcava o acerto; nada em `prefers-reduced-motion` |
| M10 | `nota-na-pauta` | região por **nota mínima e máxima**, não só "linha suplementar sim/não" | ✅ a região ganhou **nota mínima e máxima** (Dó1 a Dó7), e o parâmetro "extensão" SAIU: os passos da pauta agora saem da região |

## Decisões dele pendentes (perguntadas em 12/11)

| # | assunto | proposta enviada |
|---|---|---|
| D1 | **responder pelo teclado físico** | ✅ aprovado e feito em 12/11: letra monta a nota, `+`/`3` sustenido e `-` bemol **depois** da letra, `Enter` confirma, `Esc` limpa — com eco na tela antes de valer. Ctrl ficou fora (atalho do navegador). Vale na superfície `letters` |
| D2 | **simplificar tonalidade na pauta** | ✅ aprovado e feito em 12/11: a tonalidade escolhida **desenha a armadura** (na pergunta e na pauta de resposta) e dita a grafia; o controle "sustenidos e bemóis" desaparece quando há tonalidade. Clicar a linha do fá em Sol maior já vale Fá♯ |
| D3 | **agrupar os itens de pauta numa área de leitura** do catálogo | ⏳ **conversa de produto, não tarefa** (regra nº 1): reorganizar o catálogo é decisão do Paulo, tomada em conversa própria. Fica registrado |
| D4 | `material cromático` × `tonalidade livre` | ✅ feito em 12/11: material só aparece **com** tonalidade fixa. Sem ela, `diatonico` não restringia nada e o painel avisava isso — oferecer um controle e avisar que não funciona é pior que não oferecer |
| D5 | **atalhos (presets) visíveis fora do Personalizar** | ele mesmo disse que pode esperar — fica registrado |

## O que ainda falta

**D5** — atalhos visíveis fora do Personalizar: ele mesmo disse que pode esperar, por ser questão de
UI/UX mais larga.

## Notas de implementação

- **B1 e B6 eram parentes**, como eu suspeitava, mas não o mesmo bug: os dois vinham de conferir a
  nota pela CLASSE DE ALTURA onde a identidade era outra — a grafia, num caso; a tônica da
  alternativa, no outro.
- A **extensão** (`pauta` / `suplementares`) saiu de `nota-na-pauta` junto com M10. Ela continua
  existindo em `helpers.ts` (`EXT`, `stepRange`) para os outros itens de pauta; quando eles também
  passarem para a região, as duas podem morrer.
