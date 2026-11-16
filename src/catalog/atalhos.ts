import type { SeriesItem, SettingValue } from './types';

/**
 * **O que os atalhos de um item governam** — as configurações em que eles *discordam entre si*, e
 * se a tonalidade está entre elas.
 *
 * Decidido com o Paulo em 16/11/2026: *"ao clicar no atalho de tétrades, isso só mude os graus — e
 * não os outros parâmetros, como tonalidade, som do celular, etc"*. Clicar num atalho antes zerava
 * o item e aplicava o atalho por cima, e no `mapa-do-braco` isso devolvia ao padrão o som do
 * alto-falante, a abertura da mão, a região do braço e a tonalidade — escolhas que são **da
 * pessoa**, não da variante do exercício.
 *
 * A conta é por discordância, e não "o que o atalho menciona", porque os dois defeitos são opostos
 * e a regra precisa pegar os dois:
 *
 * - o atalho **não deve** mexer no que nenhum atalho disputa (o `campo` do mapa, que os quatro
 *   declaram `maior`; a tonalidade, que os quatro pedem em dó);
 * - o atalho **deve** devolver ao padrão o que *outro* atalho liga. Uma configuração mencionada
 *   por um atalho só — "extensões", digamos — ficaria ligada depois de clicar no atalho simples,
 *   que é justamente o defeito que a versão antiga não tinha. Daí resolver cada atalho contra os
 *   padrões antes de comparar: para quem não a menciona, o valor é o padrão, e isso basta para a
 *   discordância aparecer.
 *
 * Com **menos de dois atalhos** não há discordância possível, e preservar tudo deixaria o único
 * atalho do item sem efeito nenhum: ali ele volta a governar o que menciona.
 */
export function chavesDisputadas(def: SeriesItem): { settings: readonly string[]; params: boolean } {
  const atalhos = def.presets ?? [];
  if (atalhos.length < 2) return { settings: atalhos.flatMap(p => Object.keys(p.settings)), params: true };
  const resolvida = (p: (typeof atalhos)[number], k: string) =>
    JSON.stringify(k in p.settings ? p.settings[k] : def.defaults[k] ?? null);
  const chaves = new Set(atalhos.flatMap(p => Object.keys(p.settings)));
  return {
    settings: [...chaves].filter(k => new Set(atalhos.map(p => resolvida(p, k))).size > 1),
    // A tonalidade é uma só por atalho: ou eles pedem tonalidades diferentes, ou ela não é assunto deles.
    params: new Set(atalhos.map(p => JSON.stringify(p.params ?? null))).size > 1,
  };
}

/**
 * As configurações em vigor depois de clicar num atalho: o que ele governa vem dele (ou volta ao
 * padrão), e **o resto fica como a pessoa deixou**.
 *
 * Função pura e fora do `Player` de propósito — é o que deixa a regra acima ser medida em teste
 * sem montar a tela. `base` é o padrão já resolvido pelo contexto (`defaults` + `defaultsDo`), que
 * é quem sabe o instrumento do perfil.
 */
export function settingsDoAtalho(
  def: SeriesItem,
  atalho: NonNullable<SeriesItem['presets']>[number],
  atual: Record<string, SettingValue>,
  base: Record<string, SettingValue>,
): Record<string, SettingValue> {
  const novas = { ...atual };
  for (const k of chavesDisputadas(def).settings) {
    if (k in atalho.settings) novas[k] = atalho.settings[k];
    else if (k in base) novas[k] = base[k];
    else delete novas[k];
  }
  return novas;
}
