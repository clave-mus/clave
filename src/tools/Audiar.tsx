// Audiação (X3, 06/11/2026): ouvir internamente, antes de conferir.
//
// **O app não ouve.** O ciclo é: toca a referência → diz o que audiar → espera um CLIQUE (nunca um
// tempo — com tela na mão, quem decide quando revelar é a pessoa) → revela tocando o alvo → a
// pessoa diz se tinha ouvido assim.
//
// A autoavaliação aqui é POR RODADA, diferente de `no-instrumento`/`tecnica` (que perguntam só ao
// fim da etapa): pedido explícito do Paulo, "quero ver como fica". Por isso é desligável à parte —
// `state.audiarAutoavaliar`, no Perfil — e não usa o mecanismo de uma vez por etapa que já existe.
import { useCallback, useEffect, useRef, useState } from 'react';
import { gerarEstimulo, type Estimulo } from '../catalog/items/audiar';
import { useGlobalParams } from '../catalog/params';
import { drone, playGroups } from '../audio/engine';
import { useStore } from '../state/store';
import { useRegistroDePratica } from '../state/useRegistro';
import { Btn, Chip } from '../components/ui';
import { itemText, useLocale, useNaming, useT } from '../i18n';
import type { Ctx, SettingValue } from '../catalog/types';

type Fase = 'parado' | 'audiando' | 'revelado';
const ESTIMULOS = ['referencia', 'graus'] as const;

