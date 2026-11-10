# P6 · Auditoria de opções redundantes

> **Isto é um relatório, não uma mudança.** Nenhum item teve nada removido. Tirar opção da tela é
> decisão do Paulo (regra nº 1) — este arquivo só organiza o que achei para ele decidir, com o
> código que sustenta cada achado.

Partiu de dois exemplos dados na revisão de 04/11: *"tonalidade + material cromático dizem a mesma
coisa"* e *"região grave/média/aguda não tem função clara em vários itens"*. Os dois se confirmaram
— e o segundo é mais forte do que a frase sugeria.

---

## 1. "Região" — média e toda são a mesma coisa, sempre

**O mecanismo em si está certo.** `regiao()` ([contexto-musical.ts:63](src/catalog/contexto-musical.ts:63))
intersecta a região global com a faixa do próprio item, e só aperta — nunca alarga. Isso é bom
desenho. O problema é outro: **nenhum item tem faixa própria maior que "Média" (48–72)**, então a
intersecção com "Toda" (36–84) nunca é diferente da intersecção com "Média". Toda vira um sinônimo
de Média, em todo item que usei para conferir:

| Item | Faixa do item (MIDI) | Grave ∩ | Média ∩ | Aguda ∩ | Toda ∩ |
|---|---|---|---|---|---|
| `ouvido-acorde` | 53–64 | 53–60 | **53–64** | 60–64 | **53–64** |
| `ouvido-escala` | 55–62 | 55–60 | **55–62** | 60–62 | **55–62** |
| `ouvido-celulas` | 57–64 | 57–60 | **57–64** | 60–64 | **57–64** |
| `audiar` (2×) | 55–64 | 55–60 | **55–64** | 60–64 | **55–64** |
| `ouvido-intervalo` | 52–67 | 52–60 | **52–67** | 60–67 | **52–67** |
| `que-acorde-e-esse` (teclado) | 48–72 | 48–60 | **48–72** | 60–72 | **48–72** |
| `que-nota-e-essa` (1 oitava) | 48–59 | **48–59** | **48–59** | 48–59* | **48–59** |

*\* em `que-nota-e-essa` com "1 oitava", a interseção com Aguda dá vazia (60 > 59), e a função cai
de volta pra faixa do item — as QUATRO opções de região viram idênticas. O controle existe na tela
e não faz nada, com essa única configuração.*

**Por que isso aconteceu:** ninguém decidiu "nenhum item vai além de 48–72" — é consequência de
cada item ter sido escrito com uma faixa confortável de registro vocal/instrumental médio, e a
região global ter sido pensada depois, por cima. As duas decisões fazem sentido isoladas; juntas,
"Toda" nunca cumpre o que promete.

**Não confirmei** `ache-a-nota` e `faca-o-intervalo`: eles combinam a região global com uma faixa
em **graus da pauta** (`stepRange`), não em MIDI puro como os outros — o cálculo é outro, e eu não
quis afirmar o mesmo resultado sem rastrear os números a sério.

**👤 O que decidir:** três saídas, não exclusivas —
1. Tirar "Toda" da lista (ela nunca faz nada hoje);
2. Dar aos itens uma faixa própria de fato mais larga, pra "Toda" passar a significar algo;
3. Deixar como está — "região" ainda comunica intenção mesmo sem mudar o resultado, e simplificar
   pode não valer o custo de revisar sete itens.

---

## 2. `que-acorde-e-esse`: "Região" aparece pra todo mundo, e só funciona pra 1 pessoa em 3

Este item declara `respeita: ['key', 'range', 'material']`
([que-acorde-e-esse.ts:12](src/catalog/items/que-acorde-e-esse.ts:12)), e por isso o controle de
Região aparece sempre que alguém o abre. Mas ele tem três superfícies — **pauta** (padrão), teclado,
braço — e `range` só é lido na superfície **teclado**
([que-acorde-e-esse.ts:31](src/catalog/items/que-acorde-e-esse.ts:31)):

- **Pauta** (quem abre o item pela primeira vez cai aqui): a fundamental vem de `pcPermitido(ctx)`
  com **oitava fixa no código** (`clef === 'sol' ? 4 : 2`) — `range` nunca é consultado.
- **Braço**: vai inteiro por `guitarChordQuestion`, que não toca em `ctx.params`.
- **Teclado**: aqui sim, `range` entra via `alturaDoPc(ctx, pcRaiz, { lo: 48, hi: 72 })` — e essa
  faixa do item já é exatamente "Média", então o achado 1 também se aplica aqui.

