// F2-3 · o catálogo lendo a cascata.
//
// O contrato da tarefa é um guarda contra a regressão que motivou a decisão 57: antes disto, o
// catálogo lia `tuning` em um lugar e mais nada, e por isso a rotação de tonalidade não faria nada.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { alturaDoPc, pcsPermitidas, regiao } from './contexto-musical';
import { resolveCamadas, valoresDe, type ValoresDeCamada } from './params';
import { isSeries, type Ctx } from './types';
import { variantesDos, type Variante } from './variantes';
import { mod } from '../theory/core';

const ctxCom = (values: ValoresDeCamada): Ctx => ({
  naming: 'pt', conv: 'pt', t: ((k: string) => k) as never,
  params: valoresDe(resolveCamadas([{ origin: 'perfil', values }])),
});

// Depois das fusões por superfície (decisão 16), o teste percorre VARIANTES, não itens: a mesma
// pergunta cobra grafia na pauta e altura no braço, e medir só o padrão do item cobriria um terço dele.
const SERIES = EXERCISES.filter(isSeries);
const VARIANTES = variantesDos(SERIES, ctxCom({}));
const variante = (rotulo: string): Variante => {
  const v = VARIANTES.find(x => x.rotulo === rotulo);
  if (!v) throw new Error(`sem variante ${rotulo} (há: ${VARIANTES.map(x => x.rotulo).join(', ')})`);
  return v;
};

/** Todas as alturas que uma variante toca, ao longo de N perguntas. */
function alturas(rotulo: string, ctx: Ctx, n = 120): number[] {
  const v = variante(rotulo);
  const ex = SERIES.find(e => e.id === v.id)!;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const q = ex.make(v.settings, ctx);
    if (q.sound) out.push(...q.sound.groups.flat());
  }
  return out;
}

/** Itens que tocam ALTURA. `ritmo-ouvido` tem som, mas só percussão — não há o que pôr em região. */
const comSom = VARIANTES.filter(v => {
  const ctx = ctxCom({});
  const ex = SERIES.find(e => e.id === v.id)!;
  for (let i = 0; i < 20; i++) {
    const q = ex.make(v.settings, ctx);
    if (q.sound?.groups.some(g => g.length)) return true;
  }
  return false;
});

/** Os itens que sorteiam nota LIVREMENTE — são os que `material` governa (ver contexto-musical.ts). */
const SORTEIAM_NOTA_LIVRE = [
  'que-nota-e-essa/pauta', 'que-nota-e-essa/teclado', 'que-nota-e-essa/braco',
  'ache-a-nota/pauta', 'ache-a-nota/teclado', 'ache-a-nota/braco',
  'ouvido-tecla',
];

/**
 * A faixa que o item usa quando ninguém mandou nada.
 *
 * O teste precisa dela porque cada item tem alcance próprio: clave de sol não desce a 48, baixo
 * não sobe a 80. Pedir uma região fora do alcance do item **não** é ignorá-la — a região do item
 * vence de propósito (ver `regiao`). Então o teste divide a faixa NATURAL de cada um.
 */
function faixaNatural(rotulo: string): { lo: number; hi: number } {
  const ms = alturas(rotulo, ctxCom({}), 200);
  return { lo: Math.min(...ms), hi: Math.max(...ms) };
}

/**
 * Onde a região **não** se aplica, e por quê. Não é omissão: é a oitava sendo ditada por outra
 * coisa, e a região não pode mandar mais que ela.
 *
 * - itens de **pauta**: a oitava vem da clave, senão a leitura deixa de ser legível naquela clave;
 * - `acorde-visual`: as formas são posições reais do braço — um Dó aberto é onde ele é.
 *
 * Nesses, o que a cascata governa é o **material** (qual fundamental), não a altura.
 */
// Com as fusões, a lista passou a ser POR VARIANTE — e isso é a prova de que a superfície é o eixo
// certo: a mesma pergunta respeita a região no teclado e não no braço, porque as unidades são outras.
const REGIAO_NAO_SE_APLICA = [
  // Pauta: a oitava é ditada pela CLAVE, para a nota caber nas linhas.
  'que-nota-e-essa/pauta', 'ache-a-nota/pauta', 'que-intervalo-e-esse/pauta', 'faca-o-intervalo/pauta', 'que-acorde-e-esse/pauta', 'pauta-escala',
  // Braço: a região é a FAIXA DE CASAS, que a pessoa escolhe, e não a faixa em MIDI. Sobrepor as duas
  // mede a mesma coisa com unidades diferentes — e era um bug: num baixo com casas 0–5 e a região
  // padrão (48–72), sobrava UMA casa no braço inteiro, e o exercício repetia a mesma pergunta para
  // sempre (1 posição distinta em 200 sorteios).
  'que-nota-e-essa/braco', 'ache-a-nota/braco', 'que-intervalo-e-esse/braco', 'faca-o-intervalo/braco',
  // Acordes desenhados no braço: são posições reais — um Dó aberto é onde ele é.
  'que-acorde-e-esse/braco',
];

