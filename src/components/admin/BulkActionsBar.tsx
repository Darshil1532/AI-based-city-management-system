import React, { useState } from 'react';
import { Complaint } from '../../types';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
  CheckSquare,
  Square,
  Layers,
} from 'lucide-react';
import {
  BulkAssignModal,
  BulkStatusModal,
  BulkPriorityModal,
  BulkRatifyModal,
} from './BulkActionModals';

interface BulkActionsBarProps {
  selectedIds: string[];
  allComplaints: Complaint[];
  totalVisibleCount: number;
  onSelectAllVisible: () => void;
  onClearSelection: () => void;
  className?: string;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedIds,
  allComplaints,
  totalVisibleCount,
  onSelectAllVisible,
  onClearSelection,
  className = '',
}) => {
  const [activeModal, setActiveModal] = useState<
    'assign' | 'status' | 'priority' | 'ratify' | null
  >(null);

  if (selectedIds.length === 0) return null;

  // Selected complaints objects
  const selectedComplaints = allComplaints.filter((c) =>
    selectedIds.includes(c.id)
  );

  const isAllVisibleSelected =
    totalVisibleCount > 0 && selectedIds.length >= totalVisibleCount;

  return (
    <>
      {/* Floating Bulk Actions Dock */}
      <aside
        aria-label="Bulk actions toolbar"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-3xl clay-card bg-slate-900/95 text-white rounded-3xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 shadow-2xl ${className}`}
      >
        {/* Left: Counter & Select All Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 rounded-xl text-xs font-mono font-bold text-blue-400 border border-slate-700/60 shadow-inner">
            <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {selectedIds.length} <span className="hidden sm:inline font-sans font-normal text-slate-300">selected</span>
            </span>
          </div>

          <button
            type="button"
            onClick={isAllVisibleSelected ? onClearSelection : onSelectAllVisible}
            className="text-xs text-slate-300 hover:text-white underline underline-offset-4 decoration-slate-600 hover:decoration-slate-300 transition-all cursor-pointer font-medium"
          >
            {isAllVisibleSelected
              ? 'Deselect all'
              : `Select all (${totalVisibleCount})`}
          </button>
        </div>

        {/* Center/Right: Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk Assign to Department */}
          <button
            type="button"
            onClick={() => setActiveModal('assign')}
            className="px-3.5 py-2 text-xs font-bold clay-btn-blue text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            title="Bulk Assign to Department"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Assign Department</span>
          </button>

          {/* Bulk Status Update */}
          <button
            type="button"
            onClick={() => setActiveModal('status')}
            className="px-3.5 py-2 text-xs font-bold clay-btn bg-slate-800 text-white border border-slate-700/80 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Bulk Status Update"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Update Status</span>
          </button>

          {/* Bulk Priority */}
          <button
            type="button"
            onClick={() => setActiveModal('priority')}
            className="px-3 py-2 text-xs font-bold clay-btn bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Bulk Priority"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Priority</span>
          </button>

          {/* Bulk Ratify AI */}
          <button
            type="button"
            onClick={() => setActiveModal('ratify')}
            className="px-3 py-2 text-xs font-bold clay-btn bg-slate-800 text-blue-300 border border-slate-700/80 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Ratify AI Triage"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Ratify AI</span>
          </button>

          {/* Dismiss / Clear button */}
          <button
            type="button"
            onClick={onClearSelection}
            aria-label="Clear selection"
            className="w-8 h-8 clay-btn bg-slate-800 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-all cursor-pointer ml-1"
            title="Clear Selection (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Modals */}
      <BulkAssignModal
        isOpen={activeModal === 'assign'}
        onClose={() => setActiveModal(null)}
        selectedComplaints={selectedComplaints}
        onComplete={onClearSelection}
      />

      <BulkStatusModal
        isOpen={activeModal === 'status'}
        onClose={() => setActiveModal(null)}
        selectedComplaints={selectedComplaints}
        onComplete={onClearSelection}
      />

      <BulkPriorityModal
        isOpen={activeModal === 'priority'}
        onClose={() => setActiveModal(null)}
        selectedComplaints={selectedComplaints}
        onComplete={onClearSelection}
      />

      <BulkRatifyModal
        isOpen={activeModal === 'ratify'}
        onClose={() => setActiveModal(null)}
        selectedComplaints={selectedComplaints}
        onComplete={onClearSelection}
      />
    </>
  );
};
