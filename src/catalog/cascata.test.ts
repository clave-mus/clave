// F2-1 · a cascata de parâmetros.
//
// O critério de pronto da tarefa é duplo, e os dois estão travados aqui:
// 1. acrescentar um parâmetro global novo faz todo item respeitá-lo SEM editar o catálogo;
// 2. cada valor resolvido lembra DE ONDE veio, que é o que permite "Tonalidade: Dó maior (da rotina)".
import { describe, expect, it } from 'vitest';
import {
  camadaDoPerfil, herdado, ORIGENS, PARAMS_BASE, resolveCamadas, resolveParams, valoresDe,
  type Camada, type GlobalParams,
} from './params';
import { EXERCISES } from './catalog';
import { isSeries } from './types';
import { globalPresentation } from './params';
import { resolvePresentation } from '../audio/presentation';

describe('cascata de parâmetros', () => {
  it('sem camada nenhuma, tudo vem do item', () => {
    const r = resolveCamadas([]);
    expect(valoresDe(r)).toEqual(PARAMS_BASE);
    for (const k of Object.keys(PARAMS_BASE) as (keyof GlobalParams)[]) {
      expect(r[k].origin).toBe('item');
    }
  });

  it('a camada mais específica vence, e a origem acompanha o valor', () => {
    const r = resolveCamadas([
      { origin: 'perfil', values: { tempo: 90 } },
      { origin: 'rotina', values: { tempo: 100, key: { tonic: 7, mode: 'maior' } } },
      { origin: 'etapa', values: { tempo: 120 } },
    ]);
    expect(r.tempo.value).toBe(120);
    expect(r.tempo.origin).toBe('etapa');
    expect(r.key.value).toEqual({ tonic: 7, mode: 'maior' });
    expect(r.key.origin).toBe('rotina');
    expect(r.material.origin).toBe('item');
  });

  it('a ordem em que as camadas chegam não importa — a precedência é a mesma', () => {
    const camadas: Camada[] = [
      { origin: 'etapa', values: { tempo: 120 } },
      { origin: 'item', values: { tempo: 60 } },
      { origin: 'rotina', values: { tempo: 100 } },
    ];
    const a = resolveCamadas(camadas);
    const b = resolveCamadas([...camadas].reverse());
    expect(a).toEqual(b);
    expect(a.tempo.value).toBe(120);
  });

  it('"agora" vence tudo, inclusive a etapa', () => {
    const r = resolveCamadas([
      { origin: 'etapa', values: { tempo: 120 } },
      { origin: 'agora', values: { tempo: 72 } },
    ]);
    expect(r.tempo.value).toBe(72);
    expect(r.tempo.origin).toBe('agora');
  });

  it('`herdado` é o que a tela usa para escrever "(da rotina)"', () => {
    const r = resolveCamadas([
      { origin: 'perfil', values: { volume: 0.8 } },
      { origin: 'rotina', values: { key: { tonic: 0, mode: 'maior' } } },
    ]);
    expect(herdado(r, 'key')).toBe(true);     // veio da rotina: a tela avisa
    expect(herdado(r, 'volume')).toBe(false); // veio do perfil: é escolha antiga da pessoa
    expect(herdado(r, 'clef')).toBe(false);   // nunca foi tocado
  });

  it('valor `undefined` numa camada não apaga o de baixo', () => {
    const r = resolveCamadas([
      { origin: 'rotina', values: { tempo: 100 } },
      { origin: 'etapa', values: { tempo: undefined } },
    ]);
    expect(r.tempo.value).toBe(100);
    expect(r.tempo.origin).toBe('rotina');
  });
});

describe('as duas regras que não são "a última vence"', () => {
  it('timbres se fundem: escolher o do baixo não apaga o do piano', () => {
    const r = resolveCamadas([
      { origin: 'perfil', values: { timbres: { piano: 'orgao' } } },
      { origin: 'rotina', values: { timbres: { baixo: 'pad' } } },
    ]);
    expect(r.timbres.value).toEqual({ piano: 'orgao', violao: 'violao', baixo: 'pad' });
  });

  it('a afinação segue o instrumento quando ninguém a declarou', () => {
    const r = resolveCamadas([{ origin: 'rotina', values: { instrument: 'baixo' } }]);
    expect(r.tuning.value.length).toBe(4);          // baixo, não violão
    expect(r.tuning.origin).toBe('rotina');          // a origem é a de quem mudou o instrumento
  });

  it('mas uma afinação explícita manda mais que o instrumento', () => {
    const drop = [38, 45, 50, 55, 59, 64] as const;
    const r = resolveCamadas([
      { origin: 'perfil', values: { instrument: 'baixo' } },
      { origin: 'etapa', values: { tuning: drop } },
    ]);
    expect(r.tuning.value).toEqual(drop);
    expect(r.tuning.origin).toBe('etapa');
  });
});

describe('compatibilidade com o que já existia', () => {
  it('a cascata reproduz exatamente o `resolveParams` antigo', () => {
    for (const instrumento of ['piano', 'violao', 'baixo'] as const) {
      for (const stored of [{}, { tempo: 100 }, { timbres: { piano: 'pad' as const } }, { clef: 'fa' as const }]) {
        const antigo = resolveParams(instrumento, stored);
        const novo = valoresDe(resolveCamadas([camadaDoPerfil(instrumento, stored)]));
        expect(novo).toEqual(antigo);
      }
    }
  });

  it('as origens cobrem as cinco camadas, na ordem', () => {
    expect(ORIGENS).toEqual(['item', 'perfil', 'rotina', 'etapa', 'agora']);
  });
});

describe('critério de pronto: um parâmetro global novo vale para todo item com áudio', () => {
  // Se este teste precisar ser editado para acrescentar um parâmetro de som, a camada falhou:
  // o combinado é que acrescentar um parâmetro NÃO exige editar o catálogo.
  it('o volume do perfil chega a todo exercício com som, sem o catálogo saber dele', () => {
    const comSom = EXERCISES.filter(isSeries).filter(e => {
      const ctx = { naming: 'pt' as const, conv: 'pt' as const, t: ((k: string) => k) as never, params: PARAMS_BASE };
      return !!e.make(e.defaults, ctx).sound;
    });
    expect(comSom.length).toBeGreaterThan(3);

    const baixo = valoresDe(resolveCamadas([{ origin: 'perfil', values: { volume: 0.5 } }]));
    const alto = valoresDe(resolveCamadas([{ origin: 'perfil', values: { volume: 1.2 } }]));
    for (const e of comSom) {
      const p = (g: GlobalParams) => resolvePresentation([globalPresentation(g), e.presentation]);
      expect(p(alto).volume).toBeGreaterThan(p(baixo).volume);
    }
  });

  it('o timbre escolhido por instrumento chega ao som daquele instrumento', () => {
    const g = valoresDe(resolveCamadas([{ origin: 'perfil', values: { timbres: { baixo: 'orgao' } } }]));
    expect(resolvePresentation([globalPresentation(g, 'baixo')]).voice).toBe('orgao');
    expect(resolvePresentation([globalPresentation(g, 'piano')]).voice).toBe('piano');
  });
});
