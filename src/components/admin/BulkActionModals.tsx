import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  DepartmentName,
  ComplaintStatus,
  PriorityLevel,
  Complaint,
} from '../../types';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
  Users,
  FileText,
  Clock,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';

// Quick department field squad suggestions
const DEPARTMENT_CREWS: Record<DepartmentName, string[]> = {
  'Public Works Department': [
    'PWD Rapid Asphalt Patch Unit 2',
    'Road & Pavement Maintenance Crew A',
    'Inspector J. Martinez (Unit 4)',
  ],
  'Sanitation Department': [
    'Sanitation Waste Hauler Route 7',
    'Commercial Zone Sanitation Squad',
    'Solid Waste Division Crew B',
  ],
  'Water Supply Department': [
    'Water Utility Emergency Pipeline Crew',
    'Hydraulic Pressure Repair Team 3',
    'Lead Engineer S. Rao (Water Services)',
  ],
  'Electrical Department': [
    'Grid & Luminaire Squad Alpha',
    'Streetlight Electrical Dispatch Unit 5',
    'High-Voltage Municipal Techs',
  ],
  'Traffic & Transit Department': [
    'Traffic Signal Control Technicians',
    'Road Signage & Corridor Squad',
    'Transit Intersection Crew',
  ],
  'Urban Infrastructure Division': [
    'Structural Inspection Team',
    'Storm Drainage & Culvert Unit',
    'Urban Civil Works Division',
  ],
  'General Municipal Administration': [
    'City Hall Operations Supervisor',
    'Municipal Ombudsman Reviewer',
  ],
};

// 1. Bulk Assign to Department Modal
interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedComplaints: Complaint[];
  onComplete: () => void;
}

