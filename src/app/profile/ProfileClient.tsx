"use client";

/**
 * NoirNote — Profile Client Component
 *
 * Displays user statistics and case results
 */

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, query, where, getDocs, orderBy, onSnapshot, doc } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase.client";
import { getUserStats, type UserStats } from "@/lib/userStats.client";
import { getCaseById } from "@/lib/cases";
import { getText } from "@/lib/text-resolver";
import { textsTR } from "@/lib/texts.tr";
import type { CaseResult } from "@/lib/caseResult.client";

type CaseResultWithDetails = CaseResult & {
  caseTitle?: string;
};

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / (1000 * 60));
  const secs = Math.floor((ms % (1000 * 60)) / 1000);
  if (minutes > 0) {
    return `${minutes}dk ${secs}sn`;
  }
  return `${secs}sn`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProfileClient() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [caseResults, setCaseResults] = useState<CaseResultWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth, db } = getFirebaseClient();

    let unsubscribeStats: (() => void) | null = null;
    let unsubscribeResults: (() => void) | null = null;
    let unsubscribeAuth: (() => void) | null = null;
    let statsLoaded = false;
    let resultsLoaded = false;

    function checkAndSetLoading() {
      if (statsLoaded && resultsLoaded) {
        setLoading(false);
      }
    }

    function setupListeners(currentUser: User) {
      try {
        // Load user stats (real-time listener)
        const statsRef = doc(db, "users", currentUser.uid, "stats", "main");
        unsubscribeStats = onSnapshot(
          statsRef,
          (snap) => {
            if (snap.exists()) {
              setStats(snap.data() as UserStats);
            } else {
              setStats(null);
            }
            statsLoaded = true;
            checkAndSetLoading();
          },
          (error) => {
            console.error("[ProfileClient] Stats listener error:", error);
            setStats(null);
            statsLoaded = true;
            checkAndSetLoading();
          }
        );

        // Load case results (only wins) - real-time listener
        const resultsRef = collection(db, "results");
        const q = query(
          resultsRef,
          where("uid", "==", currentUser.uid),
          where("isWin", "==", true),
          orderBy("finishedAt", "desc")
        );
        unsubscribeResults = onSnapshot(
          q,
          (snapshot) => {
            const results: CaseResultWithDetails[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as CaseResult;
              const caseData = getCaseById(data.caseId);
              results.push({
                ...data,
                caseTitle: caseData ? getText(caseData.titleKey) : data.caseId,
              });
            });
            setCaseResults(results);
            resultsLoaded = true;
            checkAndSetLoading();
          },
          (error) => {
            console.error("[ProfileClient] Results listener error:", error);
            // Check if it's a missing index error
            if (error.code === "failed-precondition") {
              console.warn("[ProfileClient] Firestore index missing. Attempting query without orderBy...");
              // Retry without orderBy as fallback
              const qFallback = query(
                resultsRef,
                where("uid", "==", currentUser.uid),
                where("isWin", "==", true)
              );
              const unsubscribeFallback = onSnapshot(
                qFallback,
                (snapshot) => {
                  const results: CaseResultWithDetails[] = [];
                  snapshot.forEach((docSnap) => {
                    const data = docSnap.data() as CaseResult;
                    const caseData = getCaseById(data.caseId);
                    results.push({
                      ...data,
                      caseTitle: caseData ? getText(caseData.titleKey) : data.caseId,
                    });
                  });
                  // Sort manually
                  results.sort((a, b) => b.finishedAt - a.finishedAt);
                  setCaseResults(results);
                  resultsLoaded = true;
                  checkAndSetLoading();
                },
                (fallbackError) => {
                  console.error("[ProfileClient] Fallback query also failed:", fallbackError);
                  setCaseResults([]);
                  resultsLoaded = true;
                  checkAndSetLoading();
                }
              );
              unsubscribeResults = unsubscribeFallback;
            } else {
              setCaseResults([]);
              resultsLoaded = true;
              checkAndSetLoading();
            }
          }
        );
      } catch (error) {
        console.error("[ProfileClient] Failed to setup listeners:", error);
        setStats(null);
        setCaseResults([]);
        statsLoaded = true;
        resultsLoaded = true;
        checkAndSetLoading();
      }
    }

    // Check current user immediately (faster path)
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setupListeners(currentUser);
    } else {
      // Wait for auth state if not ready
      unsubscribeAuth = onAuthStateChanged(auth, (user: User | null) => {
        setUser(user);

        // Cleanup previous listeners
        if (unsubscribeStats) {
          unsubscribeStats();
          unsubscribeStats = null;
        }
        if (unsubscribeResults) {
          unsubscribeResults();
          unsubscribeResults = null;
        }
        statsLoaded = false;
        resultsLoaded = false;

        if (!user) {
          setLoading(false);
          return;
        }

        setupListeners(user);
      });
    }

    // Cleanup function
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeStats) unsubscribeStats();
      if (unsubscribeResults) unsubscribeResults();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-400">{textsTR.common.loading}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-zinc-400">Kullanıcı bulunamadı</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-lg shadow-black/20">
        <div className="flex items-center gap-4 mb-6">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName || "Kullanıcı"}
              className="w-16 h-16 rounded-full border-2 border-zinc-700"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">
              {user.displayName || user.email || "Kullanıcı"}
            </h2>
            <p className="text-sm text-zinc-400">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-lg shadow-black/20">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          {textsTR.profile.stats}
        </h2>
        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="text-xs text-zinc-500 mb-1">{textsTR.profile.totalScore}</div>
              <div className="text-2xl font-bold text-white">{stats.totalScore.toLocaleString("tr-TR")}</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="text-xs text-zinc-500 mb-1">{textsTR.profile.solvedCases}</div>
              <div className="text-2xl font-bold text-white">{stats.solvedCases}</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="text-xs text-zinc-500 mb-1">{textsTR.profile.averageTime}</div>
              <div className="text-2xl font-bold text-white">{formatDuration(stats.averageTimeMs)}</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="text-xs text-zinc-500 mb-1">{textsTR.profile.totalAttempts}</div>
              <div className="text-2xl font-bold text-white">{stats.totalAttempts}</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-400">
            {textsTR.profile.noResults}
          </div>
        )}
      </div>

      {/* Case Results */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-lg shadow-black/20">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          {textsTR.profile.caseResults}
        </h2>
        {caseResults.length > 0 ? (
          <div className="space-y-3">
            {caseResults.map((result) => (
              <div
                key={`${result.uid}_${result.caseId}`}
                className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 hover:border-zinc-700 transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">{textsTR.profile.case}</div>
                    <div className="font-semibold text-white">{result.caseTitle}</div>
                  </div>
                  {result.score !== undefined && (
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">{textsTR.profile.score}</div>
                      <div className="font-semibold text-yellow-400">{result.score.toLocaleString("tr-TR")}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">{textsTR.profile.time}</div>
                    <div className="font-semibold text-white">{formatDuration(result.durationMs)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">{textsTR.profile.attempts}</div>
                    <div className="font-semibold text-white">{result.attempts}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">{textsTR.profile.completedAt}</div>
                    <div className="font-semibold text-white text-sm">{formatDate(result.finishedAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-400">
            {textsTR.profile.noResults}
          </div>
        )}
      </div>
    </div>
  );
}

