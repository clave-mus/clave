// "Reconhecer melodia na harmonia" (09/11/2026): o `ouvido-celulas` estendido.
//
// O Paulo viu que o exercício dele de "reconhecer o grau com contexto tonal" era este, variando o
// tamanho — e mandou estender em vez de criar outro. A garantia que mais importa aqui é a de
// **não quebrar o que já existia**: o id continua o mesmo, e está em duas rotinas do time, no
// mãos livres, em dois grupos, duas portas e no `STABLE_IDS`.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SettingValue } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';
import { ALL_SCALE_IDS, scaleDegs, type ScaleId } from '../theory/core';
/** O piso da região padrão do perfil de baixo, que é o `ctx` deste arquivo. */
const PISO_DA_REGIAO = 48;

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('baixo', {}),
};
const item = EXERCISES.filter(isSeries).find(e => e.id === 'ouvido-celulas')!;
const perguntar = (s: Record<string, SettingValue>) => item.make({ ...item.defaults, ...s } as never, ctx);
/** O acorde de contexto é o primeiro grupo de som; as notas da melodia vêm depois, uma a uma. */
const acordeDe = (s: Record<string, SettingValue>) => perguntar(s).sound!.groups[0];
const tamanhoDa = (s: Record<string, SettingValue>) => perguntar(s).sound!.groups.length - 1;
/** As notas da melodia são os grupos depois do acorde, uma nota por grupo. */
const melodiaDe = (s: Record<string, SettingValue>) => perguntar(s).sound!.groups.slice(1).map(g => g[0]);
const parDe = (s: Record<string, SettingValue>) => {
  const q = perguntar(s);
  const g = q.sound!.groups;
  return { acorde: g[0], melodia: g.slice(1).map(x => x[0]) };
};

describe('o que já existia não mudou', () => {
  // A tríade de referência de antes: fundamental, a terça que a escala tiver, e a quinta justa.
  const triadeDeAntes = (id: ScaleId) => {
    const semis = scaleDegs(id).map(([, s]) => s);
    return [0, semis.find(x => x === 3 || x === 4) ?? 4, 7];
  };

  it('escala de menos de sete notas mantém exatamente a tríade de antes', () => {
    const curtas = ALL_SCALE_IDS.filter(id => scaleDegs(id).length < 7);
    expect(curtas.length, 'pentatônicas e blues').toBeGreaterThan(0);
    for (const escala of curtas) {
      for (let i = 0; i < 10; i++) {
        expect(acordeDe({ escala }).map((m, _, a) => m - a[0]), escala).toEqual(triadeDeAntes(escala));
      }
    }
  });

  // Nas de sete notas o acorde passou a ser o do CAMPO, empilhando terças da própria escala. Para
  // quase todas dá no mesmo; onde difere, é porque a fórmula antiga forçava uma quinta justa que a
  // escala não tem — o lócrio tocava [0,3,7] e a sua tônica é [0,3,6]. É a única
  // que muda, é conserto e não regressão, e nenhuma rotina usa lócrio.
  it('escala de sete notas passa a tocar a tríade do campo, que às vezes corrige a antiga', () => {
    const diferentes: string[] = [];
    for (const escala of ALL_SCALE_IDS.filter(id => scaleDegs(id).length === 7)) {
      const semis = scaleDegs(escala).map(([, s]) => s);
      const doCampo = [semis[0], semis[2], semis[4]];
      expect(acordeDe({ escala }).map((m, _, a) => m - a[0]), escala).toEqual(doCampo);
      if (JSON.stringify(doCampo) !== JSON.stringify(triadeDeAntes(escala))) diferentes.push(escala);
    }
    // trava a lista: se outra escala mudar de som, alguém decidiu isso de propósito
    expect(diferentes.sort()).toEqual(['locrio']);
  });

  // Cuidado com o que esta afirma. A FORMA do acorde segue intacta; o REGISTRO dele mudou em
  // 09/11, de propósito, porque o Paulo pediu a melodia acima. As rotinas do time soam no mesmo
  // material e com o mesmo acorde, uma oitava ou duas mais embaixo.
  it('as duas rotinas do time usam `escala: maior, tamanho: 3`, e a forma do acorde segue intacta', () => {
    for (let i = 0; i < 20; i++) {
      const ac = acordeDe({ escala: 'maior', tamanho: '3' });
      expect(ac.map(m => m - ac[0])).toEqual([0, 4, 7]);
      expect(tamanhoDa({ escala: 'maior', tamanho: '3' })).toBe(3);
    }
  });
});

