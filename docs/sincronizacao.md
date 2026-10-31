# Sincronização local-first (B2)

O app funciona inteiro sem conta e sem internet: tudo fica no aparelho (`localStorage` para o
estado, IndexedDB para o registro de tentativas). Com conta, `src/sync/` mantém o aparelho igual
à conta em segundo plano. Nenhuma tela espera o servidor.

## O que soma e o que fica com a versão mais recente

| Dado | Regra | Chave que impede repetir |
| --- | --- | --- |
| Tentativas e confiança declarada (C2) | **somam** | `id` gerado no aparelho |
| Histórico de atividades | **somam** | conta + hora + exercício |
| Totais de antes da C2 | **somam**, um bloco por aparelho | `legacy:<aparelho>` |
| Perfil, preferências (idioma, nomes das notas, som), parâmetros globais, paleta | **a mais recente vence** | um documento cada |
| Configurações de cada exercício | **a mais recente vence**, exercício por exercício | `settings:<exercício>` |

"Somam" quer dizer que nada se perde por conflito: o que foi feito em qualquer aparelho entra uma
vez só na conta e aparece em todos. Os totais por exercício (acertos, tentativas) não viajam:
cada aparelho os refaz a partir das tentativas.

"A mais recente vence" é por documento, com o horário da última edição feita no aparelho. Editar
o nome no celular e o som no computador não briga — são documentos diferentes. Editar o mesmo
documento nos dois fica com a edição mais nova. O servidor confere isso de novo ao gravar
(`push_state`), para um aparelho que leu antes e gravou depois não apagar uma edição mais nova.

O horário vem do relógio de cada aparelho. Um relógio muito errado pode fazer uma edição antiga
vencer uma nova — só nos documentos "mais recente vence", nunca nas tentativas.

## Primeiro login

Leva para a conta tudo o que estava no aparelho: tentativas, histórico, totais de antes da C2,
perfil, paleta e configurações. Se a conta já tinha dados de outro aparelho, as tentativas e o
histórico somam; nos documentos, fica a versão editada por último. Dados de antes de existir a B2
contam como "editados há muito tempo": vão para a conta, mas perdem para qualquer edição feita
em outro aparelho depois.

## Quando sincroniza

Ao entrar, ao abrir ou voltar para o app, quando a internet volta, alguns segundos depois de cada
resposta ou mudança, e a cada 5 minutos com o app aberto. Uma rodada por vez. O estado aparece em
**Perfil → Conta** ("Sincronizado às …", "Sem conexão…").

Para ler o que é novo, o aparelho usa a hora em que cada linha **entrou no servidor**, não a hora
em que foi feita. Assim, o que um celular fez offline na segunda e só enviou na quinta aparece no
computador que já tinha lido tudo até quarta.

## Sair, trocar de conta, apagar

- **Sair** envia tudo para a conta e limpa o aparelho. Se não der para enviar (sem internet), não
  sai e avisa — o que não chegou à conta se perderia.
- **Outra conta no mesmo navegador** (por exemplo, depois de a sessão expirar sem "sair"): os dados
  da conta anterior saem do aparelho antes de entrar os da nova, e nunca vão para ela.
- **Apagar meu progresso**, com conta, apaga na conta (precisa de internet) e deixa um aviso com o
  horário; cada aparelho, ao sincronizar, apaga o que tiver de antes desse horário. O que um
  aparelho offline fez depois fica.
- **Apagar minha conta** apaga tudo no servidor. O que está no aparelho fica, sem dono, e entra
  por inteiro numa conta nova se a pessoa criar outra.

## O que ainda não sincroniza

- As configurações da ferramenta de leitura rítmica, que têm armazenamento próprio — vão junto
  quando a C3 unificar o gerador de partituras.
- Cargas (D5) e rotinas em andamento (D3): as tabelas entram com essas tarefas, já com estas regras
  (cargas somam; rotina em andamento fica com a mais recente).

## Onde está no código

- `src/state/syncMeta.ts` — as regras, em funções puras: o que é documento, carimbo das edições,
  quem vence, junção do histórico, "apagar progresso".
- `src/sync/engine.ts` — uma rodada de sincronização, na ordem certa.
- `src/sync/remote.ts` — a conversa com o Supabase.
- `src/sync/index.ts` — quando rodar, e sair/apagar.
- `src/sync/engine.test.ts` — dois aparelhos contra um servidor em memória que imita o Supabase
  (`memoryRemote.ts`), incluindo o critério de pronto da B2.
- `supabase/migrations/20261103120000_sync.sql` — `user_state`, `push_state` e `synced_at`.
