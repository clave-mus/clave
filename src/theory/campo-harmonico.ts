/**
 * O campo harmônico como MATERIAL de exercício: os sete graus diatônicos mais os empréstimos
 * modais que o Paulo aprovou, cada um com rótulo romano, semitons sobre a tônica e a marca de
 * quem é de fora.
 *
 * Não empilha terça nenhuma: qualidade e romano dos graus diatônicos vêm de `harmonicField`
 * (core.ts), o motor que o Backing já usa — motor duplicado é proibido. O que este arquivo
 * acrescenta é exatamente o que nenhum campo tem: os acordes de FORA dele.
 *
 * ## As duas listas de empréstimo, decididas com ele
 *
 * No MAIOR, o grupo do menor paralelo — iv, ♭VI, ♭VII, ♭III, iiø — mais o ♭II napolitano como
 * sabor à parte (09/11/2026). No MENOR, o tráfego vai na direção contrária (12/11/2026): V e vii°
 * da menor harmônica — o dominante de verdade e a sensível —, IV e ii do dórico, e o mesmo ♭II.
 * O I maior (picardia) ficou de fora: é gesto de final de música, não acorde que circula pelo
 * campo, e num sorteio só confundiria com o i.
 */
import { CHORDS, harmonicField, mod, note, pc, romanSuffix, type ChordId, type Convention } from './core';

/** Os dois campos do exercício. Harmônica e melódica ficam de fora: os empréstimos delas ninguém decidiu. */
export type CampoDoExercicio = 'maior' | 'menor';

export interface AcordeDoExercicio {
  /** Id estável para configuração e histórico: `g1`..`g7`, ou o nome do empréstimo (`bVI`, `iio`). */
  id: string;
  /** O romano com a qualidade: `ii7`, `♭VI7M`, `iiø`. É o rótulo do botão e o gabarito. */
  roman: string;
  /** Semitons da fundamental acima da tônica, 0..11. */
  semi: number;
  /** Semitons do acorde acima da tônica, em posição fundamental. */
  semis: number[];
  emprestimo: boolean;
}

interface Emprestimo { id: string; semi: number; triade: ChordId; tetrade: ChordId; roman: string }

const EMPRESTIMOS: Record<CampoDoExercicio, Emprestimo[]> = {
  maior: [
    { id: 'bII', semi: 1, triade: 'maior', tetrade: '7M', roman: '♭II' },
    { id: 'iio', semi: 2, triade: 'dim', tetrade: 'm7b5', roman: 'ii' },
    { id: 'bIII', semi: 3, triade: 'maior', tetrade: '7M', roman: '♭III' },
    { id: 'iv', semi: 5, triade: 'menor', tetrade: 'm7', roman: 'iv' },
    { id: 'bVI', semi: 8, triade: 'maior', tetrade: '7M', roman: '♭VI' },
    // ♭VII com sétima DOMINANTE, não maior: é o grau 7 do campo do menor natural, de onde ele
    // vem emprestado — o "backdoor" ♭VII7. Conferido em `CAMPOS.menor.tetrades[6]`.
    { id: 'bVII', semi: 10, triade: 'maior', tetrade: '7', roman: '♭VII' },
  ],
  menor: [
    { id: 'bII', semi: 1, triade: 'maior', tetrade: '7M', roman: '♭II' },
    { id: 'ii', semi: 2, triade: 'menor', tetrade: 'm7', roman: 'ii' },
    { id: 'IV', semi: 5, triade: 'maior', tetrade: '7', roman: 'IV' },
    { id: 'V', semi: 7, triade: 'maior', tetrade: '7', roman: 'V' },
    { id: 'viio', semi: 11, triade: 'dim', tetrade: 'dim7', roman: 'vii' },
  ],
};

/** As opções do chip de configuração: o romano SEM a cauda de sétima, que é a identidade do
 *  empréstimo independente de tríade/tétrade. O meio-diminuto leva o `ø` porque ele é o nome. */
export function opcoesDeEmprestimo(campo: CampoDoExercicio): { id: string; label: string }[] {
  return EMPRESTIMOS[campo].map(e =>
    ({ id: e.id, label: e.roman + (e.triade !== 'dim' ? '' : e.tetrade === 'm7b5' ? 'ø' : '°') }));
}

// O campo é computado sobre dó só para os SEMITONS saírem relativos à tônica (pc de dó = 0);
// nenhuma grafia sai daqui — a altura absoluta é problema de quem toca, como no resto de theory/.
const DO = note(0);

/**
 * O material completo do campo: os sete graus e TODOS os empréstimos, em ordem de fundamental
 * (I, ♭II, ii, iiø, ♭III, iii…). Filtrar o que a pessoa incluiu é problema do item; enumerar é
 * daqui — e há teste varrendo que nenhum par divide o mesmo conjunto de classes de altura, que é
 * o que garante pergunta sem ambiguidade mesmo com inversões.
 */
export function materialDoCampo(campo: CampoDoExercicio, tetrade: boolean, conv: Convention = 'pt'): AcordeDoExercicio[] {
  const diatonicos = harmonicField(DO, campo, tetrade, conv).map(d => ({
    id: `g${d.degree}`, roman: d.roman, semi: pc(d.root),
    semis: CHORDS[d.chord].degs.map(([, s]) => pc(d.root) + s), emprestimo: false,
  }));
  const emprestados = EMPRESTIMOS[campo].map(e => {
    const chord = tetrade ? e.tetrade : e.triade;
    return { id: e.id, roman: e.roman + romanSuffix(chord, conv), semi: e.semi,
      semis: CHORDS[chord].degs.map(([, s]) => e.semi + s), emprestimo: true };
  });
  return [...diatonicos, ...emprestados].sort((a, b) => a.semi - b.semi || Number(a.emprestimo) - Number(b.emprestimo));
}

const GRAU_POR_SEMI = ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'];

/** O grau da fundamental, para o modo de resposta "só o grau": `iv` e `IV` são os dois `4`. */
export const grauDaFundamental = (semi: number): string => GRAU_POR_SEMI[mod(semi, 12)];
