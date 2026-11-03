# F2 · Cascata de parâmetros

A camada que permite a rotina passar tonalidade, andamento e instrumento para as etapas, e a tela
dizer **de onde** cada valor veio. É a dependência direta de F3.

Arquitetura-alvo em [arquitetura.md § 3.2](../arquitetura.md#32-a-cascata-de-parâmetros).

---

## F2-1 · Resolver parâmetros em cinco camadas, com origem

**Decisão de origem:** 7, 8. **Depende de:** F1-1. **Bloqueia:** F3 inteira.

Hoje `src/exercises/params.ts` resolve **dois** níveis (padrão + escolha da pessoa) e não guarda de
onde o valor veio. Precisam ser cinco, e a origem precisa sobreviver:

```
1. padrão do item
2. perfil da pessoa      instrumento, afinação, timbres, volume, idioma, grafia
3. parâmetros da rotina  tonalidade, andamento, instrumento, afinação
4. parâmetros da etapa   substituição explícita
5. ajuste na hora        não persiste
```

```ts
type Origin = 'item' | 'perfil' | 'rotina' | 'etapa' | 'agora';
type Resolved<T> = { value: T; origin: Origin };

function resolveParams(layers: { origin: Origin; values: Partial<ParamValues> }[]):
  Record<string, Resolved<unknown>>;
```

- `useGlobalParams()` continua existindo, mas passa a ser **um caso particular** de
  `resolveParams` com duas camadas.
- A `origin` é o que permite a tela escrever **"Tonalidade: Dó maior (da rotina)"**. Sem ela, a
  pessoa não entende por que o exercício está em Dó, e a herança vira mágica.
- Ordem de precedência: camada mais específica vence. `agora` nunca persiste.

**Pronto quando:**

1. Acrescentar um parâmetro global novo faz todo item com áudio respeitá-lo **sem editar o
   catálogo**.
2. Um item novo se declara sem tocar no motor.
3. Um teste monta as cinco camadas e confere valor **e** origem de cada chave.

**Não faça:** não implemente a interface da herança visível aqui — é F3-2. Esta tarefa entrega a
função e os testes.

---

## F2-2 · Tipo de parâmetro com dica de dificuldade

**Decisão de origem:** 9. **Depende de:** F2-1. **Bloqueia:** F7-1.

Para a variação automática poder pré-marcar "costuma ser o próximo passo", cada opção de um
parâmetro de lista pode carregar uma **dica de dificuldade relativa**:

```ts
interface ParamOption {
  id: string;
  label: string;
  /** 1 = costuma vir primeiro. Só serve para PRÉ-MARCAR numa sugestão. Nunca ordena, nunca
   *  bloqueia, nunca esconde. Ausente = sem opinião. */
  tier?: 1 | 2 | 3;
}
```

- Preencher `tier` onde a ordem é **pedagogicamente defensável** — intervalos, tonalidades por
  número de acidentes, tipos de acorde, níveis de célula rítmica.
- **Deixar ausente onde não há ordem** — superfície, clave, timbre, direção. Inventar ordem aí é
  erro pedagógico (decisão 9).
- O tipo `range` (numérico) já existe em `Setting` e continua.

**Pronto quando:** o tipo existe, está preenchido onde faz sentido e **vazio onde não faz**, e um
teste garante que nenhuma tela usa `tier` para ordenar ou esconder opção.

**Não faça:** não crie escada rígida nem "níveis" por exercício. A decisão 9 é explícita: o app
abre o menu inteiro, com algumas opções pré-marcadas.
