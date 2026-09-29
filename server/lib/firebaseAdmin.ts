import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let adminApp: App | null = null;

/**
 * Initializes Firebase Admin SDK if not already initialized.
 * Can use default credentials, service account environment variable, or projectId fallback.
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
      } catch (e) {
        console.warn('[FirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e);
      }
    }

    // Default initialization (works with GOOGLE_APPLICATION_CREDENTIALS or gcloud environment)
    adminApp = initializeApp({
      projectId,
    });
    return adminApp;
  } catch (err: any) {
    // If running in test or local mode without GCP credentials, initializeApp might throw on credential check
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
  const app = getFirebaseAdminApp();
  if (!app) return null;
  try {
    return getFirestore(app);
  } catch {
    return null;
  }
}

