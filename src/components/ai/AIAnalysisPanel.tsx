import React from 'react';
import { Complaint, AIAnalysis } from '../../types';
import { AIAnalysisResult } from '../../services/ai/AIProvider';
import { PriorityBadge } from '../common/PriorityBadge';
import { AIDecisionDisclaimer } from '../common/AIDecisionDisclaimer';
import {
  Sparkles,
  Layers,
  Building2,
  AlertTriangle,
  CheckCircle,
  BrainCircuit,
  CopyCheck,
  Zap,
  ShieldAlert,
} from 'lucide-react';

interface AIAnalysisPanelProps {
  complaint?: Complaint;
  analysis?: AIAnalysis | AIAnalysisResult;
  showAdminActionHint?: boolean;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  complaint,
  analysis: directAnalysis,
  showAdminActionHint = true,
}) => {
  const isHeuristicPreview = (directAnalysis as any)?.isHeuristicPreview;
  const rawProvider = directAnalysis ? directAnalysis.provider : complaint?.aiProvider;
  const rawProviderLabel = directAnalysis ? (directAnalysis as any).providerLabel : (complaint as any)?.aiProviderLabel;
  const providerDisplay = rawProviderLabel || (rawProvider === 'Gemini' ? 'SmartCity AI Engine' : 'Civic AI Engine');
  const category = directAnalysis ? directAnalysis.category : complaint?.aiCategory;
  const priority = directAnalysis ? directAnalysis.priority : complaint?.aiPriority;
  const department = directAnalysis ? directAnalysis.department : complaint?.aiDepartment;
  const confidence = directAnalysis ? directAnalysis.confidence : complaint?.aiConfidence;
  const reasoning = directAnalysis ? directAnalysis.reasoning : complaint?.aiReasoning;
  const factors = directAnalysis ? directAnalysis.factors : complaint?.aiFactors ?? [];

  // Determine detected urgency
  const detectedUrgency =
    priority === 'High'
      ? { level: 'Critical', label: 'Immediate Hazard / High Urgency', color: 'text-rose-700 bg-rose-50 border-rose-200' }
      : priority === 'Medium'
      ? { level: 'Moderate', label: 'Elevated Urgency / Scheduled Dispatch', color: 'text-amber-700 bg-amber-50 border-amber-200' }
      : { level: 'Standard', label: 'Standard Urgency / Routine Queue', color: 'text-slate-700 bg-slate-100 border-slate-200' };

  // Duplicate Warning Assessment
  const duplicateInfo = complaint?.duplicateWarning || {
    isSuspectedDuplicate: false,
  };

  return (
    <div
      id="ai-analysis-panel"
      className="clay-card rounded-3xl p-6 sm:p-7 space-y-5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl clay-metric-icon flex items-center justify-center shadow-xs text-white ${
              isHeuristicPreview ? 'bg-amber-500' : 'bg-indigo-600'
            }`}
          >
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {isHeuristicPreview ? 'Heuristic Form Preview' : 'AI Recommendation Dossier'}
              </h3>
              {isHeuristicPreview ? (
                <span className="px-2.5 py-0.5 rounded-xl text-[10px] font-bold clay-badge clay-badge-amber font-mono">
                  Heuristic Rule Preview
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-xl text-[10px] font-bold clay-badge clay-badge-blue">
                  Decision-Support
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              {isHeuristicPreview
                ? 'Rule-based civic keywords assist form entry. Official AI inference processes upon submission.'
                : `Decision-support evaluation • AI Provider: ${providerDisplay}`}
            </p>
          </div>
        </div>

        {/* Confidence or Heuristic Indicator Badge */}
        {isHeuristicPreview ? (
          <div className="flex items-center gap-1.5 clay-badge clay-badge-amber px-3 py-1.5 rounded-xl text-xs">
            <span className="text-[11px] font-bold text-amber-900 font-mono">
              Rule-Based Match
            </span>
          </div>
        ) : confidence !== undefined ? (
          <div className="flex items-center gap-2 clay-inset px-3.5 py-1.5 rounded-xl text-xs">
            <span className="text-slate-500 font-semibold">Confidence:</span>
            <span className="font-mono font-black text-indigo-700 text-sm">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 clay-badge px-3 py-1 rounded-xl text-xs">
            <span className="text-[11px] font-semibold text-slate-600 font-mono">
              AI Provider: {providerDisplay}
            </span>
          </div>
        )}
      </div>

      {/* Grid of 4 Primary AI Recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Suggested Priority */}
        <div className="p-4 rounded-2xl clay-inset space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Suggested Priority
          </span>
          <div className="flex items-center gap-2 pt-0.5">
            {priority && <PriorityBadge priority={priority} size="md" isAI={true} />}
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            Trained on civic severity & hazard keywords
          </p>
        </div>

        {/* 2. Suggested Department */}
        <div className="p-4 rounded-2xl clay-inset space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            Suggested Department
          </span>
          <div className="text-xs font-bold text-slate-900 line-clamp-1 pt-0.5">
            {department || 'General Municipal Administration'}
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            Jurisdiction matching
          </p>
        </div>

        {/* 3. Detected Urgency */}
        <div className="p-4 rounded-2xl clay-inset space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Zap className="w-3.5 h-3.5 text-rose-500" />
            Detected Urgency
          </span>
          <div className="pt-0.5">
            <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${detectedUrgency.color}`}>
              {detectedUrgency.label}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            Based on hazard urgency factors
          </p>
        </div>

        {/* 4. Duplicate Warning */}
        <div className="p-4 rounded-2xl clay-inset space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <CopyCheck className="w-3.5 h-3.5 text-indigo-500" />
            Duplicate Warning
          </span>
          <div className="pt-0.5">
            {duplicateInfo.isSuspectedDuplicate ? (
              <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold clay-badge-amber text-amber-900">
                Suspected Duplicate ({duplicateInfo.suspectedId || 'Nearby'})
              </span>
            ) : (
              <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold clay-badge-emerald text-emerald-900">
                Unique Incident (No Duplicates)
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            Spatial radius & keyword match
          </p>
        </div>
      </div>

      {/* Reasoning & Factors Considered */}
      <div className="p-4.5 rounded-2xl clay-inset space-y-3">
        <div>
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1 font-mono">
            Diagnostic Reasoning
          </span>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {reasoning ||
              'Automated spatial-linguistic parsing correlates this submission with nearby historical reports and arterial infrastructure density to recommend prioritization.'}
          </p>
        </div>

        {factors && factors.length > 0 && (
          <div className="pt-2.5 border-t border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-500 block mb-1.5 font-mono">
              Factors Considered by System:
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              {factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-snug font-medium">{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Clear Governance Notice */}
      <AIDecisionDisclaimer
        customText="AI Recommendation only: This analysis is generated to support human municipal supervisors. Final priority designation, department assignment, and work order dispatch require human administrative decision."
      />
    </div>
  );
};
