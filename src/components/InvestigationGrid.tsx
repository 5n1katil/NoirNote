"use client";

/**
 * NoirNote — Investigation Grid Component
 *
 * 3 küçük grid (Suspect x Location, Suspect x Weapon, Location x Weapon)
 * Her hücre tıklanabilir ve durum döngüsü: EMPTY -> X -> ? -> CHECK -> EMPTY
 * CHECK durumunda, aynı satır ve sütundaki diğer hücreler otomatik olarak X olur (türetilmiş işaretler).
 * Durum localStorage'a kaydedilir.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import type { Case } from "@/types/game";
import type { GridState, GridCellState, CheckedCell } from "@/types/grid";
import { textsTR } from "@/lib/texts.tr";
import { getText } from "@/lib/text-resolver";

type InvestigationGridProps = {
  caseData: Case;
};

type EntityInfoCardProps = {
  name: string;
  icon: string;
  onClose: () => void;
};

function EntityInfoCard({ name, icon, onClose }: EntityInfoCardProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl"
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
          <h3 className="text-xl font-semibold text-white mb-2">{name}</h3>
          <p className="text-sm text-zinc-400">{textsTR.common.about}</p>
        </div>
      </div>
    </div>
  );
}

export default function InvestigationGrid({ caseData }: InvestigationGridProps) {
  const [gridState, setGridState] = useState<GridState>(() => {
    // Initialize with empty grids and no checked cells
    const emptyGrid: GridCellState[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    return {
      manual: {
        SL: emptyGrid,
        SW: emptyGrid,
        LW: emptyGrid,
      },
      checked: {
        SL: null,
        SW: null,
        LW: null,
      },
    };
  });

  const [infoCard, setInfoCard] = useState<{
    name: string;
    icon: string;
  } | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storageKey = `noirnote:grid:${caseData.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Handle migration from old format (backward compatibility)
        if (parsed.SL && !parsed.manual) {
          // Old format: migrate to new format
          setGridState({
            manual: {
              SL: parsed.SL,
              SW: parsed.SW || parsed.manual?.SW || [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
              ],
              LW: parsed.LW || parsed.manual?.LW || [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
              ],
            },
            checked: parsed.checked || {
              SL: null,
              SW: null,
              LW: null,
            },
          });
        } else {
          setGridState(parsed as GridState);
        }
      } catch (e) {
        console.error("Failed to parse grid state from localStorage", e);
      }
    }
  }, [caseData.id]);

  // Save to localStorage whenever gridState changes
  useEffect(() => {
    const storageKey = `noirnote:grid:${caseData.id}`;
    localStorage.setItem(storageKey, JSON.stringify(gridState));
  }, [gridState, caseData.id]);

  // Cycle cell: empty -> X -> ? -> CHECK -> empty
  const cycleCell = useCallback(
    (gridKey: keyof GridState["manual"], row: number, col: number) => {
      setGridState((prev) => {
        const newState = { ...prev };
        const manualGrid = [...newState.manual[gridKey]];
        const rowCopy = [...manualGrid[row]];
        const currentManualMark = rowCopy[col];
        const currentChecked = newState.checked[gridKey];

        // Check if this cell is currently checked
        const isCurrentlyChecked =
          currentChecked?.row === row && currentChecked?.col === col;

        if (isCurrentlyChecked) {
          // If checked, remove check (go to empty)
          newState.checked[gridKey] = null;
          // Manual mark is already 0 (empty) when checked
        } else {
          // Clear any existing check in this matrix first (only one check per matrix)
          newState.checked[gridKey] = null;

          // Cycle manual mark: empty (0) -> X (2) -> ? (1) -> CHECK
          if (currentManualMark === 0) {
            // empty -> X
            rowCopy[col] = 2;
          } else if (currentManualMark === 2) {
            // X -> ?
            rowCopy[col] = 1;
          } else if (currentManualMark === 1) {
            // ? -> CHECK (clear manual mark, set checked)
            rowCopy[col] = 0;
            newState.checked[gridKey] = { row, col };
          }
        }

        manualGrid[row] = rowCopy;
        newState.manual[gridKey] = manualGrid;
        return newState;
      });
    },
    []
  );

  // Compute derived X marks for a given grid
  const getDerivedXSet = useCallback(
    (checked: CheckedCell): Set<string> => {
      const derivedSet = new Set<string>();
      if (checked) {
        // Mark all cells in same row and column as derived X
        for (let i = 0; i < 3; i++) {
          // Same row
          if (i !== checked.col) {
            derivedSet.add(`${checked.row},${i}`);
          }
          // Same column
          if (i !== checked.row) {
            derivedSet.add(`${i},${checked.col}`);
          }
        }
      }
      return derivedSet;
    },
    []
  );

  const renderGrid = (
    gridKey: keyof GridState["manual"],
    rowHeaders: Array<{ id: string; nameKey: string; iconKey: string }>,
    colHeaders: Array<{ id: string; nameKey: string; iconKey: string }>,
    rowLabel: string,
    colLabel: string
  ) => {
    const manualGrid = gridState.manual[gridKey];
    const checked = gridState.checked[gridKey];
    const derivedXSet = useMemo(() => getDerivedXSet(checked), [checked]);

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-zinc-400">{rowLabel}</h3>
          <span className="text-zinc-600">×</span>
          <h3 className="text-sm font-semibold text-zinc-400">{colLabel}</h3>
        </div>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-12 h-12"></th>
                  {colHeaders.map((header, idx) => (
                    <th
                      key={header.id}
                      className="w-16 h-16 p-1 border border-zinc-800"
                    >
                      <button
                        onClick={() => {
                          setInfoCard({
                            name: getText(header.nameKey),
                            icon: getText(header.iconKey),
                          });
                        }}
                        className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-zinc-800 transition-colors rounded"
                        title={getText(header.nameKey)}
                      >
                        <span className="text-xl">{getText(header.iconKey)}</span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowHeaders.map((rowHeader, rowIdx) => (
                  <tr key={rowHeader.id}>
                    <td className="w-16 h-16 p-1 border border-zinc-800">
                      <button
                        onClick={() => {
                          setInfoCard({
                            name: getText(rowHeader.nameKey),
                            icon: getText(rowHeader.iconKey),
                          });
                        }}
                        className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-zinc-800 transition-colors rounded"
                        title={getText(rowHeader.nameKey)}
                      >
                        <span className="text-xl">{getText(rowHeader.iconKey)}</span>
                      </button>
                    </td>
                    {colHeaders.map((_, colIdx) => {
                      const cellKey = `${rowIdx},${colIdx}`;
                      const isChecked =
                        checked?.row === rowIdx && checked?.col === colIdx;
                      const manualMark = manualGrid[rowIdx][colIdx];
                      const isDerivedX = derivedXSet.has(cellKey);

                      // Determine what to display (priority: CHECK > manual mark > derived X > empty)
                      let displayState: "empty" | "question" | "x" | "check" | "derivedX";
                      let bgClass: string;
                      let textClass: string;
                      let displayText: string;

                      if (isChecked) {
                        displayState = "check";
                        bgClass = "bg-green-900/40 hover:bg-green-900/50";
                        textClass = "text-green-400";
                        displayText = textsTR.common.checkmark;
                      } else if (manualMark === 1) {
                        displayState = "question";
                        bgClass = "bg-yellow-900/30 hover:bg-yellow-900/40";
                        textClass = "text-yellow-400";
                        displayText = textsTR.common.questionMark;
                      } else if (manualMark === 2) {
                        displayState = "x";
                        bgClass = "bg-red-900/30 hover:bg-red-900/40";
                        textClass = "text-red-400";
                        displayText = textsTR.common.cross;
                      } else if (isDerivedX) {
                        displayState = "derivedX";
                        bgClass = "bg-red-900/20 hover:bg-red-900/30";
                        textClass = "text-red-500/70";
                        displayText = textsTR.common.cross;
                      } else {
                        displayState = "empty";
                        bgClass = "bg-zinc-900 hover:bg-zinc-800";
                        textClass = "text-zinc-600";
                        displayText = "";
                      }

                      return (
                        <td
                          key={colIdx}
                          className="w-16 h-16 p-1 border border-zinc-800"
                        >
                          <button
                            onClick={() => cycleCell(gridKey, rowIdx, colIdx)}
                            className={`w-full h-full flex items-center justify-center rounded transition-colors ${bgClass} ${textClass}`}
                          >
                            {displayText}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">
          {textsTR.grid.title}
        </h2>

        {/* Suspect x Location Grid */}
        {renderGrid(
          "SL",
          caseData.suspects,
          caseData.locations,
          textsTR.grid.suspects,
          textsTR.grid.locations
        )}

        {/* Suspect x Weapon Grid */}
        {renderGrid(
          "SW",
          caseData.suspects,
          caseData.weapons,
          textsTR.grid.suspects,
          textsTR.grid.weapons
        )}

        {/* Location x Weapon Grid */}
        {renderGrid(
          "LW",
          caseData.locations,
          caseData.weapons,
          textsTR.grid.locations,
          textsTR.grid.weapons
        )}
      </div>

      {/* Info Card Modal */}
      {infoCard && (
        <EntityInfoCard
          name={infoCard.name}
          icon={infoCard.icon}
          onClose={() => setInfoCard(null)}
        />
      )}
    </>
  );
}
