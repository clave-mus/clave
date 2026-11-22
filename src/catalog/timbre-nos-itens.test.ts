// O timbre como parâmetro, nos itens de ouvido — 19/11/2026.
//
// O Paulo: *"revise todo o catálogo e procure onde o piano novo pode entrar como timbre, onde pode
// ter timbres diferentes como parâmetro"*. A varredura achou o quadro: o piano de amostras **já** é
// o timbre padrão de onze itens (desde 12/11), cinco soam com a voz do braço de propósito, e só o
// `ouvido-intervalo` tinha o parâmetro. Este arquivo guarda os sete que o têm agora — declarado uma
// vez em `TIMBRE`, não oito vezes.
//
// **O `ouvido-tecla` entrou em 20/11.** Ele estava na lista dos de fora, e a justificativa era
// minha, não dele: o documento do Paulo pede timbre na linha de **nota** com as mesmas palavras com
// que o pede nas outras — *"timbre. padrão: piano normal... mas ter o synth como opção"*. No braço
// a superfície continua mandando, que é a regra que o resto do arquivo guarda.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem } from './types';
import { globalPresentation, resolveParams } from './params';
import { resolvePresentation } from '../audio/presentation';
import { translate, type MessageKey, type Vars } from '../i18n';
import { VOZES } from './helpers';

/** O perfil pede ÓRGÃO no piano: assim "o do perfil" é distinguível do padrão do motor. */
const params = resolveParams('violao', { key: { tonic: 0, mode: 'maior' }, timbres: { piano: 'orgao' } });
const ctx: Ctx = { naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v), params };

const comTimbre = EXERCISES.filter(isSeries).filter(e => e.settings(ctx).some(s => s.id === 'timbre'));
const baseDe = (e: SeriesItem) => ({ ...e.defaults, ...(e.defaultsDo?.(ctx) ?? {}) });

/** O timbre que o Player tocaria: as quatro camadas, na mesma ordem. */
const vozDe = (e: SeriesItem, extra: Record<string, unknown>) => {
  const s = { ...baseDe(e), ...extra };
  const q = e.make(s as never, ctx);
  const daConfig = e.settings(ctx)
    .filter(st => st.quando?.(s as never) ?? true)
    .reduce((acc, st) => (st.present ? { ...acc, ...st.present(s[st.id] as never) } : acc), {});
  return resolvePresentation([globalPresentation(params, q.sound?.instrument), e.presentation, daConfig, q.presentation]).voice;
};

describe('quem tem o parâmetro', () => {
  /**
   * A lista é explícita de propósito: um item de ouvido novo que esqueça o `TIMBRE` aparece aqui
   * como falta, e não como silêncio. Os de braço e de pauta ficam fora — ver o teste do fim.
   */
  it('são os oito itens de ouvido, e a lista é esta', () => {
    expect(comTimbre.map(e => e.id).sort()).toEqual([
      'melodia-de-ouvido', 'ouvido-acorde', 'ouvido-campo', 'ouvido-celulas',
      'ouvido-escala', 'ouvido-intervalo', 'ouvido-tecla', 'tonica-de-ouvido',
    ]);
  });

  it('todos declaram o padrão, e o padrão é o do perfil', () => {
    for (const e of comTimbre) {
      expect(e.defaults.timbre, e.id).toBe('perfil');
      expect(e.defaults.qualTimbre, e.id).toBe('piano');
    }
  });
});

