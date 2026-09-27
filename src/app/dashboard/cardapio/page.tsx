import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/page-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { MenuList } from '@/components/menu/menu-list';
import { Alert } from '@/components/ui/alert';
import { ButtonLink } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';
import { ROLE_LABELS } from '@/lib/utils/labels';
import { requireActiveBusiness } from '@/services/business.service';
import { canManageMenu, getMenu } from '@/services/menu.service';

export const metadata: Metadata = { title: 'Cardapio' };

export default async function MenuPage() {
  const business = await requireActiveBusiness();
  const menu = await getMenu(business.id);
  const canManage = canManageMenu(business.role);

  return (
    <>
      <PageHeader
        title="Cardapio"
        description="Organize as categorias e os produtos do seu estabelecimento."
        action={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <ButtonLink href={`${ROUTES.menu}/categorias/nova`} variant="secondary">
                Nova categoria
              </ButtonLink>
              {menu.length > 0 ? (
                <ButtonLink href={`${ROUTES.menu}/produtos/novo`}>Novo produto</ButtonLink>
              ) : null}
            </div>
          ) : null
        }
      />

      {!canManage ? (
        <Alert tone="info" className="mb-6">
          Seu papel na empresa ({ROLE_LABELS[business.role]}) permite visualizar o cardapio, mas nao
          editar. Proprietario e gerente podem fazer alteracoes.
        </Alert>
      ) : null}

      {menu.length === 0 ? (
        <EmptyState
          title="Cardapio vazio"
          description={
            canManage
              ? 'Comece criando uma categoria (por exemplo: Lanches, Bebidas, Sobremesas). Depois adicione os produtos dentro dela.'
              : 'Nenhuma categoria foi cadastrada ainda.'
          }
        />
      ) : (
        <MenuList menu={menu} canManage={canManage} />
      )}
    </>
  );
}
