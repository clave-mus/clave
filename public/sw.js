/*
 * Cache offline do Clave.
 *
 * ## Por que isto existe
 *
 * O Paulo estuda no ônibus, e até 10/11/2026 o app **não funcionava sem rede** — não havia service
 * worker nem manifest. Num ônibus sem sinal ele provavelmente não abria.
 *
 * Isto também é **pré-requisito do piano de amostras**: o sintetizador de hoje nunca falha por rede,
 * e trocá-lo por amostras sem cache tornaria o ônibus pior, não melhor — o exercício começaria em
 * silêncio esperando o download.
 *
 * ## A estratégia, e por que ela não pode te prender numa versão velha
 *
 * O maior risco de cache num app que muda toda semana é a pessoa ficar presa numa versão antiga para
 * sempre. Duas regras evitam isso, e elas dependem de um detalhe do Vite:
 *
 * - **`/assets/*` é imutável** porque o Vite põe o hash do conteúdo no nome do arquivo. Mudou o
 *   conteúdo, mudou o nome. Então `cache-first` ali **nunca** serve conteúdo velho — serve o arquivo
 *   que aquele nome sempre teve;
 * - **a navegação é `network-first`**. O `index.html` é o único arquivo com nome fixo, e é ele que
 *   aponta para os hashes novos. Com rede, você recebe o HTML novo e os assets novos vêm atrás; sem
 *   rede, cai no cache e o app abre igual.
 *
 * Não há lista de precache, de propósito: o cache se enche com o que você usa. Primeira visita
 * precisa de rede; a partir dela, o que você tocou funciona offline. Para o uso real — abrir em casa
 * e praticar no ônibus — é o que basta, e evita um passo de build que teria de ser mantido em sincronia.
 *
 * `skipWaiting` + `clients.claim()` fazem a versão nova assumir na hora. A troca a meio caminho é um
 * risco teórico aqui (os assets são imutáveis e o app é estático), e é muito menor que o de ficar
 * preso numa versão antiga.
 */
const CACHE = 'clave-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter(n => n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

/** Guarda só o que vale: resposta boa, do mesmo site, e nunca resposta opaca. */
async function guardar(req, res) {
  if (!res || !res.ok || res.type === 'opaque') return;
  const cache = await caches.open(CACHE);
  await cache.put(req, res.clone());
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navegação: rede primeiro, para a versão nova chegar assim que houver sinal.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        await guardar(req, res);
        return res;
      } catch {
        return (await caches.match(req)) ?? (await caches.match('/')) ?? Response.error();
      }
    })());
    return;
  }

  // Assets com hash no nome: cache primeiro. O nome muda quando o conteúdo muda.
  // As amostras de piano entram na mesma regra: não têm hash, mas são gravações — o conteúdo de
  // `C4.mp3` não muda numa atualização do app. Trocar o conjunto de amostras um dia = trocar o
  // nome da pasta (`/amostras/piano2/`), que é o mesmo contrato do hash.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/amostras/')) {
    e.respondWith((async () => {
      const doCache = await caches.match(req);
      if (doCache) return doCache;
      const res = await fetch(req);
      await guardar(req, res);
      return res;
    })());
    return;
  }

  // O resto do mesmo site: rede primeiro, cache como rede de segurança.
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      await guardar(req, res);
      return res;
    } catch {
      return (await caches.match(req)) ?? Response.error();
    }
  })());
});
