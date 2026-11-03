# O microfone entra no beta?

Contrato de saída da [`A0`](../tarefas/F5-som.md#a0--👤💻-espigão-medir-antes-de-prometer). Medido em
03/11/2026 sobre as 24 gravações do Paulo
([`test-fixtures/audio/`](../../test-fixtures/audio/README.md)).

> ## Conclusão
>
> **O microfone entra** — para **voz** e **ritmo relativo**. A detecção acerta a nota em **9 de 9**
> amostras de voz e **7 de 7** de baixo, e o andamento dos ataques bate em **6 de 6** amostras de ritmo.
>
> **Mas o portão de ±15 cents não foi verificado**, e não dá para verificá-lo com estas gravações. Ver
> a ressalva abaixo — ela é a parte importante deste documento.

---

## A ressalva: o que estas gravações não conseguem medir

O portão da tarefa é **±15 cents na mediana da voz**. Ele mede o **erro do detector**.

As vozes foram cantadas **de ouvido, sem afinador**. Então o desvio que eu meço — 16 a 36 cents contra a
nota temperada — é a **soma** de dois erros que não se separam:

1. quanto o detector erra;
2. quanto a voz estava fora.

Um cantor afinado erra 10 a 20 cents com facilidade, então **16 cents pode ser detector perfeito com voz
humana normal, ou detector ruim com voz exata.** Não dá para saber.

**O que resolve:** regravar duas ou três notas de voz **com um afinador na tela**, anotando o desvio que
o afinador mostrou. Aí o erro do detector é a diferença entre o que eu meço e o que o afinador mostrou.
São cinco minutos de gravação, e só isso fecha o portão.

**O que eu posso afirmar sem isso:** a **classe de altura** está certa em todas as amostras, e é ela que
os exercícios de voz usam — o solfejo pergunta "que grau é este", não "quantos cents". Por isso a
recomendação de entrar não depende do portão.

---

## O que foi medido

Implementação: YIN simplificado (diferença acumulada normalizada, com interpolação parabólica), janela de
60 ms, salto de 30 ms, descartando as janelas abaixo de metade do RMS do arquivo. Ataques por envelope no
domínio do tempo com derivada positiva.

⚠️ **Esta implementação é minha, feita para esta medida.** Ela não é a que vai para o app, e parte do erro
pode ser dela. A `A1` deve usar uma implementação de referência.

### Altura — acerto da nota

| Fonte | Amostras | Nota certa | Observação |
|---|---|---|---|
| Voz | 9 | **9** | inclusive com vibrato, ruído de fundo e cantando baixinho |
| Baixo | 7 | **7** | mas 2 com erro de oitava — ver abaixo |

### O erro de oitava do baixo, que era previsto

A corda **Mi solta** (41 Hz) foi detectada **uma oitava acima** nas duas amostras de volume. A corda
**Sol** e a casa 5 saíram exatas. É o calcanhar clássico do YIN em cordas graves, e o guia já previa:

> *"Aceitar qualquer oitava. Erro de oitava é o calcanhar clássico do YIN, e aqui é inofensivo porque a
> classe de altura esperada é conhecida."*

Para o **afinador** (`A2`), que precisa dizer "corda Mi, 12 cents abaixo", isso **não é inofensivo** — e é
o ponto que a `A2` tem de resolver, não a `A1`. O caminho conhecido é usar a corda esperada como
referência e aceitar múltiplos.

### Nota curta

`baixo-mi-curta-cel` rendeu **9 janelas** contra 100 a 270 das sustentadas. Era o caso que o guia mandava
medir para saber o que **não** aguenta, e a resposta é: staccato não dá material suficiente. **Nenhum
exercício deve pedir detecção de nota curta.**

### Ritmo — o andamento bate

| Amostra | Pedido | Medido |
|---|---|---|
| Palmas, semínimas | 60 bpm | **59,9** |
| Palmas, semínimas | 120 bpm | **120,1** |
| Palmas, colcheias | 80 bpm | **160,9 colcheias/min** = 80 bpm |

E o padrão sincopado (**3 + 3 + 2**, o *tresillo*) saiu com proporções **1,51 · 1,49 · 1,00** nas palmas —
o que confirma que o cálculo **relativo** da `A4` funciona: as proporções entre os ataques da própria
pessoa, sem referência a relógio nenhum.

Estalos e mesa ficaram em 1,6 em vez de 1,5. O ataque mais fraco e abafado desloca o pico do envelope, e
é por isso que o guia pedia essas fontes.

### O metrônomo vazou, e não atrapalha

**10 a 15 dB abaixo das palmas.** Com limiar de 30% do pico, o número de ataques não muda; só abaixo de
8% o clique começa a ser contado.

Virou um **teste melhor do que o planejado**: um detector com limiar mal escolhido conta o metrônomo, e a
amostra acusa.

---

## O que falta nas amostras

| | Consequência |
|---|---|
| **Palmas com eco** (banheiro) | é onde o detector mais erra. O portão da `A4` fica sem o pior caso |
| **Par "microfone de notebook"** | não dá para comparar microfone bom com ruim — tudo foi no celular |
| **Voz com afinador na tela** | **o portão de ±15 cents fica aberto** — ver a ressalva acima |

Nenhuma delas impede começar a `A1`. A terceira impede **fechar** a `A0`.

---

## Consequência para as tarefas

| Tarefa | Situação |
|---|---|
| `A1` · detecção de altura | **pode começar.** As amostras servem de teste; aceitar qualquer oitava |
| `A2` · afinador | **pode começar**, e tem de resolver o erro de oitava na corda Mi |
| `A3` · voz / solfejo medido | **pode começar** com a classe de altura. O ponteiro em cents depende do portão |
| `A4` · ritmo relativo | **pode começar.** As proporções funcionam; falta o caso com eco |
| `A5` · MIDI | independente de tudo isto |
