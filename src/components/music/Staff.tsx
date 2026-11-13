// Pauta desenhada em SVG: linhas brancas finas sobre cor, como as cordas do contrabaixo da referência.
import { useState } from 'react';
import { clefBottom, keyAccidentals, keySignatureSteps, type Clef, type Note, step as stepOf } from '../../theory/core';
import { useT } from '../../i18n';

export const CLEF_PATH = 'M58,190 C48,206 66,214 76,204 C86,194 80,170 76,140 L62,34 C60,16 78,10 80,28 C84,52 52,70 42,92 C30,118 34,150 62,154 C88,156 98,130 84,116 C70,102 48,110 52,130 C54,140 64,144 70,138';

export interface StaffNote {
  note: Note;
  color?: string;
}
export interface StaffColumn {
  notes: StaffNote[];
  kind?: 'whole' | 'quarter';
  barAfter?: boolean;
}
interface Props {
  clef: Clef;
  fifths?: number;
  columns: StaffColumn[];
  timeSig?: [number, number];
  cursor?: number | null;
  colWidth?: number;
  onPick?: (step: number) => void;
  ghostAcc?: number;
  label?: string;
}

const H = 6; // meio espaço
const BASE = 112; // y da linha de baixo
const INK = 'var(--staff-ink, #f4e8d0)';

export function Sharp({ x, y, c = INK }: { x: number; y: number; c?: string }) {
  return <g stroke={c} strokeLinecap="butt">
    <path d={`M${x - 2.5},${y - 11} L${x - 2.5},${y + 9} M${x + 2.5},${y - 12} L${x + 2.5},${y + 8}`} strokeWidth="1.4" />
    <path d={`M${x - 6},${y - 2} L${x + 6},${y - 5.5} M${x - 6},${y + 4.5} L${x + 6},${y + 1}`} strokeWidth="3" />
  </g>;
}
export function Flat({ x, y, c = INK }: { x: number; y: number; c?: string }) {
  return <g>
    <path d={`M${x - 3},${y - 17} L${x - 3},${y + 5}`} stroke={c} strokeWidth="1.5" />
    <path d={`M${x - 3},${y + 5} C${x + 8},${y - 1} ${x + 8},${y - 9} ${x - 3},${y - 3}`} fill="none" stroke={c} strokeWidth="2.4" />
  </g>;
}
export function Natural({ x, y, c = INK }: { x: number; y: number; c?: string }) {
  return <g stroke={c}>
    <path d={`M${x - 3},${y - 12} L${x - 3},${y + 5} M${x + 3},${y - 5} L${x + 3},${y + 12}`} strokeWidth="1.4" />
    <path d={`M${x - 3},${y + 1} L${x + 3},${y - 1} M${x - 3},${y + 6} L${x + 3},${y + 4}`} strokeWidth="3" />
  </g>;
}
export function AccGlyph({ acc, x, y, c }: { acc: number; x: number; y: number; c?: string }) {
  if (acc === 1) return <Sharp x={x} y={y} c={c} />;
  if (acc === -1) return <Flat x={x} y={y} c={c} />;
  if (acc === 2) return <g><Sharp x={x - 6} y={y} c={c} /><Sharp x={x + 5} y={y} c={c} /></g>;
  if (acc === -2) return <g><Flat x={x - 6} y={y} c={c} /><Flat x={x + 4} y={y} c={c} /></g>;
  return <Natural x={x} y={y} c={c} />;
}

function ClefGlyph({ clef }: { clef: Clef }) {
  if (clef === 'sol') {
    return <g transform="translate(-4,46) scale(0.42)"><path d={CLEF_PATH} fill="none" stroke={INK} strokeWidth="7.5" strokeLinecap="round" /><circle cx="55" cy="192" r="8" fill={INK} /></g>;
  }
  const y = BASE - 36;
  return <g>
    <circle cx="12" cy={y} r="4.6" fill={INK} />
    <path d={`M12,${y} C9,${y - 12} 22,${y - 18} 30,${y - 14} C41,${y - 9} 38,${y + 8} 28,${y + 18} C22,${y + 24} 14,${y + 28} 6,${y + 32}`} fill="none" stroke={INK} strokeWidth="3.4" />
    <circle cx="41" cy={y - 6} r="2.6" fill={INK} /><circle cx="41" cy={y + 6} r="2.6" fill={INK} />
  </g>;
}

/** Pixels na tela por unidade do `viewBox`. Um fator só para toda pauta: é o que faz a nota ter o
 *  mesmo tamanho em todo o app (ver o comentário no `style` abaixo). 2,9 mantém a pauta mais larga
 *  no tamanho que ela já tinha. */
const ESCALA = 2.9;

