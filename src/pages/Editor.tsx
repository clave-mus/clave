// O editor de rotinas (F3-5, decisões 95 e 97). Mora em `/rotina/:id`.
//
// **A lista nunca tem mais de dois níveis** (decisão aprovada na Q40): a rotina tem etapas, e o rodízio
// é uma gaveta DENTRO de uma etapa — não um lugar para onde se navega. Era o desafio de design da
// tarefa: mostrar etapa-com-várias-instâncias sem virar árvore de três níveis.
//
// **O rodízio não tem nome na interface**, de propósito: a linha diz o que varia ("3 tonalidades",
// "3 itens") e a gaveta mostra a lista. Nomear um mecanismo interno é como a metáfora de academia
// entrou — um conceito vira vocabulário, e o vocabulário vira navegação.
//
// Toda operação é função pura de `src/routines/edicao.ts`; aqui só há tela e estado de abertura.
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { itemById, ITEMS } from '../catalog';
import { companheirosDe } from '../catalog/grupos';
import { useGlobalParams } from '../catalog/params';
import { estadoDe, visivel } from '../catalog/publicacao';
import { REGIOES } from '../catalog/regioes';
import { resumoDaConfiguracao, resumoDaPratica } from '../catalog/resumo';
import type { Ctx } from '../catalog/types';
import {
  acrescentarInstancia, alterarEtapa, alterarInstancia, alterarRotina, anexarInstancia, aplicarATodas,
  duplicarRotina, gerarVariantes, moverEtapa, removerEtapa, removerInstancia,
} from '../routines/edicao';
import { useRotinas } from '../routines/hooks';
import { apagarRotina, gravarRotinas } from '../routines/storage';
import { tempoTotal, type Etapa, type Rotina } from '../routines/types';
import { keyName } from '../theory/core';
import { Btn, Chip, SecTitle } from '../components/ui';
import { useContent } from '../data/localized';
import { MODULE_LIST } from '../data/modules';
import { useRevisao } from '../state/store';
import { itemText, useLocale, useNaming, useT } from '../i18n';
import NotFound from './NotFound';

const TEMPOS = [0, 300, 600, 900, 1200];
const DOZE = Array.from({ length: 12 }, (_, pc) => ({ key: { tonic: pc, mode: 'maior' as const } }));

export default function Editor() {
  const { id = '' } = useParams();
  const rotinas = useRotinas();
  const rotina = rotinas.find(r => r.id === id);
  if (!rotina) return <NotFound />;
  return <Corpo rotina={rotina} rotinas={rotinas} />;
}

