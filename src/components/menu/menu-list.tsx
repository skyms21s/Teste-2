import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ROUTES } from '@/lib/constants/routes';
import { formatPrice } from '@/lib/utils/currency';
import type { CategoryWithProducts } from '@/types';
import { DeleteCategoryButton, DeleteProductButton, ToggleProductButton } from './menu-actions';

export function MenuList({
  menu,
  canManage,
}: {
  menu: CategoryWithProducts[];
  canManage: boolean;
}) {
  return (
    <div className="space-y-6">
      {menu.map((category) => (
        <Card key={category.id}>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">{category.name}</h2>
                {!category.is_active ? <Badge tone="warning">Oculta</Badge> : null}
                <Badge tone="neutral">
                  {category.products.length}{' '}
                  {category.products.length === 1 ? 'produto' : 'produtos'}
                </Badge>
              </div>
              {category.description ? (
                <p className="mt-1 text-sm text-slate-500">{category.description}</p>
              ) : null}
            </div>

            {canManage ? (
              <div className="flex items-center gap-2">
                <ButtonLink
                  href={`${ROUTES.menu}/produtos/novo?categoria=${category.id}`}
                  size="sm"
                  variant="secondary"
                >
                  Novo produto
                </ButtonLink>
                <ButtonLink
                  href={`${ROUTES.menu}/categorias/${category.id}`}
                  size="sm"
                  variant="ghost"
                >
                  Editar
                </ButtonLink>
                <DeleteCategoryButton categoryId={category.id} name={category.name} />
              </div>
            ) : null}
          </CardHeader>

          <CardContent className="p-0">
            {category.products.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">
                Nenhum produto nesta categoria ainda.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {category.products.map((product) => (
                  <li
                    key={product.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-[10px] text-slate-400">
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          'sem foto'
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {product.name}
                          </p>
                          {!product.is_active ? <Badge tone="warning">Indisponivel</Badge> : null}
                        </div>
                        {product.description ? (
                          <p className="line-clamp-2 text-xs text-slate-500">
                            {product.description}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:justify-end">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatPrice(product.price)}
                      </span>

                      {canManage ? (
                        <div className="flex items-center gap-1">
                          <ToggleProductButton
                            productId={product.id}
                            isActive={product.is_active}
                          />
                          <Link
                            href={`${ROUTES.menu}/produtos/${product.id}`}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          >
                            Editar
                          </Link>
                          <DeleteProductButton productId={product.id} name={product.name} />
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
