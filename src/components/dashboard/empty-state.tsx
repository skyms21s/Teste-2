import { Card } from '@/components/ui/card';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path d="M12 8v5M12 16h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="max-w-sm text-sm text-slate-500">{description}</p>
    </Card>
  );
}
