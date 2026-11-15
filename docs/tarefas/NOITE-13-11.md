# A noite de 12→13/11/2026 — o que foi feito sozinho

O Paulo saiu pedindo execução autônoma: trabalhar a fila e, ao terminar, revisar o projeto em busca
de pontas soltas. Este arquivo é o registro do que aconteceu, para ele ler de uma vez.

> **Os commits estão LOCAIS, não empurrados.** A instrução dele incluía *"não faça deploy, publique
> alterações ou execute ações externas irreversíveis"*, e empurrar é publicar. São oito commits em
> `reformulacao-f0-f4`, prontos para `git push` quando ele quiser.

**Estado:** `1517 testes` passando, `tsc` limpo, `lint` sem erro, `build` ok. Verificado offline no
tamanho de celular, com o servidor desligado.

---

## A fila, inteira

| # | item | o que ficou |
|---|---|---|
| 1 | intervalo responde **as notas** | `resposta` (alternativas · notas), `superficie`, `notas` (2·3), `comTonica`. Contorno com `ordenada` seguindo a direção |
| 2 | restringir **às notas escolhidas** | `pcsEscolhidas` num lugar só, usado pelas três linhas que o rascunho pede |
| 3 | o **synth limpo** | voz `limpo`, sustain que segura (1,01 aos 2 s), nível **medido** (0,76) |
| 4 | cadência em `ouvido-celulas` | como **antessala**, ligada no atalho `acorde-sorteado` |
| 5 | **todas as posições** no braço | `todasAsPosicoes`, contorno não ordenada, só no braço |
| 6 | **fundamental** do acorde | `fixa` · `sorteada`, padrão fixa — e fixa agora é fixa de verdade |

### Onde o plano estava errado, e eu corrigi em vez de cumprir

Três vezes o "pronto quando" que **eu mesmo** havia escrito na fila não resistiu ao contato:

1. **item 4**: a fila dizia "cadência como padrão". Mas aqui a cadência é *antessala*, não contexto —
   o contexto deste item já existe, é o acorde contra o qual a melodia soa. E torná-la padrão
   mudaria o som de um item `legado` que duas rotinas fixam: três testes de "o que já existia não
   mudou" reprovaram na primeira rodada. O padrão ficou como era, e a cadência entrou onde rende;
2. **item 6**: a fila pedia uma recusa nova para "a combinação ambígua". Fui procurar a ambiguidade e
   **ela não existe** — fundamental fixa *muda a pergunta*, não a torna impossível. Inventar a recusa
   seria registrar um problema que não há;
3. **item 3**: o nível do timbre, que eu escrevi "1" por analogia. Medir desmentiu **três vezes** até
   o número certo.

---

## A revisão do projeto: três pontas amarradas

**28 textos que ninguém usava**, de reorganizações de até quatro dias antes (o seletor de superfície
que morreu em 09/11, as direções `audiar` que mudaram de item em 12/11, o aviso de material que saiu
quando a tonalidade passou a mandar). Com eles, um **guarda** que acusa chave de texto sem uso.

**A tabela de motores do `catalogo.md` mentia:** listava *padrões* e *digitações* como "❌ não
existe", e os dois estão prontos com consumidor desde 10/11. Um "não existe" falso convida alguém a
reconstruir motor pronto — a armadilha do órfão ao contrário.

**O guarda contra motor órfão**, que é a falha mais repetida deste projeto: `sem-orfao.test.ts` exige
que todo módulo de `theory/` tenha consumidor fora dos próprios testes. Medi antes: três não têm, e
os três são intencionais (`padroes` espera revisão cultural pela decisão 85; `conducoes` e
`rearmonizacoes` são enumeradores sem tela). Entraram numa lista de exceções **com a razão escrita**.

### Os dois guardas foram testados contra si mesmos

Teste que passa sem medir nada é pior que nenhum. Injetei uma chave de texto morta — o guarda
acusou; tirei — voltou ao verde. Criei um motor de mentira em `theory/` — o guarda o nomeou; apaguei
— verde. Os dois pegam.

---

## Erros meus, e o que cada um ensinou

- **apaguei uma chave de texto viva.** `home.whyVoz` é montada por template, e nenhum item exige voz
  hoje — então nem o teste de contexto a pegou. Restaurada, e a lição está escrita dentro do próprio
  guarda: ali o falso positivo custa uma tradução perdida em produção e o falso negativo custa uma
  linha num dicionário. A lista de exceções existe para preferir o segundo;
