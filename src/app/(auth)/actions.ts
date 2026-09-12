'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { translateAuthError } from '@/lib/supabase/errors';
import { getSiteUrl } from '@/lib/env';
import { ROUTES } from '@/lib/constants/routes';
import {
  forgotPasswordSchema,
  newPasswordSchema,
  signInSchema,
  signUpSchema,
} from '@/lib/validations/auth';
import type { ActionState } from '@/types';

function invalid(fieldErrors: Record<string, string[]>): ActionState {
  return { status: 'error', message: 'Revise os campos destacados.', fieldErrors };
}

/** Garante que o redirect pos-login e interno (evita open redirect). */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === 'string' ? value : '';
  return next.startsWith('/') && !next.startsWith('//') ? next : ROUTES.dashboard;
}

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return invalid(parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { status: 'error', message: translateAuthError(error) };
  }

  redirect(safeNext(formData.get('next')));
}

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return invalid(parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${getSiteUrl()}/auth/confirmar?next=${encodeURIComponent(ROUTES.onboarding)}`,
    },
  });

  if (error) {
    return { status: 'error', message: translateAuthError(error) };
  }

  // Confirmacao de e-mail desativada no Supabase: a sessao ja vem pronta.
  if (data.session) {
    redirect(ROUTES.onboarding);
  }

  return {
    status: 'success',
    message: 'Cadastro criado! Enviamos um link de confirmacao para o seu e-mail.',
  };
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') });

  if (!parsed.success) {
    return invalid(parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/confirmar?next=${encodeURIComponent(ROUTES.newPassword)}`,
  });

  if (error) {
    return { status: 'error', message: translateAuthError(error) };
  }

  // Resposta generica: nao revela se o e-mail existe na base.
  return {
    status: 'success',
    message: 'Se existir uma conta com este e-mail, enviamos o link de recuperacao.',
  };
}

export async function newPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return invalid(parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: 'error',
      message: 'Link expirado. Solicite a recuperacao de senha novamente.',
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { status: 'error', message: translateAuthError(error) };
  }

  redirect(ROUTES.dashboard);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.signIn);
}
