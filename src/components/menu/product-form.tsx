'use client';

import { useActionState, useState } from 'react';
import { createProductAction, updateProductAction } from '@/app/dashboard/cardapio/actions';
import { Alert } from '@/components/ui/alert';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { FormField } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { ROUTES } from '@/lib/constants/routes';
import { priceToInput } from '@/lib/utils/currency';
import { IDLE_ACTION_STATE, type Category, type Product } from '@/types';

export function ProductForm({
  categories,
  product,
  defaultCategoryId,
}: {
  categories: Category[];
  product?: Product;
  defaultCategoryId?: string;
}) {
  const isEditing = Boolean(product);
  const [state, formAction] = useActionState(
    isEditing ? updateProductAction : createProductAction,
    IDLE_ACTION_STATE,
  );
  const [preview, setPreview] = useState<string | null>(product?.image_url ?? null);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}

      {state.status === 'error' && state.message ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}

      <Card>
        <CardContent className="space-y-4">
          <FormField label="Categoria" htmlFor="categoryId" errors={state.fieldErrors?.categoryId}>
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={product?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? ''}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Nome do produto" htmlFor="name" errors={state.fieldErrors?.name}>
            <Input
              id="name"
              name="name"
              defaultValue={product?.name ?? ''}
              placeholder="X-Salada"
              required
            />
          </FormField>

          <FormField
            label="Preco"
            htmlFor="price"
            hint="Use virgula para os centavos. Ex: 24,90"
            errors={state.fieldErrors?.price}
          >
            <Input
              id="price"
              name="price"
              inputMode="decimal"
              defaultValue={product ? priceToInput(product.price) : ''}
              placeholder="24,90"
              required
            />
          </FormField>

          <FormField
            label="Descricao"
            htmlFor="description"
            hint="Opcional. Ingredientes, tamanho, observacoes."
            errors={state.fieldErrors?.description}
          >
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={product?.description ?? ''}
              placeholder="Pao brioche, hamburguer 180g, queijo, alface e tomate."
            />
          </FormField>

          <FormField
            label="Foto"
            htmlFor="image"
            hint="Opcional. PNG, JPG ou WEBP de ate 2 MB."
            errors={state.fieldErrors?.image}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Previa do produto" className="h-full w-full object-cover" />
                ) : (
                  'Sem foto'
                )}
              </div>

              <div className="w-full space-y-2">
                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setPreview(file ? URL.createObjectURL(file) : (product?.image_url ?? null));
                  }}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                />

                {product?.image_url ? (
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      name="removeImage"
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Remover a foto atual
                  </label>
                ) : null}
              </div>
            </div>
          </FormField>

          <FormField
            label="Ordem"
            htmlFor="position"
            hint="Menor numero aparece primeiro dentro da categoria."
            errors={state.fieldErrors?.position}
          >
            <Input
              id="position"
              name="position"
              type="number"
              min={0}
              max={999}
              defaultValue={product?.position ?? 0}
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={product?.is_active ?? true}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Produto disponivel
          </label>
        </CardContent>

        <CardFooter className="justify-end">
          <ButtonLink href={ROUTES.menu} variant="secondary">
            Cancelar
          </ButtonLink>
          <SubmitButton pendingLabel="Salvando...">
            {isEditing ? 'Salvar alteracoes' : 'Criar produto'}
          </SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
