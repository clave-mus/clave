# As camadas do Clave

O mapa de **como o produto é montado**, do item à rotina. Sem história e sem numeração: só o estado
atual, com link para a decisão que explica cada escolha.

> **Para que serve este documento.** As decisões estão em
> [decisoes.md](decisoes.md), em ordem cronológica — hoje são 96, e entender como a cascata de
> parâmetros conversa com o rodízio exigiria ler seis delas espalhadas. Aqui está o resultado, não o
> caminho. Quando os dois divergirem, **a decisão vence** e este arquivo está desatualizado.

---

## 1. Os quatro níveis

```
Rotina          "Internalizar Fá maior"        o que se estuda, e em que ordem
 └ Etapa        "achar a nota no braço, 8 min"  um passo da rotina
    └ Instância  braco-ache · casas 0-5         um item COM uma configuração
       └ Item    braco-ache                     a declaração no catálogo
```

**Item** é uma declaração, não uma tela (decisão 15). Ele diz o que pergunta, o que exige do mundo,
como pode ser conferido e quais parâmetros respeita. Exercícios e ferramentas são **o mesmo tipo**
(decisão 17): o que muda é ter `make` (o Player roda) ou `screen` (tela própria).

**Instância** é `{ itemId, settings, params }` — um item com uma configuração. **Nada exige que duas
instâncias tenham itens diferentes:** três variantes de `braco-ache` em Fá, Sol e Dó são três
instâncias do mesmo item.

**Etapa** é um **conjunto** de instâncias (decisão 7). Com uma, é uma etapa comum; com mais de uma,
ela **rodizia**. Não existem dois tipos de etapa no modelo, de propósito.

**Rotina** é a lista ordenada de etapas, mais o modo de execução, os parâmetros herdados e a rotação.
É o objeto central do produto.

---

## 2. As cinco camadas de parâmetro

Tonalidade, região e material chegam ao item em camadas, e **cada valor lembra de onde veio** — é o
que permite a tela escrever *"Tonalidade: Dó maior (da rotina)"* (decisões 7 e 57).

| # | Camada | Quem escreve | O quê |
|---|---|---|---|
| 1 | `item` | o catálogo | o padrão do próprio item |
| 2 | `perfil` | o Perfil | **só o que é da pessoa**: instrumento, afinação, timbres, volume |
| 3 | `rotina` | o editor de rotinas · a rotação | herdado por todas as etapas |
| 4 | `etapa` | o editor · a instância aberta | substituição explícita e visível |
| 5 | `agora` | o painel dentro do exercício | o que a pessoa escolheu neste exercício, lembrado por item |

A mais específica vence. Duas exceções que **não** são "a última vence": `timbres` se **funde** (escolher
o timbre do baixo não apaga o do piano) e `tuning` **segue o `instrument`** quando ninguém a declarou.

**Tonalidade, região e material NÃO têm camada de perfil** (decisão 87). O perfil é quem a pessoa é;
isso é o que ela está praticando agora. Morar no perfil os deixava fora de tudo que se salva numa
rotina — era por isso que "Salvar em Fá maior" não gravava Fá maior.

**Nem todo item respeita tudo.** `CatalogItem.respeita` declara quais parâmetros de prática o item de
fato lê, e **a tela só oferece o controle onde ele muda alguma coisa**. A lista é *medida*, não
opinada: `contexto-declarado.test.ts` instrumenta as funções de contexto e compara com o que cada
`make` realmente chama.

---

## 3. As três variações, que fazem coisas diferentes

A confusão mais fácil deste projeto. São três mecanismos independentes, e podem estar ligados ao
mesmo tempo.

| | O que varia | Alcance | Avanço |
|---|---|---|---|
| **Embaralhar** | a **ordem das etapas** | a rotina | a cada execução |
| **Rodízio** | **qual instância** a etapa usa | uma etapa | a cada execução (`ordem` ou sorteado) |
| **Rotação** | **um parâmetro**, por uma lista de valores | a rotina inteira | **manual** por padrão (decisão 38) |

**Rodízio responde a "não quero fazer a mesma coisa toda vez".** Rotação responde a "quero morar em Fá
maior por uma semana e atravessá-la em várias frentes". São propósitos opostos: variedade e disciplina.

