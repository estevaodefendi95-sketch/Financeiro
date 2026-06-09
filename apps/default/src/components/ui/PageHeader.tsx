import React from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

const variantMap: Record<string, { icon: string; badge: string }> = {
  default: { icon: 'bg-primary/10 text-primary', badge: '' },
  primary: { icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', badge: '' },
  success: { icon: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', badge: 'text-green-600' },
  danger: { icon: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', badge: 'text-red-600' },
  warning: { icon: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400', badge: 'text-yellow-600' },
};

export function KPICard({ title, value, subtitle, icon: Icon, trend, variant = 'default', loading }: KPICardProps) {
  const v = variantMap[variant];
  const isPositive = trend && trend.value >= 0;

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-muted rounded w-24" />
            <div className="h-7 bg-muted rounded w-32" />
            <div className="h-3 bg-muted rounded w-20" />
          </div>
          <div className="w-11 h-11 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1 truncate">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          {trend && (
            <p className={cn('text-xs font-medium mt-1', isPositive ? 'text-green-600' : 'text-red-600')}>
              {isPositive ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', v.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
