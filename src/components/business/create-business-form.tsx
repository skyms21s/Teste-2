'use client';

import { useActionState, useState } from 'react';
import { createBusinessAction } from '@/app/onboarding/actions';
import { Alert } from '@/components/ui/alert';
import { Input, Textarea } from '@/components/ui/input';
import { FormField } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { slugify } from '@/lib/utils/slug';
import { IDLE_ACTION_STATE } from '@/types';

export function CreateBusinessForm() {
  const [state, formAction] = useActionState(createBusinessAction, IDLE_ACTION_STATE);
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' && state.message ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}

      <FormField label="Nome do estabelecimento" htmlFor="name" errors={state.fieldErrors?.name}>
        <Input
          id="name"
          name="name"
          placeholder="Ponto de Encontro"
          required
          onChange={(event) => {
            if (!slugTouched) setSlug(slugify(event.target.value));
          }}
        />
      </FormField>

      <FormField
        label="Link da loja"
        htmlFor="slug"
        hint="Sera o endereco publico do seu cardapio: /loja/seu-link"
        errors={state.fieldErrors?.slug}
      >
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm text-slate-500">/loja/</span>
          <Input
            id="slug"
            name="slug"
            value={slug}
            required
            placeholder="ponto-de-encontro"
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
          />
        </div>
      </FormField>

      <FormField label="Telefone" htmlFor="phone" errors={state.fieldErrors?.phone}>
        <Input id="phone" name="phone" placeholder="(11) 99999-0000" />
      </FormField>

      <FormField label="Endereco" htmlFor="address" errors={state.fieldErrors?.address}>
        <Input id="address" name="address" placeholder="Rua das Flores, 123 - Centro" />
      </FormField>

      <FormField label="Descricao" htmlFor="description" errors={state.fieldErrors?.description}>
        <Textarea
          id="description"
          name="description"
          placeholder="Hamburgueria artesanal com atendimento das 18h as 23h."
        />
      </FormField>

      <SubmitButton className="w-full" pendingLabel="Criando...">
        Criar empresa
      </SubmitButton>
    </form>
  );
}
