import React from 'react';
import { ShieldAlert, Sparkles } from 'lucide-react';

interface AIDecisionDisclaimerProps {
  variant?: 'banner' | 'inline' | 'compact';
  customText?: string;
  className?: string;
}

export const AIDecisionDisclaimer: React.FC<AIDecisionDisclaimerProps> = ({
  variant = 'banner',
  customText,
  className = '',
}) => {
  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl clay-badge clay-badge-blue text-xs font-semibold ${className}`}
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        <span>
          {customText || 'AI-assisted recommendation — requires administrator confirmation.'}
        </span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <p className={`text-xs text-slate-500 flex items-center gap-1.5 ${className}`}>
        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        <span>
          {customText || 'AI decision-support advisory. Final administrative action is governed by municipal personnel.'}
        </span>
      </p>
    );
  }

  return (
    <div
      className={`rounded-2xl clay-card p-4 flex items-start gap-3.5 text-slate-800 ${className}`}
    >
      <div className="p-2 rounded-xl clay-metric-icon bg-indigo-50 text-indigo-700 shrink-0 mt-0.5">
        <ShieldAlert className="w-4 h-4" />
      </div>
      <div className="text-xs leading-relaxed">
        <span className="font-bold text-slate-900 block mb-0.5">
          AI Decision-Support System Safeguard
        </span>
        <span className="text-slate-600 font-medium">
          {customText ||
            'This platform operates strictly as an AI decision-support tool. Classifications, priority predictions, department allocations, and cluster insights assist human city officials but do not constitute automated administrative determinations. All official actions require human validation.'}
        </span>
      </div>
    </div>
  );
};
