# MH · Relações entre melodia e harmonia

Ideia do Paulo, desenhada com ele em 07/11/2026. **O nome é dele e está fechado.**

> Aprender como uma nota da melodia soa sobre cada acorde do campo harmônico. Fixa-se uma nota,
> e os acordes passam por baixo dela.

**Duas camadas já estão prontas e commitadas:**

| | |
|---|---|
| `src/theory/nota-sobre-acorde.ts` | o motor: que grau a nota é, que intervalo forma, que notas do acorde ficam a um semitom. 15 testes, 196 combinações, quatro campos |
| `src/catalog/relacao-texto.ts` | a frase, nos dois idiomas. 10 testes, incluindo os dois exemplos do Paulo por igualdade exata |

Falta o que está abaixo.

---

## 1. Estender o `drone` para dois timbres ✅ feito

*(mantido aqui como registro; `Carater` em `audio/engine.ts`, parâmetro opcional no fim — os dois
chamadores antigos não mudaram.)*

### Como era

**Problema:** `tone()` tem timbre mas duração fixa; `drone()` sustenta mas só tem um timbre (pad de
serra). O Paulo quer **a melodia destacada no timbre** — e quer **segurar** para soar. Hoje dá para
ter um ou outro.

**O que fazer:** um terceiro parâmetro opcional em `drone()`, escolhendo entre dois caracteres —
o atual (escuro, para o acorde) e um mais brilhante que corte por cima (para a melodia).

⚠️ **Só há dois chamadores** (`Audiar.tsx`, `Ambiente.tsx`), os dois com o padrão. O parâmetro entra
**no fim e opcional**, então nenhum dos dois muda. Áudio é delicado neste projeto — o `B1` foi um
bug de áudio que atingia vários exercícios —, então: não mexer na assinatura existente, não mexer no
envelope do pad atual.

**Pronto quando:** os dois chamadores de hoje soam exatamente como antes, e o item novo consegue
soar acorde e melodia juntos com timbres distinguíveis.

---

## 2. A tela: "Relações entre melodia e harmonia"

Item novo, `kind: 'tarefa'` (termina em autoavaliação — não há resposta certa a conferir),
`publicacao: RASCUNHO`, listado em `revisao-pendente.md`.

### O desenho

A tela é **uma nota contra o campo inteiro**, e não 49 visitas separadas. O Paulo aprovou o
princípio: *"a nota fica parada e o acorde troca por baixo"*.

```
  nota da melodia:   [1] [2] [3] [4] [5] [6] [7]          ← escolhe qual nota fica parada
  ───────────────────────────────────────────────
   I      ii     iii     IV      V      vi     vii°       ← toque para ouvir
   C      Dm     Em      F       G      Am     B°
  fund.   7ªm   6ªm !    5ª     4ª !    3ª    9ªm !       ← o que a nota é sobre cada acorde
```

**A terceira linha é a ideia da interface:** com a nota fixa, você vê **de relance o que ela é sobre
os sete acordes**, com `!` onde há semitom. O aprendizado é a comparação, então a comparação fica na
tela — em vez de só aparecer uma por vez. Tocar num acorde o põe a soar embaixo da nota.

Abaixo, a frase da camada já pronta: *"Dó é a 6ª menor de Em. Fica a um semitom de Si, a quinta do
acorde — pode gerar tensão."*

### Controles

| | |
|---|---|
| **Três botões de som** | acorde + nota · só o acorde · só a nota. Soam **enquanto pressionados** (pedido explícito) |
| **Nota parada** | travar a nota para ela continuar soando ao trocar de acorde. Configurável, como ele pediu |
| **Soar a melodia** | **desligável** — ver abaixo, é o acréscimo de 07/11 |
| **Intervalo** | reduzido à oitava (padrão) ou como soa. A camada de texto já faz os dois |
| **Campo** | maior · menor natural · menor harmônica · menor melódica. Os quatro, como ele pediu |
| **Arpejar o acorde** | em vez de tocar as notas juntas |

### "Não soar a melodia" — sim, é viável, e quase de graça

Pergunta dele, e a resposta é que o modelo **já comporta**: os três botões separam acorde, nota e os
dois. Desligar a melodia é só não tocá-la junto com o acorde — a nota continua **escrita** na tela,
a pessoa **canta**, e o botão "só a nota" vira o conferidor.

Vale notar o que isso faz com o item: ele deixa de ser só escuta e vira **exercício de produção**,
vizinho da audiação (`X3`). Continua `tarefa` com autoavaliação, porque o app não ouve ninguém — e
isso está certo pela decisão 5.

---

## 3. O exercício de adivinhar — e a descoberta que muda a proposta

O Paulo propôs um segundo item ("reconheça o grau com contexto tonal") e sugeriu **substituir
`ouvido-celulas`** por ele.

**Fui ver o `ouvido-celulas`, e ele já faz metade disso:**

