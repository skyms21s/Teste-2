'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants/routes';
import { ROLE_LABELS } from '@/lib/utils/labels';
import type { BusinessWithRole } from '@/types';
import { BusinessSwitcher } from './business-switcher';
import { SidebarNav } from './sidebar-nav';
import { SignOutButton } from './sign-out-button';

interface DashboardShellProps {
  business: BusinessWithRole;
  businesses: BusinessWithRole[];
  userName: string;
  userEmail: string | null;
  children: React.ReactNode;
}

export function DashboardShell({
  business,
  businesses,
  userName,
  userEmail,
  children,
}: DashboardShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const closeMobileNav = () => setIsMobileNavOpen(false);

  const sidebarContent = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href={ROUTES.dashboard} onClick={closeMobileNav} className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          CD
        </span>
        <span className="truncate text-sm font-semibold text-slate-900">{business.name}</span>
      </Link>

      <BusinessSwitcher businesses={businesses} activeId={business.id} />

      <div className="flex-1 overflow-y-auto">
        <SidebarNav onNavigate={closeMobileNav} />
      </div>

      <div className="rounded-lg bg-slate-50 p-3">
        <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
        <p className="truncate text-xs text-slate-500">{userEmail}</p>
        <p className="mt-1 text-xs text-brand-700">{ROLE_LABELS[business.role]}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar fixa (desktop) */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Drawer (mobile) */}
      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={closeMobileNav}
            className="absolute inset-0 bg-slate-900/40"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-xl">
            {sidebarContent}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={isMobileNavOpen}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{business.name}</p>
            <p className="truncate text-xs text-slate-500">/loja/{business.slug}</p>
          </div>

          <div className="hidden text-right sm:block">
            <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
            <p className="truncate text-xs text-slate-500">{userEmail}</p>
          </div>

          <SignOutButton />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
