-- B2 · Sincronização local-first
-- Rode depois de 20261102120000_attempts.sql, uma vez, no SQL Editor (ou via `supabase db push`).
-- Regras (ver docs/sincronizacao.md):
--   - tentativas, confiança e histórico SOMAM: cada registro tem uma chave que não muda e entra uma
--     vez só, venha de que aparelho vier;
--   - perfil, preferências, parâmetros, paleta e configurações ficam com a versão MAIS RECENTE,
--     documento por documento (tabela user_state).

-- ---------------------------------------------------------------------------
-- documentos "o mais recente vence"
-- ---------------------------------------------------------------------------
-- Uma linha por documento: 'profile', 'prefs', 'params', 'palette', 'settings:<exercício>',
-- 'legacy:<aparelho>' (totais de antes da C2, de cada aparelho) e 'reset' (último "apagar meu
-- progresso"). updated_at vem do aparelho que editou, não do servidor.
create table if not exists public.user_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null,
  primary key (user_id, key)
);

alter table public.user_state enable row level security;

create policy "user_state: dono lê" on public.user_state
  for select using (auth.uid() = user_id);
create policy "user_state: dono insere" on public.user_state
  for insert with check (auth.uid() = user_id);
create policy "user_state: dono atualiza" on public.user_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_state: dono apaga" on public.user_state
  for delete using (auth.uid() = user_id);

-- Grava só o que for mais novo que o que já está lá. Sem isso, um aparelho que leu antes e escreveu
-- depois apagaria a edição mais recente de outro. security invoker: as políticas acima valem.
create or replace function public.push_state(docs jsonb)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.user_state as s (user_id, key, value, updated_at)
  select auth.uid(), d->>'key', d->'value', (d->>'updated_at')::timestamptz
  from jsonb_array_elements(docs) as d
  on conflict (user_id, key) do update
    set value = excluded.value, updated_at = excluded.updated_at
    where s.updated_at < excluded.updated_at;
$$;

revoke all on function public.push_state(jsonb) from public;
grant execute on function public.push_state(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- histórico: a F1-01b trocou área por módulo; a chave natural evita duplicar a mesma atividade
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'history' and column_name = 'area') then
    alter table public.history rename column area to module;
  end if;
end $$;

create unique index if not exists history_user_at_exercise_key on public.history (user_id, at, exercise_id);

-- ---------------------------------------------------------------------------
-- "o que chegou ao servidor desde a última vez": synced_at é a hora em que a linha ENTROU no
-- servidor (não quando foi feita). É o que deixa um aparelho que ficou dias offline ser visto
-- pelos outros: puxar pela hora da tentativa perderia o que chegou atrasado.
-- ---------------------------------------------------------------------------
alter table public.history add column if not exists synced_at timestamptz not null default now();
alter table public.attempts add column if not exists synced_at timestamptz not null default now();
alter table public.attempt_feedback add column if not exists synced_at timestamptz not null default now();

create index if not exists history_user_synced_idx on public.history (user_id, synced_at, id);
create index if not exists attempts_user_synced_idx on public.attempts (user_id, synced_at, id);
create index if not exists attempt_feedback_user_synced_idx on public.attempt_feedback (user_id, synced_at, id);

-- ---------------------------------------------------------------------------
-- tabelas do init que nenhuma versão do app chegou a gravar e que a F1-01b tornou obsoletas
-- ---------------------------------------------------------------------------
-- stats: os totais agora saem das tentativas; arsenal e settings: viraram documentos em
-- user_state; tonality_plan: o plano de tonalidade saiu do app.
drop table if exists public.stats;
drop table if exists public.arsenal;
drop table if exists public.settings;
drop table if exists public.tonality_plan;