export default function Staff({ clef, fifths = 0, columns, timeSig, cursor = null, colWidth = 58, onPick, ghostAcc = 0, label }: Props) {
  const t = useT();
  const bottom = clefBottom(clef);
  const y = (s: number) => BASE - (s - bottom) * H;
  const keySteps = keySignatureSteps(fifths, clef);
  const keyAcc = keyAccidentals(fifths);
  const startKey = 50;
  const startTime = startKey + keySteps.length * 11 + (keySteps.length ? 8 : 0);
  const startCols = startTime + (timeSig ? 30 : 6);
  const width = startCols + columns.length * colWidth + 14;
  const [ghost, setGhost] = useState<number | null>(null);

  const stepFromEvent = (ev: React.PointerEvent<SVGSVGElement>) => {
    const svg = ev.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const s = bottom + Math.round((BASE - p.y) / H);
    return Math.max(bottom - 7, Math.min(bottom + 15, s));
  };

  const ledgers = (s: number, cx: number, c: string) => {
    const out: React.ReactNode[] = [];
    for (let l = bottom - 2; l >= s; l -= 2) out.push(<path key={'b' + l} d={`M${cx - 13},${y(l)} H${cx + 13}`} stroke={c} strokeWidth="1.3" />);
    for (let l = bottom + 10; l <= s; l += 2) out.push(<path key={'t' + l} d={`M${cx - 13},${y(l)} H${cx + 13}`} stroke={c} strokeWidth="1.3" />);
    return out;
  };

  return (
    <svg
      className="staff-svg"
      viewBox={`0 0 ${width} 176`}
      role="img"
      aria-label={label ?? t('music.staff')}
      /**
       * A largura máxima é **proporcional ao `viewBox`**, e isso é o que mantém a escala igual
       * entre uma pauta e outra. Era `max(width * 2, 320)`, e o piso de 320 criava o defeito que o
       * Paulo achou em 12/11: *"a clave de dó maior, sem acidentes, está com a imagem maior que as
       * demais e desloca a interface"*. Medido no navegador — três armaduras com `viewBox` de 89,
       * 100 e 111 saíam todas com 320 px na tela, ou seja, **três escalas diferentes**, e a de dó
       * (a mais estreita) era a maior de todas. Com um fator só, pauta estreita ocupa menos
       * largura em vez de crescer, e a nota tem o mesmo tamanho em todo o app.
       */
      style={{ cursor: onPick ? 'pointer' : undefined, touchAction: onPick ? 'none' : undefined, maxWidth: width * ESCALA }}
      onPointerMove={onPick ? ev => setGhost(stepFromEvent(ev)) : undefined}
      onPointerLeave={onPick ? () => setGhost(null) : undefined}
      onPointerDown={onPick ? ev => { const s = stepFromEvent(ev); setGhost(s); onPick(s); } : undefined}
    >
      {[0, 2, 4, 6, 8].map(i => <path key={i} d={`M0,${y(bottom + i)} H${width}`} stroke={INK} strokeWidth="1.2" />)}
      <ClefGlyph clef={clef} />
      {keySteps.map((s, i) => <AccGlyph key={i} acc={fifths > 0 ? 1 : -1} x={startKey + 6 + i * 11} y={y(s)} />)}
      {timeSig && (
        <g fill={INK} fontFamily="var(--display)" fontWeight="900" fontSize="27" textAnchor="middle">
          <text x={startTime + 12} y={y(bottom + 6) + 9}>{timeSig[0]}</text>
          <text x={startTime + 12} y={y(bottom + 2) + 9}>{timeSig[1]}</text>
        </g>
      )}
      {columns.map((col, ci) => {
        const cx = startCols + ci * colWidth + colWidth / 2;
        const sorted = [...col.notes].sort((a, b) => stepOf(a.note) - stepOf(b.note));
        let prevShift = false;
        const placed = sorted.map((n, i) => {
          const s = stepOf(n.note);
          const shift = i > 0 && s - stepOf(sorted[i - 1].note) === 1 && !prevShift;
          prevShift = shift;
          return { ...n, s, x: cx + (shift ? 14 : 0) };
        });
        const isCursor = cursor === ci;
        return (
          <g key={ci}>
            {isCursor && <rect x={cx - colWidth / 2 + 4} y={y(bottom + 14)} width={colWidth - 8} height={y(bottom - 6) - y(bottom + 14)} fill="var(--mu)" opacity="0.18" />}
            {placed.map((n, i) => {
              const c = n.color ?? (isCursor ? 'var(--mu)' : INK);
              const keyA = keyAcc[n.note.letter] ?? 0;
              const showAcc = n.note.acc !== keyA;
              const accX = n.x - 17 - (placed.length > 1 ? (i % 2) * 11 : 0);
              const quarter = col.kind === 'quarter';
              const stemUp = n.s < bottom + 4;
              return (
                <g key={i}>
                  {ledgers(n.s, n.x, INK)}
                  {showAcc && <AccGlyph acc={n.note.acc} x={accX} y={y(n.s)} c={c} />}
                  {quarter ? (
                    <>
                      <ellipse cx={n.x} cy={y(n.s)} rx="6.8" ry="4.8" transform={`rotate(-22 ${n.x} ${y(n.s)})`} fill={c} />
                      <path d={stemUp ? `M${n.x + 6.2},${y(n.s) - 1} V${y(n.s) - 38}` : `M${n.x - 6.2},${y(n.s) + 1} V${y(n.s) + 38}`} stroke={c} strokeWidth="1.6" />
                    </>
                  ) : (
                    <ellipse cx={n.x} cy={y(n.s)} rx="7.4" ry="5" transform={`rotate(-22 ${n.x} ${y(n.s)})`} fill="none" stroke={c} strokeWidth="2.8" />
                  )}
                </g>
              );
            })}
            {col.barAfter && <path d={`M${cx + colWidth / 2},${y(bottom)} V${y(bottom + 8)}`} stroke={INK} strokeWidth="1.4" />}
          </g>
        );
      })}
      {onPick && ghost !== null && (() => {
        const cx = startCols + colWidth / 2;
        return <g opacity="0.55">
          {ledgers(ghost, cx, 'var(--mu)')}
          {ghostAcc !== 0 && <AccGlyph acc={ghostAcc} x={cx - 17} y={y(ghost)} c="var(--mu)" />}
          <ellipse cx={cx} cy={y(ghost)} rx="7.4" ry="5" transform={`rotate(-22 ${cx} ${y(ghost)})`} fill="none" stroke="var(--mu)" strokeWidth="2.8" />
        </g>;
      })()}
    </svg>
  );
}
