import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireUser, getDisplayName } from '@/services/auth.service';
import { requireActiveBusiness } from '@/services/business.service';
import { PLAN_LABELS, ROLE_LABELS, STATUS_LABELS } from '@/lib/utils/labels';
import type { BusinessStatus } from '@/types';

export const metadata: Metadata = { title: 'Visao geral' };

const STATUS_TONE: Record<BusinessStatus, 'success' | 'neutral' | 'danger'> = {
  active: 'success',
  inactive: 'neutral',
  suspended: 'danger',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export default async function DashboardOverviewPage() {
  const user = await requireUser();
  const business = await requireActiveBusiness();

  return (
    <>
      <PageHeader
        title="Visao geral"
        description="Resumo da sua conta e do estabelecimento."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <InfoRow label="Nome" value={business.name} />
              <InfoRow label="Link publico" value={`/loja/${business.slug}`} />
              <InfoRow label="Plano atual" value={<Badge tone="brand">{PLAN_LABELS[business.plan]}</Badge>} />
              <InfoRow
                label="Status"
                value={<Badge tone={STATUS_TONE[business.status]}>{STATUS_LABELS[business.status]}</Badge>}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuario logado</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <InfoRow label="Nome" value={getDisplayName(user)} />
              <InfoRow label="E-mail" value={user.email ?? '-'} />
              <InfoRow label="Papel na empresa" value={ROLE_LABELS[business.role]} />
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
