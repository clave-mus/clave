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
import { keyName, mod, noteNameOct } from '../theory/core';
import { ROOTS } from '../catalog/helpers';
import { Chip } from './ui';
import { useNaming, useT } from '../i18n';

const MODOS = ['maior', 'menor'] as const;
/** As alturas oferecidas nos dois seletores: Dó1 a Dó7, que cobre o que o app toca. */
const ALTURAS = Array.from({ length: 73 }, (_, i) => 24 + i);

interface Props {
  respeita: readonly ParametroDePratica[];
  /** O exercício está respondendo num braço? Então a região em MIDI não se aplica (ver abaixo). */
  instrumentoDeBraco?: boolean;
  /** Os valores em vigor, já resolvidos. */
  params: GlobalParams;
  onChange: (patch: ParametrosDePratica) => void;
}

export default function PracticePanel({ respeita, params, onChange, instrumentoDeBraco }: Props) {
  const t = useT();
  const naming = useNaming();
  // o material só faz sentido ao lado de uma tonalidade, e a tonalidade pode vir só por causa dele
  const mostraTonalidade = respeita.includes('key') || respeita.includes('material');
  /**
   * **No braço, a região em MIDI não vale** (Paulo, 12/11: *"qual a moral do parâmetro região no
   * violão? já tem o região do braço"*).
   *
   * As duas unidades são incomparáveis, e sobrepô-las já foi bug: num baixo com casas 0–5 e a
   * região padrão, sobrava UMA casa no braço inteiro. Quem toca escolhe a faixa de CASAS, no
   * exercício; a região em MIDI serve a ouvido, pauta e teclado.
   */
  const noBraco = instrumentoDeBraco === true;
  if (!mostraTonalidade && (!respeita.includes('range') || noBraco)) return null;

  return (
    <div className="field" style={{ display: 'grid', gap: 14 }}>
      <span className="muted">{t('practice.sub')}</span>

      {mostraTonalidade && (
        <div style={{ display: 'grid', gap: 8 }}>
          <span className="eyebrow">{t('practice.key')}</span>
          {/* As doze SEMPRE visíveis (decisão 100). Antes elas só apareciam depois de sair de "Livre", e
              à primeira vista o controle parecia ter três opções. */}
          <div className="row">
            <Chip on={params.key === null} onClick={() => onChange({ key: null })}>{t('practice.keyFree')}</Chip>
            {Array.from({ length: 12 }, (_, pc) => (
              <Chip key={pc} on={params.key?.tonic === pc}
                onClick={() => onChange({ key: { tonic: pc, mode: params.key?.mode ?? 'maior' } })}>
                {keyName(pc, naming)}
              </Chip>
            ))}
          </div>
          {/* Maior ou menor só faz sentido com uma tônica escolhida */}
          {params.key && (
            <div className="row">
              {MODOS.map(mode => (
                <Chip key={mode} on={params.key?.mode === mode}
                  onClick={() => onChange({ key: { tonic: params.key?.tonic ?? 0, mode } })}>
                  {t(mode === 'maior' ? 'theory.keyMajor' : 'theory.keyMinor', { note: keyName(params.key?.tonic ?? 0, naming) })}
                </Chip>
              ))}
            </div>
          )}
        </div>
      )}

      {respeita.includes('range') && !noBraco && (
        <div style={{ display: 'grid', gap: 8 }}>
          <span className="eyebrow">{t('practice.region')}</span>
          <div className="row">
            {REGIOES.map(r => (
              <Chip key={r.id} on={regiaoDe(params.range) === r.id} onClick={() => onChange({ range: { lo: r.lo, hi: r.hi } })}>
                {t(`practice.region_${r.id}`)}
              </Chip>
            ))}
          </div>
          {/**
            * **Nota mínima e máxima**, pedido do Paulo em 12/11: *"seria interessante definir a nota
            * mínima e máxima ao invés de dizer só se quer linha suplementar ou não"*. Os quatro
            * atalhos acima continuam — são o caminho rápido —, e estes dois são o controle fino.
            * Quem mexe aqui vê o atalho se apagar, porque a faixa deixou de ser uma das nomeadas.
            */}
          <div className="row" style={{ gap: 10, alignItems: 'center' }}>
            <label className="muted" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {t('practice.rangeFrom')}
              <select className="sel" value={params.range.lo} aria-label={t('practice.rangeFrom')}
                onChange={e => { const lo = Number(e.target.value); onChange({ range: { lo, hi: Math.max(lo + 11, params.range.hi) } }); }}>
                {ALTURAS.map(m => <option key={m} value={m}>{noteNameOct({ ...ROOTS[mod(m, 12)], oct: Math.floor(m / 12) - 1 }, naming)}</option>)}
              </select>
            </label>
            <label className="muted" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {t('practice.rangeTo')}
              <select className="sel" value={params.range.hi} aria-label={t('practice.rangeTo')}
                onChange={e => { const hi = Number(e.target.value); onChange({ range: { lo: Math.min(hi - 11, params.range.lo), hi } }); }}>
                {ALTURAS.map(m => <option key={m} value={m}>{noteNameOct({ ...ROOTS[mod(m, 12)], oct: Math.floor(m / 12) - 1 }, naming)}</option>)}
              </select>
            </label>
          </div>
        </div>
      )}

      {/**
        * **Material só aparece com tonalidade fixa** (decidido com o Paulo em 12/11). Ele perguntou
        * se "material cromático" e "tonalidade livre" não eram redundantes: em parte sim — sem
        * tonalidade, `diatonico` **não restringe nada**, e o painel dizia isso num aviso. Oferecer
        * um controle e avisar que ele não funciona é pior que não oferecer.
        */}
      {respeita.includes('material') && params.key !== null && (
        <div style={{ display: 'grid', gap: 8 }}>
          <span className="eyebrow">{t('practice.material')}</span>
          <div className="row">
            <Chip on={params.material === 'cromatico'} onClick={() => onChange({ material: 'cromatico' })}>{t('practice.materialChromatic')}</Chip>
            <Chip on={params.material === 'diatonico'} onClick={() => onChange({ material: 'diatonico' })}>{t('practice.materialDiatonic')}</Chip>
          </div>
        </div>
      )}

    </div>
  );
}
