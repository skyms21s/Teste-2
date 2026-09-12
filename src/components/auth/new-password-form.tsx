'use client';

import { useActionState } from 'react';
import { newPasswordAction } from '@/app/(auth)/actions';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { IDLE_ACTION_STATE } from '@/types';

export function NewPasswordForm() {
  const [state, formAction] = useActionState(newPasswordAction, IDLE_ACTION_STATE);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' && state.message ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}

      <FormField
        label="Nova senha"
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
        label="Confirmar nova senha"
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

      <SubmitButton className="w-full" pendingLabel="Salvando...">
        Salvar nova senha
      </SubmitButton>
    </form>
  );
}
