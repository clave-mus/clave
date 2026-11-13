# RE · Onde a reorganização parou

Registro de estado da sessão de 09/11/2026, escrito para sobreviver a um resumo de contexto. Se
você está pegando isto do zero: o que importa está nas mensagens de commit, que são longas de
propósito. Este arquivo é o índice.

## A decisão que organiza tudo

**O eixo do catálogo passa a ser a superfície, não a direção.** Aprovado pelo Paulo em 09/11/2026.

Antes: um item por *direção* (identificar num, produzir no outro), com a superfície como parâmetro.
Agora: um item por *superfície* (pauta / instrumento), com a direção como configuração.

As três evidências que fecharam a decisão, todas no próprio código:

1. `ache-a-nota` declarava **três** `skillTags`, uma por superfície — admitia ser três itens;
2. a **validação** mudava com a superfície: na pauta a resposta é a grafia (Dó♯ ≠ Ré♭), no teclado e
   no braço é a altura;
3. a **extensão** também: `pauta/suplementares`, `1/2 oitavas` e faixas de casa são três unidades
   incomparáveis, escondidas umas das outras com `Setting.quando`.

A direção não muda nenhuma das três. O caro era parâmetro e o barato era item.

**Autorizações dele, para não reabrir:** pode matar o histórico (ids novos deixam tentativas antigas
órfãs); o instrumento é configuração com o do perfil por padrão, e a pessoa muda e salva na rotina.

## O molde, para repetir nos que faltam

Está escrito em `src/catalog/items/nota-na-pauta.ts` e `nota-no-instrumento.ts`. A receita:

| | |
|---|---|
| 1 | dois itens novos, um por superfície, com `direcao` como `Setting` single |
| 2 | o do instrumento tem `INST` com piano acrescentado, e `FRETS` com `quando: s => s.instrumento !== 'piano'` |
| 3 | `catalog.ts`: importa os novos, apaga os velhos |
| 4 | apaga os arquivos velhos |
| 5 | `portas.ts`, `grupos.ts`: troca os ids; quem usava `na(id, 'pauta')` passa a `{ itemId }` |
| 6 | `doTime.ts`: as etapas trocam `superficie` por `direcao` |
| 7 | i18n: título e descrição dos novos nos dois idiomas, e fora os velhos |
| 8 | `taxonomy.test.ts` → `STABLE_IDS`; e os testes que citam os ids antigos |

Esperar **dezenas de testes reprovando**. Todos foram consertados dizendo a verdade nova, nenhum
afrouxado — e dois eram erro meu, não do código. Um sinal de que o eixo novo é o certo: o grupo
"leitura na pauta" tinha o comentário *"ache-a-nota na pauta entra mesmo sendo escrever, não ler"*,
uma justificativa que existia só para remendar a estrutura antiga. Saiu.

## Onde tudo está, em 10/11/2026 ao fim do dia

**A reorganização terminou.** Nenhum item do catálogo tem a configuração `superficie`: a superfície
virou o item, e `SUP`/`porSuperficie` saíram de `helpers.ts` sem chamador. Seis itens, com
`ler/identificar` · `escrever/achar` · `audiar`:

| antes | agora |
|---|---|
| `que-nota-e-essa` + `ache-a-nota` | `nota-na-pauta` · `nota-no-instrumento` |
| `que-intervalo-e-esse` + `faca-o-intervalo` | `intervalo-na-pauta` · `intervalo-no-instrumento` |
| `que-acorde-e-esse` | `acorde-na-pauta` · `acorde-no-instrumento` |

**A ordem de trabalho mora em `OR-ouvido-relativo.md`, §11** — ela é a fonte de verdade do que falta.
Feitos: cache offline, oitava exata, direção `audiar`, reorganização do acorde, cadências, e o
**campo harmônico** com os empréstimos, o **sorteio anti-repetição** no Player e o **piano de
amostras** (12/11).

Falta, em ordem: **relação melodia-harmonia** (exploração 2 e os três quizzes) · **exploração dos
motivos** pela escala.

### As peças que esperavam consumidor — duas saíram

Não foram escritas porque seriam motor órfão — o projeto já teve dois (`digitacoes.ts` com 22 testes
e `padrao-de-escala.ts` com 25 ficaram prontos e inalcançáveis por semanas):

| peça | espera |
|---|---|
| ~~conferência por **contorno**~~ | ✅ feita em 12/11 (`Expected.contorno`) |
| ~~**desenhar o acorde**~~ | ✅ feito em 12/11, em `ouvido-acorde` |
| **absorver o `no-instrumento`** | a superfície que acumula existe agora (`Surface.quantas`); o modo "todas as posições" é o próximo consumidor dela |

### Pontas soltas pequenas

- a **cadência** está ligada só em `reconhecer-padroes-escala`; falta em `ouvido-celulas` e nas
  quatro direções `audiar`, que usam tônica ou tríade;
- as **duas rotinas do Paulo** (reconhecer notas e acordes no violão e no piano; leitura de
  partitura) dependem de nada agora — os itens existem. É montar as etapas em `doTime.ts`;
- `revisao-pendente.md` tem os itens novos listados, e há teste que falha se faltar.

### O que o deploy precisa

A produção sai da **`dev`**, e os dois fluxos a vigiam. Falta só o Paulo pôr
`CLOUDFLARE_API_TOKEN` (modelo *Edit Cloudflare Workers*) e `CLOUDFLARE_ACCOUNT_ID` nos segredos do
repositório. Sem eles o fluxo avisa e passa — e **quem publica hoje é a integração Workers Builds do
Cloudflare**, que funciona na `dev` e falha em branch de PR (esperado).

## Decisões 👤 ainda abertas

1. o texto de abertura de `explorar-padroes-escala` (proposta em `PE-padroes-de-escala.md`);
2. a nota de contexto da frente 2: nota, tríade, ou configurável;
3. o `no-instrumento` continua existindo depois de ceder o modo virtual, ou vira só o modo
   "instrumento real com metrônomo" do item de nota;
4. os atalhos dos doze itens sem atalho (`AT-atalhos-em-todo-exercicio.md`), que ele adiou para a
   esfera "público".

## O que mais foi feito hoje, e onde ler

Sessão longa. Em ordem, com o que cada commit registra:

- `dfd1ab5` motor dos padrões de escala, e o campo harmônico da pentatônica
- `e30cc8c` a melodia deixa de soar mais grave que o acorde (51% → 0, medido)
- `bbc02dd` distrator não denuncia a resposta pela nota repetida
- `53e0b54` a oitava se escreve 8, não `1'`
- `21a6eb0` atalhos como entrada do exercício
- `4791a69` responder entre todos os graus, não entre quatro
- `af4b369` atalhos de entrada em dó maior nos quatro itens de percepção
- `ae8212d` a rotina do fone revisada etapa por etapa
- `84d3900` inversões como dificuldade, e a ambiguidade sus2/sus4
- `f7370bd` alternativas de ritmo que não se descartam de olho (26% → 99%)
- `f048db7` português vazando para a interface em inglês
- `6c9c023` focar em células específicas, e as nove essenciais
- `97dbf51` a corda pulsada divergia para NaN e envenenava todo o som
- `aaef24f` o gabarito nomeava uma nota que a pergunta não pediu
- `f6a9374` o ataque da corda deixa de soar metálico
- `23a80c4` uma grafia por vez, não "Ré♯/Mi♭"
- `2ee07f6` os três defeitos da pauta
- `4e23ba4` **a reorganização, primeira etapa**
- `bfe3118` o acorde no braço pelo gerador
