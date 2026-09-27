-- =============================================================================
-- Etapa 3 - Loja publica (/loja/{slug})
-- =============================================================================
-- Depende de 20260101000000_init_multitenant.sql e 20260201000000_menu.sql.
--
-- 1. Protege plan e status: sao controlados pela plataforma, nunca pelo cliente.
-- 2. Expoe o cardapio publico por uma UNICA funcao, com campos escolhidos a dedo.
--    As tabelas continuam fechadas: ninguem le linhas de outra empresa direto.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. plan e status fora do alcance do cliente
-- -----------------------------------------------------------------------------
-- A policy businesses_update_owner autoriza a LINHA, mas nao restringe COLUNAS:
-- sem isto, um owner chamando a API direto conseguia se promover para
-- 'enterprise' ou reativar uma loja suspensa. Privilegios por coluna resolvem:
-- o cliente so escreve os campos que o painel de fato edita.
-- O slug fica de fora do UPDATE porque mudar o link quebra a URL publica.

revoke insert, update on public.businesses from anon, authenticated;

grant insert (id, name, slug, phone, address, description, logo_url, cover_url)
  on public.businesses to authenticated;

grant update (name, phone, address, description, logo_url, cover_url)
  on public.businesses to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Cardapio publico
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER: le as tabelas ignorando o RLS, mas devolve SOMENTE:
--   * dados de vitrine da empresa (sem id, plano, status ou datas);
--   * categorias ativas que tenham ao menos um produto ativo;
--   * produtos ativos.
-- Empresa inexistente ou com status diferente de 'active' devolve NULL.

create or replace function public.get_public_menu(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'business', jsonb_build_object(
      'name',        b.name,
      'slug',        b.slug,
      'logo_url',    b.logo_url,
      'cover_url',   b.cover_url,
      'phone',       b.phone,
      'address',     b.address,
      'description', b.description
    ),
    'categories', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'id',          c.id,
                 'name',        c.name,
                 'description', c.description,
                 'products',    (
                   select jsonb_agg(
                            jsonb_build_object(
                              'id',          p.id,
                              'name',        p.name,
                              'description', p.description,
                              'price',       p.price,
                              'image_url',   p.image_url
                            )
                            order by p.position, p.name
                          )
                   from public.products p
                   where p.category_id = c.id
                     and p.business_id = b.id
                     and p.is_active
                 )
               )
               order by c.position, c.name
             )
      from public.categories c
      where c.business_id = b.id
        and c.is_active
        and exists (
          select 1 from public.products p
          where p.category_id = c.id and p.business_id = b.id and p.is_active
        )
    ), '[]'::jsonb)
  )
  from public.businesses b
  where b.slug = lower(trim(p_slug))
    and b.status = 'active';
$$;

comment on function public.get_public_menu(text) is
  'Cardapio publico de uma loja ativa. Unica porta de leitura anonima do sistema.';

revoke execute on function public.get_public_menu(text) from public;
grant  execute on function public.get_public_menu(text) to anon, authenticated;
