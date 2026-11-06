// Conteúdo de estudo em português: módulos e objetivos.
// A estrutura (ids, links, cores) fica em src/data; aqui só o texto, por id.
// content.en.ts precisa ter as mesmas chaves e o mesmo número de itens em cada lista.
const ptContent = {
  modules: {
    theory: { name: 'Teoria', short: 'Notação, escalas, acordes e o mapa do instrumento' },
    technique: { name: 'Técnica', short: 'Controle motor e regularidade' },
    'perception.melodic': { name: 'Percepção melódica', short: 'Alturas, intervalos e escalas' },
    'perception.harmonic': { name: 'Percepção harmônica', short: 'Acordes e sonoridades' },
    'perception.rhythmic': { name: 'Percepção rítmica', short: 'Pulso, figuras e células' },
  },
  instruments: {
    piano: 'Piano / teclado',
    violao: 'Violão / guitarra',
    baixo: 'Baixo',
  },
  // As nove entradas por objetivo (decisões 20, 79 e 80). Nenhuma linha diz nada sobre quem a pessoa
  // é: todas dizem o que há atrás da porta. Ver `src/catalog/portas.ts`.
  portas: {
    'notas-no-instrumento': { nome: 'Dominar as notas no instrumento', apoio: 'Saber onde cada nota está, sem procurar.' },
    ouvido: { nome: 'Melhorar o ouvido', apoio: 'Reconhecer o que você ouve — intervalos, acordes, escalas, graus.' },
    harmonia: { nome: 'Acompanhar e entender harmonia', apoio: 'Campo harmônico, cifras e condução: o que sustenta a música.' },
    teoria: { nome: 'Aprender teoria musical', apoio: 'Os nomes e as razões por trás do que você já toca.' },
    leitura: { nome: 'Aprender a ler partitura', apoio: 'Da nota escrita ao som, sem travar.' },
    ritmo: { nome: 'Ritmo e pulso interno', apoio: 'Subdivisão, leitura rítmica e tocar no tempo.' },
    tecnica: { nome: 'Melhorar técnica e precisão', apoio: 'Coordenação, independência dos dedos e controle do som.' },
    improviso: { nome: 'Improvisar e solar', apoio: 'O que prepara o improviso: escalas, arpejos, notas-alvo e vocabulário.' },
    comecar: { nome: 'Não sei por onde começar', apoio: 'Três perguntas e uma rotina sugerida. Dá para mudar tudo depois.' },
  },
  goals: {
    improvisar: 'Improvisar com fluidez',
    harmonia: 'Criar progressões bonitas',
    'tirar-de-ouvido': 'Tirar músicas de ouvido',
    'ler-partitura': 'Ler partitura',
    agilidade: 'Ganhar agilidade',
    jazz: 'Tocar jazz',
    repertorio: 'Aprender músicas',
  },
};

export default ptContent;
