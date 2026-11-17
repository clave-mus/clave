# A sessão de 13 a 15/11/2026

Registro para fechar a sessão. Três frentes: a **varredura** de defeitos nos itens que o Paulo não
tinha revisado, o **Mapa do braço** (item novo, desenhado numa conversa inteira) e a **Tônica de
ouvido** (item novo, com um motor de voicings que não existia).

**Estado:** 1629 testes, `tsc` limpo, `lint` sem erro novo (os 9 avisos são os de sempre), `build`
ok. Tudo empurrado para `reformulacao-f0-f4`.

---

## 1. A varredura: o mesmo defeito em telas diferentes

O padrão das três rodadas de revisão dele era: ele achava um defeito numa tela, eu consertava
**naquela** tela, e o defeito seguia vivo nas outras. A causa era sempre a mesma — **a conta estava
copiada em cada item**.

| conta | cópias | o que divergia |
|---|---|---|
| `notaEscrita` | **cinco** | quatro com sustenido fixo; só uma olhava a tonalidade |
| `casaDaAltura` | três | duas devolviam a casa 0 da corda mais grave quando o braço não alcança — **nota errada, calada** |
| `nomeNaTonalidade` | duas | uma sorteava a grafia com `Math.random()` |
| `alturaNoBraco` | duas | — |

A tabela de doze pares letra/acidente **já existia no motor** (`fromMidi`), e o CLAUDE.md diz "não
contorne". Havia seis contornos.

`src/catalog/varre-superficies.test.ts` passou a fazer as mesmas perguntas a **todos** os itens: 19
itens × 3 instrumentos × 6 tonalidades × cada parâmetro variado, sobre duas bases de configuração.
Achou de primeira: armadura não desenhada em três itens de pauta, **resposta impossível** em dois
(a tecla não existia na tela), tônica anunciada contra a armadura, braço soando de piano, e um
fallback de `alturaDoPc` que estoura o teto.

**Duas invariantes que a medição desmentiu** e que ficaram escritas no teste, porque pareciam
óbvias: "a nota desenhada concorda com a armadura" (acusou Fá♯♯ em dó maior — mas Si aumentado **é**
Si–Ré♯–Fá♯♯) e "toda marca no braço é nota que soa" (acusou `melodia-de-ouvido` audiando, onde a
melodia **não deve** tocar).

---

## 2. Mapa do braço

Arpejos do campo aparecem numa posição de mão, uma posição destacada por vez, e a pessoa clica no
**nome** da nota. Desenhado com ele em 36 perguntas.

**O gerador** (`theory/mapa-do-braco.ts`) sorteia **região → grau → graus → digitação**, nessa ordem.
A região vem primeiro porque sortear digitação uniformemente não passeia: medido, 26 das 51 do I
grau começam na casa 0, já que corda solta não conta no vão da mão.

Decisões dele ao longo da conversa:

- **graus sorteados** como padrão — a maior fonte de variabilidade (35 combinações, ~20.000 desenhos
  contra ~584);
- **permutações** no lugar das rotações, e ele estava certo pela razão que eu não havia medido:
  espalhamento entre **cordas** (média de 2,99 → 3,35 cordas por desenho; 12% → 41% usando as quatro);
- **região fixa** do braço, inclusive atravessando a 12ª casa — e o braço inteiro continua desenhado,
  com o que está fora sob um véu;
- **modo de foco** em celular deitado: abaixo de 480 px de altura a moldura do app sai.

**Erros meus que ele corrigiu ou que a medição pegou:** enumerar e guardar todas as combinações (o
processo de teste morreu por memória; gerar proceduralmente deixou a suíte 9× mais rápida); a
verificação e o sorteio olhando espaços diferentes, **duas vezes**, em direções opostas; o véu com
cor de tema, que no tema claro **clarearia** o que devia apagar; e a identidade da pergunta pelas
posições, que travaria a tela se o sorteio repetisse.

---

## 3. Tônica de ouvido

