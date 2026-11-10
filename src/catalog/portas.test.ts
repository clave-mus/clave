// As portas são conteúdo escrito à mão sobre ids de catálogo, e isso apodrece em silêncio: um item
// renomeado e a porta passa a ter menos coisa atrás **sem ninguém notar**. Daí os testes.
import { describe, expect, it } from 'vitest';
import { AMBIENTES, EXERCISES } from './index';
import { estadoDe } from './publicacao';
import { PORTA_IDS, PORTAS, portaPorId, portasDoItem } from './portas';
import { itensDaPorta, portasVisiveis } from './portasView';
import { translate } from '../i18n';
import ptContent from '../i18n/content.pt';
import enContent from '../i18n/content.en';

const TODOS = [...EXERCISES, ...AMBIENTES];
const ids = TODOS.map(i => i.id);
const porObjetivo = PORTAS.filter(p => !p.diagnostico);

describe('as portas apontam para itens que existem', () => {
  it('todo id de item está no catálogo', () => {
    for (const p of PORTAS) for (const id of p.itens) expect(ids, `${p.id} → ${id}`).toContain(id);
  });

  it('nenhuma porta repete um item', () => {
    for (const p of PORTAS) expect(new Set(p.itens).size, p.id).toBe(p.itens.length);
  });

  // O contrário de "porta vazia": item que não está atrás de nenhuma porta é item que ninguém acha
  // entrando por objetivo, que é a entrada padrão do catálogo (decisão 20b).
  it('todo item do catálogo está atrás de pelo menos uma porta', () => {
    for (const i of TODOS) expect(portasDoItem(i.id).length, `${i.id} não está atrás de nenhuma porta`).toBeGreaterThan(0);
  });

  // O mesmo item servir a várias portas é o desenho, não um descuido: "qual acorde é esse?" é leitura
  // E harmonia E teoria, e esconder isso obrigaria a escolher uma por item.
  it('itens compartilhados entre portas existem, e isso é de propósito', () => {
    expect(portasDoItem('que-acorde-e-esse').length).toBeGreaterThan(1);
  });
});

describe('a regra da decisão 20: pelo menos 4 itens por porta', () => {
  it('toda porta por objetivo declara 4 ou mais itens, exceto a exceção marcada de propósito', () => {
    for (const p of porObjetivo) {
      if (p.abaixoDoMinimoPorOra) continue;
      expect(p.itens.length, p.id).toBeGreaterThanOrEqual(4);
    }
  });

  // P7 (04/11) tirou os itens de teoria e esvaziou duas portas. `harmonia` saiu da exceção em
  // 07/11, quando "Relações entre melodia e harmonia" a levou de volta a quatro itens; `teoria`
  // continua lá. Se a lista crescer, é porque alguém decidiu o destino de propósito.
  it('a única porta abaixo do mínimo é teoria, e por ora', () => {
    expect(porObjetivo.filter(p => p.abaixoDoMinimoPorOra).map(p => p.id)).toEqual(['teoria']);
  });

  it('a entrada do nivelamento é a única sem itens, e é a única marcada como diagnóstico', () => {
    const semItens = PORTAS.filter(p => p.itens.length === 0).map(p => p.id);
    expect(semItens).toEqual(['comecar']);
    expect(PORTAS.filter(p => p.diagnostico).map(p => p.id)).toEqual(['comecar']);
  });

  it('há exatamente uma porta em destaque (o carro-chefe)', () => {
    expect(PORTAS.filter(p => p.destaque).map(p => p.id)).toEqual(['notas-no-instrumento']);
  });
});

describe('o portão de publicação vale nas portas', () => {
  // `itensDaPorta` recebe o portão como terceiro argumento, como `visivel`: aqui ele é ligado, porque
  // é o comportamento do beta que precisa de guarda (hoje ele está desligado, decisão 104).
  it('com o portão ligado, rascunho não conta fora do modo de revisão', () => {
    const porta = portaPorId('tecnica')!;
    const rascunhos = porta.itens.filter(id => estadoDe(TODOS.find(i => i.id === id)?.publicacao) === 'rascunho');
    expect(rascunhos.length, 'esta porta devia ter rascunhos para o teste valer').toBeGreaterThan(0);
    expect(itensDaPorta(porta, false, true).length).toBe(porta.itens.length - rascunhos.length);
    expect(itensDaPorta(porta, true, true).length).toBe(porta.itens.length);
  });

  // Porta com poucos itens NÃO é escondida: a decisão 20 admitiu a técnica sabendo que ela enche
  // depois. Vazia, sim — porta sem nada atrás é promessa falsa.
  it('nenhuma porta fica vazia para quem usa, e nenhuma é escondida por ser pequena', () => {
    for (const p of portasVisiveis(false)) {
      if (!p.diagnostico) expect(itensDaPorta(p, false).length, p.id).toBeGreaterThan(0);
    }
    for (const p of portasVisiveis(false, true)) {
      if (!p.diagnostico) expect(itensDaPorta(p, false, true).length, p.id).toBeGreaterThan(0);
    }
    expect(portasVisiveis(false).map(p => p.id)).toEqual([...PORTA_IDS]);
  });
});

describe('os textos das nove entradas (decisão 79)', () => {
  it('cada porta tem rótulo e linha de apoio nos dois idiomas', () => {
    for (const p of PORTAS) {
      for (const [loc, c] of [['pt', ptContent], ['en', enContent]] as const) {
        expect(c.portas[p.id]?.nome?.trim(), `${loc}:${p.id}.nome`).toBeTruthy();
        expect(c.portas[p.id]?.apoio?.trim(), `${loc}:${p.id}.apoio`).toBeTruthy();
      }
    }
  });

  // A restrição da decisão 79: nenhum texto diz nada sobre quem a pessoa é (decisão 11 no texto).
  // "Você é intermediário", "para iniciantes", "nível" — nada disso pode aparecer.
  it('nenhum texto rotula quem usa', () => {
    const proibidas = /\b(iniciante|intermedi[áa]rio|avan[çc]ado|n[íi]vel|beginner|intermediate|advanced|level)\b/i;
    for (const c of [ptContent, enContent]) {
      for (const p of PORTAS) {
        const txt = `${c.portas[p.id].nome} ${c.portas[p.id].apoio}`;
        expect(proibidas.test(txt), `${p.id}: "${txt}"`).toBe(false);
      }
    }
  });

  it('e os rótulos da navegação existem nos dois idiomas', () => {
    for (const loc of ['pt', 'en'] as const) expect(translate(loc, 'train.byGoal').trim()).not.toBe('');
  });
});

describe('itens que não existem mais não ficam atrás de porta nenhuma', () => {
  // `quiz-teoria` (decisão 53) e os quatro itens de teoria que vieram da divisão dele (`P7`).
  it('nenhum aparece em `portasDoItem`', () => {
    for (const id of ['quiz-teoria', 'teoria-graus', 'teoria-acordes', 'teoria-campo', 'teoria-tonalidades']) {
      expect(portasDoItem(id), id).toEqual([]);
    }
  });
});
