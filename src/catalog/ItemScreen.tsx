// Carrega a tela própria de um item de catálogo (os de `kind: 'ambiente'` e `'tarefa'`).
//
// A tela só baixa quando o item abre — é o que mantém a VexFlow, que a leitura rítmica usa, fora
// do pacote inicial. Quem renderiza item do tipo `serie` é o Player, não isto.
import { lazy, Suspense, useMemo } from 'react';
import type { CatalogItem, ScreenProps } from './types';
import { useT } from '../i18n';

export default function ItemScreen({ item, ...props }: { item: CatalogItem } & ScreenProps) {
  const load = item.screen;
  const Comp = useMemo(() => (load ? lazy(load) : null), [load]);
  if (!Comp) return null;
  return (
    <Suspense fallback={<Loading />}>
      <Comp itemId={item.id} {...props} />
    </Suspense>
  );
}

function Loading() {
  const t = useT();
  return <p className="muted">{t('train.loadingScore')}</p>;
}
