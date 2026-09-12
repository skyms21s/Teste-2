-- =============================================================================
-- Cardapio Digital SaaS - estrutura base multiempresa (multitenant)
-- =============================================================================
-- Cria:
--   * enums de plano, status e papel do membro
--   * tabelas: profiles, businesses, business_members
--   * funcoes auxiliares (SECURITY DEFINER) usadas pelas policies de RLS
--   * triggers de automacao (perfil do usuario, owner da empresa, updated_at)
--   * Row Level Security em todas as tabelas
--   * bucket de storage para logo/capa com policies por empresa
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Tipos
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'business_plan') then
    create type public.business_plan as enum ('free', 'pro', 'enterprise');
  end if;

  if not exists (select 1 from pg_type where typname = 'business_status') then
    create type public.business_status as enum ('active', 'inactive', 'suspended');
  end if;

  if not exists (select 1 from pg_type where typname = 'member_role') then
    create type public.member_role as enum ('owner', 'manager', 'employee');
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- 2. Tabelas
-- -----------------------------------------------------------------------------

-- Perfil publico do usuario (1:1 com auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Dados publicos do usuario autenticado (espelha auth.users).';

-- Empresa / estabelecimento (tenant)
create table if not exists public.businesses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 2 and 120),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  logo_url    text,
  cover_url   text,
  phone       text,
  address     text,
  description text,
  plan        public.business_plan   not null default 'free',
  status      public.business_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.businesses is 'Tenant do sistema. O slug sera usado nas URLs publicas (/loja/{slug}).';

-- Vinculo usuario <-> empresa (permite varios funcionarios por empresa)
create table if not exists public.business_members (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id     uuid not null references auth.users (id)        on delete cascade,
  role        public.member_role not null default 'employee',
  created_at  timestamptz not null default now(),
  unique (business_id, user_id)
);

comment on table public.business_members is 'Relaciona usuarios e empresas com papel (owner, manager, employee).';

create index if not exists business_members_user_id_idx     on public.business_members (user_id);
create index if not exists business_members_business_id_idx on public.business_members (business_id);
create index if not exists businesses_slug_idx              on public.businesses (slug);

-- -----------------------------------------------------------------------------
-- 3. Funcoes auxiliares
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER evita recursao infinita nas policies: a funcao le
-- business_members ignorando RLS, mas so devolve informacao sobre o
-- proprio usuario autenticado (auth.uid()).

create or replace function public.current_user_business_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select bm.business_id
  from public.business_members bm
  where bm.user_id = auth.uid();
$$;

create or replace function public.is_business_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = p_business_id
      and bm.user_id = auth.uid()
  );
$$;

create or replace function public.has_business_role(
  p_business_id uuid,
  p_roles public.member_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = p_business_id
      and bm.user_id = auth.uid()
      and bm.role = any (p_roles)
  );
$$;

-- Dois usuarios compartilham pelo menos uma empresa?
create or replace function public.shares_business_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members me
    join public.business_members other on other.business_id = me.business_id
    where me.user_id = auth.uid()
      and other.user_id = p_user_id
  );
$$;

-- Usada pelas policies de storage: a primeira pasta do arquivo e o id da empresa
create or replace function public.can_manage_business_folder(p_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
begin
  begin
    v_business_id := ((storage.foldername(p_path))[1])::uuid;
  exception
    when others then
      return false;
  end;

  return public.has_business_role(
    v_business_id,
    array['owner', 'manager']::public.member_role[]
  );
end;
$$;

revoke execute on function public.current_user_business_ids()                     from public;
revoke execute on function public.is_business_member(uuid)                        from public;
revoke execute on function public.has_business_role(uuid, public.member_role[])   from public;
revoke execute on function public.shares_business_with(uuid)                      from public;
revoke execute on function public.can_manage_business_folder(text)                from public;

grant execute on function public.current_user_business_ids()                     to authenticated;
grant execute on function public.is_business_member(uuid)                        to authenticated;
grant execute on function public.has_business_role(uuid, public.member_role[])   to authenticated;
grant execute on function public.shares_business_with(uuid)                      to authenticated;
grant execute on function public.can_manage_business_folder(text)                to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Triggers
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

-- Cria o profile automaticamente a cada novo usuario do Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '')
  )
  on conflict (id) do update
    set email     = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Quem cria a empresa vira owner automaticamente
