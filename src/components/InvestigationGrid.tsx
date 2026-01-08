"use client";

/**
 * NoirNote — Investigation Grid Component
 *
 * Wrapper component that manages grid state and renders LNotebookGrid.
 * Handles localStorage persistence and entity info cards.
 */

import { useState, useCallback } from "react";
import type { Case } from "@/types/game";
import type { GridState, GridCellState } from "@/types/grid";
import { textsTR } from "@/lib/texts.tr";
import { getText } from "@/lib/text-resolver";
import LNotebookGrid from "./LNotebookGrid";

type InvestigationGridProps = {
  caseData: Case;
  gridState: GridState;
  onGridStateChange: (newState: GridState) => void;
};

type EntityInfoCardProps = {
  name: string;
  icon: string;
  bio?: string;
  onClose: () => void;
};

function EntityInfoCard({ name, icon, bio, onClose }: EntityInfoCardProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors"
        >
          {textsTR.common.close}
        </button>
        <div className="text-center">
          <div className="text-4xl mb-3">{icon}</div>
          <h3 className="text-xl font-semibold text-white mb-3">{name}</h3>
          {bio && (
            <p className="text-sm text-zinc-300 leading-relaxed px-2">{bio}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Next cycle function: empty -> x -> check -> q -> empty
function nextCycle(current: GridCellState): GridCellState {
  switch (current) {
    case "empty":
      return "x";
    case "x":
      return "check";
    case "check":
      return "q";
    case "q":
      return "empty";
    default:
      return "empty";
  }
}

export default function InvestigationGrid({ 
  caseData, 
  gridState, 
  onGridStateChange 
}: InvestigationGridProps) {
  const [infoCard, setInfoCard] = useState<{
    name: string;
    icon: string;
    bio?: string;
  } | null>(null);

  // Handle cell click
  const handleCellClick = useCallback(
    (section: "SW" | "SL" | "LW", row: number, col: number) => {
      const grid = [...gridState[section]];
      const rowCopy = [...grid[row]];
      const currentState = rowCopy[col] as GridCellState;

      // Cycle to next state
      const nextState = nextCycle(currentState);
      rowCopy[col] = nextState;

      grid[row] = rowCopy;
      const newState = { ...gridState, [section]: grid };

      // Notify parent of state change
      onGridStateChange(newState);
    },
    [gridState, onGridStateChange]
  );

  // Handle header click (show info card)
  const handleHeaderClick = useCallback(
    (type: "suspect" | "weapon" | "location", id: string) => {
      let entity;
      let bioKey: string | undefined;

      if (type === "suspect") {
        entity = caseData.suspects.find((s) => s.id === id);
        bioKey = entity?.bioKey;
      } else if (type === "weapon") {
        entity = caseData.weapons.find((w) => w.id === id);
        bioKey = entity?.descriptionKey;
      } else {
        entity = caseData.locations.find((l) => l.id === id);
        bioKey = entity?.descriptionKey;
      }

      if (entity) {
        setInfoCard({
          name: getText(entity.nameKey),
          icon: getText(entity.iconKey),
          bio: bioKey ? getText(bioKey) : undefined,
        });
      }
    },
    [caseData]
  );

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">
          {textsTR.grid.title}
        </h2>

        {/* L-shaped notebook grid */}
        <div className="overflow-x-auto">
          <LNotebookGrid
            suspects={caseData.suspects}
            weapons={caseData.weapons}
            locations={caseData.locations}
            gridState={gridState}
            onCellClick={handleCellClick}
            onHeaderClick={handleHeaderClick}
          />
        </div>
      </div>

      {/* Info Card Modal */}
      {infoCard && (
        <EntityInfoCard
          name={infoCard.name}
          icon={infoCard.icon}
          bio={infoCard.bio}
          onClose={() => setInfoCard(null)}
        />
      )}
    </>
  );
}