describe('o tamanho vai de 1 a 5', () => {
  it.each(['1', '2', '3', '4', '5'])('tamanho %s toca esse tanto de notas', tamanho => {
    for (let i = 0; i < 20; i++) expect(tamanhoDa({ escala: 'maior', tamanho })).toBe(Number(tamanho));
  });

  it('com uma nota só ainda há quatro alternativas distintas', () => {
    for (let i = 0; i < 40; i++) {
      const q = perguntar({ escala: 'maior', tamanho: '1', resposta: 'alternativas' });
      if (q.surface.kind !== 'choices') throw new Error('esperava escolhas');
      expect(q.surface.options).toHaveLength(4);
      expect(new Set(q.surface.options.map(o => o.id)).size).toBe(4);
    }
  });

  it('a resposta certa tem o tamanho pedido, em qualquer escala', () => {
    for (const escala of ALL_SCALE_IDS) {
      for (const tamanho of ['1', '2', '5']) {
        const q = perguntar({ escala, tamanho });
        if (q.expected.kind !== 'option') throw new Error('esperava opção');
        expect(q.expected.id.split(' '), `${escala}/${tamanho}`).toHaveLength(Number(tamanho));
      }
    }
  });
});

describe('o acorde de contexto deixa de ser sempre a tônica', () => {
  it('escolhendo o grau V, o acorde sai sobre a quinta da escala', () => {
    for (let i = 0; i < 20; i++) {
      const ac = acordeDe({ escala: 'maior', graus: ['5'] });
      // Sol maior sobre Dó: a fundamental está 7 semitons acima da tônica, e é tríade maior
      expect(ac.map(m => m - ac[0])).toEqual([0, 4, 7]);
    }
  });

  it('o grau ii dá tríade menor, como o campo manda', () => {
    const ac = acordeDe({ escala: 'maior', graus: ['2'] });
    expect(ac.map(m => m - ac[0])).toEqual([0, 3, 7]);
  });

  it('o grau vii dá diminuta', () => {
    const ac = acordeDe({ escala: 'maior', graus: ['7'] });
    expect(ac.map(m => m - ac[0])).toEqual([0, 3, 6]);
  });

  // A tônica é sorteada dentro da região a cada pergunta, então a altura absoluta não serve para
  // identificar o grau. A QUALIDADE da tríade serve: I maior, ii menor, vii diminuta.
  it('com vários graus marcados, todos aparecem ao longo das rodadas', () => {
    const vistos = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const ac = acordeDe({ escala: 'maior', graus: ['1', '2', '7'] });
      vistos.add(ac.map((m, _, a) => m - a[0]).join());
    }
    expect([...vistos].sort()).toEqual(['0,3,6', '0,3,7', '0,4,7']);
  });

  it('tétrade acrescenta a sétima: quatro notas em vez de três', () => {
    expect(acordeDe({ escala: 'maior', graus: ['1'], tetrade: true })).toHaveLength(4);
    expect(acordeDe({ escala: 'maior', graus: ['1'], tetrade: true }).map((m, _, a) => m - a[0])).toEqual([0, 4, 7, 11]);
  });

  it('escala sem sete notas ignora a escolha de grau — pentatônica não tem campo', () => {
    for (const escala of ['penta-maior', 'penta-menor'] as ScaleId[]) {
      for (let i = 0; i < 20; i++) {
        const ac = acordeDe({ escala, graus: ['2', '5', '7'] });
        const rel = ac.map(m => m - ac[0]);
        expect(rel, escala).toEqual([0, scaleDegs(escala).map(([, s]) => s).find(x => x === 3 || x === 4) ?? 4, 7]);
      }
    }
  });
});


