// O ciclo sem tela (F6-1). O que importa travar: ele **reaproveita** os exercícios de ouvido (não é
// motor novo), toda fonte aponta para um exercício que existe, e a resposta que ele vai dizer em voz
// alta é a mesma que o exercício daria por escrito.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type Question, type SettingValue } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';
import { duracaoDoPasso, FONTES, OBJETOS_DE_BOLSO, PENSAR, proximoPasso } from './maos-livres';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('baixo', {}),
};
const fazer = (itemId: string, settings: Record<string, SettingValue>): Question => {
  const ex = EXERCISES.filter(isSeries).find(e => e.id === itemId)!;
  return ex.make({ ...ex.defaults, ...settings }, ctx);
};

describe('as fontes', () => {
  it('toda fonte aponta para um exercício de ouvido que existe e gera pergunta', () => {
    for (const f of FONTES) {
      const ex = EXERCISES.filter(isSeries).find(e => e.id === f.itemId);
      expect(ex, `${f.id} → ${f.itemId}`).toBeDefined();
      expect(() => fazer(f.itemId, f.settings), f.id).not.toThrow();
    }
  });

  it('toda fonte TOCA alguma coisa — sem som não há pergunta para quem não olha', () => {
    for (const f of FONTES) {
      const q = fazer(f.itemId, f.settings);
      expect(q.sound?.groups.some(g => g.length), f.id).toBe(true);
    }
  });

  it('e toda fonte dá a resposta por extenso: é o que será dito em voz alta', () => {
    for (const f of FONTES) {
      expect(fazer(f.itemId, f.settings).reveal.trim(), f.id).not.toBe('');
    }
  });

  // É a decisão 15 em miniatura: escalas e modos são o MESMO exercício com configurações diferentes.
  it('escalas e modos vêm do mesmo exercício, com listas diferentes', () => {
    const esc = FONTES.find(f => f.id === 'escalas')!;
    const mod = FONTES.find(f => f.id === 'modos')!;
    expect(mod.itemId).toBe(esc.itemId);
    expect(mod.settings).not.toEqual(esc.settings);
  });

  it('os ids dos objetos são únicos', () => {
    expect(new Set(OBJETOS_DE_BOLSO).size).toBe(FONTES.length);
  });

  it('cada objeto tem nome nos dois idiomas', () => {
    for (const id of OBJETOS_DE_BOLSO) {
      for (const loc of ['pt', 'en'] as const) {
        expect(translate(loc, `handsfree.obj_${id}` as MessageKey).trim(), `${loc}:${id}`).not.toBe('');
      }
    }
  });
});

describe('o passo', () => {
  it('sorteia entre os objetos escolhidos, e só entre eles', () => {
    for (let i = 0; i < 40; i++) {
      const p = proximoPasso(['intervalos', 'acordes'], fazer, ctx)!;
      expect(['intervalos', 'acordes']).toContain(p.fonte);
    }
  });

  it('a resposta do passo é o `reveal` da pergunta — não há segunda fonte de verdade', () => {
    const p = proximoPasso(['intervalos'], fazer, ctx)!;
    expect(p.resposta).toBe(p.pergunta.reveal);
  });

  it('sem objeto escolhido, devolve null — a tela mostra o aviso em vez de rodar vazia', () => {
    expect(proximoPasso([], fazer, ctx)).toBeNull();
    expect(proximoPasso(['inexistente'], fazer, ctx)).toBeNull();
  });

  it('com o sorteio no limite, não estoura o índice', () => {
    expect(proximoPasso(OBJETOS_DE_BOLSO, fazer, ctx, () => 0.999999)).not.toBeNull();
    expect(proximoPasso(OBJETOS_DE_BOLSO, fazer, ctx, () => 0)!.fonte).toBe('intervalos');
  });
});

describe('a conta do tempo', () => {
  // Não é precisão de relógio de áudio: é o que diz se dez minutos entregam 30 perguntas ou 8.
  it('o anúncio em voz custa menos que repetir o som', () => {
    expect(duracaoDoPasso(3, 6, 'voz')).toBeLessThan(duracaoDoPasso(3, 6, 'repetir'));
    expect(duracaoDoPasso(3, 6, 'ambos')).toBeGreaterThan(duracaoDoPasso(3, 6, 'repetir'));
  });

  it('o tempo de pensar entra inteiro na conta', () => {
    expect(duracaoDoPasso(3, 10, 'voz') - duracaoDoPasso(3, 4, 'voz')).toBe(6);
  });

  it('o padrão de "pensar" está dentro dos limites que a tela oferece', () => {
    expect(PENSAR.padrao).toBeGreaterThanOrEqual(PENSAR.min);
    expect(PENSAR.padrao).toBeLessThanOrEqual(PENSAR.max);
  });
});
