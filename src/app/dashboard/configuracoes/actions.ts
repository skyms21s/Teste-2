'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { translateDbError } from '@/lib/supabase/errors';
import { imageFileSchema, updateBusinessSchema } from '@/lib/validations/business';
import { ROUTES } from '@/lib/constants/routes';
import type { ActionState, BusinessUpdate } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const BUCKET = 'business-assets';

type Client = SupabaseClient<Database>;

/** Extrai o caminho do objeto a partir da URL publica do Storage. */
function storagePathFromPublicUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

async function uploadAsset(
  supabase: Client,
  businessId: string,
  file: File,
  kind: 'logo' | 'cover',
): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const path = `${businessId}/${kind}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw new Error('Falha ao enviar a imagem. Tente novamente.');
  }

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Atualiza os dados da empresa. Somente o owner consegue gravar:
 * a policy businesses_update_owner bloqueia qualquer outro papel.
 */
export async function updateBusinessAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const businessId = String(formData.get('businessId') ?? '');

  if (!businessId) {
    return { status: 'error', message: 'Empresa nao identificada.' };
  }

  const parsed = updateBusinessSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    description: formData.get('description'),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Revise os campos destacados.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: 'error', message: 'Sessao expirada. Entre novamente.' };
  }

  // Checagem de papel no servidor (defesa em profundidade — o RLS ja garante).
  const { data: membership } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membership?.role !== 'owner') {
    return {
      status: 'error',
      message: 'Apenas o proprietario pode alterar os dados da empresa.',
    };
  }

  const { data: current } = await supabase
    .from('businesses')
    .select('logo_url, cover_url')
    .eq('id', businessId)
    .maybeSingle();

  const payload: BusinessUpdate = { ...parsed.data };
  const fieldErrors: Record<string, string[]> = {};
  const replacedPaths: string[] = [];

  for (const kind of ['logo', 'cover'] as const) {
    const file = formData.get(kind);
    if (!(file instanceof File) || file.size === 0) continue;

    const validation = imageFileSchema.safeParse(file);
    if (!validation.success) {
      fieldErrors[kind] = validation.error.issues.map((issue) => issue.message);
      continue;
    }

    try {
      const publicUrl = await uploadAsset(supabase, businessId, file, kind);
      const previous = storagePathFromPublicUrl(
        kind === 'logo' ? (current?.logo_url ?? null) : (current?.cover_url ?? null),
      );
      if (previous) replacedPaths.push(previous);

      if (kind === 'logo') payload.logo_url = publicUrl;
      else payload.cover_url = publicUrl;
    } catch (error) {
      fieldErrors[kind] = [error instanceof Error ? error.message : 'Falha no upload.'];
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: 'error', message: 'Revise os campos destacados.', fieldErrors };
  }

  const { error } = await supabase.from('businesses').update(payload).eq('id', businessId);

  if (error) {
    return { status: 'error', message: translateDbError(error) };
  }

  if (replacedPaths.length > 0) {
    await supabase.storage.from(BUCKET).remove(replacedPaths);
  }

  revalidatePath(ROUTES.settings);
  revalidatePath(ROUTES.dashboard);

  return { status: 'success', message: 'Dados atualizados com sucesso.' };
}
