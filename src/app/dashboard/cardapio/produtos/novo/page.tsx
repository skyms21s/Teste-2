import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/dashboard/page-header';
import { ProductForm } from '@/components/menu/product-form';
import { EmptyState } from '@/components/dashboard/empty-state';
import { ROUTES } from '@/lib/constants/routes';
import { requireActiveBusiness } from '@/services/business.service';
import { canManageMenu, listCategories } from '@/services/menu.service';

export const metadata: Metadata = { title: 'Novo produto' };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const business = await requireActiveBusiness();
  if (!canManageMenu(business.role)) redirect(ROUTES.menu);

  const { categoria } = await searchParams;
  const categories = await listCategories(business.id);

  if (categories.length === 0) {
    return (
      <>
        <PageHeader title="Novo produto" />
        <EmptyState
          title="Crie uma categoria primeiro"
          description="Todo produto precisa pertencer a uma categoria. Volte ao cardapio e crie uma."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Novo produto" description="Adicione um item ao cardapio." />
      <ProductForm categories={categories} defaultCategoryId={categoria} />
    </>
  );
}
