'use client';

import { useActionState } from 'react';
import { updateBusinessAction } from '@/app/dashboard/configuracoes/actions';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { FormField } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { ImageUploadField } from './image-upload-field';
import { IDLE_ACTION_STATE, type BusinessWithRole } from '@/types';

export function BusinessSettingsForm({ business }: { business: BusinessWithRole }) {
  const [state, formAction] = useActionState(updateBusinessAction, IDLE_ACTION_STATE);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="businessId" value={business.id} />

      {state.status === 'error' && state.message ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}
      {state.status === 'success' && state.message ? (
        <Alert tone="success">{state.message}</Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Dados do estabelecimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Nome" htmlFor="name" errors={state.fieldErrors?.name}>
            <Input id="name" name="name" defaultValue={business.name} required />
          </FormField>

          <FormField
            label="Link da loja"
            htmlFor="slug-readonly"
            hint="O link publico nao pode ser alterado por aqui nesta versao."
          >
            <Input id="slug-readonly" value={`/loja/${business.slug}`} readOnly disabled />
          </FormField>

          <FormField label="Telefone" htmlFor="phone" errors={state.fieldErrors?.phone}>
            <Input
              id="phone"
              name="phone"
              defaultValue={business.phone ?? ''}
              placeholder="(11) 99999-0000"
            />
          </FormField>

          <FormField label="Endereco" htmlFor="address" errors={state.fieldErrors?.address}>
            <Input
              id="address"
              name="address"
              defaultValue={business.address ?? ''}
              placeholder="Rua das Flores, 123 - Centro"
            />
          </FormField>

          <FormField label="Descricao" htmlFor="description" errors={state.fieldErrors?.description}>
            <Textarea id="description" name="description" defaultValue={business.description ?? ''} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identidade visual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImageUploadField
            name="logo"
            label="Logo"
            hint="PNG, JPG ou WEBP de ate 2 MB."
            currentUrl={business.logo_url}
            errors={state.fieldErrors?.logo}
          />
          <ImageUploadField
            name="cover"
            label="Capa"
            hint="Imagem larga exibida no topo do cardapio publico."
            currentUrl={business.cover_url}
            errors={state.fieldErrors?.cover}
            aspect="wide"
          />
        </CardContent>
        <CardFooter className="justify-end">
          <SubmitButton pendingLabel="Salvando...">Salvar alteracoes</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
