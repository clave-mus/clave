// Leitura de estado salvo por versões anteriores. A F1-01b trocou as áreas pelos módulos e tirou
// perfil (kind), níveis, medalhas, maior sequência e plano de tonalidade; quem já tinha dados no
// navegador não pode quebrar nem carregar campo que o app não conhece mais.
import type { ModuleId } from '../catalog/taxonomy';
import { PORTA_IDS } from '../catalog/portas';

/** Módulo mais próximo de cada área antiga. É aproximado (ex.: "ouvido" inclui acordes, que hoje
 *  são Percepção harmônica): serve ao resumo dos últimos 30 dias, não a diagnóstico. */
const AREA_TO_MODULE: Record<string, ModuleId> = {
  ouvido: 'perception.melodic',
  tecnica: 'technique',
  mapeamento: 'theory',
  harmonia: 'theory',
  ritmo: 'perception.rhythmic',
  leitura: 'theory',
};
const MODULE_IDS: string[] = ['theory', 'technique', 'perception.melodic', 'perception.harmonic', 'perception.rhythmic'];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/**
 * As fusões por superfície (decisão 16): id antigo → id novo **e a superfície que ele era**.
 *
 * Sem isto, rotina, preset e tentativa de quem já usava o app apontariam para item inexistente — e a
 * etapa apareceria como "exercício que não existe mais" no executor. A superfície é a metade que não
 * pode ser esquecida: migrar `braco-nota` para `que-nota-e-essa` sem ela jogaria a pessoa na pauta.
 */
const FUNDIDOS: Record<string, { id: string; superficie: string }> = {
  'pauta-nota': { id: 'que-nota-e-essa', superficie: 'pauta' },
  'teclado-nota': { id: 'que-nota-e-essa', superficie: 'teclado' },
  'braco-nota': { id: 'que-nota-e-essa', superficie: 'braco' },
  'pauta-construir': { id: 'ache-a-nota', superficie: 'pauta' },
  'teclado-tecla': { id: 'ache-a-nota', superficie: 'teclado' },
  'braco-ache': { id: 'ache-a-nota', superficie: 'braco' },
  'pauta-intervalo': { id: 'que-intervalo-e-esse', superficie: 'pauta' },
  'braco-intervalo': { id: 'que-intervalo-e-esse', superficie: 'braco' },
  'pauta-acorde': { id: 'que-acorde-e-esse', superficie: 'pauta' },
  'teclado-acorde': { id: 'que-acorde-e-esse', superficie: 'teclado' },
  // `acorde-visual` tinha a superfície na configuração `onde` (violão ou piano), não no id.
  'acorde-visual': { id: 'que-acorde-e-esse', superficie: 'braco' },
};

/** O id novo de um item, se ele foi fundido. */
export const idFundido = (id: string) => FUNDIDOS[id]?.id ?? id;

/** A configuração de uma instância migrada: a superfície entra, e `onde` sai. */
export function settingsFundidos(id: string, settings: Obj): { id: string; settings: Obj } {
  const f = FUNDIDOS[id];
  if (!f) return { id, settings };
  const { onde, ...resto } = settings;
  // `acorde-visual` com `onde: 'piano'` era o teclado, não o braço
  const superficie = id === 'acorde-visual' && onde === 'piano' ? 'teclado' : f.superficie;
  return { id: f.id, settings: { ...resto, superficie } };
}

/** Tira do estado salvo os campos que saíram e converte `area` em `module` no histórico. */
export function migrateSaved(raw: unknown): Obj {
  if (!isObj(raw)) return {};
  // `arsenal` saiu (decisão 88): item guardado sem configuração é uma rotina de uma etapa.
  const { badges: _badges, plan: _plan, arsenal: _arsenal, ...rest } = raw;
  void _badges; void _plan; void _arsenal;
  const out: Obj = { ...rest };

  // Tonalidade, região, material, clave e tempo SAÍRAM do perfil (decisão 87). Se ficassem em
  // `params`, a tonalidade antiga continuaria valendo em silêncio, vinda de uma camada que não existe
  // mais — o contrário do que a decisão quer.
  if (isObj(out.params)) {
    const { key: _k, range: _r, material: _m, clef: _c, tempo: _t, ...perfil } = out.params;
    void _k; void _r; void _m; void _c; void _t;
    out.params = perfil;
  }
  if (isObj(out.profile)) {
    const { kind: _kind, levels: _levels, ...profile } = out.profile;
    void _kind; void _levels;
    // Os sete objetivos antigos saíram com a decisão 20 (as oito portas). **Não são mapeados para
    // portas**: "jazz" e "repertorio" não correspondem a porta nenhuma, e inventar a correspondência
    // seria registrar como escolha da pessoa algo que ela não escolheu. Quem tinha objetivo salvo
    // reescolhe no Perfil, e a lista nova está lá.
    if (Array.isArray(profile.goals)) {
      profile.goals = profile.goals.filter(g => typeof g === 'string' && PORTA_IDS.includes(g as never));
    }
    out.profile = profile;
  }
  if (isObj(out.stats)) {
    out.stats = Object.fromEntries(Object.entries(out.stats).map(([id, st]) => {
      if (!isObj(st)) return [id, st];
      const { bestStreak: _best, ...stat } = st;
      void _best;
      return [id, stat];
    }));
  }
  if (Array.isArray(out.history)) {
    out.history = out.history.filter(isObj).map(({ area, ...h }) => {
      const module = typeof h.module === 'string' && MODULE_IDS.includes(h.module) ? h.module : AREA_TO_MODULE[String(area)] ?? 'theory';
      // o id fundido entra; o snapshot NÃO é remexido — ele é o registro do que aconteceu naquele dia,
      // e reescrever a configuração de uma prática passada seria falsear o histórico
      return { ...h, module, ...(typeof h.id === 'string' ? { id: idFundido(h.id) } : {}) };
    });
  }

  // As estatísticas por item **somam** quando dois itens antigos viram um: eram a mesma pergunta em
  // superfícies diferentes, e separá-las agora seria perder a prática de uma delas.
  if (isObj(out.stats)) {
    const somadas: Obj = {};
    for (const [id, st] of Object.entries(out.stats)) {
      if (!isObj(st)) continue;
      const novo = idFundido(id);
      const antes = isObj(somadas[novo]) ? (somadas[novo] as Obj) : null;
      somadas[novo] = antes
        ? {
          attempts: num(antes.attempts) + num(st.attempts),
          correct: num(antes.correct) + num(st.correct),
          last: Math.max(num(antes.last), num(st.last)),
        }
        : st;
    }
    out.stats = somadas;
  }
  return out;
}
