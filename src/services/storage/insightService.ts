import { AIInsight, Complaint } from '../../types';
import { IInsightRepository } from '../../repositories/types';
import { repositories } from '../../repositories';

export interface IInsightService {
  getAll(): AIInsight[];
  getById(id: string): AIInsight | undefined;
  updateStatus(id: string, status: 'new' | 'reviewed' | 'action_taken' | 'dismissed'): void;
  generateFromComplaints(complaints: Complaint[]): AIInsight[];
  saveAll(insights: AIInsight[]): void;
  reset(): AIInsight[];
}

export class InsightService implements IInsightService {
  private repository: IInsightRepository;
  private insights: AIInsight[] = [];

  constructor(repository?: IInsightRepository) {
    this.repository = repository || repositories.insights;
    this.insights = this.repository.getAll();
  }

  private refreshFromRepository(): void {
    this.insights = this.repository.getAll();
  }

  getAll(): AIInsight[] {
    this.refreshFromRepository();
    return [...this.insights];
  }

  getById(id: string): AIInsight | undefined {
    return this.repository.getById(id);
  }

  updateStatus(
    id: string,
    status: 'new' | 'reviewed' | 'action_taken' | 'dismissed'
  ): void {
    this.refreshFromRepository();
    const updated = this.insights.map((i) => (i.id === id ? { ...i, status } : i));
    this.repository.saveAll(updated);
    this.insights = updated;
  }

  saveAll(insights: AIInsight[]): void {
    this.repository.saveAll(insights);
    this.refreshFromRepository();
  }

  reset(): AIInsight[] {
    const list = this.repository.reset();
    this.insights = [...list];
    return list;
  }

  generateFromComplaints(complaints: Complaint[]): AIInsight[] {
    this.refreshFromRepository();
    const active = complaints.filter((c) => c.status !== 'resolved');
    const newInsights: AIInsight[] = [...this.insights];

    // Check if 3+ high-severity complaints exist in same category
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
          const targetDept = sample.assignedDepartment || sample.department || 'Public Works Department';
          newInsights.unshift({
            id,
            title: `Systemic ${cat} Recurrence Pattern Detected`,
            detectedPattern: `${list.length} unresolved incidents reported in ${cat}. High concentration indicates systemic civic asset maintenance requirement.`,
            recommendation: `Conduct coordinated field inspection by ${targetDept} and prioritize planned maintenance over emergency ad-hoc repairs.`,
            location: sample.location?.address || sample.location?.district || 'Urban Municipal Sector',
            priority: 'High',
            suggestedDepartment: targetDept,
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

    this.repository.saveAll(newInsights);
    this.insights = newInsights;
    return this.insights;
  }
}

export const insightService = new InsightService();
