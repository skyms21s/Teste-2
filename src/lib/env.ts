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

/** URL base usada nos links enviados por e-mail (confirmacao / recuperacao). */
export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  return url.replace(/\/$/, '');
}
