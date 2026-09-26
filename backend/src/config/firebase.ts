import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let firebaseInitialized = false;

// Target service account JSON filename
const JSON_FILENAME = 'adaptive-learning-d9d6c-firebase-adminsdk-fbsvc-b6d3f60c35.json';

const candidatePaths = [
  path.resolve(process.cwd(), JSON_FILENAME),
  path.resolve(process.cwd(), 'backend', JSON_FILENAME),
  `C:\\Users\\galli\\OneDrive\\Desktop\\Adaptive Learning\\backend\\${JSON_FILENAME}`,
];

let loadedServiceAccountPath: string | null = null;

for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    loadedServiceAccountPath = p;
    break;
  }
}

if (!admin.apps.length) {
  // 1. Primary: Load service account from JSON file if present
  if (loadedServiceAccountPath) {
    try {
      const rawJson = fs.readFileSync(loadedServiceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(rawJson);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInitialized = true;
      console.log('[Firebase Admin] Successfully initialized using local service account JSON.');
    } catch (error) {
      console.error(
        '[Firebase Admin] Error initializing from service account JSON:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // 2. Fallback: Load service account credentials from process.env if JSON initialization did not run/succeed
  if (!firebaseInitialized) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKeyRaw) {
      try {
        const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        firebaseInitialized = true;
        console.log('[Firebase Admin] Successfully initialized using environment variables.');
      } catch (error) {
        console.error(
          '[Firebase Admin] Error initializing from environment variables:',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    } else {
      console.warn(
        '[Firebase Admin] Neither service account JSON file nor complete environment credentials were provided. SDK initialization deferred.'
      );
    }
  }
} else {
  firebaseInitialized = true;
}

export function isFirebaseConfigured(): boolean {
  return firebaseInitialized && admin.apps.length > 0;
}

export const db = isFirebaseConfigured() ? admin.firestore() : null;
export const auth = isFirebaseConfigured() ? admin.auth() : null;
export { admin };
