// Leitura de estado salvo por versões anteriores. A F1-01b trocou as áreas pelos módulos e tirou
// perfil (kind), níveis, medalhas, maior sequência e plano de tonalidade; quem já tinha dados no
// navegador não pode quebrar nem carregar campo que o app não conhece mais.
import type { ModuleId } from '../catalog/taxonomy';

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

/** Tira do estado salvo os campos que saíram e converte `area` em `module` no histórico. */
export function migrateSaved(raw: unknown): Obj {
  if (!isObj(raw)) return {};
  const { badges: _badges, plan: _plan, ...rest } = raw;
  void _badges; void _plan;
  const out: Obj = { ...rest };
  if (isObj(out.profile)) {
    const { kind: _kind, levels: _levels, ...profile } = out.profile;
    void _kind; void _levels;
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
      return { ...h, module };
    });
  }
  return out;
}
