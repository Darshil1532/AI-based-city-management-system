import { AIInsight, Complaint } from '../../types';
import { INITIAL_AI_INSIGHTS } from '../../data/mockData';

const STORAGE_KEY = 'smartcity_insights_v2';

export interface IInsightService {
  getAll(): AIInsight[];
  getById(id: string): AIInsight | undefined;
  updateStatus(id: string, status: 'new' | 'reviewed' | 'action_taken' | 'dismissed'): void;
  generateFromComplaints(complaints: Complaint[]): AIInsight[];
  saveAll(insights: AIInsight[]): void;
  reset(): AIInsight[];
}

export class InsightService implements IInsightService {
  private insights: AIInsight[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.insights = JSON.parse(saved);
        return;
      }
    } catch (e) {
      console.warn('[InsightService] Could not read from localStorage:', e);
    }
    this.insights = [...INITIAL_AI_INSIGHTS];
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.insights));
    } catch (e) {
      console.warn('[InsightService] Could not write to localStorage:', e);
    }
  }

  getAll(): AIInsight[] {
    return [...this.insights];
  }

  getById(id: string): AIInsight | undefined {
    return this.insights.find((i) => i.id === id);
  }

  updateStatus(
    id: string,
    status: 'new' | 'reviewed' | 'action_taken' | 'dismissed'
  ): void {
    this.insights = this.insights.map((i) => (i.id === id ? { ...i, status } : i));
    this.persist();
  }

  saveAll(insights: AIInsight[]): void {
    this.insights = [...insights];
    this.persist();
  }

  reset(): AIInsight[] {
    this.insights = [...INITIAL_AI_INSIGHTS];
    this.persist();
    return [...this.insights];
  }

  generateFromComplaints(complaints: Complaint[]): AIInsight[] {
    // Detect patterns from active complaints
    const active = complaints.filter((c) => c.status !== 'resolved');
    const newInsights: AIInsight[] = [...this.insights];

    // Example: Check if 3+ high-severity complaints exist in same category
    const categoryGroups: Record<string, Complaint[]> = {};
    active.forEach((c) => {
      categoryGroups[c.category] = categoryGroups[c.category] || [];
      categoryGroups[c.category].push(c);
    });

    Object.entries(categoryGroups).forEach(([cat, list]) => {
      if (list.length >= 3) {
        const id = `ins-auto-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const alreadyExists = newInsights.some((i) => i.id === id);
        if (!alreadyExists) {
          const sample = list[0];
          newInsights.unshift({
            id,
            title: `Systemic ${cat} Recurrence Pattern Detected`,
            detectedPattern: `${list.length} unresolved incidents reported in ${cat}. High concentration indicates systemic civic asset maintenance requirement.`,
            recommendation: `Conduct coordinated field inspection by ${sample.department} and prioritize planned maintenance over emergency ad-hoc repairs.`,
            location: sample.location.address || 'Urban Municipal Sector',
            priority: 'High',
            suggestedDepartment: sample.department,
            relatedComplaintIds: list.map((c) => c.id).slice(0, 5),
            relatedComplaintsCount: list.length,
            status: 'new',
            date: new Date().toISOString(),
            potentialCauseHypothesis: 'Aging municipal infrastructure compounded by seasonal environmental stress.',
            estimatedImpact: 'Reduces citizen complaints by ~45% through preventative intervention.',
          });
        }
      }
    });

    this.insights = newInsights;
    this.persist();
    return this.insights;
  }
}

export const insightService = new InsightService();
