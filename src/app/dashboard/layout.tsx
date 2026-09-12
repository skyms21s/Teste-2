import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getCurrentUser, getDisplayName } from '@/services/auth.service';
import { getActiveBusiness, listUserBusinesses } from '@/services/business.service';
import { ROUTES } from '@/lib/constants/routes';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Camada 2 de protecao (a camada 1 e o proxy em src/proxy.ts).
  const user = await getCurrentUser();
  if (!user) {
    redirect(`${ROUTES.signIn}?next=${encodeURIComponent(ROUTES.dashboard)}`);
  }

  const businesses = await listUserBusinesses();
  const business = await getActiveBusiness();

  // Usuario autenticado sem empresa: precisa concluir o onboarding.
  if (!business) {
    redirect(ROUTES.onboarding);
  }

  return (
    <DashboardShell
      business={business}
      businesses={businesses}
      userName={getDisplayName(user)}
      userEmail={user.email}
    >
      {children}
    </DashboardShell>
  );
}
