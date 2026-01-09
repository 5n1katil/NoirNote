"use client";

/**
 * NoirNote — Leaderboard Client Component
 *
 * Displays global and case-specific leaderboards
 */

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot, getDocs, getDocsFromCache } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase.client";
import { cases } from "@/lib/cases";
import { getText } from "@/lib/text-resolver";
import { textsTR } from "@/lib/texts.tr";
import type { LeaderboardEntry } from "@/lib/leaderboard.client";

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / (1000 * 60));
  const secs = Math.floor((ms % (1000 * 60)) / 1000);
  if (minutes > 0) {
    return `${minutes}dk ${secs}sn`;
  }
  return `${secs}sn`;
}

export default function LeaderboardClient() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>("global");
  const [globalEntries, setGlobalEntries] = useState<LeaderboardEntry[]>([]);
  const [caseEntries, setCaseEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load global leaderboard on mount (cache-first, then real-time)
  useEffect(() => {
    const { db } = getFirebaseClient();
    const ref = collection(db, "leaderboard", "global", "entries");
    const q = query(ref, orderBy("score", "desc"), limit(100));

    // Strategy: Load from cache first (instant), then setup real-time listener
    async function loadInitialData() {
      try {
        // Try cache first (instant if available, works offline)
        try {
          const cacheSnapshot = await getDocsFromCache(q);
          const entries: LeaderboardEntry[] = [];
          let index = 0;
          cacheSnapshot.forEach((doc) => {
            entries.push({ ...doc.data(), rank: index + 1 } as LeaderboardEntry);
            index++;
          });
          setGlobalEntries(entries);
          if (selectedCaseId === "global") {
            setLoading(false);
          }
          console.log("[LeaderboardClient] Global leaderboard loaded from cache:", entries.length, "entries");
        } catch (cacheError: any) {
          // Cache miss or offline, try network if online
          if (cacheError?.code === "unavailable" || cacheError?.message?.includes("offline")) {
            console.warn("[LeaderboardClient] Offline mode: cache miss for global leaderboard");
            // Will load from network when snapshot listener connects
          } else {
            // Try network (if online)
            try {
              const networkSnapshot = await getDocs(q);
              const entries: LeaderboardEntry[] = [];
              let index = 0;
              networkSnapshot.forEach((doc) => {
                entries.push({ ...doc.data(), rank: index + 1 } as LeaderboardEntry);
                index++;
              });
              setGlobalEntries(entries);
              if (selectedCaseId === "global") {
                setLoading(false);
              }
              console.log("[LeaderboardClient] Global leaderboard loaded from network:", entries.length, "entries");
            } catch (networkError: any) {
              // Network error (offline), will load when snapshot listener connects
              if (networkError?.code === "unavailable" || networkError?.message?.includes("offline")) {
                console.warn("[LeaderboardClient] Offline mode: cannot load global leaderboard from network");
              } else {
                console.error("[LeaderboardClient] Failed to load global leaderboard:", networkError);
              }
            }
          }
        }
      } catch (error) {
        console.error("[LeaderboardClient] Failed to load initial global leaderboard:", error);
      }
    }

    loadInitialData();

    // Setup real-time listener for updates (background)
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entries: LeaderboardEntry[] = [];
        let index = 0;
        snapshot.forEach((doc) => {
          entries.push({ ...doc.data(), rank: index + 1 } as LeaderboardEntry);
          index++;
        });
        setGlobalEntries(entries);
        if (selectedCaseId === "global") {
          setLoading(false);
        }
      },
      (error) => {
        console.error("[LeaderboardClient] Global leaderboard listener error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedCaseId]);

  // Load case-specific leaderboard when case changes (cache-first, then real-time)
  useEffect(() => {
    if (selectedCaseId === "global") {
      setCaseEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { db } = getFirebaseClient();
    const ref = collection(db, "leaderboard", selectedCaseId, "entries");
    const q = query(ref, orderBy("score", "desc"), limit(100));

    // Strategy: Load from cache first (instant), then setup real-time listener
    async function loadInitialData() {
      try {
        // Try cache first (instant if available, works offline)
        try {
          const cacheSnapshot = await getDocsFromCache(q);
          const entries: LeaderboardEntry[] = [];
          let index = 0;
          cacheSnapshot.forEach((doc) => {
            entries.push({ ...doc.data(), rank: index + 1 } as LeaderboardEntry);
            index++;
          });
          setCaseEntries(entries);
          setLoading(false);
          console.log("[LeaderboardClient] Case leaderboard loaded from cache:", entries.length, "entries for", selectedCaseId);
        } catch (cacheError: any) {
          // Cache miss or offline, try network if online
          if (cacheError?.code === "unavailable" || cacheError?.message?.includes("offline")) {
            console.warn("[LeaderboardClient] Offline mode: cache miss for case leaderboard:", selectedCaseId);
            // Will load from network when snapshot listener connects
          } else {
            // Try network (if online)
            try {
              const networkSnapshot = await getDocs(q);
              const entries: LeaderboardEntry[] = [];
              let index = 0;
              networkSnapshot.forEach((doc) => {
                entries.push({ ...doc.data(), rank: index + 1 } as LeaderboardEntry);
                index++;
              });
              setCaseEntries(entries);
              setLoading(false);
              console.log("[LeaderboardClient] Case leaderboard loaded from network:", entries.length, "entries for", selectedCaseId);
            } catch (networkError: any) {
              // Network error (offline), will load when snapshot listener connects
              if (networkError?.code === "unavailable" || networkError?.message?.includes("offline")) {
                console.warn("[LeaderboardClient] Offline mode: cannot load case leaderboard from network:", selectedCaseId);
              } else {
                console.error("[LeaderboardClient] Failed to load case leaderboard:", networkError);
              }
            }
          }
        }
      } catch (error) {
        console.error("[LeaderboardClient] Failed to load initial case leaderboard:", error);
      }
    }

    loadInitialData();

    // Setup real-time listener for updates (background)
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entries: LeaderboardEntry[] = [];
        let index = 0;
        snapshot.forEach((doc) => {
          entries.push({ ...doc.data(), rank: index + 1 } as LeaderboardEntry);
          index++;
        });
        setCaseEntries(entries);
        setLoading(false);
      },
      (error) => {
        console.error("[LeaderboardClient] Case leaderboard listener error:", error);
        setCaseEntries([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedCaseId]);

  const currentEntries = selectedCaseId === "global" ? globalEntries : caseEntries;
  const selectedCase = selectedCaseId !== "global" ? cases.find((c) => c.id === selectedCaseId) : null;

  return (
    <div className="space-y-6">
      {/* Case Selector */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-lg shadow-black/20">
        <label className="block text-sm font-semibold text-zinc-300 mb-3">
          {textsTR.leaderboard.selectCase}
        </label>
        <select
          value={selectedCaseId}
          onChange={(e) => setSelectedCaseId(e.target.value)}
          className="w-full md:w-auto rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-zinc-700 transition-all font-medium"
        >
          <option value="global">{textsTR.leaderboard.global}</option>
          {cases.map((caseItem) => (
            <option key={caseItem.id} value={caseItem.id}>
              {getText(caseItem.titleKey)}
            </option>
          ))}
        </select>
      </div>

      {/* Leaderboard */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-lg shadow-black/20">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          {selectedCaseId === "global" 
            ? textsTR.leaderboard.global 
            : `${textsTR.leaderboard.caseSpecific}: ${selectedCase ? getText(selectedCase.titleKey) : ""}`}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-zinc-400">{textsTR.leaderboard.loading}</div>
          </div>
        ) : currentEntries.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            {textsTR.leaderboard.noEntries}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">
                    {textsTR.leaderboard.rank}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">
                    {textsTR.leaderboard.player}
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">
                    {textsTR.leaderboard.score}
                  </th>
                  {selectedCaseId === "global" ? (
                    <th className="text-right py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">
                      {textsTR.leaderboard.cases}
                    </th>
                  ) : (
                    <>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">
                        {textsTR.leaderboard.time}
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-zinc-500 uppercase">
                        {textsTR.leaderboard.attempts}
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentEntries.map((entry, index) => (
                  <tr
                    key={entry.uid}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-zinc-400">#{entry.rank || index + 1}</span>
                        {index < 3 && (
                          <span className="text-2xl">
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {entry.photoURL && (
                          <img
                            src={entry.photoURL}
                            alt={entry.displayName}
                            className="w-8 h-8 rounded-full border border-zinc-700"
                          />
                        )}
                        <span className="font-semibold text-white">{entry.displayName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-yellow-400">
                        {entry.score.toLocaleString("tr-TR")}
                      </span>
                    </td>
                    {selectedCaseId === "global" ? (
                      <td className="py-4 px-4 text-right">
                        <span className="text-white">{entry.solvedCases || 0}</span>
                      </td>
                    ) : (
                      <>
                        <td className="py-4 px-4 text-right">
                          <span className="text-white">
                            {entry.durationMs ? formatDuration(entry.durationMs) : "-"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-white">{entry.attempts || "-"}</span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

