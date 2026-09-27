'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { translateDbError } from '@/lib/supabase/errors';
import { categorySchema, productSchema } from '@/lib/validations/menu';
import { imageFileSchema } from '@/lib/validations/business';
import { ROUTES } from '@/lib/constants/routes';
import { requireActiveBusiness } from '@/services/business.service';
import { canManageMenu } from '@/services/menu.service';
import {
  removeBusinessAssets,
  storagePathFromPublicUrl,
  uploadBusinessAsset,
} from '@/services/storage.service';
import type { ActionState } from '@/types';

type FieldErrors = Record<string, string[]>;

function invalid(fieldErrors: FieldErrors): ActionState {
  return { status: 'error', message: 'Revise os campos destacados.', fieldErrors };
}

/**
 * Empresa ativa + permissao de edicao do cardapio.
 * Checagem no servidor em cima do RLS (defesa em profundidade).
 */
async function requireMenuManager() {
  const business = await requireActiveBusiness();

  if (!canManageMenu(business.role)) {
    return { business, denied: true as const };
  }

  return { business, denied: false as const };
}

const DENIED: ActionState = {
  status: 'error',
  message: 'Seu papel nao permite alterar o cardapio. Fale com o proprietario.',
};

function refreshMenu() {
  revalidatePath(ROUTES.menu);
}

// ---------------------------------------------------------------- categorias

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { business, denied } = await requireMenuManager();
  if (denied) return DENIED;

  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    position: formData.get('position') || 0,
    isActive: formData.get('isActive') === 'on',
  });

  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors as FieldErrors);

  const supabase = await createClient();
  const { error } = await supabase.from('categories').insert({
    business_id: business.id,
    name: parsed.data.name,
    description: parsed.data.description,
    position: parsed.data.position,
    is_active: parsed.data.isActive,
  });

  if (error) {
    return {
      status: 'error',
      message: error.code === '23505' ? 'Ja existe uma categoria com esse nome.' : translateDbError(error),
      fieldErrors: error.code === '23505' ? { name: ['Nome ja usado.'] } : undefined,
    };
  }

  refreshMenu();
  redirect(ROUTES.menu);
}

export async function updateCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { business, denied } = await requireMenuManager();
  if (denied) return DENIED;

  const categoryId = String(formData.get('categoryId') ?? '');
  if (!categoryId) return { status: 'error', message: 'Categoria nao identificada.' };

  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    position: formData.get('position') || 0,
    isActive: formData.get('isActive') === 'on',
  });

  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors as FieldErrors);

  const supabase = await createClient();
  const { error } = await supabase
    .from('categories')
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      position: parsed.data.position,
      is_active: parsed.data.isActive,
    })
    .eq('id', categoryId)
    .eq('business_id', business.id);

  if (error) {
    return {
      status: 'error',
      message: error.code === '23505' ? 'Ja existe uma categoria com esse nome.' : translateDbError(error),
      fieldErrors: error.code === '23505' ? { name: ['Nome ja usado.'] } : undefined,
    };
  }

  refreshMenu();
  redirect(ROUTES.menu);
}

export async function deleteCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { business, denied } = await requireMenuManager();
  if (denied) return DENIED;

  const categoryId = String(formData.get('categoryId') ?? '');
  if (!categoryId) return { status: 'error', message: 'Categoria nao identificada.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('business_id', business.id);

  if (error) {
    // 23503: a FK de products impede remover categoria que ainda tem itens.
    return {
      status: 'error',
      message:
        error.code === '23503'
          ? 'Esta categoria ainda tem produtos. Mova ou exclua os produtos antes.'
          : translateDbError(error),
    };
  }

  refreshMenu();
  return { status: 'success', message: 'Categoria excluida.' };
}

// ------------------------------------------------------------------ produtos

async function resolveProductImage(
  businessId: string,
  formData: FormData,
  currentUrl: string | null,
): Promise<{ imageUrl?: string | null; replacedPath?: string; error?: string }> {
  const file = formData.get('image');

  if (formData.get('removeImage') === 'on') {
    return { imageUrl: null, replacedPath: storagePathFromPublicUrl(currentUrl) ?? undefined };
  }

  if (!(file instanceof File) || file.size === 0) return {};

  const validation = imageFileSchema.safeParse(file);
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message ?? 'Imagem invalida.' };
  }

  const supabase = await createClient();

  try {
    const imageUrl = await uploadBusinessAsset(supabase, businessId, file, 'produtos/produto');
    return { imageUrl, replacedPath: storagePathFromPublicUrl(currentUrl) ?? undefined };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Falha no upload.' };
  }
}

