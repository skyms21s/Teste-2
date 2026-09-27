import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/dashboard/page-header';
import { CategoryForm } from '@/components/menu/category-form';
import { ROUTES } from '@/lib/constants/routes';
import { requireActiveBusiness } from '@/services/business.service';
import { canManageMenu } from '@/services/menu.service';

export const metadata: Metadata = { title: 'Nova categoria' };

export default async function NewCategoryPage() {
  const business = await requireActiveBusiness();
  if (!canManageMenu(business.role)) redirect(ROUTES.menu);

  return (
    <>
      <PageHeader
        title="Nova categoria"
        description="Categorias agrupam os produtos do cardapio."
      />
      <CategoryForm />
    </>
  );
}
