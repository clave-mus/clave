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

**A regra que decide quando é um item ou dois — são três casos, e só um funde** (decisão 52):

| Situação | Resultado |
|---|---|
| Um item **trabalha vários objetos ao mesmo tempo** | **um item, vários objetos.** "Tocar motivos em graus" usa material de escala, mas treina ouvir um desenho por dentro: casa em *melodia*, etiqueta em *escalas* |
| Itens trabalham **objetos diferentes**, mesma tarefa | **itens diferentes.** Identificar intervalo não é identificar acorde |
| Itens trabalham **o mesmo objeto e a mesma tarefa**, variando só a superfície ou o material | **um item**, com a variação como parâmetro |

Aparecer em vários lugares é conveniência. **Duplicar a implementação é dívida** (decisão 19).

**Os dois eixos são independentes do contexto.** "Tocar" num braço virtual, na tela, continua sendo
a tarefa *tocar* — ela só não exige o instrumento. O que exige instrumento, microfone ou voz é
declaração à parte no item (`requires`).

### Células vazias

Vazio não é tudo igual, e a distinção é o que torna a matriz útil:

- **Sem sentido** — *Controle motor × Ouvir*. A célula não existe no mundo. Ignorar.
- **Oportunidade** — fazem sentido, ninguém prometeu nada, a matriz as sugeriu de graça. As duas
  primeiras **viraram itens** (decisão 63): *Ritmo × Cantar* (vocalizar ritmo) e *Harmonia ×
  Cantar* (cantar guide tones). *Ritmo × Criar* (criar variações de groove) ficou fora: a restrição
  é validável, mas o valor do exercício não está claro.
- **Buraco** — deveria existir e não existe. Hoje há **um**: *Notas e o braço × Ouvir*. "Achar no
  braço a nota que você ouviu" existe no catálogo, mas etiquetada em Escalas e Intervalos — então
  quem entra por "quero conhecer o braço" não a encontra. É erro de etiqueta, não falta de item.

Nada disso aparece para quem usa o app: a pessoa entra por **objetivo** (decisão 20), não pela
matriz. O único lugar onde isso vaza é a porta secundária "por área", e a regra de que *uma porta
só existe com 4+ itens atrás dela* já resolve.

---

## Os oito motores

**Largura não se mede em exercícios. Mede-se em motores.** São ~95 famílias, e todas são presets
sobre **oito motores de catálogo**, apoiados em **três bibliotecas que já existem**.

**Bibliotecas de base, prontas e testadas:** `theory/core` (grafia por tonalidade, escalas,
acordes, campo harmônico) · `audio/engine` (síntese e agendamento com antecedência) ·
`rhythm-gen` (geração de compassos). Nada aqui precisa ser construído.

**Os oito motores de catálogo:**

| Motor | Estado | Serve a |
|---|---|---|
| **Perguntas** (`Player`) | ✅ pronto | ~48 famílias de Ouvir, Ler e Nomear |
| **Visualizador** de braço e teclado | ⚠️ componentes existem, falta a ferramenta | ~14: toda a coluna Explorar, e as superfícies de Tocar |
| **Progressões** e harmonia aplicada | ⚠️ parcial | ~15: campo harmônico, cifras, walking, guide tones, improviso |
| **Partituras** | ⚠️ existe em dois, **falta fundir** (decisão 18) | ~13: leitura melódica e rítmica, ditado |
| **Padrões** | ❌ não existe — **e é uma tarde** | ~10, nas duas metades da matriz |
| **Tarefa com metrônomo** + autoavaliação | ✅ existe (`tools/Cadencia.tsx`) — serve a 5 famílias | ~9: técnica, execução, groove |
| **Altura** (microfone e MIDI) | ❌ não existe | ~4, todas opcionais |
| **Digitações** | ❌ não existe | ~3 diretamente, e é parâmetro de muitos outros |

**Dois enumeradores, que não são motores.** `percorrer` (padrões de escala) e `conduções` (voice
leading) são **funções puras** sem interface nenhuma: recebem material musical e devolvem uma lista
ordenada. Quem desenha é o motor de partituras ou o visualizador. Vale notar porque a tentação de
contá-los como motores é real, e contar errado infla a estimativa de trabalho.

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

### Motor de formas

