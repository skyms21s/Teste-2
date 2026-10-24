import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import type { Profile, SessionUser } from '@/types';

/**
 * Usuario do Supabase Auth validado no servidor, UMA vez por requisicao.
 *
 * Layout, pagina e servicos precisam do usuario; sem o `cache` cada um fazia
 * sua propria ida ao Supabase Auth (eram 5 a 6 por pagina do painel).
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Usuario autenticado + perfil. Retorna null quando nao ha sessao valida.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>();

  return {
    id: user.id,
    email: user.email ?? null,
    profile: profile ?? null,
  };
});

/** Igual a getCurrentUser, mas redireciona para o login quando nao ha sessao. */
export async function requireUser(redirectTo: string = ROUTES.dashboard): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`${ROUTES.signIn}?next=${encodeURIComponent(redirectTo)}`);
  }

  return user;
}

/** Nome de exibicao do usuario (perfil > metadata do e-mail). */
export function getDisplayName(user: SessionUser): string {
  return user.profile?.full_name?.trim() || user.email?.split('@')[0] || 'Usuario';
}
