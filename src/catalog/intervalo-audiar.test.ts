// Audiar as notas de um intervalo harmônico — 18/11/2026.
//
// O Paulo: *"quero que no exercício de intervalos, ao escolher intervalo harmônico, apareça um botão
// pra ouvir as notas uma de cada vez... o objetivo é que tenha um (sub)exercício que seja pra tu
// ouvir um intervalo harmônico e audiar as notas separadas"*.
//
// Duas coisas são medidas aqui: o modo novo (`resposta: 'audiar'`) e os **botões por nota**, que
// este item era o único de ouvido a não ter — `ouvido-celulas`, `reconhecer-padroes-escala` e
// `melodia-de-ouvido` já declaravam "Nota 1", "Nota 2".
//
// **Em 20/11 o alvo virou `ouvido-intervalo-harmonico`.** O modo nasceu dentro do melódico, quando
// harmônico era o valor `juntas` de uma configuração; com a divisão (decisão dele), ele só existe
// no item harmônico — e `direcao` deixou de ser configuração ali, porque é a identidade do item.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('violao', { key: { tonic: 0, mode: 'maior' } }),
};
const item = EXERCISES.filter(isSeries).find(e => e.id === 'ouvido-intervalo-harmonico') as SeriesItem;
/** O melódico, para medir o que ele deixou de oferecer. */
const melodico = EXERCISES.filter(isSeries).find(e => e.id === 'ouvido-intervalo') as SeriesItem;
const pergunta = (extra: Record<string, unknown>) => item.make({ ...item.defaults, ...extra } as never, ctx);
const recusa = (extra: Record<string, unknown>) => item.problema?.({ ...item.defaults, ...extra } as never, ctx) ?? null;

describe('o modo de audiar as notas', () => {
  it('é o terceiro valor de "onde responder"', () => {
    const s = item.settings(ctx).find(x => x.id === 'resposta')!;
    expect((s.options ?? []).map(o => o.id)).toEqual(['alternativas', 'notas', 'audiar']);
  });

  it('as notas soam JUNTAS, e cada botão toca uma sozinha', () => {
    for (let i = 0; i < 30; i++) {
      const q = pergunta({ resposta: 'audiar' });
      // um grupo só: é isso que faz o intervalo ser harmônico
      expect(q.sound!.groups).toHaveLength(1);
      const soaram = q.sound!.groups[0];
      expect(soaram).toHaveLength(2);
      const partes = q.sound!.partes!;
      expect(partes.map(p => p.groups)).toEqual(soaram.map(m => [[m]]));
      expect(partes.map(p => p.label)).toEqual(['Nota 1', 'Nota 2']);
      // de baixo para cima: em harmônico não há "primeira nota"
      expect([...soaram].sort((a, b) => a - b)).toEqual(soaram);
    }
  });

  /**
   * **O julgamento espera a conferência**: os três botões de "como foi" só aparecem depois de ouvir
   * o gabarito, e aqui o gabarito são vários botões — daí a marca em cada um (ver `ParteDoSom`).
   * Sem isto a autoavaliação nunca apareceria, e o modo ficaria sem como responder.
   */
  it('cada botão é gabarito, e a resposta é autoavaliação', () => {
    const q = pergunta({ resposta: 'audiar' });
    expect(q.surface.kind).toBe('autoavaliacao');
    expect(q.expected).toEqual({ kind: 'option', id: 'facil' });
    expect(q.sound!.partes!.every(p => p.gabarito)).toBe(true);
    expect(q.autoplay).toBe(true);
    // a revelação continua sendo o nome do intervalo
    expect(q.reveal).toBeTruthy();
  });

  /**
   * **Depois da divisão, o modo nem se oferece no melódico** — e é melhor assim: a recusa existia
   * para uma combinação que a tela deixava montar, e agora a tela não deixa. A recusa continua lá
   * para quem chamar `problema` à mão, que é o caminho das rotinas antigas.
   */
  it('o melódico não oferece audiar, e recusa se alguém insistir', () => {
    const resposta = melodico.settings(ctx).find(x => x.id === 'resposta')!;
    expect((resposta.options ?? []).map(o => o.id)).toEqual(['alternativas', 'notas']);
    for (const direcao of ['sobe', 'desce']) {
      const r = melodico.problema?.({ ...melodico.defaults, resposta: 'audiar', direcao } as never, ctx) ?? null;
      expect(r, direcao).toBe(translate('pt', 'player.audiarPedeJuntas'));
    }
    expect(recusa({ resposta: 'audiar' })).toBeNull();
  });

  /**
   * Achado revendo o próprio commit: o guarda olhava só `resposta` e `direcao`, e o estímulo
   * `escrito` **ignora** "onde responder". Com o atalho novo em vigor, trocar para "ler e audiar" e
   * mexer na direção dava "sem pergunta possível" numa configuração que funciona — dois cliques.
   */
  it('lendo e audiando, a exigência de harmônico não vale', () => {
    for (const direcao of ['sobe', 'desce']) {
      expect(melodico.problema?.({ ...melodico.defaults, estimulo: 'escrito', resposta: 'audiar', direcao } as never, ctx) ?? null, direcao).toBeNull();
      const q = pergunta({ estimulo: 'escrito', resposta: 'audiar', direcao });
      expect(q.visual.kind, direcao).toBe('staff');
      expect(q.surface.kind, direcao).toBe('autoavaliacao');
    }
  });

  it('três notas valem audiando, e dão três botões', () => {
    expect(recusa({ resposta: 'audiar', notas: '3' })).toBeNull();
    const q = pergunta({ resposta: 'audiar', notas: '3' });
    expect(q.sound!.groups[0]).toHaveLength(3);
    expect(q.sound!.partes).toHaveLength(3);
    // e nomear três notas continua recusado: "o intervalo" não teria resposta só
    expect(recusa({ resposta: 'alternativas', notas: '3' })).toBe(translate('pt', 'player.tresNotasPedemNotas'));
  });

  it('o atalho novo pede harmônico — senão ele cairia no próprio guarda', () => {
    const atalho = item.presets!.find(p => p.id === 'audiar-notas')!;
    expect(atalho.settings).toMatchObject({ resposta: 'audiar' });
    expect(recusa(atalho.settings)).toBeNull();
  });
});

