// Receber uma rotina por link (F3-7, decisão 23).
//
// **Não pede conta**, e isso não é conveniência: é o que faz o link funcionar como forma de passar
// uma rotina adiante. A rotina viaja dentro do próprio link, então não há servidor envolvido, nada
// para moderar e nada para apagar — que é o limite inteiro da decisão 23.
//
// A tela mostra **o que a rotina tem antes de adotar**, porque adotar é um gesto com consequência
// (uma rotina nova na lista de quem recebeu), e porque link que a pessoa não entende ela não abre.
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { itemById } from '../catalog';
import { useContent } from '../data/localized';
import { resumoDaEtapa } from '../catalog/resumo';
import { useGlobalParams } from '../catalog/params';
import type { Ctx } from '../catalog/types';
import { doLink } from '../routines/share';
import { copiarRotina, gravarRotinas } from '../routines/storage';
import { useRotinas } from '../routines/hooks';
import { tempoTotal } from '../routines/types';
import { Btn, Tag } from '../components/ui';
import { useLocale, useNaming, useT } from '../i18n';

export default function Recebida() {
  const { dados = '' } = useParams();
  const t = useT();
  const naming = useNaming();
  const locale = useLocale();
  const params = useGlobalParams();
  const { moduleById } = useContent();
  const rotinas = useRotinas();
  const navigate = useNavigate();
  const ctx: Ctx = { naming, conv: locale, t, params };

  const lido = useMemo(() => doLink(dados), [dados]);

  if (!lido) {
    return (
      <div className="empty">
        <h1>{t('routines.recebidaBad')}</h1>
        <p className="muted">{t('routines.recebidaBadText')}</p>
        <div className="row" style={{ justifyContent: 'center' }}><Btn to="/">{t('common.backHome')}</Btn></div>
      </div>
    );
  }

  const { rotina, autor } = lido;
  const total = tempoTotal(rotina);
  // Item que este Clave não conhece: avisa e **mantém a etapa**. Tirar silenciosamente faria a cópia
  // ser diferente do que a outra pessoa montou, sem dizer isso a ninguém.
  const faltando = rotina.etapas.flatMap(e => e.instancias.map(i => i.itemId)).filter(id => !itemById[id]);

  /** Adotar cria a cópia de quem recebeu, com crédito à origem (decisão 9). */
  const adotar = () => {
    const minha = copiarRotina(rotina, autor);
    gravarRotinas([...rotinas, minha]);
    navigate(`/rotina/${minha.id}`);
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Tag>{t('routines.recebidaTag')}</Tag>
      <h1>{rotina.nome}</h1>
      {rotina.notas && <p className="muted">{rotina.notas}</p>}
      <p className="muted">
        {autor ? `${t('routines.recebidaFrom', { autor })} ` : ''}
        {t('editor.itemsOf', { n: rotina.etapas.length })}
        {total ? ` · ${t('editor.minutes', { n: Math.round(total / 60) })}` : ''}
        {` · ${t(rotina.modo === 'guiado' ? 'editor.guided' : 'editor.free')}`}
      </p>

      {[...new Set(faltando)].map(id => (
        <p key={id} className="muted note-line">{t('routines.recebidaMissing', { item: id })}</p>
      ))}

      <section style={{ display: 'grid', gap: 8 }}>
        <span className="eyebrow">{t('routines.recebidaWhat')}</span>
        {rotina.etapas.map((e, k) => {
          const { titulo, detalhe } = resumoDaEtapa(e.instancias, id => itemById[id], ctx);
          const item = itemById[e.instancias[0].itemId];
          return (
            <div key={e.id} className="list-row">
              <div style={{ minWidth: 0 }}>
                <b>{k + 1}. {titulo}</b>
                {detalhe && <span className="muted"> · {detalhe}</span>}
                {item && <span className="muted"> · {moduleById[item.primaryModule].name}</span>}
              </div>
              <span className="num muted">{e.segundosSugeridos ? t('editor.minutes', { n: Math.round(e.segundosSugeridos / 60) }) : ''}</span>
            </div>
          );
        })}
      </section>

      <div className="row">
        <Btn onClick={adotar}>{t('routines.recebidaAdopt')}</Btn>
        <Btn tone="ghost" to="/">{t('common.backHome')}</Btn>
      </div>
    </div>
  );
}
