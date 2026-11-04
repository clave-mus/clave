# F5 · Som: microfone, MIDI e partituras

Afinador, voz, ritmo, MIDI e o gerador de partituras unificado. **Independente de todas as outras
frentes** — dá para pegar a qualquer momento.

**Todas as tarefas aqui têm contrato de saída verificável** (decisão 32). Duas delas produzem
**números**, não interface — e "o número deu ruim" é um resultado de sucesso, não um fracasso.

> ⚠️ **Microfone e MIDI são opcionais e experimentais** (decisões 6, 43, 44). **Nenhum exercício
> pode depender deles.** O padrão de validação é sempre autoavaliação. Se você se pegar escrevendo
> um exercício que só funciona com microfone, pare e pergunte.

**Ordem:** `A0` → `A1` → `A2` → `A3` → `A4`. `A5` (MIDI) é independente de todas.

---

## A0 · 👤+💻 Espigão: medir antes de prometer ⚠️ *gravado e medido em 03/11/2026 — o portão de cents segue aberto*

> **O Paulo gravou as 24 amostras e eu medi.** O resultado está em
> [docs/medidas/microfone.md](../medidas/microfone.md): **o microfone entra**, para voz e ritmo relativo.
>
> **Mas o portão de ±15 cents NÃO foi verificado**, e não dá com estas gravações: as vozes foram cantadas
> de ouvido, então o desvio medido mistura erro do detector com erro de canto, e os dois não se separam.
> Fechar o portão custa **cinco minutos**: regravar duas ou três notas com um afinador na tela, anotando o
> desvio que ele mostrou.

**Decisão de origem:** 43. **Bloqueia:** A1, A3, A4.

**Esta tarefa não produz interface nenhuma. Produz um número.** Se o número for ruim, o microfone
sai do beta e a tarefa terminou com sucesso.

**Primeiro, 👤 o Paulo grava as amostras** — o passo a passo está em
[guias/gravacoes.md](../guias/gravacoes.md). Uma hora, com o celular e um notebook. Sem elas nada
aqui existe, e sem elas as tarefas seguintes não têm teste automático:

| Amostra | Variações |
|---|---|
| Voz grave cantando notas sustentadas | afinada · desafinada em ~30 cents · com vibrato |
| Voz aguda, o mesmo | idem |
| Baixo, corda grave e corda aguda | nota sustentada · nota curta |
| Palmas, estalos e batidas na mesa | ritmos simples e sincopados, a 60 e a 120 bpm |

Cada uma gravada **duas vezes**: microfone bom e microfone de notebook ruim, com ruído de fundo
normal de casa. Guardar em `test-fixtures/audio/`, com um `README.md` dizendo o que é cada arquivo,
em que tom e em que andamento.

**Depois, 💻 medir** YIN (ou McLeod) e um detector de envelope contra as amostras, no Chrome e no
Safari do iPhone.

**Contrato de saída:** o arquivo `docs/medidas/microfone.md` existe e contém uma tabela com, por
amostra e por navegador:

- **erro mediano em cents** na altura detectada;
- **taxa de erro de oitava**;
- **ataques detectados / ataques reais**, e quantos foram disparo duplo;
- **latência medida** do ataque físico até o evento no AudioWorklet.

**Pronto quando:** a tabela existe e tem uma conclusão escrita em uma frase: *o microfone entra* ou
*o microfone não entra*. O portão sugerido é **±15 cents** na mediana da voz; abaixo disso, segue.

---

## A1 · Detecção de altura

**Decisão de origem:** 43. **Depende de:** A0.

Escopo **restrito a uma nota sustentada monofônica**. É o caso mais fácil que existe.

- Captura com permissão de microfone, rodando **fora da thread principal** (AudioWorklet).
- YIN ou McLeod, com limiar de confiança e de volume para ignorar ruído.
- **Ignorar os primeiros ~100 ms** de cada nota: o ataque é instável e não vale nada.
- Medir a **mediana de uma janela**, nunca o instante — é o que absorve vibrato.
- **Aceitar qualquer oitava.** Erro de oitava é o calcanhar clássico do YIN, e aqui é inofensivo
  porque a classe de altura esperada é conhecida.