⚠️ **Onde eles colidem:** se a rotina está em rotação por tonalidade **e** uma instância declara
tonalidade própria, a instância ganha (camada 4 vence a 3) — na prática, **desliga a rotação naquela
etapa**. A tela precisa dizer isso.

**A sugestão de variação automática** (decisão 9) é uma quarta coisa, e não tem relação com as três: é
o app propor incluir mais intervalos depois de 15 acertos seguidos. Por isso a palavra "variação" não é
usada para o rodízio na interface.

---

## 4. Publicação

Três estados (decisão 91), em `src/catalog/publicacao.ts`:

| Estado | Quem vê | Significado |
|---|---|---|
| `rascunho` | ninguém, fora do modo de revisão | construído, não revisado. **É o padrão** |
| `legado` | todo mundo | já estava no app antes do portão; sem revisão formal |
| `publicado` | todo mundo | revisado pelo Paulo, com data e nome |

Omitir é rascunho: esquecer de declarar nunca expõe nada. `?revisao=1` liga o modo de revisão.
Detalhes e a lista do que está em rascunho: [revisao-pendente.md](revisao-pendente.md).

---

## 5. O que fica gravado

**Três registros diferentes**, e confundi-los produz histórico que mente.

| Registro | Onde | O que guarda |
|---|---|---|
| **Tentativa** | `state/attempts.ts` | uma resposta conferida: pergunta, resposta, acerto, tempo |
| **Atividade** | `State.history` | uma prática: item, minutos, e o *snapshot* do que valia |
| **Rotina** | `clave:rotinas` | as rotinas da pessoa, com as etapas e instâncias |

**O snapshot só afirma o que o item usa** (`paramsRegistraveis`): grava `instrument`, `tuning` e **só os
parâmetros de prática que o item respeita**. Gravar o valor resolvido de tudo faria o histórico dizer
"região: Média" num exercício de armadura — o padrão passando por escolha.

**Uma sessão é uma entrada, regravada no lugar** (decisão 92). A prática é gravada ao esconder a aba, ao
sair da página e ao desmontar a tela — e todos regravam a mesma entrada, porque gravar três vezes sem
isso contaria a mesma prática três vezes.

---

## 6. Os motores e os enumeradores

**Oito motores de catálogo** sobre três bibliotecas de base — ver
[catalogo.md](catalogo.md#os-oito-motores). Além deles, **quatro enumeradores**: funções puras, sem
interface, que recebem material musical e devolvem uma lista ordenada por critérios nomeados.

| Enumerador | Onde | Serve a |
|---|---|---|
| `percorrer` | `theory/patterns.ts` | padrões de escala |
| `deslocamento` | `theory/deslocamento.ts` | modos de um padrão rítmico |
| `conducoes` | `theory/conducoes.ts` | voice leading |
| `rearmonizacoes` | `theory/rearmonizacoes.ts` | as sete transformações |

Eles têm a **mesma forma**, e ela é a resposta recorrente do projeto para problemas sem resposta certa
(decisão 71):

> **Enumerar o que é válido, ordenar por critérios nomeados, nunca eleger um certo.**

Contá-los como motores infla a estimativa de trabalho: continuam sendo oito motores.

---

## 7. Onde cada coisa mora no código

| Assunto | Arquivo |
|---|---|
| O item de catálogo | `src/catalog/types.ts` |
| Os exercícios | `src/catalog/catalog.ts` · as ferramentas em `ambientes.ts` |
| Cascata de parâmetros | `src/catalog/params.ts` |
| O que os itens leem da cascata | `src/catalog/contexto-musical.ts` |
| Publicação | `src/catalog/publicacao.ts` |
| Grupos por propósito | `src/catalog/grupos.ts` |
| Modelo de rotinas | `src/routines/types.ts` |
| Rodízio | `src/routines/ciclagem.ts` |
| Rotação | `src/routines/rotacao.ts` |
| Editar rotina | `src/routines/edicao.ts` |
| Estado e histórico | `src/state/store.ts` · `useRegistro.ts` |
| Teoria musical | `src/theory/core.ts` (grafia, escalas, acordes) |
| Áudio | `src/audio/engine.ts` (síntese, relógio) · `presentation.ts` (como soa) |
