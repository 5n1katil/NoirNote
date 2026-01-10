/**
 * NoirNote — Case Result Storage
 *
 * Client-side utility for saving case completion results to Firestore.
 */

import { collection, addDoc, serverTimestamp, waitForPendingWrites } from "firebase/firestore";
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
  score?: number; // Calculated score (only for wins)
  createdAt: unknown; // serverTimestamp placeholder
};

/**
 * Save case result to Firestore
 * Each attempt is saved as a separate document with auto-generated ID
 * This allows all attempts to be tracked in the history
 */
export async function saveCaseResult(
  caseId: string,
  durationMs: number,
  penaltyMs: number,
  attempts: number,
  isWin: boolean,
  score?: number
): Promise<void> {
  const { auth, db } = getFirebaseClient();

  // Check if user is already authenticated (faster path)
  if (auth.currentUser) {
    try {
      // Use collection().add() to create a new document with auto-generated ID
      // This ensures each attempt is saved as a separate document
      const resultsRef = collection(db, "results");

      // Build data object - ensure no undefined values are sent to Firestore
      const data: any = {
        uid: auth.currentUser.uid,
        caseId,
        finishedAt: Date.now(),
        durationMs,
        penaltyMs,
        attempts,
        isWin,
      };

      // Only add score if isWin is true and score is a valid number
      // Double-check score is valid before adding
      if (isWin) {
        const validScore = score !== undefined && 
                          score !== null && 
                          !isNaN(score) && 
                          typeof score === 'number' && 
                          isFinite(score);
        if (validScore) {
          data.score = score;
        } else {
          console.warn("[caseResult] Invalid score value, skipping:", score);
        }
      }

      console.log("[caseResult] Saving case result:", {
        caseId,
        isWin,
        score: data.score,
        attempts,
        hasScore: 'score' in data,
      });

      // With Firestore persistence enabled, addDoc will queue writes offline
      // and automatically sync when network is available
      // Remove any undefined, null, or invalid values before sending to Firestore
      const cleanData: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null && !(typeof value === 'number' && (isNaN(value) || !isFinite(value)))) {
          cleanData[key] = value;
        }
      }

      console.log("[caseResult] Clean data to send:", cleanData);

      // Create final document data - explicitly construct to avoid any undefined issues
      const docData: Record<string, any> = {
        uid: cleanData.uid,
        caseId: cleanData.caseId,
        finishedAt: cleanData.finishedAt,
        durationMs: cleanData.durationMs,
        penaltyMs: cleanData.penaltyMs,
        attempts: cleanData.attempts,
        isWin: cleanData.isWin,
        createdAt: serverTimestamp(),
      };

      // Only add score if it exists in cleanData (means it was valid)
      if ('score' in cleanData && cleanData.score !== undefined) {
        docData.score = cleanData.score;
      }

      await addDoc(resultsRef, docData);
      
      // Try to wait for write to complete (works online)
      // Offline writes are automatically queued by Firestore SDK
      try {
        await waitForPendingWrites(db);
      } catch (waitError: any) {
        // If offline, waitForPendingWrites may timeout - that's OK, write is queued
        if (waitError?.code === "unavailable" || waitError?.message?.includes("offline")) {
          console.log("[caseResult] Write queued offline, will sync when online");
        } else {
          // Other error, log but don't fail the operation
          console.warn("[caseResult] Failed to wait for pending writes:", waitError);
        }
      }
      return;
    } catch (error: any) {
      // Offline errors are expected and handled by Firestore persistence
      if (error?.code === "unavailable" || error?.message?.includes("offline")) {
        console.log("[caseResult] Result save queued offline, will sync when online");
        // Don't throw - Firestore persistence will handle the sync
        return;
      }
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
        // Use collection().add() to create a new document with auto-generated ID
        // This ensures each attempt is saved as a separate document
        const resultsRef = collection(db, "results");

        // Build data object - ensure no undefined values are sent to Firestore
        const data: any = {
          uid: user.uid,
          caseId,
          finishedAt: Date.now(),
          durationMs,
          penaltyMs,
          attempts,
          isWin,
        };

        // Only add score if isWin is true and score is a valid number
        // Double-check score is valid before adding
        if (isWin) {
          const validScore = score !== undefined && 
                            score !== null && 
                            !isNaN(score) && 
                            typeof score === 'number' && 
                            isFinite(score);
          if (validScore) {
            data.score = score;
          } else {
            console.warn("[caseResult] Invalid score value (auth callback), skipping:", score);
          }
        }

        console.log("[caseResult] Saving case result (auth callback):", {
          caseId,
          isWin,
          score: data.score,
          attempts,
          hasScore: 'score' in data,
        });

        // With Firestore persistence enabled, addDoc will queue writes offline
        // and automatically sync when network is available
        // Remove any undefined, null, or invalid values before sending to Firestore
        const cleanData: any = {};
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined && value !== null && !(typeof value === 'number' && (isNaN(value) || !isFinite(value)))) {
            cleanData[key] = value;
          }
        }

        console.log("[caseResult] Clean data to send (auth callback):", cleanData);

        // Create final document data - explicitly construct to avoid any undefined issues
        const docData: Record<string, any> = {
          uid: cleanData.uid,
          caseId: cleanData.caseId,
          finishedAt: cleanData.finishedAt,
          durationMs: cleanData.durationMs,
          penaltyMs: cleanData.penaltyMs,
          attempts: cleanData.attempts,
          isWin: cleanData.isWin,
          createdAt: serverTimestamp(),
        };

        // Only add score if it exists in cleanData (means it was valid)
        if ('score' in cleanData && cleanData.score !== undefined) {
          docData.score = cleanData.score;
        }

        await addDoc(resultsRef, docData);
        
        // Try to wait for write to complete (works online)
        // Offline writes are automatically queued by Firestore SDK
        try {
          await waitForPendingWrites(db);
        } catch (waitError: any) {
          // If offline, waitForPendingWrites may timeout - that's OK, write is queued
          if (waitError?.code === "unavailable" || waitError?.message?.includes("offline")) {
            console.log("[caseResult] Write queued offline, will sync when online");
          } else {
            // Other error, log but don't fail the operation
            console.warn("[caseResult] Failed to wait for pending writes:", waitError);
          }
        }
        resolve();
      } catch (error: any) {
        // Offline errors are expected and handled by Firestore persistence
        if (error?.code === "unavailable" || error?.message?.includes("offline")) {
          console.log("[caseResult] Result save queued offline, will sync when online");
          // Don't throw - Firestore persistence will handle the sync
          resolve();
          return;
        }
        console.error("[caseResult] Failed to save result:", error);
        reject(error);
      }
    });
  });
}

