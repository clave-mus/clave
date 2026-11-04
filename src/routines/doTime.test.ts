// As rotinas do time (F3-6) são conteúdo escrito à mão, e conteúdo à mão apodrece em silêncio: um
// item renomeado, uma opção que saiu da lista, e a rotina passa a apontar para o nada **sem o app
// reclamar**. Estes testes são o que faz isso virar teste vermelho em vez de etapa vazia na tela.
import { describe, expect, it } from 'vitest';
import { AMBIENTES, EXERCISES } from '../catalog';
import type { CatalogItem, Setting } from '../catalog/types';
import { ehDataIso, estadoDe, visivel } from '../catalog/publicacao';
import { translate } from '../i18n';
import type { MessageKey } from '../i18n';
import { ROTINAS_DO_TIME, rotinaDoTimePorId, rotinasDoTime } from './doTime';
import { PARAMETROS_DE_PRATICA } from '../catalog/params';
import doc from '../../docs/revisao-pendente.md?raw';

const t = (k: MessageKey, v?: Record<string, string | number>) => translate('pt', k, v);
const itens = Object.fromEntries([...EXERCISES, ...AMBIENTES].map(i => [i.id, i])) as Record<string, CatalogItem>;
const ctx = { t, naming: 'latin' as const, conv: 'pt' as const, params: undefined as never };
const settingsDe = (item: CatalogItem): Setting[] => item.settings?.(ctx as never) ?? [];
const instancias = ROTINAS_DO_TIME.flatMap(r => r.etapas.flatMap(e => e.instancias.map(x => ({ r: r.id, ...x }))));

describe('as etapas apontam para itens que existem', () => {
  it('todo itemId está no catálogo', () => {
    for (const x of instancias) expect(itens[x.itemId], `${x.r} → ${x.itemId}`).toBeDefined();
  });

  // Rotina do time que pede o microfone ou o MIDI estaria quebrada para quem não os tem, e nenhum
  // exercício pode depender deles. `requires.instrumento` é legítimo: é o que o seletor de contexto
  // filtra na tela.
  it('nenhuma etapa depende de microfone nem de MIDI', () => {
    for (const x of instancias) {
      const req = itens[x.itemId]!.requires as Record<string, unknown>;
      expect(req.microfone ?? false, `${x.r} → ${x.itemId}`).toBeFalsy();
      expect(req.midi ?? false, `${x.r} → ${x.itemId}`).toBeFalsy();
    }
  });
});

describe('as configurações escritas à mão são válidas', () => {
  it('toda chave de settings existe no item', () => {
    for (const x of instancias) {
      const ids = settingsDe(itens[x.itemId]!).map(s => s.id);
      for (const k of Object.keys(x.settings)) {
        expect(ids, `${x.r} → ${x.itemId}: a chave "${k}" não existe (há ${ids.join(', ') || 'nenhuma'})`).toContain(k);
      }
    }
  });

  it('todo valor de lista é uma opção que existe', () => {
    for (const x of instancias) {
      for (const s of settingsDe(itens[x.itemId]!)) {
        const v = x.settings[s.id];
        if (v === undefined || !s.options) continue;
        const ids = s.options.map(o => o.id);
        for (const escolhido of Array.isArray(v) ? v : [v]) {
          expect(ids, `${x.r} → ${x.itemId}.${s.id}: "${escolhido}" não é opção`).toContain(escolhido);
        }
      }
    }
  });

  it('`multi` recebe lista e `single` recebe valor único — trocar os dois quebra a tela em silêncio', () => {
    for (const x of instancias) {
      for (const s of settingsDe(itens[x.itemId]!)) {
        const v = x.settings[s.id];
        if (v === undefined) continue;
        if (s.type === 'multi') expect(Array.isArray(v), `${x.r} → ${x.itemId}.${s.id}`).toBe(true);
        if (s.type === 'single' || s.type === 'toggle') expect(Array.isArray(v), `${x.r} → ${x.itemId}.${s.id}`).toBe(false);
      }
    }
  });

  it('`multi` nunca vem vazia: lista vazia é pergunta sem material', () => {
    for (const x of instancias) {
      for (const s of settingsDe(itens[x.itemId]!)) {
        if (s.type === 'multi' && Array.isArray(x.settings[s.id])) {
          expect((x.settings[s.id] as unknown[]).length, `${x.r} → ${x.itemId}.${s.id}`).toBeGreaterThan(0);
        }
      }
    }
  });
});