> **A `A21` renomeou e encolheu este motor em 03/11/2026: o objeto é FORMA, não digitação.** Forma é
> onde as notas estão no braço, cega para dedo; digitação é que dedo em cada nota. O app precisa de
> forma na maior parte dos casos, e **dizer o dedo passou a ser opcional item a item** — só a `T1`
> (permutações de dedos) o exige, porque ali o dedo *é* o exercício.
>
> As regras de viabilidade abaixo descrevem a **mão dedo a dedo** e por isso valem para digitação
> (a `T1`), não para forma. Sem dedo, a viabilidade é geométrica e tem três regras: cabe na mão (vão
> de até 5 casas, descontando as soltas), cabe no braço, e não salta corda vazia. Ver
> [tarefas/FM-motores.md § FM-2](tarefas/FM-motores.md#fm-2--motor-de-formas) e
> [guias/formas.md](guias/formas.md).


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
menor extensão entre dedos *(estes dois viram um só sem dedo: **menor vão**)* · usar cordas soltas · evitar cordas soltas · n notas por corda · e o
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

Os oito itens (ver [decisoes.md](decisoes.md#o-portão-de-qualidade-de-exercício)) não se aplicam
todos no mesmo lugar — exigir os sete de 95 famílias inviabilizaria o catálogo largo.

| Nível | Quais itens | Quantas vezes |
|---|---|---|
| **Motor** | grafia e convenção corretas · som decente · teste automático | **8** |
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
| Conectar regiões do braço · notas-pivô | tocar | digitações | R |
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
| Reconhecer escalas e modos *(as duas melódicas são duas entradas — decisões 70 e 72)* | ouvir | perguntas | V |
| Comparação de escalas | ouvir | perguntas | V |
| Análise de escalas | ler · nomear | perguntas | V |
| Construção de escalas *(inverso: dado o nome, escrever as notas — não existe ainda)* | escrever | perguntas | V |
| Escolha de escala sobre acorde | nomear | progressões | V |
| Cantar a tônica / cantar o grau | cantar | altura | V |
| Solfejar escalas | cantar | padrões + altura | V |
| Comparador de escalas | explorar | visualizador | V |
| Percorrer escalas | tocar | padrões | R |
| Percorrer modos | tocar | padrões | R |
| Alternar entre escalas *(notas comuns entre escalas)* | tocar | digitações | R |
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
| Ditado harmônico · ditado da linha de baixo | escrever | partituras | V |
| Voice leading | escrever · tocar | partituras · visualizador | V |
| Cantar guide tones | cantar | progressões | matriz |
| Análise harmônica | nomear | perguntas | V |
| Exploração de tonalidades | explorar | visualizador | V |
| Harmonização de melodia | criar | progressões | V |
| Tocar o campo harmônico · substituições | tocar | progressões | R |
| Walking bass | ler · tocar | progressões + digitações | R ⏳ *fora do caminho crítico — decisão 75* |
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
| Leitura rítmica | ler · tocar | partituras | V+R |
| Ditado rítmico | escrever | partituras | V |
| Reprodução de ritmos · polirritmia | tocar | tarefa-metrônomo | V |
| Tocar em tempo | tocar | tarefa-metrônomo | V+R |
| Vocalizar ritmo | cantar | tarefa-metrônomo | matriz |
| Deslocamento de padrão *(T8 — um tempo, família e modos)* | tocar | tarefa-metrônomo | 83 |
| Identificar o padrão *(clave, telecoteco, baião… — consome a biblioteca)* | ouvir | perguntas | 84 |
| ~~Manter um groove~~ | tocar | — | [guardado](guardados.md) |

> **Funde** (decisão 61): *Leitura rítmica* e *Ler e tocar ritmos* são a mesma tarefa — bater palma
> ou tocar uma nota é **parâmetro de superfície**. E *Pulso interno (clique que some)* é **preset**
> de *Tocar em tempo*, não item: o próprio rascunho dizia que o absorvia.

> **Nova, da matriz** (decisão 63): *Vocalizar ritmo* preenchia a coluna *Cantar*, que era a mais
> vazia de todas. Gerador de ritmo que já existe, mais autoavaliação.

### Melodia e frase

| Família | Tarefa | Motor | Fonte |
|---|---|---|---|
| Reconhecimento de frases · cloze · imaginar e conferir | ouvir | perguntas | V |
| Ditado melódico · ditado a duas vozes | escrever | partituras | V |
| Detecção de erro | ler · ouvir | partituras | V |
| ~~Análise de forma e frase~~ | nomear | — | [guardado](guardados.md): onde termina uma frase é interpretativo (decisão 13) |
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

**Fora do beta inteiro** (decisão 60). Seis itens: três dependem de áudio gravado, dois têm
validação duvidosa, e os dois que sobrariam são o afinador com uma pergunta em volta.

| Família | Tarefa | Destino |
|---|---|---|
| Julgamento de afinação | ouvir | **preset do afinador** |
| Afinar bends | tocar | **preset do afinador** |
| Identificação de timbre | ouvir | [guardado](guardados.md) — depende de gravação |
| Percepção de dinâmica e articulação | ouvir | [guardado](guardados.md) — depende de gravação |
| Imitar fraseado e articulação | ouvir · tocar | [guardado](guardados.md) — gravação · validação duvidosa |
| Controlar a dinâmica | tocar | [guardado](guardados.md) — mede contraste relativo, não volume |

O objeto continua existindo como **assunto** (uma aula de teoria pode falar de articulação). O que
saiu foram os itens.

### Controle motor

Sete famílias (decisão 81). Antes eram duas, e **as duas eram o mesmo recipiente** — "faça um
padrão com o metrônomo", sem conteúdo nenhum.

| Família | Tarefa | Motor | Fonte |
|---|---|---|---|
| Permutações de dedos *(T1 — 24 ordenações; "independência dos dedos" é preset dela)* | tocar | tarefa-metrônomo | 81 |
| Sequência de cordas *(T2)* | tocar | visualizador | 81 |
| Deslocamento de acento *(T3)* | tocar | tarefa-metrônomo | 81 |
| Subdivisão alternada *(T4 — a única que não se faz sozinho)* | tocar | tarefa-metrônomo | 81 |
| Troca de posição *(T5)* | tocar | digitações | 81 |
| Sustentar e cortar *(T6)* | tocar | tarefa-metrônomo | 81 |
| Legato e staccato alternados *(T7)* | tocar | tarefa-metrônomo | 81 |
| Sincronizar as duas mãos | tocar | tarefa-metrônomo | R |

> **O critério:** em técnica, a contribuição do app é **escolher o que a pessoa não escolheria** —
> não validar. Sozinha ela toca 1-2-3-4 e 4-3-2-1 e nunca 2-4-1-3.

> **Não são itens:** *aquecimento* é **rotina** (sequência de passos com tempo — o modelo já faz, sem
> código novo) e *checagem de tensão* é **nota num passo de rotina**, não exercício.

> **E o andamento nunca é comemorado** (decisão 82): é configuração neutra, nunca recorde.

> **A biblioteca de padrões nomeados é dado, não item** (decisão 84): nome, padrão, origem e
> **fonte**, na notação que `rhythm-cells.ts` já tem. Quatro consumidores — a biblioteca, uma aula,
> o item *Identificar o padrão*, e parâmetro de itens que já existem. Como tela, ela seria uma tela
> que lista dados, que é o modo de falha da decisão 15.
>
> **E padrão de tradição precisa de fonte citada e de revisão por quem conhece a tradição**
> (decisão 85). Erro aqui não é erro de teoria, é erro de atribuição.

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
| C7 | **Convenção de canhoto no desenho do braço** — e isto **não é falta de decisão, é falta de pessoa.** Ninguém no time é canhoto, e espelhar errado produz um braço que parece certo para destros e é inútil para quem usa. Implementar como opção de perfil, **sem afirmar convenção**, até alguém canhoto conferir |

**Resolvidas em 03/11:** "descer em sextas" eram terças descendentes; em Relacionar cordas, as
cordas são Lá, Ré e **Sol**; **`C5`** — o objeto "Som, timbre e dinâmica" sai do beta inteiro
(decisão 60); e **`C6`** — harmonização de melodia vira laboratório de transformações nomeadas
(decisão 69).

**Respondidas na rodada seguinte** (decisão 66): voice leading é **quatro vozes em posição
fechada**, nas **duas superfícies com seletor**. O corte de quatro vozes está marcado como
revisável na própria decisão — foi tomado por quem não toca instrumento de cordas.

**`C1` a `C4` resolvidos em 03/11:** notas-pivô são entre **posições**, e o conceito "entre escalas"
já estava no catálogo como *Alternar entre escalas* (73) · a fonte das fundamentais dos arpejos é
**parâmetro**, não três exercícios (74) · walking bass sai pela **partitura**, com o braço como
camada, e fica fora do caminho crítico (75) · **digitação de piano é tabela, não motor** (76).
