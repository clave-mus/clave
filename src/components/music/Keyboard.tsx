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

/**
 * **A marca fraca numa tecla PRETA** — a cura é a do `Fretboard`: traduzir a tinta para a superfície
 * em que ela cai.
 *
 * `--accent-quiet` é um tom de **fundo**, escuro no tema escuro (#2e2019). Numa tecla preta (#211e1c)
 * isso dá **1,1:1** — medido em 26/11, e 1,1:1 quer dizer que a nota marcada não aparece. Na branca
 * ela continua como estava: escura sobre clara, que se vê.
 *
 * O acento clareado é o que contrasta com preto nos dois temas; misturar com a cor da tecla preta
 * daria escuro sobre escuro de novo.
 */
const NA_TECLA_PRETA: Record<string, string> = {
  'var(--accent-quiet)': 'color-mix(in srgb, var(--accent) 55%, var(--key-white))',
};

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
            {/* O contorno não é enfeite: sem ele a tecla branca desaparece no fundo claro — o
                Paulo relatou em 13/11 que elas ficavam "da mesma cor do fundo, se tornando
                transparentes". `--key-white` é #f7f3ec e o papel do tema claro é #fbf8f4: quase a
                mesma cor. Um piano de verdade também tem a borda entre as teclas. */}
            <rect x={x} y={0} width={WW - 1.5} height={WH} fill={mark ?? 'var(--key-white)'}
              stroke="var(--key-black)" strokeWidth="0.9" strokeOpacity="0.45"
              className={interactive ? 'key white' : undefined} />
            {showLabel && <text x={x + WW / 2 - 0.75} y={WH - 9} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="var(--key-black)" fontFamily="var(--body)">{pcName(m, naming, false)}{m % 12 === 0 && labels === 'do' ? Math.floor(m / 12) - 1 : ''}</text>}
            {marcasComTexto[m] && <text x={x + WW / 2 - 0.75} y={WH - 34} textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--key-black)" fontFamily="var(--display)">{marcasComTexto[m]}</text>}
          </g>
        );
      })}
      {blacks.map(({ m, x }) => (
        <g key={m}>
          <rect x={x} y={0} width={BW} height={BH} fill={marks[m] ? NA_TECLA_PRETA[marks[m]] ?? marks[m] : 'var(--key-black)'} stroke="var(--key-black)" strokeWidth="1.5"
            onPointerDown={interactive ? () => onPress!(m) : undefined} style={{ cursor: interactive ? 'pointer' : undefined }} className={interactive ? 'key black' : undefined} />
          {/* Nas pretas o número fica em cor clara: a tecla marcada é escura por baixo. */}
          {/* ⚠️ Numa tecla preta **marcada** o texto vai em tinta escura: a marca a clareia, e texto
              claro sobre acento mede 2:1. Medido em 26/11, com a revelação escrevendo o nome da
              fundamental na tecla. */}
          {marcasComTexto[m] && <text x={x + BW / 2} y={BH - 10} textAnchor="middle" fontSize="12" fontWeight="800"
            fill={marks[m] ? 'var(--key-black)' : 'var(--key-white)'} fontFamily="var(--display)">{marcasComTexto[m]}</text>}
        </g>
      ))}
    </svg>
  );
}
