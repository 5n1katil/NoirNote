/**
 * NoirNote — User Stats Firestore Utilities
 *
 * Manages user statistics: users/{uid}/stats
 */

import { doc, getDoc, getDocFromCache, setDoc, serverTimestamp, waitForPendingWrites, collection, query, where, getDocs } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase.client";
import type { CaseResult } from "./caseResult.client";

export type UserStats = {
  uid: string;
  totalScore: number;
  solvedCases: number;
  averageTimeMs: number;
  totalAttempts: number;
  lastUpdated: unknown; // serverTimestamp placeholder
};

/**
 * Get user stats (offline-friendly)
 */
export async function getUserStats(uid: string): Promise<UserStats | null> {
  const { db } = getFirebaseClient();

  try {
    const ref = doc(db, "users", uid, "stats", "main");
    
    // Strategy: Try cache first (offline-friendly), fallback to network
    let snap;
    try {
      // Try cache first (instant if available, works offline)
      snap = await getDocFromCache(ref);
      if (snap.exists()) {
        return snap.data() as UserStats;
      }
    } catch (cacheError: any) {
      // Cache miss or offline, try network if online
      // If error is "client is offline", skip network attempt
      if (cacheError?.code === "unavailable" || cacheError?.message?.includes("offline")) {
        console.warn("[userStats] Offline mode: cache miss for stats");
        return null;
      }
      // Try network (if online)
      snap = await getDoc(ref);
      // With persistence enabled, getDoc automatically uses cache if available
      if (snap.exists()) {
        return snap.data() as UserStats;
      }
    }
    
    return null;
  } catch (error: any) {
    // Offline errors are expected and should return null gracefully
    if (error?.code === "unavailable" || error?.message?.includes("offline")) {
      console.warn("[userStats] Offline mode: cannot load stats from network");
      return null;
    }
    console.error("[userStats] Failed to get user stats:", error);
    throw error;
  }
}

/**
 * Update user stats after case completion
 * CRITICAL: solvedCases counts UNIQUE cases only (each case counted once)
 * Only the first successful attempt for each case is counted
 */
