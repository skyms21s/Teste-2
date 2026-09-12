# Cardapio Digital SaaS

Base multiempresa (multitenant) de um SaaS de **cardapio digital e gestao de pedidos** para
restaurantes, hamburguerias, pizzarias, acaiterias e similares.

Esta primeira etapa entrega **apenas a fundacao** do sistema: autenticacao, estrutura
multiempresa, RLS, protecao de rotas e o painel inicial. Produtos, categorias, carrinho,
pedidos, impressao, pagamentos e integracoes **ainda nao existem** — o projeto foi organizado
para receber esses modulos sem retrabalho.

## Stack

| Camada        | Tecnologia                                   |
| ------------- | -------------------------------------------- |
| Framework     | Next.js 16 (App Router, Server Actions)      |
| Linguagem     | TypeScript (strict)                          |
| Estilo        | Tailwind CSS v4                              |
| Auth + Banco  | Supabase (Postgres + Auth + Storage + RLS)   |
| Validacao     | Zod                                          |

---

## 1. Instalar dependencias

```bash
npm install
```

Requisitos: Node.js 20+ (testado em Node 22).

## 2. Configurar o Supabase

1. **Criar o projeto**: <https://supabase.com/dashboard> > **New project**. Escolha organizacao,
   nome, uma senha forte de banco (guarde: ela nao aparece de novo) e a regiao mais proxima
   (`South America (Sao Paulo)` para o Brasil). O provisionamento leva ~2 minutos.

2. **Aplicar o schema**: abra **SQL Editor** > **New query**, cole todo o conteudo de
   [`supabase/migrations/20260101000000_init_multitenant.sql`](supabase/migrations/20260101000000_init_multitenant.sql)
   e clique em **Run**. O script e idempotente (pode rodar de novo sem quebrar nada) e cria
   tabelas, enums, triggers, funcoes, todas as policies de RLS e o bucket de Storage.

   Alternativa pela CLI, na sua maquina (precisa da senha do banco):

   ```bash
   npx supabase link --project-ref <ref-do-projeto>
   npx supabase db push
   ```

3. **Conferir o que foi criado**: em **Table Editor** devem aparecer `profiles`, `businesses` e
   `business_members`, todas com o cadeado de *RLS enabled*; em **Storage**, o bucket
   `business-assets`.

4. **Provedor de e-mail/senha**: **Authentication > Sign In / Providers > Email** habilitado.
   A opcao **Confirm email** pode ficar ligada (producao) ou desligada (facilita os testes).

5. **URLs de autenticacao**: **Authentication > URL Configuration**
   - **Site URL**: `http://localhost:3000` (em producao, o dominio real)
   - **Redirect URLs**: adicione `http://localhost:3000/auth/confirmar`
     (e `https://SEU-DOMINIO/auth/confirmar` quando publicar)

   Sem esse redirect, os links de confirmacao e de recuperacao de senha nao voltam para o app.

6. **Credenciais**: **Project Settings > API**
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - chave `anon` / `publishable` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   A chave `service_role` / `secret` **nao e usada neste projeto**. Nunca a coloque no
   `.env.local`, no codigo ou no Git: ela ignora todo o RLS.

## 3. Variaveis de ambiente

Copie o exemplo e preencha:

```bash
cp .env.example .env.local
```

| Variavel                        | Obrigatoria | Descricao                                                              |
| ------------------------------- | ----------- | ---------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | sim         | URL do projeto Supabase (`https://xxxx.supabase.co`)                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sim         | Chave publica (anon / publishable) do projeto                          |
| `NEXT_PUBLIC_SITE_URL`          | recomendada | URL base usada nos links de e-mail (padrao: `http://localhost:3000`)   |

> Nenhuma `service_role key` e usada no projeto. Todo acesso ao banco passa pela chave
> publica + sessao do usuario, e o isolamento entre empresas e garantido pelo RLS.

## 4. Rodar localmente

```bash
npm run dev                # http://localhost:3000
npm run build              # build de producao
npm run start              # servir o build
npm run lint               # ESLint
npm run typecheck          # TypeScript sem emitir arquivos
npm run validate:supabase  # validacao end-to-end contra o Supabase real (secao 5)
```

Fluxo para testar: `/cadastro` -> confirmar e-mail -> `/onboarding` (cria a empresa) ->
`/dashboard`.

---

## 5. Validar a Etapa 1 no Supabase real

Com o `.env.local` preenchido e o schema aplicado:

```bash
npm run dev              # em um terminal
npm run validate:supabase  # em outro
```

