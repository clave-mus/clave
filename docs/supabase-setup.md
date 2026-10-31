# Configurar o Supabase (B1)

Passo a passo para quem for criar/configurar o projeto Supabase do Clave. O código já está
pronto esperando esses dados — nada aqui precisa de outra mudança no app.

## 1. Criar o projeto

1. Entre em [supabase.com](https://supabase.com) e crie uma conta (ou entre com GitHub).
2. **New project**. Escolha o plano **Free**, uma senha forte para o banco (guarde — só serve
   para acesso direto ao Postgres, o app não usa) e a região mais perto do público (ex.:
   `South America (São Paulo)`).
3. Espere o projeto provisionar (1–2 minutos).

## 2. Rodar o schema

1. No menu lateral, abra **SQL Editor → New query**.
2. Copie o conteúdo de
   [supabase/migrations/20261023120000_init.sql](../supabase/migrations/20261023120000_init.sql)
   e cole ali.
3. Clique em **Run**. Isso cria as sete tabelas (perfil, estatísticas, histórico, arsenal,
   configurações, cargas, plano de tonalidade), liga o RLS em todas (cada um só vê os próprios
   dados) e cria a função `delete_my_account` usada para apagar a conta.
4. Repita os passos 1 a 3 com
   [supabase/migrations/20261102120000_attempts.sql](../supabase/migrations/20261102120000_attempts.sql):
   cria `attempts` e `attempt_feedback` (o registro de tentativas da C2), com RLS e sem
   permissão de alterar uma tentativa já gravada.
5. Repita com
   [supabase/migrations/20261103120000_sync.sql](../supabase/migrations/20261103120000_sync.sql)
   (B2, sincronização): cria `user_state` e a função `push_state`, prepara o histórico e as
   tentativas para serem lidos "pelo que chegou de novo", e **apaga** as tabelas `stats`,
   `arsenal`, `settings` e `tonality_plan` do passo 3, que nenhuma versão do app chegou a usar.
   As três migrações rodam nessa ordem, uma vez cada.
6. Confira em **Table Editor** que as tabelas apareceram.

## 3. Pegar as chaves e configurar o app

1. **Project Settings → API**.
2. Copie **Project URL** e a chave **anon public** (não a `service_role` — essa nunca deve ir
   para o app nem para o git).
3. No projeto, rode:
   ```bash
   cp .env.example .env.local
   ```
   e preencha:
   ```
   VITE_SUPABASE_URL=<Project URL>
   VITE_SUPABASE_ANON_KEY=<anon public key>
   ```
4. `.env.local` já está no `.gitignore` — não é commitado.
5. Para a prévia do Cloudflare Pages também ter conta funcionando: no projeto do Cloudflare,
   **Settings → Environment variables**, adicione as mesmas duas variáveis (ambiente de
   produção e de prévia).

## 4. Ligar o login por e-mail (link mágico)

Já vem ligado por padrão em projetos novos do Supabase. Para conferir: **Authentication →
Providers → Email**, com **Enable email provider** ativo e **Confirm email** como preferir
(com link mágico, geralmente deixa desativado o "confirm email" tradicional, já que o próprio
link já confirma).

Em **Authentication → URL Configuration**, adicione as origens que vão redirecionar de volta:
- `http://localhost:5173` (desenvolvimento)
- `https://clave-5te.pages.dev` (produção)
- `https://*.clave-5te.pages.dev` (prévias de pull request, se o Supabase aceitar coringa; senão
  adicione cada prévia específica quando for testar uma)

## 5. Ligar o login com Google

1. No [Google Cloud Console](https://console.cloud.google.com/), crie um projeto (ou use um
   existente) → **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Tipo de aplicativo: **Web application**.
3. Em **Authorized redirect URIs**, cole a URL de callback que o Supabase mostra em
   **Authentication → Providers → Google** (algo como
   `https://<seu-projeto>.supabase.co/auth/v1/callback`).
4. Copie o **Client ID** e o **Client Secret** gerados.
5. No Supabase, **Authentication → Providers → Google**: ative, cole Client ID e Client Secret,
   salve.

## 6. Ligar o login com Apple ("Sign in with Apple")

Precisa de uma conta no **Apple Developer Program** (99 USD/ano) — se ainda não tiver, esse é o
bloqueio real aqui; o resto do app funciona sem isso (fica só sem o botão Apple funcionando).

1. No [Apple Developer](https://developer.apple.com/account/), crie um **Services ID** com
   "Sign in with Apple" habilitado, apontando para o domínio e para a URL de callback que o
   Supabase mostra em **Authentication → Providers → Apple**.
2. Gere a chave privada (Keys → novo registro com "Sign in with Apple").
3. No Supabase, **Authentication → Providers → Apple**: preencha Services ID, Team ID, Key ID e
   a chave privada, salve.

## 7. Testar

1. `npm run dev`, abra `/perfil`, role até **Conta**.
2. Informe uma data de nascimento de 13+ anos → aparecem os botões de entrar.
3. Teste o link mágico com um e-mail seu: deve chegar um e-mail do Supabase; ao clicar, volta
   para o app já logado.
4. Teste Google e, se configurado, Apple.
5. Teste **Apagar minha conta**: confirme que a conta some do **Authentication → Users** do
   Supabase e que as linhas das tabelas (`profiles`, etc.) somem também.

## Testar a sincronização (B2)

Com dois navegadores (ou um normal e uma janela anônima) logados na mesma conta:

1. No primeiro, responda alguns exercícios e mude uma configuração. Em **Perfil → Conta**
   aparece "Sincronizado às …".
2. Abra o segundo: o mesmo progresso aparece (Progresso, histórico, configurações).
3. Desligue a internet do primeiro (DevTools → Network → Offline), responda mais alguns, ligue de
   novo: em alguns segundos o segundo navegador mostra tudo ao voltar a ficar visível.
4. No **Table Editor**, `attempts` e `history` têm uma linha por tentativa/atividade, sem repetir.

As regras (o que soma, o que fica com a versão mais recente, sair, apagar progresso) estão em
[sincronizacao.md](sincronizacao.md).
