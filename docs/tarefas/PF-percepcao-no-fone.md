# PF · Percepção no fone — a revisão do Paulo de 09/11/2026

Ele passou a rotina `ouvido-no-fone` exercício por exercício. Este documento é o plano de registro:
o que ele decidiu, o que eu verifiquei, e o que ainda falta decidir.

---

## 0. As quatro perguntas dele, respondidas com o código na mão

### "Tonalidade livre e material cromático não são a mesma coisa?"

**Não, e há uma pegadinha.** São eixos diferentes:

| | o que diz |
|---|---|
| **tonalidade** | onde a música se assenta. `livre` = cada pergunta sorteia um centro |
| **material** | quais das doze notas o app pode sortear dentro dela |

A pegadinha está em `soDiatonico`:

```ts
export const soDiatonico = (ctx: Ctx) =>
  ctx.params.material === 'diatonico' && ctx.params.key !== null;
```

**Material só faz alguma coisa quando há tonalidade fixa.** Com tonalidade livre não existe escala
pela qual filtrar, e `pcsPermitidas` devolve as doze — então escolher `cromático` ou `diatônico` ali
**não muda nada**. O controle fica na tela parecendo que faz algo, e não faz.

👤 **Decisão para o Paulo:** esconder o controle de material quando a tonalidade é livre
(`Setting.quando` já faz isso), ou deixá-lo e explicar. Recomendo esconder — controle morto ensina
a pessoa errado.

### "Fixar dó maior gera só variações de acordes de dó, não o campo. Não é o que está acontecendo?"

**É exatamente o que está acontecendo, e você está certo.** Em `ouvido-acorde`:

```ts
const root = tonicaNaRegiao(ctx, { lo: 53, hi: 64 });   // com dó maior fixo, devolve SEMPRE um dó
const ms = CHORDS[type].degs.map(([, semi]) => root + semi);
```

Fixar a tonalidade prende a **fundamental** na tônica. Saem Dó maior, Dó menor, Dó7, Dó°… todas as
qualidades sobre dó.

Isso não é bug acidental: o item é de **qualidade** (`skillTags: ['ear.chord_quality']`), e prender
a fundamental isola a qualidade de verdade — some a variação de altura e sobra a cor. É um exercício
legítimo. Só não é o que você quer quando fixa uma tonalidade, e o nome não avisa.

**Daí a sua própria sugestão resolver:** renomear para *qualidades de acordes*, e o campo harmônico
virar o exercício novo da seção 5.

### "Material cromático e incluir teclas pretas não são a mesma coisa?"

**Em dó maior, são. Em qualquer outra tonalidade, não — e podem brigar.**

- `pretas: false` tira as classes 1, 3, 6, 8 e 10 **sempre**, tonalidade ou não;
- `material: diatonico` deixa as sete da tonalidade, **só com tonalidade fixa**.

Em dó maior as sete da escala são as sete brancas: coincidem. Em fá maior, o diatônico inclui **si♭**
— que é tecla preta — e exclui si. Com `pretas: false` ligado, o si♭ some, e o exercício fica sem
um grau da tonalidade.

👤 **Decisão:** `pretas` deveria deixar de existir e virar material (`diatônico`/`cromático`), ou
continuar como atalho de "só brancas"? Recomendo **trocar por material**: hoje são dois controles
para a mesma pergunta, e num deles a resposta está errada fora de dó.

### "Que nota tocou é redundante com intervalos de ouvido?"

**Parcialmente, e o jeito de desfazer a redundância é escolher o que ele treina.**

Com `referencia: true` o item toca dó e depois a nota — é um intervalo a partir de dó. A diferença
com `ouvido-intervalo` não é o estímulo, é **a resposta**: lá você nomeia o intervalo, aqui você
**acha a nota no teclado**. O `skillTags` já diz: `keyboard.note_finding`.

Na verdade a vizinhança mais próxima não é com intervalos — é com o atalho *Uma nota (escala maior)*
do `ouvido-celulas`, que é literalmente "ouvir uma nota contra um contexto e dizer que grau é".

👉 **O que proponho:** manter, com o propósito explícito de **achar no teclado**, e usar a
referência como o eixo que o separa:

- `referencia: true` + dó maior → "que grau é", respondido no teclado. Porta de entrada;
- `referencia: false` + tonalidade livre → nomear a altura sem âncora, que é outra habilidade e
  **nenhum outro item treina**.

### "Onde está a audiação nas rotinas?"

**Em lugar nenhum.** `audiar` existe (a família `X3` entrou), é `mobile: true` e `requires: {}` —
roda no ônibus — e **não está em nenhuma das seis rotinas do time**. Além disso é `RASCUNHO`, então
está invisível sem `?revisao=1`.

É provavelmente o maior desperdício atual: construído, bom para o uso dele, e inalcançável.

---

## 1. A rotina

- **Renomear** `ouvido-no-fone` → **"Percepção melódica e harmônica no fone"**. ✅ decidido
- **Sair:** `ritmo-ouvido` — vai para a rotina nova de percepção rítmica. ✅ decidido
- **Entrar:** audiação. 👤 em que posição?
- `ouvido-tecla` entre as **primeiras**. ✅ decidido

### As etapas, como ficam

| # | etapa | configuração |
|---|---|---|
| 1 | Que nota tocou? | referência ligada, dó maior |
| 2 | Intervalos **melódicos** | todos, subindo, dó maior |
| 3 | Intervalos **harmônicos** | todos, juntas, dó maior |
| 4 | Qualidades de acordes | **todas**, uma etapa só |
| 5 | Escalas e modos | **todas**, uma etapa só |
| 6 | Melodia na harmonia · **1 nota** | sem alternativas, dó maior, acorde I |
| 7 | Melodia na harmonia · **3 notas** | sem alternativas, dó maior, acorde I |
| 8 | Graus do campo harmônico | exercício novo, seção 5 |
| 9 | Audiação | 👤 posição |