O script `scripts/validate-supabase.mjs` usa **apenas a URL e a anon key** e verifica, de ponta
a ponta e contra o projeto real: conexao e schema, bucket de Storage, cadastro, login, login com
senha errada, criacao do profile pelo trigger, criacao da empresa, promocao automatica a `owner`,
edicao das configuracoes, slug duplicado, upload de logo, isolamento entre duas empresas
(leitura, edicao, exclusao, auto-inclusao como membro, perfis e Storage), visitante anonimo,
pedido de recuperacao de senha, logout e — com o app no ar — a protecao de `/dashboard`,
`/dashboard/pedidos` e `/onboarding`, o redirecionamento de quem ja esta logado e a renderizacao
da visao geral. Ao final ele apaga as empresas de teste que criou.

Observacoes:

- Se **Confirm email** estiver ativo, o script para e explica: desative temporariamente para a
  validacao automatica e teste a confirmacao por e-mail manualmente com o seu endereco real.
- Os usuarios de teste continuam em **Authentication > Users** e podem ser removidos a mao.
- O SMTP padrao do Supabase tem limite baixo de envios; o script trata `over_email_send_rate_limit`
  como aceitavel (o endpoint respondeu, so a entrega foi limitada).

Checklist manual que complementa o script (precisa de um e-mail real):

| Fluxo | Como testar |
| ----- | ----------- |
| Confirmacao de e-mail | cadastre-se em `/cadastro` e clique no link recebido |
| Recuperacao de senha | `/recuperar-senha` > link do e-mail > `/nova-senha` |
| Logout | botao **Sair** no topo do painel |
| Upload de logo/capa | `/dashboard/configuracoes` |

## 6. Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/                  # telas publicas de autenticacao
│   │   ├── actions.ts           # server actions: login, cadastro, recuperacao, logout
│   │   ├── entrar/              # /entrar
│   │   ├── cadastro/            # /cadastro
│   │   ├── recuperar-senha/     # /recuperar-senha
│   │   └── nova-senha/          # /nova-senha (apos o link do e-mail)
│   ├── auth/confirmar/route.ts  # valida o token do e-mail e cria a sessao
│   ├── dashboard/               # area privada
│   │   ├── layout.tsx           # 2a camada de protecao + shell do painel
│   │   ├── page.tsx             # Visao geral
│   │   ├── pedidos|cardapio|clientes|relatorios/   # placeholders
│   │   ├── configuracoes/       # dados da empresa (somente owner)
│   │   └── actions.ts           # troca de empresa ativa
│   ├── onboarding/              # criacao da primeira empresa
│   ├── layout.tsx | page.tsx | not-found.tsx | globals.css
│   └── ...
├── components/
│   ├── ui/                      # Button, Input, Card, Alert, Badge, ...
│   ├── auth/                    # formularios de autenticacao
│   ├── dashboard/               # shell, sidebar, navegacao, troca de empresa
│   └── business/                # formularios da empresa e upload de imagens
├── lib/
│   ├── supabase/                # client (browser), server, proxy, erros
│   ├── validations/             # schemas Zod
│   ├── constants/               # rotas e menu lateral
│   ├── utils/                   # cn, slugify, labels
│   └── env.ts                   # leitura validada das variaveis de ambiente
├── services/                    # acesso a dados (auth, empresas, membros)
├── types/                       # tipos do banco e do dominio
└── proxy.ts                     # protecao de rotas + renovacao de sessao

