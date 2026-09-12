import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Recuperar senha' };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Recuperar senha</h1>
        <p className="text-sm text-slate-500">
          Informe seu e-mail e enviaremos um link para criar uma nova senha.
        </p>
      </header>

      <ForgotPasswordForm />

      <p className="text-center text-sm text-slate-500">
        <Link href={ROUTES.signIn} className="font-medium text-brand-600 hover:text-brand-700">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
