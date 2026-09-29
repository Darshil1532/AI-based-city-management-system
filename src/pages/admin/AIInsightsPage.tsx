import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { AIDecisionDisclaimer } from '../../components/common/AIDecisionDisclaimer';
import { AIInsight } from '../../types';
import {
  Sparkles,
  Lightbulb,
  Building2,
  MapPin,
  FileText,
  CheckCircle,
  ExternalLink,
  Shield,
  Clock,
  Check,
} from 'lucide-react';

export const AIInsightsPage: React.FC = () => {
  const { aiInsights, updateInsightStatus, allComplaints } = useApp();
  const complaints = allComplaints;
  const navigate = useNavigate();

  const [filter, setFilter] = useState<'all' | 'new' | 'reviewed' | 'action_taken'>('all');
  const [actionSuccessId, setActionSuccessId] = useState<string | null>(null);

  const filteredInsights = aiInsights.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const handleTakeAction = (id: string) => {
    updateInsightStatus(id, 'action_taken');
    setActionSuccessId(id);
    setTimeout(() => setActionSuccessId(null), 3000);
  };

  const handleMarkReviewed = (id: string) => {
    updateInsightStatus(id, 'reviewed');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
              Strategic City Intelligence
            </span>
            <span className="text-[10px] text-emerald-800 font-bold px-2.5 py-0.5 rounded-lg font-mono clay-badge clay-badge-emerald">
              Pattern Mining Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            AI Automated Recommendations & Trend Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Automated correlation of temporal civic trends, repeated municipal failures, and infrastructure maintenance proposals.
          </p>
        </div>
      </div>

      {/* Mandatory Label Banner */}
      <div className="p-5 rounded-3xl clay-card text-xs text-slate-700 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white shrink-0 flex items-center justify-center shadow-md">
          <Lightbulb className="w-5 h-5 text-amber-300" />
        </div>
        <div className="space-y-1">
          <span className="font-bold text-slate-900 block font-mono text-[11px] uppercase tracking-wide">
            AI-generated recommendation — requires human administrative validation
          </span>
          <p className="text-slate-600 leading-relaxed text-xs">
            These strategic pattern insights synthesize multiple citizen reports over time. Municipal directors should verify ground realities before approving resource reallocation or maintenance tenders.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 clay-card p-1.5 rounded-2xl w-fit text-xs">
        {[
          { id: 'all', label: 'All Insights' },
          { id: 'new', label: 'New Unreviewed' },
          { id: 'reviewed', label: 'Reviewed' },
          { id: 'action_taken', label: 'Action Taken' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              filter === tab.id
                ? 'clay-btn clay-btn-primary text-white scale-102'
                : 'clay-btn text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Insight Cards List */}
      <div className="space-y-5">
        {filteredInsights.length === 0 ? (
          <div className="py-16 clay-card rounded-3xl text-center text-xs text-slate-400 font-mono">
            No AI insights match the selected filter.
          </div>
        ) : (
          filteredInsights.map((insight) => (
            <div
              key={insight.id}
              className="clay-card rounded-3xl p-6 space-y-5 transition-all"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100/80">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-700 clay-badge px-2.5 py-1 rounded-xl">
                    {insight.id}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {insight.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <PriorityBadge priority={insight.priority} size="sm" isAI={true} />
                  <span
                    className={`text-[10px] font-mono font-bold px-3 py-1 rounded-xl capitalize ${
                      insight.status === 'action_taken'
                        ? 'clay-badge clay-badge-emerald'
                        : insight.status === 'reviewed'
                        ? 'clay-badge clay-badge-blue'
                        : 'clay-badge clay-badge-amber'
                    }`}
                  >
                    {insight.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Pattern & Recommendation Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Detected Pattern */}
                <div className="p-4 rounded-2xl clay-inset bg-slate-50/70 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                    Detected Pattern:
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    "{insight.detectedPattern}"
                  </p>
                </div>

                {/* AI Recommendation */}
                <div className="p-4 rounded-2xl clay-inset bg-blue-50/40 border border-blue-200/40 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Recommendation:
                  </span>
                  <p className="text-slate-900 font-semibold leading-relaxed">
                    "{insight.recommendation || insight.aiRecommendation}"
                  </p>
                </div>
              </div>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5 text-slate-700 clay-badge px-2.5 py-1 rounded-xl">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>{insight.location}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700 clay-badge px-2.5 py-1 rounded-xl">
                    <Building2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>{insight.suggestedDepartment || insight.department}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700 clay-badge px-2.5 py-1 rounded-xl">
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>{insight.relatedComplaintIds?.length || 0} reports</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5">
                  {insight.status !== 'reviewed' && insight.status !== 'action_taken' && (
                    <button
                      type="button"
                      onClick={() => handleMarkReviewed(insight.id)}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl clay-btn text-slate-700 transition-all cursor-pointer"
                    >
                      Mark Reviewed
                    </button>
                  )}

                  {insight.status !== 'action_taken' ? (
                    <button
                      type="button"
                      onClick={() => handleTakeAction(insight.id)}
                      className="px-4 py-2 text-xs font-bold rounded-xl clay-btn clay-btn-primary text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Take Action & Dispatch</span>
                    </button>
                  ) : (
                    <span className="text-emerald-700 text-xs font-bold flex items-center gap-1.5 font-mono clay-badge clay-badge-emerald px-3 py-1.5 rounded-xl">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Action Logged</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AIDecisionDisclaimer />
    </div>
  );
};
