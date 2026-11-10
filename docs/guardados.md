# Guardados

Ideias **tiradas do beta, não descartadas**. Cada uma com o motivo e **o que a traria de volta** —
porque o motivo quase nunca é "a ideia é ruim", e sim "falta uma peça que ainda não existe".

Este arquivo existe para que nada se perca entre uma rodada de decisão e outra. Quando a peça que
falta chegar, o item volta para a mesa.

> **Como mexer aqui.** Tirar algo do beta é decisão de produto: vai para este arquivo com a data e
> o motivo. **Trazer de volta também é decisão de produto** — não é algo que se faça dentro de uma
> tarefa.

---

## Depende de áudio gravado

Nenhum destes é tocável com a síntese do `audio/engine.ts`. Precisam de **material gravado**,
produzido ou licenciado — e o documento de visão fecha a porta mais fácil: *música de IA está
fora*, em qualquer forma.

*Decisão 59, 03/11/2026.*

| Item | O que é | O que traria de volta |
|---|---|---|
| **Transcrever trechos de gravações** | ouvir um trecho real e transcrevê-lo | gravações licenciadas, ou material autoral |
| **Imitar fraseado e articulação** | ouvir um fraseado e reproduzi-lo | gravações com instrumento real · validação também é duvidosa |
| **Acompanhar por estilo** | acompanhar com o padrão idiomático de um estilo | pesquisa de estilo + padrões gravados, revisados por quem toca aquele estilo |
| **Manter um groove** | sustentar um groove sem derivar | idem |
| **Reconhecimento de forma** | ouvir uma peça e identificar AABA, blues de 12, verso/refrão | peças inteiras, licenciadas |
| **Identificação de timbre** | reconhecer instrumento, tipo de som e efeito | biblioteca de timbres e efeitos gravados |
| **Percepção de dinâmica e articulação** | comparar duas execuções e dizer qual é mais legato, forte ou acentuada | gravações pareadas |

**Em aberto, não guardado:** **Tocar frases de vocabulário** (licks por estilo). Gravar licks de
guitarra é viável e o time tem guitarristas — é trabalho de músico, não de código. Não entra no beta
como compromisso, mas também não foi descartado.

**Parado para conversa do grupo:** pesquisa de estilo. Acompanhamento de música erudita é candidato
natural do Bernardo Garcia, se ele quiser.

### Bateria de acompanhamento, e o exercício de estimar o BPM

*Anotado em 06/11/2026, a pedido do Paulo. **Não entrou em tarefa nenhuma** — está aqui para
decidir depois.*

Duas coisas, e elas se separam melhor do que parecem:

1. **O exercício:** toca um groove de bateria num andamento e pede a **estimativa do BPM**.
2. **O uso maior:** bateria de acompanhamento **em outros exercícios**, não só neste.

**O (1) não depende de material gravado, e por isso não está guardado — está buildável hoje.**
`audio/engine.ts` já sintetiza `bumbo`, `caixa` e `chimbal`, e o `Clock` já agenda com
antecedência.

**A pergunta do Paulo — "dá para mudar o BPM sem distorcer o áudio?" — tem uma resposta que decide
o desenho:** sim, **desde que não se guarde um loop pronto.** Quem sequencia **golpes** (sintetizados
ou amostras de um golpe só) muda o andamento mudando um número: cada ataque é disparado no instante
certo e nada precisa ser esticado. Quem guarda **um arquivo de loop de dois compassos** cai no
problema — `playbackRate` muda a altura junto (a bateria fica aguda e "de desenho animado"), e
esticar mantendo a altura pede *time-stretch*, que é caro, artefatado e some com a definição do
ataque, justo o que importa num estudo de ritmo.

> **A regra, então: sequenciar golpes, nunca esticar loop.** Ela vale igual para síntese e para
> amostras — e é o que mantém o andamento livre de graça.

**O (2) é que esbarra em material gravado:** groove com levada de verdade — notas fantasma,
dinâmica, variação de ataque — não sai da síntese atual. Aí voltam as perguntas de origem e de
licença, e a porta mais fácil continua fechada: **música de IA está fora**, em qualquer forma
(visão, e a decisão 59 no topo desta seção).

**👤 Como buscar e aprovar o material — decisão do Paulo, não de uma tarefa:**

| | |
|---|---|
| **Origem** | amostras de licença livre (CC0) · pacote comercial **com direito de redistribuição** (a licença precisa cobrir distribuir dentro de um app, não só "uso em música") · gravação autoral do time |
| **Formato** | **one-shots** (um golpe por arquivo), pelo motivo acima — e não loops renderizados |
| **Aprovação** | ouvido humano de quem toca. É o mesmo princípio que `padroes-ritmicos.md` já exige para o vocabulário rítmico: revisor de tradição, não ouvido de IA |

---

## O objeto "Som, timbre e dinâmica"

**Sai inteiro do beta.** Seis itens: três dependem de gravação (acima), dois têm validação duvidosa,
e os dois que sobrariam **são o afinador com uma pergunta em volta**.

*03/11/2026.*

| Item | O que é | Situação |
|---|---|---|
| **Julgamento de afinação** | ouvir uma nota ou intervalo levemente desafinado e dizer se está alto ou baixo | vira **preset do afinador** |
| **Afinar bends** | tocar um bend até a nota-alvo, com retorno em cents | vira **preset do afinador** |
| Identificação de timbre | — | guardado, ver acima |
| Percepção de dinâmica e articulação | — | guardado, ver acima |
| Imitar fraseado e articulação | — | guardado, ver acima |
| **Controlar a dinâmica** | crescendo, decrescendo e acentos em tempos definidos | guardado: mede contraste **relativo**, nunca volume absoluto — e isso precisa de desenho próprio |

