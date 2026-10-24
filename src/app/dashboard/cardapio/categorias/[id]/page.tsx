import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/dashboard/page-header';
import { CategoryForm } from '@/components/menu/category-form';
import { ROUTES } from '@/lib/constants/routes';
import { requireActiveBusiness } from '@/services/business.service';
import { canManageMenu, getCategory } from '@/services/menu.service';

export const metadata: Metadata = { title: 'Editar categoria' };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const business = await requireActiveBusiness();
  if (!canManageMenu(business.role)) redirect(ROUTES.menu);

  const category = await getCategory(business.id, id);
  if (!category) notFound();

  return (
    <>
      <PageHeader title="Editar categoria" description={category.name} />
      <CategoryForm category={category} />
    </>
  );
}
