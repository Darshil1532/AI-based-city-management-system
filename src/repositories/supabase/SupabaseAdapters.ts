/**
 * Future Supabase / PostgreSQL Adapter
 * 
 * ARCHITECTURE NOTE:
 * This module defines the plug-and-play adapter layer for transitioning from demo LocalStorage
 * to a durable PostgreSQL database via Supabase or Cloud SQL.
 * 
 * Target PostgreSQL Schema:
 * ```sql
 * CREATE TABLE complaints (
 *   id TEXT PRIMARY KEY,
 *   citizen_id TEXT NOT NULL REFERENCES auth.users(id),
 *   citizen_name TEXT NOT NULL,
 *   citizen_phone TEXT,
 *   citizen_email TEXT,
 *   description TEXT NOT NULL,
 *   category TEXT NOT NULL,
 *   priority TEXT NOT NULL,
 *   department TEXT,
 *   status TEXT NOT NULL DEFAULT 'submitted',
 *   latitude DOUBLE PRECISION NOT NULL,
 *   longitude DOUBLE PRECISION NOT NULL,
 *   address TEXT NOT NULL,
 *   landmark TEXT,
 *   ward TEXT,
 *   ai_confidence DOUBLE PRECISION,
 *   ai_reasoning TEXT,
 *   ai_priority TEXT,
 *   ai_department TEXT,
 *   ai_category TEXT,
 *   review_decision TEXT DEFAULT 'pending',
 *   assigned_department TEXT,
 *   assigned_officer TEXT,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 * 
 * -- Row Level Security (RLS) Policy Example:
 * ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Citizens can view and track their own complaints"
 *   ON complaints FOR SELECT USING (auth.uid() = citizen_id);
 * CREATE POLICY "Citizens can create complaints"
 *   ON complaints FOR INSERT WITH CHECK (auth.uid() = citizen_id);
 * CREATE POLICY "Municipal Admins have full access"
 *   ON complaints FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
 * ```
 */

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

export interface SupabaseClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Adapter skeleton for Supabase Complaint operations.
 * When Supabase environment variables are provided, this adapter bridges
 * repository calls to Supabase REST / PostgREST queries.
 */
export class SupabaseComplaintAdapter implements IComplaintRepository {
  private fallbackLocal: IComplaintRepository;
  private config?: SupabaseClientConfig;

  constructor(fallbackLocal: IComplaintRepository, config?: SupabaseClientConfig) {
    this.fallbackLocal = fallbackLocal;
    this.config = config;
  }

  isConfigured(): boolean {
    return !!(this.config?.supabaseUrl && this.config?.supabaseAnonKey);
  }

  getAll(): Complaint[] {
    if (!this.isConfigured()) {
      return this.fallbackLocal.getAll();
    }
    // Future: const { data } = await supabase.from('complaints').select('*');
    return this.fallbackLocal.getAll();
  }

  getById(id: string): Complaint | undefined {
    if (!this.isConfigured()) {
      return this.fallbackLocal.getById(id);
    }
    // Future: const { data } = await supabase.from('complaints').select('*').eq('id', id).single();
    return this.fallbackLocal.getById(id);
  }

  getByCitizenId(citizenId: string): Complaint[] {
    if (!this.isConfigured()) {
      return this.fallbackLocal.getByCitizenId(citizenId);
    }
    // Future: const { data } = await supabase.from('complaints').select('*').eq('citizen_id', citizenId);
    return this.fallbackLocal.getByCitizenId(citizenId);
  }

  create(complaint: Complaint): Complaint {
    if (!this.isConfigured()) {
      return this.fallbackLocal.create(complaint);
    }
    // Future: await supabase.from('complaints').insert(mapToDb(complaint));
    return this.fallbackLocal.create(complaint);
  }

  update(id: string, updates: Partial<Complaint>): Complaint | undefined {
    if (!this.isConfigured()) {
      return this.fallbackLocal.update(id, updates);
    }
    // Future: await supabase.from('complaints').update(mapToDb(updates)).eq('id', id);
    return this.fallbackLocal.update(id, updates);
  }

  saveAll(complaints: Complaint[]): void {
    this.fallbackLocal.saveAll(complaints);
  }

  reset(): Complaint[] {
    return this.fallbackLocal.reset();
  }
}

/**
 * Adapter skeleton for Supabase Auth / PostgreSQL profiles.
 */
export class SupabaseAuthAdapter implements IAuthRepository {
  private fallbackLocal: IAuthRepository;

  constructor(fallbackLocal: IAuthRepository) {
    this.fallbackLocal = fallbackLocal;
  }

  getCurrentUser(): UserProfile {
    // Future: read user from supabase.auth.getUser() / user session
    return this.fallbackLocal.getCurrentUser();
  }

  saveCurrentUser(user: UserProfile): void {
    this.fallbackLocal.saveCurrentUser(user);
  }

  reset(): void {
    this.fallbackLocal.reset();
  }
}

/**
 * Adapter skeleton for Supabase Hotspot operations.
 */
export class SupabaseHotspotAdapter implements IHotspotRepository {
  private fallbackLocal: IHotspotRepository;

  constructor(fallbackLocal: IHotspotRepository) {
    this.fallbackLocal = fallbackLocal;
  }

  getAll(): Hotspot[] {
    return this.fallbackLocal.getAll();
  }

  getById(id: string): Hotspot | undefined {
    return this.fallbackLocal.getById(id);
  }

  saveAll(hotspots: Hotspot[]): void {
    this.fallbackLocal.saveAll(hotspots);
  }

  reset(): Hotspot[] {
    return this.fallbackLocal.reset();
  }
}

/**
 * Adapter skeleton for Supabase Notification operations.
 */
export class SupabaseNotificationAdapter implements INotificationRepository {
  private fallbackLocal: INotificationRepository;

  constructor(fallbackLocal: INotificationRepository) {
    this.fallbackLocal = fallbackLocal;
  }

  getAll(): NotificationItem[] {
    return this.fallbackLocal.getAll();
  }

  create(notification: NotificationItem): NotificationItem {
    return this.fallbackLocal.create(notification);
  }

  saveAll(notifications: NotificationItem[]): void {
    this.fallbackLocal.saveAll(notifications);
  }

  reset(): NotificationItem[] {
    return this.fallbackLocal.reset();
  }
}

/**
 * Adapter skeleton for Supabase Municipal Insights operations.
 */
export class SupabaseInsightAdapter implements IInsightRepository {
  private fallbackLocal: IInsightRepository;

  constructor(fallbackLocal: IInsightRepository) {
    this.fallbackLocal = fallbackLocal;
  }

  getAll(): AIInsight[] {
    return this.fallbackLocal.getAll();
  }

  getById(id: string): AIInsight | undefined {
    return this.fallbackLocal.getById(id);
  }

  create(insight: AIInsight): AIInsight {
    return this.fallbackLocal.create(insight);
  }

  update(id: string, updates: Partial<AIInsight>): AIInsight | undefined {
    return this.fallbackLocal.update(id, updates);
  }

  saveAll(insights: AIInsight[]): void {
    this.fallbackLocal.saveAll(insights);
  }

  reset(): AIInsight[] {
    return this.fallbackLocal.reset();
  }
}
