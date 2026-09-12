import type { AuthError } from '@supabase/supabase-js';

/** Traduz os erros mais comuns do Supabase Auth para mensagens em portugues. */
export function translateAuthError(error: AuthError | { message: string; code?: string }): string {
  const code = 'code' in error ? error.code : undefined;
  const message = error.message.toLowerCase();

  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.';
  }
  if (code === 'user_already_exists' || message.includes('already registered')) {
    return 'Este e-mail ja esta cadastrado.';
  }
  if (code === 'weak_password' || message.includes('password should be')) {
    return 'Senha muito fraca. Use no minimo 8 caracteres.';
  }
  if (code === 'over_email_send_rate_limit' || message.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  if (code === 'same_password') {
    return 'A nova senha precisa ser diferente da atual.';
  }
  if (message.includes('token has expired') || message.includes('invalid token')) {
    return 'Link expirado ou invalido. Solicite um novo.';
  }

  return 'Nao foi possivel completar a operacao. Tente novamente.';
}

/** Traduz erros de banco (PostgREST). */
export function translateDbError(error: { code?: string; message: string }): string {
  if (error.code === '23505') {
    return 'Este link (slug) ja esta em uso por outra empresa. Escolha outro.';
  }
  if (error.code === '23514') {
    return 'Dados invalidos. Revise os campos e tente novamente.';
  }
  if (error.code === '42501' || error.code === 'PGRST301') {
    return 'Voce nao tem permissao para executar esta acao.';
  }

  return 'Nao foi possivel salvar os dados. Tente novamente.';
}
