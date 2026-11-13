// Teclado em SVG. Marca teclas com cores e, se interativo, avisa qual tecla foi tocada.
import { pcName, type Naming } from '../../theory/core';
import { useT } from '../../i18n';

const BLACK = new Set([1, 3, 6, 8, 10]);
const WW = 28; // largura da tecla branca
const WH = 124;
const BW = 17;
const BH = 78;

interface Props {
  lo: number;
  hi: number;
  marks?: Record<number, string>;
  /** Texto curto sobre uma tecla marcada — a ordem numa melodia, por exemplo. */
  marcasComTexto?: Record<number, string>;
  onPress?: (midi: number) => void;
  labels?: 'none' | 'do' | 'all';
  naming?: Naming;
  label?: string;
}

export default function Keyboard({ lo, hi, marks = {}, marcasComTexto = {}, onPress, labels = 'do', naming = 'pt', label }: Props) {
  const t = useT();
  const whites: number[] = [];
  for (let m = lo; m <= hi; m++) if (!BLACK.has(m % 12)) whites.push(m);
  const xOfWhite = new Map(whites.map((m, i) => [m, i * WW]));
  const blacks: { m: number; x: number }[] = [];
  for (let m = lo; m <= hi; m++) {
    if (!BLACK.has(m % 12)) continue;
    const left = xOfWhite.get(m - 1);
    if (left === undefined) continue;
    const nudge = { 1: -3, 3: 3, 6: -4, 8: 0, 10: 4 }[m % 12] ?? 0;
    blacks.push({ m, x: left + WW - BW / 2 + nudge });
  }
  const width = whites.length * WW;
  const interactive = !!onPress;
  return (
    <svg className="kbd-svg" viewBox={`-2 -2 ${width + 4} ${WH + 4}`} role="img" aria-label={label ?? t('music.keyboard')}>
      {whites.map(m => {
        const x = xOfWhite.get(m)!;
        const mark = marks[m];
        const showLabel = labels === 'all' || (labels === 'do' && m % 12 === 0);
        return (
          <g key={m} onPointerDown={interactive ? () => onPress!(m) : undefined} style={{ cursor: interactive ? 'pointer' : undefined }}>
            <rect x={x} y={0} width={WW - 1.5} height={WH} fill={mark ?? 'var(--key-white)'} className={interactive ? 'key white' : undefined} />
            {showLabel && <text x={x + WW / 2 - 0.75} y={WH - 9} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="var(--key-black)" fontFamily="var(--body)">{pcName(m, naming, false)}{m % 12 === 0 && labels === 'do' ? Math.floor(m / 12) - 1 : ''}</text>}
            {marcasComTexto[m] && <text x={x + WW / 2 - 0.75} y={WH - 34} textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--key-black)" fontFamily="var(--display)">{marcasComTexto[m]}</text>}
          </g>
        );
      })}
      {blacks.map(({ m, x }) => (
        <g key={m}>
          <rect x={x} y={0} width={BW} height={BH} fill={marks[m] ?? 'var(--key-black)'} stroke="var(--key-black)" strokeWidth="1.5"
            onPointerDown={interactive ? () => onPress!(m) : undefined} style={{ cursor: interactive ? 'pointer' : undefined }} className={interactive ? 'key black' : undefined} />
          {/* Nas pretas o número fica em cor clara: a tecla marcada é escura por baixo. */}
          {marcasComTexto[m] && <text x={x + BW / 2} y={BH - 10} textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--key-white)" fontFamily="var(--display)">{marcasComTexto[m]}</text>}
        </g>
      ))}
    </svg>
  );
}
