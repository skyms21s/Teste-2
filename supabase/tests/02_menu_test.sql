-- =============================================================================
-- ATENCAO: apaga os dados de teste das tabelas antes de rodar.
-- Use SOMENTE em um banco local/descartavel. NUNCA rode em producao.
-- =============================================================================
-- Suite do cardapio (categorias e produtos): papeis e isolamento entre empresas.
-- Uso:
--   psql "$DATABASE_URL" -f supabase/tests/00_supabase_stub.sql
--   psql "$DATABASE_URL" -f supabase/migrations/20260101000000_init_multitenant.sql
--   psql "$DATABASE_URL" -f supabase/migrations/20260201000000_menu.sql
--   psql "$DATABASE_URL" -f supabase/tests/02_menu_test.sql
-- =============================================================================

\set ON_ERROR_STOP off
\pset pager off
\pset tuples_only on

-- ============ SETUP ============
delete from storage.objects;
delete from public.businesses;   -- cascade limpa membros, categorias e produtos
delete from public.profiles;
delete from auth.users;

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'ana@teste.com',   '{"full_name":"Ana Owner"}'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'bruno@teste.com', '{"full_name":"Bruno Rival"}'),
  ('cccccccc-0000-4000-8000-000000000003', 'carla@teste.com', '{"full_name":"Carla Gerente"}'),
  ('dddddddd-0000-4000-8000-000000000004', 'diego@teste.com', '{"full_name":"Diego Funcionario"}');

-- Empresa A (Ana owner, Carla manager, Diego employee) e empresa B (Bruno owner)
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}';
insert into public.businesses (id, name, slug)
values ('11111111-0000-4000-8000-00000000000a', 'Ponto de Encontro', 'ponto-de-encontro');
insert into public.business_members (business_id, user_id, role) values
  ('11111111-0000-4000-8000-00000000000a', 'cccccccc-0000-4000-8000-000000000003', 'manager'),
  ('11111111-0000-4000-8000-00000000000a', 'dddddddd-0000-4000-8000-000000000004', 'employee');
commit;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-4000-8000-000000000002"}';
insert into public.businesses (id, name, slug)
values ('22222222-0000-4000-8000-00000000000b', 'Acai do Bruno', 'acai-do-bruno');
commit;

-- ============ CRIACAO PELO OWNER ============
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}';
\echo '--- M01 owner cria categoria com INSERT ... RETURNING (esperado: Lanches)'
insert into public.categories (id, business_id, name, position)
values ('c1111111-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-00000000000a', 'Lanches', 1)
returning name;
\echo '--- M02 owner cria produto com INSERT ... RETURNING (esperado: X-Salada | 24.90)'
insert into public.products (id, business_id, category_id, name, price)
values ('ef111111-0000-4000-8000-00000000000a', '11111111-0000-4000-8000-00000000000a',
        'c1111111-0000-4000-8000-00000000000a', 'X-Salada', 24.90)
returning name, price;
commit;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}';
\echo '--- M03 categoria duplicada na mesma empresa (esperado: ERRO 23505)'
insert into public.categories (business_id, name)
values ('11111111-0000-4000-8000-00000000000a', 'Lanches');
rollback;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}';
\echo '--- M04 preco negativo (esperado: ERRO 23514)'
insert into public.products (business_id, category_id, name, price)
values ('11111111-0000-4000-8000-00000000000a', 'c1111111-0000-4000-8000-00000000000a', 'Item Ruim', -1);
rollback;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}';
\echo '--- M05 excluir categoria com produtos (esperado: ERRO 23503 restrict)'
delete from public.categories where id = 'c1111111-0000-4000-8000-00000000000a';
rollback;

-- ============ PAPEIS DENTRO DA EMPRESA ============
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"cccccccc-0000-4000-8000-000000000003"}';
\echo '--- M06 manager cria categoria (esperado: Bebidas)'
insert into public.categories (business_id, name, position)
values ('11111111-0000-4000-8000-00000000000a', 'Bebidas', 2) returning name;
\echo '--- M07 manager edita produto (esperado: 1 linha)'
with u as (
  update public.products set price = 26.50
   where id = 'ef111111-0000-4000-8000-00000000000a' returning 1
) select count(*) from u;
rollback;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"dddddddd-0000-4000-8000-000000000004"}';
\echo '--- M08 funcionario LE o cardapio (esperado: X-Salada)'
select name from public.products;
\echo '--- M09 funcionario nao cria categoria (esperado: ERRO 42501)'
insert into public.categories (business_id, name) values ('11111111-0000-4000-8000-00000000000a', 'Proibida');
rollback;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"dddddddd-0000-4000-8000-000000000004"}';
\echo '--- M10 funcionario nao edita produto (esperado: 0 linhas)'
with u as (update public.products set price = 1 where id = 'ef111111-0000-4000-8000-00000000000a' returning 1)
select count(*) from u;
\echo '--- M11 funcionario nao exclui produto (esperado: 0 linhas)'
with d as (delete from public.products where id = 'ef111111-0000-4000-8000-00000000000a' returning 1)
select count(*) from d;
rollback;

-- ============ ISOLAMENTO ENTRE EMPRESAS ============
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-4000-8000-000000000002"}';
\echo '--- M12 B nao enxerga categorias de A (esperado: 0)'
select count(*) from public.categories;
\echo '--- M13 B nao enxerga produtos de A (esperado: 0)'
select count(*) from public.products;
\echo '--- M14 B nao edita produto de A (esperado: 0 linhas)'
with u as (update public.products set name = 'INVADIDO' where business_id = '11111111-0000-4000-8000-00000000000a' returning 1)
select count(*) from u;
\echo '--- M15 B nao exclui categoria de A (esperado: 0 linhas)'
with d as (delete from public.categories where business_id = '11111111-0000-4000-8000-00000000000a' returning 1)
select count(*) from d;
\echo '--- M16 B nao cria produto dentro da empresa de A (esperado: ERRO 42501)'
insert into public.products (business_id, category_id, name, price)
values ('11111111-0000-4000-8000-00000000000a', 'c1111111-0000-4000-8000-00000000000a', 'Invasao', 1);
rollback;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-4000-8000-000000000002"}';
insert into public.categories (id, business_id, name)
values ('c2222222-0000-4000-8000-00000000000b', '22222222-0000-4000-8000-00000000000b', 'Acais');
\echo '--- M17 produto de B apontando para categoria de A (esperado: ERRO 23503)'
insert into public.products (business_id, category_id, name, price)
values ('22222222-0000-4000-8000-00000000000b', 'c1111111-0000-4000-8000-00000000000a', 'Cruzado', 10);
rollback;

-- ============ ANONIMO ============
begin;
set local role anon;
\echo '--- M18 visitante anonimo nao enxerga o cardapio (esperado: 0 e 0)'
select count(*) from public.categories;
select count(*) from public.products;
rollback;

-- ============ CASCATA AO REMOVER A EMPRESA ============
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}';
\echo '--- M19 excluir a empresa leva o cardapio junto (esperado: 0 e 0)'
delete from public.businesses where id = '11111111-0000-4000-8000-00000000000a';
select count(*) from public.categories where business_id = '11111111-0000-4000-8000-00000000000a';
select count(*) from public.products   where business_id = '11111111-0000-4000-8000-00000000000a';
rollback;
