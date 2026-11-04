// A "tarefa com metrônomo": um relógio, um plano de compassos, e a pessoa tocando o instrumento dela.
//
// Serve a cinco famílias (deslocamento de acento, subdivisão alternada, sustentar e cortar, legato e
// staccato, deslocamento de padrão rítmico) e é UMA tela só — a decisão 15. O que muda de uma para
// outra está em `cadencia-familias.ts`: os controles e o plano.
//
// **O app não ouve nada.** A avaliação é da pessoa (decisão 37): a tela mostra o que fazer, quando
// mudar, e o que vem depois — e marca o compasso em que cada mudança acontece.
//
// **O andamento é configuração neutra** (decisão 82): nunca sobe sozinho, nunca é recorde.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { atTime, Clock, drum } from '../audio/engine';
import type { ScreenProps } from '../catalog/types';
import EixoManual from '../components/EixoManual';
import { Btn, Chip } from '../components/ui';
import { itemText, useT } from '../i18n';
import { posicaoNoCiclo, somDaCelula, type Celula, type Plano } from '../theory/cadencia';
import { FAMILIAS, valoresPadrao, type Familia, type FamiliaId, type Valores } from './cadencia-familias';
import { useToolLog } from './common';

/** Quatro cliques de contagem antes do primeiro compasso do plano. */
const CONTAGEM = 4;

export default function Cadencia({ itemId }: ScreenProps) {
  const fam = itemId ? FAMILIAS[itemId as FamiliaId] : undefined;
  return fam ? <Executor fam={fam} /> : null;
}

const noCiclo = (i: number, n: number) => ((i % n) + n) % n;

// o que cada célula mostra: o desenho diz o que fazer sem depender de cor
const GLIFO: Record<Celula, string> = { forte: '>', normal: '', ataque: '●', segura: '━', corte: '✕', silencio: '' };

