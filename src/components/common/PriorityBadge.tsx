import React from 'react';
import { PriorityLevel } from '../../types';
import { AlertTriangle, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface PriorityBadgeProps {
  priority?: PriorityLevel | string;
  size?: 'sm' | 'md' | 'lg';
  isAI?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'md',
  isAI = false,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  };

  const normalizedKey = (priority && ['High', 'Medium', 'Low'].includes(priority) ? priority : 'Pending') as 'High' | 'Medium' | 'Low' | 'Pending';

  const configs: Record<'High' | 'Medium' | 'Low' | 'Pending', { label: string; classes: string; dotClass: string; icon: any }> = {
    High: {
      label: 'High',
      classes: 'clay-badge-rose text-rose-900',
      dotClass: 'bg-rose-500 animate-pulse',
      icon: AlertTriangle,
    },
    Medium: {
      label: 'Medium',
      classes: 'clay-badge-amber text-amber-900',
      dotClass: 'bg-amber-500',
      icon: Minus,
    },
    Low: {
      label: 'Low',
      classes: 'clay-badge text-slate-700',
      dotClass: 'bg-slate-400',
      icon: ArrowDownRight,
    },
    Pending: {
      label: priority || 'Pending Review',
      classes: 'clay-badge-amber text-amber-900',
      dotClass: 'bg-amber-400',
      icon: Minus,
    },
  };

  const config = configs[normalizedKey] || configs.Pending;

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-xl font-semibold whitespace-nowrap clay-badge ${sizeClasses[size]} ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      <span>{config.label}</span>
      {isAI && (
        <span className="text-[10px] uppercase font-bold tracking-wider px-1 bg-white/80 rounded text-slate-600 ml-0.5">
          AI
        </span>
      )}
    </span>
  );
};
