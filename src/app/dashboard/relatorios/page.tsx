import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/page-header';
import { EmptyState } from '@/components/dashboard/empty-state';

export const metadata: Metadata = { title: 'Relatorios' };

export default function RelatoriosPage() {
  return (
    <>
      <PageHeader title="Relatorios" description="Vendas, produtos mais pedidos e desempenho." />
      <EmptyState
        title="Sem dados para exibir"
        description="Os relatorios serao gerados a partir dos pedidos recebidos."
      />
    </>
  );
}
