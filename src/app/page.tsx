import { ButtonLink } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
        Base do sistema
      </span>

      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Cardapio digital e gestao de pedidos
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600">
          Uma unica plataforma para restaurantes, hamburguerias, pizzarias e acaiterias. Cada
          estabelecimento com seus proprios dados, equipe e link exclusivo.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href={ROUTES.signUp} size="lg">
          Criar conta gratis
        </ButtonLink>
        <ButtonLink href={ROUTES.signIn} size="lg" variant="secondary">
          Entrar
        </ButtonLink>
      </div>
    </main>
  );
}