- Voz e corda graves pedem janela de análise maior, e portanto resposta mais lenta. Não quebra.

**Contrato de saída:** teste automático contra as amostras de `A0`, exigindo **±10 cents** nas
notas sustentadas e **zero** erros de oitava não corrigidos. O teste roda no CI.

**Não faça** — e é isto que mantém a tarefa pequena:

- **Nada de detecção de ataques.** É a `A4`.
- **Nada de calibração de latência.** Nenhuma tarefa desta frente precisa, porque nada aqui compara
  o tempo da pessoa com o relógio do app.
- **Nada de polifonia.** Para acordes existe MIDI (`A5`).

---

## A2 · Afinador

**Decisão de origem:** 25. **Depende de:** A1, F4-2.

- Atalho fixo no cabeçalho — uso de 30 segundos não merece aba (decisão 20b).
- Cromático, com predefinições: violão/guitarra padrão, Drop D, meio tom abaixo, baixo de 4 e de
  5 cordas. **As cordas vêm do perfil** (decisão 47).
- Mostra a corda mais provável e o quanto falta em cents, com aviso claro de afinado.
- **Escrito na tela:** o áudio não sai do aparelho.

**Contrato de saída:** teste contra as amostras de baixo de `A0` identificando a corda certa; e uma
verificação manual registrada — afinou um violão e um baixo reais, num celular e num computador.

---

## A3 · Voz: solfejo medido

**Decisões de origem:** 42, 43. **Depende de:** A1.

Destrava o bloco de voz: *cantar a tônica · cantar o grau · solfejar intervalos · solfejar escalas
· solfejo com notação*.

**A escolha de produto que remove o risco:** apresentar como **medição, não como julgamento.**
Um ponteiro de cents, como o afinador — nunca um "errou". Cantar é onde as pessoas são mais
inseguras, e um app que diz "errado" quando ela acertou perde o usuário na primeira sessão. Um
ponteiro que treme um pouco é só um ponteiro.

- Drone da tônica tocando enquanto se canta.
- Validar **em sequência** quando houver instrumento junto (cantar, depois tocar), para a voz não
  se misturar.
- Usa o **motor de padrões** (`FM-1`) para solfejar escalas — é a peça que atravessa as duas
  metades da matriz.

**Contrato de saída:** teste contra as amostras de voz de `A0`; e **nenhuma string de interface
diz "errado", "incorreto" ou equivalente** — um teste de texto pode garantir isso.

---

## A4 · Ritmo relativo

**Decisão de origem:** 43. **Depende de:** A0.

**Só proporções entre os ataques da própria pessoa.** Isso **cancela a latência do aparelho**, que
é um deslocamento constante: se o ataque A sai em `t₁+L` e o B em `t₂+L`, o intervalo é `t₂−t₁`.

- Detecção de ataque no **AudioWorklet**, por envelope no domínio do tempo (mais baixa latência
  que FFT).
- **Classificar, não pontuar.** Comparar o que foi tocado com o padrão pedido **e com as
  alternativas plausíveis**, e responder uma de três: *bate com o pedido* · *bate com outro* (e
  mostrar qual) · *não deu para entender*. Nada de nota de 0 a 100.
- Normalizar o andamento: ajustar um fator global de escala e comparar as proporções. `[1,1,2]` a
  120 e a 60 é o mesmo padrão.
- **"Foi isto que eu ouvi":** tocar de volta o ritmo detectado. Torna a percepção da máquina
  inspecionável — a pessoa sabe na hora se errou ou se o app não entendeu. **Vale como exercício
  mesmo com a validação desligada**, então entregue isto mesmo que o resto fique ruim.
- **Resposta visual ao ataque:** faixa de onda rolando em canvas, com um traço em cada ataque e o
  padrão esperado atrás em cinza. O orçamento é ~15 a 40 ms, abaixo do limiar de causalidade para
  gesto próprio.

