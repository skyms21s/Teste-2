import type { PublicCategory } from '@/types';

/** Atalhos para as secoes do cardapio; fica preso no topo ao rolar. */
export function CategoryNav({ categories }: { categories: PublicCategory[] }) {
  if (categories.length < 2) return null;

  return (
    <nav
      aria-label="Categorias do cardapio"
      className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-3">
        {categories.map((category) => (
          <li key={category.id} className="shrink-0">
            <a
              href={`#categoria-${category.id}`}
              className="inline-block rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-brand-500 hover:text-brand-700"
            >
              {category.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
