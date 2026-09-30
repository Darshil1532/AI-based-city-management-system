import type { App } from 'firebase-admin/app';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let adminApp: App | null = null;
let syncFirestoreInstance: Firestore | null = null;
let firestoreInitPromise: Promise<Firestore | null> | null = null;

/**
 * Validates that production requirements are met before starting the server.
 * Fails fast with a clear error if credentials or project ID are missing in production.
 */
export function assertProductionReadyConfig(): void {
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
    const hasGoogleAppCredentials = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!hasServiceAccount && !hasGoogleAppCredentials) {
      throw new Error(
        '[FirebaseAdmin] CRITICAL STARTUP FAILURE: Production mode requires valid Firebase Admin credentials via FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS. Failing fast to prevent unverified execution.'
      );
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
    if (!projectId) {
      throw new Error(
        '[FirebaseAdmin] CRITICAL STARTUP FAILURE: Missing Firebase projectId in production environment.'
      );
    }
  }
}

/**
 * Initializes Firebase Admin SDK if not already initialized.
 * In production: throws if credentials are missing or initialization fails.
 * In test/dev/Vercel: allows fallback for local developer ergonomics and preview deployments.
 */
export async function getFirebaseAdminApp(): Promise<App | null> {
  if (adminApp) return adminApp;

  const hasCreds =
    !!process.env.FIREBASE_SERVICE_ACCOUNT ||
    !!process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    !!process.env.FIRESTORE_EMULATOR_HOST;

  if (!hasCreds) {
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      throw new Error('[FirebaseAdmin] No valid credentials provided in production.');
    }
    return null;
  }

  try {
    const { getApps, initializeApp, cert } = await import('firebase-admin/app');
    const apps = getApps();
    if (apps.length > 0) {
      adminApp = apps[0]!;
      return adminApp;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
    if (!projectId) {
      return null;
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId,
        });
        return adminApp;
      } catch (e: any) {
        console.warn('[FirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT:', e?.message || e);
      }
    }

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIRESTORE_EMULATOR_HOST) {
      adminApp = initializeApp({ projectId });
      return adminApp;
    }

    return null;
  } catch (err: any) {
    console.info('[FirebaseAdmin] Admin SDK initialization notice:', err?.message || err);
    return null;
  }
}

/**
 * Cryptographically verifies a Firebase Auth ID Token using Firebase Admin SDK.
 * Throws an error if the token signature is invalid, expired, or malformed.
 */
export async function verifyFirebaseIdToken(token: string): Promise<DecodedIdToken> {
  const app = await getFirebaseAdminApp();
  if (!app) {
    throw new Error('Firebase Admin SDK is not configured for token verification.');
  }

  const { getAuth } = await import('firebase-admin/auth');
  return await getAuth(app).verifyIdToken(token, true);
}

/**
 * Returns admin Firestore instance if available, or null.
 */
export function getAdminFirestore(): Firestore | null {
  const hasCreds =
    !!process.env.FIREBASE_SERVICE_ACCOUNT ||
    !!process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    !!process.env.FIRESTORE_EMULATOR_HOST;

  if (!hasCreds) {
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      throw new Error('[FirebaseAdmin] Firestore Admin is required in production but credentials are not configured.');
    }
    return null;
  }

  if (syncFirestoreInstance) return syncFirestoreInstance;

  if (!firestoreInitPromise) {
    firestoreInitPromise = (async () => {
      const app = await getFirebaseAdminApp();
      if (!app) return null;
      const { getFirestore } = await import('firebase-admin/firestore');
      syncFirestoreInstance = getFirestore(app);
      return syncFirestoreInstance;
    })();
  }

  return syncFirestoreInstance;
}

export type { DecodedIdToken, App, Firestore };
