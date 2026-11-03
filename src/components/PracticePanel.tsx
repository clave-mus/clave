// Tonalidade, região e material de UM exercício (decisão 87).
//
// Moravam no Perfil, e esse era o erro: o perfil é quem a pessoa é, e isto é o que ela está
// praticando. Trocam toda semana — e por morar fora do exercício ficavam fora de tudo que se salva
// numa rotina.
//
// **Só oferece o que o item respeita** (`respeita`, conferido por teste). Um controle que o item
// ignora seria prometer o que não acontece.
//
// "Livre" é o padrão, e é uma escolha, não ausência de escolha: quem não fixa tonalidade quer
// variedade, não Dó maior em tudo.
import type { GlobalParams, ParametroDePratica, ParametrosDePratica } from '../catalog/params';
import { REGIOES, regiaoDe } from '../catalog/regioes';
import { keyName } from '../theory/core';
import { Chip } from './ui';
import { useNaming, useT } from '../i18n';

const MODOS = ['maior', 'menor'] as const;

interface Props {
  respeita: readonly ParametroDePratica[];
  /** Os valores em vigor, já resolvidos. */
  params: GlobalParams;
  onChange: (patch: ParametrosDePratica) => void;
}

export default function PracticePanel({ respeita, params, onChange }: Props) {
  const t = useT();
  const naming = useNaming();
  // o material só faz sentido ao lado de uma tonalidade, e a tonalidade pode vir só por causa dele
  const mostraTonalidade = respeita.includes('key') || respeita.includes('material');
  if (!mostraTonalidade && !respeita.includes('range')) return null;

  return (
    <div className="field" style={{ display: 'grid', gap: 14 }}>
      <span className="muted">{t('practice.sub')}</span>

      {mostraTonalidade && (
        <div style={{ display: 'grid', gap: 8 }}>
          <span className="eyebrow">{t('practice.key')}</span>
          <div className="row">
            <Chip on={params.key === null} onClick={() => onChange({ key: null })}>{t('practice.keyFree')}</Chip>
            {MODOS.map(mode => (
              <Chip key={mode} on={params.key?.mode === mode}
                onClick={() => onChange({ key: { tonic: params.key?.tonic ?? 0, mode } })}>
                {t(mode === 'maior' ? 'theory.keyMajor' : 'theory.keyMinor', { note: keyName(params.key?.tonic ?? 0, naming) })}
              </Chip>
            ))}
          </div>
          {params.key && (
            <div className="row" aria-label={t('practice.key')}>
              {Array.from({ length: 12 }, (_, pc) => (
                <Chip key={pc} on={params.key?.tonic === pc}
                  onClick={() => onChange({ key: { tonic: pc, mode: params.key?.mode ?? 'maior' } })}>
                  {keyName(pc, naming)}
                </Chip>
              ))}
            </div>
          )}
        </div>
      )}

      {respeita.includes('range') && (
        <div style={{ display: 'grid', gap: 8 }}>
          <span className="eyebrow">{t('practice.region')}</span>
          <div className="row">
            {REGIOES.map(r => (
              <Chip key={r.id} on={regiaoDe(params.range) === r.id} onClick={() => onChange({ range: { lo: r.lo, hi: r.hi } })}>
                {t(`practice.region_${r.id}`)}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {respeita.includes('material') && (
        <div style={{ display: 'grid', gap: 8 }}>
          <span className="eyebrow">{t('practice.material')}</span>
          <div className="row">
            <Chip on={params.material === 'cromatico'} onClick={() => onChange({ material: 'cromatico' })}>{t('practice.materialChromatic')}</Chip>
            <Chip on={params.material === 'diatonico'} onClick={() => onChange({ material: 'diatonico' })}>{t('practice.materialDiatonic')}</Chip>
          </div>
          {/* `diatonico` sem tonalidade não restringe nada — dizer evita a pessoa achar que configurou
              algo que não configurou. */}
          {params.material === 'diatonico' && params.key === null && <span className="muted">{t('practice.materialNeedsKey')}</span>}
        </div>
      )}

    </div>
  );
}
