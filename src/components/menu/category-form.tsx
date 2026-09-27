'use client';

import { useActionState } from 'react';
import { createCategoryAction, updateCategoryAction } from '@/app/dashboard/cardapio/actions';
import { Alert } from '@/components/ui/alert';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { FormField } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { ROUTES } from '@/lib/constants/routes';
import { IDLE_ACTION_STATE, type Category } from '@/types';

export function CategoryForm({ category }: { category?: Category }) {
  const isEditing = Boolean(category);
  const [state, formAction] = useActionState(
    isEditing ? updateCategoryAction : createCategoryAction,
    IDLE_ACTION_STATE,
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {category ? <input type="hidden" name="categoryId" value={category.id} /> : null}

      {state.status === 'error' && state.message ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}

      <Card>
        <CardContent className="space-y-4">
          <FormField label="Nome da categoria" htmlFor="name" errors={state.fieldErrors?.name}>
            <Input
              id="name"
              name="name"
              defaultValue={category?.name ?? ''}
              placeholder="Lanches"
              required
              autoFocus
            />
          </FormField>

          <FormField
            label="Descricao"
            htmlFor="description"
            hint="Opcional. Aparece abaixo do nome da secao."
            errors={state.fieldErrors?.description}
          >
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={category?.description ?? ''}
              placeholder="Hamburgueres artesanais feitos na hora."
            />
          </FormField>

          <FormField
            label="Ordem"
            htmlFor="position"
            hint="Menor numero aparece primeiro no cardapio."
            errors={state.fieldErrors?.position}
          >
            <Input
              id="position"
              name="position"
              type="number"
              min={0}
              max={999}
              defaultValue={category?.position ?? 0}
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={category?.is_active ?? true}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Categoria visivel no cardapio
          </label>
        </CardContent>

        <CardFooter className="justify-end">
          <ButtonLink href={ROUTES.menu} variant="secondary">
            Cancelar
          </ButtonLink>
          <SubmitButton pendingLabel="Salvando...">
            {isEditing ? 'Salvar alteracoes' : 'Criar categoria'}
          </SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
