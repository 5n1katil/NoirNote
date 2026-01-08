/**
 * NoirNote — Active Case Firestore Utilities
 *
 * Manages active case state in Firestore: users/{uid}/activeCase/{caseId}
 */

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase.client";
import type { GridState } from "@/types/grid";

export type ActiveCase = {
  caseId: string;
  status: "playing" | "finished";
  startedAt: number; // Timestamp (milliseconds)
  attempts: number;
  penaltyMs: number; // Total penalty time in milliseconds
  gridState: GridState;
  updatedAt: unknown; // serverTimestamp placeholder
};

/**
 * Get active case for current user
 */
export async function getActiveCase(caseId: string): Promise<ActiveCase | null> {
  const { auth, db } = getFirebaseClient();

  // Check if user is already authenticated (faster path)
  if (auth.currentUser) {
    try {
      const ref = doc(db, "users", auth.currentUser.uid, "activeCase", caseId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        return snap.data() as ActiveCase;
      }
      return null;
    } catch (error) {
      console.error("[activeCase] Failed to get active case:", error);
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
        reject(new Error("[activeCase] Auth state timeout"));
      }
    }, 5000); // 5 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      unsubscribe();

      if (!user) {
        resolve(null);
        return;
      }

      try {
        const ref = doc(db, "users", user.uid, "activeCase", caseId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          resolve(snap.data() as ActiveCase);
        } else {
          resolve(null);
        }
      } catch (error) {
        console.error("[activeCase] Failed to get active case:", error);
        reject(error);
      }
    });
  });
}

/**
 * Initialize or update active case
 */
export async function saveActiveCase(activeCase: Omit<ActiveCase, "updatedAt">): Promise<void> {
  const { auth, db } = getFirebaseClient();

  // Check if user is already authenticated (faster path)
  if (auth.currentUser) {
    try {
      const ref = doc(db, "users", auth.currentUser.uid, "activeCase", activeCase.caseId);
      await setDoc(
        ref,
        {
          ...activeCase,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return;
    } catch (error) {
      console.error("[activeCase] Failed to save active case:", error);
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
        reject(new Error("[activeCase] Auth state timeout"));
      }
    }, 5000); // 5 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      unsubscribe();

      if (!user) {
        reject(new Error("[activeCase] User not authenticated"));
        return;
      }

      try {
        const ref = doc(db, "users", user.uid, "activeCase", activeCase.caseId);
        await setDoc(
          ref,
          {
            ...activeCase,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        resolve();
      } catch (error) {
        console.error("[activeCase] Failed to save active case:", error);
        reject(error);
      }
    });
  });
}

/**
 * Initialize new active case
 */
export async function initializeActiveCase(
  caseId: string,
  initialGridState: GridState
): Promise<ActiveCase> {
  const newActiveCase: Omit<ActiveCase, "updatedAt"> = {
    caseId,
    status: "playing",
    startedAt: Date.now(),
    attempts: 0,
    penaltyMs: 0,
    gridState: initialGridState,
  };

  await saveActiveCase(newActiveCase);
  return newActiveCase as ActiveCase;
}

