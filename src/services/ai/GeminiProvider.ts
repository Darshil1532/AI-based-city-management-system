import {
  ComplaintCategory,
  SeverityLevel,
  LocationCoordinates,
  Complaint,
} from '../../types';
import { IAIProvider, AIAnalysisResult, AIInsightPattern } from './AIProvider';
import { DemoAIProvider } from './DemoAIProvider';

export class GeminiProvider implements IAIProvider {
  name: 'Gemini' = 'Gemini';
  label: string = 'Gemini 3.1 Flash Lite';
  private fallbackProvider: DemoAIProvider = new DemoAIProvider();

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch('/api/ai/status', { signal: AbortSignal.timeout(2500) });
      if (!res.ok) return false;
      const data = await res.json();
      return !!data.geminiConfigured;
    } catch {
      return false;
    }
  }

  async classifyComplaint(
    description: string,
    userCategory?: ComplaintCategory,
    userSeverity?: SeverityLevel,
    location?: LocationCoordinates,
    existingComplaints: Complaint[] = []
  ): Promise<AIAnalysisResult> {
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          userCategory,
          userSeverity,
          location,
          existingComplaintsCount: existingComplaints.length,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.category && data.department && data.provider === 'Gemini') {
          return {
            category: data.category,
            priority: data.priority,
            department: data.department,
            confidence: data.confidence || 0.94,
            confidencePercent: Math.round((data.confidence || 0.94) * 100),
            reasoning: data.reasoning || 'Gemini decision-support model analyzed complaint text and municipal geographic features.',
            factors: data.factors || ['Gemini natural language parsing of issue severity'],
            publicImpactScore: data.publicImpactScore || 7,
            urgencyIndicators: data.urgencyIndicators || [],
            provider: 'Gemini',
            providerLabel: this.label,
            timestamp: new Date().toISOString(),
          };
        }
      } else {
        // Phase 19: Log actual server error codes (400, 429, 503, 500) without hiding them
        const errJson = await response.json().catch(() => null);
        console.warn(`[GeminiProvider] Server returned HTTP ${response.status} (${errJson?.code || 'UNKNOWN'}): ${errJson?.message || response.statusText}. Gracefully falling back to Demo AI.`);
      }
    } catch (err: any) {
      console.warn('[GeminiProvider] Network/inference failure, falling back to Demo AI:', err?.message || err);
    }

    // Graceful fallback to Demo AI
    return this.fallbackProvider.classifyComplaint(
      description,
      userCategory,
      userSeverity,
      location,
      existingComplaints
    );
  }

  async generateInsights(complaints: Complaint[]): Promise<AIInsightPattern[]> {
    try {
      // Phase 14: Strict privacy filter. Exclude phone, email, full personal name.
      // Only send: id, category, severity, status, location at district/corridor level, and description.
      const sanitizedPayload = complaints.slice(0, 15).map((c) => ({
        id: c.id,
        category: c.category,
        severity: c.severity,
        status: c.status,
        location: c.location.district || c.location.landmark || (c.location.address ? c.location.address.split(',')[0] : 'Municipal Area'),
        description: c.description,
      }));

      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaints: sanitizedPayload }),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.insights) && data.insights.length > 0) {
          return data.insights.map((ins: any) => ({
            ...ins,
            department: ins.department || ins.suggestedDepartment || 'Public Works Department',
            suggestedDepartment: ins.suggestedDepartment || ins.department || 'Public Works Department',
            disclaimer: 'AI-generated hypothesis — requires administrative validation.',
          }));
        }
      } else {
        // Phase 19: Log actual server error codes
        const errJson = await response.json().catch(() => null);
        console.warn(`[GeminiProvider] Insights returned HTTP ${response.status} (${errJson?.code || 'UNKNOWN'}): ${errJson?.message || response.statusText}. Using fallback insights.`);
      }
    } catch (err: any) {
      console.warn('[GeminiProvider] Remote insights unavailable, using fallback:', err?.message || err);
    }

    return this.fallbackProvider.generateInsights(complaints);
  }
}
