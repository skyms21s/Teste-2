import 'server-only';

import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import { SLUG_PATTERN } from '@/lib/utils/slug';
import type { PublicMenu } from '@/types';

/**
 * Cardapio publico de uma loja ativa, ou null (slug invalido, inexistente ou
 * loja nao ativa). Passa pela funcao get_public_menu, que e a unica leitura
 * anonima permitida pelo banco.
 *
 * `cache` evita chamar o banco duas vezes na mesma requisicao
 * (generateMetadata + a pagina).
 */
export const getPublicMenu = cache(async (rawSlug: string): Promise<PublicMenu | null> => {
  const slug = decodeURIComponent(rawSlug).trim().toLowerCase();
  if (!SLUG_PATTERN.test(slug)) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('get_public_menu', { p_slug: slug });

  if (error || !data || typeof data !== 'object' || Array.isArray(data)) return null;

  const menu = data as unknown as PublicMenu;
  return {
    business: menu.business,
    categories: (menu.categories ?? []).map((category) => ({
      ...category,
      products: (category.products ?? []).map((product) => ({
        ...product,
        price: Number(product.price),
      })),
    })),
  };
});
