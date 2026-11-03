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

**👤 Bloqueia:** o Paulo precisa escrever **10 a 15 digitações à mão** — o formato e a lista estão
em [guias/digitacoes.md](../guias/digitacoes.md). Sem elas os contratos 2 e 3 não existem, e o
motor não tem como provar nada.

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

---

## FM-4 · Enumerador de conduções de voz ✅ *feita em 03/11/2026*

**Decisões de origem:** 64, 66, 71. **Depende de:** nada — é função pura.

**Não é um motor.** É um enumerador, como o `percorrer` da `FM-1`: recebe material musical e
devolve uma lista ordenada. Quem desenha é o motor de partituras ou o visualizador.

**Escopo fechado: quatro vozes, posição fechada.** Está assim porque precisava caber no beta, e a
decisão 66 registra que **é revisável sem defesa**: foi decidido por quem toca teclado e por quem
escreve código, e nenhum dos dois julga se conjuntos de cordas e tríades abertas deveriam estar
aqui. Se um guitarrista ou baixista do time disser que falta, muda.

```ts
// src/catalog/conducoes.ts
export interface Voicing { vozes: [number, number, number, number] }  // MIDI, do baixo ao soprano
export interface Medidas {
  movimentoTotal: number;   // soma dos semitons percorridos pelas quatro vozes
  notasComuns: number;      // alturas mantidas entre os dois acordes
  maiorSalto: number;       // o maior movimento de uma voz só
  cruzamento: boolean;      // alguma voz passou por cima da vizinha
  noAmbito: boolean;        // todas as vozes dentro do âmbito declarado
}
export function conducoes(de: Voicing, paraAcorde: Acorde, ambitos: Ambito[]): Voicing[]
export function medir(de: Voicing, para: Voicing): Medidas
```

**As cinco medidas são as únicas que não dependem de opinião.** As *regras de escrita* — quintas e
oitavas paralelas, dobramento, resolução da sensível — **ficam fora** (ver
[guardados.md](../guardados.md)): cada uma precisa de uma decisão sobre em que tradição ela vale,
porque no jazz quintas paralelas são vocabulário.

**O exercício não tem alternativas.** A pessoa escreve ou toca a condução dela, e o app diz **onde
ela caiu**: *"você moveu 7 semitons; a mais econômica move 3; de 24 conduções válidas, 14 movem
menos que a sua."* Medição, nunca julgamento.

**Duas superfícies com seletor** (decisão 66): escrita na pauta (determinística, cabe no ônibus) e
tocada no instrumento (autoavaliação, cabe com o instrumento). O contexto escolhe o padrão.

**Contrato de saída:** teste que, para uma cadência V7→I em quatro vozes, prova que (a) a condução
de movimento mínimo está na lista, (b) **nenhuma** condução listada cruza vozes ou sai do âmbito, e
(c) `medir` é simétrica no que deve ser e assimétrica no que deve ser. E um teste de texto: **nenhuma
string de interface deste item diz "errado" ou "correto"**.

**Não faça:** não eleja uma condução como a certa. Isso é o erro que a decisão 64 existe para
impedir.

---

## FM-5 · Enumerador de rearmonizações ✅ *enumerador feito em 03/11/2026; falta a tela*

**Decisão de origem:** 69. **Depende de:** `A12` (quais transformações entram — curadoria do Paulo).

O laboratório de harmonização de melodia. **Não oferece lista de acordes:** enumerar os acordes que
contêm uma nota da melodia é interseção de conjuntos — trivial, e entrega 40 acordes sem hierarquia,
porque **"interessante" não é computável.**

**Oferece transformações pelo nome**, aplicadas ao acorde que já está ali:

