import { ButtonLink } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="text-2xl font-bold text-slate-900">Pagina nao encontrada</h1>
      <p className="max-w-sm text-sm text-slate-500">
        O endereco acessado nao existe ou foi movido.
      </p>
      <ButtonLink href={ROUTES.home}>Voltar para o inicio</ButtonLink>
    </main>
  );
}
