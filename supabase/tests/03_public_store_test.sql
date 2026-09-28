-- =============================================================================
-- ATENCAO: apaga os dados de teste das tabelas antes de rodar.
-- Use SOMENTE em um banco local/descartavel. NUNCA rode em producao.
-- =============================================================================
-- Suite da loja publica: o que get_public_menu expoe e o que continua fechado.
-- Uso (depois do stub e das tres migrations):
--   psql "$DATABASE_URL" -f supabase/tests/03_public_store_test.sql
-- =============================================================================

\set ON_ERROR_STOP off
\pset pager off
\pset tuples_only on

-- ============ SETUP ============
delete from storage.objects;
delete from public.businesses;
delete from public.profiles;
delete from auth.users;

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'ana@teste.com'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'bruno@teste.com');

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}';
insert into public.businesses (id, name, slug, phone, description)
values ('11111111-0000-4000-8000-00000000000a', 'Ponto de Encontro', 'ponto-de-encontro',
        '11999990000', 'Hamburgueria artesanal');

insert into public.categories (id, business_id, name, position, is_active) values
  ('c1111111-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-00000000000a', 'Lanches',    1, true),
  ('c2222222-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-00000000000a', 'Bebidas',    2, true),
  ('c3333333-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-00000000000a', 'Secreta',    3, false),
  ('c4444444-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-00000000000a', 'Sem Itens',  4, true);

insert into public.products (business_id, category_id, name, price, position, is_active) values
  ('11111111-0000-4000-8000-00000000000a', 'c1111111-0000-4000-8000-00000000000a', 'X-Bacon',       29.50, 2, true),
  ('11111111-0000-4000-8000-00000000000a', 'c1111111-0000-4000-8000-00000000000a', 'X-Salada',      24.90, 1, true),
  ('11111111-0000-4000-8000-00000000000a', 'c1111111-0000-4000-8000-00000000000a', 'X-Esgotado',    19.00, 3, false),
  ('11111111-0000-4000-8000-00000000000a', 'c2222222-0000-4000-8000-00000000000a', 'Suco de Laranja', 9.00, 1, true),
  ('11111111-0000-4000-8000-00000000000a', 'c3333333-0000-4000-8000-00000000000a', 'Item Escondido', 5.00, 1, true);
commit;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-4000-8000-000000000002"}';
insert into public.businesses (id, name, slug)
values ('22222222-0000-4000-8000-00000000000b', 'Loja Suspensa', 'loja-suspensa');
commit;

-- A plataforma (service_role / admin) suspende a loja B. O cliente nao consegue.
update public.businesses set status = 'suspended' where id = '22222222-0000-4000-8000-00000000000b';

-- ============ O QUE A LOJA PUBLICA MOSTRA ============
begin;
set local role anon;
\echo '--- P01 visitante anonimo abre a loja pelo slug (esperado: Ponto de Encontro)'
select public.get_public_menu('ponto-de-encontro') -> 'business' ->> 'name';

\echo '--- P02 slug e aceito em maiusculas e com espacos (esperado: Ponto de Encontro)'
select public.get_public_menu('  Ponto-De-Encontro ') -> 'business' ->> 'name';

\echo '--- P03 so categorias ativas e com produto ativo, na ordem (esperado: Lanches, Bebidas)'
select string_agg(c ->> 'name', ', ')
from jsonb_array_elements(public.get_public_menu('ponto-de-encontro') -> 'categories') c;

\echo '--- P04 so produtos ativos, na ordem (esperado: X-Salada, X-Bacon)'
select string_agg(p ->> 'name', ', ')
from jsonb_array_elements(public.get_public_menu('ponto-de-encontro') -> 'categories' -> 0 -> 'products') p;

\echo '--- P05 preco sai como numero (esperado: 24.90)'
select public.get_public_menu('ponto-de-encontro') -> 'categories' -> 0 -> 'products' -> 0 ->> 'price';

\echo '--- P06 payload nao vaza campos internos (esperado: f f f f)'
select (m -> 'business') ? 'id',
       (m -> 'business') ? 'plan',
       (m -> 'business') ? 'status',
       (m -> 'business') ? 'created_at'
from (select public.get_public_menu('ponto-de-encontro') m) x;

\echo '--- P07 produto inativo e categoria oculta nao aparecem em lugar nenhum (esperado: f f)'
select public.get_public_menu('ponto-de-encontro')::text like '%X-Esgotado%',
       public.get_public_menu('ponto-de-encontro')::text like '%Item Escondido%';

\echo '--- P08 loja suspensa nao abre (esperado: t)'
select public.get_public_menu('loja-suspensa') is null;

\echo '--- P09 slug inexistente (esperado: t)'
select public.get_public_menu('nao-existe') is null;
rollback;

-- ============ O QUE CONTINUA FECHADO ============
begin;
set local role anon;
\echo '--- P10 anonimo continua sem ler as tabelas direto (esperado: 0 0 0)'
select count(*) from public.businesses;
select count(*) from public.categories;
select count(*) from public.products;
rollback;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-4000-8000-000000000002"}';
\echo '--- P11 lojista de outra empresa ve a vitrine publica (esperado: Ponto de Encontro)'
select public.get_public_menu('ponto-de-encontro') -> 'business' ->> 'name';
\echo '--- P12 mas continua sem ler as linhas da empresa A (esperado: 0 0)'
select count(*) from public.categories where business_id = '11111111-0000-4000-8000-00000000000a';
select count(*) from public.products   where business_id = '11111111-0000-4000-8000-00000000000a';
\echo '--- P13 e nao consegue reativar a propria loja suspensa (esperado: ERRO 42501)'
update public.businesses set status = 'active' where id = '22222222-0000-4000-8000-00000000000b';
rollback;

-- ============ LIMITES DO BUCKET ============
-- A aplicacao dos limites e feita pela API do Storage; aqui conferimos a configuracao.
\echo '--- P14 bucket de imagens limita tamanho e tipo (esperado: 2097152 | {image/png,image/jpeg,image/webp})'
select file_size_limit, allowed_mime_types from storage.buckets where id = 'business-assets';
