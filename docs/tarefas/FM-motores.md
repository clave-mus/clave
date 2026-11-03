# FM · Motores do catálogo

O catálogo do Clave tem ~95 famílias, mas elas são **presets sobre oito motores de catálogo** — e
metade deles já existe ou está parcial. Esta frente constrói dois dos que faltam. O microfone e o
MIDI estão em [F5-som.md](F5-som.md); o gerador de partituras, em `F5-3`.

Leia [catalogo.md](../catalogo.md) antes de pegar qualquer uma destas.

**Todas as tarefas aqui têm contrato de saída verificável** (decisão 32): além do "Pronto quando",
elas declaram **o que o código precisa provar**. A revisão deixa de ser "parece bom" e vira
"o contrato bateu".

> ⚠️ **Nenhuma tarefa desta frente publica uma família de exercício.** Elas entregam o motor
> testado. A revisão musical — resposta única e defensável, parâmetros que importam, "eu usaria
> isto amanhã" — é passo humano do Paulo, separado (decisão 51).

---

## FM-1 · Motor de padrões ✅ *feita em 03/11/2026*

**Decisões de origem:** 36, 40. **Depende de:** nada. **É a melhor relação custo-benefício do
projeto inteiro.**

Uma função pura: dada uma escala e uma regra de percurso, devolve a sequência de graus. Sem braço,
sem áudio, sem interface, sem instrumento.

```ts
// src/catalog/patterns.ts
type Percurso =
  | { kind: 'sequencial' }
  | { kind: 'intervalo'; grau: 2 | 3 | 4 | 5 | 6 | 7 }   // terças, quartas, quintas, sextas, sétimas
  | { kind: 'pedal'; grau: number }                       // 1-2-1-3-1-4…
  | { kind: 'vizinha'; k: number }                        // 1-7-2-1-3-2… (k abaixo ou acima)
  | { kind: 'grupos'; n: number; passo?: number }          // 1-2-3, 2-3-4…
  | { kind: 'cruzado'; n: 3 | 5 }                          // grupos que cruzam o compasso
  | { kind: 'oitava'; quais: number[] };                   // notas trocadas de oitava

/** Posições na escala (0 = tônica), não números de grau. */
function percorrer(tamanhoDaEscala: number, p: Percurso, direcao: 'sobe' | 'desce' | 'ambos'): number[];
```

**As duas regras que não podem ser perdidas:**

1. **Por posição na escala, nunca por número de grau.** É o que faz o mesmo padrão valer para
   pentatônicas, diatônicas e simétricas. Na pentatônica maior de Dó (Dó Ré Mi Sol Lá), o motivo
   `1-2-3-5` vira `2-3-5-6` no passo seguinte e, a partir da 5ª posição, `5-6-8-2`.
2. **O preset é nomeado pelo que a pessoa faz** ("terças descendentes"), nunca por uma sequência
   bruta de números.

*Nota de leitura, já esclarecida: "descer em sextas (8-6-7-5…)" nas anotações originais eram
**terças descendentes**.*

**Contrato de saída:**

- `src/catalog/patterns.test.ts` existe e passa, cobrindo **todas** as famílias de percurso contra
  **todos** os tamanhos de escala de 5 a 12 notas, e verificando que:
  - **o grau** de toda posição fica em `[0, tamanho)`;
  - a sequência descendente é o espelho exato da ascendente;
  - `'ambos'` é subir e descer sem repetir o ápice;
  - o exemplo da pentatônica acima sai exatamente como está escrito aqui.
- Zero importações de React no arquivo.

> **Correção da especificação, feita ao implementar (03/11).** Eu tinha escrito "nenhuma posição
> sai do intervalo `[0, tamanho)`", e isso estava **errado**. A posição **precisa** poder passar de
> `tamanho` (é assim que a subida alcança a oitava de cima) e precisa poder ser **negativa** (a
> vizinha inferior do primeiro grau cai na oitava de baixo, que é o `7` de "1-7-2-1-3-2…").
> O que não pode sair da escala é o **grau**, que é `grauDaPos(pos, tamanho)`.
>
> **Segunda correção:** nem todo percurso cabe em toda escala. "Sétimas" é um salto de 6 posições
> e **não existe numa pentatônica de 5**. Por isso entrou `aplicavel(tamanho, percurso)`: a tela
> esconde o que não se aplica, e `percorrer` devolve `[]` em vez de quebrar no meio da prática.

**Pronto quando:** o contrato acima bate, e `Percorrer escalas` consegue ser declarada no catálogo
usando o motor, sem lógica própria.

**Não faça:** nenhuma tela, nenhum áudio, nenhuma relação com braço ou digitação. Isto é uma
função pura e um teste.

**Ficou de fora, e precisa de decisão:** a família **"agrupamentos que cruzam o compasso"**
(grupos de 3 ou 5 sobre subdivisões em 4). As notas são as mesmas de `grupos`; o que muda é o
**acento rítmico**, que não é assunto deste motor. Precisa virar camada rítmica ou parâmetro de
apresentação — questão para o Paulo, não decisão de tarefa.

---

## FM-2 · Motor de digitações

**Decisões de origem:** 45, 46, 47. **Depende de:** FM-1 não; do visualizador, sim, para a tela.

**Enumerador com rankings, nunca otimizador.** Leia a decisão 45 inteira antes de começar — o
ponto central é contraintuitivo.

### Regras de viabilidade (baixo elétrico moderno)

