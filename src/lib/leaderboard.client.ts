/**
 * NoirNote — Leaderboard Firestore Utilities
 *
 * Manages leaderboards:
 * - leaderboard/global: Global rankings
 * - leaderboard/{caseId}: Case-specific rankings
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  setDoc, 
  serverTimestamp,
  where,
  enableNetwork,
  disableNetwork,
  waitForPendingWrites,
  type QueryDocumentSnapshot 
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase.client";
import { getUserStats, type UserStats } from "./userStats.client";

export type LeaderboardEntry = {
  uid: string;
  displayName: string;
  photoURL?: string;
  score: number;
  durationMs?: number; // For case-specific leaderboards
  attempts?: number; // For case-specific leaderboards
  solvedCases?: number; // For global leaderboard
  rank?: number; // Calculated on client
  updatedAt: unknown; // serverTimestamp placeholder
};

/**
 * Update global leaderboard entry for a user
 */
export async function updateGlobalLeaderboard(
  uid: string,
  displayName: string,
  photoURL: string | null,
  totalScore: number,
  solvedCases: number
): Promise<void> {
  const { db } = getFirebaseClient();

  try {
    const ref = doc(db, "leaderboard", "global", "entries", uid);
    // With Firestore persistence enabled, setDoc will queue writes offline
    // and automatically sync when network is available
    await setDoc(
      ref,
      {
        uid,
        displayName,
        photoURL: photoURL || null,
        score: totalScore,
        solvedCases,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    
    // Try to wait for write to complete (works online)
    // Offline writes are automatically queued by Firestore SDK
    try {
      await waitForPendingWrites(db);
    } catch (waitError: any) {
      // If offline, waitForPendingWrites may timeout - that's OK, write is queued
      if (waitError?.code === "unavailable" || waitError?.message?.includes("offline")) {
        console.log("[leaderboard] Write queued offline, will sync when online");
      } else {
        // Other error, log but don't fail the operation
        console.warn("[leaderboard] Failed to wait for pending writes:", waitError);
      }
    }
  } catch (error: any) {
    // Offline errors are expected and handled by Firestore persistence
    if (error?.code === "unavailable" || error?.message?.includes("offline")) {
      console.log("[leaderboard] Global leaderboard update queued offline, will sync when online");
      // Don't throw - Firestore persistence will handle the sync
      return;
    }
    console.error("[leaderboard] Failed to update global leaderboard:", error);
    throw error;
  }
}

/**
 * Update case-specific leaderboard entry
 */
export async function updateCaseLeaderboard(
  uid: string,
  displayName: string,
  photoURL: string | null,
  caseId: string,
  score: number,
  durationMs: number,
  attempts: number
): Promise<void> {
  const { db } = getFirebaseClient();

  try {
    // CRITICAL: Only update leaderboard on first attempt (attempts === 1)
    // Subsequent attempts should not update the leaderboard, only the profile stats
    if (attempts !== 1) {
      console.log("[leaderboard] Skipping leaderboard update - not first attempt (attempts:", attempts, ")");
      return;
    }

    console.log("[leaderboard] Updating case leaderboard for first attempt:", { caseId, uid, score, attempts });

    const ref = doc(db, "leaderboard", caseId, "entries", uid);
    
    // Check if existing entry exists (first attempt already recorded)
    let existing;
    try {
      // Try cache first (works offline)
      existing = await getDoc(ref);
    } catch (cacheError: any) {
      // If cache miss and offline, allow update to proceed (first attempt should be recorded)
      // This ensures first attempt scores are recorded even when offline
      if (cacheError?.code === "unavailable" || cacheError?.message?.includes("offline")) {
        console.log("[leaderboard] Offline mode: cache miss, will create first attempt entry");
        existing = null as any; // Allow update to proceed
      } else {
        throw cacheError;
      }
    }
    
    // If existing entry exists, first attempt already recorded - skip update
    if (existing?.exists()) {
      const existingData = existing.data() as LeaderboardEntry;
      console.log("[leaderboard] First attempt already recorded for this case, skipping update. Existing score:", existingData.score);
      return; // Don't update if first attempt already recorded
    }

    console.log("[leaderboard] Creating new leaderboard entry for first attempt:", { caseId, uid, score, durationMs, attempts });

    // With Firestore persistence enabled, setDoc will queue writes offline
    // and automatically sync when network is available
    await setDoc(
      ref,
      {
        uid,
        displayName,
        photoURL: photoURL || null,
        score,
        durationMs,
        attempts,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    
    // Try to wait for write to complete (works online)
    // Offline writes are automatically queued by Firestore SDK
    try {
      await waitForPendingWrites(db);
    } catch (waitError: any) {
      // If offline, waitForPendingWrites may timeout - that's OK, write is queued
      if (waitError?.code === "unavailable" || waitError?.message?.includes("offline")) {
        console.log("[leaderboard] Write queued offline, will sync when online");
      } else {
        // Other error, log but don't fail the operation
        console.warn("[leaderboard] Failed to wait for pending writes:", waitError);
      }
    }
  } catch (error: any) {
    // Offline errors are expected and handled by Firestore persistence
    if (error?.code === "unavailable" || error?.message?.includes("offline")) {
      console.log("[leaderboard] Case leaderboard update queued offline, will sync when online");
      // Don't throw - Firestore persistence will handle the sync
      return;
    }
    console.error("[leaderboard] Failed to update case leaderboard:", error);
    throw error;
  }
}

/**
 * Get global leaderboard (top N)
 */
export async function getGlobalLeaderboard(limitCount: number = 100): Promise<LeaderboardEntry[]> {
  const { db } = getFirebaseClient();

  try {
    const ref = collection(db, "leaderboard", "global", "entries");
    const q = query(ref, orderBy("score", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);

    const entries: LeaderboardEntry[] = [];
    snapshot.forEach((doc) => {
      entries.push({ ...doc.data(), rank: entries.length + 1 } as LeaderboardEntry);
    });

    return entries;
  } catch (error) {
    console.error("[leaderboard] Failed to get global leaderboard:", error);
    throw error;
  }
}

/**
 * Get case-specific leaderboard (top N)
 */
export async function getCaseLeaderboard(
  caseId: string,
  limitCount: number = 100
): Promise<LeaderboardEntry[]> {
  const { db } = getFirebaseClient();

  try {
    const ref = collection(db, "leaderboard", caseId, "entries");
    const q = query(ref, orderBy("score", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);

    const entries: LeaderboardEntry[] = [];
    snapshot.forEach((doc) => {
      entries.push({ ...doc.data(), rank: entries.length + 1 } as LeaderboardEntry);
    });

    return entries;
  } catch (error) {
    console.error("[leaderboard] Failed to get case leaderboard:", error);
    throw error;
  }
}

/**
 * Process case completion: update stats and leaderboards
 * This should be called after a case is successfully completed
 */
export async function processCaseCompletion(
  caseId: string,
  difficulty: "easy" | "medium" | "hard",
  durationMs: number,
  penaltyMs: number,
  attempts: number,
  score: number
): Promise<void> {
  const { auth } = getFirebaseClient();

  return new Promise((resolve, reject) => {
    if (auth.currentUser) {
      processWithUser(auth.currentUser, caseId, difficulty, durationMs, penaltyMs, attempts, score)
        .then(resolve)
        .catch(reject);
      return;
    }

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        reject(new Error("[leaderboard] Auth state timeout"));
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      unsubscribe();

      if (!user) {
        reject(new Error("[leaderboard] User not authenticated"));
        return;
      }

      try {
        await processWithUser(user, caseId, difficulty, durationMs, penaltyMs, attempts, score);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function processWithUser(
  user: User,
  caseId: string,
  difficulty: "easy" | "medium" | "hard",
  durationMs: number,
  penaltyMs: number,
  attempts: number,
  score: number
): Promise<void> {
  const { updateUserStats } = await import("./userStats.client");
  
  console.log("[leaderboard] Processing case completion:", {
    caseId,
    score,
    durationMs,
    attempts,
    uid: user.uid,
  });
  
  // CRITICAL: Update user stats only on first attempt (attempts === 1)
  // Subsequent attempts should not affect the detective score (top stats)
  // They are only recorded in case history for viewing
  let stats: UserStats | null = null;
  
  if (attempts === 1) {
    // First attempt: Update stats with this case's score
    console.log("[leaderboard] First attempt - updating user stats with score:", score);
    try {
      await updateUserStats(user.uid, score, durationMs, attempts);
      console.log("[leaderboard] User stats updated successfully (first attempt)");
    } catch (error: any) {
      // Offline errors are expected and handled by Firestore persistence
      if (error?.code === "unavailable" || error?.message?.includes("offline")) {
        console.log("[leaderboard] User stats update queued offline, will sync when online");
        // Continue processing - stats will sync when online
      } else {
        console.error("[leaderboard] Failed to update user stats:", error);
        throw error;
      }
    }

    // Get updated stats for leaderboard (with retry logic and offline handling)
    stats = await getUserStats(user.uid);
    if (!stats) {
      // Retry after a short delay (stats might not be immediately available due to eventual consistency or offline)
      console.log("[leaderboard] Stats not found immediately, retrying...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      stats = await getUserStats(user.uid);
      if (!stats) {
        // Retry one more time with longer delay
        console.warn("[leaderboard] Stats still null after first retry, retrying again...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        stats = await getUserStats(user.uid);
        if (!stats) {
          // If still null after retries, might be offline - use minimal stats for leaderboard
          console.warn("[leaderboard] Failed to get user stats after multiple retries (might be offline)");
          // Create minimal stats object for leaderboard update
          stats = {
            uid: user.uid,
            totalScore: score, // Use current case score as fallback
            solvedCases: 1, // Assume this is first case (will be corrected on next sync)
            averageTimeMs: durationMs,
            totalAttempts: attempts,
            lastUpdated: Date.now(),
          };
          console.log("[leaderboard] Using fallback stats for offline mode:", stats);
        }
      }
    }
  } else {
    // Subsequent attempts: Don't update stats, use existing stats for global leaderboard
    // The stats should already be updated from the first attempt
    console.log("[leaderboard] Subsequent attempt (attempts:", attempts, ") - skipping stats update, using existing stats");
    stats = await getUserStats(user.uid);
    if (!stats) {
      // If stats don't exist, this shouldn't happen (first attempt should have created them)
      // But handle gracefully with fallback
      console.warn("[leaderboard] Stats not found for subsequent attempt, using fallback");
      stats = {
        uid: user.uid,
        totalScore: 0, // Fallback - should have been set on first attempt
        solvedCases: 0,
        averageTimeMs: 0,
        totalAttempts: attempts,
        lastUpdated: Date.now(),
      };
    }
  }
  
  console.log("[leaderboard] Got user stats:", stats);

  // Update global leaderboard (offline-friendly)
  try {
    await updateGlobalLeaderboard(
      user.uid,
      user.displayName || user.email || "Kullanıcı",
      user.photoURL,
      stats.totalScore,
      stats.solvedCases
    );
    console.log("[leaderboard] Global leaderboard updated successfully");
  } catch (error: any) {
    // Offline errors are already handled in updateGlobalLeaderboard
    // Other errors should be logged but not fail the entire process
    if (error?.code === "unavailable" || error?.message?.includes("offline")) {
      console.log("[leaderboard] Global leaderboard update queued offline");
    } else {
      console.error("[leaderboard] Failed to update global leaderboard:", error);
      // Don't throw - case-specific leaderboard can still be updated
    }
  }

  // Update case-specific leaderboard (offline-friendly)
  // NOTE: updateCaseLeaderboard will only update if attempts === 1 (first attempt only)
  try {
    console.log("[leaderboard] Attempting to update case-specific leaderboard:", { caseId, attempts, score });
    await updateCaseLeaderboard(
      user.uid,
      user.displayName || user.email || "Kullanıcı",
      user.photoURL,
      caseId,
      score,
      durationMs,
      attempts
    );
    if (attempts === 1) {
      console.log("[leaderboard] Case-specific leaderboard updated successfully (first attempt)");
    } else {
      console.log("[leaderboard] Case-specific leaderboard update skipped (not first attempt)");
    }
  } catch (error: any) {
    // Offline errors are already handled in updateCaseLeaderboard
    // Other errors should be logged but not fail the entire process
    if (error?.code === "unavailable" || error?.message?.includes("offline")) {
      console.log("[leaderboard] Case leaderboard update queued offline");
    } else {
      console.error("[leaderboard] Failed to update case-specific leaderboard:", error);
      // Don't throw - process can continue (stats and global leaderboard are more important)
    }
  }
  
  console.log("[leaderboard] Case completion processing finished successfully");
}

