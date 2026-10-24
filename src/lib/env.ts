/**
 * Leitura centralizada (e validada) das variaveis de ambiente.
 *
 * As variaveis NEXT_PUBLIC_* precisam ser referenciadas literalmente
 * para que o bundler do Next consiga substitui-las no client.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Variavel de ambiente ausente: ${name}. Copie .env.example para .env.local e preencha os valores do seu projeto Supabase.`,
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return required(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL');
}

export function getSupabaseAnonKey(): string {
  return required(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * URL base usada nos links enviados por e-mail (confirmacao / recuperacao).
 *
 * Na Vercel, sem NEXT_PUBLIC_SITE_URL, usa o dominio de PRODUCAO do projeto
 * (VERCEL_PROJECT_PRODUCTION_URL). VERCEL_URL nao serve: e o endereco unico de
 * cada deploy, que muda a todo push e nao esta na lista de redirects do Supabase.
 */
export function getSiteUrl(): string {
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (vercelProduction ? `https://${vercelProduction}` : 'http://localhost:3000');

  return url.replace(/\/$/, '');
}
