// Explorar padrões pela escala — a metade de exploração do par que o Paulo desenhou em
// `docs/tarefas/PE-padroes-de-escala.md`, escrito em 09–10/11/2026 e feito em 20/11.
//
// **Espelha o Relações** de propósito: o seletor de tonalidade pelo ciclo das quintas, o contexto
// que sustenta com `drone` e `Carater`, e `pararDrones()` na montagem e na desmontagem. O que é
// novo aqui é a escada: o padrão se **escreve clicando**, porque ele pode repetir grau e descer —
// então não é "marcar os degraus que entram", é escrever a sequência (decisão dele).
//
// O motor mora em `theory/padrao-de-escala.ts`, testado antes desta tela existir; aqui é só tela e
// som. É `tarefa`: termina quando a pessoa declara, não quando o app conta (decisão 5).
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { drone, pararDrones, pararTudo, playGroups } from '../audio/engine';
import { useGlobalParams } from '../catalog/params';
import { majorTonic, noteName, pc, scaleDegreeLabels, type Note, type ScaleId } from '../theory/core';
import {
  acordeDoCampo, escreverPadrao, MAX_NOTAS, MIN_NOTAS, posicoesDoPadrao, quantasPosicoes,
  rotulo, sortearPadrao, type Padrao,
} from '../theory/padrao-de-escala';
import { ALL_SCALES } from '../catalog/helpers';
import { lacoDosPadroes } from '../catalog/lacos';
import { Btn, Chip } from '../components/ui';
import { useToolLog } from './common';
import { useNaming, useT, type MessageKey } from '../i18n';

/** A roda das quintas, de 6 bemóis a 6 sustenidos — as treze grafias de tonalidade que existem. */
const QUINTAS = Array.from({ length: 13 }, (_, i) => i - 6);
/** Pentatônica maior como padrão — decisão dele em 09/11. */
const ESCALA_PADRAO: ScaleId = 'penta-maior';
/** A oitava em que a tônica mora: dó3, para o padrão subir sem estourar o agudo. */
const PISO = 48;

