// Tocar no instrumento de verdade (F6-4; reformado em X8, 06/11/2026).
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
// **X8 consertou o defeito central:** a revelação marcava UMA posição sorteada, impondo uma resposta
// certa onde o braço tem várias — uma nota existe em até quatro lugares diferentes num baixo de quatro
// cordas. Agora marca TODAS as posições daquela nota, na faixa inteira.
//
// O que ele *consegue* afirmar é pouco e honesto: **que a pessoa praticou, e o que ela achou de si.**
//
// Fica para depois do M1 (o ciclador), e não entra aqui: tocar cada instância da nota uma corda de
// cada vez (para não deixar a memória geométrica da oitava resolver por você), e o aviso de troca com
// o metrônomo mudando no último compasso. Os dois dependem de um motor que ainda não existe.
import { useCallback, useEffect, useRef, useState } from 'react';
import Fretboard, { TUNINGS, type FretMark } from '../components/music/Fretboard';
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
/** Quanto tempo a resposta fica na tela antes de avançar sozinho para a próxima. */
const MOSTRAR = { min: 2, max: 15, padrao: 4 };

type Fase = 'parado' | 'procurando' | 'revelado';
interface Posicao { str: number; f: number; m: number }

export default function NoInstrumento({ onRunning, settings }: { onRunning?: (r: boolean) => void; settings?: Record<string, SettingValue> }) {
  const t = useT();
  const naming = useNaming();
  const params = useGlobalParams();
  const tuning = params.tuning.length ? params.tuning : TUNINGS.baixo;

  const [esperar, setEsperar] = useState(() => (typeof settings?.esperar === 'number' ? settings.esperar : ESPERAR.padrao));
  const [mostrar, setMostrar] = useState(() => (typeof settings?.mostrar === 'number' ? settings.mostrar : MOSTRAR.padrao));
  const [ouvirAntes, setOuvirAntes] = useState(settings?.ouvirAntes !== false);
  const [mostrarBraco, setMostrarBraco] = useState(settings?.mostrarBraco !== false);
  const [fase, setFase] = useState<Fase>('parado');
  const [pc, setPc] = useState<number | null>(null);
  const [feitas, setFeitas] = useState(0);

  useToolLog('no-instrumento', 'No instrumento', 'theory', fase !== 'parado', { settings: { esperar, mostrar, ouvirAntes, mostrarBraco } });
  useEffect(() => { onRunning?.(fase !== 'parado'); }, [fase, onRunning]);

  const relogio = useRef<number | null>(null);
  const limpar = () => { if (relogio.current) window.clearTimeout(relogio.current); relogio.current = null; };
  useEffect(() => limpar, []);

  /** Todas as posições, na faixa inteira, que tocam a classe de altura dada. */
  const posicoesDe = useCallback((p: number): Posicao[] => {
    const out: Posicao[] = [];
    for (let str = 0; str < tuning.length; str++) {
      for (let f = 0; f <= 12; f++) {
        const m = tuning[str] + f;
        if (mod(m, 12) === p) out.push({ str, f, m });
      }
    }
    return out;
  }, [tuning]);

  /** Sorteia uma classe de altura que o material permite, e **mostra só o nome** — a casa vem depois. */
  const sortear = useCallback(() => {
    const permitidas = pcsPermitidas({ params } as Ctx);
    if (!permitidas.length) return;
    const p = permitidas[Math.floor(Math.random() * permitidas.length)];
    setPc(p);
    setFase('procurando');
    limpar();
    if (ouvirAntes) {
      const pos = posicoesDe(p)[0];
      if (pos) playGroups([[pos.m]], { voice: tuning.length === 4 ? 'baixo' : 'violao' });
    }
    // Encadeado: espera, revela, mostra, avança sozinho — "automático, nota a nota" (X8). `pular`
    // ou `parar` cancelam a cadeia a qualquer momento.
    relogio.current = window.setTimeout(() => {
      setFase('revelado');
      relogio.current = window.setTimeout(() => { setFeitas(n => n + 1); sortear(); }, mostrar * 1000);
    }, esperar * 1000);
  }, [params, tuning, esperar, mostrar, ouvirAntes, posicoesDe]);

  /** Pula a nota atual — não espera o resto da cadeia, e não conta na autoavaliação da pessoa como
   *  "feita" (ela não chegou a ver a revelação, nem sempre; só avança). */
  const pular = () => { limpar(); sortear(); };

  const parar = () => { limpar(); setFase('parado'); setPc(null); };

  const todas = pc !== null ? posicoesDe(pc) : [];
  const marks: FretMark[] = todas.map(p => ({ s: p.str, f: p.f }));

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
          <label style={{ display: 'grid', gap: 6, maxWidth: 420 }}>
            <span className="eyebrow">{t('onInstrument.showFor')} · {mostrar}s</span>
            <input type="range" min={MOSTRAR.min} max={MOSTRAR.max} step={1} value={mostrar}
              onChange={e => setMostrar(Number(e.target.value))} />
          </label>
          <div className="row">
            <Chip on={ouvirAntes} onClick={() => setOuvirAntes(v => !v)}>{t('onInstrument.hearFirst')}</Chip>
            <Chip on={mostrarBraco} onClick={() => setMostrarBraco(v => !v)}>{t('onInstrument.showFretboard')}</Chip>
          </div>
          <div><Btn onClick={sortear}>{t('onInstrument.start')}</Btn></div>
        </>
      )}

      {pc !== null && fase !== 'parado' && (
        <>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <b style={{ fontSize: 'clamp(32px, 8vw, 56px)' }}>{pcName(pc, naming)}</b>
            <span className="eyebrow">{t('onInstrument.count', { n: feitas })}</span>
          </div>
          <p className="muted">
            {fase === 'procurando' ? t('onInstrument.findIt') : mostrarBraco ? t('onInstrument.hereItIs') : t('onInstrument.hereItIsName', { note: pcName(pc, naming) })}
          </p>

          {/* O braço só aparece na revelação (e só se a pessoa não desligou): mostrá-lo antes
              transformaria o exercício em copiar da tela. Marca TODAS as posições da nota — uma
              só seria impor uma resposta onde existem várias (X8). */}
          {fase === 'revelado' && mostrarBraco && (
            <Fretboard tuning={tuning} from={0} to={12} marks={marks} />
          )}

          <div className="row">
            <Btn tone="ghost" onClick={pular}>{t('onInstrument.skip')}</Btn>
            <Btn tone="ghost" onClick={parar}>{t('onInstrument.stop')}</Btn>
          </div>
        </>
      )}
    </div>
  );
}
