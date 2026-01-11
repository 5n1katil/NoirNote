/**
 * NoirNote — Case 002: Otel Cinayeti
 *
 * Detailed case content definition for case-002
 */

import type { Case } from "@/types/game";

export const case002: Case = {
  id: "case-002",
  titleKey: "cases.case002.title",
  difficulty: "medium",
  briefingKey: "cases.case002.briefing",
  suspects: [
    {
      id: "suspect-007",
      nameKey: "suspects.suspect007",
      iconKey: "suspects.icon007",
      bioKey: "suspects.bio007",
    },
    {
      id: "suspect-008",
      nameKey: "suspects.suspect008",
      iconKey: "suspects.icon008",
      bioKey: "suspects.bio008",
    },
    {
      id: "suspect-009",
      nameKey: "suspects.suspect009",
      iconKey: "suspects.icon009",
      bioKey: "suspects.bio009",
    },
  ],
  locations: [
    {
      id: "location-007",
      nameKey: "locations.location007",
      iconKey: "locations.icon007",
      descriptionKey: "locations.desc007",
    },
    {
      id: "location-008",
      nameKey: "locations.location008",
      iconKey: "locations.icon008",
      descriptionKey: "locations.desc008",
    },
    {
      id: "location-009",
      nameKey: "locations.location009",
      iconKey: "locations.icon009",
      descriptionKey: "locations.desc009",
    },
  ],
  weapons: [
    {
      id: "weapon-007",
      nameKey: "weapons.weapon007",
      iconKey: "weapons.icon007",
      descriptionKey: "weapons.desc007",
    },
    {
      id: "weapon-008",
      nameKey: "weapons.weapon008",
      iconKey: "weapons.icon008",
      descriptionKey: "weapons.desc008",
    },
    {
      id: "weapon-009",
      nameKey: "weapons.weapon009",
      iconKey: "weapons.icon009",
      descriptionKey: "weapons.desc009",
    },
  ],
  clues: [
    "cases.case002.clues.clue1",
    "cases.case002.clues.clue2",
    "cases.case002.clues.clue3",
    "cases.case002.clues.clue4",
    "cases.case002.clues.clue5",
  ],
  solution: {
    suspectId: "suspect-009", // Selin Vural
    locationId: "location-007", // Kurbanın Odası (504)
    weaponId: "weapon-009", // Zehirli İçecek
  },
};
