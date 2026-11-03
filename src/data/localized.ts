// Junta a estrutura do conteúdo (src/data, src/state) com os textos do idioma (src/i18n/content.*.ts).
// As telas usam useContent() e recebem módulos, aulas, trilhas e gêneros já traduzidos.
import { useLocale, type Locale } from '../i18n';
import enContent from '../i18n/content.en';
import ptContent from '../i18n/content.pt';
import type { ModuleId } from '../catalog/taxonomy';
import { GENRES, LESSONS, ROADMAPS, type Genre, type Lesson, type Roadmap } from './content';
import { GOALS, INSTRUMENTS, MODULE_LIST, type ModuleBase } from './modules';

/** Módulo de habilidade já com nome e resumo no idioma. */
export interface Module extends ModuleBase {
  name: string;
  short: string;
}

export const CONTENT_TEXT = { pt: ptContent, en: enContent };

function build(locale: Locale) {
  const tx = CONTENT_TEXT[locale];
  const modules: Module[] = MODULE_LIST.map(m => ({ ...m, ...tx.modules[m.id] }));
  const lessons: Lesson[] = LESSONS.map(l => ({ ...l, ...tx.lessons[l.id as keyof typeof tx.lessons] }));
  const roadmaps: Roadmap[] = ROADMAPS.map(({ lessons: ids, ...r }) => {
    const rt = tx.roadmaps[r.id as keyof typeof tx.roadmaps];
    const notes = rt.notes as Record<string, string>;
    return { ...r, title: rt.title, sub: rt.sub, steps: ids.map(lesson => ({ lesson, note: notes[lesson] })) };
  });
  const genres: Genre[] = GENRES.map(g => {
    const gt = tx.genres[g.id as keyof typeof tx.genres];
    const sides = gt.sides as Record<string, string>;
    const tracks = gt.tracks as Record<string, string>;
    return {
      ...g, name: gt.name, sub: gt.sub, desc: gt.desc,
      sides: g.sides.map(side => ({ side: sides[side.side], tracks: side.tracks.map(tr => ({ ...tr, title: tracks[tr.id] })) })),
    };
  });
  return {
    MODULES: modules,
    moduleById: Object.fromEntries(modules.map(m => [m.id, m])) as Record<ModuleId, Module>,
    INSTRUMENTS: INSTRUMENTS.map(i => ({ ...i, name: tx.instruments[i.id] })),
    GOALS: GOALS.map(g => ({ ...g, name: tx.goals[g.id] })),
    LESSONS: lessons,
    lessonById: Object.fromEntries(lessons.map(l => [l.id, l])) as Record<string, Lesson>,
    ROADMAPS: roadmaps,
    GENRES: genres,
    genreById: Object.fromEntries(genres.map(g => [g.id, g])) as Record<string, Genre>,
  };
}
export type Content = ReturnType<typeof build>;

const cache: Partial<Record<Locale, Content>> = {};
/** Conteúdo no idioma pedido (montado uma vez por idioma). */
export function contentFor(locale: Locale): Content {
  return (cache[locale] ??= build(locale));
}
export function useContent(): Content {
  return contentFor(useLocale());
}
