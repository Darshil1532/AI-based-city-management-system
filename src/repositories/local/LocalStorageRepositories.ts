import {
  IComplaintRepository,
  IAuthRepository,
  IHotspotRepository,
  INotificationRepository,
  IInsightRepository,
} from '../types';
import {
  Complaint,
  UserProfile,
  Hotspot,
  NotificationItem,
  AIInsight,
} from '../../types';
import {
  INITIAL_COMPLAINTS,
  INITIAL_HOTSPOTS,
  INITIAL_AI_INSIGHTS,
} from '../../data/mockData';

// Demo personas
export const DEMO_CITIZEN_PROFILE: UserProfile = {
  id: 'CIT-DEMO-01',
  name: 'Demo Citizen',
  role: 'citizen',
  email: 'demo.citizen@smartcity.local',
  phone: '+91 98260 12345',
  title: 'Verified Resident • MP Nagar Ward 12',
  badge: 'Resident Account (Demo)',
};

export const DEMO_ADMIN_PROFILE: UserProfile = {
  id: 'ADM-DEMO-01',
  name: 'Demo Administrator',
  role: 'admin',
  email: 'admin@smartcity.local',
  phone: '+91 98260 54321',
  title: 'Municipal Operations Lead • Civic Command Center',
  badge: 'Clearance Level 4 (Admin)',
  department: 'Municipal Operations & Maintenance',
};

export const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-init-1',
    userId: 'admin',
    title: 'Hotspot Cluster Detected',
    message: 'Repeated pothole reports detected in Market Area. Verification advised.',
    timestamp: '15 mins ago',
    read: false,
    type: 'hotspot',
    link: '/admin/hotspots',
  },
  {
    id: 'notif-init-2',
    userId: 'admin',
    title: 'Admin Review Required: SC1024',
    message: 'Citizen reported high severity road damage. AI recommends High Priority & Public Works.',
    timestamp: '40 mins ago',
    read: false,
    type: 'admin_action',
    link: '/admin/complaint/SC1024',
  },
  {
    id: 'notif-init-3',
    userId: 'CIT-DEMO-01',
    title: 'Complaint Registered: SC1024',
    message: 'Your report regarding "Pothole / Road" has been logged and queued for administrative review.',
    timestamp: '40 mins ago',
    read: false,
    type: 'submission',
    link: '/track?id=SC1024',
  },
  {
    id: 'notif-init-4',
    userId: 'CIT-DEMO-01',
    title: 'Work Order Dispatched: SC1024',
    message: 'Public Works Department assigned field crew (Demo Municipal Officer). Resolution in progress.',
    timestamp: '10 mins ago',
    read: false,
    type: 'assigned',
    link: '/track?id=SC1024',
  },
];

const STORAGE_KEYS = {
  COMPLAINTS: 'smartcity_complaints_v2',
  AUTH: 'smartcity_auth_user_v2',
  HOTSPOTS: 'smartcity_hotspots_v2',
  NOTIFICATIONS: 'smartcity_notifications_v2',
  INSIGHTS: 'smartcity_insights_v2',
} as const;

/**
 * LocalStorage Complaint Repository Implementation
 */
export class LocalStorageComplaintRepository implements IComplaintRepository {
  private complaints: Complaint[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COMPLAINTS);
      if (raw) {
        this.complaints = JSON.parse(raw);
        return;
      }
    } catch (e) {
      console.warn('[LocalStorageComplaintRepository] Read error:', e);
    }
    this.complaints = [...INITIAL_COMPLAINTS];
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(this.complaints));
    } catch (e) {
      console.warn('[LocalStorageComplaintRepository] Write error:', e);
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
    this.persist();
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
    this.persist();
    return this.complaints[idx];
  }

  saveAll(complaints: Complaint[]): void {
    this.complaints = [...complaints];
    this.persist();
  }

  reset(): Complaint[] {
    this.complaints = [...INITIAL_COMPLAINTS];
    this.persist();
    return [...this.complaints];
  }
}

