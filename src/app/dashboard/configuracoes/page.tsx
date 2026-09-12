import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/page-header';
import { BusinessSettingsForm } from '@/components/business/business-settings-form';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { canManageBusiness, requireActiveBusiness } from '@/services/business.service';
import { listBusinessMembers } from '@/services/members.service';
import { ROLE_LABELS } from '@/lib/utils/labels';

export const metadata: Metadata = { title: 'Configuracoes' };

export default async function SettingsPage() {
  const business = await requireActiveBusiness();
  const members = await listBusinessMembers(business.id);
  const isOwner = canManageBusiness(business.role);

  return (
    <>
      <PageHeader
        title="Configuracoes"
        description="Dados basicos do estabelecimento."
      />

      <div className="max-w-3xl space-y-6">
        {isOwner ? (
          <BusinessSettingsForm business={business} />
        ) : (
          <Alert tone="info">
            Somente o proprietario da empresa pode editar estas informacoes. Seu papel atual:{' '}
            {ROLE_LABELS[business.role]}.
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Equipe</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {member.profile?.full_name ?? member.profile?.email ?? 'Usuario'}
                  </p>
                  <p className="truncate text-xs text-slate-500">{member.profile?.email ?? '-'}</p>
                </div>
                <Badge tone={member.role === 'owner' ? 'brand' : 'neutral'}>
                  {ROLE_LABELS[member.role]}
                </Badge>
              </div>
            ))}
            <p className="pt-3 text-xs text-slate-500">
              O convite de funcionarios sera liberado em uma proxima etapa. A estrutura de papeis
              (owner, manager, employee) ja esta pronta no banco.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