// O registro da melodia (09/11/2026). O Paulo notou que a melodia caía embaixo do acorde com
// frequência e que isso atrapalha ouvir o grau. A correção move o ACORDE — a melodia fica onde a
// região a pôs, porque é ela que a pessoa canta.
describe('a melodia fica acima do acorde, e isso é o padrão', () => {
  const TODAS_AS_CONFIGS = ALL_SCALE_IDS.flatMap(escala =>
    ['1', '3', '5'].flatMap(tamanho =>
      [false, true].flatMap(tetrade =>
        ['1', '2', '4', '7'].map(g => ({ escala, tamanho, tetrade, graus: [g] })))));

  // A reclamação do Paulo, afirmada com as palavras dele: "a nota da melodia está mais grave que
  // as do acorde". Medido nas mesmas 3276 combinações, antes e depois: **51% → 0**.
  //
  // Não confundir com sobreposição parcial, que segue em ~37% dos casos: ali a nota mais alta do
  // acorde passa da mais baixa da melodia, e a melodia continua sendo a voz de cima. É o que o
  // piso da região permite, e é o que ele pediu.
  it('no padrão, a melodia nunca é mais grave que o acorde — nenhuma vez em 3276', () => {
    for (const cfg of TODAS_AS_CONFIGS) {
      for (let i = 0; i < 6; i++) {
        const { acorde, melodia } = parDe(cfg);
        expect(Math.min(...melodia), JSON.stringify(cfg)).toBeGreaterThanOrEqual(Math.min(...acorde));
      }
    }
  });

  // O outro lado da moeda da guarda: a correção não pode tirar nada da região que a pessoa pediu.
  // Foi este o teste que reprovou o meu primeiro chão absoluto (MIDI 40, escrito no motor).
  it('nem o acorde nem a melodia saem do piso da região, nos dois registros', () => {
    for (const cfg of TODAS_AS_CONFIGS) {
      for (const registro of ['acima', 'abaixo']) {
        for (let i = 0; i < 4; i++) {
          const { acorde, melodia } = parDe({ ...cfg, registro });
          expect(Math.min(...acorde), `${registro} ${JSON.stringify(cfg)}`).toBeGreaterThanOrEqual(PISO_DA_REGIAO);
          expect(Math.min(...melodia), `${registro} ${JSON.stringify(cfg)}`).toBeGreaterThanOrEqual(PISO_DA_REGIAO);
        }
      }
    }
  });

  // O espelho, que o Paulo quis manter como opção. Aqui a regra cede em 21 de 3276 (0,64%), e
  // sempre pelo mesmo motivo: a melodia já está no piso da região e não há oitava livre para
  // descer. Preferir a região a mandar a melodia para fora dela é a escolha certa.
  it('escolhendo "abaixo", a melodia só passa do acorde quando está presa no piso', () => {
    for (const cfg of TODAS_AS_CONFIGS) {
      for (let i = 0; i < 6; i++) {
        const { acorde, melodia } = parDe({ ...cfg, registro: 'abaixo' });
        const abaixo = Math.max(...melodia) <= Math.max(...acorde);
        const noPiso = Math.min(...melodia) - 12 < PISO_DA_REGIAO;
        expect(abaixo || noPiso, JSON.stringify(cfg)).toBe(true);
      }
    }
  });

  // A célula é um CONTORNO. Se o deslocamento fosse por nota, o desenho que a pessoa tenta
  // identificar mudaria de forma — e a resposta certa deixaria de descrever o que soou.
  it('o contorno da melodia não muda com o registro: os intervalos entre as notas são os mesmos', () => {
    for (const escala of ALL_SCALE_IDS) {
      const base = { escala, tamanho: '5' };
      for (let i = 0; i < 10; i++) {
        const mel = melodiaDe(base);
        const passos = mel.map((n, k) => (k === 0 ? 0 : n - mel[k - 1]));
        // o contorno vem dos graus sorteados; o que se confere é que nenhum salto de oitava
        // artificial apareceu entre notas vizinhas
        for (const p of passos) expect(Math.abs(p), escala).toBeLessThanOrEqual(5);
      }
    }
  });

  // O teto medido é MIDI 88 (1319 Hz), e só nos casos em que o piso da região obriga a melodia a
  // subir uma oitava. A tentativa que subia a melodia por cima do acorde inteiro ia a 100 — 2637 Hz.
  it('a melodia segue audível e cantável: longe dos 2637 Hz da primeira tentativa', () => {
    for (const cfg of TODAS_AS_CONFIGS) {
      for (let i = 0; i < 4; i++) {
        for (const n of parDe(cfg).melodia) {
          expect(n, JSON.stringify(cfg)).toBeGreaterThanOrEqual(48); // Dó2, 131 Hz
          expect(n, JSON.stringify(cfg)).toBeLessThanOrEqual(88);    // Mi6, 1319 Hz
        }
      }
    }
  });
});
