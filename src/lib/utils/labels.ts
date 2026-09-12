import type { BusinessPlan, BusinessStatus, MemberRole } from '@/types';

export const PLAN_LABELS: Record<BusinessPlan, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export const STATUS_LABELS: Record<BusinessStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  suspended: 'Suspenso',
};

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Proprietario',
  manager: 'Gerente',
  employee: 'Funcionario',
};
