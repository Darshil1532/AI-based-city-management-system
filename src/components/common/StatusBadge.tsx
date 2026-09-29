import React from 'react';
import { ComplaintStatus } from '../../types';
import { Clock, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  };

  const config = {
    submitted: {
      label: 'Submitted',
      classes: 'clay-badge-amber text-amber-900',
      icon: Clock,
      dotClass: 'bg-amber-500',
    },
    assigned: {
      label: 'Assigned',
      classes: 'clay-badge-blue text-sky-900',
      icon: AlertCircle,
      dotClass: 'bg-sky-500',
    },
    in_progress: {
      label: 'In Progress',
      classes: 'clay-badge-blue text-indigo-900',
      icon: Wrench,
      dotClass: 'bg-indigo-500',
    },
    resolved: {
      label: 'Resolved',
      classes: 'clay-badge-emerald text-emerald-900',
      icon: CheckCircle2,
      dotClass: 'bg-emerald-500',
    },
  }[status] || {
    label: status,
    classes: 'clay-badge text-slate-700',
    icon: Clock,
    dotClass: 'bg-slate-400',
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap clay-badge ${sizeClasses[size]} ${config.classes}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};
