import { NotificationItem } from '../../types';
import { INotificationRepository } from '../../repositories/types';
import { repositories } from '../../repositories';

export interface INotificationService {
  getForUser(userId: string, role: 'citizen' | 'admin'): NotificationItem[];
  add(item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem;
  markAsRead(id: string): void;
  markAllAsRead(userId: string): void;
  clear(userId: string): void;
  reset(): NotificationItem[];
}

export class NotificationService implements INotificationService {
  private repository: INotificationRepository;
  private notifications: NotificationItem[] = [];

  constructor(repository?: INotificationRepository) {
    this.repository = repository || repositories.notifications;
    this.notifications = this.repository.getAll();
  }

  private refreshFromRepository(): void {
    this.notifications = this.repository.getAll();
  }

  getForUser(userId: string, role: 'citizen' | 'admin'): NotificationItem[] {
    this.refreshFromRepository();
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
    const created = this.repository.create(newItem);
    this.refreshFromRepository();
    return created;
  }

  markAsRead(id: string): void {
    this.refreshFromRepository();
    const updated = this.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    this.repository.saveAll(updated);
    this.notifications = updated;
  }

  markAllAsRead(userId: string): void {
    this.refreshFromRepository();
    const updated = this.notifications.map((n) => {
      if (n.userId === userId || (userId === 'admin' && n.userId === 'all')) {
        return { ...n, read: true };
      }
      return n;
    });
    this.repository.saveAll(updated);
    this.notifications = updated;
  }

  clear(userId: string): void {
    this.refreshFromRepository();
    const filtered = this.notifications.filter((n) => n.userId !== userId);
    this.repository.saveAll(filtered);
    this.notifications = filtered;
  }

  reset(): NotificationItem[] {
    const list = this.repository.reset();
    this.notifications = [...list];
    return list;
  }
}

export const notificationService = new NotificationService();
