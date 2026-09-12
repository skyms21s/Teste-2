import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Cardapio Digital SaaS',
    template: '%s | Cardapio Digital',
  },
  description:
    'Plataforma de cardapio digital e gestao de pedidos para restaurantes, hamburguerias, pizzarias e acaiterias.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ea580c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
