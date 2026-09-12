-- =============================================================================
-- ATENCAO: este script APAGA todos os dados de auth.users, profiles, businesses,
-- business_members e storage.objects antes de rodar os testes.
-- Use SOMENTE em um banco local/descartavel. NUNCA rode em producao.
-- =============================================================================
-- Suite de testes do isolamento multiempresa (RLS).
-- Uso:
--   psql "$DATABASE_URL" -f supabase/tests/00_supabase_stub.sql
--   psql "$DATABASE_URL" -f supabase/migrations/20260101000000_init_multitenant.sql
--   psql "$DATABASE_URL" -f supabase/tests/01_rls_test.sql
-- =============================================================================

\set ON_ERROR_STOP off
\set QUIET on
\pset pager off
\pset tuples_only on

-- ============ SETUP (como service role / superuser) ============
delete from storage.objects;
delete from public.business_members;
delete from public.businesses;
delete from public.profiles;
delete from auth.users;

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'ana@teste.com',   '{"full_name":"Ana Owner"}'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'bruno@teste.com', '{"full_name":"Bruno Rival"}'),
  ('cccccccc-0000-4000-8000-000000000003', 'carla@teste.com', '{"full_name":"Carla Func"}');

\echo '--- T01 trigger handle_new_user cria profiles (esperado: 3)'
select count(*) from public.profiles;

-- ============ ANA cria a empresa A ============
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}';
insert into public.businesses (id, name, slug, phone)
values ('11111111-0000-4000-8000-00000000000a', 'Ponto de Encontro', 'ponto-de-encontro', '11999990000');
\echo '--- T02 criador virou owner automaticamente (esperado: owner)'
select role from public.business_members where business_id = '11111111-0000-4000-8000-00000000000a';
commit;

-- ============ BRUNO cria a empresa B ============
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-4000-8000-000000000002"}';
insert into public.businesses (id, name, slug)
values ('22222222-0000-4000-8000-00000000000b', 'Acai do Bruno', 'acai-do-bruno');
commit;

-- ============ ISOLAMENTO ENTRE EMPRESAS ============
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}';
\echo '--- T03 Ana enxerga apenas a propria empresa (esperado: ponto-de-encontro)'
select slug from public.businesses;
commit;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-4000-8000-000000000002"}';
\echo '--- T04 Bruno nao enxerga a empresa da Ana (esperado: 0)'
select count(*) from public.businesses where id = '11111111-0000-4000-8000-00000000000a';
\echo '--- T05 Bruno nao enxerga os membros da empresa da Ana (esperado: 0)'
select count(*) from public.business_members where business_id = '11111111-0000-4000-8000-00000000000a';
\echo '--- T06 Bruno tentando editar a empresa da Ana (esperado: UPDATE 0)'
update public.businesses set name = 'Hackeado' where id = '11111111-0000-4000-8000-00000000000a';
\echo '--- T07 Bruno tentando apagar a empresa da Ana (esperado: DELETE 0)'
delete from public.businesses where id = '11111111-0000-4000-8000-00000000000a';
\echo '--- T08 Bruno tentando se auto-adicionar na empresa da Ana (esperado: ERRO 42501)'
insert into public.business_members (business_id, user_id, role)
values ('11111111-0000-4000-8000-00000000000a', 'bbbbbbbb-0000-4000-8000-000000000002', 'owner');
rollback;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-4000-8000-000000000002"}';
\echo '--- T09 slug duplicado (esperado: ERRO 23505)'
insert into public.businesses (name, slug) values ('Copia', 'ponto-de-encontro');
rollback;

-- ============ FUNCIONARIOS ============
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}';
\echo '--- T10 owner adiciona funcionario (esperado: INSERT 0 1)'
insert into public.business_members (business_id, user_id, role)
values ('11111111-0000-4000-8000-00000000000a', 'cccccccc-0000-4000-8000-000000000003', 'employee');
commit;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"cccccccc-0000-4000-8000-000000000003"}';
\echo '--- T11 funcionario enxerga a empresa (esperado: Ponto de Encontro)'
select name from public.businesses;
\echo '--- T12 funcionario tentando editar a empresa (esperado: UPDATE 0)'
update public.businesses set name = 'Mudei' where id = '11111111-0000-4000-8000-00000000000a';
\echo '--- T13 funcionario tentando adicionar membro (esperado: ERRO 42501)'
insert into public.business_members (business_id, user_id, role)
values ('11111111-0000-4000-8000-00000000000a', 'bbbbbbbb-0000-4000-8000-000000000002', 'employee');
rollback;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}';
update public.business_members set role = 'manager'
 where business_id = '11111111-0000-4000-8000-00000000000a'
   and user_id = 'cccccccc-0000-4000-8000-000000000003';
commit;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"cccccccc-0000-4000-8000-000000000003"}';
\echo '--- T14 manager tambem nao edita a empresa (esperado: UPDATE 0)'
update public.businesses set name = 'Mudei' where id = '11111111-0000-4000-8000-00000000000a';
rollback;

-- ============ PROFILES ============
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}';
\echo '--- T15 Ana enxerga o proprio perfil e o da equipe, nunca o do Bruno (esperado: ana + carla)'
select email from public.profiles order by email;
commit;

-- ============ ANONIMO ============
begin;
set local role anon;
\echo '--- T16 visitante anonimo nao enxerga empresas (esperado: 0)'
select count(*) from public.businesses;
\echo '--- T17 visitante anonimo nao cria empresa (esperado: ERRO 42501)'
insert into public.businesses (name, slug) values ('Anon', 'anon-loja');
rollback;

-- ============ STORAGE ============
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}';
\echo '--- T18 owner envia logo na pasta da propria empresa (esperado: INSERT 0 1)'
insert into storage.objects (bucket_id, name)
values ('business-assets', '11111111-0000-4000-8000-00000000000a/logo-1.png');
commit;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-4000-8000-000000000002"}';
\echo '--- T19 Bruno enviando arquivo na pasta da empresa da Ana (esperado: ERRO 42501)'
insert into storage.objects (bucket_id, name)
values ('business-assets', '11111111-0000-4000-8000-00000000000a/logo-hack.png');
rollback;

begin;
set local role anon;
\echo '--- T20 leitura publica do bucket funciona (esperado: 1)'
select count(*) from storage.objects where bucket_id = 'business-assets';
rollback;

-- ============ PROTECAO DO ULTIMO OWNER / CASCADE ============
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}';
\echo '--- T21 remover o ultimo owner (esperado: ERRO "pelo menos um owner")'
delete from public.business_members
 where business_id = '11111111-0000-4000-8000-00000000000a'
   and user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
rollback;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001"}';
\echo '--- T22 owner apaga a propria empresa, cascade nos membros (esperado: DELETE 1 e membros 0)'
delete from public.businesses where id = '11111111-0000-4000-8000-00000000000a';
select count(*) from public.business_members where business_id = '11111111-0000-4000-8000-00000000000a';
rollback;
