// O editor de um ciclo de rotinas (P9). Mora em `/ciclo/:id`.
//
// Um ciclo é uma LISTA CURADA e nomeada de rotinas (pode haver mais de um) — não "todas as suas
// rotinas". Esta tela só faz duas coisas: nomear, e marcar quais rotinas entram. A ORDEM de
// exibição não se escolhe aqui — quem decide é `ordenarPorAntiguidade` (routines/ciclo.ts), na
// hora de abrir o carrossel.
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCiclos, useRotinas } from '../routines/hooks';
import { apagarCiclo, salvarCiclo } from '../routines/storage';
import type { Ciclo } from '../routines/types';
import { Btn, Chip } from '../components/ui';
import { useT } from '../i18n';
import NotFound from './NotFound';

export default function CicloEditor() {
  const { id = '' } = useParams();
  const ciclos = useCiclos();
  const ciclo = ciclos.find(c => c.id === id);
  if (!ciclo) return <NotFound />;
  return <Corpo ciclo={ciclo} />;
}

function Corpo({ ciclo }: { ciclo: Ciclo }) {
  const t = useT();
  const navigate = useNavigate();
  const rotinas = useRotinas();
  const [apagando, setApagando] = useState(false);

  const grava = (c: Ciclo) => salvarCiclo(c);
  const alternar = (rotinaId: string) => {
    const dentro = ciclo.rotinaIds.includes(rotinaId);
    grava({ ...ciclo, rotinaIds: dentro ? ciclo.rotinaIds.filter(x => x !== rotinaId) : [...ciclo.rotinaIds, rotinaId] });
  };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <Link to="/" className="eyebrow" style={{ textDecoration: 'none' }}>{t('editor.back')}</Link>
        <div className="row">
          {ciclo.rotinaIds.length > 0 && <Btn small tone="ghost" to={`/ciclo/${ciclo.id}/fazer`}>{t('cycles.enter')}</Btn>}
          <Btn small to="/">{t('editor.done')}</Btn>
        </div>
      </div>

      <label style={{ display: 'grid', gap: 6, maxWidth: 420 }}>
        <span className="eyebrow">{t('cycles.rename')}</span>
        <input value={ciclo.nome} maxLength={60} onChange={e => grava({ ...ciclo, nome: e.target.value })}
          style={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 'var(--r-sm)', color: 'var(--ink)', padding: '10px 12px', font: 'inherit', fontSize: 20, fontFamily: 'var(--display)' }} />
      </label>

      <section style={{ display: 'grid', gap: 12 }}>
        <span className="eyebrow">{t('cycles.pickRoutines')}</span>
        {rotinas.length === 0 ? (
          <p className="muted">{t('cycles.noRoutinesYet')}</p>
        ) : (
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {rotinas.map(r => (
              <Chip key={r.id} on={ciclo.rotinaIds.includes(r.id)} onClick={() => alternar(r.id)}>{r.nome}</Chip>
            ))}
          </div>
        )}
        {rotinas.length > 0 && ciclo.rotinaIds.length === 0 && <p className="muted">{t('cycles.emptyCycle')}</p>}
      </section>

      <section className="row">
        {!apagando ? (
          <Btn small tone="ghost" onClick={() => setApagando(true)}>{t('cycles.deleteCycle')}</Btn>
        ) : (
          <>
            <span className="muted">{t('editor.deleteConfirm', { name: ciclo.nome })}</span>
            <Btn small tone="ghost" onClick={() => { apagarCiclo(ciclo.id); navigate('/'); }}>{t('cycles.deleteCycle')}</Btn>
            <Btn small tone="mu" onClick={() => setApagando(false)}>{t('editor.keep')}</Btn>
          </>
        )}
      </section>
    </div>
  );
}
