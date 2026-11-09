# PE · Padrões de escala

Ideia do Paulo, desenhada com ele em 08–09/11/2026. **Não comece a codar antes do aval dele** —
este documento é a proposta, e os pontos marcados 👤 são decisão dele.

> Pegar um desenho de poucas notas e ir subindo ele pela escala, grau por grau, até ouvir que o
> *mesmo* desenho soa diferente em cada grau.

É o exercício que o Paulo citou como "aquele de pegar um padrão de escala e ir subindo ele pela
escala", e ele mesmo notou que deve se inspirar no **Relações entre melodia e harmonia**
(`MH-relacoes-melodia-harmonia.md`): onde no Relações fica a nota da melodia, aqui fica **cada
posição do padrão**.

---

## 1. O nome 👤

Não está fechado. Proponho o par:

| | |
|---|---|
| exploração | **Padrões pela escala** |
| exercício | **Reconhecer o padrão na escala** |

O par espelha o que já existe (*Relações entre melodia e harmonia* ↔ *Reconhecer melodia na
harmonia*), e o verbo "pela" é o que o exercício faz: o padrão anda pela escala. **Decisão do
Paulo.**

---

## 2. Estrutura: dois itens, e por que não um

Um item de catálogo tem **um** `kind`, e o `kind` decide quem o executa: `serie` passa pelo
`Player`, `tarefa`/`ambiente` abre a própria tela. **Um item não pode ser os dois.** Então os dois
modos que o Paulo pediu — exploração e exercício — são dois itens:

| id | kind | o que é |
|---|---|---|
| `padroes-escala` | `tarefa` | a tela de exploração, com a escada e as posições |
| `reconhecer-padrao-escala` | `serie` | o exercício de adivinhar, pelo `Player` |

**E eles se ligam pela opção (c) que o Paulo escolheu** — o exercício nasce do padrão que está
sendo explorado — usando um mecanismo que **já existe e não precisa ser inventado**:

```ts
// na tela de exploração, botão "me teste neste padrão"
navigate(`/catalogo/reconhecer-padrao-escala`, {
  state: { instancia: { escala, padrao: '0-2-1-4', contexto } },
});
```

`Treinar.tsx` já lê isso (`lerAbertura`), e o `Player` já faz
`{ ...def.defaults, ...(local ?? saved) }` — uma chave que chega por ali **chega ao `make`** ainda
que não tenha controle no painel. Três consequências boas, de graça:

- mexer nas outras configurações continua funcionando (cai em `local`);
- o padrão recebido **não vaza** para a configuração salva do item;
- "salvar numa rotina" guarda o padrão junto — uma etapa de rotina pode fixar *este* desenho.

**Não vai existir um controle de "escrever o padrão" dentro do exercício.** Quem escolhe padrão é
a exploração, que fica a um clique. No exercício aberto direto do catálogo, **sorteia um padrão
novo a cada rodada** — que é a versão mais difícil e mais geral do mesmo exercício.

---

## 3. O motor: `src/theory/padrao-de-escala.ts`

Puro, sem React, testado. Um padrão é uma lista de **deslocamentos em posições de escala**,
começando em zero:

```ts
/** Deslocamentos em posições da escala. `padrao[0]` é sempre 0. */
export type Padrao = number[];

export interface Posicao {
  /** índice da posição inicial na escala, 0-based */
  inicio: number;
  /** os graus que soam, por rótulo da escala: ['1','3','2','5'] */
  graus: string[];
  /** semitons acima da tônica, já com as oitavas somadas (pode ser negativo) */
  semis: number[];
}

export function posicoesDoPadrao(escala: ScaleId, padrao: Padrao): Posicao[];
export function sortearPadrao(n: number): Padrao;
export function rotulo(p: Posicao): string;        // '1-3-2-5'
export function lerPadrao(s: string): Padrao | null; // '0-2-1-4' → [0,2,1,4]
```

### As regras

**Deslocamento, não grau.** O padrão é relativo, então o *mesmo* padrão existe em todas as
posições — que é literalmente o exercício. `[0,2,1,4]` começando no grau 1 de Dó maior dá
`1-3-2-5`; começando no grau 2 dá `2-4-3-6`.

**Pode repetir grau e pode descer** (decisão do Paulo). Logo `0` e números negativos são válidos
no meio do padrão. Negativo na posição inicial toca o grau **uma oitava abaixo** — o rótulo do
grau é o mesmo, e musicalmente é exatamente o certo.

**A oitava se resolve igual ao `ouvido-celulas`**, que já acertou isto:

```ts
const j = inicio + padrao[k];
const semi = semis[mod(j, top)] + 12 * Math.floor(j / top);
```

**Quantas posições:** uma por grau da escala — 5 na pentatônica, 7 nas de sete notas.

**Sorteio:** passo entre posições vizinhas em ±2 (`-2,-1,0,1,2`), nunca todo zero, e vão de 3 a 6
notas. O limite de ±2 é a mesma regra que faz uma célula ser cantável no `celulaDeGraus`; a
diferença aqui é que **repetir é permitido**.