```ts
// src/catalog/rearmonizacoes.ts
export interface Transformacao {
  id: string;                     // 'subv7' | 'interpolar-ii' | 'diminuto-passagem' | ...
  aplicavel(ctx: ContextoHarmonico): boolean;
  aplicar(ctx: ContextoHarmonico): Acorde[];
}
export function medir(acorde: Acorde, notaDaMelodia: number, tom: Tom): {
  grauDaMelodia: 1|3|5|7|9|11|13;   // o eixo útil, e é exato
  cromatico: boolean;
  funcao: 'tonica' | 'subdominante' | 'dominante' | null;
  movimentoDoBaixo: number;
}
```

**Quais transformações entram é decisão do Paulo** (`A12`) — curadoria musical, não lista exaustiva.
Candidatas levantadas na conversa: substituição por trítono (subV7) · interpolar um II antes do V ·
diminuto de passagem · empréstimo modal · relativo · dominante secundário.

**Sem correção nenhuma.** Termina por `tarefa`: a pessoa para quando quer. O app toca o resultado,
ela mantém ou desfaz. **O custo aceito** (decisão 69): item sem resposta não gera evidência de
progresso — entra no histórico como tempo praticado e os acordes escolhidos.

**Fica para a Fase 2:** o navegador livre de acordes (ver todos os que contêm aquela nota).

**Contrato de saída:** teste provando que **toda transformação aplicada mantém a nota da melodia
pertencente ao acorde resultante** — é a única invariante que o laboratório precisa garantir, e é a
que o torna utilizável. E `medir` conferida contra casos escritos à mão.

**Não faça:** nada de gerar a progressão inteira por gênero. É o que o Reharmonist do Band-in-a-Box
faz, e é justamente o que não ensina nada.

### ❓ Em aberto, e é decisão de produto: onde a nota da melodia cai na subdivisão

Três das sete transformações — **interpolar o II**, **dominante secundário** e **diminuto de
passagem** — **subdividem o espaço do acorde**. E `melodia` não diz em que ponto do compasso cada
nota cai, então não há como saber qual acorde soa sob qual nota.

O enumerador resolve isso pela **regra estrita**: *todo* acorde da sequência tem que acomodar a
melodia. Nunca produz choque, e é o único critério defensável sem informação de ritmo.

**Custa opções.** Um ii interpolado é descartado quando não acomoda a nota que soava sobre o V — e
musicalmente ele poderia servir, porque passa antes dela.

Resolver isso exige decidir **como a melodia se posiciona dentro do espaço do acorde**, o que é
desenho do exercício, não do enumerador. Até lá, a regra estrita fica — e está comentada no código
com este mesmo motivo.

---

## FM-6 · 👤 Tabela de digitações de piano

**Decisão de origem:** 76. **Depende de:** uma pessoa, não de código. **Candidato natural:** o
Bernardo Garcia, pianista clássico do time.

**A tabela já existe, em [docs/digitacoes/piano.md](../digitacoes/piano.md) — esta tarefa é
conferir, não escrever.**

Porque digitação de escala no piano é **convenção**, e não julgamento: o polegar nunca cai em tecla
preta, e isso determina a digitação quase sozinho. Foi por isso que ela pôde ser produzida por
consulta, sem um pianista — e é por isso que ainda precisa de um.

Estado: **as 12 maiores ✅** (convenção única), **7 menores ✅**, **2 menores 🟡** (há mais de uma
edição em circulação) e **3 menores ❓ em branco** — Fá♯, Dó♯ e Sol♯ menor, as de mais teclas
pretas, onde as edições divergem mais e onde eu não quis escrever linha com cara de certa.

**O que falta:**

1. As três ❓, com as duas mãos.
2. Conferir as duas 🟡.
3. **Os arpejos** — tríades e tétrades, duas mãos. Divergem mais que as escalas.
4. **Uma linha dizendo qual tradição ou edição foi seguida.**

**Pronto quando:** não há mais ❓, as 🟡 foram confirmadas ou corrigidas, os arpejos existem, e a
linha de tradição está escrita — sem ela a tabela não é verificável.

**E se o pianista discordar de uma linha ✅, a mão dele ganha.** A marca de confiança é a minha, e
ela é consulta, não prática.
