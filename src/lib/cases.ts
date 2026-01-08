/**
 * NoirNote — Demo vakalar
 *
 * Vakalar burada tanımlanır. Tüm metinler text key'leri kullanır.
 */

import type { Case } from "@/types/game";
import { case001 } from "./cases/case-001";

export const cases: Case[] = [
  case001,
  {
    id: "case-002",
    titleKey: "cases.case002.title",
    difficulty: "medium",
    briefingKey: "cases.case002.briefing",
    suspects: [
      { id: "suspect-004", nameKey: "suspects.suspect004", iconKey: "suspects.icon004" },
      { id: "suspect-005", nameKey: "suspects.suspect005", iconKey: "suspects.icon005" },
      { id: "suspect-006", nameKey: "suspects.suspect006", iconKey: "suspects.icon006" },
    ],
    locations: [
      { id: "location-004", nameKey: "locations.location004", iconKey: "locations.icon004" },
      { id: "location-005", nameKey: "locations.location005", iconKey: "locations.icon005" },
      { id: "location-006", nameKey: "locations.location006", iconKey: "locations.icon006" },
    ],
    weapons: [
      { id: "weapon-004", nameKey: "weapons.weapon004", iconKey: "weapons.icon004" },
      { id: "weapon-005", nameKey: "weapons.weapon005", iconKey: "weapons.icon005" },
      { id: "weapon-006", nameKey: "weapons.weapon006", iconKey: "weapons.icon006" },
    ],
    clues: [
      "cases.case002.clues.clue1",
      "cases.case002.clues.clue2",
      "cases.case002.clues.clue3",
      "cases.case002.clues.clue4",
      "cases.case002.clues.clue5",
    ],
    solution: {
      suspectId: "suspect-004",
      locationId: "location-005",
      weaponId: "weapon-006",
    },
  },
];

/**
 * ID'ye göre vaka bul
 */
export function getCaseById(caseId: string): Case | undefined {
  return cases.find((c) => c.id === caseId);
}