Um acorde soa num voicing de piano e a tarefa é **cantar ou audiar a fundamental**. A pergunta dele
foi "como isso se encaixa no catálogo?", e a resposta foi **item novo** — pelo critério do próprio
modelo dele: o objeto não é "um acorde", é um acorde **num voicing**, e esse gerador não existia.

`theory/voicings.ts` nasceu **compartilhado** porque ele pediu que o `ouvido-acorde` passe a usá-lo
depois. **787 voicings por fundamental** (~9.400 com as doze), por quatro eixos: qual grau vai ao
baixo, em que oitava, o que sai, e em que ordem as de cima se empilham.

Doze qualidades novas no motor de teoria (9, 11, 13, ♭9, ♯9, ♯11, ♭13, m7♭5 com nona). Ficaram de
fora `7alt` (é família, não acorde — um id que não determina as notas não serve a um gerador), duas
alterações simultâneas, e o 11 natural sobre acorde maior.

**O acorde é o do grau**, e isso foi correção dele: eu havia soltado a qualidade da função, o que
produzia `Mim7(♭5)` no grau III de dó maior. Agora o padrão dá as sete cifras do campo, e as
extensões entram como enfeite do **mesmo grau** (o V vira Sol7♭9). Soltar a qualidade virou
parâmetro desligado.

**A tônica cabe na voz**: ela soava uma oitava acima da nota mais grave do voicing, e 47% passavam
do Dó5, chegando a Dó6. Agora é faixa escolhida — Dó3–Si3, Dó4–Si4 (padrão), Dó5–Si5 —, nomeada
pelas notas e não por tipo de voz.

---

## O que espera a revisão dele

Em `docs/revisao-pendente.md`, com o que conferir em cada um:

- **`mapa-do-braco`** — seis pontos, entre eles se a abertura padrão (5 no violão, 6 no baixo) dá
  desenhos que a mão alcança na 1ª posição, onde os trastes são largos;
- **`tonica-de-ouvido`** — cinco pontos, e o que mais me preocupa: **nenhuma regra impede um voicing
  feio**. São 787 por fundamental montados por regra de mão, e o projeto não põe juízo onde pode pôr
  fato. Se algum soar errado, é isso que eu preciso ouvir dele.

### Pendências conhecidas, decididas e não resolvidas

- **o vão da mão é um número só para todo o braço**, embora 6 casas seja impraticável na 1ª posição e
  confortável na 9ª. Resolver é regra nova no motor, que melhoraria também o `acorde-no-instrumento`;
- **o motor sem arpejo** (sortear notas próximas quaisquer, sem lógica harmônica) ficou guardado,
  para o caso de os graus sorteados ainda parecerem pouco;
- **levar os voicings ao `ouvido-acorde`**, que ele pediu e é o motivo de o motor nascer compartilhado;
- **acidentes duplos em tonalidade simples**: `acorde-na-pauta` pode mostrar Fá♯♯ em dó maior. É
  teoria correta, e se deve mudar é escolha dele — os três caminhos estão em `RV-varredura-13-11.md`.

---

## O que eu aprendi nesta sessão, e que vale para a próxima

1. **Medir antes de afirmar, sempre** — e isso me impediu três vezes de "consertar" o que estava
   certo (Fá♯♯, audiar sem tocar, a métrica errada das permutações);
2. **duas funções que respondem sobre o mesmo espaço têm de olhar o mesmo espaço.** Errei isso duas
   vezes no mesmo item, em direções opostas, e o sintoma da segunda foi o "às vezes" que ele relatou;
3. **enumerar o que se vai sortear é um cheiro.** Ele cortou o caminho e a suíte ficou 9× mais rápida;
4. **cor dentro do palco escuro não segue o tema.** Terceira vez que essa família aparece;
5. **o número que importa é o que ele está sentindo**, não o que é fácil medir: ele dizia "condensado"
   e eu media quantidade de desenhos, quando a métrica era cordas por desenho.
