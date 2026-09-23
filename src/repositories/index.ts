import {
  FirebaseComplaintRepository,
  FirebaseAuthRepository,
  FirebaseHotspotRepository,
  FirebaseNotificationRepository,
  FirebaseInsightRepository,
} from './firebase/FirebaseRepositories';
import {
  IComplaintRepository,
  IAuthRepository,
  IHotspotRepository,
  INotificationRepository,
  IInsightRepository,
} from './types';

// Instantiate default Firebase-backed repositories
const firebaseComplaintRepo = new FirebaseComplaintRepository();
const firebaseAuthRepo = new FirebaseAuthRepository();
const firebaseHotspotRepo = new FirebaseHotspotRepository();
const firebaseNotificationRepo = new FirebaseNotificationRepository();
const firebaseInsightRepo = new FirebaseInsightRepository();

/**
 * Repository Registry
 * Supplies active repositories to application services.
 * Now backed by Google Cloud Firebase (Firestore & Auth).
 */
export const repositories = {
  complaints: firebaseComplaintRepo as IComplaintRepository,
  auth: firebaseAuthRepo as IAuthRepository,
  hotspots: firebaseHotspotRepo as IHotspotRepository,
  notifications: firebaseNotificationRepo as INotificationRepository,
  insights: firebaseInsightRepo as IInsightRepository,
};

export * from './types';
export * from './local/LocalStorageRepositories';
export * from './firebase/FirebaseRepositories';
export * from './supabase/SupabaseAdapters';
