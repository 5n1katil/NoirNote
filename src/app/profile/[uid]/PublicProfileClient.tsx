"use client";

/**
 * NoirNote — Public Profile Client Component
 *
 * Displays another user's profile (read-only)
 */

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDocFromCache,
  getDocsFromCache,
} from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase.client";
import { getUserStats, type UserStats } from "@/lib/userStats.client";
import { getCaseById } from "@/lib/cases";
import { getText } from "@/lib/text-resolver";
import { textsTR } from "@/lib/texts.tr";
import type { CaseResult } from "@/lib/caseResult.client";
import { getUserDoc, type FirestoreUserDoc } from "@/lib/userDoc.client";
import { getAvatarEmoji } from "@/lib/avatars";

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

type PublicProfileClientProps = {
  targetUid: string;
};

export default function PublicProfileClient({ targetUid }: PublicProfileClientProps) {
  const { auth, db } = getFirebaseClient();
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [targetUserDoc, setTargetUserDoc] = useState<FirestoreUserDoc | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [caseResults, setCaseResults] = useState<CaseResultWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "win" | "loss">("win");

  useEffect(() => {
    let unsubscribeResults: (() => void) | null = null;
    let unsubscribeUserDoc: (() => void) | null = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, (user: User | null) => {
      setCurrentUser(user);
    });

    // Load target user's data
    async function loadTargetUserData() {
      try {
        setLoading(true);
        setError(null);

        // Load user document
        const userDocData = await getUserDoc(targetUid);
        if (!userDocData) {
          setError(textsTR.profile.userNotFound);
          setLoading(false);
          return;
        }
        setTargetUserDoc(userDocData);

        // Load stats
        const userStats = await getUserStats(targetUid);
        setStats(userStats);

        // Load case results
        const resultsRef = collection(db, "results");
        const resultsQuery = query(
          resultsRef,
          where("uid", "==", targetUid)
        );

        try {
          const cacheSnapshot = await getDocsFromCache(resultsQuery);
          const results: CaseResultWithDetails[] = [];
          cacheSnapshot.forEach((docSnap) => {
            const data = docSnap.data() as CaseResult;
            const caseData = getCaseById(data.caseId);
            results.push({
              ...data,
              caseTitle: caseData ? getText(caseData.titleKey) : data.caseId,
            });
          });
          results.sort((a, b) => b.finishedAt - a.finishedAt);
          setCaseResults(results);
        } catch (cacheError: any) {
          // Cache miss, will load from network via listener
        }

        // Setup real-time listener for case results
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
            results.sort((a, b) => b.finishedAt - a.finishedAt);
            setCaseResults(results);
          },
          (error) => {
            console.error("[PublicProfileClient] Results listener error:", error);
          }
        );

        // Setup real-time listener for user document
        const userDocRef = doc(db, "users", targetUid);
        unsubscribeUserDoc = onSnapshot(
          userDocRef,
          (snap) => {
            if (snap.exists()) {
              setTargetUserDoc(snap.data() as FirestoreUserDoc);
            }
          },
          (error) => {
            console.error("[PublicProfileClient] User doc listener error:", error);
          }
        );

        setLoading(false);
      } catch (err: any) {
        console.error("[PublicProfileClient] Error loading user data:", err);
        setError(err?.message || "Kullanıcı verileri yüklenirken bir hata oluştu.");
        setLoading(false);
      }
    }

    loadTargetUserData();

    return () => {
      unsubscribeAuth();
      if (unsubscribeResults) unsubscribeResults();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, [targetUid, auth, db]);

  const filteredResults = caseResults.filter((result) => {
    if (filterType === "all") return true;
    return filterType === "win" ? result.isWin : !result.isWin;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-400">{textsTR.common.loading}</div>
      </div>
    );
  }

  if (error || !targetUserDoc) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-400">{error || textsTR.profile.userNotFound}</div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === targetUid;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Profile Header */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 sm:p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {targetUserDoc.avatar ? (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center text-3xl sm:text-4xl">
                {getAvatarEmoji(targetUserDoc.avatar)}
              </div>
            ) : targetUserDoc.photoURL ? (
              <img
                src={targetUserDoc.photoURL}
                alt={targetUserDoc.detectiveUsername || "User"}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-zinc-700"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white">
                {(targetUserDoc.detectiveUsername?.[0] || targetUserDoc.displayName?.[0] || "K").toUpperCase()}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 break-words">
              {targetUserDoc.detectiveUsername || targetUserDoc.displayName || "Kullanıcı"}
            </h1>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-300 mb-2">{textsTR.profile.bio}</h2>
          {targetUserDoc.bio ? (
            <p className="text-sm sm:text-base text-zinc-300 whitespace-pre-wrap break-words">
              {targetUserDoc.bio}
            </p>
          ) : (
            <p className="text-sm text-zinc-500 italic">{textsTR.profile.bioEmpty}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-zinc-400 mb-1">{textsTR.profile.totalScore}</div>
            <div className="text-lg sm:text-xl font-bold text-yellow-400">
              {stats.totalScore.toLocaleString("tr-TR")}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-zinc-400 mb-1">{textsTR.profile.solvedCases}</div>
            <div className="text-lg sm:text-xl font-bold text-white">{stats.solvedCases}</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-zinc-400 mb-1">{textsTR.profile.averageTime}</div>
            <div className="text-lg sm:text-xl font-bold text-white">
              {stats.averageTimeMs ? formatDuration(stats.averageTimeMs) : "-"}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-zinc-400 mb-1">{textsTR.profile.totalAttempts}</div>
            <div className="text-lg sm:text-xl font-bold text-white">{stats.totalAttempts}</div>
          </div>
        </div>
      )}

      {/* Case Results */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 sm:p-6 shadow-lg shadow-black/20">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            {textsTR.profile.caseResults}
          </h2>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as "all" | "win" | "loss")}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <option value="win">{textsTR.profile.filterWins}</option>
            <option value="all">{textsTR.profile.filterAll}</option>
            <option value="loss">{textsTR.profile.filterLosses}</option>
          </select>
        </div>

        {filteredResults.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">{textsTR.profile.noResults}</div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredResults.map((result, index) => (
              <div
                key={`${result.uid}_${result.caseId}_${result.finishedAt}_${index}`}
                className={`rounded-lg border p-3 sm:p-4 hover:border-zinc-700 transition-colors ${
                  result.isWin 
                    ? "border-zinc-800 bg-zinc-950/50" 
                    : "border-zinc-800/50 bg-zinc-950/30 opacity-75"
                }`}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
                  <div>
                    <div className="text-xs text-zinc-400 mb-1">{textsTR.profile.case}</div>
                    <div className="text-sm font-semibold text-white">{result.caseTitle || result.caseId}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 mb-1">Durum</div>
                    <div className={`text-sm font-semibold ${result.isWin ? "text-green-400" : "text-red-400"}`}>
                      {result.isWin ? "✓ Başarılı" : "✗ Başarısız"}
                    </div>
                  </div>
                  {result.isWin && result.score !== undefined && (
                    <div>
                      <div className="text-xs text-zinc-400 mb-1">{textsTR.profile.score}</div>
                      <div className="text-sm font-semibold text-yellow-400">
                        {result.score.toLocaleString("tr-TR")}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-zinc-400 mb-1">{textsTR.profile.time}</div>
                    <div className="text-sm text-white">{formatDuration(result.durationMs)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 mb-1">{textsTR.profile.attempts}</div>
                    <div className="text-sm text-white">{result.attempts}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 mb-1">{textsTR.profile.completedAt}</div>
                    <div className="text-sm text-white">{formatDate(result.finishedAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
