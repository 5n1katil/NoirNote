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
  return new Promise((resolve, reject) => {
    const { auth, db } = getFirebaseClient();

    // Wait for auth state to ensure we have a user
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      unsubscribe(); // Clean up listener

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

