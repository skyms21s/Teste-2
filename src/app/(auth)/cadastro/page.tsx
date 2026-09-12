import type { Metadata } from 'next';
import Link from 'next/link';
import { SignUpForm } from '@/components/auth/signup-form';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Criar conta' };

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Criar conta</h1>
        <p className="text-sm text-slate-500">
          Cadastre-se para configurar o seu estabelecimento.
        </p>
      </header>

      <SignUpForm />

      <p className="text-center text-sm text-slate-500">
        Ja tem conta?{' '}
        <Link href={ROUTES.signIn} className="font-medium text-brand-600 hover:text-brand-700">
          Entrar
        </Link>
      </p>
    </div>
  );
}
