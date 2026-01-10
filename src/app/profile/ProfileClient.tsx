"use client";

/**
 * NoirNote — Profile Client Component
 *
 * Displays user statistics and case results
 */

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  doc, 
  getDoc, 
  limit,
  orderBy,
  getDocFromCache,
  getDocsFromCache,
  enableNetwork,
  disableNetwork
} from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase.client";
import { getUserStats, type UserStats } from "@/lib/userStats.client";
import { recalculateUserStats } from "@/lib/recalculateStats.client";
import { getCaseById } from "@/lib/cases";
import { getText } from "@/lib/text-resolver";
import { textsTR } from "@/lib/texts.tr";
import type { CaseResult } from "@/lib/caseResult.client";
import { getUserDoc, updateUserDoc } from "@/lib/userDoc.client";
import { AVATAR_OPTIONS, getAvatarEmoji } from "@/lib/avatars";

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
  // Get user immediately from auth.currentUser (optimistic)
  const { auth } = getFirebaseClient();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [userDoc, setUserDoc] = useState<{ detectiveUsername: string | null; avatar: string | null } | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [caseResults, setCaseResults] = useState<CaseResultWithDetails[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editAvatar, setEditAvatar] = useState<string>(AVATAR_OPTIONS[0].id);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    const { auth, db } = getFirebaseClient();
    
    let unsubscribeStats: (() => void) | null = null;
    let unsubscribeResults: (() => void) | null = null;
    let unsubscribeAuth: (() => void) | null = null;

    // Get user immediately (from auth.currentUser if available)
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setupListeners(currentUser);
    } else {
      // Only wait for auth if not immediately available (should be rare)
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

        if (!user) {
          setStatsLoading(false);
          setResultsLoading(false);
          return;
        }

        // Load user document
        getUserDoc(user.uid)
          .then((doc) => {
            if (doc) {
              setUserDoc({ detectiveUsername: doc.detectiveUsername, avatar: doc.avatar });
              setEditUsername(doc.detectiveUsername || "");
              setEditAvatar(doc.avatar || AVATAR_OPTIONS[0].id);
            }
          })
          .catch((err) => console.error("[ProfileClient] Error loading user doc:", err));

        setupListeners(user);
      });
    }

    async function setupListeners(currentUser: User) {
      try {
        // Strategy: Load data immediately with parallel getDoc/getDocs.
        // With Firestore persistence enabled, these queries automatically use cache
        // if available (instant), otherwise fetch from server.
        // Then setup real-time listeners for updates.
        
        const statsRef = doc(db, "users", currentUser.uid, "stats", "main");
        const resultsRef = collection(db, "results");
        // Show all attempts (both wins and losses) for complete game history
        // Note: orderBy removed to avoid index requirement, we sort client-side instead
        const resultsQuery = query(
          resultsRef,
          where("uid", "==", currentUser.uid),
          limit(100) // Limit to 100 most recent results for faster loading (will be sorted by finishedAt client-side)
        );

        // Helper functions for loading and processing data
        async function loadStats(): Promise<UserStats | null> {
          try {
            // Strategy: Try cache first (offline-friendly), fallback to network
            let statsSnap;
            try {
              // Try cache first (instant if available, works offline)
              statsSnap = await getDocFromCache(statsRef);
              if (statsSnap.exists()) {
                return statsSnap.data() as UserStats;
              }
            } catch (cacheError: any) {
              // Cache miss or offline, try network if online
              // If error is "client is offline", skip network attempt
              if (cacheError?.code === "unavailable" || cacheError?.message?.includes("offline")) {
                console.warn("[ProfileClient] Offline mode: cache miss for stats");
                return null;
              }
              // Try network (if online)
              try {
                statsSnap = await getDoc(statsRef);
                // With persistence enabled, getDoc automatically uses cache if available
                // First load: network (~100-300ms), Subsequent loads: cache (<10ms)
                if (statsSnap.exists()) {
                  return statsSnap.data() as UserStats;
                }
              } catch (networkError: any) {
                // Network error (offline), return null gracefully
                if (networkError?.code === "unavailable" || networkError?.message?.includes("offline")) {
                  console.warn("[ProfileClient] Offline mode: cannot load stats from network");
                  return null;
                }
                throw networkError;
              }
            }
            return null;
          } catch (error) {
            console.error("[ProfileClient] Failed to load stats:", error);
            return null;
          }
        }

        async function loadResults(): Promise<CaseResultWithDetails[]> {
          try {
            // Strategy: Try cache first (offline-friendly), fallback to network
            let resultsSnapshot;
            try {
              // Try cache first (instant if available, works offline)
              resultsSnapshot = await getDocsFromCache(resultsQuery);
              const results: CaseResultWithDetails[] = [];
              resultsSnapshot.forEach((docSnap) => {
                const data = docSnap.data() as CaseResult;
                const caseData = getCaseById(data.caseId);
                results.push({
                  ...data,
                  caseTitle: caseData ? getText(caseData.titleKey) : data.caseId,
                });
              });
              // Sort by finishedAt descending (most recent first)
              results.sort((a, b) => b.finishedAt - a.finishedAt);
              return results;
            } catch (cacheError: any) {
              // Cache miss or offline, try network if online
              // If error is "client is offline", skip network attempt
              if (cacheError?.code === "unavailable" || cacheError?.message?.includes("offline")) {
                console.warn("[ProfileClient] Offline mode: cache miss for results");
                return [];
              }
              // Try network (if online)
              try {
                resultsSnapshot = await getDocs(resultsQuery);
                // With persistence enabled, getDocs automatically uses cache if available
                const results: CaseResultWithDetails[] = [];
                resultsSnapshot.forEach((docSnap) => {
                  const data = docSnap.data() as CaseResult;
                  const caseData = getCaseById(data.caseId);
                  results.push({
                    ...data,
                    caseTitle: caseData ? getText(caseData.titleKey) : data.caseId,
                  });
                });
                // Sort by finishedAt descending (most recent first) - client-side sorting
                results.sort((a, b) => b.finishedAt - a.finishedAt);
                return results;
              } catch (networkError: any) {
                // Network error (offline), return empty array gracefully
                if (networkError?.code === "unavailable" || networkError?.message?.includes("offline")) {
                  console.warn("[ProfileClient] Offline mode: cannot load results from network");
                  return [];
                }
                throw networkError;
              }
            }
          } catch (error) {
            console.error("[ProfileClient] Failed to load results:", error);
            return [];
          }
        }

        // Parallel loading: Both queries execute simultaneously
        // Total time = max(query1, query2) instead of sum(query1 + query2)
        // This is critical for performance - stats and results load at the same time
        const [loadedStats, loadedResults] = await Promise.all([
          loadStats(),
          loadResults()
        ]);

        // Update state with loaded data
        setStats(loadedStats);
        setStatsLoading(false);
        setCaseResults(loadedResults);
        setResultsLoading(false);

        // If stats are missing OR stats show 0 but user has successful results, recalculate stats
        const hasSuccessfulResults = loadedResults.some((r) => r.isWin && r.score !== undefined);
        const needsRecalculation = 
          (!loadedStats || (loadedStats.totalScore === 0 && loadedStats.solvedCases === 0)) && 
          hasSuccessfulResults && 
          !recalculating;
        
        if (needsRecalculation && currentUser) {
          console.log("[ProfileClient] Stats missing or zero but successful results found, recalculating stats...");
          setRecalculating(true);
          recalculateUserStats(currentUser.uid)
            .then((recalculatedStats) => {
              if (recalculatedStats) {
                console.log("[ProfileClient] Stats recalculated successfully:", recalculatedStats);
                setStats(recalculatedStats);
                // Force reload stats from Firestore to ensure leaderboard is updated
                loadStats().then((reloadedStats) => {
                  if (reloadedStats) {
                    setStats(reloadedStats);
                  }
                });
              }
              setRecalculating(false);
            })
            .catch((error) => {
              console.error("[ProfileClient] Failed to recalculate stats:", error);
              setRecalculating(false);
            });
        }

        // Setup real-time listeners for updates (background, non-blocking)
        // These will sync any changes from other tabs/devices in real-time
        // They don't block the initial render since data is already loaded above
        unsubscribeStats = onSnapshot(
          statsRef,
          (snap) => {
            if (snap.exists()) {
              const updatedStats = snap.data() as UserStats;
              setStats(updatedStats);
              
              // If stats show 0 but user has successful results, recalculate
              if (updatedStats.totalScore === 0 && updatedStats.solvedCases === 0 && loadedResults.length > 0) {
                const hasSuccessfulResults = loadedResults.some((r) => r.isWin && r.score !== undefined);
                if (hasSuccessfulResults && !recalculating && currentUser) {
                  console.log("[ProfileClient] Stats updated to 0 but successful results exist, recalculating...");
                  setRecalculating(true);
                  recalculateUserStats(currentUser.uid)
                    .then((recalculatedStats) => {
                      if (recalculatedStats) {
                        console.log("[ProfileClient] Stats recalculated from listener:", recalculatedStats);
                        setStats(recalculatedStats);
                      }
                      setRecalculating(false);
                    })
                    .catch((error) => {
                      console.error("[ProfileClient] Failed to recalculate stats from listener:", error);
                      setRecalculating(false);
                    });
                }
              }
            } else {
              setStats(null);
            }
          },
          (error) => {
            console.error("[ProfileClient] Stats listener error:", error);
          }
        );

        unsubscribeResults = onSnapshot(
          resultsQuery,
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
            // Sort by finishedAt descending (most recent first)
            results.sort((a, b) => b.finishedAt - a.finishedAt);
            setCaseResults(results);
          },
          (error) => {
            console.error("[ProfileClient] Results listener error:", error);
          }
        );
      } catch (error) {
        console.error("[ProfileClient] Failed to setup listeners:", error);
        setStats(null);
        setCaseResults([]);
        setStatsLoading(false);
        setResultsLoading(false);
      }
    }

    // Cleanup function
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeStats) unsubscribeStats();
      if (unsubscribeResults) unsubscribeResults();
    };
  }, []);

  // Show page immediately if user is available (optimistic rendering)
  // Don't wait for stats/results - show them as they load
  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-400">{textsTR.common.loading}</div>
      </div>
    );
  }

  function validateUsername(value: string): string | null {
    if (!value.trim()) {
      return textsTR.profile.usernameRequired;
    }
    if (value.length < 3) {
      return textsTR.profile.usernameMinLength;
    }
    if (value.length > 20) {
      return textsTR.profile.usernameMaxLength;
    }
    if (!/^[a-zA-Z0-9_çğıöşüÇĞIİÖŞÜ]+$/.test(value)) {
      return textsTR.profile.usernameInvalid;
    }
    return null;
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);

    if (!user) {
      setEditError("Kullanıcı oturumu bulunamadı.");
      return;
    }

    const validationError = validateUsername(editUsername);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    setSaving(true);

    try {
      await updateUserDoc(user.uid, {
        detectiveUsername: editUsername.trim(),
        avatar: editAvatar,
      });

      setUserDoc({ detectiveUsername: editUsername.trim(), avatar: editAvatar });
      setIsEditing(false);
      setEditError(null);
    } catch (err: any) {
      console.error("[ProfileClient] Error saving profile:", err);
      setEditError(err?.message || "Profil kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditError(null);
    setEditUsername(userDoc?.detectiveUsername || "");
    setEditAvatar(userDoc?.avatar || AVATAR_OPTIONS[0].id);
  }

  const displayUsername = userDoc?.detectiveUsername || user?.displayName || user?.email || "Kullanıcı";
  const displayAvatar = userDoc?.avatar;

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {displayAvatar ? (
              <div className="w-16 h-16 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center text-3xl">
                {getAvatarEmoji(displayAvatar)}
              </div>
            ) : user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayUsername}
                className="w-16 h-16 rounded-full border-2 border-zinc-700"
              />
            ) : (
              <div className="w-16 h-16 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center text-3xl">
                {displayUsername[0]?.toUpperCase() || "K"}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">{displayUsername}</h2>
              <p className="text-sm text-zinc-400">{user.email}</p>
            </div>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900 transition-all"
            >
              {textsTR.profile.editProfile}
            </button>
          )}
        </div>

        {isEditing && (
          <form onSubmit={handleSaveProfile} className="space-y-6 border-t border-zinc-800 pt-6">
            <div>
              <label htmlFor="edit-username" className="block text-sm font-semibold text-zinc-300 mb-2">
                {textsTR.profile.usernameLabel}
              </label>
              <input
                id="edit-username"
                type="text"
                value={editUsername}
                onChange={(e) => {
                  setEditUsername(e.target.value);
                  setEditError(null);
                }}
                placeholder={textsTR.profile.usernamePlaceholder}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-zinc-700 transition-all"
                maxLength={20}
                disabled={saving}
              />
              <p className="mt-1 text-xs text-zinc-500">{editUsername.length}/20 karakter</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-4">
                {textsTR.profile.avatarLabel}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setEditAvatar(avatar.id)}
                    disabled={saving}
                    className={`aspect-square rounded-lg border-2 transition-all ${
                      editAvatar === avatar.id
                        ? "border-white bg-white/10 scale-110"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={avatar.label}
                  >
                    <span className="text-2xl">{avatar.emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            {editError && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                {editError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !editUsername.trim()}
                className="flex-1 rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-zinc-200 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? textsTR.common.loading : textsTR.profile.saveProfile}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {textsTR.profile.cancelEdit}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-lg shadow-black/20">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          {textsTR.profile.stats}
        </h2>
        {statsLoading ? (
          <div className="text-center py-8 text-zinc-400">
            <div className="inline-block animate-pulse">{textsTR.common.loading}</div>
          </div>
        ) : stats ? (
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
        {resultsLoading ? (
          <div className="text-center py-8 text-zinc-400">
            <div className="inline-block animate-pulse">{textsTR.common.loading}</div>
          </div>
        ) : caseResults.length > 0 ? (
          <div className="space-y-3">
            {caseResults.map((result, index) => (
              <div
                key={`${result.uid}_${result.caseId}_${result.finishedAt}_${index}`}
                className={`rounded-lg border p-4 hover:border-zinc-700 transition-colors ${
                  result.isWin 
                    ? "border-zinc-800 bg-zinc-950/50" 
                    : "border-zinc-800/50 bg-zinc-950/30 opacity-75"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">{textsTR.profile.case}</div>
                    <div className="font-semibold text-white">{result.caseTitle}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Durum</div>
                    <div className={`font-semibold ${result.isWin ? "text-green-400" : "text-red-400"}`}>
                      {result.isWin ? "✓ Başarılı" : "✗ Başarısız"}
                    </div>
                  </div>
                  {result.isWin && result.score !== undefined && (
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">{textsTR.profile.score}</div>
                      <div className="font-semibold text-yellow-400">{result.score.toLocaleString("tr-TR")}</div>
                    </div>
                  )}
                  {!result.isWin && (
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">{textsTR.profile.score}</div>
                      <div className="font-semibold text-zinc-500">-</div>
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

