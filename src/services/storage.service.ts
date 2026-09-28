import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export const BUSINESS_ASSETS_BUCKET = 'business-assets';

type Client = SupabaseClient<Database>;

/** Extensao derivada do tipo validado — nunca do nome enviado (ex.: "foto.html"). */
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

/**
 * Envia um arquivo para a pasta da empresa no Storage.
 *
 * O caminho SEMPRE comeca por `{business_id}/` — e o que as policies do bucket
 * usam para garantir que uma empresa nao escreva na pasta de outra.
 */
export async function uploadBusinessAsset(
  supabase: Client,
  businessId: string,
  file: File,
  prefix: string,
): Promise<string> {
  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) {
    throw new Error('Formato de imagem nao suportado. Use PNG, JPG ou WEBP.');
  }

  const path = `${businessId}/${prefix}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(BUSINESS_ASSETS_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw new Error('Falha ao enviar a imagem. Tente novamente.');
  }

  return supabase.storage.from(BUSINESS_ASSETS_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Caminho do objeto a partir da URL publica (null quando nao e do nosso bucket). */
export function storagePathFromPublicUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUSINESS_ASSETS_BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

/** Remove objetos do bucket, ignorando falhas (limpeza best-effort). */
export async function removeBusinessAssets(supabase: Client, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await supabase.storage.from(BUSINESS_ASSETS_BUCKET).remove(paths);
}
