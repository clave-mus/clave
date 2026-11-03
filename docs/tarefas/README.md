# Tarefas

As tarefas do Clave vivem aqui, em markdown, no próprio repositório — assim o agente de IA de cada
pessoa lê a tarefa **e todo o contexto ao redor** na mesma leitura (decisão 32).

## Como pegar uma tarefa

1. Escolha uma tarefa livre (ninguém abriu draft PR com o ID dela).
2. `git switch main && git pull && git switch -c F3-1-modelo-rotinas`
3. **Abra um pull request em rascunho** com o ID no título: `F3-1 · Modelo e armazenamento de rotinas`.
   É isso que avisa os outros que você pegou.
4. Rode o que o CI roda, antes de tirar do rascunho:
   ```bash
   npm ci && npm test && npx tsc --noEmit -p tsconfig.app.json && npm run lint
   ```
5. Tire do rascunho. Precisa de CI verde e 1 aprovação para entrar na `main`.

## Antes de escrever qualquer linha

Leia, nesta ordem: [visao.md](../visao.md) → a decisão citada na tarefa em
[decisoes.md](../decisoes.md) → a seção correspondente de [arquitetura.md](../arquitetura.md).
Se a tarefa mexe em catálogo, exercício ou validação, leia também
[catalogo.md](../catalogo.md).

**Você não toma decisão de produto.** Se a tarefa estiver ambígua, se faltar informação, ou se a
solução óbvia contrariar a visão — **pare e pergunte ao Paulo**. Não escolha "um caminho
razoável"; foi assim que o projeto precisou ser refeito uma vez.

## O mapa

```
F0 Limpeza e base ───────────────┐   (desbloqueia toda tela nova)
                                 │
   ┌─────────────────────────────┼─────────────────────────────┐
   │                             │                             │
F1 Catálogo              F4 Identidade visual          F5 Som e instrumento
   │                       (bloqueada em A1)              (independente)
F2 Parâmetros                    │                             │
   │                             │                             │
F3 ROTINAS ◄── caminho crítico do beta                         │
   │                                                           │
   ├── F6 Exercícios novos e curadoria ────────────────────────┘
   ├── FM Motores do catálogo (padrões, digitações, classificação)
   ├── F7 Variação automática
   ├── F8 Onboarding e nivelamento
   └── F9 Plataforma (sincronização, PWA, teoria, doação)
                    │
               F99 Beta fechado
```

**F3 é o caminho crítico.** É o que prova a hipótese do beta. Se o trabalho se espalhar por
microfone, comunidade e arte enquanto F3 fica vazia, o beta não responde nada —
ver o risco registrado em [equipe.md](../equipe.md).

## As frentes

| Arquivo | Frente | Depende de | Observação |
|---|---|---|---|
| [F0-limpeza.md](F0-limpeza.md) | Limpeza e base | — | Mecânico; bom primeiro PR de quem está chegando |
| [F1-catalogo.md](F1-catalogo.md) | Modelo do catálogo | F0-4 | Mecânico, item por item |
| [F2-parametros.md](F2-parametros.md) | Cascata de parâmetros | F1-1 | **`F2-3` destrava a rotação — sem ela a F3-8 é teatro** |
| [F3-rotinas.md](F3-rotinas.md) | **Rotinas** | F2-1 | **Caminho crítico** |
| [F4-visual.md](F4-visual.md) | Identidade visual | A1 (Paulo) | Paralelo a tudo |
| [F5-som.md](F5-som.md) | Microfone, MIDI e partituras | — | Independente. Começa pelo espigão `A0` |
| [FM-motores.md](FM-motores.md) | Motores e **enumeradores** do catálogo | — | `FM-1` feita. `FM-4` e `FM-5` são funções puras, sem interface — bom primeiro PR |
| [F6-exercicios.md](F6-exercicios.md) | Exercícios novos e curadoria | F1 | Inclui tarefas 👤 de curadoria |
| [F7-F9-resto.md](F7-F9-resto.md) | Variação, onboarding, plataforma | F3 | |

## Convenções

- **👤** marca tarefa fora do código (curadoria, texto, decisão, configuração de painel).
- Toda tarefa tem **Pronto quando** verificável e **Não faça** explícito.
- Tarefas novas trazem também um **contrato de saída** (decisão 32): o que o código precisa
  *provar* — um teste que existe e passa, um número medido, um arquivo com formato fixo. A revisão
  confere o contrato, não a impressão.
- **Nenhuma tarefa publica uma família de exercício.** Ela entrega o motor e a fiação; a revisão
  musical é passo humano do Paulo (decisão 51).
- Tarefa bloqueada numa questão em aberto cita o código dela (`A1`, `A3`…) — a lista está no fim
  de [decisoes.md](../decisoes.md).
