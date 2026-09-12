'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setActiveBusinessAction } from '@/app/dashboard/actions';
import type { BusinessWithRole } from '@/types';

export function BusinessSwitcher({
  businesses,
  activeId,
}: {
  businesses: BusinessWithRole[];
  activeId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (businesses.length < 2) return null;

  return (
    <label className="block">
      <span className="sr-only">Empresa ativa</span>
      <select
        value={activeId}
        disabled={isPending}
        onChange={(event) => {
          const businessId = event.target.value;
          startTransition(async () => {
            await setActiveBusinessAction(businessId);
            router.refresh();
          });
        }}
        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none"
      >
        {businesses.map((business) => (
          <option key={business.id} value={business.id}>
            {business.name}
          </option>
        ))}
      </select>
    </label>
  );
}
