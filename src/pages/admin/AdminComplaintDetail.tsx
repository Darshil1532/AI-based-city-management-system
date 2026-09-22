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
    complaint?.assignedOfficer || 'Inspector J. Martinez (Unit 4)'
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
      setAssignedOfficer(complaint.assignedOfficer || 'Inspector J. Martinez (Unit 4)');
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

  // Step 14 & 15: Record Resolution & Resolve
  const handleResolveWithReport = (customText?: string) => {
    const textToSave =
      customText ||
      resolutionDetails ||
      'Municipal maintenance and structural repairs completed. Inspected and verified on site by administrative supervisor.';
    setResolutionDetails(textToSave);
    setSelectedStatus('resolved');
    resolveComplaint(complaint.id, textToSave);
    setIsSaved(true);
    setSaveMessage('Resolution recorded and complaint marked officially Resolved.');
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Quick Mark as Resolved action
  const handleQuickResolve = () => {
    handleResolveWithReport();
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
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Decision Support Lifecycle Stepper
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              Active Stage:{' '}
              <span className="capitalize text-blue-600 font-mono">
                {complaint.status.replace('_', ' ')}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
            <span>Human-in-the-loop:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Admin Discretion Enforced
            </span>
          </div>
        </div>

        {/* Status Stepper Progression */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div
            className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
              complaint.status === 'submitted'
                ? 'border-blue-600 bg-blue-50/40 text-blue-900 font-bold'
                : 'border-slate-200 bg-slate-50/50 text-slate-600'
            }`}
          >
            <span className="text-[10px] font-mono uppercase text-slate-400">1. Intake & AI</span>
            <span className="mt-1">Submitted</span>
          </div>

          <div
            className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
              complaint.status === 'assigned'
                ? 'border-blue-600 bg-blue-50/40 text-blue-900 font-bold'
                : complaint.status === 'in_progress' || complaint.status === 'resolved'
                ? 'border-emerald-200 bg-emerald-50/30 text-emerald-800'
                : 'border-slate-200 bg-slate-50/50 text-slate-400'
            }`}
          >
            <span className="text-[10px] font-mono uppercase text-slate-400">2. Admin Review</span>
            <span className="mt-1">Assigned</span>
          </div>

          <div
            className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
              complaint.status === 'in_progress'
                ? 'border-amber-600 bg-amber-50/40 text-amber-900 font-bold'
                : complaint.status === 'resolved'
                ? 'border-emerald-200 bg-emerald-50/30 text-emerald-800'
                : 'border-slate-200 bg-slate-50/50 text-slate-400'
            }`}
          >
            <span className="text-[10px] font-mono uppercase text-slate-400">3. Field Operations</span>
            <span className="mt-1">In Progress</span>
          </div>

          <div
            className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
              complaint.status === 'resolved'
                ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold'
                : 'border-slate-200 bg-slate-50/50 text-slate-400'
            }`}
          >
            <span className="text-[10px] font-mono uppercase text-slate-400">4. Verification</span>
            <span className="mt-1">Resolved</span>
          </div>
        </div>

        {/* Contextual Action Prompt based on current lifecycle stage */}
        {complaint.status === 'submitted' && (
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                AI Recommendation Pending Administrative Review
              </span>
              <p className="text-xs text-blue-800">
                Recommended: <strong>{complaint.aiCategory || complaint.category}</strong> • Priority: <strong>{complaint.aiPriority || complaint.priority}</strong> • Department: <strong>{complaint.aiDepartment || complaint.department}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRatifyRecommendation}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ratify AI Recommendation</span>
              </button>
              <button
                type="button"
                onClick={handleOverrideAndAssign}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Override & Manually Assign</span>
              </button>
            </div>
          </div>
        )}

        {complaint.status === 'assigned' && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-700" />
                Assigned to {complaint.department}
              </span>
              <p className="text-xs text-slate-600">
                Work order created. Ready for field crew mobilization.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeployCrew}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              <span>Deploy Field Crew & Mark In Progress (Step 13)</span>
            </button>
          </div>
        )}

        {complaint.status === 'in_progress' && (
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Field Operations Active On-Site
                </span>
                <p className="text-xs text-amber-800 mt-0.5">
                  Assigned unit is currently executing repairs. Record physical inspection report to mark Resolved.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={resolutionDetails}
                onChange={(e) => setResolutionDetails(e.target.value)}
                placeholder="Enter resolution verification details (e.g. Pothole filled and sealed)..."
                className="flex-1 text-xs px-3 py-2 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium text-slate-800"
              />
              <button
                type="button"
                onClick={() => handleResolveWithReport()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Record Resolution & Mark Resolved (Step 14 & 15)</span>
              </button>
            </div>
          </div>
        )}

        {complaint.status === 'resolved' && (
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Municipal Complaint Successfully Resolved & Verified
              </span>
              <p className="text-xs text-emerald-800">
                Resolution recorded: "{complaint.resolutionDetails || 'Repairs completed and passed municipal quality inspection.'}"
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 whitespace-nowrap">
              CLOSED & ARCHIVED
            </span>
          </div>
        )}
      </div>

      {/* Core Grid: Left Details & Right Administrative Decision Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Submitted Data + AI Analysis + Map */}
        <div className="lg:col-span-7 space-y-5">
          {/* Complaint Description & Metadata */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                Submitted Issue Dossier
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Logged: {new Date(complaint.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
                Citizen Narrative
              </span>
              <p className="text-xs text-slate-800 bg-slate-50/70 p-3 rounded-lg border border-slate-100 leading-relaxed font-normal">
                "{complaint.description}"
              </p>
            </div>

            {/* Citizen info and reported parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div>
                <span className="text-slate-400 block text-[10px] font-mono uppercase">Category</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{complaint.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-mono uppercase">Citizen Severity</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{complaint.severity}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-mono uppercase">Reporter</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {complaint.citizenName || 'Anonymous Citizen'}
                </span>
              </div>
            </div>

            {/* Attached Photo Evidence */}
            {complaint.image && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
                  Photographic Evidence
                </span>
                <div className="h-44 rounded-lg overflow-hidden border border-slate-200/80">
                  <img
                    src={complaint.image}
                    alt="Complaint photo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* AI Decision Support Panel */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                AI Decision-Support Recommendation
              </h3>
              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono border border-slate-200">
                Model: SmartCity-L1
              </span>
            </div>
            <AIAnalysisPanel complaint={complaint} showAdminActionHint={false} />
          </div>

          {/* Geographic Location & Map */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                <MapPin className="w-3.5 h-3.5 text-slate-600" />
                Geographic Verification
              </span>
              <code className="text-[10px] font-mono text-slate-500">
                {complaint.location.latitude.toFixed(4)}° N, {Math.abs(complaint.location.longitude).toFixed(4)}° E
              </code>
            </div>

            <SmartCityMap
              singleMarker={{
                latitude: complaint.location.latitude,
                longitude: complaint.location.longitude,
                title: complaint.title,
                category: complaint.category,
              }}
              height="h-52"
              showFilterControls={false}
            />

            <div className="text-xs text-slate-600 space-y-0.5">
              <span className="font-semibold text-slate-900">Address: </span>
              <span>{complaint.location.address}</span>
              {complaint.location.landmark && (
                <div className="text-[11px] text-slate-500 font-mono">
                  Landmark reference: {complaint.location.landmark}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Administrator Decision & Dispatch Form */}
        <div className="lg:col-span-5 space-y-5">
          <form
            onSubmit={handleSaveDecision}
            className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4"
          >
            {/* Header */}
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-2xs">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight font-mono uppercase">
                      Administrative Decision Authority
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Human supervisor review & validation
                    </span>
                  </div>
                </div>
                {hasOverrides ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    Overrides Active
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Matches AI
                  </span>
                )}
              </div>
            </div>

            {/* AI vs Administrative Decision Comparison Box */}
            <div className={`p-3 rounded-xl border text-xs space-y-2 ${hasOverrides ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50/80 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 font-mono text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  AI Recommendation vs. Administrative Decision
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {hasOverrides ? 'Human Discretion Applied' : 'Full Alignment'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-white border border-slate-200/80">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Priority</span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">AI: <strong>{complaint.aiPriority}</strong></span>
                    <span className={isPriorityOverridden ? 'text-amber-700 font-bold' : 'text-slate-700'}>
                      Admin: <strong>{selectedPriority}</strong>
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-white border border-slate-200/80">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Department</span>
                  <div className="flex flex-col">
                    <span className="text-slate-500 truncate" title={complaint.aiDepartment}>AI: <strong>{complaint.aiDepartment}</strong></span>
                    <span className={`truncate ${isDepartmentOverridden ? 'text-amber-700 font-bold' : 'text-slate-700'}`} title={selectedDepartment}>
                      Admin: <strong>{selectedDepartment}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 1. Category Confirmation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  1. Final Category
                </label>
                {complaint.aiCategory && complaint.aiCategory !== selectedCategory && (
                  <span className="text-[10px] text-amber-600 font-mono font-medium">
                    (Overriding AI: {complaint.aiCategory})
                  </span>
                )}
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ComplaintCategory)}
                className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 font-semibold text-slate-800"
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  2. Priority Level (Administrative Final)
                </label>
                {complaint.aiPriority && complaint.aiPriority !== selectedPriority && (
                  <span className="text-[10px] text-amber-600 font-mono font-medium">
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
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      selectedPriority === pri
                        ? pri === 'High'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                          : pri === 'Medium'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                          : 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pri}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Department Assignment */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  3. Assign Department (Administrative Final)
                </label>
                {complaint.aiDepartment && complaint.aiDepartment !== selectedDepartment ? (
                  <span className="text-[10px] text-amber-600 font-mono font-medium">
                    (Overriding AI: {complaint.aiDepartment})
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">Jurisdiction</span>
                )}
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value as DepartmentName)}
                className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 font-semibold text-slate-800"
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
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                4. Assigned Officer / Contractor Unit
              </label>
              <input
                type="text"
                value={assignedOfficer}
                onChange={(e) => setAssignedOfficer(e.target.value)}
                placeholder="e.g. Inspector J. Martinez (Squad 4) / Apex Roadworks"
                className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            {/* 5. Estimated Resolution Time */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                5. Estimated Resolution Time
              </label>
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                {['Within 12 Hours', '24-48 Hours', '3-5 Business Days', '1-2 Weeks'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEstimatedResolutionTime(preset)}
                    className={`text-[10px] px-2 py-0.5 rounded font-medium border transition-colors cursor-pointer ${
                      estimatedResolutionTime === preset
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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
                className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            {/* 6. Resolution Status Lifecycle */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
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
                    className={`py-2 px-2.5 text-xs font-semibold rounded-lg border text-left transition-all cursor-pointer ${
                      selectedStatus === st.key
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 7. Administrative Notes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                7. Administrative Directives & Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Log internal instructions, field reports, work order numbers..."
                className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 leading-relaxed"
              />
            </div>

            {/* 8. Resolution Details (if marked resolved or in progress) */}
            {selectedStatus === 'resolved' && (
              <div className="p-3 bg-emerald-50/80 rounded-lg border border-emerald-200 space-y-1">
                <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider font-mono">
                  8. Resolution Verification Report / Summary
                </label>
                <textarea
                  value={resolutionDetails}
                  onChange={(e) => setResolutionDetails(e.target.value)}
                  rows={2}
                  placeholder="Summarize resolution action taken, completion timestamp, and verification inspector..."
                  className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-emerald-900"
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>Save Administrative Decision</span>
              </button>
            </div>
          </form>

          {/* Timeline of events */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Official Audit Timeline ({complaint.timeline.length} events)
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {complaint.timeline.map((item, idx) => (
                <div key={idx} className="text-xs p-2.5 bg-slate-50/80 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between font-bold text-slate-800 mb-0.5">
                    <span>{item.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal font-mono">
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
    </div>
  );
};