- **comitei com um teste vermelho**, uma vez. O guarda "toda voz tem nível" já existia em outro
  arquivo e eu escrevi um segundo sem o ver; o original reprovou na mesma rodada. Emendei o commit
  com o conserto e o registro — teste duplicado é tão ruim quanto motor duplicado;
- **um script mecânico quebrou um arquivo** ao tirar o `audiar` dos seis itens de notação. Revertido
  e refeito um por um, mais devagar e sem erro.

---

## A revisão dele de 13/11 (segunda rodada), item por item

Ele testou "que nota tocou?" nas cinco superfícies e mandou uma lista. **Tudo atendido**, e a maior
parte era um defeito só aparecendo em três telas.

| o que ele relatou | causa | estado |
|---|---|---|
| "na primeira vez não soa nada e tenho que chutar"; "não tem botão pra ouvir" | o `Listen` renderizava **só** no ramo do teclado, e o navegador não toca som antes de um gesto — a primeira pergunta nunca soava | ✅ um controle só, nas três superfícies |
| "não aparece a posição certa, só o vermelho onde cliquei" | a revelação só sabia desenhar gabarito de GRAFIA; aqui ele é ALTURA | ✅ |
| "teclas brancas da mesma cor do fundo" | `--key-white` #f7f3ec contra o papel #fbf8f4 | ✅ contorno, como num piano de verdade |
| "a cor da pauta está clara num fundo claro" | tinta creme, feita para o palco escuro | ✅ cor de texto do tema |
| "o som está de piano, deveria ser de baixo; não chega nos graves" | as amostras de piano param em Dó2 (36) e um baixo chega a Mi1 (28) | ✅ timbre segue a superfície |
| "deveria ter o braço da guitarra também" | havia um "braço" que herdava o perfil | ✅ dois braços, cada um com afinação e timbre |
| "o teclado deveria ser do tamanho da extensão" | desenho fixo em Dó2–Si5 | ✅ mesma faixa que pode soar |
| "mudar de tonalidade não faz aparecer a armadura" | o item não passava `fifths` | ✅ |
| "a nota inicial deveria ser sempre a mesma oitava, configurável" | a referência acompanhava a pergunta | ✅ padrão fixo, medido em 20 rodadas |
| "na tonalidade diz Ré♭, no exercício diz Dó♯" | a grafia ignorava a tonalidade | ✅ |
| "pode remover 'aqui a oitava não conta'" | — | ✅ |
| "os botões ficam meio por cima do teclado" | renderizavam antes do desenho | ✅ depois dele: olhar primeiro, ouvir depois |
| "incluir teclas pretas não está redundante com cromático?" | estava | ✅ o controle deixou de existir |
| "não quero ligar teclas pretas para ver os graus de Ré maior" | seleção por nome de nota | ✅ seleção por **grau**, ligada ao material |
| "a ordem: tonalidade, material, só estes graus" | o painel de prática vinha por último | ✅ dividido em duas metades |
| "analise quais outros exercícios têm o mesmo problema" | `nota-no-instrumento` tinha | ✅ |

## O que NÃO fiz, e por quê

**Relação melodia-harmonia** (item 10 da ordem) — ele deixou uma pergunta aberta no rascunho (*"o
que mais? sinto que falta coisa, me ajuda a pensar"*). É conversa, não tarefa.

**Exploração dos motivos** (item 11) — tela nova, e direção visual é decisão dele.

**Agrupar os itens de pauta numa área de leitura** — reorganização de catálogo.

**Empurrar os commits** — a instrução dizia não publicar.

---

## O que espera decisão dele

As três perguntas do `FILA-12-11.md` seguem abertas, e a primeira ganhou corpo esta noite:

1. **com tonalidade livre, o centro é fixo ou sorteado?** Duas linhas fixam dó, três sorteiam. Deixei
   **sem teste afirmando nenhum dos dois** — travar um lado registraria uma decisão que ninguém
   tomou;
2. **teclado e braço como estímulo do audiar de melodia** (exige numerar as marcas; o braço aceita
   rótulo, o teclado não);
3. **o nome do `ouvido-tecla`**, que virou a linha *Nota* inteira e ainda se chama "tecla".

E os **seis modos novos** de 13/11 estão listados em `revisao-pendente.md`, com o que conferir em
cada um — eles mudam o que o exercício pede, e a revisão musical é dele.
