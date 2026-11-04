// Primeira vez: duas perguntas rápidas — o que você toca e o que quer conseguir.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContent } from '../data/localized';
import { updateProfile, useStore } from '../state/store';
import { Btn, Chip, Field, Tag } from '../components/ui';
import { useT } from '../i18n';

export default function Onboarding() {
  const profile = useStore(s => s.profile);
  const [step, setStep] = useState(0);
  const nav = useNavigate();
  const t = useT();
  const { PORTAS, INSTRUMENTS } = useContent();
  const finish = () => { updateProfile({ onboarded: true }); nav('/'); };
  const steps = [
    {
      title: t('onboarding.whatPlay'),
      body: (
        <div style={{ display: 'grid', gap: 18 }}>
          <label style={{ display: 'grid', gap: 6, maxWidth: 360 }}>
            <span className="eyebrow">{t('common.nameLabel')}</span>
            <input id="ob-nome" value={profile.name} onChange={e => updateProfile({ name: e.target.value })} placeholder={t('common.namePlaceholder')} autoFocus
              style={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)', color: 'var(--ink)', padding: '12px 14px', font: 'inherit', fontSize: 17 }} />
          </label>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
            {INSTRUMENTS.map(i => (
              <button key={i.id} type="button" onClick={() => updateProfile({ instrument: i.id })} aria-pressed={profile.instrument === i.id}
                className="panel" style={{ cursor: 'pointer', padding: 16, display: 'grid', gap: 10, justifyItems: 'center', borderColor: profile.instrument === i.id ? 'var(--accent)' : 'var(--rule)', borderWidth: profile.instrument === i.id ? 2 : 1, color: 'var(--ink)' }}>
                <Field seed={i.id} className="field-square" style={{ width: 64 }} />
                <b>{i.name}</b>
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: t('onboarding.goals'),
      body: (
        <div style={{ display: 'grid', gap: 12 }}>
          <p className="muted">{t('onboarding.pickMany')}</p>
          {/* A entrada do nivelamento não é um objetivo que se marque: fica fora desta lista. */}
          <div className="row">{PORTAS.filter(p => !p.diagnostico).map(p => (
            <Chip key={p.id} title={p.apoio} on={profile.goals.includes(p.id)}
              onClick={() => updateProfile({ goals: profile.goals.includes(p.id) ? profile.goals.filter(x => x !== p.id) : [...profile.goals, p.id] })}>{p.name}</Chip>
          ))}</div>
        </div>
      ),
    },
  ];
  const s = steps[step];
  return (
    <div className="shell">
      <div className="rule3" />
      <main className="page" style={{ maxWidth: 1000, display: 'grid', gap: 28 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <Tag>{t('onboarding.step', { i: step + 1, n: steps.length })}</Tag>
          <button type="button" onClick={finish} style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer' }}>{t('onboarding.skip')}</button>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', alignItems: 'start', gap: 32 }}>
          <div style={{ display: 'grid', gap: 20 }}>
            <h1 style={{ fontSize: 'clamp(46px, 7vw, 88px)' }}>{s.title}</h1>
            {s.body}
          </div>
          <Field seed={s.title} className="field-square" style={{ width: '100%', maxWidth: 320, justifySelf: 'center' }} />
        </div>
        <div className="row">
          {step > 0 && <Btn tone="ghost" onClick={() => setStep(step - 1)}>{t('common.back')}</Btn>}
          {step < steps.length - 1 ? <Btn onClick={() => setStep(step + 1)}>{t('common.continue')}</Btn> : <Btn tone="mu" onClick={finish}>{t('onboarding.finish')}</Btn>}
        </div>
      </main>
    </div>
  );
}
