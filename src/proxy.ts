import { NextResponse, type NextRequest } from 'next/server';
import { createProxyClient } from '@/lib/supabase/proxy';
import { AUTH_ROUTES, PROTECTED_PREFIXES, ROUTES } from '@/lib/constants/routes';

/**
 * Proxy (antigo middleware) do Next.js:
 *  1. renova os cookies de sessao do Supabase a cada requisicao;
 *  2. bloqueia rotas privadas (/dashboard, /onboarding) para visitantes;
 *  3. tira o usuario logado das telas de login/cadastro.
 */
export default async function proxy(request: NextRequest) {
  const { supabase, getResponse } = createProxyClient(request);

  // getUser() valida o token no servidor do Supabase (nao confia no cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.signIn;
    url.search = '';
    url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (user && (AUTH_ROUTES as readonly string[]).includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.dashboard;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return getResponse();
}

export const config = {
  matcher: [
    /*
     * Executa em todas as rotas, exceto arquivos estaticos e imagens.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
