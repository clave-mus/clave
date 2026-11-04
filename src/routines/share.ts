// Compartilhar rotina por link (F3-7, decisão 23).
//
// **É o limite inteiro da decisão 23, e o limite é o ponto.** Link entrega o valor de passar uma
// rotina adiante **sem** biblioteca pública — e o momento em que o Clave publica texto de uma pessoa
// onde outra lê, ele herda moderação, denúncia, termos de uso, LGPD e ECA de uma vez. Então: nenhuma
// listagem, nenhum perfil, nenhuma busca, nenhum comentário. Um link, que quem tem abre.
//
// **A rotina viaja no próprio link**, não num servidor: não há o que moderar nem o que apagar, e
// receber não pede conta. O custo é o tamanho, e é por isso que a serialização é enxuta.
import { migrarRotina } from './storage';
import { FORMATO_ROTINA, type Etapa, type Instancia, type Rotina } from './types';

/** O que viaja. Chaves curtas de propósito: o link precisa caber numa mensagem de WhatsApp. */
interface RotinaNoLink {
  v: number;
  n: string;
  /** `g` guiada, `l` livre. */
  m: 'g' | 'l';
  /** Embaralhar. Ausente = não. */
  e?: 1;
  no?: string;
  /** Quem mandou, se quis se identificar. */
  a?: string;
  /** Rotação: parâmetro, valores e política de avanço. */
  r?: { p: string; v: unknown[]; a: number };
  /** Etapas: `[politica, segundos, instâncias]`. */
  p: [number, number, [string, Record<string, unknown>, Record<string, unknown>?][]][];
}

const POLITICAS = ['ordem', 'sorteio', 'sorteio-sem-repetir'] as const;

/**
 * O limite de um link que cabe onde links são colados.
 *
 * Não é regra de protocolo — URLs aguentam muito mais. É que link que quebra em duas linhas no
 * WhatsApp quebra na prática, e rotina de trinta etapas é melhor refeita do que recebida.
 */
export const LIMITE_DO_LINK = 2000;

/** Compacta a rotina. Nada do que é local viaja: id, `ultimaUsada`, posição da rotação, visitas. */
export function paraLink(r: Rotina, autor?: string): string {
  const dados: RotinaNoLink = {
    v: FORMATO_ROTINA,
    n: r.nome,
    m: r.modo === 'guiado' ? 'g' : 'l',
    ...(r.embaralhar ? { e: 1 as const } : {}),
    ...(r.notas ? { no: r.notas } : {}),
    ...(autor ? { a: autor } : {}),
    ...(r.rotacao ? { r: { p: r.rotacao.param, v: r.rotacao.valores, a: r.rotacao.avanco.kind === 'manual' ? 0 : r.rotacao.avanco.n } } : {}),
    p: r.etapas.map(e => [
      POLITICAS.indexOf(e.politica),
      e.segundosSugeridos ?? 0,
      e.instancias.map(i => (i.params && Object.keys(i.params).length
        ? [i.itemId, i.settings, i.params] as [string, Record<string, unknown>, Record<string, unknown>]
        : [i.itemId, i.settings] as [string, Record<string, unknown>])),
    ]),
  };
  return base64url(JSON.stringify(dados));
}

/** O link inteiro, a partir da origem em que o app está rodando. */
export const linkDaRotina = (r: Rotina, origem: string, autor?: string) =>
  `${origem.replace(/\/$/, '')}/r/${paraLink(r, autor)}`;

/** O link é curto o bastante para ser colado numa conversa? */
export const cabeNoLink = (r: Rotina, origem: string, autor?: string) =>
  linkDaRotina(r, origem, autor).length <= LIMITE_DO_LINK;

/**
 * Lê uma rotina de um link.
 *
 * **Nunca lança, e o `null` é o caminho normal**, não a exceção: isto recebe texto que veio de fora
 * do app — link truncado pelo aplicativo de mensagem, colagem pela metade, versão de um Clave mais
 * novo. Quem chama mostra "não deu para ler este link" e segue.
 *
 * A rotina volta **sem id**: quem a adota é que cria o dela (decisão 9 e `copiarRotina`).
 */
export function doLink(texto: string): { rotina: Rotina; autor?: string } | null {
  try {
    const d = JSON.parse(deBase64url(texto)) as Partial<RotinaNoLink>;
    if (!d || typeof d !== 'object' || !Array.isArray(d.p) || typeof d.n !== 'string') return null;
    const etapas: Etapa[] = d.p.map((e, k) => {
      const [pol, seg, insts] = e;
      return {
        id: `link-${k + 1}`,
        politica: POLITICAS[pol] ?? 'ordem',
        ...(seg ? { segundosSugeridos: seg } : {}),
        instancias: (Array.isArray(insts) ? insts : []).map(([itemId, settings, params]): Instancia => ({
          itemId,
          settings: (settings ?? {}) as Instancia['settings'],
          ...(params ? { params: params as Instancia['params'] } : {}),
        })),
      };
    });
    const bruta = {
      formato: typeof d.v === 'number' ? d.v : FORMATO_ROTINA,
      // Id provisório: `migrarRotina` exige um, e quem adota troca por um seu. Marcado para o caso de
      // alguém gravá-lo sem adotar — aí dá para ver na mão de onde veio.
      id: 'do-link',
      nome: d.n,
      ...(d.no ? { notas: d.no } : {}),
      modo: d.m === 'l' ? 'livre' : 'guiado',
      embaralhar: d.e === 1,
      params: {},
      etapas,
      ...(d.r ? { rotacao: { param: d.r.p, valores: d.r.v, posicao: 0, avanco: d.r.a ? { kind: 'execucoes', n: d.r.a } : { kind: 'manual' }, visitas: [] } } : {}),
    };
    const rotina = migrarRotina(bruta);
    return rotina ? { rotina, autor: typeof d.a === 'string' ? d.a : undefined } : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// base64url
// ---------------------------------------------------------------------------
// `btoa` não aceita acento, e nome de rotina tem acento em português. Então: UTF-8 → bytes → base64,
// e sem `+`, `/` e `=`, que viram outra coisa quando um aplicativo de mensagem "ajuda" com a URL.

function base64url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
