// "Salvar numa rotina" — guarda o exercício com a configuração de agora (decisões 36 e 37 desta fase).
//
// Existe porque a configuração é o trabalho (Fá maior, só terças e sextas, linhas suplementares) e
// era justamente a parte que evaporava: o arsenal guarda só o id do item. O "copiar link" era o
// único jeito de uma configuração sobreviver ao fim da sessão — um atalho em volta da falta disto.
//
// **Não é o editor de rotinas** (F3-5). Só duas coisas: escolher uma rotina ou criar uma, e anexar
// a etapa. Reordenar, dar tempo, modo livre/guiado e rotação são desenho do Paulo e ficam lá.
import { useEffect, useRef, useState } from 'react';
import { anexarInstancia, type Destino } from '../routines/edicao';
import { useRotinas } from '../routines/hooks';
import { gravarRotinas } from '../routines/storage';
import { Btn, Chip } from './ui';
import { useT } from '../i18n';

interface Props {
  itemId: string;
  /** A configuração de AGORA — a que a pessoa está usando, não a que ficou guardada no item. */
  settings: Record<string, unknown>;
}

export default function SalvarNaRotina({ itemId, settings }: Props) {
  const t = useT();
  const rotinas = useRotinas();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [aviso, setAviso] = useState('');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const salvar = (destino: Destino) => {
    const r = anexarInstancia(rotinas, destino, itemId, settings);
    if (!r.ok) return;
    gravarRotinas(r.rotinas);
    setAberto(false);
    setNome('');
    setAviso(t('routines.savedIn', { name: r.rotina.nome }));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAviso(''), 2600);
  };

  return (
    <>
      {/* o rótulo NÃO troca para "Fechar": ao lado de "Personalizar" não daria para saber qual painel ele fecha */}
      <Btn small tone={aberto ? undefined : 'ghost'} onClick={() => setAberto(v => !v)}>{t('routines.save')}</Btn>

      {aberto && (
        <div className="panel" style={{ display: 'grid', gap: 12, flexBasis: '100%' }}>
          <span className="muted">{t('routines.saveHint')}</span>

          {rotinas.length > 0 && (
            <div style={{ display: 'grid', gap: 8 }}>
              <span className="eyebrow">{t('routines.saveWhich')}</span>
              <div className="row">
                {rotinas.map(r => <Chip key={r.id} onClick={() => salvar({ rotinaId: r.id })}>{r.nome}</Chip>)}
              </div>
            </div>
          )}

          <form style={{ display: 'grid', gap: 8 }} onSubmit={e => { e.preventDefault(); salvar({ nome }); }}>
            <label style={{ display: 'grid', gap: 6, maxWidth: 360 }}>
              <span className="eyebrow">{t('routines.saveNew')}</span>
              <input value={nome} onChange={e => setNome(e.target.value)} placeholder={t('routines.saveNamePlaceholder')} maxLength={60}
                style={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)', color: 'var(--ink)', padding: '10px 12px', font: 'inherit', fontSize: 16 }} />
            </label>
            <div><Btn small type="submit" disabled={!nome.trim()}>{t('routines.saveCreate')}</Btn></div>
          </form>
        </div>
      )}

      {aviso && <div className="toast" role="status">{aviso}</div>}
    </>
  );
}
