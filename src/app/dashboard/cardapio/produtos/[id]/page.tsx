import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/dashboard/page-header';
import { ProductForm } from '@/components/menu/product-form';
import { ROUTES } from '@/lib/constants/routes';
import { requireActiveBusiness } from '@/services/business.service';
import { canManageMenu, getProduct, listCategories } from '@/services/menu.service';

export const metadata: Metadata = { title: 'Editar produto' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await requireActiveBusiness();
  if (!canManageMenu(business.role)) redirect(ROUTES.menu);

  const [product, categories] = await Promise.all([
    getProduct(business.id, id),
    listCategories(business.id),
  ]);

  if (!product) notFound();

  return (
    <>
      <PageHeader title="Editar produto" description={product.name} />
      <ProductForm categories={categories} product={product} />
    </>
  );
}
