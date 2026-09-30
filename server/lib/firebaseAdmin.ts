import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let adminApp: App | null = null;

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
export function getFirebaseAdminApp(): App | null {
  if (adminApp) return adminApp;

  try {
    const apps = getApps();
    if (apps.length > 0) {
      adminApp = apps[0]!;
      return adminApp;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
    if (!projectId) {
      if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
        throw new Error('[FirebaseAdmin] Missing Firebase project ID in production.');
      }
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
        const msg = `[FirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: ${e?.message || e}`;
        if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
          throw new Error(msg);
        }
        console.warn(msg);
      }
    }

    // Default initialization (works with GOOGLE_APPLICATION_CREDENTIALS or emulator)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIRESTORE_EMULATOR_HOST) {
      adminApp = initializeApp({
        projectId,
      });
      return adminApp;
    }

    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      throw new Error('[FirebaseAdmin] No valid credentials provided in production.');
    }
    return null;
  } catch (err: any) {
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      throw err;
    }
    console.info('[FirebaseAdmin] Admin SDK initialization notice:', err?.message || err);
    return null;
  }
}

/**
 * Cryptographically verifies a Firebase Auth ID Token using Firebase Admin SDK.
 * Throws an error if the token signature is invalid, expired, or malformed.
 */
export async function verifyFirebaseIdToken(token: string): Promise<DecodedIdToken> {
  const app = getFirebaseAdminApp();
  if (!app) {
    throw new Error('Firebase Admin SDK is not configured for token verification.');
  }

  // Cryptographically verifies signature using Google's public certificates,
  // audience against projectId, and validity period.
  return await getAuth(app).verifyIdToken(token, true);
}

/**
 * Returns admin Firestore instance if available, or null.
 */
export function getAdminFirestore(): Firestore | null {
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    const hasCredentials = !!process.env.FIREBASE_SERVICE_ACCOUNT || !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!hasCredentials) {
      throw new Error('[FirebaseAdmin] Firestore Admin is required in production but credentials are not configured.');
    }
  }

  const app = getFirebaseAdminApp();
  if (!app) {
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      throw new Error('[FirebaseAdmin] Firestore Admin is required in production but unavailable.');
    }
    return null;
  }
  try {
    return getFirestore(app);
  } catch (err: any) {
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      throw err;
    }
    return null;
  }
}


