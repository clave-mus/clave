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
import { mod, pcName, pcNameUm } from '../theory/core';
import { grauDaFundamental } from '../theory/campo-harmonico';
import { Clock, atTime, drum, playGroups } from '../audio/engine';
import { Btn, Chip } from '../components/ui';
import { useToolLog } from './common';
import { useNaming, useT } from '../i18n';
import type { Ctx, SettingValue } from '../catalog/types';

/** Quanto tempo a pessoa tem para achar e tocar, antes de a resposta aparecer. */
const ESPERAR = { min: 3, max: 20, padrao: 8 };
/** Quanto tempo a resposta fica na tela antes de avançar sozinho para a próxima. */
const MOSTRAR = { min: 2, max: 15, padrao: 4 };
/**
 * **O ciclo no metrônomo**: `compassos` para achar e tocar, e **um** para a revelação.
 *
 * Um compasso de revelação, e não um número de segundos: com os dois no pulso, o ciclo inteiro
 * anda junto com o clique, e a 60 bpm ele dá os mesmos 4 s do padrão antigo.
 */
const COMPASSOS_REVELANDO = 1;
const TEMPOS_POR_COMPASSO = 4;
/** As faixas de casa, com os mesmos ids de `FRETS` em `catalog/helpers`. */
const CASAS: Record<string, { from: number; to: number }> = {
  '0-5': { from: 0, to: 5 }, '5-9': { from: 5, to: 9 }, '0-12': { from: 0, to: 12 },
};

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
  /**
   * **O alvo e o que marca o tempo** — os dois eixos que entraram em 20/11, com o exercício de
   * graus no braço que ele desenhou. Os valores vêm da etapa de rotina quando há uma; o padrão é o
   * comportamento antigo, para nenhuma rotina salva mudar de som.
   */
  const [alvo, setAlvo] = useState(settings?.alvo === 'grau' ? 'grau' : 'nota');
  const [ritmo, setRitmo] = useState(settings?.ritmo === 'metronomo' ? 'metronomo' : 'segundos');
  const [bpm, setBpm] = useState(() => (typeof settings?.bpm === 'number' ? settings.bpm : 60));
  const [compassos, setCompassos] = useState(() => Number(settings?.compassos ?? 2) || 2);
  const [casas, setCasas] = useState(() => (typeof settings?.casas === 'string' && CASAS[settings.casas] ? settings.casas : '0-5'));
  const faixa = CASAS[casas] ?? CASAS['0-5'];
  /**
   * **A tônica do modo dos graus, escolhida na tela** — e o documento dele pede exatamente isso:
   * *"definir uma região · definir uma tônica"*.
   *
   * Começa na tonalidade global quando há uma, e daí em diante quem manda é a chip. É o mesmo
   * padrão do Relações e do Acompanhamentos: a tonalidade é parâmetro de PRÁTICA nas séries, mas
   * uma tarefa de tela própria não tem painel de prática — então ela oferece a sua.
   */
  const [tonica, setTonica] = useState(() => params.key?.tonic ?? 0);
  const [fase, setFase] = useState<Fase>('parado');
  const [pc, setPc] = useState<number | null>(null);
  /** Qual grafia da nota mostrar: Lá♯ ou Si♭. Sorteada junto com a nota — ver `sortear`. */
  const [bemol, setBemol] = useState(false);
  const [feitas, setFeitas] = useState(0);

  useToolLog('no-instrumento', 'No instrumento', 'instrumento', fase !== 'parado',
    { settings: { alvo, ritmo, bpm, compassos, casas, tonica, esperar, mostrar, ouvirAntes, mostrarBraco } });
  useEffect(() => { onRunning?.(fase !== 'parado'); }, [fase, onRunning]);

  const relogio = useRef<number | null>(null);
  const limpar = () => { if (relogio.current) window.clearTimeout(relogio.current); relogio.current = null; };
  useEffect(() => limpar, []);

  /** Todas as posições, na faixa inteira, que tocam a classe de altura dada. */
  const posicoesDe = useCallback((p: number): Posicao[] => {
    const out: Posicao[] = [];
    for (let str = 0; str < tuning.length; str++) {
      // A região manda: o exercício é tocar o alvo em TODAS as posições dela, e marcar fora dela
      // pediria o que não foi pedido. Era `0..12` cravado.
      for (let f = faixa.from; f <= faixa.to; f++) {
        const m = tuning[str] + f;
        if (mod(m, 12) === p) out.push({ str, f, m });
      }
    }
    return out;
  }, [tuning, faixa.from, faixa.to]);

  /**
   * Sorteia uma classe de altura que o material permite, e **mostra só o nome** (ou o grau) — a casa
   * vem depois. Separado do encadeamento de propósito: com metrônomo quem conta é o relógio do
   * áudio, e com cronômetro é a cadeia de `setTimeout` logo abaixo.
   */
  const sortearAlvo = useCallback(() => {
    /**
     * **No modo dos graus, as doze classes entram** — e não só as da tonalidade.
     *
     * O exemplo do documento dele é `♭3`, que é alterado em maior: restringir ao material diatônico
     * tiraria do sorteio justamente o grau que ele deu como exemplo. No modo da nota, o material em
     * vigor continua mandando, como sempre.
     */
    const permitidas = alvo === 'grau'
      ? Array.from({ length: 12 }, (_, k) => mod(tonica + k, 12))
      : pcsPermitidas({ params } as Ctx);
    if (!permitidas.length) return;
    const p = permitidas[Math.floor(Math.random() * permitidas.length)];
    setPc(p);
    // A grafia é sorteada junto com a nota, e guardada: "ora Lá♯, ora Si♭" (pedido do Paulo). Tem de
    // ficar em estado, e não ser sorteada na renderização — senão mudaria entre a fase de procurar e
    // a de revelar, e a pessoa veria dois nomes para a mesma nota.
    setBemol(Math.random() < 0.5);
    setFase('procurando');
    if (ouvirAntes) {
      const pos = posicoesDe(p)[0];
      if (pos) playGroups([[pos.m]], { voice: tuning.length === 4 ? 'baixo' : 'violao' });
    }
  }, [params, tuning, ouvirAntes, posicoesDe, alvo, tonica]);

  /** No cronômetro: espera, revela, mostra, avança sozinho — "automático, nota a nota" (X8). */
  const encadear = useCallback(() => {
    sortearAlvo();
    limpar();
    relogio.current = window.setTimeout(() => {
      setFase('revelado');
      relogio.current = window.setTimeout(() => { setFeitas(n => n + 1); encadear(); }, mostrar * 1000);
    }, esperar * 1000);
  }, [sortearAlvo, esperar, mostrar]);

  /**
   * **No metrônomo, quem conta é o relógio do áudio** — `setTimeout` não serve para música, e aqui
   * ele serviria menos ainda: o clique e a troca de alvo têm de cair no mesmo pulso.
   *
   * Um passo por tempo. `compassos` compassos procurando, um revelando, e a troca acontece na
   * primeira batida do ciclo seguinte, que é onde ela se ouve como troca.
   */
  const clock = useRef<Clock | null>(null);
  const vivo = useRef({ compassos: 2 });
  useEffect(() => { vivo.current = { compassos }; }, [compassos]);
  useEffect(() => { if (clock.current) clock.current.bpm = bpm; }, [bpm]);
  const pararRelogio = () => { clock.current?.stop(); clock.current = null; };
  useEffect(() => pararRelogio, []);

  const comecarComMetronomo = useCallback(() => {
    pararRelogio();
    sortearAlvo();
    const c = new Clock(bpm, 1, (i, t) => {
      drum(i % TEMPOS_POR_COMPASSO === 0 ? 'clique-forte' : 'clique', t);
      const procurando = vivo.current.compassos * TEMPOS_POR_COMPASSO;
      const ciclo = procurando + COMPASSOS_REVELANDO * TEMPOS_POR_COMPASSO;
      const noCiclo = i % ciclo;
      if (noCiclo === procurando) atTime(t, () => setFase('revelado'));
      if (noCiclo === 0 && i > 0) atTime(t, () => { setFeitas(n => n + 1); sortearAlvo(); });
    });
    clock.current = c;
    c.start();
  }, [bpm, sortearAlvo]);

  const comecar = () => (ritmo === 'metronomo' ? comecarComMetronomo() : encadear());

  /** Pula o alvo atual — não espera o resto da cadeia, e não conta como "feito". */
  const pular = () => {
    if (ritmo === 'metronomo') { comecarComMetronomo(); return; }
    limpar();
    encadear();
  };

  const parar = () => { limpar(); pararRelogio(); setFase('parado'); setPc(null); };

  const todas = pc !== null ? posicoesDe(pc) : [];
  const marks: FretMark[] = todas.map(p => ({ s: p.str, f: p.f }));

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <p className="muted">{t('onInstrument.hint')}</p>

      {fase === 'parado' && (
        <>
          <div className="row" role="group" aria-label={t('onInstrument.target')}>
            <span className="eyebrow">{t('onInstrument.target')}</span>
            <Chip on={alvo === 'nota'} onClick={() => setAlvo('nota')}>{t('onInstrument.targetNote')}</Chip>
            <Chip on={alvo === 'grau'} onClick={() => setAlvo('grau')}>{t('onInstrument.targetDegree')}</Chip>
          </div>
          <div className="row" role="group" aria-label={t('onInstrument.pacing')}>
            <span className="eyebrow">{t('onInstrument.pacing')}</span>
            <Chip on={ritmo === 'segundos'} onClick={() => setRitmo('segundos')}>{t('onInstrument.pacingSeconds')}</Chip>
            <Chip on={ritmo === 'metronomo'} onClick={() => setRitmo('metronomo')}>{t('onInstrument.pacingMetronome')}</Chip>
          </div>
          {alvo === 'grau' && (
            <div className="row" role="group" aria-label={t('onInstrument.tonic')}>
              <span className="eyebrow">{t('onInstrument.tonic')}</span>
              {Array.from({ length: 12 }, (_, p) => (
                <Chip key={p} on={tonica === p} onClick={() => setTonica(p)}>{pcName(p, naming, false)}</Chip>
              ))}
            </div>
          )}
          <div className="row" role="group" aria-label={t('settings.frets')}>
            <span className="eyebrow">{t('settings.frets')}</span>
            {(['0-5', '5-9', '0-12'] as const).map(k => (
              <Chip key={k} on={casas === k} onClick={() => setCasas(k)}>
                {t(k === '0-5' ? 'settings.frets05' : k === '5-9' ? 'settings.frets59' : 'settings.frets012')}
              </Chip>
            ))}
          </div>
          {ritmo === 'metronomo' ? (
            <>
              <label style={{ display: 'grid', gap: 6, maxWidth: 420 }}>
                <span className="eyebrow">{t('common.tempo')} · ♩ = {bpm}</span>
                <input type="range" min={40} max={120} step={2} value={bpm}
                  onChange={e => setBpm(Number(e.target.value))} />
              </label>
              <div className="row" role="group" aria-label={t('onInstrument.barsEach')}>
                <span className="eyebrow">{t('onInstrument.barsEach')}</span>
                {[1, 2, 4].map(n => <Chip key={n} on={compassos === n} onClick={() => setCompassos(n)}>{n}</Chip>)}
              </div>
            </>
          ) : (
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
            </>
          )}
          <div className="row">
            <Chip on={ouvirAntes} onClick={() => setOuvirAntes(v => !v)}>{t('onInstrument.hearFirst')}</Chip>
            <Chip on={mostrarBraco} onClick={() => setMostrarBraco(v => !v)}>{t('onInstrument.showFretboard')}</Chip>
          </div>
          <div><Btn onClick={comecar}>{t('onInstrument.start')}</Btn></div>
        </>
      )}

      {pc !== null && fase !== 'parado' && (
        <>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            {/* O que a pessoa vê: o nome da nota, ou o grau dela na tonalidade em vigor. */}
            <b style={{ fontSize: 'clamp(32px, 8vw, 56px)' }}>
              {alvo === 'grau' ? grauDaFundamental(mod(pc - tonica, 12)) : pcNameUm(pc, naming, bemol)}
            </b>
            <span className="eyebrow">{t('onInstrument.count', { n: feitas })}</span>
          </div>
          <p className="muted">
            {fase === 'procurando'
              ? t(alvo === 'grau' ? 'onInstrument.findDegree' : 'onInstrument.findIt')
              : mostrarBraco ? t('onInstrument.hereItIs') : t('onInstrument.hereItIsName', { note: pcNameUm(pc, naming, bemol) })}
          </p>
          {/* Revelando um GRAU, a tela diz também que nota ele é: o alvo era o grau, e saber que o
              ♭3 de lá menor é Dó é metade do que o exercício ensina. */}
          {fase === 'revelado' && alvo === 'grau' && (
            <p className="muted">{t('onInstrument.degreeIs', { degree: grauDaFundamental(mod(pc - tonica, 12)), note: pcNameUm(pc, naming, bemol) })}</p>
          )}

          {/* O braço só aparece na revelação (e só se a pessoa não desligou): mostrá-lo antes
              transformaria o exercício em copiar da tela. Marca TODAS as posições da nota — uma
              só seria impor uma resposta onde existem várias (X8). */}
          {fase === 'revelado' && mostrarBraco && (
            <Fretboard tuning={tuning} from={faixa.from} to={faixa.to} marks={marks} />
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
