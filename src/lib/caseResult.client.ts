/**
 * NoirNote — Case Result Storage
 *
 * Client-side utility for saving case completion results to Firestore.
 */

import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase.client";

export type CaseResult = {
  uid: string;
  caseId: string;
  finishedAt: number; // Timestamp (milliseconds)
  durationMs: number; // Total duration including penalties
  penaltyMs: number; // Total penalty time in milliseconds
  attempts: number;
  isWin: boolean; // true if correct solution
  createdAt: unknown; // serverTimestamp placeholder
};

/**
 * Save case result to Firestore
 * Document ID format: {uid}_{caseId}
 */
export async function saveCaseResult(
  caseId: string,
  durationMs: number,
  penaltyMs: number,
  attempts: number,
  isWin: boolean
): Promise<void> {
  const { auth, db } = getFirebaseClient();

  // Check if user is already authenticated (faster path)
  if (auth.currentUser) {
    try {
      const docId = `${auth.currentUser.uid}_${caseId}`;
      const ref = doc(db, "results", docId);

      const data: CaseResult = {
        uid: auth.currentUser.uid,
        caseId,
        finishedAt: Date.now(),
        durationMs,
        penaltyMs,
        attempts,
        isWin,
        createdAt: serverTimestamp(),
      };

      await setDoc(ref, data, { merge: true });
      return;
    } catch (error) {
      console.error("[caseResult] Failed to save result:", error);
      throw error;
    }
  }

  // Wait for auth state if not ready yet
  return new Promise((resolve, reject) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        reject(new Error("[caseResult] Auth state timeout"));
      }
    }, 5000); // 5 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      unsubscribe();

      if (!user) {
        reject(new Error("[caseResult] User not authenticated"));
        return;
      }

      try {
        const docId = `${user.uid}_${caseId}`;
        const ref = doc(db, "results", docId);

        const data: CaseResult = {
          uid: user.uid,
          caseId,
          finishedAt: Date.now(),
          durationMs,
          penaltyMs,
          attempts,
          isWin,
          createdAt: serverTimestamp(),
        };

        await setDoc(ref, data, { merge: true });
        resolve();
      } catch (error) {
        console.error("[caseResult] Failed to save result:", error);
        reject(error);
      }
    });
  });
}