create or replace function public.handle_new_business()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    insert into public.business_members (business_id, user_id, role)
    values (new.id, auth.uid(), 'owner')
    on conflict (business_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_business_created on public.businesses;
create trigger on_business_created
  after insert on public.businesses
  for each row execute function public.handle_new_business();

-- Uma empresa nunca pode ficar sem owner
create or replace function public.protect_last_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owners int;
begin
  -- Empresa sendo removida em cascata: nao ha o que proteger
  if not exists (select 1 from public.businesses b where b.id = old.business_id) then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if old.role <> 'owner' then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  -- Continua owner da mesma empresa: nada muda
  if tg_op = 'UPDATE' and new.role = 'owner' and new.business_id = old.business_id then
    return new;
  end if;

  select count(*) into v_owners
  from public.business_members bm
  where bm.business_id = old.business_id
    and bm.role = 'owner';

  if v_owners <= 1 then
    raise exception 'A empresa precisa ter pelo menos um owner.';
  end if;

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists business_members_protect_last_owner on public.business_members;
create trigger business_members_protect_last_owner
  before update or delete on public.business_members
  for each row execute function public.protect_last_owner();

-- -----------------------------------------------------------------------------
-- 5. Row Level Security
-- -----------------------------------------------------------------------------

alter table public.profiles         enable row level security;
alter table public.businesses       enable row level security;
alter table public.business_members enable row level security;

-- --------------------------- profiles ----------------------------------------
drop policy if exists "profiles_select_self_or_coworkers" on public.profiles;
create policy "profiles_select_self_or_coworkers"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.shares_business_with(id));

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- --------------------------- businesses --------------------------------------
-- Somente membros enxergam a empresa. Nenhum acesso anonimo por enquanto
-- (a leitura publica por slug entra quando o cardapio publico for criado).
drop policy if exists "businesses_select_members" on public.businesses;
create policy "businesses_select_members"
  on public.businesses for select
  to authenticated
  using (public.is_business_member(id));

drop policy if exists "businesses_insert_authenticated" on public.businesses;
create policy "businesses_insert_authenticated"
  on public.businesses for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "businesses_update_owner" on public.businesses;
create policy "businesses_update_owner"
  on public.businesses for update
  to authenticated
  using (public.has_business_role(id, array['owner']::public.member_role[]))
  with check (public.has_business_role(id, array['owner']::public.member_role[]));

drop policy if exists "businesses_delete_owner" on public.businesses;
create policy "businesses_delete_owner"
  on public.businesses for delete
  to authenticated
  using (public.has_business_role(id, array['owner']::public.member_role[]));

-- ------------------------ business_members -----------------------------------
drop policy if exists "business_members_select_same_business" on public.business_members;
create policy "business_members_select_same_business"
  on public.business_members for select
  to authenticated
  using (public.is_business_member(business_id));

drop policy if exists "business_members_insert_owner" on public.business_members;
create policy "business_members_insert_owner"
  on public.business_members for insert
  to authenticated
  with check (public.has_business_role(business_id, array['owner']::public.member_role[]));

drop policy if exists "business_members_update_owner" on public.business_members;
create policy "business_members_update_owner"
  on public.business_members for update
  to authenticated
  using (public.has_business_role(business_id, array['owner']::public.member_role[]))
  with check (public.has_business_role(business_id, array['owner']::public.member_role[]));

drop policy if exists "business_members_delete_owner" on public.business_members;
create policy "business_members_delete_owner"
  on public.business_members for delete
  to authenticated
  using (public.has_business_role(business_id, array['owner']::public.member_role[]));

-- -----------------------------------------------------------------------------
-- 6. Storage (logo e capa da empresa)
-- -----------------------------------------------------------------------------
-- Caminho dos arquivos: {business_id}/logo-<timestamp>.<ext>
insert into storage.buckets (id, name, public)
values ('business-assets', 'business-assets', true)
on conflict (id) do nothing;

drop policy if exists "business_assets_public_read" on storage.objects;
create policy "business_assets_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'business-assets');

drop policy if exists "business_assets_insert_members" on storage.objects;
create policy "business_assets_insert_members"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'business-assets'
    and public.can_manage_business_folder(name)
  );

drop policy if exists "business_assets_update_members" on storage.objects;
create policy "business_assets_update_members"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'business-assets'
    and public.can_manage_business_folder(name)
  )
  with check (
    bucket_id = 'business-assets'
    and public.can_manage_business_folder(name)
  );

drop policy if exists "business_assets_delete_members" on storage.objects;
create policy "business_assets_delete_members"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'business-assets'
    and public.can_manage_business_folder(name)
  );
