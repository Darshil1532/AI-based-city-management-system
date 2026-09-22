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
  const { getComplaintById, loginAs } = useApp();

  const [copied, setCopied] = useState(false);

  const complaint = id ? getComplaintById(id) : undefined;

  const handleCopyId = () => {
    if (!complaint) return;
    navigator.clipboard.writeText(complaint.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div>
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mb-0.5">
            Registration Confirmed
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Complaint Successfully Submitted
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mt-1">
            Your complaint has been logged in the Smart City management registry and processed through the AI decision-support module.
          </p>
        </div>

        {/* Big ID Card with Copy */}
        <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-slate-50 border border-slate-200/80 px-5 py-3 rounded-xl shadow-xs">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Unique Complaint Tracking ID
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black text-blue-600 tracking-tight">
              {complaint.id}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span>Review as Administrator</span>
          </button>
        </div>
      </div>

      {/* Complaint Summary Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Category
          </span>
          <span className="text-xs font-bold text-slate-900 block">
            {complaint.category}
          </span>
          <span className="text-[10px] text-slate-500">Citizen reported</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Current Status
          </span>
          <StatusBadge status={complaint.status} size="sm" />
          <span className="text-[10px] text-slate-500 block mt-1">
            Awaiting administrative review
          </span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Submitted Time
          </span>
          <span className="text-xs font-bold text-slate-900 block">
            {new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] text-slate-500">
            {new Date(complaint.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Geographic Location
          </span>
          <span className="text-xs font-bold text-slate-900 block truncate">
            {complaint.location.landmark || complaint.location.address}
          </span>
          <span className="font-mono text-[10px] text-slate-500">
            {complaint.location.latitude.toFixed(4)}°N, {Math.abs(complaint.location.longitude).toFixed(4)}°E
          </span>
        </div>
      </div>

      {/* AI Decision Support Panel (Mandatory Section 4) */}
      <div>
        <div className="mb-2">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            AI Automated Decision-Support Analysis
          </h2>
          <p className="text-xs text-slate-500">
            Initial assessment performed by the SmartCity AI engine for administrative triage
          </p>
        </div>
        <AIAnalysisPanel complaint={complaint} />
      </div>

      {/* Map Location & Photo Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Complaint Location on City Map</span>
          </div>
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
          <p className="text-[11px] text-slate-500">
            Address: {complaint.location.address}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Reported Description & Evidence</span>
            </div>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 italic leading-relaxed">
              "{complaint.description}"
            </p>
          </div>

          {complaint.image && (
            <div className="mt-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Attached Photo Evidence:
              </span>
              <div className="h-32 rounded-lg overflow-hidden border border-slate-200">
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
