import { cn } from '@/lib/utils/cn';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('block text-sm font-medium text-slate-700', className)} {...props} />
  );
}

export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="text-xs text-red-600">{messages[0]}</p>;
}

export function FormField({
  label,
  htmlFor,
  hint,
  errors,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      <FieldError messages={errors} />
    </div>
  );
}
