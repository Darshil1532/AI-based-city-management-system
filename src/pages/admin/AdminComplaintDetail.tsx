import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { AIAnalysisPanel } from '../../components/ai/AIAnalysisPanel';
import { SmartCityMap } from '../../components/maps/SmartCityMap';
import { AIDecisionDisclaimer } from '../../components/common/AIDecisionDisclaimer';
import {
  ComplaintCategory,
  PriorityLevel,
  ComplaintStatus,
  DepartmentName,
} from '../../types';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  Building2,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  Save,
  CheckCheck,
  UserCheck,
  MapPin,
  Calendar,
  Layers,
  Shield,
  Send,
  MessageSquare,
  X,
} from 'lucide-react';

const DEPARTMENT_LIST: DepartmentName[] = [
  'Public Works Department',
  'Sanitation Department',
  'Water Supply Department',
  'Electrical Department',
  'Traffic & Transit Department',
  'Urban Infrastructure Division',
];

const CATEGORY_LIST: ComplaintCategory[] = [
  'Pothole / Road',
  'Garbage / Waste',
  'Water Leakage',
  'Streetlight',
  'Traffic',
  'Infrastructure',
  'Other',
];

export const AdminComplaintDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getComplaintById,
    updateComplaint,
    resolveComplaint,
    ratifyAIRecommendation,
    overrideAIRecommendation,
    currentUser,
  } = useApp();

  const complaint = id ? getComplaintById(id) : undefined;

  // Editable administrator state
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory>(
    complaint?.finalCategory || complaint?.aiCategory || complaint?.category || 'Pothole / Road'
  );
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel>(
    complaint?.finalPriority || complaint?.aiPriority || complaint?.priority || 'High'
  );
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentName>(
    complaint?.assignedDepartment || complaint?.aiDepartment || complaint?.department || 'Public Works Department'
  );
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>(
    complaint?.status || 'submitted'
  );
  const [adminNotes, setAdminNotes] = useState(complaint?.adminNotes || '');
  const [assignedOfficer, setAssignedOfficer] = useState(
    complaint?.assignedOfficer || 'Demo Municipal Officer'
  );
  const [estimatedResolutionTime, setEstimatedResolutionTime] = useState<string>(
    complaint?.estimatedResolutionTime || '24-48 Hours'
  );
  const [resolutionDetails, setResolutionDetails] = useState(
    complaint?.resolutionDetails || ''
  );

  // Sync state whenever complaint updates in AppContext
  useEffect(() => {
    if (complaint) {
      setSelectedCategory(complaint.finalCategory || complaint.aiCategory || complaint.category);
      setSelectedPriority(complaint.finalPriority || complaint.aiPriority || complaint.priority || 'High');
      setSelectedDepartment(complaint.assignedDepartment || complaint.aiDepartment || complaint.department || 'Public Works Department');
      setSelectedStatus(complaint.status);
      setAdminNotes(complaint.adminNotes || '');
      setAssignedOfficer(complaint.assignedOfficer || 'Demo Municipal Officer');
      setEstimatedResolutionTime(complaint.estimatedResolutionTime || '24-48 Hours');
      setResolutionDetails(complaint.resolutionDetails || '');
    }
  }, [complaint?.status, complaint?.finalPriority, complaint?.priority, complaint?.assignedDepartment, complaint?.department, complaint?.finalCategory, complaint?.category, complaint?.updatedAt, complaint?.resolutionDetails]);

  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  if (!complaint) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Complaint Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested complaint identifier "{id}" does not exist.
        </p>
        <Link
          to="/admin/complaints"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
        >
          Return to Complaints Registry
        </Link>
      </div>
    );
  }

  const isPriorityOverridden = complaint.aiPriority && complaint.aiPriority !== selectedPriority;
  const isDepartmentOverridden = complaint.aiDepartment && complaint.aiDepartment !== selectedDepartment;
  const isCategoryOverridden = complaint.aiCategory && complaint.aiCategory !== selectedCategory;
  const hasOverrides = isPriorityOverridden || isDepartmentOverridden || isCategoryOverridden;

  // Handle Admin Save & Confirmation
  const handleSaveDecision = (e: React.FormEvent) => {
    e.preventDefault();

    updateComplaint(complaint.id, {
      finalCategory: selectedCategory,
      finalPriority: selectedPriority,
      assignedDepartment: selectedDepartment,
      category: selectedCategory,
      priority: selectedPriority,
      department: selectedDepartment,
      status: selectedStatus,
      adminNotes,
      assignedOfficer,
      estimatedResolutionTime,
      resolutionDetails: selectedStatus === 'resolved' ? resolutionDetails : complaint.resolutionDetails,
      reviewedBy: 'Demo Administrator',
      reviewedAt: new Date().toISOString(),
      reviewDecision: hasOverrides ? 'overridden' : 'ratified',
    });

    setIsSaved(true);
    setSaveMessage('Administrative validation and authoritative updates saved successfully.');
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Quick Ratify AI Recommendation action
  const handleRatifyRecommendation = () => {
    ratifyAIRecommendation(
      complaint.id,
      adminNotes || 'Administrator reviewed and ratified AI recommendations for department allocation.'
    );
    setIsSaved(true);
    setSaveMessage('Ratified AI recommendation & assigned department.');
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Quick Override & Manually Assign action
  const handleOverrideAndAssign = () => {
    overrideAIRecommendation(complaint.id, {
      category: selectedCategory,
      priority: selectedPriority,
      department: selectedDepartment,
      officer: assignedOfficer,
      notes: adminNotes || 'Administrator exercised human discretion and manually assigned complaint.',
    });
    setIsSaved(true);
    setSaveMessage('Administrative override recorded & assigned.');
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Step 13: Change to In Progress
  const handleDeployCrew = () => {
    setSelectedStatus('in_progress');
    updateComplaint(complaint.id, {
      status: 'in_progress',
      adminNotes: adminNotes || 'Field crew dispatched on site. Repair machinery deployed.',
    });
    setIsSaved(true);
    setSaveMessage('Field operations initiated. Complaint marked In Progress.');
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Resolution Verification Modal State (Phase 16)
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verifyResolutionDetails, setVerifyResolutionDetails] = useState('');
  const [verifyOfficer, setVerifyOfficer] = useState('');
  const [overrideRationale, setOverrideRationale] = useState('');
  const [verificationError, setVerificationError] = useState('');

  const openVerificationModal = () => {
    setVerifyResolutionDetails(
      resolutionDetails ||
        'Municipal repair completed on site. Field inspection passed civic engineering safety standards.'
    );
    setVerifyOfficer(assignedOfficer || currentUser.name);
    setOverrideRationale('');
    setVerificationError('');
    setIsVerificationModalOpen(true);
  };

  const handleConfirmVerification = () => {
    if (!verifyResolutionDetails.trim()) {
      setVerificationError('Resolution details are required to verify resolution.');
      return;
    }
    if (!verifyOfficer.trim()) {
      setVerificationError('Verifying municipal officer name is required.');
      return;
    }
    if (complaint.status === 'submitted' && !overrideRationale.trim()) {
      setVerificationError(
        'Administrative override rationale is required for direct resolution from "Submitted" status.'
      );
      return;
    }

    setResolutionDetails(verifyResolutionDetails);
    setSelectedStatus('resolved');
    resolveComplaint(
      complaint.id,
      verifyResolutionDetails,
      overrideRationale.trim() || undefined
    );
    setIsVerificationModalOpen(false);
    setIsSaved(true);
    setSaveMessage('Resolution verified and complaint marked officially Resolved.');
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Quick Mark as Resolved action opens verification modal
  const handleQuickResolve = () => {
    openVerificationModal();
  };

  // Keyboard triage shortcuts: 'r' for Ratify, 'd' for Deploy Crew, 'v' for Resolve
  useEffect(() => {
    const handleActionKey = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string }>;
      const key = customEvent.detail?.key;
      if (!key) return;

      if (key === 'r' && complaint.status === 'submitted') {
        handleRatifyRecommendation();
      } else if (key === 'd' && complaint.status !== 'resolved') {
        handleDeployCrew();
      } else if (key === 'v' && complaint.status !== 'resolved') {
        handleQuickResolve();
      } else if (key === 'backspace') {
        navigate('/admin/complaints');
      }
    };

    window.addEventListener('app:action-key', handleActionKey);
    return () => window.removeEventListener('app:action-key', handleActionKey);
  }, [complaint.status, handleRatifyRecommendation, handleDeployCrew, handleQuickResolve, navigate]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {complaint.id}
              </span>
              <StatusBadge status={complaint.status} size="sm" />
              <PriorityBadge priority={complaint.aiPriority} size="sm" isAI={true} />
              <PriorityBadge priority={complaint.finalPriority || (complaint.reviewDecision === 'pending' ? 'Pending Review' : complaint.priority)} size="sm" />
              {complaint.reviewDecision && (
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                    complaint.reviewDecision === 'ratified'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : complaint.reviewDecision === 'overridden'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}
                >
                  Decision: {complaint.reviewDecision}
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              {complaint.title}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {complaint.status !== 'resolved' && (
            <button
              type="button"
              onClick={handleQuickResolve}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Shortcut: Press 'v'"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark as Resolved</span>
              <kbd className="hidden sm:inline-flex px-1 py-0.2 text-[9px] font-mono font-bold bg-emerald-800/80 rounded border border-emerald-500/60 text-emerald-100">
                V
              </kbd>
            </button>
          )}
          {complaint.status === 'submitted' && (
            <>
              <button
                type="button"
                onClick={handleRatifyRecommendation}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Shortcut: Press 'r'"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ratify AI Recommendation</span>
                <kbd className="hidden sm:inline-flex px-1 py-0.2 text-[9px] font-mono font-bold bg-blue-800/80 rounded border border-blue-500/60 text-blue-100">
                  R
                </kbd>
              </button>
              <button
                type="button"
                onClick={handleOverrideAndAssign}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Override & Manually Assign</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Save Notification Toast */}
      {isSaved && (
        <div className="p-3 bg-emerald-50 border border-emerald-300/80 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{saveMessage}</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-mono">SYNCHRONIZED</span>
        </div>
      )}

      {/* Interactive 20-Step Municipal Lifecycle Stepper & Quick Action Card */}
      <div className="clay-card rounded-3xl p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-200/60 gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Decision Support Lifecycle Stepper
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              Active Stage:{' '}
              <span className="capitalize text-indigo-600 font-mono font-black">
                {complaint.status.replace('_', ' ')}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
            <span>Human-in-the-loop:</span>
            <span className="font-bold text-slate-800 clay-badge px-2.5 py-0.5 rounded-lg">
              Admin Discretion Enforced
            </span>
          </div>
        </div>

        {/* Status Stepper Progression */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
          <div
            className={`p-3.5 rounded-2xl text-xs flex flex-col justify-between transition-all ${
              complaint.status === 'submitted'
                ? 'clay-btn clay-btn-primary shadow-xs font-bold'
                : 'clay-inset bg-slate-50/70 text-slate-600'
            }`}
          >
            <span className="text-[10px] font-mono uppercase opacity-70">1. Intake & AI</span>
            <span className="mt-1 font-extrabold text-sm">Submitted</span>
          </div>

          <div
            className={`p-3.5 rounded-2xl text-xs flex flex-col justify-between transition-all ${
              complaint.status === 'assigned'
                ? 'clay-btn clay-btn-primary shadow-xs font-bold'
                : complaint.status === 'in_progress' || complaint.status === 'resolved'
                ? 'clay-badge-emerald text-emerald-950 font-bold'
                : 'clay-inset bg-slate-50/70 text-slate-400'
            }`}
          >
            <span className="text-[10px] font-mono uppercase opacity-70">2. Admin Review</span>
            <span className="mt-1 font-extrabold text-sm">Assigned</span>
          </div>

          <div
            className={`p-3.5 rounded-2xl text-xs flex flex-col justify-between transition-all ${
              complaint.status === 'in_progress'
                ? 'clay-badge-amber text-amber-950 font-bold shadow-xs'
                : complaint.status === 'resolved'
                ? 'clay-badge-emerald text-emerald-950 font-bold'
                : 'clay-inset bg-slate-50/70 text-slate-400'
            }`}
          >
            <span className="text-[10px] font-mono uppercase opacity-70">3. Field Operations</span>
            <span className="mt-1 font-extrabold text-sm">In Progress</span>
          </div>

          <div
            className={`p-3.5 rounded-2xl text-xs flex flex-col justify-between transition-all ${
              complaint.status === 'resolved'
                ? 'clay-badge-emerald text-emerald-950 font-bold shadow-xs'
                : 'clay-inset bg-slate-50/70 text-slate-400'
            }`}
          >
            <span className="text-[10px] font-mono uppercase opacity-70">4. Verification</span>
            <span className="mt-1 font-extrabold text-sm">Resolved</span>
          </div>
        </div>

        {/* Contextual Action Prompt based on current lifecycle stage */}
        {complaint.status === 'submitted' && (
          <div className="p-4.5 clay-inset bg-indigo-50/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                AI Recommendation Pending Administrative Review
              </span>
              <p className="text-xs text-indigo-900 font-medium">
                Recommended: <strong>{complaint.aiCategory || complaint.category}</strong> • Priority: <strong>{complaint.aiPriority || complaint.priority}</strong> • Department: <strong>{complaint.aiDepartment || complaint.department}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleRatifyRecommendation}
                className="px-4 py-2 clay-btn clay-btn-primary text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ratify AI Recommendation</span>
              </button>
              <button
                type="button"
                onClick={handleOverrideAndAssign}
                className="px-4 py-2 clay-btn clay-btn-secondary text-amber-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Override & Manually Assign</span>
              </button>
            </div>
          </div>
        )}

        {complaint.status === 'assigned' && (
          <div className="p-4.5 clay-inset rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5 font-mono">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Assigned to {complaint.department}
              </span>
              <p className="text-xs text-slate-600 font-medium">
                Work order created. Ready for field crew mobilization.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeployCrew}
              className="px-4 py-2 clay-btn clay-btn-primary text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              <span>Deploy Field Crew & Mark In Progress</span>
            </button>
          </div>
        )}

        {complaint.status === 'in_progress' && (
          <div className="p-4.5 clay-inset bg-amber-50/70 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5 font-mono">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Field Operations Active On-Site
                </span>
                <p className="text-xs text-amber-900 mt-0.5 font-medium">
                  Assigned unit is currently executing repairs. Record physical inspection report to mark Resolved.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <input
                type="text"
                value={resolutionDetails}
                onChange={(e) => setResolutionDetails(e.target.value)}
                placeholder="Enter resolution verification details (e.g. Pothole filled and sealed)..."
                className="flex-1 text-xs px-3.5 py-2.5 clay-inset rounded-xl font-medium text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => handleQuickResolve()}
                className="px-4 py-2.5 clay-btn clay-btn-primary text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Record Resolution & Mark Resolved</span>
              </button>
            </div>
          </div>
        )}

        {complaint.status === 'resolved' && (
          <div className="p-4.5 clay-inset bg-emerald-50/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Municipal Complaint Successfully Resolved & Verified
              </span>
              <p className="text-xs text-emerald-900 font-medium">
                Resolution recorded: "{complaint.resolutionDetails || 'Repairs completed and passed municipal quality inspection.'}"
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-xl clay-badge clay-badge-emerald whitespace-nowrap">
              CLOSED & ARCHIVED
            </span>
          </div>
        )}
      </div>

      {/* Core Grid: Left Details & Right Administrative Decision Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Submitted Data + AI Analysis + Map */}
        <div className="lg:col-span-7 space-y-6">
          {/* Complaint Description & Metadata */}
          <div className="clay-card rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100/80 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 font-mono">
                <div className="w-6 h-6 rounded-lg clay-inset flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-slate-700" />
                </div>
                Submitted Issue Dossier
              </span>
              <span className="text-[11px] text-slate-500 font-mono clay-badge px-2.5 py-0.5 rounded-lg">
                Logged: {new Date(complaint.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
                Citizen Narrative
              </span>
              <p className="text-xs text-slate-800 bg-slate-50/80 p-4 rounded-2xl clay-inset leading-relaxed font-normal">
                "{complaint.description}"
              </p>
            </div>

            {/* Citizen info and reported parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 rounded-2xl clay-inset bg-slate-50/50">
                <span className="text-slate-400 block text-[10px] font-mono uppercase font-bold">Category</span>
                <span className="font-bold text-slate-800 mt-1 block">{complaint.category}</span>
              </div>
              <div className="p-3 rounded-2xl clay-inset bg-slate-50/50">
                <span className="text-slate-400 block text-[10px] font-mono uppercase font-bold">Citizen Severity</span>
                <span className="font-bold text-slate-800 mt-1 block">{complaint.severity}</span>
              </div>
              <div className="p-3 rounded-2xl clay-inset bg-slate-50/50">
                <span className="text-slate-400 block text-[10px] font-mono uppercase font-bold">Reporter</span>
                <span className="font-bold text-slate-800 mt-1 block truncate">
                  {complaint.citizenName || 'Anonymous Citizen'}
                </span>
              </div>
            </div>

            {/* Attached Photo Evidence */}
            {complaint.image && (
              <div className="pt-2 border-t border-slate-100/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                  Photographic Evidence
                </span>
                <div className="h-52 rounded-2xl overflow-hidden clay-inset p-1 bg-slate-100/60">
                  <img
                    src={complaint.image}
                    alt="Complaint photo"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>

          {/* AI Decision Support Panel */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 font-mono">
                <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                AI Decision-Support Recommendation
              </h3>
              <span className="text-[10px] text-slate-600 clay-badge px-2.5 py-1 rounded-lg font-mono font-bold">
                Model: SmartCity-L1
              </span>
            </div>
            <AIAnalysisPanel complaint={complaint} showAdminActionHint={false} />
          </div>

          {/* Geographic Location & Map */}
          <div className="clay-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 font-mono">
                <div className="w-6 h-6 rounded-lg clay-inset flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                </div>
                Geographic Verification
              </span>
              <code className="text-[10px] font-mono font-bold text-slate-600 clay-badge px-2.5 py-1 rounded-lg">
                {complaint.location.latitude.toFixed(4)}° N, {Math.abs(complaint.location.longitude).toFixed(4)}° E
              </code>
            </div>

            <div className="rounded-2xl overflow-hidden clay-inset p-1 bg-slate-100/50">
              <SmartCityMap
                singleMarker={{
                  latitude: complaint.location.latitude,
                  longitude: complaint.location.longitude,
                  title: complaint.title,
                  category: complaint.category,
                }}
                height="h-56"
                showFilterControls={false}
              />
            </div>

            <div className="text-xs text-slate-600 space-y-1 p-3 rounded-2xl clay-inset bg-slate-50/50">
              <span className="font-bold text-slate-900">Address: </span>
              <span>{complaint.location.address}</span>
              {complaint.location.landmark && (
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Landmark reference: {complaint.location.landmark}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Administrator Decision & Dispatch Form */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleSaveDecision}
            className="clay-card rounded-3xl p-6 space-y-5"
          >
            {/* Header */}
            <div className="border-b border-slate-100/80 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                    <Shield className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight font-mono uppercase">
                      Administrative Authority
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Supervisor review & validation
                    </span>
                  </div>
                </div>
                {hasOverrides ? (
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl clay-badge clay-badge-amber">
                    Overrides Active
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl clay-badge clay-badge-emerald">
                    Matches AI
                  </span>
                )}
              </div>
            </div>

            {/* AI vs Administrative Decision Comparison Box */}
            <div className={`p-4 rounded-2xl text-xs space-y-2.5 ${hasOverrides ? 'clay-badge-amber border border-amber-300/40' : 'clay-inset bg-slate-50/80'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 font-mono text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  AI Recommendation vs. Decision
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  {hasOverrides ? 'Discretion Applied' : 'Full Alignment'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl clay-card">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Priority</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 text-[10px]">AI: <strong className="text-slate-700">{complaint.aiPriority}</strong></span>
                    <span className={`text-xs ${isPriorityOverridden ? 'text-amber-700 font-bold' : 'text-slate-800 font-semibold'}`}>
                      Admin: {selectedPriority}
                    </span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl clay-card">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Department</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 text-[10px] truncate" title={complaint.aiDepartment}>AI: <strong className="text-slate-700">{complaint.aiDepartment}</strong></span>
                    <span className={`text-xs truncate ${isDepartmentOverridden ? 'text-amber-700 font-bold' : 'text-slate-800 font-semibold'}`} title={selectedDepartment}>
                      Admin: {selectedDepartment}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 1. Category Confirmation */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  1. Final Category
                </label>
                {complaint.aiCategory && complaint.aiCategory !== selectedCategory && (
                  <span className="text-[10px] text-amber-600 font-mono font-bold">
                    (Overriding AI: {complaint.aiCategory})
                  </span>
                )}
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ComplaintCategory)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50/80 rounded-xl clay-inset font-bold text-slate-800 focus:outline-none"
              >
                {CATEGORY_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Priority Confirmation */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  2. Priority Level (Administrative Final)
                </label>
                {complaint.aiPriority && complaint.aiPriority !== selectedPriority && (
                  <span className="text-[10px] text-amber-600 font-mono font-bold">
                    (Overriding AI: {complaint.aiPriority})
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['Low', 'Medium', 'High'] as PriorityLevel[]).map((pri) => (
                  <button
                    key={pri}
                    type="button"
                    onClick={() => setSelectedPriority(pri)}
                    className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      selectedPriority === pri
                        ? pri === 'High'
                          ? 'clay-btn clay-badge-rose text-rose-700 scale-102'
                          : pri === 'Medium'
                          ? 'clay-btn clay-badge-amber text-amber-800 scale-102'
                          : 'clay-btn clay-btn-primary text-white scale-102'
                        : 'clay-btn text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {pri}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Department Assignment */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  3. Assign Department (Administrative Final)
                </label>
                {complaint.aiDepartment && complaint.aiDepartment !== selectedDepartment ? (
                  <span className="text-[10px] text-amber-600 font-mono font-bold">
                    (Overriding AI: {complaint.aiDepartment})
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">Jurisdiction</span>
                )}
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value as DepartmentName)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50/80 rounded-xl clay-inset font-bold text-slate-800 focus:outline-none"
              >
                {DEPARTMENT_LIST.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Assigned Officer / Unit */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
                4. Assigned Officer / Contractor Unit
              </label>
              <input
                type="text"
                value={assignedOfficer}
                onChange={(e) => setAssignedOfficer(e.target.value)}
                placeholder="e.g. Demo Municipal Officer (Zone Operations) / PWD Squad"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50/80 rounded-xl clay-inset text-slate-800 focus:outline-none font-medium"
              />
            </div>

            {/* 5. Estimated Resolution Time */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
                5. Estimated Resolution Time
              </label>
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                {['Within 12 Hours', '24-48 Hours', '3-5 Business Days', '1-2 Weeks'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEstimatedResolutionTime(preset)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      estimatedResolutionTime === preset
                        ? 'clay-btn-blue text-white'
                        : 'clay-btn text-slate-600'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={estimatedResolutionTime}
                onChange={(e) => setEstimatedResolutionTime(e.target.value)}
                placeholder="e.g. 24-48 Hours or target date"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50/80 rounded-xl clay-inset text-slate-800 focus:outline-none font-medium"
              />
            </div>

            {/* 6. Resolution Status Lifecycle */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
                6. Resolution Status Lifecycle
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { key: 'submitted', label: 'Submitted' },
                    { key: 'assigned', label: 'Assigned' },
                    { key: 'in_progress', label: 'In Progress' },
                    { key: 'resolved', label: 'Resolved' },
                  ] as { key: ComplaintStatus; label: string }[]
                ).map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setSelectedStatus(st.key)}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl text-left transition-all cursor-pointer ${
                      selectedStatus === st.key
                        ? 'clay-btn clay-btn-primary text-white'
                        : 'clay-btn text-slate-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 7. Administrative Notes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
                7. Administrative Directives & Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Log internal instructions, field reports, work order numbers..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50/80 rounded-xl clay-inset text-slate-800 focus:outline-none leading-relaxed font-medium"
              />
            </div>

            {/* 8. Resolution Details (if marked resolved or in progress) */}
            {selectedStatus === 'resolved' && (
              <div className="p-4 bg-emerald-50/80 rounded-2xl clay-card border border-emerald-200/80 space-y-1.5">
                <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider font-mono">
                  8. Resolution Verification Report / Summary
                </label>
                <textarea
                  value={resolutionDetails}
                  onChange={(e) => setResolutionDetails(e.target.value)}
                  rows={2}
                  placeholder="Summarize resolution action taken, completion timestamp, and verification inspector..."
                  className="w-full px-3.5 py-2 text-xs bg-white rounded-xl clay-inset text-emerald-950 focus:outline-none"
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-5 clay-btn clay-btn-primary rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>Save Administrative Decision</span>
              </button>
            </div>
          </form>

          {/* Timeline of events */}
          <div className="clay-card rounded-3xl p-6 space-y-4">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 font-mono">
              <div className="w-6 h-6 rounded-lg clay-inset flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
              </div>
              Official Audit Timeline ({complaint.timeline.length} events)
            </h4>
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {complaint.timeline.map((item, idx) => (
                <div key={idx} className="text-xs p-3.5 rounded-2xl clay-inset bg-slate-50/80">
                  <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                    <span>{item.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Phase 16: Resolution & Verification Modal */}
      {isVerificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="clay-card rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 bg-white/95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl clay-badge clay-badge-emerald flex items-center justify-center">
                  <CheckCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Municipal Resolution Verification
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Complaint ID: {complaint.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVerificationModalOpen(false)}
                className="w-8 h-8 rounded-xl clay-btn flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {complaint.status === 'submitted' && (
              <div className="p-4 clay-badge-amber border border-amber-300/40 rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Administrative Fast-Track Override Required</span>
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Strict municipal lifecycle prohibits direct transition from <strong>Submitted</strong> to <strong>Resolved</strong> without recorded human administrative override rationale.
                </p>
                <div className="mt-2">
                  <label className="block text-[10px] font-bold text-amber-900 uppercase font-mono mb-1">
                    Override Rationale (Mandatory):
                  </label>
                  <textarea
                    value={overrideRationale}
                    onChange={(e) => setOverrideRationale(e.target.value)}
                    rows={2}
                    placeholder="Document why intermediate Assigned/In Progress stages were bypassed (e.g. Prior completed inspection)..."
                    className="w-full p-2.5 text-xs bg-white/90 rounded-xl clay-inset text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                  1. Resolution Details & Repairs Completed: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={verifyResolutionDetails}
                  onChange={(e) => setVerifyResolutionDetails(e.target.value)}
                  rows={3}
                  placeholder="Detail the physical repair or intervention completed on site..."
                  className="w-full p-3 text-xs bg-slate-50/80 rounded-xl clay-inset text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                  2. Verifying Municipal Officer / Inspector: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={verifyOfficer}
                  onChange={(e) => setVerifyOfficer(e.target.value)}
                  placeholder="Demo Municipal Officer / Ward Inspector"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50/80 rounded-xl clay-inset text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {verificationError && (
              <div className="p-3 clay-badge-rose border border-rose-300/40 rounded-xl text-xs text-rose-700 font-bold">
                {verificationError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsVerificationModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 clay-btn rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVerification}
                className="px-4 py-2.5 text-xs font-bold text-white clay-btn clay-btn-emerald rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Verify & Mark Resolved</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