**👤 O que decidir:** o controle devia **sumir** fora da superfície teclado (como `claves`,
`inversões` e `formas` já fazem com o `quando` — ver linhas 16, 19 e 21 do mesmo arquivo), ou
`range` devia passar a valer nas três? A primeira é a correção mais barata e mais parecida com o
que o resto do item já faz.

---

## 3. Tonalidade + material cromático: a tonalidade fica inerte, e a grafia que a salvaria não existe

Confirmado: com `material: 'cromatico'`, `pcsPermitidas()`
([contexto-musical.ts:39](src/catalog/contexto-musical.ts:39)) devolve as doze classes de altura
**sem olhar pra `key`**:

```ts
export function pcsPermitidas(ctx: Ctx): number[] {
  const k = ctx.params.key;
  if (!soDiatonico(ctx) || !k) return Array.from({ length: 12 }, (_, i) => i);
  ...
```

Ou seja: nos oito itens que mostram tonalidade **e** material juntos — `ache-a-nota`,
`ouvido-tecla`, `que-intervalo-e-esse`, `que-acorde-e-esse`, `faca-o-intervalo`, `pauta-escala`,
`que-nota-e-essa`, `ouvido-intervalo` — fixar uma tonalidade com material em "Cromático" não muda
**qual nota sai**, só o que o painel mostra escrito.

Fui ver se ao menos a **grafia** (Dó♯ vs Ré♭) ainda mudava com a tonalidade nesse caso — existe uma
função pra isso, `notaGrafada` ([contexto-musical.ts:152](src/catalog/contexto-musical.ts:152)),
documentada como *"o que impede Lá♯ de aparecer em Fá maior"*. Ela **não é chamada por nenhum item
do catálogo** — só aparece na própria definição e na tabela do teste que confere o que cada função
lê. É código morto: escrito, testado no sentido de "declara os parâmetros certos", mas nunca
exercido. (Separe isso do resto: a grafia por tonalidade que o `theory/core.ts` resolve em outros
lugares — a regra que o CLAUDE.md protege — continua funcionando; é só esta função específica,
pensada pra este caso, que não é usada.)

Então a frase do Paulo está certa sem ressalva: com material cromático, tonalidade **não faz nada
visível**, nem na nota sorteada nem na grafia.

**O painel já avisa a metade disso.** `PracticePanel.tsx:88` mostra um aviso quando `material:
'diatonico'` e `key: null` — *"sem tonalidade fixada, isto não restringe nada"*. Não existe o aviso
simétrico para `material: 'cromatico'` com uma tonalidade fixada.

**👤 O que decidir:**
1. Fundir os dois controles num só? (Ex.: "Tonalidade" com um valor extra "Livre (cromático)" no
   lugar de dois eixos separados — mas isso é desenho de interface, não decido sozinho.)
2. Manter os dois, e só **avisar** na direção que falta (espelhar o aviso que já existe)?
3. Fazer `notaGrafada` valer de verdade nos itens de pauta, pra material cromático ainda mudar a
   grafia mesmo sem mudar a nota — e aí os dois controles deixam de ser 100% redundantes?

---

## O que *não* achei redundante, e por quê

- **`instrumento` por item** (`ache-a-nota`, `que-nota-e-essa`, braço/teclado) contra `instrument`
  do perfil: não é sobreposição, é o padrão de camadas do próprio app — `'auto'` cai pro perfil,
  e só sobrescreve quando a pessoa força violão ou baixo pra aquele exercício específico
  ([helpers.ts:285](src/catalog/helpers.ts:285)). Funciona como documentado.
- **`range` nos itens que só respeitam `key`** (`ouvido-acorde`, `ouvido-escala`,
  `ouvido-celulas`, sem `material`): aqui `tonicaNaRegiao` ignora `material` de propósito — esses
  itens nunca mostram o controle de material, então não há promessa quebrada.

---

## Como cheguei nisso, pra você poder conferir

`grep -rn "respeita:" src/catalog/items/*.ts` deu a lista de quem declara o quê. Pra cada item que
declara `range`, segui até onde ele chama `regiao()`, `alturaNaRegiao()`, `tonicaNaRegiao()` ou
`alturaDoPc()` e computei a intersecção à mão contra as quatro `REGIOES` ([regioes.ts](src/catalog/regioes.ts)).
Pra `key`+`material`, segui a cadeia `pcsPermitidas → soDiatonico` e procurei todo lugar que ainda
lê `ctx.params.key` fora dela — foi assim que `notaGrafada` apareceu, e o grep confirmou que não é
chamada por ninguém.
