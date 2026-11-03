# O catálogo

Como o catálogo do Clave é organizado, do que ele é feito, e o que precisa ser verdade para uma
família ser publicada.

Escrito em 03/11/2026, a partir do documento de visão (`Clave.md`), do rascunho "com instrumento"
e da sessão de descoberta da mesma data. As decisões estão em [decisoes.md](decisoes.md), 36 a 51.

---

## O critério

> **Um bom exercício é um que ajuda o músico a praticar de forma eficaz.**

Não é "um que o app consegue conferir", e **não é "um que o app faz melhor que um papel"**.
Exercício simples pode ser poderosíssimo, às vezes mais que o complexo. Se o Clave só serve para
instruir e mostrar um cronômetro, está bom — o valor do produto está na **rotina**, não no átomo.

A consequência que protege a ideia: *"o Clave acrescenta pouco a este exercício"* **não é motivo
para cortar**. É motivo para ele ser barato — entra como **preset de um motor que já existe**,
nunca como tela nova.

---

## Como um item é classificado

Dois eixos, **os dois no plural**.

**Objeto musical** — sobre o que é. O **primeiro é a casa** do item; os outros são etiqueta.
**Tarefa** — o que se faz com ele.

|  | Ouvir | Tocar | Cantar | Ler | Escrever | Nomear | Explorar | Criar |
|---|---|---|---|---|---|---|---|---|
| Notas e o braço | | | | | | | | |
| Intervalos | | | | | | | | |
| Escalas e modos | | | | | | | | |
| Acordes e arpejos | | | | | | | | |
| Harmonia e progressões | | | | | | | | |
| Ritmo e tempo | | | | | | | | |
| Melodia e frase | | | | | | | | |
| Notação e símbolos | | | | | | | | |
| Som, timbre e dinâmica | | | | | | | | |
| Controle motor | | | | | | | | |

**A regra que decide quando é um item ou dois:**

- **Objeto muda, tarefa igual → um item, dois objetos.** "Tocar motivos em graus" usa material de
  escala, mas o que treina é ouvir um desenho por dentro: casa em *melodia*, etiqueta em *escalas*.
- **Tarefa muda → dois itens.** "Identificar intervalos de ouvido" e "Localizar intervalos no
  braço" têm o mesmo objeto e tarefas diferentes.

Aparecer em vários lugares é conveniência. **Duplicar a implementação é dívida** (decisão 19).

**Os dois eixos são independentes do contexto.** "Tocar" num braço virtual, na tela, continua sendo
a tarefa *tocar* — ela só não exige o instrumento. O que exige instrumento, microfone ou voz é
declaração à parte no item (`requires`).

### Células vazias

Vazio não é tudo igual, e a distinção é o que torna a matriz útil:

- **Sem sentido** — *Controle motor × Ouvir*. A célula não existe no mundo. Ignorar.
- **Oportunidade** — *Ritmo × Cantar* (vocalizar ritmo), *Harmonia × Cantar* (cantar guide tones).
  Fazem sentido, ninguém prometeu nada, a matriz as sugeriu de graça.
- **Buraco** — deveria existir e não existe. Hoje há **um**: *Notas e o braço × Ouvir*. "Achar no
  braço a nota que você ouviu" existe no catálogo, mas etiquetada em Escalas e Intervalos — então
  quem entra por "quero conhecer o braço" não a encontra. É erro de etiqueta, não falta de item.

Nada disso aparece para quem usa o app: a pessoa entra por **objetivo** (decisão 20), não pela
matriz. O único lugar onde isso vaza é a porta secundária "por área", e a regra de que *uma porta
só existe com 4+ itens atrás dela* já resolve.

---

## Os nove motores

**Largura não se mede em exercícios. Mede-se em motores.** São ~95 famílias, mas elas são presets
sobre nove motores — e **quatro já existem**.

| Motor | Estado | Serve a |
|---|---|---|
| **Perguntas** (`Player`) | ✅ pronto | ~35 famílias de Ouvir, Ler e Nomear |
| **Teoria** (`theory/core`) | ✅ pronto | atravessa quase tudo: grafia, escalas, acordes, campo |
| **Áudio** (`audio/engine`) | ✅ pronto | tudo que soa |
| **Ritmo** (`rhythm-gen`) | ✅ pronto | geração de compassos |
| **Partituras** | ⚠️ existe em dois, **falta fundir** (decisão 18) | ~10: leitura melódica e rítmica, ditado, leitura à primeira vista |
| **Visualizador** de braço e teclado | ⚠️ componentes existem, falta a ferramenta | ~12: toda a coluna Explorar, e as superfícies de Tocar |
| **Padrões** | ❌ não existe — **e é uma tarde** | ~8, nas duas metades da matriz |
| **Tarefa com metrônomo** + autoavaliação | ❌ não existe | ~12: técnica, execução, groove |
| **Digitações** | ❌ não existe | ~8 |
| **Progressões** e harmonia aplicada | ⚠️ parcial | ~10: campo harmônico, cifras, walking, guide tones |
| **Altura** (microfone e MIDI) | ❌ não existe | ~8, todas opcionais |

