import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryNav } from '@/components/store/category-nav';
import { ProductCard } from '@/components/store/product-card';
import { StoreHeader } from '@/components/store/store-header';
import { getPublicMenu } from '@/services/public-store.service';

// Sempre renderiza na hora: uma alteracao feita no painel aparece no proximo
// acesso, sem cache antigo. (Modelo de cache sem Cache Components.)
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getPublicMenu(slug);

  if (!menu) return { title: 'Loja nao encontrada' };

  const { business } = menu;
  const image = business.cover_url ?? business.logo_url;

  return {
    // absolute: na vitrine a marca e o restaurante, sem o sufixo do painel.
    title: { absolute: `${business.name} | Cardapio` },
    description: business.description ?? `Confira o cardapio de ${business.name}.`,
    openGraph: {
      title: business.name,
      description: business.description ?? undefined,
      images: image ? [image] : undefined,
    },
  };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const menu = await getPublicMenu(slug);

  if (!menu) notFound();

  const { business, categories } = menu;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <StoreHeader business={business} />
      <div className="h-6" />
      <CategoryNav categories={categories} />

      <main className="mx-auto max-w-3xl space-y-10 px-4 pt-6">
        {categories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="font-semibold text-slate-900">Cardapio em preparacao</p>
            <p className="mt-1 text-sm text-slate-500">Volte em breve para conferir os produtos.</p>
          </div>
        ) : (
          categories.map((category) => (
            <section
              key={category.id}
              id={`categoria-${category.id}`}
              aria-labelledby={`titulo-${category.id}`}
              className="scroll-mt-20 space-y-3"
            >
              <div>
                <h2 id={`titulo-${category.id}`} className="text-lg font-bold text-slate-900">
                  {category.name}
                </h2>
                {category.description ? (
                  <p className="text-sm text-slate-500">{category.description}</p>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {category.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <footer className="mx-auto mt-16 max-w-3xl px-4 text-center text-xs text-slate-400">
        Cardapio digital de {business.name}
      </footer>
    </div>
  );
}
