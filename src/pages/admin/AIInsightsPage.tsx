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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Strategic City Intelligence
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono border border-emerald-200/60">
              Pattern Mining Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            AI Automated Recommendations & Trend Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automated correlation of temporal civic trends, repeated municipal failures, and infrastructure maintenance proposals.
          </p>
        </div>
      </div>

      {/* Mandatory Label Banner */}
      <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-slate-900 text-white shrink-0 mt-0.5 shadow-2xs">
          <Lightbulb className="w-4 h-4 text-amber-300" />
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
      <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl border border-slate-200/80 w-fit text-xs">
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
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filter === tab.id
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Insight Cards List */}
      <div className="space-y-4">
        {filteredInsights.length === 0 ? (
          <div className="py-12 bg-white rounded-xl border border-slate-200/80 text-center text-xs text-slate-400">
            No AI insights match the selected filter.
          </div>
        ) : (
          filteredInsights.map((insight) => (
            <div
              key={insight.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4 transition-all hover:border-slate-300"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {insight.id}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {insight.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <PriorityBadge priority={insight.priority} size="sm" isAI={true} />
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full capitalize ${
                      insight.status === 'action_taken'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : insight.status === 'reviewed'
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {insight.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Pattern & Recommendation Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                {/* Detected Pattern */}
                <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                    Detected Pattern:
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    "{insight.detectedPattern}"
                  </p>
                </div>

                {/* AI Recommendation */}
                <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block flex items-center gap-1 font-mono">
                    <Sparkles className="w-3 h-3" />
                    AI Recommendation:
                  </span>
                  <p className="text-slate-900 font-medium leading-relaxed">
                    "{insight.recommendation || insight.aiRecommendation}"
                  </p>
                </div>
              </div>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{insight.location}</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{insight.suggestedDepartment || insight.department}</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-700">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{insight.relatedComplaintIds?.length || 0} reports</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {insight.status !== 'reviewed' && insight.status !== 'action_taken' && (
                    <button
                      type="button"
                      onClick={() => handleMarkReviewed(insight.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      Mark Reviewed
                    </button>
                  )}

                  {insight.status !== 'action_taken' ? (
                    <button
                      type="button"
                      onClick={() => handleTakeAction(insight.id)}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Take Action & Dispatch</span>
                    </button>
                  ) : (
                    <span className="text-emerald-700 text-xs font-semibold flex items-center gap-1 font-mono">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
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
