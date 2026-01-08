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
  const [activeCase, setActiveCase] = useState<ActiveCase | null>(null);
  const [gridState, setGridState] = useState<GridState>(getInitialGridState());
  const [resultState, setResultState] = useState<ResultState>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const allSelected = finalSuspect && finalLocation && finalWeapon;
  const isModalOpen = resultState !== null;

  // Load active case from Firestore
  useEffect(() => {
    let mounted = true;

    async function loadActiveCase() {
      try {
        const loaded = await getActiveCase(caseData.id);
        
        if (!mounted) return;

        if (loaded && loaded.status === "playing") {
          setActiveCase(loaded);
          setGridState(loaded.gridState);
        } else {
          // Initialize new active case
          const initialized = await initializeActiveCase(caseData.id, getInitialGridState());
          setActiveCase(initialized);
        }
      } catch (error) {
        console.error("[CaseClient] Failed to load active case:", error);
        // Initialize on error
        try {
          const initialized = await initializeActiveCase(caseData.id, getInitialGridState());
          if (mounted) {
            setActiveCase(initialized);
          }
        } catch (initError) {
          console.error("[CaseClient] Failed to initialize active case:", initError);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadActiveCase();

    return () => {
      mounted = false;
    };
  }, [caseData.id]);

  // Debounced save grid state to Firestore
  useEffect(() => {
    if (!activeCase || isLoading) return;

    const timeoutId = setTimeout(async () => {
      try {
        await saveActiveCase({
          ...activeCase,
          gridState,
        });
      } catch (error) {
        console.error("[CaseClient] Failed to save grid state:", error);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [gridState, activeCase, isLoading]);

  // Timer calculation (duration + penalty)
  const currentDuration = activeCase
    ? Math.floor((Date.now() - activeCase.startedAt + activeCase.penaltyMs) / 1000)
    : 0;

  // Handle grid state changes from InvestigationGrid
  const handleGridStateChange = useCallback((newState: GridState) => {
    setGridState(newState);
  }, []);

  // Submit handler
  async function onSubmitReport() {
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

    if (isCorrect) {
      // Correct solution
      newStatus = "finished";
      const durationMs = Date.now() - activeCase.startedAt + activeCase.penaltyMs;

      // Save result
      saveCaseResult(caseData.id, durationMs, activeCase.penaltyMs, newAttempts, true).catch((error) => {
        console.error("[CaseClient] Failed to save result:", error);
      });

      // Update active case
      await saveActiveCase({
        ...activeCase,
        status: newStatus,
        attempts: newAttempts,
        gridState,
      });

      setResultState({
        type: "success",
        duration: Math.floor(durationMs / 1000),
        attempts: newAttempts,
        penaltyMs: activeCase.penaltyMs,
      });
    } else {
      // Wrong solution - apply penalty
      newPenaltyMs = activeCase.penaltyMs + PENALTY_MS;

      // Update active case with penalty
      const updated = {
        ...activeCase,
        attempts: newAttempts,
        penaltyMs: newPenaltyMs,
        gridState,
      };

      await saveActiveCase(updated);
      setActiveCase(updated);

      // Save result (wrong attempt)
      const durationMs = Date.now() - activeCase.startedAt + newPenaltyMs;
      saveCaseResult(caseData.id, durationMs, newPenaltyMs, newAttempts, false).catch((error) => {
        console.error("[CaseClient] Failed to save result:", error);
      });

      setResultState({
        type: "failure",
        duration: Math.floor(durationMs / 1000),
        attempts: newAttempts,
        penaltyMs: newPenaltyMs,
      });
    }

    setIsSubmitting(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-400">{textsTR.common.loading}</div>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-8 ${isModalOpen ? "pointer-events-none opacity-50" : ""}`}>
        {/* Timer Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-2">
              <span className="text-xs text-zinc-400 mr-2">⏱️ Süre:</span>
              <span className="text-sm font-semibold text-white">{formatDuration(currentDuration)}</span>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-2">
              <span className="text-xs text-zinc-400 mr-2">🎯 Denemeler:</span>
              <span className="text-sm font-semibold text-white">{activeCase?.attempts || 0}</span>
            </div>
            {activeCase && activeCase.penaltyMs > 0 && (
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Briefing + Clues */}
          <div className="space-y-6">
            {/* Briefing */}
            <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-lg shadow-black/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">📄</span>
                {textsTR.cases.briefing}
              </h2>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-5 text-sm text-zinc-300 leading-relaxed">
                {getText(caseData.briefingKey)}
              </div>
            </div>

            {/* Clues */}
            <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-lg shadow-black/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🔍</span>
                {textsTR.cases.clues}
              </h2>
              <ul className="space-y-3">
                {caseData.clues.map((clueKey, index) => (
                  <li
                    key={index}
                    className="group rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all duration-200"
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
            <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-lg shadow-black/20">
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
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-lg shadow-black/20">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          {textsTR.grid.finalDeduction}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {/* Suspect Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <span className="text-lg">👤</span>
              {textsTR.grid.suspects}
            </label>
            <select
              value={finalSuspect}
              onChange={(e) => setFinalSuspect(e.target.value)}
              disabled={isModalOpen || isSubmitting || activeCase?.status === "finished"}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-zinc-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={isModalOpen || isSubmitting || activeCase?.status === "finished"}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-zinc-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={isModalOpen || isSubmitting || activeCase?.status === "finished"}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-zinc-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
          disabled={!allSelected || isSubmitting || isModalOpen || activeCase?.status === "finished"}
          className={`w-full rounded-lg px-6 py-4 font-bold text-base transition-all duration-200 shadow-lg ${
            allSelected && !isSubmitting && !isModalOpen && activeCase?.status !== "finished"
              ? "bg-white text-black hover:bg-zinc-200 hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-black/20"
          }`}
          title={!allSelected ? textsTR.grid.submitDisabledHint : ""}
        >
          {activeCase?.status === "finished" ? (
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
