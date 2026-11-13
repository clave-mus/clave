// A lista do catálogo. **Só a lista** — cada família mora em `items/<id>.ts` e o que é comum em
// `helpers.ts` (F1-5).
//
// Existia um arquivo de 946 linhas com tudo dentro. Com quatro pessoas mexendo, todo PR tocava o
// mesmo arquivo e todo PR dava conflito; e o arquivo grande também escondia o que a decisão 15 quer
// visível — que item novo quase sempre é **parâmetro ou modo** de um que já existe.
//
// **A ordem desta lista é a ordem em que os itens aparecem** onde não há agrupamento.
import { notaNaPautaItem } from './items/nota-na-pauta';
import { notaNoInstrumento } from './items/nota-no-instrumento';
import { intervaloNaPauta } from './items/intervalo-na-pauta';
import { intervaloNoInstrumento } from './items/intervalo-no-instrumento';
import { acordeNaPauta } from './items/acorde-na-pauta';
import { acordeNoInstrumento } from './items/acorde-no-instrumento';
import { pautaArmadura } from './items/pauta-armadura';
import { pautaEscala } from './items/pauta-escala';
import { teoriaIntervalos } from './items/teoria-intervalos';
import { ouvidoTecla } from './items/ouvido-tecla';
import { ouvidoIntervalo } from './items/ouvido-intervalo';
import { ouvidoAcorde } from './items/ouvido-acorde';
import { ouvidoCampo } from './items/ouvido-campo';
import { melodiaDeOuvido } from './items/melodia-de-ouvido';
import { ouvidoEscala } from './items/ouvido-escala';
import { ouvidoCelulas } from './items/ouvido-celulas';
import { reconhecerPadroesEscala } from './items/reconhecer-padroes-escala';
import { ritmoOuvido } from './items/ritmo-ouvido';
import type { CatalogItem } from './types';

export const EXERCISES: CatalogItem[] = [
  notaNaPautaItem,
  notaNoInstrumento,
  intervaloNaPauta,
  intervaloNoInstrumento,
  acordeNaPauta,
  acordeNoInstrumento,
  pautaArmadura,
  pautaEscala,
  teoriaIntervalos,
  ouvidoTecla,
  ouvidoIntervalo,
  ouvidoAcorde,
  ouvidoCampo,
  melodiaDeOuvido,
  ouvidoEscala,
  ouvidoCelulas,
  reconhecerPadroesEscala,
  ritmoOuvido,
];

export const exerciseById = Object.fromEntries(EXERCISES.map(e => [e.id, e])) as Record<string, CatalogItem>;