**O que traria o objeto de volta:** uma biblioteca de áudio gravado, e um desenho para medir
dinâmica que não prometa mais do que o microfone entrega.

---

## Fora por ambiguidade

*03/11/2026.*

| Item | Por que saiu |
|---|---|
| **Análise de forma e frase** | dividir uma melodia em motivos, frases e períodos. **Onde termina uma frase é interpretativo** — não há resposta única, e item ambíguo não pode gerar "erro do usuário" (decisão 13) |

---

## Fora como porta por objetivo

Continuam existindo como **assunto**; o que saiu foi a porta, por não ter catálogo atrás.
*Decisão 20.*

| Porta | Por quê | O que traria de volta |
|---|---|---|
| **Compor e desenvolver criatividade** | zero itens no catálogo | exercícios de composição, que ninguém desenhou ainda |
| **Tocar melhor com outras pessoas** | é comportamento de conjunto; o backing track arranha e só | ferramentas de ensaio, ou conteúdo de prática em grupo |
| **Organizar meus estudos** | não é objetivo — **é o produto** | nada: isto são as rotinas |

---

## Adiado por fase

| Item | Quando | Por quê |
|---|---|---|
| **Biblioteca pública de rotinas** | depois do beta | publicar texto de usuário herda moderação, denúncia, termos, LGPD e ECA de uma vez. O **link** entrega o valor sem o custo (decisão 23) |
| **Apps de iOS e Android** | depois do beta | dependem de contas pagas e de busca de marca, que são fila externa. O beta roda em PWA |
| **Vídeos do YouTube nas aulas** | depois do beta | curar 1 a 3 vídeos por aula em dois idiomas antes de a estrutura das aulas assentar é retrabalho garantido |
| **Análise de uso (PostHog)** | depois do beta | a hipótese do beta é qualitativa e se responde conversando com 20 a 30 pessoas (decisão 34) |
| **Espanhol** | depois do beta | português e inglês primeiro (decisão 27) |
| **Progressão por habilidade** (em vez de por exercício) | depois do beta | é a ideia mais forte da variação automática, mas **afirmar transferência de habilidade sem dado é irresponsável** (decisão 9) |
| **Regras de escrita no voice leading** (quintas paralelas, dobramento, resolução da sensível) | Fase 2 | cada regra precisa de uma decisão sobre **em que tradição ela vale** — no jazz, quintas paralelas são vocabulário. Entram como aviso, nunca como erro |
| **Microfone nos exercícios além de voz e ritmo relativo** | depois | ritmo alinhado ao clique exige calibração de latência, e é de onde vem a fama de "glitchy" (decisão 43) |
| **"Quer dificultar? acrescente colcheias"** — o preset sugerindo o próximo passo | depois | ideia do Paulo em 06/11/2026, no preset *Ligaduras* da leitura rítmica. Adiada **por ele**, como questão de experiência de uso. O que ela pede embaixo não é pequeno: saber *há quanto tempo a pessoa usa aquele preset* é guardar histórico de uso por exercício, e aí a sugestão encosta na fronteira do que nunca entra — medir a pessoa. **O que traria de volta:** decidir se o aviso é estático (o preset diz qual é o próximo, para todo mundo, sem olhar ninguém) ou se o app passa a acompanhar uso por exercício. São desenhos diferentes, não graus do mesmo |

---

## Fora em definitivo

Não é "ainda não": é "não".

| Item | Por quê |
|---|---|
| **Mentor com IA** | caro, experimental, e não contribui para a aposta de retenção |
| **Música gerada por IA**, em qualquer forma | decisão do documento de visão |
| **Ranking**, em qualquer forma e em qualquer fase | ensinaria a pessoa a configurar o exercício mais fácil |
| **Streak de dias praticados** | cobrança disfarçada. *(A contagem de acertos seguidos dentro de uma série fica — ver decisão 55.)* |
| **Badges, XP, níveis, percentual de domínio** | o Clave é plataforma de estudo, não jogo |
| **Visão computacional** para ver o que a pessoa toca | ideia boa, projeto à parte |
| **Iniciantes absolutos** e trilhas de curso completas | o Clave não é curso do zero, e se vender como tal afastaria quem já sabe algo |

---

## O que NÃO saiu, e por quê — para não ser cortado por engano

Itens que eu propus cortar e que ficaram, com o motivo de terem ficado. Está aqui porque o motivo
vale mais que o item:

- **Leitura em claves alternativas** (clave de dó, transposição para Si♭, Mi♭ e Fá). Eu propus
  cortar por público — baixo, guitarra e piano resolvem tudo com clave de sol e clave de fá.
  **Ficou**, e o motivo é um princípio: **não nos restringimos rigidamente a esses três
  instrumentos.** Cantores, instrumentistas de sopro e quem só quer ouvido e teoria usam a metade
  agnóstica do catálogo — que é cerca de 60% dele.
- **Cantar os guide tones de uma progressão.** Eu adiei alegando que dependia de voz validada — mas
  **a voz validada está no beta** (`A3`), e a progressão por baixo o `backing` já toca. Cortei por
  inércia, e o argumento se contradizia sozinho.
- **Responder frases (call and response).** É o único item do grupo "depende de áudio" cujo material
  pode ser **sintetizado**: o app toca uma frase gerada e a pessoa responde tocando.
