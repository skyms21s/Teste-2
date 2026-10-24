import { ButtonLink } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';

export default function StoreNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold text-brand-600">Loja indisponivel</p>
      <h1 className="text-2xl font-bold text-slate-900">Nao encontramos este cardapio</h1>
      <p className="max-w-sm text-sm text-slate-500">
        Confira se o link esta correto. A loja pode ter mudado de endereco ou estar temporariamente
        fora do ar.
      </p>
      <ButtonLink href={ROUTES.home} variant="secondary">
        Ir para o inicio
      </ButtonLink>
    </main>
  );
}
