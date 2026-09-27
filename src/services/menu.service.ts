import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Category, CategoryWithProducts, MemberRole, Product } from '@/types';

/** Quem pode criar, editar e excluir itens do cardapio. */
export function canManageMenu(role: MemberRole): boolean {
  return role === 'owner' || role === 'manager';
}

/** Categorias da empresa, na ordem em que aparecem no cardapio. */
export async function listCategories(businessId: string): Promise<Category[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('business_id', businessId)
    .order('position', { ascending: true })
    .order('name', { ascending: true });

  return data ?? [];
}

/** Produtos da empresa, na ordem em que aparecem dentro de cada categoria. */
export async function listProducts(businessId: string): Promise<Product[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', businessId)
    .order('position', { ascending: true })
    .order('name', { ascending: true });

  return data ?? [];
}

/** Cardapio completo: categorias com seus produtos. */
export async function getMenu(businessId: string): Promise<CategoryWithProducts[]> {
  const [categories, products] = await Promise.all([
    listCategories(businessId),
    listProducts(businessId),
  ]);

  return categories.map((category) => ({
    ...category,
    products: products.filter((product) => product.category_id === category.id),
  }));
}

export async function getCategory(businessId: string, categoryId: string): Promise<Category | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('business_id', businessId)
    .eq('id', categoryId)
    .maybeSingle();

  return data ?? null;
}

export async function getProduct(businessId: string, productId: string): Promise<Product | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', businessId)
    .eq('id', productId)
    .maybeSingle();

  return data ?? null;
}
