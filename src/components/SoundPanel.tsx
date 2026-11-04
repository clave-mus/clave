// Som dos exercícios no Perfil: liga/desliga, volume e o timbre de cada instrumento. São os
// parâmetros globais de som da C1 (src/catalog/params.ts); quem escolhe ouve na hora como fica.
import type { Voice } from '../audio/engine';
import { playDemo } from '../audio/demo';
import { useContent } from '../data/localized';
import { useGlobalParams, VOLUME_RANGE } from '../catalog/params';
import { useT, type MessageKey } from '../i18n';
import { setParams, setState, useStore } from '../state/store';
import { Btn, Chip, SecTitle } from './ui';

const VOICES: Voice[] = ['piano', 'pad', 'violao', 'baixo', 'orgao'];

export default function SoundPanel() {
  const t = useT();
  const sound = useStore(s => s.sound);
  const params = useGlobalParams();
  const { INSTRUMENTS } = useContent();
  return (
    <section>
      <SecTitle>{t('profile.soundTitle')}</SecTitle>
      <div className="panel" style={{ display: 'grid', gap: 18 }}>
        <label className="switch"><input type="checkbox" id="som" checked={sound} onChange={e => setState(s => ({ ...s, sound: e.target.checked }))} />{t('profile.sound')}</label>
        <div className="row">
          <span className="eyebrow">{t('profile.volume')}</span>
          <input className="range" type="range" id="volume" style={{ maxWidth: 240 }} aria-label={t('profile.volume')}
            min={VOLUME_RANGE.min} max={VOLUME_RANGE.max} step={VOLUME_RANGE.step} value={params.volume}
            onChange={e => setParams({ volume: Number(e.target.value) })} />
          <span className="num">{Math.round(params.volume * 100)}%</span>
          <Btn small tone="ghost" onClick={() => playDemo(params.timbres.piano, params.volume)}>{t('profile.hear')}</Btn>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <span className="eyebrow">{t('profile.timbres')}</span>
          {INSTRUMENTS.map(i => (
            <div key={i.id} style={{ display: 'grid', gap: 6 }}>
              <div><b>{i.name}</b> <span className="muted" style={{ fontSize: 13 }}>· {t(`profile.timbreFor.${i.id}` as MessageKey)}</span></div>
              <div className="row">
                {VOICES.map(v => (
                  <Chip key={v} on={params.timbres[i.id] === v} onClick={() => { setParams({ timbres: { [i.id]: v } }); playDemo(v, params.volume); }}>
                    {t(`voices.${v}` as MessageKey)}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
