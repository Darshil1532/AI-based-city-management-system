import React from 'react';
import { ShortcutFeedback } from '../../utils/useGlobalKeyboardShortcuts';
import { Zap } from 'lucide-react';

interface Props {
  feedback: ShortcutFeedback | null;
}

export const KeyboardShortcutFeedback: React.FC<Props> = ({ feedback }) => {
  if (!feedback) return null;

  return (
    <div
      key={feedback.id}
      className="fixed bottom-5 right-5 z-50 pointer-events-none flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 text-white backdrop-blur-md shadow-xl border border-slate-700/80 animate-fade-in text-xs"
    >
      <div className="flex items-center gap-1.5 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 font-bold text-[10px] text-blue-300">
          {feedback.key}
        </kbd>
      </div>
      <span className="font-medium text-slate-200">{feedback.message}</span>
    </div>
  );
};