export async function createProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { business, denied } = await requireMenuManager();
  if (denied) return DENIED;

  const parsed = productSchema.safeParse({
    categoryId: formData.get('categoryId'),
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    position: formData.get('position') || 0,
    isActive: formData.get('isActive') === 'on',
  });

  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors as FieldErrors);

  const image = await resolveProductImage(business.id, formData, null);
  if (image.error) return invalid({ image: [image.error] });

  const supabase = await createClient();
  const { error } = await supabase.from('products').insert({
    business_id: business.id,
    category_id: parsed.data.categoryId,
    name: parsed.data.name,
    description: parsed.data.description,
    price: parsed.data.price,
    image_url: image.imageUrl ?? null,
    position: parsed.data.position,
    is_active: parsed.data.isActive,
  });

  if (error) {
    return {
      status: 'error',
      message:
        error.code === '23503'
          ? 'Categoria invalida. Recarregue a pagina e tente novamente.'
          : translateDbError(error),
    };
  }

  refreshMenu();
  redirect(ROUTES.menu);
}

export async function updateProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { business, denied } = await requireMenuManager();
  if (denied) return DENIED;

  const productId = String(formData.get('productId') ?? '');
  if (!productId) return { status: 'error', message: 'Produto nao identificado.' };

  const parsed = productSchema.safeParse({
    categoryId: formData.get('categoryId'),
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    position: formData.get('position') || 0,
    isActive: formData.get('isActive') === 'on',
  });

  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors as FieldErrors);

  const supabase = await createClient();

  const { data: current } = await supabase
    .from('products')
    .select('image_url')
    .eq('id', productId)
    .eq('business_id', business.id)
    .maybeSingle();

  const image = await resolveProductImage(business.id, formData, current?.image_url ?? null);
  if (image.error) return invalid({ image: [image.error] });

  const { error } = await supabase
    .from('products')
    .update({
      category_id: parsed.data.categoryId,
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      position: parsed.data.position,
      is_active: parsed.data.isActive,
      ...(image.imageUrl !== undefined ? { image_url: image.imageUrl } : {}),
    })
    .eq('id', productId)
    .eq('business_id', business.id);

  if (error) {
    return {
      status: 'error',
      message:
        error.code === '23503'
          ? 'Categoria invalida. Recarregue a pagina e tente novamente.'
          : translateDbError(error),
    };
  }

  if (image.replacedPath) {
    await removeBusinessAssets(supabase, [image.replacedPath]);
  }

  refreshMenu();
  redirect(ROUTES.menu);
}

export async function deleteProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { business, denied } = await requireMenuManager();
  if (denied) return DENIED;

  const productId = String(formData.get('productId') ?? '');
  if (!productId) return { status: 'error', message: 'Produto nao identificado.' };

  const supabase = await createClient();

  const { data: current } = await supabase
    .from('products')
    .select('image_url')
    .eq('id', productId)
    .eq('business_id', business.id)
    .maybeSingle();

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('business_id', business.id);

  if (error) return { status: 'error', message: translateDbError(error) };

  const imagePath = storagePathFromPublicUrl(current?.image_url ?? null);
  if (imagePath) await removeBusinessAssets(supabase, [imagePath]);

  refreshMenu();
  return { status: 'success', message: 'Produto excluido.' };
}

/** Liga/desliga a exibicao de um produto sem abrir o formulario. */
export async function toggleProductActiveAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { business, denied } = await requireMenuManager();
  if (denied) return DENIED;

  const productId = String(formData.get('productId') ?? '');
  const nextActive = formData.get('nextActive') === 'true';

  if (!productId) return { status: 'error', message: 'Produto nao identificado.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('products')
    .update({ is_active: nextActive })
    .eq('id', productId)
    .eq('business_id', business.id);

  if (error) return { status: 'error', message: translateDbError(error) };

  refreshMenu();
  return { status: 'success', message: nextActive ? 'Produto ativado.' : 'Produto ocultado.' };
}
