"use client";

/**
 * Client wrapper for case page - handles InvestigationGrid and FinalDeduction
 * Firestore-based state management
 */

import { useState, useEffect, useCallback } from "react";
import type { Case } from "@/types/game";
import type { GridState } from "@/types/grid";
import { textsTR } from "@/lib/texts.tr";
import { getText } from "@/lib/text-resolver";
import InvestigationGrid from "@/components/InvestigationGrid";
import ResultModal from "./ResultModal";
import { saveCaseResult } from "@/lib/caseResult.client";
import { getActiveCase, saveActiveCase, initializeActiveCase, type ActiveCase } from "@/lib/activeCase.client";
import { calculateCaseScore } from "@/lib/scoring";
import { processCaseCompletion } from "@/lib/leaderboard.client";

type CaseClientProps = {
  caseData: Case;
};

type ResultState = {
  type: "success" | "failure";
  duration: number;
  attempts: number;
  penaltyMs: number;
} | null;

const PENALTY_MS = 5 * 60 * 1000; // 5 minutes per wrong attempt

function getInitialGridState(): GridState {
  const emptyGrid: GridState["SL"] = [
    ["empty", "empty", "empty"],
    ["empty", "empty", "empty"],
    ["empty", "empty", "empty"],
  ];
  return {
    SL: emptyGrid,
    SW: emptyGrid,
    LW: emptyGrid,
  };
}