export default function PadroesDeEscala() {
  const t = useT();
  const naming = useNaming();
  const params = useGlobalParams();
  const navigate = useNavigate();

  const [escala, setEscala] = useState<ScaleId>(ESCALA_PADRAO);
  const [tamanho, setTamanho] = useState(4);
  const [tetrade, setTetrade] = useState(false);
  /**
   * **Os degraus clicados, em absoluto** — e o padrão sai deles por subtração do primeiro.
   *
   * Guardar o padrão relativo e o "primeiro clique" à parte era duas verdades para uma coisa, e a
   * segunda chegava atrasada: no primeiro clique o `padrao` já se escrevia com o `primeiroClique`
   * do render anterior. Uma lista de passos absolutos não tem como discordar de si mesma.
   */
  const [passos, setPassos] = useState<number[]>(() => {
    const p = sortearPadrao(4);
    return p.map(d => d - Math.min(...p));
  });
  const padrao: Padrao = useMemo(() => (passos.length ? passos.map(p => p - passos[0]) : []), [passos]);
  const [quintas, setQuintas] = useState(() => {
    const doPerfil = params.key?.tonic;
    if (doPerfil === undefined) return 0;
    return QUINTAS.find(f => pc(majorTonic(f)) === doPerfil) ?? 0;
  });
  /** O grau do campo que sustenta por baixo: `null` é silêncio, `0` é só a tônica, 1..7 os acordes. */
  const [contexto, setContexto] = useState<number | null>(null);

  const raiz: Note = useMemo(() => ({ ...majorTonic(quintas), oct: 4 }), [quintas]);
  const tonica = PISO + pc(raiz);
  const graus = useMemo(() => scaleDegreeLabels(escala).slice(0, -1), [escala]);
  const posicoes = useMemo(() => posicoesDoPadrao(escala, padrao), [escala, padrao]);

  /**
   * **A escada**: uma oitava mais o grau da oitava, de baixo para cima. É o bastante para um padrão
   * de seis notas com salto de ±2, que é o maior que o motor sorteia.
   */
  const degraus = useMemo(() => {
    const n = quantasPosicoes(escala);
    return Array.from({ length: n + 1 }, (_, i) => ({ passo: i, label: graus[i % n] }));
  }, [escala, graus]);

  const clicar = (passo: number) => setPassos(v => (v.length >= MAX_NOTAS ? v : [...v, passo]));
  /** `1-3-2-5`: os graus dos degraus apertados, na ordem em que foram apertados. */
  const escrito = useMemo(() => {
    const n = quantasPosicoes(escala);
    return passos.map(p => graus[((p % n) + n) % n]).join('-');
  }, [passos, escala, graus]);

  /** O caminho já escrito, por degrau: a ordem dos cliques, para a escada desenhar o percurso. */
  const ordemNoDegrau = useMemo(() => {
    const m = new Map<number, number[]>();
    passos.forEach((passo, i) => m.set(passo, [...(m.get(passo) ?? []), i + 1]));
    return m;
  }, [passos]);

  // ---------------------------------------------------------------- som
  //
  // **O contexto sustenta e o padrão bate por cima** — os dois sons têm naturezas diferentes, como
  // no Relações: o contexto é oscilador contínuo (`Carater` 'acorde'), e o padrão é uma sequência
  // agendada pelo relógio do áudio. `setTimeout` não serve para música.
  useEffect(() => {
    if (contexto === null) return;
    const midis = contexto === 0
      ? [tonica, tonica + 12]
      : acordeDoCampo(escala, contexto, tetrade).map(s => tonica + s);
    const parar = drone(midis, 0.6, 'acorde');
    return parar;
  }, [contexto, escala, tetrade, tonica]);
  // Rede de segurança: cala drone órfão ao entrar E ao sair, como no Relações.
  useEffect(() => { pararDrones(); return pararDrones; }, []);

  const [soando, setSoando] = useState<number | null>(null);
  /** **Aperta para ouvir** (decisão dele): selecionar uma posição não toca sozinho. */
  const ouvir = (i: number) => {
    const p = posicoes[i];
    playGroups(p.semis.map(s => [tonica + s]), { gap: 0.42, dur: 0.5, voice: 'piano' });
    setSoando(i);
  };

  useToolLog('explorar-padroes-escala', 'Explorar padrões pela escala', 'ouvido',
    contexto !== null || soando !== null, { settings: { escala, padrao: escreverPadrao(padrao), tamanho } });

  const completo = padrao.length >= MIN_NOTAS;
  return (
    <div className="pde" style={{ display: 'grid', gap: 18 }}>
      <p className="muted" style={{ maxWidth: '62ch' }}>{t('patterns.intro')}</p>
      <p className="rmh-dica">{t('patterns.tip')}</p>

      {/* 1 · A escada. Clicar num degrau acrescenta aquele passo ao FIM do padrão. */}
      <div className="field">
        <span>{t('patterns.ladder')}</span>
        <div className="pde-escada" role="group" aria-label={t('patterns.ladder')}>
          {[...degraus].reverse().map(d => {
            const ordens = ordemNoDegrau.get(d.passo) ?? [];
            return (
              <button key={d.passo} type="button" onClick={() => clicar(d.passo)}
                className={`pde-degrau ${ordens.length ? 'on' : ''}`}
                aria-pressed={ordens.length > 0} disabled={padrao.length >= MAX_NOTAS}>
                <span className="pde-grau">{d.label}</span>
                <span className="pde-ordem">{ordens.join(' · ')}</span>
              </button>
            );
          })}
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          {/* O desenho **como foi clicado**, e não como ele lê a partir do grau 1: a escada mostra os
              degraus que a pessoa apertou, e os dois precisam concordar. Medido na primeira versão:
              sorteando, a escada marcava 2-1-6-5 e esta linha dizia 1-6-5-2 — o mesmo desenho em
              duas leituras, lado a lado, sem nada explicando a diferença. */}
          <span className="pde-escrito">{passos.length ? escrito : t('patterns.empty')}</span>
          <Btn small tone="ghost" onClick={() => setPassos(v => v.slice(0, -1))} disabled={!passos.length}>{t('patterns.undo')}</Btn>
          <Btn small tone="ghost" onClick={() => setPassos([])} disabled={!passos.length}>{t('patterns.clear')}</Btn>
          <Btn small tone="ghost" onClick={() => { const p = sortearPadrao(tamanho); setPassos(p.map(d => d - Math.min(...p))); }}>{t('patterns.draw')}</Btn>
        </div>
      </div>

      {/* 2 · As posições, todas de uma vez: é a comparação que ensina. */}
      {completo && (
        <div className="field">
          <span>{t('patterns.positions')}</span>
          <div className="rmh-grade" role="group" aria-label={t('patterns.positions')}>
            {posicoes.map((p, i) => (
              <button key={p.inicio} type="button" className={`rmh-cel ${i === soando ? 'on' : ''}`}
                onClick={() => ouvir(i)}>
                <span className="rmh-roman">{t('patterns.startsOn')}</span>
                <span className="rmh-cifra">{p.graus[0]}</span>
                <span className="rmh-rel">{rotulo(p)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3 · O contexto que sustenta: silenciar · só a tônica · os graus do campo. */}
      <div className="field">
        <span>{t('patterns.context')}</span>
        <div className="row">
          <Chip on={contexto === null} onClick={() => { setContexto(null); pararTudo(); }}>{t('patterns.silence')}</Chip>
          <Chip on={contexto === 0} onClick={() => setContexto(0)}>{t('patterns.justTonic')}</Chip>
          {Array.from({ length: quantasPosicoes(escala) }, (_, i) => i + 1).map(g => (
            <Chip key={g} on={contexto === g} onClick={() => setContexto(g)}>{graus[g - 1]}</Chip>
          ))}
        </div>
      </div>

      {/* 4 · Configurações. */}
      <div className="field">
        <span>{t('patterns.settings')}</span>
        <div className="row">
          <select className="sel" value={escala} onChange={e => { setEscala(e.target.value as ScaleId); setContexto(null); }}
            aria-label={t('patterns.scale')} id="pde-escala">
            {ALL_SCALES.map(id => <option key={id} value={id}>{t(`theory.scales.${id}` as MessageKey)}</option>)}
          </select>
          <select className="sel" value={quintas} onChange={e => setQuintas(Number(e.target.value))}
            aria-label={t('patterns.key')} id="pde-tom">
            {QUINTAS.map(f => <option key={f} value={f}>{noteName(majorTonic(f), naming)}</option>)}
          </select>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <span className="eyebrow">{t('patterns.size')}</span>
          {Array.from({ length: MAX_NOTAS - MIN_NOTAS + 1 }, (_, i) => MIN_NOTAS + i).map(n => (
            <Chip key={n} on={tamanho === n} onClick={() => setTamanho(n)}>{n}</Chip>
          ))}
          <label className="switch"><input type="checkbox" checked={tetrade} onChange={e => setTetrade(e.target.checked)} />{t('patterns.tetrad')}</label>
        </div>
      </div>

      {/* O laço com o exercício: o padrão viaja pelo `state` da navegação (`lerAbertura`), e a
          configuração dele mora em `catalog/lacos.ts`, onde um teste a confere contra o item. */}
      {completo && (
        <div>
          <Btn onClick={() => {
            const laco = lacoDosPadroes(escala, padrao);
            navigate(`/catalogo/${laco.itemId}`, { state: { instancia: laco.instancia } });
          }}>{t('patterns.testMe')}</Btn>
        </div>
      )}

      {/* O crédito, pedido explícito dele, com o texto dele. */}
      <p className="muted" style={{ fontSize: 13, maxWidth: '62ch' }}>
        {t('patterns.creditBefore')}
        <a href="https://www.youtube.com/watch?v=4mPYAH0H01w&t=649s" target="_blank" rel="noreferrer">{t('patterns.creditLink')}</a>
        {t('patterns.creditAfter')}
      </p>
    </div>
  );
}
