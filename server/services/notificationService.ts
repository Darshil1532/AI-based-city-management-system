import { NotificationItem } from '../../src/types';
import { AuthenticatedUser } from '../middleware/authMiddleware';
import { getAdminFirestore } from '../lib/firebaseAdmin';

export class DatabasePersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabasePersistenceError';
  }
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    userId: 'CIT-DEMO-01',
    title: 'Complaint Registered: SC1023',
    message: 'Your report regarding "Streetlight Outage" has been received and logged.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    type: 'submission',
    link: '/track?id=SC1023',
  },
  {
    id: 'notif-2',
    userId: 'admin',
    title: 'High Severity Alert: Water Contamination',
    message: 'New complaint SC1024 reported in Zone 4. AI triage suggests immediate investigation.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: false,
    type: 'admin_action',
    link: '/admin/complaint/SC1024',
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

export class NotificationService {
  private notifications: NotificationItem[] = [...DEFAULT_NOTIFICATIONS];

  constructor() {
    this.initFromFirestore();
  }

  private async initFromFirestore(): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;
    try {
      const adminDb = getAdminFirestore();
      if (!adminDb) return;
      const snapshot = await adminDb.collection('notifications').get();
      if (!snapshot.empty) {
        const loaded: NotificationItem[] = [];
        snapshot.forEach((doc: any) => {
          loaded.push(doc.data() as NotificationItem);
        });
        if (loaded.length > 0) {
          const map = new Map<string, NotificationItem>();
          loaded.forEach((n) => map.set(n.id, n));
          this.notifications.forEach((n) => {
            if (!map.has(n.id)) map.set(n.id, n);
          });
          this.notifications = Array.from(map.values()).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        }
      }
    } catch (err: any) {
      console.info('[NotificationService] Firestore sync notice:', err?.message || err);
    }
  }

  private async persistToFirestore(item: NotificationItem): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;
    try {
      const adminDb = getAdminFirestore();
      if (!adminDb) {
        if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
          throw new DatabasePersistenceError('Firestore Admin unavailable for notification persistence.');
        }
        return;
      }
      await adminDb.collection('notifications').doc(item.id).set(sanitizeForFirestore(item), { merge: true });
    } catch (err: any) {
      if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
        throw new DatabasePersistenceError(`Firestore notification write failed: ${err?.message || err}`);
      }
      console.info(`[NotificationService] Firestore write notice for ${item.id}:`, err?.message || err);
    }
  }

  getForUser(user: AuthenticatedUser): NotificationItem[] {
    if (user.role === 'admin') {
      return [...this.notifications];
    }
    return this.notifications.filter(
      (n) => n.userId === user.id || n.userId === 'all'
    );
  }

  async createNotification(
    data: {
      userId: string;
      title: string;
      message: string;
      type: NotificationItem['type'];
      link?: string;
    },
    creator: AuthenticatedUser
  ): Promise<{ success: boolean; notification?: NotificationItem; error?: string; code?: string }> {
    // Authorization Check: Citizen can ONLY create notifications for themselves
    if (creator.role === 'citizen' && data.userId !== creator.id) {
      return {
        success: false,
        code: 'FORBIDDEN',
        error: 'Unauthorized: Citizens may only dispatch notifications addressed to their own user ID.',
      };
    }

    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const notification: NotificationItem = {
      id,
      userId: data.userId,
      title: data.title,
      message: data.message,
      timestamp: new Date().toISOString(),
      read: false,
      type: data.type,
      link: data.link,
    };

    this.notifications.unshift(notification);
    await this.persistToFirestore(notification);

    return {
      success: true,
      notification,
    };
  }

  async markAsRead(id: string, user: AuthenticatedUser): Promise<boolean> {
    const item = this.notifications.find((n) => n.id === id);
    if (!item) return false;

    // Verify ownership
    if (user.role === 'citizen' && item.userId !== user.id && item.userId !== 'all') {
      return false;
    }

    item.read = true;
    await this.persistToFirestore(item);
    return true;
  }

  async clearAll(user: AuthenticatedUser): Promise<void> {
    if (user.role === 'admin') {
      this.notifications = [];
    } else {
      this.notifications = this.notifications.filter(
        (n) => n.userId !== user.id && n.userId !== 'all'
      );
    }
  }
}

export const notificationService = new NotificationService();
