# Guia · escrever as digitações à mão

Para a tarefa [`FM-2`](../tarefas/FM-motores.md#fm-2--motor-de-digitações). São **10 a 15
digitações**, escritas por você, e elas têm dois papéis:

1. **São o conjunto de teste do motor.** O teste falha se o motor não enumerar alguma delas. Sem
   isso, o algoritmo não tem como provar nada.
2. **São as que aparecem primeiro** na lista. Digitação não tem nome (decisão 46) — a pessoa
   reconhece pelo desenho —, então "as suas" não viram "as nomeadas": viram as do topo.

É cerca de **uma hora**, com o baixo na mão.

---

## O que escrever

Para cada digitação, três coisas:

1. **Que escala e que tônica.**
2. **A sequência de (corda, casa, dedo)**, na ordem em que se toca, subindo.
3. **Uma linha de por quê** — quando você usa essa, e não outra.

O "por quê" não entra no código. Entra na conversa quando o motor propuser outra coisa e a gente
precisar decidir qual está certa.

---

## O formato

Markdown, em `docs/digitacoes/baixo.md`. Uma tabela por digitação.

As cordas do baixo de 4, da mais grave para a mais aguda: **Mi · Lá · Ré · Sol**. Numere a casa 0
para corda solta.

```md
### Maior · dedo 1 · espaçada, três cordas

| ordem | corda | casa | dedo |
|---|---|---|---|
| 1 | Lá | 3 | 1 |
| 2 | Lá | 5 | 2 |
| 3 | Lá | 7 | 4 |
| 4 | Ré | 3 | 1 |
| 5 | Ré | 5 | 2 |
| 6 | Ré | 7 | 4 |
| 7 | Sol | 4 | 1 |
| 8 | Sol | 5 | 2 |

**Quando eu uso:** é a minha padrão para subir uma oitava sem pensar. O indicador alcança a casa
de baixo em vez de a mão andar.
```

Se preferir escrever corrido, também serve — é mais rápido e eu converto:

```
Maior, dedo 1, espaçada: La3/1 La5/2 La7/4 Re3/1 Re5/2 Re7/4 Sol4/1 Sol5/2
```

---

## Quais escrever

A ideia é cobrir **o que você realmente usa**, não um tratado. Sugestão de cobertura:

- [ ] **Maior** — duas ou três: a espaçada começando com o dedo 1, a fechada de duas cordas com
      deslize, e uma começando com o dedo 2.
- [ ] **Menor natural** — duas, incluindo uma começando com o dedo 2 (o seu exemplo do Lá menor).
- [ ] **Pentatônica menor** — uma ou duas.
- [ ] **Pentatônica maior** — uma.
- [ ] **Dórico e mixolídio** — uma cada, ou diga que são a maior/menor com um grau trocado e que a
      digitação é a mesma.
- [ ] **Uma que você considera ruim**, e por quê. Essa vale ouro: o teste pode conferir que ela
      aparece **no fim** da lista, não que não aparece. Enumerar o ruim está certo; ranqueá-lo no
      topo é que estaria errado.

---

## As regras que o motor vai usar

Confira se as suas digitações batem com elas. Se alguma não bater, **a regra é que está errada**,
não a sua digitação — me avise.

A mão tem uma **posição P**: a casa onde o dedo 1 fica por padrão. O dedo *f* mora em `P + (f−1)`.

- O **dedo 1 alcança até `P−1`** — o vão entre 1 e 2 vira 2 casas. Não é outra postura: é o
  indicador esticando.
- Dedos **2, 3 e 4 ficam na casa deles**. Nada de esticar entre 2–3 ou 3–4.
- Movimento maior é **mudança de posição**, de preferência com o mesmo dedo (sobretudo o 1), de
  preferência deslizando na mesma corda.

---

## Duas coisas que eu preciso junto

**1. A guitarra.** Se você escrever só baixo, o motor só tem teste para baixo. O Cavazzo ou o
Schultz podem escrever 5 ou 6 da guitarra no mesmo formato — as cordas são
**Mi · Lá · Ré · Sol · Si · Mi**, e as regras de viabilidade podem ser outras (a escala é mais
curta e o dedo 4 alcança mais). Se forem outras, isso é informação, não problema.

**2. O que você espera de cada ranking.** Para as suas digitações, qual deveria aparecer primeiro
quando o critério é:

- menos mudanças de posição →
- ficar numa região →
- menor extensão entre dedos →

Não precisa ser exato. O teste **registra** em que posição cada uma caiu, sem limiar de aprovação —
é medida para você calibrar, não nota para o motor passar.

---

## O que o motor faz com isso

Enumera todas as digitações tocáveis e as ordena por critérios nomeados. **Nunca escolhe uma como
"a certa"** — mostra várias e você escolhe (decisão 45).

E lembre do contraintuitivo: **para internalizar o braço, a digitação mais confortável é a
errada.** O objetivo ali é te tirar do shape conhecido. Por isso a função de custo pertence ao
exercício, não ao motor, e existe um ranking chamado **"variar"**.
