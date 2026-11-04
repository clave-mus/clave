// Rotinas de técnica com metrônomo progressivo. Sempre devagar e limpo antes de rápido.
import { useEffect, useMemo, useRef, useState } from 'react';
import { atTime, Clock, drum, tone } from '../audio/engine';
import { useRevisao, useStore } from '../state/store';
import { estadoDe, visivel } from '../catalog/publicacao';
import { pcName } from '../theory/core';
import Keyboard from '../components/music/Keyboard';
import Fretboard, { TUNINGS } from '../components/music/Fretboard';
import { Btn, Chip } from '../components/ui';
import EixoManual from '../components/EixoManual';
import { useGlobalParams } from '../catalog/params';
import { useToolLog } from './common';
import { useNaming, useT } from '../i18n';
import { ROUTINES, formaSobAMao, janelaDaMao } from './tecnica-rotinas';
import { andamentoNaVolta, gruposDeCordas, indicesDoGrupo, TETO_PADRAO } from '../theory/tecnica';

export default function Tecnica() {
  const instrument = useStore(s => s.profile.instrument);
  const naming = useNaming();
  const t = useT();
  const params = useGlobalParams();
  const revisao = useRevisao();
  const available = ROUTINES.filter(r => r.for.includes(instrument) && visivel(r.publicacao, revisao));
  const [escolhida, setRoutine] = useState(available[0] ?? ROUTINES[0]);
  // Sair do modo de revisão com um rascunho selecionado não pode deixar o rascunho na tela.
  const routine = available.includes(escolhida) ? escolhida : (available[0] ?? ROUTINES[0]);
  // Posição no eixo e o que já passou. Avanço manual (decisão 38) — o app nunca anda sozinho.
  // Guardada POR ROTINA, e não num estado único zerado num efeito: com um só, o primeiro render da
  // rotina nova usava a posição da anterior — e o contador marcava como "visto" um valor que a pessoa
  // nunca viu, mostrando "2 de 88" na primeira tela. Sem efeito de reset, e voltar a uma rotina
  // devolve a pessoa ao ponto em que estava.
  const [posicoes, setPosicoes] = useState<Record<string, number>>({});
  const [vistos, setVistos] = useState<Record<string, string[]>>({});
  // Qual grupo de quatro cordas vizinhas (0 = o mais grave). Só importa a rotina que declara `grupos`, e só
  // há o que escolher onde o instrumento tem mais de quatro cordas.
  const [grupo, setGrupo] = useState(0)
  const [bpm, setBpm] = useState(70);
  const [sub, setSub] = useState(2);
  // A subida de andamento NASCE DESLIGADA (decisões 82 e 93): aumentar o bpm demais costuma ser
  // prejudicial, e o app não trata andamento como progressão por conta própria. Quem quer, liga — e ela
  // sobe pouco (4 bpm a cada 2 voltas) e PARA num teto.
  const [climb, setClimb] = useState(false);
  const [teto, setTeto] = useState(TETO_PADRAO);
  // A base da subida: o andamento em que a pessoa a deixou por último e quantas voltas já tinham
  // passado. O andamento é calculado a partir dela (`andamentoNaVolta`), e mexer no controle no meio
  // da prática a reinicia — a subida continua do que a pessoa escolheu, nunca do que o app tinha.
  const base = useRef({ bpm: 0, voltas: 0 });
  const voltas = useRef(0);
  // O andamento com que a prática COMEÇOU, para o histórico dizer de onde ela partiu e aonde chegou.
  const inicioDaPratica = useRef<number | null>(null);
  const [hear, setHear] = useState(false);
  // Volumes separados: com um só, subir o instrumento subia o clique junto, e o clique é referência —
  // quem está estudando quer ouvir a própria nota acima dele, ou o contrário.
  const [volClique, setVolClique] = useState(0.8);
  const [volNota, setVolNota] = useState(0.5);
  const [running, setRunning] = useState(false);
  const [idx, setIdx] = useState(-1);
  const [round, setRound] = useState(0);
  const clock = useRef<Clock | null>(null);
  const tuning = instrument === 'baixo' ? TUNINGS.baixo : TUNINGS.violao;
  const nGrupos = gruposDeCordas(tuning.length);
  const grupoAtual = routine.grupos ? Math.min(grupo, nGrupos - 1) : 0;
  const escolheGrupo = !!routine.grupos && nGrupos > 1;
  // A posição no eixo e o que já passou valem POR GRUPO: a ordem 1-2-3-4 em Mi-Lá-Ré-Sol e em Lá-Ré-Sol-Si
  // são exercícios diferentes na mão, e contar uma como "já vista" por causa da outra seria mentir.
  const chave = escolheGrupo ? `${routine.id}:${grupoAtual}` : routine.id;
  const eixoPos = posicoes[chave] ?? 0;
  const setEixoPos = (f: number | ((p: number) => number)) =>
    setPosicoes(m => ({ ...m, [chave]: typeof f === 'function' ? f(m[chave] ?? 0) : f }));
  // `%` de negativo em JS devolve negativo, e `valores[-1]` é undefined — "Anterior" a partir de
  // zero quebrava a tela. O eixo é circular nos dois sentidos.
  const noCiclo = (i: number, n: number) => ((i % n) + n) % n;
  const valoresDoEixo = useMemo(() => routine.eixo?.valores(tuning.length) ?? [], [routine, tuning.length]);
  const valorDoEixo = valoresDoEixo.length ? valoresDoEixo[noCiclo(eixoPos, valoresDoEixo.length)] : '';
  const seq = useMemo(() => routine.build(tuning.length, valorDoEixo, grupoAtual), [routine, tuning.length, valorDoEixo, grupoAtual]);
  // O que ficou no histórico: a rotina, a ordem quando há, e o andamento — **de início e de fim**. Com a
  // subida ligada não existe um valor único, e gravar só um dos dois seria inventar; os dois dizem de
  // onde a prática partiu e aonde chegou. Informação neutra, nunca placar (decisão 82).
  useToolLog('tecnica', 'Rotinas de técnica', 'technique', running, {
    settings: {
      rotina: routine.id,
      ...(routine.eixo && valorDoEixo ? { [routine.eixo.id]: valorDoEixo } : {}),
      ...(escolheGrupo ? { grupoDeCordas: grupoAtual } : {}),
      subida: climb,
      ...(climb ? { teto } : {}),
      ...(inicioDaPratica.current !== null ? { bpmInicio: inicioDaPratica.current, bpmFim: bpm } : {}),
    },
  });
  // Passar por um valor conta como tê-lo visto, mesmo sem tocar até o fim — é informação, não meta
  // (decisões 11 e 82). Guardado POR ROTINA, e não zerado na troca: se você voltar, o que já passou
  // continua marcado. A primeira versão zerava num `useEffect([routine])` declarado DEPOIS deste, e
  // por isso apagava a marca do primeiro valor em toda troca — o contador vivia em zero.
  useEffect(() => {
    if (!valorDoEixo) return;
    setVistos(v => {
      const atual = v[chave] ?? [];
      return atual.includes(valorDoEixo) ? v : { ...v, [chave]: [...atual, valorDoEixo] };
    });
  }, [chave, valorDoEixo]);
  // o timbre é o escolhido para o instrumento no Perfil (ver SoundPanel)
  const live = useRef({ seq, hear, climb, teto, volClique, volNota, voice: params.timbres[instrument] });
  live.current = { seq, hear, climb, teto, volClique, volNota, voice: params.timbres[instrument] };
  useEffect(() => () => clock.current?.stop(), []);
  useEffect(() => { if (clock.current) clock.current.bpm = bpm; }, [bpm]);
  useEffect(() => { clock.current?.stop(); setRunning(false); setIdx(-1); }, [routine]);

  /** Começa a tocar na subdivisão dada. Separado de `toggle` para a troca de subdivisão poder reusá-lo. */
  const comecar = (subAtual: number) => {
    setRound(0);
    voltas.current = 0;
    base.current = { bpm, voltas: 0 };
    if (inicioDaPratica.current === null) inicioDaPratica.current = bpm;
    const c = new Clock(bpm, subAtual, (i, t) => {
      const L = live.current;
      if (i % subAtual === 0) drum(Math.floor(i / subAtual) % 4 === 0 ? 'clique-forte' : 'clique', t, L.volClique);
      if (i < 4 * sub) return; // contagem
      const k = i - 4 * sub;
      const n = k % L.seq.length;
      if (n === 0 && k > 0) {
        atTime(t, () => setRound(r => r + 1));
        voltas.current += 1;
        const novo = andamentoNaVolta(base.current.bpm, voltas.current - base.current.voltas, { ativa: L.climb, teto: L.teto });
        if (clock.current && novo !== clock.current.bpm) { clock.current.bpm = novo; atTime(t, () => setBpm(novo)); }
      }
      atTime(t, () => setIdx(n));
      const p = L.seq[n];
      if (L.hear) tone(instrument === 'piano' ? p.f : tuning[p.s] + p.f, t, 0.5, L.voice, L.volNota);
    });
    clock.current = c;
    c.start();
    setRunning(true);
  };

  const reiniciar = (subAtual: number) => { clock.current?.stop(); comecar(subAtual); };

  // **O espaço é sempre começar/parar.** Sem isto, ele reativava o ÚLTIMO botão clicado: tocar em
  // "Sortear" e depois apertar espaço sorteava de novo, em vez de dar play. É comportamento padrão do
  // navegador (espaço aciona o botão com foco), e aqui ele atrapalha mais do que ajuda.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      // num campo de texto ou num controle deslizante, o espaço e as setas continuam sendo deles
      if (alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable)) return;
      if (e.key !== ' ' && e.code !== 'Space') return;
      e.preventDefault();
      alvo?.blur?.();
      toggleRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const toggle = () => {
    if (running) { clock.current?.stop(); setRunning(false); setIdx(-1); return; }
    comecar(sub);
  };
  // o ouvinte de teclado monta uma vez; a ref mantém o `toggle` do render atual
  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;

  /**
   * **A forma**, não a tablatura (`A21`): as casas que a rotina usa, marcadas no braço, com a de agora
   * destacada. O Paulo: *"eu imaginava não uma tablatura mas sim um mapa do braço com as notas
   * destacadas com círculos — eu entendo que isso na verdade são shapes/formas."*
   *
   * A ordem não se perde: ela é ouvida no metrônomo e vista no destaque que anda. O que se ganha é o
   * **desenho**, que é o que fica na cabeça depois — e era justamente o que a tablatura escondia,
   * porque ela mostra a sequência e não a figura.
   *
   * **O dedo só aparece onde o dedo É o exercício** (a `T1`, permutações). Nas outras, qual dedo usar
   * é escolha de quem toca — foi o que a `A21` decidiu, e é por isso que `Pos.finger` virou opcional.
   */
  // A forma sob a mão, e o dedo só onde ele é o exercício. A lógica mora em `tecnica-rotinas.ts`,
  // testada sem React — ver `formaSobAMao`.
  const mostraDedo = routine.eixo?.id === 'digitacao';
  const janela = useMemo(() => janelaDaMao(seq, idx), [seq, idx]);
  const marcas = useMemo(() => formaSobAMao(seq, idx, mostraDedo), [seq, idx, mostraDedo]);
  const isPiano = instrument === 'piano';

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="row">
        {available.map(r => <Chip key={r.id} on={r.id === routine.id} onClick={() => setRoutine(r)}>{t(r.name)}{estadoDe(r.publicacao) === 'rascunho' ? ` · ${t('review.draft')}` : ''}</Chip>)}
      </div>
      <p className="muted">{t(routine.desc)}</p>

      {escolheGrupo && (
        <div style={{ display: 'grid', gap: 8 }}>
          <span className="eyebrow">{t('technique.stringGroup')}</span>
          <div className="row">
            {Array.from({ length: nGrupos }, (_, g) => (
              <Chip key={g} on={g === grupoAtual} onClick={() => setGrupo(g)}>
                {indicesDoGrupo(g, tuning.length).map(s => pcName(tuning[s], naming, false)).join(' ')}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {routine.eixo && (
        <EixoManual
          rotulo={routine.eixo.rotulo} valor={routine.eixo.mostrar(valorDoEixo, t)}
          vistos={(vistos[chave] ?? []).length} total={valoresDoEixo.length}
          onAnterior={() => setEixoPos(p => p - 1)} onProximo={() => setEixoPos(p => p + 1)}
          onSortear={() => setEixoPos(Math.floor(Math.random() * Math.max(1, valoresDoEixo.length)))}
        />
      )}

      <div style={{ background: 'var(--co)', padding: 18, overflowX: 'auto' }}>
        {isPiano ? (
          <Keyboard lo={60} hi={76} marks={idx >= 0 ? { [seq[idx].f]: 'var(--mu)' } : {}} naming={naming} labels="all" />
        ) : (
          /* UMA implementação de braço (decisão 17). O SVG que existia aqui era a segunda, e é por
             isso que ela saiu junto com a tablatura. */
          <Fretboard tuning={tuning} from={janela.from} to={janela.to} marks={marcas}
            showNames naming={naming} label={t('technique.shape')} />
        )}
      </div>

      <div className="row">
        <Btn onClick={toggle} tone={running ? 'mu' : undefined}>{t(running ? 'common.stop' : 'common.startPlay')}</Btn>
        <span className="num" style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 30 }}>♩ = {bpm}</span>
        <input className="range" style={{ maxWidth: 200 }} type="range" min={40} max={200} value={bpm}
          onChange={e => { const v = Number(e.target.value); setBpm(v); base.current = { bpm: v, voltas: voltas.current }; }} aria-label={t('common.tempo')} id="tc-bpm" />
        {/* Visível também tocando: escondê-la obrigava a parar para mudar de subdivisão. Trocar no meio
            reinicia o relógio, porque a subdivisão é a grade dele. */}
        {([[1, '♩'], [2, '♫'], [4, '♬']] as const).map(([n, figure]) => (
          <Chip key={n} on={sub === n} onClick={() => { setSub(n); if (running) reiniciar(n); }}>{t('technique.perNote', { figure })}</Chip>
        ))}
      </div>
      <div className="row">
        <label className="switch"><input type="checkbox" id="tc-climb" checked={climb}
          // ligar no meio da prática recomeça a contagem DAQUI: sem isto o andamento saltaria pelas voltas
          // que já passaram com a subida desligada
          onChange={e => { setClimb(e.target.checked); base.current = { bpm, voltas: voltas.current }; }} />{t('technique.climb')}</label>
        <label className="switch"><input type="checkbox" id="tc-hear" checked={hear} onChange={e => setHear(e.target.checked)} />{t('technique.hear')}</label>
        {running && <span className="muted">{t('technique.round', { n: round + 1 })}</span>}
      </div>
      <div className="row">
        <span className="eyebrow">{t('technique.volClick')}</span>
        <input className="range" style={{ maxWidth: 120 }} type="range" min={0} max={1} step={0.05} value={volClique}
          onChange={e => setVolClique(Number(e.target.value))} aria-label={t('technique.volClick')} id="tc-vol-clique" />
        <span className="eyebrow">{t('technique.volNote')}</span>
        <input className="range" style={{ maxWidth: 120 }} type="range" min={0} max={1} step={0.05} value={volNota}
          onChange={e => setVolNota(Number(e.target.value))} aria-label={t('technique.volNote')} id="tc-vol-nota" />
      </div>

      {climb && (
        <div className="row">
          <span className="muted">{t('technique.climbCeiling', { bpm: teto })}</span>
          <input className="range" style={{ maxWidth: 200 }} type="range" min={40} max={200} value={teto} onChange={e => setTeto(Number(e.target.value))} aria-label={t('technique.climbCeilingLabel')} id="tc-teto" />
          {/* Teto no andamento atual ou abaixo: nada vai subir, e sem dizer isso a pessoa não saberia por quê. */}
          {bpm >= teto && <span className="muted">{t('technique.climbAtCeiling')}</span>}
        </div>
      )}
    </div>
  );
}