export async function updateUserStats(
  uid: string,
  caseScore: number,
  durationMs: number,
  attempts: number
): Promise<void> {
  const { db } = getFirebaseClient();

  try {
    const ref = doc(db, "users", uid, "stats", "main");
    
    // Strategy: Recalculate stats from all case results to ensure accuracy
    // This ensures solvedCases counts UNIQUE cases only (each case counted once)
    try {
      // Get all successful case results for this user
      const resultsRef = collection(db, "results");
      const resultsQuery = query(
        resultsRef,
        where("uid", "==", uid),
        where("isWin", "==", true)
      );

      let resultsSnapshot;
      try {
        resultsSnapshot = await getDocs(resultsQuery);
      } catch (queryError: any) {
        // If offline or query fails, fall back to increment logic
        if (queryError?.code === "unavailable" || queryError?.message?.includes("offline")) {
          console.warn("[userStats] Offline mode: cannot query results, using increment logic");
          // Fall back to simple increment (will be corrected on next sync)
          const current = await getDocFromCache(ref).catch(() => null);
          if (current?.exists()) {
            const existing = current.data() as UserStats;
            await setDoc(
              ref,
              {
                uid,
                totalScore: existing.totalScore + caseScore,
                solvedCases: existing.solvedCases + 1,
                averageTimeMs: Math.round((existing.averageTimeMs * existing.solvedCases + durationMs) / (existing.solvedCases + 1)),
                totalAttempts: existing.totalAttempts + attempts,
                lastUpdated: serverTimestamp(),
              },
              { merge: true }
            );
          } else {
            await setDoc(
              ref,
              {
                uid,
                totalScore: caseScore,
                solvedCases: 1,
                averageTimeMs: durationMs,
                totalAttempts: attempts,
                lastUpdated: serverTimestamp(),
              },
              { merge: true }
            );
          }
          return;
        }
        throw queryError;
      }

      // Find first successful attempt for each UNIQUE case
      const allResults: CaseResult[] = [];
      resultsSnapshot.forEach((doc) => {
        const data = doc.data() as CaseResult;
        allResults.push(data);
      });

      // Sort by finishedAt to find first attempts
      allResults.sort((a, b) => a.finishedAt - b.finishedAt);

      // Group by caseId and keep only the first successful attempt for each case
      const firstSuccessfulAttempts = new Map<string, CaseResult>();
      for (const result of allResults) {
        const existing = firstSuccessfulAttempts.get(result.caseId);
        if (!existing || result.finishedAt < existing.finishedAt) {
          firstSuccessfulAttempts.set(result.caseId, result);
        }
      }

      // Calculate stats from unique cases (first successful attempt for each case)
      const solvedCases = firstSuccessfulAttempts.size; // UNIQUE cases count
      let totalScore = 0;
      let totalDurationMs = 0;
      let totalAttempts = 0;

      for (const [caseId, result] of firstSuccessfulAttempts.entries()) {
        const score = result.score || 0; // Use stored score or 0 if missing
        totalScore += score;
        totalDurationMs += result.durationMs;
        totalAttempts += result.attempts;
      }

      // Calculate average time from unique cases
      const averageTimeMs = solvedCases > 0 ? Math.round(totalDurationMs / solvedCases) : 0;

      const stats: Omit<UserStats, "lastUpdated"> = {
        uid,
        totalScore,
        solvedCases, // UNIQUE cases count
        averageTimeMs,
        totalAttempts,
      };

      // With Firestore persistence enabled, setDoc will queue writes offline
      await setDoc(
        ref,
        {
          ...stats,
          lastUpdated: serverTimestamp(),
        },
        { merge: false } // Replace existing stats with recalculated values
      );

      console.log("[userStats] Stats recalculated from unique cases:", {
        solvedCases,
        totalScore,
        averageTimeMs,
      });

      // Try to wait for write to complete (works online)
      try {
        await waitForPendingWrites(db);
      } catch (waitError: any) {
        if (waitError?.code === "unavailable" || waitError?.message?.includes("offline")) {
          console.log("[userStats] Write queued offline, will sync when online");
        } else {
          console.warn("[userStats] Failed to wait for pending writes:", waitError);
        }
      }
      return;
    } catch (recalcError: any) {
      // If recalculation fails, log error but don't throw
      // The stats might be incorrect until next sync
      console.error("[userStats] Failed to recalculate stats from results:", recalcError);
      // Don't throw - let it fall through to ensure stats are at least updated
    }

    // Fallback: If recalculation failed, use simple increment logic
    // This is a fallback and stats may be incorrect until next sync
    let current;
    try {
      current = await getDocFromCache(ref);
    } catch (cacheError: any) {
      if (cacheError?.code === "unavailable" || cacheError?.message?.includes("offline")) {
        console.warn("[userStats] Offline mode: cache miss, will create new stats entry");
        current = null as any;
      } else {
        current = await getDoc(ref);
      }
    }

    let stats: Omit<UserStats, "lastUpdated">;

    if (current?.exists()) {
      const existing = current.data() as UserStats;
      // WARNING: This increment logic may count cases multiple times
      // Should be corrected by recalculateStats or next updateUserStats call
      const newSolvedCases = existing.solvedCases + 1;
      const newTotalScore = existing.totalScore + caseScore;
      const newTotalAttempts = existing.totalAttempts + attempts;
      const newAverageTimeMs = Math.round((existing.averageTimeMs * existing.solvedCases + durationMs) / newSolvedCases);

      stats = {
        uid,
        totalScore: newTotalScore,
        solvedCases: newSolvedCases,
        averageTimeMs: newAverageTimeMs,
        totalAttempts: newTotalAttempts,
      };
    } else {
      stats = {
        uid,
        totalScore: caseScore,
        solvedCases: 1,
        averageTimeMs: durationMs,
        totalAttempts: attempts,
      };
    }

    // With Firestore persistence enabled, setDoc will queue writes offline
    // and automatically sync when network is available
    await setDoc(
      ref,
      {
        ...stats,
        lastUpdated: serverTimestamp(),
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
        console.log("[userStats] Write queued offline, will sync when online");
      } else {
        // Other error, log but don't fail the operation
        console.warn("[userStats] Failed to wait for pending writes:", waitError);
      }
    }
  } catch (error: any) {
    // Offline errors are expected and handled by Firestore persistence
    if (error?.code === "unavailable" || error?.message?.includes("offline")) {
      console.log("[userStats] Stats update queued offline, will sync when online");
      // Don't throw - Firestore persistence will handle the sync
      return;
    }
    console.error("[userStats] Failed to update user stats:", error);
    throw error;
  }
}

