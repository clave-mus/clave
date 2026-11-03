// Peças de interface reaproveitadas em todas as telas.
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** Soma simples e estável do texto, para a mesma semente dar sempre o mesmo campo. */
function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Um bloco de campo: a peça decorativa do estilo Campo, no lugar das ilustrações (decisão 2).
 *
 * Dois gradientes radiais numa cor, com granulação por cima. A `seed` move os centros, então
 * cada módulo, gênero e instrumento ganha um campo próprio e **estável** — sem nenhum asset.
 *
 * A regra da direção vale aqui: isto é fundo e emblema, **nunca** botão, ícone ou cartão clicável.
 */
export function Field({ seed, color = 'var(--accent)', className, style, label }: {
  seed: string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  label?: ReactNode;
}) {
  const h = hash(seed);
  const x1 = 18 + (h % 60);
  const y1 = 10 + ((h >> 6) % 55);
  const x2 = 20 + ((h >> 12) % 65);
  const y2 = 40 + ((h >> 18) % 55);
  return (
    <div
      className={`field-block ${className ?? ''}`}
      style={{
        ...style,
        // a cor entra duas vezes, em opacidades diferentes, para o campo ter profundidade
        backgroundImage:
          `radial-gradient(62% 62% at ${x1}% ${y1}%, color-mix(in srgb, ${color} 78%, transparent) 0%, transparent 68%),` +
          `radial-gradient(54% 54% at ${x2}% ${y2}%, color-mix(in srgb, ${color} 34%, transparent) 0%, transparent 66%)`,
      }}
      aria-hidden={label ? undefined : true}
    >
      {label && <span className="field-label">{label}</span>}
    </div>
  );
}
export function Tag({ children, tone }: { children: ReactNode; tone?: 'co' | 've' | 'dark' }) {
  return <span className={`tag ${tone ?? ''}`}><span>{children}</span></span>;
}
export function Btn({ children, to, onClick, tone, small, disabled, type = 'button', id, label }: {
  children: ReactNode; to?: string; onClick?: () => void; tone?: 'ghost' | 'mu' | 'co'; small?: boolean; disabled?: boolean; type?: 'button' | 'submit'; id?: string; label?: string;
}) {
  const cls = `btn ${tone ?? ''} ${small ? 'small' : ''}`;
  if (to) return <Link className={cls} to={to} id={id} aria-label={label}><span>{children}</span></Link>;
  return <button className={cls} type={type} onClick={onClick} disabled={disabled} id={id} aria-label={label} title={label}><span>{children}</span></button>;
}
export function Chip({ on, onClick, children, disabled, title }: { on?: boolean; onClick?: () => void; children: ReactNode; disabled?: boolean; title?: string }) {
  return <button type="button" className={`chip ${on ? 'on' : ''}`} onClick={onClick} aria-pressed={on} disabled={disabled} title={title}><span>{children}</span></button>;
}
export function SecTitle({ children, link }: { children: ReactNode; link?: { to: string; label: string } }) {
  return <div className="sec-title"><h2>{children}</h2>{link && <Link to={link.to}>{link.label} →</Link>}</div>;
}
export function PageHead({ tag, title, sub, aside }: { tag: string; title: ReactNode; sub?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="page-head">
      <div><Tag>{tag}</Tag><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {aside}
    </header>
  );
}
export function PlayIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4 L20 12 L7 20 Z" fill="currentColor" /></svg>;
}

export const fmtMin = (seconds: number) => {
  const m = Math.round(seconds / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
};
