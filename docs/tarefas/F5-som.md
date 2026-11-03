# F5 · Som e instrumento

Afinador e gerador de partituras unificado. **Independente de todas as outras frentes** — dá para
pegar a qualquer momento.

---

## F5-1 · Detecção de altura

**Decisão de origem:** 25. **Bloqueia:** F5-2.

Escopo **restrito ao afinador**: uma nota sustentada monofônica. É o caso mais fácil de detecção
de altura que existe.

- Captura com permissão de microfone, rodando fora da thread principal (AudioWorklet).
- Algoritmo para uma nota por vez (YIN ou McLeod), com limiar de confiança e de volume para
  ignorar ruído.
- Testes com amostras gravadas de violão, baixo e voz (afinado, desafinado, com ruído).

**Pronto quando:** detecta a nota certa dentro de ±10 cents nas amostras de teste, e funciona no
Chrome, no Safari do iPhone e no Firefox.

**Não faça** — e isto é o que mantém a tarefa pequena:

- **Nada de detecção de ataques (onsets).** Afinador não precisa.
- **Nada de calibração de latência.** Afinador não precisa; é a parte cara, e só serve ao
  microfone nos exercícios (`A7`).
- **Nada de acordes.** Detecção polifônica está fora do plano inteiro.

---

## F5-2 · Afinador

**Decisão de origem:** 25. **Depende de:** F5-1, F4-2.

- Atalho fixo no cabeçalho (decisão 20b) — uso de 30 segundos não merece navegação.
- Cromático, com predefinições: violão/guitarra padrão, Drop D, meio tom abaixo, baixo de 4 e de
  5 cordas.
- Mostra a corda mais provável e o quanto falta em cents, com aviso claro de afinado.
- **Escrito na tela:** o áudio não sai do aparelho.

**Pronto quando:** afina um violão e um baixo reais de ponta a ponta, num celular e num computador.

---

## F5-3 · Gerador de partituras unificado

**Decisão de origem:** 18. **Depende de:** F1-1.

Os dois leitores atuais — a ferramenta `leitura` e a ferramenta `ritmo` — viram **um motor só**, que
passa a ser infraestrutura para leitura melódica, leitura rítmica, ditado e localização de notas.
**Motores duplicados são proibidos.**

**Fica o que o Clave já tem e tem teste** (não reescrever):

Fórmulas simples, compostas e ímpares; quiálteras; ligaduras de prolongação entre subdivisões
diferentes; figuras pontuadas; o catálogo de células rítmicas; e a validação de coerência das
configurações. Está em `src/theory/rhythm-cells.ts` e `rhythm-gen.ts`, com 21 testes.

**Entra:**

- Modos de geração melódica: aleatório, arpejos com cifra, groove I–IV–V–I com variação, padrões de
  escala (incluindo Hanon), nota pivô, enclosures.
- Rolagem contínua com âncoras de tempo: **mudar o andamento durante a execução sem reiniciar a
  partitura**; pausar e continuar no ponto.
- Agendamento de áudio com antecedência (já existe em `audio/engine.ts` — reusar, não refazer).
- Grafia enarmônica correta por tonalidade (já existe em `theory/core.ts` — reusar).
- Agrupamento de hastes, com tratamento de pausas nas pontas.
- Contagem regressiva; barra de espaço; liga/desliga separado de contagem, notas e metrônomo.
- Opção de **não colorir** as notas no modo rítmico.

**Fica para depois:** páginas estáticas de 2/3/4 linhas, biblioteca de timbres, espanhol, ghost
notes e staccato, posições de braço e seleção de cordas.

**Pronto quando:** existe um motor só; ele gera leitura melódica e rítmica a partir das mesmas
configurações; e trocar o andamento no meio da execução não reinicia a partitura.

**Nota:** existe um protótipo em JavaScript puro com VexFlow 4.2.2 (a mesma versão já usada,
licença MIT) com vários desses modos melódicos. Se ele for recuperado, **portar, não reescrever**.
Atenção: o guia que descreve esse protótipo é **especificação, não relato** — o protótipo entregue
era só 4/4, sem idiomas, sem quiálteras além de tercinas e sem células rítmicas.
