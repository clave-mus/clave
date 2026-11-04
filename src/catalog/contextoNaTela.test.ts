// O seletor de contexto da Praticar é fino de código e fácil de quebrar em silêncio: um item que passa
// a tocar som sai do "em silêncio" sem ninguém notar. Estes testes vigiam o contrato que a TELA usa —
// não a função, que já tem os seus em `context.test.ts`.
import { describe, expect, it } from 'vitest';
import { AMBIENTES, EXERCISES } from './index';
import { cabeNoContexto, CONTEXTOS, porQueNaoCabe, requisitosDe } from './context';
import { visivel } from './publicacao';
import { translate } from '../i18n';

const TODOS = [...EXERCISES, ...AMBIENTES];
const publicados = TODOS.filter(i => visivel(i.publicacao, false));

describe('os quatro contextos têm texto e dica nos dois idiomas', () => {
  const nome: Record<string, string> = { bolso: 'Bolso', onibus: 'Onibus', silencio: 'Silencio', instrumento: 'Instrumento' };
  it('rótulo e dica existem', () => {
    for (const c of CONTEXTOS) {
      for (const loc of ['pt', 'en'] as const) {
        expect(translate(loc, `home.ctx${nome[c]}` as never).trim(), `${loc}:${c}`).not.toBe('');
        expect(translate(loc, `home.ctx${nome[c]}Hint` as never).trim(), `${loc}:${c}:hint`).not.toBe('');
      }
    }
  });

  // A tela escreve o motivo a partir do que `porQueNaoCabe` devolve. Motivo sem texto apareceria como
  // chave crua na interface.
  it('todo motivo que a função devolve tem texto nos dois idiomas', () => {
    const motivos = new Set<string>();
    for (const i of TODOS) for (const c of CONTEXTOS) {
      const q = porQueNaoCabe(i, c, false);
      if (q) motivos.add(q);
    }
    expect(motivos.size, 'nenhum motivo apareceu: o teste não valeria nada').toBeGreaterThan(0);
    for (const q of motivos) {
      const chave = `home.why${q.charAt(0).toUpperCase()}${q.slice(1)}`;
      for (const loc of ['pt', 'en'] as const) expect(translate(loc, chave as never).trim(), `${loc}:${chave}`).not.toBe('');
    }
  });
});

describe('o que cada contexto entrega hoje', () => {
  // "Com o instrumento" é o contexto que não filtra nada. Se um item não couber nem nele, ele é
  // inalcançável pela Praticar — e isso seria um bug, não uma escolha.
  it('todo item publicado cabe em "com o instrumento"', () => {
    for (const i of publicados) expect(cabeNoContexto(i, 'instrumento', true), i.id).toBe(true);
  });

  it('"no ônibus" entrega bastante coisa: é o contexto do estudo de bolso real', () => {
    const cabem = publicados.filter(i => cabeNoContexto(i, 'onibus', false));
    expect(cabem.length).toBeGreaterThanOrEqual(10);
  });

  // Registrado, não corrigido: "de bolso" e "em silêncio" são apertados de propósito, e o comentário
  // de `context.ts` já diz isso. O teste existe para o número não mudar sem ninguém ver.
  it('"de bolso" e "em silêncio" são apertados, e isso é conhecido', () => {
    const bolso = publicados.filter(i => cabeNoContexto(i, 'bolso', false));
    const silencio = publicados.filter(i => cabeNoContexto(i, 'silencio', false));
    expect(bolso.length, `de bolso: ${bolso.map(i => i.id).join(', ')}`).toBeLessThanOrEqual(4);
    expect(silencio.length, `em silêncio: ${silencio.map(i => i.id).join(', ')}`).toBeLessThanOrEqual(6);
  });

  it('nenhum item publicado exige microfone (decisão 43)', () => {
    for (const i of publicados) expect(requisitosDe(i).microfone ?? false, i.id).toBeFalsy();
  });

  it('"posso cantar" só pode ABRIR portas, nunca fechar', () => {
    for (const i of TODOS) for (const c of CONTEXTOS) {
      if (cabeNoContexto(i, c, false)) expect(cabeNoContexto(i, c, true), `${i.id}/${c}`).toBe(true);
    }
  });
});
