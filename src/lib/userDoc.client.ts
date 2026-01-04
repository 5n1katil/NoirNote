import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase.client";

export type FirestoreUserDoc = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: unknown; // serverTimestamp placeholder
};

export async function ensureUserDoc(user: User): Promise<void> {
  const fb = getFirebaseClient();
  if (!fb) return;

  const ref = doc(fb.db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  const data: FirestoreUserDoc = {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    createdAt: serverTimestamp(),
  };

  await setDoc(ref, data, { merge: false });
}

