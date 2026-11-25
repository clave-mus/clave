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
  /**
   * **A região em foco**: as casas fora dela aparecem apagadas, e nada é recortado.
   *
   * Entrou em 14/11 para o `mapa-do-braco` poder fixar uma posição sem perder o braço de vista —
   * foi a preocupação do Paulo ao pedir a região: *"acho que seria ruim [desenhar só a região], pois
   * perderia o contexto de ver o braço completo"*. Ele também queria regiões que atravessam a 12ª
   * casa (7 a 15), e desenhar o braço inteiro até o fim da região resolve as duas coisas de uma vez:
   * o contexto fica e não há recorte nenhum.
   */
  foco?: readonly [number, number];
  /**
   * **Cordas com o dobro do espaçamento**, para o dedo no celular deitado.
   *
   * Medido em 25/11: com o espaçamento normal cada corda tem **24 px** de altura num celular
   * deitado — metade de um alvo de toque confortável. Montar uma digitação de escala são sete
   * toques certeiros, e ali 24 px erra. Com o dobro dá ~48 px, e quatro cordas ainda cabem nos
   * 375 px de altura da tela deitada.
   */
  alto?: boolean;
}

/**
 * **O que cada tinta do tema vira SOBRE a madeira.**
 *
 * O braço é escuro nos dois temas, e as tintas que os chamadores passam (`--mu`, `--line`,
 * `--accent-quiet`…) invertem com o tema — então metade delas sumia. Medido em 20/11: no tema
 * escuro, "a nomear" e "já nomeada" ficavam a **1,00:1** da madeira, ou seja, invisíveis; no claro,
 * "a da vez" e "errou" ficavam abaixo dos 3:1 que valem para desenho. Os números estão em
 * `index.css`, junto dos tokens.
 *
 * A tradução mora **aqui**, e não nos oito chamadores, por um motivo: quem sabe que a superfície é
 * madeira escura é este componente. Espalhar isso faria todo chamador novo reintroduzir o defeito —
 * e foi exatamente assim que ele apareceu.
 *
 * Quem passar uma cor que não está na tabela recebe a cor como pediu: a tabela conserta o que
 * conhece, não impõe paleta.
 */
const NA_MADEIRA: Record<string, string> = {
  'var(--mu)': 'var(--fret-dot-now)',
  'var(--ok)': 'var(--fret-dot-now)',   // `--ok` é apelido de `--accent`, a mesma tinta
  'var(--err)': 'var(--fret-dot-err)',
  'var(--line)': 'var(--fret-dot)',
  'var(--accent-quiet)': 'var(--fret-dot-done)',
  'var(--ve)': 'var(--fret-dot-alt)',
};
const naMadeira = (c: string | undefined) => (c ? NA_MADEIRA[c] ?? c : 'var(--fret-dot-now)');

const FW = 52;
const GAP_BASE = 22;

export default function Fretboard({ tuning, from = 0, to = 12, marks = [], muted = [], onPick, onlyString, showNames = false, naming = 'pt', label, foco, alto = false }: Props) {
  const t = useT();
  const n = tuning.length;
  const GAP = alto ? GAP_BASE * 2 : GAP_BASE;
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
      <rect x={left} y={top - 8} width={frets * FW} height={(n - 1) * GAP + 16} fill="var(--fret-wood)" />
      {/* As marcas de casa, em metal fixo. Eram `--cream` a 0,35 — que no tema claro resolvia para
          tinta escura sobre madeira escura, 1,08:1: invisíveis. Ver a nota em `index.css`. */}
      {inlays.map(f => <circle key={f} cx={left + (f - from - 0.5) * FW} cy={top + ((n - 1) * GAP) / 2} r="5.5" fill="var(--fret-metal)" opacity="0.7" />)}
      {/**
        * O véu sobre o que está FORA do foco — um retângulo de cada lado, na cor do papel.
        *
        * Escurecer o fora em vez de recortar mantém o braço inteiro legível como referência: vê-se
        * que a posição em jogo é a quinta casa, e não um braço qualquer que começa ali.
        */}
      {foco && [[from, Math.max(from, foco[0] - 1)] as const, [Math.min(to, foco[1]), to] as const]
        .filter(([a, b]) => b > a)
        .map(([a, b]) => (
          <rect key={`veu${a}-${b}`} x={left + (a - from) * FW} y={top - 10} width={(b - a) * FW} height={(n - 1) * GAP + 20}
            /**
             * **Preto fixo, nunca uma variável de tema** — e isto foi pego revisando antes do
             * deploy. Escrevi `var(--ground)` primeiro, que é branco no tema claro: o véu
             * CLAREARIA as casas fora do foco, destacando exatamente o que devia apagar.
             *
             * O braço é escuro em qualquer tema (`.stage.dark`), então a cor que o apaga também
             * tem de ser. É a mesma lição de `--key-white`/`--key-black`, que o Paulo relatou em
             * 12/11 como "cores das teclas do piano invertidas no modo claro".
             */
            fill="rgb(0 0 0)" opacity="0.6" pointerEvents="none" />
        ))}
      {/* A casa 12 leva duas marcas, como num braço de verdade. */}
      {12 > from && 12 <= to && [0.3, 0.7].map(k => <circle key={k} cx={left + (12 - from - 0.5) * FW} cy={top + (n - 1) * GAP * k} r="5.5" fill="var(--fret-metal)" opacity="0.7" />)}
      {Array.from({ length: frets + 1 }, (_, i) => (
        <path key={i} d={`M${left + i * FW},${top - 8} V${top + (n - 1) * GAP + 8}`}
          stroke={i === 0 && from === 0 ? 'var(--fret-metal)' : 'var(--fret-line)'} strokeWidth={i === 0 && from === 0 ? 6 : 2} />
      ))}
      {/* O nome de cada corda solta, à esquerda. Sem ele é fácil se confundir sobre em que corda se
          está — ainda mais no baixo de cinco e na guitarra, onde há duas cordas Mi.
          ⚠️ **Este fica em `--cream` de propósito**, ao contrário de tudo que é desenhado na
          madeira: ele mora em `left - 32`, **fora** do braço, sobre o papel — e o papel inverte com
          o tema. Pus `--fret-ink` aqui na primeira versão de 20/11 e o nome sumiu no tema claro,
          branco sobre branco. Foi o screenshot que pegou; a medição eu tinha feito contra a
          madeira errada. */}
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
            {/* O contorno é escuro fixo, como a madeira: `--bk` inverte e no tema claro ele
                virava um halo claro em volta da bolinha. */}
            <circle cx={xF(m.f)} cy={yS(m.s)} r="9.5" fill={naMadeira(m.color)} stroke="var(--fret-wood)" strokeWidth="1.5" />
            {/* O nome DENTRO da bolinha, em tinta fixa escura: a bolinha é clara nos dois temas
                agora, e `--bk` é o papel, que no tema claro é quase branco — o nome sumia. */}
            {(m.label || showNames) && <text x={xF(m.f)} y={yS(m.s) + 3.6} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--fret-wood)" fontFamily="var(--body)">{m.label ?? pcName(p, naming, false)}</text>}
          </g>
        );
      })}
    </svg>
  );
}