### Motor de padrões

O de melhor retorno dos dois documentos. Uma função pura: dada uma escala e uma regra de percurso,
devolve a sequência de graus.

Famílias de percurso: **sequencial** · **por intervalo de grau** (terças, quartas, quintas, sextas,
sétimas) · **pedal** · **nota e vizinha** · **grupos de n** · **agrupamentos que cruzam o compasso**
· **com salto de oitava**.

Duas regras que não podem ser perdidas:

- O padrão é definido por **posição na escala, não por número de grau**. Assim vale igual para
  pentatônicas, diatônicas e simétricas: na pentatônica maior de Dó, o motivo 1-2-3-5 vira 2-3-5-6
  no passo seguinte.
- O preset é nomeado pelo que a pessoa **faz** ("terças descendentes"), nunca por uma sequência
  bruta de números.

*Esclarecido em 03/11: "descer em sextas (8-6-7-5…)" eram **terças descendentes**.*

Ele serve a *Percorrer escalas · Percorrer modos · Percorrer uma tonalidade em uma corda · Tocar
padrões de arpejo · Tocar motivos em graus* e, do outro lado da matriz, **Solfejar escalas**.

### Motor de digitações

**Enumerador com rankings, nunca otimizador** (decisão 45). Enumerar o que é tocável é fácil e
confiável; dizer qual é a melhor é impossível — os pesos mudam o resultado e especialistas
discordam entre si. No estudo de referência de acordes, a primeira opção do algoritmo bateu com a
dos especialistas em **66,6%** dos casos: devastador se você mostra uma, irrelevante se mostra
cinco.

**Regras de viabilidade — baixo elétrico moderno:**

A mão tem uma **posição P**, a casa onde o dedo 1 fica por padrão. O dedo *f* mora em `P + (f−1)`.

- O **dedo 1 alcança até `P−1`** — o vão entre 1 e 2 vira 2 casas. Não é outra postura: é o
  indicador esticando.
- Dedos **2, 3 e 4 ficam na casa deles**. Nada de esticar entre 2–3 ou 3–4.
- Movimento maior que isso é **mudança de posição**, de preferência com o mesmo dedo (sobretudo o
  1), de preferência deslizando na mesma corda.

**Rankings nomeados:** menos mudanças de posição · menos trocas de corda · ficar numa região ·
menor extensão entre dedos · usar cordas soltas · evitar cordas soltas · n notas por corda · e o
inverso pedagógico, **variar** (me dá uma diferente da última vez).

**O exercício define o ranking padrão; a pessoa troca, e a troca fica visível** — mesmo desenho da
herança de parâmetros das rotinas.

> **Não confundir "mais fácil" com "melhor para aprender".** Num exercício de internalizar o braço,
> a digitação ergonomicamente ótima é a **errada**: o objetivo é tirar a pessoa do shape conhecido.
> Um motor que sempre devolve a mais confortável trabalha contra a função carro-chefe do Clave.
> Por isso a função de custo pertence ao **exercício**, não ao motor.

**Digitações não têm nome** (decisão 46): id estável para guardar, **desenho para reconhecer**,
texto gerado só como legenda de acessibilidade e linha de histórico. Músico não nomeia digitação —
aponta.

**Marcado como experimental, com botão de reportar.** Os relatos viram curadoria.

---

## Parâmetros rotacionáveis

A rotina avança **um** parâmetro por uma lista de valores, com **avanço manual** por padrão
(decisão 38). Só rotaciona o que o catálogo declarar rotacionável:

**tonalidade · região do braço · corda · modo · qualidade de acorde**

Não rotacionam: andamento (isso é a camada *progressão de andamento*; e bpm não é pontuação),
timbre, clave, direção, superfície de resposta.

---

## Camadas

Não são exercícios: são sugestões de dificuldade que se somam a vários. **Nunca a forma basal.**

