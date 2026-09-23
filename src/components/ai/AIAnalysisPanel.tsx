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
  const providerDisplay = rawProvider === 'Gemini' ? 'Gemini 3.1 Flash Lite' : 'Demo AI';
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
      className={`rounded-xl border shadow-sm p-5 space-y-4 ${
        isHeuristicPreview
          ? 'bg-gradient-to-b from-amber-50/40 via-white to-white border-amber-200'
          : 'bg-gradient-to-b from-blue-50/40 to-white border-blue-200/90'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-xs text-white ${
              isHeuristicPreview ? 'bg-amber-600' : 'bg-blue-600'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {isHeuristicPreview ? 'Heuristic Form Preview' : 'AI Recommendation Dossier'}
              </h3>
              {isHeuristicPreview ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 font-mono">
                  Heuristic Preview — not Gemini
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Decision-Support
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {isHeuristicPreview
                ? 'Rule-based civic keywords assist form entry. Official AI inference processes upon submission.'
                : `Decision-support evaluation • AI Provider: ${providerDisplay}`}
            </p>
          </div>
        </div>

        {/* Confidence or Heuristic Indicator Badge */}
        {isHeuristicPreview ? (
          <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/90 text-xs">
            <span className="text-[11px] font-semibold text-amber-800 font-mono">
              Rule-Based Match
            </span>
          </div>
        ) : confidence !== undefined ? (
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200/90 text-xs shadow-2xs">
            <span className="text-slate-500 font-medium">Confidence Score:</span>
            <span className="font-mono font-bold text-blue-700 text-sm">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-[11px] font-medium text-slate-600 font-mono">
              AI Provider: {providerDisplay}
            </span>
          </div>
        )}
      </div>

      {/* Grid of 4 Primary AI Recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Suggested Priority */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Suggested Priority
          </span>
          <div className="flex items-center gap-2 pt-0.5">
            {priority && <PriorityBadge priority={priority} size="md" isAI={true} />}
          </div>
          <p className="text-[10px] text-slate-500">
            Trained on civic severity & hazard keywords
          </p>
        </div>

        {/* 2. Suggested Department */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
            <Building2 className="w-3 h-3 text-blue-600" />
            Suggested Department
          </span>
          <div className="text-xs font-bold text-slate-900 line-clamp-1 pt-1">
            {department || 'General Municipal Administration'}
          </div>
          <p className="text-[10px] text-slate-500">
            Jurisdiction matching
          </p>
        </div>

        {/* 3. Detected Urgency */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
            <Zap className="w-3 h-3 text-rose-500" />
            Detected Urgency
          </span>
          <div className="pt-0.5">
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${detectedUrgency.color}`}>
              {detectedUrgency.label}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            Based on hazard urgency factors
          </p>
        </div>

        {/* 4. Duplicate Warning */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
            <CopyCheck className="w-3 h-3 text-indigo-500" />
            Duplicate Warning
          </span>
          <div className="pt-0.5">
            {duplicateInfo.isSuspectedDuplicate ? (
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Suspected Duplicate ({duplicateInfo.suspectedId || 'Nearby'})
              </span>
            ) : (
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Unique Incident (No Duplicates)
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500">
            Spatial radius & keyword match
          </p>
        </div>
      </div>

      {/* Reasoning & Factors Considered */}
      <div className="p-3.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
        <div>
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
            Diagnostic Reasoning
          </span>
          <p className="text-xs text-slate-700 leading-relaxed">
            {reasoning ||
              'Automated spatial-linguistic parsing correlates this submission with nearby historical reports and arterial infrastructure density to recommend prioritization.'}
          </p>
        </div>

        {factors && factors.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              Factors Considered by System:
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700">
              {factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-snug">{factor}</span>
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
