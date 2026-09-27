import type { PublicBusiness } from '@/types';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

export function StoreHeader({ business }: { business: PublicBusiness }) {
  const phoneDigits = business.phone?.replace(/\D/g, '') ?? '';

  return (
    <header>
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 sm:h-56">
        {business.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.cover_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      <div className="mx-auto max-w-3xl px-4">
        <div className="-mt-10 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:-mt-12 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-brand-600 text-xl font-bold text-white shadow-md sm:h-24 sm:w-24">
            {business.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logo_url}
                alt={`Logo de ${business.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              initials(business.name)
            )}
          </div>

          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{business.name}</h1>
            {business.description ? (
              <p className="text-sm text-slate-600">{business.description}</p>
            ) : null}
            <div className="flex flex-col gap-1 pt-1 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-4">
              {business.address ? <span>{business.address}</span> : null}
              {phoneDigits ? (
                <a href={`tel:${phoneDigits}`} className="font-medium text-brand-700 hover:underline">
                  {business.phone}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
