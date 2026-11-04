// Uma sessão é UMA entrada no histórico, regravada no lugar (decisão 92).
//
// O defeito que isto conserta: o registro só acontecia quando a tela desmontava, e fechar ou
// recarregar a aba no meio de vinte minutos de prática não desmonta nada. A correção é gravar também
// ao esconder a aba — o que só é seguro se gravar de novo ATUALIZAR em vez de duplicar. É isso que
// estes testes travam. (O disparo dos eventos em si só se confere no navegador.)
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_STATE, getState, registrarAtividade, setState } from './store';

beforeEach(() => { setState(() => ({ ...DEFAULT_STATE })); });

const base = { id: 'backing', title: 'Backing track', module: 'perception.harmonic' as const };

describe('registrarAtividade', () => {
  it('a primeira gravação cria a entrada', () => {
    registrarAtividade({ ...base, sessao: 'a', seconds: 60 });
    expect(getState().history).toHaveLength(1);
    expect(getState().history[0].seconds).toBe(60);
  });

  // A propriedade central: esconder a aba e depois sair NÃO pode contar a mesma prática duas vezes.
  it('gravar de novo a MESMA sessão atualiza a entrada, não duplica', () => {
    registrarAtividade({ ...base, sessao: 'a', seconds: 60 });
    registrarAtividade({ ...base, sessao: 'a', seconds: 180 });
    registrarAtividade({ ...base, sessao: 'a', seconds: 300 });
    expect(getState().history).toHaveLength(1);
    expect(getState().history[0].seconds).toBe(300);
  });

  it('mantém o horário da primeira gravação — a prática começou ali, não na última regravação', () => {
    registrarAtividade({ ...base, sessao: 'a', seconds: 60 });
    const at = getState().history[0].at;
    registrarAtividade({ ...base, sessao: 'a', seconds: 90 });
    expect(getState().history[0].at).toBe(at);
  });

  it('sessões diferentes são entradas diferentes, mesmo do mesmo item', () => {
    registrarAtividade({ ...base, sessao: 'a', seconds: 60 });
    registrarAtividade({ ...base, sessao: 'b', seconds: 70 });
    expect(getState().history.map(h => h.sessao).sort()).toEqual(['a', 'b']);
  });

  it('atualiza a entrada CERTA, sem mexer nas outras', () => {
    registrarAtividade({ ...base, sessao: 'a', seconds: 60 });
    registrarAtividade({ ...base, id: 'ritmo', sessao: 'b', seconds: 70 });
    registrarAtividade({ ...base, sessao: 'a', seconds: 999 });
    const por = Object.fromEntries(getState().history.map(h => [h.sessao, h.seconds]));
    expect(por).toEqual({ a: 999, b: 70 });
  });

  it('a regravação leva o snapshot do FIM — mudar a tonalidade no meio não deixa a antiga', () => {
    registrarAtividade({ ...base, sessao: 'a', seconds: 60, snapshot: { params: { key: { tonic: 0, mode: 'maior' } } } });
    registrarAtividade({ ...base, sessao: 'a', seconds: 120, snapshot: { params: { key: { tonic: 7, mode: 'maior' } } } });
    expect(getState().history[0].snapshot?.params?.key).toEqual({ tonic: 7, mode: 'maior' });
  });

  it('menos de 5 segundos, sem respostas, não vira entrada — é só passagem', () => {
    registrarAtividade({ ...base, sessao: 'a', seconds: 3 });
    expect(getState().history).toHaveLength(0);
  });

  it('mas com respostas, vale mesmo curto: foi prática', () => {
    registrarAtividade({ ...base, sessao: 'a', seconds: 3, total: 4, correct: 3 });
    expect(getState().history).toHaveLength(1);
  });

  it('a mais recente fica no topo', () => {
    registrarAtividade({ ...base, sessao: 'a', seconds: 60 });
    registrarAtividade({ ...base, sessao: 'b', seconds: 60 });
    expect(getState().history[0].sessao).toBe('b');
  });

  it('o histórico continua limitado a 500 entradas', () => {
    for (let i = 0; i < 510; i++) registrarAtividade({ ...base, sessao: `s${i}`, seconds: 10 });
    expect(getState().history).toHaveLength(500);
    // as mais antigas caíram; a mais recente está lá
    expect(getState().history[0].sessao).toBe('s509');
  });

  it('atividade antiga, sem `sessao`, convive com as novas', () => {
    setState(s => ({ ...s, history: [{ at: 1, id: 'x', title: 'X', module: 'theory', seconds: 30 }] }));
    registrarAtividade({ ...base, sessao: 'a', seconds: 60 });
    expect(getState().history).toHaveLength(2);
  });
});
