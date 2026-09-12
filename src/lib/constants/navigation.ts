import { ROUTES } from './routes';

export interface NavItem {
  label: string;
  href: string;
  /** Nome do icone renderizado por components/dashboard/nav-icon.tsx */
  icon: 'overview' | 'orders' | 'menu' | 'customers' | 'reports' | 'settings';
  /** Rota exata (nao marca como ativa ao entrar em subrotas). */
  exact?: boolean;
}

export const DASHBOARD_NAV: NavItem[] = [
  { label: 'Visao geral', href: ROUTES.dashboard, icon: 'overview', exact: true },
  { label: 'Pedidos', href: ROUTES.orders, icon: 'orders' },
  { label: 'Cardapio', href: ROUTES.menu, icon: 'menu' },
  { label: 'Clientes', href: ROUTES.customers, icon: 'customers' },
  { label: 'Relatorios', href: ROUTES.reports, icon: 'reports' },
  { label: 'Configuracoes', href: ROUTES.settings, icon: 'settings' },
];
