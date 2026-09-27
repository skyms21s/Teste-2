'use client';

import { useActionState } from 'react';
import {
  deleteCategoryAction,
  deleteProductAction,
  toggleProductActiveAction,
} from '@/app/dashboard/cardapio/actions';
import { Button } from '@/components/ui/button';
import { useFormStatus } from 'react-dom';
import { IDLE_ACTION_STATE } from '@/types';

function PendingButton({
  children,
  variant = 'ghost',
  title,
}: {
  children: React.ReactNode;
  variant?: 'ghost' | 'danger' | 'secondary';
  title?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending} title={title}>
      {pending ? '...' : children}
    </Button>
  );
}

/** Exclui uma categoria (bloqueado pelo banco se ainda houver produtos). */
export function DeleteCategoryButton({ categoryId, name }: { categoryId: string; name: string }) {
  const [state, formAction] = useActionState(deleteCategoryAction, IDLE_ACTION_STATE);

  return (
    <div className="flex flex-col items-end gap-1">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(`Excluir a categoria "${name}"?`)) event.preventDefault();
        }}
      >
        <input type="hidden" name="categoryId" value={categoryId} />
        <PendingButton variant="ghost">Excluir</PendingButton>
      </form>
      {state.status === 'error' && state.message ? (
        <p className="max-w-xs text-right text-xs text-red-600">{state.message}</p>
      ) : null}
    </div>
  );
}

export function DeleteProductButton({ productId, name }: { productId: string; name: string }) {
  const [state, formAction] = useActionState(deleteProductAction, IDLE_ACTION_STATE);

  return (
    <div className="flex flex-col items-end gap-1">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(`Excluir o produto "${name}"?`)) event.preventDefault();
        }}
      >
        <input type="hidden" name="productId" value={productId} />
        <PendingButton variant="ghost">Excluir</PendingButton>
      </form>
      {state.status === 'error' && state.message ? (
        <p className="max-w-xs text-right text-xs text-red-600">{state.message}</p>
      ) : null}
    </div>
  );
}

/** Liga/desliga a disponibilidade do produto direto na lista. */
export function ToggleProductButton({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  const [, formAction] = useActionState(toggleProductActiveAction, IDLE_ACTION_STATE);

  return (
    <form action={formAction}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="nextActive" value={String(!isActive)} />
      <PendingButton variant="ghost" title={isActive ? 'Ocultar do cardapio' : 'Mostrar no cardapio'}>
        {isActive ? 'Ocultar' : 'Ativar'}
      </PendingButton>
    </form>
  );
}
