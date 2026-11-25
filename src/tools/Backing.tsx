// Acompanhamentos (nome dele, 20/11): progressão, levada, baixo, drone, metrônomo, cronômetro com
// meta e a escala de cada acorde. O id do item segue `backing`, que é o que o histórico já guarda.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { atTime, Clock, drone, drum, pararDrones, playGroups, tone, type Carater, type Drum, type Voice } from '../audio/engine';
import { saveSettings, useStore } from '../state/store';
import { buildScale, CHORDS, harmonicField, majorTonic, mod, note, noteName, pc, transpose, type ModoDoCampo } from '../theory/core';
import { emprestimosDoCampo } from '../theory/campo-harmonico';
import { alturaDoBaixo, desvioDoPasso, DURACOES, GROOVES, linhaDoTempo, type Duracao, type Style } from '../theory/levada';
import {
  ehMarca, GUARDADO, lerGuardado, PRESETS, resolve, resolverProgressao, tonicaDe, VOICES,
  type Guardado, type Item, type Preset, type Tonalidade,
} from './backing-progressao';
import Fretboard, { TUNINGS } from '../components/music/Fretboard';
import Keyboard from '../components/music/Keyboard';
import { Btn, Chip } from '../components/ui';
import { fmtClock, Metronome, useToolLog } from './common';
import { useLocale, useNaming, useT, type MessageKey } from '../i18n';

/** Os caracteres do drone: os três sustentados do motor, mais o piano que bate uma vez. */
const CARATERES: [Carater | 'piano', MessageKey][] = [
  ['fundo', 'backing.drone_fundo'], ['acorde', 'backing.drone_acorde'],
  ['destaque', 'backing.drone_destaque'], ['piano', 'backing.drone_piano'],
];
const STYLE_NAMES: Record<Style, MessageKey> = {
  rock: 'backing.styleRock', balada: 'backing.styleBallad', samba: 'backing.styleSamba',
  swing: 'backing.styleSwing', shuffle: 'backing.styleShuffle', valsa: 'backing.styleWaltz', nenhum: 'backing.styleNone',
};

