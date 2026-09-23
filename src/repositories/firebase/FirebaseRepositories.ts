import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  IComplaintRepository,
  IInsightRepository,
  INotificationRepository,
  IHotspotRepository,
  IAuthRepository,
} from '../types';
import {
  Complaint,
  AIInsight,
  NotificationItem,
  Hotspot,
  UserProfile,
} from '../../types';
import {
  INITIAL_COMPLAINTS,
  INITIAL_AI_INSIGHTS,
  INITIAL_HOTSPOTS,
} from '../../data/mockData';
import {
  DEMO_CITIZEN_PROFILE,
  DEFAULT_NOTIFICATIONS,
} from '../local/LocalStorageRepositories';

const STORAGE_KEYS = {
  COMPLAINTS: 'smartcity_firebase_complaints_cache',
  INSIGHTS: 'smartcity_firebase_insights_cache',
  NOTIFICATIONS: 'smartcity_firebase_notifications_cache',
  AUTH: 'smartcity_auth_user_v2',
  HOTSPOTS: 'smartcity_hotspots_v2',
} as const;

/**
 * Remove undefined values before writing to Firestore
 */
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = sanitizeForFirestore(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * Firebase-backed Complaint Repository
 */
export class FirebaseComplaintRepository implements IComplaintRepository {
  private complaints: Complaint[] = [];
  private unsubscribe?: () => void;

  constructor() {
    this.loadInitialCache();
    this.initFirebaseSync();
  }

  private loadInitialCache(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COMPLAINTS);
      if (raw) {
        this.complaints = JSON.parse(raw);
        return;
      }
    } catch (e) {
      console.warn('[FirebaseComplaintRepository] Cache read error:', e);
    }
    this.complaints = [...INITIAL_COMPLAINTS];
  }

  private persistCache(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(this.complaints));
    } catch (e) {
      console.warn('[FirebaseComplaintRepository] Cache write error:', e);
    }
  }

  private async initFirebaseSync(): Promise<void> {
    try {
      // Real-time listener for remote updates
      this.unsubscribe = onSnapshot(
        collection(db, 'complaints'),
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteComplaints: Complaint[] = [];
            snapshot.forEach((docSnap) => {
              remoteComplaints.push(docSnap.data() as Complaint);
            });
            // Merge remote with initial default if not already present
            const remoteMap = new Map<string, Complaint>();
            remoteComplaints.forEach((c) => remoteMap.set(c.id, c));
            
            // Maintain complaints sorted by createdAt desc
            const merged = [...remoteComplaints];
            this.complaints.forEach((local) => {
              if (!remoteMap.has(local.id)) {
                merged.push(local);
              }
            });
            merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            this.complaints = merged;
            this.persistCache();
          } else {
            // First time seeding to Firestore
            this.seedToFirestore();
          }
        },
        (error) => {
          console.warn('[FirebaseComplaintRepository] Firestore snapshot listener notice:', error.message);
        }
      );
    } catch (err) {
      console.warn('[FirebaseComplaintRepository] Firestore sync init notice:', err);
    }
  }

  private async seedToFirestore(): Promise<void> {
    try {
      for (const complaint of INITIAL_COMPLAINTS.slice(0, 5)) {
        await setDoc(doc(db, 'complaints', complaint.id), sanitizeForFirestore(complaint), { merge: true });
      }
    } catch (err) {
      console.info('[FirebaseComplaintRepository] Background seed notice:', err);
    }
  }

  getAll(): Complaint[] {
    return [...this.complaints];
  }

  getById(id: string): Complaint | undefined {
    return this.complaints.find((c) => c.id === id);
  }

  getByCitizenId(citizenId: string): Complaint[] {
    return this.complaints.filter((c) => c.citizenId === citizenId);
  }

  create(complaint: Complaint): Complaint {
    this.complaints.unshift(complaint);
    this.persistCache();

    // Async write to Firestore
    setDoc(doc(db, 'complaints', complaint.id), sanitizeForFirestore(complaint))
      .catch((err) => console.warn('[Firebase] Complaint sync error:', err));

    return complaint;
  }

  update(id: string, updates: Partial<Complaint>): Complaint | undefined {
    const idx = this.complaints.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;

    this.complaints[idx] = {
      ...this.complaints[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persistCache();

    // Async update to Firestore
    setDoc(doc(db, 'complaints', id), sanitizeForFirestore(updates), { merge: true })
      .catch((err) => console.warn('[Firebase] Complaint update sync error:', err));

    return this.complaints[idx];
  }

  saveAll(complaints: Complaint[]): void {
    this.complaints = [...complaints];
    this.persistCache();
  }

  reset(): Complaint[] {
    this.complaints = [...INITIAL_COMPLAINTS];
    this.persistCache();
    return [...this.complaints];
  }
}

/**
 * Firebase-backed AI Insight Repository
 */
export class FirebaseInsightRepository implements IInsightRepository {
  private insights: AIInsight[] = [];

  constructor() {
    this.loadInitialCache();
    this.initFirebaseSync();
  }

  private loadInitialCache(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.INSIGHTS);
      if (raw) {
        this.insights = JSON.parse(raw);
        return;
      }
    } catch {
      // Ignore
    }
    this.insights = [...INITIAL_AI_INSIGHTS];
  }

  private persistCache(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(this.insights));
    } catch {
      // Ignore
    }
  }

  private initFirebaseSync(): void {
    try {
      onSnapshot(
        collection(db, 'insights'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: AIInsight[] = [];
            snapshot.forEach((d) => list.push(d.data() as AIInsight));
            this.insights = list;
            this.persistCache();
          }
        },
        () => {
          // Fallback gracefully
        }
      );
    } catch {
      // Fallback
    }
  }

  getAll(): AIInsight[] {
    return [...this.insights];
  }

  getById(id: string): AIInsight | undefined {
    return this.insights.find((i) => i.id === id);
  }

  create(insight: AIInsight): AIInsight {
    this.insights.unshift(insight);
    this.persistCache();
    setDoc(doc(db, 'insights', insight.id), sanitizeForFirestore(insight))
      .catch(() => {});
    return insight;
  }

  update(id: string, updates: Partial<AIInsight>): AIInsight | undefined {
    const idx = this.insights.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    this.insights[idx] = { ...this.insights[idx], ...updates };
    this.persistCache();
    setDoc(doc(db, 'insights', id), sanitizeForFirestore(updates), { merge: true })
      .catch(() => {});
    return this.insights[idx];
  }

  saveAll(insights: AIInsight[]): void {
    this.insights = [...insights];
    this.persistCache();
  }

  reset(): AIInsight[] {
    this.insights = [...INITIAL_AI_INSIGHTS];
    this.persistCache();
    return [...this.insights];
  }
}