### Testes que a tarefa precisa escrever

- `posicoesDoPadrao` devolve uma posição por grau, nas 13 escalas;
- o rótulo de cada posição é **único** dentro de um padrão (o primeiro grau já difere) — isto é o
  que permite usar o rótulo como `id` de alternativa no exercício, e tem que estar travado por
  teste;
- o padrão `[0,1,2]` na maior começando no grau 1 dá `1-2-3` e soa `[0,2,4]`;
- um deslocamento negativo desce uma oitava e não quebra o rótulo;
- um padrão que passa do topo sobe de oitava e repete o rótulo do grau (varredura: 13 escalas ×
  tamanhos 3–6 × todas as posições, nenhum rótulo vazio, nenhum semitom `NaN`).

---

## 4. A tela de exploração (`padroes-escala`, kind `tarefa`)

`src/tools/PadroesDeEscala.tsx`. **Espelha o Relações**, e reaproveita o que lá já funciona: o
seletor de tonalidade pelo ciclo das quintas, o `drone` com `Carater`, o registro `vivos` +
`pararDrones()` na montagem e na desmontagem, e as faixas roláveis do mobile.

### O texto de abertura

Do Paulo, no mesmo espírito do que ele escreveu para o Relações. **A frase final é dele** 👤 —
proponho:

> Um desenho de poucas notas, subindo grau por grau pela escala. O desenho não muda; o que muda é
> onde ele começa — e é isso que faz cada posição soar diferente.
>
> Dica: se puder, cante o padrão antes de tocá-lo.

### O crédito, visível na tela

Pedido explícito do Paulo, com o texto dele:

