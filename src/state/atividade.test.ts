// Como o histórico descreve a atividade — e o que ele se recusa a afirmar.
import { describe, expect, it } from 'vitest';
import { translate, type Locale, type MessageKey, type Vars } from '../i18n';
import { descreverAtividade } from './atividade';
import { paramsRegistraveis } from '../catalog/registro';
import { resolveParams } from '../catalog/params';
import { EXERCISES } from '../catalog/catalog';

const c = (locale: Locale = 'pt') => ({ naming: locale, t: (k: MessageKey, v?: Vars) => translate(locale, k, v) });
const base = { instrument: 'baixo' as const, tuning: [28, 33, 38, 43] };

describe('descreverAtividade', () => {
  it('escreve tonalidade, região e andamento quando a atividade os gravou', () => {
    expect(descreverAtividade({ settings: { bpm: 80 }, params: { ...base, key: { tonic: 5, mode: 'maior' }, range: { lo: 48, hi: 72 } } }, c()))
      .toBe('Fá maior · Média · 80 bpm');
  });

  it('a tonalidade vem na grafia convencional e no idioma da interface (antes: "Lá♯/Si♭" e "maior" cru)', () => {
    const s = { params: { ...base, key: { tonic: 10, mode: 'menor' as const } } };
    expect(descreverAtividade(s, c('pt'))).toBe('Si♭ menor');
    expect(descreverAtividade(s, c('en'))).toBe('B♭ minor');
  });

  // A razão desta função existir: o histórico dizia "80 bpm" em exercício de ouvido, que não tem
  // andamento. Sem `settings.bpm` gravado pela própria ferramenta, nada de bpm.
  it('NÃO afirma andamento que ninguém gravou', () => {
    expect(descreverAtividade({ params: { ...base, key: { tonic: 0, mode: 'maior' } } }, c())).toBe('Dó maior');
    expect(descreverAtividade({ settings: {}, params: base }, c())).toBe('');
  });

  it('atividade antiga, sem snapshot, devolve vazio sem quebrar', () => {
    expect(descreverAtividade(undefined, c())).toBe('');
  });

  describe('andamento de início e de fim (Técnica com subida)', () => {
    const com = (bpmInicio: number, bpmFim: number) => ({ settings: { bpmInicio, bpmFim } });

    it('mostra de onde partiu e aonde chegou', () => {
      expect(descreverAtividade(com(70, 82), c())).toBe('70 → 82 bpm');
    });

    it('sem mudança, mostra um número só — "70 → 70" seria ruído', () => {
      expect(descreverAtividade(com(70, 70), c())).toBe('70 bpm');
    });

    it('a ordem é a do tempo: partida, depois chegada — nunca invertida, mesmo se o fim for menor', () => {
      expect(descreverAtividade(com(90, 80), c())).toBe('90 → 80 bpm');
    });

    it('com só um dos dois, não inventa o outro', () => {
      expect(descreverAtividade({ settings: { bpmInicio: 70 } }, c())).toBe('');
      expect(descreverAtividade({ settings: { bpmFim: 82 } }, c())).toBe('');
    });

    it('convive com tonalidade, e o `bpm` único das outras ferramentas continua valendo', () => {
      expect(descreverAtividade({ settings: { bpmInicio: 60, bpmFim: 68 }, params: { ...base, key: { tonic: 0, mode: 'maior' } } }, c())).toBe('Dó maior · 60 → 68 bpm');
      expect(descreverAtividade({ settings: { bpm: 96 } }, c())).toBe('96 bpm');
    });
  });

  it('bpm que não é número é ignorado', () => {
    expect(descreverAtividade({ settings: { bpm: 'rápido' } }, c())).toBe('');
  });
});

describe('paramsRegistraveis: só o que o item respeita', () => {
  const resolvidos = { ...resolveParams('baixo', {}), key: { tonic: 5, mode: 'maior' as const } };
  const item = (id: string) => EXERCISES.find(e => e.id === id)!;

  it('instrumento e afinação valem sempre', () => {
    const r = paramsRegistraveis(resolvidos, []);
    expect(r.instrument).toBe('baixo');
    expect(r.tuning).toEqual(resolvidos.tuning);
  });

  it('um item que não respeita nada não grava tonalidade, região nem material', () => {
    const r = paramsRegistraveis(resolvidos, item('pauta-armadura').respeita);
    expect(Object.keys(r).sort()).toEqual(['instrument', 'tuning']);
  });

  // O defeito: o Player gravava o valor RESOLVIDO de tudo, então a região padrão (Média) entrava no
  // histórico de exercícios que não têm região — o padrão passando por escolha.
  it('grava exatamente o que o item respeita, e nada além', () => {
    const r = paramsRegistraveis(resolvidos, item('ouvido-escala').respeita);
    expect(Object.keys(r).sort()).toEqual(['instrument', 'key', 'range', 'tuning']);
    expect(r.key).toEqual({ tonic: 5, mode: 'maior' });
    expect(r).not.toHaveProperty('material');
  });

  it('todo item do catálogo registra só o que declara', () => {
    for (const ex of EXERCISES) {
      if (!('respeita' in ex)) continue;
      const chaves = Object.keys(paramsRegistraveis(resolvidos, ex.respeita)).filter(k => k !== 'instrument' && k !== 'tuning').sort();
      expect(chaves, ex.id).toEqual([...(ex.respeita ?? [])].sort());
    }
  });
});