/**
 * Firebase-backed Notification Repository
 */
export class FirebaseNotificationRepository implements INotificationRepository {
  private notifications: NotificationItem[] = [];

  constructor() {
    this.loadInitialCache();
    this.initFirebaseSync();
  }

  private loadInitialCache(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (raw) {
        this.notifications = JSON.parse(raw);
        return;
      }
    } catch {
      // Ignore
    }
    this.notifications = [...DEFAULT_NOTIFICATIONS];
  }

  private persistCache(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
    } catch {
      // Ignore
    }
  }

  private initFirebaseSync(): void {
    try {
      onSnapshot(
        collection(db, 'notifications'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: NotificationItem[] = [];
            snapshot.forEach((d) => list.push(d.data() as NotificationItem));
            this.notifications = list;
            this.persistCache();
          }
        },
        () => {}
      );
    } catch {
      // Fallback
    }
  }

  getAll(): NotificationItem[] {
    return [...this.notifications];
  }

  saveAll(notifications: NotificationItem[]): void {
    this.notifications = [...notifications];
    this.persistCache();
  }

  create(notification: NotificationItem): NotificationItem {
    this.notifications.unshift(notification);
    this.persistCache();
    setDoc(doc(db, 'notifications', notification.id), sanitizeForFirestore(notification))
      .catch(() => {});
    return notification;
  }

  reset(): NotificationItem[] {
    this.notifications = [...DEFAULT_NOTIFICATIONS];
    this.persistCache();
    return [...this.notifications];
  }
}

/**
 * Hotspot Repository
 */
export class FirebaseHotspotRepository implements IHotspotRepository {
  private hotspots: Hotspot[] = [];

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HOTSPOTS);
      if (raw) {
        this.hotspots = JSON.parse(raw);
        return;
      }
    } catch {
      // Ignore
    }
    this.hotspots = [...INITIAL_HOTSPOTS];
  }

  getAll(): Hotspot[] {
    return [...this.hotspots];
  }

  getById(id: string): Hotspot | undefined {
    return this.hotspots.find((h) => h.id === id);
  }

  saveAll(hotspots: Hotspot[]): void {
    this.hotspots = [...hotspots];
    try {
      localStorage.setItem(STORAGE_KEYS.HOTSPOTS, JSON.stringify(this.hotspots));
    } catch {}
  }

  reset(): Hotspot[] {
    this.hotspots = [...INITIAL_HOTSPOTS];
    try {
      localStorage.setItem(STORAGE_KEYS.HOTSPOTS, JSON.stringify(this.hotspots));
    } catch {}
    return [...this.hotspots];
  }
}

/**
 * Auth Repository
 */
export class FirebaseAuthRepository implements IAuthRepository {
  private user: UserProfile = DEMO_CITIZEN_PROFILE;

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (raw) {
        this.user = JSON.parse(raw);
      }
    } catch {}
  }

  getCurrentUser(): UserProfile {
    return this.user;
  }

  saveCurrentUser(user: UserProfile): void {
    this.user = user;
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
    } catch {}
  }

  reset(): void {
    this.user = DEMO_CITIZEN_PROFILE;
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(this.user));
    } catch {}
  }
}
