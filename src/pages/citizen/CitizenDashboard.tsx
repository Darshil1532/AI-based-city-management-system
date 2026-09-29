import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { AIDecisionDisclaimer } from '../../components/common/AIDecisionDisclaimer';
import {
  FileText,
  Clock,
  Wrench,
  CheckCircle2,
  PlusCircle,
  Search,
  MapPin,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { complaints, setActivePersona } = useApp();
  const navigate = useNavigate();

  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'submitted').length;
  const inProgress = complaints.filter((c) => c.status === 'assigned' || c.status === 'in_progress').length;
  const resolved = complaints.filter((c) => c.status === 'resolved').length;

  const recentComplaints = complaints.slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Modern Claymorphic Civic Welcome Card */}
      <div className="relative rounded-3xl clay-card-hero p-6 sm:p-8 overflow-hidden">
        {/* Subtle architectural dot grid background */}
        <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full clay-badge bg-white text-slate-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>SmartCity Civic Response System</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-mono text-[11px]">AI-Assisted Triage</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Citizen Civic Services & Issue Resolution
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
              Report municipal hazards, road damage, sanitation backlogs, or water supply defects. Our intelligent spatial engine analyzes urgency, predicts department routing, and gives you transparent tracking from dispatch to verification.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/citizen/report"
                className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-bold gap-2 text-white"
              >
                <PlusCircle className="w-4 h-4 text-blue-400" />
                <span>Report an Issue</span>
              </Link>
              <Link
                to="/track"
                className="clay-btn clay-btn-secondary px-5 py-2.5 text-xs font-bold gap-2 text-slate-700"
              >
                <Search className="w-4 h-4 text-slate-500" />
                <span>Track Existing Ticket</span>
              </Link>
              <Link
                to="/citizen/map"
                className="clay-btn clay-btn-secondary px-5 py-2.5 text-xs font-bold gap-2 text-slate-700"
              >
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Explore City Map</span>
              </Link>
            </div>
          </div>

          {/* Quick Civic Status Card */}
          <div className="shrink-0 clay-card p-5 w-full md:w-64 space-y-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] font-mono">
                Municipal Operations
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 clay-badge-emerald px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">Avg. AI Triage Speed</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-md">~1.2s</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">Resolution Rate</span>
                <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  {total > 0 ? Math.round((resolved / total) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">Active City Sectors</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-md">12 Districts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards: Total, Pending, In-Progress, Resolved */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="clay-card clay-card-hover rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Total Reports</span>
            <div className="w-10 h-10 rounded-xl clay-metric-icon bg-slate-50 flex items-center justify-center text-slate-700">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">{total}</span>
            <span className="text-xs text-slate-400 font-medium">registered</span>
          </div>
        </div>

        <div className="clay-card clay-card-hover rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 font-mono">Pending Triage</span>
            <div className="w-10 h-10 rounded-xl clay-metric-icon bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-amber-600">{pending}</span>
            <span className="text-xs text-amber-600/80 font-medium">under review</span>
          </div>
        </div>

        <div className="clay-card clay-card-hover rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 font-mono">In Progress</span>
            <div className="w-10 h-10 rounded-xl clay-metric-icon bg-sky-50 flex items-center justify-center text-sky-600">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-sky-600">{inProgress}</span>
            <span className="text-xs text-sky-600/80 font-medium">crews assigned</span>
          </div>
        </div>

        <div className="clay-card clay-card-hover rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 font-mono">Resolved</span>
            <div className="w-10 h-10 rounded-xl clay-metric-icon bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-emerald-600">{resolved}</span>
            <span className="text-xs text-emerald-600/80 font-medium">completed</span>
          </div>
        </div>
      </div>

      {/* AI Decision Support Disclaimer */}
      <AIDecisionDisclaimer />

      {/* Recent Complaints Table & Quick Actions */}
      <div className="clay-card rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/60 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Citizen Reports</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest municipal complaints registered across sectors with live progress badges
            </p>
          </div>
          <Link
            to="/citizen/my-complaints"
            className="clay-btn clay-btn-secondary text-xs font-semibold flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl"
          >
            <span>View All Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {recentComplaints.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl clay-metric-icon bg-slate-100 flex items-center justify-center text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-700">No complaints registered yet</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Report municipal hazards or maintenance requests to populate your civic dashboard.
              </p>
              <div className="pt-2">
                <Link
                  to="/citizen/report"
                  className="clay-btn clay-btn-primary px-4 py-2 text-xs font-semibold inline-block rounded-xl"
                >
                  Submit First Complaint
                </Link>
              </div>
            </div>
          ) : (
            recentComplaints.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/track?id=${c.id}`)}
                className="p-4 hover:bg-slate-100/50 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50/80 px-2.5 py-0.5 rounded-lg border border-indigo-100/80 shadow-2xs">
                      {c.id}
                    </span>
                    <span className="text-xs font-bold text-slate-900 line-clamp-1">
                      {c.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {c.description}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{c.location.landmark || c.location.address}</span>
                    <span>•</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <PriorityBadge priority={c.priority} size="sm" />
                  <StatusBadge status={c.status} size="sm" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/track?id=${c.id}`);
                    }}
                    className="clay-btn clay-btn-secondary px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Track
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
