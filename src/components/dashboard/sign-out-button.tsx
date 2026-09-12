'use client';

import { signOutAction } from '@/app/(auth)/actions';
import { SubmitButton } from '@/components/ui/submit-button';

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <SubmitButton variant="secondary" size="sm" className={className} pendingLabel="Saindo...">
        Sair
      </SubmitButton>
    </form>
  );
}