export default function Backing({ presetId }: { presetId?: string }) {
  const [params] = useSearchParams();
  const naming = useNaming();
  const conv = useLocale();
  const t = useT();
  const instrument = useStore(s => s.profile.instrument);
  /**
   * De onde vem o estado inicial, nesta ordem: **o preset pedido** (rota ou `?p=`, que é intenção
   * explícita), o que ficou **guardado** da última vez, e só então o primeiro preset.
   */
  const pedido = PRESETS.find(p => p.id === (presetId ?? params.get('p')));
  const guardado = useStore(s => s.settings[GUARDADO]);
  const salvo = pedido ? null : lerGuardado(guardado?.progressao);
  const initial = pedido ?? PRESETS[0];
  const [fifths, setFifths] = useState(salvo?.fifths ?? 0);
  const [mode, setMode] = useState(salvo?.mode ?? initial.mode);
  const [items, setItems] = useState<Item[]>(salvo?.items ?? initial.items);
  const [tetrads, setTetrads] = useState(salvo?.tetrads ?? initial.tetrads);
  const [style, setStyle] = useState<Style>(salvo?.style ?? initial.style);
  const [bpm, setBpm] = useState(salvo?.bpm ?? initial.bpm);
  const [compVoice, setCompVoice] = useState<Voice>(salvo?.compVoice ?? 'piano');
  const [bassOn, setBassOn] = useState(salvo?.bassOn ?? true);
  /**
   * **O drone**, que veio do item `ambiente` ao se fundirem (decisão dele em 20/11) — e aqui ele é
   * **mais editável do que era lá**: em vez de quatro receitas (nota, quinta, maior, menor), um
   * teclado onde se escolhe tecla por tecla. Pedido dele: *"gostaria que o drone também fosse mais
   * editável — como um teclado em que podemos selecionar as teclas pressionadas"*.
   *
   * Ele é **mais uma parte do que soa**, ao lado de bateria, baixo e acordes: liga e desliga igual.
   * Com a progressão tocando, ele segura por baixo — que é o som de estudar modo sobre pedal.
   *
   * As notas são **absolutas**, e não graus: quem escolheu um Lá quer um Lá, mesmo trocando a
   * tonalidade da progressão. O padrão é a tônica em vigor, com a oitava acima.
   */
  const [droneOn, setDroneOn] = useState(salvo?.droneOn ?? false);
  const [droneNotas, setDroneNotas] = useState<number[]>(salvo?.droneNotas ?? []);
  const [droneCarater, setDroneCarater] = useState<Carater | 'piano'>(salvo?.droneCarater ?? 'fundo');
  /**
   * **O cronômetro com meta e o metrônomo vieram do item `ambiente`** quando os dois se fundiram
   * (decisão dele em 20/11). Eles entram porque a fusão não pode perder nada — foi a condição que
   * ele pôs ao aposentar o `audiar`, e vale igual aqui: o drone tinha meta de tempo e a meta é o
   * que faz um ambiente *terminar quando a pessoa para*. Sem ela, o item morreria com um buraco.
   */
  const [goal, setGoal] = useState(10);
  const [elapsed, setElapsed] = useState(0);
  const [timing, setTiming] = useState(false);
  const [metro, setMetro] = useState(false);
  const chimed = useRef(false);

  /**
   * **Os acordes também desligam** (pedido dele em 19/11: *"adicione a opção de ter só bateria
   * também"*). Com os dois desligados sobra a levada sozinha, que é o metrônomo com balanço — e com
   * acordes desligados e baixo ligado sobra a linha de baixo, que serve para quem quer tocar por
   * cima dela.
   */
  const [acordesOn, setAcordesOn] = useState(salvo?.acordesOn ?? true);
  /**
   * **Dois compassos de claves antes de a progressão entrar** (da revisão de 19/11).
   *
   * Sem isso a ferramenta entra frio no primeiro tempo: quem está com o instrumento na mão não tem
   * como chegar junto. Ligado por padrão, porque o caso de uso é tocar por cima.
   */
  const [contagem, setContagem] = useState(salvo?.contagem ?? true);
  const [running, setRunning] = useState(false);
  const [bar, setBar] = useState(0);
  const [view, setView] = useState<'teclado' | 'braco'>(instrument === 'piano' ? 'teclado' : 'braco');
  /**
   * **O item selecionado da progressão** (índice em `items`), que é ao mesmo tempo o alvo da edição e
   * o **ponto de inserção**: um acorde novo entra depois dele.
   *
   * Um conceito só, e não dois: com a seleção no último compasso — que é onde ela fica depois de
   * montar —, inserir depois dela é exatamente o "acrescentar no fim" de antes. A tela diz onde o
   * próximo acorde vai cair, então não há adivinhação.
   */
  const [sel, setSel] = useState<number | null>(null);
  /** Para onde a próxima marca de modulação aponta. Começa na quarta acima, que é a mais comum. */
  const [destino, setDestino] = useState<Tonalidade>({ fifths: initial.mode === 'maior' ? -1 : -1, mode: initial.mode });
  const clock = useRef<Clock | null>(null);
  const tonic = useMemo(() => (mode === 'maior' ? majorTonic(fifths) : transpose(majorTonic(fifths), { num: 6, semis: 9 })), [fifths, mode]);  // menor, harmônica e melódica partem da relativa menor
  // O que a pessoa praticou: a tonalidade e o andamento. Só a tonalidade vai em `params`, porque é só
  // ela que esta ferramenta usa — gravar região e material seria afirmar o que ela ignora.
  useToolLog('backing', 'Acompanhamentos', 'ouvido', running || timing || metro, {
    // `key.mode` só tem maior e menor; o modo exato (harmônica, melódica) vai nas configurações
    settings: { bpm, campo: mode }, params: { key: { tonic: pc(tonic), mode: mode === 'maior' ? 'maior' : 'menor' } },
  });
  const progressao = useMemo(() => resolverProgressao(items, { fifths, mode }, tetrads, conv), [items, fifths, mode, tetrads, conv]);
  const chords = progressao.chords;
  /**
   * **Os botões de grau são do campo em vigor no FIM da progressão**, e não do campo inicial: é ali
   * que um acorde novo cai. Sem isso, depois de modular para fá maior a tela ofereceria os graus de
   * dó e escreveria o acorde errado — o botão diria "V" e o acorde sairia no V antigo.
   */
  const tomDoFim = progressao.noFim;
  const tonicaDoFim = useMemo(() => tonicaDe(tomDoFim), [tomDoFim]);
  const field = useMemo(() => harmonicField(tonicaDoFim, tomDoFim.mode, tetrads, conv), [tonicaDoFim, tomDoFim.mode, tetrads, conv]);
  /** Os empréstimos do campo em vigor no fim. Só maior e menor têm lista curada — ver `Marca`. */
  const emprestimos = useMemo(
    () => (tomDoFim.mode === 'maior' || tomDoFim.mode === 'menor' ? emprestimosDoCampo(tomDoFim.mode) : []),
    [tomDoFim.mode]);
  const live = useRef({ chords, style, bassOn, compVoice, acordesOn });
  live.current = { chords, style, bassOn, compVoice, acordesOn };

  // Guarda a cada mudança. É escrita no estado global, que já persiste — nada de `localStorage` à mão.
  useEffect(() => {
    saveSettings(GUARDADO, { progressao: JSON.stringify({ items, fifths, mode, tetrads, style, bpm, contagem, bassOn, acordesOn, compVoice, droneOn, droneNotas, droneCarater } satisfies Guardado) });
  }, [items, fifths, mode, tetrads, style, bpm, contagem, bassOn, acordesOn, compVoice, droneOn, droneNotas, droneCarater]);

  /** As notas do drone — as escolhidas, ou a tônica em vigor com a oitava acima. */
  const notasDoDrone = droneNotas.length ? droneNotas : [48 + mod(pc(tonicaDoFim), 12), 60 + mod(pc(tonicaDoFim), 12)];
  /**
   * **O drone soa enquanto a ferramenta estiver tocando**, e não o tempo todo: um só botão comanda
   * tudo o que soa, que é o que faz disto um ambiente e não quatro brinquedos.
   *
   * Ele vive **fora do relógio** porque não tem passo: é som contínuo. A exceção é o piano, que é
   * amostra e **decai** — ali ele bate uma vez a cada mudança, como no melody over harmony.
   */
  useEffect(() => {
    if (!running || !droneOn) return;
    if (droneCarater === 'piano') { playGroups([[...notasDoDrone].sort((a, b) => a - b)], { voice: 'piano', dur: 4 }); return; }
    const parar = drone([...notasDoDrone].sort((a, b) => a - b), 0.5, droneCarater);
    return parar;
  }, [running, droneOn, notasDoDrone.join(','), droneCarater]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => pararDrones, []);

  useEffect(() => {
    if (!timing) return;
    const id = window.setInterval(() => setElapsed(e => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [timing]);
  // A meta cumprida avisa com um arpejo, uma vez só — e `chimed` volta a zero ao trocar a meta.
  useEffect(() => {
    if (elapsed >= goal * 60 && !chimed.current) {
      chimed.current = true;
      playGroups([[72], [76], [79], [84]], { gap: 0.18, dur: 1.2 });
    }
  }, [elapsed, goal]);

  useEffect(() => () => clock.current?.stop(), []);
  /**
   * **O compasso que está soando entra na tela.** Medido em 19/11: num celular, doze compassos dão
   * uma faixa de 1556 px, e o destaque passava fora da vista — a pessoa perdia o lugar.
   *
   * `block: 'nearest'` de propósito: ele só rola se precisar, então em tela larga (onde tudo cabe)
   * nada se move. E respeita `prefers-reduced-motion`, porque rolagem animada é movimento.
   */
  useEffect(() => {
    if (!running) return;
    const el = document.querySelector('.backing-compasso.soando');
    if (!(el instanceof HTMLElement)) return;
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: suave ? 'smooth' : 'auto' });
  }, [bar, running]);
  useEffect(() => { if (clock.current) clock.current.bpm = bpm; }, [bpm]);

  /** Põe um item **depois do selecionado** — ou no fim, quando não há seleção. */
  const inserir = (novo: Item) => {
    setItems(v => {
      const onde = sel === null || sel >= v.length ? v.length : sel + 1;
      const fora = [...v.slice(0, onde), novo, ...v.slice(onde)];
      return fora;
    });
    setSel(s2 => (s2 === null ? null : s2 + 1));
  };
  /** Tira o item selecionado — compasso ou marca de modulação. */
  const removerSelecionado = () => {
    if (sel === null) return;
    setItems(v => v.filter((_, i) => i !== sel));
    setSel(s2 => (s2 === null ? null : Math.max(0, Math.min(s2, items.length - 2))));
    setBar(0);
  };
  /** Muda a duração do compasso selecionado. Marca de modulação não tem duração. */
  const mudarDuracao = (d: Duracao) => {
    if (sel === null) return;
    setItems(v => v.map((it, i) => (i === sel && !ehMarca(it) ? { ...it, dur: d } : it)));
  };
  const itemSel = sel === null ? undefined : items[sel];
  /** "Fá maior", "Lá menor" — o nome de uma tonalidade, para a marca e para o painel. */
  const nomeDoTom = (tom: Tonalidade) => `${noteName(tonicaDe(tom), naming)} ${t(`backing.mode_${tom.mode}`).toLowerCase()}`;

  const start = () => {
    if (running) { clock.current?.stop(); setRunning(false); return; }
    const g0 = GROOVES[style];
    /**
     * A contagem vive **dentro** do relógio, como um atraso: dois compassos em que só a clave soa.
     * Fazê-la com `setTimeout` antes de iniciar o relógio poria o início da música no relógio da
     * tela, e o relógio do áudio não é o da tela — é a regra do projeto.
     */
    const atraso = contagem ? 2 * g0.grid : 0;
    const c = new Clock(bpm, g0.grid / g0.tempos, (i, t) => {
      const { chords: cs, style: st, bassOn: bo, compVoice: cv } = live.current;
      /**
       * ⚠️ **Ausente quer dizer LIGADO**, e não desligado. O Paulo relatou em 19/11 que os acordes
       * tinham parado de soar com o chip aceso — e a causa era recarga quente de módulo: o relógio
       * já vinha do código novo (com o interruptor) e a `live` ainda do antigo (sem ele), então
       * `acordesOn` chegava `undefined` e o `if` calava tudo.
       *
       * O conserto dele é recarregar a página, mas o padrão certo é este: quando não se sabe, a
       * ferramenta **soa**. Vale também para configuração guardada antes de o interruptor existir.
       */
      const ao = live.current.acordesOn !== false;
      const g = GROOVES[st];
      if (!cs.length) return;
      if (i < atraso) {
        // clave em cada tempo, e a primeira de cada compasso mais forte
        const passoNaContagem = i % g0.grid;
        if (passoNaContagem % (g0.grid / g0.tempos) === 0) drum(passoNaContagem === 0 ? 'clique-forte' : 'clique', t, 0.9);
        return;
      }
      const step = (i - atraso) % g.grid;
      /**
       * **Que acorde está soando neste passo** — a linha do tempo responde, e não mais a conta de
       * "um acorde por compasso". Um acorde de meio compasso troca no meio dele, e a levada (que é
       * periódica por compasso) segue andando por baixo sem saber de nada.
       */
      // Recalculada a cada passo de propósito: a pessoa pode editar a progressão **tocando**, e uma
      // linha do tempo congelada no `start()` tocaria a progressão de antes. São poucos objetos por
      // semicolcheia, e correção vale mais que a alocação.
      const { janelas, total } = linhaDoTempo(cs, g.grid);
      const pos = (i - atraso) % total;
      const bi = Math.max(0, janelas.findIndex(j => pos >= j.inicio && pos < j.fim));
      const ch = cs[bi];
      const nextCh = cs[(bi + 1) % cs.length];
      const sd = 60 / (clock.current?.bpm ?? bpm) / (g.grid / g.tempos);
      // o destaque troca quando o ACORDE troca, não a cada compasso
      if (pos === janelas[bi].inicio) atTime(t, () => setBar(bi));
      /**
       * **O micro-tempo desloca tudo o que soa neste passo** — bateria, baixo e acorde juntos. É o
       * ponto: o balanço é da seção rítmica inteira, e deslocar só um instrumento soaria como erro
       * de quem está tocando, não como levada.
       *
       * O relógio agenda com antecedência (ver `Clock.start`), então um adiantamento de poucos
       * milissegundos continua no futuro — medido, o maior desvio possível (16% da semicolcheia a
       * 50 bpm) são 48 ms, dentro dos 80 ms de antecedência.
       */
      const tq = t + desvioDoPasso(g, step, sd);
      const hit = (arr: number[] | undefined, k: Drum, v = 1) => arr?.includes(step) && drum(k, tq, v);
      hit(g.kick, 'bumbo'); hit(g.snare, 'caixa', st === 'samba' ? 0.45 : 1); hit(g.hat, 'chimbal', step % (g.grid / g.tempos) === 0 ? 0.9 : 0.55); hit(g.rim, 'aro', 0.8);
      const rootMidi = 36 + mod(pc(ch.root) - 36, 12);
      if (bo) g.bass.forEach(([s, grau, d]) => {
        if (s !== step) return;
        const proxima = 36 + mod(pc(nextCh.root) - 36, 12);
        tone(alturaDoBaixo(grau, rootMidi, ch.type, proxima), tq, d * sd * 0.92, 'baixo', 0.9);
      });
      if (ao) g.comp.forEach(([s, d]) => s === step && ch.vozes.forEach(m => tone(m, tq, d * sd * 0.95, cv, cv === 'pad' ? 0.8 : 0.45)));
    });
    clock.current = c;
    c.start();
    setRunning(true);
  };

  const loadPreset = (p: Preset) => {
    setItems(p.items); setMode(p.mode); setStyle(p.style); setBpm(p.bpm); setTetrads(p.tetrads); setBar(0); setSel(null);
    if (clock.current) clock.current.stepsPerBeat = GROOVES[p.style].grid / GROOVES[p.style].tempos;
  };
  const changeStyle = (s: Style) => { setStyle(s); if (clock.current) clock.current.stepsPerBeat = GROOVES[s].grid / GROOVES[s].tempos; };

  const cur = chords[Math.min(bar, chords.length - 1)];
  const [scaleIdx, setScaleIdx] = useState(0);
  const sc = cur?.scales[Math.min(scaleIdx, cur.scales.length - 1)];
  const scaleNotes = sc ? buildScale(sc.root, sc.id) : [];
  const chordPcs = cur ? CHORDS[cur.type].degs.map(([, s]) => mod(pc(cur.root) + s, 12)) : [];
  const scalePcs = scaleNotes.map(pc);
  /**
   * **A janela do teclado cobre o que SOA**, e não três oitavas fixas.
   *
   * Era 48–83 cravado: 36 teclas em 339 px de celular dão teclas de 9 px, que ninguém acerta com o
   * dedo nem lê. Agora ela parte do acorde que está soando e abre **duas oitavas** em volta, em
   * fronteiras de dó — oitava inteira para o desenho não cortar escala no meio.
   */
  const faixaDoTeclado = (() => {
    const base = cur?.vozes.length ? Math.min(...cur.vozes) : 55;
    const lo = Math.max(36, Math.floor(base / 12) * 12);
    return { lo, hi: Math.min(96, lo + 24) };
  })();
  const kMarks: Record<number, string> = {};
  for (let m = faixaDoTeclado.lo; m <= faixaDoTeclado.hi; m++) {
    if (chordPcs.includes(m % 12)) kMarks[m] = 'var(--ve)';
    else if (scalePcs.includes(m % 12)) kMarks[m] = 'var(--mu)';
  }
  const metaCumprida = elapsed >= goal * 60;
  const tuning = instrument === 'baixo' ? TUNINGS.baixo : TUNINGS.violao;
  const fMarks = tuning.flatMap((open, s) => Array.from({ length: 13 }, (_, f) => f).filter(f => scalePcs.includes(mod(open + f, 12))).map(f => ({
    s, f, color: chordPcs.includes(mod(open + f, 12)) ? 'var(--ve)' : undefined, label: noteName(scaleNotes[scalePcs.indexOf(mod(open + f, 12))] ?? note(0), naming),
  })));

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section className="panel" style={{ display: 'grid', gap: 14 }}>
        <div className="row"><span className="eyebrow">{t('backing.readyMade')}</span>{PRESETS.map(p => <Chip key={p.id} onClick={() => loadPreset(p)}>{t(p.name)}</Chip>)}</div>
        <div className="row">
          <span className="eyebrow">{t('backing.key')}</span>
          <select className="sel" value={fifths} onChange={e => setFifths(Number(e.target.value))} aria-label={t('backing.tonality')} id="bk-tom">
            {Array.from({ length: 13 }, (_, i) => i - 6).map(f => <option key={f} value={f}>{noteName(mode === 'maior' ? majorTonic(f) : transpose(majorTonic(f), { num: 6, semis: 9 }), naming)}</option>)}
          </select>
          {/* As duas menores alteradas entraram a pedido do Paulo: o campo delas traz o III aumentado,
              o V maior na menor, e os acordes m(7M) e 7M(♯5). */}
          {(['maior', 'menor', 'menor-harmonica', 'menor-melodica'] as const).map(m => (
            <Chip key={m} on={mode === m} onClick={() => setMode(m)}>{t(`backing.mode_${m}`)}</Chip>
          ))}
          <Chip on={tetrads} onClick={() => setTetrads(v => !v)}>{t('backing.tetrads')}</Chip>
        </div>
      </section>

      {/* A tinta desta faixa é dela (`--on-area`), não `--ink`: o azul é fixo e a tinta do tema
          inverte, e era por isso que ela ficava ilegível — ver `.backing-faixa` no CSS. */}
      <section className="backing-faixa">
        {/* A progressão na ordem em que foi escrita: as marcas de modulação aparecem entre os
            compassos, porque é onde elas agem. `porItem` liga item → compasso que soa. */}
        <div className="row" style={{ alignItems: 'stretch' }}>
          {items.map((it, k) => {
            if (ehMarca(it)) return (
              <button key={k} type="button" onClick={() => setSel(k)} aria-pressed={sel === k}
                className={`backing-marca ${sel === k ? 'sel' : ''}`}>⇢ {nomeDoTom(it.mod)}</button>
            );
            const i = progressao.porItem[k] ?? 0;
            const c = chords[i];
            if (!c) return null;
            return (
              <button key={k} type="button" onClick={() => { setBar(i); setSel(k); }}
                className={`backing-compasso ${running && i === bar ? 'soando' : i === bar ? 'aqui' : ''} ${sel === k ? 'sel' : ''}`}>
                <div className="cifra">{c.symbol}</div>
                <div className="roman">{c.roman}{c.dur !== 1 ? ` · ${c.dur === 0.5 ? '½' : c.dur}` : ''}</div>
              </button>
            );
          })}
        </div>
        <div className="row">
          <Btn onClick={start} tone={running ? 'mu' : undefined}>{t(running ? 'common.stop' : 'common.playPlay')}</Btn>
          <span className="num" style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 30 }}>♩ = {bpm}</span>
          <input className="range" style={{ maxWidth: 220 }} type="range" min={50} max={220} value={bpm} onChange={e => setBpm(Number(e.target.value))} aria-label={t('common.tempo')} id="bk-bpm" />
        </div>
        <div className="row"><span className="eyebrow">{t('backing.groove')}</span>{(Object.keys(STYLE_NAMES) as Style[]).map(s => <Chip key={s} on={style === s} onClick={() => changeStyle(s)}>{t(STYLE_NAMES[s])}</Chip>)}</div>
        {/* **O drone**: liga, escolhe as teclas, escolhe o caráter. Teclado em vez de receitas —
            pedido dele em 20/11, e é o que deixa segurar um intervalo qualquer, não só os quatro. */}
        <div className="row">
          <Chip on={droneOn} onClick={() => setDroneOn(v => !v)}>{t('backing.drone')}</Chip>
          {droneOn && CARATERES.map(([c, l]) => (
            <Chip key={c} on={droneCarater === c} onClick={() => setDroneCarater(c)}>{t(l)}</Chip>
          ))}
          {droneOn && droneNotas.length > 0 && (
            <Btn small tone="ghost" onClick={() => setDroneNotas([])}>{t('backing.droneClear')}</Btn>
          )}
        </div>
        {droneOn && <span className="muted" style={{ fontSize: 13, color: 'inherit', opacity: 0.85 }}>{t('ambient.droneText')}</span>}
        {droneOn && (
          <div style={{ maxWidth: 520 }}>
            {/* A tecla escolhida sai no acento, não em `--on-area`: dentro da faixa a tinta é
                quase branca no tema claro, e tecla branca marcada de branco não se vê. */}
            <Keyboard lo={36} hi={72} naming={naming} label={t('backing.droneKeys')}
              marks={Object.fromEntries(notasDoDrone.map(m => [m, 'var(--mu)']))}
              onPress={m => setDroneNotas(v => {
                const atuais = v.length ? v : notasDoDrone;
                return atuais.includes(m) ? atuais.filter(x => x !== m) : [...atuais, m];
              })} />
          </div>
        )}
        <div className="row">
          <span className="eyebrow">{t('backing.chordSound')}</span>
          {VOICES.map(([v, l]) => <Chip key={v} on={compVoice === v} onClick={() => setCompVoice(v)}>{t(l)}</Chip>)}
          <Chip on={acordesOn} onClick={() => setAcordesOn(v => !v)}>{t('backing.chords')}</Chip>
          <Chip on={bassOn} onClick={() => setBassOn(v => !v)}>{t('backing.bass')}</Chip>
          <Chip on={contagem} onClick={() => setContagem(v => !v)}>{t('backing.countIn')}</Chip>
        </div>
      </section>

      <section className="panel" style={{ display: 'grid', gap: 10 }}>
        {/* ⚠️ **O enunciado fala da tonalidade do FIM**, como os botões — e isto era um defeito que a
            tela mostrou: com a modulação carregada, os chips vinham de lá menor e a frase acima
            deles ainda dizia "dó maior". Rótulo que descreve outra coisa que o controle é pior que
            rótulo nenhum. */}
        <div className="eyebrow">{t(tomDoFim.mode === 'maior' ? 'backing.buildYoursMajor' : 'backing.buildYoursMinor', { tonic: noteName(tonicaDoFim, naming) })}</div>
        <div className="row">
          {field.map(d => <Chip key={d.degree} onClick={() => inserir({ deg: d.degree })}><b>{d.roman}</b> · {d.symbol}</Chip>)}
        </div>
        {/* **Os empréstimos vêm da lista curada do `ouvido-campo`** — mesma lista, mesmos acordes.
            Nas duas menores alteradas não há lista curada, e a fileira não aparece (decisão 13). */}
        {emprestimos.length > 0 && (
          <div className="row">
            <span className="eyebrow">{t('backing.borrowed')}</span>
            {emprestimos.map(e => {
              const r = resolve({ deg: e.grau, emp: e.id }, tomDoFim, tetrads, conv);
              return <Chip key={e.id} onClick={() => inserir({ deg: e.grau, emp: e.id })}><b>{r.roman}</b> · {r.symbol}</Chip>;
            })}
          </div>
        )}
        {/* A modulação é uma MARCA: ela entra onde está o fim da progressão e vale do ponto em diante. */}
        <div className="row">
          <span className="eyebrow">{t('backing.modulateTo')}</span>
          <select className="sel" value={destino.fifths} onChange={e => setDestino(d => ({ ...d, fifths: Number(e.target.value) }))}
            aria-label={t('backing.modulateTo')} id="bk-mod-tom">
            {Array.from({ length: 13 }, (_, i) => i - 6).map(f2 => (
              <option key={f2} value={f2}>{noteName(tonicaDe({ fifths: f2, mode: destino.mode }), naming)}</option>
            ))}
          </select>
          <select className="sel" value={destino.mode} onChange={e => setDestino(d => ({ ...d, mode: e.target.value as ModoDoCampo }))}
            aria-label={t('backing.field')} id="bk-mod-campo">
            {(['maior', 'menor', 'menor-harmonica', 'menor-melodica'] as const).map(m => (
              <option key={m} value={m}>{t(`backing.mode_${m}`)}</option>
            ))}
          </select>
          <Btn small tone="ghost" onClick={() => inserir({ mod: destino })}>{t('backing.addModulation')}</Btn>
        </div>
        {/* **O compasso selecionado**: duração e remoção. É o que responde ao "para consertar o
            sétimo compasso de um blues eu apago seis". */}
        {itemSel && (
          <div className="row">
            <span className="eyebrow">{ehMarca(itemSel) ? t('backing.selectedMark') : t('backing.selectedBar', { n: String((progressao.porItem[sel!] ?? 0) + 1) })}</span>
            {!ehMarca(itemSel) && DURACOES.map(d => (
              <Chip key={d} on={(itemSel.dur ?? 1) === d} onClick={() => mudarDuracao(d)}>
                {d === 0.5 ? t('backing.durHalf') : d === 1 ? t('backing.durOne') : t('backing.durTwo')}
              </Chip>
            ))}
            <Btn small tone="ghost" onClick={removerSelecionado}>{t('backing.removeSelected')}</Btn>
          </div>
        )}
        <div className="row">
          <span className="muted" style={{ fontSize: 13 }}>
            {sel === null || sel >= items.length - 1 ? t('backing.insertAtEnd') : t('backing.insertAfter', { n: String((progressao.porItem[sel] ?? 0) + 1) })}
          </span>
          <Btn small tone="ghost" onClick={() => { setItems(v => v.slice(0, -1)); setSel(null); }} disabled={!items.length}>{t('backing.deleteLast')}</Btn>
          <Btn small tone="ghost" onClick={() => { setItems([]); setBar(0); setSel(null); }}>{t('backing.clear')}</Btn>
        </div>
      </section>

      {/* **O cronômetro com meta, o metrônomo e o como usar** — o que o item `ambiente` tinha e que
          a fusão de 20/11 tinha que absorver, não descartar. A meta pintada de verde quando cumpre
          é o mesmo desenho de antes: a tela inteira responde, não um número pequeno num canto. */}
      <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start', gap: 18 }}>
        <div className="panel" style={{ display: 'grid', gap: 12, background: metaCumprida ? 'var(--mu)' : undefined, color: metaCumprida ? 'var(--bk)' : undefined }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 30 }}>{t('ambient.timer')}</h2>
            {metaCumprida && <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 20, textTransform: 'uppercase' }}>{t('ambient.goalMet')}</span>}
          </div>
          <div className="num" style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 72, lineHeight: 0.9 }}>{fmtClock(elapsed)}</div>
          <div className="row">
            <span className="eyebrow" style={{ color: 'inherit' }}>{t('ambient.goal')}</span>
            {[5, 10, 15, 20, 30].map(m => <Chip key={m} on={goal === m} onClick={() => { setGoal(m); chimed.current = false; }}>{t('common.minutes', { n: m })}</Chip>)}
          </div>
          <div className="row">
            <Btn onClick={() => setTiming(v => !v)} tone={timing ? 'mu' : undefined}>{t(timing ? 'common.pause' : elapsed ? 'common.continue' : 'common.start')}</Btn>
            <Btn tone="ghost" small onClick={() => { setElapsed(0); chimed.current = false; }}>{t('common.reset')}</Btn>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 18 }}>
          <Metronome compact onRunning={setMetro} />
          <div className="panel" style={{ display: 'grid', gap: 8 }}>
            <h3 style={{ fontSize: 24 }}>{t('ambient.howTo')}</h3>
            <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4 }}>
              <li>{t('ambient.step1')}</li>
              <li>{t('ambient.step2')}</li>
              <li>{t('ambient.step3')}</li>
              <li>{t('ambient.step4')}</li>
            </ol>
          </div>
        </div>
      </section>

      {cur && (
        <section className="panel" style={{ display: 'grid', gap: 14 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="eyebrow">{t('backing.overChord', { chord: cur.symbol, roman: cur.roman })}</div>
              <div className="row" style={{ marginTop: 8 }}>
                {cur.scales.map((s, i) => <Chip key={s.id} on={i === Math.min(scaleIdx, cur.scales.length - 1)} onClick={() => setScaleIdx(i)}>{noteName(s.root, naming)} {t(`theory.scales.${s.id}` as MessageKey)} ({t(s.why)})</Chip>)}
              </div>
            </div>
            <div className="row">
              <Chip on={view === 'teclado'} onClick={() => setView('teclado')}>{t('backing.keyboard')}</Chip>
              <Chip on={view === 'braco'} onClick={() => setView('braco')}>{t('backing.neck')}</Chip>
            </div>
          </div>
          <div className="muted" style={{ fontSize: 14 }}>
            {t('backing.notesLine', { notes: scaleNotes.map(n => noteName(n, naming)).join(' · ') })} <span style={{ color: 'var(--ve)' }}>■</span> {t('backing.chordNotes')} · <span style={{ color: 'var(--mu)' }}>■</span> {t('backing.restOfScale')}
          </div>
          {view === 'teclado'
            ? <Keyboard lo={faixaDoTeclado.lo} hi={faixaDoTeclado.hi} marks={kMarks} naming={naming} />
            : <Fretboard tuning={tuning} from={0} to={12} marks={fMarks} naming={naming} />}
        </section>
      )}
    </div>
  );
}
