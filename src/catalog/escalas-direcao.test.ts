// Contrato da F6-10: as duas melódicas, a direção, e os dois bugs de `ouvido-celulas`.
//
// Três destes testes afirmam coisas que o código ERRAVA antes desta tarefa. Ficam aqui porque
// nenhum deles é óbvio pela leitura do catálogo, e todos voltariam sem aviso.
import { describe, expect, it } from 'vitest';
import { translate, type Locale, type MessageKey, type Vars } from '../i18n';
import { EXERCISES } from './catalog';
import { resolveParams } from './params';
import { ALL_SCALE_IDS, scaleDegreeLabels, scaleMidi, SCALES, type ScaleId } from '../theory/core';
import type { Ctx, SettingValue } from './types';

const ctxFor = (locale: Locale = 'pt'): Ctx => ({
  naming: locale, conv: locale, t: (k: MessageKey, v?: Vars) => translate(locale, k, v), params: resolveParams('violao'),
});
const item = (id: string) => {
  const ex = EXERCISES.find(e => e.id === id);
  if (!ex?.make) throw new Error(`sem item de série: ${id}`);
  return ex as typeof ex & { make: NonNullable<typeof ex.make> };
};

describe('as duas menores melódicas (decisões 70 e 72)', () => {
  it('são duas escalas, não uma opção', () => {
    expect(ALL_SCALE_IDS).toContain('menor-melodica');
    expect(ALL_SCALE_IDS).toContain('menor-melodica-jazz');
  });

  it('subindo são idênticas — é exatamente por isso que a pergunta ascendente é impossível', () => {
    expect(scaleMidi(60, 'menor-melodica', 'sobe')).toEqual(scaleMidi(60, 'menor-melodica-jazz', 'sobe'));
  });

  it('descendo diferem: a clássica volta a ser menor natural, a do jazz não muda', () => {
    const classica = scaleMidi(60, 'menor-melodica', 'desce');
    const jazz = scaleMidi(60, 'menor-melodica-jazz', 'desce');
    expect(classica).not.toEqual(jazz);
    // a clássica descendo tem Lá♭ (8) e Si♭ (10); a do jazz tem Lá (9) e Si (11)
    expect(classica.map(m => m - 60)).toContain(8);
    expect(classica.map(m => m - 60)).toContain(10);
    expect(jazz.map(m => m - 60)).toContain(9);
    expect(jazz.map(m => m - 60)).toContain(11);
  });

  it('só a clássica declara graus descendentes — nenhuma outra escala precisa', () => {
    const comDesc = ALL_SCALE_IDS.filter(id => 'desc' in (SCALES[id] as object));
    expect(comDesc).toEqual(['menor-melodica']);
  });

  it('as duas têm nome com parênteses nos dois idiomas, e nenhuma é "a verdadeira"', () => {
    for (const locale of ['pt', 'en'] as const) {
      for (const id of ['menor-melodica', 'menor-melodica-jazz'] as const) {
        const nome = translate(locale, `theory.scales.${id}` as MessageKey);
        expect(nome).toMatch(/\(.+\)/);
      }
    }
  });
});

describe('ouvido-escala recusa a configuração impossível (decisão 13)', () => {
  const ex = item('ouvido-escala');
  const ctx = ctxFor();

  it('com as duas melódicas e direção ascendente, não há pergunta — há motivo', () => {
    const s: Record<string, SettingValue> = { tipos: ['menor-melodica', 'menor-melodica-jazz'], direcao: 'sobe' };
    const motivo = ex.problema?.(s, ctx);
    expect(motivo).toBeTruthy();
    expect(motivo).toContain('subindo');
  });

  it('a recusa cai quando a direção deixa as duas distinguíveis', () => {
    for (const direcao of ['desce', 'ambos']) {
      expect(ex.problema?.({ tipos: ['menor-melodica', 'menor-melodica-jazz'], direcao }, ctx)).toBeNull();
    }
  });

  it('a recusa cai quando só uma das duas está marcada', () => {
    for (const tipos of [['menor-melodica'], ['menor-melodica-jazz'], ['maior', 'menor-melodica']]) {
      expect(ex.problema?.({ tipos, direcao: 'sobe' }, ctx)).toBeNull();
    }
  });

  it('o padrão do item não é uma configuração recusada', () => {
    expect(ex.problema?.(ex.defaults, ctx)).toBeNull();
  });

  it('"ambos" toca mais notas que "sobe", e sem repetir a oitava na virada', () => {
    const conta = (direcao: string) => {
      const q = ex.make({ ...ex.defaults, tipos: ['maior'], direcao }, ctx);
      return q.sound?.groups.length ?? 0;
    };
    expect(conta('ambos')).toBe(conta('sobe') * 2 - 1);
  });
});