export default function CaseClient({ caseData }: CaseClientProps) {
  const [finalSuspect, setFinalSuspect] = useState<string>("");
  const [finalLocation, setFinalLocation] = useState<string>("");
  const [finalWeapon, setFinalWeapon] = useState<string>("");
  
  // Optimistic UI: Start with local state immediately, sync with Firestore in background
  const initialLocalCase: ActiveCase = {
    caseId: caseData.id,
    status: "playing",
    startedAt: Date.now(),
    attempts: 0,
    penaltyMs: 0,
    gridState: getInitialGridState(),
    updatedAt: null,
  };

  const [activeCase, setActiveCase] = useState<ActiveCase>(initialLocalCase);
  const [gridState, setGridState] = useState<GridState>(getInitialGridState());
  const [resultState, setResultState] = useState<ResultState>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const allSelected = finalSuspect && finalLocation && finalWeapon;
  const isModalOpen = resultState !== null;

  // Load active case from Firestore in background (non-blocking)
  useEffect(() => {
    let mounted = true;

    async function syncWithFirestore() {
      try {
        const loaded = await getActiveCase(caseData.id);
        
        if (!mounted) return;

        if (loaded && loaded.status === "playing") {
          // Sync with Firestore data if available
          setActiveCase(loaded);
          setGridState(loaded.gridState);
        } else if (!loaded) {
          // No existing case, initialize in Firestore (background)
          const initialState = getInitialGridState();
          initializeActiveCase(caseData.id, initialState).catch((error) => {
            console.error("[CaseClient] Failed to initialize in Firestore:", error);
          });
        }
      } catch (error) {
        console.error("[CaseClient] Failed to sync with Firestore:", error);
        // Continue with local state, try to initialize later
        const initialState = getInitialGridState();
        initializeActiveCase(caseData.id, initialState).catch((error) => {
          console.error("[CaseClient] Failed to initialize active case:", error);
        });
      }
    }

    // Load in background without blocking UI
    syncWithFirestore();

    return () => {
      mounted = false;
    };
  }, [caseData.id]); // Only on mount

  // Update activeCase.gridState optimistically when gridState changes
  useEffect(() => {
    setActiveCase((prev) => ({ ...prev, gridState }));
  }, [gridState]);

  // Debounced save grid state to Firestore (faster debounce)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        // Get latest activeCase state using ref pattern
        await saveActiveCase({
          caseId: activeCase.caseId,
          status: activeCase.status,
          startedAt: activeCase.startedAt,
          attempts: activeCase.attempts,
          penaltyMs: activeCase.penaltyMs,
          gridState, // Use latest gridState from closure
        });
      } catch (error) {
        console.error("[CaseClient] Failed to save grid state:", error);
      }
    }, 500); // 500ms debounce (faster)

    return () => clearTimeout(timeoutId);
  }, [gridState, activeCase]); // Depend on gridState and activeCase

  // Timer calculation (duration + penalty) - update every second
  const [currentDuration, setCurrentDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDuration((prev) => {
        const newDuration = Math.floor((Date.now() - activeCase.startedAt + activeCase.penaltyMs) / 1000);
        return newDuration;
      });
    }, 1000);

    // Set initial value immediately
    setCurrentDuration(Math.floor((Date.now() - activeCase.startedAt + activeCase.penaltyMs) / 1000));

    return () => clearInterval(interval);
  }, [activeCase.startedAt, activeCase.penaltyMs]);

  // Handle grid state changes from InvestigationGrid
  const handleGridStateChange = useCallback((newState: GridState) => {
    setGridState(newState);
  }, []);

  // Submit handler - non-blocking, show modal immediately
  function onSubmitReport() {
    if (!allSelected || isSubmitting || isModalOpen || !activeCase) return;

    setIsSubmitting(true);

    // Validate solution
    const isCorrect =
      finalSuspect === caseData.solution.suspectId &&
      finalLocation === caseData.solution.locationId &&
      finalWeapon === caseData.solution.weaponId;

    const newAttempts = activeCase.attempts + 1;
    let newPenaltyMs = activeCase.penaltyMs;
    let newStatus: "playing" | "finished" = activeCase.status;
    const durationMs = Date.now() - activeCase.startedAt + activeCase.penaltyMs;

    if (isCorrect) {
      // Correct solution
      newStatus = "finished";
      
      // Calculate score (ensure it's a valid number)
      const calculatedScore = calculateCaseScore(durationMs, newAttempts, caseData.difficulty);
      // Validate score - must be a finite number
      const score = (typeof calculatedScore === 'number' && 
                     !isNaN(calculatedScore) && 
                     isFinite(calculatedScore) && 
                     calculatedScore >= 0) ? calculatedScore : 0;
      
      console.log("[CaseClient] Case completed successfully:", {
        caseId: caseData.id,
        durationMs,
        attempts: newAttempts,
        score,
        difficulty: caseData.difficulty,
      });
      
      const updated = {
        ...activeCase,
        status: newStatus,
        attempts: newAttempts,
        gridState,
      };

      // Update local state immediately (optimistic)
      setActiveCase(updated);

      // Show modal immediately (non-blocking)
      setResultState({
        type: "success",
        duration: Math.floor(durationMs / 1000),
        attempts: newAttempts,
        penaltyMs: activeCase.penaltyMs,
      });

      // Reset submitting state immediately (modal is open, so button will be disabled anyway)
      setIsSubmitting(false);

      // Save to Firestore in background (non-blocking)
      saveActiveCase(updated).catch((error) => {
        console.error("[CaseClient] Failed to save active case:", error);
      });
      saveCaseResult(caseData.id, durationMs, activeCase.penaltyMs, newAttempts, true, score).catch((error) => {
        console.error("[CaseClient] Failed to save result:", error);
      });

      // Process case completion (update stats and leaderboards) - non-blocking
      processCaseCompletion(
        caseData.id,
        caseData.difficulty,
        durationMs,
        activeCase.penaltyMs,
        newAttempts,
        score
      )
        .then(() => {
          console.log("[CaseClient] Case completion processed successfully");
        })
        .catch((error) => {
          console.error("[CaseClient] Failed to process case completion:", error);
          // Don't show error to user, but log it for debugging
        });
    } else {
      // Wrong solution - apply penalty
      newPenaltyMs = activeCase.penaltyMs + PENALTY_MS;
      const wrongDurationMs = Date.now() - activeCase.startedAt + newPenaltyMs;

      const updated = {
        ...activeCase,
        attempts: newAttempts,
        penaltyMs: newPenaltyMs,
        gridState,
      };

      // Update local state immediately (optimistic)
      setActiveCase(updated);

      // Show modal immediately (non-blocking)
      setResultState({
        type: "failure",
        duration: Math.floor(wrongDurationMs / 1000),
        attempts: newAttempts,
        penaltyMs: newPenaltyMs,
      });

      // Reset submitting state immediately (modal is open, so button will be disabled anyway)
      setIsSubmitting(false);

      // Save to Firestore in background (non-blocking)
      saveActiveCase(updated).catch((error) => {
        console.error("[CaseClient] Failed to save active case:", error);
      });
      saveCaseResult(caseData.id, wrongDurationMs, newPenaltyMs, newAttempts, false).catch((error) => {
        console.error("[CaseClient] Failed to save result:", error);
      });
    }
  }

  function closeResultModal() {
    setResultState(null);
    // If incorrect, allow retry
    // If correct, form should remain disabled
  }

  function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes}:${secs.toString().padStart(2, "0")}`;
    }
    return `${secs}sn`;
  }

  // UI is always shown immediately (optimistic rendering)
  return (
    <>
      <div className={`space-y-4 sm:space-y-6 lg:space-y-8 ${isModalOpen ? "pointer-events-none opacity-50" : ""}`}>
        {/* Timer Display */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 sm:px-4 py-1.5 sm:py-2">
              <span className="text-xs text-zinc-400 mr-2">⏱️ Süre:</span>
              <span className="text-xs sm:text-sm font-semibold text-white">{formatDuration(currentDuration)}</span>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 sm:px-4 py-1.5 sm:py-2">
              <span className="text-xs text-zinc-400 mr-2">🎯 Denemeler:</span>
              <span className="text-sm font-semibold text-white">{activeCase.attempts}</span>
            </div>
            {activeCase.penaltyMs > 0 && (
              <div className="rounded-lg border border-red-800/50 bg-red-950/20 px-4 py-2">
                <span className="text-xs text-red-400 mr-2">⚠️ Ceza:</span>
                <span className="text-sm font-semibold text-red-400">
                  +{Math.floor(activeCase.penaltyMs / 1000 / 60)}dk
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Two-column layout: Left (briefing + clues) | Right (grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column: Briefing + Clues */}
          <div className="space-y-4 sm:space-y-6">
            {/* Briefing */}
            <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 sm:p-6 shadow-lg shadow-black/20">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">📄</span>
                {textsTR.cases.briefing}
              </h2>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-5 text-sm text-zinc-300 leading-relaxed">
                {getText(caseData.briefingKey)}
              </div>
            </div>

            {/* Clues */}
            <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 sm:p-6 shadow-lg shadow-black/20">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">🔍</span>
                {textsTR.cases.clues}
              </h2>
              <ul className="space-y-3">
                {caseData.clues.map((clueKey, index) => (
                  <li
                    key={index}
                    className="group rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 sm:p-4 text-xs sm:text-sm text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center text-xs font-bold mt-0.5 group-hover:bg-zinc-700 group-hover:text-white transition-colors">
                        {index + 1}
                      </span>
                      <span className="flex-1">{getText(clueKey)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Investigation Grid */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 sm:p-6 shadow-lg shadow-black/20">
              <InvestigationGrid 
                caseData={caseData} 
                gridState={gridState}
                onGridStateChange={handleGridStateChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Final Deduction Section */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 sm:p-6 shadow-lg shadow-black/20">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
          <span className="text-xl sm:text-2xl">🎯</span>
          {textsTR.grid.finalDeduction}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-4 sm:mb-6">
          {/* Suspect Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <span className="text-lg">👤</span>
              {textsTR.grid.suspects}
            </label>
            <select
              value={finalSuspect}
              onChange={(e) => setFinalSuspect(e.target.value)}
              disabled={isModalOpen || isSubmitting || activeCase.status === "finished"}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-zinc-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- Seçiniz --</option>
              {caseData.suspects.map((suspect) => (
                <option key={suspect.id} value={suspect.id}>
                  {getText(suspect.nameKey)}
                </option>
              ))}
            </select>
          </div>

          {/* Location Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <span className="text-lg">📍</span>
              {textsTR.grid.locations}
            </label>
            <select
              value={finalLocation}
              onChange={(e) => setFinalLocation(e.target.value)}
              disabled={isModalOpen || isSubmitting || activeCase.status === "finished"}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-zinc-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- Seçiniz --</option>
              {caseData.locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {getText(location.nameKey)}
                </option>
              ))}
            </select>
          </div>

          {/* Weapon Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <span className="text-lg">🔪</span>
              {textsTR.grid.weapons}
            </label>
            <select
              value={finalWeapon}
              onChange={(e) => setFinalWeapon(e.target.value)}
              disabled={isModalOpen || isSubmitting || activeCase.status === "finished"}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-zinc-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- Seçiniz --</option>
              {caseData.weapons.map((weapon) => (
                <option key={weapon.id} value={weapon.id}>
                  {getText(weapon.nameKey)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={onSubmitReport}
          disabled={!allSelected || isSubmitting || isModalOpen || activeCase.status === "finished"}
          className={`w-full rounded-lg px-4 sm:px-6 py-3 sm:py-4 font-bold text-sm sm:text-base transition-all duration-200 shadow-lg ${
            allSelected && !isSubmitting && !isModalOpen && activeCase.status !== "finished"
              ? "bg-white text-black hover:bg-zinc-200 hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-black/20"
          }`}
          title={!allSelected ? textsTR.grid.submitDisabledHint : ""}
        >
          {activeCase.status === "finished" ? (
            "Vaka Tamamlandı ✓"
          ) : isSubmitting ? (
            textsTR.common.loading
          ) : allSelected ? (
            <span className="flex items-center justify-center gap-2">
              {textsTR.grid.submitReport}
              <span className="text-xl">✓</span>
            </span>
          ) : (
            textsTR.grid.submitReport
          )}
        </button>
      </div>

      {/* Result Modal */}
      {resultState && (
        <ResultModal
          type={resultState.type}
          duration={resultState.duration}
          attempts={resultState.attempts}
          caseId={caseData.id}
          onClose={closeResultModal}
        />
      )}
    </>
  );
}