describe('os três valores, item por item', () => {
  it.each(comTimbre.map(e => e.id))('%s: o padrão é o timbre do perfil', id => {
    const e = comTimbre.find(x => x.id === id)!;
    const q = e.make(baseDe(e) as never, ctx);
    // quem soa do braço tem a voz do braço, e o perfil escolhe a dela; os outros caem no piano do perfil
    const esperada = q.sound?.instrument === 'violao' ? 'violao' : 'orgao';
    expect(vozDe(e, {}), id).toBe(esperada);
    expect(q.presentation, `${id}: sem sorteio, a pergunta não carrega camada`).toBeUndefined();
  });

  it.each(comTimbre.map(e => e.id))('%s: escolhendo um, é ele que soa', id => {
    const e = comTimbre.find(x => x.id === id)!;
    for (const v of VOZES) expect(vozDe(e, { timbre: 'escolher', qualTimbre: v }), `${id}/${v}`).toBe(v);
  });

  /**
   * **Dois resultados legítimos, e o teste separa os dois** — isto me pegou escrevendo: o
   * `melodia-de-ouvido` responde no braço por padrão (o perfil é de violão), e ali o sorteio **não**
   * se aplica de propósito. Esperar variação em todo item era a minha expectativa, não a regra.
   */
  it.each(comTimbre.map(e => e.id))('%s: sorteado, passeia — ou preserva a voz do braço', id => {
    const e = comTimbre.find(x => x.id === id)!;
    const padrao = e.make(baseDe(e) as never, ctx);
    const doBraco = padrao.sound?.instrument === 'violao' || padrao.sound?.instrument === 'baixo';
    if (doBraco) {
      expect(vozDe(e, { timbre: 'sorteado' }), `${id}: o braço mantém a voz`).toBe(padrao.sound!.instrument);
      return;
    }
    const vistos = new Set<string>();
    for (let i = 0; i < 150; i++) vistos.add(String(vozDe(e, { timbre: 'sorteado' })));
    expect(vistos.size, `${id}: ${[...vistos].join(',')}`).toBeGreaterThanOrEqual(4);
  });

  it.each(comTimbre.map(e => e.id))('%s: o seletor de qual timbre só aparece com "escolher"', id => {
    const e = comTimbre.find(x => x.id === id)!;
    const quando = e.settings(ctx).find(s => s.id === 'qualTimbre')!.quando!;
    expect(quando({ ...baseDe(e), timbre: 'escolher' } as never)).toBe(true);
    for (const timbre of ['perfil', 'sorteado']) expect(quando({ ...baseDe(e), timbre } as never), timbre).toBe(false);
  });
});

/**
 * **Onde a voz carrega informação, o sorteio não entra.** Um acorde desenhado no braço soa com a voz
 * do braço — foi queixa dele em 13/11 que soasse de piano —, e sortear ali apagaria a informação
 * para pôr variedade no lugar. Nos itens que respondem no braço, o sorteio vale no teclado e na
 * pauta, e o braço mantém a sua voz.
 */
describe('o braço mantém a voz do braço', () => {
  it('ouvido-acorde desenhando no braço, e melodia-de-ouvido no braço', () => {
    const acorde = comTimbre.find(e => e.id === 'ouvido-acorde')!;
    expect(vozDe(acorde, { resposta: 'desenhar', instrumento: 'braco', timbre: 'sorteado' })).toBe('violao');
    // e no teclado o sorteio volta a valer
    const vistos = new Set<string>();
    for (let i = 0; i < 80; i++) vistos.add(String(vozDe(acorde, { resposta: 'desenhar', instrumento: 'piano', timbre: 'sorteado' })));
    expect(vistos.size).toBeGreaterThan(1);

    const melodia = comTimbre.find(e => e.id === 'melodia-de-ouvido')!;
    expect(vozDe(melodia, { superficie: 'braco', timbre: 'sorteado' })).toBe('violao');
    // e na pauta ele passeia, como os outros
    const naPauta = new Set<string>();
    for (let i = 0; i < 80; i++) naPauta.add(String(vozDe(melodia, { superficie: 'pauta', timbre: 'sorteado' })));
    expect(naPauta.size, [...naPauta].join(',')).toBeGreaterThan(1);
  });
});

describe('quem NÃO tem o parâmetro, e por quê', () => {
  /**
   * Nos itens de braço e de pauta a voz segue a superfície: ela diz de que instrumento é a pergunta.
   * Sortear ali trocaria informação por variedade — e é por isso que a varredura parou nos de ouvido.
   */
  it('os de braço e de pauta ficam de fora, de propósito', () => {
    const sem = ['nota-no-instrumento', 'intervalo-no-instrumento', 'acorde-no-instrumento', 'mapa-do-braco',
      'nota-na-pauta', 'intervalo-na-pauta', 'acorde-na-pauta', 'pauta-escala', 'ritmo-ouvido'];
    for (const id of sem) {
      const e = EXERCISES.filter(isSeries).find(x => x.id === id);
      expect(e, id).toBeTruthy();
      expect(e!.settings(ctx).some(s => s.id === 'timbre'), `${id} ganhou timbre sem ninguém decidir`).toBe(false);
    }
  });
});
