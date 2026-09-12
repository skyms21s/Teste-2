import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/env';
import type { Database } from '@/types/database.types';

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Sempre criar um novo por request (os cookies mudam a cada requisicao).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Chamado a partir de um Server Component: a renovacao do cookie
          // ja e feita pelo proxy (src/proxy.ts), entao pode ser ignorado.
        }
      },
    },
  });
}