```ts
const triad = [tonic, tonic + terca, tonic + 7];
sound: { groups: [triad, ...c.map(i => [tonic + semis[i]])] }
```

Ele **já toca um acorde de contexto** e depois os graus um a um. A intuição do Paulo está certa: é o
mesmo exercício. As duas diferenças são:

| | hoje (`ouvido-celulas`) | o que ele quer |
|---|---|---|
| acorde de contexto | **sempre a tônica** | **qualquer grau do campo** |
| quantas notas | 3 ou 4 | **1 a 5** |

Ou seja, o que ele descreveu é um **superconjunto** do que já existe — não um substituto.

### 👤 A decisão, e a minha recomendação

**Recomendo estender `ouvido-celulas` mantendo o id, em vez de criar outro e aposentá-lo.** O motivo
é concreto: aquele id está em **dois roteiros do time**, no **mãos livres** (a fonte `graus`), em
dois grupos, em duas portas, no `STABLE_IDS` do `taxonomy.test.ts`, e tem um bloco inteiro de testes
em `escalas-direcao.test.ts` guardando **dois bugs históricos** (células com grau repetido e
distratores que entregavam a resposta). Trocar o id obriga a migrar tudo isso; estender não obriga a
migrar nada.

E dá para estender **com os padrões reproduzindo exatamente o comportamento de hoje**: acorde de
contexto = só o grau I, tamanho = 3. Rotina salva continua soando igual, sem migração.

O que muda para quem usa é o **nome e a descrição** — que são 👤 dele. "Células de graus" deixa de
descrever o item quando ele aceita uma nota só e acordes que não são a tônica.

### A interface do exercício

Pedido: *"uma interface bacana que permita ouvir cada nota separadamente"*.

```
   [ ♪ acorde ]  [ arpejar ]        ← o contexto, junto ou arpejado
   ─────────────────────────
   [ 1 ]  [ 2 ]  [ 3 ]             ← uma nota por botão, ouvidas isoladamente
   [ ▶ tocar tudo de novo ]
```

Com uma nota só, a fileira tem um botão e o exercício é "que grau é este, sobre este acorde".
Com cinco, é a célula de hoje com mais contexto.

---

## Pronto quando

- `drone` aceita o segundo timbre e os dois chamadores antigos não mudam de som.
- A tela mostra a nota fixa contra os sete acordes, com o que ela é sobre cada um, e toca ao
  pressionar.
- Dá para desligar o som da melodia e cantar por cima.
- Os quatro campos funcionam.
- `ouvido-celulas` aceita 1 a 5 notas e acorde de contexto configurável, **com os padrões de hoje
  gerando o que gera hoje** — e os testes dos dois bugs históricos continuam passando.
- Item novo em `rascunho` e listado em `revisao-pendente.md`.

## Não faça

- **Não mexa na assinatura atual do `drone`** nem no envelope do pad existente.
- **Não troque o id de `ouvido-celulas`** sem o Paulo decidir — é o 👤 acima.
- **Não acrescente juízo ao texto.** A única frase avaliativa é *"pode gerar tensão"*, só onde há
  semitom. Há teste varrendo as 196 combinações atrás de adjetivo proibido.
- Não publique nada: item novo nasce rascunho (decisão 91).

## Respondido pelo Paulo em 07/11

| | |
|---|---|
| Estender `ouvido-celulas` ou criar novo? | **Estender**, mantendo o id |
| O nome do exercício de adivinhar | *"Reconheça/identifique a melodia na harmonia"* — fica **"Reconhecer a melodia na harmonia"** como rascunho, para ele fechar a redação |
| Tétrade além de tríade? | **Sim**, as duas |
| Notas de fora da escala | **Sim** — acréscimo dele: as doze, não as sete |

## As doze notas, e por que a grafia precisou de regra própria ✅ feito

Pedido de 07/11: *"incluir também notas de fora da escala, como uma 6♭ na escala maior"*.

`notasCromaticas()` em `theory/nota-sobre-acorde.ts`. **Os graus se nomeiam sempre contra a escala
maior da tônica**, qualquer que seja o campo — é como se fala (em Lá menor, Dó é "♭3" e Dó♯ é "3"),
e resolve a grafia sozinho: a letra vem do grau, o acidente vem da alteração.

⚠️ Conferi o `notaGrafada` de `contexto-musical.ts`, que a auditoria do `P6` achou morto: ele daria
**Sol♯** para ♭6 em Dó maior, porque decide bemol/sustenido pela tonalidade e não pelo grau. Não
serve aqui, e continua sem uso.

👤 **O trítono sai como ♭5, não ♯4** — para os cinco alterados ficarem todos em bemol, como a
fileira aparece nos métodos. Os dois nomes são defensáveis; é escolha, e dá para trocar.

## 👤 Em aberto

1. A redação final do nome do exercício de adivinhar.
2. O trítono: ♭5 (atual) ou ♯4.
