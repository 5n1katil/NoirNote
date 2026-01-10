/**
 * NoirNote — Recalculate Stats Utility
 *
 * Recalculates user stats from case results for existing users
 * This is useful when stats weren't properly updated in the past
 */

import { collection, query, where, getDocs } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase.client";
import { updateUserStats, getUserStats, type UserStats } from "./userStats.client";
import { updateGlobalLeaderboard } from "./leaderboard.client";
import { updateCaseLeaderboard } from "./leaderboard.client";
import type { CaseResult } from "./caseResult.client";
import { cases } from "./cases";
import { calculateCaseScore } from "./scoring";
import { getUserDoc } from "./userDoc.client";

/**
 * Recalculate user stats from all case results
 * Only counts the first successful attempt for each case
 */
export async function recalculateUserStats(uid: string): Promise<UserStats | null> {
  const { db, auth } = getFirebaseClient();
  
    // Get current user info
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== uid) {
      console.error("[recalculateStats] User not authenticated or uid mismatch");
      return null;
    }

    // Get detectiveUsername and avatar from user document
    let detectiveUsername: string;
    let avatar: string | null;
    try {
      const userDoc = await getUserDoc(uid);
      detectiveUsername = userDoc?.detectiveUsername || currentUser.displayName || currentUser.email || "Kullanıcı";
      avatar = userDoc?.avatar || null;
    } catch (error) {
      console.warn("[recalculateStats] Failed to get user doc, using fallback:", error);
      detectiveUsername = currentUser.displayName || currentUser.email || "Kullanıcı";
      avatar = null;
    }

    try {
      console.log("[recalculateStats] Starting stats recalculation for user:", uid);

    // Get all case results for this user (wins only)
    // Note: orderBy removed to avoid composite index requirement
    // We'll sort client-side instead
    const resultsRef = collection(db, "results");
    const resultsQuery = query(
      resultsRef,
      where("uid", "==", uid),
      where("isWin", "==", true)
    );

    const resultsSnapshot = await getDocs(resultsQuery);
    const allResults: CaseResult[] = [];
    
    resultsSnapshot.forEach((doc) => {
      const data = doc.data() as CaseResult;
      allResults.push(data);
    });

    // Sort by finishedAt ascending (client-side) to find first attempts
    allResults.sort((a, b) => a.finishedAt - b.finishedAt);

    console.log("[recalculateStats] Found", allResults.length, "successful results");

    // Find first successful attempt for each case
    const firstSuccessfulAttempts = new Map<string, CaseResult>();
    
    for (const result of allResults) {
      const existing = firstSuccessfulAttempts.get(result.caseId);
      // Keep the earliest successful attempt for each case
      if (!existing || result.finishedAt < existing.finishedAt) {
        firstSuccessfulAttempts.set(result.caseId, result);
      }
    }

    console.log("[recalculateStats] Found", firstSuccessfulAttempts.size, "unique cases with first successful attempts");

    // Calculate stats from first successful attempts
    let totalScore = 0;
    let totalDurationMs = 0;
    let totalAttempts = 0;
    const solvedCases = firstSuccessfulAttempts.size;

    for (const [caseId, result] of firstSuccessfulAttempts.entries()) {
      // Get case data to determine difficulty
      const caseData = cases.find((c) => c.id === caseId);
      if (!caseData) {
        console.warn("[recalculateStats] Case not found:", caseId);
        continue;
      }

      // Use the score from result if available, otherwise calculate it
      let score = result.score;
      if (!score) {
        // Calculate score if not stored in result
        const durationMinutes = result.durationMs / (1000 * 60);
        score = calculateCaseScore(
          durationMinutes,
          result.attempts,
          caseData.difficulty
        );
      }

      totalScore += score;
      totalDurationMs += result.durationMs;
      totalAttempts += result.attempts;

      // Update case-specific leaderboard with first successful attempt
      try {
        await updateCaseLeaderboard(
          uid,
          detectiveUsername, // Use detectiveUsername
          currentUser.photoURL,
          avatar, // Pass avatar
          caseId,
          score,
          result.durationMs,
          result.attempts
        );
        console.log("[recalculateStats] Updated case leaderboard for:", caseId);
      } catch (error: any) {
        console.error("[recalculateStats] Failed to update case leaderboard for", caseId, ":", error);
        // Continue with other cases even if one fails
      }
    }

    // Calculate average time
    const averageTimeMs = solvedCases > 0 ? Math.round(totalDurationMs / solvedCases) : 0;

    console.log("[recalculateStats] Calculated stats:", {
      totalScore,
      solvedCases,
      averageTimeMs,
      totalAttempts,
    });

    // Update user stats
    if (solvedCases > 0) {
      // We need to set stats directly since updateUserStats adds to existing stats
      const { db } = getFirebaseClient();
      const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
      
      const statsRef = doc(db, "users", uid, "stats", "main");
      const newStats: Omit<UserStats, "lastUpdated"> = {
        uid,
        totalScore,
        solvedCases,
        averageTimeMs,
        totalAttempts,
      };

      await setDoc(
        statsRef,
        {
          ...newStats,
          lastUpdated: serverTimestamp(),
        },
        { merge: false } // Replace existing stats
      );

      console.log("[recalculateStats] Updated user stats");

      // Update global leaderboard with calculated stats
      try {
        console.log("[recalculateStats] Updating global leaderboard with:", {
          uid,
          displayName: detectiveUsername,
          totalScore,
          solvedCases,
          averageTimeMs,
        });
        await updateGlobalLeaderboard(
          uid,
          detectiveUsername, // Use detectiveUsername
          currentUser.photoURL,
          totalScore,
          solvedCases,
          averageTimeMs
        );
        console.log("[recalculateStats] Global leaderboard updated successfully with score:", totalScore, "cases:", solvedCases, "averageTimeMs:", averageTimeMs);
      } catch (error: any) {
        console.error("[recalculateStats] Failed to update global leaderboard:", error);
        // Don't throw - stats are already updated, leaderboard can be updated later
      }

      return {
        ...newStats,
        lastUpdated: Date.now(),
      } as UserStats;
    } else {
      console.log("[recalculateStats] No solved cases found, stats not updated");
      return null;
    }
  } catch (error: any) {
    console.error("[recalculateStats] Failed to recalculate stats:", error);
    throw error;
  }
}