function Corpo({ rotina, rotinas }: { rotina: Rotina; rotinas: Rotina[] }) {
  const t = useT();
  const naming = useNaming();
  const locale = useLocale();
  const params = useGlobalParams();
  const revisao = useRevisao();
  const navigate = useNavigate();
  const { moduleById } = useContent();
  const ctx: Ctx = useMemo(() => ({ naming, conv: locale, t, params }), [naming, locale, t, params]);

  const [aberta, setAberta] = useState<string | null>(null);
  const [escolhendo, setEscolhendo] = useState<{ etapaId: string | null } | null>(null);
  const [apagando, setApagando] = useState(false);

  const grava = (rs: Rotina[]) => gravarRotinas(rs);
  const podeVer = (itemId: string) => visivel(itemById[itemId]?.publicacao, revisao);
  const total = tempoTotal(rotina);

  /** O que a linha da etapa diz: nunca um valor que mudaria a cada execução. */
  const resumoDaEtapa = (e: Etapa) => {
    const [primeira] = e.instancias;
    const item = itemById[primeira.itemId];
    if (!item) return { titulo: primeira.itemId, detalhe: '' };
    const titulo = itemText(t, item.id, 'title');
    if (e.instancias.length === 1) {
      return { titulo, detalhe: [resumoDaPratica(primeira.params, ctx), resumoDaConfiguracao(item, primeira.settings, ctx)].filter(Boolean).join(' · ') };
    }
    // com rodízio, a linha diz O QUE varia — mostrar "Fá maior" seria mentira em metade das execuções
    const umItemSo = new Set(e.instancias.map(i => i.itemId)).size === 1;
    const chave = umItemSo ? 'editor.variantsOf' : 'editor.itemsOf';
    return { titulo: umItemSo ? titulo : t('editor.steps'), detalhe: t(chave, { n: e.instancias.length }) };
  };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Tudo grava a cada mudança, então "Pronto" é só sair — mas a pessoa precisa de um fim claro. */}
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <Link to="/" className="eyebrow" style={{ textDecoration: 'none' }}>{t('editor.back')}</Link>
        <div className="row">
          {rotina.etapas.length > 0 && <Btn small tone="ghost" to={`/rotina/${rotina.id}/fazer`}>{t('session.start')}</Btn>}
          <Btn small to="/">{t('editor.done')}</Btn>
        </div>
      </div>

      <section style={{ display: 'grid', gap: 14 }}>
        <label style={{ display: 'grid', gap: 6, maxWidth: 420 }}>
          <span className="eyebrow">{t('editor.rename')}</span>
          <input value={rotina.nome} maxLength={60} onChange={e => grava(alterarRotina(rotinas, rotina.id, { nome: e.target.value }))}
            style={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)', color: 'var(--ink)', padding: '10px 12px', font: 'inherit', fontSize: 20, fontFamily: 'var(--display)' }} />
        </label>

        <div className="row">
          <span className="eyebrow">{t('editor.mode')}</span>
          <Chip on={rotina.modo === 'guiado'} onClick={() => grava(alterarRotina(rotinas, rotina.id, { modo: 'guiado' }))}>{t('editor.guided')}</Chip>
          <Chip on={rotina.modo === 'livre'} onClick={() => grava(alterarRotina(rotinas, rotina.id, { modo: 'livre' }))}>{t('editor.free')}</Chip>
          <span className="muted">{t(rotina.modo === 'guiado' ? 'editor.modeGuidedHint' : 'editor.modeFreeHint')}</span>
        </div>

        <label className="switch">
          <input type="checkbox" checked={rotina.embaralhar} onChange={e => grava(alterarRotina(rotinas, rotina.id, { embaralhar: e.target.checked }))} />
          {t('editor.shuffle')}
        </label>

        {/* "Tempo somado" só existe na guiada: somar no modo livre seria mentira (tempoTotal devolve null) */}
        {total !== null && total > 0 && <span className="muted">{t('editor.total', { n: Math.round(total / 60) })}</span>}
      </section>

      <section style={{ display: 'grid', gap: 12 }}>
        <SecTitle>{t('editor.steps')}</SecTitle>

        {rotina.etapas.length === 0 && <p className="muted">{t('editor.empty')}</p>}

        {rotina.etapas.map((e, idx) => {
          const { titulo, detalhe } = resumoDaEtapa(e);
          const aberto = aberta === e.id;
          const umItemSo = new Set(e.instancias.map(i => i.itemId)).size === 1;
          const temTonalidade = e.instancias.some(i => i.params?.key);
          return (
            <div key={e.id} className="panel" style={{ display: 'grid', gap: 10 }}>
              <div className="row" style={{ justifyContent: 'space-between', gap: 10 }}>
                <button type="button" onClick={() => setAberta(aberto ? null : e.id)}
                  style={{ background: 'none', border: 0, color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer', display: 'grid', gap: 2, flex: 1, minWidth: 0, padding: 0 }}>
                  <b>{idx + 1}. {titulo}</b>
                  <small className="muted">
                    {[detalhe, e.instancias.length > 1 ? t(e.politica === 'ordem' ? 'editor.inOrder' : 'editor.shuffled') : '',
                      rotina.modo === 'guiado' ? (e.segundosSugeridos ? t('editor.minutes', { n: Math.round(e.segundosSugeridos / 60) }) : t('editor.noTime')) : '',
                    ].filter(Boolean).join(' · ')}
                  </small>
                </button>
                <div className="row" style={{ flex: 'none' }}>
                  <button type="button" className="card-x" aria-label={t('editor.moveUp')} disabled={idx === 0}
                    onClick={() => grava(moverEtapa(rotinas, rotina.id, idx, idx - 1))}>↑</button>
                  <button type="button" className="card-x" aria-label={t('editor.moveDown')} disabled={idx === rotina.etapas.length - 1}
                    onClick={() => grava(moverEtapa(rotinas, rotina.id, idx, idx + 1))}>↓</button>
                  <button type="button" className="card-x" aria-label={t('editor.removeStep')}
                    onClick={() => grava(removerEtapa(rotinas, rotina.id, e.id))}>×</button>
                </div>
              </div>

              {aberto && (
                <div style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
                  {e.instancias.length > 1 && (
                    <div className="row">
                      <Chip on={e.politica === 'ordem'} onClick={() => grava(alterarEtapa(rotinas, rotina.id, e.id, { politica: 'ordem' }))}>{t('editor.inOrder')}</Chip>
                      <Chip on={e.politica !== 'ordem'} onClick={() => grava(alterarEtapa(rotinas, rotina.id, e.id, { politica: 'sorteio-sem-repetir' }))}>{t('editor.shuffled')}</Chip>
                    </div>
                  )}

                  <div style={{ display: 'grid', gap: 6 }}>
                    {e.instancias.map((inst, i) => {
                      const item = itemById[inst.itemId];
                      const nome = item ? itemText(t, item.id, 'title') : inst.itemId;
                      const detalhes = item ? [resumoDaPratica(inst.params, ctx), resumoDaConfiguracao(item, inst.settings, ctx)].filter(Boolean).join(' · ') : '';
                      return (
                        <div key={i} className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ minWidth: 0 }}>
                            {e.instancias.length > 1 && <span className="muted">{i + 1}. </span>}
                            {nome}{detalhes && <span className="muted"> · {detalhes}</span>}
                            {item && estadoDe(item.publicacao) === 'rascunho' && <span className="mini-tag" style={{ marginLeft: 6 }}>{t('review.draft')}</span>}
                          </span>
                          <button type="button" className="card-x" aria-label={t('editor.removeVariant')} disabled={e.instancias.length <= 1}
                            title={e.instancias.length <= 1 ? t('editor.lastVariant') : undefined}
                            onClick={() => grava(removerInstancia(rotinas, rotina.id, e.id, i))}>×</button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="row">
                    <Btn small tone="ghost" onClick={() => setEscolhendo({ etapaId: e.id })}>{t('editor.addFromCatalog')}</Btn>
                    {umItemSo && (
                      <Btn small tone="ghost" onClick={() => grava(gerarVariantes(rotinas, rotina.id, e.id, 0, DOZE))}>{t('editor.generate')}</Btn>
                    )}
                    {e.instancias.length > 1 && (
                      <Btn small tone="ghost" onClick={() => grava(aplicarATodas(rotinas, rotina.id, e.id, { key: e.instancias[0].params?.key ?? null }))}>{t('editor.applyToAll')}</Btn>
                    )}
                  </div>

                  {/* Companheiros de grupo: atalho, nunca a única via (decisão 95) */}
                  {(() => {
                    const comp = companheirosDe(e.instancias[0].itemId, podeVer).filter(c => !e.instancias.some(i => i.itemId === c));
                    if (!comp.length) return null;
                    return (
                      <div style={{ display: 'grid', gap: 6 }}>
                        <span className="eyebrow">{t('editor.sameGroup')}</span>
                        <div className="row">
                          {comp.map(c => (
                            <Chip key={c} onClick={() => grava(acrescentarInstancia(rotinas, rotina.id, e.id, c, itemById[c]?.defaults ?? {}))}>
                              {itemText(t, c, 'title')}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {rotina.modo === 'guiado' && (
                    <div style={{ display: 'grid', gap: 6 }}>
                      <span className="eyebrow">{t('editor.stepTime')}</span>
                      <div className="row">
                        {TEMPOS.map(s => (
                          <Chip key={s} on={(e.segundosSugeridos ?? 0) === s}
                            onClick={() => grava(alterarEtapa(rotinas, rotina.id, e.id, { segundosSugeridos: s || undefined }))}>
                            {s ? t('editor.minutes', { n: s / 60 }) : t('editor.noTime')}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* A colisão da decisão 97: a instância vence a rotação, e a pessoa precisa saber */}
                  {rotina.rotacao?.param === 'tonalidade' && temTonalidade && (
                    <p className="muted" style={{ margin: 0 }} role="note">{t('editor.rotationOff')}</p>
                  )}

                  {e.instancias.length === 1 && (
                    <div style={{ display: 'grid', gap: 6 }}>
                      <span className="eyebrow">{t('practice.key')}</span>
                      <div className="row">
                        <Chip on={!e.instancias[0].params?.key} onClick={() => grava(alterarInstancia(rotinas, rotina.id, e.id, 0, { key: null }))}>{t('practice.keyFree')}</Chip>
                        {Array.from({ length: 12 }, (_, pc) => (
                          <Chip key={pc} on={e.instancias[0].params?.key?.tonic === pc}
                            onClick={() => grava(alterarInstancia(rotinas, rotina.id, e.id, 0, { key: { tonic: pc, mode: e.instancias[0].params?.key?.mode ?? 'maior' } }))}>
                            {keyName(pc, naming)}
                          </Chip>
                        ))}
                      </div>
                      <div className="row">
                        {REGIOES.map(r => (
                          <Chip key={r.id} on={e.instancias[0].params?.range?.lo === r.lo}
                            onClick={() => grava(alterarInstancia(rotinas, rotina.id, e.id, 0, { range: { lo: r.lo, hi: r.hi } }))}>
                            {t(`practice.region_${r.id}`)}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="row">
          <Btn small onClick={() => setEscolhendo({ etapaId: null })}>{t('editor.addStep')}</Btn>
        </div>
      </section>

      {escolhendo && (
        <section className="panel" style={{ display: 'grid', gap: 10 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>{t('editor.pick')}</b>
            <Btn small tone="ghost" onClick={() => setEscolhendo(null)}>{t('editor.cancel')}</Btn>
          </div>
          {MODULE_LIST.map(m => {
            const doModulo = ITEMS.filter(i => i.primaryModule === m.id && visivel(i.publicacao, revisao));
            if (!doModulo.length) return null;
            return (
              <div key={m.id} style={{ display: 'grid', gap: 6 }}>
                <span className="eyebrow">{moduleById[m.id].name}</span>
                <div className="row">
                  {doModulo.map(i => (
                <Chip key={i.id} onClick={() => {
                  const alvo = escolhendo.etapaId;
                  grava(alvo
                    ? acrescentarInstancia(rotinas, rotina.id, alvo, i.id, i.defaults)
                    : (() => { const r = anexarInstancia(rotinas, { rotinaId: rotina.id }, i.id, i.defaults); return r.ok ? r.rotinas : rotinas; })());
                  setEscolhendo(null);
                  if (!alvo) setAberta(null);
                }}>
                  {itemText(t, i.id, 'title')}
                  {estadoDe(i.publicacao) === 'rascunho' ? ` · ${t('review.draft')}` : ''}
                </Chip>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      <section className="row">
        <Btn small tone="ghost" onClick={() => {
          const d = duplicarRotina(rotinas, rotina.id, t('editor.copyOf', { name: rotina.nome }));
          if (d.ok) { gravarRotinas(d.rotinas); navigate(`/rotina/${d.rotina.id}`); }
        }}>{t('editor.duplicate')}</Btn>
        {!apagando ? (
          <Btn small tone="ghost" onClick={() => setApagando(true)}>{t('editor.delete')}</Btn>
        ) : (
          <>
            <span className="muted">{t('editor.deleteConfirm', { name: rotina.nome })}</span>
            <Btn small tone="ghost" onClick={() => { apagarRotina(rotina.id); navigate('/'); }}>{t('editor.delete')}</Btn>
            <Btn small tone="mu" onClick={() => setApagando(false)}>{t('editor.keep')}</Btn>
          </>
        )}
      </section>
    </div>
  );
}
