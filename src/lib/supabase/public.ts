import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/env';
import type { Database } from '@/types/database.types';

/**
 * Cliente anonimo e sem estado para as paginas publicas (vitrine da loja).
 * Nao le nem grava cookies: o visitante nunca precisa estar logado, e a
 * vitrine nao depende da sessao de quem esta olhando.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
