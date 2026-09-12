export const ROUTES = {
  home: '/',
  signIn: '/entrar',
  signUp: '/cadastro',
  forgotPassword: '/recuperar-senha',
  newPassword: '/nova-senha',
  onboarding: '/onboarding',
  dashboard: '/dashboard',
  orders: '/dashboard/pedidos',
  menu: '/dashboard/cardapio',
  customers: '/dashboard/clientes',
  reports: '/dashboard/relatorios',
  settings: '/dashboard/configuracoes',
} as const;

/** Rotas que exigem usuario autenticado. */
export const PROTECTED_PREFIXES = ['/dashboard', '/onboarding'] as const;

/** Rotas de autenticacao (usuario logado e redirecionado para o dashboard). */
export const AUTH_ROUTES = ['/entrar', '/cadastro', '/recuperar-senha'] as const;

/** Cookie que guarda qual empresa esta selecionada no painel. */
export const ACTIVE_BUSINESS_COOKIE = 'active_business_id';
