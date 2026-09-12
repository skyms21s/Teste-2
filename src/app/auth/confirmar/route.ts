import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';

/**
 * Destino dos links enviados por e-mail (confirmacao de cadastro e
 * recuperacao de senha). Valida o token e cria a sessao via cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');

  const nextParam = searchParams.get('next') ?? ROUTES.dashboard;
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : ROUTES.dashboard;

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(
    new URL(`${ROUTES.signIn}?erro=link-invalido`, origin),
  );
}