/**
 * LocalStorage Auth Repository Implementation
 */
export class LocalStorageAuthRepository implements IAuthRepository {
  private user: UserProfile = DEMO_CITIZEN_PROFILE;

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (raw) {
        this.user = JSON.parse(raw);
        return;
      }
    } catch (e) {
      console.warn('[LocalStorageAuthRepository] Read error:', e);
    }
    this.user = DEMO_CITIZEN_PROFILE;
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(this.user));
    } catch (e) {
      console.warn('[LocalStorageAuthRepository] Write error:', e);
    }
  }

  getCurrentUser(): UserProfile {
    return { ...this.user };
  }

  saveCurrentUser(user: UserProfile): void {
    this.user = { ...user };
    this.persist();
  }

  reset(): void {
    this.user = DEMO_CITIZEN_PROFILE;
    this.persist();
  }
}

/**
 * LocalStorage Hotspot Repository Implementation
 */
export class LocalStorageHotspotRepository implements IHotspotRepository {
  private hotspots: Hotspot[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HOTSPOTS);
      if (raw) {
        this.hotspots = JSON.parse(raw);
        return;
      }
    } catch (e) {
      console.warn('[LocalStorageHotspotRepository] Read error:', e);
    }
    this.hotspots = [...INITIAL_HOTSPOTS];
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.HOTSPOTS, JSON.stringify(this.hotspots));
    } catch (e) {
      console.warn('[LocalStorageHotspotRepository] Write error:', e);
    }
  }

  getAll(): Hotspot[] {
    return [...this.hotspots];
  }

  getById(id: string): Hotspot | undefined {
    return this.hotspots.find((h) => h.id === id);
  }

  saveAll(hotspots: Hotspot[]): void {
    this.hotspots = [...hotspots];
    this.persist();
  }

  reset(): Hotspot[] {
    this.hotspots = [...INITIAL_HOTSPOTS];
    this.persist();
    return [...this.hotspots];
  }
}

/**
 * LocalStorage Notification Repository Implementation
 */
export class LocalStorageNotificationRepository implements INotificationRepository {
  private notifications: NotificationItem[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (raw) {
        this.notifications = JSON.parse(raw);
        return;
      }
    } catch (e) {
      console.warn('[LocalStorageNotificationRepository] Read error:', e);
    }
    this.notifications = [...DEFAULT_NOTIFICATIONS];
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
    } catch (e) {
      console.warn('[LocalStorageNotificationRepository] Write error:', e);
    }
  }

  getAll(): NotificationItem[] {
    return [...this.notifications];
  }

  saveAll(notifications: NotificationItem[]): void {
    this.notifications = [...notifications];
    this.persist();
  }

  create(notification: NotificationItem): NotificationItem {
    this.notifications.unshift(notification);
    this.persist();
    return notification;
  }

  reset(): NotificationItem[] {
    this.notifications = [...DEFAULT_NOTIFICATIONS];
    this.persist();
    return [...this.notifications];
  }
}

/**
 * LocalStorage Insight Repository Implementation
 */
export class LocalStorageInsightRepository implements IInsightRepository {
  private insights: AIInsight[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.INSIGHTS);
      if (raw) {
        this.insights = JSON.parse(raw);
        return;
      }
    } catch (e) {
      console.warn('[LocalStorageInsightRepository] Read error:', e);
    }
    this.insights = [...INITIAL_AI_INSIGHTS];
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(this.insights));
    } catch (e) {
      console.warn('[LocalStorageInsightRepository] Write error:', e);
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
    this.persist();
    return insight;
  }

  update(id: string, updates: Partial<AIInsight>): AIInsight | undefined {
    const idx = this.insights.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    this.insights[idx] = { ...this.insights[idx], ...updates };
    this.persist();
    return this.insights[idx];
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
}
