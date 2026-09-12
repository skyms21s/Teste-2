import 'server-only';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import type { Profile, SessionUser } from '@/types';

/**
 * Usuario autenticado (validado no servidor do Supabase) + perfil.
 * Retorna null quando nao ha sessao valida.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

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
}

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
