-- =============================================================================
-- Etapa 2 - Cardapio: categorias e produtos
-- =============================================================================
-- Depende de 20260101000000_init_multitenant.sql (businesses, business_members
-- e as funcoes is_business_member / has_business_role).
--
-- Regras de acesso:
--   * qualquer membro da empresa LE o cardapio;
--   * apenas owner e manager criam, editam e excluem;
--   * nenhuma empresa enxerga o cardapio de outra.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tabelas
-- -----------------------------------------------------------------------------

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name        text not null check (char_length(trim(name)) between 2 and 60),
  description text check (char_length(description) <= 300),
  position    int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (business_id, name)
);

comment on table public.categories is 'Secoes do cardapio (Lanches, Bebidas, Sobremesas...).';

-- Permite que products referencie (category_id, business_id) e garanta, no proprio
-- banco, que um produto nunca aponte para a categoria de outra empresa.
-- Criada so quando ainda nao existe: um "drop constraint" aqui quebraria a
-- reexecucao do script, porque a FK composta de products depende dela.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'categories_id_business_id_key'
      and conrelid = 'public.categories'::regclass
  ) then
    alter table public.categories
      add constraint categories_id_business_id_key unique (id, business_id);
  end if;
end
$$;

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  category_id uuid not null,
  name        text not null check (char_length(trim(name)) between 2 and 120),
  description text check (char_length(description) <= 500),
  price       numeric(10, 2) not null check (price >= 0),
  image_url   text,
  is_active   boolean not null default true,
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint products_category_same_business_fkey
    foreign key (category_id, business_id)
    references public.categories (id, business_id)
    on delete restrict
);

comment on table public.products is 'Itens do cardapio. A FK composta garante que a categoria e da mesma empresa.';
comment on column public.products.price is 'Preco em reais, com 2 casas decimais.';

create index if not exists categories_business_id_idx on public.categories (business_id, position, name);
create index if not exists products_business_id_idx   on public.products (business_id, position, name);
create index if not exists products_category_id_idx   on public.products (category_id);

-- -----------------------------------------------------------------------------
-- 2. updated_at
-- -----------------------------------------------------------------------------

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Row Level Security
-- -----------------------------------------------------------------------------
-- Diferente de businesses, aqui o INSERT ... RETURNING funciona: quem insere ja
-- e membro da empresa, entao a policy de leitura aprova a linha devolvida.

alter table public.categories enable row level security;
alter table public.products   enable row level security;

-- --------------------------- categories --------------------------------------
drop policy if exists "categories_select_members" on public.categories;
create policy "categories_select_members"
  on public.categories for select
  to authenticated
  using (public.is_business_member(business_id));

drop policy if exists "categories_insert_managers" on public.categories;
create policy "categories_insert_managers"
  on public.categories for insert
  to authenticated
  with check (public.has_business_role(business_id, array['owner', 'manager']::public.member_role[]));

drop policy if exists "categories_update_managers" on public.categories;
create policy "categories_update_managers"
  on public.categories for update
  to authenticated
  using (public.has_business_role(business_id, array['owner', 'manager']::public.member_role[]))
  with check (public.has_business_role(business_id, array['owner', 'manager']::public.member_role[]));

drop policy if exists "categories_delete_managers" on public.categories;
create policy "categories_delete_managers"
  on public.categories for delete
  to authenticated
  using (public.has_business_role(business_id, array['owner', 'manager']::public.member_role[]));

-- ---------------------------- products ---------------------------------------
drop policy if exists "products_select_members" on public.products;
create policy "products_select_members"
  on public.products for select
  to authenticated
  using (public.is_business_member(business_id));

drop policy if exists "products_insert_managers" on public.products;
create policy "products_insert_managers"
  on public.products for insert
  to authenticated
  with check (public.has_business_role(business_id, array['owner', 'manager']::public.member_role[]));

drop policy if exists "products_update_managers" on public.products;
create policy "products_update_managers"
  on public.products for update
  to authenticated
  using (public.has_business_role(business_id, array['owner', 'manager']::public.member_role[]))
  with check (public.has_business_role(business_id, array['owner', 'manager']::public.member_role[]));

drop policy if exists "products_delete_managers" on public.products;
create policy "products_delete_managers"
  on public.products for delete
  to authenticated
  using (public.has_business_role(business_id, array['owner', 'manager']::public.member_role[]));
