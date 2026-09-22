import {
  Complaint,
  Hotspot,
  NotificationItem,
  AIInsight,
  UserProfile,
} from '../types';

/**
 * Generic base repository contract for CRUD operations.
 * Prepared for plug-and-play persistence adapters (LocalStorage, Supabase, PostgreSQL).
 */
export interface IRepository<T, ID = string> {
  getAll(): T[] | Promise<T[]>;
  getById(id: ID): T | undefined | Promise<T | undefined>;
  create(item: T): T | Promise<T>;
  update(id: ID, partial: Partial<T>): T | undefined | Promise<T | undefined>;
  delete?(id: ID): boolean | Promise<boolean>;
}

/**
 * Complaint Repository Interface
 * Handles persistence and query access for municipal citizen complaints.
 */
export interface IComplaintRepository {
  getAll(): Complaint[];
  getById(id: string): Complaint | undefined;
  getByCitizenId(citizenId: string): Complaint[];
  create(complaint: Complaint): Complaint;
  update(id: string, updates: Partial<Complaint>): Complaint | undefined;
  saveAll(complaints: Complaint[]): void;
  reset(): Complaint[];
}

/**
 * Authentication & Profile Repository Interface
 * Handles persistence of authenticated user profile in the active session.
 */
export interface IAuthRepository {
  getCurrentUser(): UserProfile;
  saveCurrentUser(user: UserProfile): void;
  reset(): void;
}

/**
 * Hotspot Repository Interface
 * Handles detected recurring civic issue clusters and geospatial hotspots.
 */
export interface IHotspotRepository {
  getAll(): Hotspot[];
  getById(id: string): Hotspot | undefined;
  saveAll(hotspots: Hotspot[]): void;
  reset(): Hotspot[];
}

/**
 * Notification Repository Interface
 * Handles citizen-facing alert and update dispatches.
 */
export interface INotificationRepository {
  getAll(): NotificationItem[];
  saveAll(notifications: NotificationItem[]): void;
  create(notification: NotificationItem): NotificationItem;
  reset(): NotificationItem[];
}

/**
 * Insight Repository Interface
 * Handles AI-generated systemic municipal insights and preventive recommendations.
 */
export interface IInsightRepository {
  getAll(): AIInsight[];
  getById(id: string): AIInsight | undefined;
  create(insight: AIInsight): AIInsight;
  update(id: string, updates: Partial<AIInsight>): AIInsight | undefined;
  saveAll(insights: AIInsight[]): void;
  reset(): AIInsight[];
}
