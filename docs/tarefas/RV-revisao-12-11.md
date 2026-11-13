# RV · Revisão do Paulo em 12/11/2026

Ele testou boa parte do app (não tudo) e anotou. Esta lista é o registro fiel; o estado de cada
item é atualizado aqui conforme o trabalho anda. Itens de decisão esperam a resposta dele.

## Bugs (sem ambiguidade — arrumar)

| # | onde | o quê | estado |
|---|---|---|---|
| B1 | `nota-na-pauta` (escrever) e `intervalo-na-pauta` | **acidente fora da tonalidade**: Sol maior + material "só a tonalidade" pede Fá♭; em dó maior idem. O filtro de material não está valendo | ⏳ |
| B2 | `nota-no-instrumento` (baixo/guitarra) | **oitava errada no som**: Fá da casa 3 da corda Ré soou mais grave que o Si da corda Lá casa 2 | ✅ o ataque da corda durava no máximo 6 ms, mas o laço de uma grave dura 16–24 ms: só um terço do atraso recebia energia e a fundamental virava sorteio — em 56 de 120 casos o 2º harmônico vencia e a nota soava uma oitava acima, invertendo a ordem entre posições. Estouro triangular (como uma corda pulsada de verdade) + ruído: 0 falhas em 120, teste permanente |
| B3 | `nota-na-pauta`/`acorde-na-pauta` (audiar) | sem botão de contexto, sem ouvir a resposta, e "consegui" toca sempre o mesmo dó | ⏳ |
| B4 | `pauta-armadura` | a armadura de dó maior (sem acidentes) sai maior que as outras e desloca a interface | ✅ o `viewBox` da pauta dependia do número de acidentes e o piso de 320 px dava a todas a mesma largura na tela — três escalas diferentes, e dó maior a maior de todas. Largura máxima agora é proporcional ao `viewBox` |
| B5 | `ouvido-tecla` (modo claro) | cores das teclas do piano invertidas | ✅ o teclado usava `--cream`/`--bk`, apelidos de `--ink`/`--ground`, que INVERTEM com o tema. Agora tem `--key-white`/`--key-black`, fora dos blocos de tema: medido, luminância 243 e 30 nos dois temas |
| B6 | `ouvido-escala` | a resposta vaza: dá para saber a escala só pela nota inicial citada nas alternativas | ⏳ |

## Melhorias decididas (ele já escolheu — fazer)

| # | onde | o quê | estado |
|---|---|---|---|
| M1 | `ouvido-campo` | pausa maior entre contexto e acorde | ✅ grupo VAZIO em `groups` é um respiro de um `gap` — medido: 0,45 s de silêncio entre contexto e alvo |
| M2 | `ouvido-campo` | **arpejar só o acorde-alvo**, não o contexto | ✅ `SoundContent.arpejaveis` diz quais grupos o arpejo alcança; o item põe só o alvo. Medido: contexto em bloco, alvo nota por nota |
| M3 | `ouvido-campo` | presets: campo menor tríades · menor com empréstimos | ✅ menor tríades e menor com empréstimos (cinco) — sete atalhos no item |
| M4 | `acorde-no-instrumento` | opção de arpejar | ✅ o mesmo toggle de `ouvido-acorde`, com a mesma camada de apresentação |
| M5 | vários | **região só onde é altura**: no braço já existe "região do braço"; esconder "região" (MIDI) nos itens de braço — conferir todos | ⏳ |
| M6 | `nota-no-instrumento` | braço TODO como padrão (baixo e guitarra) | ✅ casas 0–12 por padrão: recorte é escolha, não entrada |
| M7 | `nota-no-instrumento` | escolher **quais cordas** entram (padrão: todas) | ⏳ |
| M8 | `nota-no-instrumento` | modo de pedir **altura específica** (ex.: E1) — parâmetro, não padrão | ⏳ |
| M9 | todos com série | **feedback de acerto mais visível** — animação rápida e não exagerada | ✅ a resposta certa pulsa uma vez, 280 ms, na cor que já marcava o acerto; nada em `prefers-reduced-motion` |
| M10 | `nota-na-pauta` | região por **nota mínima e máxima**, não só "linha suplementar sim/não" | ⏳ |

## Decisões dele pendentes (perguntadas em 12/11)

| # | assunto | proposta enviada |
|---|---|---|
| D1 | **responder pelo teclado físico** (números já existem; letras para notas, com acidente) | letra = natural; `♯` = apertar `3` ou `+` depois da letra; `♭` = `-` depois da letra; eco na tela do que foi montado. Ctrl está fora (atalhos do navegador) |
| D2 | **simplificar tonalidade na pauta**: tonalidade escolhida → armadura automática; "sustenidos/bemóis" e "cromático/só tonalidade" só fazem sentido SEM tonalidade | sim, com detalhe por item no doc |
| D3 | **agrupar os itens de pauta numa área de leitura** do catálogo | conversa própria de produto — não cabe num item de revisão |
| D4 | `material cromático` × `tonalidade livre` — redundantes? | em parte: com tonalidade livre, material não faz nada → esconder material quando a tonalidade é livre |
| D5 | **atalhos (presets) visíveis fora do Personalizar** | ele mesmo disse que pode esperar — fica registrado |

## Notas de implementação

Preenchidas conforme cada item é investigado — a causa de cada bug entra aqui quando é encontrada,
não antes.