function Executor({ fam }: { fam: Familia }) {
  const t = useT();
  const [valores, setValores] = useState<Valores>(() => valoresPadrao(fam));
  const [bpm, setBpm] = useState(70);
  const [running, setRunning] = useState(false);
  const [conta, setConta] = useState(0);
  const [pos, setPos] = useState<{ compasso: number; celula: number } | null>(null);
  // posição no eixo por conjunto de valores, e o que já passou — avanço manual (decisão 38)
  const [posicoes, setPosicoes] = useState<Record<string, number>>({});
  const [vistos, setVistos] = useState<Record<string, string[]>>({});
  const clock = useRef<Clock | null>(null);

  const eixo = useMemo(() => fam.eixo?.(valores) ?? null, [fam, valores]);
  const chaveDoEixo = eixo ? `${fam.id}:${eixo.valores.join('|')}` : '';
  const eixoPos = posicoes[chaveDoEixo] ?? 0;
  const valorDoEixo = eixo ? eixo.valores[noCiclo(eixoPos, eixo.valores.length)] : undefined;

  const problema = fam.problema?.(valores) ?? null;
  const plano: Plano | null = useMemo(() => (problema ? null : fam.plano(valores, valorDoEixo)), [fam, valores, valorDoEixo, problema]);

  const live = useRef({ plano, bpm });
  live.current = { plano, bpm };

  const parar = useCallback(() => {
    clock.current?.stop();
    clock.current = null;
    setRunning(false);
    setConta(0);
    setPos(null);
  }, []);

  // mudou o plano (um controle, ou o modo do eixo): para, em vez de continuar com índices de outro plano
  useEffect(() => { parar(); }, [plano, parar]);
  useEffect(() => () => { clock.current?.stop(); }, []);
  useEffect(() => { if (clock.current) clock.current.bpm = bpm; }, [bpm]);

  // passar por um valor do eixo conta como tê-lo visto — informação, não meta (decisões 11 e 82)
  useEffect(() => {
    if (!valorDoEixo) return;
    setVistos(v => ((v[chaveDoEixo] ?? []).includes(valorDoEixo) ? v : { ...v, [chaveDoEixo]: [...(v[chaveDoEixo] ?? []), valorDoEixo] }));
  }, [chaveDoEixo, valorDoEixo]);

  // o que ficou no histórico: o andamento (que aqui é fixo, então é verdade) e as escolhas
  useToolLog(fam.id, itemText(t, fam.id, 'title'), fam.modulo, running, {
    settings: { bpm, ...valores, ...(valorDoEixo ? { modo: valorDoEixo } : {}) },
  });

  const alternar = () => {
    if (running) { parar(); return; }
    if (!live.current.plano) return;
    const c = new Clock(bpm, 1, (i, tempo) => {
      const L = live.current;
      if (!L.plano) return;
      if (i < CONTAGEM) {
        drum(i === 0 ? 'clique-forte' : 'clique', tempo, 0.8);
        atTime(tempo, () => setConta(i + 1));
        return;
      }
      const p = posicaoNoCiclo(L.plano, i - CONTAGEM);
      const compasso = L.plano[p.compasso];
      // O relógio troca de subdivisão NA PRIMEIRA célula do compasso novo: o intervalo que vem depois
      // dela já é o da subdivisão nova, e o que veio antes (da última célula do compasso anterior até
      // esta) continuou sendo o da subdivisão velha. Trocar na última célula errava o compasso inteiro.
      if (p.inicioDeCompasso && clock.current) clock.current.stepsPerBeat = compasso.porTempo;
      const som = somDaCelula(compasso.celulas[p.celula], p.inicioDeTempo);
      if (som) drum(som.drum, tempo, som.volume);
      atTime(tempo, () => { setConta(0); setPos({ compasso: p.compasso, celula: p.celula }); });
    });
    clock.current = c;
    c.start();
    setRunning(true);
  };

  const barra = plano ? plano[pos?.compasso ?? 0] : null;
  const alternarValor = (id: string, opcao: string, multi: boolean) =>
    setValores(v => {
      let novo: Valores;
      if (!multi) novo = { ...v, [id]: opcao };
      else {
        const atual = Array.isArray(v[id]) ? (v[id] as string[]) : [];
        novo = { ...v, [id]: atual.includes(opcao) ? atual.filter(x => x !== opcao) : [...atual, opcao] };
      }
      return fam.normalizar?.(novo) ?? novo;
    });

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gap: 14 }}>
        {fam.controles(valores).map(c => (
          <div key={c.id} style={{ display: 'grid', gap: 8 }}>
            <span className="eyebrow">{t(c.rotulo)}</span>
            <div className="row">
              {c.opcoes.map(o => {
                const atual = valores[c.id];
                const on = Array.isArray(atual) ? atual.includes(o.id) : atual === o.id;
                return <Chip key={o.id} on={on} onClick={() => alternarValor(c.id, o.id, !!c.multi)}>{o.chave ? t(o.chave) : o.texto}</Chip>;
              })}
            </div>
          </div>
        ))}
      </div>

      {eixo && valorDoEixo && (
        <EixoManual
          rotulo={eixo.rotulo} valor={eixo.mostrar(valorDoEixo)}
          vistos={(vistos[chaveDoEixo] ?? []).length} total={eixo.valores.length}
          onAnterior={() => setPosicoes(m => ({ ...m, [chaveDoEixo]: (m[chaveDoEixo] ?? 0) - 1 }))}
          onProximo={() => setPosicoes(m => ({ ...m, [chaveDoEixo]: (m[chaveDoEixo] ?? 0) + 1 }))}
          onSortear={() => setPosicoes(m => ({ ...m, [chaveDoEixo]: Math.floor(Math.random() * eixo.valores.length) }))}
        />
      )}

      {problema ? (
        <p className="panel muted" role="alert">{t(problema)}</p>
      ) : barra && (
        <div className="panel" style={{ display: 'grid', gap: 12 }} aria-live="polite">
          <b style={{ fontFamily: 'var(--display)', fontSize: 22 }}>
            {conta > 0 ? `${t('cadence.countIn')} ${conta}` : t(barra.agora.chave, barra.agora.vars)}
          </b>
          <div className="row" style={{ gap: 14 }} aria-hidden="true">
            {Array.from({ length: 4 }, (_, tempo) => (
              <div key={tempo} className="row" style={{ gap: 3, flexWrap: 'nowrap' }}>
                {barra.celulas.slice(tempo * barra.porTempo, (tempo + 1) * barra.porTempo).map((c, k) => {
                  const i = tempo * barra.porTempo + k;
                  const atual = pos?.compasso !== undefined && pos.celula === i;
                  return (
                    <span key={k} style={{
                      display: 'inline-grid', placeItems: 'center', width: 30, height: 30, borderRadius: 6, fontSize: 14, fontWeight: 700,
                      border: c === 'silencio' ? '1px dashed var(--rule)' : '1px solid var(--rule)',
                      background: c === 'forte' || c === 'ataque' ? 'var(--accent)' : c === 'segura' ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : c === 'corte' ? 'var(--ink)' : 'var(--surface)',
                      color: c === 'forte' || c === 'ataque' ? 'var(--ground)' : c === 'corte' ? 'var(--ground)' : 'var(--ink)',
                      outline: atual ? '3px solid var(--ink)' : 'none', outlineOffset: 2,
                    }}>{GLIFO[c]}</span>
                  );
                })}
              </div>
            ))}
          </div>
          {/* O aviso aparece durante o compasso ANTERIOR à mudança — é o ponto de T4 e T7. */}
          {running && barra.aviso && <p className="muted" style={{ margin: 0, fontWeight: 600 }}>{t(barra.aviso.chave, barra.aviso.vars)}</p>}
        </div>
      )}

      <div className="row">
        <Btn onClick={alternar} tone={running ? 'mu' : undefined} disabled={!plano}>{t(running ? 'cadence.stop' : 'cadence.start')}</Btn>
        <span className="num" style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 30 }}>♩ = {bpm}</span>
        <input className="range" style={{ maxWidth: 200 }} type="range" min={40} max={200} value={bpm}
          onChange={e => setBpm(Number(e.target.value))} aria-label={t('cadence.tempo')} />
      </div>
    </div>
  );
}
