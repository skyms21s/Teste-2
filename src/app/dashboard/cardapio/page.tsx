import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/page-header';
import { EmptyState } from '@/components/dashboard/empty-state';

export const metadata: Metadata = { title: 'Cardapio' };

export default function CardapioPage() {
  return (
    <>
      <PageHeader title="Cardapio" description="Organize categorias, produtos e adicionais." />
      <EmptyState
        title="Cardapio em construcao"
        description="Em breve voce podera cadastrar categorias e produtos."
      />
    </>
  );
}
