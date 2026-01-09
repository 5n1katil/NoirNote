import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { 
  getFirestore, 
  type Firestore,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence
} from "firebase/firestore";
import { firebasePublicConfig } from "./firebase.config";

function assertConfig() {
  const entries = Object.entries(firebasePublicConfig);
  const missing = entries.filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    throw new Error(
      `[firebase] Missing env values: ${missing.join(
        ", "
      )}. Check .env.local and restart dev server.`
    );
  }
}

export type FirebaseClient = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

// Singleton to ensure persistence is only enabled once
let persistenceEnabled = false;

export function getFirebaseClient(): FirebaseClient {
  if (typeof window === "undefined") {
    throw new Error(
      "[firebase] getFirebaseClient() must be called in the browser (client component)."
    );
  }

  assertConfig();

  const app = getApps().length ? getApp() : initializeApp(firebasePublicConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Enable Firestore persistence for offline support and faster subsequent loads
  // This only needs to be called once, even if getFirebaseClient() is called multiple times
  if (!persistenceEnabled && typeof window !== "undefined") {
    persistenceEnabled = true;
    
    // Try single-tab persistence first (faster, lower memory)
    enableIndexedDbPersistence(db).catch((err) => {
      // If persistence fails due to multi-tab being open or browser not supporting it,
      // fall back to multi-tab persistence
      if (err.code === "failed-precondition") {
        // Multiple tabs open, use multi-tab persistence
        enableMultiTabIndexedDbPersistence(db).catch(() => {
          // Browser doesn't support persistence, continue without it
          console.warn("[firebase] Firestore persistence not available");
        });
      } else if (err.code === "unimplemented") {
        // Browser doesn't support IndexedDB, continue without persistence
        console.warn("[firebase] Firestore persistence not supported in this browser");
      } else {
        // Other error, log but continue
        console.error("[firebase] Failed to enable Firestore persistence:", err);
      }
    });
  }

  return { app, auth, db };
}
