'use client';

import { useActionState } from 'react';
import { forgotPasswordAction } from '@/app/(auth)/actions';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { IDLE_ACTION_STATE } from '@/types';

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, IDLE_ACTION_STATE);

  if (state.status === 'success') {
    return <Alert tone="success">{state.message}</Alert>;
  }

  return (
    <form action={formAction} className="space-y-4">
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

      <SubmitButton className="w-full" pendingLabel="Enviando...">
        Enviar link de recuperacao
      </SubmitButton>
    </form>
  );
}
