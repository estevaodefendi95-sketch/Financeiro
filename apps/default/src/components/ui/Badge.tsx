import React from 'react';
import { cn, getStatusColor } from '../../lib/utils';

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
}

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  recebido: 'Recebido',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
  rascunho: 'Rascunho',
  confirmado: 'Confirmado',
  entregue: 'Entregue',
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
};

export function StatusBadge({ status, label, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      getStatusColor(status),
      className
    )}>
      {label || statusLabels[status] || status}
    </span>
  );
}

interface SimpleBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: 'bg-primary/10 text-primary',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export function Badge({ children, variant = 'default', className }: SimpleBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}
