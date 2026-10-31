// Painel de conta no Perfil: sem conta (padrão) → pede data de nascimento uma vez → link
// mágico/Google/Apple → logado (com o estado da sincronização) → sair ou apagar conta. Tudo
// opcional: sem Supabase configurado, o painel nem aparece, e o app segue 100% local.
import { useState } from 'react';
import { checkBirthdate, deleteAccount, isSupabaseConfigured, rememberBirthdateForSignIn, signInWithEmail, signInWithProvider, signOut } from '../state/account';
import { useStore } from '../state/store';
import { useSyncStatus, type SyncStatus } from '../sync';
import { Btn, SecTitle } from './ui';
import { localeTag, useLocale, useT, type Translate } from '../i18n';

function syncLine(t: Translate, status: SyncStatus, tag: string): string | null {
  if (status.state === 'syncing') return t('account.syncing');
  if (status.state === 'offline') return t('account.syncOffline');
  if (status.state === 'error') return t('account.syncError');
  if (status.state === 'ok' && status.at) return t('account.synced', { time: new Date(status.at).toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' }) });
  return null;
}

type Step = 'idade' | 'bloqueado' | 'entrar' | 'enviado';

export default function AccountPanel() {
  const account = useStore(s => s.account);
  const t = useT();
  const locale = useLocale();
  const sync = useSyncStatus();
  const ageGroup = useStore(s => s.ageGroup);
  const [step, setStep] = useState<Step>(ageGroup ? 'entrar' : 'idade');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isSupabaseConfigured) return null;

  if (account) {
    return (
      <section>
        <SecTitle>{t('account.title')}</SecTitle>
        <div className="panel" style={{ display: 'grid', gap: 12 }}>
          <span>{t('account.connectedAs')} <strong>{account.email ?? account.userId}</strong>. {t('account.connectedNote')}</span>
          {syncLine(t, sync, localeTag(locale)) && <span className="eyebrow" role="status">{syncLine(t, sync, localeTag(locale))}</span>}
          <span style={{ color: 'var(--muted)' }}>{t('account.signOutNote')}</span>
          <div className="row">
            <Btn small tone="ghost" disabled={busy} onClick={async () => {
              setError(null);
              setBusy(true);
              try { await signOut(); } catch { setError(t('account.signOutFailed')); } finally { setBusy(false); }
            }}>{t('account.signOut')}</Btn>
            {!confirmDelete ? (
              <Btn small tone="ghost" onClick={() => setConfirmDelete(true)}>{t('account.delete')}</Btn>
            ) : (
              <div className="row panel" style={{ padding: 12, background: 'var(--ve)' }}>
                <span>{t('account.deleteWarn')}</span>
                <Btn small tone="ghost" onClick={() => deleteAccount().catch(e => setError(String(e.message ?? e)))}>{t('common.deleteAll')}</Btn>
                <Btn small tone="mu" onClick={() => setConfirmDelete(false)}>{t('common.cancel')}</Btn>
              </div>
            )}
          </div>
          {error && <span style={{ color: 'var(--ve)' }}>{error}</span>}
        </div>
      </section>
    );
  }

  const checkAge = () => {
    setError(null);
    if (!birthdate) return;
    const group = checkBirthdate(birthdate);
    if (group === 'under13') { setStep('bloqueado'); return; }
    rememberBirthdateForSignIn(birthdate);
    setStep('entrar');
  };

  const sendMagicLink = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithEmail(email);
      setStep('enviado');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const withProvider = async (provider: 'google' | 'apple') => {
    setError(null);
    setBusy(true);
    try {
      await signInWithProvider(provider);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <section>
      <SecTitle>{t('account.title')}</SecTitle>
      <div className="panel" style={{ display: 'grid', gap: 14, maxWidth: 420 }}>
        <span>{t('account.intro')}</span>

        {step === 'idade' && (
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="eyebrow">{t('account.birthdate')}</span>
            <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)}
              style={{ background: 'var(--bk-3)', border: 0, color: 'var(--cream)', padding: '10px 12px', font: 'inherit', fontSize: 17 }} />
            <Btn small onClick={checkAge} disabled={!birthdate}>{t('common.continue')}</Btn>
          </label>
        )}

        {step === 'bloqueado' && (
          <span>{t('account.blocked')}</span>
        )}

        {step === 'entrar' && (
          <>
            <div className="row">
              <Btn small onClick={() => withProvider('google')} disabled={busy}>{t('account.google')}</Btn>
              <Btn small onClick={() => withProvider('apple')} disabled={busy}>{t('account.apple')}</Btn>
            </div>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="eyebrow">{t('account.emailLabel')}</span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('account.emailPlaceholder')}
                style={{ background: 'var(--bk-3)', border: 0, color: 'var(--cream)', padding: '10px 12px', font: 'inherit', fontSize: 17 }} />
              <Btn small onClick={sendMagicLink} disabled={busy || !email}>{t('account.sendLink')}</Btn>
            </label>
          </>
        )}

        {step === 'enviado' && <span>{t('account.sent', { email })}</span>}

        {error && <span style={{ color: 'var(--ve)' }}>{error}</span>}
      </div>
    </section>
  );
}
