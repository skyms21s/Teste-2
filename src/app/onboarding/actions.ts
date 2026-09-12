'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { translateDbError } from '@/lib/supabase/errors';
import { createBusinessSchema } from '@/lib/validations/business';
import { ACTIVE_BUSINESS_COOKIE, ROUTES } from '@/lib/constants/routes';
import type { ActionState } from '@/types';

/**
 * Cria a empresa do usuario logado.
 * O trigger on_business_created registra quem criou como owner em business_members.
 */
export async function createBusinessAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createBusinessSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
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
    redirect(ROUTES.signIn);
  }

  const { data, error } = await supabase
    .from('businesses')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error || !data) {
    return {
      status: 'error',
      message: error ? translateDbError(error) : 'Nao foi possivel criar a empresa.',
      fieldErrors: error?.code === '23505' ? { slug: ['Este link ja esta em uso.'] } : undefined,
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, data.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect(ROUTES.dashboard);
}
