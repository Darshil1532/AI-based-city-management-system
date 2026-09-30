import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { AIAnalysisPanel } from '../../components/ai/AIAnalysisPanel';
import { SmartCityMap } from '../../components/maps/SmartCityMap';
import {
  CheckCircle2,
  Copy,
  Check,
  Search,
  ArrowRight,
  MapPin,
  Clock,
  Layers,
  FileText,
  Shield,
} from 'lucide-react';

export const ComplaintConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getComplaintForCitizen, getComplaintById, currentUser, loginAs } = useApp();

  const [copied, setCopied] = useState(false);

  const isCitizen = currentUser.role === 'citizen';
  const complaint = id
    ? (isCitizen ? getComplaintForCitizen(id, currentUser.id) : getComplaintById(id))
    : undefined;

  const isRestrictedByPrivacy = Boolean(id && isCitizen && !complaint && getComplaintById(id));

  const handleCopyId = () => {
    if (!complaint) return;
    navigator.clipboard.writeText(complaint.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isRestrictedByPrivacy) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-8 text-center space-y-3.5 shadow-2xs">
          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto border border-amber-300">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-amber-950">
            Access Restricted: Citizen Privacy Protection
          </h2>
          <p className="text-xs text-amber-900 leading-relaxed">
            Incident docket <strong>"{id}"</strong> is registered under a different citizen account. To safeguard citizen privacy and data security, citizens may only view complaints registered under their own profile.
          </p>
          <div className="pt-2 text-[11px] text-amber-800 font-mono bg-white/80 py-1.5 px-3 rounded-lg border border-amber-200 inline-block">
            Active Citizen Profile: <strong>{currentUser.name}</strong> ({currentUser.id})
          </div>
          <div className="pt-2">
            <Link
              to="/citizen/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
            >
              Return to Citizen Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Complaint Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested complaint identifier "{id}" was not found in city records.
        </p>
        <Link
          to="/citizen/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
        >
          Return to Citizen Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Success Banner */}
      <div className="clay-card rounded-3xl p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl clay-metric-icon bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1 font-mono">
            Registration Confirmed
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Complaint Successfully Submitted
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mt-1 font-medium">
            Your complaint has been logged in the Smart City management registry and processed through the AI decision-support module.
          </p>
        </div>

        {/* Big ID Card with Copy */}
        <div className="inline-flex flex-col sm:flex-row items-center gap-4 clay-inset px-6 py-4 rounded-2xl">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">
              Unique Complaint Tracking ID
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black text-indigo-600 tracking-tight">
              {complaint.id}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyId}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl clay-btn clay-btn-secondary text-slate-700 text-xs font-semibold cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy ID</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Nav actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to={`/track?id=${complaint.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl clay-btn clay-btn-primary text-xs font-bold cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Track Progress Timeline</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              loginAs('admin');
              navigate(`/admin/complaint/${complaint.id}`);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl clay-btn clay-btn-secondary text-slate-700 text-xs font-bold cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Review as Administrator</span>
          </button>
        </div>
      </div>

      {/* Complaint Summary Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 clay-card rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
            Category
          </span>
          <span className="text-xs font-bold text-slate-900 block">
            {complaint.category}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Citizen reported</span>
        </div>

        <div className="p-4 clay-card rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
            Current Status
          </span>
          <StatusBadge status={complaint.status} size="sm" />
          <span className="text-[10px] text-slate-500 block mt-1 font-medium">
            Awaiting administrative review
          </span>
        </div>

        <div className="p-4 clay-card rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
            Submitted Time
          </span>
          <span className="text-xs font-bold text-slate-900 block font-mono">
            {new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {new Date(complaint.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="p-4 clay-card rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
            Geographic Location
          </span>
          <span className="text-xs font-bold text-slate-900 block truncate">
            {complaint.location?.landmark || complaint.location?.address || 'Municipal Zone'}
          </span>
          <span className="font-mono text-[10px] text-slate-500">
            {complaint.location?.latitude != null && complaint.location?.longitude != null
              ? `${complaint.location.latitude.toFixed(4)}°N, ${Math.abs(complaint.location.longitude).toFixed(4)}°E`
              : 'Registered on municipal file'}
          </span>
        </div>
      </div>

      {/* AI Decision Support Panel (Mandatory Section 4) */}
      <div>
        <div className="mb-2">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            AI Automated Decision-Support Analysis
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Initial assessment performed by the SmartCity AI engine for administrative triage
          </p>
        </div>
        <AIAnalysisPanel complaint={complaint} />
      </div>

      {/* Map Location & Photo Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="clay-card rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            <span>Complaint Location on City Map</span>
          </div>
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
              height="h-56"
              showFilterControls={false}
            />
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Address: {complaint.location?.address || 'Recorded on municipal file'}
          </p>
        </div>

        <div className="clay-card rounded-3xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Reported Description & Evidence</span>
            </div>
            <p className="text-xs text-slate-700 clay-inset p-4 rounded-2xl italic leading-relaxed font-medium">
              "{complaint.description}"
            </p>
          </div>

          {complaint.image && (
            <div className="mt-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
                Attached Photo Evidence:
              </span>
              <div className="h-32 rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                <img
                  src={complaint.image}
                  alt="Complaint attachment"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
