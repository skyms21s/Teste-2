import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ACTIVE_BUSINESS_COOKIE, ROUTES } from '@/lib/constants/routes';
import type { Business, BusinessWithRole, MemberRole } from '@/types';

type MembershipRow = {
  role: MemberRole;
  businesses: Business | null;
};

/**
 * Empresas em que o usuario logado e membro.
 * O RLS garante que apenas os vinculos do proprio usuario sao retornados.
 */
export async function listUserBusinesses(): Promise<BusinessWithRole[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('business_members')
    .select('role, businesses(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .overrideTypes<MembershipRow[]>();

  if (error || !data) return [];

  return data
    .filter((row): row is MembershipRow & { businesses: Business } => row.businesses !== null)
    .map((row) => ({ ...row.businesses, role: row.role }));
}

/**
 * Empresa ativa do painel: a marcada no cookie (se o usuario for membro dela)
 * ou a primeira empresa do usuario.
 */
export async function getActiveBusiness(): Promise<BusinessWithRole | null> {
  const businesses = await listUserBusinesses();
  if (businesses.length === 0) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value;

  return businesses.find((business) => business.id === activeId) ?? businesses[0];
}

/** Empresa ativa garantida — redireciona para o onboarding quando nao existe. */
export async function requireActiveBusiness(): Promise<BusinessWithRole> {
  const business = await getActiveBusiness();

  if (!business) {
    redirect(ROUTES.onboarding);
  }

  return business;
}

export function canManageBusiness(role: MemberRole): boolean {
  return role === 'owner';
}
