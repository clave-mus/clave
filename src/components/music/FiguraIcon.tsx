// Ícone de figura rítmica (X1, 06/11/2026): semibreve, mínima, semínima, colcheia, semicolcheia.
//
// **Desenhado à mão, e não tirado da fonte Bravura de propósito.** A Bravura vem junto da VexFlow e
// é o que desenha a partitura — mas usá-la como texto solto num botão obriga a carregar a fonte
// inteira para mostrar cinco glifos de 16px, e a alinhá-los na mão porque a métrica dela é de
// pauta, não de interface. Cinco caminhos simples resolvem, acompanham a cor do texto (`currentColor`)
// e funcionam nos dois temas sem nada a mais.
import type { NoteValue } from '../../theory/rhythm-cells';

/** A cabeça é inclinada, como na notação: elipse girada ~20° para a esquerda. */
const CABECA = 'M 5.6 15.6 a 3.5 2.6 -20 1 1 4.8 1.8 a 3.5 2.6 -20 1 1 -4.8 -1.8 z';
/** A semibreve e a mínima têm cabeça vazada; a diferença entre elas é a haste. */
const CABECA_VAZADA = 'M 5.6 15.6 a 3.5 2.6 -20 1 1 4.8 1.8 a 3.5 2.6 -20 1 1 -4.8 -1.8 z M 6.9 15.9 a 2.2 1.3 -20 1 0 2.2 0.8 a 2.2 1.3 -20 1 0 -2.2 -0.8 z';

export default function FiguraIcon({ value, size = 18 }: { value: NoteValue; size?: number }) {
  const vazada = value === 'w' || value === 'h';
  const comHaste = value !== 'w';
  const bandeiras = value === '8' ? 1 : value === '16' ? 2 : 0;
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 16 20" aria-hidden="true" focusable="false"
      style={{ display: 'block', flex: 'none' }}>
      <path d={vazada ? CABECA_VAZADA : CABECA} fill="currentColor" fillRule="evenodd" />
      {comHaste && <path d="M 10.3 15.2 V 3.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />}
      {Array.from({ length: bandeiras }, (_, i) => (
        <path key={i} d={`M 10.3 ${3.4 + i * 3.4} q 3.4 1.6 3.1 5.1 q -0.9 -2.6 -3.1 -3.3 z`} fill="currentColor" />
      ))}
    </svg>
  );
}