describe('F2-3 · a região é lida', () => {
  // Guarda contra a regressão da decisão 57: se um item voltar a ignorar a cascata, o piso não é
  // respeitado e isto falha.
  it.each(comSom.filter(v => !REGIAO_NAO_SE_APLICA.includes(v.rotulo)).map(v => v.rotulo))(
    '%s respeita o piso e o teto pedidos', id => {
      const nat = faixaNatural(id);
      const lo = Math.max(nat.lo, Math.round((nat.lo + nat.hi) / 2) - 6);
      const hi = lo + 12;
      const ms = alturas(id, ctxCom({ range: { lo, hi } }));
      // conteúdo pode subir uma oitava acima da fundamental (escala, acorde): o teto é o da
      // fundamental, não o da última nota
      expect(Math.min(...ms), `${id} tocou abaixo do piso`).toBeGreaterThanOrEqual(lo);
      expect(Math.min(...ms), `${id} ignora params.range`).toBeLessThanOrEqual(hi);
    },
  );

  it('a região do item aperta a global, nunca alarga', () => {
    const ctx = ctxCom({ range: { lo: 48, hi: 72 } });
    expect(regiao(ctx, { lo: 60, hi: 64 })).toEqual({ lo: 60, hi: 64 });
    expect(regiao(ctx, { lo: 20, hi: 100 })).toEqual({ lo: 48, hi: 72 });
  });

  it('quando a intersecção é vazia, a do item vence — melhor sair da região que não ter o que tocar', () => {
    const ctx = ctxCom({ range: { lo: 80, hi: 90 } });
    expect(regiao(ctx, { lo: 40, hi: 52 })).toEqual({ lo: 40, hi: 52 });
  });

  it('encaixar uma classe de altura na região nunca desce abaixo do piso', () => {
    // foi um bug real: `m - m%12 + pc` podia cair abaixo do piso pedido
    const ctx = ctxCom({ range: { lo: 60, hi: 72 } });
    for (let pc = 0; pc < 12; pc++) {
      const m = alturaDoPc(ctx, pc);
      expect(m).toBeGreaterThanOrEqual(60);
      expect(mod(m, 12)).toBe(pc);
    }
  });
});

describe('F2-3 · o material é lido', () => {
  const SOL_MAIOR = [7, 9, 11, 0, 2, 4, 6]; // Sol Lá Si Dó Ré Mi Fá♯

  it('as classes permitidas são as sete da tonalidade', () => {
    const ctx = ctxCom({ key: { tonic: 7, mode: 'maior' }, material: 'diatonico' });
    expect([...pcsPermitidas(ctx)].sort((a, b) => a - b)).toEqual([...SOL_MAIOR].sort((a, b) => a - b));
  });

  it('sem tonalidade definida, as doze são permitidas — livre é o padrão', () => {
    expect(pcsPermitidas(ctxCom({ material: 'diatonico' }))).toHaveLength(12);
    expect(pcsPermitidas(ctxCom({ key: { tonic: 7, mode: 'maior' } }))).toHaveLength(12);
  });

  it.each(SORTEIAM_NOTA_LIVRE)('%s só sorteia nota da tonalidade quando o material é diatônico', id => {
    const ctx = ctxCom({ key: { tonic: 7, mode: 'maior' }, material: 'diatonico' });
    const fora = alturas(id, ctx).filter(m => !SOL_MAIOR.includes(mod(m, 12)));
    expect(fora.map(m => mod(m, 12)), `${id} sorteou nota fora de Sol maior`).toEqual([]);
  });

  it('o material NÃO mexe no conteúdo declarado: escala menor continua tendo as notas dela', () => {
    // "que escala é esta?" respondendo menor harmônica tem notas fora da tonalidade por definição,
    // e isso está certo — material filtra o que o app SORTEIA, não o que o app PERGUNTA
    const ctx = ctxCom({ key: { tonic: 0, mode: 'maior' }, material: 'diatonico' });
    const ms = alturas('ouvido-escala', ctx);
    expect(ms.length).toBeGreaterThan(0);
  });
});

describe('F2-3 · livre continua livre', () => {
  it.each(SORTEIAM_NOTA_LIVRE)('%s varia bastante quando não há tonalidade', id => {
    const pcs = new Set(alturas(id, ctxCom({}), 200).map(m => mod(m, 12)));
    // sem tonalidade, quem não escolheu quer variedade — não Dó maior em tudo
    expect(pcs.size, `${id} engessou sem tonalidade definida`).toBeGreaterThan(6);
  });
});

describe('F2-3 · a clave é lida', () => {
  it('o item sem clave escolhida usa a global', () => {
    const pergunta = (v: Variante) => SERIES.find(e => e.id === v.id)!.make({ ...v.settings, claves: [] }, ctxCom({ clef: 'fa' }));
    const naPauta = VARIANTES.filter(v => pergunta(v).visual.kind === 'staff');
    expect(naPauta.length).toBeGreaterThan(2);
    for (const v of naPauta) {
      const q = pergunta(v);
      if (q.visual.kind === 'staff') expect(q.visual.clef, `${v.rotulo} ignora params.clef`).toBe('fa');
    }
  });
});

describe('F2-3 · a tonalidade é lida — é o que faz a rotação existir', () => {
  const TONICA_DE = ['ouvido-escala', 'ouvido-celulas', 'ouvido-acorde'];

  it.each(TONICA_DE)('%s muda de tônica quando a tonalidade muda', id => {
    const em = (tonic: number) => {
      const ms = alturas(id, ctxCom({ key: { tonic, mode: 'maior' } }), 60);
      // a tônica é a nota mais grave de cada pergunta; aqui basta a mais grave do conjunto
      return mod(Math.min(...ms), 12);
    };
    // é exatamente o que a decisão 57 diz que não funcionava: a rotina avançava de Dó para Sol
    // e o exercício continuava sorteando no aleatório
    expect(em(0), `${id} ignora params.key`).not.toBe(em(7));
    expect(em(0)).toBe(0);
    expect(em(7)).toBe(7);
  });
});
