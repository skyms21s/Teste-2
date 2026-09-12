'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signInAction } from '@/app/(auth)/actions';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { ROUTES } from '@/lib/constants/routes';
import { IDLE_ACTION_STATE } from '@/types';

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(signInAction, IDLE_ACTION_STATE);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ROUTES.dashboard} />

      {state.status === 'error' && state.message ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}

      <FormField label="E-mail" htmlFor="email" errors={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          required
        />
      </FormField>

      <FormField label="Senha" htmlFor="password" errors={state.fieldErrors?.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="********"
          required
        />
      </FormField>

      <div className="flex justify-end">
        <Link
          href={ROUTES.forgotPassword}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Esqueci minha senha
        </Link>
      </div>

      <SubmitButton className="w-full" pendingLabel="Entrando...">
        Entrar
      </SubmitButton>
    </form>
  );
}
