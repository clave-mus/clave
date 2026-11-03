// Histórico · mora dentro do Perfil, em /perfil/historico (decisão 11).
//
// Progresso não é aba e não é central: o Clave é plataforma de estudo séria, não jogo. Quem quer
// ver, vê; quem não quer, nunca esbarra. A medida principal é TEMPO ESTUDADO — honesta justamente
// por ser modesta: não afirma domínio, não compara, não premia.
//
// Decisão 14: atividade e evidência de aprendizagem nunca se misturam, e toda proporção aparece
// com a quantidade de tentativas ao lado.
// Fora daqui, por decisão: sequência de dias, medalhas, níveis, XP e comparação entre pessoas.
import { useContent } from '../data/localized';
import { minutesByModule, useStore } from '../state/store';
import { fmtMin, PageHead, SecTitle } from '../components/ui';
import { itemText, localeTag, useLocale, useT } from '../i18n';
import { itemById } from '../catalog';

export default function Progresso() {
  const stats = useStore(s => s.stats);
  const history = useStore(s => s.history);
  const t = useT();
  const { MODULES, moduleById } = useContent();
  const lang = localeTag(useLocale());

  const byModule = minutesByModule(history, 30);
  const totalMin = Object.values(byModule).reduce((a, b) => a + b, 0);
  const maxMin = Math.max(10, ...Object.values(byModule));
  const answers = Object.values(stats).reduce((a, s) => a + s.attempts, 0);
  const right = Object.values(stats).reduce((a, s) => a + s.correct, 0);

  return (
    <div>
      <PageHead tag={t('progress.tag')} title={t('progress.title')} sub={t('progress.sub')} />

      <section className="sec">
        <SecTitle>{t('progress.timeTitle')}</SecTitle>
        <p className="muted note-line">{t('progress.timeNote')}</p>
        <div className="panel stack">
          <div className="big-stat">
            <b className="num">{fmtMin(totalMin * 60)}</b>
            <span className="eyebrow">{t('progress.minutes30')}</span>
          </div>
          <div className="bars">
            {MODULES.map(m => (
              <div key={m.id} className="bar-row">
                <span>{m.name}</span>
                <div className="progressbar"><i style={{ width: `${((byModule[m.id] ?? 0) / maxMin) * 100}%`, background: m.color }} /></div>
                <span className="num muted">{fmtMin((byModule[m.id] ?? 0) * 60)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <SecTitle>{t('progress.evidenceTitle')}</SecTitle>
        <p className="muted note-line">{t('progress.evidenceNote')}</p>
        <div className="panel">
          {answers === 0 ? (
            <p className="muted">{t('progress.evidenceEmpty')}</p>
          ) : (
            <div className="big-stat">
              <b className="num">{Math.round((right / answers) * 100)}%</b>
              <span className="eyebrow">{t('progress.outOf', { right: String(right), total: String(answers) })}</span>
            </div>
          )}
        </div>
      </section>

      <section className="sec">
        <SecTitle>{t('progress.history')}</SecTitle>
        {history.length === 0 ? (
          <div className="empty">
            <h3>{t('progress.emptyTitle')}</h3>
            <p className="muted">{t('progress.emptyText')}</p>
          </div>
        ) : (
          <div className="panel list">
            {history.slice(0, 40).map((h, i) => (
              <div key={i} className="list-row">
                <div style={{ minWidth: 0 }}>
                  <b>{itemById[h.id] ? itemText(t, h.id, 'title') : h.title}</b>
                  <span className="muted"> · {moduleById[h.module]?.name}</span>
                </div>
                <span className="num muted">{h.total ? `${h.correct}/${h.total}` : fmtMin(h.seconds)}</span>
                <span className="num muted">{new Date(h.at).toLocaleString(lang, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