describe('ouvido-celulas: os dois bugs (F6-10)', () => {
  const ex = item('ouvido-celulas');
  const ctx = ctxFor();
  const escalas = ALL_SCALE_IDS as ScaleId[];
  const graus = (id: string) => id.split(' ');
  const semRepetir = (g: string[]) => g.every((x, k) => k === 0 || x !== g[k - 1]);

  // BUG 1. Antes desta tarefa o gerador era `clamp(anterior + passo, 0, top)`, e nas bordas o
  // clamp devolvia o mesmo grau: saía `5 5 4`.
  // Cuidado com o nome que isto tinha. `semRepetir` olha só vizinhos, e portanto o que se garante
  // é que nenhuma célula repete nota **em seguida** — que é tudo que a regra da célula dá. A
  // repetição NÃO adjacente (`1 3 1`) é célula legítima e acontece em 35% das respostas certas; o
  // que ela não pode fazer é diferir entre a certa e os distratores (ver a assinatura, abaixo).
  it('nenhuma célula repete nota EM SEGUIDA — nem a certa, nem um distrator', () => {
    let opcoes = 0;
    for (const escala of escalas) {
      for (const tamanho of ['3', '4']) {
        for (let i = 0; i < 120; i++) {
          const q = ex.make({ escala, tamanho }, ctx);
          if (q.surface.kind !== 'choices') continue;
          for (const o of q.surface.options) {
            const g = graus(o.id);
            expect(g.length, `${escala}/${tamanho}: ${o.id}`).toBe(Number(tamanho));
            expect(semRepetir(g), `${escala}/${tamanho}: ${o.id}`).toBe(true);
            opcoes++;
          }
        }
      }
    }
    expect(opcoes).toBeGreaterThan(10000);
  });

  // Esta é a metade do bug 1 que a minha primeira correção RECRIOU: consertei a resposta certa e
  // deixei 30% dos distratores saindo `6 6 6`. Distrator que não é célula válida entrega a
  // resposta, então vale a mesma regra — graus vizinhos distam 1 ou 2 posições.
  it('todo distrator é uma célula que o gerador poderia ter produzido', () => {
    for (const escala of escalas) {
      const rotulos = scaleDegreeLabels(escala);
      for (const tamanho of ['3', '4']) {
        for (let i = 0; i < 60; i++) {
          const q = ex.make({ escala, tamanho }, ctx);
          if (q.surface.kind !== 'choices') continue;
          for (const o of q.surface.options) {
            const pos = graus(o.id).map(g => rotulos.indexOf(g));
            expect(pos, `${escala}: ${o.id}`).not.toContain(-1);
            // a regra da célula: graus vizinhos distam 1 ou 2 POSIÇÕES da escala
            for (let k = 1; k < pos.length; k++) {
              expect([1, 2], `${escala}/${tamanho}: ${o.id}`).toContain(Math.abs(pos[k] - pos[k - 1]));
            }
          }
        }
      }
    }
  });

  // BUG 2. Os distratores eram células sorteadas do zero e diferiam demais; a visão pede
  // "distratores que diferem em apenas uma nota".
  //
  // **Esta regra deixou de valer sempre em 09/11**, e de propósito. Casar a assinatura de
  // repetição (bug 3) é incompatível com "exatamente uma nota" quando a resposta certa repete um
  // grau: trocar uma posição de `1 3 1` quase sempre quebra a repetição, e nas bordas da escala
  // sobrava um único candidato. Entre as duas, o Paulo escolheu a assinatura — e com razão, porque
  // um distrator que difere em duas notas ainda exige ouvir, enquanto um que repete onde a certa
  // não repete se descarta de olho.
  //
  // Medido em 3900 perguntas: 81% dos distratores seguem diferindo em uma nota, 16% em duas, 3%
  // em três. O teste trava o patamar, não o ideal.
  it('o distrator difere da certa em uma nota na grande maioria dos casos', () => {
    let pares = 0, umaNota = 0;
    for (const escala of escalas) {
      for (const tamanho of ['3', '4']) {
        for (let i = 0; i < 60; i++) {
          const q = ex.make({ escala, tamanho }, ctx);
          if (q.surface.kind !== 'choices' || q.expected.kind !== 'option') continue;
          const certa = graus(q.expected.id);
          for (const o of q.surface.options) {
            if (o.id === q.expected.id) continue;
            const difs = certa.filter((g, k) => g !== graus(o.id)[k]).length;
            expect(difs, `${escala}/${tamanho}: ${q.expected.id} vs ${o.id}`).toBeGreaterThanOrEqual(1);
            if (difs === 1) umaNota++;
            pares++;
          }
        }
      }
    }
    expect(pares).toBeGreaterThan(4000);
    expect(umaNota / pares).toBeGreaterThan(0.7);
  });

  // BUG 3 (09/11/2026), visto pelo Paulo: "nunca ter alternativas com notas repetidas se a melodia
  // não tem, e sempre ter onde há". A assinatura de repetição diz quais posições tocam o mesmo
  // grau — `1 3 1` → `010`, `1 3 5` → `012` — e todas as quatro opções compartilham a dela.
  it('todas as opções têm a mesma assinatura de repetição da resposta certa', () => {
    const assinatura = (g: string[]) => {
      const ordem = new Map<string, number>();
      return g.map(x => ordem.get(x) ?? (ordem.set(x, ordem.size), ordem.size - 1)).join('');
    };
    let perguntas = 0, comRepeticao = 0;
    for (const escala of escalas) {
      for (const tamanho of ['2', '3', '4', '5']) {
        for (let i = 0; i < 40; i++) {
          const q = ex.make({ escala, tamanho }, ctx);
          if (q.surface.kind !== 'choices' || q.expected.kind !== 'option') continue;
          const daCerta = assinatura(graus(q.expected.id));
          perguntas++;
          if (new Set(graus(q.expected.id)).size < Number(tamanho)) comRepeticao++;
          for (const o of q.surface.options) {
            expect(assinatura(graus(o.id)), `${escala}/${tamanho}: ${q.expected.id} vs ${o.id}`).toBe(daCerta);
          }
        }
      }
    }
    // Cobertura: se a certa nunca repetisse grau, o teste acima passaria sem medir nada.
    expect(comRepeticao / perguntas).toBeGreaterThan(0.15);
  });

  it('sempre oferece quatro opções distintas, em toda escala e tamanho', () => {
    for (const escala of escalas) {
      for (const tamanho of ['3', '4']) {
        for (let i = 0; i < 40; i++) {
          const q = ex.make({ escala, tamanho }, ctx);
          if (q.surface.kind !== 'choices') continue;
          const ids = q.surface.options.map(o => o.id);
          expect(new Set(ids).size, `${escala}/${tamanho}`).toBe(4);
        }
      }
    }
  });

  // Decisão 54: era pentatônico-only sem razão. A célula é um desenho de graus, e graus existem em
  // qualquer escala.
  it('os graus mostrados são os da escala escolhida, com a alteração grafada', () => {
    const esperado: Record<string, string[]> = {
      'penta-menor': ['1', '\u266d3', '4', '5', '\u266d7', "1'"],
      maior: ['1', '2', '3', '4', '5', '6', '7', "1'"],
      lidio: ['1', '2', '3', '\u266f4', '5', '6', '7', "1'"],
      'menor-harmonica': ['1', '2', '\u266d3', '4', '5', '\u266d6', '7', "1'"],
    };
    for (const [escala, permitidos] of Object.entries(esperado)) {
      for (let i = 0; i < 40; i++) {
        const q = ex.make({ escala, tamanho: '4' }, ctx);
        if (q.surface.kind !== 'choices') continue;
        for (const o of q.surface.options) for (const g of graus(o.id)) expect(permitidos, escala).toContain(g);
      }
    }
  });
});
