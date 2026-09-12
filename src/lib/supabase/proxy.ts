import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/env';
import type { Database } from '@/types/database.types';

/**
 * Cria um cliente Supabase ligado aos cookies da requisicao e devolve a
 * resposta que deve ser retornada (com os cookies de sessao atualizados).
 */
export function createProxyClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  return { supabase, getResponse: () => response };
}
