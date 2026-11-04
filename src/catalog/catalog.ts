// A lista do catálogo. **Só a lista** — cada família mora em `items/<id>.ts` e o que é comum em
// `helpers.ts` (F1-5).
//
// Existia um arquivo de 946 linhas com tudo dentro. Com quatro pessoas mexendo, todo PR tocava o
// mesmo arquivo e todo PR dava conflito; e o arquivo grande também escondia o que a decisão 15 quer
// visível — que item novo quase sempre é **parâmetro ou modo** de um que já existe.
//
// **A ordem desta lista é a ordem em que os itens aparecem** onde não há agrupamento.
import { queNotaEEssa } from './items/que-nota-e-essa';
import { acheANota } from './items/ache-a-nota';
import { queIntervaloEEsse } from './items/que-intervalo-e-esse';
import { queAcordeEEsse } from './items/que-acorde-e-esse';
import { pautaArmadura } from './items/pauta-armadura';
import { pautaEscala } from './items/pauta-escala';
import { teoriaGraus } from './items/teoria-graus';
import { teoriaAcordes } from './items/teoria-acordes';
import { teoriaCampo } from './items/teoria-campo';
import { teoriaTonalidades } from './items/teoria-tonalidades';
import { teoriaIntervalos } from './items/teoria-intervalos';
import { ouvidoTecla } from './items/ouvido-tecla';
import { ouvidoIntervalo } from './items/ouvido-intervalo';
import { ouvidoAcorde } from './items/ouvido-acorde';
import { ouvidoEscala } from './items/ouvido-escala';
import { ouvidoCelulas } from './items/ouvido-celulas';
import { ritmoOuvido } from './items/ritmo-ouvido';
import type { CatalogItem } from './types';

export const EXERCISES: CatalogItem[] = [
  queNotaEEssa,
  acheANota,
  queIntervaloEEsse,
  queAcordeEEsse,
  pautaArmadura,
  pautaEscala,
  teoriaGraus,
  teoriaAcordes,
  teoriaCampo,
  teoriaTonalidades,
  teoriaIntervalos,
  ouvidoTecla,
  ouvidoIntervalo,
  ouvidoAcorde,
  ouvidoEscala,
  ouvidoCelulas,
  ritmoOuvido,
];

export const exerciseById = Object.fromEntries(EXERCISES.map(e => [e.id, e])) as Record<string, CatalogItem>;
