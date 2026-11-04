import { describe, expect, it } from 'vitest';
import { migrateSaved, settingsFundidos } from './migrate';

// O retorno é um objeto solto de propósito (estado de versões antigas); o teste olha só os campos.
const migrate = (raw: unknown) => migrateSaved(raw) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

describe('estado salvo por versões anteriores', () => {
  const old = {
    v: 1,
    profile: { name: 'Ana', kind: 'hobby', instrument: 'baixo', goals: ['jazz'], levels: { ouvido: 2 }, onboarded: true },
    stats: { 'pauta-nota': { attempts: 10, correct: 7, bestStreak: 4, last: 1 } },
    badges: { sequencia: 123 },
    plan: { fifths: 2, done: [], startedAt: 1 },
    history: [
      { at: 5, id: 'braco-nota', title: 'Nota no braço', area: 'mapeamento', seconds: 60, correct: 4, total: 5 },
      { at: 6, id: 'ritmo', title: 'Leitura rítmica', area: 'ritmo', seconds: 120 },
    ],
  };

  it('tira o que o app não conhece mais', () => {
    const s = migrate(old);
    expect(s.badges).toBeUndefined();
    expect(s.plan).toBeUndefined();
    // "jazz" era um dos sete objetivos de antes da decisão 20 e **não vira porta**: mapeá-lo
    // registraria como escolha da pessoa algo que ela não escolheu. Ver `migrate.ts`.
    expect(s.profile).toEqual({ name: 'Ana', instrument: 'baixo', goals: [], onboarded: true });
    // `pauta-nota` virou `que-nota-e-essa` na fusão por superfície (decisão 16)
    expect(s.stats['que-nota-e-essa']).toEqual({ attempts: 10, correct: 7, last: 1 });
  });

  it('mantém os objetivos que ainda existem, e descarta só os que saíram', () => {
    const s = migrate({ ...old, profile: { ...old.profile, goals: ['jazz', 'ouvido', 'leitura', 'repertorio'] } });
    expect(s.profile.goals).toEqual(['ouvido', 'leitura']);
  });

  it('troca a área do histórico pelo módulo, sem perder o resto', () => {
    const h = (migrate(old)).history;
    expect(h[0]).toEqual({ at: 5, id: 'que-nota-e-essa', title: 'Nota no braço', module: 'theory', seconds: 60, correct: 4, total: 5 });
    expect(h[1].module).toBe('perception.rhythmic');
    expect(h[0].area).toBeUndefined();
  });

  it('não mexe em estado já migrado e aguenta lixo', () => {
    const fresh = { v: 1, history: [{ at: 1, id: 'x', title: 'x', module: 'technique', seconds: 9 }] };
    expect(migrateSaved(fresh)).toEqual(fresh);
    expect(migrateSaved(null)).toEqual({});
    expect(migrateSaved('oi')).toEqual({});
    expect(migrate({ history: [{ area: 'inexistente', at: 1 }, 7] }).history).toEqual([{ at: 1, module: 'theory' }]);
  });
});

describe('as fusões por superfície (decisão 16)', () => {
  it('o id antigo vira o novo no histórico, e o título antigo FICA', () => {
    // O título gravado é o que a pessoa viu naquele dia. Reescrevê-lo seria falsear o histórico — a
    // tela já prefere o título atual quando o item existe (ver Progresso).
    const s = migrate({ history: [{ at: 1, id: 'teclado-acorde', title: 'Acorde no teclado', module: 'theory', seconds: 30 }] });
    expect(s.history[0].id).toBe('que-acorde-e-esse');
    expect(s.history[0].title).toBe('Acorde no teclado');
  });

  it('as estatísticas de dois itens que viraram um são SOMADAS', () => {
    // Eram a mesma pergunta em superfícies diferentes; separá-las agora perderia a prática de uma.
    const s = migrate({ stats: {
      'pauta-nota': { attempts: 10, correct: 6, last: 100 },
      'braco-nota': { attempts: 4, correct: 3, last: 200 },
      'teclado-nota': { attempts: 1, correct: 1, last: 50 },
    } });
    expect(s.stats['que-nota-e-essa']).toEqual({ attempts: 15, correct: 10, last: 200 });
    expect(s.stats['pauta-nota']).toBeUndefined();
  });

  it('item que não foi fundido passa intacto', () => {
    const s = migrate({ stats: { 'quiz-teoria': { attempts: 3, correct: 2, last: 7 } } });
    expect(s.stats['quiz-teoria']).toEqual({ attempts: 3, correct: 2, last: 7 });
  });

  it('`settingsFundidos` troca o id e põe a superfície, tirando o `onde` que saiu', () => {
    expect(settingsFundidos('braco-ache', { instrumento: 'auto', casas: '0-5' }))
      .toEqual({ id: 'ache-a-nota', settings: { instrumento: 'auto', casas: '0-5', superficie: 'braco' } });
    // `acorde-visual` guardava a superfície na configuração `onde`, não no id
    expect(settingsFundidos('acorde-visual', { onde: 'piano' })).toEqual({ id: 'que-acorde-e-esse', settings: { superficie: 'teclado' } });
    expect(settingsFundidos('acorde-visual', { onde: 'violao', formas: 'pestana' }))
      .toEqual({ id: 'que-acorde-e-esse', settings: { formas: 'pestana', superficie: 'braco' } });
  });

  it('e não mexe em quem não foi fundido', () => {
    expect(settingsFundidos('quiz-teoria', { temas: ['graus'] })).toEqual({ id: 'quiz-teoria', settings: { temas: ['graus'] } });
  });
});
