import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase.client";

export type FirestoreUserDoc = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  detectiveUsername: string | null;
  avatar: string | null;
  bio: string | null; // User profile bio (max 200 words)
  profileSetupCompleted: boolean;
  createdAt: unknown; // serverTimestamp placeholder
};

/**
 * Ensure user document exists in Firestore
 * Creates it if it doesn't exist
 */
export async function ensureUserDoc(user: User): Promise<void> {
  const { db } = getFirebaseClient();

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  const data: FirestoreUserDoc = {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    detectiveUsername: null,
    avatar: null,
    bio: null,
    profileSetupCompleted: false,
    createdAt: serverTimestamp(),
  };

  await setDoc(ref, data, { merge: false });
}

/**
 * Get user document from Firestore
 */
export async function getUserDoc(uid: string): Promise<FirestoreUserDoc | null> {
  const { db } = getFirebaseClient();
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as FirestoreUserDoc;
}

/**
 * Update user document in Firestore
 */
export async function updateUserDoc(
  uid: string,
  updates: Partial<Omit<FirestoreUserDoc, "uid" | "createdAt">>
): Promise<void> {
  const { db } = getFirebaseClient();
  const ref = doc(db, "users", uid);
  await setDoc(ref, updates, { merge: true });
}