Tétrades e modos deixam de ser etapas próprias: viram parte das etapas 4 e 5, "tudo ligado".

---

## 2. Mudanças em exercícios que já existem

### `ouvido-intervalo`
- padrão **dó maior** e **todos os intervalos** → via atalhos, que são a entrada do item;
- atalhos propostos: *Todos, melódicos (dó maior)* · *Todos, harmônicos (dó maior)* · *Melódicos,
  tonalidade livre* · os saltos grandes.

### `ouvido-acorde` → 👤 renomear para **qualidades de acordes**?
- padrão **todas as qualidades** (o atalho `tudo` já existe — basta ser o primeiro);
- **inversões**: `buildChord(root, id, inversion)` **já existe em `theory/core.ts`** e nenhum item de
  ouvido usa. Entra como configuração;
- **ver o acorde no piano ou no braço**, por botão. Reaproveita `partes` do Player? Não: `partes`
  toca pedaços. Isto é uma **revelação visual sob demanda** — superfície nova no Player, e é a peça
  de maior trabalho desta lista.

### `ouvido-escala`
- padrão **todas**, uma etapa só.

### `ouvido-celulas` (Reconhecer melodia na harmonia)
- **dois modos de resposta**: com alternativas (hoje) e **sem** — selecionar cada grau entre todos.
  Na rotina dele, o padrão é **sem**;
- padrão geral: **dó maior**, acorde de contexto **I**;
- duas etapas na rotina: **1 nota** e **3 notas**.

> ⚠️ O modo sem alternativas muda a superfície de resposta: deixa de ser `choices` e vira "montar a
> sequência". Não existe superfície dessas no Player. É trabalho real, não configuração.

### `ouvido-tecla` (Que nota tocou?) — 🐛 bug confirmado
O som sorteia em **MIDI 48–83** e o teclado desenhado é **60–71**:

```ts
const m = alturaDoPc(ctx, p, { lo: 48, hi: 83 });
surface: { kind: 'keyboard', lo: 60, hi: 71 },
```

Soa um ré3 e não há tecla de ré3 — por isso ele clicava uma oitava acima. A resposta é por **classe
de altura**, então clicar a oitava errada acerta; o que está errado é a tela mentir sobre o que
soou. Conserto: o teclado passa a cobrir a faixa que de fato soa.

---

## 3. A rotina nova: Percepção rítmica

- `ritmo-ouvido`, vindo da outra rotina, com **alternativas mais difíceis** (seção 4);
- `ritmo` (leitura rítmica) em **quatro etapas**: ① só pontuadas · ② só quiálteras · ③ pontuadas,
  síncopes e ligaduras · ④ tudo.

---

## 4. `ritmo-ouvido`: alternativas que não se descartam de olho

Mesma lógica da assinatura de repetição que entrou hoje no `ouvido-celulas`: **o distrator tem de
compartilhar com a resposta certa as propriedades grosseiras que se veem sem ouvir.** Se o ritmo
certo não tem semibreve, nenhum distrator tem.

O que casar, a confirmar na implementação: o conjunto de figuras usadas, a quantidade de ataques, e
a presença de pausa.

---

## 5. Exercício novo: graus do campo harmônico

Desenho do Paulo:

> toque uma escala pra dar contexto harmônico e em seguida toque um acorde daquele campo harmônico e
> tem que adivinhar qual é. Pode tocar a escala ou o acorde separado, se quiser. Ao invés de uma
> escala, pode ser o acorde da tônica. Pode escolher entre tríades e tétrades, incluindo as
> inversões.

Encaixa no que já existe: `harmonicField` em `theory/core.ts` dá os sete acordes com grau e cifra;
`acordeDoCampo` (de `padrao-de-escala.ts`) empilha terças inclusive em pentatônica; `partes` no
Player já toca pedaços, que é o "pode tocar a escala ou o acorde separado".

---

## 6. Inversões: exercício à parte, ou atalho? 👤

Ele perguntou. **Minha recomendação: atalho do exercício de campo harmônico, não item novo.**

Dizer "qual inversão" exige um acorde com função — numa qualidade solta sobre dó, a inversão é só
uma cor. No campo, a inversão é o que distingue um I de um V com a terça no baixo, e é aí que ela
importa. E a decisão 15 existe para evitar item novo onde cabe parâmetro.

---

## 7. Leitura de partitura mais customizável 👤

Ele pediu **maior salto de nota** e **contexto harmônico para audiar** — e disse que há "várias
outras coisas". Não dá para planejar com isso: **preciso da lista dele.**

Sobre o contexto, a pergunta que ele fez (escala ou nota?): recomendo **as duas, configurável**,
porque são propósitos diferentes — a nota só dá a referência de altura, a escala dá a tonalidade. É
a mesma distinção de `referencia` no `ouvido-tecla`.

---

## 8. Ordem proposta

1. 🐛 o teclado do `ouvido-tecla` (bug, pequeno);
2. atalhos de entrada em `ouvido-intervalo`, `ouvido-acorde` e `ouvido-escala` — "tudo, em dó maior";
3. a rotina: renomear, tirar o ritmo, pôr audiação, reordenar;
4. rotina nova de percepção rítmica, com as quatro etapas de leitura;
5. alternativas de `ritmo-ouvido`;
6. inversões em `ouvido-acorde`;
7. exercício do campo harmônico (+ atalho de inversões);
8. modo sem alternativas no `ouvido-celulas` — superfície nova;
9. ver o acorde no piano/braço — superfície nova;
10. leitura de partitura, depois da lista dele.