describe('os botões por nota nos outros modos', () => {
  it.each(['alternativas', 'notas'])('%s: toda pergunta tem um botão por nota', resposta => {
    for (const direcao of ['sobe', 'desce', 'juntas']) {
      const q = pergunta({ resposta, direcao });
      const partes = q.sound!.partes ?? [];
      expect(partes.length, `${resposta}/${direcao}`).toBe(2);
      // não são gabarito: nestes modos a resposta é nomear ou apontar, e não há o que liberar
      expect(partes.some(p => p.gabarito), `${resposta}/${direcao}`).toBe(false);
    }
  });

  /**
   * **A numeração segue o que se ouviu.** Descendo, "Nota 1" é a primeira que soou — a mais aguda.
   * Numerar sempre de baixo para cima faria o botão "Nota 1" tocar a segunda nota ouvida, e a
   * conferência diria o contrário do exercício.
   */
  it('descendo, "Nota 1" é a primeira que soou, não a mais grave', () => {
    // Descer é coisa do melódico: no harmônico as duas notas soam juntas, e não há "primeira".
    for (let i = 0; i < 30; i++) {
      const q = melodico.make({ ...melodico.defaults, resposta: 'alternativas', direcao: 'desce' } as never, ctx);
      const primeira = q.sound!.groups[0][0];
      expect(q.sound!.partes![0].groups).toEqual([[primeira]]);
      expect(q.sound!.partes![1].groups[0][0]).toBeLessThan(primeira);
    }
  });

  it('juntas, a numeração é de baixo para cima', () => {
    for (let i = 0; i < 30; i++) {
      const q = pergunta({ resposta: 'alternativas' });
      const ms = q.sound!.partes!.map(p => p.groups[0][0]);
      expect([...ms].sort((a, b) => a - b)).toEqual(ms);
    }
  });
});
