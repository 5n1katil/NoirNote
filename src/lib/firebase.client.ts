import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { firebasePublicConfig } from "./firebase.config";

function assertConfig() {
  const entries = Object.entries(firebasePublicConfig);
  const missing = entries.filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    throw new Error(`[firebase] Missing env values: ${missing.join(", ")}. Check .env.local and restart dev server.`);
  }
}

export function getFirebaseClient(): { app: FirebaseApp; auth: Auth } {
  if (typeof window === "undefined") {
    throw new Error("[firebase] getFirebaseClient() must be called in the browser (client component).");
  }

  assertConfig();

  const app = getApps().length ? getApp() : initializeApp(firebasePublicConfig);
  const auth = getAuth(app);

  return { app, auth };
}