Solfejar enquanto toca · antecipar (cantar a próxima nota antes de ouvi-la) · cantar antes de tocar
· esconder o diagrama · com drone, base ou metrônomo · clique que some · sequência de tonalidades ·
digitação livre, sorteada ou restrita · botão de gabarito · limite de tempo · sem tempo de
preparação (é isso que "ler à primeira vista" é) · progressão de andamento · sessão hands-free.

---

## Validação

**O item declara quais modos aceita; o padrão é autoavaliação** (decisão 6). Nenhum exercício
depende de microfone ou MIDI.

| Modo | O que confere | Estado |
|---|---|---|
| `deterministic` | resposta por seleção, nota clicada, cifra digitada | pronto |
| `self_report` | *consegui / consegui com ajuda / preciso repetir* | **o padrão** |
| `microphone` | altura sustentada; ritmo **relativo** | experimental, opcional |
| `midi` | notas exatas, inclusive simultâneas | experimental, opcional |

**Microfone, o que dá e o que não dá:**

- **Altura sustentada** (afinador, voz) — fácil. Vogal tem fundamental limpa; ±10 cents é
  realista. Ignorar os primeiros ~100 ms do ataque; medir a **mediana** de uma janela, nunca o
  instante; aceitar **qualquer oitava** (erro de oitava é o calcanhar do YIN e aqui é inofensivo).
- **Ritmo relativo** — média. Medir os intervalos **entre os ataques da própria pessoa** cancela a
  latência do aparelho, que é um deslocamento constante. **Classificar, não pontuar**: *bate com o
  pedido* / *bate com outro* (e mostrar qual) / *não deu para entender*.
- **Ritmo absoluto** (alinhado ao clique) — **fora**. Exige calibração de latência.
- **Polifonia** — fora. É para isso que serve MIDI.

**"Foi isto que eu ouvi":** tocar de volta o ritmo detectado torna a percepção da máquina
inspecionável — a pessoa sabe na hora se errou ou se o app não entendeu. E vale como exercício
mesmo com a validação desligada.

**Resposta visual ao ataque** é viável: ~15 a 40 ms da pancada ao pixel, abaixo do limiar de
causalidade para gesto próprio. Detectar no **AudioWorklet**, nunca na thread principal. E **o
tempo que vale para medir é o carimbo do áudio, nunca o instante em que o pixel acendeu** — quem
misturar as duas coisas erra o exercício inteiro.

---

## O portão de qualidade, em três níveis

