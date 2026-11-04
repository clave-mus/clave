// As oito portas por objetivo (decisão 20), com os textos da decisão 79.
//
// **Uma porta é uma pergunta que a pessoa se faz, não uma categoria do app.** Ela não é módulo (o
// módulo diz onde o item mora), não é etiqueta de habilidade (a etiqueta diz o que o item testa) e
// não é contexto. É a frase "o que eu quero conseguir" ligada aos itens que servem àquilo — e o
// mesmo item serve a várias portas, de propósito: `pauta-acorde` é leitura **e** harmonia.
//
// A regra da decisão 20: **uma porta só existe se tiver pelo menos 4 itens atrás dela.** Há teste.
//
// **Este arquivo não importa o catálogo, de propósito.** O estado guardado (`state/migrate.ts`) precisa
// de `PORTA_IDS` para limpar objetivos antigos, e o catálogo alcança o estado — importar daqui fecharia
// um ciclo que quebra a inicialização em silêncio. É o mesmo motivo de `catalog/registro.ts` existir.
// O que precisa do catálogo mora em `portasView.ts`.
//
// **Nenhum texto diz nada sobre quem a pessoa é** (decisão 11 aplicada ao texto): todos dizem o que
// há atrás da porta. Os nove textos estão em `src/i18n/content.*.ts`, nos dois idiomas.

/**
 * A nona entrada (`comecar`) **não é uma porta por objetivo**: é a saída para quem não sabe escolher,
 * e leva ao nivelamento (decisão 22). Fica aqui porque aparece na mesma lista, e é por isso que ela
 * é a única sem itens.
 */
export const PORTA_IDS = [
  'notas-no-instrumento', 'ouvido', 'harmonia', 'teoria', 'leitura', 'ritmo', 'tecnica', 'improviso', 'comecar',
] as const;
export type PortaId = (typeof PORTA_IDS)[number];

export interface Porta {
  id: PortaId;
  /** Itens de catálogo atrás da porta. Vazio só em `comecar`. */
  itens: string[];
  /** A porta carro-chefe (decisão 20). Uma só. */
  destaque?: boolean;
  /** Leva ao nivelamento em vez de ao catálogo. */
  diagnostico?: boolean;
}

export const PORTAS: readonly Porta[] = [
  {
    id: 'notas-no-instrumento', destaque: true,
    // "Saber onde cada nota está, sem procurar": o braço e o teclado, nomear e achar.
    itens: ['braco-nota', 'braco-ache', 'braco-intervalo', 'teclado-nota', 'teclado-tecla', 'acorde-visual', 'teclado-acorde', 'ouvido-tecla'],
  },
  {
    id: 'ouvido',
    // Tudo o que tem etiqueta `ear.*`, mais o ambiente de cantar/tocar com referência.
    itens: ['ouvido-intervalo', 'ouvido-acorde', 'ouvido-escala', 'ouvido-celulas', 'ouvido-tecla', 'ritmo-ouvido', 'ambiente'],
  },
  {
    id: 'harmonia',
    // "Campo harmônico, cifras e condução": os acordes em todas as superfícies, e a harmonia tocando.
    itens: ['backing', 'ouvido-acorde', 'pauta-acorde', 'teclado-acorde', 'acorde-visual', 'quiz-teoria'],
  },
  {
    id: 'teoria',
    // "Os nomes e as razões": o que tem etiqueta `theory.*` — nomear, não executar.
    itens: ['quiz-teoria', 'pauta-armadura', 'pauta-intervalo', 'pauta-escala', 'pauta-acorde', 'braco-intervalo'],
  },
  {
    id: 'leitura',
    // "Da nota escrita ao som": tudo com etiqueta `notation.*`, altura e ritmo.
    itens: ['pauta-nota', 'pauta-construir', 'pauta-intervalo', 'pauta-acorde', 'pauta-escala', 'pauta-armadura', 'leitura', 'ritmo'],
  },
  {
    id: 'ritmo',
    // "Subdivisão, leitura rítmica e tocar no tempo".
    itens: ['ritmo-ouvido', 'ritmo', 'metronomo', 'deslocamento-ritmico', 'acento-deslocado', 'subdivisao-alternada'],
  },
  {
    id: 'tecnica',
    // Entra sabendo que enche depois — é o que a decisão 20 diz dela, textualmente.
    itens: ['tecnica', 'metronomo', 'sustentar-e-cortar', 'legato-staccato', 'acento-deslocado', 'subdivisao-alternada'],
  },
  {
    id: 'improviso',
    // "O que prepara o improviso: escalas, arpejos, notas-alvo e vocabulário". Não há exercício de
    // improvisar, e o rótulo da porta é "Improvisar e solar" de propósito (decisão 80).
    itens: ['ouvido-celulas', 'ouvido-escala', 'pauta-escala', 'ambiente', 'backing', 'braco-ache'],
  },
  { id: 'comecar', itens: [], diagnostico: true },
];

export const portaPorId = (id: string) => PORTAS.find(p => p.id === id);

/** Em quantas portas um item aparece. Zero é o sinal de item sem porta — há teste. */
export const portasDoItem = (itemId: string) => PORTAS.filter(p => p.itens.includes(itemId)).map(p => p.id);
