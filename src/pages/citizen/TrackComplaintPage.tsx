import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { SmartCityMap } from '../../components/maps/SmartCityMap';
import { AIDecisionDisclaimer } from '../../components/common/AIDecisionDisclaimer';
import { ComplaintStatus } from '../../types';
import {
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const TrackComplaintPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getComplaintForCitizen, getComplaintById, currentUser, complaints } = useApp();

  const isCitizen = currentUser.role === 'citizen';
  const queryId = searchParams.get('id') || (complaints.length > 0 ? complaints[0].id : 'SC1024');
  const [inputId, setInputId] = useState(queryId);
  const [searchedId, setSearchedId] = useState(queryId);

  useEffect(() => {
    if (searchParams.get('id')) {
      setInputId(searchParams.get('id')!);
      setSearchedId(searchParams.get('id')!);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = inputId.trim().toUpperCase();
    if (!formatted) return;
    setSearchedId(formatted);
    setSearchParams({ id: formatted });
  };

  // Enforce privacy: Citizen only retrieves complaint if owned by currentUser.id
  const complaint = isCitizen
    ? getComplaintForCitizen(searchedId, currentUser.id)
    : getComplaintById(searchedId);

  // Check if complaint exists in database but is restricted by citizen privacy
  const isRestrictedByPrivacy = isCitizen && !complaint && Boolean(getComplaintById(searchedId));

  // Status timeline steps
  const steps: { key: ComplaintStatus; label: string; desc: string }[] = [
    { key: 'submitted', label: 'Submitted', desc: 'Complaint registered & AI analyzed' },
    { key: 'assigned', label: 'Assigned', desc: 'Admin confirmed & department assigned' },
    { key: 'in_progress', label: 'In Progress', desc: 'Municipal field crew deployed' },
    { key: 'resolved', label: 'Resolved', desc: 'Action completed & verified' },
  ];

  const getStepStatus = (stepKey: ComplaintStatus, currentStatus: ComplaintStatus) => {
    const order: ComplaintStatus[] = ['submitted', 'assigned', 'in_progress', 'resolved'];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header & Search */}
      <div className="clay-card rounded-3xl p-6 sm:p-8 space-y-5">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
            CIVIC RESOLUTION AUDIT
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Track Incident Status
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter your unique complaint reference number (e.g. SC1024) to follow real-time administrative progress.
          </p>
        </div>

        {/* Search input */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="Enter Complaint ID (e.g., SC1024)"
              className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm clay-inset rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono text-slate-900 transition-all font-semibold"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 clay-btn clay-btn-primary text-xs font-bold rounded-2xl transition-all shrink-0 cursor-pointer"
          >
            Track Incident
          </button>
        </form>

        {/* Quick sample complaint links */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
          <span className="font-semibold text-slate-400 font-mono text-[11px]">Quick Samples:</span>
          {complaints.slice(0, 5).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setInputId(c.id);
                setSearchedId(c.id);
                setSearchParams({ id: c.id });
              }}
              className={`font-mono px-3 py-1 rounded-xl text-[11px] transition-all cursor-pointer font-bold ${
                searchedId === c.id
                  ? 'clay-btn clay-btn-primary text-white shadow-xs'
                  : 'clay-btn clay-btn-secondary text-slate-700'
              }`}
            >
              {c.id}
            </button>
          ))}
        </div>
      </div>

      {complaint ? (
        <div className="space-y-6">
          {/* Visual Step Timeline */}
          <div className="clay-card rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Lifecycle Progress
                </span>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Incident Docket: <span className="text-indigo-600 font-mono">{complaint.id}</span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={complaint.aiPriority} size="sm" isAI={true} />
                <PriorityBadge priority={complaint.finalPriority || (complaint.reviewDecision === 'pending' ? 'Pending Review' : complaint.priority)} size="sm" />
                <StatusBadge status={complaint.status} size="sm" />
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="relative py-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                {steps.map((step, idx) => {
                  const state = getStepStatus(step.key, complaint.status);
                  return (
                    <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                      {/* Step Circle Icon */}
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs transition-all mb-3 ${
                          state === 'completed'
                            ? 'clay-metric-icon bg-emerald-500 text-white shadow-md'
                            : state === 'current'
                            ? 'clay-btn-primary text-white shadow-md ring-4 ring-indigo-200/60'
                            : 'clay-inset bg-slate-100 text-slate-400'
                        }`}
                      >
                        {state === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : state === 'current' ? (
                          <Clock className="w-5 h-5 text-white animate-pulse" />
                        ) : (
                          <span className="font-mono text-xs">{idx + 1}</span>
                        )}
                      </div>

                      <span
                        className={`text-xs font-bold tracking-tight block ${
                          state === 'completed'
                            ? 'text-emerald-700'
                            : state === 'current'
                            ? 'text-slate-900'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Latest Update Box */}
            <div className="p-4.5 rounded-2xl clay-inset flex items-start gap-3.5 text-xs">
              <div className="p-2.5 clay-metric-icon bg-indigo-50 text-indigo-700 rounded-xl shrink-0 mt-0.5 shadow-xs">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">
                    Latest Operational Status Update
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(complaint.updatedAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-xs font-medium">
                  {complaint.adminNotes ||
                    (complaint.status === 'submitted'
                      ? 'Report logged into the civic intake database. AI classification model has generated priority recommendations awaiting operations supervisor review.'
                      : complaint.status === 'assigned'
                      ? `Administrative confirmation executed. Dispatched to ${complaint.department}.`
                      : complaint.status === 'in_progress'
                      ? 'Field crew deployed on site with repair machinery.'
                      : complaint.resolutionDetails || 'Issue successfully rectified and closed.')}
                </p>
              </div>
            </div>

            {/* Resolution Details (if resolved) */}
            {complaint.resolutionDetails && (
              <div className="p-4 rounded-2xl clay-card bg-emerald-50/90 text-xs text-emerald-950 space-y-1">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Verified Resolution Report
                </span>
                <p className="text-emerald-800 leading-relaxed text-xs">
                  {complaint.resolutionDetails}
                </p>
              </div>
            )}
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Complaint Metadata */}
            <div className="clay-card rounded-3xl p-6 sm:p-7 space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Incident Specification
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] font-mono mb-1 font-semibold">Reported Details:</span>
                  <p className="text-slate-800 font-medium leading-relaxed clay-inset p-4 rounded-2xl">
                    "{complaint.description}"
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/60">
                  <div className="clay-inset p-3 rounded-2xl text-center">
                    <span className="text-slate-400 block text-[10px] font-mono uppercase font-bold">1. Reported</span>
                    <span className="font-extrabold text-slate-800 text-xs mt-1 block">{complaint.severity}</span>
                  </div>
                  <div className="clay-inset bg-indigo-50/60 p-3 rounded-2xl text-center">
                    <span className="text-indigo-600 block text-[10px] font-mono uppercase font-bold">2. AI Priority</span>
                    <span className="font-extrabold text-indigo-950 text-xs mt-1 block">
                      {complaint.aiPriority}
                      {complaint.aiConfidence ? ` (${Math.round(complaint.aiConfidence * 100)}%)` : ''}
                    </span>
                  </div>
                  <div className="clay-inset bg-amber-50/60 p-3 rounded-2xl text-center">
                    <span className="text-amber-700 block text-[10px] font-mono uppercase font-bold">3. Admin Final</span>
                    <span className="font-extrabold text-slate-900 text-xs mt-1 block">
                      {complaint.finalPriority || (complaint.reviewDecision === 'pending' ? 'Pending' : (complaint.priority || 'Unassigned'))}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 block text-[11px] font-mono font-semibold">Assigned Agency:</span>
                  <div className="flex items-center gap-2 font-bold text-slate-900 mt-1">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>{complaint.assignedDepartment || complaint.department || (complaint.reviewDecision === 'pending' ? 'Pending Human Assignment' : 'Unassigned')}</span>
                  </div>
                  {complaint.assignedOfficer && (
                    <span className="text-[11px] text-slate-500 block mt-1 font-mono">
                      Officer: {complaint.assignedOfficer}
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 block text-[11px] font-mono font-semibold">Geographic Site:</span>
                  <span className="font-semibold text-slate-800 block mt-1">
                    {complaint.location?.landmark || complaint.location?.address || 'Municipal Zone'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    {complaint.location?.latitude != null && complaint.location?.longitude != null
                      ? `${complaint.location.latitude.toFixed(4)}° N, ${Math.abs(complaint.location.longitude).toFixed(4)}° E`
                      : 'Location logged on municipal file'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Map Pin & Event History */}
            <div className="clay-card rounded-3xl p-6 sm:p-7 space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
                <span>Location Confirmation</span>
                <span className="text-[10px] text-slate-500 font-mono">GIS Verified</span>
              </h3>

              <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-md">
                <SmartCityMap
                  singleMarker={
                    complaint.location?.latitude != null && complaint.location?.longitude != null
                      ? {
                          latitude: complaint.location.latitude,
                          longitude: complaint.location.longitude,
                          title: complaint.title,
                          category: complaint.category,
                        }
                      : undefined
                  }
                  height="h-48"
                  showFilterControls={false}
                />
              </div>

              {/* Action Log History */}
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[11px] font-bold text-slate-700 block mb-2 font-mono">
                  Official Event Log
                </span>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {complaint.timeline.map((ev, i) => (
                    <div key={i} className="text-[11px] p-3 clay-inset rounded-2xl">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{ev.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal font-mono">
                          {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1 leading-relaxed font-medium">{ev.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Governance Advisory */}
          <AIDecisionDisclaimer />
        </div>
      ) : isRestrictedByPrivacy ? (
        <div className="clay-card rounded-3xl p-8 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-14 h-14 clay-metric-icon bg-amber-100/90 text-amber-800 rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Access Restricted: Citizen Privacy Protection
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Incident docket <strong>"{searchedId}"</strong> is registered under a different citizen account. To safeguard citizen privacy and data security, citizens may only view complaints registered under their own profile.
          </p>
          <div className="pt-2 text-[11px] text-amber-900 font-mono clay-badge clay-badge-amber py-1.5 px-3.5 rounded-xl inline-block">
            Active Citizen Profile: <strong>{currentUser.name}</strong> ({currentUser.id})
          </div>
        </div>
      ) : (
        <div className="clay-card rounded-3xl p-8 text-center space-y-3.5 max-w-md mx-auto">
          <div className="w-12 h-12 clay-metric-icon bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            No Incident Record Found for "{searchedId}"
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            Please check the complaint ID for typos or select one of your registered complaints above.
          </p>
        </div>
      )}
    </div>
  );
};
