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

// Default instances
let firebaseComplaintRepo: IComplaintRepository | null = null;
let firebaseAuthRepo: IAuthRepository | null = null;
let firebaseHotspotRepo: IHotspotRepository | null = null;
let firebaseNotificationRepo: INotificationRepository | null = null;
let firebaseInsightRepo: IInsightRepository | null = null;

export const repositories = {
  get complaints(): IComplaintRepository {
    if (!firebaseComplaintRepo) {
      firebaseComplaintRepo = new FirebaseComplaintRepository();
    }
    return firebaseComplaintRepo;
  },
  get auth(): IAuthRepository {
    if (!firebaseAuthRepo) {
      firebaseAuthRepo = new FirebaseAuthRepository();
    }
    return firebaseAuthRepo;
  },
  get hotspots(): IHotspotRepository {
    if (!firebaseHotspotRepo) {
      firebaseHotspotRepo = new FirebaseHotspotRepository();
    }
    return firebaseHotspotRepo;
  },
  get notifications(): INotificationRepository {
    if (!firebaseNotificationRepo) {
      firebaseNotificationRepo = new FirebaseNotificationRepository();
    }
    return firebaseNotificationRepo;
  },
  get insights(): IInsightRepository {
    if (!firebaseInsightRepo) {
      firebaseInsightRepo = new FirebaseInsightRepository();
    }
    return firebaseInsightRepo;
  },
};

export * from './types';
export * from './local/LocalStorageRepositories';
export * from './firebase/FirebaseRepositories';
export * from './supabase/SupabaseAdapters';
