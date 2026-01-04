/**
 * NoirNote — Demo vakalar
 *
 * Vakalar burada tanımlanır. Tüm metinler text key'leri kullanır.
 */

import type { Case } from "@/types/game";

export const cases: Case[] = [
  {
    id: "case-001",
    titleKey: "cases.case001.title",
    difficulty: "easy",
    briefingKey: "cases.case001.briefing",
    suspects: [
      { id: "suspect-001", nameKey: "suspects.suspect001", iconKey: "suspects.icon001" },
      { id: "suspect-002", nameKey: "suspects.suspect002", iconKey: "suspects.icon002" },
      { id: "suspect-003", nameKey: "suspects.suspect003", iconKey: "suspects.icon003" },
    ],
    locations: [
      { id: "location-001", nameKey: "locations.location001", iconKey: "locations.icon001" },
      { id: "location-002", nameKey: "locations.location002", iconKey: "locations.icon002" },
      { id: "location-003", nameKey: "locations.location003", iconKey: "locations.icon003" },
    ],
    weapons: [
      { id: "weapon-001", nameKey: "weapons.weapon001", iconKey: "weapons.icon001" },
      { id: "weapon-002", nameKey: "weapons.weapon002", iconKey: "weapons.icon002" },
      { id: "weapon-003", nameKey: "weapons.weapon003", iconKey: "weapons.icon003" },
    ],
    clues: [
      "cases.case001.clues.clue1",
      "cases.case001.clues.clue2",
      "cases.case001.clues.clue3",
      "cases.case001.clues.clue4",
      "cases.case001.clues.clue5",
    ],
    solution: {
      suspectId: "suspect-001",
      locationId: "location-002",
      weaponId: "weapon-003",
    },
  },
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

