// Tocar no instrumento de verdade (F6-4).
//
// **O buraco que este item fecha:** nada no catálogo pedia para a pessoa tocar uma nota no baixo ou na
// guitarra. Os exercícios de braço acontecem todos na tela — ela aponta a casa, você toca na tela —, e
// a rotina "Mapear o braço com o instrumento" tinha três etapas sobre *tocar* e nenhuma sobre *mapear*.
//
// **O app não ouve, e isso define o desenho inteiro.** Não há como conferir que a nota tocada era a
// pedida, então este item é uma **tarefa**: mostra o alvo, espera, revela onde era, e termina na
// autoavaliação (decisões 5 e 37). O microfone não entra — nenhum exercício pode depender dele
// (decisão 43).
//
// O que ele *consegue* afirmar é pouco e honesto: **que a pessoa praticou, e o que ela achou de si.**
import { useCallback, useEffect, useRef, useState } from 'react';
import Fretboard, { TUNINGS } from '../components/music/Fretboard';
import { useGlobalParams } from '../catalog/params';
import { pcsPermitidas } from '../catalog/contexto-musical';
import { mod, pcName } from '../theory/core';
import { playGroups } from '../audio/engine';
import { Btn, Chip } from '../components/ui';
import { useToolLog } from './common';
import { useNaming, useT } from '../i18n';
import type { Ctx, SettingValue } from '../catalog/types';

/** Quanto tempo a pessoa tem para achar e tocar, antes de a resposta aparecer. */
const ESPERAR = { min: 3, max: 20, padrao: 8 };

type Fase = 'parado' | 'procurando' | 'revelado';

export default function NoInstrumento({ onRunning, settings }: { onRunning?: (r: boolean) => void; settings?: Record<string, SettingValue> }) {
  const t = useT();
  const naming = useNaming();
  const params = useGlobalParams();
  const tuning = params.tuning.length ? params.tuning : TUNINGS.baixo;

  const [esperar, setEsperar] = useState(() => (typeof settings?.esperar === 'number' ? settings.esperar : ESPERAR.padrao));
  const [ouvirAntes, setOuvirAntes] = useState(settings?.ouvirAntes !== false);
  const [fase, setFase] = useState<Fase>('parado');
  const [alvo, setAlvo] = useState<{ pc: number; str: number; f: number; m: number } | null>(null);
  const [feitas, setFeitas] = useState(0);

  useToolLog('no-instrumento', 'No instrumento', 'theory', fase !== 'parado', { settings: { esperar, ouvirAntes } });
  useEffect(() => { onRunning?.(fase !== 'parado'); }, [fase, onRunning]);

  const relogio = useRef<number | null>(null);
  const limpar = () => { if (relogio.current) window.clearTimeout(relogio.current); relogio.current = null; };
  useEffect(() => limpar, []);

  /** Sorteia um alvo que o material permite, e **mostra só o nome** — a casa vem depois. */
  const sortear = useCallback(() => {
    const permitidas = pcsPermitidas({ params } as Ctx);
    const posicoes: { pc: number; str: number; f: number; m: number }[] = [];
    for (let str = 0; str < tuning.length; str++) {
      for (let f = 0; f <= 12; f++) {
        const m = tuning[str] + f;
        if (permitidas.includes(mod(m, 12))) posicoes.push({ pc: mod(m, 12), str, f, m });
      }
    }
    if (!posicoes.length) return;
    const p = posicoes[Math.floor(Math.random() * posicoes.length)];
    setAlvo(p);
    setFase('procurando');
    if (ouvirAntes) playGroups([[p.m]], { voice: tuning.length === 4 ? 'baixo' : 'violao' });
    limpar();
    relogio.current = window.setTimeout(() => setFase('revelado'), esperar * 1000);
  }, [params, tuning, esperar, ouvirAntes]);

  /**
   * Próxima nota.
   *
   * **O item não se autoavalia.** A primeira versão perguntava "como foi?" depois de **cada nota** — o
   * Paulo: *"seria muito chato"*, e ele tinha razão: numa etapa de 8 minutos são quinze perguntas. E
   * havia duplicação, porque o executor já pergunta no fim da etapa por este item ser `tarefa`.
   *
   * Quem termina uma tarefa é a **etapa**, não a volta. Fora de uma rotina não há etapa — e aí não há
   * autoavaliação nenhuma, o que está certo: uso avulso produz **atividade**, não evidência.
   */
  const proxima = () => { setFeitas(n => n + 1); sortear(); };

  const parar = () => { limpar(); setFase('parado'); setAlvo(null); };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <p className="muted">{t('onInstrument.hint')}</p>

      {fase === 'parado' && (
        <>
          <label style={{ display: 'grid', gap: 6, maxWidth: 420 }}>
            <span className="eyebrow">{t('onInstrument.wait')} · {esperar}s</span>
            <input type="range" min={ESPERAR.min} max={ESPERAR.max} step={1} value={esperar}
              onChange={e => setEsperar(Number(e.target.value))} />
          </label>
          <div className="row">
            <Chip on={ouvirAntes} onClick={() => setOuvirAntes(v => !v)}>{t('onInstrument.hearFirst')}</Chip>
          </div>
          <div><Btn onClick={sortear}>{t('onInstrument.start')}</Btn></div>
        </>
      )}

      {alvo && fase !== 'parado' && (
        <>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <b style={{ fontSize: 'clamp(32px, 8vw, 56px)' }}>{pcName(alvo.pc, naming)}</b>
            <span className="eyebrow">{t('onInstrument.count', { n: feitas })}</span>
          </div>
          <p className="muted">{t(fase === 'procurando' ? 'onInstrument.findIt' : 'onInstrument.hereItIs')}</p>

          {/* O braço só aparece na revelação: mostrá-lo antes transformaria o exercício em copiar da tela. */}
          {fase === 'revelado' && (
            <Fretboard tuning={tuning} from={0} to={12} marks={[{ s: alvo.str, f: alvo.f }]} />
          )}

          {fase === 'procurando' ? (
            <div className="row">
              <Btn tone="ghost" onClick={() => { limpar(); setFase('revelado'); }}>{t('onInstrument.showMe')}</Btn>
              <Btn tone="ghost" onClick={parar}>{t('onInstrument.stop')}</Btn>
            </div>
          ) : (
            <div className="row">
              <Btn onClick={proxima}>{t('onInstrument.next')}</Btn>
              <Btn tone="ghost" onClick={parar}>{t('onInstrument.stop')}</Btn>
            </div>
          )}
        </>
      )}
    </div>
  );
}
