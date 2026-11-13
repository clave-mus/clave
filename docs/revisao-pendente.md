# Publicação: o que está em rascunho, e como se publica

A decisão 51 diz que *tarefa delegada constrói o motor e a fiação; publicar a família é passo humano
do Paulo.* Desde a decisão 91 isso **é imposto pelo código**, não só combinado.

> ## ⚠️ O portão está DESLIGADO até o beta (decisão 104)
>
> Em 04/11/2026 o Paulo pediu o catálogo inteiro à vista enquanto o time testa: `PORTAO_LIGADO = false`,
> em `src/catalog/publicacao.ts`. **Rascunho aparece para todos, sem `?revisao=1`.**
>
> **Nada virou `publicado`** — isso afirmaria uma revisão que não aconteceu. O estado de cada item
> continua verdadeiro, e esta lista continua sendo o que falta revisar **antes do beta**, quando o
> portão volta a valer. Virar é trocar `false` por `true` naquela linha.

## Os três estados

| Estado | Quem vê | O que significa |
|---|---|---|
| **`rascunho`** | **ninguém**, a não ser no modo de revisão | construído, ainda não revisado. **É o padrão**: um item novo que não declara `publicacao` já nasce assim |
| **`legado`** | todo mundo | já estava no app **antes** deste portão existir. Visível, mas **sem revisão formal** — a revisão de ambiguidade (`F6-7`) ainda está pendente. Chamá-lo de "publicado" afirmaria uma revisão que não aconteceu |
| **`publicado`** | todo mundo | revisado pelo Paulo, com **data e nome** registrados. **Só ele** muda um item para cá |

O padrão é o estado **mais restritivo**: esquecer de declarar nunca expõe nada.

## Para quem constrói itens (colegas e as IAs deles)

- **Todo item novo é `rascunho`.** Declare `publicacao: RASCUNHO` (de `src/catalog/publicacao.ts`) ou
  omita o campo. **Nunca** escreva `publicado` ou `legado` num item novo: `legado` é só para o que já
  existia, e `publicado` é decisão do Paulo.
- **Liste o item neste arquivo.** Um teste (`publicacao.test.ts`) falha se um rascunho não aparecer aqui
  pelo id entre crases — é o que impede este documento de envelhecer.
- Para ver o seu rascunho funcionando: abra o app com **`?revisao=1`** no endereço
  (`http://localhost:5173/?revisao=1`). Aparece uma faixa avisando, e os rascunhos ganham a marca
  "rascunho". `?revisao=0` desliga, e o botão "Sair" da faixa também.
- **Não há controle para isso no Perfil, de propósito**: quem testa o beta não deve esbarrar nele.

## Para o Paulo: como publicar

Depois de revisar um item (ouvir, tocar, conferir o que a tabela abaixo diz que só você confere), troque no
código:

```ts
publicacao: { estado: 'publicado', revisadoEm: '2026-11-04', por: 'Paulo' },
```

E **tire a linha do item deste arquivo**. O teste exige data no formato `AAAA-MM-DD` e um nome; sem eles,
`publicado` não passa.

## Em rascunho agora

### Técnica — rotinas da ferramenta `tecnica` (decisão 81)

| Id | Família | O que só você confere |
|---|---|---|
| `permutacoes` | **T1** · permutações de dedos | se tocar a ordem na casa 5 (o dedo *f* em `4 + f`) é uma boa postura para o exercício |
| `cordas` | **T2** · ordem das cordas | a convenção (corda 1 = mais aguda **do grupo**) e o que tocar em cada corda: hoje uma nota na casa 5, duas voltas. **Sempre quatro cordas vizinhas** (24 ordens), com seletor de grupo na guitarra — ver a decisão 94 e se quatro vizinhas bastam |

### Rotinas do time (F3-6)

**Sete** (eram nove: *Teoria no silêncio* e *Mapear o instrumento na rua* saíram, e as duas de braço viraram uma). Reescritas em 04/11/2026 depois da revisão do Paulo, e por isso **todas voltaram a
rascunho** — o conteúdo mudou, e o estado diz a verdade. Com o portão desligado (decisão 104) isso não
esconde nada de ninguém.

Cada etapa carrega um campo `porque` que não aparece na tela: é o argumento de ter escolhido aquele
exercício ali, para a revisão não ter de reconstruir o raciocínio.

