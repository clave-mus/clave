import { useState } from 'react';
import type { GoalId } from '../data/modules';
import { useContent } from '../data/localized';
import { setLocale, setState, updateProfile, useStore } from '../state/store';
import { resetProgress } from '../sync';
import { detectLocale, LOCALES, useLocale, useT } from '../i18n';
import { Art, Btn, Chip, PageHead, SecTitle } from '../components/ui';
import AccountPanel from '../components/AccountPanel';
import SoundPanel from '../components/SoundPanel';


export default function Perfil() {
  const profile = useStore(s => s.profile);
  const naming = useStore(s => s.naming);
  const locale = useStore(s => s.locale);
  const t = useT();
  const { GOALS, INSTRUMENTS } = useContent();
  const detected = LOCALES.find(l => l.id === detectLocale())!.name;
  const autoNames = useLocale() === 'pt' ? 'Dó Ré Mi' : 'C D E';
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const account = useStore(s => s.account);
  const toggleGoal = (id: GoalId) => updateProfile({ goals: profile.goals.includes(id) ? profile.goals.filter(g => g !== id) : [...profile.goals, id] });

  return (
    <div>
      <PageHead tag={t('nav.profile')} title={profile.name || t('profile.titleFallback')} sub={t('profile.sub')} aside={<Art name="clave-sentado" style={{ width: 120 }} />} />

      <div style={{ display: 'grid', gap: 36 }}>
        <section>
          <SecTitle>{t('profile.about')}</SecTitle>
          <div className="panel" style={{ display: 'grid', gap: 16 }}>
            <label style={{ display: 'grid', gap: 6, maxWidth: 360 }}>
              <span className="eyebrow">{t('common.nameLabel')}</span>
              <input id="nome" value={profile.name} onChange={e => updateProfile({ name: e.target.value })} placeholder={t('common.namePlaceholder')}
                style={{ background: 'var(--bk-3)', border: 0, color: 'var(--cream)', padding: '10px 12px', font: 'inherit', fontSize: 17 }} />
            </label>
            <div className="row"><span className="eyebrow">{t('common.instrument')}</span>{INSTRUMENTS.map(i => <Chip key={i.id} on={profile.instrument === i.id} onClick={() => updateProfile({ instrument: i.id })}>{i.name}</Chip>)}</div>
          </div>
        </section>

        <section>
          <SecTitle>{t('profile.goals')}</SecTitle>
          <div className="row">{GOALS.map(g => <Chip key={g.id} on={profile.goals.includes(g.id)} onClick={() => toggleGoal(g.id)}>{g.name}</Chip>)}</div>
        </section>

        <section>
          <SecTitle>{t('profile.preferences')}</SecTitle>
          <div className="panel" style={{ display: 'grid', gap: 14 }}>
            <div className="row"><span className="eyebrow">{t('profile.language')}</span>
              <Chip on={locale === null} onClick={() => setLocale(null)}>{t('profile.languageAuto', { language: detected })}</Chip>
              {LOCALES.map(l => <Chip key={l.id} on={locale === l.id} onClick={() => setLocale(l.id)}><span lang={l.id}>{l.name}</span></Chip>)}
            </div>
            <div className="row"><span className="eyebrow">{t('profile.noteNames')}</span>
              <Chip on={naming === null} onClick={() => setState(s => ({ ...s, naming: null }))}>{t('profile.noteNamesAuto', { names: autoNames })}</Chip>
              <Chip on={naming === 'pt'} onClick={() => setState(s => ({ ...s, naming: 'pt' }))}>Dó Ré Mi</Chip>
              <Chip on={naming === 'en'} onClick={() => setState(s => ({ ...s, naming: 'en' }))}>C D E</Chip>
            </div>
          </div>
        </section>

        <SoundPanel />

        <AccountPanel />

        <section>
          <SecTitle>{t('profile.data')}</SecTitle>
          <div className="row">
            <Btn tone="ghost" small to="/comecar">{t('profile.redoOnboarding')}</Btn>
            {!confirmReset ? <Btn tone="ghost" small onClick={() => setConfirmReset(true)}>{t('profile.resetProgress')}</Btn> : (
              <div className="row panel" style={{ padding: 12, background: 'var(--ve)' }}>
                <span>{t(account ? 'profile.resetWarnAccount' : 'profile.resetWarn')}</span>
                <Btn small tone="ghost" onClick={() => {
                  setResetError(null);
                  resetProgress().then(() => setConfirmReset(false), () => setResetError(t('profile.resetNeedsInternet')));
                }}>{t('common.deleteAll')}</Btn>
                <Btn small tone="mu" onClick={() => setConfirmReset(false)}>{t('common.cancel')}</Btn>
              </div>
            )}
          </div>
          {resetError && <span style={{ color: 'var(--ve)' }}>{resetError}</span>}
        </section>
      </div>
    </div>
  );
}
