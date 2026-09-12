import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { Alert } from '@/components/ui/alert';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Entrar' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const { next, erro } = await searchParams;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Entrar</h1>
        <p className="text-sm text-slate-500">Acesse o painel do seu estabelecimento.</p>
      </header>

      {erro === 'link-invalido' ? (
        <Alert tone="error">Link expirado ou invalido. Solicite um novo.</Alert>
      ) : null}

      <LoginForm next={next} />

      <p className="text-center text-sm text-slate-500">
        Ainda nao tem conta?{' '}
        <Link href={ROUTES.signUp} className="font-medium text-brand-600 hover:text-brand-700">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
