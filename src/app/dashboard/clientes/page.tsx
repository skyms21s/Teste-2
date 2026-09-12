import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/page-header';
import { EmptyState } from '@/components/dashboard/empty-state';

export const metadata: Metadata = { title: 'Clientes' };

export default function ClientesPage() {
  return (
    <>
      <PageHeader title="Clientes" description="Historico e contatos de quem compra com voce." />
      <EmptyState
        title="Nenhum cliente cadastrado"
        description="A base de clientes sera preenchida a partir dos pedidos."
      />
    </>
  );
}