> Exercício inspirado [neste vídeo](https://www.youtube.com/watch?v=4mPYAH0H01w&t=649s) do canal
> **ChicagoBassBuddy**. Recomendamos assistir, mas não é requisito.

**Deliberadamente sem o título do vídeo:** não conferi o título, e não vou afirmar na tela um dado
que não verifiquei. Se o Paulo quiser o título escrito, ele passa o título.

### Quatro faixas, de cima para baixo

**1 · A escada.** A analogia é do Paulo. Uma escada vertical com os graus da escala, de baixo
(grau 1) para cima, **uma oitava mais o grau da oitava** — o bastante para um padrão de 6 notas
com salto de ±2.

Clicar num degrau **acrescenta aquele passo ao fim do padrão**, em ordem (decisão do Paulo: o
padrão pode repetir e descer, então não é "marcar os degraus que entram", é "escrever a sequência
clicando"). Os deslocamentos saem do **primeiro** clique. A escada desenha o caminho já escrito,
numerando a ordem dos passos.

Ao lado: `apagar o último` · `limpar` · `sortear`.

**2 · As posições.** Onde no Relações ficam as notas da melodia. **Todas de uma vez** (decisão do
Paulo), uma por grau da escala. Cada uma mostra o grau inicial em destaque e a sequência pequena
embaixo (`1-3-2-5`).

**Aperta para ouvir** (decisão do Paulo) — não toca sozinho ao selecionar. O padrão soa em
sequência, com o agendamento do `Clock`; `setTimeout` não serve.

**3 · O contexto que sustenta.** O grid do Relações, reaproveitado: `silenciar` · `só a tônica` ·
os sete acordes do campo. Em escala de sete notas o campo existe; **na pentatônica e na blues não
existe campo**, e aí a faixa fica com `silenciar` · `tônica (nota)` · `tônica (tríade)` — a mesma
saída que o `ouvido-celulas` já usa, e por boa razão: empilhar terças numa pentatônica dá salto de
escala, não tríade. Como a pentatônica é o **padrão** do item, este caso é o que a pessoa vê
primeiro. 👤 confirmar que está bom.

O contexto é drone sustentado, caráter `acorde`; o padrão soa no caráter `destaque`, como no
Relações.

**4 · Configurações.** Escala (as 13, **pentatônica maior como padrão** — decisão do Paulo),
tamanho do padrão (3 a 6), tétrade no contexto, tonalidade.

### O laço com o exercício

Botão **"me teste neste padrão"**, que navega como na seção 2. Só aparece com um padrão de pelo
menos 3 notas escrito.

---

## 5. O exercício (`reconhecer-padrao-escala`, kind `serie`)

`src/catalog/items/reconhecer-padrao-escala.ts`.

### Configurações

| id | tipo | padrão |
|---|---|---|
| `escala` | single, 13 | `penta-maior` |
| `tamanho` | single, 3–6 | `4` |
| `contexto` | single: `nota` · `triade` · `tetrade` | `triade` |
| `padrao` | **não declarada** — só chega pela navegação | — |

### O `make`

1. `tonicaNaRegiao(ctx, ...)` — a tônica é **sorteada a cada rodada**. Sem isso a altura absoluta
   entrega a resposta, e o exercício viraria memória de frequência.
2. o padrão: `lerPadrao(s.padrao)` se veio da exploração, senão `sortearPadrao(tamanho)`.
3. sorteia **a posição** entre as da escala.
4. som: o contexto (nota/tríade/tétrade da tônica) e depois as notas do padrão, em sequência.
5. `partes` — reaproveita o "ouvir em pedaços" que acabou de entrar no `Player`:
   `{ contexto }` e uma por nota. Aqui separar **ajuda e não entrega**: ouvir uma nota sozinha não
   diz que grau ela é, porque o grau só existe contra a tônica.
6. `surface: choices` com 4 alternativas, cada uma o rótulo de uma posição (`1-3-2-5`,
   `2-4-3-6`…), preferindo posições **vizinhas** como distratores.
7. `expected`: o rótulo da posição certa. **A resposta é quais graus** — decisão do Paulo.

**As alternativas explicam o exercício sozinhas:** todas são o mesmo desenho começando em graus
diferentes, então quem lê as quatro opções entende que a pergunta é *onde* o padrão começou. Não
precisa de enunciado explicando a mecânica.

### O que o `hint` pode dizer

Pode mostrar o desenho — mostrar o desenho **não** entrega onde ele começou, e é informação que a
pessoa precisa para a pergunta fazer sentido. O que o `hint` nunca mostra é o grau inicial.

---

## 6. i18n

Chaves novas em `src/i18n/pt.ts` e `en.ts`, com os mesmos nomes nos dois (há teste que falha se
faltar). Prefixo `scalePattern.`: título e descrição dos dois itens, o texto de abertura, o
crédito, rótulos da escada (`apagar o último`, `limpar`, `sortear`), `me teste neste padrão`,
`silenciar`, `só a tônica`, `tônica (nota)`, `tônica (tríade)`, e os rótulos de configuração.

---

## 7. Mobile

Mesma solução do Relações, e pelos mesmos motivos aprendidos lá: faixa rolável **só no toque**
(`@media (max-width: 760px) and (pointer: coarse)`), porque em janela estreita com mouse a barra de
rolagem mede 0px e a faixa fica sem saída; e `justify-content: flex-start` dentro da faixa, porque
centralizar um contêiner rolável torna o começo dele inalcançável. Fora do toque, grade que
embrulha e **centraliza cada linha** (flex-wrap, não grid — grid deixa a última linha incompleta
à esquerda).

---

## 8. Não faça

- **Braço virtual.** Fora da primeira versão, decisão do Paulo. (E quando entrar, é no único braço
  que existe — decisão 17.)
- **Metrônomo e andamento.** O Paulo disse que não precisa. O tempo anda porque o padrão soa em
  sequência, e é só isso.
- **Modo que troca de posição inicial sozinho.** Ele considerou e descartou.
- **Tocar sozinho ao selecionar a posição.** Aperta para ouvir.
- **Juízo sobre o desenho.** Nem "este padrão é mais difícil", nem rótulo sobre quem usa.
- **Motor novo de escala.** `theory/core.ts` já dá graus, semitons e grafia por tonalidade; o
  motor novo só compõe posições.
- **Mexer no `ouvido-celulas`.** É vizinho temático, não é este item.

---

## 9. Pronto quando

1. `src/theory/padrao-de-escala.ts` existe, não importa React, e passa os testes da seção 3,
   incluindo a varredura 13 escalas × tamanhos 3–6.
2. Abrir **Padrões pela escala**, escrever um padrão clicando na escada, e ouvir **cada posição**
   soar ao apertar — verificado no navegador, não só em teste.
3. O contexto sustenta e **para** ao sair da tela (zero osciladores vivos, medido).
4. O crédito ao ChicagoBassBuddy está visível e o link abre.
5. "Me teste neste padrão" abre o exercício **com aquele padrão**, e as quatro alternativas são o
   mesmo desenho em graus diferentes.
6. O exercício aberto do catálogo sorteia padrão novo a cada rodada.
7. Os dois itens nascem `RASCUNHO` e estão listados em `docs/revisao-pendente.md` pelo id entre
   crases (há teste que falha se faltar).
8. Os quatro comandos passam: `npm test`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run lint`,
   `npm run build`.
9. O último passo de `docs/novo-item.md` — *olhar o todo* — foi feito.

---

## 10. Decisões 👤 pendentes

1. **Os nomes** dos dois itens (seção 1).
2. **O texto de abertura** (seção 4).
3. **O contexto na pentatônica**: `tônica (nota)` · `tônica (tríade)`, já que campo harmônico não
   existe ali — e a pentatônica é o padrão do item.
4. **Em que grupos os dois itens entram.** O Relações ficou na percepção melódica *e* na harmônica.
   Este é melódico; proponho `perception.melodic` só.
5. **O crédito ao ChicagoBassBuddy também no `ouvido-celulas`?** Perguntei antes e ficou sem
   resposta: o vídeo é sobre células pentatônicas, e aquele item pode ter saído da mesma fonte. Se
   saiu, o crédito deveria estar lá também.
