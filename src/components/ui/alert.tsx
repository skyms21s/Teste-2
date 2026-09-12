import { cn } from '@/lib/utils/cn';

type Tone = 'error' | 'success' | 'info';

const tones: Record<Tone, string> = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-slate-200 bg-slate-50 text-slate-600',
};

export function Alert({
  tone = 'info',
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('rounded-lg border px-3 py-2 text-sm', tones[tone], className)}
    >
      {children}
    </div>
  );
}