supabase/
├── migrations/                  # schema + RLS (rodar no SQL Editor)
└── tests/                       # suite SQL que valida o isolamento entre empresas
```

### Camadas de protecao

1. **`src/proxy.ts`** — redireciona visitantes de `/dashboard` e `/onboarding` para `/entrar`
   e tira o usuario logado das telas de login/cadastro.
2. **`src/app/dashboard/layout.tsx`** — revalida a sessao no servidor com `auth.getUser()`.
3. **RLS no Postgres** — mesmo que as camadas acima falhem, o banco so devolve os dados das
   empresas em que o usuario e membro.

---

## 7. Banco de dados

### `profiles`
Espelha `auth.users` (criado automaticamente pelo trigger `on_auth_user_created`).

| Coluna | Tipo |
| ------ | ---- |
| `id` (PK -> auth.users) | uuid |
| `full_name`, `email`, `phone`, `avatar_url` | text |
| `created_at`, `updated_at` | timestamptz |

### `businesses` (tenant)

| Coluna | Tipo |
| ------ | ---- |
| `id` | uuid (PK) |
| `name` | text |
| `slug` | text **unico** — usado em `/loja/{slug}` |
| `logo_url`, `cover_url`, `phone`, `address`, `description` | text |
| `plan` | enum `free` \| `pro` \| `enterprise` |
| `status` | enum `active` \| `inactive` \| `suspended` |
| `created_at`, `updated_at` | timestamptz |

### `business_members` (usuario <-> empresa)

| Coluna | Tipo |
| ------ | ---- |
| `id` | uuid (PK) |
| `business_id` | uuid -> businesses |
| `user_id` | uuid -> auth.users |
| `role` | enum `owner` \| `manager` \| `employee` |
| `created_at` | timestamptz |

Restricao `unique (business_id, user_id)`: um usuario entra uma unica vez por empresa, mas
pode pertencer a varias empresas, e cada empresa pode ter varios funcionarios.

### Triggers

- `on_auth_user_created` — cria o `profile` de cada novo usuario.
- `on_business_created` — quem cria a empresa vira `owner` em `business_members`.
- `business_members_protect_last_owner` — impede remover/rebaixar o ultimo owner.
- `*_set_updated_at` — mantem `updated_at`.

### Funcoes auxiliares (SECURITY DEFINER)

`current_user_business_ids()`, `is_business_member()`, `has_business_role()`,
`shares_business_with()` e `can_manage_business_folder()`. Elas evitam recursao infinita nas
policies e so respondem sobre o usuario autenticado (`auth.uid()`).

---

## 8. Policies de RLS

RLS habilitado em `profiles`, `businesses`, `business_members` e `storage.objects`.

| Tabela | Policy | Operacao | Regra |
| ------ | ------ | -------- | ----- |
| `profiles` | `profiles_select_self_or_coworkers` | SELECT | proprio perfil ou colega da mesma empresa |
| `profiles` | `profiles_insert_self` | INSERT | apenas o proprio `id` |
| `profiles` | `profiles_update_self` | UPDATE | apenas o proprio `id` |
| `businesses` | `businesses_select_members` | SELECT | somente membros da empresa |
| `businesses` | `businesses_insert_authenticated` | INSERT | qualquer usuario autenticado |
| `businesses` | `businesses_update_owner` | UPDATE | somente `owner` |
| `businesses` | `businesses_delete_owner` | DELETE | somente `owner` |
| `business_members` | `business_members_select_same_business` | SELECT | membros da mesma empresa |
| `business_members` | `business_members_insert_owner` | INSERT | somente `owner` |
| `business_members` | `business_members_update_owner` | UPDATE | somente `owner` |
| `business_members` | `business_members_delete_owner` | DELETE | somente `owner` |
| `storage.objects` | `business_assets_public_read` | SELECT | leitura publica do bucket `business-assets` |
| `storage.objects` | `business_assets_insert_members` | INSERT | `owner`/`manager` e apenas na pasta `{business_id}/` |
| `storage.objects` | `business_assets_update_members` | UPDATE | idem |
| `storage.objects` | `business_assets_delete_members` | DELETE | idem |

### Testar o isolamento

`supabase/tests/` contem uma suite que cria tres usuarios e duas empresas e verifica, entre
outras coisas, que um usuario nao le, edita, apaga nem se auto-adiciona na empresa de outro.
Pode ser executada em qualquer Postgres 16:

```bash
psql "$DATABASE_URL" -f supabase/tests/00_supabase_stub.sql   # apenas fora do Supabase
psql "$DATABASE_URL" -f supabase/migrations/20260101000000_init_multitenant.sql
psql "$DATABASE_URL" -f supabase/tests/01_rls_test.sql
```

> `00_supabase_stub.sql` recria o minimo dos schemas `auth` e `storage`. **Nao rode esse
> arquivo no Supabase** — la esses schemas ja existem.

---

## 9. O que ja funciona

- Cadastro, login, logout e recuperacao de senha (Supabase Auth + Server Actions).
- Criacao da empresa no onboarding, com slug unico validado.
- Painel responsivo (sidebar fixa no desktop, drawer no celular) com Visao geral, Pedidos,
  Cardapio, Clientes, Relatorios e Configuracoes.
- Visao geral exibindo nome da empresa, plano, status e nome/e-mail do usuario logado.
- Configuracoes: o `owner` edita nome, telefone, endereco, descricao, logo e capa
  (upload para o Storage, isolado por pasta da empresa).
- Troca de empresa ativa quando o usuario pertence a mais de um estabelecimento.

## 10. Proximo passo recomendado

Modulo de **cardapio**: tabelas `categories` e `products` com `business_id`, as mesmas
policies de RLS por empresa, CRUD em `/dashboard/cardapio` e, em seguida, a pagina publica
`/loja/[slug]`.
