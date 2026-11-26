// **O item da nota comum** — a camada de catálogo: enunciado, grafia e conferência.
//
// O motor tem teste próprio (`theory/nota-comum.test.ts`), com os oito exemplos que ele escreveu.
// Aqui se mede o que chega à tela.
import { describe, expect, it } from 'vitest';
import { notaComum } from './items/nota-comum';
import { resolveParams } from './params';
import type { Ctx } from './types';
import { translate, type MessageKey, type Vars } from '../i18n';
import { CHORDS, type ChordId } from '../theory/core';

const ctx = (chave: Parameters<typeof resolveParams>[1] = {}): Ctx => ({
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('piano', chave),
});
const perguntas = (extra: Record<string, unknown> = {}, c = ctx(), n = 150) =>
  Array.from({ length: n }, () => notaComum.make!({ ...notaComum.defaults, ...extra } as never, c));

describe('o que chega à tela', () => {
  it('a nota comum soa sozinha, e é a primeira do arpejo', () => {
    for (const q of perguntas()) {
      const ancora = q.sound!.groups[0][0];
      const arpejo = q.sound!.partes!.find(p => p.id === 'resposta')!.groups.flat();
      expect(arpejo[0], 'o desenho não começa na nota comum').toBe(ancora);
      // Dó4 por padrão: a âncora é escolha do painel, não sorteio.
      expect(ancora).toBe(60);
    }
  });

  /**
   * **A grafia sai do acorde, e isso se vê nas LETRAS.**
   *
   * Visto na tela em 26/11, antes deste teste existir: o rodapé dizia `Cdim · Dó Ré♯ Fá♯`, e um
   * diminuto se escreve `Dó Mi♭ Sol♭`. As duas versões soam igual e **usam letras diferentes** —
   * dó-ré-fá contra dó-mi-sol —, e é a letra que denuncia: um acorde é uma pilha de terças, então as
   * letras pulam de duas em duas. Foi a primeira versão deste item grafando classe por classe, com
   * `notaGrafada`, que não sabe que acorde está escrevendo.
   *
   * O passo é **par**, e não sempre dois: um acorde com décima terceira e sem nona pula a nona
   * (`Fá Lá Dó Mi Ré` — a última é uma sétima acima da anterior, que são três terças). Par é o que
   * caracteriza a pilha de terças; passo ímpar é segunda, quarta ou sexta, e aí a grafia está errada.
   */
  it('as letras do acorde andam de terça em terça', () => {
    const LETRAS = ['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si'];
    const letraDe = (nome: string) => LETRAS.indexOf(nome.replace(/[♯♭]/g, ''));
    for (const q of perguntas({ familias: ['triades', 'tetrades', 'extensoes', 'alterados'],
      papeis: ['1', '3', '5', '7', '9', '11', '13'], inversao: 'fundamental' })) {
      const nomes = q.reveal.split('  ·  ')[1].split(' ');
      const quantas = (q.revelacao as { notas: number[] }).notas.length;
      const pilha = nomes.slice(nomes.length - quantas);
      for (let i = 1; i < pilha.length; i++) {
        const passo = (letraDe(pilha[i]) - letraDe(pilha[i - 1]) + 7) % 7;
        expect(passo % 2, `${q.reveal}: ${pilha[i - 1]} → ${pilha[i]} não é pilha de terças`).toBe(0);
      }
    }
  });

  /**
   * ⚠️ **Dobrado na fundamental, nunca** — medido em 26/11: das 2544 combinações, 118 davam `F♯♯°7`
   * ou `B♭♭7(♯9)` quando a âncora era grafada pelo lado errado da enarmonia.
   *
   * Dobrado **nas notas** continua existindo e está certo: um diminuto com sétima tem Si♭♭.
   */
  it('nenhuma cifra tem acidente dobrado na fundamental', () => {
    for (const pc of Array.from({ length: 12 }, (_, i) => i)) {
      for (const q of perguntas({ notaComum: String(pc), familias: ['triades', 'tetrades', 'extensoes', 'alterados'],
        papeis: ['1', '3', '5', '7', '9', '11', '13'] }, ctx(), 60)) {
        const cifra = q.reveal.split('  ·  ')[0];
        expect(cifra.slice(0, 4), `cifra ilegível: ${cifra}`).not.toMatch(/♯♯|♭♭/);
      }
    }
  });

  it('a revelação mostra o acorde e nomeia a nota comum', () => {
    for (const q of perguntas()) {
      const r = q.revelacao;
      if (r?.kind !== 'keyboard') throw new Error('sem o teclado da revelação');
      const acorde = q.sound!.partes!.find(p => p.id === 'acorde')!.groups[0];
      expect(r.notas).toEqual(acorde);
      expect(Object.keys(r.rotulos ?? {})).toEqual(['60']);
    }
  });

  /** O enunciado diz o papel (decisão dele), e a cifra só aparece ao conferir. */
  it('o enunciado não entrega a cifra', () => {
    for (const q of perguntas({ familias: ['tetrades'], papeis: ['1', '3', '5', '7'] })) {
      const cifra = q.reveal.split('  ·  ')[0];
      expect(q.prompt).not.toContain(cifra);
    }
  });

  /** Com o baixo sorteado, o enunciado DIZ qual é — sem isso não há o que cantar. */
  it('invertendo, o enunciado diz quem está no baixo', () => {
    const comBaixo = perguntas({ inversao: 'sorteada', familias: ['tetrades'], papeis: ['1', '3', '5', '7'] })
      .filter(q => /no baixo/.test(q.prompt));
    expect(comBaixo.length, 'nenhuma inversão saiu em 150 sorteios').toBeGreaterThan(20);
    for (const q of comBaixo) {
      const arpejo = q.sound!.partes!.find(p => p.id === 'resposta')!.groups.flat();
      const acorde = q.sound!.partes!.find(p => p.id === 'acorde')!.groups[0];
      // O chão é o do acorde, e o desenho não desce abaixo dele.
      expect(Math.min(...arpejo)).toBe(acorde[0]);
    }
  });
});

describe('o cruzamento família × papel', () => {
  it('tríade com papel de sétima é recusada, e explicada', () => {
    const c = ctx();
    const s = { ...notaComum.defaults, familias: ['triades'], papeis: ['7'] };
    expect(notaComum.problema?.(s as never, c)).toBe(c.t('commonTone.noPair'));
    expect(notaComum.problema?.({ ...s, papeis: ['3'] } as never, c)).toBeNull();
  });

  it('o papel que a qualidade não tem nunca sai no sorteio', () => {
    for (const q of perguntas({ familias: ['triades'], papeis: ['1', '3', '5', '7', '9'] })) {
      const cifra = q.reveal.split('  ·  ')[0];
      const qualidade = (Object.keys(CHORDS) as ChordId[]).find(id => cifra.endsWith(CHORDS[id].suffix.pt) && CHORDS[id].degs.length === 3);
      expect(qualidade, `a cifra ${cifra} não é de tríade`).toBeTruthy();
    }
  });
});
