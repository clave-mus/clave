// Ciclagem dentro de uma etapa (F3-4, decisão 7).
//
// Uma etapa guarda um CONJUNTO de instâncias e resolve uma quando abre. Com uma só, é uma etapa
// comum — nenhum caminho de código especial, nenhuma interface diferente. É isso que faz
// "acrescentar variação" ser só pôr mais um item num conjunto que já existe.
//
// O app NUNCA substitui por algo que a pessoa não pôs ali. A consulta por etiqueta ("itens que
// treinam a mesma habilidade") é assistente de montagem, não mecanismo de execução — senão a
// rotina mudaria de comportamento sozinha quando o catálogo crescesse.
import type { Etapa, Instancia } from './types';

export interface Resolucao {
  indice: number;
  instancia: Instancia;
  /** A etapa com `ultimaUsada` atualizada. Precisa ser gravada, senão o rodízio reinicia. */
  etapa: Etapa;
}

/**
 * Escolhe a instância da vez.
 *
 * `sorteio` recebe o gerador para o teste poder ser determinístico — e para ninguém se ver
 * tentado a testar sorteio com `Math.random` de verdade.
 */
export function resolverInstancia(etapa: Etapa, random: () => number = Math.random): Resolucao {
  const n = etapa.instancias.length;
  if (n === 0) throw new Error(`etapa ${etapa.id} sem instância`);

  const anterior = etapa.ultimaUsada;
  let indice: number;

  if (n === 1) {
    indice = 0;
  } else {
    switch (etapa.politica) {
      case 'ordem':
        indice = anterior === undefined ? 0 : (anterior + 1) % n;
        break;
      case 'sorteio':
        indice = Math.floor(random() * n) % n;
        break;
      case 'sorteio-sem-repetir': {
        // sorteia entre as outras e remapeia, em vez de sortear de novo até dar diferente:
        // laço de repetição com gerador ruim pode não terminar
        if (anterior === undefined) {
          indice = Math.floor(random() * n) % n;
        } else {
          const k = Math.floor(random() * (n - 1)) % (n - 1);
          indice = k >= anterior ? k + 1 : k;
        }
        break;
      }
    }
  }

  return { indice, instancia: etapa.instancias[indice], etapa: { ...etapa, ultimaUsada: indice } };
}

/** Força outra instância — é o botão "trocar" ao lado da etapa. */
export function trocarInstancia(etapa: Etapa, random: () => number = Math.random): Resolucao {
  const n = etapa.instancias.length;
  if (n <= 1) return resolverInstancia(etapa, random);
  // trocar nunca devolve a mesma, qualquer que seja a política: é o que a pessoa pediu ao tocar
  return resolverInstancia({ ...etapa, politica: 'sorteio-sem-repetir' }, random);
}

/** A ordem em que as etapas aparecem. Embaralhar é da rotina, e é independente da ciclagem. */
export function ordemDasEtapas(etapas: Etapa[], embaralhar: boolean, random: () => number = Math.random): Etapa[] {
  if (!embaralhar || etapas.length < 2) return etapas;
  const out = [...etapas];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
