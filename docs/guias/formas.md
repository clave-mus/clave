# Guia · escrever as formas à mão

Para a tarefa [`FM-2`](../tarefas/FM-motores.md#fm-2--motor-de-formas). São **10 a 15 formas**,
escritas por você, com o baixo na mão. Cerca de **uma hora**.

> **Este guia substitui o `digitacoes.md`**, que pedia sequências de dedo. A `A21` mudou o objeto:
> *"quando eu falava de digitações esse tempo todo eu imaginava não uma tablatura mas sim um mapa do
> braço com as notas destacadas com círculos — eu entendo que isso na verdade são shapes/formas."*
>
> **Forma e digitação são duas coisas**, e confundi-las foi o erro:
>
> | | O que é | Cega para |
> |---|---|---|
> | **Forma** | onde as notas estão no braço, marcadas com círculos | ritmo **e dedo** |
> | **Digitação** | que dedo em cada nota, em ordem | nada — é a mais específica das duas |
>
> O que o app precisa na maior parte dos casos é **forma**. Dizer o dedo passou a ser **opcional,
> item a item**: na `T1` (permutações de dedos) o dedo *é* o exercício e continua; na `T2` (ordem das
> cordas) ele já tinha saído, porque ali o ponto é atravessar as cordas.
>
> **Se você já escreveu alguma digitação no formato antigo, não jogue fora.** Ela contém uma forma
> (basta ignorar a coluna do dedo), e a informação do dedo serve à `T1`.

---

## Por que isto vale uma hora sua

As formas que você escrever têm dois papéis:

1. **São o conjunto de teste do motor.** O teste falha se o motor não enumerar alguma delas. Sem
   isso, o algoritmo não prova nada — ele só afirma.
2. **São as que aparecem primeiro** na lista. Forma não tem nome (decisão 46): a pessoa reconhece
   pelo desenho. Então "as suas" não viram "as nomeadas" — viram as do topo.

---

## O que escrever

Para cada forma, três coisas:

1. **Que escala (ou arpejo) e que tônica.**
2. **As casas marcadas, corda por corda.** Sem ordem, sem dedo — é um mapa, não uma sequência.
3. **Uma linha de por quê** — quando você usa essa, e não outra.

O "por quê" não entra no código. Entra na conversa quando o motor propuser outra coisa e a gente
precisar decidir qual está certa.

---

## O formato

Markdown, em `docs/formas/baixo.md`. As cordas do baixo de 4, da mais grave para a mais aguda:
**Mi · Lá · Ré · Sol**. Casa 0 é corda solta.

Uma linha por corda, com as casas marcadas. A tônica entre parênteses:

```md
### Maior · tônica em Dó · três cordas, espaçada

| corda | casas |
|---|---|
| Sol | 4 5 |
| Ré | 3 5 7 |
| Lá | (3) 5 7 |
| Mi | — |

**Quando eu uso:** é a minha padrão para subir uma oitava sem pensar.
```

Se preferir escrever corrido, também serve — é mais rápido e eu converto:

```
Maior, tônica Dó: La(3) La5 La7 Re3 Re5 Re7 Sol4 Sol5
```

**Duas notas na mesma casa de cordas diferentes são permitidas** — numa forma elas não competem por
dedo, porque forma não tem dedo. Era o que a notação antiga não deixava dizer.

---

## Quais escrever

Cobrir **o que você realmente usa**, não um tratado:

- [ ] **Maior** — duas ou três, em regiões diferentes do braço.
- [ ] **Menor natural** — duas.
- [ ] **Pentatônica menor** — uma ou duas.
- [ ] **Pentatônica maior** — uma.
- [ ] **Dórico e mixolídio** — uma cada, **ou** diga que a forma é a mesma da maior/menor com um grau
      trocado. Se for a mesma, isso é informação importante: significa que o motor pode derivá-las.
- [ ] **Um arpejo** — a tríade maior, por exemplo. Arpejo é forma com menos notas, não outro objeto.
- [ ] **Uma que você considera ruim**, e por quê. Essa vale ouro: o teste pode conferir que ela
      aparece **no fim** da lista, não que não aparece. Enumerar o ruim está certo; pôr no topo é que
      estaria errado.

---

## As regras que o motor vai usar

Confira se as suas formas batem com elas. Se alguma não bater, **a regra é que está errada**, não a
sua forma — me avise.

Sem dedo, a viabilidade de uma forma é mais simples do que era, e tem três regras:

- **Cabe na mão:** a distância entre a casa mais baixa e a mais alta da forma não passa de **5 casas**
  (quatro dedos mais o alcance do indicador uma casa abaixo). Casa 0 não conta no vão, porque corda
  solta não ocupa dedo.
- **Cabe no braço:** nenhuma casa além da última do instrumento, e nenhuma negativa.
- **Cordas vizinhas:** a forma não salta uma corda inteira sem nota. Se saltar, são **duas** formas, e
  é melhor que o motor as mostre separadas.

O que **saiu** dessas regras em relação ao guia antigo: tudo que falava de dedo 1 esticando e de
dedos 2–3–4 na casa deles. Aquilo é digitação, mora na `T1`, e não vale para forma.

---

## Duas coisas que eu preciso junto

**1. A guitarra.** Se você escrever só baixo, o motor só tem teste para baixo. O Cavazzo ou o Schultz
podem escrever 5 ou 6 formas de guitarra no mesmo formato — cordas **Mi · Lá · Ré · Sol · Si · Mi** —,
e o vão que cabe na mão lá pode ser outro (escala mais curta). Se for outro, isso é informação.

**2. O que você espera de cada ranking.** Para as suas formas, qual deveria aparecer primeiro quando
o critério é:

- menos trocas de corda →
- ficar numa região →
- menor vão entre a casa mais baixa e a mais alta →
- n notas por corda (3 por corda, por exemplo) →

Não precisa ser exato. O teste **registra** em que posição cada uma caiu, **sem limiar de aprovação**
— é medida para você calibrar, não nota para o motor passar.

---

## O que o motor faz com isso

Enumera todas as formas tocáveis e as ordena por critérios nomeados. **Nunca escolhe uma como "a
certa"** — mostra várias e você escolhe (decisão 45).

E lembre do contraintuitivo: **para internalizar o braço, a forma mais confortável é a errada.** O
objetivo ali é te tirar do shape conhecido. Por isso a função de custo pertence ao **exercício**, não
ao motor, e existe um ranking chamado **"variar"**.
