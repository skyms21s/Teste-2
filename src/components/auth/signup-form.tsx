'use client';

import { useActionState } from 'react';
import { signUpAction } from '@/app/(auth)/actions';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { IDLE_ACTION_STATE } from '@/types';

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, IDLE_ACTION_STATE);

  if (state.status === 'success') {
    return <Alert tone="success">{state.message}</Alert>;
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' && state.message ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}

      <FormField label="Nome completo" htmlFor="fullName" errors={state.fieldErrors?.fullName}>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          placeholder="Maria Silva"
          required
        />
      </FormField>

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

      <FormField
        label="Senha"
        htmlFor="password"
        hint="Minimo de 8 caracteres."
        errors={state.fieldErrors?.password}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </FormField>

      <FormField
        label="Confirmar senha"
        htmlFor="confirmPassword"
        errors={state.fieldErrors?.confirmPassword}
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </FormField>

      <SubmitButton className="w-full" pendingLabel="Criando conta...">
        Criar conta
      </SubmitButton>
    </form>
  );
}