| Id | Modo | Etapas | O que só você confere |
|---|---|---|---|
| `melodia-de-ouvido` | **a linha §3.2 e o molde do modelo novo** (12/11): o item é o objeto musical e o seu gerador; direção (ouvir/audiar) e superfície são parâmetros. Ouvindo, responde-se a melodia em ordem na superfície escolhida, com conferência por **contorno**; audiando, a melodia aparece escrita (pauta ou graus, tipo `1-5-4-3`), só o contexto toca e o gabarito fica num botão. ⚠️ **Teclado e braço não servem de estímulo do audiar**: mostrar ordem ali exige numerar as marcas, e marca de teclado não tem rótulo — audiando, cai na pauta. Confira o salto padrão (quinta justa), as 3 notas de padrão, e se audiar por graus é claro o bastante sem o nome das notas |
| `notas-acordes-e-leitura` | **a rotina que o Paulo pediu para si** (10/11): notas e acordes no violão E no piano, depois a pauta — ler, correr e audiar. O instrumento de cada etapa é declarado, não `auto`, porque a rotina diz "nos dois". ⚠️ **Falta a terceira parte que ele pediu**: audiar uma melodia ESCRITA de poucas notas. Hoje só existe audiar uma nota; várias notas na pauta é outro objeto (melodia), e se isso é parâmetro ou item novo é decisão dele (decisão 15) |
| `ouvido-campo` | graus do campo harmônico de ouvido (`OR-ouvido-relativo.md`, §3.5): cadência de contexto e um acorde — qual grau soou? Grau e qualidade numa pergunta só, pelo algarismo romano. Empréstimos modais opcionais: no maior o grupo do menor paralelo + ♭II; no menor V e vii° da harmônica, IV e ii do dórico, e ♭II (12/11/2026). Confira a cadência do menor sair da harmônica, e os rótulos romanos |
| `reconhecer-padroes-escala` | a metade de adivinhar do par de padrões de escala (`PE-padroes-de-escala.md`). O motor é `theory/padrao-de-escala.ts`, escrito antes com 25 testes. As alternativas são TODAS as posições do padrão, não quatro — não há distrator a inventar nem como descartar por eliminação. A exploração com a escada clicável **não existe ainda**, e é com ela que vem o link do vídeo do ChicagoBassBuddy clicável; aqui o crédito está na descrição, em texto |
| `percepcao-ritmica` | rotina nova, com o desenho do Paulo: ouvir o ritmo escrito e depois quatro etapas de leitura variando os recursos — pontuadas, quiálteras, as três juntas, e as nove células essenciais. O `ritmo-ouvido` veio da rotina do fone, onde era a única etapa não melódica |
| `de-bolso` | livre | 4 | **o tempo de pensar de cada variação** (6, 10, 12 e 5 s) e se as quatro são os cortes certos dos seis objetos |
| `ouvido-no-fone` | livre | 8 | uma etapa por assunto, sem rodízio — confira se oito cartões é demais numa tela de celular |
| `mapear-braco` | guiada, 30 min | 5 | a fusão das duas antigas. Confira o **rodízio entre identificar e construir** intervalo (etapa 3), e se a última etapa (a que pede o instrumento) atrapalha quem está na rua |
| `internalizar-tonalidade` | guiada, 30 min, rotação | 5 | a ordem das cinco frentes, e se 12 tonalidades em quartas é o ciclo certo |
| `aquecimento-ouvido` | guiada, **8 min** | 4 | dois minutos por frente, a pedido do Paulo. Confira se 2 min dá tempo de entrar no assunto |
| `leitura-diaria` | guiada, 15 min | 3 | separar altura de ritmo antes de juntar |

> **O achado que esta rotina expôs foi resolvido** em 04/11: `no-instrumento` existe e é a primeira
> etapa dela. Era o único buraco óbvio do catálogo — todos os exercícios de braço aconteciam na tela, e
> nenhum pedia para tocar no instrumento de verdade.
>
> **E o critério de inclusão agora é explícito** (decisão 109): *"mapear o braço é internalizar as
> posições das notas no braço — então tudo que trabalhar isso pode estar incluso."* Aplicado, ele tirou
> o **drone** (que trabalha entonação, não posição) e trouxe os dois exercícios de braço de tela, com o
> **braço inteiro** — porque com o instrumento na mão a pessoa acha a nota no braço de verdade e só
> então confirma na tela. **As duas rotinas de braço passaram a compartilhar itens**, e a diferença
> entre elas é o enquadramento e o vão do braço, não a lista.

### Mãos livres (`F6-1`)

| Id | O que só você confere |
|---|---|
| `maos-livres` | **o som e a voz.** A resposta é dita pela síntese de fala do navegador, e a voz varia muito entre aparelhos — em alguns Android a voz portuguesa não vem instalada (a tela avisa e repete o som em vez de dizer). Confira também se o **tempo de pensar** padrão (6 s) é razoável, e se as seis fontes — intervalos, acordes, escalas, modos, graus, notas — são as que valem num ciclo sem tela |

### No instrumento (`F6-4`)

| Id | O que só você confere |
|---|---|
| `no-instrumento` | **se o exercício serve.** Ele é a única coisa no app que pede para tocar no braço de verdade — mostra a nota, espera, revela **todas** as casas onde ela existe na faixa inteira (X8, 06/11/2026: antes marcava uma só, sorteada), e termina na autoavaliação. O app **não ouve**, e por isso o que ele consegue afirmar é pouco: que você praticou, e o que você achou de si. Confira os tempos padrão de espera (8 s) e de exibição da resposta (4 s), e se "ouvir a nota antes" ajuda ou entrega demais |

### Audiar (`X3`, revisão de 04/11/2026)