export const BulkAssignModal: React.FC<BulkAssignModalProps> = ({
  isOpen,
  onClose,
  selectedComplaints,
  onComplete,
}) => {
  const { departments, bulkAssignDepartment } = useApp();
  const [selectedDept, setSelectedDept] = useState<DepartmentName>(
    'Public Works Department'
  );
  const [assignedOfficer, setAssignedOfficer] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [showIdsList, setShowIdsList] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // Default to the most common department or first suggestion
      const defaultOfficer = DEPARTMENT_CREWS[selectedDept]?.[0] || '';
      setAssignedOfficer(defaultOfficer);
      setAdminNotes('');
      setShowIdsList(false);
      setIsSubmitting(false);
    }
  }, [isOpen, selectedDept]);

  if (!isOpen) return null;

  const handleDeptChange = (dept: DepartmentName) => {
    setSelectedDept(dept);
    setAssignedOfficer(DEPARTMENT_CREWS[dept]?.[0] || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedComplaints.length === 0) return;
    setIsSubmitting(true);

    const ids = selectedComplaints.map((c) => c.id);
    bulkAssignDepartment(
      ids,
      selectedDept,
      assignedOfficer.trim() || undefined,
      adminNotes.trim() || undefined
    );

    setIsSubmitting(false);
    onComplete();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-assign-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="bulk-assign-title"
                className="text-sm font-bold text-slate-900 tracking-tight"
              >
                Bulk Assign to Department
              </h3>
              <p className="text-xs text-slate-500">
                Dispatch {selectedComplaints.length} selected{' '}
                {selectedComplaints.length === 1 ? 'issue' : 'issues'} to a
                municipal squad
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Affected Complaints Preview Pill Bar */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Target Complaints ({selectedComplaints.length})
              </span>
              <button
                type="button"
                onClick={() => setShowIdsList(!showIdsList)}
                className="text-blue-600 hover:text-blue-800 text-[11px] font-medium font-mono"
              >
                {showIdsList ? 'Hide details' : 'View records'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-0.5">
              {selectedComplaints.map((c) => (
                <span
                  key={c.id}
                  className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[11px] font-medium shadow-2xs"
                >
                  {c.id}
                </span>
              ))}
            </div>

            {showIdsList && (
              <div className="pt-2 border-t border-slate-200/70 space-y-1.5 max-h-36 overflow-y-auto text-[11px]">
                {selectedComplaints.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between text-slate-600 py-0.5"
                  >
                    <span className="font-mono font-semibold text-slate-900 truncate max-w-[80px]">
                      {c.id}
                    </span>
                    <span className="truncate max-w-[200px] text-slate-700">
                      {c.title}
                    </span>
                    <span className="text-slate-400 truncate max-w-[120px]">
                      {c.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Department Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
              Target Department <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDept}
              onChange={(e) => handleDeptChange(e.target.value as DepartmentName)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
            >
              {departments.map((dept) => (
                <option key={dept.name} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Field Squad / Officer Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
                Assigned Squad / Field Officer
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Optional
              </span>
            </div>
            <input
              type="text"
              value={assignedOfficer}
              onChange={(e) => setAssignedOfficer(e.target.value)}
              placeholder="e.g. Rapid Asphalt Patch Unit 2 or Inspector Name"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
            />
            {/* Quick Crew Chips */}
            {DEPARTMENT_CREWS[selectedDept]?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-mono self-center">
                  Presets:
                </span>
                {DEPARTMENT_CREWS[selectedDept].map((crew) => (
                  <button
                    type="button"
                    key={crew}
                    onClick={() => setAssignedOfficer(crew)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      assignedOfficer === crew
                        ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {crew}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dispatch Directive / Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
              Dispatch Directive / Administrative Note
            </label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Bulk work order authorized by municipal control room. High-density cluster priority."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedComplaints.length === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>
                Assign {selectedComplaints.length}{' '}
                {selectedComplaints.length === 1 ? 'Issue' : 'Issues'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. Bulk Status Update Modal
interface BulkStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedComplaints: Complaint[];
  onComplete: () => void;
}

export const BulkStatusModal: React.FC<BulkStatusModalProps> = ({
  isOpen,
  onClose,
  selectedComplaints,
  onComplete,
}) => {
  const { bulkUpdateStatus } = useApp();
  const [targetStatus, setTargetStatus] = useState<ComplaintStatus>('in_progress');
  const [resolutionDetails, setResolutionDetails] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [showIdsList, setShowIdsList] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setTargetStatus('in_progress');
      setResolutionDetails(
        'Remediation verified by municipal inspection supervisor and field team.'
      );
      setAdminNotes('');
      setShowIdsList(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedComplaints.length === 0) return;
    setIsSubmitting(true);

    const ids = selectedComplaints.map((c) => c.id);
    bulkUpdateStatus(
      ids,
      targetStatus,
      adminNotes.trim() || undefined,
      targetStatus === 'resolved' ? resolutionDetails.trim() || undefined : undefined
    );

    setIsSubmitting(false);
    onComplete();
    onClose();
  };

  const statusOptions: {
    status: ComplaintStatus;
    title: string;
    description: string;
  }[] = [
    {
      status: 'submitted',
      title: 'Submitted (Intake)',
      description: 'Reset status to intake queue awaiting preliminary triage.',
    },
    {
      status: 'assigned',
      title: 'Assigned',
      description: 'Mark issues as queued with designated municipal department.',
    },
    {
      status: 'in_progress',
      title: 'In Progress (Field Deployed)',
      description: 'Field crews dispatched on-site for investigation & active repair.',
    },
    {
      status: 'resolved',
      title: 'Resolved & Closed',
      description: 'Field remediation verified complete and citizen notified.',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-status-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="bulk-status-title"
                className="text-sm font-bold text-slate-900 tracking-tight"
              >
                Bulk Status Update
              </h3>
              <p className="text-xs text-slate-500">
                Batch transition {selectedComplaints.length}{' '}
                {selectedComplaints.length === 1 ? 'record' : 'records'} along the
                remediation lifecycle
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Affected Complaints Preview Pill Bar */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Selected Records ({selectedComplaints.length})
              </span>
              <button
                type="button"
                onClick={() => setShowIdsList(!showIdsList)}
                className="text-blue-600 hover:text-blue-800 text-[11px] font-medium font-mono"
              >
                {showIdsList ? 'Hide details' : 'View records'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-0.5">
              {selectedComplaints.map((c) => (
                <span
                  key={c.id}
                  className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[11px] font-medium shadow-2xs"
                >
                  {c.id}
                </span>
              ))}
            </div>

            {showIdsList && (
              <div className="pt-2 border-t border-slate-200/70 space-y-1.5 max-h-36 overflow-y-auto text-[11px]">
                {selectedComplaints.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between text-slate-600 py-0.5"
                  >
                    <span className="font-mono font-semibold text-slate-900 truncate max-w-[80px]">
                      {c.id}
                    </span>
                    <span className="truncate max-w-[200px] text-slate-700">
                      {c.title}
                    </span>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Choice Radio Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
              Select New Lifecycle Status <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {statusOptions.map((opt) => {
                const isSelected = targetStatus === opt.status;
                return (
                  <button
                    key={opt.status}
                    type="button"
                    onClick={() => setTargetStatus(opt.status)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <StatusBadge status={opt.status} size="sm" />
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 font-bold" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Resolution Details if 'resolved' */}
          {targetStatus === 'resolved' && (
            <div className="space-y-1.5 p-3.5 bg-emerald-50/50 border border-emerald-200/70 rounded-xl animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-emerald-900 font-mono uppercase tracking-wider">
                Resolution & Verification Details <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={resolutionDetails}
                onChange={(e) => setResolutionDetails(e.target.value)}
                placeholder="e.g. Field repair completed; photo evidence verified on municipal inspection console."
                className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder:text-slate-400 resize-none"
              />
              <p className="text-[10px] text-emerald-700">
                This verification summary will be permanently logged in each
                complaint's timeline and visible to citizens.
              </p>
            </div>
          )}

          {/* Administrative Note */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
              Batch Audit Remark
            </label>
            <input
              type="text"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Status advanced following morning dispatch briefing"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedComplaints.length === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-black rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                Update {selectedComplaints.length}{' '}
                {selectedComplaints.length === 1 ? 'Record' : 'Records'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 3. Bulk Priority Modal
interface BulkPriorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedComplaints: Complaint[];
  onComplete: () => void;
}

export const BulkPriorityModal: React.FC<BulkPriorityModalProps> = ({
  isOpen,
  onClose,
  selectedComplaints,
  onComplete,
}) => {
  const { bulkUpdatePriority } = useApp();
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedComplaints.length === 0) return;
    setIsSubmitting(true);

    const ids = selectedComplaints.map((c) => c.id);
    bulkUpdatePriority(ids, priority, notes.trim() || undefined);

    setIsSubmitting(false);
    onComplete();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-priority-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="bulk-priority-title"
                className="text-sm font-bold text-slate-900 tracking-tight"
              >
                Bulk Priority Urgency
              </h3>
              <p className="text-xs text-slate-500">
                Escalate or adjust urgency for {selectedComplaints.length} selected{' '}
                {selectedComplaints.length === 1 ? 'issue' : 'issues'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
              Target Priority Level <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['High', 'Medium', 'Low'] as PriorityLevel[]).map((p) => {
                const isSelected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <PriorityBadge priority={p} size="md" />
                    <span className="text-[10px] text-slate-500 font-mono">
                      {p === 'High' ? '24h SLA' : p === 'Medium' ? '48h SLA' : '72h SLA'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
              Reason / Justification
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Inclement weather advisory or safety hazard"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedComplaints.length === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-black rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Apply {priority} Priority</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 4. Bulk Ratify AI Recommendations Modal
interface BulkRatifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedComplaints: Complaint[];
  onComplete: () => void;
}

export const BulkRatifyModal: React.FC<BulkRatifyModalProps> = ({
  isOpen,
  onClose,
  selectedComplaints,
  onComplete,
}) => {
  const { bulkRatifyAIRecommendations } = useApp();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setIsSubmitting(true);
    const ids = selectedComplaints.map((c) => c.id);
    bulkRatifyAIRecommendations(ids);
    setIsSubmitting(false);
    onComplete();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-ratify-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="bulk-ratify-title"
                className="text-sm font-bold text-slate-900 tracking-tight"
              >
                Ratify AI Recommendations
              </h3>
              <p className="text-xs text-slate-500">
                Human-in-the-loop batch authorization
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            You are about to formally ratify the automated AI triage
            recommendations (Department, Category, and Urgency) for{' '}
            <strong className="text-slate-900 font-semibold font-mono">
              {selectedComplaints.length}
            </strong>{' '}
            selected complaints and transition their status to{' '}
            <strong className="text-blue-700 font-semibold">Assigned</strong>.
          </p>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5 text-[11px]">
            {selectedComplaints.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between text-slate-700 py-0.5"
              >
                <span className="font-mono font-bold text-slate-900">
                  {c.id}
                </span>
                <span className="text-slate-500 truncate max-w-[140px]">
                  {c.aiDepartment || c.department}
                </span>
                <PriorityBadge
                  priority={c.aiPriority || c.priority}
                  size="sm"
                  isAI={true}
                />
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || selectedComplaints.length === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Ratify AI for {selectedComplaints.length}{' '}
                {selectedComplaints.length === 1 ? 'Issue' : 'Issues'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
