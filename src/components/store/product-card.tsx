import { formatPrice } from '@/lib/utils/currency';
import type { PublicProduct } from '@/types';

export function ProductCard({ product }: { product: PublicProduct }) {
  return (
    <article className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="font-semibold text-slate-900">{product.name}</h3>
        {product.description ? (
          <p className="line-clamp-3 text-sm text-slate-500">{product.description}</p>
        ) : null}
        <p className="pt-1 text-base font-bold text-brand-700">{formatPrice(product.price)}</p>
      </div>

      {product.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="h-24 w-24 shrink-0 rounded-lg object-cover"
        />
      ) : null}
    </article>
  );
}