| Id | O que só você confere |
|---|---|
| `audiar` | **o nome do item e dos dois estímulos** — ficou em aberto de propósito (👤 na tarefa `RV`). Confira também os textos do enunciado (`audiar.askInterval`/`askScale`/`askChord`/`askDegrees`), os pools de intervalos/escalas/acordes sorteados (razoáveis para um rascunho, não curados), e se a autoavaliação por rodada — diferente de todo o resto do catálogo, que pergunta só ao fim da etapa — não cansa antes do fim de uma sessão de 8 minutos |

### Relações entre melodia e harmonia (`MH`, 07/11/2026)

| Id | O que só você confere |
|---|---|
| `relacoes-melodia-harmonia` | **Se a frase está musicalmente certa, combinação por combinação.** Ela é gerada, não escrita à mão: o motor apura o grau, o intervalo e o semitom, e a única palavra avaliativa é *"pode gerar tensão"*, só onde há atrito — foi o critério que você deu. Há teste varrendo as 196 combinações atrás de adjetivo que ninguém autorizou, mas **nenhum teste sabe se a frase é boa de ler**. Confira também: o trítono sai como **♭5** e não ♯4 (escolha, para os cinco alterados ficarem todos em bemol); o **timbre novo do drone** (`destaque`, triangular) soa mesmo como melodia por cima do acorde; e se o rótulo curto da grade (`6ªm`, `4ª+`) comunica ou se atrapalha |

### Faça o intervalo (`X9`+`B4`, revisão de 04/11/2026)

| Id | O que só você confere |
|---|---|
| `intervalo-na-pauta` e `intervalo-no-instrumento` (era `faca-o-intervalo`) | o par de `que-intervalo-e-esse`. Veio do modo "intervalo" de `ache-a-nota`, que estava quebrado no braço (B4) — aqui o braço só pede a classe de altura (igual ao par: o desenho não distingue quinta aumentada de sexta menor), e a pauta pede a grafia certa (`transpose()`, igual já fazia antes). **Não tem a opção "ver nome, posição, ou os dois"** que a tarefa original pedia — implementá-la direito mexeria na revelação genérica do Player, compartilhada por todo item de braço, e não quis arriscar isso sob pressa; hoje a revelação é a mesma de todo item de braço (nome + posições que batem) |

### Tarefa com metrônomo — itens de catálogo (decisão 90)

| Id | Família | O que só você confere |
|---|---|---|
| `acento-deslocado` | **T3** · deslocamento de acento | o clique: o acento é o `clique-forte` e a subdivisão um `clique` mais baixo — **se dá para ouvir o acento mover** |
| `subdivisao-alternada` | **T4** · subdivisão alternada | a ordem fixa (da mais lenta para a mais rápida) e o aviso um compasso antes |
| `deslocamento-ritmico` | **T8** · deslocamento de padrão | os 15 padrões e se a pulsação ancorada no primeiro tempo ajuda ou atrapalha |

> `sustentar-e-cortar` (T6) e `legato-staccato` (T7) saíram do catálogo (revisão de 04/11, `P7`).

**Os textos** (títulos e descrições, em português e inglês) saíram das tabelas das decisões 81 e 83, mas
são rascunhos: nome de coisa que a pessoa vê é decisão do Paulo.

## Enumeradores (sem tela, fora do portão)

| Item | Onde | O que conferir |
|---|---|---|
| **FM-4** · conduções de voz | `theory/conducoes.ts` | as cinco medidas e os âmbitos corais (largos de propósito). **O corte de quatro vozes está marcado como revisável** (decisão 66) |
| **FM-5** · rearmonizações | `theory/rearmonizacoes.ts` | as sete transformações (decisão 78), e **a questão em aberto** de onde a nota da melodia cai dentro do compasso |

Não têm tela, então não há o que esconder; entram no portão quando ganharem uma.

## Escalas e ouvido (decisões 70 e 72)

Já estão no app como `legado`, mas as mudanças recentes pedem o seu olho:

- As **duas melódicas** e o nome "(jazz)" / "(clássica)".
- O guarda que recusa a configuração impossível, e o texto da recusa.
- Os **dois bugs** de `ouvido-celulas` e o item generalizado para as 13 escalas.

## O que ainda NÃO foi feito, e não é revisão

- A **tabela de piano** (`FM-6`) está fechada (04/11): as 3 linhas em branco foram preenchidas com
  fonte e com a conferência do polegar, e **um erro foi encontrado** na mão esquerda de Si♭ menor. Os
  arpejos ficaram só na convenção de fundamental branca — ver o motivo lá.
- A **biblioteca de padrões rítmicos** (`F6-11`) tem os doze candidatos e as fontes levantadas em
  [padroes-ritmicos.md](padroes-ritmicos.md), **sem nenhuma notação nova escrita** — falta o
  **revisor de tradição** (decisão 85, regra 2), que é pessoa, não documento. Nada dali entra no app.
- As **22 gravações** (`A0`) e as digitações de baixo (`FM-2`).
- Os **22 itens `legado`** esperam a revisão da `F6-7` para virarem `publicado`. (Eram 26: as fusões
  por superfície e a divisão do quiz de teoria mudaram a conta, não o trabalho.)
