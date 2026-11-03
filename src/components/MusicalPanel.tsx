// Os controles musicais globais da cascata (F2-3, decisões 38 e 57).
//
// Eles existem porque o motor passou a ler `key`, `range`, `material` e `clef` de todo item — e
// **até aqui a pessoa não tinha como escolher.** O motor respondia a parâmetros que ninguém
// conseguia mexer, o que é metade de um recurso.
//
// A regra que atravessa o painel: **"livre" é o padrão, e é uma escolha, não ausência de escolha.**
// Quem não escolheu tonalidade quer variedade — não Dó maior em tudo.
import { setParams, useStore } from '../state/store';
import { useGlobalParams } from '../catalog/params';
import { keyName, type Clef } from '../theory/core';
import { Btn, Chip, SecTitle } from './ui';
import { useNaming, useT } from '../i18n';

/** As regiões, em MIDI. Nomeadas pelo que a pessoa ouve, não pelo número. */
const REGIOES: { id: string; lo: number; hi: number }[] = [
  { id: 'grave', lo: 36, hi: 60 },
  { id: 'media', lo: 48, hi: 72 },
  { id: 'aguda', lo: 60, hi: 84 },
  { id: 'toda', lo: 36, hi: 84 },
];

const MODOS = ['maior', 'menor'] as const;
const CLAVES: Clef[] = ['sol', 'fa'];

export default function MusicalPanel() {
  const t = useT();
  const naming = useNaming();
  const params = useGlobalParams();
  const stored = useStore(s => s.params);

  const regiaoAtual = REGIOES.find(r => r.lo === params.range.lo && r.hi === params.range.hi)?.id ?? null;

  return (
    <section>
      <SecTitle>{t('profile.musical')}</SecTitle>
      <div className="panel" style={{ display: 'grid', gap: 16 }}>
        <p className="muted" style={{ margin: 0 }}>{t('profile.musicalSub')}</p>

        <div style={{ display: 'grid', gap: 8 }}>
          <span className="eyebrow">{t('settings.keyLabel')}</span>
          <div className="row">
            <Chip on={params.key === null} onClick={() => setParams({ key: null })}>{t('profile.keyFree')}</Chip>
            {MODOS.map(mode => (
              <Chip key={mode} on={params.key?.mode === mode}
                onClick={() => setParams({ key: { tonic: params.key?.tonic ?? 0, mode } })}>
                {t(`theory.key${mode === 'maior' ? 'Major' : 'Minor'}`, { note: keyName(params.key?.tonic ?? 0, naming) })}
              </Chip>
            ))}
          </div>
          {params.key && (
            <div className="row" aria-label={t('settings.keyLabel')}>
              {Array.from({ length: 12 }, (_, pc) => (
                <Chip key={pc} on={params.key?.tonic === pc}
                  onClick={() => setParams({ key: { tonic: pc, mode: params.key?.mode ?? 'maior' } })}>
                  {keyName(pc, naming)}
                </Chip>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <span className="eyebrow">{t('profile.region')}</span>
          <div className="row">
            {REGIOES.map(r => (
              <Chip key={r.id} on={regiaoAtual === r.id} onClick={() => setParams({ range: { lo: r.lo, hi: r.hi } })}>
                {t(`profile.region_${r.id}` as 'profile.region_grave')}
              </Chip>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <span className="eyebrow">{t('profile.material')}</span>
          <div className="row">
            <Chip on={params.material === 'cromatico'} onClick={() => setParams({ material: 'cromatico' })}>{t('profile.materialChromatic')}</Chip>
            <Chip on={params.material === 'diatonico'} onClick={() => setParams({ material: 'diatonico' })}>{t('profile.materialDiatonic')}</Chip>
          </div>
          {/* `material: diatonico` sem tonalidade não restringe nada — dizer isso evita a pessoa
              achar que configurou algo que não configurou. */}
          {params.material === 'diatonico' && params.key === null && (
            <span className="muted">{t('profile.materialNeedsKey')}</span>
          )}
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <span className="eyebrow">{t('settings.clefs')}</span>
          <div className="row">
            {CLAVES.map(c => (
              <Chip key={c} on={params.clef === c} onClick={() => setParams({ clef: c })}>{t(c === 'sol' ? 'settings.clefSol' : 'settings.clefFa')}</Chip>
            ))}
          </div>
        </div>

        {Object.keys(stored).some(k => ['key', 'range', 'material', 'clef'].includes(k)) && (
          <div className="row">
            <Btn small tone="ghost"
              onClick={() => setParams({ key: null, range: { lo: 48, hi: 72 }, material: 'cromatico', clef: 'sol' })}>
              {t('player.resetDefaults')}
            </Btn>
          </div>
        )}
      </div>
    </section>
  );
}
