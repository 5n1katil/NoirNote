import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
  GoogleAuthProvider,
  type AuthProvider,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

type FirebaseClient = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  googleProvider: AuthProvider;
};

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

let cached: FirebaseClient | null | undefined;

/**
 * Client-side Firebase accessor.
 * - Returns `null` if required env vars are missing (UI should show a friendly message).
 * - Memoized for repeated imports/calls.
 */
export function getFirebaseClient(): FirebaseClient | null {
  if (cached !== undefined) return cached;

  const apiKey = optionalEnv("NEXT_PUBLIC_FIREBASE_API_KEY");
  const authDomain = optionalEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  const projectId = optionalEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  const storageBucket = optionalEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  const messagingSenderId = optionalEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  const appId = optionalEnv("NEXT_PUBLIC_FIREBASE_APP_ID");

  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !storageBucket ||
    !messagingSenderId ||
    !appId
  ) {
    cached = null;
    return cached;
  }

  const config = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };

  const app = getApps().length ? getApps()[0]! : initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const googleProvider = new GoogleAuthProvider();

  cached = { app, auth, db, googleProvider };
  return cached;
}

