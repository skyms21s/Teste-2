import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/page-header';
import { EmptyState } from '@/components/dashboard/empty-state';

export const metadata: Metadata = { title: 'Pedidos' };

export default function PedidosPage() {
  return (
    <>
      <PageHeader title="Pedidos" description="Acompanhe e gerencie os pedidos do seu estabelecimento." />
      <EmptyState
        title="Nenhum pedido ainda"
        description="Os pedidos aparecerao aqui quando o modulo de pedidos for liberado."
      />
    </>
  );
}
