import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CreateBusinessForm } from '@/components/business/create-business-form';
import { SignOutButton } from '@/components/dashboard/sign-out-button';
import { requireUser } from '@/services/auth.service';
import { listUserBusinesses } from '@/services/business.service';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Criar empresa' };

export default async function OnboardingPage() {
  await requireUser(ROUTES.onboarding);

  const businesses = await listUserBusinesses();
  if (businesses.length > 0) {
    redirect(ROUTES.dashboard);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Cadastre seu estabelecimento</h1>
          <p className="mt-1 text-sm text-slate-500">
            Esses dados aparecerao no seu cardapio digital.
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <CreateBusinessForm />
      </div>
    </div>
  );
}
