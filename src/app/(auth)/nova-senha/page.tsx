import type { Metadata } from 'next';
import { NewPasswordForm } from '@/components/auth/new-password-form';

export const metadata: Metadata = { title: 'Nova senha' };

export default function NewPasswordPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Definir nova senha</h1>
        <p className="text-sm text-slate-500">Escolha uma nova senha para acessar o painel.</p>
      </header>

      <NewPasswordForm />
    </div>
  );
}
