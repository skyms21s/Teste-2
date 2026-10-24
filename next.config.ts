import type { NextConfig } from 'next';

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

/** Cabecalhos aplicados a todas as respostas. */
const securityHeaders = [
  // O navegador nao "adivinha" tipos de arquivo (evita executar upload como script).
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Links externos nao recebem o caminho completo (ex.: tokens na URL).
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Recursos do aparelho que o app nao usa ficam bloqueados.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

/**
 * Painel e telas de login nao podem ser embutidos em outro site (clickjacking).
 * A loja publica fica de fora: o restaurante pode querer exibi-la no proprio site.
 */
const antiFramingHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
      : [],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/((?!loja/).*)', headers: antiFramingHeaders },
    ];
  },
};

export default nextConfig;
