'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ACTIVE_BUSINESS_COOKIE, ROUTES } from '@/lib/constants/routes';

/**
 * Troca a empresa ativa do painel.
 * So grava o cookie se o usuario realmente for membro da empresa (RLS + checagem).
 */
export async function setActiveBusinessAction(businessId: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false };

  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) return { ok: false };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, businessId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath(ROUTES.dashboard);
  return { ok: true };
}
