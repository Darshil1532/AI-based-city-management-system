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
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-medium ${className}`}
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>
          {customText || 'AI-assisted recommendation — requires administrator confirmation.'}
        </span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <p className={`text-xs text-slate-500 flex items-center gap-1.5 ${className}`}>
        <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>
          {customText || 'AI decision-support advisory. Final administrative action is governed by municipal personnel.'}
        </span>
      </p>
    );
  }

  return (
    <div
      className={`rounded-lg bg-blue-50/80 border border-blue-200/90 p-3.5 flex items-start gap-3 shadow-xs text-blue-950 ${className}`}
    >
      <div className="p-1.5 rounded-md bg-blue-100/90 text-blue-700 shrink-0 mt-0.5">
        <ShieldAlert className="w-4 h-4" />
      </div>
      <div className="text-xs leading-relaxed">
        <span className="font-semibold text-blue-900 block mb-0.5">
          AI Decision-Support System Safeguard
        </span>
        <span className="text-blue-800/90">
          {customText ||
            'This platform operates strictly as an AI decision-support tool. Classifications, priority predictions, department allocations, and cluster insights assist human city officials but do not constitute automated administrative determinations. All official actions require human validation.'}
        </span>
      </div>
    </div>
  );
};
