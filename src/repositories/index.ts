import {
  LocalStorageComplaintRepository,
  LocalStorageAuthRepository,
  LocalStorageHotspotRepository,
  LocalStorageNotificationRepository,
  LocalStorageInsightRepository,
} from './local/LocalStorageRepositories';
import {
  IComplaintRepository,
  IAuthRepository,
  IHotspotRepository,
  INotificationRepository,
  IInsightRepository,
} from './types';

// Instantiate default LocalStorage repositories
const localComplaintRepo = new LocalStorageComplaintRepository();
const localAuthRepo = new LocalStorageAuthRepository();
const localHotspotRepo = new LocalStorageHotspotRepository();
const localNotificationRepo = new LocalStorageNotificationRepository();
const localInsightRepo = new LocalStorageInsightRepository();

/**
 * Repository Registry
 * Supplies repositories to application services.
 * Swap implementation here to transition between LocalStorage and Supabase/PostgreSQL.
 */
export const repositories = {
  complaints: localComplaintRepo as IComplaintRepository,
  auth: localAuthRepo as IAuthRepository,
  hotspots: localHotspotRepo as IHotspotRepository,
  notifications: localNotificationRepo as INotificationRepository,
  insights: localInsightRepo as IInsightRepository,
};

export * from './types';
export * from './local/LocalStorageRepositories';
export * from './supabase/SupabaseAdapters';
