import type { Database } from './database.types';

export type { Database, BusinessPlan, BusinessStatus, MemberRole } from './database.types';

type Tables = Database['public']['Tables'];

export type Profile = Tables['profiles']['Row'];
export type Business = Tables['businesses']['Row'];
export type BusinessMember = Tables['business_members']['Row'];

export type BusinessInsert = Tables['businesses']['Insert'];
export type BusinessUpdate = Tables['businesses']['Update'];
export type ProfileUpdate = Tables['profiles']['Update'];

/** Empresa acompanhada do papel do usuario logado nela. */
export type BusinessWithRole = Business & { role: BusinessMember['role'] };

/** Usuario logado + perfil. */
export interface SessionUser {
  id: string;
  email: string | null;
  profile: Profile | null;
}

/** Retorno padrao das server actions usadas nos formularios. */
export interface ActionState {
  status: 'idle' | 'success' | 'error';
  message: string | null;
  fieldErrors?: Record<string, string[]>;
}

export const IDLE_ACTION_STATE: ActionState = { status: 'idle', message: null };
