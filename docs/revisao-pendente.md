# Publicação: o que está em rascunho, e como se publica

A decisão 51 diz que *tarefa delegada constrói o motor e a fiação; publicar a família é passo humano
do Paulo.* Desde a decisão 91 isso **é imposto pelo código**, não só combinado.

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

**Escritas por IA, a pedido do Paulo.** Cinco rotinas prontas para usar, em `src/routines/doTime.ts`.
São **proposta**: a sequência de etapas de uma rotina do time é conteúdo musical, e isso é decisão de
produto (decisão 51). Enquanto estão em rascunho, **ninguém as vê** fora do modo de revisão.

Cada etapa carrega um campo `porque` que não aparece na tela: é o argumento de ter escolhido aquele
exercício ali, para a revisão não ter de reconstruir o raciocínio.

| Id | Modo | Etapas | O que só você confere |
|---|---|---|---|
| `de-bolso` | livre, embaralhada | 5 | se as cinco são de fato as que valem sem instrumento, e se embaralhar é melhor que ordem fixa |
| `internalizar-tonalidade` | guiada, 30 min, rotação por tonalidade | 5 | **a ordem das cinco frentes** (som → braço na casa → braço acima → acordes → tocar), e se 12 tonalidades em quartas é o ciclo certo |
| `mapear-braco` | guiada, 20 min | 3 | se reconhecer antes de achar é a ordem certa, e se as três regiões do rodízio são as três que importam |
| `aquecimento-ouvido` | guiada, 12 min | 3 | a duração: 12 min é aposta de "abre a sessão, não é a sessão" |
| `leitura-diaria` | guiada, 15 min | 3 | separar altura de ritmo antes de juntar — é a aposta pedagógica da rotina |

**Publicar** é trocar `publicacao: RASCUNHO` por `{ estado: 'publicado', revisadoEm: '…', por: 'Paulo' }`
na rotina, em `src/routines/doTime.ts`, e tirar a linha desta tabela.

### Tarefa com metrônomo — itens de catálogo (decisão 90)

| Id | Família | O que só você confere |
|---|---|---|
| `acento-deslocado` | **T3** · deslocamento de acento | o clique: o acento é o `clique-forte` e a subdivisão um `clique` mais baixo — **se dá para ouvir o acento mover** |
| `subdivisao-alternada` | **T4** · subdivisão alternada | a ordem fixa (da mais lenta para a mais rápida) e o aviso um compasso antes |
| `sustentar-e-cortar` | **T6** · sustentar e cortar | o som do corte (`aro`): se ele marca o tempo sem confundir com o clique |
| `legato-staccato` | **T7** · legato e staccato | o app só marca a troca — não ouve. Se isso basta |
| `deslocamento-ritmico` | **T8** · deslocamento de padrão | os 15 padrões e se a pulsação ancorada no primeiro tempo ajuda ou atrapalha |

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

- A **tabela de piano** (`FM-6`) tem 3 linhas em branco que só um pianista preenche.
- A **biblioteca de padrões rítmicos** (`F6-11`) tem os doze candidatos e as fontes levantadas em
  [padroes-ritmicos.md](padroes-ritmicos.md), **sem nenhuma notação nova escrita** — falta o
  **revisor de tradição** (decisão 85, regra 2), que é pessoa, não documento. Nada dali entra no app.
- As **22 gravações** (`A0`) e as digitações de baixo (`FM-2`).
- Os **26 itens `legado`** esperam a revisão da `F6-7` para virarem `publicado`.