// Este é o teste que a correção da decisão 101 ensinou a escrever: declarar `material: diatonico`
// num item que não lê `material` é configuração que não faz nada, e ninguém percebe.
describe('os parâmetros de prática só aparecem em itens que os respeitam', () => {
  it('cada params declarado está no `respeita` do item', () => {
    for (const x of instancias) {
      for (const k of Object.keys(x.params ?? {})) {
        expect(itens[x.itemId]!.respeita ?? [], `${x.r} → ${x.itemId}: declara "${k}" e o item não o respeita`).toContain(k);
      }
    }
  });

  it('e é um parâmetro de prática, não de perfil (decisão 87)', () => {
    for (const x of instancias) {
      for (const k of Object.keys(x.params ?? {})) expect(PARAMETROS_DE_PRATICA as readonly string[]).toContain(k);
    }
  });
});

describe('a rotação de tonalidade', () => {
  const rot = ROTINAS_DO_TIME.find(r => r.rotacaoDeTonalidade)!;

  it('percorre as 12 tonalidades, sem repetir', () => {
    const r = rotinasDoTime(t).find(x => x.id === `time:${rot.id}`)!;
    const tonicas = (r.rotacao!.valores as { tonic: number }[]).map(v => v.tonic);
    expect(tonicas).toHaveLength(12);
    expect(new Set(tonicas).size).toBe(12);
  });

  it('avança à mão (decisão 38) — nunca empurra a pessoa para a tonalidade seguinte', () => {
    expect(rotinasDoTime(t).find(x => x.id === `time:${rot.id}`)!.rotacao!.avanco).toEqual({ kind: 'manual' });
  });

  // Rotação só vale se as etapas respeitarem o eixo rotacionado — senão a rotina avança para Sol e
  // todo exercício continua sorteando a tônica. Era o bug que a F2-3 existiu para corrigir.
  it('todas as etapas dela respeitam `key`', () => {
    for (const e of rot.etapas) {
      for (const x of e.instancias) {
        const it = itens[x.itemId]!;
        // `backing` é ambiente: a tela toca a harmonia da tonalidade da cascata e não declara `respeita`.
        if (it.kind === 'ambiente') continue;
        expect(it.respeita ?? [], `${rot.id} → ${x.itemId}`).toContain('key');
      }
    }
  });
});

