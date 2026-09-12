import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { MemberRole, Profile } from '@/types';

export interface BusinessMemberWithProfile {
  id: string;
  role: MemberRole;
  created_at: string;
  user_id: string;
  profile: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'> | null;
}

/**
 * Membros de uma empresa. O RLS so devolve linhas quando o usuario logado
 * tambem e membro da mesma empresa.
 */
export async function listBusinessMembers(businessId: string): Promise<BusinessMemberWithProfile[]> {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from('business_members')
    .select('id, role, created_at, user_id')
    .eq('business_id', businessId)
    .order('created_at', { ascending: true });

  if (error || !members || members.length === 0) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .in(
      'id',
      members.map((member) => member.user_id),
    );

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return members.map((member) => ({
    ...member,
    profile: profileById.get(member.user_id) ?? null,
  }));
}

/** Papel do usuario logado dentro de uma empresa (null quando nao e membro). */
export async function getUserRole(businessId: string): Promise<MemberRole | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .maybeSingle();

  return data?.role ?? null;
}
