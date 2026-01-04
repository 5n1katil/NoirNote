"use client";

/**
 * Client wrapper for case page - handles InvestigationGrid and FinalDeduction
 */

import { useState } from "react";
import type { Case } from "@/types/game";
import { textsTR } from "@/lib/texts.tr";
import { getText } from "@/lib/text-resolver";
import InvestigationGrid from "@/components/InvestigationGrid";

type CaseClientProps = {
  caseData: Case;
};

export default function CaseClient({ caseData }: CaseClientProps) {
  const [finalSuspect, setFinalSuspect] = useState<string>("");
  const [finalLocation, setFinalLocation] = useState<string>("");
  const [finalWeapon, setFinalWeapon] = useState<string>("");

  const allSelected = finalSuspect && finalLocation && finalWeapon;

  return (
    <div className="space-y-8">
      {/* Two-column layout: Left (briefing + clues) | Right (grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Briefing + Clues */}
        <div className="space-y-6">
          {/* Briefing */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">
              {textsTR.cases.briefing}
            </h2>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300 leading-relaxed">
              {getText(caseData.briefingKey)}
            </div>
          </div>

          {/* Clues */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              {textsTR.cases.clues}
            </h2>
            <ul className="space-y-3">
              {caseData.clues.map((clueKey, index) => (
                <li
                  key={index}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300"
                >
                  {getText(clueKey)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Investigation Grid */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <InvestigationGrid caseData={caseData} />
          </div>
        </div>
      </div>

      {/* Final Deduction Section */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          {textsTR.grid.finalDeduction}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Suspect Dropdown */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              {textsTR.grid.suspects}
            </label>
            <select
              value={finalSuspect}
              onChange={(e) => setFinalSuspect(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="">--</option>
              {caseData.suspects.map((suspect) => (
                <option key={suspect.id} value={suspect.id}>
                  {getText(suspect.nameKey)}
                </option>
              ))}
            </select>
          </div>

          {/* Location Dropdown */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              {textsTR.grid.locations}
            </label>
            <select
              value={finalLocation}
              onChange={(e) => setFinalLocation(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="">--</option>
              {caseData.locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {getText(location.nameKey)}
                </option>
              ))}
            </select>
          </div>

          {/* Weapon Dropdown */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              {textsTR.grid.weapons}
            </label>
            <select
              value={finalWeapon}
              onChange={(e) => setFinalWeapon(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="">--</option>
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
          disabled={!allSelected}
          className={`w-full rounded-lg px-6 py-3 font-semibold transition-colors ${
            allSelected
              ? "bg-white text-black hover:bg-zinc-200"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          }`}
          title={!allSelected ? textsTR.grid.submitDisabledHint : ""}
        >
          {textsTR.grid.submitReport}
        </button>
      </div>
    </div>
  );
}