> **O erro que estraga tudo:** o desenho é feedback; **a medição usa o carimbo de tempo do áudio
> dentro do worklet (`currentTime`), nunca o instante em que o pixel acendeu.** Se alguém misturar
> as duas coisas, o exercício inteiro fica errado.

**Contrato de saída:** teste contra as amostras de palmas de `A0`, verificando que a classificação
em três estados acerta o padrão tocado; e um teste que prova que **mudar a latência simulada não
muda o resultado** — é a demonstração de que o cálculo é mesmo relativo.

**Não faça:** **ritmo absoluto, alinhado ao clique, está fora.** É o que exige calibração de
latência, e é de onde vem a fama de "glitchy".

---

## A5 · MIDI

**Decisão de origem:** 44. **Depende de:** nada.

Quarto modo de validação, ao lado de `deterministic`, `self_report` e `microphone`. O item declara
se aceita; quem tem teclado liga, quem não tem nem vê.

- `navigator.requestMIDIAccess()`, eventos de nota com tempo e velocidade.
- **Destrava o que o microfone nunca vai destravar:** acordes, mãos juntas, voicings — hoje
  marcados como não-validáveis no catálogo.
- **Safari não suporta Web MIDI**, o que exclui iPhone e iPad. Degradar em silêncio: sem suporte,
  a opção simplesmente não aparece. *(Conferir no dia — suporte de navegador muda.)*

**Contrato de saída:** teste com eventos MIDI simulados cobrindo nota isolada, acorde de três
notas e acorde com uma nota errada; e verificação de que, num navegador sem Web MIDI, nenhuma
opção de MIDI aparece em lugar nenhum da interface.

**Não faça:** nenhum exercício pode **exigir** MIDI. Prometer a um pianista uma trilha que não
funciona no iPhone dele é pior do que não prometer.

---

## F5-3 · Gerador de partituras unificado

**Decisão de origem:** 18. **Depende de:** F1-1.

Os dois leitores atuais — a ferramenta `leitura` e a ferramenta `ritmo` — viram **um motor só**, que
passa a ser infraestrutura para leitura melódica, leitura rítmica, ditado e localização de notas.
**Motores duplicados são proibidos.**

**Fica o que o Clave já tem e tem teste** (não reescrever): fórmulas simples, compostas e ímpares;
quiálteras; ligaduras de prolongação entre subdivisões diferentes; figuras pontuadas; o catálogo de
células rítmicas; a validação de coerência das configurações. Está em `src/theory/rhythm-cells.ts`
e `rhythm-gen.ts`, com 21 testes.

**Entra:**

- Modos de geração melódica: aleatório, arpejos com cifra, groove I–IV–V–I com variação, padrões de
  escala (incluindo Hanon), nota pivô, enclosures.
- **Leitura em duas pautas** (piano — decisão 50).
- Rolagem contínua com âncoras de tempo: **mudar o andamento durante a execução sem reiniciar**.
- Agendamento com antecedência (reusar `audio/engine.ts`), grafia enarmônica por tonalidade
  (reusar `theory/core.ts`), agrupamento de hastes.
- Contagem regressiva, barra de espaço, liga/desliga separado de contagem, notas e metrônomo.
- Opção de **não colorir** as notas no modo rítmico.

**Fica para depois:** páginas estáticas de 2/3/4 linhas, biblioteca de timbres, espanhol, ghost
notes e staccato, posições de braço e seleção de cordas.

**Contrato de saída:** o teste de `rhythm-gen` continua passando sem alteração, e um teste novo
gera leitura melódica e rítmica **a partir das mesmas configurações**, provando que o motor é um só.

**Nota:** existe um protótipo em JavaScript puro com VexFlow 4.2.2 (mesma versão, licença MIT) com
vários desses modos melódicos. Se for recuperado, **portar, não reescrever**. Atenção: o guia que o
descreve é **especificação, não relato** — o protótipo entregue era só 4/4, sem idiomas, sem
quiálteras além de tercinas e sem células rítmicas.
