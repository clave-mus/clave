// O painel de um eixo de avanço MANUAL (decisão 38): mostra o valor, quantos já passaram, e deixa a
// pessoa andar para frente, para trás ou sortear. Nunca anda sozinho.
//
// É a mesma máquina nas rotinas de técnica (ordem dos dedos, das cordas, troca de posição) e na
// tarefa com metrônomo (modos do deslocamento rítmico) — por isso mora aqui e não em nenhuma delas.
import { Btn } from './ui';
import { useT, type MessageKey } from '../i18n';

interface Props {
  rotulo: MessageKey;
  /** O valor já formatado para a tela. */
  valor: string;
  /** Quantos valores a pessoa já viu, e quantos existem. */
  vistos: number;
  total: number;
  onAnterior: () => void;
  onProximo: () => void;
  onSortear: () => void;
}

export default function EixoManual({ rotulo, valor, vistos, total, onAnterior, onProximo, onSortear }: Props) {
  const t = useT();
  return (
    <div className="panel" style={{ display: 'grid', gap: 10 }} aria-label={t(rotulo)}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="muted">{t(rotulo)}</span>
        <span className="muted">{t('technique.axisSeen', { done: vistos, total })}</span>
      </div>
      <b className="num" style={{ fontFamily: 'var(--display)', fontSize: 34, letterSpacing: '0.12em' }}>{valor}</b>
      <div className="row">
        <Btn small tone="ghost" onClick={onAnterior}>{t('technique.axisPrev')}</Btn>
        <Btn small onClick={onProximo}>{t('technique.axisNext')}</Btn>
        <Btn small tone="ghost" onClick={onSortear}>{t('technique.axisShuffle')}</Btn>
      </div>
    </div>
  );
}