A mão tem uma **posição P**, a casa onde o dedo 1 fica por padrão. O dedo *f* mora em `P + (f−1)`.

- O **dedo 1 alcança até `P−1`** — o vão entre 1 e 2 vira 2 casas. **Não é outra postura**: é o
  indicador esticando. Não existe "posição espaçada" como estado.
- Dedos **2, 3 e 4 ficam na casa deles**. Nada de esticar entre 2–3 ou 3–4.
- Movimento maior é **mudança de posição**, de preferência com o mesmo dedo (sobretudo o 1), de
  preferência deslizando na mesma corda.

### Rankings nomeados

menos mudanças de posição · menos trocas de corda · ficar numa região · menor extensão entre dedos
· usar cordas soltas · evitar cordas soltas · n notas por corda · **variar** (uma diferente da
última vez).

**O exercício define o ranking padrão; a pessoa troca, e a troca fica visível** — mesmo desenho da
herança de parâmetros (F2-1). A função de custo **pertence ao exercício**, não ao motor: num
exercício de internalizar o braço, a digitação mais confortável é a errada.

### Outras regras

- **Sem nomes** (decisão 46): id estável, desenho para reconhecer, texto gerado só como legenda de
  acessibilidade.
- **Número de cordas e afinação vêm do perfil** (decisão 47). O motor nunca assume 4 cordas.
- **Marcado como experimental**, com botão de reportar erro ou sugestão. Os relatos são curadoria:
  guardá-los num formato que dê para ler depois.

**Contrato de saída:**

1. `src/catalog/fingering.test.ts` passa, e verifica que **toda** digitação enumerada respeita as
   regras de viabilidade acima — nenhuma com vão de 2 casas entre 2–3 ou 3–4, nenhuma fora do
   braço, nenhuma com duas notas na mesma corda ao mesmo tempo.
2. **O conjunto de teste do Paulo está contido na enumeração.** As 10 a 15 digitações que ele
   escrever à mão (👤, abaixo) viram um arquivo de fixtures, e o teste falha se o motor não
   enumerar alguma delas.
3. Para cada ranking nomeado, o teste registra **em que posição** cada digitação do Paulo aparece.
   Não há limiar de aprovação — é uma medida para ele calibrar. Grave num arquivo legível.

**Pronto quando:** o contrato bate, e o motor enumera as digitações da escala maior e da menor
natural no baixo e na guitarra, com os rankings funcionando.

**👤 Bloqueia:** o Paulo precisa escrever **10 a 15 digitações à mão** — maior, menor natural,
pentatônicas e um ou dois modos, nas posições que ele realmente usa. Sem elas o contrato 2 e 3 não
existem, e o motor não tem como provar nada.

**Não faça:** não tente achar "a melhor". Não invente heurística de conforto. Não use o motor para
piano — lá são dedilhados convencionais fixos (e isso ainda é questão aberta `C4`).

---

## FM-3 · Reclassificar o catálogo por objeto e tarefa ✅ *feita em 03/11/2026*

**Decisões de origem:** 40, 41. **Depende de:** F1-3.

Substituir `areas: AreaId[]` por **`objetos: ObjetoId[]`** (o primeiro é a casa) e
**`tarefas: TarefaId[]`**. Dez objetos, oito tarefas — a lista está em
[catalogo.md](../catalogo.md#como-um-item-é-classificado).

- Reclassificar os 26 itens que existem hoje. A tabela-fonte está em
  [catalogo.md](../catalogo.md#o-inventário).
- **Os dois eixos são independentes de `requires`.** "Tocar" num braço virtual continua sendo a
  tarefa *tocar*; ela só não exige instrumento. Se alguém derivar um do outro, está errado.
- Marcar as células vazias por tipo: `sem-sentido`, `oportunidade`, `buraco` — é informação de
  curadoria, não de interface.
- **Corrigir o buraco conhecido:** "achar no braço a nota que você ouviu" está etiquetada em
  Escalas e Intervalos e precisa ter *Notas e o braço* como casa, senão a porta carro-chefe fica
  vazia em Ouvir.

**Contrato de saída:**

- Teste que falha se algum item tiver zero objetos ou zero tarefas.
- Teste que falha se algum dos **oito objetivos** da porta por objetivo tiver menos de 4 itens.
- Um script ou teste que imprime a matriz 10×8 com as contagens, para conferir contra a matriz de
  curadoria.

**Pronto quando:** dá para recuperar, sem inferir nada do nome, o objeto e a tarefa de qualquer
item; e a matriz impressa bate com a de curadoria.

**Feito.** `OBJETOS` e `TAREFAS` em `taxonomy.ts`, `TAXONOMY_VERSION` subiu para 2, e os 26 itens
mais as 9 aulas estão classificados.

Uma separação que apareceu ao implementar: **aula tem assunto, mas não tem tarefa** — ninguém
"toca" nem "ouve" uma aula. Por isso o tipo se partiu em `Assunto` (objetos + etiquetas, vale para
item e para aula) e `Classification` (que acrescenta `tarefas`, só para item).

**O buraco foi tapado:** "achar no braço/teclado a nota que você ouviu" tinha Escalas e Intervalos
como casa, e agora tem **Notas e o braço**. Há um teste afirmando que a casa `notas` cobre a
tarefa `ouvir` — se alguém reclassificar de volta, a porta carro-chefe volta a ficar vazia e o
teste acusa.

O contrato dos **8 objetivos com 4+ itens** fica para quando `goals[]` existir (bloqueado em `A4`).