Os sete itens (ver [decisoes.md](decisoes.md#o-portão-de-qualidade-de-exercício)) não se aplicam
todos no mesmo lugar — exigir os sete de 95 famílias inviabilizaria o catálogo largo.

| Nível | Quais itens | Quantas vezes |
|---|---|---|
| **Motor** | grafia e convenção corretas · som decente · teste automático | **9** |
| **Família** | resposta única e defensável · parâmetros que importam · "eu usaria amanhã" | ~95, julgamento musical, rápido por item |
| **Preset** | nenhum | de graça |

Dois deslocamentos importam:

- **Teste automático sobe para o motor.** Não se escreve teste para cada preset de "terças
  ascendentes"; testa-se o motor de padrões uma vez, com centenas de combinações.
- **Ambiguidade teórica fica na família e não se move.** É o único item que não dá para
  automatizar nem delegar, e é o que impede o Clave de dizer que você errou quando você não errou.

**O Paulo revisa todas as famílias.** Não há dono musical por área. A consequência operacional é
dura e proposital: **tarefa delegada constrói o motor e a fiação; publicar a família é passo
humano, dele.** É a proteção contra o que deu errado na primeira versão deste projeto.

---

## O inventário

Ver a matriz interativa para a visão cruzada. Abaixo, as famílias por objeto, com o motor de cada
uma. **Fonte:** `V` = documento de visão (sem instrumento) · `R` = rascunho (com instrumento).

### Notas e o braço

| Família | Tarefa | Motor | Fonte |
|---|---|---|---|
| Localizar notas | tocar | visualizador | R |
| Localizar as notas de uma tonalidade | tocar | visualizador | R |
| Percorrer uma tonalidade em uma corda | tocar | padrões | R |
| Conectar regiões do braço | tocar | digitações | R |
| Exploração do braço e do teclado | explorar | visualizador | V |
| Calculadora de digitações | explorar | digitações | R |
| *(buraco)* Achar de ouvido no braço | ouvir | perguntas | — |

### Intervalos

| Família | Tarefa | Motor | Fonte |
|---|---|---|---|
| Identificação de intervalos | ouvir | perguntas | V |
| Leitura de intervalos | ler | perguntas | V |
| Cálculo mental de intervalos | nomear | perguntas | V |
| Solfejar intervalos | cantar | altura | V |
| Localizar intervalos | tocar | visualizador | R |
| Relacionar cordas | tocar | padrões | R |
| Encontrar intervalos ouvidos | ouvir · tocar | perguntas | R |

*Esclarecido em 03/11: em Relacionar cordas, "nota, quinta grave e terça grave" vale para as cordas
**Lá, Ré e Sol** — na corda Mi não há corda mais grave.*

### Escalas e modos

| Família | Tarefa | Motor | Fonte |
|---|---|---|---|
| Identificar graus | ouvir | perguntas | V |
| Reconhecer escalas e modos | ouvir | perguntas | V |
| Comparação de escalas | ouvir | perguntas | V |
| Construção de escalas · Análise de escalas | nomear | perguntas | V |
| Escolha de escala sobre acorde | nomear | progressões | V |
| Cantar a tônica / cantar o grau | cantar | altura | V |
| Solfejar escalas | cantar | padrões + altura | V |
| Comparador de escalas | explorar | visualizador | V |
| Percorrer escalas | tocar | padrões | R |
| Percorrer modos | tocar | padrões | R |
| Alternar entre escalas | tocar | digitações | R |
| Encontrar graus ouvidos · Achar a tônica tocando junto | ouvir · tocar | perguntas | R |
| Improvisar com restrição | criar | progressões | R |

> **Funde:** *Tocar escalas em posição* é preset de *Percorrer escalas* — mesmo objeto, mesma
> tarefa, padrão sempre sequencial.

### Acordes e arpejos

| Família | Tarefa | Motor | Fonte |
|---|---|---|---|
| Identificar acordes · nota de acorde · comparar acordes | ouvir | perguntas | V |
| Construção de acordes · conversão de notação | nomear | perguntas | V |
| Ver desenhos de acorde e identificá-los | nomear | visualizador | V |
| Visualização de arpejos, tríades, tétrades, CAGED, extensões | explorar | visualizador | V |
| Localizar notas de acorde | tocar | visualizador | R |
| Tocar arpejos | tocar | padrões | R |
| Alternar entre arpejos | tocar | perguntas | R |
| Tocar acordes · Tocar tríades abertas | tocar | visualizador | R |
| Tocar acordes de ouvido | ouvir · tocar | perguntas | R |

> **Funde:** *Tocar arpejos do campo harmônico* e *Tocar padrões de arpejo* são presets de *Tocar
> arpejos*. As 19 entradas de visualização dos três instrumentos são ~6 famílias: **instrumento é
> parâmetro**, não razão para entrada separada.

### Harmonia e progressões

| Família | Tarefa | Motor | Fonte |
|---|---|---|---|
| Progressões · cadências · modulação · forma · função cromática · condução de vozes · acordes no campo | ouvir | perguntas | V |
| Ditado harmônico · ditado da linha de baixo · voice leading escrito | escrever | partituras | V |
| Análise harmônica | nomear | perguntas | V |
| Exploração de tonalidades | explorar | visualizador | V |
| Harmonização de melodia | criar | progressões | V |
| Tocar o campo harmônico · guide tones · substituições · walking bass | tocar | progressões | R |
| Ler cifras e tocar progressões | ler · tocar | progressões | R |
| Tirar linhas de baixo de ouvido | ouvir · tocar | perguntas | R |
| Criar linhas de baixo | criar | progressões | R |
| Gerador de linhas de baixo | explorar | progressões | R |
| Acompanhar por estilo | tocar | progressões | R ⚠️ |

> **Funde:** *Conduzir uma linha pelos acordes* e *Tocar guide tones* — guide tones é o caso
> particular útil do primeiro.

### Ritmo e tempo

| Família | Tarefa | Motor | Fonte |
|---|---|---|---|
| Figuras · compassos · subdivisões · acentuação · andamento · tempo forte · swing | ouvir | perguntas | V |
| Leitura rítmica | ler | partituras | V |
| Ditado rítmico | escrever | partituras | V |
| Reprodução de ritmos · pulso interno · polirritmia | tocar | tarefa-metrônomo | V |
| Ler e tocar ritmos | ler · tocar | partituras | R |
| Tocar em tempo | tocar | tarefa-metrônomo | R |
| Manter um groove | tocar | tarefa-metrônomo | R ⚠️ |

### Melodia e frase

| Família | Tarefa | Motor | Fonte |
|---|---|---|---|
| Reconhecimento de frases · cloze · imaginar e conferir | ouvir | perguntas | V |
| Ditado melódico · ditado a duas vozes | escrever | partituras | V |
| Detecção de erro | ler · ouvir | partituras | V |
| Análise de forma e frase | nomear | perguntas | V |
| Reprodução no instrumento virtual | tocar | visualizador | V |
| Tocar motivos em graus | tocar · cantar | padrões | R |
| Aproximar notas-alvo | tocar | progressões | R |
| Tocar melodias de ouvido | ouvir · tocar | perguntas | R |
| Transcrever trechos | escrever · ouvir | partituras | R ⚠️ |
| Transpor frases *(piano)* | tocar | partituras | R |
| Responder frases | criar · ouvir | progressões | R |
| Tocar frases de vocabulário | tocar | progressões | R ⚠️ |

> **Funde:** *Improvisar com escalas · com arpejos · com notas-alvo · com restrições · sobre um
> motivo* são **uma** família — mesma tarefa, mesma validação (conferir a restrição). A restrição é
> parâmetro.

### Notação e símbolos

| Família | Tarefa | Motor | Fonte |
|---|---|---|---|
| Leitura na pauta · claves alternativas | ler | perguntas | V |
| Armaduras · enarmonia e círculo de quintas | nomear | perguntas | V |
| Solfejo com notação | cantar · ler | altura | V |
| Ler e tocar melodias | ler · tocar | partituras | R |

> **É camada, não família:** *Ler à primeira vista* — o próprio rascunho lista "tempo de
> preparação" como preset.

### Som, timbre e dinâmica

| Família | Tarefa | Motor | Fonte |
|---|---|---|---|
| Julgamento de afinação · timbre · dinâmica e articulação | ouvir | perguntas | V |
| Imitar fraseado e articulação | ouvir · tocar | tarefa-metrônomo | R ⚠️ |
| Controlar a dinâmica | tocar | tarefa-metrônomo | R ⚠️ |
| Afinar bends | tocar | altura | R |

> **Objeto órfão:** 7 itens, 3 de validação duvidosa, e não chega aos 4 itens bons que uma porta
> exige. **Candidato a sair do beta inteiro** — ver questão aberta.

### Controle motor

| Família | Tarefa | Motor | Fonte |
|---|---|---|---|
| Executar padrão técnico com metrônomo | tocar | tarefa-metrônomo | R |
| Sincronizar as duas mãos | tocar | tarefa-metrônomo | R |

> **Funde:** *Independência dos dedos · alternar a palhetada · tocar ligados · controlar a duração*
> são **uma** família com biblioteca de padrões. O rascunho admite que o áudio não confere nenhuma
> delas, e é exatamente o caso dos exercícios simples que valem muito e custam pouco.

⚠️ = validação duvidosa ou dependência externa (gravações licenciadas, pesquisa de estilo).

---

## Piano

Trilha própria, não só superfície (decisão 50). O que o pianista encontra:

- **A metade agnóstica inteira** — percepção melódica, harmônica e rítmica, teoria, leitura,
  ditado. É ~60% do catálogo e já serve ao piano sem nenhum trabalho extra; só nunca foi dito.
- **Visualizador de teclado**, o mesmo componente do braço com outro desenho.
- **Leitura em duas pautas**, parâmetro do gerador de partituras.
- **Campo harmônico ao teclado**, voicings, inversões.
- **Mãos juntas e separadas, dedilhados** — a parte que só MIDI valida bem.

**Dedilhado de piano não passa pelo motor de digitações** — lá são convenções fixas apresentadas
como sugestão. *(A confirmar: ver questão aberta.)*

---

## Questões abertas do catálogo

Para uma sessão futura. Nenhuma bloqueia a construção dos motores.

| # | Questão |
|---|---|
| C1 | **"Notas-pivô"** — notas comuns entre duas *posições* (vai para Conectar regiões) ou entre duas *escalas* (vai para Alternar entre escalas)? |
| C2 | **"Arpejos sorteados · todos acordes"** — campo harmônico, as 12 fundamentais de uma qualidade, ou uma progressão? |
| C3 | **Saídas do walking bass** — partitura, braço com digitação, ou os dois? |
| C4 | **Digitação no piano** — o motor vale para teclado, ou lá são dedilhados convencionais fixos? |
| C5 | **"Som, timbre e dinâmica"** — o objeto inteiro sai do beta? |
| C6 | **Harmonização de melodia** — vira laboratório de experimentação em vez de quiz? |
| C7 | Convenção de canhoto no desenho do braço — **conferir com um canhoto de verdade**; ninguém no time é. |

**Resolvidas em 03/11:** "descer em sextas" eram terças descendentes; em Relacionar cordas, as
cordas são Lá, Ré e **Sol**.
