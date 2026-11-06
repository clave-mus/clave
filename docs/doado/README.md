# Material doado pelo Paulo

Ferramentas que ele construiu antes do Clave e cedeu ao projeto em 05/11/2026, com a instrução:
*"se aproprie desse código — fique à vontade para mudar tudo que quiser."*

**Isto é fonte, não dependência.** Nada aqui é importado pelo app; é material para portar, e o que
for portado vira código do Clave, com os testes do Clave.

---

## `gerador_arpejos_baixo.py` — **o que destrava a rotina de baixo**

Calcula o que eu achava que só uma pessoa poderia escrever à mão. Ele separa três problemas, e é
essa separação que o torna útil:

1. **Modo** — quatro famílias (maior, menor natural, harmônica, melódica) × sete rotações, **com
   grafia correta** (em Dó dórico o terceiro grau é Mi♭, não Ré♯).
2. **Acorde** — por **graus da escala** (`1-3-5-6`, `1-2-4-7`, qualquer combinação, sem pressupor
   empilhamento de terças) **ou** por fórmula cromática (`0-3-6-9`).
3. **Posições no braço** — busca com backtracking, em duas modalidades: `chord` (voicing, uma corda
   por nota) e `arpeggio` (ordenado, com direção), limitadas por vão de casas, vão em MIDI e número
   de resultados.

**Duas decisões dele que valem preservar na porta para TypeScript:**

- **Corda solta não conta no vão da mão** (`_fret_span_ok`). É mecanicamente certo e muda muito o
  que a busca aceita.
- **Vão padrão 4 para acorde e 5 para arpejo** (nos exemplos). A diferença é real: no arpejo a mão
  toca uma nota de cada vez e pode deslocar. *O guia `guias/formas.md` dizia 5 para os dois —
  **a autoridade agora é este código**, que é o que ele usa de verdade.*

**O que ele apaga:** a dependência de o Paulo listar formas à mão, que bloqueava a `FM-2` e a `M1`.
Ver `M5` na [revisão](../revisao-04-11.md).

Os **21 testes** em `test_gerador_arpejos_baixo.py` vêm junto e devem ser portados **antes** do
código — eles são a especificação, e travam coisas finas (a grafia `Bbb` da sétima diminuta, a
inversão da ordem no arpejo descendente, o vão ignorando soltas).

---

## `leitura-partituras/` — o gerador de partituras antigo

Aplicação de leitura à primeira vista: VexFlow, Web Audio, rolagem contínua, sem build.
`app.js` tem **1913 linhas** e não foi lido nesta sessão de propósito — a superfície de parâmetros
está toda no `index.html` e no `README.md`, e é ela que interessa ao planejamento. **Quem for
implementar a `X6` lê o `app.js` então**, não antes.

**O que vale levar:**

| | |
|---|---|
| **Modos de geração** | aleatório · arpejos (com cifra anotada) · groove repetitivo com *fill* · **padrões de escala** (terças, quartas, quintas, sextas, zigue-zague, grupos de 3 e 4, arpejos diatônicos, Hanon) · nota pivô · enclosures |
| **Posição no braço como filtro de notas** | "3ª posição = casas 3–6" restringindo o que a partitura sorteia. É leitura **e** instrumento ao mesmo tempo |
| **Âncoras de tempo** | mudar o BPM ou pausar **sem reiniciar** a partitura. O Clave vai precisar disso |
| **Grafia enarmônica por tonalidade** | a mesma regra que o `theory/core.ts` já tem — bom sinal de que os dois concordam |
| **Agrupamento de barras** | pausas nas pontas de um grupo saem da barra. Detalhe de gravação que ninguém nota quando está certo |

**O que o Paulo diz que deu errado:** *"era tão customizável que era difícil de usar."* São ~60
controles na barra lateral, e **26 deles são pesos de 0 a 100** — figuras, quiálteras, células. Ver
`X6` na revisão para o desenho proposto.
