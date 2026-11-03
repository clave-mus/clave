// Quando uma prática vai para o histórico.
//
// Antes: só ao desmontar a tela. Fechar ou recarregar a aba no meio de uma prática não desmonta nada,
// então vinte minutos de estudo não deixavam rastro — num produto cuja promessa é "o histórico diz a
// verdade sobre o que você praticou".
//
// Agora a prática é gravada em três momentos, e **todos regravam a mesma entrada** (`sessao`):
//
//   - a aba esconde (`visibilitychange`): é o único evento confiável no celular, onde trocar de app
//     costuma ser o último sinal antes de o navegador descartar a aba;
//   - a página sai (`pagehide`): fechar, recarregar, navegar para fora;
//   - a tela desmonta: sair para outra tela do app.
//
// `construir` é lido SEMPRE no momento de gravar, pela ref — então o que vai para o histórico é o que
// valia no fim, nunca o do render em que o efeito montou (defeito que o Player tinha: mudar a
// tonalidade no meio do exercício gravava a antiga).
import { useEffect, useRef } from 'react';
import { novoId } from '../routines/storage';
import { registrarAtividade, type Activity } from './store';

export function useRegistroDePratica(construir: () => Omit<Activity, 'at' | 'sessao'> | null) {
  const sessao = useRef<string | null>(null);
  if (sessao.current === null) sessao.current = novoId();
  const ultimo = useRef(construir);
  ultimo.current = construir;

  useEffect(() => {
    const gravar = () => {
      const a = ultimo.current();
      if (a && sessao.current) registrarAtividade({ ...a, sessao: sessao.current });
    };
    const aoMudarVisibilidade = () => { if (document.visibilityState === 'hidden') gravar(); };
    document.addEventListener('visibilitychange', aoMudarVisibilidade);
    window.addEventListener('pagehide', gravar);
    return () => {
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
      window.removeEventListener('pagehide', gravar);
      gravar();
    };
  }, []);
}
