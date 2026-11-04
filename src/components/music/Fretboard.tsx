// Braço do violão ou do baixo em SVG. A corda mais aguda fica em cima, como na tablatura.
import { mod, pcName, type Naming } from '../../theory/core';
import { useT } from '../../i18n';

export const TUNINGS = {
  violao: [40, 45, 50, 55, 59, 64], // Mi Lá Ré Sol Si Mi
  baixo: [28, 33, 38, 43], // Mi Lá Ré Sol
} as const;
export const STRING_NAMES = {
  violao: ['6ª (Mi grave)', '5ª (Lá)', '4ª (Ré)', '3ª (Sol)', '2ª (Si)', '1ª (Mi aguda)'],
  baixo: ['4ª (Mi)', '3ª (Lá)', '2ª (Ré)', '1ª (Sol)'],
};

export interface FretMark {
  s: number; // índice da corda, 0 = mais grave
  f: number;
  color?: string;
  label?: string;
}
interface Props {
  tuning: readonly number[];
  from?: number;
  to?: number;
  marks?: FretMark[];
  muted?: number[];
  onPick?: (s: number, f: number) => void;
  onlyString?: number;
  showNames?: boolean;
  naming?: Naming;
  label?: string;
}

const FW = 52;
const GAP = 22;

export default function Fretboard({ tuning, from = 0, to = 12, marks = [], muted = [], onPick, onlyString, showNames = false, naming = 'pt', label }: Props) {
  const t = useT();
  const n = tuning.length;
  const left = 50;  // espaço para o nome da corda à esquerda
  const top = 18;
  const frets = to - from;
  const width = left + frets * FW + 16;
  const height = top + (n - 1) * GAP + 34;
  const yS = (s: number) => top + (n - 1 - s) * GAP;
  const xF = (f: number) => (f === 0 ? left - 18 : left + (f - from - 0.5) * FW);
  const inlays = [3, 5, 7, 9, 15, 17].filter(f => f > from && f <= to);
  const cells: { s: number; f: number }[] = [];
  if (onPick) for (let s = 0; s < n; s++) for (let f = from === 0 ? 0 : from + 1; f <= to; f++) if (onlyString === undefined || onlyString === s) cells.push({ s, f });

  return (
    <svg className="fret-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label ?? t('music.neck')}>
      <rect x={left} y={top - 8} width={frets * FW} height={(n - 1) * GAP + 16} fill="#3b2418" />
      {inlays.map(f => <circle key={f} cx={left + (f - from - 0.5) * FW} cy={top + ((n - 1) * GAP) / 2} r="5" fill="var(--cream)" opacity="0.35" />)}
      {12 > from && 12 <= to && [0.3, 0.7].map(k => <circle key={k} cx={left + (12 - from - 0.5) * FW} cy={top + (n - 1) * GAP * k} r="5" fill="var(--cream)" opacity="0.35" />)}
      {Array.from({ length: frets + 1 }, (_, i) => (
        <path key={i} d={`M${left + i * FW},${top - 8} V${top + (n - 1) * GAP + 8}`} stroke={i === 0 && from === 0 ? 'var(--cream)' : '#a99f8c'} strokeWidth={i === 0 && from === 0 ? 6 : 2} />
      ))}
      {/* O nome de cada corda solta, à esquerda. Sem ele é fácil se confundir sobre em que corda se
          está — ainda mais no baixo de cinco e na guitarra, onde há duas cordas Mi. */}
      {tuning.map((aberta, s) => (
        <text key={`n${s}`} x={left - 32} y={yS(s) + 4} textAnchor="middle" fontSize="11" fontWeight="700"
          fill="var(--cream)" opacity={onlyString === undefined || onlyString === s ? 0.9 : 0.4} fontFamily="var(--body)">
          {pcName(aberta, naming, false)}
        </text>
      ))}
      {tuning.map((_, s) => (
        <path key={s} d={`M${left - 22},${yS(s)} H${left + frets * FW}`} stroke="var(--white, #fbf6ea)" strokeWidth={0.9 + (n - 1 - (n - 1 - s)) * 0 + (n - s) * 0.28} opacity={onlyString === undefined || onlyString === s ? 1 : 0.35} />
      ))}
      {Array.from({ length: frets }, (_, i) => from + i + 1).filter(f => [1, 3, 5, 7, 9, 12, 15].includes(f)).map(f => (
        <text key={f} x={left + (f - from - 0.5) * FW} y={height - 4} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="var(--body)">{f}</text>
      ))}
      {muted.map(s => <text key={'m' + s} x={left - 18} y={yS(s) + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--ve)" fontFamily="var(--body)">×</text>)}
      {cells.map(({ s, f }) => (
        <rect key={`c${s}-${f}`} className="fret-cell" x={f === 0 ? left - 32 : left + (f - from - 1) * FW} y={yS(s) - GAP / 2} width={f === 0 ? 28 : FW} height={GAP}
          fill="transparent" onPointerDown={() => onPick!(s, f)} />
      ))}
      {marks.map((m, i) => {
        const p = mod(tuning[m.s] + m.f, 12);
        return (
          <g key={i} pointerEvents="none">
            <circle cx={xF(m.f)} cy={yS(m.s)} r="9.5" fill={m.color ?? 'var(--mu)'} stroke="var(--bk)" strokeWidth="1.5" />
            {(m.label || showNames) && <text x={xF(m.f)} y={yS(m.s) + 3.6} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--bk)" fontFamily="var(--body)">{m.label ?? pcName(p, naming, false)}</text>}
          </g>
        );
      })}
    </svg>
  );
}
