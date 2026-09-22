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
  label: string = 'Gemini 2.5 Flash';
  private fallbackProvider: DemoAIProvider = new DemoAIProvider();

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch('/api/ai/status', { signal: AbortSignal.timeout(2000) });
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
        signal: AbortSignal.timeout(8000),
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
      }
    } catch (err) {
      console.warn('[GeminiProvider] Remote inference unavailable, falling back to Demo AI:', err);
    }

    // Fallback to Demo AI
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
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaints: complaints.slice(0, 15).map((c) => ({
            id: c.id,
            category: c.category,
            severity: c.severity,
            status: c.status,
            location: c.location.address,
            description: c.description,
          })),
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.insights) && data.insights.length > 0) {
          return data.insights;
        }
      }
    } catch (err) {
      console.warn('[GeminiProvider] Remote insights unavailable, using fallback:', err);
    }

    return this.fallbackProvider.generateInsights(complaints);
  }
}
