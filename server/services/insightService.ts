import { AIInsight } from '../../src/types';
import { AuthenticatedUser } from '../middleware/authMiddleware';
import { getAdminFirestore } from '../lib/firebaseAdmin';

export class DatabasePersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabasePersistenceError';
  }
}

const DEFAULT_INSIGHTS: AIInsight[] = [
  {
    id: 'INS-01',
    title: 'Monsoon Drainage Vulnerability in MP Nagar Zone 2',
    detectedPattern: 'High concentration of recurring waterlogging complaints correlated with storm runoff points.',
    recommendation: 'Pre-emptive culvert desilting and storm drain capacity expansion before Q3 heavy precipitation.',
    location: 'MP Nagar Zone 2',
    priority: 'High',
    relatedComplaintIds: ['SC1001', 'SC1008', 'SC1015'],
    suggestedDepartment: 'Public Works Department',
    status: 'new',
    date: new Date().toISOString(),
    potentialCauseHypothesis: 'Blocked secondary feeder storm drains and undersized underground pipes.',
    estimatedImpact: 'Prevents arterial traffic paralysis affecting ~45,000 daily commuters.',
  },
  {
    id: 'INS-02',
    title: 'Systemic Streetlight Outages on Link Road 1',
    detectedPattern: 'Series of 8 luminaire failures over a 1.2km stretch within 48 hours.',
    recommendation: 'Deploy electrical transformer maintenance team to inspect high-voltage surge protective devices.',
    location: 'Link Road 1',
    priority: 'Medium',
    relatedComplaintIds: ['SC1003', 'SC1012'],
    suggestedDepartment: 'Electrical Department',
    status: 'reviewed',
    date: new Date(Date.now() - 86400000).toISOString(),
    potentialCauseHypothesis: 'Phase imbalance on municipal transformer feeder box 4B.',
    estimatedImpact: 'Restores public nighttime safety on principal arterial corridor.',
  },
];

function sanitizeForFirestore(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      result[k] = v;
    }
  }
  return result;
}

export class InsightService {
  private insights: AIInsight[] = [...DEFAULT_INSIGHTS];

  constructor() {
    this.initFromFirestore();
  }

  private async initFromFirestore(): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;
    try {
      const adminDb = getAdminFirestore();
      if (!adminDb) return;
      const snapshot = await adminDb.collection('insights').get();
      if (!snapshot.empty) {
        const loaded: AIInsight[] = [];
        snapshot.forEach((doc: any) => {
          loaded.push(doc.data() as AIInsight);
        });
        if (loaded.length > 0) {
          const map = new Map<string, AIInsight>();
          loaded.forEach((i) => map.set(i.id, i));
          this.insights.forEach((i) => {
            if (!map.has(i.id)) map.set(i.id, i);
          });
          this.insights = Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        }
      }
    } catch (err: any) {
      console.info('[InsightService] Firestore sync notice:', err?.message || err);
    }
  }

  private async persistToFirestore(insight: AIInsight): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;
    try {
      const adminDb = getAdminFirestore();
      if (!adminDb) {
        if (process.env.NODE_ENV === 'production') {
          throw new DatabasePersistenceError('Firestore Admin unavailable for insight persistence.');
        }
        return;
      }
      await adminDb.collection('insights').doc(insight.id).set(sanitizeForFirestore(insight), { merge: true });
    } catch (err: any) {
      if (process.env.NODE_ENV === 'production') {
        throw new DatabasePersistenceError(`Firestore insight write failed: ${err?.message || err}`);
      }
      console.info(`[InsightService] Firestore write notice for ${insight.id}:`, err?.message || err);
    }
  }

  getAll(user: AuthenticatedUser): AIInsight[] {
    if (user.role !== 'admin') {
      throw new Error('Forbidden: Administrative clearance required to access municipal AI insights.');
    }
    return [...this.insights];
  }

  getById(id: string, user: AuthenticatedUser): AIInsight | undefined {
    if (user.role !== 'admin') {
      throw new Error('Forbidden: Administrative clearance required.');
    }
    return this.insights.find((i) => i.id === id);
  }

  async updateStatus(
    id: string,
    status: AIInsight['status'],
    user: AuthenticatedUser,
    actionNote?: string
  ): Promise<{ success: boolean; insight?: AIInsight; error?: string }> {
    if (user.role !== 'admin') {
      return { success: false, error: 'Forbidden: Admin clearance required.' };
    }

    const item = this.insights.find((i) => i.id === id);
    if (!item) {
      return { success: false, error: 'Insight not found.' };
    }

    item.status = status;
    if (actionNote) {
      item.recommendation = `${item.recommendation} [Action Note by ${user.name}: ${actionNote}]`;
    }

    await this.persistToFirestore(item);
    return { success: true, insight: item };
  }
}

export const insightService = new InsightService();