describe('o formato que chega ao executor', () => {
  const rs = rotinasDoTime(t);

  it('ids são determinísticos e únicos — id novo a cada leitura quebraria quem adotou', () => {
    expect(rotinasDoTime(t).map(r => r.id)).toEqual(rs.map(r => r.id));
    const ids = [...rs.map(r => r.id), ...rs.flatMap(r => r.etapas.map(e => e.id))];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('vêm marcadas como do time: é o que faz adotar criar cópia (decisão 9)', () => {
    for (const r of rs) expect(r.doTime, r.id).toBe(true);
  });

  it('o nome e o "sobre" saem traduzidos, nos dois idiomas', () => {
    for (const r of ROTINAS_DO_TIME) {
      for (const loc of ['pt', 'en'] as const) {
        for (const k of [r.nome, r.sobre]) expect(translate(loc, k).trim(), `${loc}:${k}`).not.toBe('');
      }
    }
  });

  it('a guiada tem tempo em toda etapa; a livre, em nenhuma — somar tempo de rotina livre é mentira', () => {
    for (const r of rs) {
      const comTempo = r.etapas.filter(e => e.segundosSugeridos).length;
      expect(comTempo, r.id).toBe(r.modo === 'guiado' ? r.etapas.length : 0);
    }
  });

  it('a de bolso só tem itens que rodam sem instrumento', () => {
    const bolso = rs.find(r => r.id === 'time:de-bolso')!;
    for (const e of bolso.etapas) expect(itens[e.instancias[0].itemId]!.mobile, e.instancias[0].itemId).toBe(true);
  });

  it('rotinaDoTimePorId acha pelo id que vai na URL', () => {
    for (const r of rs) expect(rotinaDoTimePorId(r.id)?.id).toBe(r.id.replace('time:', ''));
    expect(rotinaDoTimePorId('time:inexistente')).toBeUndefined();
  });
});

describe('a publicação', () => {
  it('toda rotina do time declara o seu estado', () => {
    for (const r of ROTINAS_DO_TIME) expect(r.publicacao, r.id).toBeDefined();
  });

  // Decisão 51: o conteúdo musical de uma rotina do time é passo humano do Paulo. Enquanto ele não
  // revisou, ela é proposta — e proposta não aparece para quem usa.
  it('as duas que vivem de som seguem em rascunho — não dá para aprová-las sem ouvir', () => {
    for (const id of ['internalizar-tonalidade', 'aquecimento-ouvido']) {
      expect(estadoDe(ROTINAS_DO_TIME.find(r => r.id === id)?.publicacao), id).toBe('rascunho');
    }
  });

  // `publicado` afirma que uma pessoa revisou. Sem data e nome, a afirmação não se sustenta — é a
  // mesma regra que vale para item de catálogo.
  it('toda publicada tem a data da revisão (AAAA-MM-DD) e quem a fez', () => {
    for (const r of ROTINAS_DO_TIME) {
      if (r.publicacao.estado !== 'publicado') continue;
      expect(ehDataIso(r.publicacao.revisadoEm), `${r.id}: data`).toBe(true);
      expect(r.publicacao.por.trim(), `${r.id}: quem revisou`).not.toBe('');
    }
  });

  // O portão só vale se a lista que a tela mostra o respeitar. Sem isto, publicar seria só um rótulo.
  // Ligado de propósito: hoje o portão está desligado (decisão 104), e é o caso do beta que precisa
  // de guarda.
  it('com o portão ligado, rascunho não aparece fora do modo de revisão', () => {
    const naTela = (revisao: boolean) => ROTINAS_DO_TIME.filter(r => visivel(r.publicacao, revisao, true)).map(r => r.id);
    expect(naTela(false)).toEqual(['de-bolso', 'mapear-braco', 'leitura-diaria']);
    expect(naTela(true)).toHaveLength(ROTINAS_DO_TIME.length);
  });

  it('e hoje, com ele desligado, as cinco aparecem — é o que o Paulo pediu para testar', () => {
    expect(ROTINAS_DO_TIME.filter(r => visivel(r.publicacao, false)).map(r => r.id)).toHaveLength(5);
  });

  it('cada rascunho aparece em docs/revisao-pendente.md pelo id', () => {
    for (const r of ROTINAS_DO_TIME.filter(x => estadoDe(x.publicacao) === 'rascunho')) {
      expect(doc, `${r.id} está em rascunho mas não está no documento`).toContain(`\`${r.id}\``);
    }
  });
});

describe('cada etapa diz por que está ali', () => {
  // O `porque` não aparece na tela: existe para o Paulo revisar sem ter que reconstruir o raciocínio.
  it('nenhuma etapa fica sem justificativa', () => {
    for (const r of ROTINAS_DO_TIME) for (const e of r.etapas) expect(e.porque.trim(), r.id).not.toBe('');
  });
});
