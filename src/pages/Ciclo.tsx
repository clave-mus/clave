// O carrossel do ciclo de rotinas (P9). Mora em `/ciclo/:id/fazer`.
//
// "Abre o ciclo, faz a que está há mais tempo sem fazer, e se não estiver a fim, pula" — é por
// isso que a ORDEM vem de `ordenarPorAntiguidade` (routines/ciclo.ts, função pura e testada), e
// esta tela só desenha: rotinas lado a lado, arrasta ou toca numa lateral para trocar. Nenhum
// botão de "próxima/anterior" — o gesto é o mecanismo.
//
// "Fechar uma etapa reordena" não é código daqui: `Sessao.tsx` grava `ultimaPraticaEm` na rotina
// no momento em que a pessoa fecha a primeira etapa, e a próxima vez que este carrossel montar,
// a ordem já vem diferente — porque é a MESMA rotina lida do disco.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ordenarPorAntiguidade } from '../routines/ciclo';
import { useCiclos, useRotinas } from '../routines/hooks';
import { tempoTotal, type Rotina } from '../routines/types';
import { Btn } from '../components/ui';
import { useT } from '../i18n';
import NotFound from './NotFound';

const reduzMovimento = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Ciclo() {
  const { id = '' } = useParams();
  const ciclos = useCiclos();
  const rotinas = useRotinas();
  const ciclo = ciclos.find(c => c.id === id);
  if (!ciclo) return <NotFound />;

  const membros = ciclo.rotinaIds.map(rid => rotinas.find(r => r.id === rid)).filter((r): r is Rotina => !!r);
  const ordenadas = ordenarPorAntiguidade(membros);

  return <Carrossel nome={ciclo.nome} rotinas={ordenadas} />;
}

function Carrossel({ nome, rotinas }: { nome: string; rotinas: Rotina[] }) {
  const t = useT();
  const trilhaRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef(new Map<string, HTMLElement>());
  const [centroId, setCentroId] = useState<string | null>(rotinas[0]?.id ?? null);

  /**
   * Qual card está mais perto do centro da trilha, e quanto cada um se afastou dele (para a
   * escala e a opacidade das laterais). Escreve `--dist` direto no DOM — refazer isto a cada
   * pixel de scroll via estado do React re-renderizaria a tela inteira sem necessidade.
   *
   * **Usa `getBoundingClientRect`, não `offsetLeft`**: `offsetLeft` é relativo ao ancestral
   * POSICIONADO mais próximo, que não precisa ser a trilha — já deu posição errada num teste real.
   * `getBoundingClientRect` é sempre relativo à viewport, dos dois lados da comparação.
   */
  const atualizar = useCallback(() => {
    const trilha = trilhaRef.current;
    if (!trilha) return;
    const contRect = trilha.getBoundingClientRect();
    const meio = contRect.left + contRect.width / 2;
    let melhorId: string | null = null;
    let melhorDist = Infinity;
    cardsRef.current.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      const centro = r.left + r.width / 2;
      const dist = Math.abs(centro - meio);
      el.style.setProperty('--dist', String(Math.min(1, dist / (r.width * 0.9))));
      if (dist < melhorDist) { melhorDist = dist; melhorId = id; }
    });
    setCentroId(melhorId);
  }, []);

  // Direto no evento, sem passar por `requestAnimationFrame`: um rAF que nunca chega a rodar (a
  // aba em segundo plano, por exemplo) travaria a trilha para sempre no card errado — e o cálculo
  // aqui é barato (algumas leituras de `getBoundingClientRect`), não precisa da proteção.
  useEffect(() => {
    atualizar();
    const trilha = trilhaRef.current;
    if (!trilha) return;
    trilha.addEventListener('scroll', atualizar, { passive: true });
    return () => trilha.removeEventListener('scroll', atualizar);
  }, [atualizar, rotinas.length]);

  const irPara = (id: string) => {
    cardsRef.current.get(id)?.scrollIntoView({ behavior: reduzMovimento() ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
  };

  const guardarRef = (id: string) => (el: HTMLElement | null) => {
    if (el) cardsRef.current.set(id, el); else cardsRef.current.delete(id);
  };

  if (rotinas.length === 0) {
    return (
      <div className="empty">
        <h1>{nome}</h1>
        <p className="muted">{t('cycles.emptyCycle')}</p>
        <div><Btn to="/">{t('common.backHome')}</Btn></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Link to="/" className="eyebrow" style={{ textDecoration: 'none' }}>{t('editor.back')}</Link>
        <h1 style={{ margin: 0 }}>{nome}</h1>
      </div>
      <p className="muted">{t('cycles.carouselHint')}</p>

      <div ref={trilhaRef} className="ciclo-trilha" role="list" aria-label={nome}>
        {rotinas.map(r => {
          const ativo = r.id === centroId;
          const total = tempoTotal(r);
          const detalhe = t('editor.itemsOf', { n: r.etapas.length }) + (total ? ` · ${t('editor.minutes', { n: Math.round(total / 60) })}` : '');
          const conteudo = (
            <>
              <b>{r.nome}</b>
              <small className="muted">{detalhe}</small>
              {ativo && <div style={{ marginTop: 8 }}><Btn small to={`/rotina/${r.id}/fazer`}>{t('session.start')}</Btn></div>}
            </>
          );
          return ativo ? (
            <div key={r.id} ref={guardarRef(r.id)} className="ciclo-card on" role="listitem">{conteudo}</div>
          ) : (
            <button key={r.id} type="button" ref={guardarRef(r.id)} className="ciclo-card" role="listitem"
              onClick={() => irPara(r.id)} aria-label={r.nome}>
              {conteudo}
            </button>
          );
        })}
      </div>
    </div>
  );
}
