// **Nenhum motor sem consumidor** — a falha que mais se repetiu neste projeto.
//
// `digitacoes.ts` (22 testes) e `padrao-de-escala.ts` (25) ficaram prontos, testados e
// **inalcançáveis por semanas**: ninguém os chamava, e nada acusava. Os dois só ganharam consumidor
// em 10/11, e no caminho alguém quase reescreveu o segundo por achar que não existia — em 13/11
// `docs/catalogo.md` ainda os listava como "❌ não existe".
//
// Este teste é o que faltava. Ele varre `src/theory/` e exige que todo módulo seja importado por
// alguém que não seja o próprio teste dele.
import { describe, expect, it } from 'vitest';

/**
 * Os que podem viver sem consumidor, **cada um com a razão escrita**.
 *
 * A lista é curta de propósito, e entrar nela custa uma frase que alguém vai ler: é a diferença
 * entre "decidimos esperar" e "esquecemos".
 */
const PODEM_ESPERAR: Record<string, string> = {
  // Decisão 85: nenhum padrão rítmico entra sem revisão de quem conhece a tradição. O arquivo está
  // deliberadamente VAZIO de padrões — nomear clave, baião ou telecoteco errado é erro de
  // atribuição cultural, não de teoria. As doze perguntas estão em `docs/padroes-ritmicos.md`.
  padroes: 'espera revisão cultural (decisão 85)',
  // Enumeradores puros, sem interface por desenho (ver `docs/catalogo.md`): recebem material e
  // devolvem lista ordenada. Quem desenha é o motor de partituras ou o visualizador, e as telas
  // deles ainda não existem.
  conducoes: 'enumerador sem tela (FM-4)',
  rearmonizacoes: 'enumerador sem tela (FM-5)',
  // 25/11: o motor das digitações de escala ficou pronto ANTES do item, de propósito — ele é o que
  // não dependia de nenhuma resposta do Paulo, e o item depende de três (onde mora, o que conta
  // como acerto, e como se chamam os modos das menores). Sai desta lista quando o item entrar.
  'digitacao-de-escala': 'espera a decisão de onde o item mora (25/11)',
};

describe('nenhum motor fica órfão', () => {
  it('todo módulo de theory/ tem consumidor fora dos próprios testes', () => {
    const fontes = import.meta.glob('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

    /** Os módulos de `theory/`, pelo nome, sem os arquivos de teste. */
    const modulos = Object.keys(fontes)
      .filter(c => c.startsWith('./') && !c.includes('.test.'))
      .map(c => c.slice(2).replace(/\.ts$/, ''));
    expect(modulos.length, 'o glob não achou os módulos: o teste não valeria nada').toBeGreaterThan(10);

    const orfaos: string[] = [];
    for (const nome of modulos) {
      if (nome in PODEM_ESPERAR) continue;
      const usado = Object.entries(fontes).some(([caminho, texto]) => {
        if (caminho.includes('.test.')) return false;
        // o próprio arquivo não conta
        if (caminho === `./${nome}.ts`) return false;
        return texto.includes(`theory/${nome}'`) || texto.includes(`./${nome}'`);
      });
      if (!usado) orfaos.push(nome);
    }
    expect(orfaos, `motor sem consumidor: ${orfaos.join(', ')} — ou ligue, ou diga em PODEM_ESPERAR por quê`).toEqual([]);
  });

  it('a lista de exceções não guarda nome que já morreu', () => {
    // Exceção que sobrevive ao arquivo é a mesma doença, de outro lado.
    const fontes = import.meta.glob('../**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    for (const nome of Object.keys(PODEM_ESPERAR)) {
      expect(Object.keys(fontes), `${nome} está na lista e não existe mais`).toContain(`./${nome}.ts`);
    }
  });
});
