import { NotificationItem } from '../../types';

const STORAGE_KEY = 'smartcity_notifications_v2';

export interface INotificationService {
  getForUser(userId: string, role: 'citizen' | 'admin'): NotificationItem[];
  add(item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem;
  markAsRead(id: string): void;
  markAllAsRead(userId: string): void;
  clear(userId: string): void;
  reset(): NotificationItem[];
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
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
    title: 'Status Update: SC1024 Assigned',
    message: 'Public Works Department field team has been assigned to inspect your report.',
    timestamp: '10 mins ago',
    read: false,
    type: 'assigned',
    link: '/track?id=SC1024',
  },
];

export class NotificationService implements INotificationService {
  private notifications: NotificationItem[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.notifications = JSON.parse(saved);
        return;
      }
    } catch (e) {
      console.warn('[NotificationService] Could not read from localStorage:', e);
    }
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (e) {
      console.warn('[NotificationService] Could not write to localStorage:', e);
    }
  }

  getForUser(userId: string, role: 'citizen' | 'admin'): NotificationItem[] {
    return this.notifications.filter((n) => {
      if (role === 'admin') {
        // Admin gets admin and all-system notifications
        return n.userId === 'admin' || n.userId === 'all';
      }
      // Citizen only gets notifications targeted to their own citizenId or all
      return n.userId === userId || n.userId === 'all';
    });
  }

  add(item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem {
    const newItem: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: 'Just now',
      read: false,
    };
    this.notifications = [newItem, ...this.notifications];
    this.persist();
    return newItem;
  }

  markAsRead(id: string): void {
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    this.persist();
  }

  markAllAsRead(userId: string): void {
    this.notifications = this.notifications.map((n) => {
      if (n.userId === userId || (userId === 'admin' && n.userId === 'all')) {
        return { ...n, read: true };
      }
      return n;
    });
    this.persist();
  }

  clear(userId: string): void {
    this.notifications = this.notifications.filter((n) => n.userId !== userId);
    this.persist();
  }

  reset(): NotificationItem[] {
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.persist();
    return [...this.notifications];
  }
}

export const notificationService = new NotificationService();