export default function Audiar({ onRunning, settings }: { onRunning?: (r: boolean) => void; settings?: Record<string, SettingValue> }) {
  const t = useT();
  const naming = useNaming();
  const locale = useLocale();
  const params = useGlobalParams();
  const audiarAutoavaliar = useStore(s => s.audiarAutoavaliar);
  const ctx: Ctx = { naming, conv: locale, t, params };

  const [estimulos, setEstimulos] = useState<string[]>(() => {
    const v = settings?.estimulos;
    return Array.isArray(v) && v.length ? v.map(String) : ['referencia', 'graus'];
  });
  const [comDrone, setComDrone] = useState(() => settings?.drone === true);
  const tamanho = Math.min(6, Math.max(2, Number(settings?.tamanho ?? 4)));
  const escalas = Array.isArray(settings?.escalas) ? settings.escalas.map(String) : undefined;
  /**
   * **O pedal sempre o mesmo** (pedido do Paulo, 10/11/2026).
   *
   * Sorteado uma vez e guardado: as rodadas seguintes reusam. Com `pedal: 'sorteado'` fica `null` e
   * cada rodada sorteia a sua, que é o comportamento de antes.
   */
  const tonicaFixa = useRef<number | null>(null);
  const [fase, setFase] = useState<Fase>('parado');
  const [rodada, setRodada] = useState<Estimulo | null>(null);
  const [feitas, setFeitas] = useState(0);
  const [sim, setSim] = useState(0);

  const started = useRef(Date.now());
  const stopDrone = useRef<(() => void) | null>(null);
  const pararDrone = () => { stopDrone.current?.(); stopDrone.current = null; };

  useEffect(() => { onRunning?.(fase !== 'parado'); }, [fase, onRunning]);
  useEffect(() => pararDrone, []);

  /**
   * O drone segue o botão **e** a referência da rodada, e é por isso que ele mora num efeito e não
   * no sorteio: ligar e desligar passa a valer na hora.
   *
   * Uma oitava abaixo da referência — pedal é fundação, não concorrente da nota que se audia.
   */
  useEffect(() => {
    pararDrone();
    if (!comDrone || fase === 'parado' || !rodada?.referencia.length) return;
    stopDrone.current = drone(rodada.referencia.map(m => m - 12));
    return pararDrone;
  }, [comDrone, fase, rodada]);

  useRegistroDePratica(() => {
    if (feitas === 0) return null;
    return {
      id: 'audiar', title: itemText(t, 'audiar', 'title'), module: 'perception.melodic',
      seconds: Math.round((Date.now() - started.current) / 1000),
      autoavaliadas: audiarAutoavaliar ? { sim, total: feitas } : undefined,
      snapshot: { settings: { estimulos, drone: comDrone, tamanho, pedal: String(settings?.pedal ?? 'sorteado') } },
    };
  });

  const sortear = useCallback(() => {
    const e = gerarEstimulo(estimulos.length ? estimulos : ESTIMULOS, ctx, {
      tamanho, escalas, ...(tonicaFixa.current !== null ? { tonica: tonicaFixa.current } : {}),
    });
    if (settings?.pedal === 'fixo' && tonicaFixa.current === null) tonicaFixa.current = e.referencia[0];
    setRodada(e);
    setFase('audiando');
    playGroups(e.referencia.map(m => [m]));
    // O drone NÃO é ligado aqui: quem cuida dele é o efeito abaixo. Era ligado no sorteio, e por
    // isso o botão só valia na rodada seguinte — o Paulo pediu "que dê pra ligar e desligá-lo de
    // dentro do exercício", e ligar é agora.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimulos, tamanho, escalas, settings?.pedal, naming, locale, params]);

  const revelar = useCallback(() => {
    if (!rodada) return;
    setFase('revelado');
    playGroups(rodada.alvo, { gap: 0.55 });
  }, [rodada]);

  /** Sem autoavaliação ligada, "próxima" só avança — não há o que registrar. */
  const proxima = (acertou?: boolean) => {
    setFeitas(n => n + 1);
    if (acertou) setSim(n => n + 1);
    sortear();
  };

  const parar = () => { pararDrone(); setFase('parado'); setRodada(null); tonicaFixa.current = null; };

  const alternarEstimulo = (id: string) => setEstimulos(v => (v.includes(id) ? v.filter(x => x !== id) : [...v, id]));

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <p className="muted">{t('audiar.hint')}</p>

      {fase === 'parado' && (
        <>
          <div style={{ display: 'grid', gap: 6 }}>
            <span className="eyebrow">{t('audiar.stimuli')}</span>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {ESTIMULOS.map(id => (
                <Chip key={id} on={estimulos.includes(id)} onClick={() => alternarEstimulo(id)}>
                  {t(id === 'referencia' ? 'audiar.stimulusReference' : 'audiar.stimulusDegrees')}
                </Chip>
              ))}
            </div>
            {estimulos.length === 0 && <p className="muted" style={{ margin: 0 }}>{t('audiar.noStimuli')}</p>}
          </div>
          <div className="row">
            <Chip on={comDrone} onClick={() => setComDrone(v => !v)}>{t('audiar.drone')}</Chip>
          </div>
          <div><Btn onClick={sortear} disabled={estimulos.length === 0}>{t('common.start')}</Btn></div>
        </>
      )}

      {rodada && fase !== 'parado' && (
        <>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="eyebrow">{t('audiar.count', { n: feitas })}</span>
          </div>
          <b style={{ fontSize: 'clamp(22px, 5vw, 34px)' }}>
            {fase === 'revelado' ? t('audiar.hereItIs', { answer: rodada.reveal }) : rodada.enunciado}
          </b>

          {fase === 'audiando' ? (
            <div className="row">
              <Btn onClick={revelar}>{t('audiar.reveal')}</Btn>
              <Btn tone="ghost" onClick={parar}>{t('common.stop')}</Btn>
            </div>
          ) : audiarAutoavaliar ? (
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <span className="eyebrow">{t('audiar.hadIt')}</span>
              <Btn onClick={() => proxima(true)}>{t('audiar.yes')}</Btn>
              <Btn tone="ghost" onClick={() => proxima(false)}>{t('audiar.no')}</Btn>
              <Btn tone="ghost" onClick={parar}>{t('common.stop')}</Btn>
            </div>
          ) : (
            <div className="row">
              <Btn onClick={() => proxima()}>{t('audiar.next')}</Btn>
              <Btn tone="ghost" onClick={parar}>{t('common.stop')}</Btn>
            </div>
          )}
        </>
      )}
    </div>
  );
}
